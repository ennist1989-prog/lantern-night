// Playtest fixes E2E: start-up centring, controls tutorial persistence, click SE, D7 shrine-gate loop, edge exits (walk off, no
// button), well/root exits, chest opens and stays open, one BGM at a time. BASE=http://127.0.0.1:8123/ node tests/playtest.mjs
import fs from 'fs';
import { launch, sleep, press, hold, waitScene, waitFor, newGame, mashUntil, teleport } from './lib.mjs';
const SS = process.env.SS || 'screenshots/playtest_fixes'; fs.mkdirSync(SS, { recursive: true });
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log(c ? 'ok  ' : 'FAIL', m); return c; };
const st = (page) => page.evaluate(() => { const S = window.__S, m = window.__game.scene.getScene('Map'); return { map: S.$.map.id, x: m.player?.tx, y: m.player?.ty, dir: m.player?.dir, realm: S.$.realm, busy: m.msg?.busy, bgm: S.Audio.playing(), want: m.mapData?.bgm }; });
// teleport, let any arrival cutscene/autorun play out, then teleport again so the test starts from the exact tile
async function tp(page, map, x, y, dir) { const free = () => window.__game.scene.getScene('Map').isFree();
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { window.__S.$.realm = 'near'; }); await teleport(page, map, x, y, dir); await sleep(300); await mashUntil(page, free, null, 60); } }
async function bgmCheck(page, tag) { await sleep(1800); const s = await st(page); const keys = s.bgm.filter((b) => b.vol > 0.001).map((b) => b.key);
  ok(keys.length <= 1, `${tag}: ≤1 BGM audible (${keys.join(',') || 'none'})`); return s; }
async function walkUntil(page, key, pred, ms = 6000) { await page.keyboard.down(key); const t = Date.now(); let s; while (Date.now() - t < ms) { s = await st(page); if (pred(s)) break; await sleep(100); } await page.keyboard.up(key); await sleep(150); return st(page); }
{ // 1. start-up screen centred in a wide window (D1)
  const { browser, page } = await launch(undefined, { viewport: { width: 1280, height: 720 } });
  await waitScene(page, 'Title', 30000); await sleep(800);
  const r = await page.evaluate(() => { const c = document.querySelector('#game canvas').getBoundingClientRect(); const t = window.__game.scene.getScene('Title'); const f = t.children.list.find((o) => o.name === 'footer'); return { l: c.left, r: innerWidth - c.right, t: c.top, b: innerHeight - c.bottom, fw: f ? f.width : -1, fx: f ? f.getBounds().left : -1 }; });
  ok(Math.abs(r.l - r.r) <= 1 && Math.abs(r.t - r.b) <= 1, `title canvas centred (L${r.l.toFixed(0)} R${r.r.toFixed(0)} T${r.t.toFixed(0)} B${r.b.toFixed(0)})`);
  ok(r.fw > 0 && r.fw <= 816 && r.fx >= 0, `title footer fits the screen (w ${r.fw.toFixed(0)}, left ${r.fx.toFixed(0)})`);
  await page.screenshot({ path: `${SS}/01-title-1280x720.png` }); await browser.close();
}
const { browser, page, errors } = await launch();
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
  await page.evaluate(() => { window.__game.scene.getScene('Map').randomEncounter = async () => {}; });   // no random fights mid-test
  await sleep(600);
  // 2. controls tutorial (D3): visible, survives idle time, needs each control, then a press
  const panel = () => page.evaluate(() => { const t = window.__game.scene.getScene('Map').ctlTxt; return t && t.visible ? t.text : ''; });
  ok(/Controls/.test(await panel()), 'controls checklist shown after the intro');
  await page.screenshot({ path: `${SS}/02-tutorial-start.png` });
  await sleep(10000); ok(/Controls/.test(await panel()), 'checklist still up after 10 s idle (no timeout)');
  await press(page, 'ArrowLeft', 200); await sleep(300);
  await page.keyboard.down('Shift'); await press(page, 'ArrowRight', 200); await page.keyboard.up('Shift'); await sleep(300);
  ok(/✓ Move/.test(await panel()) && /✓ Dash/.test(await panel()), 'move + dash ticked');
  const c0 = await page.evaluate(() => window.__S.Audio.clicks);
  await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(400); await press(page, 'ArrowDown'); await sleep(200);
  const c1 = await page.evaluate(() => window.__S.Audio.clicks); ok(c1 > c0, `click SE plays on cursor/confirm (${c0} -> ${c1}) (D4)`);
  await press(page, 'x'); await sleep(600); await press(page, 'q'); await sleep(900);
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); if (m.msg.busy) {} });
  await waitFor(page, () => window.__game.scene.getScene('Map').isFree()); await sleep(150);
  await press(page, 'Enter'); await sleep(500); await mashUntil(page, () => !window.__game.scene.getScene('Map').msg.busy, null, 10);
  let t = await panel(); ok(/All set/.test(t) && !/☐/.test(t), 'all five controls ticked -> "All set! Press any button"');
  await page.screenshot({ path: `${SS}/03-tutorial-done.png` });
  await sleep(3000); ok(/All set/.test(await panel()), 'finished checklist waits for a press');
  const snap = await page.evaluate(() => JSON.parse(window.__S.SaveManager.snapshotString()));
  ok(JSON.stringify(snap).includes('ctl_move'), 'tutorial progress is in the save snapshot (save version unchanged)');
  await press(page, 'z'); await sleep(400); ok(!(await panel()) && await page.evaluate(() => window.__S.$.tutorialsShown.ctl_done), 'press dismisses it for good');
  await bgmCheck(page, 'map 2');
  // 3. D7: the locked shrine gate (1:18,4) pushes the player back the way they came, never into the (18,5) dead-end pocket
  const idle = () => !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy;
  const hookGate = () => page.evaluate(() => { const m = window.__game.scene.getScene('Map'); m.__trig = 0; if (m.__hooked) return; m.__hooked = 1; const o = m.triggerEvent.bind(m); m.triggerEvent = (e, b) => { if ((e.data?.x ?? e.x) === 18 && (e.data?.y ?? e.y) === 4) m.__trig++; return o(e, b); }; });
  const trig = () => page.evaluate(() => window.__game.scene.getScene('Map').__trig);
  const freeNb = () => page.evaluate(() => { const m = window.__game.scene.getScene('Map'), P = m.player; return [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dx, dy]) => !(P.tx + dx === 18 && P.ty + dy === 4) && m.cellOpen(P.tx + dx, P.ty + dy, P)).length; });
  const tpRealm = async (realm, x, y, dir) => { await tp(page, 1, x, y, dir); await page.evaluate(async ([r, x, y, dir]) => { const m = window.__game.scene.getScene('Map'); window.__S.$.realm = r; m.ready = false; await m.loadMap(1, x, y, dir); m.ready = true; }, [realm, x, y, dir]); await sleep(400); await mashUntil(page, idle, null, 30); await hookGate(); };
  const intoGate = async (key) => { await walkUntil(page, key, (q) => q.busy, 2500); await mashUntil(page, idle, null, 30); await sleep(300); return st(page); };
  // (a) walk in from behind (row 3) and from the side (row 4), Near and Far: pushed back to that side, free to walk on
  for (const realm of ['near', 'far']) {
    await tpRealm(realm, 18, 3, 'down'); let s = await intoGate('ArrowDown');
    ok(await trig() === 1 && s.x === 18 && s.y === 3 && s.realm === realm, `D7 ${realm}: in from behind (18,3) -> gate fires once, pushed back to (18,3) (at ${s.x},${s.y})`);
    ok(await freeNb() >= 2, `D7 ${realm}: (18,3) has free neighbours (${await freeNb()})`);
    s = await walkUntil(page, 'ArrowLeft', (q) => q.x <= 15, 2500); ok(s.x <= 15 && s.y === 3 && !s.busy, `D7 ${realm}: walks away left along row 3 (at ${s.x},${s.y})`);
    await tpRealm(realm, 16, 4, 'right'); s = await intoGate('ArrowRight');
    ok(await trig() === 1 && s.x === 17 && s.y === 4 && await freeNb() >= 2, `D7 ${realm}: in from the side (17,4) -> pushed back to (17,4), not (18,5) (at ${s.x},${s.y})`);
    s = await walkUntil(page, 'ArrowUp', (q) => q.y <= 3, 2000); ok(s.y === 3 && s.x === 17, `D7 ${realm}: walks away up from (17,4) (at ${s.x},${s.y})`);
  }
  // holding a key into the gate is one trigger, no loop
  await tpRealm('near', 18, 3, 'down'); await page.keyboard.down('ArrowDown'); const t0 = Date.now();
  while (Date.now() - t0 < 5000) { if (await page.evaluate(() => window.__game.scene.getScene('Map').msg.busy)) await page.keyboard.press('Enter'); await sleep(250); }
  await page.keyboard.up('ArrowDown'); await sleep(300); await mashUntil(page, idle, null, 10);
  let n = await trig(); let s = await st(page);
  ok(n === 1 && s.map === 1 && s.y === 3, `D7: 5 s holding Down into the locked gate fires it once (fired ${n}, at ${s.x},${s.y})`);
  await page.screenshot({ path: `${SS}/04-shrine-gate-held.png` });
  // (b) an old save made standing in the (18,5) pocket loads, and the player gets out (Near and Far)
  for (const realm of ['near', 'far']) {
    await tpRealm(realm, 14, 4, 'down');
    await page.evaluate(async (r) => { const S = window.__S, m = window.__game.scene.getScene('Map'); const d = JSON.parse(S.SaveManager.snapshotString()); Object.assign(d.game.map, { id: 1, x: 18, y: 5, dir: 'up' }); d.game.realm = r;
      S.SaveManager.write(9, d); S.SaveManager.load(9); m.ready = false; await m.loadMap(S.$.map.id, S.$.map.x, S.$.map.y, S.$.map.dir || 'up'); m.ready = true; }, realm);
    await sleep(500); await mashUntil(page, idle, null, 30); await hookGate(); s = await st(page);
    ok(s.x === 18 && s.y === 5 && s.realm === realm, `D7 ${realm}: save at (18,5) loads there (at ${s.x},${s.y})`);
    s = await intoGate('ArrowUp');
    ok(await trig() === 1 && !(s.x === 18 && s.y === 5) && await freeNb() >= 2, `D7 ${realm}: Up from the (18,5) pocket -> out to (${s.x},${s.y})`);
    const s2 = await walkUntil(page, 'ArrowLeft', (q) => q.x <= s.x - 2, 2000); ok(s2.x <= s.x - 2 && !s2.busy, `D7 ${realm}: then walks away freely (at ${s2.x},${s2.y})`);
  }
  await page.evaluate(() => { localStorage.removeItem('lotfs.save.9'); window.__S.$.realm = 'near'; });
  await bgmCheck(page, 'map 1');
  // shrine return lands below the post, facing away; holding Down keeps walking (no bounce)
  await tp(page, 5, 11, 22, 'down'); await sleep(400);
  s = await walkUntil(page, 'ArrowDown', (q) => q.map === 1 && q.y >= 9, 7000);
  ok(s.map === 1 && s.y >= 8 && s.x === 18, `shrine door -> village (18,7) and walking on down (at ${s.map}:${s.x},${s.y})`);
  // 4. edge exits: walk off the edge, no button; arrivals face inward
  const EX = [[10, 1, 18, 'ArrowLeft', 1, 34, 16, 'left'], [10, 48, 18, 'ArrowRight', 111, 1, 12, 'right'], [111, 1, 12, 'ArrowLeft', 10, 48, 18, 'left'], [111, 44, 12, 'ArrowRight', 112, 1, 20, 'right'], [112, 1, 20, 'ArrowLeft', 111, 44, 12, 'left'], [113, 15, 24, 'ArrowDown', 10, 25, 2, 'down']];
  for (const [m0, x, y, key, m1, ax, ay, ad] of EX) {
    await tp(page, m0, x, y, key.slice(5).toLowerCase()); await sleep(300);
    await page.evaluate(() => { const S = window.__S; S.$.realm = 'near'; S.$.setSw?.('ch3_started', true); });
    s = await walkUntil(page, key, (q) => q.map === m1, 5000);
    ok(s.map === m1 && s.x === ax && s.y === ay && s.dir === ad, `edge exit ${m0}(${x},${y}) ${key} -> ${m1} (${ax},${ay}) facing ${ad}: got ${s.map} (${s.x},${s.y}) ${s.dir}`);
    await bgmCheck(page, `after exit to ${m1}`);
  }
  await page.screenshot({ path: `${SS}/05-edge-arrival.png` });
  // 5. well: walk into it (touch, no button) and back
  await page.evaluate(() => { window.__S.$.setSw('warden_done', true); });   // the well opens once the Warden falls
  await tp(page, 1, 5, 24, 'up'); await sleep(300);
  s = await walkUntil(page, 'ArrowUp', (q) => q.map === 4 || q.busy, 4000); await mashUntil(page, () => window.__S.$.map.id === 4 && !window.__game.scene.getScene('Map').transitioning, null, 25);
  s = await st(page); ok(s.map === 4, `well mouth is walk-in (got map ${s.map})`); await bgmCheck(page, 'map 4');
  // 6. chest by the moved jar opens on screen and stays open
  await tp(page, 4, 28, 15, 'up'); await sleep(300); await press(page, 'z'); await sleep(300);
  await mashUntil(page, () => !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy, null, 15);
  const fr = () => page.evaluate(() => { const m = window.__game.scene.getScene('Map'); const e = m.evs.find((v) => v.data.x === 28 && v.data.y === 14); return e?.char.spr.frame.name; });
  ok((await fr()) === 'chest_open', `well chest (28,14) reachable from (28,15) and shows chest_open (${await fr()})`);
  await page.screenshot({ path: `${SS}/06-chest-open.png` });
  await tp(page, 4, 28, 16, 'up'); await sleep(300); ok((await fr()) === 'chest_open', 'chest still open after reloading the map');
  // 8. small interior letterbox tinted
  await tp(page, 3, 7, 6, 'down'); await sleep(500);
  const bg = await page.evaluate(() => window.__game.scene.getScene('Map').cameras.main.backgroundColor.color.toString(16));
  ok(bg === '3b3643', `teahouse letterbox is wall colour (#${bg})`); await page.screenshot({ path: `${SS}/07-teahouse.png` });
  await tp(page, 2, 6, 5, 'down'); await sleep(500); await page.screenshot({ path: `${SS}/08-sachi.png` }); await bgmCheck(page, 'map 2 again');
  await tp(page, 1, 3, 4, 'down'); await sleep(500); await page.screenshot({ path: `${SS}/09-village-nw.png` });
  await tp(page, 4, 3, 4, 'down'); await sleep(500); await page.screenshot({ path: `${SS}/10-well.png` });
  // 7. Willow Hollow root path (32,21) -> Crossing (43,12) once wick_got
  await page.evaluate(() => { const $ = window.__S.$; ($.setSw ? $.setSw('wick_got', true) : ($.switches.wick_got = true)); });
  await tp(page, 112, 31, 21, 'right'); await sleep(300);
  const rb = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); const e = m.evs.find((v) => v.data.x === 32 && v.data.y === 21); return e && e.char.visible ? e.char.sheet : ''; });
  ok(rb === 'root_bridge_end', `root-bridge end shown at the Hollow exit once wick_got (${rb || 'hidden'})`); await page.screenshot({ path: `${SS}/11-root-bridge.png` });
  s = await walkUntil(page, 'ArrowRight', (q) => q.map === 111 || q.busy, 4000); await mashUntil(page, () => window.__S.$.map.id === 111 && !window.__game.scene.getScene('Map').transitioning, null, 25);
  s = await st(page); ok(s.map === 111 && s.x === 43 && s.y === 12, `root path -> Crossing (43,12) (got ${s.map} ${s.x},${s.y})`);
} catch (e) { ok(false, 'exception ' + e.message); await page.screenshot({ path: `${SS}/fail.png` }); }
const errs = errors.filter((e) => !e.includes('willReadFrequently') && !/AudioContext|autoplay/i.test(e)); ok(!errs.length, 'no console errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
await browser.close();
const f = res.filter((r) => !r[0]).length; console.log(f ? `FAIL ${f}/${res.length}` : `PASS playtest (${res.length} checks)`); process.exit(f ? 1 : 0);
