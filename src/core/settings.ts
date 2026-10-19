const KEY = 'lotfs.settings';
export interface SettingsData { bgm: number; se: number; textSpeed: number; alwaysRun: boolean; battleSpeed: 1 | 2; autoBattle: boolean; difficulty: 'gentle' | 'standard' | 'tough'; touch: boolean; msgAuto: boolean; }
const DEF: SettingsData = { bgm: 0.5, se: 0.7, textSpeed: 2, alwaysRun: false, battleSpeed: 1, autoBattle: false, difficulty: 'standard', touch: true, msgAuto: false };
class SettingsClass {
  data: SettingsData = { ...DEF };
  load() { try { const s = localStorage.getItem(KEY); if (s) this.data = { ...DEF, ...JSON.parse(s) }; } catch (e) { /* ignore */ } }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } }
}
export const Settings = new SettingsClass();
