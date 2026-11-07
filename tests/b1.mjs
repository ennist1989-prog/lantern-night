import { launch, press, sleep, waitScene, newGame, mashUntil, teleport, activeScenes, SSDIR } from './lib.mjs';
import fs from 'fs';
const SS = SSDIR;
const { browser, page, errors } = await launch();
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.setSw('kaze_joined', true); $.addActor('kaze'); $.gold = 200; });
  await teleport(page, 1, 17, 17, 'down');
  await page.evaluate(() => { const $ = window.__S.$; $.realm = 'far'; const m = window.__game.scene.getScene('Map'); m.applyRealmVisuals?.(); });
  await sleep(500);
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); window.__bp = m.startBattle('tr_dust_wisp_dust_wisp', { random: true, zone: 'z01' }); });
  await waitScene(page, 'Battle', 15000); await sleep(1800);
  await page.screenshot({ path: SS + '/40-battle-start.png' });
  console.log('scenes', await activeScenes(page));
  await press(page, 'Enter'); await sleep(500); await page.screenshot({ path: SS + '/41-battle-cmd.png' });
  console.log('errors', errors.slice(0, 6));
} catch (e) { console.log('FAIL', e.message); console.log(errors.slice(0, 8)); }
await browser.close();
