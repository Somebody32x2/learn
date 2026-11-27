/**
 * Course home (#/): hero (course code, title, blurb, badges), a Continue card, and the units with their
 * lecture rows (number, title, section, minutes, progress ring, status). Re-renders when the store changes in
 * another tab or through the tutor's sync.
 *
 *   renderHome(root, { course, store, bridge, shell }) → { destroy() }
 *   allLectures(course) → [{ ...entry, unit, unitIndex, number }]   every lecture in course order
 *
 * Progress per lecture comes from `pos:<lecture>` ({ beat, step, furthest, done, total, seen }, written by the
 * player; `seen` = beats actually played or answered, older entries without it fall back to `furthest`) and the
 * practice entries (`q:<lecture>/…` ok, `wo:<lecture>/…` solved now or ever). The bank badge counts
 * `bankItems(store)` from pages/bank.js, the same list the bank page shows.
 */
import { el } from '../core/dom.js';
import { inlineMath } from '../core/mobject.js';
import { icon } from '../player/controls.js';
import { bankItems } from './bank.js';

export function allLectures(course) {
  let number = 0;
  return (course.units ?? []).flatMap((unit, unitIndex) =>
    (unit.lectures ?? []).map((entry) => ({ ...entry, unit, unitIndex, number: ++number })));
}

/** { status: 'new'|'progress'|'done', frac, pos, solved } for one lecture. */
function progressOf(store, entry) {
  const pos = store.get(`pos:${entry.id}`);
  const solved =
    store.entries(`q:${entry.id}/`).filter(([, v]) => v?.ok).length +
    store.entries(`wo:${entry.id}/`).filter(([, v]) => v?.status === 'solved' || v?.everSolved).length;
  if (!pos) return { status: 'new', frac: 0, pos: null, solved };
  if (pos.done) return { status: 'done', frac: 1, pos, solved };
  const total = Math.max(1, pos.total ?? 1);
  const reached = Array.isArray(pos.seen) ? pos.seen.length : Math.max(pos.furthest ?? 0, pos.beat ?? 0);
  return { status: 'progress', frac: Math.min(0.96, Math.max(0.04, reached / total)), pos, solved };
}

const STATUS = { new: 'New', progress: 'In progress', done: 'Done' };

function ring(frac, status) {
  const r = 10;
  const c = 2 * Math.PI * r;
  const dash = `${(frac * c).toFixed(2)} ${c.toFixed(2)}`;
  return `<svg class="lx-ring" viewBox="0 0 24 24" aria-hidden="true"><circle class="lx-ring-track" cx="12" cy="12" r="${r}"/>${
    frac > 0 ? `<circle class="lx-ring-fill" cx="12" cy="12" r="${r}" stroke-dasharray="${dash}" transform="rotate(-90 12 12)"/>` : ''
  }${status === 'done' ? '<path class="lx-ring-check" d="M8 12.3l2.6 2.6L16.2 9.3"/>' : ''}</svg>`;
}

export function renderHome(root, { course, store, bridge, shell }) {
  const page = el('article', { class: 'page lx-home' });
  root.append(page);

  const paint = () => {
    const lectures = allLectures(course);
    const banked = bankItems(store, course).length;
    const progress = new Map(lectures.map((l) => [l.id, progressOf(store, l)]));
    const done = lectures.filter((l) => progress.get(l.id).status === 'done').length;

    shell?.setTop({
      actions: [
        el('a', { class: ['lx-pill', banked && 'has'], href: '#/bank', 'aria-label': `Problem bank, ${banked} waiting` },
          el('span', { text: 'Bank' }), el('span', { class: 'lx-badge-count', text: String(banked) })),
      ],
    });

    // Continue: the most recently touched lecture that is not finished.
    const latest = lectures
      .map((l) => ({ l, p: progress.get(l.id) }))
      .filter(({ p }) => p.pos && p.status !== 'done')
      .sort((a, b) => (b.p.pos.at ?? 0) - (a.p.pos.at ?? 0))[0];
    const nextNew = !latest && lectures.find((l) => progress.get(l.id).status !== 'done');

    let cont = null;
    const pick = latest?.l ?? nextNew;
    if (pick) {
      const p = progress.get(pick.id);
      const meta = latest
        ? [p.pos.title && `At ${p.pos.title}`, `${Math.round(p.frac * 100)}%`].filter(Boolean).join(' · ')
        : [pick.section, pick.minutes && `${pick.minutes} min`].filter(Boolean).join(' · ');
      cont = el('a', { class: 'lx-continue', href: `#/l/${encodeURIComponent(pick.id)}` },
        el('span', { class: 'lx-continue-text' },
          el('span', { class: 'eyebrow', text: latest ? 'Continue' : done ? 'Up next' : 'Start here' }),
          el('span', { class: 'lx-continue-title', html: inlineMath(pick.title) }),
          el('span', { class: 'lx-continue-meta', html: inlineMath(meta) })),
        el('span', { class: 'lx-ring-wrap', html: ring(p.frac, p.status) }),
        el('span', { class: 'lx-go', html: icon.arrow }));
    } else if (lectures.length && done === lectures.length) {
      // every lecture done: where to go from here
      cont = el('a', { class: 'lx-continue lx-complete', href: '#/bank' },
        el('span', { class: 'lx-continue-text' },
          el('span', { class: 'eyebrow', text: 'Course complete' }),
          el('span', { class: 'lx-continue-title', text: `All ${lectures.length} lectures done` }),
          el('span', { class: 'lx-continue-meta', text: banked ? `${banked} ${banked === 1 ? 'problem waits' : 'problems wait'} in your bank` : 'Open the bank to practise again' })),
        el('span', { class: 'lx-ring-wrap', html: ring(1, 'done') }),
        el('span', { class: 'lx-go', html: icon.arrow }));
    }

    // a returning learner sees Continue right under the title; a new one reads the blurb first
    const hero = el('header', { class: 'lx-hero' },
      el('p', { class: 'eyebrow', text: course.course ?? '' }),
      el('h1', { html: inlineMath(course.title) }),
      latest && cont,
      course.blurb && el('p', { class: 'lede', html: inlineMath(course.blurb) }),
      el('div', { class: 'lx-badges' },
        el('span', { class: 'lx-badge', text: `${done} of ${lectures.length} lectures done` }),
        el('a', { class: ['lx-badge', 'lx-badge-link', banked && 'has'], href: '#/bank' },
          el('span', { class: 'lx-badge-count', text: String(banked) }),
          el('span', { text: banked === 1 ? 'problem in the bank' : 'problems in the bank' })),
        bridge && el('span', { class: 'lx-badge lx-badge-tutor' }, el('span', { class: 'lx-dot', 'aria-hidden': 'true' }), 'Tutor connected')));
    if (latest) cont = null; // already placed in the hero

    const units = (course.units ?? []).map((unit, u) =>
      el('section', { class: 'lx-unit', 'aria-labelledby': `lx-unit-${u}` },
        el('div', { class: 'lx-unit-head' },
          el('p', { class: 'eyebrow', text: `Unit ${u + 1}` }),
          el('h2', { id: `lx-unit-${u}`, html: inlineMath(unit.title) })),
        el('ol', { class: 'lx-rows' },
          lectures.filter((l) => l.unitIndex === u).map((l) => {
            const p = progress.get(l.id);
            return el('li', {},
              el('a', { class: ['lx-row', `is-${p.status}`], href: `#/l/${encodeURIComponent(l.id)}` },
                el('span', { class: 'lx-row-num', text: String(l.number).padStart(2, '0') }),
                el('span', { class: 'lx-row-text' },
                  el('span', { class: 'lx-row-title', html: inlineMath(l.title) }),
                  l.summary && el('span', { class: 'lx-row-sub', html: inlineMath(l.summary) })),
                el('span', { class: 'lx-row-meta' },
                  [l.section, l.minutes && `${l.minutes} min`].filter(Boolean).join(' · '),
                  p.solved > 0 && el('span', { class: 'lx-row-solved', text: ` · ${p.solved} solved` })),
                el('span', { class: 'lx-row-status' },
                  el('span', { class: 'lx-ring-wrap', html: ring(p.frac, p.status) }),
                  el('span', { class: 'lx-status-text', text: STATUS[p.status] }))));
          }))));

    const foot = el('footer', { class: 'lx-foot' },
      el('a', { href: '../', text: 'All subjects' }));

    page.replaceChildren(...[hero, cont, ...units, foot].filter(Boolean));
  };

  paint();
  const off = store.onChange(() => paint());
  return {
    destroy() {
      off?.();
      page.remove();
    },
  };
}
