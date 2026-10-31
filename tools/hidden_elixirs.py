#!/usr/bin/env python3
"""Hidden Spirit Elixirs (Thomas): 20 secret pickups, one per spot, each in a little nook tucked behind a tree, rock, pot or
statue with no sparkle or marker. Stand on the nook tile, face UP at the blocked tile above it and press action (or click it):
you get 1 Spirit Elixir once (self switch A, so it stays opened in saves).

Events are appended AFTER each map's own events (gen_game.py calls add() just before m.save()), so existing ids never move.
carve=True opens the nook tile (collision only, it is already covered by the tree sprite); carve=False is a natural dead end.
tests/hidden_elixirs.mjs checks every spot (reachable on foot, one elixir once, persists) from this same list, via the
'hidden_elixir' tag on the event.
"""
from mapkit import page, item, self_sw, say

# (map id, stand x, stand y, realm, carve). The pickup event sits on (x, y - 1). Docs: /workspace/ln-pm/hidden-elixirs.md
SPOTS = [
    (1, 12, 27, 'both', False),   # #1 bottom of Ashiro: end of the hidden strip under the trees
    (1, 34, 5, 'both', True),
    (1, 1, 3, 'both', True),
    (2, 1, 8, 'both', False),
    (3, 12, 2, 'both', False),
    (4, 19, 15, 'both', False),
    (4, 22, 11, 'far', False),
    (5, 6, 7, 'both', False),
    (5, 17, 9, 'far', False),
    (6, 14, 3, 'both', False),
    (10, 19, 4, 'far', False),
    (10, 32, 4, 'both', True),
    (10, 36, 26, 'both', True),
    (111, 32, 12, 'both', False),
    (111, 44, 20, 'both', True),
    (112, 21, 16, 'both', True),
    (112, 21, 24, 'both', True),
    (113, 29, 2, 'far', False),
    (113, 2, 2, 'far', False),
    (113, 20, 20, 'both', True),
]

def add(m):
    for mid, x, y, realm, carve in SPOTS:
        if mid != m.id: continue
        if carve: m.walk(realm, x, y)
        m.event(x, y - 1, [page(cond={'nself': 'A'}, trigger='action', list=[
            say(None, None, 'Something glints, tucked deep where no one would look...'),
            item('spirit_elixir', 1), self_sw('A')], hidden_elixir=True, faceDir='up')], realm=realm)
