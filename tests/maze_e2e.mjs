// Training maze (map 7) in the browser: village south entrance -> maze, supply box opens once and stays open,
// an NPC gift is given only once, the exit loops back to map 1 (1,16) facing right. Writes Near/Far screenshots.
// SHOTS=dir node tests/maze_e2e.mjs
import fs from 'fs';
import { launch, sleep, press, newGame, mashUntil, teleport } from './lib.mjs';
const OUT = process.env.SHOTS || 'screenshots/training_maze'; fs.mkdirSync(OUT, { recursive: true });
const z = JSON.parse(fs.readFileSync('public/data/maps/map007.json', 'utf8'));
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
const { browser, page, errors } = await launch();
const idle = () => { const m = window.__game.scene.getScene('Map'); return m.ready && !m.msg.busy && !m.interp.busy; };
const st = () => page.evaluate(() => { const m = window.__game.scene.getScene('Map'), $ = window.__S.$; return { map: $.map.id, x: $.map.x, y: $.map.y, dir: $.map.dir, items: { ...$.items } }; });
const realm = async (r, x, y, dir) => { await page.evaluate((r) => { window.__S.$.realm = r; }, r); await teleport(page, 7, x, y, dir); await sleep(500); };
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.setSw('maze_intro', true); });
// entrance: walk off the village south trail
await teleport(page, 1, 23, 27, 'down'); await press(page, 'ArrowDown', 400); await sleep(1200); await mashUntil(page, idle, null, 20);
let s = await st(); ok(s.map === 7 && s.x === 27 && s.y === 1, `village south trail -> maze top (got ${s.map} ${s.x},${s.y})`);
const npcs = z.events.filter((e) => e.pages.some((p) => p.g && p.g.sheet && p.trigger === 'action'));
for (const r of ['near', 'far']) {
  await realm(r, 27, 2, 'down'); await shot(`${r}_entrance`);
  await realm(r, 15, 9, 'left'); await shot(`${r}_corridor`);
  await realm(r, 3, 21, 'left'); await shot(`${r}_supply_box`);
  await realm(r, 2, 22, 'left'); await shot(`${r}_exit`);
  for (const e of npcs) if (!e.realm || e.realm === 'both' || e.realm === r) {
    const near = [[0, 1, 'up'], [1, 0, 'left'], [-1, 0, 'right'], [0, -1, 'down']].find(([dx, dy]) => !z.col[r][(e.y + dy) * z.w + e.x + dx]);
    await realm(r, e.x + near[0], e.y + near[1], near[2]); await shot(`${r}_npc_${e.pages[0].g.sheet}`);
  }
}
const tk = npcs.find((e) => e.pages[0].g.sheet === 'tokubei_far');
for (const r of ['near', 'far']) { await realm(r, tk.x, tk.y + 1, 'up'); const v = await page.evaluate(([x, y]) => window.__game.scene.getScene('Map').evs.some((v) => v.data.x === x && v.data.y === y && v.char && v.char.visible), [tk.x, tk.y]);
  ok(r === 'far' ? v : !v, `Old Tokubei ${r === 'far' ? 'shown in Far' : 'hidden in Near'}`); }
// supply box: opens once, stays open
await realm('near', 2, 22, 'up'); const before = (await st()).items.mochi || 0;
await press(page, 'Enter'); await mashUntil(page, idle, null, 30); s = await st();
ok((s.items.mochi || 0) === before + 1, `supply box gives the mochi (${before} -> ${s.items.mochi})`);
await press(page, 'Enter'); await mashUntil(page, idle, null, 30); ok(((await st()).items.mochi || 0) === before + 1, 'supply box gives nothing the second time');
await teleport(page, 7, 2, 22, 'up'); await sleep(400); await shot('near_supply_box_open');
// NPC gift once (Suzu, herbal_tea)
const suzu = npcs.find((e) => JSON.stringify(e.pages).includes('maze_suzu'));
await realm('near', suzu.x, suzu.y - 1, 'down'); const t0 = (await st()).items.herbal_tea || 0;
await press(page, 'Enter'); await mashUntil(page, idle, null, 40); const t1 = (await st()).items.herbal_tea || 0;
await press(page, 'Enter'); await mashUntil(page, idle, null, 40); const t2 = (await st()).items.herbal_tea || 0;
ok(t1 === t0 + 2 && t2 === t1, `Suzu gives herbal tea once (${t0} -> ${t1} -> ${t2})`);
// loop-back
await realm('near', 1, 22, 'left'); await press(page, 'ArrowLeft', 400); await sleep(1200); await mashUntil(page, idle, null, 20); s = await st();
ok(s.map === 1 && s.x === 1 && s.y === 16 && s.dir === 'right', `maze west exit -> village (1,16) facing right (got ${s.map} ${s.x},${s.y} ${s.dir})`);
ok(await page.evaluate(() => window.__S.$.sw('maze_cleared')), 'maze_cleared set');
await shot('near_loopback_arrival');
await page.evaluate(() => { window.__S.$.realm = 'far'; }); await teleport(page, 1, 3, 16, 'right'); await sleep(500); await shot('far_loopback_arrival');
await teleport(page, 1, 23, 26, 'down'); await sleep(400); await shot('far_village_south_entrance');
ok(!errors.filter((e) => /error/i.test(e)).length, 'no console errors ' + errors.slice(0, 3).join(' | '));
await browser.close(); console.log(fails ? `FAIL ${fails}` : 'PASS maze_e2e'); process.exit(fails ? 1 : 0);
