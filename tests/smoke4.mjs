import { launch, sleep, press, hold, waitScene, waitFor, activeScenes, ev, newGame, mashUntil, teleport, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `${SSDIR}/${n}.png` });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'));
  await sleep(500); await teleport(page, 1, 8, 6, 'down');
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); m.startBattle('tr_dust_wisp_dust_wisp', {}).then((r) => (window.__bres = r)); });
  await waitScene(page, 'Battle', 15000); await sleep(2500); await shot('11-battle-start');
  // mash: Fight
  await press(page, 'Enter'); await sleep(300); await shot('12-battle-cmd');
  await press(page, 'ArrowDown'); await press(page, 'ArrowDown'); await press(page, 'Enter'); await sleep(300); await shot('13-battle-parley');
  await press(page, 'Enter'); await sleep(300); await shot('14-battle-parley-target');
  await press(page, 'Enter'); await sleep(2500); await shot('15-battle-action');
  for (let i = 0; i < 80; i++) { const sc = await activeScenes(page); if (!sc.includes('Battle')) break; await press(page, 'Enter', 60); await sleep(250); }
  await sleep(1000);
  console.log('result', await ev(page, () => window.__bres), await ev(page, () => ({ gold: window.__S.$.gold, hp: window.__S.$.actors.mio.hp, exp: window.__S.$.actors.mio.exp })));
  await shot('16-after-battle');
  // assert: the battle resolved (promise settled, not a loss/escape) and control returned to the map
  let res; for (let i = 0; i < 60 && !(res = await ev(page, () => window.__bres)); i++) { await press(page, 'Enter', 60); await sleep(250); } const back = (await activeScenes(page)).includes('Map') && !(await activeScenes(page)).includes('Battle');
  if (!res || res === 'lose' || res === 'escape' || !back) { console.log('FAIL battle did not resolve back to the map: ' + JSON.stringify({ res, back })); process.exitCode = 1; } else console.log('PASS battle resolved (' + res + ') and returned to the map');
} catch (e) { console.log('FAIL', e.message); await shot('fail'); process.exitCode = 1; }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
