import { launch, sleep, press, waitScene, waitFor, activeScenes, newGame, mashUntil, teleport } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `screenshots/${n}.png` });
const st = () => page.evaluate(() => { const S = window.__S, m = window.__game.scene.getScene('Map'); return { map: S.$.map?.id ?? S.$.mapId, x: m.player?.tx, y: m.player?.ty, realm: S.$.realm, lumen: Math.round(S.$.lumen), gold: S.$.gold, party: S.$.party.slice(), sw: Object.keys(S.$.switches || {}).filter(k => S.$.switches[k]).sort().join(','), items: JSON.stringify(S.$.items), q: JSON.stringify(S.$.quests).length }; });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'));
  await sleep(500); await teleport(page, 1, 20, 12, 'down');
  await page.evaluate(() => { const S = window.__S; S.$.addActor('kaze'); S.$.gold = 123; S.$.gain('onigiri', 3); S.$.lumen = 47; S.$.setSw && S.$.setSw('kaze_joined', true); });
  // Save into slot 3 through the real UI. The slot list starts with the Autosave row (index 0), so steer by the cursor's slot, not a fixed key count.
  await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(400);
  for (let i = 0; i < 9; i++) { await press(page, 'ArrowDown'); await sleep(50); }
  await press(page, 'Enter'); await waitScene(page, 'SaveLoad'); await sleep(500);
  const cur = () => page.evaluate(() => window.__game.scene.getScene('SaveLoad').list.current?.data.slot);
  for (let i = 0; i < 12 && (await cur()) !== 3; i++) { await press(page, 'ArrowDown'); await sleep(120); }
  const SLOT = await cur(); if (SLOT !== 3) throw new Error('could not put the cursor on slot 3 (at ' + SLOT + ')');
  // The map (and its Lumen regen, +1/s on the Near Shore) is paused while the menu is open, so this is exactly what gets saved.
  const before = await st(); console.log('before', JSON.stringify(before));
  await press(page, 'Enter'); await sleep(700); await shot('23-save-done');
  const meta = await page.evaluate(() => window.__S.SaveManager.meta(3)); console.log('slot3', JSON.stringify(meta));
  const raw = await page.evaluate(() => { const g = window.__S.SaveManager.read(3)?.game; return g ? { lumen: Math.round(g.lumen), gold: g.gold, realm: g.realm } : null; });
  await page.reload(); await waitScene(page, 'Title', 30000); await sleep(800); await shot('24-title-continue');
  await press(page, 'Enter'); await waitScene(page, 'SaveLoad'); await sleep(600); await shot('24-load');
  console.log('latest', await page.evaluate(() => window.__S.SaveManager.latestSlot()));
  for (let i = 0; i < 12 && (await cur()) !== 3; i++) { await press(page, 'ArrowDown'); await sleep(120); }
  if ((await cur()) !== 3) throw new Error('could not put the load cursor on slot 3');
  await press(page, 'Enter'); await sleep(300); await shot('24-load-confirm'); if (await page.evaluate(() => window.__game.scene.isActive('SaveLoad'))) await press(page, 'Enter');
  await waitScene(page, 'Map', 15000); await sleep(1200);
  const after = await st(); console.log('after ', JSON.stringify(after));
  // Lumen keeps regenerating on the map after the load, so allow it to have risen by a few points; everything else must match exactly.
  const strip = (o) => ({ ...o, lumen: 0 }); const lumenOk = after.lumen >= before.lumen && after.lumen <= before.lumen + 5;
  const match = !!meta && !!raw && raw.lumen === before.lumen && raw.gold === before.gold && JSON.stringify(strip(before)) === JSON.stringify(strip(after)) && lumenOk;
  console.log('MATCH', match, JSON.stringify({ savedLumen: raw?.lumen, before: before.lumen, after: after.lumen })); if (!match) process.exitCode = 1;
  await shot('25-loaded');
} catch (e) { console.log('FAIL', e.message); await shot('fail'); process.exitCode = 1; }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
