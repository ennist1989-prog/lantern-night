import Phaser from 'phaser';
import { Input } from '../core/input';
import { Audio } from '../core/audio';
export const FONT = 'Pixelify, "Pixelify Sans", monospace';
export const W = 816, H = 624;
/** Central window metrics (RPG Maker MZ-like): padding 12, line height 36, font 26, item padding 8, selectable item height 44. */
export const WIN = { pad: 12, lineH: 36, font: 26, itemPad: 8, itemH: 44, msgLines: 4, fittingHeight: (n: number, itemH = 44) => n * itemH + 24 };
export const COL = { white: '#ffffff', sys: '#9ec4ff', gold: '#ffd866', red: '#ff7a7a', green: '#8ff0a4', teal: '#6fe3d6', dim: '#8a93b8', hp: '#7de08a', sp: '#6aa8ff', lumen: '#bff6ff', warn: '#ffb36b', violet: '#c9a0ff' };
let _skin: HTMLCanvasElement | null = null;
export type Tone = 'near' | 'far';
export function winTexture(scene: Phaser.Scene, w: number, h: number, tone: Tone = 'near'): string {
  const key = `win_${w}x${h}_${tone}`;
  if (scene.textures.exists(key)) return key;
  const skinImg = scene.textures.get('windowskin').getSourceImage() as HTMLImageElement;
  const tex = scene.textures.createCanvas(key, w, h)!; const ctx = tex.getContext(); ctx.imageSmoothingEnabled = false;
  // background: stretch 48x48 bg
  ctx.save(); ctx.globalAlpha = 0.93; ctx.beginPath(); (ctx as any).roundRect(3, 3, w - 6, h - 6, 12); ctx.clip();
  ctx.drawImage(skinImg, 0, 0, 48, 48, 0, 0, w, h); ctx.restore();
  if (tone === 'far') { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(20,110,120,0.30)'; ctx.fillRect(0, 0, w, h); ctx.restore(); }
  // frame 9-slice (corners 16 native -> 32 drawn x2? use 1:1 scaled x2)
  const c = 16, s = 2, cs = c * s;
  const fx = 48; const dw = w - cs * 2, dh = h - cs * 2;
  const P = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dW: number, dH: number) => ctx.drawImage(skinImg, fx + sx, sy, sw, sh, dx, dy, dW, dH);
  P(0, 0, c, c, 0, 0, cs, cs); P(48 - c, 0, c, c, w - cs, 0, cs, cs); P(0, 48 - c, c, c, 0, h - cs, cs, cs); P(48 - c, 48 - c, c, c, w - cs, h - cs, cs, cs);
  P(c, 0, 48 - 2 * c, c, cs, 0, dw, cs); P(c, 48 - c, 48 - 2 * c, c, cs, h - cs, dw, cs);
  P(0, c, c, 48 - 2 * c, 0, cs, cs, dh); P(48 - c, c, c, 48 - 2 * c, w - cs, cs, cs, dh);
  tex.refresh(); return key;
}
export class Win extends Phaser.GameObjects.Container {
  w: number; h: number; tone: Tone; content: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Image;
  openness = 1; gfx: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, tone: Tone = 'near', noBg = false) {
    super(scene, x, y); this.w = w; this.h = h; this.tone = tone;
    this.bg = scene.add.image(0, 0, winTexture(scene, w, h, tone)).setOrigin(0, 0); if (noBg) this.bg.setVisible(false);
    this.content = scene.add.container(0, 0); this.gfx = scene.add.graphics(); this.content.add(this.gfx);
    this.add([this.bg, this.content]); scene.add.existing(this);
  }
  setTone(t: Tone) { if (t === this.tone) return; this.tone = t; this.bg.setTexture(winTexture(this.scene, this.w, this.h, t)); }
  txt(s: string, x: number, y: number, o: { size?: number; color?: string; align?: 'left' | 'center' | 'right'; wrap?: number; ox?: number; ls?: number } = {}) {
    const t = this.scene.add.text(x, y, s, { fontFamily: FONT, fontSize: (o.size ?? 22) + 'px', color: o.color ?? COL.white, wordWrap: o.wrap ? { width: o.wrap } : undefined, lineSpacing: o.ls ?? 2, stroke: '#0a0d20', strokeThickness: 3 });
    t.setResolution(1);
    const ax = o.align === 'right' ? 1 : o.align === 'center' ? 0.5 : 0; t.setOrigin(ax, 0); this.content.add(t); return t;
  }
  icon(name: string, x: number, y: number, scale = 1.5) {
    if (name && name.startsWith('v2:')) { const i2 = (this.scene.registry.get('icon2Idx') as any)[name.slice(3)]; if (i2 === undefined) return null; const im2 = this.scene.add.image(x, y, 'icons2', i2).setOrigin(0, 0).setScale(scale * 24 / 34); this.content.add(im2); return im2; }
    const idx = (this.scene.registry.get('iconIdx') as any)[name]; if (idx === undefined) return null;
    const im = this.scene.add.image(x, y, 'icons', idx).setOrigin(0, 0).setScale(scale); this.content.add(im); return im;
  }
  face(name: string, x: number, y: number, size = 114) {
    const k = 'face_' + name; if (!this.scene.textures.exists(k)) return null;
    const im = this.scene.add.image(x, y, k).setOrigin(0, 0); im.setScale(size / 38); this.content.add(im);
    return im;
  }
  gauge(x: number, y: number, w: number, ratio: number, c1: number, c2: number, h = 8) {
    const g = this.gfx; g.fillStyle(0x0a0d20, 1); g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle(0x2a3050, 1); g.fillRect(x, y, w, h);
    const rw = Math.max(0, Math.min(1, ratio)) * w; g.fillStyle(c1, 1); g.fillRect(x, y, rw, h); g.fillStyle(c2, 1); g.fillRect(x, y, rw, Math.max(1, h / 3)); g.fillStyle(0xffffff, 0.25); g.fillRect(x, y, rw, 1);
  }
  clear() { this.content.list.slice().forEach((c) => { if (c !== this.gfx) c.destroy(); }); this.gfx.clear(); }
  open(ms = 110) { this.setVisible(true); this.setAlpha(0.2); this.scene.tweens.add({ targets: this, alpha: 1, duration: ms }); }
  tick() { /* override */ }
}
export interface Item { label: string; value?: string; icon?: string; enabled?: boolean; data?: any; color?: string; sub?: string; idx?: number; }
export class Selectable extends Win {
  items: Item[] = []; index = 0; scroll = 0; cols = 1; rowH = WIN.itemH; pad = WIN.pad + 2; active = false; cursorG: Phaser.GameObjects.Graphics;
  onOk: (it: Item, i: number) => void = () => {}; onCancel: (() => void) | null = null; onSelect: (it: Item | undefined, i: number) => void = () => {}; onPage: (d: number) => void = () => {};
  drawItem: ((w: Selectable, it: Item, x: number, y: number, cw: number, i: number) => void) | null = null;
  fontSize = 22; hitZone: Phaser.GameObjects.Zone; keepIndexOnSet = false; noCancelSound = false; align: 'left' | 'center' = 'left';
  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, tone: Tone = 'near') {
    super(scene, x, y, w, h, tone);
    this.cursorG = scene.add.graphics(); this.content.addAt(this.cursorG, 0);
    this.hitZone = scene.add.zone(0, 0, w, h).setOrigin(0, 0).setInteractive(); this.add(this.hitZone);
    this.hitZone.on('pointerdown', (p: Phaser.Input.Pointer) => { if (!this.active || !this.visible) return; const lp = this.hitZone.getLocalPoint ? { x: p.x - this.getWorldX(), y: p.y - this.getWorldY() } : { x: 0, y: 0 }; this.pointerSelect(lp.x, lp.y); });
  }
  getWorldX() { let x = this.x, p: any = this.parentContainer; while (p) { x += p.x; p = p.parentContainer; } return x; }
  getWorldY() { let y = this.y, p: any = this.parentContainer; while (p) { y += p.y; p = p.parentContainer; } return y; }
  get rows() { return Math.max(1, Math.floor((this.h - this.pad * 2) / this.rowH)); }
  get itemW() { return Math.floor((this.w - this.pad * 2) / this.cols); }
  setItems(items: Item[], keep = false) { this.items = items; if (!keep && !this.keepIndexOnSet) { this.index = 0; this.scroll = 0; } this.index = Math.min(this.index, Math.max(0, items.length - 1)); this.refresh(); this.onSelect(items[this.index], this.index); }
  pointerSelect(lx: number, ly: number) {
    const col = Math.floor((lx - this.pad) / this.itemW), row = Math.floor((ly - this.pad) / this.rowH);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) { return; }
    const i = (this.scroll + row) * this.cols + col; if (i >= this.items.length) return;
    if (i === this.index) this.ok(); else { this.index = i; Audio.se('cursor'); this.refresh(); this.onSelect(this.items[i], i); }
  }
  ok() { const it = this.items[this.index]; if (!it) return; if (it.enabled === false) { Audio.se('buzzer'); return; } Audio.se('ok'); this.onOk(it, this.index); }
  activate(on = true) { this.active = on; this.cursorG.setVisible(on || true); this.refresh(); }
  refresh() {
    this.clear(); const { pad, rowH, cols } = this; const iw = this.itemW;
    const first = this.scroll * cols, last = Math.min(this.items.length, first + this.rows * cols);
    for (let i = first; i < last; i++) {
      const it = this.items[i]; const r = Math.floor(i / cols) - this.scroll, c = i % cols; const x = pad + c * iw, y = pad + r * rowH;
      if (this.drawItem) this.drawItem(this, it, x, y, iw, i); else this.defaultDraw(it, x, y, iw);
    }
    if (this.items.length > this.rows * cols) { const tot = Math.ceil(this.items.length / cols); if (this.scroll > 0) this.txt('▲', this.w - 24, 4, { size: 14, color: COL.sys }); if (this.scroll + this.rows < tot) this.txt('▼', this.w - 24, this.h - 24, { size: 14, color: COL.sys }); }
  }
  defaultDraw(it: Item, x: number, y: number, iw: number) {
    const dis = it.enabled === false; const col = dis ? COL.dim : it.color || COL.white; let tx = x + 4;
    if (it.icon) { const ic = this.icon(it.icon, x + 2, y + 1, 1.25); if (ic && dis) ic.setAlpha(0.45); tx += 34; }
    if (this.align === 'center') this.txt(it.label, x + iw / 2, y + 2, { size: this.fontSize, color: col, align: 'center' }); else this.txt(it.label, tx, y + 2, { size: this.fontSize, color: col });
    if (it.value !== undefined) this.txt(it.value, x + iw - 6, y + 2, { size: this.fontSize, color: dis ? COL.dim : COL.white, align: 'right' });
  }
  move(dx: number, dy: number) {
    const n = this.items.length; if (!n) return; const cols = this.cols; let i = this.index;
    if (dy) { const ni = i + dy * cols; if (ni >= 0 && ni < n) i = ni; else if (cols === 1) i = dy > 0 ? 0 : n - 1; else return; }
    if (dx && cols > 1) { const ni = i + dx; if (ni >= 0 && ni < n && Math.floor(ni / cols) === Math.floor(i / cols)) i = ni; else return; }
    if (i === this.index) return; this.index = i; const row = Math.floor(i / cols);
    if (row < this.scroll) this.scroll = row; else if (row >= this.scroll + this.rows) this.scroll = row - this.rows + 1;
    Audio.se('cursor'); this.refresh(); this.onSelect(this.items[i], i);
  }
  tick() {
    const t = this.scene.time.now; const g = this.cursorG; g.clear();
    if (this.items.length && this.visible) {
      const r = Math.floor(this.index / this.cols) - this.scroll, c = this.index % this.cols;
      if (r >= 0 && r < this.rows) { const a = this.active ? 0.22 + 0.14 * Math.sin(t / 130) : 0.12; g.fillStyle(0xbcd4ff, a); g.fillRoundedRect(this.pad + c * this.itemW - 2, this.pad + r * this.rowH - 1, this.itemW - 2, this.rowH - 2, 5); if (this.active) { g.lineStyle(2, 0xffe08a, 0.9); g.strokeRoundedRect(this.pad + c * this.itemW - 2, this.pad + r * this.rowH - 1, this.itemW - 2, this.rowH - 2, 5); } }
    }
    if (!this.active || !this.visible) return;
    if (Input.isRepeated('up')) this.move(0, -1); else if (Input.isRepeated('down')) this.move(0, 1);
    if (Input.isRepeated('left')) this.move(-1, 0); else if (Input.isRepeated('right')) this.move(1, 0);
    if (Input.isTriggered('pageup')) { this.onPage(-1); Input.consume('pageup'); } if (Input.isTriggered('pagedown')) { this.onPage(1); Input.consume('pagedown'); }
    if (Input.isTriggered('ok')) { Input.consume('ok'); this.ok(); }
    else if (Input.isTriggered('cancel') && this.onCancel) { Input.consume('cancel'); Input.consume('menu'); if (!this.noCancelSound) Audio.se('cancel'); this.onCancel(); }
  }
  get current() { return this.items[this.index]; }
}
/** Update all windows of a scene each frame. */
export function tickWindows(list: Win[]) { for (const w of list) if (w.active !== false) w.tick(); }
export class Fader {
  rect: Phaser.GameObjects.Rectangle;
  constructor(scene: Phaser.Scene, depth = 9999) { this.rect = scene.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0, 0).setDepth(depth); this.rect.setScrollFactor(0); }
  to(scene: Phaser.Scene, alpha: number, ms = 300, color = 0x000000): Promise<void> { return new Promise((res) => { this.rect.setFillStyle(color, this.rect.fillAlpha); if (ms <= 0) { this.rect.setAlpha(1); this.rect.fillAlpha = alpha; res(); return; } scene.tweens.add({ targets: this.rect, fillAlpha: alpha, duration: ms, onComplete: () => res() }); }); }
  out(scene: Phaser.Scene, ms = 300, color = 0x000000) { return this.to(scene, 1, ms, color); }
  in(scene: Phaser.Scene, ms = 300) { return this.to(scene, 0, ms); }
}
export const sleep = (scene: Phaser.Scene, ms: number) => new Promise<void>((r) => scene.time.delayedCall(ms, () => r()));
