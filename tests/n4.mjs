// Side quests sq03 (Hollow Roll Call) and sq04 (The Wrong Note) + sidequest data loader
import { launch, press, sleep, newGame, mashUntil, teleport, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch();
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
async function mash(cond, n = 60) { for (let i = 0; i < n; i++) { if (await page.evaluate(cond)) return true; await press(page, 'Enter', 50); await sleep(120); } return false; }
const run = async (x, y, realm, pick) => { // run the current page of event at x,y,realm; Enter mashes (choice index 0 = first option unless pick set via Down presses)
  await page.evaluate(([x, y, realm]) => { window.__r = (async () => { const m = window.mapScene(); const e = m.evs.find((q) => q.data.x === x && q.data.y === y && q.data.realm === realm); if (!e || e.pageIdx < 0) return; await m.interp.run(e.data.pages[e.pageIdx].list, m.ctxOf(e)); })(); }, [x, y, realm]);
  await sleep(200); await mash(() => !window.mapScene().interp.busy, 80); };
try {
  await page.addInitScript(() => { window.mapScene = () => window.__game.scene.getScene('Map'); }); await page.reload(); await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  const d = await page.evaluate(() => window.__S.DB.sidequests); ok(d && Object.keys(d.quests).length === 16 && d.quests.sq03.implemented && !d.quests.sq09?.implemented, 'sidequest loader: 16 quests, ch<=2 flagged implemented');
  ok(await page.evaluate(() => !!window.__S.DB.quests.sq03 && !!window.__S.DB.quests.sq04 && window.__S.DB.quests.hanzo.sq === 'sq01'), 'quest log entries generated from data; legacy hanzo=sq01');
  await page.evaluate(() => { const { $ } = window.__S; $.repel = 99999; $.buffs.stealth = 99999; $.setSw('post_lit', true); $.setSw('kaze_joined', true); $.addActor('kaze'); $.gain('collectors_book', 1); });
  // ---- sq04 bells, Far side
  await page.evaluate(() => { window.__S.$.realm = 'far'; }); await teleport(page, 5, 12, 21, 'up');
  await run(12, 20, 'far'); ok(await page.evaluate(() => window.__S.$.sw('sq04_on') && window.__S.$.questStage('sq04') === 0), 'Bell Mouse gives sq04');
  await page.evaluate(() => { window.__S.$.setV('bells', 0); });
  // wrong order first: high bell (7,16)
  await run(7, 16, 'far'); ok(await page.evaluate(() => window.__S.$.v('bells') === 0), 'wrong first bell resets');
  await run(16, 16, 'far'); ok(await page.evaluate(() => window.__S.$.v('bells') === 1), 'low bell first counts');
  await teleport(page, 6, 8, 8, 'up'); await page.evaluate(() => { window.__S.$.realm = 'far'; }); await mash(() => !window.mapScene().transitioning, 20);
  await run(10, 6, 'far'); ok(await page.evaluate(() => window.__S.$.v('bells') === 2), 'mid bell second');
  await teleport(page, 5, 8, 16, 'right'); await page.evaluate(() => { window.__S.$.realm = 'far'; }); await mash(() => !window.mapScene().transitioning, 20);
  await run(7, 16, 'far'); ok(await page.evaluate(() => window.__S.$.sw('sq04_solved')), 'high bell third solves the scale');
  await teleport(page, 5, 12, 21, 'up'); await page.evaluate(() => { window.__S.$.realm = 'far'; }); await mash(() => !window.mapScene().transitioning, 20);
  const g0 = await page.evaluate(() => ({ c3: window.__S.$.items.charm3 || 0, o: window.__S.$.items.chime_offering || 0 }));
  await run(12, 20, 'far');
  const g1 = await page.evaluate(() => ({ c3: window.__S.$.items.charm3 || 0, o: window.__S.$.items.chime_offering || 0, done: window.__S.$.sw('sq04_done'), q: window.__S.$.quests.sq04 }));
  ok(g1.done && g1.c3 === g0.c3 + 1 && g1.o === g0.o + 3, 'sq04 reward: charm3 + 3 offerings ' + JSON.stringify(g1));
  const bm = await page.evaluate(() => { const { $ } = window.__S; $.addBond('bell_mouse'); return $.bonds.bell_mouse; }); ok(bm.lv === 2, 'Bell Mouse starts at Bond Lv2 after sq04 ' + JSON.stringify(bm));
  // ---- sq03 roll call
  await run(13, 18, 'far'); ok(await page.evaluate(() => window.__S.$.sw('sq03_on')), 'Sister Ume gives sq03');
  await run(9, 22, 'far'); await run(14, 22, 'far'); await run(12, 16, 'far');
  ok(await page.evaluate(() => [0, 1, 2].every((i) => window.__S.$.sw('sq03_h' + i))), 'three clues heard on the shrine floor');
  await page.evaluate(() => { const { $ } = window.__S; for (let i = 0; i < 5; i++) { $.setSw('sq03_h' + i, true); $.setSw('sq03_m' + i, true); } });
  const f0 = await page.evaluate(() => window.__S.$.fragments); await run(13, 18, 'far');
  const f1 = await page.evaluate(() => ({ f: window.__S.$.fragments, d: window.__S.$.sw('sq03_done') })); ok(f1.d && f1.f === f0 + 2, 'sq03 complete: +2 Name Fragments');
  await page.screenshot({ path: SSDIR + '/n4-sq.png' });
  const errs = errors.filter((e) => !/willReadFrequently|Canvas2D/.test(e)); console.log('errors', errs);
} catch (e) { console.log('EXC', e.message); fails++; }
await browser.close(); console.log(fails ? 'FAILS ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
