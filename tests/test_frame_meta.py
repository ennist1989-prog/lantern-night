#!/usr/bin/env python3
"""Regression test for tools/art_custom.frame_meta() and the shipped boss/meta.json.   run: npm run test:art
- every boss sheet resolves to the expected frame layout (Bell-Keeper = 6 x 96x48, not 12 half-bodies)
- boss/meta.json (what the game reads) matches frame_meta() for every boss
- no sprite body crosses a frame boundary (16 px pack cells excluded)
- synthetic sheets: custom 384x64 strip, single 64x64 custom frame, guessed layout auto-corrected + warned"""
import json, os, sys, tempfile
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.join(ROOT, 'tools'))
import art_custom as A
BOSSD = os.path.join(ROOT, 'public/assets/boss')
SPEC = json.load(open(os.path.join(ROOT, 'public/data/spec/bosses.json'))); META = json.load(open(os.path.join(BOSSD, 'meta.json')))
EXPECTED = {   # fw, fh, n
    'straw_warden': (62, 62, 6), 'bell_keeper': (96, 48, 6), 'willow_mother': (62, 62, 6), 'kappa_toll': (16, 16, 1),
    'gonbei': (60, 60, 6), 'hundred_year_anvil': (50, 50, 5), 'tsubaki_forge': (16, 16, 1), 'archive_echo': (50, 50, 5),
    'garden_guardian': (50, 50, 5), 'tsubaki_final': (16, 16, 1), 'tengu_master': (82, 82, 6),
}
fails = []
def check(c, msg):
    if not c: fails.append(msg)
for bid, b in SPEC.items():
    sp = b['sprite']; custom = sp.get('custom') and os.path.exists(os.path.join(ROOT, sp['custom']))
    path = os.path.join(ROOT, sp['custom']) if custom else os.path.join(BOSSD, bid + '.png')
    A.WARNINGS.clear(); m = A.frame_meta(path, sp, custom=bool(custom), warn=False)
    got = (m['fw'], m['fh'], m['n'])
    if not custom: check(got == EXPECTED.get(bid), f'{bid}: frame_meta {got} != expected {EXPECTED.get(bid)}')
    mm = META.get(bid, {}); check((mm.get('fw'), mm.get('fh'), mm.get('n')) == got, f'{bid}: meta.json {mm} != frame_meta {got} (run npm run data)')
    if m['fw'] != 16 and m['n'] > 1:
        cx = A.boundary_crossings(path, m['fw'], m['fh'], m['n']); check(not cx, f'{bid}: bodies cross frame edges at {cx}')
    print(f'{bid:20s} {got}' + ('  [custom]' if custom else ''))
check(set(EXPECTED) <= set(SPEC), f'bosses missing from spec: {set(EXPECTED) - set(SPEC)}')
# Bell-Keeper without the override: the old square rule would cut bodies -> must auto-correct to 96 and WARN
bk = os.path.join(BOSSD, 'bell_keeper.png')
check(A.boundary_crossings(bk, 48, 48, 12) != [], 'bell_keeper: 48 px frames should be detected as cutting bodies')
A.WARNINGS.clear(); m = A.frame_meta(bk, {}, warn=True)
check((m['fw'], m['n']) == (96, 6) and A.WARNINGS, f'bell_keeper un-pinned: expected auto 96x48x6 + warning, got {m} {A.WARNINGS}')
# synthetic custom art
with tempfile.TemporaryDirectory() as td:
    def strip(name, w, h, fw, body):
        im = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(im)
        for x in range(0, w, fw): d.rectangle([x + (fw - body) // 2, 2, x + (fw + body) // 2 - 1, h - 2], fill=(200, 100, 150, 255))
        p = os.path.join(td, name); im.save(p); return p
    p = strip('s384.png', 384, 64, 64, 40); m = A.frame_meta(p, {'frame': [64, 64], 'n': 6}, custom=True, warn=False); check((m['fw'], m['fh'], m['n']) == (64, 64, 6), f'384x64 custom strip -> {m}')
    p = strip('s64.png', 64, 64, 64, 40); m = A.frame_meta(p, {'frame': [64, 64]}, custom=True, warn=False); check((m['fw'], m['n'], m['sc']) == (64, 1, 1), f'64x64 custom -> {m}')
    p = strip('w.png', 384, 64, 128, 90); A.WARNINGS.clear(); m = A.frame_meta(p, {}, warn=True); check(m['fw'] == 128 and A.WARNINGS, f'wide frames guessed -> {m} {A.WARNINGS}')
    p = strip('x.png', 384, 64, 64, 40); A.WARNINGS.clear(); A.frame_meta(p, {'frame': [32, 64], 'frameExact': True}, warn=True); check(A.WARNINGS, 'explicit layout cutting bodies must warn')
# ---- ch3-redo-v2 pipeline hooks (PR "Ch3: engine for art drop")
import importlib, shutil
with tempfile.TemporaryDirectory() as td:
    cu, asd = os.path.join(td, 'custom'), os.path.join(td, 'assets')
    for d in ('boss', 'faces', 'objects', 'tiles'): os.makedirs(os.path.join(cu, d)); os.makedirs(os.path.join(asd, d), exist_ok=True)
    Image.new('RGBA', (432, 72)).save(os.path.join(cu, 'boss', 'willow_mother.png'))
    Image.new('RGBA', (38, 38)).save(os.path.join(cu, 'faces', 'willow_final.png'))
    Image.new('RGBA', (16, 14)).save(os.path.join(cu, 'objects', 'chest.png'))
    Image.new('RGBA', (128, 80)).save(os.path.join(cu, 'tiles', 'ch3fix.png'))
    json.dump({'willow_mother': {'fw': 62, 'fh': 62, 'n': 6, 'sc': 1, 'sheet': 'willow_mother', 'fd': 190}}, open(os.path.join(asd, 'boss', 'meta.json'), 'w'))
    oc, oa = A.CUSTOM, A.ASSETS; A.CUSTOM, A.ASSETS = cu, asd
    try:
        done = A.overlay(log=False); man = A.manifest(); mm = json.load(open(os.path.join(asd, 'boss', 'meta.json')))['willow_mother']
    finally: A.CUSTOM, A.ASSETS = oc, oa
    check((mm['fw'], mm['fh'], mm['n'], mm.get('fd')) == (72, 72, 6, 190), f'overlay must re-derive 72x72x6 and keep meta.fd: {mm}')
    check(os.path.exists(os.path.join(asd, 'faces', 'willow.png')), 'faces/willow_final.png must also be copied as faces/willow.png (alias)')
    check(not os.path.exists(os.path.join(asd, 'objects', 'chest.png')), 'art/custom/objects/* are build_assets cell overrides, not copied files')
    check('ch3fix' in man.get('tiles', []), f'manifest must list tiles/ch3fix: {man.get("tiles")}')
# ch3_assets never overwrites a file that art/custom owns
import ch3_assets as C3
with tempfile.TemporaryDirectory() as td:
    oc, oa = C3.CUSTOM, C3.A; C3.CUSTOM, C3.A = os.path.join(td, 'c') + '/', os.path.join(td, 'a') + '/'
    try:
        for d in ('c/chars', 'a/chars'): os.makedirs(os.path.join(td, d))
        Image.new('RGBA', (64, 112), (1, 2, 3, 255)).save(C3.CUSTOM + 'chars/oto.png'); C3.save(Image.new('RGBA', (64, 112)), 'chars', 'oto'); C3.save(Image.new('RGBA', (64, 112)), 'chars', 'rustle')
        check(not os.path.exists(C3.A + 'chars/oto.png') and os.path.exists(C3.A + 'chars/rustle.png'), 'ch3_assets.save must skip names provided in art/custom and still write the others')
    finally: C3.CUSTOM, C3.A = oc, oa
gg = open(os.path.join(ROOT, 'tools', 'gen_game.py')).read()
check(gg.find('art_overlay(); art_manifest()') > gg.find("'ch3_assets.py'") > 0, 'gen_game.py must run the art/custom overlay AFTER ch3_assets.py (custom art wins over placeholders)')
wm = SPEC['willow_mother']['sprite']
check(wm.get('noFar') is True and 'tint' not in wm, f'willow_mother: noFar and no tint expected: {wm}')
check(wm.get('phaseStrips', {}).get('Rootstorm') == 'willow_mother_strained' and SPEC['kappa_toll']['sprite'].get('phaseStrips', {}).get('Dish Spilled') == 'kappa_toll_spilled', 'phaseStrips for Willow Rootstorm / Kappa Dish Spilled')
if fails:
    print('\nFAIL'); [print(' -', f) for f in fails]; sys.exit(1)
print('\nOK: all boss frame layouts as expected; bell_keeper = 96x48 x6')
