#!/usr/bin/env node
/**
 * Fixture test for sort-downloads.mjs.
 *
 *   node tools/asset-sort/sort-downloads.test.mjs
 *
 * Builds a throwaway git repo and a throwaway "Downloads" folder, drops in two
 * good zips and two broken ones, runs the real sorter, and checks that the bad
 * zips are skipped and reported while the good packs are still copied,
 * committed and logged.
 *
 * The zips are embedded as base64 so the test needs no zip writer on the host:
 *   - Zeldisaac_noroot.zip   two files at the archive root plus a folder, so
 *                            there is no single top folder to strip
 *   - KayKit_Adventurers_top.zip  one top folder, which must be stripped
 *   - Broken_Zeldisaac.zip   an HTML error page saved as .zip (no PK signature)
 *   - Corrupt_KayKit.zip     a real PK header followed by garbage (passes the
 *                            signature check, then fails every extractor)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOL = path.join(HERE, 'sort-downloads.mjs');

const NOROOT_B64 = 'UEsDBBQAAAAAAKQdd13rDBqYCwAAAAsAAAAPAAAAdGlsZXMvZ3Jhc3MucG5nZ3Jhc3MtYnl0ZXNQSwMEFAAAAAAApB13XWAdJfsNAAAADQAAABAAAAByb290X3BhbGV0dGUucG5ncGFsZXR0ZS1ieXRlc1BLAwQUAAAAAACkHXddo6TZ3QMAAAADAAAACwAAAExJQ0VOU0UudHh0Y2MwUEsBAhQDFAAAAAAApB13XesMGpgLAAAACwAAAA8AAAAAAAAAAAAAAIABAAAAAHRpbGVzL2dyYXNzLnBuZ1BLAQIUAxQAAAAAAKQdd11gHSX7DQAAAA0AAAAQAAAAAAAAAAAAAACAATgAAAByb290X3BhbGV0dGUucG5nUEsBAhQDFAAAAAAApB13XaOk2d0DAAAAAwAAAAsAAAAAAAAAAAAAAIABcwAAAExJQ0VOU0UudHh0UEsFBgAAAAADAAMAtAAAAJ8AAAAAAA==';
const TOP_B64 = 'UEsDBBQAAAAAAKQdd13Asu+JCQAAAAkAAAAbAAAAQWR2ZW50dXJlcnMvbW9kZWxzL2hlcm8uZ2xiZ2xiLWJ5dGVzUEsDBBQAAAAAAKQdd12jpNndAwAAAAMAAAAWAAAAQWR2ZW50dXJlcnMvTElDRU5TRS5tZGNjMFBLAQIUAxQAAAAAAKQdd13Asu+JCQAAAAkAAAAbAAAAAAAAAAAAAACAAQAAAABBZHZlbnR1cmVycy9tb2RlbHMvaGVyby5nbGJQSwECFAMUAAAAAACkHXddo6TZ3QMAAAADAAAAFgAAAAAAAAAAAAAAgAFCAAAAQWR2ZW50dXJlcnMvTElDRU5TRS5tZFBLBQYAAAAAAgACAI0AAAB5AAAAAAA=';

const passes = [];
const failures = [];
function check(name, fn) {
  try { fn(); passes.push(name); console.log(`PASS ${name}`); }
  catch (err) { failures.push(`${name}: ${err.message}`); console.log(`FAIL ${name}\n     ${err.message}`); }
}
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

function git(cwd, args) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${res.stderr || res.stdout}`);
  return res.stdout;
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-sort-test-'));
const downloads = path.join(work, 'downloads');
const repo = path.join(work, 'repo');

try {
  fs.mkdirSync(downloads);
  fs.mkdirSync(path.join(repo, 'tasks'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'public', 'assets'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ name: 'fixture-repo', private: true, scripts: { build: 'node -e "console.log(\'build-ok\')"' } }, null, 2));
  fs.writeFileSync(path.join(repo, 'tasks', 'freebuff-results.md'), '# results\n');
  git(repo, ['init', '-q', '.']);
  git(repo, ['config', 'user.email', 'fixture@example.invalid']);
  git(repo, ['config', 'user.name', 'fixture']);
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-q', '-m', 'init']);

  fs.writeFileSync(path.join(downloads, 'Zeldisaac_noroot.zip'), Buffer.from(NOROOT_B64, 'base64'));
  fs.writeFileSync(path.join(downloads, 'KayKit_Adventurers_top.zip'), Buffer.from(TOP_B64, 'base64'));
  fs.writeFileSync(path.join(downloads, 'Broken_Zeldisaac.zip'), Buffer.from('<html><body>404 not found</body></html>', 'utf8'));
  fs.writeFileSync(path.join(downloads, 'Corrupt_KayKit.zip'), Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('this is not a zip body, only the first four bytes pretend to be')]));

  const baseArgs = [TOOL, '--src', downloads, '--dest', path.join('public', 'assets'), '--max-category-mb', '10'];

  // 1. Dry run: real sizes per zip and per category, nothing written.
  const dry = spawnSync(process.execPath, baseArgs, { cwd: repo, encoding: 'utf8' });
  const dryOut = `${dry.stdout || ''}${dry.stderr || ''}`;
  check('the dry run exits 0 and writes nothing', () => {
    if (dry.status !== 0) throw new Error(`exit ${dry.status}: ${dryOut.slice(-300)}`);
    for (const c of ['lantern-night-ready', 'other-game', 'future-vault']) {
      if (exists(path.join(repo, 'public', 'assets', c))) throw new Error(`a dry run created public/assets/${c}`);
    }
    if (git(repo, ['status', '--short']).trim()) throw new Error('a dry run left changes in the repo');
  });
  check('the dry run prints a kept size per zip and a total per category', () => {
    if (!/kept/.test(dryOut)) throw new Error('no kept column');
    if (!/Category totals after this run/.test(dryOut)) throw new Error('no category totals block');
    if (!/lantern-night-ready\s+[\d.]+ (B|KB|MB) in the repo \+\s*[\d.]+ (B|KB|MB) from\s+\d+ pack/.test(dryOut)) throw new Error('lantern-night-ready total missing');
    if (!/Every category fits the 1024 MB budget/.test(dryOut)) throw new Error('no budget verdict');
  });

  // 2. A budget too small for the packs stops the run before anything is copied.
  const stop = spawnSync(process.execPath, [...baseArgs, '--apply', '--budget-mb', '0.00001'], { cwd: repo, encoding: 'utf8' });
  const stopOut = `${stop.stdout || ''}${stop.stderr || ''}`;
  check('--apply stops with exit 2 when a category would pass the budget', () => {
    if (stop.status !== 2) throw new Error(`expected exit 2, got ${stop.status}: ${stopOut.slice(-300)}`);
    if (!/STOP: lantern-night-ready would reach/.test(stopOut)) throw new Error('stop message does not name the category');
    for (const c of ['lantern-night-ready', 'other-game', 'future-vault']) {
      if (exists(path.join(repo, 'public', 'assets', c))) throw new Error(`files were copied to public/assets/${c} before the budget check`);
    }
    if (git(repo, ['status', '--short']).trim()) throw new Error('the stopped run left changes in the repo');
    const log = git(repo, ['log', '--oneline']);
    if (log.trim().split('\n').length !== 1) throw new Error(`commits were made anyway:\n${log}`);
  });

  // 3. The same run goes ahead with the override, and everything else still holds.
  const args = [...baseArgs, '--apply', '--budget-mb', '0.00001', '--allow-over-budget'];
  const run = spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8' });
  const out = `${run.stdout || ''}${run.stderr || ''}`;
  console.log(out);
  check('--allow-over-budget lets the run finish and says it is over budget', () => {
    if (run.status !== 0) throw new Error(`exit ${run.status}: ${out.slice(-300)}`);
    if (!/OVER the 0\.00001 MB budget/.test(out)) throw new Error('over-budget category not flagged');
    if (!/continuing because --allow-over-budget/.test(out)) throw new Error('override not explained');
  });

  check('the run exits 0 with two broken zips in the folder', () => {
    if (run.status !== 0) throw new Error(`exit ${run.status}: ${out.split('\n').filter(Boolean).slice(-4).join(' | ')}`);
  });

  check('both broken zips are named in the run summary', () => {
    for (const n of ['Broken_Zeldisaac', 'Corrupt_KayKit']) if (!out.includes(n)) throw new Error(`summary does not mention ${n}`);
    if (!/Survived 2 unreadable pack\(s\)/.test(out)) throw new Error('summary does not count 2 unreadable packs');
  });

  check('each broken zip is reported with a reason, not silently dropped', () => {
    if (!/SKIPPED: not a zip \(no PK signature/.test(out)) throw new Error('no "not a zip" reason');
    if (!/SKIPPED: cannot extract Corrupt_KayKit\.zip/.test(out)) throw new Error('no "cannot extract" reason');
  });

  check('the no-top-folder pack keeps its own layout (nothing invented, nothing wrapped)', () => {
    const base = path.join(repo, 'public', 'assets', 'lantern-night-ready', 'zeldisaac');
    if (!exists(path.join(base, 'tiles', 'grass.png'))) throw new Error('tiles/grass.png missing');
    if (!exists(path.join(base, 'root_palette.png'))) throw new Error('root_palette.png missing - root-level files were lost');
    if (exists(path.join(base, 'Zeldisaac_noroot'))) throw new Error('an extra wrapper folder was created');
    if (exists(path.join(base, 'tiles', 'Zeldisaac_noroot'))) throw new Error('an extra wrapper folder was created');
  });

  check('junk is still stripped from the no-top-folder pack', () => {
    const base = path.join(repo, 'public', 'assets', 'lantern-night-ready', 'zeldisaac');
    if (exists(path.join(base, 'LICENSE.txt'))) throw new Error('LICENSE.txt survived');
  });

  check('the single-top-folder pack has that folder stripped', () => {
    const base = path.join(repo, 'public', 'assets', 'other-game', 'kaykit-adventurers');
    if (!exists(path.join(base, 'models', 'hero.glb'))) throw new Error('models/hero.glb missing');
    if (exists(path.join(base, 'Adventurers'))) throw new Error('top folder "Adventurers" was not stripped');
    if (exists(path.join(base, 'LICENSE.md'))) throw new Error('LICENSE.md survived');
  });

  check('the broken zips contributed no files', () => {
    const walk = (dir, acc = []) => { if (!exists(dir)) return acc; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); e.isDirectory() ? walk(p, acc) : acc.push(p); } return acc; };
    const files = walk(path.join(repo, 'public', 'assets'));
    for (const f of files) if (/Broken|Corrupt/.test(f)) throw new Error(`file from a broken zip: ${f}`);
    if (!files.length) throw new Error('no files were copied at all');
  });

  check('one commit per category still happens for the good packs', () => {
    const log = git(repo, ['log', '--oneline']);
    if (!/Add the lantern-night-ready asset packs/.test(log)) throw new Error('no lantern-night-ready commit');
    if (!/Add the other-game asset packs/.test(log)) throw new Error('no other-game commit');
  });

  check('the working tree is clean after the run (everything committed)', () => {
    const status = git(repo, ['status', '--short']).trim();
    if (status) throw new Error(`uncommitted changes:\n${status}`);
  });

  check('the results log records both broken zips and both sorted packs', () => {
    const log = read(path.join(repo, 'tasks', 'freebuff-results.md'));
    if (!/Broken_Zeldisaac\.zip: bad zip/.test(log)) throw new Error('log does not record the HTML-as-zip download');
    if (!/Corrupt_KayKit\.zip: bad zip/.test(log)) throw new Error('log does not record the corrupt archive');
    if (!/Zeldisaac_noroot\.zip \(Zeldisaac\)/.test(log)) throw new Error('log does not record the sorted no-top-folder pack');
    if (!/KayKit_Adventurers_top\.zip/.test(log)) throw new Error('log does not record the sorted top-folder pack');
    if (!/Skipped, not fatal/.test(log)) throw new Error('log has no skipped section');
  });

  check('--strict turns the same broken zips into exit 1', () => {
    const strict = spawnSync(process.execPath, [...args, '--strict', '--budget-mb', '1024'], { cwd: repo, encoding: 'utf8' });
    if (strict.status !== 1) throw new Error(`expected exit 1, got ${strict.status}`);
  });
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

console.log(`\n${passes.length} passed, ${failures.length} failed`);
if (failures.length) {
  console.error(failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
console.log('ASSET_SORT_FIXTURES ALL PASS');
process.exit(0);
