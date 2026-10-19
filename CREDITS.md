# Lantern Night: The Far Shore — Credits & Licences

Game design, story, code, map/event/data scripts: original work for this project.

## Third-party assets shipped in the build

| Asset | Author | Licence |
|---|---|---|
| **Ninja Adventure Asset Pack** — character/monster/boss sprites, faces, tilesets, objects, FX, icons, UI window-skin pieces, music (`bgm/*.ogg`), jingles (`me/*`) and sound effects (`se/*`) | Pixel-boy & AAA — https://pixel-boy.itch.io/ninja-adventure-asset-pack | **CC0 1.0 Universal** (public-domain dedication; commercial use allowed, attribution not required but given here). Full text: `public/assets/fonts/CC0-NinjaAdventure-LICENSE.txt` / `LICENSES.md`. |
| **Pixelify Sans** (UI font, `PixelifySans.ttf`) | The Pixelify Sans Project Authors — https://github.com/eifetx/Pixelify-Sans | **SIL Open Font License 1.1**. Full text: `public/assets/fonts/OFL-PixelifySans.txt`. |
| **Phaser 4** (game engine) | Phaser Studio Ltd — https://phaser.io | MIT |
| **Vite**, **TypeScript** (build tooling, not shipped as assets) | Vite contributors / Microsoft | MIT / Apache-2.0 |

## Deliberately NOT shipped

* The Ninja Adventure pack also contains a bitmap font ("NormalFont"). Its author lists it as **non-commercial only**, so it is *not* included; the game uses Pixelify Sans (OFL) instead.
* No assets from RPG Maker, commercial packs, or other games are included. The game only *imitates the look and structure* of RPG Maker MV/MZ (windows, menus, battle layout, event model) with original code.

## Runtime recolouring

The "Far Shore" look is produced at runtime by gradient-mapping the (CC0) Near Shore art; no extra art assets are involved.
