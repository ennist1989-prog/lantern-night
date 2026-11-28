#!/usr/bin/env python3
"""Pixel-art lint (queue entry 6). Python 3 + Pillow only, read-only: it never writes an image.

Scans a folder of PNGs and writes tools/pixel-lint/report.md with PASS or FAIL per image.

Rules
  1. unique opaque colour count <= --max-colors (default 12)
  2. hard-edged alpha only: every alpha is 0 or 255
  3. outline: any opaque pixel with a transparent (or off-image) 4-neighbour must be #141b1b
  4. brightest highlight L* <= 90 (CIELAB), #ffe08a exempt
  5. no gold/yellow hues (hue 40-60 deg with chroma > 30), #ffe08a exempt
  6. horizontally/vertically adjacent unlike opaque pixels must differ by dL* >= 8

Usage
  python3 tools/pixel-lint/pixel_lint.py                 # chars, mon, boss
  python3 tools/pixel-lint/pixel_lint.py --dir public/assets/tiles --dir public/assets/fx
  python3 tools/pixel-lint/pixel_lint.py --max-colors 16 --fail-on-fail

Exit status is 0 whenever a report was written (the report carries the verdict); pass --fail-on-fail to make any
FAIL image set exit status 1.
"""
import argparse
import math
import os
import sys

from PIL import Image

OUTLINE = (0x14, 0x1B, 0x1B)
EXEMPT = (0xFF, 0xE0, 0x8A)          # the one allowed bright/gold accent
DEFAULT_MAX_COLORS = 12
MAX_L = 90.0
MIN_DL = 8.0
YELLOW_HUE = (40.0, 60.0)
MAX_CHROMA = 30.0
DEFAULT_DIRS = ['public/assets/chars', 'public/assets/mon', 'public/assets/boss']

_lab_cache = {}


def srgb_to_lab(rgb):
    """CIELAB (D65) for an 8-bit sRGB triple: returns (L*, a*, b*, chroma, hue deg)."""
    cached = _lab_cache.get(rgb)
    if cached:
        return cached
    def lin(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(v) for v in rgb)
    x = r * 0.4124 + g * 0.3576 + b * 0.1805
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = r * 0.0193 + g * 0.1192 + b * 0.9505
    def f(t):
        return t ** (1.0 / 3.0) if t > 216.0 / 24389.0 else (841.0 / 108.0) * t + 4.0 / 29.0
    fx, fy, fz = f(x / 0.95047), f(y / 1.0), f(z / 1.08883)
    L = 116.0 * fy - 16.0
    a = 500.0 * (fx - fy)
    bb = 200.0 * (fy - fz)
    chroma = math.hypot(a, bb)
    hue = math.degrees(math.atan2(bb, a)) % 360.0
    _lab_cache[rgb] = (L, a, bb, chroma, hue)
    return _lab_cache[rgb]


def lint_image(path, max_colors):
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = img.load()
    problems = []

    alphas = set()
    colors = {}
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            alphas.add(a)
            if a == 255:
                colors[(r, g, b)] = colors.get((r, g, b), 0) + 1

    # 1. palette size
    if len(colors) > max_colors:
        problems.append(('1 colours', f'{len(colors)} unique opaque colours (cap {max_colors})'))

    # 2. hard-edged alpha
    soft = sorted(a for a in alphas if a not in (0, 255))
    if soft:
        problems.append(('2 alpha', f'{len(soft)} partial alpha value(s): {soft[:6]}'))

    # 3. outline wherever an edge pixel touches transparency
    bad_edge = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a != 255:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    if px[nx, ny][3] != 0:
                        continue
                if (r, g, b) != OUTLINE:
                    bad_edge.append((x, y, (r, g, b)))
                break
    if bad_edge:
        sample = ', '.join(f'({x},{y}) #{r:02x}{g:02x}{b:02x}' for x, y, (r, g, b) in bad_edge[:4])
        problems.append(('3 outline', f'{len(bad_edge)} edge pixel(s) not #141b1b: {sample}'))

    # 4. brightest highlight at L* <= 90 (#ffe08a exempt)
    brightest = None
    for (r, g, b), n in colors.items():
        if (r, g, b) == EXEMPT:
            continue
        L = srgb_to_lab((r, g, b))[0]
        if brightest is None or L > brightest[0]:
            brightest = (L, (r, g, b))
    if brightest and brightest[0] > MAX_L:
        L, (r, g, b) = brightest
        problems.append(('4 highlight', f'#{r:02x}{g:02x}{b:02x} is L* {L:.1f} (max {MAX_L:.0f})'))

    # 5. no gold/yellow
    yellows = []
    for (r, g, b) in colors:
        if (r, g, b) == EXEMPT:
            continue
        _, _, _, chroma, hue = srgb_to_lab((r, g, b))
        if YELLOW_HUE[0] <= hue <= YELLOW_HUE[1] and chroma > MAX_CHROMA:
            yellows.append((r, g, b, chroma, hue))
    if yellows:
        worst = max(yellows, key=lambda t: t[3])
        problems.append(('5 yellow', f'{len(yellows)} gold/yellow colour(s), worst #{worst[0]:02x}{worst[1]:02x}{worst[2]:02x} '
                                    f'hue {worst[4]:.0f} chroma {worst[3]:.0f}'))

    # 6. neighbouring unlike pixels need dL* >= 8; keep the worst pair for the report
    worst = None
    for y in range(h):
        for x in range(w):
            r1, g1, b1, a1 = px[x, y]
            if a1 != 255:
                continue
            for dx, dy in ((1, 0), (0, 1)):
                nx, ny = x + dx, y + dy
                if nx >= w or ny >= h:
                    continue
                r2, g2, b2, a2 = px[nx, ny]
                if a2 != 255 or (r1, g1, b1) == (r2, g2, b2):
                    continue
                d = abs(srgb_to_lab((r1, g1, b1))[0] - srgb_to_lab((r2, g2, b2))[0])
                if worst is None or d < worst[0]:
                    worst = (d, (x, y), (nx, ny), (r1, g1, b1), (r2, g2, b2))
    if worst and worst[0] < MIN_DL:
        d, (x1, y1), (x2, y2), c1, c2 = worst
        problems.append(('6 contrast', f'worst neighbour pair dL* {d:.1f} (min {MIN_DL:.0f}): '
                                       f'({x1},{y1}) #{c1[0]:02x}{c1[1]:02x}{c1[2]:02x} vs '
                                       f'({x2},{y2}) #{c2[0]:02x}{c2[1]:02x}{c2[2]:02x}'))

    return {'path': path, 'size': (w, h), 'colours': len(colors), 'problems': problems,
            'worst_pair': worst}


def main(argv=None):
    ap = argparse.ArgumentParser(description='Pixel-art lint: palette, alpha, outline, brightness, gold, contrast.')
    ap.add_argument('--dir', action='append', dest='dirs', metavar='DIR',
                    help='folder to scan (repeatable); default chars, mon, boss')
    ap.add_argument('--max-colors', type=int, default=DEFAULT_MAX_COLORS, help='rule 1 cap (default 12)')
    ap.add_argument('--out', default='tools/pixel-lint/report.md', help='report path')
    ap.add_argument('--fail-on-fail', action='store_true', help='exit 1 if any image FAILs')
    args = ap.parse_args(argv)

    dirs = args.dirs or DEFAULT_DIRS
    missing = [d for d in dirs if not os.path.isdir(d)]
    if missing:
        print(f'missing folder(s): {", ".join(missing)}', file=sys.stderr)
        return 2

    results = []
    for d in dirs:
        for name in sorted(os.listdir(d)):
            if name.lower().endswith('.png'):
                results.append(lint_image(os.path.join(d, name), args.max_colors))

    failed = [r for r in results if r['problems']]
    lines = [
        '# Pixel lint report',
        '',
        f'Scanned {len(results)} PNG(s) in {", ".join(dirs)}.',
        '',
        'Rules: (1) unique opaque colours <= {cap}; (2) alpha in {{0,255}} only; (3) outline #141b1b wherever an '
        'edge pixel touches transparency; (4) brightest highlight L* <= 90, #ffe08a exempt; (5) no gold/yellow '
        '(hue 40-60 deg, chroma > 30) except #ffe08a; (6) adjacent unlike pixels differ by dL* >= 8.'.format(cap=args.max_colors),
        '',
        f'**{len(results) - len(failed)} PASS / {len(failed)} FAIL**',
        '',
        '| image | result | colours | size |',
        '|---|---|---|---|',
    ]
    for r in results:
        lines.append(f'| `{r["path"]}` | {"PASS" if not r["problems"] else "FAIL"} | {r["colours"]} | '
                     f'{r["size"][0]}x{r["size"][1]} |')
    if failed:
        lines += ['', '## Failures', '']
        for r in failed:
            lines.append(f'### {r["path"]}')
            for rule, msg in r['problems']:
                lines.append(f'- rule {rule}: {msg}')
            lines.append('')
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, 'w') as fh:
        fh.write('\n'.join(lines) + '\n')

    print(f'{len(results) - len(failed)} PASS / {len(failed)} FAIL -> {args.out}')
    by_rule = {}
    for r in failed:
        for rule, _ in r['problems']:
            by_rule[rule] = by_rule.get(rule, 0) + 1
    for rule, n in sorted(by_rule.items()):
        print(f'  rule {rule}: {n} image(s)')
    return 1 if (args.fail_on_fail and failed) else 0


if __name__ == '__main__':
    sys.exit(main())
