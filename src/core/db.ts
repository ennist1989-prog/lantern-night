import { SPEC, loadSpec } from '../battle/spec';
// Database mirroring RPG Maker's tabs (Actors / Skills / Items / Enemies / Troops / Quests / States).
export const DB: any = { actors: {}, skills: {}, items: {}, enemies: {}, troops: {}, quests: {}, maps: {}, system: {}, tutorials: {}, bestiary: {} };
export async function loadDatabase() {
  const names = ['actors', 'items', 'quests', 'system'];
  await Promise.all(names.map(async (n) => { DB[n] = await (await fetch(`data/${n}.json`)).json(); }));
  await loadSpec(async (n) => await (await fetch(`data/spec/${n}.json`)).json());
  DB.skills = SPEC.skills; DB.enemies = SPEC.enemies; DB.troops = SPEC.troops; DB.spec = SPEC;
}
export async function loadMapData(id: number) {
  if (DB.maps[id]) return DB.maps[id];
  const m = await (await fetch(`data/maps/map${String(id).padStart(3, '0')}.json`)).json();
  DB.maps[id] = m; return m;
}
export const PARAMS = ['mhp', 'msp', 'atk', 'def', 'mat', 'mdf', 'agi'] as const;
export const PARAM_NAMES: Record<string, string> = { mhp: 'Max HP', msp: 'Max SP', atk: 'Attack', def: 'Defense', mat: 'Magic', mdf: 'Resist', agi: 'Agility' };
export const ELEMENTS = ['phys', 'flame', 'tide', 'bloom', 'gale', 'lumen', 'umbra'];
export const ELEMENT_NAMES: Record<string, string> = { phys: 'Physical', flame: 'Flame', tide: 'Tide', bloom: 'Bloom', gale: 'Gale', lumen: 'Lumen', umbra: 'Umbra' };
export const ELEMENT_COLORS: Record<string, string> = { phys: '#e8e8e8', flame: '#ff9a55', tide: '#6ac8ff', bloom: '#8be07a', gale: '#c8f0b0', lumen: '#fff3a0', umbra: '#c08cff' };
export const expForLevel = (L: number) => 10 * L * (L - 1); // total EXP to reach level L (bible curve)
export const MAX_LEVEL = 20;
