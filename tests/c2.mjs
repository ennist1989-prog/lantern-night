// New Game blackout: capture frames from pressing New Game until the first narration ends; no house/map pixels may show before the intro text.
import { launch, press, sleep, waitScene, SSDIR } from './lib.mjs';
import { execSync } from 'child_process'; import fs from 'fs';
const tag = process.argv[2] || 'after'; const url = process.argv[3];
const DIR = `${SSDIR}/newgame-${tag}`; execSync(`rm -rf ${DIR} && mkdir -p ${DIR}`);
const { browser, page, errors } = await launch(url);
let fails = 0;
try {
  await waitScene(page, 'Title', 40000); await sleep(1200);
  await page.keyboard.down('Enter'); await sleep(60); await page.keyboard.up('Enter');
  const t0 = Date.now(); const frames = [];
  for (let i = 0; i < 60; i++) {
    const st = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); const act = window.__game.scene.isActive('Map'); return { act, narr: !!(act && m.msg && m.msg.narrating), done: !!(act && m.msg && m.msg.narrDone) }; });
    const f = `${DIR}/f${String(i).padStart(2, '0')}.png`; await page.screenshot({ path: f }); frames.push({ f, ms: Date.now() - t0, ...st });
    if (st.done) break; await sleep(40);
  }
  fs.writeFileSync(DIR + '/frames.json', JSON.stringify(frames));
  const out = execSync(`python3 - <<'P'\nimport json\nfrom PIL import Image\nfr=json.load(open('${DIR}/frames.json'))\nfor x in fr:\n  im=Image.open(x['f']).convert('L').resize((204,156)); px=list(im.getdata()); x['bright']=sum(1 for p in px if p>40)/len(px)\nprint(json.dumps([[x['ms'],x['act'],x['narr'],round(x['bright'],4)] for x in fr]))\nP`).toString();
  const rows = JSON.parse(out); console.log('frames [ms, mapActive, narrating, brightFraction]:'); for (const r of rows) console.log(' ', JSON.stringify(r));
  // frames after the Map scene starts and before narration ends: only narration text may be bright (text < 6% of pixels; the lit house is > 25%)
  const bad = rows.filter((r) => r[1] && r[3] > 0.06);
  console.log(bad.length ? `FAIL ${bad.length} frame(s) show map content before/through the intro text` : 'PASS no house/map content visible before the intro text finished');
  if (bad.length) fails++;
  // advance the narration; afterwards the house must be revealed
  for (let i = 0; i < 40; i++) { if (await page.evaluate(() => window.__game.scene.getScene('Map').msg?.narrDone)) break; await press(page, 'Enter', 50); await sleep(300); }
  await sleep(900); await page.screenshot({ path: DIR + '/reveal.png' });
  const rb = parseFloat(execSync(`python3 -c "from PIL import Image; im=Image.open('${DIR}/reveal.png').convert('L').resize((204,156)); px=list(im.getdata()); print(sum(1 for p in px if p>40)/len(px))"`).toString());
  console.log(rb > 0.2 ? 'PASS house revealed after the intro text (' + rb.toFixed(3) + ')' : 'FAIL house not revealed after intro (' + rb + ')'); if (rb <= 0.2) fails++;
  console.log('errors', errors.filter((e) => !/willReadFrequently|Canvas2D/.test(e)));
} catch (e) { console.log('EXC', e.message); fails++; }
await browser.close(); console.log(fails ? 'FAILS ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
