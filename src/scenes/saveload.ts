import Phaser from 'phaser';
import { Input } from '../core/input';
import { Audio } from '../core/audio';
import { $ } from '../core/state';
import { SaveManager, fmtTime } from '../core/save';
import { W, H, Win, Selectable, COL, FONT, tickWindows, Tone, fitLine } from '../ui/windows';
export class SaveLoadScene extends Phaser.Scene {
  d: any; wins: Win[] = []; list!: Selectable; info!: Win; msgT: string = ''; busy = false;
  constructor() { super('SaveLoad'); }
  init(d: any) { this.d = d; this.wins = []; this.busy = false; }
  create() {
    const tone: Tone = this.d.fromTitle ? 'near' : $.realm; const mode = this.d.mode as 'save' | 'load';
    this.add.rectangle(0, 0, W, H, this.d.fromTitle ? 0x0a1030 : 0x000000, this.d.fromTitle ? 1 : 0.6).setOrigin(0, 0);
    const title = this.add.text(W / 2, 6, mode === 'save' ? 'Save Game' : 'Load Game', { fontFamily: FONT, fontSize: '26px', color: COL.gold, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0); void title;
    this.list = new Selectable(this, 8, 40, W - 16, 470, tone); this.wins.push(this.list); this.info = new Win(this, 8, 516, W - 16, 100, tone); this.wins.push(this.info);
    this.list.rowH = 40; this.list.pad = 15; this.list.fontSize = 20;
    this.list.drawItem = (w, it, x, y, cw) => { const m = it.data.meta; const col = it.enabled === false ? COL.dim : COL.white; w.txt(it.data.slot === 0 ? 'Autosave' : 'Slot ' + it.data.slot, x + 4, y + 4, { size: 20, color: it.data.slot === 0 ? COL.teal : COL.gold });
      if (!m) { w.txt('— empty —', x + 130, y + 4, { size: 19, color: COL.dim }); return; }
      w.txt('Ch ' + (m.chapter || 1), x + 120, y + 6, { size: 17, color: COL.teal }); fitLine(w.txt(m.label, x + 172, y + 4, { size: 19, color: col }), 220, [17, 15]); w.txt('Lv ' + m.level, x + 400, y + 4, { size: 19, color: col }); w.txt(m.realm === 'far' ? 'Far' : 'Near', x + 470, y + 4, { size: 17, color: m.realm === 'far' ? COL.teal : COL.warn }); w.txt(fmtTime(m.playtime), x + 530, y + 4, { size: 19, color: col }); w.txt(new Date(m.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), x + cw - 6, y + 4, { size: 17, color: COL.dim, align: 'right' }); };
    this.refreshList(); this.list.active = true;
    this.list.onSelect = () => this.refreshInfo();
    this.list.onOk = (it) => this.choose(it.data.slot);
    this.list.onCancel = () => this.close();
    this.refreshInfo();
    this.input.keyboard?.on('keydown-Q', () => this.exportSel()); this.input.keyboard?.on('keydown-E', () => this.importSel());
    this.mkBtn(W - 250, 560, 'Export (Q)', () => this.exportSel()); this.mkBtn(W - 130, 560, 'Import (E)', () => this.importSel());
  }
  mkBtn(x: number, y: number, label: string, fn: () => void) { const t = this.add.text(x, y, label, { fontFamily: FONT, fontSize: '20px', color: COL.sys, backgroundColor: '#1a2250', padding: { x: 10, y: 6 } }).setDepth(300).setInteractive({ useHandCursor: true }); t.on('pointerdown', fn); }
  refreshList() { const items: any[] = []; for (let s = 0; s <= 10; s++) { const meta = SaveManager.meta(s); items.push({ label: '', data: { slot: s, meta }, enabled: s === 0 ? (this.d.mode === 'load' && !!meta) : this.d.mode === 'save' ? true : !!meta }); } this.list.setItems(items, true); }
  refreshInfo() { const w = this.info; w.clear(); const it = this.list.current; const mode = this.d.mode; w.txt(this.msgT || (mode === 'save' ? 'Choose a slot. Autosave happens at transfers, battles, and Lantern Posts.' : 'Choose a save to load.'), 16, 8, { size: 19, color: this.msgT ? COL.gold : COL.white, wrap: 560 });
    if (it && it.data.meta) { w.txt('Party: ' + it.data.meta.members.map((m: string) => m[0].toUpperCase() + m.slice(1)).join(', '), 16, 40, { size: 18, color: COL.sys }); }
    w.txt('Q: export slot to file    E: import file to slot', 16, 68, { size: 16, color: COL.dim }); }
  flash(s: string) { this.msgT = s; this.refreshInfo(); this.time.delayedCall(2400, () => { this.msgT = ''; this.refreshInfo(); }); }
  async choose(slot: number) {
    if (this.busy) return; this.busy = true;
    if (this.d.mode === 'save') {
      const exists = !!SaveManager.meta(slot);
      if (exists) { const ok = await this.confirm('Overwrite slot ' + slot + '?'); if (!ok) { this.busy = false; return; } }
      const r = SaveManager.save(slot); if (r.ok) { Audio.se('save'); this.refreshList(); this.flash('Saved to slot ' + slot + '.'); } else { Audio.se('buzzer'); this.flash(r.err || 'Save failed'); }
      this.busy = false;
    } else {
      if (!SaveManager.load(slot)) { Audio.se('buzzer'); this.flash('Could not load that save.'); this.busy = false; return; }
      Audio.se('load'); this.list.active = false; this.d.onLoaded?.(slot); this.busy = false;
    }
  }
  confirm(q: string): Promise<boolean> {
    return new Promise((res) => {
      const w = new Selectable(this, W / 2 - 150, 200, 300, 190, this.d.fromTitle ? 'near' : $.realm); w.setDepth(500); this.wins.push(w); w.rowH = 36; w.pad = 44; w.fontSize = 22; w.setItems([{ label: 'Yes' }, { label: 'No' }]);
      const q1 = this.add.text(W / 2, 214, q, { fontFamily: FONT, fontSize: '20px', color: '#fff' }).setOrigin(0.5, 0).setDepth(501); this.list.active = false; w.active = true;
      const fin = (v: boolean) => { w.active = false; w.destroy(); q1.destroy(); this.wins = this.wins.filter((x) => x !== w); this.list.active = true; res(v); };
      w.onOk = (_i, i) => fin(i === 0); w.onCancel = () => fin(false);
    });
  }
  exportSel() { const it = this.list.current; if (!it) return; SaveManager.exportSlot(it.data.slot); this.flash('Exported slot ' + it.data.slot + ' as a JSON file.'); }
  importSel() { const it = this.list.current; if (!it || it.data.slot === 0) { this.flash('Pick slot 1–10 to import into.'); return; } SaveManager.importToSlot(it.data.slot, (ok, msg) => { this.refreshList(); this.flash(msg); void ok; }); }
  close() { this.d.onClose?.(); }
  update() { tickWindows(this.wins); }
}
