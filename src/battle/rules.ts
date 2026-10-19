// Pure battle rules: damage formulas, elements, parley.
import { $ } from '../core/state';
import { DB } from '../core/db';
export interface Battler {
  kind: 'actor' | 'enemy'; id: string; name: string; idx: number; hp: number; sp: number; mhp: number; msp: number; level: number;
  p: Record<string, number>; states: Record<string, number>; mood: number; moodMax: number; calm: boolean; sent: boolean; revealed: Set<string>; def?: any; actor?: any;
  action: any; guarding: boolean; mult: Record<string, number>; face: string; heartBreak?: boolean; spr?: any; gaugeG?: any; row?: number;
}
export const alive = (b: Battler) => b.hp > 0 && !b.sent;
export function makeActorBattler(id: string, idx: number): Battler {
  const a = $.actors[id]; const p: any = {}; for (const k of ['atk', 'def', 'mat', 'mdf', 'agi']) p[k] = $.param(a, k);
  return { kind: 'actor', id, name: DB.actors[id].name, idx, hp: a.hp, sp: a.sp, mhp: $.param(a, 'mhp'), msp: $.param(a, 'msp'), level: a.level, p, states: {}, mood: 0, moodMax: 100, calm: false, sent: false, revealed: new Set(), actor: a, action: null, guarding: false, mult: {}, face: id };
}
export function makeEnemyBattler(id: string, idx: number): Battler {
  const d = DB.enemies[id]; const p = d.params;
  return { kind: 'enemy', id, name: d.name, idx, hp: p.mhp, sp: 99, mhp: p.mhp, msp: 99, level: d.level, p: { atk: p.atk, def: p.def, mat: p.mat, mdf: p.mdf, agi: p.agi }, states: {}, mood: d.mood0 ?? 0, moodMax: 100, calm: false, sent: false, revealed: new Set(), def: d, action: null, guarding: false, mult: {}, face: d.face || d.sprite };
}
const cache: Record<string, Function> = {};
export function evalFormula(f: string, a: Battler, b: Battler): number {
  const fn = (cache[f] ||= new Function('a', 'b', 'return (' + f + ');'));
  const A = { atk: a.p.atk, def: a.p.def, mat: a.p.mat, mdf: a.p.mdf, agi: a.p.agi, level: a.level, mhp: a.mhp }; const B = { atk: b.p.atk, def: b.p.def, mat: b.p.mat, mdf: b.p.mdf, agi: b.p.agi, level: b.level, mhp: b.mhp };
  return fn(A, B);
}
export function enemyForm(b: Battler, realm: string) { return b.def.forms?.[realm] || {}; }
export function elementRate(b: Battler, el: string, realm: string): number {
  if (b.kind === 'actor') return 1; const res = b.def.res?.[realm] || {}; return res[el] ?? 1;
}
export function effStat(b: Battler, k: string) { let v = b.p[k]; if (b.states.protected && k === 'def') v = Math.floor(v * 1.3); if (b.states.atkup && k === 'atk') v = Math.floor(v * 1.25); if (b.states.thinned && (k === 'atk' || k === 'def')) v = Math.floor(v * 0.8); return v; }
export interface DmgResult { dmg: number; crit: boolean; rate: number; el: string; incorporeal: boolean; }
export function calcDamage(a: Battler, b: Battler, sk: any, realm: string, echo: number): DmgResult {
  const el = sk.element || 'phys'; const formula = sk.formula || 'a.atk*4 - b.def*2';
  const aa = { ...a, p: { ...a.p, atk: effStat(a, 'atk') } } as Battler; const bb = { ...b, p: { ...b.p, def: effStat(b, 'def') } } as Battler;
  let base = evalFormula(formula, aa, bb); let rate = elementRate(b, el, realm);
  let incorporeal = false;
  if (b.kind === 'enemy' && el === 'phys' && b.def.spirit && realm === 'far') { rate *= 0.5; incorporeal = true; }
  if (el === 'lumen' || el === 'umbra') base *= realm === 'far' ? 1.25 : 0.85;
  if (b.kind === 'enemy' && b.def.armorNear && realm === 'near' && el === 'phys') rate *= 0.5;
  const crit = Math.random() < (a.kind === 'actor' ? 0.06 : 0.04);
  let dmg = base * rate * (0.92 + Math.random() * 0.16) * (crit ? 1.5 : 1);
  if (a.kind === 'actor') dmg *= 1 + 0.15 * echo; if (b.guarding) dmg *= 0.5; if (b.mult.dmgTaken) dmg *= b.mult.dmgTaken;
  if (a.kind === 'enemy') { const diff = (window as any).__diff || 'standard'; dmg *= diff === 'gentle' ? 0.75 : diff === 'tough' ? 1.25 : 1; if (a.def.dmgMult) dmg *= a.def.dmgMult; }
  return { dmg: Math.max(1, Math.round(dmg)), crit, rate, el, incorporeal };
}
export function calcHeal(a: Battler, sk: any): number { const f = sk.formula || '40'; return Math.max(1, Math.round(evalFormula(f, a, a) * (0.95 + Math.random() * 0.1))); }
export function expForEnemies(list: Battler[], sentIds: Set<Battler>) {
  let exp = 0, gold = 0; const drops: string[] = [];
  for (const e of list) { const d = e.def; const sent = sentIds.has(e); const diff = (window as any).__diff; const xm = diff === 'gentle' ? 1.2 : 1; exp += Math.round(d.exp * (sent ? 0.75 : 1) * xm); if (!sent) gold += d.gold; for (const [id, rate] of d.drops || []) if (Math.random() < rate) drops.push(id); if (sent && d.calmDrop && Math.random() < 0.85) drops.push(d.calmDrop); }
  return { exp, gold, drops };
}
