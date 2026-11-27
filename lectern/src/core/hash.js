/**
 * FNV-1a 64-bit over UTF-8, as 16 hex digits. Used by the browser and by tts/gen.mjs to name narration clips,
 * so both must agree: a clip is `audio/<clipKey(voice, text)>.mp3`.
 */
const PRIME = 0x100000001b3n;
const OFFSET = 0xcbf29ce484222325n;
const MASK = (1n << 64n) - 1n;

export function fnv64(text) {
  let h = OFFSET;
  for (const byte of new TextEncoder().encode(text)) {
    h ^= BigInt(byte);
    h = (h * PRIME) & MASK;
  }
  return h.toString(16).padStart(16, '0');
}

/** The narration clip name for one step. Bump VERSION to re-record everything (e.g. after a speech-rule change). */
const VERSION = 'k1';
export const clipKey = (voice, say) => fnv64(`${VERSION}|${voice}|${say}`);

/** Seeded PRNG (mulberry32) for generated practice problems: rng(seed) → () => [0, 1). */
export function rng(seed) {
  let a = typeof seed === 'string' ? Number(BigInt.asUintN(32, BigInt('0x' + fnv64(seed)))) : seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  next.pick = (xs) => xs[Math.floor(next() * xs.length)];
  next.nonzero = (lo, hi) => {
    let x = 0;
    while (x === 0) x = next.int(lo, hi);
    return x;
  };
  next.shuffle = (xs) => {
    const out = xs.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return next;
}
