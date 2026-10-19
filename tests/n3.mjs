// Slice integration: locks on real maps, field-spell targets, key-item gating
import { launch, press, sleep, newGame, mashUntil, teleport } from './lib.mjs';
const SS = '/workspace/lantern-night/screenshots';
const { browser, page, errors } = await launch();
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

async function mash(cond, arg, n = 60) { for (let i = 0; i < n; i++) { if (await page.evaluate(cond, arg)) return true; await press(page, 'Enter', 50); await sleep(120); } return false; }
try {
  await page.addInitScript(() => { window.mapScene = () => window.__game.scene.getScene('Map'); }); await page.reload(); await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const { $ } = window.__S; $.setSw('post_lit', true); $.setSw('kaze_joined', true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < 6) $.gainExp(a, 20 * a.level); a.hp = $.param(a, 'mhp'); a.sp = $.param(a, 'msp'); } $.gain('shrine_key', 1); $.setSw('daigo_joined', true); $.repel = 99999; $.buffs.stealth = 99999; });
  // ---- L02 guard + L06 gate (Near)
  await teleport(page, 1, 18, 6, 'up');
  const gate = (realm) => page.evaluate((realm) => { const m = mapScene(); const e = m.evs.find((x) => x.data.x === 18 && x.data.y === 4 && x.data.realm === realm); return { found: !!e, pageIdx: e?.pageIdx }; }, realm);
  ok((await gate('near')).found && (await gate('far')).found, 'gate events: Near (guarded) and Far (no guard) both exist');
  await page.evaluate(() => { window.__runGate = (async () => { const m = mapScene(); const e = m.evs.find((x) => x.data.x === 18 && x.data.y === 4 && x.data.realm === 'near'); await m.interp.run(e.data.pages[0].list, m.ctxOf(e)); })(); });
  await sleep(300); await mash(() => !mapScene().interp.busy, null, 40);
  const map1 = await page.evaluate(() => window.__S.$.map.id); ok(map1 === 1, 'Near gate refuses without Elder seal (still map 1)');
  await page.evaluate(() => window.__S.$.gain('elder_seal', 1));
  await page.evaluate(() => { window.__runGate = (async () => { const m = mapScene(); const e = m.evs.find((x) => x.data.x === 18 && x.data.y === 4 && x.data.realm === 'near'); await m.interp.run(e.data.pages[0].list, m.ctxOf(e)); })(); });
  await mash(() => window.__S.$.map.id === 5, null, 30); ok(await page.evaluate(() => window.__S.$.map.id === 5), 'with seal + key the gate opens to the Shrine (map 5)');
  await mash(() => !mapScene().transitioning && !mapScene().interp.busy, null, 40); await sleep(800);
  // ---- L08: Dew Lens alcove (Far)
  await page.evaluate(() => { window.__S.$.realm = 'far'; }); await teleport(page, 5, 3, 13, 'down');
  const alc = () => page.evaluate(() => { const m = mapScene(); const e = m.evs.find((x) => x.data.x === 1 && x.data.y === 13); return e ? e.pageIdx : 'none'; });
  const before = await alc(); await page.evaluate(() => { window.__S.$.gain('dew_lens', 1); mapScene().refreshEvents(); }); const after = await alc();
  ok(before === -1 && after === 0, `hidden alcove chest only appears with Dew Lens (page ${before} -> ${after})`); await page.screenshot({ path: SS + '/n3-alcove.png' });
  // ---- L07: Bell-Keeper needs the clapper
  await page.evaluate(() => { window.__S.$.realm = 'near'; }); await teleport(page, 6, 8, 6, 'up');
  const keeperPage = () => page.evaluate(() => { const m = mapScene(); const e = m.evs.find((x) => x.data.x === 8 && x.data.y === 5); return e.pageIdx; });
  const kp0 = await keeperPage(); await page.evaluate(() => { window.__S.$.gain('shrine_bell_clapper', 1); mapScene().refreshEvents(); }); const kp1 = await keeperPage();
  ok(kp0 === 0 && kp1 === 1, `Keeper arena gated by clapper (page ${kp0} -> ${kp1})`);
  // ---- field spell: Clearing Gust on the sand drift (summit, Near)
  await page.evaluate(() => { window.__S.$.setSw('drift_gone', false); mapScene().refreshEvents(); }); await teleport(page, 6, 4, 4, 'up');
  await page.screenshot({ path: SS + '/n3-sand.png' });
  const gusted = await page.evaluate(() => { const { $, Field } = window.__S; const r = Field.castField('kaze', 'sp_gust_clear'); window.__fa = mapScene().fieldAction(r.action); return r.ok; });
  await mash(() => window.__S.$.sw('drift_gone'), null, 40); ok(gusted && await page.evaluate(() => window.__S.$.sw('drift_gone')), 'Clearing Gust clears the sand drift (field spell on the map)');
  await sleep(500); await page.screenshot({ path: SS + '/n3-sand-cleared.png' });
  // ---- no target -> no cost
  const sp0 = await page.evaluate(() => window.__S.$.actors.kaze.sp); await teleport(page, 6, 10, 9, 'up');
  await page.evaluate(() => { const r = window.__S.Field.castField('kaze', 'sp_gust_clear'); window.__fa = mapScene().fieldAction(r.action); }); await sleep(600);
  const sp1 = await page.evaluate(() => window.__S.$.actors.kaze.sp); ok(sp1 === sp0, `tile spell with no target costs nothing (SP ${sp0} -> ${sp1})`);
  // ---- Well hay + Foxfire Torch
  await page.evaluate(() => { window.__S.$.realm = 'near'; window.__S.$.setSw('hay_burnt', false); }); await teleport(page, 4, 25, 3, 'right');
  const cost0 = await page.evaluate(() => window.__S.$.actors.kaze.sp);
  await page.evaluate(() => { const r = window.__S.Field.castField('kaze', 'sp_foxfire_torch'); window.__fb = mapScene().fieldAction(r.action); });
  await mash(() => window.__S.$.sw('hay_burnt'), null, 40); ok(await page.evaluate(() => window.__S.$.sw('hay_burnt')), 'Fox-fire Torch burns the hay bale in the Well');
  ok(await page.evaluate((c) => window.__S.$.actors.kaze.sp < c, cost0), 'SP spent on successful cast');
  // ---- Hollowed Pilgrim + Name Whisper (Far)
  await page.evaluate(() => { window.__S.$.realm = 'far'; }); await teleport(page, 1, 30, 26, 'right');
  const fr0 = await page.evaluate(() => window.__S.$.fragments);
  await page.evaluate(() => { const r = window.__S.Field.castField('mio', 'sp_name_whisper'); window.__fc = mapScene().fieldAction(r.action); });
  await mash(() => window.__S.$.sw('pilgrim_named'), null, 50); const fr1 = await page.evaluate(() => window.__S.$.fragments);
  ok(fr1 === fr0 + 1, `Name Whisper on the Hollowed Pilgrim grants a Name Fragment (${fr0} -> ${fr1})`);
  // ---- Lantern Return warp
  await page.evaluate(() => { const { $ } = window.__S; $.litPost = { map: 1, x: 16, y: 17, dir: 'down' }; $.actors.mio.level = Math.max($.actors.mio.level, 10); $.refreshAllSkills(); $.actors.mio.sp = 99; $.lumen = 60; });
  await teleport(page, 5, 11, 20, 'up');
  await page.evaluate(() => { const r = window.__S.Field.castField('mio', 'sp_lantern_return'); window.__fd = mapScene().fieldAction(r.action); });
  await mash(() => window.__S.$.map.id === 1, null, 40); ok(await page.evaluate(() => window.__S.$.map.id === 1), 'Lantern Return warps to the lit Post');
  ok(errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, 'no console errors ' + JSON.stringify(errors.filter((e) => !/willReadFrequently/.test(e)).slice(0, 3), null, 1));
} catch (e) { console.log('EXC', e.message); fails++; await page.screenshot({ path: SS + '/n3-fail.png' }); console.log(errors.filter((e) => !/willReadFrequently/.test(e)).slice(0, 5)); }
console.log(fails ? 'N3 FAILURES: ' + fails : 'N3 ALL PASS'); await browser.close();
