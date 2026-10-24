// Placeholder-art verification: boss fights Near/Far, Tsubaki map sprite Near/Far, Tsubaki face in dialogue. Sentry blocked.
import { chromium } from '/workspace/lantern-night/node_modules/playwright-core/index.mjs';
const URL = process.env.URL || 'http://127.0.0.1:8131/'; const OUT = '/workspace/ln-art/shots/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const errors = [], cerr = []; let sentryBlocked = 0; const results = [];
async function fresh() {
  const ctx = await browser.newContext({ viewport: { width: 816, height: 624 } });
  await ctx.route(/sentry\.io/, (r) => { sentryBlocked++; r.abort(); });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/sentry|ERR_FAILED/i.test(m.text())) cerr.push(m.text()); });
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('lotfs.settings', JSON.stringify({ walkSpeed: 'brisk', textSpeed: 2 })); });
  await page.goto(URL);
  const scenes = () => page.evaluate(() => window.__game?.scene.getScenes(true).map(s => s.sys.settings.key) || []).catch(() => []);
  for (let i = 0; i < 60; i++) { if ((await scenes()).includes('Title')) break; await sleep(500); } await sleep(800);
  await page.keyboard.press('Enter');
  for (let i = 0; i < 60; i++) { if ((await scenes()).includes('Map')) break; await sleep(300); }
  for (let i = 0; i < 200; i++) { const d = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return window.__S.$.switches.intro_done && !m.interp.busy && !m.msg.busy; }); if (d) break; await page.keyboard.press('Enter'); await sleep(150); }
  await page.evaluate(async () => { const m = window.__game.scene.getScene('Map'); m.ready = false; await m.loadMap(1, 22, 22, 'down'); m.ready = true; });
  await sleep(800); return { ctx, page, scenes };
}
async function fight(troop, realm, name) {
  const { ctx, page, scenes } = await fresh();
  await page.evaluate(async ([realm]) => { const $ = window.__S.$; $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; a.level = 20; } const m = window.__game.scene.getScene('Map'); $.realm = realm; m.applyRealmVisuals(); m.refreshEvents?.(); }, [realm]);
  await sleep(600);
  page.evaluate(([t]) => { window.__game.scene.getScene('Map').startBattle(t, { boss: true, noEscape: true }); }, [troop]);
  for (let i = 0; i < 40; i++) { if ((await scenes()).includes('Battle')) break; await sleep(300); }
  await sleep(4500);
  const info = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); const f = b.B.foes.find(x => x.boss); const s = b.spr.get(f.uid); return { realm: b.B.realm, boss: f.id, tex: s.texture.key, frames: b.bossMeta[f.id], tint: '#' + (s.tintTopLeft >>> 0).toString(16).padStart(6, '0'), noFar: !!f.sprite?.noFar, scale: s.scaleX }; });
  await page.screenshot({ path: OUT + name }); results.push({ shot: name, ...info }); await ctx.close();
}
await fight('boss_straw_warden', 'near', 'warden-near.png');
await fight('boss_straw_warden', 'far', 'warden-far.png');
await fight('boss_tsubaki_forge', 'near', 'tsubaki-forge-near.png');
await fight('boss_tsubaki_forge', 'far', 'tsubaki-forge-far.png');
await fight('boss_tsubaki_final', 'near', 'tsubaki-final-near.png');
await fight('boss_tsubaki_final', 'far', 'tsubaki-final-far.png');
// Map sprite (Near + Far, next to Mio) + face in dialogue
{ const { ctx, page } = await fresh();
  for (let i = 0; i < 40; i++) { const busy = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return m.msg.busy || m.interp.busy; }); if (!busy) break; await page.keyboard.press('Enter'); await sleep(250); }
  for (let i = 0; i < 40; i++) { await page.keyboard.press('Enter'); await sleep(300); }
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); m.msg.win.setVisible(false); m.msg.arrow.setVisible(false); });
  await sleep(1500);
  for (const realm of ['near', 'far']) {
    const info = await page.evaluate(async ([realm]) => { const $ = window.__S.$; const m = window.__game.scene.getScene('Map'); $.realm = realm; m.applyRealmVisuals(); m.refreshEvents?.();
      const C = m.player.constructor; if (window.__tsu) window.__tsu.spr.destroy(); const c = new C(m, m.player.tx + 1, m.player.ty); m.world.add(c.spr); c.setSheet('tsubaki', realm === 'far', 'left'); window.__tsu = c;
      const ref = new C(m, m.player.tx - 1, m.player.ty); m.world.add(ref.spr); ref.setSheet('villager1', realm === 'far', 'right'); window.__ref?.spr.destroy(); window.__ref = ref;
      return { realm, tsubakiTex: c.spr.texture.key, villagerTex: ref.spr.texture.key }; }, [realm]);
    await sleep(700); await page.screenshot({ path: OUT + `tsubaki-map-${realm}.png` }); results.push({ shot: `tsubaki-map-${realm}.png`, ...info });
  }
  page.evaluate(() => { const m = window.__game.scene.getScene('Map'); m.interp.run([{ c: 'msg', face: 'tsubaki_grief', name: 'Tsubaki', text: 'You carry his lantern like it still owes you something. Placeholder face check.' }]); });
  await sleep(2500); await page.screenshot({ path: OUT + 'tsubaki-face-dialogue.png' });
  const hasFace = await page.evaluate(() => ['tsubaki', 'tsubaki_grief', 'tsubaki_anger', 'tsubaki_resolve'].map(k => [k, window.__game.textures.exists('face_' + k)]));
  results.push({ shot: 'tsubaki-face-dialogue.png', faces: hasFace }); await ctx.close(); }
for (const r of results) console.log(JSON.stringify(r));
console.log('pageerrors', JSON.stringify(errors)); console.log('console.error', JSON.stringify(cerr)); console.log('sentryBlocked', sentryBlocked);
await browser.close();
