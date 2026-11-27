/**
 * Shared stage helpers for both courses (cards, stamps, scratch panes, strike-outs, rings, symbol rows). Styles are
 * inline (tokens only) so a course needs no extra stylesheet. Every animation runs on the stage clock.
 *
 *   s.defCard({ x, y, width, title, body | tex, kind = 'definition', size = 30, visible }) → DefCard
 *       kind: 'definition' (purple) | 'theorem' (blue) | 'warning' (red) | 'example' (teal) | 'note' (ink).
 *       title: the heading (default the kind's name: "Definition"; false = none). body: text with $math$; tex: pure
 *       TeX instead. Mark parts with \part{name}{…}. reveal() (frame fades in, body is written), part(name),
 *       partBox(name), color(name, c)
 *   s.stamp(text, { x, y, color = 'red', rotate = -6, size = 32, visible = false }) → Stamp: slam() lands it
 *   s.scratch({ x, y, w, h, title = 'Scratch work', size = 30, visible }) → Scratch (anchored top-left):
 *       reveal(), add(content, { color, indent, tex }) → Part, retitle(text), clear()
 *   s.strike(target, { color = 'red', width = 4, pad = 8, dim = true }) → Part: a line drawn through the target
 *   s.ring(target, { color = 'yellow', pad = 6, width = 3.5, shape = 'ellipse' | 'box' }) → Part: drawn around it
 *   s.symbols([tex, …], { x, y, gap = 0, size = 44, color, visible }) → array of Tex mobs in a row centered on x
 *       (each its own mob, so symbols can travel); the array has .group (a Group of them)
 *
 * Targets (strike, ring): a mob (anything with box()), a plain box { x, y, w, h }, a DOM element, a Part
 * (proof line, element…), or [mob, 'partName'] for a named part of a Tex / DefCard (partBox).
 */
import { el, svg } from '../core/dom.js';
import { ease, lerp } from '../core/tween.js';
import { extend, C } from '../core/stage.js';
import { Mob, inlineMath } from '../core/mobject.js';
import { tween, appear, vanish, paint, tone, Part, renderMath, nodesBox } from './logic.js';

/** Smallest text size anything readable may end up at (logical px; a phone shows the stage at ~0.4×). */
const MIN_TEXT = 28;
/** The stage's safe area: 24 px margins on each side of the 960 px stage. */
const MARGIN = 24;
const SAFE_W = 960 - 2 * MARGIN;

const KINDS = {
  definition: { color: 'purple', label: 'Definition' },
  theorem: { color: 'blue', label: 'Theorem' },
  warning: { color: 'red', label: 'Careful' },
  example: { color: 'teal', label: 'Example' },
  note: { color: 'ink', label: 'Note' },
};

/** Stage box of a target (see header). */
export function boxOfTarget(stage, target) {
  let b = null;
  if (Array.isArray(target)) b = target[0].partBox(target[1]);
  else if (target instanceof Element) b = nodesBox(stage, target);
  else if (target && typeof target.box === 'function') b = target.box();
  else if (target?.node instanceof Element) b = nodesBox(stage, target.node);
  else if (target && 'x' in target && 'w' in target) b = target;
  if (!b) throw new Error('lectern: cannot find the box of that target');
  return { x: b.x, y: b.y, w: b.w, h: b.h, cx: b.cx ?? b.x + b.w / 2, cy: b.cy ?? b.y + b.h / 2 };
}

/** Clip-reveal a node left to right. */
function writeIn(clock, node, duration) {
  return tween(
    clock,
    (t) => {
      node.style.opacity = '1';
      node.style.clipPath = t >= 1 ? '' : `inset(-20% ${(1 - t) * 102}% -20% -2%)`;
    },
    { duration, ease: ease.inOut },
  );
}

// ---------------------------------------------------------------- definition / theorem card

export class DefCard extends Mob {
  constructor(stage, { x = 480, y = 300, width, title, body = '', tex, kind = 'definition', size = 30, anchor = [0.5, 0.5], ...opts } = {}) {
    const k = KINDS[kind] ?? KINDS.definition;
    const { fg, bg } = tone(k.color);
    const heading = title === false || title === '' ? null : el('div', { html: inlineMath(title ?? k.label), style: { fontFamily: 'var(--sans)', fontWeight: '600', fontSize: `max(${MIN_TEXT}px, 0.8em)`, letterSpacing: '0.02em', color: fg, marginBottom: '0.2em' } });
    const content = el('div', { html: tex !== undefined ? renderMath(tex, true) : renderMath(body, false), style: { lineHeight: '1.35' } });
    const node = el(
      'div',
      {
        class: ['lx-defcard', `lx-defcard-${kind}`],
        style: {
          boxSizing: 'border-box',
          width: width ? `${width}px` : 'max-content',
          maxWidth: `${SAFE_W}px`,
          padding: '0.45em 0.8em 0.55em',
          border: `3px solid ${fg}`,
          borderRadius: '14px',
          background: bg,
          color: 'var(--lx-ink)',
          fontFamily: 'var(--serif)',
          fontSize: `${size}px`,
          whiteSpace: 'normal',
        },
      },
      heading,
      content,
    );
    super(stage, node, { x, y, anchor, ...opts });
    this.content = content;
    this.heading = heading;
    this.size = size;
    this.fit();
  }

  /**
   * A body wider than the card (long unbreakable TeX): first scale it down, but never below 28 logical px; if it still
   * overflows, widen the card around its anchor up to the stage's safe width (912, inside the 24 px margins); as a last
   * resort let it wrap anywhere. Warns in the console whenever it had to act.
   */
  fit() {
    const c = this.content;
    const room = c.clientWidth;
    const need = c.scrollWidth;
    if (!room || need <= room + 1) return;
    const k = Math.max(Math.min(1, MIN_TEXT / this.size), room / need);
    if (k < 1) c.style.fontSize = `${k.toFixed(3)}em`;
    let over = c.scrollWidth - c.clientWidth;
    let widened = 0;
    if (over > 1) {
      const w = this.node.offsetWidth;
      const ax = this.anchor[0];
      const x = this.state.x;
      const fits = Math.min(SAFE_W, ax > 0 ? (x - MARGIN) / ax : Infinity, ax < 1 ? (this.stage.W - MARGIN - x) / (1 - ax) : Infinity);
      const target = Math.min(fits, w + over + 2);
      if (target > w + 0.5) {
        this.node.style.width = `${target.toFixed(1)}px`;
        widened = target - w;
      }
      over = c.scrollWidth - c.clientWidth;
    }
    if (over > 1) c.style.overflowWrap = 'anywhere';
    console.warn(
      `lectern defCard: body ${Math.round(need)}px wide in a ${Math.round(room)}px card` +
        (k < 1 ? `; scaled to ${Math.round(k * this.size)}px` : '') +
        (widened ? `; card widened by ${Math.round(widened)}px` : '') +
        (over > 1 ? '; still too wide, so it wraps: widen the card or break the TeX' : '') +
        '.',
    );
  }

  /** Card fades in, then its body is written left to right. */
  reveal({ duration = 1100, delay = 0 } = {}) {
    const clock = this.clock;
    const content = this.content;
    content.style.opacity = '0';
    if (this.heading) this.heading.style.opacity = '0';
    let from = this.state.opacity;
    return tween(clock, (t) => this.set({ opacity: lerp(from, 1, t) }), { duration: 300, delay, start: () => (from = this.state.opacity) }).then(() =>
      Promise.all([this.heading && appear(clock, this.heading, { dy: 0, duration: 300 }), writeIn(clock, content, duration)]),
    );
  }

  part(name) {
    return [...this.node.querySelectorAll(`.p-${name}`)];
  }

  partBox(name) {
    return nodesBox(this.stage, this.part(name));
  }

  /** Colors a named part (animated). */
  color(name, color, opts) {
    return paint(this.clock, this.part(name), { color: tone(color).fg }, opts);
  }
}

// ---------------------------------------------------------------- stamp

export class Stamp extends Mob {
  constructor(stage, text, { x = 480, y = 300, color = 'red', rotate = -6, size = 32, visible = false, ...opts } = {}) {
    const node = el('div', {
      class: 'lx-stamp',
      html: inlineMath(String(text)),
      style: {
        color: tone(color).fg,
        fontFamily: 'var(--sans)',
        fontWeight: '600',
        fontSize: `${size}px`,
        whiteSpace: 'nowrap',
        border: '3px solid currentColor',
        borderRadius: '10px',
        padding: '0.05em 0.45em',
        letterSpacing: '0.01em',
      },
    });
    super(stage, node, { x, y, rotate, visible, ...opts });
    this.base = this.state.scale;
  }

  /** Lands from a little larger, with a small overshoot. */
  slam({ duration = 420, delay = 0 } = {}) {
    const base = this.base;
    return tween(this.clock, (t) => this.set({ scale: lerp(base * 1.45, base, t), opacity: Math.min(1, Math.max(0, t)) }), {
      duration,
      delay,
      ease: ease.back,
      start: () => this.set({ scale: base * 1.45, opacity: 0 }),
    });
  }
}

// ---------------------------------------------------------------- scratch pane

export class Scratch extends Mob {
  /** A dashed, muted pane (top-left at x, y) whose lines stack downwards; it scrolls when they overflow. */
  constructor(stage, { x = 40, y = 80, w = 880, h = 480, title = 'Scratch work', size = 30, ...opts } = {}) {
    const titleNode = el('div', { html: inlineMath(title), style: { color: 'var(--lx-muted)', fontStyle: 'italic', fontSize: '0.95em', marginBottom: '0.25em' } });
    const list = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.2em' } });
    const view = el('div', { style: { position: 'relative', flex: '1 1 auto', overflow: 'hidden', minHeight: '0' } }, list);
    const node = el(
      'div',
      {
        class: 'lx-scratch',
        style: {
          boxSizing: 'border-box',
          width: `${w}px`,
          height: `${h}px`,
          display: 'flex',
          flexDirection: 'column',
          padding: '0.4em 0.8em',
          border: '2px dashed var(--lx-muted)',
          borderRadius: '16px',
          color: 'var(--lx-ink)',
          fontFamily: 'var(--serif)',
          fontSize: `${size}px`,
          lineHeight: '1.35',
          whiteSpace: 'normal',
        },
      },
      titleNode,
      view,
    );
    super(stage, node, { x, y, anchor: [0, 0], ...opts });
    this.titleNode = titleNode;
    this.list = list;
    this.view = view;
    this.offset = 0;
  }

  /** The pane fades in, then its title. */
  reveal({ duration = 450, delay = 0 } = {}) {
    const c = this.clock;
    this.titleNode.style.opacity = '0';
    let from = this.state.opacity;
    return tween(c, (t) => this.set({ opacity: lerp(from, 1, t) }), { duration, delay, start: () => (from = this.state.opacity) }).then(() => appear(c, this.titleNode, { dy: 0, duration: 300 }));
  }

  /** Writes a line of scratch work (TeX or text with $math$; colored e.g. 'blue' forwards, 'green' backwards). */
  add(content, { color, indent = 0, tex, duration } = {}) {
    const c = this.clock;
    const line = el('div', { html: renderMath(content, tex), style: { color: color ? tone(color).fg : undefined, paddingLeft: indent ? `${indent * 1.4}em` : undefined, opacity: '0' } });
    this.list.append(line);
    const d = duration ?? Math.min(1200, 400 + line.textContent.length * 16);
    return new Part(line, this.scrollFor(c, line).then(() => writeIn(c, line, d)), this);
  }

  scrollFor(c, line) {
    const bottom = line.offsetTop + line.offsetHeight;
    const target = Math.max(0, bottom - this.view.clientHeight + 4);
    if (target <= this.offset + 0.5) return Promise.resolve();
    let from = this.offset;
    return tween(
      c,
      (t) => {
        this.offset = lerp(from, target, t);
        this.list.style.transform = `translateY(${-this.offset}px)`;
      },
      { duration: 450, ease: ease.inOut, start: () => (from = this.offset) },
    );
  }

  /** Crossfades the title. */
  retitle(text, { duration = 500 } = {}) {
    const node = this.titleNode;
    return tween(
      this.clock,
      (t) => {
        if (t < 0.5) node.style.opacity = String(1 - 2 * t);
        else {
          if (node.dataset.text !== text) {
            node.innerHTML = inlineMath(text);
            node.dataset.text = text;
          }
          node.style.opacity = String(2 * t - 1);
        }
      },
      { duration, ease: ease.linear },
    );
  }

  /** Fades every line out. */
  clear(opts) {
    const rows = [...this.list.children];
    return vanish(this.clock, rows, { ...opts, remove: true }).then(() => {
      this.offset = 0;
      this.list.style.transform = '';
    });
  }
}

// ---------------------------------------------------------------- strike, ring, symbols

/** A line drawn through any target (front layer); a mob target dims to muted. */
function strike(stage, target, { color = 'red', width = 4, pad = 8, dim = true, duration = 550, delay = 0 } = {}) {
  const c = stage.clock;
  const b = boxOfTarget(stage, target);
  const x1 = b.x - pad;
  const x2 = b.x + b.w + pad;
  const line = svg('line', { x1, y1: b.cy, x2: x1, y2: b.cy, 'stroke-width': width, 'stroke-linecap': 'round', style: { stroke: tone(color).fg } });
  const mob = stage.svgMob(svg('g', {}, line), { layer: 'front', x: 0, y: 0 });
  const anims = [tween(c, (t) => line.setAttribute('x2', lerp(x1, x2, t).toFixed(1)), { duration, delay, ease: ease.inOut })];
  if (dim) {
    if (typeof target?.recolor === 'function') anims.push(target.recolor(C.muted, { delay }));
    else {
      const node = target instanceof Element ? target : target?.node instanceof Element ? target.node : null;
      if (node) anims.push(paint(c, node, { color: C.muted }, { delay }));
    }
  }
  const part = new Part(mob.node, Promise.all(anims), mob);
  part.mob = mob;
  return part;
}

/** Circles a target: an ellipse (or a rounded box) drawn around it on the front layer. */
function ring(stage, target, { color = 'yellow', pad = 6, width = 3.5, shape = 'ellipse', duration = 550, delay = 0 } = {}) {
  const c = stage.clock;
  const b = boxOfTarget(stage, target);
  const style = { stroke: tone(color).fg, fill: 'none' };
  let node;
  let len;
  if (shape === 'box') {
    const w = b.w + 2 * pad;
    const h = b.h + 2 * pad;
    const r = Math.min(16, h / 2);
    node = svg('rect', { x: b.x - pad, y: b.y - pad, width: w, height: h, rx: r, 'stroke-width': width, style });
    len = 2 * (w + h);
  } else {
    // fitted to the box (not circumscribed): a long TeX piece gets a flat ellipse that stays clear of its neighbours
    const rx = b.w / 2 + pad + 4;
    const ry = b.h / 2 + pad;
    node = svg('ellipse', { cx: b.cx, cy: b.cy, rx, ry, 'stroke-width': width, style });
    len = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  }
  const mob = stage.svgMob(svg('g', {}, node), { layer: 'front', x: 0, y: 0 });
  node.style.strokeDasharray = `${len} ${len}`;
  node.style.strokeDashoffset = String(len);
  const done = tween(
    c,
    (t) => {
      node.style.strokeDashoffset = String(len * (1 - t));
      if (t >= 1) {
        node.style.strokeDasharray = '';
        node.style.strokeDashoffset = '';
      }
    },
    { duration, delay, ease: ease.inOut },
  );
  const part = new Part(mob.node, done, mob);
  part.mob = mob;
  return part;
}

/** Tex pieces in a row centered on x (each its own mob, anchored at its left middle). */
function symbols(stage, list, { x = 480, y = 300, gap = 0, size = 44, color, visible = true } = {}) {
  const mobs = list.map((tex) => stage.tex(tex, { y, size, color, visible, anchor: [0, 0.5] }));
  const ws = mobs.map((m) => m.node.offsetWidth);
  let left = x - (ws.reduce((a, b) => a + b, 0) + gap * (mobs.length - 1)) / 2;
  mobs.forEach((m, i) => {
    m.set({ x: left });
    left += ws[i] + gap;
  });
  return Object.assign(mobs, { group: stage.group(mobs) });
}

extend({
  defCard(opts) {
    return new DefCard(this, opts);
  },
  stamp(text, opts) {
    return new Stamp(this, text, opts);
  },
  scratch(opts) {
    return new Scratch(this, opts);
  },
  strike(target, opts) {
    return strike(this, target, opts);
  },
  ring(target, opts) {
    return ring(this, target, opts);
  },
  symbols(list, opts) {
    return symbols(this, list, opts);
  },
});
