import { launch, press, sleep, waitScene, newGame, mashUntil, teleport, activeScenes } from './lib.mjs';
import { state, waitInput, pick, target, cmd } from './bdrive.mjs';
const SS = '/workspace/lantern-night/screenshots';
const troop = process.argv[2] || 'tr_straw_hound'; const mode = process.argv[3] || 'invite';
const { browser, page, errors } = await launch();
const shot = async (n) => { await sleep(300); await page.screenshot({ path: `${SS}/${n}.png` }); };
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < 5) $.gainExp(a, 20 * a.level); a.hp = $.param(a, 'mhp'); a.sp = $.param(a, 'msp'); } $.realm = 'far'; $.gain('mochi', 3); $.gain('honey', 2); });
  await teleport(page, 1, 17, 17, 'down'); await sleep(300);
  await page.evaluate((t) => { const m = window.__game.scene.getScene('Map'); window.__bp = m.startBattle(t, { random: true, zone: 'z01' }); }, troop);
  await waitScene(page, 'Battle', 15000); await sleep(1200);
  let calm = false, n = 0;
  for (let round = 0; round < 14; round++) {
    let s = await waitInput(page); if (s.ended || !(await activeScenes(page)).includes('Battle')) break;
    if (s.labels.includes('Fight')) await pick(page, 'Fight');
    // Mio
    s = await waitInput(page); const foes = s.foes; const idx = foes.findIndex((f) => !f[5] && f[1] > 0);
    const f0 = foes[idx];
    calm = f0 && f0[4] === 1;
    if (calm) { console.log('CALM -> ', mode); if (mode === 'send') await cmd(page, ['Parley', 'Send'], idx); else await cmd(page, ['Parley', 'Invite'], idx); }
    else if (round === 0) { await cmd(page, ['Parley', 'Offer', 'Rice Ball'], idx); }
    else await cmd(page, ['Parley', 'Soothe'], idx);
    // Kaze
    s = await waitInput(page); if (s.ended) break;
    if (s.labels.includes('Attack')) { if (calm) await cmd(page, ['Guard']); else await cmd(page, ['Parley', 'Hum'], idx); }
    await sleep(500); if (round === 0) await shot('50-parley-round1');
    s = await waitInput(page, 60000); console.log('round', round, JSON.stringify(s.foes), 'pity', JSON.stringify(s.pity));
    if (s.ended) break;
    if (calm) await shot('51-calm-' + round);
  }
  await sleep(2500); await shot('52-after');
  const t0 = Date.now(); while ((await activeScenes(page)).includes('Battle') && Date.now() - t0 < 20000) { await press(page, 'Enter', 50); await sleep(300); if (Date.now() - t0 > 4000 && !globalThis.sh) { globalThis.sh = 1; await shot('53-results'); } }
  console.log('state', await page.evaluate(() => { const $ = window.__S.$; return JSON.stringify({ bonds: $.bonds, items: $.items, frag: $.fragments, bst: $.bestiary, eq: $.actors.mio.equips, pity: $.pity }); }));
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 6));
} catch (e) { console.log('FAIL', e.message); console.log(errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 8)); await page.screenshot({ path: SS + '/5x-fail.png' }); }
await browser.close();
