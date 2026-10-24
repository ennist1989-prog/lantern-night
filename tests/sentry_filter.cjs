// Unit test for src/sentryfilter.ts (Sentry host filter + tag normalisation) and the vite.config release string.
// Run: node tests/sentry_filter.cjs   (no browser, no network)
const { execSync } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');
const root = path.join(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'ln-sentry-'));
execSync(`npx tsc src/sentryfilter.ts --outDir ${OUT} --module commonjs --target es2020 --skipLibCheck --ignoreConfig`, { cwd: root, stdio: 'pipe' });
const F = require(path.join(OUT, 'sentryfilter.js'));
let fail = 0;
const eq = (name, got, want) => { const ok = got === want; if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${JSON.stringify(got)}${ok ? '' : ' (want ' + JSON.stringify(want) + ')'}`); };

for (const h of ['localhost', '127.0.0.1', '127.1.2.3', '[::1]', '::1', '0.0.0.0', 'game.localhost', '', null, undefined]) eq(`drop on ${JSON.stringify(h)}`, F.shouldDrop(h, undefined), true);
for (const h of ['localhost', '127.0.0.1']) { eq(`VITE_SENTRY_DEV=1 keeps ${h}`, F.shouldDrop(h, '1'), false); eq(`VITE_SENTRY_DEV='' drops ${h}`, F.shouldDrop(h, ''), true); eq(`VITE_SENTRY_DEV=0 drops ${h}`, F.shouldDrop(h, '0'), true); }
for (const h of ['ennist1989-prog.github.io', 'example.com', '192.168.1.5', 'localhost.example.com']) eq(`keep ${h}`, F.shouldDrop(h, undefined), false);
eq('tag null', F.tagValue(null), null); eq('tag undefined', F.tagValue(undefined), null); eq('tag NaN', F.tagValue(NaN), null); eq('tag empty', F.tagValue('  '), null);
eq('tag 0', F.tagValue(0), '0'); eq('tag num', F.tagValue(6), '6'); eq('tag str', F.tagValue('Map'), 'Map'); eq('tag cap 200', F.tagValue('x'.repeat(300)).length, 200);

// release string: lantern-night@<version>+<7-hex sha | nogit>
const pkg = require(path.join(root, 'package.json'));
let sha = 'nogit'; try { sha = execSync('git rev-parse --short=7 HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'nogit'; } catch {}
const rel = `${pkg.name}@${pkg.version}+${sha}`;
eq('release format', /^lantern-night@\d+\.\d+\.\d+\+([0-9a-f]{7,}|nogit)$/.test(rel), true);
const cfg = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
eq('vite.config defines __APP_RELEASE__', /__APP_RELEASE__:\s*JSON\.stringify\(APP_RELEASE\)/.test(cfg) && cfg.includes("'nogit'"), true);
fs.rmSync(OUT, { recursive: true, force: true });
console.log(fail ? `FAIL ${fail} assertion(s)` : 'ALL PASS');
process.exit(fail ? 1 : 0);
