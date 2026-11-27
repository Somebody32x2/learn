/**
 * Interludes: the practice breaks between slides.
 *
 *   renderInterlude(beat, ctx) → { node, ready: Promise<void>, destroy() }
 *
 * Dispatches on beat.kind: 'try' (try.js), 'blanks' (blanks.js), 'workout' (workout.js), 'explain' (explain.js).
 * ctx = { store, course, lecture, beat, key, id, bridge, onDone(), speak?, inBank?, inLecture? } as in CONTRACT.md
 * (course / lecture may be objects or id strings; key and id are derived when missing).
 * `ready` resolves when the learner may continue; `destroy()` (optional to call) stops tutor watchers and
 * releases the figure stage when the interlude leaves the page.
 *
 *   INTERLUDE_KINDS   the kinds this module renders
 */
import { el } from '../core/dom.js';
import { renderTry } from './try.js';
import { renderBlanks } from './blanks.js';
import { renderWorkout } from './workout.js';
import { renderExplain } from './explain.js';
import { makeCard } from './common.js';

const RENDERERS = { try: renderTry, blanks: renderBlanks, workout: renderWorkout, explain: renderExplain };
export const INTERLUDE_KINDS = Object.keys(RENDERERS);

export function renderInterlude(beat, ctx = {}) {
  const lecture = typeof ctx.lecture === 'string' ? ctx.lecture : ctx.lecture?.id ?? 'lecture';
  const full = { bridge: null, ...ctx, beat, key: ctx.key ?? `${lecture}/${beat.id}`, id: ctx.id ?? `${lecture}.${beat.id}` };
  const render = RENDERERS[beat.kind];
  if (!render) {
    const card = makeCard(beat, beat.kind);
    card.feedback.show('bad', `Unknown interlude kind “${String(beat.kind)}”.`, { animate: false });
    return { node: el('div', { class: 'ix-wrap' }, card.node), ready: Promise.resolve(), destroy: () => card.destroy() };
  }
  const out = render(beat, full);
  return { node: out.node, ready: out.ready, destroy: out.destroy ?? (() => {}) };
}
