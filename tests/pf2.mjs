// Playtest fixes 2 regressions (browser): #1 stair-foot Gate Guard trigger, #3 one-turn Auto, #4 Warden 'Not yet' push-back + win opens the Far crossing.
import { launch, sleep, press, newGame, mashUntil, teleport, waitFor, waitScene } from './lib.mjs';
const { browser, page, errors } = await launch(); let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; return c; };
const free = () => page.evaluate(() => window.__game.scene.getScene('Map').isFree());
const pos = () => page.evaluate(() => { const p = window.__game.scene.getScene('Map').player; return { x: p.tx, y: p.ty, dir: p.dir, realm: window.__S.$.realm }; });
const shown = () => page.evaluate(() => (window.__shown || []).join('|'));
// answer a 2-option choice: idx 0 or 1; mashes Enter through any text first
async function answer(idx) { for (let i = 0; i < 80; i++) { const c = await page.evaluate(() => !!window.__game.scene.getScene('Map').msg.choiceWin); if (c) break; await sleep(350); if (await page.evaluate(() => !!window.__game.scene.getScene('Map').msg.choiceWin)) break; await press(page, 'Enter', 40); await sleep(350); }
  await sleep(300);
  await page.evaluate((i) => { const cw = window.__game.scene.getScene('Map').msg.choiceWin; if (cw) cw.onOk(cw.items[i], i); }, idx); await sleep(400); }
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && window.__game.scene.getScene('Map').isFree());
  await page.evaluate(() => { const $ = window.__S.$; $.tutorialsShown.ctl_done = true; const m = window.__game.scene.getScene('Map'); const o = m.msg.show.bind(m.msg); m.msg.show = (f, n, t, op) => { window.__shown = window.__shown || []; window.__shown.push(String(n) + ':' + String(t)); return o(f, n, t, op); }; });
  // ---- #1 Gate Guard: right of the stairs, and stepping toward the first stair (from the side path) calls him out + pushes back
  await page.evaluate(() => { window.__S.$.realm = 'near'; }); await teleport(page, 1, 16, 3, 'right');
  const g = await page.evaluate(() => window.__game.scene.getScene('Map').evs.find((e) => e.id === 16));
  ok(g && g.char.tx === 20 && g.char.ty === 3, 'Gate Guard (event 16) stands right of the stairs at (20,3)');

  await page.evaluate(() => { window.__shown = []; }); await page.keyboard.down('ArrowRight'); await sleep(260); await page.keyboard.up('ArrowRight');
  await mashUntil(page, () => window.__game.scene.getScene('Map').isFree() && !window.__game.scene.getScene('Map').player.moving, null, 40); let p = await pos();
  ok(/Gate Guard/.test(await shown()), 'stair approach (17,3) triggers the Gate Guard message: ' + (await shown()).slice(0, 80));
  ok(p.x === 16 && p.y === 3, 'locked: pushed back off the stair foot to (16,3), got ' + JSON.stringify(p));
  ok(await free(), 'map is free afterwards (no soft-lock)');
  // ---- #4 Warden 'Not yet' (Far): turned around and walked back to the east side of the boulders
  for (const row of [22, 24]) {
    await page.evaluate(() => { window.__S.$.realm = 'far'; window.__game.scene.getScene('Map').applyRealmVisuals?.(); }); await teleport(page, 1, 11, row, 'left');
    await page.keyboard.down('ArrowLeft'); await sleep(200); await page.keyboard.up('ArrowLeft'); await answer(1);
    await mashUntil(page, () => window.__game.scene.getScene('Map').isFree() && !window.__game.scene.getScene('Map').player.moving, null, 40); p = await pos();
    if (p.x < 11) console.log('DBG', JSON.stringify(await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return { sc: window.__game.scene.getScenes(true).map((x) => x.sys.settings.key), busy: m.interp.busy, msg: m.msg.busy, ch: !!m.msg.choiceWin, ov: !!m.overlay, tr: m.transitioning, shown: (window.__shown || []).slice(-4) }; })));
    ok(p.x >= 11 && p.y === row && p.dir === 'right' && p.realm === 'far', `row ${row}: 'Not yet' puts Mio back east of the boulders, facing away: ` + JSON.stringify(p));
    ok(await free(), `row ${row}: free after 'Not yet'`);
    await page.keyboard.down('ArrowRight'); await sleep(250); await page.keyboard.up('ArrowRight'); await sleep(300); const q = await pos(); ok(q.x > p.x || q.x === p.x + 0 && false || q.x >= 12, `row ${row}: can walk on east (not a dead end) ` + JSON.stringify(q));
  }
  // ---- #4 Face the Warden and win -> the Far crossing opens (saved switch); Near boulder stays
  await page.evaluate(() => { const $ = window.__S.$; $.addActor && !$.party.includes?.('kaze') && $.addActor('kaze'); }); await teleport(page, 1, 11, 23, 'left');
  await teleport(page, 1, 11, 22, 'left'); await page.keyboard.down('ArrowLeft'); await sleep(200); await page.keyboard.up('ArrowLeft'); await answer(0);
  await mashUntil(page, () => window.__game.scene.isActive('Battle'), null, 80); await sleep(1500);
  for (let i = 0; i < 200 && await page.evaluate(() => window.__game.scene.isActive('Battle')); i++) {
    await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); if (b?.B) for (const f of b.B.foes) if (f.hp > 1) f.hp = 1; const c = b?.cmdWin; if (c?.active) { const it = c.items.find((x) => x.data === 'auto'); if (it) c.onOk(it); } });
    await press(page, 'Enter', 50); await sleep(150); }
  await mashUntil(page, () => window.__S.$.sw('warden_done') && window.__game.scene.getScene('Map').isFree(), null, 150);
  ok(await page.evaluate(() => window.__S.$.sw('warden_done')), 'Warden beaten: warden_done set (saved switch)');
  await page.evaluate(() => { window.__S.$.realm = 'far'; }); await teleport(page, 1, 12, 23, 'left');
  await page.keyboard.down('ArrowLeft'); await sleep(900); await page.keyboard.up('ArrowLeft'); await sleep(400); p = await pos();
  ok(p.x <= 9 && p.realm === 'far', 'after the win Mio walks through the boulder line on the Far Shore: ' + JSON.stringify(p));
  const saved = await page.evaluate(() => { const S = window.__S; const d = JSON.parse(JSON.stringify(S.$.switches || {})); return d.warden_done ?? S.$.sw('warden_done'); }); ok(!!saved, 'warden_done is in the switch table that saves persist');
  // ---- #3 Auto is one turn only (ordinary fight)
  await page.evaluate(() => { const { $, Settings } = window.__S; Settings.data.autoBattle = false; Settings.data.battleSpeed = 2; $.healAll?.(); const m = window.__game.scene.getScene('Map'); m.interp.running++; m.startBattle('tr_hearth_wisp', {}).finally(() => m.interp.running--); });
  await waitScene(page, 'Battle', 20000);
  await waitFor(page, () => window.__game.scene.getScene('Battle').cmdWin?.active && window.__game.scene.getScene('Battle').cmdWin.items.some((i) => i.data === 'auto'), null, 30000);
  const lab = await page.evaluate(() => window.__game.scene.getScene('Battle').cmdWin.items.find((i) => i.data === 'auto').label); ok(lab === 'Auto (1 turn)', 'menu offers "Auto (1 turn)": ' + lab);
  const r0 = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); b.B.foes.forEach((f) => { f.mhp = f.hp = 99999; }); const it = b.cmdWin.items.find((i) => i.data === 'auto'); b.cmdWin.onOk(it); return { round: b.B.round, autoOn: b.autoOn }; });
  ok(r0.autoOn, 'Auto runs for the picked round');
  await waitFor(page, () => { const b = window.__game.scene.getScene('Battle'); return b.B.ended || (b.cmdWin.active && b.cmdWin.items.some((i) => i.data === 'auto')); }, null, 60000);
  const r1 = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); return { round: b.B.round, autoOn: b.autoOn, menu: b.cmdWin.active, setting: window.__S.Settings.data.autoBattle, stored: JSON.parse(localStorage.getItem('lotfs.settings') || '{}').autoBattle }; });
  ok(r1.menu && !r1.autoOn && r1.round > r0.round, 'next round the manual command menu is back, Auto off: ' + JSON.stringify(r1));
  ok(!r1.setting && !r1.stored, 'battle-menu Auto never saves Auto Battle ON');
  await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); b.B.foes.forEach((f) => { f.hp = 0; }); });
} catch (e) { ok(false, 'exception ' + e.stack); }
const pe = errors.filter((e) => /PAGEERROR/.test(e)); ok(pe.length === 0, 'no page errors ' + JSON.stringify(pe.slice(0, 3)));
console.log(fails ? `FAIL pf2 (${fails})` : 'PASS pf2'); await browser.close(); process.exit(fails ? 1 : 0);
