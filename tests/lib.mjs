import { chromium } from 'playwright-core';
export async function launch(url = 'http://127.0.0.1:8099/', opts = {}) {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 816, height: 624 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.addInitScript(() => { try { if (!localStorage.getItem('lotfs.settings')) localStorage.setItem('lotfs.settings', JSON.stringify({ walkSpeed: 'brisk', textSpeed: 2 })); } catch (e) {} });   // tests were tuned for the brisk pace
  await page.goto(url);
  return { browser, ctx, page, errors };
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function press(page, key, ms = 80) { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); await sleep(40); }
export async function hold(page, key, ms) { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); await sleep(40); }
export const ev = (page, fn, arg) => page.evaluate(fn, arg);
export async function activeScenes(page) { return page.evaluate(() => window.__game.scene.getScenes(true).map((s) => s.sys.settings.key)); }
export async function waitScene(page, key, ms = 20000) { const t = Date.now(); while (Date.now() - t < ms) { const a = await activeScenes(page); if (a.includes(key)) return true; await sleep(150); } throw new Error('timeout waiting scene ' + key + ' active=' + JSON.stringify(await activeScenes(page))); }
export async function waitFor(page, fn, arg, ms = 15000) { const t = Date.now(); while (Date.now() - t < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(120); } throw new Error('timeout waitFor ' + fn.toString().slice(0, 80)); }
export async function newGame(page) { await waitScene(page, 'Title', 30000); await sleep(600); await press(page, 'Enter'); await waitScene(page, 'Map', 15000); await sleep(500); }
export async function mashUntil(page, fn, arg, max = 120) { for (let i = 0; i < max; i++) { if (await page.evaluate(fn, arg)) return true; await press(page, 'Enter', 60); await sleep(100); } return false; }
export async function teleport(page, map, x, y, dir = 'down') { await page.evaluate(async ([map, x, y, dir]) => { const m = window.__game.scene.getScene('Map'); m.ready = false; await m.loadMap(map, x, y, dir); m.ready = true; }, [map, x, y, dir]); await sleep(400); }
