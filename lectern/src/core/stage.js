/**
 * The stage: a fixed 960 × 600 logical canvas, scaled to its container, with three layers
 *   back  (SVG)  grids, axes, shapes, arrows
 *   html  (div)  math (KaTeX), text, matrices
 *   front (SVG)  highlight boxes, braces, pointers drawn over math
 * and one pausable Clock (core/tween.js) that every animation on it runs on.
 *
 * Coordinates: x right, y down, origin top-left, units = logical px (W × H). Every object ("mob", core/mobject.js)
 * is created through the stage so it lands on the right layer and its animations use the stage clock.
 *
 * Type sizes are logical px: minimum 30 for anything the learner must read (a phone shows the stage at ~0.4×).
 */
import { el, svg } from './dom.js';
import { Clock } from './tween.js';
import { Mob, Tex, Text, Group } from './mobject.js';

export const W = 960;
export const H = 600;

/** Semantic colors for the stage (CSS variables from css/tokens.css; they adapt to light and dark). */
export const C = {
  ink: 'var(--lx-ink)',
  muted: 'var(--lx-muted)',
  faint: 'var(--lx-faint)',
  line: 'var(--lx-line)',
  bg: 'var(--lx-stage)',
  blue: 'var(--lx-blue)',
  red: 'var(--lx-red)',
  green: 'var(--lx-green)',
  yellow: 'var(--lx-yellow)',
  purple: 'var(--lx-purple)',
  teal: 'var(--lx-teal)',
  orange: 'var(--lx-orange)',
};
/** Soft fills to pair with C (same names). */
export const FILL = {
  blue: 'var(--lx-blue-bg)',
  red: 'var(--lx-red-bg)',
  green: 'var(--lx-green-bg)',
  yellow: 'var(--lx-yellow-bg)',
  purple: 'var(--lx-purple-bg)',
  teal: 'var(--lx-teal-bg)',
  orange: 'var(--lx-orange-bg)',
  ink: 'var(--lx-ink-bg)',
};

export class Stage {
  /** host: element the stage fills (its width decides the scale; height follows the 16:10 ratio). */
  constructor(host, { label = 'Lecture figure' } = {}) {
    this.W = W;
    this.H = H;
    this.C = C;
    this.FILL = FILL;
    this.el = el('div', { class: 'lx-stage', role: 'img', 'aria-label': label });
    this.inner = el('div', { class: 'lx-stage-inner' });
    this.back = svg('svg', { class: 'lx-layer lx-layer-back', viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true' });
    this.html = el('div', { class: 'lx-layer lx-layer-html' });
    this.front = svg('svg', { class: 'lx-layer lx-layer-front', viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true' });
    this.defs = svg('defs');
    this.back.append(this.defs);
    this.inner.append(this.back, this.html, this.front);
    this.el.append(this.inner);
    host.append(this.el);
    this.k = 1;
    this.mobs = new Set();
    this.clock = new Clock();
    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(this.el);
    this.fit();
  }

  fit() {
    const width = this.el.clientWidth || W;
    this.k = width / W;
    this.inner.style.transform = `scale(${this.k})`;
  }

  /** Clears every object and starts a fresh clock (a new beat). Tweens still awaited by old step code resolve at once. */
  reset() {
    this.clock.kill();
    this.clock = new Clock();
    for (const mob of this.mobs) mob.node.remove();
    this.mobs.clear();
    this.back.replaceChildren(this.defs);
    this.defs.replaceChildren();
    this.html.replaceChildren();
    this.front.replaceChildren();
  }

  destroy() {
    this.clock.kill();
    this.resize.disconnect();
    this.el.remove();
  }

  /** Registers a mob (constructors call this). */
  adopt(mob) {
    this.mobs.add(mob);
    return mob;
  }

  // ---- factories (the common mobs; components add their own: s.matrix(...), s.plane(...) via mixins) ----

  /** KaTeX math. opts: x, y, size (default 44), color, anchor [ax, ay], opacity, display (default true). */
  tex(latex, opts) {
    return new Tex(this, latex, opts);
  }

  /** Plain text with inline $math$. opts: x, y, size (default 34), color, weight, font ('sans' | 'serif'), width (wraps), align. */
  text(str, opts) {
    return new Text(this, str, opts);
  }

  /** A group that moves and fades as one (children keep their own positions relative to the stage). */
  group(...mobs) {
    return new Group(this, mobs.flat());
  }

  /** Wrap an arbitrary SVG element (built with core/dom.js `svg`) as a mob on the back (default) or front layer. */
  svgMob(node, opts = {}) {
    return new Mob(this, node, { layer: 'back', ...opts });
  }

  /** Wrap an HTML element as a mob. */
  htmlMob(node, opts = {}) {
    return new Mob(this, node, { layer: 'html', ...opts });
  }

  // ---- timing ----

  /** Runs animations together: s.all(a.fadeIn(), b.write()) (arrays are flattened, falsy skipped). */
  all(...anims) {
    return Promise.all(anims.flat(Infinity).filter(Boolean));
  }

  /** Clock time (pauses with the narration, skipped when seeking). */
  wait(ms) {
    return this.clock.wait(ms);
  }

  /** Starts animations one after another, each `gap` ms after the previous started (not finished). */
  stagger(fns, gap = 90) {
    return Promise.all(fns.map((fn, i) => this.clock.wait(i * gap).then(fn)));
  }

  get instant() {
    return this.clock.instant;
  }

  /** Stage units per CSS px (for converting getBoundingClientRect results). */
  toStage(rect) {
    const box = this.inner.getBoundingClientRect();
    return {
      x: (rect.left - box.left) / this.k,
      y: (rect.top - box.top) / this.k,
      w: rect.width / this.k,
      h: rect.height / this.k,
    };
  }
}

/** Registers extra factories on Stage.prototype: extend({ matrix(rows, opts) { return new MatrixMob(this, rows, opts) } }). */
export function extend(methods) {
  for (const [name, fn] of Object.entries(methods)) {
    if (name in Stage.prototype) throw new Error(`Stage.${name} already exists`);
    Stage.prototype[name] = fn;
  }
}
