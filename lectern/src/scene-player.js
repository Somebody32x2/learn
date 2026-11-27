/**
 * Scene player: step-through figures the learn tutor draws on Matrix Algebra and Foundations pages (show_scene).
 *
 *   import { Player } from '../lectern/src/scene-player.js';
 *   const p = new Player(host, { frames, view: { height } });
 *   p.frames (array), p.i (current frame, 0-based), p.next(), p.prev(), p.go(k), p.stop()
 *
 * Draws on the lessons' own stage (960 × 600 logical px, scaled to the width; `view.height` caps the stage height in
 * CSS px) with a caption under it and ‹ i / n › buttons (← / → when the figure has focus). The root <figure> carries
 * `.player = this`. Human docs with longer examples: lectern/docs/scene-player.md.
 *
 * FRAME FORMAT (plain JSON). A scene is an array of frames. Each frame is the COMPLETE picture at that step:
 *   { "caption": "One or two sentences, $math$ allowed", "objects": [ { "id": "M", "kind": "matrix", ...props }, ... ] }
 * - Next animates the difference from the previous frame: an object whose id is in both frames changes in place
 *   (moves, recolors, morphs; matrix entries, vectors, shading, table columns animate); an id that is gone fades out;
 *   a new id comes in. Back (and keyboard steps) jump without animation.
 * - Give every object a stable "id" (without one, the n-th object of a kind matches the n-th of that kind).
 * - Shorthand: an object with an id from the previous frame and NO "kind" repeats that object, replacing only the
 *   props given ({ "id": "M", "rows": [[1, 2], [0, 1]] }); null removes a prop ({ "id": "M", "note": null }).
 *   An object not listed in a frame (in full or by shorthand) disappears.
 * - Coordinates are stage px: x 0…960 to the right, y 0…600 down; (x, y) is an object's CENTER (default 480, 300),
 *   except proof (top center). Text sizes ≥ 30 (smaller is raised). Keep objects inside the stage and apart; the
 *   caption sits below the stage.
 * - Colors are names: ink (default), muted, blue, red, green, yellow, purple, teal, orange.
 * - TeX is KaTeX; in JSON escape backslashes ("\\frac{1}{2}"). "caption", "text" and proof text use $…$ for math.
 * - Unknown kinds and props, and bad values, are skipped with a short warning under the caption (never an error).
 *
 * KINDS (prop=default)
 * tex        tex (required), x, y, size=44, color, align=center|left|right (the end of the formula placed at x).
 *            Change: new tex in place crossfades; moved/resized glides; moved with new tex morphs.
 * text       text (required; $math$, **bold**), x, y, size=34, color, align, width (wraps at px), weight=normal|bold,
 *            italic, font=sans|serif.
 * matrix     rows (required) [[1, -2, "1/2"], …]: numbers, fraction strings, or TeX strings ("a_{11}");
 *            x, y, size=40, augment (bar before this 0-based column), brackets="[]"|"()"|"||"|"none", color,
 *            highlight { rows: [i], cols: [j], cells: [[i, j]], color=yellow }, pivots [[i, j]] (rings),
 *            pivotColor=blue, note { row, tex, color=muted } (TeX right of a row), rowop=true.
 *            Indices are 0-based (row 0 is R_1). Footprint ≈ 1.8·size px per column, 1.75·size px per row.
 *            Change: when the new rows come from the old by ONE row operation (swap two rows, scale a row, add a
 *            multiple of one row to another), it plays as that operation and names it beside the row
 *            (R_2 → R_2 − 2R_1) unless the frame has a note; otherwise changed entries slide in. So put one row
 *            operation per frame (rowop: false turns the detection off).
 * plane      2-D grid: x, y, width=520, height (default: square units), range=[-5, 5, -4, 4] (xmin, xmax, ymin, ymax),
 *            step=1, grid=true, axes=true, labels=true (tick numbers), names ["x_1", "x_2"], basis (true: î, ĵ),
 *            matrix [[a, b], [c, d]] (the grid and every non-fixed object drawn transformed by it; the original grid
 *            stays faint), vectors [{ id, v: [a, b], tail: [a, b], color=blue, label (TeX), fixed }],
 *            points [{ id, p: [a, b], color, label, fixed }],
 *            lines [{ id, through: [a, b], dir: [a, b] } or { id, a, b, c } (the line ax + by = c), color, dash, fixed],
 *            span [a, b] or [{ id, v: [a, b], color=yellow }] (line through 0 along v),
 *            polygons [{ id, points: [[a, b], …], color }]. Plane coordinates; with a matrix, v/p are INPUTS
 *            (drawn at matrix·v) unless fixed: true. Change: vectors and points move, lines and polygons morph, and a
 *            new matrix animates the whole grid from the old map to the new one.
 * space      3-D axes: x, y, size=440 (one axis on stage), range=3, yaw=-35, pitch=20, axes=true, names,
 *            vectors [{ id, v: [a, b, c], tail, color, label }], points [{ id, p: [a, b, c], color, label }],
 *            lines [{ id, through, dir, color, dash }], planes [{ id, u: […], v: […] } or { id, normal: […], d }, color].
 *            Change: the camera turns (yaw/pitch), vectors and points move.
 * arrow      from [x, y], to [x, y] (stage px), color, width=4, dash, label (TeX beside its middle).
 * box        rounded outline: x, y, w, h (center and size), or around: "id" | ["id", …] (drawn after those objects
 *            settle; for a matrix also row: i | col: j | cell: [i, j]); pad=10, color=yellow, radius=12, width=3, dash.
 * truthTable vars ["P", "Q"] (TeX), cols [{ tex, values: [one per row: true/false or "T"/"F"], hidden }]; rows in the
 *            standard order (P = T T F F, Q = T F T F); x, y, size=32, highlightRows [i], highlightCol (index over
 *            all columns, or a var/tex), highlightColor=yellow, marks ["✓", null, "✗", …] (one per row).
 *            Change: a column whose hidden turns false fills in top to bottom.
 * venn       sets ["A", "B"] (1–3 names) or a count, labels (names shown), x, y, r (140; 122 for three),
 *            universe=true, size=36, shade ["A&B", { region: "A-B", color: "red" }] (later entries paint over earlier;
 *            default blue), elements [{ id, region, label, color }], outline ["A", { set: "U", color }].
 *            Region codes: & or ∩ (and), | or ∪ (or), - or ∖ (minus), ! (not, prefix), ' (complement, postfix),
 *            ^ (symmetric difference), parentheses, U = everything. Change: regions shade/unshade, elements pop.
 * mapDiagram domain ["1", "2"], codomain ["a", "b"], arrows [[i, j]] (domain index → codomain index), labels ["A", "B"],
 *            name ("f"), x, y, gap=360, spacing=72, size=32, highlight [{ side: "dom"|"cod", i, color }],
 *            show ["collision", "missed"] (shared targets pulse: not injective; unreached elements ringed: not
 *            surjective), inverted (arrowheads at the domain end: f⁻¹). Change: arrows draw/fade, heads travel.
 * numberLine x, y, width=800, range=[-5, 5], ticks=1, labels (true, false, or k: every k-th tick), size=30, arrows=true,
 *            points [{ id, v, label, color, open }], intervals [{ id, a, b, openA, openB, color }] (a or b null: ray),
 *            band { center, eps, color=yellow, label="\\varepsilon" }. Change: points slide, the band resizes.
 * proof      two-column proof, anchored at its TOP center: x=480, y=70, width=820, height (to the stage bottom),
 *            size=30, numbered=true, lines [{ text, why, kind: step|assume|conclude|contradiction, indent, note }]
 *            (text: words with $math$, or bare TeX), highlight [i], strike [i], qed. Change: new lines are written
 *            one by one at the end (keep the earlier lines identical and they stay).
 *
 * EXAMPLE: one row replacement, then the pivots.
 * [
 *   { "caption": "The augmented matrix of $x + 2y = 5,\\ 2x + 3y = 8$.",
 *     "objects": [ { "id": "M", "kind": "matrix", "rows": [[1, 2, 5], [2, 3, 8]], "augment": 2 } ] },
 *   { "caption": "Clear below the first pivot: $R_2 \\to R_2 - 2R_1$.",
 *     "objects": [ { "id": "M", "rows": [[1, 2, 5], [0, -1, -2]] } ] },
 *   { "caption": "Two pivots, no free variable: exactly one solution.",
 *     "objects": [ { "id": "M", "pivots": [[0, 0], [1, 1]] },
 *                  { "id": "tag", "kind": "text", "text": "unique solution", "y": 480, "color": "green" } ] }
 * ]
 */
import './viz/index.js';
import { Stage, C } from './core/stage.js';
import { el, reducedMotion } from './core/dom.js';
import { inlineMath } from './core/mobject.js';
import { ease } from './core/tween.js';
import { F, Frac, parseFrac } from './core/frac.js';
import { texRowOp } from './core/linalg.js';
import { compileRegion } from './viz/sets.js';

const COLORS = ['ink', 'muted', 'blue', 'red', 'green', 'yellow', 'purple', 'teal', 'orange'];
const MIN_TEXT = 30;
const ALIGN = { left: 0, center: 0.5, right: 1 };
const col = (name, fallback = 'ink') => C[name] ?? C[fallback];
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
/** Stable JSON (sorted keys): equal specs give equal strings. */
const sig = (v) => JSON.stringify(v ?? null, (_, x) => (isObj(x) ? Object.fromEntries(Object.entries(x).sort(([p], [q]) => (p < q ? -1 : 1))) : x));
const shiftIn = () => (reducedMotion() ? [0, 0] : [0, 14]);
const fadeInAll = (mobs, delay = 0) => Promise.all(mobs.map((m) => m.fadeIn({ shift: shiftIn(), delay })));
const dropMob = (m) => m.fadeOut().then(() => m.remove());

// ---------------------------------------------------------------- validation

const BAD = Symbol('bad');

function toNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : BAD;
  if (typeof v === 'string' && v.trim()) {
    const f = parseFrac(v);
    if (f) return Number(f);
  }
  return BAD;
}
const toInt = (v) => {
  const n = toNum(v);
  return n !== BAD && Number.isInteger(n) ? n : BAD;
};
const isPair = (p) => Array.isArray(p) && p.length === 2 && p.every((x) => toInt(x) !== BAD);
const hint = (fn, text) => Object.assign(fn, { hint: text });

/** Where warnings go: `warn` prefixed with the path to the value. */
const scope = (warn, where) => ({ where, warn: (m) => warn(`${where}: ${m}`), sub: (k) => scope(warn, `${where}.${k}`) });

/** Keeps the props of `obj` that `schema` knows and accepts; warns about the rest. */
function pick(obj, schema, c, ignore = []) {
  const out = {};
  for (const [k, value] of Object.entries(obj)) {
    if (ignore.includes(k) || value === null || value === undefined) continue;
    const test = schema[k];
    if (!test) {
      c.warn(`unknown property "${k}" ignored`);
      continue;
    }
    const v = test(value, c.sub(k));
    if (v === BAD) c.warn(`"${k}" must be ${test.hint ?? 'valid'}; ignored`);
    else out[k] = v;
  }
  return out;
}

const check = {
  num: hint(toNum, 'a number'),
  int: hint(toInt, 'a whole number'),
  str: hint((v) => (typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : BAD), 'a string'),
  bool: hint((v) => (typeof v === 'boolean' ? v : BAD), 'true or false'),
  color: hint((v) => (COLORS.includes(v) ? v : BAD), `a color name (${COLORS.join(', ')})`),
  one: (...opts) => hint((v) => (opts.includes(v) ? v : BAD), opts.map((o) => JSON.stringify(o)).join(' | ')),
  nums: (n) =>
    hint((v) => {
      if (!Array.isArray(v) || (n && v.length !== n)) return BAD;
      const out = v.map(toNum);
      return out.includes(BAD) ? BAD : out;
    }, n ? `${n} numbers` : 'a list of numbers'),
  ints: hint((v) => {
    const list = Array.isArray(v) ? v : [v];
    const out = list.map(toInt);
    return out.includes(BAD) ? BAD : out;
  }, 'a list of whole numbers'),
  strs: (min, max) =>
    hint((v) => (Array.isArray(v) && v.length >= min && v.length <= max && v.every((s) => typeof s === 'string' || typeof s === 'number') ? v.map(String) : BAD), `a list of ${min}–${max} strings`),
  pair: hint((v) => (isPair(v) ? v.map(toInt) : BAD), 'a pair [i, j] of whole numbers'),
  pairs: hint((v) => {
    const list = isPair(v) ? [v] : v;
    return Array.isArray(list) && list.every(isPair) ? list.map((p) => p.map(toInt)) : BAD;
  }, 'a list of [i, j] pairs'),
  mat2: hint((v) => {
    if (!Array.isArray(v) || v.length !== 2 || !v.every((r) => Array.isArray(r) && r.length === 2)) return BAD;
    const out = v.map((r) => r.map(toNum));
    return out.flat().includes(BAD) ? BAD : out;
  }, 'a 2 × 2 matrix [[a, b], [c, d]]'),
  pts: hint((v) => {
    if (!Array.isArray(v) || v.length < 3) return BAD;
    const out = v.map((p) => (Array.isArray(p) && p.length === 2 ? p.map(toNum) : [BAD]));
    return out.flat().includes(BAD) ? BAD : out;
  }, 'a list of at least 3 points [a, b]'),
  /** A number, or null / "inf" / "-inf" for an unbounded end (resolved by the caller). */
  end: hint((v) => (typeof v === 'string' && /^[+-]?(inf|infinity|∞)$/i.test(v.trim()) ? (v.trim().startsWith('-') ? -Infinity : Infinity) : toNum(v)), 'a number, or null for ±∞'),
  obj: (schema) => hint((v, c) => (isObj(v) ? pick(v, schema, c) : BAD), 'an object'),
  /** A list of objects; bare values become { [primary]: value }. */
  list: (schema, primary) =>
    hint((v, c) => {
      const items = Array.isArray(v) ? v : [v];
      const out = [];
      items.forEach((item, k) => {
        if (primary && !isObj(item)) item = { [primary]: item };
        if (!isObj(item)) return c.warn(`item ${k} is not an object; skipped`);
        out.push(pick(item, schema, c.sub(k)));
      });
      return out;
    }, 'a list of objects'),
  either: (...tests) =>
    hint((v, c) => {
      for (const t of tests) {
        const r = t(v, c);
        if (r !== BAD) return r;
      }
      return BAD;
    }, tests.map((t) => t.hint).join(', or ')),
};

const minSize = (size, c, min = MIN_TEXT) => {
  if (size >= min) return size;
  c.warn(`size ${size} raised to ${min}`);
  return min;
};
/** Keeps the list items that have `field`. */
const need = (list, field, c, what) =>
  (list ?? []).filter((item, k) => {
    if (item[field] !== undefined) return true;
    c.warn(`${what} ${k} needs "${field}"; skipped`);
    return false;
  });
const inRange = (list, ok, c, what) =>
  (list ?? []).filter((x) => {
    if (ok(x)) return true;
    c.warn(`${what} ${JSON.stringify(x)} is out of range; skipped`);
    return false;
  });
const offStage = (c, x0, y0, x1, y1) => {
  if (x0 < -4 || y0 < -4 || x1 > 964 || y1 > 604) c.warn('runs off the 960 × 600 stage');
};

// ---------------------------------------------------------------- 2 × 2 helpers (plane maps)

const I2 = [[1, 0], [0, 1]];
const mul2 = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
const inv2 = (M) => {
  const d = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  return Math.abs(d) < 1e-12 ? null : [[M[1][1] / d, -M[0][1] / d], [-M[1][0] / d, M[0][0] / d]];
};

// ---------------------------------------------------------------- nested objects of plane / space

/**
 * Keeps a component's sub-objects (vectors, points, …) in step with a spec. `table`: list name →
 * { make(inst, item) → obj, update(obj, a, b) → Promise | null (null: replace), enter(obj, delay) → Promise }.
 * Items match by id, else by position in their list.
 */
function kidEntries(spec, table) {
  const out = new Map();
  for (const [list, def] of Object.entries(table)) (spec[list] ?? []).forEach((item, k) => out.set(`${list}:${item.id ?? `#${k}`}`, { def, item }));
  return out;
}

function syncKids(inst, table, b, delay) {
  const jobs = [];
  const want = kidEntries(b, table);
  for (const [k, kid] of inst.kids) {
    if (want.has(k)) continue;
    inst.kids.delete(k);
    jobs.push(dropMob(kid.obj));
  }
  for (const [k, { def, item }] of want) {
    const kid = inst.kids.get(k);
    if (kid) {
      if (sig(kid.item) === sig(item)) continue;
      const job = def.update(kid.obj, kid.item, item);
      if (job) {
        kid.item = item;
        jobs.push(job);
        continue;
      }
      jobs.push(dropMob(kid.obj));
    }
    const obj = def.make(inst, item);
    inst.kids.set(k, { obj, item });
    jobs.push(def.enter(obj, delay));
  }
  return jobs;
}

function makeKids(inst, table, spec) {
  for (const [k, { def, item }] of kidEntries(spec, table)) inst.kids.set(k, { obj: def.make(inst, item), item });
}
const enterKids = (inst, delay) => [...inst.kids.values()].map(({ obj }) => (obj.grow ? obj.grow({ delay }) : obj.draw({ delay })));

const recolorKid = (obj, color) => Promise.all([obj.recolor(color), obj.label?.recolor(color)]);

/** A plane object follows the plane's current map unless it is fixed. */
function onPlane(inst, obj) {
  if (obj.transformable) {
    obj.T = inst.mob.matrix;
    obj.redraw();
  }
  return obj;
}

const lineOf = (s) => (s.dir ? { through: s.through ?? [0, 0], dir: s.dir } : { a: s.a ?? 0, b: s.b ?? 0, c: s.c ?? 0 });

const PLANE_KIDS = {
  vectors: {
    make: (inst, s) => onPlane(inst, inst.mob.vector(s.v, { color: col(s.color, 'blue'), label: s.label, tail: s.tail, width: s.width, transform: !s.fixed })),
    update(obj, a, b) {
      if (!a.fixed !== !b.fixed || !a.label !== !b.label || a.width !== b.width) return null;
      const jobs = [];
      if (sig(a.v) !== sig(b.v)) jobs.push(obj.moveTo(b.v));
      if (sig(a.tail) !== sig(b.tail)) jobs.push(obj.moveTail(b.tail ?? [0, 0]));
      if (a.label !== b.label) obj.setLabel(b.label);
      if (a.color !== b.color) jobs.push(recolorKid(obj, col(b.color, 'blue')));
      return Promise.all(jobs);
    },
    enter: (obj, delay) => obj.grow({ delay }),
  },
  points: {
    make: (inst, s) => onPlane(inst, inst.mob.point(s.p, { color: col(s.color), label: s.label, transform: !s.fixed })),
    update: (obj, a, b) => (a.color !== b.color || a.label !== b.label || !a.fixed !== !b.fixed ? null : obj.moveTo(b.p)),
    enter: (obj, delay) => obj.draw({ delay }),
  },
  lines: {
    make: (inst, s) => onPlane(inst, inst.mob.line(lineOf(s), { color: col(s.color), dash: s.dash, width: s.width, transform: !s.fixed })),
    update(obj, a, b) {
      if (a.dash !== b.dash || a.width !== b.width || !a.fixed !== !b.fixed) return null;
      return Promise.all([sig(lineOf(a)) !== sig(lineOf(b)) && obj.moveTo(lineOf(b)), a.color !== b.color && obj.recolor(col(b.color))].filter(Boolean));
    },
    enter: (obj, delay) => obj.draw({ delay }),
  },
  span: {
    make: (inst, s) => onPlane(inst, inst.mob.span(s.v, { color: col(s.color, 'yellow') })),
    update: (obj, a, b) => Promise.all([sig(a.v) !== sig(b.v) && obj.moveTo({ through: [0, 0], dir: b.v }), a.color !== b.color && obj.recolor(col(b.color, 'yellow'))].filter(Boolean)),
    enter: (obj, delay) => obj.draw({ delay }),
  },
  polygons: {
    make: (inst, s) => onPlane(inst, inst.mob.polygon(s.points, { color: col(s.color, 'blue'), transform: !s.fixed })),
    update: (obj, a, b) => (a.color !== b.color || a.points.length !== b.points.length || !a.fixed !== !b.fixed ? null : obj.morphTo(b.points)),
    enter: (obj, delay) => obj.draw({ delay }),
  },
};

const SPACE_KIDS = {
  vectors: {
    make: (inst, s) => inst.mob.vector(s.v, { color: col(s.color, 'blue'), label: s.label, tail: s.tail }),
    update(obj, a, b) {
      if (!a.label !== !b.label) return null;
      const jobs = [];
      if (sig(a.v) !== sig(b.v)) jobs.push(obj.moveTo(b.v));
      if (sig(a.tail) !== sig(b.tail)) jobs.push(obj.moveTail(b.tail ?? [0, 0, 0]));
      if (a.label !== b.label) obj.setLabel(b.label);
      if (a.color !== b.color) jobs.push(recolorKid(obj, col(b.color, 'blue')));
      return Promise.all(jobs);
    },
    enter: (obj, delay) => obj.grow({ delay }),
  },
  points: {
    make: (inst, s) => inst.mob.point(s.p, { color: col(s.color), label: s.label }),
    update: (obj, a, b) => (a.color !== b.color || a.label !== b.label ? null : obj.moveTo(b.p)),
    enter: (obj, delay) => obj.draw({ delay }),
  },
  lines: {
    make: (inst, s) => inst.mob.line(s.through ?? [0, 0, 0], s.dir, { color: col(s.color), dash: s.dash }),
    update: () => null,
    enter: (obj, delay) => obj.draw({ delay }),
  },
  planes: {
    make: (inst, s) => (s.normal ? inst.mob.plane({ normal: s.normal, d: s.d ?? 0 }, { color: col(s.color, 'blue'), extent: s.extent }) : inst.mob.plane(s.u, s.v, { color: col(s.color, 'blue'), extent: s.extent })),
    update: () => null,
    enter: (obj, delay) => obj.draw({ delay }),
  },
};

// ---------------------------------------------------------------- matrix helpers

const normEntry = (v) => (v instanceof Frac ? v : typeof v === 'number' ? F(v) : (parseFrac(String(v)) ?? String(v)));
const texOf = (v) => (v instanceof Frac ? v.tex() : String(v));
const sameRows = (A, B) => A.length === B.length && A.every((r, i) => r.length === B[i].length && r.every((v, j) => texOf(v) === texOf(B[i][j])));

/** The single row operation taking A to B ({ op, i, j, k }), or null. */
function detectRowOp(A, B) {
  if (!A.every((r) => r.every((v) => v instanceof Frac)) || !B.every((r) => r.every((v) => v instanceof Frac))) return null;
  const eqRow = (r, s) => r.every((v, c) => v.eq(s[c]));
  const diff = A.map((_, i) => i).filter((i) => !eqRow(A[i], B[i]));
  if (diff.length === 2) {
    const [i, j] = diff;
    return eqRow(A[i], B[j]) && eqRow(A[j], B[i]) ? { op: 'swap', i, j } : null;
  }
  if (diff.length !== 1) return null;
  const i = diff[0];
  const c0 = A[i].findIndex((v) => v.sign() !== 0);
  if (c0 >= 0) {
    const k = B[i][c0].div(A[i][c0]);
    if (k.sign() !== 0 && eqRow(A[i].map((v) => v.mul(k)), B[i])) return { op: 'scale', i, k };
  }
  for (let j = 0; j < A.length; j++) {
    const c = A[j].findIndex((v) => v.sign() !== 0);
    if (j === i || c < 0) continue;
    const k = B[i][c].sub(A[i][c]).div(A[j][c]);
    if (k.sign() !== 0 && eqRow(A[i].map((v, x) => v.add(A[j][x].mul(k))), B[i])) return { op: 'add', i, j, k };
  }
  return null;
}

/** Brings a matrix's highlights, pivot rings and note to the spec (each only when it changed). */
function matrixDeco(inst, b, autoNote) {
  const m = inst.mob;
  const jobs = [];
  const hk = sig(b.highlight);
  if (hk !== inst.hl) {
    if (inst.hl !== 'null') jobs.push(m.clearHighlights());
    const h = b.highlight;
    if (h) {
      const c = col(h.color, 'yellow');
      for (const i of h.rows ?? []) jobs.push(m.highlightRow(i, c));
      for (const j of h.cols ?? []) jobs.push(m.highlightCol(j, c));
      for (const [i, j] of h.cells ?? []) jobs.push(m.highlightCell(i, j, c));
    }
    inst.hl = hk;
  }
  const pk = sig([b.pivots, b.pivotColor]);
  if (pk !== inst.piv) {
    if (inst.pivOn) jobs.push(m.clearPivots());
    for (const [i, j] of b.pivots ?? []) jobs.push(m.pivot(i, j, { color: col(b.pivotColor, 'blue') }));
    inst.pivOn = Boolean(b.pivots?.length);
    inst.piv = pk;
  }
  const note = b.note ? { row: b.note.row, tex: b.note.tex, color: b.note.color } : autoNote;
  const nk = sig(note);
  if (nk !== inst.note) {
    jobs.push(note ? m.note(note.row, note.tex, { color: col(note.color, 'muted') }) : m.note());
    inst.note = nk;
  }
  return Promise.all(jobs);
}

// ---------------------------------------------------------------- kinds

function labelKind(body) {
  const isTex = body === 'tex';
  const schema = { [body]: check.str, x: check.num, y: check.num, size: check.num, color: check.color, align: check.one('center', 'left', 'right') };
  if (!isTex) Object.assign(schema, { width: check.num, weight: check.one('normal', 'bold'), italic: check.bool, font: check.one('sans', 'serif') });
  const style = isTex ? ['align'] : ['align', 'width', 'weight', 'italic', 'font'];
  const make = (ctx, s) => {
    const opts = { x: s.x, y: s.y, size: s.size, color: col(s.color), anchor: [ALIGN[s.align], 0.5], visible: false };
    if (isTex) return ctx.stage.tex(s.tex, opts);
    return ctx.stage.text(s.text, { ...opts, align: s.align, width: s.width, weight: s.weight === 'bold' ? 600 : undefined, italic: s.italic, font: s.font });
  };
  return {
    schema,
    fix(s, c) {
      if (s[body] === undefined) return c.drop(`needs "${body}"`);
      s.x ??= 480;
      s.y ??= 300;
      s.size = minSize(s.size ?? (isTex ? 44 : 34), c);
      s.align ??= 'center';
      s.color ??= 'ink';
      return s;
    },
    create(ctx, s) {
      const mob = make(ctx, s);
      return { mob, mobs: [mob], base: s.size };
    },
    enter: (ctx, inst, delay) => (isTex ? inst.mob.write({ delay }) : fadeInAll(inst.mobs, delay)),
    update(ctx, inst, a, b) {
      const moved = a.x !== b.x || a.y !== b.y || a.size !== b.size;
      const changed = a[body] !== b[body];
      if (style.some((k) => a[k] !== b[k]) || (moved && changed)) {
        const next = make(ctx, b);
        const job = inst.mob.morphTo(next);
        Object.assign(inst, { mob: next, mobs: [next], base: b.size });
        return job;
      }
      const m = inst.mob;
      const jobs = [];
      if (moved) jobs.push(m.animate({ x: b.x, y: b.y, scale: b.size / inst.base }));
      if (changed) jobs.push(isTex ? m.swap(b.tex) : crossfade(m, () => m.setText(b.text)));
      if (a.color !== b.color) jobs.push(m.recolor(col(b.color)));
      return Promise.all(jobs);
    },
  };
}

async function crossfade(mob, apply) {
  await mob.animate({ opacity: 0 }, { duration: 220, ease: ease.out });
  apply();
  await mob.animate({ opacity: 1 }, { duration: 320, ease: ease.out });
}

const KINDS = {
  tex: labelKind('tex'),
  text: labelKind('text'),

  matrix: {
    schema: {
      rows: hint((v) => (Array.isArray(v) && v.length && v.every((r) => Array.isArray(r) && r.length && r.every((x) => (typeof x === 'number' && Number.isFinite(x)) || typeof x === 'string')) ? v : BAD), 'a list of rows of numbers or strings'),
      x: check.num,
      y: check.num,
      size: check.num,
      augment: check.int,
      brackets: check.one('[]', '()', '||', 'none'),
      color: check.color,
      highlight: check.obj({ rows: check.ints, cols: check.ints, cells: check.pairs, color: check.color }),
      pivots: check.pairs,
      pivotColor: check.color,
      note: check.obj({ row: check.int, tex: check.str, color: check.color }),
      rowop: check.bool,
    },
    fix(s, c) {
      if (!s.rows) return c.drop('needs "rows"');
      const n = Math.max(...s.rows.map((r) => r.length));
      if (s.rows.some((r) => r.length < n)) {
        c.warn('rows have different lengths; padded with blanks');
        s.rows = s.rows.map((r) => [...r, ...Array(n - r.length).fill('')]);
      }
      const m = s.rows.length;
      s.x ??= 480;
      s.y ??= 300;
      s.size = minSize(s.size ?? 40, c);
      if (s.augment !== undefined && !(s.augment > 0 && s.augment < n)) {
        c.warn(`augment ${s.augment} is not between 1 and ${n - 1}; ignored`);
        delete s.augment;
      }
      const row = (i) => i >= 0 && i < m;
      const cell = ([i, j]) => row(i) && j >= 0 && j < n;
      if (s.highlight) {
        const h = s.highlight;
        h.rows = inRange(h.rows, row, c, 'highlight row');
        h.cols = inRange(h.cols, (j) => j >= 0 && j < n, c, 'highlight column');
        h.cells = inRange(h.cells, cell, c, 'highlight cell');
      }
      if (s.pivots) s.pivots = inRange(s.pivots, cell, c, 'pivot');
      if (s.note && (s.note.tex === undefined || !row(s.note.row ?? -1))) {
        c.warn('note needs "row" (a row index) and "tex"; ignored');
        delete s.note;
      }
      return s;
    },
    create(ctx, s) {
      const mob = ctx.stage.matrix(s.rows, { x: s.x, y: s.y, size: s.size, augment: s.augment ?? null, brackets: s.brackets ?? '[]', color: s.color && col(s.color), visible: false });
      const inst = { mob, mobs: [mob], base: s.size, hl: 'null', piv: sig([undefined, undefined]), pivOn: false, note: 'null' };
      matrixDeco(inst, s, null);
      return inst;
    },
    update(ctx, inst, a, b) {
      if (a.augment !== b.augment || a.brackets !== b.brackets) return null;
      const m = inst.mob;
      const jobs = [];
      if (a.x !== b.x || a.y !== b.y || a.size !== b.size) jobs.push(m.animate({ x: b.x, y: b.y, scale: b.size / inst.base }));
      if (a.color !== b.color) jobs.push(m.recolor(col(b.color)));
      const A = m.values();
      const B = b.rows.map((r) => r.map(normEntry));
      if (A.length !== B.length || A[0].length !== B[0].length) {
        // another shape: the matrix crossfades to a rebuilt one, which has no highlights, rings or note yet
        jobs.push(
          m.setRows(b.rows).then(() => {
            if (!ctx.alive()) return;
            Object.assign(inst, { hl: 'null', piv: sig([undefined, undefined]), pivOn: false, note: 'null' });
            return matrixDeco(inst, b, null);
          }),
        );
        return Promise.all(jobs);
      }
      let auto = null;
      if (!sameRows(A, B)) {
        const op = b.rowop === false ? null : detectRowOp(A, B);
        if (op) {
          jobs.push(m.rowOp(op, { note: false }));
          auto = { row: op.i, tex: texRowOp(op) };
        } else jobs.push(m.setRows(b.rows));
      }
      jobs.push(matrixDeco(inst, b, auto));
      return Promise.all(jobs);
    },
  },

  plane: {
    schema: {
      x: check.num,
      y: check.num,
      width: check.num,
      height: check.num,
      range: check.nums(4),
      step: check.num,
      grid: check.bool,
      axes: check.bool,
      labels: check.bool,
      names: check.strs(2, 2),
      matrix: check.mat2,
      basis: check.bool,
      vectors: check.list({ id: check.str, v: check.nums(2), tail: check.nums(2), color: check.color, label: check.str, fixed: check.bool, width: check.num }, 'v'),
      points: check.list({ id: check.str, p: check.nums(2), color: check.color, label: check.str, fixed: check.bool }, 'p'),
      lines: check.list({ id: check.str, through: check.nums(2), dir: check.nums(2), a: check.num, b: check.num, c: check.num, color: check.color, dash: check.bool, width: check.num, fixed: check.bool }),
      span: hint((v, c) => {
        const items = Array.isArray(v) && v.length === 2 && v.every((x) => toNum(x) !== BAD) ? [v] : Array.isArray(v) ? v : [v];
        return check.list({ id: check.str, v: check.nums(2), color: check.color }, 'v')(items, c);
      }, '[a, b] or a list of { v: [a, b], color }'),
      polygons: check.list({ id: check.str, points: check.pts, color: check.color, fixed: check.bool }, 'points'),
    },
    fix(s, c) {
      s.x ??= 480;
      s.y ??= 300;
      s.width ??= 520;
      s.range ??= [-5, 5, -4, 4];
      const [x0, x1, y0, y1] = s.range;
      if (!(x1 > x0 && y1 > y0)) {
        c.warn('range must be [xmin, xmax, ymin, ymax] with min < max; using [-5, 5, -4, 4]');
        s.range = [-5, 5, -4, 4];
      }
      const h = s.height ?? (s.width * (s.range[3] - s.range[2])) / (s.range[1] - s.range[0]);
      offStage(c, s.x - s.width / 2, s.y - h / 2, s.x + s.width / 2, s.y + h / 2);
      if (s.step !== undefined && !(s.step > 0)) delete s.step;
      s.vectors = need(s.vectors, 'v', c, 'vector');
      if (s.basis) s.vectors.unshift({ id: '_i', v: [1, 0], color: 'green', label: '\\hat{\\imath}' }, { id: '_j', v: [0, 1], color: 'red', label: '\\hat{\\jmath}' });
      s.points = need(s.points, 'p', c, 'point');
      s.lines = (s.lines ?? []).filter((l, k) => (l.dir && (l.dir[0] || l.dir[1])) || (!l.dir && (l.a || l.b)) || c.warn(`line ${k} needs "dir" (with "through") or "a", "b", "c"; skipped`));
      s.span = need(s.span, 'v', c, 'span');
      s.polygons = need(s.polygons, 'points', c, 'polygon');
      return s;
    },
    create(ctx, s) {
      const p = ctx.stage.plane({ x: s.x, y: s.y, width: s.width, height: s.height, range: s.range, step: s.step, grid: s.grid, axes: s.axes, labels: s.labels, names: s.names ?? null, visible: false });
      const inst = { mob: p, mobs: [p], kids: new Map(), x0: s.x, y0: s.y };
      makeKids(inst, PLANE_KIDS, s);
      if (s.matrix && sig(s.matrix) !== sig(I2)) p.applyMatrix(s.matrix, { duration: 0 });
      return inst;
    },
    enter: (ctx, inst, delay) => Promise.all([inst.mob.draw({ duration: 900, delay }), ...enterKids(inst, delay + 550)]),
    update(ctx, inst, a, b) {
      if (['width', 'height', 'range', 'step', 'grid', 'axes', 'labels', 'names'].some((k) => sig(a[k]) !== sig(b[k]))) return null;
      const p = inst.mob;
      const jobs = [];
      if (a.x !== b.x || a.y !== b.y) jobs.push(p.animate({ x: b.x - inst.x0, y: b.y - inst.y0 }));
      // new objects are made under the old map first, so the map change carries them along with the rest
      jobs.push(...syncKids(inst, PLANE_KIDS, b, 200));
      const M0 = a.matrix ?? I2;
      const M1 = b.matrix ?? I2;
      if (sig(M0) !== sig(M1)) {
        const inv = inv2(M0);
        if (inv) jobs.push(p.applyMatrix(mul2(M1, inv)));
        else {
          p.resetMatrix();
          jobs.push(p.applyMatrix(M1));
        }
      }
      return Promise.all(jobs);
    },
  },

  space: {
    schema: {
      x: check.num,
      y: check.num,
      size: check.num,
      range: check.num,
      yaw: check.num,
      pitch: check.num,
      axes: check.bool,
      names: check.strs(3, 3),
      vectors: check.list({ id: check.str, v: check.nums(3), tail: check.nums(3), color: check.color, label: check.str }, 'v'),
      points: check.list({ id: check.str, p: check.nums(3), color: check.color, label: check.str }, 'p'),
      lines: check.list({ id: check.str, through: check.nums(3), dir: check.nums(3), color: check.color, dash: check.bool }),
      planes: check.list({ id: check.str, u: check.nums(3), v: check.nums(3), normal: check.nums(3), d: check.num, color: check.color, extent: check.num }),
    },
    fix(s, c) {
      s.x ??= 480;
      s.y ??= 300;
      s.size ??= 440;
      s.range = s.range > 0 ? s.range : 3;
      s.yaw ??= -35;
      s.pitch ??= 20;
      s.vectors = need(s.vectors, 'v', c, 'vector');
      s.points = need(s.points, 'p', c, 'point');
      s.lines = need(s.lines, 'dir', c, 'line');
      s.planes = (s.planes ?? []).filter((q, k) => q.normal || (q.u && q.v) || c.warn(`plane ${k} needs "u" and "v", or "normal" (and "d"); skipped`));
      return s;
    },
    create(ctx, s) {
      const sp = ctx.stage.space({ x: s.x, y: s.y, size: s.size, range: s.range, yaw: s.yaw, pitch: s.pitch, axes: s.axes, names: s.names, visible: false });
      const inst = { mob: sp, mobs: [sp], kids: new Map(), x0: s.x, y0: s.y };
      makeKids(inst, SPACE_KIDS, s);
      return inst;
    },
    enter: (ctx, inst, delay) => Promise.all([inst.mob.draw({ delay }), ...enterKids(inst, delay + 500)]),
    update(ctx, inst, a, b) {
      if (['size', 'range', 'axes', 'names'].some((k) => sig(a[k]) !== sig(b[k]))) return null;
      const sp = inst.mob;
      const jobs = [];
      if (a.x !== b.x || a.y !== b.y) jobs.push(sp.animate({ x: b.x - inst.x0, y: b.y - inst.y0 }));
      if (a.yaw !== b.yaw || a.pitch !== b.pitch) jobs.push(sp.rotate(b.yaw, b.pitch));
      jobs.push(...syncKids(inst, SPACE_KIDS, b, 200));
      return Promise.all(jobs);
    },
  },

  arrow: {
    schema: { from: check.nums(2), to: check.nums(2), color: check.color, width: check.num, dash: check.bool, label: check.str },
    fix(s, c) {
      if (!s.from || !s.to) return c.drop('needs "from" and "to"');
      s.color ??= 'ink';
      return s;
    },
    create(ctx, s) {
      const a = ctx.stage.arrow(...s.from, ...s.to, { color: col(s.color), width: s.width ?? 4, dash: s.dash, visible: false });
      const inst = { mob: a, mobs: [a], label: null };
      if (s.label) {
        inst.label = ctx.stage.tex(s.label, { ...arrowLabelAt(s), size: 34, color: col(s.color), visible: false });
        inst.mobs.push(inst.label);
      }
      return inst;
    },
    enter: (ctx, inst, delay) => Promise.all([inst.mob.draw({ delay }), inst.label?.fadeIn({ shift: [0, 0], delay: delay + 450 })]),
    update(ctx, inst, a, b) {
      if (!a.label !== !b.label || a.width !== b.width || a.dash !== b.dash) return null;
      const jobs = [];
      if (sig([a.from, a.to]) !== sig([b.from, b.to])) {
        jobs.push(inst.mob.setEnds(...b.from, ...b.to));
        if (inst.label) jobs.push(inst.label.moveTo(arrowLabelAt(b).x, arrowLabelAt(b).y));
      }
      if (a.label !== b.label) jobs.push(inst.label.swap(b.label));
      if (a.color !== b.color) jobs.push(...inst.mobs.map((m) => m.recolor(col(b.color))));
      return Promise.all(jobs);
    },
  },

  box: {
    schema: {
      x: check.num,
      y: check.num,
      w: check.num,
      h: check.num,
      around: check.either(check.str, check.strs(1, 20)),
      row: check.int,
      col: check.int,
      cell: check.pair,
      pad: check.num,
      color: check.color,
      radius: check.num,
      width: check.num,
      dash: check.bool,
    },
    fix(s, c) {
      if (s.around !== undefined) s.around = [s.around].flat();
      else if (!(s.w > 0 && s.h > 0)) return c.drop('needs "around", or "w" and "h"');
      s.x ??= 480;
      s.y ??= 300;
      s.color ??= 'yellow';
      return s;
    },
    deps: (s) => s.around ?? [],
    always: true,
    create(ctx, s) {
      const b = boxGeometry(ctx, s);
      if (!b) return null;
      const r = ctx.stage.rect(b.x, b.y, b.w, b.h, { color: col(s.color, 'yellow'), radius: s.radius ?? 12, width: s.width ?? 3, dash: s.dash, layer: 'front', visible: false });
      return { mob: r, mobs: [r] };
    },
    enter: (ctx, inst, delay) => inst.mob.draw({ delay, duration: 700 }),
    update(ctx, inst, a, b) {
      if (a.radius !== b.radius || a.width !== b.width || a.dash !== b.dash) return null;
      const g = boxGeometry(ctx, b);
      if (!g) return null;
      const jobs = [];
      if (sig(inst.mob.rect.map((v) => Math.round(v))) !== sig([g.x, g.y, g.w, g.h].map((v) => Math.round(v)))) jobs.push(inst.mob.resize(g.x, g.y, g.w, g.h));
      if (a.color !== b.color) jobs.push(inst.mob.recolor(col(b.color, 'yellow')));
      return Promise.all(jobs);
    },
  },

  truthTable: {
    schema: {
      vars: check.strs(1, 4),
      cols: check.list({ tex: check.str, values: hint((v) => (Array.isArray(v) ? v : BAD), 'a list of T/F values'), hidden: check.bool }),
      x: check.num,
      y: check.num,
      size: check.num,
      T: check.str,
      F: check.str,
      highlightRows: check.ints,
      highlightCol: check.either(check.int, check.str),
      highlightColor: check.color,
      marks: hint((v) => (Array.isArray(v) ? v.map((m) => (m === true ? '✓' : m === false ? '✗' : m == null || m === '' ? null : String(m))) : BAD), 'a list with one mark ("✓", "✗" or null) per row'),
    },
    fix(s, c) {
      s.vars ??= ['P', 'Q'];
      const rows = 2 ** s.vars.length;
      const truth = (v) => (typeof v === 'string' ? /^(t|true|1)$/i.test(v.trim()) : Boolean(v));
      s.cols = need(s.cols, 'tex', c, 'column').map((col, k) => {
        let values = (col.values ?? []).map(truth);
        if (values.length !== rows) {
          c.warn(`column ${k} needs ${rows} values (one per row); ${values.length < rows ? 'padded with F' : 'cut'}`);
          values = [...values, ...Array(rows).fill(false)].slice(0, rows);
        }
        return { ...col, values };
      });
      s.x ??= 480;
      s.y ??= 300;
      s.size = minSize(s.size ?? 32, c);
      s.highlightRows = inRange(s.highlightRows, (i) => i >= 0 && i < rows, c, 'highlighted row');
      if (s.marks) s.marks = s.marks.slice(0, rows);
      return s;
    },
    create(ctx, s) {
      const cols = s.cols.map((col) => ({ tex: col.tex, fn: (_, i) => col.values[i] }));
      const t = ctx.stage.truthTable({ x: s.x, y: s.y, vars: s.vars, cols, size: s.size, T: s.T ?? 'T', F: s.F ?? 'F', show: 'vars', visible: false });
      const inst = { mob: t, mobs: [t], deco: 'null' };
      s.cols.forEach((col, j) => !col.hidden && t.revealCol(s.vars.length + j, { stagger: 0 }));
      tableDeco(ctx, inst, s);
      return inst;
    },
    update(ctx, inst, a, b) {
      const shape = (s) => sig([s.vars, s.cols.map((col) => [col.tex, col.values]), s.size, s.T, s.F]);
      if (shape(a) !== shape(b) || a.cols.some((col, j) => !col.hidden && b.cols[j].hidden)) return null;
      const t = inst.mob;
      const jobs = [];
      if (a.x !== b.x || a.y !== b.y) jobs.push(t.animate({ x: b.x, y: b.y }));
      b.cols.forEach((col, j) => a.cols[j].hidden && !col.hidden && jobs.push(t.fillColumn(b.vars.length + j)));
      jobs.push(tableDeco(ctx, inst, b));
      return Promise.all(jobs);
    },
  },

  venn: {
    schema: {
      sets: check.either(check.int, check.strs(1, 3)),
      labels: check.strs(1, 3),
      x: check.num,
      y: check.num,
      r: check.num,
      universe: check.bool,
      size: check.num,
      shade: check.list({ region: check.str, color: check.color }, 'region'),
      elements: check.list({ id: check.str, region: check.str, label: check.str, color: check.color }, 'region'),
      outline: check.list({ set: check.str, color: check.color }, 'set'),
    },
    fix(s, c) {
      const names = typeof s.sets === 'number' ? ['A', 'B', 'C'].slice(0, Math.max(1, Math.min(3, s.sets))) : (s.sets ?? ['A', 'B']);
      s.sets = names;
      s.x ??= 480;
      s.y ??= 300;
      s.size = minSize(s.size ?? 36, c);
      const valid = (item, k, what) => {
        try {
          compileRegion(item.region, names);
          return true;
        } catch {
          c.warn(`${what} ${k}: cannot read region "${item.region}" (sets are ${names.join(', ')}); skipped`);
          return false;
        }
      };
      s.shade = need(s.shade, 'region', c, 'shade').filter((item, k) => valid(item, k, 'shade'));
      s.elements = need(s.elements, 'region', c, 'element').filter((item, k) => valid(item, k, 'element'));
      s.outline = need(s.outline, 'set', c, 'outline').filter((o) => names.includes(o.set) || o.set === 'U' || c.warn(`outline: no set "${o.set}"; skipped`));
      return s;
    },
    create(ctx, s) {
      const v = ctx.stage.venn({ sets: s.sets, labels: s.labels, x: s.x, y: s.y, r: s.r, universe: s.universe ?? true, size: s.size, visible: false });
      const inst = { mob: v, mobs: [v], shade: new Map(), els: new Map(), outlines: new Map() };
      vennSync(inst, s);
      return inst;
    },
    update(ctx, inst, a, b) {
      if (['sets', 'labels', 'r', 'universe', 'size'].some((k) => sig(a[k]) !== sig(b[k]))) return null;
      const jobs = vennSync(inst, b);
      if (a.x !== b.x || a.y !== b.y) jobs.push(inst.mob.animate({ x: b.x, y: b.y }));
      return Promise.all(jobs);
    },
  },

  mapDiagram: {
    schema: {
      domain: check.strs(1, 12),
      codomain: check.strs(1, 12),
      arrows: check.pairs,
      labels: check.strs(0, 2),
      name: check.str,
      x: check.num,
      y: check.num,
      gap: check.num,
      spacing: check.num,
      size: check.num,
      highlight: check.list({ side: check.one('dom', 'cod'), i: check.int, color: check.color }),
      show: hint((v) => ([v].flat().every((x) => x === 'collision' || x === 'missed') ? [v].flat() : BAD), '"collision", "missed" or both in a list'),
      inverted: check.bool,
    },
    fix(s, c) {
      if (!s.domain || !s.codomain) return c.drop('needs "domain" and "codomain"');
      s.x ??= 480;
      s.y ??= 300;
      s.size = minSize(s.size ?? 32, c);
      const fits = ([i, j]) => i >= 0 && i < s.domain.length && j >= 0 && j < s.codomain.length;
      s.arrows = inRange(s.arrows, fits, c, 'arrow');
      s.highlight = inRange(need(s.highlight, 'i', c, 'highlight'), (h) => h.i >= 0 && h.i < (h.side === 'cod' ? s.codomain : s.domain).length, c, 'highlight');
      s.show ??= [];
      return s;
    },
    create(ctx, s) {
      const f = ctx.stage.mapDiagram({ domain: s.domain, codomain: s.codomain, arrows: s.arrows, labels: s.labels ?? ['A', 'B'], name: s.name, gap: s.gap, spacing: s.spacing, size: s.size, x: s.x, y: s.y, visible: false });
      if (s.inverted) f.invert({ duration: 0 });
      const inst = { mob: f, mobs: [f], deco: 'null' };
      mapDeco(ctx, inst, s);
      return inst;
    },
    update(ctx, inst, a, b) {
      if (['domain', 'codomain', 'labels', 'name', 'gap', 'spacing', 'size'].some((k) => sig(a[k]) !== sig(b[k]))) return null;
      const f = inst.mob;
      const jobs = [];
      if (a.x !== b.x || a.y !== b.y) jobs.push(f.animate({ x: b.x, y: b.y }));
      const had = new Set(a.arrows.map((p) => sig(p)));
      const has = new Set(b.arrows.map((p) => sig(p)));
      for (const [i, j] of a.arrows) if (!has.has(sig([i, j]))) jobs.push(f.removeArrow(i, j));
      for (const [i, j] of b.arrows) if (!had.has(sig([i, j]))) jobs.push(f.addArrow(i, j));
      if (!a.inverted !== !b.inverted) jobs.push(f.invert());
      jobs.push(Promise.all(jobs.slice()).then(() => ctx.alive() && mapDeco(ctx, inst, b)));
      return Promise.all(jobs);
    },
  },

  numberLine: {
    schema: {
      x: check.num,
      y: check.num,
      width: check.num,
      range: check.nums(2),
      ticks: check.num,
      labels: check.either(check.bool, check.int),
      size: check.num,
      arrows: check.bool,
      points: check.list({ id: check.str, v: check.num, label: check.str, color: check.color, open: check.bool }, 'v'),
      intervals: check.list({ id: check.str, a: check.end, b: check.end, openA: check.bool, openB: check.bool, color: check.color }),
      band: check.obj({ center: check.num, eps: check.num, color: check.color, label: check.str }),
    },
    fix(s, c) {
      s.x ??= 480;
      s.y ??= 300;
      s.width ??= 800;
      s.range ??= [-5, 5];
      if (!(s.range[1] > s.range[0])) {
        c.warn('range must be [min, max] with min < max; using [-5, 5]');
        s.range = [-5, 5];
      }
      if (s.ticks !== undefined && !(s.ticks > 0 && (s.range[1] - s.range[0]) / s.ticks <= 200)) {
        c.warn('ticks must be a positive spacing (at most 200 ticks); using 1');
        delete s.ticks;
      }
      s.size = minSize(s.size ?? 30, c);
      offStage(c, s.x - s.width / 2 - 40, s.y - 40, s.x + s.width / 2 + 40, s.y + 50);
      s.points = need(s.points, 'v', c, 'point');
      s.intervals = (s.intervals ?? []).map((it) => ({ ...it, a: it.a ?? -Infinity, b: it.b ?? Infinity }));
      if (s.band && (s.band.center === undefined || !(s.band.eps >= 0))) {
        c.warn('band needs "center" and "eps" ≥ 0; ignored');
        delete s.band;
      }
      return s;
    },
    create(ctx, s) {
      const nl = ctx.stage.numberLine({ x: s.x, y: s.y, width: s.width, range: s.range, ticks: s.ticks ?? 1, labels: s.labels ?? true, size: s.size, arrows: s.arrows ?? true, visible: false });
      const inst = { mob: nl, mobs: [nl], points: new Map(), intervals: new Map(), band: null };
      lineSync(inst, s);
      return inst;
    },
    update(ctx, inst, a, b) {
      if (['width', 'range', 'ticks', 'labels', 'size', 'arrows'].some((k) => sig(a[k]) !== sig(b[k]))) return null;
      const jobs = lineSync(inst, b);
      if (a.x !== b.x || a.y !== b.y) jobs.push(inst.mob.animate({ x: b.x, y: b.y }));
      return Promise.all(jobs);
    },
  },

  proof: {
    schema: {
      x: check.num,
      y: check.num,
      width: check.num,
      height: check.num,
      size: check.num,
      numbered: check.bool,
      lines: check.list({ text: check.str, why: check.str, kind: check.one('step', 'assume', 'conclude', 'contradiction'), indent: check.int, tex: check.bool, note: check.str }, 'text'),
      highlight: check.ints,
      strike: check.ints,
      qed: check.bool,
    },
    fix(s, c) {
      s.x ??= 480;
      s.y ??= 70;
      s.size = minSize(s.size ?? 30, c);
      s.lines = need(s.lines, 'text', c, 'line');
      const ok = (i) => i >= 0 && i < s.lines.length;
      s.highlight = inRange(s.highlight, ok, c, 'highlighted line');
      s.strike = inRange(s.strike, ok, c, 'struck line');
      return s;
    },
    create(ctx, s) {
      const pr = ctx.stage.proof({ x: s.x, y: s.y, width: s.width, height: s.height, size: s.size, numbered: s.numbered ?? true, visible: false });
      return { mob: pr, mobs: [pr] };
    },
    enter: (ctx, inst, delay) => Promise.all([inst.mob.fadeIn({ shift: [0, 0], delay }), proofSync(ctx, inst, null, inst.spec)]),
    update(ctx, inst, a, b) {
      if (['width', 'height', 'size', 'numbered'].some((k) => a[k] !== b[k])) return null;
      const jobs = [proofSync(ctx, inst, a, b)];
      if (a.x !== b.x || a.y !== b.y) jobs.push(inst.mob.animate({ x: b.x, y: b.y }));
      return Promise.all(jobs);
    },
  },
};

/** Midpoint of an arrow, pushed off to its left (above a left-to-right arrow). */
function arrowLabelAt(s) {
  const [x1, y1] = s.from;
  const [x2, y2] = s.to;
  const L = Math.hypot(x2 - x1, y2 - y1) || 1;
  return { x: (x1 + x2) / 2 + ((y2 - y1) / L) * 30, y: (y1 + y2) / 2 - ((x2 - x1) / L) * 30 };
}

/** Stage box (top-left x, y, w, h) a box object outlines; null (with a warning) when its target is missing. */
function boxGeometry(ctx, s) {
  const pad = s.pad ?? 10;
  if (!s.around) return { x: s.x - s.w / 2, y: s.y - s.h / 2, w: s.w, h: s.h };
  const boxes = [];
  for (const id of s.around) {
    const target = ctx.live.get(id);
    if (!target) {
      ctx.warn(`box: no object "${id}" in this frame`);
      continue;
    }
    const m = target.mob;
    let b = null;
    if (target.kind === 'matrix' && (s.row !== undefined || s.col !== undefined || s.cell)) {
      const [i, j] = s.cell ?? [s.row, s.col];
      if (s.cell || s.row !== undefined) {
        if (i >= 0 && i < m.m && (s.cell === undefined || (j >= 0 && j < m.n))) b = s.cell ? m.cellBox(i, j) : m.rowBox(i);
      } else if (j >= 0 && j < m.n) b = m.colBox(j);
      if (!b) ctx.warn(`box: "${id}" has no such row, column or cell`);
    } else b = m.box();
    if (b) boxes.push(b);
  }
  if (!boxes.length) return null;
  const x0 = Math.min(...boxes.map((b) => b.x)) - pad;
  const y0 = Math.min(...boxes.map((b) => b.y)) - pad;
  const x1 = Math.max(...boxes.map((b) => b.x + b.w)) + pad;
  const y1 = Math.max(...boxes.map((b) => b.y + b.h)) + pad;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Truth-table highlights and marks: cleared and redone when they change. */
function tableDeco(ctx, inst, s) {
  const key = sig([s.highlightRows, s.highlightCol, s.highlightColor, s.marks]);
  if (key === inst.deco) return Promise.resolve();
  const t = inst.mob;
  const first = inst.deco === 'null';
  inst.deco = key;
  const apply = () => {
    if (!ctx.alive()) return;
    const color = s.highlightColor ?? 'yellow';
    const jobs = [];
    if (s.highlightRows?.length) jobs.push(t.highlightRows(s.highlightRows, color));
    if (s.highlightCol !== undefined) {
      try {
        jobs.push(t.highlightCol(s.highlightCol, color));
      } catch {
        ctx.warn(`truthTable: no column ${JSON.stringify(s.highlightCol)} to highlight`);
      }
    }
    (s.marks ?? []).forEach((m, i) => m && jobs.push(t.markRow(i, m)));
    return Promise.all(jobs);
  };
  return first ? apply() : t.clear().then(apply);
}

/** Map-diagram highlights and collision / missed marks: cleared and redone when they change. */
function mapDeco(ctx, inst, s) {
  const key = sig([s.highlight, s.show, s.show.length ? s.arrows : null]);
  if (key === inst.deco) return Promise.resolve();
  const f = inst.mob;
  const first = inst.deco === 'null';
  inst.deco = key;
  const apply = () => {
    if (!ctx.alive()) return;
    const jobs = s.highlight.map((h) => f.highlightElement(h.side ?? 'dom', h.i, h.color ?? 'yellow'));
    if (s.show.includes('collision')) jobs.push(f.showCollision());
    if (s.show.includes('missed')) jobs.push(f.showMissed());
    return Promise.all(jobs);
  };
  return first ? apply() : f.clear().then(apply);
}

/** Venn shading (per atomic region), elements and outlines brought to the spec. */
function vennSync(inst, s) {
  const v = inst.mob;
  const jobs = [];
  const atomCode = (bits) => s.sets.map((n, i) => ((bits >> i) & 1 ? n : `!${n}`)).join('&');
  const want = new Map();
  for (const item of s.shade) for (const bits of v.atoms(item.region)) want.set(bits, item.color ?? 'blue');
  for (const bits of inst.shade.keys()) if (!want.has(bits)) jobs.push(v.unshade(atomCode(bits)));
  for (const [bits, color] of want) if (inst.shade.get(bits) !== color) jobs.push(v.shade(atomCode(bits), { color }));
  inst.shade = want;

  const seen = {};
  const els = new Map(
    s.elements.map((e) => {
      const pair = `${e.region}|${e.label ?? ''}`;
      seen[pair] = (seen[pair] ?? 0) + 1;
      return [e.id ?? `${pair}|${seen[pair]}`, e];
    }),
  );
  for (const [k, part] of inst.els) {
    const e = els.get(k);
    if (e && sig(e) === sig(part.spec)) continue;
    inst.els.delete(k);
    jobs.push(part.fadeOut());
  }
  for (const [k, e] of els) {
    if (inst.els.has(k)) continue;
    const part = v.element(e.region, e.label ?? '', { color: e.color });
    part.spec = e;
    inst.els.set(k, part);
    jobs.push(part.then());
  }

  const outlines = new Map(s.outline.map((o) => [o.set, o.color ?? 'blue']));
  for (const set of inst.outlines.keys()) if (!outlines.has(set)) jobs.push(v.outline(set, null));
  for (const [set, color] of outlines) if (inst.outlines.get(set) !== color) jobs.push(v.outline(set, color));
  inst.outlines = outlines;
  return jobs;
}

/** Number-line points, intervals and band brought to the spec. */
function lineSync(inst, b) {
  const nl = inst.mob;
  const jobs = [];
  const keyed = (list) => new Map((list ?? []).map((item, k) => [item.id ?? `#${k}`, item]));
  const pts = keyed(b.points);
  for (const [k, part] of inst.points) {
    const p = pts.get(k);
    if (p && p.color === part.spec.color && !p.open === !part.spec.open && !p.label === !part.spec.label) continue;
    inst.points.delete(k);
    jobs.push(part.fadeOut());
  }
  for (const [k, p] of pts) {
    const part = inst.points.get(k);
    if (part) {
      if (sig(part.spec) !== sig(p)) jobs.push(part.moveTo(p.v, { label: p.label }));
      part.spec = p;
      continue;
    }
    const fresh = nl.point(p.v, { color: p.color ?? 'blue', label: p.label, open: p.open });
    fresh.spec = p;
    inst.points.set(k, fresh);
    jobs.push(fresh.then());
  }
  const ivs = keyed(b.intervals);
  for (const [k, part] of inst.intervals) {
    if (sig(ivs.get(k)) === sig(part.spec)) continue;
    inst.intervals.delete(k);
    jobs.push(part.fadeOut());
  }
  for (const [k, it] of ivs) {
    if (inst.intervals.has(k)) continue;
    const part = nl.interval(it.a, it.b, { openA: it.openA, openB: it.openB, color: it.color ?? 'blue' });
    part.spec = it;
    inst.intervals.set(k, part);
    jobs.push(part.then());
  }
  const band = b.band;
  const old = inst.band;
  if (old && band && old.spec.center === band.center && old.spec.color === band.color && old.spec.label === band.label) {
    if (old.spec.eps !== band.eps) jobs.push(old.to(band.eps));
    old.spec = band;
  } else if (sig(old?.spec) !== sig(band)) {
    if (old) jobs.push(old.fadeOut());
    inst.band = null;
    if (band) {
      inst.band = nl.band(band.center, band.eps, { color: band.color ?? 'yellow', label: band.label ?? '\\varepsilon' });
      inst.band.spec = band;
      jobs.push(inst.band.then());
    }
  }
  return jobs;
}

/** Writes a proof's lines one at a time: new lines are appended; anything else changed starts the proof over. */
async function proofSync(ctx, inst, a, b) {
  const pr = inst.mob;
  const A = a?.lines ?? [];
  const B = b.lines;
  const same = (p, q) => sig({ ...p, note: undefined }) === sig({ ...q, note: undefined });
  let common = 0;
  while (common < A.length && common < B.length && same(A[common], B[common])) common++;
  const strikeA = a?.strike ?? [];
  const strikeB = b.strike ?? [];
  const restart =
    common < A.length ||
    (a?.qed && (!b.qed || B.length > A.length)) ||
    strikeA.some((i) => !strikeB.includes(i)) ||
    A.some((l, i) => l.note && l.note !== B[i]?.note);
  let from = common;
  let hlA = a?.highlight ?? [];
  let struck = strikeA;
  let qed = Boolean(a?.qed);
  const jobs = [];
  if (restart && a) {
    await pr.clear();
    from = 0;
    hlA = [];
    struck = [];
    qed = false;
  }
  for (let i = 0; i < from; i++) if (B[i].note && !A[i]?.note) jobs.push(pr.note(i, B[i].note));
  for (const i of hlA) if (i < from && !(b.highlight ?? []).includes(i)) jobs.push(pr.unhighlight(i));
  for (let i = from; i < B.length; i++) {
    if (!ctx.alive()) return;
    const l = B[i];
    await pr.add(l.text, { why: l.why, kind: l.kind ?? 'step', indent: l.indent ?? 0, tex: l.tex });
    if (l.note && ctx.alive()) await pr.note(i, l.note);
  }
  if (!ctx.alive()) return;
  for (const i of b.highlight ?? []) if (i >= from || !hlA.includes(i)) jobs.push(pr.highlight(i));
  for (const i of strikeB) if (!struck.includes(i)) jobs.push(pr.strike(i));
  await Promise.all(jobs);
  if (b.qed && !qed && ctx.alive()) await pr.qed();
}

// ---------------------------------------------------------------- frames

/** Validates the tutor's frames: [{ caption, objects: [spec], warnings: [string] }] (one per input frame). */
export function normalizeFrames(input) {
  const frames = Array.isArray(input) ? input : [];
  const out = [];
  let prevRaw = new Map();
  frames.forEach((frame, f) => {
    const warnings = [];
    const warn = (m) => warnings.push(m);
    if (!isObj(frame)) {
      warn(`frame ${f + 1} is not an object`);
      out.push({ caption: '', objects: [], warnings });
      prevRaw = new Map();
      return;
    }
    for (const k of Object.keys(frame)) if (k !== 'caption' && k !== 'objects') warn(`unknown frame property "${k}" ignored`);
    const caption = frame.caption == null ? '' : String(frame.caption);
    let list = frame.objects ?? [];
    if (!Array.isArray(list)) {
      warn('"objects" must be a list');
      list = [];
    }
    const raws = new Map();
    const objects = [];
    const counts = {};
    list.forEach((obj, k) => {
      if (!isObj(obj)) return warn(`object ${k} is not an object; skipped`);
      const given = obj.id == null ? null : String(obj.id);
      let raw = obj;
      if (obj.kind === undefined && given !== null) {
        if (!prevRaw.has(given)) return warn(`"${given}" has no "kind" and is not in the previous frame; skipped`);
        raw = { ...prevRaw.get(given), ...obj };
      }
      const def = Object.hasOwn(KINDS, raw.kind) ? KINDS[raw.kind] : null;
      if (!def) return warn(`${given ? `"${given}": ` : ''}unknown kind ${JSON.stringify(raw.kind)} (kinds: ${Object.keys(KINDS).join(', ')}); skipped`);
      const id = given ?? `${raw.kind}#${(counts[raw.kind] = (counts[raw.kind] ?? 0) + 1)}`;
      if (raws.has(id)) return warn(`duplicate id "${id}"; skipped`);
      let dropped = false;
      const c = scope(warn, given ? `"${id}"` : `${raw.kind} #${counts[raw.kind]}`);
      c.drop = (m) => {
        c.warn(`${m}; not shown`);
        dropped = true;
        return null;
      };
      let spec = null;
      try {
        spec = def.fix(pick(raw, def.schema, c, ['id', 'kind']), c);
      } catch (err) {
        c.warn(`${err.message}; not shown`);
      }
      if (!spec || dropped) return;
      raws.set(id, raw);
      objects.push({ ...spec, id, kind: raw.kind });
    });
    prevRaw = raws;
    out.push({ caption, objects, warnings });
  });
  return out;
}

// ---------------------------------------------------------------- player

const STYLE_ID = 'lx-scene-player-style';
const CSS = `
.lx-sp { margin: 0; border-radius: 10px; }
.lx-sp:focus { outline: none; }
.lx-sp:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
.lx-sp-screen { margin: 0 auto; }
.lx-sp .player { align-items: flex-start; gap: 12px; padding-top: 10px; }
.lx-sp-text { flex: 1; min-width: 0; }
.lx-sp .caption { min-height: 0; font-size: 1.05rem; }
.lx-sp-warn { margin: 6px 0 0; font: 12px/1.45 var(--mono); color: var(--warn); }
.lx-sp-warn:empty { display: none; }
.lx-sp-nav { flex: none; display: flex; align-items: center; gap: 2px; margin-top: -6px; }
.lx-sp-nav .count { min-width: 4.2em; text-align: center; }
.lx-sp-nav .lx-icon-btn:disabled { opacity: 0.35; cursor: default; }
`;
const PREV = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>';
const NEXT = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  document.head.append(el('style', { id: STYLE_ID, text: CSS }));
}

export class Player {
  constructor(host, { frames = [], view = {} } = {}) {
    this.frames = normalizeFrames(frames);
    this.i = 0;
    this.stage = null;
    this.ctx = null;
    this.epoch = 0;
    this.busy = false;
    this.stopped = false;
    for (const [k, f] of this.frames.entries()) if (f.warnings.length) console.warn(`scene frame ${k + 1}:`, f.warnings);

    ensureStyle();
    this.screen = el('div', { class: 'lx-sp-screen' });
    const height = Number(view?.height);
    if (height > 0) this.screen.style.maxWidth = `${Math.round((height * 960) / 600)}px`;
    this.caption = el('p', { class: 'caption', 'aria-live': 'polite' });
    this.warnEl = el('p', { class: 'lx-sp-warn' });
    this.count = el('span', { class: 'count' });
    this.prevBtn = el('button', { type: 'button', class: 'lx-icon-btn', 'aria-label': 'Previous step', html: PREV, onclick: (e) => this.step(-1, { animate: e.detail !== 0 }) });
    this.nextBtn = el('button', { type: 'button', class: 'lx-icon-btn', 'aria-label': 'Next step', html: NEXT, onclick: (e) => this.step(1, { animate: e.detail !== 0 }) });
    this.root = el(
      'figure',
      { class: 'lx-sp', tabindex: '0', 'aria-label': 'Step-through figure (left and right arrow keys change the step)' },
      this.screen,
      el('div', { class: 'player' }, el('div', { class: 'lx-sp-text' }, this.caption, this.warnEl), el('div', { class: 'lx-sp-nav' }, this.prevBtn, this.count, this.nextBtn)),
    );
    this.root.player = this;
    this.onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      const to = { ArrowLeft: this.i - 1, ArrowRight: this.i + 1, Home: 0, End: this.frames.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      this.go(to, { animate: false });
    };
    this.root.addEventListener('keydown', this.onKey);
    host.append(this.root);
    this.chrome();

    // Measuring (boxes, morphs, proof scrolling) needs layout: start once the figure has a width.
    if (this.screen.isConnected && this.screen.clientWidth > 0) this.start();
    else {
      this.waiting = new ResizeObserver(() => {
        if (this.screen.clientWidth > 0 && !this.stage && !this.stopped) {
          this.waiting.disconnect();
          this.start();
        }
      });
      this.waiting.observe(this.screen);
    }
  }

  start() {
    this.fresh();
    if (!this.frames.length) return;
    const epoch = ++this.epoch;
    this.busy = true;
    this.transition(this.ctx, null, this.frames[0])
      .catch((err) => this.problem(this.frames[0], err))
      .finally(() => epoch === this.epoch && (this.busy = false));
  }

  next() {
    return this.step(1);
  }
  prev() {
    return this.step(-1);
  }
  step(dir, { animate = true } = {}) {
    return this.go(this.i + dir, { animate: animate && dir > 0 });
  }

  /** Shows frame k: animated when it is the next one, rebuilt instantly otherwise. */
  async go(k, { animate = true } = {}) {
    if (this.stopped || !this.stage || !this.frames.length) return;
    k = Math.max(0, Math.min(this.frames.length - 1, Math.trunc(Number(k) || 0)));
    const from = this.i;
    if (k === from && !this.busy) return;
    this.i = k;
    this.chrome();
    const epoch = ++this.epoch;
    const interrupted = this.busy;
    this.busy = true;
    try {
      if (animate && k === from + 1) {
        if (interrupted) await this.rebuild(from);
        if (epoch === this.epoch) await this.transition(this.ctx, this.frames[from], this.frames[k]);
      } else await this.rebuild(k);
    } catch (err) {
      this.problem(this.frames[k], err);
    } finally {
      if (epoch === this.epoch) this.busy = false;
    }
  }

  /** Stops every animation and observer (the figure stays as it is). */
  stop() {
    this.stopped = true;
    this.ctx = null;
    this.waiting?.disconnect();
    this.root.removeEventListener('keydown', this.onKey);
    if (this.stage) {
      this.stage.clock.kill();
      this.stage.resize.disconnect();
    }
  }
  destroy() {
    this.stop();
    this.root.remove();
  }

  // ---- internals ----

  /** A new stage (and context) replacing the old one: code still running for the old one only touches a dead clock. */
  fresh() {
    const old = this.stage;
    this.stage = new Stage(this.screen, { label: 'Tutor figure' });
    old?.destroy();
    const ctx = { stage: this.stage, live: new Map(), alive: () => this.ctx === ctx && !this.stopped, warn: () => {} };
    this.ctx = ctx;
    return ctx;
  }

  /** Frame k built instantly by replaying frames 0…k, so it matches what stepping forward shows. */
  async rebuild(k) {
    const ctx = this.fresh();
    const clock = ctx.stage.clock;
    clock.instant = true;
    try {
      await this.transition(ctx, null, this.frames[0]);
      for (let j = 1; j <= k && ctx.alive(); j++) await this.transition(ctx, this.frames[j - 1], this.frames[j]);
    } finally {
      clock.instant = false;
    }
  }

  /** Animates the stage from frame `a` (null: empty) to frame `b`. */
  async transition(ctx, a, b) {
    if (!ctx?.alive()) return;
    ctx.warn = (m) => this.note(b, m);
    const want = new Set(b.objects.map((o) => o.id));
    const exits = [];
    for (const [id, inst] of ctx.live) {
      if (want.has(id) && inst.kind === b.objects.find((o) => o.id === id).kind) continue;
      ctx.live.delete(id);
      exits.push(Promise.all(inst.mobs.map(dropMob)));
    }
    const delay = exits.length ? 140 : 0;
    const jobs = new Map();
    const later = [];
    for (const spec of b.objects) {
      if (KINDS[spec.kind].deps?.(spec).length) later.push(spec);
      else jobs.set(spec.id, this.place(ctx, spec, delay, exits));
    }
    for (const spec of later) {
      const deps = KINDS[spec.kind].deps(spec).map((id) => jobs.get(id));
      jobs.set(spec.id, Promise.all(deps).then(() => (ctx.alive() ? this.place(ctx, spec, 0, exits) : undefined)));
    }
    await Promise.all([...jobs.values()]);
    await Promise.all(exits);
  }

  /** Updates the live object with this id, or brings a new one in (replacing it when it cannot change in place). */
  place(ctx, spec, delay, exits) {
    const def = KINDS[spec.kind];
    const fail = (err) => {
      console.error(err);
      ctx.warn(`"${spec.id}": ${err.message}`);
    };
    const old = ctx.live.get(spec.id);
    if (old) {
      if (!def.always && sig(old.spec) === sig(spec)) return Promise.resolve();
      let job = null;
      try {
        job = def.update(ctx, old, old.spec, spec);
      } catch (err) {
        fail(err);
      }
      if (job) {
        old.spec = spec;
        return Promise.resolve(job).catch(fail);
      }
      ctx.live.delete(spec.id);
      exits.push(Promise.all(old.mobs.map(dropMob)));
    }
    let inst = null;
    try {
      inst = def.create(ctx, spec);
    } catch (err) {
      fail(err);
    }
    if (!inst) return Promise.resolve();
    Object.assign(inst, { kind: spec.kind, spec });
    ctx.live.set(spec.id, inst);
    const wait = old ? 160 : delay;
    try {
      return Promise.resolve(def.enter ? def.enter(ctx, inst, wait) : fadeInAll(inst.mobs, wait)).catch(fail);
    } catch (err) {
      fail(err);
      return Promise.resolve();
    }
  }

  /** A warning found while drawing a frame (shown when that frame is on screen). */
  note(frame, message) {
    if (frame.warnings.includes(message)) return;
    frame.warnings.push(message);
    if (this.frames[this.i] === frame) this.chrome();
  }

  problem(frame, err) {
    console.error(err);
    if (frame) this.note(frame, `could not draw this frame: ${err.message}`);
  }

  /** Caption, counter, buttons and warnings for frame i. */
  chrome() {
    const n = this.frames.length;
    const frame = this.frames[this.i];
    this.caption.innerHTML = n ? inlineMath(frame.caption) : 'This scene has no frames.';
    this.count.textContent = n ? `${this.i + 1} / ${n}` : '0 / 0';
    this.prevBtn.disabled = this.i <= 0;
    this.nextBtn.disabled = this.i >= n - 1;
    const w = frame?.warnings ?? [];
    this.warnEl.textContent = w.length ? `⚠ ${w.slice(0, 3).join(' · ')}${w.length > 3 ? ` (+${w.length - 3} more)` : ''}` : '';
    this.warnEl.title = w.join('\n');
    this.root.dataset.step = String(this.i);
  }
}
