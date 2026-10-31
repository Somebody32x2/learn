import { subjects, tools } from './subjects.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>';

/** Checkpoint questions answered correctly in a topic (same origin, so the topic's localStorage is readable). */
function solved(storage) {
  try {
    const data = JSON.parse(localStorage.getItem(`${storage}.progress.v1`)) ?? {};
    return Object.values(data).filter((v) => v === true).length;
  } catch {
    return 0;
  }
}

function topicRow(t) {
  const n = solved(t.storage);
  const meta = n > 0 ? `${t.meta} \u00b7 ${n} solved` : t.meta;
  return `<a class="topic" href="${esc(t.href)}">
      <span class="topic-text"><span class="topic-title">${esc(t.title)}</span><span class="topic-blurb">${esc(t.blurb)}</span></span>
      <span class="topic-meta">${esc(meta)}</span>
      <span class="topic-go">${arrow}</span>
    </a>`;
}

function subjectCard(s, i) {
  return `<article class="subject reveal" style="--i:${i}">
      <div class="subject-head">
        <div>
          <div class="eyebrow">${esc(s.course)}</div>
          <h3><a href="${esc(s.slug)}/">${esc(s.title)}</a></h3>
        </div>
        <div class="subject-art">${s.art}</div>
      </div>
      <p class="subject-blurb">${esc(s.blurb)}</p>
      <div class="topics">${s.topics.map(topicRow).join('')}</div>
      <div class="subject-foot">
        <a class="btn" href="${esc(s.slug)}/">Open ${esc(s.short ?? s.title)} ${arrow}</a>
        <a class="quiet" href="${esc(s.repo)}">Source on GitHub</a>
      </div>
    </article>`;
}

function toolRow(t) {
  return `<a class="tool" href="${esc(t.href)}"><span class="tool-title">${esc(t.title)}</span><span class="tool-blurb">${esc(t.blurb)}</span><span class="topic-go">${arrow}</span></a>`;
}

document.getElementById('subjects').innerHTML = subjects.map(subjectCard).join('');
document.getElementById('tools').innerHTML = tools.map(toolRow).join('');
document.getElementById('count').textContent = `${subjects.length} subject${subjects.length === 1 ? '' : 's'} \u00b7 ${subjects.reduce((n, s) => n + s.topics.length, 0)} topics`;

const observer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        observer.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -6% 0px' },
);
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Installable and offline-capable (sw.js). Its scope is the hub's folder, subjects included.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
