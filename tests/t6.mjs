import { launch, press, sleep, waitScene, newGame, mashUntil, teleport } from './lib.mjs';
const { browser, page, errors } = await launch();
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => localStorage.removeItem('lotfs.save.0'));
  await page.evaluate(async () => { const m = window.__game.scene.getScene('Map'); await m.transfer(1, 17, 18, 'down'); });
  await sleep(800);
  console.log('autosave after transfer:', await page.evaluate(() => { const s = localStorage.getItem('lotfs.save.0'); return s ? JSON.parse(s).map || ('len ' + s.length) : null; }));
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 4));
} catch (e) { console.log('FAIL', e.message); }
await browser.close();
