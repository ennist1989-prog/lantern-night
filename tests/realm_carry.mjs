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
  // N10: start on the Far Shore at 1.7 Lumen. The fight drains Lumen to 0, the engine forces the party back to Near, and
  // the map must stay on Near (no restore to Far at 0 Lumen, no fade to respawn). Control: Far at 40 Lumen restores Far.
  const farFight = async (lumen0, holdUntilForced) => {
    await page.evaluate((l) => { const { $, Settings } = window.__S; Settings.data.autoBattle = false; Settings.save(); $.realm = 'far'; $.lumen = l; $.healAll(); const m = window.__game.scene.getScene('Map'); m.applyRealmVisuals(); window.__done = null; window.__forced = false; window.__pre = { fades: $.fades, map: $.map.id, x: $.map.x, y: $.map.y };
      m.startBattle('tr_dust_wisp', { random: true, zone: 'z02' }).then((r) => (window.__done = r)); }, lumen0);
    await waitScene(page, 'Battle', 15000);
    for (let t = 0; t < 160; t++) { if (await page.evaluate(() => window.__done)) break; const s = await waitInput(page, 40000).catch(() => null); if (!s || s.ended) { await press(page, 'Enter', 40); await sleep(150); continue; }
      const go = await page.evaluate((hold) => { const B = window.__game.scene.getScene('Battle').B; if (B.forcedNear) window.__forced = true; const go = !hold || B.forcedNear; B.foes.forEach((f) => { if (go) f.hp = Math.min(f.hp, 1); else { f.mhp = Math.max(f.mhp, 999); f.hp = f.mhp; } }); return go; }, holdUntilForced);
      if (s.win === 'target') await press(page, 'Enter', 50);
      else if (s.labels.includes('Fight')) await cmd(page, ['Fight']);
      else if (!go && s.labels.includes('Guard')) await cmd(page, ['Guard']);
      else if (s.labels.includes('Attack')) await cmd(page, ['Attack']);
      else await press(page, 'Enter', 50);
      await sleep(80); }
    await sleep(800); const post = await page.evaluate(() => { const { $ } = window.__S; return { res: window.__done, forced: window.__forced, realm: $.realm, lumen: +$.lumen.toFixed(1), fades: $.fades, map: $.map.id, pre: window.__pre }; });
    await sleep(3000); const after = await page.evaluate(() => { const { $ } = window.__S; const m = window.__game.scene.getScene('Map'); return { realm: $.realm, lumen: +$.lumen.toFixed(1), fades: $.fades, map: $.map.id, x: $.map.x, y: $.map.y, fading: !!m.fadingNow }; });
    return { post, after }; };
  const n10 = await farFight(1.7, true); console.log('N10', JSON.stringify(n10));
  ok(n10.post.res === 'win' && n10.post.forced && n10.post.realm === 'near' && n10.after.realm === 'near' && n10.after.fades === n10.post.pre.fades && n10.after.map === n10.post.pre.map && !n10.after.fading,
    'N10: Far fight that ran out of Lumen stays on the Near Shore after the win (no restore to Far at 0 Lumen, no fade to respawn)');
  const farOk = await farFight(40, false); console.log('FAR', JSON.stringify(farOk));
  ok(farOk.post.res === 'win' && !farOk.post.forced && farOk.post.realm === 'far' && farOk.after.fades === farOk.post.pre.fades, 'Far fight with Lumen to spare: map back on the pre-battle Far Shore');
  ok(errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, 'no console errors ' + JSON.stringify(errors.filter((e) => !/willReadFrequently/.test(e)).slice(0, 3)));
} catch (e) { console.log('FAIL exception', e); fails++; }
await browser.close(); console.log(fails ? `REALM_CARRY ${fails} FAIL` : 'REALM_CARRY ALL PASS'); process.exit(fails ? 1 : 0);
