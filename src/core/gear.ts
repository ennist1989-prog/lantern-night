// Equipment maths shared by the map/menu (state.ts) and the battle party builder (party.ts). Pure data-driven.
import { DB } from './db';
export const GEAR_SLOTS = ['weapon', 'armor', 'acc', 'acc2'];
const PAR = ['mhp', 'msp', 'atk', 'def', 'mat', 'mdf', 'agi'];
type Eq = Record<string, string | null | undefined>;
export const RARITY_COL = (r?: string) => (DB.equipment?.rarity?.[r || 'common'] as string) || '#e8e8e8';
/** Primary stat of a forged piece. */
export function forgeStat(it: any): string { const p = it.params || {}; if (it.type === 'armor') return 'def'; return (p.mat || 0) > (p.atk || 0) ? 'mat' : 'atk'; }
/** Flat params of one item for the given realm (realm-swapping gear lists near/far params) plus forge gain. */
export function itemParams(id: string, realm: 'near' | 'far', forged: Record<string, number> = {}): Record<string, number> {
  const it = DB.items[id]; if (!it) return {}; const o: Record<string, number> = { ...(it.params || {}) };
  if (it.realm) for (const [k, v] of Object.entries(it.realm[realm] || {})) o[k] = (o[k] || 0) + (v as number);
  const f = forged[id] || 0; if (f && it.forge !== false && (it.type === 'weapon' || it.type === 'armor')) { const g = DB.equipment?.forge?.statGain?.['+' + f] ?? f; const k = forgeStat(it); o[k] = (o[k] || 0) + g; }
  return o;
}
export function equippedIds(eq: Eq): string[] { return GEAR_SLOTS.map((s) => eq[s]).filter(Boolean) as string[]; }
/** Active set bonuses: [{set, count, traits}] */
export function activeSets(eq: Eq) {
  const ids = new Set(equippedIds(eq)); const out: { id: string; name: string; count: number; traits: any[]; params: Record<string, number> }[] = [];
  for (const [sid, s] of Object.entries<any>(DB.equipment?.sets || {})) {
    const count = s.pieces.filter((p: string) => ids.has(p)).length; if (!count) continue;
    let traits: any[] = []; for (const [n, b] of Object.entries<any>(s.bonus)) if (count >= Number(n)) traits = traits.concat(b);
    if (!traits.length) continue; const params: Record<string, number> = {}; const tr: any[] = [];
    for (const t of traits) { const ks = Object.keys(t); if (ks.length === 1 && PAR.includes(ks[0])) params[ks[0]] = (params[ks[0]] || 0) + t[ks[0]]; else tr.push(t); }
    out.push({ id: sid, name: s.name, count, traits: tr, params });
  }
  return out;
}
export function setParams(eq: Eq, p: string): number { let n = 0; for (const s of activeSets(eq)) n += s.params[p] || 0; return n; }
/** Total flat gear bonus for param p in a realm (items + set bonuses). */
export function gearBonus(eq: Eq, p: string, realm: 'near' | 'far', forged: Record<string, number> = {}): number { let n = setParams(eq, p); for (const id of equippedIds(eq)) n += itemParams(id, realm, forged)[p] || 0; return n; }
/** Realm-independent part + the near/far swap deltas (used in battle so a Shift swaps gear bonuses mid-fight). */
export function gearSplit(eq: Eq, p: string, forged: Record<string, number> = {}) {
  let fixed = setParams(eq, p), near = 0, far = 0;
  for (const id of equippedIds(eq)) { const it = DB.items[id]; if (!it) continue; const base = itemParams(id, 'near', forged)[p] || 0, fb = itemParams(id, 'far', forged)[p] || 0; if (it.realm) { near += base; far += fb; } else fixed += base; }
  return { fixed, near, far };
}
/** Engine traits contributed by gear + active sets. */
export function gearTraits(eq: Eq): any[] { const out: any[] = []; for (const id of equippedIds(eq)) for (const t of DB.items[id]?.traits || []) out.push(t); for (const s of activeSets(eq)) for (const t of s.traits) out.push(t); return out; }
export function hasTrait(eq: Eq, key: string) { return gearTraits(eq).some((t) => t[key] !== undefined); }
export function traitSum(eq: Eq, key: string, dflt = 0) { let v = dflt; for (const t of gearTraits(eq)) if (typeof t[key] === 'number') v += t[key]; return v; }
export function traitMul(eq: Eq, key: string) { let v = 1; for (const t of gearTraits(eq)) if (typeof t[key] === 'number') v *= t[key]; return v; }
const EL_NAME: Record<string, string> = { flame: 'Flame', tide: 'Tide', bloom: 'Bloom', gale: 'Gale', lumen: 'Lumen', umbra: 'Umbra', phys: 'Physical' };
const pct = (v: number) => Math.round(Math.abs(v) * 100) + '%';
/** Human-readable line for one engine trait (used in equipment descriptions and set bonuses). */
export function traitText(t: any): string {
  const o: string[] = [];
  for (const [k, v] of Object.entries<any>(t)) {
    switch (k) {
      case 'maxHpRate': o.push('Max HP +' + pct(v)); break; case 'regen': o.push('Regen ' + pct(v) + '/turn'); break; case 'crit': o.push('Crit +' + pct(v)); break; case 'eva': o.push('Evade +' + pct(v)); break;
      case 'spRegen': o.push('SP +' + v + '/turn'); break; case 'startEcho': o.push('Echo +' + v + ' at start'); break; case 'startLumen': o.push('Lumen +' + v + ' at start'); break;
      case 'startStage': o.push('Start: ' + Object.entries(v).map(([p, n]) => p.toUpperCase() + ((n as number) > 0 ? '↑' : '↓')).join(' ')); break; case 'startState': o.push('Start: ' + v); break;
      case 'elemDmg': for (const [e, m] of Object.entries<any>(v)) o.push(EL_NAME[e] + ' skills +' + Math.round((m - 1) * 100) + '%'); break;
      case 'stateResist': for (const [e, m] of Object.entries<any>(v)) o.push(e.replace('_', ' ') + ' resist ' + pct(m)); break; case 'stateImmune': o.push('Immune: ' + v.join(', ')); break;
      case 'noThinned': o.push('No Thinned (Far)'); break; case 'statusChance': o.push('Status chance +' + pct(v)); break; case 'mood': o.push('Mood gains +' + pct(v)); break;
      case 'vpDamage': o.push('Veil Arts +' + v + ' VP'); break; case 'bondGain': o.push('Bond gauge +' + pct(v)); break; case 'encRate': o.push('Encounters ' + (v < 1 ? '-' : '+') + pct(1 - v)); break; case 'dropRate': o.push('Drops ×' + v); break; case 'fieldRegen': o.push('Heal ' + pct(v) + ' per 50 steps'); break;
      default: if (PAR_KEYS.includes(k)) o.push(k.toUpperCase() + ' +' + v);
    }
  }
  return o.join(', ');
}
const PAR_KEYS = ['mhp', 'msp', 'atk', 'def', 'mat', 'mdf', 'agi'];
