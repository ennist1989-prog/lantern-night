// Cursor sweep: screenshot every selectable screen; verifies shared heartbeat cursor is drawn (pixel check on title at first load)
import { launch, press, sleep, newGame, mashUntil, waitScene, teleport, SSDIR } from './lib.mjs';
import { execSync } from 'child_process';
const SS = SSDIR + '/cursor'; execSync('mkdir -p ' + SS);
const { browser, page, errors } = await launch();
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const shot = (n) => page.screenshot({ path: `${SS}/${n}.png` });
const back = async () => { await press(page, 'Escape'); await sleep(350); };
const cursorOn = (key, field) => page.evaluate(([key, field]) => { const sc = window.__game.scene.getScene(key); const w = field.split('.').reduce((o, k) => o?.[k], sc); return !!w && w.cursorG && w.cursorG.active && w.cursorG.commandBuffer?.length > 0; }, [key, field]);
try {
  await waitScene(page, 'Title', 30000); await sleep(900); await shot('01-title-first-load');
  ok(await cursorOn('Title', 'menu'), 'title cursor drawn at first load (no input)');
  // pulse frames
  await sleep(230); await shot('01b-title-pulse-a'); await sleep(300); await shot('01c-title-pulse-b');
  await press(page, 'ArrowDown'); await sleep(250); await shot('02-title-moved');
  // options from title (go to Options row)
  const idx = await page.evaluate(() => window.__game.scene.getScene('Title').menu.index); for (let k = idx; k < 2; k++) await press(page, 'ArrowDown'); await press(page, 'Enter'); await sleep(500); await shot('03-title-options');
  // juice off -> static
  await page.evaluate(() => { window.__S.Settings.data.juice = 'off'; }); await sleep(300); await shot('03b-options-juice-off'); await page.evaluate(() => { window.__S.Settings.data.juice = 'full'; });
  await press(page, 'x'); await sleep(400);
  { const ci = await page.evaluate(() => window.__game.scene.getScene('Title').menu.index); for (let k = 0; k < ci; k++) await press(page, 'ArrowUp', 40); await sleep(200); }
  await press(page, 'Enter'); await waitScene(page, 'Map', 15000); await sleep(500);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const { $ } = window.__S; $.repel = 99999; $.buffs.stealth = 99999; $.setSw('post_lit', true); $.setSw('kaze_joined', true); $.addActor('kaze'); $.gold = 500; for (const [k, n] of Object.entries({ honey: 3, herbal_tea: 2, charm1: 1, mio_w2: 1, smith_tongs: 1, collectors_book: 1, elder_seal: 1, lantern_oil: 2, mochi: 2 })) $.gain(k, n); for (const id of $.party) { const a = $.actors[id]; while (a.level < 5) $.gainExp(a, 20 * a.level); } });
  // choice box
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); window.__c = m.interp.run([{ c: 'choice', opts: ['Yes', 'No', 'Maybe'], br: [[], [], []] }], {}); }); await sleep(700); await shot('04-choice'); await press(page, 'Enter'); await sleep(400);
  // menu + subscreens
  await press(page, 'Escape'); await waitScene(page, 'Menu', 5000); await sleep(400); await shot('05-menu');
  ok(await cursorOn('Menu', 'cmd'), 'main menu cursor drawn');
  const L = await page.evaluate(() => window.__game.scene.getScene('Menu').cmd.items.map((i) => i.label));
  const pick = async (label) => { const i = L.indexOf(label); const cur = await page.evaluate(() => window.__game.scene.getScene('Menu').cmd.index); for (let k = cur; k < i; k++) await press(page, 'ArrowDown', 40); for (let k = cur; k > i; k--) await press(page, 'ArrowUp', 40); await press(page, 'Enter'); await sleep(450); };
  const screens = [['Item', 1], ['Skill', 2], ['Equip', 2], ['Status', 2], ['Formation', 2], ['Quests', 1], ['Key Items', 1], ['Forge', 1], ['Bonds', 1], ['Bestiary', 1], ['Notes', 1], ['Options', 1], ['Save', 1]];
  let n = 6;
  const menuState = () => page.evaluate(() => { const on = window.__game.scene.getScenes(true).some((x) => x.sys.settings.key === 'Menu'); return on ? (window.__game.scene.getScene('Menu').cmd.active ? 'cmd' : 'sub') : 'map'; });
  const toCmd = async () => { for (let k = 0; k < 8; k++) { const st = await menuState(); if (st === 'cmd') return; if (st === 'map') { await press(page, 'Escape'); await waitScene(page, 'Menu', 5000); await sleep(400); continue; } await press(page, 'x'); await sleep(350); } };
  for (const [s, depth] of screens) { if (!L.includes(s)) { console.log('skip', s); continue; } await toCmd(); await pick(s); const nm = String(n++).padStart(2, '0') + '-' + s.toLowerCase().replace(/ /g, ''); await shot(nm); if (depth > 1) { await press(page, 'Enter'); await sleep(400); await shot(nm + '-2'); } }
  await toCmd(); await pick('Game End'); await shot(String(n++) + '-gameend'); await toCmd(); await press(page, 'x'); await sleep(500);
  for (let k = 0; k < 4 && (await menuState()) !== 'map'; k++) { await press(page, 'x'); await sleep(400); }
  // shop
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); window.__c = m.interp.run([{ c: 'shop', items: ['rice_ball', 'honey', 'mio_w2', 'charm3'], name: 'Tama', face: 'woman' }], {}); }); await sleep(800); await shot('30-shop'); await press(page, 'Enter'); await sleep(400); await shot('31-shop-buy');
  for (let k = 0; k < 8; k++) { const act = await page.evaluate(() => window.__game.scene.getScenes(true).map((x) => x.sys.settings.key)); if (!act.includes('Shop') && !act.includes('Menu')) break; await press(page, 'x'); await sleep(400); }
  await sleep(600);
  // battle: commands, skill list, targets
  await page.evaluate(() => { window.__S.$.realm = 'far'; window.__bp = window.__game.scene.getScene('Map').startBattle('tr_dust_wisp_dust_wisp', { random: true, zone: 'z01' }); });
  // wait for the actual command windows instead of fixed sleeps (the battle intro is slower on a loaded box / CI with software GL)
  const waitCmd = (first) => page.waitForFunction((first) => { const b = window.__game.scene.getScene('Battle'); return !!b && b.cmdWin?.active && b.cmdWin.visible && b.cmdWin.items?.[0]?.label === first; }, first, { timeout: 30000, polling: 100 });
  await waitScene(page, 'Battle', 15000); await waitCmd('Fight'); await sleep(300); await shot('40-battle-partycmd');
  await press(page, 'Enter'); await waitCmd('Attack'); await sleep(300); await shot('41-battle-actorcmd');
  ok(await cursorOn('Battle', 'cmdWin'), 'battle command cursor drawn');
  await press(page, 'Enter'); await page.waitForFunction(() => window.__game.scene.getScene('Battle').cursorTxt.visible, null, { timeout: 5000, polling: 100 }).catch(() => {}); await sleep(200); await shot('42-battle-target-enemy');
  ok(await page.evaluate(() => window.__game.scene.getScene('Battle').cursorTxt.visible), 'enemy target cursor visible');
  await back(); await waitCmd('Attack'); await press(page, 'ArrowDown'); await press(page, 'Enter'); await sleep(500); await shot('43-battle-skills');
  await back(); await waitCmd('Attack'); await sleep(200);
  // item -> ally target
  const labels = await page.evaluate(() => window.__game.scene.getScene('Battle').cmdWin.items.map((i) => i.label)); const ii = labels.indexOf('Item');
  for (let k = 1; k < ii; k++) await press(page, 'ArrowDown', 40); await press(page, 'Enter'); await sleep(500); await shot('44-battle-items'); await press(page, 'Enter'); await page.waitForFunction(() => window.__game.scene.getScene('Battle').cursorTxt.visible, null, { timeout: 5000, polling: 100 }).catch(() => {}); await sleep(200); await shot('45-battle-target-ally');
  ok(await page.evaluate(() => window.__game.scene.getScene('Battle').cursorTxt.visible), 'ally target cursor visible');
  console.log('errors', errors.filter((e) => !/willReadFrequently|Canvas2D/.test(e)).slice(0, 5));
} catch (e) { console.log('EXC', e.message); fails++; await shot('99-fail'); }
await browser.close(); console.log(fails ? 'FAILS ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
