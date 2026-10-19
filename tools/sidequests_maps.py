# Chapter 2 side quests (data: public/data/sidequests.json -> imported from rpg-research/data/sidequests.json by sq_import.py)
from mapkit import *
VILLAGERS = [  # (id, name, trade clue)
    ('orin', 'Orin', 'It smells of lamp oil, and its fingers are stained black with wick-soot.'),
    ('tobi', 'Tobi', 'It hums a bell-song, always one note wrong. A boy who rang the bell wrong.'),
    ('haru', 'Haru', 'It carries a flat basket of rice cakes that is not there. A cake-seller.'),
    ('mitsu', 'Mitsu', 'It stands as if waiting at a ferry post. A boatman’s widow, still counting the boats.'),
    ('jiro', 'Jiro', 'It mends an invisible net with quick, careful hands. A net-mender.')]
def _villager(m, i, x, y):
    vid, nm, clue = VILLAGERS[i]
    m.event(x, y, [page(g=NPC('villager%d' % (1 + i % 4), 'down'), trigger='action', list=[
        say(None, None, 'A hollowed villager stands here, face blank as a wiped slate. Mio holds up the Lantern and the figure murmurs a few words.'),
        say(None, None, clue), sw('sq03_h%d' % i),
        IF({'sw': 'sq03_m%d' % i}, [say(None, None, 'The name has already returned to the register.')])])], realm='far')
def sq03_ume(m, x, y):
    """Sister Ume (Far): the register has five smudged names. Match each hollowed villager's clue to a name."""
    names = [v[1] for v in VILLAGERS]
    lines = []
    for i, (vid, nm, clue) in enumerate(VILLAGERS):
        trade = clue.split('. ')[-1].rstrip('.')
        lines.append(IF({'sw': 'sq03_h%d' % i, 'nsw': 'sq03_m%d' % i}, [
            say('ghostgirl', 'Sister Ume', 'You heard one? What did it say?  “%s”' % clue.split('. ')[0].rstrip('.') + '.'),
            choice(names + ['Not yet'], [[say('ghostgirl', 'Sister Ume', ('Yes… %s! I remember now. %s.' % (nm, trade)) if True else ''), {'c': 'se', 'name': 'powerup'}, sw('sq03_m%d' % i)] if j == i else
                                         [say('ghostgirl', 'Sister Ume', 'Hm, no. That name doesn’t feel right. Let me read you the clue again, slowly…')] for j in range(5)] + [[]], cancel=5)]))
    allm = {'sw': ['sq03_m%d' % i for i in range(5)]}
    m.event(x, y, [
        page(cond={'item': 'collectors_book', 'nsw': 'sq03_on'}, g=NPC('ghostgirl', 'down'), trigger='action', list=[
            say('ghostgirl', 'Sister Ume', 'Oh! You carry the Keeper’s Ledger. Then you can see what I cannot unsee: the register of everyone who prayed here.'),
            say('ghostgirl', 'Sister Ume', 'Five names are smudged out. I remember each only by their trade: a lamp-oil seller, a boy who rang the bell wrong, a cake-seller, a boatman’s widow, a net-mender.'),
            say('ghostgirl', 'Sister Ume', 'They wander these halls, hollow now. Speak to them with the Lantern lifted; they may give you a clue. Then tell me whose name it is. Wrong guesses cost nothing.'),
            sw('sq03_on'), quest('sq03', 0)]),
        page(cond={'sw': 'sq03_on', 'nsw': 'sq03_done'}, g=NPC('ghostgirl', 'down'), trigger='action', list=lines + [
            IF(allm, [say('ghostgirl', 'Sister Ume', 'All five. Every name is back in the register. Thank you, Mio; a name is the first thing to go and the last thing worth keeping.'),
                      {'c': 'sqreward', 'id': 'sq03'}, {'c': 'exp', 'n': 20},
                      say('ghostgirl', 'Sister Ume', 'There is a sixth page, blank, with only a drawing: a little fox sitting at the shrine gate. “For the fox who sat at the gate.” Do you know it?'),
                      say('kaze', 'Kaze', '…No. I don’t. Let’s go.'), sw('sq03_done'), quest('sq03', 1, True)],
               [say('ghostgirl', 'Sister Ume', 'Still blank: ' + ', '.join(['%s' % n for n in names]) + '… whichever you have not matched yet. Ask them again; they murmur when you hold up the Lantern.')])]),
        page(cond={'sw': 'sq03_done'}, g=NPC('ghostgirl', 'down'), trigger='action', list=[say('ghostgirl', 'Sister Ume', 'The register is whole again. Even the fox’s page keeps its dedication. I read it every night.')])], realm='far')
def sq03_shrine(m):
    sq03_ume(m, 13, 18)
    for i, (x, y) in enumerate([(9, 22), (14, 22), (12, 16)]): _villager(m, i, x, y)
def sq03_summit(m):
    for i, (x, y) in zip((3, 4), [(10, 8), (11, 11)]): _villager(m, i, x, y)
# ---- sq04 The Wrong Note: three bells (Near pitches are wrong, Far pitches are true). Ring low -> mid -> high.
BELLS = [  # (x, y, rank 0=low,1=mid,2=high, far description, near description)
    (7, 16, 2, 'a high, silvery note', 'a dull clank'), (16, 16, 0, 'a low, round note', 'a thin tink'), (10, 6, 1, 'a middle, warm note', 'a sour clang')]
def sq04_bell(m, k, x, y, rank, far_desc, near_desc, last=False):
    m.obj('both', 'statue_orb', x, y, fw=1)
    m.event(x, y, [page(trigger='action', list=[say(None, None, 'A shrine bell hangs here, struck by a wooden mallet on a chain. On the Near Shore it gives ' + near_desc + '. The note is wrong. Shift to hear the true one.')])], realm='near')
    far_list = [{'c': 'se', 'name': 'bell'}, say(None, None, 'The bell rings ' + far_desc + '. The Far Shore remembers the true pitch.'),
        IF({'sw': 'sq04_on', 'nsw': 'sq04_done'}, [
            IF({'v': ['bells', '==', rank]}, [{'c': 'var', 'name': 'bells', 'op': '+=', 'v': 1}, IF({'v': ['bells', '>=', 3]}, [say(None, None, 'Three notes, low to high, and the three bells hum together. Something small scurries out of the tower, delighted.'), {'c': 'se', 'name': 'powerup'}, {'c': 'flash', 'color': 0xffe9a0, 'ms': 400}, sw('sq04_solved')], [say(None, None, 'The chime holds. One note is right. The next?')])],
               [{'c': 'var', 'name': 'bells', 'op': '=', 'v': 0}, say(None, None, 'A wrong order; the chime fades and the bells go quiet. Start again from the lowest.')])])]
    m.event(x, y, [page(trigger='action', list=far_list)], realm='far')
def sq04_mouse(m, x, y):
    m.event(x, y, [
        page(cond={'sw': 'kaze_joined', 'nsw': 'sq04_on'}, g=NPC('mouse', 'down'), trigger='action', list=[
            say('mouse', 'Bell Mouse', 'Squeak! The shrine bells ring wrong, wrong, wrong every night! Three bells, one on each landing. The Near ones sound sour. But on the Far side… I think the real song is still in there.'),
            say('kaze', 'Kaze', 'Shift, listen at each bell, then ring them low to high. Easy.'),
            say('mouse', 'Bell Mouse', 'Squeak. If you ring the true scale, I will come with you, I promise!'), sw('sq04_on'), quest('sq04', 0)]),
        page(cond={'sw': 'sq04_on', 'nsw': 'sq04_solved'}, g=NPC('mouse', 'down'), trigger='action', list=[say('mouse', 'Bell Mouse', 'Listen at each bell from the Far side. Ring them from the lowest note to the highest!')]),
        page(cond={'sw': 'sq04_solved', 'nsw': 'sq04_done'}, g=NPC('mouse', 'down'), trigger='action', list=[
            say('mouse', 'Bell Mouse', 'That was it! That was the song! Squeak! Oh, thank you!'), {'c': 'sqreward', 'id': 'sq04'}, {'c': 'exp', 'n': 20},
            say('mouse', 'Bell Mouse', 'I will be a neighbour to you now. Call on me, and I will ring for you.'), sw('sq04_done'), quest('sq04', 1, True)]),
        page(cond={'sw': 'sq04_done'}, g=NPC('mouse', 'down'), trigger='action', list=[say('mouse', 'Bell Mouse', 'Ding, ding! The bells are singing right now. Do you hear them?')])], realm='far')
def sq04_shrine(m):
    for k in (0, 1): sq04_bell(m, k, *BELLS[k])
    sq04_mouse(m, 12, 20)
def sq04_summit(m):
    sq04_bell(m, 2, *BELLS[2], last=True)
