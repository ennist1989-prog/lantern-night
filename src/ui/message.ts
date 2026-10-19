import Phaser from 'phaser';
import { Input, pulse } from '../core/input';
import { Audio } from '../core/audio';
import { Settings } from '../core/settings';
import { $ } from '../core/state';
import { DB, iconOf } from '../core/db';
import { Win, Selectable, COL, FONT, W, H, Tone, WIN } from './windows';
// text speed options (chars/sec): slow, normal (~RPG Maker's 1 char per frame = 60), fast, instant
const CPS = [30, 60, 120, 4000];
const TCOL = ['#ffffff', '#9ec4ff', '#ffb36b', '#8ff0a4', '#6fe3d6', '#c9a0ff', '#ffd866', '#8a93b8', '#ff7a7a', '#bff6ff'];
function hash(s: string) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); }
export class MessageSystem {
  scene: Phaser.Scene; layer: Phaser.GameObjects.Container; win: Win; nameWin: Win | null = null; text!: Phaser.GameObjects.Text; arrow!: Phaser.GameObjects.Text; autoTxt: Phaser.GameObjects.Text;
  busy = false; tone: Tone = 'near'; choiceWin: Selectable | null = null; toasts: Win[] = []; skipHeld = false;
  measure: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Container) {
    this.scene = scene; this.layer = layer;
    this.win = new Win(scene, 8, H - 8 - (WIN.fittingHeight(WIN.msgLines, WIN.lineH) + 8), W - 16, WIN.fittingHeight(WIN.msgLines, WIN.lineH) + 8);   // 4 lines × 36 + 2×12 padding + 8 = 176 this.win.setVisible(false); layer.add(this.win);
    this.arrow = scene.add.text(W / 2 - 10, H - 34, '▼', { fontFamily: FONT, fontSize: '20px', color: COL.gold }).setVisible(false); layer.add(this.arrow);
    this.autoTxt = scene.add.text(W - 70, H - 218, 'AUTO', { fontFamily: FONT, fontSize: '18px', color: COL.gold, stroke: '#000', strokeThickness: 3 }).setVisible(false); layer.add(this.autoTxt);
    this.measure = scene.add.text(-999, -999, '', { fontFamily: FONT, fontSize: WIN.font + 'px' }).setVisible(false); layer.add(this.measure);
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
  /** Message control codes: \C[n] colour, \V[var] variable, \N[actor] name, \I[item|icon] icon, \G gold word, \. short wait (15f), \| long wait (60f), \! wait for OK, \\ backslash. */
  parseCodes(raw: string) {
    const sp = (() => { this.measure.setText('\u00a0'); return Math.max(1, this.measure.width); })(); const iconN = Math.ceil(27 / sp);
    let plain = ''; const colors: number[] = []; const icons = new Map<number, string>(); const waits = new Map<number, number>(); let col = 0;
    const put = (str: string) => { for (const ch of str) { plain += ch; colors.push(col); } };
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      if (c !== '\\') { put(c); continue; }
      const n = raw[i + 1]; const m = /^\[([^\]]*)\]/.exec(raw.slice(i + 2));
      if (n === '\\') { put('\\'); i++; continue; }
      if ((n === 'C' || n === 'c') && m) { col = Math.max(0, Math.min(TCOL.length - 1, parseInt(m[1], 10) || 0)); i += 1 + m[0].length; continue; }
      if ((n === 'V' || n === 'v') && m) { put(String(Math.floor($.v(m[1])))); i += 1 + m[0].length; continue; }
      if ((n === 'N' || n === 'n') && m) { const k = /^\d+$/.test(m[1]) ? $.party[parseInt(m[1], 10) - 1] : m[1]; put(DB.actors[k]?.name ?? k ?? '?'); i += 1 + m[0].length; continue; }
      if ((n === 'I' || n === 'i') && m) { const id = m[1]; const nm = DB.items[id] ? iconOf(DB.items[id]) : DB.skills[id] ? iconOf(DB.skills[id]) : id; icons.set(plain.length, nm); put('\u00a0'.repeat(iconN)); i += 1 + m[0].length; continue; }
      if (n === 'G' || n === 'g') { put('G'); i++; continue; }
      if (n === '.') { waits.set(plain.length, (waits.get(plain.length) || 0) + 15); i++; continue; }
      if (n === '|') { waits.set(plain.length, (waits.get(plain.length) || 0) + 60); i++; continue; }
      if (n === '!') { waits.set(plain.length, -1); i++; continue; }
      put(c);
    }
    return { plain, colors, icons, waits };
  }
  /** Word-wrap that keeps each line's start index in the plain string (so per-character colours/icons/waits survive). */
  wrapIdx(plain: string, width: number): { s: string; start: number }[] {
    const out: { s: string; start: number }[] = []; let base = 0;
    for (const para of plain.split('\n')) {
      let line = '', lineStart = base, pos = base;
      for (const word of para.split(' ')) {
        const t = line ? line + ' ' + word : word; this.measure.setText(t);
        if (this.measure.width > width && line) { out.push({ s: line, start: lineStart }); line = word; lineStart = pos; } else if (!line) { line = word; lineStart = pos; } else line = t;
        pos += word.length + 1;
      }
      out.push({ s: line, start: lineStart }); base += para.length + 1;
    }
    return out;
  }
  setTone(t: Tone) { this.tone = t; this.win.setTone(t); }
  async show(face: string | null, name: string | null, text: string, opts: { pos?: 'bottom' | 'top' } = {}) {
    this.busy = true; const win = this.win; win.setVisible(true); win.setAlpha(1);
    win.y = opts.pos === 'top' ? 8 : H - 8 - win.h;
    const hasFace = !!face && this.scene.textures.exists('face_' + face);
    const tx = hasFace ? 150 : 28 + WIN.itemPad; const width = W - 16 - tx - 28;
    const P = this.parseCodes(text); const lines = this.wrapIdx(P.plain, width).slice(0, 8);
    const lh = WIN.lineH;
    const pages: { s: string; start: number }[][] = []; for (let i = 0; i < lines.length; i += 4) pages.push(lines.slice(i, i + 4));
    if (this.nameWin) { this.nameWin.destroy(); this.nameWin = null; }
    for (let pi = 0; pi < pages.length; pi++) {
      win.clear();
      if (hasFace) { const f = win.face(face!, 18, 22, 114); if (f) { win.gfx.lineStyle(2, 0x7a96d6, 1); win.gfx.strokeRect(17, 21, 116, 116); } }
      if (name && pi === 0) { this.nameWin?.destroy(); const nw = Math.max(120, name.length * 13 + 36); this.nameWin = new Win(this.scene, 28, win.y - 34, nw, 44, this.tone); this.nameWin.txt(name, 18, 5, { size: 20, color: COL.gold }); this.layer.add(this.nameWin); }
      else if (!name && this.nameWin) { this.nameWin.destroy(); this.nameWin = null; }
      // build colour runs per line; every char of the page gets a running index `gi`
      const page = pages[pi]; const full = page.map((l) => l.s).join('\n'); const total = page.reduce((n, l) => n + l.s.length, 0);
      const runs: { t: Phaser.GameObjects.Text; s: string; g0: number; shown: number }[] = []; const iconAt: { gi: number; name: string; x: number; y: number; done: boolean }[] = []; const waitAt = new Map<number, number>();
      let g = 0; page.forEach((ln, li) => { let r0 = 0; const y = 20 + li * lh;
        while (r0 < ln.s.length) { const c0 = P.colors[ln.start + r0]; let r1 = r0 + 1; while (r1 < ln.s.length && P.colors[ln.start + r1] === c0 && !P.icons.has(ln.start + r1) && !P.waits.has(ln.start + r1)) r1++;
          this.measure.setText(ln.s.slice(0, r0)); const px = r0 ? this.measure.width : 0; const t = win.txt('', tx + px, y, { size: WIN.font, color: TCOL[c0], ls: 0 }); runs.push({ t, s: ln.s.slice(r0, r1), g0: g + r0, shown: 0 }); r0 = r1; }
        for (let k = 0; k < ln.s.length; k++) { const gi = ln.start + k; if (P.icons.has(gi)) { this.measure.setText(ln.s.slice(0, k)); iconAt.push({ gi: g + k, name: P.icons.get(gi)!, x: tx + (k ? this.measure.width : 0), y: y + 1, done: false }); } if (P.waits.has(gi)) waitAt.set(g + k, P.waits.get(gi)!); }
        g += ln.s.length; });
      let shown = 0, acc = 0, done = false, holdWait = 0, pausedOK = false; const key = hash((name || '') + full); const seen = !!$.seen[key];
      const draw = () => { for (const r of runs) { const n = Math.max(0, Math.min(r.s.length, shown - r.g0)); if (n !== r.shown) { r.shown = n; r.t.setText(r.s.slice(0, n)); } } for (const ic of iconAt) if (!ic.done && shown > ic.gi) { ic.done = true; win.icon(ic.name, ic.x, ic.y, 1.5); } };
      this.arrow.setVisible(false);
      await new Promise<void>((resolve) => {
        const ev = this.scene.events.on('update', function upd(this: any) { });
        this.scene.events.off('update', ev as any);
        const timer = this.scene.time.addEvent({ delay: 16, loop: true, callback: () => {
          const skip = Input.isDown('dash'); this.skipHeld = skip;
          if (Input.isTriggered('auto')) { Settings.data.msgAuto = !Settings.data.msgAuto; Settings.save(); }
          this.autoTxt.setVisible(Settings.data.msgAuto);
          if (!done) {
            const fast = skip;
            if (pausedOK) { if (Input.isTriggered('ok') || Input.isTriggered('cancel') || fast) { pausedOK = false; Input.consume('ok'); Input.consume('cancel'); } }
            else if (holdWait > 0 && !fast) holdWait--;
            else { const cps = fast ? 4000 : CPS[Settings.data.textSpeed] ?? 60; acc += cps * 0.016; let n = Math.floor(acc); if (n > 0) { acc -= n; while (n-- > 0 && shown < total) { const w = waitAt.get(shown); if (w !== undefined && !fast) { waitAt.delete(shown); if (w < 0) pausedOK = true; else holdWait = w; acc = 0; break; } shown++; } draw(); } }
            if (!pausedOK && (Input.isTriggered('ok') || Input.isTriggered('cancel'))) { shown = total; waitAt.clear(); draw(); Input.consume('ok'); Input.consume('cancel'); }
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
    const maxLen = Math.max(...opts.map((o) => o.length)); const w = Math.max(220, maxLen * 13 + 70); const rows = opts.length; const h = rows * WIN.itemH + 28;
    const cw = new Selectable(this.scene, W - 20 - w, (this.win.visible ? this.win.y : H - 8 - this.win.h) - h - 6, w, h, this.tone); this.layer.add(cw); this.choiceWin = cw;
    cw.rowH = WIN.itemH; cw.pad = 14; cw.fontSize = 24;
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
