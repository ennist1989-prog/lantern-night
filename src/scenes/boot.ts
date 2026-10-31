import Phaser from 'phaser';
import { loadDatabase, DB } from '../core/db';
import { W, H, FONT } from '../ui/windows';
const CHARS = 'mio kaze daigo sachi elder ghostman villager1 villager2 villager3 villager4 woman child priest keeper spirit statue eggboy smith noble ghostgirl skeleton kettle wisp wisp2 slime mouse mouse2 lantern lantern2 oto kappa rustle hisa tsubaki willow'.split(' ');
const FACES = CHARS.concat(['tengu', 'gspirit', 'tsubaki_grief', 'tsubaki_anger', 'tsubaki_resolve', 'kappa_bowed', 'willow_final_calm', 'willow_final_strained']);
/** Art/audio that may not be delivered yet (Tsubaki asset pack, final-boss BGM). These are only queued when
 *  assets/manifest.json (written by tools/art_custom.py) lists them, so a missing file never 404s; create() then
 *  aliases a missing char sheet to the current placeholder, and Audio falls back for a missing BGM. */
const OPTIONAL: Record<'chars' | 'faces' | 'bgm' | 'tiles', string[]> = { chars: ['tsubaki', 'haru', 'tokubei_far'], faces: ['haru', 'tokubei_far', 'tsubaki', 'tsubaki_grief', 'tsubaki_anger', 'tsubaki_resolve', 'kappa_bowed', 'willow_final_calm', 'willow_final_strained'], bgm: ['final'], tiles: ['ch3fix', 'border', 'maze'] };
const CHAR_PLACEHOLDER: Record<string, string> = { tsubaki: 'mio' };
const isOpt = (k: keyof typeof OPTIONAL, n: string) => OPTIONAL[k].includes(n);
const FX = 'circle claw cut cutx explosion flam ice plant shield slash spark spirit spiritb thunder water'.split(' ');
const BGM = 'title village village_far home well well_far shrine shrine_far battle boss sad credits calm fading final'.split(' ');
const SE = 'bell buzzer cancel coin crit cursor dog door encounter escape explosion fade fire grass heal hit hit2 load magic magic2 ok pickup powerup save shift slash strange tick voice water'.split(' ');
const ME = 'victory levelup gameover secret fanfare'.split(' ');
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const bar = this.add.rectangle(W / 2 - 200, H / 2, 0, 12, 0xbff6ff).setOrigin(0, 0.5); this.add.rectangle(W / 2, H / 2, 404, 16).setStrokeStyle(2, 0x7a96d6);
    this.add.text(W / 2, H / 2 - 40, 'Lantern Night', { fontFamily: FONT, fontSize: '32px', color: '#ffe9a0' }).setOrigin(0.5);
    this.load.on('progress', (p: number) => { bar.width = 400 * p; });
    const L = this.load; L.setPath('assets/'); const dataPath = (u: string) => u; void dataPath;
    ['floor', 'ifloor', 'wallsimple', 'water'].forEach((n) => L.image('tile_' + n, `tiles/${n}.png`));
    L.image('objects', 'objects.png'); L.json('objectsmeta', 'objects.json'); L.json('iconsmeta', 'icons.json'); L.json('icons2meta', 'icons2.json'); L.spritesheet('icons2', 'icons2.png', { frameWidth: 34, frameHeight: 34 }); L.spritesheet('icons', 'icons.png', { frameWidth: 24, frameHeight: 24 });
    L.image('windowskin', 'ui/windowskin.png');
    CHARS.filter((c) => !isOpt('chars', c)).forEach((c) => L.spritesheet('char_' + c, `chars/${c}.png`, { frameWidth: 16, frameHeight: 16 }));
    FACES.filter((c) => !isOpt('faces', c)).forEach((c) => L.image('face_' + c, `faces/${c}.png`));
    // Boss phase strips (sprite.phaseStrips, e.g. willow_mother_strained) are queued only when the manifest lists the file, so a
    // strip that hasn't been delivered never 404s; the battle then keeps the base strip. Runs once both JSON files are in.
    let manifest: any = null, bosses: any = null; const queued = new Set<string>();
    const queuePhaseStrips = () => { if (!manifest || !bosses) return; for (const b of Object.values(bosses) as any[]) for (const k of Object.values(b.sprite?.phaseStrips || {}) as string[]) if (!queued.has(k) && manifest.boss?.includes(k)) { queued.add(k); L.image('boss_' + k, `boss/${k}.png`); } };
    L.json('assetmanifest', 'manifest.json');
    L.on('filecomplete-json-assetmanifest', (_k: string, _t: string, m: any) => {
      for (const c of OPTIONAL.chars) if (m?.chars?.includes(c)) L.spritesheet('char_' + c, `chars/${c}.png`, { frameWidth: 16, frameHeight: 16 });
      for (const c of OPTIONAL.faces) if (m?.faces?.includes(c)) L.image('face_' + c, `faces/${c}.png`);
      for (const n of OPTIONAL.bgm) if (m?.bgm?.includes(n)) L.audio('bgm_' + n, `bgm/${n}.ogg`);
      for (const n of OPTIONAL.tiles) if (m?.tiles?.includes(n)) L.image('tile_' + n, `tiles/${n}.png`);   // ch3fix: Far-readability tile sheet 5
      manifest = m; queuePhaseStrips();
    });
    L.json('bossmeta', 'boss/meta.json');
    L.json('spec_enemies', '../data/spec/enemies.json'); L.json('spec_bosses', '../data/spec/bosses.json');
    L.on('filecomplete-json-spec_enemies', (_k: string, _t: string, d: any) => { for (const id of Object.keys(d)) L.image('mon_' + id, `mon/${id}.png`); });
    L.on('filecomplete-json-spec_bosses', (_k: string, _t: string, d: any) => { for (const id of Object.keys(d)) L.image('boss_' + id, `boss/${id}.png`); bosses = d; queuePhaseStrips(); });
    FX.forEach((c) => L.image('fx_' + c, `fx/${c}.png`)); L.json('fxmeta', 'fx/meta.json'); L.spritesheet('fx_p_Leaf', 'fx/p_Leaf.png', { frameWidth: 9, frameHeight: 7 }); L.spritesheet('fx_p_LeafPink', 'fx/p_LeafPink.png', { frameWidth: 9, frameHeight: 7 }); L.image('fx_p_Clouds', 'fx/p_Clouds.png');
    BGM.filter((n) => !isOpt('bgm', n)).forEach((n) => L.audio('bgm_' + n, `bgm/${n}.ogg`)); SE.forEach((n) => L.audio('se_' + n, `se/${n}.ogg`)); ME.forEach((n) => L.audio('me_' + n, `me/${n}.ogg`));
  }
  async create() {
    const tex = this.textures.get('objects'); const m = this.cache.json.get('objectsmeta');
    for (const [name, r] of Object.entries(m) as any) tex.add(name, 0, r[0], r[1], r[2], r[3]);
    // optional art not delivered yet -> alias to the current placeholder so maps/events never show Phaser's missing texture
    for (const [c, ph] of Object.entries(CHAR_PLACEHOLDER)) if (!this.textures.exists('char_' + c) && this.textures.exists('char_' + ph)) this.textures.addSpriteSheet('char_' + c, this.textures.get('char_' + ph).getSourceImage() as HTMLImageElement, { frameWidth: 16, frameHeight: 16 });
    this.registry.set('iconIdx', this.cache.json.get('iconsmeta')); this.registry.set('icon2Idx', this.cache.json.get('icons2meta'));
    try { await loadDatabase(); } catch (e) { this.add.text(20, 20, 'Failed to load data: ' + e, { color: '#f88' }); return; }
    document.getElementById('boot')?.remove();
    this.scene.start('Title');
    void DB;
  }
}
