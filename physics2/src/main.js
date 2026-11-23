import { h, icon } from './ui/dom.js';
import { Player } from './ui/player.js';
import { figure } from './ui/figure.js';
import { progress } from './ui/progress.js';
import { mountNarration, stopNarration } from './ui/narrator.js';
import { site } from './site.js';
import { chapters, hero, legend } from './lessons/index.js';

const app = document.getElementById('app');
const nav = h('nav', { class: 'nav', 'aria-label': 'Chapters' });
const main = h('main', { class: 'main', id: 'main' });
const brand = () => h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-mark', html: logo() }), h('span', { text: site.title }));
// The site is the physics2/ folder of the lessons hub; one level up is the hub's homepage.
const upLink = () => h('a', { class: 'up-link', href: '../', html: `${icon.arrow}<span>All subjects</span>` });

app.append(
  h('header', { class: 'topbar' },
    h('button', { class: 'icon-btn menu-btn', 'aria-label': 'Chapters', html: icon.menu, onclick: () => document.body.classList.toggle('nav-open') }),
    brand(),
    upLink(),
  ),
  h('aside', { class: 'sidebar' },
    upLink(),
    brand(),
    nav,
    h('div', { class: 'side-foot' },
      h('button', {
        class: 'link',
        text: 'Reset quiz progress',
        onclick: () => confirm('Clear all saved quiz answers?') && progress.reset(),
      }),
      site.repo && h('a', { class: 'link', href: site.repo, text: 'Source on GitHub' }),
    ),
  ),
  main,
);

function logo() {
  return '<svg viewBox="0 0 24 24"><path style="fill:none" d="M2.5 16.5c2.4-5.2 4.8-5.2 7.2 0s4.8 5.2 7.2 0" /><circle cx="17.5" cy="6.5" r="4" class="accent" /><path d="M17.5 4.6v3.8M15.6 6.5h3.8" /></svg>';
}

const quizIds = (ch) => (ch.quiz ?? []).map((q) => q.id);
const num = (ch) => String(chapters.indexOf(ch) + 1).padStart(2, '0');

/** Sidebar groups in chapter order: [{ name, items: [chapters] }]. */
const groups = [];
for (const ch of chapters) {
  let g = groups.find((x) => x.name === ch.group);
  if (!g) groups.push((g = { name: ch.group, items: [] }));
  g.items.push(ch);
}
/** URL slug of a group name: 'Light & optics' -> 'light-optics'. Its table of contents is #/toc/<slug>. */
const slug = (name) => name.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tocHref = (g) => `#/toc/${slug(g.name)}`;
const groupOf = (name) => groups.find((g) => g.name && g.name === name);
const course = site.eyebrow.split(' \u00b7 ')[0]; // 'PHYS 1742'

function renderNav(current) {
  nav.replaceChildren(
    h('a', { class: `nav-item${current === 'home' ? ' on' : ''}`, href: '#/' }, h('span', { class: 'nav-num' }), h('span', { text: 'Overview' })),
    ...groups.map((g) => {
      const on = g.name && current === `toc:${slug(g.name)}`;
      return h('div', { class: 'nav-group' },
        g.name && h('a', { class: `nav-label${on ? ' on' : ''}`, href: tocHref(g), title: `${g.name}: contents`, 'aria-current': on ? 'page' : null, text: g.name }),
        g.items.map((ch) => {
          const ids = quizIds(ch);
          const got = progress.correct(ids);
          return h('a', { class: `nav-item${current === ch.id ? ' on' : ''}`, href: `#/${ch.id}` },
            h('span', { class: 'nav-num', text: num(ch) }),
            h('span', { class: 'nav-title', text: ch.title }),
            ids.length > 0 &&
              h('span', {
                class: `nav-prog${got === ids.length ? ' full' : ''}`,
                title: `${got} of ${ids.length} checkpoint questions correct`,
                html: got === ids.length ? icon.check : `${got}/${ids.length}`,
              }),
          );
        }),
      );
    }),
  );
}

function renderHome() {
  document.title = site.title;
  const page = h('article', { class: 'page home' },
    h('section', { class: 'hero' },
      h('div', { class: 'eyebrow', text: site.eyebrow }),
      h('h1', { html: site.heroTitle }),
      h('p', { class: 'lede', html: site.heroLede }),
      h('div', { class: 'hero-actions' },
        h('a', { class: 'btn', href: `#/${chapters[0].id}`, html: `Start with chapter 1 ${icon.arrow}` }),
      ),
    ),
  );
  main.replaceChildren(page);

  if (hero) {
    const host = h('div');
    const { frames, title, View, view } = hero();
    page.append(figure({ title, wide: true }, host));
    new Player(host, { frames, View, view: { height: 380, ...view }, loop: true, autoplay: true, interval: 2800 });
  }
  if (legend?.length) {
    page.append(
      h('div', { class: 'legend reveal' },
        legend.map((l) => h('div', { class: 'legend-item' }, h('div', { class: 'legend-sym', html: l.sym }), h('div', { class: 'legend-text', html: l.text }))),
      ),
    );
  }
  page.append(
    h('h2', { class: 'reveal', text: 'Chapters' }),
    h('div', { class: 'chapter-grid' },
      chapters.map((ch, i) => {
        const ids = quizIds(ch);
        const got = progress.correct(ids);
        return h('a', { class: 'chapter-card reveal', href: `#/${ch.id}`, style: `--i:${i % 6}` },
          h('div', { class: 'card-top' }, h('span', { class: 'card-num', text: num(ch) }), ch.group && h('span', { class: 'card-group', text: ch.group })),
          h('h3', { text: ch.title }),
          h('p', { text: ch.blurb }),
          ids.length ? h('div', { class: 'card-prog' }, h('span', { style: `width:${(100 * got) / ids.length}%` })) : null,
        );
      }),
    ),
  );
}

function renderChapter(ch) {
  const i = chapters.indexOf(ch);
  document.title = `${ch.title} \u00b7 ${site.title}`;
  const article = h('article', { class: 'page' },
    h('header', { class: 'page-head' },
      h('div', { class: 'eyebrow' }, `Chapter ${i + 1}`, groupOf(ch.group) && [' \u00b7 ', h('a', { href: tocHref(groupOf(ch.group)), text: ch.group })]),
      h('h1', { text: ch.title }),
      h('p', { class: 'lede', text: ch.blurb }),
    ),
  );
  main.replaceChildren(article);
  ch.render(article);
  mountNarration(ch, article);
  const prev = chapters[i - 1];
  const next = chapters[i + 1];
  article.append(
    h('nav', { class: 'pager' },
      prev ? h('a', { class: 'pager-link', href: `#/${prev.id}` }, h('span', { class: 'eyebrow', text: 'Previous' }), h('span', { text: prev.title })) : h('span'),
      next ? h('a', { class: 'pager-link next', href: `#/${next.id}` }, h('span', { class: 'eyebrow', text: 'Next' }), h('span', { text: next.title })) : h('a', { class: 'pager-link next', href: '../' }, h('span', { class: 'eyebrow', text: 'Done' }), h('span', { text: 'All subjects' })),
    ),
  );
}

/** #/toc/<slug>: one group's chapters in order, with progress, and where to start or continue. */
function renderToc(g) {
  const items = g.items;
  document.title = `${g.name} \u00b7 ${site.title}`;
  const total = items.reduce((s, ch) => s + quizIds(ch).length, 0);
  const solved = items.reduce((s, ch) => s + progress.correct(quizIds(ch)), 0);
  // Start or continue at the first chapter whose checkpoint is not fully solved.
  const next = items.find((ch) => progress.correct(quizIds(ch)) < quizIds(ch).length);
  const target = next ?? items[0];
  const action = !next ? 'Read again' : solved ? 'Continue' : 'Start';
  const shown = groups.filter((x) => x.name);
  const at = shown.indexOf(g);
  const prevG = shown[at - 1];
  const nextG = shown[at + 1];
  const page = h('article', { class: 'page toc' },
    h('header', { class: 'page-head' },
      h('div', { class: 'eyebrow', text: `${course} \u00b7 Part ${at + 1} of ${shown.length}` }),
      h('h1', { text: g.name }),
      h('p', { class: 'toc-summary', text: [`${items.length} chapter${items.length === 1 ? '' : 's'}`, total ? `${solved} of ${total} checkpoint questions solved` : null].filter(Boolean).join(' \u00b7 ') }),
      h('div', { class: 'hero-actions' },
        h('a', { class: 'btn', href: `#/${target.id}`, html: `${action}: ${target.title} ${icon.arrow}` }),
        h('a', { class: 'btn ghost', href: '#/', text: 'All chapters' }),
      ),
    ),
    h('ol', { class: 'toc-list' },
      items.map((ch, i) => {
        const ids = quizIds(ch);
        const got = progress.correct(ids);
        return h('li', { class: 'reveal', style: `--i:${i % 6}` },
          h('a', { class: `toc-item${ch === target ? ' is-next' : ''}`, href: `#/${ch.id}` },
            h('span', { class: 'toc-num', text: num(ch) }),
            h('span', { class: 'toc-text' },
              h('span', { class: 'toc-title', text: ch.title }),
              h('span', { class: 'toc-blurb', text: ch.blurb }),
              ids.length > 0 && h('span', { class: 'card-prog toc-prog' }, h('span', { style: `width:${(100 * got) / ids.length}%` })),
            ),
            h('span', { class: 'toc-meta' },
              solved > 0 && ch === next && h('span', { class: 'card-group', text: 'up next' }),
              ids.length > 0 &&
                h('span', {
                  class: `nav-prog${got === ids.length ? ' full' : ''}`,
                  title: `${got} of ${ids.length} checkpoint questions correct`,
                  html: got === ids.length ? icon.check : `${got}/${ids.length}`,
                }),
            ),
            h('span', { class: 'topic-go', html: icon.arrow }),
          ),
        );
      }),
    ),
    h('nav', { class: 'pager' },
      prevG ? h('a', { class: 'pager-link', href: tocHref(prevG) }, h('span', { class: 'eyebrow', text: 'Previous part' }), h('span', { text: prevG.name })) : h('span'),
      nextG
        ? h('a', { class: 'pager-link next', href: tocHref(nextG) }, h('span', { class: 'eyebrow', text: 'Next part' }), h('span', { text: nextG.name }))
        : h('a', { class: 'pager-link next', href: '../' }, h('span', { class: 'eyebrow', text: 'Done' }), h('span', { text: 'All subjects' })),
    ),
  );
  main.replaceChildren(page);
}

const observer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        observer.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -8% 0px' },
);

/** The group whose table of contents the route shows (#/toc/<slug>), if any. */
const tocGroup = () => {
  const m = /^#\/toc\/([^/?]+)/.exec(location.hash);
  return m ? groups.find((g) => g.name && slug(g.name) === m[1]) : null;
};
const currentId = () => chapters.find((c) => location.hash === `#/${c.id}`)?.id ?? (tocGroup() ? `toc:${slug(tocGroup().name)}` : 'home');

function route() {
  const ch = chapters.find((c) => location.hash === `#/${c.id}`);
  const g = tocGroup();
  document.body.classList.remove('nav-open');
  stopNarration();
  if (ch) renderChapter(ch);
  else if (g) renderToc(g);
  else renderHome();
  renderNav(currentId());
  window.scrollTo(0, 0);
  main.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

addEventListener('hashchange', route);
addEventListener('progress', () => renderNav(currentId()));
route();
