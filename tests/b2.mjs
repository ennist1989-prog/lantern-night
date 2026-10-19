import { launch, press, sleep, waitScene, newGame, mashUntil, teleport, activeScenes } from './lib.mjs';
const SS = '/workspace/lantern-night/screenshots';
const troop = process.argv[2] || 'tr_dust_wisp_dust_wisp'; const lvl = +(process.argv[3] || 2); const realm = process.argv[4] || 'far'; const tag = process.argv[5] || 'b2';
const { browser, page, errors } = await launch();
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(([lvl, realm]) => { const $ = window.__S.$; $.setSw('post_lit', true); $.setSw('kaze_joined', true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < lvl) $.gainExp(a, 1); a.exp = Math.max(a.exp, 0); const mh = $.param(a, 'mhp'); a.hp = mh; a.sp = $.param(a, 'msp'); } $.realm = realm; }, [lvl, realm]);
  await teleport(page, 1, 17, 17, 'down');
  await sleep(400);
  await page.evaluate((t) => { const m = window.__game.scene.getScene('Map'); window.__bp = m.startBattle(t, { random: true, zone: 'z01' }); }, troop);
  await waitScene(page, 'Battle', 15000); await sleep(1500);
  let shots = 0; const t0 = Date.now();
  while ((await activeScenes(page)).includes('Battle') && Date.now() - t0 < 150000) {
    await press(page, 'Enter', 60); await sleep(250); if (shots < 8 && (Date.now() - t0) > shots * 7000) { await page.screenshot({ path: `${SS}/${tag}-${shots++}.png` }); }
  }
  console.log('battle over in', Date.now() - t0, 'ms');
  console.log('state', await page.evaluate(() => { const $ = window.__S.$; return JSON.stringify({ lv: $.party.map((p) => $.actors[p].level + ':' + $.actors[p].exp), hp: $.party.map((p) => $.actors[p].hp), gold: $.gold, items: $.items, frag: $.fragments, bonds: $.bonds, wisp: $.v('wisp_count') }); }));
  await sleep(1200); await page.screenshot({ path: `${SS}/${tag}-end.png` });
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 6));
} catch (e) { console.log('FAIL', e.message); console.log(errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 8)); }
await browser.close();
