#!/usr/bin/env python3
"""art/custom overlay: hand-made art/audio that must survive pipeline runs.

build_assets.py wipes and rebuilds public/assets/ from the Ninja Adventure pack, and spec_import.py re-copies every boss
image from the pack. Finished custom art therefore lives in art/custom/<sub>/ (never touched by the pipeline) and is
copied over public/assets/<sub>/ as the LAST step of both scripts (or standalone: `python3 tools/art_custom.py`).

Also writes public/assets/manifest.json (which chars/faces/bgm/boss files exist) so the game only queues optional assets
that are really there: no 404s, and boot.ts falls back to the placeholder when art hasn't been delivered yet.
"""
import json, os, shutil
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUSTOM = os.path.join(ROOT, 'art', 'custom')
ASSETS = os.path.join(ROOT, 'public', 'assets')
SKIP = {'README.md', '.gitkeep'}
EXT = {'chars': '.png', 'faces': '.png', 'boss': '.png', 'bgm': '.ogg', 'se': '.ogg', 'me': '.ogg'}

WARNINGS = []   # frame-layout warnings of the last run (printed as they happen; tests read this list)

def _warn(msg):
    WARNINGS.append(msg); print('WARN frame_meta:', msg)

def boundary_crossings(path, fw, fh=None, n=None):
    """Frame boundaries (x = k*fw) that a sprite body crosses: a row with opaque pixels in BOTH column x-1 and column x.
    A clean strip has transparent gutters (or at least no continuous content) at every frame edge. Returns [x, ...]."""
    im = Image.open(path).convert('RGBA'); W_, H_ = im.size; a = im.getchannel('A').load()
    fh = fh or H_; n = n or W_ // fw; out = []
    for k in range(1, n):
        x = k * fw
        if x >= W_: break
        if any(a[x - 1, y] > 0 and a[x, y] > 0 for y in range(min(fh, H_))): out.append(x)
    return out

def _clean_width(path, W_, H_, start):
    """Smallest frame width >= start that divides W into >= 2 frames with no body crossing a frame edge (None if none)."""
    for fw in range(max(1, start), W_ // 2 + 1):
        if W_ % fw == 0 and not boundary_crossings(path, fw, H_):
            return fw
    return None

def frame_meta(path, sp=None, custom=False, warn=True):
    """Frame layout of a boss/battler image. Pack metadata ('frame' in the spec) is unreliable, so it is derived from the
    image unless the sprite is custom art (or sets frameExact) and its frame tiles the image exactly.
      - custom/frameExact + frame [fw,fh] with W % fw == 0 and H == fh  -> n = W // fw   (e.g. 384x64 + [64,64] -> 6 frames;
                                                                            Bell-Keeper 576x48 + [96,48] -> 6 frames)
      - horizontal strip of square frames (W % H == 0, W >= 2H)          -> fw = fh = H, n = W // H
      - Ninja Adventure 16 px sheet (pack only: 64x64 monster, 64x112 char) -> 16x16 cell 0, shown at x3.2
      - anything else square                                              -> one frame of W x H
    Guard rails (no silent guessing): every multi-frame result is checked with boundary_crossings(). If a GUESSED layout
    cuts sprite bodies, the smallest clean frame width is used instead and a warning is printed; if an EXPLICIT layout
    (frameExact/custom) cuts bodies it is kept but warned about. A wide non-strip sheet read as one frame is also warned.
    """
    sp = sp or {}; W_, H_ = Image.open(path).size; name = os.path.basename(path)
    fr = sp.get('frame'); exact = custom or sp.get('frameExact')
    say = _warn if warn else (lambda m: None)
    if exact and fr and W_ % fr[0] == 0 and H_ == fr[1]:
        fw, fh, n = fr[0], fr[1], W_ // fr[0]
        if sp.get('n') and sp['n'] != n: say(f'{name}: spec n={sp["n"]} but {W_}px / {fw}px = {n} frames; using {n}')
        cx = boundary_crossings(path, fw, fh, n) if n > 1 else []
        if cx: say(f'{name}: explicit frame {fw}x{fh} cuts sprite bodies at x={cx}; check the sheet/spec')
    else:
        if exact and fr: say(f'{name}: frame {fr} does not tile {W_}x{H_}; deriving from the image')
        if W_ % H_ == 0 and W_ >= 2 * H_:
            fw = fh = H_; n = W_ // H_
            cx = boundary_crossings(path, fw, fh, n)
            if cx:
                alt = _clean_width(path, W_, H_, H_ + 1)
                if alt: say(f'{name}: square {H_}x{H_} frames would cut bodies at x={cx[:4]}...; using {alt}x{H_} x{W_ // alt} (set frame/frameExact in SPRITE_OVERRIDES to pin it)'); fw, n = alt, W_ // alt
                else: say(f'{name}: square {H_}x{H_} frames cut bodies at x={cx[:4]} and no clean width found; check the sheet')
        elif not custom and W_ == 64 and H_ in (64, 112):
            fw = fh = 16; n = 1
        else:
            fw, fh, n = W_, H_, 1
            if W_ >= 2 * H_:
                alt = _clean_width(path, W_, H_, H_ // 2)
                say(f'{name}: {W_}x{H_} is not a square-frame strip; read as ONE frame' + (f' (looks like {W_ // alt} frames of {alt}x{H_}? pin it with frame/frameExact)' if alt else ''))
    return {'fw': fw, 'fh': fh, 'n': n, 'sc': 3.2 if fw == 16 else 1}

def overlay(log=True):
    """Copy art/custom/** over public/assets/** (custom wins). Boss images also refresh their boss/meta.json entry."""
    done = []
    if not os.path.isdir(CUSTOM): return done
    meta_p = os.path.join(ASSETS, 'boss', 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    for dp, _dn, fns in os.walk(CUSTOM):
        for fn in sorted(fns):
            if fn in SKIP or fn.startswith('.'): continue
            src = os.path.join(dp, fn); rel = os.path.relpath(src, CUSTOM); dst = os.path.join(ASSETS, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(src, dst); done.append(rel)
            if rel.startswith('boss' + os.sep) and fn.endswith('.png'):
                bid = fn[:-4]; m = frame_meta(src, meta.get(bid) and {'frame': [meta[bid]['fw'], meta[bid]['fh']]}, custom=True); m['sheet'] = bid; meta[bid] = m
    if any(r.startswith('boss' + os.sep) for r in done): json.dump(meta, open(meta_p, 'w'))
    if log: print('art/custom overlay:', done or 'nothing to copy')
    return done

def manifest():
    """public/assets/manifest.json: {sub: [names...]} for the folders boot.ts loads optional files from."""
    out = {}
    for sub, ext in EXT.items():
        d = os.path.join(ASSETS, sub)
        out[sub] = sorted(f[:-len(ext)] for f in os.listdir(d) if f.endswith(ext)) if os.path.isdir(d) else []
    json.dump(out, open(os.path.join(ASSETS, 'manifest.json'), 'w'), separators=(',', ':'))
    return out

if __name__ == '__main__':
    overlay(); m = manifest(); print('manifest:', {k: len(v) for k, v in m.items()})
