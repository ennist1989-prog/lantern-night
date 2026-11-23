// PF2 #6: loading a save (title Continue -> slot, and in-game load) must not leave a stray window/box on screen.
import { launch, sleep, press, newGame, mashUntil, teleport, waitScene } from './lib.mjs';
const SS = process.env.SS || '/tmp/pf2_shots';
const { browser, page, errors } = await launch(); let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
// every visible container-ish object in the Map scene's UI that lies in the bottom area and isn't the HUD
const stray = () => page.evaluate(() => { const m = window.__game.scene.getScene('Map'); const out = [];
  const walk = (o, d) => { if (!o || !o.visible || (o.alpha ?? 1) < 0.05) return; if (o.constructor?.name && /Win|Selectable/.test(o.constructor.name)) out.push({ k: o.constructor.name, x: Math.round(o.x), y: Math.round(o.y), w: o.w, h: o.h }); if (o.list && d < 4) o.list.forEach((c) => walk(c, d + 1)); };
  m.children.list.forEach((o) => walk(o, 0)); return { out, msgBusy: m.msg.busy, msgVis: m.msg.win?.visible, free: m.isFree() }; });
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && window.__game.scene.getScene('Map').isFree());
  for (const [slot, realm] of [[1, 'near'], [2, 'far']]) { await page.evaluate((r) => { window.__S.$.realm = r; }, realm); await teleport(page, 1, 18, 12, 'down'); await sleep(500); await page.evaluate((s) => window.__S.SaveManager.save(s), slot); }
  for (const [slot, realm] of [[1, 'near'], [2, 'far']]) {
    await page.reload(); await waitScene(page, 'Title', 30000); await sleep(800);
    await page.evaluate(() => { const t = window.__game.scene.getScene('Title'); t.menu.index = 1; t.menu.refresh(); }); await press(page, 'Enter'); await waitScene(page, 'SaveLoad');
    await sleep(600); for (let i = 0; i < slot; i++) {} // slot picker: select by index
    await page.evaluate((s) => { const sl = window.__game.scene.getScene('SaveLoad'); const w = sl.list || sl.win || sl.menu; const i = w.items.findIndex((it) => it.data === s || it.slot === s || (it.data && it.data.slot === s)); w.index = i >= 0 ? i : s; w.refresh?.(); }, slot);
    await press(page, 'Enter'); await sleep(400); await press(page, 'Enter'); // confirm if asked
    await waitScene(page, 'Map', 20000); await sleep(3500);
    const st = await stray(); await page.screenshot({ path: `${SS}/load_${realm}.png` });
    const bottom = st.out.filter((w) => w.y > 380);
    ok(!st.msgVis && bottom.length === 0, `Continue slot ${slot} (${realm}): no leftover window after load ` + JSON.stringify(st));
  }
} catch (e) { ok(false, 'exception ' + e.stack); }
console.log(fails ? `FAIL load_nobox (${fails})` : 'PASS load_nobox'); await browser.close(); process.exit(fails ? 1 : 0);
