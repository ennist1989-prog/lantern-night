import Phaser from 'phaser';
import { SPEC } from './spec';
import { W } from '../ui/windows';
import { $ } from '../core/state';
const col = (s?: string) => (s ? parseInt(s.replace('#', ''), 16) : undefined);
/** Timed cut-in + FX sequence for a Keepsake summon (steps come from summons.json `anim`; sprites are the build's CC0 Ninja Adventure FX sheets). */
export async function playSummonFx(sc: any, e: any) {
  const d = SPEC.summons.summons[e.id]; if (!d) return; const steps: any[] = d.anim || [];
  const B = sc.B; const foes = B.foesAlive(); const party = B.party.filter((p: any) => p.hp > 0);
  const posTargets = (at: string) => { const L = at === 'party' ? party : foes; if (at === 'screen') return [{ x: 408, y: 150 }]; const arr = (at === 'target' ? [L[Math.floor(Math.random() * Math.max(1, L.length))]] : L).filter(Boolean); return arr.map((t: any) => sc.posOf(t)).map((p: any) => ({ x: p.x, y: p.y - 34 })); };
  const dim = sc.add.rectangle(0, 0, W, 400, 0x000000, 0).setOrigin(0, 0).setDepth(80); sc.tweens.add({ targets: dim, alpha: 0.38, duration: 240 / sc.speed() });
  const objs: Phaser.GameObjects.GameObject[] = [dim]; const tasks: Promise<void>[] = [];
  const portrait = () => {
    const pr = d.portrait || {}; let key = '', crop: any = null, scale = 1;
    const tryRef = (ref: string, id: string) => { if (ref === 'enemy' && sc.textures.exists('mon_' + id)) { key = 'mon_' + id; } else if (ref === 'boss' && sc.textures.exists('boss_' + id)) { key = 'boss_' + id; const m = sc.bossMeta?.[id]; crop = m ? [0, 0, m.fw, m.fh] : null; } else if (ref === 'npc' && sc.textures.exists('face_' + id)) { key = 'face_' + id; } };
    tryRef(pr.ref, pr.id); if (!key && pr.fallback) { const [r, i] = pr.fallback.split(':'); tryRef(r, i); } if (!key) return null;
    const im = sc.add.image(W + 120, 150, key).setDepth(90).setOrigin(0.5); if (crop) im.setCrop(...crop);
    const base = crop ? crop[2] : im.width; scale = 150 / Math.max(base, 1); im.setScale(scale); const tn = col(steps.find((s) => s.kind === 'cutin')?.tint); if (tn) { im.setTint(tn); }
    sc.tweens.add({ targets: im, x: W - 170, duration: 300 / sc.speed(), ease: 'Cubic.easeOut' }); sc.tweens.add({ targets: im, alpha: 0, duration: 260 / sc.speed(), delay: 900 / sc.speed() }); objs.push(im); return im;
  };
  const title = sc.add.text(W - 170, 244, d.name, { fontFamily: 'Pixelify Sans', fontSize: '24px', color: '#ffe9a0', stroke: '#101030', strokeThickness: 5 }).setOrigin(0.5).setDepth(91).setAlpha(0); sc.tweens.add({ targets: title, alpha: 1, duration: 200 / sc.speed(), delay: 150 / sc.speed() }); objs.push(title);
  portrait();
  let end = 0;
  for (const st of steps) {
    end = Math.max(end, (st.t || 0) + (st.ms || 300));
    tasks.push((async () => {
      await sc.t(st.t || 0);
      if (st.kind === 'fx') { const reps = st.repeat || 1; for (let r = 0; r < reps; r++) { const ps = posTargets(st.at || 'targets'); await Promise.race([Promise.all(ps.map((p: any) => sc.fx(st.fx, p.x, p.y, st.scale || 2, col(st.tint)))), sc.t(500)]); } }
      else if (st.kind === 'particle') { const name = (st.src || '').split('/').pop().replace('.png', ''); const key = 'fx_p_' + name; if (!sc.textures.exists(key)) return; const n = 16;
        for (let i = 0; i < n; i++) { const x = 40 + Math.random() * (W - 80); const y = 20 + Math.random() * 120; const im = name === 'Clouds' ? sc.add.image(x, y, key) : sc.add.sprite(x, y, key, Math.floor(Math.random() * 8)); im.setScale(name === 'Clouds' ? 2 : 3).setDepth(92).setAlpha(0.9); sc.tweens.add({ targets: im, x: x + (Math.random() - 0.3) * 160, y: y + 100 + Math.random() * 80, angle: Math.random() * 180, alpha: 0, duration: ((st.ms || 700) + Math.random() * 400) / sc.speed(), onComplete: () => im.destroy() }); } }
      else if (st.kind === 'shake') sc.cameras.main.shake((st.ms || 300) / sc.speed(), (st.amp || 3) / 800);
      else if (st.kind === 'flash') await sc.flashAll(col(st.tint) ?? 0xffffff);
      else if (st.kind === 'floatText') { const ps = posTargets(d.scope === 'all_allies' ? 'party' : 'targets'); const p = ps[0] || { x: 408, y: 140 }; sc.popup(p.x, p.y - 30, st.text, '#ffe9a0', 30); }
      else if (st.kind === 'procession') { const ids = Object.keys($.bonds || {}).slice(0, 18); const n = Math.max(6, ids.length); for (let i = 0; i < n; i++) { const key = ids[i] && sc.textures.exists('mon_' + ids[i]) ? 'mon_' + ids[i] : 'fx_spirit'; const im = key === 'fx_spirit' ? sc.add.sprite(-30, 130 + (i % 3) * 36, 'fx_spirit', 0) : sc.add.image(-30, 130 + (i % 3) * 36, key); im.setScale(key === 'fx_spirit' ? 1.6 : 3).setDepth(93).setTint(0xfff1b8); sc.tweens.add({ targets: im, x: W + 30, duration: ((st.ms || 1200) + 400) / sc.speed(), delay: (i * (st.ms || 1200)) / n / sc.speed() * 0.6, onComplete: () => im.destroy() }); } }
    })());
  }
  await Promise.race([Promise.all(tasks), sc.t(end + 400)]); await sc.t(Math.max(0, end - 300) > 1800 ? 200 : 300);
  sc.tweens.add({ targets: dim, alpha: 0, duration: 200 / sc.speed() }); await sc.t(220); objs.forEach((o) => o.destroy());
}
