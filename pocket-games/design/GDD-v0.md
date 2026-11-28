# Pocket Rogue — Game Design Doc v0

Owner: Pocket Design · Status: **first draft, needs Thomas sign-off on remaining proposals** · Last revised 2026-11-27 (US Eastern)

**Revision note.** Built around Thomas's full vision (free-roam action, on-kill bonus popups, slot-reel gamble, elemental ball/sword kit, uncapped stacking, secret portals, escalating worlds, and a hard ~50–60% win-rate target). The earlier dice-board concept is gone.

**How to read labels**
- **DECIDED** = Thomas's stated rule. Do not change without him.
- **proposal** = Pocket Design's call, *needs research/Thomas sign-off*.
- **[RL]** = `pocket-games/rogue-legend-brief.md`. **[CG]** = `pocket-games/research/crazy-gunner-pixel-survivor-brief.md`. **[SG]** = `design/research/similar-games.md`.

## 0. Thomas's decisions (the spine)

| # | Rule (DECIDED) |
|---|---|
| D1 | **Free roam** on the map: move up / down / left / right freely. Portrait mobile. |
| D2 | Every time you **kill a certain number of enemies**, a **choice popup** offers: a special ability, a health increase, a defense increase, or a minor health potion. |
| D3 | **Gamble mechanic:** a slot reel spins and lands on **three things**; the player **picks one of the three** to add to the character. |
| D4 | Bonuses can trigger **many times per level before the boss**. There is **no hard cap**: levels are paced so you get a limited number before the boss is available, but **surviving longer lets you keep stacking**. |
| D5 | Beat the boss → a **gate opens** → enter the **next world**, which works the same way. |
| D6 | **Difficulty escalates:** more monsters per world, harder bosses. |
| D7 | **Core ability set:** orbiting swords; fireballs; ice balls; toxic balls; electric balls; lightning that shoots outward and chains to nearby enemies. Each elemental ability has a matching status (ice slows, toxic DoT, electric stun/chain). |
| D8 | **Secret portals** lead to **side levels with special bonuses**. |
| D9 | The game **must be hard**. Target win rate when bots playtest is **~50–60%**. Players should **almost never** sit near a 100% win rate. Uncapped stacking must not break this. |
| Earlier | Mobile pocket roguelike; Rogue Legend is a commercial/meta reference; all team work lives in `pocket-games/`; Pocket Art owns art direction (HD-pixel, portrait, 360×640). |

Everything else in this document is **proposal**, unless marked DECIDED.

## 1. Reference game (pending identification)

Thomas's full vision comes from a **game he played when younger and cannot name**. Pocket Research is actively trying to identify it (started 2026-11-27, late evening ET). **No identification file is on `main` yet.** This section will be rewritten when that file lands.

**Clues Thomas gave Research:** (1) bonus abilities — fireballs, ice balls, toxic balls, electric balls, and lightning that shoots outward and hits nearby enemies on contact; (2) bonuses don't cap — levels are paced so you only get so many before the boss, but if you don't die you keep everything and can go well beyond; (3) every level gets harder — more monsters, harder bosses; (4) secret portals that teleport you to random side levels with special bonuses. He thinks it is a well-known, possibly older, mobile game.

**Candidates found (not confirmed):**
- **Original Archero (2019)** — Pocket Research's *strongest early guess* in its session (not yet written up). Public wikis show a close ability match: Fire / Ice / Poison / Bolt **Circles** (orbiting orbs), plus elemental effects (Blaze burn, Freeze, Poison DoT until death, Bolt lightning that hits nearby enemies) and orbiting swords. Level-up offers 3 abilities; stacks reset each run. **Gaps vs Thomas's clues:** room-to-room / small-stage structure rather than free-roam maps; **secret portals to side levels are not documented** in the sources checked; combat is stop-to-shoot, not continuous free-roam auto-fire. Sources: https://archero.fandom.com/wiki/Category:Abilities , https://dqservice.fyi/wiki/archero/en/ab-circles/ , https://dqservice.fyi/wiki/archero/en/ab-elements/ . Until Research confirms or rejects this, treat Archero element numbers below as *inspiration*, not as a locked copy.
- **Crazy Gunner: Pixel Survivor** (Ryki Studio) and **Pixel Survivor** titles — games Thomas named as close free-roam matches. Research's brief is on main: [`pocket-games/research/crazy-gunner-pixel-survivor-brief.md`](../research/crazy-gunner-pixel-survivor-brief.md). Headline: the two names may be **one game**; neither has a verified in-run slot reel or a physical "boss opens a gate" flow in published sources; they are auto-fire survivor-likes with XP-bar 1-of-3 upgrades, ~5-minute stages, and (in Crazy Gunner) menu unlocks rather than walk-through gates. Useful to copy: cheap visible rerolls, dual-branch evolutions, a readable stage/boss bar, no energy, real numbers on upgrade cards, offline rewards. Useful to avoid: forced menu-return ads, gacha chests, sudden stage-15/23 walls. Closest *reel* cousins Research found along the way (Lumen Drift, Lucky Survivors) are listed in that brief §6 — not the childhood game.
- Other names Thomas has pointed Research at (no files on `main` yet): **Archero 2**, **Pixel Defenders Merge TD**.

**What to fold in now, provisionally:** elemental status language and orbiting-orb / outward-projectile split from Archero's public ability list; Crazy Gunner's "physical gate, not a menu unlock" recommendation [CG §5 Improve]; mid-world sub-boss marker on the boss meter [CG §5 Copy]; no energy [CG]; show real numbers on cards [CG]. All of this stays proposal-level until the childhood game is named.

## 2. Pillars and core constraints

| Pillar / constraint | Meaning | Status |
|---|---|---|
| 1. One thumb, always moving | Free-roam up/down/left/right. Movement is the only required input; offense is automatic or one tap. | **DECIDED** (D1) |
| 2. On-kill bonus loop | A bonus is always a short stretch of kills away. Popup offers ability / HP / DEF / potion. | **DECIDED** (D2) |
| 3. Slot-reel gamble | A reel spins, lands on three options, player picks one. | **DECIDED** (D3) |
| 4. Uncapped stacking | Paced bonuses before the boss is *available*; lingering survivors keep stacking. No hard cap. | **DECIDED** (D4) |
| 5. Secret portals | Hidden portals to side levels with special bonuses, then a return to the main world. | **DECIDED** (D8) |
| 6. Escalating worlds | Each world: more monsters, harder bosses. Gate opens after the boss. | **DECIDED** (D5, D6) |
| 7. The game is hard | Bot-playtest win rate **~50–60%**. Almost never near 100%. Uncapped stacking must not break this (scaling counters for long survival). | **DECIDED** (D9) |
| 8. Respect time and wallet | Short, pausable runs; no paid power; no forced ads. | proposal, informed by [RL][CG] |

**Session targets (proposal):** a world takes ~4–5 minutes if the player takes the boss when it first unlocks; lingering or a portal can stretch that. A normal run is 2–3 worlds but must be **pausable/resumable at any moment**. Lobby → run → results → "again" ≤ 30 s of menu.

## 3. Character creation and class system (proposal)

- No appearance editor. Pick a **class**; optional name. Under 20 s on first launch.
- **Class = starting ability + stat tilt + one passive.** Starting abilities are always from the core six (D7).

| Class | Start ability | Stat tilt | Passive |
|---|---|---|---|
| Knight | Orbiting Swords | +HP, +DEF | Gains 1 DEF per 25 kills |
| Mage | Fireballs | +damage | Burn lasts 25 % longer |
| Ranger | Lightning | +move speed | Chain jumps +1 while moving |

- M0: 1 class (Knight). M1: 3 classes. M2: 5 (add Rogue, Cleric — data-only if the ability framework is built right).
- Draws on: [RL] "hero = passive rule rewrite"; [SG] characters each start with a different weapon.

## 4. Run structure

### 4.1 Shape (proposal unless marked)
- **Run = a sequence of Worlds** (D5). Assumption: *world == one map "level"* ending in a boss, then a **physical gate** you walk through (D5; [CG] "make the gate a physical event, not a menu unlock"). **Open question #1** if a world should contain several maps.
- **World map:** one bounded map ~3 screens tall × 2 wide (portrait), camera follows the player. Enemies spawn off-screen near the player. A few **shrines** offer a free reel spin. **Secret portals** (D8) hide off the main path — see §8.
- **Boss availability (proposal — this is how D4 "no cap" stays true):** each world has a **boss meter** filled by weighted kills (`Q_w`, see §7). When it fills: a banner, a **boss arena / door unlocks** on the map, and a mid-world **sub-boss may have already appeared at ~50% of the meter** ([CG] stage-bar markers). The player **chooses when to walk in**. Until they do, they can keep roaming, killing, and stacking bonuses; spawn pressure keeps rising (up to the cap in §9) so lingering is a risk, not a free farm. Walking in closes the arena, remaining trash despawns or is locked out, and the boss fight starts. Beat the boss → **gate opens** at the map's edge → walk through → next world.
- **Death:** run ends. Keep a share of gold; show "what killed you" and a best-world record. **One free revive per run** (restore 50 % HP, brief invulnerability). proposal.
- **Save:** auto-save at every bonus popup, at portal entry/return, and at gate entry.
- **No timer-fail:** no time limit that ends the run. Difficulty is spawn pressure and the boss, not a clock.

### 4.2 Flow
```
Lobby → pick class → World 1 map
   roam + auto-attack → kills fill bonus meter → [POPUP] → resume
   (optional: find a secret portal → side level → return)
   (optional: every 4th bonus, or spend a token, is a reel)
   boss meter fills → arena unlocks → (linger and keep stacking, or enter)
   beat boss → gate opens → World 2 (same loop, harder)
   ... death or quit → results → lobby
```

## 5. Free-roam navigation and combat model

### 5.1 Movement (D1 decided; control scheme proposal)
- 8-direction analog movement from a **floating virtual joystick** (appears where the thumb touches in the lower 55 % of the screen). Digital 4-way is a subset.
- Collision with walls/obstacles; no vertical jump. Optional **dodge-roll** button (could) — not needed for M0/M1.
- Camera: lead 30–40 % ahead of movement so the thumb never hides threats.

### 5.2 Combat (proposal)
- **Real-time, fully automatic offense.** Basic attack auto-targets the nearest enemy; abilities fire on their own cooldowns. Player skill = positioning, kiting, and picking bonuses. Matches [SG] Survivor.io / Vampire Survivors and [CG] Crazy Gunner's one-handed auto-fire.
- **Stats:** Max HP, DEF, ATK, move speed, crit %, crit DMG, cooldown. DEF → damage reduction = `DEF / (DEF + 100)`.
- **Hit rules:** contact/projectile damage with 0.4 s i-frames; **after a popup closes, nearby enemies are knocked back and the player is invulnerable for ~1 s** ([SG] Vampire Survivors, 20 Minutes Till Dawn).
- **Enemy roster (M1):** Swarmer, Archer, Charger, Elite (counts as 3 kills; may reveal a portal or drop a reel token), Boss (one readable mechanic).
- **Pacing targets (proposal, subordinate to D9):** a normal enemy dies in 1–3 s of one ability at *expected* power for that world; elite 8–12 s; boss 45–75 s. These are feel targets; if they fight the 50–60% win-rate, win-rate wins.
- **Performance budget:** ≤ 80 live enemies, ≤ 150 projectiles, pooled objects, 60 fps target on a mid-range phone. [CG] store copy claims 1,000+ on screen; we do not chase that on a phone.

## 6. The bonus system

### 6.1 Kill meter and popup (D2 decided; details proposal)
- A **bonus meter** at the top of the screen fills with kills. Weighted kills: normal = 1, elite = 3, boss minions = 0 (so summons can't be farmed).
- When it fills: **game pauses** and a 2×2 popup appears in the lower half:

| Card | Effect (proposal numbers) |
|---|---|
| **Ability** | A rolled core ability (or a level-up of one you own). See §7. |
| **+Max HP** | +8 % of class base Max HP (also heals that amount). Tiered ×1 / ×1.5 / ×2 on bonuses 5, 10, 15… [SG Brotato] |
| **+DEF** | +4 DEF (diminishing). Tiered the same way. |
| **Minor potion** | Heal 25 % Max HP *now*. Grayed-out if HP ≥ 90 %. |

- Cards show **real numbers** ([CG] "actual data on upgrades"). One tap resolves; target decision time ≤ 3 s median.
- **Reroll** the Ability card: 1 token; start with 1; meta adds more. ([CG] Crazy Gunner uses 2 free rerolls — we stay tighter because D9 requires the game stay hard.)
- **"No cap" safeguard:** if every owned ability is maxed and slots are full, the Ability card becomes **Ability Surge**: +6 % damage to all abilities (stacking, *diminishing after +60 %*). The popup never goes dead ([SG] Vampire Survivors gold/chicken fallback). Surge is deliberately soft so lingering cannot snowball past D9.

### 6.2 Escalation formula (D4 decided; the formula is proposal)
Let `b` = bonuses already taken **in the current world** (starts at 0), `w` = world number (1-based).

```
K(b, w) = ceil( (8 + 3·b + 0.2·b²) × (1 + 0.4·(w − 1)) )     weighted kills needed for the next bonus
```

This is a **pacing curve, not a cap**. There is no upper limit on `b` (D4). If the player lingers after the boss arena unlocks, bonuses keep coming, just further apart. Later worlds also stretch the gaps.

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

Target kill rate `R_w = 1.2 × (1 + 0.15·(w − 1))` weighted kills/s. Boss-arena unlock meter `Q_w = round(270 · R_w, -1)` (~270 s of play if taken at first unlock).

| World | R (kills/s) | Unlock Q | Bonuses by first unlock | 1st gap | last gap before unlock |
|---|---|---|---|---|---|
| 1 | 1.20 | 320 | 10 | ~7 s | ~43 s |
| 2 | 1.38 | 370 | 9 | ~9 s | ~46 s |
| 3 | 1.56 | 420 | 9 | ~10 s | ~52 s |
| 4 | 1.74 | 470 | 8 | ~10 s | ~49 s |
| 5 | 1.92 | 520 | 8 | ~11 s | ~53 s |

(Computed from the formula, not from a playtest.) First bonus in ~7 s (hook); later gaps stretch to ~45–55 s. **Anti-stall pity (proposal):** if no bonus in 75 s, the meter jumps by 20 %. Tunables live in a data file.

### 6.3 Reel triggers (D3 decided; triggers proposal)
1. **Milestone reel (free):** every 4th bonus (`b % 4 == 3`) the popup *is* the reel. A "Safe pick" button still opens the normal 4 cards — never forced into gambling.
2. **Opt-in Gamble button** on every normal popup: costs **1 Lucky Token** (start with 1; +1 per elite; +1 per boss; meta upgrades).
3. **Shrines** on the map (1–2 per world): walk in for a free reel.
4. **Portal rewards** may also be a reel (see §8).

### 6.4 Reel mechanics (D3 decided; the rest proposal)
- Three reels spin ~1.2 s. Player **picks one of the three** (D3).
- **Symbol odds (proposal; these are a D9 tuning lever):**

| Symbol tier | Odds | What it is |
|---|---|---|
| Common | 45 % | Same value as a normal popup card. |
| Rare | 35 % | 2× stat card, or a new ability at Lv 2, or +1 reroll. |
| Epic | 15 % | A new ability at Lv 3, or 3× stat card, or a full heal + max HP. |
| Jackpot | 5 % | A mastered-tier ability effect, or "Double Slot" (take **two** picks). |

- **Triple match** (all three show the same item): receive **all three**. Rare by design; tunable.
- **Never empty:** if all three are Common, still pick the best, plus a consolation minor potion. No ad-gated spins, no real money ([RL] loot-box flags; [CG] "deliver the in-run reel" without gacha).
- Best-of-three expected value should sit *near* a normal card, not strictly above it — otherwise the reel inflates win rate past D9.

## 7. Special abilities (D7 decided; numbers and stacking proposal)

**Core six (DECIDED).** These are the game. Delivery for the four "balls" is **shot outward** like fireballs (proposal — matches Thomas's earlier "fireballs shooting outward"; Archero instead uses *orbiting* elemental circles, which we may offer as a mastery or dual-branch later). Lightning is a chain bolt, not a ball. Swords orbit.

**Slots (proposal):** 5 ability slots. New abilities appear only while a slot is free; otherwise cards level existing ones. Max level 8. Slot cap also protects D9 and phone clutter ([SG]).

**Stacking (proposal):** each pick of an owned ability = +1 level. Damage `× (1 + 0.25·(L − 1))`; cooldown `× 0.95^(L − 1)`. Odd levels add **count**; even levels add **size/damage**. Level 8 = Mastery. **Dual-branch evolution (proposal, from [CG]):** at L8 the card offers two mutually exclusive masteries (e.g. Orbiting Swords → *Wide Halo* vs *Fast Blades*).

**Element behaviors (DECIDED in kind; numbers proposal, provisionally in the Archero range until the childhood game is identified):**
- **Fire (Burn):** 18 % ATK every 0.25 s for 2 s; refreshes on re-hit.
- **Ice (Slow):** 30 % move-speed slow for 2 s; L5+ also a 0.6 s freeze. Re-hits refresh slow, not freeze, so bosses don't stay locked.
- **Toxic (DoT):** 20 % ATK per second for 6 s; refreshes. Mastery: spreads to a nearby enemy once.
- **Electric (Stun):** 0.4 s stun on hit, with a 2 s immunity on that enemy so stunlock is impossible.
- **Lightning (Chain):** jumps to nearby enemies on contact; 3 jumps at L1 (100 % / 70 % / 50 % damage). Stun is *not* automatic — that stays on Electric Balls — unless a mastery adds a short shock.

| # | Ability | L1 behavior | Scaling highlights | Mastery (L8) — pick one (proposal) | Tags |
|---|---|---|---|---|---|
| 1 | **Orbiting Swords** | 2 swords orbit the hero | +1 sword at L3, L5, L7; wider orbit at even levels | *Wide Halo* (big slow orbit) or *Fast Blades* (tight, faster) | Orbit |
| 2 | **Fireballs** | 3 fireballs shot outward in a fan every 2.5 s; apply Burn | +2 balls at L3, L5, L7 | *Split on hit* or *Burn pool* | Projectile, Fire |
| 3 | **Ice Balls** | 3 ice balls shot outward; apply Slow | same count curve | *Shatter* (AoE on expire) or *Deep Freeze* (longer slow) | Projectile, Ice |
| 4 | **Toxic Balls** | 3 toxic balls shot outward; apply Toxic DoT | same count curve | *Spread* or *Lingering cloud* | Projectile, Toxic |
| 5 | **Electric Balls** | 3 electric balls shot outward; apply Stun | same count curve | *Static field* or *Overcharge* (extra ball) | Projectile, Electric |
| 6 | **Lightning** | Bolt shoots outward and chains to 3 nearby enemies | +1 jump at L3, L5, L7 | *Forked storm* (two initial bolts) or *Shock chain* (brief shock) | Projectile, Electric |

- M0 ships Orbiting Swords, Fireballs, and Lightning (covers orbit, projectile, and chain). M1 ships all six. Meta can unlock later abilities into the pool so early runs see a smaller set.

**Extras (proposal only — not in the core set):** Guardian Shield (absorb 1 hit / 8 s); Spirit Wolf (a pet). Do not ship in M0/M1 unless Thomas asks.

## 8. Secret portals and side levels (D8 decided; details proposal)

**Discovery**
- Each world has a **chance to hide exactly one portal** (Worlds 1–3: 60 %; Worlds 4+: 80 %, or a second portal at 25 %). Never in the first 45 s.
- Placement: off the main path — a cracked wall, an alcove, a faint shimmer only visible within ~1.5 screens. Elites have a small chance (5 %) to leave a short-lived portal tear at their death position instead of a hidden spawn.
- No map icon until the player is close. A soft chime plays when a portal is within ~1 screen. Never required to clear the world.

**Side-level types** (rolled when the player steps in; each is a short instanced map, ~30–60 s):

| Type | What happens | Special bonus |
|---|---|---|
| Treasure Vault | Light or no combat | One guaranteed Rare/Epic reel (pick 1 of 3) |
| Element Shrine | No combat; pick 1 of 3 elements | That element is empowered for the rest of the *run* (+25 % damage / stronger status) |
| Elite Gauntlet | A short hard fight (elite pack or mini-boss) | Jackpot-tier reel on a win; a potion + small HP if you barely survive |
| Rest Grove | No combat | Full heal, +max HP, and one "stocked" potion (auto-used at 25 % HP later) |
| Bonus Rush | Dense but weaker enemies; bonus meter fills at 2× for 40 s | Extra normal bonuses (still using `K(b,w)`), then a return gate |

**Return**
- A **return gate** appears after the objective, or after 60 s, whichever comes first. The player walks through and is dropped back at the portal site (or a nearby safe tile) with 1.5 s invulnerability.
- The **main world is paused** while inside (boss meter, spawns, world timer). Side levels do not replace the world boss and do not consume the boss arena.
- The portal is **consumed** (cannot re-enter). Max one use per portal.

**Fairness vs D9:** portal bonuses are strong but brief and optional. The headless sim must include a "portal-finder" bot type and still land in the 50–60 % band. If portal-finders break 70 %, nerf portal rewards, not discovery.

## 9. Difficulty curve (D6 decided; numbers proposal)

**Per-world scaling table** (proposal — subordinate to the §11 win-rate rule):

| World | On-screen swarm (start → late) | Enemy HP × | Enemy ATK × | Kill-rate target R | Boss HP (× a World-1 normal) | Boss mechanic (readable, ≥ 0.8 s telegraph) |
|---|---|---|---|---|---|---|
| 1 | 12 → 40 | 1.00 | 1.00 | 1.20 | ×25 | Enrage at 50 % (faster attacks) |
| 2 | 16 → 50 | 1.50 | 1.25 | 1.38 | ×40 | Spawns two adds at 50 % |
| 3 | 20 → 60 | 2.25 | 1.56 | 1.56 | ×60 | Pattern + adds |
| 4 | 24 → 70 | 3.40 | 1.95 | 1.74 | ×90 | Two-phase (pattern change at 50 %) |
| 5 | 28 → 80 (cap) | 5.00 | 2.44 | 1.92 | ×135 | Two-phase + enrage |

- Inside a world, trash HP also scales gently with bonuses taken (`× 1.08` per bonus after the 4th, proposal) so lingering does not make later trash trivial.
- **Soft walls, not hard walls:** if the last 3 runs all ended before the first boss, hidden +10 % HP and +1 reroll for the next run (pity, not shown). [CG] stage 15/23 spikes are the complaint to avoid; [RL] same "walls" warning.
- **Endless (M2 could):** after the last authored world, worlds loop with this table continuing (`HP ×` and `ATK ×` keep stepping). No cap on bonuses or worlds; see §11.3 so this cannot inflate win rate to 100 %.

## 10. Loot, meta, and controls (proposal unless noted)

**Loot layers:** (1) run bonuses from §6–§7, reset each run; (2) run drops — coins, elite reel tokens, rare floor potions; (3) permanent gear from M1/M2 (Weapon + Armor in M1, +Trinket in M2). One gear decision per results screen; "Auto equip best". Currencies: Gold, Soul Shards, Scrap. No premium currency in M0–M2.

**Talent Road:** a vertical tree spent with Soul Shards. Trunk: start HP/DEF/ATK/speed, +1 reroll, +1 Lucky Token, starting gold, bonus meter −2 % kills per node (**max −20 %** — a D9 lever: do not let this erase escalation). Rule: **≤ 30 % of total power from meta**, so a good run still dies when it should. First 5 minutes of total play should unlock ≥ 3 visible upgrades [RL].

**Controls:** portrait only, 360×640 art canvas at ×3 (Pocket Art, decided). Floating joystick in the lower 55 %. Everything else automatic. Popup is a 2×2 of ≥ 96 dp cards in the bottom 45 %, with Reroll / Gamble below at ≥ 64 dp. Pause top-right opens a bottom sheet with a full stat readout [RL]. Tap targets ≥ 48 dp; text ≥ 14 sp. Left-hand mirror (should). Colorblind-safe projectiles; reduce-flash for the reel.

**Monetization (proposal, needs Thomas):** no monetization in M0–M2. If added later: one-time price or one-time Remove Ads + cosmetics; optional rewarded ad = extra revive only; **no paid power, no energy, no paid reel spins**. [RL][CG] both warn hard against gacha and forced ads.

## 11. Balance and tuning — the game must be hard (D9)

### 11.1 What "win" means (proposal)
Report **both**, and tune primarily against (A):

| Metric | Definition | Target |
|---|---|---|
| **(A) Run clear** | A *win* = the bot/player **clears the authored run** — beats the final authored world's boss and walks the last gate (M0: World 2 boss; M1: World 3 in the vertical-slice length; M2: World 5). Death, quit, or a stuck-timeout is a loss. A linger-then-clear still counts as a win. | **50–60 %** of playtest runs |
| **(B) Per-world clear** | Share of visits to world `w` that beat that world's boss. Expected to start higher in World 1 and fall in later worlds. | World 1 ≈ 70–80 %; final authored world ≈ 35–45 %; the *product* should land (A) in 50–60 % |

Players should **almost never** sit near 100 % on (A), including on a "good" account with meta unlocked. If a human playtester or a perfect-information bot clears 9+ of 10 authored runs, the build is too easy.

### 11.2 How bot playtests measure it (proposal)
- **Headless run simulator** (Pocket Code, required from M1; a thin version in M0): no renderer; same combat, spawn, bonus, reel, portal, and boss rules as the game; seeded RNG; outputs win/loss, death world, bonuses taken, linger time, portal use, and a combat log.
- **Sample size:** ≥ **200 seeded runs per build** before a balance sign-off, ≥ 50 after a small tune. 95 % CI on a 55 % rate at n=200 is roughly ±7 points — enough to tell 50–60 from 80+.
- **Bot types** (mix, equal share unless noted), owned with Pocket QA and any "Pip" / simulated-player harness already in Thomas's tooling:
  1. **Greedy** — always takes an ability (or a level-up), never HP/DEF/potion unless dying this second.
  2. **Survivor** — prefers potion / HP / DEF when below 60 % HP.
  3. **Gambler** — always spends Lucky Tokens and takes milestone reels (never Safe pick).
  4. **Portal-finder** — paths toward portals when one exists; otherwise Greedy.
  5. **Lingerer** — after the boss arena unlocks, farms ~30–60 s (or +2 bonuses) before entering.
  6. **Random** — uniform among legal cards.
- **Human check:** Pocket QA plays a smaller set (10–20 runs) on a phone each milestone. Bots set the 50–60 % band; humans catch "unfair" and "boring" the sim cannot see.
- Each report prints: (A) and (B) overall and per bot type; mean bonuses per world; mean linger time; portal-finder vs others; meta-level 0 vs a "mid account".

### 11.3 Uncapped stacking must not break D9
Lingering and portal bonuses will raise power. Counters (proposal, all data-driven):
- Trash HP/ATK keep stepping with bonuses taken inside the world (§9).
- After the boss arena unlocks, **Frenzy**: spawn rate +15 % and on-screen cap +10, stacked once, so lingering is riskier, not safer.
- Boss HP/ATK scale with bonuses taken *past the unlock point* (proposal: +8 % boss HP per bonus after unlock) so a lingerer does not one-shot the boss.
- Ability Surge and stat cards use diminishing returns (§6.1).
- Portal rewards are strong but one-shot and paused-world (§8).
- If lingerer or portal-finder win rate is >10 points above the mix, tighten those counters first, not the base curve.

### 11.4 Tuning rule (proposal)
After each sim report, adjust **one primary lever at a time**, re-run n≥50, then confirm at n≥200:

| Observed run-clear (A) | Action |
|---|---|
| **> 60 %** (too easy) | Tighten. Preferred order: raise trash ATK or density, then boss HP/damage, then slow bonuses (`K` constants up), then nerf reel odds (cut Jackpot/Epic). |
| **50–60 %** | Hold. Only change if a *bot type* is an outlier (e.g. Gambler at 85 %) or humans report unfair deaths. |
| **< 50 %** (too hard) | Loosen. Preferred order: lower trash ATK, then boss damage, then lower `K` or raise starting rerolls, then buff potion/HP cards. Do not loosen so far that (A) will clearly overshoot 60 %. |
| **≥ 80 %** or a mid-account bot near **100 %** | Emergency tighten: density + boss damage together; also inspect meta nodes (the −% kill-cost talent may be too strong). Ship nothing in this state. |

Levers, all in data files (never hardcoded): `K(b,w)` constants; `R_w` / `Q_w`; on-screen density and HP/ATK multipliers (§9 table); boss HP and damage; Frenzy and post-unlock boss scaling; reel tier odds; potion/HP/DEF card sizes; starting rerolls/tokens; Talent Road caps.

## 12. Milestones

Priority: **Must / Should / Could.**

### M0 — Prototype ("is roaming + popups fun, and is it already hard?")
| Pri | Feature |
|---|---|
| Must | Portrait web build; floating joystick; camera; one bounded map |
| Must | Knight; auto-attack; Orbiting Swords, Fireballs, Lightning |
| Must | Spawn director; Swarmer + Archer; ≤ 80 enemy budget |
| Must | Kill meter + `K(b,w)` + 4-card popup; Ability Surge fallback |
| Must | Boss meter → arena unlock → boss → gate → World 2 (same code, retuned, recolored tileset). Lingering allowed after unlock. |
| Must | Death / results / restart; local save of totals |
| Should | Milestone reel (every 4th bonus) with placeholder animation; thin headless sim that reports run-clear win rate on ≥ 50 seeds |
| Could | Opt-in Gamble button; one portal type (Treasure Vault) as a stub |
**Exit:** Pocket QA plays 3 runs on a phone, first bonus ≤ 10 s, no crashes, 30 fps on a mid phone. Sim (if present) is not yet held to 50–60 %, but a rate near 100 % is a fail.

### M1 — Vertical slice
| Pri | Feature |
|---|---|
| Must | 3 classes; all 6 core abilities with level/stack rules; 5 slots |
| Must | Full reel (milestone + opt-in + shrines), symbol odds, triple match, consolation |
| Must | **Secret portals:** discovery rules + at least Treasure Vault and one combat side level (Elite Gauntlet); return gate; main world paused |
| Must | 2 authored worlds + World 3 in a short endless/third-world mode; mid-world sub-boss marker |
| Must | Lobby, class select, Talent Road trunk, currencies |
| Must | Save/resume at popups and portals; first-run tutorial; pause screen with full stats |
| Must | **Headless sim:** all 6 bot types, n≥200, reports (A) and (B); mix in the 50–60 % band |
| Should | Elite + Charger; reroll tokens; 1 revive/run; audio; Frenzy-on-linger |
| Could | Drag-to-move alt scheme; remaining portal types; dual-branch mastery |
**Exit:** 15–20 min of fun; D9 band held in sim; QA sign-off on a phone.

### M2 — Content-complete
| Pri | Feature |
|---|---|
| Must | 5 classes; all portal types; 5 authored worlds; ≥ 6 boss types; endless mode with scaling counters |
| Must | Gear (3 slots), class talent branches, difficulty tiers, accessibility and perf passes |
| Must | D9 held for mid-account bots as well as fresh accounts; no bot type near 100 % |
| Should | Dual-branch evolutions; daily seed; achievements; monetization hooks if Thomas chooses |
| Could | Guardian Shield / Spirit Wolf; leaderboards; skins |

## 13. Recommended implementation order (Pocket Code)

1. **Engine/repo decision** first. Proposal: Phaser 4 + TypeScript + Vite in `pocket-games/code/game/` (matches `pocket-games/code/README.md`); Godot 4 only if native-store-first.
2. **Data-driven config** for `K(b,w)`, enemy and boss tables, ability tables, reel odds, portal tables, and every §11 lever. **Seeded RNG** with the seed in the save.
3. **Movement + camera + floating joystick on a real phone**; bounded map and collision.
4. **Entity pooling + spawn director** targeting `R_w`; budget caps (80 enemies, 150 projectiles).
5. **Auto-attack and HP/DEF/damage pipeline**; i-frames; death/restart.
6. **Kill meter + popup + the 4 cards**; pause, knock-back, resume.
7. **Ability framework from 3 building blocks** — *orbit*, *outward projectile* (all four balls), *chain lightning* — so the core six are data variants. Then level/stack rules, slots, Ability Surge, element statuses.
8. **Boss meter → arena unlock (linger allowed) → boss → gate → World 2**; Frenzy and post-unlock boss scaling.
9. **Reel**: milestone, opt-in, shrines; odds table; triple match; consolation.
10. **Headless sim early, and keep it current.** Thin version as soon as combat + bonuses exist (M0 should). By M1 it reports run-clear (A) and per-world (B) win rates per bot type on ≥ 200 seeds, and flags any result outside 50–60 % or any type near 100 %. Pocket QA / Pip bot types hook the same harness. **Tune to D9 before adding content that hides the problem.**
11. **Secret portals:** discovery, one side-level type, return, then the rest of the types. Include a portal-finder bot in the sim the same day.
12. Lobby, saves, talent tree, classes, FTUE; then content passes (worlds, bosses), then gear.

## 14. Similar games (summary; full notes in [`research/similar-games.md`](research/similar-games.md))

A longer comparison of Vampire Survivors, Brotato, Archero, Survivor.io, 20 Minutes Till Dawn, Halls of Torment, Magic Survival, Soulstone Survivors, Hades, and Luck Be a Landlord lives in that file. Thomas also asked Research for Crazy Gunner, Pixel Survivor, Archero 2, and Pixel Defenders Merge TD; only the first two are written up so far, in [`../../research/crazy-gunner-pixel-survivor-brief.md`](../research/crazy-gunner-pixel-survivor-brief.md).

**Top takeaways still in force:** pause + 1-tap + large cards; uncapped linear-then-quadratic thresholds; a fallback so "no cap" never makes a dead popup; slot caps against clutter; reel is a free run-only choice (no empties, no ad gating); knock-back after every popup; physical gates rather than menu unlocks [CG]; dual-branch evolutions as a later identity choice [CG].

## 15. Open questions for Thomas

Answered in this revision and **removed:** the core ability list; uncapped stacking (paced before the boss, linger to keep going); escalating monster counts and harder bosses; secret portals as a feature; the 50–60 % hard-game target.

Still open:

1. **World shape.** Is a *world* one map ending in a boss (our assumption), or several maps per world? How long should one world feel (~4.5 min if you take the boss at first unlock)?
2. **Boss entry.** Proposal: the boss *arena unlocks* when a kill meter fills, and the player chooses when to walk in so lingering (D4) is possible. Confirm, or prefer a timer, a forced spawn, or a door that is always on the map.
3. **Reel triggers.** Proposal: every 4th bonus is a free reel, plus an opt-in Gamble button (Lucky Token), plus map shrines. Which mix? Confirm no HP cost, no ad-gated or paid spins.
4. **Platform / engine and monetization.** Web-first (Phaser/TS) or native (Godot 4 / Capacitor)? Free-with-ads, premium, or none? Pocket Code needs the engine call first.
5. **Ability slot cap.** 5 slots (proposal) vs no slot limit.
6. **Death and revive.** Run ends at 0 HP, one free revive per run — OK? Or a checkpoint at each gate?
7. **Win-rate measurement.** Confirm "win" = clearing the authored run (metric A), with per-world rates reported alongside, and the 50–60 % band measured on a mixed bot suite plus a human spot-check.
8. **Legal / IP.** Confirm Rogue Legend, Archero, and the survivor-likes are structural inspiration only (no names, art, or text), and sign off on store age-rating exposure for a gamble-style reel.
9. **Art follow-up.** Pocket Art's style guide v1.1 still describes a 24-tile board, tile icons, and a side-view battle. It needs a free-roam revision (moving sprites, swarms, ability VFX, popup cards, portals, world tilesets).
10. **Childhood reference.** When Research names the game, should we realign any of the above (especially portals, ball delivery, and linger-vs-timer) to match it closely?

## Sources
- Pocket Research: `pocket-games/rogue-legend-brief.md`, `pocket-games/research/competitor-breakdown.md`, `pocket-games/research/crazy-gunner-pixel-survivor-brief.md`. Childhood-game identification: **not yet on main**.
- Similar-games research: [`research/similar-games.md`](research/similar-games.md).
- Pocket Art: `pocket-games/art/style-guide.md` (v1.1).
- Pocket Code: `pocket-games/code/README.md`.
- Archero ability/element pages (candidate only): https://archero.fandom.com/wiki/Category:Abilities · https://dqservice.fyi/wiki/archero/en/ab-circles/ · https://dqservice.fyi/wiki/archero/en/ab-elements/
