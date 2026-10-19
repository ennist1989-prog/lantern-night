import Phaser from 'phaser';
import { Input } from '../core/input';
import { Audio } from '../core/audio';
import { Settings } from '../core/settings';
import { Selectable, COL, Tone } from './windows';
export class OptWin extends Selectable {
  tick() {
    super.tick(); if (!this.active || !this.visible) return;
    const d = Input.isRepeated('left') ? -1 : Input.isRepeated('right') ? 1 : 0; if (d) this.change(d);
  }
  change(d: number) { const it = this.current as any; if (it && it.data && it.data.change) { it.data.change(d); Audio.se('cursor'); this.build(); Audio.applyVol(); } }
  build() { const S = Settings.data; const pct = (v: number) => Math.round(v * 100) + '%';
    const rows: any[] = [
      { label: 'Music Volume', value: '◀ ' + pct(S.bgm) + ' ▶', data: { change: (d: number) => { S.bgm = Math.max(0, Math.min(1, +(S.bgm + d * 0.1).toFixed(1))); } } },
      { label: 'Sound Volume', value: '◀ ' + pct(S.se) + ' ▶', data: { change: (d: number) => { S.se = Math.max(0, Math.min(1, +(S.se + d * 0.1).toFixed(1))); } } },
      { label: 'Text Speed', value: '◀ ' + ['Slow', 'Normal', 'Fast', 'Instant'][S.textSpeed] + ' ▶', data: { change: (d: number) => { S.textSpeed = (S.textSpeed + d + 4) % 4; } } },
      { label: 'Message Auto-advance', value: S.msgAuto ? 'ON' : 'OFF', data: { change: () => { S.msgAuto = !S.msgAuto; } } },
      { label: 'Always Dash', value: S.alwaysRun ? 'ON' : 'OFF', data: { change: () => { S.alwaysRun = !S.alwaysRun; } } },
      { label: 'Battle Speed', value: '×' + S.battleSpeed, data: { change: () => { S.battleSpeed = S.battleSpeed === 1 ? 2 : 1; } } },
      { label: 'Auto Battle', value: S.autoBattle ? 'ON' : 'OFF', data: { change: () => { S.autoBattle = !S.autoBattle; } } },
      { label: 'Difficulty', value: '◀ ' + S.difficulty[0].toUpperCase() + S.difficulty.slice(1) + ' ▶', data: { change: (d: number) => { const L = ['gentle', 'standard', 'tough'] as const; S.difficulty = L[(L.indexOf(S.difficulty) + d + 3) % 3]; } } },
      { label: 'Touch Controls', value: S.touch ? 'ON' : 'OFF', data: { change: () => { S.touch = !S.touch; Input.setTouchVisible(S.touch && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)); } } },
      { label: 'Back', data: null },
    ];
    this.setItems(rows, true); Settings.save(); }
}
export function openOptions(scene: Phaser.Scene, tone: Tone, wins: any[], x = 108, y = 70, onDone: () => void) {
  const w = new OptWin(scene, x, y, 600, 440, tone); w.setDepth(200); wins.push(w); w.rowH = 38; w.pad = 18; w.fontSize = 23; w.keepIndexOnSet = true; w.build(); w.active = true;
  const hint = w.scene.add.text(x + 300, y + 450, '◀ ▶ change    X back', { fontFamily: 'Pixelify, monospace', fontSize: '18px', color: COL.dim }).setOrigin(0.5, 0).setDepth(201);
  const close = () => { w.active = false; Settings.save(); w.destroy(); hint.destroy(); const i = wins.indexOf(w); if (i >= 0) wins.splice(i, 1); onDone(); };
  w.onOk = (it) => { if (!it.data) close(); else (w as any).change(1); }; w.onCancel = close;
  return w;
}
