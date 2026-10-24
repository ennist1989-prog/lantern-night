"""Chapter 3 sprites from the Ninja Adventure pack (CC0): Oto (dog), the Toll Kappa, the Rustle Sprite, Old Hisa (recoloured
Old Woman). Idempotent; writes public/assets/chars|faces/<name>.png. Runs from gen_game.py (skips if the pack is absent)."""
import os, colorsys
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = os.path.join(os.environ.get('LN_DL', os.path.join(ROOT, '_dl')), 'pack/Ninja Adventure - Asset Pack/Actor') + '/'
A = os.path.join(ROOT, 'public/assets') + '/'
def save(im, sub, name): im.save(A + f'{sub}/{name}.png')
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
    out = Image.new('RGBA', (64, 32))
    for row in range(2):
        fr = f[row]; fl = ImageOps.mirror(fr)
        for col, im in enumerate([fr, fl, fl, fr]): out.alpha_composite(im, (col * 16, row * 16))   # down, up, left, right
    return out
def build():
    if not os.path.isdir(R): print('ch3_assets: pack not found, keeping committed sprites'); return
    save(dog(), 'chars', 'oto'); save(Image.open(R + 'Animal/Dog/Faceset.png').convert('RGBA') if os.path.exists(R + 'Animal/Dog/Faceset.png') else Image.open(R + 'Animal/DogOrange/Faceset.png').convert('RGBA'), 'faces', 'oto')
    for k, p, sheet in [('kappa', 'Monster/KappaGreen', 'SpriteSheet.png'), ('rustle', 'Monster/Mushroom', 'mushroom.png')]:
        save(Image.open(R + p + '/' + sheet).convert('RGBA'), 'chars', k); save(Image.open(R + p + '/Faceset.png').convert('RGBA'), 'faces', k)
    save(hue(Image.open(R + 'Character/OldWoman/SpriteSheet.png'), 0.42), 'chars', 'hisa'); save(hue(Image.open(R + 'Character/OldWoman/Faceset.png'), 0.42), 'faces', 'hisa')
    print('ch3_assets: oto kappa rustle hisa')
if __name__ == '__main__': build()
