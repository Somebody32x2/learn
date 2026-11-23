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

/** "2 h ago" for a time in ms. */
function ago(at) {
  const min = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/** The last lesson page, saved by resume.js (localStorage `learn.resume.v1`, device-local). */
function resumeCard() {
  let r, url;
  const root = new URL('./', location.href).href;
  try {
    r = JSON.parse(localStorage.getItem('learn.resume.v1'));
    url = new URL(r.path, root).href;
  } catch {
    return '';
  }
  if (typeof r.path !== 'string' || !url.startsWith(root) || url === root) return '';
  const subject = subjects.find((s) => r.path.startsWith(`${s.slug}/`));
  const title = String(r.title || subject?.title || 'Your last lesson').split(' \u00b7 ')[0];
  const meta = [subject?.title, r.at && ago(r.at)].filter(Boolean).join(' \u00b7 ');
  return `<a class="resume-card" href="${esc(url)}">
      <span class="resume-text"><span class="eyebrow">Continue where you left off</span><span class="resume-title">${esc(title)}</span></span>
      <span class="topic-meta">${esc(meta)}</span>
      <span class="topic-go">${arrow}</span>
    </a>`;
}

const resume = document.getElementById('resume');
resume.innerHTML = resumeCard();
resume.hidden = !resume.innerHTML;
// resume.js puts the scroll position back when it sees this flag on arrival.
resume.addEventListener('click', (e) => {
  if (e.target.closest('.resume-card')) sessionStorage.setItem('learn.resume.restore', '1');
});

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
