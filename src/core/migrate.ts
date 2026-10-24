// Save-file migrations. Every snapshot carries `v` (SAVE_VERSION) and the game state carries `ver`; older saves are upgraded in place on load.
//  v1 (chapters 1-2 slice, first deploy)  ->  v2 (items/equipment/key items/spells/summons package)
//  v2 -> v3: `chapter` was never advanced (always 1); infer it from story switches
import { DB } from './db';
export const SAVE_VERSION = 3;
/** Story chapter implied by switches (ch2 starts once the Well's Shrine Key is won, ch3 once the Bell-Keeper falls). */
export function inferChapter(g: G): number { const sw = g.switches || {}; return Math.max(g.chapter || 1, sw.boss_done ? 3 : sw.key_got ? 2 : 1); }
const LEGACY_ITEMS: Record<string, string> = { onigiri: 'rice_ball', tea: 'herbal_tea' };
type G = any;
const steps: Record<number, (g: G) => void> = {
  1: (g) => {
    g.forged ||= {}; g.songs ||= []; g.lessons ||= {}; g.usedSummons ||= {}; g.seenKeys ||= {}; g.permUsed ||= {}; g.litPost ??= null;
    g.buffs ||= { peek: 0, stealth: 0, light: 0, goldBoost: 0, fleeFree: 0 };
    // item ids: rename legacy, drop anything the new database no longer has
    const items: Record<string, number> = {}; for (const [k, n] of Object.entries<number>(g.items || {})) { const id = LEGACY_ITEMS[k] || k; if (DB.items[id]) items[id] = (items[id] || 0) + n; }
    g.items = items;
    for (const id of Object.keys(g.actors || {})) {
      const a = g.actors[id]; a.equips ||= {}; for (const s of ['weapon', 'armor', 'acc', 'acc2', 'keepsake', 'bond']) if (a.equips[s] === undefined) a.equips[s] = null;
      for (const s of ['weapon', 'armor', 'acc', 'acc2']) { const e = a.equips[s]; if (e && !DB.items[LEGACY_ITEMS[e] || e]) a.equips[s] = null; else if (e) a.equips[s] = LEGACY_ITEMS[e] || e; }
      a.perm ||= {}; a.skills = (a.skills || []).filter((k: string) => !!DB.skills[k]);
    }
    // key items introduced later in the slice: grant the ones the old save already earned
    const sw = g.switches || {}; const grant = (id: string) => { if (DB.items[id] && !g.items[id]) g.items[id] = 1; };
    const best = Object.values<any>(g.bestiary || {}); if (sw.first_send === undefined && (best.some((b: any) => b.calmed || b.recruited) || Object.keys(g.bonds || {}).length)) sw.first_send = true;
    if (sw.first_send || sw.warden_done) grant('collectors_book');
    if (sw.elder_told) grant('elder_seal');
    if (sw.boss_done) { grant('wellkeeper_pebble'); grant('shrine_bell_clapper'); }
    if (sw.shiro_asked && !sw.hanzo_told) grant('hanzo_note');
    g.switches = sw; g.ver = 2;
  },
  2: (g) => { g.chapter = inferChapter(g); g.ver = 3; },
};
/** Upgrade a raw game-state object to SAVE_VERSION (mutates). Unknown/newer versions are left alone. */
export function migrateGame(g: G): G { let v = g.ver || 1; while (v < SAVE_VERSION && steps[v]) { steps[v](g); v = g.ver || v + 1; } return g; }
