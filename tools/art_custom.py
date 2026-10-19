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

def frame_meta(path, sp=None, custom=False):
    """Frame layout of a boss/battler image. Pack metadata ('frame' in the spec) is unreliable, so it is derived from the
    image unless the sprite is custom art (or sets frameExact) and its frame tiles the image exactly.
      - custom/frameExact + frame [fw,fh] with W % fw == 0 and H == fh  -> n = W // fw   (e.g. 384x64 + [64,64] -> 6 frames)
      - horizontal strip of square frames (W % H == 0, W >= 2H)          -> fw = fh = H, n = W // H
      - Ninja Adventure 16 px sheet (pack only: 64x64 monster, 64x112 char) -> 16x16 cell 0, shown at x3.2
      - anything else square                                              -> one frame of W x H
    """
    sp = sp or {}; W_, H_ = Image.open(path).size
    fr = sp.get('frame')
    if (custom or sp.get('frameExact')) and fr and W_ % fr[0] == 0 and H_ == fr[1]:
        fw, fh, n = fr[0], fr[1], W_ // fr[0]
    elif W_ % H_ == 0 and W_ >= 2 * H_:
        fw = fh = H_; n = W_ // H_
    elif not custom and W_ == 64 and H_ in (64, 112):
        fw = fh = 16; n = 1
    else:
        fw, fh, n = W_, H_, 1
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
