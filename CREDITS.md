# Lantern Night: The Far Shore — Credits & Licences

Game design, story, code, map/event/data scripts: original work for this project.

## Third-party assets shipped in the build

| Asset | Author | Licence |
|---|---|---|
| **Ninja Adventure Asset Pack** — character/monster/boss sprites, faces, tilesets, objects, FX, icons, UI window-skin pieces, music (`bgm/*.ogg`), jingles (`me/*`) and sound effects (`se/*`) | Pixel-boy & AAA — https://pixel-boy.itch.io/ninja-adventure-asset-pack | **CC0 1.0 Universal** (public-domain dedication; commercial use allowed, attribution not required but given here). Full text: `public/assets/fonts/CC0-NinjaAdventure-LICENSE.txt` / `LICENSES.md`. |
| **Lantern Night original pixel art** — Ch3 redo v3 (`/workspace/lantern-night-art/ch3-redo-v3/`, graded READY): Kappa battler strips (`boss/kappa_toll.png`, `boss/kappa_toll_spilled.png`), Kappa map sprite and faces (`chars/kappa.png`, `faces/kappa.png`, `faces/kappa_bowed.png`), Oto map sprite and face (`chars/oto.png`, `faces/oto.png`), Willow Mother Calm and Strained strips (`boss/willow_mother.png`, `boss/willow_mother_strained.png`), field sapling (`chars/willow_final.png` → `chars/willow.png`) and faces (`faces/willow_final.png` → `faces/willow.png`, `faces/willow_final_calm.png`, `faces/willow_final_strained.png`) | Lantern Night (drawn by code, own work) | Lantern Night original pixel art, CC0 |
| **496 Pixel Art Icons for medieval/fantasy RPG** (item, equipment, spell and key-item icons, `public/assets/icons2.png`) | Henrique Lazarini ("7Soul1"); repacked by gnola14 — https://opengameart.org/content/496-pixel-art-icons-for-medievalfantasy-rpg | **CC0 1.0 Universal** (public domain; attribution not required but given here). |
| **Pixelify Sans** (UI font, `PixelifySans.ttf`) | The Pixelify Sans Project Authors — https://github.com/eifetx/Pixelify-Sans | **SIL Open Font License 1.1**. Full text: `public/assets/fonts/OFL-PixelifySans.txt`. |
| **Ch3 readability edits of Ninja Adventure tiles/objects** — `public/assets/tiles/ch3fix.png` (Far-Shore stepping stone, bridge planks, violet-river lip, trail rim) and the edited `chest`, `deadtree_l`, `deadtree_s`, `stump`, `tree_*` and `flower_w` object cells (`art/custom/objects/`) | Ch3 readability edits of Ninja Adventure tiles/objects (CC0, Pixel-boy & AAA), by Lantern Night | **CC0 1.0 Universal** |
| **Training maze art (maze-v1)**: `public/assets/tiles/maze.png` (hedge autotile, canopy corners, pocket joins), `supply_box` / `supply_box_open` object cells, the mochi icon (icons.png slot 74), `chars/haru.png`, `chars/tokubei.png`, `faces/haru.png`, `faces/tokubei.png` (recolours of Ninja Adventure villager3 / noble bases) | Drawn for Lantern Night by Ember; derived from Ninja Adventure (CC0, Pixel-boy & AAA) | **CC0 1.0 Universal** |
| **Phaser 4** (game engine) | Phaser Studio Ltd — https://phaser.io | MIT |
| **Vite**, **TypeScript** (build tooling, not shipped as assets) | Vite contributors / Microsoft | MIT / Apache-2.0 |

## Deliberately NOT shipped

* The Ninja Adventure pack also contains a bitmap font ("NormalFont"). Its author lists it as **non-commercial only**, so it is *not* included; the game uses Pixelify Sans (OFL) instead.
* No assets from RPG Maker, commercial packs, or other games are included. The game only *imitates the look and structure* of RPG Maker MV/MZ (windows, menus, battle layout, event model) with original code.

## Runtime recolouring

The "Far Shore" look is produced at runtime by gradient-mapping the (CC0) Near Shore art; no extra art assets are involved.
