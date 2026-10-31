// Playtest fixes 2 (#5): the first spirit past the Warden boulder (Hearth-Lost Wisp, map 1 Far (8,22)) is a grind check.
// Seeded headless sim (Mio+Kaze, Far Shore, auto + shift bots, n=400): L1 must lose, L2 rarely wins, L3 is a real fight
// (winnable, >= 5 rounds on average), L4 is comfortable. Usage: node tests/first_spirit_sim.cjs
process.env.SEED = process.env.SEED || '7';
const sim = require('./sim.cjs');
const base = sim.SPEC.enemies.dust_wisp.stats.mhp, hw = sim.SPEC.enemies.hearth_wisp; let ok = hw.stats.mhp >= 3 * base;
console.log('hearth_wisp mhp', hw.stats.mhp, 'vs dust_wisp', base, '(>=3x:', ok + ')');
const map = require('fs').readFileSync(require('path').join(__dirname, '../public/data/maps/map001.json'), 'utf8'); const m1 = JSON.parse(map);
const ev = m1.events.find((e) => e.x === 8 && e.y === 22 && e.realm === 'far'); const t = ev?.pages?.[0]?.enemy?.troop; if (t !== 'tr_hearth_wisp') { ok = false; } console.log('map1 far (8,22) troop', t);
const rows = [];
for (const style of ['auto', 'shift']) for (const lv of [1, 2, 3, 4, 5]) { const r = sim.run('tr_hearth_wisp', ['mio', 'kaze'], lv, { realm: 'far', n: 400, style }); rows.push(r); console.log(JSON.stringify(r)); }
for (const solo of [1, 2, 3, 4]) console.log(JSON.stringify(sim.run('tr_hearth_wisp', ['mio'], solo, { realm: 'far', n: 400 })));
const w = (r) => parseInt(r.win); for (const r of rows) {
  if (r.lv === 1 && w(r) > 2) ok = false; if (r.lv === 2 && w(r) > 35) ok = false;
  if (r.lv === 3 && (w(r) < 70 || +r.rounds < 5)) ok = false; if (r.lv >= 4 && w(r) < 95) ok = false; }
console.log(ok ? 'PASS first spirit: L1 loses, L2 low, L3 >=5-round fight, L4+ comfortable' : 'FAIL first spirit balance'); if (!ok) process.exitCode = 1;
