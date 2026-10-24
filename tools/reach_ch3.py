"""Offline reachability check for the Ch3 maps: walks + Lantern Shift (radius-2 landing, like findShiftTarget),
with event blockers and dyn cells evaluated against a set of story switches."""
import json, os, sys
from collections import deque
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load(i): return json.load(open(f'{ROOT}/public/data/maps/map{i:03d}.json'))
def cond_ok(c, sw):
    if not c: return True
    if 'sw' in c and c['sw'] not in sw: return False
    if 'nsw' in c and c['nsw'] in sw: return False
    if 'anysw' in c and not any(s in sw for s in c['anysw']): return False
    return True
def page_of(e, sw):
    pg = None
    for p in e['pages']:
        if cond_ok(p.get('cond'), sw): pg = p
    return pg
def reach(mid, start, sw, realm0='near'):
    m = load(mid); W, H = m['w'], m['h']
    block = {'near': set(), 'far': set()}
    for e in m['events']:
        r = e.get('realm') or 'both'
        # mirrors eventsBlock: any page with a graphic whose cond holds blocks
        if any(p.get('g') and not p.get('through') and not p.get('enemy') and cond_ok(p.get('cond'), sw) for p in e['pages']):
            for rr in (['near', 'far'] if r == 'both' else [r]): block[rr].add((e['x'], e['y']))
    def free(x, y, r):
        if x < 0 or y < 0 or x >= W or y >= H: return False
        for d in m.get('dyn') or []:
            if d['realm'] in (r, 'both') and [x, y] in d['cells'] and cond_ok(d.get('cond'), sw): return d['walk']
        return m['col'][r][y * W + x] == 0
    def ok(x, y, r): return free(x, y, r) and m['reg'][y * W + x] != 2 and (x, y) not in block[r]
    seen = {(start[0], start[1], realm0)}; q = deque(seen)
    while q:
        x, y, r = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy, r)
            if n not in seen and ok(n[0], n[1], r): seen.add(n); q.append(n)
        o = 'far' if r == 'near' else 'near'
        if not m.get('noShift') and m['reg'][y * W + x] != 2:
            t = None
            if ok(x, y, o): t = (x, y)
            else:
                for rad in (1, 2):
                    for ddy in range(-rad, rad + 1):
                        for ddx in range(-rad, rad + 1):
                            if t is None and max(abs(ddx), abs(ddy)) == rad and ok(x + ddx, y + ddy, o): t = (x + ddx, y + ddy)
            if t and (t[0], t[1], o) not in seen: seen.add((t[0], t[1], o)); q.append((t[0], t[1], o))
    return seen, m
def can_touch(seen, x, y, realm=None):
    """event at (x,y) can be triggered: player stands on it or adjacent (in the event's realm)."""
    rs = ['near', 'far'] if realm in (None, 'both') else [realm]
    return any((x + dx, y + dy, r) in seen for r in rs for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)))
if __name__ == '__main__':
    fails = 0
    def chk(c, msg):
        global fails
        print(('PASS ' if c else 'FAIL ') + msg); fails += 0 if c else 1
    S = set(['boss_done', 'ch3_started'])
    s, m = reach(10, (1, 18), S)
    chk(can_touch(s, 11, 13) and can_touch(s, 22, 6, 'near') and can_touch(s, 28, 6, 'far'), 'forest: anchor lesson + both statues reachable')
    chk(any((x, 18, r) in s for x in (48,) for r in ('near', 'far')), 'forest: east exit to the Crossing reachable')
    chk(not any((25, y, r) in s for y in (0, 1) for r in ('near', 'far')), 'forest: north root gate closed before the chorus')
    chk(can_touch(s, 39, 9) and can_touch(s, 5, 29) and can_touch(s, 41, 8) and can_touch(s, 6, 31), 'forest: Rustle, hidden chests, pilgrim memory reachable')
    s2, _ = reach(10, (1, 18), S | {'chorus_done'})
    chk(any((25, 0, r) in s2 for r in ('near', 'far')), 'forest: north gate opens after the chorus')
    s, m = reach(113, (15, 23), S | {'chorus_done'})
    chk(can_touch(s, 15, 2, 'far') and can_touch(s, 17, 20) and can_touch(s, 25, 3) and can_touch(s, 5, 3) and can_touch(s, 21, 10) and can_touch(s, 6, 16), 'grove: guide stone, traveller, heron, peddler, kodama, memory reachable')
    s, m = reach(111, (1, 12), S)
    chk(can_touch(s, 7, 10) and can_touch(s, 19, 12) and can_touch(s, 27, 14) is False, 'crossing: Hisa + pier reachable, far bank not before the bridge')
    s, m = reach(111, (1, 12), S | {'bridge_held'})
    chk(can_touch(s, 31, 12) and can_touch(s, 27, 14) and can_touch(s, 26, 10, 'far'), 'crossing: kappa + pilgrim + memory 3 reachable once the bridge holds')
    chk(not any((x, y, r) in s for x in range(33, 46) for y in range(0, 26) for r in ('near', 'far')), 'crossing: kappa bars the east bank until passed')
    s, m = reach(111, (1, 12), S | {'bridge_held', 'kappa_passed'})
    chk(any((44, y, r) in s for y in (11, 12, 13) for r in ('near', 'far')) and can_touch(s, 41, 19), 'crossing: east exit, Ma beat reachable after the toll')
    s, m = reach(112, (1, 20), S)
    chk(can_touch(s, 28, 4) and not can_touch(s, 29, 20), 'hollow: Willow Mother reachable, wick not before the root bridge')
    s, m = reach(112, (1, 20), S | {'willow_done', 'sprig_planted'})
    chk(can_touch(s, 29, 20) and can_touch(s, 32, 21), 'hollow: wick + return reachable after planting the sprig')
    s, m = reach(1, (17, 16), S)
    chk(any((35, y, r) in s for y in (16, 17) for r in ('near', 'far')), 'village: east road to the forest reachable')
    print('REACH', 'ALL PASS' if not fails else f'{fails} FAIL'); sys.exit(1 if fails else 0)
