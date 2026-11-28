# Asset pipeline

`public/assets/` (CC0 Ninja Adventure pack + hand-made art) and `public/data/` (research checkout) are **generated**.
Never hand-edit them. Counts, paths and dimensions below were checked against the tool sources and the shipped assets;
if a tool changes, fix this file in the same commit.

## Full rebuild — exact order

```bash
npm ci
npm run assets                  # ONLY destructive step: rmtree public/assets, rebuild from the pack
npm run data                    # public/data + boss meta + mon/ crops; art/custom overlay runs near the end
python3 tools/ch_audio.py       # the 7 lazy chapter tracks `assets` just deleted
npm run art                     # no-op safety: re-overlay + refresh manifest.json
npm run verify:assets           # post-conditions: mon/ crops, boss meta + layouts, chapter bgm, icon slots, window skins
npm run test:art                # boss frame-layout regression
npx tsc --noEmit                # only if src/ changed; add `npm run build` too
```

The order is load-bearing. Two constraints are written into the code:

- `spec_import.py` does `json.load(public/assets/boss/meta.json)` with no guard → **`assets` must run before `data`** on a
  fresh clone, or `data` dies on a missing file.
- `ch_audio.py` skips tracks that already exist (`--force` overrides) → it is safe **after** the overlay and will not
  clobber a custom `art/custom/bgm/<same name>.ogg`.

What `npm run assets` destroys, and who restores it:

| Gone after `assets` | Restored by | If skipped |
|---|---|---|
| `mon/*.png` (60 creature crops) | `npm run data` (`spec_import.py`) | every monster sprite 404s |
| `boss/meta.json` for `bell_keeper`, `gonbei`, `hundred_year_anvil`, `tengu_master`, `garden_guardian`, `archive_echo` (build writes only `tengu` + `gspirit`) | `npm run data` | wrong frames/scale, silently (`battlescene` falls back to `{fw:50, fh:50}`) |
| `bgm/{forest,forest_far,grove,crossing,crossing_far,willow,willow_far}.ogg` | `python3 tools/ch_audio.py` — **`npm run data` does not** | lazy chapter music never loads |

`npm run verify:assets` (read-only, no `_dl/` or research checkout needed) checks all three rows of that table plus boss PNGs, phase strips, icon slots and both 96×48 window skins (`ui/windowskin.png`, `ui/windowskin_far.png`), and exits non-zero listing what is missing — run it instead of eyeballing the folder.

**Only added art?** Run `npm run art` (then `npm run verify:assets && npm run test:art`). Skip `assets` and `data` entirely.

## Prerequisites

| Step | Needs |
|---|---|
| `npm run assets` | `_dl/pack/Ninja Adventure - Asset Pack/`, or `LN_DL=<dir>` where `<dir>` holds `pack/`, `PixelifySans.ttf`, `OFL-pixelify.txt`; `ffmpeg` with `libvorbis`; Pillow + numpy (numpy only via `contact_objs.extract`) |
| `npm run data` | the pack (for `mon/` crops and pack boss images) **and** `/workspace/rpg-research/data` + `/workspace/rpg-research/assets` — both hard-coded in `spec_import.py` / `items_import.py` |
| `python3 tools/ch_audio.py` | the pack + `ffmpeg` |
| `npm run art`, `npm run test:art` | Pillow; the `objects`/`icons` patches are skipped if their atlases don't exist yet |
| `npm run verify:assets` | Pillow + the repo — no pack, no research checkout |

Without `_dl/` or `rpg-research` there is no full rebuild: set `LN_DL`, clone the research checkout at that exact path, or
copy `public/assets/` from a machine that has both.

## What each step writes

| Command | Output |
|---|---|
| `npm run assets` | 4 tilesets, `objects.png/json` (512 px wide, height-sorted, includes `art/custom/objects/` overrides), 21 chars + faces, 10 monsters, 2 bosses, 15 fx, `icons.png/json` (74 pack icons), `windowskin.png` + `windowskin_far.png` (both copied from `art/custom/ui/`), fonts, 14 bgm + 30 se + 5 me; ends with `art_overlay(); art_manifest()` |
| `npm run data` | in order: `gen_db` → `spec_import` → `items_import` → `sq_import` → `balance_patches` → `ch3_assets` → `ch3_data` → overlay → build maps. Writes `public/data/**`, `mon/`, `boss/*` + `meta.json`, `icons2.*`, `screenshots/maps/*.png` |
| `python3 tools/ch_audio.py` | the 7 lazy chapter tracks, 64k mono |
| `npm run art` | `art/custom/**` overlay, `objects`/`icons` atlas patches, custom boss `meta.json` entries, `manifest.json` |

`ch3_assets.py`/`ch3_data.py` never overwrite a file `art/custom/` owns, and `gen_game.py` re-runs the overlay after them —
that is why custom art survives `npm run data`.

## art/custom/

| Folder | Lands as | Note |
|---|---|---|
| `boss/<id>.png` | `public/assets/boss/<id>.png` | also needs an entry in `SPRITE_OVERRIDES` (`tools/spec_import.py`): `custom`, `frame`, `n`; optional `fd`, `phaseStrips`, `noFar`. Missing file → placeholder kept, `main` stays shippable |
| `chars/<id>.png` | `public/assets/chars/` | 64×112 sheet |
| `faces/<id>.png` | `public/assets/faces/` | 38×38 |
| `bgm/`, `se/`, `me/<id>.ogg` | same subfolder | wins over `ch_audio.py` (it skips existing files) |
| `tiles/<name>.png` | `public/assets/tiles/` | `ch3fix.png` gates `mapkit.has_ch3fix()` → Ch3 tile remaps |
| `objects/<name>.png` | **patched into** `objects.png` + `objects.json` | not copied; cell overwrite, new slot if the size changed |
| `icons/<name>.png` | **patched into** `icons.png` + `icons.json` | not copied; 24×24 at fixed slots `mochi`=74, `spirit_elixir`=75 |

- Run `npm run art` (or `npm run data`) after **adding or removing** anything here — `manifest.json` is what tells `boot.ts`
  which optional files exist (chars/faces/bgm/tiles and boss `phaseStrips`); skip it and the art silently never loads.
- `faces/willow_final.png` and `chars/willow_final.png` are also copied as `willow.png` (`ALIASES` in `art_custom.py`).
- `ICONS` in `build_assets.py` holds 74 entries (indices 0–73), so the next pack icon lands on slot 74 = `mochi`, the one
  after on `spirit_elixir`; only past slot 79 does PIL clip a paste. Re-slot the custom icons before adding pack icons.

## Dimensions

| Kind | Convention |
|---|---|
| Boss battler | Horizontal strip of N square frames: 384×64 = 6×64² (`tsubaki_*`, `straw_warden`, `kappa_toll`), 432×72 = 6×72² (`willow_mother`), 576×48 = 6×96×48 (`bell_keeper`, needs `frameExact`) |
| Frame gutters | no opaque pixel may touch both `x-1` and `x` at any `x = k*fw`; a guessed layout that cuts bodies is auto-corrected to the nearest clean width with a warning, an explicit one is kept but warned |
| Battler scale | `fh <= 16 → ×10`, else `Math.max(1, Math.round(215 / fh))` → 64 px and 72 px both ×3 |
| Frame delay | `meta.fd` ms via `SPRITE_OVERRIDES[id].fd`, default 150, survives re-derives |
| Character sheet | 64×112 — 4 columns (down, up, left, right) × 7 rows of 16×16 |
| Face | 38×38, **opaque** `#141b1b` (shipped faces all have alpha=255; the message window draws them as-is) |
| Tile sheet | 16×16 grid; `ch3fix` = sheet 5, `border` = 6, `maze` = 7 (`mapkit.CH3FIX`, `SHEETS` in `src/game/mapscene.ts`) |
| Icon | 24×24, 16 per row (`icons.png`, 5 rows / 80 slots); v2 item icons 34×34 in `icons2.png` |
| Audio | OGG Vorbis mono: bgm 64k, se 48k, me 64k |

`fw`/`fh`/`n` are derived from the image by `art_custom.frame_meta()` and written to `boss/meta.json`; `npm run test:art`
pins the expected layout per boss. The face size is the only convention no tool checks.

## Traps

- `npm run assets` alone leaves the game visibly broken — finish the chain.
- `ch_audio.py` has no caller in `gen_game.py`/`build_assets.py`; it is a manual step.
- `spec_import.py` printing `custom sprite for <id> not delivered yet` is expected while art is missing, not an error.
- A file dropped straight into `public/assets/` survives `npm run data` (it only overwrites generated names) but is lost on
  the next `npm run assets`. `_dl/` is gitignored — never commit it.
