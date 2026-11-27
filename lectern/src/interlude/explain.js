/**
 * "Explain it back": a checkpoint where the learner explains an idea in their own words.
 *
 *   renderExplain(beat, ctx) → { node, ready, destroy }
 *
 * Public mode: a textarea ('Explain it in your own words', saved as typed), then 'Compare' reveals beat.points
 * as a checklist the learner ticks (self-check). Ticking every point, or 'Done comparing', passes it.
 * Private mode (ctx.bridge): 'Explain it to the tutor' starts bridge.explainBack(…); the card shows the live
 * status (sending / waiting / talking / busy / error) with an excerpt of the latest tutor reply and an
 * 'Open the chat' button (bridge.open()). Thread, since and reply persist, and watching resumes after a reload.
 * ready resolves only on 'passed' (a calm drawn check), or when the learner picks
 * 'I can't talk now — remind me later' (the checkpoint stays open and is listed in the bank).
 *
 * 'busy' (another reply is running) sets the status back to 'open', shows 'Try again' and retries once by itself
 * after BUSY_RETRY_MS. 'Try again' / a fresh start first clears thread/since/reply and sends without `saved`;
 * watching resumes (no resend) only when thread and since are stored. Typing never writes `status`.
 *
 * Store: `cp:<lecture>/<beat>` { status: 'open'|'talking'|'passed', text, thread, since, reply, later,
 * compared, checks: [bool] }. ctx.onDone() fires on live completion. ctx.inBank hides 'remind me later'.
 */
import { el, svg } from '../core/dom.js';
import { md } from '../core/md.js';
import { makeCard, button, setLabel, deferred, ids, revealIn, icon } from './common.js';

const LIVE = {
  sending: 'Opening the tutor chat…',
  waiting: 'The tutor is writing…',
  talking: 'Your turn: answer the tutor in the chat.',
  passed: 'Checkpoint passed.',
  busy: 'The tutor is busy with another reply \u2014 try again when it finishes.',
  error: 'The tutor could not be reached.',
};
/** Statuses in which the start / 'Try again' button shows. */
const START_VISIBLE = ['error', 'busy', 'open'];
/** One automatic retry after 'busy' (the bridge cannot report when the running reply ends). */
const BUSY_RETRY_MS = 20000;

/** Shortens a reply without cutting through $math$. */
function excerpt(text, max = 320) {
  let s = String(text ?? '').trim();
  if (s.length <= max) return s;
  s = s.slice(0, max);
  const space = s.lastIndexOf(' ');
  if (space > max * 0.6) s = s.slice(0, space);
  if ((s.match(/(?<!\\)\$/g) ?? []).length % 2) s = s.slice(0, s.lastIndexOf('$'));
  return `${s.trimEnd()}…`;
}

function passMark() {
  return svg(
    'svg',
    { class: 'ix-passmark', viewBox: '0 0 48 48', 'aria-hidden': 'true' },
    svg('circle', { class: 'ix-pass-ring', cx: 24, cy: 24, r: 21, pathLength: 1 }),
    svg('path', { class: 'ix-pass-check', d: 'M14.5 24.5l6.5 6.5 13-14', pathLength: 1 }),
  );
}

export function renderExplain(beat, ctx) {
  const I = ids(ctx, beat);
  const cpKey = `cp:${I.key}`;
  const bridge = ctx.bridge ?? null;
  const ready = deferred();
  let saved = ctx.store.get(cpKey) ?? {};
  let watch = null;
  let destroyed = false;
  let retryTimer = 0;
  let passedShown = false;

  const put = (patch) => (saved = { ...ctx.store.put(cpKey, patch) });
  /** Saves learner input. Never writes `status` (a 'passed' from another device must survive); only defaults it. */
  const draft = (patch) => {
    put(patch);
    if (!saved.status) put({ status: 'open' });
  };
  const finish = (live) => {
    ready.resolve();
    if (live) ctx.onDone?.();
  };

  const card = makeCard(beat, 'explain');
  const passBox = el('div', { class: 'ix-passed', hidden: true, role: 'status' });
  card.extra.append(passBox);

  /** The done state. `partial` (self-check with points left unticked): neutral 'Compared', not a green pass. */
  function showPassed(live, { title = 'Checkpoint passed', note, partial = null } = {}) {
    if (partial) card.setStatus(partial, 'warn');
    else card.setStatus('Passed', 'ok');
    card.node.classList.toggle('is-passed', !partial);
    passBox.classList.toggle('is-partial', !!partial);
    const text = note ?? (saved.reply ? excerpt(saved.reply) : '');
    const first = !passedShown;
    if (first || passBox.dataset.title !== title) {
      passedShown = true;
      passBox.dataset.title = title;
      passBox.replaceChildren(partial ? icon('check', 'ix-passmark') : passMark(), el('div', { class: 'ix-passed-text' }, el('strong', { text: title }), el('div', { class: 'ix-passed-note ix-md', html: text ? md(text) : '' })));
      passBox.hidden = false;
      passBox.classList.toggle('is-live', !!live);
    } else {
      const noteNode = passBox.querySelector('.ix-passed-note');
      if (noteNode && text) noteNode.innerHTML = md(text);
    }
    if (first) {
      later?.remove();
      finish(live);
    }
  }

  let later = null;
  const laterButton = () =>
    ctx.inBank
      ? null
      : (later = button('I can\u2019t talk now \u2014 remind me later', {
          variant: 'quiet',
          class: 'ix-later',
          onclick: () => {
            draft({ later: true });
            card.feedback.show('info', md('**Okay.** This checkpoint stays open in your bank; come back to it any time.'), { animate: false });
            card.setStatus('Open', 'warn');
            later.hidden = true;
            finish(true);
          },
        }));

  // ------------------------------------------------------------ public: write, then self-check
  function publicMode() {
    const id = `${I.key.replace(/\W+/g, '-')}-explain`;
    const area = el('textarea', { class: 'ix-in ix-area', id, rows: 6, placeholder: 'Write it as if explaining to a classmate. $…$ for math.' });
    area.value = saved.text ?? '';
    area.addEventListener('input', () => draft({ text: area.value }));
    card.body.append(el('label', { class: 'ix-label', for: id, text: 'Explain it in your own words' }), area);

    const points = [beat.points].flat().filter(Boolean);
    const list = el('div', { class: 'ix-rubric', hidden: true });
    card.extra.prepend(list);
    const compareBtn = button('Compare', { variant: 'primary', icon: 'eye', onclick: () => compare(true) });
    const doneBtn = button('Done comparing', { variant: 'ghost', icon: 'check', hidden: true, onclick: () => pass(true) });
    card.actions.append(compareBtn, doneBtn);

    const pass = (live) => {
      put({ status: 'passed' });
      doneBtn.hidden = true;
      const checks = saved.checks ?? [];
      const n = checks.filter(Boolean).length;
      const all = !points.length || n >= points.length;
      showPassed(live, {
        title: all ? 'Checkpoint done' : 'Compared',
        note: points.length ? `You covered ${n} of ${points.length} key ideas.` : '',
        partial: all ? null : `${n}/${points.length} ideas`,
      });
    };

    function compare(live) {
      if (live && !area.value.trim()) {
        card.feedback.show('info', 'Write a few sentences first: putting it in your own words is the point.', { animate: false });
        area.focus();
        return;
      }
      card.feedback.clear();
      if (live) draft({ compared: true, text: area.value });
      compareBtn.hidden = true;
      if (!points.length) return pass(live);
      const checks = Array.isArray(saved.checks) ? [...saved.checks] : points.map(() => false);
      const items = points.map((text, i) => {
        const box = el('input', { type: 'checkbox', class: 'ix-check' });
        box.checked = !!checks[i];
        box.addEventListener('change', () => {
          checks[i] = box.checked;
          put({ checks: [...checks] });
          // every point ticked passes; after 'Done comparing', each tick repaints the tally
          if (saved.status === 'passed' || checks.every(Boolean)) pass(true);
        });
        return el('label', { class: 'ix-checkitem' }, box, el('span', { class: 'ix-md', html: md(text, { inline: true }) }));
      });
      list.replaceChildren(el('div', { class: 'ix-label', text: 'A good explanation mentions…' }), ...items);
      list.hidden = false;
      revealIn(items, { animate: live });
      if (saved.status !== 'passed') doneBtn.hidden = false;
    }

    if (saved.compared || saved.status === 'passed') compare(false);
    if (saved.status === 'passed') pass(false);
  }

  // ------------------------------------------------------------ private: explain it to the tutor
  function privateMode() {
    const liveBox = el('div', { class: 'ix-live', hidden: true, 'aria-live': 'polite' });
    const startBtn = button('Explain it to the tutor', { variant: 'primary', icon: 'chat', onclick: () => start(false) });
    const openBtn = button('Open the chat', { variant: 'ghost', icon: 'chat', hidden: true, onclick: () => bridge.open() });
    card.body.append(liveBox);
    card.actions.append(...[startBtn, openBtn, laterButton()].filter(Boolean));
    let retried = false;

    const paint = (status, u = {}) => {
      liveBox.hidden = false;
      const pending = status === 'sending' || status === 'waiting';
      liveBox.className = `ix-live is-${status}`;
      const reply = u.reply || saved.reply;
      const text = status === 'error' && u.error ? `${LIVE.error} ${u.error}` : LIVE[status] ?? '';
      liveBox.replaceChildren(...[
        el('div', { class: 'ix-live-head' }, pending ? el('span', { class: 'ix-spinner', 'aria-hidden': 'true' }) : icon(status === 'error' || status === 'busy' ? 'info' : 'chat'), el('span', { text })),
        reply && status !== 'sending' && status !== 'busy' ? el('blockquote', { class: 'ix-reply ix-md', html: md(excerpt(reply)) }) : null,
      ].filter(Boolean));
      openBtn.hidden = status === 'sending' || status === 'busy';
      startBtn.hidden = !START_VISIBLE.includes(status);
      setLabel(startBtn, status === 'error' || status === 'busy' ? 'Try again' : 'Explain it to the tutor');
    };

    function onUpdate(u = {}) {
      // persist even after destroy(): the bridge hands over the sent mark once after stop(), so we never resend
      const hasMark = !!u.thread && u.since !== null && u.since !== undefined;
      const cur = ctx.store.get(cpKey) ?? {};
      const patch = {};
      if (hasMark) Object.assign(patch, { thread: u.thread, since: u.since });
      if (u.reply) patch.reply = u.reply;
      if (u.status === 'passed') patch.status = 'passed';
      else if (cur.status !== 'passed' && hasMark && (u.status === 'waiting' || u.status === 'talking')) patch.status = 'talking';
      else if (cur.status !== 'passed' && u.status === 'busy') patch.status = 'open';
      if (Object.keys(patch).length) put(patch);
      if (destroyed) return;
      if (u.status === 'passed' || saved.status === 'passed') {
        liveBox.hidden = true;
        startBtn.hidden = true;
        openBtn.hidden = false;
        showPassed(true);
        return;
      }
      if (!u.status) return;
      paint(u.status, u);
      if (u.status === 'talking') card.setStatus('Talking', 'info');
      if (u.status === 'busy') retryLater();
    }

    /** One automatic retry after a busy answer, once the running reply has likely finished. */
    function retryLater() {
      if (retried) return;
      retried = true;
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        if (!destroyed && card.node.isConnected && document.visibilityState === 'visible' && saved.status !== 'passed' && !saved.thread) start(false);
      }, BUSY_RETRY_MS);
    }

    /** resume: watch the saved thread without resending; otherwise a fresh send (the old mark is cleared first). */
    function start(resume) {
      watch?.stop?.();
      clearTimeout(retryTimer);
      if (!resume) put({ thread: null, since: null, reply: null });
      startBtn.hidden = true;
      paint(resume ? 'waiting' : 'sending');
      try {
        watch = bridge.explainBack({
          course: I.course,
          lecture: I.lecture,
          beat: I.beat,
          title: beat.title ?? '',
          prompt: beat.prompt ?? '',
          source: I.source,
          saved: resume ? ctx.store.get(cpKey) : undefined,
          onUpdate,
        });
      } catch (err) {
        paint('error', { error: err?.message ?? String(err) });
      }
    }

    if (saved.status === 'passed') {
      openBtn.hidden = false;
      startBtn.hidden = true;
      showPassed(false);
      return;
    }
    if (saved.later) {
      card.setStatus('Open', 'warn');
      if (later) later.hidden = true;
      finish(false);
    }
    // resume only with a known mark; 'talking' without one shows the start button instead of resending
    if (saved.thread && saved.since !== null && saved.since !== undefined) {
      if (saved.reply) paint('talking', { reply: saved.reply });
      start(true);
    }
  }

  if (bridge) privateMode();
  else publicMode();

  const node = el('div', { class: 'ix-wrap' }, card.node);
  return {
    node,
    ready: ready.promise,
    destroy() {
      destroyed = true;
      clearTimeout(retryTimer);
      watch?.stop?.();
      card.destroy();
    },
  };
}
