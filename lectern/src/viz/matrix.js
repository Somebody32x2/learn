/**
 * MatrixMob: a matrix on the HTML layer whose entries animate through row operations (Lay ch. 1–2).
 *
 *   const m = s.matrix([[1, 2, 3], [0, '1/2', -1]], { x, y, size: 40, augment: 2, brackets: '[]' });
 *
 * Entries: Frac, number, or string. Numeric strings ('-3/4', '0.5') become Fracs; other strings are TeX
 * ('a_{11}', '\\ast') and are shown as-is (row operations on them throw). Fracs render with `.tex()`; decimals
 * ('0.9', 0.25) are shown as written, and once a matrix has one, computed entries show as decimals when they terminate.
 * Fractions render as \dfrac (display size, so numerator and denominator stay readable) in entries, notes and chips.
 * Rows: at least `rowHeight` (px) if given, else 1.75·size, or 1.2·size with `compact` (default for one-column
 * matrices, with rowGap 0); a row holding a fraction grows to fit it. `rowGap` is the space between row tracks.
 * Layout: a CSS grid (each cell its own element, KaTeX inside), brackets drawn with CSS borders so they scale with
 * the number of rows, an optional bar before column `augment`. Highlights, pivot rings, notes and the ghost row
 * of addRow are absolutely positioned *grid areas*, so they stay aligned however wide the columns become.
 *
 * Methods (animated ones return Promises on the stage clock; the internal values update at call time, so
 * `values()` is always the matrix after every operation called so far):
 *   cell(i, j) → element                    cellBox(i, j) / rowBox(i) / colBox(j) → stage box { x, y, w, h, cx, cy }
 *   highlightRow(i, color) / highlightCol(j, color) / highlightCell(i, j, color)      clearHighlights()
 *   setEntry(i, j, value)                   old value slides up and out, the new one slides in
 *   setRows(rows)                           changed entries animate (another shape: crossfade rebuild)
 *   swapRows(i, j)                          rows slide past each other on curved paths
 *   scaleRow(i, k)                          a "×k" chip appears beside the row, its entries update
 *   addRow(i, j, k)                         row i += k·row j: a ghost copy of row j (labeled kR_{j+1}) slides onto row i
 *   rowOp(step, { note = true })            dispatches an rref step { op: 'swap'|'scale'|'add', i, j, k } (core/linalg.js),
 *                                           showing texRowOp(step) as the note of row i
 *   pivot(i, j, { color })                  ring around an entry (stays)              clearPivots()
 *   note(i, tex, { color })                 TeX to the right of row i, replacing the previous note; note() clears
 *   values() → rows (Frac, or the TeX string for symbolic entries)        m, n (shape)
 * Rows and columns are 0-based in the API; labels (R_1, …) are 1-based like the textbook.
 */
import { Mob, katexHtml } from '../core/mobject.js';
import { el } from '../core/dom.js';
import { extend, C } from '../core/stage.js';
import { ease, lerp } from '../core/tween.js';
import { F, Frac, parseFrac } from '../core/frac.js';
import { texRowOp } from '../core/linalg.js';
import { soft } from './shapes.js';

const norm = (v) => {
  if (v instanceof Frac) return v;
  if (typeof v === 'number' || typeof v === 'bigint') return F(v);
  const s = String(v);
  return parseFrac(s) ?? s;
};
const texOf = (v) => (v instanceof Frac ? v.tex() : String(v));
/** Display-size fractions (inline \frac / \tfrac shrink numerator and denominator below readable size on stage). */
const bigFrac = (tex) => tex.replace(/\\[td]?frac(?![a-zA-Z])/g, '\\dfrac');
/** The text an entry was written with when it should be shown as written (decimals: '0.9', 0.25), else null. */
const written = (raw, v) => {
  if (!(v instanceof Frac)) return null;
  if (typeof raw === 'number' && !Number.isInteger(raw)) return String(raw);
  if (typeof raw === 'string' && raw.includes('.')) return raw.trim();
  return null;
};
/** A terminating decimal for a Frac ('0.45'), or null when it needs more than 8 places. */
function decimalOf(v) {
  let places = 0;
  while ((v.n * 10n ** BigInt(places)) % v.d !== 0n) if (++places > 8) return null;
  const k = (v.n * 10n ** BigInt(places)) / v.d;
  if (!places) return `${k}`;
  const neg = k < 0n, s = `${neg ? -k : k}`.padStart(places + 1, '0');
  return `${neg ? '-' : ''}${s.slice(0, -places)}.${s.slice(-places)}`;
}
const num = (v, what) => {
  if (v instanceof Frac) return v;
  throw new TypeError(`matrix.${what}: entry "${v}" is not a number`);
};

/** A tween whose `end` runs synchronously when it reaches t = 1 (so instant seeking leaves the exact end state). */
function run(clock, { duration = 500, delay = 0, ease: e = ease.inOut, start, update, end }) {
  let done = false;
  return clock.tween({
    duration,
    delay,
    ease: e,
    start,
    update: (t) => {
      update?.(t);
      if (t >= 1 && !done) {
        done = true;
        end?.();
      }
    },
  });
}

export class MatrixMob extends Mob {
  constructor(stage, rows, { size = 40, augment = null, colGap, rowGap, rowHeight, compact, color, brackets = '[]', ...opts } = {}) {
    const node = el('div', { class: 'lx-matrix', style: { fontSize: `${size}px`, color } });
    super(stage, node, { ...opts, layer: 'html' });
    this.size = size;
    this.aug = augment;
    this.compact = compact ?? (rows[0]?.length ?? 0) === 1;
    this.rowHeight = rowHeight;
    this.gapY = rowGap ?? (this.compact ? 0 : Math.round(size * 0.15));
    this.gapX = colGap ?? Math.round(size * 0.6);
    this.side = Math.round(size * 0.95);
    this.labelSize = Math.max(26, Math.round(size * 0.72));
    this.kind = { '[]': 'sq', '()': 'paren', '||': 'bar' }[brackets] ?? 'none';
    this.build(rows);
  }

  get m() {
    return this.vals.length;
  }
  get n() {
    return this.vals[0]?.length ?? 0;
  }
  /** Vertical center of row i inside the grid (logical px; rows can differ in height when fractions show). */
  rowCenter(i) {
    const c = this.cells[i][0];
    return c.offsetTop + c.offsetHeight / 2;
  }
  /** Grid column of matrix column j (the augment bar takes a column). */
  gc(j) {
    return j + 1 + (this.aug !== null && j >= this.aug ? 1 : 0);
  }

  build(rows) {
    this.vals = rows.map((r) => r.map(norm));
    // Display text per entry: decimals stay as written; once any entry is a decimal, computed values show as decimals too.
    this.decimal = rows.some((r, i) => r.some((raw, j) => written(raw, this.vals[i][j]) !== null));
    this.texs = rows.map((r, i) => r.map((raw, j) => this.shown(raw, this.vals[i][j])));
    const m = this.m, n = this.n;
    // Minimum row track: explicit `rowHeight`, else roomy (1.75em) or compact (1.2em); rows with fractions grow.
    this.rowH = Math.round(this.rowHeight ?? this.size * (this.compact ? 1.2 : 1.75));
    if (this.aug !== null && !(this.aug > 0 && this.aug < n)) this.aug = null;
    const cw = `minmax(${Math.round(this.size * 1.2)}px, auto)`;
    const colsT = this.aug !== null ? `repeat(${this.aug}, ${cw}) ${Math.round(this.size * 0.1)}px repeat(${n - this.aug}, ${cw})` : `repeat(${n}, ${cw})`;
    this.grid = el('div', {
      class: 'lx-mat-grid',
      style: { gridTemplateColumns: colsT, gridTemplateRows: `repeat(${m}, minmax(${this.rowH}px, auto))`, columnGap: `${this.gapX}px`, rowGap: `${this.gapY}px` },
    });
    this.cells = this.vals.map((row, i) =>
      row.map((v, j) => {
        const c = el('div', { class: 'lx-mat-cell', style: { gridRow: `${i + 1}`, gridColumn: `${this.gc(j)}` } }, this.entry(this.texs[i][j]));
        this.grid.append(c);
        return c;
      }),
    );
    if (this.aug !== null) this.grid.append(el('div', { class: 'lx-mat-bar', style: { gridRow: '1 / -1', gridColumn: `${this.aug + 1}` } }));
    const br = this.kind === 'none' ? [] : [el('div', { class: `lx-mat-br lx-mat-br-l lx-br-${this.kind}` }), el('div', { class: `lx-mat-br lx-mat-br-r lx-br-${this.kind}` })];
    this.node.replaceChildren(el('div', { class: 'lx-mat-body' }, br, this.grid));
    this.hls = [];
    this.pivots = [];
    this.noteEl = null;
  }

  entry(tex) {
    const t = bigFrac(tex);
    return el('span', { class: ['lx-mat-entry', t.includes('\\dfrac') && 'lx-mat-frac'], html: katexHtml(t, { display: false }) });
  }

  /**
   * An absolutely positioned element filling a grid area (rows/cols are CSS grid-line strings). A single line
   * number becomes `n / span 1`: for absolutely positioned grid children an `auto` end line means the container edge.
   */
  overlay(cls, row, col, style = {}) {
    const area = (v) => (String(v).includes('/') ? String(v) : `${v} / span 1`);
    const o = el('div', { class: cls, style: { gridRow: area(row), gridColumn: area(col), ...style } });
    this.grid.append(o);
    return o;
  }

  /** TeX beside row i: right (notes) or left (chips, ghost labels); `extra` px push it further out. */
  sideLabel(i, tex, { right = true, color, chip = false, extra = 0 } = {}) {
    const o = this.overlay(`lx-mat-side ${right ? 'lx-mat-side-r' : 'lx-mat-side-l'}`, `${i + 1}`, '1 / -1', {
      [right ? 'left' : 'right']: `calc(100% + ${this.side + extra}px)`,
      fontSize: `${this.labelSize}px`,
      color,
      opacity: '0',
    });
    o.append(el('span', { class: chip ? 'lx-mat-chip' : 'lx-mat-sidetex', html: katexHtml(bigFrac(tex), { display: false }) }));
    return o;
  }

  /**
   * A chip (×k, kR_j) for row i: on the left, or on the right (past the current note) when the matrix's left edge is
   * closer than 150 px to the stage edge.
   */
  chipLabel(i, tex, { color } = {}) {
    if (this.box().x >= 150) return this.sideLabel(i, tex, { right: false, color, chip: true });
    const note = this.noteEl ? this.noteEl.firstChild.offsetWidth + Math.round(this.size * 0.4) : 0;
    return this.sideLabel(i, tex, { right: true, color, chip: true, extra: note });
  }

  // ---- geometry ----

  cell(i, j) {
    return this.cells[i][j];
  }
  rectsBox(nodes) {
    const rs = nodes.map((n) => n.getBoundingClientRect());
    const left = Math.min(...rs.map((r) => r.left));
    const top = Math.min(...rs.map((r) => r.top));
    const right = Math.max(...rs.map((r) => r.right));
    const bottom = Math.max(...rs.map((r) => r.bottom));
    const b = this.stage.toStage({ left, top, width: right - left, height: bottom - top });
    return { ...b, cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
  }
  cellBox(i, j) {
    return this.rectsBox([this.cells[i][j]]);
  }
  rowBox(i) {
    return this.rectsBox(this.cells[i]);
  }
  colBox(j) {
    return this.rectsBox(this.cells.map((r) => r[j]));
  }

  values() {
    return this.vals.map((r) => r.slice());
  }

  // ---- highlights ----

  highlight(row, col, color = C.yellow, { duration = 350, delay = 0 } = {}) {
    const h = this.overlay('lx-mat-hl', row, col, { background: soft(color, 20), boxShadow: `inset 0 0 0 2px ${soft(color, 55)}`, opacity: '0' });
    this.hls.push(h);
    return run(this.clock, { duration, delay, ease: ease.out, update: (t) => (h.style.opacity = `${t}`) });
  }
  highlightRow(i, color, opts) {
    return this.highlight(`${i + 1}`, '1 / -1', color, opts);
  }
  highlightCol(j, color, opts) {
    return this.highlight('1 / -1', `${this.gc(j)}`, color, opts);
  }
  highlightCell(i, j, color, opts) {
    return this.highlight(`${i + 1}`, `${this.gc(j)}`, color, opts);
  }
  clearHighlights({ duration = 300, delay = 0 } = {}) {
    const hs = this.hls;
    this.hls = [];
    return this.fadeAway(hs, { duration, delay });
  }

  fadeAway(nodes, { duration = 300, delay = 0 } = {}) {
    if (!nodes.length) return Promise.resolve();
    const from = nodes.map((n) => parseFloat(n.style.opacity || '1'));
    return run(this.clock, {
      duration,
      delay,
      ease: ease.out,
      update: (t) => nodes.forEach((n, k) => (n.style.opacity = `${from[k] * (1 - t)}`)),
      end: () => nodes.forEach((n) => n.remove()),
    });
  }

  fadeEl(node, { duration = 350, delay = 0, dx = 0, dy = 0 } = {}) {
    return run(this.clock, {
      duration,
      delay,
      ease: ease.out,
      update: (t) => {
        node.style.opacity = `${t}`;
        node.style.transform = t >= 1 ? '' : `translate(${dx * (1 - t)}px, ${dy * (1 - t)}px)`;
      },
    });
  }

  pivot(i, j, { color = C.blue, duration = 450, delay = 0 } = {}) {
    const r = this.overlay('lx-mat-pivot', `${i + 1}`, `${this.gc(j)}`, { borderColor: color, opacity: '0' });
    this.pivots.push(r);
    return run(this.clock, {
      duration,
      delay,
      ease: ease.out,
      update: (t) => {
        r.style.opacity = `${t}`;
        r.style.transform = t >= 1 ? '' : `scale(${1.35 - 0.35 * t})`;
      },
    });
  }
  clearPivots(opts) {
    const ps = this.pivots;
    this.pivots = [];
    return this.fadeAway(ps, opts);
  }

  /** Shows TeX to the right of row i (replacing the previous note). note() with no tex just clears. */
  note(i, tex, { color = C.muted, duration = 350, delay = 0 } = {}) {
    const old = this.noteEl;
    this.noteEl = null;
    const jobs = [];
    if (old) jobs.push(this.fadeAway([old], { duration: 250, delay }));
    if (i !== undefined && i !== null && tex) {
      const n = this.sideLabel(i, tex, { right: true, color });
      this.noteEl = n;
      jobs.push(this.fadeEl(n, { duration, delay: delay + (old ? 120 : 0), dx: -12 }));
    }
    return Promise.all(jobs);
  }

  // ---- entries ----

  /** Crossfades the content of a cell-like container to new TeX: old slides up and out, new slides in from below. */
  replaceIn(container, tex, { duration = 550, delay = 0, dir = 1 } = {}) {
    const d = this.size * 0.55 * dir;
    let olds = [], neu = null;
    const begin = () => {
      if (neu) return;
      olds = [...container.querySelectorAll(':scope > .lx-mat-entry')];
      neu = this.entry(tex);
      neu.style.opacity = '0';
      container.append(neu);
    };
    return run(this.clock, {
      duration,
      delay,
      ease: ease.inOut,
      start: begin,
      update: (t) => {
        begin();
        olds.forEach((o) => {
          o.style.opacity = `${1 - t}`;
          o.style.transform = `translateY(${-d * t}px)`;
        });
        neu.style.opacity = `${t}`;
        neu.style.transform = `translateY(${d * (1 - t)}px)`;
      },
      end: () => {
        olds.forEach((o) => o.remove());
        neu.style.opacity = '';
        neu.style.transform = '';
      },
    });
  }

  /** Display TeX for a value: as written for decimals; computed values in a decimal matrix as decimals; else Frac TeX. */
  shown(raw, v) {
    const w = written(raw, v);
    if (w !== null) return w;
    if (this.decimal && v instanceof Frac && raw === v) return decimalOf(v) ?? texOf(v);
    return texOf(v);
  }

  setEntry(i, j, value, opts) {
    const v = norm(value);
    this.vals[i][j] = v;
    this.texs[i][j] = this.shown(value, v);
    return this.replaceIn(this.cells[i][j], this.texs[i][j], opts);
  }

  setRows(rows, { duration, delay = 0, gap = 40 } = {}) {
    const next = rows.map((r) => r.map(norm));
    if (next.length !== this.m || next[0]?.length !== this.n) {
      const o = this.state.opacity || 1;
      this.vals = next;
      return run(this.clock, { duration: 300, delay, ease: ease.out, update: (t) => this.set({ opacity: o * (1 - t) }), end: () => this.build(rows) }).then(() =>
        run(this.clock, { duration: 350, ease: ease.out, update: (t) => this.set({ opacity: o * t }) }),
      );
    }
    const jobs = [];
    let k = 0;
    next.forEach((row, i) =>
      row.forEach((v, j) => {
        const tex = this.shown(rows[i][j], v);
        if (tex !== this.texs[i][j]) jobs.push(this.replaceIn(this.cells[i][j], tex, { duration, delay: delay + gap * k++ }));
        this.vals[i][j] = v;
        this.texs[i][j] = tex;
      }),
    );
    return Promise.all(jobs);
  }

  rowEntries(i) {
    return this.cells[i].map((c) => {
      const es = c.querySelectorAll(':scope > .lx-mat-entry');
      return es[es.length - 1];
    });
  }

  // ---- row operations ----

  swapRows(i, j, { duration = 900, delay = 0 } = {}) {
    if (i === j) return Promise.resolve();
    [this.vals[i], this.vals[j]] = [this.vals[j], this.vals[i]];
    [this.texs[i], this.texs[j]] = [this.texs[j], this.texs[i]];
    const b = this.size * 0.8;
    let d = 0;
    let A = null, B = null;
    const begin = () => {
      if (A) return;
      A = this.rowEntries(i);
      B = this.rowEntries(j);
      d = this.rowCenter(j) - this.rowCenter(i);
    };
    return run(this.clock, {
      duration,
      delay,
      ease: ease.inOut,
      start: begin,
      update: (t) => {
        begin();
        const s = t >= 1 ? 0 : Math.sin(Math.PI * t) * b;
        A.forEach((e) => (e.style.transform = `translate(${-s}px, ${d * t}px)`));
        B.forEach((e) => (e.style.transform = `translate(${s}px, ${-d * t}px)`));
      },
      end: () => {
        A.forEach((e, c) => {
          e.style.transform = '';
          B[c].style.transform = '';
          this.cells[j][c].append(e);
          this.cells[i][c].append(B[c]);
        });
      },
    });
  }

  /** TeX for a factor k (raw as given): decimals as written / in decimal matrices, else an inline fraction. */
  coef(raw, k) {
    return written(raw, k) ?? (this.decimal ? decimalOf(k) : null) ?? k.tex({ inline: true });
  }

  async scaleRow(i, kRaw, { stagger = 60 } = {}) {
    const k = F(kRaw);
    const next = this.vals[i].map((v) => num(v, 'scaleRow').mul(k));
    this.vals[i] = next;
    this.texs[i] = next.map((v) => this.shown(v, v));
    const kc = this.coef(kRaw, k);
    const kt = k.sign() < 0 ? `(${kc})` : kc;
    const chip = this.chipLabel(i, `\\times ${kt}`);
    await this.fadeEl(chip, { duration: 300, dx: 12 });
    await Promise.all(this.texs[i].map((t, c) => this.replaceIn(this.cells[i][c], t, { delay: c * stagger })));
    await this.fadeAway([chip], { duration: 300 });
  }

  async addRow(i, j, kRaw = 1, { color = C.blue, stagger = 50 } = {}) {
    const k = F(kRaw);
    const src = this.vals[j].map((v) => num(v, 'addRow'));
    const srcTex = this.texs[j].slice();
    const add = src.map((v) => v.mul(k));
    const next = this.vals[i].map((v, c) => num(v, 'addRow').add(add[c]));
    this.vals[i] = next;
    this.texs[i] = next.map((v) => this.shown(v, v));
    const dy = this.rowCenter(i) - this.rowCenter(j);
    const lift = (i > j ? -1 : 1) * this.size * 0.2;
    const ghosts = src.map((v, c) => {
      const g = this.overlay('lx-mat-ghost', `${j + 1}`, `${this.gc(c)}`, { color, background: `color-mix(in srgb, ${color} 12%, var(--lx-stage))`, opacity: '0' });
      g.append(this.entry(srcTex[c]));
      return g;
    });
    const kc = k.eq(1) ? '' : k.eq(-1) ? '-' : this.coef(kRaw, k);
    const label = this.chipLabel(j, `${kc}R_{${j + 1}}`, { color });
    const all = [...ghosts, label];
    await run(this.clock, {
      duration: 350,
      ease: ease.out,
      update: (t) =>
        all.forEach((g) => {
          g.style.opacity = `${t}`;
          g.style.transform = `translateY(${lift * t}px)`;
        }),
    });
    if (!k.eq(1)) await Promise.all(ghosts.map((g, c) => this.replaceIn(g, this.shown(add[c], add[c]), { duration: 450, delay: c * stagger })));
    await run(this.clock, { duration: 800, ease: ease.inOut, update: (t) => all.forEach((g) => (g.style.transform = `translateY(${lerp(lift, dy, t)}px)`)) });
    await Promise.all([
      ...this.texs[i].map((t, c) => this.replaceIn(this.cells[i][c], t, { delay: c * stagger })),
      this.fadeAway(all, { duration: 450, delay: 150 }),
    ]);
  }

  /** Runs one rref step ({ op, i, j, k }) with its TeX as the note of row i. */
  rowOp(step, { note = true, ...opts } = {}) {
    const st = { ...step, k: step.k === undefined ? undefined : F(step.k) };
    const jobs = [];
    if (note) jobs.push(this.note(st.i, texRowOp(st)));
    if (st.op === 'swap') jobs.push(this.swapRows(st.i, st.j, opts));
    else if (st.op === 'scale') jobs.push(this.scaleRow(st.i, st.k, opts));
    else if (st.op === 'add') jobs.push(this.addRow(st.i, st.j, st.k, opts));
    else throw new Error(`matrix.rowOp: unknown op ${st.op}`);
    return Promise.all(jobs);
  }
}

extend({
  /** s.matrix(rows, { x, y, size = 40, augment, colGap, rowGap, rowHeight, compact, color, visible, brackets: '[]' | '()' | '||' | 'none' }) */
  matrix(rows, opts) {
    return new MatrixMob(this, rows, opts);
  },
});
