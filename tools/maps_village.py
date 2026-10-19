from mapkit import *
def build_village():
    m = Map(1, 'Ashiro Village', 36, 30, 'village', 'village_far', seed=7)
    m.fill('both', 2, 3, 33, 27, GRASS)
    # ---- paths
    cells = set()
    def rect(x0, y0, x1, y1):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): cells.add((x, y))
    rect(15, 15, 20, 18); rect(17, 3, 18, 14); rect(5, 16, 14, 17); rect(21, 16, 30, 17); rect(17, 19, 18, 24); rect(5, 22, 16, 24)
    rect(7, 15, 7, 15); rect(25, 15, 25, 15); rect(12, 12, 12, 15); rect(24, 9, 24, 15); rect(3, 21, 9, 26)
    m.blob('both', cells)
    # ---- border trees (blocking band is collision = default 1 outside walkable rect)
    for x in range(0, 36, 3):
        for y in (0, 3 if False else 1):
            pass
    gap_n = range(16, 21)
    for x in range(-1, 36, 3):
        if x + 1 in gap_n or x in gap_n or x + 2 in gap_n: continue
        m.obj('both', 'tree_big' if (x // 3) % 3 else 'tree_pink', x, 1, fw=3, block=False)
        m.obj('both', 'tree_white' if (x // 3) % 4 == 1 else 'tree_big', x + 1, 2, fw=3, block=False)
    for x in range(-1, 36, 3):
        m.obj('both', 'tree_big' if (x // 3) % 2 else 'tree_l2', x, 28, fw=3, block=False)
        m.obj('both', 'tree_pink' if (x // 3) % 3 == 0 else 'tree_big', x + 1, 29, fw=3, block=False)
    for y in range(3, 28, 3):
        for x in (-1, 33):
            m.obj('both', 'tree_big', x, y + 1, fw=3, block=False); m.obj('both', 'tree_orange' if y % 2 else 'tree_big', x + (1 if x < 0 else 0), y + 3, fw=3, block=False)
    # keep trees out of the shrine gap: add pines flanking
    for x, y in [(15, 2), (21, 2), (15, 5), (21, 5)]:
        m.obj('both', 'pine_s', x, y, fw=2)
    # ---- shrine torii and gate
    m.obj('both', 'torii', 17, 5, fw=3, block=False); m.walk('both', 17, 5, False); m.walk('both', 19, 5, False)
    m.light(16, 5, 3); m.light(20, 5, 3)
    m.obj('both', 'statue_fox', 15, 6, fw=1); m.obj('both', 'statue_fox', 21, 6, fw=1)
    # ---- buildings
    m.obj('both', 'house_orange', 5, 14, fh=3); m.walk('both', 7, 14, True)          # Sachi's
    m.obj('both', 'shop', 24, 14, fh=3); m.walk('both', 25, 14, True)                 # teahouse
    m.obj('both', 'house_timber', 11, 11, fh=3); m.walk('both', 12, 11, True)         # forge
    m.obj('both', 'house_tan', 26, 8, fw=4, fh=3); m.walk('both', 27, 8, True)       # elder (locked)
    m.obj('both', 'hut_round', 29, 21, fh=3); m.walk('both', 30, 21, True)
    m.obj('both', 'house_green', 22, 22, fh=3); m.walk('both', 24, 22, True)
    m.obj('both', 'hay', 4, 10, fh=2)
    # ---- decor
    rng = m.rng
    for _ in range(90):
        x, y = rng.randint(2, 33), rng.randint(3, 27)
        i = m.i(x, y)
        if m.col['near'][i] == 0 and (x, y) not in cells and m.layers['near']['g'][i] in GRASS:
            m.obj('both', rng.choice(['flower_y', 'flower_r', 'flower_w', 'tuft1', 'tuft2', 'tuft3', 'fern', 'clover', 'flower_y2']), x, y, block=False, flat=True)
    for x, y in [(3, 5), (12, 6), (30, 5), (22, 9), (4, 18), (31, 14), (14, 25), (26, 25), (9, 8)]:
        m.obj('both', 'bush1', x, y, fw=2, block=True)
    m.obj('both', 'stump', 28, 13, fw=2)
    for x in (14, 15, 16, 19, 20, 21): m.obj('both', 'fence_h', x, 13, block=True)
    m.walk('both', 17, 13); m.walk('both', 18, 13)
    # corridor forest walls (north & south of boulder corridor)
    for x in range(3, 17, 3):
        m.obj('both', 'tree_big', x, 20, fw=3, block=True, blockrect=(x, 19, x + 2, 20))
        m.obj('both', 'tree_pink' if x % 2 else 'tree_white', x, 26 if x > 9 else 27, fw=3, block=True, blockrect=(x, 25, x + 2, 27 if x <= 9 else 26))
    for x in range(10, 17, 3):
        m.obj('both', 'tree_big', x, 26, fw=3, block=True, blockrect=(x, 25, x + 2, 26))
    # Seal the far-left column and bottom-row walkaround past the boulder corridor
    m.walkrect('both', 2, 19, 2, 27, False)
    for x in range(3, 10):
        m.walk('both', x, 27, False)
    # ---- posts (Lantern Posts)
    m.post(17, 16 - 0 if False else 16, 3) if False else None
    m.walk('both', 17, 16, True)
    m.post(16, 16, 3)
    m.post(18, 6, 2)
    m.post(8, 23, 3)
    m.light(25, 16, 3); m.light(7, 16, 3); m.light(12, 12, 3); m.light(28, 17, 3)
    for x in range(10, 17):
        m.walk('both', x, 21, False); m.walk('both', x, 25, False)
    # ---- the Well
    m.obj('both', 'well_hole', 5, 23, fw=1)
    m.event(5, 23, [page(g=dict(obj='well_hole'), trigger='action', marker=True, list=[
        IF({'nsw': 'well_seen'}, [say('mio', 'Mio', 'Ashiro Well. Cold air breathes up from below, and a rope ladder trails into the dark.'), sw('well_seen')]),
        IF({'nsw': 'warden_done'}, [
            say('mio', 'Mio', 'The path past the boulder still feels watched. I should clear the Far Shore corridor first.'),
            {'c': 'move', 'route': ['up']}],
           [choice(['Climb down', 'Not yet'], [[{'c': 'transfer', 'map': 4, 'x': 3, 'y': 4, 'dir': 'down', 'se': 'grass'}], []])])])])
    # ---- boulder wall (Near only) + paths clear in Far
    for y in (22, 23, 24):
        m.walk('near', 11, y, False)
        m.event(11, y, [page(g=dict(obj='boulder_brown'), trigger='action', marker=False, list=[
            say('mio', 'Mio', 'A huge boulder, wedged tight. It won’t budge.'),
            IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'Rock’s only a rock on this shore. Over on the Far Shore it isn’t even there. Shift, walk past, shift back. Easy.')],
               [say('mio', 'Mio', '(The air feels thin here… as if the Far Shore is pressing close. Maybe the Lantern can help.)')]),
            tut('boulder', 'Tip: obstacles can exist on only one shore. Shift (Q), walk past, then Shift back.'), sw('boulder_seen')])], realm='near')
    # ---- region 3 encounter fields
    m.region(3, 3, 14, 10, 3); m.region(21, 3, 32, 10, 3); m.region(20, 20, 32, 26, 3); m.region(3, 11, 4, 14, 3)
    for (px, py, r) in [(16, 16, 3), (18, 6, 2), (8, 23, 3)]: m.region_circle(px, py, r, 6)
    m.encounter = dict(region=3, zone='z01'); m.region(5, 22, 16, 24, 3)
    # ---- Sachi's door & teahouse door & locked buildings
    m.event(7, 14, [page(trigger='touch', through=True, list=[IF({'sw': 'intro_done'}, [{'c': 'transfer', 'map': 2, 'x': 6, 'y': 8, 'dir': 'up'}], [say('mio', 'Mio', '(I should talk to Granny first.)'), {'c': 'move', 'route': ['down']}])])])
    m.event(25, 14, [page(trigger='touch', through=True, list=[{'c': 'transfer', 'map': 3, 'x': 7, 'y': 8, 'dir': 'up'}])])
    m.event(12, 11, [page(trigger='touch', through=True, list=[
        IF({'sw': 'daigo_joined'}, [say('daigo', 'Daigo', 'The forge’s cold, but I’ll get it going again. Soon as the Bell rings.'), {'c': 'move', 'route': ['down']}],
           [say(None, None, 'The forge door is barred from inside. A note: “Gone to the Well. — D.”'), {'c': 'move', 'route': ['down']}, sw('forge_note')])])])
    for (x, y, t) in [(27, 8, 'The Elder’s door is shut. He’s standing outside, as usual.'), (30, 21, 'Kiku’s family is at the festival grounds. The door is latched.'), (24, 22, 'Nobody home. A lantern hangs unlit by the door.')]:
        m.event(x, y, [page(trigger='touch', through=True, list=[say(None, None, t), {'c': 'move', 'route': ['down']}])])
    # ---- shrine gate
    m.event(18, 4, [page(trigger='touch', through=True, list=[
        IF({'nlock': 'L02'}, [{'c': 'se', 'name': 'buzzer'}, say('villager3', 'Gate Guard', 'Halt. No one climbs to the Shrine after dusk without the Elder’s seal. Orders.'), say('mio', 'Mio', 'Elder Matsu has one for us, I think. Let’s ask him.'), {'c': 'move', 'route': ['down']}],
           [IF({'lock': 'L06'}, [IF({'nsw': 'gate_open'}, [IF({'nlvl': 5}, [say('kaze', 'Kaze', 'Mio. The spirits up there bite harder than the ones down here. A few more fights on the Far Shore first wouldn’t hurt. (Recommended Lv 5)')]), {'c': 'se', 'name': 'door'}, say(None, None, 'The Shrine Key turns with a soft chime. The Guard checks the Elder’s seal and waves you through. The gate swings open.'), sw('gate_open')]), {'c': 'transfer', 'map': 5, 'x': 11, 'y': 20, 'dir': 'up', 'se': 'door'}],
              [IF({'sw': 'gate_open'}, [{'c': 'transfer', 'map': 5, 'x': 11, 'y': 20, 'dir': 'up'}], [say(None, None, 'The Shrine gate is locked tight. Its keyhole is shaped like a bell.'), {'c': 'move', 'route': ['down']}])])])])], realm='near')
    # Far Shore: no guard stands here (lock L02 alternative route)
    m.event(18, 4, [page(trigger='touch', through=True, list=[
        IF({'nsw': 'kaze_joined'}, [
            say('mio', 'Mio', '(I shouldn’t climb alone. That fox on the Far Shore by the square post… I should find him first.)'),
            {'c': 'move', 'route': ['down']}],
           [IF({'lock': 'L06'}, [IF({'nsw': 'gate_open'}, [IF({'nlvl': 5}, [say('kaze', 'Kaze', 'Mio. The spirits up there bite harder than the ones down here. A few more fights on the Far Shore first wouldn’t hurt. (Recommended Lv 5)')]), {'c': 'se', 'name': 'door'}, say(None, None, 'The Shrine Key turns with a soft chime. The gate swings open.'), sw('gate_open')]), {'c': 'transfer', 'map': 5, 'x': 11, 'y': 20, 'dir': 'up', 'se': 'door'}],
              [IF({'sw': 'gate_open'}, [{'c': 'transfer', 'map': 5, 'x': 11, 'y': 20, 'dir': 'up'}], [say(None, None, 'The Shrine gate is locked tight. Its keyhole is shaped like a bell.'), {'c': 'move', 'route': ['down']}])])])])], realm='far')
    # Gate Guard (Near only): his post by the gate
    m.event(19, 4, [page(g=NPC('villager3', 'left'), list=[say('villager3', 'Gate Guard', 'Up to the Shrine? Not without the Elder’s seal, miss. Not after dusk. Though the wind says the other shore has no guards…'), IF({'lock': 'L02'}, [say('villager3', 'Gate Guard', 'Ah, the seal. All in order. Go on.')])])], realm='near')
    m.event(17, 4, [page(trigger='touch', through=True, list=[{'c': 'balloon', 'icon': '…'}])]) if False else None
    # ---- Lantern Post tutorial (square): first interaction lights it (event on top of generic post event)
    m.events[[e['x'] for e in m.events].index(16)]['pages'] = [  # post at (16,16)
        page(cond={'nsw': 'post_lit'}, g=dict(obj='lantern_post'), trigger='action', marker=True, list=[
            say('mio', 'Mio', 'The Lantern Post is cold and dark… Granny said it would wake for the Lantern.'),
            {'c': 'flash', 'color': 0xcff6ff, 'ms': 500}, {'c': 'se', 'name': 'powerup'},
            say(None, None, 'Mio lifts the Lantern. The wick catches, and the post blooms with pale light.'),
            sw('post_lit'), {'c': 'litpost'}, {'c': 'lumen', 'n': 100}, quest('main', 1),
            say(None, 'Tip', 'Lantern Posts: rest, save, and Shift for free nearby. Now press Q (or Tab) to Shift to the Far Shore!')]),
        page(cond={'sw': 'post_lit'}, g=dict(obj='lantern_post'), trigger='action', marker=True, list=[{'c': 'post'}])]
    # ---- NPCs (Near)
    m.event(24, 10, [page(g=NPC('elder', 'down'), list=[
        IF({'nsw': 'kaze_joined'}, [say('elder', 'Elder Matsu', 'Ah, Sachi’s girl. So you have the Lantern at last. Light the post in the square, then press Q and look through the Lantern, there by the post. Someone on the Far Shore has been waiting for you. Come back to me after.')],
           [IF({'nsw': 'elder_told'}, [
               say('elder', 'Elder Matsu', 'A fox, you say? Hm. Then the Lantern has chosen well.'),
               say('elder', 'Elder Matsu', 'Listen. The Shrine Bell has not rung since Priest Ren left us. Without it, no Lantern will light, and the spirits grow restless.'),
               say('elder', 'Elder Matsu', 'The gate to the Shrine is locked, and the key was lost down Ashiro Well. Long ago, they say the Well Spirit took it.'),
               say('elder', 'Elder Matsu', 'The path to the Well is blocked by a boulder, since the last storm. Our young ones can’t shift it. But you… well. You carry a Lantern.'),
               say('elder', 'Elder Matsu', 'Take my seal; the guard at the Shrine gate answers to it. Show him, and he will let you pass.'), item('elder_seal'),
               say(None, None, 'The Well. The one place Granny Sachi said, her whole life, never to go.'),
               choice(['Go to the Well', 'Wait. Sit with Granny a moment first'], [[say('mio', 'Mio', 'Then I’ll go now, before I think about it.')],
                   [say(None, None, 'Mio goes back to the little house and sits by the bed. Sachi’s breath is slow and even, and the hearth is cold.'),
                    say('mio', 'Mio', 'I’m scared, Granny. …But you’d tell me to go.'), say(None, None, 'Sachi doesn’t answer. Mio closes her fingers around the Lantern, and walks back out into the dusk.'), sw('mio_sat_first')]]), sw('elder_told'), sw('boulder_known'), quest('main', 3), IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'Boulder, Well, key. Sounds like a morning stroll. Let’s go.')])],
              [IF({'sw': 'key_got'}, [say('elder', 'Elder Matsu', 'The key! Then climb, children. The Bell has waited long enough.')],
                  [IF({'nsw': 'daigo_joined'}, [say('elder', 'Elder Matsu', 'The Well lies past the boulder, south-west. Mind your Lumen on the Far Shore.')],
                     [say('elder', 'Elder Matsu', 'Daigo’s safe at the forge? Good lad. Now find that key.')])])])])])])
    m.event(20, 12, [page(g=NPC('child', 'down'), list=[say('elder', 'Notice Board', 'WISP BOUNTY — Dust Wisps are drifting into the fields north of the village. Calm or clear 4 of them. Reward from Elder Matsu.')] if False else [])]) if False else None
    # notice board
    m.event(21, 11, [page(g=dict(obj='post_banner'), list=[
        say(None, None, 'NOTICE — Dust Wisps drift through the north fields on the Far Shore. Calm or clear 4 of them. Reward: a Hush Bell pair and 60 gold.'),
        IF({'nsw': 'wisps_taken'}, [choice(['Take the bounty', 'Leave it'], [[sw('wisps_taken'), quest('wisps', 0), {'c': 'tutorial', 'id': 'parley', 'text': 'Tip: wisps only walk the Far Shore (Shift with Q). In battle, Parley raises a spirit’s Mood (Soothe at Lv 2); at full Mood, Send (Lv 3) gives a kinder end.', 'ms': 7000}], []])],
           [IF({'sw': 'wisps_done'}, [say(None, None, 'The bounty is complete.')], [IF({'v': ['wisp_count', '>=', 4]}, [say(None, None, 'Four wisps calmed or cleared. You hand in the notice.'), {'c': 'item', 'id': 'hush_bell', 'n': 2}, gold(60), {'c': 'exp', 'n': 20}, quest('wisps', 0, True), sw('wisps_done')], [say(None, None, 'Progress: wisps calmed or cleared — keep walking the north fields on the Far Shore (Shift with Q).')])])])])])
    # villagers
    m.event(14, 19, [page(g=NPC('villager2', 'down'), move=dict(type='random', r=2), list=[say('villager2', 'Villager', 'Tonight’s the Lantern Festival, and not one lantern will light! Granny Sachi’s girl just got hers, though. That’s a start.')])], realm='near')
    m.event(22, 18, [page(g=NPC('woman', 'left'), move=dict(type='random', r=1), list=[
        IF({'sw': 'daigo_joined'}, [say('woman', 'Aunt Fumi', 'Daigo’s back, safe and sooty! You pulled him out of that Well, Mio. Eat something, you two.')],
           [say('woman', 'Aunt Fumi', 'Daigo’s gone off to the Well this morning, looking for the old bell clapper. He’s stubborn like his father. Someone should look for him.')])])], realm='near')
    m.event(9, 13, [page(g=NPC('villager3', 'right'), list=[say('villager3', 'Boy', 'I saw a fox! Just for a second, sitting by the post. Then — poof! — I blinked and it was gone.')])], realm='near')
    m.event(26, 19, [page(g=NPC('child', 'down'), move=dict(type='random', r=2), list=[
        IF({'item': 'wind_chime'}, [say('child', 'Kiku', 'My wind-chime!! You found it!'), say('child', 'Kiku', 'It was hanging in a tree I can’t even see! Thank you thank you thank you!'), {'c': 'item', 'id': 'lucky_knot'}, {'c': 'item', 'id': 'chime_offering'}, gold(40), {'c': 'exp', 'n': 15}, {'c': 'item', 'id': 'wind_chime', 'n': -1, 'quiet': True}, quest('chime', 1, True), sw('chime_done')],
           [IF({'sw': 'chime_done'}, [say('child', 'Kiku', 'It sings in the wind again. Sometimes it sings back, when nobody’s listening.')],
              [IF({'sw': 'chime_taken'}, [say('child', 'Kiku', 'Please find my chime! Granny says things that fall into the Far Shore don’t come back, but you can go there!')],
                 [say('child', 'Kiku', 'My wind-chime is gone! It was Grandpa’s. I was swinging it and—it just flew off, and sparkled, and then it was gone.'), say('mio', 'Mio', 'I’ll look for it. Somewhere only the Lantern can see, maybe.'), sw('chime_taken'), quest('chime', 0)])])])])], realm='near')
    m.event(5, 20, [page(g=NPC('priest', 'down'), list=[say('priest', 'Old Monk', 'The bell is the heartbeat of this valley. When it stops, the other shore leans in to listen.')])], realm='near') if False else None
    # ---- Far Shore
    m.event(19, 17, [page(cond={'nsw': 'kaze_joined'}, g=NPC('kaze', 'down', nofar=True), list=[
        say('kaze', 'Kaze', 'Oh. You can see me. Of course — that Lantern. Hello, Lantern-bearer.'),
        say('mio', 'Mio', 'You’re a fox. On the Far Shore. Talking.'),
        say('kaze', 'Kaze', 'Spirit fox, if you please. Kaze. I’ve been waiting at that post for forty years for someone to light it and notice me.'),
        say('kaze', 'Kaze', 'Word on this shore: the Bell’s gone silent, and that means trouble for both worlds. You’re headed up the Shrine, aren’t you? Then I’m coming.'),
        say('mio', 'Mio', 'Fine. But try not to be sarcastic about everything.'), say('kaze', 'Kaze', 'No promises.'),
        {'c': 'me', 'name': 'secret'}, {'c': 'party', 'add': 'kaze'}, sw('kaze_joined'), quest('main', 2), {'c': 'erase'},
        {'c': 'tutorial', 'id': 'weak', 'text': 'Kaze joined! Hit weaknesses for Echo bonuses. Spirits you meet are recorded in the Bestiary once Granny Sachi gives you her Ledger.', 'ms': 6000}])], realm='far')
    m.event(30, 13, [page(g=NPC('ghostman', 'left', step=False), list=[
        IF({'sw': 'hanzo_told'}, [IF({'nsw': 'hanzo_paid'}, [say('ghostman', 'Old Shiro', 'He said that? The boat’s still tied at the third post… and he never stopped looking.'), say('ghostman', 'Old Shiro', 'Hm. That is enough. Take this, child. Ghosts don’t need charms.'), {'c': 'item', 'id': 'spirit_charm'}, {'c': 'item', 'id': 'paper_charm', 'n': 2}, {'c': 'exp', 'n': 15}, quest('hanzo', 1, True), sw('hanzo_paid')], [say('ghostman', 'Old Shiro', 'Thank you. Tell Hanzo he can finally mend that net.')])],
           [say('ghostman', 'Old Shiro', 'You… can see me? Then listen. There’s a fisherman, Hanzo, in the Near village.'), say('ghostman', 'Old Shiro', 'Tell him the net is finally mended, and that I forgive him for the storm. Please.'), item('hanzo_note'), sw('shiro_asked'), quest('hanzo', 0)])])], realm='far')
    m.event(14, 15, [page(g=NPC('ghostgirl', 'down'), move=dict(type='random', r=2), list=[say('ghostgirl', 'Spirit Girl', 'The Lantern posts are my favorite. They’re like little stars that stayed.')])], realm='far')
    m.event(23, 12, [page(g=NPC('spirit', 'down'), move=dict(type='random', r=2), list=[say('spirit', 'Wandering Spirit', 'The Bell would sing me home, if it still rang. I don’t mind waiting. I just… don’t want to wait forever.')])], realm='far')
    m.event(31, 21, [page(cond={'nself': 'A'}, g=dict(obj='gem_white', nofar=False), list=[{'c': 'se', 'name': 'pickup'}, say(None, None, 'A wind-chime hangs from a branch that exists only on this shore. It tinkles faintly.'), {'c': 'item', 'id': 'wind_chime'}, self_sw('A')])], realm='far')
    # ---- Hollowed Pilgrim (Name Whisper target; Far only)
    m.event(31, 26, [page(cond={'nsw': 'pilgrim_named'}, g=NPC('ghostman', 'up', step=False), ft='hollowed_npc', list=[
            say(None, None, 'A pilgrim stands in a grey robe. Their face is blank. Not hostile, only… emptied. Something might reach them, if you knew a name to whisper.'), tut('whisper', 'Field spells: Menu → Skill → pick a Field spell when you stand beside a target. (Mio learns Name Whisper at Lv 6.)', 7000)],
            fieldList=[say('mio', 'Mio', '…Tomo? Is that who you were?'), {'c': 'se', 'name': 'secret'}, {'c': 'flash', 'color': 0xcff6ff, 'ms': 400}, say('ghostman', 'Pilgrim', 'Tomo. Yes. That was a good name.'), say('ghostman', 'Pilgrim', 'Take the piece I kept for you. A name only fades when no one says it.'), {'c': 'frag', 'n': 1}, sw('pilgrim_named')]),
        page(cond={'sw': 'pilgrim_named'}, g=NPC('ghostman', 'up', step=False), list=[say('ghostman', 'Tomo', 'Thank you for saying it. I will walk to the Bell now.')])], realm='far')
    # ---- Daigo cameo (hero-journey beat: the Near-side skeptic, before he goes to the Well)
    m.event(14, 12, [page(cond={'nsw': 'post_lit'}, g=NPC('smith', 'left', step=False), list=[
        IF({'nsw': 'daigo_cameo'}, [
            say('smith', 'Daigo', 'You’re up early, Mio. Or you never slept. Your eyes say never.'),
            say('smith', 'Daigo', 'The Bell’s quiet and the lanterns won’t catch. Don’t tell me it’s ghosts. I’ve heard that talk all week.'),
            say('mio', 'Mio', '…I didn’t say anything.'),
            say('smith', 'Daigo', 'You were about to. Look, if it’s the old clapper that’s gone missing, I’ll go and find it myself. Hammers fix things. Spirits don’t.'),
            sw('daigo_cameo')],
           [say('smith', 'Daigo', 'Go on, then. Light your lamp. I’ll be at the Well, if you want proof the world is only one shape.')])])])
    # ---- Straw Warden (Ch.1 boss): stands in the Far corridor to the Well; Near boulder blocks the same corridor
    wd_cond = {'nsw': 'warden_done'}
    for wy in (22, 23, 24):
        m.event(10, wy, [page(cond=wd_cond, trigger='touch', through=True, list=[
            IF({'sw': 'warden_seen'}, [], [say(None, None, 'A scarecrow stands in the corridor — but on the Far Shore its straw shivers, and two hollow eyes open.'), sw('warden_seen')]),
            IF({'nsw': 'flame_seen'}, [say(None, None, 'In its chest, one small flame burns perfectly still. No flicker, no wind. It is the only steady fire in Ashiro tonight.'), sw('flame_seen')]),
            IF({'nlvl': 3}, [IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'Hm. That’s a Warden. I’d feel better if we were Level 3 first. Those wisps in the fields would make good practice — and the Post by the Well road is a safe place to rest.')],
                [say('mio', 'Mio', 'That scarecrow feels wrong. I should be stronger before I face it — Level 3, maybe. The wisps in the fields… and a Post nearby to rest.')])]),
            choice(['Face the Warden', 'Not yet'], [[
                {'c': 'checkpoint', 'boss': True},
                IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'It’s guarding something it has forgotten. Hit it where its straw is weak. When the Veil slips it will be open to a Send.')],
                   [say('mio', 'Mio', 'It’s guarding something it has forgotten. Hit where the straw is weak. When the Veil slips, I can try to Send it.')]),
                {'c': 'battle', 'troop': 'boss_straw_warden', 'boss': True, 'noEscape': True,
                 'win': [say('mio', 'Mio', 'Rest now. Whatever you were guarding, it’s over.'),
                         say(None, None, 'The scarecrow settles into a farmer’s name — “Gen” — and Mio says it, and it goes. The still flame goes out last, by itself.'),
                         say(None, None, 'On the straw chest hangs a neat paper seal, tied with a careful knot. Someone wrote a name on it in tidy brushstrokes, and it was not Gen’s.'),
                         IF({'sw': 'kaze_joined'}, [say('kaze', 'Kaze', 'Mio. Nobody ties a knot like that by accident.')], [say('mio', 'Mio', 'Nobody ties a knot like that by accident…')]), sw('seal_seen_1'),
                         {'c': 'wait', 'ms': 600}, narr('Dusk. Mio sits on the rim of the Old Well, the Lantern in her lap.', 'Far Ashiro glows below, ghost-lit and gentle. No one speaks.'),
                         say(None, 'Sachi (a voice)', 'You are holding the lantern like a rope.'), {'c': 'wait', 'ms': 500},
                         sw('warden_done'), quest('main', 3, quiet=True), {'c': 'toast', 'text': 'Night 2: six nights to Lantern Night.'}], 'lose': [{'c': 'abort'}]}],
                [{'c': 'move', 'route': ['left']}]])])], realm='far')
    m.event(10, 23, [page(cond=wd_cond, g=NPC('statue', 'down', step=False), trigger='action', list=[say(None, None, 'The straw figure watches you. It seems to be waiting.')])], realm='far')
    # Granny Sachi's Far-side friend: Zashiki Child (special spawn, parley only)
    m.event(9, 16, [page(cond={'nself': 'A'}, g=NPC('child', 'down', step=False), trigger='action', list=[
        say(None, 'Zashiki Child', '…are you the one with the light? I’m so hungry for something sweet. Everyone forgot to leave the mochi out.'),
        IF({'nsw': 'zashiki_mochi'}, [say(None, None, 'Mio finds a festival Mochi wrapped in her sleeve. Granny must have tucked it there.'), {'c': 'item', 'id': 'mochi', 'n': 1}, sw('zashiki_mochi')]),
        IF({'nsw': 'zashiki_tip'}, [IF({'lvl': 4}, [say(None, 'Tip', 'A shy spirit. It will never fight. Parley → Offer it the Mochi to fill its Mood, then Invite it to bond.')],
            [say(None, 'Tip', 'A shy spirit. It will never fight. Parley → Offer it the Mochi to fill its Mood. Invite (to bond) is learned at Lv 4, so come back later if you want it to stay with you.')]), sw('zashiki_tip')]),
        {'c': 'battle', 'troop': 'tr_zashiki_child', 'noEscape': False, 'win': [self_sw('A')], 'escape': []}]),
        page(cond={'self': 'A'}, g=NPC('child', 'down', step=False), list=[say(None, 'Zashiki Child', 'Thank you for being kind. I’ll keep your house warm.')])], realm='far')
    # ---- Far enemies (visible, avoidable)
    def foe(x, y, troop, sheet, **kw):
        e = dict(troop=troop, aggro=kw.get('aggro', 4), chase=True, range=kw.get('range', 3), spd=kw.get('spd', 260)); m.event(x, y, [page(g=NPC(sheet), enemy=e)], realm='far')
    foe(8, 22, 'tr_dust_wisp', 'wisp'); foe(14, 7, 'tr_straw_hound', 'mouse2'); foe(27, 12, 'tr_dust_wisp_dust_wisp', 'wisp'); foe(26, 23, 'tr_dust_wisp_moss_slimeling', 'wisp2'); foe(10, 12, 'tr_dust_wisp', 'wisp'); foe(22, 5, 'tr_straw_hound', 'mouse2')
    return m
