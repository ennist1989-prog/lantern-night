// Headless balance/behaviour sim of the battle engine (no browser). Usage: node tests/sim.cjs
const { execSync } = require('child_process'); const fs = require('fs'); const path = require('path');
try { execSync('npx tsc src/battle/engine.ts src/battle/party.ts src/battle/spec.ts --rootDir src --outDir /tmp/eng --module commonjs --target es2022 --skipLibCheck --esModuleInterop --ignoreConfig', { stdio: 'pipe', cwd: path.join(__dirname, '..') }); } catch (e) { /* strictness diagnostics only; JS is still emitted */ }
const { Battle } = require('/tmp/eng/battle/engine.js'); const { partyBattler } = require('/tmp/eng/battle/party.js'); const { setSpec, SPEC } = require('/tmp/eng/battle/spec.js');
const D = path.join(__dirname, '../public/data'); const J = (f) => JSON.parse(fs.readFileSync(path.join(D, f)));
const spec = {}; for (const n of ['enemies', 'skills', 'states', 'troops', 'bosses', 'zones', 'parley', 'bonds', 'elements', 'progression', 'summons', 'learn']) spec[n] = J('spec/' + n + '.json'); setSpec(spec);
const ACT = J('actors.json'), ITEMS = J('items.json'); const { DB } = require('/tmp/eng/core/db.js'); DB.items = ITEMS; DB.equipment = J('equipment.json');
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
    ['tr_well_newt', ['mio', 'kaze'], 4], ['tr_gloam_bat_ofuda_moth', ['mio', 'kaze'], 5, { realm: 'far' }], ['tr_bell_mouse_ofuda_moth', ['mio', 'kaze'], 5, { realm: 'far' }], ['boss_bell_keeper', ['mio', 'kaze'], 5, { style: 'shift' }], ['boss_bell_keeper', ['mio', 'kaze'], 6, { style: 'shift' }], ['boss_bell_keeper', ['mio', 'kaze'], 5, { style: 'auto' }]];
  for (const [t, ids, lv, o] of cases) { try { console.log(JSON.stringify(run(t, ids, lv, o || {}))); } catch (e) { console.log('ERR', t, e.stack.split('\n').slice(0, 3).join(' | ')); } }
}
