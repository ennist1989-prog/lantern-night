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

See `CREDITS.md` and `LICENSES.md` for asset licences.
