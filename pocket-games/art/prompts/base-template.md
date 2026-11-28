# Base AI prompt template

Use this block as the start of every Pocket Rogue image prompt. Replace the bracketed tokens, then append a subject paragraph (see the sibling files in this folder).

AI is a sketch tool, not a production renderer. Every accepted asset must be hand-cleaned against `../style-guide.md` (palette cap, 1 px selective outline, upper-left light, no pillow shading, no AA-to-transparency, silhouette and floor-contrast tests).

```
Pixel art sprite for Pocket Rogue, a portrait mobile board roguelike.
Style: readable chibi pixel, 3/4 front view, slightly grounded fantasy (not super-deformed Q-version, not tiny 8-bit).
Canvas: [SIZE] px, transparent background, hard-edged pixels only.
Palette: use only the Pocket Torch 32-color set (hex list follows). Per-sprite cap: [N] colors including 1px outline.
Outline: 1px, colored (darken the local color) or Ink #1A1423 where the silhouette must pop; no outline on the bottom contact edge; no 2px outlines.
Light: upper-left; 2-3 value steps per material; one small highlight cluster (1-2 px on 16px art, up to 3 px on 32px); no pillow shading; no dither on characters; no anti-alias to transparency; no smooth gradients; no JPEG artifacts.
Readability: clear silhouette in a black-cutout test; must contrast against mid-stone dungeon floors (#545064 / #7A7588).
Animation: deliver a horizontal strip, [FRAMES] frames, no gaps between frames, consistent pivot/feet.
Do not copy characters, logos, or tiles from Rogue Legend or any other commercial game.

Pocket Torch palette:
#1A1423 Ink, #2E2438 Deep Shadow, #3D3A4A Dark Stone, #545064 Mid Stone, #7A7588 Light Stone, #A8A3B3 Pale Stone, #C9C4D1 Bone, #E8DCC8 Parchment, #3A2414 Dark Wood, #6B3A1A Bronze, #B85C1A Torch Orange, #E8A03A Gold, #F8D878 Spark, #FCEEC0 Pale Light, #3A5A8C Steel Blue, #C5D8F0 Pale Steel, #4A2C22 Skin Shadow, #8C5A3C Mid Skin, #D4A07A Light Skin, #5A1E2A Deep Crimson, #A33B4C Crimson, #E86A6A Hurt Pink, #1E3A28 Dark Moss, #3D7A45 Mid Green, #7BC46A Slime, #C6E87A Toxic Pale, #1A2A4A Deep Navy, #7A9ED4 Ice, #2A1A12 UI Panel, #3ECF7A HP Safe, #E85D4C Danger, #6E5AE8 Magic Violet
```

## Cleanup after generation

1. Crop to the exact canvas. Build animation strips by hand. Discard any background the model invented.
2. Index to Pocket Torch. Snap every pixel to the 32 colors. Delete colors past the per-sprite cap, starting with near-duplicates.
3. Rebuild the outline and silhouette. AI outlines are usually 2 px, brown-black, and wrap the feet. Redraw 1 px selective outlines and retest the black cutout.
4. Kill pillow shading and soft edges. Flatten to 2–3 value bands. Remove AA-to-alpha, blur, film grain, watermarks, and melted limbs.
5. Fix light and pivot. Force upper-left light. Align feet and weapon length across frames. Add a hard 2–3 px ground shadow if missing.
6. Run the pixel-lint checklist in the style guide at 100% zoom, then at 3× on a mid-stone floor, then on the real lobby or battle mock. Legal check last.
