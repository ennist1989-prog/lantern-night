# art/custom — hand-made art that survives the asset pipeline

`tools/build_assets.py` deletes and rebuilds `public/assets/` from the Ninja Adventure pack, and `tools/spec_import.py`
(run by `npm run data`) re-copies every boss image from the pack. **Anything copied straight into `public/assets/` is lost
on the next run.** Put finished art here instead; the pipeline never deletes this folder and copies it over
`public/assets/` as its last step.

| Folder | Lands in | Notes |
|---|---|---|
| `boss/<id>.png` | `public/assets/boss/<id>.png` | Battler **strip**: N square frames side by side, e.g. 384×64 = 6×64². `boss/meta.json` is derived from the strip (or from the spec's `frame`/`n` when the boss sprite has a `custom` field). Displayed at an integer scale `round(215 / fh)` (64 px → ×3). |
| `chars/<id>.png` | `public/assets/chars/` | 64×112 Ninja Adventure layout (4 cols down/up/left/right × 7 rows of 16×16). |
| `faces/<id>.png` | `public/assets/faces/` | 38×38, **opaque dark background `#141b1b`** (same convention as the shipped Ninja Adventure faces; the message window draws them as-is). |
| `bgm/<id>.ogg` | `public/assets/bgm/` | OGG Vorbis (loop tags welcome). |
| `tiles/ch3fix.png` | `public/assets/tiles/ch3fix.png` | Ch3 readability tile sheet (16×16 grid, sheet index 5). When present, `tools/maps_ch3.py` remaps the Willow Hollow ford stones/river and the Misty Grove trail to it (gids per `far-readability-fixes.md`); when absent the maps stay as they are. |
| `objects/<name>.png` | packed into `public/assets/objects.png` | **Not copied**: `tools/build_assets.py` (`npm run assets`) replaces the extracted object cell `<name>` with this image before packing (e.g. the redrawn chest). |

Boss sprites can point at custom art from the spec: in `tools/spec_import.py` → `SPRITE_OVERRIDES`
(applied on top of `/workspace/rpg-research/data/bosses.json`) set `{"custom": "art/custom/boss/<id>.png", "frame": [64, 64], "n": 6}`.
If the file is missing the importer keeps the current placeholder, so `main` stays shippable.

After dropping files in, run **one** of:
- `python3 tools/art_custom.py` — just overlay + refresh `public/assets/manifest.json` (fast; enough for new art)
- `npm run data` — full data regeneration (also overlays at the end)

`public/assets/manifest.json` tells the game which optional files exist (Tsubaki sheet/faces, the `final` BGM), so it
never requests a file that isn't there. **Always re-run one of the commands above after adding/removing files.**

### Currently expected (Tsubaki asset pack v1, §4.1)
- `boss/tsubaki_forge.png`, `boss/tsubaki_final.png` — 384×64 (6 × 64×64)
- `chars/tsubaki.png` — 64×112 (not recoloured on the Far Shore: map via `NO_FAR` in `src/game/character.ts`, battle via the `noFar` sprite flag)
- `faces/tsubaki.png`, `faces/tsubaki_grief.png`, `faces/tsubaki_anger.png`, `faces/tsubaki_resolve.png` — 38×38
- `bgm/final.ogg` — final-boss theme (until then the game falls back to `boss`)

### Ch3 redo v2 hooks (engine)
- **Custom art wins:** `npm run data` runs the overlay right after `ch3_assets.py` (and `ch3_assets` never writes a file that exists here), so v2 art is not overwritten by the generated Ch3 placeholders.
- **Aliases:** `faces/willow_final.png` / `chars/willow_final.png` also land as `faces/willow.png` / `chars/willow.png` (the names the maps use).
- **Frame delay:** a boss sprite may set `fd` (ms per frame) in `SPRITE_OVERRIDES`; it goes into `boss/meta.json` and survives a re-overlay. Default 150.
- **Per-state strips:** `SPRITE_OVERRIDES[id].phaseStrips = {"<phase name>": "<strip id>"}` swaps to `boss/<strip id>.png` while that phase is active (a `stateOn` phase only while its state is on) and back to the base strip on Calm. If the second strip is missing the base strip is used. Wired: Willow `Rootstorm`/`Heart Break` → `willow_mother_strained`, Kappa `Dish Spilled` → `kappa_toll_spilled`.

### Installed: ch3-redo v3 (Lantern Night original pixel art, CC0)
- `boss/kappa_toll.png`, `boss/kappa_toll_spilled.png` (384×64, 6 × 64²; `Dish Spilled` phase strip), `chars/kappa.png`, `faces/kappa.png`, `faces/kappa_bowed.png`
- `chars/oto.png`, `faces/oto.png`
- `boss/willow_mother.png` (432×72, 6 × 72², Calm) and `boss/willow_mother_strained.png` (`Rootstorm` / `Heart Break` phase strip; she is Parley-only, so it shows only if the party attacks her below 60%)
- `chars/willow_final.png` (→ `chars/willow.png`, field sapling), `faces/willow_final.png` (→ `faces/willow.png`), `faces/willow_final_calm.png`, `faces/willow_final_strained.png`
- Not installed: `boss/willow_mother_dream.png` (no phase/state uses it yet) and `icons/oto_bell.png` (there is no icon overlay pipeline; the item uses the icon sheet)
