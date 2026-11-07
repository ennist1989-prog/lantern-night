import { launch, press, hold, sleep, waitScene, newGame, mashUntil, teleport, activeScenes, bkFlow, SSDIR } from './lib.mjs';
const SS = SSDIR;
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `${SS}/${n}.png` });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; for (const s of ['post_lit', 'kaze_joined', 'elder_told', 'daigo_joined', 'key_got', 'gate_open', 'ped_solved', 'warden_done', 'parley_taught']) $.setSw(s, true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < 6) $.gainExp(a, 20 * a.level); a.hp = $.param(a, 'mhp'); a.sp = $.param(a, 'msp'); } $.gain('shrine_bell_clapper', 1); $.realm = 'near'; $.gain('rice_ball', 3); });
  await teleport(page, 6, 8, 6, 'up'); await sleep(600); await shot('80-summit');
  await press(page, 'Enter'); await sleep(400);
  const flow = bkFlow(page);
  let fights = 0; const t0 = Date.now(); let cheated = false; let sawRetry = true;
  while (Date.now() - t0 < 360000) {   // 360s: a wipe -> retry -> second (re-weakened) Keeper fight fits on a slow runner
    const sc = await activeScenes(page);
    await flow.step(); if (flow.done()) { await sleep(1500); await flow.step(); break; }   // Ch3 handoff: epilogue -> Sachi's house -> Ch3 opener (was: Credits)
    if (!sc.includes('Battle')) cheated = false;   // a wipe/retry starts a fresh Keeper fight: weaken that one too
    if (sc.includes('Battle')) { fights++; if (fights > 40 && !cheated) { } 
      const inb = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); return b?.B ? [b.B.round, b.B.foes[0].hp] : null; });
      if (inb && inb[0] >= 5 && !cheated && sawRetry) { await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); b.B.foes[0].hp = 20; b.B.foes[0].dispHp = 20;
          // Far-win (#33): finish the Keeper on the Far Shore, as after Mio's in-battle Shift (anchored so the Keeper's realm flip can't undo it); the handoff must still land on the Near Shore
          b.B.realm = 'far'; b.B.lockRealm = 99; b.refreshRealmVisuals();
          // and top the party up so a bad RNG streak can't wipe it before the finish
          for (const a of b.B.party) if (a.hp > 0) { a.hp = a.mhp; a.dispHp = a.mhp; } }); cheated = true; console.log('round', inb[0], '- Keeper weakened, fight moved to the Far Shore'); }
    }
    const txt = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return m?.msg?.choiceOpen ? 'choice' : ''; });
    await press(page, 'Enter', 50); await sleep(200);
    if (fights === 0 && Date.now() - t0 > 3000 && !globalThis.s1) { globalThis.s1 = 1; await shot('81-dialog'); }
    if (!sawRetry && (await page.evaluate(() => (window.__S.$.fades || 0) > 0 || !!window.__retryShown))) sawRetry = true;
  }
  console.log('scenes', await activeScenes(page));
  const v = flow.verdict(); if (flow.st.winRealm !== 'far') { v.ok = false; v.seen.push('not-a-far-win'); } console.log((v.ok ? 'PASS' : 'FAIL') + ' Bell-Keeper aftermath flow', JSON.stringify(v.seen)); if (!v.ok) process.exitCode = 1;
  await shot('82-end');
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 6));
} catch (e) { console.log('FAIL', e.message); console.log(errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 8)); await shot('8x-fail'); }
await browser.close();
