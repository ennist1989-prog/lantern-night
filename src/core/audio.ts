import Phaser from 'phaser';
import { Settings } from './settings';
/** Optional BGM (see boot.ts OPTIONAL) -> track to play until it is delivered. */
const BGM_FALLBACK: Record<string, string> = { final: 'boss' };
/** Chapter 3+ music is fetched on first use (keeps the initial download small); tools/ch_audio.py encodes it. */
const LAZY = new Set(['forest', 'forest_far', 'grove', 'crossing', 'crossing_far', 'willow', 'willow_far']);
class AudioClass {
  game!: Phaser.Game; cur: Phaser.Sound.BaseSound | null = null; curName = ''; fadeTween: any = null;
  init(g: Phaser.Game) { this.game = g; }
  private mgr() { return this.game.sound; }
  bgm(name: string | null, opts: { fade?: number; vol?: number } = {}) {
    if (!name) return this.stopBgm();
    if (this.curName === name && this.cur && (this.cur as any).isPlaying) { this.applyVol(); return; }
    const old = this.cur; this.curName = name;
    const mgr = this.mgr();
    let key = 'bgm_' + name; if (!this.game.cache.audio.exists(key) && BGM_FALLBACK[name]) key = 'bgm_' + BGM_FALLBACK[name];   // optional track not delivered yet
    if (!this.game.cache.audio.exists(key) && LAZY.has(name)) { this.lazyLoad(name, opts); }
    if (!this.game.cache.audio.exists(key)) { if (old) { old.stop(); old.destroy(); } this.cur = null; return; }
    const s = mgr.add(key, { loop: true, volume: 0 });
    this.cur = s; s.play();
    const target = Settings.data.bgm * (opts.vol ?? 1);
    const dur = (opts.fade ?? 0.6) * 1000;
    const sc = this.game.scene.scenes[0];
    if (sc) sc.tweens.add({ targets: s, volume: target, duration: dur });
    else (s as any).volume = target;
    if (old) { const sc2 = this.game.scene.scenes[0]; if (sc2) sc2.tweens.add({ targets: old, volume: 0, duration: dur, onComplete: () => { old.stop(); old.destroy(); } }); else { old.stop(); old.destroy(); } }
  }
  private lp: BiquadFilterNode | null = null;
  /** Realm-shift muffle: a low-pass sweep on everything (WebAudio only; silently skipped elsewhere). on=true closes to ~600 Hz, false reopens. */
  muffle(on: boolean, ms = 300) {
    try {
      const m: any = this.mgr(); const ctx: AudioContext | undefined = m.context; if (!ctx || !m.masterVolumeNode) return;
      if (!this.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 22000; m.masterVolumeNode.disconnect(); m.masterVolumeNode.connect(f); f.connect(ctx.destination); this.lp = f; }
      const t = ctx.currentTime; this.lp.frequency.cancelScheduledValues(t); this.lp.frequency.setValueAtTime(this.lp.frequency.value, t);
      this.lp.frequency.exponentialRampToValueAtTime(on ? 600 : 22000, t + ms / 1000);
    } catch (e) { /* ignore */ }
  }
  private loading = new Set<string>();
  private lazyLoad(name: string, opts: any) {
    if (this.loading.has(name)) return; this.loading.add(name);
    const sc: any = this.game.scene.getScenes(true)[0]; if (!sc) return;
    const prev = sc.load.path; sc.load.setPath('assets/'); sc.load.audio('bgm_' + name, `bgm/${name}.ogg`); sc.load.setPath(prev);
    sc.load.once('complete', () => { this.loading.delete(name); if (this.curName === name && !this.cur) { this.curName = ''; this.bgm(name, opts); } });
    sc.load.start();
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
