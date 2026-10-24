from mapkit import *
from sidequests_maps import *
def fill_walls(m, g=None):
    for y in range(m.h):
        for x in range(m.w):
            m.tile('both', x, y, DARKBRICK if y % 2 == 0 else DARKBRICK2); 
def foe(m, x, y, troop, sheet, realm='far', **kw):
    e = dict(troop=troop, aggro=kw.get('aggro', 4), chase=True, range=kw.get('range', 3), spd=kw.get('spd', 260)); m.event(x, y, [page(g=NPC(sheet), enemy=e)], realm)
def chest(m, x, y, items, text=None, realm='both'):
    got = []
    for it_, n in items: got.append(item(it_, n))
    m.obj(realm, 'chest', x, y, fw=1, block=False)
    m.event(x, y, [page(cond={'nself': 'A'}, g=dict(obj='chest'), list=[{'c': 'se', 'name': 'pickup'}] + got + [self_sw('A')]),
                   page(cond={'self': 'A'}, g=dict(obj='chest'), list=[say(None, None, 'The chest is empty.')])], realm)
def build_sachi():
    m = Map(2, 'Sachi’s House', 12, 10, 'home', 'home', seed=2); fill_walls(m)
    m.fill('both', 1, 2, 10, 8, INT_FLOOR); m.fill('both', 6, 9, 6, 9, INT_FLOOR)
    m.region(1, 2, 10, 9, 6)
    m.obj('both', 'bookshelf_w', 1, 1, fw=4, block=False); m.obj('both', 'dresser', 6, 1, fw=3, block=False); m.obj('both', 'cupboard', 9, 1, fw=1, block=False)
    m.obj('both', 'table3', 3, 3, fw=3); m.obj('both', 'stool', 2, 3, fw=1, block=False); m.obj('both', 'stool', 6, 3, fw=1, block=False)
    m.obj('both', 'rug_red', 5, 6, fw=2, block=False, flat=True); m.obj('both', 'pot_big', 9, 3, fw=1); m.obj('both', 'plant_pot', 1, 7, fw=1); m.obj('both', 'jar', 10, 7, fw=1)
    # ---- wall calendar: nights to Lantern Night (changes after the Straw Warden falls)
    m.event(5, 1, [page(cond={'nsw': 'warden_done'}, trigger='action', list=[say(None, None, 'A paper calendar by the door. Seven days are crossed out in Sachi’s hand, and the last is circled: LANTERN NIGHT. Seven nights left.')]),
                   page(cond={'sw': 'warden_done'}, trigger='action', list=[say(None, None, 'The wall calendar. Night 2 is crossed out. Six nights to Lantern Night, circled in red. Mio’s wick drawer is half open beneath it.')])])
    m.light(9, 4, 4); m.light(3, 3, 3)
    m.door_touch(6, 9, 1, 7, 15, 'down', se='door')
    # intro (autorun)
    intro = [narr('Ashiro Village, on the eve of the Lantern Festival.', 'Every year the villagers light one lantern for each spirit who has walked beside them.', 'This year, the Shrine Bell has not rung… and the lanterns will not light.'),
        say('sachi', 'Granny Sachi', 'Mio, child. Come here by the lamp. Your hands are cold.'),
        say('mio', 'Mio', 'Granny, the festival starts at dusk, and the Bell hasn’t rung. Nothing is lit. Is it… because of me?'),
        say('sachi', 'Granny Sachi', 'Never you. Listen: your grandfather carried this before me, and his mother before him.'),
        {'c': 'se', 'name': 'pickup'}, {'c': 'flash', 'color': 0xffe9b0, 'ms': 400},
        say(None, None, 'Granny Sachi places an old paper Lantern in Mio’s hands. It is warm, as if someone had just set it down.'),
        say('sachi', 'Granny Sachi', 'It shows what the night hides. Press the little wick, and the world will tip toward the Far Shore, where spirits walk. Pull it back, and you’re home again.'),
        say('sachi', 'Granny Sachi', 'Light the Lantern Post in the village square. Then go see Elder Matsu. Take care of your light, child. It’s the only thing that follows you across.'),
        say('mio', 'Mio', '…I’ll try, Granny.'),
        {'c': 'item', 'id': 'lantern'}, sw('intro_done'), quest('main', 0),
        tut('controls', 'Move: Arrows/WASD · Talk/OK: Z/Enter · Menu: X/Esc · Dash: hold Shift · Shift realms: Q/Tab', 9000)]
    m.event(6, 7, [page(cond={'nsw': 'intro_done'}, trigger='auto', list=intro)])
    sachi_talk = [choice(['Talk', 'Rest (free)', 'Save', 'Never mind'], [[
            IF({'anysw': ['first_send', 'warden_done'], 'noitem': 'collectors_book'}, [say('sachi', 'Granny Sachi', 'Ah, you have begun to meet them properly. Here, child: my old ledger. Spirits you meet write themselves in it, and the bonds you keep.'), item('collectors_book'), tut('ledger', 'Keeper’s Ledger: Menu now shows Bonds (equip, give Offerings) and the Bestiary. Check Key Items for everything else you carry.', 8000)]),
            IF({'sw': 'warden_done'}, [IF({'nsw': 'parley_taught'}, [
                say('sachi', 'Granny Sachi', 'You faced the Warden and came back whole. Good. Listen, child — not every spirit on the Far Shore wants to fight.'),
                say('sachi', 'Granny Sachi', 'Parley lets you talk: Soothe, Hum, Remember, Offer something they love. Fill their Mood and they turn Calm. Then you may Send them onward — or Invite one to walk beside you as a Bond.'),
                tut('send', 'Send unlocks at Lv 3 · Invite at Lv 4. Calm spirits drop Wish Scraps; hollowed ones leave Name Fragments.', 8000), sw('parley_taught')])]),
            IF({'nsw': 'post_lit'}, [say('sachi', 'Granny Sachi', 'The square’s post is the first. Light it with the Lantern. It’ll wake the old light.')],
               [IF({'nsw': 'kaze_joined'}, [say('sachi', 'Granny Sachi', 'Now press Q, child, and look at the world through the Lantern. There’s a friend on the other shore; I can feel it.')],
                  [IF({'nsw': 'elder_told'}, [say('sachi', 'Granny Sachi', 'A fox, you say? That sounds like Kaze. Go and see Elder Matsu. He’ll want to hear about it.')],
                     [IF({'sw': 'key_got'}, [say('sachi', 'Granny Sachi', 'The Shrine is north of the square, past the torii. Take your friends. And mind the Bell-Keeper.')],
                        [IF({'nsw': 'daigo_joined'}, [say('sachi', 'Granny Sachi', 'The Well is south-west past the boulder. Don’t push at it; Lantern-bearers go around.')],
                           [say('sachi', 'Granny Sachi', 'Daigo’s safe! Bless you. Now: the key, and the Shrine.')])])])])])],
        [{'c': 'fade', 'dir': 'out', 'ms': 500}, {'c': 'heal', 'lumen': True}, {'c': 'wait', 'ms': 700}, {'c': 'fade', 'dir': 'in', 'ms': 500}, say('sachi', 'Granny Sachi', 'There. Warm tea and a warm blanket. HP, SP, and the Lantern are all topped up.')],
        [{'c': 'save'}], []])]
    m.event(6, 4, [page(g=NPC('sachi', 'down'), cond={'sw': 'intro_done'}, list=sachi_talk)], realm='near')
    m.event(6, 4, [page(g=NPC('ghostman', 'down'), list=[
        IF({'nsw': 'grandpa_oil'}, [say('ghostman', 'Grandfather’s Echo', 'Mio. You hold the Lantern the way I did: too tightly. Loosen your grip; light likes room.'), say('ghostman', 'Grandfather’s Echo', 'Take this oil. Far Shore light burns fast.'), {'c': 'item', 'id': 'lantern_oil', 'n': 2}, sw('grandpa_oil')],
           [say('ghostman', 'Grandfather’s Echo', 'Posts and rooms like this one hold steady light. Rest when you need to.')])])], realm='far')
    m.event(9, 1, [page(g=dict(obj='cupboard'), trigger='action', list=[say(None, None, 'Granny’s cupboard.'), IF({'nself': 'A'}, [{'c': 'item', 'id': 'rice_ball', 'n': 2}, self_sw('A')], [say(None, None, 'Empty now, but it smells of rice.')])])], realm='near')
    return m
def build_tea():
    m = Map(3, 'Tama’s Teahouse & Store', 14, 10, 'home', 'home', seed=3); fill_walls(m)
    m.fill('both', 1, 2, 12, 8, INT_FLOOR); m.fill('both', 7, 9, 7, 9, INT_FLOOR); m.region(1, 2, 12, 9, 6)
    m.obj('both', 'shelf_a', 2, 1, fw=1, block=False); m.obj('both', 'shelf_b', 3, 1, fw=1, block=False); m.obj('both', 'cupboard', 4, 1, fw=1, block=False); m.obj('both', 'dresser', 8, 1, fw=3, block=False); m.obj('both', 'shelf_a', 11, 1, fw=1, block=False)
    m.obj('both', 'counter', 3, 4, fw=3); m.counters = [[3, 4], [4, 4], [5, 4]]
    m.obj('both', 'table3', 8, 6, fw=3); m.obj('both', 'stool', 7, 6, fw=1, block=False); m.obj('both', 'stool', 11, 6, fw=1, block=False)
    m.obj('both', 'barrel', 1, 3, fw=1); m.obj('both', 'barrel2', 1, 4, fw=1); m.obj('both', 'plant_pot', 12, 3, fw=1); m.obj('both', 'rug_red', 5, 7, fw=2, block=False, flat=True)
    m.light(4, 3, 4); m.light(9, 4, 4)
    m.door_touch(7, 9, 1, 25, 15, 'down')
    shop_items = ['rice_ball', 'herbal_tea', 'honey', 'mochi', 'lantern_oil', 'antidote_salt', 'wick_trim', 'kuzu_tonic', 'hush_bell', 'smoke_ball', 'firecracker', 'origami_crane', 'incense_stick', 'paper_charm', 'chime_offering', 'mio_w2', 'kaze_w2', 'daigo_w2', 'garb2', 'lucky_knot']  # E6: Bell Charm (charm3) has one source, the sq04 reward (design: sq04 ties to charm3_sp_regen)  # shop.ts filters by shopChapter + Daigo party
    m.event(4, 3, [page(g=NPC('woman', 'down'), list=[
        say('woman', 'Tama', 'Welcome, welcome! Tea’s hot and the road’s long. What can I do for you?'),
        choice(['Shop', 'Rest (15 G)', 'Chat', 'Leave'], [[{'c': 'shop', 'items': shop_items, 'name': 'Tama', 'face': 'woman'}], [{'c': 'inn', 'price': 15, 'name': 'Tama', 'face': 'woman', 'ask': 'A bed and a bowl of miso is 15 gold. Stay the night?'}],
            [IF({'sw': 'daigo_joined'}, [say('woman', 'Tama', 'Daigo’s back in one piece! He owes me for three months of tea, mind.')], [say('woman', 'Tama', 'Between us, the Bell going quiet worries me. Half my customers stopped coming — the other half I can’t see.')])], []])])], realm='near')
    m.event(4, 3, [page(g=NPC('ghostgirl', 'down'), list=[say('ghostgirl', 'Tama’s Mother', 'Tama still keeps my cup warm. I can’t drink, but I sit here every night anyway. Tell her the tea is perfect.')])], realm='far')
    m.event(9, 7, [page(g=NPC('villager1', 'up'), list=[
        IF({'sw': 'shiro_asked'}, [IF({'nsw': 'hanzo_told'}, [
            say('mio', 'Mio', 'Excuse me, Hanzo? There’s someone on the Far Shore. Old Shiro. He says the net is finally mended, and he forgives you for the storm.'),
            say('villager1', 'Hanzo', '…Shiro. After forty years.'), say('villager1', 'Hanzo', 'Tell him, if you can, that the boat’s still tied at the third post. And that I never stopped looking.'),
            item('hanzo_note', -1, True), sw('hanzo_told'), quest('hanzo', 1, False)],
           [say('villager1', 'Hanzo', 'Please carry it to him. It’s all I have.')])],
           [say('villager1', 'Hanzo', 'Forty years since my friend Shiro’s boat went down. I still sit here, watching the door. Habit.')])])], realm='near')
    m.event(11, 3, [page(g=dict(obj='post_banner'), list=[say(None, None, 'TAMA’S: Tea 5, Rice 12, Good Advice free.')])], realm='near')
    return m
def build_well():
    m = Map(4, 'Ashiro Well', 32, 26, 'well', 'well_far', seed=4)
    def floor(x0, y0, x1, y1, realm='both'): m.fill(realm, x0, y0, x1, y1, CAVE)
    floor(2, 3, 10, 9); floor(11, 6, 14, 7); floor(15, 3, 27, 11); floor(24, 12, 26, 14); floor(19, 15, 28, 23)
    # pit: Near void (full north-south seal), Far spirit bridge on y=7 only
    # Include y=3-4 and y=10-11 so Near cannot walk around the "ledge" without the Far bridge.
    for y in range(3, 12):
        for x in range(17, 24):
            m.tile('near', x, y, 0); m.walk('near', x, y, False)
            if 5 <= y <= 9:
                m.tile('far', x, y, 0); m.walk('far', x, y, False)
    for x in range(16, 25):
        m.tile('far', x, 7, G(2, 12, 3)); m.walk('far', x, 7, True)
    m.region(2, 3, 10, 9, 3); m.region(15, 3, 23, 11, 3); m.region(19, 15, 28, 23, 3)
    m.post(5, 6, 3); m.post(25, 9, 3); m.post(22, 17, 3)
    m.region(0, 0, 0, 0, 0)
    for (x, y) in [(3, 3), (9, 3), (6, 9), (16, 4), (16, 10), (27, 3), (27, 11), (20, 16), (28, 22), (19, 22)]: m.obj('both', 'boulder_brown', x, y, fw=2, block=True) if False else None
    for (x, y) in [(10, 4), (2, 9), (22, 10), (16, 11), (28, 15), (19, 20)]: m.obj('both', 'pot_big', x, y, fw=1)
    for (x, y) in [(8, 4), (14, 11), (26, 22)]: m.obj('both', 'barrel', x, y, fw=1)
    for x, y in [(3, 4), (9, 8), (17, 10), (27, 4), (21, 19)]: m.light(x, y, 4)
    m.encounter = dict(region=3, zones={'near': 'z02', 'far': 'z03'})
    # exit up to village
    m.obj('both', 'stairs_up', 3, 3, fw=1, block=False)
    m.event(3, 3, [page(trigger='touch', through=True, list=[{'c': 'transfer', 'map': 1, 'x': 5, 'y': 24, 'dir': 'up', 'se': 'grass'}])])
    # chests
    chest(m, 3, 8, [('sweet_tea', 1), ('kuzu_tonic', 1)])  # E6: was charm3 (also sq04 reward + shop); now modest consumables
    chest(m, 28, 14, [('honey', 2)]); chest(m, 8, 7, [('rice_ball', 2), ('herbal_tea', 1)])
    m.walk('both', 8, 7, True)
    # field-spell nook (Fox-fire Torch, Kaze Lv4): a hay bale blocks a cache in the NE room
    m.obj('both', 'chest', 27, 3, fw=1, block=False)
    m.event(27, 3, [page(cond={'nself': 'A'}, g=dict(obj='chest'), list=[{'c': 'se', 'name': 'pickup'}, item('kuzu_tonic', 2), item('wick_trim', 1), self_sw('A')]), page(cond={'self': 'A'}, g=dict(obj='chest'), list=[say(None, None, 'The chest is empty.')])])
    for (hx, hy) in [(26, 3), (27, 4)]:
        m.event(hx, hy, [page(cond={'nsw': 'hay_burnt'}, g=dict(obj='hay'), ft='burnable', list=[say(None, None, 'A bale of dry hay is wedged into the corner. Something glints behind it. A little flame would clear the way.')], fieldList=[{'c': 'se', 'name': 'fire'}, {'c': 'flash', 'color': 0xffa060, 'ms': 300}, say(None, None, 'The hay catches in a rush of orange and is gone in moments.'), sw('hay_burnt')])])
    # Daigo (Near only)
    m.event(26, 6, [page(cond={'nsw': 'daigo_joined'}, g=NPC('smith', 'down'), list=[
        say('smith', 'Daigo', 'Whoa! A Lantern? You’re Sachi’s girl, aren’t you? Mio! You — how did you get across? The ledge crumbled behind me. I’ve been stuck here two days!'),
        IF({'sw': 'kaze_joined'}, [
            say('mio', 'Mio', 'The Far Shore. There’s a spirit bridge. And Kaze, here, found a good snack. Kind of.'),
            say('kaze', 'Kaze', 'Excuse me. I am not a snack.')],
           [say('mio', 'Mio', 'The Far Shore. There’s a spirit bridge across the pit.')]),
        say('smith', 'Daigo', 'Is that a talking fox? Never mind. Listen: I came for the old bell clapper. The legend says the Well Spirit keeps the Shrine Key, and the key’s tied to the clapper.'),
        say('smith', 'Daigo', 'But the spirit’s just… sad. Really sad. I couldn’t fight it. Hammer doesn’t help when someone’s crying.'),
        say('mio', 'Mio', 'Then we won’t fight it. Not at first.'),
        say('smith', 'Daigo', 'Right. Right! I’ll head back and get the forge lit. A smith owes a debt to a Lantern-bearer who pulls him out of a hole. When the Bell rings, come find me.'),
        say('daigo', 'Daigo', '(He picks up his hammer and scrambles up the rope ladder.)'),
        {'c': 'me', 'name': 'secret'}, sw('daigo_joined'), quest('main', 4), {'c': 'erase'}])], realm='near')
    # Well Spirit encounter trigger
    # Key only after Kaze + Daigo (story order); nsw:key_got prevents re-grant. The key comes from the Parley battle below.
    # Page order: soft-block first, grant last (runtime picks the last matching page).
    m.event(25, 15, [
        page(cond={'nsw': 'key_got'}, trigger='touch', through=True, list=[
            IF({'nsw': 'kaze_joined'}, [say('mio', 'Mio', 'The mist thickens. I shouldn’t face whatever waits here alone — not without the fox who keeps the Far Shore.')],
               [IF({'nsw': 'daigo_joined'}, [say('mio', 'Mio', 'Daigo said the Well Spirit keeps the key. I should find him on this ledge first.')],
                  [say('mio', 'Mio', 'A cold mist… but something still feels unfinished down here.')])]),
            {'c': 'move', 'route': ['left']}]),
        page(cond={'nsw': 'key_got', 'sw': ['kaze_joined', 'daigo_joined']}, trigger='touch', through=True, list=[
        {'c': 'checkpoint', 'boss': True},
        say(None, None, 'A cold mist curls through the chamber. Dark water collects into a shape: a spirit with a lantern for a heart.'),
        say(None, 'Ido-no-Kami', '…It was here. I kept it. Nobody came. Nobody drew water. Nobody sang to me.'),
        say('mio', 'Mio', 'It’s grieving. Don’t strike unless I say. We can Parley with it: Remember, Remember again, and then Send it on.'),
        IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'It isn’t angry, Mio. It’s just… waiting. Like I did.')]),
        # Parley battle. Win (Send or defeat) grants the key; fleeing steps back so the touch can be retried; losing
        # offers the boss checkpoint Retry (mapscene handleDefeat). No outcome leaves the key unreachable.
        # The fight pays the formula 11 EXP (L4 rare); +14 scripted keeps the old 25 total so Bell-Keeper arrival levels hold.
        {'c': 'battle', 'troop': 'tr_well_spirit', 'boss': True, 'noEscape': False,
         'win': [IF({'v': ['battle_peaceful', '==', 1]}, [
                     say('mio', 'Mio', 'I’m sorry nobody came. I’m here now. Would you like to hear the festival song?'),
                     {'c': 'flash', 'color': 0xcff6ff, 'ms': 500}, {'c': 'se', 'name': 'magic2'},
                     say(None, None, 'Mio hums the old lantern song. The Lantern warms in her hands, and the dark water stills.'),
                     say(None, 'Ido-no-Kami', 'The old lantern… still burns somewhere. Thank you. Take the key. Ring the Bell for me.')],
                    [say(None, None, 'The spirit comes apart like rain on still water. Something small and heavy sinks to the well floor.'),
                     say('mio', 'Mio', '…I should have listened longer. I’m sorry. I’ll still ring the Bell for you.')]),
                 {'c': 'me', 'name': 'fanfare'}, {'c': 'item', 'id': 'shrine_key'}, {'c': 'exp', 'n': 14}, sw('key_got'), {'c': 'chapter', 'n': 2}, quest('main', 5),
                 IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'Gentle beats loud. Remember that when we meet the Bell-Keeper.')],
                    [say('mio', 'Mio', 'Gentle… Remember that, for whatever waits at the Bell.')]),
                 tut('exit', 'Stairs near the south chamber lead back up to the village.', 5000)],
         'escape': [say('mio', 'Mio', 'Not like this. I’ll come back when I know what to say.'), {'c': 'move', 'route': ['left']}],
         'lose': [{'c': 'abort'}]}])])
    m.obj('both', 'stairs_up', 20, 15, fw=1, block=False)
    m.event(20, 15, [page(trigger='touch', through=True, list=[{'c': 'transfer', 'map': 1, 'x': 5, 'y': 24, 'dir': 'up', 'se': 'grass'}])])
    # Far enemies
    foe(m, 8, 5, 'tr_well_newt_gloam_bat', 'wisp2'); foe(m, 9, 8, 'tr_gloam_bat', 'wisp2'); foe(m, 19, 4, 'tr_hollow_villager', 'skeleton'); foe(m, 21, 11, 'tr_well_newt_well_newt', 'slime'); foe(m, 25, 19, 'tr_hollow_villager_gloam_bat', 'skeleton')
    m.event(7, 6, [page(g=NPC('ghostgirl', 'down'), list=[say('ghostgirl', 'Little Ghost', 'It’s lonely down here. The Well Spirit cries when it rains up top. Be kind to it.')])], realm='far')
    return m
def build_shrine1():
    m = Map(5, 'Bell Shrine — Lower Hall', 24, 24, 'shrine', 'shrine_far', seed=5); fill_walls(m)
    m.fill('both', 6, 7, 17, 16, SHRINE_F); m.fill('both', 9, 17, 14, 22, SHRINE_F); m.fill('both', 11, 23, 12, 23, SHRINE_F); m.fill('both', 1, 9, 4, 13, SHRINE_F); m.fill('both', 19, 9, 22, 13, SHRINE_F)
    m.fill('both', 5, 10, 5, 12, SHRINE_F); m.fill('both', 18, 10, 18, 12, SHRINE_F)
    m.fill('both', 11, 6, 12, 6, SHRINE_F)
    m.post(11, 19, 3)
    m.region(6, 7, 17, 16, 3); m.region(1, 9, 4, 13, 0); m.region(19, 9, 22, 13, 0); m.region_circle(11, 19, 3, 6)
    m.encounter = dict(region=3, zone='z04')
    for x in (6, 17): m.obj('both', 'statue_guard', x, 8, fw=1)
    m.obj('both', 'statue_fox', 8, 8, fw=1); m.obj('both', 'statue_fox', 15, 8, fw=1)
    for (x, y) in [(7, 15), (16, 15), (10, 21), (13, 21)]: m.obj('both', 'pot_big', x, y, fw=1)
    for (x, y) in [(7, 8), (16, 8), (3, 10), (20, 10), (10, 17), (13, 17), (9, 12), (14, 12)]: m.light(x, y, 4)
    # walls of sealed side-passages (Near only)
    for x in (5, 18):
        for y in (10, 11, 12):
            m.walk('near', x, y, False)
            m.event(x, y, [page(g=dict(obj='block_stone'), trigger='action', marker=False, list=[say(None, None, 'A sealed stone, humming faintly. It seems to exist only on this shore.'), tut('seal', 'Sealed stones block this shore only. Shift past them on the Far Shore.', 5500)])], realm='near')
    chest(m, 2, 10, [('dew_lens', 1)], realm='far'); foe(m, 3, 12, 'tr_gloam_bat_ofuda_moth', 'kettle', aggro=3, range=2)
    # L08: hidden alcove chest, only seen through the Dew Lens (Far)
    m.event(1, 13, [page(cond={'item': 'dew_lens', 'nself': 'A'}, g=dict(obj='chest'), list=[{'c': 'se', 'name': 'pickup'}, item('hearty_plum', 1), item('charm2', 1), self_sw('A')]), page(cond={'self': 'A'}, g=dict(obj='chest'), list=[say(None, None, 'The chest is empty.')])], realm='far')
    chest(m, 21, 10, [('honey', 2), ('lucky_knot', 1), ('smoke_ball', 1)])
    # pedestals (order: white -> red -> blue)
    peds = [(8, 11, 'pedestal_red', 'red'), (11, 11, 'pedestal_w', 'white'), (14, 11, 'pedestal_blue', 'blue')]
    order = ['white', 'red', 'blue']
    for (x, y, o, col) in peds:
        branches = []
        for k in range(3):
            if col == order[k]:
                lst = [{'c': 'se', 'name': 'powerup'}, {'c': 'flash', 'color': {'white': 0xffffff, 'red': 0xff8a6a, 'blue': 0x8ab8ff}[col], 'ms': 300}, {'c': 'var', 'name': 'ped', 'op': '+=', 'v': 1}]
                if k == 2: lst += [{'c': 'shake', 'power': 3, 'ms': 600}, say(None, None, 'The last pedestal chimes. Somewhere to the north, stone grinds against stone.'), sw('ped_solved')]
                else: lst += [say(None, None, 'The pedestal hums softly. A clear note rings.')]
                branches.append((k, lst))
        cond = lambda k: {'v': ['ped', '==', k]}
        lst = []
        for k, l in branches: lst = [IF(cond(k), l, lst)] if lst else [IF(cond(k), l, [{'c': 'se', 'name': 'buzzer'}, say(None, None, 'A discordant clang. The pedestals dim and fall silent.'), {'c': 'var', 'name': 'ped', 'op': '=', 'v': 0}])]
        m.event(x, y, [page(cond={'sw': 'ped_solved'}, g=dict(obj=o), list=[say(None, None, 'The pedestal glows steadily.')]), page(g=dict(obj=o), cond={'nsw': 'ped_solved'}, list=lst)] if False else [page(g=dict(obj=o), list=[IF({'sw': 'ped_solved'}, [say(None, None, 'The pedestal glows steadily.')], lst)])])
    m.event(9, 8, [page(g=dict(obj='post_banner'), list=[say(None, None, 'An inscription: “FIRST THE PALE LIGHT. THEN THE EMBER. LAST THE DEEP.”'), tut('ped', 'Pedestals must be touched in the right order. Look for clues on both shores.', 6000), sw('ped_clue')])], realm='near')
    m.event(11, 12, [page(g=NPC('ghostman', 'down'), list=[say('ghostman', 'Shrine Ghost', 'Oh. A living one with a light. Hm. The three pedestals… white for dawn, red for dusk, blue for night. In that order, if you want the north door to open.')])], realm='far')
    # north door
    m.event(11, 6, [page(g=dict(obj='door_wood'), cond={'nsw': 'ped_solved'}, list=[say(None, None, 'A heavy sealed door. Four pedestals line the hall… no: three. Something must unlock it.')]),
                    page(cond={'sw': 'ped_solved'}, trigger='touch', through=True, list=[{'c': 'transfer', 'map': 6, 'x': 8, 'y': 11, 'dir': 'up', 'se': 'door'}])])
    m.obj('both', 'stairs_up', 12, 6, fw=1, block=False)
    m.event(12, 6, [page(cond={'sw': 'ped_solved'}, trigger='touch', through=True, list=[{'c': 'transfer', 'map': 6, 'x': 8, 'y': 11, 'dir': 'up', 'se': 'door'}])])
    m.door_touch(11, 23, 1, 18, 6, 'down', se='door'); m.door_touch(12, 23, 1, 18, 6, 'down', se='door')
    foe(m, 9, 9, 'tr_hollow_villager_candle_spirit', 'skeleton'); foe(m, 14, 14, 'tr_candle_spirit_bell_mouse', 'lantern2'); foe(m, 8, 14, 'tr_ofuda_moth', 'kettle'); foe(m, 16, 9, 'tr_gloam_bat_gloam_bat', 'mouse2'); foe(m, 12, 13, 'tr_bell_mouse_ofuda_moth', 'mouse')
    sq03_shrine(m); sq04_shrine(m)
    return m
def build_summit():
    m = Map(6, 'Bell Shrine — Summit', 18, 14, 'shrine', 'shrine_far', seed=6); fill_walls(m)
    m.fill('both', 3, 3, 14, 12, SHRINE_F); m.fill('both', 8, 13, 9, 13, SHRINE_F)
    m.region(3, 3, 14, 12, 6); m.region(3, 7, 14, 12, 3); m.region_circle(5, 10, 2, 6); m.post(5, 10, 2); m.encounter = dict(region=3, zone='z05')
    m.obj('both', 'stone_arch', 7, 4, fw=3, block=True, blockrect=(7, 4, 9, 4))
    for x in (4, 13): m.obj('both', 'statue_guard', x, 4, fw=1)
    for x, y in [(4, 11), (13, 11)]: m.obj('both', 'pot_big', x, y, fw=1)
    for x, y in [(5, 4), (12, 4), (8, 7), (4, 8), (13, 8)]: m.light(x, y, 5)
    m.door_touch(8, 13, 5, 11, 7, 'down', se='door'); m.door_touch(9, 13, 5, 12, 7, 'down', se='door')
    # ---- ma (quiet scene, optional): Mio and Kaze rest under the silent bell
    m.event(8, 9, [page(cond={'nself': 'A'}, g=dict(obj='lantern_post', nofar=True) if False else None, trigger='action', marker=True, list=[
        narr('Under the great silent bell, Mio sits down. Kaze sits near, not close, the way he does.'),
        say('kaze', 'Kaze', 'What’s it like? Being missed.'),
        say('mio', 'Mio', 'Like a drawer full of burnt wicks you can’t throw away.'),
        say('kaze', 'Kaze', '…That’s a good answer. I think I’d like a drawer.'), {'c': 'wait', 'ms': 700}, self_sw('A')]),
        page(cond={'self': 'A'}, trigger='action', marker=False, list=[say(None, None, 'The bell hangs silent over the two of them. For a moment it is enough.')])])
    # L07: the Bell's clapper lies in a Far-only chest; the Keeper's arena answers only once you carry it
    chest(m, 13, 12, [('shrine_bell_clapper', 1)], realm='far')
    # field-spell nook (Clearing Gust, Kaze Lv6): drifted sand hides a cache
    m.obj('both', 'chest', 3, 3, fw=1, block=False)
    m.event(3, 3, [page(cond={'nself': 'A'}, g=dict(obj='chest'), list=[{'c': 'se', 'name': 'pickup'}, item('honey', 2), item('lantern_oil', 2), self_sw('A')]), page(cond={'self': 'A'}, g=dict(obj='chest'), list=[say(None, None, 'The chest is empty.')])])
    for (sx, sy) in [(4, 3), (3, 4)]:
        m.event(sx, sy, [page(cond={'nsw': 'drift_gone'}, g=dict(obj='block_sand'), ft='wind_object', list=[say(None, None, 'Sand has drifted against the wall in a smooth heap, hiding something that glints. A good gust would clear it.')], fieldList=[{'c': 'se', 'name': 'strange'}, {'c': 'shake', 'power': 1, 'ms': 400}, say(None, None, 'A gust sweeps the sand away!'), sw('drift_gone')])])
    m.event(8, 5, [page(cond={'nlock': 'L07'}, g=NPC('keeper', 'down', nofar=True), trigger='action', list=[say(None, None, 'Under the great bell, a robed figure kneels. The great bell hangs silent and strangely light.'),
        IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'Look, Mio — the clapper’s gone. The Keeper won’t even look up. It must be somewhere on the Far Shore. Shift and search this hall.')],
           [say('mio', 'Mio', 'The clapper’s gone. The Keeper won’t even look up. It must be somewhere on the Far Shore — Shift and search this hall.')])]),
        page(cond={'lock': 'L07'}, g=NPC('keeper', 'down', nofar=True), trigger='action', list=[
        say(None, None, 'Under the great bell, a robed figure kneels. Bronze armor weighs on his shoulders like grief.'),
        say(None, None, 'A neat paper name-seal is tied to the bell’s clapper-rope. The knot and the brushstrokes look just like the one on the scarecrow.'),
        IF({'nlvl': 6}, [IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'Mio… I can feel how strong he is. Level 6 would be safer. The Post here will heal us — and the shrine below has spirits to practise on.')],
            [say('mio', 'Mio', 'He’s strong. Level 6 would be safer. The Post here will heal me — and the shrine below has spirits to practise on.')])]),
        say(None, None, '(This is the last fight of this chapter. Side quests, hidden caches and anyone still waiting for you will stay as they are. Finish them first if you want to.)'),
        choice(['Face the Bell-Keeper', 'Wait — prepare first'], [[
            {'c': 'checkpoint', 'boss': True},
            say('keeper', 'Bell-Keeper', 'None… shall ring… the Bell.'),
            say('mio', 'Mio', 'Priest Ren? Is that you? The village needs the Bell. The lanterns won’t light.'),
            say('keeper', 'Bell-Keeper', 'If it rings, they all go. All of them. She goes. My Hana goes. I cannot… I will not send her.'),
            IF({'sw': 'kaze_joined'}, [
                say('kaze', 'Kaze', 'Oh no. He’s been holding the whole shore together out of grief.'),
                say('kaze', 'Kaze', 'So we can’t just smash our way through, can we.')],
               [say('mio', 'Mio', 'He’s been holding the whole shore together out of grief. We can’t just smash through.')]),
            say('mio', 'Mio', 'No. We can’t. Not like that.'),
            IF({'nsw': 'boss_tip_seen'}, [say(None, 'Tip', 'Boss tip: hit its weakness to break the Veil — then Parley or Send. The ⚠ telegraph lands next round: Guard or break it with a Stun/Unveil. (Menu → Notes keeps this.)'), sw('boss_tip_seen')]),
            {'c': 'battle', 'troop': 'boss_bell_keeper', 'boss': True, 'noEscape': True,
             'win': [say(None, None, 'The bronze armor falls away piece by piece, like autumn leaves. A tired priest remains, kneeling.'),
                     say('keeper', 'Priest Ren', 'I could not… let her go. I did not want to be alone in the quiet.'),
                     say('mio', 'Mio', 'You aren’t alone. You never were. Hana waited, too. Let us ring it together.'),
                     {'c': 'me', 'name': 'fanfare'}, {'c': 'shake', 'power': 2, 'ms': 800}, sw('boss_done'), {'c': 'chapter', 'n': 3}, item('wellkeeper_pebble'), quest('main', 6, True)],
             'lose': [{'c': 'abort'}]},
            {'c': 'flash', 'color': 0xffffff, 'ms': 800}, {'c': 'se', 'name': 'bell'}, {'c': 'wait', 'ms': 900}, {'c': 'se', 'name': 'bell'},
            narr('The Bell rang once, and the valley breathed out.', 'Across Ashiro, every lantern caught fire at once, and every spirit that had waited too long was finally able to go home.', 'Priest Ren lit the last lantern himself, for the daughter who had never really left.'),
            say(None, None, 'Then the paper seal on the clapper-rope tightens itself, knot by knot, and the bell goes silent again.'),
            IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'That isn’t a broken bell, Mio. That’s a hand.')],
               [say('mio', 'Mio', 'That isn’t a broken bell… that’s a hand.')]),
            narr('Night 3. Six nights have become five, and the calendar by Sachi’s door has one more day crossed out.'),
            narr('Mio and Kaze had only reached the first shore.', 'But the Bell was ringing again, and that was enough to begin.'),
            {'c': 'end'}], []])])], realm='near')
    m.event(8, 4, [page(g=NPC('keeper', 'down', nofar=True), trigger='action', list=[say('keeper', 'Bell-Keeper', 'You… are not the ones I wait for. Go. Shift. See what I cannot.')])], realm='far') if False else None
    foe(m, 6, 10, 'tr_candle_spirit_candle_spirit_bell_mouse', 'lantern2', aggro=3, range=1); foe(m, 13, 9, 'tr_gloam_bat_ofuda_moth', 'kettle', aggro=3, range=1)
    sq03_summit(m); sq04_summit(m)
    return m
