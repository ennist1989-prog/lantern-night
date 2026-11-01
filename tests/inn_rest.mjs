// Regression (PR #52 review): resting at an inn must fade the screen back in (map 3 Tama's, map 111 Old Hisa's noSave inn).
import fs from 'fs';
import { launch, sleep, press, newGame, mashUntil, teleport } from './lib.mjs';
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
const findInn = (o) => { if (Array.isArray(o)) { for (const v of o) { const r = findInn(v); if (r) return r; } } else if (o && typeof o === 'object') { if (o.c === 'inn') return o; for (const v of Object.values(o)) { const r = findInn(v); if (r) return r; } } return null; };
const { browser, page } = await launch();
const idle = () => { const m = window.__game.scene.getScene('Map'); return m.ready && !m.msg.busy && !m.interp.busy; };
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
for (const [map, x, y] of [[3, 4, 5], [111, 7, 12]]) {
  const inn = findInn(JSON.parse(fs.readFileSync(`public/data/maps/map${String(map).padStart(3, '0')}.json`, 'utf8')).events);
  await teleport(page, map, x, y, 'up'); await sleep(600); await mashUntil(page, idle, null, 20);
  await page.evaluate((c) => { window.__S.$.gold = 999; window.__S.$.actors.forEach?.((a) => { a.hp = 1; }); window.__innDone = false; window.__game.scene.getScene('Map').inn(c).then(() => { window.__innDone = true; }); }, inn);
  for (let i = 0; i < 6 && !(await page.evaluate(() => window.__game.scene.getScene('Map').msg.choiceWin)); i++) { await press(page, 'Enter'); await sleep(250); }
  await press(page, 'Enter');   // "Rest (N G)" is the first option
  await sleep(4000);            // fade out 500 + rest 1200 + fade in 500, no input needed
  const mid = await page.evaluate(() => window.__game.scene.getScene('Map').fader.rect.fillAlpha);
  ok(mid === 0, `map ${map}: faded back in before "Sleep well" (fillAlpha ${mid})`);
  for (let i = 0; i < 40 && !(await page.evaluate(() => window.__innDone)); i++) { await press(page, 'Enter'); await sleep(200); }
  await sleep(500);
  const f = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'), r = m.fader.rect; return { fa: r.fillAlpha, a: r.alpha, done: window.__innDone, gold: window.__S.$.gold, busy: m.msg.busy, ch: !!m.msg.choiceWin, txt: m.msg.win?.list?.map?.((o) => o.text).filter(Boolean).join('/') }; });
  const b64 = (await page.screenshot()).toString('base64');
  const lit = await page.evaluate(async (b) => { const im = new Image(); im.src = 'data:image/png;base64,' + b; await im.decode(); const t = document.createElement('canvas'); t.width = 64; t.height = 48; const x = t.getContext('2d'); x.drawImage(im, 0, 0, 64, 48); const d = x.getImageData(0, 0, 64, 48).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3; return s / (d.length / 4); }, b64);
  ok(f.gold < 999, `map ${map}: Rest was chosen (gold ${f.gold})`);
  ok(f.done && f.fa === 0, `map ${map}: inn rest finished and the screen faded back in (fillAlpha ${f.fa}, done ${f.done}${lit != null ? ', mean luma ' + lit.toFixed(1) : ''})`);
  ok(lit > 20, `map ${map}: screen not black after resting`);
}
await browser.close(); console.log(fails ? `FAIL ${fails}` : 'PASS inn_rest'); process.exit(fails ? 1 : 0);
