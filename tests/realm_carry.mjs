// N1: an in-battle Shift (Auto or manual) in an ordinary fight must not carry over to the map.
// Random encounters started on the Near Shore end back on the Near Shore (no Far drain / Far encounters afterwards).
import { launch, sleep, newGame, mashUntil, teleport, waitScene, press } from './lib.mjs';
import { waitInput, cmd } from './bdrive.mjs';
const { browser, page, errors } = await launch(process.env.BASE || process.argv[2]);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await teleport(page, 4, 5, 6, 'down');
  // stand on an open (non-safe) tile that is walkable on both shores, so a Far carry-over would visibly drain Lumen
  const spot = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); const md = m.mapData; for (let y = 1; y < md.h - 1; y++) for (let x = 1; x < md.w - 1; x++) if (m.tileFree(x, y, 'near') && m.tileFree(x, y, 'far') && !m.inSafeZone(x, y) && !m.eventsAt(x, y).length) return [x, y]; return null; });
  await teleport(page, 4, spot[0], spot[1], 'down');
  await page.evaluate(() => { const { $, Settings } = window.__S; Settings.data.autoBattle = true; Settings.data.battleSpeed = 2; Settings.save(); $.addActor('kaze'); for (const id of ['mio', 'kaze']) { const a = $.actors[id]; while (a.level < 6) $.gainExp(a, 40 * a.level); } $.refreshAllSkills(); $.healAll(); });
  const runs = []; const N = +(process.env.N || 6);
  for (let i = 0; i < N; i++) {
    const pre = await page.evaluate(() => { const { $ } = window.__S; $.realm = 'near'; $.lumen = 40.9; $.healAll(); const m = window.__game.scene.getScene('Map'); m.applyRealmVisuals(); window.__done = null; window.__maxFar = false;
      // force a Near-table encounter with a foe whose weakness is better on the Far Shore, so Auto wants to Shift
      m.startBattle('tr_well_newt_well_newt', { random: true, zone: 'z02' }).then((r) => (window.__done = r)); return { realm: $.realm, lumen: $.lumen }; });
    await waitScene(page, 'Battle', 15000);
    for (let t = 0; t < 600; t++) { const s = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); if (b?.B && b.B.realm === 'far') window.__maxFar = true; return { done: window.__done }; }); if (s.done) break; if (t % 4 === 0) await press(page, 'Enter', 40); await sleep(100); }
    await sleep(600);
    const post = await page.evaluate(() => { const { $ } = window.__S; const m = window.__game.scene.getScene('Map'); return { res: window.__done, shiftedInBattle: window.__maxFar, realm: $.realm, lumen: +$.lumen.toFixed(1), zone: m.zoneId() }; });
    await sleep(4000); const after = await page.evaluate(() => ({ realm: window.__S.$.realm, lumen: +window.__S.$.lumen.toFixed(1) }));
    runs.push({ pre, post, after }); console.log(JSON.stringify({ i, pre, post, after }));
  }
  ok(runs.every((r) => r.post.res === 'win'), 'all ordinary fights won');
  ok(runs.some((r) => r.post.shiftedInBattle), 'Auto Shifted to the Far Shore in at least one fight (exercise the bug path)');
  ok(runs.every((r) => r.post.realm === 'near' && r.after.realm === 'near'), 'map realm restored to Near after every random encounter');
  ok(runs.every((r) => r.after.lumen >= r.post.lumen), 'no Far Shore Lumen drain on the map after the fight');
  // manual Shift case (Auto off): the player Shifts to the Far Shore mid-fight, then wins; the map goes back to the pre-battle Near Shore
  await page.evaluate(() => { const { $, Settings } = window.__S; Settings.data.autoBattle = false; Settings.save(); $.realm = 'near'; $.lumen = 40; window.__done = null; window.__game.scene.getScene('Map').startBattle('tr_dust_wisp', { random: true, zone: 'z02' }).then((r) => (window.__done = r)); });
  await waitScene(page, 'Battle', 15000);
  let midRealm = null;
  for (let t = 0; t < 120; t++) { if (await page.evaluate(() => window.__done)) break; const s = await waitInput(page, 40000).catch(() => null); if (!s || s.ended) { await press(page, 'Enter', 40); await sleep(150); continue; }
    if (!midRealm) await page.evaluate(() => window.__game.scene.getScene('Battle').B.foes.forEach((f) => { f.mhp = Math.max(f.mhp, 999); f.hp = f.mhp; }));   // keep the foe up until the Shift resolves
    if (s.realm === 'far' && !midRealm) { midRealm = 'far'; await page.evaluate(() => window.__game.scene.getScene('Battle').B.foes.forEach((f) => (f.hp = 1))); }
    if (s.win === 'target') await press(page, 'Enter', 50);
    else if (s.labels.includes('Fight')) await cmd(page, ['Fight']);
    else if (s.labels.includes('Shift') && s.realm === 'near' && !midRealm) await cmd(page, ['Shift']);
    else if (s.labels.includes('Attack')) await cmd(page, ['Attack']);
    else await press(page, 'Enter', 50);
    await sleep(80); }
  await sleep(800); const mr = await page.evaluate(() => ({ res: window.__done, realm: window.__S.$.realm }));
  ok(midRealm === 'far' && mr.res === 'win' && mr.realm === 'near', 'manual in-battle Shift in a random fight: battle went Far (' + midRealm + '), map back on Near (' + JSON.stringify(mr) + ')');
  ok(errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, 'no console errors ' + JSON.stringify(errors.filter((e) => !/willReadFrequently/.test(e)).slice(0, 3)));
} catch (e) { console.log('FAIL exception', e); fails++; }
await browser.close(); console.log(fails ? `REALM_CARRY ${fails} FAIL` : 'REALM_CARRY ALL PASS'); process.exit(fails ? 1 : 0);
