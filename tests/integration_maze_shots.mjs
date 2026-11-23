// integration-1031: map 7 supply box (2,21) closed and opened (Near), plus the maze in Far. SHOTS=dir (default screenshots/integration).
import fs from 'fs';
import { launch, sleep, press, newGame, mashUntil, teleport } from './lib.mjs';
const OUT = process.env.SHOTS || 'screenshots/integration'; fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
const { browser, page } = await launch();
const idle = () => { const m = window.__game.scene.getScene('Map'); return m.ready && !m.msg.busy && !m.interp.busy; };
// the box tile (2,21) sits right above Mio standing at (2,22); clip that 48x48 cell from the screen (map drawn at 3x)
const boxFrame = async () => { const { x, y } = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'), c = m.cameras.main; return { x: (2 * 16 - c.scrollX) * c.zoom, y: (21 * 16 - c.scrollY) * c.zoom }; });
  return (await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: 48, height: 48 } })).toString('base64'); };
const mochi = () => page.evaluate(() => window.__S.$.items.mochi || 0);
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.setSw('maze_intro', true); $.realm = 'near'; });
await teleport(page, 7, 2, 22, 'up'); await sleep(600);
const f0 = await boxFrame(); await page.screenshot({ path: OUT + '/map7_supply_box_closed.png' }); const m0 = await mochi();
await press(page, 'Enter'); await mashUntil(page, idle, null, 30); await teleport(page, 7, 2, 22, 'up'); await sleep(600);
const f1 = await boxFrame(); await page.screenshot({ path: OUT + '/map7_supply_box_open.png' }); ok((await mochi()) === m0 + 1, 'looking inside the box gives the mochi'); ok(f0 !== f1, 'box cell on screen changes from closed to open');
await page.evaluate(() => { window.__S.$.realm = 'far'; }); await teleport(page, 7, 15, 9, 'left'); await sleep(600); await page.screenshot({ path: OUT + '/map7_maze_far.png' });
await browser.close(); console.log(fails ? `FAIL ${fails}` : 'PASS integration_maze_shots'); process.exit(fails ? 1 : 0);
