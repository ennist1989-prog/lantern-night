"""Database tab generator (Actors/Skills/Items/Enemies/Troops/Quests/System)."""
import json, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(OUT, exist_ok=True)

actors = {
 'mio': dict(name='Mio', role='Lantern-bearer', level=1, face='mio', attack='strike',
   params=dict(mhp=[40,260], msp=[12,70], atk=[6,30], def_=[3,20], mat=[6,32], mdf=[4,22], agi=[7,24]),
   skills=[[1,'lumen_flare'],[1,'soothe'],[2,'send'],[3,'remember'],[4,'mend'],[6,'radiance']],
   equip=dict(weapon='old_lantern', armor='cloth_haori', acc=None),
   desc='A quiet girl who carries her family’s Lantern. She can shift between the Near and Far Shores.'),
 'kaze': dict(name='Kaze', role='Fox spirit', level=2, face='kaze', attack='claw',
   params=dict(mhp=[34,220], msp=[10,60], atk=[7,32], def_=[2,16], mat=[5,28], mdf=[4,20], agi=[10,30]),
   skills=[[1,'hum'],[2,'foxfire'],[3,'howl'],[5,'gale_dash']],
   equip=dict(weapon='fang_wraps', armor='cloth_haori', acc=None),
   desc='A sharp-tongued fox spirit who can only be seen from the Far Shore — until Mio’s Lantern lit him.'),
 'daigo': dict(name='Daigo', role='Smith’s apprentice', level=3, face='daigo', attack='hammer',
   params=dict(mhp=[52,320], msp=[8,40], atk=[8,36], def_=[5,26], mat=[2,14], mdf=[3,18], agi=[5,20]),
   skills=[[1,'bulwark'],[3,'forge_strike'],[5,'chain_smash']],
   equip=dict(weapon='smith_hammer', armor='cloth_haori', acc=None),
   desc='Ashiro’s smith-in-training. Big hands, bigger worries, and a hammer that hits like a bell.'),
}
for a in actors.values():
    a['params']['def'] = a['params'].pop('def_')

S = {}
def sk(id, name, type, scope, sp=0, **kw): S[id] = dict(name=name, type=type, scope=scope, sp=sp, **kw)
sk('strike','Strike','phys','enemy',0,attack=True,fx='cut',icon='s_punch',formula='a.atk*4 - b.def*2',desc='Swing the Lantern.')
sk('claw','Claw','phys','enemy',0,attack=True,fx='claw',icon='s_cut',formula='a.atk*4 - b.def*2',desc='Slash with fox claws.')
sk('hammer','Hammer','phys','enemy',0,attack=True,fx='slash',icon='hammer',formula='a.atk*4 - b.def*2',desc='A solid smith’s blow.')
sk('lumen_flare','Lumen Flare','mag','enemy',5,element='lumen',fx='spark',se='magic',icon='s_light',formula='a.mat*3 + 14 - b.mdf*2',desc='A burst of Lantern light. Strong on the Far Shore.')
sk('radiance','Radiance','mag','enemies',10,element='lumen',fx='spark',se='magic',icon='s_sun',formula='a.mat*2.4 + 8 - b.mdf*1.5',desc='Light floods the whole field.')
sk('soothe','Soothe','parley','enemy',3,mood=25,fx='circle',se='magic2',icon='s_sing',desc='Speak gently. Raises the target’s Mood (+25).')
sk('remember','Remember','parley','enemy',5,mood=15,moodSorrow=40,fx='circle',se='magic2',icon='s_talk',desc='Recall what it once was. Big Mood gain on sorrowful spirits.')
sk('hum','Hum','parley','enemy',2,mood=15,moodCurious=28,fx='circle',se='magic2',icon='s_sing',desc='Kaze hums an old tune. Curious spirits love it.')
sk('send','Send','send','enemy',6,fx='spirit',se='magic2',icon='s_moon',desc='Guide a calmed (or nearly broken) spirit onward. 0 gold, but a kinder reward.')
sk('mend','Mend','heal','ally',6,formula='a.mat*3 + 25',fx='spark',se='heal',icon='s_heal',desc='Restore HP to one ally.')
sk('foxfire','Foxfire','mag','enemy',4,element='flame',fx='flam',se='fire',icon='s_fire',formula='a.mat*3.4 + 10 - b.mdf*2',desc='Spirit flame. Burns dusty things.')
sk('howl','Howl','buff','allies',6,state='atkup',turns=3,popup='ATK↑',fx='circle',se='powerup',icon='s_atkup',desc='Raise the whole party’s Attack for 3 turns.')
sk('gale_dash','Gale Dash','phys','enemies',7,element='gale',fx='slash',se='slash',icon='s_wind',formula='a.atk*2.6 + a.mat - b.def*1.5',desc='A whirlwind dash that hits every enemy.')
sk('bulwark','Bulwark','buff','allies',5,state='protected',turns=3,popup='DEF↑',fx='shield',se='powerup',icon='s_defup',desc='Raise the whole party’s Defense for 3 turns.')
sk('forge_strike','Forge Strike','phys','enemy',5,element='flame',fx='flam',se='fire',icon='s_explo',formula='a.atk*4.8 - b.def*2',desc='A white-hot hammer blow.')
sk('chain_smash','Chain Smash','phys','enemy',8,hits=2,fx='cutx',se='hit',icon='s_counter',formula='a.atk*2.8 - b.def*2',desc='Two heavy hits in a row.')
# enemy skills
sk('e_strike','Strike','phys','enemy',0,attack=True,fx='claw',formula='a.atk*4 - b.def*2')
sk('e_bite','Bite','phys','enemy',0,attack=True,fx='claw',formula='a.atk*4.2 - b.def*2')
sk('e_puff','Dust Puff','mag','enemy',0,fx='spark',formula='a.mat*3.5 - b.mdf*2')
sk('e_ember','Ember','mag','enemy',0,fx='flam',se='fire',formula='a.mat*4 - b.mdf*2')
sk('e_splash','Splash','mag','enemy',0,fx='water',se='water',formula='a.mat*3.6 - b.mdf*2')
sk('e_howl','Hollow Howl','mag','enemies',0,fx='circle',se='strange',formula='a.mat*2.2 - b.mdf*1.5')
sk('e_clang','Clang','phys','enemy',0,fx='cutx',se='hit2',formula='a.atk*4.6 - b.def*2')
sk('bell_toll','Bell Toll','phys','enemies',0,fx='circle',se='bell',formula='a.atk*3.4 - b.def*1.4')
sk('e_sorrow','Sorrowing Tide','mag','enemies',0,fx='water',se='water',formula='a.mat*2.6 - b.mdf*1.5')
sk('e_lantern','Cold Flame','mag','enemy',0,fx='flam',se='fire',formula='a.mat*4.2 - b.mdf*2')

I = {}
def it(id, name, type, icon, desc, price=0, **kw): I[id] = dict(name=name, type=type, icon=icon, desc=desc, price=price, **kw)
it('lantern','Family Lantern','key','s_light','The Lantern that lets Mio Shift between the Near and Far Shores.', usable=False)
it('onigiri','Onigiri','item','onigiri','Rice ball. Restores 30 HP. Spirits like it too.',12,usable=True,scope='ally',effect=dict(hp=30),offer=True)
it('tea','Barley Tea','item','tea','Warm tea. Restores 12 SP.',18,usable=True,scope='ally',effect=dict(sp=12),offer=True)
it('honey','Honey Pot','item','honey','Sweet and sticky. Restores 70 HP.',34,usable=True,scope='ally',effect=dict(hp=70),offer=True)
it('lantern_oil','Lantern Oil','item','gourd','Restores 30 Lumen. Use from the menu.',25,usable='menu',effect=dict(lumen=30))
it('hush_bell','Hush Bell','item','hourglass','Ring softly: no wandering spirits for 60 steps.',30,usable='menu',effect=dict(repel=60))
it('dust_pouch','Dust Pouch','material','bag','Soot and dust from a Dust Wisp. Sells for a little.',10)
it('wish_scrap','Wish Scrap','material','scroll','A scrap of paper with half a wish on it. Dropped by Sent spirits.',24)
it('bell_shard','Bell Shard','material','gemy','A chip of bronze that still hums faintly.',40)
it('shrine_key','Shrine Key','key','goldkey','The Well Spirit’s gift. It opens the Bell Shrine gate.',usable=False)
it('wind_chime','Wind-chime','key','flute','Kiku’s lost wind-chime. It tinkles with Far Shore light.',usable=False)
it('hanzo_note','Ghost’s Message','key','letter','A message from the other shore, to be told aloud to Hanzo.',usable=False)
it('old_lantern','Old Lantern','weapon','sai','Mio’s worn Lantern. ATK +2.',0,slot='weapon',who=['mio'],params=dict(atk=2))
it('brass_lantern','Brass Lantern','weapon','sai','A sturdier Lantern. ATK +5, MAT +2.',110,slot='weapon',who=['mio'],params=dict(atk=5,mat=2))
it('fang_wraps','Fang Wraps','weapon','club','Bandaged claws. ATK +2.',0,slot='weapon',who=['kaze'],params=dict(atk=2))
it('silver_wraps','Silver Wraps','weapon','club','Silver-threaded wraps. ATK +5, AGI +1.',110,slot='weapon',who=['kaze'],params=dict(atk=5,agi=1))
it('smith_hammer','Smith Hammer','weapon','hammer_t','Daigo’s everyday hammer. ATK +3.',0,slot='weapon',who=['daigo'],params=dict(atk=3))
it('steel_hammer','Steel Hammer','weapon','hammer','A heavier hammer. ATK +6.',120,slot='weapon',who=['daigo'],params=dict(atk=6))
it('cloth_haori','Cloth Haori','armor','armor','Plain village cloth. DEF +2.',0,slot='armor',params=dict(def_=2))
it('quilted_haori','Quilted Haori','armor','armor','Thick and warm. DEF +4, MDF +1.',80,slot='armor',params=dict(def_=4,mdf=1))
it('padded_vest','Padded Vest','armor','helmet','Layers of padding. DEF +6.',150,slot='armor',params=dict(def_=6))
it('bell_charm','Bell Charm','acc','amulet','A tiny bell that keeps bad dreams away. MDF +3.',60,slot='acc',params=dict(mdf=3))
it('lucky_knot','Lucky Knot','acc','ring','A knot of red cord. AGI +3.',70,slot='acc',params=dict(agi=3))
it('spirit_charm','Spirit Charm','acc','ring','Given by a grateful ghost. MDF +4, MAT +3.',0,slot='acc',params=dict(mdf=4,mat=3))
it('bond_bellmouse','Bond: Bell Mouse','bond','heart','A tiny friend who rings along. AGI +3, MAT +1.',0,slot='bond',params=dict(agi=3,mat=1))
for k,v in I.items():
    if 'params' in v and 'def_' in v['params']: v['params']['def']=v['params'].pop('def_')

E = {}
def en(id, name, sprite, level, mhp, atk, df, mat, mdf, agi, exp, gold, skills, **kw):
    E[id] = dict(name=name, sprite=sprite, level=level, params=dict(mhp=mhp,atk=atk,**{'def':df},mat=mat,mdf=mdf,agi=agi), exp=exp, gold=gold, skills=[dict(id=a,w=b) for a,b in skills], kind=kw.pop('kind','char'), **kw)
en('dust_wisp','Dust Wisp','wisp',1,22,5,2,4,2,6,8,5,[('e_strike',3),('e_puff',1)],drops=[['dust_pouch',0.3]],spirit=True,mood0=20,likes=['tea'],temper='curious',countVar='wisp_count',
   res=dict(near=dict(flame=1.5,gale=0.75),far=dict(lumen=1.5,umbra=0.75)),forms=dict(near=dict(tint=0xd2a878)),
   desc='A mote of lonely dust that drifted loose from a hearth. It follows warm light.',parleyHint='Curious. Hum or Soothe works well.',calmDrop='wish_scrap')
en('moss_slime','Moss Slime','slime',2,34,6,4,3,3,4,11,7,[('e_strike',3),('e_splash',1)],drops=[['onigiri',0.12]],mood0=10,likes=['honey','onigiri'],temper='plain',
   res=dict(near=dict(flame=1.5,tide=0.5),far=dict(lumen=1.25,flame=1.25)),forms=dict(near=dict(),far=dict(tint=0xbfffe0)),
   desc='Damp and sleepy. It only wants somewhere cool and quiet.',parleyHint='Slow to warm up. Offer food.',calmDrop='wish_scrap')
en('bell_mouse','Bell Mouse','mouse',2,20,5,2,4,3,10,9,6,[('e_strike',2),('e_puff',1)],drops=[['dust_pouch',0.2]],mood0=30,likes=['honey','tea'],temper='curious',bond='bond_bellmouse',countVar='mouse_count',
   res=dict(near=dict(flame=1.25),far=dict(lumen=1.25,gale=1.5)),forms=dict(),
   desc='A mouse that rings a tiny bell wherever it goes. Fast and shy.',parleyHint='Very curious. May become a Bond if Sent kindly.',calmDrop='wish_scrap')
en('paper_lantern','Paper Lantern','lantern',3,40,6,3,9,5,5,16,10,[('e_lantern',3),('e_strike',1)],drops=[['wish_scrap',0.2]],spirit=True,mood0=15,likes=['tea','honey'],temper='sorrowful',countVar='lantern_count',
   res=dict(near=dict(flame=2.0,tide=1.25),far=dict(lumen=0.75,tide=1.5,gale=1.25)),forms=dict(near=dict(sprite='lantern',nofar=True),far=dict(sprite='lantern2')),
   desc='A festival lantern nobody lit this year. Its cold flame burns out of sorrow.',parleyHint='Sorrowful. “Remember” hits hard.',calmDrop='wish_scrap')
en('stone_watcher','Stone Watcher','statue',4,58,11,5,5,5,9,20,14,[('e_bite',3),('e_howl',1)],drops=[['bell_shard',0.15]],spirit=True,mood0=0,likes=['onigiri'],temper='plain',countVar='watcher_count',
   res=dict(near=dict(flame=1.25,gale=1.25,tide=1.25),far=dict(lumen=1.5,umbra=0.5)),forms=dict(near=dict(sprite='statue'),far=dict(sprite='spirit',nofar=False)),
   desc='A guardian statue that kept watch for so long that its watching became a spirit.',parleyHint='Loyal. Soothe, then Send.',calmDrop='wish_scrap')
en('hearth_ember','Hearth Ember','kettle',3,50,8,6,5,3,5,15,10,[('e_strike',2),('e_ember',2)],drops=[['tea',0.2]],mood0=10,likes=['tea'],temper='sorrowful',
   res=dict(near=dict(tide=1.75,flame=0.25,bloom=1.0),far=dict(lumen=1.25,tide=1.5)),forms=dict(),
   desc='The last coal of a hearth that went out when the well was abandoned. It still wants to keep somebody warm.',parleyHint='Sorrowful and warm. Tea helps. Water hurts it badly.',calmDrop='wish_scrap')
en('hollow_samurai','Hollow Samurai','skeleton',4,72,12,6,4,4,6,22,16,[('e_clang',3),('e_strike',2)],drops=[['bell_shard',0.2]],mood0=0,likes=[],temper='sorrowful',
   res=dict(near=dict(flame=1.25,bloom=1.25,phys=0.75),far=dict(lumen=1.5,umbra=0.5,phys=1.0)),forms=dict(near=dict(tint=0xe8d8c0),far=dict(tint=0xbfe8ff)),
   desc='A shrine guard who forgot why he stands watch.',parleyHint='Sorrowful. “Remember” may reach him.',calmDrop='wish_scrap')
en('well_spirit','Ido-no-Kami','gspirit',3,130,9,5,9,5,6,60,40,[('e_sorrow',2),('e_splash',2),('e_strike',1)],kind='boss',mini=True,boss=False,mood0=10,likes=['tea','honey'],temper='sorrowful',spirit=True,
   res=dict(near=dict(flame=1.5,tide=0.5),far=dict(lumen=1.25,tide=0.5,bloom=1.5)),forms=dict(), hidden=False,
   desc='The spirit of Ashiro Well. It guarded the old lantern until the day the villagers stopped drawing water.',parleyHint='Sorrowful. Remember, Soothe… and Send when calm.',calmDrop='wish_scrap',scale=3.2)
en('bell_keeper','The Bell-Keeper','tengu',5,330,13,9,9,8,8,120,100,[('e_clang',3),('e_howl',1)],kind='boss',boss=True,mood0=0,likes=[],temper='sorrowful',armorNear=True,dmgMult=1.0,
   res=dict(near=dict(flame=0.75,gale=0.75,lumen=0.75),far=dict(lumen=1.5,umbra=0.75,gale=1.25)),forms=dict(near=dict(tint=0xddddee),far=dict()),
   desc='The shrine’s guardian. Bronze armor holds the Near Shore; its true, grieving form lives on the Far. It tolls every third round: Guard!',parleyHint='Armor blocks Parley on the Near Shore. On the Far Shore it can be reached.',scale=4.6)
for e in E.values():
    e['face'] = e['sprite']
E['well_spirit']['boss']=False

T = {}
def tr(id, members, **kw): T[id]=dict(members=members, **kw)
tr('wisp1',['dust_wisp'],intro='A Dust Wisp drifts closer! It seems lonely… (Try Parley → Soothe!)')
tr('wisp2',['dust_wisp','dust_wisp'])
tr('slime1',['moss_slime'])
tr('mouse1',['bell_mouse'],intro='A Bell Mouse jingles into view.')
tr('wisp_mouse',['dust_wisp','bell_mouse'])
tr('slime_wisp',['moss_slime','dust_wisp'])
tr('lantern1',['paper_lantern'])
tr('lantern2',['paper_lantern','paper_lantern'])
tr('watcher1',['stone_watcher'])
tr('watcher_lantern',['stone_watcher','paper_lantern'])
tr('ember1',['hearth_ember'])
tr('ember_wisp',['hearth_ember','dust_wisp'])
tr('ember2',['hearth_ember','hearth_ember'])
tr('skel1',['hollow_samurai'])
tr('skel_wisp',['hollow_samurai','dust_wisp'])
tr('skel_lantern',['hollow_samurai','paper_lantern'])
tr('well_spirit',['well_spirit'],intro='Ido-no-Kami rises from the dark water, sorrowing…',bgm='boss',noEscape=True)
tr('bell_keeper',['bell_keeper'],intro='The Bell-Keeper raises its bronze wings!',boss=True,noEscape=True,bgm='boss')

Q = {
 'main': dict(name='The Silent Bell', desc='The Shrine Bell has not rung, and the Lanterns will not light. Granny Sachi has asked Mio to find out why.',
   stages=['Light the Lantern Post in the village square.','Shift to the Far Shore (Q) and look for a fox spirit.','Ask Elder Matsu about the silent Shrine Bell.','Find a way into Ashiro Well. A boulder blocks the path — try the Far Shore.','Find the Shrine Key in the Well.','Climb to the Bell Shrine and open the gate.','Face the Bell-Keeper at the top of the Shrine.'],
   reward='A restored Bell', doneText='The Bell-Keeper has been laid to rest. The Far Shore is open.'),
 'hanzo': dict(name='A Message for Hanzo', desc='A ghost on the Far Shore wants Hanzo, the fisherman, to hear something.',
   stages=['Speak to Hanzo in the Near village and tell him about the ghost.','Return to the Far Shore ghost with Hanzo’s answer.'],reward='Spirit Charm',doneText='Two old friends finally spoke.'),
 'chime': dict(name='Kiku’s Wind-chime', desc='Little Kiku lost her wind-chime. Something about it shines on the Far Shore.',
   stages=['Search for the wind-chime — maybe it fell somewhere only the Far Shore can see.','Bring the wind-chime back to Kiku.'],reward='Lucky Knot, 40 gold',doneText='Kiku’s chime sings again.'),
 'wisps': dict(name='Wisp Bounty', desc='Elder Matsu posted a notice: the Dust Wisps are drifting into the fields. Calm or clear 4 of them.',
   stages=['Calm or clear 4 Dust Wisps in the north fields, on the Far Shore (Shift with Q).'],reward='Hush Bell ×2, 60 gold',doneText='The fields are quiet again.'),
}

SYS = dict(
 start=dict(map=2,x=6,y=6,dir='down'), respawn=dict(map=1,x=17,y=17,dir='down'), startParty=['mio'], startItems=dict(lantern=0,rice_ball=3,herbal_tea=1), startGold=40,
 mapNames={1:'Ashiro Village',2:'Sachi’s House',3:'Tama’s Teahouse & Store',4:'Ashiro Well',5:'Bell Shrine — Lower Hall',6:'Bell Shrine — Summit'},
 fadingLines=[dict(face='sachi',name='Granny Sachi',text='There you are, child! You went pale as paper. Sit by the post a moment. The Lantern needs rest too.'),
   dict(face='kaze',name='Kaze',text='Oi. You faded. Next time, shift back before the light gets thin. I can’t carry you.'),
   dict(face='mio',name='Mio',text='(The Lantern is warm in my hands again. I should keep an eye on its light.)')],
 notes=[dict(title='The Lantern',text='Press Q (or Tab / ◐) to Shift between the Near Shore and the Far Shore. Going to the Far costs 10 Lumen and drains 0.5/s; coming back is free.'),
   dict(title='Lantern Posts',text='Posts glow with safe light: free Shifts, no drain, no wandering spirits. Use one to rest (full restore) or save.'),
   dict(title='Dash',text='Hold Shift (or press » on touch) to dash. Options → Always Dash flips it.'),
   dict(unlock='parley',title='Parley',text='Spirits have a Mood meter (pink bar). Parley raises it; hits lower it. At full Mood a spirit is Calm and can be Sent onward for a kinder reward.'),
   dict(unlock='weak',title='Echo & Weaknesses',text='Hit a weakness to build Echo (up to +45% damage for the whole battle). Weaknesses are recorded in the Bestiary.'),
   dict(unlock='shiftfar',title='The Far Shore',text='Walls, rocks and doors differ between realms. If something blocks you, try the other shore.'),
   dict(unlock='send',title='Send & Invite',text='At full Mood a spirit is Calm. Send (Lv 3) guides it onward for full EXP and a Wish Scrap or Name Fragment. Invite (Lv 4) asks a calm spirit to walk with you as a Bond.'),
   dict(unlock='boss_tip_seen',title='Bosses',text='Hit a boss’s weakness to break its Veil, then Parley or Send. A ⚠ telegraph lands next round: Guard, or break it with a Stun/Unveil. Weaknesses can differ between shores, so Shift in battle.'),
   dict(title='Saving',text='Save anywhere: Menu → Save (10 slots). The game also autosaves on every map change, after battles, and before bosses.')],
)

def dump(name, data):
    with open(os.path.join(OUT, name+'.json'), 'w') as f: json.dump(data, f, ensure_ascii=False, indent=1)
def write():
    dump('actors', actors); dump('skills', S); dump('items', I); dump('enemies', E); dump('troops', T); dump('quests', Q); dump('system', SYS)
