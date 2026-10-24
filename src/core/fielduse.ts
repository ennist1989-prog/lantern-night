// Using items and spells outside battle (menu / map). Pure state logic; map-side effects are returned as `action`s.
import { $ } from './state';
import { DB } from './db';
import { SPEC } from '../battle/spec';
export interface UseResult { ok: boolean; msg?: string; action?: { kind: 'warp' | 'escapeDungeon' | 'peek' | 'tile' | 'stealth' | 'light'; [k: string]: any } }
const CAP: Record<string, number> = { mhp: 60, atk: 4, mat: 4, agi: 3, def: 4, mdf: 4, msp: 20 };
export const STAT_NAME: Record<string, string> = { mhp: 'Max HP', msp: 'Max SP', atk: 'Attack', def: 'Defense', mat: 'Magic', mdf: 'Resist', agi: 'Agility' };
const CURABLE = ['burn', 'chill', 'wilt', 'dazed', 'blind', 'bound', 'stun'];
/** Does this item need the player to pick a party member? */
export function itemNeedsTarget(it: any): boolean { const e = it.effect || {}; if (it.scope === 'allies') return false; return !!(e.hp || e.hpPct || e.sp || e.cure || e.cureAll || e.revive || e.removeStack || e.perm); }
export function itemFieldUsable(it: any) { return !!it && it.type === 'item' && (it.usable === true || it.usable === 'menu') || (it?.type === 'key' && !!it.effect); }
export function useItemOnActor(id: string, who: string): UseResult {
  const it = DB.items[id]; const e = it.effect || {}; const a = $.actors[who]; const mhp = $.param(a, 'mhp'), msp = $.param(a, 'msp'); const dead = a.hp <= 0; let did = false; const parts: string[] = [];
  if (e.revive) { if (!dead) return { ok: false, msg: 'Nothing happens.' }; a.hp = Math.max(1, Math.round(mhp * e.revive)); did = true; parts.push('revived'); }
  else if (dead) return { ok: false };
  if (e.hp && a.hp < mhp) { const h = Math.min(mhp - a.hp, e.hp); a.hp += h; did = true; parts.push('+' + h + ' HP'); }
  if (e.hpPct && a.hp < mhp) { const h = Math.min(mhp - a.hp, Math.round(mhp * e.hpPct)); a.hp += h; did = true; parts.push('+' + h + ' HP'); }
  if (e.sp && a.sp < msp) { const h = Math.min(msp - a.sp, e.sp); a.sp += h; did = true; parts.push('+' + h + ' SP'); }
  const cure = (ids: string[]) => { for (const s of ids) { if (a.states.includes(s)) { a.states = a.states.filter((x) => x !== s); did = true; parts.push('cured'); } } };
  if (e.cure) cure(e.cure); if (e.cureAll) cure(CURABLE);
  if (e.removeStack && a.states.includes(e.removeStack)) { a.states = a.states.filter((x) => x !== e.removeStack); did = true; parts.push('Hollow Touch lifted'); }
  if (e.perm) for (const [k, v] of Object.entries<number>(e.perm)) { a.perm ||= {}; const used = a.perm[k] || 0; if (used >= (CAP[k] ?? 99)) return { ok: false, msg: `${DB.actors[who].name} can't take any more ${STAT_NAME[k]}.` }; const add = Math.min(v, (CAP[k] ?? 99) - used); a.perm[k] = used + add; $.permUsed[k] = (($.permUsed[k] || 0) + add); if (k === 'mhp') a.hp += add; if (k === 'msp') a.sp += add; did = true; parts.push(`${STAT_NAME[k]} +${add}`); }
  if (!did) return { ok: false };
  $.gain(id, -1); $.clampActor(a); return { ok: true, msg: `${DB.actors[who].name}: ${[...new Set(parts)].join(', ')}` };
}
/** Items with no target (Lumen, repel, wicks, warp...). */
export function useItemGlobal(id: string): UseResult {
  const it = DB.items[id]; const e = it.effect || {};
  if (e.repel) { $.gain(id, -1); $.repel = e.repel; return { ok: true, msg: `No wandering spirits for ${e.repel} steps.` }; }
  if (e.lumenMax) { if ($.lumenMax >= e.lumenMax) return { ok: false, msg: 'The Lantern already burns this bright.' }; $.gain(id, -1); $.lumenMax = e.lumenMax; $.lumen = $.lumenMax; return { ok: true, msg: `Max Lumen ${e.lumenMax}!` }; }
  if (e.lumen && !e.hp) { if ($.lumen >= $.lumenMax) return { ok: false }; $.gain(id, -1); $.lumen = Math.min($.lumenMax, $.lumen + e.lumen); return { ok: true, msg: `Lumen +${e.lumen}` }; }
  if (e.escapeDungeon) { if (!DB.system.dungeonExit?.[$.map.id]) return { ok: false, msg: 'There is nowhere to fold a crane to here.' }; $.gain(id, -1); return { ok: true, action: { kind: 'escapeDungeon' } }; }
  if (e.warp) { if (!$.litPost) return { ok: false, msg: 'You have not lit a Lantern Post yet.' }; if ((DB.system.noWarp || []).includes($.map.id)) return { ok: false, msg: 'Something here refuses to let you leave.' }; $.gain(id, -1); return { ok: true, action: { kind: 'warp' } }; }
  if (e.peek) { if (!$.has('dew_lens')) return { ok: false, msg: 'You need the Dew Lens.' }; $.gain(id, -1); $.buffs.peek = e.peek; return { ok: true, msg: 'The other Shore swims into view…', action: { kind: 'peek', seconds: e.peek } }; }
  return { ok: false };
}
// ---------------------------------------------------------------- field spells
/** Field spells: type 'field', or any skill with a `field` block (e.g. Anchor, which also works in battle). */
export const isFieldSkill = (sk: any) => !!sk && (sk.type === 'field' || !!sk.field);
export const fieldCost = (sk: any) => sk.field?.cost || sk.cost || {};
export const fieldSpells = (actorId: string) => $.actors[actorId].skills.filter((k) => isFieldSkill(SPEC.skills[k]));
export function canCastField(actorId: string, sid: string): UseResult {
  const sk = SPEC.skills[sid]; const a = $.actors[actorId]; if (!sk) return { ok: false };
  const c = fieldCost(sk); if (a.sp < (c.sp || 0)) return { ok: false, msg: 'Not enough SP.' }; if ((c.lumen || 0) > $.lumen) return { ok: false, msg: 'Not enough Lumen.' }; return { ok: true };
}
export function castField(actorId: string, sid: string): UseResult {
  const sk = SPEC.skills[sid]; const a = $.actors[actorId]; const f = sk.field || {}; const chk = canCastField(actorId, sid); if (!chk.ok) return chk;
  const fc = fieldCost(sk); const pay = () => { a.sp -= fc.sp || 0; $.lumen = Math.max(0, $.lumen - (fc.lumen || 0)); };
  switch (f.effect) {
    case 'repel': pay(); $.repel = Math.max($.repel, f.steps || 40); return { ok: true, msg: `${sk.name}: no wandering spirits for ${f.steps || 40} steps.` };
    case 'warp': { if (!$.litPost) return { ok: false, msg: 'You have not lit a Lantern Post yet.' }; if ((DB.system.noWarp || []).includes($.map.id)) return { ok: false, msg: 'Something here refuses to let you leave.' }; pay(); return { ok: true, action: { kind: 'warp' } }; }
    case 'stealth': pay(); $.buffs.stealth = f.seconds || 10; return { ok: true, msg: `${sk.name}: spirits lose track of you for ${f.seconds || 10}s.` };
    case 'light': pay(); $.buffs.light = f.seconds || 180; return { ok: true, msg: `${sk.name}: the lamplight swells.` };
    default: return { ok: true, action: { kind: 'tile', tile: f.tile, effect: f.effect, range: f.range || 1, realm: f.realm || 'both', spell: sid, actor: actorId, pay: { sp: fc.sp || 0, lumen: fc.lumen || 0 } } };
  }
}
/** Called by the map once a tile spell found a target. */
export function payField(actorId: string, pay: { sp: number; lumen: number }) { const a = $.actors[actorId]; a.sp = Math.max(0, a.sp - pay.sp); $.lumen = Math.max(0, $.lumen - pay.lumen); }
