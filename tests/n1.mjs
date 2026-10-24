// Items / equipment / key items / locks / field use / spells / summons-data / save migration (browser-side logic checks)
import { launch, sleep, newGame, mashUntil } from './lib.mjs';
const { browser, page, errors } = await launch();
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
try {
  await newGame(page); await mashUntil(page, () => window.__S.$.sw('intro_done'), null, 80);
  const r = await page.evaluate(() => {
    const { $, DB, Field, Gear, Locks, SPEC } = window.__S; const o = {};
    o.items = Object.keys(DB.items).length; o.keyitems = Object.keys(DB.keyitems.items).length; o.locks = Object.keys(DB.keyitems.locks).length;
    o.icon2 = window.__game.textures.exists('icons2'); o.spells = Object.values(SPEC.skills).filter((s) => s.school).length; o.summons = Object.keys(SPEC.summons.summons).length;
    // healPct / cureAll / revive style effects
    $.addActor('kaze'); const m = $.actors.mio; m.hp = 5; $.gain('honey', 2); const mh = $.param(m, 'mhp');
    o.honey = Field.useItemOnActor('honey', 'mio'); o.hpAfter = m.hp; o.mhp = mh; o.honeyLeft = $.items.honey;
    m.hp = 0; $.gain('rice_ball', 1); o.reviveBlocked = Field.useItemOnActor('rice_ball', 'mio').ok === false || m.hp === 0; m.hp = 20;
    // equipment: slots, rarity, sets
    o.slots = Object.keys(m.equips); o.hasAcc2Before = Field.itemFieldUsable ? true : true;
    $.gain('charm1', 1); $.gain('charm2', 1); m.equips.acc = 'charm1'; $.gain('charm1', -1); m.equips.acc2 = 'charm2'; $.gain('charm2', -1);
    o.sets = Gear.activeSets(m.equips).map((s) => s.name + ':' + s.count);
    // realm swapping gear
    const swap = Object.keys(DB.items).find((k) => DB.items[k].realm); o.swapItem = swap;
    if (swap) { const near = Gear.itemParams(swap, 'near', {}), far = Gear.itemParams(swap, 'far', {}); o.swapDiff = JSON.stringify(near) !== JSON.stringify(far); }
    // forge
    $.gold = 9999; $.gain('mio_w2', 1); o.forgeStat = Gear.forgeStat(DB.items.mio_w2); $.forged.mio_w2 = 1; o.forged1 = Gear.itemParams('mio_w2', 'near', $.forged).mat > Gear.itemParams('mio_w2', 'near', {}).mat;
    // key items + locks
    o.L06before = Locks.lockOpen('L06'); $.gain('shrine_key', 1); o.L06after = Locks.lockOpen('L06'); o.L02 = Locks.lockOpen('L02');
    // spells by level
    const k = $.actors.kaze; while (k.level < 6) $.gainExp(k, 20 * k.level); $.refreshAllSkills(); o.kazeSpells = k.skills.filter((s) => SPEC.skills[s]?.school || SPEC.skills[s]?.type === 'field');
    o.canTorch = Field.canCastField('kaze', 'sp_foxfire_torch').ok; o.torch = Field.castField('kaze', 'sp_foxfire_torch');
    k.sp = k.sp; $.gain('hush_bell', 1); o.repelItem = Field.useItemGlobal('hush_bell');
    // migration v1 -> v2
    const old = JSON.parse(JSON.stringify({ ver: 1, gold: 55, items: { onigiri: 2, tea: 1, lantern: 1, bogus_item: 3 }, switches: { elder_told: true, first_send: true, boss_done: true, shiro_asked: true }, actors: { mio: { id: 'mio', level: 4, exp: 10, hp: 30, sp: 9, equips: { weapon: 'mio_w1', armor: 'garb1', acc: null, bond: null }, skills: ['mio_flare', 'ghost_skill'], states: [] } }, party: ['mio'], bonds: {}, bestiary: {} }));
    const mg = window.__S.migrateGame(old); o.mig = { ver: mg.ver, items: mg.items, hasSongs: Array.isArray(mg.songs), acc2: 'acc2' in mg.actors.mio.equips, seal: mg.items.elder_seal, book: mg.items.collectors_book, clapper: mg.items.shrine_bell_clapper, note: mg.items.hanzo_note, skills: mg.actors.mio.skills, chapter: mg.chapter };
    o.mig2 = window.__S.migrateGame({ ver: 2, chapter: 1, switches: { key_got: true } }); o.mig2b = window.__S.migrateGame({ ver: 2, switches: {} });
    return o;
  });
  console.log(JSON.stringify(r).slice(0, 1800));
  ok(r.items >= 290 && r.keyitems >= 40 && r.locks >= 30, 'data loaded: ' + r.items + ' items, ' + r.keyitems + ' key items, ' + r.locks + ' locks');
  ok(r.icon2, 'v2 icon sheet loaded'); ok(r.spells >= 50 && r.summons === 12, `spells ${r.spells}, summons ${r.summons}`);
  ok(r.honey.ok && r.hpAfter > 5 && r.honeyLeft === 1, 'honey heals HP (version kept) & consumed'); ok(r.slots.includes('acc2') && r.slots.includes('keepsake'), 'actor slots incl. acc2/keepsake');
  ok(r.sets.length > 0, 'set bonus active: ' + r.sets.join(',')); ok(!r.swapItem || r.swapDiff, 'realm-swap gear differs by realm: ' + r.swapItem);
  ok(r.forged1, 'forging raises primary stat (' + r.forgeStat + ')'); ok(!r.L06before && r.L06after, 'L06 lock opens with shrine_key'); ok(!r.L02, 'L02 closed without elder_seal');
  ok(r.kazeSpells.includes('sp_foxfire_torch') && r.kazeSpells.includes('sp_gust_clear'), 'Kaze learns Foxfire Torch (L4) + Gust (L6): ' + r.kazeSpells.join(','));
  ok(r.canTorch === true && r.torch.action?.kind === 'tile', 'field spell returns tile action'); ok(r.repelItem.ok, 'Hush Bell repel use ok');
  ok(r.mig.ver === 3 && r.mig.chapter === 3 && r.mig2.chapter === 2 && r.mig2.ver === 3 && r.mig2b.chapter === 1, 'chapter inferred from story switches (B2): ' + [r.mig.chapter, r.mig2.chapter, r.mig2b.chapter]);
  ok(r.mig.ver === 3 && r.mig.hasSongs && r.mig.acc2 && r.mig.items.rice_ball === 2 && !('bogus_item' in r.mig.items), 'v1 save migrated (renamed items, dropped unknown, new fields)');
  ok(r.mig.seal && r.mig.book && r.mig.clapper && r.mig.note, 'migration grants key items for story flags'); ok(!r.mig.skills.includes('ghost_skill'), 'unknown skills filtered');
  ok(errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, 'no console errors ' + JSON.stringify(errors.filter((e) => !/willReadFrequently/.test(e)).slice(0, 3)));
} catch (e) { console.log('EXC', e.message); fails++; }
console.log(fails ? 'N1 FAILURES: ' + fails : 'N1 ALL PASS'); await browser.close();
