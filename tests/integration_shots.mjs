// integration-1031 screenshots: Far menu with Save dimmed, Items menu with the Spirit Elixir, shop Sell list without the elixir.
import fs from 'fs';
import { launch, sleep, press, newGame, mashUntil, teleport, waitScene } from './lib.mjs';
const OUT = process.env.SHOTS || 'screenshots/integration'; fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
const { browser, page } = await launch();
const idle = () => { const m = window.__game.scene.getScene('Map'); return m.ready && !m.msg.busy && !m.interp.busy; };
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').msg.busy && !window.__game.scene.getScene('Map').interp.busy);
await page.evaluate(() => { const { $ } = window.__S; $.gain('spirit_elixir', 2); $.gain('onigiri', 3); $.gain('mochi', 2); });
await teleport(page, 1, 8, 6, 'down'); await page.evaluate(() => { window.__S.$.realm = 'far'; }); await sleep(400);
// 1. Far menu, cursor on Save (dimmed away from a lit post)
await press(page, 'x'); await waitScene(page, 'Menu'); await sleep(500);
for (let i = 0; i < 14; i++) { const c = await page.evaluate(() => { const M = window.__game.scene.getScene('Menu'); return M.cmd.items[M.cmd.index]?.label; }); if (c === 'Save') break; await press(page, 'ArrowDown'); await sleep(80); }
const grey = await page.evaluate(() => { const M = window.__game.scene.getScene('Menu'); return { realm: window.__S.$.realm, cur: M.cmd.items[M.cmd.index]?.label, grey: !!M.cmd.items.find((i) => i.label === 'Save')?.color }; });
await page.screenshot({ path: OUT + '/far_menu_save_dimmed.png' }); ok(grey.grey && grey.cur === 'Save' && grey.realm === 'far', 'Far menu: Save dimmed ' + JSON.stringify(grey));
// 2. Items menu with the Spirit Elixir selected
const mt = await page.evaluate(async () => { const M = window.__game.scene.getScene('Menu'); const c = M.cmd; const i = c.items.findIndex((x) => /^Items?$/.test(x.label)); c.index = i; c.onOk(c.items[i], i);
  await new Promise((r) => setTimeout(r, 600)); const L = M.wins.find((w) => w.items?.some?.((x) => x.label === 'Spirit Elixir')); if (!L) return null;
  const j = L.items.findIndex((x) => x.label === 'Spirit Elixir'); L.index = j; L.refresh(); L.onSelect(L.items[j], j); await new Promise((r) => setTimeout(r, 300));
  const out = []; const walk = (o) => { if (o.type === 'Text' && o.visible) out.push(o.text); (o.list || []).forEach(walk); }; M.children.list.forEach(walk); return out.join(' | '); });
await page.screenshot({ path: OUT + '/items_menu_spirit_elixir.png' }); ok(mt && /Can't be sold/.test(mt) && !/Sells for/.test(mt), 'Items menu shows the Spirit Elixir, "Can\'t be sold."');
for (let k = 0; k < 8 && await page.evaluate(() => window.__game.scene.isActive('Menu')); k++) { await press(page, 'Escape'); await sleep(350); }
await page.evaluate(() => { window.__S.$.realm = 'near'; }); await mashUntil(page, idle, null, 10);
// 3. shop Sell list without the elixir
await page.evaluate(() => { window.__game.scene.getScene('Map').openShop({ items: ['onigiri'], name: 'Test Shop' }); }); await waitScene(page, 'Shop', 10000); await sleep(600);
await page.evaluate(() => { const S = window.__game.scene.getScene('Shop'); S.wins[0].onOk({ label: 'Sell' }, 1); }); await sleep(500);
const labels = await page.evaluate(() => (window.__game.scene.getScene('Shop').wins[2].items || []).map((x) => x.label));
await page.screenshot({ path: OUT + '/shop_sell_no_elixir.png' }); ok(labels.length > 0 && !labels.includes('Spirit Elixir'), 'Sell list without the elixir ' + JSON.stringify(labels));
await browser.close(); console.log(fails ? `FAIL ${fails}` : 'PASS integration_shots'); process.exit(fails ? 1 : 0);
