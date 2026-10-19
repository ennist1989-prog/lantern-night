// Art-pipeline smoke: boots the game, checks for page errors / 404s (Sentry blocked), optional-asset fallbacks,
// then screenshots boss fights to compare battler scale. usage: node tests/art_pipeline_shots.mjs <baseUrl> <outPrefix> [bossTroop...]
import { chromium } from 'playwright-core';
import { sleep, waitScene, newGame, mashUntil } from './lib.mjs';
import { waitInput } from './bdrive.mjs';
const base = process.argv[2] || 'http://127.0.0.1:8138/'; const out = process.argv[3] || 'shots/art'; const troops = process.argv.slice(4);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 816, height: 624 } }); const blocked = [];
await ctx.route(/sentry\.io|ingest\.sentry|sentry-cdn|\/envelope\//i, (r) => { blocked.push(r.request().url()); r.abort(); });
const page = await ctx.newPage(); const errors = [], bad = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); }); page.on('requestfailed', (r) => { if (!/sentry/i.test(r.url())) bad.push('FAILED ' + r.url()); });
await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('lotfs.settings', JSON.stringify({ walkSpeed: 'brisk', textSpeed: 3 })); } catch (e) {} });
await page.goto(base); const res = { bosses: {} };
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  res.optional = await page.evaluate(() => { const g = window.__game; const T = g.scene.getScene('Title').textures; const A = g.cache.audio; const m = g.cache.json.get('assetmanifest');
    return { manifest: !!m, charTsubaki: T.exists('char_tsubaki'), charTsubakiSrc: T.exists('char_tsubaki') ? T.get('char_tsubaki').getSourceImage().src?.split('/').pop() : null, faces: ['tsubaki', 'tsubaki_grief', 'tsubaki_anger', 'tsubaki_resolve'].map((f) => [f, T.exists('face_' + f)]), bgmFinal: A.exists('bgm_final'), bossMeta: { f: g.cache.json.get('bossmeta').tsubaki_final, g: g.cache.json.get('bossmeta').tsubaki_forge } }; });
  for (const tr of troops) {
    await page.evaluate(() => { const $ = window.__S.$; $.party = ['mio']; $.actors.mio.hp = $.param($.actors.mio, 'mhp'); });
    await page.evaluate((t) => { window.__game.scene.getScene('Map').startBattle(t, { boss: true, noEscape: true }); }, tr);
    await waitScene(page, 'Battle', 15000); await waitInput(page, 40000); await sleep(500);
    res.bosses[tr] = await page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); const f = b.B.foes.find((x) => x.boss); const s = b.spr.get(f.uid); return { scale: +s.scaleX.toFixed(3), h: Math.round(s.displayHeight), top: Math.round(s.y - s.displayHeight), frames: b.bossMeta[f.id], bgmKey: window.__game.sound.sounds.find((x) => x.isPlaying)?.key }; });
    await page.screenshot({ path: `${out}-${tr}.png` }); console.log('shot', `${out}-${tr}.png`);
    await page.evaluate(() => window.__game.scene.getScene('Battle').finish('escape')); await waitScene(page, 'Map', 15000); await sleep(800);
  }
} catch (e) { console.log('FAIL', e.message); await page.screenshot({ path: `${out}-fail.png` }); }
res.errors = errors.slice(0, 10); res.http = bad.slice(0, 10); res.blockedSentry = blocked.length;
console.log(JSON.stringify(res)); await browser.close();
