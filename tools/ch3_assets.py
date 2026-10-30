"""Chapter 3 sprites from the Ninja Adventure pack (CC0): Oto (dog), the Toll Kappa, the Rustle Sprite, Old Hisa (recoloured
Old Woman). Idempotent; writes public/assets/chars|faces/<name>.png. Runs from gen_game.py (skips if the pack is absent)."""
import os, colorsys
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = os.path.join(os.environ.get('LN_DL', os.path.join(ROOT, '_dl')), 'pack/Ninja Adventure - Asset Pack/Actor') + '/'
A = os.path.join(ROOT, 'public/assets') + '/'
CUSTOM = os.path.join(ROOT, 'art/custom') + '/'
def save(im, sub, name):
    # Hand-made art in art/custom/<sub>/<name>.png owns that file (tools/art_custom.py copies it, also as the last step of
    # gen_game.py): never overwrite it with the pack placeholder, so `npm run data` alone keeps the delivered art.
    if os.path.exists(CUSTOM + f'{sub}/{name}.png'): return
    im.save(A + f'{sub}/{name}.png')
def hue(im, shift, keep=(0.0, 0.14)):
    im = im.convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.25 or keep[0] <= h <= keep[1]: continue      # leave skin / greys alone
            r2, g2, b2 = colorsys.hsv_to_rgb((h + shift) % 1, s, v); px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return im
def dog():
    src = Image.open(R + 'Animal/Dog/SpriteSheet.png').convert('RGBA'); f = [src.crop((i * 16, 0, i * 16 + 16, 16)) for i in range(2)]
    out = Image.new('RGBA', (64, 112))       # NA 64x112 layout (4 dirs x 7 rows); placeholder until the 4-dir Oto sheet lands
    for row in range(7):
        fr = f[row % 2]; fl = ImageOps.mirror(fr)
        for col, im in enumerate([fr, fl, fl, fr]): out.alpha_composite(im, (col * 16, row * 16))   # down, up, left, right
    return out
def build():
    if not os.path.isdir(R): print('ch3_assets: pack not found, keeping committed sprites'); return
    save(dog(), 'chars', 'oto'); save(Image.open(R + 'Animal/Dog/Faceset.png').convert('RGBA') if os.path.exists(R + 'Animal/Dog/Faceset.png') else Image.open(R + 'Animal/DogOrange/Faceset.png').convert('RGBA'), 'faces', 'oto')
    for k, p, sheet in [('kappa', 'Monster/KappaGreen', 'SpriteSheet.png'), ('rustle', 'Monster/Mushroom', 'mushroom.png')]:
        save(Image.open(R + p + '/' + sheet).convert('RGBA'), 'chars', k); save(Image.open(R + p + '/Faceset.png').convert('RGBA'), 'faces', k)
    save(hue(Image.open(R + 'Character/OldWoman/SpriteSheet.png'), 0.42), 'chars', 'hisa'); save(hue(Image.open(R + 'Character/OldWoman/Faceset.png'), 0.42), 'faces', 'hisa')
    # Willow Mother face: placeholder (pale, blue-shifted Spirit) until the redesigned face drops in as faces/willow.png
    if not os.path.exists(A + 'faces/willow_final.png') and not os.path.exists(CUSTOM + 'faces/willow_final.png'): save(hue(Image.open(A + 'faces/spirit.png'), 0.55, keep=(2, 2)), 'faces', 'willow')
    if not os.path.exists(A + 'chars/willow_final.png') and not os.path.exists(CUSTOM + 'chars/willow_final.png'): save(hue(Image.open(A + 'chars/spirit.png'), 0.55, keep=(2, 2)), 'chars', 'willow')   # field sprite placeholder
    # Willow Mother battler: a sorrowful, non-monstrous placeholder (soft willow-green Giant Spirit flame) until the
    # redesigned battler lands as art/custom/boss/willow_mother.png (art_custom then owns the image and its meta entry).
    if not os.path.exists(os.path.join(ROOT, 'art/custom/boss/willow_mother.png')):
        import json
        g = hue(Image.open(A + 'boss/gspirit.png'), 0.83, keep=(2, 2)); sheet = Image.new('RGBA', (62 * 6, 62))   # same 62x62 x6 layout as the pack sheet
        for i in range(6): sheet.paste(g.crop(((i % 5) * 50, 0, (i % 5) * 50 + 50, 50)), (i * 62 + 6, 12))
        save(sheet, 'boss', 'willow_mother')
        mp = A + 'boss/meta.json'; meta = json.load(open(mp)); meta['willow_mother'] = {'fw': 62, 'fh': 62, 'n': 6, 'sc': 1, 'sheet': 'willow_mother'}; json.dump(meta, open(mp, 'w'))
    print('ch3_assets: oto kappa rustle hisa willow(face placeholder)')
if __name__ == '__main__': build()
