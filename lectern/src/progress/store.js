/**
 * Progress storage for one course (namespace = course slug), in localStorage.
 *
 *   <ns>.progress.v1  { "<lecture>.<beat>": true | false }   correctness (true never downgrades)
 *   <ns>.visited.v1   { "<lecture>": ms }                     last visit
 *   <ns>.attempts.v1  { key: { …, at: ms } }                  pos:, q:, wo:, cp: entries (merged per key by newest `at`)
 *   <ns>.prefs        { rate, captions, sound, autoAdvance }  device-only, never synced
 *
 * Only the three `.v1` keys are synced by the tutor, so everything incremental lives in them.
 *
 *   const store = new Store('matrix');          // one instance per namespace (the constructor returns it again)
 *   store.mark(id, ok)                          // progress; true never becomes false
 *   store.correct(id) → true | false | undefined
 *   store.visit(lectureId)                      store.visited(lectureId) → ms | undefined
 *   store.get(key) → object | null              (a shallow copy)
 *   store.put(key, patch)                       shallow-merges patch, sets `at`, debounced write (≤ 300 ms)
 *   store.entries(prefix) → [[key, value]]
 *   store.flush()                               writes pending changes now (also on pagehide / tab hidden)
 *   store.onChange(fn) → unsubscribe            fn({ areas }) after another tab or the tutor sync changed data
 *                                               (storage event, window 'tutor:progress', focus / tab shown)
 *   store.prefs() → object                      store.setPrefs(patch)
 *
 * Before every put/mark/visit and every write, the store re-reads an area whose raw localStorage string differs
 * from what it last read or wrote, and merges (true wins, newest `at` per key wins, latest visit wins): put()'s
 * shallow merge then keeps fields another device wrote. Corrupt JSON reads as empty; with storage disabled the
 * store keeps working in memory for the session.
 */

const AREAS = ['progress', 'visited', 'attempts'];
const DEBOUNCE = 250;
const instances = new Map();

function storage() {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    const probe = '__lectern_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

function parse(raw) {
  try {
    const value = JSON.parse(raw ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function readJson(ls, key) {
  if (!ls) return {};
  try {
    return parse(ls.getItem(key));
  } catch {
    return {};
  }
}

/** Merges `b` into `a` for one area (returns a new object). `b` wins ties. */
function mergeArea(area, a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const prev = out[k];
    if (area === 'progress') out[k] = prev === true || v === true ? true : v;
    else if (area === 'visited') out[k] = typeof prev === 'number' && prev > v ? prev : v;
    else if (!prev || typeof prev !== 'object' || !v || typeof v !== 'object') out[k] = v ?? prev;
    else out[k] = (prev.at ?? 0) > (v.at ?? 0) ? prev : v;
  }
  return out;
}

export class Store {
  constructor(ns) {
    if (instances.has(ns)) return instances.get(ns);
    instances.set(ns, this);
    this.ns = ns;
    this.ls = storage();
    this.keyOf = { progress: `${ns}.progress.v1`, visited: `${ns}.visited.v1`, attempts: `${ns}.attempts.v1` };
    this.prefsKey = `${ns}.prefs`;
    /** In-memory copy: { progress, visited, attempts }. Read-only for callers. */
    this.data = {};
    /** The raw localStorage string per area as last read or written (detects writes by others). */
    this.raw = {};
    for (const area of AREAS) {
      this.raw[area] = this.readRaw(area);
      this.data[area] = parse(this.raw[area]);
    }
    this.dirty = new Set();
    this.timer = 0;
    this.listeners = new Set();
    this.pendingNotice = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        const area = AREAS.find((a) => this.keyOf[a] === e.key);
        if (area || e.key === null) this.reload(area ? [area] : AREAS);
      });
      // the tutor's progress sync writes localStorage in this tab and announces it
      window.addEventListener('tutor:progress', () => this.reload(AREAS));
      window.addEventListener('focus', () => this.reload(AREAS));
      window.addEventListener('pagehide', () => this.flush());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flush();
        else this.reload(AREAS);
      });
    }
  }

  // ---- progress / visits ----

  mark(id, ok) {
    this.syncBeforeWrite('progress');
    const prev = this.data.progress[id];
    const next = prev === true ? true : !!ok;
    if (prev === next) return;
    this.data.progress[id] = next;
    this.touch('progress');
  }

  correct(id) {
    const v = this.data.progress[id];
    return v === true || v === false ? v : undefined;
  }

  visit(lectureId) {
    this.syncBeforeWrite('visited');
    this.data.visited[lectureId] = Date.now();
    this.touch('visited');
  }

  visited(lectureId) {
    return this.data.visited[lectureId];
  }

  // ---- attempts ----

  get(key) {
    const v = this.data.attempts[key];
    return v && typeof v === 'object' ? { ...v } : null;
  }

  put(key, patch) {
    // pick up fields another device / the tutor sync wrote, so the merge below keeps them
    this.syncBeforeWrite('attempts');
    const prev = this.data.attempts[key];
    const base = prev && typeof prev === 'object' ? prev : {};
    const at = Math.max(Date.now(), (base.at ?? 0) + 1);
    this.data.attempts[key] = { ...base, ...patch, at };
    this.touch('attempts');
    return { ...this.data.attempts[key] };
  }

  entries(prefix = '') {
    return Object.entries(this.data.attempts).filter(([k, v]) => k.startsWith(prefix) && v && typeof v === 'object');
  }

  // ---- persistence ----

  readRaw(area) {
    if (!this.ls) return null;
    try {
      return this.ls.getItem(this.keyOf[area]);
    } catch {
      return null;
    }
  }

  /** Merges storage into memory when its raw string changed since we last saw it. Returns true if memory changed. */
  syncArea(area) {
    if (!this.ls) return false;
    const raw = this.readRaw(area);
    if (raw === this.raw[area]) return false;
    const before = JSON.stringify(this.data[area]);
    if (raw === null) {
      // removed from outside (localStorage.clear(), a progress reset): a reset, never resurrect old entries
      this.raw[area] = null;
      this.data[area] = {};
      this.dirty.delete(area);
      if (!this.dirty.size) clearTimeout(this.timer);
      return before !== '{}';
    }
    this.raw[area] = raw;
    const outside = parse(raw);
    this.data[area] = this.dirty.has(area) ? mergeArea(area, outside, this.data[area]) : mergeArea(area, this.data[area], outside);
    return JSON.stringify(this.data[area]) !== before;
  }

  syncBeforeWrite(area) {
    if (!this.syncArea(area)) return;
    // tell listeners after the current write finishes (never re-entrantly inside put/mark)
    this.pendingNotice ??= new Set();
    this.pendingNotice.add(area);
    queueMicrotask(() => {
      const areas = this.pendingNotice ? [...this.pendingNotice] : [];
      this.pendingNotice = null;
      if (areas.length) this.notify(areas);
    });
  }

  touch(area) {
    this.dirty.add(area);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), DEBOUNCE);
  }

  flush() {
    clearTimeout(this.timer);
    this.timer = 0;
    if (!this.dirty.size) return;
    const areas = [...this.dirty];
    if (!this.ls) return this.dirty.clear();
    const changed = [];
    for (const area of areas) {
      if (this.syncArea(area)) changed.push(area); // merges another writer's changes (ours win per key by newest `at`)
      if (!this.dirty.has(area)) continue; // the area was removed from outside: a reset, write nothing back
      this.dirty.delete(area);
      const json = JSON.stringify(this.data[area]);
      try {
        this.ls.setItem(this.keyOf[area], json);
        this.raw[area] = json;
      } catch {
        /* quota or disabled: keep in memory */
      }
    }
    if (changed.length) queueMicrotask(() => this.notify(changed));
  }

  /** Re-reads areas from storage, merging pending local changes; notifies listeners when something changed. */
  reload(areas) {
    const changed = areas.filter((area) => this.syncArea(area));
    if (changed.length) this.notify(changed);
  }

  notify(areas) {
    for (const fn of [...this.listeners]) {
      try {
        fn({ areas });
      } catch (err) {
        console.error(err);
      }
    }
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ---- device preferences ----

  prefs() {
    return this.ls ? readJson(this.ls, this.prefsKey) : { ...(this.memPrefs ?? {}) };
  }

  setPrefs(patch) {
    const next = { ...this.prefs(), ...patch };
    this.memPrefs = next;
    if (this.ls) {
      try {
        this.ls.setItem(this.prefsKey, JSON.stringify(next));
      } catch {}
    }
    return next;
  }
}
