"""Post-import balance/data fixes for the Chapter 1-2 slice (run by gen_game.py after the importers).
Kept separate from spec_import.py so art/sprite work there doesn't conflict with tuning here."""
import json, os
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
print('balance patches ok: warden mhp', w['stats']['mhp'], 'exp', w['exp'], '| bell_keeper atk', bk['stats']['atk'], '| bell_keeper rewards', r['items'], r['unlock'])
