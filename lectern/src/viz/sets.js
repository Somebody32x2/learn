/**
 * Set, function and number components for Foundations lectures (MATH 3010). Every one is an SVG mob on the back
 * layer (drawn around its own origin, placed at x, y) except DigitGrid (HTML). All animations run on the stage clock.
 *
 *   s.venn({ x, y, sets: ['A', 'B'] | 1..3, r, universe = true, labels, visible })
 *     → Venn: shade(regions, { color }), unshade(regions), clearShade(), element(region, label) → Part,
 *       count(region, n | text, { color, size }) → Part, regionCenter(region) → { x, y } (stage),
 *       outline(set, color | null), atoms(regions), union/intersect/minus/complement/symdiff(...)
 *   s.mapDiagram({ x, y, domain, codomain, arrows: [[i, j], …], labels: ['A', 'B'], name, visible })
 *     → MapDiagram: addArrow(i, j), removeArrow(i, j), highlightElement('dom' | 'cod', i, color), showCollision(),
 *       showMissed(), invert(), clear()
 *   s.relationGraph({ x, y, nodes, edges, layout: 'circle' | 'row', directed = true, visible })
 *     → RelationGraph: addEdge(i, j), removeEdge(i, j), highlightEdges(sel, color), highlightNodes(idx, color),
 *       partition(classes, colors, { move }), closure('reflexive' | 'symmetric' | 'transitive')
 *   s.numberLine({ x, y, width = 800, range: [a, b], ticks = 1, labels = true, visible })
 *     → NumberLine: point(v, opts) → Part, interval(a, b, opts) → Part, band(center, eps, opts) → Part (.to(eps)),
 *       sequence(fn, n, opts) → Part, marker(v, opts) → Part (.moveTo(v)), moveMarker(v, opts), toX(v)
 *   s.digitGrid({ x, y, rows: [[digits]], rowLabels, size, prefix = '0.', more = true, label = 'x', visible })
 *     → DigitGrid: highlightDiagonal(), buildDiagonal({ change }), highlightCell(i, j, color)
 *   s.dominoes({ x, y, n = 8, label: (k) => `P(${k})`, start = 1, labelSize, more = true, visible })
 *     → Dominoes: push(i = 0), topple(from = 0, { gap, to }), highlight(k, color), reset()
 *   s.modClock({ x, y, n = 12, r = 140, visible })
 *     → ModClock: step(from, by, { color, count }) → Promise<landing residue>, highlight(k, color),
 *       wrap(count, { start }), classes({ mod, colors }), clear()
 *
 * Module exports besides the classes: region helpers union, intersect, minus, complement, symdiff (code strings),
 * compileRegion(code, names) → (bits) => bool, texPlain(tex) (TeX symbols → Unicode for SVG labels).
 * SVG labels are set in the serif; _x and ^{…} become smaller lowered / raised tspans (setLabel).
 */
import { el, svg, nextId } from '../core/dom.js';
import { ease, lerp } from '../core/tween.js';
import { extend } from '../core/stage.js';
import { Mob, katexHtml } from '../core/mobject.js';
import { tween, appear, vanish, paint, glow, pulse, tone, Part, PALETTE } from './logic.js';

// ---------------------------------------------------------------- small helpers

const SYM = {
  varepsilon: 'ε', epsilon: 'ϵ', delta: 'δ', alpha: 'α', beta: 'β', gamma: 'γ', theta: 'θ', lambda: 'λ', mu: 'μ',
  pi: 'π', sigma: 'σ', phi: 'φ', varphi: 'φ', omega: 'ω', infty: '∞', cdot: '·', times: '×', ldots: '…', cdots: '⋯',
  dots: '…', in: '∈', notin: '∉', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', emptyset: '∅',
  varnothing: '∅', to: '→', mapsto: '↦', lnot: '¬', neg: '¬', land: '∧', lor: '∨', cup: '∪', cap: '∩',
  setminus: '∖', subseteq: '⊆', equiv: '≡', pm: '±', mid: '∣', ',': ' ', ';': ' ', ' ': ' ', '!': '', '{': '\u0001', '}': '\u0002',
};
const BB = { N: 'ℕ', Z: 'ℤ', Q: 'ℚ', R: 'ℝ', C: 'ℂ' };

/**
 * TeX → plain Unicode for SVG text: '\\varepsilon' → 'ε', '\\mathbb{Z}' → 'ℤ', '\\text{odd}' → 'odd', '\\{1, 2\\}' and
 * '{1, 2}' → '{1, 2}'. Braces are TeX grouping only as a command's argument (dropped with the command); other braces
 * show literally. Sub/superscripts (_x, ^{…}) are left in place; svg labels typeset them as tspans (setLabel).
 */
export function texPlain(tex) {
  return String(tex)
    .replace(/\\mathbb\{?([A-Z])\}?/g, (m, c) => BB[c] ?? c)
    .replace(/\\(?:text|mathrm|mathit|mathbf|mathsf|textbf|textit|emph|operatorname)\{([^{}]*)\}/g, '$1')
    .replace(/\\col\{[^{}]*\}\{([^{}]*)\}/g, '$1')
    .replace(/\\([a-zA-Z]+)\{([^{}]*)\}/g, (m, name, arg) => (Object.hasOwn(SYM, name) ? m : arg))
    .replace(/\\([a-zA-Z]+|[,;! {}])/g, (m, name) => (Object.hasOwn(SYM, name) ? SYM[name] : name))
    .replace(/\{\}/g, '')
    .replace(/\u0001/g, '{')
    .replace(/\u0002/g, '}')
    .replace(/-/g, '−');
}

/** Fills an SVG <text> with a TeX-ish label: symbols via texPlain, `_x` / `^{…}` as smaller lowered / raised tspans.
 *  A single letter (with scripts or primes) is set italic. */
function setLabel(node, str, size) {
  const src = String(str);
  const parts = [];
  const re = /([_^])(?:\{([^}]*)\}|(.))/g;
  let last = 0;
  for (let m; (m = re.exec(src)); last = re.lastIndex) {
    if (m.index > last) parts.push({ text: src.slice(last, m.index) });
    parts.push({ text: m[2] ?? m[3], script: m[1] });
  }
  if (last < src.length) parts.push({ text: src.slice(last) });
  node.replaceChildren();
  let shift = 0;
  for (const p of parts) {
    const target = p.script === '^' ? -0.38 * size : p.script === '_' ? 0.22 * size : 0;
    const dx = p.script === '^' ? (0.08 * size).toFixed(1) : undefined;
    // scripts are smaller, but never below 28 logical px (readable at phone scale) nor above the label itself
    const sub = Math.min(size, Math.max(28, size * 0.66));
    node.append(svg('tspan', { dx, dy: (target - shift).toFixed(1), 'font-size': p.script ? sub.toFixed(1) : undefined }, texPlain(p.text)));
    shift = target;
  }
  const base = parts.filter((p) => !p.script).map((p) => texPlain(p.text)).join('');
  node.classList.toggle('lx-it', /^[A-Za-z]['′]*$/.test(base));
  return node;
}

/** An SVG text label (centered on x, y unless anchor says otherwise). */
function svgText(str, { x = 0, y = 0, size = 34, anchor = 'middle', cls } = {}) {
  const node = svg('text', { x, y, 'font-size': size, 'text-anchor': anchor, 'dominant-baseline': 'central', class: ['lx-svg-label', cls] });
  return setLabel(node, str, size);
}

/** Rough text width in user units (for layout before the fonts are measured). */
const textW = (str, size) => [...texPlain(String(str)).replace(/[_^]/g, '')].length * size * 0.52;

const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(3))).replace('-', '−');
const unit = (x, y) => {
  const L = Math.hypot(x, y) || 1;
  return [x / L, y / L];
};
const pt = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const deg = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
const HEAD = 'M0 0 L-16 -7.5 L-16 7.5 Z';

/** Draws an SVG path/line along its length (dash animation); `fromEnd` draws it from its far end. */
function drawStroke(clock, node, len, { duration = 650, delay = 0, fromEnd = false, head } = {}) {
  const sign = fromEnd ? -1 : 1;
  node.style.strokeDasharray = `${len} ${len}`;
  node.style.strokeDashoffset = String(sign * len);
  if (head) head.style.opacity = '0';
  return tween(
    clock,
    (t) => {
      node.style.strokeDashoffset = String(sign * len * (1 - t));
      if (head) head.style.opacity = String(Math.max(0, (t - 0.75) / 0.25));
      if (t >= 1) {
        node.style.strokeDasharray = '';
        node.style.strokeDashoffset = '';
      }
    },
    { duration, delay, ease: ease.inOut },
  );
}

const lengthOf = (node, fallback) => {
  try {
    return node.getTotalLength() || fallback;
  } catch {
    return fallback;
  }
};

function convexHull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (const q of p.slice().reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// ---------------------------------------------------------------- region codes

const wrapCode = (c) => `(${c})`;
export const union = (...sets) => sets.map(wrapCode).join('|');
export const intersect = (...sets) => sets.map(wrapCode).join('&');
export const minus = (a, b) => `${wrapCode(a)}&!${wrapCode(b)}`;
export const complement = (a) => `!${wrapCode(a)}`;
export const symdiff = (a, b) => `${wrapCode(a)}^${wrapCode(b)}`;

/**
 * Compiles a region code over set names into a test on membership bits (bit i = inside names[i]).
 * Operators: ! ~ ¬ (not, prefix), ' ᶜ (complement, postfix), & ∩ (and), - ∖ (minus), | + ∪ (or), ^ (xor), parentheses;
 * U is the universe. Example: 'A&!B', '(A|B)&!C', "A'".
 */
export function compileRegion(code, names) {
  const src = String(code).replace(/\s+/g, '');
  let pos = 0;
  const fail = () => {
    throw new Error(`Venn: cannot read region "${code}"`);
  };
  const expr = () => {
    let f = term();
    while (pos < src.length && '|+∪^'.includes(src[pos])) {
      const op = src[pos++];
      const a = f;
      const b = term();
      f = op === '^' ? (bits) => a(bits) !== b(bits) : (bits) => a(bits) || b(bits);
    }
    return f;
  };
  const term = () => {
    let f = factor();
    while (pos < src.length && '&∩-∖'.includes(src[pos])) {
      const op = src[pos++];
      const a = f;
      const b = factor();
      f = op === '&' || op === '∩' ? (bits) => a(bits) && b(bits) : (bits) => a(bits) && !b(bits);
    }
    return f;
  };
  const factor = () => {
    let f;
    const c = src[pos];
    if (c === '!' || c === '~' || c === '¬') {
      pos++;
      const g = factor();
      f = (bits) => !g(bits);
    } else if (c === '(') {
      pos++;
      f = expr();
      if (src[pos++] !== ')') fail();
    } else {
      const m = /^[A-Za-z][A-Za-z0-9_]*/.exec(src.slice(pos));
      if (!m) fail();
      pos += m[0].length;
      const i = names.indexOf(m[0]);
      if (i >= 0) f = (bits) => Boolean(bits & (1 << i));
      else if (m[0] === 'U') f = () => true;
      else fail();
    }
    while (src[pos] === "'" || src[pos] === 'ᶜ') {
      pos++;
      const g = f;
      f = (bits) => !g(bits);
    }
    return f;
  };
  const f = expr();
  if (pos !== src.length) fail();
  return f;
}

// ---------------------------------------------------------------- Venn diagram

export class Venn extends Mob {
  constructor(stage, { sets = ['A', 'B'], r, universe = true, labels, size = 36, ...opts } = {}) {
    const names = typeof sets === 'number' ? ['A', 'B', 'C'].slice(0, Math.max(1, Math.min(3, sets))) : sets.slice(0, 3);
    super(stage, svg('g', { class: 'lx-venn' }), { layer: 'back', ...opts });
    const k = names.length;
    r ??= k === 3 ? 122 : 140;
    const d = r * 0.6;
    const rho = r * 0.62;
    const c30 = Math.cos(Math.PI / 6);
    const centers = k === 1 ? [[0, 0]] : k === 2 ? [[-d, 0], [d, 0]] : [[-rho * c30, -0.75 * rho], [rho * c30, -0.75 * rho], [0, 0.75 * rho]];
    const pad = 52;
    const x0 = Math.min(...centers.map((c) => c[0])) - r - pad;
    const y0 = Math.min(...centers.map((c) => c[1])) - r - pad;
    const U = { x: x0, y: y0, w: Math.max(...centers.map((c) => c[0])) + r + pad - x0, h: Math.max(...centers.map((c) => c[1])) + r + pad - y0 };
    this.names = names;
    this.circles = centers.map(([cx, cy]) => ({ cx, cy, r }));
    this.U = U;
    this.universe = universe;
    this.placed = [];
    this.outlines = new Map();

    const uid = nextId('venn');
    const box = { x: U.x - 10, y: U.y - 10, width: U.w + 20, height: U.h + 20 };
    const clipIds = [];
    const maskIds = [];
    this.circles.forEach(({ cx, cy }, i) => {
      clipIds.push(`${uid}-c${i}`);
      maskIds.push(`${uid}-m${i}`);
      // mask luminance, not a visible color: white keeps, black cuts
      stage.defs.append(
        svg('clipPath', { id: clipIds[i], clipPathUnits: 'userSpaceOnUse' }, svg('circle', { cx, cy, r })),
        svg('mask', { id: maskIds[i], maskUnits: 'userSpaceOnUse', ...box }, svg('rect', { ...box, fill: 'white' }), svg('circle', { cx, cy, r, fill: 'black' })),
      );
    });

    const regionLayer = svg('g');
    this.regions = [];
    for (let bits = 0; bits < 2 ** k; bits++) {
      const rect = svg('rect', { x: U.x, y: U.y, width: U.w, height: U.h, rx: 14, class: 'lx-venn-fill' });
      let shape = rect;
      for (let i = 0; i < k; i++) if (!((bits >> i) & 1)) shape = svg('g', { mask: `url(#${maskIds[i]})` }, shape);
      for (let i = 0; i < k; i++) if ((bits >> i) & 1) shape = svg('g', { 'clip-path': `url(#${clipIds[i]})` }, shape);
      const wrap = svg('g', { class: 'lx-venn-region', style: { opacity: '0' } }, shape);
      regionLayer.append(wrap);
      this.regions.push({ wrap, rect, color: null, on: false });
    }

    const frame = svg('g');
    if (universe) {
      frame.append(svg('rect', { x: U.x, y: U.y, width: U.w, height: U.h, rx: 14, class: 'lx-venn-u' }));
      const ux = U.x + U.w - 26;
      const uy = U.y + U.h - 26;
      frame.append(svgText('U', { x: ux, y: uy, size: 32, cls: 'lx-venn-ulabel' }));
      this.placed.push({ x: ux, y: uy, hw: 16 });
    }
    const dirs = k === 3 ? [[-0.707, -0.707], [0.707, -0.707], [0, 1]] : [[-0.707, -0.707], [0.707, -0.707]];
    this.circles.forEach(({ cx, cy }, i) => {
      frame.append(svg('circle', { cx, cy, r, class: 'lx-venn-set' }));
      const text = labels?.[i] ?? names[i];
      const [dx, dy] = dirs[i];
      const lx = cx + dx * (r + 26);
      const ly = cy + dy * (r + 26);
      frame.append(svgText(text, { x: lx, y: ly, size, cls: 'lx-venn-label' }));
      this.placed.push({ x: lx, y: ly, hw: textW(text, size) / 2 + 4 });
    });
    this.outlineLayer = svg('g');
    this.elLayer = svg('g');
    this.node.append(regionLayer, frame, this.outlineLayer, this.elLayer);
  }

  /** Membership bits → atomic region indices matching a region code (or an array of codes = their union). */
  atoms(regions) {
    const tests = [regions].flat().map((code) => compileRegion(code, this.names));
    return this.regions.map((_, bits) => bits).filter((bits) => tests.some((t) => t(bits)));
  }

  shade(regions, { color = 'blue', duration = 500, delay = 0 } = {}) {
    const clock = this.clock;
    const { fg } = tone(color);
    return Promise.all(
      this.atoms(regions).map((bits) => {
        const reg = this.regions[bits];
        const recolor = reg.on && reg.color !== fg;
        reg.color = fg;
        reg.on = true;
        if (recolor) return paint(clock, reg.rect, { fill: fg }, { duration, delay });
        let from = 0;
        return tween(clock, (t) => (reg.wrap.style.opacity = String(lerp(from, 1, t))), {
          duration,
          delay,
          start: () => {
            from = Number(reg.wrap.style.opacity) || 0;
            reg.rect.style.fill = fg;
          },
        });
      }),
    );
  }

  unshade(regions, { duration = 400, delay = 0 } = {}) {
    const clock = this.clock;
    const regs = this.atoms(regions).map((bits) => this.regions[bits]);
    regs.forEach((reg) => (reg.on = false));
    return vanish(clock, regs.map((reg) => reg.wrap), { duration, delay });
  }

  clearShade(opts) {
    return this.unshade('U', opts);
  }

  bitsAt(x, y) {
    let bits = 0;
    this.circles.forEach((c, i) => {
      if ((x - c.cx) ** 2 + (y - c.cy) ** 2 < c.r * c.r) bits |= 1 << i;
    });
    return bits;
  }

  clearance(x, y) {
    const U = this.U;
    let m = Math.min(x - U.x, U.x + U.w - x, y - U.y, U.y + U.h - y);
    for (const c of this.circles) m = Math.min(m, Math.abs(Math.hypot(x - c.cx, y - c.cy) - c.r));
    return m;
  }

  /** The best free spot in a region for something `hw` wide on each side (far from edges and earlier elements). */
  spot(region, hw) {
    const ok = new Set(this.atoms(region));
    const U = this.U;
    let best = null;
    let bestScore = -Infinity;
    for (let y = U.y + 10; y < U.y + U.h - 8; y += 7) {
      for (let x = U.x + 10; x < U.x + U.w - 8; x += 7) {
        if (!ok.has(this.bitsAt(x, y))) continue;
        let s = this.clearance(x, y);
        for (const ex of [x - hw, x + hw]) s = Math.min(s, ok.has(this.bitsAt(ex, y)) ? this.clearance(ex, y) + 8 : -this.clearance(ex, y));
        for (const p of this.placed) s = Math.min(s, Math.max(Math.abs(x - p.x) - hw - p.hw - 4, Math.abs(y - p.y) - 30) + 12);
        if (s > bestScore) {
          bestScore = s;
          best = [x, y];
        }
      }
    }
    return best ?? [0, 0];
  }

  /** A dot with a label placed inside a region (pass { at: [x, y] } to place it yourself). Returns a Part. */
  element(region, text = '', { color, at, size = 34 } = {}) {
    const clock = this.clock;
    const str = String(text);
    const lw = str ? textW(str, size) : 0;
    const hw = lw / 2 + 10;
    const [px, py] = at ?? this.spot(region, hw);
    this.placed.push({ x: px, y: py, hw });
    const dotX = str ? -lw / 2 - 4 : 0;
    const inner = svg('g', { class: 'lx-venn-el', style: { color: color ? tone(color).fg : undefined, opacity: '0' } }, svg('circle', { cx: dotX, cy: 0, r: 6.5 }), str ? svgText(str, { x: dotX + 13, y: 0, size, anchor: 'start' }) : null);
    const outer = svg('g', { transform: `translate(${px.toFixed(1)} ${py.toFixed(1)})` }, inner);
    this.elLayer.append(outer);
    return new Part(outer, appear(clock, inner, { dy: 0, scale: 0.6, ease: ease.back, duration: 450 }), this);
  }

  /** Stage point { x, y } inside a region, at its roomiest spot clear of labels and elements (for a count label). */
  regionCenter(region, { hw = 18 } = {}) {
    const [px, py] = this.spot(region, hw);
    const { x, y, scale } = this.state;
    return { x: x + px * scale, y: y + py * scale, local: [px, py] };
  }

  /** A number or short text placed (popping in) at the region's roomiest spot, e.g. |A ∩ B| = 3. Returns a Part. */
  count(region, value, { color, size = 38, at } = {}) {
    const str = String(value);
    const hw = textW(str, size) / 2 + 6;
    const [px, py] = at ?? this.spot(region, hw);
    this.placed.push({ x: px, y: py, hw });
    const text = svgText(str, { size, cls: 'lx-venn-count' });
    const inner = svg('g', { class: 'lx-venn-el', style: { color: color ? tone(color).fg : undefined, opacity: '0' } }, text);
    const outer = svg('g', { transform: `translate(${px.toFixed(1)} ${py.toFixed(1)})` }, inner);
    this.elLayer.append(outer);
    return new Part(outer, appear(this.clock, inner, { dy: 0, scale: 0.6, ease: ease.back, duration: 450 }), this);
  }

  /** Draws a thick colored outline around a set (or 'U'); color null fades it away. */
  outline(set, color = 'blue', { width = 6, duration = 600 } = {}) {
    const clock = this.clock;
    let o = this.outlines.get(set);
    if (color === null || color === false) {
      if (o) this.outlines.delete(set);
      return o ? vanish(clock, o, { remove: true }) : Promise.resolve();
    }
    const { fg } = tone(color);
    if (o) return paint(clock, o, { stroke: fg });
    const i = this.names.indexOf(set);
    if (i < 0 && set !== 'U') throw new Error(`Venn: no set ${set}`);
    const U = this.U;
    const c = this.circles[i];
    o = i >= 0 ? svg('circle', { cx: c.cx, cy: c.cy, r: c.r }) : svg('rect', { x: U.x, y: U.y, width: U.w, height: U.h, rx: 14 });
    o.setAttribute('class', 'lx-venn-outline');
    o.style.stroke = fg;
    o.style.strokeWidth = String(width);
    this.outlineLayer.append(o);
    this.outlines.set(set, o);
    const len = i >= 0 ? 2 * Math.PI * c.r : 2 * (U.w + U.h);
    return drawStroke(clock, o, len, { duration });
  }

  union(...s) {
    return union(...s);
  }
  intersect(...s) {
    return intersect(...s);
  }
  minus(a, b) {
    return minus(a, b);
  }
  complement(a) {
    return complement(a);
  }
  symdiff(a, b) {
    return symdiff(a, b);
  }
}

// ---------------------------------------------------------------- arrow diagram of a function

export class MapDiagram extends Mob {
  constructor(stage, { domain = [], codomain = [], arrows = [], labels = ['A', 'B'], name, gap = 360, spacing = 72, size = 36, ...opts } = {}) {
    super(stage, svg('g', { class: 'lx-map' }), { layer: 'back', ...opts });
    this.size = size;
    this.ovals = svg('g');
    this.arrowLayer = svg('g');
    this.elLayer = svg('g');
    this.markLayer = svg('g');
    this.node.append(this.ovals, this.arrowLayer, this.elLayer, this.markLayer);
    this.dom = this.column(domain, -gap / 2, spacing, labels?.[0]);
    this.cod = this.column(codomain, gap / 2, spacing, labels?.[1]);
    this.arrows = new Map();
    this.rings = [];
    this.inverted = false;
    this.name = name;
    if (name) {
      this.nameText = svgText(name, { x: 0, y: -Math.max(this.dom.ry, this.cod.ry) - 28, size: 34, cls: 'lx-map-name' });
      this.ovals.append(this.nameText);
    }
    for (const [i, j] of arrows) this.makeArrow(i, j);
  }

  column(items, cx, spacing, title) {
    const n = items.length;
    const size = this.size;
    const maxW = Math.max(size * 0.6, ...items.map((s) => textW(s, size)));
    const rx = Math.max(78, maxW / 2 + 52);
    const ry = Math.max(90, (n * spacing) / 2 + 30);
    this.ovals.append(svg('ellipse', { cx, cy: 0, rx, ry, class: 'lx-map-oval' }));
    if (title) this.ovals.append(svgText(title, { x: cx, y: -ry - 28, size: 36, cls: 'lx-map-title' }));
    const bgR = Math.max(size * 0.8, maxW / 2 + 12);
    const els = items.map((s, i) => {
      const y = (i - (n - 1) / 2) * spacing;
      const bg = svg('circle', { r: bgR, class: 'lx-map-bg' });
      const text = svgText(s, { size });
      const inner = svg('g', { class: 'lx-map-el' }, bg, text);
      this.elLayer.append(svg('g', { transform: `translate(${cx} ${y})` }, inner));
      return { inner, bg, text, x: cx, y };
    });
    return { cx, rx, ry, els, half: maxW / 2 + 14, bgR };
  }

  makeArrow(i, j) {
    const a0 = this.dom.els[i];
    const b0 = this.cod.els[j];
    if (!a0 || !b0) throw new Error(`MapDiagram: no arrow ${i} → ${j}`);
    const p1 = [a0.x + this.dom.half, a0.y];
    const p2 = [b0.x - this.cod.half, b0.y];
    const u = unit(p2[0] - p1[0], p2[1] - p1[1]);
    const shaft = svg('line', { x1: p1[0] + u[0] * 5, y1: p1[1] + u[1] * 5, x2: p2[0] - u[0] * 5, y2: p2[1] - u[1] * 5, class: 'lx-map-shaft' });
    const headG = svg('g', {}, svg('path', { d: HEAD, class: 'lx-map-head' }));
    const g = svg('g', { class: 'lx-map-arrow' }, shaft, headG);
    const a = { i, j, g, shaft, headG, p1, p2, ang: deg(u), len: Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) - 10 };
    this.placeHead(a, this.inverted ? 1 : 0);
    this.arrowLayer.append(g);
    this.arrows.set(`${i},${j}`, a);
    return a;
  }

  /** u = 0: head at the codomain end pointing right; u = 1: at the domain end pointing back. */
  placeHead(a, u) {
    const x = lerp(a.p2[0], a.p1[0], u);
    const y = lerp(a.p2[1], a.p1[1], u);
    a.headG.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a.ang + 180 * u).toFixed(1)})`);
  }

  addArrow(i, j, { color, duration = 650 } = {}) {
    if (this.arrows.has(`${i},${j}`)) return Promise.resolve();
    const a = this.makeArrow(i, j);
    if (color) a.g.style.color = tone(color).fg;
    return drawStroke(this.clock, a.shaft, a.len, { duration, fromEnd: this.inverted, head: a.headG });
  }

  removeArrow(i, j) {
    const a = this.arrows.get(`${i},${j}`);
    if (!a) return Promise.resolve();
    this.arrows.delete(`${i},${j}`);
    return vanish(this.clock, a.g, { remove: true });
  }

  highlightElement(side, i, color = 'yellow') {
    const e = (side === 'cod' ? this.cod : this.dom).els[i];
    if (!e) return Promise.resolve();
    const { fg, bg } = tone(color);
    const clock = this.clock;
    return Promise.all([paint(clock, e.bg, { fill: bg }), paint(clock, e.text, { fill: fg })]);
  }

  /** Arrows sharing a target pulse red (not injective). Resolves true if there was a collision. */
  showCollision({ color = 'red' } = {}) {
    const clock = this.clock;
    const by = new Map();
    for (const a of this.arrows.values()) by.set(a.j, [...(by.get(a.j) ?? []), a]);
    const hits = [...by.entries()].filter(([, list]) => list.length > 1);
    if (!hits.length) return Promise.resolve(false);
    const list = hits.flatMap(([, l]) => l);
    const { fg } = tone(color);
    return Promise.all([
      paint(clock, list.map((a) => a.g), { color: fg }),
      tween(clock, (t) => list.forEach((a) => (a.shaft.style.strokeWidth = t >= 1 ? '4' : String(2.5 + 3.5 * Math.abs(Math.sin(2 * Math.PI * t))))), { duration: 1100, ease: ease.linear }),
      ...hits.map(([j]) => this.highlightElement('cod', j, color)),
    ]).then(() => true);
  }

  /** Codomain elements no arrow reaches get a pulsing dashed ring (not surjective). Resolves true if any. */
  showMissed({ color = 'red' } = {}) {
    const clock = this.clock;
    const hit = new Set([...this.arrows.values()].map((a) => a.j));
    const missed = this.cod.els.filter((_, j) => !hit.has(j));
    if (!missed.length) return Promise.resolve(false);
    const { fg } = tone(color);
    return Promise.all(
      missed.map((e) => {
        const ring = svg('circle', { r: this.cod.bgR + 8, class: 'lx-map-ring', style: { stroke: fg, opacity: '0' } });
        const outer = svg('g', { transform: `translate(${e.x} ${e.y})` }, ring);
        this.markLayer.append(outer);
        this.rings.push(outer);
        return Promise.all([appear(clock, ring, { dy: 0, scale: 1.4, duration: 500 }), paint(clock, e.text, { fill: fg }), pulse(clock, e.inner, { scale: 1.2, duration: 900 })]);
      }),
    ).then(() => true);
  }

  /** Removes collision / missed / element highlights. */
  clear() {
    const clock = this.clock;
    const els = [...this.dom.els, ...this.cod.els];
    const arrows = [...this.arrows.values()];
    const rings = this.rings;
    this.rings = [];
    return Promise.all([
      paint(clock, arrows.map((a) => a.g), { color: null }),
      paint(clock, arrows.map((a) => a.shaft), { 'stroke-width': null }),
      paint(clock, els.map((e) => e.bg), { fill: null }),
      paint(clock, els.map((e) => e.text), { fill: null }),
      vanish(clock, rings, { remove: true }),
    ]);
  }

  /** Every arrowhead travels to the other end (the inverse relation); the name gains ⁻¹. Again turns them back. */
  invert({ duration = 800 } = {}) {
    const clock = this.clock;
    this.inverted = !this.inverted;
    const to = this.inverted ? 1 : 0;
    const list = [...this.arrows.values()];
    const anims = [tween(clock, (t) => list.forEach((a) => this.placeHead(a, lerp(1 - to, to, t))), { duration, ease: ease.inOut })];
    if (this.nameText) {
      const node = this.nameText;
      const next = this.inverted ? `${this.name}^{-1}` : this.name;
      anims.push(
        tween(
          clock,
          (t) => {
            if (t < 0.5) node.style.opacity = String(1 - 2 * t);
            else {
              setLabel(node, next, 34);
              node.style.opacity = String(2 * t - 1);
            }
          },
          { duration, ease: ease.linear },
        ),
      );
    }
    return Promise.all(anims);
  }
}

// ---------------------------------------------------------------- relation graph

export class RelationGraph extends Mob {
  constructor(stage, { nodes = [], edges = [], layout = 'circle', directed = true, radius = 170, width = 760, nodeR = 30, size = 34, ...opts } = {}) {
    super(stage, svg('g', { class: 'lx-rel' }), { layer: 'back', ...opts });
    this.layoutKind = layout;
    this.directed = directed;
    this.radius = radius;
    this.width = width;
    this.nodeR = nodeR;
    this.blobLayer = svg('g');
    this.edgeLayer = svg('g');
    this.nodeLayer = svg('g');
    this.node.append(this.blobLayer, this.edgeLayer, this.nodeLayer);
    const n = nodes.length;
    this.slotStep = width / Math.max(1, n - 1);
    this.pos = nodes.map((_, i) => this.slot(i, n));
    this.vertices = nodes.map((name, i) => {
      const circle = svg('circle', { r: nodeR, class: 'lx-rel-circle' });
      const text = svgText(name, { size });
      const inner = svg('g', { class: 'lx-rel-node' }, circle, text);
      const outer = svg('g', { transform: `translate(${pt(this.pos[i])})` }, inner);
      this.nodeLayer.append(outer);
      return { outer, inner, circle, text };
    });
    this.edges = [];
    for (const [i, j] of edges) this.makeEdge(i, j);
  }

  /** Position of layout slot s out of `total` slots. */
  slot(s, total) {
    if (this.layoutKind === 'row') return [total > 1 ? (s / (total - 1) - 0.5) * this.width : 0, 0];
    const a = ((-90 + (360 * s) / total) * Math.PI) / 180;
    return [this.radius * Math.cos(a), this.radius * Math.sin(a)];
  }

  has(i, j) {
    return this.edges.some((e) => e.i === i && e.j === j);
  }

  find(i, j) {
    return this.edges.find((e) => e.i === i && e.j === j);
  }

  geom(e) {
    const R = this.nodeR;
    const [x1, y1] = this.pos[e.i];
    const [x2, y2] = this.pos[e.j];
    if (e.i === e.j) {
      let ux = 0;
      let uy = -1;
      if (this.layoutKind === 'circle') {
        const L = Math.hypot(x1, y1);
        if (L > 1) [ux, uy] = [x1 / L, y1 / L];
      }
      const rot = (a, k) => [x1 + (ux * Math.cos(a) - uy * Math.sin(a)) * k, y1 + (ux * Math.sin(a) + uy * Math.cos(a)) * k];
      const s = rot(-0.55, R);
      const tip = rot(0.55, R + 1);
      const c1 = rot(-0.8, R * 3.2);
      const c2 = rot(0.8, R * 3.2);
      const dir = unit(tip[0] - c2[0], tip[1] - c2[1]);
      const end = this.directed ? [tip[0] - dir[0] * 8, tip[1] - dir[1] * 8] : tip;
      return { d: `M${pt(s)} C${pt(c1)} ${pt(c2)} ${pt(end)}`, tip, dir, len: R * 6 };
    }
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1;
    let bow = 0;
    if (this.directed && this.has(e.j, e.i)) bow = -26;
    if (this.layoutKind === 'row' && Math.abs(dx) > this.slotStep * 1.5) bow = -Math.min(150, 0.32 * Math.abs(dx));
    const c = [(x1 + x2) / 2 + (-dy / L) * bow, (y1 + y2) / 2 + (dx / L) * bow];
    const u1 = unit(c[0] - x1, c[1] - y1);
    const u2 = unit(c[0] - x2, c[1] - y2);
    const s = [x1 + u1[0] * R, y1 + u1[1] * R];
    const tip = [x2 + u2[0] * (R + 1), y2 + u2[1] * (R + 1)];
    const dir = unit(tip[0] - c[0], tip[1] - c[1]);
    const end = this.directed ? [tip[0] - dir[0] * 8, tip[1] - dir[1] * 8] : tip;
    const len = (Math.hypot(end[0] - s[0], end[1] - s[1]) + Math.hypot(c[0] - s[0], c[1] - s[1]) + Math.hypot(end[0] - c[0], end[1] - c[1])) / 2;
    return { d: `M${pt(s)} Q${pt(c)} ${pt(end)}`, tip, dir, len };
  }

  renderEdge(e) {
    const g = this.geom(e);
    e.shaft.setAttribute('d', g.d);
    e.len = g.len;
    e.headG?.setAttribute('transform', `translate(${pt(g.tip)}) rotate(${deg(g.dir).toFixed(1)})`);
  }

  makeEdge(i, j) {
    const shaft = svg('path', { class: 'lx-rel-shaft' });
    const headG = this.directed ? svg('g', {}, svg('path', { d: HEAD, class: 'lx-rel-head' })) : null;
    const g = svg('g', { class: 'lx-rel-edge' }, shaft, headG);
    const e = { i, j, g, shaft, headG, len: 0 };
    this.edges.push(e);
    this.edgeLayer.append(g);
    this.renderEdge(e);
    const back = i !== j && this.find(j, i);
    if (back) this.renderEdge(back);
    return e;
  }

  /** Moves every node to this.pos and redraws the edges. */
  place() {
    this.vertices.forEach((v, i) => v.outer.setAttribute('transform', `translate(${pt(this.pos[i])})`));
    this.edges.forEach((e) => this.renderEdge(e));
  }

  addEdge(i, j, opts) {
    return this.drawEdge(this.clock, i, j, opts);
  }

  drawEdge(clock, i, j, { color, duration = 650 } = {}) {
    if (clock.dead || this.has(i, j)) return Promise.resolve();
    const e = this.makeEdge(i, j);
    if (color) e.g.style.color = tone(color).fg;
    return drawStroke(clock, e.shaft, lengthOf(e.shaft, e.len) + 2, { duration, head: e.headG });
  }

  removeEdge(i, j) {
    const e = this.find(i, j);
    if (!e) return Promise.resolve();
    this.edges.splice(this.edges.indexOf(e), 1);
    const back = this.find(j, i);
    if (back) this.renderEdge(back);
    return vanish(this.clock, e.g, { remove: true });
  }

  /** sel: [[i, j], …] or (i, j) => bool. */
  highlightEdges(sel, color = 'blue') {
    const pick = typeof sel === 'function' ? (e) => sel(e.i, e.j) : (e) => sel.some(([i, j]) => e.i === i && e.j === j);
    const list = this.edges.filter(pick);
    const clock = this.clock;
    return Promise.all([paint(clock, list.map((e) => e.g), { color: tone(color).fg }), paint(clock, list.map((e) => e.shaft), { 'stroke-width': 4 })]);
  }

  highlightNodes(indices, color = 'yellow') {
    const { fg, bg } = tone(color);
    return paint(this.clock, [indices].flat().map((i) => this.vertices[i]?.circle), { fill: bg, stroke: fg });
  }

  /**
   * Equivalence classes: nodes regroup so each class sits together (move: false keeps them), recolor by class,
   * and a soft blob appears around each class. classes: arrays of node indices.
   */
  async partition(classes, colors = PALETTE, { move = true, duration = 900 } = {}) {
    const clock = this.clock;
    const n = this.vertices.length;
    let target = this.pos.map((p) => [...p]);
    if (move) {
      const rest = this.vertices.map((_, i) => i).filter((i) => !classes.some((c) => c.includes(i)));
      const groups = rest.length ? [...classes, rest] : classes;
      const total = n + (this.layoutKind === 'row' ? groups.length - 1 : groups.length);
      this.slotStep = this.width / Math.max(1, total - 1);
      let s = 0;
      for (const group of groups) {
        for (const i of group) target[i] = this.slot(s++, total);
        s++;
      }
      let from = null;
      await tween(
        clock,
        (t) => {
          from ??= this.pos.map((p) => [...p]);
          this.pos = from.map((p, i) => [lerp(p[0], target[i][0], t), lerp(p[1], target[i][1], t)]);
          this.place();
        },
        { duration, ease: ease.inOut, start: () => (from = this.pos.map((p) => [...p])) },
      );
    }
    if (clock.dead) return;
    this.blobLayer.replaceChildren();
    const pad = this.nodeR + 14;
    const blobs = classes.map((cls, k) => {
      const { fg, bg } = tone(colors[k % colors.length]);
      const pts = cls.map((i) => target[i]);
      const hull = convexHull(pts);
      const blob =
        hull.length === 1
          ? svg('circle', { cx: hull[0][0], cy: hull[0][1], r: pad, class: 'lx-rel-blob' })
          : svg('path', { d: `M${hull.map(pt).join(' L')} Z`, class: 'lx-rel-blob', style: { strokeWidth: String(2 * pad) } });
      blob.style.fill = fg;
      blob.style.stroke = fg;
      blob.style.opacity = '0';
      this.blobLayer.append(blob);
      return { blob, cls, fg, bg };
    });
    await Promise.all(
      blobs.flatMap(({ blob, cls, fg, bg }, k) => [
        tween(clock, (t) => (blob.style.opacity = String(0.16 * t)), { duration: 500, delay: k * 120 }),
        paint(clock, cls.map((i) => this.vertices[i].circle), { fill: bg, stroke: fg }, { delay: k * 120 }),
      ]),
    );
  }

  /** Adds (one by one, in `color`) the edges missing for the reflexive, symmetric or transitive closure. */
  closure(kind = 'transitive', { color = 'green', gap = 260 } = {}) {
    const clock = this.clock;
    const n = this.vertices.length;
    const add = [];
    const want = (i, j) => !this.has(i, j) && !add.some(([a, b]) => a === i && b === j) && add.push([i, j]);
    if (kind === 'reflexive') for (let i = 0; i < n; i++) want(i, i);
    else if (kind === 'symmetric') for (const e of this.edges) want(e.j, e.i);
    else {
      const m = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => this.has(i, j)));
      for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (m[i][k] && m[k][j]) m[i][j] = true;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (m[i][j]) want(i, j);
    }
    return Promise.all(add.map(([i, j], k) => clock.wait(k * gap).then(() => this.drawEdge(clock, i, j, { color }))));
  }
}

// ---------------------------------------------------------------- number line

export class NumberLine extends Mob {
  /** labels: true (every tick), a number k (every k-th tick), a function v → string | null, or false. */
  constructor(stage, { width = 800, range = [-5, 5], ticks = 1, labels = true, size = 36, arrows = true, ...opts } = {}) {
    super(stage, svg('g', { class: 'lx-nl' }), { layer: 'back', ...opts });
    this.width = width;
    this.range = range;
    this.size = size;
    this.under = svg('g');
    const axis = svg('g', { class: 'lx-nl-axis' });
    this.over = svg('g');
    this.node.append(this.under, axis, this.over);
    const half = width / 2 + 24;
    axis.append(svg('line', { x1: -half, y1: 0, x2: half, y2: 0, class: 'lx-nl-line' }));
    if (arrows) {
      axis.append(svg('path', { d: HEAD, transform: `translate(${half + 6} 0)`, class: 'lx-nl-head' }));
      axis.append(svg('path', { d: HEAD, transform: `translate(${-half - 6} 0) rotate(180)`, class: 'lx-nl-head' }));
    }
    if (ticks) {
      const [a, b] = range;
      for (let k = Math.ceil(a / ticks - 1e-9), idx = 0; k * ticks <= b + 1e-9; k++, idx++) {
        const v = +(k * ticks).toFixed(10);
        const x = this.toX(v);
        axis.append(svg('line', { x1: x, y1: -9, x2: x, y2: 9, class: 'lx-nl-tick' }));
        const text = typeof labels === 'function' ? labels(v) : labels === true || (typeof labels === 'number' && idx % labels === 0) ? fmt(v) : null;
        if (text !== null && text !== undefined && text !== false) axis.append(svgText(text, { x, y: 38, size, cls: 'lx-nl-num' }));
      }
    }
    this.mainMarker = null;
  }

  toX(v) {
    const [a, b] = this.range;
    return ((v - a) / (b - a) - 0.5) * this.width;
  }

  /** A dot at v (open: hollow) with an optional label above it. Part.moveTo(v) slides it. */
  point(v, { color = 'blue', label, open = false, r = 9 } = {}) {
    const { fg } = tone(color);
    const inner = svg('g', { class: ['lx-nl-pt', open && 'lx-open'], style: { color: fg, opacity: '0' } }, svg('circle', { r }), label !== undefined ? svgText(label, { y: -36, size: this.size }) : null);
    const outer = svg('g', { transform: `translate(${this.toX(v).toFixed(1)} 0)` }, inner);
    this.over.append(outer);
    const part = new Part(outer, appear(this.clock, inner, { dy: 0, scale: 0.5, ease: ease.back }), this);
    part.v = v;
    part.moveTo = (to, opts) => this.slide(part, to, opts);
    return part;
  }

  slide(part, to, { duration = 700, label } = {}) {
    let from = part.v;
    const text = part.node.querySelector('text');
    return tween(
      this.clock,
      (t) => {
        const v = lerp(from, to, t);
        part.v = v;
        part.node.setAttribute('transform', `translate(${this.toX(v).toFixed(1)} 0)`);
        if (text && typeof label === 'function') setLabel(text, label(t >= 1 ? to : v), this.size);
        else if (text && label !== undefined && t >= 1) setLabel(text, label, this.size);
      },
      { duration, ease: ease.inOut, start: () => (from = part.v) },
    );
  }

  /** The interval between a and b (±Infinity for rays), drawn from a to b; open ends are hollow. */
  interval(a, b, { openA = false, openB = false, color = 'blue', duration = 700 } = {}) {
    const clock = this.clock;
    const { fg } = tone(color);
    const edge = this.width / 2 + 24;
    const xa = Number.isFinite(a) ? this.toX(a) : -edge;
    const xb = Number.isFinite(b) ? this.toX(b) : edge;
    const seg = svg('line', { x1: xa, y1: 0, x2: xa, y2: 0, class: 'lx-nl-seg' });
    const end = (x, finite, open, flip) =>
      finite ? svg('circle', { cx: x, cy: 0, r: 10, class: ['lx-nl-end', open && 'lx-open'], style: { opacity: '0' } }) : svg('path', { d: HEAD, transform: `translate(${x + (flip ? -8 : 8)} 0)${flip ? ' rotate(180)' : ''}`, class: 'lx-nl-endhead', style: { opacity: '0' } });
    const ea = end(xa, Number.isFinite(a), openA, true);
    const eb = end(xb, Number.isFinite(b), openB, false);
    const g = svg('g', { class: 'lx-nl-int', style: { color: fg } }, seg, ea, eb);
    this.over.append(g);
    const done = Promise.all([
      tween(clock, (t) => (ea.style.opacity = String(t)), { duration: 250 }),
      tween(clock, (t) => seg.setAttribute('x2', lerp(xa, xb, t).toFixed(1)), { duration, ease: ease.inOut }),
      tween(clock, (t) => (eb.style.opacity = String(t)), { duration: 250, delay: duration * 0.85 }),
    ]);
    return new Part(g, done, this);
  }

  /** A shaded band (center − eps, center + eps) whose width grows from 0, measured by a labeled bracket above. Part.to(eps) re-sizes it. */
  band(center, eps, { color = 'yellow', label = '\\varepsilon', height = 110, duration = 800 } = {}) {
    const { fg } = tone(color);
    const h = height / 2;
    const rect = svg('rect', { y: -h, height, class: 'lx-nl-band' });
    const left = svg('line', { y1: -h, y2: h, class: 'lx-nl-bandedge' });
    const right = svg('line', { y1: -h, y2: h, class: 'lx-nl-bandedge' });
    // the bracket and its label sit above the zone point and marker labels use (down to y = −76), so they stack
    const my = Math.min(-h - 14, -88);
    const measure = svg('line', { y1: my, y2: my, class: 'lx-nl-measure' });
    const text = label ? svgText(label, { y: my - 26, size: this.size }) : null;
    const g = svg('g', { class: 'lx-nl-bandg', style: { color: fg } }, rect, left, right, measure, text);
    this.under.append(g);
    const cx = this.toX(center);
    const pxPer = this.width / (this.range[1] - this.range[0]);
    const part = new Part(g, null, this);
    part.eps = 0;
    const set = (e) => {
      part.eps = e;
      const w = Math.max(0, e * pxPer);
      rect.setAttribute('x', (cx - w).toFixed(1));
      rect.setAttribute('width', (2 * w).toFixed(1));
      left.setAttribute('x1', (cx - w).toFixed(1));
      left.setAttribute('x2', (cx - w).toFixed(1));
      right.setAttribute('x1', (cx + w).toFixed(1));
      right.setAttribute('x2', (cx + w).toFixed(1));
      measure.setAttribute('x1', cx.toFixed(1));
      measure.setAttribute('x2', (cx + w).toFixed(1));
      text?.setAttribute('x', (cx + w / 2).toFixed(1));
    };
    set(0);
    part.to = (e, { duration: d = 700 } = {}) => {
      let from = part.eps;
      return tween(this.clock, (t) => set(lerp(from, e, t)), { duration: d, ease: ease.inOut, start: () => (from = part.eps) });
    };
    part.done = part.to(eps, { duration });
    return part;
  }

  /** Dots for fn(start), fn(start + 1), … appear one by one (earlier ones dim when `trail`). */
  sequence(fn, n, { color = 'blue', start = 1, gap = 260, r = 7, trail = true } = {}) {
    const clock = this.clock;
    const { fg } = tone(color);
    const g = svg('g', { class: 'lx-nl-seq', style: { color: fg } });
    this.over.append(g);
    const [a, b] = this.range;
    const dots = [];
    for (let k = start; k < start + n; k++) {
      const v = fn(k);
      if (!(v >= a && v <= b)) continue;
      const inner = svg('circle', { r, style: { opacity: '0' } });
      g.append(svg('g', { transform: `translate(${this.toX(v).toFixed(1)} 0)` }, inner));
      dots.push(inner);
    }
    const lift = -26;
    const done = Promise.all(
      dots.map((dot, k) =>
        tween(
          clock,
          (t) => {
            dot.style.opacity = String(t);
            dot.style.transform = t >= 1 ? '' : `translateY(${(1 - t) * lift}px)`;
            if (trail && k > 0) dots[k - 1].style.opacity = String(lerp(1, 0.45, t));
          },
          { duration: 380, delay: k * gap },
        ),
      ),
    );
    const part = new Part(g, done, this);
    part.dots = dots;
    return part;
  }

  /** A pointer above the line at v; label may be a function of the current value. Part.moveTo(v, { label }). */
  marker(v, { label, color = 'red' } = {}) {
    const { fg } = tone(color);
    const text = label !== undefined ? svgText(typeof label === 'function' ? label(v) : label, { y: -58, size: this.size }) : null;
    const inner = svg('g', { class: 'lx-nl-marker', style: { color: fg, opacity: '0' } }, svg('path', { d: 'M0 -12 L-11 -32 L11 -32 Z' }), text);
    const outer = svg('g', { transform: `translate(${this.toX(v).toFixed(1)} 0)` }, inner);
    this.over.append(outer);
    const part = new Part(outer, appear(this.clock, inner, { dy: -12 }), this);
    part.v = v;
    part.label = label;
    part.moveTo = (to, opts = {}) => this.slide(part, to, { label: opts.label ?? (typeof part.label === 'function' ? part.label : undefined), ...opts });
    return part;
  }

  /** Moves the line's own marker to v (it appears at v the first time). */
  moveMarker(v, opts = {}) {
    if (!this.mainMarker) {
      this.mainMarker = this.marker(v, opts);
      return this.mainMarker.done;
    }
    if (opts.label !== undefined) this.mainMarker.label = opts.label;
    return this.mainMarker.moveTo(v, opts);
  }
}

// ---------------------------------------------------------------- Cantor's diagonal

export class DigitGrid extends Mob {
  constructor(stage, { rows = [], rowLabels, size = 36, prefix = '0.', more = true, label = 'x', ...opts } = {}) {
    const m = Math.max(1, ...rows.map((r) => r.length));
    const node = el('div', { class: 'lx-dg', style: { fontSize: `${size}px`, gridTemplateColumns: `auto auto repeat(${m}, 1.15em)${more ? ' auto' : ''}` } });
    super(stage, node, opts);
    this.m = m;
    this.cells = rows.map((row, i) => {
      node.append(el('div', { class: 'lx-dg-label', html: katexHtml(rowLabels?.[i] ?? `f(${i + 1})`, { display: false }) }), el('div', { class: 'lx-dg-eq', html: katexHtml(`= ${prefix}`, { display: false }) }));
      const cells = Array.from({ length: m }, (_, j) => el('div', { class: 'lx-dg-d lx-hl', text: row[j] ?? '' }));
      node.append(...cells);
      if (more) node.append(el('div', { class: 'lx-dg-more', html: katexHtml('\\ldots', { display: false }) }));
      return cells;
    });
    if (more) node.append(el('div', { class: 'lx-dg-label lx-dg-vdots', text: '⋮' }), el('div', { class: 'lx-dg-gapfill' }));
    const hidden = { opacity: '0' };
    const newLabel = el('div', { class: 'lx-dg-label lx-dg-new', html: katexHtml(label, { display: false }), style: hidden });
    const newEq = el('div', { class: 'lx-dg-eq lx-dg-new', html: katexHtml(`= ${prefix}`, { display: false }), style: hidden });
    const slots = Array.from({ length: m }, () => el('div', { class: 'lx-dg-d lx-dg-new lx-dg-slot', style: hidden }));
    const newMore = more ? el('div', { class: 'lx-dg-more lx-dg-new', html: katexHtml('\\ldots', { display: false }), style: hidden }) : null;
    node.append(newLabel, newEq, ...slots, newMore);
    this.newRow = { head: [newLabel, newEq], slots, more: newMore };
  }

  highlightCell(i, j, color = 'yellow') {
    return glow(this.clock, this.cells[i]?.[j], color, true);
  }

  highlightDiagonal({ color = 'yellow', gap = 160 } = {}) {
    const clock = this.clock;
    const n = Math.min(this.cells.length, this.m);
    return Promise.all(Array.from({ length: n }, (_, k) => glow(clock, this.cells[k][k], color, true, { delay: k * gap })));
  }

  /**
   * Builds the new number under the grid: digit k of row k flies down to place k and changes (change(d, k) → new
   * digit, default 5 unless d is 5, then 6), so the new number differs from every row.
   */
  async buildDiagonal({ change = (d) => (Number(d) === 5 ? 6 : 5), color = 'red', duration = 520, gap = 120 } = {}) {
    const clock = this.clock;
    const { fg } = tone(color);
    const n = Math.min(this.cells.length, this.m);
    const R = this.newRow;
    await Promise.all([...R.head, R.more].filter(Boolean).map((node) => appear(clock, node, { dy: 6 })));
    for (let k = 0; k < n; k++) {
      if (clock.dead) return;
      const src = this.cells[k][k];
      const dst = R.slots[k];
      const d = src.textContent;
      glow(clock, src, 'yellow', true, { duration: 200 });
      const fly = el('div', { class: 'lx-dg-fly', text: d, style: { width: `${src.offsetWidth}px`, height: `${src.offsetHeight}px` } });
      this.node.append(fly);
      const [x0, y0, x1, y1] = [src.offsetLeft, src.offsetTop, dst.offsetLeft, dst.offsetTop];
      await tween(clock, (t) => (fly.style.transform = `translate(${lerp(x0, x1, t)}px, ${lerp(y0, y1, t)}px)`), { duration, ease: ease.inOut });
      fly.remove();
      const next = String(change(d, k));
      await tween(
        clock,
        (t) => {
          if (t < 0.5) {
            dst.textContent = d;
            dst.style.opacity = String(1 - 2 * t);
          } else {
            dst.textContent = next;
            dst.style.color = fg;
            dst.style.opacity = String(2 * t - 1);
          }
        },
        { duration: 420, ease: ease.linear, start: () => (dst.style.opacity = '1') },
      );
      if (gap) await clock.wait(gap);
    }
  }
}

// ---------------------------------------------------------------- induction dominoes

export class Dominoes extends Mob {
  /**
   * Domino i (0-based) is labeled label(start + i). Each pivots on its bottom-right corner and falls right.
   * labelSize (default size): labels shrink (to 28 at least) when wider than the spacing, then tilt −40°.
   */
  constructor(stage, { n = 8, label = (k) => `P(${k})`, start = 1, w = 24, h = 116, gap = 64, size = 34, labelSize, more = true, ...opts } = {}) {
    super(stage, svg('g', { class: 'lx-dom' }), { layer: 'back', ...opts });
    this.count = n;
    this.h = h;
    this.w = w;
    this.more = more;
    this.ground = h / 2;
    this.lean = (Math.asin(Math.min(1, gap / h)) * 180) / Math.PI;
    const pitch = w + gap;
    const tail = more ? gap + 60 : h + 10;
    const span = (n - 1) * pitch + w + tail;
    const left = -span / 2;
    const xr = (i) => left + w + i * pitch;
    this.node.append(svg('line', { x1: left - 30, y1: this.ground, x2: left + span + 10, y2: this.ground, class: 'lx-dom-ground' }));
    const labels = Array.from({ length: n }, (_, i) => label(start + i));
    const room = pitch - 10;
    const widest = Math.max(1, ...labels.map((s) => textW(s, 1)));
    let fs = labelSize ?? size;
    if (widest * fs > room) fs = Math.max(28, room / widest);
    const tilt = widest * fs > room;
    this.pieces = Array.from({ length: n }, (_, i) => {
      const rect = svg('rect', { x: -w, y: -h, width: w, height: h, rx: 4, class: 'lx-dom-piece' });
      const g = svg('g', {}, rect);
      const lx = xr(i) - w / 2;
      const text = tilt
        ? svgText(labels[i], { x: lx + 8, y: this.ground + 22, size: fs, anchor: 'end', cls: 'lx-dom-label' })
        : svgText(labels[i], { x: lx, y: this.ground + 40, size: fs, cls: 'lx-dom-label' });
      if (tilt) text.setAttribute('transform', `rotate(-40 ${(lx + 8).toFixed(1)} ${this.ground + 22})`);
      this.node.append(g, text);
      const p = { g, rect, text, xr: xr(i), angle: 0 };
      this.setAngle(p, 0);
      return p;
    });
    if (more) this.node.append(svgText('⋯', { x: xr(n - 1) + gap + 34, y: this.ground - h / 2, size: 44, cls: 'lx-dom-more' }));
    this.pusher = null;
  }

  setAngle(p, a) {
    p.angle = a;
    p.g.setAttribute('transform', `translate(${p.xr.toFixed(1)} ${this.ground}) rotate(${a.toFixed(2)})`);
  }

  /** Dominoes from..to−1 fall in sequence, each starting as the previous one lands on it. */
  topple(from = 0, { to = this.count, gap, duration = 380 } = {}) {
    const clock = this.clock;
    const step = gap ?? duration * 0.92;
    const fall = (t) => t * t;
    const list = this.pieces.slice(from, to);
    return Promise.all(
      list.map((p, k) => {
        const i = from + k;
        const end = i === this.count - 1 && !this.more ? 90 : this.lean;
        let a0 = p.angle;
        return tween(clock, (t) => this.setAngle(p, lerp(a0, end, t)), { duration, delay: k * step, ease: fall, start: () => (a0 = p.angle) });
      }),
    );
  }

  /** The base case: an arrow nudges domino i, which rocks and turns green. */
  async push(i = 0, { color = 'green' } = {}) {
    const clock = this.clock;
    const p = this.pieces[i];
    if (!p) return;
    const y = this.ground - this.h * 0.72;
    const tipX = p.xr - this.w - 6;
    this.pusher?.remove();
    const arrow = svg('g', { class: 'lx-dom-push', style: { opacity: '0' } }, svg('line', { x1: -60, y1: 0, x2: -10, y2: 0 }), svg('path', { d: HEAD }));
    const outer = svg('g', { transform: `translate(${tipX} ${y})` }, arrow);
    this.node.append(outer);
    this.pusher = outer;
    await tween(
      clock,
      (t) => {
        arrow.style.opacity = String(Math.min(1, t * 2));
        arrow.style.transform = t >= 1 ? '' : `translateX(${(1 - t) * -40}px)`;
      },
      { duration: 450, ease: ease.out },
    );
    if (clock.dead) return;
    const { fg, bg } = tone(color);
    await Promise.all([tween(clock, (t) => this.setAngle(p, 7 * ease.there(t)), { duration: 520, ease: ease.linear }), paint(clock, p.rect, { fill: bg, stroke: fg }), paint(clock, p.text, { fill: fg })]);
    await vanish(clock, arrow, { duration: 300 });
  }

  highlight(k, color = 'yellow') {
    const p = this.pieces[k];
    if (!p) return Promise.resolve();
    const { fg, bg } = tone(color);
    const clock = this.clock;
    return Promise.all([paint(clock, p.rect, { fill: bg, stroke: fg }), paint(clock, p.text, { fill: fg })]);
  }

  /** Every domino stands up again; highlights go. */
  reset({ duration = 600 } = {}) {
    const clock = this.clock;
    const pusher = this.pusher;
    this.pusher = null;
    return Promise.all([
      ...this.pieces.map((p) => {
        let a0 = p.angle;
        return tween(clock, (t) => this.setAngle(p, lerp(a0, 0, t)), { duration, ease: ease.inOut, start: () => (a0 = p.angle) });
      }),
      paint(clock, this.pieces.map((p) => p.rect), { fill: null, stroke: null }),
      paint(clock, this.pieces.map((p) => p.text), { fill: null }),
      vanish(clock, pusher, { remove: true }),
    ]);
  }
}

// ---------------------------------------------------------------- modular clock

export class ModClock extends Mob {
  /** Residues 0 … n−1 clockwise from the top on a circle of radius r. Hop arcs run inside the ring. */
  constructor(stage, { n = 12, r = 140, nodeR = 28, size = 34, ...opts } = {}) {
    super(stage, svg('g', { class: 'lx-mod' }), { layer: 'back', ...opts });
    this.n = n;
    this.r = r;
    this.nodeR = nodeR;
    this.size = size;
    this.arcLayer = svg('g');
    this.nodeLayer = svg('g');
    this.wrapLayer = svg('g');
    this.node.append(svg('circle', { r, class: 'lx-mod-ring' }), this.arcLayer, this.nodeLayer, this.wrapLayer);
    this.residues = Array.from({ length: n }, (_, k) => {
      const circle = svg('circle', { r: nodeR, class: 'lx-mod-node' });
      const text = svgText(String(k), { size });
      const inner = svg('g', { class: 'lx-mod-res' }, circle, text);
      this.nodeLayer.append(svg('g', { transform: `translate(${pt(this.polar(k, r))})` }, inner));
      return { inner, circle, text, wrapped: [] };
    });
    this.lit = null;
    this.wraps = 0;
  }

  mod(k) {
    return ((k % this.n) + this.n) % this.n;
  }

  /** Angle in degrees of position k (fractional allowed). */
  angle(k) {
    return -90 + (360 * k) / this.n;
  }

  polar(k, rad) {
    const a = (this.angle(k) * Math.PI) / 180;
    return [rad * Math.cos(a), rad * Math.sin(a)];
  }

  /** One hop arc (inside the ring) from residue a, `by` steps (negative = counter-clockwise; |by| > n spirals inward). */
  makeArc(a, by, fg) {
    const R = this.r - this.nodeR - 16;
    const trim = Math.sign(by) * Math.min(0.25, Math.abs(by) * 0.18);
    const from = a + trim;
    const to = a + by - trim;
    const steps = Math.max(4, Math.ceil((Math.abs(to - from) * 360) / this.n / 3));
    const pts = [];
    for (let s = 0; s <= steps; s++) {
      const k = lerp(from, to, s / steps);
      pts.push(this.polar(k, R - (10 * Math.abs(k - from)) / this.n));
    }
    const tip = pts.at(-1);
    const dir = unit(tip[0] - pts.at(-2)[0], tip[1] - pts.at(-2)[1]);
    pts[pts.length - 1] = [tip[0] - dir[0] * 8, tip[1] - dir[1] * 8];
    let len = 0;
    for (let s = 1; s < pts.length; s++) len += Math.hypot(pts[s][0] - pts[s - 1][0], pts[s][1] - pts[s - 1][1]);
    const shaft = svg('path', { d: `M${pts.map(pt).join(' L')}`, class: 'lx-mod-arc' });
    const headG = svg('g', { transform: `translate(${pt(tip)}) rotate(${deg(dir).toFixed(1)})` }, svg('path', { d: HEAD, class: 'lx-mod-head' }));
    const g = svg('g', { class: 'lx-mod-hop', style: { color: fg } }, shaft, headG);
    this.arcLayer.append(g);
    return { g, shaft, headG, len };
  }

  /** `count` hops of `by`, starting at `from`; the current residue stays lit. Resolves to the landing residue. */
  async step(from, by, { color = 'blue', count = 1, duration = 650, pause = 140 } = {}) {
    const clock = this.clock;
    const { fg, bg } = tone(color);
    let at = this.mod(from);
    await this.light(clock, at, fg, bg);
    for (let h = 0; h < count; h++) {
      if (clock.dead) break;
      const arc = this.makeArc(at, by, fg);
      await drawStroke(clock, arc.shaft, arc.len, { duration, head: arc.headG });
      at = this.mod(at + by);
      await this.light(clock, at, fg, bg);
      if (pause && h < count - 1) await clock.wait(pause);
    }
    return at;
  }

  light(clock, k, fg, bg) {
    const prev = this.lit;
    this.lit = k;
    const res = this.residues[k];
    return Promise.all([
      prev !== null && prev !== k ? paint(clock, this.residues[prev].circle, { fill: null, stroke: null }) : null,
      paint(clock, res.circle, { fill: bg, stroke: fg }),
      pulse(clock, res.inner, { scale: 1.15 }),
    ]);
  }

  highlight(k, color = 'yellow') {
    const clock = this.clock;
    const { fg, bg } = tone(color);
    const res = this.residues[this.mod(k)];
    return Promise.all([paint(clock, res.circle, { fill: bg, stroke: fg }), pulse(clock, res.inner, { scale: 1.15 })]);
  }

  /** Writes start, start+1, … around the clock in rings outside it: each integer sits on the spoke of its residue. */
  wrap(count, { start = 0, gap = 110 } = {}) {
    const clock = this.clock;
    const anims = [];
    for (let idx = 0; idx < count; idx++) {
      const k = start + idx;
      const ring = Math.floor((this.wraps + idx) / this.n);
      const [x, y] = this.polar(k, this.r + this.nodeR + 30 + ring * this.size * 1.5);
      const text = svgText(fmt(k), { x: 0, y: 0, size: this.size, cls: 'lx-mod-wrap' });
      text.style.opacity = '0';
      this.wrapLayer.append(svg('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, text));
      this.residues[this.mod(k)].wrapped.push(text);
      anims.push(appear(clock, text, { dy: 0, scale: 0.7, delay: idx * gap, duration: 360 }));
    }
    this.wraps += count;
    return Promise.all(anims);
  }

  /** Colors residue k (and the integers wrapped onto it) by k mod `mod`: the residue classes. */
  classes({ mod = this.n, colors = PALETTE, gap = 60 } = {}) {
    const clock = this.clock;
    return Promise.all(
      this.residues.flatMap((res, k) => {
        const { fg, bg } = tone(colors[(k % mod) % colors.length]);
        return [paint(clock, res.circle, { fill: bg, stroke: fg }, { delay: k * gap }), paint(clock, [res.text, ...res.wrapped], { fill: fg }, { delay: k * gap })];
      }),
    );
  }

  /** Removes hop arcs, wrapped integers and colors. */
  clear() {
    const clock = this.clock;
    const arcs = [...this.arcLayer.children];
    const wraps = [...this.wrapLayer.children];
    this.lit = null;
    this.wraps = 0;
    this.residues.forEach((res) => (res.wrapped = []));
    return Promise.all([
      vanish(clock, [...arcs, ...wraps], { remove: true }),
      paint(clock, this.residues.map((res) => res.circle), { fill: null, stroke: null }),
      paint(clock, this.residues.map((res) => res.text), { fill: null }),
    ]);
  }
}

extend({
  venn(opts) {
    return new Venn(this, opts);
  },
  mapDiagram(opts) {
    return new MapDiagram(this, opts);
  },
  relationGraph(opts) {
    return new RelationGraph(this, opts);
  },
  numberLine(opts) {
    return new NumberLine(this, opts);
  },
  digitGrid(opts) {
    return new DigitGrid(this, opts);
  },
  dominoes(opts) {
    return new Dominoes(this, opts);
  },
  modClock(opts) {
    return new ModClock(this, opts);
  },
});
