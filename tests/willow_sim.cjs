// Ch3 Willow Mother is Parley-only: headless sim asserts the fight can't be won and the Parley can (Mio+Kaze, default gear, no items).
// Usage: node tests/willow_sim.cjs   (env N=<runs per cell, default 300>, SEED defaults to 1, SIM_OUT like tests/sim.cjs)
process.env.SEED = process.env.SEED || '1';
const { run, mkParty, Battle, ITEMS } = require('./sim.cjs');
const N = +(process.env.N || 300); let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
// QA parley bot: Mio Remembers until Calm then Sends; Kaze clears the buds; Mend below 40%.
function parleyBot(B, p) {
  const foes = B.foesAlive(); const boss = foes.find((f) => f.boss); const adds = foes.filter((f) => !f.boss);
  const weakest = B.heroes().slice().sort((x, y) => x.hp / x.mhp - y.hp / y.mhp)[0];
  if (p.skills.includes('mio_mend') && p.sp >= 8 && weakest.hp / weakest.mhp < 0.4) return { type: 'skill', skill: 'mio_mend', targets: [weakest.uid] };
  if (p.actorId === 'mio' && boss) {
    if (boss.calm && B.canUse(p, 'mio_send').ok) return { type: 'skill', skill: 'mio_send', targets: [boss.uid] };
    if (!boss.calm) return { type: 'skill', skill: 'mio_remember', targets: [boss.uid] };
  }
  if (adds.length) return { type: 'skill', skill: 'p_attack', targets: [adds[0].uid] };
  return { type: 'guard' };
}
function parley(realm, lv) {
  let wins = 0;
  for (let i = 0; i < N; i++) {
    const B = new Battle({ realm, lumen: 60, lumenMax: 60, difficulty: 'standard', items: {}, itemDB: ITEMS, pity: {}, flags: {} }, mkParty(['mio', 'kaze'], lv), 'boss_willow_mother');
    let g = 0; while (!B.ended && g++ < 60) { B.startRound(); for (const p of B.party) if (p.hp > 0) p.action = parleyBot(B, p); B.buildOrder(); for (const b of B.order.slice()) { if (B.ended) break; if (b.hp <= 0 || b.gone) continue; B.act(b); } if (!B.ended) B.endRound(); B.checkEnd(); }
    if (B.ended === 'win') wins++;
  }
  return Math.round((wins / N) * 100);
}
// 1) the Parley is reliably winnable at the Hollow's recommended level (L9-10)
const band = { near: [9, 72, 10, 85], far: [9, 70, 10, 80] };   // [lv, min%, lv, min%]  (tuned: Near ~80-83/99, Far ~78-80/99 at N=300; floors leave room for seed noise)
for (const realm of ['near', 'far']) { const [l1, m1, l2, m2] = band[realm]; const a = parley(realm, l1), b = parley(realm, l2);
  ok(a >= m1, `parley ${realm} L${l1}: ${a}% (>= ${m1}%)`); ok(b >= m2, `parley ${realm} L${l2}: ${b}% (>= ${m2}%)`); }
// 2) blades never win, even far over-levelled, with either bot, on either Shore
for (const realm of ['near', 'far']) for (const style of ['auto', 'shift']) for (const lv of [9, 10, 12, 15]) {
  const r = run('boss_willow_mother', ['mio', 'kaze'], lv, { realm, style, n: Math.min(N, 100) }); ok(r.win === '0%', `fight ${realm} ${style} L${lv}: ${r.win} wins (must be 0%)`);
}
// 3) the hints teach exactly the route the parley bot above plays (Remember x3 -> Calm -> Send), never the Marigold Petal (Offer only wastes Mio's turn here)
{ const fs = require('fs'), path = require('path'); const R = path.join(__dirname, '..', 'public', 'data');
  const w = JSON.parse(fs.readFileSync(path.join(R, 'spec', 'bosses.json'), 'utf8')).willow_mother; const note = JSON.parse(fs.readFileSync(path.join(R, 'system.json'), 'utf8')).notes.find((n) => n.unlock === 'willow_tip').text;
  const tip = JSON.stringify(JSON.parse(fs.readFileSync(path.join(R, 'maps', 'map112.json'), 'utf8')).events).match(/The Willow Mother can[^"]*/)?.[0] || ''; const bh = (fs.readFileSync(path.join(__dirname, '..', 'src', 'battle', 'battlescene.ts'), 'utf8').match(/willow_mother: '([^']*)'/) || [])[1] || '';
  const T = { hint: w.parleyOnly.hintText, key: w.parley.key.note, note, tip, bossHint: bh };
  ok(Object.values(T).every((t) => t && !/petal|offer/i.test(t)), 'no Willow hint mentions Offer / Marigold Petal');
  ok(Object.values(T).every((t) => /Remember/.test(t) && /three times/.test(t) && /Calm/.test(t) && /Send/.test(t)) && w.parley.key.verb === 'remember' && w.parley.key.times === 3, 'every Willow hint says Remember three times -> Calm -> Send (matches key: remember x3)'); }
console.log(fails ? `WILLOW SIM ${fails} FAIL` : 'WILLOW SIM ALL PASS'); process.exit(fails ? 1 : 0);
