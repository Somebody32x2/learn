/**
 * Shared pieces of every practice card (try, blanks, workout, explain).
 *
 * Card chrome
 *   makeCard(beat, kind, { prompt }) → card {
 *     node, head, status, title, figure, prompt, body, feedback, actions, extra,
 *     setStatus(text, tone?)  tone: 'ok' | 'bad' | 'warn' | 'info'; empty text hides it
 *     destroy()               (releases the figure stage)
 *   }
 *   KINDS                                      { try|blanks|workout|explain: { label } }
 *   kindIcon(kind) → <svg>
 *   button(label, { variant: 'primary'|'ghost'|'quiet', icon, onclick, ...props }) → <button>
 *   feedbackLine() → { node, show(state, html, { animate }), clear() }   state: 'ok' | 'bad' | 'info' | 'warn'
 *   hintView(hints) → { node, count, show(n, { animate }) }
 *   solutionView({ steps, answer, label }) → { node, shown, show({ animate }) }
 *   figureView(fn, label) → { node, stage, destroy() }       a compact Stage built by beat.figure(s)
 *   revealIn(nodes, { animate })                              staggered entrance (≤ 250 ms each)
 *
 * Answer inputs (all restore from a value and report every edit)
 *   answerInput(spec, { value, onChange(value), onSubmit(), choices, label, free }) → {
 *     node, get(), set(value), mark(result), unmark(), disable(on), focus()
 *   }  types: number, text, set, vector, matrix (free: ± rows/cols), basis, span, solution, choice, multi
 *   choiceList(choices, { mode: 'answer'|'select'|'multi', value, onPick(id) }) → {
 *     node, get(), select(ids), mark(id, 'right'|'wrong'|'missed'), clearMarks(), disable(on), focus()
 *   }
 *   emptyValue(spec, value) → true when nothing was entered yet
 *   responseText(spec, value, choices) → the response as text / TeX (for the tutor)
 *   revealValue(spec) → plain text of the expected answer (to fill a typed blank)
 *   answerMd(spec, choices) → Markdown of the expected answer (for the solution box)
 *
 * Helpers
 *   ids(ctx, beat) → { course, lecture, beat, key, id, source, title }
 *   deferred() → { promise, resolve, done }
 *   viaKeyboard() → true when the latest user action came from the keyboard (skip animations then)
 *   pickRng(key) → seeded rng (deterministic shuffles)
 */
import { el, svg, nextId, replay, haptic, reducedMotion } from '../core/dom.js';
import { md } from '../core/md.js';
import { Stage } from '../core/stage.js';
import { rng } from '../core/hash.js';
import { answerTex } from '../core/answer.js';

// ---------------------------------------------------------------- input modality

let lastInput = 'pointer';
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key.length === 1) lastInput = 'key';
  }, true);
  document.addEventListener('pointerdown', () => (lastInput = 'pointer'), true);
}
export const viaKeyboard = () => lastInput === 'key';
const animated = (animate = true) => animate && !viaKeyboard();

// ---------------------------------------------------------------- small helpers

export function deferred() {
  let resolve;
  const d = { done: false };
  d.promise = new Promise((r) => (resolve = r));
  d.resolve = () => {
    if (d.done) return false;
    d.done = true;
    resolve();
    return true;
  };
  return d;
}

export function ids(ctx, beat) {
  const course = typeof ctx.course === 'string' ? ctx.course : ctx.course?.slug ?? '';
  const lecture = typeof ctx.lecture === 'string' ? ctx.lecture : ctx.lecture?.id ?? String(ctx.key ?? '').split('/')[0];
  return {
    course,
    lecture,
    beat: beat.id,
    key: ctx.key ?? `${lecture}/${beat.id}`,
    id: ctx.id ?? `${lecture}.${beat.id}`,
    source: `${course}/lectures/${lecture}.js`,
    title: beat.title ?? '',
  };
}

export const pickRng = (key) => rng(String(key));

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ---------------------------------------------------------------- icons

const PATHS = {
  try: 'M4.5 19.5l1-4L16 5l3 3L8.5 18.5l-4 1zM13.5 7.5l3 3',
  blanks: 'M7 5H5v14h2M17 5h2v14h-2M9.5 15h5',
  workout: 'M7 3.5h7l4 4V20.5H7zM14 3.5V8h4M10 12.5h5M10 16h5',
  explain: 'M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cross: 'M7 7l10 10M17 7L7 17',
  info: 'M12 8v.5M12 11v5',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  eye: 'M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  skip: 'M5 6l7 6-7 6M13 6l7 6-7 6',
  chat: 'M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2zM8.5 10.5h7',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  dice: 'M5 5h14v14H5zM9 9h.01M15 15h.01M15 9h.01M9 15h.01',
};

export function icon(name, cls = 'ix-icon') {
  return svg('svg', { class: cls, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }, svg('path', { d: PATHS[name] ?? '' }));
}

export const KINDS = {
  try: { label: 'Your turn' },
  blanks: { label: 'Fill in the blanks' },
  workout: { label: 'Work it out' },
  explain: { label: 'Explain it back' },
};
export const kindIcon = (kind) => icon(kind);

// ---------------------------------------------------------------- buttons

export function button(label, { variant = 'ghost', icon: iconName, class: cls, ...props } = {}) {
  return el('button', { type: 'button', class: ['ix-btn', `ix-btn-${variant}`, cls], ...props }, iconName ? icon(iconName) : null, el('span', { text: label }));
}

export function setLabel(btn, label) {
  const span = btn.querySelector('span');
  if (span) span.textContent = label;
}

// ---------------------------------------------------------------- feedback

export function feedbackLine() {
  const node = el('div', { class: 'ix-feedback', role: 'status', 'aria-live': 'polite' });
  return {
    node,
    show(state, html, { animate = true } = {}) {
      node.className = `ix-feedback is-${state}`;
      node.replaceChildren(icon(state === 'ok' ? 'check' : state === 'bad' ? 'cross' : 'info', 'ix-fb-icon'), el('div', { class: 'ix-fb-text', html }));
      if (animated(animate)) {
        replay(node, state === 'bad' ? 'ix-shake' : 'ix-pop');
        if (state === 'ok') haptic(10);
        if (state === 'bad') haptic([6, 40, 6]);
      }
    },
    clear() {
      node.className = 'ix-feedback';
      node.replaceChildren();
    },
  };
}

// ---------------------------------------------------------------- reveals

/** Staggered entrance for freshly shown nodes (each ≤ 250 ms; movement dropped with reduced motion in CSS). */
export function revealIn(nodes, { animate = true } = {}) {
  if (!animated(animate)) return;
  [nodes].flat().forEach((n, i) => {
    n.style.setProperty('--i', i);
    replay(n, 'ix-enter');
  });
}

export function hintView(hints) {
  const list = [hints].flat().filter(Boolean);
  const node = el('div', { class: 'ix-hints', hidden: true });
  let shown = 0;
  return {
    node,
    count: list.length,
    get shown() {
      return shown;
    },
    show(n, { animate = true } = {}) {
      n = Math.min(n, list.length);
      const fresh = [];
      for (let i = shown; i < n; i++) {
        const item = el('div', { class: 'ix-hint' }, icon('hint'), el('div', { class: 'ix-md', html: md(list[i]) }));
        node.append(item);
        fresh.push(item);
      }
      shown = Math.max(shown, n);
      node.hidden = shown === 0;
      revealIn(fresh, { animate });
    },
  };
}

export function solutionView({ steps, answer, label = 'Solution' }) {
  const node = el('div', { class: 'ix-solution', hidden: true });
  const view = {
    node,
    shown: false,
    show({ animate = true } = {}) {
      if (view.shown) return;
      view.shown = true;
      const items = [];
      if (answer) items.push(el('div', { class: 'ix-answer' }, el('span', { class: 'ix-label', text: 'Answer' }), el('div', { class: 'ix-answer-tex', html: md(answer) })));
      for (const step of [steps].flat().filter(Boolean)) items.push(el('div', { class: 'ix-step ix-md', html: md(step) }));
      node.replaceChildren(el('div', { class: 'ix-label', text: label }), ...items);
      node.hidden = false;
      revealIn(items, { animate });
    },
  };
  return view;
}

/**
 * A compact static figure: a Stage built by `fn(s)` with the clock in instant mode (no animation runs).
 * The scene is built only once the node is in the document and laid out (mobs measure themselves), on the first
 * ResizeObserver callback with a width.
 */
export function figureView(fn, label = 'Figure') {
  const node = el('div', { class: 'ix-figure' });
  const stage = new Stage(node, { label });
  stage.clock.instant = true;
  let built = false;
  const build = () => {
    if (built || !node.isConnected || !node.clientWidth) return;
    built = true;
    watcher.disconnect();
    stage.fit();
    try {
      const out = fn(stage);
      Promise.resolve(Array.isArray(out) ? Promise.all(out) : out).catch((err) => console.error(err));
    } catch (err) {
      console.error('lectern: interlude figure failed', err);
    }
  };
  const watcher = new ResizeObserver(build);
  watcher.observe(node);
  return {
    node,
    stage,
    destroy() {
      watcher.disconnect();
      stage.destroy();
    },
  };
}

// ---------------------------------------------------------------- the card

export function makeCard(beat, kind, { prompt = beat.prompt } = {}) {
  const meta = KINDS[kind] ?? { label: 'Practice' };
  const titleId = nextId('ix-title');
  const node = el('section', { class: ['ix-card', `ix-${kind}`], 'aria-labelledby': titleId });
  const status = el('span', { class: 'ix-status', hidden: true });
  const head = el('header', { class: 'ix-head' }, el('span', { class: 'ix-kind' }, kindIcon(kind), el('span', { text: meta.label })), status);
  const showTitle = beat.title && beat.title.trim().toLowerCase() !== meta.label.toLowerCase();
  const title = el('h3', { class: ['ix-title', !showTitle && 'ix-sr'], id: titleId, html: md(beat.title || meta.label, { inline: true }) });
  let fig = null;
  if (typeof beat.figure === 'function') fig = figureView(beat.figure, beat.title || 'Figure');
  const promptNode = el('div', { class: 'ix-prompt ix-md', html: md(prompt ?? '') });
  const body = el('div', { class: 'ix-body' });
  const feedback = feedbackLine();
  const actions = el('div', { class: 'ix-actions' });
  const extra = el('div', { class: 'ix-extra' });
  node.append(...[head, title, fig?.node, promptNode, body, feedback.node, actions, extra].filter(Boolean));
  return {
    node,
    head,
    status,
    title,
    figure: fig,
    prompt: promptNode,
    body,
    feedback,
    actions,
    extra,
    setStatus(text, tone = 'info') {
      status.hidden = !text;
      status.textContent = text ?? '';
      status.className = `ix-status is-${tone}`;
    },
    destroy() {
      fig?.destroy();
    },
  };
}

// ---------------------------------------------------------------- inputs

const NUM_TYPES = new Set(['number', 'vector', 'matrix', 'basis', 'span', 'solution']);

/** One numeric cell. `last`: Enter submits here (the keyboard shows "done"), elsewhere it moves on ("next"). */
function numCell({ value = '', label, onInput, onEnter, last = true }) {
  const input = el('input', {
    class: 'ix-in ix-num',
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: last ? 'done' : 'next',
    'aria-label': label,
  });
  input.value = value ?? '';
  input.addEventListener('input', () => {
    input.classList.remove('is-wrong', 'is-right');
    input.removeAttribute('aria-invalid');
    onInput?.();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter?.();
    }
  });
  return input;
}

/** "±" and "/" keys for numeric inputs (decimal keypads on phones lack them). Shown on coarse pointers. */
function signKeys(group) {
  let target = null;
  group.addEventListener('focusin', (e) => {
    if (e.target.matches?.('input.ix-num')) target = e.target;
  });
  const press = (fn) => (e) => {
    const input = target && group.contains(target) ? target : group.querySelector('input.ix-num:not(:disabled)');
    if (!input || input.disabled) return;
    fn(input);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    e.preventDefault();
  };
  const keep = (e) => e.preventDefault(); // keep the keyboard open
  const neg = button('±', { variant: 'key', 'aria-label': 'Toggle minus sign', onpointerdown: keep, onclick: press((i) => (i.value = i.value.startsWith('-') || i.value.startsWith('\u2212') ? i.value.slice(1) : `-${i.value}`)) });
  const slash = button('/', { variant: 'key', 'aria-label': 'Fraction bar', onpointerdown: keep, onclick: press((i) => {
    const s = i.selectionStart ?? i.value.length;
    const e = i.selectionEnd ?? s;
    i.setRangeText('/', s, e, 'end');
  }) });
  return el('div', { class: 'ix-keys' }, neg, slash);
}

function shapeOf(value) {
  return Array.isArray(value) && value.length && Array.isArray(value[0]) ? [value.length, value[0].length] : null;
}

/** Free matrices grow to at most MAX_FREE × MAX_FREE by the buttons. */
const MAX_FREE = 8;

/** A restored free shape, clamped to MAX_FREE, but never so small that a non-empty cell would be dropped. */
function freeShape(value) {
  const shape = shapeOf(value);
  if (!shape) return null;
  const filled = (x) => x !== undefined && x !== null && String(x).trim() !== '';
  let lastRow = 0;
  let lastCol = 0;
  value.forEach((row, i) => (row ?? []).forEach((x, j) => filled(x) && ((lastRow = Math.max(lastRow, i + 1)), (lastCol = Math.max(lastCol, j + 1)))));
  const width = Math.max(...value.map((r) => r?.length ?? 0));
  return [Math.min(value.length, Math.max(MAX_FREE, lastRow)), Math.min(width, Math.max(MAX_FREE, lastCol))];
}

function matrixInput(spec, { value, onChange, onSubmit, label = 'Matrix', free = spec.free }) {
  const want = shapeOf(spec.value) ?? [2, 2];
  let [rows, cols] = free ? freeShape(value) ?? spec.start ?? [2, 2] : want;
  let vals = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => value?.[i]?.[j] ?? ''));
  const grid = el('div', { class: 'ix-grid', role: 'group', 'aria-label': label });
  const wrap = el('div', { class: 'ix-matrix' }, grid);
  let cells = [];
  let disabled = false;

  const read = () => (vals = cells.map((row) => row.map((c) => c.value)));
  const draw = () => {
    grid.style.setProperty('--cols', cols);
    cells = vals.map((row, i) =>
      row.map((v, j) =>
        numCell({
          value: v,
          label: `${label}, row ${i + 1}, column ${j + 1}`,
          last: i === vals.length - 1 && j === row.length - 1,
          onInput: () => (read(), onChange?.(vals)),
          onEnter: () => {
            const next = cells[i]?.[j + 1] ?? cells[i + 1]?.[0];
            if (next) next.focus();
            else onSubmit?.();
          },
        }),
      ),
    );
    grid.replaceChildren(...cells.flat());
    cells.flat().forEach((c) => (c.disabled = disabled));
  };
  const resize = (dr, dc) => {
    read();
    const nextRows = rows + dr;
    const nextCols = cols + dc;
    // adding never shrinks (a restored shape may exceed MAX_FREE); removing stops at 1
    if (nextRows < 1 || nextCols < 1 || (dr > 0 && nextRows > MAX_FREE) || (dc > 0 && nextCols > MAX_FREE)) return;
    rows = nextRows;
    cols = nextCols;
    vals = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => vals[i]?.[j] ?? ''));
    draw();
    onChange?.(vals);
    sizeLabel.textContent = `${rows} × ${cols}`;
  };
  draw();

  const sizeLabel = el('span', { class: 'ix-size', text: `${rows} × ${cols}` });
  const controls = free
    ? el(
        'div',
        { class: 'ix-resize' },
        el('span', { class: 'ix-resize-group' }, el('span', { class: 'ix-label', text: 'Rows' }), button('', { variant: 'icon', icon: 'minus', 'aria-label': 'Remove a row', onclick: () => resize(-1, 0) }), button('', { variant: 'icon', icon: 'plus', 'aria-label': 'Add a row', onclick: () => resize(1, 0) })),
        el('span', { class: 'ix-resize-group' }, el('span', { class: 'ix-label', text: 'Columns' }), button('', { variant: 'icon', icon: 'minus', 'aria-label': 'Remove a column', onclick: () => resize(0, -1) }), button('', { variant: 'icon', icon: 'plus', 'aria-label': 'Add a column', onclick: () => resize(0, 1) })),
        sizeLabel,
      )
    : null;
  const node = el('div', { class: 'ix-input ix-input-matrix' }, wrap, controls, signKeys(wrap));
  return {
    node,
    get: () => read(),
    set(v) {
      [rows, cols] = shapeOf(v) ?? [rows, cols];
      vals = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => v?.[i]?.[j] ?? ''));
      draw();
      sizeLabel.textContent = `${rows} × ${cols}`;
    },
    mark(result) {
      cells.forEach((row, i) =>
        row.forEach((c, j) => {
          const wrong = result.ok ? false : result.wrongAt ? !!result.wrongAt[i]?.[j] : null;
          c.classList.toggle('is-right', !!result.ok);
          c.classList.toggle('is-wrong', wrong === true);
          if (wrong) c.setAttribute('aria-invalid', 'true');
        }),
      );
    },
    unmark() {
      cells.flat().forEach((c) => (c.classList.remove('is-right', 'is-wrong'), c.removeAttribute('aria-invalid')));
    },
    disable(on) {
      disabled = on;
      cells.flat().forEach((c) => (c.disabled = on));
      controls?.querySelectorAll('button').forEach((b) => (b.disabled = on));
      node.classList.toggle('is-locked', on);
    },
    focus: () => cells[0]?.[0]?.focus(),
  };
}

/** One column vector of `n` cells (bracketed). */
function columnCells(n, value, { label, onInput, onEnter }) {
  const cells = Array.from({ length: n }, (_, i) => numCell({ value: value?.[i] ?? '', label: `${label}, entry ${i + 1}`, last: i === n - 1, onInput, onEnter: () => (i < n - 1 ? cells[i + 1].focus() : onEnter?.()) }));
  const node = el('div', { class: 'ix-matrix ix-col' }, el('div', { class: 'ix-grid', style: { '--cols': 1 }, role: 'group', 'aria-label': label }, cells));
  return { node, cells, get: () => cells.map((c) => c.value) };
}

function markCells(cells, result) {
  cells.forEach((c, i) => {
    c.classList.toggle('is-right', !!result.ok);
    const wrong = !result.ok && (result.wrongAt ? !!result.wrongAt[i] : false);
    c.classList.toggle('is-wrong', wrong);
    if (wrong) c.setAttribute('aria-invalid', 'true');
  });
}

function vectorInput(spec, { value, onChange, onSubmit, label = 'Vector' }) {
  const n = spec.value?.length ?? spec.n ?? 2;
  const col = columnCells(n, value, { label, onInput: () => onChange?.(col.get()), onEnter: onSubmit });
  const node = el('div', { class: 'ix-input ix-input-vector' }, col.node, signKeys(col.node));
  return {
    node,
    get: () => col.get(),
    set: (v) => col.cells.forEach((c, i) => (c.value = v?.[i] ?? '')),
    mark: (result) => markCells(col.cells, result),
    unmark: () => col.cells.forEach((c) => (c.classList.remove('is-right', 'is-wrong'), c.removeAttribute('aria-invalid'))),
    disable(on) {
      col.cells.forEach((c) => (c.disabled = on));
      node.classList.toggle('is-locked', on);
    },
    focus: () => col.cells[0]?.focus(),
  };
}

/**
 * A growable list of column vectors (basis / span / the free part of a solution).
 * opts: n (entries per vector), value ([[…]]), min (fewest vectors), start (vectors shown when empty), param ('t'),
 * lead (TeX shown before the first vector), label.
 */
function vectorList({ n, value, min = 0, start = 1, param = null, label = 'Vector', onChange, onSubmit }) {
  let vecs = Array.isArray(value) ? value.map((v) => Array.from({ length: n }, (_, i) => v?.[i] ?? '')) : Array.from({ length: start }, () => Array(n).fill(''));
  const list = el('div', { class: 'ix-veclist' });
  let cols = [];
  let disabled = false;
  const read = () => (vecs = cols.map((c) => c.get()));
  const draw = () => {
    cols = vecs.map((v, k) => columnCells(n, v, { label: `${label} ${k + 1}`, onInput: () => (read(), onChange?.(vecs)), onEnter: onSubmit }));
    list.replaceChildren(
      ...cols.map((c, k) => {
        const lead = param ? el('span', { class: 'ix-op', html: md(`$+\\;${param}_{${k + 1}}$`, { inline: true }) }) : k > 0 ? el('span', { class: 'ix-op', text: ',' }) : null;
        const remove = button('', { variant: 'icon', icon: 'minus', class: 'ix-remove', 'aria-label': `Remove ${label.toLowerCase()} ${k + 1}`, disabled: disabled || vecs.length <= min, onclick: () => (read(), vecs.splice(k, 1), draw(), onChange?.(vecs)) });
        return el('div', { class: 'ix-vecitem' }, lead, el('div', { class: 'ix-vecstack' }, c.node, remove));
      }),
      button(param ? 'Add a direction' : 'Add a vector', { variant: 'quiet', icon: 'plus', class: 'ix-add', disabled: disabled || vecs.length >= 6, onclick: () => (read(), vecs.push(Array(n).fill('')), draw(), onChange?.(vecs), cols.at(-1)?.cells[0]?.focus()) }),
    );
    cols.forEach((c) => c.cells.forEach((x) => (x.disabled = disabled)));
  };
  draw();
  return {
    node: list,
    get: () => read(),
    set(v) {
      vecs = (v ?? []).map((x) => Array.from({ length: n }, (_, i) => x?.[i] ?? ''));
      draw();
    },
    mark(result) {
      cols.forEach((c) => c.cells.forEach((x) => (x.classList.toggle('is-right', !!result.ok), x.classList.toggle('is-wrong', false))));
    },
    unmark: () => cols.forEach((c) => c.cells.forEach((x) => x.classList.remove('is-right', 'is-wrong'))),
    disable(on) {
      disabled = on;
      read();
      draw();
    },
    focus: () => cols[0]?.cells[0]?.focus(),
  };
}

function basisInput(spec, { value, onChange, onSubmit, label = 'Vector' }) {
  const n = spec.value?.[0]?.length ?? spec.n ?? 2;
  const list = vectorList({ n, value, min: 0, start: 1, label, onChange, onSubmit });
  const node = el('div', { class: 'ix-input ix-input-basis' }, el('span', { class: 'ix-brace', html: md('$\\Big\\{$', { inline: true }) }), list.node, el('span', { class: 'ix-brace', html: md('$\\Big\\}$', { inline: true }) }));
  node.append(signKeys(node));
  return { ...list, node, disable: (on) => (list.disable(on), node.classList.toggle('is-locked', on)) };
}

function solutionInput(spec, { value, onChange, onSubmit }) {
  const n = spec.particular?.length ?? spec.n ?? 2;
  let particular = value?.particular ?? Array(n).fill('');
  let basis = value?.basis;
  const emit = () => onChange?.({ particular, basis });
  const p = columnCells(n, particular, { label: 'Particular solution', onInput: () => ((particular = p.get()), emit()), onEnter: onSubmit });
  const free = vectorList({ n, value: basis, min: 0, start: 1, param: 't', label: 'Direction', onChange: (v) => ((basis = v), emit()), onSubmit });
  basis = free.get();
  const node = el(
    'div',
    { class: 'ix-input ix-input-solution' },
    el('div', { class: 'ix-solrow' }, el('span', { class: 'ix-op', html: md('$\\mathbf{x} =$', { inline: true }) }), p.node, free.node),
  );
  node.append(signKeys(node));
  return {
    node,
    get: () => ({ particular: p.get(), basis: free.get() }),
    set(v) {
      p.cells.forEach((c, i) => (c.value = v?.particular?.[i] ?? ''));
      free.set(v?.basis ?? []);
    },
    mark(result) {
      markCells(p.cells, { ok: result.ok });
      free.mark(result);
    },
    unmark() {
      p.cells.forEach((c) => c.classList.remove('is-right', 'is-wrong'));
      free.unmark();
    },
    disable(on) {
      p.cells.forEach((c) => (c.disabled = on));
      free.disable(on);
      node.classList.toggle('is-locked', on);
    },
    focus: () => p.cells[0]?.focus(),
  };
}

function lineInput(spec, { value, onChange, onSubmit, label = 'Your answer' }) {
  const numeric = spec.type === 'number';
  const input = el('input', {
    class: ['ix-in', 'ix-line', numeric && 'ix-num'],
    type: 'text',
    inputmode: numeric ? 'decimal' : 'text',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'done',
    placeholder: numeric ? 'e.g. -3/4' : spec.type === 'set' ? 'e.g. 1, 2, 3' : 'Type your answer',
    'aria-label': label,
  });
  input.value = value ?? '';
  input.addEventListener('input', () => {
    input.classList.remove('is-wrong', 'is-right');
    input.removeAttribute('aria-invalid');
    onChange?.(input.value);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    }
  });
  const node = el('div', { class: 'ix-input ix-input-line' }, input);
  if (numeric) node.append(signKeys(node));
  return {
    node,
    get: () => input.value,
    set: (v) => (input.value = v ?? ''),
    mark(result) {
      input.classList.toggle('is-right', !!result.ok);
      input.classList.toggle('is-wrong', !result.ok);
      if (!result.ok) input.setAttribute('aria-invalid', 'true');
    },
    unmark: () => (input.classList.remove('is-right', 'is-wrong'), input.removeAttribute('aria-invalid')),
    disable(on) {
      input.disabled = on;
      node.classList.toggle('is-locked', on);
    },
    focus: () => input.focus(),
  };
}

/**
 * Choice cards. mode 'answer': a tap answers at once (onPick(id)); 'select': radio-like; 'multi': checkboxes.
 * Letter keys (A, B, …) pick while focus is inside the list.
 */
export function choiceList(choices, { mode = 'answer', value, onPick } = {}) {
  const multi = mode === 'multi';
  const node = el('div', { class: ['ix-choices', multi && 'is-multi'], role: multi ? 'group' : mode === 'select' ? 'radiogroup' : 'group' });
  let picked = new Set([value].flat().filter((x) => x !== undefined && x !== null && x !== ''));
  const buttons = new Map();
  choices.forEach((c, i) => {
    const props = { type: 'button', class: 'ix-choice', dataset: { id: c.id } };
    if (multi) props.role = 'checkbox';
    else if (mode === 'select') props.role = 'radio';
    const b = el('button', props, el('span', { class: 'ix-letter', 'aria-hidden': 'true', text: LETTERS[i] }), el('span', { class: 'ix-choice-label', html: md(c.label ?? c.id, { inline: true }) }));
    b.addEventListener('click', () => {
      if (b.disabled) return;
      if (multi) picked.has(c.id) ? picked.delete(c.id) : picked.add(c.id);
      else picked = new Set([c.id]);
      sync();
      onPick?.(c.id);
    });
    buttons.set(c.id, b);
    node.append(b);
  });
  node.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    const i = LETTERS.indexOf(e.key.toUpperCase());
    const c = choices[i];
    if (!c) return;
    const b = buttons.get(c.id);
    if (b.disabled) return;
    e.preventDefault();
    b.focus();
    b.click();
  });
  const sync = () => {
    for (const [id, b] of buttons) {
      const on = picked.has(id);
      b.classList.toggle('is-on', on && mode !== 'answer');
      if (multi || mode === 'select') b.setAttribute('aria-checked', String(on));
    }
  };
  sync();
  return {
    node,
    get: () => (multi ? [...picked] : [...picked][0] ?? null),
    select(ids) {
      picked = new Set([ids].flat().filter(Boolean));
      sync();
    },
    mark(id, state) {
      const b = buttons.get(id);
      if (!b) return;
      b.classList.remove('is-right', 'is-wrong', 'is-missed');
      b.classList.add(`is-${state}`);
    },
    clearMarks: () => buttons.forEach((b) => b.classList.remove('is-right', 'is-wrong', 'is-missed')),
    disable(on, id) {
      if (id !== undefined) buttons.get(id) && (buttons.get(id).disabled = on);
      else buttons.forEach((b) => (b.disabled = on));
    },
    focus: () => node.querySelector('.ix-choice:not(:disabled)')?.focus(),
  };
}

function choiceInput(spec, { value, onChange, choices = [] }) {
  const list = choiceList(choices, { mode: spec.type === 'multi' ? 'multi' : 'select', value, onPick: () => onChange?.(list.get()) });
  return {
    node: el('div', { class: 'ix-input ix-input-choice' }, list.node),
    get: list.get,
    set: (v) => list.select(v),
    mark(result) {
      list.clearMarks();
      const want = new Set([spec.value].flat());
      for (const id of [list.get()].flat().filter(Boolean)) {
        if (result.ok) list.mark(id, 'right');
        else if (!want.has(id)) list.mark(id, 'wrong');
      }
    },
    unmark: list.clearMarks,
    disable: (on) => list.disable(on),
    focus: list.focus,
  };
}

export function answerInput(spec, opts = {}) {
  switch (spec.type) {
    case 'matrix':
      return matrixInput(spec, opts);
    case 'vector':
      return vectorInput(spec, opts);
    case 'basis':
    case 'span':
      return basisInput(spec, opts);
    case 'solution':
      return solutionInput(spec, opts);
    case 'choice':
    case 'multi':
      return choiceInput(spec, opts);
    case 'number':
    case 'text':
    case 'set':
    default:
      return lineInput(spec, opts);
  }
}

export const isNumeric = (spec) => NUM_TYPES.has(spec?.type);

/** True when the learner has not entered anything yet (so Check can ask for an answer instead of grading). */
export function emptyValue(spec, value) {
  const blank = (x) => x === undefined || x === null || String(x).trim() === '';
  switch (spec.type) {
    case 'vector':
      return !Array.isArray(value) || value.every(blank);
    case 'matrix':
      return !Array.isArray(value) || value.flat().every(blank);
    case 'basis':
    case 'span':
      return !Array.isArray(value) || value.flat().every(blank);
    case 'solution':
      return !value || [value.particular ?? [], ...(value.basis ?? [])].flat().every(blank);
    case 'multi':
      return !Array.isArray(value) || !value.length;
    default:
      return blank(value);
  }
}

const texCell = (x) => (String(x ?? '').trim() || '?').replace(/[\\{}]/g, '');
const texCol = (v) => `\\begin{bmatrix}${(v ?? []).map(texCell).join('\\\\')}\\end{bmatrix}`;

/** The response as text / TeX for the tutor. */
export function responseText(spec, value, choices = []) {
  const label = (id) => {
    const i = choices.findIndex((c) => c.id === id);
    return i < 0 ? String(id) : `(${LETTERS[i]}) ${choices[i].label ?? id}`;
  };
  switch (spec.type) {
    case 'vector':
      return `$${texCol(value)}$`;
    case 'matrix':
      return `$\\begin{bmatrix}${(value ?? []).map((r) => r.map(texCell).join(' & ')).join('\\\\')}\\end{bmatrix}$`;
    case 'basis':
    case 'span':
      return `$\\left\\{${(value ?? []).map(texCol).join(',\\;')}\\right\\}$`;
    case 'solution':
      return `$\\mathbf{x} = ${[texCol(value?.particular), ...(value?.basis ?? []).map((b, i) => `t_{${i + 1}}${texCol(b)}`)].join(' + ')}$`;
    case 'choice':
      return value ? label(value) : '';
    case 'multi':
      return (value ?? []).map(label).join('; ');
    default:
      return String(value ?? '');
  }
}

/** Plain text of the expected answer, for filling a typed blank on reveal. */
export function revealValue(spec) {
  switch (spec.type) {
    case 'number':
      return String(spec.value);
    case 'text':
      return spec.accept?.[0] ?? '';
    case 'set':
      return spec.value.join(', ');
    case 'vector':
      return `(${spec.value.join(', ')})`;
    default:
      return '';
  }
}

export { md, reducedMotion };

/** Markdown of the expected answer (the "Answer" line of the solution box). */
export function answerMd(spec, choices = []) {
  if (!spec || spec.type === 'proof') return '';
  if (spec.type === 'choice' || spec.type === 'multi') {
    return [spec.value]
      .flat()
      .map((id) => {
        const i = choices.findIndex((c) => c.id === id);
        return i < 0 ? String(id) : `**${LETTERS[i]}.** ${choices[i].label ?? id}`;
      })
      .join('  \n');
  }
  const tex = answerTex(spec);
  return tex ? `$$${tex}$$` : '';
}
