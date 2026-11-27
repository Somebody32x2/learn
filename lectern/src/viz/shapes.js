/**
 * Basic SVG shapes for the stage, plus the building blocks plane.js and space.js use for their objects.
 *
 * Every shape is a Mob (core/mobject.js) whose <g> sits at x: 0, y: 0, so its geometry is in absolute stage
 * coordinates and the mob's x, y are an offset. Scale and rotate act about the shape's center (`pivot`), and
 * `moveTo(x, y)` moves that center to (x, y). Shapes go on the back SVG layer unless `layer: 'front'`.
 *
 * Factories (registered on Stage with extend):
 *   s.line(x1, y1, x2, y2, opts)        → LineMob      .setEnds(x1, y1, x2, y2, { duration })  (animated)
 *   s.arrow(x1, y1, x2, y2, opts)       → ArrowMob     .setEnds(…) animated; .draw() grows it from its tail
 *   s.rect(x, y, w, h, opts)            → RectMob      .resize(x, y, w, h, { duration })        opts.radius
 *   s.circle(cx, cy, r, opts)           → CircleMob    .resize(cx, cy, r, { duration })
 *   s.dot(x, y, opts)                   → DotMob       (filled, r = 8); .draw() pops it in
 *   s.path(d, opts)                     → PathMob      .setPath(d)
 *   s.polygon([[x, y], …], opts)        → PolygonMob   .morph(points, { duration }) (same vertex count)
 *   s.brace(x1, y1, x2, y2, { label, side, depth, size })  → BraceMob (curly brace + TeX label, .label)
 *   s.surround(target, { color, pad, radius })            → SurroundMob (front, rounded box; .retarget(target))
 *   s.underline(target, { color, gap })                   → LineMob (front)
 * Common opts: color (default C.ink; strokes use currentColor so mob.recolor works), width (stroke),
 * fill, dash (true | '6 4'), opacity, visible, layer.
 *
 * Building blocks (exported, used by plane.js / space.js):
 *   Shape                 base class: pivot-aware render, `attach(mob, x, y)` (HTML labels that follow the
 *                         shape's offset and opacity), nesting under a parent shape (`parent` opt: the
 *                         parent's `content` <g> and `kids` set; opacity multiplies down the chain)
 *   VectorBase, PointBase, ModelPolygon, ModelLabel
 *                         objects in a model space; the owner provides `project(p, obj) → [sx, sy]`,
 *                         `content`, `kids`; each object has `redraw()` and `modelCenter()`
 *   soft(color, pct)      a translucent fill from a stage color (color-mix of the token)
 *   boxOf(target)         a mob's box() or a plain { x, y, w, h } box, with cx, cy
 *   clipSeg(p, q, rect)   Liang–Barsky clip of segment p→q to rect { x, y, w, h } → [x1, y1, x2, y2] | null
 *   drawParts(clock, elements, { duration, delay })  stroke-draw arbitrary SVG elements
 *   anchorToward(dx, dy), setAnchor(mob, anchor)      place a label just beyond a point in a direction
 */
import { Mob } from '../core/mobject.js';
import { svg } from '../core/dom.js';
import { extend, C } from '../core/stage.js';
import { ease, lerp } from '../core/tween.js';

// ---------- helpers ----------

export const soft = (color, pct = 18) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
export const nums = (p) => p.map((v) => Number(v));
const clamp01 = (t) => Math.max(0, Math.min(1, t));

export function boxOf(target) {
  const b = typeof target?.box === 'function' ? target.box() : target;
  return { x: b.x, y: b.y, w: b.w, h: b.h, cx: b.cx ?? b.x + b.w / 2, cy: b.cy ?? b.y + b.h / 2 };
}

function dashArray(dash, w) {
  if (!dash) return null;
  if (dash === true) return `${w * 2.5} ${w * 2}`;
  return Array.isArray(dash) ? dash.join(' ') : String(dash);
}

/** Stroke/fill attributes on an SVG primitive (stroke follows the mob's CSS color). */
export function paint(node, { width = 4, fill = 'none', dash, stroke = 'currentColor' } = {}) {
  node.setAttribute('stroke', stroke);
  node.setAttribute('stroke-width', width);
  node.setAttribute('fill', fill);
  node.setAttribute('stroke-linecap', 'round');
  node.setAttribute('stroke-linejoin', 'round');
  const d = dashArray(dash, width);
  if (d) node.setAttribute('stroke-dasharray', d);
  return node;
}

/** Anchor for a label placed beyond a point in direction (dx, dy): rightward → [0, 0.5], up → [0.5, 1]. */
export function anchorToward(dx, dy) {
  const L = Math.hypot(dx, dy) || 1;
  const f = (v) => 0.5 - 0.5 * Math.max(-1, Math.min(1, (v / L) * 1.42));
  return [f(dx), f(dy)];
}

export function setAnchor(mob, anchor) {
  if (mob.anchor[0] === anchor[0] && mob.anchor[1] === anchor[1]) return;
  mob.anchor = anchor;
  mob.node.style.transformOrigin = `${anchor[0] * 100}% ${anchor[1] * 100}%`;
  mob.render();
}

/** Liang–Barsky: the part of segment p→q inside rect, or null. */
export function clipSeg([x1, y1], [x2, y2], { x, y, w, h }) {
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - x, x + w - x1, y1 - y, y + h - y1];
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-12) {
      if (q[i] < 0) return null;
      continue;
    }
    const r = q[i] / p[i];
    if (p[i] < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
}

/** Stroke-draws SVG elements along their length (Mob.draw for a chosen subset). End state is set synchronously at t = 1. */
export function drawParts(clock, parts, { duration = 900, delay = 0 } = {}) {
  const lengths = parts.map((p) => {
    try {
      return p.getTotalLength() || 1;
    } catch {
      return 1;
    }
  });
  parts.forEach((p, i) => {
    p.style.strokeDasharray = `${lengths[i]}`;
    p.style.strokeDashoffset = `${lengths[i]}`;
  });
  return clock.tween({
    duration,
    delay,
    ease: ease.inOut,
    update: (t) => {
      if (t >= 1) {
        parts.forEach((p) => {
          p.style.strokeDasharray = '';
          p.style.strokeDashoffset = '';
        });
        return;
      }
      parts.forEach((p, i) => (p.style.strokeDashoffset = `${lengths[i] * (1 - t)}`));
    },
  });
}

// ---------- base ----------

export class Shape extends Mob {
  constructor(stage, node, { layer = 'back', color = C.ink, parent = null, x = 0, y = 0, scale, rotate, opacity, visible = true } = {}) {
    node.classList.add('lx-shape');
    node.style.color = color;
    super(stage, node, { layer, x, y, scale, rotate, opacity, visible });
    this.color = color;
    this.parent = parent;
    if (parent) {
      parent.content.append(node);
      parent.kids.add(this);
    }
    this.render();
  }

  render() {
    const { x, y, scale, rotate, opacity } = this.state;
    const [px, py] = this.pivot || [0, 0];
    this.node.setAttribute(
      'transform',
      scale === 1 && rotate === 0 ? `translate(${x} ${y})` : `translate(${x + px} ${y + py}) rotate(${rotate}) scale(${scale}) translate(${-px} ${-py})`,
    );
    this.node.style.opacity = opacity;
    this.node.style.visibility = opacity <= 0.001 ? 'hidden' : '';
    this.sync();
  }

  /**
   * Keeps attached HTML mobs (labels) at their place + this shape's offset. Their shown opacity is their own
   * opacity × this shape's (and its parents') opacity × the entry's alpha, so `label.fadeOut()` sticks.
   * A parent with `clampPoint(x, y)` (the plane) keeps its kids' label anchors inside its area.
   */
  sync() {
    if (this.att?.length) {
      let x = 0, y = 0, o = 1;
      for (let m = this; m; m = m.parent) {
        x += m.state.x;
        y += m.state.y;
        o *= m.state.opacity;
      }
      const clamp = this.parent?.clampPoint?.bind(this.parent);
      for (const a of this.att) {
        const [ax, ay] = clamp ? clamp(a.x, a.y) : [a.x, a.y];
        a.factor = o * a.alpha;
        a.mob.set({ x: ax + x, y: ay + y });
      }
    }
    if (this.kids) for (const k of this.kids) k.sync();
  }

  /** Attaches a mob (usually a Tex label) at stage point (x, y); returns the entry { mob, x, y, alpha } (mutable). */
  attach(mob, x = 0, y = 0, alpha = 1) {
    this.att ??= [];
    const entry = { mob, x, y, alpha, factor: 1 };
    const base = Object.getPrototypeOf(mob).render;
    mob.render = function () {
      base.call(this);
      const o = this.state.opacity * entry.factor;
      this.node.style.opacity = o;
      this.node.style.visibility = o <= 0.001 ? 'hidden' : '';
    };
    this.att.push(entry);
    this.sync();
    return entry;
  }

  /** Moves the shape's center to (x, y). */
  moveTo(x, y, opts) {
    const [px, py] = this.pivot || [0, 0];
    return this.animate({ x: x - px, y: y - py }, opts);
  }

  remove() {
    super.remove();
    this.att?.forEach((a) => a.mob.remove());
    this.parent?.kids?.delete(this);
    if (this.kids) [...this.kids].forEach((k) => k.remove());
  }
}

function tweenEnds(mob, to, { duration = 700, delay = 0, ease: e = ease.inOut } = {}) {
  let from = null;
  return mob.clock.tween({
    duration,
    delay,
    ease: e,
    start: () => (from = mob.ends.slice()),
    update: (t) => {
      from ??= mob.ends.slice();
      mob.setEndsNow(...from.map((v, i) => lerp(v, to[i], t)));
    },
  });
}

// ---------- primitives ----------

export class LineMob extends Shape {
  constructor(stage, x1, y1, x2, y2, opts = {}) {
    super(stage, svg('g', { class: 'lx-line' }), opts);
    this.el = paint(svg('line'), { width: opts.width ?? 4, dash: opts.dash });
    this.node.append(this.el);
    this.setEndsNow(x1, y1, x2, y2);
  }
  setEndsNow(x1, y1, x2, y2) {
    this.ends = [x1, y1, x2, y2];
    this.el.setAttribute('x1', x1);
    this.el.setAttribute('y1', y1);
    this.el.setAttribute('x2', x2);
    this.el.setAttribute('y2', y2);
    this.pivot = [(x1 + x2) / 2, (y1 + y2) / 2];
    this.render();
    return this;
  }
  /** Animates the endpoints. */
  setEnds(x1, y1, x2, y2, opts) {
    return tweenEnds(this, [x1, y1, x2, y2], opts);
  }
}

export class ArrowMob extends Shape {
  constructor(stage, x1, y1, x2, y2, opts = {}) {
    super(stage, svg('g', { class: 'lx-arrow' }), opts);
    const w = opts.width ?? 4;
    this.headLen = opts.head ?? Math.max(16, w * 3.6);
    this.shaft = paint(svg('line'), { width: w, dash: opts.dash });
    this.tip = paint(svg('polygon'), { width: 1.5, fill: 'currentColor' });
    this.node.append(this.shaft, this.tip);
    this.setEndsNow(x1, y1, x2, y2);
  }
  setEndsNow(x1, y1, x2, y2) {
    this.ends = [x1, y1, x2, y2];
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    const ux = L ? dx / L : 1, uy = L ? dy / L : 0;
    const hl = Math.min(this.headLen, L * 0.45);
    const hw = hl * 0.5;
    const bx = x2 - ux * hl, by = y2 - uy * hl;
    const tiny = L < 0.5;
    this.shaft.setAttribute('x1', x1);
    this.shaft.setAttribute('y1', y1);
    this.shaft.setAttribute('x2', tiny ? x1 : bx + ux * 0.5);
    this.shaft.setAttribute('y2', tiny ? y1 : by + uy * 0.5);
    this.shaft.style.display = tiny ? 'none' : '';
    this.tip.style.display = tiny ? 'none' : '';
    this.tip.setAttribute('points', `${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`);
    this.pivot = [(x1 + x2) / 2, (y1 + y2) / 2];
    this.render();
    return this;
  }
  setEnds(x1, y1, x2, y2, opts) {
    return tweenEnds(this, [x1, y1, x2, y2], opts);
  }
  /** Grows the arrow from its tail (manim GrowArrow). */
  draw({ duration = 800, delay = 0 } = {}) {
    const [x1, y1, x2, y2] = this.ends;
    this.setEndsNow(x1, y1, x1, y1);
    this.set({ opacity: 1 });
    return this.clock.tween({ duration, delay, ease: ease.inOut, update: (t) => this.setEndsNow(x1, y1, lerp(x1, x2, t), lerp(y1, y2, t)) });
  }
}

export class RectMob extends Shape {
  constructor(stage, x, y, w, h, opts = {}) {
    super(stage, svg('g', { class: 'lx-rect' }), opts);
    this.el = paint(svg('rect', { rx: opts.radius ?? 0 }), { width: opts.width ?? 3, fill: opts.fill ?? 'none', dash: opts.dash });
    this.node.append(this.el);
    this.setRectNow(x, y, w, h);
  }
  setRectNow(x, y, w, h) {
    this.rect = [x, y, w, h];
    this.el.setAttribute('x', x);
    this.el.setAttribute('y', y);
    this.el.setAttribute('width', Math.max(0, w));
    this.el.setAttribute('height', Math.max(0, h));
    this.pivot = [x + w / 2, y + h / 2];
    this.render();
    return this;
  }
  /** Animates position and size. */
  resize(x, y, w, h, { duration = 600, delay = 0, ease: e = ease.inOut } = {}) {
    const to = [x, y, w, h];
    let from = null;
    return this.clock.tween({
      duration,
      delay,
      ease: e,
      start: () => (from = this.rect.slice()),
      update: (t) => {
        from ??= this.rect.slice();
        this.setRectNow(...from.map((v, i) => lerp(v, to[i], t)));
      },
    });
  }
}

export class CircleMob extends Shape {
  constructor(stage, cx, cy, r, opts = {}) {
    super(stage, svg('g', { class: 'lx-circle' }), opts);
    this.el = paint(svg('circle'), { width: opts.width ?? 3, fill: opts.fill ?? 'none', dash: opts.dash });
    this.node.append(this.el);
    this.setCircleNow(cx, cy, r);
  }
  setCircleNow(cx, cy, r) {
    this.circle = [cx, cy, r];
    this.el.setAttribute('cx', cx);
    this.el.setAttribute('cy', cy);
    this.el.setAttribute('r', Math.max(0, r));
    this.pivot = [cx, cy];
    this.render();
    return this;
  }
  resize(cx, cy, r, { duration = 600, delay = 0, ease: e = ease.inOut } = {}) {
    const to = [cx, cy, r];
    let from = null;
    return this.clock.tween({
      duration,
      delay,
      ease: e,
      start: () => (from = this.circle.slice()),
      update: (t) => {
        from ??= this.circle.slice();
        this.setCircleNow(...from.map((v, i) => lerp(v, to[i], t)));
      },
    });
  }
}

export class DotMob extends CircleMob {
  constructor(stage, x, y, { r = 8, ...opts } = {}) {
    super(stage, x, y, r, { ...opts, width: 0, fill: 'currentColor' });
    this.r = r;
    this.el.setAttribute('stroke', 'none');
  }
  /** Pops in (fades in while settling from a slightly larger size). */
  draw({ duration = 450, delay = 0 } = {}) {
    this.set({ opacity: 0, scale: 1.6 });
    return this.animate({ opacity: 1, scale: 1 }, { duration, delay, ease: ease.out });
  }
}

export class PathMob extends Shape {
  constructor(stage, d, opts = {}) {
    super(stage, svg('g', { class: 'lx-path' }), opts);
    this.el = paint(svg('path'), { width: opts.width ?? 4, fill: opts.fill ?? 'none', dash: opts.dash });
    this.node.append(this.el);
    this.setPath(d);
  }
  setPath(d) {
    this.d = d;
    this.el.setAttribute('d', d);
    try {
      const b = this.el.getBBox();
      this.pivot = [b.x + b.width / 2, b.y + b.height / 2];
    } catch {
      this.pivot = [0, 0];
    }
    this.render();
    return this;
  }
}

export class PolygonMob extends Shape {
  constructor(stage, points, opts = {}) {
    super(stage, svg('g', { class: 'lx-polygon' }), opts);
    this.el = paint(svg('polygon'), { width: opts.width ?? 3, fill: opts.fill ?? 'none', dash: opts.dash });
    this.node.append(this.el);
    this.setPoints(points);
  }
  setPoints(points) {
    this.points = points.map((p) => [p[0], p[1]]);
    this.el.setAttribute('points', this.points.map((p) => `${p[0]},${p[1]}`).join(' '));
    const n = this.points.length || 1;
    this.pivot = [this.points.reduce((s, p) => s + p[0], 0) / n, this.points.reduce((s, p) => s + p[1], 0) / n];
    this.render();
    return this;
  }
  /** Animates every vertex to `points` (same count). */
  morph(points, { duration = 700, delay = 0, ease: e = ease.inOut } = {}) {
    let from = null;
    return this.clock.tween({
      duration,
      delay,
      ease: e,
      start: () => (from = this.points.map((p) => p.slice())),
      update: (t) => {
        from ??= this.points.map((p) => p.slice());
        this.setPoints(from.map((p, i) => [lerp(p[0], points[i][0], t), lerp(p[1], points[i][1], t)]));
      },
    });
  }
}

/** Curly brace along x1,y1 → x2,y2 bulging to `side`, with an optional TeX label at its tip. */
export class BraceMob extends Shape {
  constructor(stage, x1, y1, x2, y2, { label, side, depth = 18, size = 34, labelColor, width = 3, color = C.ink, ...opts } = {}) {
    super(stage, svg('g', { class: 'lx-brace' }), { color, ...opts });
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    let s = 1;
    const want = { below: [0, 1], above: [0, -1], right: [1, 0], left: [-1, 0] }[side];
    if (want) s = -uy * want[0] + ux * want[1] >= 0 ? 1 : -1;
    else if (typeof side === 'number') s = side < 0 ? -1 : 1;
    const nx = -uy * s, ny = ux * s;
    const h = depth, hh = h / 2, m = L / 2, a = Math.min(h * 0.9, L / 4);
    const d = `M0 0 Q0 ${hh} ${a} ${hh} L${m - a} ${hh} Q${m} ${hh} ${m} ${h} Q${m} ${hh} ${m + a} ${hh} L${L - a} ${hh} Q${L} ${hh} ${L} 0`;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    this.el = paint(svg('path', { d, transform: `translate(${x1} ${y1}) rotate(${angle}) scale(1 ${s})` }), { width });
    this.node.append(this.el);
    this.pivot = [(x1 + x2) / 2 + nx * hh, (y1 + y2) / 2 + ny * hh];
    this.tipPoint = [(x1 + x2) / 2 + nx * h, (y1 + y2) / 2 + ny * h];
    this.label = null;
    if (label) {
      const gap = 10;
      this.label = stage.tex(label, { size, color: labelColor ?? color, anchor: anchorToward(nx, ny) });
      this.labelAtt = this.attach(this.label, this.tipPoint[0] + nx * gap, this.tipPoint[1] + ny * gap);
    }
    this.render();
  }
  /** Draws the brace, then fades the label in. */
  draw({ duration = 800, delay = 0 } = {}) {
    const att = this.labelAtt;
    if (att) att.alpha = 0;
    const drawn = super.draw({ duration, delay });
    if (!att) return drawn;
    const fade = this.clock.tween({
      duration,
      delay,
      ease: ease.linear,
      update: (t) => {
        att.alpha = clamp01((t - 0.5) / 0.5);
        this.sync();
      },
    });
    return Promise.all([drawn, fade]);
  }
}

const padBox = (b, pad) => ({ x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad });

/** Rounded box around a mob or box (front layer). draw() traces it. */
export class SurroundMob extends RectMob {
  constructor(stage, target, { color = C.yellow, pad = 10, radius = 12, width = 3, layer = 'front', ...opts } = {}) {
    const b = padBox(boxOf(target), pad);
    super(stage, b.x, b.y, b.w, b.h, { color, radius, width, layer, ...opts });
    this.pad = pad;
  }
  /** Moves/resizes the box onto another target (animated). */
  retarget(target, { pad = this.pad, ...opts } = {}) {
    const b = padBox(boxOf(target), pad);
    return this.resize(b.x, b.y, b.w, b.h, opts);
  }
}

// ---------- model objects (plane.js, space.js) ----------

/** Side names → the label anchor that puts the label on that side of its point. */
const ANCHORS = {
  center: [0.5, 0.5],
  above: [0.5, 1],
  below: [0.5, 0],
  left: [1, 0.5],
  right: [0, 0.5],
  'above left': [1, 1],
  'above right': [0, 1],
  'below left': [1, 0],
  'below right': [0, 0],
};

function tweenModel(obj, key, to, { duration = 800, delay = 0, ease: e = ease.inOut } = {}) {
  to = nums(to);
  let from = null;
  return obj.clock.tween({
    duration,
    delay,
    ease: e,
    start: () => (from = obj[key].slice()),
    update: (t) => {
      from ??= obj[key].slice();
      obj[key] = from.map((v, i) => lerp(v, to[i], t));
      obj.redraw();
    },
  });
}

/** A vector (arrow) from `tail` to `tail + coords` in the owner's model space, with an optional TeX label at its tip. */
export class VectorBase extends ArrowMob {
  constructor(owner, coords, { tail, label, labelColor, labelSize = 36, color = C.blue, width = 5, ...opts } = {}) {
    super(owner.stage, 0, 0, 0, 0, { color, width, ...opts, parent: owner });
    this.owner = owner;
    this.coords = nums(coords);
    this.tail = tail ? nums(tail) : this.coords.map(() => 0);
    this.g = 1;
    this.label = null;
    this.labelAtt = null;
    this.labelStyle = { color: labelColor ?? color, size: labelSize };
    if (label) this.setLabel(label);
    this.redraw();
  }
  tipModel() {
    return this.tail.map((v, i) => v + (this.coords[i] ?? 0));
  }
  modelCenter() {
    return this.tail.map((v, i) => v + (this.coords[i] ?? 0) / 2);
  }
  redraw() {
    const [x1, y1] = this.owner.project(this.tail, this);
    const [x2, y2] = this.owner.project(this.tipModel(), this);
    this.setEndsNow(x1, y1, lerp(x1, x2, this.g), lerp(y1, y2, this.g));
    if (this.labelAtt) {
      let dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy);
      if (L < 1) [dx, dy] = [0.7, -0.7];
      const k = (this.labelGap ?? 10) / (Math.hypot(dx, dy) || 1);
      this.labelAtt.x = x2 + dx * k;
      this.labelAtt.y = y2 + dy * k;
      setAnchor(this.label, anchorToward(dx, dy));
      this.sync();
    }
  }
  /** Sets (or replaces) the TeX label at the tip. */
  setLabel(tex) {
    if (this.label) this.label.setTex(tex);
    else {
      this.label = this.stage.tex(tex, { size: this.labelStyle.size, color: this.labelStyle.color });
      this.labelAtt = this.attach(this.label, 0, 0);
    }
    if (this.owner) this.redraw();
    return this;
  }
  /** Grows the vector from its tail; the label fades in at the end. */
  grow({ duration = 900, delay = 0 } = {}) {
    this.g = 0;
    if (this.labelAtt) this.labelAtt.alpha = 0;
    this.set({ opacity: 1 });
    this.redraw();
    return this.clock.tween({
      duration,
      delay,
      ease: ease.inOut,
      update: (t) => {
        this.g = t;
        if (this.labelAtt) this.labelAtt.alpha = clamp01((t - 0.6) / 0.4);
        this.redraw();
      },
    });
  }
  draw(opts) {
    return this.grow(opts);
  }
  /** moveTo([a, b(, c)]) animates the vector to new coordinates; moveTo(x, y) moves it like any shape. */
  moveTo(target, ...rest) {
    if (Array.isArray(target)) return tweenModel(this, 'coords', target, rest[0]);
    return super.moveTo(target, ...rest);
  }
  /** Animates the tail to a model point (the vector keeps its coordinates). */
  moveTail(target, opts) {
    return tweenModel(this, 'tail', target, opts);
  }
  setCoords(c) {
    this.coords = nums(c);
    this.redraw();
    return this;
  }
  setTail(p) {
    this.tail = nums(p);
    this.redraw();
    return this;
  }
}

/** A dot at a model point with an optional TeX label above right. */
export class PointBase extends DotMob {
  constructor(owner, coords, { label, labelColor, labelSize = 34, color = C.ink, r = 9, ...opts } = {}) {
    super(owner.stage, 0, 0, { color, r, ...opts, parent: owner });
    this.owner = owner;
    this.coords = nums(coords);
    this.label = null;
    this.labelAtt = null;
    if (label) {
      this.label = this.stage.tex(label, { size: labelSize, color: labelColor ?? color, anchor: [0, 1] });
      this.labelAtt = this.attach(this.label, 0, 0);
    }
    this.redraw();
  }
  modelCenter() {
    return this.coords;
  }
  redraw() {
    const [x, y] = this.owner.project(this.coords, this);
    this.setCircleNow(x, y, this.r);
    if (this.labelAtt) {
      this.labelAtt.x = x + 12;
      this.labelAtt.y = y - 10;
      this.sync();
    }
  }
  moveTo(target, ...rest) {
    if (Array.isArray(target)) return tweenModel(this, 'coords', target, rest[0]);
    return super.moveTo(target, ...rest);
  }
}

/** A polygon with model-space vertices (filled softly by default). */
export class ModelPolygon extends PolygonMob {
  constructor(owner, pts, { color = C.blue, fill, width = 3, ...opts } = {}) {
    super(owner.stage, [], { color, width, fill: fill ?? soft(color, 20), ...opts, parent: owner });
    this.owner = owner;
    this.pts = pts.map(nums);
    this.redraw();
  }
  modelCenter() {
    const n = this.pts.length || 1;
    return this.pts[0].map((_, k) => this.pts.reduce((s, p) => s + p[k], 0) / n);
  }
  redraw() {
    this.setPoints(this.pts.map((p) => this.owner.project(p, this)));
  }
  /** Animates the vertices to new model points (same count). */
  morphTo(target, opts) {
    if (!Array.isArray(target)) return super.morphTo(target, opts);
    const to = target.map(nums);
    const { duration = 800, delay = 0, ease: e = ease.inOut } = opts ?? {};
    let from = null;
    return this.clock.tween({
      duration,
      delay,
      ease: e,
      start: () => (from = this.pts.map((p) => p.slice())),
      update: (t) => {
        from ??= this.pts.map((p) => p.slice());
        this.pts = from.map((p, i) => p.map((v, k) => lerp(v, to[i][k], t)));
        this.redraw();
      },
    });
  }
}

/** A TeX label pinned to a model point (moves with the owner's maps; the text itself never distorts). */
export class ModelLabel extends Shape {
  /**
   * anchor: [ax, ay] (which point of the label sits on the model point; [0, 1] = its bottom-left) or a side name:
   * 'above' | 'below' | 'left' | 'right' | 'above left' | 'above right' | 'below left' | 'below right' | 'center'.
   */
  constructor(owner, coords, tex, { color = C.ink, size = 36, offset, anchor = [0.5, 0.5], ...opts } = {}) {
    super(owner.stage, svg('g', { class: 'lx-model-label' }), { color, ...opts, parent: owner });
    this.owner = owner;
    this.coords = nums(coords);
    const a = ANCHORS[anchor] ?? anchor;
    // Named sides keep an 8 px gap from the point unless an offset is given.
    this.offset = offset ?? (typeof anchor === 'string' ? [(0.5 - a[0]) * 16, (0.5 - a[1]) * 16] : [0, 0]);
    this.label = this.stage.tex(tex, { size, color, anchor: a });
    this.labelAtt = this.attach(this.label, 0, 0);
    this.redraw();
  }
  modelCenter() {
    return this.coords;
  }
  redraw() {
    const [x, y] = this.owner.project(this.coords, this);
    this.pivot = [x, y];
    this.labelAtt.x = x + this.offset[0];
    this.labelAtt.y = y + this.offset[1];
    this.sync();
  }
  draw(opts = {}) {
    return this.fadeIn({ shift: [0, 0], ...opts });
  }
  moveTo(target, ...rest) {
    if (Array.isArray(target)) return tweenModel(this, 'coords', target, rest[0]);
    return super.moveTo(target, ...rest);
  }
}

// ---------- factories ----------

extend({
  line(x1, y1, x2, y2, opts) {
    return new LineMob(this, x1, y1, x2, y2, opts);
  },
  arrow(x1, y1, x2, y2, opts) {
    return new ArrowMob(this, x1, y1, x2, y2, opts);
  },
  rect(x, y, w, h, opts) {
    return new RectMob(this, x, y, w, h, opts);
  },
  circle(cx, cy, r, opts) {
    return new CircleMob(this, cx, cy, r, opts);
  },
  dot(x, y, opts) {
    return new DotMob(this, x, y, opts);
  },
  path(d, opts) {
    return new PathMob(this, d, opts);
  },
  polygon(points, opts) {
    return new PolygonMob(this, points, opts);
  },
  brace(x1, y1, x2, y2, opts) {
    return new BraceMob(this, x1, y1, x2, y2, opts);
  },
  surround(target, opts) {
    return new SurroundMob(this, target, opts);
  },
  underline(target, { color = C.yellow, width = 4, gap = 6, layer = 'front', ...opts } = {}) {
    const b = boxOf(target);
    return new LineMob(this, b.x, b.y + b.h + gap, b.x + b.w, b.y + b.h + gap, { color, width, layer, ...opts });
  },
});
