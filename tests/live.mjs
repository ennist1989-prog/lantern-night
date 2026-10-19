import { launch, press, hold, sleep, waitScene, mashUntil, activeScenes } from './lib.mjs';
const SS = '/workspace/lantern-night/screenshots'; const URL = 'https://ennist1989-prog.github.io/lantern-night/';
const { browser, page, errors } = await launch(URL);
try {
  await waitScene(page, 'Title', 60000); await sleep(1500); await page.screenshot({ path: SS + '/100-live-title.png' }); console.log('title ok');
  await press(page, 'Enter'); await waitScene(page, 'Map', 30000); await sleep(800); console.log('new game started');
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80); await sleep(500);
  await page.screenshot({ path: SS + '/101-live-newgame.png' });
  await hold(page, 'ArrowDown', 500); await sleep(300);
  const r = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); m.autosave('auto'); const S = window.__S; const ok = S.SaveManager.save ? S.SaveManager.save(1) : null; return { ok, slot1: !!localStorage.getItem('lotfs.save.1'), auto: !!localStorage.getItem('lotfs.save.0'), map: S.$.map }; });
  console.log('save', JSON.stringify(r));
  await page.reload(); await waitScene(page, 'Title', 60000); await sleep(1200);
  await press(page, 'Enter'); await sleep(1500); await page.screenshot({ path: SS + '/102-live-continue.png' });
  console.log('scenes after continue', await activeScenes(page));
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 5));
} catch (e) { console.log('FAIL', e.message); console.log(errors.slice(0, 5)); await page.screenshot({ path: SS + '/10x-fail.png' }); }
await browser.close();
