import { launch, sleep, press, hold, waitScene, waitFor, activeScenes, ev, newGame, mashUntil, teleport, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `${SSDIR}/${n}.png` });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'));
  await sleep(500); await teleport(page, 1, 8, 6, 'down');
  await page.evaluate(() => { const S = window.__S; S.$.addActor('kaze'); S.$.addActor('daigo'); S.$.gold = 300; S.$.gain('onigiri', 2); S.$.gain('hush_bell', 1); S.$.gain('brass_lantern', 1); S.$.quests.main = { stage: 2, done: false }; S.$.quests.chime = { stage: 0, done: false }; S.$.bst('dust_wisp').seen = true; S.$.bst('dust_wisp').weak = ['flame']; S.$.actors.mio.hp = 20; S.$.tutorialsShown.parley = true; });
  await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(800); await shot('20-menu');
  const items = ['Item', 'Skill', 'Equip', 'Status', 'Formation', 'Quests', 'Bestiary', 'Notes', 'Options'];
  let idx = 0;
  for (const name of items) {
    await press(page, 'Enter'); await sleep(500);
    if (['Skill', 'Equip', 'Status'].includes(name)) { await press(page, 'Enter'); await sleep(500); }
    await shot('21-menu-' + name.toLowerCase());
    if (name === 'Item') { await press(page, 'Enter'); await sleep(300); await shot('21b-item-target'); await press(page, 'Enter'); await sleep(300); }
    await press(page, 'x'); await sleep(250); await press(page, 'x'); await sleep(250); await press(page, 'x'); await sleep(250);
    const act = await activeScenes(page); if (!act.includes('Menu')) { console.log('menu closed after', name, act); await press(page, 'x'); break; }
    await press(page, 'ArrowDown'); await sleep(200);
  }
  console.log('scenes', await activeScenes(page));
} catch (e) { console.log('FAIL', e.message); await shot('fail'); }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
