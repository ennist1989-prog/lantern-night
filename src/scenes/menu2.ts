// Items / Skills / Equipment / Key Items / Forge screens of the pause menu (split out of menu.ts).
import { Input } from '../core/input';
import { Audio } from '../core/audio';
import { $, SLOT_NAMES } from '../core/state';
import { DB, PARAM_NAMES, ELEMENT_NAMES, ELEMENT_COLORS, iconOf } from '../core/db';
import { Win, Selectable, COL } from '../ui/windows';
import { SPEC } from '../battle/spec';
import { RARITY_COL, activeSets, traitText, itemParams, forgeStat } from '../core/gear';
import { itemNeedsTarget, useItemOnActor, useItemGlobal, castField, canCastField } from '../core/fielduse';
import { locksFor, KIND_LABEL, lockOpen } from '../core/locks';
type S = any;
const SCHOOL: Record<string, string> = { rites: 'Lantern Rites', fox: 'Foxfire Arts', forge: 'Forge Rites', bond: 'Bond Song', veil: 'Veil Art', echo: 'Echo Art', combo: 'Unison Art', field: 'Field Magic' };
/** Short feedback line over the bottom of the panel. */
export function note(sc: S, text: string, ms = 1500) { const w = sc.mk(new Win(sc, 258, 478, 540, 48, sc.tone)); w.setDepth(400); w.txt(text, 270, 8, { size: 18, wrap: 520, color: COL.gold }); sc.time.delayedCall(ms, () => { if (w.active !== undefined) sc.rm(w); }); }
const waitCancel = (list: Selectable) => new Promise<void>((res) => { list.onCancel = () => res(); });

// ---------------------------------------------------------------- Items
export async function itemScreen(sc: S) {
  const panel = sc.panel(); panel.setDepth(100); const list = sc.mk(new Selectable(sc, 248, 8, 560, 520, sc.tone)); list.setDepth(101); const desc = sc.mk(new Win(sc, 248, 536, 560, 80, sc.tone)); desc.setDepth(101);
  list.cols = 1; list.rowH = 36; list.pad = 14; list.fontSize = 21; let sel = 0;
  const ORDER: Record<string, number> = { item: 0, offering: 1, material: 2 };
  const build = () => {
    const ids = Object.keys($.items).filter((k) => DB.items[k] && ['item', 'material', 'offering'].includes(DB.items[k].type) && $.items[k] > 0).sort((a, b) => ORDER[DB.items[a].type] - ORDER[DB.items[b].type]);
    const rows = ids.map((id) => { const it = DB.items[id]; const u = it.usable === true || it.usable === 'menu'; return { label: it.name, icon: iconOf(it), value: '×' + $.items[id], enabled: u, color: it.type === 'material' ? COL.dim : RARITY_COL(it.rarity), data: id }; });
    list.setItems(rows, true); if (!rows.length) { list.clear(); list.txt('You are carrying nothing.', 20, 20, { color: COL.dim }); } list.index = Math.min(sel, Math.max(0, rows.length - 1)); list.refresh();
  };
  list.onSelect = (it, i) => { sel = i; desc.clear(); if (it) { const d = DB.items[it.data]; desc.txt(d.desc + (d.type === 'offering' || d.offer ? '' : ''), 14, 8, { size: 18, wrap: 530 }); if (d.price) desc.txt('Sells for ' + Math.floor(d.price / 2) + ' G', 14, 54, { size: 14, color: COL.dim }); } };
  build(); list.onSelect(list.current, list.index); list.active = true;
  let closeResult: any;
  await new Promise<void>((res) => {
    list.onCancel = () => res();
    list.onOk = async (it: any) => { const id = it.data; const item = DB.items[id]; list.active = false;
      let r: any;
      if (itemNeedsTarget(item)) { const who = await sc.pickMember(420, 140, { show: (m: string) => { const a = $.actors[m]; return `HP ${a.hp}/${$.param(a, 'mhp')}  SP ${a.sp}/${$.param(a, 'msp')}`; } }); if (who) r = useItemOnActor(id, who); }
      else r = useItemGlobal(id);
      if (r) { if (r.ok) { Audio.se(r.action ? 'powerup' : 'heal'); if (r.msg) note(sc, r.msg); if (r.action) { closeResult = { action: r.action }; res(); return; } } else { Audio.se('buzzer'); if (r.msg) note(sc, r.msg); } }
      sc.refresh(); build(); list.onSelect(list.current, list.index); list.active = true; };
  });
  sc.rm(list); sc.rm(desc); sc.rm(panel); return closeResult;
}

// ---------------------------------------------------------------- Skills / spellbook
export async function skillScreen(sc: S) {
  const who = await sc.pickMember(300, 100); if (!who) return; let cur = who; let closeResult: any;
  const panel = sc.panel(); panel.setDepth(100); const list = sc.mk(new Selectable(sc, 248, 150, 560, 380, sc.tone)); list.setDepth(101); const desc = sc.mk(new Win(sc, 248, 536, 560, 80, sc.tone)); desc.setDepth(101);
  const head = sc.mk(new Win(sc, 248, 8, 560, 134, sc.tone)); head.setDepth(101); list.cols = 2; list.rowH = 34; list.pad = 14; list.fontSize = 19;
  const usableOut = (sk: any) => sk.type === 'field' || (sk.scope === 'one_ally' && (sk.effects || []).some((e: any) => e.op === 'heal'));
  const build = () => {
    head.clear(); sc.drawActor(head, cur, 14, 8, 530); const a = $.actors[cur]; const rows: any[] = [];
    for (const k of a.skills) { const sk = DB.skills[k]; if (!sk || ['p_attack', 'p_guard'].includes(k) || sk.tags?.includes('summon')) continue;
      const cost = [sk.cost?.sp ? sk.cost.sp + ' SP' : sk.cost?.bond ? sk.cost.bond + ' BG' : '', sk.cost?.lumen ? sk.cost.lumen + '◈' : '', sk.cost?.echo ? sk.cost.echo + '◆' : ''].filter(Boolean).join(' ');
      rows.push({ label: sk.name, icon: iconOf(sk), value: cost, enabled: usableOut(sk) && (sk.type === 'field' ? canCastField(cur, k).ok : a.sp >= (sk.cost?.sp || 0)), color: sk.type === 'field' ? COL.teal : ELEMENT_COLORS[sk.element || 'phys'], data: { k } }); }
    let hidden = 0; for (const [lv, k] of DB.actors[cur].skills) { const sk = DB.skills[k]; if (sk && a.level < lv && String(k).startsWith('sp_') && hidden++ < 4) rows.push({ label: '???', value: 'Lv ' + lv, enabled: false, color: COL.dim, data: { k, locked: lv } }); }
    list.setItems(rows);
  };
  list.onSelect = (it: any) => { desc.clear(); if (!it) return; const { k, locked } = it.data; const sk = DB.skills[k];
    if (locked) { desc.txt(`A spell for ${DB.actors[cur].name} to learn at Level ${locked}.`, 14, 8, { size: 18, wrap: 530, color: COL.dim }); return; }
    desc.txt(sk.desc || '', 14, 6, { size: 17, wrap: 530 }); const sch = sk.school ? SCHOOL[sk.school] : ''; desc.txt((sch ? sch + ' · ' : '') + ELEMENT_NAMES[sk.element || 'phys'] + (sk.type === 'field' ? ' · Field (map only)' : sk.type === 'field' ? '' : ' · ' + ({ phys: 'Physical', mag: 'Magic', support: 'Support', parley: 'Parley', special: 'Special' } as any)[sk.type]) + (sk.cooldown ? ' · CD ' + sk.cooldown : '') + (sk.oncePerBattle ? ' · once/battle' : ''), 14, 54, { size: 15, color: ELEMENT_COLORS[sk.element || 'phys'] }); };
  build(); list.active = true;
  await new Promise<void>((res) => {
    list.onCancel = () => res(); list.onPage = (d: number) => { const i = $.party.indexOf(cur); cur = $.party[(i + d + $.party.length) % $.party.length]; build(); Audio.se('cursor'); };
    list.onOk = async (it: any) => { const k = it.data.k; const sk = DB.skills[k]; list.active = false;
      if (sk.type === 'field') { const r = castField(cur, k); if (!r.ok) { Audio.se('buzzer'); if (r.msg) note(sc, r.msg); } else if (r.action) { closeResult = { action: { ...r.action, fromMenu: true } }; res(); return; } else { Audio.se('powerup'); if (r.msg) note(sc, r.msg); } }
      else { const t = await sc.pickMember(420, 200); if (t) { const a = $.actors[cur], b = $.actors[t]; const mhp = $.param(b, 'mhp'); if (b.hp >= mhp || b.hp <= 0) Audio.se('buzzer'); else { const ef = sk.effects.find((e: any) => e.op === 'heal'); a.sp -= sk.cost.sp; b.hp = Math.min(mhp, b.hp + Math.round((ef.base || 0) + (ef.mult || 0) * $.param(a, ef.stat || 'mat'))); Audio.se('heal'); } } }
      build(); sc.refresh(); list.active = true; };
  });
  [list, desc, head, panel].forEach((x) => sc.rm(x)); return closeResult;
}

// ---------------------------------------------------------------- Equipment (weapon, armor, charm ×2, keepsake)
function setLine(equips: Record<string, string | null>) { const out: string[] = []; for (const s of activeSets(equips)) { out.push(`${s.name} ${s.count}pc: ` + [...s.traits.map(traitText), ...Object.entries(s.params).map(([k, v]) => k.toUpperCase() + ' +' + v)].filter(Boolean).join(', ')); } return out.join('\n'); }
export function equipSlots(): string[] { const o = ['weapon', 'armor', 'acc']; if ($.has('charm_cord')) o.push('acc2'); if (keepsakeItems().length || Object.values($.actors).some((a) => a.equips.keepsake)) o.push('keepsake'); return o; }
export const keepsakeItems = () => Object.values<any>(SPEC.summons.summons).filter((s) => $.has(s.keepsake)).map((s) => s.keepsake as string);
const slotKind = (s: string) => (s === 'acc2' ? 'acc' : s);
export async function equipScreen(sc: S) {
  const who = await sc.pickMember(300, 100); if (!who) return; let cur = who;
  const panel = sc.panel(); panel.setDepth(100); const slots = sc.mk(new Selectable(sc, 248, 8, 560, 190, sc.tone)); slots.setDepth(101); const stats = sc.mk(new Win(sc, 556, 206, 252, 250, sc.tone)); stats.setDepth(101); const desc = sc.mk(new Win(sc, 248, 536, 560, 80, sc.tone)); desc.setDepth(101);
  const info = sc.mk(new Win(sc, 248, 462, 560, 68, sc.tone)); info.setDepth(101);
  const list = sc.mk(new Selectable(sc, 248, 206, 300, 250, sc.tone)); list.setDepth(102); list.setVisible(false); info.setVisible(true);
  slots.rowH = 34; slots.pad = 12; slots.fontSize = 20; list.rowH = 36; list.pad = 14; list.fontSize = 20; let hover: { slot: string; item: string | null } | undefined;
  const nm = (id: string | null | undefined) => { if (!id) return '—'; const it = DB.items[id]; const f = $.forged[id] || 0; return it.name + (f ? ' +' + f : ''); };
  const drawStats = () => { stats.clear(); const a = $.actors[cur]; stats.txt(DB.actors[cur].name + '  Lv ' + a.level, 14, 6, { size: 20, color: COL.gold });
    const copy = { ...a, equips: { ...a.equips } }; if (hover && hover.slot !== 'keepsake') copy.equips[hover.slot] = hover.item;
    ['mhp', 'msp', 'atk', 'def', 'mat', 'mdf', 'agi'].forEach((k, i) => { const y = 40 + i * 27; const c = $.param(a, k), n = $.param(copy, k); stats.txt(PARAM_NAMES[k], 14, y, { size: 17, color: COL.sys }); stats.txt(String(c), 150, y, { size: 18, align: 'right' }); if (hover && hover.slot !== 'keepsake') { stats.txt('→', 160, y, { size: 17, color: COL.dim }); stats.txt(String(n), 232, y, { size: 18, align: 'right', color: n > c ? COL.green : n < c ? COL.red : COL.white }); } });
    const sl = setLine(copy.equips); stats.txt(sl ? 'Set bonus' : '', 14, 236, { size: 14, color: COL.sys }); if (sl) stats.txt(sl, 14, 252, { size: 12, color: COL.green, wrap: 224 }); };
  const build = () => { const a = $.actors[cur]; slots.setItems(equipSlots().map((s) => { const e = a.equips[s]; const kp = s === 'keepsake'; return { label: SLOT_NAMES[s], value: kp ? (e ? Object.values<any>(SPEC.summons.summons).find((x) => x.keepsake === e)?.name || '—' : '—') : nm(e), icon: e ? iconOf(DB.items[e]) : undefined, color: e ? RARITY_COL(DB.items[e]?.rarity) : COL.dim, data: s }; }), true); hover = undefined; drawStats(); };
  const showDesc = (id: string | null, slot?: string) => { desc.clear(); info.clear(); if (!id) { desc.txt('Nothing equipped.', 14, 8, { size: 19 }); return; } const it = DB.items[id]; desc.txt(it.desc || '', 14, 6, { size: 17, wrap: 530 });
    const bits: string[] = []; if (it.rarity) bits.push(it.rarity.toUpperCase()); if ($.forged[id]) bits.push('Forged +' + $.forged[id]); if (it.set) bits.push('Set: ' + (DB.equipment.sets[it.set]?.name || it.set)); if (it.traits) bits.push(it.traits.map(traitText).filter(Boolean).join(', ')); if (it.realm) bits.push('Near ' + Object.entries(it.realm.near || {}).map(([k, v]) => k.toUpperCase() + ' ' + v).join('/') + ' · Far ' + Object.entries(it.realm.far || {}).map(([k, v]) => k.toUpperCase() + ' ' + v).join('/'));
    info.txt(bits.join('   '), 12, 6, { size: 14, color: RARITY_COL(it.rarity), wrap: 536 }); void slot; };
  slots.onSelect = (it: any) => { if (it) showDesc($.actors[cur].equips[it.data]); };
  build(); slots.active = true; slots.onSelect(slots.current, 0);
  await new Promise<void>((res) => {
    slots.onCancel = () => res(); slots.onPage = (d: number) => { const i = $.party.indexOf(cur); cur = $.party[(i + d + $.party.length) % $.party.length]; build(); slots.onSelect(slots.current, slots.index); Audio.se('cursor'); };
    slots.onOk = (it: any) => { const slot = it.data as string; const a = $.actors[cur]; const kind = slotKind(slot);
      let rows: any[];
      if (slot === 'keepsake') rows = [{ label: '(Remove)', data: null, enabled: !!a.equips.keepsake }, ...keepsakeItems().map((k) => { const sm = Object.values<any>(SPEC.summons.summons).find((x) => x.keepsake === k); return { label: sm.name, icon: iconOf(DB.items[k]), value: 'T' + sm.tier, data: k }; })];
      else { const cands = Object.keys($.items).filter((k) => DB.items[k] && (DB.items[k].slot || DB.items[k].type) === kind && (!DB.items[k].who || DB.items[k].who.includes(cur)) && $.items[k] > 0);
        rows = [{ label: '(Remove)', data: null, enabled: !!a.equips[slot] }, ...cands.map((k) => ({ label: nm(k), icon: iconOf(DB.items[k]), value: '×' + $.items[k], color: RARITY_COL(DB.items[k].rarity), data: k }))]; }
      slots.active = false; list.setVisible(true); list.setItems(rows); list.active = true;
      list.onSelect = (r: any) => { hover = { slot, item: r ? r.data : null }; drawStats(); showDesc(r ? r.data : null, slot); };
      list.onSelect(list.current, 0);
      const back = () => { list.active = false; list.setVisible(false); hover = undefined; build(); slots.onSelect(slots.current, slots.index); slots.active = true; };
      list.onCancel = back;
      list.onOk = (r: any) => { const old = a.equips[slot];
        if (slot === 'keepsake') { for (const o of Object.values($.actors)) if (r.data && o.equips.keepsake === r.data) o.equips.keepsake = null; a.equips.keepsake = r.data; }
        else { if (old) $.gain(old, 1); if (r.data) { $.gain(r.data, -1); a.equips[slot] = r.data; } else a.equips[slot] = null; }
        $.clampActor(a); Audio.se('equip'); back(); };
    };
  });
  [list, info, slots, stats, desc, panel].forEach((x) => sc.rm(x));
}

// ---------------------------------------------------------------- Key Items (journal)
export async function keyItemsScreen(sc: S) {
  const panel = sc.panel(); panel.setDepth(100); const list = sc.mk(new Selectable(sc, 248, 8, 262, 608, sc.tone)); list.setDepth(101); const det = sc.mk(new Win(sc, 518, 8, 290, 608, sc.tone)); det.setDepth(101);
  list.rowH = 34; list.pad = 12; list.fontSize = 18; const K = DB.keyitems.items;
  const ids = Object.keys(K).filter((k) => $.has(k) || $.seenKeys[k]).sort((a, b) => K[a].chapter - K[b].chapter);
  const rows = ids.map((id) => ({ label: K[id].name, icon: iconOf(DB.items[id]), value: K[id].stack ? '×' + ($.items[id] || 0) + '/' + K[id].stack : ($.items[id] || 0) > 1 ? '×' + $.items[id] : !$.seenKeys[id] ? '★' : '', color: $.has(id) ? COL.white : COL.dim, data: id }));
  let im: Phaser.GameObjects.Image | undefined;
  list.onSelect = (it: any) => { det.clear(); im?.destroy(); im = undefined; if (!it) return; const id = it.data; const k = K[id]; $.seenKeys[id] = true; const n = $.items[id] || 0;
    const w = det.icon(iconOf(DB.items[id]) || '', 14, 12, 2.2); void w;
    det.txt(k.name + (k.stack ? `  ×${n}/${k.stack}` : n > 1 ? '  ×' + n : ''), 84, 14, { size: 22, color: COL.gold, wrap: 196 }); det.txt(`Chapter ${k.chapter} · ${(k.cats || []).join(', ')}`, 84, 62, { size: 13, color: COL.dim, wrap: 196 });
    let y = 96; det.txt(k.desc, 14, y, { size: 16, wrap: 262 }); y += 20 + Math.ceil(k.desc.length / 30) * 20;
    det.txt('Found', 14, y, { size: 15, color: COL.sys }); det.txt(k.how || '—', 14, y + 20, { size: 13, wrap: 262, color: COL.dim }); y += 24 + Math.ceil((k.how || '').length / 36) * 16 + 10;
    const L = locksFor(id); if (L.length) { det.txt('Used for', 14, y, { size: 15, color: COL.sys }); y += 22; for (const l of L.slice(0, 4)) { const open = lockOpen(l.id); det.txt(`${KIND_LABEL[l.kind] || l.kind}: ${l.desc}`, 14, y, { size: 13, wrap: 262, color: open ? COL.green : COL.white }); y += 16 + Math.ceil((l.desc.length + 12) / 36) * 14; } }
    if (k.keepsake) { const sm = SPEC.summons.summons[k.keepsake]; if (sm) { det.txt('Keepsake → ' + sm.name, 14, Math.min(y + 4, 560), { size: 14, color: COL.violet, wrap: 262 }); } }
  };
  det.txt('', 0, 0);
  if (!rows.length) list.txt('No key items yet.', 14, 14, { color: COL.dim }); else list.setItems(rows);
  list.txt(`${ids.filter((i) => $.has(i)).length}/${Object.keys(K).length}`, 190, 4, { size: 13, color: COL.dim });
  list.active = true; await waitCancel(list); im?.destroy(); [list, det, panel].forEach((x) => sc.rm(x));
}

// ---------------------------------------------------------------- Forge (Smith's Tongs)
export function forgeCost(id: string) {
  const it = DB.items[id]; const lv = ($.forged[id] || 0) + 1; const F = DB.equipment.forge; const t = String(it.tier || 1); const T = F.tiers[t]; if (!T || lv > F.cap) return null;
  const gold = T.gold['+' + lv]; const need: Record<string, number> = F.matsRule['+' + lv]; const picks: Record<string, number> = {}; let ok = $.gold >= gold; const lines: { r: string; need: number; have: number }[] = [];
  const used: Record<string, number> = {};
  for (const [r, n] of Object.entries<number>(need)) { const fam: string[] = T.families[r] || []; const have = fam.reduce((s, m) => s + ($.items[m] || 0), 0); lines.push({ r, need: n, have }); if (have < n) ok = false; else { let left = n; for (const m of fam.slice().sort((a, b) => ($.items[b] || 0) - ($.items[a] || 0))) { const take = Math.min(left, $.items[m] || 0); if (take) { picks[m] = (picks[m] || 0) + take; left -= take; } if (!left) break; } } }
  void used; return { lv, gold, lines, picks, ok };
}
export async function forgeScreen(sc: S) {
  const panel = sc.panel(); panel.setDepth(100); const list = sc.mk(new Selectable(sc, 248, 8, 290, 608, sc.tone)); list.setDepth(101); const det = sc.mk(new Win(sc, 546, 8, 262, 608, sc.tone)); det.setDepth(101);
  list.rowH = 34; list.pad = 12; list.fontSize = 18;
  const owned = () => { const s = new Set<string>(); for (const k of Object.keys($.items)) s.add(k); for (const a of Object.values($.actors)) for (const e of ['weapon', 'armor']) if (a.equips[e]) s.add(a.equips[e]!); return [...s].filter((k) => DB.items[k] && ['weapon', 'armor'].includes(DB.items[k].type) && DB.items[k].forge && !DB.items[k].relic && (DB.items[k].tier || 0) >= 1); };
  const build = () => { const rows = owned().map((id) => ({ label: DB.items[id].name + ($.forged[id] ? ' +' + $.forged[id] : ''), icon: iconOf(DB.items[id]), value: forgeCost(id) ? '' : 'MAX', color: RARITY_COL(DB.items[id].rarity), data: id })); if (!rows.length) { list.clear(); list.txt('Nothing to forge yet.\nBring tier-2+ weapons or armor.', 14, 14, { color: COL.dim, size: 16, wrap: 250 }); } else list.setItems(rows, true); };
  list.onSelect = (it: any) => { det.clear(); if (!it) return; const id = it.data; const item = DB.items[id]; const c = forgeCost(id); const st = forgeStat(item); const cur = itemParams(id, $.realm, $.forged)[st] || 0;
    det.txt(item.name, 12, 10, { size: 21, color: RARITY_COL(item.rarity), wrap: 236 }); det.txt(`Forge +${$.forged[id] || 0} / 3 · ${st.toUpperCase()} ${cur}`, 12, 56, { size: 16 });
    if (!c) { det.txt('Fully forged.', 12, 96, { size: 17, color: COL.gold }); return; }
    const g = DB.equipment.forge.statGain; det.txt(`Next: +${c.lv}  →  ${st.toUpperCase()} ${cur - (g['+' + ($.forged[id] || 0)] || 0) + g['+' + c.lv]}`, 12, 90, { size: 16, color: COL.green });
    det.txt('Gold ' + c.gold + (($.gold >= c.gold) ? '' : '  (short)'), 12, 130, { size: 17, color: $.gold >= c.gold ? COL.gold : COL.red }); let y = 164; for (const l of c.lines) { det.txt(`${l.r[0].toUpperCase() + l.r.slice(1)} materials ${l.have}/${l.need}`, 12, y, { size: 16, color: l.have >= l.need ? COL.green : COL.red }); y += 26; }
    det.txt(c.ok ? 'OK: forge it' : 'Need more materials or gold.', 12, y + 14, { size: 15, color: c.ok ? COL.sys : COL.dim }); det.txt('Dropped by spirits; Smith\'s Tongs light the way.', 12, 540, { size: 12, color: COL.dim, wrap: 236 }); };
  build(); list.onSelect(list.current, list.index); list.active = true;
  list.onOk = (it: any) => { const id = it.data; const c = forgeCost(id); if (!c || !c.ok) { Audio.se('buzzer'); return; } $.gold -= c.gold; for (const [m, n] of Object.entries(c.picks)) $.gain(m, -n); $.forged[id] = c.lv; Audio.se('equip'); sc.refresh(); build(); list.onSelect(list.current, list.index); note(sc, `${DB.items[id].name} forged to +${c.lv}!`); };
  await waitCancel(list); [list, det, panel].forEach((x) => sc.rm(x));
}
void Input;

// ---------------------------------------------------------------- Bonds: offerings raise Bond xp (liked +2, others +1, disliked refused)
export async function offerToBond(sc: S, sp: string) {
  const e = SPEC.enemies[sp]; const par = e.parley || {}; const likes: string[] = par.likes || [], dis: string[] = par.dislikes || [];
  const owned = Object.keys($.items).filter((k) => DB.items[k]?.offer && $.items[k] > 0); if (!owned.length) { Audio.se('buzzer'); note(sc, 'You have no Offerings.'); return; }
  const w = sc.mk(new Selectable(sc, 300, 120, 420, 380, sc.tone)); w.setDepth(300); w.rowH = 34; w.pad = 14; w.fontSize = 19;
  const rel = (k: string) => { const it = DB.items[k]; const c: string[] = it.cats || []; if (dis.some((d) => d === k || c.includes(d))) return -1; if (likes.some((d) => d === k || c.includes(d))) return 2; return 1; };
  w.setItems(owned.map((k) => ({ label: DB.items[k].name, icon: iconOf(DB.items[k]), value: '×' + $.items[k] + (rel(k) === 2 ? ' ♥' : rel(k) < 0 ? ' ✕' : ''), enabled: rel(k) > 0, data: k }))); w.active = true;
  const k: string | null = await new Promise((res) => { w.onOk = (it: any) => res(it.data); w.onCancel = () => res(null); }); w.active = false; sc.rm(w); if (!k) return;
  const n = rel(k); $.gain(k, -1); const b = $.bonds[sp]; b.xp += n; const lv = $.bondLevel(b.xp); const up = lv > b.lv; b.lv = lv; Audio.se(up ? 'powerup' : 'heal'); note(sc, `${e.name} loved it! Bond xp +${n}` + (up ? `  —  Bond Lv ${lv}!` : ''), 1800);
}
