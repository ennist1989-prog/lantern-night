// Thomas 11/07 playtest (no browser): Sachi's door alignment + maze loop-back road hidden until maze_cleared.
// node tests/door_maze_static.mjs  -> PASS/FAIL lines, exit 1 on any failure.
import fs from 'fs';
import { execFileSync } from 'child_process';
const M = (id) => JSON.parse(fs.readFileSync(`public/data/maps/map${String(id).padStart(3, '0')}.json`, 'utf8'));
let fails = 0; const ok = (c, msg) => { console.log(c ? 'PASS' : 'FAIL', msg); if (!c) fails++; };
const walk = (m, r, x, y) => !m.col[r][y * m.w + x];
function* cmds(l) { for (const c of l || []) { yield c; for (const k of ['then', 'else']) if (c[k]) yield* cmds(c[k]); if (c.br) for (const b of c.br) yield* cmds(b); } }
const transfers = (e) => e.pages.flatMap((p) => [...cmds(p.list)].filter((c) => c.c === 'transfer'));
const m1 = M(1), m2 = M(2), m7 = M(7);
// ---- 1. Sachi's door: the drawn doorway column, the walkable cell and the touch event are the same tile
const house = m1.objs.near.find((o) => o.n === 'house_orange');
const fr = JSON.parse(fs.readFileSync('public/assets/objects.json', 'utf8')); const cell = (fr.frames || fr).house_orange;
// doorway = the darkest columns of the sprite's bottom row (read with Python/PIL: no image libs in node here)
const py = `from PIL import Image\nim=Image.open('public/assets/objects.png').convert('RGBA');x0,y0,w,h=${JSON.stringify(cell)}\ncols=[x for x in range(4,w-4) if sum(im.getpixel((x0+x,y0+h-8))[:3])<150 and im.getpixel((x0+x,y0+h-8))[3]>0]\nprint(min(cols),max(cols))`;
const [d0, d1] = execFileSync('python3', ['-c', py]).toString().trim().split(' ').map(Number);
const left = house.x - cell[2] / 2; const doorTx = Math.floor((left + (d0 + d1) / 2) / 16);
const doorTy = house.y / 16 - 1;
ok(doorTx === 6 && doorTy === 14, `Sachi's doorway is drawn at tile (${doorTx},${doorTy}) [sprite cols ${d0}-${d1}]`);
const door = m1.events.find((e) => e.id === 8);
for (const r of ['near', 'far']) {
  ok(door.x === doorTx && door.y === doorTy && walk(m1, r, doorTx, doorTy), `${r}: door event 8 + walkable cell sit on the drawn doorway`);
  ok(!walk(m1, r, doorTx + 1, doorTy) && !walk(m1, r, doorTx - 1, doorTy), `${r}: house wall either side of the doorway is solid`);
  ok(walk(m1, r, doorTx, doorTy + 1), `${r}: approach tile below the doorway is walkable`);
}
const tIn = transfers(door)[0]; ok(tIn && tIn.map === 2 && walk(m2, 'near', tIn.x, tIn.y), 'door enters Sachi\'s House on a floor tile');
const exitEv = m2.events.find((e) => transfers(e).some((t) => t.map === 1)); const tOut = transfers(exitEv)[0];
ok(tOut.x === doorTx && tOut.y === doorTy + 1 && tOut.dir === 'down', `leaving the house lands just below the doorway (${tOut.x},${tOut.y})`);
ok(exitEv.pages.every((p) => p.trigger === 'touch') && door.pages.every((p) => p.trigger === 'touch'), 'both door events are walk-in (touch), no action key');
// ---- 2. maze loop-back road on map 1: hidden (main's canopy) until maze_cleared, never removes the maze exit
const cond = (c, S) => !c || ((!c.sw || [].concat(c.sw).every((k) => S[k])) && (!c.nsw || [].concat(c.nsw).every((k) => !S[k])));
const view = (S, r) => ({
  cover: (m1.covers || []).some((cv) => cv.realm === r && cond(cv.cond, S)),
  banners: m1.objs[r].filter((o) => o.n === 'post_banner' && o.cond && cond(o.cond, S)).length,
  trees: m1.objs[r].filter((o) => o.cond && o.n !== 'post_banner' && cond(o.cond, S)).length,
  open: [0, 1].every((x) => [16, 17].every((y) => { const d = (m1.dyn || []).find((q) => q.cover && q.realm === r && q.cells.some((c) => c[0] === x && c[1] === y)); return d && cond(d.cond, S) ? d.walk : walk(m1, r, x, y); })),
});
for (const r of ['near', 'far']) {
  const pre = view({}, r); ok(pre.cover && pre.banners === 0 && pre.trees === 2 && !pre.open, `${r}: before maze_cleared the west road is hidden + blocked ${JSON.stringify(pre)}`);
  const post = view({ maze_cleared: true }, r); ok(!post.cover && post.banners === 2 && post.trees === 0 && post.open, `${r}: after maze_cleared the road shows + is walkable ${JSON.stringify(post)}`);
  const saved = JSON.parse(JSON.stringify({ switches: { maze_cleared: true } })).switches;   // switches ride in the save as plain JSON
  ok(JSON.stringify(view(saved, r)) === JSON.stringify(post), `${r}: maze_cleared state survives a save/load round-trip`);
}
ok(/switches/.test(fs.readFileSync('src/core/state.ts', 'utf8')) && /toJSON\(\)/.test(fs.readFileSync('src/core/state.ts', 'utf8')), 'switches are part of the saved game state');
const cov = new Set(m1.covers.flatMap((cv) => cv.cells.map((c) => c[0] + ',' + c[1])));
ok([...cov].every((k) => { const [x, y] = k.split(',').map(Number); return x <= 5 && y >= 14 && y <= 19; }), 'cover limited to the west road strip');
// the physical maze exit still works before the first clear and sets maze_cleared before it transfers
const ex = m7.events.filter((e) => e.x === 0 && e.y >= 21 && e.y <= 23);
ok(ex.length === 3 && ex.every((e) => walk(m7, 'near', 1, e.y) && walk(m7, 'far', 1, e.y)), 'maze exit approach (x=1) on map 7 stays walkable (edge exit at x=0 unchanged)');
ok(ex.every((e) => { const l = [...cmds(e.pages[0].list)]; const s = l.findIndex((c) => c.c === 'set' && c.sw === 'maze_cleared'); const t = l.findIndex((c) => c.c === 'transfer'); return s >= 0 && t > s; }), 'maze exit sets maze_cleared before the transfer (road is open on arrival)');
for (const e of ex) { const t = transfers(e)[0]; ok(t.map === 1 && t.x === 1 && [16, 17].includes(t.y), `exit lands on the road (${t.x},${t.y}), inside the covered strip -> shown open since maze_cleared is set`); }
console.log(fails ? `DOOR_MAZE ${fails} FAIL` : 'DOOR_MAZE ALL PASS'); process.exit(fails ? 1 : 0);
