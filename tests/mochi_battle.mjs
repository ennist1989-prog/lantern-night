// QA blocker: Mochi (+30 HP) must be usable from the battle Item list, be consumed, and still be an offering.
import { launch, sleep, press, waitScene, waitFor, newGame, mashUntil, teleport } from './lib.mjs';
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
const { browser, page } = await launch();
await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'));
const db = await page.evaluate(() => { const d = window.__S.DB.items.mochi; return { type: d.type, offer: d.offer, usable: d.usable, hp: d.effect?.hp }; });
ok(db.type === 'item' && db.offer === true && db.usable && db.hp === 30, 'mochi DB: type item, offer, usable, +30 HP ' + JSON.stringify(db));
await teleport(page, 1, 17, 17, 'down');
await page.evaluate(() => { window.__S.$.gain('mochi', 2); window.__game.scene.getScene('Map').startBattle('tr_dust_wisp_dust_wisp', { random: true, zone: 'z01' }); });
await waitScene(page, 'Battle', 15000);
await waitFor(page, () => { const b = window.__game.scene.getScene('Battle'); return b.cmdWin?.active && b.cmdWin.items.length > 0; }, null, 20000);
const offerable = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); return Object.keys(window.__S.$.items).filter((k) => window.__S.DB.items[k]?.offer && window.__S.$.items[k] > 0).includes('mochi'); });
ok(offerable, 'mochi is still in the battle Offer list (offer: true)');
const hp0 = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle').B; const h = B.party[0]; h.hp = Math.max(1, h.mhp - 40); return { hp: h.hp, mhp: h.mhp }; });
const q0 = await page.evaluate(() => window.__S.$.items.mochi);
const sel = (win, test) => page.evaluate(([w, t]) => { const b = window.__game.scene.getScene('Battle'); const W = b[w]; const i = W.items.findIndex((it) => new Function('it', 'return ' + t)(it)); return [i, W.index]; }, [win, test]);
const steer = async (win, test) => { const [i] = await sel(win, test); if (i < 0) return false; for (let n = 0; n < 15; n++) { const [, cur] = await sel(win, test); if (cur === i) break; await press(page, cur < i ? 'ArrowDown' : 'ArrowUp'); await sleep(90); } await press(page, 'Enter'); await sleep(400); return true; };
await page.evaluate(() => { const B = window.__game.scene.getScene('Battle').B; const o = B.doItem.bind(B); B.doItem = (b, id, uids, ev) => { const t = B.party.find((p) => p.uid === uids[0]); const h0 = t?.hp; o(b, id, uids, ev); window.__mochiUse = { id, d: (t?.hp ?? 0) - (h0 ?? 0) }; }; });
ok(await steer('cmdWin', "it.data === 'fight'") && await waitFor(page, () => window.__game.scene.getScene('Battle').cmdWin.items.some((x) => x.data === 'item'), null, 5000) && await steer('cmdWin', "it.data === 'item'"), 'battle command list has Item');
ok(await steer('subWin', "it.data && it.data.id === 'mochi'"), 'Mochi is listed in the battle Item list');
await press(page, 'Enter'); await sleep(300);   // target: first ally
await waitFor(page, () => { const b = window.__game.scene.getScene('Battle'); return b.B.party[0].hp !== undefined && window.__S.$.items.mochi !== undefined; }, null, 3000).catch(() => {});
await waitFor(page, () => !!window.__mochiUse, null, 20000); const use = await page.evaluate(() => window.__mochiUse); await sleep(300);
const q1 = await page.evaluate(() => window.__S.$.items.mochi || 0);
ok(use && use.id === 'mochi' && use.d === 30, `battle UI: mochi healed exactly +30 (${JSON.stringify(use)}, from ${hp0.hp}/${hp0.mhp})`);
ok(q1 === q0 - 1, `mochi consumed (${q0} -> ${q1})`);
// exact +30: engine-level check on a fresh battler copy
const exact = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle').B; const h = B.party[0]; h.hp = Math.max(1, h.mhp - 40); const before = h.hp; window.__S.$.gain('mochi', 1); const n0 = window.__S.$.items.mochi; B.doItem(h, 'mochi', [h.uid], []); return { d: h.hp - before, used: n0 - (window.__S.$.items.mochi || 0) }; });
ok(exact.d === 30 && exact.used === 1, 'engine doItem(mochi): exactly +30 HP and one consumed ' + JSON.stringify(exact));
await browser.close(); console.log(fails ? `FAIL ${fails}` : 'PASS mochi_battle'); process.exit(fails ? 1 : 0);
