"""Import the battle/creature/boss spec data (research/data/*.json) into the build.
Run after gen_db.write(): python3 spec_import.py   (also called by gen_game.py)
Everything is data: later chapters only need entries in these JSON files."""
import json, os, shutil, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from art_custom import frame_meta, overlay as art_overlay, manifest as art_manifest
SRC = '/workspace/rpg-research/data'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
PACK = os.path.join(ROOT, '_dl/pack/Ninja Adventure - Asset Pack/Actor')
OUT = os.path.join(PUB, 'data/spec')
os.makedirs(OUT, exist_ok=True)

def load(n): return json.load(open(os.path.join(SRC, n + '.json')))
def dump(p, o): json.dump(o, open(p, 'w'), separators=(',', ':'), ensure_ascii=False)

enemies = load('enemies')['enemies']
for e in enemies.values():
    for k in ('notes', 'sprite_note'): e.pop(k, None)
skills = load('skills')['skills']; states = load('states')['states']; troops = load('troops')['troops']
bosses = load('bosses')['bosses']; zones = load('zones')['zones']; parley = load('parley'); bonds = load('bonds'); elements = load('elements'); prog = load('progression')
items_spec = load('items')

# ---------------- sprites: crop front-idle cell of each creature sheet -> assets/mon/<id>.png
MON = os.path.join(PUB, 'assets/mon'); os.makedirs(MON, exist_ok=True)
missing = []
for eid, e in enemies.items():
    s = e['sprite']; p = os.path.join(PACK, s['pack'], s['file'])
    if not os.path.exists(p): missing.append((eid, p)); continue
    im = Image.open(p).convert('RGBA'); sz = s.get('size', 16); cx, cy = s.get('cell', [0, 0])
    w, h = im.size
    box = (cx * sz, cy * sz, min(w, cx * sz + sz), min(h, cy * sz + sz))
    im.crop(box).save(os.path.join(MON, eid + '.png'))
# bosses: idle strips
# Repo-side sprite overrides on top of the research spec (which lives outside the repo):
#  - 'custom': path (from the repo root) of hand-made art in art/custom/ that replaces the pack image; if the file is missing
#    the current placeholder is kept, so main stays shippable until the art lands.
#  - keys set to None are removed (Tsubaki's '#503060' tint would multiply-darken the new art in the Near).
#  - 'noFar': her map sheet is exempt from the Far recolour (see character.ts NO_FAR).
SPRITE_OVERRIDES = {
    'tsubaki_forge': {'custom': 'art/custom/boss/tsubaki_forge.png', 'frame': [64, 64], 'n': 6, 'tint': None, 'noFar': True},
    'tsubaki_final': {'custom': 'art/custom/boss/tsubaki_final.png', 'frame': [64, 64], 'n': 6, 'tint': None, 'noFar': True},
    # pack Boss/GiantBlueSamurai/Idle.png is 576x48 = 6 frames of 96x48 (see the pack's IdlePreview.gif), not 12 squares
    'bell_keeper': {'frame': [96, 48], 'n': 6, 'frameExact': True},
    # #7 redesign slot (Ember, straw-warden-asset-pack.md): 384x64 strip; until it lands the GiantBamboo strip stays.
    # No tint, and the Far recolour stays ON (no noFar): the Far form is the engine's #cfe8ff multiply.
    'straw_warden': {'custom': 'art/custom/boss/straw_warden.png', 'frame': [64, 64], 'n': 6, 'tint': None},
    # Ch3 redo (ch3-art-spec.md, ch3-redo-v2): Willow Mother is a 72x72 x6 strip, exempt from the Far recolour, and the old
    # '#6fa070' tint is dropped (it would multiply-darken the new art; the placeholder flame is already hue-shifted green).
    # phaseStrips: boss phase name -> alternate strip in boss/ (shown while that phase is the latest one entered and, for a
    # phase entered by a state, while the state is on; Calm always shows the base strip). A missing strip falls back to the base.
    'willow_mother': {'custom': 'art/custom/boss/willow_mother.png', 'frame': [72, 72], 'n': 6, 'tint': None, 'noFar': True,
                      'phaseStrips': {'Rootstorm': 'willow_mother_strained', 'Heart Break': 'willow_mother_strained'}},
    'kappa_toll': {'custom': 'art/custom/boss/kappa_toll.png', 'frame': [64, 64], 'n': 6, 'tint': None, 'phaseStrips': {'Dish Spilled': 'kappa_toll_spilled'}},   # ch3-redo-v3 battler (64x64 x6; art byte-identical to v2)
}
for bid, ov in SPRITE_OVERRIDES.items():
    if bid not in bosses: continue
    sp = bosses[bid]['sprite']
    for k, v in ov.items():
        if v is None: sp.pop(k, None)
        else: sp[k] = v
BOSSD = os.path.join(PUB, 'assets/boss'); meta = json.load(open(os.path.join(BOSSD, 'meta.json')))
for bid, b in bosses.items():
    sp = b['sprite']; custom = os.path.join(ROOT, sp['custom']) if sp.get('custom') else None
    if custom and os.path.exists(custom): p = custom
    else:
        if custom: print(f'custom sprite for {bid} not delivered yet ({sp["custom"]}); keeping the pack/placeholder image')
        p = os.path.join(PACK, sp['pack'], sp.get('file', 'Idle.png'))
        custom = None
        if not os.path.exists(p):
            missing.append((bid, p)); shipped = os.path.join(BOSSD, bid + '.png')
            if not os.path.exists(shipped): continue
            p = shipped   # pack not downloaded in this checkout: keep the shipped image but still (re)derive its meta
    if os.path.abspath(p) != os.path.abspath(os.path.join(BOSSD, bid + '.png')): shutil.copy(p, os.path.join(BOSSD, bid + '.png'))
    meta[bid] = {**frame_meta(p, sp, custom=bool(custom)), 'sheet': bid, **({'fd': sp['fd']} if sp.get('fd') else {})}   # fd: frame delay (ms), battlescene uses meta.fd ?? 150
json.dump(meta, open(os.path.join(BOSSD, 'meta.json'), 'w'))
print('missing sprites:', missing)

# ---------------- items: convert to the build's item shape
ICON = {'rice_ball': 'onigiri', 'big_rice_ball': 'onigiri', 'rice_feast': 'sushi', 'herbal_tea': 'tea', 'sweet_tea': 'tea', 'moon_tea': 'tea', 'lantern_oil': 'lifepot', 'warm_ember': 'heart', 'antidote_salt': 'medipack', 'ward_salt': 'medipack', 'smoke_ball': 's_mist',
        'cucumber': 'water', 'mochi': 'cookie', 'paper_charm': 'scroll', 'incense_stick': 'stick', 'milk_bowl': 'milk', 'fried_fish': 'fish', 'sake_cup': 'gourd', 'silk_thread': 'scroll', 'marigold_petal': 'scrollplant', 'wind_chime': 'flute', 'memento': 'book', 'flower_bundle': 'scrollplant'}
old = json.load(open(os.path.join(PUB, 'data/items.json')))
keep = {}
# keep story/key items and a few legacy ones; drop legacy gear/consumables that the spec replaces
for k, v in old.items():
    if v.get('type') == 'key' or k in ('hush_bell', 'honey', 'dust_pouch', 'wish_scrap', 'bell_shard', 'hanzo_note', 'lucky_knot', 'spirit_charm', 'wind_chime'):
        keep[k] = v
keep['honey'] = {**keep.get('honey', {}), 'name': 'Honey', 'type': 'offering', 'icon': 'honey', 'desc': 'Offering: sweet and sticky. Spirits with a sweet tooth love it.', 'price': 14, 'offer': True, 'cats': ['food'], 'usable': False}
keep.pop('bond_bellmouse', None)
items = dict(keep)
def conv(i):
    t = i['type']; o = {'name': i['name'], 'desc': i['desc'], 'price': i.get('price', 0), 'icon': ICON.get(i['id'], {'material': 'dust_pouch', 'offering': 'cookie', 'key': 'goldkey', 'consumable': 'lifepot'}.get(t, 'bag'))}
    if i['id'] in ('wisp_dust',): o['icon'] = 'dust_pouch'
    cats = list(i.get('offering') or [])
    if t == 'material': o['type'] = 'material'; o['usable'] = False; o['sell'] = i.get('sell', i.get('price', 1))
    elif t == 'key': o['type'] = 'key'; o['usable'] = False
    elif t in ('consumable', 'offering'):
        o['type'] = 'item'; o['usable'] = bool(i.get('effect')); o['scope'] = 'ally'
        eff = {}
        for e in i.get('effect', []):
            if e['op'] == 'heal': eff['hp'] = e['value']
            elif e['op'] == 'sp': eff['sp'] = e['value']
            elif e['op'] == 'lumen': eff['lumen'] = e['value']; o['scope'] = 'self'
            elif e['op'] == 'escape': eff['escape'] = True; o['usable'] = 'battle'
            elif e['op'] == 'revive': eff['revive'] = e['pct']; o['scope'] = 'dead'
            elif e['op'] == 'cure': eff['cure'] = e['ids']
            elif e['op'] == 'removeStack': eff['removeStack'] = e['id']
        o['effect'] = eff
        if t == 'offering' and not eff: o['usable'] = False; o['type'] = 'offering'
        if cats or t == 'offering': o['offer'] = True; o['cats'] = cats
        if i.get('shop'): o['shop'] = i['shop']
    else: o['type'] = 'key' if i['id'] in ('shrine_bell_clapper',) else 'material'; o['usable'] = False
    return o
for k, i in items_spec['items'].items():
    if k in items and items[k].get('type') == 'key': continue
    if i['type'] == 'equip': continue
    items[k] = conv({**i, 'id': k})
for k in ('shrine_bell_clapper', 'keepers_ribbon', 'farmer_scarf'):
    if k in items: items[k]['type'] = 'key' if k == 'shrine_bell_clapper' else 'material'
SLOTMAP = {'weapon': 'weapon', 'armor': 'armor', 'charm': 'acc'}
for g in items_spec['gear']:
    p = {k: g[k] for k in ('atk', 'def', 'mat') if g.get(k)}
    items[g['id']] = {'name': g['name'], 'type': SLOTMAP[g['slot']] if g['slot'] != 'charm' else 'acc', 'slot': SLOTMAP[g['slot']], 'icon': {'weapon': {'mio': 'wand', 'kaze': 'club', 'daigo': 'hammer'}.get(g['who'], 'sai'), 'armor': 'armor', 'charm': 'amulet'}[g['slot']], 'desc': g.get('desc') or (g['name'] + '. ' + ', '.join(f'{k.upper()} +{v}' for k, v in p.items()) + '.'),
                      'price': g['price'], 'params': p, **({'who': [g['who']]} if g['who'] != 'all' else {}), 'shopChapter': g.get('shopChapter', 1), 'tier': g.get('tier', 0)}
CHT = {'charm2': [{'stateResist': {'hollow_touch': 0.5}}], 'charm3': [{'spRegen': 2}], 'charm4': [{'stateResist': {'burn': 0.5}}], 'charm5': [{'stateResist': {'chill': 0.5}}], 'charm6': [{'stateResist': {'wilt': 0.5}}], 'charm7': [{'crit': 0.08}], 'charm8': [{'elemDmg': {'lumen': 1.1}}]}
for k, v in CHT.items():
    if k in items: items[k]['traits'] = v
dump(os.path.join(PUB, 'data/items.json'), items)

# ---------------- actors (spec anchors + learn levels)
ACTORS = json.load(open(os.path.join(PUB, 'data/actors.json')))
anch = {'mio': dict(mhp=[90, 420], msp=[30, 150], atk=[8, 30], def_=[6, 22], mat=[10, 36], mdf=[8, 28], agi=[10, 24]),
        'kaze': dict(mhp=[70, 330], msp=[35, 160], atk=[9, 34], def_=[5, 19], mat=[9, 30], mdf=[6, 20], agi=[14, 40]),
        'daigo': dict(mhp=[130, 560], msp=[10, 50], atk=[11, 42], def_=[9, 34], mat=[3, 10], mdf=[4, 14], agi=[6, 14])}
learn = {'mio': [[1, 'mio_flare'], [2, 'mio_soothe'], [2, 'mio_mend'], [3, 'mio_glow'], [3, 'mio_remember'], [3, 'mio_send'], [4, 'mio_invite'], [5, 'mio_name_call'], [6, 'mio_warm_glow'], [7, 'mio_radiance']],
         'kaze': [[1, 'kaze_foxfire'], [2, 'kaze_pounce_mark'], [3, 'kaze_fade_step'], [4, 'kaze_shadow_bite'], [5, 'kaze_hum'], [5, 'kaze_gale_cut']],
         'daigo': [[1, 'daigo_guard_stance'], [1, 'daigo_rap'], [3, 'daigo_cleave'], [5, 'daigo_ward_strike'], [7, 'daigo_bulwark']]}
equip = {'mio': {'weapon': 'mio_w1', 'armor': 'garb1', 'acc': None}, 'kaze': {'weapon': 'kaze_w1', 'armor': 'garb1', 'acc': None}, 'daigo': {'weapon': 'daigo_w1', 'armor': 'garb1', 'acc': None}}
gear_ids = {g['id'] for g in items_spec['gear']}
for a, anc in anch.items():
    A = ACTORS[a]; A['params'] = {k.rstrip('_'): v for k, v in anc.items()}; A['skills'] = learn[a]; A['equip'] = {k: v for k, v in equip[a].items()}; A['attack'] = 'p_attack'
    if equip[a]['weapon'] not in gear_ids: print('WARN weapon', equip[a]['weapon'])
if 'garb1' not in gear_ids: print('WARN armor1', [g['id'] for g in items_spec['gear'] if g['slot'] == 'armor'])
dump(os.path.join(PUB, 'data/actors.json'), ACTORS)

# ---------------- spec data files
dump(os.path.join(OUT, 'enemies.json'), enemies); dump(os.path.join(OUT, 'skills.json'), skills); dump(os.path.join(OUT, 'states.json'), states)
for sid, lv in (('zashiki_child', 3), ('kodama_echo', 7)):
    if 'tr_' + sid not in troops and sid in enemies:
        troops['tr_' + sid] = {'id': 'tr_' + sid, 'name': enemies[sid]['name'], 'enemies': [sid], 'kind': 'normal', 'level': lv, 'exp': 8, 'gold': 0, 'events': []}
RECL = {'z01': 2, 'z02': 3, 'z03': 4, 'z04': 5, 'z05': 6}
for k, z in zones.items():
    z['recLevel'] = RECL.get(k, (z.get('levelRange') or [1, 1])[-1])
dump(os.path.join(OUT, 'troops.json'), troops); EPITHET = {'straw_warden': 'The Scarecrow Who Forgot Its Field', 'bell_keeper': 'He Who Holds the Silence', 'willow_mother': 'Mother of the Drowned Grove',
           'kappa_toll': 'Keeper of the Ford', 'gonbei': 'Master of the Borrowed Lanterns', 'hundred_year_anvil': 'First Anvil, Last Left Cold',
           'tsubaki_forge': 'The Hollow Regent', 'archive_echo': 'The Echo That Eats Names', 'garden_guardian': 'Warden of the Still Garden',
           'tsubaki_final': 'Keeper of Every Name', 'tengu_master': 'Judge of the Hundred Steps'}
for _bid, _b in bosses.items(): _b['epithet'] = EPITHET.get(_bid, '')
# Balance: Ch1 boss should pay a level (was 16; L1→L2 needs 20)
if 'straw_warden' in bosses: bosses['straw_warden']['exp'] = max(bosses['straw_warden'].get('exp', 0), 40)
dump(os.path.join(OUT, 'bosses.json'), bosses); dump(os.path.join(OUT, 'zones.json'), zones)
dump(os.path.join(OUT, 'parley.json'), parley); dump(os.path.join(OUT, 'bonds.json'), bonds); dump(os.path.join(OUT, 'elements.json'), elements); dump(os.path.join(OUT, 'progression.json'), prog)
# hand-made art in art/custom/ always wins and is copied last; then refresh the optional-asset manifest
art_overlay(); art_manifest()
print('spec import ok:', len(enemies), 'enemies', len(skills), 'skills', len(troops), 'troops', len(items), 'items')
