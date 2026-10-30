import { launch, press, hold, sleep, waitScene, newGame, mashUntil, teleport, activeScenes, SSDIR } from './lib.mjs';
const SS = SSDIR;
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `${SS}/${n}.png` });
try {
  await waitScene(page, 'Title', 30000); await sleep(1200); await shot('90-title');
  await press(page, 'Enter'); await waitScene(page, 'Map', 15000);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.gold = 400; });
  await teleport(page, 3, 4, 5, 'up'); await sleep(600);
  await press(page, 'Enter'); await sleep(900); await press(page, 'Enter'); await sleep(900); await sleep(300); await sleep(500);
  await press(page, 'Enter'); await sleep(600); await shot('91-shop'); await press(page, 'Enter'); await sleep(500); await press(page, 'Enter'); await sleep(500); await shot('92-shop-buy');
  for (let i = 0; i < 9; i++) await press(page, 'ArrowDown'); await sleep(300); await shot('92b-shop-gear');
  console.log('gold', await page.evaluate(() => window.__S.$.gold), JSON.stringify(await page.evaluate(() => window.__S.$.items)));
  for (let i = 0; i < 4; i++) { await press(page, 'Escape'); await sleep(300); }
  await teleport(page, 1, 17, 18, 'down'); await sleep(900);
  await page.evaluate(() => { window.__S.$.realm = 'far'; const m = window.__game.scene.getScene('Map'); m.applyRealmVisuals?.(); m.refreshEvents?.(); }); await sleep(900); await shot('94-village-far');
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 6));
} catch (e) { console.log('FAIL', e.message); console.log(errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 8)); await shot('9x-fail'); }
await browser.close();
