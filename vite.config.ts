import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Sentry release = lantern-night@<package.json version>+<short git sha>. Falls back to 'nogit' when git or the repo is missing.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
function shortSha(): string {
  try { return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'nogit'; } catch { return 'nogit'; }
}
export const APP_RELEASE = `${pkg.name}@${pkg.version}+${shortSha()}`;

export default defineConfig({
  base: './',
  define: { __APP_RELEASE__: JSON.stringify(APP_RELEASE) },
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000, target: 'es2020' },
  server: { host: '127.0.0.1', port: 5173 },
});
