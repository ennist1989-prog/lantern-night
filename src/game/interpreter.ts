// Event command interpreter (mirrors RPG Maker event commands; async/await instead of a frame loop).
import { $ } from '../core/state';
import { setGameTag } from '../sentry';
import { DB } from '../core/db';
import { Audio } from '../core/audio';
import { Dir } from './character';
import { lockOpen } from '../core/locks';
const ABORT = { abort: true };
export class Interpreter {
  scene: any; running = 0;
  constructor(scene: any) { this.scene = scene; }
  get busy() { return this.running > 0; }
  cond(c: any, ctx: any): boolean {
    if (!c) return true;
    if (c.sw) for (const s of [].concat(c.sw)) if (!$.sw(s)) return false;
    if (c.anysw && !(c.anysw as string[]).some((x) => $.sw(x))) return false;
    if (c.nsw) for (const s of [].concat(c.nsw)) if ($.sw(s)) return false;
    if (c.v) { const [n, op, val] = c.v; const x = $.v(n); if (op === '>=' && !(x >= val)) return false; if (op === '==' && !(x === val)) return false; if (op === '<' && !(x < val)) return false; if (op === '>' && !(x > val)) return false; if (op === '<=' && !(x <= val)) return false; if (op === '!=' && !(x !== val)) return false; }
    if (c.self) { if (!ctx || ctx.ev == null) return false; if (!$.selfSwitches[$.selfKey(ctx.map, ctx.ev, c.self)]) return false; }
    if (c.nself) { if (ctx && ctx.ev != null && $.selfSwitches[$.selfKey(ctx.map, ctx.ev, c.nself)]) return false; }
    if (c.lock && !lockOpen(c.lock)) return false;
    if (c.nlock && lockOpen(c.nlock)) return false;
    if (c.item && !$.has(c.item)) return false;
    if (c.noitem && $.has(c.noitem)) return false;
    if (c.gold !== undefined && $.gold < c.gold) return false;
    if (c.quest) { const [id, op, st] = c.quest; const s = $.questStage(id); if (op === '>=' && !(s >= st)) return false; if (op === '==' && !(s === st)) return false; if (op === '<' && !(s < st)) return false; }
    if (c.lvl && Math.max(...$.party.map((p) => $.actors[p].level)) < c.lvl) return false;
    if (c.nlvl && Math.max(...$.party.map((p) => $.actors[p].level)) >= c.nlvl) return false;
    if (c.realm && $.realm !== c.realm) return false;
    if (c.party && !$.party.includes(c.party)) return false;
    return true;
  }
  async run(list: any[], ctx: any = {}) {
    this.running++; try { await this.exec(list, ctx); } catch (e: any) { if (e !== ABORT) throw e; } finally { this.running--; this.scene.onInterpEnd?.(); }
  }
  async exec(list: any[], ctx: any) {
    const S = this.scene;
    for (const c of list || []) {
      switch (c.c) {
        case 'msg': { await S.msg.show(c.face ?? null, c.name ?? null, c.text, c); break; }
        case 'choice': { const i = await S.msg.choice(c.opts, c.cancel ?? -1); if (c.var) $.setV(c.var, i); if (c.br && c.br[i]) await this.exec(c.br[i], ctx); break; }
        case 'if': { if (this.cond(c.cond, ctx)) await this.exec(c.then, ctx); else if (c.else) await this.exec(c.else, ctx); break; }
        case 'set': $.setSw(c.sw, c.v !== false); $.refreshAllSkills(); S.refreshEvents(); break;
        case 'chapter': $.chapter = Math.max($.chapter || 1, c.n); setGameTag('chapter', $.chapter); break;   // story chapter: shops stock gear with shopChapter <= chapter; shown on save slots
        case 'var': { const cur = $.v(c.name); const v = c.v; $.setV(c.name, c.op === '+=' ? cur + v : c.op === '-=' ? cur - v : v); break; }
        case 'self': { const id = c.ev ?? ctx.ev; { const sk = $.selfKey(ctx.map ?? $.map.id, id, c.k); if (c.v === false) delete $.selfSwitches[sk]; else $.selfSwitches[sk] = true; } S.refreshEvents(); break; }
        case 'litpost': { const P = S.player; $.litPost = { map: S.mapData.id, x: P.tx, y: P.ty, dir: P.dir }; break; }
        case 'sqreward': { const q = DB.sidequests?.quests?.[c.id]; if (!q) break; const r = q.reward; if (r.gold) $.gold += r.gold; for (const it of r.items) $.gain(it.id, it.qty); for (const k of r.keyItems) $.gain(k, 1); if (r.nameFragments) { $.fragments += r.nameFragments; } if (r.bondOfferings) $.gain(DB.sidequests.offeringItem, r.bondOfferings); Audio.se('powerup'); S.msg.toast(`Reward: ` + [r.gold ? r.gold + ' g' : '', ...r.items.map((i: any) => (DB.items[i.id]?.name || i.id) + (i.qty > 1 ? ' ×' + i.qty : '')), r.nameFragments ? `Name Fragment ×${r.nameFragments}` : '', r.bondOfferings ? `${DB.items[DB.sidequests.offeringItem]?.name} ×${r.bondOfferings}` : ''].filter(Boolean).join(', '), 3200, 14, '#9ee6ff'); break; }
        case 'frag': { $.fragments += c.n ?? 1; Audio.se('powerup'); S.msg.toast(`Name Fragment ×${c.n ?? 1}`, 2600, 14, '#cfe9ff'); break; }
        case 'toast': S.msg.toast(c.text, c.ms ?? 3400, 14, c.color ?? '#ffe9a0'); break;
        case 'wait': await S.wait(c.ms ?? 500); break;
        case 'fade': { if (c.dir === 'in') await S.fader.in(S, c.ms ?? 400); else await S.fader.out(S, c.ms ?? 400, c.white ? 0xffffff : 0x000000); break; }
        case 'transfer': await S.transfer(c.map, c.x, c.y, c.dir || 'down', c); break;
        case 'item': { $.gain(c.id, c.n ?? 1); const it = DB.items[c.id]; if (it.type === 'key' && (c.n ?? 1) > 0) { $.refreshAllSkills(); if (!c.quiet) { Audio.se('powerup'); S.msg.toast(`Key Item: ${it.name}`, 2800, 14, '#ffd36a'); } break; } if (!c.quiet) { Audio.se('pickup'); S.msg.toast(`Obtained ${it.name}${(c.n ?? 1) > 1 ? ' ×' + c.n : ''}`, 2200, 14, '#ffe9a0'); } break; }
        case 'gold': { $.gold = Math.max(0, $.gold + c.n); if (c.n > 0 && !c.quiet) { Audio.se('coin'); S.msg.toast(`Received ${c.n} gold`, 2000, 14, '#ffe9a0'); } break; }
        case 'exp': { await S.giveExp(c.n); break; }
        case 'battle': { const r = await S.startBattle(c.troop, c); ctx.result = r; $.setV('battle_result', r === 'win' ? 1 : r === 'escape' ? 2 : r === 'calm' ? 3 : 0); if (r === 'win' || r === 'calm') { if (c.win) await this.exec(c.win, ctx); } else if (r === 'escape') { if (c.escape) await this.exec(c.escape, ctx); } else if (c.lose) await this.exec(c.lose, ctx); break; }
        case 'shop': await S.openShop(c); break;
        case 'inn': await S.inn(c); break;
        case 'save': await S.openSave(); break;
        case 'heal': $.healAll(); Audio.se('heal'); if (c.lumen) $.lumen = $.lumenMax; break;
        case 'party': { if (c.add) { $.addActor(c.add); S.refreshFollowers(); } if (c.remove) { $.party = $.party.filter((p) => p !== c.remove); S.refreshFollowers(); } break; }
        case 'quest': { const isNew = !$.quests[c.id]; $.setQuest(c.id, c.stage, !!c.done); if (!c.quiet) { S.msg.toast(c.done ? `Quest complete: ${DB.quests[c.id].name}` : isNew ? `New quest: ${DB.quests[c.id].name}` : `Quest updated: ${DB.quests[c.id].name}`, 2600, 14, '#9ee6ff'); Audio.se(c.done ? 'powerup' : 'ok'); } break; }
        case 'post': await S.usePost(ctx); break;
        case 'lumen': { $.lumen = Math.max(0, Math.min($.lumenMax, $.lumen + c.n)); break; }
        case 'lumenmax': { $.lumenMax += c.n; $.lumen = $.lumenMax; break; }
        case 'bgm': Audio.bgm(c.name === 'auto' ? S.mapBgm() : c.name, { fade: c.fade }); break;
        case 'se': Audio.se(c.name); break;
        case 'me': Audio.me(c.name); break;
        case 'move': await S.moveRoute(c.target ?? 'player', c.route, c.wait !== false, ctx); break;
        case 'turn': S.turnChar(c.target ?? 'player', c.dir, ctx); break;
        case 'balloon': await S.balloon(c.target ?? ctx.ev ?? 'player', c.icon || '!', ctx); break;
        case 'shake': await S.shake(c.power ?? 3, c.ms ?? 400); break;
        case 'flash': await S.flash(c.color ?? 0xffffff, c.ms ?? 300); break;
        case 'tutorial': { if (c.once !== false && $.tutorialsShown[c.id]) break; $.tutorialsShown[c.id] = true; S.msg.toast(c.text, c.ms ?? 5200, 14, '#bff6ff'); break; }
        case 'checkpoint': S.autosave(c.boss ? 'boss' : 'cp'); break;
        case 'narrate': await S.msg.narrate(c.lines, c); break;
        case 'bestiary': $.bst(c.id).seen = true; break;
        case 'end': await S.endGame(c); break;
        case 'shift': await S.forceShift(c.to, c); break;
        case 'lockshift': S.shiftLocked = c.v !== false; break;
        case 'repel': $.repel = c.steps; break;
        case 'erase': { const id = c.ev ?? ctx.ev; $.selfSwitches[$.selfKey(ctx.map ?? $.map.id, id, 'X')] = true; S.refreshEvents(); break; }
        case 'camera': await S.cameraPan(c.x, c.y, c.ms ?? 600); break;
        case 'tint': S.setTint(c.color, c.a ?? 0.4, c.ms ?? 400); break;
        case 'playerGraphic': S.player.setSheet(c.sheet, false, S.player.dir); break;
        case 'abort': throw ABORT;
        case 'callEnd': break;
        case 'gameover': await S.gameOver(); break;
        default: console.warn('unknown cmd', c);
      }
    }
  }
}
export type { Dir };
