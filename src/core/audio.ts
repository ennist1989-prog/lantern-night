import Phaser from 'phaser';
import { Settings } from './settings';
class AudioClass {
  game!: Phaser.Game; cur: Phaser.Sound.BaseSound | null = null; curName = ''; fadeTween: any = null;
  init(g: Phaser.Game) { this.game = g; }
  private mgr() { return this.game.sound; }
  bgm(name: string | null, opts: { fade?: number; vol?: number } = {}) {
    if (!name) return this.stopBgm();
    if (this.curName === name && this.cur && (this.cur as any).isPlaying) { this.applyVol(); return; }
    const old = this.cur; this.curName = name;
    const mgr = this.mgr();
    if (!this.game.cache.audio.exists('bgm_' + name)) { this.cur = null; return; }
    const s = mgr.add('bgm_' + name, { loop: true, volume: 0 });
    this.cur = s; s.play();
    const target = Settings.data.bgm * (opts.vol ?? 1);
    const dur = (opts.fade ?? 0.6) * 1000;
    const sc = this.game.scene.scenes[0];
    if (sc) sc.tweens.add({ targets: s, volume: target, duration: dur });
    else (s as any).volume = target;
    if (old) { const sc2 = this.game.scene.scenes[0]; if (sc2) sc2.tweens.add({ targets: old, volume: 0, duration: dur, onComplete: () => { old.stop(); old.destroy(); } }); else { old.stop(); old.destroy(); } }
  }
  applyVol() { if (this.cur) (this.cur as any).volume = Settings.data.bgm; }
  stopBgm(fade = 0.5) { const o = this.cur; this.cur = null; this.curName = ''; if (!o) return; const sc = this.game.scene.scenes[0]; if (sc) sc.tweens.add({ targets: o, volume: 0, duration: fade * 1000, onComplete: () => { o.stop(); o.destroy(); } }); else { o.stop(); o.destroy(); } }
  se(name: string, vol = 1, rate = 1) {
    if (!this.game || !this.game.cache.audio.exists('se_' + name)) return;
    try { this.mgr().play('se_' + name, { volume: Settings.data.se * vol, rate }); } catch (e) { /* ignore */ }
  }
  me(name: string) {
    if (!this.game.cache.audio.exists('me_' + name)) return;
    const dip = this.cur as any; if (dip) dip.volume = Settings.data.bgm * 0.25;
    const s = this.mgr().add('me_' + name, { volume: Settings.data.se });
    s.once('complete', () => { s.destroy(); this.applyVol(); });
    s.play();
  }
}
export const Audio = new AudioClass();
