# Pocket Rogue — Game Design Doc v0

Owner: Pocket Design · Status: **first draft, needs Thomas sign-off** · Last revised 2026-11-27 (US Eastern)

**Revision note.** v0 first described a dice-board game (Rogue Legend structure). Thomas replaced that on 2026-11-27 with a **free-roam action loop with kill-count bonus popups and a slot-reel gamble**. The board, dice, tiles and 24-tile ring are **gone**. This version is rebuilt around the new loop.

**How to read labels**
- **DECIDED** = Thomas's stated rule. Do not change without him.
- **proposal** = Pocket Design's call, *needs research/Thomas sign-off*.
- **[RL]** = Rogue Legend fact from `pocket-games/rogue-legend-brief.md`. **[SG]** = similar-games research, [`research/similar-games.md`](research/similar-games.md) (sources linked there).

## 0. Thomas's decisions (the spine)

| # | Rule (DECIDED) |
|---|---|
| D1 | **Free roam** on the map: move up / down / left / right freely. Portrait mobile. |
| D2 | Every time you **kill a certain number of enemies**, a **choice popup** offers: a special ability, a small health increase, a small defense increase, or a minor health potion. |
| D3 | **Gamble mechanic:** a slot reel spins and lands on **three things**; the player **picks one of the three** to add to the character. |
| D4 | Bonuses can trigger **many times per level before the boss**. |
| D5 | Beat the boss → a **gate opens** → enter **world 2**, which works the same way. |
| D6 | Bonuses get **progressively harder/longer to earn** as you advance, but there is **no cap on total bonuses**. |
| D7 | Special abilities are things like **swords spinning around you** and **fireballs shooting outward**. |
| Earlier | Mobile pocket roguelike; Rogue Legend is the main reference; all team work lives in `pocket-games/`; Pocket Art owns art direction (HD-pixel, portrait, 360×640). |

Everything else in this document is **proposal**.

## 1. Pillars and session shape

| Pillar | Meaning | Draws on |
|---|---|---|
| 1. One thumb, always moving | Movement is the only required input; everything else is automatic or one tap. | D1; Survivor.io proves the format on phones [SG]. |
| 2. "One more bonus" | A bonus is always 10-45 s away; each popup is a small, readable power choice. | D2, D4; Vampire Survivors / Brotato level-up loop [SG]. |
| 3. Build by stacking | Abilities level up and combine; stat cards fill gaps; there is no ceiling. | D6, D7; VS/Survivor.io 6-slot model, Magic Survival bonus levels [SG]. |
| 4. Risk is opt-in | The gamble reel is exciting but never unfair: you always pick the best of three. | D3; Luck Be a Landlord, Archero Devil/Angel [SG]. |
| 5. Respect time and wallet | Short runs, reliable save, no paid power, no forced ads. | [RL] monetization complaints and brief §8 "avoid" list. |

**Session targets (proposal):** a world takes ~4-5 minutes; a normal run is 2-3 worlds (~10-14 min) but must be **pausable/resumable at any moment**. Rogue Legend's brief suggests 8-12 min runs; this loop reads better a little shorter. Lobby → run → results → "again" loop ≤ 30 s of menu.

## 2. Character creation and class system (proposal)

- No appearance editor. Pick a **class**; optional name. Under 20 s on first launch.
- **Class = starting ability + stat tilt + one passive.** The starting ability makes every class feel different in the first 5 seconds.

| Class | Start ability | Stat tilt | Passive |
|---|---|---|---|
| Knight | Spinning Blades (orbiting swords) | +HP, +DEF | Gains 1 DEF per 25 kills |
| Mage | Fireball Burst (fireballs shot outward) | +damage | Potions heal 25 % more |
| Ranger | Throwing Knives (aimed, piercing) | +move speed | Crit chance rises while moving |

- M0: 1 class (Knight). M1: 3 classes. M2: 5 (add Rogue, Cleric — data-only if the ability framework is built right).
- Draws on: [RL] "hero = passive rule rewrite"; [SG] Soulstone/VS characters each start with a different weapon.

## 3. Run structure

### 3.1 Shape (proposal unless marked)
- **Run = a sequence of Worlds** (D5). **World = one map "level"** ending in a boss, then a **gate** (D5) to the next world. Assumption: *world == level*. **Open question #1.**
- **World map:** one bounded map ~3 screens tall × 2 wide (portrait), camera follows the player. Enemies spawn off-screen near the player, not across the whole map, to keep counts low on phones. A few **shrines** on the map offer a free reel spin (see §5.4).
- **Boss trigger:** each world has a **boss meter**. Kills fill it (`Q_w` kills, see §7). When full: a warning banner, the field clears of regular enemies except those already alive, the boss spawns, a boundary closes. Beat the boss → **gate opens** at the map's edge → walk in → next world.
- **Death:** run ends. Keep a share of gold; show "what killed you" and a best-world record. **One free revive per run** (restore 50 % HP, brief invulnerability) — echoing [RL] (each run has a revive) but free, not ad-gated. proposal.
- **Save:** auto-save at every bonus popup, and at gate entry. Resume drops the player at the last popup state.
- **No timer fail:** no time limit; difficulty is spawn pressure, not a clock. Optional "frenzy" modifier later.

### 3.2 Flow
```
Lobby → pick class → World 1 map
   roam + auto-attack → kills fill bonus meter → [POPUP] → resume
   (repeat many times; every 4th bonus is a reel)
   boss meter fills → boss → gate opens → World 2 (same loop, harder, new tileset)
   ... death or quit → results → lobby (spend meta currency)
```

## 4. Free-roam navigation and combat model

### 4.1 Movement (D1 decided; control scheme proposal)
- 8-direction analog movement from a **floating virtual joystick** (appears where the thumb touches in the lower 55 % of the screen). Digital 4-way is a subset; analog feels better for dodging and costs nothing.
- Collision with walls/obstacles; no vertical jump. Optional **dodge-roll** button (could) — not needed for M0/M1.
- Camera: lead 30-40 % ahead of movement so the thumb never hides threats.

### 4.2 Combat (proposal)
- **Real-time, fully automatic offense.** Basic attack auto-targets the nearest enemy; abilities fire on their own cooldowns (swords orbit, fireballs shoot outward on a timer). Player skill = positioning, kiting and picking bonuses. Matches [SG] Survivor.io / VS / Magic Survival, which are the proven one-thumb models.
- **Stats:** Max HP, DEF, ATK, move speed, crit %, crit DMG, cooldown. DEF → damage reduction = `DEF / (DEF + 100)`; keeps DEF small-step upgrades meaningful at any scale.
- **Hit rules:** player takes contact/projectile damage with 0.4 s i-frames; HP bar and a low-HP vignette; **after a popup closes, nearby enemies are knocked back and the player is invulnerable for ~1 s** (VS gives 1 s invulnerability; 20 Minutes Till Dawn pushes enemies away after level-up) [SG].
- **Enemy roster (M1):** Swarmer (walks at you), Archer (shoots from range), Charger (telegraphed dash), Elite (large; counts as 3 kills; drops a chest-style reel token), Boss (one readable mechanic: enrage at 50 %, summons, or shield broken by a specific ability).
- **Pacing targets (proposal):** normal enemy dies in 1-3 s of one ability; elite 8-12 s; boss 45-75 s at expected power; player at expected power takes ≤ 30 % HP damage per bonus interval.
- **Performance budget (for Pocket Code):** ≤ 80 live enemies, ≤ 150 projectiles, pooled objects, damage numbers pooled and capped, 60 fps target on a mid-range phone. Clutter is the genre's main failure mode [SG], so ability VFX use lower alpha than enemy attacks.

## 5. The bonus system (core of the design)

### 5.1 Kill meter and popup (D2 decided; details proposal)
- A **bonus meter** at the top of the screen fills with kills. Weighted kills: normal = 1, elite = 3, boss minions = 0 (so summons can't be farmed).
- When it fills: **game pauses** and a 2×2 popup appears in the lower half (thumb zone):

| Card | Effect (proposal numbers) |
|---|---|
| **Ability** | A rolled special ability (or a level-up of one you own). See §6. |
| **+Max HP (small)** | +8 % of class base Max HP (flat after rounding). Also heals that amount. Tiered ×1/×1.5/×2 on bonuses 5, 10, 15... [SG Brotato tiers] |
| **+DEF (small)** | +4 DEF (≈ +3-4 % damage reduction early, diminishing). Tiered the same way. |
| **Minor potion** | Heal 25 % Max HP *now*. Grayed-out/"Full HP" tag if HP ≥ 90 %. |

- One tap resolves the popup; the game resumes after a 3-2-1 beat (see knock-back above). Target decision time ≤ 3 s median.
- **Reroll** the Ability card: costs 1 reroll token; start with 1; meta upgrades add more (VS/Soulstone/20MTD treat reroll as limited/meta-unlocked [SG]).
- **"No cap" safeguard:** if every owned ability is maxed and the slots are full, the Ability card becomes **Ability Surge**: +6 % damage to all abilities (stacking, diminishing after +60 %). So the popup never goes dead (Vampire Survivors gold/chicken fallback, Magic Survival bonus levels) [SG].
- Why four *fixed* categories: the popup can be read by icon in one glance; HP/DEF/potion are the "safety valves" that make taking an ability less than an automatic choice — a risk/reward echo of Archero's Angel (ability or heal) [SG].

### 5.2 Escalation formula (D6 decided; the formula is proposal)
Let `b` = bonuses already taken **in the current world** (starts at 0), `w` = world number (1-based).

```
K(b, w) = ceil( (8 + 3·b + 0.2·b²) × (1 + 0.4·(w − 1)) )     weighted kills needed for the next bonus
```

- Quadratic inside a world → bonuses get slower as you go; the world multiplier makes every later world longer. **No upper limit on `b`** (D6): if a player stalls before the boss meter fills, bonuses keep coming, just further apart.
- Piecewise-then-quadratic is the standard shape [SG: Vampire Survivors +10/+13/+16 per level; 20 Minutes Till Dawn linear then L²].

| b | K, World 1 | K, World 2 | K, World 3 |
|---|---|---|---|
| 0 | 8 | 12 | 15 |
| 1 | 12 | 16 | 21 |
| 2 | 15 | 21 | 27 |
| 3 | 19 | 27 | 34 |
| 4 | 24 | 33 | 42 |
| 5 | 28 | 40 | 51 |
| 9 | 52 | 72 | 93 |
| 15 | 98 | 138 | 177 |
| 1 | 12 | 16 | 22 |
| 2 | 15 | 21 | 27 |
| 3 | 19 | 27 | 34 |
| 4 | 24 | 33 | 41 |
| 5 | 28 | 40 | 50 |
| 9 | 52 | 72 | 93 |
| 15 | 98 | 137 | 176 |

Target kill rate `R_w = 1.2 × (1 + 0.15·(w − 1))` weighted kills/s (spawn director tunes toward this). Boss meter `Q_w = round(270 · R_w, -1)` weighted kills (~270 s of play).

| World | R (kills/s) | Boss meter Q | Bonuses before boss | 1st gap | last gap |
|---|---|---|---|---|---|
| 1 | 1.20 | 320 | 10 | ~7 s | ~43 s |
| 2 | 1.38 | 370 | 9 | ~9 s | ~46 s |
| 3 | 1.56 | 420 | 9 | ~10 s | ~52 s |
| 4 | 1.74 | 470 | 8 | ~10 s | ~49 s |
| 5 | 1.92 | 520 | 8 | ~11 s | ~53 s |
(Computed from the formula above with a script, not from a playtest.)

- **Why this works.** The first bonus arrives in ~7 s (hook), early gaps are ~10-20 s, later gaps stretch to ~45-55 s; kills required grow faster than the spawn rate, so later worlds feel harder to earn *and* less frequent in absolute terms, as Thomas asked. Total bonuses per run are unbounded (more worlds, longer stalls).
- **Anti-stall pity (proposal):** if no bonus in 75 s, the meter jumps by 20 %. Prevents a dead camp on a cleared map; not shown to players.
- **Tunables for Pocket Code:** `8, 3, 0.2, 0.4, 1.2, 0.15, 270` live in a data file. The headless sim (§12) tunes them.

### 5.3 Reel milestones vs opt-in gamble (D3 decided; triggers proposal)
**Proposal:** both, so the reel is common but meaningful.
1. **Milestone reel (free):** every 4th bonus (`b % 4 == 3`) the popup *is* the reel instead of the 4 cards. (A "Safe pick" button opens the normal 4 cards instead — never forced into gambling.)
2. **Opt-in Gamble button** on every normal popup: costs **1 Lucky Token** (tokens: start with 1; +1 per elite kill; +1 per boss; meta upgrades). Spending a token replaces the 4 cards with a reel.
3. **Shrines** on the map (1-2 per world): walk into one for a free reel (reason to roam off-path; Halls of Torment's fixed pickups [SG]).

### 5.4 Reel mechanics (D3 decided; the rest proposal)
- Three reels spin ~1.2 s with a slot-machine sound/animation (borrowing Vampire Survivors' chest-opening presentation and its audio cut-out [SG]). Each reel lands on one **reward symbol**.
- Player **picks one of the three** (D3) and it is added to the character. Tap one card; others dissolve.
- **Symbol odds per reel (cascade like Hades' rarity roll [SG], proposal):**

| Symbol tier | Odds | What it is |
|---|---|---|
| Common | 45 % | Same value as a normal popup card (HP, DEF, potion, ability level). |
| Rare | 35 % | 2× stat card, or a new ability at Lv 2, or +1 reroll. |
| Epic | 15 % | A new ability at Lv 3, or 3× stat card, or a full heal + max HP. |
| Jackpot | 5 % | Rare-evolved ability or "Double Slot" (take **two** picks). |

- **Triple match** (all three show the same item): receive **all three** ("777"). rare by design (depends on pool size); tunable.
- **Never empty (D3 spirit):** if all three are Common (≈ 9 % of spins) the player still picks the best, and a **consolation** minor potion is added. Archero's wheel can land on nothing and Luck Be a Landlord removes bad luck by letting you pick [SG]; we choose the latter.
- **Fairness (proposal):** best-of-three EV ≥ the normal card, bust risk small and soft. **No real money, no ad-gated spins** (the brief records Rogue Legend's "Includes Random Items / Loot Boxes" rating flags [RL §0]); ad-reroll later is an open decision.
- **Skill element:** none (pure RNG with tap-to-stop reels as optional juice). Keep it legible; no gambling-skill confusion.

## 6. Special abilities (D7 decided; list, stats and stacking proposal)

**Slots:** 5 ability slots (proposal; VS and Survivor.io use 6 [SG]). New abilities only appear on cards while a slot is free; otherwise cards level existing abilities. Max level 8.

**Stacking rules (proposal):**
- Each pick of an owned ability = **+1 level**. Numeric formulas: damage `× (1 + 0.25·(L − 1))`; cooldown `× 0.95^(L − 1)`.
- Odd levels add **count** (blades, fireballs, jumps); even levels add **size/damage**.
- **Level 8 = Mastery** (one special effect). **Evolution (could):** an ability at Lv 8 plus a specific passive-style stat card (e.g. Fireball + "Heat" tag) evolves into a bigger version, shown explicitly on the card (Survivor.io's hidden recipe is a pitfall [SG]).
- **Tags** (Orbit, Projectile, Area, Frost, Fire, Poison, Guard, Pet) interact: any ability sharing a tag with another owned ability gets a +10 % damage per distinct synergy partner (max +30 %) — this gives the reel's "which one?" pick meaning (Luck Be a Landlord synergy point [SG]).

| # | Ability | Behavior at L1 | Scaling highlights | Mastery (L8) | Tags |
|---|---|---|---|---|---|
| 1 | **Spinning Blades** (D7) | 2 swords orbit the hero | +1 sword at L3, L5, L7; wider orbit at L2 | Blades throw a wave every 3 s | Orbit |
| 2 | **Fireball Burst** (D7) | 3 fireballs shot outward in a fan every 2.5 s | +2 fireballs at L3, L5, L7; burn at L4 | Fireballs split on hit | Projectile, Fire |
| 3 | **Chain Lightning** | Zaps nearest, jumps to 2 more | +1 jump at L3, L5, L7 | Stuns on 3rd jump | Area |
| 4 | **Frost Nova** | Ring that slows 30 % | Radius L2/4/6; slow +5 % each | Freezes elites 1 s | Area, Frost |
| 5 | **Throwing Knives** | 1 knife at nearest, pierces 1 | +1 knife L3/5/7; pierce +1 at L4/6 | Knives return | Projectile |
| 6 | **Boomerang Axe** | Axe flies out and back | Size L2/4/6; +1 axe L3/5/7 | Axe leaves a damage trail | Projectile |
| 7 | **Meteor Rain** | Random-target meteors w/ 1 s warning | +1 meteor L3/5/7; radius L2/4/6 | Meteors leave burning ground | Area, Fire |
| 8 | **Poison Cloud** | Cloud follows hero, ticks | Radius L2/4/6; tick dmg every level | Spreads between enemies | Area, Poison |
| 9 | **Guardian Shield** | Absorbs 1 hit / 8 s | Cooldown ↓ each level; absorb 2 at L5 | Reflects absorbed hit | Guard |
| 10 | **Spirit Wolf** | Pet attacks nearby enemies | +1 wolf at L4, L8; bite dmg L2/3/5/6 | Wolves heal hero on kill | Pet |
| 11 | **Shockwave** | Knock-back ring every 6 s | Radius L2/4/6; stun at L5 | Wave crit-chance scales with kills | Area |
| 12 | **Soul Siphon** | 3 % lifesteal on kills | +1 % per level | Overheal becomes shield | Guard |

- M0 ships abilities 1-2 (the two Thomas named). M1 ships 1-8. M2 ships all 12.
- Meta can **unlock** abilities into the pool over time (VS-style), so early runs see ≤ 6 abilities (less choice fatigue).

## 7. Loot and items (proposal)

Three layers, kept separate in UI and code:
1. **Run bonuses** — everything from §5/§6; resets each run.
2. **Run drops** — small gold/coins from enemies; chests from elites with reel tokens; potions (floor pickups, low rate) — simple, no inventory.
3. **Gear (permanent, M2):** Weapon, Armor, Trinket (M1: Weapon+Armor only; M2: +Trinket). Rarity Common → Legendary. Upgrade with gold + scrap; merge 3 → next rarity. Gear changes the *starting* stats, never the escalation rules.
- Anti-bloat: one gear decision per results screen; an "Auto equip best" button. [RL] pain points: "doom-scroll to upgrade" and exploding merge costs.
- **Currencies (3):** Gold (gear/talents), Soul Shards (talent tree, from depth/boss), Scrap (gear merge). Premium currency is *not* in M0-M2.

## 8. Between-run meta tree (proposal)

- **Talent Road** (permanent): a vertical, scrolling tree; spent with Soul Shards. ~20 nodes at M1.
  - Trunk: +start HP, +start DEF, +ATK, +move speed, +1 reroll token, +1 Lucky Token, +starting gold, bonus meter −2 % kills per node (**max −20 %**; it speeds *earning* without removing escalation).
  - Branches (per class, M2): 3 keystones each (e.g. Knight: blades also block projectiles).
  - **Ability unlocks:** spend shards to add abilities to the random pool.
  - Rule: **≤ 30 % of total power from meta**, so builds matter more than account level. Run power is the game.
- **Pace:** first 5 minutes of total play should unlock ≥ 3 visible upgrades [RL: "early progression quick and rewarding"].
- **Post-M2 (could):** pets, mounts, hero ascension, loadouts, leaderboards — the content treadmill in [RL]. Not core.

## 9. Difficulty curve (proposal)

- **Enemy power:** HP × 1.18 per bonus-count equivalent inside a world; world multiplier ×1.5 per world; boss ≈ 25× a normal enemy's HP in World 1.
- **Spawn pressure:** on-screen target count grows from ~12 (start of World 1) to ~60 (late World 1 boss meter), reset a little at each new world then climb higher; cap 80.
- **First-run target:** a new account dies somewhere in World 1 on run 1-2, clears World 1 on run 3-5 (~25 min total play), reaches World 2 boss by ~run 10. Tunable by the sim.
- **Soft walls, not hard walls:** if the last 3 runs all ended before the first boss, give a hidden +10 % HP and +1 reroll token for the next run (pity, not shown).
- **Fairness checks (QA):** no unavoidable death before the first bonus; popups cannot be missed; boss patterns telegraphed ≥ 0.8 s; no stacked debuffs from enemies. [RL] players complain of "unfair stacking" and "walls" — we avoid both.
- **Endless (M2 could):** after the last authored world, worlds loop with scaling continuing (no cap on bonuses means no cap on worlds).

## 10. Controls: one-handed portrait touch (proposal)

- **Portrait only**, designed on the 360×640 art canvas at ×3 (Pocket Art's decided scale).
- **Move:** floating joystick anywhere in the lower 55 % of the screen; center follows the thumb after a dead zone; max radius ≈ 56 dp; left/right-hand setting. **Alternate scheme:** *drag-to-move* — the hero steers toward the touch point relative to the thumb's first contact (setting; M1).
- **Everything else is automatic.** No attack button.
- **Popup (paused):** four cards in a 2×2 grid in the bottom 45 % of the screen, each ≥ 96 dp tall and fully tappable; "Reroll" and "Gamble" buttons directly below, ≥ 64 dp; no drag, no hold; the whole popup is within thumb reach.
- **Top of the screen:** HP bar, bonus meter, boss meter, pause. Pause sits top-right (rare action) and opens a bottom sheet with settings/stat readout/quit [RL: "no pause screen with full stats"].
- **Tap targets ≥ 48×48 dp**; text ≥ 14 sp; damage numbers capped and sized for a 5.5" screen. Haptics on bonus, reel stop, boss, optional.
- **Accessibility basics:** colorblind-safe enemy projectile color (high contrast vs player abilities), reduce-flash setting for reel/VFX, large-text option.

## 11. Monetization stance

- **Research [RL brief §5 + competitor breakdown]:** Rogue Legend is free with rewarded ads and IAP $0.99-$109.99; ad flows crash/loop, a lifetime ad-free offer follows nearly every ad, and many overlapping gachas drive "P2W" sentiment (88 % negative monetization mentions per GameBrain); its competitors show a gap for **fair, offline, pay-once** pricing.
- **Proposal (needs Thomas):** **no monetization in M0-M2.** If monetization is added: one-time price or one-time "Remove ads" + cosmetics; optional rewarded ad = extra revive only; **no paid power, no energy, no paid reel spins**.
- **Open question #3.** The data model avoids a premium currency until decided.

## 12. Milestones and prioritized scope

Priority: **Must / Should / Could.**

### M0 - Prototype ("is roaming + popups fun?") ≈ 1 week
| Pri | Feature |
|---|---|
| Must | Portrait web build; floating joystick; camera; one bounded map (placeholder tiles) |
| Must | Knight, auto-attack, Spinning Blades + Fireball Burst |
| Must | Enemy spawn director; Swarmer + Archer; ≤ 80 enemy budget |
| Must | Kill meter + `K(b,w)` formula + popup with 4 cards (ability, HP, DEF, potion) |
| Must | Boss meter → boss → gate → World 2 (same code, re-tuned numbers, recolored tileset) |
| Must | Death/results/restart; local save of totals |
| Should | Milestone reel (every 4th bonus) with simple placeholder animation |
| Could | Opt-in Gamble button + Lucky Tokens |
**Exit:** Pocket QA plays 3 runs on a phone, first bonus ≤ 10 s, no crashes, 30 fps on a mid-range phone.

### M1 - Vertical slice
| Pri | Feature |
|---|---|
| Must | 3 classes; abilities 1-8 with the level/stack rules; 5 slots; Ability Surge fallback |
| Must | Full reel (milestone + opt-in + shrines), symbol odds, triple match, consolation |
| Must | 2 authored worlds (Pocket Art tileset + 2 bosses) + World 3 in endless mode |
| Must | Lobby, class select, Talent Road trunk, gold/shards currencies |
| Must | Save/resume at any popup; first-run guided tutorial; pause screen with full stats |
| Should | Elite enemy + Charger; reroll tokens; 1 revive/run; audio (SFX, 1 loop, reel sounds) |
| Should | Headless sim + balance report; telemetry events (bonus times, death world) |
| Could | Drag-to-move alt scheme; dodge-roll; left-hand mirror |
**Exit:** 15-20 min of fun; thresholds in §5.2 match playtest; QA sign-off.

### M2 - Content-complete
| Pri | Feature |
|---|---|
| Must | 5 classes; 12 abilities + tag synergies; 5 authored worlds; ≥ 6 boss types; endless mode |
| Must | Gear (3 slots), class talent branches, difficulty tiers, accessibility pass, perf pass |
| Should | Evolutions; daily seed; achievements; monetization hooks if Thomas chooses |
| Could | Pets (as full meta), mounts, leaderboards, skins |

## 13. Recommended implementation order (Pocket Code)

1. **Engine/repo decision** first. Proposal: Phaser 4 + TypeScript + Vite in `pocket-games/code/game/` (matches `pocket-games/code/README.md`); Godot 4 only if native-store-first (Thomas).
2. **Data-driven config** for `K(b,w)` constants, enemy stats, ability tables, reel odds so Design/QA tune without code changes. **Seeded RNG** with seed in the save.
3. **Movement + camera + floating joystick on a real phone** (this alone decides feel); bounded map and collision.
4. **Entity pooling + spawn director** targeting `R_w` kills/s; budget caps (80 enemies, 150 projectiles).
5. **Auto-attack and HP/DEF/damage pipeline**; i-frames; death/restart.
6. **Kill meter + popup + the 4 cards**, pause, knock-back, resume.
7. **Ability framework from 3 building blocks** — *orbit*, *radial/aimed projectile*, *aura/area* — so Spinning Blades, Fireball Burst and most later abilities are data variants. Then level/stack rules, slots, Ability Surge.
8. **Boss meter → boss → gate → World 2**; world data table.
9. **Reel**: milestone, opt-in, shrines; odds table; triple match; consolation.
10. **Headless sim** (kill-rate model + simple enemy model, no render) to tune §5.2 and §9 numbers, then QA playtests.
11. Lobby, saves, talent tree, classes, FTUE; then content passes (enemies, bosses, abilities), then gear.

## 14. Similar games (summary; full notes in [`research/similar-games.md`](research/similar-games.md))

Sources were verified from wikis/guides this session (links in the full doc); nobody played them. **V** = page read, **S** = snippet only.

| Game | Reward popup | Escalation | Borrow | Pitfall |
|---|---|---|---|---|
| **Vampire Survivors** (V) | Pause + 3-4 weapon/passive cards; reroll/skip power-ups; boss chests give 1/3/5 upgrades with slot-machine-style spin | 5 XP, +10/level to L20, +13 to L40, +16 after; +600/+2,400 lumps at L20/L40 | Chest-spin presentation; gold/heal fallback when maxed; owned-item bias; 1 s invulnerability | Dead options when slots are full |
| **Brotato** (V) | 4 stat cards after each wave; +1 max HP per level | Tier II at L5, III at L10/15/20, IV at L25+ multiples of 5; reroll price ladder | Tiered stat cards; reroll as a currency sink | Queued level-ups = back-to-back popups |
| **Archero** (V) | 3 abilities on level-up; Angel (ability or heal), Devil (ability for max HP), Lucky Wheel after bosses | Angels at fixed rooms (5, 15, 25, 35, 45) | Ability-vs-heal choice; optional HP-for-power gamble | All-junk offers; "empty" wheel result; ad-gated spins |
| **Survivor.io** (V) | 3 skills; chests give 1/3/5; 6 active + 6 passive slots; gold when capped | Boss every 5 min in a 15-min run | Proven one-thumb mobile loop; slot cap + fallback | Hidden evolution recipes |
| **20 Minutes Till Dawn** (V) | 5 upgrade cards (4 on hard); enemies knocked back after popup; one reroll for one character | `10L−5`, `13L−6`, `16L−8`, then `L²` from L60 | Knock-back; linear→quadratic uncapped curve | 5 cards is slow on a phone |
| **Halls of Torment** (S) | Tome/Scroll/chest selection screens at fixed map spots | Level-gated trait ranks | Map-placed pickups = roam reason | Thin evidence |
| **Magic Survival** (V, unofficial) | Passive/special/active magic cards | 100 levels, then 50 "bonus levels" with weaker buffs; merchant/obelisk after boss waves; Golden Roulette artifact | Post-cap bonus levels = "no cap" precedent | Late enemy HP explosion; opaque systems |
| **Soulstone Survivors** (S) | Skill cards; banish/reroll unlocked in meta | Level-ups, 6 active slots | Meta-unlocked reroll/banish | Thin evidence |
| **Hades** (S) | 3 boons per offer | Rarity cascade L→H→E→R→C | Rarity cascade for reel odds; "level an owned thing" | Not swarm/free-roam |
| **Luck Be a Landlord** (S) | Spin, then pick 1 of 3 symbols | Rent due on a spin schedule | Exactly "spin → pick one of three" | Needs synergy depth to carry it |

**Top takeaways:** (1) pause + 1-tap + large cards; (2) uncapped, linear-then-quadratic thresholds; (3) always a fallback so "no cap" never makes a dead popup; (4) cap slots to cut clutter and choice fatigue; (5) reel = presentation of a free, run-only choice (no empties, no ad gating); (6) knock-back + short invulnerability after every popup.

## 15. Open questions for Thomas

1. **World/level meaning.** Is a *world* one map ending in a boss (our assumption), or several levels per world with a boss at the end? How long should one world feel (we assumed ~4.5 min)?
2. **Boss trigger.** OK that the boss arrives when a *boss meter* (kills) fills, versus a timer or the player walking to a boss door on the map?
3. **Reel trigger and odds.** Proposal: every 4th bonus is a free reel, plus an opt-in Gamble button costing a Lucky Token, plus map shrines. Which do you want? Should the reel ever cost HP (Archero Devil style) or can anything be bought with real money/ads (we say no)?
4. **Platform/engine and monetization.** Web-first (Phaser/TS) or native (Godot 4/Capacitor)? Free-with-ads, premium, or no monetization? (Pocket Code needs the engine call first.)
5. **Ability cap.** 5 ability slots (proposal) with level-ups beyond that — or no slot limit at all (more chaotic, harder on phones)?
6. **Death and revive.** Run ends at 0 HP, with one free revive per run — OK? Or checkpoint at each gate?
7. **Classes and meta.** Keep classes + Talent Road + gear (heavy), or ship an even simpler "pick start ability + permanent upgrades" model?
8. **Legal/IP.** Confirm we use Rogue Legend and survivor-genre games only as structural inspiration (no names, art, text), and sign off on store age-rating exposure for a gamble-style reel.
9. **Art follow-up.** Pocket Art's style guide (v1.1) still describes a 24-tile board, tile icons, side-view battle, and a lobby; it needs a revision for free-roam top-down/3-4 view (moving sprites, enemy swarms, ability VFX, popup cards, world tilesets).

## Sources
- Pocket Research: `pocket-games/rogue-legend-brief.md`, `pocket-games/research/competitor-breakdown.md`.
- Similar-games research with links: `design/research/similar-games.md`.
- Pocket Art: `pocket-games/art/style-guide.md` (v1.1, canvas 360×640, 32 px tiles, 64 px characters).
- Pocket Code: `pocket-games/code/README.md` (engine not decided; Phaser 4/TS/Vite proposed).
