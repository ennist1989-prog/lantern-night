"""Import the items / equipment / key items / spells / summons package (research/data) into the build.
Runs after spec_import.py (hooked from gen_game.py). Everything lands in public/data as JSON; later chapters are data only.
Primary files: items_v2.json, equipment.json, keyitems.json, spells.json, summons.json + compat/items_v2 + compat/locks."""
import json, os, shutil
SRC = '/workspace/rpg-research/data'
AS = '/workspace/rpg-research/assets'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public'); DATA = os.path.join(PUB, 'data'); SPEC = os.path.join(DATA, 'spec')
def load(p): return json.load(open(os.path.join(SRC, p)))
def dump(p, o): json.dump(o, open(p, 'w'), separators=(',', ':'), ensure_ascii=False)

# ---------------- icon sheet (34px, 16 cols) -> assets/icons2.png + icons2.json (name -> frame)
shutil.copy(os.path.join(AS, 'lantern-icons-v2.png'), os.path.join(PUB, 'assets/icons2.png'))
ic2 = json.load(open(os.path.join(AS, 'icons_v2.json')))['icons']
dump(os.path.join(PUB, 'assets/icons2.json'), ic2)

# ---------------- trait translation (research schema -> engine keys)
def conv_trait(t):
    o = {}
    for k, v in t.items():
        if k == 'resist': o['stateResist'] = v
        elif k == 'elemBoost': o['elemDmg'] = {e: round(1 + x, 3) for e, x in v.items()}
        elif k == 'immune': o['stateImmune'] = v
        elif k == 'lumenSkill': o.setdefault('elemDmg', {})['lumen'] = round(1 + v, 3)
        else: o[k] = v
    return o
def conv_traits(ts): return [conv_trait(t) for t in ts or []]

items = json.load(open(os.path.join(DATA, 'items.json')))
compat = load('compat/items_v2.lantern-night.json')
v2 = load('items_v2.json')['items']
EQ = load('equipment.json'); KI = load('keyitems.json')
# overlay compat (build schema) on the spec-import result
for k, v in compat.items():
    o = {**items.get(k, {}), **v}
    if 'traits' in o: o['traits'] = conv_traits(o['traits'])
    items[k] = o
# icons for everything from items_v2.json (materials etc.)
for k, v in v2.items():
    if k in items:
        items[k].setdefault('iconV2', v.get('icon')); items[k].setdefault('rarity', v.get('rarity', 'common'))
# collisions / decisions
items['chime_offering'] = {'name': 'Wind Chime', 'type': 'offering', 'icon': 'flute', 'iconV2': 'I_Clock', 'desc': 'Offering: spirits that like sound.', 'price': 40, 'usable': False, 'offer': True, 'cats': ['sound'], 'shop': ['ch2'], 'rarity': 'common'}
items['honey'] = {'name': 'Honey', 'type': 'item', 'icon': 'honey', 'iconV2': 'I_C_Honey' if 'I_C_Honey' in ic2 else 'I_C_Pie', 'desc': 'Restores 70 HP. Also a lovely offering: spirits with a sweet tooth adore it.', 'price': 14, 'usable': True, 'scope': 'ally', 'effect': {'hp': 70}, 'offer': True, 'cats': ['food'], 'rarity': 'common'}
for k in ('anvil_core', 'garden_core'):   # heirloom catalysts: peaceful routes also yield them (designer decision)
    if k in items: items[k]['type'] = 'material'
# equipment table: gear metadata (sets, rarity, realm, forge flag)
gear = {g['id']: g for g in EQ['gear']}
for gid, g in gear.items():
    if gid in items:
        items[gid]['rarity'] = g.get('rarity', items[gid].get('rarity', 'common')); items[gid]['tier'] = g.get('tier', 0)
        if g.get('forge'): items[gid]['forge'] = True
        if g.get('relic'): items[gid]['relic'] = True
        if g.get('source'): items[gid]['source'] = g['source']
        if g.get('who') and g['who'] != 'all' and 'who' not in items[gid]: items[gid]['who'] = [g['who']]
# starting kit follows the doc ("recommendedKit")
dump(os.path.join(DATA, 'items.json'), items)
missing = [k for k, v in items.items() if v.get('iconV2') and v['iconV2'] not in ic2]
print('items', len(items), 'missing v2 icons:', missing)

# ---------------- equipment.json (runtime): slots, rarity colours, sets, forge
sets = {}
for sid, s in EQ['sets'].items():
    sets[sid] = {'name': s['name'], 'pieces': s['pieces'], 'desc': s.get('desc', ''), 'needs': s.get('needs'), 'bonus': {n: conv_traits(b) for n, b in s['bonus'].items()}}
forge = {k: EQ['forge'][k] for k in ('cap', 'statGain', 'matsRule', 'goldFrac', 'where')}
forge['tiers'] = {t: {'base': v['forgeBase'], 'gold': v['gold'], 'families': v['families']} for t, v in EQ['forge']['tiers'].items()}
dump(os.path.join(DATA, 'equipment.json'), {'rarity': {k: v['color'] for k, v in EQ['rarity'].items()}, 'sets': sets, 'forge': forge, 'slots': EQ['slots']})

# ---------------- key items + locks
BIDS = {'kiku_wind_chime': 'wind_chime'}
kis = {}
for k in KI['items'].values():
    bid = BIDS.get(k['id'], k['id'])
    kis[bid] = {'name': k['name'], 'desc': k['desc'], 'chapter': k['chapter'], 'cats': k['categories'], 'icon': k.get('icon'), 'zone': k['obtained']['zone'], 'how': k['obtained']['how'], 'flag': k['obtained'].get('flag'),
                'use': k.get('use'), 'unlocks': k.get('unlocks', []), 'story': k.get('story', ''), 'keepsake': k.get('keepsake')}
    it = items.setdefault(bid, {'name': k['name'], 'type': 'key', 'icon': 'goldkey', 'desc': k['desc'], 'price': 0, 'usable': False})
    it['type'] = 'key'; it['iconV2'] = k.get('icon') or it.get('iconV2'); it['chapter'] = k['chapter']
for k in KI.get('bondKeepsakes', []):
    items.setdefault(k['id'], {'name': k['name'], 'type': 'key', 'icon': 'gemy', 'desc': k['desc'], 'price': 0, 'usable': False})['iconV2'] = k['icon']; kis[k['id']] = {'name': k['name'], 'desc': k['desc'], 'chapter': 4, 'cats': ['keepsake'], 'icon': k['icon'], 'zone': '', 'how': 'A bonded spirit gives it at high Bond.', 'unlocks': [{'kind': 'summon', 'ref': k['summon']}], 'keepsake': k['summon']}
# designer decision: key items show stack counts; the Lantern Shard is a stack of 5 (from the .lnv2 package definition; gameplay in ch5-6)
items['lantern_shard'] = {'name': 'Lantern Shard', 'type': 'key', 'icon': 'gemp', 'iconV2': 'I_Crystal01', 'desc': 'A piece of the shattered Lantern. Five pieces are needed.', 'price': 0, 'usable': False, 'chapter': 5}
kis['lantern_shard'] = {'name': 'Lantern Shard', 'desc': 'A piece of the shattered Lantern. Five pieces are needed.', 'chapter': 5, 'cats': ['story'], 'icon': 'I_Crystal01', 'zone': 'z15', 'how': 'Cinder Hollow after the shattering (1 of 5), then the Memory Trail (4 more).', 'flag': '', 'use': 'story', 'unlocks': [], 'story': '', 'keepsake': None, 'stack': 5}
dump(os.path.join(DATA, 'items.json'), items)
locks = load('compat/locks.lantern-night.json')
for l in locks.values(): l['requires'] = [BIDS.get(r, r) for r in l['requires']]
dump(os.path.join(DATA, 'keyitems.json'), {'items': kis, 'locks': locks})

# ---------------- spells -> spec skills (+ learn tables), summons -> spec/summons
sk = json.load(open(os.path.join(SPEC, 'skills.json')))
SP = load('spells.json'); spells = SP['spells']
for sid, s in spells.items():
    o = {k: v for k, v in s.items() if k not in ('proposal', 'icon')}; o['iconV2'] = s.get('icon'); sk[sid] = o
dump(os.path.join(SPEC, 'skills.json'), sk)
SM = load('summons.json')
dump(os.path.join(SPEC, 'summons.json'), {'rules': SM['rules'], 'summons': SM['summons']})
st = json.load(open(os.path.join(SPEC, 'states.json')))
for k, v in SM['states'].items(): st[k] = {kk: vv for kk, vv in v.items() if kk != 'proposal'}
dump(os.path.join(SPEC, 'states.json'), st)
# level-learned spells -> actor skill lists; bond/story lists -> learn.json
actors = json.load(open(os.path.join(DATA, 'actors.json')))
learn = {'bond': {}, 'story': {}}
for who, rows in SP['learnTables'].items():
    if who not in actors: continue
    for r in rows:
        if not any(x[1] == r['spell'] for x in actors[who]['skills']): actors[who]['skills'].append([r['level'], r['spell']])
    actors[who]['skills'].sort(key=lambda x: x[0])
for sid, s in spells.items():
    L = s['learn']
    if L['mode'] == 'bond': learn['bond'][sid] = {'spirit': L['spirit'], 'level': L['level'], 'battles': L.get('lessonBattles', 3)}
    elif L['mode'] == 'story': learn['story'][sid] = {'flag': L['flag'], 'chapter': L.get('chapter'), 'members': (s.get('combo') or {}).get('members'), 'who': L.get('who')}
dump(os.path.join(DATA, 'actors.json'), actors); dump(os.path.join(SPEC, 'learn.json'), learn)
print('spells', len(spells), 'summons', len(SM['summons']), 'keyitems', len(kis), 'locks', len(locks))

# ---------------- system extras (dungeon exits for Paper Crane / Evac, no-warp rooms) + designer decision: peaceful routes also yield boss cores
sysd = json.load(open(os.path.join(DATA, 'system.json')))
sysd['dungeonExit'] = {'4': {'map': 1, 'x': 6, 'y': 24, 'dir': 'right'}, '5': {'map': 1, 'x': 18, 'y': 7, 'dir': 'down'}}
sysd['noWarp'] = [6]
dump(os.path.join(DATA, 'system.json'), sysd)
bs = json.load(open(os.path.join(SPEC, 'bosses.json'))); fixed = []
for bid, b in bs.items():
    r = b.get('rewards', {}); pr = b.setdefault('peaceful_rewards', {}); ex = pr.setdefault('extra', [])
    # engine grants rewards.items on every route (win, Send, Invite) and peaceful_rewards.extra only on peaceful ones;
    # so a core listed in either must live in rewards.items to be reachable both ways.
    for c in [x for x in ex if x['item'] in ('anvil_core', 'garden_core')]:
        if not any(i['item'] == c['item'] for i in r.get('items', [])): r.setdefault('items', []).append({'item': c['item'], 'n': 1})
        pr['extra'] = [x for x in ex if x is not c]; fixed.append((bid, c['item']))
dump(os.path.join(SPEC, 'bosses.json'), bs); print('core rewards ensured for both routes:', fixed)
