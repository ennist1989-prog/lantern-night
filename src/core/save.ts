import { $, SAVE_VERSION } from './state';
import { DB } from './db';
const PFX = 'lotfs.save.';
export interface SaveMeta { slot: number; ts: number; playtime: number; label: string; level: number; members: string[]; chapter: number; realm: string; }
const MAPNAMES = () => DB.system.mapNames || {};
export function mapName(id: number) { return (MAPNAMES() as any)[id] || 'Unknown'; }
function snapshot(): any {
  return { v: SAVE_VERSION, ts: Date.now(), playtime: $.playtime, game: JSON.parse(JSON.stringify($.toJSON())) };
}
export function metaFor(slot: number, d: any): SaveMeta {
  const g = d.game; const lv = Math.max(...g.party.map((p: string) => g.actors[p].level));
  return { slot, ts: d.ts, playtime: d.playtime, label: mapName(g.map.id), level: lv, members: g.party, chapter: g.chapter || 1, realm: g.realm };
}
export const SaveManager = {
  slots: 10,
  read(slot: number): any | null { try { const s = localStorage.getItem(PFX + slot); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
  meta(slot: number): SaveMeta | null { const d = this.read(slot); if (!d || !d.game) return null; try { return metaFor(slot, d); } catch (e) { return null; } },
  write(slot: number, snap?: any): { ok: boolean; err?: string } {
    try { localStorage.setItem(PFX + slot, JSON.stringify(snap || snapshot())); $.saveCount++; return { ok: true }; }
    catch (e: any) { return { ok: false, err: e && e.name === 'QuotaExceededError' ? 'Storage full' : 'Could not write save' }; }
  },
  save(slot: number) { return this.write(slot); },
  auto() { return this.write(0); },
  load(slot: number): boolean { const d = this.read(slot); if (!d || !d.game) return false; $.load(d.game); $.playtime = d.playtime || $.playtime; return true; },
  any(): boolean { for (let i = 0; i <= 10; i++) if (this.read(i)) return true; return false; },
  latestSlot(): number { let best = -1, ts = 0; for (let i = 0; i <= 10; i++) { const m = this.meta(i); if (m && m.ts > ts) { ts = m.ts; best = i; } } return best; },
  snapshotString() { return JSON.stringify(snapshot()); },
  restoreString(s: string) { const d = JSON.parse(s); $.load(d.game); },
  exportSlot(slot: number) {
    const d = this.read(slot) || snapshot();
    const blob = new Blob([JSON.stringify({ game: 'lantern-night', slot, ...d }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lantern-night-slot${slot}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  },
  importToSlot(slot: number, cb: (ok: boolean, msg: string) => void) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return cb(false, 'No file');
      f.text().then((t) => {
        try { const d = JSON.parse(t); if (!d.game || !d.game.party || !d.game.actors) throw new Error('bad'); const r = this.write(slot, { v: d.v || 1, ts: d.ts || Date.now(), playtime: d.playtime || 0, game: d.game }); cb(r.ok, r.ok ? 'Imported to slot ' + slot : r.err || 'Failed'); }
        catch (e) { cb(false, 'Not a valid save file'); }
      });
    };
    inp.click();
  },
};
export function fmtTime(sec: number) { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60); return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
