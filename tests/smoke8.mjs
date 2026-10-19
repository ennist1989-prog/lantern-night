import { launch, sleep, press, waitScene, activeScenes, newGame, mashUntil, teleport } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `screenshots/${n}.png` });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'));
  await sleep(500);
  await page.evaluate(() => { const S = window.__S, $ = S.$; for (const id of ['kaze', 'daigo']) { $.addActor(id); const a = $.actors[id]; a.level = 5; a.skills = []; $.refreshSkills(a); a.hp = $.param(a, 'mhp'); }
    const m = $.actors.mio; m.level = 5; m.skills = []; $.refreshSkills(m); m.hp = $.param(m, 'mhp'); m.sp = $.param(m, 'msp');
    for (const k of ['kaze_joined', 'daigo_joined', 'key_got', 'gate_open', 'ped_solved', 'post_lit']) $.setSw(k, true); $.lumen = 100; $.tutorialsShown.parley = true; $.tutorialsShown.shift = true; S.Settings.data.autoBattle = true; S.Settings.data.battleSpeed = 2; S.Settings.data.msgAuto = false; });
  await teleport(page, 6, 8, 9, 'up');
  await shot('30-summit');
  let seen = new Set();
  for (let i = 0; i < 200; i++) {
    if (i % 2 === 0) await press(page, 'ArrowUp', 250); else await press(page, 'Enter', 60);
    const a = (await activeScenes(page)).join('+'); if (!seen.has(a)) { seen.add(a); console.log(i, a); await shot('30-' + a.replace(/\+/g, '_')); }
    if (a.includes('Credits')) break;
  }
  await sleep(2000); await shot('31-end');
  console.log('boss_done', await page.evaluate(() => window.__S.$.sw('boss_done')), await activeScenes(page));
} catch (e) { console.log('FAIL', e.message); await shot('fail'); }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
