# Lantern Night: The Far Shore — playable slice (Chapters 1–2)

A browser RPG that looks and plays like an RPG Maker MV/MZ game. Phaser 4.2.1 + TypeScript + Vite, fully static.

```
npm install
npm run build           # -> dist/ (static, host anywhere)
python3 -m http.server 8099 --directory dist
```

## Live build & redeploy
Live: https://ennist1989-prog.github.io/lantern-night/ (GitHub Pages, branch `gh-pages`).
Redeploy after any change (URL stays the same): `npm run deploy`
(= `bash scripts/deploy.sh`: builds with Vite `base: './'`, force-pushes `dist/` to `gh-pages`; requires `gh auth login`).
Source on `main`: `git add -A && git commit -m "..." && git push`.

## Controls
| Action | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | Arrows / WASD | D-pad / left stick | on-screen D-pad |
| OK / talk | Z / Enter / Space | A | OK button |
| Cancel / menu | X / Esc | B (cancel), Start/Select (menu) | Menu button |
| Dash | hold Shift or Ctrl | X / LT / RT | — |
| Shift realms (Near ⇄ Far) | Q / Tab | Y | Shift button |
| Page (menus) | Q / E | LB / RB | — |
| Message Auto / Skip | V / F | L-stick / R-stick click | — |

Battle: Fight / Flee / Auto / Speed ×1–×2. Actor commands: Attack, Skill, Parley, Bond, Guard, Item, Shift (Mio).

## Data-driven design (adding chapters 3–8 is data only)
Everything the battle engine needs lives in `public/data/spec/*.json` (imported from the design spec by `tools/spec_import.py`):
enemies (forms, rates, skills, parley temperament, bond, drops), skills (243), states, troops (+boss events), bosses (phases, patterns),
zones (encounter tables per realm, steps, grace, BGM), parley table, bonds, elements, progression.

* `src/battle/engine.ts` — headless engine (damage pipeline, turn order, Echo, Parley/Send/Invite, VP/Unveil, bond gauge, Possess, boss phase runner, telegraphs, Lumen). No Phaser imports: `node tests/sim.cjs` balance-simulates it.
* `src/battle/battlescene.ts` — plays the engine's event stream with animation + RM-style windows.
* A new zone = a zone JSON entry + a map (`tools/maps_*.py` → `public/data/maps/*.json`) whose `encounter` is `{region:3, zone:'z06'}` (or `zones:{near,far}`).
* A new boss = bosses.json entry + `boss_<id>` troop + one `{'c':'battle','troop':'boss_<id>'}` event command.
* `python3 tools/gen_game.py` regenerates DB + maps + spec import in one go.

## Items, gear, key items, magic, summons (data in `public/data/`, imported by `tools/items_import.py`)
* `items.json` (295) — consumables with effect ops (`hp, hpPct, sp, lumen, lumenMax, revive, cure, cureAll, removeStack, escape, repel, perm, states, damage, mood, echo, vp, escapeDungeon, warp, peek`), gear with `rarity`, `tier`, `set`, `traits`, `realm:{near,far}` (stats swap with the shore) and `iconV2` (34 px sheet `assets/icons2.png`, 496 CC0 icons).
* `equipment.json` — slots (weapon, armor, charm, 2nd charm [needs Charm Cord, ch4], keepsake, bond), rarity colours, sets (2/3-piece bonuses), forge rules (+1…+3 by tier; gold + materials by rarity family; relics/charms cannot be forged).
* `keyitems.json` — key items (journal screen, stack counts) and `locks` (gate/puzzle/quest requirements; interpreter conditions `lock` / `nlock`).
* `spec/skills.json` — 53 spells in 8 schools (learned by level, Bond-song lessons, or story flags; `spec/learn.json`), field spells (`field:{tile,realm,effect,range}`); `spec/summons.json` — 12 keepsake summons (once per battle, one per round, SP + Lumen + Echo). Map events opt into field spells with `ft:'<tile>'` + `fieldList`.
* Saves carry a version (`SAVE_VERSION = 2`, `src/core/migrate.ts` upgrades older saves).
* Tests: `tests/n1.mjs` (data/logic), `n2.mjs` (menu screens), `n3.mjs` (map locks + field spells), plus the earlier t/b suites (`node tests/<name>.mjs` against `npm run preview -- --port 8099`).

## Feel parameters (RPG Maker-like, re-implemented)
Walk 267 ms/tile and dash 133 ms/tile (Options → Walk Speed: Brisk restores the old faster pace), key repeat 24/6 frames, latest-pressed-axis 4-way direction, window padding 12 / line height 36 / item height 44 (`WIN` in `src/ui/windows.ts`), message speed 60 chars/s (Options → Text Speed) with control codes `\C[n] \V[var] \N[actor] \I[item] \. \| \!`, encounter counter rand(n)+rand(n)+1 with our fairness floor/grace, integer variables.

See `CREDITS.md` and `LICENSES.md` for asset licences (Ninja Adventure CC0, Pixelify Sans OFL, 496 Pixel Art Icons CC0).

## Designer tweaks, side quests, polish (Oct 2026)
- **Balance:** EXP multiplier k = 0.70 (L≤6) / 0.66 (L7–12) / 0.60 (L13+); EXP curve flattened above L12 (next level costs 240 + 10·(L−12)); enemy HP ×0.9 from L10; damage floor = 10% of raw; Kaze DEF growth 5→19; +2 Lumen when a Far fight ends with a Calm/Send/Invite. Echo is taught on the Straw Warden fight (an Echo pip is primed the first time, with a one-time tip).
- **Side quests:** `tools/sq_import.py` copies `rpg-research/data/sidequests.json` → `public/data/sidequests.json` (all 16 quests; loaded as `DB.sidequests`) and generates quest-log entries for chapters ≤ `CHAPTER_CAP`. The event command `{'c':'sqreward','id':'sqNN'}` grants the data-defined reward. In the slice: sq01/sq02 are the hand-built Hanzo/Kiku quests (rewards aligned with the data), and sq03 *Hollow Roll Call* (Sister Ume, Far shrine floor) and sq04 *The Wrong Note* (Bell Mouse, three bells: Near pitches wrong, Far pitches true) are new (`tools/sidequests_maps.py`).
- **Feel:** hit-pause (40/70/110 ms normal/weak/crit), decaying trauma camera shake, rising pitch on consecutive weakness hits, lower pitch on resisted hits; boss intro with letterbox, per-boss bell sting and epithet nameplate (`epithet` in `spec/bosses.json`; full first time, short after, OK/Cancel skips); realm shift with Lantern-origin iris, tint fade, ring and a WebAudio low-pass sweep (longer on the first shift). Options: **Screen Juice** (Full/Reduced/Off), **Lantern Warmth** assist (Off/Gentle/Strong: party heals 3%/6% per round, field Lumen drain −20%/−40%). After two losses to the same boss, the fight opens with an optional hint / Warmth offer.
- **Story touches:** Mio's hesitation choice at the Elder's call, Daigo's early cameo by the forge, the Straw Warden's still flame and paper name-seal, the matching seal on the bell's clapper-rope (it re-ties itself after the Bell rings), a wall calendar counting nights to Lantern Night, and a quiet *ma* beat per chapter (Old Well rim at dusk; Mio and Kaze under the silent bell).
