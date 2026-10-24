import Phaser from 'phaser';
import { Input } from '../core/input';
import { Audio } from '../core/audio';
import { $ } from '../core/state';
import { SaveManager } from '../core/save';
import { W, H, Win, Selectable, COL, FONT, tickWindows, Fader } from '../ui/windows';
import { openOptions } from '../ui/options';
export class TitleScene extends Phaser.Scene {
  wins: Win[] = []; menu!: Selectable; fader!: Fader; motes: any[] = []; lock = false; sub = false;
  constructor() { super('Title'); }
  init() { this.wins = []; this.motes = []; this.lock = false; this.sub = false; }
  create() {
    const key = 'title_bg'; if (!this.textures.exists(key)) {
      const c = this.textures.createCanvas(key, W, H)!; const x = c.getContext(); const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#05082a'); g.addColorStop(0.5, '#15286a'); g.addColorStop(0.78, '#3a7a9a'); g.addColorStop(1, '#0a1a2c'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(220,245,255,${0.3 + (i % 5) * 0.12})`; x.fillRect((i * 331) % W, (i * 127) % 380, i % 7 === 0 ? 3 : 2, i % 7 === 0 ? 3 : 2); }
      x.fillStyle = '#0a1638'; x.beginPath(); x.moveTo(0, 430); for (let i = 0; i <= W; i += 24) x.lineTo(i, 400 + Math.sin(i * 0.011) * 28 + Math.sin(i * 0.037) * 10); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.fillStyle = '#060e24'; x.beginPath(); x.moveTo(0, 520); for (let i = 0; i <= W; i += 24) x.lineTo(i, 488 + Math.sin(i * 0.02 + 2) * 20); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      // water shimmer
      for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(160,230,255,0.18)'; x.fillRect((i * 173) % W, 540 + ((i * 37) % 80), 30 + (i % 4) * 14, 2); }
      c.refresh();
    }
    this.add.image(0, 0, key).setOrigin(0, 0);
    const glow = this.textures.exists('glow') ? 'glow' : this.makeGlow(); const lg = this.add.image(W / 2, 245, glow).setScale(5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8); this.tweens.add({ targets: lg, scale: 5.6, alpha: 0.6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    { const g = this.add.graphics().setDepth(2); const cx = W / 2;
      g.fillStyle(0x1a1226, 1); g.fillRect(cx - 6, 290, 12, 140); g.fillRect(cx - 22, 284, 44, 8); g.fillRect(cx - 4, 262, 8, 24);
      g.fillStyle(0x3a2a4a, 1); g.fillRect(cx - 6, 290, 4, 140);
      g.fillStyle(0x2a1a1a, 1); g.fillRect(cx - 26, 214, 52, 10); g.fillRect(cx - 22, 262, 44, 8);
      g.fillStyle(0xffb347, 1); g.fillRect(cx - 22, 224, 44, 38); g.fillStyle(0xffe08a, 1); g.fillRect(cx - 16, 230, 32, 26); g.fillStyle(0xfff6d0, 1); g.fillRect(cx - 8, 236, 16, 14);
      g.fillStyle(0x7a3a1a, 1); g.fillRect(cx - 22, 224, 4, 38); g.fillRect(cx + 18, 224, 4, 38); g.fillRect(cx - 22, 242, 44, 3); }
    const mio = this.add.sprite(W / 2 - 250, 520, 'char_mio', 1).setScale(6).setOrigin(0.5, 1); const kaze = this.add.sprite(W / 2 + 250, 530, 'char_kaze', 2).setScale(6).setOrigin(0.5, 1); void mio; void kaze;
    for (let i = 0; i < 40; i++) { const s = this.add.rectangle(Math.random() * W, Math.random() * H, 3, 3, 0xcff6ff, 0.6); this.motes.push({ s, vx: (Math.random() - 0.5) * 12, vy: -6 - Math.random() * 16 }); }
    const t1 = this.add.text(W / 2, 72, 'LANTERN NIGHT', { fontFamily: FONT, fontSize: '84px', color: '#ffe9a0', stroke: '#2a1a3a', strokeThickness: 10 }).setOrigin(0.5); t1.setShadow(0, 6, '#000', 0, true, true);
    this.add.text(W / 2, 148, 'The Far Shore', { fontFamily: FONT, fontSize: '40px', color: '#bff6ff', stroke: '#06143a', strokeThickness: 7 }).setOrigin(0.5);
    this.add.text(W / 2, H - 14, 'Chapters 1–3 playable slice  ·  Z/Enter confirm · X cancel · Q/Tab shift realms · Shift dash · F/Ctrl skip text', { fontFamily: FONT, fontSize: '15px', color: '#9fb4e8' }).setOrigin(0.5, 1).setDepth(10);
    this.fader = new Fader(this, 9999);
    const any = SaveManager.any();
    this.menu = new Selectable(this, W / 2 - 130, 400, 260, 168, 'near'); this.wins.push(this.menu); this.menu.setDepth(20); this.menu.rowH = 34; this.menu.pad = 14; this.menu.fontSize = 24; this.menu.align = 'center';
    this.menu.setItems([{ label: 'New Game' }, { label: 'Continue', enabled: any }, { label: 'Options' }, { label: 'Credits' }]); this.menu.index = any ? 1 : 0; this.menu.refresh();
    this.menu.active = true; this.menu.onOk = (it) => this.choose(it.label);
    Audio.bgm('title'); this.fader.rect.fillAlpha = 1; this.fader.in(this, 700);
  }
  makeGlow() { const gc = this.textures.createCanvas('glow', 128, 128)!; const gx = gc.getContext(); const gg = gx.createRadialGradient(64, 64, 2, 64, 64, 64); gg.addColorStop(0, 'rgba(190,250,255,0.85)'); gg.addColorStop(0.4, 'rgba(120,210,255,0.35)'); gg.addColorStop(1, 'rgba(60,120,255,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128); gc.refresh(); return 'glow'; }
  async choose(label: string) {
    if (this.lock) return; Audio.se('ok');
    if (label === 'New Game') { this.lock = true; this.menu.active = false; Audio.bgm(null); await this.fader.out(this, 600); this.scene.start('Map', { mode: 'new' }); }
    else if (label === 'Continue') { this.menu.active = false; this.scene.launch('SaveLoad', { mode: 'load', fromTitle: true, onClose: () => { this.scene.stop('SaveLoad'); this.menu.active = true; Input.clear(); }, onLoaded: async () => { this.scene.stop('SaveLoad'); this.lock = true; Audio.bgm(null); await this.fader.out(this, 500); this.scene.start('Map', { mode: 'load' }); } }); this.scene.bringToTop('SaveLoad'); }
    else if (label === 'Options') { this.menu.active = false; openOptions(this, 'near', this.wins, 108, 100, () => { this.menu.active = true; }); }
    else if (label === 'Credits') { this.menu.active = false; Audio.bgm(null); await this.fader.out(this, 400); this.scene.start('Credits', { ending: false }); }
  }
  update(_t: number, dtr: number) { tickWindows(this.wins); const dt = dtr / 1000; for (const m of this.motes) { m.s.x += m.vx * dt; m.s.y += m.vy * dt; if (m.s.y < -10) { m.s.y = H + 10; m.s.x = Math.random() * W; } m.s.setAlpha(0.3 + 0.3 * Math.sin(this.time.now / 400 + m.s.x)); } }
}
void COL; void $;
