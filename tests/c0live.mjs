import { launch, sleep, waitScene, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch('https://ennist1989-prog.github.io/lantern-night/');
await waitScene(page, 'Title', 40000); await sleep(1200);
await page.screenshot({ path: SSDIR + '/cursor/live-title-first-load.png' });
const on = await page.evaluate(() => { const w = window.__game.scene.getScene('Title').menu; return w.cursorG.active && w.cursorG.commandBuffer.length > 0; });
console.log('live title cursor drawn', on, errors.filter((e) => !/willReadFrequently|Canvas2D/.test(e)));
await browser.close();
