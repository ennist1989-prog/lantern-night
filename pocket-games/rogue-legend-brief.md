# Rogue Legend: Roguelike RPG — Design Brief for *Pocket Rogue*

**Prepared:** Fri Nov 27, 2026 (US Eastern) · **For:** Pocket Design, Pocket Code, Pocket Art, Pocket QA · **Requested by:** Thomas Ennis
**Subject:** *Rogue Legend: Roguelike RPG* by PocketHaven / PocketHaven Games Ltd. (current build **0.642**)

> **How to read this brief.** Every number is tagged with a source in `[brackets]` (key at the bottom). Anything I could not verify is marked **unverified** or **unknown**. **Nobody on this research pass played the game.** All of this comes from store listings, third-party trackers, player posts, community wikis and press. Nothing comes from hands-on play or from the game files. Section 6 (mobile polish) is the thinnest as a result.

---

## 0. Snapshot & listing facts (verified live 2026-11-27 unless noted)

| Item | Value | Source |
|---|---|---|
| Google Play ID | `com.pockethaven.roguelegend` | [P1] |
| Google Play rating | **4.6** (page JSON `ratingValue` 4.63; some cached views show 4.7) | [P1] |
| Google Play ratings count | **~66–67K** (Thomas said "60K+"; live structured data says 67,175) | [P1] |
| Google Play installs | **1M+** (band) | [P1] |
| Play content rating | Everyone 10+ · "Contains ads · In-app purchases (Includes Random Items)" | [P1] |
| Play IAP price range | **$0.99 – $109.99 per item** (US) | [P1], [R-pup10] |
| Last "recent ratings" signal | Last-4-weeks Play rating dipped to **4.2★** vs 4.6 lifetime (tracker note, 21 Nov) | [T-AppInsider] |
| App Store presence | **Yes.** `id6754965520`, "PocketHaven Games Ltd.", Free + IAP, iPhone/iPad, iOS 13+, **1.15–1.2 GB** | [A1], [T-GameQuant] |
| App Store rating | **4.9 (≈8.9K ratings)**; age rating **13+**, flagged "Loot Boxes" and "Advertising" | [A1], [T-GameQuant] |
| App Store charts (US, 26 Nov) | **#98** Top Free Adventure (best **#13** on 17 Oct; top-50 on 19 of last 30 days) · **#32** Top Grossing Adventure | [T-GameQuant] |
| Apple featuring | Featured by Apple around 30 Sep 2026 (tracker) | [T-AppInsider] |
| Platforms | Android, iOS, Windows via Google Play Games on PC | [P1] |
| Release date | **Conflicting.** Play page JSON: Jan 19 2026; IndieTower: 8 Feb 2026 "per country"; iOS: 28 Feb 2026; wiki "v0.400" dated 2026-02-28. Treat as **Jan–Feb 2026 soft launch, global push ~Mar 2026** (unverified) | [P1], [T-IndieTower], [W1] |
| Update cadence | **17 iOS updates in 90 days** (~1 per 5 days); 0.640 (12 Nov) → 0.641 (15 Nov) → 0.642 (23 Nov) | [T-GameQuant], [A1] |
| Size | Android split bundle **652 MB** (0.642); iOS **1.15 GB** | [T-APKCube], [T-GameQuant] |
| Downloads (modelled) | ~**5k+/day worldwide**, **100k+/month**; ~32% paid-UA, 42% organic search, 26% browse (estimates; band only) | [T-AppInsider] |
| Revenue | "**$50K+ daily IAP**" per AppMagic as of **May 2026** (secondhand LinkedIn post by an industry analyst). Current figure **unknown** (paywalled trackers) | [R-FGD] |
| Data safety (Play) | May share *Device or other IDs*; collects *Personal info, App activity* + 2 more; encrypted in transit; **data can't be deleted** | [P1] |
| Connectivity | Always-online (sessions authenticate/sync) — from an AI-summarised review site, treat as **likely** | [R-AppiReview] |

**Latest "What's New"**
- **0.642 (19–23 Nov):** "Demonic Rift — a full new **5th saga**", "Bounty Seasons", bug fixes [P1],[A1].
- **0.641 (12–15 Nov):** 3 new Sentinels (Judicator, Blightfang, Oathkeeper); 2 new Mounts (Sunmane, Glimmerhorn); Album Season 4 "Divine Rift"; Crimson Tower; **Equipment Infusion**; "Magic Seal" event; "Return to Power" (comeback gifts); **Saga Difficulty** system; **up to 10 Loadouts** [A1],[T-IndieTower].
- **0.631 (27–28 Oct):** Pass improvements. **0.620 (16 Oct):** Hero Skins, Avatars & Titles, Friends system, co-op dungeon events "getting ready". **0.600 (30 Sep):** "Chaos Realm prep", new Album [T-IndieTower].

**Closest genre peers named by trackers:** *Heroll: Dice Roguelike* (111%) — the FGD analyst calls Rogue Legend "a westernized iteration of Heroll" [R-FGD]; Archero / Soul Knight (tracker "similar apps") [T-AppInsider].

---

## 1. Core loop

### 1.1 Run start (lobby → board)
- "Every session begins in the lobby. **Press Play and roll the dice** to start your run" [P1].
- Entry costs **energy**: **5 energy for a normal chapter**; **Elite chapters let you spend up to 15 energy for 3× rewards** [R-energy1], [R-QoL]. The free pool is **15 energy/day**; first-try campaign wins refund **+5 energy**; the "gem dungeon"/Crystal Mines give more; rewarded ads also refill energy [R-energy2], [R-Kidef], [R-FGD].
- In the early game, runs (called "expeditions" by players) always begin with an enemy battle on turn 1. This is a **player observation** suggesting a hand-tuned first roll. **Unverified** [R-diceRNG].
- **Auto-roll** of dice unlocks at chapter **25** [K-DC] (translated from the official Discord).
- Players say there is **no sweep** for chapter runs (as of July) [Q-Usagi]. Whether dungeon-type modes offer a sweep is **unverified**.

### 1.2 Board movement
- Movement is **dice-driven, Monopoly-like**. Two board types are reported [R-FGD],[Q-Usagi]:
  1. **Loop board**: you circle repeatedly. The **boss triggers after a set number of rolls**. A **GO tile** pays out when passed, like Monopoly.
  2. **Linear/open board**: a fixed number of tiles, with elites and a final boss. Rest points "dynamically adapt the map layout" [R-FGD].
- Tile counts, dice count (1d6 vs 2d6), and roll counts per board are **unknown**. A strategy blog's claim that "map paths branch and you can plan two tiles ahead" [S-aayyy] conflicts with the dice-only description and reads like generic filler. **Discarded.**
- Skill: the choices are **which upgrades to pick, what to buy, and when to spend a revive**. Dice only decide *where you land* [R-FGD].
- Players complain you can't minimize the selection screen to look at the board or see how many tiles remain, and there is no pause screen with full stats (crit/combo rate etc.) [R-QoL].

### 1.3 Tile types (official list) [P1]
| Tile | Effect |
|---|---|
| **Enemy** | Fast automatic battle → **choose 1 of 3 upgrades** (run skills) |
| **Buff** | Boost ATK / DEF / speed |
| **Negative** | Debuffs. A reviewer warns they can **stack to the point you reach the boss far weaker** [Q-Usagi] |
| **Minigame** | "Roll for luck": extra loot/power-ups |
| **Shop** | Spend **gold** on gear, upgrades, "legendary equipment". Reviewer: a *black market* shop requires landing on the tile; the normal market works if you pass through [Q-Usagi] |
| **Special** | "More tile types added over time" |
| *(player-described)* **Stronger-battle** tile, **random stat up/down** tiles, **event** tiles (draw battle skills or roll for coins), **GO** [Q-Usagi] | |

Level-up choice per Usagi: "recover HP **or** level up 1 of 3 skills you already have." Enemy mobs scale as the run goes on (boss probably doesn't) [Q-Usagi].

### 1.4 Battle resolution
- **Automatic, turn-based "rounds"** (hero wiki uses "turn / round / Basic Attack / Ultimate Attack / Ultimate Charge") [W-Lancelot],[W-Vallatio],[W-Corvus]. Combat is **not** real-time. Some third-party posts about "joystick" or "dodge abilities" are wrong or generic. **Discarded** [S-aayyy].
- Stats seen on hero pages and in player talk: HP, ATK, DEF, **Crit rate, Combo rate, Counter rate, Dodge, Damage Reduction, Ultimate Charge** [W-Corvus],[W-Kitsura],[R-QoL].
- Build identity comes from **elemental/status stacking**: Fire, Ice, Lightning/Shock, **Poison, Wound** (+ Miasma/Plague). Community "meta" is "pick one element and stack it" [R-newplayer].
- **DoT numbers (community datamine, translated from official Discord):** Burn = **20% ATK/tick**, Wound = **20% ATK/tick**, Poison = **15% ATK/tick** (reduced by DEF and damage reduction, **not** by elemental resistance) [K-DC]. Corvus's Miasma = 20% ATK/turn, stacks to 10 [W-Corvus].
- **Revive:** each run gives at least one revive. Players mention "my revive". A rewarded-ad revive exists [R-FGD],[R-saga].
- **Boss design:** enemy damage types matter; there is a rune/resist system for them. A community tool lists "Bosses: what they hit you with, and the rune that answers each one" [T-RogueHQ].
- **Elite chapter modifiers are randomized per run**, not fixed per map [R-HM].

### 1.5 Run length
- **~10 minutes** at full attention on a late normal chapter [R-endgame]; **~15 minutes** per "proper run" in an early-game review (which is why that reviewer felt it wasn't idle) [Q-Usagi]. Earlier chapters are **unknown**, likely shorter. *Inference only; no first-hand timing.*

---

## 2. Between-run progression ("what carries across runs")

**Rule of thumb:** run upgrades (skills picked from tiles) **reset every run**; everything below **persists** [R-FGD]. The store text says "return to the lobby to enhance your hero" [P1].

### 2.1 Gear (merge-gacha) — the primary power curve
- Slots (weapons, armor, necklaces, rings seen in player posts) [R-newplayer].
- **Rarity ladder** [R-Kidef],[K-DC],[T-RogueHQ]: Epic → Epic+1 → Epic+2 → **Gold (Legendary)** → Gold+1/+2/+3 → **Mythic** → … up to **Mythic+4**.
- **S-tier** gear is the build-defining prize ("Collect S weapons!" in the Play description [P1]). **16 S→SS "awakening" pairs** exist [T-RogueHQ].
- **Merge costs:** Legendary = **12 epics** (3 identical + 9 fodder); Mythic = **12 legendaries** (6 identical + 6 fodder), i.e. **144 epics** (18 identical + 126 fodder) [K-DC]. Early Epic→Epic+1/+2 steps need 1–2 same-type pieces [R-Kidef].
- Level-up currencies: **Enhancement Stones** (Tower Challenge, chests) and **Advancement Scrolls** for each 10-level breakthrough. Scrolls are the late bottleneck [R-Kidef]. 0.641 added **Equipment Infusion** [A1].
- Gacha sources: **Silver chest 80 gems/pull**, **Chromatic chest 320 gems/pull** (S-Epic gear), **Obsidian chest** keys (guaranteed Epic every 10 pulls), weekend S-Epic weapon spin [R-Kidef],[K-DC].
- Player-reported bug: gear levels reverting after login ("20 levels lower") [R-AppBrain].

### 2.2 Talents
- Permanent talent tree: stats + passives that apply to every run [P1]. Unlock cost **rises with each talent taken** [R-talentcost, search snippet].
- A newer **Affinity** layer ("new skill trees under Talent") gated by a "golden book" currency from main levels. Players found it "pricey so early" [R-affinity, snippets]. Exact node counts, costs and effects are **unknown**.
- One run-skill detail from a datamine site: run skills have **four versions (Lv1, Lv1+, Lv2, Lv2+)**, and the skill tree unlocks the Lv2 versions (e.g., *Beefcake* +55% Max HP, *Crit Up* +15%) [T-RogueHQ]. This ties **permanent talents directly to in-run skill strength**.

### 2.3 Heroes — see section 3.

### 2.4 Pets
- Summoned with **eggs**; **6 rarities**. **Pet Summon Level** rises as you pull: **Lv 8 unlocks Legendary, Lv 12 unlocks Mythic** [R-Kidef]. Stat bumps every 5 levels. Mythic pets can **evolve (6 Mythic+ pets listed)** [T-RogueHQ]. A pet "build" system lets slots **roll powers** with ranges and odds [T-RogueHQ].
- Eggs come from play, **Egg Rush** events and Pet Kingdom (floors → eggs + pet food). Veterans advise **not** spending gems on eggs [R-Kidef],[R-help2].
- Pets "fight alongside the hero, providing fire support and status effects" [R-AppiReview] (AI-summarised; consistent with Play text [P1]).

### 2.5 Mounts and Sentinels
- **Mounts:** **6** listed, each with **two skill lines + Mastery**, sharing one upgrade economy [T-RogueHQ]. Legendary mounts are bought with Magic Berries from the "Gifts of Nature" event; guild coins fund mount materials [K-DC]. Epic mount unlock is possible via a currency path [K-DC].
- **Sentinels:** **6**, working "like pets", with **two skill lines** and Mastery [R-Kidef],[T-RogueHQ]. Legendary ones come from the limited **Sentinel Domain**/Celestial Fortune events. Elemental alignment matters (e.g., Ice sentinel *Permafrost Titan* for ice builds) [K-DC].

### 2.6 Artifacts and Runes
- **Artifacts:** **36 artifacts in 9 sets**; **4-piece set** bonuses are notable [T-RogueHQ],[R-Kidef]. Pulled via "wishing"; upgraded with star fragments.
- **Runes:** **92 runes** with per-rarity values, including boss-damage-type counters [T-RogueHQ].

### 2.7 Meta-modes that feed the economy
Tower Challenge (stones/scrolls/gold), **Dungeon Dive** (gems, keys, wishes), **Crystal Mines** (gems + energy), **Pet Kingdom**, **Arena** (PvP, seasonal), **Elite Mode** (hero dust; "3× energy"), **Saga** chapters (end-game-ish; the 5th saga just shipped), **Guild** (raids, conquest, 10 guild levels), **Dojo** (9 belts), Crimson Tower, Chaos Realm, Bounty Seasons, Album seasons, Stickers, plus rotating events like Fishing and Marble Carnival [R-Kidef],[K-DC],[T-RogueHQ],[A1]. The 0.642 notes confirm Bounty Seasons and a 5th saga. **There are 28 community guide pages for this game on a single datamine site** [T-RogueHQ]. That is a sign of how much system surface it carries.

---

## 3. Class / hero system

- **Count:** **6 heroes** in April 2026 [R-Kidef]; **7 heroes** per a datamine index (guide updated for 0.640) [T-RogueHQ]. The 7th hero's name is **unverified**; the community wiki lists only the 6 below and is partly stale (it still says "pets coming soon") [W1].
- **Unlock/obtain:**
  | Hero | Rarity | How you get it | Source |
  |---|---|---|---|
  | **Rogue** | Rare | Default/starter | [W-Rogue] |
  | **Lancelot** | Rare | **5,000 gems** (the only gem-buyable hero) | [W-Lancelot],[R-Kidef] |
  | **Vallatio** (Vampire) | Epic | **x10 Luxury Battle Pass** or Arena rewards | [W-Vallatio],[R-Kidef] |
  | **Kitsura** (Fox), **Draco** (Dragon), **Corvus** (Plague Doctor) | Legendary | **Rotating limited hero event**; **pity = 400 pulls → a "Hero Soul"** exchangeable for the featured hero or a Mythic artifact; pity and Hero Souls carry over between rotations | [W-Kitsura],[R-Kidef],[K-DC] |
- **Base stats (wiki):** Rare **538 HP / 137 ATK / 33 DEF** (Lancelot); Epic **637/159/38** (Vallatio); Legendary **755/188/45** (all three legendaries). Rogue's page shows 100/100/100, which looks like a **placeholder** [W-Lancelot],[W-Vallatio],[W-Kitsura],[W-Rogue].
- **Growth axes:** **Stars** (0–10; **50 shards per star** per the starter guide) unlock skill tiers at roughly ★0/2/5, ★4/7, ★8/10 [R-Kidef],[W-*]; **hero level** via *dust* (from Elite Mode); every **10 levels** a small stat bump, every **30 levels** an **"all-heroes" stat boost** (so owning/levelling heroes helps the whole roster) [R-Kidef]. A hero level-up costs a lot of dust (one player: ~8,000 dust) [R-spend].
- **Swapping/synergy:** you run **one hero** per run, but a **"Companion" / synergy** feature lets a host borrow skills from other owned heroes: **3★ = two skills, 6★ = three skills**; later "equip 3 of your heroes onto a host" [R-Kidef],[T-RogueHQ]. Up to **10 loadouts** (0.641) [A1].
- **Distinctiveness (each hero = one build lane):**
  - **Rogue**: economy. Shop-token gain +9%/+18%, EXP +9%/+18%, +1 skill reroll on level-up, more Legendary run-skills at ★10 [W-Rogue].
  - **Lancelot**: sustain/tank. Heal 6/11/16% HP after each battle, shield every 3 rounds, "Courage" stacks → 30% max-HP shield, 50% chance for +20% DR [W-Lancelot].
  - **Vallatio**: vampire/lifesteal + Wound. ATK stacks when healed (up to 20 stacks of +5%), Wound-scaling basic attack, AoE Wound ultimate [W-Vallatio].
  - **Kitsura**: skill-damage/crit/dodge. Stacking "Spiritual Pressure" → release burst, debuff-cleanse charm, dodge → +10% skill dmg/+4% crit stacks (max 10) [W-Kitsura].
  - **Corvus**: DoT specialist. Miasma/Poison/Wound, "Tri-Disaster" every 3 rounds applies all three, Insanity Potion buffs combo/counter/DR [W-Corvus].
  - **Draco**: physical/fire AoE. Dragonfire Buildup every 4 attacks; below 40% HP ATK/DEF surge; execute below 30% HP at 16 stacks [W-Draco].
- **Take-away:** hero kits are **passive-rule rewrites** ("every N rounds…", "when HP<40%…"), not different weapons/animations. That is cheap to author (data-driven) and to add monthly.

---

## 4. Difficulty & pacing

- **Early game:** "breezy and satisfying", and new systems unlock gradually by chapter progress [R-pup10],[Q-Usagi]. **Auto-roll at ch. 25**, red "specialization journal" books from Elite ch. 12 [K-DC].
- **First wall is early:** an analyst notes the "difficulty curve ramps up early, encouraging repeat grinding" [R-FGD]. GameBrain review quotes "hit the paywall within a few hours" [R-GameBrain]. A newcomer reports being "stuck in the first 20 or so chapters" [R-spend]. Recommended fix from players: **get one S weapon early** and build around it [R-help1].
- **Where players die:** *bosses* (defence-stat checks; "boss fights hinge heavily on defensive stats" [R-pup10]); **negative-tile stacking** before a boss [Q-Usagi]; **DoT-heavy zones** such as the Sewer in World 2 (Elite 2-90 complaint: enemies heal their full missing HP each turn; "I'd need to double my sheet power") [R-tuned]; **Saga** bosses (a "devil slime one-shots me at ~90m power", need ~5 attempts) [R-saga].
- **Power scale** (shows how big numbers get): ~**20M** "power" at world-1 chapter 70/50 [R-rushW2]; ~**50M** at 90% through world 1 and ~**90M** hitting Saga walls [R-P2W],[R-saga]. Late-chapter gold upgrades cost **~600k each**, roughly "6 runs per upgrade" [R-endgame].
- **World structure:** **World 1 ≈ 50 normal chapters + matching Elite chapters** (player phrasing "70/50"; exact total **unverified**); **World 2 beta ran Sep 18 2026**; some World-2 chapters take **~3 days** of attempts [R-W2beta],[R-tuned]. **5 sagas** as of 0.642 [A1].
- **Ways the game paces play:** energy (15 free/day + refunds), **Elite = 3× energy → 3× rewards** (the real optimisation), daily dungeons/events, **3-day rotating event cycles** (Chest/Egg/Artifact Rush + Tournament) [K-DC], weekly Arena/Guild, battle pass seasons, album seasons, "Return to Power" lapse-gifts [A1].
- **Return hooks:** idle collection every few hours (gold, gacha draws, small premium currency) [Q-Usagi]; events change every ~2–3 days and don't carry over ("useless if every event starts from the beginning" [R-AppBrain]); **VIP** unlocks 4× speed and an "Auto Next Level" toggle in the Tower [R-FGD],[R-incl]; guild; Arena rank resets.
- **Fatigue signal:** one reviewer says the loop goes "repetitive… boring quickly" [Q-Albert, Play review 13 Apr]. Others note boards "loop and become boring" [P1 reviews]. Another says the game isn't idle. You must **sit through 10–15 min runs several times a day** [Q-Usagi].

---

## 5. Monetization

### 5.1 Ads
- **Rewarded video only; no forced interstitials** reported by multiple sources [R-FGD],[R-pup10],[Q-Usagi]. Uses: level-reward multipliers, **revives**, quick idle rewards, **energy refills**, daily-limited chest summons, daily shop rewards [R-FGD].
- **Pattern worth knowing:** "nearly every rewarded-ad offer is followed by an IAP prompt for a **Lifetime Ad-Free** card bundled with hard currency" [R-FGD].
- Ad pain points: ads **90–120 s** long and growing [R-adsbug]; reward **not granted / crash / app reload** after ad [R-adsbug],[R-pup10]; red-dot badges persist while ads are available [R-GameBrain]. A player can bypass many ads by backgrounding and returning [R-adfree]. Pup10 rates ads/IAP balance **5.5/10** [R-pup10].
- **9 ad networks** inside the app (tracker) [T-AppInsider]. 4 new ad creatives started 5 Nov (UA).

### 5.2 IAPs (what we know)
- **Play range $0.99–$109.99/item**; iOS lists packs **$0.99–$34.99** in the visible top 10 ("Pack 1 … Pack 35") [P1],[A1].
- **Ad removal ("Ad-Free pass")**: **~$7** (player quote). **Lifetime Ad-Free + "Lifetime Supply" bundles** came to **£35 total** for one buyer [R-adfree],[R-lifetime]. Ad-free also skips *rewarded* ads [R-pup10]. Consensus "best buy" ranking: **1) ad removal, 2) VIP, 3) permanent gem supply** [K-DC],[R-spend].
- **VIP**: ~monthly card (not a clean subscription: players ask if it auto-renews); gives **4× battle speed** and **Auto Next Level** [R-FGD],[R-lifetime]. Price **unknown** (not found).
- **Battle Pass**: tiered, including a **x10 "Luxury" pass** that includes the Epic hero Vallatio [W-Vallatio]. Reddit threads reference a "$30" pass and a "$20 gem pack = 2,400 gems" **(player quotes, unverified)** [R-spend],[R-30].
- **Limited-time multistep events** with a paid "premium track" (**~$9**) every ~2 days (Play reviewer) [R-AppBrain].
- **Random-item mechanics** (Play: "Includes Random Items"; App Store: "Loot Boxes"): chromatic chests, hero event pity 400, pet eggs, artifact wishing, S-weapon spins, sticker albums [P1],[A1],[R-Kidef].

### 5.3 What's gated (by perception and fact)
- **Hard gates reported:** boss rush / Magma Mountain / Golden City-style events "can't be completed without spending" (one player), top prizes in events, **PvP** advantage for spenders, **x4 speed + auto-next** (VIP), Epic hero Vallatio (pass) [R-P2W],[R-FGD].
- **Counter-evidence:** many free players say the core campaign is clearable F2P with patient saving for events ("90% through World 1 on ad-skips only") [R-P2W].

### 5.4 Sentiment on P2W
- Play: 4.6★ headline, but **recent** window 4.2★ (tracker) [T-AppInsider]. App Store 4.9★.
- **GameBrain** 61% audience score; **monetization = 88% negative of 122 mentions** [R-GameBrain]. **Pup10** 6.2/10 ("heavy pay-to-win pressure, unreliable rewarded ads") [R-pup10].
- Reddit headline: "*complete P2W garbage*" (32 pts, 100 comments, 5 Oct) — with many replies disagreeing [R-P2W].
- Dev reply (Play, 24 Apr): "Sorry the mechanics, ads, and monetization felt so frustrating. As a F2P game we need to keep it sustainable…" [P1].
- Funnel clues: App Store reviews cite **customer-support issues on lost accounts and purchase errors** and "rigged RNG" suspicion [T-AppInsider].

---

## 6. Mobile polish (thin; mostly second-hand)

- **Portrait:** App Store screenshots are **portrait (600×1300 ≈ 9:19.5)** [A1]. Play screenshots found in the page mix landscape and portrait sizes (**unverified** which is the game's real orientation on Android). Reviewers call it "ideal for one-handed mobile play" [R-AppiReview] (AI-summarised; **not verified**).
- **Input model:** run = **tap Roll, tap an upgrade (1 of 3), occasionally a shop/minigame**. Battle auto. This minimal input is the polish. Cause: the game's own description of "fast, automatic battles" [P1] and reviewers' "big red button before every action" complaint [Q-Noble, Play review 25 Apr].
- **Speed options:** standard speed "can drag without the paid speed boosts" [R-pup10]; **4× is VIP-only** [R-FGD]. **Auto-roll unlocks at ch. 25** [K-DC].
- **Performance claims:** "60 FPS, low memory" (AI-summary) **vs** user reports of **random crashes, audio dropouts, stuck loading, ad crashes** and a 650 MB–1.2 GB install [R-AppiReview],[R-pup10],[R-adsbug],[R-Todd].
- **QoL gaps players name:** can't minimize pick screens to see the map [R-QoL]; no per-run stats/pause panel [R-QoL]; no way to remove unwanted run abilities in the shop [R-QoL]; no **stacked** weapons list, so "doom-scroll to upgrade gear" [R-Todd]; can't spend 15 energy on normal chapters [R-QoL]; "nothing explained, you just jump in" [R-Albert, Play review 13 Apr]; pop-ups and red dots pushing spend [R-GameBrain].
- **Tap-target sizes, font sizes, safe-area handling, haptics, audio mix:** **unknown.** Pocket QA should capture these on-device from the live game before copying anything.
- **Session length:** **~10–15 min for a full run** (player-measured) plus several meta-menu minutes. The "idle" framing is partly marketing: it needs repeated active sessions [Q-Usagi],[R-endgame].

---

## 7. What it does better than Rogue Adventure and Rogue Dungeon RPG

**Quick profiles (verified from Play listings, 2026-11-27)**

| | **Rogue Legend** | **Rogue Adventure** (SharkLab Mobile, `it.sharklab.rogueadventure`) | **Rogue Dungeon RPG** (Geometric Applications, `io.cordova.RogueRpg`) |
|---|---|---|---|
| Genre | Dice-board auto-battler roguelite + idle meta | Pixel **deck-builder** roguelite (1-mana cards, hand of 4, 3 mana) | Hack-and-slash ARPG roguelite, endless floors + prestige |
| Rating / scale | 4.6 · ~67K ratings · 1M+ | 4.6–4.7 · **78K ratings** · 1M+ (since Aug 2019) | 4.4–4.5 · **15K ratings** · 100K+ (since 2015) |
| Classes/heroes | 6–7 heroes | **15+ classes**, 4 modes (Classic/Hell/Void/Tower), weekly tournaments | **5 classes** (Warrior start; Rogue unlocked ~Floor 11, Mage ~Floor 22) |
| Ads / IAP | Rewarded ads; IAP **$0.99–$109.99**; VIP/pass/gacha | Optional rewarded ads; IAP range **$2.99–$15.99**; community lists **Remove ads $9.99, Double EXP $3.99, Unlock all $6.99** | **No ads**, offline; IAP **$1.99–$49.99**; "100% content free" |
| Meta depth | Gear/talent/pets/mounts/sentinels/artifacts/runes/guild | Class bonuses (5 per class), unlocks | Prestige multiplier 2×→16×→50,000×; relics |
| Sources | [P1],[A1] | [P2],[R-RA] | [P3],[W-RD] |

**Where Rogue Legend wins**
1. **A distinct, legible run fantasy**: *dice + board* gives each run a built-in story: "where will I land?" Neither competitor has a spatial "journey" structure. Rogue Adventure has a route map; Rogue Dungeon is floor-by-floor.
2. **Auto-battle + 1-of-3 drafts = very low input**. Faster to learn than a deck-builder, much less fiddly than ARPG controls [P1].
3. **Massive layered meta + live-ops.** Weekly-ish content drops (17 updates/90 days), 5 sagas, seasonal albums/passes, guilds, Arena. Commercially it **out-grosses both** (iOS Top Grossing #32 Adventure; Google Play *Role Playing* Top Grossing ranks of #7–#18 in several countries per AppBrain [T-GameQuant],[R-AppBrain]).
4. **Hero kits as passive rule-rewrites + roster-wide bonuses** keep each new hero a build-defining event [W-*].
5. **Presentation/IP polish.** Cartoon 3D look and an Apple feature (30 Sep) [T-AppInsider]. (Art quality: "cute artstyle" per Reddit [R-P2W]).

**Where competitors beat it**
- **Rogue Adventure:** *fairer, cleaner monetization* (3 IAPs, no forced ads, "don't need to pay to play"); true build-crafting via shared card pool; 15+ classes and ascension-style difficulty modes [R-RA]. Its weak spot is reward-ad bugs and 1-min ads [P2].
- **Rogue Dungeon RPG:** **no ads, offline, <20 MB**, genuine "100% free" ethos and a satisfying prestige loop [P3]. Dated visuals and slower onboarding.
- Rogue Legend's **sentiment is worse** than both on monetization.

---

## 8. Design takeaways for Pocket Rogue

### COPY
1. **"Roll → land → resolve" as the run skeleton** (Press Play → roll → tile). It's cheap to understand and has a natural fail/boss clock (loop boards trigger the boss after N rolls) [P1],[Q-Usagi].
2. **Enemy tile → auto-battle → pick 1 of 3** as the core dopamine beat [P1]. Keep run-skill picks readable and element-themed.
3. **Tile vocabulary:** Enemy, Buff, Negative, Minigame, Shop, Special/event, GO. Keep **Special** as an extensible slot for live-ops [P1].
4. **Hero = passive-rule rewrite** authored as data (stars unlock tiers; "every N rounds…") [W-*].
5. **Run vs. meta split**: temporary skills reset; gear/talents/pets persist; **talents upgrade run-skills' power** so meta feels visible inside a run [T-RogueHQ].
6. **Status-effect identity** (burn/poison/wound/shock/ice) as the build language. Use clear tick rules (e.g., % of ATK per tick) [K-DC].
7. **Elite = higher energy cost for multiplied rewards** (player-controlled risk/return) [R-energy1].
8. **Comeback gifts, loadout slots, events on a visible calendar** [A1],[K-DC].

### IMPROVE
1. **Show the board and remaining rolls at all times**; let players minimize pick screens without losing the map [R-QoL].
2. **Explain things.** Rogue Legend's #1 non-money complaint is "nothing is explained" [R-Albert]. Add a 90-second guided first run and a pause screen with **full stat readout** (crit/combo/counter/DR) [R-QoL].
3. **Make negative tiles fair**: cap stacked debuffs or add a pre-boss "rest" guarantee so one bad streak doesn't feel rigged [Q-Usagi],[R-GameBrain].
4. **Dice transparency**: publish the roll rules (e.g., guaranteed first-tile and any pity) so "rigged dice" suspicion never starts [R-diceRNG],[T-AppInsider].
5. **Offer auto-roll/auto-next/2× speed for everyone early**, with premium only for extra (4×). RL's VIP-locked "Auto Next" is a top QoL gripe [R-incl].
6. **Stack and sort gear UI** to avoid "doom-scroll to upgrade" [R-Todd].
7. **Keep install size small.** RL ships at 650 MB–1.2 GB. Target a lean first install with on-demand packs.
8. **Reliable rewarded ads**: reward granted server-side before the ad ends, resume state after a crash/reload [R-adsbug],[R-pup10].

### AVOID
1. **A new paywalled premium event track every ~2 days** and pop-up/red-dot spam; it dominates negative sentiment [R-AppBrain],[R-GameBrain].
2. **Rewarded-ad → "buy lifetime ad-free" prompt after every ad** [R-FGD]. Use one honest offer.
3. **Many overlapping gachas (chests, eggs, wishes, spins, hero pity 400, S-weapon spins) with merge costs that explode** (Mythic = 144 epics) [K-DC]. This is the main source of "P2W" perception.
4. **Event currencies that evaporate** and "start from zero" every cycle [R-AppBrain],[K-DC].
5. **Hidden "best value" IAP tricks** and low-value bundle clutter [R-spend].
6. **No-sweep energy walls** on already-cleared content when the player is told the game is "idle" [Q-Usagi].
7. **Always-online requirement + undeletable data** unless truly needed [P1],[R-AppiReview].
8. **Hero acquisition behind both a limited-time rotation and a pass.** Keep at least one strong free hero path.

### Suggested ownership
- **Pocket Design:** tile table, run length target (**8–12 min** run, <20 taps of required input), hero kit template, monetization guardrails (§5, §8).
- **Pocket Code:** data-driven tiles/heroes/status system, server-side ad-reward grant, roll-rule config.
- **Pocket Art:** portrait layout, readable tile icons, element color language.
- **Pocket QA:** on-device capture of tap targets / safe-area / readability on the live game (unknown today); verify "rigged dice" via roll-log tests in *our* build.

---

## 9. Not verified / open questions
1. **Dice rules:** number of dice, tile counts per board, rolls to boss, exact GO payout. **Unknown.**
2. **Exact IAP price list** for Play (only the $0.99–$109.99 range and a few player-quoted prices). VIP price, Battle Pass price, Ad-Free price (only "~$7" quoted by a player) **unverified**.
3. **7th hero's identity.** Wiki lists 6; a datamine index says 7. **Unverified.**
4. **Number of chapters per world/saga**, World 1 total chapters (~50 normal is player-implied). **Unverified.**
5. **Release date** (Jan 19 vs Feb 8 vs Feb 28, 2026). Conflicting.
6. **Current revenue/DAU/retention.** Only a May-2026 "$50K+/day IAP" claim; trackers hide the rest.
7. **UI measurements** (tap-target size, fonts) and **Play orientation**: not checked on device.
8. **Datamine guide contents** (Rogue HQ) render client-side; I could read their *index* (counts like 92 runes, 36 artifacts) but not the detailed tables.
9. **Official Discord / YouTube:** Discord invite exists (`discord.com/invite/roguelegend`) but wasn't readable by tools. I found only one directly relevant YouTube title ("Chapter 33 – Shifting Sands. Rogue Legend RPG", Stuart Tactics, 6 May 2026; tags include #F2PGuide #CrystalHammer #NatureStaff #PvPStrategy) and a Chinese-language gameplay video referenced by a blog. Video descriptions had no numbers.
10. **Sources I discarded as unreliable/off-topic:** *treyexgaming.com* "Rogue Legend Guide Wiki" (describes soldiers, "Angel Sam", income upgrades, none of which match this game), *aayyy.com* board guide (generic). AI-generated review aggregators (AppiReview, AppBrain summaries, AppInsider "AI summary") are used only where consistent with primary sources and are marked.
11. Third-party **AppBrain "2 million installs"** contradicts Play's 1M+ band; **disregarded**.

---

## Source key
**Primary store pages**
- **[P1]** Google Play – Rogue Legend: https://play.google.com/store/apps/details?id=com.pockethaven.roguelegend (fetched 2026-11-27: rating JSON, IAP range, What's New, data safety, reviews incl. dev reply 24 Apr)
- **[P2]** Google Play – Rogue Adventure: https://play.google.com/store/apps/details?id=it.sharklab.rogueadventure
- **[P3]** Google Play – Rogue Dungeon RPG: https://play.google.com/store/apps/details?id=io.cordova.RogueRpg
- **[A1]** App Store – Rogue Legend: https://apps.apple.com/us/app/rogue-legend-roguelike-rpg/id6754965520 (IAP list, version notes, 13+, Loot Boxes)

**Community / wiki**
- **[W1]** Wiki home https://roguelegend.wiki.gg/ · **[W-Rogue]** /wiki/Rogue · **[W-Lancelot]** /wiki/Lancelot · **[W-Vallatio]** /wiki/Vallatio · **[W-Kitsura]** /wiki/Kitsura · **[W-Corvus]** /wiki/Corvus · **[W-Draco]** /wiki/Draco · **[W-\*]** all hero pages
- **[R-Kidef]** r/RogueLegendRPG "Starting Guide & Tips" (21 Apr 2026): https://www.reddit.com/r/RogueLegendRPG/comments/1srvlbj/
- **[R-help1/help2/newplayer]** r/RogueLegendRPG threads 1w6zqtr, 1w3ydvx, 1um3g1u, 1x8qyrz (new-player advice)
- **[R-P2W]** https://www.reddit.com/r/RogueLegendRPG/comments/1wy4cpe/ · **[R-spend]** …/1xfkcfo/ · **[R-adsbug]** …/1u71r0y/ · **[R-adfree]** …/1x89f8k/ · **[R-lifetime]** …/1vw49o4/ · **[R-30]** …/1u6h9r7/ (snippet only)
- **[R-energy1]** …/1tq05o1/ · **[R-energy2]** …/1wvx7lx/ · **[R-QoL]** …/1v043tw/ · **[R-endgame]** …/1v0x4xu/ · **[R-diceRNG]** …/1wlfnzm/ · **[R-HM]** …/1u4c3bi/ · **[R-saga]** …/1vaw9ao/ · **[R-tuned]** …/1wxq12c/ · **[R-W2beta]** …/1wjqalb/ · **[R-rushW2]** …/1x499zf/ · **[R-talentcost/affinity]** …/1twahkw/, …/1wl6ho0/ (snippets) · **[R-incl]** = [R-lifetime]
- **[R-RA]** r/AndroidGaming Rogue Adventure monetization post (9 Jan 2026): https://www.reddit.com/r/AndroidGaming/comments/1q7xrms/
- **[K-DC]** Korean DC Inside gallery early-game guide (25 Aug–9 Sep 2026; translated from the official Discord): https://gall.dcinside.com/mgallery/board/view/?id=roguelegend&no=6
- **[T-RogueHQ]** Rogue HQ datamine site guide index: https://rogue.desoware.com/guides/ (counts only)
- **[Q-Usagi]** Qoo App user review (12 Jul 2026): https://apps.qqaoop.com/en/comment-detail/14492998 · **[Q-Noble/Albert/Todd]** Play reviews quoted on [P1]
- **[W-RD]** https://playrpgs.com/rogue/classes

**Press / trackers**
- **[R-FGD]** Friendly GameDev teardown (26 May 2026): https://friendlygamedev.com/game-reviews/rogue-legend/
- **[R-pup10]** https://pup10.com/review/rogue-legend/ (25 Oct 2026; 6.2/10; summarised from 40 Play reviews)
- **[R-GameBrain]** https://gamebrain.co/game/rogue-legend-roguelike-rpg
- **[R-AppiReview]** https://www.appireview.com/com.pockethaven.roguelegend (AI-summarised)
- **[R-AppBrain]** https://www.appbrain.com/app/rogue-legend-roguelike-rpg/com.pockethaven.roguelegend
- **[T-AppInsider]** https://appinsider.io/apps/rogue-legend-roguelike-rpg-6754965520
- **[T-GameQuant]** https://gamequant.io/app/ios/6754965520/rogue-legend-roguelike-rpg
- **[T-IndieTower]** https://indietower.com/apps/android/com.pockethaven.roguelegend and /apps/ios/6754965520
- **[T-APKCube]** https://apkcube.com/rogue-legend-roguelike-rpg/com.pockethaven.roguelegend
- **[S-aayyy]** https://www.aayyy.com/rogue-legend/board-movement-tile-priority-guide/ (discarded)
