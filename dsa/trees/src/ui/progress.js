const KEY = 'tree-rotations.progress.v1';
const ATTEMPTS = 'tree-rotations.attempts.v1';

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {};
  } catch {
    return {};
  }
}

/**
 * Per-question results in localStorage: { [questionId]: true | false }. Correct is never downgraded.
 * Also the answers of each checkpoint's current attempt, so a half-done checkpoint picks up where it was left.
 */
export const progress = {
  data: load(KEY),
  attempts: load(ATTEMPTS), // { [checkpoint key]: { results: [true | false | null], at } }

  record(id, correct) {
    if (this.data[id] === true) return;
    this.data[id] = correct;
    localStorage.setItem(KEY, JSON.stringify(this.data));
    dispatchEvent(new CustomEvent('progress'));
  },

  correct(ids) {
    return ids.filter((id) => this.data[id] === true).length;
  },

  /** Answers of the current attempt at a checkpoint (key: its question ids), or null if none was saved. */
  attempt(key) {
    const a = this.attempts[key];
    return a && Array.isArray(a.results) ? a.results : null;
  },

  saveAttempt(key, results) {
    this.attempts[key] = { results: Array.from(results, (r) => (typeof r === 'boolean' ? r : null)), at: Date.now() };
    localStorage.setItem(ATTEMPTS, JSON.stringify(this.attempts));
  },

  reset() {
    this.data = {};
    this.attempts = {};
    localStorage.removeItem(KEY);
    localStorage.removeItem(ATTEMPTS);
    dispatchEvent(new CustomEvent('progress'));
  },
};
