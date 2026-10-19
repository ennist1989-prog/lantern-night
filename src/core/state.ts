import { DB, PARAMS, expForLevel, MAX_LEVEL } from './db';
import { gearBonus, traitSum } from './gear';
import { SPEC } from '../battle/spec';
import { migrateGame, SAVE_VERSION } from './migrate';
export { SAVE_VERSION };
export interface Actor { id: string; level: number; exp: number; hp: number; sp: number; equips: Record<string, string | null>; skills: string[]; states: string[]; perm?: Record<string, number>; }
export const SLOTS = ['weapon', 'armor', 'acc', 'acc2', 'keepsake', 'bond'];
export const SLOT_NAMES: Record<string, string> = { weapon: 'Weapon', armor: 'Armor', acc: 'Charm', acc2: 'Charm 2', keepsake: 'Keepsake', bond: 'Bond' };
export class GameState {
  switches: Record<string, boolean> = {};
  variables: Record<string, number> = {};
  selfSwitches: Record<string, boolean> = {};
  party: string[] = [];
  actors: Record<string, Actor> = {};
  items: Record<string, number> = {};
  gold = 0;
  quests: Record<string, { stage: number; done: boolean }> = {};
  seen: Record<string, boolean> = {};          // read-skip: message hashes seen
  bestiary: Record<string, { seen: boolean; weak: string[]; defeated: number; calmed: number; recruited?: boolean; parleyed?: boolean }> = {};
  bonds: Record<string, { xp: number; lv: number }> = {};   // recruited spirits (Bond roster)
  pity: Record<string, number> = {};                         // failed Invite counter per species
  fragments = 0;                                              // Name Fragments (ending)
  tutorialsShown: Record<string, boolean> = {};
  bossLosses: Record<string, number> = {}; bossSeen: Record<string, boolean> = {};
  map = { id: 1, x: 6, y: 6, dir: 'down' };
  realm: 'near' | 'far' = 'near';
  lumen = 60; lumenMax = 60;
  respawn = { map: 1, x: 8, y: 11, dir: 'down' };
  playtime = 0; steps = 0; fades = 0; saveCount = 0;
  repel = 0; grace = 0;
  defeated: Record<string, boolean> = {};      // visible enemies defeated in current visit: "map:eventId"
  checkpoint: any = null;                       // boss retry checkpoint (serialized snapshot string)
  chapter = 1;
  ver = SAVE_VERSION;                           // save format version (see save.ts migrate)
  forged: Record<string, number> = {};          // forge level per gear id (0-3)
  songs: string[] = [];                         // Bond Songs learned from spirits (permanent, any actor)
  lessons: Record<string, number> = {};         // battles fought with a spirit in the Bond slot at Lv4+
  buffs: { peek: number; stealth: number; light: number; goldBoost: number; fleeFree: number } = { peek: 0, stealth: 0, light: 0, goldBoost: 0, fleeFree: 0 };
  usedSummons: Record<string, number> = {};     // lifetime Keepsake casts (journal)
  seenKeys: Record<string, boolean> = {};       // key items the player has viewed (NEW tag)
  permUsed: Record<string, number> = {};        // permanent stat items consumed per stat
  litPost: { map: number; x: number; y: number; dir: string } | null = null;
  __reloadRequest?: any; __titleRequest?: any;
  constructor() { /* new game set by newGame() */ }
  newGame() {
    Object.assign(this, new GameState());
    const sys = DB.system;
    this.gold = sys.startGold ?? 40; this.lumen = 60; this.lumenMax = 60;
    this.map = { id: sys.start.map, x: sys.start.x, y: sys.start.y, dir: sys.start.dir }; this.respawn = { ...sys.respawn };
    for (const a of sys.startParty) this.addActor(a);
    for (const [k, n] of Object.entries(sys.startItems || {})) this.items[k] = n as number;
  }
  // ---- switches/variables (RM $gameSwitches/$gameVariables) ----
  sw(k: string) { return !!this.switches[k]; }
  setSw(k: string, v: boolean) { this.switches[k] = v; }
  v(k: string) { return this.variables[k] || 0; }
  setV(k: string, n: number) { this.variables[k] = Math.floor(n); }   // variables are integers (floored on set)
  selfKey(map: number, ev: number, k: string) { return `${map}:${ev}:${k}`; }
  // ---- party ----
  addActor(id: string) {
    if (this.actors[id]) { if (!this.party.includes(id)) this.party.push(id); return; }
    const def = DB.actors[id]; const lvl = this.actors.mio ? Math.max(def.level ?? 1, 2, this.actors.mio.level) : (def.level ?? 1); const a: Actor = { id, level: lvl, exp: expForLevel(lvl), hp: 1, sp: 1, equips: { weapon: null, armor: null, acc: null, acc2: null, keepsake: null, bond: null, ...(def.equip || {}) }, skills: [], states: [] };
    this.actors[id] = a; this.refreshSkills(a); a.hp = this.param(a, 'mhp'); a.sp = this.param(a, 'msp');
    this.party.push(id);
  }
  refreshSkills(a: Actor) {
    const def = DB.actors[a.id]; for (const [lv, sk] of def.skills) if (a.level >= lv && !a.skills.includes(sk)) a.skills.push(sk);
    for (const sg of this.songs) if (!a.skills.includes(sg)) a.skills.push(sg);
    const L = SPEC.learn?.story || {};   // story / combo spells: flag set (and the combo members are in the party)
    for (const [sid, r] of Object.entries<any>(L)) { if (a.skills.includes(sid) || !this.sw(r.flag)) continue; if (r.members ? !r.members.includes(a.id) || !r.members.every((m: string) => this.actors[m]) : r.who && r.who !== a.id) continue; if (a.level >= (SPEC.skills[sid]?.minLevel || 1)) a.skills.push(sid); }
  }
  learnSong(sid: string) { if (this.songs.includes(sid)) return false; this.songs.push(sid); for (const id of Object.keys(this.actors)) this.refreshSkills(this.actors[id]); return true; }
  refreshAllSkills() { for (const id of Object.keys(this.actors)) this.refreshSkills(this.actors[id]); }
  base(a: Actor, p: string) { const r = DB.actors[a.id].params[p]; return Math.round(r[0] + (r[1] - r[0]) * (a.level - 1) / (MAX_LEVEL - 1)); }
  equipBonus(a: Actor, p: string) { let n = 0; void 0; return gearBonus(a.equips, p, this.realm, this.forged) + (a.perm?.[p] || 0); }
  param(a: Actor, p: string) { let v = this.base(a, p) + this.equipBonus(a, p); if (p === 'mhp') v = Math.round(v * (1 + traitSum(a.equips, 'maxHpRate'))); if (a.states.includes('thinned') && (p === 'atk' || p === 'def')) v = Math.floor(v * 0.8); return Math.max(1, v); }
  gainExp(a: Actor, n: number) {
    const before = a.level; a.exp += n; const learned: string[] = [];
    while (a.level < MAX_LEVEL && a.exp >= expForLevel(a.level + 1)) {
      const oh = this.param(a, 'mhp'), os = this.param(a, 'msp');
      a.level++; a.hp += this.param(a, 'mhp') - oh; a.sp += this.param(a, 'msp') - os;
    }
    const had = new Set(a.skills); this.refreshSkills(a); a.skills.forEach((s) => { if (!had.has(s)) learned.push(s); });
    return { leveled: a.level > before, from: before, to: a.level, learned };
  }
  expToNext(a: Actor) { return a.level >= MAX_LEVEL ? 0 : expForLevel(a.level + 1) - a.exp; }
  healAll() { for (const id of this.party) { const a = this.actors[id]; a.hp = this.param(a, 'mhp'); a.sp = this.param(a, 'msp'); a.states = []; } }
  healAllPartial(f: number) { for (const id of this.party) { const a = this.actors[id]; a.hp = Math.max(a.hp, Math.ceil(this.param(a, 'mhp') * f)); a.sp = Math.max(a.sp, Math.ceil(this.param(a, 'msp') * f)); a.states = []; } }
  clampActor(a: Actor) { a.hp = Math.max(0, Math.min(a.hp, this.param(a, 'mhp'))); a.sp = Math.max(0, Math.min(a.sp, this.param(a, 'msp'))); }
  // ---- inventory ----
  has(id: string) { return (this.items[id] || 0) > 0; }
  gain(id: string, n = 1) { this.items[id] = Math.max(0, (this.items[id] || 0) + n); if (!this.items[id]) delete this.items[id]; }
  // ---- quests ----
  questStage(id: string) { return this.quests[id]?.stage ?? 0; }
  setQuest(id: string, stage: number, done = false) { this.quests[id] = { stage, done }; }
  // ---- bestiary ----
  bst(id: string) { return (this.bestiary[id] ||= { seen: false, weak: [], defeated: 0, calmed: 0 }); }
  // ---- bonds ----
  addBond(sp: string) { if (this.bonds[sp]) { this.bonds[sp].xp += 2; this.bonds[sp].lv = this.bondLevel(this.bonds[sp].xp); return false; } const x0 = sp === 'bell_mouse' && this.sw('sq04_done') ? 3 : 0; this.bonds[sp] = { xp: x0, lv: this.bondLevel(x0) }; this.bst(sp).recruited = true; for (const id of this.party) { const a = this.actors[id]; if (!a.equips.bond) { a.equips.bond = sp; break; } } return true; }
  bondLevel(xp: number) { const L = [0, 3, 6, 10, 15]; let lv = 1; L.forEach((n, i) => { if (xp >= n) lv = i + 1; }); return lv; }
  // ---- serialization ----
  toJSON() {
    const o: any = {}; for (const k of Object.keys(this)) o[k] = (this as any)[k]; return o;
  }
  load(o: any) { const d = new GameState(); const g = migrateGame(JSON.parse(JSON.stringify(o))); Object.assign(this, d, g); this.refreshAllSkills(); for (const id of Object.keys(this.actors)) this.clampActor(this.actors[id]); }
}
export const $ = new GameState();
export function totalLevel() { return $.party.length ? Math.max(...$.party.map((p) => $.actors[p].level)) : 1; }
void PARAMS;
