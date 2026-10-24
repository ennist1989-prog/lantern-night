"""Map authoring kit: layered tiles, objects, collision, regions, events + preview renderer."""
import json, os, math, random
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'public', 'data', 'maps')
os.makedirs(OUT, exist_ok=True)
OBJ = json.load(open(os.path.join(ROOT, 'public/assets/objects.json')))
TS = 16
def G(sheet, col, row): return (sheet << 16) | (row << 8) | col
FLOOR, IFLOOR, WALL, WATER = 1, 2, 3, 4
CH3FIX = 5   # art/custom/tiles/ch3fix.png (Ch3 Far-readability edits of pack tiles); only used when that file exists
CH3FIX_PNG = os.path.join(ROOT, 'art/custom/tiles/ch3fix.png')
def has_ch3fix(): return os.path.exists(CH3FIX_PNG)
GRASS = [G(1,11,12)]*6 + [G(1,12,12), G(1,13,12), G(1,14,12)]
PATH_O = (11, 7)
INT_FLOOR = [G(2,1,13), G(2,2,13), G(2,1,14), G(2,2,14)]
STONE = [G(2,12,7)]
DARKBRICK = G(2,12,13); DARKBRICK2 = G(2,12,14)
CAVE = [G(2,12,13), G(2,13,13), G(2,12,14), G(2,13,14)]
SHRINE_F = [G(2,1,1), G(2,2,1), G(2,1,2), G(2,2,2)]
BRIDGE = [G(2,12,3)]
class Map:
    def __init__(self, id, name, w, h, bgm_near, bgm_far, seed=1):
        self.id, self.name, self.w, self.h = id, name, w, h
        n = w * h; self.n = n; self.rng = random.Random(seed)
        self.layers = {r: {'g': [0]*n, 'o': [0]*n} for r in ('near', 'far')}
        self.col = {r: [1]*n for r in ('near', 'far')}
        self.reg = [0]*n
        self.objs = {'near': [], 'far': []}
        self.events = []; self.lights = []; self.encounter = None; self.counters = []
        self.bgm = {'near': bgm_near, 'far': bgm_far}; self.noShift = False; self._eid = 0
        self.markers = []; self.dyn = []
    # ---- helpers
    def i(self, x, y): return y * self.w + x
    def inb(self, x, y): return 0 <= x < self.w and 0 <= y < self.h
    def rs(self, realm): return ('near', 'far') if realm == 'both' else (realm,)
    def tile(self, realm, x, y, gid, layer='g'):
        for r in self.rs(realm):
            if self.inb(x, y): self.layers[r][layer][self.i(x, y)] = gid
    def fill(self, realm, x0, y0, x1, y1, gids, walk=True, layer='g'):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                g = gids if isinstance(gids, int) else self.rng.choice(gids)
                self.tile(realm, x, y, g, layer)
                if walk:
                    for r in self.rs(realm): self.col[r][self.i(x, y)] = 0
    def walk(self, realm, x, y, ok=True):
        for r in self.rs(realm):
            if self.inb(x, y): self.col[r][self.i(x, y)] = 0 if ok else 1
    def walkrect(self, realm, x0, y0, x1, y1, ok=True):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.walk(realm, x, y, ok)
    def region(self, x0, y0, x1, y1, v):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if self.inb(x, y): self.reg[self.i(x, y)] = v
    def region_circle(self, cx, cy, r, v, only_walkable=True):
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if self.inb(x, y) and (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 1: self.reg[self.i(x, y)] = v
    def blob(self, realm, cells, origin=PATH_O, sheet=FLOOR, base=None, layer='g', walk=True):
        """Autotile (4-neighbour) a set of cells with the 4x4 blob block starting at origin."""
        S = set(cells); ox, oy = origin
        for (x, y) in S:
            n, e, s, w = (x, y-1) in S, (x+1, y) in S, (x, y+1) in S, (x-1, y) in S
            if n and e and s and w: c = (1, 1)
            elif not e and not w:
                c = (3, 3) if (not n and not s) else (3, 0) if not n else (3, 2) if not s else (3, 1)
            elif not n and not s:
                c = (0, 3) if not w else (2, 3) if not e else (1, 3)
            else:
                c = (0 if not w else 2 if not e else 1, 0 if not n else 2 if not s else 1)
            self.tile(realm, x, y, G(sheet, ox + c[0], oy + c[1]), layer)
            for r in self.rs(realm): self.col[r][self.i(x, y)] = 0 if walk else 1
    def obj(self, realm, name, tx, ty, fw=None, fh=1, dx=0, dy=0, block=True, flat=False, blockrect=None):
        w, h = OBJ[name][2], OBJ[name][3]
        tw = fw if fw is not None else max(1, math.ceil(w / 16))
        x = tx * TS + tw * 8 + dx; y = (ty + 1) * TS + dy
        for r in self.rs(realm):
            d = {'n': name, 'x': x, 'y': y}
            if flat: d['flat'] = True
            self.objs[r].append(d)
            if block:
                if blockrect: x0, y0, x1, y1 = blockrect
                else: x0, y0, x1, y1 = tx, ty - fh + 1, tx + tw - 1, ty
                for yy in range(y0, y1 + 1):
                    for xx in range(x0, x1 + 1):
                        if self.inb(xx, yy): self.col[r][self.i(xx, yy)] = 1
    def light(self, x, y, r=4, realm=None):
        d = {'x': x, 'y': y, 'r': r}
        if realm: d['realm'] = realm
        self.lights.append(d)
    def post(self, tx, ty, rad=3, light=6):
        self.obj('both', 'lantern_post', tx, ty)
        self.region_circle(tx, ty, rad, 6); self.light(tx, ty, light)
        self.event(tx, ty, [page(g=dict(obj='lantern_post'), trigger='action', list=[{'c': 'post'}], marker=True)])
    def event(self, x, y, pages, realm='both'):
        self._eid += 1
        self.events.append({'id': self._eid, 'x': x, 'y': y, 'realm': realm, 'pages': pages}); return self._eid
    def door_touch(self, x, y, to, tx, ty, dir='up', realm='both', se='door', extra=None, cond=None):
        l = (extra or []) + [{'c': 'transfer', 'map': to, 'x': tx, 'y': ty, 'dir': dir, 'se': se}]
        self.event(x, y, [page(cond=cond, trigger='touch', list=l, through=True)], realm)
    def data(self):
        return dict(id=self.id, name=self.name, w=self.w, h=self.h, bgm=self.bgm, layers=self.layers, col=self.col, reg=self.reg,
                    objs=self.objs, events=self.events, lights=self.lights, encounter=self.encounter, counters=self.counters, noShift=self.noShift, dyn=self.dyn)
    def dynwalk(self, realm, cells, cond, walk=True):
        """Collision that flips when an event condition holds (e.g. an Anchored bridge). Tiles stay as drawn."""
        self.dyn.append(dict(realm=realm, cells=[list(c) for c in cells], cond=cond, walk=walk))
    def save(self):
        with open(os.path.join(OUT, 'map%03d.json' % self.id), 'w') as f: json.dump(self.data(), f, separators=(',', ':'))
    # ---- preview
    def preview(self, realm, path, debug=False):
        sheets = {1: Image.open(os.path.join(ROOT, 'public/assets/tiles/floor.png')).convert('RGBA'), 2: Image.open(os.path.join(ROOT, 'public/assets/tiles/ifloor.png')).convert('RGBA'), 3: Image.open(os.path.join(ROOT, 'public/assets/tiles/wallsimple.png')).convert('RGBA'), 4: Image.open(os.path.join(ROOT, 'public/assets/tiles/water.png')).convert('RGBA')}
        if os.path.exists(CH3FIX_PNG): sheets[CH3FIX] = Image.open(CH3FIX_PNG).convert('RGBA')
        objs = Image.open(os.path.join(ROOT, 'public/assets/objects.png')).convert('RGBA')
        im = Image.new('RGBA', (self.w * TS, self.h * TS), (0, 0, 0, 255))
        for lname in ('g', 'o'):
            for i, g in enumerate(self.layers[realm][lname]):
                if not g: continue
                sh, row, col = g >> 16, (g >> 8) & 255, g & 255
                t = sheets[sh].crop((col*TS, row*TS, col*TS+TS, row*TS+TS)); im.alpha_composite(t, ((i % self.w)*TS, (i // self.w)*TS))
        items = []
        for o in self.objs[realm]:
            r = OBJ[o['n']]; c = objs.crop((r[0], r[1], r[0]+r[2], r[1]+r[3])); items.append((o['y'] - (5000 if o.get('flat') else 0), c, int(o['x'] - r[2]/2), int(o['y'] - r[3])))
        chars = {}
        for e in self.events:
            if e['realm'] not in ('both', realm): continue
            pg = e['pages'][0] if realm == 'near' or True else None
            g = None
            for p in e['pages']:
                if p.get('g'): g = p['g']; break
            if not g: continue
            if 'obj' in g:
                r = OBJ[g['obj']]; c = objs.crop((r[0], r[1], r[0]+r[2], r[1]+r[3])); items.append(((e['y']+1)*TS, c, int(e['x']*TS + 8 - r[2]/2), int((e['y']+1)*TS - r[3])))
            else:
                sh = g['sheet']; 
                if sh not in chars: chars[sh] = Image.open(os.path.join(ROOT, f'public/assets/chars/{sh}.png')).convert('RGBA')
                col = {'down': 0, 'up': 1, 'left': 2, 'right': 3}[g.get('dir', 'down')]
                c = chars[sh].crop((col*16, 0, col*16+16, 16)); items.append(((e['y']+1)*TS, c, e['x']*TS, e['y']*TS))
        for d, c, x, y in sorted(items, key=lambda t: t[0]): im.alpha_composite(c, (x, y))
        if debug:
            from PIL import ImageDraw
            ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(ov)
            for y in range(self.h):
                for x in range(self.w):
                    i = self.i(x, y)
                    if self.col[realm][i]: dr.rectangle([x*TS, y*TS, x*TS+TS-1, y*TS+TS-1], fill=(255, 0, 0, 70))
                    if self.reg[i] == 6: dr.rectangle([x*TS, y*TS, x*TS+TS-1, y*TS+TS-1], fill=(80, 200, 255, 80))
                    elif self.reg[i] == 3: dr.rectangle([x*TS, y*TS, x*TS+TS-1, y*TS+TS-1], fill=(255, 255, 0, 40))
                    elif self.reg[i] == 2: dr.rectangle([x*TS, y*TS, x*TS+TS-1, y*TS+TS-1], fill=(255, 0, 255, 80))
            for e in self.events:
                if e['realm'] in ('both', realm): dr.rectangle([e['x']*TS+4, e['y']*TS+4, e['x']*TS+11, e['y']*TS+11], outline=(0, 255, 0, 255))
            im.alpha_composite(ov)
        im = im.resize((im.width * 2, im.height * 2), Image.NEAREST); im.save(path)
def page(cond=None, g=None, trigger='action', list=None, **kw):
    d = {'cond': cond, 'g': g, 'trigger': trigger, 'list': list or []}; d.update(kw); return d
# ---- command shorthands
def say(face, name, text, **kw): d = {'c': 'msg', 'face': face, 'name': name, 'text': text}; d.update(kw); return d
def narr(*lines): return {'c': 'narrate', 'lines': list(lines)}
def IF(cond, then, els=None): d = {'c': 'if', 'cond': cond, 'then': then}; d.update({'else': els} if els else {}); return d
def sw(name, v=True): return {'c': 'set', 'sw': name, 'v': v}
def quest(id, stage, done=False, quiet=False): return {'c': 'quest', 'id': id, 'stage': stage, 'done': done, 'quiet': quiet}
def item(id, n=1, quiet=False): return {'c': 'item', 'id': id, 'n': n, 'quiet': quiet}
def gold(n): return {'c': 'gold', 'n': n}
def self_sw(k='A'): return {'c': 'self', 'k': k}
def tut(id, text, ms=5200): return {'c': 'tutorial', 'id': id, 'text': text, 'ms': ms}
def choice(opts, branches, cancel=-1): return {'c': 'choice', 'opts': opts, 'br': branches, 'cancel': cancel}
def NPC(sheet, dir='down', **kw): d = dict(sheet=sheet, dir=dir); d.update(kw); return d
