// Polish: boss intro (letterbox + epithet, skippable), assist offer after 2 losses, Lantern Warmth, realm-shift fx, ma/story events
import { launch, press, sleep, waitScene, newGame, mashUntil, teleport, activeScenes, SSDIR } from './lib.mjs';
const SS = SSDIR;
const { browser, page, errors } = await launch();
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
try {
  await page.addInitScript(() => { window.mapScene = () => window.__game.scene.getScene('Map'); }); await page.reload(); await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  const D = await page.evaluate(() => window.__S.DB.sidequests && window.__S.SPEC.bosses); ok(D.straw_warden.epithet && D.tsubaki_final.epithet, 'bosses carry epithet data');
  await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.setSw('kaze_joined', true); $.addActor('kaze'); $.repel = 99999; $.buffs.stealth = 99999; for (const id of $.party) { const a = $.actors[id]; while (a.level < 7) $.gainExp(a, 20 * a.level); a.hp = $.param(a, 'mhp'); } });
  await teleport(page, 1, 17, 17, 'down'); await page.evaluate(() => { window.__S.$.realm = 'far'; });
  // 1. first boss intro shows letterbox + epithet, Z skips
  await page.evaluate(() => { window.__bp = window.mapScene().startBattle('boss_straw_warden', { boss: true, noEscape: true }); });
  await waitScene(page, 'Battle', 15000); await sleep(1200); await page.screenshot({ path: SS + '/n5-boss-intro.png' });
  const t0 = Date.now(); await press(page, 'Enter'); await sleep(500);
  ok(await page.evaluate(() => window.__game.scene.getScene('Battle').children.list.filter((o) => o.type === 'Text' && /Forgot Its Field/.test(o.text)).length === 0), 'boss intro skipped with OK (epithet plate gone)');
  ok(await page.evaluate(() => window.__S.$.bossSeen.straw_warden === true), 'boss seen flag stored');
  // Echo primer for the Warden
  ok(await page.evaluate(() => window.__game.scene.getScene('Battle').B.echo >= 1), 'Warden fight starts with an Echo pip (primer)');
  // 2. force 2 losses -> assist offer on third try
  await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); for (const p of b.B.party) p.hp = 0; });
  await sleep(300); await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); b.endCheck(); });
  await sleep(4500); await page.evaluate(() => {}); await mashUntil(page, () => !window.__game.scene.getScenes(true).some((s) => s.sys.settings.key === 'Battle'), null, 60);
  const L1 = await page.evaluate(() => window.__S.$.bossLosses.boss_straw_warden || 0); ok(L1 === 1, 'loss counted: ' + L1);
  await page.evaluate(() => { window.__S.$.bossLosses.boss_straw_warden = 2; for (const id of window.__S.$.party) window.__S.$.actors[id].hp = window.__S.$.param(window.__S.$.actors[id], 'mhp'); });
  await sleep(1500); await page.evaluate(() => { window.__bp = window.mapScene().startBattle('boss_straw_warden', { boss: true, noEscape: true }); });
  await waitScene(page, 'Battle', 15000); await sleep(800); await press(page, 'Enter'); await sleep(1200); await page.screenshot({ path: SS + '/n5-assist-offer.png' });
  const lbl = await page.evaluate(() => window.__game.scene.getScene('Battle').cmdWin.items?.map((i) => i.label)); ok(lbl && lbl.includes('Warm the Lantern'), 'assist offer after two losses: ' + JSON.stringify(lbl));
  await press(page, 'ArrowDown'); await press(page, 'Enter'); await sleep(2500);
  ok(await page.evaluate(() => window.__game.scene.getScene('Battle').B.ctx.warmth === 2), 'Lantern Warmth enabled for this fight');
  await page.screenshot({ path: SS + '/n5-after-offer.png' });
  console.log('errors', errors.filter((e) => !/willReadFrequently|Canvas2D/.test(e)));
} catch (e) { console.log('EXC', e.message); fails++; }
await browser.close(); console.log(fails ? 'FAILS ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
