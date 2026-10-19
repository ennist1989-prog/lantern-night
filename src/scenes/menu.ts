import Phaser from 'phaser';
import { Input } from '../core/input';
import { Audio } from '../core/audio';
import { $, SLOTS as ALLSLOTS, SLOT_NAMES } from '../core/state';
const SLOTS = ALLSLOTS.filter((x) => x !== 'bond');
import { DB, PARAM_NAMES, ELEMENT_NAMES, ELEMENT_COLORS, iconOf } from '../core/db';
import { mapName, fmtTime } from '../core/save';
import { W, H, Win, Selectable, COL, FONT, tickWindows, Tone, fitLine } from '../ui/windows';
import { openOptions } from '../ui/options';
import { SPEC } from '../battle/spec';
import * as M2 from './menu2';
export class MenuScene extends Phaser.Scene {
  d: any; wins: Win[] = []; tone: Tone = 'near'; cmd!: Selectable; party!: Win; info!: Win; busyMain = false;
  constructor() { super('Menu'); }
  init(d: any) { this.d = d; this.wins = []; }
  create() {
    this.tone = $.realm; this.add.rectangle(0, 0, W, H, 0x000000, 0.5).setOrigin(0, 0);
    this.cmd = this.mk(new Selectable(this, 8, 8, 240, 452, this.tone)); this.cmd.rowH = 30; this.cmd.pad = 14; this.cmd.fontSize = 21;
    this.party = this.mk(new Win(this, 248, 8, 560, 608, this.tone)); this.info = this.mk(new Win(this, 8, 468, 240, 148, this.tone));
    this.cmd.setItems(this.cmdList());
    this.cmd.active = true; this.cmd.onOk = (it) => this.main(it.label); this.cmd.onCancel = () => this.close();
    this.refresh();
  }
  cmdList() {
    const L: any[] = [{ label: 'Item' }, { label: 'Skill' }, { label: 'Equip' }, { label: 'Status' }, { label: 'Formation' }, { label: 'Quests' }, { label: 'Key Items' }];
    if ($.has('smith_tongs')) L.push({ label: 'Forge' });
    if ($.has('collectors_book')) L.push({ label: 'Bonds' }, { label: 'Bestiary' });   // Keeper's Ledger unlocks the collection screens (lock L09)
    L.push({ label: 'Notes' }, { label: 'Options' }, { label: 'Save' }, { label: 'Game End' }); return L;
  }
  mk<T extends Win>(w: T) { this.wins.push(w); return w; }
  rm(w: Win) { w.destroy(); this.wins = this.wins.filter((x) => x !== w); if ((w as any).__panel && !this.wins.some((x) => (x as any).__panel)) this.party.setVisible(true); }
  update() { tickWindows(this.wins); }
  close(r?: any) { this.d.onClose?.(r); }
  refresh() {
    const p = this.party; p.clear(); $.party.forEach((id, i) => this.drawActor(p, id, 14, 12 + i * 148, 530));
    const f = this.info; f.clear(); f.txt('Gold', 14, 8, { size: 18, color: COL.sys }); f.txt(String($.gold), 216, 6, { size: 21, color: COL.gold, align: 'right' });
    f.txt('Lumen', 14, 34, { size: 18, color: COL.sys }); f.gauge(88, 44, 96, $.lumen / $.lumenMax, 0x7fe9ff, 0xe8ffff, 9); f.txt(String(Math.ceil($.lumen)), 216, 34, { size: 19, color: COL.lumen, align: 'right' });
    f.txt('Time', 14, 60, { size: 18, color: COL.sys }); f.txt(fmtTime($.playtime), 216, 60, { size: 19, align: 'right' });
    f.txt(mapName($.map.id), 14, 88, { size: 19, color: COL.gold, wrap: 205 }); f.txt($.realm === 'far' ? 'Far Shore' : 'Near Shore', 14, 116, { size: 16, color: $.realm === 'far' ? COL.teal : COL.warn });
  }
  drawActor(w: Win, id: string, x: number, y: number, width: number) {
    const a = $.actors[id], d = DB.actors[id]; w.face(id, x, y, 114); w.gfx.lineStyle(2, 0x7a96d6, 1); w.gfx.strokeRect(x - 1, y - 1, 116, 116);
    w.txt(d.name, x + 130, y - 2, { size: 26, color: COL.gold }); w.txt(`Lv ${a.level}`, x + 280, y + 2, { size: 21 }); w.txt(d.role || '', x + 340, y + 5, { size: 16, color: COL.dim });
    const mhp = $.param(a, 'mhp'), msp = $.param(a, 'msp');
    w.txt('HP', x + 130, y + 36, { size: 17, color: COL.sys }); w.gauge(x + 166, y + 44, 190, a.hp / mhp, a.hp / mhp < 0.3 ? 0xff7a5a : 0x5fd37a, 0xa6f5b4, 10); w.txt(`${a.hp}/${mhp}`, x + 372, y + 34, { size: 18 });
    w.txt('SP', x + 130, y + 64, { size: 17, color: COL.sys }); w.gauge(x + 166, y + 72, 190, a.sp / msp, 0x4a8cff, 0x9ec8ff, 10); w.txt(`${a.sp}/${msp}`, x + 372, y + 62, { size: 18, color: COL.sp });
    w.txt('EXP next: ' + (a.level >= 20 ? '—' : $.expToNext(a)), x + 130, y + 92, { size: 16, color: COL.dim }); void width;
  }
  pickMember(x: number, y: number, opt: { show?: (id: string) => string } = {}): Promise<string | null> {
    return new Promise((res) => {
      const w = this.mk(new Selectable(this, x, y, 380, $.party.length * 52 + 28, this.tone)); w.setDepth(300); w.rowH = 52; w.pad = 14;
      w.drawItem = (ww, it, ix, iy, cw) => { const id = it.data; const a = $.actors[id]; ww.face(id, ix + 2, iy + 2, 44); ww.txt(DB.actors[id].name, ix + 54, iy + 2, { size: 20 }); ww.txt(opt.show ? opt.show(id) : `HP ${a.hp}/${$.param(a, 'mhp')}  SP ${a.sp}/${$.param(a, 'msp')}`, ix + 54, iy + 26, { size: 15, color: COL.sys }); void cw; };
      w.setItems($.party.map((id) => ({ label: id, data: id }))); w.active = true;
      const done = (v: string | null) => { w.active = false; this.rm(w); res(v); }; w.onOk = (it) => done(it.data); w.onCancel = () => done(null);
    });
  }
  async main(label: string) {
    this.cmd.active = false; let res: any;
    switch (label) {
      case 'Item': res = await M2.itemScreen(this); break; case 'Skill': res = await M2.skillScreen(this); break; case 'Equip': await M2.equipScreen(this); break; case 'Key Items': await M2.keyItemsScreen(this); break; case 'Forge': await M2.forgeScreen(this); break; case 'Status': await this.statusScreen(); break;
      case 'Formation': await this.formation(); break; case 'Quests': await this.quests(); break; case 'Bestiary': await this.bestiary(); break; case 'Bonds': await this.bondsScreen(); break; case 'Notes': await this.notes(); break;
      case 'Options': await new Promise<void>((r) => openOptions(this, this.tone, this.wins, 108, 70, r)); break;
      case 'Save': await this.save(); break; case 'Game End': await this.gameEnd(); break;
    }
    if (res?.action) { this.close(res); return; }
    this.refresh(); this.cmd.active = true;
  }
  /** Full-height sub-screen panel over the party window. It is opaque (solid backdrop under the 0.93-alpha skin) and the party window
   *  is hidden while any panel is open, so nothing ghosts through (Ember style guide v1 §3.2 #2). rm() restores the party window. */
  panel() {
    const p = this.mk(new Win(this, 248, 8, 560, 608, this.tone)); const g = this.add.graphics(); g.fillStyle(0x0e163a, 1); g.fillRoundedRect(3, 3, p.w - 6, p.h - 6, 12); p.addAt(g, 0);
    (p as any).__panel = true; this.party.setVisible(false); return p;
  }
  statLines(a: any, over?: { slot: string; item: string | null }) {
    const out: { k: string; cur: number; nw: number }[] = []; const copy = { ...a, equips: { ...a.equips } }; if (over) copy.equips[over.slot] = over.item;
    for (const k of ['mhp', 'msp', 'atk', 'def', 'mat', 'mdf', 'agi']) out.push({ k, cur: $.param(a, k), nw: $.param(copy, k) }); return out;
  }
  async statusScreen() {
    const who = await this.pickMember(300, 100); if (!who) return; let cur = who; const panel = this.panel(); panel.setDepth(100);
    const draw = () => { panel.clear(); const a = $.actors[cur], d = DB.actors[cur]; this.drawActor(panel, cur, 20, 18, 520);
      panel.txt('◀ Q / E ▶', 470, 570, { size: 15, color: COL.dim });
      panel.txt('Parameters', 20, 156, { size: 20, color: COL.sys }); ['mhp', 'msp', 'atk', 'def', 'mat', 'mdf', 'agi'].forEach((k, i) => { panel.txt(PARAM_NAMES[k], 30, 190 + i * 28, { size: 19 }); panel.txt(String($.param(a, k)), 250, 190 + i * 28, { size: 19, align: 'right' }); });
      // Equipment column (Ember §3.3): labels x=272 @15px, names x=348 single-line ≤200px (inner edge 548), 17→15→13px then "…"; ≤5 rows end at y=332
      panel.txt('Equipment', 272, 156, { size: 20, color: COL.sys }); M2.equipSlots().forEach((s, i) => { const y = 190 + i * 30; panel.txt(SLOT_NAMES[s], 272, y + 2, { size: 15, color: COL.dim }); const e = a.equips[s]; const sm = s === 'keepsake' && e ? Object.values<any>(SPEC.summons.summons).find((x) => x.keepsake === e)?.name : null; fitLine(panel.txt(e ? (sm || DB.items[e].name + ($.forged[e] ? ' +' + $.forged[e] : '')) : '—', 348, y, { size: 17 }), 200, [15, 13]); });
      panel.txt('Skills', 20, 410, { size: 20, color: COL.sys }); a.skills.filter((k) => DB.skills[k] && !['p_attack', 'p_guard'].includes(k)).slice(-12).forEach((s, i) => panel.txt(DB.skills[s].name, 30 + (i % 3) * 176, 442 + Math.floor(i / 3) * 24, { size: 18, color: ELEMENT_COLORS[DB.skills[s].element || 'phys'] }));
      panel.txt(d.desc || '', 20, 540, { size: 16, color: COL.dim, wrap: 430 }); };
    draw();
    await new Promise<void>((res) => { const tm = this.time.addEvent({ delay: 16, loop: true, callback: () => { if (Input.isTriggered('cancel') || Input.isTriggered('ok')) { Input.consume('cancel'); Input.consume('ok'); Audio.se('cancel'); tm.remove(); res(); } else if (Input.isTriggered('pageup') || Input.isRepeated('left') || Input.isTriggered('pagedown') || Input.isRepeated('right')) { const d = Input.isTriggered('pageup') || Input.isRepeated('left') ? -1 : 1; const i = $.party.indexOf(cur); cur = $.party[(i + d + $.party.length) % $.party.length]; Audio.se('cursor'); draw(); } } }); });
    this.rm(panel);
  }
  async formation() {
    const panel = this.panel(); panel.setDepth(100); panel.txt('Formation — pick a member, then another to swap.', 20, 14, { size: 19, color: COL.sys });
    const w = this.mk(new Selectable(this, 248, 50, 560, $.party.length * 70 + 28, this.tone)); w.setDepth(101); w.rowH = 70; w.pad = 14; let first = -1;
    const build = () => { w.drawItem = (ww, it, x, y, cw) => { const id = it.data; ww.face(id, x + 2, y + 2, 62); ww.txt((first === it.idx ? '▶ ' : '') + DB.actors[id].name, x + 80, y + 4, { size: 24, color: first === it.idx ? COL.gold : COL.white }); ww.txt(`Lv ${$.actors[id].level}   ${it.idx === 0 ? 'Front' : 'Back'}`, x + 80, y + 36, { size: 16, color: COL.dim }); void cw; }; w.setItems($.party.map((id, i) => ({ label: id, data: id, idx: i } as any)), true); };
    build(); w.active = true;
    await new Promise<void>((res) => { w.onCancel = () => { if (first >= 0) { first = -1; build(); } else res(); }; w.onOk = (_it, i) => { if (first < 0) { first = i; build(); } else { const p = $.party; [p[first], p[i]] = [p[i], p[first]]; first = -1; Audio.se('equip'); build(); this.refresh(); } }; });
    this.rm(w); this.rm(panel);
  }
  async quests() {
    const panel = this.panel(); panel.setDepth(100); const list = this.mk(new Selectable(this, 248, 8, 560, 250, this.tone)); list.setDepth(101); const det = this.mk(new Win(this, 248, 266, 560, 350, this.tone)); det.setDepth(101);
    list.rowH = 36; list.pad = 14; list.fontSize = 20;
    const ids = Object.keys($.quests); const rows = ids.sort((a, b) => Number($.quests[a].done) - Number($.quests[b].done)).map((id) => ({ label: DB.quests[id].name, value: $.quests[id].done ? 'Done' : '', color: $.quests[id].done ? COL.dim : COL.white, data: id }));
    list.onSelect = (it) => { det.clear(); if (!it) return; const q = DB.quests[it.data]; const st = $.quests[it.data]; det.txt(q.name, 16, 10, { size: 24, color: COL.gold }); det.txt(q.desc, 16, 50, { size: 18, wrap: 520, color: COL.sys }); det.txt(st.done ? q.doneText || 'Completed.' : '▶ ' + (q.stages[Math.min(st.stage, q.stages.length - 1)] || ''), 16, 150, { size: 20, wrap: 520, color: st.done ? COL.green : COL.white }); if (q.reward) det.txt('Reward: ' + q.reward, 16, 300, { size: 17, color: COL.dim }); };
    if (!rows.length) { list.txt('No quests yet. Talk to people!', 20, 20, { color: COL.dim }); } else list.setItems(rows);
    list.active = true; await new Promise<void>((res) => (list.onCancel = () => res())); [list, det, panel].forEach((x) => this.rm(x));
  }
  async bestiary() {
    const panel = this.panel(); panel.setDepth(100); const list = this.mk(new Selectable(this, 248, 8, 240, 608, this.tone)); list.setDepth(101); const det = this.mk(new Win(this, 496, 8, 312, 608, this.tone)); det.setDepth(101);
    list.rowH = 34; list.pad = 12; list.fontSize = 19;
    const all = Object.keys(DB.enemies).filter((k) => !DB.enemies[k].hidden); const rows = all.map((id) => { const b = $.bestiary[id]; return { label: b?.seen ? DB.enemies[id].name : '???', value: b?.recruited ? '★' : b?.calmed ? '♥' : '', enabled: !!b?.seen, data: id }; });
    const seenN = rows.filter((r) => r.enabled).length;
    list.onSelect = (it) => { det.clear(); this.bsIm?.destroy(); if (!it) return; const id = it.data; const e = DB.enemies[id]; const b = $.bst(id);
      const key = 'mon_' + id; if (this.textures.exists(key)) { const im = this.add.image(0, 0, key).setDepth(103).setOrigin(0.5); im.setScale(64 / Math.max(im.width, im.height)); im.setPosition(det.x + 52, det.y + 52); this.bsIm = im; }
      det.txt(e.name, 104, 14, { size: 24, color: COL.gold }); det.txt(`Lv ${e.level}  ·  ${e.rarity || 'common'}  ·  ${e.kind}`, 104, 50, { size: 15, color: COL.dim });
      det.txt((e.role || '').slice(0, 120), 16, 100, { size: 15, wrap: 280, color: COL.sys });
      det.txt('Weaknesses', 16, 200, { size: 17, color: COL.sys });
      let y = 226; for (const r of ['near', 'far']) { const f = e.forms?.[r]; if (!f) continue; const known = Object.entries(f.rates || {}).filter(([k, v]: any) => v > 1 && (b.weak || []).includes(r + ':' + k)).map(([k]) => ELEMENT_NAMES[k]); const unk = Object.entries(f.rates || {}).some(([k, v]: any) => v > 1 && !(b.weak || []).includes(r + ':' + k)); det.txt((r === 'near' ? 'Near: ' : 'Far: ') + (known.length ? known.join(', ') : '?') + (unk && known.length ? ' +?' : ''), 16, y, { size: 16, color: COL.violet, wrap: 280 }); y += 24; }
      det.txt(`Defeated ${b.defeated}   Sent ${b.calmed}`, 16, 290, { size: 17 });
      const par = e.parley; if (par) { det.txt('Temperament: ' + par.temper, 16, 322, { size: 16, color: COL.green }); const lk = (par.likes || []).join(', '); if (b.parleyed || b.calmed) det.txt('Likes: ' + (lk || '—') + (par.key?.note ? '\n' + par.key.note : ''), 16, 348, { size: 15, color: COL.warn, wrap: 280 }); else det.txt('Try Parley to learn what it likes.', 16, 348, { size: 15, color: COL.dim, wrap: 280 }); if (par.recruit) det.txt(b.recruited ? '★ Bond: ' + (e.bond?.name || '') : 'Can be invited to bond.', 16, 440, { size: 15, color: COL.violet, wrap: 280 }); }
      det.txt(`Drops: ${(e.drops || []).map((d: any) => (DB.items[d.item]?.name || d.item)).join(', ') || '—'}`, 16, 510, { size: 14, color: COL.dim, wrap: 280 }); };
    list.txt(`${seenN}/${rows.length}`, 150, 4, { size: 14, color: COL.dim });
    list.setItems(rows); list.active = true; await new Promise<void>((res) => (list.onCancel = () => res())); [list, det, panel].forEach((x) => this.rm(x)); this.bsIm?.destroy(); this.bsIm = undefined;
  }
  bsIm?: Phaser.GameObjects.Image;
  async bondsScreen() {
    const panel = this.panel(); panel.setDepth(100); const list = this.mk(new Selectable(this, 248, 8, 250, 400, this.tone)); list.setDepth(101); const det = this.mk(new Win(this, 506, 8, 302, 400, this.tone)); det.setDepth(101); const eq = this.mk(new Win(this, 248, 416, 560, 200, this.tone)); eq.setDepth(101);
    list.rowH = 34; list.pad = 12; list.fontSize = 19; const ids = Object.keys($.bonds); const holder = (sp: string) => $.party.find((p) => $.actors[p].equips.bond === sp);
    const drawEq = () => { eq.clear(); eq.txt('Equipped Bonds  (OK: equip to the next member · Possess costs 50 Bond Gauge)', 14, 6, { size: 13, color: COL.dim, wrap: 530 }); $.party.forEach((p, i) => { const sp = $.actors[p].equips.bond; eq.txt(DB.actors[p].name, 20, 40 + i * 36, { size: 20 }); eq.txt(sp ? SPEC.enemies[sp].name + ' · ' + (SPEC.enemies[sp].bond?.name || '') : '—', 180, 40 + i * 36, { size: 19, color: sp ? COL.violet : COL.dim }); }); };
    list.onSelect = (it) => { det.clear(); this.bsIm?.destroy(); if (!it) return; const sp = it.data; const e = SPEC.enemies[sp]; const b = $.bonds[sp]; const key = 'mon_' + sp; if (this.textures.exists(key)) { const im = this.add.image(0, 0, key).setDepth(103).setOrigin(0.5); im.setScale(64 / Math.max(im.width, im.height)); im.setPosition(det.x + 52, det.y + 52); this.bsIm = im; }
      det.txt(e.name, 104, 14, { size: 24, color: COL.gold }); det.txt('Bond Lv ' + b.lv + '  (' + b.xp + ' xp)', 104, 50, { size: 16, color: COL.violet });
      det.txt('Skill: ' + (e.bond?.name || '—') + (e.bond?.sp ? ' (' + e.bond.sp + ' SP)' : ''), 16, 110, { size: 18 }); det.txt(e.bond?.desc || '', 16, 138, { size: 16, wrap: 270, color: COL.sys }); det.txt('Passive: ' + (e.bond?.passive || '—'), 16, 200, { size: 16, wrap: 270, color: COL.green }); const h = holder(sp); det.txt(h ? 'Equipped: ' + DB.actors[h].name : 'Not equipped', 16, 300, { size: 16, color: COL.dim });
      const sg = Object.entries<any>(SPEC.learn.bond).find(([, r]) => r.spirit === sp); if (sg) { const sid = sg[0], r = sg[1]; det.txt('♪ ' + SPEC.skills[sid].name, 16, 330, { size: 17, color: COL.violet }); det.txt($.songs.includes(sid) ? 'Learned — any member can sing it.' : b.lv >= r.level ? `Lesson ${$.lessons[sid] || 0}/${r.battles}: fight with it equipped.` : `Reach Bond Lv ${r.level} (Offer treats: Q/E).`, 16, 354, { size: 14, color: COL.dim, wrap: 270 }); }
      det.txt('Q/E: give an Offering (+Bond xp)', 16, 376, { size: 13, color: COL.dim }); };
    if (!ids.length) { list.txt('No Bonds yet. Calm a spirit with Parley, then Invite it.', 14, 14, { color: COL.dim, wrap: 220, size: 16 }); } else list.setItems(ids.map((id) => ({ label: SPEC.enemies[id].name, value: 'Lv' + $.bonds[id].lv, data: id })));
    drawEq(); list.active = true;
    list.onOk = (it) => { const sp = it.data; const h = holder(sp); const party = $.party; let i = h ? (party.indexOf(h) + 1) : 0; if (h) $.actors[h].equips.bond = null; if (i < party.length) { const nx = party[i]; const old = $.actors[nx].equips.bond; $.actors[nx].equips.bond = sp; void old; } Audio.se('equip'); drawEq(); list.onSelect(list.current, list.index); };
    list.onPage = async () => { const it = list.current; if (!it) return; list.active = false; await M2.offerToBond(this, it.data); list.refresh(); list.onSelect(list.current, list.index); list.setItems(ids.map((id) => ({ label: SPEC.enemies[id].name, value: 'Lv' + $.bonds[id].lv, data: id })), true); list.active = true; };
    await new Promise<void>((res) => (list.onCancel = () => res())); this.bsIm?.destroy(); this.bsIm = undefined; [list, det, eq, panel].forEach((x) => this.rm(x));
  }
  async notes() {
    const panel = this.panel(); panel.setDepth(100); const list = this.mk(new Selectable(this, 248, 8, 560, 250, this.tone)); list.setDepth(101); const det = this.mk(new Win(this, 248, 266, 560, 350, this.tone)); det.setDepth(101);
    list.rowH = 36; list.pad = 14; list.fontSize = 20; const notes = (DB.system.notes || []).filter((n: any) => !n.unlock || $.tutorialsShown[n.unlock] || $.sw(n.unlock));
    list.onSelect = (it) => { det.clear(); if (it) { det.txt(it.data.title, 16, 10, { size: 24, color: COL.gold }); det.txt(it.data.text, 16, 52, { size: 19, wrap: 520 }); } };
    list.setItems(notes.map((n: any) => ({ label: n.title, data: n }))); list.active = true; await new Promise<void>((res) => (list.onCancel = () => res())); [list, det, panel].forEach((x) => this.rm(x));
  }
  async save() { this.cmd.active = false; await new Promise<void>((res) => { this.scene.launch('SaveLoad', { mode: 'save', onClose: () => { this.scene.stop('SaveLoad'); Input.clear(); res(); } }); this.scene.bringToTop('SaveLoad'); }); }
  async gameEnd() {
    const w = this.mk(new Selectable(this, 300, 220, 300, 190, this.tone)); w.setDepth(400); w.rowH = 38; w.pad = 44; w.setItems([{ label: 'Return to Title' }, { label: 'Cancel' }]); const t = this.add.text(450, 232, 'Return to the title screen?\n(Unsaved progress is lost.)', { fontFamily: FONT, fontSize: '17px', color: '#fff', align: 'center' }).setOrigin(0.5, 0).setDepth(401); w.active = true;
    const r = await new Promise<number>((res) => { w.onOk = (_i, i) => res(i); w.onCancel = () => res(1); }); this.rm(w); t.destroy();
    if (r === 0) { $.__titleRequest = true; this.close(); }
  }
}
void H;
