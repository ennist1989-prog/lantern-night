import './sentry'; // must stay first: init Sentry before Phaser boots
import Phaser from 'phaser';
import { Input } from './core/input';
import { Audio } from './core/audio';
import { Settings } from './core/settings';
import { W, H } from './ui/windows';
import { $ } from './core/state';
import { DB } from './core/db';
import * as Field from './core/fielduse';
import * as Gear from './core/gear';
import * as Locks from './core/locks';
import { migrateGame } from './core/migrate';
import { SPEC } from './battle/spec';
import { SaveManager } from './core/save';
import { BootScene } from './scenes/boot';
import { TitleScene } from './scenes/title';
import { CreditsScene } from './scenes/credits';
import { MapScene } from './game/mapscene';
import { BattleScene } from './battle/battlescene';
import { MenuScene } from './scenes/menu';
import { ShopScene } from './scenes/shop';
import { SaveLoadScene } from './scenes/saveload';
async function start() {
  Settings.load();
  try { const f = new FontFace('Pixelify', 'url(assets/fonts/PixelifySans.ttf)', { weight: '400 700' }); await f.load(); document.fonts.add(f); await document.fonts.load('22px Pixelify'); } catch (e) { console.warn('font', e); }
  const game = new Phaser.Game({
    type: Phaser.AUTO, width: W, height: H, parent: 'game', backgroundColor: '#05070f', pixelArt: true, roundPixels: true, antialias: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { keyboard: true, gamepad: false },
    audio: { disableWebAudio: false },
    scene: [BootScene, TitleScene, MapScene, BattleScene, MenuScene, ShopScene, SaveLoadScene, CreditsScene],
  });
  (window as any).__game = game; (window as any).__S = { $, DB, Input, SaveManager, Settings, Field, Gear, Locks, migrateGame, SPEC };
  Audio.init(game); Input.init();
  game.events.on('prestep', () => Input.update());
  // resume audio on first gesture
  const unlock = () => { const s: any = game.sound; if (s.context && s.context.state === 'suspended') s.context.resume(); };
  window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
  // TEMP: Sentry verification — remove after confirmed
  // Load the game with ?sentry_test=1 to throw an uncaught error after Sentry.init + Phaser boot.
  if (new URLSearchParams(location.search).get('sentry_test') === '1') {
    setTimeout(() => { throw new Error('Lantern Night Sentry verification error (TEMP ?sentry_test=1)'); }, 1500);
  }
  // END TEMP: Sentry verification
}
start();
