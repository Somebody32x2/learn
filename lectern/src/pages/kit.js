/**
 * #/kit: the authoring reference. Every demo scene from viz/demos.js in its own stage (Play / Step / Reset,
 * captions from each step's `say`), then every interlude sample from interlude/samples.js rendered with
 * renderInterlude. Samples use an in-memory store, so trying them never touches the learner's progress; the
 * tutor bridge is passed through, so private-mode paths can be tried under the tutor too.
 *
 *   renderKit(root, { course, store, bridge, shell }) → { destroy() }
 *
 * Demo shape (viz/demos-*.js): { title, scene(s) → refs, steps: [{ say, do(s, refs) }] }.
 */
import { el, reducedMotion } from '../core/dom.js';
import { Stage } from '../core/stage.js';
import { inlineMath } from '../core/mobject.js';
import demos from '../viz/demos.js';
import samples from '../interlude/samples.js';
import { renderInterlude } from '../interlude/index.js';
import { captionText } from '../player/narrator.js';
import { icon, KIND_LABEL } from '../player/controls.js';

/** The Store API kept in memory (kit samples only). */
class MemoryStore {
  constructor() {
    this.progress = {};
    this.seen = {};
    this.attempts = {};
    this.prefsData = {};
  }
  mark(id, ok) {
    if (this.progress[id] !== true) this.progress[id] = Boolean(ok);
  }
  correct(id) {
    return this.progress[id];
  }
  visit(id) {
    this.seen[id] = Date.now();
  }
  visited(id) {
    return this.seen[id];
  }
  get(key) {
    return this.attempts[key] ? { ...this.attempts[key] } : null;
  }
  put(key, patch) {
    this.attempts[key] = { ...this.attempts[key], ...patch, at: Date.now() };
    return { ...this.attempts[key] };
  }
  entries(prefix = '') {
    return Object.entries(this.attempts).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k, { ...v }]);
  }
  flush() {}
  onChange() {
    return () => {};
  }
  prefs() {
    return { ...this.prefsData };
  }
  setPrefs(patch) {
    Object.assign(this.prefsData, patch);
  }
}

function runDo(step, stage, refs) {
  try {
    const r = step?.do?.(stage, refs);
    return (Array.isArray(r) ? Promise.all(r) : Promise.resolve(r)).catch((err) => console.error(err));
  } catch (err) {
    console.error(err);
    return Promise.resolve();
  }
}

const slug = (s, i) => `kit-${i}-${String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

function demoCard(demo, i) {
  const host = el('div', { class: 'lx-kit-stage' });
  const caption = el('p', { class: 'caption', 'aria-live': 'polite' });
  const count = el('span', { class: 'count' });
  const playBtn = el('button', { class: 'lx-btn small', type: 'button', html: `${icon.play}<span>Play</span>` });
  const stepBtn = el('button', { class: 'lx-btn small ghost', type: 'button', html: `<span>Step</span>${icon.next}` });
  const resetBtn = el('button', { class: 'lx-btn small quiet', type: 'button', text: 'Reset' });
  const id = slug(demo.title, i);
  const node = el('figure', { class: 'lx-figure lx-kit-demo', id },
    el('h3', { class: 'fig-title', html: inlineMath(demo.title ?? `Demo ${i + 1}`) }),
    host,
    el('div', { class: 'player' }, caption, count),
    el('div', { class: 'lx-kit-actions' }, playBtn, stepBtn, resetBtn));

  const steps = demo.steps ?? [];
  const run = { stage: null, refs: {}, n: 0, busy: false, playing: false, gen: 0 };

  const paint = () => {
    const say = steps[run.n - 1]?.say ?? '';
    caption.innerHTML = inlineMath(captionText(say));
    count.textContent = `${run.n} / ${steps.length}`;
    playBtn.innerHTML = run.playing ? `${icon.pause}<span>Stop</span>` : `${icon.play}<span>${run.n >= steps.length && steps.length ? 'Replay' : 'Play'}</span>`;
  };

  const build = () => {
    run.gen++;
    run.playing = false;
    run.busy = false;
    run.stage?.destroy();
    run.stage = new Stage(host, { label: demo.title ?? 'Demo' });
    run.n = 0;
    try {
      run.refs = demo.scene?.(run.stage) ?? {};
    } catch (err) {
      console.error(`kit demo "${demo.title}" failed`, err);
      run.refs = {};
    }
    paint();
  };

  const step = async () => {
    if (!run.stage) build();
    if (run.busy) return run.stage.clock.finish();
    if (run.n >= steps.length) return;
    const gen = run.gen;
    run.busy = true;
    run.n++;
    paint();
    caption.innerHTML = inlineMath(captionText(steps[run.n - 1].say ?? ''));
    await runDo(steps[run.n - 1], run.stage, run.refs);
    if (gen !== run.gen) return;
    run.busy = false;
  };

  const play = async () => {
    if (run.playing) {
      run.playing = false;
      return paint();
    }
    if (!run.stage || run.n >= steps.length) build();
    const gen = run.gen;
    run.playing = true;
    paint();
    while (run.playing && gen === run.gen && run.n < steps.length) {
      await step();
      if (gen !== run.gen) return;
      await run.stage.wait(reducedMotion() ? 200 : 600);
    }
    if (gen !== run.gen) return;
    run.playing = false;
    paint();
  };

  playBtn.addEventListener('click', play);
  stepBtn.addEventListener('click', step);
  resetBtn.addEventListener('click', build);
  return { node, id, build: () => run.stage || build(), destroy: () => (run.gen++, run.stage?.destroy()) };
}

function sampleCard(beat, i, { course, bridge, store }) {
  const lecture = { id: 'kit', title: 'Kit' };
  const status = el('span', { class: 'lx-kit-ready', text: 'waiting' });
  let rendered = null;
  const ctx = {
    store,
    course,
    lecture,
    beat,
    key: `kit/${beat.id}`,
    id: `kit.${beat.id}`,
    bridge,
    onDone: () => (status.textContent = 'onDone()'),
    speak: () => Promise.resolve(false),
  };
  try {
    rendered = renderInterlude(beat, ctx);
  } catch (err) {
    console.error(`kit sample "${beat.id}" failed`, err);
  }
  rendered?.ready?.then(() => {
    status.textContent = status.textContent === 'onDone()' ? 'ready · onDone()' : 'ready';
    status.classList.add('ok');
  }, () => {});
  const type = beat.answer?.type ? ` · ${beat.answer.type}` : '';
  const id = slug(beat.title ?? beat.id, `s${i}`);
  const node = el('section', { class: 'lx-kit-sample', id },
    el('div', { class: 'lx-kit-sample-head' },
      el('span', { class: 'eyebrow', text: `${KIND_LABEL[beat.kind] ?? beat.kind}${type}` }),
      el('code', { text: beat.id }),
      status),
    rendered?.node ?? el('p', { class: 'lx-error', text: 'This sample could not be rendered.' }));
  return { node, id, destroy: () => rendered?.destroy?.() };
}

export function renderKit(root, { course, bridge }) {
  const store = new MemoryStore();
  const page = el('article', { class: 'page lx-kit' });
  root.append(page);

  const demoCards = demos.map((d, i) => demoCard(d, i));
  const sampleCards = samples.map((b, i) => sampleCard(b, i, { course, bridge, store }));

  const index = (title, cards, items) =>
    el('nav', { class: 'lx-kit-index', 'aria-label': title },
      el('p', { class: 'eyebrow', text: title }),
      el('ul', {}, cards.map((c, i) => {
        const b = el('button', { class: 'lx-kit-link', type: 'button', html: inlineMath(items[i]) });
        b.addEventListener('click', () => document.getElementById(c.id)?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' }));
        return el('li', {}, b);
      })));

  page.append(
    el('header', { class: 'lx-hero lx-kit-hero' },
      el('p', { class: 'eyebrow', text: 'Authoring kit' }),
      el('h1', { text: 'Every animation and exercise' }),
      el('p', { class: 'lede', text: `Each stage component with its animations, then one sample of every practice kind. ${bridge ? 'The tutor is connected, so private-mode buttons work here.' : 'Open this page under the tutor to try the private-mode buttons.'} Answers here are kept in memory only.` })),
    el('div', { class: 'lx-kit-indexes' },
      index('Animations', demoCards, demos.map((d, i) => d.title ?? `Demo ${i + 1}`)),
      index('Practice', sampleCards, samples.map((b) => {
        const kind = KIND_LABEL[b.kind] ?? b.kind;
        return `${kind}: ${b.title && b.title !== kind ? b.title : b.answer?.type ?? b.id}`;
      }))),
    el('section', { class: 'lx-kit-section' },
      el('h2', { text: 'Animations' }),
      demoCards.map((c) => c.node)),
    el('section', { class: 'lx-kit-section' },
      el('h2', { text: 'Practice' }),
      sampleCards.map((c) => c.node)));

  // Build each demo's stage when it first comes near the screen.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      demoCards.find((c) => c.node === e.target)?.build();
      io.unobserve(e.target);
    }
  }, { rootMargin: '400px 0px' });
  for (const c of demoCards) io.observe(c.node);

  return {
    destroy() {
      io.disconnect();
      for (const c of [...demoCards, ...sampleCards]) {
        try {
          c.destroy();
        } catch {}
      }
      page.remove();
    },
  };
}
