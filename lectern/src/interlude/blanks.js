/**
 * "Fill in the blanks": lines of TeX with gaps.
 *
 *   renderBlanks(beat, ctx) → { node, ready, destroy }
 *
 * beat.lines = [[ 'TeX', { id, chips: ['TeX', …], answer: 'TeX', hint? }, 'TeX', { id, answer: spec, hint? } ], …]
 * A line may also hold a matrix piece { matrix: [[cell, …], …], augment? }: a bracketed grid aligned on the line
 * where each cell is a TeX string (fixed entry) or a blank object like the inline ones; `augment: k` draws the
 * augmentation bar after column k. Matrix blanks check, save and restore exactly like inline blanks.
 * Blanks inside any TeX (fractions, roots, exponents): { tex: '\\frac{\\blank{a}}{\\sqrt{\\blank{b}}}',
 * blanks: { a: { answer, chips?, hint?, width? }, b: { … } } }. Each \blank{id} reserves an invisible box (the
 * longest chip, or `width` em for a typed blank, default 2.2 for numbers, 4 otherwise) and a real input / chip
 * target is laid over it (re-placed on resize); its id is the key, its accessible name 'Blank <id>'. The piece
 * renders in display style so fractions keep full size.
 * Chip blanks: tap a blank to select it (tapping a filled one clears it); the tray below offers the selected
 * (or next empty) blank's chips; tapping a chip fills it and moves on. Typed blanks are small inputs checked with
 * core/answer.js (a bare number or string as `answer` is read as a number / text spec).
 * Check marks each blank green or red and lists the hints of the red ones.
 *
 * Store: `q:<lecture>/<beat>` { value: { blankId: text }, results: { blankId: bool }, ok, revealed, tries }.
 * Progress: store.mark(id, allRight) on the first check. ready: all right or solution revealed.
 */
import { check, answerTex } from '../core/answer.js';
import { el, replay } from '../core/dom.js';
import { md } from '../core/md.js';
import { katexHtml } from '../core/mobject.js';
import { makeCard, button, solutionView, deferred, ids, revealValue, pickRng, revealIn, viaKeyboard } from './common.js';

const tex = (s) => katexHtml(String(s), { display: false });
/** A TeX string that starts with punctuation (", then", ".", ")"), possibly inside \text{…}. */
const PUNCT_LED = /^\s*(\\(text|textrm|mathrm)\{\s*)?[,.;:!?)\]]/;

function specOf(blank) {
  const a = blank.answer;
  if (a && typeof a === 'object') return a;
  return Number.isFinite(Number(a)) && String(a).trim() !== '' ? { type: 'number', value: String(a) } : { type: 'text', accept: [String(a ?? '')] };
}

export function renderBlanks(beat, ctx) {
  const I = ids(ctx, beat);
  const qKey = `q:${I.key}`;
  const saved = ctx.store.get(qKey) ?? {};
  const values = { ...(saved.value && typeof saved.value === 'object' ? saved.value : {}) };
  const state = { ok: saved.ok === true, revealed: saved.revealed === true, tries: saved.tries ?? (saved.ok !== undefined ? 1 : 0) };
  const ready = deferred();
  const card = makeCard(beat, 'blanks');
  const sol = solutionView({ steps: beat.solution });
  card.extra.append(sol.node);
  const save = (patch) => ctx.store.put(qKey, patch);
  const finish = (live) => {
    ready.resolve();
    if (live) ctx.onDone?.();
  };

  /** @type {{ id, def, chip: boolean, node, input?, n }[]} */
  const blanks = [];
  let active = null;
  let lastTarget = null;
  let locked = false;

  const linesNode = el('div', { class: 'ix-blines' });
  const tray = el('div', { class: 'ix-tray', role: 'group', 'aria-label': 'Choices' });
  const trayLabel = el('div', { class: 'ix-label ix-tray-label' });
  const trayWrap = el('div', { class: 'ix-tray-wrap', hidden: true }, trayLabel, tray);
  card.body.append(linesNode, trayWrap);

  const isPiece = (p) => p !== null && typeof p === 'object';
  const observers = [];
  let texPieces = 0;

  /**
   * Builds one blank and registers it in reading order. kind: 'inline' (in the line), 'cell' (matrix cell) or
   * 'over' (absolutely placed over a box inside rendered TeX); label: the accessible name.
   */
  function makeBlank(part, fallbackId, kind = 'inline', label = null) {
    const inMatrix = kind === 'cell';
    const b = { id: part.id ?? fallbackId, def: part, chip: Array.isArray(part.chips), n: blanks.length + 1 };
    b.label = label ?? `Blank ${b.n}`;
    const cls = ['ix-blank', b.chip ? 'is-chip' : 'is-typed', inMatrix && 'is-cell', kind === 'over' && 'is-over'];
    if (b.chip) {
      b.node = el('button', { type: 'button', class: cls, dataset: { id: b.id } });
      b.node.addEventListener('click', () => {
        if (locked || b.node.disabled) return;
        if (values[b.id]) setValue(b, '');
        active = b;
        sync();
      });
    } else {
      const spec = specOf(part);
      const numeric = spec.type === 'number';
      b.input = el('input', {
        class: ['ix-in', 'ix-blank-in', numeric && 'ix-num', spec.type === 'text' && kind === 'inline' && 'is-wide'],
        type: 'text',
        inputmode: numeric ? 'decimal' : 'text',
        autocomplete: 'off',
        autocapitalize: 'off',
        autocorrect: 'off',
        spellcheck: 'false',
        enterkeyhint: 'done',
        'aria-label': b.label,
      });
      b.input.addEventListener('input', () => setValue(b, b.input.value, false));
      b.input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const next = blanks.slice(blanks.indexOf(b) + 1).find((x) => !x.chip && !x.input.disabled);
        if (next) next.input.focus();
        else doCheck();
      });
      b.node = el('span', { class: cls, dataset: { id: b.id } }, b.input);
    }
    blanks.push(b);
    return b.node;
  }

  /** A bracketed grid of fixed TeX cells and blank cells; `augment` = number of columns before the bar. */
  function makeMatrix(piece, li, pi) {
    const rows = piece.matrix;
    const cols = Math.max(...rows.map((r) => r.length));
    const grid = el('div', { class: 'ix-bm-grid', style: { '--cols': cols }, role: 'group', 'aria-label': `Matrix with ${rows.length} rows and ${cols} columns` });
    rows.forEach((row, i) =>
      row.forEach((cell, j) => {
        const content = isPiece(cell) ? makeBlank(cell, `${li}-${pi}-${i}-${j}`, 'cell') : el('span', { class: 'ix-btex', html: tex(cell) });
        grid.append(el('span', { class: ['ix-bm-cell', piece.augment !== undefined && j === piece.augment && 'is-aug'] }, content));
      }),
    );
    return el('span', { class: 'ix-matrix ix-bmatrix' }, grid);
  }

  /**
   * Rendered TeX with blanks inside (fractions, roots, exponents): each \blank{id} becomes an invisible box of the
   * right size (the longest chip, or `width` em for typed blanks) tagged with \htmlId; the real input / chip target
   * is placed absolutely over it and re-placed whenever the piece resizes (fonts, viewport).
   */
  function makeTexPiece(piece, li, pi) {
    const uid = `ixb${++texPieces}`;
    const domId = (id) => `${uid}-${String(id).replace(/[^\w-]/g, '_')}`;
    const defs = piece.blanks ?? {};
    const src = String(piece.tex).replace(/\\blank\{([^}]*)\}/g, (_, id) => {
      const def = defs[id] ?? {};
      const longest = Array.isArray(def.chips) ? def.chips.reduce((a, c) => (String(c).length > a.length ? String(c) : a), '') : null;
      const width = def.width ?? (specOf(def).type === 'number' ? 2.2 : 4);
      const box = longest !== null ? `\\boxed{${longest}}` : `\\boxed{\\rule{0pt}{1em}\\hspace{${width}em}}`;
      return `\\htmlId{${domId(id)}}{\\phantom{${box}}}`;
    });
    const math = el('span', { class: 'ix-btex', html: katexHtml(`\\displaystyle ${src}`, { display: false }) });
    const wrap = el('span', { class: 'ix-btexblanks' }, math);
    const placed = [];
    for (const id of [...String(piece.tex).matchAll(/\\blank\{([^}]*)\}/g)].map((m) => m[1])) {
      const node = makeBlank({ ...(defs[id] ?? {}), id }, `${li}-${pi}-${id}`, 'over', `Blank ${id}`);
      wrap.append(node);
      placed.push({ node, target: () => math.querySelector(`#${CSS.escape(domId(id))}`) });
    }
    const place = () => {
      const base = wrap.getBoundingClientRect();
      if (!base.width) return;
      for (const { node, target } of placed) {
        const t = target();
        if (!t) continue;
        // the union of the box's parts (KaTeX's inline spans can report zero height themselves)
        const rects = [t, ...t.querySelectorAll('*')].map((n) => n.getBoundingClientRect()).filter((r) => r.width && r.height);
        if (!rects.length) continue;
        const left = Math.min(...rects.map((r) => r.left));
        const top = Math.min(...rects.map((r) => r.top));
        const w = Math.max(...rects.map((r) => r.right)) - left;
        const h = Math.max(...rects.map((r) => r.bottom)) - top;
        // never smaller than a usable target; grown boxes stay centred on the hole
        const W = Math.max(w, 36);
        const H = Math.max(h, 30);
        Object.assign(node.style, { left: `${left - base.left - (W - w) / 2}px`, top: `${top - base.top - (H - h) / 2}px`, width: `${W}px`, height: `${H}px` });
      }
    };
    const watcher = new ResizeObserver(place);
    watcher.observe(wrap);
    document.fonts?.ready.then(place);
    observers.push(watcher);
    return wrap;
  }

  (beat.lines ?? []).forEach((line, li) => {
    const row = el('div', { class: 'ix-bline' });
    const parts = [line].flat();
    parts.forEach((part, pi) => {
      if (typeof part === 'string' || typeof part === 'number') {
        // an empty group stands in for a neighbouring blank / matrix, so "+ 1" or "= " keep binary / relation spacing
        const src = `${isPiece(parts[pi - 1]) ? '{}' : ''}${part}${isPiece(parts[pi + 1]) ? '{}' : ''}`;
        const node = el('span', { class: 'ix-btex', html: tex(src) });
        // punctuation right after a blank (", then", ".") never wraps away from it
        if (isPiece(parts[pi - 1]) && PUNCT_LED.test(String(part)) && row.lastChild) {
          const prev = row.lastChild;
          const keep = el('span', { class: 'ix-nowrap' });
          row.replaceChild(keep, prev);
          keep.append(prev, node);
        } else row.append(node);
      } else if (isPiece(part) && Array.isArray(part.matrix)) {
        row.append(makeMatrix(part, li, pi));
      } else if (isPiece(part) && typeof part.tex === 'string') {
        row.append(makeTexPiece(part, li, pi));
      } else if (isPiece(part)) {
        row.append(makeBlank(part, `${li}-${pi}`));
      }
    });
    linesNode.append(row);
  });
  // Enter moves on from every typed blank except the last, which checks: say so on the keyboard
  const typed = blanks.filter((b) => b.input);
  typed.forEach((b, i) => b.input.setAttribute('enterkeyhint', i === typed.length - 1 ? 'done' : 'next'));

  function setValue(b, v, render = true) {
    values[b.id] = v;
    b.node.classList.remove('is-right', 'is-wrong');
    b.node.removeAttribute('aria-invalid');
    if (render && b.input) b.input.value = v;
    if (b.chip) paintChip(b);
    // an edited blank has no verdict any more: drop its saved result so a reload doesn't paint it
    const results = { ...(ctx.store.get(qKey)?.results ?? {}) };
    delete results[b.id];
    save({ value: { ...values }, results });
  }

  function paintChip(b) {
    const v = values[b.id];
    b.node.innerHTML = v ? tex(v) : '<span class="ix-blank-gap"></span>';
    b.node.classList.toggle('is-filled', !!v);
    b.node.setAttribute('aria-label', v ? `${b.label}: filled, tap to clear` : `${b.label}: empty`);
  }

  /** The chip blank the tray fills: the selected one if empty, else the next empty one. */
  const target = () => {
    const chips = blanks.filter((b) => b.chip && !b.node.disabled);
    if (active && !values[active.id] && chips.includes(active)) return active;
    const from = active ? chips.indexOf(active) : -1;
    return chips.slice(from + 1).find((b) => !values[b.id]) ?? chips.find((b) => !values[b.id]) ?? null;
  };

  function sync() {
    const t = target();
    blanks.forEach((b) => b.chip && b.node.classList.toggle('is-active', b === t && !locked));
    if (t) lastTarget = t;
    const show = !locked && lastTarget;
    trayWrap.hidden = !show;
    if (!show) return;
    const order = pickRng(`${I.key}/${lastTarget.id}`).shuffle(lastTarget.def.chips);
    trayLabel.textContent = blanks.filter((b) => b.chip).length > 1 ? `Choices for ${lastTarget.label.toLowerCase()}` : 'Choices';
    tray.replaceChildren(
      ...order.map((c) =>
        el('button', {
          type: 'button',
          class: 'ix-chip',
          html: tex(c),
          'aria-label': `Choice ${c}`,
          onpointerdown: (e) => e.preventDefault(),
          onclick: () => {
            const b = target() ?? lastTarget;
            if (!b || locked) return;
            setValue(b, c);
            if (!viaKeyboard()) replay(b.node, 'ix-fill');
            active = b;
            sync();
          },
        }),
      ),
    );
  }

  const blankOk = (b) => {
    const v = values[b.id] ?? '';
    if (String(v).trim() === '') return false;
    return b.chip ? String(v).trim() === String(b.def.answer).trim() : check(specOf(b.def), v).ok === true;
  };

  function markResults(results) {
    for (const b of blanks) {
      if (!(b.id in results)) continue;
      b.node.classList.toggle('is-right', results[b.id]);
      b.node.classList.toggle('is-wrong', !results[b.id]);
      if (!results[b.id]) b.node.setAttribute('aria-invalid', 'true');
    }
  }

  function lock() {
    locked = true;
    active = null;
    blanks.forEach((b) => (b.chip ? (b.node.disabled = true) : (b.input.disabled = true)));
    checkBtn.disabled = true;
    sync();
  }

  const checkBtn = button('Check', { variant: 'primary', icon: 'check', onclick: () => doCheck() });
  const solBtn = button('Show solution', { variant: 'quiet', icon: 'eye', hidden: true, onclick: () => reveal(true) });
  card.actions.append(checkBtn, solBtn);

  function doCheck() {
    if (locked) return;
    if (blanks.every((b) => String(values[b.id] ?? '').trim() === '')) {
      card.feedback.show('info', 'Fill in a blank first.', { animate: false });
      return;
    }
    const results = Object.fromEntries(blanks.map((b) => [b.id, blankOk(b)]));
    const right = Object.values(results).filter(Boolean).length;
    const ok = right === blanks.length;
    if (state.tries === 0) ctx.store.mark(I.id, ok);
    state.tries += 1;
    markResults(results);
    save({ value: { ...values }, results, ok, tries: state.tries });
    if (ok) {
      state.ok = true;
      lock();
      card.feedback.show('ok', md('**All right.**'));
      card.setStatus('Correct', 'ok');
      solBtn.hidden = !beat.solution;
      solBtn.querySelector('span').textContent = 'Worked solution';
      finish(true);
      return;
    }
    const hints = blanks
      .filter((b) => !results[b.id])
      .map((b) => {
        const empty = String(values[b.id] ?? '').trim() === '';
        const label = blanks.length > 1 ? `${b.label}: ` : '';
        return `- ${label}${empty ? 'still empty.' : b.def.hint ?? 'not this one.'}`;
      });
    card.feedback.show('bad', md([`**${right} of ${blanks.length} right.** Fix the red ones and check again.`, hints.join('\n')]));
    solBtn.hidden = false;
  }

  function reveal(live) {
    state.revealed = true;
    for (const b of blanks) {
      if (blankOk(b)) continue;
      if (b.chip) {
        values[b.id] = String(b.def.answer);
        paintChip(b);
      } else {
        const spec = specOf(b.def);
        const plain = revealValue(spec);
        if (plain) b.input.value = plain;
        else {
          b.input.hidden = true;
          b.node.append(el('span', { class: 'ix-btex', html: tex(answerTex(spec) || '?') }));
        }
      }
      b.node.classList.remove('is-wrong');
      b.node.classList.add('is-revealed');
      b.node.removeAttribute('aria-invalid');
    }
    lock();
    solBtn.hidden = true;
    if (beat.solution) sol.show({ animate: live });
    if (!state.ok) card.setStatus('Solution shown', 'warn');
    if (live) {
      revealIn(blanks.filter((b) => b.node.classList.contains('is-revealed')).map((b) => b.node));
      save({ revealed: true });
    }
    finish(live);
  }

  // ---- restore ----
  for (const b of blanks) {
    if (b.chip) paintChip(b);
    else b.input.value = values[b.id] ?? '';
  }
  if (saved.results && typeof saved.results === 'object') markResults(saved.results);
  sync();
  if (state.ok) {
    lock();
    card.feedback.show('ok', md('**All right.** You filled these in.'), { animate: false });
    card.setStatus('Correct', 'ok');
    if (beat.solution) {
      solBtn.hidden = false;
      solBtn.querySelector('span').textContent = 'Worked solution';
    }
    finish(false);
  } else if (state.tries > 0) solBtn.hidden = false;
  if (state.revealed) reveal(false);

  const node = el('div', { class: 'ix-wrap' }, card.node);
  return {
    node,
    ready: ready.promise,
    destroy() {
      observers.forEach((o) => o.disconnect());
      card.destroy();
    },
  };
}
