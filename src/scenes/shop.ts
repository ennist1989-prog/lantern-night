import Phaser from 'phaser';
import { Audio } from '../core/audio';
import { $ } from '../core/state';
import { DB } from '../core/db';
import { W, H, Win, Selectable, COL, FONT, tickWindows } from '../ui/windows';
export class ShopScene extends Phaser.Scene {
  d: any; wins: Win[] = [];
  constructor() { super('Shop'); }
  init(d: any) { this.d = d; this.wins = []; }
  create() {
    const tone = $.realm; this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0, 0);
    const mk = <T extends Win>(w: T) => { this.wins.push(w); return w; };
    const cmd = mk(new Selectable(this, 8, 8, 220, 150, tone)); const gold = mk(new Win(this, W - 8 - 220, 8, 220, 60, tone)); const list = mk(new Selectable(this, 8, 166, 500, 360, tone)); const desc = mk(new Win(this, 8, 534, W - 16, 82, tone)); const side = mk(new Win(this, 516, 166, 292, 360, tone));
    const talk = mk(new Win(this, 236, 8, 340, 150, tone)); talk.txt((this.d.name ? this.d.name + ': ' : '') + 'Take a look, take your time.', 16, 12, { size: 20, wrap: 300 });
    let mode: 'buy' | 'sell' = 'buy';
    const drawGold = () => { gold.clear(); gold.txt('Gold', 14, 14, { size: 20, color: COL.sys }); gold.txt(String($.gold), 200, 14, { size: 24, color: COL.gold, align: 'right' }); };
    const sideInfo = (id: string | null) => { side.clear(); if (!id) return; const it = DB.items[id]; side.txt(it.name, 14, 10, { size: 22, color: COL.gold }); side.txt('Owned: ' + ($.items[id] || 0), 14, 44, { size: 19 }); let y = 80;
      if (it.params) { for (const [k, v] of Object.entries(it.params)) { side.txt(`${k.toUpperCase()} +${v}`, 14, y, { size: 19, color: COL.green }); y += 26; } }
      if (['weapon', 'armor', 'acc'].includes(it.type)) { for (const pid of $.party) { const a = $.actors[pid]; const cur = a.equips[it.slot || it.type]; const curP = cur ? DB.items[cur].params || {} : {}; let diff = ''; for (const k of Object.keys(it.params || {})) diff += `${k.toUpperCase()}${(it.params[k] - (curP[k] || 0)) >= 0 ? '+' : ''}${it.params[k] - (curP[k] || 0)} `; side.txt(`${DB.actors[pid].name}: ${diff}`, 14, y, { size: 16, color: COL.sys }); y += 22; } } };
    const showList = () => { const ids: string[] = mode === 'buy' ? this.d.items : Object.keys($.items).filter((k) => DB.items[k].type !== 'key' && DB.items[k].price);
      list.setItems(ids.map((id) => ({ label: DB.items[id].name, icon: DB.items[id].icon, value: mode === 'buy' ? String(DB.items[id].price) + ' G' : (Math.floor(DB.items[id].price / 2)) + ' G ×' + $.items[id], enabled: mode === 'buy' ? $.gold >= DB.items[id].price : true, data: id })), true);
      if (!ids.length) { list.clear(); list.txt('Nothing to sell.', 20, 20, { color: COL.dim }); } };
    list.onSelect = (it) => { desc.clear(); if (it) { desc.txt(DB.items[it.data].desc, 16, 8, { size: 19, wrap: 760 }); sideInfo(it.data); } else sideInfo(null); };
    cmd.setItems([{ label: 'Buy' }, { label: 'Sell' }, { label: 'Leave' }]); cmd.rowH = 38; cmd.pad = 14; cmd.active = true; list.rowH = 38; list.pad = 14; list.fontSize = 21;
    const toCmd = () => { list.active = false; cmd.active = true; }; drawGold();
    cmd.onOk = (it, i) => { if (i === 2) return this.d.onClose?.(); mode = i === 0 ? 'buy' : 'sell'; showList(); cmd.active = false; list.active = true; list.index = 0; list.refresh(); list.onSelect(list.current, 0); };
    cmd.onCancel = () => this.d.onClose?.();
    list.onCancel = toCmd;
    list.onOk = (it) => { const id = it.data; const p = DB.items[id].price;
      if (mode === 'buy') { if ($.gold < p) { Audio.se('buzzer'); return; } $.gold -= p; $.gain(id, 1); Audio.se('coin'); } else { if (!$.has(id)) return; $.gain(id, -1); $.gold += Math.floor(p / 2); Audio.se('coin'); }
      drawGold(); const idx = list.index; showList(); list.index = Math.min(idx, Math.max(0, list.items.length - 1)); list.refresh(); list.onSelect(list.current, list.index); };
    void H; void FONT;
  }
  update() { tickWindows(this.wins); }
}
