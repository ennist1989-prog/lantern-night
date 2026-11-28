# Pacing probe

Plays the opening of the built game headlessly and records when each beat
happens, so pacing can be discussed with numbers instead of impressions.

```bash
npm ci                 # once; playwright-core is already a devDependency
node tools/playtest/pacing-probe.mjs
```

That builds the game, serves `dist/` on `127.0.0.1:8099`, drives Chromium
headlessly, and writes `qa/pacing-probe.json`. It exits 0 only when every
timestamp below is filled in and `console_errors` is empty; a step it cannot
script, a missing browser, a failed build or the hard timeout exits non-zero.

`CHROME=/path/to/chrome` picks the browser (same variable as `tests/lib.mjs`;
default `/usr/bin/google-chrome`). `tests/lib.mjs` had to be touched for that:
line 3 already falls back to the same default.

The probe reuses `tests/lib.mjs`'s `launch` and `press`. That harness pins
`walkSpeed: brisk, textSpeed: 2` for its own timings, so the probe clears the
stored settings and reloads once before starting, to measure the defaults a
first-time player gets. Pass `--harness-pace` to keep the harness's brisk pace
instead; `settings` in the JSON always says which one a run used.

## The route

Start is `public/data/system.json` (`map 2, 6,6`); the probe walks it with key
taps only, one tile per tap, waiting for each step to finish.

1. **Title** — press Enter on New Game.
2. **Intro** (map 2, Sachi's House) — the autorun event at (6,7) runs the
   narration, Granny Sachi's dialogue and the Lantern item; Enter is pressed
   while a window is open until `intro_done` is set and the map is free.
3. **Door** — walk to (6,9); its touch event transfers to map 1 at (7,15).
4. **Lantern Post** (map 1, 16,16) — path to a neighbouring tile, face it, press
   Enter. Lighting the post runs `autosave`, which is the first save; read the
   tip through.
5. **Shift** — Q, then walk toward the nearest visible Far-Shore enemy (map 1,
   aggro 4) until it touches the party and the battle starts.
6. **Battle** — Enter every ~250 ms, which walks Fight → Attack → target; the
   run ends when the Battle scene stops.

The walk uses a breadth-first search over the map's own `tileFree`, so it obeys
the same collision, `dyn` rules and blocking events the game does, in whichever
realm the party is standing in.

## What lands in `qa/pacing-probe.json`

| field | meaning |
|---|---|
| `timings_ms` | `title_shown`, `new_game`, `first_dialogue`, `first_item` (the Lantern), `control_given`, `first_save`, `first_encounter_start`, `first_encounter_end`, `first_item_or_levelup` — all measured from process start |
| `missing_timestamps` | anything the run failed to record (must be empty) |
| `console_errors` | `console.error` and `pageerror` entries; Sentry requests are aborted so probe runs are not reported |
| `idle_stretches` | every stretch over 15 s with no visible change (scene, map, position, message, save count, HP, Lumen), with scene, map, tile and duration |
| `battle_trace` | per-second party/foe HP during the fight, so round pacing is visible |
| `first_encounter_outcome` | what the map scene resolved the fight as (`win` / `lose` / `escape` / `calm`) |
| `route` | the beats actually reached, with timestamps |
| `settings` | the game settings the run used |
| `result` | `pass` or `fail`, plus `error` when a step threw |

## Notes

- **Key taps only.** Held keys do not register under the software GL
  (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`), so
  every movement input is a short press followed by a wait for `player.moving`
  to clear.
- **Settings are the game defaults** (`walkSpeed: classic`, `textSpeed: 1`) unless
  `--harness-pace` is passed. The probe reads `Settings.data` back into the JSON,
  so a run made with other settings is self-describing instead of ambiguous.
- **Two page-side hooks, no game changes:** `SaveManager.auto` is wrapped to
  count saves, and the Map scene's `startBattle` is wrapped to keep the battle
  result. Everything else is observation.
- **Not a pass/fail gate on gameplay.** The first Far-Shore wisp is a real
  fight: on a fresh save, solo level-1 Mio can lose it, and the probe records
  that as `lose` rather than retrying. The timestamps are still valid; treat
  `first_encounter_outcome` as data, not as a bug in the probe.
- Flags: `--port`, `--base`, `--out`, `--timeout` (default 300000), `--no-build`,
  `--harness-pace`.
