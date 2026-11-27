/**
 * A subject's single-page app: `boot(course)` from the subject's index.html.
 *
 *   boot(course) → Promise<void>
 *
 * Waits for KaTeX (deferred script) and the web fonts, opens the course Store, asks for the tutor bridge
 * (null on the public site), builds the shell (top bar with the hub link `../` and the course, `<main>`), then
 * routes on the hash:
 *   #/                    course home (pages/home.js)
 *   #/l/<lecture>[/<beat>] lecture player (player/player.js); a beat change inside the same lecture reuses it
 *   #/bank                problem bank (pages/bank.js)
 *   #/kit                 authoring kit (pages/kit.js, loaded on demand, not linked)
 *   #/audit[/<lecture>]   layout audit for authors (pages/audit.js, on demand, not linked; report in window.__audit)
 * Each page renders into <main> and returns something with an optional destroy(); document.title follows.
 *
 * Shell API handed to pages as `shell`: setTop({ back: { href, label }?, title?, actions?: Node[] }).
 */
import './viz/index.js';
import { el, sleep } from './core/dom.js';
import { inlineMath } from './core/mobject.js';
import { Store } from './progress/store.js';
import { getBridge } from './tutor/detect.js';
import { renderHome, allLectures } from './pages/home.js';
import { renderBank } from './pages/bank.js';
import { LecturePlayer } from './player/player.js';
import { icon } from './player/controls.js';

async function ready() {
  const t0 = performance.now();
  while (!globalThis.katex && performance.now() - t0 < 5000) await sleep(25);
  try {
    await Promise.race([document.fonts?.ready, sleep(2500)]);
  } catch {}
}

function parse(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  if (parts[0] === 'l' && parts[1]) return { kind: 'lecture', id: parts[1], beat: parts[2] ?? null };
  if (parts[0] === 'bank') return { kind: 'bank' };
  if (parts[0] === 'kit') return { kind: 'kit' };
  if (parts[0] === 'audit') return { kind: 'audit', id: parts[1] ?? null };
  return { kind: 'home' };
}

export async function boot(course) {
  const app = document.getElementById('app') ?? document.body.appendChild(el('div', { id: 'app' }));
  app.replaceChildren(el('p', { class: 'lx-loading lx-boot', text: 'Loading…' }));
  await ready();
  const store = new Store(course.slug);
  let bridge = null;
  try {
    bridge = await getBridge();
  } catch (err) {
    console.error(err);
  }
  document.documentElement.classList.toggle('lx-private', Boolean(bridge));

  // ---------- shell ----------
  const back = el('a', { class: 'lx-back', href: '../' });
  const title = el('span', { class: 'lx-top-title' });
  const actions = el('div', { class: 'lx-top-actions' });
  const top = el('header', { class: 'lx-top' }, el('div', { class: 'lx-top-inner' }, back, title, actions));
  const main = el('main', { class: 'lx-main', id: 'lx-main', tabindex: '-1' });
  app.replaceChildren(top, main);

  const shell = {
    setTop({ back: to = null, title: text = '', actions: nodes = [] } = {}) {
      const target = to ?? { href: '../', label: 'Learn' };
      back.href = target.href;
      back.innerHTML = `${icon.back}<span>${inlineMath(target.label)}</span>`;
      back.setAttribute('aria-label', `Back to ${target.label.replace(/\$/g, '')}`);
      title.innerHTML = text ? inlineMath(text) : '';
      actions.replaceChildren(...nodes);
    },
  };

  // ---------- router ----------
  const lectures = allLectures(course);
  let current = null; // { kind, id?, page }
  let token = 0;

  async function route() {
    const r = parse(location.hash);
    if (r.kind === 'lecture' && current?.kind === 'lecture' && current.id === r.id && current.page) {
      current.page.openBeat(r.beat);
      return;
    }
    const my = ++token;
    try {
      current?.page?.destroy?.();
    } catch (err) {
      console.error(err);
    }
    current = null;
    main.replaceChildren();
    shell.setTop({});
    window.scrollTo(0, 0);

    let page = null;
    if (r.kind === 'lecture') {
      const i = lectures.findIndex((l) => l.id === r.id);
      if (i < 0) {
        history.replaceState(history.state, '', '#/');
        return route();
      }
      const entry = lectures[i];
      document.title = `${entry.title.replace(/\$/g, '')} · ${course.title}`;
      shell.setTop({ back: { href: '#/', label: course.title }, title: entry.title });
      page = new LecturePlayer(main, { course, entry, next: lectures[i + 1] ?? null, store, bridge, shell });
      current = { kind: 'lecture', id: r.id, page };
      await page.mount(r.beat);
      return;
    }
    if (r.kind === 'bank') {
      document.title = `Problem bank · ${course.title}`;
      shell.setTop({ back: { href: '#/', label: course.title }, title: 'Problem bank' });
      const root = el('article', { class: 'page lx-bank-page' });
      main.append(root);
      page = { destroy: () => root.remove() };
      current = { kind: 'bank', page };
      const out = await renderBank(root, { course, store, bridge });
      if (my === token && out?.destroy) current.page = { destroy: () => (out.destroy(), root.remove()) };
      return;
    }
    if (r.kind === 'kit') {
      document.title = `Kit · ${course.title}`;
      shell.setTop({ back: { href: '#/', label: course.title }, title: 'Authoring kit' });
      current = { kind: 'kit', page: null };
      const { renderKit } = await import('./pages/kit.js');
      if (my !== token) return;
      current.page = renderKit(main, { course, store, bridge, shell });
      return;
    }
    if (r.kind === 'audit') {
      // dev tool, not linked from the UI: layout audit of every scene beat after every step
      document.title = `Audit · ${course.title}`;
      shell.setTop({ back: { href: '#/', label: course.title }, title: 'Layout audit' });
      current = { kind: 'audit', page: null };
      const { renderAudit } = await import('./pages/audit.js');
      if (my !== token) return;
      current.page = renderAudit(main, { course, lectureId: r.id, shell });
      return;
    }
    document.title = `${course.title} · Learn`;
    current = { kind: 'home', page: renderHome(main, { course, store, bridge, shell }) };
  }

  addEventListener('hashchange', () => route().catch((err) => console.error(err)));
  await route();
}
