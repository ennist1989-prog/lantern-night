import { launch, sleep, press, hold, waitScene, waitFor, activeScenes, ev, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `${SSDIR}/${n}.png` });
try {
  await waitScene(page, 'Title', 30000); await sleep(800);
  await press(page, 'Enter'); await waitScene(page, 'Map', 15000);
  // mash through intro
  for (let i = 0; i < 80; i++) { const done = await ev(page, () => window.__S.$.sw('intro_done')); if (done) break; await press(page, 'Enter', 60); await sleep(120); if (i === 12) await shot('03-dialogue'); }
  await sleep(1500); await shot('04-after-intro');
  console.log('intro_done', await ev(page, () => ({ sw: window.__S.$.sw('intro_done'), item: window.__S.$.has('lantern'), map: window.__S.$.map })));
  // walk down & out the door (6,7) -> (6,9)
  await hold(page, 'ArrowDown', 700); await sleep(900);
  console.log('after walk', await ev(page, () => ({ map: window.__S.$.map })));
  await waitFor(page, () => window.__S.$.map.id === 1, null, 8000).catch(() => console.log('not in village yet'));
  await sleep(1800); await shot('05-village');
  console.log('map', await ev(page, () => window.__S.$.map), await activeScenes(page));
} catch (e) { console.log('FAIL', e.message); await shot('fail'); }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
