import { launch, sleep, press, waitScene, waitFor, activeScenes, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch();
try {
  await waitScene(page, 'Title', 30000); await sleep(1500);
  await page.screenshot({ path: SSDIR + '/01-title.png' });
  console.log('title ok', await activeScenes(page));
  await press(page, 'Enter'); await waitScene(page, 'Map', 15000); await sleep(3500);
  await page.screenshot({ path: SSDIR + '/02-intro.png' });
  console.log('map ok', await activeScenes(page));
} catch (e) { console.log('FAIL', e.message); await page.screenshot({ path: SSDIR + '/fail.png' }); }
console.log(errors.slice(0, 15).join('\n'));
await browser.close();
