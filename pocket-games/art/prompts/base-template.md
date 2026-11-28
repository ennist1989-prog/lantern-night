# Base AI prompt template

Use this block as the start of every Pocket Rogue image prompt. Replace the bracketed tokens, then append a subject paragraph (see the sibling files in this folder).

AI is a sketch tool, not a production renderer. Every accepted asset must be hand-cleaned against `../style-guide.md` (Pocket Lamp palette cap, 1 px selective outline, upper-left light, no pillow shading, no AA-to-transparency, no baked glow, silhouette and floor-contrast tests).

```
Pixel art sprite for Pocket Rogue, a portrait mobile board roguelike.
Style: clean modern HD pixel, readable chibi, 3/4 front view, slightly grounded fantasy (not super-deformed Q-version, not tiny 8-bit, not muddy dungeon brown).
Setting cue: Lampfall Reliquary — pale marble and gold leaf, cool stone, warm hanging-lamp accents.
Canvas: [SIZE] px, transparent background, hard-edged pixels only.
Palette: use only the Pocket Lamp 32-color set (hex list follows). Per-sprite cap: [N] colors including 1px outline.
Outline: 1px, colored (darken the local color) or Ink #1B1F32 where the silhouette must pop; no outline on the bottom contact edge; no 2px outlines on 64px art.
Light: upper-left; 2-3 value steps per material; one small highlight cluster; no pillow shading; no dither on characters; no anti-alias to transparency; no smooth gradients; no baked glow, bloom, or film grain (glow is a separate engine layer); no JPEG artifacts.
Readability: clear silhouette in a black-cutout test; must contrast against marble floors (#C9D1DE / #8B95A8).
Animation: deliver a horizontal strip, [FRAMES] frames, no gaps between frames, consistent pivot/feet.
Do not copy characters, logos, or tiles from Rogue Legend or any other commercial game.

Pocket Lamp palette:
#1B1F32 Ink, #2E3A55 Night, #4C5A78 Shade, #8B95A8 Fog, #C9D1DE Marble, #F4F2EC Alabaster, #E8E0D0 Ivory, #161A28 Panel, #2A3148 Panel Mid, #6B4A2A Teak, #A07048 Wood, #C46A22 Copper, #F07828 Ember, #E8B03A Gold, #FFE08A Lamp, #1A4A6E Deep Sea, #3A7CA8 Steel, #6E4034 Skin Shadow, #D29A78 Mid Skin, #F0CDB0 Light Skin, #7A2038 Rose Ink, #E24B5A Crimson, #F08A8A Blush, #EE4F4F Danger, #1F6A48 Forest, #3CCF8A Heal, #8BE05A Poison, #6EC8F0 Ice, #C8E8FA Frost, #3EE0C8 Electric, #7B6CFF Magic, #3A2E8A Magic Shade
```

## Cleanup after generation

1. Crop to the exact canvas. Build animation strips by hand. Discard any background the model invented.
2. Index to Pocket Lamp. Snap every pixel to the 32 colors. Delete colors past the per-sprite cap, starting with near-duplicates.
3. Rebuild the outline and silhouette. AI outlines are usually 2 px, brown-black, and wrap the feet. Redraw 1 px selective outlines and retest the black cutout.
4. Kill pillow shading, soft edges, and baked glow. Flatten to 2–3 value bands. Remove AA-to-alpha, blur, film grain, watermarks, and melted limbs.
5. Fix light and pivot. Force upper-left light on cool stone, with lamp accents only where a light source exists. Align feet and weapon length across frames. Add a hard 3–5 px ground shadow if missing.
6. Run the pixel-lint checklist in the style guide at 100% zoom, then at ×3 on a Marble floor, then on the real lobby or battle mock. Legal check last.
