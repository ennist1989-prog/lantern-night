// Headless checks + screenshots for the design-items PRs (Sentry blocked). usage: node tests/design_shots.mjs <baseUrl> <scenario...>
// Scenarios register themselves in SC below; each prints a JSON result line. Ends with page/console error + HTTP>=400 summary.
import { chromium } from 'playwright-core';
import { sleep, waitScene, newGame, mashUntil, teleport } from './lib.mjs';
const base = process.argv[2] || 'http://127.0.0.1:8150/'; const want = process.argv.slice(3); const OUT = process.env.OUT || 'shots';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 816, height: 624 } }); let blocked = 0;
await ctx.route(/sentry\.io|ingest\.sentry|sentry-cdn|\/envelope\//i, (r) => { blocked++; r.abort(); });
const page = await ctx.newPage(); const errors = [], bad = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('lotfs.settings', JSON.stringify({ walkSpeed: 'brisk', textSpeed: 3 })); } catch (e) {} });
const press = async (k, ms = 70) => { await page.keyboard.down(k); await sleep(ms); await page.keyboard.up(k); await sleep(50); };
const texts = (key) => page.evaluate((key) => { const sc = window.__game.scene.getScene(key); const out = []; const walk = (o) => { if (!o || o.visible === false) return; if (o.type === 'Text' && o.text) out.push(o.text); (o.list || []).forEach(walk); }; sc?.children.list.forEach(walk); return out; }, key);
const scenes = () => page.evaluate(() => window.__game.scene.getScenes(true).map((s) => s.sys.settings.key));
const st = () => page.evaluate(() => { const $ = window.__S.$; const m = window.__game.scene.getScene('Map'); return { map: $.map?.id ?? $.map, realm: $.realm, party: $.party, msg: !!m?.msg?.busy, busy: !!m?.interp?.busy, sw: Object.keys($.switches).filter((k) => $.switches[k]) }; });
const shot = async (n) => { const p = `${OUT}/${n}.png`; await page.screenshot({ path: p }); return p; };
/** Advance dialogue until pred() is true (or max presses); collects message texts. */
async function talkUntil(pred, max = 80, key = 'Enter') { const seen = []; for (let i = 0; i < max; i++) { if (await page.evaluate(pred)) return seen; const t = (await texts('Map')).join(' | '); if (t && seen[seen.length - 1] !== t) seen.push(t.slice(0, 220)); await press(key, 50); await sleep(110); } return seen; }
export const H = { page, press, texts, scenes, st, shot, talkUntil, sleep, waitScene, teleport };
const SC = {};
// ---- E6: charm3 only from sq04 (not the shop, not the Well chest)
SC.charm3 = async () => {
  await page.evaluate(() => { const $ = window.__S.$; $.chapter = 2; $.gold = 5000; });
  const items = await page.evaluate(async () => { const m = window.__game.scene.getScene('Map'); const { DB } = window.__S; const d = await (await fetch('data/maps/map003.json')).json(); let found = null; const walk = (l) => { for (const c of l || []) { if (!c || typeof c !== 'object') continue; if (Array.isArray(c)) { walk(c); continue; } if (c.c === 'shop') found = c; for (const v of Object.values(c)) if (Array.isArray(v)) walk(v); } }; for (const e of d.events) for (const p of e.pages) walk(p.list); window.__shopP = m.openShop(found); return found.items; });
  await waitScene(page, 'Shop', 8000); await sleep(600); await press('Enter'); await sleep(600); const shopTexts = await texts('Shop'); const p1 = await shot('e6-shop-ch2');
  for (let i = 0; i < 6 && (await scenes()).includes('Shop'); i++) { await press('Escape'); await sleep(400); }
  await page.evaluate(() => window.__shopP); await sleep(400); if ((await scenes()).includes('Menu')) { await press('Escape'); await sleep(400); }
  await teleport(page, 4, 3, 9, 'up'); await sleep(500); const before = await page.evaluate(() => ({ ...window.__S.$.items }));
  await press('Enter'); await sleep(900); const p2 = await shot('e6-well-chest'); await talkUntil(() => !window.__game.scene.getScene('Map').msg.busy, 10);
  const after = await page.evaluate(() => ({ ...window.__S.$.items }));
  const gained = Object.fromEntries(Object.keys(after).filter((k) => (after[k] || 0) > (before[k] || 0)).map((k) => [k, after[k] - (before[k] || 0)]));
  const sq = await page.evaluate(() => window.__S.DB.sidequests.quests.sq04.reward.items);
  return { shopHasCharm3: items.includes('charm3'), shopListShowsBellCharm: shopTexts.some((t) => /Bell Charm/.test(t)), wellChestGained: gained, sq04Reward: sq, shots: [p1, p2] };
};
// ---- Bell-Keeper L5 retune: the live boss uses the patched stats (fight starts, no errors)
SC.bk = async () => {
  await teleport(page, 6, 8, 6, 'up'); await page.evaluate(() => { const $ = window.__S.$; for (const id of ['mio', 'kaze']) { if (!$.party.includes(id)) $.addActor(id); } });
  await page.evaluate(() => { window.__bkP = window.__game.scene.getScene('Map').startBattle('boss_bell_keeper', { boss: true, noEscape: true }); });
  await waitScene(page, 'Battle', 10000); await sleep(3500); const p = await shot('bk-l5-retune');
  const foe = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle').B; const f = B.foes.find((x) => x.boss); return { name: f.name, mhp: f.mhp, atk: f.base.atk, specAtk: window.__S.SPEC.bosses.bell_keeper.stats.atk }; });
  return { foe, shots: [p] };
};
// ---- Well Spirit Parley battle: every outcome returns control; only win/Send grants the key
const wsSetup = async () => {
  await teleport(page, 4, 24, 15, 'right'); await page.evaluate(() => { const $ = window.__S.$; $.setSw('kaze_joined', true); $.setSw('daigo_joined', true); $.setSw('key_got', false); delete $.items.shrine_key; if (!$.party.includes('kaze')) $.addActor('kaze'); window.__game.scene.getScene('Map').refreshEvents(); });
  await sleep(300); await page.keyboard.down('ArrowRight'); await sleep(260); await page.keyboard.up('ArrowRight');
  const seen = await talkUntil(() => window.__game.scene.getScenes(true).some((s) => s.sys.settings.key === 'Battle'), 40); await sleep(2500); return seen;
};
const B_ = (fn) => page.evaluate(fn);
const wsAfter = async (max = 120, snapRe = null, snapName = '') => { const seen = []; let snapped = null; for (let i = 0; i < max; i++) { const s = await st(); if (!(await scenes()).includes('Battle') && !s.busy && !s.msg) break; const t = (await texts('Map')).join(' | '); if (t && seen[seen.length - 1] !== t) seen.push(t.slice(0, 160)); if (snapRe && !snapped && snapRe.test(t)) snapped = await shot(snapName); await press('Enter', 50); await sleep(150); } await sleep(400);
  const r = await page.evaluate(() => { const $ = window.__S.$; const m = window.__game.scene.getScene('Map'); return { key: !!$.items.shrine_key, key_got: $.sw('key_got'), peaceful: $.v('battle_peaceful'), result: $.v('battle_result'), pos: [m.player.tx, m.player.ty], busy: !!m.interp.busy, quest: $.questStage('main') }; }); return { ...r, seen, snapped }; };
const mioFoe = () => B_(() => { const B = window.__game.scene.getScene('Battle').B; return { foe: B.foes[0].name, mhp: B.foes[0].mhp, temper: B.foes[0].temper }; });
SC.well_calm = async () => { const intro = await wsSetup(); const foe = await mioFoe(); const p1 = await shot('wellspirit-battle');
  const calm = await B_(() => { const B = window.__game.scene.getScene('Battle').B; const m = B.party.find((p) => p.actorId === 'mio'); const f = B.foes[0]; const ev = []; B.parleyVerb(m, f, 'remember', ev); const a = f.calm; B.parleyVerb(m, f, 'remember', ev); const b = f.calm; const orig = B.act.bind(B); B.act = (x) => { if (x.side === 'party') x.action = x.actorId === 'mio' && f.calm ? { type: 'skill', skill: 'mio_send', targets: [f.uid] } : { type: 'guard' }; return orig(x); }; return { calmAfter1: a, calmAfter2: b, mood: f.mood }; });
  const r = await wsAfter(120, /old lantern song|still burns/, 'wellspirit-calm-song'); const p2 = r.snapped; const p3 = await shot('wellspirit-calm-after'); return { intro: intro.slice(-3), foe, calm, ...r, shots: [p1, p2, p3] }; };
SC.well_fight = async () => { await wsSetup(); await B_(() => { const B = window.__game.scene.getScene('Battle').B; B.foes[0].hp = 1; }); const r = await wsAfter(); const p = await shot('wellspirit-fight-after'); return { ...r, shots: [p] }; };
SC.well_flee = async () => { await wsSetup(); await B_(() => { const B = window.__game.scene.getScene('Battle').B; B.tryFlee = function () { this.ended = 'escape'; return { ok: true, ev: [] }; }; });
  await press('ArrowDown'); await sleep(200); await press('Enter'); await sleep(2500); const r = await wsAfter(40); const p = await shot('wellspirit-flee-after');
  // re-touch: the spirit is still there
  await page.keyboard.down('ArrowRight'); await sleep(260); await page.keyboard.up('ArrowRight'); await talkUntil(() => window.__game.scene.getScenes(true).some((s) => s.sys.settings.key === 'Battle'), 40); const again = (await scenes()).includes('Battle');
  if (again) { await sleep(2500); await B_(() => { window.__game.scene.getScene('Battle').B.foes[0].hp = 1; }); } const r2 = await wsAfter(); return { afterFlee: r, retouchStartsBattle: again, afterRetry: r2, shots: [p] }; };
SC.well_lose = async () => { await wsSetup(); await B_(() => { const B = window.__game.scene.getScene('Battle').B; for (const p of B.party) p.hp = 1; B.foes[0].base.atk = 999; B.foes[0].base.mat = 999; });
  const seen = []; for (let i = 0; i < 120 && !(await texts('Map')).some((t) => /Retry the fight/.test(t)); i++) { await press('Enter', 50); await sleep(150); } const p1 = await shot('wellspirit-lose-retry');
  const offered = (await texts('Map')).some((t) => /Retry the fight/.test(t)); await press('Enter'); await sleep(3000); const r = await wsAfter(20);
  await page.keyboard.down('ArrowLeft'); await sleep(260); await page.keyboard.up('ArrowLeft'); await sleep(400); await page.keyboard.down('ArrowRight'); await sleep(260); await page.keyboard.up('ArrowRight');
  await talkUntil(() => window.__game.scene.getScenes(true).some((s) => s.sys.settings.key === 'Battle'), 40); const again = (await scenes()).includes('Battle'); if (again) { await sleep(2500); await B_(() => { window.__game.scene.getScene('Battle').B.foes[0].hp = 1; }); }
  const r2 = await wsAfter(); return { retryOffered: offered, afterRetry: r, retouchStartsBattle: again, final: r2, seen, shots: [p1] }; };
// ---- C3: Shift = dash only; holding it must not advance/skip dialogue. Text fast-forward is hold F/Ctrl.
SC.shift_talk = async () => {
  const keys = (k) => page.evaluate(() => { const I = window.__S.Input; return { dash: I.isDown('dash'), skip: I.isDown('skip'), shift: I.isDown('shift'), ok: I.isDown('ok') }; });
  const run = () => page.evaluate(() => { const m = window.__game.scene.getScene('Map'); window.__tk = { done: false }; m.interp.run([{ c: 'msg', name: 'Mio', text: 'Line one. Holding Shift must not skip this.' }, { c: 'msg', name: 'Mio', text: 'Line two.' }]).then(() => { window.__tk.done = true; }); });
  const line = async () => (await texts('Map')).find((t) => /Line (one|two)/.test(t)) || null;
  await page.keyboard.down('ShiftLeft'); await sleep(200); const shiftKeys = await keys();
  await run(); await sleep(2500); const shiftAfter = { line: await line(), done: await page.evaluate(() => window.__tk.done), busy: (await st()).msg }; const p1 = await shot('c3-shift-held-dialogue');
  await page.keyboard.up('ShiftLeft'); await sleep(150);
  await page.keyboard.down('ControlLeft'); await sleep(150); const ctrlKeys = await keys(); await sleep(1800); const ctrlAfter = { done: await page.evaluate(() => window.__tk.done), busy: (await st()).msg }; await page.keyboard.up('ControlLeft'); await sleep(300);
  await run(); await sleep(400); await page.keyboard.down('KeyF'); await sleep(1800); const fAfter = { done: await page.evaluate(() => window.__tk.done) }; await page.keyboard.up('KeyF'); await sleep(300);
  await run(); await sleep(300); let presses = 0; while (!(await page.evaluate(() => window.__tk.done)) && presses < 10) { await press('Enter'); presses++; await sleep(250); }
  // dash still works on the field: Shift held -> faster move duration
  const dur = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return { walk: m.moveDur(false), dash: m.moveDur(true) }; });
  await page.keyboard.down('ShiftLeft'); await sleep(100); const dashKey = await keys(); await page.keyboard.up('ShiftLeft');
  // realm Shift is still Q/Tab, not the Shift key
  await page.keyboard.down('KeyQ'); await sleep(60); const q = await keys(); await page.keyboard.up('KeyQ'); await sleep(200);
  const tut = await page.evaluate(async () => { const d = await (await fetch('data/maps/map002.json')).json(); return JSON.stringify(d).match(/Move: Arrows[^"]*/)?.[0] || null; });
  return { shiftKeys, shiftAfter, ctrlKeys, ctrlAfter, fAfter, enterPresses: presses, dur, dashKey, q, tutorial: tut, shots: [p1] };
};
// ---- Lantern Warmth offer after the FIRST boss loss, and it survives the checkpoint Retry.
SC.warmth = async () => {
  await teleport(page, 6, 8, 6, 'up'); await page.evaluate(() => { const $ = window.__S.$; for (const id of ['mio', 'kaze']) { if (!$.party.includes(id)) $.addActor(id); } $.bossLosses = {}; });
  const fight = () => page.evaluate(() => { const m = window.__game.scene.getScene('Map'); m.interp.run([{ c: 'checkpoint', boss: true }, { c: 'battle', troop: 'boss_bell_keeper', boss: true, noEscape: true }]); });
  const btxt = () => texts('Battle').catch(() => []);
  const offerShown = async (ms) => { for (let i = 0; i < ms / 250; i++) { const t = (await btxt()).join(' | '); if (/Would you like a little help/.test(t)) return t.match(/The Lantern flickers[^|]*/)?.[0] || true; if (/Attack|Fight/.test(t) && i > 8) return false; await sleep(250); } return false; };
  await fight(); await waitScene(page, 'Battle', 15000); const first = await offerShown(9000);
  // lose for real: wipe the party, then let the scene's own end check run the defeat path (counts the loss, returns 'lose' to the event)
  await sleep(800); await page.evaluate(() => { const sc = window.__game.scene.getScene('Battle'); for (const p of sc.B.party) p.hp = 0; sc.endCheck(); });
  for (let i = 0; i < 160 && !(await texts('Map')).some((t) => /Retry the fight/.test(t)); i++) { await press('Enter', 50); await sleep(150); }
  const lossesAtDefeat = await page.evaluate(() => ({ ...window.__S.$.bossLosses }));
  const retryOffered = (await texts('Map')).some((t) => /Retry the fight/.test(t)); await press('Enter'); await sleep(3500);
  const lossesAfterRetry = await page.evaluate(() => ({ ...window.__S.$.bossLosses }));
  for (let i = 0; i < 20 && (await st()).busy; i++) await sleep(250);
  await fight(); await waitScene(page, 'Battle', 15000); const second = await offerShown(12000); const p1 = await shot('warmth-offer-after-first-loss');
  let warmth = null; if (second) { await press('ArrowDown'); await sleep(200); await press('Enter'); await sleep(2200); warmth = await page.evaluate(() => { const sc = window.__game.scene.getScene('Battle'); return { ctxWarmth: sc.B.ctx.warmth, warmBoost: sc.warmBoost }; }); }
  const p2 = await shot('warmth-accepted');
  return { firstFightOffer: first, retryOffered, lossesAtDefeat, lossesAfterRetry, secondFightOffer: second, warmth, shots: [p1, p2] };
};
export function register(name, fn) { SC[name] = fn; }
const extra = process.env.EXTRA; if (extra) await import(extra);
await page.goto(base); await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').interp.busy, null, 120);
for (const n of want) { try { const r = await SC[n](); console.log(JSON.stringify({ scenario: n, ...r })); } catch (e) { console.log(JSON.stringify({ scenario: n, FAIL: e.message })); await shot(`fail-${n}`); } }
console.log(JSON.stringify({ pageErrors: errors.slice(0, 10), http: bad.slice(0, 10), blockedSentry: blocked }));
await browser.close();
