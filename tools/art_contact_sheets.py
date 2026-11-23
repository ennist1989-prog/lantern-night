#!/usr/bin/env python3
"""Art contact sheets + palette report (queue entry 7). Pillow only, read-only over the art.

For each existing image folder it writes docs/art/contact_sheets/<name>.png: every PNG at 2x nearest-neighbour on a
checkerboard, with its filename and pixel size underneath. It also writes palette_report.md beside the sheets with
the unique colour count per PNG and a flag for any semi-transparent alpha.

The names requested by the entry that have no folder here (sv_actors, pictures, img) are reported as missing and
skipped, never created.

Usage
  python3 tools/art_contact_sheets.py
  python3 tools/art_contact_sheets.py --out docs/art/contact_sheets --scale 3
"""
import argparse
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

# requested name -> folder(s) that exist in this repo
FOLDERS = [
    ('characters', ['public/assets/chars']),
    ('faces', ['public/assets/faces']),
    ('enemies', ['public/assets/mon', 'public/assets/boss']),
    ('tilesets', ['public/assets/tiles']),
]
ABSENT = ['sv_actors', 'pictures', 'img']       # requested by the queue, do not exist here
FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
]
CHECKER = ((32, 36, 44), (44, 50, 60))
LABEL_BG = (16, 18, 24)
LABEL_FG = (214, 222, 236)


def load_font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                pass
    try:
        return ImageFont.load_default(size=size)
    except TypeError:                            # Pillow < 10.1
        return ImageFont.load_default()


def checkerboard(size, cell=8):
    bg = Image.new('RGB', size, CHECKER[0])
    d = ImageDraw.Draw(bg)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=CHECKER[1])
    return bg


def unique_colours(img):
    """Distinct RGBA values that are actually visible, plus whether any alpha is neither 0 nor 255."""
    img = img.convert('RGBA')
    colours = set()
    soft = 0
    for count, colour in img.getcolors(maxcolors=1 << 24) or []:   # not getdata(): deprecated in Pillow 14
        if colour[3] == 0:
            continue
        colours.add(colour)
        if colour[3] != 255:
            soft += count
    return len(colours), soft


def sheet_for(folder, out_path, scale):
    names = sorted(n for n in os.listdir(folder) if n.lower().endswith('.png'))
    if not names:
        return None
    imgs = [(n, Image.open(os.path.join(folder, n))) for n in names]
    cell_w = max(im.size[0] for _, im in imgs) * scale + 16
    cell_h = max(im.size[1] for _, im in imgs) * scale + 16
    label_h = 30
    cols = max(1, min(6, int(math.sqrt(len(imgs) * 1.6)) or 1))
    rows = math.ceil(len(imgs) / cols)
    W = cols * cell_w
    H = rows * (cell_h + label_h)
    sheet = Image.new('RGB', (W, H), LABEL_BG)
    font = load_font(11)
    d = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(imgs):
        cx = (i % cols) * cell_w
        cy = (i // cols) * (cell_h + label_h)
        big = im.resize((im.size[0] * scale, im.size[1] * scale), Image.NEAREST)
        board = checkerboard(big.size)
        if big.mode == 'RGBA':
            board.paste(big, (0, 0), big)
        else:
            board.paste(big.convert('RGB'), (0, 0))
        sheet.paste(board, (cx + 8, cy + 8))
        d.text((cx + 8, cy + cell_h + 4), f'{name}  {im.size[0]}x{im.size[1]}', font=font, fill=LABEL_FG)
    sheet.save(out_path)
    return {'folder': folder, 'sheet': out_path, 'count': len(imgs), 'size': sheet.size}


def main(argv=None):
    ap = argparse.ArgumentParser(description='Contact sheets and a palette report for the shipped art.')
    ap.add_argument('--out', default='docs/art/contact_sheets', help='output directory')
    ap.add_argument('--scale', type=int, default=2, help='nearest-neighbour zoom (default 2)')
    args = ap.parse_args(argv)

    os.makedirs(args.out, exist_ok=True)
    sheets = []
    missing = list(ABSENT)
    for label, candidates in FOLDERS:
        present = [c for c in candidates if os.path.isdir(c)]
        if not present:
            missing.append(label)
            continue
        for folder in present:
            slug = os.path.basename(folder)
            out = os.path.join(args.out, f'{slug}.png')
            made = sheet_for(folder, out, args.scale)
            if made:
                made['label'] = label
                sheets.append(made)

    # palette report over exactly the images that were rendered
    rows = []
    for made in sheets:
        for name in sorted(n for n in os.listdir(made['folder']) if n.lower().endswith('.png')):
            p = os.path.join(made['folder'], name)
            with Image.open(p) as im:
                n_colours, soft = unique_colours(im)
                rows.append((made['folder'], name, f'{im.size[0]}x{im.size[1]}', n_colours, soft))
    report = [
        '# Palette report',
        '',
        f'{len(rows)} PNG(s) across {len(sheets)} sheet(s); zoom {args.scale}x nearest-neighbour.',
        'Unique colours ignore fully transparent pixels and count RGBA values.',
        '',
        '| folder | image | size | unique colours | semi-transparent |',
        '|---|---|---|---|---|',
    ]
    for folder, name, size, n, soft in rows:
        report.append(f'| `{folder}` | {name} | {size} | {n} | {"YES: " + str(soft) + " px" if soft else "no"} |')
    soft_files = [r for r in rows if r[4]]
    report += ['', f'Semi-transparent alpha: {len(soft_files)} file(s) affected'
                   + (': ' + ', '.join(f'{f}/{n}' for f, n, _, _, _ in soft_files) if soft_files else '') + '.', '']
    if missing:
        report += [f'Requested folders with no directory here (skipped, not created): {", ".join(missing)}.', '']
    with open(os.path.join(args.out, 'palette_report.md'), 'w') as fh:
        fh.write('\n'.join(report) + '\n')

    for made in sheets:
        print(f'{made["sheet"]}  {made["count"]} image(s)  {made["size"][0]}x{made["size"][1]}')
    print(f'{os.path.join(args.out, "palette_report.md")}  {len(rows)} row(s), {len(soft_files)} with soft alpha')
    if missing:
        print(f'missing folders (skipped): {", ".join(missing)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
