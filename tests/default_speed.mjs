// Plays the opening at the SHIPPED default settings (Classic walk 267 ms/tile, Text Speed "Normal"),
// not the brisk/fast pace lib.mjs forces for the other e2e tests: New Game -> intro -> light the plaza post
// -> Shift to the Far Shore -> walk to Kaze tile by tile -> talk until he joins.
import { launch, sleep, press, newGame, mashUntil, teleport, ev, SSDIR } from './lib.mjs';
const { browser, page, errors } = await launch(undefined, { defaultSpeed: true });
const shot = (n) => page.screenshot({ path: `${SSDIR}/${n}.png` });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pos = () => ev(page, () => { const m = window.__game.scene.getScene('Map'); return [m.player?.tx, m.player?.ty]; });
try {
  const st = await ev(page, () => ({ ls: localStorage.getItem('lotfs.settings') }));
  ok(st.ls === null, 'no test settings injected (localStorage lotfs.settings unset)');
  await newGame(page);
  const s = await ev(page, () => { const d = window.__S.Settings.data; return { walk: d.walkSpeed, text: d.textSpeed, auto: d.autoBattle, msgAuto: d.msgAuto }; });
  ok(s.walk === 'classic' && s.text === 1, 'running at defaults: ' + JSON.stringify(s));
  ok(await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 200), 'intro finishes at default text speed');
  await sleep(600); await teleport(page, 1, 16, 17, 'up'); await sleep(800);
  await press(page, 'Enter'); await sleep(300);
  ok(await ev(page, () => !!window.__game.scene.getScene('Map')?.msg?.busy), 'Lantern Post dialogue opens');
  await shot('ds-01-post-dialog');
  ok(await mashUntil(page, () => window.__S.$.sw('post_lit'), null, 120), 'plaza Lantern Post lit via its dialogue');
  // The post's dialogue keeps typing (at default speed) after post_lit is set; advance it until the map is free again.
  const free = () => ev(page, () => { const m = window.__game.scene.getScene('Map'); return !!m && m.ready && !m.msg.busy && !m.interp.running && !m.transitioning && window.__game.scene.getScenes(true).length === 1; });
  for (let i = 0; i < 120 && !(await free()); i++) { await press(page, 'Enter', 60); await sleep(250); }
  ok(await free(), 'post dialogue finished, map free');
  await sleep(500);
  let far = false;
  for (let i = 0; i < 3 && !far; i++) { await press(page, 'q'); for (let k = 0; k < 40 && !far; k++) { await sleep(100); far = (await ev(page, () => window.__S.$.realm)) === 'far'; } }
  await sleep(1500);   // let the Shift effect finish before walking
  ok(far, 'Shift to the Far Shore');
  // Walk right one tile at a time at Classic pace and time it.
  const [x0, y0] = await pos(); const t0 = Date.now(); let steps = 0;
  while ((await pos())[0] < 18 && steps < 6) { await page.keyboard.down('ArrowRight'); await sleep(60); await page.keyboard.up('ArrowRight'); const tx = (await pos())[0]; for (let i = 0; i < 20 && (await pos())[0] === tx; i++) await sleep(25); await sleep(350); steps++; }
  const [x1, y1] = await pos(); const per = (Date.now() - t0) / Math.max(1, x1 - x0);
  ok(x1 === 18 && y1 === y0, `walked ${x0},${y0} -> ${x1},${y1} in ${steps} taps (${Math.round(per)} ms/tile incl. pauses)`);
  const dur = await ev(page, () => window.__game.scene.getScene('Map').moveDur(false));
  ok(dur === 267, 'Classic walk step is 267 ms/tile (got ' + dur + ')');
  await press(page, 'ArrowRight', 60); await sleep(400); await press(page, 'Enter'); await sleep(500); await shot('ds-02-kaze');
  ok(await mashUntil(page, () => window.__S.$.sw('kaze_joined'), null, 200), 'Kaze joins after the full default-speed conversation');
  ok((await ev(page, () => window.__S.$.party)).includes('kaze'), 'Kaze in party');
  await shot('ds-03-joined');
} catch (e) { ok(false, e.message); await shot('ds-fail'); }
const errs = errors.filter((e) => !e.includes('willReadFrequently') && !/sentry/i.test(e));
ok(!errs.some((e) => e.startsWith('PAGEERROR')), 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' / ') : ''));
await browser.close();
console.log(fails ? `default_speed: ${fails} FAIL` : 'default_speed: all PASS'); process.exit(fails ? 1 : 0);
