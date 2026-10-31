const KEY = 'lotfs.settings';
export interface SettingsData { bgm: number; se: number; textSpeed: number; alwaysRun: boolean; walkSpeed: 'classic' | 'brisk'; battleSpeed: 1 | 2; autoBattle: boolean; difficulty: 'gentle' | 'standard' | 'tough'; touch: boolean; msgAuto: boolean; juice: 'full' | 'reduced' | 'off'; warmth: 0 | 1 | 2; autoV2?: boolean; }
const DEF: SettingsData = { bgm: 0.5, se: 0.7, textSpeed: 1, alwaysRun: false, walkSpeed: 'classic', battleSpeed: 1, autoBattle: false, autoV2: true, difficulty: 'standard', touch: true, msgAuto: false, juice: 'full', warmth: 0 };
class SettingsClass {
  data: SettingsData = { ...DEF };
  load() { try { const s = localStorage.getItem(KEY); if (s) this.data = { ...DEF, ...JSON.parse(s) };
    // PF2 #3: picking Auto in battle used to save Auto Battle ON for good. It is now one turn only, so the always-on mode is an
    // explicit Options choice; clear any ON that the old battle menu left behind (once).
    if (!this.data.autoV2) { this.data.autoBattle = false; this.data.autoV2 = true; if (s) this.save(); } } catch (e) { /* ignore */ } }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } }
}
export const Settings = new SettingsClass();
