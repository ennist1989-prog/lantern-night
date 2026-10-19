import Phaser from 'phaser';
import { Input, pulse } from '../core/input';
import { Audio } from '../core/audio';
import { Settings } from '../core/settings';
import { $ } from '../core/state';
import { Win, Selectable, COL, FONT, W, H, Tone } from './windows';
const CPS = [28, 55, 110, 4000];
function hash(s: string) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); }
export class MessageSystem {
  scene: Phaser.Scene; layer: Phaser.GameObjects.Container; win: Win; nameWin: Win | null = null; text!: Phaser.GameObjects.Text; arrow!: Phaser.GameObjects.Text; autoTxt: Phaser.GameObjects.Text;
  busy = false; tone: Tone = 'near'; choiceWin: Selectable | null = null; toasts: Win[] = []; skipHeld = false;
  measure: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Container) {
    this.scene = scene; this.layer = layer;
    this.win = new Win(scene, 8, H - 188, W - 16, 180); this.win.setVisible(false); layer.add(this.win);
    this.arrow = scene.add.text(W / 2 - 10, H - 34, '▼', { fontFamily: FONT, fontSize: '20px', color: COL.gold }).setVisible(false); layer.add(this.arrow);
    this.autoTxt = scene.add.text(W - 70, H - 218, 'AUTO', { fontFamily: FONT, fontSize: '18px', color: COL.gold, stroke: '#000', strokeThickness: 3 }).setVisible(false); layer.add(this.autoTxt);
    this.measure = scene.add.text(-999, -999, '', { fontFamily: FONT, fontSize: '23px' }).setVisible(false); layer.add(this.measure);
    scene.input.on('pointerdown', () => { if (this.busy && this.waiting) pulse('ok'); });
  }
  waiting = false;
  wrap(s: string, width: number): string[] {
    const out: string[] = [];
    for (const para of s.split('\n')) {
      const words = para.split(' '); let line = '';
      for (const w of words) { const t = line ? line + ' ' + w : w; this.measure.setText(t); if (this.measure.width > width && line) { out.push(line); line = w; } else line = t; }
      out.push(line);
    }
    return out;
  }
  setTone(t: Tone) { this.tone = t; this.win.setTone(t); }
  async show(face: string | null, name: string | null, text: string, opts: { pos?: 'bottom' | 'top' } = {}) {
    this.busy = true; const win = this.win; win.setVisible(true); win.setAlpha(1);
    win.y = opts.pos === 'top' ? 8 : H - 188;
    const hasFace = !!face && this.scene.textures.exists('face_' + face);
    const tx = hasFace ? 150 : 28; const width = W - 16 - tx - 28;
    const lines = this.wrap(text, width).slice(0, 5);
    // paginate in blocks of 4 lines
    const pages: string[][] = []; for (let i = 0; i < lines.length; i += 4) pages.push(lines.slice(i, i + 4));
    if (this.nameWin) { this.nameWin.destroy(); this.nameWin = null; }
    for (let pi = 0; pi < pages.length; pi++) {
      win.clear();
      if (hasFace) { const f = win.face(face!, 18, 22, 114); if (f) { win.gfx.lineStyle(2, 0x7a96d6, 1); win.gfx.strokeRect(17, 21, 116, 116); } }
      if (name && pi === 0) { this.nameWin?.destroy(); const nw = Math.max(120, name.length * 13 + 36); this.nameWin = new Win(this.scene, 28, win.y - 34, nw, 44, this.tone); this.nameWin.txt(name, 18, 5, { size: 20, color: COL.gold }); this.layer.add(this.nameWin); }
      else if (!name && this.nameWin) { this.nameWin.destroy(); this.nameWin = null; }
      const t = win.txt('', tx, 20, { size: 23, ls: 6 }); const page = pages[pi]; const full = page.join('\n'); const total = full.length;
      let shown = 0, acc = 0, done = false; const key = hash((name || '') + full); const seen = !!$.seen[key];
      this.arrow.setVisible(false);
      await new Promise<void>((resolve) => {
        const ev = this.scene.events.on('update', function upd(this: any) { });
        this.scene.events.off('update', ev as any);
        const timer = this.scene.time.addEvent({ delay: 16, loop: true, callback: () => {
          const skip = Input.isDown('dash'); this.skipHeld = skip;
          if (Input.isTriggered('auto')) { Settings.data.msgAuto = !Settings.data.msgAuto; Settings.save(); }
          this.autoTxt.setVisible(Settings.data.msgAuto);
          if (!done) {
            const cps = skip ? 4000 : CPS[Settings.data.textSpeed] ?? 55; acc += cps * 0.016; const n = Math.floor(acc); if (n > 0) { acc -= n; shown = Math.min(total, shown + n); t.setText(full.slice(0, shown)); }
            if (Input.isTriggered('ok') || Input.isTriggered('cancel')) { shown = total; t.setText(full); Input.consume('ok'); Input.consume('cancel'); }
            if (shown >= total) { done = true; this.arrow.setVisible(true); this.waiting = true; waitFrames = 0; }
          } else {
            waitFrames++; const autoDelay = 45 + full.length * 2.2;
            this.arrow.y = H - 34 + Math.sin(this.scene.time.now / 120) * 3; if (win.y < 100) this.arrow.y = 8 + 150 + Math.sin(this.scene.time.now / 120) * 3;
            const adv = Input.isTriggered('ok') || Input.isTriggered('cancel') || (Settings.data.msgAuto && waitFrames > autoDelay / 1) || (skip && (seen ? waitFrames > 3 : waitFrames > 10));
            if (adv) { Input.consume('ok'); Input.consume('cancel'); this.waiting = false; this.arrow.setVisible(false); timer.remove(); $.seen[key] = true; resolve(); }
          }
        } });
        let waitFrames = 0;
      });
      Audio.se('tick', 0.3);
    }
    win.clear(); win.setVisible(false); this.arrow.setVisible(false); this.autoTxt.setVisible(false);
    if (this.nameWin) { this.nameWin.destroy(); this.nameWin = null; }
    this.busy = false;
  }
  async choice(opts: string[], cancel = -1, labelFace?: string | null): Promise<number> {
    const maxLen = Math.max(...opts.map((o) => o.length)); const w = Math.max(220, maxLen * 12 + 70); const rows = opts.length; const h = rows * 34 + 30;
    const cw = new Selectable(this.scene, W - 20 - w, (this.win.visible ? this.win.y : H - 188) - h - 6, w, h, this.tone); this.layer.add(cw); this.choiceWin = cw;
    cw.rowH = 34; cw.pad = 15; cw.fontSize = 23;
    cw.setItems(opts.map((o) => ({ label: o })));
    return new Promise<number>((res) => {
      const fin = (i: number) => { cw.active = false; this.scene.time.removeEvent(tm); cw.destroy(); this.choiceWin = null; res(i); };
      cw.onOk = (_it, i) => fin(i);
      cw.onCancel = cancel >= 0 ? () => fin(cancel) : null;
      cw.active = true; const tm = this.scene.time.addEvent({ delay: 16, loop: true, callback: () => cw.tick() });
    });
  }
  toast(msg: string, ms = 2200, y = 14, color: string = COL.white) {
    this.toasts.forEach((t) => t.destroy()); this.toasts = []; y = Math.max(y, 76);
    const lines = this.wrap(msg.replace(/\n/g, ' '), 640); const w0 = Math.min(W - 40, Math.max(...lines.map((l) => { this.measure.setText(l); return this.measure.width; })) + 44); const h = 24 + lines.length * 27;
    const win = new Win(this.scene, (W - w0) / 2, y, w0, h, this.tone); win.txt(lines.join('\n'), w0 / 2, 10, { size: 20, color, align: 'center', ls: 4 }); this.layer.add(win);
    this.toasts.forEach((t, i) => { void i; }); win.setAlpha(0); this.scene.tweens.add({ targets: win, alpha: 1, duration: 180 });
    this.toasts.push(win);
    this.scene.time.delayedCall(ms, () => { this.scene.tweens.add({ targets: win, alpha: 0, duration: 400, onComplete: () => { win.destroy(); this.toasts = this.toasts.filter((x) => x !== win); } }); });
    return win;
  }
  /** Full-screen narration on black (intro/outro). */
  async narrate(lines: string[], opts: { color?: string; hold?: number } = {}) {
    const bg = this.scene.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0, 0); this.layer.add(bg); bg.setAlpha(0); this.scene.tweens.add({ targets: bg, alpha: 1, duration: 500 });
    this.busy = true;
    await new Promise((r) => this.scene.time.delayedCall(550, r));
    for (const ln of lines) {
      const wrapped = this.wrap(ln, 640).join('\n');
      const t = this.scene.add.text(W / 2, H / 2, wrapped, { fontFamily: FONT, fontSize: '28px', color: opts.color ?? '#dfe8ff', align: 'center', lineSpacing: 10, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5); this.layer.add(t);
      t.setAlpha(0); this.scene.tweens.add({ targets: t, alpha: 1, duration: 600 });
      await new Promise<void>((resolve) => { let f = 0; const tm = this.scene.time.addEvent({ delay: 16, loop: true, callback: () => { f++; if ((f > 25 && (Input.isTriggered('ok') || Input.isTriggered('cancel'))) || (f > 20 && Input.isDown('dash')) || (Settings.data.msgAuto && f > 160)) { Input.consume('ok'); Input.consume('cancel'); tm.remove(); resolve(); } } }); });
      await new Promise<void>((r) => this.scene.tweens.add({ targets: t, alpha: 0, duration: 350, onComplete: () => { t.destroy(); r(); } }));
    }
    this.scene.tweens.add({ targets: bg, alpha: 0, duration: 500, onComplete: () => bg.destroy() });
    this.busy = false;
  }
}
void COL;
