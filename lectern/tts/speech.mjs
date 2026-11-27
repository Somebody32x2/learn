/**
 * Narration text → speech (pure, dependency-free ESM; used by tts/gen.mjs and importable by the browser narrator).
 *
 * A lecture `say` writes math as `$tex${spoken words}`: captions show the TeX, the voice reads the words.
 * Pause tags `<short pause>` (300 ms), `<pause>` (600 ms), `<long pause>` (900 ms) insert silence.
 *
 *   spoken(say, { warn, pauses }) → string   words only: `$tex${words}` → words, stray `$…$` dropped (warned),
 *                                            pronunciation fixes (LEX) applied, pause tags turned into sentence
 *                                            breaks (or kept as written with `pauses: 'keep'`)
 *   pieces(say, { warn, max }) → [{ text, pause }]   what Kokoro synthesizes: chunks ≤ 400 chars split at sentence
 *                                            boundaries, `pause` = ms of silence after the chunk
 *   chunk(text, max) → string[]              the sentence chunker
 *   LEX                                      [regex, replacement] pronunciation table (extend here; every clip whose
 *                                            text changes is re-recorded only if `say` changes or hash VERSION bumps)
 *   PAUSES                                   pause tag → ms
 *
 * Note: clip names hash the raw `say` (core/hash.js clipKey), not the output here. After changing LEX, bump VERSION
 * in lectern/src/core/hash.js to re-record everything, or delete the affected mp3s.
 */

export const PAUSES = { 'short pause': 300, pause: 600, 'long pause': 900 };
const MAX_CHUNK = 400; // Kokoro truncates long inputs (~510 phonemes); stay well below

const SUP = { 'ⁿ': 'n', '²': 'two', '³': 'three', '¹': 'one', '⁴': 'four', 'ᵐ': 'm', 'ᵏ': 'k' };
const WORD = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', n: 'n', m: 'm', k: 'k', p: 'p' };

/** Pronunciation fixes for math vocabulary Kokoro misreads. Order matters (earlier rules run first). */
export const LEX = [
  // Latin abbreviations (before sentence splitting sees their dots).
  [/\be\.g\.(?=\s|,|$)/gi, 'for example'],
  [/\bi\.e\.(?=\s|,|$)/gi, 'that is'],
  [/\bvs\.(?=\s|$)/gi, 'versus'],
  [/\bcf\.(?=\s|$)/gi, 'compare'],
  [/\betc\.(?=\s*$)/gi, 'and so on.'],
  [/\betc\./gi, 'and so on'],
  // Spaces: Rⁿ, R^n, ℝ^3, R^{m} → "R n", "R three".
  [/(?:\bR|ℝ)\^\{?([0-9a-z])\}?/g, (_, e) => `R ${WORD[e] ?? e}`],
  [/(?:\bR|ℝ)([ⁿ²³¹⁴ᵐᵏ])/g, (_, e) => `R ${SUP[e]}`],
  [/ℝ/g, 'R'],
  // Transpose / inverse written with superscripts.
  [/\b([A-Z])ᵀ/g, '$1 transpose'],
  [/\b([A-Z])\^T\b/g, '$1 transpose'],
  [/\b([A-Z])⁻¹/g, '$1 inverse'],
  [/\b([A-Z])\^\{?-1\}?/g, '$1 inverse'],
  // Acronyms and short forms.
  [/\bRREF\b/g, 'R-R-E-F'],
  [/\bREF\b/g, 'R-E-F'],
  [/\biff\b/g, 'if and only if'],
  [/\bgcd\b/gi, 'G C D'],
  [/\blcm\b/gi, 'L C M'],
  [/\bdet\b/g, 'determinant'],
  [/\bNul\b/g, 'null'],
  [/\bQED\b/g, 'Q E D'],
  [/\bWLOG\b/g, 'without loss of generality'],
  [/\bWashU\b/g, 'Wash U'],
  [/\bMATH (\d)(\d)(\d)(\d)\b/g, 'math $1 $2 $3 $4'],
  // Symbols that slip into plain narration.
  [/(\d)\s*×\s*(\d)/g, '$1 by $2'],
  [/\s*×\s*/g, ' times '],
  [/\s*≤\s*/g, ' at most '],
  [/\s*≥\s*/g, ' at least '],
  [/\s*≠\s*/g, ' is not equal to '],
  [/\s*⇒\s*/g, ' implies '],
  [/\s*⇔\s*/g, ' if and only if '],
  [/\s*∈\s*/g, ' in '],
  [/−(?=\d)/g, 'minus '],
];

const TAG = /<\s*(short pause|long pause|pause)\s*>/gi;

/** `$tex${words}` → words; leftover `$…$` dropped with a warning. */
function mathToWords(say, warn) {
  let t = say.replace(/\$((?:[^$\\]|\\.)+)\$\{([^}]*)\}/g, (_, _tex, words) => words);
  t = t.replace(/\$((?:[^$\\]|\\.)+)\$/g, (m) => {
    warn?.(`speech: dropped unspoken math ${m} in "${say.slice(0, 80)}"`);
    return '';
  });
  return t;
}

function applyLex(text) {
  let t = text;
  for (const [re, to] of LEX) t = t.replace(re, to);
  return t;
}

const tidy = (t) =>
  t
    .replace(/[*_`#]/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Words the voice should read. `pauses`: 'break' (default) turns pause tags into sentence breaks, 'keep' leaves
 * them in place (pieces() uses that), 'drop' removes them.
 */
export function spoken(say, { warn = console.warn, pauses = 'break' } = {}) {
  let t = mathToWords(String(say ?? ''), warn);
  if (pauses !== 'keep') {
    t = t.replace(TAG, (_, __, off, whole) => {
      if (pauses === 'drop') return ' ';
      const before = whole.slice(0, off).trimEnd();
      return !before || /[.!?;:,]$/.test(before) ? ' ' : '. ';
    });
  }
  // Keep tags out of LEX/tidy: odd parts of the split are tags, normalized to `<name>`.
  const parts = t.split(/(<\s*(?:short pause|long pause|pause)\s*>)/i);
  return tidy(parts.map((p, i) => (i % 2 ? ` <${p.slice(1, -1).trim().toLowerCase().replace(/\s+/g, ' ')}> ` : applyLex(p))).join(''));
}

/** Split on sentence boundaries into chunks of at most `max` characters (a single long sentence splits on commas/spaces). */
export function chunk(text, max = MAX_CHUNK) {
  if (!text.trim()) return [];
  const sentences = text.match(/[^.!?;:]+(?:[.!?;:]+|$)\s*/g) ?? [text];
  const out = [];
  let cur = '';
  const push = (s) => {
    if (cur && (cur + s).length > max) {
      out.push(cur.trim());
      cur = '';
    }
    cur += s;
  };
  for (const s of sentences) {
    if (s.length <= max) push(s);
    else for (const w of s.split(/(?<=,)\s+|\s+/)) push(`${w} `);
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Narration → pieces to synthesize, each with the silence (ms) that follows it. */
export function pieces(say, { warn = console.warn, max = MAX_CHUNK } = {}) {
  const text = spoken(say, { warn, pauses: 'keep' });
  const out = [];
  const re = new RegExp(TAG.source, 'gi');
  let last = 0;
  const add = (seg, pause) => {
    const parts = chunk(seg, max);
    parts.forEach((t, i) => out.push({ text: t, pause: i === parts.length - 1 ? pause : 0 }));
    if (!parts.length && pause && out.length) out.at(-1).pause += pause;
  };
  for (let m; (m = re.exec(text)); ) {
    add(text.slice(last, m.index), PAUSES[m[1].toLowerCase()] ?? 0);
    last = re.lastIndex;
  }
  add(text.slice(last), 0);
  return out.filter((p) => p.text || p.pause);
}
