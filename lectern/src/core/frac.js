/**
 * Exact rational numbers on BigInt, so row reduction, inverses and determinants in the lessons are exact.
 * Frac values are immutable. `F(x)` accepts a Frac, integer, bigint, decimal string ("0.25"), fraction string
 * ("-3/4") or a finite number with at most 9 decimals.
 */

const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

export class Frac {
  constructor(n, d = 1n) {
    if (d === 0n) throw new RangeError('Division by zero');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
    Object.freeze(this);
  }

  add(x) {
    x = F(x);
    return new Frac(this.n * x.d + x.n * this.d, this.d * x.d);
  }
  sub(x) {
    x = F(x);
    return new Frac(this.n * x.d - x.n * this.d, this.d * x.d);
  }
  mul(x) {
    x = F(x);
    return new Frac(this.n * x.n, this.d * x.d);
  }
  div(x) {
    x = F(x);
    if (x.n === 0n) throw new RangeError('Division by zero');
    return new Frac(this.n * x.d, this.d * x.n);
  }
  neg() {
    return new Frac(-this.n, this.d);
  }
  inv() {
    return new Frac(this.d, this.n);
  }
  abs() {
    return this.n < 0n ? this.neg() : this;
  }
  eq(x) {
    x = F(x);
    return this.n === x.n && this.d === x.d;
  }
  cmp(x) {
    x = F(x);
    const l = this.n * x.d, r = x.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  get zero() {
    return this.n === 0n;
  }
  get isInt() {
    return this.d === 1n;
  }
  sign() {
    return this.n < 0n ? -1 : this.n > 0n ? 1 : 0;
  }
  valueOf() {
    return Number(this.n) / Number(this.d);
  }
  /** "3", "-3/4" */
  toString() {
    return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`;
  }
  /** "3", "-\\frac{3}{4}" (`inline` gives "-3/4"-style "\\tfrac"). */
  tex({ inline = false } = {}) {
    if (this.d === 1n) return `${this.n}`;
    const sign = this.n < 0n ? '-' : '';
    const n = this.n < 0n ? -this.n : this.n;
    return `${sign}\\${inline ? 'tfrac' : 'frac'}{${n}}{${this.d}}`;
  }
  /** Words for narration: "negative three fourths" is left to the speech normalizer; this gives "-3/4". */
  toJSON() {
    return this.toString();
  }
}

export function F(x, d) {
  if (d !== undefined) return F(x).div(F(d));
  if (x instanceof Frac) return x;
  if (typeof x === 'bigint') return new Frac(x);
  if (typeof x === 'number') {
    if (!Number.isFinite(x)) throw new RangeError(`Not a finite number: ${x}`);
    if (Number.isInteger(x)) return new Frac(BigInt(x));
    return parseFrac(x.toFixed(9).replace(/0+$/, ''));
  }
  if (typeof x === 'string') {
    const parsed = parseFrac(x);
    if (!parsed) throw new SyntaxError(`Not a number: "${x}"`);
    return parsed;
  }
  throw new TypeError(`Cannot make a fraction from ${x}`);
}

/** "3", "-3/4", "0.25", "-.5", "1e3"-free decimals; null when it isn't one. Accepts unicode minus. */
export function parseFrac(text) {
  const s = String(text).trim().replace(/\u2212/g, '-').replace(/\s+/g, '');
  let m = /^([+-]?\d+)\/([+-]?\d+)$/.exec(s);
  if (m) {
    const d = BigInt(m[2]);
    return d === 0n ? null : new Frac(BigInt(m[1]), d);
  }
  m = /^([+-]?)(\d*)(?:\.(\d+))?$/.exec(s);
  if (m && (m[2] || m[3])) {
    const digits = m[3] ?? '';
    const n = BigInt((m[2] || '0') + digits) * (m[1] === '-' ? -1n : 1n);
    return new Frac(n, 10n ** BigInt(digits.length));
  }
  return null;
}

export const ZERO = new Frac(0n);
export const ONE = new Frac(1n);
