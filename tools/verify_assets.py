#!/usr/bin/env python3
"""Post-conditions for public/assets/ — run after any pipeline step.

`npm run assets` wipes public/assets/ and only rebuilds pack art. Four things it cannot restore itself come from
later steps: monster crops and boss sprites/metadata from `npm run data`, the lazy chapter tracks from
`tools/ch_audio.py`, and the window skins from `art/custom/ui/` (the `npm run art` overlay). This script asserts the
tree is complete, so an assets-only rebuild fails here instead of shipping a game with 404s and wrong boss frames.

    npm run verify:assets                  # exit 0 = complete, 1 = broken (every failure printed)
    python3 tools/verify_assets.py [ROOT]  # ROOT defaults to the repo root (used to check a copy)

Read-only. Needs Pillow and the repo only: no _dl/, no rpg-research, no ffmpeg, no node.
Source of truth for each expectation is named in the message, so a failure says which command fixes it.
"""
import ast, json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import art_custom as A   # frame_meta()/ICON_SLOTS: same derivation the pipeline and the game use

ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(HERE)
ASSETS = os.path.join(ROOT, 'public', 'assets')
DATA = os.path.join(ROOT, 'public', 'data')
# src/core/audio.ts LAZY: fetched on first use by tools/ch_audio.py, NOT produced by build_assets.py
CHAPTER_BGM = ('forest', 'forest_far', 'grove', 'crossing', 'crossing_far', 'willow', 'willow_far')
# boot.ts only loads optional art listed in manifest.json, so the manifest must match the disk exactly
MANIFEST_SUBS = ('chars', 'faces', 'boss', 'tiles', 'bgm')
ICONS_PER_ROW = 24

failures, notes = [], []


def fail(msg):
    failures.append(msg)


def note(msg):
    notes.append(msg)


def rel(p):
    return os.path.relpath(p, ROOT)


def load_json(path):
    try:
        return json.load(open(path))
    except FileNotFoundError:
        fail(f'{rel(path)} missing -> run `npm run assets` (then `npm run data`)')
    except Exception as e:
        fail(f'{rel(path)} unreadable ({e}) -> regenerate it with `npm run assets` / `npm run data`')
    return None


def png_ids(sub):
    d = os.path.join(ASSETS, sub)
    if not os.path.isdir(d):
        return set()
    return {f[:-4] for f in os.listdir(d) if f.endswith('.png')}


def run(desc, fn):
    before = len(failures)
    fn()
    if len(failures) == before:
        print(f'OK   {desc}')


# ---------------------------------------------------------------- mon/ crops
def check_mon():
    spec = load_json(os.path.join(DATA, 'spec', 'enemies.json'))
    if spec is None:
        return
    have = png_ids('mon')
    if not have:
        fail('mon/: no crops at all -> run `npm run data` (build_assets.py does not produce them)')
        return
    for eid in sorted(set(spec) - have):
        fail(f'mon/{eid}.png missing (enemy "{eid}" is in spec/enemies.json and boot.ts preloads it -> 404) -> run `npm run data`')
    stale = sorted(have - set(spec))
    if stale:
        note(f'mon/: {len(stale)} crop(s) for enemies no longer in the spec (harmless): {", ".join(stale[:6])}')
    if not (set(spec) - have):
        print(f'     mon/: {len(have)}/{len(spec)} spec enemies have a crop')


# ------------------------------------------------------- boss sprites + meta
def check_boss():
    spec = load_json(os.path.join(DATA, 'spec', 'bosses.json'))
    meta = load_json(os.path.join(ASSETS, 'boss', 'meta.json'))
    if spec is None or meta is None:
        return
    pngs = png_ids('boss')
    for bid in sorted(set(meta) - pngs):
        fail(f'boss/{bid}.png missing but boss/meta.json lists it -> run `npm run data`')
    for bid in sorted(set(pngs) - set(meta)):
        fail(f'boss/meta.json has no entry for boss/{bid}.png -> run `npm run data`')
    for bid, b in sorted(spec.items()):
        sp = b.get('sprite') or {}
        if bid not in pngs:
            fail(f'boss/{bid}.png missing (spec boss) -> run `npm run data`; build_assets.py only builds tengu/gspirit')
            continue
        if bid not in meta:
            continue                                        # already reported above
        entry = meta[bid]
        got = (entry.get('fw'), entry.get('fh'), entry.get('n'))
        if not all(isinstance(v, int) and v > 0 for v in got):
            fail(f'boss/meta.json {bid} has a bad layout {got} -> run `npm run data`')
            continue
        custom = bool(sp.get('custom')) and os.path.exists(os.path.join(ROOT, sp['custom']))
        path = os.path.join(ROOT, sp['custom']) if custom else os.path.join(ASSETS, 'boss', bid + '.png')
        m = A.frame_meta(path, sp, custom=custom, warn=False)
        want = (m['fw'], m['fh'], m['n'])
        if got != want:
            fail(f'boss/meta.json {bid} = {got} but {rel(path)} derives {want} (stale meta) -> run `npm run data`')
    # phase strips: boot.ts queues boss/<strip>.png only when manifest.json lists it, so all three must agree.
    # Their meta entries are already covered by the pngs <-> meta diff above; several phases may share one strip.
    man = load_json(os.path.join(ASSETS, 'manifest.json')) or {}
    listed = set(man.get('boss') or [])
    strips = {}
    for bid, b in sorted(spec.items()):
        for phase, strip in sorted(((b.get('sprite') or {}).get('phaseStrips') or {}).items()):
            strips.setdefault(strip, (bid, phase))
    for strip, (bid, phase) in sorted(strips.items()):
        if strip not in pngs:
            fail(f'boss/{strip}.png missing (phase strip for {bid} "{phase}") -> check SPRITE_OVERRIDES and art/custom/boss/')
        if strip not in listed:
            fail(f'boss/{strip}.png exists but manifest.json does not list it, so boot.ts never queues it -> run `npm run art`')
    print(f'     boss/: {len(spec)} spec bosses, {len(meta)} meta entries, {len(pngs)} images')


# --------------------------------------------------------- chapter bgm tracks
def check_bgm():
    d = os.path.join(ASSETS, 'bgm')
    present = 0
    for name in CHAPTER_BGM:
        if os.path.exists(os.path.join(d, name + '.ogg')):
            present += 1
        else:
            fail(f'bgm/{name}.ogg missing (lazy chapter track, src/core/audio.ts LAZY) -> python3 tools/ch_audio.py')
    print(f'     bgm/: {present}/{len(CHAPTER_BGM)} chapter tracks')


# ---------------------------------------------------------------- icon slots
def check_icons():
    png = os.path.join(ASSETS, 'icons.png')
    idx = load_json(os.path.join(ASSETS, 'icons.json'))
    if idx is None:
        return
    if not os.path.exists(png):
        fail('icons.png missing -> run `npm run assets`')
        return
    w, h = Image.open(png).size
    if w % ICONS_PER_ROW or h % ICONS_PER_ROW:
        fail(f'icons.png is {w}x{h}, not a {ICONS_PER_ROW}px grid -> run `npm run assets`')
        return
    slots = (w // ICONS_PER_ROW) * (h // ICONS_PER_ROW)
    for name, slot in A.ICON_SLOTS.items():
        if idx.get(name) != slot:
            fail(f'icons.json {name} = {idx.get(name)}, expected slot {slot} (art/custom/icons overlay) -> run `npm run art`')
            continue
        x, y = (slot % ICONS_PER_ROW) * ICONS_PER_ROW, (slot // ICONS_PER_ROW) * ICONS_PER_ROW
        if x + ICONS_PER_ROW > w or y + ICONS_PER_ROW > h:
            fail(f'icons.png has {slots} slots; {name} needs slot {slot} -> re-slot art_custom.ICON_SLOTS')
    # a new pack icon would silently overwrite mochi/spirit_elixir: catch it at the source, before regenerating
    src = os.path.join(ROOT, 'tools', 'build_assets.py')
    if os.path.exists(src):
        try:
            tree = ast.parse(open(src).read())
            pack = next(ast.literal_eval(n.value) for n in tree.body
                        if isinstance(n, ast.Assign) and getattr(n.targets[0], 'id', '') == 'ICONS')
            first = min(A.ICON_SLOTS.values())
            if len(pack) > first:
                fail(f'tools/build_assets.py ICONS has {len(pack)} entries; slot {first} is reserved for art/custom/icons '
                     f'-> move ICON_SLOTS before adding more pack icons')
            clash = sorted(set(pack) & set(A.ICON_SLOTS))
            if clash:
                fail(f'tools/build_assets.py ICONS also defines {clash}, which art/custom/icons owns -> rename one')
        except StopIteration:
            note('build_assets.py: no ICONS literal found; skipped the reserved-slot guard')
        except Exception as e:
            note(f'build_assets.py ICONS not inspected ({e})')
    print(f'     icons.png: {slots} slots, {len(idx)} keys, custom slots {sorted(A.ICON_SLOTS.values())}')


# -------------------------------------------------------------- window skins
# art/custom/ui/{windowskin,windowskin_far}.png: 96x48 = [48x48 background | 48x48 frame], the layout src/ui/windows.ts
# winTexture() reads (frame half 9-sliced at 16 px corners, drawn at 2x). boot.ts loads both with no fallback, so a gap
# here ships a missing-texture window; nothing else in this script looks at ui/.
SKINS = ('windowskin', 'windowskin_far')
SKIN_W, SKIN_H = 96, 48


def check_skins():
    found = []
    for name in SKINS:
        p = os.path.join(ASSETS, 'ui', name + '.png')
        if not os.path.exists(p):
            fail(f'ui/{name}.png missing -> art/custom/ui/{name}.png is the source of truth; run `npm run art` '
                 f'(boot.ts loads it unconditionally, so nothing else here catches the gap)')
            continue
        try:
            w, h = Image.open(p).size
        except Exception as e:
            fail(f'ui/{name}.png unreadable ({e}) -> regenerate art/custom/ui/{name}.png')
            continue
        if (w, h) != (SKIN_W, SKIN_H):
            fail(f'ui/{name}.png is {w}x{h}, expected {SKIN_W}x{SKIN_H} (48x48 background | 48x48 frame, 16 px '
                 f'corners) -> regenerate art/custom/ui/{name}.png; winTexture() would 9-slice it wrong')
            continue
        found.append(f'{name}.png {w}x{h}')
    if len(found) == len(SKINS):
        print(f'     ui/: {", ".join(found)}')


# ------------------------------------------------------ manifest vs disk
def check_manifest():
    man = load_json(os.path.join(ASSETS, 'manifest.json'))
    if man is None:
        return
    for sub in MANIFEST_SUBS:
        listed = set(man.get(sub) or [])
        ext = '.ogg' if sub == 'bgm' else '.png'
        d = os.path.join(ASSETS, sub)
        disk = {f[:-len(ext)] for f in os.listdir(d) if f.endswith(ext)} if os.path.isdir(d) else set()
        for n in sorted(listed - disk):
            fail(f'manifest.json lists {sub}/{n}{ext} but the file is gone (boot.ts would 404) '
                 f'-> restore the file, then `npm run art` to refresh the list')
        for n in sorted(disk - listed):
            fail(f'{sub}/{n}{ext} exists but manifest.json omits it, so the game never loads it -> run `npm run art`')


def main():
    print(f'verify assets: {ASSETS}')
    if not os.path.isdir(ASSETS):
        print(f'\nFAIL public/assets/ is missing entirely -> run `npm run assets`, then `npm run data` and `python3 tools/ch_audio.py`')
        return 1
    run('mon/ crops present for every spec enemy', check_mon)
    run('boss images, meta keys and frame layouts agree', check_boss)
    run(f'chapter bgm ({len(CHAPTER_BGM)} lazy tracks) present', check_bgm)
    run('icons.png/json hold the custom slots', check_icons)
    run('window skins (Near + Far) present at 96x48', check_skins)
    run('manifest.json matches the files on disk', check_manifest)
    for n in notes:
        print(f'note {n}')
    if failures:
        unique = list(dict.fromkeys(failures))      # several spec entries can share one strip/boss
        print('')
        for f in unique:
            print(f'FAIL {f}')
        print(f'\n{len(unique)} failure(s): public/assets/ is incomplete (an `npm run assets`-only tree looks like this).')
        print('Fix with: npm run data && python3 tools/ch_audio.py   (then `npm run art` if the manifest is stale)')
        return 1
    print('\nOK: public/assets/ is complete (mon/ crops, boss meta + layouts, chapter bgm, icon slots, window skins, manifest)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
