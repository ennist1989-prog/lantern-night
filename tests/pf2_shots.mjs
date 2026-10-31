// Playtest fixes 2: shrine stairs / post layering screenshots (Near + Far), player in front of and behind the post.
import { launch, sleep, newGame, mashUntil, teleport } from './lib.mjs';
const SS = process.env.SS || '/tmp/pf2_shots';
const { browser, page, errors } = await launch();
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
await page.evaluate(() => { window.__S.$.tutorialsShown.ctl_done = true; });
let fail = 0;
for (const realm of ['near', 'far']) for (const [tag, x, y, dir] of [['gate', 18, 5, 'up'], ['row3', 17, 3, 'up'], ['south', 17, 7, 'up']]) {
  await page.evaluate((r) => { window.__S.$.realm = r; }, realm); await teleport(page, 1, x, y, dir); await sleep(500);
  const d = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); const post = m.evs.find((e) => e.x === 18 && e.y === 6 && e.char?.img?.visible !== false); const tor = m.objs.filter((o) => o.frame?.name === 'torii' || o.texture?.key?.includes('torii') || o.frame?.name?.includes?.('torii'));
    return { pd: post?.char?.img?.depth ?? post?.char?.depth ?? null, pl: m.player.img?.depth ?? m.player.depth ?? null, tor: tor.map((o) => o.depth) }; });
  console.log(realm, tag, JSON.stringify(d));
  await page.screenshot({ path: `${SS}/pf2-shrine-${tag}-${realm}.png` });
}
console.log('errors', errors.length, JSON.stringify([...new Set(errors.map(String))].slice(0, 5))); await browser.close(); process.exit(fail ? 1 : 0);
