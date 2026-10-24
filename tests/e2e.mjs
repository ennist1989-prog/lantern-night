// One-command browser e2e runner: builds the game WITHOUT a Sentry DSN, serves it with `vite preview`
// on 127.0.0.1:$PORT (default 8099), runs each test script sequentially, prints a PASS/FAIL table and
// exits non-zero if any test failed.
//   node tests/e2e.mjs                 # default suite (SUITE below)
//   node tests/e2e.mjs n1 t2           # just these
//   node tests/e2e.mjs --no-build ...  # reuse dist/
// Env: CHROME_PATH (browser binary), PORT, SS (screenshot dir; default test-results/screenshots),
//      E2E_TIMEOUT_MS (per test, default 600000).
// A test FAILS if it exits non-zero, times out, or prints a line starting with "FAIL" (or "MATCH false").
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}/`;
const SS = path.resolve(process.env.SS || path.join(ROOT, 'test-results', 'screenshots'));
const LOGS = path.join(path.dirname(SS), 'logs');
const TIMEOUT = +(process.env.E2E_TIMEOUT_MS || 600000);
// Order matters only for readability; every script starts its own New Game.
export const SUITE = ['smoke1', 'smoke2', 'smoke3', 'smoke4', 'smoke5', 'smoke6', 'smoke7', 'smoke8', 'smoke9',
  'n1', 'n2', 'n3', 'n4', 'n5', 'realm_carry', 'c1', 'c2', 't1', 't2', 't3', 't4', 't5', 't6', 'b1', 'b2', 'b3', 'b4', 'b5',
  'chap', 'autoboss', 'ch3', 'default_speed'];

const args = process.argv.slice(2); const build = !args.includes('--no-build');
const tests = args.filter((a) => !a.startsWith('--')).map((a) => a.replace(/\.mjs$/, '').replace(/^tests\//, ''));
const list = tests.length ? tests : SUITE;
fs.mkdirSync(SS, { recursive: true }); fs.mkdirSync(LOGS, { recursive: true });

if (build) {
  console.log('[e2e] vite build (Sentry DSN blanked)');
  // An empty VITE_SENTRY_DSN in the process env overrides any .env value, so test builds never carry a DSN.
  const r = spawnSync('npx', ['vite', 'build', '--logLevel', 'warn'], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_SENTRY_DSN: '', VITE_SENTRY_DEV: '' } });
  if (r.status !== 0) { console.error('[e2e] build failed'); process.exit(1); }
}
// Guard: the served bundle must not contain a Sentry ingest DSN.
const js = fs.readdirSync(path.join(ROOT, 'dist', 'assets')).filter((f) => f.endsWith('.js'));
if (js.some((f) => /ingest\.[a-z.]*sentry\.io/.test(fs.readFileSync(path.join(ROOT, 'dist', 'assets', f), 'utf8')))) {
  console.error('[e2e] dist/ contains a Sentry DSN; refusing to run tests against it (rebuild without --no-build)'); process.exit(1);
}

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
let serverOut = ''; server.stdout.on('data', (d) => (serverOut += d)); server.stderr.on('data', (d) => (serverOut += d));
const stopServer = () => { try { process.kill(-server.pid, 'SIGTERM'); } catch (e) {} };
process.on('exit', stopServer); process.on('SIGINT', () => process.exit(130));
for (let i = 0; ; i++) {
  try { const r = await fetch(BASE); if (r.ok) break; } catch (e) {}
  if (i > 100) { console.error('[e2e] preview server did not start\n' + serverOut); process.exit(1); }
  await new Promise((r) => setTimeout(r, 200));
}
console.log(`[e2e] serving ${BASE}; screenshots -> ${path.relative(ROOT, SS)}; logs -> ${path.relative(ROOT, LOGS)}`);

function runOne(name) {
  return new Promise((resolve) => {
    const t0 = Date.now(); let out = '';
    const p = spawn(process.execPath, [path.join('tests', name + '.mjs')], { cwd: ROOT, env: { ...process.env, BASE, SS } });
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
    const timer = setTimeout(() => { out += `\n[e2e] TIMEOUT after ${TIMEOUT} ms`; p.kill('SIGKILL'); }, TIMEOUT);
    p.on('close', (code) => {
      clearTimeout(timer); fs.writeFileSync(path.join(LOGS, name + '.log'), out);
      const failLines = out.split('\n').filter((l) => /^(FAIL\b|MATCH false|\[e2e\] TIMEOUT)/.test(l.trim()));
      const ok = code === 0 && failLines.length === 0;
      resolve({ name, ok, code, secs: ((Date.now() - t0) / 1000).toFixed(0), why: ok ? '' : (failLines[0] || `exit ${code}`).trim().slice(0, 110), out });
    });
  });
}

const results = [];
for (const name of list) {
  if (!fs.existsSync(path.join(ROOT, 'tests', name + '.mjs'))) { results.push({ name, ok: false, secs: '0', why: 'no such test' }); continue; }
  process.stdout.write(`[e2e] ${name} ... `);
  const r = await runOne(name); results.push(r);
  console.log(`${r.ok ? 'PASS' : 'FAIL'} (${r.secs}s)${r.ok ? '' : '  ' + r.why}`);
  if (!r.ok) console.log(r.out.split('\n').slice(-25).map((l) => '    | ' + l.slice(0, 240)).join('\n'));
}
stopServer();
console.log('\n test            result   secs  note\n ' + '-'.repeat(70));
for (const r of results) console.log(` ${r.name.padEnd(16)}${(r.ok ? 'PASS' : 'FAIL').padEnd(9)}${String(r.secs).padStart(4)}  ${r.why || ''}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n[e2e] ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
