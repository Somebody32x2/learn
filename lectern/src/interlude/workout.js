/**
 * "Work it out": a real problem, done on paper, answered here.
 *
 *   renderWorkout(beat, ctx) → { node, ready, destroy }
 *
 * Answer input per beat.answer.type: matrix (grid; ± rows/cols when `free`), vector, number, text, set, choice,
 * multi, solution (particular + direction vectors), basis/span (a growable list of vectors), proof (a large
 * textarea with a math preview, then 'Compare with a model proof' shows the solution and the `rubric` as a
 * self-check). An optional 'Show your work' textarea previews $math$ live.
 *
 * Buttons: Check answer · Hint (one at a time) · Show solution · Skip for now (status 'banked': it waits in the
 * bank, ready resolves) · New numbers (when beat.generate exists: a variant from rng(seed), seed stored).
 * With ctx.bridge (private tutor): Have the tutor grade it (bridge.grade; the main path for proofs) and
 * Help me through it (bridge.help, which opens the tutor panel).
 *
 * Store: `wo:<lecture>/<beat>` { status: 'open'|'solved'|'banked'|'revealed', answer, work, hintsShown, verdict,
 * feedback, seed, rubric: [bool], tries, grading, thread, since, everSolved, bankedAt, lastCheck: { ok, why,
 * wrongAt } (cleared by editing the answer; a wrong one is shown again after a reload) }.
 * Progress: store.mark(id, ok) on each check (true sticks), false when the solution is revealed unsolved,
 * true/false from a tutor verdict. ready: solved, revealed, banked (also when restored in that state).
 * ctx.onDone() fires on every live completion (solved, revealed, banked). ctx.inBank and ctx.inLecture hide
 * 'Skip for now' (in a lecture the player's gate offers banking). `everSolved: true` is set on solving and survives
 * 'New numbers', so solved counts never go down. Tutor replies and hints render above the buttons and scroll into
 * view; while grading, the grade button shows a spinner and 'Grading…'.
 * Typing saves drafts that never write `status` (only default it to 'open'), so a 'solved' from another device
 * survives.
 *
 * Grading: bridge.grade gets an AbortSignal (aborted by destroy() / New numbers); thread/since from its updates are
 * stored even after leaving, and with `grading` still set the next render polls the optional extension
 * `bridge.lastReplyAfter({ thread, since })` (every 4 s, up to 30 times) until the reply is done.
 */
import { check } from '../core/answer.js';
import { el, nextId, reducedMotion } from '../core/dom.js';
import { md } from '../core/md.js';
import { rng } from '../core/hash.js';
import { makeCard, button, setLabel, hintView, solutionView, answerInput, emptyValue, responseText, answerMd, deferred, ids, revealIn } from './common.js';

const VERDICT = {
  correct: { label: 'Correct', tone: 'ok' },
  partial: { label: 'Partly there', tone: 'warn' },
  incorrect: { label: 'Not yet', tone: 'bad' },
};
const PROGRESS = {
  sending: 'Sending your work to the tutor…',
  waiting: 'The tutor is reading your work…',
  talking: 'The tutor is writing feedback…',
  grading: 'The tutor is grading…',
  busy: 'The tutor is busy with another message; it will get to this next.',
};

export function renderWorkout(beat, ctx) {
  const I = ids(ctx, beat);
  const woKey = `wo:${I.key}`;
  const bridge = ctx.bridge ?? null;
  const ready = deferred();
  const node = el('div', { class: 'ix-wrap' });
  let saved = ctx.store.get(woKey) ?? {};
  let current = null; // { card, destroy() }
  let destroyed = false;

  const put = (patch) => (saved = { ...ctx.store.put(woKey, patch) });
  /** Saves what the learner typed. Never writes `status` (another device may have solved it); only defaults it. */
  const draft = (patch) => {
    put(patch);
    if (!saved.status) put({ status: 'open' });
  };
  const finish = (live) => {
    ready.resolve();
    if (live) ctx.onDone?.();
  };

  const problem = () => {
    if (typeof beat.generate !== 'function' || saved.seed === undefined || saved.seed === null) return beat;
    try {
      return { ...beat, ...beat.generate(rng(saved.seed)) };
    } catch (err) {
      console.error('lectern: workout generate failed', err);
      return beat;
    }
  };

  function build(focusNew = false) {
    current?.destroy();
    const p = problem();
    const spec = p.answer ?? { type: 'proof' };
    const proof = spec.type === 'proof';
    const card = makeCard(p, 'workout', { prompt: p.prompt });
    const cleanups = [() => card.destroy()];
    let pollTimer = 0;
    let gradeCtl = null;
    cleanups.push(() => clearTimeout(pollTimer), () => gradeCtl?.abort());

    const hints = hintView(p.hints ?? (p.hint ? [p.hint] : []));
    const sol = solutionView({ steps: p.solution, answer: answerMd(spec, p.choices ?? []), label: proof ? 'A model proof' : 'Solution' });
    const rubricBox = el('div', { class: 'ix-rubric', hidden: true });
    const tutorBox = el('div', { class: 'ix-tutor', hidden: true, 'aria-live': 'polite' });

    // ---- answer ----
    let input = null;
    let proofArea = null;
    if (proof) {
      const id = nextId('ix-proof');
      proofArea = el('textarea', { class: 'ix-in ix-area ix-proof', id, rows: 10, placeholder: 'Write your proof. Use $…$ for math, e.g. $n = 2k + 1$.', spellcheck: 'true' });
      proofArea.value = typeof saved.answer === 'string' ? saved.answer : '';
      const preview = livePreview(proofArea, 'Preview');
      card.body.append(el('label', { class: 'ix-label', for: id, text: 'Your proof' }), proofArea, preview);
      proofArea.addEventListener('input', () => draft({ answer: proofArea.value }));
    } else {
      input = answerInput(spec, {
        value: saved.answer ?? undefined,
        choices: p.choices ?? [],
        label: 'Your answer',
        onChange: (v) => {
          card.feedback.clear();
          draft({ answer: v, lastCheck: null });
        },
        onSubmit: () => doCheck(),
      });
      card.body.append(el('div', { class: 'ix-label', text: 'Your answer' }), input.node);
    }

    // ---- show your work (optional) ----
    let workArea = null;
    if (!proof) {
      const id = nextId('ix-work');
      workArea = el('textarea', { class: 'ix-in ix-area ix-work', id, rows: 4, placeholder: 'Row operations, steps, reasoning… $…$ for math.' });
      workArea.value = saved.work ?? '';
      const preview = livePreview(workArea, 'Preview');
      const workBox = el('div', { class: 'ix-workbox', hidden: !saved.work }, el('label', { class: 'ix-label', for: id, text: 'Your work' }), workArea, preview);
      const toggle = button(saved.work ? 'Hide your work' : 'Show your work', {
        variant: 'quiet',
        class: 'ix-worktoggle',
        'aria-expanded': String(!!saved.work),
        onclick: () => {
          workBox.hidden = !workBox.hidden;
          toggle.setAttribute('aria-expanded', String(!workBox.hidden));
          setLabel(toggle, workBox.hidden ? 'Show your work' : 'Hide your work');
          if (!workBox.hidden) {
            revealIn(workBox);
            workArea.focus();
          }
        },
      });
      workArea.addEventListener('input', () => draft({ work: workArea.value }));
      card.body.append(toggle, workBox);
    }

    // ---- buttons ----
    const checkBtn = !proof ? button('Check answer', { variant: 'primary', icon: 'check', onclick: () => doCheck() }) : null;
    const gradeBtn = bridge ? button('Have the tutor grade it', { variant: proof ? 'primary' : 'ghost', icon: 'spark', onclick: () => grade() }) : null;
    const compareBtn = proof ? button('Compare with a model proof', { variant: bridge ? 'ghost' : 'primary', icon: 'eye', onclick: () => reveal(true) }) : null;
    const hintBtn = hints.count ? button('Hint', { variant: 'ghost', icon: 'hint', onclick: () => showHints((saved.hintsShown ?? 0) + 1, true) }) : null;
    const helpBtn = bridge ? button('Help me through it', { variant: 'ghost', icon: 'chat', onclick: () => help() }) : null;
    const solBtn = !proof && p.solution ? button('Show solution', { variant: 'quiet', icon: 'eye', onclick: () => reveal(true) }) : null;
    // the lecture's own gate offers 'Bank it, go on' (ctx.inLecture); the bank page needs no skip at all
    const skipBtn = !ctx.inBank && !ctx.inLecture ? button('Skip for now', { variant: 'quiet', icon: 'skip', onclick: () => bank() }) : null;
    const newBtn = typeof beat.generate === 'function' ? button('New numbers', { variant: 'quiet', icon: 'dice', onclick: () => newNumbers() }) : null;
    card.actions.append(
      el('div', { class: 'ix-actions-main' }, checkBtn, proof ? gradeBtn : null, compareBtn, hintBtn),
      el('div', { class: 'ix-actions-more' }, !proof ? gradeBtn : null, helpBtn, solBtn, newBtn, skipBtn),
    );
    // responses sit right above the buttons that asked for them (below them they land off-screen on phones)
    card.actions.before(tutorBox, hints.node);
    card.extra.append(sol.node, rubricBox);
    /** Brings a fresh response into view, clear of the control bar (scroll-margin in CSS). */
    const reveal_ = (node) => node.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    const setGrading = (on) => {
      if (!gradeBtn) return;
      gradeBtn.disabled = on;
      gradeBtn.classList.toggle('is-busy', on);
      gradeBtn.querySelector('.ix-spinner')?.remove();
      if (on) gradeBtn.prepend(el('span', { class: 'ix-spinner', 'aria-hidden': 'true' }));
      setLabel(gradeBtn, on ? 'Grading…' : 'Have the tutor grade it');
    };

    // ---- state painting ----
    const paintStatus = () => {
      const s = saved.status;
      if (s === 'solved') card.setStatus('Solved', 'ok');
      else if (s === 'banked') card.setStatus('In your bank', 'warn');
      else if (s === 'revealed') card.setStatus('Solution shown', 'warn');
      else card.setStatus('');
      if (skipBtn) skipBtn.hidden = s === 'banked' || s === 'solved' || s === 'revealed';
    };
    const lock = () => {
      input?.disable(true);
      if (checkBtn) checkBtn.disabled = true;
    };

    function showHints(n, live) {
      n = Math.min(n, hints.count);
      hints.show(n, { animate: live });
      if (live) {
        draft({ hintsShown: n });
        const last = hints.node.lastElementChild;
        if (last) reveal_(last);
      }
      if (hintBtn) {
        hintBtn.hidden = n >= hints.count;
        setLabel(hintBtn, n ? `Another hint (${n + 1} of ${hints.count})` : 'Hint');
      }
    }

    function solved(live, message = '**Correct.**') {
      const wasBanked = saved.status === 'banked';
      ctx.store.mark(I.id, true);
      put({ status: 'solved', everSolved: true });
      lock();
      card.feedback.show('ok', md(wasBanked && live ? `${message} It leaves your bank.` : message), { animate: live });
      paintStatus();
      if (solBtn) setLabel(solBtn, 'Worked solution');
      finish(live);
    }

    function doCheck() {
      if (saved.status === 'solved') return;
      const value = input.get();
      if (emptyValue(spec, value)) {
        card.feedback.show('info', 'Enter your answer first.', { animate: false });
        return;
      }
      const res = check(spec, value);
      input.mark(res);
      draft({ answer: value, tries: (saved.tries ?? 0) + 1, lastCheck: { ok: !!res.ok, why: res.why ?? null, wrongAt: res.wrongAt ?? null } });
      if (res.ok) return solved(true);
      ctx.store.mark(I.id, false);
      card.feedback.show('bad', md(res.why ?? 'Not yet. Check your work and try again.'));
    }

    function reveal(live) {
      if (live && saved.status !== 'solved') {
        ctx.store.mark(I.id, false);
        put({ status: 'revealed', revealed: true });
      } else if (live) put({ revealed: true });
      sol.show({ animate: live });
      if (solBtn) solBtn.hidden = true;
      if (compareBtn) compareBtn.hidden = true;
      if (proof) showRubric(live);
      else lock();
      paintStatus();
      finish(live);
    }

    function showRubric(live) {
      const items = [p.rubric].flat().filter(Boolean);
      if (!items.length) return;
      const checks = Array.isArray(saved.rubric) ? [...saved.rubric] : items.map(() => false);
      const boxes = items.map((text, i) => {
        const box = el('input', { type: 'checkbox', class: 'ix-check' });
        box.checked = !!checks[i];
        box.addEventListener('change', () => {
          checks[i] = box.checked;
          put({ rubric: [...checks] });
          if (checks.every(Boolean) && saved.status !== 'solved') solved(true, '**Every point covered.** Nicely done.');
        });
        return el('label', { class: 'ix-checkitem' }, box, el('span', { class: 'ix-md', html: md(text, { inline: true }) }));
      });
      rubricBox.replaceChildren(el('div', { class: 'ix-label', text: 'Check your proof: does it…' }), ...boxes);
      rubricBox.hidden = false;
      revealIn(boxes, { animate: live });
    }

    function bank() {
      put({ status: 'banked', bankedAt: Date.now(), answer: input ? input.get() : proofArea.value });
      paintStatus();
      card.feedback.show('info', md('**Saved to your bank.** Come back to it from the course page whenever you are ready.'));
      finish(true);
    }

    function newNumbers() {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const keep = saved.status === 'banked' ? 'banked' : 'open';
      // everSolved survives new numbers: the solved count never goes down
      put({ seed, answer: null, work: '', hintsShown: 0, verdict: null, feedback: null, rubric: null, revealed: false, grading: false, tries: 0, lastCheck: null, status: keep, everSolved: saved.everSolved === true || saved.status === 'solved' });
      build(true);
    }

    // ---- tutor ----
    const showProgress = (status, live = true) => {
      tutorBox.hidden = false;
      tutorBox.className = 'ix-tutor is-pending';
      tutorBox.replaceChildren(el('span', { class: 'ix-spinner', 'aria-hidden': 'true' }), el('span', { text: PROGRESS[status] ?? PROGRESS.grading }));
      if (live) reveal_(tutorBox);
    };
    const showVerdict = (verdict, feedback, live) => {
      const v = VERDICT[verdict];
      tutorBox.hidden = false;
      tutorBox.className = `ix-tutor is-${v?.tone ?? 'info'}`;
      tutorBox.replaceChildren(...[
        el('div', { class: 'ix-tutor-head' }, el('span', { class: 'ix-label', text: 'Tutor' }), v ? el('span', { class: `ix-verdict is-${v.tone}`, text: v.label }) : null),
        feedback ? el('div', { class: 'ix-tutor-text ix-md', html: md(feedback) }) : null,
      ].filter(Boolean));
      if (live) {
        revealIn(tutorBox);
        reveal_(tutorBox);
      }
    };
    const showError = (message) => {
      tutorBox.hidden = false;
      tutorBox.className = 'ix-tutor is-bad';
      tutorBox.replaceChildren(el('div', { class: 'ix-tutor-text ix-md', html: md(`The tutor could not grade this right now${message ? `: ${message}` : '.'} Try again in a moment.`) }));
    };
    const applyGrade = (res, live) => {
      setGrading(false);
      if (res?.verdict && VERDICT[res.verdict]) {
        put({ verdict: res.verdict, feedback: res.feedback ?? '', grading: false });
        showVerdict(res.verdict, res.feedback, live);
        if (res.verdict === 'correct' && saved.status !== 'solved') solved(live, '**The tutor marked it correct.**');
        else if (res.verdict !== 'correct' && saved.status !== 'solved') ctx.store.mark(I.id, false);
      } else {
        put({ grading: false });
        if (res?.feedback) showVerdict(null, res.feedback, live);
        else showError(res?.error);
      }
    };

    async function grade() {
      const value = proof ? proofArea.value : input.get();
      if (emptyValue(proof ? { type: 'text' } : spec, value)) {
        card.feedback.show('info', proof ? 'Write your proof first.' : 'Enter your answer first.', { animate: false });
        return;
      }
      setGrading(true);
      card.feedback.clear();
      showProgress('sending');
      draft({ answer: value, grading: true, verdict: null, feedback: null, thread: null, since: null });
      const reference = {
        answer: proof ? '' : answerMd(spec, p.choices ?? []),
        solution: [p.solution].flat().filter(Boolean),
        rubric: [p.rubric].flat().filter(Boolean),
      };
      let res;
      gradeCtl?.abort();
      const ctl = (gradeCtl = new AbortController());
      try {
        res = await bridge.grade({
          course: I.course,
          lecture: I.lecture,
          beat: I.beat,
          title: p.title ?? '',
          prompt: p.prompt ?? '',
          answer: proof ? value : responseText(spec, value, p.choices ?? []),
          work: workArea ? workArea.value : '',
          reference,
          source: I.source,
          signal: ctl.signal,
          onUpdate: (u) => {
            // keep the mark even after leaving the page: a reload recovers the verdict from it
            if (u?.thread || (u?.since !== undefined && u?.since !== null)) put({ thread: u.thread ?? saved.thread, since: u.since ?? saved.since });
            if (destroyed || ctl.signal.aborted || current?.card !== card) return;
            if (u?.status && u.status !== 'error') showProgress(u.status, false);
          },
        });
      } catch (err) {
        res = { verdict: null, error: err?.message ?? String(err) };
      }
      if (gradeCtl === ctl) gradeCtl = null;
      // left the page or took new numbers: keep `grading` so the next visit picks the reply up
      if (destroyed || ctl.signal.aborted || current?.card !== card) return;
      applyGrade(res, true);
    }

    function resumeGrade(tries = 0) {
      if (typeof bridge?.lastReplyAfter !== 'function' || !saved.thread) {
        put({ grading: false });
        setGrading(false);
        return;
      }
      const giveUp = () => {
        put({ grading: false });
        tutorBox.hidden = true;
        setGrading(false);
      };
      const again = () => {
        if (tries < 30) pollTimer = setTimeout(() => resumeGrade(tries + 1), 4000);
        else giveUp();
      };
      showProgress('waiting', false);
      setGrading(true);
      bridge
        .lastReplyAfter({ thread: saved.thread, since: saved.since })
        .then((r) => {
          if (destroyed || current?.card !== card) return;
          if (r?.done) applyGrade(r, false);
          else again(); // { done: false } (still writing) or null (no reply yet / unreachable)
        })
        .catch(() => {
          if (!destroyed && current?.card === card) again();
        });
    }

    async function help() {
      helpBtn.disabled = true;
      const value = proof ? proofArea.value : input.get();
      const started = !emptyValue(proof ? { type: 'text' } : spec, value);
      const answerText = started ? (proof ? value : responseText(spec, value, p.choices ?? [])) : '';
      const work = [workArea?.value, answerText && `My answer so far: ${answerText}`].filter(Boolean).join('\n\n');
      try {
        const r = await bridge.help({ course: I.course, lecture: I.lecture, beat: I.beat, title: p.title ?? '', prompt: p.prompt ?? '', work, source: I.source });
        if (r && r.ok === false) card.feedback.show('info', md(`The tutor is not available right now${r.error ? `: ${r.error}` : '.'}`), { animate: false });
      } catch (err) {
        card.feedback.show('info', md(`The tutor is not available right now: ${err?.message ?? err}`), { animate: false });
      } finally {
        helpBtn.disabled = false;
      }
    }

    // ---- restore ----
    showHints(saved.hintsShown ?? 0, false);
    if (saved.verdict) showVerdict(saved.verdict, saved.feedback, false);
    if (saved.status === 'solved') {
      lock();
      if (input) input.mark({ ok: true });
      card.feedback.show('ok', md('**Solved.**'), { animate: false });
      if (solBtn) setLabel(solBtn, 'Worked solution');
    }
    if (saved.revealed || saved.status === 'revealed') reveal(false);
    else if (saved.status !== 'solved' && saved.lastCheck?.ok === false && input) {
      // the last check was wrong and the answer is unchanged since (editing clears lastCheck)
      input.mark({ ok: false, wrongAt: saved.lastCheck.wrongAt ?? undefined });
      card.feedback.show('bad', md(saved.lastCheck.why ?? 'Not yet. Check your work and try again.'), { animate: false });
    }
    paintStatus();
    if (['solved', 'revealed', 'banked'].includes(saved.status)) finish(false);
    if (saved.grading && bridge) resumeGrade();

    node.replaceChildren(card.node);
    current = { card, destroy: () => cleanups.forEach((fn) => fn()) };
    if (focusNew && newBtn) newBtn.focus();
  }

  build();
  return {
    node,
    ready: ready.promise,
    destroy() {
      destroyed = true;
      current?.destroy();
    },
  };
}

/** A live Markdown + math preview under a textarea (shown once the text has math or markup). */
function livePreview(area, label) {
  const body = el('div', { class: 'ix-preview-body ix-md' });
  const box = el('div', { class: 'ix-preview', hidden: true, 'aria-hidden': 'true' }, el('div', { class: 'ix-label', text: label }), body);
  let raf = 0;
  const paint = () => {
    raf = 0;
    const text = area.value;
    const show = /[$*`\\]/.test(text) && text.trim().length > 0;
    box.hidden = !show;
    if (show) body.innerHTML = md(text);
  };
  area.addEventListener('input', () => {
    if (!raf) raf = requestAnimationFrame(paint);
  });
  paint();
  return box;
}
