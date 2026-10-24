// Headless checks + screenshots for the design-items PRs (Sentry blocked). usage: node tests/design_shots.mjs <baseUrl> <scenario...>
// Scenarios register themselves in SC below; each prints a JSON result line. Ends with page/console error + HTTP>=400 summary.
import { chromium } from 'playwright-core';
import { sleep, waitScene, newGame, mashUntil, teleport } from './lib.mjs';
const base = process.argv[2] || 'http://127.0.0.1:8150/'; const want = process.argv.slice(3); const OUT = process.env.OUT || 'shots';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 816, height: 624 } }); let blocked = 0;
await ctx.route(/sentry\.io|ingest\.sentry|sentry-cdn|\/envelope\//i, (r) => { blocked++; r.abort(); });
const page = await ctx.newPage(); const errors = [], bad = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('lotfs.settings', JSON.stringify({ walkSpeed: 'brisk', textSpeed: 3 })); } catch (e) {} });
const press = async (k, ms = 70) => { await page.keyboard.down(k); await sleep(ms); await page.keyboard.up(k); await sleep(50); };
const texts = (key) => page.evaluate((key) => { const sc = window.__game.scene.getScene(key); const out = []; const walk = (o) => { if (!o || o.visible === false) return; if (o.type === 'Text' && o.text) out.push(o.text); (o.list || []).forEach(walk); }; sc?.children.list.forEach(walk); return out; }, key);
const scenes = () => page.evaluate(() => window.__game.scene.getScenes(true).map((s) => s.sys.settings.key));
const st = () => page.evaluate(() => { const $ = window.__S.$; const m = window.__game.scene.getScene('Map'); return { map: $.map?.id ?? $.map, realm: $.realm, party: $.party, msg: !!m?.msg?.busy, busy: !!m?.interp?.busy, sw: Object.keys($.switches).filter((k) => $.switches[k]) }; });
const shot = async (n) => { const p = `${OUT}/${n}.png`; await page.screenshot({ path: p }); return p; };
/** Advance dialogue until pred() is true (or max presses); collects message texts. */
async function talkUntil(pred, max = 80, key = 'Enter') { const seen = []; for (let i = 0; i < max; i++) { if (await page.evaluate(pred)) return seen; const t = (await texts('Map')).join(' | '); if (t && seen[seen.length - 1] !== t) seen.push(t.slice(0, 220)); await press(key, 50); await sleep(110); } return seen; }
export const H = { page, press, texts, scenes, st, shot, talkUntil, sleep, waitScene, teleport };
const SC = {};
// ---- E6: charm3 only from sq04 (not the shop, not the Well chest)
SC.charm3 = async () => {
  await page.evaluate(() => { const $ = window.__S.$; $.chapter = 2; $.gold = 5000; });
  const items = await page.evaluate(async () => { const m = window.__game.scene.getScene('Map'); const { DB } = window.__S; const d = await (await fetch('data/maps/map003.json')).json(); let found = null; const walk = (l) => { for (const c of l || []) { if (!c || typeof c !== 'object') continue; if (Array.isArray(c)) { walk(c); continue; } if (c.c === 'shop') found = c; for (const v of Object.values(c)) if (Array.isArray(v)) walk(v); } }; for (const e of d.events) for (const p of e.pages) walk(p.list); window.__shopP = m.openShop(found); return found.items; });
  await waitScene(page, 'Shop', 8000); await sleep(600); await press('Enter'); await sleep(600); const shopTexts = await texts('Shop'); const p1 = await shot('e6-shop-ch2');
  for (let i = 0; i < 6 && (await scenes()).includes('Shop'); i++) { await press('Escape'); await sleep(400); }
  await page.evaluate(() => window.__shopP); await sleep(400); if ((await scenes()).includes('Menu')) { await press('Escape'); await sleep(400); }
  await teleport(page, 4, 3, 9, 'up'); await sleep(500); const before = await page.evaluate(() => ({ ...window.__S.$.items }));
  await press('Enter'); await sleep(900); const p2 = await shot('e6-well-chest'); await talkUntil(() => !window.__game.scene.getScene('Map').msg.busy, 10);
  const after = await page.evaluate(() => ({ ...window.__S.$.items }));
  const gained = Object.fromEntries(Object.keys(after).filter((k) => (after[k] || 0) > (before[k] || 0)).map((k) => [k, after[k] - (before[k] || 0)]));
  const sq = await page.evaluate(() => window.__S.DB.sidequests.quests.sq04.reward.items);
  return { shopHasCharm3: items.includes('charm3'), shopListShowsBellCharm: shopTexts.some((t) => /Bell Charm/.test(t)), wellChestGained: gained, sq04Reward: sq, shots: [p1, p2] };
};
export function register(name, fn) { SC[name] = fn; }
const extra = process.env.EXTRA; if (extra) await import(extra);
await page.goto(base); await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done') && !window.__game.scene.getScene('Map').interp.busy, null, 120);
for (const n of want) { try { const r = await SC[n](); console.log(JSON.stringify({ scenario: n, ...r })); } catch (e) { console.log(JSON.stringify({ scenario: n, FAIL: e.message })); await shot(`fail-${n}`); } }
console.log(JSON.stringify({ pageErrors: errors.slice(0, 10), http: bad.slice(0, 10), blockedSentry: blocked }));
await browser.close();
