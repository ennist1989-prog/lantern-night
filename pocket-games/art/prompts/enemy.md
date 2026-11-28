# Prompt example — enemy (Lamp Slime)

Tokens: `[SIZE]` = `64x64`, `[N]` = `10`, `[FRAMES]` = `2–4` for fodder idle (also export attack 4, hurt 2, death 6).

```
Pixel art sprite for Pocket Rogue, a portrait mobile board roguelike.
Style: clean modern HD pixel, readable chibi, 3/4 front view, slightly grounded fantasy (not super-deformed Q-version, not tiny 8-bit, not muddy dungeon brown).
Setting cue: Lampfall Reliquary — pale marble and gold leaf, cool stone, warm hanging-lamp accents.
Canvas: 64x64 px, transparent background, hard-edged pixels only.
Palette: use only the Pocket Lamp 32-color set (hex list follows). Per-sprite cap: 10 colors including 1px outline.
Outline: 1px, colored (darken the local color) or Ink #1B1F32 where the silhouette must pop; no outline on the bottom contact edge; no 2px outlines.
Light: upper-left; 2-3 value steps per material; one small highlight cluster; no pillow shading; no dither on characters; no anti-alias to transparency; no smooth gradients; no baked glow, bloom, or film grain (glow is a separate engine layer); no JPEG artifacts.
Readability: clear silhouette in a black-cutout test; must contrast against marble floors (#C9D1DE / #8B95A8).
Animation: deliver a horizontal strip, 4 frames, no gaps between frames, consistent pivot/feet.
Do not copy characters, logos, or tiles from Rogue Legend or any other commercial game.

Subject: Lamp Slime, Chapter 1 fodder from Lampfall Reliquary. Low, squat jelly with a tiny glass-lamp wick on top. Silhouette must not look like a gold chest or the hero. Four-frame idle, wick flicker. Cooler greens from the palette, wick uses Ember and Lamp. Slightly shorter than the Knight. No baked glow — the wick is hard pixels only.

Pocket Lamp palette:
#1B1F32 Ink, #2E3A55 Night, #4C5A78 Shade, #8B95A8 Fog, #C9D1DE Marble, #F4F2EC Alabaster, #E8E0D0 Ivory, #161A28 Panel, #2A3148 Panel Mid, #6B4A2A Teak, #A07048 Wood, #C46A22 Copper, #F07828 Ember, #E8B03A Gold, #FFE08A Lamp, #1A4A6E Deep Sea, #3A7CA8 Steel, #6E4034 Skin Shadow, #D29A78 Mid Skin, #F0CDB0 Light Skin, #7A2038 Rose Ink, #E24B5A Crimson, #F08A8A Blush, #EE4F4F Danger, #1F6A48 Forest, #3CCF8A Heal, #8BE05A Poison, #6EC8F0 Ice, #C8E8FA Frost, #3EE0C8 Electric, #7B6CFF Magic, #3A2E8A Magic Shade
```

Hand-clean with the checklist in `base-template.md` before review.
