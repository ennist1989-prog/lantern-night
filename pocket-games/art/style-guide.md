# Pocket Rogue — Pixel Art Style Guide v1.1

Owner: Pocket Art · Status: **decided** (Thomas deferred setting, portrait, tile size, character scale, and palette to Pocket Art on 27 Nov 2026, US Eastern) · Date: 2026-11-27

> **How to read this.** Art-direction calls below are decided, not open questions. Layout, classes, the 24-tile board, side-view auto-battle, thumb-zone UI, and tap targets still come from Pocket Design's GDD v0 draft (`pocket-games/design/GDD-v0.md` was a local working copy and was **not** on `main` when v1.1 was written). Pocket Research's brief is now on `main` at [`pocket-games/rogue-legend-brief.md`](../rogue-legend-brief.md); this revision aligns with it (portrait screenshots, readable tile icons, element color language). Legal: inspired by *Rogue Legend*'s structure only. Do not reuse its names, characters, tiles, UI, or text.

This document is the repo copy of the team Page. Keep them in sync if either changes.

## Changes in v1.1 and why

Thomas asked for whatever looks best to the player: the cleanest, newest, most modern look possible, and deferred the art calls to Pocket Art. v1's 16 px tiles / 32 px characters / 160×284 canvas / dark Pocket Torch grade was a safe classic-pixel setup. On a current ~3× phone (~1179 device-pixels wide), a 160-wide canvas only integer-scales to ×7, so each source pixel is a 7×7 block — chunky and retro, not the sharpest read. v1.1 steps up to HD pixel: a 360×640 canvas at ×3 (1080×1920), 32 px tiles, 64 px characters, a brighter 32-color **Pocket Lamp** palette with clearer value separation, soft glow and particles as engine layers over hard pixels, and clean hi-res type in the UI.

| Topic | v1 | v1.1 (decided) | Why |
|---|---|---|---|
| Orientation | Portrait (proposal) | **Portrait** | Still the right product call. Design GDD v0 and the research brief both assume it; *Rogue Legend* App Store shots are portrait (600×1300) [brief §6]. No strong reason to switch. |
| Canvas | 160×284 | **360×640** | ×3 fills a modern phone cleanly (1080×1920) with margin for safe area and the thumb-zone HUD. |
| Tiles | 16 px | **32 px** | Same 10-tile-wide board in a 320 px playfield, but four times the pixel budget, so floors and icons stay crisp at ×3. |
| Characters | 32×32 (bosses 64×64) | **64×64** (bosses 128×128) | Two tiles tall, in the same size band as *Dead Cells*' ~50 px-tall characters (Vasseur, 2018). Enough resolution to look current in screenshots without leaving pixel art. |
| Palette | Pocket Torch (warm, dark, muddy) | **Pocket Lamp** (cool marble, warm lamp accents) | Dark brown-purple grades crush on OLED and read dated. Cool stone plus gold light is cleaner and supports element colors the brief asked art to own. |
| Setting | Ashvault Crypt (proposal) | **Lampfall Reliquary** | Same fantasy-dungeon job for Chapter 1, but pale stone and hanging lamps instead of a muddy torchlit crypt. |
| VFX / UI type | Baked pixel only; bitmap HUD font | **Additive glow/particles over crisp pixels**; **vector/hi-res UI type** + pixel numbers | *Dead Cells* aimed for "neo-retro": a classic pixel base with modern lighting and effects (80.lv, 2017). Soul Knight's store copy likewise pairs "classic 2D pixel art" with detailed portraits and modern VFX. |

## 1. Resolution and orientation

| Item | Value | Status |
|---|---|---|
| Orientation | Portrait only | **Decided** |
| Pixel grid | 32 px tiles, integer scale only | **Decided** |
| Art canvas | 360 × 640 logical pixels (9:16) | **Decided** |
| Playfield | Centered 320 × N strip (exactly 10 tiles wide) | **Decided** |
| Typical scale | ×3 (1080×1920), never fractional | **Decided** |
| Extra screen | HUD, safe-area padding, or letterbox — never non-integer stretch | **Decided** |

Portrait, one-thumb layout stays as Design GDD v0 described it: HUD at the top, board or battle in the upper-middle, thumb zone in the bottom 40%. The research brief confirms *Rogue Legend*'s official iPhone screenshots are portrait (600×1300 ≈ 9:19.5) and assigns Pocket Art "portrait layout, readable tile icons, element color language."

Design at 360×640 and display with nearest-neighbor integer scale (×3 on current 3× phones). The 320-wide playfield is exactly ten 32 px tiles, which fits the 24-tile ring board with margin. Leftover width is chrome or safe-area padding. On taller phones, grow vertical HUD or show a little more board; never scale to 2.7× or similar. Hoplite's May 20, 2024 App Store note ("Fixed tiles being too small on some devices") still applies — 32 px tiles at ×3 are large enough to tap and read.

## 2. Sprite sizes

**Decided:** readable HD-pixel chibi on a 32 px grid. Larger and cleaner than Shattered Pixel Dungeon's 12×15 hero, and not a Q-version clone of *Rogue Legend* (a 36Kr piece, Oct 5, 2026, describes that game's art as 2D Q-version). *Dead Cells* artist Thomas Vasseur wrote that the in-game character is about 50 pixels tall (Game Developer, Jan 25, 2018); our 64×64 canvas with a ~50–56 px silhouette sits in that modern band. Soul Knight's Play Store copy (checked Nov 2026) sells "classic 2D pixel art" together with "detailed pixel portraits" and modern visual effects — the mix we want, without copying its characters.

Design GDD v0 asks for side-view auto-battles (hero vs 1–3 enemies) plus a board token that hops tiles. The research brief confirms combat is automatic, turn-based rounds, not a joystick action game. **M0–M1 uses one 3/4 chibi sheet for both:** flip enemies to face left in battle, scale the same sprite up ×2 in the fight lane. A dedicated side-profile set is a later upgrade, not a slice requirement.

| Asset | Canvas | Notes |
|---|---|---|
| Player classes | 64×64 | Silhouette ~50–56 px tall; feet planted on a 32 px tile |
| Regular enemies | 64×64 | Slightly smaller than the hero so hierarchy reads |
| Elites | 64×64 or 64×80 | Same pivot; extra height for armor or weapons |
| Bosses | 128×128 | Occupies about a 2×2 tile footprint in battle |
| Pets (M2) | 48×48 | Sits beside the hero; must not clutter the 64 px body |
| Board token | same 64×64 | No second token set in M0–M1 |
| Ground items | 32×32 | One tile, quiet against the floor |
| UI icons | 32×32 or 48×48 | 48 px for actions that must hit 48 dp after scale |
| Class portraits | 96×96 | Bust only, lobby and class select |
| VFX sheets | 32×32 or 64×64 | Hard-edged sparks; glow is a separate engine layer |

Reference, not a copy target: Shattered Pixel Dungeon tiles are 16×16 (`DungeonTilemap.SIZE = 16`), hero frames are 12×15, items are 16×16. That classic size is what v1 used. v1.1 leaves it behind so the game reads modern on a current phone.

## 3. Tile grid and tileset

32×32 tiles, blob or bitmask autotile (a 16-tile blob set is enough for M0; expand to a 47-tile blob if corners show seams). Walls get an 8–16 px top overhang so they read as raised, the same idea as Shattered Pixel Dungeon's raised wall layer, without copying its sheet. Floors stay visually quieter than characters, in mid-cool marble, so 64 px sprites pop.

| Layer | What to draw | When |
|---|---|---|
| Floor | Base floor plus 3–5 variants (inlay, cracks, gold leaf, scuffs) | M0 base, M1 variants |
| Floor edges | Autotile to pits or different biomes | M1 |
| Walls | Autotile with top overhang and inner corner pieces | M0 |
| Doors / stairs | Single unique tiles, not autotiled | M1 |
| Decor | Lamp (4-frame), inlay, banners; 10–20% coverage max | M1 |
| Board icons | 32×32 overlays: enemy, chest, boss, buff, debuff, shop, mini-game, elite, start, heal | M0: first 3; M1: full set |

The board is a 24-tile ring (Design GDD v0). Icons must be readable at ×3 from arm's length: silhouette first, then hue. Do not recode tile type with floor texture alone. The research brief asks us to keep the board visible during perk picks — do not cover the map with an opaque full-screen card.

## 4. Pocket Lamp palette (**decided**)

A 32-color master palette designed for pale stone, clear value jumps, and warm lamp accents. No pure black or white. Recolors for later biomes stay inside this set, or add at most 4 named biome extras in a later revision.

**Per-sprite caps:** 8 colors for items and small icons (including outline), 10 for classes and enemies, 12 for bosses, 12 for UI 9-slices.

### Ink and stone

| Name | Hex | Use |
|---|---|---|
| Ink | `#1B1F32` | Default silhouette outline |
| Night | `#2E3A55` | Cool shade, ground shadow |
| Shade | `#4C5A78` | Dark stone, wall interiors |
| Fog | `#8B95A8` | Mid stone |
| Marble | `#C9D1DE` | Default floor, wall faces |
| Alabaster | `#F4F2EC` | Light stone, clean UI fill |
| Ivory | `#E8E0D0` | Bone, warm masonry |
| Panel | `#161A28` | UI panel fill |
| Panel Mid | `#2A3148` | UI raised faces |

### Lamp and metal

| Name | Hex | Use |
|---|---|---|
| Teak | `#6B4A2A` | Dark wood |
| Wood | `#A07048` | Wood mid |
| Copper | `#C46A22` | Copper, button pressed |
| Ember | `#F07828` | Flame, Burn ticks |
| Gold | `#E8B03A` | Player trim, shop, XP fill |
| Lamp | `#FFE08A` | Hottest lamp highlight |
| Deep Sea | `#1A4A6E` | Cool metal shade |
| Steel | `#3A7CA8` | Metal, Ranger accents |

### Skin and blood

| Name | Hex | Use |
|---|---|---|
| Skin Shadow | `#6E4034` | Skin shade, dark leather |
| Mid Skin | `#D29A78` | Default skin |
| Light Skin | `#F0CDB0` | Skin highlight |
| Rose Ink | `#7A2038` | Capes, Wound shade |
| Crimson | `#E24B5A` | Cloth, Wound, liquid |
| Blush | `#F08A8A` | Hurt flash, light cloth |
| Danger | `#EE4F4F` | Low HP, enemy tiles, errors |

### Nature, elements, and magic

| Name | Hex | Use |
|---|---|---|
| Forest | `#1F6A48` | Poison shade, moss |
| Heal | `#3CCF8A` | Healthy HP, heal icons |
| Poison | `#8BE05A` | Poison body and ticks |
| Ice | `#6EC8F0` | Ice ticks, steel highlight |
| Frost | `#C8E8FA` | Ice highlight |
| Electric | `#3EE0C8` | Shock ticks |
| Magic | `#7B6CFF` | Mage, events, rare FX |
| Magic Shade | `#3A2E8A` | Magic shade, violet cloth |

The four tables above are the complete 32-color set. Do not add unlisted midtones.

### Element color language

The research brief asks Pocket Art for a clear element color language (community "meta" in *Rogue Legend* is "pick one element and stack it"). Ours, for Design's Burn / Bleed / Ice / Shock-adjacent status set and for perk tags:

| Element / tag | Colors | Glow (engine layer) |
|---|---|---|
| Burn | Ember, Copper, Gold | Soft Ember additive |
| Wound / Bleed | Rose Ink, Crimson, Blush | Soft Crimson additive |
| Poison | Forest, Poison, Heal | Soft Poison additive |
| Ice | Deep Sea, Ice, Frost | Soft Ice additive |
| Shock | Electric, Steel, Alabaster | Soft Electric additive |
| Magic / rare | Magic Shade, Magic, Frost | Soft Magic additive |
| Heal | Forest, Heal, Lamp | Soft Heal additive |

## 5. Outline rules

- Thickness is 1 px on 32–64 px art. Bosses may use a 2 px outer rim only if the inner shape still has a 1 px local outline.
- Prefer colored outlines: darken the local fill toward Ink or Night. Use Ink `#1B1F32` when the silhouette must separate from a busy floor.
- Selective outlining: no outline along the bottom contact edge or under feet; inner seams are shade, not a second outline.
- Cluster outline pixels. No stray single outline pixels, no broken outline gaps except at the contact edge.
- Corners of the canvas stay transparent. No outline halo or drop-shadow baked into the PNG except a 3–5 px ground shadow under characters, painted from Night at hard (fully opaque) pixels covering the contact area.
- Never outline every internal detail. Eyes, belt buckles, and weapon edges use shade first.

## 6. Light, shading, highlights, and modern VFX

- Light comes from the upper left, same for every sprite, tile, and UI relief. Lobby portraits follow the same key. Biome mood comes from a cool marble ambient plus warm lamp accents — not a brown grade over the whole frame.
- Two or three value steps per material, sampled from the palette. Shade toward Night or Deep Sea, not toward a new hue. Light toward Lamp or Alabaster.
- Highlights are small: max 2–3 px on 32 px art, max 4–5 px cluster on 64 px, max 8 px on bosses. One highlight cluster per material, not a rim around the whole shape.
- No pillow shading. No gradients, no soft airbrush, no Gaussian blur in the sprite PNG.
- No dither on characters or icons. Optional 2 px checker dither is allowed only on large floor fields, using two neighboring stone values.
- No anti-alias to transparency and no semi-transparent pixels in gameplay sprites, tiles, or icons. A single in-palette mid color may soften a 64 px+ curve, 1 px max.
- **Modern touch (decided):** soft glow, lamp bloom, and particles are engine layers composited *over* hard-edged pixels (additive or screen, short-lived). Do not bake glow, bloom, or film grain into the PNG. This is the "neo-retro" split *Dead Cells* described: a classic pixel base with modern lighting and effects.
- Export PNG, indexed or RGBA with fully transparent or fully opaque pixels only. Render sprites and tiles with nearest-neighbor. Never upscale with bilinear in the editor or the engine. VFX glow layers may use light filtering; the pixel layer underneath must stay crisp.

## 7. Animation frames and timing

A QTE Gamers iPhone review of *Rogue Legend* (Aug 28, 2026) notes that the art looks simple until you notice how much the hero, enemies, and board pieces animate. We will not match a live-ops budget, but idle bobs, hanging lamps, and combat juice should feel alive. Frame counts below are decided defaults; a note in the sheet can vary them.

Shattered Pixel Dungeon's hero sheet remains a verified low-res baseline, not our cap: idle uses 2 unique frames at 1 fps, run is 6 frames at 20 fps, attack is 4 frames at 15 fps, death is 6 frames at 20 fps (`HeroSprite.java`). At 64 px we can afford a slightly richer idle and walk.

| Anim | Frames | Hold | Notes |
|---|---|---|---|
| Idle (classes) | 4–6 | 200–250 ms | Breath or lamp flicker; loop |
| Idle (fodder) | 2–4 | 250–300 ms | Cheap bob is enough |
| Walk / hop | 6 | 80–100 ms | Board hop is ~100 ms (Design GDD v0) |
| Attack | 4–6 | 60–80 ms | Strike on the impact frame; 2–4 frame recover |
| Hurt | 2 | 80–100 ms | Recoil plus optional palette flash |
| Death | 6 | 80–100 ms | Last frame holds; then death puff VFX |
| Burst (classes) | 6 | 60–80 ms | Readable wind-up, then impact |
| Boss idle | 6 | 200 ms | Telegraph poses live in the attack sheet |
| Boss attack | 6–8 | 80 ms | One clear tell frame before the hit |
| Boss death | 8 | 80–100 ms | Last frame holds |
| Tile decor | 4 | 200–300 ms | Lamps, banners, shop signs |
| Dice (if used) | 6–8 | 50–60 ms | Land on a clearly readable face |

Sheets are horizontal strips, left to right, no padding between frames, a 1 px magenta (`#FF00FF`, not in-game) gutter only if the engine needs a separator. Pivot at the bottom-center of the feet. Shared shadows stay on a consistent row. Name files `role_anim.png`, for example `knight_idle.png`.

M0 may ship 2-frame stubs for non-idle animations, but the shipped frames must already be in this visual language — no 16 px programmer art in the prototype.

## 8. UI, fonts, and lobby

Layout follows Design GDD v0: portrait, single taps only, tap targets at least 48×48 dp and primary actions at least 64 dp, 14 sp minimum body text, left-hand toggle that mirrors Burst and speed. Art must support that layout, not fight it.

**Buttons.** 9-slice from a 32 px corner grid (16 px corners are too tight at this scale). Default, pressed, disabled. PLAY and ROLL are the only primary-filled buttons. Idle state uses Gold on Panel; pressed shifts to Copper; disabled is Fog on Panel Mid.

**Fonts (decided hybrid).** Lobby, settings, tab labels, and body copy use a clean licensed geometric sans, rendered hi-res / vector at 14 sp or above — not a bitmap face blown up. Combat numbers, currency pops, and HP digits use a crisp bitmap pixel font (9×11 or 11×13 caps), 1 px Ink outline, no anti-alias, integer scale only. Do not bundle a font whose license we have not checked.

**Health and XP bars.** HP bar 128×12 including a 2 px Ink border; fill uses Heal, then Gold, then Danger under 25%. XP / Soul Shard bar is 128×6 in Gold on Panel. No gradients, no gloss. A short Heal or Danger glow may sit *behind* the bar as an engine layer when values change.

**Combat HUD.** Hero left, enemies right. HP sticks above each sprite. Burst is a ring button in the thumb zone (bottom-right, or bottom-left in the left-hand layout). Speed toggle is the opposite corner, visually quieter.

**Perk cards.** Horizontal row in the bottom third, and the board must remain visible above them (research brief, QoL takeaway). Rarity is the frame color (Ivory / Steel / Gold), not a wall of text. Icon 48×48, title in the UI sans, one-line effect.

**Lobby.** Every *Rogue Legend* run starts in a lobby (official store copy; brief §1.1). Ours: hero stage in the mid-lower third, PLAY in the thumb zone, currencies and settings up top, bottom tabs Play / Hero / Gear / Talents / Shop. Menus open as bottom sheets. Keep the first-run lobby uncluttered; the QTE review praised *Rogue Legend* for not flooding the home screen with buttons. The brief also flags "doom-scroll" gear lists — keep gear tiles large, stacked, and sortable.

## 9. Readability on small phone screens

1. **Silhouette test.** Fill the sprite black on a Marble floor. If you cannot tell Knight from Ranger, or a slime from a chest, redraw the prop and the pose before adding detail.
2. **Contrast vs floor.** Enemies and items must not share the floor's value range. Pale bone on Ivory masonry needs an Ink outline or a darker floor variant. Test each biome.
3. **Player identity.** The current hero always has a unique Gold or class-color trim and a small ground shadow. Do not give that trim to fodder enemies.
4. **Tile language.** Interactive board icons use hues the floor does not: Danger or Crimson for enemy/elite, Gold for shop/chest, Heal for heal, Magic for events, Lamp for boss.
5. **Arm's-length test.** Preview at ×3 on a 360-wide mock, held at arm's length. If a tile type or a Burst button is ambiguous, enlarge the icon or increase contrast; do not add more pixels of decoration.
6. **Safe areas and thumbs.** Keep critical reads out of notches and home indicators. Do not place the only HP read under a thumb rest.

## 10. Pixel-lint checklist

Use this list when reviewing submitted art. Re-run every item at 100% zoom and again at the target integer scale on a Marble floor.

| Check | Fail if | Severity |
|---|---|---|
| Canvas size | Frame is not the agreed size, or frames in a strip differ | Block |
| Palette cap | Colors outside Pocket Lamp, or over the per-sprite cap | Block |
| Alpha | Semi-transparent or semi-premultiplied edge pixels on sprites, tiles, or icons | Block |
| Scale | Looks soft or shimmering at ×3 (non-integer or filtered) | Block |
| Outline | Default 2 px outline on 64 px art, broken gaps, or pillow-like full wrap including feet | Block |
| Light | Key light not upper-left, or a brown grade instead of cool stone + lamp accents | Block |
| Pillow / AA | Pillow shading, airbrush, blur, or AA to transparency in the PNG | Block |
| Baked glow | Bloom, soft glow, or grain painted into the sprite instead of an engine layer | Block |
| Silhouette | Black-cutout test fails at ×3 | Block |
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
2. Index to Pocket Lamp. Snap every pixel to the 32 colors. Delete colors past the per-sprite cap, starting with near-duplicates.
3. Rebuild the outline and silhouette. AI outlines are usually 2 px, brown-black, and wrap the feet. Redraw 1 px selective outlines and retest the black cutout.
4. Kill pillow shading, soft edges, and baked glow. Flatten to 2–3 value bands. Remove AA-to-alpha, blur, film grain, watermarks, and melted limbs. Glow is an engine layer, not pixels in the file.
5. Fix light and pivot. Force upper-left light on cool stone, with lamp accents only where a light source exists. Align feet and weapon length across frames. Add a hard 3–5 px ground shadow if missing.
6. Run pixel-lint at target scale: 100% zoom, then ×3 on a Marble floor, then on the real lobby or battle mock. Legal check last.

## 12. Starter assets

See [`asset-list.md`](asset-list.md) for the prioritized M0 / M1 / M2 list. Chapter 1 is **Lampfall Reliquary**. M0 ships in this visual language (first Knight, tileset, and UI kit), even if some animations are 2-frame stubs.

## 13. Decisions (Thomas deferred these to Pocket Art)

1. **Theme and tone — decided.** Lampfall Reliquary: a ruined marble vault with hanging lamps and gold leaf, cool stone, warm light. Readable HD-pixel chibi, slightly more grounded than *Rogue Legend*'s Q-version look, with no reuse of its art.
2. **Portrait and scale — decided.** Portrait only, 360×640 canvas, 32 px tiles, 64 px characters (128 px bosses), one sheet for board and side-view battle.

Class names (Knight first) and the three-stage Chapter 1 structure still come from Design GDD v0 and wait on Thomas only if he wants a different starter class or biome name. The look does not.

## Sources

- [Rogue Legend brief (Pocket Research)](../rogue-legend-brief.md) — portrait App Store shots (600×1300); Pocket Art owns portrait layout, readable tile icons, and element color language; combat is auto, turn-based rounds.
- [Rogue Legend — App Store](https://apps.apple.com/us/app/rogue-legend-roguelike-rpg/id6754965520) — lobby-first run loop; official iPhone screenshots are portrait.
- [Rogue Legend — Google Play](https://play.google.com/store/apps/details?id=com.pockethaven.roguelegend) — board tiles, auto-battles, lobby meta systems.
- [QTE Gamers iPhone Friday review](http://qtegamers.blogspot.com/2026/08/mf-roguelegend-ios.html) (2026-08-28) — animation density on hero, enemies, and board pieces; uncluttered home screen.
- [36Kr on Rogue Legend's art and loop](https://eu.36kr.com/en/p/4011573673660551) (2026-10-05) — describes the game as 2D Q-version art with fast battles and a Monopoly-like board.
- [Soul Knight — Google Play](https://play.google.com/store/apps/details?id=com.ChillyRoom.DungeonShooter) — "Retro Pixel Indie Game Combined with Exquisite Artwork"; classic 2D pixel art plus detailed portraits and modern VFX (checked Nov 2026).
- [Dead Cells — Vasseur, Game Developer](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-) (2018-01-25) — in-game character height about 50 pixels; no anti-alias crunch; VFX carry impact.
- [Dead Cells interview, 80.lv](https://80.lv/articles/interview-with-the-developers-of-dead-cells) (2017-06-08) — "neo-retro": classic pixel base with modern color, lighting, and effects.
- [Shattered Pixel Dungeon — `DungeonTilemap.java`](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/tiles/DungeonTilemap.java) — verified 16 px tile size (the classic baseline v1 used).
- [Shattered Pixel Dungeon — `HeroSprite.java`](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/HeroSprite.java) — verified 12×15 hero frames and idle/run/attack/death frame rates.
- [Hoplite — App Store](https://apps.apple.com/us/app/hoplite/id782438457) — version 2.8.39 (2024-05-20): "Fixed tiles being too small on some devices."
