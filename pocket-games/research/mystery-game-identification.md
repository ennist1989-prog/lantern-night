# Mystery game identification: what did Thomas play?

Owner: Pocket Design · Written 2026-11-27 (US Eastern) · Supports `../design/GDD-v0.md`

**Question.** Thomas remembers a mobile game that Pocket Rogue is based on, and can't name it. Which game is it?

**Short answer: not identified.** No candidate matches all clues, and nobody on this pass played any of these games. Everything below comes from store listings, wikis, press and Reddit snippets. The first round of clues pointed to Archero. Thomas's second round (classes, swarms, auto-attack, 10 levels per chapter) does **not** fit Archero and points to the survivor-like genre. The best leads are Legend of Survivors and Heroes vs. Hordes, both at low-to-medium confidence, and neither confirmed. Section 7 has the questions that would settle it fastest.

**Verification key.** **V** = read on the cited page this session. **S** = seen only in a search-result snippet. **U** = unverified / my inference. Fandom and Namu wikis returned 403 or a Cloudflare block to our fetcher, so some entries are snippet-only (S).

## 1. Clues, in two rounds

**Round 1 (first message)**
- **C1.** Abilities gained as bonuses: fireballs, ice balls, toxic/poison balls, electric balls, lightning shooting outward that hits nearby enemies on contact.
- **C2.** Bonuses don't cap. Levels are tuned for a set number before the boss, but if you survive you keep everything and can go well beyond.
- **C3.** Every level gets harder: more monsters, harder bosses.
- **C4.** Secret portals teleport you to random side levels with special bonuses.

**Round 2 (follow-up)**
- **C5.** Character classes like wizard, archer, berserker.
- **C6.** You start at the bottom of a forest map and walk up. No destination point; you explore for treasure chests.
- **C7.** Monsters spawn from every angle and swarm.
- **C8.** Attacks auto-swing constantly.
- **C9.** Phone joystick control.
- **C10.** Each chapter has 10 levels on the same map, with escalating monster count, strength and health.
- **C11.** 10 bonuses per chapter, one every 2-3 levels, stacking across chapters.
- **C12.** Level 2 has 10 waves; level 3 repeats the pattern.
- **C13.** Designed to be hard, roughly a 50-60% win rate.
- **C14.** Abilities include fire, lightning, ice, gas, spikes, comets/meteors, volcanic eruption from the ground, earthquake, and "floats" that keep you from stepping on ground spike traps.

## 2. Does it fit Archero? Short answer: no, only partly

Archero (Habby, iOS 14 May 2019 / Android 19 May 2019; 50M+ Play installs [V: Play + Wikipedia-ru snippet]) matches the **ability flavour** but not the **structure**.

| Clue | Archero evidence | Fit |
|---|---|---|
| C1 elemental orbs | "Circles": Fire, Ice, Poison, Bolt (and Obsidian) Circle, "two ... orbs circle around you"; orbs deal 75% damage and apply the matching status. Appears from Chapter 2. [V: dqservice.fyi/wiki/archero/en/ab-circles/; archero.fandom.com/wiki/Category:Abilities (S)] | Strong |
| C1 lightning hits nearby | Bolt: "electricity bolts strike all enemies that are nearby" for 25% of equipment damage. [S: archero.fandom.com/wiki/Category:Abilities] | Strong |
| C2 uncapped carry-over | Abilities persist for the whole adventure and reset when it ends [S: Fandom Abilities page]. But the in-run level is capped: "maximum chapter level currently is level 11" (+2 with one ability) [S: Fandom main page]. Infinite/Endless modes exist [S: DQ modes page, Fandom]. | Partial; the cap contradicts "no cap" |
| C3 escalation | Chapters get harder; bosses at stage 10, 20, 30 in Endless [S: r/Archero]. | Yes |
| C4 secret portals | No in-run secret portal found. Closest is the **Ancient Maze** event: after each room you pick 1 of 2-3 coloured portals; an orange portal leads to a bonus room (loot/free upgrades) at levels 14, 24, 34... [V: Ancient Maze snippet, archero.fandom.com; S: r/Archero guide]. That is an event mode, not a secret. | Weak |
| C5 classes | Heroes with unique abilities, not wizard/archer/berserker classes. U | Weak |
| C6 forest, start at bottom, explore for chests | Chapter 1 is "Verdant Prairie" but runs are a sequence of small rooms; each is cleared and exited through a door at the top ("戸口 ... opens when the stage is cleared") [S: archero.wiki (ja)]. Not open exploration. | No |
| C7 swarm | Enemies come in small room groups. U (no source for counts) | No |
| C8 auto-swing | Auto-fires **only when you stand still**: "can only attack if you stay still like a sitting duck" [V: levelwinner.com]. Not constant auto-attack while moving. | No |
| C9 joystick | Joystick. [V: levelwinner.com] | Yes |
| C10 chapter of 10 levels on one map | Chapter 1 has 50 stages and chapter 3 has 20 [V: DQ world page]. A chapter is a chain of different rooms. | No |
| C11-C13 | Ability pick every hero level-up, plus angels/Devil/Lucky Wheel. No "10 bonuses per chapter" structure found. | No |
| C14 comets/meteors, spikes | Meteors exist as an ability category [S: DQ list "Meteors, stars and axes"]. Ground spike traps exist; no "float" ability found (Devil offers walking on water and passing through walls [S: Fandom]). | Partial |

**Verdict.** Archero is a good match for *what the abilities look like* (orbiting fire/ice/poison/lightning orbs, chain lightning on hit). It is a poor match for *how the game plays* (small rooms, stand-still shooting, no swarm, no class pick, no open forest). If Thomas's memory is of orbs plus a stacking power fantasy, Archero is plausible. If it's of a swarm in an open forest with auto-attacks, look elsewhere.

## 3. Ranked candidates

Confidence labels: **Medium** = several clues supported by a source; **Low** = genre or partial match only. Nothing reaches high.

| # | Game | Year / platform | Confidence | Why it's here |
|---|---|---|---|---|
| 1 | **Legend of Survivors** (Joyboy Game Studio) | Android 2024 (site listed 2024-05-21), iOS; 4.5★, 74.8K reviews [V: Play] | Low-Medium | Chapter-based swarm survivor; "swipe to move and attack the hordes"; active skills "meteor showers, fireballs, bombs, storms, tornadoes" with cooldowns, plus passives; skill choice after each stage; Normal and Hard chapter sets; 130 chapters by Update 2.0. Class names, "10 levels per chapter" and secret portals not confirmed. |
| 2 | **Heroes vs. Hordes: Survival RPG** (Swift Games) | Android/Windows, 10M+ installs, 4.7★ (427K reviews) [V: Play] | Low-Medium | Survival roguelite; hero factions: warriors, mages, assassins, inventors; "cursed forests"; story chapters with bosses and "hidden treasures"; "collect treasures and chests"; "swarms of monsters"; trap-based heroes exist. No berserker or archer class names confirmed (the other Swift listing names a Knight and Dark Ranger [V: Play snippet]). Release year not verified. |
| 3 | **Magic Survival** (LEME) | Android, first on Play 31 Oct 2019 per a mod-site summary [S] | Low | Auto-attacking mage, mana-orb XP; 24 classes incl. Wizard, Pyromancer (Fireball), Electromancer, Cryomancer, Alchemist [V: talkandroid]; treasure chests; level cap 100 by default and "bonus levels" past the max [S: r/magic_survival]; Infinity mode; combination spells at level 25 [V]. No archer or berserker, no 10-level chapters, no portals. |
| 4 | **Archero** (Habby) | iOS/Android, May 2019 | Low | See section 2: strong on C1, weak on everything structural. |
| 5 | **Soul Knight** (ChillyRoom) | Android/iOS, 2017 per Boltshorts [S]; 4.6★ 1.77M reviews [V: Play snippet] | Low | Elemental buffs (fire/ice/poison/electric cycle, "Electric Pulse" lightning that hits up to two nearby enemies); portals at level end; "secret rooms ... once per level"; alternate/secret biomes reached by doing certain things [S: Fandom, orbispatches]. Room-based, not an open swarm. |
| 6 | **Modern class-list look-alikes**: Toywardens, Harrowrift, Arena Heroes: Survivor, Orbonk | 2026 indie releases | Low (genre matches, too new for a childhood game) | **Toywardens**: Archer, Wizard, Warrior, Berserker... [V: mooderbaylabs.com]. **Harrowrift**: Mage, Archer, Berserker; "Plague Forest"; chests; Endless [V: gundogdugames.com]. **Arena Heroes: Survivor**: "10 levels on every map", first map Mystic Forest, Wizard/Archer heroes, "coming soon" [V: omerdurmaz.com.tr]. **Orbonk**: Wizard, Ranger...; 7 elements; "bonus dungeons, fortresses and secret locations" [V: itch.io]. Useful as design references, but unlikely the remembered game. |

**Not matched, but checked.** Survivor.io: found no class system or portal evidence this pass (U). Hero Siege: Pocket Edition (Panic Art, Android 9 Jun 2016, 2.1★ [S]) has hidden dungeons and keys [S: Namu]. It is a hack-and-slash RPG, not a swarm survivor. Crazy Gunner: Pixel Survivor was released January 2026 [V: Play/AppBrain snippet], so it can't be a childhood game. Pixel Survivor (several titles share the name) not matched.

**Titles on Thomas's list I could not verify as matches (no relevant listing found, or only generic results):** Hero Survival, Spirit Survivor, Forest Survival, Dungeon Survivor, Soul Survivors, Survival Hero, Wizard Survivor (nearest hit: "Wizard Hero - Magic Survival" on iOS, 4.7★, 7.9K ratings [S]), Brave Hero, Hunter Survival, Arcade Hunter, Hero Wars, "Dark Forest" games, Battle Bound, Monster Wars, Forest Defender. "Archer Hunter" surfaced only as a docs site (U), and "Brave Survivor" had an empty page. They are not ruled out; they are unchecked.

**Reddit.** I searched r/tipofmyjoystick for combinations of the clues. Nothing matches. Unresolved posts that are close in spirit but not the same: an archer + berserker/viking pixel roguelike with waves in an autumnal area (2010s) [V: reddit 1e63n5u, no answers], and a pixel game with a blue swordsman, green archer and purple wizard (2019) [V: reddit 1tspzdb, no answers]. Neither mentions portals, chapters or elemental orbs. Treat as possible but unrelated.

## 4. Clue-by-clue match table (all clues)

Y = supported by a source, P = partial, N = contradicted or absent, ? = not verified.

| Clue | Legend of Survivors | Heroes vs. Hordes | Magic Survival | Archero | Soul Knight |
|---|---|---|---|---|---|
| C1 elemental orbs / outward lightning | P (fireballs, storms, meteors; orbs ?) | ? (mages "discover the powers of the elements") | P (Fireball, Electric Zone, Frost Nova) | **Y** (Fire/Ice/Poison/Bolt Circle) | P (elemental buffs) |
| C2 uncapped stacking | ? | ? | **P/Y** (bonus levels past cap; Infinity mode) | P (11-level cap) | N/? |
| C3 each level harder | Y (chapters, Normal/Hard) | Y (chapters, bosses) | Y (waves ramp) | Y | Y |
| C4 secret portals to side levels | ? (has "Space Vortex" mode, not in-run [S]) | ? ("hidden treasures") | N | P (Ancient Maze orange bonus portals, event only) | P (secret rooms, alt biomes) |
| C5 wizard/archer/berserker classes | ? (heroes, names unverified) | P (factions: warrior/mage/assassin/inventor) | P (Wizard yes; archer/berserker no) | N (heroes) | N |
| C6 forest, bottom-to-top, chests | ? | P (forest, chests) | P (treasure chests) | N (room chain) | N |
| C7 swarm from all angles | Y ("hordes") | Y ("swarms") | Y | N | N |
| C8 constant auto-attack | Y ("auto-shooter") | Y | Y | N (stand still) | P |
| C9 joystick | Y (swipe-to-move) | Y (one-hand controls) | Y | Y | Y |
| C10 10 levels / chapter, same map | ? | ? | N (timed zone waves) | N | N |
| C11 10 bonuses per chapter, stack across chapters | ? (skill pick after each stage) | ? | N | N | N |
| C12 waves per level (10 waves in L2) | ? | ? | N | N | N |
| C13 hard, 50-60% win | ? | ? | ? | ? | ? |
| C14 meteors / earthquake / volcano / spikes / float | P (meteor showers, bombs, tornadoes) | ? | P (Meteor, Cyclone, Tsunami) | P (meteors; spikes) | ? |

Sources for this table: Legend of Survivors Play listing and mobilegaminghub.com guide (V); Heroes vs. Hordes Play listing (V); talkandroid.com Magic Survival guide (V) and r/magic_survival (S); Archero DQ wiki (V) and Fandom (S); Soul Knight Fandom (S).

## 5. How each mechanic is implemented in the top candidates

**Elemental contact orbs.**
- *Archero (V/S).* Fire, Ice, Poison and Bolt Circles are 2 orbs each, orbiting the hero, dealing 75% of current damage plus the matching status (Burn / Freeze / Poison / Lightning). Other circle skills add speed and size. Elements don't cancel each other. Status numbers: Poison 35% of equipment damage per second and doesn't stack; Fire 18% every 0.25 s for 2 s; Freeze up to 2 s, hitting again unfreezes; Lightning 25% to nearby enemies. [dqservice.fyi circles page V; Fandom Abilities S]
- *Magic Survival (V).* Spells such as Fireball, Electric Zone and Frost Nova are picked at level-up, then enhanced; at level 25 with the right pair equipped you can unlock "Combination Magic". [talkandroid.com]
- *Legend of Survivors (V).* Active skills (meteor showers, fireballs, bombs, storms, tornadoes) fire for a time then go on cooldown; passives (HP, damage reduction, attack speed, coin/EXP gain) last the whole match. [mobilegaminghub.com]

**Uncapped carry-over.**
- *Magic Survival (S).* A default 100-level cap, with bonus levels beyond the per-minute level cap (r/magic_survival thread; details not readable, so mechanics are U). Normal mode ends at a final wave; Infinity mode per zone is used to farm [V: talkandroid].
- *Archero (S).* Abilities stay for the adventure but the in-run level is capped at 11 (+2). Infinite Adventure/Challenge modes exist with stages 10, 20, 30 as bosses and angel rooms every 5th [S].

**Escalating levels.**
- *Legend of Survivors (V).* Skills are unlocked by defeating bosses and offered after each stage; chapters come in Normal and Hard sets.
- *Archero Ancient Maze (S).* Room 1-100; boss every 10 levels; portal colours imply easier/harder routes.

**Secret portal / side levels.**
- *Archero (S).* Ancient Maze: pick among green/blue/purple portals, with an orange flame portal to a bonus room (levels 14, 24, 34...). Event-only, not a secret.
- *Soul Knight (S).* Secret Rooms, at most once per level; Glacier/Forest/Relics floor 1 each connect to an alternate floor 2 biome "by doing certain things"; portals at end of level or after a boss.
- *Other games using the idea (not candidates).* Katanaut (reviewed Sept 2025; platform not checked) has a secret portal teleporting you off-map to different monsters, then back (S: nygamecritics.com). Orbonk lists "bonus dungeons, fortresses and secret locations" (V: itch.io). No one in the candidate list has a confirmed in-run secret portal to a random bonus side level, so C4 is still unresolved.

## 6. Design takeaways for Pocket Rogue

1. **Keep the elemental orbs.** Archero's orbs show the idea works: 2 orbs per pick, 75% damage plus a status effect. Each element should do one clear thing: burn, slow/freeze, poison, chain lightning. Avoid a stat-only recolour. (Proposal.)
2. **No cap, with a soft curve.** Both Archero (cap 11) and Magic Survival (default 100 plus bonus levels) show players tolerate caps if the end state is strong. Thomas's design is uncapped, so tune the escalation curve (monster count, health) rather than the bonus count. (Proposal.)
3. **Bonus pacing from Thomas's own memory.** 10 bonuses per chapter, one every 2-3 levels, stacking across chapters, is a fixed rhythm you can build and test. It fits the existing on-kill popup design if "bonus" means a choice offered by milestones. (Proposal.)
4. **Open, swarm, auto-attack beats Archero's rooms** for the feel Thomas describes: constant auto-swing, enemies from all sides, joystick only. Archero's stand-still firing is the opposite.
5. **Secret portals are a cheap, memorable hook.** Make them rare, visible on the map as a shimmer, and lead to a short side stage with a guaranteed bonus. Use the Archero Ancient Maze "orange portal" and Soul Knight secret room as precedent for how little the player is told. (Proposal.)
6. **Hazards as abilities.** The remembered hazard-and-float kit (spikes, earthquake, volcano, meteors) suggests ground effects can double as abilities. A "float" ability that neutralises spike traps is a nice trade-off pick, but I could not find it in any game. Treat as a Thomas-originated idea unless proven otherwise.
7. **Target win rate.** Thomas remembers 50-60%. Surface it as a design target for chapter balance and measure it in playtests. (Proposal.)

## 7. Questions for Thomas to narrow it down

1. **Look and camera.** Pixel art, cartoon 2D or 3D? Top-down, or angled? Was the screen portrait or landscape?
2. **Era and platform.** Roughly which year, and which device (iPhone/iPad, Android, an old Java phone)? Did it need internet, or did it run offline?
3. **Name and money.** Do you remember anything on the icon or in the first menu: a title, a logo colour, a character on the app icon? Did it have ads or gem purchases?

A useful extra: ask him to describe the first boss and what the secret portal looked like.

## 8. Unverified

- No game was played. No candidate has been confirmed.
- Whether any candidate has "10 levels per chapter", "10 bonuses per chapter" or "10 waves in level 2" is unknown.
- Whether any candidate has class names wizard/archer/berserker (only Toywardens and Harrowrift list all three, and both are new).
- The "float" ability against spike traps was not found in any game.
- Heroes vs. Hordes release year, Legend of Survivors class list and Magic Survival bonus-level mechanics are U or snippet-only.
- Archero Fandom/Namu/Soul Knight Fandom pages were blocked; those claims are from search snippets (S).

## 9. Store links

- Archero: https://play.google.com/store/apps/details?id=com.habby.archero
- Soul Knight: https://play.google.com/store/apps/details?id=com.ChillyRoom.DungeonShooter · https://apps.apple.com/us/app/soul-knight/id1184159988
- Legend of Survivors: https://play.google.com/store/apps/details?id=com.abi.legendofsurvivors · https://apps.apple.com/sn/app/legend-of-survivors/id6489580730
- Heroes vs. Hordes: https://play.google.com/store/apps/details?id=com.swiftgames.survival
- Magic Survival (AppBrain listing): https://www.appbrain.com/app/magic-survival/com.vkslrzm.Zombie
- Toywardens: https://mooderbaylabs.com/toywardens/
- Harrowrift: https://gundogdugames.com/harrowrift
- Arena Heroes: Survivor: https://omerdurmaz.com.tr/apps/arenaheroes/
- Orbonk: https://czapxgames.itch.io/orbonk
