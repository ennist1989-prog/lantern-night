// Ch3: The Whispering Forest — story flow through all four maps (dialogue auto-advanced), real boss battles, shops, Status fit, screenshots.
import { launch, sleep, newGame, waitScene, teleport, press, mashUntil } from './lib.mjs';
import { waitInput } from './bdrive.mjs';
import fs from 'fs';
const DIR = process.env.SS ? process.env.SS + '/ch3' : '/workspace/lantern-night/screenshots/ch3'; fs.mkdirSync(DIR, { recursive: true });
const { browser, page, errors } = await launch(process.argv[2]);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const shot = (n) => page.screenshot({ path: `${DIR}/${n}.png` });
const S = (k) => page.evaluate((k) => window.__S.$.sw(k), k);
const idle = async (ms = 20000) => { const t = Date.now(); await sleep(250); while (Date.now() - t < ms) { if (await page.evaluate(() => { const m = window.__game.scene.getScene('Map'); return m.ready && !m.interp.busy && !m.transitioning && window.__game.scene.isActive('Map') && !m.evs.some((e) => e.running); })) { await sleep(200); if (await page.evaluate(() => !window.__game.scene.getScene('Map').interp.busy)) return; } await sleep(120); } throw new Error('idle timeout'); };
// fast mode: dialogue resolves instantly (text logged), choices pick by regex queue (else first option), battles/shops recorded
const fast = (on) => page.evaluate((on) => { const m = window.__game.scene.getScene('Map'); const w = window; w.__log = w.__log || []; w.__pick = w.__pick || [];
  if (on) { if (!w.__orig) w.__orig = { show: m.msg.show, narrate: m.msg.narrate, choice: m.msg.choice, battle: m.startBattle, shop: m.openShop };
    m.msg.show = async (f, n, t) => { w.__log.push([f, n, t]); }; m.msg.narrate = async (l) => { w.__log.push(['narr', null, l.join(' / ')]); };
    m.msg.choice = async (opts) => { const re = w.__pick.length ? new RegExp(w.__pick.shift()) : null; const i = re ? Math.max(0, opts.findIndex((o) => re.test(o))) : 0; w.__log.push(['choice', opts[i], opts.join('|')]); return i; };
    m.startBattle = async (t, o) => { w.__log.push(['battle', t, '']); if ((w.__lose || []).includes(t)) { w.__lose = w.__lose.filter((x) => x !== t); window.__S.$.realm = 'far'; /* wiped after Shifting to the Far Shore */ await m.handleDefeat(true, o || {}); return 'lose'; } return 'win'; }; m.openShop = async (c) => { w.__log.push(['shop', c.name || '', (c.items || []).join(',')]); };
  } else if (w.__orig) Object.assign(m.msg, { show: w.__orig.show, narrate: w.__orig.narrate, choice: w.__orig.choice }), (m.startBattle = w.__orig.battle), (m.openShop = w.__orig.shop); }, on);
const realm = (r) => page.evaluate((r) => { const m = window.__game.scene.getScene('Map'); window.__S.$.realm = r; m.applyRealmVisuals(); m.refreshEvents(); }, r);
const run = async (x, y, r, picks = []) => { if (r) await realm(r); await page.evaluate((p) => { window.__pick = p; }, picks);
  const found = await page.evaluate(async ([x, y]) => { const m = window.__game.scene.getScene('Map'); const e = m.evs.find((e) => e.data.x === x && e.data.y === y && e.page); if (!e) return false; m.player.tx = x; m.player.ty = y + 1 < m.mapData.h ? y + 1 : y; await m.triggerEvent(e); return true; }, [x, y]);
  if (!found) console.log('  (no active event at', x, y, r, ')'); await idle(); return found; };
const log = () => page.evaluate(() => { const l = window.__log; window.__log = []; return l; });
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').interp.busy, null, 120); await fast(true); await idle(30000);
  // a finished Chapter 2: every story switch maps 1-6 ever set
  const prior = JSON.parse(fs.readFileSync('/tmp/ln_prior_sw.json', 'utf8'));
  await page.evaluate((p) => { const { $ } = window.__S; for (const k of p) $.setSw(k, true); $.setSw('ch3_started', false); $.gain('lantern', 1); $.chapter = 3; $.gold = 2000; $.lumen = 60; }, prior);
  // --- the Ch2 -> Ch3 handoff: summit autorun takes us home, Sachi opens Chapter 3
  await teleport(page, 6, 10, 10); await idle(30000); await sleep(800); await idle(30000);
  let L = await log(); const mapNow = await page.evaluate(() => window.__S.$.map.id);
  ok(mapNow === 2 && await S('ch3_started'), 'summit handoff -> Sachi’s house -> Chapter 3 opener (map ' + mapNow + ')');
  ok(L.some((l) => /Seven wicks/.test(l[2])) && await page.evaluate(() => window.__S.$.questStage('ch3')) === 0, 'Sachi explains the seven wicks; quest ch3 stage 0');
  // village east road
  await teleport(page, 1, 34, 16, 'right'); await idle(); await fast(false); await sleep(900); await shot('01_village_east_road'); await fast(true);
  await run(35, 16); ok(await page.evaluate(() => window.__S.$.map.id) === 10, 'village east road leads to the Whispering Forest');
  await idle(); L = await log(); ok(L.some((l) => /forest/i.test(l[2] || '')), 'forest intro plays');
  // anchor lesson, then the statue chorus (Near + Far)
  await run(11, 13, 'near'); await run(12, 13, 'near'); ok(await S('anchor_learned'), 'Anchor lesson learned');
  await run(22, 6, 'near', ['Hum', 'Anchor']); await run(28, 6, 'far', ['Hum', 'Anchor']);
  ok(await S('chorus_done'), 'twin statues sing together (chorus_done)');
  // Rustle trade (sq06 cord) needs a flower bundle
  await page.evaluate(() => window.__S.$.gain('flower_bundle', 1)); await run(39, 9, 'near'); ok(await S('cord_got') && await page.evaluate(() => window.__S.$.has('remembrance_cord')), 'Rustle trades the Remembrance Cord');
  await run(30, 18, 'far'); await log();
  await realm('near'); await fast(false); await teleport(page, 10, 25, 5, 'up'); await sleep(900); await shot('02_forest_near'); await realm('far'); await sleep(900); await shot('03_forest_far'); await fast(true);
  // Misty Grove
  await realm('near'); await teleport(page, 113, 15, 23, 'up'); await idle(); await run(17, 20, 'near'); await run(15, 2, 'far');
  ok(await S('traveller_saved') && await page.evaluate(() => window.__S.$.has('anchor_stone')), 'Misty Grove: traveller saved, Anchor Stone gained');
  await run(5, 3, 'far'); L = await log(); ok(L.some((l) => l[0] === 'shop'), 'Mist Peddler opens a shop');
  await fast(false); await realm('far'); await teleport(page, 113, 15, 6, 'up'); await sleep(900); await shot('04_grove_far'); await fast(true);
  // The Crossing
  await realm('near'); await teleport(page, 111, 2, 12, 'right'); await idle(); await run(7, 10, 'near', ['Chat']); await run(7, 10, 'near', ['Shop']); L = await log();
  ok(L.some((l) => l[0] === 'shop'), 'Hisa’s ferry shop opens');
  await run(19, 12, 'far'); ok(await S('bridge_held'), 'Anchor Stone holds the Far bridge');
  await run(27, 14, 'far'); await run(26, 10, 'far');                                  // tie the cord, memory 3 at the toll pier
  await teleport(page, 10, 6, 30, 'up'); await idle(); await run(6, 31, 'far');           // memory 1 (forest ferns)
  await teleport(page, 113, 6, 17, 'up'); await idle(); await run(6, 16, 'far');          // memory 2 (grove mist)
  await teleport(page, 111, 26, 13, 'right'); await idle(); await run(27, 14, 'far');     // Yoshi remembers -> toll token
  ok(await S('cord_tied') && await page.evaluate(() => window.__S.$.v('pil_mem')) >= 3 && await page.evaluate(() => window.__S.$.has('toll_token')), 'Yoshi remembers (cord tied, 3 memories, toll token)');
  await run(31, 12, 'far', ['Pay']); ok(await S('kappa_passed'), 'Kappa Toll-Keeper lets the party pass (toll paid)');
  await run(41, 19, 'far'); await fast(false); await realm('far'); await teleport(page, 111, 16, 12, 'right'); await sleep(900); await shot('05_crossing_far'); await realm('near'); await sleep(900); await shot('06_crossing_near'); await fast(true);
  // Willow Hollow
  await realm('near'); await teleport(page, 112, 2, 20, 'right'); await idle(); await log();
  // Parley-only: taught before the fight (Kaze line + Tip + Notes entry); a wipe retries on the Near Shore with the Wick pointing at Parley.
  await page.evaluate(() => { const { $ } = window.__S; window.__lose = ['boss_willow_mother']; $.actors.mio.hp = 1; });
  await run(28, 4, 'near');
  L = await log();
  ok(L.some((l) => l[1] === 'Kaze' && /grieving, not hunting\. Words may reach her where blades won/.test(l[2] || '')) && L.some((l) => l[1] === 'Tip' && /can’t be beaten by force/.test(l[2] || '')), 'pre-fight: Kaze says words, not blades; Tip explains Parley-only');
  ok(await page.evaluate(() => (window.__S.DB || window.__DB).system.notes.some((n) => n.unlock === 'willow_tip' && /Remember/.test(n.text))) && await S('willow_tip'), 'Notes: "The Willow Mother" entry unlocked');
  const wipe = await page.evaluate(() => { const { $ } = window.__S; const g = window.__game; return { done: $.sw('willow_done'), map: $.map.id, realm: $.realm, full: $.party.every((id) => $.actors[id].hp === $.param($.actors[id], 'mhp')), title: g.scene.isActive('Title'), mapOn: g.scene.isActive('Map'), cp: !!$.checkpoint }; });
  const auto0 = await page.evaluate(() => { const d = window.__S.SaveManager.read(0); return d && d.game && d.game.map && d.game.map.id; });
  ok(!wipe.done && wipe.map === 112 && wipe.realm === 'near' && wipe.full && !wipe.title && wipe.mapOn && wipe.cp && auto0 === 112, 'Willow wipe -> retry at the Near Shore, healed, no title/game over, autosaved (' + JSON.stringify(wipe) + ' auto0=' + auto0 + ')');
  ok(L.some((l) => l[1] === 'Whisper Wick' && /Parley/.test(l[2] || '')), 'after the wipe the Whisper Wick points at Parley');
  { // the wipe-retry Wick line teaches the same route as the other hints, and fits one page of the message window (face + 4 lines)
    const WICK = 'She does not need to be beaten, little lantern. She needs to be remembered. Parley: Remember her children three times until she is Calm, then Send her home.';
    const wl = (L.find((l) => l[1] === 'Whisper Wick' && /Parley/.test(l[2] || '')) || [])[2] || '';
    const fit = await page.evaluate((t) => { const m = window.__game.scene.getScene('Map').msg; const hasFace = window.__game.textures.exists('face_lantern'); const tx = hasFace ? 150 : 28 + 12; const W = window.__game.scale.width; const lines = m.wrapIdx(t, W - 16 - tx - 28); return { hasFace, lines: lines.length }; }, wl);
    ok(wl === WICK && fit.lines >= 1 && fit.lines <= 4, 'wipe-retry Whisper Wick line matches the other hints and fits one message page ' + JSON.stringify({ wl, ...fit }));
  }
  { // every Willow hint gives the real route (Remember x3 -> Calm -> Send) and never the Marigold Petal (she has no liked item; Offer only wastes Mio's turn)
    const tip = (L.find((l) => l[1] === 'Tip' && /Willow Mother/.test(l[2] || '')) || [])[2] || '';
    const H = await page.evaluate(() => { const { DB, SPEC } = window.__S; const w = SPEC.bosses.willow_mother; return { hint: w.parleyOnly.hintText, key: w.parley.key.note, note: DB.system.notes.find((n) => n.unlock === 'willow_tip').text, boss: window.__game.scene.getScene('Battle').bossHint({ id: 'willow_mother', name: 'Willow Mother' }) }; });
    const wl = L.filter((l) => (l[1] === 'Kaze' && /grieving/.test(l[2] || '')) || l[1] === 'Whisper Wick').map((l) => l[2]);
    const all = { tip, ...H, lines: wl.join(' / ') };
    ok(!/petal|offer/i.test(JSON.stringify(all)), 'no Willow hint mentions Offer / a Marigold Petal ' + (/petal|offer/i.test(JSON.stringify(all)) ? JSON.stringify(all) : ''));
    const wick = (L.find((l) => l[1] === 'Whisper Wick' && /Parley/.test(l[2] || '')) || [])[2] || '';
    ok([tip, H.hint, H.key, H.note, H.boss, wick].every((t) => /Remember/.test(t) && /Calm/.test(t) && /Send/.test(t)) && [tip, H.hint, H.key, H.note, H.boss, wick].every((t) => /three times/.test(t)), 'Tip, in-battle hint, boss hint, Notes, key note and wipe-retry Wick line all teach Remember three times -> Calm -> Send');
  }
  await run(28, 4, 'near'); ok(await S('willow_done') && await page.evaluate(() => window.__S.$.has('willow_sprig')), 'Willow Mother is laid to rest on the retry (sprig)');
  L = await log(); ok(L.some((l) => l[0] === 'battle' && l[1] === 'boss_willow_mother'), 'Willow Mother fight is boss_willow_mother');
  await run(29, 11, 'far'); ok(await S('sprig_planted'), 'sprig planted; the root bridge grows');
  await run(29, 20, 'far'); ok(await S('wick_got') && await page.evaluate(() => window.__S.$.has('wick_forest')), 'Whisper Wick taken');
  await fast(false); await realm('far'); await teleport(page, 112, 28, 9, 'down'); await sleep(900); await shot('07_hollow_far'); await fast(true);
  // Oto's goodbye (sq05) and the chapter close at Sachi's
  await realm('far'); await teleport(page, 111, 8, 11, 'up'); await idle(); await run(8, 9, 'far'); ok(await S('sq05_done'), 'Oto goodbye completes sq05');
  await realm('near'); await teleport(page, 2, 6, 6, 'up'); await waitScene(page, 'Credits', 30000); await sleep(2500); await shot('11_credits'); L = await log();
  const cred = await page.evaluate(() => window.__game.scene.getScene('Credits').children.list.filter((c) => c.type === 'Text').map((c) => c.text).join(' | '));
  ok(/Chapters 1–3 complete/.test(cred) && /Chapters 4–8/.test(cred), 'credits: Chapters 1–3 complete, 4–8 to be continued');
  ok(await S('ch3_done') && await page.evaluate(() => window.__S.$.chapter) === 4, 'Chapter 3 closes at Sachi’s (ch3_done, chapter 4)');
  ok(L.some((l) => /stool is missing/.test(l[2] || '')), 'the chair is gone on the Far Shore');
  ok(await page.evaluate(() => { const q = window.__S.$.quests?.ch3; return !!(q && (q.done || q.stage === 6)); }), 'quest ch3 done');
  // --- real UI: back into the game from the Chapter-end checkpoint autosave
  await page.evaluate(() => { window.__game.scene.stop('Credits'); window.__S.SaveManager.load(0); window.__game.scene.start('Map', { mode: 'load' }); }); await waitScene(page, 'Map', 20000); await sleep(1500);
  ok(await page.evaluate(() => window.__S.$.chapter === 4 && window.__S.$.sw('ch3_done') && window.__S.$.has('wick_forest')), 'chapter-end checkpoint save restores chapter 4 with the wick');
  await fast(false);
  for (const [t, n] of [['boss_kappa_toll', 'battle_kappa'], ['boss_willow_mother', 'battle_willow']]) {
    await page.evaluate((t) => { window.__game.scene.getScene('Map').startBattle(t, { boss: true, noEscape: true }); }, t); await waitScene(page, 'Battle', 15000); await waitInput(page, 40000); await sleep(700); await shot('08_' + n);
    const st = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); return b.B.foes.map((f) => f.name); }); ok(st.length > 0, t + ' starts: ' + st.join(', '));
    if (t === 'boss_willow_mother') {   // Parley-only in the real engine: blades can't end her, the hint shows once, Remember x3 -> Calm -> Send wins
      const po = await page.evaluate(async () => { const b = window.__game.scene.getScene('Battle'); const B = b.B; const w = B.foes.find((f) => f.boss); const ev = [];
        B.hurt(B.party[B.party.length - 1], w, w.hp, ev, {}); const after = w.hp; const send1 = B.canSend(w); const hint = ev.some((e) => e.t === 'tutorial'); b.play(ev); return { after, mhp: w.mhp, send1, hint, alive: w.hp > 0 }; });
      await sleep(1500); await shot('08_willow_hint');
      ok(po.alive && po.after === po.mhp && !po.send1 && po.hint, 'Willow: a killing blow regrows her to full, Send is refused, one-time hint fires ' + JSON.stringify(po));
      // the Willow hints fit the battle message window (no overflow, readable size)
      const fit = await page.evaluate(async () => { const b = window.__game.scene.getScene('Battle'); const { SPEC } = window.__S; const w = SPEC.bosses.willow_mother; const out = [];
        for (const s of [w.parleyOnly.hintText, b.bossHint({ id: 'willow_mother' }), w.parleyOnly.regrowText]) { b.log(s, 0); await new Promise((r) => setTimeout(r, 60)); const lw = b.logWin; const t = lw.content.list.find((c) => c.type === 'Text');
          out.push({ s: s.slice(0, 24), size: parseInt(t.style.fontSize), top: Math.round(t.y), bottom: Math.round(t.y + t.height), winH: lw.h, left: Math.round(t.x - t.width * t.originX), right: Math.round(t.x + t.width * (1 - t.originX)), winW: lw.w }); }
        return out; });
      ok(fit.every((f) => f.top >= 0 && f.bottom <= f.winH && f.left >= 0 && f.right <= f.winW && f.size >= 15), 'Willow hints fit the message window ' + JSON.stringify(fit));
      await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); b.log(window.__S.SPEC.bosses.willow_mother.parleyOnly.hintText, 0); }); await sleep(300); await shot('08_willow_hint_fit');
      // follow the advice with the real Parley skills: Mio uses Remember three times, then Send (Kaze only Guards)
      const pw = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle').B; const w = B.foes.find((f) => f.boss); const mio = B.party.find((p) => p.actorId === 'mio') || B.party[0];
        mio.sp = Math.max(mio.sp, 18); const mood = []; if (!B.foes.some((f) => f.add && f.hp > 0 && !f.gone)) B.summon(w, 'willow_bud', 2, 3, [], true); const buds0 = B.foes.filter((f) => f.add && f.hp > 0 && !f.gone).length;
        for (let i = 0; i < 3; i++) { mio.action = { type: 'skill', skill: 'mio_remember', targets: [w.uid] }; B.act(mio); mood.push(w.calm ? 'calm' : w.mood); }
        const calm = w.calm; const send = B.canSend(w); const budsCalm = B.foes.filter((f) => f.add && f.hp > 0 && !f.gone).every((f) => f.calm); mio.action = { type: 'skill', skill: 'mio_send', targets: [w.uid] }; const res = B.act(mio);
        const evs = JSON.stringify(res && res.ev ? res.ev.map((e) => e.t) : (res || []).map ? (res || []).map((e) => e.t) : []);
        return { mood, calm, send, gone: w.gone, buds0, budsCalm, budsLeft: B.foes.filter((f) => f.add && f.hp > 0 && !f.gone).length, budsSent: B.foes.filter((f) => f.add && f.gone === 'sent').length, ended: B.ended, end: B.checkEnd(), evs }; });
      ok(pw.calm && pw.send && pw.gone === 'sent' && pw.end === 'win' && pw.budsCalm, 'Willow: following the hint (Remember x3 -> Calm -> Send) wins the battle ' + JSON.stringify(pw));
      ok(pw.buds0 >= 1 && pw.budsLeft === 0 && pw.budsSent >= pw.buds0 && pw.ended === 'win', 'Willow: her calm buds leave with her on the Send and the battle ends right there (no extra turns) ' + JSON.stringify(pw));
    }
    await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); for (const f of b.B.foes) f.hp = 0; }); await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); b.endCheck(); });
    const t0 = Date.now(); while (Date.now() - t0 < 25000 && await page.evaluate(() => window.__game.scene.isActive('Battle'))) { await press(page, 'Enter', 50); await sleep(200); }
    ok(await page.evaluate(() => window.__game.scene.isActive('Map')), t + ' returns to the map'); await sleep(500);
  }
  await page.evaluate(() => { window.__game.scene.getScene('Map').openShop({ items: window.__DB?.shops?.ch3 || ['cucumber', 'ward_salt', 'mio_w2a', 'rain_cape'], name: 'Hisa’s Ferry Shop', face: 'hisa' }); });
  await waitScene(page, 'Shop', 10000); await sleep(800); await shot('09_shop');
  { const t0 = Date.now(); while (Date.now() - t0 < 8000 && await page.evaluate(() => window.__game.scene.isActive('Shop'))) { await press(page, 'Escape'); await sleep(400); } }
  await sleep(400); ok(await page.evaluate(() => window.__game.scene.isActive('Map') && !window.__game.scene.isActive('Menu')), 'shop closes back to the map');
  // Status with the longest ch3 names equipped
  const eq = await page.evaluate(() => { const { $, DB } = window.__S; const a = $.actors.mio; const w = Object.values(DB.items).filter((i) => i.etype === 'weapon' || i.slot === 'weapon').map((i) => i.id); a.equips.weapon = 'mio_w2a'; a.equips.armor = 'fox_fur_vest'; a.equips.acc = 'c_wellwater_locket'; return [DB.items.mio_w2a?.name, DB.items.fox_fur_vest?.name, DB.items.c_wellwater_locket?.name]; });
  console.log('equipped', JSON.stringify(eq));
  await page.evaluate(() => { const g = window.__game.scene; if (!g.isActive('Menu')) { const m = g.getScene('Map'); m.openMenu ? m.openMenu() : null; } }); await waitScene(page, 'Menu', 10000).catch(() => {}); await sleep(600);
  for (let i = 0; i < 3; i++) await press(page, 'ArrowDown'); await press(page, 'Enter'); await sleep(500); await press(page, 'Enter'); await sleep(900); await shot('10_status_fit');
  const ov = await page.evaluate(() => { const mn = window.__game.scene.getScene('Menu'); const ts = []; const walk = (o, ox = 0, oy = 0) => { for (const c of o.list || []) { if (c.type === 'Text') { const b = c.getBounds(); ts.push({ t: c.text, x: b.x, y: b.y, w: b.width, h: b.height }); } else if (c.list) walk(c); } }; for (const c of mn.children.list) walk({ list: [c] }); return ts; });
  const lab = ov.filter((t) => ['Weapon', 'Armor', 'Charm'].includes(t.t)); let bad = 0;
  for (const l of lab) { const v = ov.find((t) => Math.abs(t.y - l.y) < 8 && t.x > l.x + 5 && t !== l); if (v && l.x + l.w > v.x - 2) bad++; if (v && v.x + v.w > l.x + 280) bad++; }
  ok(lab.length >= 2 && bad === 0, 'Status: equipment labels and names do not overlap (' + lab.length + ' rows)');
  const errs = errors.filter((e) => !/willReadFrequently|Canvas2D/.test(e)); ok(errs.length === 0, 'no console errors ' + JSON.stringify(errs.slice(0, 4)));
} catch (e) { console.log('FAIL exception', e); fails++; await shot('zz_exception').catch(() => {}); }
await browser.close(); console.log(fails ? `CH3 ${fails} FAIL` : 'CH3 ALL PASS'); process.exit(fails ? 1 : 0);
