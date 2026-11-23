#!/usr/bin/env node
/**
 * Static asset-reference checker (queue entries 3 + 4). No dependencies, plain Node.
 *
 * Reads the shapes this repo actually uses, rather than guessing:
 *   src/scenes/boot.ts   - Phaser preload: setPath('assets/'), literal loads, finite lists in
 *                          'a b c'.split(' '), .filter(...).forEach(...) and `for (const x of OPTIONAL.<kind>)`
 *                          loads gated by public/assets/manifest.json, and mon/<id>.png + boss/<id>.png
 *                          derived from public/data/spec/*.json at load time.
 *   src/**\/*.{ts,js}     - any other string literal ending in an asset extension (fonts, ui, fx).
 *
 * A reference is REQUIRED unless the loader itself can skip it (OPTIONAL + manifest listing), so a missing
 * file the game would 404 on is a failure while undelivered optional art is not.
 *
 * Exit 0 = consistent, 1 = missing/case-mismatched/absolute refs. Unused files and unverifiable templates are
 * reported as INFO/WARN, never failures.
 *
 * Usage: node tools/check-assets.mjs [--root DIR]     (npm run check:assets)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REQUIRED_EXT = new Set(['.png', '.ogg', '.ttf', '.mp4', '.wav', '.webm']);
const ALL_EXT = new Set([...REQUIRED_EXT, '.json']);
const TEXT_EXT = new Set(['.ts', '.js', '.mjs']);

const failures = [];
const warnings = [];
const infos = [];

const fail = (msg) => failures.push(msg);
const warn = (msg) => warnings.push(msg);
const info = (msg) => infos.push(msg);

function parseStrings(s) {
  return [...s.matchAll(/'([^']*)'/g)].map((m) => m[1]);
}

/** Blanks comments while keeping line numbers, so a path in prose is not mistaken for a load. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** BootScene's load namespace: the only place asset paths are spelled out. */
function parseBoot(text) {
  const lists = {};
  for (const m of text.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*'([^']*)'\.split\(' '\)/g)) lists[m[1]] = m[2].split(' ');
  for (const m of text.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*([A-Z][A-Z0-9_]*)\.concat\(\[([^\]]*)\]\)/g)) {
    lists[m[1]] = [...(lists[m[2]] || []), ...parseStrings(m[3])];
  }
  for (const m of text.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*\[([^\]]*)\]/g)) lists[m[1]] = parseStrings(m[2]);

  const optional = {};
  const optBlock = /const OPTIONAL:[^=]*=\s*\{([\s\S]*?)\};/.exec(text);
  if (optBlock) for (const m of optBlock[1].matchAll(/(\w+):\s*\[([^\]]*)\]/g)) optional[m[1]] = parseStrings(m[2]);

  const refs = [];
  const add = (tpl, names, source, required) => {
    for (const n of names) {
      const v = String(n);
      if (!v) continue;
      const ref = tpl.split('${').length > 1 ? tpl.replace(/\$\{\w+\}/g, v) : tpl;
      refs.push({ ref, source, required: required(v) });
    }
  };
  const lines = text.split('\n');

  // 1. finite list .forEach: CHARS.filter(...).forEach((c) => L.spritesheet('char_' + c, `chars/${c}.png`))
  for (const m of text.matchAll(/([A-Z][A-Z0-9_]*)\.filter\(([\s\S]{0,160}?)\)\.forEach\(\(\w+\)\s*=>\s*(?:this\.load|L)\.\w+\([^,]+,\s*`([^`]+)`/g)) {
    const kind = /isOpt\('(\w+)'/.exec(m[2])?.[1];
    add(m[3], lists[m[1]] || [], lineOf(lines, m[0]), (n) => !(kind && (optional[kind] || []).includes(n)));
  }
  // 2. inline array .forEach: ['floor', 'ifloor', ...].forEach((n) => L.image('tile_' + n, `tiles/${n}.png`))
  for (const m of text.matchAll(/\[([^\]]*)\]\.forEach\(\(\w+\)\s*=>\s*(?:this\.load|L)\.\w+\([^,]+,\s*`([^`]+)`/g)) {
    add(m[2], parseStrings(m[1]), lineOf(lines, m[0]), () => true);
  }
  // 3. plain list .forEach without a filter
  for (const m of text.matchAll(/([A-Z][A-Z0-9_]*)\.forEach\(\(\w+\)\s*=>\s*(?:this\.load|L)\.\w+\([^,]+,\s*`([^`]+)`/g)) {
    add(m[2], lists[m[1]] || [], lineOf(lines, m[0]), () => true);
  }
  // 4. manifest-gated optionals: for (const c of OPTIONAL.chars) if (m?.chars?.includes(c)) L.spritesheet(..., `chars/${c}.png`)
  for (const m of text.matchAll(/for \(const \w+ of OPTIONAL\.(\w+)\)[\s\S]{0,120}?(?:this\.load|L)\.\w+\([^,]+,\s*`([^`]+)`/g)) {
    const kind = m[1];
    refs.push({ ref: m[2], source: lineOf(lines, m[0]), kind, manifestGated: true, names: optional[kind] || [] });
    optional[kind] = optional[kind] || [];
  }
  // 5. literal loads: L.image('objects', 'objects.png'), L.json('bossmeta', 'boss/meta.json'), ...
  for (const m of text.matchAll(/(?:this\.load|L)\.\w+\(\s*'[^']*'\s*,\s*'([^']+)'/g)) {
    refs.push({ ref: m[1], source: lineOf(lines, m[0]), required: true });
  }
  // 6. templates this parser does not understand must not pass silently
  for (const m of text.matchAll(/(?:this\.load|L)\.\w+\(\s*'[^']*'\s*,\s*`([^`]+)`/g)) {
    if (!/\$\{\w+\}/.test(m[1])) continue;
    if (refs.some((r) => r.source === lineOf(lines, m[0]))) continue;
    warn(`boot.ts: unresolved template path \`${m[1]}\` (${lineOf(lines, m[0])}) - verify by hand`);
  }
  return { refs, optional };
}

function lineOf(lines, snippet) {
  const i = lines.findIndex((l) => l.includes(snippet.split('\n')[0].trim().slice(0, 40)));
  return `src/scenes/boot.ts:${i < 0 ? '?' : i + 1}`;
}

export function run(root = DEFAULT_ROOT) {
  failures.length = warnings.length = infos.length = 0;
  const assets = path.join(root, 'public', 'assets');
  const data = path.join(root, 'public', 'data');
  if (!fs.existsSync(assets)) {
    console.log(`FAIL public/assets/ not found under ${root}`);
    return 1;
  }
  const manifestPath = path.join(assets, 'manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const refs = [];

  // --- boot.ts: literal, list-driven and manifest-gated loads -----------------
  const bootPath = path.join(root, 'src', 'scenes', 'boot.ts');
  if (!fs.existsSync(bootPath)) fail('src/scenes/boot.ts not found - cannot derive preload refs');
  else {
    const { refs: bootRefs } = parseBoot(fs.readFileSync(bootPath, 'utf8'));
    for (const r of bootRefs) {
      if (r.manifestGated) {
        for (const n of r.names) {
          refs.push({ ref: r.ref.replace(/\$\{\w+\}/g, n), source: r.source, required: (manifest[r.kind] || []).includes(n) });
        }
      } else refs.push(r);
    }
  }

  // --- spec-derived: mon/<id>.png and boss/<id>.png are queued at runtime ----
  const specDir = path.join(data, 'spec');
  for (const [file, dir] of [['enemies.json', 'mon'], ['bosses.json', 'boss']]) {
    const p = path.join(specDir, file);
    if (!fs.existsSync(p)) { fail(`public/data/spec/${file} missing - boot.ts loads it and derives ${dir}/ refs`); continue; }
    let spec;
    try { spec = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { fail(`public/data/spec/${file} is not valid JSON (${e.message})`); continue; }
    for (const id of Object.keys(spec)) refs.push({ ref: `${dir}/${id}.png`, source: `spec/${file}`, required: true });
    if (file === 'bosses.json') {
      // phase strips: boot.ts queues them only when manifest.boss lists the file, so the manifest decides
      const listed = new Set(manifest.boss || []);
      const strips = new Map();
      for (const b of Object.values(spec)) for (const s of Object.values(b.sprite?.phaseStrips || {})) strips.set(s, true);
      for (const s of strips.keys()) refs.push({ ref: `boss/${s}.png`, source: 'spec/bosses.json phaseStrips', required: listed.has(s) });
    }
  }

  // --- every other src literal ending in an asset extension ------------------
  const srcDir = path.join(root, 'src');
  if (fs.existsSync(srcDir)) {
    for (const f of walk(srcDir).filter((f) => TEXT_EXT.has(path.extname(f)))) {
      const rel = path.relative(root, f).split(path.sep).join('/');
      if (rel === 'src/scenes/boot.ts') continue;
      const text = stripComments(fs.readFileSync(f, 'utf8'));
      // matches quoted literals and embedded ones such as `url(assets/fonts/PixelifySans.ttf)` in FontFace
      for (const m of text.matchAll(/([\w./-]+\.(?:png|ogg|ttf|mp4|wav|webm))/g)) {
        refs.push({ ref: m[1], source: `${rel}:${text.slice(0, m.index).split('\n').length}`, required: true });
      }
    }
  }

  // --- lazily fetched audio: src/core/audio.ts LAZY (never preloaded, so boot.ts cannot list it)
  const audioPath = path.join(root, 'src', 'core', 'audio.ts');
  if (fs.existsSync(audioPath)) {
    const t = fs.readFileSync(audioPath, 'utf8');
    const m = /const LAZY[^=]*=\s*([^;]+);/.exec(t);   // new Set(['a', 'b']) or 'a b'.split(' ')
    if (m) {
      const names = parseStrings(m[1]);
      for (const n of names) refs.push({ ref: `bgm/${n}.ogg`, source: 'src/core/audio.ts LAZY', required: true });
      info(`src/core/audio.ts LAZY: ${names.length} track(s) fetched on first use, checked as required`);
    } else warn('src/core/audio.ts: LAZY list not found - lazy tracks are unverified');
  }

  // --- resolve ---------------------------------------------------------------
  const seen = new Set();
  const optionalMissing = new Set();
  const dirCache = new Map();
  const listing = (d) => {
    if (!dirCache.has(d)) dirCache.set(d, fs.existsSync(d) ? fs.readdirSync(d) : null);
    return dirCache.get(d);
  };
  let checked = 0;
  for (const r of refs) {
    const raw = r.ref.replace(/^\.\//, '');
    if (raw.startsWith('/')) { fail(`${r.source}: "${raw}" is an absolute path - breaks the /lantern-night/ Pages subpath`); continue; }
    const ref = raw.replace(/^assets\//, '');          // boot.ts setPath('assets/'); main.ts spells it out
    if (!ALL_EXT.has(path.extname(ref))) { warn(`${r.source}: "${ref}" has no known asset extension`); continue; }
    const abs = path.resolve(assets, ref);
    const key = `${abs}|${r.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    checked++;
    const dir = path.dirname(abs);
    const base = path.basename(abs);
    const entries = listing(dir);
    if (entries === null) {
      if (r.required) fail(`${r.source}: ${ref} -> missing (public/assets/${path.relative(assets, dir) || '.'}/ not present)`);
      continue;
    }
    if (entries.includes(base)) continue;
    if (!r.required) { optionalMissing.add(ref); continue; }
    const ci = entries.find((e) => e.toLowerCase() === base.toLowerCase());
    if (ci) fail(`${r.source}: ${ref} -> case mismatch, on disk: ${ci} (GitHub Pages is case-sensitive)`);
    else fail(`${r.source}: ${ref} -> missing file`);
  }

  for (const o of optionalMissing) info(`${o} not delivered (optional; boot.ts skips it unless manifest.json lists it)`);

  // --- unreferenced files ----------------------------------------------------
  const used = new Set([...seen].map((k) => k.split('|')[0]));
  const files = walk(assets);
  // licences and notes ship beside the art they cover and are never loaded
  const unused = files.filter((f) => {
    if (path.resolve(f) === path.resolve(manifestPath)) return false;
    if (['.txt', '.md'].includes(path.extname(f))) return false;
    return !used.has(path.resolve(f));
  });
  const byFolder = new Map();
  for (const f of unused) {
    const folder = path.relative(assets, path.dirname(f)).split(path.sep)[0] || '.';
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder).push(path.basename(f));
  }
  for (const [folder, names] of [...byFolder].sort()) {
    info(`not loaded by boot.ts under public/assets/${folder}: ${names.length} (${names.slice(0, 8).join(', ')}${names.length > 8 ? ', …' : ''})`);
  }

  // --- layouts this repo does not use ---------------------------------------
  const absent = ['data', 'js/plugins.js', 'js/plugins', 'img', 'audio', 'movies', 'fonts']
    .filter((p) => !fs.existsSync(path.join(root, p)));
  if (absent.length) info(`RPG Maker-style roots absent (not failing): ${absent.join(', ')}`);

  // --- report ----------------------------------------------------------------
  const shown = path.relative(process.cwd(), assets);
  console.log(`asset check: ${!shown || shown.startsWith('..') ? assets : shown}`);
  console.log(`  ${checked} reference(s) checked from boot.ts lists, spec-derived mon/boss and src literals`);
  console.log(`  manifest.json gates ${Object.keys(manifest).length} key group(s); ${(manifest.boss || []).length} boss image(s)`);
  for (const w of warnings) console.log(`WARN ${w}`);
  for (const i of infos) console.log(`INFO ${i}`);
  if (failures.length) {
    for (const f of [...new Set(failures)]) console.log(`FAIL ${f}`);
    console.log(`\n${new Set(failures).size} failure(s): asset references do not resolve.`);
    return 1;
  }
  console.log('\nOK: every required asset reference resolves with exact case, none are absolute paths.');
  return 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const i = process.argv.indexOf('--root');
  process.exit(run(i > 0 ? path.resolve(process.argv[i + 1]) : process.cwd()));
}
