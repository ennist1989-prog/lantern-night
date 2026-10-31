// Playtest fixes 2: Ember's rug_red (full 2-wide rug) + figurine shelves (bookshelf_w map 2, shelf_b map 3), Near + Far screenshots.
import { launch, sleep, newGame, mashUntil, teleport } from './lib.mjs';
const SS = process.env.SS || '/tmp/pf2_shots';
const { browser, page, errors } = await launch();
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
await page.evaluate(() => { window.__S.$.tutorialsShown.ctl_done = true; });
let fail = 0;
for (const [map, x, y, name, want] of [[2, 4, 7, 'sachi', ['rug_red', 'bookshelf_w']], [3, 4, 8, 'teahouse', ['rug_red', 'shelf_b']]]) for (const realm of ['near', 'far']) {
  await page.evaluate((r) => { window.__S.$.realm = r; }, realm); await teleport(page, map, x, y, 'up'); await sleep(700);
  const d = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return m.objs.filter((o) => o.visible !== false).map((o) => [o.frame?.name, o.width, o.height]); });
  const have = want.filter((w) => d.some((o) => o[0] === w)); const rug = d.find((o) => o[0] === 'rug_red');
  const ok = have.length === want.length && rug && rug[1] === 32 && rug[2] === 11; if (!ok) fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + `map ${map} ${realm}: ${JSON.stringify(want)} drawn, rug 32x11: ` + JSON.stringify(d.filter((o) => want.includes(o[0]))));
  await page.screenshot({ path: `${SS}/pf2-house-map${map}-${name}-${realm}.png` });
}
const pe = errors.filter((e) => /PAGEERROR/.test(e)); if (pe.length) { fail++; console.log('FAIL page errors', pe.slice(0, 3)); }
console.log(fail ? `FAIL pf2_house_shots (${fail})` : 'PASS pf2_house_shots'); await browser.close(); process.exit(fail ? 1 : 0);
