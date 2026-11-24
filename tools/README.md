# tools/

Pipeline and maintenance scripts.

| what | command | notes |
|---|---|---|
| asset pipeline | `npm run assets` → `npm run data` → `python3 tools/ch_audio.py` | destructive first step; see `ASSETS.md` |
| post-condition check | `npm run verify:assets` | asserts `mon/`, boss meta, chapter bgm, icon slots, window skins, manifest |
| reference check | `npm run check:assets` (= `node tools/check-assets.mjs`) | static scan of asset paths; exit 1 on missing, case-mismatched or absolute refs |
| pixel lint | `python3 tools/pixel-lint/pixel_lint.py` | palette/alpha/outline/brightness/gold/contrast rules -> `tools/pixel-lint/report.md` |
| contact sheets | `python3 tools/art_contact_sheets.py` | 2x sheets + palette report under `docs/art/contact_sheets/` |
| Downloads sort | `node tools/asset-sort/sort-downloads.mjs --src <dir> [--apply]` | dry run by default; category folders, junk strip, one commit per category, build check, results log |

`check-assets.mjs` is read-only and dependency-free. It understands the load shapes `src/scenes/boot.ts`
actually uses (`setPath('assets/')`, literal loads, finite name lists, `manifest.json`-gated optionals,
`mon`/`boss` derived from `public/data/spec/*.json`) plus every asset-extension literal elsewhere in `src/`.
Paths inside template literals it cannot resolve are reported as `WARN`, never as passes.
