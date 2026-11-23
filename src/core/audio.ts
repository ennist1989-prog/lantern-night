import Phaser from 'phaser';
import { Settings } from './settings';
/** Optional BGM (see boot.ts OPTIONAL) -> track to play until it is delivered. */
const BGM_FALLBACK: Record<string, string> = { final: 'boss' };
/** Chapter 3+ music is fetched on first use (keeps the initial download small); tools/ch_audio.py encodes it. */
const LAZY = new Set(['forest', 'forest_far', 'grove', 'crossing', 'crossing_far', 'willow', 'willow_far']);
type Fade = { s: Phaser.Sound.BaseSound; from: number; to: number; t: number; dur: number; kill: boolean };
class AudioClass {
  game!: Phaser.Game; cur: Phaser.Sound.BaseSound | null = null; curName = ''; fadeTween: any = null;
  /** Fades run on the game loop ('step'), not on a scene's tween manager: the old code tweened on scenes[0] (Boot), which is
   *  stopped after start-up, so fades never ran and every track ever started kept playing underneath (playtest bug #10). */
  private fades: Fade[] = [];
  /** At most one outgoing track is kept (fading); anything older is stopped at once, so ≤1 track is audible after a fade. */
  private outgoing: Phaser.Sound.BaseSound | null = null;
  init(g: Phaser.Game) { this.game = g; g.events.on('step', (_t: number, dt: number) => this.tickFades(dt)); }
  private mgr() { return this.game.sound; }
  private tickFades(dt: number) {
    if (!this.fades.length) return;
    for (const f of this.fades) { f.t = Math.min(f.dur, f.t + dt); (f.s as any).volume = f.from + (f.to - f.from) * (f.dur ? f.t / f.dur : 1); }
    const done = this.fades.filter((f) => f.t >= f.dur); this.fades = this.fades.filter((f) => f.t < f.dur);
    done.forEach((f) => { if (f.kill) this.kill(f.s); });
  }
  private fade(s: Phaser.Sound.BaseSound, to: number, ms: number, kill: boolean) {
    this.fades = this.fades.filter((f) => f.s !== s);
    if (ms <= 0) { (s as any).volume = to; if (kill) this.kill(s); return; }
    this.fades.push({ s, from: +(s as any).volume || 0, to, t: 0, dur: ms, kill });
  }
  private kill(s: Phaser.Sound.BaseSound) { this.fades = this.fades.filter((f) => f.s !== s); if (this.outgoing === s) this.outgoing = null; try { s.stop(); s.destroy(); } catch (e) { /* already gone */ } }
  /** Retire the current track (fade out), hard-stopping any earlier outgoing track and stray bgm_* instances. */
  private retire(old: Phaser.Sound.BaseSound | null, ms: number) {
    if (this.outgoing && this.outgoing !== old) this.kill(this.outgoing);
    for (const s of [...((this.mgr() as any).sounds || [])] as Phaser.Sound.BaseSound[]) if (s.key.startsWith('bgm_') && s !== old && s !== this.cur) this.kill(s);
    if (!old) return; this.outgoing = old; this.fade(old, 0, ms, true);
  }
  /** Debug/test view: bgm_* sounds still playing, with volume. */
  playing() { return ((this.mgr() as any).sounds || []).filter((s: any) => s.key.startsWith('bgm_') && s.isPlaying).map((s: any) => ({ key: s.key.slice(4), vol: +s.volume })); }
  bgm(name: string | null, opts: { fade?: number; vol?: number } = {}) {
    if (!name) return this.stopBgm();
    if (this.curName === name && this.cur && (this.cur as any).isPlaying) { this.applyVol(); return; }
    const old = this.cur; this.curName = name; this.cur = null;
    const mgr = this.mgr();
    let key = 'bgm_' + name; if (!this.game.cache.audio.exists(key) && BGM_FALLBACK[name]) key = 'bgm_' + BGM_FALLBACK[name];   // optional track not delivered yet
    if (!this.game.cache.audio.exists(key) && LAZY.has(name)) { this.lazyLoad(name, opts); }
    const dur = (opts.fade ?? 0.6) * 1000;
    if (!this.game.cache.audio.exists(key)) { this.retire(old, Math.min(dur, 300)); return; }
    const s = mgr.add(key, { loop: true, volume: 0 });
    this.cur = s; s.play();
    this.fade(s, Settings.data.bgm * (opts.vol ?? 1), dur, false);
    this.retire(old, dur);
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
  applyVol() { if (this.cur) { this.fades = this.fades.filter((f) => f.s !== this.cur); (this.cur as any).volume = Settings.data.bgm; } }
  stopBgm(fade = 0.5) { const o = this.cur; this.cur = null; this.curName = ''; this.retire(o, fade * 1000); }
  /** Menu cursor / confirm: a short synthesized mouse click instead of the old chime (playtest D4). Counted for tests. */
  clicks = 0; private noise: AudioBuffer | null = null;
  click(vol = 1, pitch = 1) {
    this.clicks++;
    try {
      const m: any = this.mgr(); const ctx: AudioContext | undefined = m.context; if (!ctx) return;
      const out: AudioNode = m.masterVolumeNode || ctx.destination; const t = ctx.currentTime;
      if (!this.noise) { const n = Math.floor(ctx.sampleRate * 0.03); const b = ctx.createBuffer(1, n, ctx.sampleRate); const d = b.getChannelData(0); let seed = 7; for (let i = 0; i < n; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 2147483647) * 2 - 1; } this.noise = b; }
      const g = ctx.createGain(); const v = 0.55 * Settings.data.se * vol; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.018); g.connect(out);
      const src = ctx.createBufferSource(); src.buffer = this.noise; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200 * pitch; bp.Q.value = 1.4;
      src.connect(bp); bp.connect(g); src.start(t); src.stop(t + 0.03);
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(1800 * pitch, t); o.frequency.exponentialRampToValueAtTime(600 * pitch, t + 0.008);
      const og = ctx.createGain(); og.gain.setValueAtTime(v * 0.35, t); og.gain.exponentialRampToValueAtTime(0.0008, t + 0.01); o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.015);
    } catch (e) { /* no WebAudio */ }
  }
  se(name: string, vol = 1, rate = 1) {
    if (name === 'cursor') return this.click(vol * 0.8, rate * 1.15);
    if (name === 'ok') return this.click(vol, rate * 0.85);
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
