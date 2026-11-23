// PF2 QA blocker: old stored settings (autoBattle:true, no autoV2 key) must load with Auto Battle OFF, once; an explicit ON after migration stays.
import { launch, sleep, waitScene } from './lib.mjs';
const { browser, page, errors } = await launch(); let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const st = () => page.evaluate(() => ({ live: window.__S.Settings.data.autoBattle, stored: JSON.parse(localStorage.getItem('lotfs.settings') || '{}') }));
try {
  await waitScene(page, 'Title', 30000);
  await page.evaluate(() => localStorage.setItem('lotfs.settings', JSON.stringify({ bgm: 0.5, se: 0.7, textSpeed: 1, battleSpeed: 2, autoBattle: true })));
  for (const n of [1, 2]) { await page.reload(); await waitScene(page, 'Title', 30000); await sleep(300); const r = await st();
    ok(r.live === false && r.stored.autoBattle === false && r.stored.autoV2 === true && r.stored.battleSpeed === 2, `load ${n}: old settings come back with Auto OFF (migrated, other options kept): ` + JSON.stringify(r)); }
  await page.evaluate(() => { const S = window.__S.Settings; S.data.autoBattle = true; S.save(); }); await page.reload(); await waitScene(page, 'Title', 30000); await sleep(300);
  const r = await st(); ok(r.live === true, 'an Options choice of Auto ON after the migration is kept: ' + JSON.stringify(r));
} catch (e) { ok(false, 'exception ' + e.stack); }
console.log(fails ? `FAIL settings_autov2 (${fails})` : 'PASS settings_autov2'); await browser.close(); process.exit(fails ? 1 : 0);
