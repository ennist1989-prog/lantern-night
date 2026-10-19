import { launch, press, sleep, waitScene, newGame, mashUntil, teleport } from './lib.mjs';
import { state, waitInput, pick, target, cmd } from './bdrive.mjs';
const { browser, page, errors } = await launch();
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < 4) $.gainExp(a, 20 * a.level); } $.realm = 'far'; $.gain('mochi', 3); $.gain('honey', 2); });
  await teleport(page, 1, 17, 17, 'down'); await sleep(300);
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); m.startBattle('tr_straw_hound', { random: true, zone: 'z01' }); });
  await waitScene(page, 'Battle', 15000); await sleep(1200);
  await pick(page, 'Fight'); await pick(page, 'Parley'); console.log(JSON.stringify((await state(page)).labels));
  await pick(page, 'Offer'); await sleep(300); console.log(JSON.stringify(await state(page)));
  console.log(await page.evaluate(() => JSON.stringify(Object.entries(window.__S.$.items))));
} catch (e) { console.log('FAIL', e.message); }
await browser.close();
