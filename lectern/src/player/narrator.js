/**
 * Narrator: speaks one step's `say` at a time and resolves when it has been heard.
 *
 * Sources: the recorded clip `audio/<clipKey(voice, say)>.mp3` listed in `audio/index.json`
 * ({ voice, clips: { key: seconds } }; a missing index means no clips). A course with recordings uses timed captions
 * (≈ 2.7 words/s ÷ rate + 400 ms) for a step whose clip is missing, never a second voice. A course without any
 * recordings uses the browser's speechSynthesis (English voice, sound on) until it fails to start once, then timed
 * captions. Sound off is always timed captions.
 * Clips play through one reused <audio> element (playbackRate, preservesPitch); the next clip is fetched ahead
 * as a blob (preload), so the service worker caches it and playback starts without a gap.
 *
 *   const n = new Narrator({ voice, base: 'audio/', rate, sound });
 *   await n.load();                        index.json (never throws)
 *   n.say(text) → Promise<boolean>         true when heard to the end, false when stopped (seek, new say)
 *   n.pause() / n.resume() / n.stop()      a pending say stays pending while paused
 *   n.rate = 1.25; n.sound = false;        live
 *   n.preload(text)                        fetch the clip of an upcoming say
 *   n.unlock()                             call inside a click: unlocks audio playback on iOS
 *   n.setState({ playing, gated })         dispatches window 'narration' { detail: { playing, gated } } and
 *                                          updates the Media Session playback state
 *   n.media({ title, artist, actions })    Media Session metadata + handlers (play, pause, nexttrack, previoustrack)
 *   n.onExternalPause = fn                 called when the OS / another app paused a playing clip
 *   n.destroy()
 *
 * Helpers: spokenText(say) (what the voice reads: `$tex${words}` → words, other `$…$` dropped) and
 * captionText(say) (what the caption shows: `$tex${words}` → `$tex$`, for inlineMath).
 */
import { clipKey } from '../core/hash.js';

const WPS = 2.7;
const SPEECH_START_MS = 2500; // speechSynthesis that has not started by then is not coming
const BLOB_CACHE = 8;
// A few samples of silence: played inside a click, it unlocks the audio element for the clips that follow (iOS).
const SILENCE = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA';

/** What the voice reads. */
export function spokenText(say) {
  return String(say ?? '')
    .replace(/\$([^$]+)\$\{([^}]*)\}/g, '$2')
    .replace(/\$[^$]*\$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** What the caption shows (TeX kept as $…$ for inlineMath, spoken words dropped). */
export function captionText(say) {
  return String(say ?? '').replace(/(\$[^$]+\$)\{[^}]*\}/g, '$1');
}

/** Timed-caption duration of a text at a rate, in ms. */
export function timedMs(text, rate = 1) {
  const words = spokenText(text).split(/\s+/).filter(Boolean).length;
  return (words / WPS / rate) * 1000 + 400;
}

export class Narrator {
  constructor({ voice = '', base = 'audio/', rate = 1, sound = true } = {}) {
    this.voice = voice;
    this.base = base;
    this._rate = rate;
    this._sound = sound;
    this.clips = {};
    this.job = null;
    this.paused = false;
    this.blobs = new Map(); // key → Promise<object URL | null>
    this.audio = typeof Audio === 'function' ? new Audio() : null;
    /** Called when something other than us paused a playing clip (a call, headphones out, the OS media UI). */
    this.onExternalPause = null;
    if (this.audio) {
      this.audio.preload = 'auto';
      this.audio.preservesPitch = true;
      this.audio.webkitPreservesPitch = true;
      this.audio.addEventListener('playing', () => {
        if (this.job?.mode === 'clip') this.job.audioPlaying = true;
      });
      this.audio.addEventListener('pause', () => {
        const job = this.job;
        // our own pauses set `paused` first (pause) or end / re-mode the job first (stop, silence, toTimed)
        if (!job || job.mode !== 'clip' || !job.audioPlaying || this.paused || this.audio.ended) return;
        this.onExternalPause?.();
      });
    }
    this.synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
    this.state = { playing: false, gated: false };
    this.session = typeof navigator !== 'undefined' && 'mediaSession' in navigator ? navigator.mediaSession : null;
    this.pickVoice();
    if (this.synth) this.synth.addEventListener?.('voiceschanged', (this.onVoices = () => this.pickVoice()));
  }

  async load() {
    try {
      const res = await fetch(`${this.base}index.json`, { cache: 'no-cache' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data.clips === 'object') this.clips = data.clips;
    } catch {
      /* no recordings (or offline and never fetched): speech or timed captions */
    }
  }

  get rate() {
    return this._rate;
  }
  set rate(r) {
    const job = this.job;
    if (job?.mode === 'timed' && !this.paused && job.timer) {
      // keep the part already shown; rescale what is left
      const left = Math.max(0, job.remaining - (performance.now() - job.startedAt));
      clearTimeout(job.timer);
      job.remaining = (left * this._rate) / r;
      this._rate = r;
      this.armTimer(job);
      return;
    }
    this._rate = r;
    if (this.audio) this.audio.playbackRate = r;
  }

  get sound() {
    return this._sound;
  }
  set sound(on) {
    this._sound = Boolean(on);
    const job = this.job;
    if (!on && job && job.mode !== 'timed') {
      // finish the current sentence silently, on the clock of the captions
      const left = this.leftMs(job);
      this.silence(job);
      this.timed(job, left);
    }
  }

  has(text) {
    return this.clips[clipKey(this.voice, text)] != null;
  }

  url(key) {
    return `${this.base}${key}.mp3`;
  }

  /** Fetch an upcoming clip whole (cacheable by the service worker) and keep it as an object URL. */
  preload(text) {
    if (!text || !this._sound) return;
    const key = clipKey(this.voice, text);
    if (this.clips[key] == null || this.blobs.has(key)) return;
    this.blobs.set(
      key,
      fetch(this.url(key))
        .then((res) => (res.ok ? res.blob() : null))
        .then((blob) => (blob ? URL.createObjectURL(blob) : null))
        .catch(() => null),
    );
    while (this.blobs.size > BLOB_CACHE) {
      const [oldest, url] = this.blobs.entries().next().value;
      this.blobs.delete(oldest);
      url.then((u) => u && u !== this.audio?.src && URL.revokeObjectURL(u));
    }
  }

  unlock() {
    const a = this.audio;
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.synth && typeof SpeechSynthesisUtterance === 'function' && !this.job) {
      try {
        this.synth.speak(new SpeechSynthesisUtterance(' '));
      } catch {}
    }
    if (!a || this.job?.mode === 'clip') return;
    a.src = SILENCE;
    a.play().catch(() => {});
  }

  /** Speak one text. Resolves true at its end, false when stopped. */
  say(text) {
    this.stop();
    return new Promise((resolve) => {
      const job = { text, mode: null, resolve, timer: 0, remaining: 0, startedAt: 0, utter: null, pending: true, startTimer: 0 };
      this.job = job;
      if (!this.paused) this.begin(job);
    });
  }

  begin(job) {
    job.pending = false;
    if (!spokenText(job.text)) return this.timed(job, 400);
    const key = clipKey(this.voice, job.text);
    if (this._sound && this.audio && this.clips[key] != null) return this.clip(job, key);
    // One voice per lecture: a course with recordings never switches to the browser's voice for a missing clip
    // (timed captions instead); speech only stands in when there are no recordings at all, and not once it failed.
    const recorded = Object.keys(this.clips).length > 0;
    if (this._sound && !recorded && !this.speechBroken && this.synth && typeof SpeechSynthesisUtterance === 'function') return this.speak(job);
    return this.timed(job, timedMs(job.text, this._rate));
  }

  finish(job, ok) {
    if (this.job !== job) return;
    this.job = null;
    clearTimeout(job.timer);
    clearTimeout(job.startTimer);
    if (this.audio) this.audio.onended = this.audio.onerror = null;
    job.resolve(ok);
  }

  // ---- clip ----
  async clip(job, key) {
    job.mode = 'clip';
    const a = this.audio;
    const blob = this.blobs.get(key);
    let src = this.url(key);
    if (blob) {
      const u = await blob;
      if (this.job !== job) return;
      if (u) src = u;
    }
    a.onended = () => this.finish(job, true);
    a.onerror = () => this.job === job && job.mode === 'clip' && this.toTimed(job);
    a.src = src;
    a.playbackRate = this._rate;
    a.preservesPitch = true;
    if (this.paused) return; // resume() plays it
    this.playAudio(job);
  }

  playAudio(job) {
    this.audio.play().catch((err) => {
      if (this.job !== job || job.mode !== 'clip' || this.paused || err?.name === 'AbortError') return;
      this.toTimed(job); // autoplay refused or the file is unusable: captions carry on
    });
  }

  toTimed(job) {
    const left = this.leftMs(job);
    this.silence(job);
    this.timed(job, left);
  }

  // ---- speechSynthesis ----
  pickVoice() {
    const voices = this.synth?.getVoices?.() ?? [];
    const en = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
    // On-device voices first (network voices stall or cut out), then US English, then the better-sounding names.
    const score = (v) => (v.localService ? 8 : 0) + (/en-US/i.test(v.lang) ? 4 : 0) + (/natural|neural|google|samantha|daniel/i.test(v.name) ? 2 : 0);
    this.speechVoice = en.sort((a, b) => score(b) - score(a))[0] ?? null;
  }

  speak(job) {
    job.mode = 'speech';
    const u = new SpeechSynthesisUtterance(spokenText(job.text));
    u.lang = this.speechVoice?.lang ?? 'en-US';
    if (this.speechVoice) u.voice = this.speechVoice;
    u.rate = this._rate;
    job.utter = u;
    job.spokeAt = performance.now();
    u.onstart = () => {
      // started: now watch for an utterance that never ends (engines drop `end` events)
      clearTimeout(job.startTimer);
      job.startTimer = setTimeout(() => {
        if (this.job !== job || job.utter !== u || this.paused) return;
        job.utter = null;
        this.synth.cancel();
        this.finish(job, true);
      }, timedMs(job.text, this._rate) * 1.5 + 2000);
    };
    u.onend = () => job.utter === u && this.finish(job, true);
    u.onerror = (e) => {
      if (job.utter !== u || this.job !== job) return;
      if (e.error === 'interrupted' || e.error === 'canceled') return; // ours (pause, stop)
      job.utter = null;
      this.timed(job, timedMs(job.text, this._rate)); // e.g. 'not-allowed' before any click
    };
    clearTimeout(job.startTimer);
    job.startTimer = setTimeout(() => {
      if (this.job !== job || job.utter !== u || this.paused) return;
      // the engine never started: remember it (no more 2.5 s waits per step) and caption the rest of this one
      this.speechBroken = true;
      job.utter = null;
      this.synth.cancel();
      this.timed(job, Math.max(400, timedMs(job.text, this._rate) - SPEECH_START_MS));
    }, SPEECH_START_MS);
    this.synth.cancel();
    this.synth.speak(u);
  }

  // ---- timed ----
  timed(job, ms) {
    job.mode = 'timed';
    job.remaining = ms;
    if (!this.paused) this.armTimer(job);
  }

  armTimer(job) {
    job.startedAt = performance.now();
    clearTimeout(job.timer);
    job.timer = setTimeout(() => this.finish(job, true), job.remaining);
  }

  /** Estimated ms left of the current job (to hand over to timed captions). */
  leftMs(job) {
    const total = timedMs(job.text, this._rate);
    if (job.mode === 'clip' && this.audio?.duration) {
      const frac = this.audio.currentTime / this.audio.duration;
      return Math.max(300, ((1 - frac) * this.audio.duration * 1000) / this._rate);
    }
    if (job.mode === 'timed') return Math.max(0, job.remaining - (this.paused ? 0 : performance.now() - job.startedAt));
    if (job.mode === 'speech' && job.spokeAt) return Math.max(300, total - (performance.now() - job.spokeAt));
    return total;
  }

  /** Silence whatever is sounding for this job (keeps the job). */
  silence(job) {
    clearTimeout(job.startTimer);
    if (job.mode === 'clip' && this.audio) {
      this.audio.onended = this.audio.onerror = null;
      this.audio.pause();
    }
    if (job.mode === 'speech' && this.synth) {
      job.utter = null;
      this.synth.cancel();
    }
  }

  // ---- transport ----
  pause() {
    if (this.paused) return;
    this.paused = true;
    const job = this.job;
    if (!job || job.pending) return;
    if (job.mode === 'clip') this.audio.pause();
    else if (job.mode === 'speech') {
      // speechSynthesis.pause() is unreliable (Android, Linux): cancel and say the sentence again on resume
      job.utter = null;
      clearTimeout(job.startTimer);
      this.synth.cancel();
    } else if (job.mode === 'timed') {
      clearTimeout(job.timer);
      job.remaining = Math.max(0, job.remaining - (performance.now() - job.startedAt));
    }
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    const job = this.job;
    if (!job) return;
    if (job.pending) return this.begin(job);
    if (job.mode === 'clip') this.playAudio(job);
    else if (job.mode === 'speech') {
      if (this._sound) this.speak(job);
      else this.timed(job, timedMs(job.text, this._rate));
    } else if (job.mode === 'timed') this.armTimer(job);
  }

  /** Ends the current say (it resolves false). Keeps the paused flag. */
  stop() {
    const job = this.job;
    if (!job) return;
    this.silence(job);
    this.finish(job, false);
  }

  // ---- events, Media Session ----
  setState({ playing = false, gated = false } = {}) {
    this.state = { playing, gated };
    if (this.session) this.session.playbackState = playing ? 'playing' : 'paused';
    dispatchEvent(new CustomEvent('narration', { detail: { playing, gated } }));
  }

  media({ title, artist, actions } = {}) {
    const s = this.session;
    if (!s) return;
    try {
      if (typeof MediaMetadata === 'function') {
        const artwork = [{ src: new URL('../icons/icon-512.png', document.baseURI).href, sizes: '512x512', type: 'image/png' }];
        s.metadata = new MediaMetadata({ title: title ?? '', artist: artist ?? '', artwork });
      }
    } catch {}
    if (!actions) return;
    for (const name of ['play', 'pause', 'nexttrack', 'previoustrack']) {
      try {
        s.setActionHandler(name, actions[name] ?? null);
      } catch {
        /* action not supported here */
      }
    }
    // No seeking: lock screens and headphones then offer previous / next step instead of 10-second skips.
    for (const name of ['seekbackward', 'seekforward', 'seekto']) {
      try {
        s.setActionHandler(name, null);
      } catch {}
    }
  }

  destroy() {
    this.stop();
    this.audio?.pause();
    this.audio?.removeAttribute('src');
    if (this.synth && this.onVoices) this.synth.removeEventListener?.('voiceschanged', this.onVoices);
    for (const url of this.blobs.values()) url.then((u) => u && URL.revokeObjectURL(u));
    this.blobs.clear();
    if (this.session) {
      for (const name of ['play', 'pause', 'nexttrack', 'previoustrack']) {
        try {
          this.session.setActionHandler(name, null);
        } catch {}
      }
      this.session.metadata = null;
      this.session.playbackState = 'none';
    }
    if (this.state.playing || this.state.gated) dispatchEvent(new CustomEvent('narration', { detail: { playing: false, gated: false } }));
  }
}
