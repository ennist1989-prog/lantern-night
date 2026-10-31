"""Map 7: Reedwind Maze, the early training field west of Ashiro (Thomas: leveling field + maze, loops back to the village).
Walls are the maze-v1 hedge autotile (sheet 7, maze.png) on a grass floor; mouths use the v2.1 trail pieces. No Lantern Post here:
saves are a reward for progress (one-save-per-map rule)."""
import random
from mapkit import *
from maps_rest import chest
W, H = 35, 27
ENTRY = [(26, 0), (27, 0), (28, 0)]           # north edge: back up the trail to the village south plaza (map 1 22..24,29)
EXIT = [(0, 21), (0, 22), (0, 23)]            # west edge: the maze exit loops round to the village west road (map 1 0,16..17)
CHEST = (2, 21)   # one cell inside the exit trail (supply box; chest art until Ember's supply_box lands)
def maze_cells():
    rng = random.Random(1907)
    open_ = set(); stack = [(27, 1)]; open_.add((27, 1))
    while stack:
        x, y = stack[-1]
        nb = [(x + dx, y + dy, dx, dy) for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2)) if 1 <= x + dx <= 33 and 1 <= y + dy <= 25 and (x + dx, y + dy) not in open_]
        if not nb: stack.pop(); continue
        nx, ny, dx, dy = rng.choice(nb); open_.add((x + dx // 2, y + dy // 2)); open_.add((nx, ny)); stack.append((nx, ny))
    walls = sorted((x, y) for x in range(1, 34) for y in range(1, 26) if (x, y) not in open_ and (x % 2) != (y % 2))
    for c in rng.sample(walls, 14): open_.add(c)   # a few loops so the maze is not one long corridor
    for x in range(23, 32):                        # entrance clearing (the old reed field)
        for y in range(1, 5): open_.add((x, y))
    for x in range(1, 8):                          # exit clearing: supply box, last friend
        for y in range(20, 25): open_.add((x, y))
    return open_
NPCS = [  # (x, y, sheet, name, flag, gift, lines)
    (30, 3, 'haru', 'Haru', 'maze_haru', ('rice_ball', 2), [
        'Mio? Mio Ashiro! It’s me, Haru. We shared a desk at the temple school, remember? You always drew lanterns in the margins.',
        'Granny Sachi used to send us out here to cut reeds for the festival. Now the reed field’s grown into a hedge maze. Spirits wander it at night.',
        'If you’re going in, take these. You used to trade me your rice balls for my ink. Call it even.']),
    (17, 13, 'woman', 'Teacher Nao', 'maze_nao', None, [
        'Well, if it isn’t my most daydreaming pupil. You still stand like you’re listening for something only you can hear.',
        'Sachi told me once that keepers are taught twice: once by people, once by the road. This maze is the road’s lesson. Patience. Every dead end teaches the turn you missed.']),
    (9, 21, 'tokubei_far', 'Old Tokubei', 'maze_tokubei', ('lantern_oil', 2), [
        'Ah… the little one who waited by my cart every day after lessons. You and Haru, sticky fingers, one mochi between you.',
        'I sold sweets on the reed road for forty years. I don’t remember when I stopped. But I remember you.',
        'Lamp oil, from the bottom of my cart. A keeper should never walk with a hungry flame.']),
    (6, 23, 'villager4', 'Suzu', 'maze_suzu', ('herbal_tea', 2), [
        'You made it through! I got lost three times. Haru said you’d never need a map, since you used to win at hide-and-seek in these reeds.',
        'Remember when we hid here till dark and Granny Sachi found us with one lantern and no scolding at all? I think about that every Lantern Night.',
        'Herbal tea from my mother’s shop. And there’s a supply box by the exit. Someone left it there for travellers.']),
]
def path(cells, a, b):
    from collections import deque
    prev = {a: None}; q = deque([a])
    while q:
        c = q.popleft()
        if c == b: break
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (c[0] + dx, c[1] + dy)
            if n in cells and n not in prev: prev[n] = c; q.append(n)
    out = []; c = b
    while c: out.append(c); c = prev[c]
    return out[::-1]
def npc_spots(cells):
    """Teacher Nao and Old Tokubei stand in dead-end alcoves just off the solution path (1/3 and 2/3 of the way), so
    they never block the corridor to the exit."""
    sol = path(cells, (27, 1), (1, 22)); on = set(sol)
    deg = lambda c: sum((c[0] + dx, c[1] + dy) in cells for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    dead = [c for c in cells if c not in on and deg(c) == 1 and 8 <= c[0] <= 27]
    out = {}
    for i, f in ((1, 1 / 3), (2, 2 / 3)):
        t = sol[int(len(sol) * f)]
        c = min((d for d in dead if d not in out.values()), key=lambda d: (len(path(cells, t, d)), d)); out[i] = c
    return out
def build_maze():
    m = Map(7, 'Reedwind Maze', W, H, 'calm', 'village_far', seed=19)
    cells = maze_cells()
    m.fill('both', 0, 0, W - 1, H - 1, GRASS[0], walk=False)
    for (x, y) in cells: m.fill('both', x, y, x, y, GRASS)
    trail = set(ENTRY) | set(EXIT) | {(1, y) for y in (21, 22, 23)}
    allopen = cells | trail
    # hedge walls: maze-v1 autotile (sheet 7). Mask bit set when that neighbour is hedge (or off-map); floor everywhere else is grass.
    hedge = lambda x, y: not m.inb(x, y) or (x, y) not in allopen
    for y in range(H):
        for x in range(W):
            if hedge(x, y):
                k = (1 if hedge(x, y - 1) else 0) | (2 if hedge(x + 1, y) else 0) | (4 if hedge(x, y + 1) else 0) | (8 if hedge(x - 1, y) else 0)
                m.tile('both', x, y, G(MAZE, k % 4, k // 4))
    # top mouth (maze-v1 README "Maze mouths"): trail_open_n (26..28, 0..1), ch3fix rounded end at row 2, canopy edges either side
    for dx in range(3):
        for dy in range(2): m.tile('both', 26 + dx, dy, G(BORDER, 4 + dx, 2 + dy))
        m.tile('both', 26 + dx, 2, G(5, dx, 3))
    m.tile('both', 25, 0, G(BORDER, 7, 0)); m.tile('both', 29, 0, G(BORDER, 6, 0))
    # gate art: the same banner posts and sign as the village's east road (existing objects)
    m.region(0, 0, W - 1, H - 1, 3); m.region(23, 0, 31, 4, 0); m.region(0, 20, 7, 24, 0)   # clearings are calm
    m.encounter = dict(region=3, zone='z01m')
    deg = lambda c: sum((c[0] + dx, c[1] + dy) in cells for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    for c in cells:
        if deg(c) == 1: m.region(c[0], c[1], c[0], c[1], 0)   # no encounters on dead-end tips (art spec 5.3)
    # west exit: capped west piece G(6,0..1,8..10) (no raw dirt against grass at x=2), canopy edge caps above/below
    for dy in range(3):
        for dx in range(2): m.tile('both', dx, 21 + dy, G(BORDER, dx, 8 + dy))
    m.tile('both', 0, 20, G(BORDER, 4, 0)); m.tile('both', 0, 24, G(BORDER, 5, 0))
    m.light(27, 2, 4); m.light(3, 22, 4)
    for (x, y) in ENTRY: m.door_touch(x, y, 1, x - 4, 26, 'up', se=None)
    for (x, y) in EXIT: m.door_touch(x, y, 1, 1, 16 if y < 23 else 17, 'right', se=None, extra=[IF({'nsw': 'maze_cleared'}, [sw('maze_cleared')])])
    chest(m, CHEST[0], CHEST[1], [('rice_ball', 2), ('herbal_tea', 1), ('lantern_oil', 1), ('mochi', 1)], obj='supply_box', empty='The supply box is empty. Its cloth lies untied.')
    spots = npc_spots(cells)
    for i, (x, y, sheet, name, flag, gift, lines) in enumerate(NPCS):
        if i in spots: x, y = spots[i]
        first = [say(sheet, name, t) for t in lines]
        if gift: first.append(item(gift[0], gift[1]))
        first.append(sw(flag))
        after = [say(sheet, name, lines[-1] if not gift else 'Go on, Mio. The reeds remember you, even if they’ve grown taller.')]
        if sheet == 'haru': x, y = 30, 3          # Pixel Sage regrade: Haru at (30,3), both realms
        if sheet == 'tokubei_far': x, y = 11, 3   # Old Tokubei at (11,3), Far-only, never shown by peek
        eid = m.event(x, y, [page(g=NPC(sheet, 'down', step=False), list=[IF({'nsw': flag}, first, after)])], 'far' if sheet == 'tokubei_far' else 'both' if sheet == 'haru' else 'near')
        if sheet == 'tokubei_far':
            m.events[-1]['peek'] = False
            m.light(x, y, 1.1, 'far', a=0.3, tint=0xb8dce5)   # maze-v1 robe glow, static
    m.event(27, 2, [page(cond={'nsw': 'maze_intro'}, trigger='touch', through=True, list=[
        say('mio', 'Mio', 'The old reed field… it’s grown into a maze. Granny used to say a keeper learns the way by losing it first.'), sw('maze_intro')])])
    return m
