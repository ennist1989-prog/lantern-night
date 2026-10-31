"""Chapter 3: Whispering Forest (10), The Crossing (111), Willow Hollow (112), Misty Grove (113).
Story per hero-journey-pacing.md §12: the first Lantern wick, the Anchor, the Kappa toll, a mother's grief.
Sprite references are data-driven (chars/<sheet>.png, faces/<face>.png, boss/meta.json) so the new art drops in by file."""
from mapkit import *
from maps_rest import fill_walls, foe, chest
DIRT_O = PATH_O
WATER_G = (0, 6)        # grass-edged water blob (tiles/water.png)
WATER_P = (13, 6)       # violet 'forgetting river' blob
PLANK = G(4, 1, 13)
STONE_STEP = G(2, 12, 7)
# Far-readability fixes (far-readability-fixes.md): tile sheet 5 'ch3fix' = art/custom/tiles/ch3fix.png. Every remap below is
# gated on that file, so until the hand-checked art lands the maps stay byte-identical to the pack-tile versions.
CH3FIX_ON = has_ch3fix()
STONE_W = G(CH3FIX, 0, 0)             # 2a: stepping stone on a transparent tile (water/bank shows between the stones)
WATER_P_FIX = (4, 1)                  # 2b: violet-river blob with a #584b46 land-side lip, ch3fix (4..7,1..4)
DIRT_O_FIX = (0, 1)                   # 3: rimmed dirt-trail blob, ch3fix (0..3,1..4); every Ch3 trail (Area.carve)
PLANK_TOP, PLANK_BOT = G(CH3FIX, 1, 0), G(CH3FIX, 2, 0)   # 2c: Far bridge planks with a #7b473c top / bottom rim row (Near stubs stay PLANK)
POST_LIGHT = 4                        # 4e: Ch3 lantern-post glow radius (was mapkit's 6 = 77 px; 4 = ~51 px). Ch1/Ch2 posts keep 6.
NEAR_TREES = ['tree_big', 'tree_l2', 'tree_big', 'tree_orange', 'tree_big', 'tree_pink']
FAR_TREES = ['tree_white', 'pine_l', 'deadtree_l', 'tree_white', 'pine_l']

# Edge-exit art v2.1 (Ember, graded READY by New Bot): the six trail exits get their trail-opening piece pasted over the
# HEAD-built trail (no open_cells: the pieces are matched to the existing carve). map -> [(piece, x0, y0)], see mapkit TRAIL_PIECES.
TRAIL_EXITS = {10: [('w', 0, 17), ('e2', 48, 18)], 111: [('w2', 0, 12), ('e', 44, 11)], 112: [('w_cap', 0, 19)], 113: [('s_cap', 14, 24)]}
OPEN_CELLS = {112: {(33, 20), (33, 21), (33, 22)}}   # #17: the root-bridge end runs off the east edge (graded spec H)
def trail_exits(m):
    if not has_border(): return
    for (k, x0, y0) in TRAIL_EXITS.get(m.id, []):
        c0, r0, w, h = TRAIL_PIECES[k]
        for dy in range(h):
            for dx in range(w): m.tile('both', x0 + dx, y0 + dy, G(BORDER, c0 + dx, r0 + dy))
class Area:
    """Collects walkable cells per realm; carve() makes them walkable (dirt trail or grass)."""
    def __init__(self): self.cells = {'near': set(), 'far': set()}; self.trail = {'near': set(), 'far': set()}
    def rect(self, x0, y0, x1, y1, realm='both', trail=False):
        for r in (('near', 'far') if realm == 'both' else (realm,)):
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    self.cells[r].add((x, y))
                    if trail: self.trail[r].add((x, y))
    def carve(self, m, origin=None, sheet=None):
        # fix 3: with ch3fix present every Ch3 trail gets the #7b473c trodden rim (the spec's recommended scope: the same
        # collapse is measured on maps 10/111/112). Ch1/Ch2 maps don't use Area, so PATH_O there is untouched.
        if origin is None: origin, sheet = (DIRT_O_FIX, CH3FIX) if CH3FIX_ON else (DIRT_O, FLOOR)
        for r in ('near', 'far'):
            for (x, y) in self.cells[r]: m.walk(r, x, y, True)
            if self.trail[r]: m.blob(r, self.trail[r], origin=origin, sheet=sheet, open_cells=OPEN_CELLS.get(m.id, frozenset()) if has_border() else frozenset())

# Edge-exit art v2.1: flank markers beside the trail exits, grove stones at the Misty Grove gap, hollow fronds at the Hollow
# exits. map -> [(obj, x, y)]; base cells are already blocked ground. woods() keeps the cell and the one below clear (fronds:
# also the one above) so no canopy hides them (New Bot's flank check: 100% visible Near and Far with exactly these sets).
EDGE_OBJS = {10: [('flank_stump', 0, 16), ('flank_rock', 0, 20), ('flank_rock', 49, 17), ('flank_stump', 49, 21),
                  ('grove_stone_a', 23, 1), ('grove_stone_b', 27, 1)],
             111: [('flank_stump', 0, 11), ('flank_rock', 0, 15), ('hollow_fronds_l', 45, 10), ('hollow_fronds_r', 45, 14)],
             112: [('hollow_fronds_l', 0, 18), ('hollow_fronds_r', 0, 22)],
             113: [('flank_stump', 13, 25), ('flank_rock', 17, 25)]}
def edge_clear(m):
    """Cells woods() must leave clear for this map's EDGE_OBJS (call before woods())."""
    clear = set()
    for (n, x, y) in EDGE_OBJS.get(m.id, []):
        if n not in OBJ: continue
        clear.update((x, y + j) for j in ((-1, 0, 1) if n.startswith('hollow_fronds') else (0, 1)))
    return clear
def edge_objs(m):
    """Place EDGE_OBJS (after woods(), so they win depth ties), the trail-opening pieces and map 10's fog lip."""
    for (n, x, y) in EDGE_OBJS.get(m.id, []):
        if n in OBJ: m.obj('both', n, x, y, fw=1, fh=1)
    trail_exits(m)
    if m.id == 10 and has_border():
        for x, t in ((24, FOG_LIP_L), (25, FOG_LIP), (26, FOG_LIP_R)): m.tile('both', x, 0, t, layer='o')   # #13 mist, feathered sides
def woods(m, A, seed=0, far_only=False, clear=(), low=()):
    """Trees on blocked ground so every blocked cell reads as forest: big canopies on a staggered 3-grid, then small pines
    and bushes in the gaps next to paths (canopies may overhang paths a little). Cells in `low` only get 1-tile bushes (no
    canopy reaching into the row above), e.g. under a path tile where an NPC stands, so the NPC is not drawn under a tree."""
    for r in ('near', 'far'):
        open_ = A.cells[r]; cov = set()
        pal = FAR_TREES if r == 'far' else NEAR_TREES
        def free(c): return c not in open_ and c not in clear and c not in cov
        for y in range(1, m.h + 2, 2):
            off = (y // 2) % 2
            for x in range(-1 - off, m.w + 1, 3):
                base = [(x + i, y) for i in range(3)] + [(x + i, y - 1) for i in range(3)]
                if any(c in open_ or c in clear or c in low for c in base + [(x + i, y + 1) for i in range(3)]): continue
                k = pal[(x * 7 + y * 3 + seed) % len(pal)]
                m.obj(r, k, x, y, fw=3 if k in ('tree_big', 'tree_pink', 'tree_white', 'tree_orange') else 4, block=False)
                cov.update((x + i, y - j) for i in range(3) for j in range(3))
        small = ['pine_s', 'bush1'] if r == 'near' else ['pine_s', 'deadtree_s']
        for y in range(0, m.h):
            for x in range(0, m.w):
                if not free((x, y)): continue
                if free((x + 1, y)) and (x + 1) < m.w and (x, y) not in low and (x + 1, y) not in low:
                    m.obj(r, small[(x + y + seed) % 2], x, y, fw=2, block=False); cov.update([(x, y), (x + 1, y), (x, y - 1), (x + 1, y - 1)])
                else:
                    m.obj(r, 'bush1' if r == 'near' else 'deadtree_s', x, y, fw=1, block=False); cov.add((x, y))

def deco(m, A, realm, names, n, seed):
    import random
    rnd = random.Random(seed); cells = sorted(A.cells[realm] - A.trail[realm])
    for _ in range(n):
        if not cells: return
        x, y = rnd.choice(cells); m.obj(realm, rnd.choice(names), x, y, fw=1, block=False, flat=True)

def kz(t): return say('kaze', 'Kaze', t)
def mio(t): return say('mio', 'Mio', t)
def anchor_menu(then):
    """Fallback for players who never open the Skills menu: cast Anchor from the event itself (same 8 Lumen)."""
    return IF({'sw': 'anchor_learned'}, [choice(['Anchor it (8 Lumen)', 'Leave it'], [[{'c': 'lumen', 'n': -8}, {'c': 'se', 'name': 'powerup'}, {'c': 'flash', 'color': 0xffe0a0, 'ms': 250}] + then, []])])

def pilgrim_memory(m, x, y, idx, text):
    m.event(x, y, [page(cond={'sw': 'cord_tied', 'nself': 'A'}, g=NPC('ghostman', 'down', tint=0x9fc8ff, alpha=0.55), list=[
        {'c': 'se', 'name': 'magic'}, {'c': 'flash', 'color': 0xcfe9ff, 'ms': 300},
        narr(*text), {'c': 'var', 'name': 'pil_mem', 'op': '+=', 'v': 1}, self_sw('A'),
        IF({'v': ['pil_mem', '>=', 3]}, [say(None, None, 'The cord at Mio’s wrist pulls gently east, toward the Crossing.'), quest('sq06', 2)],
           [say(None, None, 'The thread of light dims, then points somewhere else.')])])], 'far')

# =====================================================================================================  10  Whispering Forest
def build_forest():
    m = Map(10, 'Whispering Forest', 50, 40, 'forest', 'forest_far', seed=10)
    m.fill('both', 0, 0, 49, 39, GRASS, walk=False)
    A = Area()
    A.rect(0, 17, 14, 19, trail=True)                 # west trail from Ashiro
    A.rect(8, 7, 17, 13); A.rect(11, 14, 12, 16, trail=True)        # stump clearing
    A.rect(14, 18, 18, 19, trail=True); A.rect(18, 17, 32, 22)       # junction
    A.rect(24, 10, 25, 16, trail=True); A.rect(19, 4, 31, 9)          # statue glade
    A.rect(24, 0, 26, 3, trail=True)                                  # north root gate -> Misty Grove
    A.rect(32, 18, 49, 19, trail=True)                                # east trail -> the Crossing
    A.rect(35, 7, 42, 13); A.rect(38, 14, 39, 17, trail=True)         # Rustle glade (NE)
    A.rect(21, 23, 22, 29, trail=True); A.rect(12, 30, 38, 33); A.rect(37, 20, 38, 29, trail=True)   # south loop
    A.rect(3, 28, 10, 34); A.rect(10, 31, 12, 32, trail=True)         # SW pocket
    A.carve(m); woods(m, A, 3, clear=edge_clear(m)); edge_objs(m)
    deco(m, A, 'near', ['flower_y', 'flower_w', 'fern', 'tuft1', 'clover'], 40, 1)
    deco(m, A, 'far', ['fern', 'tuft2', 'tuft3', 'clover'], 30, 2)
    m.region(0, 0, 49, 39, 3); m.encounter = dict(region=3, zone='z06')
    m.region(0, 16, 6, 20, 0); m.region(8, 7, 17, 13, 6)                # quiet entry, stump is safe
    # ---- exits
    for y in (17, 18, 19): m.door_touch(0, y, 1, 34, 16, 'left', se=None)
    for y in (18, 19): m.door_touch(49, y, 111, 1, 12, 'right', se=None)
    for x in (24, 25, 26): m.door_touch(x, 0, 113, 15, 23, 'up', se=None, cond={'sw': 'chorus_done'})
    # ---- first entry
    m.event(2, 18, [page(cond={'nsw': 'forest_intro'}, trigger='auto', list=[
        narr('Chapter 3 · The Whispering Forest'),
        kz('The road east. Every year the festival lanterns come down this way and float off at the Crossing.'),
        mio('The trees are talking. Not words. More like… someone humming with their mouth closed.'),
        kz('That’s the Forest. It hums the names of everyone who walked through it. Most of the names are getting quiet.'),
        kz('There’s an old stump north of the path. My grandmother said a fox spirit taught her a trick there. I want to show you.'),
        sw('forest_intro'), quest('ch3', 1)])])
    # ---- stump clearing: Kaze teaches Anchor
    m.obj('both', 'stump', 12, 9, fw=2)
    for ex in (11, 12): m.event(ex, 13, [page(cond={'nsw': 'anchor_learned'}, trigger='touch', list=[
        kz('Here. Watch the leaf on the stump. Shift, and it’s on the Far Shore. Shift back, and it’s gone again, right?'),
        {'c': 'shift', 'to': 'far'}, {'c': 'wait', 'ms': 500},
        kz('Now hold the Lantern still. Don’t push it toward either shore. Just… tell the light to stay.'),
        {'c': 'se', 'name': 'magic'}, {'c': 'flash', 'color': 0xffe0a0, 'ms': 400}, {'c': 'shift', 'to': 'near'},
        say(None, None, 'The leaf stays. One Far Shore leaf, resting on a Near Shore stump, glowing faintly.'),
        mio('It’s still here. I anchored it.'),
        kz('That’s the trick. An Anchor holds one Shore’s picture in place for a little while. Statues, bridges, doorsteps. Things that need both Shores at once.'),
        {'c': 'me', 'name': 'secret'}, sw('anchor_learned'),
        tut('anchor', 'Mio learned ANCHOR. In battle it locks the current Shore for 3 turns. In the field (Menu → Skills → Anchor, 6 SP + 8 Lumen) it holds a Shore’s image in place: use it next to statues, drifting bridges and doorsteps.', 7000),
        quest('ch3', 2)]),
        page(cond={'sw': 'anchor_learned'}, trigger='touch', through=True, list=[])])
    m.event(12, 9, [page(list=[say(None, None, 'An old stump.'), IF({'sw': 'anchor_learned'}, [say(None, None, 'A single glowing leaf rests on it, from both Shores at once.')])])])
    # ---- Resonance statues (one per Shore). Hum sets tmp_res_* (cleared on Shift); Anchor makes it res_*_held.
    m.obj('near', 'statue_orb', 22, 6, fw=1); m.obj('far', 'statue_orb', 28, 6, fw=1)
    m.light(22, 6, 3, 'near'); m.light(28, 6, 3, 'far')
    chorus = [{'c': 'se', 'name': 'bell'}, {'c': 'shake', 'power': 1, 'ms': 600}, {'c': 'flash', 'color': 0xffffff, 'ms': 500},
              say(None, None, 'Both statues sing the same note, one on each Shore. The roots across the north path loosen and draw back like sleepy fingers.'),
              mio('They were singing to each other the whole time. They just couldn’t hear.'),
              kz('North, then. The mist past the roots is the Grove. If anyone knows how to cross a river that forgets, it’s someone in there.'),
              sw('chorus_done'), quest('ch3', 3)]
    def statue(side, other, realm, x):
        held, tmp = 'res_%s_held' % side, 'tmp_res_%s' % side
        hold = [IF({'sw': tmp}, [sw(held), say(None, None, 'The Anchor wraps the note in light. It keeps ringing, even when the Shore turns.'),
                                 IF({'sw': 'res_%s_held' % other}, chorus, [mio('One voice held. The other statue is on the other Shore.')])],
                   [say(None, None, 'The Anchor settles on silent stone. Nothing to hold yet. (Hum first.)')])]
        hum = [{'c': 'se', 'name': 'chime'}, sw(tmp), say(None, None, 'Mio hums. The statue answers with one clear note… which starts to fade.'),
               IF({'sw': 'res_%s_held' % other}, chorus, [IF({'sw': 'anchor_learned'}, [mio('If I Shift, the note will stop. Unless I anchor it.')])])]
        m.event(x, 6, [
            page(cond={'nsw': 'chorus_done'}, list=[
                IF({'sw': held}, [say(None, None, 'The statue keeps its anchored note. Somewhere on the other Shore, a partner waits.')],
                   [say(None, None, 'A round stone statue with a hollow throat. It seems to be waiting to be sung to.'),
                    choice(['Hum', 'Leave'], [hum + [IF({'nsw': 'chorus_done'}, [anchor_menu(hold)])], []])])],
                 ft='anchor', fieldList=hold),
            page(cond={'sw': 'chorus_done'}, list=[say(None, None, 'The statue hums quietly to its partner on the other Shore.')])], realm)
    statue('n', 'f', 'near', 22); statue('f', 'n', 'far', 28)
    m.event(25, 9, [page(cond={'nsw': 'glade_hint'}, trigger='touch', through=True, list=[
        kz('Two statues, but I can only see one. Shift, and I see the other.'),
        mio('They have to sing together. One Shore at a time won’t work…'), sw('glade_hint')])])
    for x in (24, 25, 26):
        m.event(x, 3, [page(cond={'nsw': 'chorus_done'}, g=dict(obj='tree_trunk'), list=[say(None, None, 'Thick roots knot across the path. They tremble whenever the statues hum.')])])
    # ---- junction Post
    m.post(28, 20, light=POST_LIGHT)
    # ---- Rustle Sprite (sq06 start): trades the Remembrance Cord for a Flower Bundle
    m.event(39, 9, [
        page(cond={'nsw': 'cord_got'}, g=NPC('rustle', 'down'), list=[
            say('rustle', 'Rustle Sprite', 'Shh-shh. Rustle-rustle. You smell of lanterns. Lantern people always want things.'),
            say('rustle', 'Rustle Sprite', 'I have a cord of knotted names. Someone dropped it at the Crossing a hundred autumns ago. Tie it to a Hollowed one and their name comes back.'),
            IF({'nsw': 'sq06_seen'}, [quest('sq06', 0), sw('sq06_seen')]),
            IF({'item': 'flower_bundle'}, [choice(['Trade a Flower Bundle', 'Not now'], [[item('flower_bundle', -1, quiet=True), {'c': 'se', 'name': 'pickup'},
                say('rustle', 'Rustle Sprite', 'Ohhh. Flowers that remember the sun. Here, here. Mind the knots.'),
                item('remembrance_cord'), sw('cord_got'), quest('sq06', 1),
                kz('There was a pilgrim at the Crossing, Mio. A grey one. He just stood there.')], []])],
               [say('rustle', 'Rustle Sprite', 'Bring me flowers. A whole bundle. The Mist Peddler in the Grove sells them, or a Marigold Moth might drop some.')])]),
        page(cond={'sw': 'cord_got'}, g=NPC('rustle', 'down'), list=[say('rustle', 'Rustle Sprite', 'Rustle-rustle. Tie it gently. Names bruise.')])])
    # ---- Kaze shows the forest has forgotten Ashiro's name (flavour, Far)
    m.event(30, 18, [page(cond={'nsw': 'forest_hum'}, trigger='touch', through=True, list=[
        say(None, None, 'On the Far Shore, the humming is clearer. It is a list of names, sung very softly. Mio hears Sachi’s, and her grandfather’s.'),
        mio('Kaze… it skipped one. It went from my grandfather straight to me.'),
        kz('My mother. The Forest forgot her, too. That’s what the Hollow does. It starts with the names.'), sw('forest_hum')])], 'far')
    # ---- south loop: moss leshy elite (Far, visible), hidden caches only Oto's Bell can find
    foe(m, 30, 31, 'tr_moss_leshy_rustle_sprite', 'rustle', aggro=3, range=2, spd=320)
    foe(m, 16, 31, 'tr_forgotten_pilgrim_rustle_sprite', 'ghostman', aggro=3, range=2)
    for (x, y, its) in [(5, 29, [('kuzu_tonic', 2), ('lantern_oil', 1)]), (41, 8, [('small_bell', 1), ('umeboshi', 2)])]:
        got = [item(i, n) for i, n in its]
        m.event(x, y, [page(cond={'item': 'oto_bell', 'nself': 'A'}, g=dict(obj='chest'), list=[say(None, None, 'Oto’s bell jingles by itself. There is something tucked under the roots.'), {'c': 'chestopen'}] + got + [self_sw('A')]),
                       page(cond={'item': 'oto_bell', 'self': 'A'}, g=dict(obj='chest_open'), list=[say(None, None, 'Empty. The bell is quiet now.')])])
    chest(m, 36, 32, [('herbal_tea', 2), ('marigold_petal', 2)]); chest(m, 19, 5, [('ward_salt', 1)], realm='far')
    pilgrim_memory(m, 6, 31, 1, ['A thread of light leads into the ferns. A young man, laughing, ties a cord around his little sister’s wrist so she won’t get lost at the festival.', '“Yoshi,” she calls him. The name hangs in the air like a firefly.'])
    m.light(12, 9, 4); m.light(25, 6, 4)
    return m

# =====================================================================================================  113  Misty Grove (Far)
def build_grove():
    m = Map(113, 'Misty Grove', 32, 26, 'grove', 'grove', seed=113)
    m.fill('both', 0, 0, 31, 25, GRASS, walk=False)
    A = Area()
    A.rect(12, 19, 19, 24); A.rect(14, 24, 16, 25, trail=True)        # entry clearing (both Shores)
    A.rect(15, 11, 16, 18, 'far', trail=True); A.rect(4, 9, 27, 10, 'far', trail=True)
    A.rect(4, 6, 5, 8, 'far', trail=True); A.rect(2, 2, 9, 5, 'far')                 # Mist Peddler clearing
    A.rect(26, 6, 27, 8, 'far', trail=True); A.rect(22, 2, 29, 5, 'far')             # Heron keeper clearing
    A.rect(15, 4, 16, 8, 'far', trail=True); A.rect(13, 1, 18, 3, 'far')             # north guide stone
    A.rect(8, 11, 9, 16, 'far', trail=True); A.rect(4, 15, 9, 18, 'far')             # SW hollow (memory)
    A.carve(m)
    woods(m, A, 5, clear=edge_clear(m)); edge_objs(m)
    deco(m, A, 'far', ['fern', 'tuft2', 'tuft3', 'flower_w'], 26, 4); deco(m, A, 'near', ['fern', 'tuft1'], 6, 5)
    m.region(0, 0, 31, 18, 3); m.encounter = dict(region=3, zone='z07')
    for x in (14, 15, 16): m.door_touch(x, 25, 10, 25, 2, 'down', se=None)
    m.post(13, 21, light=POST_LIGHT)
    m.event(15, 23, [page(cond={'nsw': 'grove_intro'}, trigger='auto', list=[
        say(None, None, 'Mist hangs between the trees, so thick the Near Shore seems to end a few steps ahead.'),
        kz('On this Shore the paths stop. Shift, and they appear. Stay close.'), sw('grove_intro')])])
    # lost traveller (Near)
    m.event(17, 20, [page(cond={'nsw': 'traveller_saved'}, g=NPC('villager2', 'left'), list=[
        say('villager2', 'Lost Traveller', 'Every path here bends back to this clearing. I came to leave a lantern for my father at the Crossing. That was… days ago? I can’t tell.'),
        mio('There are paths on the other Shore. You can’t see them, can you?'),
        say('villager2', 'Lost Traveller', 'Only mist. If you could make a path stay put long enough for me to see it, I’d follow it anywhere.'), sw('traveller_met')])], 'near')
    # Heron keeper (Far)
    m.event(25, 3, [page(g=NPC('priest', 'down', tint=0xcfe0ff), list=[
        say('priest', 'Heron Keeper', 'A Lantern. Then the old Shrine Bell really rang. I keep the guide stone at the top of this grove; it shows the way out to those who stand on the wrong Shore.'),
        IF({'nsw': 'traveller_saved'}, [say('priest', 'Heron Keeper', 'But the stone only lights a Far path. A Near traveller cannot walk it… unless someone holds the Far path in place for them.'),
            mio('An Anchor. I can do that.')],
           [say('priest', 'Heron Keeper', 'You did well with the traveller. Keep the Anchor Stone. It will not drift, not even on the river.')])])], 'far')
    lead = [{'c': 'se', 'name': 'bell'}, {'c': 'flash', 'color': 0xffe0a0, 'ms': 400},
            say(None, None, 'The path of light from the guide stone hardens and stays. For a long moment both Shores share one road through the mist.'),
            {'c': 'shift', 'to': 'near'}, say('villager2', 'Lost Traveller', 'There! A road! I can see it! Thank you, Lantern girl!'),
            say(None, None, 'Footsteps hurry away along the held path, then fade. The mist thins a little.'),
            {'c': 'shift', 'to': 'far'}, say('priest', 'Heron Keeper', 'You held a whole road. Take this. The river at the Crossing drifts, and this stone does not.'),
            item('anchor_stone'), sw('traveller_saved'), quest('ch3', 3),
            kz('The bridge at the Crossing. That’s what the stone is for.')]
    m.obj('far', 'statue_guard', 15, 2, fw=1); m.light(15, 2, 4, 'far')
    m.event(15, 2, [page(g=None, list=[IF({'nsw': 'traveller_saved'}, [say(None, None, 'The guide stone. A faint path of light runs down from it, flickering in and out of the world.'),
        IF({'sw': 'traveller_met'}, [anchor_menu(lead)], [mio('Someone down in the Near clearing might need this path…')])],
        [say(None, None, 'The guide stone hums. The road it shows is steady now.')])],
        ft='anchor', fieldList=[IF({'nsw': 'traveller_saved'}, [IF({'sw': 'traveller_met'}, lead, [say(None, None, 'The path holds, but no one is waiting to walk it.')])])])], 'far')
    # Mist Peddler (Far shop)
    goods = ['flower_bundle', 'cucumber', 'marigold_petal', 'umeboshi', 'matcha', 'tallow_candle', 'ofuda_barrier', 'paper_crane', 'small_bell', 'ward_salt', 'kuzu_tonic', 'lantern_oil']
    m.event(5, 3, [page(g=NPC('spirit', 'down'), list=[say('spirit', 'Mist Peddler', 'Flowers, cucumbers, candles that burn without wax. Coins from the Near Shore spend the same here.'),
        {'c': 'shop', 'items': goods, 'name': 'Mist Peddler', 'face': 'spirit'}])], 'far')
    # Kodama: stand still and listen (z07 special)
    m.obj('far', 'stump', 21, 9, fw=2)
    m.event(21, 10, [page(cond={'nself': 'A'}, list=[say(None, None, 'A tiny stump. If you stand still, something inside seems to be listening back.'),
        choice(['Stand still and listen', 'Walk on'], [[{'c': 'wait', 'ms': 1800}, {'c': 'se', 'name': 'chime'},
            say(None, None, 'Something answers in Mio’s own voice, a heartbeat late: “…listen… listen…” A kodama!'),
            {'c': 'battle', 'troop': 'tr_kodama_echo', 'win': [self_sw('A')], 'escape': [], 'lose': [{'c': 'abort'}]}], []])]),
        page(cond={'self': 'A'}, list=[say(None, None, 'The stump is quiet. Then, very softly, it repeats “…thank you…”')])], 'far')
    pilgrim_memory(m, 6, 16, 2, ['The cord leads into the mist. The young pilgrim, Yoshi, older now, carries his sister on his back through these same trees. She is too sick to walk.', '“The Crossing,” he tells her. “The kappa there lets the sick ride across for free. Everyone says so.”'])
    chest(m, 28, 2, [('fresh_cucumber_set', 1)], realm='far'); chest(m, 3, 2, [('hanami_dango', 2)], realm='far')
    return m

# =====================================================================================================  111  The Crossing
def build_crossing():
    m = Map(111, 'The Crossing', 46, 26, 'crossing', 'crossing_far', seed=111)
    m.fill('both', 0, 0, 45, 25, GRASS, walk=False)
    A = Area()
    A.rect(0, 12, 3, 13, trail=True); A.rect(1, 3, 19, 23)             # west bank
    A.rect(25, 9, 29, 15); A.rect(30, 12, 32, 12, trail=True)          # landing + 1-tile ford chokepoint
    A.rect(33, 4, 43, 22); A.rect(43, 11, 45, 13, trail=True)          # east bank -> Willow Hollow
    A.carve(m)
    river = [(x, y) for x in range(20, 25) for y in range(0, 26)]
    m.blob('both', river, origin=WATER_G, sheet=WATER, walk=False, open_edge=True)  # the river runs off the screen edge
    for x in range(20, 25):
        for y in (12, 13): m.tile('far', x, y, (PLANK_TOP if y == 12 else PLANK_BOT) if CH3FIX_ON else PLANK, 'o')   # 2c: #7b473c rims on the long edges
    for x in (20, 24): m.tile('near', x, 12, PLANK, 'o')                 # broken Near bridge stubs
    m.dynwalk('far', [(x, y) for x in range(20, 25) for y in (12, 13)], {'sw': 'bridge_held'})
    # Kappa's gate (events at (31,12) on the ford and (31,11) once he steps aside): no tree trunk on his aside tile, and only
    # low bushes on the row under the ford, whose pine canopies used to overhang (31,12) and hide his body (grading/v3
    # map111_kappa_occlusion_v3.txt). Walkability is unchanged: these cells were and stay blocked ground.
    # Nothing directly under the Kappa ford tile (31,12): row-13 cells x30-32 stay clear so no bush/dead tree is drawn over the Kappa; neighbours stay low.
    woods(m, A, 7, clear=edge_clear(m) | set(river) | {(31, 11)} | {(x, 13) for x in (30, 31, 32)}, low={(x, 13) for x in (29, 33)}); edge_objs(m)
    deco(m, A, 'near', ['flower_y', 'flower_r', 'tuft1', 'clover'], 26, 6); deco(m, A, 'far', ['tuft2', 'fern', 'flower_w'], 24, 7)
    m.region(0, 0, 45, 25, 3); m.encounter = dict(region=3, zone='z08')
    m.region(2, 5, 14, 15, 6)                                            # Hisa's yard is safe
    for y in (12, 13): m.door_touch(0, y, 10, 48, 18, 'left', se=None)
    for y in (11, 12, 13): m.door_touch(45, y, 112, 1, 20, 'right', se=None)
    m.post(11, 12, light=POST_LIGHT)
    # ---- Old Hisa's ferry shop + inn (Near)
    m.obj('both', 'shop', 6, 8, fh=3); m.obj('near', 'barrel', 10, 8, fw=1); m.obj('near', 'pot_big', 4, 9, fw=1)
    m.light(7, 9, 4, 'near')
    hisa_goods = ['cucumber', 'fresh_cucumber_set', 'river_trout', 'hanami_dango', 'umeboshi', 'matcha', 'tallow_candle', 'ofuda_barrier', 'ward_salt', 'lantern_oil', 'kuzu_tonic', 'paper_crane',
                  'mio_w2a', 'kaze_w2a', 'daigo_w2a', 'mio_w2b', 'kaze_w2b', 'daigo_w2b', 'rain_cape', 'fox_fur_vest', 'day_cloak_1', 'far_shawl_1', 'charm2', 'c_hush_tassel', 'c_wellwater_locket', 'c_chime_anklet']
    m.event(7, 10, [page(g=NPC('hisa', 'down'), list=[
        say('hisa', 'Old Hisa', 'A Lantern-bearer, at my ferry! Ferry’s been dry for years, dear, but the shop’s open and the futon’s aired.'),
        IF({'nsw': 'sq05_seen'}, [say('hisa', 'Old Hisa', 'Funny thing. Every night a little dog sits on my doorstep. Every morning he’s gone. I’ve never once been able to pet him.'), quest('sq05', 0), sw('sq05_seen')]),
        choice(['Shop', 'Rest (30 G)', 'Chat', 'Leave'], [[{'c': 'shop', 'items': hisa_goods, 'name': 'Old Hisa', 'face': 'hisa'}],
            [{'c': 'inn', 'price': 30, 'name': 'Old Hisa', 'face': 'hisa', 'ask': 'Thirty gold for river fish and a quiet room. Stay the night?'}],
            [IF({'nsw': 'kappa_passed'}, [say('hisa', 'Old Hisa', 'The Kappa at the ford? He’s proud, not cruel. Bring him a cucumber and bow back when he bows. My Oto used to bark at him.')],
                [say('hisa', 'Old Hisa', 'Past the ford is the Hollow, where the Willow Mother weeps. Folk go in there to forget something, and come out forgetting everything.')])], []])])], 'near')
    # ---- Oto (Far, at the doorstep): sq05
    oto_bye = [{'c': 'se', 'name': 'bell'}, {'c': 'flash', 'color': 0xffe0a0, 'ms': 400},
        say(None, None, 'The Anchor holds the doorstep’s Far Shore image in place. For a moment Hisa’s door belongs to both Shores.'),
        {'c': 'shift', 'to': 'near'}, say('hisa', 'Old Hisa', '…Oto? Oto! Oh, you silly thing, you’ve been here the whole time?'),
        say(None, None, 'She kneels. Her hand passes through his ears, but he leans into it anyway, tail thumping the step.'),
        say('hisa', 'Old Hisa', 'Go on, then. You don’t have to wait for me. I’ll find my own way across when it’s time. Goodbye, my good boy.'),
        say('oto', 'Oto', 'Wuf.'), say(None, None, 'Oto does not cross. He trots to Mio, drops a tiny bell at her feet, and looks back toward the Hollow.'),
        mio('You want to stay and guide the others across, don’t you?'), say('oto', 'Oto', 'Wuf!'),
        {'c': 'sqreward', 'id': 'sq05'}, quest('sq05', 3, True), sw('sq05_done'),
        say(None, None, '(Oto’s Bell jingles near things that are hidden on the Far Shore.)')]
    m.event(8, 9, [page(cond={'nsw': 'sq05_done'}, g=NPC('oto', 'down', nofar=True), list=[
        say('oto', 'Oto', 'Wuf.'), say(None, None, 'A small dog with a worn collar sits on the shop step, watching the door. He will not come any closer to the river.'),
        IF({'sw': 'sq05_seen'}, [quest('sq05', 1, quiet=True), mio('Hisa’s dog. She can’t see him from her Shore.'),
            IF({'sw': 'willow_done'}, [kz('The Anchor, Mio. Hold this doorstep for both of them.'), anchor_menu(oto_bye)],
               [say(None, None, 'Oto whines toward the Hollow. The grief from that direction is too loud right now; any Anchor here would slip.')])])],
        ft='anchor', fieldList=[IF({'sw': 'willow_done', 'nsw': 'sq05_done'}, oto_bye, [say(None, None, 'The image wavers and slips. The grief from the Hollow is too loud right now.')])])], 'far')
    m.event(8, 9, [page(cond={'sw': 'sq05_done'}, g=NPC('oto', 'right', nofar=True), list=[say('oto', 'Oto', 'Wuf!'), say(None, None, 'Oto guards the path to the ford, waiting for the next lost traveller.')])], 'far')
    m.event(9, 12, [page(cond={'sw': 'wick_got', 'nsw': 'oto_hook'}, trigger='auto', list=[
        say('oto', 'Oto', 'Wuf! Wuf!'), say(None, None, 'Oto barks at Kaze, and keeps barking, until Kaze takes three steps back.'),
        kz('…He doesn’t like me much. Dogs can tell things.'), mio('Tell what?'), kz('Nothing. Let’s go home. Sachi will want to see the wick.'), sw('oto_hook')])], 'far')
    # forgotten meal (Near, river edge)
    m.event(18, 18, [page(cond={'nsw': 'meal_beat'}, trigger='touch', through=True, list=[
        say(None, None, 'The river smells of cold stone. Mio stops at the edge.'),
        mio('Kaze, what did we eat this morning?'), kz('…Rice? No. Granny Sachi made… I don’t remember.'),
        mio('Me neither. And I was so hungry.'), kz('The river’s already working on us. Let’s not stand here long.'), sw('meal_beat')])], 'near')
    # ---- the drifting Far bridge
    hold_bridge = [{'c': 'se', 'name': 'powerup'}, say(None, None, 'Mio sets the Anchor Stone on the first plank. The bridge stops drifting and settles, solid, across the river.'),
                   sw('bridge_held'), quest('ch3', 4)]
    m.event(19, 12, [page(cond={'nsw': 'bridge_held'}, list=[
        say(None, None, 'On the Far Shore a plank bridge spans the river, but it drifts: here, then a little downstream, then here again.'),
        IF({'item': 'anchor_stone'}, [choice(['Set the Anchor Stone', 'Not yet'], [hold_bridge, []])],
           [mio('An Anchor might hold it for a moment, but a moment isn’t enough to cross. I need something that won’t drift at all.'),
            IF({'sw': 'chorus_done'}, [kz('The Grove keeper, north of the statues. Ask the Heron.')])])],
        ft='anchor', fieldList=[say(None, None, 'The bridge holds for one breath, then slides downstream again.'),
                                IF({'item': 'anchor_stone'}, [choice(['Set the Anchor Stone', 'Not yet'], [hold_bridge, []])], [mio('Something heavier. Something that never drifts.')])]),
        page(cond={'sw': 'bridge_held'}, list=[say(None, None, 'The Anchor Stone sits on the first plank, perfectly still.')])], 'far')
    # ---- the Kappa Toll-Keeper (both Shores) at the ford chokepoint
    def kappa_pass(extra): return extra + [sw('kappa_passed'), quest('ch3', 5), {'c': 'checkpoint'}]
    bout = [{'c': 'checkpoint', 'boss': True},
            say('kappa', 'Kappa Toll-Keeper', 'A bout, then! Mind my dish. If it spills, I sulk for a century.'),
            {'c': 'battle', 'troop': 'boss_kappa_toll', 'boss': True, 'noEscape': True,
             'win': kappa_pass([say('kappa', 'Kappa Toll-Keeper', 'Hah! Hah! A fair fall. Pass, Lantern-bearer, and pass proudly.')]), 'lose': [{'c': 'abort'}]}]
    pil_pay = kappa_pass([item('toll_token', -1, quiet=True), say(None, None, 'Mio presses the worn coin into the Kappa’s webbed hand.'),
        say('kappa', 'Kappa Toll-Keeper', 'Yoshi’s coin. Yoshi, who carried his sister across on his back and never paid. Paid in full.'),
        say('ghostman', 'Yoshi', 'Then I can go. I can finally go.'), say(None, None, 'The pilgrim smiles and walks into the river light. The Kappa blinks, slowly, as if he has just forgotten something.'),
        sw('sq06_paid'), {'c': 'sqreward', 'id': 'sq06'}, quest('sq06', 3, True), sw('sq06_done')])
    pil_keep = kappa_pass([say('kappa', 'Kappa Toll-Keeper', 'Keep it. A debt unpaid is a debt remembered. I would rather remember him.'),
        say('ghostman', 'Yoshi', 'Then I’ll stay. Someone ought to watch the ford with you.'), say(None, None, 'The pilgrim takes his place by the ford, a grey guard with a kind face.'),
        sw('sq06_kept'), item('pilgrim_token'), item('kappa_ointment'), {'c': 'frag', 'n': 1}, quest('sq06', 3, True), sw('sq06_done')])
    m.event(31, 12, [page(cond={'nsw': 'kappa_passed'}, g=NPC('kappa', 'left'), list=[
        say('kappa', 'Kappa Toll-Keeper', 'Halt! This is the Toll-Ford. All who cross into the Hollow pay the toll: a coin, a cucumber, or a bout!'),
        {'c': 'turn', 'target': 'self', 'dir': 'down'}, say(None, None, 'The Kappa bows very low, carefully, so the water in his head-dish does not spill.'),
        IF({'nsw': 'kappa_tip'}, [say(None, 'Tip', 'Kappas are proud. Offer a Cucumber in Parley to win the bout at once; a Gale strike spills his dish. Bow back (Guard) when he bows.'), sw('kappa_tip')]),
        IF({'item': 'toll_token', 'sw': 'cord_tied'}, [say('kappa', 'Kappa Toll-Keeper', 'That coin… I know that coin. Yoshi. He crossed with his sick sister and never paid. I never collected.'),
            choice(['Pay Yoshi’s toll', 'Leave the debt unpaid', 'Ask for a bout instead'], [pil_pay, pil_keep, bout])],
           [choice(['A bout!', 'Not yet'], [[IF({'nsw': 'bridge_held'}, [say('kappa', 'Kappa Toll-Keeper', 'How did you even… never mind. A bout!')])] + bout, []])])]),
        page(cond={'sw': 'kappa_passed'}, g=None, through=True, list=[])])
    m.event(31, 11, [page(cond={'sw': 'kappa_passed'}, g=NPC('kappa', 'down'), list=[
        say('kappa', 'Kappa Toll-Keeper', 'The Willow Mother sings her children’s names and forgets them as fast as she sings. Be kind to her. She was kind to me once.')])])
    m.event(27, 14, [
        page(cond={'nsw': 'cord_tied'}, g=NPC('ghostman', 'down', tint=0xb0b8c8), list=[
            say(None, None, 'A grey pilgrim stands at the riverbank, holding nothing. He looks at the ford as though he has forgotten how to want to cross.'),
            IF({'item': 'remembrance_cord'}, [choice(['Tie the Remembrance Cord (2 Lumen)', 'Leave him be'], [[{'c': 'lumen', 'n': -2}, {'c': 'se', 'name': 'magic'},
                say(None, None, 'Mio ties the knotted cord around his wrist. A thread of light runs from it into the forest, into the mist, along the river.'),
                sw('cord_tied'), quest('sq06', 1), mio('Three places. His name is in three places.')], []])],
               [say('ghostman', 'Pilgrim', '…'), kz('Hollowed. The Rustle Sprites say a name can be tied back on.')])]),
        page(cond={'sw': 'cord_tied', 'nsw': 'sq06_done'}, g=NPC('ghostman', 'down', tint=0xd0d8e8), list=[
            IF({'v': ['pil_mem', '>=', 3]}, [IF({'noitem': 'toll_token'}, [
                say('ghostman', 'Yoshi', 'Yoshi. My name is Yoshi. I carried my sister across this river, and I never paid the Kappa. He never asked.'),
                say('ghostman', 'Yoshi', 'Take this. I’ve held it a hundred years. You decide what it’s for.'), item('toll_token'), quest('sq06', 3)],
                [say('ghostman', 'Yoshi', 'Talk to the Kappa. Whatever you decide, I’ll stand by it.')])],
               [say('ghostman', 'Pilgrim', 'Y… Yo…'), say(None, None, 'The cord tugs toward places he has been. (%s)' % 'memories found: see the quest log')])]),
        page(cond={'sw': 'sq06_kept'}, g=NPC('ghostman', 'right', tint=0xd0d8e8), list=[say('ghostman', 'Yoshi', 'Someone ought to watch the ford. I don’t mind. I remember who I am now.')])], 'far')
    pilgrim_memory(m, 26, 10, 3, ['At the ford, long ago: the young pilgrim, soaked to the waist, sets his sister on the far bank. The Kappa watches and says nothing.', 'She does not wake. Yoshi stays by the river so long that he forgets to leave, and then forgets his name.'])
    m.event(41, 19, [page(cond={'nsw': 'ma_beat'}, trigger='touch', through=True, list=[
        say(None, None, 'A child spirit kneels by the water, calling across it. “Ma? Ma?” Nobody answers. The river carries the word away and does not bring it back.'),
        mio('Willow Hollow is where the river comes from. Whatever’s making everyone forget… it’s in there.'),
        kz('Sounds like someone who lost her kids. And never stopped looking.'), sw('ma_beat')])], 'far')
    chest(m, 35, 21, [('kuzu_tonic', 2)]); chest(m, 2, 4, [('marigold_petal', 3)], realm='far')
    foe(m, 38, 9, 'tr_river_kappa', 'kappa', aggro=3, range=2)
    return m

# =====================================================================================================  112  Willow Hollow (dungeon)
def build_hollow():
    m = Map(112, 'Willow Hollow', 34, 28, 'willow', 'willow_far', seed=112)
    m.fill('both', 0, 0, 33, 27, GRASS, walk=False)
    A = Area()
    A.rect(0, 19, 1, 21, trail=True); A.rect(1, 16, 20, 25)            # south bank entry
    A.rect(1, 3, 12, 11); A.rect(13, 6, 14, 7); A.rect(15, 3, 24, 11)  # north bank (west / curtain gap / east)
    A.rect(25, 2, 32, 11)                                              # Willow Mother's arena
    A.rect(26, 16, 32, 24); A.rect(33, 20, 33, 22, trail=True)         # wick glade (beyond the forgetting river)
    A.carve(m)
    river = [(x, y) for x in range(0, 34) for y in range(12, 16)]
    m.blob('both', river, origin=WATER_P_FIX if CH3FIX_ON else WATER_P, sheet=CH3FIX if CH3FIX_ON else WATER, walk=False, open_edge=True)  # runs off the edge
    for y in range(12, 16): m.tile('far', 8, y, STONE_W if CH3FIX_ON else STONE_STEP, 'o'); m.walk('far', 8, y, True)   # Far stepping stones
    for y in (6, 7):                                                                             # Near willow curtains
        for x in (13, 14): m.walk('near', x, y, False)
    m.obj('near', 'tree_l', 12, 8, fw=4, block=False); m.obj('near', 'pine_s', 13, 7, fw=2, block=False)
    for y in range(3, 12): m.walk('far', 19, y, False)                                          # Far drowned roots
    for y in range(3, 12, 2): m.obj('far', 'deadtree_s', 18, y, fw=2, block=False)
    m.dynwalk('far', [(x, y) for x in (28, 29) for y in range(12, 16)], {'sw': 'sprig_planted'})
    woods(m, A, 11, clear=edge_clear(m) | set(river)); edge_objs(m)
    deco(m, A, 'near', ['fern', 'tuft1', 'flower_w'], 18, 8); deco(m, A, 'far', ['fern', 'tuft3'], 18, 9)
    m.region(0, 0, 33, 27, 3); m.encounter = dict(region=3, zone='z09')
    m.region(25, 2, 32, 11, 0); m.region(26, 16, 32, 24, 6)
    for y in (19, 20, 21): m.door_touch(0, y, 111, 44, 12, 'left', se=None)
    m.post(4, 22, light=POST_LIGHT); m.post(22, 9, light=POST_LIGHT)
    m.event(3, 20, [page(cond={'nsw': 'hollow_intro'}, trigger='auto', list=[
        say(None, None, 'Willow branches hang to the ground like curtains. A slow violet river cuts the hollow in two, and everything near it is very quiet.'),
        mio('I can hear singing. Names again, like the forest. But she keeps losing her place.'),
        kz('Don’t drink the water. Don’t even look at it too long.'), sw('hollow_intro')])])
    m.event(8, 16, [page(cond={'nsw': 'stones_hint'}, trigger='touch', through=True, list=[
        say(None, None, 'On the Near Shore the river is one smooth violet sheet. On the Far Shore, flat stones stand in a line across it.'), sw('stones_hint')])])
    m.event(14, 7, [page(cond={'nsw': 'curtain_hint'}, trigger='touch', through=True, list=[
        say(None, None, 'On the Far Shore the willow curtain is only mist. Past it, drowned roots knot together on the Far Shore… and are gone on the Near.'), sw('curtain_hint')])], 'far')
    # ---- Willow Mother
    tsu = [say('willow', 'Willow Mother', 'There was a girl, once. A camellia in her hair. She crossed my river and would not let me take her name. Tsubaki. Tsubaki. I am still holding it for her.'),
           mio('Tsubaki…'), kz('…')]
    win = [{'c': 'me', 'name': 'fanfare'}, say(None, None, 'The weeping stops. The branches lift, and for the first time the hollow is full of light.'),
           say('willow', 'Willow Mother', 'Hana. Ren. Little Sou. I remember now. I remember all of them.'),
           say('willow', 'Willow Mother', 'You came for the wick. It grew in the glade where my children played. Take this, and plant it on my bank. It will carry you across.'),
           item('willow_sprig'), sw('willow_done'), quest('ch3', 6)] + tsu
    # Parley-only boss: a party wipe never ends the run. The scene restores the pre-fight checkpoint on the Near Shore at full
    # health (mapscene.handleDefeat, 'wipe') and the Whisper Wick, calling from the glade beyond, points at Parley.
    willow_wipe = {'realm': 'near', 'lines': [
        {'face': None, 'name': None, 'text': 'The hollow goes dark… and then a small, warm light flickers from the glade beyond the river.'},
        {'face': 'lantern', 'name': 'Whisper Wick', 'text': 'She does not need to be beaten, little lantern. She needs to be remembered. Parley: Remember her children three times until she is Calm, then Send her home.'},
        {'face': 'kaze', 'name': 'Kaze', 'text': 'You heard it. Words, not blades. Let’s try again.'}]}
    m.event(28, 4, [page(cond={'nsw': 'willow_done'}, g=NPC('willow', 'down', nofar=True), list=[
        say('willow', 'Willow Mother', 'Who are you? Are you one of mine? I had so many. I have forgotten their names. I sing them, and they slip into the water.'),
        mio('We’re not yours. But we can help you remember.'),
        say('willow', 'Willow Mother', 'Remember? Then you will take them away from me. Like the village did. Like the river does.'),
        IF({'nsw': 'willow_tip'}, [kz('She is grieving, not hunting. Words may reach her where blades won’t.'),
            say(None, 'Tip', 'The Willow Mother can’t be beaten by force: her roots drink the river and her wounds close. Choose Parley and Remember her children three times. Once she is Calm, Send her home.'), sw('willow_tip')]),
        choice(['Face the Willow Mother', 'Wait. Prepare first'], [[{'c': 'checkpoint', 'boss': True},
            {'c': 'battle', 'troop': 'boss_willow_mother', 'boss': True, 'noEscape': True, 'win': win, 'lose': [{'c': 'abort'}], 'wipe': willow_wipe}], []])]),
        page(cond={'sw': 'willow_done'}, g=NPC('willow', 'down', nofar=True, tint=0xe8ffe8), list=[
            say('willow', 'Willow Mother', 'Plant the sprig on the bank, little lantern. Its roots know the way.')])])
    # bloom soil (Far): plant the sprig -> root bridge
    m.obj('far', 'flower_w', 28, 11, fw=1, block=False, flat=True)
    m.event(29, 11, [page(cond={'nsw': 'sprig_planted'}, list=[
        say(None, None, 'Soft dark soil at the river’s edge, warm to the touch.'),
        IF({'item': 'willow_sprig'}, [choice(['Plant the Willow Sprig', 'Not yet'], [[item('willow_sprig', -1, quiet=True), {'c': 'se', 'name': 'magic'}, {'c': 'shake', 'power': 1, 'ms': 700},
            say(None, None, 'The sprig sinks into the soil. Roots pour across the river, weaving themselves into a bridge.'), sw('sprig_planted')], []])],
           [say(None, None, 'Something should grow here. Not yet.')])]),
        page(cond={'sw': 'sprig_planted'}, list=[say(None, None, 'A young willow, already taller than Mio. Its roots hold the bridge.')])], 'far')
    for x in (28, 29):
        for y in range(12, 16):
            m.event(x, y, [page(cond={'sw': 'sprig_planted'}, g=dict(obj='block_sand', flat=True), through=True, list=[])], 'far')
    # the Whisper Wick
    m.obj('both', 'gem_white', 29, 19, fw=1, block=False); m.light(29, 19, 5)
    m.event(29, 20, [page(cond={'nsw': 'wick_got'}, list=[
        say(None, None, 'In the middle of the glade, a lantern wick floats a hand’s width above the grass, burning without smoke.'),
        {'c': 'me', 'name': 'secret'}, {'c': 'flash', 'color': 0xfff0c0, 'ms': 600}, item('wick_forest'),
        narr('The light runs warm up Mio’s arms.', 'Far away, past the river and the forest, every lantern in Ashiro flickers… and steadies, a little brighter than before.'),
        mio('Granny Sachi. I can feel her. She’s by the lamp, waiting.'),
        kz('One wick. How many does the Lantern have?'), mio('Seven, I think. One for each night.'),
        tut('wick', 'The Whisper Wick is a Key Item. Use it from Menu → Items to raise max Lumen to 70.', 6000),
        {'c': 'heal', 'lumen': True}, sw('wick_got'), quest('ch3', 6), {'c': 'checkpoint'}]),
        page(cond={'sw': 'wick_got'}, list=[say(None, None, 'The grass where the wick floated is still warm.')])])
    # D6: post-quest root path back to the Crossing: walk onto it (was an action + choice). Ember's 48x32 root_bridge_end: cols 32-33, rows 20-21, flush with the edge.
    m.event(32, 21, [page(cond={'sw': 'wick_got'}, g=(dict(obj='root_bridge_end') if 'root_bridge_end' in OBJ else None), trigger='touch', through=True, list=[{'c': 'transfer', 'map': 111, 'x': 43, 'y': 12, 'dir': 'left', 'se': 'grass'}])])
    chest(m, 2, 4, [('lantern_oil', 2), ('marigold_petal', 2)]); chest(m, 31, 23, [('kuzu_tonic', 2)]); chest(m, 18, 24, [('ward_salt', 1)], realm='far')
    foe(m, 6, 5, 'tr_willow_sprout_willow_sprout', 'rustle', 'both', aggro=3, range=2)
    foe(m, 22, 5, 'tr_rusalka_reed_willow_sprout', 'ghostgirl', aggro=3, range=2)
    return m
