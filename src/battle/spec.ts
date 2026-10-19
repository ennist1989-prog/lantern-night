// Data-driven battle spec (loaded from public/data/spec/*.json; generated from the design spec by tools/spec_import.py).
// Later chapters = more entries in these files; no engine changes needed.
export const SPEC: any = { enemies: {}, skills: {}, states: {}, troops: {}, bosses: {}, zones: {}, parley: {}, bonds: {}, elements: {}, progression: {}, learn: { bond: {}, story: {} }, summons: { rules: {}, summons: {} } };
export async function loadSpec(fetcher: (n: string) => Promise<any>) {
  const names = Object.keys(SPEC);
  await Promise.all(names.map(async (n) => { SPEC[n] = await fetcher(n); }));
  registerSummons();
}
/** Register every Keepsake summon as a pseudo-skill (tag 'summon') so the engine's skill pipeline resolves it. */
export function registerSummons() {
  for (const [id, d] of Object.entries<any>(SPEC.summons?.summons || {})) {
    SPEC.skills[id] = { id, name: d.name, desc: d.desc, type: d.damage ? 'mag' : 'support', element: d.element, scope: d.scope, cost: { sp: d.cost.sp, lumen: d.cost.lumen, bond: 0, echo: d.cost.echo || 0 }, speed: 0, hits: d.hits || 1, damage: d.damage, effects: d.effects || [], anim: '', se: '', tell: false, tags: ['summon'], vpDamage: d.vpDamage || 0, school: 'summon', iconV2: d.icon };
  }
}
export function setSpec(o: any) { Object.assign(SPEC, o); registerSummons(); }
export const ELEMS = ['phys', 'flame', 'tide', 'bloom', 'gale', 'lumen', 'umbra'] as const;
