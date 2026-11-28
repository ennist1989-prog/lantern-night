import { launch, sleep, press, waitScene, activeScenes, newGame, mashUntil, teleport, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `${SSDIR}/${n}.png` });
const cases = JSON.parse(process.argv[2] || '[]'); // [[troop, miolv, kazelv, daigolv, auto]]
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'));
  await sleep(500); await teleport(page, 1, 8, 6, 'down');
  for (const [troop, lv, party, realm] of cases) {
    const t0 = Date.now(); setTimeout(() => shot('bsim-' + troop).catch(()=>{}), 25000);
    await page.evaluate(async ([troop, lv, party, realm]) => {
      const S = window.__S, $ = S.$;
      $.party = []; for (const id of party) { $.addActor(id); const a = $.actors[id]; a.level = 1; $.gainExp(a, 1e9 * 0 + 0); while (a.level < lv) { a.level++; } a.skills = []; $.refreshSkills(a); a.hp = $.param(a, 'mhp'); a.sp = $.param(a, 'msp'); a.states = []; }
      $.realm = realm || 'near'; $.lumen = 100; $.tutorialsShown.parley = true; $.tutorialsShown.shift = true;
      S.Settings.data.autoBattle = true; S.Settings.data.battleSpeed = 2;
      const m = window.__game.scene.getScene('Map');
      setTimeout(() => { window.__dbg = 1; }, 0);
      window.__bp = null; m.startBattle(troop, {}).then((r) => { window.__bp = r; });
      return { started: true };
    }, [troop, lv, party, realm]);
    const T = Date.now(); while (Date.now() - T < 150000) { const x = await page.evaluate(() => window.__bp); if (x) break; await press(page, 'Enter', 40); await sleep(150); }
    const r2 = await page.evaluate(async () => { const S = window.__S, $ = S.$; const res = window.__bp;
      const hp = $.party.map((id) => id + ':' + $.actors[id].hp + '/' + $.param($.actors[id], 'mhp') + ' L' + $.actors[id].level);
      return { res, hp };
    });
    const r = r2;
    console.log(troop, 'L' + lv, party.join('+'), realm || 'near', JSON.stringify(r), Math.round((Date.now() - t0) / 1000) + 's');
    await sleep(300);
    // dismiss any results windows
    for (let i = 0; i < 4; i++) { if ((await activeScenes(page)).includes('Battle')) await press(page, 'Enter'); }
  }
} catch (e) { console.log('FAIL', e.message); await shot('fail'); }
console.log(errors.filter(e => !e.includes('willReadFrequently')).slice(0, 15).join('\n'));
await browser.close();
