import Phaser from 'phaser';
import { Input } from '../core/input';
import { Audio } from '../core/audio';
import { W, H, FONT, Fader } from '../ui/windows';
import { fmtTime } from '../core/save';
const LINES = (d: any) => [
  ...(d.ending ? ['@Chapters 1–2 complete', 'The Bell-Keeper rests, and the Far Shore is open.', 'Mio, Kaze and Daigo have only reached the first shore…', `Play time ${fmtTime(d.stats?.time || 0)}   ·   Party level ${d.stats?.level || 1}   ·   Fadings ${d.stats?.fades || 0}`, '', 'Chapters 3–8 — To be continued.', ''] : []),
  '@LANTERN NIGHT: THE FAR SHORE', '',
  '@Design, code & writing', 'Grok Bot (built with Phaser 4 + TypeScript + Vite)', '',
  '@Art, music & sound effects', 'The Ninja Adventure Asset Pack', 'by Pixel-Boy and AAA', 'Licence: CC0 1.0 Universal (public domain)', 'https://pixel-boy.itch.io/ninja-adventure-asset-pack', '',
  '@Font', 'Pixelify Sans — © The Pixelify Sans Project Authors', 'SIL Open Font License 1.1', '',
  '@Engine & tools', 'Phaser 4 — MIT licence (Phaser Studio Inc.)', 'Vite — MIT licence', '',
  '@Special thanks', 'The RPG Maker MV / MZ community for the genre’s grammar,', 'and to everyone who has ever lit a lantern for someone else.', '',
  'Full licence texts: CREDITS.md and assets/fonts/ in the game files.', '', '', '@Thank you for playing',
];
export class CreditsScene extends Phaser.Scene {
  d: any; fader!: Fader; texts: Phaser.GameObjects.Text[] = []; done = false;
  constructor() { super('Credits'); }
  init(d: any) { this.d = d || {}; this.texts = []; this.done = false; }
  create() {
    this.add.rectangle(0, 0, W, H, 0x050820).setOrigin(0, 0); this.fader = new Fader(this, 9999); this.fader.rect.fillAlpha = 1; this.fader.in(this, 800);
    for (let i = 0; i < 50; i++) this.add.rectangle(Math.random() * W, Math.random() * H, 2, 2, 0xcff6ff, 0.5);
    Audio.bgm('credits'); let y = H + 20;
    for (const ln of LINES(this.d)) { const head = ln.startsWith('@'); const t = this.add.text(W / 2, y, head ? ln.slice(1) : ln, { fontFamily: FONT, fontSize: head ? '30px' : '22px', color: head ? '#ffe9a0' : '#dfe8ff', stroke: '#000', strokeThickness: 4, align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5, 0); this.texts.push(t); y += head ? 52 : 34; }
    this.add.text(W - 10, H - 8, 'Z / X: skip', { fontFamily: FONT, fontSize: '14px', color: '#6a7ab0' }).setOrigin(1, 1).setDepth(50);
  }
  update(_t: number, dt: number) {
    const sp = (Input.isDown('ok') || Input.isDown('dash') ? 240 : 46) * dt / 1000; this.texts.forEach((t) => (t.y -= sp));
    const last = this.texts[this.texts.length - 1]; if (!this.done && ((last && last.y < H / 2 - 20) || Input.isTriggered('cancel'))) { this.done = true; this.fader.out(this, 900).then(() => { Audio.bgm(null); this.scene.start('Title'); }); }
  }
}
