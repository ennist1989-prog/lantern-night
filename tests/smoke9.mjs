import { launch, sleep, press, hold, waitScene, waitFor, activeScenes, ev, newGame, mashUntil, teleport, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `${SSDIR}/${n}.png` });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'));
  await sleep(500); await teleport(page, 1, 8, 6, 'down');
  await page.evaluate(() => { const S = window.__S; S.$.addActor('kaze'); S.$.addActor('daigo'); S.$.addBond('straw_hound'); S.$.addBond('dust_wisp'); S.$.bst('straw_hound').seen = true; S.$.bst('straw_hound').parleyed = true; S.$.bst('straw_hound').weak = ['near:flame','far:lumen']; S.$.bst('dust_wisp').seen = true; S.$.actors.mio.exp += 0; S.$.gold = 300; S.$.gain('rice_ball', 2); S.$.gain('mochi', 2); S.$.gain('hush_bell', 1); S.$.gain('garb2', 1); S.$.gain('lantern_oil', 1); S.$.quests.main = { stage: 2, done: false }; S.$.quests.chime = { stage: 0, done: false }; S.$.quests.wisps = { stage: 0, done: false }; S.$.bst('dust_wisp').seen = true; S.$.bst('dust_wisp').weak = ['flame']; S.$.bst('paper_lantern').seen = true; S.$.actors.mio.hp = 20; S.$.tutorialsShown.parley = true; });
  const tests = [['Item', 0, 0], ['Skill', 1, 1], ['Equip', 2, 1], ['Status', 3, 1], ['Formation', 4, 0], ['Quests', 5, 0], ['Bonds', 6, 0], ['Bestiary', 7, 0], ['Notes', 8, 0], ['Options', 9, 0], ['Save', 10, 0]];
  for (const [name, down, pick] of tests) {
    await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(500);
    for (let i = 0; i < down; i++) { await press(page, 'ArrowDown'); await sleep(60); }
    await press(page, 'Enter'); await sleep(500);
    if (pick) { await press(page, 'Enter'); await sleep(500); }
    if (name === 'Equip') { await press(page, 'Enter'); await sleep(400); }
    await shot('70-' + name.toLowerCase());
    await page.evaluate(() => { const g = window.__game; g.scene.getScenes(true).forEach((s) => { if (['SaveLoad'].includes(s.sys.settings.key)) s.close(); }); const m = g.scene.getScene('Menu'); m.close(); });
    await sleep(500);
  }
  console.log('scenes', await activeScenes(page));
} catch (e) { console.log('FAIL', e.message); await shot('fail'); }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
