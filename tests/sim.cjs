// Headless balance/behaviour sim of the battle engine (no browser). Usage: node tests/sim.cjs
// Env: SEED=<int> makes runs reproducible; SIM_OUT=<dir> compiles the engine somewhere other than /tmp/eng (parallel checkouts).
if (process.env.SEED) { let a = +process.env.SEED >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
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
  return { troop, ids: ids.join('+'), lv, realm, style, win: Math.round((wins / n) * 100) + '%', rounds: (rounds / n).toFixed(1), hpLost: Math.round((lost / n) * 100) + '%', lumenUsed: (lumen / n).toFixed(1) };
}
module.exports = { run, mkParty, Battle, SPEC, ITEMS, ACT };
if (require.main === module) {
  const cases = [['tr_dust_wisp', ['mio'], 1, { realm: 'far' }], ['tr_moss_slimeling', ['mio'], 2], ['tr_straw_hound', ['mio'], 3], ['tr_dust_wisp_moss_slimeling', ['mio'], 2, { realm: 'far' }], ['boss_straw_warden', ['mio'], 3, { style: 'shift' }], ['boss_straw_warden', ['mio', 'kaze'], 3, { style: 'shift' }],
    ['tr_well_newt', ['mio', 'kaze'], 4], ['tr_gloam_bat_ofuda_moth', ['mio', 'kaze'], 5, { realm: 'far' }], ['tr_bell_mouse_ofuda_moth', ['mio', 'kaze'], 5, { realm: 'far' }], ['boss_bell_keeper', ['mio', 'kaze'], 5, { style: 'shift' }], ['boss_bell_keeper', ['mio', 'kaze'], 6, { style: 'shift' }], ['boss_bell_keeper', ['mio', 'kaze'], 7, { style: 'shift' }], ['boss_bell_keeper', ['mio', 'kaze'], 5, { style: 'auto' }]];
  for (const [t, ids, lv, o] of cases) { try { console.log(JSON.stringify(run(t, ids, lv, o || {}))); } catch (e) { console.log('ERR', t, e.stack.split('\n').slice(0, 3).join(' | ')); } }
  // N1: Auto in ordinary fights keeps a Lumen reserve before paying for a Near->Far Shift (the map restores the pre-battle realm separately; see tests/realm_carry.mjs)
  { const AUTO_LUMEN_RESERVE = require(OUT + '/battle/engine.js').AUTO_LUMEN_RESERVE ?? 10; const trash = Object.keys(SPEC.troops).filter((t) => t.startsWith('tr_') && !SPEC.troops[t].boss && (SPEC.troops[t].enemies || []).every((e) => !SPEC.enemies[e]?.boss)).slice(0, 30); let n = 0, wins = 0, low = 0, belowReserve = 0;
    for (const t of trash) for (const lumen0 of [60, 10 + AUTO_LUMEN_RESERVE - 3, 12]) { const party = mkParty(['mio', 'kaze'], 6); const B = new Battle({ realm: 'near', lumen: lumen0, lumenMax: 60, difficulty: 'standard', items: {}, itemDB: ITEMS, pity: {}, flags: {} }, party, t); let g = 0, wentFar = false;   // wentFar = Auto paid a Near->Far Shift that left less than the reserve
      while (!B.ended && g++ < 60) { B.startRound(); for (const p of B.party) if (p.hp > 0) p.action = B.autoAction(p); B.buildOrder(); for (const b of B.order.slice()) { if (B.ended) break; if (b.hp <= 0 || b.gone) continue; const before = B.realm; B.act(b); if (before === 'near' && B.realm === 'far' && B.lumen < AUTO_LUMEN_RESERVE) wentFar = true; } if (!B.ended) B.endRound(); B.checkEnd(); }
      n++; if (B.ended === 'win') wins++; if (lumen0 < 60) low++; if (wentFar) belowReserve++; }
    const ok = wins === n && belowReserve === 0; console.log((ok ? 'PASS' : 'FAIL') + ' N1 auto reserve: ordinary troops won ' + wins + '/' + n + ', Near->Far Shifts that dipped below the ' + AUTO_LUMEN_RESERVE + ' Lumen reserve ' + belowReserve + '/' + low); if (!ok) process.exitCode = 1; }
  // N10: a Far fight that drains Lumen to 0 forces the party back to Near and flags it (B.forcedNear), so the map won't
  // restore the Far Shore at ~0 Lumen afterwards (mapscene.startBattle). Control: plenty of Lumen never sets the flag.
  {
    const trial = (lumen0) => { const B = new Battle({ realm: 'far', lumen: lumen0, lumenMax: 60, difficulty: 'standard', items: {}, itemDB: ITEMS, pity: {}, flags: {} }, mkParty(['mio', 'kaze'], 6), 'tr_dust_wisp');
      let g = 0, flagRound = -1; while (!B.ended && g++ < 60) { const go = B.forcedNear || B.round >= 4; if (!go) B.foes.forEach((f) => { f.mhp = Math.max(f.mhp, 999); f.hp = f.mhp; }); else B.foes.forEach((f) => (f.hp = Math.min(f.hp, 1)));
        B.startRound(); for (const p of B.party) if (p.hp > 0) p.action = { type: 'guard' }; if (go) for (const p of B.party) if (p.hp > 0) p.action = { type: 'skill', skill: 'p_attack', targets: [B.foesAlive()[0].uid] };
        B.buildOrder(); for (const b of B.order.slice()) { if (B.ended) break; if (b.hp <= 0 || b.gone) continue; B.act(b); } if (!B.ended) B.endRound(); B.checkEnd(); if (B.forcedNear && flagRound < 0) flagRound = B.round; }
      return { end: B.ended, realm: B.realm, forcedNear: B.forcedNear, lumen: B.lumen, flagRound }; };
    const low = trial(1.7), high = trial(40); const ok = low.forcedNear && low.realm === 'near' && low.end === 'win' && !high.forcedNear && high.realm === 'far' && high.end === 'win';
    console.log((ok ? 'PASS' : 'FAIL') + ' N10 forced Near: Far fight at 1.7 Lumen ' + JSON.stringify(low) + ', at 40 Lumen ' + JSON.stringify(high)); if (!ok) process.exitCode = 1;
  }
}
