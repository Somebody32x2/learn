import { h, icon } from './dom.js';

/**
 * "Listen" for a chapter: plays the pre-recorded narration in audio/<chapter id>.json (made by tts/gen.mjs),
 * highlighting each block's page element and stepping its figure. The page never calls a TTS API; a block
 * with no recording yet is read by the browser's own voice.
 *
 *   mountNarration(chapter, article)   adds the Listen button and the "listen from here" buttons if the
 *                                      chapter has narration
 *   stopNarration()                    on every route change
 *
 * A block that highlights a checkpoint (`.quiz`) is a gate: when it has been spoken, narration waits (bar and
 * quiz show Continue) instead of reading on. The block reached is remembered per chapter in localStorage
 * `physics2.tts.pos` ({ chapter id: block index }), so Listen offers to resume there.
 *
 * Events on window: dispatches 'narration' { playing, gated } on every start, pause and stop; listens for
 * 'learn:pause-narration' (sent by anything on the page that starts talking) and pauses, keeping the position.
 *
 * Clips are fetched whole (not streamed with range requests), so the service worker can cache them and
 * narration works offline once heard.
 */
const RATES = [1, 1.25, 1.5, 0.85];
const RATE_KEY = 'physics2.tts.rate';
const POS_KEY = 'physics2.tts.pos';
const BLOCKS = 'p, ul, ol, h2, h3, aside.callout, figure.fig, .eqcard, .table-wrap, .defs-card, .quiz';
// A few samples of silence: playing it inside the click unlocks the audio element on iOS for the clips that follow.
const SILENCE = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA';
const ico = {
  speaker: '<svg viewBox="0 0 16 16"><path d="M2.5 6v4h2.5l3.5 3V3L5 6z" /><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6.3 6.3 0 0 1 0 9" /></svg>',
  close: '<svg viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8" /></svg>',
};

let state = null; // { ch, article, blocks, i, playing, gated, bar, ... } while a chapter is mounted
const audio = typeof Audio === 'function' ? new Audio() : null;
const urls = new Map(); // src -> Promise<object URL>
let rate = Number(localStorage.getItem(RATE_KEY)) || 1;

addEventListener('learn:pause-narration', () => state?.playing && toggle());

export async function mountNarration(ch, article) {
  let data;
  try {
    const res = await fetch(`audio/${ch.id}.json`);
    if (!res.ok) return;
    data = await res.json();
  } catch {
    return;
  }
  if (!article.isConnected || !data.blocks?.length) return;
  const blocks = data.blocks;
  const btn = h('button', { class: 'btn ghost small listen-btn', onclick: () => (state?.bar ? toggle() : start(savedPos(state))) });
  const restart = h('button', { class: 'listen-restart', text: 'From the start', hidden: true, onclick: () => start(0) });
  article.querySelector('.page-head')?.append(btn, restart);
  const s = { ch, article, blocks, i: 0, playing: false, gated: null, bar: null, btn, restart, speech: null, from: new Map() };
  state = s;
  labelListen(s);
  index(s);
  place(s);
  s.onResize = () => relayout(s);
  s.ro = new ResizeObserver(s.onResize);
  s.ro.observe(article);
  addEventListener('resize', s.onResize);
}

export function stopNarration() {
  const s = state;
  if (!s) return;
  ungate(s);
  halt();
  if (s.bar) dismiss(s);
  clearHighlight();
  s.ro.disconnect();
  removeEventListener('resize', s.onResize);
  cancelAnimationFrame(s.layoutRaf);
  for (const b of s.from.values()) b.remove();
  for (const u of urls.values()) u.then(URL.revokeObjectURL, () => {});
  urls.clear();
  audio.removeAttribute('src');
  loaded = null;
  state = null;
  if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
}

function start(i) {
  if (!state.bar) openBar();
  // Unlock playback inside the user's click; the real clip replaces this once it has loaded.
  audio.src = SILENCE;
  loaded = null;
  audio.play().catch(() => {});
  play(i);
}

// ---------- remembered position ----------
const minutes = (blocks) => Math.max(1, Math.round(blocks.reduce((t, b) => t + (b.dur ?? b.text.length / 15), 0) / 60));

function positions() {
  try {
    const all = JSON.parse(localStorage.getItem(POS_KEY));
    return all && typeof all === 'object' ? all : {};
  } catch {
    return {};
  }
}

/** Remember block i for this chapter; the start or the end forgets it. */
function savePos(s, i) {
  const all = positions();
  if (i > 0 && i < s.blocks.length) all[s.ch.id] = i;
  else delete all[s.ch.id];
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked: resuming is a nicety */
  }
}

function savedPos(s) {
  const i = positions()[s.ch.id];
  return Number.isInteger(i) && i > 0 && i < s.blocks.length ? i : 0;
}

/** The Listen button: "Resume, n min left" when a closed narration stopped partway. */
function labelListen(s) {
  const at = s.bar ? 0 : savedPos(s);
  s.btn.innerHTML = `${ico.speaker}<span>${at ? 'Resume' : 'Listen'}</span><span class="listen-min">${minutes(s.blocks.slice(at))} min${at ? ' left' : ''}</span>`;
  s.btn.title = at ? `Resume at paragraph ${at + 1} of ${s.blocks.length}` : 'Read this chapter aloud (AI voices)';
  s.restart.hidden = !at;
}

// ---------- the bar ----------
function openBar() {
  const s = state;
  s.article.classList.add('tts-open');
  if (s.dock) {
    clearTimeout(s.parked);
    if (!s.dock.isConnected) {
      document.body.append(s.dock);
      void s.dock.offsetWidth; // start the entrance from the parked state
    }
  } else {
    const btn = (name, label, fn, html = icon[name]) => h('button', { class: 'icon-btn', 'aria-label': label, title: label, html, onclick: fn });
    s.bPlay = h('button', { class: 'btn small tts-play', 'aria-label': 'Pause', html: icon.pause, onclick: toggle });
    s.label = h('span', { class: 'tts-label' });
    s.live = h('span', { class: 'tts-sr', 'aria-live': 'polite' });
    s.bRate = h('button', { class: 'tts-rate', title: 'Speed', 'aria-label': 'Speed', text: `${rate}×`, onclick: cycleRate });
    s.dock = h('div', { class: 'tts-bar out', role: 'region', 'aria-label': 'Narration' },
      btn('prev', 'Previous paragraph', () => play(s.i - 1)),
      s.bPlay,
      btn('next', 'Next paragraph', () => play(s.i + 1)),
      s.label,
      s.live,
      s.bRate,
      btn('close', 'Stop listening', closeBar, ico.close),
    );
    document.body.append(s.dock);
    void s.dock.offsetWidth;
  }
  s.dock.classList.remove('out');
  s.dock.inert = false;
  s.bar = s.dock;
  labelListen(s);
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: s.ch.title, artist: document.title.split(' · ').at(-1) });
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => !state?.playing && toggle());
    ms.setActionHandler('pause', () => state?.playing && toggle());
    ms.setActionHandler('previoustrack', () => state && play(state.i - 1));
    ms.setActionHandler('nexttrack', () => state && play(state.i + 1));
  }
}

/** Slide the bar out; it stays reusable until it has gone, so reopening mid-exit just turns it around. */
function dismiss(s) {
  s.article.classList.remove('tts-open');
  s.dock.classList.add('out');
  s.dock.inert = true;
  const dock = s.dock;
  s.parked = setTimeout(() => dock.remove(), 240);
  s.bar = null;
}

function closeBar() {
  const s = state;
  ungate(s);
  halt();
  clearHighlight();
  dismiss(s);
  labelListen(s);
}

/** Stop whatever is sounding, keep the position. */
function halt() {
  audio.onended = audio.ontimeupdate = null;
  audio.pause();
  const s = state;
  if (!s) return;
  clearTimeout(s.gateTimer);
  cancelAnimationFrame(s.gateRaf);
  const speaking = s.speech;
  s.speech = null;
  if (speaking) speechSynthesis.cancel();
  setPlaying(false);
}

function setPlaying(on) {
  state.playing = on;
  paintPlay(state);
  dispatchEvent(new CustomEvent('narration', { detail: { playing: on, gated: Boolean(state.gated) } }));
}

function paintPlay(s) {
  if (!s.bPlay) return;
  const gated = Boolean(s.gated) && !s.playing;
  s.dock.classList.toggle('gated', gated);
  s.bPlay.classList.toggle('wide', gated);
  if (gated) {
    const last = s.i + 1 >= s.blocks.length;
    s.bPlay.innerHTML = `<span>${last ? 'Finish' : 'Continue'}</span>${icon.arrow}`;
    s.bPlay.setAttribute('aria-label', last ? 'Finish listening' : 'Continue listening');
  } else {
    s.bPlay.innerHTML = s.playing ? icon.pause : icon.play;
    s.bPlay.setAttribute('aria-label', s.playing ? 'Pause' : 'Play');
  }
}

function toggle() {
  const s = state;
  if (s.gated) resume();
  else if (s.playing) {
    if (s.speech) speechSynthesis.pause();
    else audio.pause();
    setPlaying(false);
  } else if (s.speech) {
    speechSynthesis.resume();
    setPlaying(true);
  } else if (audio.src && !audio.src.startsWith('data:') && audio.currentTime > 0 && !audio.ended) {
    audio.play().catch(() => {});
    setPlaying(true);
  } else play(s.i);
}

function cycleRate() {
  rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
  localStorage.setItem(RATE_KEY, String(rate));
  state.bRate.textContent = `${rate}×`;
  audio.playbackRate = rate;
}

// ---------- checkpoint gates ----------
/** The gate block s.i has been spoken: wait for the reader at its checkpoint. */
function gate(s) {
  if (state !== s) return;
  const quiz = s.gates[s.i];
  s.gated = quiz;
  halt(); // fires 'narration' { playing: false, gated: true }
  savePos(s, s.i + 1);
  const last = s.i + 1 >= s.blocks.length;
  if (s.label) {
    s.label.innerHTML = '<span>Your turn</span><span class="tts-wide">: checkpoint</span>';
    s.live.textContent = `Narration paused. Your turn: answer the checkpoint, then ${last ? 'finish' : 'continue listening'}.`;
  }
  const note = h('span', { class: 'tts-gate-note', text: 'Narration paused for this checkpoint.' });
  const btn = h('button', { class: 'btn small ghost tts-continue', html: `${last ? 'Finish listening' : 'Continue listening'} ${icon.arrow}`, onclick: resume });
  s.gateUI = h('div', { class: 'tts-gate' }, note, btn);
  quiz.append(s.gateUI);
  // Every question answered (the card shows 'Done'): point at the way on.
  let ready = null;
  const check = () => {
    const now = quiz.querySelector('.quiz-count')?.textContent === 'Done';
    if (now === ready) return;
    ready = now;
    s.gateUI.classList.toggle('ready', now);
    btn.classList.toggle('ghost', !now);
    s.bPlay?.classList.toggle('ready', now);
    note.textContent = now ? 'Checkpoint done.' : 'Narration paused for this checkpoint.';
  };
  s.gateObs = new MutationObserver(check);
  s.gateObs.observe(quiz, { childList: true, subtree: true });
  check();
}

function ungate(s) {
  if (!s.gated) return;
  s.gated = null;
  s.gateObs.disconnect();
  s.gateUI.remove();
  s.bPlay?.classList.remove('ready');
  if (s.live) s.live.textContent = '';
  paintPlay(s);
}

function resume() {
  const s = state;
  if (s?.gated) play(s.i + 1);
}

// ---------- playing ----------
const clip = (src) => {
  if (!urls.has(src)) {
    const p = fetch(src).then((r) => (r.ok ? r.blob() : Promise.reject(new Error(r.status)))).then((b) => URL.createObjectURL(b));
    p.catch(() => urls.delete(src));
    urls.set(src, p);
  }
  return urls.get(src);
};

let loaded = null; // src whose clip is in the audio element (a section clip holds several blocks)

function setLabel(s) {
  const b = s.blocks[s.i];
  s.label.textContent = `${s.i + 1} / ${s.blocks.length}`;
  s.label.title = `Voice: ${b.voice}`;
}

async function play(i) {
  const s = state;
  if (!s) return;
  if (i < 0) i = 0;
  if (i >= s.blocks.length) {
    savePos(s, s.blocks.length);
    closeBar();
    s.i = 0;
    return;
  }
  ungate(s);
  halt();
  if (s.missing) {
    index(s);
    place(s);
  }
  s.i = i;
  const b = s.blocks[i];
  setLabel(s);
  show(b);
  savePos(s, i);
  setPlaying(true);
  const next = s.blocks.slice(i + 1).find((x) => x.src && x.src !== b.src);
  if (next) clip(next.src).catch(() => {});

  if (b.src) {
    try {
      const url = await clip(b.src);
      if (state !== s || s.i !== i || !s.playing) return;
      if (loaded !== b.src) {
        audio.src = url;
        loaded = b.src;
        await new Promise((ok, fail) => {
          audio.onloadedmetadata = ok;
          audio.onerror = fail;
        });
        if (state !== s || s.i !== i || !s.playing) return;
      }
      audio.currentTime = b.start ?? 0;
      audio.playbackRate = rate;
      audio.ontimeupdate = () => tick(s);
      audio.onended = () => state === s && (s.gates[s.i] ? gate(s) : play(s.i + 1));
      await audio.play();
      return;
    } catch {
      loaded = null;
      if (state !== s || s.i !== i) return; // offline and never heard: fall through to the browser voice
    }
  }
  if (!('speechSynthesis' in window)) return setPlaying(false);
  const u = new SpeechSynthesisUtterance(b.text);
  u.rate = rate;
  u.onend = () => {
    if (state !== s || s.speech !== u) return;
    s.speech = null;
    if (s.gates[i]) gate(s);
    else play(i + 1);
  };
  s.speech = u;
  speechSynthesis.speak(u);
}

/**
 * Within a section clip (several blocks, each with start/end seconds): move the highlight on when the playhead
 * passes a block's end, and stop exactly at the end of a gate block. timeupdate fires only about 4 times a
 * second, so inside a gate the end is watched every frame, and by a timer for hidden tabs.
 */
function tick(s) {
  if (state !== s || !s.playing || s.speech) return;
  const cur = s.blocks[s.i];
  const nx = s.blocks[s.i + 1];
  if (cur.end == null || nx?.src !== cur.src) return; // the clip ends with the block: 'ended' takes over
  if (s.gates[s.i]) {
    const left = cur.end - audio.currentTime;
    if (left <= 0.03) return gate(s);
    cancelAnimationFrame(s.gateRaf);
    clearTimeout(s.gateTimer);
    s.gateRaf = requestAnimationFrame(() => tick(s));
    s.gateTimer = setTimeout(() => tick(s), Math.max(10, (left * 1000) / rate - 40));
    return;
  }
  if (audio.currentTime >= nx.start - 0.05) {
    s.i++;
    setLabel(s);
    show(nx);
    savePos(s, s.i);
    tick(s);
  }
}

// ---------- listen from here ----------
/**
 * For every element some block highlights: the first block that starts there (a stepped figure starts at its
 * step 0), whether the block is a checkpoint gate, and a "listen from here" button placed in the margin.
 * Built after mount (figures and their players exist by then); rebuilt while some block found nothing.
 */
function index(s) {
  const starts = new Map();
  s.missing = false;
  s.gates = s.blocks.map((b, i) => {
    const els = targets(b, s.article);
    if (!els.length) s.missing = true;
    for (const el of els) {
      const k = starts.get(el);
      if (k == null || (b.step === 0 && s.blocks[k].step > 0)) starts.set(el, i);
    }
    return els.map((el) => el.closest('.quiz')).find(Boolean) ?? null;
  });
  const old = s.from;
  s.from = new Map();
  for (const [el, i] of starts) {
    const b =
      old.get(el) ??
      h('button', {
        class: 'tts-from',
        type: 'button',
        'aria-label': 'Listen from here',
        title: 'Listen from here',
        html: icon.play,
        onclick: (e) => listenFrom(Number(e.currentTarget.dataset.i)),
      });
    old.delete(el);
    b.dataset.i = i;
    s.from.set(el, b);
  }
  for (const b of old.values()) b.remove();
}

function listenFrom(i) {
  if (!state) return;
  if (state.bar) play(i);
  else start(i);
}

const offset = (el, op, side) => {
  let v = 0;
  for (let e = el; e && e !== op; e = e.offsetParent) v += e[`offset${side}`];
  return v;
};

/** Put each button just before its element (tab order) and beside its first line, in the left margin. */
function place(s) {
  const pairs = [];
  for (const [el, b] of s.from) {
    if (!el.isConnected) {
      b.remove();
      s.missing = true;
      continue;
    }
    if (b.nextElementSibling !== el) el.before(b);
    pairs.push([el, b]);
  }
  // Read everything, then write: one layout pass.
  const spots = pairs.map(([el, b]) => {
    const op = b.offsetParent;
    if (!op || !el.offsetParent) return null;
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
    const size = b.offsetWidth;
    const room = el.getBoundingClientRect().left; // phones: only the page padding, so the button sits flush left
    return {
      top: offset(el, op, 'Top') + (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.borderTopWidth) || 0) + (line - size) / 2,
      left: offset(el, op, 'Left') - Math.min(size + 8, Math.max(0, room)),
    };
  });
  pairs.forEach(([, b], k) => {
    const p = spots[k];
    if (!p) return;
    b.style.top = `${Math.round(p.top)}px`;
    b.style.left = `${Math.round(p.left)}px`;
  });
}

function relayout(s) {
  if (s.layoutRaf) return;
  s.layoutRaf = requestAnimationFrame(() => {
    s.layoutRaf = 0;
    if (state !== s) return;
    if (s.missing) index(s);
    place(s);
  });
}

// ---------- highlighting and figures ----------
const norm = (t) => t.replace(/\s+/g, ' ');

function targets(b, root = state.article) {
  if (b.sel) return [root.querySelector(b.sel)].filter(Boolean);
  if (b.figure) {
    const t = [...root.querySelectorAll('.fig-title')].find((el) => norm(el.textContent).trim() === b.figure);
    return t ? [t.closest('figure')] : [];
  }
  const all = [...root.querySelectorAll(BLOCKS)];
  return b.at
    .map((a) => all.filter((el) => norm(el.textContent).includes(a)).sort((x, y) => x.textContent.length - y.textContent.length)[0])
    .filter(Boolean);
}

function clearHighlight() {
  state?.article.querySelectorAll('.tts-now').forEach((el) => el.classList.remove('tts-now'));
}

function show(b) {
  clearHighlight();
  const els = targets(b);
  if (!els.length) console.warn('narration: nothing to highlight for', b);
  els.forEach((el) => el.classList.add('tts-now', 'in'));
  if (b.figure && b.step != null) els[0]?.querySelector('.player')?.player?.go(b.step);
  const first = els[0];
  if (first) {
    const r = first.getBoundingClientRect();
    const barTop = state.bar?.getBoundingClientRect().top ?? innerHeight;
    if (r.top < 64 || r.top > barTop - 80) first.scrollIntoView({ behavior: 'smooth', block: r.height > innerHeight * 0.6 ? 'start' : 'center' });
  }
}
