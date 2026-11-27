/**
 * The lecture's controls: the fixed control bar (`body > .tts-bar`), the outline / transcript drawer, keyboard
 * shortcuts and stage gestures. A view over a LecturePlayer (player.js); every action calls the player.
 *
 *   const c = new Controls(player);    builds the bar + drawer and listens for keys
 *   c.update()                         repaint from player.state (the player calls it on every change)
 *   c.attachGestures(node)             swipe left / right = next / previous step, tap = play / pause
 *   c.openDrawer(opener?) / c.closeDrawer()
 *   c.destroy()
 *
 * Bar: previous step, play / pause (Continue at an interlude), next step, a segmented beat scrubber (one
 * segment per beat, interludes as small icons; tap or drag to seek; beat-title tooltip on fine pointers; a
 * role=slider whose arrows move by beat), speed menu, captions, sound, outline. Phones: full width, two rows,
 * safe-area padding; ≥ 900 px: a floating pill.
 * Keys: Space play / pause, ← / → step, Shift+← / → beat, C captions, M sound. Keyboard actions do not animate.
 *
 * Also exports the shared icon set `icon`, `KIND_LABEL` and `isInterlude(beat)`.
 */
import { el, haptic } from '../core/dom.js';
import { inlineMath } from '../core/mobject.js';
import { captionText } from './narrator.js';

const S = (d, extra = '') => `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"${extra}>${d}</svg>`;
export const icon = {
  play: S('<path class="fill" d="M4.75 2.9v10.2c0 .5.55.8.97.53l7.9-5.1a.63.63 0 0 0 0-1.06l-7.9-5.1a.63.63 0 0 0-.97.53z"/>'),
  pause: S('<rect class="fill" x="3.75" y="2.75" width="3" height="10.5" rx=".8"/><rect class="fill" x="9.25" y="2.75" width="3" height="10.5" rx=".8"/>'),
  prev: S('<path d="M12 3.5 6.5 8l5.5 4.5M4 3.5v9"/>'),
  next: S('<path d="M4 3.5 9.5 8 4 12.5M12 3.5v9"/>'),
  arrow: S('<path d="M3 8h10M9 4l4 4-4 4"/>'),
  back: S('<path d="M13 8H3M7 4 3 8l4 4"/>'),
  list: S('<path d="M6 4h7.5M6 8h7.5M6 12h7.5M2.75 4h.01M2.75 8h.01M2.75 12h.01"/>'),
  close: S('<path d="m4 4 8 8M12 4l-8 8"/>'),
  check: S('<path d="M3.5 8.5 6.5 11.5 12.5 4.5"/>'),
  cc: S('<rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2"/><path d="M7 6.5a1.75 1.75 0 1 0 0 3M11.25 6.5a1.75 1.75 0 1 0 0 3"/>'),
  sound: S('<path d="M2.5 6v4h2.5l3.5 3V3L5 6z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6.3 6.3 0 0 1 0 9"/>'),
  muted: S('<path d="M2.5 6v4h2.5l3.5 3V3L5 6z"/><path d="m11 6 3.5 4M14.5 6 11 10"/>'),
  try: S('<path d="M10.5 2.5 13.5 5.5 5.5 13.5H2.5v-3z"/>'),
  blanks: S('<path d="M2 5h12M2 11h3.5M10.5 11H14M7 11h2"/>'),
  workout: S('<path d="M4 1.75h5.5L12.5 4.75v9.5H4z"/><path d="M9.25 1.75v3.25h3.25M6 8.5h4.5M6 11h3"/>'),
  explain: S('<path d="M2.5 3.25h11v7.5h-6L4.5 13.25v-2.5h-2z"/>'),
  scene: S('<rect x="1.75" y="3" width="12.5" height="10" rx="1.5"/>'),
  dot: S('<circle class="fill" cx="8" cy="8" r="3"/>'),
};

export const KIND_LABEL = { try: 'Your turn', blanks: 'Fill in the blanks', workout: 'Work it out', explain: 'Explain it back' };
export const isInterlude = (beat) => Boolean(beat && KIND_LABEL[beat.kind]);
export const RATES = [0.75, 1, 1.25, 1.5, 1.75];
/** Shown while a private explain-back checkpoint holds the lecture (player.locked). */
export const LOCK_HINT = 'Explain it to the tutor to continue \u2014 or choose \u2018remind me later\u2019.';
const SWIPE_PX = 48;
const TAP_PX = 10;
const rateText = (r) => `${r}×`;
const typing = (t) => t?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');

export class Controls {
  constructor(player) {
    this.player = player;
    this.beats = player.beats;
    this.buildBar();
    this.buildDrawer();
    this.onKey = (e) => this.key(e);
    this.onDocDown = (e) => {
      if (this.menuOpen && !this.speedWrap.contains(e.target)) this.closeMenu();
    };
    document.addEventListener('keydown', this.onKey);
    document.addEventListener('pointerdown', this.onDocDown, true);
    document.body.classList.add('has-tts-bar');
  }

  // ---------- bar ----------

  buildBar() {
    const p = this.player;
    const btn = (cls, label, html, fn) => {
      const b = el('button', { class: ['tts-btn', cls], type: 'button', 'aria-label': label, title: label, html });
      b.addEventListener('click', (e) => fn(e));
      return b;
    };
    this.prev = btn('tts-prev', 'Previous step', icon.prev, (e) => p.step(-1, { keyboard: e.detail === 0 }));
    this.playBtn = btn('tts-play', 'Play', icon.play, (e) => p.toggle({ keyboard: e.detail === 0 }));
    this.nextBtn = btn('tts-next', 'Next step', icon.next, (e) => p.step(1, { keyboard: e.detail === 0 }));
    this.speedBtn = el('button', { class: 'tts-btn tts-speed', type: 'button', 'aria-label': 'Speed', title: 'Speed', 'aria-haspopup': 'menu', 'aria-expanded': 'false' });
    this.speedBtn.addEventListener('click', () => (this.menuOpen ? this.closeMenu() : this.openMenu()));
    this.menu = el('div', { class: 'tts-menu', role: 'menu', 'aria-label': 'Narration speed', hidden: true },
      RATES.map((r) => {
        const item = el('button', { class: 'tts-menu-item', type: 'button', role: 'menuitemradio', 'aria-checked': 'false', dataset: { rate: String(r) }, text: rateText(r) });
        item.addEventListener('click', () => {
          p.setRate(r);
          this.closeMenu(true);
        });
        return item;
      }));
    this.menu.addEventListener('keydown', (e) => this.menuKey(e));
    this.speedWrap = el('div', { class: 'tts-speed-wrap' }, this.speedBtn, this.menu);
    this.ccBtn = btn('tts-cc', 'Captions', icon.cc, () => p.setCaptions(!p.captions));
    this.soundBtn = btn('tts-sound', 'Sound', icon.sound, () => p.setSound(!p.sound));
    this.outlineBtn = btn('tts-outline', 'Outline and transcript', icon.list, () => this.openDrawer(this.outlineBtn));

    this.segs = this.beats.map((beat, i) => {
      const inter = isInterlude(beat);
      const seg = el('span', {
        class: ['seg', inter && 'seg-i'],
        style: inter ? undefined : { flexGrow: String(Math.max(1, beat.steps?.length ?? 1)) },
        dataset: { i: String(i) },
        html: inter ? icon[beat.kind] : '<span class="seg-fill"></span>',
      });
      return seg;
    });
    this.tip = el('span', { class: 'tts-tip', 'aria-hidden': 'true' });
    this.head = el('span', { class: 'tts-head', 'aria-hidden': 'true' });
    this.scrub = el('div', { class: 'tts-scrub', role: 'slider', tabindex: '0', 'aria-label': 'Slide', 'aria-valuemin': '0', 'aria-valuemax': String(this.beats.length) },
      el('div', { class: 'tts-segs' }, this.segs), this.head, this.tip);
    this.wireScrub();
    this.live = el('span', { class: 'tts-sr', 'aria-live': 'polite' });

    this.bar = el('div', { class: 'tts-bar', role: 'region', 'aria-label': 'Lecture controls' },
      this.scrub,
      el('div', { class: 'tts-group tts-left' }, this.speedWrap, this.ccBtn),
      el('div', { class: 'tts-group tts-main' }, this.prev, this.playBtn, this.nextBtn),
      el('div', { class: 'tts-group tts-right' }, this.soundBtn, this.outlineBtn),
      this.live);
    document.body.append(this.bar);
  }

  update() {
    const st = this.player.state;
    const { mode, b, n, steps, running, playing, gated, ready, locked, furthest, len } = st;

    // play / continue
    const cont = gated || (mode === 'interlude' && ready && !playing && !running);
    this.bar.classList.toggle('gated', cont);
    this.playBtn.classList.toggle('wide', cont);
    this.playBtn.classList.toggle('ready', cont && ready);
    if (cont) {
      const last = b + 1 >= len;
      this.playBtn.innerHTML = `<span>${last ? 'Finish' : 'Continue'}</span>${icon.arrow}`;
      this.setLabel(this.playBtn, locked ? LOCK_HINT : last ? 'Finish the lecture' : 'Continue the lecture');
    } else {
      this.playBtn.innerHTML = playing ? icon.pause : icon.play;
      this.setLabel(this.playBtn, playing ? 'Pause' : mode === 'title' ? 'Start the lecture' : 'Play');
    }
    this.playBtn.disabled = cont && locked;
    if (this.wasGated !== gated) {
      this.live.textContent = !gated ? '' : locked ? `Narration paused. ${LOCK_HINT}` : 'Narration paused for this exercise. Continue when you are ready.';
      this.wasGated = gated;
    }
    this.prev.disabled = mode === 'title';
    this.nextBtn.disabled = mode === 'end' || locked;
    this.setLabel(this.nextBtn, locked ? LOCK_HINT : 'Next step');

    // scrubber
    this.segs.forEach((seg, i) => {
      let frac = 0;
      if (mode === 'end' || i < b) frac = 1;
      else if (i === b) frac = steps ? Math.min(1, (n + (running ? 1 : 0)) / steps) : 1;
      seg.classList.toggle('current', i === b && mode !== 'end');
      seg.classList.toggle('done', frac >= 1 && i !== b);
      seg.classList.toggle('seen', i <= furthest);
      seg.style.setProperty('--fill', String(frac));
    });
    const beat = this.beats[b];
    this.scrub.setAttribute('aria-valuenow', String(Math.max(0, Math.min(len, b + 1))));
    this.scrub.setAttribute('aria-valuetext',
      mode === 'title' ? 'Title' : mode === 'end' ? 'End' : `${b + 1} of ${len}: ${plain(beat?.title ?? KIND_LABEL[beat?.kind] ?? '')}`);

    // preferences
    this.speedBtn.textContent = rateText(st.rate);
    this.setLabel(this.speedBtn, `Speed ${rateText(st.rate)}`);
    for (const item of this.menu.children) item.setAttribute('aria-checked', String(Number(item.dataset.rate) === st.rate));
    this.ccBtn.setAttribute('aria-pressed', String(st.captions));
    this.setLabel(this.ccBtn, st.captions ? 'Hide captions (C)' : 'Show captions (C)');
    this.soundBtn.setAttribute('aria-pressed', String(st.sound));
    this.soundBtn.innerHTML = st.sound ? icon.sound : icon.muted;
    this.setLabel(this.soundBtn, st.sound ? 'Mute narration (M)' : 'Turn narration sound on (M)');

    if (this.drawer.open) this.renderDrawer();
  }

  /** Says something to screen readers (a blocked action). */
  announce(text) {
    this.live.textContent = '';
    requestAnimationFrame(() => (this.live.textContent = text));
  }

  setLabel(node, label) {
    node.setAttribute('aria-label', label);
    node.title = label;
  }

  // ---------- speed menu ----------

  openMenu() {
    this.menuOpen = true;
    this.menu.hidden = false;
    this.speedBtn.setAttribute('aria-expanded', 'true');
    const current = [...this.menu.children].find((i) => i.getAttribute('aria-checked') === 'true') ?? this.menu.firstElementChild;
    current.focus({ preventScroll: true });
  }

  closeMenu(refocus = false) {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    this.menu.hidden = true;
    this.speedBtn.setAttribute('aria-expanded', 'false');
    if (refocus) this.speedBtn.focus({ preventScroll: true });
  }

  menuKey(e) {
    const items = [...this.menu.children];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu(true);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    } else if (e.key === 'Tab') this.closeMenu();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') e.stopPropagation();
  }

  // ---------- scrubber ----------

  /** Beat and step under a client x. */
  at(x) {
    const rects = this.segs.map((s) => s.getBoundingClientRect());
    let i = rects.findIndex((r) => x < r.right);
    if (i < 0) i = rects.length - 1;
    const r = rects[i];
    const beat = this.beats[i];
    const steps = isInterlude(beat) ? 0 : (beat.steps?.length ?? 0);
    const frac = Math.min(1, Math.max(0, (x - r.left) / Math.max(1, r.width)));
    const n = steps ? Math.min(steps - 1, Math.floor(frac * steps)) : 0;
    return { b: i, n, steps };
  }

  showTip(x, withHead) {
    const box = this.scrub.getBoundingClientRect();
    const { b, n, steps } = this.at(x);
    const beat = this.beats[b];
    const left = Math.min(box.width, Math.max(0, x - box.left));
    this.tip.innerHTML = `<span class="tts-tip-n">${b + 1}</span>${inlineMath(beat.title ?? KIND_LABEL[beat.kind] ?? '')}${steps ? `<span class="tts-tip-step">${n + 1}/${steps}</span>` : ''}`;
    this.tip.style.setProperty('--x', `${left}px`);
    this.head.style.setProperty('--x', `${left}px`);
    this.scrub.classList.add('tipping');
    this.scrub.classList.toggle('dragging', withHead);
  }

  hideTip() {
    this.scrub.classList.remove('tipping', 'dragging');
  }

  wireScrub() {
    const s = this.scrub;
    let drag = null;
    s.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      e.preventDefault();
      drag = { id: e.pointerId };
      s.setPointerCapture(e.pointerId);
      this.showTip(e.clientX, true);
    });
    s.addEventListener('pointermove', (e) => {
      if (drag) this.showTip(e.clientX, true);
      else if (e.pointerType === 'mouse') this.showTip(e.clientX, false);
    });
    const end = (e, seek) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      this.hideTip();
      if (!seek) return;
      const { b, n } = this.at(e.clientX);
      haptic();
      const p = this.player;
      const animate = b !== p.b;
      // the step under the pointer is the one shown: paused shows it done, playing runs it
      if (isInterlude(this.beats[b])) p.seekTo(b, 0, { animate });
      else p.seekStep(b, n, { animate });
    };
    s.addEventListener('pointerup', (e) => end(e, true));
    s.addEventListener('pointercancel', (e) => end(e, false));
    s.addEventListener('pointerleave', () => !drag && this.hideTip());
    s.addEventListener('keydown', (e) => {
      const p = this.player;
      const k = e.key;
      let to = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') to = (p.mode === 'end' ? p.len : p.b) - 1;
      else if (k === 'ArrowRight' || k === 'ArrowUp') to = (p.mode === 'title' ? -1 : p.b) + 1;
      else if (k === 'Home') to = 0;
      else if (k === 'End') to = p.len - 1;
      if (to === null) return;
      e.preventDefault();
      e.stopPropagation();
      // stepping on past a held checkpoint is blocked; jumping (Home / End, pointer, outline) is not
      if (p.locked && (k === 'ArrowRight' || k === 'ArrowUp')) return this.announce(LOCK_HINT);
      p.seekTo(Math.max(0, Math.min(p.len - 1, to)), 0);
    });
  }

  // ---------- drawer ----------

  buildDrawer() {
    const close = el('button', { class: 'lx-icon-btn', type: 'button', 'aria-label': 'Close the outline', html: icon.close });
    close.addEventListener('click', () => this.closeDrawer());
    this.list = el('ol', { class: 'lx-outline' });
    const titleId = `lx-drawer-title-${Math.random().toString(36).slice(2, 8)}`;
    this.drawerHead = el('div', { class: 'lx-drawer-head' },
      el('span', { class: 'lx-drawer-grip', 'aria-hidden': 'true' }),
      el('div', { class: 'lx-drawer-heading' },
        el('p', { class: 'eyebrow', text: 'Outline' }),
        el('h2', { id: titleId, html: inlineMath(this.player.lecture.title ?? '') })),
      close);
    this.drawer = el('dialog', { class: 'lx-drawer', 'aria-labelledby': titleId },
      el('div', { class: 'lx-drawer-inner' }, this.drawerHead, el('div', { class: 'lx-drawer-body' }, this.list)));
    this.drawer.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.closeDrawer();
    });
    this.drawer.addEventListener('click', (e) => e.target === this.drawer && this.closeDrawer());
    this.wireSheetDrag();
    document.body.append(this.drawer);
  }

  openDrawer(opener = null) {
    if (this.drawer.open && !this.closing) return;
    this.closeMenu();
    clearTimeout(this.drawerTimer);
    if (this.closing) {
      // still sliding away (non-modal): take it back as a modal sheet from where it is
      this.closing = false;
      this.drawer.inert = false;
      this.drawer.close();
    } else this.opener = opener ?? document.activeElement;
    this.renderDrawer();
    this.drawer.showModal();
    this.drawer.style.removeProperty('--drag');
    requestAnimationFrame(() => requestAnimationFrame(() => !this.closing && this.drawer.classList.add('open')));
    const current = this.list.querySelector('.ol-item.current > .ol-beat') ?? this.list.querySelector('.ol-beat');
    current?.scrollIntoView({ block: 'center' });
    current?.focus({ preventScroll: true });
  }

  /**
   * Slides the sheet away. The page is usable at once: the dialog stops being modal (and goes inert) when the
   * slide starts, and is closed for good when it ends.
   */
  closeDrawer() {
    if (!this.drawer.open || this.closing) return;
    this.closing = true;
    this.drawer.classList.remove('open', 'dragging');
    this.drawer.style.removeProperty('--drag');
    this.drawer.inert = true;
    this.drawer.close();
    this.drawer.show(); // non-modal, inert: visible for the slide, never in the way of taps or focus
    if (this.opener?.isConnected) this.opener.focus({ preventScroll: true });
    const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 200 : 420;
    clearTimeout(this.drawerTimer);
    this.drawerTimer = setTimeout(() => {
      if (!this.closing) return;
      this.closing = false;
      this.drawer.close();
      this.drawer.inert = false;
    }, ms);
  }

  /** Bottom sheet on phones: drag the head down to close. */
  wireSheetDrag() {
    let start = null;
    const head = this.drawerHead;
    head.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || e.target.closest('button')) return;
      start = { y: e.clientY, id: e.pointerId };
      head.setPointerCapture(e.pointerId);
      this.drawer.classList.add('dragging');
    });
    head.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      this.drawer.style.setProperty('--drag', `${Math.max(0, e.clientY - start.y)}px`);
    });
    const end = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dy = e.clientY - start.y;
      start = null;
      this.drawer.classList.remove('dragging');
      if (dy > 80) this.closeDrawer();
      else this.drawer.style.removeProperty('--drag');
    };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
  }

  renderDrawer() {
    const p = this.player;
    const st = p.state;
    const focusKey = document.activeElement?.dataset?.olKey;
    const seenList = p.pos()?.seen;
    const seen = Array.isArray(seenList) ? new Set(seenList) : null;
    const items = this.beats.map((beat, i) => {
      const inter = isInterlude(beat);
      const current = i === st.b && st.mode !== 'end';
      const done = !current && (seen ? seen.has(i) : st.mode === 'end' || i < st.b || i <= st.furthest);
      // the same "solved" the course home counts (answered right at some point, not first-try correctness)
      const key = `${p.id}/${beat.id}`;
      const wo = inter ? p.store.get(`wo:${key}`) : null;
      const ok = inter && Boolean(p.store.get(`q:${key}`)?.ok || wo?.status === 'solved' || wo?.everSolved || p.store.get(`cp:${key}`)?.status === 'passed');
      const mark = current ? icon.dot : ok || (done && !inter) ? icon.check : inter ? icon[beat.kind] : '';
      const meta = inter ? `${KIND_LABEL[beat.kind]}${ok ? ' · solved' : wo?.status === 'banked' ? ' · in the bank' : ''}` : `${beat.steps?.length ?? 0} steps`;
      const beatBtn = el('button', { class: 'ol-beat', type: 'button', 'aria-current': current ? 'step' : false, dataset: { olKey: `b${i}` } },
        el('span', { class: ['ol-mark', ok && 'ok'], html: mark }),
        el('span', { class: 'ol-text' },
          el('span', { class: 'ol-title', html: `<span class="ol-n">${i + 1}</span>${inlineMath(beat.title ?? KIND_LABEL[beat.kind] ?? '')}` }),
          el('span', { class: 'ol-meta', text: meta })));
      beatBtn.addEventListener('click', () => {
        p.seekTo(i, 0, { animate: i !== p.b });
        if (matchMedia('(max-width: 899px)').matches) this.closeDrawer();
      });
      let steps = null;
      if (current && !inter && beat.steps?.length) {
        steps = el('ol', { class: 'ol-steps', 'aria-label': 'Transcript' },
          beat.steps.map((step, k) => {
            const b = el('button', {
              class: ['ol-step', k === st.shown && 'current', k < st.shown && 'past'],
              type: 'button',
              'aria-current': k === st.shown ? 'true' : false,
              dataset: { olKey: `s${i}.${k}` },
              html: inlineMath(captionText(step.say)),
            });
            b.addEventListener('click', () => p.seekStep(i, k));
            return el('li', {}, b);
          }));
      } else if (current && inter && beat.say) {
        steps = el('p', { class: 'ol-say', html: inlineMath(captionText(beat.say)) });
      }
      return el('li', { class: ['ol-item', current && 'current', done && 'done', inter && 'interlude'] }, beatBtn, steps);
    });
    this.list.replaceChildren(...items);
    if (focusKey && !this.list.contains(document.activeElement)) {
      this.list.querySelector(`[data-ol-key="${focusKey}"]`)?.focus({ preventScroll: true });
    }
  }

  // ---------- keyboard ----------

  key(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if ((this.drawer.open && !this.closing) || typing(e.target)) return;
    const p = this.player;
    const inInterlude = e.target?.closest?.('.lx-view-interlude');
    const k = e.key;
    if (k === ' ' || k === 'Spacebar') {
      if (e.target?.closest?.('button, a, summary, [role="slider"], [role="menuitemradio"]') || inInterlude) return;
      e.preventDefault();
      p.toggle({ keyboard: true });
    } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
      if (inInterlude) return;
      e.preventDefault();
      const dir = k === 'ArrowRight' ? 1 : -1;
      if (e.shiftKey) p.beat(dir, { keyboard: true });
      else p.step(dir, { keyboard: true });
    } else if ((k === 'c' || k === 'C') && !e.shiftKey && p.mode !== 'interlude') {
      e.preventDefault();
      p.setCaptions(!p.captions);
    } else if ((k === 'm' || k === 'M') && !e.shiftKey && p.mode !== 'interlude') {
      e.preventDefault();
      p.setSound(!p.sound);
    }
  }

  // ---------- gestures on the stage ----------

  attachGestures(node) {
    let start = null;
    node.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      if (e.target.closest('button, a, input, textarea, select, label, .lx-view-interlude, .lx-card')) return;
      start = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType, id: e.pointerId };
    });
    node.addEventListener('pointercancel', () => (start = null));
    node.addEventListener('pointerup', (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dt = performance.now() - start.t;
      const type = start.type;
      start = null;
      const p = this.player;
      if (p.mode !== 'scene') return;
      if (type !== 'mouse' && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > 1.5 * Math.abs(dy) && dt < 800) {
        haptic();
        p.step(dx < 0 ? 1 : -1);
      } else if (Math.hypot(dx, dy) < TAP_PX && dt < 450) {
        p.toggle();
      }
    });
  }

  destroy() {
    document.removeEventListener('keydown', this.onKey);
    document.removeEventListener('pointerdown', this.onDocDown, true);
    clearTimeout(this.drawerTimer);
    this.closing = false;
    if (this.drawer.open) this.drawer.close();
    this.drawer.remove();
    this.bar.remove();
    document.body.classList.remove('has-tts-bar');
  }
}

/** Plain text of a title with $…$ (for aria-valuetext). */
function plain(str) {
  return String(str).replace(/\$([^$]*)\$/g, '$1');
}
