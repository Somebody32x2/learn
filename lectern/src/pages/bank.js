/**
 * #/bank: the problems the learner skipped ('Skip for now' on a workout → status 'banked') and the explain-back
 * checkpoints still open, grouped by lecture in course order.
 *
 *   renderBank(root, { course, store, bridge }) → { destroy() }
 *   bankItems(store, course?) → [{ kind, storeKey, key, lecture, beat, entry }]   the shared definition of
 *     "in the bank" (banked workouts; checkpoints deferred or mid-talk), used by home and the end card too
 *
 * Each item opens inline: the lecture module is loaded through its course entry's `load()`, the beat is found by
 * id and rendered with renderInterlude (ctx.inBank = true). A solved workout or passed checkpoint leaves the bank
 * with a short collapse; a revealed one offers 'Remove from bank'. Items of lectures not in the course (e.g. the
 * #/kit samples) are ignored. Re-renders when another tab or the tutor sync changes the store (while nothing is
 * open). Empty state links back to the course.
 */
import { el, reducedMotion } from '../core/dom.js';
import { md } from '../core/md.js';
import { renderInterlude } from '../interlude/index.js';
import { icon, button, KINDS } from '../interlude/common.js';

function ago(ms) {
  if (!ms) return '';
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : new Date(ms).toLocaleDateString();
}

const plain = (text, max = 160) => {
  // display math never fits a one-line row: replace it before cutting (an odd `$` count would leave math open)
  const s = String(text ?? '').replace(/\$\$[\s\S]*?\$\$/g, ' … ').replace(/\\\[[\s\S]*?\\\]/g, ' … ').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  let cut = s.slice(0, max);
  if ((cut.match(/\$/g) ?? []).length % 2) cut = cut.slice(0, cut.lastIndexOf('$'));
  return `${cut.trimEnd()}…`;
};

/**
 * Everything waiting in the bank, the one definition every count uses (course home, end card, this page):
 * workouts with status 'banked', and explain-back checkpoints the learner deferred ('remind me later') or left
 * mid-conversation ('talking'), unless passed. With `course`, items of lectures not in it are dropped.
 *   bankItems(store, course?) → [{ kind: 'workout'|'explain', storeKey, key, lecture, beat, entry }]
 */
export function bankItems(store, course = null) {
  const known = course ? new Set((course.units ?? []).flatMap((u) => (u.lectures ?? []).map((l) => l.id))) : null;
  const out = [];
  for (const [k, v] of store.entries('wo:')) if (v.status === 'banked') out.push({ kind: 'workout', storeKey: k, key: k.slice(3), entry: v });
  for (const [k, v] of store.entries('cp:')) if (v.status !== 'passed' && (v.later === true || v.status === 'talking')) out.push({ kind: 'explain', storeKey: k, key: k.slice(3), entry: v });
  return out
    .map((it) => {
      const slash = it.key.indexOf('/');
      return { ...it, lecture: it.key.slice(0, slash), beat: it.key.slice(slash + 1) };
    })
    .filter((it) => !known || known.has(it.lecture));
}

export function renderBank(root, { course, store, bridge = null }) {
  const lectures = new Map();
  (course.units ?? []).forEach((unit, ui) =>
    (unit.lectures ?? []).forEach((meta, li) => lectures.set(meta.id, { meta, unit: unit.title, order: ui * 1000 + li })),
  );
  const modules = new Map();
  const loadLecture = (id) => {
    if (!modules.has(id)) {
      const p = Promise.resolve()
        .then(() => lectures.get(id).meta.load())
        .then((m) => m.default ?? m);
      p.catch(() => modules.delete(id));
      modules.set(id, p);
    }
    return modules.get(id);
  };

  const rendered = new Map(); // store key → { destroy }
  const page = el('section', { class: 'ix-bank', 'aria-labelledby': 'ix-bank-title' });
  root.replaceChildren(page);

  const collect = () => bankItems(store, course);

  let countNode = null;
  /** Refreshes the count; `empty` false while an item is still collapsing (its animation must finish first). */
  const updateCount = (empty = true) => {
    const n = page.querySelectorAll('.ix-bank-item:not(.is-leaving)').length;
    if (countNode) countNode.textContent = n ? `${n} waiting` : '';
    if (!n && empty) showEmpty();
  };

  function showEmpty() {
    if (page.querySelector('.ix-bank-empty')) return;
    page.querySelectorAll('.ix-bank-group').forEach((g) => g.remove());
    page.append(
      el(
        'div',
        { class: 'ix-bank-empty' },
        icon('check', 'ix-bank-empty-icon'),
        el('p', { class: 'ix-md', html: md('**Nothing waiting.** When a worked problem is too much right now, choose *Skip for now* and it waits here. Open checkpoints show up here too.') }),
        el('a', { class: 'ix-btn ix-btn-ghost', href: '#/' }, el('span', { text: 'Back to the course' })),
      ),
    );
  }

  function render() {
    for (const r of rendered.values()) r.destroy?.();
    rendered.clear();
    countNode = el('span', { class: 'ix-bank-count' });
    page.replaceChildren(
      el('header', { class: 'ix-bank-head' }, el('h1', { id: 'ix-bank-title', class: 'ix-bank-title', text: 'Problem bank' }), countNode),
      el('p', { class: 'ix-bank-lead', text: 'Problems you set aside and checkpoints you postponed. Solve one and it leaves the bank.' }),
    );
    const items = collect();
    if (!items.length) return showEmpty();

    const groups = new Map();
    for (const it of items) {
      if (!groups.has(it.lecture)) groups.set(it.lecture, []);
      groups.get(it.lecture).push(it);
    }
    const ordered = [...groups.entries()].sort((a, b) => lectures.get(a[0]).order - lectures.get(b[0]).order);
    for (const [lectureId, list] of ordered) {
      const { meta, unit } = lectures.get(lectureId);
      // bankedAt (set once when banked) keeps order and "set aside" time stable while the learner types inside
      const since = (it) => it.entry.bankedAt ?? it.entry.at ?? 0;
      list.sort((a, b) => since(a) - since(b));
      const ul = el('ul', { class: 'ix-bank-list' });
      const group = el(
        'section',
        { class: 'ix-bank-group' },
        el('h2', { class: 'ix-bank-lecture' }, el('span', { text: meta.title }), unit ? el('span', { class: 'ix-bank-unit', text: [unit, meta.section].filter(Boolean).join(' · ') }) : null),
        ul,
      );
      page.append(group);
      const rows = list.map((it) => itemNode(it, meta));
      ul.append(...rows.map((r) => r.li));
      loadLecture(lectureId)
        .then((lecture) => rows.forEach((r) => r.fill(lecture)))
        .catch(() => rows.forEach((r) => r.fail()));
    }
    updateCount();
  }

  function itemNode(it, meta) {
    const panelId = `ix-bank-${it.key.replace(/\W+/g, '-')}`;
    const titleNode = el('span', { class: 'ix-bank-item-title', text: it.beat });
    const promptNode = el('span', { class: 'ix-bank-prompt' });
    const when = it.kind === 'workout' ? `Set aside ${ago(it.entry.bankedAt ?? it.entry.at)}` : it.entry.status === 'talking' ? 'Checkpoint in progress' : 'Open checkpoint';
    const row = el(
      'button',
      { type: 'button', class: 'ix-bank-row', 'aria-expanded': 'false', 'aria-controls': panelId },
      el('span', { class: 'ix-bank-kind' }, icon(it.kind)),
      el('span', { class: 'ix-bank-text' }, titleNode, promptNode, el('span', { class: 'ix-bank-meta', text: `${KINDS[it.kind].label} · ${when}` })),
      el('span', { class: 'ix-bank-chev', 'aria-hidden': 'true' }),
    );
    const inner = el('div', { class: 'ix-bank-inner' });
    // grid-rows 0fr → 1fr expand / collapse; `inert` keeps a closed panel out of tab order and the a11y tree
    const panel = el('div', { class: 'ix-bank-panel', id: panelId, inert: true }, el('div', { class: 'ix-bank-reveal' }, inner));
    const li = el('li', { class: 'ix-bank-item' }, el('div', { class: 'ix-bank-clip' }, row, panel));
    let lecture = null;
    let beat = null;
    let view = null;

    const fill = (lec) => {
      lecture = lec;
      beat = (lec.beats ?? []).find((b) => b.id === it.beat) ?? null;
      if (!beat) {
        titleNode.textContent = 'This problem is no longer in the lecture';
        return;
      }
      const generic = !beat.title || beat.title === KINDS[it.kind]?.label;
      titleNode.innerHTML = md(generic ? plain(beat.prompt, 90) : beat.title, { inline: true });
      promptNode.innerHTML = generic ? '' : md(plain(beat.prompt), { inline: true });
    };
    const fail = () => (titleNode.textContent = `${it.beat} (could not load the lecture)`);

    let opening = null;
    /** Renders the item once; concurrent calls share the in-flight load. */
    function open() {
      if (view) return Promise.resolve();
      opening ??= load().finally(() => (opening = null));
      return opening;
    }

    async function load() {
      inner.replaceChildren(el('div', { class: 'ix-bank-loading', text: 'Loading…' }));
      try {
        if (!lecture) fill(await loadLecture(it.lecture));
      } catch {
        inner.replaceChildren(el('p', { class: 'ix-bank-loading', text: 'Could not load this lecture. Check your connection and try again.' }));
        return;
      }
      if (view || !li.isConnected) return;
      if (!beat) {
        inner.replaceChildren(el('p', { class: 'ix-bank-loading', text: 'This problem was removed from the lecture.' }), button('Remove from bank', { variant: 'ghost', onclick: () => dismiss() }));
        return;
      }
      view = renderInterlude(beat, {
        store,
        course,
        lecture,
        beat,
        key: it.key,
        id: `${it.lecture}.${it.beat}`,
        bridge,
        inBank: true,
        onDone: () => settle(),
      });
      rendered.set(it.storeKey, view);
      inner.replaceChildren(view.node, el('a', { class: 'ix-bank-goto', href: `#/l/${encodeURIComponent(it.lecture)}/${encodeURIComponent(it.beat)}` }, `Open in “${meta.title}”`));
    }

    row.addEventListener('click', async () => {
      const expanded = row.getAttribute('aria-expanded') === 'true';
      row.setAttribute('aria-expanded', String(!expanded));
      li.classList.toggle('is-open', !expanded);
      panel.inert = expanded;
      if (!expanded) await open();
    });

    let doneBtn = null;
    function settle() {
      const now = store.get(it.storeKey) ?? {};
      if (it.kind === 'workout' ? now.status === 'solved' : now.status === 'passed') {
        setTimeout(() => leave(), reducedMotion() ? 600 : 1100);
      } else if (it.kind === 'workout' && now.status === 'revealed' && !doneBtn) {
        doneBtn = button('Remove from bank', { variant: 'ghost', icon: 'check', class: 'ix-bank-remove', onclick: () => leave() });
        inner.append(doneBtn);
      }
    }

    function dismiss() {
      store.put(it.storeKey, it.kind === 'workout' ? { status: 'revealed' } : { status: 'passed', later: false });
      leave();
    }

    function leave() {
      if (li.classList.contains('is-leaving')) return;
      const group = li.closest('.ix-bank-group');
      li.classList.add('is-leaving');
      let gone = false;
      const remove = () => {
        if (gone) return;
        gone = true;
        view?.destroy?.();
        rendered.delete(it.storeKey);
        li.remove();
        if (group && !group.querySelector('.ix-bank-item')) group.remove();
        updateCount();
      };
      li.addEventListener('transitionend', (e) => e.target === li && e.propertyName === 'grid-template-rows' && remove());
      setTimeout(remove, 450);
      updateCount(false);
    }

    return { li, fill, fail };
  }

  render();
  const off = store.onChange(() => {
    if (!page.isConnected) return off();
    if (!page.querySelector('.ix-bank-item.is-open')) render();
  });
  return {
    destroy() {
      off();
      for (const r of rendered.values()) r.destroy?.();
      rendered.clear();
    },
  };
}
