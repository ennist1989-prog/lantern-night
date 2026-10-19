import Phaser from 'phaser';
import { loadDatabase, DB } from '../core/db';
import { W, H, FONT } from '../ui/windows';
const CHARS = 'mio kaze daigo sachi elder ghostman villager1 villager2 villager3 villager4 woman child priest keeper spirit statue eggboy smith noble ghostgirl skeleton kettle wisp wisp2 slime mouse mouse2 lantern lantern2'.split(' ');
const FACES = CHARS.concat(['tengu', 'gspirit']);
const FX = 'circle claw cut cutx explosion flam ice plant shield slash spark spirit spiritb thunder water'.split(' ');
const BGM = 'title village village_far home well well_far shrine shrine_far battle boss sad credits calm fading'.split(' ');
const SE = 'bell buzzer cancel coin crit cursor dog door encounter escape explosion fade fire grass heal hit hit2 load magic magic2 ok pickup powerup save shift slash strange tick voice water'.split(' ');
const ME = 'victory levelup gameover secret fanfare'.split(' ');
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const bar = this.add.rectangle(W / 2 - 200, H / 2, 0, 12, 0xbff6ff).setOrigin(0, 0.5); this.add.rectangle(W / 2, H / 2, 404, 16).setStrokeStyle(2, 0x7a96d6);
    this.add.text(W / 2, H / 2 - 40, 'Lantern Night', { fontFamily: FONT, fontSize: '32px', color: '#ffe9a0' }).setOrigin(0.5);
    this.load.on('progress', (p: number) => { bar.width = 400 * p; });
    const L = this.load; L.setPath('assets/'); const dataPath = (u: string) => u; void dataPath;
    ['floor', 'ifloor', 'wallsimple'].forEach((n) => L.image('tile_' + n, `tiles/${n}.png`));
    L.image('objects', 'objects.png'); L.json('objectsmeta', 'objects.json'); L.json('iconsmeta', 'icons.json'); L.spritesheet('icons', 'icons.png', { frameWidth: 24, frameHeight: 24 });
    L.image('windowskin', 'ui/windowskin.png');
    CHARS.forEach((c) => L.spritesheet('char_' + c, `chars/${c}.png`, { frameWidth: 16, frameHeight: 16 }));
    FACES.forEach((c) => L.image('face_' + c, `faces/${c}.png`));
    L.json('bossmeta', 'boss/meta.json');
    L.json('spec_enemies', '../data/spec/enemies.json'); L.json('spec_bosses', '../data/spec/bosses.json');
    L.on('filecomplete-json-spec_enemies', (_k: string, _t: string, d: any) => { for (const id of Object.keys(d)) L.image('mon_' + id, `mon/${id}.png`); });
    L.on('filecomplete-json-spec_bosses', (_k: string, _t: string, d: any) => { for (const id of Object.keys(d)) L.image('boss_' + id, `boss/${id}.png`); });
    FX.forEach((c) => L.image('fx_' + c, `fx/${c}.png`)); L.json('fxmeta', 'fx/meta.json');
    BGM.forEach((n) => L.audio('bgm_' + n, `bgm/${n}.ogg`)); SE.forEach((n) => L.audio('se_' + n, `se/${n}.ogg`)); ME.forEach((n) => L.audio('me_' + n, `me/${n}.ogg`));
  }
  async create() {
    const tex = this.textures.get('objects'); const m = this.cache.json.get('objectsmeta');
    for (const [name, r] of Object.entries(m) as any) tex.add(name, 0, r[0], r[1], r[2], r[3]);
    this.registry.set('iconIdx', this.cache.json.get('iconsmeta'));
    try { await loadDatabase(); } catch (e) { this.add.text(20, 20, 'Failed to load data: ' + e, { color: '#f88' }); return; }
    document.getElementById('boot')?.remove();
    this.scene.start('Title');
    void DB;
  }
}
