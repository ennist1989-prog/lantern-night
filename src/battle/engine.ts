// Headless battle engine implementing the Lantern Night battle spec (B.1-B.11). No Phaser/DOM here, so it can be unit-simulated in node.
import { SPEC } from './spec';
export type Realm = 'near' | 'far';
export type Ev = { t: string; [k: string]: any };
export interface Battler {
  uid: number; side: 'party' | 'foe'; id: string; name: string; face?: string; level: number; kind: string; archetype: string; rarity: string;
  base: Record<string, number>; hp: number; sp: number; mhp: number; msp: number; dispHp: number;
  states: Record<string, { t: number; n?: number }>; stages: Record<string, { s: number; t: number }>;
  forms?: any; def?: any; boss?: boolean; elite?: boolean; add?: boolean; sprite?: any; tint?: string | null; scale?: number;
  mood: number; calmAt: number; calm: boolean; calmTurns: number; moodMax: number; keyCount: Record<string, number>; offered: boolean; likes: string[]; dislikes: string[]; temper: string; recruit: boolean; inviteBase: number; fragment: boolean; sendAt?: string;
  vp: number; vpMax: number; unveilSkip: boolean; revealed: Set<string>; gone: '' | 'sent' | 'invited' | 'left'; gilded: boolean; controlImmune: number;
  tell: { skill: string; targets: number[] } | null; skills: string[]; phaseIdx: number; phasesDone: Set<string>; phase?: any; turns: number; forced: string | null; forceSkillNow: string | null;
  // party only
  actorId?: string; bond: string | null; bondTraits: any[]; gauge: number; echoUsed: boolean; shiftCd: number; action: any; slot: number; traits: any; elemKnown: string[]; summoned?: boolean;
  nameOverride?: string;
}
export interface Ctx { warmth?: number; realm: Realm; lumen: number; lumenMax: number; difficulty: 'gentle' | 'standard' | 'tough'; items: Record<string, number>; itemDB: Record<string, any>; pity: Record<string, number>; flags: Record<string, any>; recLevel?: number; rng?: () => number; ward?: boolean; teachSend?: boolean; }
const rint = (rng: () => number, n: number) => Math.floor(rng() * n);
let UID = 1;
const PARAMS = ['mhp', 'msp', 'atk', 'def', 'mat', 'mdf', 'agi'];
export const alive = (b: Battler) => b.hp > 0 && !b.gone;
export function levelStats(e: any, lv: number) {
  const tbl = e.statsByLevel; if (!tbl) return { ...e.stats };
  const keys = Object.keys(tbl).map(Number).sort((a, b) => a - b); let k = keys[0]; for (const x of keys) if (x <= lv) k = x;
  return { msp: e.stats?.msp ?? 0, ...tbl[k] };
}
export function expK(L: number) { return L <= 6 ? 0.7 : L <= 12 ? 0.66 : 0.6; }   // designer tweak: 0.6→0.66 (L7-12), 0.5→0.60 (L13+)
const RAR: Record<string, number> = { common: 1, uncommon: 1.2, rare: 1.6, elusive: 2, elite: 2, add: 0.4 };
export function enemyExp(b: Battler) { if (b.boss) return b.def.exp; let v = Math.round((1.4 * b.level + 4) * expK(b.level) * (RAR[b.rarity] ?? 1)); if (b.archetype === 'swarm') v = Math.round(v * 0.6); if (b.gilded) v *= 3; return v; }
export function enemyGold(b: Battler) { if (b.boss) return b.def.gold; return Math.round((2 * b.level + 3) * (b.archetype === 'swarm' ? 0.6 : 1)); }

export class Battle {
  realm: Realm; lumen: number; lumenMax: number; ctx: Ctx; party: Battler[] = []; foes: Battler[] = []; round = 0; echo = 0; escapes = 0; ended: '' | 'win' | 'lose' | 'escape' = '';
  rng: () => number; troop: any; bossDef: any = null; recruits: { id: string; dup: boolean }[] = []; fragments = 0; goldBonus = 0; tutorials: string[] = []; sentList: Battler[] = []; calmDropGiven = 0; lockRealm = 0; weakSeen = new Set<string>();
  order: Battler[] = []; evFired = new Set<string>(); addsEchoGiven = false; addsSummoned = 0; tolls = 0; noEscape = false; troopLevel = 1; weakHitsDealt = 0; parleyActs = 0;
  constructor(ctx: Ctx, party: Battler[], troopId: string, opts: { boss?: boolean } = {}) {
    this.ctx = ctx; this.realm = ctx.realm; this.lumen = ctx.lumen; this.lumenMax = ctx.lumenMax; this.rng = ctx.rng || Math.random; this.party = party;
    party.forEach((p, i) => { p.slot = i; });
    const tr = SPEC.troops[troopId]; if (!tr) throw new Error('unknown troop ' + troopId); this.troop = tr; this.troopLevel = tr.level || 1; this.noEscape = !!tr.noEscape || tr.kind === 'boss';
    if (tr.boss) { const b = this.makeBoss(tr.boss); this.foes.push(b); this.bossDef = SPEC.bosses[tr.boss]; }
    else tr.enemies.forEach((eid: string, i: number) => this.foes.push(this.makeFoe(eid, this.troopLevel, i)));
    // startStage / startEcho from bond traits
    for (const p of party) { for (const t of p.bondTraits) { if (t.startStage) for (const [k, v] of Object.entries(t.startStage)) this.addStage(p, k, v as number, 99); if (t.startEcho) this.echo = Math.min(3, this.echo + t.startEcho); if (t.startLumen && p.actorId === 'mio') this.lumen = Math.min(this.lumenMax, this.lumen + t.startLumen); if (t.startState) this.setState(p, t.startState, 99, []); } }
    if (this.realm === 'far') this.applyRealmStates();
  }
  // ---------------------------------------------------------------- construction
  blankFoe(): Battler {
    return { uid: UID++, side: 'foe', id: '', name: '', level: 1, kind: 'body', archetype: 'std', rarity: 'common', base: {}, hp: 1, sp: 0, mhp: 1, msp: 0, dispHp: 1, states: {}, stages: {}, mood: 0, calmAt: 100, calm: false, calmTurns: 0, moodMax: 150, keyCount: {}, offered: false, likes: [], dislikes: [], temper: 'wary', recruit: false, inviteBase: 0, fragment: false, vp: 0, vpMax: 0, unveilSkip: false, revealed: new Set(), gone: '', gilded: false, controlImmune: 0, tell: null, skills: [], phaseIdx: 0, phasesDone: new Set(), turns: 0, forced: null, forceSkillNow: null, bond: null, bondTraits: [], gauge: 0, echoUsed: false, shiftCd: 0, action: null, slot: 0, traits: {}, elemKnown: [] };
  }
  makeFoe(eid: string, lv: number, slot: number, opts: { add?: boolean } = {}): Battler {
    const e = SPEC.enemies[eid]; if (!e) throw new Error('unknown enemy ' + eid); const f = this.blankFoe(); const st = levelStats(e, lv); const tough = this.ctx.difficulty === 'tough' ? 1.25 : 1;
    f.id = eid; f.name = e.name; f.level = lv; f.kind = e.kind; f.archetype = e.archetype; f.rarity = opts.add ? 'add' : e.rarity; f.def = e; f.forms = e.forms; f.sprite = e.sprite; f.tint = e.tint; f.scale = e.scale; f.slot = slot; f.add = !!opts.add || e.rarity === 'add';
    f.gilded = !opts.add && this.realm === 'far' && (e.rarity === 'common' || e.rarity === 'uncommon') && this.rng() < 1 / 64; const gk = f.gilded ? 1.3 : 1; if (f.gilded) f.name = 'Gilded ' + f.name;
    for (const p of PARAMS) f.base[p] = Math.round((st[p] ?? 0) * gk);
    f.base.mhp = Math.round(f.base.mhp * tough * (lv >= 10 ? 0.9 : 1)); /* designer tweak: enemy HP ×0.9 from L10 */ f.mhp = f.hp = f.dispHp = f.base.mhp; f.msp = f.sp = f.base.msp || 0;
    const p = e.parley; f.temper = p.temper; f.mood = p.start; f.calmAt = p.calmAt ?? 100; f.likes = p.likes || []; f.dislikes = p.dislikes || []; f.recruit = !!p.recruit; f.inviteBase = p.invite_base || 0; f.fragment = !!p.fragment;
    f.elite = e.archetype === 'elite'; if (f.elite) { f.vp = f.vpMax = 2; }
    f.skills = [...new Set([...(e.forms.near.skills || []), ...(e.forms.far.skills || [])])];
    return f;
  }
  makeBoss(bid: string): Battler {
    const b = SPEC.bosses[bid]; const f = this.blankFoe(); f.id = bid; f.name = b.name; f.level = b.level; f.kind = 'boss'; f.archetype = 'boss'; f.rarity = 'boss'; f.boss = true; f.def = b; f.forms = b.forms; f.sprite = { ...b.sprite, boss: true }; f.tint = b.sprite.tint; f.scale = 4.4;
    for (const p of PARAMS) f.base[p] = b.stats[p] ?? 0; f.base.mhp = Math.round(f.base.mhp * (this.ctx.difficulty === 'tough' ? 1.25 : 1)); f.mhp = f.hp = f.dispHp = f.base.mhp; f.vp = f.vpMax = b.vp || 0;
    const p = b.parley; f.temper = p.temper; f.mood = p.start; f.calmAt = p.calmAt ?? 100; f.sendAt = p.sendAt; f.likes = []; f.recruit = !!p.canRecruit; f.skills = [...new Set([...(b.forms.near.skills || []), ...(b.forms.far.skills || [])])];
    return f;
  }
  // ---------------------------------------------------------------- helpers
  form(b: Battler) { return b.forms ? b.forms[this.realm] : null; }
  stateDef(id: string) { return SPEC.states[id] || { traits: [], turns: 1, kind: 'x' }; }
  traitSum(b: Battler, key: string, dflt = 0) { let v = dflt; for (const id of Object.keys(b.states)) for (const t of this.stateDef(id).traits) if (t[key] !== undefined && typeof t[key] === 'number') v += t[key]; for (const t of b.bondTraits) if (typeof t[key] === 'number') v += t[key]; return v; }
  traitMul(b: Battler, key: string) { let v = 1; for (const id of Object.keys(b.states)) for (const t of this.stateDef(id).traits) if (typeof t[key] === 'number') v *= t[key]; return v; }
  stageOf(b: Battler, p: string) { let s = b.stages[p]?.s || 0; for (const id of Object.keys(b.states)) for (const t of this.stateDef(id).traits) if (t.stage && t.stage[p]) s += t.stage[p]; return Math.max(-2, Math.min(2, s)); }
  stat(b: Battler, p: string) {
    let v = b.base[p] ?? 0; if (p === 'mhp' || p === 'msp') return v; v += b.realmGear?.[p]?.[this.realm] || 0; v *= 1 + 0.25 * this.stageOf(b, p);
    for (const id of Object.keys(b.states)) for (const t of this.stateDef(id).traits) if (t.rate && t.rate[p]) v *= t.rate[p];
    if (p === 'agi' && b.actorId === 'kaze' && this.realm === 'far') v *= 1.1;
    if (b.actorId === 'daigo' && this.realm === 'far' && !this.ctx.ward && !b.bondTraits.some((t: any) => t.noThinned) && (p === 'atk' || p === 'def')) v *= 0.8;
    return Math.max(1, v);
  }
  statKey(a: Battler, key: string, sk?: any): number {
    if (key === 'best') return Math.max(this.stat(a, 'atk'), this.stat(a, 'mat'));
    if (key === 'matAvg' || key === 'atkAvg') { const k = key === 'matAvg' ? 'mat' : 'atk'; const mem = sk?.combo?.members as string[] | undefined; const ps = this.party.filter((x) => x.hp > 0 && (!mem || mem.includes(x.actorId || ''))); return ps.length ? ps.reduce((n, x) => n + this.stat(x, k), 0) / ps.length : this.stat(a, k); }
    return this.stat(a, key);
  }
  rate(b: Battler, el: string) { const f = this.form(b); if (!f) return 1; const r = f.rates?.[el]; return r === undefined ? 1 : r; }
  rnd() { return this.rng(); }
  addStage(b: Battler, p: string, s: number, t: number) { const cur = b.stages[p] || { s: 0, t: 0 }; cur.s = Math.max(-2, Math.min(2, cur.s + s)); cur.t = Math.max(cur.t, t); b.stages[p] = cur; }
  hasState(b: Battler, id: string) { return !!b.states[id]; }
  heroes() { return this.party.filter((p) => p.hp > 0); }
  foesAlive() { return this.foes.filter(alive); }
  clamp(b: Battler) { b.hp = Math.max(0, Math.min(b.mhp, b.hp)); b.sp = Math.max(0, Math.min(b.msp, b.sp)); }
  applyRealmStates() { /* Daigo Thinned handled in stat() */ }
  speed(b: Battler) { let sk = 0; const a = b.action; if (a) { if (a.type === 'guard') sk = 2; else if (a.type === 'shift') sk = 2; else if (a.skill) { const s = SPEC.skills[a.skill]; sk = s?.speed || 0; if (s?.tell) sk -= 2; } } return this.stat(b, 'agi') + sk; }
  // ---------------------------------------------------------------- round flow
  startRound(): Ev[] {
    const ev: Ev[] = []; this.round++; for (const p of this.party) { p.echoUsed = false; if (p.shiftCd > 0) p.shiftCd--; }
    this.checkPhases(ev); this.runTroopEvents(ev, 'round');
    for (const f of this.foes) if (alive(f)) this.planFoe(f, ev);
    return ev;
  }
  buildOrder(): Battler[] {
    const all = [...this.party.filter((p) => p.hp > 0), ...this.foes.filter(alive)];
    this.order = all.sort((a, b) => this.speed(b) - this.speed(a) || (a.side === b.side ? a.slot - b.slot : a.side === 'party' ? -1 : 1)); return this.order;
  }
  previewOrder(): Battler[] { return this.buildOrder(); }
  // enemy AI -----------------------------------------------------------
  skillAvailable(f: Battler, id: string): boolean { const s = SPEC.skills[id]; if (!s) return false; const ef = s.effects || []; for (const e of ef) { if (e.op === 'summon') { const alive2 = this.foes.filter((x) => alive(x) && x.add && x.summoned).length; if (alive2 >= (e.max ?? 2)) return false; if (this.foes.filter(alive).length >= 7) return false; } } return true; }
  planFoe(f: Battler, ev: Ev[]) {
    f.action = null; if (f.forceSkillNow) { const id = f.forceSkillNow; f.forceSkillNow = null; if (this.skillAvailable(f, id)) { f.action = { type: 'skill', skill: id, targets: this.pickTargets(f, SPEC.skills[id]) }; return; } }
    if (f.tell) { const targets = f.tell.targets.filter((u) => this.party.find((p) => p.uid === u && p.hp > 0)); const sk = SPEC.skills[f.tell.skill]; f.action = { type: 'skill', skill: f.tell.skill, targets: targets.length || sk.scope.startsWith('all') ? (sk.scope.startsWith('all') ? this.heroes().map((h) => h.uid) : targets) : this.pickTargets(f, sk), exec: true }; return; }
    const pick = f.boss ? this.bossPick(f) : this.defaultPick(f);
    if (!pick) { f.action = { type: 'wait' }; return; }
    const sk = SPEC.skills[pick]; f.action = { type: 'skill', skill: pick, targets: this.pickTargets(f, sk), announce: !!sk.tell };
  }
  pickTargets(f: Battler, sk: any): number[] {
    const sc = sk.scope; const foes = f.side === 'foe' ? this.heroes() : this.foesAlive(); const own = f.side === 'foe' ? this.foesAlive() : this.heroes();
    if (sc === 'self') return [f.uid]; if (sc === 'all_enemies') return foes.map((x) => x.uid); if (sc === 'all_allies') return own.map((x) => x.uid);
    if (sc === 'one_ally') { const w = own.slice().sort((a, b) => a.hp / a.mhp - b.hp / b.mhp)[0]; return w ? [w.uid] : [f.uid]; }
    if (sc === 'random_enemy') return foes.length ? [foes[rint(this.rng, foes.length)].uid] : [];
    const taunt = foes.find((x) => x.states.taunt); if (taunt) return [taunt.uid]; return foes.length ? [foes[rint(this.rng, foes.length)].uid] : [];
  }
  defaultRating(f: Battler, id: string): number {
    const s = SPEC.skills[id]; if (!s) return 0; const hurt = this.foesAlive().some((x) => x.hp / x.mhp < 0.5);
    if (s.tell) return this.round % 3 === 0 && !f.states.gathering ? 6 : 0;
    if (id === 'e_wait') return 1;
    if (s.type === 'support') { const ef = s.effects || []; if (ef.some((e: any) => e.op === 'heal' || e.op === 'healPct')) return hurt ? 6 : 0; if (ef.some((e: any) => e.op === 'state' && f.states[e.id])) return 0; if (s.scope === 'self') return f.states.veiled || f.states.guard ? 0 : 2; return 2; }
    if (s.type === 'special') return this.skillAvailable(f, id) ? 3 : 0;
    if (id === 'e_strike') return 5; if (/_t1$/.test(id)) return 4;
    if (s.scope === 'all_enemies') return this.heroes().length >= 2 ? 3 : 1;
    return (s.effects || []).length ? 3 : 4;
  }
  weighted(list: { id: string; r: number }[]): string | null {
    list = list.filter((x) => x.r > 0); if (!list.length) return null; const mx = Math.max(...list.map((x) => x.r)); const c = list.filter((x) => x.r > mx - 3); const tot = c.reduce((s, x) => s + (x.r - (mx - 3)), 0); let r = this.rng() * tot;
    for (const x of c) { r -= x.r - (mx - 3); if (r <= 0) return x.id; } return c[0].id;
  }
  defaultPick(f: Battler): string | null { const form = this.form(f); const ids: string[] = form?.skills?.length ? form.skills : f.skills; return this.weighted(ids.filter((id) => this.skillAvailable(f, id)).map((id) => ({ id, r: this.defaultRating(f, id) }))); }
  bossPick(f: Battler): string | null {
    const ph = f.phase || f.def.phases[0]; const adds = this.foes.filter((x) => alive(x) && x.add).length; const out: { id: string; r: number }[] = [];
    for (const p of ph.patterns) { const c = p.cond || {}; let ok = true; if (c.turnMod) ok = this.round % c.turnMod[0] === c.turnMod[1]; if (ok && c.hpPctBelow !== undefined) ok = (f.hp / f.mhp) * 100 < c.hpPctBelow; if (ok && c.realm) ok = c.realm === this.realm; if (ok && !this.skillAvailable(f, p.skill)) ok = false; const fs = this.form(f)?.skills; if (ok && fs && fs.length && !fs.includes(p.skill)) ok = false; if (ok && SPEC.skills[p.skill]?.tell && f.states.gathering) ok = false; if (ok) out.push({ id: p.skill, r: p.rating }); }
    void adds; return this.weighted(out);
  }
  // troop events + phases -------------------------------------------------
  evCond(c: any, f: Battler): boolean {
    if (c.turn !== undefined && this.round !== c.turn) return false; if (c.turnEvery !== undefined && !(this.round >= (c.offset || 0) && (this.round - (c.offset || 0)) % c.turnEvery === 0)) return false;
    if (c.turnAtLeast !== undefined && this.round < c.turnAtLeast) return false; if (c.hpPctBelow !== undefined && !((f.hp / f.mhp) * 100 < c.hpPctBelow)) return false; if (c.stateOn && !f.states[c.stateOn]) return false; return true;
  }
  runTroopEvents(ev: Ev[], _when: string) {
    const evs = this.troop.events || []; const boss = this.foes.find((f) => f.boss); if (!boss || !alive(boss)) return;
    for (const e of evs) { if (!this.evCond(e.cond, boss)) continue; if (e.span === 'battle' && this.evFired.has(e.id)) continue; if (e.span === 'battle') this.evFired.add(e.id);
      for (const o of e.do) this.runOp(o, boss, ev); }
  }
  runOp(o: any, boss: Battler, ev: Ev[]) {
    switch (o.op) {
      case 'say': ev.push({ t: 'say', text: o.text, who: boss.uid }); break;
      case 'tutorial': this.tutorials.push(o.id); ev.push({ t: 'tutorial', id: o.id }); break;
      case 'state': { if (o.id === 'enrage') { const cur = boss.states.enrage; const n = Math.min(8, (cur?.n || 0) + 1); boss.states.enrage = { t: 99, n }; if (n === 1) ev.push({ t: 'state', target: boss.uid, id: 'enrage', on: true }); } else this.setState(boss, o.id, o.turns ?? this.stateDef(o.id).turns, ev); break; }
      case 'useSkill': boss.forceSkillNow = o.skill; break;
      case 'summon': case 'summonFree': { const n = o.count || 1; this.summon(boss, o.enemy, n, o.max ?? 3, ev, o.op === 'summonFree'); break; }
      default: break;
    }
  }
  summon(src: Battler, eid: string, count: number, max: number, ev: Ev[], free = false) {
    const made: Battler[] = []; for (let i = 0; i < count; i++) { const cur = this.foes.filter((x) => alive(x) && x.add && x.summoned).length; if (!free && cur >= max) break; if (this.foes.filter(alive).length >= 7) break; const lv = Math.max(1, Math.min(src.level, SPEC.enemies[eid]?.level_range?.[1] ?? src.level)); const f = this.makeFoe(eid, lv, this.foes.length, { add: true }); f.summoned = true; f.add = true; this.foes.push(f); made.push(f); this.addsSummoned++; }
    if (made.length) ev.push({ t: 'summon', src: src.uid, ids: made.map((m) => m.uid) });
  }
  checkPhases(ev: Ev[]) {
    for (const f of this.foes) { if (!f.boss || !alive(f)) continue; const phases = f.def.phases;
      for (const p of phases) { if (f.phasesDone.has(p.id)) continue; const en = p.enter || {}; let go = false; if (en.battleStart) go = true; if (en.hpPctBelow !== undefined && (f.hp / f.mhp) * 100 < en.hpPctBelow) go = true; if (en.addsDead && !this.foes.some((x) => x.add && alive(x))) go = true; if (en.stateOn && f.states[en.stateOn]) go = true; if (!go) continue;
        f.phasesDone.add(p.id); f.phase = p; if (!en.battleStart) ev.push({ t: 'phase', id: p.id, name: p.name, who: f.uid }); for (const o of p.onEnter || []) this.runOp(o, f, ev); } }
  }
  // ---------------------------------------------------------------- states
  setState(b: Battler, id: string, turns: number, ev: Ev[], chance = 1, fromBoss = false): boolean {
    const sd = SPEC.states[id]; if (!sd) return false; if (b.hp <= 0) return false; let c = chance; if (b.boss) c *= b.def.statusResist ?? 0.5;
    for (const t of b.bondTraits) { if (t.stateImmune?.includes(id)) return false; if (t.stateResist?.[id]) c *= 1 - t.stateResist[id]; }
    if (sd.kind === 'control' && b.controlImmune > 0) return false;
    if (c < 1 && this.rng() >= c) return false;
    if (id === 'hollow_touch') { const cur = b.states[id]; const cap = 3; const n = Math.min(cap, (cur?.n || 0) + 1); b.states[id] = { t: 99, n }; b.msp = Math.round(b.base.msp * (1 - 0.1 * n)); b.sp = Math.min(b.sp, b.msp); ev.push({ t: 'state', target: b.uid, id, on: true, n }); return true; }
    const had = !!b.states[id]; b.states[id] = { t: turns || sd.turns }; if (!had) ev.push({ t: 'state', target: b.uid, id, on: true }); if (b.boss && sd.kind === 'control') b.controlImmune = 2; void fromBoss;
    if (id === 'gathering' || (id === 'dazed' && b.tell && c >= 1)) { /* handled in cancel */ }
    if ((id === 'stun' || id === 'dazed') && b.tell && id === 'stun') { b.tell = null; delete b.states.gathering; ev.push({ t: 'tellcancel', target: b.uid }); }
    return true;
  }
  clearState(b: Battler, id: string, ev: Ev[]) { if (b.states[id]) { delete b.states[id]; if (id === 'hollow_touch') b.msp = b.base.msp; ev.push({ t: 'state', target: b.uid, id, on: false }); } }
  // ---------------------------------------------------------------- damage
  hitChance(a: Battler, t: Battler, sk: any) { if (sk.type !== 'phys') return 1; return Math.max(0.05, 0.95 * this.traitMul(a, 'hit') - this.traitSum(t, 'eva')); }
  computeDamage(a: Battler, sk: any, t: Battler, force?: { noCrit?: boolean }) {
    const d = sk.damage; const A = this.statKey(a, d.stat, sk); const D = this.stat(t, d.def);
    const rawA = A * 4 * d.pow + d.flat; let base = Math.max(Math.ceil(0.1 * rawA), 1, rawA - D * 2); if (d.mult && d.mult !== 4) { const rawB = A * d.mult * d.pow + d.flat; base = Math.max(Math.ceil(0.1 * rawB), 1, rawB - D * 2); }   // damage floor: 10% of raw
    let el = sk.element; const er = this.rate(t, el); let mult = er; const weak = er >= 1.5; const resist = er > 0 && er <= 0.5; const immune = er === 0;
    if (a.side === 'party' && (el === 'lumen' || el === 'umbra')) mult *= this.realm === 'far' ? 1.25 : 0.85;
    if (a.side === 'foe') { const f = this.form(a); if (f?.outputMult !== undefined) mult *= f.outputMult; mult *= 1 + 0.08 * (a.states.enrage?.n || 0); if (this.ctx.difficulty === 'gentle') mult *= 0.75; else if (this.ctx.difficulty === 'tough') mult *= 1.15; }
    for (const tb of a.bondTraits) if (tb.elemDmg?.[el]) mult *= tb.elemDmg[el];
    mult *= this.traitMul(t, 'dmgTaken'); if (t.states.unveiled) { /* included in dmgTaken trait */ }
    if (sk.type === 'phys') for (const tb of t.bondTraits) if (tb.physTaken) mult *= tb.physTaken;
    if (t.boss && d.bossMult !== undefined) mult *= d.bossMult;
    let crit = false; const cc = 0.05 + this.traitSum(a, 'crit'); if (!force?.noCrit && d.crit !== false && (t.states.marked || this.rng() < cc)) crit = true; if (crit) mult *= 2;
    const amp = 10; const v = rint(this.rng, amp + 1) + rint(this.rng, amp + 1) - amp; mult *= 1 + v / 100;
    let dmg = Math.round(base * mult); if (!immune) dmg = Math.max(1, dmg); else dmg = 0;
    return { dmg, crit, weak, resist, immune, er };
  }
  hurt(a: Battler, t: Battler, dmg: number, ev: Ev[], info: any) {
    if (t.hp <= 0) return; t.hp = Math.max(0, t.hp - dmg); ev.push({ t: 'hit', actor: a.uid, target: t.uid, dmg, crit: info.crit, weak: info.weak, resist: info.resist, immune: info.immune, hp: t.hp });
    if (t.states.exposed) this.clearState(t, 'exposed', ev); if (t.states.marked && info.crit) this.clearState(t, 'marked', ev);
    if (t.side === 'foe') { if (dmg > 0) { if (t.calm) { t.calm = false; delete t.states.calm; t.mood = Math.max(0, t.mood - 30); ev.push({ t: 'calmbreak', target: t.uid }); } else t.mood = Math.max(0, t.mood - 10); } }
    else { t.gauge = Math.min(100, t.gauge + Math.floor((50 * dmg) / t.mhp * (1 + t.bondTraits.reduce((n: number, x: any) => n + (x.bondGain || 0), 0)))); }
    if (t.hp <= 0) { t.hp = 0; this.onDown(t, ev); }
  }
  onDown(t: Battler, ev: Ev[]) { for (const k of Object.keys(t.states)) { if (['burn', 'chill', 'wilt', 'calm', 'gathering', 'guard', 'possessed', 'taunt'].includes(k)) delete t.states[k]; } t.tell = null; ev.push({ t: 'down', target: t.uid }); }
  // ---------------------------------------------------------------- acting
  act(b: Battler): { ev: Ev[]; weak: boolean; echoable: boolean } {
    const ev: Ev[] = []; const res = { ev, weak: false, echoable: false }; if (!alive(b) && !(b.side === 'party' && b.hp > 0)) return res;
    if (b.hp <= 0 || b.gone) return res;
    ev.push({ t: 'turn', actor: b.uid }); b.turns++; if (b.states.guard) this.clearState(b, 'guard', ev);
    // start of turn
    if (b.side === 'foe') { this.foeTurnStart(b, ev); if (b.hp <= 0 || b.gone) return res; }
    const sk = b.states.stun ? 'stun' : b.unveilSkip ? 'unveil' : null;
    if (sk) { if (sk === 'unveil') b.unveilSkip = false; else delete b.states.stun; ev.push({ t: 'skip', actor: b.uid, why: sk }); if (b.tell) { b.tell = null; this.clearState(b, 'gathering', ev); ev.push({ t: 'tellcancel', target: b.uid }); } this.turnEnd(b, ev); return res; }
    if (b.states.dazed && this.rng() < (this.traitSum(b, 'actionFail') || 0.25)) { ev.push({ t: 'fizzle', actor: b.uid }); if (b.tell) { b.tell = null; this.clearState(b, 'gathering', ev); ev.push({ t: 'tellcancel', target: b.uid }); } this.turnEnd(b, ev); return res; }
    const a = b.action; if (a) {
      if (a.type === 'wait' || b.states.calm) { if (b.states.calm) ev.push({ t: 'calmwait', actor: b.uid }); }
      else if (a.type === 'guard') { this.setState(b, 'guard', 1, ev); b.gauge = Math.min(100, b.gauge + 10 + (b.bondTraits.find((x) => x.guardBond)?.guardBond || 0)); ev.push({ t: 'guard', actor: b.uid }); }
      else if (a.type === 'shift') this.doShift(b, ev);
      else if (a.type === 'possess') this.doPossess(b, ev);
      else if (a.type === 'item') this.doItem(b, a.item, a.targets, ev);
      else if (a.type === 'summon') this.doSummon(b, a.summon, ev);
      else if (a.type === 'offer') this.doOffer(b, a.item, a.targets[0], ev);
      else if (a.type === 'skill') { const r = this.useSkill(b, a, ev); res.weak = r.weak; res.echoable = r.echoable; }
    }
    b.action = null; this.afterAction(ev); if (this.ended) return res; this.turnEnd(b, ev); this.afterAction(ev); return res;
  }
  afterAction(ev: Ev[]) {
    this.checkPhases(ev);
    if (!this.addsEchoGiven && this.addsSummoned > 0 && this.round < 6 && this.bossDef && !this.foes.some((x) => x.add && alive(x)) && this.foes.some((x) => x.boss && alive(x))) { this.addsEchoGiven = true; this.echo = Math.min(3, this.echo + 1); ev.push({ t: 'echo', n: this.echo, why: 'adds' }); }
    if (this.foes.every((f) => !alive(f))) this.ended = 'win'; else if (this.party.every((p) => p.hp <= 0)) this.ended = 'lose';
  }
  foeTurnStart(f: Battler, ev: Ev[]) {
    const dr = (SPEC.parley.temperaments[f.temper]?.drift) || 0;
    if (f.calm) { f.calmTurns++; if (f.calmTurns > 3 && !f.boss) { f.gone = 'left'; ev.push({ t: 'leave', target: f.uid }); } return; }
    if (dr && !f.boss) { f.mood = Math.max(0, Math.min(f.moodMax, f.mood + dr)); }
  }
  turnEnd(b: Battler, ev: Ev[]) {
    if (b.hp <= 0) return;
    for (const id of Object.keys(b.states)) { const td = this.stateDef(id); for (const t of td.traits) { if (t.dot) { const d = Math.max(1, Math.floor(b.mhp * t.dot)); b.hp = Math.max(0, b.hp - d); ev.push({ t: 'dot', target: b.uid, id, dmg: d, hp: b.hp }); if (b.hp <= 0) { this.onDown(b, ev); return; } } if (t.regen) { const h = Math.floor(b.mhp * t.regen); b.hp = Math.min(b.mhp, b.hp + h); ev.push({ t: 'heal', target: b.uid, amt: h, hp: b.hp }); } } }
    if (b.side === 'party' && b.cd) for (const k of Object.keys(b.cd)) if (b.cd[k] > 0) b.cd[k]--;
    if (b.side === 'party') { const rg = b.bondTraits.reduce((n: number, x: any) => n + (x.regen || 0), 0); if (rg && b.hp > 0) { const h = Math.max(1, Math.floor(b.mhp * rg)); if (b.hp < b.mhp) { b.hp = Math.min(b.mhp, b.hp + h); ev.push({ t: 'heal', target: b.uid, amt: h, hp: b.hp }); } } }
    if (b.side === 'party') { const sr = b.bondTraits.find((x) => x.spRegen)?.spRegen; if (sr) { b.sp = Math.min(b.msp, b.sp + sr); ev.push({ t: 'sp', target: b.uid, amt: sr }); } }
    for (const id of Object.keys(b.states)) { const s = b.states[id]; if (s.t >= 99) continue; s.t--; if (s.t <= 0) { delete b.states[id]; ev.push({ t: 'state', target: b.uid, id, on: false }); } }
    for (const p of Object.keys(b.stages)) { const s = b.stages[p]; if (s.t >= 99) continue; s.t--; if (s.t <= 0) delete b.stages[p]; }
    if (b.controlImmune > 0) b.controlImmune--; if (b.shiftCd < 0) b.shiftCd = 0;
    if (b.states.unveiled === undefined && b.unveilRefill) { /* noop */ }
    if (b.vpMax && b.vp === 0 && !b.states.unveiled) { b.vp = b.vpMax; ev.push({ t: 'vp', target: b.uid, vp: b.vp, refill: true }); }
  }
  endRound(): Ev[] {
    const ev: Ev[] = [];
    if (this.realm === 'far') { let d = 1 + Math.min(0, ...this.party.map((p) => p.bondTraits.reduce((s, t) => s + (t.lumenDrain || 0), 0))); d = Math.max(0, d); if (this.ctx.difficulty === 'gentle') d *= 0.5; this.lumen = Math.max(0, this.lumen - d); ev.push({ t: 'lumen', v: this.lumen }); if (this.lumen <= 0) { this.realm = 'near'; ev.push({ t: 'forcedShift' }); } }
    else { this.lumen = Math.min(this.lumenMax, this.lumen + 1); ev.push({ t: 'lumen', v: this.lumen }); }
    if (this.ctx.warmth) for (const p of this.party) if (alive(p)) { const n = Math.min(Math.max(1, Math.round(p.mhp * 0.03 * this.ctx.warmth)), p.mhp - p.hp); if (n > 0) { p.hp += n; ev.push({ t: 'heal', target: p.uid, amt: n, hp: p.hp } as any); } }
    if (this.lockRealm > 0) this.lockRealm--;
    for (const f of this.foes) if (f.boss && alive(f) && f.hp / f.mhp > 0) { /* enrage by troop event next round */ }
    return ev;
  }
  checkEnd(): '' | 'win' | 'lose' { if (this.ended === 'win' || this.ended === 'lose') return this.ended; if (this.foes.every((f) => !alive(f))) return (this.ended = 'win'); if (this.party.every((p) => p.hp <= 0)) return (this.ended = 'lose'); return ''; }
  // ---- skills
  targetsOf(user: Battler, sk: any, uids: number[]): Battler[] {
    const all = [...this.party, ...this.foes]; let ts = uids.map((u) => all.find((x) => x.uid === u)!).filter(Boolean);
    const sc = sk.scope; const opp = user.side === 'party' ? this.foesAlive() : this.heroes(); const own = user.side === 'party' ? this.heroes() : this.foesAlive();
    if (sc === 'all_enemies') return opp; if (sc === 'all_allies') return own; if (sc === 'self') return [user];
    if (sc === 'one_dead_ally') return ts.filter((t) => t.hp <= 0);
    ts = ts.filter((t) => (sc === 'one_enemy' || sc === 'random_enemy') ? (user.side === 'party' ? alive(t) : t.hp > 0) : t.hp > 0 && !t.gone);
    if (!ts.length && (sc === 'one_enemy' || sc === 'random_enemy')) return opp.length ? [opp[rint(this.rng, opp.length)]] : [];
    if (!ts.length && sc === 'one_ally') return [user];
    return ts;
  }
  canUse(b: Battler, id: string): { ok: boolean; why?: string } {
    const s = SPEC.skills[id]; if (!s) return { ok: false, why: 'unknown' };
    const csp = this.skillSp(b, s); if (b.sp < csp) return { ok: false, why: 'SP' };
    if (s.cost.echo && this.echo < s.cost.echo) return { ok: false, why: 'Echo' }; if (s.cost.lumen && this.lumen < s.cost.lumen) return { ok: false, why: 'Lumen' };
    if (b.cd?.[id] > 0) return { ok: false, why: 'Cooldown ' + b.cd[id] }; if (s.oncePerBattle && b.once?.[id]) return { ok: false, why: 'Used' };
    if (s.combo) { const mem = this.party.filter((x) => s.combo.members.includes(x.actorId || '')); if (mem.length < s.combo.members.length || mem.some((x) => x.hp <= 0 || x.sp < (s.combo.costEach?.sp || 0))) return { ok: false, why: 'Unison' }; } if (s.cost.bond && b.gauge < s.cost.bond) return { ok: false, why: 'Bond' };
    const ef = s.effects || [];
    if (ef.some((e: any) => e.op === 'shift')) { if (b.states.bound) return { ok: false, why: 'Bound' }; if (this.lockRealm > 0 || b.states.anchored) return { ok: false, why: 'Anchored' }; if (b.shiftCd > 0) return { ok: false, why: 'Cooldown' }; if (this.realm === 'near' && this.lumen < 10) return { ok: false, why: 'Lumen' }; }
    if (ef.some((e: any) => e.op === 'send')) { /* checked on target */ }
    return { ok: true };
  }
  skillSp(b: Battler, s: any) { let c = s.cost.sp || 0; if (b.states.fading && s.element === 'lumen') c = Math.ceil(c * 1.5); return c; }
  useSkill(b: Battler, a: any, ev: Ev[]): { weak: boolean; echoable: boolean } {
    let id = a.skill; const out = { weak: false, echoable: false };
    if (b.states.possessed && id === 'p_attack' && b.bond) { const bs = SPEC.enemies[b.bond]?.bond?.skill; if (bs && SPEC.skills[bs]) id = bs; }
    const s = SPEC.skills[id]; if (!s) return out; const targets = this.targetsOf(b, s, a.targets); if (!targets.length && s.scope !== 'self') return out;
    if (b.side === 'party' && !a.free) { b.sp -= this.skillSp(b, s); if (s.cost.bond) b.gauge -= s.cost.bond;
      if (s.cost.echo) { this.echo -= s.cost.echo; ev.push({ t: 'echo', n: this.echo, why: 'spend' }); } if (s.cost.lumen) { this.lumen = Math.max(0, this.lumen - s.cost.lumen); ev.push({ t: 'lumen', v: this.lumen }); }
      if (s.cooldown) (b.cd ||= {})[id] = s.cooldown + 1; if (s.oncePerBattle) (b.once ||= {})[id] = true;
      if (s.combo) for (const x of this.party) if (x !== b && s.combo.members.includes(x.actorId || '')) { const c = s.combo.costEach?.sp || 0; x.sp = Math.max(0, x.sp - c); ev.push({ t: 'sp', target: x.uid, amt: -c }); } }
    if (s.tell && b.side === 'foe' && !a.exec) { // announce
      b.tell = { skill: id, targets: targets.map((t) => t.uid) }; b.states.gathering = { t: 2 }; ev.push({ t: 'tell', actor: b.uid, skill: id, name: s.name, targets: targets.map((t) => t.uid) }); return out; }
    if (a.exec) { b.tell = null; delete b.states.gathering; ev.push({ t: 'state', target: b.uid, id: 'gathering', on: false }); }
    ev.push({ t: 'use', actor: b.uid, skill: id, name: s.name, anim: s.anim, se: s.se, element: s.element, type: s.type, targets: targets.map((t) => t.uid) });
    if (s.damage) {
      const hits = s.hits || 1; let anyWeak = false; let weakTargets = 0;
      for (const t of targets) { let first = true; for (let h = 0; h < hits; h++) { if (t.hp <= 0) break; if (!first) { /* subsequent hits */ } first = false;
        if (this.rng() >= this.hitChance(b, t, s)) { ev.push({ t: 'miss', actor: b.uid, target: t.uid }); continue; }
        const info = this.computeDamage(b, s, t, {}); this.hurt(b, t, info.dmg, ev, info); if (b.side === 'party') { if (info.weak) { anyWeak = true; weakTargets++; b.gauge = Math.min(100, b.gauge + 8); t.revealed.add(this.realm + ':' + s.element); this.weakHitsDealt++; } else if (info.resist) { /* resist hint not stored */ } }
        if (t.hp > 0 && b.side === 'party' && info.weak && t.vpMax && t.vp > 0 && h === 0) { t.vp--; ev.push({ t: 'vp', target: t.uid, vp: t.vp }); if (t.vp <= 0) this.unveil(t, ev); }
        if (t.hp > 0) this.applyEffects(b, s, t, ev, { dmg: info.dmg, el: s.element }, true); }
      }
      // non-damage effects with no per-target phase (e.g. all-target) already applied in loop
      if (anyWeak && b.side === 'party') { out.weak = true; this.echo = Math.min(3, this.echo + 1); ev.push({ t: 'echo', n: this.echo, why: 'weak' }); this.weakSeen.add(s.element); }
      out.echoable = !s.tags?.includes('parley') && b.side === 'party';
      if (s.vpDamage || (b.side === 'party' && s.school === 'veil')) for (const t of targets) this.vpHit(t, (s.vpDamage || 0) + (b.side === 'party' ? b.bondTraits.reduce((n: number, tt: any) => n + (tt.vpDamage || 0), 0) * (s.school === 'veil' ? 1 : 0) : 0), ev);
    } else {
      this.applyEffects(b, s, null, ev, { targets }, false, targets);
      if (s.vpDamage) for (const t of targets) this.vpHit(t, s.vpDamage, ev);
      out.echoable = false;
    }
    if (b.side === 'party' && !s.tags?.includes('summon') && s.id !== 'sp_resonance') this.lastParty = { user: b, skill: id, targets: targets.map((x) => x.uid) };
    return out;
  }
  vpHit(t: Battler, n: number, ev: Ev[]) { if (t.side !== 'foe' || !t.vpMax || t.vp <= 0 || t.hp <= 0) return; t.vp = Math.max(0, t.vp - n); ev.push({ t: 'vp', target: t.uid, vp: t.vp }); if (t.vp <= 0) this.unveil(t, ev); }
  lastParty: { user: Battler; skill: string; targets: number[] } | null = null; summonsUsed = new Set<string>(); summonRound = -1; fleeFree = 0;
  unveil(t: Battler, ev: Ev[]) { t.states.unveiled = { t: 2 }; t.unveilSkip = true; if (t.tell) { t.tell = null; delete t.states.gathering; ev.push({ t: 'tellcancel', target: t.uid }); } ev.push({ t: 'unveil', target: t.uid }); }
  applyEffects(b: Battler, s: any, t: Battler | null, ev: Ev[], info: any, perTarget: boolean, targets?: Battler[]) {
    const efs = s.effects || []; const tl = t ? [t] : targets || [];
    for (const e of efs) {
      switch (e.op) {
        case 'state': for (const x of tl) { if (e.target === 'self') continue; const ok = this.setState(x, e.id, e.turns ?? this.stateDef(e.id).turns, ev, Math.min(1, (e.chance ?? 1) + (b.side === 'party' && (e.id === 'stun' || e.id === 'dazed') && (e.chance ?? 1) < 1 ? b.bondTraits.reduce((n: number, t: any) => n + (t.statusChance || 0), 0) : 0))); if (ok && x.tell && e.id === 'dazed' && (e.chance ?? 1) >= 1) { x.tell = null; this.clearState(x, 'gathering', ev); ev.push({ t: 'tellcancel', target: x.uid }); } if (ok && e.id === 'guard' && x === b && b.side === 'party') { /* gauge via guard action */ } } break;
        case 'allyState': for (const x of this.sideOf(b)) if (x.hp > 0) this.setState(x, e.id, e.turns, ev); break;
        case 'buff': case 'debuff': for (const x of tl) { if (e.chance !== undefined && e.chance < 1) { let c = e.chance; if (x.boss) c *= 0.5; if (this.rng() >= c) continue; } this.addStage(x, e.param, e.stage, e.turns || 3); ev.push({ t: 'stage', target: x.uid, param: e.param, stage: e.stage }); } break;
        case 'heal': for (const x of tl) { if (x.hp <= 0) continue; const amt = Math.round((e.base || 0) + this.stat(b, e.stat || 'mat') * (e.mult || 1)); this.heal(x, amt, ev); } break;
        case 'healPct': for (const x of tl) { if (x.hp <= 0) continue; this.heal(x, Math.round(x.mhp * e.pct), ev); } break;
        case 'healPctAllies': for (const x of this.sideOf(b)) if (x.hp > 0) this.heal(x, Math.round(x.mhp * e.pct), ev); break;
        case 'cure': for (const x of tl) for (const id of e.ids) { if (x.states[id]) this.clearState(x, id, ev); } break;
        case 'cureAll': for (const x of tl) for (const id of Object.keys(x.states)) if (['burn', 'chill', 'wilt', 'dazed', 'blind', 'hollow_touch', 'bound'].includes(id)) this.clearState(x, id, ev); break;
        case 'spGain': for (const x of tl) { x.sp = Math.min(x.msp, x.sp + e.value); ev.push({ t: 'sp', target: x.uid, amt: e.value }); } break;
        case 'spDrain': for (const x of tl) { const d = Math.min(x.sp, e.value); x.sp -= d; ev.push({ t: 'sp', target: x.uid, amt: -d }); } break;
        case 'mood': { for (const x of tl) { if (x.side !== 'foe') continue; if (s.id === 'mio_name_call' && x.kind !== 'hollowed') continue; let v = e.value; if (s.id === 'mio_soothe') v = SPEC.parley.temperaments[x.temper].soothe; this.addMood(b, x, v, ev, s.id === 'parley_mock' ? 'mock' : s.id); if (s.id === 'parley_mock') this.setState(x, 'exposed', 1, ev); } break; }
        case 'parleyVerb': for (const x of tl) { if (x.side === 'foe') this.parleyVerb(b, x, e.verb, ev, a_item(info)); } break;
        case 'selfMood': case 'moodSelf': b.mood = Math.max(0, Math.min(b.moodMax, b.mood + e.value)); break;
        case 'reveal': for (const x of tl) { if (x.side !== 'foe') continue; const f = this.form(x); if (!f) continue; for (const [el, r] of Object.entries(f.rates || {})) if ((r as number) >= 1.5) x.revealed.add(this.realm + ':' + el); if (e.what === 'weakness_both') for (const rr of ['near', 'far']) for (const [el, r] of Object.entries(x.forms[rr].rates || {})) if ((r as number) >= 1.5) x.revealed.add(rr + ':' + el); ev.push({ t: 'reveal', target: x.uid }); } break;
        case 'gold': this.goldBonus += e.value; ev.push({ t: 'gold', v: e.value }); break;
        case 'summon': this.summon(b, e.enemy, e.count || 1, e.max ?? 2, ev); break;
        case 'send': for (const x of tl) this.doSend(b, x, ev); break;
        case 'invite': for (const x of tl) this.doInvite(b, x, ev); break;
        case 'shift': this.doShift(b, ev, true); break;
        case 'echo': this.echo = Math.min(3, this.echo + (e.n || e.value || 1)); ev.push({ t: 'echo', n: this.echo }); break;
        case 'echoLast': { const L = this.lastParty; const sk2 = L && SPEC.skills[L.skill]; if (!L || !sk2) break; const ts = L.targets.map((u) => this.foes.find((f) => f.uid === u)).filter((f) => f && alive(f)) as Battler[]; const pool = ts.length ? ts : this.foesAlive().slice(0, 1);
          ev.push({ t: 'use', actor: b.uid, skill: L.skill, name: 'Resonance: ' + sk2.name, anim: sk2.anim, se: sk2.se, element: sk2.element, type: sk2.type, targets: pool.map((x) => x.uid) });
          if (sk2.damage) for (const x of pool) { const inf = this.computeDamage(L.user, sk2, x, { noCrit: true }); inf.dmg = Math.max(1, Math.round(inf.dmg * (e.pct || 0.6))); this.hurt(b, x, inf.dmg, ev, inf); } break; }
        case 'removeStack': for (const x of (e.scope === 'self' ? [b] : tl)) { const st = x.states[e.id]; if (st) { st.n = (st.n || 1) - (e.n || 1); if (st.n <= 0) this.clearState(x, e.id, ev); else x.msp = Math.round(x.base.msp * (1 - 0.1 * st.n)); } } break;
        case 'cancelTell': for (const x of tl) if (x.tell) { x.tell = null; delete x.states.gathering; ev.push({ t: 'tellcancel', target: x.uid }); } break;
        case 'vpDamage': for (const x of tl) this.vpHit(x, e.value || 1, ev); break;
        case 'reviveAll': for (const x of this.party) if (x.hp <= 0) { x.hp = Math.max(1, Math.round(x.mhp * (e.pct || 0.5))); ev.push({ t: 'revive', target: x.uid, hp: x.hp }); } break;
        case 'lumen': this.lumen = Math.min(this.lumenMax, this.lumen + (e.value || 0)); ev.push({ t: 'lumen', v: this.lumen }); break;
        case 'goldBoost': this.goldPct += e.pct || 0; ev.push({ t: 'say', text: 'Gold +' + Math.round((e.pct || 0) * 100) + '% this battle!' }); break;
        case 'fleeGuaranteed': this.fleeFree = e.turns || 1; ev.push({ t: 'say', text: 'The way out is clear.' }); break;
        case 'revealNext': this.foesAlive().forEach((f) => { if (f.tell) f.revealed.add('tell'); }); break;
        case 'lockRealm': this.lockRealm = e.turns || 3; ev.push({ t: 'say', text: 'The realm is anchored.' }); break;
        case 'realmFlip': if (this.lockRealm <= 0) { this.realm = this.realm === 'near' ? 'far' : 'near'; ev.push({ t: 'realm', realm: this.realm, forced: true }); } break;
        case 'taunt': b.states.taunt = { t: e.turns || 2 }; break;
        case 'endBattle': this.ended = 'win'; break;
        default: break;
      }
    }
    void perTarget;
  }
  sideOf(b: Battler) { return b.side === 'party' ? this.party : this.foes; }
  heal(x: Battler, amt: number, ev: Ev[]) { if (x.states.dish_spilled) return; const a = Math.min(amt, x.mhp - x.hp); x.hp += a; ev.push({ t: 'heal', target: x.uid, amt: a, hp: x.hp }); }
  // ---- shift / possess / item
  doShift(b: Battler, ev: Ev[], viaSkill = false) {
    void viaSkill; const to: Realm = this.realm === 'near' ? 'far' : 'near'; if (b.states.bound || this.lockRealm > 0) { ev.push({ t: 'say', text: 'The Lantern will not turn!' }); return; }
    if (to === 'far') { if (this.lumen < 10) { ev.push({ t: 'say', text: 'Not enough Lumen.' }); return; } this.lumen -= 10; }
    this.realm = to; b.shiftCd = 2; ev.push({ t: 'realm', realm: to, by: b.uid }); ev.push({ t: 'lumen', v: this.lumen });
    // Flip Bonus: a hittable weakness is now exposed
    const known = new Set<string>(); for (const p of this.party) for (const sid of p.elemKnown) known.add(sid);
    const exposed = this.foesAlive().some((f) => { const r = this.form(f)?.rates || {}; return Object.entries(r).some(([el, v]) => (v as number) >= 1.5 && known.has(el)); });
    if (exposed) { this.echo = Math.min(3, this.echo + 1); ev.push({ t: 'echo', n: this.echo, why: 'flip' }); }
  }
  doPossess(b: Battler, ev: Ev[]) { if (!b.bond || b.gauge < 50) return; b.gauge -= 50; b.states.possessed = { t: 3 }; ev.push({ t: 'state', target: b.uid, id: 'possessed', on: true }); ev.push({ t: 'use', actor: b.uid, name: 'Possess', skill: 'bond_possess', anim: 'circle', se: 'powerup', targets: [b.uid] }); }
  doItem(b: Battler, id: string, uids: number[], ev: Ev[]) {
    const it = this.ctx.itemDB[id]; if (!it || !(this.ctx.items[id] > 0)) return; this.ctx.items[id]--; const e = it.effect || {}; ev.push({ t: 'use', actor: b.uid, name: it.name, item: id, targets: uids, se: e.damage ? 'explosion' : 'heal', anim: e.damage ? ({ flame: 'flam', lumen: 'spirit', umbra: 'spiritb', tide: 'water', bloom: 'plant', gale: 'cut' } as any)[e.damage.element] || 'spark' : 'spark' });
    const all = [...this.party, ...this.foes]; let ts = uids.map((u) => all.find((x) => x.uid === u)!).filter(Boolean);
    const foes = this.foesAlive(), allies = this.party;
    if (it.scope === 'allies') ts = allies.filter((x) => x.hp > 0); else if (it.scope === 'enemies') ts = foes;
    if (e.reviveAll) this.runOp({ op: 'reviveAll', pct: e.reviveAll }, b, ev);
    for (const t of ts) {
      if (t.side === 'party') {
        if (e.revive && t.hp <= 0) { t.hp = Math.max(1, Math.round(t.mhp * e.revive)); ev.push({ t: 'revive', target: t.uid, hp: t.hp }); continue; } if (t.hp <= 0) continue;
        if (e.hp) this.heal(t, e.hp, ev); if (e.hpPct) this.heal(t, Math.round(t.mhp * e.hpPct), ev);
        if (e.sp) { const d = Math.min(e.sp, t.msp - t.sp); t.sp += d; ev.push({ t: 'sp', target: t.uid, amt: d }); }
        if (e.cure) for (const c of e.cure) this.clearState(t, c, ev); if (e.cureAll) for (const sid of Object.keys(t.states)) if (['burn', 'chill', 'wilt', 'dazed', 'blind', 'bound', 'stun'].includes(sid)) this.clearState(t, sid, ev);
        if (e.removeStack && t.states[e.removeStack]) { const st = t.states[e.removeStack]; st.n = (st.n || 1) - 1; if (st.n <= 0) this.clearState(t, e.removeStack, ev); else t.msp = Math.round(t.base.msp * (1 - 0.1 * st.n)); }
        if (e.states && it.scope !== 'enemies') for (const st of e.states) this.setState(t, st.id, st.turns ?? this.stateDef(st.id).turns, ev, st.chance ?? 1);
      } else {
        if (t.hp <= 0 || t.gone) continue;
        if (e.damage) { const er = this.rate(t, e.damage.element); let dmg = Math.round(e.damage.value * (er === 0 ? 0 : er)); if (t.kind === 'hollowed' && /Hollowed/.test(it.desc || '')) dmg *= 2; const info = { crit: false, weak: er >= 1.5, resist: er > 0 && er <= 0.5, immune: er === 0 }; this.hurt(b, t, er === 0 ? 0 : Math.max(1, dmg), ev, info); if (t.hp > 0 && info.weak) t.revealed.add(this.realm + ':' + e.damage.element); }
        if (e.mood) this.addMood(b, t, e.mood, ev, 'item');
        if (e.vp) this.vpHit(t, e.vp, ev);
        if (e.states) for (const st of e.states) this.setState(t, st.id, st.turns ?? this.stateDef(st.id).turns, ev, st.chance ?? 1);
      }
    }
    if (e.echo) { this.echo = Math.min(3, this.echo + e.echo); ev.push({ t: 'echo', n: this.echo }); }
    if (e.lumen) { this.lumen = Math.min(this.lumenMax, this.lumen + e.lumen); ev.push({ t: 'lumen', v: this.lumen }); }
    if (e.escape) { this.ended = 'escape'; ev.push({ t: 'escape', ok: true }); }
  }
  // ---- Keepsake summons (summons.json): a pseudo-skill registered as SPEC.skills[sm_*] with tag 'summon'
  summonDef(id: string) { return SPEC.summons?.summons?.[id]; }
  canSummon(b: Battler, id: string): { ok: boolean; why?: string } {
    const d = this.summonDef(id); const s = SPEC.skills[id]; if (!d || !s) return { ok: false, why: 'none' }; const L = d.limits || {};
    if (this.summonsUsed.has(id)) return { ok: false, why: 'Used' }; if (this.summonRound === this.round) return { ok: false, why: 'Once/round' };
    if (L.notRound1 && this.round <= 1) return { ok: false, why: 'Round 2+' };
    if (L.requires?.nameFragments && (this.ctx.flags.fragments || 0) < L.requires.nameFragments) return { ok: false, why: L.requires.nameFragments + ' Fragments' };
    if (b.sp < d.cost.sp) return { ok: false, why: 'SP' }; if (this.lumen < d.cost.lumen) return { ok: false, why: 'Lumen' }; if (this.echo < (d.cost.echo || 0)) return { ok: false, why: 'Echo' };
    if (d.cost.lumen && !this.party.some((p) => p.actorId === 'mio' && p.hp > 0)) return { ok: false, why: 'Mio down' };
    return { ok: true };
  }
  doSummon(b: Battler, id: string, ev: Ev[]) {
    const d = this.summonDef(id); if (!d || !this.canSummon(b, id).ok) return; b.sp -= d.cost.sp; this.lumen = Math.max(0, this.lumen - d.cost.lumen); this.echo -= d.cost.echo || 0; this.summonsUsed.add(id); this.summonRound = this.round;
    ev.push({ t: 'summon', actor: b.uid, id, name: d.name, anim: d.anim, element: d.element, tier: d.tier }); ev.push({ t: 'lumen', v: this.lumen }); if (d.cost.echo) ev.push({ t: 'echo', n: this.echo, why: 'spend' });
    const tg = (d.scope === 'all_enemies' ? this.foesAlive() : d.scope === 'all_allies' ? this.heroes() : d.scope === 'self' ? [b] : this.foesAlive().slice(0, 1)).map((x) => x.uid);
    this.useSkill(b, { skill: id, targets: tg, free: true }, ev);
  }
  // ---- parley
  addMood(user: Battler, x: Battler, v: number, ev: Ev[], verbName: string) {
    if (x.gone || x.hp <= 0) return; if (v > 0) { if (x.states.unveiled) v *= 2; if (this.ctx.difficulty === 'gentle') v = Math.round(v * 1.25); const pb = user.bondTraits.find((t: any) => t.parleyBonus?.[verbName])?.parleyBonus?.[verbName]; if (pb) v += pb; if (user.side === 'party') v = Math.round(v * (1 + user.bondTraits.reduce((n: number, t: any) => n + (t.mood || 0), 0))); if (user.side === 'party') user.gauge = Math.min(100, user.gauge + 5); }
    x.mood = Math.max(0, Math.min(x.moodMax, x.mood + v)); this.parleyActs++; ev.push({ t: 'mood', target: x.uid, v, mood: x.mood, verb: verbName }); this.checkCalm(x, ev);
  }
  checkCalm(x: Battler, ev: Ev[]) { if (!x.calm && x.mood >= x.calmAt) { x.calm = true; x.calmTurns = 0; x.states.calm = { t: 99 }; if (x.tell) { x.tell = null; delete x.states.gathering; ev.push({ t: 'tellcancel', target: x.uid }); } ev.push({ t: 'calm', target: x.uid }); } }
  parleyVerb(user: Battler, x: Battler, verb: string, ev: Ev[], item?: string) {
    const tt = SPEC.parley.temperaments[x.temper]; let v = tt[verb] ?? 0; const key = x.def?.parley?.key;
    if (verb === 'offer' && item) { const it = this.ctx.itemDB[item]; const cats: string[] = it?.cats || []; const liked = item === key?.item || x.likes.some((l) => cats.includes(l) || l === item) || (key?.item && item === key.item); const dis = x.dislikes.some((l) => cats.includes(l) || l === item); v = liked ? tt.offer[1] : dis ? tt.offer[2] : tt.offer[0]; if (liked) x.offered = true; if (this.ctx.items[item] !== undefined) this.ctx.items[item] = Math.max(0, this.ctx.items[item] - 1); }
    let keyHit = false; if (key && key.verb === verb && (verb !== 'offer' || key.item === item || !key.item)) { x.keyCount[verb] = (x.keyCount[verb] || 0) + 1; if (x.keyCount[verb] >= (key.times || 1)) keyHit = true; }
    if (x.states.nameless && (verb === 'remember' || verb === 'hum')) v = 0;
    this.addMood(user, x, v, ev, verb);
    if (keyHit && !x.calm) { x.mood = Math.max(x.mood, x.calmAt); ev.push({ t: 'keyact', target: x.uid, note: key.note }); this.checkCalm(x, ev); }
  }
  doOffer(b: Battler, item: string, uid: number, ev: Ev[]) { const x = this.foes.find((f) => f.uid === uid); if (!x || !alive(x)) return; const it = this.ctx.itemDB[item]; ev.push({ t: 'use', actor: b.uid, name: 'Offer ' + (it?.name || item), skill: 'parley_offer', targets: [x.uid], se: 'pickup', anim: null, item }); this.parleyVerb(b, x, 'offer', ev, item); }
  canSend(x: Battler) { return x.calm || x.hp <= x.mhp * 0.25 || !!x.states.unveiled || !!x.states.heart_break; }
  doSend(b: Battler, x: Battler, ev: Ev[]) {
    if (!this.canSend(x)) { ev.push({ t: 'sendfail', target: x.uid }); return; }
    x.gone = 'sent'; this.sentList.push(x); const hollow = x.kind === 'hollowed' || x.fragment || x.def?.parley?.fragment; if (hollow || x.boss) { this.fragments += x.boss ? (x.def.rewards?.fragment || 1) + (x.calm ? (x.def.peaceful_rewards?.fragment || 0) : 0) : 1; } ev.push({ t: 'send', target: x.uid, fragment: !!hollow });
    if (x.boss) this.peaceful = true; if (x.tell) { x.tell = null; } this.afterAction(ev);
  }
  peaceful = false; goldPct = 0;
  inviteChance(x: Battler) {
    const P = SPEC.parley.invite; let c = (P.base[x.rarity] ?? P.base.common) / 100; if (x.mood >= (SPEC.parley.delightedAt || 150)) c += P.delightedBonus; c += Math.min(P.pityCap, (this.ctx.pity[x.id] || 0) * P.pityPerFail); if (x.offered) c += P.likedOfferedBonus; if (x.gilded) c += P.gildedBonus; return Math.max(P.min, Math.min(P.max, c));
  }
  doInvite(b: Battler, x: Battler, ev: Ev[]) {
    if (!x.calm || !x.recruit || x.boss) { ev.push({ t: 'invitefail', target: x.uid, why: !x.calm ? 'calm' : 'no' }); return; }
    const c = this.inviteChance(x); const ok = this.rng() < c; ev.push({ t: 'invite', target: x.uid, ok, chance: c });
    if (ok) { x.gone = 'invited'; this.sentList.push(x); this.recruits.push({ id: x.id, dup: false }); this.ctx.pity[x.id] = 0; this.afterAction(ev); }
    else { this.ctx.pity[x.id] = (this.ctx.pity[x.id] || 0) + 1; x.calm = false; delete x.states.calm; x.mood = Math.max(0, x.mood + SPEC.parley.invite.failMoodPenalty); }
  }
  // ---- flee
  tryFlee(smoke = false): { ok: boolean; ev: Ev[] } {
    const ev: Ev[] = []; if (this.noEscape && !smoke) { ev.push({ t: 'say', text: "There's no running from this!" }); return { ok: false, ev }; }
    const pa = this.heroes().reduce((s, p) => s + this.stat(p, 'agi'), 0) / Math.max(1, this.heroes().length); const fa = this.foesAlive().reduce((s, f) => s + this.stat(f, 'agi'), 0) / Math.max(1, this.foesAlive().length);
    const c = Math.min(1, 0.5 * (pa / fa) + 0.1 * this.escapes + (this.escapes >= 2 ? 1 : 0)); const ok = smoke || this.fleeFree > 0 || this.rng() < c; if (this.fleeFree > 0 && !smoke) this.fleeFree--; if (!ok) this.escapes++; else this.ended = 'escape'; ev.push({ t: 'escape', ok, chance: c }); return { ok, ev };
  }
  // ---- echo
  canEcho(b: Battler, r: { weak: boolean; echoable: boolean }) { return b.side === 'party' && b.hp > 0 && r.echoable && this.echo > 0 && !b.echoUsed && !this.ended; }
  spendEcho(b: Battler): Ev[] { this.echo--; b.echoUsed = true; return [{ t: 'echo', n: this.echo, spent: true, actor: b.uid }]; }
  // ---- auto
  autoAction(b: Battler): any {
    const foes = this.foesAlive(); if (!foes.length) return { type: 'guard' };
    const heroes = this.heroes(); const weakest = heroes.slice().sort((x, y) => x.hp / x.mhp - y.hp / y.mhp)[0];
    const heal = b.skills.map((id) => SPEC.skills[id]).find((s) => s && s.id && (s.effects || []).some((e: any) => e.op === 'heal') && s.scope === 'one_ally' && b.sp >= (s.cost.sp || 0));
    if (heal && weakest.hp / weakest.mhp < 0.45) return { type: 'skill', skill: heal.id, targets: [weakest.uid] };
    // Mio: Shift when another shore has a strictly better weakness for a damaging party skill
    if (b.actorId === 'mio' && this.canUse(b, 'mio_shift').ok) {
      const other: Realm = this.realm === 'near' ? 'far' : 'near';
      const partySkills = this.party.filter((p) => p.hp > 0).flatMap((p) => p.skills.map((id) => SPEC.skills[id]).filter((s) => s && s.damage && s.element));
      let bestHere = 0, bestOther = 0;
      for (const f of foes) {
        for (const s of partySkills) {
          const rH = (f.forms?.[this.realm]?.rates?.[s.element] ?? 1);
          const rO = (f.forms?.[other]?.rates?.[s.element] ?? 1);
          const mH = rH * ((s.element === 'lumen' || s.element === 'umbra') ? (this.realm === 'far' ? 1.25 : 0.85) : 1);
          const mO = rO * ((s.element === 'lumen' || s.element === 'umbra') ? (other === 'far' ? 1.25 : 0.85) : 1);
          if (mH > bestHere) bestHere = mH; if (mO > bestOther) bestOther = mO;
        }
      }
      if (bestOther > bestHere + 0.05) return { type: 'shift' };
    }
    let best: any = null; let bs = -1;
    for (const id of ['p_attack', ...b.skills]) { const s = SPEC.skills[id]; if (!s || !s.damage || b.sp < (s.cost.sp || 0) || (s.cost.bond && b.gauge < s.cost.bond)) continue; for (const f of foes) { const er = this.rate(f, s.element) * ((s.element === 'lumen' || s.element === 'umbra') ? (this.realm === 'far' ? 1.25 : 0.85) : 1); const sc = (this.stat(b, s.damage.stat) * 4 * s.damage.pow + s.damage.flat - this.stat(f, s.damage.def) * 2) * er * (s.scope === 'all_enemies' ? foes.length * 0.8 : 1) - (s.cost.sp || 0) * 0.5; if (sc > bs) { bs = sc; best = { type: 'skill', skill: id, targets: s.scope === 'all_enemies' ? foes.map((x) => x.uid) : [f.uid] }; } } }
    return best || { type: 'guard' };
  }
  // ---- rewards
  rewards(partyAvg: number) {
    let exp = 0, gold = 0; const drops: string[] = []; const eraw = this.foes.filter((f) => f.gone !== 'left' && !f.add || (f.add && f.hp <= 0));
    for (const f of this.foes) { if (f.gone === 'left') continue; if (f.hp <= 0 || f.gone === 'sent' || f.gone === 'invited') { const sent = f.gone === 'sent' || f.gone === 'invited'; exp += Math.round(enemyExp(f) * (sent ? 0.75 : 1)); if (!sent) gold += enemyGold(f); if (!sent) { const dm = this.party.reduce((m, p) => m * p.bondTraits.reduce((x: number, t: any) => x * (t.dropRate || 1), 1), 1); for (const d of f.def.drops || []) if (this.rng() < Math.min(1, dm / d.denominator)) drops.push(d.item); if (f.gilded) drops.push('marigold_petal'); } else if (f.gone === 'sent') { drops.push(f.kind === 'hollowed' || f.def?.parley?.fragment ? 'name_fragment' : 'wish_scrap'); } } }
    void eraw; if (this.ctx.difficulty === 'gentle') exp = Math.round(exp * 1.2); const rec = this.ctx.recLevel; if (rec) { if (partyAvg <= rec - 2) exp = Math.round(exp * 1.25); else { const maxL = Math.max(...this.foes.map((f) => f.level)); if (partyAvg >= maxL + 4) exp = Math.round(exp * 0.5); } }
    gold = Math.round((gold + this.goldBonus) * (1 + this.goldPct)); if (this.bossDef) { const r = this.bossDef.rewards || {}; for (const it of r.items || []) for (let i = 0; i < it.n; i++) drops.push(it.item); if (this.peaceful) for (const it of this.bossDef.peaceful_rewards?.extra || []) drops.push(it.item); }
    return { exp, gold, drops };
  }
}
function a_item(info: any): string | undefined { return info?.item; }
declare module './engine' { interface Battler { unveilRefill?: boolean; realmGear?: Record<string, { near: number; far: number }>; keepsake?: string | null; cd?: Record<string, number>; once?: Record<string, boolean>; } }
