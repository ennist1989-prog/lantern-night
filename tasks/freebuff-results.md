<!-- Append-only. Freebuff adds one entry per completed task at the bottom (date, task ref, status: done/blocked/failed, short result); Grok Bots read this instead of messaging Thomas. Never edit or delete past entries. -->

- date: YYYY-MM-DD
- task ref:
- status: done | blocked | failed
- result:

- date: 2026-11-23
- task ref: entry 5 (Ledger: main build health)
- status: done
- result: Read-only pass on 79eaf0035f479955d91159bf91aa0ade21b806d6 (= origin/main b58f51b minus the two tasks/*.md files, so the game tree is identical to main). No code changes, no push, no PR, no deploy; working tree left as found (only untracked tasks/*.md and this chat's earlier docs work).
  npm ci: PASS (exit 0, 0 vulnerabilities). npm run build: PASS (exit 0, 987ms, dist/assets/index-BzMUJ_x5.js 1,601.72 kB / 433.53 kB gzip; no TS errors, no warnings, chunkSizeWarningLimit 2000 not hit).
  npm run test:art: PASS (exit 0; "OK: all boss frame layouts as expected; bell_keeper = 96x48 x6"; 4 "WARN frame_meta:" lines are intentional negative fixtures).
  npm run test:willow: PASS (exit 0; WILLOW SIM ALL PASS).
  npm run test:overlap: BLOCKED BY ENVIRONMENT, not a code failure. Fails at tests/lib.mjs:3 with "browserType.launch: Failed to launch chromium because executable doesn't exist at /usr/bin/google-chrome". This sandbox has no Chrome/Chromium and no playwright browser cache; every tests/*.mjs harness needs it, so no browser test can run here.
  Absent scripts (recorded, not failures): lint, npm test. No tsc --noEmit script either, but vite build type-checks the imported graph (tsc is a devDependency).
  Blocks a build: none. Likely a gameplay bug: none found by this pass. Noise: test:overlap environment gap only.
  Also observed while there: package.json is the only JSON touched in this session's docs work; the tree has no tasks/ directory on main's parent, confirmed by git diff --name-only HEAD FETCH_HEAD (2 files).

- date: 2026-11-23
- task ref: entries 3 + 4 (Wisp and Lantern Night QA: asset checker), one program as instructed
- status: done (code + local verification); PR not opened - see the last line
- result: One scanner covers both entries. New files: tools/check-assets.mjs (implementation, plain Node ESM, no dependencies), scripts/check-assets.mjs (entry-4 entry point, 3 lines), tools/README.md (short note), and the "check:assets" npm script. No game, data, art or config edits.
  What it resolves, and from where: src/scenes/boot.ts literal loads; the finite lists (CHARS, FACES, FX, BGM, SE, ME, the 4 base tiles and the 3 manifest-gated ones) including the `CHARS.filter((c) => !isOpt('chars', c)).forEach(...)` and `for (const c of OPTIONAL.<kind>)` shapes, so a name in OPTIONAL is REQUIRED only when public/assets/manifest.json lists it (undelivered art is an INFO, not a failure); mon/<id>.png and boss/<id>.png derived from public/data/spec/enemies.json and bosses.json; boss phase strips, required only when manifest.boss lists them (boot.ts:33-41); the 7 lazy chapter tracks from src/core/audio.ts LAZY, which boot.ts never preloads; and every asset-extension path elsewhere in src/ (fonts/PixelifySans.ttf via the FontFace url() in main.ts:25, fx/*.png, ui/windowskin.png). Comments are stripped first, so a path named in prose is not treated as a load. Absolute paths ("/..." - breaks the /lantern-night/ Pages subpath) are failures. A template it cannot resolve is a WARN, never a pass.
  Clean tree: `node tools/check-assets.mjs` and `npm run check:assets` both exit 0, 259 references checked, no missing refs, no case mismatches, no absolute paths.
  Deliberate break (temp copy via --root, no committed bad path): deleting chars/mio.png gives "FAIL src/scenes/boot.ts:26: chars/mio.png -> missing file"; renaming se/bell.ogg to se/Bell.ogg gives "FAIL ... case mismatch, on disk: Bell.ogg (GitHub Pages is case-sensitive)"; appending a '/assets/...' load to main.ts gives "FAIL ... is an absolute path". Exit 1 in each case, 0 when restored.
  Unreferenced files on main (INFO, entry 3 asked for the list): boss/gspirit.png, boss/tengu.png, chars/{hound,hound2,willow_final}.png, faces/{hound,hound2,willow_final}.png. None is named by a boot.ts list or by a spec key, so nothing loads them. Flagging for Wisp: art/custom ships chars/willow_final.png and faces/willow_final.png but CHARS has no "willow_final" and FACES has only willow_final_calm / willow_final_strained, so that art never loads; hound/hound2 are enemy ids (mon/ is used, chars/ copies are unused). Not fixed here - entries 3/4 forbid game and data changes.
  RPG Maker-style roots absent and reported, not failed: data/, js/plugins.js, js/plugins/, img/, audio/, movies/, fonts/.
  Regression: npm run build exit 0, npm run test:art exit 0 after the change; no public/assets file was modified (git status shows only the new files, tasks/, and this chat's earlier ASSETS.md/README work).
  Not done: no branch, commit or PR. Pushing was not authorised in this session, so entries 3 and 4 are complete as code plus this report and need a push/PR from a session that is allowed to open one. The requested base 79eaf00 is this working tree exactly (git diff HEAD..origin/main = the two tasks/*.md files only).

- date: 2026-11-23
- task ref: ledger note on entries 1, 2, 6-11 (not started)
- status: blocked
- result: Triage only, measured in this environment, so the queue owner knows what can run where. Runnable here: 6 (pixel lint, Pillow 12.3.0), 7 (contact sheets, Pillow), 8 (Steam snapshot - steamspy and api.steampowered.com both answer 200). Blocked: 9 and 10 (no /workspace/far-world-tools, /workspace/far-world-teddy-room, /workspace/far-world-flashbacks or /workspace/ln-color-test/sprites; entries 9/10 say to skip and report, and each has its own blocked result entry now); 11 and every tests/*.mjs harness (no /usr/bin/google-chrome and no playwright browser cache, chromium.launch fails); 2 (depends on 11 and on the box, and both box failures are outside this repo). Entry 1 needs the smuggling/corruption rules confirmed first: neither name exists anywhere in src/, public/data or tools/, which matches what the entry already says, so there is no rate to test yet.

- date: 2026-11-23
- task ref: entry 9 (Cine: staging screenshots)
- status: blocked
- result: Skipped exactly as the entry directs ("Skip the whole task if either path is still unreachable"). Probed /workspace/far-world-tools and /workspace/far-world-teddy-room: both are absent here (test -e reports no such file), so /workspace/far-world-tools/staging-shots/shoot.mjs cannot be run and /workspace/far-world-teddy-room/index.html does not exist to shoot. Created nothing, including no out/<sha>/ directory and no manifest.json. The Teddy room was not recreated inside lantern-night, and no lantern-night file was touched for this entry. Re-runnable unchanged once both paths exist on the box.

- date: 2026-11-23
- task ref: entry 10 (Vesper: photosensitivity rulings index)
- status: blocked
- result: Skipped exactly as the entry directs ("Skip if that path is still unreachable"). Probed /workspace/far-world-flashbacks: absent here, so vesper-photosensitivity-spec.md could not be read, and /workspace/far-world-flashbacks/spec-rulings-index.md was not written. The spec was not copied into this repo and no lantern-night file was touched for this entry. Nothing was inferred: every number in that index has to be traceable to a quoted spec line, and there is no spec here to quote, so writing it would have meant inventing thresholds. Re-runnable unchanged once the path exists.

- date: 2026-11-23
- task ref: entry 6 (Pixel Sage: pixel lint)
- status: done
- result: tools/pixel-lint/pixel_lint.py (Python 3, Pillow only, read-only), tools/pixel-lint/README.md (rules + flags) and tools/pixel-lint/report.md. Run from the repo root: `python3 tools/pixel-lint/pixel_lint.py`, 115 PNGs in public/assets/chars + mon + boss in 0.9 s, exit 0 with the verdict in the report (`--fail-on-fail` makes any FAIL exit 1 - verified, exit 1). Faces are portraits and excluded by default, as instructed; `--dir public/assets/tiles --out ...` works (7/7 FAIL there) and `--max-colors` sets rule 1's cap.
  Verdict: 4 PASS / 111 FAIL. By rule, counting images that break it: 3 outline 71, 4 highlight 83, 5 gold 42, 6 neighbour contrast 47, 1 palette 4. Rule 2 (alpha) passes everywhere: no image has alpha other than 0/255.
  Rule 3 is not a wrong-hex artefact: #141b1b is present in 114 of the 115 scanned files and is by far the most common colour on pixels that touch transparency (54,275 of ~57,000 such pixels), so the 71 failures are genuine mixed outlines. Samples: chars/child.png 56 edge pixels in #2b212a; chars/eggboy.png 118 in #cf736d.
  Other concrete failures: rule 4, chars/child.png has #ffffff at L* 100 and chars/eggboy.png #fce2ca at L* 91.4 (cap 90); rule 5, chars/child.png #ef914f is hue 59 / chroma 58; rule 6, worst neighbour pair overall dL* 2.9 (min 8) at chars/eggboy.png (34,5) #965340 against (34,6) #5f7160. Every failure in the report names coordinates or colours so Pixel Sage and Ember can act on it.
  No image or art file was modified (git status clean for public/assets and art/custom); the tool only reads.

- date: 2026-11-23
- task ref: entry 7 (Ember: contact sheets)
- status: done
- result: tools/art_contact_sheets.py (Python 3, Pillow only) renders docs/art/contact_sheets/{chars,faces,mon,boss,tiles}.png: every PNG at 2x nearest-neighbour over a checkerboard, with its filename and pixel size underneath. Requests mapped onto the folders that exist: characters -> chars (40), faces -> faces (48), enemies -> mon (60) and boss (15) as one sheet each, tilesets -> tiles (7). sv_actors, pictures and img do not exist here and are reported as skipped in palette_report.md and on stdout, not created.
  docs/art/contact_sheets/palette_report.md lists all 170 PNGs with size, unique colour count (fully transparent pixels ignored) and a semi-transparent-alpha column, plus a summary line. Result: 0 of 170 files have an alpha other than 0 or 255, so nothing is flagged. Paths and counts are printed on every run; `--out` and `--scale` are flags (default 2x).
  Nothing under public/assets/ or art/custom/ was modified (git status clean for both).
