<!-- Append-only. Grok Bots/Thomas add one instruction per entry at the bottom (date, author, instruction); Freebuff reads and executes in order and never edits or deletes entries. -->

- date: YYYY-MM-DD
- from:
- task:
- status: queued

- date: 2026-11-22
- from: Thomas
- task: 1. Unit tests for the corridor slice's smuggling choice and corruption logic. If corruption ticks wrong or the choice does not register, the whole loop breaks.
  Where (needs confirming): searched the tree, all 8 issues, all 46 PRs, and commit messages for smuggling and corruption. No symbol, issue, PR, or commit uses those names, so do not invent a rate. Nearest corridor choice is the Ch.1 Far corridor to the Well, generated in tools/maps_village.py (Straw Warden touch events and the "Face the Warden" / "Not yet" choice, lines 196–218; Kaze gate at x=14, lines 251–258; https://github.com/ennist1989-prog/lantern-night/blob/0fce9c9e07aa5a9712f04329078e4d07ce1adbfd/tools/maps_village.py#L196-L218). Output lands in public/data/maps/map001.json via npm run data; do not hand-edit JSON. Choice runtime is src/game/interpreter.ts case 'choice' (line 40: the index is stored only when the command sets c.var, through GameState.setV, then c.br[i] runs; https://github.com/ennist1989-prog/lantern-night/blob/0fce9c9e07aa5a9712f04329078e4d07ce1adbfd/src/game/interpreter.ts#L40) and src/ui/message.ts choice() (line 125). Persistence is switches (case 'set'), self-switches (case 'self'), and variables (case 'var', line 44, += and -=). src/core/state.ts setV (line 59) floors to an integer and does not clamp; gold is the only clamped accessor. A different choice (Kappa toll, tools/maps_ch3.py around lines 369–374) is not this corridor. Confirm the smuggling/corruption rules before asserting a tick rate; if they live only outside this repo, say so in the results and test the engine rules above.
  Cover: the choice registers and the chosen branch's switches/variables survive a save and load (src/core/save.ts); corruption increments and decrements at the confirmed rate and only on the confirmed events; bounds and edges (0, max, negative delta, cancel index -1, missing c.var). Tests only, unless a minimal test hook is unavoidable. Do not change gameplay. There is no npm test script (open PR #40 proposes one and is not on main). Run with the existing setup: node tests/<name>.mjs (Playwright harness tests/lib.mjs, preview on 127.0.0.1:8099) or a plain node import if the logic can be loaded headless. npm run test:art, test:overlap, and test:willow are the only npm test scripts.
  Done when: the tests run in that setup and pass, or failing tests document real bugs. Write the result in tasks/freebuff-results.md.
- status: queued

- date: 2026-11-22
- from: Thomas
- task: 2. Scaffold a repo-side playtest path so playtests do not depend on the box browser Pip flagged. The scaffold is the headless probe in entry 11. Freebuff cannot fix the box. Do not deploy.
  Pip's repro (box environment, two failures). Searched issues, PRs, commits, and docs for 2026-11-08 through 2026-11-10 for load, blank, browser, and Pip: no Pip issue and no blank-page change in the tree. The nearby commit is gh-pages e9203a0, "Deploy 2026-11-08T00:37:07Z" (https://github.com/ennist1989-prog/lantern-night/commit/e9203a0). door-maze-fixes 71020df (2026-11-07) is a save-load test, not this blocker. (1) Nov 8–10: the box desktop Chrome refused localhost servers (ports 8145, 8150, 4187 returned connection refused) while curl got 200. file:// URLs were the workaround, and Playwright-driven browsers block file://. (2) Nov 15: 3D builds showed "WebGL failed to start". The host file /tmp/sand-box-browser-no-swiftshader forces stock GPU mode, which blocklists WebGL. Relaunch with SAND_BOX_BROWSER_NO_SWIFTSHADER=0 box-chrome; /tmp/sand-box-browser-gpu-mode-* should then read swiftshader. Software rendering is slow, and held keys do not register. Use discrete key taps.
  Where: tests/lib.mjs already launches headless Chrome with --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist and talks to http://127.0.0.1:8099/. Entry 11 builds on that. vite.config.ts serves 127.0.0.1:5173; preview defaults to port 4173. Thomas's rule: no redeploy until every Lantern Night bot approves. No npm run deploy, no gh-pages push, no edit to scripts/deploy.sh.
  Done when: the repro (both box failures, and that the repo has no separate load bug to patch) and the entry 11 PR link are posted in tasks/freebuff-results.md.
- status: queued

- date: 2026-11-22
- from: Wisp
- task: 3. Missing-asset checker tools/check-assets.mjs (plain Node, no new dependencies). Entries 3 and 4 are one checker; see the note on entry 4. Implement the scanner once and expose this path.
  What: scan every referenced image, audio, movie, and font, and check that each file exists with the right extension and exact case (GitHub Pages is case-sensitive). Also list unreferenced asset files. Missing refs include file:line. Case mismatches are failures. Dynamic template paths whose substitutions are a finite string list in the same file (CHARS, FACES, BGM, SE, ME, FX in src/scenes/boot.ts) are concrete refs; other templates are WARN.
  Where: this repo has no data/, js/plugins.js, js/plugins/, img/, audio/, movies/, or fonts/ at the root. Scan the trees that exist. Data is public/data/**/*.json (maps, events, database, spec). Load calls are Phaser this.load in src/scenes/boot.ts (setPath('assets/'), lines 18–45: https://github.com/ennist1989-prog/lantern-night/blob/0fce9c9e07aa5a9712f04329078e4d07ce1adbfd/src/scenes/boot.ts#L18-L45) and any other src/**/*.{ts,js} string ending in an asset extension. Resolve under public/assets/ (chars, faces, boss, mon, tiles, bgm, se, me, fx, fonts, ui) and public/data/. Fonts are public/assets/fonts/ (PixelifySans.ttf). Optional art is queued only when public/assets/manifest.json lists it (boot.ts OPTIONAL); do not flag a file the loader skips. Also accept RPG Maker-style data/*.json, js/plugins.js, and js/plugins/*.js, and img/, audio/, movies/, fonts/, if they appear later. Report any of those roots as absent rather than failing the run for a layout this repo does not use.
  Constraints: new branch freebuff/asset-checker based on 79eaf0035f479955d91159bf91aa0ade21b806d6 (game tree; origin/main 0fce9c9 only adds tasks/freebuff-queue.md and tasks/freebuff-results.md). Add the checker, a short tools/README note, and the entry-4 entry points (scripts/check-assets.mjs and the npm script). No game or data edits, no merge, no gh-pages, no deploy. One PR for entries 3 and 4 together.
  Done when: node tools/check-assets.mjs exits 0 on a clean tree and 1 if anything is missing. Post the full report (missing refs with file:line, case mismatches, unused files, branch and sha) in tasks/freebuff-results.md under "Wisp: asset checker".
- status: queued

- date: 2026-11-22
- from: Lantern Night QA
- task: 4. Asset-path checker scripts/check-assets.mjs, wired as npm run check:assets. Same program as entry 3.
  Note: entries 3 and 4 overlap, so Freebuff should do them as one checker that covers both the RPG Maker-style data/js paths and the Phaser src/ paths, whichever actually exist in the repo, and report to both Wisp and QA.
  What: scan src/ (TS/JS) and JSON/data for asset refs (Phaser load.* paths, plus string literals ending in an asset extension). Resolve them against public/ or the served assets folder (public/assets/, because boot.ts setPath is assets/ and vite.config.ts base is './'). Fail on missing files, case mismatches, and absolute paths starting with '/' (those break under the /lantern-night/ Pages subpath; live URL is https://ennist1989-prog.github.io/lantern-night/). Report dynamic or template paths as WARN, except finite literal lists resolved as in entry 3. Exit 0 on main when the tree is consistent, or list real problems in the PR.
  Where: src/scenes/boot.ts, src/**/*.{ts,js}, public/data/**/*.json, public/assets/**. package.json scripts (add "check:assets" only). Sentry DSN is env-only in src/sentry.ts (VITE_SENTRY_DSN); .env.example documents it.
  Constraints: one PR with entry 3 (branch freebuff/asset-checker from 79eaf00; the requested chore/check-assets name is the same PR, not a second one). No game code changes, no merge, no deploy. Never commit .env or the Sentry DSN. A deliberately broken path (a temp fixture or an in-memory argv, not a committed bad path) must exit non-zero. npm run build and the existing test scripts still pass.
  Done when: node scripts/check-assets.mjs and npm run check:assets match tools/check-assets.mjs; exit 0 on main or the PR explains each real problem; a deliberate break exits non-zero; build and tests still pass. Post the report and the PR link in tasks/freebuff-results.md under "Lantern Night QA: asset checker" as well as the Wisp heading.
- status: queued

- date: 2026-11-22
- from: Ledger
- task: 5. Read-only build health report on main.
  What: fetch origin/main, check out that SHA with no local edits, and run npm ci, npm run build, then every test or lint script that exists. Record the SHA, pass or fail for each step, and every TS error, warning, or failing test with file:line. Group findings as blocks a build / likely a gameplay bug / noise.
  Where: package.json on main (0fce9c9e07aa5a9712f04329078e4d07ce1adbfd when this entry was written; re-resolve before running). Scripts present: dev, build, preview, assets, data, art, test:art (python3 tests/test_frame_meta.py), test:overlap (node tests/overlap.mjs), test:willow (node tests/willow_sim.cjs), deploy. No lint script and no npm test. Record those as absent. Do not run npm run deploy. Other tests are node tests/<name>.mjs and need a preview server plus Chrome; run the three npm test scripts, and note the rest as not part of this pass unless they run cleanly without a deploy.
  Constraints: no code changes, no push, no PRs against main, no gh-pages, no npm run deploy. Read-only. If the tree is dirty afterward, discard the dirt and say so.
  Done when: the report is posted in tasks/freebuff-results.md under "Ledger: main build health", even if every step is clean.
- status: queued

- date: 2026-11-22
- from: Pixel Sage
- task: 6. Read-only pixel-art lint tools/pixel-lint/pixel_lint.py (Python 3, Pillow only; no other dependencies).
  What: scan a PNG folder and write tools/pixel-lint/report.md with PASS or FAIL per image. Rules: (1) unique opaque colour count, cap default 12, flag --max-colors; (2) hard-edged alpha only (0 or 255); (3) outline #141b1b wherever an edge pixel touches transparency; (4) brightest highlight at L* 90 or below (CIELAB), #ffe08a exempt; (5) no gold or yellow hues (about 40–60°, chroma over 30) except #ffe08a; (6) neighbouring unlike opaque pixels must have ΔL* of at least 8, and the report names the worst pair with coordinates. Include a README in tools/pixel-lint/ with the rules and flags.
  Where: default folders are the sprite and creature sheets that exist: public/assets/chars, public/assets/mon, public/assets/boss. Also accept --dir. Optional fixtures at /workspace/ln-color-test/sprites/ were absent when this entry was written; use them if that path is reachable, and skip them if it is not. Faces (public/assets/faces) are portraits; leave them out of the default scan.
  Constraints: never modify images or any file under public/assets/ or art/custom/. Art fixes are left to Pixel Sage and Ember. Pillow is the only allowed third-party import.
  Done when: the script runs from the repo root, report.md exists with PASS or FAIL per scanned PNG, and git status shows no image changes. Post the command, the report path, and pass/fail counts in tasks/freebuff-results.md under "Pixel Sage: pixel lint".
- status: queued

- date: 2026-11-22
- from: Ember
- task: 7. Read-only art contact sheets tools/art_contact_sheets.py (Python, Pillow only).
  What: for each existing image subfolder, render docs/art/contact_sheets/<folder>.png with each image at 2x nearest-neighbour and its filename and pixel size underneath. Also write docs/art/contact_sheets/palette_report.md (unique colour count per PNG; flag any semi-transparent alpha, meaning an alpha that is neither 0 nor 255).
  Where: there is no img/ directory. Map the requested names onto the folders that exist and skip the rest, saying which were missing: characters → public/assets/chars; faces → public/assets/faces; sv_actors → absent, skip; enemies → public/assets/mon and public/assets/boss (one sheet per folder); tilesets → public/assets/tiles; pictures → absent, skip. Do not scan art/custom/ unless a public/assets folder is empty.
  Constraints: never modify img/, public/assets/, or art/custom/. Run from the repo root. Pillow only.
  Done when: the script exits 0 from the repo root, the PNGs and palette_report.md exist, and git status shows no changes under public/assets/ or art/custom/. Post the command and output paths in tasks/freebuff-results.md under "Ember: contact sheets".
- status: queued

- date: 2026-11-22
- from: Scout
- task: 8. Steam tag snapshot tools/trend/steam_tag_snapshot.py (research tooling).
  What: for each tag, take the top 10 games by owners from the public SteamSpy tag endpoint, then Steam's public GetNumberOfCurrentPlayers for those apps. Tags: Liminal Space, Backrooms, Analog Horror, Psychological Horror, Dark Fantasy, Action RPG, Narrative, Pixel Graphics, FMV. Write tools/trend/snapshots/YYYY-MM-DD.csv (one row per tag plus its games: tag, rank, appid, name, owners, current players) and a tools/trend/README.md with the endpoints, the rate limit, and how to rerun. No keys and no logins.
  Where: new files under tools/trend/ only. Prefer the Python stdlib (urllib) so a clean checkout needs no extra install. The requests library is allowed if it is already importable; do not add a dependency file for it.
  Constraints: rate-limit to 1 request per second. Public endpoints only. No game code, no deploy. If an endpoint fails, write the CSV with an error column for that tag and exit non-zero rather than inventing player counts.
  Done when: the CSV for the run date lists every tag and that tag's top 10 games (owners and current players), and its path is posted in tasks/freebuff-results.md under "Scout: steam tag snapshot".
- status: queued

- date: 2026-11-22
- from: Cine
- task: 9. Headless staging screenshots. This needs the shared box at /workspace, not this repo. When this entry was written, /workspace/far-world-tools and /workspace/far-world-teddy-room were not on disk. Skip the whole task if either path is still unreachable, and post that skip in tasks/freebuff-results.md. Do not recreate the Teddy room inside lantern-night.
  What: add or run /workspace/far-world-tools/staging-shots/shoot.mjs (Playwright and Chromium) against /workspace/far-world-teddy-room/index.html. Capture 1280x720 PNGs at 7 beats (spawn, dresser photo in view, drawer opened, real tape playing in a 4:3 frame, reward face fully eased in, candle blow-out, Mom at the doorway), each with Photosensitivity Full and Off, so 14 PNGs named beat_mode.png. Output goes to out/<first 8 chars of the index.html sha256>/ with manifest.json (hash, timestamp, unreachable beats and why). Use debug hooks or URL params if they exist; otherwise simulated input and timed waits.
  Constraints: never edit the Teddy room files. No lantern-night game changes, no deploy, no gh-pages.
  Done when: the 14 PNGs and manifest.json exist under that out/ directory, or the results file says the shared box was unreachable. Post paths in tasks/freebuff-results.md under "Cine: staging screenshots".
- status: queued

- date: 2026-11-22
- from: Vesper
- task: 10. Photosensitivity spec rulings index. This needs the shared box at /workspace. When this entry was written, /workspace/far-world-flashbacks was not on disk. Skip if that path is still unreachable, and post the skip in tasks/freebuff-results.md. Do not copy the spec into this repo.
  What: read /workspace/far-world-flashbacks/vesper-photosensitivity-spec.md, sections 9.7–9.20 and section 10 only. Do not edit the spec. Write /workspace/far-world-flashbacks/spec-rulings-index.md: one row per ruling (section, date, question in one line, ruling in one line, numeric thresholds, build or hash, superseded by). Known supersessions to check while reading: §9.15 by §9.16, and §10.1–10.2 caps by §10.5. Then a "current effective rules" list (H1, H2, H3, H4, H4g, H5, weave, grain, fades, motion during fade legs, camera pans, Unrestricted). Every number in that list must be traceable to a quoted spec line. Numbers that cannot be traced go under "unverified".
  Constraints: the spec file is read-only. No lantern-night edits, no deploy.
  Done when: spec-rulings-index.md exists beside the spec with one row per ruling in §9.7–§9.20 and §10, the effective-rules list quotes a spec line for every number, and the path is in tasks/freebuff-results.md under "Vesper: photosensitivity rulings index".
- status: queued

- date: 2026-11-22
- from: Pip
- task: 11. Headless pacing probe tools/playtest/pacing-probe.mjs (Playwright, headless Chromium). This is the repo-side scaffold named in entry 2. Do not deploy.
  What: serve the built game on a local port, start a New Game, and use scripted inputs to play the opening through the first battle and the first save, whichever order the game actually uses. Record timestamps for title shown, control given, first dialogue, first encounter start and end, first item or level-up, and first save point. Also record every console error and every idle stretch over 15 s. Write qa/pacing-probe.json (those timestamps, console_errors, idle stretches) and a README beside the script (tools/playtest/README.md) describing the route, the port, and the timeout.
  Where: opening is map 2, Sachi's House, start at (6,6) (public/data/system.json start). The autorun intro is tools/maps_rest.py build_sachi (first dialogue, then item lantern). The first save is the square Lantern Post on map 1 at (16,16): tools/maps_village.py lines 125–131 set post_lit and run {'c':'autosave'} (https://github.com/ennist1989-prog/lantern-night/blob/0fce9c9e07aa5a9712f04329078e4d07ce1adbfd/tools/maps_village.py#L125-L131). The first battle is a Far-shore visible enemy after Shift (Q), not the Straw Warden. Reuse tests/lib.mjs (launch, newGame, press): Chrome executable /usr/bin/google-chrome, headless, --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist, viewport 816x624, base http://127.0.0.1:8099/ after npm run build and a static server. Discrete key taps only; held keys do not register under the software GL from entry 2. Fail loudly on an unscriptable input (throw with the scene name and the last timestamp) instead of hanging. Hard timeout 5 minutes, then exit non-zero.
  Constraints: only tools/playtest/ and qa/. No game data edits, no plugin edits (this repo has no js/plugins), no deploy, no gh-pages, no .env, no Sentry DSN. playwright-core is already a devDependency.
  Done when: node tools/playtest/pacing-probe.mjs exits 0 from a clean checkout, every recorded timestamp is non-null, and console_errors is []. Post the JSON path and the PR link in tasks/freebuff-results.md under "Pip: pacing probe", and cite that PR from entry 2's result.
- status: queued
