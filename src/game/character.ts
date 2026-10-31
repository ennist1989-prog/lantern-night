import Phaser from 'phaser';
import { farTexture } from './recolor';
export const TS = 16;
/** Sheets that keep their true colours on the Far Shore (beings of the Far; Tsubaki asset pack §1.5 / §4.2 #5). Per-event `nofar` still works too. */
export const NO_FAR = new Set<string>(['tsubaki']);
export type Dir = 'down' | 'up' | 'left' | 'right';
export const DIRCOL: Record<Dir, number> = { down: 0, up: 1, left: 2, right: 3 };
export const DV: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
export const OPP: Record<Dir, Dir> = { down: 'up', up: 'down', left: 'right', right: 'left' };
export class Char {
  scene: Phaser.Scene; spr: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image; tx: number; ty: number; fx = 0; fy = 0; px: number; py: number;
  dir: Dir = 'down'; moving = false; t = 0; dur = 150; animT = 0; frame = 0; sheet = ''; far = false; isObj = false; through = false; opacity = 1;
  walkAnim = true; stepAnim = false; tint = 0xffffff; marker: Phaser.GameObjects.Text | null = null; flat = false; visible = true; stun = 0; yOff = 0; gdx = 0; gdy = 0;   // gdx/gdy: pixel offset of an event's object graphic (e.g. a 2x2 object anchored on a tile corner)
  constructor(scene: Phaser.Scene, tx: number, ty: number) { this.scene = scene; this.tx = tx; this.ty = ty; this.px = tx * TS + 8; this.py = ty * TS + TS; this.spr = scene.add.sprite(this.px, this.py, '__DEFAULT'); this.spr.setOrigin(0.5, 1); }
  setSheet(name: string | null, far: boolean, dir: Dir = this.dir) {
    this.far = far; this.dir = dir; if (!name) { this.spr.setVisible(false); this.sheet = ''; this.visible = false; return; }
    this.visible = true; this.spr.setVisible(true); this.sheet = name;
    let key = 'char_' + name; if (!this.scene.textures.exists(key)) key = 'char_villager1';
    if (far && !NO_FAR.has(name)) key = farTexture(this.scene, key);
    this.isObj = false; if (this.spr instanceof Phaser.GameObjects.Image && !(this.spr instanceof Phaser.GameObjects.Sprite)) { const old = this.spr; this.spr = this.scene.add.sprite(this.px, this.py, key, 0).setOrigin(0.5, 1); old.destroy(); }
    this.spr.setTexture(key, DIRCOL[dir]); this.updateFrame(); this.refreshPos();
  }
  setObject(name: string, far: boolean, flat = false) {
    this.isObj = true; this.flat = flat; this.sheet = name; this.visible = true; let key = 'objects'; if (far) key = farTexture(this.scene, 'objects');
    this.spr.setTexture(key, name); this.spr.setVisible(true); this.refreshPos();
  }
  updateFrame() {
    if (this.isObj || !this.sheet) return;
    let row = this.moving || this.stepAnim ? [0, 1, 2, 3][Math.floor(this.animT / 1) % 4] : 0; const rows = Math.max(1, Math.floor(((this.spr.texture as any).frameTotal - 1) / 4)); row = row % rows;
    (this.spr as Phaser.GameObjects.Sprite).setFrame(row * 4 + DIRCOL[this.dir]);
  }
  refreshPos() { this.spr.setPosition(Math.round(this.px + this.gdx), Math.round(this.py - 1 + this.yOff + this.gdy)); this.spr.setDepth(this.flat ? this.py - 5000 : this.py + 0.01 * this.tx); this.spr.setTint(this.tint); this.spr.setAlpha(this.opacity); }
  place(tx: number, ty: number) { this.tx = tx; this.ty = ty; this.px = tx * TS + 8; this.py = ty * TS + TS; this.moving = false; this.t = 0; this.refreshPos(); }
  start(dir: Dir, dur: number) { this.dir = dir; this.fx = this.tx; this.fy = this.ty; this.tx += DV[dir][0]; this.ty += DV[dir][1]; this.moving = true; this.t = 0; this.dur = dur; }
  update(dt: number) {
    if (this.moving) {
      this.t += dt / this.dur; const k = Math.min(1, this.t);
      this.px = (this.fx + (this.tx - this.fx) * k) * TS + 8; this.py = (this.fy + (this.ty - this.fy) * k) * TS + TS;
      this.animT = this.animT + dt / (this.dur / 2); if (this.t >= 1) { this.moving = false; this.px = this.tx * TS + 8; this.py = this.ty * TS + TS; this.animT = 0; }
    } else if (this.stepAnim) { this.animT += dt / 160; }
    if (!this.isObj) { const a = this.animT; const saved = this.animT; this.animT = Math.floor(a) % 4; this.updateFrame(); this.animT = saved; }
    this.refreshPos();
    if (this.marker) { this.marker.setPosition(this.px, this.py - 24 + Math.sin(this.scene.time.now / 160) * 1.5); this.marker.setDepth(99999); }
  }
  face(d: Dir) { this.dir = d; this.updateFrame(); }
  destroy() { this.spr.destroy(); this.marker?.destroy(); }
}
