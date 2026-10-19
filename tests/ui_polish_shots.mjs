// UI polish (Ember style guide v1 §3.2) screenshot harness.
// usage: node tests/ui_polish_shots.mjs <baseUrl> <outPrefix>   e.g. node tests/ui_polish_shots.mjs http://127.0.0.1:8138/ shots/after
// Sentry ingest requests are blocked (route abort) so test runs never report to Sentry.
import { chromium } from 'playwright-core';
import { press, sleep, waitScene, newGame, mashUntil, teleport } from './lib.mjs';
import { waitInput, pick, state } from './bdrive.mjs';
const base = process.argv[2] || 'http://127.0.0.1:8138/'; const out = process.argv[3] || 'shots/after';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 816, height: 624 } });
const blocked = [];
await ctx.route(/sentry\.io|ingest\.sentry|sentry-cdn|\/envelope\//i, (r) => { blocked.push(r.request().url()); r.abort(); });
const page = await ctx.newPage(); const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('lotfs.settings', JSON.stringify({ walkSpeed: 'brisk', textSpeed: 3 })); } catch (e) {} });
await page.goto(base);
const shot = async (n) => { await sleep(350); await page.screenshot({ path: `${out}-${n}.png` }); console.log('shot', `${out}-${n}.png`); };
const result = {};
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.addActor('kaze'); $.addActor('daigo');
    for (const id of $.party) { const a = $.actors[id]; while (a.level < 3) $.gainExp(a, 20 * a.level); a.hp = $.param(a, 'mhp'); a.sp = $.param(a, 'msp'); }
    $.gain('charm_cord', 1); // unlocks 2nd charm slot -> 4 equipment rows
    $.actors.mio.equips.weapon = 'mio_w1';                                 // "Cedar Lantern-Staff" (the 70-status.png overlap)
    $.actors.daigo.equips.weapon = 'hundred_year_hammerhead';              // longest gear name (224 px @17)
    $.forged.hundred_year_hammerhead = 3;                                  // "+3" suffix forces the 13 px / ellipsis path
    $.actors.mio.equips.armor = 'far_shawl_3'; $.actors.mio.equips.acc = 'c_sachi_pin'; $.actors.mio.equips.acc2 = 'guardians_blessing'; });
  await sleep(400); await shot('map');
  // ---- Status screen (sub-screen over the map), Mio then Daigo
  const openMenu = async () => { await page.evaluate(() => { window.__game.scene.getScene('Map').openMenu(); }); await waitScene(page, 'Menu'); await sleep(500); };
  const menuItem = async (label) => { const idx = await page.evaluate((l) => window.__game.scene.getScene('Menu').cmd.items.findIndex((i) => i.label === l), label); const cur = await page.evaluate(() => window.__game.scene.getScene('Menu').cmd.index); for (let i = cur; i < idx; i++) await press(page, 'ArrowDown', 40); await press(page, 'Enter'); await sleep(350); };
  await openMenu(); await menuItem('Status'); await press(page, 'Enter'); await sleep(400); await shot('status-mio');
  await press(page, 'ArrowRight'); await press(page, 'ArrowRight'); await sleep(300); await shot('status-daigo-long-name');
  result.status = await page.evaluate(() => { const m = window.__game.scene.getScene('Menu'); const panel = m.wins[m.wins.length - 1]; const T = panel.content.list.filter((o) => o.type === 'Text').map((t) => ({ s: t.text, x: Math.round(t.x), y: Math.round(t.y), w: Math.round(t.width), h: Math.round(t.height), fs: t.style.fontSize })); return { partyVisible: m.party.visible, equip: T.filter((t) => t.x >= 260 && t.y >= 150 && t.y < 400) }; });
  await press(page, 'Escape'); await sleep(300);
  await menuItem('Quests'); await sleep(300); await shot('quests'); result.questsPartyVisible = await page.evaluate(() => window.__game.scene.getScene('Menu').party.visible);
  await press(page, 'Escape'); await sleep(300); result.menuPartyVisibleAfter = await page.evaluate(() => window.__game.scene.getScene('Menu').party.visible); await shot('menu-after-close');
  await press(page, 'Escape'); await sleep(600);
try {
  // map toast: same fitBlock helper
  const ok = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); if (!m?.msg) return false; m.msg.toast('A very long toast: Far Shore: Lumen drains here. Press Q again to return (free). Lantern Posts restore HP, SP and Lumen; the paper crane folds you out of the dark when a dungeon gets too deep.', 6000, 14, '#bff6ff'); return true; });
  if (ok) { await sleep(400); result.toast = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); const w = m.msg.toasts[0]; return w ? { x: w.x, w: w.w, h: w.h } : null; }); await shot('map-toast-long'); }
} catch (e) { console.log('toast step failed', e.message); }
await sleep(6600);
  // ---- Battle: Straw Warden (boss) -> Lumen meter + turn-2 tutorial line
  await page.evaluate(() => { const $ = window.__S.$; $.party = ['mio', 'kaze']; $.lumen = 60; for (const id of $.party) { const a = $.actors[id]; a.hp = $.param(a, 'mhp'); } });
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); window.__bp = m.startBattle('boss_straw_warden', { boss: true, noEscape: true }); });
  await waitScene(page, 'Battle', 15000);
  let s = await waitInput(page, 30000); await shot('battle-hud');
  result.hud = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); const r = (w) => [w.x, w.y, w.w, w.h]; return { realm: r(b.realmWin), order: r(b.orderWin), echo: r(b.echoWin), log: r(b.logWin) }; });
  // round 1: Fight -> Guard x2; the shift_hint tutorial fires at the start of turn 2
  let caught = false;
  for (let round = 0; round < 3 && !caught; round++) {
    s = await waitInput(page, 40000); if (s.labels.includes('Fight')) await pick(page, 'Fight');
    for (let k = 0; k < 2; k++) { s = await waitInput(page, 40000); if (s.ended) break; if (s.labels.includes('Guard')) await pick(page, 'Guard'); }
    const t0 = Date.now(); while (Date.now() - t0 < 25000) { const lg = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); const t = b.logWin.content.list.find((o) => o.type === 'Text'); return b.logWin.visible && t ? { s: t.text, lines: t.getWrappedText ? t.getWrappedText(t.text).length : -1, w: t.width, h: t.height, x: t.x, wh: b.logWin.h } : null; });
      if (lg && /^Hint: Mio can Shift/.test(lg.s)) { result.tutorial = lg; await sleep(150); await shot('warden-tutorial'); caught = true; break; }
      const st = await state(page); if (st && st.win !== 'none') break; await sleep(60); }
  }
  // generic renderer stress: a 3-line message and an over-long unbroken word through the same battle log renderer
  const LONG = 'Stress test: the battle log must stay inside its window for any message, including a translated tutorial line that is far longer than the English one and an unbroken token like Supercalifragilisticexpialidocious-Lantern-Keeper-Of-The-Far-Shore.';
  await page.evaluate((s) => { window.__game.scene.getScene('Battle').log(s, 4000); }, LONG); await sleep(250);
  result.stress = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); const t = b.logWin.content.list.find((o) => o.type === 'Text'); return { winH: b.logWin.h, w: Math.round(t.width), h: Math.round(t.height), y: t.y, fs: t.style.fontSize }; });
  await shot('battle-log-stress');
  // toast renderer (map) with a very long line, drawn in the Battle scene's message-less context is not possible -> done via Map scene below
  result.errors = errors.slice(0, 8);
} catch (e) { console.log('FAIL', e.message, errors.slice(0, 8)); await page.screenshot({ path: `${out}-fail.png` }); }
result.blockedSentry = blocked.length;
console.log(JSON.stringify(result, null, 1));
await browser.close();
