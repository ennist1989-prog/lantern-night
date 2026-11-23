# Pixel lint report

Scanned 115 PNG(s) in public/assets/chars, public/assets/mon, public/assets/boss.

Rules: (1) unique opaque colours <= 12; (2) alpha in {0,255} only; (3) outline #141b1b wherever an edge pixel touches transparency; (4) brightest highlight L* <= 90, #ffe08a exempt; (5) no gold/yellow (hue 40-60 deg, chroma > 30) except #ffe08a; (6) adjacent unlike pixels differ by dL* >= 8.

**4 PASS / 111 FAIL**

| image | result | colours | size |
|---|---|---|---|
| `public/assets/chars/child.png` | FAIL | 9 | 64x32 |
| `public/assets/chars/daigo.png` | FAIL | 9 | 64x112 |
| `public/assets/chars/eggboy.png` | FAIL | 10 | 64x112 |
| `public/assets/chars/elder.png` | FAIL | 12 | 64x112 |
| `public/assets/chars/ghostgirl.png` | FAIL | 11 | 64x112 |
| `public/assets/chars/ghostman.png` | FAIL | 9 | 64x112 |
| `public/assets/chars/haru.png` | FAIL | 7 | 64x112 |
| `public/assets/chars/hisa.png` | FAIL | 9 | 64x32 |
| `public/assets/chars/hound.png` | FAIL | 5 | 42x17 |
| `public/assets/chars/hound2.png` | FAIL | 3 | 36x17 |
| `public/assets/chars/kappa.png` | PASS | 10 | 64x112 |
| `public/assets/chars/kaze.png` | FAIL | 5 | 64x112 |
| `public/assets/chars/keeper.png` | FAIL | 6 | 64x112 |
| `public/assets/chars/kettle.png` | FAIL | 5 | 64x64 |
| `public/assets/chars/lantern.png` | FAIL | 7 | 64x64 |
| `public/assets/chars/lantern2.png` | FAIL | 6 | 64x64 |
| `public/assets/chars/mio.png` | FAIL | 10 | 64x112 |
| `public/assets/chars/mouse.png` | FAIL | 3 | 64x64 |
| `public/assets/chars/mouse2.png` | FAIL | 4 | 64x64 |
| `public/assets/chars/noble.png` | FAIL | 8 | 64x112 |
| `public/assets/chars/oto.png` | FAIL | 7 | 64x112 |
| `public/assets/chars/priest.png` | FAIL | 9 | 64x112 |
| `public/assets/chars/rustle.png` | FAIL | 6 | 64x64 |
| `public/assets/chars/sachi.png` | FAIL | 9 | 64x32 |
| `public/assets/chars/skeleton.png` | FAIL | 4 | 64x112 |
| `public/assets/chars/slime.png` | FAIL | 6 | 64x64 |
| `public/assets/chars/smith.png` | FAIL | 10 | 64x112 |
| `public/assets/chars/spirit.png` | FAIL | 4 | 64x112 |
| `public/assets/chars/statue.png` | FAIL | 4 | 64x112 |
| `public/assets/chars/tokubei_far.png` | FAIL | 5 | 64x112 |
| `public/assets/chars/tsubaki.png` | FAIL | 14 | 64x112 |
| `public/assets/chars/villager1.png` | FAIL | 9 | 64x112 |
| `public/assets/chars/villager2.png` | FAIL | 7 | 64x112 |
| `public/assets/chars/villager3.png` | FAIL | 9 | 64x112 |
| `public/assets/chars/villager4.png` | FAIL | 9 | 64x112 |
| `public/assets/chars/willow.png` | FAIL | 8 | 64x112 |
| `public/assets/chars/willow_final.png` | FAIL | 8 | 64x112 |
| `public/assets/chars/wisp.png` | FAIL | 5 | 64x64 |
| `public/assets/chars/wisp2.png` | FAIL | 4 | 64x64 |
| `public/assets/chars/woman.png` | FAIL | 8 | 64x112 |
| `public/assets/mon/alebrije_pup.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/amabie.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/anvil_gnome.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/anvil_spark.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/archive_moth.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/bakeneko.png` | FAIL | 3 | 16x16 |
| `public/assets/mon/bell_mouse.png` | FAIL | 3 | 16x16 |
| `public/assets/mon/blank_page.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/candle_spirit.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/choir_of_names.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/cinder_mite.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/dimmed_lantern.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/drowned_clerk.png` | FAIL | 8 | 16x16 |
| `public/assets/mon/dust_wisp.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/faded_neighbor.png` | FAIL | 9 | 16x16 |
| `public/assets/mon/forgetmenot_swarm.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/forgotten_pilgrim.png` | FAIL | 9 | 16x16 |
| `public/assets/mon/garden_pillar.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/gashadokuro_bone.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/gloam_bat.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/hearth_brownie.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/hearth_wisp.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/hitotsume_kozo.png` | FAIL | 8 | 16x16 |
| `public/assets/mon/hollow_villager.png` | FAIL | 7 | 16x16 |
| `public/assets/mon/index_owl.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/ink_serpent.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/jorogumo_weaver.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/kitsunebi_mote.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/kodama_echo.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/marigold_moth.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/memory_koi.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/mine_mole.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/mist_heron.png` | FAIL | 8 | 16x16 |
| `public/assets/mon/moss_leshy.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/moss_slimeling.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/name_eater.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/name_scrap.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/night_stall_tanuki.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/nurikabe.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/ofuda_moth.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/oni_foreman.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/paper_lantern.png` | FAIL | 7 | 16x16 |
| `public/assets/mon/parade_imp.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/parasol_spirit.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/river_imp.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/river_kappa.png` | FAIL | 8 | 16x16 |
| `public/assets/mon/rusalka_reed.png` | PASS | 4 | 16x16 |
| `public/assets/mon/rustle_sprite.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/slag_wraith.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/still_garden_statue.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/stilled_reveler.png` | FAIL | 9 | 16x16 |
| `public/assets/mon/stone_peony.png` | FAIL | 7 | 16x16 |
| `public/assets/mon/straw_hound.png` | FAIL | 3 | 16x16 |
| `public/assets/mon/tengu_crow.png` | FAIL | 7 | 16x16 |
| `public/assets/mon/veil_attendant.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/well_newt.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/well_spirit.png` | FAIL | 5 | 16x16 |
| `public/assets/mon/willow_bud.png` | FAIL | 6 | 16x16 |
| `public/assets/mon/willow_sprout.png` | FAIL | 4 | 16x16 |
| `public/assets/mon/zashiki_child.png` | FAIL | 9 | 16x16 |
| `public/assets/boss/archive_echo.png` | FAIL | 5 | 250x50 |
| `public/assets/boss/bell_keeper.png` | FAIL | 9 | 576x48 |
| `public/assets/boss/garden_guardian.png` | FAIL | 6 | 250x50 |
| `public/assets/boss/gonbei.png` | FAIL | 6 | 360x60 |
| `public/assets/boss/gspirit.png` | FAIL | 5 | 250x50 |
| `public/assets/boss/hundred_year_anvil.png` | FAIL | 5 | 250x50 |
| `public/assets/boss/kappa_toll.png` | PASS | 12 | 384x64 |
| `public/assets/boss/kappa_toll_spilled.png` | PASS | 11 | 384x64 |
| `public/assets/boss/straw_warden.png` | FAIL | 14 | 384x64 |
| `public/assets/boss/tengu.png` | FAIL | 8 | 408x68 |
| `public/assets/boss/tengu_master.png` | FAIL | 7 | 492x82 |
| `public/assets/boss/tsubaki_final.png` | FAIL | 14 | 384x64 |
| `public/assets/boss/tsubaki_forge.png` | FAIL | 13 | 384x64 |
| `public/assets/boss/willow_mother.png` | FAIL | 12 | 432x72 |
| `public/assets/boss/willow_mother_strained.png` | FAIL | 11 | 432x72 |

## Failures

### public/assets/chars/child.png
- rule 3 outline: 56 edge pixel(s) not #141b1b: (2,15) #2b212a, (3,15) #2b212a, (4,15) #2b212a, (5,15) #2b212a
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 4.7 (min 8): (5,12) #d14b34 vs (5,13) #5f7160

### public/assets/chars/daigo.png
- rule 3 outline: 118 edge pixel(s) not #141b1b: (4,15) #548789, (5,15) #548789, (6,15) #548789, (9,15) #548789
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 2.4 (min 8): (20,11) #8f3e56 vs (20,12) #4a5270

### public/assets/chars/eggboy.png
- rule 3 outline: 100 edge pixel(s) not #141b1b: (4,15) #cf736d, (5,15) #cf736d, (10,15) #cf736d, (11,15) #cf736d
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #965340 hue 42 chroma 35
- rule 6 contrast: worst neighbour pair dL* 2.9 (min 8): (34,5) #965340 vs (34,6) #5f7160

### public/assets/chars/elder.png
- rule 3 outline: 133 edge pixel(s) not #141b1b: (4,15) #965340, (5,15) #965340, (6,15) #965340, (9,15) #965340
- rule 4 highlight: #f0e5d1 is L* 91.3 (max 90)
- rule 5 yellow: 2 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 2.5 (min 8): (38,11) #ef914f vs (38,12) #79b8ce

### public/assets/chars/ghostgirl.png
- rule 3 outline: 100 edge pixel(s) not #141b1b: (4,15) #cf736d, (5,15) #cf736d, (10,15) #cf736d, (11,15) #cf736d
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 6 contrast: worst neighbour pair dL* 2.5 (min 8): (42,11) #8f3e56 vs (42,12) #345a52

### public/assets/chars/ghostman.png
- rule 3 outline: 214 edge pixel(s) not #141b1b: (1,15) #d14b34, (2,15) #3b3643, (3,15) #3b3643, (4,15) #3b3643
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 1.2 (min 8): (37,9) #ef914f vs (38,9) #9ba7aa

### public/assets/chars/haru.png
- rule 3 outline: 94 edge pixel(s) not #141b1b: (4,15) #4a5270, (5,15) #4a5270, (6,15) #4a5270, (7,15) #4a5270
- rule 5 yellow: 1 gold/yellow colour(s), worst #965340 hue 42 chroma 35

### public/assets/chars/hisa.png
- rule 3 outline: 376 edge pixel(s) not #141b1b: (5,1) #1b1417, (6,1) #1b1417, (7,1) #1b1417, (8,1) #1b1417
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 0.7 (min 8): (6,13) #4e484a vs (7,13) #7b2d40

### public/assets/chars/hound.png
- rule 3 outline: 20 edge pixel(s) not #141b1b: (21,13) #d78b4a, (22,14) #d78b4a, (23,14) #d78b4a, (39,14) #d78b4a
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/chars/hound2.png
- rule 3 outline: 17 edge pixel(s) not #141b1b: (18,13) #4e484a, (33,13) #5f7160, (34,13) #5f7160, (19,14) #4e484a

### public/assets/chars/kaze.png
- rule 3 outline: 132 edge pixel(s) not #141b1b: (4,15) #d14b34, (5,15) #d14b34, (6,15) #d14b34, (9,15) #d14b34
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/chars/keeper.png
- rule 3 outline: 164 edge pixel(s) not #141b1b: (2,15) #ef914f, (3,15) #ef914f, (4,15) #f2eaf1, (5,15) #f2eaf1
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 0.5 (min 8): (3,13) #e0394c vs (3,14) #d14b34

### public/assets/chars/kettle.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 5 yellow: 2 gold/yellow colour(s), worst #e46d3a hue 49 chroma 65

### public/assets/chars/lantern.png
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)

### public/assets/chars/lantern2.png
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)

### public/assets/chars/mio.png
- rule 3 outline: 146 edge pixel(s) not #141b1b: (4,15) #8d977f, (5,15) #8d977f, (6,15) #8d977f, (9,15) #8d977f
- rule 5 yellow: 1 gold/yellow colour(s), worst #965340 hue 42 chroma 35
- rule 6 contrast: worst neighbour pair dL* 3.4 (min 8): (6,13) #d78b4a vs (7,13) #8d977f

### public/assets/chars/mouse.png
- rule 3 outline: 48 edge pixel(s) not #141b1b: (33,30) #965340, (34,30) #965340, (35,30) #965340, (36,30) #965340
- rule 5 yellow: 1 gold/yellow colour(s), worst #965340 hue 42 chroma 35

### public/assets/chars/mouse2.png
- rule 3 outline: 48 edge pixel(s) not #141b1b: (33,30) #965340, (34,30) #965340, (35,30) #965340, (36,30) #965340
- rule 5 yellow: 1 gold/yellow colour(s), worst #965340 hue 42 chroma 35

### public/assets/chars/noble.png
- rule 3 outline: 77 edge pixel(s) not #141b1b: (1,15) #f2ad7d, (2,15) #f2ad7d, (3,15) #3b3643, (12,15) #3b3643
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 5 yellow: 2 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 7.3 (min 8): (4,9) #ef914f vs (4,10) #f2ad7d

### public/assets/chars/oto.png
- rule 5 yellow: 1 gold/yellow colour(s), worst #965340 hue 42 chroma 35

### public/assets/chars/priest.png
- rule 3 outline: 191 edge pixel(s) not #141b1b: (2,15) #ef914f, (3,15) #ef914f, (4,15) #d3a2c0, (5,15) #d3a2c0
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 0.8 (min 8): (3,14) #d14b34 vs (4,14) #56864c

### public/assets/chars/rustle.png
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/chars/sachi.png
- rule 3 outline: 86 edge pixel(s) not #141b1b: (3,15) #4e484a, (4,15) #2d697b, (5,15) #2d697b, (6,15) #548789
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 0.7 (min 8): (12,6) #d14b34 vs (13,6) #a5608b

### public/assets/chars/skeleton.png
- rule 3 outline: 115 edge pixel(s) not #141b1b: (4,15) #f2eaf1, (5,15) #abc2bc, (6,15) #abc2bc, (10,15) #abc2bc
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/chars/slime.png
- rule 3 outline: 194 edge pixel(s) not #141b1b: (3,14) #56864c, (4,14) #56864c, (5,14) #56864c, (6,14) #56864c
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/chars/smith.png
- rule 3 outline: 119 edge pixel(s) not #141b1b: (5,15) #c8966b, (6,15) #c8966b, (9,15) #c8966b, (10,15) #c8966b
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 6 contrast: worst neighbour pair dL* 0.6 (min 8): (22,76) #3b3643 vs (22,77) #2e3939

### public/assets/chars/spirit.png
- rule 3 outline: 113 edge pixel(s) not #141b1b: (4,15) #79b8ce, (5,15) #79b8ce, (6,15) #79b8ce, (10,15) #79b8ce
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 6 contrast: worst neighbour pair dL* 3.8 (min 8): (9,1) #79b8ce vs (9,2) #9ba7aa

### public/assets/chars/statue.png
- rule 3 outline: 127 edge pixel(s) not #141b1b: (1,15) #5f7160, (2,15) #5f7160, (4,15) #4e484a, (5,15) #4e484a
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/chars/tokubei_far.png
- rule 3 outline: 139 edge pixel(s) not #141b1b: (3,11) #b8dce5, (19,11) #b8dce5, (55,13) #b8dce5, (6,14) #b8dce5

### public/assets/chars/tsubaki.png
- rule 1 colours: 14 unique opaque colours (cap 12)
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)
- rule 6 contrast: worst neighbour pair dL* 0.7 (min 8): (18,4) #7b473c vs (19,4) #4a5270

### public/assets/chars/villager1.png
- rule 3 outline: 131 edge pixel(s) not #141b1b: (4,15) #4e484a, (5,15) #4e484a, (6,15) #4e484a, (9,15) #4e484a
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 2.5 (min 8): (3,11) #d14b34 vs (3,12) #548789

### public/assets/chars/villager2.png
- rule 3 outline: 165 edge pixel(s) not #141b1b: (4,15) #548789, (5,15) #548789, (6,15) #548789, (9,15) #548789
- rule 6 contrast: worst neighbour pair dL* 2.4 (min 8): (36,12) #8f3e56 vs (36,13) #4a5270

### public/assets/chars/villager3.png
- rule 3 outline: 184 edge pixel(s) not #141b1b: (1,15) #a3754e, (2,15) #a3754e, (3,15) #abc2bc, (4,15) #8d977f
- rule 5 yellow: 1 gold/yellow colour(s), worst #965340 hue 42 chroma 35
- rule 6 contrast: worst neighbour pair dL* 1.7 (min 8): (10,28) #a3754e vs (10,29) #56864c

### public/assets/chars/villager4.png
- rule 3 outline: 184 edge pixel(s) not #141b1b: (1,15) #ef914f, (2,15) #ef914f, (3,15) #abc2bc, (4,15) #8d977f
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 0.5 (min 8): (4,11) #d14b34 vs (4,12) #e0394c

### public/assets/chars/willow.png
- rule 3 outline: 20 edge pixel(s) not #141b1b: (5,111) #3b3643, (6,111) #3b3643, (8,111) #3b3643, (10,111) #3b3643

### public/assets/chars/willow_final.png
- rule 3 outline: 20 edge pixel(s) not #141b1b: (5,111) #3b3643, (6,111) #3b3643, (8,111) #3b3643, (10,111) #3b3643

### public/assets/chars/wisp.png
- rule 3 outline: 152 edge pixel(s) not #141b1b: (3,15) #8f3e56, (4,15) #8f3e56, (5,15) #8f3e56, (6,15) #8f3e56
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/chars/wisp2.png
- rule 3 outline: 152 edge pixel(s) not #141b1b: (3,15) #8f3e56, (4,15) #8f3e56, (5,15) #8f3e56, (6,15) #8f3e56
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58

### public/assets/chars/woman.png
- rule 3 outline: 133 edge pixel(s) not #141b1b: (1,15) #cf736d, (2,15) #cf736d, (4,15) #548789, (5,15) #548789
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 1.9 (min 8): (35,74) #e0394c vs (35,75) #548789

### public/assets/mon/alebrije_pup.png
- rule 3 outline: 19 edge pixel(s) not #141b1b: (1,6) #8f3e56, (0,9) #8f3e56, (15,9) #8f3e56, (0,10) #8f3e56
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58

### public/assets/mon/amabie.png
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/mon/anvil_gnome.png
- rule 3 outline: 6 edge pixel(s) not #141b1b: (0,8) #74a334, (15,8) #74a334, (0,9) #74a334, (15,9) #74a334
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 6 contrast: worst neighbour pair dL* 4.1 (min 8): (3,11) #74a334 vs (4,11) #c8966b

### public/assets/mon/anvil_spark.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 5 yellow: 2 gold/yellow colour(s), worst #e46d3a hue 49 chroma 65

### public/assets/mon/archive_moth.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/mon/bakeneko.png
- rule 3 outline: 8 edge pixel(s) not #141b1b: (4,13) #5f7160, (5,14) #5f7160, (6,14) #4e484a, (10,14) #4e484a

### public/assets/mon/bell_mouse.png
- rule 5 yellow: 1 gold/yellow colour(s), worst #965340 hue 42 chroma 35

### public/assets/mon/blank_page.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (3,14) #4e484a, (4,14) #4e484a, (5,14) #4e484a, (6,14) #4e484a
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/candle_spirit.png
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 6 contrast: worst neighbour pair dL* 3.8 (min 8): (10,3) #79b8ce vs (10,4) #9ba7aa

### public/assets/mon/choir_of_names.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (3,15) #8f3e56, (4,15) #8f3e56, (5,15) #8f3e56, (6,15) #8f3e56
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/cinder_mite.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 5 yellow: 2 gold/yellow colour(s), worst #e46d3a hue 49 chroma 65

### public/assets/mon/dimmed_lantern.png
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)

### public/assets/mon/drowned_clerk.png
- rule 3 outline: 12 edge pixel(s) not #141b1b: (1,15) #ef914f, (2,15) #ef914f, (3,15) #91522c, (4,15) #91522c
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 5 yellow: 2 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 2.5 (min 8): (2,13) #a3754e vs (2,14) #d14b34

### public/assets/mon/dust_wisp.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (3,15) #8f3e56, (4,15) #8f3e56, (5,15) #8f3e56, (6,15) #8f3e56
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/faded_neighbor.png
- rule 3 outline: 14 edge pixel(s) not #141b1b: (1,15) #a3754e, (2,15) #a3754e, (3,15) #abc2bc, (4,15) #8d977f
- rule 5 yellow: 1 gold/yellow colour(s), worst #965340 hue 42 chroma 35
- rule 6 contrast: worst neighbour pair dL* 3.9 (min 8): (4,14) #a8a129 vs (4,15) #8d977f

### public/assets/mon/forgetmenot_swarm.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/mon/forgotten_pilgrim.png
- rule 3 outline: 13 edge pixel(s) not #141b1b: (2,15) #ef914f, (3,15) #ef914f, (4,15) #d3a2c0, (5,15) #d3a2c0
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 0.8 (min 8): (3,14) #d14b34 vs (4,14) #56864c

### public/assets/mon/garden_pillar.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (1,15) #5f7160, (2,15) #5f7160, (4,15) #4e484a, (5,15) #4e484a
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/mon/gashadokuro_bone.png
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/mon/gloam_bat.png
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/mon/hearth_brownie.png
- rule 3 outline: 3 edge pixel(s) not #141b1b: (3,15) #8d977f, (12,15) #8d977f, (13,15) #8d977f
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/mon/hearth_wisp.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (3,15) #8f3e56, (4,15) #8f3e56, (5,15) #8f3e56, (6,15) #8f3e56
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/hitotsume_kozo.png
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 5 yellow: 2 gold/yellow colour(s), worst #e46d3a hue 49 chroma 65
- rule 6 contrast: worst neighbour pair dL* 6.5 (min 8): (7,3) #f2eaf1 vs (7,4) #ffffff

### public/assets/mon/hollow_villager.png
- rule 3 outline: 6 edge pixel(s) not #141b1b: (4,15) #4e484a, (5,15) #4e484a, (6,15) #4e484a, (9,15) #4e484a
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 2.5 (min 8): (3,11) #d14b34 vs (3,12) #548789

### public/assets/mon/index_owl.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/mon/ink_serpent.png
- rule 3 outline: 6 edge pixel(s) not #141b1b: (4,14) #ffad5d, (5,14) #ffad5d, (6,14) #ffad5d, (7,14) #ffad5d
- rule 6 contrast: worst neighbour pair dL* 4.2 (min 8): (4,11) #adbc3a vs (4,12) #ffad5d

### public/assets/mon/jorogumo_weaver.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 6 contrast: worst neighbour pair dL* 5.3 (min 8): (4,9) #5f7160 vs (5,9) #e0394c

### public/assets/mon/kitsunebi_mote.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (3,15) #8f3e56, (4,15) #8f3e56, (5,15) #8f3e56, (6,15) #8f3e56
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58

### public/assets/mon/kodama_echo.png
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/marigold_moth.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/mon/memory_koi.png
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 6 contrast: worst neighbour pair dL* 5.3 (min 8): (3,6) #5f7160 vs (4,6) #e0394c

### public/assets/mon/mine_mole.png
- rule 3 outline: 3 edge pixel(s) not #141b1b: (3,15) #8f3e56, (12,15) #8f3e56, (13,15) #8f3e56

### public/assets/mon/mist_heron.png
- rule 3 outline: 3 edge pixel(s) not #141b1b: (5,15) #d78b4a, (6,15) #ffad5d, (8,15) #ffad5d
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ff863d hue 55 chroma 71
- rule 6 contrast: worst neighbour pair dL* 5.8 (min 8): (11,6) #79b8ce vs (11,7) #ffad5d

### public/assets/mon/moss_leshy.png
- rule 3 outline: 19 edge pixel(s) not #141b1b: (1,6) #4e484a, (0,9) #4e484a, (15,9) #4e484a, (0,10) #4e484a
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/moss_slimeling.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (3,14) #56864c, (4,14) #56864c, (5,14) #56864c, (6,14) #56864c
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/mon/name_eater.png
- rule 3 outline: 6 edge pixel(s) not #141b1b: (0,8) #8f3e56, (15,8) #8f3e56, (0,9) #8f3e56, (15,9) #8f3e56
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #e46d3a hue 49 chroma 65

### public/assets/mon/name_scrap.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (3,15) #8f3e56, (4,15) #8f3e56, (5,15) #8f3e56, (6,15) #8f3e56
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/night_stall_tanuki.png
- rule 3 outline: 6 edge pixel(s) not #141b1b: (5,12) #3b3643, (6,12) #3b3643, (7,12) #3b3643, (8,12) #3b3643
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/nurikabe.png
- rule 3 outline: 3 edge pixel(s) not #141b1b: (3,15) #8d977f, (12,15) #8d977f, (13,15) #8d977f
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/mon/ofuda_moth.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/mon/oni_foreman.png
- rule 3 outline: 19 edge pixel(s) not #141b1b: (1,6) #8f3e56, (0,9) #8f3e56, (15,9) #8f3e56, (0,10) #8f3e56
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58

### public/assets/mon/paper_lantern.png
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)

### public/assets/mon/parade_imp.png
- rule 3 outline: 5 edge pixel(s) not #141b1b: (3,13) #4e484a, (5,15) #4e484a, (7,15) #3b3643, (8,15) #3b3643
- rule 6 contrast: worst neighbour pair dL* 7.6 (min 8): (7,14) #4e484a vs (7,15) #3b3643

### public/assets/mon/parasol_spirit.png
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #e46d3a hue 49 chroma 65

### public/assets/mon/river_imp.png
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 6 contrast: worst neighbour pair dL* 5.9 (min 8): (6,2) #74a334 vs (7,2) #9ba7aa

### public/assets/mon/river_kappa.png
- rule 3 outline: 6 edge pixel(s) not #141b1b: (3,15) #56864c, (5,15) #a8a129, (6,15) #a8a129, (9,15) #a8a129
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)

### public/assets/mon/rustle_sprite.png
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)

### public/assets/mon/slag_wraith.png
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #e46d3a hue 49 chroma 65

### public/assets/mon/still_garden_statue.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (1,15) #5f7160, (2,15) #5f7160, (4,15) #4e484a, (5,15) #4e484a
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)

### public/assets/mon/stilled_reveler.png
- rule 3 outline: 4 edge pixel(s) not #141b1b: (5,15) #c8966b, (6,15) #c8966b, (9,15) #c8966b, (10,15) #c8966b
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 6 contrast: worst neighbour pair dL* 0.9 (min 8): (5,14) #a8a129 vs (5,15) #c8966b

### public/assets/mon/stone_peony.png
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 6 contrast: worst neighbour pair dL* 0.9 (min 8): (3,7) #a8a129 vs (3,8) #c8966b

### public/assets/mon/straw_hound.png
- rule 3 outline: 16 edge pixel(s) not #141b1b: (15,5) #4e484a, (15,6) #4e484a, (15,7) #5f7160, (15,8) #5f7160

### public/assets/mon/tengu_crow.png
- rule 3 outline: 6 edge pixel(s) not #141b1b: (4,15) #8f3e56, (5,15) #8f3e56, (6,15) #8f3e56, (9,15) #8f3e56
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 6 contrast: worst neighbour pair dL* 6.5 (min 8): (5,6) #8f3e56 vs (5,7) #4e484a

### public/assets/mon/veil_attendant.png
- rule 3 outline: 6 edge pixel(s) not #141b1b: (4,15) #79b8ce, (5,15) #79b8ce, (6,15) #79b8ce, (9,15) #79b8ce
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 6 contrast: worst neighbour pair dL* 3.8 (min 8): (9,1) #79b8ce vs (9,2) #9ba7aa

### public/assets/mon/well_newt.png
- rule 5 yellow: 1 gold/yellow colour(s), worst #e46d3a hue 49 chroma 65

### public/assets/mon/well_spirit.png
- rule 3 outline: 10 edge pixel(s) not #141b1b: (3,15) #8f3e56, (4,15) #8f3e56, (5,15) #8f3e56, (6,15) #8f3e56
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/willow_bud.png
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/mon/willow_sprout.png
- rule 3 outline: 4 edge pixel(s) not #141b1b: (6,15) #74a334, (7,15) #74a334, (8,15) #74a334, (9,15) #74a334

### public/assets/mon/zashiki_child.png
- rule 3 outline: 7 edge pixel(s) not #141b1b: (2,15) #2b212a, (3,15) #2b212a, (4,15) #2b212a, (5,15) #2b212a
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 4.7 (min 8): (5,12) #d14b34 vs (5,13) #5f7160

### public/assets/boss/archive_echo.png
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 6 contrast: worst neighbour pair dL* 3.8 (min 8): (23,10) #79b8ce vs (23,11) #9ba7aa

### public/assets/boss/bell_keeper.png
- rule 3 outline: 61 edge pixel(s) not #141b1b: (338,39) #3b3643, (36,41) #5f7160, (37,41) #5f7160, (38,41) #5f7160
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 5 yellow: 1 gold/yellow colour(s), worst #ef914f hue 59 chroma 58
- rule 6 contrast: worst neighbour pair dL* 0.5 (min 8): (46,22) #79b8ce vs (46,23) #d3a2c0

### public/assets/boss/garden_guardian.png
- rule 3 outline: 30 edge pixel(s) not #141b1b: (13,42) #ffe18d, (14,42) #74a334, (15,42) #ffe18d, (33,42) #ffe18d
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 6 contrast: worst neighbour pair dL* 7.1 (min 8): (20,24) #adbc3a vs (20,25) #c8966b

### public/assets/boss/gonbei.png
- rule 4 highlight: #ffffff is L* 100.0 (max 90)

### public/assets/boss/gspirit.png
- rule 4 highlight: #ffffff is L* 100.0 (max 90)
- rule 6 contrast: worst neighbour pair dL* 3.8 (min 8): (23,10) #79b8ce vs (23,11) #9ba7aa

### public/assets/boss/hundred_year_anvil.png
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)
- rule 5 yellow: 2 gold/yellow colour(s), worst #e46d3a hue 49 chroma 65

### public/assets/boss/straw_warden.png
- rule 1 colours: 14 unique opaque colours (cap 12)
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 6 contrast: worst neighbour pair dL* 0.2 (min 8): (95,49) #816855 vs (95,50) #5f7160

### public/assets/boss/tengu.png
- rule 3 outline: 60 edge pixel(s) not #141b1b: (21,50) #3b3643, (22,50) #3b3643, (23,50) #3b3643, (24,50) #3b3643
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 6 contrast: worst neighbour pair dL* 4.7 (min 8): (30,28) #5f7160 vs (30,29) #d14b34

### public/assets/boss/tengu_master.png
- rule 3 outline: 60 edge pixel(s) not #141b1b: (28,57) #c8966b, (29,57) #c8966b, (30,57) #c8966b, (31,57) #c8966b
- rule 4 highlight: #fce2ca is L* 91.4 (max 90)
- rule 6 contrast: worst neighbour pair dL* 6.5 (min 8): (37,33) #8f3e56 vs (37,34) #4e484a

### public/assets/boss/tsubaki_final.png
- rule 1 colours: 14 unique opaque colours (cap 12)
- rule 4 highlight: #e3f1f5 is L* 94.2 (max 90)
- rule 6 contrast: worst neighbour pair dL* 0.7 (min 8): (30,30) #4a5270 vs (30,31) #7b473c

### public/assets/boss/tsubaki_forge.png
- rule 1 colours: 13 unique opaque colours (cap 12)
- rule 4 highlight: #f2eaf1 is L* 93.5 (max 90)
- rule 6 contrast: worst neighbour pair dL* 1.7 (min 8): (38,7) #8f3e56 vs (38,8) #7b473c

### public/assets/boss/willow_mother.png
- rule 5 yellow: 1 gold/yellow colour(s), worst #bd7959 hue 51 chroma 37

### public/assets/boss/willow_mother_strained.png
- rule 5 yellow: 1 gold/yellow colour(s), worst #bd7959 hue 51 chroma 37

