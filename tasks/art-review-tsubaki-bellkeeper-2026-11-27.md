# Art review: Tsubaki final form and the Hollow Bell-Keeper

**Date:** 27 November 2026, America/New_York  
**Author:** Ember (art director)  
**Reviewed commit:** `4ecfbcd9856d70e585114da5d72bc3c349abcff5` (`main`, frozen redeploy candidate `frozen/ln-redeploy-2026-11-27`)  
**Remote:** `https://github.com/ennist1989-prog/lantern-night.git` (confirmed)  
**Issues:** [#27 Tsubaki: final repaint before release](https://github.com/ennist1989-prog/lantern-night/issues/27). There is **no open GitHub issue** whose title or body asks for a Bell-Keeper battle or battler remake. The other open art issue is [#28 Kappa Toll-Keeper needs a proper battler](https://github.com/ennist1989-prog/lantern-night/issues/28); its request is already met on this frozen commit (see §4). Bell-Keeper findings below were reviewed because Thomas asked for them before release.  
**Scope:** read-only review. This file is documentation only. Nothing under `art/`, `img/` or `public/` was modified.  
**Comparison images** (box only, not in this PR): `/workspace/ln-tsubaki-bellkeeper-art/`

**Art sign-off only. Not a publish OK.** Publishing still needs Thomas's own words.

---

## Verdicts

| Subject | Verdict | One-line reason |
|---|---|---|
| **Tsubaki final form** (and the rest of the #25/#27 set: forge, map sheet, four faces) | **Repaint needed. Not release-ready.** | Installed art is still Ember's #25 placeholder. Layout, plum exception and `noFar` are correct, but the work is placeholder quality and fails Pixel Sage's 12-colour cap, highlight ceiling and neighbour-contrast rules. |
| **Hollow Bell-Keeper** | **Playable as pack art, not sufficient for a proper boss battle.** | The old 48 px frame-cut is **fixed**. Idle loops as a whole body. The battler is still the Ninja Adventure GiantBlueSamurai, which does not match Priest Ren / the map `keeper` face, has no wired attack/hurt, and has no Cracked or Heart Break phase art. Gameplay and balance are not this review. |
| **Parked dropin-v2 Tsubaki** (`/workspace/lantern-night-art/dropin-v2/`) | **Do not install.** | Still parked from the 7 November 2026 read-only audit. More rendered, but 24 colours, 1,363 semi-transparent pixels on the final strip, and off-palette colours. |

---

## 1. Tsubaki — review of the installed set

### 1.1 What was reviewed

Issue #27 lists the #25 placeholder set. All seven files are still those originals on `4ecfbcd` (byte-identical to `art/custom/` and to `public/assets/`).

| File | Size / layout | SHA-256 | Unique opaque colours | Semi-transparent px |
|---|---|---|---|---|
| `art/custom/boss/tsubaki_final.png` | 384×64, six 64×64 frames | `61d9291046d463aabf4338787085fe77605a89ea6df41c57564ba6a6845503ca` | 14 | 0 |
| `art/custom/boss/tsubaki_forge.png` | 384×64, six 64×64 frames | `1a49578f14be4bd24d88fcec914cc2be398a157dcd2236f9fceed0e888b375c7` | 13 | 0 |
| `art/custom/chars/tsubaki.png` | 64×112 (4×7 of 16×16) | `b8b1d115691aac0de7485c8238639da9dbeff02fcacab5156735738418b092f4` | 14 | 0 |
| `art/custom/faces/tsubaki.png` | 38×38, opaque `#141b1b` bg | `09df5bbb1d9fc592cefe43151a89773904d2faedcf71f844bc1bb8bf62898ab4` | 11 | 0 |
| `art/custom/faces/tsubaki_anger.png` | 38×38, opaque `#141b1b` bg | `ef00c67e590879470a62f89bacee6f828714fe63b813267aba11df709a406761` | 12 | 0 |
| `art/custom/faces/tsubaki_grief.png` | 38×38, opaque `#141b1b` bg | `57591ceecbc95aa4a55806aa71c17b813a59442e795492b620fe944d66fd8014` | 12 | 0 |
| `art/custom/faces/tsubaki_resolve.png` | 38×38, opaque `#141b1b` bg | `7d5f59deaa90a38ed3c24a9b38c82fa556cf814cfc3773ef9fe4bf6a8867f56b` | 12 | 0 |

`public/assets/boss/meta.json` → `tsubaki_final` / `tsubaki_forge`: `{fw:64, fh:64, n:6, sc:1}`. Layout still matches #27, so `npm run test:art` frame checks should keep passing if the remaint keeps these sizes.

### 1.2 Style sources used

- Palettes: `lantern-night-art/palettes/near-measured.hex` and `far-measured.hex` (67 colours each).
- Pixel Sage: `lantern-night-art/pixel-consultant-specs-v1.md` (E1 8–12 body colours, E3 1-bit alpha, P8 `noFar` for Tsubaki, highlight L\* ≤ 90, neighbour dL\* ≥ 8, 1 px `#141b1b` outline). Repo lint: `tools/pixel-lint/report.md` on this commit (Tsubaki final/forge/char all **FAIL**).
- Design and prompts: `lantern-night-art/tsubaki-asset-pack.md` and `style-guide-v1.md`.
- Earlier Ember audit: `lantern-night-art/dropin-v2/READ_ONLY_SCOPE_AUDIT_2026-11-07.md` (v2 parked; installed art is the v1 placeholder, not v2).
- Comparison bosses on the same commit: Straw Warden and Kappa Toll (both 384×64 custom strips). Kappa already passes lint; Tsubaki does not.

### 1.3 What is already correct (keep on the remaint)

- **Identity is on brief**, unlike the pre-#25 Mio copy. Final form reads as a tall floor-length woman with a pole lantern, plum robes, a chest name-seal, sleeve tags and a wilted camellia. Forge vs final is already differentiated: indigo travelling cloak and an unlit, intact lantern (forge) vs no cloak, more tags, a cracked lantern with pale light (final). Keep that split.
- **`#503060` plum** is used, and it is the only colour outside `near-measured.hex`. Issue #27 and the asset pack both approve it for Tsubaki only.
- **Every other opaque colour is in `near-measured.hex`.** No off-palette leftovers on the installed set.
- **1-bit alpha** on battlers and the map sheet (alpha 0 or 255 only). Battler and map outer outlines are `#141b1b`.
- **`noFar` / `NO_FAR` are on**, tint is cleared in `SPRITE_OVERRIDES`. In the Spirit World she keeps true plum, which reads clearly against the Far teal. Do not bake a Far multiply and do not reintroduce the old `#503060` tint (it would crush the painted plum).
- Face variants share hair, camellia, plum collar and skin with the body. Expressions are distinguishable: neutral, open-mouth anger, closed-eye grief, firm resolve (resolve also shows a small lantern).

### 1.4 Why it is not release-ready

1. **Placeholder quality.** The battler is a flat, blocky stand-in: 2–3 value steps, almost no fabric or hair structure, a 4–5 px face, and an idle loop that barely moves (tags and lantern bob about 1 px). Next to Kappa Toll and the Straw Warden on the same 64×64 / ×3 battle stage, she reads as unfinished. Faces are cruder than Mio's 38×38 (less shade, harder edges, the resolve lantern is a different scale from the battler pole-lantern). The 16 px map sheet loses the pole almost completely; the silhouette rule from the asset pack (pole + long hair, not Mio) is only barely met.
2. **Pixel Sage / lint failures** (`tools/pixel-lint/report.md`, rules in the consultant specs):
   - Rule 1: final 14 colours and forge 13 colours against the 12-colour cap (outline counts; FX layers do not). The map sheet is also 14.
   - Rule 4: highlight ceiling. Installed lights `#e3f1f5` (L\* 94.2), `#f2eaf1` (93.5) and `#fce2ca` (91.4) are in the measured Near palette and in the asset-pack list, but they fail L\* ≤ 90. The remaint should step paper and skin down (for example paper shade `#9ba7aa` / `#d2c9c9`, skin `#f8cea5` at L\* 85.4) unless Pixel Sage grants a measured-pack-white exemption.
   - Rule 6: neighbour contrast. Worst pair on the final strip is `#4a5270` vs `#7b473c` at dL\* 0.75 (indigo lining against the camellia dark). Interior ramps need a wider value gap.
3. **Face crop.** All four faces are fully opaque with a `#141b1b` field, as #27 asked, but the bust hits the right and bottom edges (bottom-right corner is `#503060`, not background). Keep a 1 px `#141b1b` margin.
4. **Budget and readability at native and 3×.** At native 64 px the silhouette is readable; at 3× (in-game) the idea is clear but the paint is not up to the other custom bosses. At 16 px on the map, the lantern pole is the first thing to strengthen.

### 1.5 Parked dropin-v2 (do not ship)

The November 7 audit still holds. v2 is a more rendered drawing of the same design, not a release candidate:

- `tsubaki_final`: 24 unique opaque colours, **1,363 semi-transparent pixels**, off-palette `#2b2838`, `#6c7598`, `#74426f`, plus pack whites `#ffffff` / `#ffe7cf`.
- Faces and the map sheet add `#deb1a6` (also off-palette). Anger grows horn-like hair spikes, which breaks the "sorrowful, not monstrous" lock.
- No Pixel Sage READY exists for this drop. Do not install it as a shortcut. A remaint may study its silhouette and tag orbit, then be hand-pixeled onto the approved palette with 1-bit alpha.

### 1.6 Remaint: concept prompts (reference only)

AI output is **concept reference only**. Final pixels must be hand-cleaned to the spec in §1.7 and **graded by Pixel Sage** before any art YES. Do not ship diffusion pixels, and do not train or typify from Thomas's private house photos.

**Character lock** (paste into every prompt):

> TSUBAKI: tall slender woman, late 30s, long straight black-indigo hair tied low with a red cord, wilted dark-wine camellia behind the left ear, layered plum robes with an indigo inner layer and pale lilac lining, wine obi, dozens of small white paper name-tags tied with red cords hanging from wide sleeves, tall wooden pole with a cracked paper lantern lit by cold violet-white light, 6–8 paper tags orbiting her, calm sorrowful face, not monstrous, not smiling-cruel

**Approved body palette** (≤12 colours including outline; `#503060` is the only extra):

`#141b1b #3b3643 #4a5270 #503060 #a5608b #d3a2c0 #8f3e56 #7b473c #f8cea5 #d2c9c9 #9ba7aa #695953`

Do not put `#c9a0ff` or `#e3f1f5` in sprite pixels. Hollow lantern light is an in-engine glow sprite (ADD blend), not painted alpha.

**Midjourney** (concept / turnaround / face roughs, not final pixels):

```
character design of [TSUBAKI LOCK], front-view JRPG boss portrait, floor-length robes, readable silhouette,
tall lantern pole in her right hand (screen-left), name-seal at her chest, flat cel shading, limited palette
#141b1b #3b3643 #4a5270 #503060 #a5608b #d3a2c0 #8f3e56 #f8cea5 #9ba7aa, top-left light, plain grey background,
melancholic, Ninja Adventure / 16-px RPG style, no glow halo
--ar 3:4 --raw --stylize 75 --seed 503090 --sw 60
--no text, watermark, signature, blur, anti-aliasing, gradient background, 3d, photo, gore, horns, demon,
soft shading, painterly, extra limbs, cropped, multiple characters, sexualized, glowing red eyes, mosaic
```

For a turnaround sheet use `--ar 16:9 --seed 503060`. Face roughs: `--ar 1:1 --seed 503061` (neutral), `503062` (grief), `503063` (anger), `503064` (resolve).

**Stable Diffusion** (SDXL Base 1.0 + `nerijs/pixel-art-xl` LoRA at 1.2, drop to 0.9 if burned; fp16-fix VAE; no refiner; DPM++ 2M Karras; 25 steps; CFG 6; 1024 px, then ÷8 nearest-neighbour toward a 128 px study, never as the shipped 64 px). Seed 503090 for the final battler.

Positive: `pixel art, [TSUBAKI LOCK], front-view RPG boss battler, 64 pixel canvas, 1px dark outline, flat colors, limited palette, top-left light, transparent background, idle pose`

Negative: `3d render, realistic, photo, blurry, anti-aliasing, soft shading, gradient, painterly, noise, dithering, jpeg artifacts, text, letters, watermark, signature, frame, border, extra limbs, extra fingers, cropped, multiple characters, monster, horns, demon, gore, sexualized, cleavage, glowing red eyes, halo, glow, semi-transparent, aura`

### 1.7 Remaint: pixel spec (this is the ship target)

| Item | Spec |
|---|---|
| Final battler | `art/custom/boss/tsubaki_final.png`, **384×64**, six **64×64** frames, 150 ms idle (engine default). Keep `SPRITE_OVERRIDES` `frame:[64,64], n:6, tint: None, noFar: True`. |
| Forge battler | `art/custom/boss/tsubaki_forge.png`, same layout. Cloak on, lantern unlit and intact, fewer tags, composed pose. |
| Map sheet | `art/custom/chars/tsubaki.png`, **64×112**, 4 columns × 7 rows of 16×16, same baseline and centre column as `chars/mio.png`. Pole must read at 16 px (a pale 2×2 lantern on a 1 px stick). |
| Faces | 38×38 RGBA, bust only, **opaque `#141b1b` background** (keep #27), 1 px `#141b1b` outline, 1 px margin, no edge crop. Shown at ×3 = 114 px. |
| Palette | ≤12 unique opaque colours including outline. `near-measured.hex` plus `#503060` only. No dither. Highlights L\* ≤ 90 unless Pixel Sage exempts a named pack swatch. Adjacent unlike pixels dL\* ≥ 8. |
| Outline | 1 px `#141b1b` outer contour, never 2 px. Inner lines use `#3b3643` or the ramp shadow. |
| Alpha | 1-bit (0 or 255) on every shipped sheet. No painted glow. |
| Shading | Top-left light. Per material: base + 1 shadow + 1 highlight max. No pillow shading. |
| Realm | Do not bake a Far recolour. `noFar` stays on so she reads in true plum in the Spirit World. |
| Idle (final) | Orbiting tags step one position per frame; hair and sleeves drift 1 px; lantern flicker on 2 frames. Silhouette stays put; move interior clusters first. |
| Grade | Pixel Sage grades the final pixels. Ember gives an art YES or NO after that grade. Thomas publishes. |

**Face-variant list** (keep these four filenames so `FACES` / `OPTIONAL` in `src/scenes/boot.ts` do not change):

| File | Expression | Notes |
|---|---|---|
| `faces/tsubaki.png` | Neutral / offer | Calm, tired, kind. Not a sneer. Same hair part and camellia as the body. |
| `faces/tsubaki_anger.png` | Anger | Tight mouth or a short cry; no horns, no monstrous hair. |
| `faces/tsubaki_grief.png` | Grief | Closed or downcast eyes; she is holding on, not theatrical. |
| `faces/tsubaki_resolve.png` | Resolve | Firm mouth. If a lantern appears, it must match the battler (pole lantern, cracked paper, cold light), not a separate prop language. |

Optional later (not required to close #27): `tsubaki_final_p3.png` kneeling / lantern to chest, only if Wisp adds a phase-strip hook.

Install via `art/custom/` and `npm run art`. Do not hand-edit `public/assets/`.

---

## 2. Hollow Bell-Keeper — existing art and gaps

### 2.1 What exists on `4ecfbcd`

| Asset | Path | Size | Role |
|---|---|---|---|
| Battler idle (shipped) | `public/assets/boss/bell_keeper.png` | 576×48 | Byte-identical to pack `Actor/Boss/GiantBlueSamurai/Idle.png`. SHA-256 `6e9b02eeda3cfc07ac33dd1ca6d682c17333f4356769f34d7ddd8805f85b6029`. **No file in `art/custom/boss/`.** |
| Meta | `public/assets/boss/meta.json` | `{fw:96, fh:48, n:6, sc:1}` | The old 48×48 × 12 cut-in-half bug is **fixed** (`SPRITE_OVERRIDES` `frameExact: True`). Idle now shows a whole body. |
| Map NPC | `public/assets/chars/keeper.png` | 64×112 | Pack `Character/Master`. Red-and-white elderly shrine priest. SHA-256 `3d6b256d939e79943d3fd217429d06f36e8a77f243b5d63efb41f024acc143ae`. |
| Dialogue face | `public/assets/faces/keeper.png` | 38×38 | Same priest: white hair, moustache, red-and-white robes, opaque dark ground. SHA-256 `123248ae36db8956197323284a34707a33c958d7cc816a35c3882e8abe479542`. Used on the summit as both "Bell-Keeper" and, after the fight, "Priest Ren" (`tools/maps_rest.py`). |
| Pack extras (in `_dl`, not wired) | `GiantBlueSamurai/AttackLeft.png`, `AttackRight.png` | 384×96 = 4× **96×96** | Slash attack. Not referenced by the battle scene. |
| | `Hit.png` | 384×48 = 4×96×48 | Hurt, including a full red flash on frame 1. Not wired. |
| | `ChargeLeft.png` / `ChargeRight.png` | 288×96 = 3×96×96 | Charge. Not wired. |
| | `Walk.png` | 576×48 = 6×96×48 | Walk. Not used as the map sheet. |
| | `Faceset.png` | 38×38 | Blue-samurai pack face. **Unused.** Boot loads `faces/keeper.png` (the priest). |
| Near tint | `bosses.json` `sprite.tint: "#8090a8"` | — | Multiplies the already-teal pack sprite and muddies it. No `noFar`; Far uses the engine `#cfe8ff` multiply. |

Lint on the shipped idle: 9 colours (under the cap), 0 semi-transparent pixels, **61 unoutlined edge pixels**, `#f2eaf1` at L\* 93.5, a gold/yellow flag on `#ef914f`, worst neighbour dL\* 0.47 (`#79b8ce` vs `#d3a2c0`). PASS on colour count only.

### 2.2 Can this support a real boss battle?

**Idle: yes, technically.** The six 96×48 frames loop in `BattleScene.bossAnim` (150 ms). The body is no longer cut in half. At ×3 the pack samurai is readable.

**Attack / hurt: not in the engine.** The battle scene only loops the idle strip. Pack Attack and Hit sheets exist and are style-matched to the idle, but nothing plays them. Hurt is a red recolour flash in the pack, not a drawn reaction.

**Phase change: no art.** Data already has three phases — Toll (start), Cracked (HP below 50%, "*CRACK* The bell splits"), Heart Break (HP below 30%). `SPRITE_OVERRIDES` has **no `phaseStrips`** for `bell_keeper`. Kappa and Willow already use that hook. When the bell cracks, the sprite does not change.

**Identity: no.** The summit NPC and the dialogue face are Priest Ren, an old shrine priest in red and white. The battler is a squat teal samurai with a crescent helm and two naginata. They do not read as the same person. The fiction is "He Who Holds the Silence" — a keeper who will not ring the shrine bell — not a dual-wield samurai. This is the main art block on a *proper* Bell-Keeper fight.

**Playability:** this does **not** block a playable build. The fight already runs. It is a pack placeholder with a now-correct frame size. Gameplay and balance (win rates, phase timing) stay with design / Wisp / Ledger.

### 2.3 New assets needed (if Thomas wants a proper Bell-Keeper, not just a working one)

Keep map and battle as **one character**: Priest Ren / the Hollow Bell-Keeper. Motifs to carry from the story and from earlier Tsubaki notes: a shrine bell and rope, a paper name-seal, hollow or muted priest's robes, not a generic samurai. Palette from `near-measured.hex` (the map priest already uses reds `#e0394c` / `#d14b34` / `#ef914f` and paper `#f2eaf1`; retune highlights to L\* ≤ 90). Far stays on the engine multiply unless design marks him `noFar` (he is a Near-shore priest; I would keep the Far tint).

| Asset | Spec | Short prompt (reference only; Pixel Sage grades the pixels) |
|---|---|---|
| Idle battler | `art/custom/boss/bell_keeper.png`, preferred **384×64** (6×64²) to match Straw / Kappa / Tsubaki, **or** keep 96×48 × 6 if Wisp wants to avoid a layout change. 1-bit alpha, 8–12 colours, 1 px `#141b1b` outline. Drop the `#8090a8` tint once the colours are painted. | `hollow shrine bell-keeper, elderly Japanese priest, white hair and moustache, muted red-and-white robes gone grey, huge silent shrine bell and shimenawa rope, paper name-seal, front-view 64px RPG boss idle, sorrowful not monstrous, limited Near palette, 1px #141b1b outline` |
| Attack | Same frame size, 4–6 frames. Wire later; not required for playability. | `same priest, ringing or swinging the bell rope, one heavy pull, no sword, no naginata` |
| Hurt | 4 frames, or a tint flash if Wisp keeps the existing hit-pause. | `same priest, flinch, bell rope slack, no full-sprite red recolour` |
| Phase: Cracked | `art/custom/boss/bell_keeper_cracked.png`, same layout, hooked as `phaseStrips: {'Cracked': 'bell_keeper_cracked'}`. | `same keeper, shrine bell visibly split, ragged ringing, dust and hairline cracks, same palette` |
| Phase: Heart Break (optional) | `art/custom/boss/bell_keeper_heartbreak.png`, hook `'Heart Break'`. | `same keeper, robes slack, bell hanging dead, quieter pose` |
| Map sheet | `art/custom/chars/keeper.png`, 64×112, must match the battler (same hair, robes, maybe a small bell or rope). | Overworld 16 px priest, down-facing idle used on the summit. |
| Face | `art/custom/faces/keeper.png`, 38×38, opaque `#141b1b`, same man as the map and battler. Optional later: a post-fight "Priest Ren" calm variant; today one face is used for both names. | Bust of the elderly bell-keeper, tired, kind, not a samurai helm. |

Pack Attack / Hit can be a temporary wiring job (Wisp, not Freebuff) **only** if Thomas accepts the samurai identity as a placeholder. That would still leave the priest/samurai break in place. I do not recommend it as the release look.

---

## 3. Proposed Freebuff task entries

Do **not** append these to `tasks/freebuff-queue.md` from this PR. Ledger / Thomas can queue them. Both are heavy pixel builds, not Ember's work.

```
- date: 2026-11-27
- from: Ember
- task: Tsubaki release remaint (issue #27). Replace the #25 placeholder set in art/custom/ only: boss/tsubaki_final.png, boss/tsubaki_forge.png (both 384×64, six 64×64 frames), chars/tsubaki.png (64×112), faces/tsubaki{,_anger,_grief,_resolve}.png (38×38, opaque #141b1b, 1 px margin). Follow tasks/art-review-tsubaki-bellkeeper-2026-11-27.md §1.6–1.7. Palette: near-measured.hex plus #503060 plum only, ≤12 colours including outline, 1-bit alpha, 1 px #141b1b outline, no painted glow, noFar stays on, do not reintroduce a Near tint. Keep frame layouts so npm run test:art still passes. Install with npm run art. Do not modify files outside art/custom/ except via that pipeline. Do not install lantern-night-art/dropin-v2. AI is reference only; hand-pixel the finals. Pixel Sage grades before any art YES.
- status: proposed (not queued)

- date: 2026-11-27
- from: Ember
- task: Hollow Bell-Keeper identity set (no open issue; see the 2026-11-27 art review). Custom idle battler art/custom/boss/bell_keeper.png (preferred 384×64, six 64×64, or keep 96×48 × 6 if layout must stay), plus art/custom/boss/bell_keeper_cracked.png for the Cracked phase, optional heart-break strip, art/custom/chars/keeper.png (64×112) and art/custom/faces/keeper.png (38×38) so map, face and battler read as Priest Ren, not GiantBlueSamurai. Motif: silent shrine bell and rope, paper seal, muted priest's robes. Palette from near-measured.hex, ≤12 colours, 1-bit alpha, 1 px #141b1b outline. Drop tint #8090a8 once painted. Wisp hooks phaseStrips and any attack/hurt playback separately. AI is reference only. Pixel Sage grades. Do not treat pack Attack/Hit wiring as the release look.
- status: proposed (not queued)
```

---

## 4. Note on issue #28 (Kappa Toll-Keeper)

#28 asked for a 6-frame 384×64 battler because the old asset was a single 16×16 frame scaled about ×13. **On `4ecfbcd` that work is already in the tree:**

- `art/custom/boss/kappa_toll.png` — 384×64, 6×64², 12 colours, 0 semi-transparent pixels, outlines and contrast pass, `tools/pixel-lint` **PASS**. SHA-256 `548a5b7d5b7a50d1…`.
- `art/custom/boss/kappa_toll_spilled.png` — 384×64, 11 colours, lint **PASS**, hooked as `phaseStrips: {'Dish Spilled': 'kappa_toll_spilled'}`.

The issue body is stale. This is not the Hollow Bell-Keeper. I am not closing #28 from here; Ledger / Wisp can confirm and close if they agree.

---

## 5. Comparison images (box paths, not committed)

All under `/workspace/ln-tsubaki-bellkeeper-art/`:

- `tsubaki_final_native_strip.png`, `tsubaki_final_x3_frames.png`, `tsubaki_final_x4_frames.png`, `tsubaki_final_native_vs_x3.png`
- `tsubaki_forge_x3_frames.png`
- `tsubaki_faces_installed_vs_v2_x5.png`
- `tsubaki_map_sheet_installed_vs_v2_vs_mio_x4.png`
- `tsubaki_final_v1_vs_parked_v2_f0_x4.png`
- `tsubaki_final_near_vs_far_nofar_vs_multiply_x3.png`
- `v2_parked_tsubaki_final_x3.png`, `v2_parked_tsubaki_forge_x3.png`
- `boss_f0_style_comparison_x3.png` (Tsubaki, Straw Warden, Kappa Toll, Bell-Keeper)
- `bell_keeper_idle_native_strip.png`, `bell_keeper_idle_x3_frames.png`
- `bell_keeper_pack_attack_left_x3.png`, `bell_keeper_pack_attack_right_x3.png`, `bell_keeper_pack_hit_x3.png`, `bell_keeper_pack_charge_left_x3.png`, `bell_keeper_pack_walk_x3.png`, `bell_keeper_pack_faceset_x4.png`
- `bell_keeper_map_face_vs_battler_mismatch.png`
- `bell_keeper_near_tint_vs_far_multiply_x3.png`
- `analysis.json` (colour counts, L\*, contrast, hashes)

---

## 6. Routing

Heavy remaint and new Bell-Keeper strips go to **Freebuff** if Thomas queues them. Ember stays on prompts, specs and grades. Wisp owns engine hooks (`phaseStrips`, attack/hurt playback, dropping the Near tint). Pixel Sage grades final pixels. Ledger tracks issues. Nothing here is a publish OK.
