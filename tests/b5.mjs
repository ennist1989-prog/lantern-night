import { launch, press, sleep, waitScene, newGame, mashUntil, teleport, activeScenes, SSDIR } from './lib.mjs';
import { state, waitInput, pick, target, cmd } from './bdrive.mjs';
const SS = SSDIR;
const { browser, page, errors } = await launch();
const shot = async (n) => { await sleep(250); await page.screenshot({ path: `${SS}/${n}.png` }); };
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; $.setSw('post_lit', true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < 3) $.gainExp(a, 20 * a.level); a.hp = $.param(a, 'mhp'); a.sp = $.param(a, 'msp'); } $.realm = 'far'; });
  await teleport(page, 1, 17, 17, 'down'); await sleep(300);
  await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); m.startBattle('tr_dust_wisp_dust_wisp', { random: true, zone: 'z01' }); });
  await waitScene(page, 'Battle', 15000); await sleep(1200);
  await pick(page, 'Fight'); await cmd(page, ['Skill', 'Lantern Flare'], 0);
  let s = await waitInput(page); console.log('Kaze menu', s.labels.join(','), 'echo', s.echo);
  await cmd(page, ['Guard']);
  s = await waitInput(page, 60000); console.log('after kaze/round', JSON.stringify(s.foes), 'echo', s.echo, s.labels.join(','));
  await shot('95-echo-prompt');
  // dump events log of last round via B? just print states
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 6));
} catch (e) { console.log('FAIL', e.message); await shot('9y-fail'); console.log(errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 6)); }
await browser.close();
