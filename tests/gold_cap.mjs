// Gold cap (999,999) and Lumen bounds. Gold is clamped to [0, 999999] by GameState's own accessor, so every path
// (battle rewards, shop sales, quest/event gold, save load) is clamped; old saves load (and over-cap values clamp).
// UI: the gold readout in the menu and the shop fits its window at 999,999 on both shores; screenshots go to SHOTS.
import fs from 'fs';
import { launch, sleep, newGame, mashUntil, teleport, waitScene, press } from './lib.mjs';
const SHOTS = process.env.SHOTS || '/workspace/lantern-night/screenshots/hidden_elixirs/gold_cap'; fs.mkdirSync(SHOTS, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; return c; };
const { browser, page, errors } = await launch(process.env.BASE || process.argv[2]);
const shot = (n) => page.screenshot({ path: `${SHOTS}/${n}.png` });
const G = () => page.evaluate(() => window.__S.$.gold);
// every Text showing "999,999" in the scene lies inside its Win
const fits = (key) => page.evaluate((key) => { const s = window.__game.scene.getScene(key); const out = [];
  const walk = (o, win) => { if (o.w && o.h && o.content) win = o; if (o.type === 'Text' && /999,999/.test(o.text) && o.visible) { const b = o.getBounds(); out.push({ t: o.text, l: b.left, r: b.right, top: b.top, bot: b.bottom, wl: win?.x, wr: win ? win.x + win.w : null, wt: win?.y, wb: win ? win.y + win.h : null }); } for (const c of o.list || []) walk(c, win); };
  for (const c of s.children.list) walk(c, null); return out; }, key);
const checkFit = async (key, label) => { const r = await fits(key); ok(r.length >= 1 && r.every((t) => t.wl != null && t.l >= t.wl + 4 && t.r <= t.wr - 4 && t.top >= t.wt && t.bot <= t.wb), `${label}: "999,999" fits inside its window ${JSON.stringify(r)}`); };
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80); await sleep(500);
  // ---- clamp rules
  const r = await page.evaluate(() => { const { $ } = window.__S; const o = {}; $.gold = 5e6; o.big = $.gold; $.gold = -50; o.neg = $.gold; $.gold = NaN; o.nan = $.gold; $.gold = 12.9; o.frac = $.gold;
    $.gold = 999990; $.gold += 100; o.add = $.gold; $.gold += 1; o.again = $.gold; $.gold -= 3000; o.spend = $.gold; $.gold = 999999; $.gold += Number.MAX_SAFE_INTEGER; o.huge = $.gold; o.json = JSON.parse(JSON.stringify($.toJSON())).gold; return o; });
  ok(r.big === 999999 && r.add === 999999 && r.again === 999999 && r.huge === 999999, 'gold clamps at 999,999 (set, +=, repeated, huge add) ' + JSON.stringify(r));
  ok(r.neg === 0 && r.nan === 0 && r.frac === 12, 'gold never negative / NaN / fractional');
  ok(r.spend === 996999 && r.json === 999999, 'spending from the cap works; gold serializes as a plain number');
  // event 'gold' command (quest rewards, chests)
  const ev = await page.evaluate(async () => { const { $ } = window.__S; const m = window.__game.scene.getScene('Map'); $.gold = 999500; await m.interp.run([{ c: 'gold', n: 5000, quiet: true }], { mapId: 1, eventId: 0 }); return $.gold; }).catch((e) => 'err ' + e.message);
  ok(ev === 999999, 'event gold reward clamps at 999,999 (' + ev + ')');
  // real battle reward at 999,990
  await page.evaluate(() => { const { $, Settings } = window.__S; Settings.data.autoBattle = true; Settings.data.battleSpeed = 2; Settings.save(); $.gold = 999998; $.realm = 'near'; $.healAll(); for (const a of Object.values($.actors)) { while (a.level < 8) $.gainExp(a, 999); a.hp = $.param(a, 'mhp'); } window.__done = null; window.__game.scene.getScene('Map').startBattle('tr_dust_wisp', { random: true, zone: 'z02' }).then((x) => (window.__done = x)); });
  await waitScene(page, 'Battle', 15000);
  for (let t = 0; t < 200 && !(await page.evaluate(() => window.__done)); t++) { await press(page, 'Enter', 40); await sleep(200); }
  const br = await page.evaluate(() => ({ res: window.__done, gold: window.__S.$.gold })); ok(br.res === 'win' && br.gold === 999999, 'battle gold reward clamps at 999,999 ' + JSON.stringify(br));
  await sleep(800);
  // ---- UI at 999,999 on both shores: menu, shop, battle
  for (const realm of ['near', 'far']) {
    await page.evaluate((realm) => { const { $ } = window.__S; $.gold = 999999; $.realm = realm; $.lumenMax = 90; $.lumen = 90; window.__game.scene.getScene('Map').applyRealmVisuals(); }, realm); await sleep(400);
    await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(600); await checkFit('Menu', `menu (${realm})`); await shot(`${realm}_1_menu_999999`);
    for (let k = 0; k < 6 && await page.evaluate(() => window.__game.scene.isActive('Menu')); k++) { await press(page, 'Escape'); await sleep(350); }
    await page.evaluate(() => { window.__game.scene.getScene('Map').openShop({ items: ['onigiri', 'honey'], name: 'Test Shop' }); }); await waitScene(page, 'Shop', 10000); await sleep(700);
    await checkFit('Shop', `shop (${realm})`); await shot(`${realm}_2_shop_999999`);
    for (let k = 0; k < 8 && await page.evaluate(() => window.__game.scene.isActive('Shop')); k++) { await press(page, 'Escape'); await sleep(350); }
    await sleep(400);
  }
  // shop sale at the cap: gold stays at 999,999 (never overflows)
  const sale = await page.evaluate(() => { const { $ } = window.__S; $.gold = 999999; $.gain('honey', 1); $.gain('honey', -1); $.gold += Math.floor((window.__S.DB.items.honey.price || 0) / 2); return $.gold; }); ok(sale === 999999, 'shop sale at the cap stays 999,999');
  // ---- save at 999,999 -> reload -> load
  await page.evaluate(() => { const { $ } = window.__S; $.gold = 999999; $.realm = 'near'; window.__game.scene.getScene('Map').applyRealmVisuals(); window.__game.scene.getScene('Map').openSave(); return 0; }); await waitScene(page, 'SaveLoad'); await sleep(700); await shot('near_3_save_screen_999999');
  const sv = await page.evaluate(() => { const { SaveManager } = window.__S; const r = SaveManager.save(3); const raw = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => /3$/.test(k) && localStorage.getItem(k).includes('"game"')))); return { r, gold: raw.game.gold }; });
  ok(sv.gold === 999999, 'slot 3 saved with gold 999999 ' + JSON.stringify(sv));
  // old-format saves: one over the cap, one with no gold field
  await page.evaluate(() => { const k = Object.keys(localStorage).find((k) => /3$/.test(k) && localStorage.getItem(k).includes('"game"')); const d = JSON.parse(localStorage.getItem(k));
    const a = JSON.parse(JSON.stringify(d)); a.game.gold = 2500000; localStorage.setItem(k.replace(/3$/, '4'), JSON.stringify(a)); const b = JSON.parse(JSON.stringify(d)); delete b.game.gold; delete b.game.ver; localStorage.setItem(k.replace(/3$/, '5'), JSON.stringify(b)); });
  await page.reload(); await waitScene(page, 'Title', 30000); await sleep(800);
  const loads = []; for (const slot of [3, 4, 5]) { await page.evaluate((s) => { window.__game.scene.getScenes(true).forEach((x) => window.__game.scene.stop(x.sys.settings.key)); window.__S.SaveManager.load(s); window.__game.scene.start('Map', { mode: 'load' }); }, slot); await waitScene(page, 'Map', 20000); await sleep(900); loads.push(await G()); }
  ok(loads[0] === 999999, 'save at 999,999 loads back at 999,999 (' + loads[0] + ')');
  ok(loads[1] === 999999, 'old save over the cap (2,500,000) loads clamped to 999,999 (' + loads[1] + ')');
  ok(loads[2] === 0, 'old save without a gold field still loads (gold 0) (' + loads[2] + ')');
  await page.evaluate((s) => { window.__game.scene.getScenes(true).forEach((x) => window.__game.scene.stop(x.sys.settings.key)); window.__S.SaveManager.load(s); window.__game.scene.start('Map', { mode: 'load' }); }, 3); await waitScene(page, 'Map', 20000); await sleep(900);
  await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(600); await checkFit('Menu', 'menu after loading the 999,999 save'); await shot('near_4_loaded_save_menu_999999');
  for (let k = 0; k < 6 && await page.evaluate(() => window.__game.scene.isActive('Menu')); k++) { await press(page, 'Escape'); await sleep(350); }
  // ---- Lumen stays a bounded gauge; the Spirit Elixir still fills it at the highest Lantern (90)
  const lu = await page.evaluate(() => { const { $, Field } = window.__S; $.lumenMax = 90; $.lumen = 3; $.gain('spirit_elixir', 1); const res = Field.useItemGlobal('spirit_elixir'); const o = { res, lumen: $.lumen, max: $.lumenMax, left: $.items.spirit_elixir || 0 }; $.lumen = 999999; return o; });
  ok(lu.res?.ok && lu.lumen === 90 && lu.left === 0, 'Spirit Elixir fills Lumen 3 -> 90 at Max Lumen 90 ' + JSON.stringify(lu));
  { const bad = errors.filter((e) => !/willReadFrequently/.test(e)); ok(bad.length === 0, 'no page errors ' + JSON.stringify(bad.slice(0, 3))); }
} catch (e) { console.log('FAIL exception ' + e.stack + ' errors=' + JSON.stringify(errors.slice(-5))); fails++; }
await browser.close(); console.log(fails ? `GOLD_CAP ${fails} FAIL` : 'GOLD_CAP ALL PASS'); process.exit(fails ? 1 : 0);
