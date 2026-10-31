// Playtest fixes data scan (no browser): every transfer in every map, arrivals, edge exits, chest reachability, BGM.
// node tests/edge_exits.mjs  -> prints PASS/FAIL lines, exit code 1 on any failure.
import fs from 'fs';
const dir = process.env.MAPS || 'public/data/maps'; const maps = {};
for (const f of fs.readdirSync(dir)) if (/^map\d+\.json$/.test(f)) { const m = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')); maps[m.id] = m; }
const bgmFiles = new Set(fs.readdirSync('public/assets/bgm').map((f) => f.replace(/\.ogg$/, '')));
let fails = 0; const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } return c; };
const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const realms = (r) => (r === 'both' || !r ? ['near', 'far'] : [r]);
const walk = (m, r, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.col[r][y * m.w + x];
function* cmds(list) { for (const c of list || []) { yield c; for (const k of ['then', 'else']) if (c[k]) yield* cmds(c[k]); if (c.br) for (const b of c.br) yield* cmds(b); } }
const evAt = (m, x, y, r) => m.events.filter((e) => e.x === x && e.y === y && realms(e.realm).includes(r));
const isTransferEv = (e) => e.pages.some((p) => [...cmds(p.list)].some((c) => c.c === 'transfer' && c.map !== undefined));
// house doors (button-free touch doors already) and story warps that are scripted, not walk-off exits
const HOUSE = new Set(['1:7,14', '2:6,9', '1:25,14', '3:7,9']);
const STORY = new Set(['6:8,5', '6:1,1']);
const transfers = [];
for (const m of Object.values(maps)) for (const e of m.events) e.pages.forEach((p, pi) => { for (const c of cmds(p.list)) if (c.c === 'transfer' && c.map !== undefined && c.map !== m.id) transfers.push({ m, e, p, pi, c }); });
console.log('transfers', transfers.length);
for (const { m, e, p, c } of transfers) {
  const key = `${m.id}:${e.x},${e.y}`, tgt = maps[c.map]; const tag = `${key} -> ${c.map} (${c.x},${c.y}) ${c.dir}`;
  if (!ok(tgt, `${tag}: target map missing`)) continue;
  for (const r of realms(e.realm)) {
    ok(walk(tgt, r, c.x, c.y) && !evAt(tgt, c.x, c.y, r).some((v) => v.pages.some((q) => q.g && !q.through && !q.g.flat && !q.cond)), `${tag} [${r}]: arrival tile blocked (D7: the shrine return landed on the square post)`);
    const onT = evAt(tgt, c.x, c.y, r).filter((v) => isTransferEv(v) && v.pages.some((q) => q.trigger === 'touch'));
    ok(!onT.length, `${tag} [${r}]: arrival sits on a transfer`);
    const d = DV[c.dir]; if (!ok(d, `${tag}: arrival has no facing`)) continue;
    const ix = c.x + d[0], iy = c.y + d[1];
    ok(!evAt(tgt, ix, iy, r).some(isTransferEv), `${tag} [${r}]: facing straight into another transfer (D7 loop)`);
  }
  if (!HOUSE.has(key) && !STORY.has(key)) ok(p.trigger === 'touch', `${tag}: non-house exit needs a button press (trigger ${p.trigger})`);
}
// push-back moves inside touch events must land on a walkable tile that is not another trigger
for (const m of Object.values(maps)) for (const e of m.events) for (const p of e.pages) if (p.trigger === 'touch') for (const c of cmds(p.list)) if (c.c === 'move' && !c.ev && c.route?.length === 1 && DV[c.route[0]]) {
  const [dx, dy] = DV[c.route[0]]; for (const r of realms(e.realm)) ok(walk(m, r, e.x + dx, e.y + dy), `${m.id}:${e.x},${e.y} push-back ${c.route[0]} lands on a blocked tile [${r}]`);
}
// edge exits: the trigger cells on the map border; their trail must stay walkable to the edge
const EDGE = [[1, [[35, 16], [35, 17]]], [10, [[0, 17], [0, 18], [0, 19], [49, 18], [49, 19], [24, 0], [25, 0], [26, 0]]], [111, [[0, 12], [0, 13], [45, 11], [45, 12], [45, 13]]], [112, [[0, 19], [0, 20], [0, 21]]], [113, [[14, 25], [15, 25], [16, 25]]]];
for (const [id, cells] of EDGE) for (const [x, y] of cells) { const m = maps[id]; const es = m.events.filter((e) => e.x === x && e.y === y && isTransferEv(e));
  ok(es.length && es.every((e) => e.pages.every((p) => p.trigger === 'touch')), `edge exit ${id}:${x},${y} is a walk-off touch transfer`);
  ok(x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1, `edge exit ${id}:${x},${y} on the map border`); }
// no black (gid 0) cells in the village or the small interiors; the well keeps only its pit
for (const id of [1, 2, 3, 10, 111, 112, 113]) for (const r of ['near', 'far']) ok(!maps[id].layers[r].g.some((v) => !v), `map ${id} ${r}: gid-0 (black) ground cells`);
for (const id of [2, 3]) ok(maps[id].bg === '#3b3643', `map ${id}: letterbox tinted to the wall colour`);
// chests: every chest event has a 4-neighbour reachable from the map's arrivals. BFS over (x, y, realm) with realm shifts
// (unless noShift); story-gated blockers (events whose solid pages all have a cond, e.g. hay, sand drifts) and switch-built
// tiles (m.dyn walk:true) count as passable, since the chest is meant to sit behind them.
const arrivals = {}; for (const { c } of transfers) (arrivals[c.map] ||= []).push(c);
const isChest = (e) => e.pages.some((p) => p.g?.obj === 'chest' || [...cmds(p.list)].some((c) => c.c === 'chestopen'));
const solidPage = (p) => p.g && !p.through && !p.g.flat && (p.g.obj || p.g.sheet);
for (const m of Object.values(maps)) { const starts = arrivals[m.id] || []; if (!starts.length) continue;
  const dyn = new Set(); for (const d of m.dyn || []) if (d.walk) for (const [x, y] of d.cells) for (const r of realms(d.realm)) dyn.add(`${r}:${x},${y}`);
  const free = (r, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && (walk(m, r, x, y) || dyn.has(`${r}:${x},${y}`)) &&
    !m.events.some((e) => e.x === x && e.y === y && realms(e.realm).includes(r) && e.pages.some((p) => solidPage(p) && !p.cond) && !e.pages.some((p) => p.through));
  const seen = new Set(); const q = [];
  for (const a of starts) for (const r of ['near', 'far']) if (walk(m, r, a.x, a.y)) { seen.add(`${r}:${a.x},${a.y}`); q.push([r, a.x, a.y]); }
  while (q.length) { const [r, x, y] = q.shift(); const nb = Object.values(DV).map(([dx, dy]) => [r, x + dx, y + dy]); if (!m.noShift) nb.push([r === 'near' ? 'far' : 'near', x, y]);
    for (const [nr, nx, ny] of nb) { const k = `${nr}:${nx},${ny}`; if (seen.has(k) || !free(nr, nx, ny)) continue; seen.add(k); q.push([nr, nx, ny]); } }
  for (const e of m.events) if (isChest(e)) ok(realms(e.realm).some((r) => Object.values(DV).some(([dx, dy]) => seen.has(`${r}:${e.x + dx},${e.y + dy}`))), `chest ${m.id}:${e.x},${e.y} has no reachable neighbour tile`); }
// BGM: every map has a near and far track that exists
for (const m of Object.values(maps)) for (const r of ['near', 'far']) ok(m.bgm?.[r] && bgmFiles.has(m.bgm[r]), `map ${m.id} bgm.${r} = ${m.bgm?.[r]} exists`);
// save compat: opened chests, beaten foes and self-switches are saved by event ID, so every event that exists on main (71f9cc6,
// snapshot in tests/fixtures/main_event_ids.json: map -> id -> [x, y, realm]) must keep its ID, tile and realm. New events go last.
const MAIN_IDS = JSON.parse(fs.readFileSync('tests/fixtures/main_event_ids.json', 'utf8')); let idsChecked = 0;
for (const [mid, evs] of Object.entries(MAIN_IDS)) { const m = maps[mid]; if (!ok(m, `map ${mid} from main is missing`)) continue;
  const byId = new Map(m.events.map((e) => [String(e.id), e]));
  for (const [id, [x, y, r]] of Object.entries(evs)) { const e = byId.get(id); idsChecked++;
    ok(e && e.x === x && e.y === y && (e.realm || 'both') === r, `map ${mid} event ${id} moved or renumbered vs main (was ${x},${y} ${r}; now ${e ? `${e.x},${e.y} ${e.realm || 'both'}` : 'missing'}) - append new events after the existing ones`); }
  const maxMain = Math.max(0, ...Object.keys(evs).map(Number));
  for (const e of m.events) if (!(String(e.id) in evs)) ok(e.id > maxMain, `map ${mid} new event ${e.id} (${e.x},${e.y}) reuses an ID below main's last (${maxMain})`); }
console.log('main event IDs unchanged:', idsChecked);
console.log(fails ? `FAIL ${fails}` : `PASS edge_exits (${Object.keys(maps).length} maps, ${transfers.length} transfers)`);
process.exit(fails ? 1 : 0);
