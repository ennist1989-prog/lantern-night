"""Post-import balance/data fixes for the Chapter 1-2 slice (run by gen_game.py after the importers).
Kept separate from spec_import.py so art/sprite work there doesn't conflict with tuning here."""
import json, os, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = os.path.join(ROOT, 'public', 'data', 'spec')
def load(p): return json.load(open(p))
def dump(p, o): json.dump(o, open(p, 'w'), separators=(',', ':'), ensure_ascii=False)

bp = os.path.join(SPEC, 'bosses.json'); bosses = load(bp)
# A2: Straw Warden was a speed bump (Mio L1 solo 100%, ends ~36/90 HP). +30% HP, EXP 40 (a level at the story beat).
w = bosses['straw_warden']; w['stats']['mhp'] = 624; w['exp'] = max(w.get('exp', 0), 40)
# A6: the Bell-Keeper reward re-granted the clapper the player already used, and claimed "Kaze joins permanently"
# (Kaze joined in Chapter 1). Keep the tea; drop the duplicate key item and the stale unlock text.
bk = bosses['bell_keeper']; r = bk.setdefault('rewards', {})
r['items'] = [it for it in r.get('items', []) if it.get('item') != 'shrine_bell_clapper']
r['unlock'] = [u for u in r.get('unlock', []) if 'Kaze joins' not in u]
# L5 retune: after Gale Cut moved to L5 (#5) and the #15/#16 fixes, Mio+Kaze won ~87-92% at L5, so the boss was
# no longer a test. ATK 21 -> 25 lands L5 at ~66-69%, L6 ~95%, L7 ~99% (seeded, n=1000, auto and shift bots).
bk['stats']['atk'] = 25
dump(bp, bosses)

# Well Spirit (Ido-no-Kami): the Old Well key used to be a cutscene. It is now a short Parley battle. It is a slice-only
# enemy (not a bosses.json entry): sorrowful, so Remember/Soothe work, and two Remembers calm it at once. Hitting it
# also wins (weak to Gale near / Lumen far), so every outcome reaches the key. The troop is marked peaceful so a Send
# sets battle_peaceful and the scene can play the gentle ending. (Battle EXP comes from the level formula, 11;
# the map event tops it up by 14 so the old scripted 25 total is unchanged.)
ep = os.path.join(SPEC, 'enemies.json'); enemies = load(ep); tp = os.path.join(SPEC, 'troops.json'); troops = load(tp)
ws_stats = {'mhp': 340, 'atk': 11, 'def': 6, 'mat': 12, 'mdf': 7, 'agi': 8}
enemies['well_spirit'] = {
    'id': 'well_spirit', 'name': 'Ido-no-Kami', 'folklore': 'Ido-no-kami, the god of the well (Japanese household kami).',
    'kind': 'spirit', 'role': 'Chapter 2 Parley set-piece: grieving, barely fights back. Remember twice, then Send.',
    'archetype': 'std', 'level': 4, 'rarity': 'rare', 'level_range': [4, 4], 'stats': dict(ws_stats, msp=0),
    'forms': {'near': {'element': 'tide', 'rates': {'tide': 0.5, 'gale': 1.5}, 'skills': ['e_strike', 'tide_t1'], 'outputMult': 0.7},
              'far': {'element': 'tide', 'rates': {'tide': 0.5, 'lumen': 1.5}, 'skills': ['tide_t1', 'e_strike'], 'outputMult': 0.8}},
    'zones': [], 'sprite': dict(enemies['dust_wisp']['sprite']),
    'parley': {'temper': 'sorrowful', 'start': 30, 'drift': -2, 'calmAt': 100, 'likes': ['tea'], 'dislikes': [],
               'key': {'verb': 'remember', 'times': 2, 'item': None, 'note': 'It remembers being sung to.'},
               'recruit': False, 'invite_base': 0, 'fragment': False},
    'exp': 25, 'gold': 0, 'drops': [], 'bond': None, 'tint': '#8fd8ff', 'scale': 8, 'statsByLevel': {'4': ws_stats}}
troops['tr_well_spirit'] = {'id': 'tr_well_spirit', 'name': 'Ido-no-Kami', 'enemies': ['well_spirit'], 'kind': 'normal', 'level': 4,
                            'exp': 25, 'gold': 0, 'events': [], 'peaceful': True}
# Battle art: reuse the Dust Wisp crop (tinted water-blue and drawn larger at runtime); boot loads mon/<id>.png.
MON = os.path.join(ROOT, 'public', 'assets', 'mon'); shutil.copyfile(os.path.join(MON, 'dust_wisp.png'), os.path.join(MON, 'well_spirit.png'))
dump(ep, enemies); dump(tp, troops)
print('balance patches ok: warden mhp', w['stats']['mhp'], 'exp', w['exp'], '| bell_keeper atk', bk['stats']['atk'], '| bell_keeper rewards', r['items'], r['unlock'])
