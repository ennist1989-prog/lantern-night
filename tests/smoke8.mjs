import { launch, sleep, press, waitScene, activeScenes, newGame, mashUntil, teleport, bkFlow, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `${SSDIR}/${n}.png` });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'));
  await sleep(500);
  await page.evaluate(() => { const S = window.__S, $ = S.$; for (const id of ['kaze', 'daigo']) { $.addActor(id); const a = $.actors[id]; a.level = 5; a.skills = []; $.refreshSkills(a); a.hp = $.param(a, 'mhp'); }
    const m = $.actors.mio; m.level = 5; m.skills = []; $.refreshSkills(m); m.hp = $.param(m, 'mhp'); m.sp = $.param(m, 'msp');
    for (const k of ['kaze_joined', 'daigo_joined', 'key_got', 'gate_open', 'ped_solved', 'post_lit']) $.setSw(k, true); $.gain('shrine_bell_clapper', 1); $.lumen = 100; $.tutorialsShown.parley = true; $.tutorialsShown.shift = true; S.Settings.data.autoBattle = true; S.Settings.data.battleSpeed = 2; S.Settings.data.msgAuto = false; });
  await teleport(page, 6, 8, 9, 'up');
  await shot('30-summit');
  let seen = new Set(); const flow = bkFlow(page);
  const t0 = Date.now();   // boss fights suspend Auto (#21), so the Keeper fight is menu-driven and needs more than the old 200 presses
  for (let i = 0; Date.now() - t0 < 360000; i++) {
    // An open choice ('Face the Bell-Keeper' / 'Wait — prepare first') must not get the ArrowUp: it wraps the cursor to 'Wait',
    // and that Up/Enter rhythm could keep declining the fight for minutes on a slow box. Pick option 0 explicitly instead.
    const ch = await page.evaluate(() => { const c = window.__game.scene.getScene('Map')?.msg?.choiceWin; return c && c.active ? c.index : -1; });
    if (ch > 0) { await press(page, 'ArrowUp', 60); continue; }
    if (ch === 0 || i % 2 === 1) await press(page, 'Enter', 60); else await press(page, 'ArrowUp', 250);
    const a = (await activeScenes(page)).join('+'); if (!seen.has(a)) { seen.add(a); console.log(i, a); await shot('30-' + a.replace(/\+/g, '_')); }
    await flow.step(); if (flow.done()) { await sleep(1500); await flow.step(); break; }   // was: Credits; now epilogue -> Sachi's house -> Ch3 opener
  }
  await sleep(2000); await shot('31-end');
  const v = flow.verdict(); console.log((v.ok ? 'PASS' : 'FAIL') + ' Bell-Keeper aftermath flow', JSON.stringify(v.seen)); if (!v.ok) process.exitCode = 1;
  console.log('boss_done', await page.evaluate(() => window.__S.$.sw('boss_done')), await activeScenes(page));
} catch (e) { console.log('FAIL', e.message); await shot('fail'); }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
