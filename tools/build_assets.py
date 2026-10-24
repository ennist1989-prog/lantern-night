#!/usr/bin/env python3
"""Builds public/assets from the downloaded Ninja Adventure pack (CC0) + Pixelify Sans (OFL)."""
import os, sys, json, shutil, glob, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw
import numpy as np
from contact_objs import extract
from objdefs import OBJS
from art_custom import overlay as art_overlay, manifest as art_manifest
# Paths are relative to this checkout (was hard-coded to /workspace/lantern-night, so running it from any other clone
# rebuilt the deploy checkout's assets). LN_DL can point at a shared _dl/ download folder (pack + fonts).
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.environ.get("LN_DL", os.path.join(ROOT, "_dl")) + "/"
R = DL + "pack/Ninja Adventure - Asset Pack/"
O = os.path.join(ROOT, "public", "assets") + "/"
def mk(p): os.makedirs(os.path.dirname(p), exist_ok=True)
def cp(src, dst):
    mk(O+dst); shutil.copyfile(R+src, O+dst)
shutil.rmtree(O, ignore_errors=True); os.makedirs(O)

# ---------- tilesets used for ground ----------
cp("Backgrounds/Tilesets/TilesetFloor.png", "tiles/floor.png")
cp("Backgrounds/Tilesets/Interior/TilesetInteriorFloor.png", "tiles/ifloor.png")
cp("Backgrounds/Tilesets/Interior/TilesetWallSimple.png", "tiles/wallsimple.png")
cp("Backgrounds/Tilesets/TilesetWater.png", "tiles/water.png")

# ---------- object atlas ----------
ims = []
for n in OBJS:
    im = extract(*OBJS[n])
    if im is not None: ims.append((n, im))
ims.sort(key=lambda t: -t[1].height)
W = 512; x = y = rh = 0; frames = {}
placed = []
for n, im in ims:
    if x + im.width + 1 > W: x = 0; y += rh + 1; rh = 0
    placed.append((n, im, x, y)); frames[n] = [x, y, im.width, im.height]
    x += im.width + 1; rh = max(rh, im.height)
atlas = Image.new("RGBA", (W, y + rh + 1), (0, 0, 0, 0))
for n, im, px, py in placed: atlas.alpha_composite(im, (px, py))
mk(O+"objects.png"); atlas.save(O+"objects.png"); json.dump(frames, open(O+"objects.json", "w"))

# ---------- characters (sheet: cols=down,up,left,right; rows=frames) ----------
chars = {"mio":"Character/Princess","kaze":"Character/NinjaThunder","daigo":"Character/Hunter","sachi":"Character/OldWoman",
 "elder":"Character/OldMan","ghostman":"Character/OldMan3","villager1":"Character/Villager","villager2":"Character/Villager2",
 "villager3":"Character/Villager3","villager4":"Character/Villager4","woman":"Character/Woman","child":"Character/Child",
 "priest":"Character/Monk","keeper":"Character/Master","spirit":"Character/Spirit","statue":"Character/Statue",
 "eggboy":"Character/EggBoy","smith":"Character/Villager5","noble":"Character/Noble","ghostgirl":"Character/EggGirl",
 "skeleton":"Character/Skeleton"}
faces = dict(chars)
for k, p in chars.items():
    cp(f"Actor/{p}/SpriteSheet.png", f"chars/{k}.png")
    cp(f"Actor/{p}/Faceset.png", f"faces/{k}.png")
monsters = {"kettle":"Monster/Flam","wisp":"Monster/Spirit","wisp2":"Monster/Spirit2","slime":"Monster/Slime2","mouse":"Monster/Mouse",
            "mouse2":"Monster/MouseBlack","hound":"Animal/DogYellow","hound2":"Animal/DogBlack","lantern":"Monster/LanternRed","lantern2":"Monster/LanternGreen"}
for k, p in monsters.items():
    fs = [f for f in sorted(glob.glob(R+f"Actor/{p}/*.png")) if "Faceset" not in os.path.basename(f)]
    src = [f for f in fs if os.path.basename(f) == "SpriteSheet.png"] or fs
    mk(O+f"chars/{k}.png"); shutil.copyfile(src[0], O+f"chars/{k}.png")
    cp(f"Actor/{p}/Faceset.png", f"faces/{k}.png")
# bosses: idle strip
boss = {"tengu":("Boss/TenguBlue",68),"gspirit":("Boss/GiantSpirit",50)}
bmeta = {}
for k,(p,fw) in boss.items():
    cp(f"Actor/{p}/Idle.png", f"boss/{k}.png"); cp(f"Actor/{p}/Faceset.png", f"faces/{k}.png")
    im = Image.open(R+f"Actor/{p}/Idle.png"); bmeta[k] = {"fw":fw, "fh":im.height, "n":im.width//fw}
json.dump(bmeta, open(O+"boss/meta.json","w"))

# ---------- fx ----------
fx = {"claw":("Attack/Claw/SpriteSheet.png",32,32),"cut":("Attack/Cut/SpriteSheet.png",32,32),"cutx":("Attack/CutX/SpriteSheet.png",32,32),
 "spirit":("Magic/Spirit/SpriteSheet.png",32,32),"spiritb":("Magic/Spirit/SpriteSheetBlue.png",32,32),"circle":("Magic/Circle/SpriteSheetWhite.png",32,32),
 "flam":("Elemental/Flam/SpriteSheet.png",25,30),"water":("Elemental/Water/SpriteSheet.png",44,33),"plant":("Elemental/Plant/SpriteSheet.png",30,28),
 "thunder":("Elemental/Thunder/SpriteSheet.png",20,28),"explosion":("Elemental/Explosion/SpriteSheet.png",40,40),"ice":("Elemental/Ice/SpriteSheet.png",32,32),
 "spark":("Magic/Spark/SpriteSheet.png",30,35),"slash":("Slash/SpriteSheetSlash01.png",26,32),"shield":("Magic/Shield/SpriteSheetBlue.png",24,26)}
fxm = {}
for k,(p,fw,fh) in fx.items():
    cp("FX/"+p, f"fx/{k}.png"); im = Image.open(R+"FX/"+p); fxm[k] = {"fw":fw,"fh":im.height,"n":im.width//fw}
json.dump(fxm, open(O+"fx/meta.json","w"))

# ---------- icons (24x24 cells) ----------
ICONS = {
 "onigiri":"Items/Food/Onigiri.png","tea":"Items/Food/TeaLeaf.png","honey":"Items/Food/Honey.png","noodle":"Items/Food/Noodle.png",
 "sushi":"Items/Food/Sushi.png","cookie":"Items/Food/FortuneCookie.png","yakitori":"Items/Food/Yakitori.png","fish":"Items/Food/Fish.png",
 "lifepot":"Items/Potion/LifePot.png","milk":"Items/Potion/MilkPot.png","water":"Items/Potion/WaterPot.png","medipack":"Items/Potion/Medipack.png",
 "heart":"Items/Potion/Heart.png","emptypot":"Items/Potion/EmptyPot.png","gourd":"Items/Object/Gourd.png","bag":"Items/Object/Bag.png","book":"Items/Object/Book.png",
 "hourglass":"Items/Object/Hourglass.png","flute":"Items/Object/PanFlute.png","letter":"Items/Other/Letter.png","stamp":"Items/Other/Stamp.png",
 "scroll":"Items/Scroll/Scroll.png","scrollfire":"Items/Scroll/ScrollFire.png","scrollplant":"Items/Scroll/ScrollPlant.png","scrollice":"Items/Scroll/ScrollIce.png",
 "goldkey":"Items/Treasure/GoldKey.png","silverkey":"Items/Treasure/SilverKey.png","coin":"Items/Treasure/GoldCoin.png","chest":"Items/Treasure/LittleTreasureChest.png",
 "gemy":"Items/Resource/GemYellow.png","gemg":"Items/Resource/GemGreen.png","gemr":"Items/Resource/GemRed.png","gemp":"Items/Resource/GemPurple.png",
 "feather":"Items/Resource/feather.png","branch":"Items/Resource/Branch.png","rock":"Items/Resource/Rock.png","hammer_t":"Items/Tool/Hammer.png",
 "wand":"Items/Weapons/MagicWand/Sprite.png","stick":"Items/Weapons/Stick/Sprite.png","sai":"Items/Weapons/Sai/Sprite.png","hammer":"Items/Weapons/Hammer/Sprite.png",
 "katana":"Items/Weapons/Katana/Sprite.png","sword":"Items/Weapons/Sword/Sprite.png","club":"Items/Weapons/Club/Sprite.png","bone":"Items/Weapons/Bone/Sprite.png",
 "armor":"Ui/Skill Icon/Items & Weapon/Armor.png","helmet":"Ui/Skill Icon/Items & Weapon/Helmet.png","amulet":"Ui/Skill Icon/Items & Weapon/Amulet.png",
 "ring":"Ui/Skill Icon/Items & Weapon/Ring.png","boot":"Ui/Skill Icon/Items & Weapon/Boot.png","guard":"Ui/Skill Icon/Items & Weapon/Guard.png",
 "s_heal":"Ui/Skill Icon/Spell/Heal.png","s_fire":"Ui/Skill Icon/Spell/Fireball.png","s_light":"Ui/Skill Icon/Spell/BookLight.png","s_wind":"Ui/Skill Icon/Spell/BookWind.png",
 "s_dark":"Ui/Skill Icon/Spell/BookDarkness.png","s_plant":"Ui/Skill Icon/Spell/BookPlant.png","s_ice":"Ui/Skill Icon/Spell/BookIce.png","s_cut":"Ui/Skill Icon/Spell/Cut.png",
 "s_mist":"Ui/Skill Icon/Spell/Mist.png","s_counter":"Ui/Skill Icon/Spell/Counter.png","s_explo":"Ui/Skill Icon/Spell/Explosion.png","s_atkup":"Ui/Skill Icon/Spell/AttackUpgrade.png",
 "s_defup":"Ui/Skill Icon/Spell/DefenseUpgrade.png","s_talk":"Ui/Skill Icon/Job & Action/Talk.png","s_sing":"Ui/Skill Icon/Job & Action/Sing.png","s_punch":"Ui/Skill Icon/Job & Action/Punch.png",
 "s_potion":"Ui/Skill Icon/Job & Action/Potion.png","s_cook":"Ui/Skill Icon/Job & Action/Cook.png","s_moon":"Ui/Skill Icon/Meteo/Moon.png","s_sun":"Ui/Skill Icon/Meteo/Sun.png",
 "s_interact":"Ui/Skill Icon/Job & Action/Interact.png","s_dish":"Ui/Skill Icon/Job & Action/Dish.png","s_water":"Ui/Skill Icon/Job & Action/Water.png",
}
names = list(ICONS); cols = 16; rows = (len(names)+cols-1)//cols
ia = Image.new("RGBA", (cols*24, rows*24), (0,0,0,0)); imeta = {}
for i, n in enumerate(names):
    im = Image.open(R+ICONS[n]).convert("RGBA")
    if im.width > 24 or im.height > 24: im.thumbnail((24,24), Image.NEAREST)
    cx = (i%cols)*24 + (24-im.width)//2; cy = (i//cols)*24 + (24-im.height)//2
    ia.alpha_composite(im, (cx, cy)); imeta[n] = i
ia.save(O+"icons.png"); json.dump(imeta, open(O+"icons.json","w"))

# ---------- window skin (own design, 3-part: bg + frame), generated ----------
sk = Image.new("RGBA", (96, 48), (0,0,0,0)); d = ImageDraw.Draw(sk)
# background 48x48 tile: deep indigo gradient w/ faint woven pattern
for yy in range(48):
    for xx in range(48):
        t = yy/47
        base = (int(14+10*t), int(22+18*t), int(58+40*t))
        if (xx+yy) % 8 == 0: base = tuple(min(255, c+8) for c in base)
        sk.putpixel((xx,yy), base+(255,))
# frame 48x48: 4px ornate border with corner studs (9-slice: 16px corners)
fr = Image.new("RGBA", (48,48), (0,0,0,0)); fd = ImageDraw.Draw(fr)
fd.rounded_rectangle([0,0,47,47], radius=7, outline=(245,238,214,255), width=2)
fd.rounded_rectangle([2,2,45,45], radius=5, outline=(122,150,214,255), width=1)
fd.rounded_rectangle([3,3,44,44], radius=4, outline=(40,56,120,255), width=1)
for cx,cy in [(5,5),(42,5),(5,42),(42,42)]:
    fd.rectangle([cx-1,cy-1,cx+1,cy+1], fill=(255,214,102,255))
sk.alpha_composite(fr, (48,0)); mk(O+"ui/windowskin.png"); sk.save(O+"ui/windowskin.png")

# ---------- font ----------
mk(O+"fonts/x"); shutil.copyfile(DL+"PixelifySans.ttf", O+"fonts/PixelifySans.ttf")
shutil.copyfile(DL+"OFL-pixelify.txt", O+"fonts/OFL-PixelifySans.txt")

# ---------- audio ----------
def enc(src, dst, br="72k", mono=True):
    mk(O+dst)
    cmd = ["ffmpeg","-y","-loglevel","error","-i",src,"-c:a","libvorbis","-b:a",br]+(["-ac","1"] if mono else [])+[O+dst]
    subprocess.run(cmd, check=True)
M = R+"Audio/Musics/"
def mus(prefix):
    c = [f for f in sorted(os.listdir(M)) if f.startswith(prefix+" ")]
    return M+c[0]
BGM = {"title":"22","village":"36","village_far":"26","home":"5","well":"13","well_far":"30","shrine":"12","shrine_far":"21","battle":"17","boss":"34",
       "sad":"7","credits":"15","calm":"33","fading":"29"}
for k,p in BGM.items(): enc(mus(p), f"bgm/{k}.ogg", br="64k")
S = R+"Audio/Sounds/"; J = R+"Audio/Jingles/"
SE = {"cursor":"Menu/Move1.wav","ok":"Menu/Accept.wav","cancel":"Menu/Cancel.wav","buzzer":"Alert/Alert3.wav","save":"Menu/Accept5.wav","load":"Menu/Accept7.wav",
 "hit":"Hit & Impact/Hit1.wav","crit":"Hit & Impact/Hit5.wav","hit2":"Hit & Impact/Impact2.wav","magic":"Magic & Skill/Magic1.wav","magic2":"Magic & Skill/Magic3.wav",
 "heal":"Magic & Skill/Heal.wav","shift":"Magic & Skill/Spirit.wav","strange":"Magic & Skill/Strange.wav","coin":"Bonus/Coin.wav","pickup":"Bonus/Bonus.wav",
 "encounter":"Alert/Alert.wav","escape":"Whoosh & Slash/Launch.wav","slash":"Whoosh & Slash/Slash.wav","fire":"Elemental/Fire.wav","water":"Elemental/Water1.wav",
 "explosion":"Elemental/Explosion3.wav","door":"Menu/Menu6.wav","bell":"Bonus/Bonus3.wav","powerup":"Bonus/PowerUp1.wav","fade":"Alert/Alert5.wav","grass":"Elemental/Grass.wav",
 "voice":"Voice/Voice1.wav","tick":"Menu/Move3.wav","dog":"Creature/Dog.wav"}
for k,p in SE.items(): enc(S+p, f"se/{k}.ogg", br="48k")
ME = {"victory":"Success1.wav","levelup":"LevelUp1.wav","gameover":"GameOver.wav","secret":"Secret1.wav","fanfare":"Success3.wav"}
for k,p in ME.items(): enc(J+p, f"me/{k}.ogg", br="64k")

# ---------- licences ----------
mk(O+"x"); shutil.copyfile(R+"LICENSE.txt", O+"fonts/CC0-NinjaAdventure-LICENSE.txt")
os.remove(O+"fonts/x") if os.path.exists(O+"fonts/x") else None
# ---------- hand-made art (art/custom/) is copied LAST so the wipe above never loses it ----------
art_overlay(); art_manifest()
print("assets done"); 
