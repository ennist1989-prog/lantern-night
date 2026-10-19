import { launch, sleep, press, waitScene, waitFor, activeScenes, newGame, mashUntil, teleport } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `screenshots/${n}.png` });
const st = () => page.evaluate(() => { const S = window.__S, m = window.__game.scene.getScene('Map'); return { map: S.$.map?.id ?? S.$.mapId, x: m.player?.tx, y: m.player?.ty, realm: S.$.realm, lumen: Math.round(S.$.lumen), gold: S.$.gold, party: S.$.party.slice(), sw: Object.keys(S.$.switches || {}).filter(k => S.$.switches[k]).sort().join(','), items: JSON.stringify(S.$.items), q: JSON.stringify(S.$.quests).length }; });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'));
  await sleep(500); await teleport(page, 1, 20, 12, 'down');
  await page.evaluate(() => { const S = window.__S; S.$.addActor('kaze'); S.$.gold = 123; S.$.gain('onigiri', 3); S.$.lumen = 47; S.$.setSw && S.$.setSw('kaze_joined', true); });
  const before = await st(); console.log('before', JSON.stringify(before));
  await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(400);
  for (let i = 0; i < 9; i++) { await press(page, 'ArrowDown'); await sleep(50); }
  await press(page, 'Enter'); await waitScene(page, 'SaveLoad'); await sleep(500);
  await press(page, 'ArrowDown'); await press(page, 'ArrowDown'); await press(page, 'Enter'); await sleep(500); await shot('23-save-confirm');
  await press(page, 'Enter'); await sleep(700); await shot('23-save-done');
  console.log('slot3', await page.evaluate(() => JSON.stringify(window.__S.SaveManager.meta(3))));
  await page.reload(); await waitScene(page, 'Title', 30000); await sleep(800); await shot('24-title-continue');
  await press(page, 'Enter'); await waitScene(page, 'SaveLoad'); await sleep(600); await shot('24-load');
  console.log('latest', await page.evaluate(() => window.__S.SaveManager.latestSlot()));
  for (let i = 0; i < 2; i++) { await press(page, 'ArrowDown'); } 
  await press(page, 'Enter'); await sleep(500); await shot('24-load-confirm'); await press(page, 'Enter');
  await waitScene(page, 'Map', 15000); await sleep(1200);
  const after = await st(); console.log('after ', JSON.stringify(after));
  console.log('MATCH', JSON.stringify(before) === JSON.stringify(after));
  await shot('25-loaded');
} catch (e) { console.log('FAIL', e.message); await shot('fail'); }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
