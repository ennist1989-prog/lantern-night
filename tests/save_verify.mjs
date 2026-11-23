// Browser checks for the save-reward rules QA had only read in code: Far fade, defeat with no save, Continue from autosave only, checkpoint after load.
import { launch, sleep, press, newGame, mashUntil, teleport, waitScene, activeScenes } from './lib.mjs';
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
const { browser, page } = await launch();
const idle = () => { const m = window.__game.scene.getScene('Map'); return m.ready && !m.msg.busy && !m.interp.busy; };
const raw0 = () => page.evaluate(() => localStorage.getItem('lotfs.save.0'));
const clearAll = () => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('lotfs.save.')).forEach((k) => localStorage.removeItem(k)));
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
// 1. Far fade (Lumen runs out) does not autosave
await clearAll(); await teleport(page, 1, 20, 12, 'down');
await page.evaluate(async () => { const m = window.__game.scene.getScene('Map'); window.__S.$.realm = 'far'; m.applyRealmVisuals?.(); m.fadeOutOfFar(); });
await sleep(2500); await mashUntil(page, idle, null, 20); await sleep(500);
const f = await page.evaluate(() => ({ realm: window.__S.$.realm, map: window.__S.$.map.id, x: window.__game.scene.getScene('Map').player.tx, y: window.__game.scene.getScene('Map').player.ty }));
ok(f.realm === 'near' && (await raw0()) === null, 'Far fade: back to Near at the respawn point, no autosave ' + JSON.stringify(f));
// 2. defeat with no save and the default respawn -> map 1 (17,17)
await clearAll(); await page.evaluate(() => { const { $, DB } = window.__S; $.respawn = { ...DB.system.respawn }; $.checkpoint = null; });
await teleport(page, 1, 8, 6, 'down');
await page.evaluate(() => { window.__game.scene.getScene('Map').handleDefeat(false, {}); }); await sleep(2500); await mashUntil(page, idle, null, 20); await sleep(400);
const d = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return { map: window.__S.$.map.id, x: m.player.tx, y: m.player.ty }; });
ok(d.map === 1 && d.x === 17 && d.y === 17 && (await raw0()) === null, 'defeat with no save: respawn at map 1 (17,17), no autosave ' + JSON.stringify(d));
// 3. checkpoint (Warden, map 1 event 30) autosaves once; loading it does not re-fire the cutscene or autosave again
await clearAll(); await teleport(page, 1, 12, 23, 'down');
await page.evaluate(async () => { const m = window.__game.scene.getScene('Map'); await m.interp.run([{ c: 'checkpoint' }], {}); }); await sleep(600);
const cp = await raw0(); ok(!!cp, 'checkpoint command writes the autosave');
await page.evaluate(() => { window.__S.SaveManager.load(0); window.__game.scene.getScene('Map').scene.restart({ mode: 'load' }); }); await sleep(3000); await mashUntil(page, idle, null, 10); await sleep(2500);
const after = await page.evaluate(() => ({ busy: window.__game.scene.getScene('Map').interp.busy, warden: window.__S.$.sw('warden_done'), scenes: window.__game.scene.getScenes(true).map((s) => s.sys.settings.key) }));
ok((await raw0()) === cp && !after.busy && !after.scenes.includes('Battle'), 'after loading the checkpoint save: no event running, no battle, slot 0 unchanged ' + JSON.stringify(after));
// 4. Continue with only an autosave (slot 0) present
const only = await page.evaluate(() => Object.keys(localStorage).filter((k) => /^lotfs\.save\.\d+$/.test(k)));
ok(only.length === 1 && only[0] === 'lotfs.save.0', 'only the autosave slot exists ' + JSON.stringify(only));
await page.reload(); await waitScene(page, 'Title', 30000); await sleep(1000);
const latest = await page.evaluate(() => window.__S.SaveManager.latestSlot());
await press(page, 'Enter'); await sleep(1200); let sc = await activeScenes(page);
if (sc.includes('SaveLoad')) { await press(page, 'Enter'); await sleep(500); }
await waitScene(page, 'Map', 20000); await sleep(1500);
const c = await page.evaluate(() => ({ map: window.__S.$.map.id, x: window.__game.scene.getScene('Map').player.tx, y: window.__game.scene.getScene('Map').player.ty }));
ok(latest === 0 && c.map === 1 && c.x === 12 && c.y === 23, 'Title > Continue loads the autosave-only game ' + JSON.stringify({ latest, sc, c }));
await browser.close(); console.log(fails ? `FAIL ${fails}` : 'PASS save_verify'); process.exit(fails ? 1 : 0);
