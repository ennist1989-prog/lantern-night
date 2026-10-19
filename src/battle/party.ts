import { SPEC } from './spec';
import { Battle, Battler } from './engine';
import { gearSplit, gearTraits, hasTrait, traitSum } from '../core/gear';
const MAXL = 20;
/** Build a party Battler from persisted actor state. defActor = DB.actors[id]; items = DB.items. */
export function partyBattler(actor: any, defActor: any, items: Record<string, any>, bonds: Record<string, any> = {}, forged: Record<string, number> = {}): Battler {
  const b = new Battle({ realm: 'near', lumen: 0, lumenMax: 0, difficulty: 'standard', items: {}, itemDB: {}, pity: {}, flags: {} } as any, [], Object.keys(SPEC.troops)[0]).blankFoe();
  const eq = actor.equips; const sp: Record<string, any> = {};
  const p = (k: string) => { const r = defActor.params[k]; const v = Math.round(r[0] + ((r[1] - r[0]) * (actor.level - 1)) / (MAXL - 1)); const g = gearSplit(eq, k, forged); sp[k] = g; return v + g.fixed + (actor.perm?.[k] || 0); };
  b.side = 'party'; b.actorId = actor.id; b.id = actor.id; b.name = defActor.name; b.face = defActor.face; b.level = actor.level; b.kind = 'party'; b.archetype = 'hero';
  for (const k of ['mhp', 'msp', 'atk', 'def', 'mat', 'mdf', 'agi']) b.base[k] = p(k);
  b.bond = actor.equips.bond || null; b.bondTraits = [];
  if (b.bond && bonds[b.bond]) { const e = SPEC.enemies[b.bond]?.bond; for (const t of e?.traits || []) b.bondTraits.push(t); }
  for (const t of b.bondTraits) { if (t.mhpRate) b.base.mhp = Math.round(b.base.mhp * t.mhpRate); if (t.maxHpRate) b.base.mhp = Math.round(b.base.mhp * (1 + t.maxHpRate)); }
  for (const t of gearTraits(eq)) b.bondTraits.push(t);
  b.realmGear = {}; for (const k of ['atk', 'def', 'mat', 'mdf', 'agi']) if (sp[k] && (sp[k].near || sp[k].far)) b.realmGear[k] = { near: sp[k].near, far: sp[k].far };
  b.keepsake = eq.keepsake ? (Object.values<any>(SPEC.summons.summons).find((x) => x.keepsake === eq.keepsake)?.id ?? null) : null;
  b.mhp = b.base.mhp; b.msp = b.base.msp; b.hp = Math.min(actor.hp, b.mhp); b.sp = Math.min(actor.sp, b.msp); b.dispHp = b.hp; b.gauge = 20;
  b.skills = [...actor.skills]; if (b.bond && SPEC.enemies[b.bond]?.bond?.skill) b.skills.push(SPEC.enemies[b.bond].bond.skill);
  const el = new Set<string>(['phys']); for (const id of b.skills) { const s = SPEC.skills[id]; if (s?.damage) el.add(s.element); } b.elemKnown = [...el];
  if (actor.states?.includes?.('hollow_touch')) b.states.hollow_touch = { t: 99, n: 1 };
  return b;
}
export function hasWard(actor: any) { return hasTrait(actor.equips, 'noThinned'); }
void traitSum;
