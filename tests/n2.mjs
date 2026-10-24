// Menu UI screens: Item / Skill / Equip / Key Items / Forge / Bonds + field use; screenshots to screenshots/n2-*.png
import { launch, press, sleep, newGame, mashUntil, activeScenes, waitScene, SSDIR } from './lib.mjs';
const SS = SSDIR;
const { browser, page, errors } = await launch();
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const cmdLabels = () => page.evaluate(() => window.__game.scene.getScene('Menu').cmd.items.map((i) => i.label));
async function openMenu() { await press(page, 'Escape'); await waitScene(page, 'Menu', 5000); await sleep(400); }
async function pick(label) { const L = await cmdLabels(); const i = L.indexOf(label); if (i < 0) throw new Error('no menu entry ' + label + ' in ' + L); const cur = await page.evaluate(() => window.__game.scene.getScene('Menu').cmd.index); for (let k = cur; k < i; k++) await press(page, 'ArrowDown', 40); for (let k = cur; k > i; k--) await press(page, 'ArrowUp', 40); await press(page, 'Enter'); await sleep(450); }
const back = async () => { await press(page, 'Escape'); await sleep(350); };
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const { $ } = window.__S; $.setSw('post_lit', true); $.setSw('kaze_joined', true); $.setSw('elder_told', true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < 6) $.gainExp(a, 20 * a.level); a.hp = 20; a.sp = $.param(a, 'msp'); } $.gold = 800;
    for (const [k, n] of Object.entries({ honey: 3, herbal_tea: 2, rice_ball: 2, hush_bell: 1, lantern_oil: 2, charm1: 1, charm2: 1, charm_cord: 1, mio_w2: 1, garb2: 1, smith_tongs: 1, dew_lens: 1, collectors_book: 1, elder_seal: 1, shrine_key: 1, lantern_shard: 3, wellkeeper_pebble: 1, cucumber: 2 })) if (window.__S.DB.items[k]) $.gain(k, n); else console.log('missing', k); });
  await openMenu(); await page.screenshot({ path: SS + '/n2-menu.png' });
  const L = await cmdLabels(); ok(L.includes('Key Items') && L.includes('Forge') && L.includes('Bonds'), 'menu entries: ' + L.join(','));
  // Items: use honey on Mio
  await pick('Item'); await page.screenshot({ path: SS + '/n2-items.png' });
  const hp0 = await page.evaluate(() => window.__S.$.actors.mio.hp);
  await press(page, 'Enter'); await sleep(300); await press(page, 'Enter'); await sleep(600); await page.screenshot({ path: SS + '/n2-items-used.png' });
  const hp1 = await page.evaluate(() => window.__S.$.actors.mio.hp); ok(hp1 > hp0, `item used from menu (HP ${hp0}->${hp1})`);
  await back(); await sleep(300);
  // Skills with field spell list
  await pick('Skill'); await press(page, 'Enter'); await sleep(400); await page.screenshot({ path: SS + '/n2-skills.png' }); await back();
  // Equip
  await pick('Equip'); await press(page, 'Enter'); await sleep(400); await page.screenshot({ path: SS + '/n2-equip-slots.png' });
  await press(page, 'Enter'); await sleep(400); await page.screenshot({ path: SS + '/n2-equip-list.png' }); await press(page, 'ArrowDown'); await sleep(150); await page.screenshot({ path: SS + '/n2-equip-hover.png' });
  await press(page, 'Enter'); await sleep(400); const w = await page.evaluate(() => window.__S.$.actors.mio.equips.weapon); ok(w === 'mio_w2', 'equipped Ash Lantern-Staff via menu: ' + w); await back();
  // Key items
  await pick('Key Items'); await page.screenshot({ path: SS + '/n2-keyitems.png' }); for (let i = 0; i < 3; i++) await press(page, 'ArrowDown', 40); await sleep(200); await page.screenshot({ path: SS + '/n2-keyitems2.png' }); await back();
  // Forge
  await pick('Forge'); await sleep(300); await page.screenshot({ path: SS + '/n2-forge.png' }); await back();
  // Bonds
  await pick('Bonds'); await sleep(300); await page.screenshot({ path: SS + '/n2-bonds.png' }); await back();
  await back(); await sleep(400);
  ok(errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, 'no console errors ' + JSON.stringify(errors.filter((e) => !/willReadFrequently/.test(e)).slice(0, 3)));
} catch (e) { console.log('EXC', e.message); fails++; await page.screenshot({ path: SS + '/n2-fail.png' }); console.log(errors.filter((e) => !/willReadFrequently/.test(e)).slice(0, 5)); }
console.log(fails ? 'N2 FAILURES: ' + fails : 'N2 ALL PASS'); await browser.close();
