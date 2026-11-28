# Pocket Rogue — Starter Asset List v1

Owner: Pocket Art · Status: **proposal awaiting Thomas / Design lock** · Date: 2026-11-27

Companion to [`style-guide.md`](style-guide.md). Class names (Knight, Ranger, Mage, Rogue, Cleric) and milestone shape come from Pocket Design's GDD v0 draft. Chapter 1 creature names and the Ashvault Crypt theme are Pocket Art placeholders.

Priority: **P0** must ship for that milestone's exit · **P1** should · **P2** could.

Combat juice Pocket Art owes Pocket Code (Design GDD v0 asked for a VFX list): hit spark, crit flash, death puff, heal cross, tile-hop dust, Burst flash, and 16 px status icons for Burn, Bleed, Stun, and Shield. Hit-stop and screen shake are code, not art.

## M0 — Prototype ("is the loop fun?")

Needed so Pocket Code can ship a portrait web build with one 24-tile board, one class, auto-battle, perk pick, and results.

| Asset | Spec | Pri |
|---|---|---|
| Knight board + battle sprite | 32×32, 4-dir flip ok, idle / walk / attack / hurt / death | P0 |
| 3 Chapter 1 fodder enemies | Bone Rat, Candle Slime, Crypt Bat (32×32, idle / attack / hurt / death) | P0 |
| 1 Chapter 1 boss | Gate Warden, 64×64, shield-close pose that reads the mechanic | P0 |
| Ashvault Crypt tileset | 16 px floor / wall autotile + 3 board-icon overlays (enemy, chest, boss) | P0 |
| Core UI kit | 9-slice panel, PLAY and ROLL buttons (default / pressed / disabled), HP bar, damage numbers, perk card frame | P0 |
| Combat VFX stubs | Hit spark, death puff, tile-hop dust | P0 |
| Lobby shell | Hero stage, PLAY, 5-tab bar (Shop can be a locked plate) | P1 |
| Bitmap number font | 5×7 or 7×9 caps for HP and damage | P1 |

**M0 art exit:** a phone-browser run is readable at arm's length: Knight, three fodder, one boss, floor vs wall, and the ROLL / PLAY / HP / perk UI all pass pixel-lint.

## M1 — Vertical slice ("this is the game")

Design GDD v0 art pass: 3 classes, ~8 enemies, 3 bosses, tileset, UI kit. Chapter 1 is three stages.

| Asset | Spec | Pri |
|---|---|---|
| Ranger + Mage sprites | Same 32×32 sheet rules as Knight, plus class Burst pose | P0 |
| 5 more enemies (8 total) | Skeleton Archer, Shield Skeleton, Grave Cultist, Armored Wight, Candlebearer | P0 |
| 2 more Chapter 1 bosses | Twin Candelabra (summons adds), Ash Duke (enrage at 50%) | P0 |
| Full board-icon set | Buff, debuff, shop, mini-game, start, heal (plus M0 icons revised if needed) | P0 |
| Tile decor | 4-frame torch, bones, cracks; 3–5 floor variants | P0 |
| Gear + item icons | 16×16: 3 weapons, 2 armors, 1 trinket, potion, gold, key, scrap | P0 |
| Perk cards + Talent Road UI | Rarity frames Common / Rare / Epic, tree node gems | P0 |
| Status + Burst VFX | Burn, Bleed, Stun, Shield, Burst flash | P1 |
| Class select portraits | 48×48 busts for Knight, Ranger, Mage | P1 |
| Lobby finish | Hero / Gear / Talents / results screens using the UI kit | P1 |
| FTUE finger / highlight | Simple 16×16 pointer and tile highlight | P2 |

**M1 art exit:** Chapter 1 looks consistent under this style guide, all three classes are distinguishable in silhouette, and the lobby + mid-run UI meet the 48 dp tap-target rule.

## M2 — Content-complete

Depends on Design's chapter plan staying at 5 classes and 3 chapters. Treat names as TBD until Design writes Chapter 2–3 rosters.

| Asset | Spec | Pri |
|---|---|---|
| Rogue + Cleric sprites | Plus 2 class portraits | P1 |
| Chapters 2–3 tilesets | New floor / wall palettes, same autotile layout, still inside Pocket Torch (or +4 named extras) | P0 |
| ~9 more bosses / enemy reskins | Align with Design chapter plan | P1 |
| Pet sprite | 24×24, idle / attack, if pets stay in M2 | P2 |
| Mini-game + shrine art | 3 mini-game boards, 1 shrine | P2 |
| Difficulty and fork-path icons | Hard tier badge, risky / safe branch marks | P2 |
| Cosmetic / skin hooks | Only if Thomas chooses cosmetics later | P2 |

## Production order (M0 first)

1. Pocket Torch swatch PNG / `.gpl` (so Code and Art share the same hexes).
2. Ashvault floor + wall autotile (everything else is judged against this floor).
3. Knight idle + walk (locks silhouette, outline, and light).
4. Bone Rat, Candle Slime, Crypt Bat (tests contrast vs floor).
5. Core UI kit (PLAY, ROLL, HP, perk card) so the prototype is usable.
6. Gate Warden boss.
7. Remaining Knight frames (attack / hurt / death) and VFX stubs.
8. Lobby shell last in M0, first polish in M1.

## File naming (proposal)

```
art/
  palettes/pocket-torch.png
  palettes/pocket-torch.gpl
  actors/knight_idle.png
  actors/knight_walk.png
  actors/knight_attack.png
  actors/knight_hurt.png
  actors/knight_death.png
  actors/knight_burst.png
  enemies/bone_rat_idle.png
  bosses/gate_warden_idle.png
  tiles/ashvault_floor.png
  tiles/ashvault_walls.png
  tiles/ashvault_icons.png
  ui/panel_9slice.png
  ui/btn_play.png
  ui/bar_hp.png
  ui/icon_potion.png
  fx/hit_spark.png
```

Sheets are horizontal strips, no padding between frames, pivot at bottom-center of the feet. See the style guide for canvas sizes and frame counts.
