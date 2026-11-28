# Similar games: free-roam action with mid-run choice / gamble popups

Owner: Pocket Design · Written 2026-11-27 (US Eastern) · Supports `../GDD-v0.md`

**Question:** Pocket Rogue (Thomas's new direction) is a free-roam portrait action game. Every N kills a popup offers a special ability, small HP, small DEF or a minor potion; a slot reel sometimes lands on three things and the player picks one; N escalates; no cap on total bonuses. Which shipped games already solve pieces of this, and what do we copy or avoid?

**Verification key.** **V** = read on the cited page this session. **S** = seen only in a search-result snippet of that page (page itself blocked or not opened). **U** = unverified / my inference. Nobody on this pass played these games; everything comes from wikis, guides and press. Fandom wikis returned 403 to our fetcher, so Halls of Torment, Soulstone Survivors and Luck Be a Landlord are thinner (S).

## Summary table

| Game | Reward popup | Trigger / escalation | Slot or gamble element | Borrow | Pitfall |
|---|---|---|---|---|---|
| Vampire Survivors | Pause, 3 (sometimes 4) weapon/passive cards | XP: 5 for L2, +10 per level to L20, +13 to L40, +16 after; extra 600 / 2400 XP at L20 / L40 | Boss chests open with slot-machine-style spin; 1/3/5 upgrades | Owned-item bias, reroll/skip, juicy chest opening | Dead options when slots full |
| Brotato | 4 stat cards after the wave | +1 max HP per level; tiers fixed at L5/10/15/20/25+ | Rerolls with rising price; lock | Tier ladder, reroll price formula | Queued level-ups = many screens in a row |
| Archero | 3 abilities on level-up | Kill/XP threshold; angel rooms at fixed rooms | Lucky Wheel after boss; Devil trades max HP for ability | Risk/reward popups (heal vs ability) | All 3 can be junk; wheel "empty" result |
| Survivor.io | 3 skill cards | Crystals/XP; boss every 5 min in a 15-min run | Chests: 1/3/5 skills | Mobile-proven one-thumb loop, slot caps + fallback gold | Evolution gating confusing |
| 20 Minutes Till Dawn | 5 upgrade cards (4 on hard) | XP: 10L-5 to L19, then piecewise, L² from 60 | Elite chests; Shana's single reroll | Piecewise-to-quadratic XP curve; knockback after popup | Large option count slows decisions |
| Halls of Torment | Tome/Scroll/chest selection screens; level-up traits | Fixed pickup spots + gem XP; ranks gated by level | Chests | Fixed-location pickups reward exploring | (thin evidence) |
| Magic Survival | Level-up magic cards; 100 levels then 50 bonus levels | Mana orb XP | Golden Roulette artifact (random legendary) | Post-cap "bonus levels" with weaker buffs = uncapped bonuses | Late-game HP explosion; opaque systems |
| Soulstone Survivors | Skill cards with banish/reroll | Level-ups; meta unlocks reroll/banish | none found | Meta-unlocked reroll/banish; heal on level-up | (thin evidence) |
| Hades | 3 boon offers | Per room, rarity cascade | Chaos gambles (U) | Rarity cascade; reroll upgrades | Not free-roam swarm |
| Luck Be a Landlord | After each spin: pick 1 of 3 symbols | Rent deadline escalates | The slot machine IS the game | Exactly "spin then pick 1 of 3" | Needs deck-building depth to carry it |

## Per-game notes

### Vampire Survivors
- **Popup [V].** On level-up the game pauses and offers 3 or 4 unique options; picking an owned item upgrades it; a brief invulnerability follows the pick. If you hold 6 different items or all are maxed, level-ups instead give gold or a Floor Chicken heal. Reroll and Skip power-ups exist. Offers are biased toward items you already own (chance depends on Luck). Source: https://vampire.survivors.wiki/w/Level_up
- **Escalation [V].** 5 XP for level 2, then +10 XP per level until 20; +13 per level to 40; +16 after. Extra flat XP at levels 20 (600) and 40 (2,400), with a temporary +100 % Growth. Same page.
- **Slot-style reward [V/S].** Bosses drop chests that grant an upgrade to 1, 3 or 5 owned items, with chest quality affected by Luck; gold is added. Chests that can only pay coins skip the full animation. Source: https://vampire.survivors.wiki/w/Treasure_Chest. Commentators attribute the flashy spinning chest animation to the creator's slot-machine background (S; https://teemo.dev/game-design/vampire-survivors/systems/rebuild-blueprint-summary/ and https://mechanicsofmagic.com/2024/05/22/critical-play-vampire-survivors/). Music cuts out for a "Treasure Found" sting (S; https://teemo.dev/game-design/vampire-survivors/systems/audio-design-and-feedback/).
- **Borrow.** Slot reel as presentation for a *free, run-only* reward; a fallback reward when nothing is left to upgrade (so "no cap" never produces a dead popup); skip/reroll as meta unlocks; 1-second invulnerability after choosing.
- **Pitfalls.** Once slots are full the popup becomes low-value; the 3-vs-4 option jitter is only meaningful with Luck. Screen clutter late in a run is the genre's known issue (U).

### Brotato
- **Popup [V].** Each level gives +1 max HP at once and *queues* an upgrade choice that is resolved at the end of the wave before the shop. 4 cards, 16 stats × 4 tiers = 64 upgrades. Sources: https://teemo.dev/game-design/brotato/systems/levels-upgrades-and-pickups/ , https://brotato.wiki.spellsandguns.com/Upgrades
- **Escalation [V].** Tier is fixed at levels 5 (II), 10/15/20 (III), multiples of 5 from 25 (IV); otherwise it uses the shop's wave-based odds with Luck as a multiplier. Reroll price: first = floor(0.75·wave) + max(1, floor(0.4·wave)), then +that increment each reroll, unlimited. Source: https://teemo.dev/game-design/brotato/systems/shop-economy-and-run-structure-reference/
- **Borrow.** Tiered stat cards (our "small HP / small DEF" can scale in tiers instead of staying tiny); milestone tiers every 5th bonus; reroll price ladder as a sink for run currency; a flat +HP per bonus as a guaranteed floor.
- **Pitfall.** Queuing level-ups to the end of the wave avoids interrupting combat but produces strings of popups in a row (U for fatigue; the queueing is V). In real-time free-roam we must pause, so keep each popup to one tap.

### Archero
- **Popup [V].** After level-up you choose one of three abilities; abilities also come from angels, the Lucky Wheel, and the Devil, and reset when the run ends. Source: https://archero.fandom.com/wiki/Category:Abilities . A design analysis says abilities arrive when the player kills enough enemies and are chosen from three random options, with the risk that all three are worthless (Scott Fine, http://scottfinegamedesign.com/design-blog/2019/7/2/archero-part-1-gameplay).
- **Escalation [V].** Angel rooms appear at fixed rooms (e.g. rooms 5, 15, 25, 35, 45 in dungeon chapters; 2, 4, 7, 9, 12, 14, 17, 19 in arena chapters) and offer a low-level ability *or* a heal. Source: https://archero.fandom.com/wiki/Angels
- **Gamble [V].** The Devil offers a strong ability in exchange for part of max HP and may be refused (a design analysis says it can appear after clearing a room without taking damage); after bosses a Lucky Wheel pays coins, an angel skill, a normal skill, or a 60 % heal (odds per the wiki table, 1/6 to 1/3 each); a rewarded-ad wheel exists, up to 5 per day; one result can be "Empty". Sources: https://dqservice.fyi/wiki/archero/en/run-events/ , https://archero.fandom.com/wiki/Lucky_Wheel
- **Borrow.** The ability-versus-heal choice (our potion option) is the same decision; a Devil-style optional gamble ("pay HP for a better reel") is a clean opt-in hook; wheel odds should always include a useful floor.
- **Pitfalls.** All-junk offers; "empty" wheel results; ad-gated spins feel exploitative (the wheel's gem spin is ad-driven). We avoid empties and ad-gating.

### Survivor.io
- **Popup [V].** 3 random skills per level; chests give 1, 3 or 5 skills; max 6 active + 6 passive skills; once capped, gold replaces skills. Active skills reach level 6 ("Evo") only with a matching passive. Sources: https://onechilledgamer.com/survivor-io-skill-guide/ , https://mturbogamer.com/2022/10/survivor-io-what-is-evo-weapon-evolutions/
- **Escalation [V/U].** A run is ~15 minutes with a boss every 5 minutes (Medium analysis: https://medium.com/@amol0509/understanding-uncertainty-in-games-with-survivor-io-78c12220bec5). XP formula not found (U).
- **Borrow.** Proven *mobile, one-thumb* version of this genre (auto-attack, single joystick, 3 cards); the 6+6 slot structure with a gold fallback; per-run boss cadence ~5 min matches our ~4.5 min world.
- **Pitfalls.** Evolution requirements are a hidden recipe that new players miss; keep our evolutions (could) explicit on the card.

### 20 Minutes Till Dawn
- **Popup [V].** Level-up pauses the game and offers 5 upgrades or synergies (4 on Darkness 9+); afterwards all enemies are pushed away. Shana may reroll once. Elite enemies drop a chest worth 36 XP plus a character upgrade. Upgrades form trees (tier I → II → III). Sources: https://20minutestilldawn.wiki.gg/wiki/XP , https://20minutestilldawn.wiki.gg/wiki/Shana , https://20minutestilldawn.wiki.gg/wiki/Upgrades
- **Escalation [V].** XP required per level is piecewise: `10·L − 5` for early levels, `13·L − 6` in the 20s-30s, `16·L − 8` for 40-59, then `L²` from level 60 (wiki table: 15 XP at L1, ~950 at L59, ~3,700 at L60, ~8,300 at L90). Linear first, then quadratic, no cap.
- **Borrow.** **Knock enemies back after the popup closes** (fair restart); piecewise-linear then quadratic threshold curve with no cap → direct precedent for our formula; elites as chest drops.
- **Pitfall.** 5 cards per level is slow to read on a phone; ours is 4 and fixed in position.

### Halls of Torment - thin evidence (S)
- XP comes from gems dropped by kills, and from interacting with a Tome/Scroll of Mastery or chest then dismissing the selection screen. Abilities come from Tomes/Scrolls of Mastery that spawn at fixed locations in each Hall; Traits have ranks that join the pool only at certain levels; ability tiers are gated by hero level (8, 16, 24, …). Level and abilities reset per Hall. Sources: https://hot.fandom.com/wiki/XP , https://hot.fandom.com/wiki/Ability , https://hot.fandom.com/wiki/Trait , https://antares.neocities.org/blog/review-halls-of-torment
- **Borrow.** Map-placed pickups give a reason to *roam* rather than just kite; later could be our "shrines" for the reel. **Pitfall.** U: extra pickup travel can fight the one-thumb design.

### Magic Survival - community guide (V, unofficial)
- Level-ups present passive / special / active choices; normal cap is level 100, then 50 *bonus levels* (60 with a synergy) that grant smaller buffs; combinations at levels 25, 50, 75; a merchant appears every 2 boss waves; an obelisk after a boss wave offers 3 legendary artifacts with a paid reroll; "Golden Roulette" is a gambling artifact that grants one random legendary. Players warn enemy HP "gets insanely high after 50 minutes". Source (Reddit, player-written, treat as unofficial): https://www.reddit.com/r/magic_survival/comments/1vp7zz5/an_attempt_at_a_guide_for_new_players/
- **Borrow.** Bonus levels after the cap are the closest existing "no cap" precedent: keep giving rewards but shrink them. Post-boss 3-choice reward = our reel moment.
- **Pitfall.** Enemy HP explosion and opaque synergies; keep our scaling inspectable by the sim.

### Soulstone Survivors - thin evidence (S)
- Skill cards on level-up, six active-skill slots, skill types that overlap so upgrades can boost a shared category; Banish and Reroll must be unlocked and have limited charges per match (reroll 1-5); a heal-on-level-up upgrade restores 2-10 HP per level. Sources: https://progameguides.com/soulstone-survivors/how-to-unlock-skill-banish-and-reroll-in-soulstone-survivors/ , https://zombiedefence.io/en/reviews/soulstone-survivors (snippets only; the fandom Game Mechanics page returned 403).
- **Borrow.** Reroll/banish as meta unlocks with per-run charges; heal on pick (supports our potion/HP balance). **Pitfall.** U.

### Hades - boon choice (S: snippets only)
- Boon offers are three at a time; rarity rolls as a cascade (Legendary → Heroic → Epic → Rare → Common); Pom of Power levels an owned boon; Fated Persuasion lets you reroll a boon offer. Sources: https://teemo.dev/game-design/hades/systems/boon-system-god-gifts/ , https://hades.fandom.com/wiki/Pom_of_Power , https://hadeswiki.com/wiki/mirror-talents/fated-persuasion-green
- **Borrow.** Rarity cascade is a clean, tunable way to weight our reel; "level an owned thing" cards.
- **Pitfall.** Room-based, not swarm; choice depth (duo boons) is too heavy for a 1-tap popup.

### Luck Be a Landlord - slot-style reward (S: snippets only)
- A roguelike deckbuilder where a slot machine earns rent; after each spin the player chooses one of 3 random symbols to add. Rent due at fixed spin counts is the rising pressure. Sources: https://luck-be-a-landlord.fandom.com/wiki/Symbols (snippet), https://www.pocketgamer.com/luck-be-a-landlord/review/ , https://trampolinetales.itch.io/luck-be-a-landlord
- **Borrow.** "Spin → pick 1 of 3 → added to you" is precisely Thomas's gamble loop; the pick-one step removes bad-luck frustration.
- **Pitfall.** The pick-one step plus a rising stakes clock only works because symbols interact (deck synergy). Our abilities need tags/synergy to give the reel meaning.

## Cross-cutting findings

1. **One popup, one tap, game paused.** Every game above pauses (VS, 20MTD) or defers (Brotato) to avoid mid-fight reading. Pocket Rogue pauses and uses large 2×2 cards.
2. **Escalation is nearly always piecewise-then-quadratic and uncapped.** VS (+10, +13, +16 per level with lump sums), 20MTD (10L-5 → L²). Our `K(b,w)` follows suit.
3. **Floors, not dead ends.** VS/Survivor.io give gold or a heal when nothing is left to upgrade; Magic Survival gives weaker "bonus levels". We always keep the ability card useful (Ability Surge).
4. **Slot caps tame clutter and choice fatigue.** VS and Survivor.io cap actives at 6; Soulstone has 6 active slots. We cap at 5-6 and funnel extra picks into levels, not new icons.
5. **Reroll / skip are meta unlocks or small run currency, not free.** VS, 20MTD (Shana only), Soulstone, Brotato (price ladder).
6. **Gamble beats are opt-in or clearly signposted risk/reward.** Archero's Devil and Angel offer a heal-versus-power tradeoff; the Lucky Wheel can show "empty" (frustrating). Our reel always lets you pick the best of three and never returns empty.
7. **Gambling presentation has store/legal implications.** Rogue Legend is flagged "Loot Boxes" on the App Store and "Includes Random Items" on Google Play (`../../rogue-legend-brief.md` §0). Pocket Rogue's reel is run-only, free, never sold, and should be reviewed against store age-rating guidance before any monetization (U).

## What to test in M0/M1 playtests
- First bonus at 8 kills (~7 s): does it feel instant but not trivial?
- Do players ever pick HP/DEF/potion over abilities after the first 3 abilities? If never, the stat cards are too small.
- Reel: share of picks that go to the reel vs normal cards; busts (all three weak) felt as fair?
- Popup time-to-decision (target median ≤ 3 s).
- Clutter: projectile/enemy cap versus 30 fps on a mid phone.
