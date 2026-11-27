/**
 * Plane: a 2D coordinate plane (grid, axes, tick labels) with vectors, points, lines, spans and polygons on it,
 * and linear maps that move all of it (manim's NumberPlane + ApplyMatrix).
 *
 *   const p = s.plane({ x: 480, y: 300, width: 520, range: [-5, 5, -4, 4] });
 *   const v = p.vector([2, 1], { color: C.blue, label: '\\mathbf{v}' });
 *   await v.grow();
 *   await p.applyMatrix([[1, 1], [0, 1]]);
 *
 * s.plane({ x = 480, y = 300, width = 520, height (default: square units), range = [xmin, xmax, ymin, ymax],
 *           step = 1, grid = true, axes = true, labels = true, labelStep, names (e.g. ['x_1', 'x_2']), visible })
 *
 * The plane is one SVG <g> on the back layer; its objects are nested inside it, so p.fadeIn()/fadeOut()/shift()
 * carry them along (their HTML labels follow). Objects are mobs too (fadeIn, recolor, indicate, remove…).
 *   p.toStage([a, b]) → [x, y]                  stage point of plane coordinates (current translation included)
 *   p.vector([a, b], { color, label, width, tail, transform })     → vector: grow(), moveTo([a, b]), moveTail([a, b]),
 *                                                                    setLabel(tex), label (Tex), coords, tail
 *   p.point([a, b], { color, label })           → point: draw() pops, moveTo([a, b])
 *   p.line({ through, dir } | { a, b, c }, { color, width, dash })  → line (ax + by = c), clipped to the plane
 *   p.span(v, { color })                         → the line through 0 along v
 *   p.polygon(pts, { color, fill }) / p.parallelogram(u, v, opts)  → polygon: draw(), morphTo(pts)
 *   p.label([a, b], tex, { color, size, offset, anchor })          → a TeX label pinned to a point (anchor [ax, ay] or 'above' …)
 *   p.basis(opts) → { i, j }                     î (green) and ĵ (red) vectors; grow them to show
 *   p.addTip(u, v, opts)                         animates v's tail to u's tip (tip-to-tail sum)
 *   p.applyMatrix(M, { duration = 1600, ghost = true, interp = 'auto' })   grid, axes and every transformable object
 *                                                follow the map from I to M: 'linear' blends (1 − t)I + tM; 'polar'
 *                                                writes M = R·S (rotation · symmetric stretch) and turns R by t·θ while
 *                                                blending S, so rotations keep their size; 'auto' uses polar when M
 *                                                rotates (det > 0, not symmetric) and the linear blend would squash the
 *                                                plane on the way (area dips below 3/4 of min(1, det M)); shears stay linear.
 *                                                Maps compose (p.matrix is the grid's map)
 *   p.resetMatrix()                              instant: everything back to the identity
 *   p.draw()                                     grid and axes draw in, tick labels fade in
 * Objects created with { transform: false } stay put during maps. An object created after a map sits at its given
 * coordinates; later maps move it from there.
 */
import { Mob, katexHtml } from '../core/mobject.js';
import { el, svg, nextId } from '../core/dom.js';
import { extend, C } from '../core/stage.js';
import { ease, lerp } from '../core/tween.js';
import { Shape, LineMob, VectorBase, PointBase, ModelPolygon, ModelLabel, clipSeg, drawParts, nums } from './shapes.js';

const I2 = [
  [1, 0],
  [0, 1],
];
const mat2 = (M) => M.map((r) => r.map((v) => Number(v)));
const mul2 = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
const app = (T, p) => [T[0][0] * p[0] + T[0][1] * p[1], T[1][0] * p[0] + T[1][1] * p[1]];
const fmt = (u) => (Number.isInteger(u) ? `${u}` : `${+u.toFixed(2)}`);

/** The path t ↦ M(t) from I (t = 0) to M (t = 1): linear blend, or rotation angle · t times blended stretch (polar). */
function mapPath(A, interp) {
  const [[a, b], [c, d]] = A;
  const det = a * d - b * c;
  const linear = (t) => [
    [1 + (a - 1) * t, b * t],
    [c * t, 1 + (d - 1) * t],
  ];
  const dips = () => {
    let lo = Infinity;
    for (let i = 1; i < 20; i++) {
      const [[p, q], [r, s]] = linear(i / 20);
      lo = Math.min(lo, p * s - q * r);
    }
    return lo < 0.75 * Math.min(1, det);
  };
  const polar = interp === 'polar' ? det > 0 : interp !== 'linear' && det > 0 && Math.abs(b - c) > 1e-9 && dips();
  if (!polar) return linear;
  const th = Math.atan2(c - b, a + d);
  const R = (x) => [
    [Math.cos(x), -Math.sin(x)],
    [Math.sin(x), Math.cos(x)],
  ];
  const S = mul2(R(-th), A);
  return (t) =>
    mul2(R(th * t), [
      [1 + (S[0][0] - 1) * t, S[0][1] * t],
      [S[1][0] * t, 1 + (S[1][1] - 1) * t],
    ]);
}

/** A line in plane coordinates, drawn across the whole visible plane. */
class PlaneLine extends LineMob {
  constructor(owner, through, dir, opts = {}) {
    super(owner.stage, 0, 0, 0, 0, { color: C.ink, width: 4, ...opts, parent: owner });
    this.owner = owner;
    this.through = nums(through);
    this.dir = nums(dir);
    this.redraw();
  }
  modelCenter() {
    return this.through;
  }
  redraw() {
    const P = this.owner.project(this.through, this);
    const Q = this.owner.project([this.through[0] + this.dir[0], this.through[1] + this.dir[1]], this);
    const dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.hypot(dx, dy);
    const c = L < 1e-6 ? null : clipSeg([P[0] - (dx / L) * 4000, P[1] - (dy / L) * 4000], [P[0] + (dx / L) * 4000, P[1] + (dy / L) * 4000], this.owner.view);
    this.el.style.display = c ? '' : 'none';
    if (c) this.setEndsNow(...c);
  }
  /** Animates to another line (same spec shapes as p.line). */
  moveTo(target, ...rest) {
    if (!target || typeof target !== 'object' || Array.isArray(target)) return super.moveTo(target, ...rest);
    const [through, dir] = lineSpec(target);
    const { duration = 800, delay = 0, ease: e = ease.inOut } = rest[0] ?? {};
    let from = null;
    return this.clock.tween({
      duration,
      delay,
      ease: e,
      start: () => (from = [this.through.slice(), this.dir.slice()]),
      update: (t) => {
        from ??= [this.through.slice(), this.dir.slice()];
        this.through = from[0].map((v, i) => lerp(v, through[i], t));
        this.dir = from[1].map((v, i) => lerp(v, dir[i], t));
        this.redraw();
      },
    });
  }
}

function lineSpec(spec) {
  if (spec.dir) return [nums(spec.through ?? [0, 0]), nums(spec.dir)];
  const a = Number(spec.a ?? 0), b = Number(spec.b ?? 0), c = Number(spec.c ?? 0);
  const through = Math.abs(b) > 1e-12 ? [0, c / b] : [Math.abs(a) > 1e-12 ? c / a : 0, 0];
  return [through, [b, -a]];
}

export class Plane extends Shape {
  constructor(stage, { x = 480, y = 300, width = 520, height, range = [-5, 5, -4, 4], step = 1, grid = true, axes = true, labels = true, labelStep, names = null, visible = true } = {}) {
    super(stage, svg('g', { class: 'lx-plane' }), { visible });
    const [x0, x1, y0, y1] = range.map(Number);
    height ??= (width * (y1 - y0)) / (x1 - x0);
    this.range = [x0, x1, y0, y1];
    this.ux = width / (x1 - x0);
    this.uy = height / (y1 - y0);
    this.view = { x: x - width / 2, y: y - height / 2, w: width, h: height };
    this.pivot = [x, y];
    this.T = I2;
    this.kids = new Set();
    this.ghostG = svg('g', { class: 'lx-plane-ghost' });
    this.ghostG.style.opacity = '0';
    this.gridG = svg('g', { class: 'lx-plane-grid' });
    this.axesG = svg('g', { class: 'lx-plane-axes' });
    this.content = svg('g', { class: 'lx-plane-objects' });
    this.node.append(this.ghostG, this.gridG, this.axesG, this.content);
    // Objects stay inside the plane's rectangle (maps can carry polygons and lines past its edges).
    const clipId = nextId('lx-plane-clip');
    const v = this.view;
    stage.defs.append(svg('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, svg('rect', { x: v.x - 1, y: v.y - 1, width: v.w + 2, height: v.h + 2 })));
    this.content.setAttribute('clip-path', `url(#${clipId})`);

    // Grid lines span three times the visible range, so a map never uncovers an empty corner; each is clipped.
    this.segs = [];
    const sx = x1 - x0, sy = y1 - y0;
    const add = (g, p, q) => {
      const e = svg('line');
      g.append(e);
      this.segs.push({ p, q, el: e });
    };
    const ghost = (p, q) => {
      const [a, b] = [this.px(p), this.px(q)];
      this.ghostG.append(svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
    };
    if (grid) {
      for (let i = Math.ceil((x0 - sx) / step); i * step <= x1 + sx + 1e-9; i++) {
        const k = i * step;
        if (i === 0 && axes) continue;
        add(this.gridG, [k, y0 - sy], [k, y1 + sy]);
      }
      for (let i = Math.ceil((y0 - sy) / step); i * step <= y1 + sy + 1e-9; i++) {
        const k = i * step;
        if (i === 0 && axes) continue;
        add(this.gridG, [x0 - sx, k], [x1 + sx, k]);
      }
      for (let i = Math.ceil(x0 / step); i * step <= x1 + 1e-9; i++) ghost([i * step, y0], [i * step, y1]);
      for (let i = Math.ceil(y0 / step); i * step <= y1 + 1e-9; i++) ghost([x0, i * step], [x1, i * step]);
    }
    if (axes) {
      add(this.axesG, [x0 - sx, 0], [x1 + sx, 0]);
      add(this.axesG, [0, y0 - sy], [0, y1 + sy]);
    }

    this.ticks = null;
    this.tickAtt = null;
    if (labels || names) {
      const box = el('div', { class: 'lx-plane-ticks' });
      const [ox, oy] = this.px([0, 0]);
      const baseY = y0 <= 0 && 0 <= y1 ? oy : this.view.y + this.view.h;
      const baseX = x0 <= 0 && 0 <= x1 ? ox : this.view.x;
      const pick = (u) => [1, 2, 5, 10, 20, 50, 100].map((m) => m * step).find((s) => s * u >= 64) ?? 100 * step;
      if (labels) {
        const lx = labelStep ?? pick(this.ux), ly = labelStep ?? pick(this.uy);
        for (let i = Math.ceil(x0 / lx); i * lx <= x1 + 1e-9; i++) {
          if (i === 0) continue;
          const [px] = this.px([i * lx, 0]);
          box.append(el('div', { class: 'lx-plane-tick lx-tick-x', style: { left: `${px}px`, top: `${baseY + 6}px` }, html: katexHtml(fmt(i * lx), { display: false }) }));
        }
        for (let i = Math.ceil(y0 / ly); i * ly <= y1 + 1e-9; i++) {
          if (i === 0) continue;
          const [, py] = this.px([0, i * ly]);
          box.append(el('div', { class: 'lx-plane-tick lx-tick-y', style: { left: `${baseX - 10}px`, top: `${py}px` }, html: katexHtml(fmt(i * ly), { display: false }) }));
        }
      }
      if (names) {
        const [ex] = this.px([x1, 0]);
        const [, ey] = this.px([0, y1]);
        if (names[0]) box.append(el('div', { class: 'lx-plane-name lx-name-x', style: { left: `${ex - 6}px`, top: `${baseY - 8}px` }, html: katexHtml(names[0], { display: false }) }));
        if (names[1]) box.append(el('div', { class: 'lx-plane-name lx-name-y', style: { left: `${baseX + 12}px`, top: `${ey + 4}px` }, html: katexHtml(names[1], { display: false }) }));
      }
      this.ticks = new Mob(stage, box, { layer: 'html', anchor: [0, 0], x: 0, y: 0 });
      this.tickAtt = this.attach(this.ticks, 0, 0);
    }
    this.redraw();
  }

  /** Plane coordinates → stage point inside the plane's group (no translation). */
  px(p) {
    const [x0, , , y1] = this.range;
    return [this.view.x + (p[0] - x0) * this.ux, this.view.y + (y1 - p[1]) * this.uy];
  }
  /** Where an object's model point is drawn (its own map applied). */
  project(p, obj) {
    return this.px(app(obj?.T ?? I2, p));
  }
  /** Keeps a kid's label anchor inside the plane's rectangle (used by Shape.sync). */
  clampPoint(x, y) {
    const { x: vx, y: vy, w, h } = this.view, m = 6;
    return [Math.max(vx + m, Math.min(vx + w - m, x)), Math.max(vy + m, Math.min(vy + h - m, y))];
  }

  /** Plane coordinates → stage point (including the plane's current translation). */
  toStage(p) {
    const [x, y] = this.px(nums(p));
    return [x + this.state.x, y + this.state.y];
  }
  /** The grid's current map (2×2 numbers). */
  get matrix() {
    return this.T.map((r) => r.slice());
  }

  redraw() {
    for (const s of this.segs) {
      const c = clipSeg(this.project(s.p, this), this.project(s.q, this), this.view);
      s.el.style.display = c ? '' : 'none';
      if (!c) continue;
      s.el.setAttribute('x1', c[0]);
      s.el.setAttribute('y1', c[1]);
      s.el.setAttribute('x2', c[2]);
      s.el.setAttribute('y2', c[3]);
    }
  }

  /** Draws grid and axes in; tick labels fade in after. */
  draw({ duration = 1200, delay = 0 } = {}) {
    this.set({ opacity: 1 });
    const parts = [...this.gridG.children, ...this.axesG.children].filter((e) => e.style.display !== 'none');
    const jobs = [drawParts(this.clock, parts, { duration, delay })];
    const att = this.tickAtt;
    if (att) {
      att.alpha = 0;
      this.sync();
      jobs.push(
        this.clock.tween({
          duration: 400,
          delay: delay + duration * 0.6,
          ease: ease.out,
          update: (t) => {
            att.alpha = t;
            this.sync();
          },
        }),
      );
    }
    return Promise.all(jobs);
  }

  // ---- objects ----

  kid(obj, opts) {
    obj.T = I2;
    obj.transformable = opts?.transform !== false;
    obj.redraw();
    return obj;
  }
  vector(coords, opts = {}) {
    return this.kid(new VectorBase(this, coords, opts), opts);
  }
  point(coords, opts = {}) {
    return this.kid(new PointBase(this, coords, opts), opts);
  }
  line(spec, opts = {}) {
    const [through, dir] = lineSpec(spec);
    return this.kid(new PlaneLine(this, through, dir, opts), opts);
  }
  span(v, opts = {}) {
    return this.kid(new PlaneLine(this, [0, 0], v, { color: C.yellow, width: 3, ...opts }), opts);
  }
  polygon(pts, opts = {}) {
    return this.kid(new ModelPolygon(this, pts, opts), opts);
  }
  parallelogram(u, v, opts = {}) {
    const [a, b] = [nums(u), nums(v)];
    return this.polygon([[0, 0], a, [a[0] + b[0], a[1] + b[1]], b], opts);
  }
  label(p, tex, opts = {}) {
    return this.kid(new ModelLabel(this, p, tex, opts), opts);
  }
  basis(opts = {}) {
    return {
      i: this.vector([1, 0], { color: C.green, label: '\\hat{\\imath}', ...opts }),
      j: this.vector([0, 1], { color: C.red, label: '\\hat{\\jmath}', ...opts }),
    };
  }
  /** Tip-to-tail: animates v so its tail sits on u's tip. */
  addTip(u, v, opts) {
    return v.moveTail(u.tipModel(), opts);
  }

  // ---- linear maps ----

  applyMatrix(M, { duration = 1600, delay = 0, ghost = true, interp = 'auto' } = {}) {
    const A = mat2(M);
    const path = mapPath(A, interp);
    let items = null, T0 = null, T1 = null, g0 = 0, k0 = 1;
    const begin = () => {
      if (items) return;
      items = [this, ...[...this.kids].filter((k) => k.transformable)];
      T0 = items.map((o) => o.T ?? I2);
      T1 = T0.map((T) => mul2(A, T));
      g0 = parseFloat(this.ghostG.style.opacity || '0');
      k0 = this.tickAtt?.alpha ?? 0;
    };
    return this.clock.tween({
      duration,
      delay,
      ease: ease.inOut,
      start: begin,
      update: (t) => {
        begin();
        const At = path(t);
        items.forEach((o, k) => {
          o.T = t >= 1 ? T1[k] : mul2(At, T0[k]);
          o.redraw();
        });
        if (ghost) this.ghostG.style.opacity = `${lerp(g0, 1, Math.min(1, t * 3))}`;
        if (this.tickAtt) {
          this.tickAtt.alpha = lerp(k0, 0, Math.min(1, t * 3));
          this.sync();
        }
      },
    });
  }

  /** Instantly back to the identity map (grid, objects, tick labels; ghost grid hidden). */
  resetMatrix() {
    for (const o of [this, ...this.kids]) {
      if (o !== this && !o.transformable) continue;
      o.T = I2;
      o.redraw();
    }
    this.ghostG.style.opacity = '0';
    if (this.tickAtt) this.tickAtt.alpha = 1;
    this.sync();
    return this;
  }
}

extend({
  plane(opts) {
    return new Plane(this, opts);
  },
});
