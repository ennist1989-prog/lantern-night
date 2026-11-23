#!/usr/bin/env node
/**
 * sort-downloads.mjs - sort the asset-pack zips that are sitting in Downloads
 * into the three category folders, strip junk files, commit once per category
 * and check that the build still passes.
 *
 * Run it from the repo root, on the machine that holds the zips:
 *
 *   node tools/asset-sort/sort-downloads.mjs --src "C:\Users\thomas\Downloads"
 *   node tools/asset-sort/sort-downloads.mjs --src "C:\Users\thomas\Downloads" --apply
 *
 * Dry run unless --apply. No dependencies; extraction uses the system `tar`
 * (bsdtar, which reads zips, ships with Windows 10+) with PowerShell
 * Expand-Archive as the fallback. See README.md in this folder.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CATEGORIES = ['lantern-night-ready', 'other-game', 'future-vault'];

// Pack name -> category. These are content calls, not guesses at the pack
// blurb: the current game is 2D Phaser, so 3D character/prop kits do not fit it
// and go to the second concept. Anything named here is still printed in the
// run's table so a wrong call is visible before --apply.
const PACKS = [
  { re: /zeldisaac/i, slug: 'zeldisaac', label: 'Zeldisaac', category: 'lantern-night-ready', why: '2D Zelda-style tilesets, characters and UI' },
  { re: /kabgames|zelda.?style/i, slug: 'kabgames-zelda-style', label: 'KabGames Zelda-Style', category: 'lantern-night-ready', why: '2D Zelda-style tiles and characters' },
  { re: /pixel.?adventure/i, slug: 'pixel-adventure-rpg', label: '16 Pixel Adventure RPG', category: 'lantern-night-ready', why: '2D pixel RPG characters and tiles' },
  { re: /trees?.?mega|mega.?trees/i, slug: 'trees-mega-pack-cc0', label: 'Trees Mega Pack CC0', category: 'lantern-night-ready', why: 'CC0 2D trees and foliage for the tile layers' },
  { re: /super.?pixel.?effects|pixel.?effects/i, slug: 'super-pixel-effects', label: 'Super Pixel Effects Gigapack', category: 'lantern-night-ready', why: '2D pixel FX for the fx/shaders layer' },
  { re: /400.?sounds|sounds?.?pack|sound.?pack/i, slug: 'sounds-pack-400', label: '400 Sounds Pack', category: 'lantern-night-ready', why: 'SE/BGM source material' },
  { re: /gandalf/i, slug: 'gandalfhardcore', label: 'GandalfHardcore packs', category: 'lantern-night-ready', why: '2D pixel RPG characters, enemies, icons' },
  { re: /shikashi/i, slug: 'shikashi-fantasy-icons', label: 'Shikashi Fantasy Icons', category: 'lantern-night-ready', why: 'UI icons' },
  { re: /background/i, slug: 'background-sets', label: 'Background sets', category: 'lantern-night-ready', why: '2D backgrounds', review: 'background sets are the one name here that could also be liminal - check the contents' },
  { re: /kaykit/i, slug: 'kaykit-adventurers', label: 'KayKit Adventurers', category: 'other-game', why: '3D low-poly characters - the RPG renders 2D only' },
  { re: /fantasy.?props/i, slug: 'fantasy-props-megakit', label: 'Fantasy Props MegaKit', category: 'other-game', why: '3D props (KayKit) - for the 3D concept' },
  { re: /liminal|backroom|sci.?fi|scifi|voxel|awareness.?shift/i, category: 'other-game', why: 'name matches the second concept' },
];

// Junk the request names (donate, Facebook, license, preview, readme) plus the
// archive litter that no pack needs. Matched as whole tokens so a real asset
// called "donated_sword.png" is not caught by a substring rule.
const JUNK_TOKEN = /(^|[\s._\-()[\]])(donate|donation|donations|facebook|licen[cs]e|licences|licenses|licensing|readme|read[_-]?me|preview|previews)([\s._\-()[\]]|$)/i;
const JUNK_EXACT = /^(thumbs\.db|desktop\.ini|\.ds_store)$/i;
const JUNK_EXT = /\.(url|lnk)$/i;
const JUNK_DIR = /^(__macosx|\.git)$/i;

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
function flag(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}
const has = (name) => argv.includes(`--${name}`);

const src = path.resolve(String(flag('src', path.join(os.homedir(), 'Downloads'))));
const dest = path.resolve(String(flag('dest', path.join('public', 'assets'))));
const apply = has('apply');
const allZips = has('all-zips');
const buildAfter = !has('no-build');
const moveZips = has('move-zips');
const maxFileMb = Number(flag('max-file-mb', 95));
const maxCategoryMb = Number(flag('max-category-mb', 500));
const strict = has('strict');
const measure = has('measure');
const logPath = path.resolve(String(flag('log', path.join('tasks', 'freebuff-results.md'))));
const keepTemp = has('keep-temp');
if (!Number.isFinite(maxFileMb) || maxFileMb <= 0) { console.error('--max-file-mb must be a positive number'); process.exit(2); }
if (!Number.isFinite(maxCategoryMb) || maxCategoryMb <= 0) { console.error('--max-category-mb must be a positive number'); process.exit(2); }

const overrides = new Map();
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== '--map') continue;
  const pair = String(argv[i + 1] || '');
  const eq = pair.lastIndexOf('=');
  if (eq > 0) overrides.set(pair.slice(0, eq).toLowerCase(), pair.slice(eq + 1));
}

// ------------------------------------------------------------------- helpers
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pack';
const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

function classify(zipName) {
  const base = path.basename(zipName, path.extname(zipName));
  for (const [needle, category] of overrides) {
    if (base.toLowerCase().includes(needle)) {
      if (!CATEGORIES.includes(category)) throw new Error(`--map ${needle}=${category}: category must be one of ${CATEGORIES.join(', ')}`);
      return { matched: true, label: base, slug: slugify(base), category, why: 'category forced with --map', review: false };
    }
  }
  for (const pack of PACKS) {
    if (!pack.re.test(base)) continue;
    return { matched: true, label: pack.label || base, slug: pack.slug || slugify(base), category: pack.category, why: pack.why, review: Boolean(pack.review) };
  }
  return { matched: false, label: base, slug: slugify(base), category: 'future-vault', why: 'not one of the named packs', review: true };
}

function isJunk(relPath) {
  const parts = relPath.split(/[\\/]/);
  for (const part of parts) {
    if (!part) continue;
    if (JUNK_EXACT.test(part) || JUNK_EXT.test(part)) return true;
    if (JUNK_TOKEN.test(part)) return true;
  }
  return false;
}

function walk(dir, root = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!JUNK_DIR.test(entry.name)) walk(full, root, out);
    } else {
      out.push(path.relative(root, full));
    }
  }
  return out;
}

// Most packs ship inside one top-level folder; drop it so the tree starts at
// the pack's own content.
function singleRoot(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  if (entries.length === 1 && entries[0].isDirectory() && !JUNK_DIR.test(entries[0].name)) return path.join(dir, entries[0].name);
  return dir;
}

function run(cmd, cmdArgs) {
  try {
    return { ok: true, out: execFileSync(cmd, cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }) };
  } catch (err) {
    return { ok: false, out: '', err: String(err.message || err) };
  }
}

// Zip extraction with no dependencies: bsdtar (macOS, Windows 10+ `tar.exe`),
// then unzip, then Python's zipfile, then PowerShell. GNU tar cannot read zips,
// which is why the list is not just `tar`.
const PY_LIST = 'import sys,zipfile;print("\\n".join(zipfile.ZipFile(sys.argv[1]).namelist()))';
const PY_EXTRACT = 'import sys,zipfile;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])';
const PS_QUOTE = (p) => `'${p.replace(/'/g, "''")}'`;

function extractors(zip, into) {
  const list = [
    ['tar', ['-xf', zip, '-C', into]],
    ['unzip', ['-q', '-o', zip, '-d', into]],
    ['python3', ['-c', PY_EXTRACT, zip, into]],
    ['python', ['-c', PY_EXTRACT, zip, into]],
  ];
  if (process.platform === 'win32') {
    list.push(['powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath ${PS_QUOTE(zip)} -DestinationPath ${PS_QUOTE(into)} -Force`]]);
  }
  return list;
}

function extract(zip, into) {
  fs.mkdirSync(into, { recursive: true });
  const errors = [];
  for (const [cmd, cmdArgs] of extractors(zip, into)) {
    const res = run(cmd, cmdArgs);
    if (res.ok) return;
    errors.push(`${cmd}: ${res.err.split('\n')[0]}`);
  }
  throw new Error(`cannot extract ${path.basename(zip)}\n    ${errors.join('\n    ')}`);
}

function listZip(zip) {
  const listers = [
    ['tar', ['-tf', zip]],
    ['unzip', ['-Z1', zip]],
    ['python3', ['-c', PY_LIST, zip]],
    ['python', ['-c', PY_LIST, zip]],
  ];
  for (const [cmd, cmdArgs] of listers) {
    const res = run(cmd, cmdArgs);
    if (!res.ok) continue;
    return res.out.split(/\r?\n/).filter(Boolean).filter((e) => !e.endsWith('/'));
  }
  return null;
}

function entriesFor(zip, tempDir, forceExtract = false) {
  if (!forceExtract) {
    const listed = listZip(zip);
    if (listed) return { entries: listed, tempDir: null };
  }
  const into = fs.mkdtempSync(path.join(tempDir, 'x-'));
  extract(zip, into);
  return { entries: walk(into), tempDir: into };
}

// A .zip that is really an HTML error page, a truncated download or a 0-byte
// file fails here instead of halfway through an extraction.
function looksLikeZip(file) {
  try {
    const fd = fs.openSync(file, 'r'); const buf = Buffer.alloc(4); const n = fs.readSync(fd, buf, 0, 4, 0); fs.closeSync(fd);
    if (n < 4) return false;
    return buf[0] === 0x50 && buf[1] === 0x4b && ((buf[2] === 0x03 && buf[3] === 0x04) || (buf[2] === 0x05 && buf[3] === 0x06) || (buf[2] === 0x07 && buf[3] === 0x08));
  } catch { return false; }
}

const firstLine = (s) => String(s || '').split('\n').map((l) => l.trim()).filter(Boolean)[0] || 'unknown error';

/** Keeps a copied file inside the pack's target folder (zip-slip guard). */
function safeJoin(root, rel) {
  const base = path.resolve(root); const out = path.resolve(base, rel);
  return out === base || out.startsWith(base + path.sep) ? out : null;
}

function git(args, { allowFail = false } = {}) {
  const res = spawnSync('git', args, { encoding: 'utf8' });
  if (res.status !== 0 && !allowFail) throw new Error(`git ${args.join(' ')} failed:\n${res.stderr || res.stdout}`);
  return res;
}

// --------------------------------------------------------------------- plan
if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) {
  console.error(`No such folder: ${src}\nPass the folder that holds the zips, e.g. --src "C:\\Users\\thomas\\Downloads"`);
  process.exit(2);
}
if (!fs.existsSync('package.json') || !fs.existsSync('.git')) {
  console.error('Run this from the repo root (package.json and .git must be beside you).');
  process.exit(2);
}
const zips = fs
  .readdirSync(src, { withFileTypes: true })
  .filter((e) => e.isFile() && /\.zip$/i.test(e.name))
  .map((e) => e.name)
  .sort((a, b) => a.localeCompare(b));

if (zips.length === 0) {
  console.error(`No .zip files in ${src}. Nothing to sort.`);
  process.exit(0);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-sort-'));
const plan = [];
console.log(`Source: ${src}`);
console.log(`Target: ${path.join(dest, '<category>', '<pack>')}  (${CATEGORIES.join(' / ')})`);
console.log(`Mode  : ${apply ? 'APPLY (moves files and commits)' : 'dry run (nothing is written; add --apply to do it)'}\n`);

for (const name of zips) {
  const zip = path.join(src, name);
  const packed = classify(name);
  const row = { name, zip, size: 0, ...packed, entries: [], junk: [], keep: [], total: 0, skippedLarge: [], status: 'ok', problem: null, tempDir: null };
  try { row.size = fs.statSync(zip).size; } catch (err) { row.status = 'bad'; row.problem = `unreadable: ${firstLine(err.message)}`; }
  if (row.status === 'ok' && row.size === 0) { row.status = 'bad'; row.problem = 'empty file (0 bytes)'; }
  if (row.status === 'ok' && !looksLikeZip(zip)) { row.status = 'bad'; row.problem = 'not a zip (no PK signature - partial download or an HTML page?)'; }
  if (row.status === 'ok' && row.size < 22) { row.status = 'bad'; row.problem = `truncated zip (${row.size} bytes)`; }
  if (row.status === 'ok' && (packed.matched || allZips)) {
    try {
      const { entries, tempDir } = entriesFor(zip, tempRoot, measure && !apply);
      row.entries = entries; row.tempDir = tempDir;
      const outside = entries.filter((e) => path.isAbsolute(e) || e.split(/[\\/]/).includes('..'));
      if (outside.length) {
        row.status = 'bad';
        row.problem = `${outside.length} entr${outside.length === 1 ? 'y' : 'ies'} point outside the archive (zip-slip), e.g. ${outside[0]}`;
      }
      row.junk = entries.filter(isJunk);
      row.keep = entries.filter((e) => !isJunk(e));
      if (!row.keep.length) { row.status = 'bad'; row.problem = 'archive holds no files after junk stripping'; }
      if (tempDir) row.total = row.keep.reduce((sum, rel) => { const p = path.join(tempDir, rel); try { return sum + fs.statSync(p).size; } catch { return sum; } }, 0);
    } catch (err) {
      row.status = 'bad'; row.problem = firstLine(err.message);
      row.entries = []; row.junk = []; row.keep = [];
    }
  }
  plan.push(row);
}
const badZips = plan.filter((r) => r.status === 'bad');

const display = (r) => r.name.replace(/\.zip$/i, '');
const width = Math.max(...plan.map((r) => display(r).length), 10);
console.log(`Cap   : ${maxCategoryMb} MB per category, ${maxFileMb} MB per file (--max-category-mb / --max-file-mb)\n`);
console.log(`${'zip'.padEnd(width)}  ${'zip size'.padStart(9)}  ${'category'.padEnd(18)}  files  junk  why`);
for (const row of plan) {
  if (row.status === 'bad') {
    console.log(`${display(row).padEnd(width)}  ${mb(row.size).padStart(9)}  ${'(bad zip)'.padEnd(18)}  ${'-'.padStart(5)}  ${'-'.padStart(4)}  SKIPPED: ${row.problem}`);
    continue;
  }
  if (!row.matched && !allZips) {
    console.log(`${display(row).padEnd(width)}  ${mb(row.size).padStart(9)}  ${'(skipped)'.padEnd(18)}  ${'-'.padStart(5)}  ${'-'.padStart(4)}  not one of the named packs; --all-zips would send it to future-vault`);
    continue;
  }
  const unpacked = row.total ? ` (${mb(row.total)} unpacked)` : '';
  console.log(`${display(row).padEnd(width)}  ${mb(row.size).padStart(9)}  ${row.category.padEnd(18)}  ${String(row.keep.length).padStart(5)}  ${String(row.junk.length).padStart(4)}  ${row.label} - ${row.why}${unpacked}`);
  if (row.review) console.log(`${''.padEnd(width)}  ${''.padStart(9)}  ${''.padEnd(18)}  ${''.padStart(5)}  ${''.padStart(4)}  REVIEW: ${row.review === true ? 'unrecognised pack, check by hand' : row.review}`);
}
if (badZips.length) console.log(`\n${badZips.length} bad zip(s) will be skipped, not fatal: ${badZips.map(display).join(', ')}`);
if (!apply && !measure) console.log('Sizes are measured during --apply; add --measure to a dry run to see them first (it extracts to a temp folder).');

const junkSample = plan.flatMap((r) => r.junk.slice(0, 3).map((j) => `${r.label}: ${j}`));
if (junkSample.length) {
  console.log('\nJunk that will be dropped (first few):');
  for (const line of junkSample.slice(0, 12)) console.log(`  ${line}`);
}

if (!apply) {
  console.log('\nDry run only. Re-run with --apply to extract, strip, copy, commit per category and build.');
  console.log('Nothing was written. Zips stay where they are unless --move-zips is passed with --apply.');
  if (!keepTemp) fs.rmSync(tempRoot, { recursive: true, force: true });
  process.exit(0);
}

// -------------------------------------------------------------- extraction
const results = new Map(CATEGORIES.map((c) => [c, { packs: [], files: 0, bytes: 0, skipped: [], capped: [], failed: [], copyErrors: [] }]));
const capBytes = Math.round(maxCategoryMb * 1048576);

// Count what is already in each category folder, so a second run does not spend
// a fresh cap on top of files the first run committed.
for (const category of CATEGORIES) {
  const agg = results.get(category); const dir = path.join(dest, category);
  if (!fs.existsSync(dir)) continue;
  try {
    for (const rel of walk(dir)) {
      const p = path.join(dir, rel);
      try { const st = fs.statSync(p); if (st.isFile()) agg.bytes += st.size; } catch { /* skip */ }
    }
  } catch { /* skip */ }
}

for (const row of plan) {
  if (!row.matched && !allZips) continue;
  const agg = results.get(row.category);
  if (row.status === 'bad') {
    agg.failed.push(`${row.name}: ${row.problem}`);
    console.log(`\n${row.label}: SKIPPED - ${row.problem}`);
    continue;
  }
  let into = row.tempDir;
  try {
    if (!into) { into = fs.mkdtempSync(path.join(tempRoot, 'pack-')); extract(row.zip, into); }
  } catch (err) {
    row.status = 'bad'; row.problem = firstLine(err.message);
    agg.failed.push(`${row.name}: ${row.problem}`);
    console.log(`\n${row.label}: SKIPPED - ${row.problem}`);
    continue;
  }
  const target = path.join(dest, row.category, row.slug);
  let root, entries;
  try { root = singleRoot(into); entries = walk(root); } catch (err) {
    row.status = 'bad'; row.problem = `unreadable after extraction: ${firstLine(err.message)}`;
    agg.failed.push(`${row.name}: ${row.problem}`);
    console.log(`\n${row.label}: SKIPPED - ${row.problem}`);
    continue;
  }
  const junk = entries.filter(isJunk);
  let links = 0, unsafe = 0;
  const files = [];
  for (const rel of entries) {
    if (isJunk(rel)) continue;
    const from = path.join(root, rel);
    let st; try { st = fs.lstatSync(from); } catch { continue; }
    if (st.isSymbolicLink() || !st.isFile()) { links += 1; continue; }
    const to = safeJoin(target, rel);
    if (!to) { unsafe += 1; continue; }
    if (st.size > maxFileMb * 1048576) { row.skippedLarge.push(`${rel} (${mb(st.size)})`); continue; }
    files.push({ from, to, size: st.size });
  }
  const packBytes = files.reduce((n, f) => n + f.size, 0);
  if (!files.length) {
    const why = row.skippedLarge.length ? `every file is over the ${maxFileMb} MB per-file limit` : 'nothing left after junk stripping';
    row.status = 'bad'; row.problem = why; agg.failed.push(`${row.name}: ${why}`);
    console.log(`\n${row.label}: SKIPPED - ${why}`);
    continue;
  }
  // Cap whole packs, never half a pack: a partial pack is harder to notice than a skipped one.
  if (agg.bytes + packBytes > capBytes) {
    const why = `${mb(packBytes)} does not fit ${row.category}: ${mb(agg.bytes)} of ${maxCategoryMb} MB already used`;
    row.status = 'capped'; row.problem = why; agg.capped.push(`${row.name}: ${why}`);
    console.log(`\n${row.label}: SKIPPED - ${why} (whole pack; raise --max-category-mb to include it)`);
    continue;
  }
  let copied = 0, bytes = 0, present = 0;
  for (const f of files) {
    try {
      fs.mkdirSync(path.dirname(f.to), { recursive: true });
      if (fs.existsSync(f.to)) { present += 1; continue; }
      fs.copyFileSync(f.from, f.to);
      copied += 1; bytes += f.size;
    } catch (err) {
      agg.copyErrors.push(`${row.name}/${path.relative(target, f.to)}: ${firstLine(err.message)}`);
    }
  }
  if (copied) {
    agg.packs.push(row.label);
    agg.files += copied;
    agg.bytes += bytes;
    row.status = 'sorted';
  } else {
    row.status = 'present';   // everything was already in the repo: nothing new to commit
  }
  console.log(`\n${display(row)} -> ${path.relative(process.cwd(), target)}`);
  console.log(`  ${copied ? `copied ${copied} file(s), ${mb(bytes)}` : 'no new file(s)'}${present ? `, ${present} already present` : ''} (category now ${mb(agg.bytes)} of ${maxCategoryMb} MB); dropped ${junk.length} junk file(s)`);
  if (links || unsafe) console.log(`  skipped ${links} link(s) and ${unsafe} path(s) pointing outside the pack`);
  if (row.skippedLarge.length) {
    console.log(`  OVER the ${maxFileMb} MB per-file limit, not copied (GitHub rejects files over 100 MB):`);
    for (const name of row.skippedLarge.slice(0, 10)) console.log(`    ${name}`);
    if (row.skippedLarge.length > 10) console.log(`    ... and ${row.skippedLarge.length - 10} more`);
  }
  agg.skipped.push(...row.skippedLarge);
}

for (const [category, agg] of results) {
  if (!agg.files && !agg.failed.length && !agg.capped.length) continue;
  console.log(`\n${category}: ${agg.files} file(s), ${mb(agg.bytes)} of ${maxCategoryMb} MB, ${agg.packs.length} pack(s) committed`);
  if (agg.failed.length) console.log(`  skipped as bad: ${agg.failed.length}`);
  if (agg.capped.length) console.log(`  skipped by the category cap: ${agg.capped.length} (${agg.capped.map((c) => c.split(':')[0]).join(', ')})`);
}

// ----------------------------------------------------------------- commits
const date = new Date().toISOString().slice(0, 10);
const shas = new Map();
for (const category of CATEGORIES) {
  const agg = results.get(category);
  if (agg.files === 0) {
    console.log(`\n${category}: nothing to commit.`);
    continue;
  }
  git(['add', '--', path.join(dest, category)]);
  const staged = git(['diff', '--cached', '--name-only']).stdout.trim();
  if (!staged) {
    console.log(`\n${category}: already committed, no change.`);
    continue;
  }
  const message = [
    `Add the ${category} asset packs from Downloads`,
    '',
    `${agg.packs.join(', ')} - ${agg.files} file(s), ${mb(agg.bytes)}.`,
    'Sorted with tools/asset-sort/sort-downloads.mjs; donate, Facebook, license, preview and readme files stripped.',
  ].join('\n');
  git(['commit', '-m', message, '--', path.join(dest, category)]);
  const sha = git(['rev-parse', '--short', 'HEAD']).stdout.trim();
  shas.set(category, sha);
  console.log(`\n${category}: committed ${sha} (${agg.files} file(s), ${mb(agg.bytes)})`);
}

// ------------------------------------------------------------------- build
let buildStatus = null;
let buildTail = '';
if (buildAfter) {
  console.log('\nVerifying the build (npm run build)...');
  const res = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', shell: process.platform === 'win32' });
  buildStatus = res.status;
  const out = `${res.stdout || ''}${res.stderr || ''}`.trim().split(/\r?\n/);
  buildTail = out.slice(-8).join('\n');
  console.log(buildTail || '(no output)');
  console.log(`build exit: ${buildStatus}${buildStatus === 0 ? '' : '  <- the commits are in place; fix the build before pushing'}`);
}

// --------------------------------------------------------------------- log
if (fs.existsSync(logPath)) {
  const lines = plan
    .filter((r) => r.status === 'sorted' || r.status === 'present')
    .map((r) => {
      const sha = shas.get(r.category);
      const agg = results.get(r.category);
      return `    ${r.name} (${r.label}) - ${r.category}${sha ? ` (commit ${sha})` : ''}: ${r.status === 'present' ? 'already in the repo, nothing new' : `${r.keep.length} file(s) packed`}, ${r.junk.length} junk dropped${r.skippedLarge.length ? `, ${r.skippedLarge.length} over the ${maxFileMb} MB per-file limit` : ''}; category total ${mb(agg.bytes)} of the ${maxCategoryMb} MB cap.`;
    })
    .join('\n');
  const skipped = [
    ...plan.filter((r) => r.status === 'bad').map((r) => `    ${r.name}: bad zip - ${r.problem} (left in ${src}, nothing committed)`),
    ...plan.filter((r) => r.status === 'capped').map((r) => `    ${r.name}: not copied - ${r.problem} (left in ${src})`),
    ...CATEGORIES.flatMap((c) => results.get(c).copyErrors.map((e) => `    copy failed: ${e}`)),
  ].join('\n');
  const entry = [
    '',
    `- date: ${date}`,
    `- task ref: asset sort - Downloads zips into ${CATEGORIES.join(' / ')}`,
    `- status: ${buildStatus === null ? 'done (build not run)' : buildStatus === 0 ? 'done' : 'done, build failing'}`,
    `- result: Sorted the pack zips from ${src} with tools/asset-sort/sort-downloads.mjs into ${dest}/<category>/<pack>/; one commit per category folder.`,
    `  Packs:`,
    lines || '    (none matched)',
    ...(skipped ? [`  Skipped, not fatal (bad zips and the ${maxCategoryMb} MB category cap):`, skipped] : []),
    `  Stripped: donate, Facebook, license, preview and readme files, plus Thumbs.db/.DS_Store/__MACOSX/.url/.lnk. Pack names are recorded here so attribution survives the license files being dropped; check each pack's original terms before shipping.`,
    `  Build: ${buildStatus === null ? 'not run (--no-build)' : `npm run build exited ${buildStatus}`}. Nothing is deployed.`,
    ...(buildTail && buildStatus !== 0 ? [`  Build tail:`, ...buildTail.split('\n').map((l) => `    ${l}`)] : []),
  ].join('\n');
  fs.appendFileSync(logPath, `${entry}\n`);
  git(['add', '--', path.relative(process.cwd(), logPath)]);
  const staged = git(['diff', '--cached', '--name-only']).stdout.trim();
  if (staged) {
    git(['commit', '-m', `Log the Downloads asset sort in ${path.basename(logPath)}`]);
    console.log(`\nLogged in ${path.relative(process.cwd(), logPath)} (commit ${git(['rev-parse', '--short', 'HEAD']).stdout.trim()})`);
  }
} else {
  console.log(`\nNo ${path.relative(process.cwd(), logPath)} on this branch; nothing logged.`);
}

// ------------------------------------------------------------ zip handling
if (moveZips) {
  const done = path.join(src, `_sorted-${date}`);
  fs.mkdirSync(done, { recursive: true });
  const movable = plan.filter((r) => (r.matched || allZips) && r.status !== 'bad');
  for (const row of movable) fs.renameSync(row.zip, path.join(done, row.name));
  console.log(`\nMoved ${movable.length} zip(s) to ${done}${badZips.length ? `; ${badZips.length} bad zip(s) left where they were` : ''}`);
}

if (!keepTemp) fs.rmSync(tempRoot, { recursive: true, force: true });

const totalFiles = CATEGORIES.reduce((sum, c) => sum + results.get(c).files, 0);
const totalBytes = CATEGORIES.reduce((sum, c) => sum + results.get(c).bytes, 0);
const cappedAll = CATEGORIES.flatMap((c) => results.get(c).capped);
const failedAll = CATEGORIES.flatMap((c) => results.get(c).failed);
const copyErrorsAll = CATEGORIES.flatMap((c) => results.get(c).copyErrors);
console.log(`\nDone: ${totalFiles} new file(s) in ${[...shas.keys()].length} category commit(s); categories now hold ${mb(totalBytes)}.`);
const failedNames = [...new Set([...badZips.map((r) => r.name), ...failedAll.map((f) => f.split(':')[0])])];
if (failedNames.length) console.log(`Survived ${failedNames.length} unreadable pack(s), nothing copied from them: ${failedNames.map((n) => n.replace(/\.zip$/i, '')).join(', ')}`);
if (cappedAll.length) console.log(`Left ${cappedAll.length} pack(s) out because of the ${maxCategoryMb} MB cap: ${cappedAll.map((c) => c.split(':')[0]).join(', ')}`);
if (plan.some((r) => r.status === 'present')) console.log(`${plan.filter((r) => r.status === 'present').length} pack(s) were already in the repo; nothing new committed for them.`);
if (copyErrorsAll.length) console.log(`${copyErrorsAll.length} file(s) could not be copied; the log entry lists them.`);
if (buildStatus !== null && buildStatus !== 0) {
  console.error('The build failed after sorting - do not push until `npm run build` exits 0.');
  process.exit(1);
}
if (strict && (badZips.length || failedAll.length || cappedAll.length || copyErrorsAll.length)) {
  console.error('--strict: a bad zip or a cap skip happened, exiting 1.');
  process.exit(1);
}
process.exit(0);
