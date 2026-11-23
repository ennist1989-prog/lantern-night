// Queue entry 1: engine-level tests for the corridor choice and for save/load persistence.
//
// The smuggling / corruption rules this entry was written for are not in the repo: no symbol, issue, PR, commit or
// data file names them (the entry says so too), so there is no confirmed tick rate and nothing here invents one.
// What is tested is the engine rule set the entry points at:
//   - src/game/interpreter.ts  case 'choice' (the index is stored only when the command sets c.var, then c.br[i] runs),
//                              case 'set' (switches), case 'self' (self-switches), case 'var' (+=, -=, =)
//   - src/core/state.ts        setV (floors, does not clamp), sw/setSw, selfKey
//   - src/core/save.ts         save / load / snapshotString / restoreString, and the snapshot localStorage format
//   - src/core/migrate.ts      an older snapshot keeps the choice's switches/variables on load
//
// Run (harness convention: preview on 127.0.0.1:8099, Playwright via tests/lib.mjs):
//   npm run build && python3 -m http.server 8099 --bind 127.0.0.1 --directory dist &
//   node tests/choice_persistence.mjs
// CHROME=/path/to/chrome overrides the browser executable (default /usr/bin/google-chrome).
import { launch, sleep, waitScene } from './lib.mjs';

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; return c; };

const { browser, page, errors } = await launch(process.env.BASE || process.argv[2]);

try {
  // Start a Map scene without the title screen: the interpreter and MessageSystem live on it.
  await waitScene(page, 'Title', 30000);
  await page.evaluate(() => { window.__S.$.newGame(); window.__game.scene.start('Map', { mode: 'load' }); });
  await waitScene(page, 'Map', 20000);
  await sleep(700);

  await page.evaluate(() => {
    const m = window.__game.scene.getScene('Map');
    window.__T = {
      m,
      origChoice: m.msg.choice.bind(m.msg),
      stub(i) { m.msg.choice = async () => i; },              // stands in for the player's pick
      restore() { m.msg.choice = this.origChoice; },
      run(list, ctx = { map: 1, ev: 7 }) { return m.interp.run(list, ctx); },
      reset() { const { $ } = window.__S; $.variables = {}; $.switches = {}; $.selfSwitches = {}; },
    };
  });

  // ---------------------------------------------------------------- the choice registers
  const first = await page.evaluate(async () => {
    const { $ } = window.__S; const T = window.__T; T.reset();
    T.stub(0);
    await T.run([{ c: 'choice', opts: ['Face the Warden', 'Not yet'], cancel: -1, var: 'warden_choice', br: [
      [{ c: 'set', sw: 'warden_faced' }, { c: 'var', name: 'faced_count', op: '+=', v: 1 }],
      [{ c: 'set', sw: 'warden_deferred' }],
    ] }]);
    const o = { v: $.v('warden_choice'), faced: $.sw('warden_faced'), deferred: $.sw('warden_deferred'), count: $.v('faced_count'), keys: Object.keys($.variables) };
    T.restore(); return o;
  });
  ok(first.v === 0, 'choice index 0 is stored in c.var (' + JSON.stringify(first) + ')');
  ok(first.faced === true && first.deferred === false, 'index 0 runs branch 0 only (warden_faced, not warden_deferred)');
  ok(first.count === 1, 'branch 0 sets its own variable (faced_count += 1)');

  const second = await page.evaluate(async () => {
    const { $ } = window.__S; const T = window.__T; T.reset();
    T.stub(1);
    await T.run([{ c: 'choice', opts: ['Face the Warden', 'Not yet'], cancel: -1, var: 'warden_choice', br: [
      [{ c: 'set', sw: 'warden_faced' }],
      [{ c: 'set', sw: 'warden_deferred' }],
    ] }]);
    const o = { v: $.v('warden_choice'), faced: $.sw('warden_faced'), deferred: $.sw('warden_deferred') };
    T.restore(); return o;
  });
  ok(second.v === 1 && second.deferred === true && second.faced === false, 'index 1 stores 1 and runs branch 1 only ' + JSON.stringify(second));

  // ---------------------------------------------------------------- no c.var, cancel, missing branch
  const noVar = await page.evaluate(async () => {
    const { $ } = window.__S; const T = window.__T; T.reset();
    T.stub(1);
    await T.run([{ c: 'choice', opts: ['a', 'b'], br: [[{ c: 'set', sw: 'pick_a' }], [{ c: 'set', sw: 'pick_b' }]] }]);
    const o = { vars: { ...$.variables }, b: $.sw('pick_b') };
    T.restore(); return o;
  });
  ok(Object.keys(noVar.vars).length === 0 && noVar.b === true, 'without c.var no variable is written, the branch still runs ' + JSON.stringify(noVar));

  const cancel = await page.evaluate(async () => {
    const { $ } = window.__S; const T = window.__T; T.reset();
    T.stub(-1);
    await T.run([{ c: 'choice', opts: ['Face the Warden', 'Not yet'], cancel: -1, var: 'warden_choice', br: [[{ c: 'set', sw: 'warden_faced' }], [{ c: 'set', sw: 'warden_deferred' }]] }]);
    const o = { v: $.v('warden_choice'), faced: $.sw('warden_faced'), deferred: $.sw('warden_deferred'), json: JSON.parse(JSON.stringify($.toJSON())).variables.warden_choice };
    T.restore(); return o;
  });
  ok(cancel.v === -1 && cancel.faced === false && cancel.deferred === false, 'cancel index -1 is stored as -1 and runs no branch ' + JSON.stringify(cancel));
  ok(cancel.json === -1, '-1 survives serialization (a stored choice is not treated as "unset")');

  const noBranch = await page.evaluate(async () => {
    const { $ } = window.__S; const T = window.__T; T.reset();
    T.stub(3);
    let threw = null;
    try { await T.run([{ c: 'choice', opts: ['a', 'b'], var: 'idx', br: [[{ c: 'set', sw: 'pick_a' }]] }]); } catch (e) { threw = String(e && e.message); }
    const o = { threw, v: $.v('idx') };
    T.restore(); return o;
  });
  ok(noBranch.threw === null && noBranch.v === 3, 'a choice with no branch for the picked index is safe ' + JSON.stringify(noBranch));

  // ---------------------------------------------------------------- nested choice + switches/self-switches
  const nested = await page.evaluate(async () => {
    const { $ } = window.__S; const T = window.__T; T.reset();
    let n = 0; const m = window.__T.m; m.msg.choice = async () => (n++ === 0 ? 0 : 1);
    await T.run([{ c: 'choice', opts: ['Step in', 'Wait'], var: 'outer', br: [[
      { c: 'choice', opts: ['Wave', 'Bow'], var: 'inner', br: [[{ c: 'set', sw: 'waved' }], [{ c: 'set', sw: 'bowed' }]] },
    ], [{ c: 'set', sw: 'waited' }]] }]);
    const o = { outer: $.v('outer'), inner: $.v('inner'), waved: $.sw('waved'), bowed: $.sw('bowed') };
    T.restore(); return o;
  });
  ok(nested.outer === 0 && nested.inner === 1 && nested.bowed === true && nested.waved === false, 'nested choice keeps both indices and runs the inner branch ' + JSON.stringify(nested));

  const switches = await page.evaluate(async () => {
    const { $ } = window.__S; const T = window.__T; T.reset();
    await T.run([{ c: 'set', sw: 'flag_on' }, { c: 'set', sw: 'flag_off', v: false }, { c: 'self', k: 'A' }], { map: 3, ev: 11 });
    const on = { flag_on: $.sw('flag_on'), flag_off: $.sw('flag_off'), self: $.selfSwitches[$.selfKey(3, 11, 'A')] };
    await T.run([{ c: 'self', k: 'A', v: false }], { map: 3, ev: 11 });
    return { on, cleared: !!$.selfSwitches[$.selfKey(3, 11, 'A')] };
  });
  ok(switches.on.flag_on === true && switches.on.flag_off === false, 'set writes true by default and clears with v:false');
  ok(switches.on.self === true && switches.cleared === false, 'self-switch keys by map/event/key and clears with v:false');

  // ---------------------------------------------------------------- setV bounds (floor, no clamp, negative delta)
  const vars = await page.evaluate(() => {
    const { $ } = window.__S; $.variables = {};
    $.setV('frac', 2.9); $.setV('neg', -5); $.setV('big', 1e9);
    const fromUnset = $.v('faced_count');
    $.setV('spend', 1); const cur = $.v('spend'); $.setV('spend', cur - 3);      // the interpreter's -= path
    $.setV('grow', 4); $.setV('grow', $.v('grow') + 2.7);                        // and its += path
    return { frac: $.v('frac'), neg: $.v('neg'), big: $.v('big'), fromUnset, spend: $.v('spend'), grow: $.v('grow'), unsetRead: $.v('never_set') };
  });
  ok(vars.frac === 2 && vars.grow === 6, 'setV floors (2.9 -> 2, 4 + 2.7 -> 6) ' + JSON.stringify(vars));
  ok(vars.neg === -5 && vars.spend === -2, 'setV does not clamp: negative deltas and negative values persist ' + JSON.stringify(vars));
  ok(vars.big === 1e9 && vars.unsetRead === 0 && vars.fromUnset === 0, 'setV has no upper bound; an unset variable reads 0');

  // ---------------------------------------------------------------- save -> load keeps the choice
  const saved = await page.evaluate(async () => {
    const { $, SaveManager } = window.__S; const T = window.__T; T.reset();
    T.stub(1);
    await T.run([{ c: 'choice', opts: ['Face the Warden', 'Not yet'], cancel: -1, var: 'warden_choice', br: [
      [{ c: 'set', sw: 'warden_faced' }, { c: 'var', name: 'faced_count', op: '+=', v: 1 }],
      [{ c: 'set', sw: 'warden_deferred' }, { c: 'self', k: 'B' }],
    ] }], { map: 5, ev: 42 });
    T.restore();
    const r = SaveManager.save(9);
    const key = 'lotfs.save.9';
    const raw = JSON.parse(localStorage.getItem(key));
    $.variables = {}; $.switches = {}; $.selfSwitches = {};      // wipe, then load the slot back
    const loaded = SaveManager.load(9);
    return {
      r, loaded, hasGame: !!raw.game, ver: raw.v, gameVer: raw.game.ver,
      v: $.v('warden_choice'), deferred: $.sw('warden_deferred'), faced: $.sw('warden_faced'),
      self: !!$.selfSwitches[$.selfKey(5, 42, 'B')], vars: { ...$.variables },
    };
  });
  ok(saved.r.ok === true && saved.loaded === true, 'slot 9 saves and loads (' + JSON.stringify(saved.r) + ')');
  ok(saved.v === 1 && saved.deferred === true && saved.faced === false, 'the chosen branch\'s switch and variable survive save/load ' + JSON.stringify({ v: saved.v, deferred: saved.deferred, faced: saved.faced }));
  ok(saved.self === true, 'the chosen branch\'s self-switch survives save/load (map/event key intact)');
  ok(saved.ver === 3 && saved.gameVer === 3, 'the snapshot carries save version 3 (v and game.ver)');

  // ---------------------------------------------------------------- string snapshot (boss checkpoint path)
  const strings = await page.evaluate(() => {
    const { $, SaveManager } = window.__S;
    $.setV('warden_choice', 0); $.setSw('warden_faced', true);
    const s = SaveManager.snapshotString();
    $.variables = {}; $.switches = {};
    SaveManager.restoreString(s);
    return { v: $.v('warden_choice'), faced: $.sw('warden_faced') };
  });
  ok(strings.v === 0 && strings.faced === true, 'snapshotString/restoreString round-trips the choice ' + JSON.stringify(strings));

  // ---------------------------------------------------------------- older snapshot keeps the choice fields
  const legacy = await page.evaluate(() => {
    const { $, SaveManager } = window.__S;
    const d = JSON.parse(localStorage.getItem('lotfs.save.9'));
    const old = JSON.parse(JSON.stringify(d));
    delete old.v; delete old.game.ver; delete old.game.chapter;      // a v1-era snapshot
    old.game.switches = { key_got: true, warden_deferred: true };
    old.game.variables = { warden_choice: 1 };
    localStorage.setItem('lotfs.save.8', JSON.stringify(old));
    $.variables = {}; $.switches = {}; $.chapter = 1;
    const loaded = SaveManager.load(8);
    return { loaded, v: $.v('warden_choice'), deferred: $.sw('warden_deferred'), chapter: $.chapter, ver: $.ver };
  });
  ok(legacy.loaded === true && legacy.v === 1 && legacy.deferred === true, 'a v1 snapshot keeps the choice variable and switch on load ' + JSON.stringify(legacy));
  ok(legacy.chapter === 2 && legacy.ver === 3, 'migration still runs (chapter inferred from key_got, ver -> 3)');

  const bad = errors.filter((e) => !/willReadFrequently/.test(e));
  ok(bad.length === 0, 'no page errors ' + JSON.stringify(bad.slice(0, 3)));
} catch (e) {
  console.log('FAIL exception ' + (e && e.stack || e) + ' errors=' + JSON.stringify(errors.slice(-5)));
  fails++;
}
await browser.close();
console.log(fails ? `CHOICE_PERSISTENCE ${fails} FAIL` : 'CHOICE_PERSISTENCE ALL PASS');
process.exit(fails ? 1 : 0);
