import { launch, sleep, waitScene } from './lib.mjs';
const { browser, page } = await launch();
await waitScene(page, 'Title', 30000); await sleep(1500);
await page.screenshot({ path: '/workspace/lantern-night/screenshots/c0-title-before.png' });
await browser.close();
