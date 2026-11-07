import { launch, press, hold, sleep, waitScene, newGame, mashUntil, teleport, activeScenes, bkFlow, SSDIR } from './lib.mjs';
const SS = SSDIR;
const { browser, page, errors } = await launch();
const shot = (n) => page.screenshot({ path: `${SS}/${n}.png` });
try {
  await newGame(page);
  await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  await page.evaluate(() => { const $ = window.__S.$; for (const s of ['post_lit', 'kaze_joined', 'elder_told', 'daigo_joined', 'key_got', 'gate_open', 'ped_solved', 'warden_done', 'parley_taught']) $.setSw(s, true); $.addActor('kaze'); for (const id of $.party) { const a = $.actors[id]; while (a.level < 3) $.gainExp(a, 20 * a.level); a.hp = $.param(a, 'mhp'); a.sp = $.param(a, 'msp'); } $.gain('shrine_bell_clapper', 1); $.realm = 'near'; $.gain('rice_ball', 3); });
  await teleport(page, 6, 8, 6, 'up'); await sleep(600); await shot('80-summit');
  await press(page, 'Enter'); await sleep(400);
  const flow = bkFlow(page);
  let fights = 0; const t0 = Date.now(); let cheated = false; let retried = false; let sawRetry = true;
  while (Date.now() - t0 < 420000) {
    const sc = await activeScenes(page);
    const fp = await flow.step(); if (!retried && /The Lantern dims/.test(fp.shown)) { retried = true; console.log('RETRY PROMPT (defeat -> Retry the fight)'); await sleep(300); await shot('83-retry-prompt'); }
    if (Date.now() - (globalThis.lastLog || 0) > 30000) { globalThis.lastLog = Date.now(); console.log('t+' + Math.round((Date.now() - t0) / 1000) + 's', sc.join('+'), 'map', fp.map, 'retried', retried, 'seen', JSON.stringify(flow.seen)); }
    if (flow.done()) { await sleep(1500); await flow.step(); break; }   // Ch3 handoff: epilogue -> Sachi's house -> Ch3 opener (was: Credits)
    if (!sc.includes('Battle') && fights > 3) { const lines = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return (m?.msg?.win?.children?.list || []).filter(c => c.text).map(c => c.text).join('|'); }); if (lines.includes('Retry')) { await shot('83-retry-prompt'); console.log('RETRY PROMPT'); await press(page, 'Enter', 60); await sleep(2500); await shot('84-after-retry'); console.log('after retry', await page.evaluate(() => JSON.stringify({ map: window.__S.$.map, hp: window.__S.$.party.map(p => window.__S.$.actors[p].hp) }))); retried = true; } }   // then win the retry and follow the Ch3 handoff
    if (sc.includes('Battle')) { fights++; if (fights > 40 && !cheated) { } 
      const inb = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); return b?.B ? [b.B.round, b.B.foes[0].hp] : null; });
      // L3 vs the L5 Keeper can stall for minutes under Enter-mash; hasten the first loss so the Retry prompt is reached (the test is about Retry -> win -> aftermath)
      if (!retried && !globalThis.weakened && inb && inb[0] >= 2) { globalThis.weakened = 1; await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); for (const p of b.B.party) { p.hp = 1; } }); }
      if (retried && !cheated && inb && inb[0] >= 2) { await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); b.B.foes[0].hp = 20; b.B.foes[0].dispHp = 20; }); cheated = true; }
    }
    const txt = await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return m?.msg?.choiceOpen ? 'choice' : ''; });
    await press(page, 'Enter', 50); await sleep(200);
    if (fights === 0 && Date.now() - t0 > 3000 && !globalThis.s1) { globalThis.s1 = 1; await shot('81-dialog'); }
    if (!sawRetry && (await page.evaluate(() => (window.__S.$.fades || 0) > 0 || !!window.__retryShown))) sawRetry = true;
  }
  console.log('scenes', await activeScenes(page));
  const v = flow.verdict(); if (!retried) { v.ok = false; v.seen.push('no-retry-prompt'); } console.log((v.ok ? 'PASS' : 'FAIL') + ' Bell-Keeper aftermath flow', JSON.stringify(v.seen)); if (!v.ok) process.exitCode = 1;
  await shot('82-end');
  console.log('errors', errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 6));
} catch (e) { console.log('FAIL', e.message); console.log(errors.filter((e) => !e.includes('willReadFrequently')).slice(0, 8)); await shot('8x-fail'); }
await browser.close();
