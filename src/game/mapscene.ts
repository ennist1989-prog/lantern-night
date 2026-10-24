import { payField } from '../core/fielduse';
import Phaser from 'phaser';
import { Input } from '../core/input';
import { Audio } from '../core/audio';
import { Settings } from '../core/settings';
import { $ } from '../core/state';
import { DB, loadMapData } from '../core/db';
import { SPEC } from '../battle/spec';
import { SaveManager, mapName } from '../core/save';
import { W, H, Win, COL, FONT, Fader, sleep } from '../ui/windows';
import { MessageSystem } from '../ui/message';
import { Char, TS, Dir, DV, OPP } from './character';
import { Interpreter } from './interpreter';
import { recolorCanvas, farTexture } from './recolor';
const SHEETS = ['floor', 'ifloor', 'wallsimple', 'water'];
export interface GEvent { id: number; data: any; char: Char; page: any | null; pageIdx: number; wander: number; erased: boolean; aggro: boolean; stun: number; marker: Phaser.GameObjects.Text | null; home: { x: number; y: number }; running: boolean; }
export class MapScene extends Phaser.Scene {
  world!: Phaser.GameObjects.Container; ui!: Phaser.GameObjects.Container; fxLayer!: Phaser.GameObjects.Container; msg!: MessageSystem; fader!: Fader; interp!: Interpreter;
  mapData: any; player!: Char; followers: Char[] = []; evs: GEvent[] = []; extra: Phaser.GameObjects.GameObject[] = []; groundImgs: Record<string, Phaser.GameObjects.Image> = {}; objs: Phaser.GameObjects.Image[] = [];
  ready = false; transitioning = false; overlay = false; shiftLocked = false; shifting = false; wasMoving = false; trail: { x: number; y: number }[] = []; shiftCool = 0;
  hud!: Win; hudG!: Phaser.GameObjects.Graphics; hudTxt!: Phaser.GameObjects.Text; hudLum!: Phaser.GameObjects.Text; vig!: Phaser.GameObjects.Image; glows: Phaser.GameObjects.Image[] = []; motes: { s: Phaser.GameObjects.Rectangle; vx: number; vy: number }[] = [];
  tintRect!: Phaser.GameObjects.Rectangle; banner: Win | null = null; stepsLeft = 50; scrollX = 0; scrollY = 0; camOverride: { x: number; y: number } | null = null; lowWarned = false; lastBgm = '';
  introBlack = false; saveIcon!: Phaser.GameObjects.Text; fadingNow = false; shake_ = 0; pendingMode: any; mapLights: any[] = [];
  constructor() { super('Map'); }
  init(data: any) { this.pendingMode = data || {}; }
  create() {
    this.cameras.main.setBackgroundColor(0x000000);
    this.world = this.add.container(0, 0).setScale(3); this.fxLayer = this.add.container(0, 0).setDepth(50); this.ui = this.add.container(0, 0).setDepth(100);
    this.msg = new MessageSystem(this, this.ui); this.fader = new Fader(this, 99999); this.fader.rect.fillAlpha = 1; /* black from the first frame; start() reveals */ this.interp = new Interpreter(this);
    // darkness vignette (Far Shore): clear centre, dark edges
    const vw = 1632, vh = 1248; if (!this.textures.exists('vig')) { const vc = this.textures.createCanvas('vig', vw, vh)!; const vx = vc.getContext(); const g = vx.createRadialGradient(vw / 2, vh / 2, 250, vw / 2, vh / 2, 640);
    g.addColorStop(0, 'rgba(4,10,40,0)'); g.addColorStop(0.55, 'rgba(4,10,40,0.28)'); g.addColorStop(1, 'rgba(2,6,28,0.62)'); vx.fillStyle = g; vx.fillRect(0, 0, vw, vh); vc.refresh(); }
    if (!this.textures.exists('glow')) { const gc = this.textures.createCanvas('glow', 128, 128)!; const gx = gc.getContext(); const gg = gx.createRadialGradient(64, 64, 2, 64, 64, 64); gg.addColorStop(0, 'rgba(190,250,255,0.85)'); gg.addColorStop(0.4, 'rgba(120,210,255,0.35)'); gg.addColorStop(1, 'rgba(60,140,255,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128); gc.refresh(); }
    this.vig = this.add.image(W / 2, H / 2, 'vig').setVisible(false); this.fxLayer.add(this.vig);
    this.tintRect = this.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0, 0); this.fxLayer.add(this.tintRect);
    for (let i = 0; i < 26; i++) { const s = this.add.rectangle(Math.random() * W, Math.random() * H, 3, 3, 0xcff6ff, 0.5); this.motes.push({ s, vx: (Math.random() - 0.5) * 10, vy: -8 - Math.random() * 14 }); this.fxLayer.add(s); s.setVisible(false); }
    // HUD
    this.hud = new Win(this, 8, 8, 226, 62); this.hudG = this.hud.gfx; this.ui.add(this.hud); this.hud.setAlpha(0.95);
    this.saveIcon = this.add.text(W - 40, 10, '✦', { fontFamily: FONT, fontSize: '24px', color: '#ffe9a0', stroke: '#000', strokeThickness: 3 }).setAlpha(0); this.ui.add(this.saveIcon);
    this.sys.events.on('shutdown', () => { this.ready = false; });
    this.start();
  }
  async start() {
    const mode = this.pendingMode.mode || 'load';
    if (mode === 'new') { $.newGame(); }
    await this.loadMap($.map.id, $.map.x, $.map.y, $.map.dir as Dir, { first: true });
    this.ready = true;
    if (mode === 'new') { this.introBlack = true; this.checkAutoRun(); this.time.delayedCall(4000, () => { if (this.introBlack) { this.introBlack = false; this.fader.in(this, 500); } }); }   // the opening narration takes over from the black screen
    else { await this.fader.in(this, 500); this.checkAutoRun(); }
  }
  mapBgm() { const b = this.mapData.bgm || {}; return $.realm === 'far' ? b.far || b.near : b.near; }
  // ------------------------------------------------------------ map building
  async loadMap(id: number, x: number, y: number, dir: Dir, opts: any = {}) {
    this.ready = false; const md = await loadMapData(id); this.mapData = md;
    // teardown
    this.evs.forEach((e) => { e.char.destroy(); e.marker?.destroy(); }); this.evs = []; this.followers.forEach((f) => f.destroy()); this.followers = []; this.player?.destroy();
    this.objs.forEach((o) => o.destroy()); this.objs = []; Object.values(this.groundImgs).forEach((g) => g.destroy()); this.groundImgs = {}; this.glows.forEach((g) => g.destroy()); this.glows = [];
    for (const r of ['near', 'far']) { const k = `ground_${r}`; if (this.textures.exists(k)) this.textures.remove(k); }
    if (opts.resetDefeated) { for (const k of Object.keys($.defeated)) if (k.startsWith(id + ':')) delete $.defeated[k]; }
    $.map = { id, x, y, dir };
    this.bakeGround(md);
    this.buildObjects(); this.player = new Char(this, x, y); this.player.setSheet('mio', false, dir); this.world.add(this.player.spr);
    this.trail = [{ x, y }]; this.refreshFollowers();
    this.buildEvents(); this.applyRealmVisuals(); this.refreshEvents();
    this.stepsLeft = this.rollSteps(true, SPEC.zones[this.zoneId()]?.encounterSteps?.[$.realm] || 26); $.grace = 0;
    this.updateCamera(true);
    Audio.bgm(this.mapBgm());
    this.mapLights = (md.lights || []);
    this.ready = true;
  }
  bakeGround(md: any) {
    const w = md.w, h = md.h;
    for (const realm of ['near', 'far'] as const) {
      const c = document.createElement('canvas'); c.width = w * TS; c.height = h * TS; const ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = false;
      const L = md.layers[realm];
      for (const lname of Object.keys(L)) {
        const arr: number[] = L[lname];
        for (let i = 0; i < arr.length; i++) { const g = arr[i]; if (!g) continue; const sh = g >> 16, row = (g >> 8) & 255, col = g & 255; const img = this.textures.get('tile_' + SHEETS[sh - 1]).getSourceImage() as HTMLImageElement; ctx.drawImage(img, col * TS, row * TS, TS, TS, (i % w) * TS, Math.floor(i / w) * TS, TS, TS); }
      }
      const out = realm === 'far' ? recolorCanvas(c, c.width, c.height) : c;
      this.textures.addCanvas(`ground_${realm}`, out);
      const im = this.add.image(0, 0, `ground_${realm}`).setOrigin(0, 0).setDepth(-100000); this.world.add(im); this.groundImgs[realm] = im;
    }
  }
  buildObjects() {
    const md = this.mapData;
    for (const realm of ['near', 'far'] as const) for (const o of md.objs[realm] || []) {
      const key = realm === 'far' ? farTexture(this, 'objects') : 'objects';
      const im = this.add.image(o.x, o.y, key, o.n).setOrigin(0.5, 1); im.setDepth(o.flat ? o.y - 5000 : o.y + (o.dy || 0)); (im as any).realm = realm; this.world.add(im); this.objs.push(im);
    }
  }
  buildEvents() {
    for (const d of this.mapData.events) {
      const ch = new Char(this, d.x, d.y); ch.spr.setVisible(false); this.world.add(ch.spr);
      this.evs.push({ id: d.id, data: d, char: ch, page: null, pageIdx: -1, wander: Math.random() * 60, erased: false, aggro: false, stun: 0, marker: null, home: { x: d.x, y: d.y }, running: false });
    }
  }
  /** Encounter counter: RPG Maker's rand(n)+rand(n)+1 (mean ≈ n), with our fairness floor (no back-to-back fights) and first-step grace. */
  rollSteps(first = false, n = 26) { const r = () => Math.floor(Math.random() * n); return Math.max(Math.min(18, Math.round(0.7 * n)), r() + r() + 1) + (first ? 10 : 0); }
  refreshFollowers() {
    this.followers.forEach((f) => f.destroy()); this.followers = [];
    for (let i = 1; i < $.party.length && i < 4; i++) { const f = new Char(this, this.player.tx, this.player.ty); f.setSheet($.party[i], false, this.player.dir); f.through = true; this.world.add(f.spr); this.followers.push(f); }
  }
  applyRealmVisuals() {
    const far = $.realm === 'far';
    this.groundImgs.near.setVisible(!far); this.groundImgs.far.setVisible(far);
    this.objs.forEach((o) => o.setVisible((o as any).realm === (far ? 'far' : 'near')));
    this.player.setSheet('mio', false, this.player.dir); this.followers.forEach((f, i) => f.setSheet($.party[i + 1], false, f.dir));
    this.vig.setVisible(far); this.motes.forEach((m) => m.s.setVisible(far));
    this.msg.setTone(far ? 'far' : 'near'); this.hud.setTone(far ? 'far' : 'near');
    // lantern glows
    this.glows.forEach((g) => g.destroy()); this.glows = [];
    for (const l of this.mapData.lights || []) { if (l.realm && l.realm !== $.realm) continue; const g = this.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setAlpha(far ? 0.75 : 0.28); (g as any).l = l; this.fxLayer.add(g); this.glows.push(g); }
    this.evs.forEach((e) => this.applyPageGraphic(e));
  }
  // ------------------------------------------------------------ events
  eventRealmOK(e: GEvent) { const r = e.data.realm || 'both'; return r === 'both' || r === $.realm || (r === 'far' && $.buffs.peek > 0 && e.data.peek !== false); }
  selectPage(e: GEvent) {
    if (!this.eventRealmOK(e)) return -1; const ctx = { ev: e.id, map: this.mapData.id };
    if ($.selfSwitches[$.selfKey(ctx.map, e.id, 'X')]) return -1;
    for (let i = e.data.pages.length - 1; i >= 0; i--) { const p = e.data.pages[i]; if (!this.interp.cond(p.cond, ctx)) continue; if (p.enemy && $.defeated[`${ctx.map}:${e.id}`]) continue; return i; }
    return -1;
  }
  refreshEvents() { if (!this.mapData) return; for (const e of this.evs) { const i = this.selectPage(e); if (i !== e.pageIdx) { e.pageIdx = i; e.page = i >= 0 ? e.data.pages[i] : null; this.applyPageGraphic(e); } else if (!e.page) this.applyPageGraphic(e); } }
  applyPageGraphic(e: GEvent) {
    const p = e.page, c = e.char; const far = $.realm === 'far' || (e.data.realm === 'far' && $.buffs.peek > 0);
    if (!p || !p.g) { c.spr.setVisible(false); c.visible = false; return; }
    c.tint = p.g.tint ?? 0xffffff; c.opacity = p.g.alpha ?? 1; c.walkAnim = p.g.anim !== false; c.stepAnim = !!p.g.step; c.through = !!p.through;
    if (p.g.obj) c.setObject(p.g.obj, far && !p.g.nofar, !!p.g.flat); else c.setSheet(p.g.sheet, far && !p.g.nofar, p.g.dir || c.dir);
    c.spr.setVisible(true); c.visible = true; c.refreshPos();
  }
  eventsAt(tx: number, ty: number, solidOnly = false) { return this.evs.filter((e) => e.page && (e.char.visible || !e.page.g) && (e.char.tx === tx && e.char.ty === ty) && (!solidOnly || (!e.char.through && !e.page.through))); }
  ctxOf(e: GEvent) { return { ev: e.id, map: this.mapData.id }; }
  async triggerEvent(e: GEvent) {
    if (!e.page || e.running) return;
    if (e.data.realm === 'far' && $.realm === 'near') { Audio.se('cursor'); this.msg.toast('You can only glimpse it from here. Shift to reach it.', 2000, 14, COL.dim); return; } e.running = true; const p = e.page;
    try {
      if (p.enemy) { await this.enemyTouch(e, false); }
      else await this.interp.run(p.list || [], this.ctxOf(e));
    } finally { e.running = false; this.refreshEvents(); Input.clear(); }
  }
  checkAutoRun() {
    if (!this.ready || this.interp.busy || this.transitioning) return;
    for (const e of this.evs) if (e.page && e.page.trigger === 'auto' && !e.running) { this.triggerEvent(e); return; }
  }
  onInterpEnd() { this.refreshEvents(); }
  // ------------------------------------------------------------ passability
  tileFree(tx: number, ty: number, realm = $.realm) { const m = this.mapData; if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return false; const d = this.dynAt(tx, ty, realm); if (d !== null) return d; return m.col[realm][ty * m.w + tx] === 0; }
  /** Map `dyn` rules (mapkit dynwalk): walkability that changes with a switch, e.g. a drifting bridge held by Anchor. */
  dynAt(tx: number, ty: number, realm: string): boolean | null {
    const D = this.mapData.dyn; if (!D || !D.length) return null;
    for (const r of D) { if (r.realm !== 'both' && r.realm !== realm) continue; if (!r.cells.some((c: number[]) => c[0] === tx && c[1] === ty)) continue; if (this.interp.cond(r.cond, { ev: 0, map: this.mapData.id })) return !!r.walk; }
    return null;
  }
  region(tx: number, ty: number) { const m = this.mapData; if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return 0; return m.reg[ty * m.w + tx]; }
  canMove(ch: Char, d: Dir, isPlayer = false) {
    const nx = ch.tx + DV[d][0], ny = ch.ty + DV[d][1];
    if (!this.tileFree(nx, ny)) return false; if (ch.through) return true;
    for (const e of this.evs) { if (e.char === ch) continue; if (!e.page || !e.char.visible || e.page.through || e.char.through) continue; const ex = e.char.moving ? e.char.fx : e.char.tx, ey = e.char.moving ? e.char.fy : e.char.ty; if ((e.char.tx === nx && e.char.ty === ny) || (ex === nx && ey === ny)) { if (!(e.page.enemy && isPlayer === false)) return false; } }
    if (!isPlayer && this.player.tx === nx && this.player.ty === ny) return false;
    return true;
  }
  /** Default 'classic' pace is RPG Maker-like: 16 frames/tile walking (~267 ms), 8 dashing (~133 ms); 'brisk' is the old faster pace (Options). */
  moveDur(dash: boolean) { return Settings.data.walkSpeed === 'brisk' ? (dash ? 98 : 150) : (dash ? 133 : 267); }
  // ------------------------------------------------------------ main loop
  isFree() { return this.ready && !this.interp.busy && !this.overlay && !this.transitioning && !this.msg.busy && !this.shifting && !this.fadingNow; }
  update(time: number, dtRaw: number) {
    if (!this.ready) return; const dt = Math.min(dtRaw, 50);
    const free = this.isFree(); if (free) $.playtime += dt / 1000;
    const wasM = this.player.moving;
    if (free && !this.player.moving) this.playerInput();
    this.player.update(dt);
    if (wasM && !this.player.moving) this.onPlayerStep();
    this.followers.forEach((f) => f.update(dt));
    this.updateEvents(dt, free);
    this.world.sort('depth');
    this.updateLumen(dt, free); this.tickBuffs(dt, free);
    this.updateCamera(); this.updateFx(dt); this.updateHud();
    if (this.shiftCool > 0) this.shiftCool -= dt;
    if (free) this.checkAutoRun();
  }
  playerInput() {
    const P = this.player;
    if (Input.isTriggered('shift')) { Input.consume('shift'); this.tryShift(); return; }
    if (Input.isTriggered('menu')) { Input.consume('menu'); Input.consume('cancel'); this.openMenu(); return; }
    if (Input.isTriggered('ok')) { Input.consume('ok'); this.action(); return; }
    const d = Input.dir4() as Dir | null;
    if (d) {
      const dash = Input.isDown('dash') !== Settings.data.alwaysRun;
      P.face(d);
      if (this.canMove(P, d, true)) {
        P.start(d, this.moveDur(dash)); this.trail.push({ x: P.tx, y: P.ty }); if (this.trail.length > 8) this.trail.shift(); this.moveFollowers(this.moveDur(dash));
      } else {
        // bump into blocking event -> touch trigger
        const nx = P.tx + DV[d][0], ny = P.ty + DV[d][1];
        const evs = this.eventsAt(nx, ny).filter((e) => e.page.trigger === 'touch'); if (evs.length) this.triggerEvent(evs[0]);
      }
    }
  }
  moveFollowers(dur: number) {
    this.followers.forEach((f, i) => { const tgt = this.trail[this.trail.length - 2 - i]; if (!tgt) return; const dx = tgt.x - f.tx, dy = tgt.y - f.ty; if (Math.abs(dx) + Math.abs(dy) === 1) { const d: Dir = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up'; f.start(d, dur); } else if (Math.abs(dx) + Math.abs(dy) > 1) f.place(tgt.x, tgt.y); });
  }
  onPlayerStep() {
    const P = this.player; $.map.x = P.tx; $.map.y = P.ty; $.map.dir = P.dir; $.steps++;
    // touch-trigger events on this tile
    for (const e of this.eventsAt(P.tx, P.ty)) if (e.page.trigger === 'touch' && !e.page.enemy) { this.triggerEvent(e); return; }
    // random encounter counter (Near field zones only; never near Lantern Posts)
    const enc = this.mapData.encounter; const zone = enc ? SPEC.zones[this.zoneId()] : null; const zn = zone?.encounterSteps?.[$.realm] || 0;
    if ($.repel > 0) { $.repel--; if ($.repel === 0) this.msg.toast('The Hush Bell falls silent.', 2200); }
    else if (zone && zn > 0 && this.region(P.tx, P.ty) === (enc.region ?? 3) && !this.inSafeZone(P.tx, P.ty)) {
      if ($.grace > 0) { $.grace--; return; }
      this.stepsLeft--; if (this.stepsLeft <= 0) { this.stepsLeft = this.rollSteps(false, zn); this.randomEncounter(zone); }
    }
  }
  zoneId(): string { const e = this.mapData.encounter; return e ? (e.zones?.[$.realm] ?? e.zone) : ''; }
  inSafeZone(tx: number, ty: number) { return this.region(tx, ty) === 6; }
  async randomEncounter(zone: any) {
    const pool: any[] = zone.tables[$.realm] || []; if (!pool.length) return; let tot = 0; pool.forEach((p) => (tot += p.weight)); let r = Math.random() * tot; let pick = pool[0]; for (const p of pool) { r -= p.weight; if (r <= 0) { pick = p; break; } }
    this.interp.running++; try { await this.startBattle(pick.troop, { random: true, zone: zone.id }); } finally { this.interp.running--; }
  }
  action() {
    const P = this.player; const fx = P.tx + DV[P.dir][0], fy = P.ty + DV[P.dir][1];
    let cands = this.eventsAt(fx, fy).filter((e) => e.page.trigger === 'action' || e.page.enemy);
    // counter-style: talk across a counter tile
    if (!cands.length && this.mapData.counters?.some((c: number[]) => c[0] === fx && c[1] === fy)) { const gx = fx + DV[P.dir][0], gy = fy + DV[P.dir][1]; cands = this.eventsAt(gx, gy).filter((e) => e.page.trigger === 'action'); }
    if (!cands.length) cands = this.eventsAt(P.tx, P.ty).filter((e) => e.page.trigger === 'action');
    const e = cands[0]; if (!e) return;
    if (e.page.enemy) { this.enemyTouch(e, true); return; }
    if (e.page.turn !== false && !e.char.isObj && e.page.g) e.char.face(OPP[P.dir]);
    this.triggerEvent(e);
  }
  updateEvents(dt: number, free: boolean) {
    const P = this.player;
    for (const e of this.evs) {
      const c = e.char; if (!e.page) { if (e.marker) { e.marker.destroy(); e.marker = null; } continue; }
      c.update(dt);
      if (e.stun > 0) e.stun -= dt;
      if (!free || e.running) { continue; }
      const p = e.page;
      if (p.enemy) { this.enemyAI(e, dt); continue; }
      // wander
      if (p.move && p.move.type === 'random' && !c.moving) { e.wander -= dt; if (e.wander <= 0) { e.wander = (p.move.freq ?? 1200) * (0.6 + Math.random() * 0.8); const ds: Dir[] = ['up', 'down', 'left', 'right']; const d = ds[Math.floor(Math.random() * 4)]; c.face(d); if (this.canMove(c, d)) { const hx = Math.abs(c.tx + DV[d][0] - e.home.x), hy = Math.abs(c.ty + DV[d][1] - e.home.y); if (hx <= (p.move.r ?? 2) && hy <= (p.move.r ?? 2)) c.start(d, 260); } } }
      // markers
      const near = p.trigger === 'action' && p.marker !== false && c.visible && Math.abs(c.tx - P.tx) + Math.abs(c.ty - P.ty) <= 2;
      if (near && !e.marker) { e.marker = this.add.text(c.px, c.py - 24, '!', { fontFamily: FONT, fontSize: '9px', color: '#ffe9a0', stroke: '#2a1a00', strokeThickness: 2 }).setOrigin(0.5, 1); this.world.add(e.marker); }
      else if (!near && e.marker) { e.marker.destroy(); e.marker = null; }
      if (e.marker) { e.marker.setPosition(c.px, c.py - 19 + Math.sin(this.time.now / 170) * 1.5); e.marker.setDepth(99999); e.marker.setVisible(true); }
    }
    for (const e of this.evs) { if (e.page && e.page.trigger === 'touch' && !e.page.enemy && !e.running && free && e.char.tx === P.tx && e.char.ty === P.ty && !P.moving && e.char.through === true && false) this.triggerEvent(e); }
  }
  // ------------------------------------------------------------ visible enemies
  enemyAI(e: GEvent, dt: number) {
    const c = e.char, P = this.player, p = e.page.enemy; if (c.moving || e.stun > 0) return;
    const dx = P.tx - c.tx, dy = P.ty - c.ty, dist = Math.abs(dx) + Math.abs(dy);
    if (!this.inSafeZone(c.tx, c.ty) && !this.inSafeZone(P.tx, P.ty) && dist <= (p.aggro ?? 5) && ((p.chase ?? true)) && !($.buffs.stealth > 0)) {
      if (!e.aggro) { e.aggro = true; this.balloonAt(e, '!'); }
      const opts: Dir[] = Math.abs(dx) >= Math.abs(dy) ? [dx > 0 ? 'right' : 'left', dy > 0 ? 'down' : 'up'] : [dy > 0 ? 'down' : 'up', dx > 0 ? 'right' : 'left'];
      for (const d of opts) { if ((d === 'right' || d === 'left') && dx === 0) continue; if ((d === 'up' || d === 'down') && dy === 0) continue; c.face(d); if (this.canMoveEnemy(c, d)) { c.start(d, p.spd ?? 240); break; } }
    } else {
      e.aggro = false; e.wander -= dt;
      if (e.wander <= 0 && p.wander !== false) { e.wander = 700 + Math.random() * 900; const ds: Dir[] = ['up', 'down', 'left', 'right']; const d = ds[Math.floor(Math.random() * 4)]; c.face(d); const hx = Math.abs(c.tx + DV[d][0] - e.home.x), hy = Math.abs(c.ty + DV[d][1] - e.home.y); if (this.canMoveEnemy(c, d) && hx <= (p.range ?? 3) && hy <= (p.range ?? 3)) c.start(d, 320); }
    }
    // touch check by pixel overlap
    const ddx = Math.abs(c.px - P.px), ddy = Math.abs(c.py - P.py);
    if (ddx < 11 && ddy < 11 && !e.running) this.enemyTouch(e, false);
  }
  canMoveEnemy(c: Char, d: Dir) { const nx = c.tx + DV[d][0], ny = c.ty + DV[d][1]; if (!this.tileFree(nx, ny)) return false; if (this.region(nx, ny) === 6) return false; for (const o of this.evs) { if (o.char === c || !o.page || !o.char.visible || o.char.through) continue; if (o.char.tx === nx && o.char.ty === ny) return false; } return true; }
  async enemyTouch(e: GEvent, preempt: boolean) {
    if (e.running || !e.page) return; e.running = true; const p = e.page.enemy;
    this.interp.running++;
    try {
      const res = await this.startBattle(p.troop, { preempt, enemyEv: e.id, boss: !!p.boss, noEscape: !!p.noEscape });
      if (res === 'win' || res === 'calm') { $.defeated[`${this.mapData.id}:${e.id}`] = true; if (e.page.enemy.win) await this.interp.exec(e.page.enemy.win, this.ctxOf(e)); }
      else if (res === 'escape') { e.stun = 3500; }
    } finally { this.interp.running--; e.running = false; this.refreshEvents(); Input.clear(); }
  }
  async balloonAt(e: GEvent, icon: string) { const t = this.add.text(e.char.px, e.char.py - 20, icon, { fontFamily: FONT, fontSize: '12px', color: '#fff', stroke: '#c00', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(99999); this.world.add(t); Audio.se('encounter', 0.35); await sleep(this, 450); t.destroy(); }
  tickBuffs(dt: number, free: boolean) {
    if (!free) return; const B = $.buffs; if (B.stealth > 0) B.stealth = Math.max(0, B.stealth - dt / 1000);
    if (B.light > 0) B.light = Math.max(0, B.light - dt / 1000);
    if (B.peek > 0) { B.peek = Math.max(0, B.peek - dt / 1000); if (B.peek === 0) { this.refreshEvents(); this.applyRealmVisuals(); this.msg.toast('The other Shore fades from view.', 1800, 14, COL.dim); } }
  }
  // ------------------------------------------------------------ Lumen / realm
  updateLumen(dt: number, free: boolean) {
    if (!free && !this.interp.busy) return; if (this.interp.busy && this.msg.busy) return;
    const P = this.player; const safe = this.inSafeZone(P.tx, P.ty);
    if ($.realm === 'far') { if (!safe && !this.interp.busy) $.lumen -= (0.5 * dt * ($.buffs.light > 0 ? 0.5 : 1) * (1 - 0.2 * Settings.data.warmth)) / 1000 * (Settings.data.difficulty === 'tough' ? 1.4 : Settings.data.difficulty === 'gentle' ? 0.6 : 1); if ($.lumen <= 0 && !this.fadingNow && !this.interp.busy) { this.fadeOutOfFar(); } if ($.lumen < 12 && !this.lowWarned) { this.lowWarned = true; Audio.se('strange', 0.7); this.msg.toast('The Lantern flickers… Lumen is low!', 2500, 14, COL.warn); } }
    else { if ($.lumen < $.lumenMax) $.lumen = Math.min($.lumenMax, $.lumen + dt / 1000); if ($.lumen > 20) this.lowWarned = false; }
  }
  async fadeOutOfFar() {
    if (this.fadingNow) return; this.fadingNow = true; this.interp.running++;
    Audio.se('fade'); await this.fader.out(this, 700, 0xffffff);
    $.fades++; $.lumen = 20; $.realm = 'near'; $.healAllPartial(0.5);
    const r = $.respawn; await this.loadMap(r.map, r.x, r.y, r.dir as Dir); this.player.face(r.dir as Dir);
    await this.fader.in(this, 700);
    const lines = DB.system.fadingLines; const ln = lines[$.fades % lines.length];
    await this.msg.show(ln.face, ln.name, ln.text);
    this.fadingNow = false; this.interp.running--; this.autosave('fade');
  }
  findShiftTarget(tx: number, ty: number, target: 'near' | 'far') {
    const ok = (x: number, y: number) => this.tileFree(x, y, target) && this.region(x, y) !== 2 && !this.eventsBlock(x, y, target);
    if (ok(tx, ty)) return { x: tx, y: ty };
    for (let r = 1; r <= 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (ok(tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy }; }
    return null;
  }
  eventsBlock(x: number, y: number, realm: 'near' | 'far') {
    for (const e of this.evs) { const r = e.data.realm || 'both'; if (r !== 'both' && r !== realm) continue; const sw = e.data.pages.some((p: any) => p.g && !p.through && !p.enemy && p.solid !== false && this.interp.cond(p.cond, { ev: e.id, map: this.mapData.id })); if (sw && e.char.tx === x && e.char.ty === y) return true; }
    return false;
  }
  async tryShift() {
    if (this.shiftLocked || this.mapData.noShift) { Audio.se('buzzer'); this.msg.toast('The Lantern will not answer here.', 1800, 14, COL.warn); return; }
    if (this.shiftCool > 0) return;
    const P = this.player; const target: 'near' | 'far' = $.realm === 'near' ? 'far' : 'near'; const safe = this.inSafeZone(P.tx, P.ty);
    if (!$.has('lantern')) { Audio.se('buzzer'); return; }
    const cost = target === 'far' && !safe ? 10 : 0;
    if (this.region(P.tx, P.ty) === 2) { Audio.se('buzzer'); this.msg.toast('A heavy stillness. The Lantern cannot Shift here.', 2200, 14, COL.warn); return; }
    if ($.lumen < cost) { Audio.se('buzzer'); this.msg.toast('Not enough Lumen to Shift.', 1800, 14, COL.warn); return; }
    const t = this.findShiftTarget(P.tx, P.ty, target); if (!t) { Audio.se('buzzer'); this.msg.toast('The Lantern flickers — something blocks the way.', 2200, 14, COL.warn); return; }
    this.shiftCool = 900; $.lumen -= cost; await this.doShift(target, t.x, t.y);
  }
  async forceShift(to: 'near' | 'far', c: any = {}) { const t = this.findShiftTarget(this.player.tx, this.player.ty, to) || { x: this.player.tx, y: this.player.ty }; await this.doShift(to, t.x, t.y, true); }
  async doShift(target: 'near' | 'far', tx: number, ty: number, forced = false) {
    this.shifting = true; Audio.se('shift'); const P = this.player; const jx = Settings.data.juice !== 'off'; const firstFx = !$.tutorialsShown.shift_fx_first; $.tutorialsShown.shift_fx_first = true; const dm = firstFx ? 1.6 : 1; if (jx) Audio.muffle(true, 240 * dm);
    const sx = (P.px - this.scrollX) * 3 + this.world.x - this.world.x, sy = (P.py - 8 - this.scrollY) * 3;
    const g = this.add.graphics().setDepth(80); this.fxLayer.add(g); const cx = sx + (this.mapOffset().x), cy = sy + this.mapOffset().y;
    const obj = { r: 0 }; const col = target === 'far' ? 0xcff6ff : 0xffe9b0;
    await new Promise<void>((res) => this.tweens.add({ targets: obj, r: 760, duration: 240 * dm, ease: 'Cubic.easeIn', onUpdate: () => { g.clear(); g.fillStyle(col, 0.92); g.fillCircle(cx, cy, obj.r); }, onComplete: () => res() }));
    $.realm = target; for (const k of Object.keys($.switches)) if (k.startsWith('tmp_')) delete $.switches[k];   // 'tmp_' switches last only until the next Shift
    if (tx !== P.tx || ty !== P.ty) { P.place(tx, ty); } this.trail = [{ x: P.tx, y: P.ty }]; this.followers.forEach((f) => f.place(P.tx, P.ty));
    $.map.x = P.tx; $.map.y = P.ty; this.applyRealmVisuals(); this.refreshEvents(); Audio.bgm(this.mapBgm(), { fade: 0.9 });
    this.updateCamera(true);
    if (jx) { const tr = this.add.rectangle(W / 2, H / 2, W, H, target === 'far' ? 0x9fe0ff : 0xffd9a0, 0.4).setDepth(79).setScrollFactor(0); this.tweens.add({ targets: tr, alpha: 0, duration: 900 * dm, onComplete: () => tr.destroy() }); Audio.muffle(false, 600 * dm); }
    await new Promise<void>((res) => this.tweens.add({ targets: obj, r: 0, duration: 340 * dm, ease: 'Cubic.easeOut', onUpdate: () => { g.clear(); g.fillStyle(col, 0.85 * Math.min(1, obj.r / 300)); g.fillCircle(cx, cy, obj.r); if (jx) { g.lineStyle(5, 0xffffff, 0.7 * Math.min(1, obj.r / 400)); g.strokeCircle(cx, cy, obj.r + 8); } }, onComplete: () => res() }));
    g.destroy(); this.shifting = false;
    if (target === 'far' && !$.tutorialsShown.shiftfar && !forced) { $.tutorialsShown.shiftfar = true; this.msg.toast('Far Shore: Lumen drains here. Press Q again to return (free).', 5200, 14, '#bff6ff'); }
    if ($.realm === 'near') this.lowWarned = false;
  }
  mapOffset() { return { x: 0, y: 0 }; }
  // ------------------------------------------------------------ camera/fx/hud
  updateCamera(snap = false) {
    const m = this.mapData; if (!m) return; const mw = m.w * TS, mh = m.h * TS; const vw = W / 3, vh = H / 3; const P = this.player;
    const tx = this.camOverride ? this.camOverride.x : P.px, ty = this.camOverride ? this.camOverride.y : P.py - 8;
    let sx = mw <= vw ? -(vw - mw) / 2 : Phaser.Math.Clamp(tx - vw / 2, 0, mw - vw), sy = mh <= vh ? -(vh - mh) / 2 : Phaser.Math.Clamp(ty - vh / 2, 0, mh - vh);
    this.scrollX = Math.round(sx); this.scrollY = Math.round(sy);
    const sh = this.shake_ > 0 ? (Math.random() - 0.5) * this.shake_ * 3 : 0;
    this.world.setPosition(-this.scrollX * 3 + sh, -this.scrollY * 3 + sh);
    void snap;
  }
  updateFx(dt: number) {
    const far = $.realm === 'far'; const P = this.player;
    if (far) {
      this.vig.setPosition((P.px - this.scrollX) * 3, (P.py - 8 - this.scrollY) * 3);
      for (const m of this.motes) { m.s.x += m.vx * dt / 1000; m.s.y += m.vy * dt / 1000; if (m.s.y < -10) { m.s.y = H + 10; m.s.x = Math.random() * W; } m.s.setAlpha(0.35 + 0.25 * Math.sin(this.time.now / 300 + m.s.x)); }
    }
    for (const g of this.glows) { const l = (g as any).l; g.setPosition((l.x * TS + 8 - this.scrollX) * 3, (l.y * TS + 8 - this.scrollY) * 3).setScale((l.r || 4) * 0.6 * (1 + 0.05 * Math.sin(this.time.now / 260 + l.x))); }
    if (this.shake_ > 0) this.shake_ = Math.max(0, this.shake_ - dt / 120);
  }
  updateHud() {
    const far = $.realm === 'far'; const h = this.hud; h.clear(); const show = !this.overlay && !this.msg.busy; h.setVisible(show && !this.transitioning);
    h.txt(far ? 'Far Shore' : 'Near Shore', 16, 6, { size: 18, color: far ? COL.teal : COL.gold });
    const r = $.lumen / $.lumenMax; const low = $.lumen < 15 && far; h.gauge(16, 36, 150, r, low && Math.floor(this.time.now / 200) % 2 ? 0xff8855 : 0x7fe9ff, 0xe8ffff, 12);
    h.txt(String(Math.ceil($.lumen)), 176, 28, { size: 18, color: COL.lumen });
  }
  async showBanner(name: string) { this.banner?.destroy(); const w = Math.max(220, name.length * 14 + 60); const b = new Win(this, (W - w) / 2, 112, w, 52, $.realm === 'far' ? 'far' : 'near'); b.txt(name, w / 2, 8, { size: 24, align: 'center', color: $.realm === 'far' ? COL.teal : COL.gold }); this.ui.add(b); b.setAlpha(0); this.banner = b; this.tweens.add({ targets: b, alpha: 1, duration: 300, yoyo: false }); await sleep(this, 1800); this.tweens.add({ targets: b, alpha: 0, duration: 500, onComplete: () => b.destroy() }); }
  setTint(color: number, a: number, ms: number) { this.tintRect.setFillStyle(color, this.tintRect.fillAlpha); this.tweens.add({ targets: this.tintRect, fillAlpha: a, duration: ms }); }
  wait(ms: number) { return sleep(this, ms); }
  async shake(power: number, ms: number) { if (Settings.data.juice === 'off') return; this.shake_ = power * (Settings.data.juice === 'reduced' ? 0.4 : 1); Audio.se('hit2', 0.5); await sleep(this, ms); this.shake_ = 0; }
  async flash(color: number, ms: number) { const r = this.add.rectangle(0, 0, W, H, color, 0.9).setOrigin(0, 0).setDepth(90); this.fxLayer.add(r); await new Promise<void>((res) => this.tweens.add({ targets: r, alpha: 0, duration: ms, onComplete: () => { r.destroy(); res(); } })); }
  async cameraPan(x: number, y: number, ms: number) { if (x < 0) { this.camOverride = null; return; } this.camOverride = { x: x * TS + 8, y: y * TS + 8 }; await sleep(this, ms); }
  // ------------------------------------------------------------ event helpers for interpreter
  findChar(target: any, ctx: any): Char | null { if (target === 'player') return this.player; if (typeof target === 'string' && target.startsWith('f')) return this.followers[parseInt(target.slice(1)) - 1] || null; const id = target === 'self' ? ctx.ev : target; const e = this.evs.find((x) => x.id === id); return e ? e.char : null; }
  turnChar(target: any, dir: Dir | 'player' | 'away', ctx: any) { const ch = this.findChar(target, ctx); if (!ch) return; if (dir === 'player') { const dx = this.player.tx - ch.tx, dy = this.player.ty - ch.ty; ch.face(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); } else ch.face(dir as Dir); }
  async moveRoute(target: any, route: string[], wait: boolean, ctx: any) {
    const ch = this.findChar(target, ctx); if (!ch) return;
    for (const step of route) {
      if (step.startsWith('wait')) { await sleep(this, parseInt(step.split(':')[1] || '300')); continue; }
      if (step.startsWith('face:')) { ch.face(step.slice(5) as Dir); continue; }
      const d = step as Dir; ch.face(d); const nx = ch.tx + DV[d][0], ny = ch.ty + DV[d][1];
      if (!(ch.through || this.tileFree(nx, ny)) && target !== 'player') continue;
      ch.start(d, 190); if (target === 'player') { this.trail.push({ x: ch.tx, y: ch.ty }); this.moveFollowers(190); }
      await new Promise<void>((res) => { const t = this.time.addEvent({ delay: 16, loop: true, callback: () => { if (!ch.moving) { t.remove(); res(); } } }); });
    }
    if (target === 'player') { $.map.x = this.player.tx; $.map.y = this.player.ty; }
  }
  async balloon(target: any, icon: string, ctx: any) { const ch = this.findChar(target, ctx); if (!ch) return; const t = this.add.text(ch.px, ch.py - 20, icon, { fontFamily: FONT, fontSize: '12px', color: '#fff', stroke: '#345', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(99999); this.world.add(t); await sleep(this, 650); t.destroy(); }
  // ------------------------------------------------------------ transfer
  async transfer(mapId: number, x: number, y: number, dir: Dir, o: any = {}) {
    this.transitioning = true; const sameMap = mapId === this.mapData.id;
    if (o.realm) { $.realm = o.realm; }
    Audio.se(o.se || 'door', 0.6);
    await this.fader.out(this, o.fast ? 150 : 320, o.white ? 0xffffff : 0x000000);
    await this.loadMap(mapId, x, y, dir, { resetDefeated: !sameMap });
    if (o.setRespawn) $.respawn = { map: mapId, x, y, dir };
    await this.fader.in(this, o.fast ? 150 : 320); this.transitioning = false;
    if (!sameMap) { this.showBanner(mapName(mapId)); if (!o.noAuto) this.autosave('transfer'); }
  }
  // ------------------------------------------------------------ saving
  autosave(kind = 'auto') {
    if (kind === 'boss' || kind === 'cp') { $.checkpoint = null; const snap = SaveManager.snapshotString(); $.checkpoint = snap; }
    const r = SaveManager.auto(); if (r.ok) { this.saveIcon.setAlpha(1); this.tweens.add({ targets: this.saveIcon, alpha: 0, duration: 1600, delay: 600 }); }
  }
  // ------------------------------------------------------------ overlays (menu, shop, save)
  runOverlay(key: string, data: any = {}): Promise<any> {
    return new Promise((resolve) => {
      this.overlay = true; Input.clear();
      this.scene.pause(); this.scene.launch(key, { ...data, onClose: (r: any) => { this.scene.stop(key); this.scene.resume(); this.overlay = false; Input.clear(); this.refreshEvents(); this.applyRealmVisuals(); resolve(r); } });
    });
  }
  async openMenu() { Audio.se('ok'); const mr = await this.runOverlay('Menu', { mapScene: true }); if (mr?.action) await this.fieldAction(mr.action); if ($.__reloadRequest) { const rq = $.__reloadRequest; delete $.__reloadRequest; await this.hardReload(rq); } if ($.__titleRequest) { delete $.__titleRequest; this.toTitle(); } }
  /** Map-side effects of field items and spells chosen in the menu. */
  async fieldAction(a: any) {
    this.interp.running++;
    try {
      switch (a.kind) {
        case 'warp': { const L = $.litPost; if (!L) break; await this.fader.out(this, 300, 0xcff6ff); this.interp.running--; await this.transfer(L.map, L.x, L.y, L.dir as Dir, { se: 'powerup', fast: true, realm: 'near' }); this.interp.running++; this.msg.toast('The Lantern carries you back.', 2000, 14, COL.lumen); break; }
        case 'escapeDungeon': { const X = DB.system.dungeonExit?.[$.map.id]; if (!X) break; await this.fader.out(this, 250, 0xffffff); this.interp.running--; await this.transfer(X.map, X.x, X.y, X.dir as Dir, { se: 'powerup', fast: true, realm: 'near' }); this.interp.running++; this.msg.toast('The paper crane folds you out of the dark.', 2200, 14, '#ffe9a0'); break; }
        case 'peek': this.refreshEvents(); this.applyRealmVisuals(); break;
        case 'tile': await this.fieldTile(a); break;
      }
    } finally { this.interp.running--; Input.clear(); this.refreshEvents(); }
  }
  /** A tile spell (Foxfire Torch, Hammer Knock...) hits a matching event within range: the event's `fieldList` runs. */
  async fieldTile(a: any) {
    const P = this.player; const sp = SPEC.skills[a.spell];
    if (a.realm !== 'both' && a.realm !== $.realm) { Audio.se('buzzer'); this.msg.toast(`${sp.name} only works on the ${a.realm === 'far' ? 'Far' : 'Near'} Shore.`, 2200, 14, COL.warn); return; }
    const hit = this.evs.filter((e) => e.page && e.page.ft === a.tile && e.page.fieldList && Math.abs(e.char.tx - P.tx) + Math.abs(e.char.ty - P.ty) <= a.range).sort((x, y) => Math.abs(x.char.tx - P.tx) + Math.abs(x.char.ty - P.ty) - (Math.abs(y.char.tx - P.tx) + Math.abs(y.char.ty - P.ty)))[0];
    if (!hit) { Audio.se('buzzer'); this.msg.toast(`${sp.name}: nothing here responds.`, 2000, 14, COL.dim); return; }
    payField(a.actor, a.pay); Audio.se('powerup'); this.flash(0xffe0a0, 250); hit.running = true;
    try { await this.interp.exec(hit.page.fieldList, this.ctxOf(hit)); } finally { hit.running = false; }
  }
  async hardReload(rq: any) { this.interp.running++; this.transitioning = true; await this.fader.out(this, 300); this.msg.busy = false; const sv = $.map; await this.loadMap(sv.id, sv.x, sv.y, sv.dir as Dir); await this.fader.in(this, 300); this.transitioning = false; this.interp.running--; void rq; }
  toTitle() { Audio.stopBgm(); this.fader.out(this, 400).then(() => { this.scene.stop('Map'); this.scene.start('Title'); }); }
  async openShop(c: any) { await this.runOverlay('Shop', { items: c.items, name: c.name, face: c.face }); }
  async openSave() { await this.runOverlay('SaveLoad', { mode: 'save', fromMap: true }); }
  async inn(c: any) {
    const price = c.price ?? 20; const who = c.name ?? null;
    await this.msg.show(c.face ?? null, who, c.ask ?? `A night's rest is ${price} gold. Stay?`);
    const i = await this.msg.choice([`Rest (${price} G)`, 'Never mind'], 1);
    if (i === 1) { await this.msg.show(c.face ?? null, who, c.no ?? 'Come back anytime.'); return; }
    if ($.gold < price) { Audio.se('buzzer'); await this.msg.show(c.face ?? null, who, c.poor ?? "Oh… you're a bit short. Next time, dear."); return; }
    $.gold -= price; await this.fader.out(this, 500); $.healAll(); $.lumen = $.lumenMax; Audio.me('secret'); await sleep(this, 1200); this.autosave('inn'); await this.fader.in(this, 500);
    await this.msg.show(c.face ?? null, who, c.yes ?? 'Sleep well? HP, SP and Lumen restored!');
  }
  async usePost(ctx: any) {
    const i = await this.msg.choice(['Rest (restore all)', 'Save game', 'Leave'], 2, null);
    if (i === 0) { $.healAll(); $.lumen = $.lumenMax; Audio.se('heal'); this.flash(0xcff6ff, 500); this.msg.toast('The Lantern Post glows. HP, SP and Lumen restored.', 2400, 14, COL.lumen); }
    $.litPost = { map: this.mapData.id, x: this.player.tx, y: this.player.ty, dir: this.player.dir };
    if (i !== 2) $.respawn = { map: this.mapData.id, x: this.player.tx, y: this.player.ty + (this.player.dir === 'up' ? 0 : 0), dir: this.player.dir };
    if (i === 1) { await this.openSave(); }
    if (i === 0) this.autosave('post');
    void ctx;
  }
  async giveExp(n: number) {
    for (const id of $.party) { const a = $.actors[id]; const r = $.gainExp(a, n); if (r.leveled) { Audio.me('levelup'); await this.msg.show(null, null, `${DB.actors[id].name} reached level ${r.to}!` + (r.learned.length ? `\nLearned: ${r.learned.map((s) => DB.skills[s].name).join(', ')}` : '')); } }
    this.msg.toast(`Gained ${n} EXP`, 2000, 14, '#ffe9a0');
  }
  async endGame(c: any) { Audio.stopBgm(); this.interp.running++; await this.fader.out(this, 800); this.scene.stop('Map'); this.scene.start('Credits', { ending: true, done: c?.done || 2, stats: { time: $.playtime, level: Math.max(...$.party.map((p) => $.actors[p].level)), fades: $.fades } }); void c; }
  async gameOver() { await this.fadeOutOfFar(); }
  async startBattle(troopId: string, o: any = {}): Promise<'win' | 'escape' | 'lose' | 'calm'> {
    const troop = SPEC.troops[troopId]; if (!troop) throw new Error('unknown troop ' + troopId); const boss = !!(o.boss || troop.boss);
    const zid = o.zone || this.zoneId(); if (troop.saveBefore) this.autosave('boss');
    Audio.se('encounter'); Audio.bgm(null, {}); await this.flash(0xffffff, 220); await this.fader.out(this, 260);
    this.overlay = true; Input.clear(); const realm = $.realm; let peaceful = false;
    const res: string = await new Promise((resolve) => { this.scene.setVisible(false); this.scene.pause(); this.scene.launch('Battle', { troop: troopId, realm, zone: zid, preempt: !!o.preempt, boss, noEscape: !!(o.noEscape || troop.noEscape), noLose: !!o.noLose, onEnd: (r: string, pe: boolean) => { peaceful = !!pe; this.scene.stop('Battle'); this.scene.setVisible(true); this.scene.resume(); resolve(r); } }); });
    // N1: an in-battle Shift (manual or Auto) is local to ordinary fights. Random encounters and plain map foes put the
    // party back on the shore they were walking before the fight. Scripted/boss battles keep the battle's realm, since
    // their own win/lose lists hand off explicitly (Bell-Keeper → Near-Shore transfer, Well Spirit, Willow Mother).
    if (res !== 'lose' && !boss && (o.random || o.enemyEv !== undefined)) $.realm = realm;
    this.overlay = false; Input.clear(); this.applyRealmVisuals(); this.refreshEvents(); $.setV('battle_peaceful', peaceful ? 1 : 0);
    Audio.bgm(this.mapBgm()); const zz = SPEC.zones[zid]; $.grace = zz?.graceSteps ?? 8; this.stepsLeft = Math.max(this.stepsLeft, this.rollSteps(false, zz?.encounterSteps?.[$.realm] || 26)); await this.fader.in(this, 300);
    if (res === 'lose') { await this.handleDefeat(boss, o); return 'lose'; }
    this.autosave('battle');
    return res as any;
  }
  async handleDefeat(boss: boolean, o: any) {
    if (o.noLose) { $.healAll(); return; }
    if (boss && $.checkpoint) {
      await this.msg.show(null, null, 'The Lantern dims… but the story is not over.');
      const i = await this.msg.choice(['Retry the fight', 'Return to the last Lantern Post'], -1);
      if (i === 0) { SaveManager.restoreString($.checkpoint); Audio.se('load'); await this.hardReload({}); $.healAll(); this.autosave('cp'); return; }
    }
    await this.fadeOutOfFar2();
  }
  async fadeOutOfFar2() { await this.fader.out(this, 600, 0xffffff); $.fades++; $.realm = 'near'; $.lumen = Math.max(20, $.lumen); $.healAll(); const r = $.respawn; await this.loadMap(r.map, r.x, r.y, r.dir as Dir); await this.fader.in(this, 600); const ln = DB.system.fadingLines[$.fades % DB.system.fadingLines.length]; await this.msg.show(ln.face, ln.name, 'You blacked out… ' + ln.text); this.autosave('fade'); }
}
export { Win, COL };
