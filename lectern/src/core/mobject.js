/**
 * Mobs: objects on the stage that animate (named after manim's mobjects).
 *
 * A Mob wraps one DOM node on a stage layer and owns its placement: x, y (stage units, the anchor point),
 * scale, rotate (deg) and opacity. HTML mobs are anchored by `anchor` ([0.5, 0.5] = centered on x, y);
 * SVG mobs are <g> groups whose own drawing is around (0, 0), placed at x, y.
 *
 * Every animation method returns a Promise and runs on the stage clock (pauses with narration, completes at once
 * while seeking). Options common to all: { duration (ms), delay (ms), ease (core/tween.js ease.*) }.
 *
 *   mob.fadeIn({ shift: [0, 16] })   mob.fadeOut()          mob.write()           (reveal left → right)
 *   mob.moveTo(x, y)                 mob.shift(dx, dy)      mob.scaleTo(k)        mob.rotateTo(deg)
 *   mob.animate({ x, y, scale, rotate, opacity })           mob.indicate()        (pulse + accent color)
 *   mob.recolor(color)               mob.flash()            mob.morphTo(other)    (FLIP-style transform into another mob)
 *   mob.set({ … }) / show() / hide() / remove()             immediate
 *   mob.box()                         its bounding box in stage units { x, y, w, h, cx, cy }
 */
import { el, svg } from './dom.js';
import { ease, lerp } from './tween.js';

const DEFAULTS = { x: 480, y: 300, scale: 1, rotate: 0, opacity: 1 };

export class Mob {
  constructor(stage, node, { layer = 'html', anchor = [0.5, 0.5], visible = true, ...place } = {}) {
    this.stage = stage;
    this.node = node;
    this.layer = layer;
    this.anchor = anchor;
    this.state = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS)) if (place[key] !== undefined) this.state[key] = place[key];
    if (!visible) this.state.opacity = 0;
    node.classList.add('lx-mob');
    if (layer === 'html') {
      node.style.transformOrigin = `${anchor[0] * 100}% ${anchor[1] * 100}%`;
      stage.html.append(node);
    } else {
      (layer === 'front' ? stage.front : stage.back).append(node);
    }
    stage.adopt(this);
    this.render();
  }

  get clock() {
    return this.stage.clock;
  }

  render() {
    const { x, y, scale, rotate, opacity } = this.state;
    if (this.layer === 'html') {
      const [ax, ay] = this.anchor;
      this.node.style.transform = `translate(${x}px, ${y}px) translate(${-ax * 100}%, ${-ay * 100}%) rotate(${rotate}deg) scale(${scale})`;
    } else {
      this.node.setAttribute('transform', `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`);
    }
    this.node.style.opacity = opacity;
    this.node.style.visibility = opacity <= 0.001 ? 'hidden' : '';
  }

  set(props) {
    Object.assign(this.state, props);
    this.render();
    return this;
  }
  show() {
    return this.set({ opacity: 1 });
  }
  hide() {
    return this.set({ opacity: 0 });
  }
  remove() {
    this.node.remove();
    this.stage.mobs.delete(this);
  }

  get x() {
    return this.state.x;
  }
  get y() {
    return this.state.y;
  }

  /** Tweens any of x, y, scale, rotate, opacity to the given values. */
  animate(to, { duration = 700, delay = 0, ease: easing = ease.inOut } = {}) {
    let from = null;
    return this.clock.tween({
      duration,
      delay,
      ease: easing,
      start: () => (from = { ...this.state }),
      update: (t) => {
        from ??= { ...this.state };
        const next = {};
        for (const [k, v] of Object.entries(to)) next[k] = lerp(from[k], v, t);
        this.set(next);
      },
    });
  }

  moveTo(x, y, opts) {
    return this.animate({ x, y }, opts);
  }
  shift(dx, dy, opts) {
    return this.animate({ x: this.state.x + dx, y: this.state.y + dy }, opts);
  }
  scaleTo(scale, opts) {
    return this.animate({ scale }, opts);
  }
  rotateTo(rotate, opts) {
    return this.animate({ rotate }, opts);
  }

  fadeIn({ shift = [0, 14], duration = 550, delay = 0, to = 1 } = {}) {
    const end = { x: this.state.x, y: this.state.y };
    this.set({ opacity: 0, x: end.x + shift[0], y: end.y + shift[1] });
    return this.animate({ opacity: to, ...end }, { duration, delay, ease: ease.out });
  }

  fadeOut({ shift = [0, 0], duration = 380, delay = 0 } = {}) {
    return this.animate({ opacity: 0, x: this.state.x + shift[0], y: this.state.y + shift[1] }, { duration, delay, ease: ease.out });
  }

  /** Reveals the mob left to right (math being written). SVG strokes draw along their length instead. */
  write({ duration = 900, delay = 0 } = {}) {
    if (this.layer !== 'html') return this.draw({ duration, delay });
    this.set({ opacity: 1 });
    const node = this.node;
    node.style.clipPath = 'inset(-20% 100% -20% -2%)';
    return this.clock
      .tween({
        duration,
        delay,
        ease: ease.inOut,
        update: (t) => (node.style.clipPath = `inset(-20% ${(1 - t) * 102}% -20% -2%)`),
      })
      .then(() => (node.style.clipPath = ''));
  }

  /** Draws every stroked path/line/circle in an SVG mob along its length. */
  draw({ duration = 900, delay = 0 } = {}) {
    this.set({ opacity: 1 });
    const parts = [...this.node.querySelectorAll('path, line, polyline, polygon, circle, rect, ellipse')].filter((p) => typeof p.getTotalLength === 'function');
    const lengths = parts.map((p) => {
      try {
        return p.getTotalLength() || 1;
      } catch {
        return 1;
      }
    });
    parts.forEach((p, i) => {
      p.style.strokeDasharray = `${lengths[i]}`;
      p.style.strokeDashoffset = `${lengths[i]}`;
    });
    const fills = parts.map((p) => p.style.fillOpacity);
    parts.forEach((p) => (p.style.fillOpacity = '0'));
    return this.clock
      .tween({
        duration,
        delay,
        ease: ease.inOut,
        update: (t) =>
          parts.forEach((p, i) => {
            p.style.strokeDashoffset = `${lengths[i] * (1 - t)}`;
            p.style.fillOpacity = `${Math.max(0, (t - 0.6) / 0.4)}`;
          }),
      })
      .then(() =>
        parts.forEach((p, i) => {
          p.style.strokeDasharray = '';
          p.style.strokeDashoffset = '';
          p.style.fillOpacity = fills[i];
        }),
      );
  }

  /** Sets the CSS color (HTML: text; SVG: currentColor) with a short crossfade. */
  recolor(color, { duration = 350, delay = 0 } = {}) {
    return this.clock.tween({
      duration,
      delay,
      ease: ease.out,
      start: () => {
        this.node.style.transition = `color ${duration / this.clock.rate}ms`;
        this.node.style.color = color;
      },
      update: (t) => {
        if (t >= 1) {
          this.node.style.transition = '';
          this.node.style.color = color;
        }
      },
    });
  }

  /** Pulse: grows a little and takes the accent color, then settles back (keeps the color if `keep`). */
  indicate({ color = 'var(--lx-yellow)', scale = 1.14, duration = 800, delay = 0, keep = false } = {}) {
    const base = this.state.scale;
    const before = this.node.style.color;
    return this.clock.tween({
      duration,
      delay,
      ease: ease.linear,
      start: () => (this.node.style.color = color),
      update: (t) => {
        this.set({ scale: base * (1 + (scale - 1) * ease.there(t)) });
        if (t >= 1 && !keep) this.node.style.color = before;
      },
    });
  }

  /** A soft ring that expands from the mob and fades (a "look here"). */
  flash({ color = 'var(--lx-yellow)', duration = 700, delay = 0 } = {}) {
    const b = this.box();
    const ring = svg('rect', { x: b.x - 6, y: b.y - 6, width: b.w + 12, height: b.h + 12, rx: 12, fill: 'none', stroke: color, 'stroke-width': 4 });
    this.stage.front.append(ring);
    return this.clock
      .tween({
        duration,
        delay,
        ease: ease.out,
        update: (t) => {
          const g = 4 + t * 14;
          ring.setAttribute('x', b.x - g);
          ring.setAttribute('y', b.y - g);
          ring.setAttribute('width', b.w + 2 * g);
          ring.setAttribute('height', b.h + 2 * g);
          ring.style.opacity = String(1 - t);
        },
      })
      .then(() => ring.remove());
  }

  /**
   * Transforms this mob into `target` (already placed where it should end, usually hidden): this one moves and
   * scales toward the target's box while fading out, the target comes from this one's box while fading in.
   */
  morphTo(target, { duration = 800, delay = 0, keep = false } = {}) {
    const a = this.box();
    const b = target.box();
    const ts = { ...target.state };
    const ss = { ...this.state };
    const k = b.w && a.w ? b.w / a.w : 1;
    target.set({ x: ts.x + (a.cx - b.cx), y: ts.y + (a.cy - b.cy), scale: ts.scale / k, opacity: 0 });
    return Promise.all([
      this.animate({ x: ss.x + (b.cx - a.cx), y: ss.y + (b.cy - a.cy), scale: ss.scale * k, opacity: 0 }, { duration, delay, ease: ease.inOut }),
      target.animate({ x: ts.x, y: ts.y, scale: ts.scale, opacity: 1 }, { duration, delay, ease: ease.inOut }),
    ]).then(() => {
      if (!keep) this.remove();
    });
  }

  /** Bounding box in stage units. */
  box() {
    const r = this.stage.toStage(this.node.getBoundingClientRect());
    return { ...r, cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
  }
}

/**
 * Renders TeX with the vendored KaTeX (window.katex, loaded by the subject's index.html).
 * Extensions: \col{blue}{…} colors with a stage color (ink, muted, blue, red, green, yellow, purple, teal, orange;
 * KaTeX's \textcolor cannot take CSS variables), \part{name}{…} marks a part for Tex.part()/color()/partBox().
 */
export function katexHtml(latex, { display = true } = {}) {
  const katex = globalThis.katex;
  if (!katex) return `<span class="lx-tex-fallback">${latex.replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`)}</span>`;
  const src = latex.replace(/\\col\{(\w+)\}/g, '\\htmlClass{lx-c-$1}').replace(/\\part\{([\w-]+)\}/g, '\\htmlClass{p-$1}');
  return katex.renderToString(src, { displayMode: display, throwOnError: false, trust: (ctx) => ctx.command === '\\htmlClass' || ctx.command === '\\htmlId', strict: 'ignore', output: 'html' });
}

/**
 * KaTeX math. Mark parts with \htmlClass{p-name}{…} (or the shorthand \part{name}{…}) to address them:
 *   tex.part('name') → the elements; tex.color('name', C.blue); tex.boxPart('name') draws a box around it.
 */
export class Tex extends Mob {
  constructor(stage, latex, { size = 44, color, display = true, ...opts } = {}) {
    const node = el('div', { class: 'lx-tex', style: { fontSize: `${size}px`, color } });
    super(stage, node, opts);
    this.size = size;
    this.display = display;
    this.setTex(latex);
  }

  setTex(latex) {
    this.latex = latex;
    this.node.innerHTML = katexHtml(latex.replace(/\\part\{([\w-]+)\}/g, '\\htmlClass{p-$1}'), { display: this.display });
    return this;
  }

  part(name) {
    return [...this.node.querySelectorAll(`.p-${name}`)];
  }

  /** Colors a named part (animated). */
  color(name, color, { duration = 350, delay = 0 } = {}) {
    const parts = this.part(name);
    const instant = this.clock.instant;
    return this.clock.tween({
      duration,
      delay,
      ease: ease.out,
      start: () =>
        parts.forEach((p) => {
          p.style.transition = instant ? '' : `color ${duration / this.clock.rate}ms`;
          p.style.color = color;
        }),
      update: (t) => {
        if (t >= 1) parts.forEach((p) => (p.style.transition = ''));
      },
    });
  }

  /** Stage box of a named part. */
  partBox(name) {
    const rects = this.part(name).map((p) => p.getBoundingClientRect());
    if (!rects.length) return null;
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    const b = this.stage.toStage({ left, top, width: right - left, height: bottom - top });
    return { ...b, cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
  }

  /** Crossfades to new TeX in place (a value changing, an equation being rewritten). */
  async swap(latex, { duration = 500, delay = 0 } = {}) {
    await this.animate({ opacity: 0 }, { duration: duration * 0.45, delay, ease: ease.out });
    this.setTex(latex);
    this.node.style.filter = 'blur(2px)';
    await this.clock.tween({
      duration: duration * 0.55,
      ease: ease.out,
      update: (t) => {
        this.set({ opacity: t });
        this.node.style.filter = t >= 1 ? '' : `blur(${2 * (1 - t)}px)`;
      },
    });
  }
}

/** Text with inline $…$ math. */
export class Text extends Mob {
  constructor(stage, str, { size = 34, color, weight, font = 'sans', width, align = 'center', italic = false, ...opts } = {}) {
    const node = el('div', {
      class: ['lx-text', `lx-${font}`],
      style: { fontSize: `${size}px`, color, fontWeight: weight, width: width ? `${width}px` : undefined, textAlign: align, fontStyle: italic ? 'italic' : undefined, whiteSpace: width ? 'normal' : 'nowrap' },
    });
    super(stage, node, opts);
    this.setText(str);
  }

  setText(str) {
    this.str = str;
    this.node.innerHTML = inlineMath(str);
    return this;
  }
}

/** "text with $x^2$ and **bold**" → HTML (escaped; math via KaTeX inline). */
export function inlineMath(str) {
  const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return String(str)
    .split(/(\$[^$]+\$)/g)
    .map((part) => (part.startsWith('$') && part.endsWith('$') && part.length > 2 ? katexHtml(part.slice(1, -1), { display: false }) : esc(part).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')))
    .join('');
}

/** Several mobs animated together. Group animations apply the same change to every member. */
export class Group {
  constructor(stage, mobs) {
    this.stage = stage;
    this.mobs = mobs;
  }
  get clock() {
    return this.stage.clock;
  }
  add(...mobs) {
    this.mobs.push(...mobs.flat());
    return this;
  }
  each(fn) {
    return Promise.all(this.mobs.map(fn));
  }
  fadeIn(opts) {
    return this.each((m) => m.fadeIn(opts));
  }
  fadeOut(opts) {
    return this.each((m) => m.fadeOut(opts));
  }
  write(opts) {
    return this.each((m) => m.write(opts));
  }
  shift(dx, dy, opts) {
    return this.each((m) => m.shift(dx, dy, opts));
  }
  recolor(c, opts) {
    return this.each((m) => m.recolor(c, opts));
  }
  indicate(opts) {
    return this.each((m) => m.indicate(opts));
  }
  set(props) {
    this.mobs.forEach((m) => m.set(props));
    return this;
  }
  show() {
    return this.set({ opacity: 1 });
  }
  hide() {
    return this.set({ opacity: 0 });
  }
  remove() {
    this.mobs.forEach((m) => m.remove());
  }
  /** Appears one after another. */
  stagger(method = 'fadeIn', gap = 90, opts) {
    return Promise.all(this.mobs.map((m, i) => m[method]({ ...opts, delay: (opts?.delay ?? 0) + i * gap })));
  }
  box() {
    const boxes = this.mobs.map((m) => m.box());
    const x = Math.min(...boxes.map((b) => b.x));
    const y = Math.min(...boxes.map((b) => b.y));
    const r = Math.max(...boxes.map((b) => b.x + b.w));
    const bt = Math.max(...boxes.map((b) => b.y + b.h));
    return { x, y, w: r - x, h: bt - y, cx: (x + r) / 2, cy: (y + bt) / 2 };
  }
}
