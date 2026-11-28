#!/usr/bin/env node
/**
 * pacing-probe.mjs - headless run of the opening, recording when each beat
 * happens and where the game sits idle.
 *
 *   node tools/playtest/pacing-probe.mjs
 *
 * Serves dist/ on 127.0.0.1:8099 (npm run build first unless --no-build),
 * starts a New Game, plays the opening through the first save (the square
 * Lantern Post on map 1) and the first battle (a Far-Shore visible enemy after
 * Shift), then writes qa/pacing-probe.json.
 *
 * Scripted key taps only: held keys do not register under the software GL.
 * Any step that cannot be scripted throws with the scene and the last
 * timestamp instead of hanging; the whole run is capped at --timeout ms.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { launch, press } from '../../tests/lib.mjs';   // the same harness the other tests use: launch, New Game, key taps

// ------------------------------------------------------------------ options
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
};
const has = (name) => argv.includes(`--${name}`);

const PORT = Number(flag('port', process.env.PORT || 8099));
const BASE = String(flag('base', `http://127.0.0.1:${PORT}/`));
const OUT = path.resolve(String(flag('out', 'qa/pacing-probe.json')));
const TIMEOUT_MS = Number(flag('timeout', 300000));
const BUILD = !has('no-build');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const DIST = path.resolve('dist');

const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --------------------------------------------------------------- static host
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(DIST, url === '/' ? 'index.html' : url);
    if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) file = path.join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

// ------------------------------------------------------------------- the run
const record = { events: {}, settings: null, boot: {}, console_errors: [], idle: [], route: [], error: null };
const errors = [];
let lastLabel = 'start';

function mark(name, extra) {
  if (record.events[name] != null) return;
  record.events[name] = Date.now() - T0;
  log(`MARK ${name} = ${record.events[name]}ms${extra ? ` (${extra})` : ''}`);
}
function lastStamp() {
  const entries = Object.entries(record.events);
  return entries.length ? `${entries[entries.length - 1][0]}@${entries[entries.length - 1][1]}ms` : `start@0ms`;
}

// One snapshot of everything the probe treats as "the game did something".
function snapScript() {
  const g = window.__game; const S = window.__S;
  if (!g) return { booted: false };
  const active = g.scene.getScenes(true).map((s) => s.sys.settings.key);
  const m = g.scene.getScene('Map'); const b = g.scene.getScene('Battle');
  const party = S?.$?.party || [];
  const hp = party.reduce((n, id) => n + (S.$.actors[id]?.hp || 0), 0);
  return {
    booted: true, active,
    map: m?.mapData?.id ?? null, x: m?.player?.tx ?? null, y: m?.player?.ty ?? null, moving: !!m?.player?.moving,
    realm: S?.$?.realm ?? null, msgBusy: !!m?.msg?.busy, interpBusy: !!m?.interp?.busy,
    free: !!m?.isFree?.(), introDone: !!S?.$.sw?.('intro_done'), lantern: !!S?.$.has?.('lantern'),
    saveCount: window.__probeSaves || 0, lanternLit: !!S?.$.lumen, lumen: Math.round(S?.$.lumen ?? 0),
    fades: S?.$?.fades ?? 0, defeated: Object.keys(S?.$?.defeated || {}).length, mioHp: S?.$.actors?.[S.$.party[0]]?.hp ?? null,
    battleResult: window.__probeBattleResult || null,
    level: party.length ? S.$.actors[party[0]]?.level ?? null : null, hp,
    battleActive: !!b && g.scene.isActive('Battle'),
    battleHp: b?.B ? [...b.B.party, ...b.B.foes].reduce((n, f) => n + (f.hp || 0), 0) : null,
    battlePartyHp: b?.B ? b.B.party.reduce((n, f) => n + (f.hp || 0), 0) : null,
    battleFoeHp: b?.B ? b.B.foes.reduce((n, f) => n + (f.hp || 0), 0) : null,
  };
}
const snap = () => page.evaluate(snapScript);

// --- idle detection, sampled while the run does its own waiting -------------
let lastChange = Date.now();
let idleOpen = null;
let idleTimer = null;
let lastSig = '';
function startIdleWatch() {
  idleTimer = setInterval(async () => {
    try {
      const s = await snap();
      const sig = JSON.stringify([s.active, s.map, s.x, s.y, s.realm, s.msgBusy, s.interpBusy, s.saveCount, s.hp, s.battleHp, s.lumen]);
      const now = Date.now();
      if (sig !== lastSig) { lastSig = sig; lastChange = now; if (idleOpen) { idleOpen.end = now - T0; idleOpen.ms = idleOpen.end - idleOpen.start; record.idle.push({ ...idleOpen }); log(`idle stretch closed: ${idleOpen.ms}ms`); idleOpen = null; } }
      else if (!idleOpen && now - lastChange > 15000) {
        idleOpen = { start: lastChange - T0, end: null, ms: null, scene: s.active.join('+'), map: s.map, at: `${s.map}:${s.x},${s.y}` };
        log('idle stretch open');
      }
    } catch (e) { /* page busy or closing */ }
  }, 250);
}

async function waitFor(fn, what, ms = 15000, label = what) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await fn()) return true;
    await sleep(120);
  }
  throw new Error(`cannot ${what} - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()} (waited ${ms}ms for ${label})`);
}

const KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

async function tap(key, ms = 70) {
  await press(page, key, ms);
}

// Poll a condition while also advancing any message window it is waiting behind
// (the post's lighting text has to be read through before its autosave runs).
async function pumpUntil(fn, what, ms = 25000, label = what) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await fn()) return true;
    const s = await snap();
    if (s.msgBusy || s.interpBusy) await tap('Enter', 50);
    await sleep(180);
  }
  throw new Error(`cannot ${what} - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()} (waited ${ms}ms for ${label})`);
}

// Advance any open message window until the map is free again.
async function advanceText(ms = 20000, label = 'advance text') {
  const t = Date.now();
  let saw = false;
  while (Date.now() - t < ms) {
    const s = await snap();
    if (s.msgBusy || s.interpBusy) { saw = true; await tap('Enter', 50); await sleep(110); continue; }
    if (saw || Date.now() - t > 1500) return saw;
    await sleep(80);
  }
  if (saw) throw new Error(`cannot finish text - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()} (${label})`);
  return false;
}

function pathTo(gx, gy, adjacent) {
  return page.evaluate(([gx, gy, adjacent]) => {
    const m = window.__game.scene.getScene('Map');
    if (!m || !m.player || !m.mapData) return null;
    const sx = m.player.tx, sy = m.player.ty;
    const D = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
    const key = (x, y) => x + ',' + y;
    const goal = (x, y) => adjacent ? (Math.abs(x - gx) + Math.abs(y - gy) === 1) : (x === gx && y === gy);
    const blocked = (x, y) => m.evs.some((e) => e.page && e.char.visible && !e.page.through && !e.char.through && e.char.tx === x && e.char.ty === y);
    const prev = new Map(); prev.set(key(sx, sy), null);
    const q = [[sx, sy]];
    let found = null;
    while (q.length) {
      const [x, y] = q.shift();
      if (goal(x, y) && !(x === sx && y === sy)) { found = [x, y]; break; }
      for (const [d, dx, dy] of D) {
        const nx = x + dx, ny = y + dy; if (prev.has(key(nx, ny))) continue;
        if (!m.tileFree(nx, ny)) continue;
        if (blocked(nx, ny)) continue;
        prev.set(key(nx, ny), [x, y, d]); q.push([nx, ny]);
      }
    }
    if (!found) {
      // the goal itself may be the target tile (a post, a door): allow standing next to it
      for (const [d, dx, dy] of D) {
        const nx = gx + dx, ny = gy + dy; if (nx < 0 || ny < 0 || nx >= m.mapData.w || ny >= m.mapData.h) continue;
        if (!m.tileFree(nx, ny) || blocked(nx, ny)) continue;
        const sub = (() => {
          const p2 = new Map(); p2.set(key(sx, sy), null); const q2 = [[sx, sy]];
          while (q2.length) { const [x, y] = q2.shift(); if (x === nx && y === ny) { const out = []; let cur = key(nx, ny); while (p2.get(cur)) { const p = p2.get(cur); out.unshift(p[2]); cur = key(p[0], p[1]); } return out; }
            for (const [dd, ddx, ddy] of D) { const ax = x + ddx, ay = y + ddy; if (p2.has(key(ax, ay))) continue; if (!m.tileFree(ax, ay) || blocked(ax, ay)) continue; p2.set(key(ax, ay), [x, y, dd]); q2.push([ax, ay]); } }
          return null;
        })();
        if (sub) return sub;
      }
      return null;
    }
    const out = []; let cur = key(found[0], found[1]);
    while (prev.get(cur)) { const p = prev.get(cur); out.unshift(p[2]); cur = key(p[0], p[1]); }
    return out;
  }, [gx, gy, adjacent]);
}

async function walk(dirs, label) {
  for (const d of dirs) {
    const s0 = await snap();
    if (s0.battleActive) return 'battle';
    await page.keyboard.down(KEYS[d]);
    await sleep(90);
    await page.keyboard.up(KEYS[d]);
    await sleep(60);
    // wait for the tile step to finish, a scene change, or a cutscene to take over
    const t = Date.now();
    while (Date.now() - t < 4000) {
      const s = await snap();
      if (s.battleActive) return 'battle';
      if (s.map !== s0.map) return 'map';
      if (s.msgBusy || s.interpBusy) return 'cutscene';
      if (!s.moving) break;
      await sleep(40);
    }
    if (Date.now() - t >= 4000) throw new Error(`cannot walk ${d} - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()} (${label})`);
  }
  return 'done';
}

// --------------------------------------------------------------- one-off setup
async function instrument() {
  await page.evaluate(() => {
    const S = window.__S; if (!S) return;
    if (!S.SaveManager.__probe) {
      const orig = S.SaveManager.auto.bind(S.SaveManager);
      S.SaveManager.auto = (...a) => { window.__probeSaves = (window.__probeSaves || 0) + 1; window.__probeLastSaveAt = performance.now(); return orig(...a); };
      S.SaveManager.__probe = true;
    }
    // keep the battle result the map scene resolves with ('win' / 'lose' / 'escape' / 'calm')
    const m = window.__game.scene.getScene('Map');
    if (m && !m.__probeBattle) {
      const origBattle = m.startBattle.bind(m);
      m.startBattle = async (...a) => { const r = await origBattle(...a); window.__probeBattleResult = r; return r; };
      m.__probeBattle = true;
    }
  });
}

let page = null;
let browser = null;
let server = null;

async function main() {
  if (!fs.existsSync(CHROME)) {
    throw new Error(`no browser at ${CHROME}: set CHROME=/path/to/chrome (tests/lib.mjs uses the same variable)`);
  }
  if (BUILD) {
    log('npm run build');
    const b = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', shell: process.platform === 'win32' });
    if (b.status !== 0) throw new Error(`npm run build failed (${b.status}):\n${(b.stdout || '') + (b.stderr || '')}`);
  }
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('dist/index.html is missing - run npm run build (or drop --no-build)');
  server = await serve();
  log(`serving ${DIST} on ${BASE}`);

  const harness = await launch(BASE);   // headless Chromium, swiftshader flags, 816x624, Sentry aborted
  browser = harness.browser; page = harness.page;
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  if (!has('harness-pace')) {
    // tests/lib.mjs pins walkSpeed=brisk, textSpeed=2 for its own timings; a pacing
    // probe wants the defaults a first-time player gets (classic, textSpeed 1).
    await page.evaluate(() => localStorage.setItem('lotfs.settings', JSON.stringify({ bgm: 0.5, se: 0.7, textSpeed: 1, alwaysRun: false, walkSpeed: 'classic', battleSpeed: 1, autoBattle: false, autoV2: true, difficulty: 'standard', touch: true, msgAuto: false, juice: 'full', warmth: 0 })));
    await page.reload();
  }

  mark('run_start');
  startIdleWatch();

  const titleAt = Date.now();
  await waitFor(async () => (await snap()).active.includes('Title'), 'reach the title screen', 45000, 'Title active');
  record.boot.titleToScene = Date.now() - titleAt;
  mark('title_shown');

  // New Game: Title -> Map (lib.mjs newGame does the same two steps)
  await sleep(700);
  await tap('Enter');
  await waitFor(async () => (await snap()).active.includes('Map'), 'start a new game', 20000, 'Map active');
  await instrument();
  record.settings = await page.evaluate(() => (window.__S?.Settings?.data ? { ...window.__S.Settings.data } : null));
  mark('new_game');
  // the opening narration owns the screen from here
  await waitFor(async () => (await snap()).msgBusy, 'see the opening narration', 20000, 'message window');

  // advance the autorun intro; note the first dialogue, the lantern item and control
  {
    const t = Date.now();
    let gave = false;
    while (Date.now() - t < 120000) {
      const s = await snap();
      if (!record.events.first_dialogue && s.msgBusy) mark('first_dialogue');
      if (!gave && s.lantern) { gave = true; mark('first_item'); }
      if (s.introDone && s.free && s.map === 2) break;
      if (s.msgBusy || s.interpBusy) { await tap('Enter', 50); await sleep(140); continue; }
      await sleep(120);
    }
    const s = await snap();
    if (!s.introDone) throw new Error(`cannot finish the intro - scene=${JSON.stringify(s.active)} last=${lastStamp()} (intro_done never set)`);
    mark('control_given');
    record.route.push({ step: 'intro', map: s.map, x: s.x, y: s.y, at: record.events.control_given });
  }

  // dismiss the controls checklist if it is up (any press), then walk to the door
  await tap('Enter');
  await sleep(300);

  {
    const p = await pathTo(6, 9, false);
    if (!p) throw new Error(`cannot path to the house door - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()}`);
    log(`house door: ${p.length} step(s) ${p.join(',')}`);
    // stop on the tile before the door, then step into it so the touch event fires
    const before = p.slice(0, -1);
    if (before.length) await walk(before, 'walk to house door');
    await tap(KEYS[p[p.length - 1]], 90);
    await waitFor(async () => (await snap()).map === 1, 'go through the house door', 20000, 'map 1');
    record.route.push({ step: 'house_to_village', map: 1, at: Date.now() - T0 });
    await waitFor(async () => (await snap()).free, 'regain control in the village', 20000, 'isFree on map 1');
  }

  // walk to the square Lantern Post (16,16) and light it: that is the first save
  {
    const p = await pathTo(16, 16, true);
    if (!p) throw new Error(`cannot path to the Lantern Post - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()}`);
    log(`post: ${p.length} step(s) ${p.join(',')}`);
    const r = await walk(p, 'walk to the Lantern Post');
    if (r === 'cutscene') await advanceText(20000, 'clear the way to the post');
    const st = await snap();
    // face the post and act on it
    const dx = 16 - st.x, dy = 16 - st.y;
    const face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    await tap(KEYS[face], 60);
    await tap('Enter', 60);
    await pumpUntil(async () => (await snap()).saveCount > 0, 'light the post (first save)', 30000, 'SaveManager.auto');
    mark('first_save');
    record.route.push({ step: 'light_post', map: 1, x: st.x, y: st.y, at: record.events.first_save });
    await advanceText(25000, 'clear the post tip');
    await waitFor(async () => (await snap()).free, 'regain control after the post', 20000, 'isFree at the post');
  }

  // Shift to the Far Shore, then walk into the nearest visible enemy's aggro range
  {
    await tap('q', 70);
    await waitFor(async () => (await snap()).realm === 'far', 'shift to the Far Shore', 15000, 'realm=far');
    record.route.push({ step: 'shift_far', map: 1, at: Date.now() - T0 });
    await waitFor(async () => (await snap()).free, 'regain control on the Far Shore', 15000, 'isFree far');

    const enemies = await page.evaluate(() => window.__game.scene.getScene('Map').evs
      .filter((e) => e.page && e.page.enemy && e.char.visible)
      .map((e) => ({ id: e.id, x: e.char.tx, y: e.char.ty, troop: e.page.enemy.troop })));
    if (!enemies.length) throw new Error(`no visible enemy on the Far Shore - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()} (map 1, realm far)`);
    const me = await snap();
    enemies.sort((a, b) => (Math.abs(a.x - me.x) + Math.abs(a.y - me.y)) - (Math.abs(b.x - me.x) + Math.abs(b.y - me.y)));
    const foe = enemies[0];
    log(`nearest Far-Shore enemy: event ${foe.id} (${foe.troop}) at ${foe.x},${foe.y}`);
    record.route.push({ step: 'enemy', id: foe.id, troop: foe.troop, x: foe.x, y: foe.y, at: Date.now() - T0 });

    let battle = false;
    for (let attempt = 0; attempt < 3 && !battle; attempt++) {
      const p = await pathTo(foe.x, foe.y, true);
      if (!p) throw new Error(`cannot path to the enemy - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()}`);
      log(`enemy approach ${attempt + 1}: ${p.length} step(s)`);
      for (const d of p) {
        await page.keyboard.down(KEYS[d]); await sleep(90); await page.keyboard.up(KEYS[d]); await sleep(60);
        const t = Date.now();
        while (Date.now() - t < 2500) {
          const s = await snap();
          if (s.battleActive) { battle = true; break; }
          if (!s.moving) break;
          await sleep(40);
        }
        if (battle) break;
      }
      if (!battle) {
        // the enemy chases; give it a moment to close in
        const t = Date.now();
        while (Date.now() - t < 8000) { if ((await snap()).battleActive) { battle = true; break; } await sleep(150); }
      }
    }
    if (!battle) throw new Error(`cannot start the first battle - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()} (enemy ${foe.id} at ${foe.x},${foe.y})`);
    mark('first_encounter_start');
  }

  // fight: Enter walks Fight -> Attack -> target every round
  {
    const t = Date.now();
    let ended = false;
    const trace = [];
    let nextSample = 0;
    while (Date.now() - t < 180000) {
      const s = await snap();
      if (!s.battleActive) { ended = true; break; }
      if (Date.now() - t >= nextSample) { trace.push({ t: Date.now() - T0, party: s.battlePartyHp, foes: s.battleFoeHp }); nextSample += 1000; }
      await tap('Enter', 45);
      await sleep(200);
      const l = (await snap()).level;
      if (l != null && l > (record.boot.level ?? 0)) { record.boot.level = l; }
    }
    record.battle_trace = trace.slice(0, 120);
    if (!ended) throw new Error(`cannot end the first battle - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()} (180s cap)`);
    mark('first_encounter_end');
    record.route.push({ step: 'battle_end', at: record.events.first_encounter_end });
    await advanceText(20000, 'clear the post-battle text');
  }

  {
    const s = await snap();
    record.boot.final = { map: s.map, x: s.x, y: s.y, realm: s.realm, level: s.level, lumen: s.lumen, saves: s.saveCount, hp: s.mioHp, fades: s.fades, defeated: s.defeated, battle_result: s.battleResult };
    record.first_encounter_outcome = s.battleResult || null;   // startBattle resolves after the defeat fade, so read it here, not at the scene stop
    if (!record.events.first_item && s.level && s.level > 1) mark('first_item_or_levelup');
  }
}

// --------------------------------------------------------------------- drive
let exitCode = 0;
try {
  const watchdog = setTimeout(async () => {
    record.error = `hard timeout after ${TIMEOUT_MS}ms`;
    console.error(record.error);
    try { await browser?.close(); } catch {}
    try { server?.close(); } catch {}
    finish(1);
  }, TIMEOUT_MS);
  watchdog.unref?.();

  await main();
  if (!record.events.first_save) throw new Error(`no first save timestamp - scene=${JSON.stringify((await snap()).active)} last=${lastStamp()}`);
  if (!record.events.first_encounter_start || !record.events.first_encounter_end) throw new Error(`incomplete encounter timestamps - last=${lastStamp()}`);
  if (!record.events.control_given) throw new Error(`no control_given timestamp - last=${lastStamp()}`);
  if (!record.events.first_dialogue) throw new Error(`no first_dialogue timestamp - last=${lastStamp()}`);
} catch (err) {
  record.error = String(err.message || err);
  console.error('\nFAIL:', record.error);
  exitCode = 1;
} finally {
  clearInterval(idleTimer);
  if (idleOpen) { idleOpen.end = Date.now() - T0; idleOpen.ms = idleOpen.end - idleOpen.start; record.idle.push({ ...idleOpen }); }
  record.console_errors = errors;
  if (!record.events.first_item_or_levelup) {
    const lvl = record.boot.final?.level;
    if (lvl) record.events.first_item_or_levelup = record.events.first_item ?? record.events.first_encounter_end ?? null;
  }
  try { await browser?.close(); } catch {}
  try { server?.close(); } catch {}
  finish(exitCode);
}

function finish(code) {
  if (record.error) code = 1;
  if (record.console_errors.length) code = 1;
  const required = ['title_shown', 'new_game', 'first_dialogue', 'control_given', 'first_save', 'first_encounter_start', 'first_encounter_end'];
  const missing = required.filter((k) => record.events[k] == null);
  const out = {
    probe: 'tools/playtest/pacing-probe.mjs',
    generated: new Date().toISOString(),
    base: BASE,
    settings: record.settings,
    timings_ms: record.events,
    missing_timestamps: missing,
    console_errors: record.console_errors,
    idle_stretches: record.idle,
    battle_trace: record.battle_trace || [],
    first_encounter_outcome: record.first_encounter_outcome ?? null,
    route: record.route,
    final_state: record.boot.final ?? null,
    result: missing.length || record.console_errors.length || record.error ? 'fail' : 'pass',
    error: record.error,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`\n${out.result.toUpperCase()}: ${OUT}`);
  console.table(out.timings_ms);
  if (missing.length) console.error('missing:', missing.join(', '));
  if (record.console_errors.length) console.error('console errors:\n  ' + record.console_errors.join('\n  '));
  if (out.idle_stretches.length) console.log(`idle stretches over 15s: ${out.idle_stretches.map((i) => `${i.ms}ms in ${i.scene}@${i.at}`).join(', ')}`);
  process.exit(code);
}
