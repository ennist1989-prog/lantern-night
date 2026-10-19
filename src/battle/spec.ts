// Data-driven battle spec (loaded from public/data/spec/*.json; generated from the design spec by tools/spec_import.py).
// Later chapters = more entries in these files; no engine changes needed.
export const SPEC: any = { enemies: {}, skills: {}, states: {}, troops: {}, bosses: {}, zones: {}, parley: {}, bonds: {}, elements: {}, progression: {} };
export async function loadSpec(fetcher: (n: string) => Promise<any>) {
  const names = Object.keys(SPEC);
  await Promise.all(names.map(async (n) => { SPEC[n] = await fetcher(n); }));
}
export function setSpec(o: any) { Object.assign(SPEC, o); }
export const ELEMS = ['phys', 'flame', 'tide', 'bloom', 'gale', 'lumen', 'umbra'] as const;
