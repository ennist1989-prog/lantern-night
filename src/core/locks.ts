// Key-item locks (keyitems.json:locks, the mission-graph edges). Data-driven: later chapters only add rows.
import { $ } from './state';
import { DB } from './db';
export function lockDef(id: string) { return DB.keyitems?.locks?.[id]; }
/** True when the lock's requirements are held (mode 'all' = every key, 'any' = at least one). */
export function lockOpen(id: string): boolean { const l = lockDef(id); if (!l) return false; const have = (l.requires || []).map((k: string) => $.has(k)); return l.mode === 'any' ? have.some(Boolean) : have.every(Boolean); }
/** Locks that a key item participates in (for the journal's "Used for" list). */
export function locksFor(key: string): any[] { return Object.values<any>(DB.keyitems?.locks || {}).filter((l) => (l.requires || []).includes(key)); }
export const KIND_LABEL: Record<string, string> = { hard: 'Gate', soft: 'Soft gate', puzzle: 'Puzzle', social: 'Social', quest: 'Quest', story: 'Story', system: 'System', optional: 'Optional', 'realm-shift': 'Realm' };
