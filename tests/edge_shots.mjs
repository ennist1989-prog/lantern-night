// Near + Far screenshots of every map/exit the playtest fixes and edge-exit v2.1 art touched (for the art recheck).
import { launch, sleep, newGame, mashUntil, teleport } from './lib.mjs';
const SS = process.env.SS || '/tmp/edge_shots';
const SPOTS = [['m01-village-road-east', 1, 33, 16], ['m01-village-nw', 1, 3, 3], ['m02-sachi-house', 2, 6, 6], ['m03-teahouse', 3, 7, 6],
  ['m04-well-rock', 4, 6, 6], ['m05-shrine-south-door', 5, 11, 21, 'down'], ['m06-summit-stairs', 6, 8, 11, 'down'],
  ['m10-exit10-west', 10, 2, 18], ['m10-exit11-east', 10, 47, 19], ['m10-exit13-grove-gap', 10, 25, 3, 'up'],
  ['m111-exit12-west', 111, 2, 13], ['m111-exit15-east-hollow', 111, 43, 12], ['m112-exit16-west', 112, 2, 20],
  ['m112-exit17-root-bridge', 112, 30, 21, 'right'], ['m113-exit14-south', 113, 15, 23, 'down']];
const { browser, page, errors } = await launch();
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
await page.evaluate(() => { const $ = window.__S.$; $.tutorialsShown.ctl_done = true; });
for (const [name, map, x, y, dir] of SPOTS) for (const realm of ['near', 'far']) {
  if (map === 112) await page.evaluate(() => { const $ = window.__S.$; ($.setSw ? $.setSw('wick_got', true) : ($.switches.wick_got = true)); });   // root-bridge end shows once the wick is got
  await page.evaluate((r) => { window.__S.$.realm = r; }, realm); await teleport(page, map, x, y, dir || 'down'); await sleep(700);
  await mashUntil(page, () => window.__game.scene.getScene('Map').isFree(), null, 20);
  const s = await page.evaluate(() => ({ map: window.__S.$.map.id, realm: window.__S.$.realm, scenes: window.__game.scene.getScenes(true).map((q) => q.scene.key) }));
  await page.screenshot({ path: `${SS}/v21-${name}-${realm}.png` }); console.log(name, realm, JSON.stringify(s));
}
console.log('errors', errors.length, JSON.stringify([...new Set(errors.map(String))].slice(0, 5))); await browser.close();
