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
