// Unified input: keyboard + gamepad + touch buttons -> RPG-Maker-style virtual keys.
export type Key = 'up' | 'down' | 'left' | 'right' | 'ok' | 'cancel' | 'menu' | 'dash' | 'shift' | 'pageup' | 'pagedown' | 'auto' | 'fast' | 'skip';
const KEYMAP: Record<string, Key[]> = {
  ArrowUp: ['up'], ArrowDown: ['down'], ArrowLeft: ['left'], ArrowRight: ['right'],
  KeyW: ['up'], KeyS: ['down'], KeyA: ['left'], KeyD: ['right'],
  KeyZ: ['ok'], Enter: ['ok'], Space: ['ok'], NumpadEnter: ['ok'],
  KeyX: ['cancel', 'menu'], Escape: ['cancel', 'menu'], Numpad0: ['cancel', 'menu'],
  ShiftLeft: ['dash'], ShiftRight: ['dash'],
  KeyQ: ['shift', 'pageup'], Tab: ['shift'], KeyE: ['pagedown'], PageUp: ['pageup'], PageDown: ['pagedown'],
  KeyV: ['auto'], KeyF: ['fast', 'skip'],
  // Dash (Shift) is movement only. Fast-forwarding text uses its own key (hold Ctrl or F / RT or R-stick) so walking into a talk with Shift held can't skip dialogue.
  ControlLeft: ['skip'], ControlRight: ['skip'],
};
class InputClass {
  private down = new Set<Key>(); private prev = new Set<Key>();
  private kb = new Set<Key>(); private pad = new Set<Key>(); private touch = new Set<Key>();
  private hold: Record<string, number> = {};
  private trig = new Set<Key>();
  lastDevice: 'kb' | 'pad' | 'touch' = 'kb';
  touchDashToggle = false;
  init() {
    window.addEventListener('keydown', (e) => {
      const ks = KEYMAP[e.code]; if (!ks) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
      ks.forEach((k) => this.kb.add(k)); this.lastDevice = 'kb';
    });
    window.addEventListener('keyup', (e) => { const ks = KEYMAP[e.code]; if (ks) ks.forEach((k) => this.kb.delete(k)); });
    window.addEventListener('blur', () => { this.kb.clear(); this.touch.clear(); });
    const tb = document.getElementById('touch');
    if (tb) {
      const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
      if (isTouch) tb.classList.add('on');
      window.addEventListener('touchstart', () => { this.lastDevice = 'touch'; tb.classList.add('on'); }, { passive: true });
      tb.querySelectorAll<HTMLElement>('.tb').forEach((el) => {
        const k = el.dataset.k as Key;
        const on = (e: Event) => { e.preventDefault(); this.lastDevice = 'touch'; if (k === 'dash') { this.touchDashToggle = !this.touchDashToggle; el.classList.toggle('dn', this.touchDashToggle); return; } this.touch.add(k); if (k === 'cancel') this.touch.add('menu'); el.classList.add('dn'); };
        const off = (e: Event) => { e.preventDefault(); if (k === 'dash') return; this.touch.delete(k); if (k === 'cancel') this.touch.delete('menu'); el.classList.remove('dn'); };
        el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
        el.addEventListener('contextmenu', (e) => e.preventDefault());
      });
    }
  }
  setTouchVisible(v: boolean) { document.getElementById('touch')?.classList.toggle('on', v); }
  private pollPad() {
    this.pad.clear();
    const gps = (navigator.getGamepads && navigator.getGamepads()) || [];
    for (const gp of gps) {
      if (!gp || !gp.connected) continue;
      const b = (i: number) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (b(12) || ay < -0.5) this.pad.add('up'); if (b(13) || ay > 0.5) this.pad.add('down');
      if (b(14) || ax < -0.5) this.pad.add('left'); if (b(15) || ax > 0.5) this.pad.add('right');
      if (b(0)) this.pad.add('ok'); if (b(1)) { this.pad.add('cancel'); }
      if (b(9) || b(8)) this.pad.add('menu'); if (b(2) || b(6)) this.pad.add('dash'); if (b(7)) this.pad.add('skip');
      if (b(3)) { this.pad.add('shift'); } if (b(4)) this.pad.add('pageup'); if (b(5)) this.pad.add('pagedown');
      if (b(10)) this.pad.add('auto'); if (b(11)) { this.pad.add('fast'); this.pad.add('skip'); }
      if (this.pad.size) this.lastDevice = 'pad';
    }
  }
  update() {
    this.pollPad();
    this.prev = this.down; this.down = new Set<Key>();
    for (const s of [this.kb, this.pad, this.touch]) s.forEach((k) => this.down.add(k));
    if (this.touchDashToggle) this.down.add('dash');
    this.updateDir4();
    this.trig.clear();
    for (const k of this.down) { if (!this.prev.has(k)) this.trig.add(k); this.hold[k] = (this.hold[k] || 0) + 1; }
    for (const k of Object.keys(this.hold)) if (!this.down.has(k as Key)) this.hold[k] = 0;
  }
  isDown(k: Key) { return this.down.has(k); }
  isTriggered(k: Key) { return this.trig.has(k); }
  isRepeated(k: Key) { if (!this.down.has(k)) return false; const h = this.hold[k] || 0; return h === 1 || (h >= 24 && (h - 24) % 6 === 0); }
  /** consume a trigger so lower layers don't also react in same frame */
  consume(k: Key) { this.trig.delete(k); }
  anyTriggered() { return this.trig.size > 0; }
  clear() { this.trig.clear(); }
  private latched = new Set<Key>();
  /** D7: ignore the direction keys held right now until each is released (optionally keep one, e.g. the arrival facing after a
   *  map change), so a held key can't walk straight back into the touch event/exit that just fired. */
  latchDirs(allow?: Key | null) { this.latched = new Set((['up', 'down', 'left', 'right'] as Key[]).filter((k) => k !== allow && this.down.has(k))); this.updateDir4(); }
  private prefAxis: 'x' | 'y' = 'y'; private d4: Key | null = null;
  /** 4-way direction: opposite keys cancel; on a diagonal the axis pressed most recently wins (re-implementation of RM-style feel). */
  private updateDir4() {
    for (const k of [...this.latched]) if (!this.down.has(k)) this.latched.delete(k);
    const dn = (k: Key) => this.down.has(k) && !this.latched.has(k); let x = (dn('right') ? 1 : 0) - (dn('left') ? 1 : 0), y = (dn('down') ? 1 : 0) - (dn('up') ? 1 : 0);
    if (x !== 0 && y !== 0) { if (this.prefAxis === 'x') y = 0; else x = 0; } else if (x !== 0) this.prefAxis = 'y'; else if (y !== 0) this.prefAxis = 'x';
    this.d4 = x > 0 ? 'right' : x < 0 ? 'left' : y > 0 ? 'down' : y < 0 ? 'up' : null;
  }
  dir4(): Key | null { return this.d4; }
}
export const Input = new InputClass();
export function pulse(k: Key) { (Input as any).kb.add(k); setTimeout(() => (Input as any).kb.delete(k), 70); }
