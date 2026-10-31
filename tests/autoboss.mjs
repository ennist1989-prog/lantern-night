// B3: a boss fight suspends Auto Battle for that fight only; the saved setting is untouched.
import { launch, sleep, newGame, waitScene, mashUntil } from './lib.mjs';
import { waitInput } from './bdrive.mjs';
const { browser, page, errors } = await launch(process.argv[2]);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const S = window.__S.Settings; S.data.autoBattle = true; S.save(); window.__game.scene.getScene('Map').startBattle('boss_bell_keeper', { boss: true, noEscape: true }); });
  await waitScene(page, 'Battle', 15000); await waitInput(page, 40000); await sleep(500);
  const r = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); const S = window.__S.Settings; const stored = () => JSON.parse(localStorage.getItem('lotfs.settings') || '{}').autoBattle;
    const o = { boss: !!b.B.bossDef, autoOn: b.autoOn, setting: S.data.autoBattle, stored: stored(), label: b.cmdWin.items.map((i) => i.label).find((l) => /^Auto/.test(l)) };
    b.setAuto(true); o.toggledOn = b.autoOn; b.setAuto(false); o.toggledOff = b.autoOn; o.settingAfter = S.data.autoBattle; o.storedAfter = stored(); return o; });
  console.log(JSON.stringify(r));
  ok(r.boss && r.autoOn === false && r.label === 'Auto (1 turn)', 'boss fight starts with Auto suspended (menu offers Auto (1 turn); PF2 #3)');
  ok(r.setting === true && r.stored === true, 'saved Auto Battle setting still ON during the boss');
  ok(r.toggledOn === true && r.toggledOff === false && r.settingAfter === true && r.storedAfter === true, 'in-boss Auto toggles are temporary (not saved)');
  ok(errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, 'no console errors ' + JSON.stringify(errors.filter((e) => !/willReadFrequently/.test(e)).slice(0, 3)));
} catch (e) { console.log('FAIL exception', e); fails++; }
await browser.close(); console.log(fails ? `AUTOBOSS ${fails} FAIL` : 'AUTOBOSS ALL PASS'); process.exit(fails ? 1 : 0);
