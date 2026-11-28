# Prompt example — UI icon (health potion)

Tokens: `[SIZE]` = `24x24`, `[N]` = `6`, `[FRAMES]` = `1`.

```
Pixel art sprite for Pocket Rogue, a portrait mobile board roguelike.
Style: readable chibi pixel, 3/4 front view, slightly grounded fantasy (not super-deformed Q-version, not tiny 8-bit).
Canvas: 24x24 px, transparent background, hard-edged pixels only.
Palette: use only the Pocket Torch 32-color set (hex list follows). Per-sprite cap: 6 colors including 1px outline.
Outline: 1px, colored (darken the local color) or Ink #1A1423 where the silhouette must pop; no outline on the bottom contact edge; no 2px outlines.
Light: upper-left; 2-3 value steps per material; one small highlight cluster (1-2 px); no pillow shading; no dither; no anti-alias to transparency; no smooth gradients; no JPEG artifacts.
Readability: clear silhouette in a black-cutout test; must still read as a potion at 3x on a phone.
Animation: single frame, centered, no text, no button frame (the UI supplies the frame).
Do not copy characters, logos, or tiles from Rogue Legend or any other commercial game.

Subject: Health potion icon for the shop and inventory. Round bottle, crimson liquid, tiny Spark highlight, 1px colored outline.

Pocket Torch palette:
#1A1423 Ink, #2E2438 Deep Shadow, #3D3A4A Dark Stone, #545064 Mid Stone, #7A7588 Light Stone, #A8A3B3 Pale Stone, #C9C4D1 Bone, #E8DCC8 Parchment, #3A2414 Dark Wood, #6B3A1A Bronze, #B85C1A Torch Orange, #E8A03A Gold, #F8D878 Spark, #FCEEC0 Pale Light, #3A5A8C Steel Blue, #C5D8F0 Pale Steel, #4A2C22 Skin Shadow, #8C5A3C Mid Skin, #D4A07A Light Skin, #5A1E2A Deep Crimson, #A33B4C Crimson, #E86A6A Hurt Pink, #1E3A28 Dark Moss, #3D7A45 Mid Green, #7BC46A Slime, #C6E87A Toxic Pale, #1A2A4A Deep Navy, #7A9ED4 Ice, #2A1A12 UI Panel, #3ECF7A HP Safe, #E85D4C Danger, #6E5AE8 Magic Violet
```

Hand-clean with the checklist in `base-template.md` before review. Confirm the icon can sit inside a 48 dp tap target after integer scale.
