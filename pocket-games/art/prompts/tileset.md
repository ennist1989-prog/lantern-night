# Prompt example — tileset (Ashvault Crypt)

Tokens: `[SIZE]` = `16x16 tiles in a grid sheet`, `[N]` = `8 per tile`, `[FRAMES]` = `1`, plus a 4-frame torch.

```
Pixel art sprite for Pocket Rogue, a portrait mobile board roguelike.
Style: readable chibi pixel, 3/4 front view, slightly grounded fantasy (not super-deformed Q-version, not tiny 8-bit).
Canvas: 16x16 tiles in a grid sheet, transparent background where a tile has open sky or a pit, hard-edged pixels only.
Palette: use only the Pocket Torch 32-color set (hex list follows). Per-sprite cap: 8 colors per tile including 1px edges.
Outline: walls may use a 1px dark edge at the top overhang; floors should stay quiet, with no full-tile outline box.
Light: upper-left; 2-3 value steps per material; no pillow shading; optional 2px checker dither only on large floor fields using two neighboring stone values; no anti-alias to transparency; no smooth gradients; no JPEG artifacts.
Readability: floors mid-dark so 32x32 characters pop against #545064 / #7A7588. Board-icon overlays must be readable in a black-cutout test.
Animation: still tiles, plus a separate 4-frame 16x16 torch strip, no gaps between frames.
Do not copy characters, logos, or tiles from Rogue Legend or any other commercial game.

Subject: Ashvault Crypt tileset. 16x16 blob autotile floors and walls, raised wall tops (4-8 px overhang), 3-5 quiet floor variants (cracks, moss, scuffs), pit edge, and board-icon overlays for enemy, chest, and boss. No written labels on tiles.

Pocket Torch palette:
#1A1423 Ink, #2E2438 Deep Shadow, #3D3A4A Dark Stone, #545064 Mid Stone, #7A7588 Light Stone, #A8A3B3 Pale Stone, #C9C4D1 Bone, #E8DCC8 Parchment, #3A2414 Dark Wood, #6B3A1A Bronze, #B85C1A Torch Orange, #E8A03A Gold, #F8D878 Spark, #FCEEC0 Pale Light, #3A5A8C Steel Blue, #C5D8F0 Pale Steel, #4A2C22 Skin Shadow, #8C5A3C Mid Skin, #D4A07A Light Skin, #5A1E2A Deep Crimson, #A33B4C Crimson, #E86A6A Hurt Pink, #1E3A28 Dark Moss, #3D7A45 Mid Green, #7BC46A Slime, #C6E87A Toxic Pale, #1A2A4A Deep Navy, #7A9ED4 Ice, #2A1A12 UI Panel, #3ECF7A HP Safe, #E85D4C Danger, #6E5AE8 Magic Violet
```

Hand-clean with the checklist in `base-template.md` before review. Autotile seams are almost always wrong from AI — rebuild corners and overhangs by hand.
