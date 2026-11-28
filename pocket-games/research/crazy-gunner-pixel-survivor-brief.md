# Crazy Gunner & Pixel Survivor — Reference Brief for *Pocket Rogue*

**Prepared:** Fri Nov 27, 2026 (US Eastern) · **For:** Pocket Design, Pocket Code, Pocket Art, Pocket QA · **Requested by:** Thomas Ennis
**Companion docs:** `pocket-games/rogue-legend-brief.md`, `pocket-games/design/GDD-v0.md` (the free-roam + popup + reel design this brief is compared against).

> **How to read this brief.** Every claim is tagged with a source key (list at the bottom) and a confidence mark:
> **[V]** read directly on a store page or official page · **[3P]** third-party guide/tracker/site · **[R]** a player review (anecdote) · **[U]** *unverified or not found*.
> **Nobody on this pass played either game.** I could not watch the YouTube videos either: YouTube returned "429 / sign in to confirm you're not a bot" to the box, so I used only video *titles, channels, durations and view counts* from search results. I did not use cookies or other workarounds. Section 5 is therefore a reading of store copy, guides and reviews, not hands-on play.

---

## 0. Headline findings (read this first)

1. **Neither game, as far as public sources show, has a slot-reel gamble or a "boss opens a gate to the next world" structure.** I found no mention of a slot/reel/roulette in any store listing, guide, review or Reddit post for Crazy Gunner, and none for any "Pixel Survivor" I could identify. Both are **auto-fire survivor-likes** (Vampire Survivors family). This is an *absence of evidence from text sources*, not proof, because I could not play or watch them. **Thomas should check the exact game he has in mind** (see §1, "title confusion").
2. **"Crazy Gunner" and "Pixel Survivor" may be the same game.** The Google Play and App Store title is literally **"Crazy Gunner: Pixel Survivor"** (Ryki Studio). If Thomas heard of two games from one title, that would explain why only one clean match exists.
3. **Crazy Gunner is the stronger reference** for UI/pacing: 5-minute stages, a stage bar with a mid-stage sub-boss and a final boss, level-up choose-1-of-3 with 2 free rerolls, branching "dual-evolution" skills. It is a **cautionary tale on monetization** (99% of monetization-related reviews on GameBrain are negative; forced ads; gacha chests with a 50-pull pity).
4. **The "Pixel Survivor" I picked (Pixel Survivor: Rogue RPG, KleinGameStudio)** is a tiny, brand-new Android listing (created 22 Jul 2026, no visible rating). Only its store copy exists, so it is a thin reference. Its copy confirms **swipe-to-move, auto-attack, XP-gem level-ups with random skills, weapon+passive evolutions, offline play, gold-for-talents meta**, but nothing about reels or gates.
5. **Closest actual slot-reel references found along the way** (not what Thomas named, but they do the thing): **Lumen Drift** (three reels on *every* level-up), **Lucky Survivors** (slot-machine level-ups), **Slot Survivor / Slot & Brave / RogueSlot** (slot-driven roguelikes). See §6. Worth forwarding to the similar-games brief owner.

---

## 1. Which games are these? (identification and ambiguity)

### 1a. "Crazy Gunner" → **Crazy Gunner: Pixel Survivor** (chosen)

| Item | Value | Src |
|---|---|---|
| Current store title | **Crazy Gunner: Pixel Survivor** (Play and App Store). Cached/other titles seen: "Crazy Gunner: Co-op Survivor" (AppBrain/Similarweb snapshots, 2–13 Nov), "Crazy Gunner: Monster Mowing" (Jan–Jun 2026 posts, v1.3.3) | [P1] [A1] [T-AppBrain] [T-SW] [T-iOSGods] |
| Developer / publisher | **Ryki Studio** (Play); iOS seller **LEGUAS INTREPIDAS UNIPESSOAL LDA** | [P1] [A1] [W-Ryki] |
| Google Play ID | `com.leguas.gunstorm` (a forum post mentions `com.leguas.guns` for the old "Monster Mowing" name; that URL now 404s, treat as an old/removed ID) | [P1] [T-iOSGods] |
| App Store | `id6757685841`, Free + IAP, iPhone/iPad, iOS 15+, **175.6 MB** | [A1] |
| Release | Android **10–11 Jan 2026**; iOS **~1 Mar 2026** (Japanese guide); Play "available since January 2026" | [T-AppBrain] [T-Skich] [3P-JP] |
| Platforms | Android, iOS (no PC/Steam version found) | [P1] [A1] |

**Why this one:** it is a pixel auto-fire shooter with free movement, level-up choices and boss stages, and it is literally the only listing named both "Crazy Gunner" and "Pixel Survivor".
**Alternates considered:** *Crazy Gunner: Monster Mowing* is the **same app under its earlier name** (same developer, same package family), not a separate game. I found **no unrelated mobile or Steam game titled "Crazy Gunner"**; there may be some I could not surface (**[U]**).

### 1b. "Pixel Survivor" → **Pixel Survivor: Rogue RPG** (chosen, low confidence)

| Item | Value | Src |
|---|---|---|
| Title | **Pixel Survivor: Rogue RPG** ("Swipe to mow down endless monsters! Evolve your weapons in this pixel roguelite.") | [P2] |
| Developer | **KleinGameStudio** (China-based publisher, 17 live Android apps incl. sibling *Doge Survivor: Roguelike*; "publishing since 2026") | [P2] [T-CS] |
| Google Play ID | `com.slime.xxg` · "Contains ads · In-app purchases" · rated *Everyone* | [P2] |
| Dates | Created **22 Jul 2026**; last updated **21 Sep 2026** | [P2] [T-CS] |
| Rating / installs | **Not shown / not found** (no rating on the listing; tracker rank ≈ #3.39M overall) | [P2] [T-CS] |
| Platforms | Android only found | [P2] |

**Why this one:** it is the Google Play listing whose *exact* title is "Pixel Survivor", it is mobile, free-move, auto-attack, with XP level-ups, evolutions, heroes, "multiple dark dungeons" and bosses, so it matches the genre of Thomas's description. **Confidence it is "the" game Thomas means: low.**

**Ambiguous alternates (ranked by plausibility; all are "Pixel Survivor(s)" but different games):**

| # | Game | Developer / platform | Why I did *not* pick it as primary | Src |
|---|---|---|---|---|
| A | **Pixel Survivor** (browser, also in the CrazyGames app on iOS/Android) | "William"; released **31 Aug 2026**, updated **8 Sep 2026**; **9.5 / 1,232 votes (1.2K up, 66 down)**; landscape; WASD; "attacks are automatic"; text says "**bosses across unique worlds**" | The only one whose blurb says **worlds + bosses** (closest to the "next world" idea), but it is a browser game with no further public detail (no reels/gates documented). Best candidate to *play for 5 minutes* to settle the question. | [W-CG] [T-OP] |
| B | **Pixel Survivors: Roguelike** (plural) | Amrita; **Steam** (Feb 24 2023 full, EA Jun 30 2022), also TapTap/itch; **78% positive of 375 reviews**; "only two maps", many bosses; luck stat drives XP/chests; endless play past final boss | PC-first VS clone, not a mobile "world/gate" game. Useful as a **no-cap scaling** reference (§4.2). | [S1] [R-MissiAH] [R-SteamRev] |
| C | **Pixel Survivor** (iOS) | Gigantic Games, Dec 2022; **removed from App Store 14 Mar 2026**; 1 rating (2.0) | Description (shoot environment → pixels → XP bar → skill offers → "Pixel Boss") matches the genre, but it is gone. | [T-AppBrain-iOS] |
| D | **Pixel Survivor** (Roblox) | Sunset Community Studio: 20 hunters, 27 weapons, 15 relics, **12 hunting grounds, five bosses**, 71 achievements, 50-tier pass | Roblox, multiplayer, not mobile-native design. | [W-Roblox] |
| E | itch.io: **Pixel Survivor** by *Tef* (colour-shift shooter; boss at 41 points then every 60, 5 hits), by *cugg* (6 classes, HTML5), IndieDB "Pixel Survivor" (2015 survival platformer, abandoned) | various | Different games sharing the name. | [W-itch1] [W-itch2] [W-IndieDB] |
| F | Other titles containing the phrase: *Devil Circuit: Pixel Survivor* (Huaa, 1,000+), *Grimoire Run: Pixel Survivor* (iOS), *Dungeon Pixel Survivor* (iOS), *CURSED ARSENAL: Pixel Survivor* (iOS, 2.99 €) | various | Seen only as store-search hits; not researched. | [T-AppBrain-search] [A-search] |

> **Recommendation:** ask Thomas for a screenshot or store link. Until then, treat **Crazy Gunner: Pixel Survivor** as the real reference and "Pixel Survivor: Rogue RPG" as a *genre-typical* placeholder.

---

## 2. Crazy Gunner: Pixel Survivor — deep dive

### 2.1 Store snapshot (live on 27 Nov 2026 unless noted)

| Item | Value | Src |
|---|---|---|
| Google Play rating | **4.4–4.5★** (Play pages: 4.5 on the AU page, 4.4 on the US page; AppBrain 4.37 from **13,748 ratings**; ~14.1K reviews) | [P1] [T-AppBrain] |
| Play installs | **100K+** band on Play; AppBrain models **~490K installs**, **~38K in last 30 days**, ~1.3K/day; best chart rank #151 Top Grossing Action (Iran only) | [P1] [T-AppBrain] |
| App Store rating | **4.5 (620 ratings, US)**; 4.7 (1,393 ratings, Taiwan store) | [A1] [A-TW] |
| Age rating | Play: **Teen**; App Store: **13+**, flagged "Frequent Cartoon or Fantasy Violence, Guns, **Contains Loot Boxes**, Advertising" | [P1] [A1] |
| Size | Android **86.8 MB** (1.5.5) · iOS **175.6 MB** | [T-AppBrain] [A1] |
| IAP (iOS US) | **$1.99 – $14.99**: Small Diamond $1.99 · Large Diamond $12.99 · No Ads Lite $4.99 · **No Ads $14.99** · Premium Pass $9.99 · Toxic Festival Weapon Pass $7.99 · Weapon Upgrade Pack $2.99 · Hero Upgrade Pack $2.99 · Unlock gun "Energy Gun" $3.99 · Unlock gun "Blood Lord" $3.99. (Japan store also lists a 30-day VIP.) I could not isolate the Play-side IAP list (the Play HTML mixes in prices from other apps), so treat the iOS list as the reference. | [A1] [3P-JP] |
| Update history (Play, per AppBrain) | **1.5.5 – 23 Nov** · 1.5.4 – 10 Nov (AppBrain also logs 1.5.4 on 6 and 7 Nov) · **1.5.3 – 2 Nov** · iOS **1.5.2 – 1 Nov** = "biggest update yet": **real-time co-op "Multiplayer Trials" (unlock at Level 20), chat, "call for backup" on Hard/Nightmare**. ~5 updates in 3 weeks. Earlier: v1.4.6 on 24 Apr; v1.3.3 in June | [T-AppBrain] [A1] [T-APKPure-host] [T-iOSGods] |
| Cadence of rewards | Play listing banner: "Update available. Multiplayer is here!" | [P1] |
| Connectivity | "Solo mode playable offline" (App Store); but a Play reviewer says **rewards and quest rewards can't be collected until online** | [A1] [R-AppBrain] |
| Community | r/CrazyGunnerPixel, created 8 Apr 2026, a handful of posts, no mechanical info (one poster says the devs gave him a tip for a stuck stage; others ask "any tips?") | [R-Reddit1] [R-Reddit2] |
| Review sentiment | GameBrain: **77% user score (304 reviews)**; **77–78 negative mentions on monetization (99% negative)** vs 13 gameplay mentions (62% positive) | [T-GameBrain] |

### 2.2 Movement and controls
- **Joystick** at the bottom of the screen for movement; the hero **auto-fires at the nearest enemy**; a virtual **button on the right triggers the hero's special ability**. Store copy: "simple **one-handed** controls". [3P-APKPure-host], [P1] *(the joystick/button detail is from one third-party writeup of v1.4.6)*
- Gun "never runs out of ammo, but must **reload after a number of rounds**". Summoned helpers/**deployables** fight with you. [3P-APKPure-host]
- Hordes of **1,000+ monsters on screen** (store claim). Monsters sometimes **form a ring** that traps the player, forcing precise movement. [P1] [3P-APKPure-host]
- One Play reviewer calls the maps "huge but feel empty, no obstacles", suggesting scrolling maps larger than a screen. **[R]**, single review (17 Nov).

### 2.3 Combat and weapons
- Heroes each have **one unique skill**; guns include **snipers, shotguns, rocket launchers, flamethrowers**, a **saw-blade gun**, "Energy Gun" and "Blood Lord" (the last two sold for $3.99 each). [A1] [R-App Store]
- Skills **affect the main weapon's bullets** ("the passive skills you select affect your main weapon, it's fun as hell playing with the bullet mechanics"). [R-App Store, 14 Jul]
- Enemies drop **XP, and randomly gold, health or magnets**. [3P-APKPure-host]
- **Chip system** (a build modifier layer) is praised by a reviewer; details unknown. [T-GameBrain] **[U]**

### 2.4 Bonus trigger and choice structure
| Question | Answer | Src |
|---|---|---|
| Trigger | **XP bar** (per-kill XP, level-up when the bar fills). *Not* "every N kills". | [3P-APKPure-host] |
| Options per popup | **3 random upgrades**, pick 1 | [3P-APKPure-host] |
| Rerolls | **2 free rerolls each time the choice screen appears** (v1.4.6 writeup). Other reviewers say they must **watch an ad to reroll or revive**, so the free count may have changed or applies only early. **Conflicting, unverified for 1.5.5.** | [3P-APKPure-host] [R-App Store] |
| Stacking | Taking the same upgrade again makes it stronger | [3P-APKPure-host] |
| **Dual-branch evolution** | Every skill path has **two evolution choices** (AOE-and-area vs rapid/precision strikes). **Choosing one branch removes the other for the rest of that stage.** Some upgrades have combined branches with other upgrades. | [P1] [A1] [3P-APKPure-host] |
| Pool exhaustion | One reviewer: "when you select one skill, it will not show up until you take all other skills", i.e. a **no-repeat pool** | [T-GameBrain] **[R]** |
| Multi-hero | In **Endless Survival**, deploy **up to 5 heroes at once**, each levels independently; swapping heroes at a save point leaves the old hero as a follower ("option"), roughly doubling firepower (player tip). | [P1] [3P-JP] [R-via-3P-JP] |

### 2.5 Slot / gamble mechanic
- **In-run slot reel: none found.** No source mentions a reel, spin, roulette or wheel inside a run. **[U]**
- **The only gamble-like systems are meta-level:** **two gem-priced chests in the store** (one for heroes, one for guns), with **pity at 50 pulls**. A reviewer reports spending 50 pulls and receiving duplicates of items he had *already bought*, concluding "be prepared to pull 100 times to get the same one twice". Advice: take the free first pull, then buy the rest from pop-up sales. Heroes and guns are unlocked via **fragments from gem chests with random rewards**. [R-App Store, 14 Jul and 2d ago]. This is also why Apple flags **"Contains Loot Boxes"**.

### 2.6 Scaling and caps
- Per-run: **5-minute stages** ("5-minute runs"); a **progress bar with three markers** (start, mid-stage "many monsters, sometimes a **sub-boss**", end "final boss"). [P1] [3P-APKPure-host]
- **Endless Survival / Endless Challenge:** unlocked **after Stage 5** (JP guide, **low confidence**); has **save every 5 minutes**; a player says it becomes Vampire-Survivors-like after ~20 min. So skill stacking has **no explicit cap in endless**, while **normal stages are timeboxed to 5 min**, which a JP guide notes limits how "flashy" builds get. [3P-JP] [R-via-3P-JP]
- Bonus pacing formulas: **not published**. **[U]**
- Difficulty tiers: **Normal / Hard / Nightmare**, with co-op help for the last two. [P1] [A1]

### 2.7 World / stage / boss / gate structure and run length
- **Stage list** (not "worlds"): stages numbered at least to **23** (YouTube title: "Stage 20…"; JP guide mentions Stage 23). Each stage = one ~5-min run ending with a **final boss**. Clearing it **"recognizes the win and unlocks the next stage"**; **mid-bar yellow marker pays half the reward, red pays full; claim once.** **No gate, portal or walk-to-exit mechanic is described** anywhere. Progression is a **menu unlock**. [3P-APKPure-host] [3P-JP] [YT-1FeB6]
- **Death rule:** failing a stage means **replaying from the start, level and upgrades reset to zero**; reward is partial depending on the marker reached. [3P-APKPure-host]
- **Visual themes:** "colorful 2D pixel battlefields", bosses with learnable bullet-hell patterns. [P1]

### 2.8 Difficulty curve and where players die (all 3P/R, dated Mar 2026, may be outdated)
- **Stages 1–14:** tutorial-like, "almost any skill picks clear it".
- **Stage 15:** sudden spike: more complex attack patterns, **hero-fragment requirements jump**, and **health drops become scarce** (so take healing skills).
- **Stage 23:** the commonly named wall: enemies that **burst into three-way orbs** plus **wall-like lines** of enemies; reviewers call it "too hard / not fun, needs rebalancing". [3P-JP]
- Complaints of **infinite spawns / incorrect damage / unfair spikes**, and **freezing** ("just freezes in place causing me to lose"). [T-GameBrain]

### 2.9 Meta progression
- **Heroes and guns:** unlocked and upgraded with **fragments** from gem chests. **Talent upgrades** (a MOD site calls out "Free Talent Upgrade", implying a talent system exists). Daily/quest rewards, **Premium Pass** and **event weapon pass** ("Toxic Festival"). [R-App Store] [3P-APKPure-host] [A1]
- A positive reviewer says it "gives some actual data on upgrades" (shows upgrade numbers) and has "no 'spend 500 gems to reset your item'" nonsense. [R-App Store]
- **No energy/stamina**, praised as refreshing in the genre. [T-GameBrain]

### 2.10 Monetization
- **Ads:** rewarded ads to **double rewards, reroll, revive**; **forced interstitials** after stage clear/loss. One iOS reviewer describes **a 2-minute ad to return to the main menu even if he declines the double-reward ad**, and that **force-quitting restores an unfinished-run screen that routes back into the ad**. Quests like "**watch 20 ads**" (a reviewer was at 17/20 and reported credits missing). Early levels are ad-free, ads ramp "once you get into the loop". [R-App Store] [R-AppBrain] [T-GameBrain]
- **Ad removal in two tiers:** **No Ads Lite $4.99** and **No Ads $14.99** (iOS); reviewers call two tiers "predatory", one says ads persist after paying. Play review: bought ad-free pack **and "permanent VIP"** and wasn't sure it was worth it. [A1] [T-GameBrain] [P1]
- **Power gates:** guns/heroes behind fragments/chests/packs; "You can spend $15–20 and still not get a full game out of it." [R-AppBrain]
- Player verdict: "**It's one of the better Vampire Survivors clones I've played… the gacha is not good**… a sneaky cash grab built for suckers." [R-App Store]

### 2.11 Mobile polish
- Praised: **smooth/fluid, responsive controls**, "sounds are pleasant to the ear unlike many games like this", "attention to detail" in mechanics, pixel art, music, quick progress in endless; "runs great". [R-AppBrain] [T-GameBrain]
- Weak: **99% stuck at loading and wouldn't open** after a night of play (23 Nov review, "deleted and reinstalled 4 times"), freezes, performance needing optimization. [P1] [T-GameBrain]
- Design: 5-min runs; "no energy"; but **menu-return friction due to ads** is the #1 polish complaint.

### 2.12 Praise vs complaints
| Praise | Complaints |
|---|---|
| Quick 5-minute runs, fluid auto-fire, dual-branch builds ("the passives affect your main weapon"), no stamina, nice pixel art/music, endless mode, multiplayer arrives in 1.5 | **Forced ads** (esp. returning to menu), **two-tier ad removal**, gacha with 50-pull pity, slow fragment grind ("a week and barely unlocked anything"), stage 15/23 walls, repetitive maps/modes ("same gameplay with different names"), freezes/bugs, rewards need online |

### 2.13 YouTube (titles only; not watched)
| ID | Title | Channel | Length / views |
|---|---|---|---|
| `0vz8fNmB9Eg` | Crazy Gunner: Pixel Survivor Gameplay Walkthrough (Android, iOS) | ANDROOSGAMEPLAY | 8:31 / 369 |
| `j-nhh6uaC1Q` | Crazy Gunner: Pixel Survivor – Gameplay Walkthrough part 1 | TanJinGames | 16:58 / 1,162 |
| `g7z8BLMH3PM` | Crazy Gunner: Pixel Survivor Part 1 Gameplay Walkthrough | Zrueger Gameplay | 20:07 / 508 |
| `1FeB6BFibZo` | Stage 20 – Crazy Gunner: Pixel Survivor (Android, 1080P 60FPS) | Mahbub Mishima | 7:32 / 292 |
| `-t3OE0YBeXY` | Crazy Gunner: Monster Mowing – Gameplay Android APK iOS | KenYu Games | 8:43 / 244 |
| `uUp1hLl92f4` | Lebih rusuh dari pickle Pete? Crazy gunner: pixel survivor (gameplay) | ZEPHYRGN | 12:39 / 111 |

*Suggested QA task:* have someone watch the 8:31 and 16:58 walkthroughs and confirm (a) whether any reel/wheel appears at chests or boss rewards and (b) what the "stage clear" presentation looks like. Low view counts (≤1.2K) also say how little player coverage exists.

---

## 3. Pixel Survivor — dive (primary: *Pixel Survivor: Rogue RPG*, KleinGameStudio)

All of this is from the **store listing copy** [P2]; the game was **not** reviewed by anyone I could find. Treat as *claims*.

| Topic | Store claim | Notes |
|---|---|---|
| Movement | "**one-hand swipe**" (drag to move) | Same idea as GDD-v0's drag-to-move alternate control scheme |
| Combat | "attacks are **automatic**"; "bullet hell"; "skeletons to giant abyss bosses" | |
| Trigger | "Slay enemies, **collect experience gems**, and select from randomly generated skills **when you level up**" | XP bar, not kill count; number of options **[U]** |
| Evolutions | "**Combine specific weapons and passive items** to trigger massive evolutions"; "dozens of weapons and passive abilities" | Classic VS evolve pairing |
| Slot/gamble | **None mentioned.** Luck is a meta stat ("increase your luck") | |
| Scaling/cap | "Endless hordes"; cap **[U]** | |
| Structure | "**Multiple dark dungeons**": "cursed gothic libraries to the deepest abyss", each with "unique environmental hazards and enemy types"; bosses | No gate/world-transition described **[U]** |
| Run length | **[U]** | |
| Meta | **Gold → permanent talent upgrades**; **heroes** each with own starting weapon, passive and "skill tree" | |
| Offline | **Yes** ("Play anytime, offline") | |
| Monetization | "Contains ads · In-app purchases"; no price list readable; **[U]** | |
| Platform/dev | Android only found; 7 languages; created 22 Jul 2026, updated 21 Sep 2026 | Sibling title *Doge Survivor: Roguelike* from the same publisher suggests a reskinned template **[U]** |

### 3b. *Pixel Survivor* (CrazyGames, "William") — the "worlds + bosses" candidate
Released 31 Aug 2026, updated 8 Sep 2026; **9.5 rating / 1,232 votes**; landscape; WASD/arrows; "attacks are automatic"; "collect powerful upgrades, and defeat deadly bosses **across unique worlds**". No mechanic detail published. **Free to try in a browser**, so it is the quickest thing for a human to check for reel and gate structure. [W-CG] [T-OP]

### 3c. *Pixel Survivors: Roguelike* (Amrita; Steam) — for **no-cap scaling** evidence
- **Mostly Positive, 78% of 375 reviews**; two maps with "many bosses and minibosses"; **XP and chest drops depend on a Luck stat** (also how many upgrades come out of a chest); you **can keep playing after the final boss**. [S1] [R-MissiAH]
- Players: passives "keep stacking, seemingly infinite", "**no arbitrary limits to the game time**… until your computer melts", multiplicative % stats snowball (everyone stacks XP gain + luck). Evolutions arrive "randomly" from **boss chests**. Chests drop items **on the ground** rather than in a popup (a complaint: you can't see them under the horde, and a fix would be a compass). [R-SteamRev]
- **Lesson for Pocket Rogue:** an uncapped system *works* but collapses into 1–2 dominant stats unless **diminishing returns** exist (GDD-v0 already has Ability Surge diminishing after +60%).

---

## 4. Side-by-side table: Pocket Rogue design element → how each game handles it

Confidence marks: **[V]** store page · **[3P]** third-party · **[R]** review · **[U]** unknown/not found.

| # | Pocket Rogue element (Thomas / GDD-v0) | **Crazy Gunner: Pixel Survivor** | **Pixel Survivor: Rogue RPG** (KleinGameStudio) |
|---|---|---|---|
| 1 | Free movement U/D/L/R on a map | Joystick, free movement on scrolling maps; one-handed **[3P]** | One-hand **swipe** movement **[V]** |
| 2 | Shooting / attack | **Auto-fire at nearest**, reload after N rounds; hero special on a button **[3P]** | Automatic attacks **[V]** |
| 3 | Bonus popup after kills | After **XP-bar** fills (level-up), **not** per N kills; **3 choices** **[3P]** | After XP gem level-up; **random skills** (count **[U]**) **[V]** |
| 4 | Popup contents (ability / +HP / +DEF / potion) | Mostly skills with **dual-branch evolutions**; HP/DEF from skills/chips; heals drop from enemies (rarer past stage ~15) **[3P]** | Weapons + passive items; passives incl. luck **[V]** |
| 5 | **Slot-reel gamble, 3 outcomes, pick 1** | **Not found** in-run. Only meta gem-chest gacha with **50-pull pity** **[R]** | **Not found** **[U]** |
| 6 | Rerolls | **2 free per choice screen** (v1.4.6) vs "watch an ad to reroll" **[3P]/[R]** (conflicting) | **[U]** |
| 7 | Bonuses get harder to earn by world | Not documented; stage difficulty rises, **fragment costs jump at stage 15** **[3P]** | **[U]** |
| 8 | **No cap** on bonuses | **Endless Survival** (after Stage 5): uncapped, saves every 5 min; **normal stages cap at 5 min** **[3P]** | "Endless hordes" **[V]**; cap **[U]** |
| 9 | Abilities: orbiting swords, outward fireballs | Elemental/deployable builds, summons, AOE vs precision branches, saw-blade/rocket/flamethrower guns **[R]/[V]** | "Dozens of weapons", evolutions **[V]** |
| 10 | Stacking / evolution | Repeat picks strengthen; **two evolution branches per skill, choose one** (other locked out for the stage) **[3P]** | Weapon + passive pairing → evolution **[V]** |
| 11 | **Boss defeat → gate opens → next world** | **Boss ends the stage (~5 min)** and **unlocks the next stage in a menu**; **no physical gate** described **[3P]** | "Multiple dark dungeons" with bosses; **no gate/world flow described** **[U]** |
| 12 | Run structure / length | **5-min stage**, mid sub-boss + final boss; endless mode; fail = restart stage, reset **[3P]** | **[U]** |
| 13 | Death/penalty | Replay stage from zero; partial reward by marker **[3P]** | **[U]** |
| 14 | Meta progression | Heroes/guns via fragments + gem chests, talents, passes **[R]/[3P]** | Gold → permanent talents, heroes, "luck" **[V]** |
| 15 | Monetization | Free; **ads** (forced + rewarded), IAP **$1.99–$14.99**, No-Ads **$4.99/$14.99**, passes, loot-box flag; **99% negative monetization mentions** **[A1]/[T-GameBrain]** | Ads + IAP, prices **[U]** |
| 16 | Offline | Solo offline, but rewards need online **[V]/[R]** | Offline **[V]** |
| 17 | Mobile polish | Fluid controls and good audio praised; **menu/ad friction, freezes** **[R]** | **[U]** |
| 18 | Live-ops / update tempo | **~5 updates in 3 weeks (Nov 2026)**; co-op + chat added **[T-AppBrain]** | Created 22 Jul, **last update 21 Sep** (~10 weeks stale); number of updates between **[U]** **[T-CS]** |

---

## 5. Recommendations for *Pocket Rogue* (Copy / Improve / Avoid)

### Copy
1. **Choose-1-of-3 with visible, cheap rerolls, and a no-repeat pool** (Crazy Gunner). It's the genre's proven decision unit. (GDD-v0 uses a 2×2 four-category popup; keep that, but make the *ability* card behave like this.)
2. **Dual-branch evolution** per ability: "AOE vs precision", locking out the other branch for the run. It gives the player a real *identity* choice from one tap, and fits "orbiting swords / outward fireballs" well (e.g., Sword Orbit → *Wide Halo* vs *Fast Blades*).
3. **Stage bar with markers** (start / mid sub-boss / final boss) as a readable progress device. It maps naturally onto GDD-v0's *boss meter*; show a mid-world **sub-boss at ~50%** to break up the spawn curve.
4. **No energy/stamina**: players explicitly praise it.
5. **Show real numbers on upgrades** (a reviewer singled out "actual data on upgrades").
6. **Save at natural pauses** (Crazy Gunner's endless mode saves every 5 min). GDD-v0 already auto-saves at popups.
7. **Offline done properly.** Both games advertise offline play, but Crazy Gunner's rewards need connectivity. Keep Pocket Rogue's rewards fully offline.

### Improve
1. **Deliver what neither game does: the in-run reel.** There is no verified example in these two to copy, so design from the GDD-v0 §5.3–5.4 and borrow *presentation* from Lumen Drift (stop-the-reels input, luck-boosted odds, respin a single reel for gold) rather than from these games.
2. **Make the gate a physical event** (walk through) instead of a menu unlock. Crazy Gunner's menu-based "stage cleared" is the weaker feeling; a gate with a short cutscene sells "next world".
3. **Make "no cap" real in the normal flow**, not only in a separate endless mode: Crazy Gunner's 5-minute normal stages cap power; Pixel Survivors (Amrita) shows uncapped works but collapses to 1–2 stats. Keep diminishing returns on stat cards (GDD-v0 already does).
4. **Telegraph walls.** Crazy Gunner's stage 15/23 spikes (fragment cost jumps; wall-lines and tri-burst enemies) are the most-cited complaints. Add soft pity and a "you died to X" screen (GDD-v0's difficulty section has both).
5. **Chest/popup visibility.** Steam players hate chest drops hidden under the horde; keep rewards in popups (as GDD-v0 does).

### Avoid
1. **Forced interstitials, especially on the menu-return path.** Single biggest complaint class (GameBrain: 99% negative among ~78 monetization mentions). Avoid two-tier ad removal. Avoid "watch 20 ads" quests.
2. **Gem chests with 50-pull pity for core content.** Players describe duplicates of purchased items and Apple flags *Contains Loot Boxes*. (The Rogue Legend brief reached the same conclusion about gacha.)
3. **Dark-pattern return-to-ad:** Don't let force-quit resume into an ad.
4. **Ads required to claim rewards offline.**
5. **Over-reliance on a single reference.** Evidence for both games is thin on exactly Thomas's two signature mechanics (reel, gate). Prototype them on their own merits.
6. **Template-listing risk:** KleinGameStudio's near-identical sibling titles suggest low-effort clones; don't use as a quality bar.

---

## 6. Closest actual slot-reel references found along the way (not requested; for the team)

| Game | Platform | What it does with reels | Src |
|---|---|---|---|
| **Lumen Drift** (longmoose, itch.io HTML5, published ~22 days ago, "in development") | Browser | **"Every level-up is a slot machine."** Three reels spin per level-up; **double = +2 levels, three-of-a-kind jackpot = +3 levels**; luck raises the odds; first two matching makes the 3rd reel spin longer; **spend gold to respin a single reel**; Space stops the reels; cards 1/2/3 to pick. 16 weapons (all evolve), 14 passives, **3 stages (survive 10 min to unlock the next)**, 9 bosses, chests open 1/3/5 rewards, 14 gold-bought permanent upgrades, 20-min runs. | [W-Lumen] |
| **Lucky Survivors** (lipchuansui, itch.io, Unity jam entry) | Browser | "**Slot-machine level-ups**"; a formula of weapon numbers spins **every 7 s** (Jackpot / Hot / Digit); gambling weapons (Lucky Dice, Coin Toss, Card Fan); **10-min runs → Goblin King**. | [W-Lucky] |
| **Slot Survivor** (BC Interactive, Android) | Mobile | Slot spin decides your move in a room (obstacles, monsters, chests, eggs) | [T-CS-Slot] |
| **Slot & Brave: Roguelike RPG** (TrickStAr, Android) | Mobile | Slot reels resolve battles; **Luck rises on misses; Fever/Jackpot**; **3.7★ / 531 reviews / 10K+**; the dev apologised that **Google ad restrictions disabled ad-gated rerolls/revives** (a warning about ad-dependent core loops) | [P-SlotBrave] |
| **RogueSlot: Spin & Slay** (MartinPig, Android) | Mobile | Slot reels as attacks; 20 floors; 3-random-upgrades per level-up; **10+ installs** (tiny) | [T-APKCombo] |
| **Lucky to Live** (PB Studio, Android) | Mobile | Slot funds the shop; 10 floors + boss; **Infinite Mode after beating the boss**; "no gacha, one-time Remove Ads" | [T-CS-Lucky] |

---

## 7. What I could not verify (explicit list)

1. **Whether either game has any slot-reel/gamble mechanic.** None found in text. Needs 5 minutes of gameplay or a human watching the walkthrough videos.
2. **Whether either game has a physical gate/world transition.** Crazy Gunner appears to unlock stages through a menu; "Pixel Survivor: Rogue RPG" is undocumented.
3. **Which "Pixel Survivor" Thomas means.** Eight-plus products share the name (§1b). My pick is low confidence.
4. **Crazy Gunner's exact Play IAP list/range** (the iOS list is verified; Play's range was unreliable in the HTML), the **current free reroll count in 1.5.5**, the exact **number of stages**, **number of heroes/guns**, the **talent/chip tree**, and **ability roster** (no full list found).
5. **Per-kill vs XP-bar trigger** is "XP-bar" per one third-party writeup (v1.4.6) and store copy; I did not see actual kill counts.
6. **Pixel Survivor: Rogue RPG**: rating, installs, IAP prices, run length, caps, gates, ads frequency. No reviews were found at all.
7. **YouTube content:** only titles, durations and view counts were available. Transcripts and metadata were blocked by YouTube's bot check.
8. **Reddit:** the only subreddit found (r/CrazyGunnerPixel) has nearly no content. No Reddit threads were found for any "Pixel Survivor".
9. **Date/ratings drift:** Play numbers vary between AU/US views (4.4–4.5★) and trackers; MOD-site posts (e.g., the 2016 slip, "Unlimited Gold") are low-quality; the AAYYY guide (23 Sep) reads like templated copy and I used it only for the AOE-vs-precision framing already in store copy.

---

## Sources

**Store / official**
- [P1] Google Play, *Crazy Gunner: Pixel Survivor* — https://play.google.com/store/apps/details?id=com.leguas.gunstorm (AU view: https://play.google.com/store/apps/details?hl=en_AU&id=com.leguas.gunstorm)
- [P2] Google Play, *Pixel Survivor: Rogue RPG* — https://play.google.com/store/apps/details?id=com.slime.xxg
- [P-SlotBrave] Google Play, *Slot & Brave* — https://play.google.com/store/apps/details?id=com.TrickStArStudio.SlotAndBrave
- [A1] App Store, *Crazy Gunner: Pixel Survivor* — https://apps.apple.com/us/app/crazy-gunner-pixel-survivor/id6757685841 ; [A-TW] https://apps.apple.com/tw/app/crazy-gunner-%E5%83%8F%E7%B4%A0%E7%94%9F%E5%AD%98%E8%80%85/id6757685841 ; [A-search] App Store search hits for other "Pixel Survivor" titles
- [W-Ryki] Ryki Studio — https://www.rykistudio.com/
- [S1] Steam, *Pixel Survivors : Roguelike* — https://store.steampowered.com/app/1995870/Pixel_Survivors_Roguelike/

**Trackers / third-party**
- [T-AppBrain] https://www.appbrain.com/app/crazy-gunner-co-op-survivor/com.leguas.gunstorm · [T-AppBrain-iOS] https://www.appbrain.com/appstore/pixel-survivor/ios-1658788575 · [T-AppBrain-search] AppBrain search for "Pixel Survivor"
- [T-SW] Similarweb · [T-Skich] https://skich.app/games/crazy-gunner-pixel-survivor · [T-GameBrain] https://gamebrain.co/game/crazy-gunner-pixel-survivor
- [T-CS] https://chrome-stats.com/d/com.slime.xxg · [T-CS-Slot] chrome-stats `com.bcinteractive.slotsurvivor` · [T-CS-Lucky] chrome-stats `com.pierregames.luckytolive` · [T-APKCombo] https://apkcombo.com/rogueslot-spin-slay/com.martinpig.rogueslot/
- [T-APKPure-host] https://apkpure.host/games/action/crazy-gunner-pixel-survivor/ (v1.4.6 writeup, **3P**) · [T-iOSGods] iOSGods v1.3.3 thread · [3P-JP] https://dailystarpk.exblog.jp/245185586/ (19 Mar 2026 JP guide) · [3P-APKPure-host] same as T-APKPure-host
- [T-OP] https://www.openparable.com/game/crazygame/pixel-survivor-ppr

**Reviews / community / video**
- [R-App Store] iOS reviews quoted in [A1] (Jul 14 "Fun if you can afford it", Mar 3 "Ads", "progression way too slow", Jun 4 "Perfect, just perfect") · [R-AppBrain] Play reviews quoted on AppBrain · [R-Reddit1] https://www.reddit.com/r/CrazyGunnerPixel/comments/1sfjkz0/ · [R-Reddit2] https://www.reddit.com/r/CrazyGunnerPixel/comments/1tgvgun/
- [R-MissiAH] https://www.missitheachievementhuntress.com/pixel-survivors-roguelike-review/ · [R-SteamRev] https://steamcommunity.com/app/1995870/reviews/?browsefilter=toprated
- [YT-*] YouTube search results (titles only), see §2.13

**Other "Pixel Survivor" / slot-reel pages**
- [W-CG] https://www.crazygames.com/game/pixel-survivor-ppr · [W-Roblox] https://www.roblox.com/games/94992077158944/Pixel-Survivor · [W-itch1] https://tef.itch.io/pixel-survivor · [W-itch2] https://cugg.itch.io/pixel-survivor · [W-IndieDB] https://www.indiedb.com/games/pixel-survivor
- [W-Lumen] https://longmoose.itch.io/lumen-drift · [W-Lucky] https://lipchuansui.itch.io/lucky-survivors
