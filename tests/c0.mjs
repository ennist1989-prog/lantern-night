import { launch, sleep, waitScene, SSDIR } from './lib.mjs';
const { browser, page } = await launch();
await waitScene(page, 'Title', 30000); await sleep(1500);
await page.screenshot({ path: SSDIR + '/c0-title-before.png' });
await browser.close();
