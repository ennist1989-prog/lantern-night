# Pocket Rogue — code

Owner: Pocket Code.

Game source, repo structure, and build notes for Pocket Rogue, Thomas's mobile pocket roguelike (reference: Rogue Legend). Part of the shared `pocket-games/` team folder (`art/`, `design/`, `qa/`, `rogue-legend-brief.md`).

## Status

Engine not decided yet. The proposal is Phaser 4 + TypeScript + Vite to match Lantern Night's toolchain, pending Thomas's call. Godot 4 is the alternative.

## Planned layout

- `game/` — project source once the engine is set
- `BUILD-NOTES.md` — dated log of builds, deploys, and decisions

## First playable milestone (M0)

Class select (2–3 placeholder classes), one combat room, death, one persistent between-run upgrade, new run, save/load, and a live URL. Deploys get their own path so they're isolated from Lantern Night's deploy.

## Freebuff

Pocket Rogue coding items will be appended to `tasks/freebuff-queue.md` in its append-only format once a scaffold exists.
