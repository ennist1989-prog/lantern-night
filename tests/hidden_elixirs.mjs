// Hidden Spirit Elixirs: the new full-gauge item and its 20 hidden pickups (tools/hidden_elixirs.py).
// Data: 20 tagged events, each nook reachable on foot from a map entry, entered only from below (face up).
// Browser: every pickup gives exactly 1 elixir once (action button; spot #1 also by click), state survives save/load,
// and the elixir fills Lumen to max from the menu (Field) and in battle (real Item command).
import fs from 'fs';
import { launch, sleep, newGame, mashUntil, teleport, waitScene, press } from './lib.mjs';
import { waitInput } from './bdrive.mjs';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; return c; };
const maps = {}; for (const f of fs.readdirSync('public/data/maps')) if (/^map\d+\.json$/.test(f)) { const m = JSON.parse(fs.readFileSync('public/data/maps/' + f, 'utf8')); maps[m.id] = m; }
const items = JSON.parse(fs.readFileSync('public/data/items.json', 'utf8')); const icons = JSON.parse(fs.readFileSync('public/assets/icons.json', 'utf8'));
const it = items.spirit_elixir;
ok(it && it.icon === 'spirit_elixir' && !('iconV2' in it) && icons.spirit_elixir === 75, 'item uses icon slot 75, no iconV2');
ok(it && it.price === 3000 && it.noSell === true && !('sell' in it) && /can't be sold/i.test(it.desc) && it.usable && it.effect.lumen >= 999, 'price 3000, noSell (no sell price, desc says so), usable, fills Lumen');
const shopsTxt = fs.readdirSync('public/data').filter((f) => /shop/i.test(f)).map((f) => fs.readFileSync('public/data/' + f, 'utf8')).join('');
ok(!shopsTxt.includes('spirit_elixir'), 'not stocked in any shop (hidden pickups only)');
// ---- data: reachability (BFS like edge_exits: collision + solid / touch events), entries = transfer arrivals, new game, respawn
const D = [[0, -1], [0, 1], [-1, 0], [1, 0]]; const RL = (r) => (!r || r === 'both' ? ['near', 'far'] : [r]);
function* cmds(l) { for (const c of l || []) { yield c; for (const k of ['then', 'else']) if (c[k]) yield* cmds(c[k]); if (c.br) for (const b of c.br) yield* cmds(b); } }
const entries = { 2: [[6, 6]], 1: [[17, 17]] };
for (const m of Object.values(maps)) for (const e of m.events) for (const p of e.pages) for (const c of cmds(p.list)) if (c.c === 'transfer' && c.map !== undefined) (entries[c.map] ||= []).push([c.x, c.y]);
function reach(m) {
  const block = new Set(); for (const e of m.events) for (const r of RL(e.realm)) if (e.pages.some((p) => p.trigger === 'touch' || (p.g && !p.through && !p.g.flat))) block.add(`${r},${e.x},${e.y}`);
  const free = (r, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.col[r][y * m.w + x] && !block.has(`${r},${x},${y}`);
  const seen = new Set(); const q = []; for (const [x, y] of entries[m.id] || []) for (const r of ['near', 'far']) if (free(r, x, y)) { seen.add(`${r},${x},${y}`); q.push([r, x, y]); }
  while (q.length) { const [r, x, y] = q.shift(); const nb = D.map(([dx, dy]) => [r, x + dx, y + dy]); if (!m.noShift) nb.push([r === 'near' ? 'far' : 'near', x, y]);
    for (const n of nb) { const k = n.join(','); if (!seen.has(k) && free(...n)) { seen.add(k); q.push(n); } } }
  return seen;
}
const spots = [];
for (const m of Object.values(maps)) { const seen = reach(m);
  for (const e of m.events) if (e.pages.some((p) => p.hidden_elixir)) { spots.push({ map: m.id, id: e.id, x: e.x, y: e.y, realm: e.realm || 'both' });
    const p = e.pages[0]; const got = [...cmds(p.list)].filter((c) => c.c === 'item');
    ok(e.pages.length === 1 && p.cond?.nself === 'A' && !p.g && p.trigger === 'action' && p.faceDir === 'up' && got.length === 1 && got[0].id === 'spirit_elixir' && (got[0].n ?? 1) === 1 && [...cmds(p.list)].some((c) => c.c === 'self' && c.k === 'A'),
      `map ${m.id} ev ${e.id}: no graphic, action facing up, gives 1 elixir once (self A)`);
    for (const r of RL(e.realm)) {
      ok(m.col[r][e.y * m.w + e.x] === 1, `map ${m.id} ev ${e.id} [${r}]: pickup tile is blocked (behind the tree/rock)`);
      ok(seen.has(`${r},${e.x},${e.y + 1}`), `map ${m.id} ev ${e.id} [${r}]: nook (${e.x},${e.y + 1}) reachable on foot from a map entry`);
      ok(D.some(([dx, dy]) => (dx || dy !== -1) && seen.has(`${r},${e.x + dx},${e.y + 1 + dy}`)), `map ${m.id} ev ${e.id} [${r}]: can walk back out of the nook`);
    } } }
ok(spots.length === 20, `20 hidden elixirs (found ${spots.length})`);
const ELIXIR_MAPS = [1, 2, 3, 4, 5, 6, 10, 111, 112, 113];   // integration-1031: map 7 (PR #52 Reedwind training maze) has no elixir by design
ok(ELIXIR_MAPS.every((id) => maps[id] && spots.some((s) => s.map === id)), 'every elixir map has at least one');
// ---- browser
const { browser, page, errors } = await launch(process.env.BASE || process.argv[2]);
const free = () => page.evaluate(() => window.__game.scene.getScene('Map').isFree());
const settle = async () => { for (let i = 0; i < 40 && !(await free()); i++) { await press(page, 'Enter', 50); await sleep(120); } await sleep(150); };
// keep roaming Far Shore foes from starting a fight mid-test (they chase on maps 4/5); the pickup itself is what's under test
const calm = () => page.evaluate(() => { const m0 = window.__game.scene.getScene('Map'); m0.__et ||= m0.enemyTouch; m0.enemyTouch = async () => {}; for (const e of window.__game.scene.getScene('Map').evs) if (e.page?.enemy) { e.page = null; e.char.spr.setVisible(false); } });
const go = async (map, x, y, dir) => { await teleport(page, map, x, y, dir); await calm(); };
const choose = async (label) => { for (let k = 0; k < 12; k++) { const s = await waitInput(page, 10000); if (s.labels[s.index] === label) { await press(page, 'Enter', 60); await sleep(150); return true; } await press(page, 'ArrowDown', 40); await sleep(60); } return false; };
const count = () => page.evaluate(() => window.__S.$.items.spirit_elixir || 0);
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80); await settle();
  await page.evaluate(() => { window.__S.$.lumen = window.__S.$.lumenMax; });
  // facing sideways must not trigger: map 1's nook at (34,5) has a walkable tile left of the pickup (33,4)
  await go( 1, 33, 4, 'right'); await sleep(250); await press(page, 'Enter'); await sleep(400); await settle();
  ok((await count()) === 0, 'facing the pickup from the side does nothing (face up only)');
  for (const [i, s] of spots.entries()) {
    const r = s.realm === 'both' ? (i % 2 ? 'far' : 'near') : s.realm;
    await page.evaluate((r) => { window.__S.$.realm = r; window.__S.$.lumen = window.__S.$.lumenMax; }, r);
    const n0 = await count();
    if (i === 0) {   // spot #1 by click: face away, click the tile above Mio
      await go( s.map, s.x, s.y + 1, 'down'); await sleep(300);
      const pt = await page.evaluate(([x, y]) => { const m = window.__game.scene.getScene('Map'); const c = window.__game.canvas.getBoundingClientRect(); const k = c.width / window.__game.scale.width; return [c.left + ((x * 16 + 8 - m.scrollX) * 3) * k, c.top + ((y * 16 + 8 - m.scrollY) * 3) * k]; }, [s.x, s.y]);
      await page.mouse.click(pt[0], pt[1]); await sleep(400);
      ok(await page.evaluate(() => window.__game.scene.getScene('Map').player.dir === 'up'), 'click on the hidden tile turns Mio to face up');
    } else { await go( s.map, s.x, s.y + 1, 'up'); await sleep(250); await settle(); }
    // a first visit can open with a narration / tutorial that eats the press: press (re-facing up) until the pickup fires
    for (let k = 0; k < 4 && (await count()) === n0; k++) { await settle(); await page.evaluate(() => window.__game.scene.getScene('Map').player.face('up')); await press(page, 'Enter'); await sleep(400); await settle(); }
    const n1 = await count();
    await press(page, 'Enter'); await sleep(300); await settle(); const n2 = await count();
    ok(n1 === n0 + 1 && n2 === n1, `#${i + 1} map ${s.map} (${s.x},${s.y + 1}) ${r}: +1 elixir, second press gives nothing (${n0}->${n1}->${n2})`);
  }
  ok(await page.evaluate(() => window.__S.$.items.spirit_elixir === 20), 'collected exactly 20');
  // save / load
  await page.evaluate(() => window.__S.SaveManager.save(3)); await page.reload(); await waitScene(page, 'Title', 30000); await sleep(600);
  await page.evaluate(() => window.__S.SaveManager.load(3));
  const after = await page.evaluate((sp) => { const { $ } = window.__S; return { n: $.items.spirit_elixir, opened: sp.filter((s) => $.selfSwitches[$.selfKey(s.map, s.id, 'A')]).length }; }, spots);
  ok(after.n === 20 && after.opened === 20, `save/load keeps 20 elixirs and 20 opened pickups (${JSON.stringify(after)})`);
  await page.evaluate(() => window.__game.scene.start('Map')); await waitScene(page, 'Map'); await sleep(800); await settle();
  const s0 = spots[0]; await go( s0.map, s0.x, s0.y + 1, 'up'); await sleep(250); await press(page, 'Enter'); await sleep(400); await settle();
  ok((await count()) === 20, 'after load, spot #1 stays empty');
  // menu (field) use
  const fu = await page.evaluate(() => { const { $, Field } = window.__S; $.lumen = 3; const a = Field.useItemGlobal('spirit_elixir'); const o = { a, lumen: $.lumen, max: $.lumenMax, n: $.items.spirit_elixir }; o.full = Field.useItemGlobal('spirit_elixir'); o.n2 = $.items.spirit_elixir; return o; });
  ok(fu.a.ok && fu.lumen === fu.max && fu.n === 19 && /fully/.test(fu.a.msg) && !fu.full.ok && fu.n2 === 19, 'menu: fills Lumen to max, 1 used, not wasted when already full ' + JSON.stringify(fu));
  // Items menu (Near and Far): a noSell item shows "Can't be sold." and no "Sells for" line
  fs.mkdirSync('screenshots/hidden_elixirs', { recursive: true });
  for (const realm of ['near', 'far']) {
    await page.evaluate((r) => { window.__S.$.realm = r; }, realm); await sleep(200);
    await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(600);
    const mt = await page.evaluate(async () => { const M = window.__game.scene.getScene('Menu'); const c = M.cmd; const i = c.items.findIndex((x) => /^Items?$/.test(x.label)); c.index = i; c.onOk(c.items[i], i);
      await new Promise((r) => setTimeout(r, 600)); const L = M.wins.find((w) => w.items?.some?.((x) => x.label === 'Spirit Elixir')); if (!L) return null;
      const j = L.items.findIndex((x) => x.label === 'Spirit Elixir'); L.index = j; L.refresh(); L.onSelect(L.items[j], j); await new Promise((r) => setTimeout(r, 300));
      const out = []; const walk = (o) => { if (o.type === 'Text' && o.visible) out.push(o.text); (o.list || []).forEach(walk); }; M.children.list.forEach(walk); return out.join(' | '); });
    await page.screenshot({ path: `screenshots/hidden_elixirs/items_menu_elixir_${realm}.png` });
    ok(mt && /Can't be sold/.test(mt) && !/Sells for/.test(mt), `Items menu (${realm}): elixir shows "Can't be sold." and no "Sells for" line ` + JSON.stringify((mt || '').match(/.{0,40}(Sells for|Can't be sold).{0,20}/g)));
    for (let k = 0; k < 8 && await page.evaluate(() => window.__game.scene.isActive('Menu')); k++) { await press(page, 'Escape'); await sleep(350); }
    await settle(); }
  await page.evaluate(() => { window.__S.$.realm = 'near'; });
  // shop: the elixir can't be sold (hidden from the Sell list like key items; a forced sell is refused)
  { await page.evaluate(() => { window.__game.scene.getScene('Map').openShop({ items: ['onigiri'], name: 'Test Shop' }); }); await waitScene(page, 'Shop', 10000); await sleep(600);
    const g0 = await page.evaluate(() => window.__S.$.gold);
    await page.evaluate(() => { const S = window.__game.scene.getScene('Shop'); S.wins[0].onOk({ label: 'Sell' }, 1); }); await sleep(400);   // Buy / Sell / Leave -> Sell
    const sh = await page.evaluate(() => { const L = window.__game.scene.getScene('Shop').wins[2]; const labels = (L.items || []).map((x) => x.label);
      try { L.onOk({ data: 'spirit_elixir' }, 0); } catch (e) {} return { labels, n: window.__S.$.items.spirit_elixir, gold: window.__S.$.gold }; });
    ok(sh.labels.length > 0 && !sh.labels.includes('Spirit Elixir') && sh.n === 19 && sh.gold === g0, "shop: Spirit Elixir not in the Sell list and can't be sold " + JSON.stringify({ ...sh, g0 }));
    for (let k = 0; k < 8 && await page.evaluate(() => window.__game.scene.isActive('Shop')); k++) { await press(page, 'Escape'); await sleep(350); } await settle(); }
  // battle use via the real Item command
  await page.evaluate(() => { const m0 = window.__game.scene.getScene('Map'); if (m0.__et) m0.enemyTouch = m0.__et; const { $ } = window.__S; $.realm = 'near'; $.healAll(); window.__done = null; window.__game.scene.getScene('Map').startBattle('tr_dust_wisp', { random: true, zone: 'z02' }).then((r) => (window.__done = r)); });
  await waitScene(page, 'Battle', 15000); let used = null, chose = false, pre = null;
  await waitInput(page, 30000); await page.evaluate(() => { const B = window.__game.scene.getScene('Battle').B; B.lumen = 4; B.foes.forEach((f) => { f.mhp = Math.max(f.mhp, 999); f.hp = f.mhp; }); });
  for (let t = 0; t < 80 && !used; t++) { const s = await waitInput(page, 30000).catch(() => null); if (!s || s.ended) break;
    const r = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle').B; return { l: B.lumen, m: B.lumenMax, n: window.__S.$.items.spirit_elixir }; });
    if (chose && r.l === r.m) { used = { ...r, pre }; break; }
    console.log('battle menu', s.win, s.labels.join('|'));
    if (s.win === 'target') await press(page, 'Enter');
    else if (s.labels.includes('Fight')) await choose('Fight');
    else if (s.labels.includes('Item')) await choose(chose ? 'Guard' : 'Item');
    else { const l = s.labels.find((x) => /^Spirit Elixir/.test(x)); if (l && !chose) { pre = r.n; await choose(l); chose = true; } else await press(page, 'Escape'); }
    await sleep(100); }
  ok(used && used.l === used.m && used.n === used.pre - 1, 'battle: Spirit Elixir fills the Lumen gauge to max ' + JSON.stringify(used));
  // full Lumen in battle: the elixir must be refused (disabled in the Item list, no turn spent) and NOT consumed
  { const n0 = await page.evaluate(() => window.__S.$.items.spirit_elixir); let tried = false, after = null;
    for (let t = 0; t < 40; t++) { const s = await waitInput(page, 30000).catch(() => null); if (!s || s.ended) break;
      const B = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle').B; return { l: B.lumen, m: B.lumenMax }; });
      if (tried) { if (s.win === 'target') { await press(page, 'Enter'); await sleep(150); continue; } if (s.labels.includes('Item') || s.labels.includes('Fight')) { after = { ...B, n: await page.evaluate(() => window.__S.$.items.spirit_elixir), stillInList: false }; break; }
        after = { ...B, n: await page.evaluate(() => window.__S.$.items.spirit_elixir), stillInList: s.labels.some((x) => /^Spirit Elixir/.test(x)) }; break; }
      if (s.win === 'target') await press(page, 'Enter');
      else if (s.labels.includes('Fight')) await choose('Fight');
      else if (s.labels.includes('Item')) await choose('Item');
      else { const l = s.labels.find((x) => /^Spirit Elixir/.test(x)); if (l && B.l >= B.m) { await choose(l); tried = true; await sleep(400); } else await press(page, 'Escape'); }
      await sleep(100); }
    ok(tried && after && after.n === n0 && after.l === after.m && after.stillInList, 'battle at full Lumen: Spirit Elixir refused, not consumed, turn kept ' + JSON.stringify({ n0, after }));
    for (let k = 0; k < 3; k++) { const s = await waitInput(page, 5000).catch(() => null); if (!s || s.labels.includes('Item') || s.labels.includes('Fight')) break; await press(page, 'Escape'); await sleep(200); } }
  await page.evaluate(() => window.__game.scene.getScene('Battle').B.foes.forEach((f) => (f.hp = 1)));
  ok(errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, 'no console errors ' + JSON.stringify(errors.slice(0, 3)));
} catch (e) { console.log('FAIL exception', e); fails++; }
await browser.close(); console.log(fails ? `HIDDEN_ELIXIRS ${fails} FAIL` : 'HIDDEN_ELIXIRS ALL PASS'); process.exit(fails ? 1 : 0);
