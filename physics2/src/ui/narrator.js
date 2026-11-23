import { h, icon } from './dom.js';
import { site } from '../site.js';

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
 * Previous / next (bar, media keys, lock screen, headphones) move JUMP paragraphs; a stepped figure counts as one.
 * Pressed again at the first / last paragraph they switch to the previous / next chapter (the page's pager
 * links) and keep playing from its start; a chapter without narration ends it.
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
const JUMP = 3; // paragraphs per previous / next
const REPEAT_MS = 250; // a second media action of the same kind this soon is a duplicate
// A few samples of silence: playing it inside the click unlocks the audio element on iOS for the clips that follow.
const SILENCE = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA';
const ico = {
  speaker: '<svg viewBox="0 0 16 16"><path d="M2.5 6v4h2.5l3.5 3V3L5 6z" /><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6.3 6.3 0 0 1 0 9" /></svg>',
  close: '<svg viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8" /></svg>',
};

let state = null; // { ch, article, blocks, i, playing, gated, open, armed, ... } while a chapter is mounted
const audio = typeof Audio === 'function' ? new Audio() : null;
const urls = new Map(); // src -> Promise<object URL>
let rate = Number(localStorage.getItem(RATE_KEY)) || 1;
let bar = null; // the bar's elements: built once and kept across chapters, so a chapter switch does not flash it
let unlocked = false; // the audio element has played inside a click: later plays need no gesture
let carry = null; // { id, timer }: previous / next crossed into this chapter; it starts playing when mounted
const session = 'mediaSession' in navigator ? navigator.mediaSession : null;

addEventListener('learn:pause-narration', () => state?.playing && toggle());

export async function mountNarration(ch, article) {
  let data = null;
  try {
    const res = await fetch(`audio/${ch.id}.json`);
    if (res.ok) data = await res.json();
  } catch {
    /* offline and never fetched: no narration */
  }
  const blocks = article.isConnected ? (data?.blocks ?? []) : [];
  if (!blocks.length) {
    if (claim(ch.id)) endBar();
    return;
  }
  const btn = h('button', { class: 'btn ghost small listen-btn', onclick: () => (state?.open ? toggle() : start(savedPos(state))) });
  const restart = h('button', { class: 'listen-restart', text: 'From the start', hidden: true, onclick: () => start(0) });
  article.querySelector('.page-head')?.append(btn, restart);
  const s = { ch, article, blocks, i: 0, playing: false, gated: null, open: false, armed: false, btn, restart, speech: null, from: new Map() };
  state = s;
  labelListen(s);
  index(s);
  place(s);
  s.onResize = () => relayout(s);
  s.ro = new ResizeObserver(s.onResize);
  s.ro.observe(article);
  addEventListener('resize', s.onResize);
  if (claim(ch.id)) {
    openBar(s);
    play(0);
  }
}

export function stopNarration() {
  const s = state;
  if (!s) return;
  ungate(s);
  halt();
  clearHighlight();
  s.article.classList.remove('tts-open');
  s.ro.disconnect();
  removeEventListener('resize', s.onResize);
  cancelAnimationFrame(s.layoutRaf);
  for (const b of s.from.values()) b.remove();
  for (const u of urls.values()) u.then(URL.revokeObjectURL, () => {});
  urls.clear();
  audio.removeAttribute('src');
  loaded = null;
  state = null;
  if (!s.open) return;
  if (carry) {
    // Previous / next crossed into another chapter: the bar stays while it loads, and its mount takes over.
    bar.label.textContent = '\u2026';
    carry.timer = setTimeout(() => claim(carry?.id) && endBar(), 8000);
  } else endBar();
}

function start(i) {
  const s = state;
  if (!s.open) openBar(s);
  // Unlock playback inside the user's click; the real clip replaces this once it has loaded.
  audio.src = SILENCE;
  loaded = null;
  audio.play().catch(() => {});
  unlocked = true;
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
  const at = s.open ? 0 : savedPos(s);
  s.btn.innerHTML = `${ico.speaker}<span>${at ? 'Resume' : 'Listen'}</span><span class="listen-min">${minutes(s.blocks.slice(at))} min${at ? ' left' : ''}</span>`;
  s.btn.title = at ? `Resume at paragraph ${at + 1} of ${s.blocks.length}` : 'Read this chapter aloud (AI voices)';
  s.restart.hidden = !at;
}

// ---------- the bar ----------
function buildBar() {
  const btn = (label, fn, html) => h('button', { class: 'icon-btn', 'aria-label': label, title: label, html, onclick: fn });
  const b = {
    prev: btn('Back', () => skip(-1), icon.prev),
    play: h('button', { class: 'btn small tts-play', 'aria-label': 'Pause', html: icon.pause, onclick: () => state?.open && toggle() }),
    next: btn('Forward', () => skip(1), icon.next),
    label: h('span', { class: 'tts-label' }),
    live: h('span', { class: 'tts-sr', 'aria-live': 'polite' }),
    rate: h('button', { class: 'tts-rate', title: 'Speed', 'aria-label': 'Speed', text: `${rate}×`, onclick: cycleRate }),
    timer: 0,
  };
  b.el = h('div', { class: 'tts-bar out', role: 'region', 'aria-label': 'Narration' }, b.prev, b.play, b.next, b.label, b.live, b.rate, btn('Stop listening', closeBar, ico.close));
  return b;
}

/** Slide the bar in; if it is still on its way out, turn it around. */
function showBar() {
  bar ??= buildBar();
  clearTimeout(bar.timer);
  if (!bar.el.isConnected) {
    document.body.append(bar.el);
    void bar.el.offsetWidth; // start the entrance from the parked state
  }
  bar.el.classList.remove('out');
  bar.el.inert = false;
}

function hideBar() {
  if (!bar?.el.isConnected) return;
  bar.el.classList.add('out');
  bar.el.inert = true;
  clearTimeout(bar.timer);
  bar.timer = setTimeout(() => bar.el.remove(), 240);
}

/** Narration is over (closed, or a chapter switch found nothing to play): bar away, media session idle. */
function endBar() {
  hideBar();
  if (!session) return;
  session.playbackState = 'none';
  session.metadata = null;
}

/** Take over a pending chapter switch aimed at chapter id. */
function claim(id) {
  if (!carry || carry.id !== id) return false;
  clearTimeout(carry.timer);
  carry = null;
  return true;
}

function openBar(s) {
  s.open = true;
  s.article.classList.add('tts-open');
  showBar();
  bar.rate.textContent = `${rate}×`;
  labelListen(s);
  if (session) {
    const artwork = [{ src: new URL('../icons/icon-512.png', document.baseURI).href, sizes: '512x512', type: 'image/png' }];
    session.metadata = new MediaMetadata({ title: s.ch.title, artist: site.title, artwork });
    session.playbackState = 'paused';
  }
}

function closeBar() {
  const s = state;
  if (!s) {
    if (carry && claim(carry.id)) endBar(); // closed while a chapter switch was loading
    return;
  }
  if (!s.open) return;
  ungate(s);
  halt();
  clearHighlight();
  s.open = false;
  s.article.classList.remove('tts-open');
  endBar();
  labelListen(s);
}

/** Stop whatever is sounding, keep the position. */
function halt() {
  audio.onended = audio.ontimeupdate = null;
  const s = state;
  if (s) s.armed = false; // before pausing: this pause is ours
  audio.pause();
  if (!s) return;
  clearTimeout(s.gateTimer);
  cancelAnimationFrame(s.gateRaf);
  const speaking = s.speech;
  s.speech = null;
  if (speaking) speechSynthesis.cancel();
  setPlaying(false);
}

function setPlaying(on) {
  const s = state;
  s.playing = on;
  paintPlay(s);
  if (session && s.open) session.playbackState = on ? 'playing' : 'paused';
  dispatchEvent(new CustomEvent('narration', { detail: { playing: on, gated: Boolean(s.gated) } }));
}

function paintPlay(s) {
  if (!s.open) return;
  const gated = Boolean(s.gated) && !s.playing;
  bar.el.classList.toggle('gated', gated);
  bar.play.classList.toggle('wide', gated);
  if (gated) {
    const last = s.i + 1 >= s.blocks.length;
    bar.play.innerHTML = `<span>${last ? 'Finish' : 'Continue'}</span>${icon.arrow}`;
    bar.play.setAttribute('aria-label', last ? 'Finish listening' : 'Continue listening');
  } else {
    bar.play.innerHTML = s.playing ? icon.pause : icon.play;
    bar.play.setAttribute('aria-label', s.playing ? 'Pause' : 'Play');
  }
  paintSkip(s);
}

/** Play / pause; at a checkpoint, Continue. A pause keeps the place: play goes on mid-clip. */
function toggle() {
  const s = state;
  if (s.gated) resume();
  else if (s.playing) {
    if (s.speech) speechSynthesis.pause();
    else audio.pause();
    setPlaying(false);
  } else if (s.speech && (speechSynthesis.paused || speechSynthesis.speaking)) {
    speechSynthesis.resume();
    setPlaying(true);
  } else if (s.armed && !audio.ended) {
    audio.play().catch(() => {});
    setPlaying(true);
  } else play(s.i);
}

function cycleRate() {
  rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
  localStorage.setItem(RATE_KEY, String(rate));
  bar.rate.textContent = `${rate}×`;
  audio.playbackRate = rate;
}

// ---------- previous / next ----------
/** Block indexes where a paragraph starts for previous / next: the steps of one figure are one paragraph. */
const units = (s) => (s.units ??= s.blocks.flatMap((b, i) => (i > 0 && b.figure && b.figure === s.blocks[i - 1].figure ? [] : [i])));
const unitOf = (starts, i) => starts.findLastIndex((k) => k <= i);
const atEnd = (s) => (s.gated ? s.i + 1 >= s.blocks.length : unitOf(units(s), s.i) === units(s).length - 1);

/** The chapter before / after in reading order, from the page's pager (hidden chapters have none). */
function neighbour(s, dir) {
  const a = s.article.querySelector(dir < 0 ? '.pager a.pager-link:not(.next)' : '.pager a.pager-link.next');
  const id = a?.getAttribute('href').match(/^#\/([\w-]+)$/)?.[1];
  return id && id !== 'review' ? { id, href: `#/${id}`, title: a.lastElementChild?.textContent ?? '' } : null;
}

/**
 * Back / forward JUMP paragraphs; at a checkpoint, forward skips it. A press that would run past the start or
 * the end stops there; pressed again at the first / last paragraph it switches chapter and keeps playing.
 */
function skip(dir) {
  const s = state;
  if (!s?.open) return;
  const starts = units(s);
  const u = unitOf(starts, s.i);
  if (dir < 0) {
    if (s.i === 0) switchChapter(s, -1);
    else play(starts[Math.max(0, u - JUMP)]);
  } else if (atEnd(s)) switchChapter(s, 1);
  else if (s.gated) play(s.i + 1);
  else play(starts[Math.min(starts.length - 1, u + JUMP)]);
}

function switchChapter(s, dir) {
  const to = neighbour(s, dir);
  if (!to) return;
  clearTimeout(carry?.timer);
  carry = { id: to.id, timer: 0 };
  location.hash = to.href; // the router stops this chapter and mounts that one, which claims the carry
}

/** Keep the previous / next buttons honest about what they will do next. */
function paintSkip(s) {
  const set = (b, label, none) => {
    b.disabled = !label;
    b.title = label || none;
    b.setAttribute('aria-label', label || none);
  };
  const prev = s.i === 0 ? neighbour(s, -1) : null;
  const end = atEnd(s);
  const next = end ? neighbour(s, 1) : null;
  set(bar.prev, s.i === 0 ? prev && `Previous chapter: ${prev.title}` : `Back ${JUMP} paragraphs`, 'Start of the first chapter');
  set(bar.next, end ? next && `Next chapter: ${next.title}` : s.gated ? 'Skip the checkpoint' : `Forward ${JUMP} paragraphs`, 'End of the last chapter');
}

// ---------- media keys, lock screen, headphones ----------
// Registered once; every handler reads the current state, so nothing goes stale across route changes.
const actions = {
  play() {
    const s = state;
    if (!s) return;
    if (!s.open) {
      if (unlocked) {
        openBar(s);
        play(savedPos(s));
      }
    } else if (s.gated) resume();
    else if (!s.playing) toggle();
  },
  pause: () => state?.playing && toggle(), // at a checkpoint narration is already waiting: nothing to do
  playpause: () => (state?.open ? toggle() : actions.play()),
  stop: () => closeBar(),
  previoustrack: () => skip(-1),
  nexttrack: () => skip(1),
};

let lastAction = { kind: '', at: 0 };
/** Some platforms deliver one press twice (a media key event and the media session action), and held keys repeat. */
function media(name) {
  const kind = name === 'previoustrack' || name === 'nexttrack' ? name : 'playback';
  const now = performance.now();
  if (kind === lastAction.kind && now - lastAction.at < REPEAT_MS) return;
  lastAction = { kind, at: now };
  actions[name]();
}

if (session) {
  for (const name of ['play', 'pause', 'stop', 'previoustrack', 'nexttrack']) {
    try {
      session.setActionHandler(name, () => media(name));
    } catch {
      /* action not supported here */
    }
  }
  // No seeking: lock screens and headphones then offer previous / next instead of 10-second skips.
  for (const name of ['seekbackward', 'seekforward', 'seekto']) {
    try {
      session.setActionHandler(name, null);
    } catch {
      /* action not supported here */
    }
  }
}

const KEYS = { MediaPlayPause: 'playpause', MediaPlay: 'play', MediaPause: 'pause', MediaStop: 'stop', MediaTrackNext: 'nexttrack', MediaTrackPrevious: 'previoustrack' };
addEventListener('keydown', (e) => {
  const name = KEYS[e.key];
  if (!name || !state?.open) return;
  e.preventDefault();
  media(name);
});

// Pauses nobody here asked for (a call, headphones taken out, another app taking the audio): show paused, so
// the next play goes on from there. Our own pauses set `playing` first or disarm before pausing.
audio?.addEventListener('pause', () => {
  const s = state;
  if (s?.playing && s.armed && !audio.ended) setPlaying(false);
});
audio?.addEventListener('play', () => {
  const s = state;
  if (s?.open && s.armed && !s.playing && !s.gated) setPlaying(true);
});

// ---------- checkpoint gates ----------
/** The gate block s.i has been spoken: wait for the reader at its checkpoint. */
function gate(s) {
  if (state !== s) return;
  const quiz = s.gates[s.i];
  s.gated = quiz;
  halt(); // fires 'narration' { playing: false, gated: true }
  savePos(s, s.i + 1);
  const last = s.i + 1 >= s.blocks.length;
  if (s.open) {
    bar.label.innerHTML = '<span>Your turn</span><span class="tts-wide">: checkpoint</span>';
    bar.live.textContent = `Narration paused. Your turn: answer the checkpoint, then ${last ? 'finish' : 'continue listening'}.`;
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
    if (s.open) bar.play.classList.toggle('ready', now);
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
  if (s.open) {
    bar.play.classList.remove('ready');
    bar.live.textContent = '';
  }
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
  if (!s.open) return;
  const b = s.blocks[s.i];
  bar.label.textContent = `${s.i + 1} / ${s.blocks.length}`;
  bar.label.title = `Voice: ${b.voice}`;
  paintSkip(s);
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
      s.armed = true; // from here a pause keeps the place in this clip
      await audio.play();
      return;
    } catch {
      s.armed = false;
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
  // Paused, resumed or cut off from outside (another tab speaking, the system): follow it, keep the place.
  u.onpause = () => state === s && s.speech === u && s.playing && setPlaying(false);
  u.onresume = () => state === s && s.speech === u && !s.playing && setPlaying(true);
  u.onerror = () => {
    if (state !== s || s.speech !== u) return;
    s.speech = null;
    setPlaying(false);
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
  if (state.open) play(i);
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
    const barTop = state.open ? bar.el.getBoundingClientRect().top : innerHeight;
    if (r.top < 64 || r.top > barTop - 80) first.scrollIntoView({ behavior: 'smooth', block: r.height > innerHeight * 0.6 ? 'start' : 'center' });
  }
}
