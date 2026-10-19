import { launch, sleep, press, hold, waitScene, waitFor, activeScenes, ev, newGame, mashUntil, teleport } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `screenshots/${n}.png` });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'));
  await sleep(600); await teleport(page, 1, 16, 17, 'up');
  await sleep(1500); await shot('06-plaza-near');
  await press(page, 'Enter'); await sleep(500); await mashUntil(page, () => window.__S.$.sw('post_lit'), null, 40); await sleep(1500);
  console.log('post_lit', await ev(page, () => ({ lit: window.__S.$.sw('post_lit'), q: window.__S.$.quests, lumen: window.__S.$.lumen })));
  await shot('07-post-lit');
  await sleep(5000);
  await press(page, 'q'); await sleep(1500); await shot('08-far-shore');
  console.log('realm', await ev(page, () => ({ r: window.__S.$.realm, l: window.__S.$.lumen })));
  // walk to kaze at (19,17): we are at (16,17); go right 2 tiles -> (18,17), face right and talk
  await hold(page, 'ArrowRight', 380); await sleep(500);
  console.log('pos', await ev(page, () => window.__S.$.map));
  await press(page, 'Enter'); await sleep(500); await shot('09-kaze-talk');
  await mashUntil(page, () => window.__S.$.sw('kaze_joined'), null, 60); await sleep(1500);
  console.log('party', await ev(page, () => ({ p: window.__S.$.party, sw: window.__S.$.sw('kaze_joined') })));
  await shot('10-kaze-joined');
} catch (e) { console.log('FAIL', e.message); await shot('fail'); }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
