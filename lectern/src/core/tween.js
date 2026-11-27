/**
 * Animation timing for the stage: one pausable Clock per scene, and tweens on it.
 *
 * - Every tween is a Promise that resolves when it ends. `await` them in sequence, or pass several to
 *   `Promise.all` (or the stage's `s.all`) to run them together.
 * - `clock.instant`: every tween jumps to its end at once (used to rebuild a scene at step k when seeking).
 * - `clock.pause()` / `resume()` freeze every running tween where it is (narration paused).
 * - `clock.rate` speeds every tween (the narration speed).
 * - `clock.finish()` jumps running tweens to their end (skip ahead); `clock.kill()` ends the scene: running and
 *   future tweens resolve immediately without touching anything, so step code still awaiting them unwinds.
 */

/** Cubic Bézier easing, like CSS cubic-bezier(). */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-5) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    if (t < 0 || t > 1) {
      let lo = 0, hi = 1;
      t = x;
      for (let i = 0; i < 20; i++) {
        if (sx(t) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return sy(t);
  };
}

export const ease = {
  linear: (t) => t,
  /** Entrances, responses: fast start, long settle. */
  out: bezier(0.23, 1, 0.32, 1),
  /** On-screen movement: manim's "smooth". */
  inOut: bezier(0.65, 0, 0.35, 1),
  /** A gentle overshoot for things that land (pops, snaps). */
  back: bezier(0.34, 1.4, 0.64, 1),
  /** 0 → 1 → 0 bump, for pulses (indicate, flash). */
  there: (t) => Math.sin(Math.PI * t),
};

export const lerp = (a, b, t) => a + (b - a) * t;

export class Clock {
  constructor() {
    this.instant = false;
    this.rate = 1;
    this.paused = false;
    this.dead = false;
    this.tasks = new Set();
    this.frame = 0;
    this.last = 0;
    this.loop = this.loop.bind(this);
  }

  /** Runs `update(easedT)` from 0 to 1 over `duration` ms (scaled by rate), after `delay`. */
  tween({ duration = 600, delay = 0, ease: easing = ease.inOut, update = () => {}, start = () => {} } = {}) {
    if (this.dead) return Promise.resolve();
    live.add(this);
    if (this.instant || duration + delay <= 0 || hidden()) {
      start();
      update(1);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const task = { elapsed: -delay, duration, easing, update, start, started: false, resolve };
      this.tasks.add(task);
      if (!this.frame && !this.paused) {
        this.last = performance.now();
        this.frame = requestAnimationFrame(this.loop);
      }
    });
  }

  /** Waits `ms` of clock time (pauses with the clock). */
  wait(ms) {
    return this.tween({ duration: ms, ease: ease.linear });
  }

  loop(now) {
    const dt = Math.min(250, now - this.last) * this.rate;
    this.last = now;
    if (!this.paused) {
      for (const task of [...this.tasks]) {
        task.elapsed += dt;
        if (task.elapsed < 0) continue;
        if (!task.started) {
          task.started = true;
          task.start();
        }
        const t = Math.min(1, task.elapsed / task.duration);
        task.update(task.easing(t));
        if (t >= 1) this.end(task);
      }
    }
    // Paused: stop requesting frames (battery); resume() restarts the loop.
    this.frame = this.tasks.size && !this.paused ? requestAnimationFrame(this.loop) : 0;
  }

  end(task, apply = false) {
    if (!this.tasks.delete(task)) return;
    if (apply) {
      if (!task.started) task.start();
      task.update(1);
    }
    task.resolve();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.last = performance.now();
    if (this.tasks.size && !this.frame && !this.dead) this.frame = requestAnimationFrame(this.loop);
  }

  /** Jumps every running tween to its end. */
  finish() {
    for (const task of [...this.tasks]) this.end(task, true);
  }

  /** The scene is gone: resolve everything, touch nothing, and make future tweens no-ops. */
  kill() {
    this.dead = true;
    live.delete(this);
    for (const task of [...this.tasks]) this.end(task, false);
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  get busy() {
    return this.tasks.size > 0;
  }
}

/**
 * Hidden pages get no animation frames, so a lecture would stall after one clip (locked phone, background tab).
 * While hidden, new tweens complete at once and running ones jump to their end; narration keeps going.
 */
const live = new Set();
const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (hidden()) for (const clock of live) clock.finish();
  });
}
