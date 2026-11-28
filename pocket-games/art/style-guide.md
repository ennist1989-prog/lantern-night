# Pocket Rogue — Pixel Art Style Guide v1

Owner: Pocket Art · Status: first pass, most numbers are **proposals awaiting Thomas** · Date: 2026-11-27

> **How to read this.** Items tagged **Design GDD v0** come from Pocket Design's draft at `pocket-games/design/GDD-v0.md` (local working copy; not on `main` when this was written). Pocket Research's `pocket-games/rogue-legend-brief.md` was not in the repo yet. Everything else is an art proposal. Revisit as v1.1 when the research brief lands and Thomas signs theme and scale.
>
> Legal: we are inspired by *Rogue Legend*'s pocket-roguelike structure only. Do not reuse its names, characters, tiles, UI, or text.

This document is the repo copy of the team Page. Keep them in sync if either changes.

## 1. Resolution and orientation

| Item | Value | Source |
|---|---|---|
| Orientation | Portrait only | Design GDD v0 (proposal) |
| Pixel grid | 16 px tiles, integer scale only | Proposal |
| Art canvas | 160 × 284 logical pixels (9:16) | Proposal |
| Typical scale | ×3 (480×852) or ×4 (640×1136), never fractional | Proposal |
| Extra screen | HUD, safe-area padding, or letterbox — never non-integer stretch | Proposal |

Pocket Design's GDD v0 locks the product to a one-thumb portrait layout: HUD at the top, board or battle in the upper-middle, thumb zone in the bottom 40%. *Rogue Legend*'s official iPhone App Store screenshots are also portrait (store thumbs such as 600×1300). This guide follows that assumption until Thomas says otherwise.

Design at 160×284 and display with nearest-neighbor integer scale. On taller notched phones, grow vertical HUD or show a little more board; never scale to 2.7× or similar. 160 px is exactly 10 tiles wide, which fits a 24-tile ring board (Design GDD v0) with margin. Hoplite's May 20, 2024 App Store note ("Fixed tiles being too small on some devices") is a reminder that undersized tiles fail on phones.

## 2. Sprite sizes

Proposal: readable chibi on a 16 px grid, larger than Shattered Pixel Dungeon's 12×15 hero, not a Q-version clone of *Rogue Legend*. A 36Kr write-up (Oct 5, 2026) describes *Rogue Legend*'s art as 2D Q-version. We stay in that pocket-readable family but slightly more grounded.

Design GDD v0 asks for side-view auto-battles (hero vs 1–3 enemies) plus a board token that hops tiles. **M0–M1 uses one 3/4 chibi sheet for both:** flip enemies to face left in battle, scale the same sprite up ×2 in the fight lane. A dedicated side-profile set is a later upgrade, not a slice requirement.

| Asset | Canvas | Notes |
|---|---|---|
| Player classes | 32×32 | Silhouette ~24–28 px tall; feet planted on a 16 px tile |
| Regular enemies | 32×32 | Slightly smaller than the hero so hierarchy reads |
| Elites | 32×32 or 32×40 | Same pivot; extra height for armor or weapons |
| Bosses | 64×64 | Occupies about a 2×2 tile footprint in battle |
| Pets (M2) | 24×24 | Sits beside the hero; must not clutter the 32 px body |
| Board token | same 32×32 | No second token set in M0–M1 |
| Ground items | 16×16 | Same cell size as Shattered Pixel Dungeon items (verified in source) |
| UI icons | 16×16 or 24×24 | 24 px for actions that must hit 48 dp after scale |
| Class portraits | 48×48 | Bust only, lobby and class select |
| VFX | 16×16 or 32×32 sheets | Hit, death, heal, status, Burst |

Reference, not a copy target: Shattered Pixel Dungeon tiles are 16×16 (`DungeonTilemap.SIZE = 16`), hero frames are 12×15, items are 16×16. That classic size is too tight for a polished portrait board-and-battle game on a phone, so we step the characters up and keep the tile grid.

## 3. Tile grid and tileset

16×16 tiles, blob or bitmask autotile (a 16-tile blob set is enough for M0; expand to a 47-tile blob if corners show seams). Walls get a 4–8 px top overhang so they read as raised, the same idea as Shattered Pixel Dungeon's raised wall layer, without copying its sheet. Floors stay visually quieter than characters.

| Layer | What to draw | When |
|---|---|---|
| Floor | Base floor plus 3–5 variants (cracks, moss, scuffs) | M0 base, M1 variants |
| Floor edges | Autotile to pits or different biomes | M1 |
| Walls | Autotile with top overhang and inner corner pieces | M0 |
| Doors / stairs | Single unique tiles, not autotiled | M1 |
| Decor | Torch (4-frame), bones, banners; 10–20% coverage max | M1 |
| Board icons | 16×16 overlays: enemy, chest, boss, buff, debuff, shop, mini-game, elite, start, heal | M0: first 3; M1: full set |

The board is a 24-tile ring (Design GDD v0). Icons must be readable at 3× from arm's length: silhouette first, then hue. Do not recode tile type with floor texture alone.

## 4. Pocket Torch palette (proposal)

A 32-color master palette designed for a warm crypt and high contrast on phone screens. No pure black or white.

**Per-sprite caps:** 6 colors for items and small icons (including outline), 8 for classes and enemies, 10 for bosses, 12 for UI 9-slices. Recolors for later biomes should stay inside this set, or add at most 4 named biome extras in a later revision.

### Ink and stone

| Name | Hex | Use |
|---|---|---|
| Ink | `#1A1423` | Default silhouette outline |
| Deep Shadow | `#2E2438` | Shade, ground shadow |
| Dark Stone | `#3D3A4A` | Dark floors, wall interiors |
| Mid Stone | `#545064` | Default floor |
| Light Stone | `#7A7588` | Floor variants, wall faces |
| Pale Stone | `#A8A3B3` | Mortar, stone highlights |
| Bone | `#C9C4D1` | Bone, light masonry |
| Parchment | `#E8DCC8` | UI text on dark panels |

### Torch and metal

| Name | Hex | Use |
|---|---|---|
| Dark Wood | `#3A2414` | Wood, dark bronze shade |
| Bronze | `#6B3A1A` | Armor, button idle |
| Torch Orange | `#B85C1A` | Flame, copper |
| Gold | `#E8A03A` | Player trim, shop, XP fill |
| Spark | `#F8D878` | Highlights, boss icons |
| Pale Light | `#FCEEC0` | Hottest highlight |
| Steel Blue | `#3A5A8C` | Metal, Ranger accents |
| Pale Steel | `#C5D8F0` | Metal highlight |

### Skin and blood

| Name | Hex | Use |
|---|---|---|
| Skin Shadow | `#4A2C22` | Skin shade, dark leather |
| Mid Skin | `#8C5A3C` | Default skin |
| Light Skin | `#D4A07A` | Skin highlight |
| Deep Crimson | `#5A1E2A` | Capes, dark blood |
| Crimson | `#A33B4C` | Cloth, liquid |
| Hurt Pink | `#E86A6A` | Hurt flash, light cloth |

### Nature and magic

| Name | Hex | Use |
|---|---|---|
| Dark Moss | `#1E3A28` | Moss shade, forest later |
| Mid Green | `#3D7A45` | Heal icons, moss |
| Slime | `#7BC46A` | Slime body |
| Toxic Pale | `#C6E87A` | Slime highlight, poison |
| Deep Navy | `#1A2A4A` | Cool shade, Mage cloth |
| Ice | `#7A9ED4` | Magic / ice highlight |

### UI signals

| Name | Hex | Use |
|---|---|---|
| UI Panel | `#2A1A12` | Panel fill |
| HP Safe | `#3ECF7A` | Healthy HP fill |
| Danger | `#E85D4C` | Low HP, enemy tiles, errors |
| Magic Violet | `#6E5AE8` | Events, Mage, rare FX |

## 5. Outline rules

- Thickness is 1 px on 16–32 px art. Bosses may use a 2 px outer rim only if the inner shape still has a 1 px local outline.
- Prefer colored outlines: darken the local fill toward Ink or Deep Shadow. Use Ink `#1A1423` when the silhouette must separate from a busy floor.
- Selective outlining: no outline along the bottom contact edge or under feet; inner seams are shade, not a second outline.
- Cluster outline pixels. No stray single outline pixels, no broken outline gaps except at the contact edge.
- Corners of the canvas stay transparent. No outline halo or drop-shadow baked into the PNG except a 2–3 px ground shadow under characters, painted from Deep Shadow at hard (fully opaque) pixels covering the contact area.
- Never outline every internal detail. Eyes, belt buckles, and weapon edges use shade first.

## 6. Light, shading, and highlights

- Light comes from the upper left, same for every sprite, tile, and UI relief. Lobby portraits follow the same key.
- Two or three value steps per material, sampled from the palette. Shade toward Deep Shadow or Deep Navy, not toward a new hue. Light toward Spark or Pale Light.
- Highlights are small: max 1–2 px on 16 px art, max 3 px cluster on 32 px, max 5 px on bosses. One highlight cluster per material, not a rim around the whole shape.
- No pillow shading (no dark ring around a light center on a flat form). No gradients, no soft airbrush, no Gaussian blur.
- No dither on characters or icons. Optional 2 px checker dither is allowed only on large floor fields, using two neighboring stone values.
- No anti-alias to transparency and no semi-transparent pixels in gameplay art. A single in-palette mid color may soften a 32 px+ curve, 1 px max.
- Export PNG, indexed or RGBA with fully transparent or fully opaque pixels only. Render with nearest-neighbor. Never upscale with bilinear in the editor or the engine.

## 7. Animation frames and timing

A QTE Gamers iPhone review of *Rogue Legend* (Aug 28, 2026) notes that the art looks simple until you notice how much the hero, enemies, and board pieces animate. We will not match a live-ops budget, but idle bobs and tile decor should feel alive. Frame counts below are proposals.

Shattered Pixel Dungeon's hero sheet is a verified baseline, not our cap: idle uses 2 unique frames at 1 fps, run is 6 frames at 20 fps, attack is 4 frames at 15 fps, death is 6 frames at 20 fps (`HeroSprite.java`).

| Anim | Frames | Hold | Notes |
|---|---|---|---|
| Idle (classes) | 4 | 200–250 ms | Breath or torch flicker; loop |
| Idle (fodder) | 2 | 250–300 ms | Cheap bob is enough |
| Walk / hop | 4 | 80–100 ms | Board hop is ~100 ms (Design GDD v0) |
| Attack | 4 | 60–80 ms | Strike on frame 3; 2–4 frame recover |
| Hurt | 2 | 80–100 ms | Recoil plus optional palette flash |
| Death | 4–6 | 80–100 ms | Last frame holds; then death puff VFX |
| Burst (classes) | 4–6 | 60–80 ms | Readable wind-up, then impact |
| Boss idle | 6 | 200 ms | Telegraph poses live in the attack sheet |
| Boss attack | 6–8 | 80 ms | One clear tell frame before the hit |
| Boss death | 8 | 80–100 ms | Last frame holds |
| Tile decor | 4 | 200–300 ms | Torches, banners, shop signs |
| Dice (if used) | 6–8 | 50–60 ms | Land on a clearly readable face |

Sheets are horizontal strips, left to right, no padding between frames, a 1 px magenta (`#FF00FF`, not in-game) gutter only if the engine needs a separator. Pivot at the bottom-center of the feet. Shared shadows stay on a consistent row. Name files `role_anim.png`, for example `knight_idle.png`.

## 8. UI, fonts, and lobby

Layout follows Design GDD v0 (still a proposal to Thomas): portrait, single taps only, tap targets at least 48×48 dp and primary actions at least 64 dp, 14 sp minimum body text, left-hand toggle that mirrors Burst and speed. Art must support that layout, not fight it.

**Buttons.** 9-slice from a 16 px corner grid. Default, pressed, disabled. PLAY and ROLL are the only primary-filled buttons. Idle state uses Bronze/Gold; pressed shifts one step darker; disabled is Mid Stone.

**Fonts.** Bitmap pixel font (5×7 or 7×9, all caps) for HP, damage, and currency, 1 px Ink outline, no anti-alias, integer scale only. Lobby and settings body can use a clean licensed UI font at 14 sp or above. Do not bundle a font whose license we have not checked.

**Health and XP bars.** HP bar 64×8 including a 2 px Ink border; fill uses HP Safe, then Gold, then Danger under 25%. XP / Soul Shard bar is 64×4 in Gold on UI Panel. No gradients, no gloss.

**Combat HUD.** Hero left, enemies right. HP sticks above each sprite. Burst is a ring button in the thumb zone (bottom-right, or bottom-left in the left-hand layout). Speed toggle is the opposite corner, visually quieter.

**Perk cards.** Horizontal row in the bottom third. Rarity is the frame color (Bone / Steel / Gold), not a wall of text. Icon 24×24, title in the bitmap font, one-line effect.

**Lobby.** Every *Rogue Legend* run starts in a lobby (official store copy). Ours: hero stage in the mid-lower third, PLAY in the thumb zone, currencies and settings up top, bottom tabs Play / Hero / Gear / Talents / Shop. Menus open as bottom sheets. Keep the first-run lobby uncluttered; the QTE review praised *Rogue Legend* for not flooding the home screen with buttons.

## 9. Readability on small phone screens

1. **Silhouette test.** Fill the sprite black on a mid-stone floor. If you cannot tell Knight from Ranger, or a slime from a chest, redraw the prop and the pose before adding detail.
2. **Contrast vs floor.** Enemies and items must not share the floor's value range. If a skeleton disappears on Bone-colored stone, outline it in Ink or shift the floor darker. Test each biome.
3. **Player identity.** The current hero always has a unique Gold or class-color trim and a small ground shadow. Do not give that trim to fodder enemies.
4. **Tile language.** Interactive board icons use hues the floor does not: Danger or Crimson for enemy/elite, Gold for shop/chest, Mid Green for heal, Magic Violet for events, Spark for boss.
5. **Arm's-length test.** Preview at 3× on a 360-wide mock, held at arm's length. If a tile type or a Burst button is ambiguous, enlarge the icon or increase contrast; do not add more pixels of decoration.
6. **Safe areas and thumbs.** Keep critical reads out of notches and home indicators. Do not place the only HP read under a thumb rest.

## 10. Pixel-lint checklist

Use this list when reviewing submitted art. Re-run every item at 100% zoom and again at the target integer scale on a mid-stone floor.

| Check | Fail if | Severity |
|---|---|---|
| Canvas size | Frame is not the agreed size, or frames in a strip differ | Block |
| Palette cap | Colors outside Pocket Torch, or over the per-sprite cap | Block |
| Alpha | Semi-transparent or semi-premultiplied edge pixels | Block |
| Scale | Looks soft or shimmering at 3× / 4× (non-integer or filtered) | Block |
| Outline | 2 px default outline, broken gaps, or pillow-like full wrap including feet | Block |
| Light | Key light not upper-left, or multiple competing keys | Block |
| Pillow / AA | Pillow shading, airbrush, blur, or AA to transparency | Block |
| Silhouette | Black-cutout test fails at 3× | Block |
| Floor contrast | Sprite hides on the biome floor it will stand on | Block |
| Cluster / stray | Orphan pixels, noisy speckles, unclustered highlights | Fix |
| Pivot / feet | Feet drift across frames, or hop animation slides | Fix |
| Timing | Frame count or holds differ from the table without a note | Fix |
| UI hit size | Icon art cannot sit in a 48 dp target after scale | Fix |
| AI leftovers | Melted edges, fake grain, watermark, wrong anatomy, extra fingers | Block |
| Legal | Likeness or tile clearly taken from *Rogue Legend* or another game | Block |

## 11. AI prompts and cleanup

Prompt templates live in [`prompts/`](prompts/). AI is a sketch tool, not a production renderer. Every accepted asset is hand-cleaned:

1. Crop to the exact canvas. Build animation strips by hand. Discard any background the model invented.
2. Index to Pocket Torch. Snap every pixel to the 32 colors. Delete colors past the per-sprite cap, starting with near-duplicates.
3. Rebuild the outline and silhouette. AI outlines are usually 2 px, brown-black, and wrap the feet. Redraw 1 px selective outlines and retest the black cutout.
4. Kill pillow shading and soft edges. Flatten to 2–3 value bands. Remove AA-to-alpha, blur, film grain, watermarks, and melted limbs.
5. Fix light and pivot. Force upper-left light. Align feet and weapon length across frames. Add a hard 2–3 px ground shadow if missing.
6. Run pixel-lint at target scale: 100% zoom, then 3× on a mid-stone floor, then on the real lobby or battle mock. Legal check last.

## 12. Starter assets

See [`asset-list.md`](asset-list.md) for the prioritized M0 / M1 / M2 list.

## 13. Open questions for Thomas

1. **Theme and tone (most important).** Design left this open and flagged it for art. Proposal: torchlit Ashvault Crypt, readable chibi pixel, slightly more grounded than *Rogue Legend*'s Q-version look, with no reuse of its art. Confirm or name a different tone.
2. **Portrait and sprite scale.** Follow Design's portrait-only layout, with 16 px tiles and 32 px characters (64 px bosses), one sheet for board and side-view battle. Confirm, or ask for landscape or a different size.

Lower priority, but useful soon: first class is Knight and first biome is one crypt chapter, unless Thomas wants a different starter; and whether M0 ships with placeholder shapes or this style's first real Knight and tileset.

## Sources

- [Rogue Legend — App Store](https://apps.apple.com/us/app/rogue-legend-roguelike-rpg/id6754965520) — lobby-first run loop; official iPhone screenshots are portrait (e.g. 600×1300 thumbs).
- [Rogue Legend — Google Play](https://play.google.com/store/apps/details?id=com.pockethaven.roguelegend) — board tiles, auto-battles, lobby meta systems.
- [QTE Gamers iPhone Friday review](http://qtegamers.blogspot.com/2026/08/mf-roguelegend-ios.html) (2026-08-28) — animation density on hero, enemies, and board pieces; uncluttered home screen.
- [36Kr on Rogue Legend's art and loop](https://eu.36kr.com/en/p/4011573673660551) (2026-10-05) — describes the game as 2D Q-version art with fast battles and a Monopoly-like board.
- [Shattered Pixel Dungeon — `DungeonTilemap.java`](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/tiles/DungeonTilemap.java) — verified 16 px tile size.
- [Shattered Pixel Dungeon — `HeroSprite.java`](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/HeroSprite.java) — verified 12×15 hero frames and idle/run/attack/death frame rates.
- [Hoplite — App Store](https://apps.apple.com/us/app/hoplite/id782438457) — version 2.8.39 (2024-05-20): "Fixed tiles being too small on some devices."
