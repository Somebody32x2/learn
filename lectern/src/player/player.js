/**
 * LecturePlayer: one lecture page (#/l/<lecture>[/<beat>]).
 *
 *   const p = new LecturePlayer(main, { course, entry, next, store, bridge, shell });
 *   await p.mount(beatId?)        loads entry.load(), builds the page, opens the beat (paused) or the title card
 *   p.openBeat(beatId?)           the router: same lecture, another beat (or the title card when empty)
 *   p.play() / p.pause() / p.toggle({ keyboard }) / p.continue()
 *   p.step(±1, { keyboard })      previous / next step (crosses beats)
 *   p.beat(±1, { keyboard })      previous / next beat
 *   p.seekTo(b, n, { animate })   beat b with its first n steps done (n = the next step to run)
 *   p.seekStep(b, k)              show step k of beat b (plays it when playing)
 *   p.setRate(r) / p.setCaptions(on) / p.setSound(on)
 *   p.state → { mode, b, n, shown, steps, running, playing, gated, ready, furthest, len, rate, captions, sound }
 *   p.destroy()
 *
 * Page: `<article class="page">` → `<figure class="lx-figure">` with `h2.fig-title` (beat title, a tutor anchor),
 * `.lx-screen` (the stage, an interlude, or the title / end card) and `.player` (`.caption`, `.count`).
 *
 * Positions: b = beat index (-1 = title card, beats.length = end card); n = steps of beat b already done, which is
 * also the index of the step that runs next (or is running). An interlude counts as one step. Seeking rebuilds a
 * fresh Stage for the beat, runs `scene(s)` and steps < n with `clock.instant = true`, then turns instant off;
 * every build gets its own Stage, so step code of an abandoned build only ever touches its own dead clock.
 *
 * Saves `pos:<lecture>` { beat, step, furthest, done } on every step (plus `total` = beat count and `title` = the
 * beat title, for the course home). Dispatches window 'narration' (via the narrator) on play, pause and gate;
 * pauses on 'learn:pause-narration'. Interludes gate: narration stops after their `say` until Continue.
 */
import { el, frame, reducedMotion, replay } from '../core/dom.js';
import { Stage } from '../core/stage.js';
import { inlineMath } from '../core/mobject.js';
import { renderInterlude } from '../interlude/index.js';
import { bankItems } from '../pages/bank.js';
import { Narrator, captionText } from './narrator.js';
import { Controls, icon, KIND_LABEL, LOCK_HINT, isInterlude } from './controls.js';

const FADE_MS = 320;


export class LecturePlayer {
  constructor(root, { course, entry, next = null, store, bridge = null, shell = null }) {
    this.root = root;
    this.course = course;
    this.entry = entry;
    this.next = next;
    this.store = store;
    this.bridge = bridge;
    this.shell = shell;
    this.id = entry.id;
    this.b = -1;
    this.n = 0;
    this.mode = 'title';
    this.epoch = 0;
    this.loopId = 0;
    this.playing = false;
    this.running = false;
    this.gated = false;
    this.ready = false;
    this.view = null;
    this.destroyed = false;
    this.onPauseRequest = () => this.pause();
  }

  async mount(beatId) {
    this.article = el('article', { class: 'page lx-lecture' }, el('p', { class: 'lx-loading', text: 'Loading the lecture…' }));
    this.root.append(this.article);
    // keys pressed while the lecture loads (before the controls listen) are not lost: the last one is replayed
    this.onEarlyKey = (e) => {
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ') && !e.ctrlKey && !e.metaKey && !e.altKey) this.earlyKey = e;
    };
    addEventListener('keydown', this.onEarlyKey);
    let mod;
    try {
      mod = await this.entry.load();
    } catch (err) {
      console.error(err);
      if (this.destroyed) return;
      this.article.replaceChildren(
        el('div', { class: 'lx-error' },
          el('h1', { text: 'This lecture did not load' }),
          el('p', { text: 'Check your connection and reload the page.' }),
          el('a', { class: 'lx-btn', href: '#/', text: 'Back to the course' })),
      );
      return;
    }
    if (this.destroyed) return;
    this.lecture = mod.default ?? mod;
    this.beats = this.lecture.beats ?? [];

    const prefs = this.store.prefs() ?? {};
    this.rate = Number(prefs.rate) || 1;
    this.captions = prefs.captions !== false;
    this.sound = prefs.sound !== false;
    this.narrator = new Narrator({ voice: this.course.voice, base: 'audio/', rate: this.rate, sound: this.sound });
    await this.narrator.load();
    if (this.destroyed) return this.narrator.destroy();

    this.title = el('h2', { class: 'fig-title', tabindex: '-1' });
    this.screen = el('div', { class: 'lx-screen' });
    this.caption = el('p', { class: 'caption', 'aria-live': 'polite' });
    this.caption.addEventListener('scroll', () => this.markScroll(), { passive: true });
    this.count = el('span', { class: 'count' });
    this.figure = el('figure', { class: ['lx-figure', !this.captions && 'captions-off'] },
      this.title, this.screen, el('div', { class: 'player' }, this.caption, this.count));
    this.article.replaceChildren(this.figure);

    removeEventListener('keydown', this.onEarlyKey);
    this.controls = new Controls(this);
    this.controls.attachGestures(this.screen);
    const outline = el('button', { class: 'lx-icon-btn', type: 'button', 'aria-label': 'Outline and transcript', title: 'Outline', html: icon.list });
    outline.addEventListener('click', () => this.controls.openDrawer(outline));
    this.shell?.setTop({ back: { href: '#/', label: this.course.title }, title: this.lecture.title ?? this.entry.title, actions: [outline] });

    this.narrator.media({
      title: this.lecture.title,
      artist: this.course.title,
      actions: {
        play: () => this.play(),
        pause: () => this.pause(),
        nexttrack: () => this.step(1, { keyboard: true }),
        previoustrack: () => this.step(-1, { keyboard: true }),
      },
    });
    this.narrator.onExternalPause = () => this.pause();
    addEventListener('learn:pause-narration', this.onPauseRequest);
    this.store.visit(this.id);
    this.mounted = true;
    // the router may have asked for another beat of this lecture while it was loading
    await this.openBeat(this.pendingBeat !== undefined ? this.pendingBeat : beatId);
    if (this.earlyKey && !this.destroyed) this.controls.key(this.earlyKey);
    this.earlyKey = null;
  }

  // ---------- state ----------

  get len() {
    return this.beats?.length ?? 0;
  }

  stepsOf(b) {
    const beat = this.beats[b];
    if (!beat) return 0;
    return isInterlude(beat) ? 1 : (beat.steps?.length ?? 0);
  }

  pos() {
    return this.store.get(`pos:${this.id}`);
  }

  get state() {
    const pos = this.pos();
    return {
      mode: this.mode,
      b: this.b,
      n: this.n,
      shown: this.mode === 'scene' ? (this.running ? this.n : this.n - 1) : -1,
      steps: this.stepsOf(this.b),
      running: this.running,
      playing: this.playing,
      gated: this.gated,
      ready: this.ready,
      locked: this.locked,
      furthest: Math.max(pos?.furthest ?? -1, this.b),
      done: Boolean(pos?.done),
      len: this.len,
      rate: this.rate,
      captions: this.captions,
      sound: this.sound,
    };
  }

  /** Saved place worth resuming (not the very start, not the very end). */
  resumable() {
    const pos = this.pos();
    if (!pos || !Number.isInteger(pos.beat) || pos.beat < 0 || pos.beat >= this.len) return null;
    const atStart = pos.beat === 0 && !pos.step;
    const atEnd = pos.beat === this.len - 1 && pos.step >= this.stepsOf(pos.beat);
    return atStart || atEnd ? null : { b: pos.beat, n: Math.min(Math.max(0, pos.step | 0), this.stepsOf(pos.beat)) };
  }

  save() {
    if (this.b < 0 || !this.len) return;
    const prev = this.pos() ?? {};
    const end = this.b >= this.len;
    const beat = end ? this.len - 1 : this.b;
    this.store.put(`pos:${this.id}`, {
      beat,
      step: end ? this.stepsOf(beat) : this.n,
      furthest: Math.max(prev.furthest ?? 0, end ? this.len : this.b),
      // done = every beat really played or answered, then the end reached (not just visiting #/…/end)
      done: Boolean(prev.done) || (end && new Set(prev.seen ?? []).size >= this.len),
      total: this.len,
      title: this.beats[beat]?.title ?? '',
      seen: Array.isArray(prev.seen) ? prev.seen : [],
    });
  }

  emit() {
    this.figure.classList.toggle('is-playing', this.playing);
    this.figure.classList.toggle('is-gated', this.gated);
    this.narrator.setState({ playing: this.playing, gated: this.gated });
    this.controls.update();
  }

  // ---------- routes ----------

  async openBeat(beatId) {
    if (this.destroyed) return;
    if (!this.mounted) {
      this.pendingBeat = beatId ?? null; // mount() opens it when the lecture has loaded
      return;
    }
    this.pause();
    if (!beatId) return this.goto(-1, 0);
    if (beatId === 'end') return this.goto(this.len, 0);
    const b = this.beats.findIndex((beat) => beat.id === beatId);
    if (b < 0) return this.goto(-1, 0);
    const pos = this.pos();
    const n = pos?.beat === b ? Math.min(Math.max(0, pos.step | 0), this.stepsOf(b)) : 0;
    return this.goto(b, n);
  }

  syncUrl() {
    const beat = this.mode === 'end' ? 'end' : this.beats[this.b]?.id;
    const hash = `#/l/${encodeURIComponent(this.id)}${beat ? `/${encodeURIComponent(beat)}` : ''}`;
    if (location.hash !== hash) history.replaceState(history.state, '', hash);
  }

  // ---------- building a position ----------

  /** Shows beat b with n steps done. Cancels running loops; does not start one. */
  async goto(b, n, { animate = false } = {}) {
    this.loopId++;
    const epoch = ++this.epoch;
    this.narrator.stop();
    this.running = false;
    this.gated = false;
    this.ready = false;
    // a button inside the old view had focus (Continue, Skip, an answer): it is about to go away
    const hadFocus = Boolean(this.view?.node.contains(document.activeElement));
    this.leave(animate && !reducedMotion());
    this.b = Math.max(-1, Math.min(this.len, b));
    this.n = Math.max(0, Math.min(n, this.stepsOf(this.b)));
    const beat = this.beats[this.b];
    this.mode = this.b < 0 ? 'title' : this.b >= this.len ? 'end' : isInterlude(beat) ? 'interlude' : 'scene';
    this.figure.dataset.mode = this.mode;
    this.title.innerHTML = inlineMath(
      this.mode === 'title' ? this.lecture.title : this.mode === 'end' ? 'Lecture complete' : beat.title ?? KIND_LABEL[beat.kind] ?? '',
    );
    // an interlude's card carries its own heading: keep this one for the tutor and screen readers only
    this.title.classList.toggle('lx-sr', this.mode === 'interlude');
    if (this.mode === 'scene' && !this.stepsOf(this.b)) this.markSeen(this.b);

    let node;
    if (this.mode === 'title') node = this.titleCard();
    else if (this.mode === 'end') node = this.endCard();
    else if (this.mode === 'interlude') node = this.interludeView(beat, epoch);
    else node = await this.sceneView(beat, this.n, epoch);
    if (epoch !== this.epoch || this.destroyed) return false;
    if (hadFocus) this.title.focus({ preventScroll: true });

    if (animate && !reducedMotion()) {
      node.classList.add('lx-enter');
      frame(true).then(() => node.classList.remove('lx-enter'));
    }
    if (this.mode === 'end') this.playing = false;
    this.paint();
    this.syncUrl();
    this.save();
    this.narrator.media({ title: this.mode === 'scene' || this.mode === 'interlude' ? beat.title ?? this.lecture.title : this.lecture.title, artist: `${this.lecture.title} · ${this.course.title}` });
    this.emit();
    if (animate) this.reveal();
    return true;
  }

  /** The figure's top scrolled out of view (phones, tall interludes): bring it back. */
  reveal() {
    const top = this.figure.getBoundingClientRect().top;
    if (top < 0) this.figure.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  /** Takes the current view off the screen (crossfading out when animate). */
  leave(animate) {
    const v = this.view;
    this.view = null;
    if (!v) return;
    if (v.stage) {
      v.stage.clock.kill();
      v.stage.resize.disconnect();
    }
    try {
      v.interlude?.destroy?.();
    } catch (err) {
      console.error(err);
    }
    if (!animate || !v.node.isConnected) return v.node.remove();
    v.node.classList.add('lx-leave');
    v.node.setAttribute('aria-hidden', 'true');
    v.node.inert = true;
    setTimeout(() => v.node.remove(), FADE_MS + 40);
  }

  mountView(view) {
    this.view = view;
    this.screen.append(view.node);
    return view.node;
  }

  async sceneView(beat, n, epoch) {
    const node = el('div', { class: 'lx-view lx-view-scene' });
    const big = el('button', { class: 'lx-bigplay', type: 'button', tabindex: '-1', 'aria-hidden': 'true', html: icon.play });
    big.addEventListener('click', () => this.play());
    const view = { node, stage: null, refs: {}, beat };
    this.mountView(view); // in the document first: the stage measures its width, scenes measure their mobs
    const stage = new Stage(node, { label: beat.title ?? 'Lecture figure' });
    node.append(big); // above the stage
    stage.clock.rate = this.rate;
    view.stage = stage;
    try {
      view.refs = beat.scene?.(stage) ?? {};
    } catch (err) {
      console.error(`scene of beat "${beat.id}" failed`, err);
    }
    stage.clock.instant = true;
    // Instant tweens settle within microtasks, so the whole replay finishes before the next macrotask; a step
    // that waits on something off the stage clock (a timer, an event) must not hold the seek hostage.
    const replay = (async () => {
      for (let i = 0; i < n && epoch === this.epoch; i++) await runDo(beat.steps[i], stage, view.refs);
    })();
    const settled = await Promise.race([replay.then(() => true), tick().then(() => false)]);
    if (!settled) console.warn(`beat "${beat.id}": a step waits on something off the stage clock; seeking moved on`);
    if (epoch !== this.epoch) return node;
    stage.clock.instant = false;
    return node;
  }

  interludeView(beat, epoch) {
    const key = `${this.id}/${beat.id}`;
    const ctx = {
      store: this.store,
      course: this.course,
      lecture: this.lecture,
      beat,
      key,
      id: `${this.id}.${beat.id}`,
      bridge: this.bridge,
      inLecture: true, // the gate's "Bank it, go on" is the one way to bank from a lecture
      onDone: () => {
        if (epoch !== this.epoch) return;
        this.markReady();
        // the card disables the control that was just used, so focus falls to <body>: hand it to Continue
        requestAnimationFrame(() => {
          const a = document.activeElement;
          if (epoch === this.epoch && (!a || a === document.body)) this.view?.cont?.focus({ preventScroll: true });
        });
      },
      speak: (text) => {
        if (this.running || epoch !== this.epoch) return Promise.resolve(false);
        this.narrator.resume();
        return this.narrator.say(text);
      },
    };
    let rendered = null;
    try {
      rendered = renderInterlude(beat, ctx);
    } catch (err) {
      console.error(`interlude "${beat.id}" failed`, err);
    }
    const cont = el('button', { class: 'lx-btn ghost lx-go-on', type: 'button', html: `<span>${this.b + 1 >= this.len ? 'Finish' : 'Continue'}</span>${icon.arrow}` });
    cont.addEventListener('click', (e) => this.continue({ keyboard: e.detail === 0 }));
    const skippable = beat.kind === 'try' || beat.kind === 'blanks' || beat.kind === 'workout';
    const skip = skippable
      ? el('button', { class: 'lx-btn quiet lx-skip', type: 'button', text: beat.kind === 'workout' ? 'Bank it, go on' : 'Skip' })
      : null;
    skip?.addEventListener('click', (e) => this.skip({ keyboard: e.detail === 0 }));
    // Private mode: an explain-back checkpoint is passed with the tutor (or deferred with "remind me later")
    // before the lecture goes on; `ready` resolving unlocks it.
    const lock = beat.kind === 'explain' && Boolean(this.bridge) && Boolean(rendered);
    const note = el('span', {
      class: 'lx-gate-note',
      text: lock ? LOCK_HINT : beat.kind === 'workout' ? 'Skipped problems wait in the bank.' : 'The lecture waits for you.',
    });
    if (lock) {
      cont.disabled = true;
      cont.setAttribute('aria-describedby', (note.id = `lx-gate-note-${epoch}`));
    }
    const gate = el('div', { class: ['lx-gate', lock && 'locked'] }, note, el('div', { class: 'lx-gate-actions' }, skip, cont));
    const node = el('div', { class: 'lx-view lx-view-interlude' }, rendered?.node ?? el('p', { class: 'lx-error', text: 'This exercise could not be shown.' }), gate);
    this.mountView({ node, interlude: rendered, beat, cont, note, gate, shownAt: performance.now() });
    if (!rendered) this.markReady();
    rendered?.ready?.then(() => epoch === this.epoch && this.markReady(), () => {});
    return node;
  }

  /** On a private explain-back checkpoint that has not been passed (or deferred): the lecture may not go on. */
  get locked() {
    const beat = this.beats?.[this.b];
    return this.mode === 'interlude' && beat?.kind === 'explain' && Boolean(this.bridge) && !this.ready;
  }

  markReady() {
    if (this.ready || !this.view?.cont) return;
    this.ready = true;
    const { cont, gate, note, shownAt } = this.view;
    const wasLocked = cont.disabled || gate.classList.contains('locked');
    cont.disabled = false;
    cont.classList.remove('ghost');
    gate.classList.remove('locked');
    gate.querySelector('.lx-skip')?.remove();
    note.textContent = 'Continue when you are ready.';
    // a live unlock (not a restored answer showing up as the card renders): mark the moment
    if (performance.now() - shownAt > 400 && !reducedMotion()) replay(cont, wasLocked ? 'lx-unlock' : 'lx-ready');
    this.markSeen(this.b);
    this.controls.update();
  }

  /** Records that beat b was really played (a step finished) or answered; `done` needs every beat seen. */
  markSeen(b) {
    if (b < 0 || b >= this.len) return;
    const seen = this.pos()?.seen ?? [];
    if (seen.includes(b)) return;
    this.store.put(`pos:${this.id}`, { seen: [...seen, b].sort((x, y) => x - y) });
  }

  titleCard() {
    const { entry, lecture } = this;
    const resume = this.resumable();
    const done = Boolean(this.pos()?.done);
    const goals = lecture.goals ?? [];
    const start = el('button', { class: 'lx-btn', type: 'button', html: `${icon.play}<span>${resume ? 'Resume' : done ? 'Watch again' : 'Start'}</span>` });
    start.addEventListener('click', () => this.start(resume ? resume.b : 0, resume ? resume.n : 0));
    const over = resume ? el('button', { class: 'lx-btn ghost', type: 'button', text: 'Start from the beginning' }) : null;
    over?.addEventListener('click', () => this.start(0, 0));
    const where = resume ? this.beats[resume.b]?.title : null;
    const node = el('div', { class: 'lx-view lx-card lx-title-card' },
      el('p', { class: 'eyebrow', text: [entry.section, entry.minutes && `${entry.minutes} min`, `${this.len} slides`].filter(Boolean).join(' · ') }),
      entry.summary && el('p', { class: 'lx-card-lede', html: inlineMath(entry.summary) }),
      goals.length > 0 && el('div', { class: 'lx-goals' },
        el('p', { class: 'lx-goals-label', text: 'By the end you can' }),
        el('ul', {}, goals.map((g) => el('li', { html: inlineMath(g) })))),
      el('div', { class: 'lx-card-actions' }, start, over),
      where && el('p', { class: 'lx-card-note', html: `Resumes at ${inlineMath(where)}` }),
    );
    return this.mountView({ node });
  }

  endCard() {
    const banked = bankItems(this.store, this.course).filter((item) => item.lecture === this.id).length;
    const practice = this.beats.filter((beat) => beat.kind === 'try' || beat.kind === 'blanks' || beat.kind === 'workout');
    const answered = practice.filter((beat) => {
      const key = `${this.id}/${beat.id}`;
      const wo = this.store.get(`wo:${key}`);
      return this.store.get(`q:${key}`)?.ok || wo?.status === 'solved' || wo?.everSolved;
    }).length;
    const goals = this.lecture.goals ?? [];
    const again = el('button', { class: 'lx-btn quiet', type: 'button', text: 'Watch again' });
    again.addEventListener('click', () => this.start(0, 0));
    const check = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path pathLength="1" d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>';
    const node = el('div', { class: 'lx-view lx-card lx-end-card' },
      el('p', { class: 'eyebrow', text: this.lecture.title }),
      this.entry.summary && el('p', { class: 'lx-card-lede', html: inlineMath(this.entry.summary) }),
      goals.length > 0 && el('div', { class: 'lx-goals' },
        el('p', { class: 'lx-goals-label', text: 'This lecture covered' }),
        el('ul', { class: 'lx-goals-done' }, goals.map((g, i) => el('li', { style: { '--i': String(i) }, html: `${check}<span>${inlineMath(g)}</span>` })))),
      practice.length > 0 && el('p', { class: 'lx-tally', text: `${answered} of ${practice.length} practice answered · ${banked} in the bank` }),
      banked > 0 && el('a', { class: 'lx-bank-note', href: '#/bank' },
        el('span', { class: 'lx-badge-count', text: String(banked) }),
        el('span', { text: banked === 1 ? 'problem waiting in your bank' : 'problems waiting in your bank' }),
        el('span', { class: 'lx-go', html: icon.arrow })),
      el('div', { class: 'lx-card-actions' },
        this.next
          ? el('a', { class: 'lx-btn', href: `#/l/${encodeURIComponent(this.next.id)}`, html: `<span>Next: ${inlineMath(this.next.title)}</span>${icon.arrow}` })
          : el('a', { class: 'lx-btn', href: '#/', html: `<span>Back to the course</span>${icon.arrow}` }),
        this.next && el('a', { class: 'lx-btn ghost', href: '#/', text: 'Course home' }),
        again),
    );
    return this.mountView({ node });
  }

  // ---------- painting ----------

  paint() {
    const beat = this.beats[this.b];
    let text = '';
    let count = '';
    let upcoming = false;
    if (this.mode === 'scene') {
      const steps = beat.steps ?? [];
      const shown = this.running ? this.n : this.n - 1;
      if (shown < 0 && steps.length) {
        // paused at the start of a beat (reload, deep link, seek): show what comes first, dimmed
        upcoming = true;
        text = steps[0].say ?? '';
        count = `1 / ${steps.length}`;
      } else {
        text = steps[shown]?.say ?? '';
        count = `${Math.max(0, shown + 1)} / ${steps.length}`;
      }
    } else if (this.mode === 'interlude') {
      text = beat.say ?? '';
    }
    this.caption.innerHTML = inlineMath(captionText(text));
    this.caption.classList.toggle('empty', !text);
    this.caption.classList.toggle('upcoming', upcoming);
    this.caption.scrollTop = 0;
    this.count.textContent = count;
    this.markScroll();
    // a beat at its finished state: the paused play hint stays out of the way of what is on the stage
    this.figure.classList.toggle('is-finished', this.mode === 'scene' && !this.running && this.n >= this.stepsOf(this.b));
  }

  /** Caption longer than its box: a fade at the bottom says there is more (gone once scrolled to the end). */
  markScroll() {
    requestAnimationFrame(() => {
      const c = this.caption;
      if (!c?.isConnected) return;
      const more = c.scrollHeight > c.clientHeight + 1;
      c.classList.toggle('scrolls', more);
      c.classList.toggle('at-end', !more || c.scrollTop + c.clientHeight >= c.scrollHeight - 2);
    });
  }

  // ---------- running ----------

  kick() {
    const my = ++this.loopId;
    this.loop(my);
  }

  async loop(my) {
    while (my === this.loopId && this.playing && !this.destroyed) {
      const epoch = this.epoch;
      if (this.mode === 'title') {
        const ok = await this.goto(0, 0, { animate: true });
        return ok && this.playing && this.kick();
      }
      if (this.mode === 'end') {
        this.playing = false;
        return this.emit();
      }
      if (this.mode === 'interlude') return this.runInterlude(my, epoch);
      if (this.n < this.stepsOf(this.b)) {
        if (!(await this.runStep(my, epoch))) return;
        continue;
      }
      const ok = await this.goto(this.b + 1, 0, { animate: true });
      return ok && this.playing && this.mode !== 'end' && this.kick();
    }
  }

  async runStep(my, epoch) {
    const beat = this.beats[this.b];
    const k = this.n;
    const step = beat.steps[k];
    const { stage, refs } = this.view;
    this.running = true;
    this.paint();
    this.save();
    this.controls.update();
    this.narrator.preload(beat.steps[k + 1]?.say ?? firstSay(this.beats[this.b + 1]));
    const [heard] = await Promise.all([this.narrator.say(step.say), runDo(step, stage, refs)]);
    if (my !== this.loopId || epoch !== this.epoch || !heard) return false;
    this.running = false;
    this.n = k + 1;
    this.markSeen(this.b);
    this.save();
    this.figure.classList.toggle('is-finished', this.n >= beat.steps.length);
    this.controls.update();
    return true;
  }

  async runInterlude(my, epoch) {
    const beat = this.beats[this.b];
    this.running = true;
    this.paint();
    this.controls.update();
    this.narrator.preload(firstSay(this.beats[this.b + 1]));
    if (beat.say) {
      const heard = await this.narrator.say(beat.say);
      if (my !== this.loopId || epoch !== this.epoch || !heard) return;
    }
    this.running = false;
    this.gated = true;
    this.playing = false;
    this.emit();
  }

  async start(b, n, { keyboard = false } = {}) {
    this.narrator.unlock();
    this.playing = true;
    this.narrator.resume();
    const ok = await this.goto(b, n, { animate: !keyboard });
    if (ok && this.playing && this.mode !== 'end') this.kick();
  }

  play({ keyboard = false } = {}) {
    if (this.destroyed || !this.mounted) return;
    this.narrator.unlock();
    if (this.mode === 'title') {
      const r = this.resumable();
      return this.start(r ? r.b : 0, r ? r.n : 0, { keyboard });
    }
    if (this.mode === 'end') return this.start(0, 0);
    if (this.gated || (this.mode === 'interlude' && this.ready && !this.running)) return this.continue({ keyboard });
    if (this.playing) return;
    this.playing = true;
    this.narrator.resume();
    this.view?.stage?.clock.resume();
    this.emit();
    if (!this.running) this.kick();
  }

  pause() {
    if (!this.playing || !this.narrator) return;
    this.playing = false;
    this.narrator.pause();
    this.view?.stage?.clock.pause();
    this.emit();
  }

  toggle(opts = {}) {
    if (this.gated || !this.playing) this.play(opts);
    else this.pause();
  }

  /** Past an interlude: on to the next beat, playing. */
  async continue({ keyboard = false } = {}) {
    if (this.mode !== 'interlude') return this.play({ keyboard });
    if (this.locked) return this.controls.announce(LOCK_HINT);
    this.markSeen(this.b); // moving on past it on purpose (answered or skipped) counts as having seen it
    this.narrator.unlock();
    this.playing = true;
    this.narrator.resume();
    const ok = await this.goto(this.b + 1, 0, { animate: !keyboard });
    if (ok && this.playing && this.mode !== 'end') this.kick();
  }

  skip({ keyboard = false } = {}) {
    const beat = this.beats[this.b];
    if (beat?.kind === 'workout') {
      const key = `wo:${this.id}/${beat.id}`;
      const status = this.store.get(key)?.status;
      if (status !== 'solved' && status !== 'revealed') this.store.put(key, { status: 'banked', bankedAt: Date.now() });
    }
    return this.continue({ keyboard });
  }

  // ---------- seeking ----------

  async seekTo(b, n, { animate = false } = {}) {
    if (!this.mounted) return;
    const ok = await this.goto(b, n, { animate });
    if (ok && this.playing && this.mode !== 'end') {
      this.narrator.resume();
      this.kick();
    }
  }

  /** Show step k of beat b: playing runs it, paused shows it done. */
  seekStep(b, k, { animate = false } = {}) {
    const last = this.stepsOf(b);
    return this.seekTo(b, this.playing ? k : Math.min(k + 1, last), { animate });
  }

  /**
   * Previous / next step, relative to the step on screen: playing, the running step (n); paused, the last one
   * shown (n − 1, or n when paused in the middle of step n). Always acts at once: the current step's
   * animations jump to their end in the rebuilt scene and its narration stops.
   */
  step(dir, { keyboard = false } = {}) {
    if (!this.mounted) return;
    const animate = !keyboard;
    if (this.mode === 'title') return dir > 0 ? this.seekTo(0, 0, { animate }) : undefined;
    if (this.mode === 'end') return dir < 0 ? this.seekTo(this.len - 1, this.lastN(this.len - 1), { animate }) : undefined;
    if (this.mode === 'interlude') {
      if (dir > 0) {
        if (this.locked) return this.controls.announce(LOCK_HINT);
        return this.gated || this.playing ? this.continue({ keyboard }) : this.seekTo(this.b + 1, 0, { animate });
      }
      return this.b > 0 ? this.seekTo(this.b - 1, this.lastN(this.b - 1), { animate }) : this.seekTo(-1, 0, { animate });
    }
    const base = this.running && !this.playing ? this.n + 1 : this.n;
    const target = base + dir;
    if (target < 0) return this.b > 0 ? this.seekTo(this.b - 1, this.lastN(this.b - 1), { animate }) : this.seekTo(-1, 0, { animate });
    if (target > this.stepsOf(this.b)) return this.seekTo(this.b + 1, 0, { animate });
    return this.seekTo(this.b, target);
  }

  /** Where "previous" lands in beat b: its last step (running it when playing, shown done when paused). */
  lastN(b) {
    if (b < 0) return 0;
    if (isInterlude(this.beats[b])) return 0;
    const steps = this.stepsOf(b);
    return this.playing ? Math.max(0, steps - 1) : steps;
  }

  beat(dir, { keyboard = false } = {}) {
    if (!this.mounted) return;
    if (dir > 0 && this.locked) return this.controls.announce(LOCK_HINT);
    const from = this.mode === 'title' ? -1 : this.mode === 'end' ? this.len : this.b;
    const b = Math.max(-1, Math.min(this.len - 1, from + dir));
    if (b === this.b && this.mode !== 'end') return;
    return this.seekTo(b, 0, { animate: !keyboard });
  }

  // ---------- preferences ----------

  setRate(r) {
    this.rate = r;
    this.narrator.rate = r;
    if (this.view?.stage) this.view.stage.clock.rate = r;
    this.store.setPrefs({ rate: r });
    this.controls.update();
  }

  setCaptions(on) {
    this.captions = Boolean(on);
    this.figure.classList.toggle('captions-off', !this.captions);
    this.store.setPrefs({ captions: this.captions });
    this.controls.update();
  }

  setSound(on) {
    this.sound = Boolean(on);
    this.narrator.sound = this.sound;
    this.store.setPrefs({ sound: this.sound });
    this.controls.update();
  }

  destroy() {
    this.destroyed = true;
    this.loopId++;
    this.epoch++;
    removeEventListener('learn:pause-narration', this.onPauseRequest);
    removeEventListener('keydown', this.onEarlyKey);
    if (this.figure) this.leave(false);
    this.controls?.destroy();
    this.narrator?.destroy();
    this.store.flush?.();
    this.shell?.setTop({});
    this.article?.remove();
  }
}

/** Runs a step's `do` (nothing, a Promise, or an array of Promises); never rejects. */
function runDo(step, stage, refs) {
  try {
    const r = step?.do?.(stage, refs);
    return (Array.isArray(r) ? Promise.all(r) : Promise.resolve(r)).catch((err) => console.error(err));
  } catch (err) {
    console.error(err);
    return Promise.resolve();
  }
}

const firstSay = (beat) => (beat ? (isInterlude(beat) ? beat.say : beat.steps?.[0]?.say) : null);
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
