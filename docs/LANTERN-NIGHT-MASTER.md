# Lantern Night: The Far Shore — MASTER

**Last updated by Ledger — 2026-11-27 11:00 PM EST**
**Rule: One file per game. Ledger updates this file whenever a durable fact changes.**

> **This game does NOT include Purgatory, the hallway, or the teddy room — those are Far World.**
> "Far Shore" here means Lantern Night's spirit realm. The second game is **Far World** (also "Tape That Remembers You"); see [FAR-WORLD-MASTER.md](https://github.com/ennist1989-prog/far-world/blob/main/docs/FAR-WORLD-MASTER.md) (box copy: `/workspace/far-world-flashbacks/FAR-WORLD-MASTER.md`) and [GAMES.md](../GAMES.md).

An index, not a spec. Each line points to its source. Design truth lives in the GDD.

## 1. What it is
- Browser RPG in the style of RPG Maker MV/MZ (Phaser 4 + TypeScript). Repo: https://github.com/ennist1989-prog/lantern-night (public).
- Mio shifts between the **Living World (Near Shore)** and the **Far Shore (spirit realm)**. Same geography, different terrain, NPCs and events on each layer. Source: GDD §1–§3.
- Planned villain Tsubaki (Hollow Regent) and chapters 4–8 are **data only**, not playable. GDD §2, §3.

## 2. Chapters 1–3 (the playable slice)
- Ch1–2: Sachi's House, Ashiro Village, Ashiro Well, Bell Shrine (Straw Warden, Hollow Bell-Keeper). Ch3: Whispering Forest / Willow Hollow area (Kappa Toll-Keeper, Willow Mother, Parley-only). Source: GDD §3, §10, §13, §18; map and boss list in the repo's `public/data`.
- Live public site already runs Ch1–3 (GDD §13 correction, 27 Nov 9:47 PM EST). Chapter counter works. The GitHub repo description still says "chapters 1-2" (stale).
- Latest additions in the frozen build: doorway fix (#58), windowskin UI (#57), Dust Wisp fix.

## 3. Builds and deploy state (verified from `git ls-remote`, 27 Nov 2026)
| Item | Value |
|---|---|
| `main` tip | `4ecfbcd` (merge of PR #58, 27 Nov 10:11 PM EST), then docs-only commits on top (`d852ba7` Freebuff entries 12/13; `0d4e162` this master and GAMES.md). No game code changed after 4ecfbcd |
| **Frozen build** | branch `frozen/ln-redeploy-2026-11-27` = `4ecfbcd9856d70e585114da5d72bc3c349abcff5` |
| Six-bot gate | **6/6 YES on 4ecfbcd** (Wisp, QA, Pip, Ember, Pixel Sage, Ledger), 27 Nov ~10:44 PM EST. Source: `PRIORITIES.md` tail, `CHANGELOG.md` tail |
| Live (`gh-pages`) | `e9203a0682d834780c6a1aa006199e14cf00ec88`, built from `79eaf00`, deployed 7 Nov 2026 7:37 PM EST |
| Rollback tag | `rollback-gh-pages-20261107-8475505` |
| Box copy of frozen dist | `/workspace/ln-frozen/4ecfbcd/` (`MANIFEST.sha256`, 2,735 files; `dist/index.html` `fb0eb787…`) |
| **Status** | **NOT deployed. Deploy needs Thomas's own OK.** Gate 6/6 does not replace that OK. |

Thomas's rules (24 Oct): no redeploy until every Lantern Night bot has thumbs-up on the exact head; known game issues fixed first. A changed head resets votes. Never without Thomas: merge, deploy, edit main, resolve Sentry LANTERN-NIGHT-1, delete branches.
Note: any later commit on `main` (even docs-only) moves it off the gated SHA; deploy from the frozen branch/SHA.

## 4. Bots on this game
| Bot | Role here |
|---|---|
| Thomas Ennis | Owner. Only he approves merge, deploy, Sentry resolution |
| **Wisp** | Designer and developer lead. Builds, freezes heads, publishes approved builds, relays Thomas's decisions |
| **Lantern Night QA** | Exact-head verification (manifest, rebuild, sim, browser suites) |
| **Pip** | Player Persona Simulator: playtests, pacing, soft-lock and balance findings |
| **Ember** | Art director: art review and style sign-off |
| **Pixel Sage** | Pixel art: lint and grading, final pixel cleanup (12-colour cap, highlight and contrast rules) |
| **Ledger** | PM and docs: GDD, CHANGELOG, PRIORITIES, this file, gate tracking |
| **Freebuff** | External coding agent for heavy builds. Reads `tasks/freebuff-queue.md` (append-only), writes `tasks/freebuff-results.md`, both on `main` of the repo |
Other bots (Spark, Scribe, Critic, Scout, Cine, Vesper, Mira) work mainly on Far World. Spark's side-scroller battle idea for this game is parked in GDD §17.
Caution: `tasks/freebuff-queue.md` lives in this repo but also holds Far World entries (1: smuggling tests, still queued; 9 and 10: dropped). See FAR-WORLD-MASTER.

## 5. Open PRs (GitHub, checked live 27 Nov 11:00 PM EST)
| PR | State | Note |
|---|---|---|
| [#59](https://github.com/ennist1989-prog/lantern-night/pull/59) | open, mergeable | Ember art review (docs only, adds `tasks/art-review-tsubaki-bellkeeper-2026-11-27.md`). **Do not merge without Thomas.** Not a publish OK |
| [#40](https://github.com/ennist1989-prog/lantern-night/pull/40) | open, mergeable, **not merged** | P5 test suite and CI. Approved by Thomas to resolve; merge for CI is a post-deploy item |
| [#38](https://github.com/ennist1989-prog/lantern-night/pull/38) | open, **conflicting** | P3 Sentry release/tags. **Out of this redeploy** (Thomas, 27 Nov 10:06 PM EST) |
| #43–#47 | **already CLOSED** on GitHub | Earlier notes said "close pending Thomas"; live check shows closed. #28 is an issue, not a PR |

## 6. Sentry / DSN
- Org project `lantern-night` (lantern-night.sentry.io). Code: `src/sentry.ts`; DSN is **env-only** (`VITE_SENTRY_DSN`, `.env.example`) since PR #3.
- **Frozen build has no DSN** (QA verified none in the bundle). To get Sentry on, the deploy must be built with `VITE_SENTRY_DSN` set.
- **LANTERN-NIGHT-1** (TEMP `?sentry_test=1` verification error, 1 dev event, 19 Oct) is **unresolved by Thomas's choice**. Only Thomas resolves it.
- #38 (release SHA, drop localhost events, tags) is excluded from this deploy.
- Sentry connector authorization is still pending Thomas himself.

## 7. Open issues and art findings
GitHub open issues: **#27** and **#28** only. Ember's art verdicts, 27 Nov 10:59 PM EST (art only; **none block the redeploy at 4ecfbcd**; not a publish OK). Review file in PR #59.
1. **Tsubaki final repaint — [#27](https://github.com/ennist1989-prog/lantern-night/issues/27).** REPAINT NEEDED before release. Installed art is still the #25 placeholder. Layouts, alpha and `noFar` are correct. Pixel lint FAILs: 14 colours on the final strip (cap 12), highlights L*>90, weak neighbour contrast, faces cropped at the canvas edge. **Do not install parked `dropin-v2`** (24 colours, 1,363 semi-transparent px). Final pixels need Pixel Sage grading.
2. **Hollow Bell-Keeper battle — no GitHub issue exists.** Playable as pack art, not enough for a proper boss. Battler is Ninja Adventure GiantBlueSamurai and does not match Priest Ren on the map or in `faces/keeper.png`. Pack Attack/Hit/Charge sheets are not wired. No Cracked or Heart Break phase art. Separate from this is the **balance concern at L5** (Pip): sim L5 ≈65% Shift / 66% Auto (n=300, PRIORITIES P1), thin margin; a post-deploy check.
3. **[#28](https://github.com/ennist1989-prog/lantern-night/issues/28) is the Kappa Toll-Keeper battler** (not Bell-Keeper). Met at 4ecfbcd (384×64 six-frame strip plus phase strip, lint PASS); issue body is stale. Closable from the art side if Wisp agrees. **Not closed.**
- **Freebuff entries QUEUED** (Thomas approved Ember's list, 27 Nov ~11:00 PM EST; `main` commit `d852ba7`): **entry 12** Tsubaki final-form repaint (#27; parked `dropin-v2` forbidden; must pass pixel lint; results under "Entry A: Tsubaki repaint") and **entry 13** Bell Keeper art set matching Priest Ren (battle sprite, attack/hit, phase art; results under "Entry B: Bell Keeper art set"). Status `queued`, nothing delivered yet. Art only; no code changes, no deploy.
- Other post-deploy items: real-GPU checks, human-timed Ch1–3 run, Straw Hound ev36, Kenney CC0 credits or strip ~20 MB unused packs. Source: `PRIORITIES.md` tail.

## 8. Source documents (box paths, `/workspace/ln-pm/`)
- `GDD.md` (box: /workspace/ln-pm/GDD.md) — design truth (§18 = Thomas's 27 Nov decisions)
- `CHANGELOG.md` (box: /workspace/ln-pm/CHANGELOG.md) — dated history
- `PRIORITIES.md` (box: /workspace/ln-pm/PRIORITIES.md) — board and post-deploy list
- Handoff for Freebuff: `/workspace/lantern-night-handoff.md`

## 2026-11-27 11:16 PM EST — Lantern Night redeploy LIVE (logged by Ledger)
- Reported by Wisp as deployed on Thomas's own OK (Thomas's words not seen by Ledger directly). Live https://ennist1989-prog.github.io/lantern-night/ serves BUILD_SHA.txt = 4ecfbcd9856d70e585114da5d72bc3c349abcff5 (verified by Ledger 11:16 PM). gh-pages c16aaf9 (verified). Deploy run https://github.com/ennist1989-prog/lantern-night/actions/runs/46105830430 at 11:04 PM EST (per Wisp).
- Rollback tag pre-redeploy-2026-11-27 → e9203a0 (verified). main is now 360b0a0 (docs-only commits on top; not what is live).
- Sentry on in production; smoke event LANTERN-NIGHT-6 at 11:07 PM EST (per Wisp; not checked by Ledger). Main, #38 and fusion untouched (per Wisp).
- Follow-ups added: upload Sentry source maps; filter localhost events (change lives in #38). QA live smoke test on 4ecfbcd requested by Ledger.
