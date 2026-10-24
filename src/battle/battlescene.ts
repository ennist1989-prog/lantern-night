import Phaser from 'phaser';
import { Input } from '../core/input';
import { Audio } from '../core/audio';
import { Settings } from '../core/settings';
import { $ } from '../core/state';
import { playSummonFx } from './summonfx';
import { DB, ELEMENT_COLORS, ELEMENT_NAMES, iconOf } from '../core/db';
import { W, H, Win, Selectable, COL, FONT, Fader, sleep, tickWindows, heartbeat, pulseAmp, fitBlock, fitLine } from '../ui/windows';
import { farTexture } from '../game/recolor';
import { SPEC } from './spec';
import { Battle, Battler, Ev, alive } from './engine';
import { partyBattler, hasWard } from './party';
const TUT: Record<string, string> = {
  shift_hint: 'Hint: Mio can Shift the battle to the other shore. A different realm means different weaknesses!',
  weakness_hint: 'Hint: hitting a WEAKNESS gives an Echo pip. Spend one to act again right away!',
  parley_hint: 'Hint: Parley raises an enemy’s Mood. Fill the bar and it turns Calm — then Send it onward, or Invite it to bond.',
};
const DOT_NAMES: Record<string, string> = { burn: 'Burn', chill: 'Chill', wilt: 'Wilt' };
export class BattleScene extends Phaser.Scene {
  d: any; B!: Battle; wins: Win[] = []; fader!: Fader; cmdWin!: Selectable; subWin!: Selectable; descWin!: Win; statusWin!: Win; logWin!: Win; orderWin!: Win; echoWin!: Win; realmWin!: Win; targetWin!: Win;
  bgImgs: Record<string, Phaser.GameObjects.Image> = {}; spr: Map<number, Phaser.GameObjects.Sprite> = new Map(); lab: Map<number, Phaser.GameObjects.Text> = new Map(); barG!: Phaser.GameObjects.Graphics; orderIcons: Phaser.GameObjects.GameObject[] = [];
  trauma = 0; weakChain = 0; warmBoost = 0; echoPrimer = false; curActor: Battler | null = null; cursorTxt!: Phaser.GameObjects.Text; ended = false; fxMeta: any; bossMeta: any; tellIcons: Map<number, Phaser.GameObjects.Text> = new Map(); tellNames = false; wonResult: any = null;
  constructor() { super('Battle'); }
  init(d: any) { this.d = d; this.ended = false; this.wins = []; this.spr = new Map(); this.lab = new Map(); this.tellIcons = new Map(); this.orderIcons = []; this.bgImgs = {}; }
  speed() { return Settings.data.battleSpeed; }
  t(ms: number) { return sleep(this, ms / this.speed()); }
  /** Auto for this battle: null follows Settings; in boss fights toggles stay local (temporary) so the player's saved setting survives. */
  autoLocal: boolean | null = null;
  get autoOn(): boolean { return this.autoLocal ?? Settings.data.autoBattle; }
  setAuto(v: boolean) { if (this.B.bossDef) this.autoLocal = v; else { this.autoLocal = null; Settings.data.autoBattle = v; Settings.save(); } }
  create() {
    this.autoLocal = null;
    this.fxMeta = this.cache.json.get('fxmeta'); this.bossMeta = this.cache.json.get('bossmeta');
    const zone = this.d.zone ? SPEC.zones[this.d.zone] : null;
    const items = $.items; const ctx: any = { realm: this.d.realm, lumen: $.lumen, lumenMax: $.lumenMax, difficulty: Settings.data.difficulty, warmth: Settings.data.warmth, items, itemDB: DB.items, pity: $.pity, flags: { fragments: $.fragments }, recLevel: this.d.recLevel ?? zone?.recLevel, ward: $.party.some((id) => hasWard($.actors[id])) };
    const party = $.party.slice(0, 4).map((id) => partyBattler($.actors[id], DB.actors[id], DB.items, $.bonds, $.forged));
    this.B = new Battle(ctx, party, this.d.troop); if (this.d.noEscape) this.B.noEscape = true;
    // invisible Echo tutorial: the Straw Warden is never the player's first look at Echo (they normally earn it in the earlier Far fights)
    this.echoPrimer = !$.tutorialsShown.b_echo_first && String(this.d.troop).includes('straw_warden'); if (this.echoPrimer) { this.B.echo = Math.max(this.B.echo, 1); }
    for (const f of this.B.foes) { const b = $.bst(f.id); f.revealed = new Set(b.weak || []); b.seen = true; }
    this.fader = new Fader(this, 9999); this.fader.rect.setAlpha(1); this.fader.rect.fillAlpha = 1;
    this.buildBackground(); this.barG = this.add.graphics().setDepth(40); this.tellNames = party.some((p) => p.bondTraits.some((t: any) => t.tellNames)) || true;
    this.layoutFoes(true); this.buildPartySprites(); this.buildUI(); this.run();
  }
  update(_t?: number, dt = 16) {
    tickWindows(this.wins); this.drawBars();
    if (this.cursorTxt?.visible) { const hb = heartbeat(this.time.now) * pulseAmp(); this.cursorTxt.setScale(1 + 0.32 * hb); this.cursorTxt.setTint(hb > 0.3 ? 0xffffff : 0xffe08a); }
    const cam = this.cameras.main;
    if (this.trauma > 0) { const m = this.trauma * this.trauma * 14; cam.setScroll((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m); this.trauma = Math.max(0, this.trauma - (dt / 1000) * 1.6); if (this.trauma === 0) cam.setScroll(0, 0); }
  }
  /** Decaying 'trauma' camera shake: offset ∝ trauma², trauma bleeds off over ~0.6 s. Honors the Screen Juice setting. */
  addTrauma(t: number) { const j = Settings.data.juice; if (j === 'off') return; this.trauma = Math.min(1, this.trauma + t * (j === 'reduced' ? 0.4 : 1)); }
  /** Hit-pause: freezes tweens for a few frames on impact (skipped when Screen Juice is Off, halved when Reduced). */
  async hitStop(ms: number) { const j = Settings.data.juice; if (j === 'off' || ms <= 0) return; this.tweens.timeScale = 0.02; await new Promise<void>((r) => setTimeout(r, (j === 'reduced' ? ms * 0.5 : ms) / this.speed())); this.tweens.timeScale = 1; }
  // ---------------------------------------------------------------- visuals
  makeBack(realm: 'near' | 'far') {
    const key = 'bb_' + realm; if (this.textures.exists(key)) return key; const c = this.textures.createCanvas(key, W, 420)!; const x = c.getContext();
    const g = x.createLinearGradient(0, 0, 0, 420); if (realm === 'near') { g.addColorStop(0, '#2b2352'); g.addColorStop(0.55, '#8a5a68'); g.addColorStop(0.62, '#d49a6a'); g.addColorStop(1, '#4a3a2a'); } else { g.addColorStop(0, '#060a28'); g.addColorStop(0.55, '#1c3a78'); g.addColorStop(0.62, '#3a8aa8'); g.addColorStop(1, '#0a2438'); }
    x.fillStyle = g; x.fillRect(0, 0, W, 420);
    x.fillStyle = realm === 'near' ? '#3a2a44' : '#0a1a3c'; x.beginPath(); x.moveTo(0, 250); for (let i = 0; i <= W; i += 48) x.lineTo(i, 236 + Math.sin(i * 0.013) * 14 + Math.sin(i * 0.04) * 6); x.lineTo(W, 260); x.lineTo(0, 260); x.fill();
    for (let i = 0; i < 14; i++) { const y = 262 + i * i * 0.9 + i * 6; x.fillStyle = realm === 'near' ? `rgba(70,50,36,${0.08 + i * 0.012})` : `rgba(20,60,90,${0.1 + i * 0.015})`; x.fillRect(0, y, W, 3 + i * 0.4); }
    for (let i = 0; i < 40; i++) { x.fillStyle = realm === 'near' ? 'rgba(255,230,180,0.5)' : 'rgba(190,240,255,0.7)'; x.fillRect((i * 197) % W, (i * 61) % 170, 3, 3); }
    for (let i = 0; i < 46; i++) { x.fillStyle = realm === 'near' ? `rgba(${90 + (i % 5) * 12},${70 + (i % 4) * 10},50,0.55)` : `rgba(90,${170 + (i % 4) * 12},200,0.5)`; const px = (i * 331 + 40) % W, py = 292 + ((i * 97) % 100); x.fillRect(px, py, 6 + (i % 3) * 3, 2); x.fillRect(px + 2, py - 3, 2, 3); }
    c.refresh(); return key;
  }
  buildBackground() { for (const r of ['near', 'far'] as const) { const im = this.add.image(0, 0, this.makeBack(r)).setOrigin(0, 0).setDepth(0); this.bgImgs[r] = im; } this.setBackRealm(); this.add.rectangle(0, 400, W, 224, 0x05081a, 1).setOrigin(0, 0).setDepth(1); }
  setBackRealm() { this.bgImgs.near.setVisible(this.B.realm === 'near'); this.bgImgs.far.setVisible(this.B.realm === 'far'); }
  foeTex(f: Battler) {
    if (f.boss) { const k = 'boss_' + f.id; const meta = this.bossMeta[f.id]; const tex = this.textures.get(k); for (let i = 0; i < meta.n; i++) if (!tex.has(String(i))) tex.add(String(i), 0, i * meta.fw, 0, meta.fw, meta.fh); return k; }
    let k = 'mon_' + f.id; const t = this.textures.get(k); if (!t.has('0')) t.add('0', 0, 0, 0, t.getSourceImage().width, t.getSourceImage().height);
    if (this.B.realm === 'far') { k = farTexture(this, k); const t2 = this.textures.get(k); if (!t2.has('0')) t2.add('0', 0, 0, 0, t2.getSourceImage().width, t2.getSourceImage().height); } return k;
  }
  foeTint(f: Battler): number { if (f.gilded) return 0xffe08a; if (f.boss && f.tint && this.B.realm === 'near') return parseInt(f.tint.replace('#', ''), 16); if (f.boss && this.B.realm === 'far') return f.sprite?.noFar ? 0xffffff : 0xcfe8ff; /* noFar (SPRITE_OVERRIDES, e.g. Tsubaki) skips the Far recolour in battle too, matching NO_FAR on the map */ if (this.B.realm === 'near' && f.tint) return parseInt(f.tint.replace('#', ''), 16); return 0xffffff; }
  layoutFoes(initial = false) {
    const foes = this.B.foes.filter((f) => !f.gone || this.spr.get(f.uid)); const boss = foes.find((f) => f.boss); const others = foes.filter((f) => !f.boss);
    const place = (f: Battler, x: number, y: number) => {
      let s = this.spr.get(f.uid);
      if (!s) {
        s = this.add.sprite(x, y, this.foeTex(f), f.boss ? '0' : '0').setOrigin(0.5, 1).setDepth(10 + y); this.spr.set(f.uid, s); s.setScale(f.boss ? (this.bossMeta[f.id]?.fh <= 16 ? 10 : Math.max(1, Math.round(215 / (this.bossMeta[f.id]?.fh || 50)))) : (f.scale || 5) * (f.elite ? 1.25 : 1.2) * (f.add ? 0.85 : 1));
        (s as any).bx = x; (s as any).by = y; s.setAlpha(0); this.tweens.add({ targets: s, alpha: 1, duration: 400, delay: initial ? f.slot * 120 : 0 }); this.tweens.add({ targets: s, y: y - 3, duration: 700 + f.slot * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        if (f.boss) this.bossAnim(s, f); this.applyForm(f);
        const gl = this.add.ellipse(x, y - s.displayHeight * 0.45, s.displayWidth * 1.15, s.displayHeight * 0.95, 0x9fdcff, 0.2).setDepth(9 + y); (s as any).glow = gl; gl.setVisible(this.B.realm === 'far'); this.tweens.add({ targets: gl, alpha: 0.1, duration: 900, yoyo: true, repeat: -1 });
        const t = f.boss ? this.add.text(W / 2, 112, f.name, { fontFamily: FONT, fontSize: '19px', color: '#ffe9a0', stroke: '#101030', strokeThickness: 4 }).setOrigin(0.5, 0).setDepth(45) : this.add.text(x, y + 6, f.name, { fontFamily: FONT, fontSize: '17px', color: '#fff', stroke: '#101030', strokeThickness: 4 }).setOrigin(0.5, 0).setDepth(45); this.lab.set(f.uid, t);
      } else { (s as any).bx = x; (s as any).by = y; this.tweens.add({ targets: s, x, duration: 300 }); (s as any).glow?.setPosition(x, y - s.displayHeight * 0.45); if (!f.boss) this.lab.get(f.uid)?.setPosition(x, y + 6); }
    };
    if (boss) { place(boss, W / 2, 384); const adds = others.filter((f) => alive(f) || this.spr.get(f.uid)); adds.forEach((f, i) => place(f, i % 2 === 0 ? 118 : W - 118, 268 + Math.floor(i / 2) * 40)); }
    else { const n = others.length; others.forEach((f, i) => { const span = Math.min(W - 280, 190 * (n - 1)); const x = n === 1 ? W / 2 : W / 2 - span / 2 + (i * span) / (n - 1); place(f, x, 262 + (i % 2) * 22); }); }
  }
  bossAnim(spr: Phaser.GameObjects.Sprite, f: Battler) { const meta = this.bossMeta[f.id]; let fr = 0; this.time.addEvent({ delay: 150, loop: true, callback: () => { if (!spr.active) return; fr = (fr + 1) % meta.n; spr.setFrame(String(fr)); } }); }
  applyForm(f: Battler) { const s = this.spr.get(f.uid); if (!s) return; (s as any).glow?.setVisible(this.B.realm === 'far' && alive(f)); const k = this.foeTex(f); s.setTexture(k, f.boss ? s.frame.name : '0'); s.setTint(this.foeTint(f)); }
  buildPartySprites() { this.B.party.forEach((a, i) => { const x = 250 + i * 100, y = 392; const s = this.add.sprite(x, y, 'char_' + a.id, 1).setOrigin(0.5, 1).setScale(4).setDepth(60); (s as any).bx = x; (s as any).by = y; this.spr.set(a.uid, s); }); }
  refreshRealmVisuals() { this.setBackRealm(); this.B.foes.forEach((f) => this.applyForm(f)); this.drawRealm(); }
  posOf(b: Battler) { const s = this.spr.get(b.uid)!; return { x: (s as any).bx as number, y: (s as any).by as number }; }
  // ---------------------------------------------------------------- UI
  buildUI() {
    const tone = this.B.realm; const mk = <T extends Win>(w: T) => { this.wins.push(w); w.setDepth(50); return w; };
    this.statusWin = mk(new Win(this, 248, 404, 560, 212, tone)); this.cmdWin = mk(new Selectable(this, 8, 404, 232, 212, tone));
    this.subWin = mk(new Selectable(this, 248, 404, 560, 166, tone)); this.descWin = mk(new Win(this, 248, 574, 560, 42, tone)); this.subWin.setVisible(false); this.descWin.setVisible(false);
    this.logWin = mk(new Win(this, 68, 66, 680, 72, tone)); this.logWin.setVisible(false);
    // top HUD row (Ember §3.4): Lumen/realm top-left like the map HUD (8,8,226), then turn order, then Echo
    this.realmWin = mk(new Win(this, 8, 8, 226, 52, tone)); this.orderWin = mk(new Win(this, 242, 8, 374, 52, tone)); this.echoWin = mk(new Win(this, 624, 8, 184, 52, tone));
    this.targetWin = mk(new Win(this, 200, 118, 416, 52, tone)); this.targetWin.setVisible(false); this.cmdWin.active = false; this.subWin.active = false;
    this.cursorTxt = this.add.text(0, 0, '▼', { fontFamily: FONT, fontSize: '30px', color: '#ffe08a', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(80).setVisible(false);
    this.refreshStatus(); this.drawRealm(); this.drawOrder(); this.drawEcho();
  }
  stLabel(id: string) { const d = SPEC.states[id]; return DOT_NAMES[id] || d?.name || id; }
  refreshStatus(hl: Battler | null = null) {
    const w = this.statusWin; w.clear(); const B = this.B;
    B.party.forEach((a, i) => {
      const y = 8 + i * 50; if (hl === a) { w.gfx.fillStyle(0xffe08a, 0.18); w.gfx.fillRoundedRect(6, y - 3, 548, 48, 6); w.gfx.lineStyle(2, 0xffe08a, 0.8); w.gfx.strokeRoundedRect(6, y - 3, 548, 48, 6); }
      const f = w.face(a.face!, 12, y, 40); if (f && a.hp <= 0) f.setTint(0x555566);
      w.txt(a.name, 58, y - 3, { size: 19, color: a.hp <= 0 ? COL.red : COL.white }); w.txt('Lv' + a.level, 58, y + 18, { size: 14, color: COL.dim });
      const hp = a.dispHp; w.txt('HP', 132, y + 1, { size: 13, color: COL.sys }); w.gauge(156, y + 8, 118, hp / a.mhp, hp / a.mhp < 0.3 ? 0xff7a5a : 0x5fd37a, 0xa6f5b4, 8); w.txt(`${hp}`, 282, y - 2, { size: 17 });
      w.txt('SP', 132, y + 22, { size: 13, color: COL.sys }); w.gauge(156, y + 29, 118, a.sp / Math.max(1, a.msp), 0x4a8cff, 0x9ec8ff, 6); w.txt(`${a.sp}`, 282, y + 17, { size: 15, color: COL.sp });
      if (a.bond) { w.txt('Bond', 336, y + 1, { size: 13, color: COL.violet }); w.gauge(376, y + 8, 70, a.gauge / 100, 0xb07aff, 0xdcb8ff, 6); const mk = 376 + 70 * 0.5; w.gfx.fillStyle(0xffffff, 0.6); w.gfx.fillRect(mk, y + 6, 1, 10); }
      let sx = 336, sy = y + 24; for (const k of Object.keys(a.states)) { if (k === 'gathering') continue; const n = a.states[k].n; w.txt(this.stLabel(k) + (n ? '×' + n : ''), sx, sy, { size: 13, color: COL.gold }); sx += 66; if (sx > 520) break; }
      if (a.hp <= 0) w.txt('Down', 456, y + 4, { size: 16, color: COL.red });
    });
  }
  drawRealm() { const w = this.realmWin; w.setTone(this.B.realm); w.clear(); const far = this.B.realm === 'far'; w.txt(far ? 'Far Shore' : 'Near Shore', 16, 4, { size: 17, color: far ? COL.teal : COL.gold }); w.gauge(16, 32, 150, this.B.lumen / $.lumenMax, 0x7fe9ff, 0xe8ffff, 10); w.txt(String(Math.ceil(this.B.lumen)), 176, 24, { size: 17, color: COL.lumen }); [this.statusWin, this.cmdWin, this.subWin, this.descWin, this.logWin, this.orderWin, this.echoWin, this.targetWin].forEach((x) => x.setTone(this.B.realm)); }
  drawEcho() { const w = this.echoWin; w.clear(); const e = this.B.echo; w.txt('Echo', 12, 4, { size: 17, color: COL.violet }); for (let i = 0; i < 3; i++) { w.gfx.fillStyle(i < e ? 0xc9a0ff : 0x2a2f55, 1); w.gfx.fillRect(14 + i * 30, 30, 24, 14); w.gfx.lineStyle(1, 0xc9a0ff, 0.9); w.gfx.strokeRect(14 + i * 30, 30, 24, 14); } if (e) fitLine(w.txt('act again!', 106, 26, { size: 13, color: COL.violet }), w.w - 12 - 106, [12, 11]); }
  drawOrder(cur: Battler | null = null) {
    const w = this.orderWin; w.clear(); this.orderIcons.forEach((o) => o.destroy()); this.orderIcons = []; w.txt('Order', 8, 4, { size: 13, color: COL.dim });
    const list = this.B.previewOrder().slice(0, Math.max(1, Math.floor((w.w - 54 - 8 + 3) / 37)));   // as many 37px slots as fit the window
    list.forEach((b, i) => { const x = 54 + i * 37; const ring = b.side === 'party' ? 0x7fb4ff : 0xff8a7a; w.gfx.fillStyle(0x10163a, 1); w.gfx.fillRect(x, 8, 34, 34);
      if (b.side === 'party') { const im = w.face(b.face!, x, 8, 34); if (im && cur && cur !== b) im.setAlpha(0.65); }
      else { const k = this.textures.exists(b.boss ? 'boss_' + b.id : 'mon_' + b.id) ? (b.boss ? 'boss_' + b.id : 'mon_' + b.id) : null; if (k) { const im = this.add.image(0, 0, k, b.boss ? '0' : undefined as any).setOrigin(0.5, 0.5).setDepth(56); const sc = 30 / Math.max(im.width, im.height); im.setScale(sc); im.setPosition(w.x + x + 17, w.y + 25); this.orderIcons.push(im); if (!b.boss) { /* ok */ } } if (b.states.gathering) w.txt('!', x + 25, 6, { size: 16, color: '#ff6a6a' }); }
      w.gfx.lineStyle(2, ring, 1); w.gfx.strokeRect(x, 8, 34, 34); if (cur === b) { w.gfx.lineStyle(2, 0xffe08a, 1); w.gfx.strokeRect(x - 2, 6, 38, 38); } });
  }
  drawBars() {
    const g = this.barG; g.clear();
    for (const e of this.B.foes) { const s = this.spr.get(e.uid)!; const lab = this.lab.get(e.uid); if (!s || !s.active) continue; const gone = !alive(e) && s.alpha < 0.05; if (gone) { lab?.setVisible(false); continue; } lab?.setVisible(s.alpha > 0.3 && alive(e)); if (!alive(e)) continue;
      const w = e.boss ? 300 : 84; const x = e.boss ? W / 2 - 150 : (s as any).bx - w / 2, y = e.boss ? 138 : (s as any).by + 28; const hp = e.dispHp;
      g.fillStyle(0x000000, 0.8); g.fillRect(x - 1, y - 1, w + 2, 9); g.fillStyle(0x3a2030, 1); g.fillRect(x, y, w, 7); g.fillStyle(hp / e.mhp < 0.3 ? 0xff7a5a : 0xff5a6a, 1); g.fillRect(x, y, w * Math.max(0, hp / e.mhp), 7);
      const my = y + 10; g.fillStyle(0x000000, 0.8); g.fillRect(x - 1, my - 1, w + 2, 9); g.fillStyle(0x2a2f55, 1); g.fillRect(x, my, w, 7); const mr = Math.min(1, e.mood / e.calmAt); g.fillStyle(e.calm ? 0x7fffe0 : e.mood >= 150 ? 0xffe08a : 0xff9ed8, 1); g.fillRect(x, my, w * mr, 7);
      if (e.vpMax) for (let i = 0; i < e.vpMax; i++) { const px = x + i * 14 + 5, py = y - 8; g.fillStyle(i < e.vp ? 0x9fe8ff : 0x2a3a5a, 1); g.fillTriangle(px, py - 5, px + 5, py, px, py + 5); g.fillTriangle(px, py - 5, px - 5, py, px, py + 5); g.lineStyle(1, 0xffffff, 0.6); }
      let sx = x; let n = 0; for (const k of Object.keys(e.states)) { if (['gathering', 'heart_break', 'calm'].includes(k) || n > 5) continue; n++; g.fillStyle(k === 'unveiled' ? 0x9fe8ff : 0xffd866, 1); g.fillRect(sx, y + 21, 7, 7); sx += 9; }
      if (e.states.unveiled) { g.lineStyle(2, 0x9fe8ff, 0.8); g.strokeRect(x - 4, y - 6, w + 8, 40); }
    }
  }
  /** Battle log / tutorial line. Measured fit (Ember §3.2 #3): one line at 21px if it fits, else wrapped to 656px (680 − 2×12) at 17px,
   *  stepping down to 15/13px until it fits; the window grows 72→96px for 3+ lines. */
  async log(s: string, ms = 650) {
    const w = this.logWin; w.clear(); w.setVisible(true); const maxW = 680 - 24; const t = w.txt(s, 340, 0, { size: 21, align: 'center' });
    t.setWordWrapWidth(maxW, true); if (t.height > 30) fitBlock(t, maxW, 96 - 14, [17, 15, 13]);
    const h = t.height + 14 <= 72 ? 72 : 96; w.resize(680, h); t.setY(Math.round((h - t.height) / 2));
    const long = s.length > 52; await this.t(ms + (long ? s.length * 14 : 0));
  }
  hideLog() { this.logWin.setVisible(false); }
  popup(x: number, y: number, s: string, color = '#fff', size = 30) { const t = this.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, stroke: '#101030', strokeThickness: 5 }).setOrigin(0.5).setDepth(100); this.tweens.add({ targets: t, y: y - 40, duration: 700 / this.speed(), ease: 'Cubic.easeOut' }); this.tweens.add({ targets: t, alpha: 0, duration: 300, delay: 600 / this.speed(), onComplete: () => t.destroy() }); }
  fx(name: string | null | undefined, x: number, y: number, scale = 4, tint?: number): Promise<void> {
    const m = name ? this.fxMeta[name] : null; if (!m) return Promise.resolve(); const key = 'fx_' + name; const tex = this.textures.get(key);
    for (let i = 0; i < m.n; i++) if (!tex.has(String(i))) tex.add(String(i), 0, i * m.fw, 0, m.fw, m.fh);
    const s = this.add.sprite(x, y, key, '0').setScale(scale).setDepth(95); if (tint) s.setTint(tint); let i = 0;
    return new Promise((res) => { const tm = this.time.addEvent({ delay: 55 / this.speed(), repeat: m.n, callback: () => { i++; if (i >= m.n) { s.destroy(); res(); tm.remove(); } else s.setFrame(String(i)); } }); });
  }
  flashSprite(s: Phaser.GameObjects.Sprite) { const tint = (s as any).tintTopLeft; s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL); this.time.delayedCall(90 / this.speed(), () => { if (!s.active) return; s.setTintMode(Phaser.TintModes.MULTIPLY); s.setTint(typeof tint === 'number' ? tint : 0xffffff); }); }
  flashAll(c: number) { const r = this.add.rectangle(0, 0, W, 400, c, 0.8).setOrigin(0, 0).setDepth(70); return new Promise<void>((res) => this.tweens.add({ targets: r, alpha: 0, duration: 350 / this.speed(), onComplete: () => { r.destroy(); res(); } })); }
  by(uid: number) { return [...this.B.party, ...this.B.foes].find((x) => x.uid === uid)!; }
  // ---------------------------------------------------------------- flow
  async run() {
    const B = this.B; const troop = B.troop;
    Audio.bgm(this.d.bgm || troop.bgm || (B.bossDef ? B.bossDef.bgm || 'boss' : 'battle'), { fade: 0.2 });
    await this.fader.in(this, 300); this.fader.rect.fillAlpha = 0;
    if (B.bossDef) { await this.bossIntro(); if (troop.intro) await this.log(troop.intro, 1100); await this.assistOffer(); }
    else if (troop.intro) await this.log(troop.intro, 1100);
    if (this.d.preempt) await this.log('You strike first! The enemy hesitates…', 800);
    let first = true;
    while (!this.ended) {
      this.hideLog(); const sev = B.startRound(); await this.play(sev); if (this.endCheck()) return; this.drawOrder(); this.refreshStatus();
      const skipFoes = first && this.d.preempt; if (skipFoes) for (const f of B.foes) f.action = { type: 'wait' }; first = false;
      const r = await this.commandPhase(); if (r === 'escape') return this.finish('escape');
      await this.actionPhase(); if (this.ended) return; if (this.endCheck()) return;
      await this.play(B.endRound()); if (this.endCheck()) return;
      this.refreshStatus(); this.drawOrder();
    }
  }
  /** Boss intro: letterbox bars (tinted per boss) + epithet nameplate + a bell sting whose pitch is per-boss. Full version first time; later 0.8 s. Any OK/Cancel press skips. */
  async bossIntro() {
    const B = this.B; const boss = B.foes.find((f) => f.boss); if (!boss) return; const id = boss.id; const first = !$.bossSeen[id]; $.bossSeen[id] = true;
    const tint = boss.tint ? parseInt(boss.tint.replace('#', ''), 16) : 0x101030; const dark = Phaser.Display.Color.ValueToColor(tint).darken(70).color;
    const bh = 64; const top = this.add.rectangle(W / 2, -bh / 2, W, bh, dark).setDepth(300), bot = this.add.rectangle(W / 2, H + bh / 2, W, bh, dark).setDepth(300);
    const ep = (SPEC.bosses?.[id]?.epithet) || ''; let hue = 0; for (const ch of id) hue = (hue * 31 + ch.charCodeAt(0)) % 7;
    const name = this.add.text(W / 2, H - 60, boss.name, { fontFamily: FONT, fontSize: '30px', color: '#ffe9a0', stroke: '#101030', strokeThickness: 5 }).setOrigin(0.5).setDepth(301).setAlpha(0);
    const epi = this.add.text(W / 2, H - 28, ep, { fontFamily: FONT, fontSize: '19px', color: '#cfe2ff', stroke: '#101030', strokeThickness: 4 }).setOrigin(0.5).setDepth(301).setAlpha(0);
    const skip = this.add.text(W - 10, 8, 'Z skip', { fontFamily: FONT, fontSize: '14px', color: '#8890b8' }).setOrigin(1, 0).setDepth(301);
    const dur = first ? 2300 : 800; const inMs = first ? 380 : 180;
    this.tweens.add({ targets: top, y: bh / 2, duration: inMs }); this.tweens.add({ targets: bot, y: H - bh / 2, duration: inMs });
    this.tweens.add({ targets: [name, epi], alpha: 1, duration: first ? 600 : 200, delay: inMs });
    Audio.se('bell', 0.9, 0.7 + hue * 0.07); if (first) { this.addTrauma(0.25); }
    await new Promise<void>((r) => { let el = 0; const tm = this.time.addEvent({ delay: 16, loop: true, callback: () => { el += 16; if (el > dur || Input.isTriggered('ok') || Input.isTriggered('cancel')) { tm.remove(); r(); } } }); });
    await new Promise<void>((r) => { this.tweens.add({ targets: [top, bot, name, epi, skip], alpha: 0, duration: 220, onComplete: () => r() }); });
    [top, bot, name, epi, skip].forEach((o) => o.destroy());
  }
  /** After any loss to the same boss: an optional hint + Lantern Warmth offer (never forced). */
  async assistOffer() {
    const tid = String(this.d.troop); const n = $.bossLosses[tid] || 0; if (n < 1) return;
    const boss = this.B.foes.find((f) => f.boss)!; const hint = this.bossHint(boss);
    const pick: string = await new Promise((resolve) => {
      this.log(n > 1 ? 'The Lantern flickers… it has failed here before. Would you like a little help?' : 'The Lantern flickers… this fight went badly last time. Would you like a little help?', 99999);
      this.setCmd([{ label: 'A hint', data: 'hint' }, { label: 'Warm the Lantern', data: 'warm' }, { label: 'Hint + Warmth', data: 'both' }, { label: 'No thanks', data: 'no' }], (it) => { this.cmdWin.active = false; this.cmdWin.setVisible(false); resolve(it.data); }, () => { this.cmdWin.active = false; this.cmdWin.setVisible(false); resolve('no'); });
    });
    if (pick === 'warm' || pick === 'both') { (this.B as any).ctx.warmth = Math.max((this.B as any).ctx.warmth || 0, 2); this.warmBoost = 2; }
    if (pick === 'hint' || pick === 'both') await this.log(hint, 3200); else this.hideLog();
    if (pick === 'warm' || pick === 'both') await this.log('The Lantern glows warm: the party recovers a little each round.', 1500);
  }
  bossHint(f: Battler): string { const h: Record<string, string> = { straw_warden: 'Its straw is weak to fire. Shift to the Far Shore to cancel its stare, and keep an Echo pip to chain a second hit.', bell_keeper: 'Hit the bell’s weakness to break the Veil, then Parley. Guard when the ⚠ warning appears.' }; return h[f.id] || `${f.name} has a weak point. Watch which element makes WEAK! appear, break its Veil ◆, then Soothe or Send.`; }
  endCheck() { const r = this.B.checkEnd(); if (r === 'win') { this.victory(); return true; } if (r === 'lose') { this.defeat(); return true; } if (this.B.ended === 'escape') { this.finish('escape'); return true; } return false; }
  // ---------------------------------------------------------------- command phase
  setCmd(items: any[], onOk: (it: any) => void, onCancel: (() => void) | null) { const c = this.cmdWin; c.rowH = 27; c.pad = 10; c.fontSize = 20; c.setItems(items); c.onOk = onOk; c.onCancel = onCancel; c.active = true; c.setVisible(true); }
  commandPhase(): Promise<'ok' | 'escape'> {
    const B = this.B;
    return new Promise((resolve) => {
      const party = () => {
        this.statusWin.setVisible(true); this.subWin.setVisible(false); this.descWin.setVisible(false); this.cmdWin.keepIndexOnSet = true; this.hideTarget(); this.refreshStatus(); this.drawOrder();
        // B3: bosses suspend Auto for this fight only; the saved Auto Battle setting is left alone
        if (this.B.bossDef && this.autoLocal === null && Settings.data.autoBattle) this.autoLocal = false;
        if (this.autoOn) { if (Input.isTriggered('cancel')) { this.setAuto(false); } else { this.autoPlan(); resolve('ok'); return; } }
        this.setCmd([{ label: 'Fight', data: 'fight' }, { label: 'Flee', data: 'escape', enabled: !B.noEscape || $.items.smoke_ball > 0 }, { label: 'Auto: ' + (this.autoOn ? 'ON' : 'OFF'), data: 'auto' }, { label: 'Speed: ×' + this.speed(), data: 'speed' }], (it) => {
          if (it.data === 'fight') { this.cmdWin.active = false; actorCmd(0); }
          else if (it.data === 'escape') { this.cmdWin.active = false; this.doFlee().then((ok) => { if (ok) resolve('escape'); else { B.party.forEach((p) => { if (p.hp > 0) p.action = { type: 'wait' }; }); resolve('ok'); } }); }
          else if (it.data === 'auto') { this.setAuto(!this.autoOn); if (this.autoOn) { this.cmdWin.active = false; this.autoPlan(); resolve('ok'); } else party(); }
          else if (it.data === 'speed') { Settings.data.battleSpeed = this.speed() === 1 ? 2 : 1; Settings.save(); party(); }
        }, null);
      };
      const actorCmd = (i: number) => {
        while (i < B.party.length && B.party[i].hp <= 0) i++;
        if (i >= B.party.length) { this.cmdWin.active = false; this.refreshStatus(); resolve('ok'); return; }
        const a = B.party[i]; const prev = () => { let j = i - 1; while (j >= 0 && B.party[j].hp <= 0) j--; if (j < 0) { this.refreshStatus(); party(); } else actorCmd(j); };
        this.chooseAction(a, false, prev).then((act) => { if (act) { a.action = act; actorCmd(i + 1); } });
      };
      party();
    });
  }
  autoPlan() { for (const a of this.B.party) if (a.hp > 0) a.action = this.B.autoAction(a); this.cmdWin.active = false; }
  skillLists(a: Battler) {
    const sk = (id: string) => SPEC.skills[id]; const ids = a.skills.filter((id) => sk(id));
    const skill = ids.filter((id) => { const s = sk(id); return s.type !== 'field' && !s.tags?.includes('summon') && !s.tags?.includes('parley') && !s.tags?.includes('bondSkill') && !s.tags?.includes('shift') && s.type !== 'parley' && id !== 'p_attack' && id !== 'p_guard' && !(s.effects || []).some((e: any) => e.op === 'shift' || e.op === 'send' || e.op === 'invite'); });
    const parley = ids.filter((id) => { const s = sk(id); return s.type === 'parley' || s.tags?.includes('parley'); });
    const bond = ids.filter((id) => sk(id).tags?.includes('bondSkill'));
    return { skill, parley, bond };
  }
  /** Opens the command menu for actor `a`. echo=true limits to Attack/Skill/Bond (Echo extra action). Resolves to an action or null when cancelled. */
  chooseAction(a: Battler, echo: boolean, prev: (() => void) | null): Promise<any | null> {
    const B = this.B;
    return new Promise((resolve) => {
      this.curActor = a; this.refreshStatus(a); this.subWin.setVisible(false); this.descWin.setVisible(false); this.statusWin.setVisible(true); this.hideTarget();
      const L = this.skillLists(a); const isMio = a.id === 'mio';
      const items: any[] = [{ label: 'Attack', data: 'attack' }, { label: 'Skill', data: 'skill', enabled: L.skill.length > 0 }];
      if (!echo) items.push({ label: 'Parley', data: 'parley' });
      items.push({ label: 'Bond', data: 'bond', enabled: !!a.bond || a.gauge >= 50 });
      if (!echo && a.keepsake) { const cs = B.canSummon(a, a.keepsake); items.push({ label: 'Keepsake', data: 'keep', enabled: cs.ok, sub: cs.why }); }
      if (!echo) { items.push({ label: 'Guard', data: 'guard' }, { label: 'Item', data: 'item' }); if (isMio) { const cu = B.canUse(a, 'mio_shift'); items.push({ label: 'Shift', data: 'shift', enabled: cu.ok, value: B.realm === 'near' ? '10◈' : '', sub: cu.why }); } }
      this.cmdWin.keepIndexOnSet = false;
      this.setCmd(items, async (it) => {
        this.cmdWin.active = false;
        const back = () => { this.subWin.setVisible(false); this.descWin.setVisible(false); this.statusWin.setVisible(true); this.cmdWin.active = true; this.hideTarget(); this.refreshStatus(a); };
        const done = (act: any) => { this.refreshStatus(); resolve(act); };
        const pickSkill = async (list: string[], extra: any[] = []) => {
          const entries = list.map((id) => { const s = SPEC.skills[id]; const cu = B.canUse(a, id); return { label: s.name, value: [s.cost.bond ? s.cost.bond + ' BG' : s.cost.sp ? s.cost.sp + ' SP' : '', s.cost.echo ? s.cost.echo + '◆' : '', s.cost.lumen ? s.cost.lumen + '◈' : ''].filter(Boolean).join(' '), enabled: cu.ok, data: { id, s } }; }).concat(extra);
          if (!entries.length) { Audio.se('buzzer'); return back(); }
          const r = await this.pickFromList(entries, (d: any) => (d.desc ?? d.s?.desc ?? '')); if (!r) return back();
          return r;
        };
        const target = async (scope: string, id?: string) => this.pickTarget(scope, a, id);
        if (it.data === 'attack') { const t = await target('one_enemy'); if (!t) return back(); done({ type: 'skill', skill: 'p_attack', targets: t }); }
        else if (it.data === 'guard') done({ type: 'guard' });
        else if (it.data === 'keep') { const sd = SPEC.summons.summons[a.keepsake!]; const r = await this.pickFromList([{ label: sd.name, value: sd.cost.sp + ' SP ' + sd.cost.lumen + '◈' + (sd.cost.echo ? ' ' + sd.cost.echo + '◆' : ''), enabled: B.canSummon(a, a.keepsake!).ok, data: { id: sd.id, desc: sd.desc + '  (Tier ' + sd.tier + ' · once per battle)' } }], (d: any) => d.desc); if (!r) return back(); done({ type: 'summon', summon: r.id }); }
        else if (it.data === 'shift') done({ type: 'shift' });
        else if (it.data === 'skill') { const r = await pickSkill(L.skill); if (!r) return; const t = await target(r.s.scope, r.id); if (!t) return back(); done({ type: 'skill', skill: r.id, targets: t }); }
        else if (it.data === 'parley') {
          const base = [{ label: 'Offer', value: '', enabled: Object.keys($.items).some((k) => DB.items[k]?.offer && $.items[k] > 0), data: { offer: true, desc: 'Give an Offering. Liked items raise Mood a lot; disliked ones lower it.' } }, { label: 'Stand', value: '', data: { id: 'parley_stand', s: SPEC.skills.parley_stand } }, { label: 'Mock', value: '', data: { id: 'parley_mock', s: SPEC.skills.parley_mock } }];
          const r = await pickSkill(L.parley, base); if (!r) return;
          if (r.offer) { const its = Object.keys($.items).filter((k) => DB.items[k]?.offer && $.items[k] > 0).map((k) => ({ label: DB.items[k].name, value: '×' + $.items[k], icon: iconOf(DB.items[k]), data: { ...DB.items[k], id: k } })); const ir = await this.pickFromList(its, (d: any) => d.desc); if (!ir) return back(); const t = await target('one_enemy'); if (!t) return back(); done({ type: 'offer', item: ir.id, targets: t }); }
          else { const t = await target(r.s.scope, r.id); if (!t) return back(); done({ type: 'skill', skill: r.id, targets: t }); }
        } else if (it.data === 'bond') {
          const extra: any[] = []; if (a.bond) extra.push({ label: 'Possess', value: '50 BG', enabled: a.gauge >= 50 && !a.states.possessed, data: { possess: true, desc: SPEC.skills.bond_possess.desc } });
          const r = await pickSkill(L.bond, extra); if (!r) return; if (r.possess) return done({ type: 'possess' }); const t = await target(r.s.scope, r.id); if (!t) return back(); done({ type: 'skill', skill: r.id, targets: t });
        } else if (it.data === 'item') {
          const its = Object.keys($.items).filter((k) => { const d = DB.items[k]; return d && (d.usable === true || d.usable === 'battle') && d.type === 'item' && $.items[k] > 0; }).map((k) => ({ label: DB.items[k].name, value: '×' + $.items[k], icon: iconOf(DB.items[k]), data: { ...DB.items[k], id: k } }));
          if (!its.length) { Audio.se('buzzer'); return back(); }
          const r = await this.pickFromList(its, (d: any) => d.desc); if (!r) return back();
          if (r.effect?.escape) { const t = await this.doSmoke(); if (t) return done({ type: 'escape' }); return back(); }
          const ef = r.effect || {}; const sc = r.scope === 'dead' ? 'one_dead_ally' : r.scope === 'enemies' ? 'all_enemies' : r.scope === 'one_enemy' || ef.vp ? 'one_enemy' : r.scope === 'allies' ? 'all_allies' : (ef.echo || ef.states) && !ef.hp && !ef.cure ? 'self' : 'one_ally'; const t = await target(sc); if (!t) return back(); done({ type: 'item', item: r.id, targets: t });
        }
      }, echo ? () => resolve(null) : prev);
    });
  }
  async doSmoke() { $.items.smoke_ball = Math.max(0, ($.items.smoke_ball || 0) - 1); const r = this.B.tryFlee(true); await this.play(r.ev); return true; }
  async doFlee() {
    const r = this.B.tryFlee(); this.statusWin.setVisible(true); this.subWin.setVisible(false);
    if (r.ok) { Audio.se('escape'); await this.log('You slip away…', 700); return true; }
    if (r.ev.some((e) => e.t === 'say')) { Audio.se('buzzer'); await this.log("There's no running from this!", 900); return false; }
    Audio.se('buzzer'); await this.log("Couldn't get away!", 800); return false;
  }
  pickFromList(entries: any[], descFn: (d: any) => string): Promise<any | null> {
    return new Promise((res) => {
      const sw = this.subWin; sw.cols = 2; sw.rowH = 34; sw.pad = 14; sw.fontSize = 20; this.statusWin.setVisible(false); sw.setVisible(true); this.descWin.setVisible(true);
      const showDesc = (it: any) => { this.descWin.clear(); if (it) this.descWin.txt(descFn(it.data) || '', 16, 4, { size: 14, color: COL.sys, wrap: 535 }); };
      sw.setItems(entries); sw.onSelect = (it) => showDesc(it); showDesc(entries[0]);
      sw.onOk = (it) => { sw.active = false; sw.setVisible(false); this.descWin.setVisible(false); res(it.data); };
      sw.onCancel = () => { sw.active = false; sw.setVisible(false); this.descWin.setVisible(false); res(null); };
      sw.active = true; this.cmdWin.active = false;
    });
  }
  hideTarget() { this.targetWin.setVisible(false); this.cursorTxt.setVisible(false); this.statusWin.setVisible(true); }
  pickTarget(scope: string, user: Battler, skillId?: string): Promise<number[] | null> {
    return new Promise((res) => {
      if (scope === 'self') return res([user.uid]);
      const B = this.B; const enemyScope = scope === 'one_enemy' || scope === 'all_enemies' || scope === 'random_enemy'; const all = scope === 'all_enemies' || scope === 'all_allies';
      const pool = enemyScope ? B.foesAlive() : scope === 'one_dead_ally' ? B.party.filter((a) => a.hp <= 0) : B.party.filter((a) => a.hp > 0);
      if (!pool.length) { Audio.se('buzzer'); return res(null); } if (scope === 'random_enemy') return res([pool[0].uid]);
      let i = 0; this.targetWin.setVisible(true); this.subWin.setVisible(false); this.descWin.setVisible(false); this.statusWin.setVisible(true); this.refreshStatus(this.curActor); this.cmdWin.active = false; const sk = skillId ? SPEC.skills[skillId] : null;
      const show = () => {
        const b = pool[i]; this.targetWin.clear(); const label = all ? (enemyScope ? 'All enemies' : 'All allies') : b.name; this.targetWin.txt(label, 208, 4, { size: 21, align: 'center', color: COL.gold });
        if (enemyScope && !all) {
          const known = [...b.revealed].filter((k) => k.startsWith(B.realm + ':')).map((k) => k.split(':')[1]); const eln = known.length ? known.map((k) => ELEMENT_NAMES[k] + '↑').join(' ') : (b.boss ? 'weakness: ?' : '? ? ?');
          this.targetWin.txt(eln, 12, 28, { size: 14, color: COL.violet }); this.targetWin.txt(`Mood ${Math.round(b.mood)}/${b.calmAt}${b.calm ? ' · Calm' : ''}${b.states.unveiled ? ' · Unveiled' : ''}`, 404, 28, { size: 14, color: b.calm ? COL.teal : '#ff9ed8', align: 'right' });
          const s = this.spr.get(b.uid)!; this.cursorTxt.setVisible(true).setPosition((s as any).bx, (s as any).by - s.displayHeight - 4);
        } else if (enemyScope) { this.cursorTxt.setVisible(false); } else { this.refreshStatus(b); if (!all) { const q = this.posOf(b); this.cursorTxt.setVisible(true).setPosition(q.x, q.y - 70); } else this.cursorTxt.setVisible(false); }
        void sk;
      };
      show();
      const tm = this.time.addEvent({ delay: 16, loop: true, callback: () => {
        if (Input.isRepeated(enemyScope ? 'left' : 'up')) { i = (i + pool.length - 1) % pool.length; Audio.se('cursor'); show(); }
        else if (Input.isRepeated(enemyScope ? 'right' : 'down')) { i = (i + 1) % pool.length; Audio.se('cursor'); show(); }
        else if (Input.isTriggered('ok')) { Input.consume('ok'); Audio.se('ok'); tm.remove(); this.targetWin.setVisible(false); this.cursorTxt.setVisible(false); res(all ? pool.map((p) => p.uid) : [pool[i].uid]); }
        else if (Input.isTriggered('cancel')) { Input.consume('cancel'); Audio.se('cancel'); tm.remove(); this.targetWin.setVisible(false); this.cursorTxt.setVisible(false); this.refreshStatus(this.curActor); res(null); }
      } });
    });
  }
  // ---------------------------------------------------------------- action phase
  async actionPhase() {
    const B = this.B; this.hideLog(); this.cmdWin.active = false; this.subWin.setVisible(false); this.descWin.setVisible(false); this.statusWin.setVisible(true); this.refreshStatus();
    const queue = B.buildOrder().slice();
    for (const b of queue) {
      if (this.ended || B.ended) break; if (b.hp <= 0 || b.gone) continue;
      this.drawOrder(b); this.curActor = b; if (b.side === 'party') this.refreshStatus(b);
      let r = B.act(b); await this.play(r.ev); this.refreshStatus(); if (this.B.checkEnd()) break;
      if (b.side === 'party' && B.canEcho(b, r)) {
        await this.log(`Echo! ${b.name} can act again.`, 500); let act: any = null;
        if (this.autoOn) act = B.autoAction(b); else { this.cmdWin.setVisible(true); act = await this.chooseAction(b, true, null); this.cmdWin.active = false; }
        this.hideLog(); if (act) { await this.play(B.spendEcho(b)); this.drawEcho(); b.action = act; r = B.act(b); await this.play(r.ev); this.refreshStatus(); if (this.B.checkEnd()) break; }
      }
      this.drawOrder();
    }
    this.cmdWin.setVisible(true);
  }
  // ---------------------------------------------------------------- event playback
  async play(evs: Ev[]) { for (const e of evs) await this.playOne(e); this.drawEcho(); this.drawRealm(); }
  async playOne(e: Ev) {
    const B = this.B; const T = (id: number) => this.by(id);
    switch (e.t) {
      case 'turn': break;
      case 'summon': {
        // two events share t:'summon': a foe calling adds ({src, ids}, engine.summon) and a party Keepsake summon ({actor, id, name}); the foe branch used to be an unreachable duplicate case
        if (e.actor === undefined) { Audio.se('bell'); const src = T(e.src); this.addTrauma(0.5); this.layoutFoes(); await this.log(`${src.name}'s bell calls more spirits!`, 900); this.drawOrder(); break; }
        Audio.se('powerup'); await this.log(`${this.by(e.actor).name} calls ${e.name}!`, 500); await playSummonFx(this, e); $.usedSummons[e.id] = ($.usedSummons[e.id] || 0) + 1; break; }
      case 'phase': { this.B.foes.forEach((f) => this.applyForm(f)); this.drawOrder(); await this.t(150); break; }
      case 'use': {
        const a = T(e.actor); const spr = this.spr.get(a.uid); Audio.se(e.se || 'magic'); this.log(`${a.name} ${e.item ? 'uses' : e.skill === 'p_attack' ? 'attacks!' : 'uses'}${e.skill === 'p_attack' ? '' : ' ' + e.name + '!'}`.replace('uses Attack!', 'attacks!'), 420);
        if (spr) this.tweens.add({ targets: spr, y: (spr as any).by + (a.side === 'party' ? -22 : 14), duration: 110 / this.speed(), yoyo: true });
        const tg = (e.targets || []).map(T); const elc = ELEMENT_COLORS[e.element] ? parseInt(ELEMENT_COLORS[e.element].replace('#', ''), 16) : undefined; const anim = e.anim === undefined ? (e.type === 'phys' ? 'slash' : 'spirit') : e.anim;
        if (anim && tg.length) { const t0 = tg[0]; const p = this.posOf(t0); const sc = e.type === 'support' ? 4 : 5; const pm = tg.length > 1 ? tg.map((t) => this.posOf(t)) : [p]; await Promise.race([Promise.all(pm.map((q) => this.fx(anim, q.x, q.y - (t0.side === 'foe' ? 40 : 30), sc, e.type === 'mag' || e.type === 'support' ? undefined : undefined))), this.t(420)]); void elc; } else await this.t(250);
        break; }
      case 'hit': { const t = T(e.target); const p = this.posOf(t); const s = this.spr.get(t.uid)!; t.dispHp = e.hp; this.refreshStatus();
        if (e.immune) { this.popup(p.x, p.y - 50, 'Immune', '#a8b0d0', 26); await this.t(250); break; }
        if (t.side === 'foe') { if (e.weak) this.weakChain = Math.min(this.weakChain + 1, 7); else this.weakChain = 0; }
        Audio.se(e.crit ? 'crit' : e.weak ? 'hit2' : 'hit', 1, e.weak && t.side === 'foe' ? Math.pow(2, (this.weakChain - 1) / 12) : e.resist ? 0.84 : 1);
        this.flashSprite(s); this.addTrauma(t.side === 'party' ? (e.crit ? 0.55 : 0.32) : e.crit ? 0.5 : e.weak ? 0.28 : e.resist ? 0 : 0.14); if (!e.resist) await this.hitStop(e.crit ? 110 : e.weak ? 70 : 40); this.tweens.add({ targets: s, x: p.x + (t.side === 'party' ? -6 : 6), duration: 50 / this.speed(), yoyo: true, repeat: 1 });
        this.popup(p.x, p.y - 56, String(e.dmg), e.weak ? '#ffd866' : e.resist ? '#9aa4c8' : t.side === 'party' ? '#ff9a9a' : '#ffffff', e.crit ? 40 : 30);
        if (e.weak) { this.popup(p.x, p.y - 92, 'WEAK!', '#ffb36b', 22); } else if (e.resist) this.popup(p.x, p.y - 84, 'resist', '#9aa4c8', 18); if (e.crit) this.popup(p.x, p.y - 112, 'CRITICAL', '#ffe08a', 18);
        if (e.weak && t.side === 'foe') { $.bst(t.id).weak = [...t.revealed]; }
        await this.t(e.weak ? 380 : 260); break; }
      case 'miss': { const t = T(e.target); const p = this.posOf(t); this.popup(p.x, p.y - 56, 'Miss', '#c8d0f0', 26); await this.t(240); break; }
      case 'heal': { const t = T(e.target); const p = this.posOf(t); t.dispHp = e.hp; this.refreshStatus(); Audio.se('heal'); this.popup(p.x, p.y - 50, '+' + e.amt, '#8ff0a4'); await this.t(250); break; }
      case 'sp': { const t = T(e.target); const p = this.posOf(t); this.refreshStatus(); this.popup(p.x, p.y - 30, (e.amt >= 0 ? '+' : '') + e.amt + ' SP', '#9ec8ff', 22); await this.t(180); break; }
      case 'dot': { const t = T(e.target); const p = this.posOf(t); t.dispHp = e.hp; this.refreshStatus(); this.popup(p.x, p.y - 40, String(e.dmg), '#ffb36b', 22); await this.t(220); break; }
      case 'state': { const t = T(e.target); const p = this.posOf(t); this.refreshStatus(); if (e.on && !['gathering', 'guard', 'calm'].includes(e.id)) { this.popup(p.x, p.y - 70, this.stLabel(e.id), '#ffe08a', 20); await this.t(180); } break; }
      case 'stage': { const t = T(e.target); const p = this.posOf(t); this.popup(p.x, p.y - 70, e.param.toUpperCase() + (e.stage > 0 ? '↑' : '↓'), e.stage > 0 ? '#9ee6ff' : '#ff9a9a', 20); await this.t(160); break; }
      case 'down': { const t = T(e.target); const s = this.spr.get(t.uid)!; (s as any).glow?.setVisible(false); this.refreshStatus(); if (t.side === 'foe') { Audio.se('explosion'); this.fx('explosion', (s as any).bx, (s as any).by - s.displayHeight / 2, 4); await new Promise<void>((r) => this.tweens.add({ targets: s, alpha: 0, scaleX: s.scaleX * 1.2, scaleY: 0.1, duration: 360 / this.speed(), onComplete: () => r() })); this.lab.get(t.uid)?.setVisible(false); this.clearTell(t); } else { this.tweens.add({ targets: s, angle: 80, alpha: 0.6, duration: 300 }); s.setTint(0x666677); await this.log(`${t.name} is down!`, 500); } break; }
      case 'revive': { const t = T(e.target); const s = this.spr.get(t.uid)!; t.dispHp = e.hp; s.clearTint(); s.setAngle(0); s.setAlpha(1); this.refreshStatus(); break; }
      case 'echo': { this.drawEcho(); if (e.spent) break; if (!$.tutorialsShown.b_echo_first) { $.tutorialsShown.b_echo_first = true; this.log('Echo ◆ — a pip lets the same hero act again at once. Look for the Echo option when it is their turn.', 3200); } Audio.se('powerup'); const x = 408; this.popup(x, 190, 'ECHO ' + '◆'.repeat(e.n), '#c9a0ff', 32); if (e.why === 'flip') this.popup(x, 230, 'Flip bonus!', '#c9a0ff', 20); if (e.why === 'adds') this.popup(x, 230, 'Adds cleared!', '#c9a0ff', 20); await this.t(300); break; }
      case 'vp': { Audio.se('tick'); const t = T(e.target); const p = this.posOf(t); if (!e.refill) this.popup(p.x, p.y - 100, 'VEIL ◆' + e.vp, '#9fe8ff', 20); await this.t(120); break; }
      case 'unveil': { const t = T(e.target); const p = this.posOf(t); Audio.se('strange'); await this.flashAll(0x9fe8ff); this.popup(p.x, p.y - 110, 'UNVEILED!', '#9fe8ff', 34); await this.log(`${t.name} is Unveiled! It can't act, takes more damage — Send is open.`, 1100); break; }
      case 'tell': { const a = T(e.actor); const p = this.posOf(a); Audio.se('strange'); this.showTell(a, e.name); await this.log(`⚠ ${a.name} is gathering power: ${e.name}!`, 900); break; }
      case 'tellcancel': { this.clearTell(T(e.target)); await this.log('The attack is interrupted!', 600); break; }
      case 'skip': { const a = T(e.actor); await this.log(e.why === 'unveil' ? `${a.name} is exposed and can't act!` : `${a.name} can't move!`, 500); break; }
      case 'fizzle': { const a = T(e.actor); await this.log(`${a.name} is dazed — the action fizzles.`, 550); break; }
      case 'guard': { const a = T(e.actor); await this.log(`${a.name} braces for impact.`, 450); this.refreshStatus(); break; }
      case 'mood': { const t = T(e.target); const p = this.posOf(t); Audio.se(e.v >= 0 ? 'magic2' : 'buzzer'); this.popup(p.x, p.y - 56, (e.v >= 0 ? '♥ +' : '♥ ') + e.v, e.v >= 0 ? '#ff9ed8' : '#a8b0d0', 28); $.bst(t.id).parleyed = true; await this.t(380); break; }
      case 'keyact': { await this.log(e.note ? `✦ ${e.note}` : '✦ That was just what it needed.', 1000); break; }
      case 'calm': { const t = T(e.target); const p = this.posOf(t); Audio.se('powerup'); this.popup(p.x, p.y - 80, 'Calm…', '#7fffe0', 30); this.tweens.add({ targets: this.spr.get(t.uid)!, alpha: 0.78, duration: 300 }); this.clearTell(t); await this.log(`${t.name} calms down. ${t.recruit ? 'Send it onward, or Invite it to bond.' : 'You can Send it onward now.'}`, 1000); break; }
      case 'calmbreak': { const t = T(e.target); this.spr.get(t.uid)!.setAlpha(1); await this.log(`${t.name} snaps out of it!`, 500); break; }
      case 'calmwait': { const a = T(e.actor); await this.log(`${a.name} watches quietly.`, 400); break; }
      case 'leave': { const t = T(e.target); const s = this.spr.get(t.uid)!; await this.log(`${t.name} gets restless and wanders off.`, 700); await new Promise<void>((r) => this.tweens.add({ targets: s, alpha: 0, x: (s as any).bx + 80, duration: 400, onComplete: () => r() })); this.lab.get(t.uid)?.setVisible(false); (s as any).glow?.setVisible(false); break; }
      case 'sendfail': { Audio.se('buzzer'); const t = T(e.target); await this.log(`${t.name} isn't ready to be Sent. (Calm it, weaken it, or Unveil it.)`, 1100); break; }
      case 'send': { const t = T(e.target); const p = this.posOf(t); const s = this.spr.get(t.uid)!; Audio.se('bell'); await this.fx('spirit', p.x, p.y - 40, 6); await new Promise<void>((r) => this.tweens.add({ targets: s, alpha: 0, y: (s as any).by - 80, duration: 700 / this.speed(), onComplete: () => r() })); this.lab.get(t.uid)?.setVisible(false); this.clearTell(t); $.bst(t.id).calmed++; await this.log(`${t.name} is guided onward. ${e.fragment ? 'A Name Fragment remains.' : 'A Wish Scrap remains.'}`, 900); break; }
      case 'invitefail': { Audio.se('buzzer'); const t = T(e.target); await this.log(e.why === 'calm' ? `${t.name} must be Calm before you can Invite it.` : `${t.name} can't be invited.`, 900); break; }
      case 'invite': { const t = T(e.target); const p = this.posOf(t); const s = this.spr.get(t.uid)!; await this.log(`Mio holds out her hand… (${Math.round(e.chance * 100)}%)`, 700);
        if (e.ok) { Audio.se('powerup'); await this.fx('spirit', p.x, p.y - 40, 6); await new Promise<void>((r) => this.tweens.add({ targets: s, alpha: 0, y: (s as any).by - 60, duration: 600 / this.speed(), onComplete: () => r() })); this.lab.get(t.uid)?.setVisible(false); Audio.me('secret'); await this.log(`${t.name} accepts! It will walk beside you as a Bond.`, 1300); }
        else { Audio.se('buzzer'); s.setAlpha(1); await this.log(`${t.name} hesitates and pulls back… (it's no longer Calm)`, 1000); } break; }
      case 'say': { await this.log(e.text, 1400); break; }
      case 'tutorial': { if (!$.tutorialsShown['b_' + e.id] && TUT[e.id]) { $.tutorialsShown['b_' + e.id] = true; await this.log(TUT[e.id], 2600); } break; }
      case 'realm': { Audio.se('shift'); await this.flashAll(e.realm === 'far' ? 0xcff6ff : 0xffe9b0); this.refreshRealmVisuals(); this.popup(W / 2, 200, e.realm === 'far' ? 'Far Shore' : 'Near Shore', e.realm === 'far' ? '#7fe9ff' : '#ffe08a', 40); this.drawOrder(); await this.t(400); break; }
      case 'forcedShift': { await this.log('The Lantern gutters… the Far Shore lets go of you.', 900); this.refreshRealmVisuals(); await this.flashAll(0xffffff); break; }
      case 'lumen': this.drawRealm(); break;
      case 'reveal': { Audio.se('magic2'); const t = T(e.target); $.bst(t.id).weak = [...new Set([...($.bst(t.id).weak || []), ...t.revealed])]; await this.t(200); break; }
      case 'gold': { Audio.se('coin'); await this.log(`+${e.v} gold!`, 500); break; }
      case 'escape': { if (!e.ok) break; Audio.se('escape'); await this.log('You slip away…', 600); break; }
      default: break;
    }
  }
  showTell(a: Battler, name: string) { this.clearTell(a); const s = this.spr.get(a.uid)!; const t = this.add.text((s as any).bx, (s as any).by - s.displayHeight - 8, '⚠ ' + name, { fontFamily: FONT, fontSize: '22px', color: '#ff7a7a', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(90); this.tweens.add({ targets: t, alpha: 0.4, duration: 260, yoyo: true, repeat: -1 }); this.tellIcons.set(a.uid, t); }
  clearTell(a: Battler) { this.tellIcons.get(a.uid)?.destroy(); this.tellIcons.delete(a.uid); }
  // ---------------------------------------------------------------- end
  async victory() { delete $.bossLosses[String(this.d.troop)];
    this.ended = true; this.tellIcons.forEach((t) => t.destroy()); this.hideLog(); this.cmdWin.setVisible(false); this.subWin.setVisible(false); this.descWin.setVisible(false); this.cursorTxt.setVisible(false); this.targetWin.setVisible(false);
    Audio.bgm(null); Audio.me('victory'); const B = this.B; const avg = B.party.reduce((s, p) => s + p.level, 0) / B.party.length; const res: any = B.rewards(avg);
    this.syncBack(); B.party.forEach((a) => { if (a.hp <= 0) { $.actors[a.id].hp = 1; } });
    // Parley pays Lumen: a Far fight that ends in Calm/Send refunds +2 (+1 if only Hollowed were sent)
    if (this.d.realm === 'far') { const peace = B.foes.filter((f: any) => f.calm || f.gone === 'sent' || f.gone === 'invited'); if (peace.length) { const gain = 2; $.lumen = Math.min($.lumenMax, $.lumen + gain); res.lumenGain = gain; } }
    const lv: any[] = []; for (const id of $.party) { const a = $.actors[id]; const r = $.gainExp(a, res.exp); if (r.leveled) lv.push({ id, ...r }); }
    $.gold += res.gold; $.fragments += B.fragments; for (const d of res.drops) if (DB.items[d]) $.gain(d, 1);
    for (const k of Object.keys($.items)) if (!$.items[k]) delete $.items[k];
    const newBonds: string[] = []; for (const r of B.recruits) { if ($.addBond(r.id)) newBonds.push(r.id); }
    for (const f of B.foes) { const b = $.bst(f.id); if (!f.gone && f.hp <= 0) b.defeated++; b.weak = [...new Set([...(b.weak || []), ...f.revealed])]; if (f.id === 'dust_wisp' && (f.hp <= 0 || f.gone === 'sent')) $.setV('wisp_count', $.v('wisp_count') + 1); }
    if (B.sentList.length || B.recruits.length) $.setSw('first_send', true);
    const songs: string[] = []; for (const p of B.party) { const sp = $.actors[p.id]?.equips.bond; if (!sp || !$.bonds[sp]) continue; for (const [sid, r] of Object.entries<any>(SPEC.learn.bond)) { if (r.spirit !== sp || $.bonds[sp].lv < r.level || $.songs.includes(sid)) continue; $.lessons[sid] = ($.lessons[sid] || 0) + 1; if ($.lessons[sid] >= r.battles && $.learnSong(sid)) songs.push(sid); } }
    for (const id of $.party) $.refreshSkills($.actors[id]);
    this.wonResult = { res, lv };
    const names: Record<string, number> = {}; for (const d of res.drops) names[DB.items[d]?.name || d] = (names[DB.items[d]?.name || d] || 0) + 1; const dn = Object.entries(names).map(([k, v]) => k + (v > 1 ? ' ×' + v : ''));
    const rows: { t: string; c?: string; sz?: number; x?: number; gap?: number }[] = [];
    if (dn.length) rows.push({ t: 'Found: ' + dn.join(', '), c: COL.green, sz: 18, gap: dn.join(', ').length > 46 ? 52 : 30 });
    if (res.lumenGain) rows.push({ t: `The Lantern warms: +${res.lumenGain} Lumen (a peaceful end)`, c: COL.lumen, sz: 18, gap: 30 });
    for (const sg of songs) rows.push({ t: `♪ Bond Song learned: ${SPEC.skills[sg]?.name || sg}`, c: COL.violet, sz: 19, gap: 30 });
    for (const b of newBonds) rows.push({ t: `★ ${SPEC.enemies[b]?.name || b} is now a Bond!`, c: COL.violet, sz: 20, gap: 30 });
    for (const l of lv) { const t = `${DB.actors[l.id].name} → Lv ${l.to}!` + (l.learned.length ? '  New: ' + l.learned.map((x: string) => SPEC.skills[x]?.name || x).join(', ') : ''); rows.push({ t, c: '#ffe9a0', sz: 18, gap: t.length > 46 ? 52 : 30 }); }
    const hgt = 130 + rows.reduce((q, r) => q + (r.gap || 30), 0); const win = new Win(this, 128, Math.max(70, 380 - hgt / 2 - 60), 560, hgt, B.realm); win.setDepth(120); this.wins.push(win); let y = 12;
    win.txt('Victory!', 280, y, { size: 34, color: COL.gold, align: 'center' }); y += 52;
    win.txt(`EXP  +${res.exp}`, 40, y, { size: 22 }); win.txt(`Gold +${res.gold}`, 240, y, { size: 22, color: COL.gold }); if (B.fragments) win.txt(`Fragments +${B.fragments}`, 400, y, { size: 20, color: COL.violet }); y += 38;
    for (const r of rows) { win.txt(r.t, 40, y, { size: r.sz || 18, color: r.c, wrap: 480 }); y += r.gap || 30; }
    if (lv.length) setTimeout(() => Audio.me('levelup'), 1400);
    win.txt('▼', 530, hgt - 34, { size: 20, color: COL.gold });
    await this.t(600); await new Promise<void>((r) => { const tm = this.time.addEvent({ delay: 16, loop: true, callback: () => { if (Input.isTriggered('ok') || Input.isTriggered('cancel') || Input.isDown('skip')) { Input.consume('ok'); Input.consume('cancel'); tm.remove(); r(); } } }); });
    this.finish('win');
  }
  async defeat() { this.ended = true; if (this.B.bossDef) { const k = String(this.d.troop); $.bossLosses[k] = ($.bossLosses[k] || 0) + 1; } this.tellIcons.forEach((t) => t.destroy()); Audio.bgm(null); Audio.me('gameover'); await this.log('Everyone’s light gutters out…', 1400); this.syncBack(); this.finish('lose'); }
  syncBack() { for (const a of this.B.party) { const ac = $.actors[a.id]; ac.hp = a.hp; ac.sp = a.sp; } $.lumen = this.B.lumen; $.realm = this.B.realm; for (const k of Object.keys($.items)) if (!$.items[k]) delete $.items[k]; }
  async finish(r: 'win' | 'escape' | 'lose') {
    this.ended = true; this.hideLog(); if (r !== 'win') this.syncBack(); this.B.party.forEach((a) => { const ac = $.actors[a.id]; ac.states = []; });
    await this.fader.out(this, 300); this.d.onEnd(r, this.B.peaceful, { forcedNear: this.B.forcedNear });
  }
}
void H;
