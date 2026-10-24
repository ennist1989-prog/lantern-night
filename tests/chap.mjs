// B2: chapter advances at story transitions, old saves infer it, save slots show it.
import { launch, sleep, newGame, waitScene } from './lib.mjs';
import fs from 'fs';
const { browser, page, errors } = await launch(process.argv[2]);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
try {
  const m4 = JSON.stringify(JSON.parse(fs.readFileSync('public/data/maps/map004.json', 'utf8'))); const m6 = JSON.stringify(JSON.parse(fs.readFileSync('public/data/maps/map006.json', 'utf8')));
  ok(/"key_got"[^\]]*?\{"c":"chapter","n":2\}/.test(m4), 'Well: Shrine Key win sets chapter 2');
  ok(/"boss_done"[^\]]*?\{"c":"chapter","n":3\}/.test(m6), 'Bell-Keeper win sets chapter 3');
  await newGame(page); await sleep(400);
  const r = await page.evaluate(async () => { const { $, SaveManager } = window.__S; const m = window.__game.scene.getScene('Map'); const o = { start: $.chapter };
    await m.interp.exec([{ c: 'chapter', n: 2 }], {}); o.after2 = $.chapter; await m.interp.exec([{ c: 'chapter', n: 1 }], {}); o.noRegress = $.chapter; await m.interp.exec([{ c: 'chapter', n: 3 }], {}); o.after3 = $.chapter;
    SaveManager.save(1); o.meta1 = SaveManager.meta(1).chapter;
    // a v2 save written before the fix: chapter stuck at 1 but the Well is done
    const d = JSON.parse(SaveManager.snapshotString()); d.v = 2; d.game.ver = 2; d.game.chapter = 1; d.game.switches.key_got = true; d.game.switches.boss_done = false; SaveManager.write(2, d); o.meta2 = SaveManager.meta(2).chapter;
    SaveManager.load(2); o.loaded2 = $.chapter; o.ver = $.ver;
    return o; });
  console.log(JSON.stringify(r));
  ok(r.start === 1 && r.after2 === 2 && r.noRegress === 2 && r.after3 === 3, 'chapter command advances and never regresses');
  ok(r.meta1 === 3 && r.meta2 === 2, 'save-slot meta carries chapter (old save inferred 2)'); ok(r.loaded2 === 2 && r.ver === 3, 'loading v2 save migrates chapter -> 2, ver 3');
  await page.evaluate(() => { window.__game.scene.getScene('Map').openSave(); }); await waitScene(page, 'SaveLoad'); await sleep(700);
  fs.mkdirSync('/workspace/lantern-night/screenshots/b2', { recursive: true }); await page.screenshot({ path: '/workspace/lantern-night/screenshots/b2/save_slots_chapter.png' });
  const txt = await page.evaluate(() => window.__game.scene.getScene('SaveLoad').children.list.flatMap((c) => (c.list || [c])).flatMap((c) => (c.list || [c])).filter((c) => c.type === 'Text').map((c) => c.text));
  ok(txt.includes('Ch 3') && txt.includes('Ch 2'), 'save slots show Ch 3 / Ch 2');
  ok(errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, 'no console errors ' + JSON.stringify(errors.slice(0, 3)));
} catch (e) { console.log('FAIL exception', e); fails++; }
await browser.close(); console.log(fails ? `CHAP ${fails} FAIL` : 'CHAP ALL PASS'); process.exit(fails ? 1 : 0);
