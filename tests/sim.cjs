// Headless balance/behaviour sim of the battle engine (no browser). Usage: node tests/sim.cjs [--assert]
// --assert (used by `npm test`): seeded, high-N balance gates (P1/P2 thresholds); exits 1 if any gate fails.
// Env: SEED=<int> makes runs reproducible; SIM_OUT=<dir> compiles the engine somewhere other than /tmp/eng (parallel checkouts).
// Seeded PRNG (mulberry32). seed(n) reseeds Math.random; --assert reseeds per row so each row is order-independent.
function seed(n) { let a = n >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
if (process.env.SEED) seed(+process.env.SEED);
const OUT = process.env.SIM_OUT || '/tmp/eng';
const { execSync } = require('child_process'); const fs = require('fs'); const path = require('path');
try { execSync('npx tsc src/battle/engine.ts src/battle/party.ts src/battle/spec.ts --rootDir src --outDir ' + OUT + ' --module commonjs --target es2022 --skipLibCheck --esModuleInterop --ignoreConfig', { stdio: 'pipe', cwd: path.join(__dirname, '..') }); } catch (e) { /* strictness diagnostics only; JS is still emitted */ }
const { Battle } = require(OUT + '/battle/engine.js'); const { partyBattler } = require(OUT + '/battle/party.js'); const { setSpec, SPEC } = require(OUT + '/battle/spec.js');
const D = path.join(__dirname, '../public/data'); const J = (f) => JSON.parse(fs.readFileSync(path.join(D, f)));
const spec = {}; for (const n of ['enemies', 'skills', 'states', 'troops', 'bosses', 'zones', 'parley', 'bonds', 'elements', 'progression', 'summons', 'learn']) spec[n] = J('spec/' + n + '.json'); setSpec(spec);
const ACT = J('actors.json'), ITEMS = J('items.json'); const { DB } = require(OUT + '/core/db.js'); DB.items = ITEMS; DB.equipment = J('equipment.json');
function mkParty(ids, lv) { return ids.map((id) => { const a = { id, level: lv, exp: 0, hp: 9999, sp: 9999, equips: { ...ACT[id].equip, bond: null }, skills: [], states: [] }; for (const [l, s] of ACT[id].skills) if (lv >= l) a.skills.push(s); return partyBattler(a, ACT[id], ITEMS, {}); }); }
// simple bot: mixes weakness hunting, parley on calm-able foes optionally
function bot(B, p, style) {
  const foes = B.foesAlive();
  const heroes = B.heroes(); const weakest = heroes.slice().sort((x, y) => x.hp / x.mhp - y.hp / y.mhp)[0];
  const mend = p.skills.includes('mio_mend') && p.sp >= 8; if (mend && weakest.hp / weakest.mhp < 0.4) return { type: 'skill', skill: 'mio_mend', targets: [weakest.uid] };
  if (style === 'shift' && p.actorId === 'mio' && B.canUse(p, 'mio_shift').ok) { const wantFar = B.realm === 'near'; const goodNow = foes.some((f) => Object.entries(B.form(f).rates || {}).some(([e, v]) => v >= 1.5 && p.elemKnown.includes(e))); if (!goodNow) { const other = B.realm === 'near' ? 'far' : 'near'; const goodOther = foes.some((f) => Object.entries(f.forms[other].rates || {}).some(([e, v]) => v >= 1.5 && p.elemKnown.includes(e))); if (goodOther && (other === 'near' || B.lumen >= 12)) return { type: 'shift' }; } void wantFar; }
  return B.autoAction(p);
}
function run(troop, ids, lv, { realm = 'near', style = 'auto', difficulty = 'standard', n = 60 } = {}) {
  let wins = 0, rounds = 0, lost = 0, lumen = 0, sent = 0;
  for (let i = 0; i < n; i++) {
    const party = mkParty(ids, lv); const ctx = { realm, lumen: 60, lumenMax: 60, difficulty, items: {}, itemDB: ITEMS, pity: {}, flags: {} }; const B = new Battle(ctx, party, troop); const maxHp = party.reduce((s, p) => s + p.mhp, 0);
    let guard = 0; while (!B.ended && guard++ < 60) { B.startRound(); for (const p of B.party) if (p.hp > 0) p.action = bot(B, p, style); B.buildOrder(); for (const b of B.order.slice()) { if (B.ended) break; if (b.hp <= 0 || b.gone) continue; const r = B.act(b); if (b.side === 'party' && B.canEcho(b, r)) { B.spendEcho(b); b.action = bot(B, b, style); B.act(b); } } if (!B.ended) B.endRound(); B.checkEnd(); }
    if (B.ended === 'win') wins++; rounds += B.round; lost += 1 - party.reduce((s, p) => s + p.hp, 0) / maxHp; lumen += 60 - B.lumen;
  }
  return { troop, ids: ids.join('+'), lv, realm, style, wins, n, win: Math.round((wins / n) * 100) + '%', rounds: (rounds / n).toFixed(1), hpLost: Math.round((lost / n) * 100) + '%', lumenUsed: (lumen / n).toFixed(1) };
}
module.exports = { run, mkParty, Battle, SPEC, ITEMS, ACT, seed };
const pct = (r) => parseInt(r.win, 10);
// Balance gates. Thresholds come from PRIORITIES P1/P2/P5; a fixed seed + high N keeps results stable
// (observed spread across seeds 1-7 at n=400..1000: L5 Shift 64-70%, L5 Auto 65-72%, L6 95-98%, L7 99-100%, L8 100%).
function assertMode() {
  const SEED0 = process.env.SEED ? +process.env.SEED : 20261024; const N = +(process.env.SIM_N || 1000);
  let fails = 0; const t0 = Date.now();
  const gate = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fails++; };
  const row = (i, troop, ids, lv, o) => { seed(SEED0 + i * 7919); return run(troop, ids, lv, { ...o, n: o.n || N }); };
  const MK = ['mio', 'kaze'];
  // Normal (non-boss) encounters at their intended level must stay at 100% wins.
  const normal = [['tr_dust_wisp', ['mio'], 1, { realm: 'far' }], ['tr_moss_slimeling', ['mio'], 2], ['tr_straw_hound', ['mio'], 3], ['tr_dust_wisp_moss_slimeling', ['mio'], 2, { realm: 'far' }],
    ['tr_well_newt', MK, 4], ['tr_gloam_bat_ofuda_moth', MK, 5, { realm: 'far' }], ['tr_bell_mouse_ofuda_moth', MK, 5, { realm: 'far' }]];
  // Gate is >= 99%, not a literal 100%: at n=2000 over seeds 1-6, Mio SOLO at L3 (Near) vs one Straw Hound wins only
  // 99.15-99.55% (rare damage streaks); the old n=60 table always rounded that to 100%. Every other row is 99.85-100%.
  normal.forEach(([t, ids, lv, o], i) => { const r = row(100 + i, t, ids, lv, { ...(o || {}), n: 2000 }); gate(r.wins / r.n >= 0.99, `normal ${t} ${r.ids} L${lv} ${r.realm}: ${r.wins}/${r.n} wins = ${(100 * r.wins / r.n).toFixed(2)}% (want ~100%, gate >= 99%)`); });
  const bk = (lv, style, i) => row(i, 'boss_bell_keeper', MK, lv, { style });
  const l5s = bk(5, 'shift', 1), l5a = bk(5, 'auto', 2);
  gate(pct(l5s) >= 60, `Bell-Keeper Mio+Kaze L5 Shift: win ${l5s.win} (want >= 60%, n=${N})`);
  gate(pct(l5a) >= 35, `Bell-Keeper Mio+Kaze L5 Auto: win ${l5a.win} (want >= 35%, n=${N})`);
  const l6s = bk(6, 'shift', 3); gate(pct(l6s) >= 90, `Bell-Keeper Mio+Kaze L6 Shift: win ${l6s.win} (want >= 90%)`);
  const auto = [6, 7, 8].map((lv, i) => bk(lv, 'auto', 4 + i));
  gate(pct(auto[0]) >= 90, `Bell-Keeper Mio+Kaze L6 Auto: win ${auto[0].win} (want >= 90%)`);
  for (let i = 1; i < auto.length; i++) gate(pct(auto[i]) >= pct(auto[i - 1]) - 5, `Bell-Keeper Auto L${auto[i - 1].lv}->L${auto[i].lv}: ${auto[i - 1].win} -> ${auto[i].win} (drop must be <= 5 pp)`);
  console.log(`sim --assert: ${fails ? fails + ' gate(s) FAILED' : 'all gates passed'} (seed ${SEED0}, n=${N}, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  process.exit(fails ? 1 : 0);
}
if (require.main === module && process.argv.includes('--assert')) assertMode();
else if (require.main === module) {
  const cases = [['tr_dust_wisp', ['mio'], 1, { realm: 'far' }], ['tr_moss_slimeling', ['mio'], 2], ['tr_straw_hound', ['mio'], 3], ['tr_dust_wisp_moss_slimeling', ['mio'], 2, { realm: 'far' }], ['boss_straw_warden', ['mio'], 3, { style: 'shift' }], ['boss_straw_warden', ['mio', 'kaze'], 3, { style: 'shift' }],
    ['tr_well_newt', ['mio', 'kaze'], 4], ['tr_gloam_bat_ofuda_moth', ['mio', 'kaze'], 5, { realm: 'far' }], ['tr_bell_mouse_ofuda_moth', ['mio', 'kaze'], 5, { realm: 'far' }], ['boss_bell_keeper', ['mio', 'kaze'], 5, { style: 'shift' }], ['boss_bell_keeper', ['mio', 'kaze'], 6, { style: 'shift' }], ['boss_bell_keeper', ['mio', 'kaze'], 7, { style: 'shift' }], ['boss_bell_keeper', ['mio', 'kaze'], 5, { style: 'auto' }]];
  for (const [t, ids, lv, o] of cases) { try { console.log(JSON.stringify(run(t, ids, lv, o || {}))); } catch (e) { console.log('ERR', t, e.stack.split('\n').slice(0, 3).join(' | ')); } }
}
