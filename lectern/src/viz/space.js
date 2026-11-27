/**
 * Space: projected 3D axes with vectors, points, lines and plane patches, and an animated camera.
 *
 *   const sp = s.space({ x: 480, y: 310, size: 440, range: 3, yaw: -35, pitch: 20 });
 *   const u = sp.vector([2, 0, 1], { color: C.blue, label: '\\mathbf{u}' });
 *   const P = sp.plane([2, 0, 1], [0, 2, 1], { color: C.teal });
 *   await sp.rotate(20, 30);  await sp.orbit(60, 4000);
 *
 * s.space({ x = 480, y = 300, size = 440, range = 3, yaw = -35, pitch = 20, axes = true,
 *           names = ['x_1', 'x_2', 'x_3'], visible })
 * World axes: x1, x2 horizontal, x3 up. Orthographic camera: yaw turns about x3 (−35 puts x1 toward the viewer on the
 * left, x2 to the right), pitch looks down from above. `size` is the on-stage length of one axis (−range…range).
 * One SVG <g> on the back layer; objects nest inside it (fade/shift with the space) and are depth-sorted (far first)
 * whenever the camera moves.
 *   sp.vector([x, y, z], { color, label, width, tail })   → vector: grow(), moveTo([x, y, z]), moveTail(p), setLabel
 *   sp.point([x, y, z], { color, label })                   → point: draw(), moveTo([x, y, z])
 *   sp.line(through, dir, { color, width, dash })           → the line through `through` along `dir`, clipped to the box
 *   sp.segment(a, b, { color, width, dash })                → the segment a→b (not clipped); moveTo([a, b]) animates it
 *   sp.rightAngle(at, u, v, { size = 0.3, color, width })  → right-angle mark at `at` between directions u and v
 *   sp.plane(u, v, { color, fill, extent, center }) | sp.plane({ normal, d }, { extent, center })
 *                         → translucent patch: corners center ± e·u ± e·v (center default 0; e = extent, default so the
 *                           patch spans ~0.8·range),
 *                           or a square of half-width `extent` (default 0.8·range) on the plane n·x = d, centered at the
 *                           projection of opts.center onto it (default: the plane's point nearest 0)
 *   sp.label([x, y, z], tex, { color, size, offset, anchor })
 *   sp.project([x, y, z]) → [sx, sy] (inside the space's group)        sp.toStage([x, y, z]) (with translation)
 *   sp.rotate(yaw, pitch, { duration = 1200 })  animated camera        sp.orbit(deg = 360, duration = 6000) (linear yaw)
 *   sp.setCamera(yaw, pitch)                    instant                 sp.draw() grows the axes in
 */
import { svg } from '../core/dom.js';
import { extend, C } from '../core/stage.js';
import { ease, lerp } from '../core/tween.js';
import { Shape, LineMob, VectorBase, PointBase, ModelPolygon, ModelLabel, nums, soft, paint } from './shapes.js';

const rad = (d) => (d * Math.PI) / 180;
const norm3 = (v) => Math.hypot(v[0], v[1], v[2]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const scale3 = (k, v) => v.map((x) => x * k);
const add3 = (...vs) => [0, 1, 2].map((i) => vs.reduce((s, v) => s + v[i], 0));

class SpaceLine extends LineMob {
  constructor(owner, through, dir, opts = {}) {
    super(owner.stage, 0, 0, 0, 0, { color: C.ink, width: 3, ...opts, parent: owner });
    this.owner = owner;
    this.through = nums(through);
    this.dir = nums(dir);
    this.redraw();
  }
  /** The part of the line inside the cube [−range, range]³, or null. */
  seg() {
    const R = this.owner.R;
    let lo = -Infinity, hi = Infinity;
    for (let k = 0; k < 3; k++) {
      const p = this.through[k], d = this.dir[k];
      if (Math.abs(d) < 1e-12) {
        if (Math.abs(p) > R) return null;
        continue;
      }
      let a = (-R - p) / d, b = (R - p) / d;
      if (a > b) [a, b] = [b, a];
      lo = Math.max(lo, a);
      hi = Math.min(hi, b);
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) return null;
    const at = (t) => this.through.map((v, i) => v + t * this.dir[i]);
    return [at(lo), at(hi)];
  }
  modelCenter() {
    const s = this.seg();
    return s ? s[0].map((v, i) => (v + s[1][i]) / 2) : this.through;
  }
  redraw() {
    const s = this.seg();
    this.el.style.display = s ? '' : 'none';
    if (!s) return;
    const [a, b] = s.map((p) => this.owner.project(p));
    this.setEndsNow(a[0], a[1], b[0], b[1]);
  }
}

/** A 3D segment between two model points. */
class SpaceSegment extends LineMob {
  constructor(owner, a, b, opts = {}) {
    super(owner.stage, 0, 0, 0, 0, { color: C.ink, width: 3, ...opts, parent: owner });
    this.owner = owner;
    this.a = nums(a);
    this.b = nums(b);
    this.redraw();
  }
  modelCenter() {
    return this.a.map((v, i) => (v + this.b[i]) / 2);
  }
  redraw() {
    const [p, q] = [this.owner.project(this.a), this.owner.project(this.b)];
    this.setEndsNow(p[0], p[1], q[0], q[1]);
  }
  /** moveTo([a, b]) animates both ends to new model points; moveTo(x, y) moves it like any shape. */
  moveTo(target, ...rest) {
    if (!Array.isArray(target)) return super.moveTo(target, ...rest);
    const to = target.map(nums);
    const { duration = 800, delay = 0, ease: e = ease.inOut } = rest[0] ?? {};
    let from = null;
    return this.clock.tween({
      duration,
      delay,
      ease: e,
      start: () => (from = [this.a.slice(), this.b.slice()]),
      update: (t) => {
        from ??= [this.a.slice(), this.b.slice()];
        this.a = from[0].map((v, i) => lerp(v, to[0][i], t));
        this.b = from[1].map((v, i) => lerp(v, to[1][i], t));
        this.redraw();
      },
    });
  }
}

/** A right-angle mark: the corner of a small square at `at` spanned by unit directions along u and v. */
class SpaceRightAngle extends Shape {
  constructor(owner, at, u, v, { size = 0.3, width = 2.5, color = C.ink, ...opts } = {}) {
    super(owner.stage, svg('g', { class: 'lx-right-angle' }), { color, ...opts, parent: owner });
    this.owner = owner;
    const unit = (w) => scale3(size / (norm3(w) || 1), w);
    const [A, U, V] = [nums(at), unit(nums(u)), unit(nums(v))];
    this.pts = [add3(A, U), add3(A, U, V), add3(A, V)];
    this.el = paint(svg('polyline'), { width });
    this.node.append(this.el);
    this.redraw();
  }
  modelCenter() {
    return this.pts[1];
  }
  redraw() {
    const pts = this.pts.map((p) => this.owner.project(p));
    this.el.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
    this.pivot = pts[1];
    this.render();
  }
}

export class Space extends Shape {
  constructor(stage, { x = 480, y = 300, size = 440, range = 3, yaw = -35, pitch = 20, axes = true, names = ['x_1', 'x_2', 'x_3'], visible = true } = {}) {
    super(stage, svg('g', { class: 'lx-space' }), { visible });
    this.cx = x;
    this.cy = y;
    this.R = range;
    this.unit = size / (2 * range);
    this.yaw = yaw;
    this.pitch = pitch;
    this.pivot = [x, y];
    this.kids = new Set();
    this.axesG = svg('g', { class: 'lx-space-axes' });
    this.content = svg('g', { class: 'lx-space-objects' });
    this.node.append(this.axesG, this.content);
    this.axes = [];
    if (axes) {
      for (let k = 0; k < 3; k++) {
        const e = [0, 0, 0], t = [0, 0, 0];
        e[k] = 2 * range;
        t[k] = -range;
        const a = new VectorBase(this, e, { tail: t, color: C.muted, width: 3, head: 14, label: names?.[k], labelColor: C.muted, labelSize: 30 });
        a.isAxis = true;
        this.axesG.append(a.node);
        this.axes.push(a);
      }
    }
    this.redraw();
  }

  /** Camera coordinates [right, up, depth] of a world point (depth grows away from the viewer). */
  cam(p) {
    const a = rad(this.yaw), b = rad(this.pitch);
    const [x = 0, y = 0, z = 0] = p;
    const X = x * Math.sin(a) + y * Math.cos(a);
    const D = -x * Math.cos(a) + y * Math.sin(a);
    return [X, z * Math.cos(b) + D * Math.sin(b), D * Math.cos(b) - z * Math.sin(b)];
  }
  project(p) {
    const [X, U] = this.cam(p);
    return [this.cx + X * this.unit, this.cy - U * this.unit];
  }
  toStage(p) {
    const [x, y] = this.project(nums(p));
    return [x + this.state.x, y + this.state.y];
  }

  redraw() {
    for (const k of this.kids) if (!k.isAxis) k.redraw();
    // Axis names sit just beyond the axis tip, unless an object's label is there (a vector along the axis):
    // then the name moves further out along the axis.
    const marks = [...this.kids].filter((k) => !k.isAxis && k.labelAtt).map((k) => [k.labelAtt.x, k.labelAtt.y]);
    for (const a of this.axes) {
      a.labelGap = 10;
      a.redraw();
      if (!a.labelAtt) continue;
      const near = () => marks.some(([x, y]) => Math.hypot(x - a.labelAtt.x, y - a.labelAtt.y) < 46);
      while (near() && a.labelGap < 130) {
        a.labelGap += 24;
        a.redraw();
      }
    }
    this.sort();
  }

  /** Re-stacks objects far → near. */
  sort() {
    const objs = [...this.kids].filter((k) => !k.isAxis);
    const sorted = objs
      .map((o) => [o, o.modelCenter ? this.cam(o.modelCenter())[2] : 0])
      .sort((p, q) => q[1] - p[1])
      .map((p) => p[0]);
    if (sorted.some((o, i) => this.content.children[i] !== o.node)) sorted.forEach((o) => this.content.append(o.node));
  }

  setCamera(yaw = this.yaw, pitch = this.pitch) {
    this.yaw = yaw;
    this.pitch = Math.max(-89, Math.min(89, pitch));
    this.redraw();
    return this;
  }

  camTo(target, { duration = 1200, delay = 0, ease: e = ease.inOut } = {}) {
    let from = null, to = null;
    const begin = () => {
      if (from) return;
      from = [this.yaw, this.pitch];
      to = target();
    };
    return this.clock.tween({
      duration,
      delay,
      ease: e,
      start: begin,
      update: (t) => {
        begin();
        this.setCamera(lerp(from[0], to[0], t), lerp(from[1], to[1], t));
      },
    });
  }
  /** Animates the camera to (yaw, pitch) in degrees (omit one to keep it). */
  rotate(yaw, pitch, opts) {
    return this.camTo(() => [yaw ?? this.yaw, pitch ?? this.pitch], opts);
  }
  /** Turns the camera `deg` degrees about the vertical axis at constant speed. */
  orbit(deg = 360, duration = 6000) {
    return this.camTo(() => [this.yaw + deg, this.pitch], { duration, ease: ease.linear });
  }

  /** Grows the axes in (objects keep their own visibility). */
  draw({ duration = 900, delay = 0 } = {}) {
    this.set({ opacity: 1 });
    return Promise.all(this.axes.map((a, i) => a.grow({ duration, delay: delay + i * 120 })));
  }

  // ---- objects ----

  kid(obj) {
    this.redraw();
    return obj;
  }
  vector(coords, opts = {}) {
    return this.kid(new VectorBase(this, coords, opts));
  }
  point(coords, opts = {}) {
    return this.kid(new PointBase(this, coords, opts));
  }
  rightAngle(at, u, v, opts = {}) {
    return this.kid(new SpaceRightAngle(this, at, u, v, opts));
  }
  segment(a, b, opts = {}) {
    return this.kid(new SpaceSegment(this, a, b, opts));
  }
  line(through, dir, opts = {}) {
    return this.kid(new SpaceLine(this, through, dir, opts));
  }
  plane(u, v, opts) {
    let corners;
    if (!Array.isArray(u)) {
      opts = v ?? {};
      const n = nums(u.normal);
      const nn = norm3(n) || 1;
      const nh = scale3(1 / nn, n);
      let p0 = scale3(Number(u.d ?? 0) / nn, nh);
      if (opts.center) {
        const c = nums(opts.center);
        const off = (c[0] * nh[0] + c[1] * nh[1] + c[2] * nh[2]) - Number(u.d ?? 0) / nn;
        p0 = add3(c, scale3(-off, nh));
      }
      const axis = [0, 1, 2].reduce((best, k) => (Math.abs(nh[k]) < Math.abs(nh[best]) ? k : best), 0);
      const e = [0, 0, 0];
      e[axis] = 1;
      const a0 = cross(nh, e);
      const a = scale3(1 / norm3(a0), a0);
      const b = cross(nh, a);
      const ext = opts.extent ?? this.R * 0.8;
      corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([s, t]) => add3(p0, scale3(s * ext, a), scale3(t * ext, b)));
    } else {
      opts = opts ?? {};
      const [U, V] = [nums(u), nums(v)];
      const ext = opts.extent ?? (this.R * 0.8) / Math.max(norm3(U), norm3(V), 1e-9);
      const c0 = opts.center ? nums(opts.center) : [0, 0, 0];
      corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([s, t]) => add3(c0, scale3(s * ext, U), scale3(t * ext, V)));
    }
    const color = opts.color ?? C.blue;
    return this.kid(new ModelPolygon(this, corners, { width: 2, fill: soft(color, 22), ...opts, color }));
  }
  label(p, tex, opts = {}) {
    return this.kid(new ModelLabel(this, p, tex, opts));
  }
}

extend({
  space(opts) {
    return new Space(this, opts);
  },
});
