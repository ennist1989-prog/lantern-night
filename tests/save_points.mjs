// Thomas's rule: at most one save point per map (Lantern Post that saves, inn that autosaves, Save menu choice); none on the training maze (map 7).
// Also the training maze data checks: reachability entrance -> supply box -> exit, loop-back arrival, NPC gifts flag-guarded once, box persists.
import fs from 'fs';
const dir = 'public/data/maps'; const maps = {};
for (const f of fs.readdirSync(dir)) if (/^map\d+\.json$/.test(f)) { const m = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')); maps[m.id] = m; }
let fails = 0; const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } return c; };
function* cmds(l) { for (const c of l || []) { yield c; for (const k of ['then', 'else']) if (c[k]) yield* cmds(c[k]); if (c.br) for (const b of c.br) yield* cmds(b); if (c.choices) for (const b of c.choices) yield* cmds(b.list || b); } }
const isSave = (c) => (c.c === 'post' && c.save !== false) || (c.c === 'inn' && !c.noSave) || c.c === 'save' || c.c === 'savemenu';
const audit = [];
for (const m of Object.values(maps)) {
  const ev = new Set(); for (const e of m.events) for (const p of e.pages) for (const c of cmds(p.list)) if (isSave(c)) ev.add(`${e.x},${e.y}`);
  audit.push(`map ${m.id}: ${ev.size} [${[...ev].join(' ')}]`);
  ok(ev.size <= (m.id === 7 ? 0 : 1), `map ${m.id}: ${ev.size} save points (${[...ev].join(' ')})`);
}
console.log(audit.join('\n'));
const z = maps[7]; ok(z && z.w === 35 && z.h === 27, 'maze 35x27');
for (const r of ['near', 'far']) {
  const walk = (x, y) => x >= 0 && y >= 0 && x < z.w && y < z.h && !z.col[r][y * z.w + x];
  const bfs = (s) => { const seen = new Set([s.join()]); const q = [s]; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${x + dx},${y + dy}`; if (!seen.has(k) && walk(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); } } } return seen; };
  const R = bfs([27, 1]);
  ok(R.has('1,22'), `${r}: entrance reaches exit`); ok(['3,21', '2,22', '1,21'].some((k) => R.has(k)), `${r}: entrance reaches supply box`);
}
const box = z.events.find((e) => e.pages.some((p) => [...cmds(p.list)].some((c) => c.c === 'chestopen' || (c.c === 'item' && c.id === 'mochi'))));
ok(box && box.pages.length >= 2 && box.pages.some((p) => p.cond && p.cond.self), 'supply box: self-switch second page (persists opened)');
ok(box && [...cmds(box.pages[0].list)].some((c) => c.c === 'item' && c.id === 'mochi'), 'supply box gives mochi');
let givers = 0;
for (const e of z.events) for (const p of e.pages) for (const c of cmds(p.list)) if (c.c === 'if' && c.cond && c.cond.nsw && /^maze_/.test(c.cond.nsw)) {
  const inner = [...cmds(c.then)]; if (inner.some((x) => x.c === 'item')) { givers++; ok(inner.some((x) => x.c === 'set' && x.sw === c.cond.nsw && x.v === true), `gift ${c.cond.nsw} sets its flag`); }
}
ok(givers >= 2, `maze NPC gifts flag-guarded (${givers})`);
const npcs = z.events.filter((e) => e.pages.some((p) => p.g && p.trigger === 'action')); ok(npcs.length >= 3 && npcs.length <= 5, `3-5 maze NPCs (${npcs.length})`);
const loop = [...cmds(z.events.flatMap((e) => e.pages.flatMap((p) => p.list)))].filter((c) => c.c === 'transfer' && c.map === 1);
ok(loop.some((c) => c.x === 1 && c.y === 16 && c.dir === 'right'), 'maze exit loops back to village west road (1,16) facing right');
ok(z.bgm && z.bgm.near && z.bgm.far, 'maze has BGM');
console.log(fails ? `FAIL ${fails}` : 'PASS save_points + maze'); process.exit(fails ? 1 : 0);
