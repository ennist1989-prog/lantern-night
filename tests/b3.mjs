import { launch, press, sleep, waitScene, newGame, mashUntil, teleport, activeScenes } from './lib.mjs';
const SS = '/workspace/lantern-night/screenshots';
const { browser, page, errors } = await launch();
const shot = async (n) => { await sleep(350); await page.screenshot({ path: `${SS}/${n}.png` }); };
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < 4) $.gainExp(a, 20 * a.level); a.hp = $.param(a, 'mhp'); a.sp = $.param(a, 'msp'); } $.realm = 'far'; $.gain('mochi', 3); $.gain('honey', 2); });
  await teleport(page, 1, 17, 17, 'down'); await sleep(300);
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); window.__bp = m.startBattle('tr_straw_hound_dust_wisp', { random: true, zone: 'z01' }); });
  await waitScene(page, 'Battle', 15000); await sleep(1500);
  await press(page, 'Enter'); await sleep(200);          // Fight
  await press(page, 'ArrowDown'); await press(page, 'ArrowDown'); await press(page, 'Enter'); await shot('42-parley-list');
  await press(page, 'ArrowDown'); await shot('42b-parley-list2');
  await press(page, 'Enter'); await shot('43-target');   // pick a verb -> target
  await press(page, 'ArrowRight'); await shot('43b-target2');
  await press(page, 'Enter'); await sleep(300);
  // Kaze: Attack
  await press(page, 'Enter'); await press(page, 'Enter'); await shot('44-after-cmds');
  await sleep(4000); await shot('45-mid');
  await sleep(3000); await shot('46-mid2');
  // next round: Skill list
  for (let i = 0; i < 12; i++) { const a = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); return b?.cmdWin?.active ? 1 : 0; }); if (a) break; await sleep(500); }
  await press(page, 'Enter'); await press(page, 'ArrowDown'); await press(page, 'Enter'); await shot('47-skill-list');
  await press(page, 'Escape'); await press(page, 'ArrowDown'); await press(page, 'ArrowDown'); await press(page, 'ArrowDown'); await press(page, 'ArrowDown'); await press(page, 'ArrowDown'); await press(page, 'Enter'); await shot('48-item-list');
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 6));
} catch (e) { console.log('FAIL', e.message); console.log(errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 8)); }
await browser.close();
