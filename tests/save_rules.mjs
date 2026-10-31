// "Saves are a reward": Menu > Save only at a lit save point; autosave only on milestones (not on a plain map change).
import { launch, sleep, press, newGame, mashUntil, teleport, waitScene, activeScenes } from './lib.mjs';
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
const { browser, page } = await launch();
const idle = () => { const m = window.__game.scene.getScene('Map'); return m.ready && !m.msg.busy && !m.interp.busy; };
const slot0 = () => page.evaluate(() => { const d = window.__S.SaveManager.read(0); return d ? { map: d.game.map.id, x: d.game.map.x, y: d.game.map.y, maze: !!d.game.switches.maze_cleared } : null; });
const clear0 = () => page.evaluate(() => localStorage.removeItem('lotfs.save.0'));
const menuSave = async () => { await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(450); await page.evaluate(() => { const M = window.__game.scene.getScene('Menu'); M.lastSaveRefused = undefined; });
  for (let i = 0; i < 14; i++) { const c = await page.evaluate(() => { const M = window.__game.scene.getScene('Menu'); return M.cmd.items[M.cmd.index]?.label; }); if (c === 'Save') break; await press(page, 'ArrowDown'); await sleep(80); }
  await press(page, 'Enter'); await sleep(700); const sc = await activeScenes(page); const refused = await page.evaluate(() => !!window.__game.scene.getScene('Menu').lastSaveRefused); return { sc, refused }; };
const closeAll = async () => { await page.evaluate(() => { const g = window.__game; g.scene.getScenes(true).forEach((s) => { if (s.sys.settings.key === 'SaveLoad') s.close?.(); }); g.scene.getScene('Menu').close?.(); }); await sleep(500); await mashUntil(page, idle, null, 10); };
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
// 1. Menu > Save refused away from a save point
await teleport(page, 1, 8, 6, 'down'); let r = await menuSave();
ok(r.refused && !r.sc.includes('SaveLoad'), `Menu > Save refused in the open village ("The lantern isn't lit here") ${JSON.stringify(r.sc)}`);
await press(page, 'Enter'); await sleep(300); await closeAll();
// 1b. refused beside an UNLIT Post
await page.evaluate(() => window.__S.$.setSw('post_lit', false)); await teleport(page, 1, 16, 17, 'up'); r = await menuSave();
ok(r.refused && !r.sc.includes('SaveLoad'), 'Menu > Save refused beside the Post before it is lit');
await press(page, 'Enter'); await sleep(300); await closeAll();
// 2. Menu > Save works beside the lit Post
await page.evaluate(() => window.__S.$.setSw('post_lit', true)); await teleport(page, 1, 16, 17, 'up'); r = await menuSave();
ok(!r.refused && r.sc.includes('SaveLoad'), 'Menu > Save opens the slot list beside the lit Lantern Post');
await closeAll();
// 2b. the Teahouse inn (map 3, saves) is its map's save point; Old Hisa's inn (map 111, noSave) is not, its Post is
await teleport(page, 3, 4, 4, 'up'); ok(await page.evaluate(() => window.__game.scene.getScene('Map').canSaveHere()), 'beside Tama (map 3 inn) counts as a save point');
await teleport(page, 111, 7, 11, 'up'); ok(!(await page.evaluate(() => window.__game.scene.getScene('Map').canSaveHere())), 'beside Old Hisa (map 111 noSave inn) is not a save point');
await teleport(page, 111, 11, 13, 'up'); ok(await page.evaluate(() => window.__game.scene.getScene('Map').canSaveHere()), 'beside the map 111 Lantern Post (11,12) is a save point');
// 3. no autosave on a plain map change (real transfer through the village south trail into the maze)
await page.evaluate(() => { window.__S.$.setSw('maze_intro', true); window.__S.$.realm = 'near'; }); await teleport(page, 1, 23, 28, 'down'); await clear0();
await press(page, 'ArrowDown', 400); await sleep(1500); await mashUntil(page, idle, null, 20);
ok((await page.evaluate(() => window.__S.$.map.id)) === 7 && (await slot0()) === null, 'walking village -> maze does not autosave');
// 4. a milestone does: clearing the maze (west exit) autosaves at the village loop-back
await teleport(page, 7, 1, 22, 'left'); await press(page, 'ArrowLeft', 400); await sleep(1800); await mashUntil(page, idle, null, 20); await sleep(800);
const s0 = await slot0(); ok(s0 && s0.map === 1 && s0.maze, `clearing the maze autosaves (slot 0: ${JSON.stringify(s0)})`);
// 5. a chapter beat autosaves; an ordinary map change after it does not overwrite
await clear0(); await page.evaluate(async () => { const m = window.__game.scene.getScene('Map'); await m.interp.run([{ c: 'chapter', n: (window.__S.$.chapter || 1) + 1 }], {}); }); await sleep(1200);
ok((await slot0()) !== null, 'a new chapter autosaves');
await clear0(); await page.evaluate(async () => { const m = window.__game.scene.getScene('Map'); await m.transfer(3, 4, 8, 'up', {}); }); await sleep(1500);
ok((await slot0()) === null, 'a scripted map change (door) does not autosave');
await browser.close(); console.log(fails ? `FAIL ${fails}` : 'PASS save_rules'); process.exit(fails ? 1 : 0);
