/**
 * Logic components for Foundations lectures (MATH 3010): truth tables, two-column proofs, implication chains.
 *
 *   s.truthTable({ x, y, vars: ['P', 'Q'], cols: [{ tex: 'P\\land Q', fn: (v) => v.P && v.Q }], size, T, F, show, visible })
 *     → TruthTable: revealRow(i), revealCol(j), revealAll({ stagger }), fillColumn(j, { gap }), highlightRows(sel, color),
 *       highlightCol(j, color), highlightCell(i, j, color), markRow(i, '✓' | '✗'), clear(), value(i, j), col(j),
 *       cellBox(i, j), colBox(j), rowBox(i) (stage boxes)
 *   s.proof({ x, y, width = 820, height, size = 30, numbered = true, whyWidth = 'auto', visible })
 *     → ProofSteps: add(content, { why, indent, kind, tex, numbered }) → line (thenable), insertAfter(line, content, opts),
 *       replace(line, content, { why }), removeLine(line), highlight(line, color), unhighlight(line), strike(line),
 *       note(line, text), qed(), scrollTo(line | 'end'), lineBox(line, 'body' | 'why' | 'row'), clear()
 *   s.implication({ x, y, items: ['P', 'Q'], arrows: '⟹' | '⟺', size, visible })
 *     → Implication: step(i), reverse(), negateAll(), clear()
 *
 * Shared helpers (exported; sets.js builds on them). Each takes the stage clock captured when the method was called,
 * so pause, rate, instant seeking and kill() behave: a killed clock resolves every later tween without touching
 * the DOM.
 *   tween(clock, update, opts)         one clock tween
 *   appear(clock, node, opts)          fade (+ small rise / scale) a hidden node in
 *   vanish(clock, nodes, { remove })   fade nodes out
 *   paint(clock, nodes, props, opts)   crossfade CSS properties (color, fill, stroke…); null removes the property
 *   glow(clock, nodes, color, on)      soft highlight band behind `.lx-hl` nodes (css/stage-logic.css)
 *   pulse(clock, node, { color })      a short grow-and-tint "look here"
 *   tone(color) → { fg, bg }           'blue' | C.blue | FILL.blue → strong and soft variants
 *   Part                               thenable handle for something a component added (await = its entrance)
 *   PALETTE                            color names for class / partition coloring
 *   renderMath(content, tex)           TeX or text-with-$math$ → HTML (\part{name}{…} marks parts)
 *   nodesBox(stage, nodes)             union of DOM nodes' boxes in stage units
 *
 * Colors: anywhere a color is accepted, pass a name ('blue'), a C value or a FILL value; components pick the strong
 * or soft variant they need.
 */
import { el, reducedMotion } from '../core/dom.js';
import { ease, lerp } from '../core/tween.js';
import { extend, C, FILL } from '../core/stage.js';
import { Mob, katexHtml, inlineMath } from '../core/mobject.js';

// ---------------------------------------------------------------- shared helpers

export const PALETTE = ['blue', 'green', 'orange', 'purple', 'teal', 'red', 'yellow'];

/** 'blue' | C.blue | FILL.blue → { fg: C.blue, bg: FILL.blue }; any other CSS color is used for both. */
export function tone(color = 'yellow') {
  if (typeof color !== 'string') return { fg: C.ink, bg: FILL.ink };
  const name = color in C ? color : /^var\(--lx-([a-z]+)(?:-bg)?\)$/.exec(color)?.[1];
  if (name && name in C && name !== 'bg') return { fg: C[name], bg: FILL[name] ?? FILL.ink };
  return { fg: color, bg: color };
}

export function tween(clock, update, { duration = 450, delay = 0, ease: easing = ease.out, start } = {}) {
  return clock.tween({ duration, delay, ease: easing, update, start });
}

/** Fades a node in from opacity 0, rising `dy` px and growing from `scale` (movement dropped under reduced motion). */
export function appear(clock, node, { duration = 420, delay = 0, dy = 10, scale = 1, ease: easing = ease.out, to = 1 } = {}) {
  const still = reducedMotion();
  const shift = still ? 0 : dy;
  const grow = still ? 1 : scale;
  if (grow !== 1 && node instanceof SVGElement) node.classList.add('lx-pop');
  return clock.tween({
    duration,
    delay,
    ease: easing,
    update: (t) => {
      node.style.opacity = String(to * Math.min(1, Math.max(0, t)));
      node.style.transform = t >= 1 || (!shift && grow === 1) ? '' : `translateY(${(1 - t) * shift}px) scale(${lerp(grow, 1, t)})`;
    },
  });
}

/** Fades nodes out (from their current opacity); `remove` takes them out of the DOM afterwards. */
export function vanish(clock, nodes, { duration = 320, delay = 0, remove = false } = {}) {
  const list = [nodes].flat().filter(Boolean);
  let from = null;
  return clock
    .tween({
      duration,
      delay,
      ease: ease.out,
      start: () => (from = list.map((n) => Number(n.style.opacity || 1))),
      update: (t) => list.forEach((n, i) => (n.style.opacity = String(lerp(from?.[i] ?? 1, 0, t)))),
    })
    .then(() => {
      if (remove) list.forEach((n) => n.remove());
    });
}

/** Crossfades CSS properties ({ color, fill, stroke, 'stroke-width', … }) on nodes; a null value removes the inline property. */
export function paint(clock, nodes, props, { duration = 350, delay = 0 } = {}) {
  const list = [nodes].flat().filter(Boolean);
  const apply = (n) => {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined) n.style.removeProperty(k);
      else n.style.setProperty(k, String(v));
    }
  };
  return clock.tween({
    duration,
    delay,
    ease: ease.out,
    start: () =>
      list.forEach((n) => {
        n.style.transition = Object.keys(props)
          .map((k) => `${k} ${Math.round(duration / clock.rate)}ms`)
          .join(', ');
        apply(n);
      }),
    update: (t) => {
      if (t < 1) return;
      list.forEach((n) => {
        n.style.transition = '';
        apply(n);
      });
    },
  });
}

/** Soft highlight band behind `.lx-hl` nodes (their ::before), fading in (on) or out. */
export function glow(clock, nodes, color = 'yellow', on = true, { duration = 400, delay = 0 } = {}) {
  const list = [nodes].flat().filter(Boolean);
  const { bg } = tone(color);
  let from = null;
  return clock.tween({
    duration,
    delay,
    ease: ease.out,
    start: () => {
      from = list.map((n) => parseFloat(n.style.getPropertyValue('--hl-o')) || 0);
      if (on) list.forEach((n) => n.style.setProperty('--hl', bg));
    },
    update: (t) => list.forEach((n, i) => n.style.setProperty('--hl-o', String(lerp(from?.[i] ?? 0, on ? 1 : 0, t)))),
  });
}

/** Grows a node a little and tints it, then settles back. */
export function pulse(clock, node, { color, scale = 1.14, duration = 700, delay = 0 } = {}) {
  if (node instanceof SVGElement) node.classList.add('lx-pop');
  const grow = reducedMotion() ? 1 : scale;
  let before = '';
  return clock.tween({
    duration,
    delay,
    ease: ease.linear,
    start: () => {
      before = node.style.color;
      if (color) node.style.color = color;
    },
    update: (t) => {
      node.style.transform = t >= 1 || grow === 1 ? '' : `scale(${1 + (grow - 1) * ease.there(t)})`;
      if (t >= 1 && color) node.style.color = before;
    },
  });
}

/**
 * A handle for something a component added. `await part` waits for its entrance and resolves to the handle (a
 * non-thenable view of it: same node, fields and methods), so `const r = await s.ring(x)` keeps it.
 * `fadeOut()` removes it.
 */
export class Part {
  constructor(node, done, owner) {
    this.node = node;
    this.owner = owner;
    this.done = Promise.resolve(done).then(() => undefined);
  }
  /** The value `await part` gives: the part itself minus `then` (a promise can't resolve to a thenable). */
  get handle() {
    return Object.create(this, { then: { value: undefined } });
  }
  then(resolve, reject) {
    return this.done.then(() => this.handle).then(resolve, reject);
  }
  fadeOut(opts) {
    return vanish(this.owner.stage.clock, this.node, { ...opts, remove: true });
  }
  remove() {
    this.node.remove();
  }
}

/**
 * Proof-line content: a string with $…$ is text with inline math; a string without $ is TeX when it has TeX
 * characters (\ ^ _ = < > { }) and no plain word of 4+ letters outside commands; otherwise plain text.
 */
export function looksLikeTex(str) {
  if (str.includes('$')) return false;
  if (!/[\\^_={}<>]/.test(str)) return false;
  const bare = str.replace(/\\(?:text|mathrm|textbf|textit|operatorname)\{[^}]*\}/g, ' ').replace(/\\[a-zA-Z]+/g, ' ');
  return !/[a-zA-Z]{4,}/.test(bare);
}

/** Content → HTML: TeX or text with $math$ (looksLikeTex unless `tex` forces it); `\part{name}{…}` marks parts. */
export function renderMath(content, tex) {
  const str = String(content).replace(/\\part\{([\w-]+)\}/g, '\\htmlClass{p-$1}');
  if (tex ?? looksLikeTex(str)) return katexHtml(str, { display: false });
  // punctuation right after $math$ stays on its line (KaTeX boxes otherwise allow a break before the period)
  const parts = str.split(/(\$[^$]+\$)/g);
  let html = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isMath = part.length > 2 && part.startsWith('$') && part.endsWith('$');
    const punct = isMath ? /^[.,;:!?)]+/.exec(parts[i + 1] ?? '')?.[0] : null;
    if (punct) {
      html += `<span style="white-space:nowrap">${inlineMath(part)}${inlineMath(punct)}</span>`;
      parts[i + 1] = parts[i + 1].slice(punct.length);
    } else html += inlineMath(part);
  }
  return html;
}

/** Union of DOM nodes' boxes in stage units: { x, y, w, h, cx, cy }. */
export function nodesBox(stage, nodes) {
  const rs = [nodes].flat().filter(Boolean).map((n) => n.getBoundingClientRect());
  if (!rs.length) return null;
  const left = Math.min(...rs.map((r) => r.left));
  const top = Math.min(...rs.map((r) => r.top));
  const right = Math.max(...rs.map((r) => r.right));
  const bottom = Math.max(...rs.map((r) => r.bottom));
  const b = stage.toStage({ left, top, width: right - left, height: bottom - top });
  return { ...b, cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
}

// ---------------------------------------------------------------- truth table

export class TruthTable extends Mob {
  /**
   * vars: variable names (TeX). cols: [{ tex, fn(v, row) }] where v = { P: true, …, $: [values of earlier columns] }.
   * show: 'vars' (default: headers + variable columns), 'headers', 'all' or 'none'. Rows are TT…T first, F…F last.
   */
  constructor(stage, { vars = ['P', 'Q'], cols = [], size = 32, T = 'T', F = 'F', show = 'vars', ...opts } = {}) {
    const n = vars.length;
    const ncol = n + cols.length;
    const node = el('div', { class: 'lx-tt', style: { fontSize: `${size}px`, gridTemplateColumns: `repeat(${ncol}, auto) 1.4em` } });
    super(stage, node, opts);
    this.vars = vars;
    this.cols = cols;
    this.n = n;
    this.ncol = ncol;
    this.values = [];
    this.table = [];
    for (let i = 0; i < 2 ** n; i++) {
      const v = {};
      vars.forEach((name, k) => (v[name] = !((i >> (n - 1 - k)) & 1)));
      const row = vars.map((name) => v[name]);
      for (const col of cols) row.push(Boolean(col.fn({ ...v, $: row.slice() }, i)));
      this.values.push(v);
      this.table.push(row);
    }
    const sep = (j) => j === n && j > 0 && 'lx-tt-sep';
    this.hidden = new WeakSet();
    const hide = (node) => {
      node.style.opacity = '0';
      this.hidden.add(node);
    };
    this.heads = [...vars, ...cols.map((c) => c.tex)].map((tex, j) => el('div', { class: ['lx-tt-h', 'lx-hl', sep(j)], html: katexHtml(tex, { display: false }) }));
    node.append(...this.heads, el('div', { class: 'lx-tt-h lx-tt-mh' }));
    this.cells = this.table.map((row, i) =>
      row.map((val, j) => el('div', { class: ['lx-tt-c', 'lx-hl', val ? 'lx-tt-T' : 'lx-tt-F', sep(j), i === this.table.length - 1 && 'lx-tt-last'], text: val ? T : F })),
    );
    this.marks = this.table.map(() => el('div', { class: 'lx-tt-m lx-hl', style: { opacity: '0' } }));
    this.cells.forEach((row, i) => node.append(...row, this.marks[i]));
    if (show === 'none') this.heads.forEach(hide);
    this.cells.forEach((row) => row.forEach((cell, j) => show !== 'all' && !(show === 'vars' && j < n) && hide(cell)));
  }

  /** Column index from a number, a variable name or a column's tex (or `key`). */
  col(j) {
    if (typeof j === 'number') return j;
    const k = this.vars.indexOf(j);
    if (k >= 0) return k;
    const c = this.cols.findIndex((col) => col.tex === j || col.key === j);
    if (c >= 0) return this.n + c;
    throw new Error(`TruthTable: no column ${j}`);
  }

  value(i, j) {
    return this.table[i][this.col(j)];
  }

  /** Shows the still-hidden nodes among `nodes`, `gap` ms apart. */
  unhide(clock, nodes, gap = 0, delay = 0) {
    const todo = nodes.filter((n) => this.hidden.has(n));
    todo.forEach((n) => this.hidden.delete(n));
    return Promise.all(todo.map((n, k) => appear(clock, n, { delay: delay + k * gap, dy: 8 })));
  }

  revealRow(i, { stagger = 70 } = {}) {
    return this.unhide(this.clock, [...this.heads, ...this.cells[i]], stagger);
  }

  revealCol(j, { stagger = 40 } = {}) {
    const c = this.col(j);
    return this.unhide(this.clock, [this.heads[c], ...this.cells.map((row) => row[c])], stagger);
  }

  /** Every hidden cell, row by row. */
  revealAll({ stagger = 110 } = {}) {
    const clock = this.clock;
    return Promise.all([this.unhide(clock, this.heads), ...this.cells.map((row, i) => this.unhide(clock, row, 0, (i + 1) * stagger))]);
  }

  /** A column's cells appear top to bottom, one every `gap` ms (the header first). */
  fillColumn(j, { gap = 260 } = {}) {
    const c = this.col(j);
    return this.unhide(this.clock, [this.heads[c], ...this.cells.map((row) => row[c])], gap);
  }

  /** sel: (v, i) => bool (v = { P, Q, …, $: row values }), an array of row indices, or one index. */
  highlightRows(sel, color = 'yellow', opts) {
    const rows = typeof sel === 'function' ? this.values.map((v, i) => (sel({ ...v, $: this.table[i] }, i) ? i : -1)).filter((i) => i >= 0) : [sel].flat();
    return glow(this.clock, rows.flatMap((i) => [...(this.cells[i] ?? []), this.marks[i]]), color, true, opts);
  }

  highlightCol(j, color = 'yellow', opts) {
    const c = this.col(j);
    return glow(this.clock, [this.heads[c], ...this.cells.map((row) => row[c])], color, true, opts);
  }

  /** Marks a row ✓ (green) or ✗ (red) in the margin; true/false work too. */
  markRow(i, mark = '✓') {
    const text = mark === true ? '✓' : mark === false ? '✗' : String(mark);
    const m = this.marks[i];
    m.textContent = text;
    m.classList.toggle('lx-tt-ok', text === '✓');
    m.classList.toggle('lx-tt-bad', text !== '✓');
    return appear(this.clock, m, { dy: 0, scale: 0.6, ease: ease.back, duration: 420 });
  }

  /** Removes highlights and marks (revealed cells stay). */
  clear() {
    const clock = this.clock;
    const all = [...this.heads, ...this.cells.flat(), ...this.marks];
    return Promise.all([glow(clock, all, 'yellow', false), vanish(clock, this.marks.filter((m) => m.style.opacity !== '0'))]);
  }

  /** Soft highlight on one cell (j: index, variable name or column tex). */
  highlightCell(i, j, color = 'yellow', opts) {
    return glow(this.clock, this.cells[i]?.[this.col(j)], color, true, opts);
  }

  /** Stage box { x, y, w, h, cx, cy } of a cell, a column (header included) or a row (mark included). */
  cellBox(i, j) {
    return nodesBox(this.stage, this.cells[i][this.col(j)]);
  }

  /** Nodes that are revealed (cells: revealed even if their fade-in is still running; marks: marked and not cleared). */
  visible(nodes) {
    return nodes.filter((n) => (this.marks.includes(n) ? n.textContent !== '' && n.style.opacity !== '0' : !this.hidden.has(n)));
  }

  /** visibleOnly (default true): only revealed cells count (falls back to all when none is showing). */
  colBox(j, { visibleOnly = true } = {}) {
    const c = this.col(j);
    const all = [this.heads[c], ...this.cells.map((row) => row[c])];
    const shown = visibleOnly ? this.visible(all) : all;
    return nodesBox(this.stage, shown.length ? shown : all);
  }

  rowBox(i, { visibleOnly = true } = {}) {
    const all = [...this.cells[i], this.marks[i]];
    const shown = visibleOnly ? this.visible(all) : all;
    return nodesBox(this.stage, shown.length ? shown : this.cells[i]);
  }
}

// ---------------------------------------------------------------- two-column proof

export class ProofSteps extends Mob {
  /**
   * Anchored at its top center (x, y). `height` is the visible window (default: down to the stage's bottom).
   * whyWidth: the reason column, 'auto' (default: as wide as the longest reason so far, 16–34% of the width,
   * widening smoothly), a number of px, or a CSS length ('30%').
   */
  constructor(stage, { width = 820, height, size = 30, numbered = true, whyWidth = 'auto', x = 480, y = 70, ...opts } = {}) {
    const h = height ?? Math.max(160, stage.H - y - 24);
    const list = el('div', { class: 'lx-proof-list' });
    const fixed = whyWidth === 'auto' ? null : typeof whyWidth === 'number' ? `${whyWidth}px` : whyWidth;
    const node = el('div', { class: 'lx-proof', lang: 'en', style: { width: `${width}px`, height: `${h}px`, fontSize: `${size}px`, '--why': fixed ?? `${Math.round(width * 0.16)}px`, '--ndig': numbered ? '2' : '0' } }, list);
    super(stage, node, { anchor: [0.5, 0], x, y, ...opts });
    this.list = list;
    this.viewH = h;
    this.width = width;
    this.size = size;
    this.autoWhy = !fixed;
    this.whyW = Math.round(width * 0.16);
    this.numbered = numbered;
    this.lines = [];
    this.count = 0;
    this.offset = 0;
    this.qedNode = null;
    // when the list gets shorter after the last scroll (fonts loading, a widened reason column unwrapping lines,
    // rows removed), drop any scroll it no longer needs so the top fade only shows while something is hidden
    this.shrink = new ResizeObserver(() => {
      const max = this.maxOffset();
      if (this.offset > max + 0.5) this.setOffset(max);
    });
    this.shrink.observe(list);
  }

  /**
   * The most the list can scroll: how far its last row's bottom passes the window. A few px of overflow (the last
   * row's padding and line-height slack, up to 0.4em) count as fitting, so a proof that fits never scrolls or fades.
   */
  maxOffset() {
    const last = this.list.lastElementChild;
    const bottom = last ? last.offsetTop + last.offsetHeight : 0;
    const max = bottom + 2 - this.viewH;
    return max > this.size * 0.4 ? max : 0;
  }

  /** Builds a hidden line (not yet in the DOM) and its handle. */
  makeLine(content, { why, indent = 0, kind = 'step', tex, numbered = true } = {}) {
    const body = el('div', { class: 'lx-proof-body', html: renderMath(content, tex) });
    if (kind === 'contradiction') body.append(el('span', { class: 'lx-proof-bolt', html: katexHtml('\\Rightarrow\\Leftarrow', { display: false }) }));
    const stmt = el('div', { class: 'lx-proof-s', style: { paddingLeft: indent ? `${indent * 1.4}em` : undefined } }, body);
    const whyNode = why ? el('div', { class: 'lx-proof-why', html: inlineMath(why), style: { opacity: '0' } }) : null;
    const row = el('div', { class: ['lx-proof-line', 'lx-hl', `lx-proof-${kind}`], style: { opacity: '0' } }, el('span', { class: 'lx-proof-n' }), stmt, whyNode);
    const line = new Part(row, null, this);
    line.numbered = numbered && this.numbered;
    return { row, whyNode, line };
  }

  /** Line numbers follow the order of the lines (insertions renumber everything after them). */
  renumber() {
    let k = 0;
    this.lines.forEach((line, i) => {
      line.index = i;
      const n = line.node.querySelector('.lx-proof-n');
      if (n) n.textContent = line.numbered ? `${++k}.` : '';
    });
    this.count = k;
    // the number gutter is exactly as wide as the longest number ("10." needs one more digit than "9.")
    this.node.style.setProperty('--ndig', String(this.numbered ? String(Math.max(1, k)).length + 1 : 0));
  }

  /** 'auto' reason column: widens (animated) to fit a new reason, within 16–34% of the proof's width. */
  fitWhy(clock, html) {
    if (!this.autoWhy || !html) return null;
    const probe = el('div', { class: 'lx-proof-why', html, style: { position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', left: '0', top: '0' } });
    this.node.append(probe);
    const want = Math.min(this.width * 0.34, Math.max(this.width * 0.16, probe.offsetWidth + 6));
    probe.remove();
    if (want <= this.whyW + 0.5) return null;
    const from = this.whyW;
    this.whyW = want;
    return tween(clock, (t) => this.node.style.setProperty('--why', `${lerp(from, want, t).toFixed(1)}px`), { duration: 400, ease: ease.inOut });
  }

  /** Scrolls to the row, writes it left to right, then fades its reason in. */
  async writeLine(clock, row, whyNode, duration) {
    await this.ensure(row, clock);
    const d = duration ?? Math.min(1300, 420 + row.textContent.length * 16);
    await tween(
      clock,
      (t) => {
        row.style.opacity = '1';
        row.style.clipPath = t >= 1 ? '' : `inset(-20% ${(1 - t) * 100}% -20% 0)`;
      },
      { duration: d, ease: ease.inOut },
    );
    if (whyNode) await appear(clock, whyNode, { dy: 0, duration: 380 });
    // layout may have settled (reason column widened, KaTeX) since the first scroll: correct it
    await this.ensure(row, clock, { duration: 300 });
  }

  /**
   * Writes a new last line. content: TeX, or text with $math$ (see looksLikeTex; force with { tex: true | false }).
   * opts: { why, indent, kind: 'step' | 'assume' | 'conclude' | 'contradiction', tex, numbered = true, duration }.
   * Returns the line handle; `await` it for the animation.
   */
  add(content, opts = {}) {
    const clock = this.clock;
    const { row, whyNode, line } = this.makeLine(content, opts);
    this.list.insertBefore(row, this.qedNode);
    this.lines.push(line);
    this.renumber();
    const widen = this.fitWhy(clock, whyNode?.innerHTML);
    line.done = Promise.resolve(widen).then(() => this.writeLine(clock, row, whyNode, opts.duration));
    return line;
  }

  /** Writes a new line right after `after` (a skeleton gets filled in the middle): the rows below slide down. */
  insertAfter(after, content, opts = {}) {
    const ref = this.row(after);
    const at = this.lines.findIndex((l) => l.node === ref);
    if (at < 0) return this.add(content, opts);
    const clock = this.clock;
    const { row, whyNode, line } = this.makeLine(content, opts);
    ref.after(row);
    this.lines.splice(at + 1, 0, line);
    this.renumber();
    const widen = this.fitWhy(clock, whyNode?.innerHTML);
    const h = row.offsetHeight;
    row.style.height = '0px';
    row.style.overflow = 'hidden';
    line.done = Promise.all([
      widen,
      tween(
        clock,
        (t) => {
          row.style.height = t >= 1 ? '' : `${h * t}px`;
          if (t >= 1) row.style.overflow = '';
        },
        { duration: 450, ease: ease.inOut },
      ),
    ]).then(() => this.writeLine(clock, row, whyNode, opts.duration));
    return line;
  }

  /** Rewrites a line's statement in place (and its reason when opts.why is given): fade out, then write the new one. */
  replace(line, content, { tex, why, numbered, duration = 700 } = {}) {
    const row = this.row(line);
    const body = row?.querySelector('.lx-proof-body');
    if (!body) return Promise.resolve();
    const clock = this.clock;
    const handle = this.lines.find((l) => l.node === row);
    if (handle && numbered !== undefined) {
      handle.numbered = numbered && this.numbered;
      this.renumber();
    }
    let whyNode = row.querySelector('.lx-proof-why');
    const swapWhy = why !== undefined;
    if (swapWhy && !whyNode && why) {
      whyNode = el('div', { class: 'lx-proof-why', style: { opacity: '0' } });
      row.append(whyNode);
    }
    return tween(
      clock,
      (t) => {
        body.style.opacity = String(1 - t);
        if (swapWhy && whyNode) whyNode.style.opacity = String(Math.min(Number(whyNode.style.opacity || 1), 1 - t));
      },
      { duration: 260 },
    ).then(async () => {
      if (clock.dead) return;
      const bolt = body.querySelector('.lx-proof-bolt');
      body.innerHTML = renderMath(content, tex);
      if (bolt) body.append(bolt);
      body.style.removeProperty('color');
      if (swapWhy && whyNode) whyNode.innerHTML = why ? inlineMath(why) : '';
      await Promise.all([this.fitWhy(clock, swapWhy ? whyNode?.innerHTML : null), this.ensure(row, clock)]);
      await tween(
        clock,
        (t) => {
          body.style.opacity = '1';
          body.style.clipPath = t >= 1 ? '' : `inset(-20% ${(1 - t) * 100}% -20% 0)`;
        },
        { duration, ease: ease.inOut },
      );
      if (swapWhy && whyNode && why) await appear(clock, whyNode, { dy: 0, duration: 380 });
    });
  }

  /** Takes a line out (it folds away; the rows below close up and renumber). */
  removeLine(line, { duration = 450 } = {}) {
    const row = this.row(line);
    const at = this.lines.findIndex((l) => l.node === row);
    if (at < 0) return Promise.resolve();
    const clock = this.clock;
    this.lines.splice(at, 1);
    this.renumber();
    let h = 0;
    return tween(
      clock,
      (t) => {
        row.style.opacity = String(1 - t);
        row.style.height = `${h * (1 - t)}px`;
      },
      {
        duration,
        ease: ease.inOut,
        start: () => {
          h = row.offsetHeight;
          row.style.overflow = 'hidden';
        },
      },
    ).then(() => row.remove());
  }

  /** A line handle, an index (negative counts from the end) or the row node → the row node. */
  row(line) {
    if (typeof line === 'number') return this.lines.at(line)?.node ?? null;
    return line?.node ?? line ?? null;
  }

  /** Stage box of a line's statement ('body', default), its reason ('why') or the whole row ('row'). */
  lineBox(line, part = 'body') {
    const row = this.row(line);
    const node = part === 'row' ? row : row?.querySelector(part === 'why' ? '.lx-proof-why' : '.lx-proof-body');
    return node ? nodesBox(this.stage, node) : null;
  }

  setOffset(v) {
    this.offset = v;
    this.list.style.transform = v > 0.01 ? `translateY(${-v}px)` : '';
    this.node.classList.toggle('lx-proof-scrolled', v > 1);
    // the fade grows with what is hidden: a few px scrolled → a faint edge, not a dimmed first line
    this.node.style.setProperty('--fade', `${Math.min(64, Math.max(0, v) * 2.5).toFixed(1)}px`);
  }

  /** Scrolls (animated) just enough that `node` is inside the window: the newest line sits at the bottom. */
  ensure(node, clock = this.clock, { duration = 500 } = {}) {
    if (!node) return Promise.resolve();
    const top = node.offsetTop;
    const bottom = top + node.offsetHeight;
    let target = this.offset;
    if (bottom - target > this.viewH - 2) target = bottom - this.viewH + 2;
    if (top < target) target = top;
    // never past the end of the list (rows that were briefly taller leave no stale offset), and the first row's top
    // (the list's padding) counts as the very top
    target = Math.min(target, this.maxOffset());
    if (target <= (this.list.firstElementChild?.offsetTop ?? 0) + 0.5) target = 0;
    if (Math.abs(target - this.offset) < 0.5) return Promise.resolve();
    let from = this.offset;
    return tween(clock, (t) => this.setOffset(lerp(from, target, t)), { duration, ease: ease.inOut, start: () => (from = this.offset) });
  }

  /** Scrolls a line into view ('end' = the last row, 0 = the first line). */
  scrollTo(line = 'end', opts) {
    return this.ensure(line === 'end' ? this.list.lastElementChild : this.row(line), this.clock, opts);
  }

  highlight(line, color = 'yellow', opts) {
    return glow(this.clock, this.row(line), color, true, opts);
  }

  unhighlight(line, opts) {
    return glow(this.clock, this.row(line), 'yellow', false, opts);
  }

  /** Strikes a line through (a wrong step), dimming it. */
  strike(line, { color = 'red', duration = 500 } = {}) {
    const row = this.row(line);
    const body = row?.querySelector('.lx-proof-body');
    if (!body) return Promise.resolve();
    const bar = body.querySelector('.lx-proof-strike') ?? body.appendChild(el('span', { class: 'lx-proof-strike' }));
    bar.style.background = tone(color).fg;
    const clock = this.clock;
    return Promise.all([
      tween(clock, (t) => (bar.style.width = `${t * 100}%`), { duration, ease: ease.inOut }),
      paint(clock, body, { color: C.muted }, { duration }),
    ]);
  }

  /** A short annotation under a line's statement. */
  note(line, text, { color = 'blue' } = {}) {
    const row = this.row(line);
    if (!row) return Promise.resolve();
    const clock = this.clock;
    const n = el('div', { class: 'lx-proof-note', html: inlineMath(text), style: { color: tone(color).fg, opacity: '0' } });
    row.querySelector('.lx-proof-s').append(n);
    return this.ensure(row, clock).then(() => appear(clock, n, { dy: -6 }));
  }

  /** The end-of-proof box. */
  qed() {
    if (this.qedNode) return Promise.resolve();
    const clock = this.clock;
    const q = el('div', { class: 'lx-proof-qed' }, el('span', { class: 'lx-proof-box' }));
    q.style.opacity = '0';
    this.list.append(q);
    this.qedNode = q;
    return this.ensure(q, clock).then(() => appear(clock, q, { dy: 0, scale: 0.6, ease: ease.back }));
  }

  /** Fades every line out and starts over (numbering and an auto reason column too). */
  clear({ duration = 350 } = {}) {
    const clock = this.clock;
    const rows = [...this.list.children];
    this.lines = [];
    this.count = 0;
    this.qedNode = null;
    return vanish(clock, rows, { duration, remove: true }).then(() => {
      this.setOffset(0);
      if (this.autoWhy && !clock.dead) {
        this.whyW = Math.round(this.width * 0.16);
        this.node.style.setProperty('--why', `${this.whyW}px`);
      }
    });
  }
}

// ---------------------------------------------------------------- implication chain

const ARROWS = { '⟹': '\\Longrightarrow', '⟺': '\\Longleftrightarrow', '⟸': '\\Longleftarrow', '=>': '\\Longrightarrow', '<=>': '\\Longleftrightarrow' };
const ATOMIC = /^(?:[A-Za-z](?:_\{?\w+\}?)?(?:'|\^\{?\w+\}?)?|\\[a-zA-Z]+(?:\{[^{}]*\})?)$/;

export class Implication extends Mob {
  /** items: TeX statements; arrows: one arrow for every gap, or an array (one per gap). */
  constructor(stage, { items = [], arrows = '⟹', size = 40, ...opts } = {}) {
    const node = el('div', { class: 'lx-impl', style: { fontSize: `${size}px` } });
    super(stage, node, opts);
    this.items = items.map((tex) => {
      const compound = !ATOMIC.test(String(tex).trim());
      const neg = [el('span', { class: 'lx-impl-neg', html: katexHtml(compound ? '\\lnot(' : '\\lnot', { display: false }) })];
      if (compound) neg.push(el('span', { class: 'lx-impl-neg', html: katexHtml(')', { display: false }) }));
      const body = el('span', { class: 'lx-impl-body', html: katexHtml(tex, { display: false }) });
      const wrap = el('span', { class: 'lx-impl-item' }, neg[0], body, neg[1]);
      return { wrap, neg, body };
    });
    this.arrows = items.slice(1).map((_, i) => {
      const a = Array.isArray(arrows) ? arrows[i] : arrows;
      return { node: el('span', { class: 'lx-impl-arrow', html: katexHtml(ARROWS[a] ?? a, { display: false }) }), rot: 0 };
    });
    this.items.forEach((it, i) => node.append(...(i ? [this.arrows[i - 1].node] : []), it.wrap));
    this.reversed = false;
    this.negated = false;
  }

  turn(a, s = 1) {
    a.node.style.transform = a.rot % 360 === 0 && s === 1 ? '' : `rotate(${a.rot}deg) scale(${s})`;
  }

  /** Lights arrow i (it stays lit) and pulses the statement it leads to. */
  step(i, { color = 'blue' } = {}) {
    const a = this.arrows[i];
    if (!a) return Promise.resolve();
    const clock = this.clock;
    const { fg } = tone(color);
    const target = this.items[this.reversed ? i : i + 1]?.wrap;
    return Promise.all([
      paint(clock, a.node, { color: fg }),
      tween(clock, (t) => this.turn(a, 1 + (reducedMotion() ? 0 : 0.22) * ease.there(t)), { duration: 600, ease: ease.linear }),
    ]).then(() => target && pulse(clock, target, { color: fg, scale: 1.08 }));
  }

  /** Every arrow turns around (converse); again turns them back. */
  reverse({ duration = 700 } = {}) {
    const clock = this.clock;
    this.reversed = !this.reversed;
    return Promise.all(
      this.arrows.map((a) => {
        let from = a.rot;
        const to = from + 180;
        return tween(
          clock,
          (t) => {
            a.rot = t >= 1 ? to % 360 : lerp(from, to, t);
            this.turn(a);
          },
          { duration, ease: ease.inOut, start: () => (from = a.rot) },
        );
      }),
    );
  }

  /** ¬ appears in front of every statement (parentheses around compound ones); again removes it. */
  negateAll({ duration = 600 } = {}) {
    const clock = this.clock;
    this.negated = !this.negated;
    const on = this.negated;
    const spans = this.items.flatMap((it) => it.neg);
    let widths = [];
    return tween(
      clock,
      (t) => {
        const p = on ? t : 1 - t;
        spans.forEach((s, k) => {
          s.style.maxWidth = p >= 1 ? 'none' : widths[k] ? `${widths[k] * p}px` : `${1.6 * p}em`;
          s.style.opacity = String(p);
        });
      },
      { duration, ease: ease.inOut, start: () => (widths = spans.map((s) => s.scrollWidth)) },
    );
  }

  /** Unlights the arrows. */
  clear() {
    return paint(this.clock, this.arrows.map((a) => a.node), { color: null });
  }
}

extend({
  truthTable(opts) {
    return new TruthTable(this, opts);
  },
  proof(opts) {
    return new ProofSteps(this, opts);
  },
  implication(opts) {
    return new Implication(this, opts);
  },
});
