/**
 * "Your turn": a quick question inside the lecture.
 *
 *   renderTry(beat, ctx) → { node, ready, destroy }
 *
 * beat.answer types: choice (tap a card: it answers at once, letter keys work), multi (checkbox cards + Check),
 * number / text / set (one typed line), vector (a stacked column), matrix (a grid). Wrong answers show the
 * checker's or the picked choice's `why` and the learner retries; 'Show solution' appears after one attempt.
 *
 * Store: `q:<lecture>/<beat>` { value, results: { wrong: [choice ids] } | { ok, why }, ok, revealed, tries, hint }.
 * Progress: store.mark(id, ok) once, on the first attempt (first-try correctness; true never downgrades).
 * ready: answered correctly or solution revealed (the player's Skip covers skipping). ctx.onDone() is called on a
 * live completion only, not when an already finished state is restored.
 */
import { check } from '../core/answer.js';
import { el } from '../core/dom.js';
import { md } from '../core/md.js';
import { makeCard, button, hintView, solutionView, choiceList, answerInput, emptyValue, answerMd, deferred, ids, setLabel } from './common.js';

export function renderTry(beat, ctx) {
  const I = ids(ctx, beat);
  const qKey = `q:${I.key}`;
  const spec = beat.answer ?? { type: 'choice', value: null };
  const choices = beat.choices ?? [];
  const saved = ctx.store.get(qKey) ?? {};
  const state = {
    value: saved.value,
    ok: saved.ok === true,
    revealed: saved.revealed === true,
    tries: saved.tries ?? (saved.ok !== undefined ? 1 : 0),
    wrong: Array.isArray(saved.results?.wrong) ? [...saved.results.wrong] : [],
  };
  const ready = deferred();
  const card = makeCard(beat, 'try');
  const hints = hintView(beat.hint);
  const sol = solutionView({ steps: beat.solution, answer: answerMd(spec, choices) });
  card.extra.append(hints.node, sol.node);

  const save = (patch) => ctx.store.put(qKey, patch);
  const finish = (live) => {
    ready.resolve();
    if (live) ctx.onDone?.();
  };
  const record = (ok) => {
    if (state.tries === 0) ctx.store.mark(I.id, ok);
    state.tries += 1;
  };

  // ---- buttons ----
  const checkBtn = button('Check', { variant: 'primary', icon: 'check', onclick: () => doCheck() });
  const hintBtn = beat.hint ? button('Hint', { variant: 'ghost', icon: 'hint', onclick: () => showHint(true) }) : null;
  const solBtn = button('Show solution', { variant: 'quiet', icon: 'eye', hidden: true, onclick: () => reveal(true) });
  const usesCheck = spec.type !== 'choice';
  card.actions.append(...[usesCheck ? checkBtn : null, hintBtn, solBtn].filter(Boolean));

  const showHint = (live) => {
    hints.show(1, { animate: live });
    if (hintBtn) hintBtn.hidden = true;
    if (live) save({ hint: true });
  };
  const offerSolution = () => {
    if (sol.shown) return;
    solBtn.hidden = false;
    setLabel(solBtn, state.ok ? 'Worked solution' : 'Show solution');
  };

  // ---- the input ----
  let input = null;
  let list = null;

  if (spec.type === 'choice') {
    list = choiceList(choices, { mode: 'answer', onPick: (id) => pickChoice(id) });
    card.body.append(list.node);
  } else if (spec.type === 'multi') {
    list = choiceList(choices, {
      mode: 'multi',
      value: state.value,
      onPick: () => {
        state.value = list.get();
        list.clearMarks();
        save({ value: state.value, results: null });
      },
    });
    card.body.append(list.node);
  } else {
    input = answerInput(spec, {
      value: state.value,
      label: 'Your answer',
      onChange: (v) => {
        state.value = v;
        save({ value: v, results: null });
      },
      onSubmit: () => doCheck(),
    });
    card.body.append(input.node);
  }

  const whyOf = (id) => choices.find((c) => c.id === id)?.why;

  function pickChoice(id) {
    if (state.ok) return;
    const res = check(spec, id);
    record(res.ok);
    state.value = id;
    if (res.ok) {
      state.ok = true;
      list.mark(id, 'right');
      list.disable(true);
      // many authored `why`s already open with "Right:" / "Correct." — don't say it twice
      const w = whyOf(id);
      card.feedback.show('ok', md(w && /^\s*\**\s*(right|correct|yes|exactly)\b/i.test(w) ? w : ['**Right.**', w].filter(Boolean).join(' ')));
      card.setStatus('Correct', 'ok');
      save({ value: id, ok: true, results: { wrong: state.wrong }, tries: state.tries });
      offerSolution();
      finish(true);
    } else {
      if (!state.wrong.includes(id)) state.wrong.push(id);
      list.mark(id, 'wrong');
      list.disable(true, id);
      card.feedback.show('bad', md(whyOf(id) ?? 'Not that one. Try another.'));
      save({ value: id, ok: false, results: { wrong: state.wrong }, tries: state.tries });
      offerSolution();
    }
  }

  function doCheck() {
    if (state.ok) return;
    const value = list ? list.get() : input.get();
    if (emptyValue(spec, value)) {
      card.feedback.show('info', spec.type === 'multi' ? 'Pick at least one.' : 'Enter an answer first.', { animate: false });
      return;
    }
    const res = check(spec, value);
    record(res.ok);
    state.value = value;
    if (res.ok) {
      state.ok = true;
      if (list) {
        list.clearMarks();
        value.forEach((id) => list.mark(id, 'right'));
        list.disable(true);
      } else {
        input.mark(res);
        input.disable(true);
      }
      checkBtn.disabled = true;
      card.feedback.show('ok', md('**Right.**'));
      card.setStatus('Correct', 'ok');
      save({ value, ok: true, results: { ok: true }, tries: state.tries });
      offerSolution();
      finish(true);
      return;
    }
    let why = res.why;
    if (list) {
      const extra = value.find((id) => ![spec.value].flat().includes(id));
      why = [why, extra && whyOf(extra)].filter(Boolean).join(' ');
    } else input.mark(res);
    card.feedback.show('bad', md(why || 'Not quite. Try again.'));
    save({ value, ok: false, results: { ok: false, why: why || null, wrongAt: res.wrongAt ?? null }, tries: state.tries });
    offerSolution();
  }

  function reveal(live) {
    state.revealed = true;
    solBtn.hidden = true;
    sol.show({ animate: live });
    if (list) {
      const want = new Set([spec.value].flat());
      const picked = new Set([state.value].flat().filter(Boolean));
      if (spec.type === 'multi') {
        list.clearMarks();
        for (const c of choices) {
          if (want.has(c.id)) list.mark(c.id, picked.has(c.id) ? 'right' : 'missed');
          else if (picked.has(c.id)) list.mark(c.id, 'wrong');
        }
      } else {
        for (const id of want) list.mark(id, 'right');
      }
      list.disable(true);
    } else {
      input.disable(true);
    }
    checkBtn.disabled = true;
    if (!state.ok) card.setStatus('Solution shown', 'warn');
    if (live) save({ revealed: true });
    finish(live);
  }

  // ---- restore ----
  if (list && spec.type === 'choice') {
    for (const id of state.wrong) {
      list.mark(id, 'wrong');
      list.disable(true, id);
    }
  }
  if (saved.hint) showHint(false);
  if (state.ok) {
    if (list) {
      [state.value].flat().filter(Boolean).forEach((id) => list.mark(id, 'right'));
      list.disable(true);
    } else {
      input.mark({ ok: true });
      input.disable(true);
    }
    checkBtn.disabled = true;
    card.feedback.show('ok', md('**Right.** You answered this one.'), { animate: false });
    card.setStatus('Correct', 'ok');
    offerSolution();
    finish(false);
  } else if (state.tries > 0) {
    offerSolution();
    // the last check was wrong and nothing changed since (edits clear `results`): show it as checked
    if (!state.revealed && spec.type === 'choice' && state.wrong.length) {
      card.feedback.show('bad', md(whyOf(state.wrong.at(-1)) ?? 'Not that one. Try another.'), { animate: false });
    } else if (!state.revealed && saved.results?.ok === false) {
      input?.mark({ ok: false, wrongAt: saved.results.wrongAt ?? undefined });
      card.feedback.show('bad', md(saved.results.why || 'Not quite. Try again.'), { animate: false });
    }
  }
  if (state.revealed) reveal(false);

  const node = el('div', { class: 'ix-wrap' }, card.node);
  return { node, ready: ready.promise, destroy: () => card.destroy() };
}
