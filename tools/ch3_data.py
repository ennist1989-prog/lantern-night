"""Chapter 3 data (run by gen_game.py after the importers): main-quest log for Ch3, Anchor as a story spell with a field
use, map names / dungeon exits for maps 10, 111-113."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, 'public', 'data', *a)
def load(p): return json.load(open(p))
# ---- Anchor: learned from Kaze at the stump (flag anchor_learned). Battle: lock the realm. Field: hold a Near/Far image in place.
L = load(P('spec', 'learn.json')); L['story']['mio_anchor'] = {'flag': 'anchor_learned', 'chapter': 3, 'members': None, 'who': 'mio'}
json.dump(L, open(P('spec', 'learn.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
S = load(P('spec', 'skills.json')); a = S['mio_anchor']
a['desc'] = 'Lock the current realm for 3 turns (enemies cannot flip it). FIELD: hold a Shore’s image in place for a moment (statues, drifting bridges, doorsteps).'
a['field'] = {'tile': 'anchor', 'realm': 'both', 'effect': 'anchor', 'range': 2, 'cost': {'sp': 6, 'lumen': 8}}
json.dump(S, open(P('spec', 'skills.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
# ---- quest log
Q = load(P('quests.json'))
Q['ch3'] = {'name': 'The Whisper Wick', 'desc': 'Night 3. The Bell rang, then fell silent. The first wick of the Lantern waits somewhere past the Whispering Forest, east of Ashiro.',
    'stages': ['Take the east road out of Ashiro into the Whispering Forest.',
               'Follow Kaze to the old stump in the forest clearing.',
               'Wake the two Resonance statues together: one sings on each Shore. (Hum, then Anchor.)',
               'Reach the Crossing. The Far Shore bridge drifts; the Anchor Stone may hold it.',
               'Get past the Kappa Toll-Keeper at the ford: pay, Parley or bout.',
               'Find the Willow Mother at the heart of Willow Hollow.',
               'Carry the Whisper Wick back across the forgetting river.'],
    'reward': 'Whisper Wick (+10 max Lumen)', 'doneText': 'The first wick is lit. Its warmth reached all the way back to Ashiro.'}
json.dump(Q, open(P('quests.json'), 'w'), ensure_ascii=False, indent=1)
# ---- system: map names, dungeon exits (Origami Crane / Escape)
Y = load(P('system.json'))
# map ids: 10 Whispering Forest (both realms), 111 The Crossing (Far map per the bible), 112 Willow Hollow, 113 Misty Grove
for k in ('7', '8', '9'): Y['mapNames'].pop(k, None); Y['dungeonExit'].pop(k, None)
Y['mapNames'].update({'10': 'Whispering Forest', '111': 'The Crossing', '112': 'Willow Hollow', '113': 'Misty Grove'})
Y['dungeonExit'].pop('10', None); Y['dungeonExit']['112'] = {'map': 111, 'x': 43, 'y': 12, 'dir': 'left'}
json.dump(Y, open(P('system.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('ch3 data ok')
