import { launch, press, hold, sleep, waitScene, newGame, mashUntil, teleport, activeScenes, SSDIR } from './lib.mjs';
const SS = SSDIR;
const { browser, page, errors } = await launch();
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.setSw('kaze_joined', true); $.setSw('elder_told', true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < 7) $.gainExp(a, 20 * a.level); a.hp = $.param(a, 'mhp'); a.sp = $.param(a, 'msp'); } $.realm = 'far'; });
  await teleport(page, 1, 13, 23, 'left'); await sleep(500);
  await page.screenshot({ path: SS + '/60-warden-far.png' });
  await hold(page, 'ArrowLeft', 900); await sleep(500);
  await page.screenshot({ path: SS + '/61-warden-touch.png' });
  // mash through
  let n = 0; while (!(await activeScenes(page)).includes('Battle') && n++ < 40) { await press(page, 'Enter', 60); await sleep(150); }
  console.log('in battle', (await activeScenes(page)).includes('Battle'));
  const t0 = Date.now(); while (Date.now() - t0 < 120000) { const a = await activeScenes(page); if (!a.includes('Battle')) { if (await page.evaluate(() => window.__S.$.sw('warden_done'))) break; } await press(page, 'Enter', 50); await sleep(220); }
  await sleep(600); for (let i = 0; i < 12; i++) { await press(page, 'Enter', 60); await sleep(200); }
  console.log('warden_done', await page.evaluate(() => window.__S.$.sw('warden_done')), 'lv', await page.evaluate(() => window.__S.$.party.map((p) => window.__S.$.actors[p].level)));
  await page.screenshot({ path: SS + '/62-after-warden.png' });
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 6));
} catch (e) { console.log('FAIL', e.message); console.log(errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 8)); await page.screenshot({ path: SS + '/6x-fail.png' }); }
await browser.close();
