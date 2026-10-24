// Battle layout regression: no foe sprite may overlap the party sprites or the command/status panel.
// Every troop (bosses, elites, 1-3 foe troops) is opened at the real 816x624 render with 1, 2 and max (<=4) party members;
// bosses and elites also on the Far Shore. Foe bounds = opaque pixels over all of its animation frames (scale, origin and the
// 3 px idle bob included); party bounds = the full 16x16 frame at x4; panel = the window band from y 400 down.
// Primary regression: Willow Mother vs Mio + Kaze (Thomas, screenshots/final_pass/main_W2_inbattle_hint.png).
// env SHOTS=<dir> saves a screenshot of every boss/elite case (+ every offender); OVERLAP_ALL=1 shoots every case.
import { launch, sleep, newGame, mashUntil, waitScene } from './lib.mjs';
import fs from 'fs';
const SHOTS = process.env.SHOTS || ''; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const { browser, page, errors } = await launch(process.argv[2]);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const offenders = []; const rows = [];
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  const setup = await page.evaluate(() => { const { $, DB, SPEC } = window.__S; const m = window.__game.scene.getScene('Map'); m.scene.pause(); m.scene.setVisible(false);
    const ids = ['mio', 'kaze', ...Object.keys(DB.actors).filter((a) => a !== 'mio' && a !== 'kaze')].filter((a) => DB.actors[a]).slice(0, 4); for (const a of ids) $.addActor(a);
    window.__ovZone = m.zoneId(); return { ids, troops: Object.entries(SPEC.troops).map(([k, t]) => ({ id: k, kind: t.kind || 'normal', n: (t.enemies || []).length })) }; });
  const big = setup.troops.filter((t) => t.kind !== 'normal'); const normal = setup.troops.filter((t) => t.kind === 'normal');
  const sizes = [...new Set([1, 2, setup.ids.length])];
  const cases = [];
  for (const t of big) for (const realm of ['near', 'far']) for (const n of sizes) cases.push({ t, realm, n });
  for (const t of normal) for (const n of sizes) cases.push({ t, realm: 'near', n });
  // primary case first
  cases.sort((a, b) => (b.t.id === 'boss_willow_mother' && b.n === 2 && b.realm === 'near') - (a.t.id === 'boss_willow_mother' && a.n === 2 && a.realm === 'near'));
  if (process.env.OVERLAP_ONLY) { const re = new RegExp(process.env.OVERLAP_ONLY); for (let i = cases.length - 1; i >= 0; i--) if (!re.test(`${cases[i].t.id}_${cases[i].realm}_p${cases[i].n}`)) cases.splice(i, 1); }   // debug filter; the full run is the test
  for (const c of cases) {
    await page.evaluate(({ c, ids }) => { const { $ } = window.__S; const g = window.__game; $.party = ids.slice(0, c.n); $.realm = c.realm; for (const a of $.party) { const s = $.actors[a]; if (s) s.hp = Math.max(1, s.hp || 1); }
      if (g.scene.isActive('Battle')) g.scene.stop('Battle');
      g.scene.start('Battle', { troop: c.t.id, realm: c.realm, zone: window.__ovZone, boss: c.t.kind === 'boss', noEscape: true, onEnd: () => {} }); }, { c, ids: setup.ids });
    await waitScene(page, 'Battle', 15000);
    await page.waitForFunction(() => { const b = window.__game.scene.getScene('Battle'); return b?.B && b.spr && b.B.foes.every((f) => b.spr.get(f.uid)) && b.B.party.every((p) => b.spr.get(p.uid)); }, null, { timeout: 15000 });
    await sleep(c.t.kind === 'normal' ? 250 : 700);
    const r = await page.evaluate(() => {
      const b = window.__game.scene.getScene('Battle'); const cache = (window.__ovCache ||= {});
      const opaque = (tex, names) => { const key = tex.key + '|' + names.join(','); if (cache[key]) return cache[key]; let u = null;
        for (const nm of names) { const f = tex.get(nm); const src = f.source.image; const cv = document.createElement('canvas'); cv.width = f.cutWidth; cv.height = f.cutHeight; const x = cv.getContext('2d', { willReadFrequently: true });
          x.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight); const d = x.getImageData(0, 0, cv.width, cv.height).data;
          for (let yy = 0; yy < cv.height; yy++) for (let xx = 0; xx < cv.width; xx++) if (d[(yy * cv.width + xx) * 4 + 3] > 16) { if (!u) u = [xx, yy, xx + 1, yy + 1]; else { u[0] = Math.min(u[0], xx); u[1] = Math.min(u[1], yy); u[2] = Math.max(u[2], xx + 1); u[3] = Math.max(u[3], yy + 1); } } }
        return (cache[key] = u || [0, 0, 0, 0]); };
      const scr = (s, bb, bob) => { const x0 = s.bx - s.displayWidth * s.originX, y0 = s.by - s.displayHeight * s.originY; return { x0: Math.round(x0 + bb[0] * s.scaleX), y0: Math.round(y0 + bb[1] * s.scaleY - bob), x1: Math.round(x0 + bb[2] * s.scaleX), y1: Math.round(y0 + bb[3] * s.scaleY) }; };
      const foes = b.B.foes.filter((f) => !f.gone).map((f) => { const s = b.spr.get(f.uid); const names = f.boss ? s.texture.getFrameNames().filter((n) => n !== '__BASE') : [s.frame.name];
        return { id: f.id, boss: !!f.boss, scale: s.scaleX, ...scr(s, opaque(s.texture, names.length ? names : [s.frame.name]), 3) }; });
      const party = b.B.party.map((p) => { const s = b.spr.get(p.uid); return { id: p.actorId || p.id, x0: Math.round(s.bx - s.displayWidth * s.originX), y0: Math.round(s.by - s.displayHeight * s.originY), x1: Math.round(s.bx + s.displayWidth * (1 - s.originX)), y1: Math.round(s.by + s.displayHeight * (1 - s.originY)) }; });
      const PANEL = 400; const hit = (a, c) => a.x0 < c.x1 && c.x0 < a.x1 && a.y0 < c.y1 && c.y0 < a.y1; const bad = [];
      for (const f of foes) { for (const p of party) if (hit(f, p)) bad.push(`${f.id} overlaps ${p.id} (foe ${f.x0},${f.y0}-${f.x1},${f.y1} vs party ${p.x0},${p.y0}-${p.x1},${p.y1})`); if (f.y1 > PANEL) bad.push(`${f.id} reaches into the panel (bottom ${f.y1} > ${PANEL})`); }
      return { foes, party, bad };
    });
    const tag = `${c.t.id}_${c.realm}_p${c.n}`; rows.push({ tag, ...r });
    if (r.bad.length) offenders.push({ tag, bad: r.bad });
    if (SHOTS && (c.t.kind !== 'normal' || r.bad.length || process.env.OVERLAP_ALL)) await page.screenshot({ path: `${SHOTS}/${tag}.png` });
    if (tag === 'boss_willow_mother_near_p2') {   // Thomas's shot also had the 3-line hint hiding the boss name and HP bars: in boss fights the message window docks over the top HUD row
      for (let i = 0; i < 40 && (await page.evaluate(() => window.__game.scene.getScene('Battle').children.list.some((o) => o.type === 'Text' && /skip$/.test(o.text)))); i++) { await page.keyboard.press('z'); await sleep(400); } await sleep(600);   // skip the boss intro letterbox: the hint shows in the real fight, with the top HUD up
      const h = await page.evaluate(async () => { const b = window.__game.scene.getScene('Battle'); const w = window.__S.SPEC.bosses.willow_mother;
        const all = []; const walk = (o) => { all.push(o); (o.list || []).forEach(walk); }; b.children.list.forEach(walk);
        const name = all.find((o) => o.type === 'Text' && o.text === 'Willow Mother' && o.visible); const nb = name.getBounds();
        const out = [];
        for (const s of [w.parleyOnly.hintText, b.bossHint({ id: 'willow_mother', name: 'Willow Mother' })]) { b.log(s, 0); await new Promise((r) => setTimeout(r, 120)); const lb = b.logWin.getBounds(); out.push({ logTop: Math.round(lb.y), logBottom: Math.round(lb.bottom), nameTop: Math.round(nb.y) }); }
        return out; });
      await sleep(250); if (SHOTS) await page.screenshot({ path: `${SHOTS}/${tag}_hint.png` });
      const foeTop = Math.min(...r.foes.map((f) => f.y0));
      ok(h.every((x) => x.logTop >= 0 && x.logBottom < x.nameTop && x.logBottom < foeTop), 'PRIMARY: the in-battle Willow hints sit above the boss name, HP bars and sprite ' + JSON.stringify({ h, foeTop }));
      await page.evaluate(() => window.__game.scene.getScene('Battle').hideLog());
    }
    console.log(`${r.bad.length ? 'OVERLAP' : 'ok     '} ${tag}  foes ${r.foes.map((f) => `${f.id}@x${f.scale}[${f.x0},${f.y0}-${f.x1},${f.y1}]`).join(' ')}${r.bad.length ? '  -> ' + r.bad.join('; ') : ''}`);
  }
  const prim = rows.find((x) => x.tag === 'boss_willow_mother_near_p2');
  if (!process.env.OVERLAP_ONLY || prim) ok(prim && prim.bad.length === 0, 'PRIMARY: Willow Mother vs Mio + Kaze (Near): the boss does not overlap the party or the panel ' + JSON.stringify(prim?.bad || 'missing'));
  if (!process.env.OVERLAP_ONLY) ok(offenders.length === 0, `no foe overlaps the party or the panel in ${rows.length} troop/realm/party cases` + (offenders.length ? ` — ${offenders.length} offenders:\n  ` + offenders.map((o) => o.tag + ': ' + o.bad.join('; ')).join('\n  ') : ''));
  if (process.env.OVERLAP_JSON) fs.writeFileSync(process.env.OVERLAP_JSON, JSON.stringify({ rows, offenders }, null, 1));
  const errs = errors.filter((e) => !/willReadFrequently/.test(e)); ok(errs.length === 0, 'no console errors ' + JSON.stringify(errs.slice(0, 3)));
} catch (e) { console.log('FAIL exception', e); fails++; }
await browser.close(); console.log(fails ? `OVERLAP ${fails} FAIL` : 'OVERLAP ALL PASS'); process.exit(fails ? 1 : 0);
