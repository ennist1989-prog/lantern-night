import { press, sleep } from './lib.mjs';
export async function state(page) { return page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); if (!b || !b.B) return null; const act = b.cmdWin.active ? b.cmdWin : b.subWin.active ? b.subWin : null; return { win: act ? (act === b.cmdWin ? 'cmd' : 'sub') : (b.targetWin.visible ? 'target' : 'none'), labels: act ? act.items.map((i) => i.label) : [], index: act ? act.index : -1, cols: act ? act.cols : 1, ended: b.ended, round: b.B.round, echo: b.B.echo, foes: b.B.foes.map((f) => [f.name, f.hp, f.mhp, Math.round(f.mood), f.calm ? 1 : 0, f.gone || '', f.vp, Object.keys(f.states).join(',')]), party: b.B.party.map((p) => [p.name, p.hp, p.sp, p.gauge]), realm: b.B.realm, lumen: b.B.lumen, pity: b.B.ctx.pity }; }); }
export async function waitInput(page, ms = 40000) { const t = Date.now(); while (Date.now() - t < ms) { const s = await state(page); if (!s) return null; if (s.ended) return s; if (s.win !== 'none') return s; await sleep(150); } throw new Error('waitInput timeout'); }
export async function pick(page, label) { let s = await waitInput(page); const t0 = Date.now(); while (s && !s.ended && s.win === 'target' && Date.now() - t0 < 5000) { await sleep(150); s = await waitInput(page); }   // the target window is still closing after the previous pick (flaked b5 under load)
  if (!s || s.win === 'none' || s.win === 'target') throw new Error('no menu for ' + label + ' ' + JSON.stringify(s)); const i = s.labels.indexOf(label); if (i < 0) throw new Error('label ' + label + ' not in ' + s.labels);
  // Step the cursor one key at a time and re-read it, instead of counting blind key presses: a dropped/lagged key on a slow CI runner
  // left the cursor on the wrong row (b4 opened Skill instead of Parley).
  const C = s.cols || 1; const win0 = s.win, lab0 = s.labels.join('|');
  for (let n = 0; n < 40 && s.index !== i; n++) { const r0 = Math.floor(s.index / C), c0 = s.index % C, r1 = Math.floor(i / C), c1 = i % C;
    await press(page, c0 !== c1 ? (c1 > c0 ? 'ArrowRight' : 'ArrowLeft') : (r1 > r0 ? 'ArrowDown' : 'ArrowUp'), 40); await sleep(60); s = await state(page);
    if (!s || s.win !== win0 || s.labels.join('|') !== lab0) throw new Error('menu changed while moving to ' + label + ' ' + JSON.stringify(s)); }
  if (s.index !== i) throw new Error('cursor never reached ' + label + ' ' + JSON.stringify(s));
  await press(page, 'Enter', 60); await sleep(120);
  // wait for the Enter to land (window or its contents change) so the next pick does not read the old menu
  for (let n = 0; n < 10; n++) { const s2 = await state(page); if (!s2 || s2.ended || s2.win !== win0 || s2.labels.join('|') !== lab0) break; await sleep(100); } }   // no re-press: the next actor's menu can look identical
export async function target(page, idx = 0) { let s = await waitInput(page); if (s.win !== 'target') throw new Error('not target ' + JSON.stringify(s)); for (let i = 0; i < idx; i++) await press(page, 'ArrowRight', 40); await press(page, 'Enter', 60); await sleep(120); }
export async function cmd(page, path, tgt) { for (const l of path) await pick(page, l); if (tgt !== undefined) await target(page, tgt); }
