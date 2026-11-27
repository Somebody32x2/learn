/**
 * Exact linear algebra on Frac matrices (arrays of rows). Every lesson figure, worked solution and answer key that
 * involves a matrix is computed here, never typed by hand, and the tests check it.
 *
 * Matrices are plain arrays of rows of Frac; `mat([[1, 2], ['1/2', 0]])` converts. Vectors are arrays of Frac.
 */
import { F, Frac, ZERO, ONE, parseFrac } from './frac.js';

export const mat = (rows) => rows.map((row) => row.map((x) => F(x)));
export const vec = (xs) => xs.map((x) => F(x));
export const clone = (A) => A.map((row) => row.slice());
export const shape = (A) => [A.length, A[0]?.length ?? 0];
export const identity = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO)));
export const zeros = (m, n) => Array.from({ length: m }, () => Array.from({ length: n }, () => ZERO));
export const transpose = (A) => A[0].map((_, j) => A.map((row) => row[j]));
export const col = (A, j) => A.map((row) => row[j]);
export const cols = (A) => transpose(A);
export const fromCols = (vs) => transpose(vs);

export function eqMat(A, B) {
  if (A.length !== B.length) return false;
  return A.every((row, i) => row.length === B[i].length && row.every((x, j) => F(x).eq(B[i][j])));
}
export const eqVec = (u, v) => u.length === v.length && u.every((x, i) => F(x).eq(v[i]));

export function mul(A, B) {
  const [m, n] = shape(A);
  const [n2, p] = shape(B);
  if (n !== n2) throw new RangeError(`Cannot multiply ${m}×${n} by ${n2}×${p}`);
  return Array.from({ length: m }, (_, i) => Array.from({ length: p }, (_, j) => {
    let s = ZERO;
    for (let k = 0; k < n; k++) s = s.add(A[i][k].mul(B[k][j]));
    return s;
  }));
}
export const mulVec = (A, x) => mul(A, x.map((v) => [v])).map((row) => row[0]);
export const add = (A, B) => A.map((row, i) => row.map((x, j) => x.add(B[i][j])));
export const sub = (A, B) => A.map((row, i) => row.map((x, j) => x.sub(B[i][j])));
export const scale = (k, A) => A.map((row) => row.map((x) => x.mul(k)));
export const addVec = (u, v) => u.map((x, i) => x.add(v[i]));
export const subVec = (u, v) => u.map((x, i) => x.sub(v[i]));
export const scaleVec = (k, v) => v.map((x) => x.mul(k));
export const dot = (u, v) => u.reduce((s, x, i) => s.add(F(x).mul(v[i])), ZERO);
export const norm2 = (v) => dot(v, v);

/**
 * Gauss-Jordan elimination with the textbook's choices (Lay 1.2): leftmost nonzero column, the first row with a
 * nonzero entry there as pivot (swap it up if needed), clear below; then, right to left, scale pivots to 1 and
 * clear above. `augmented`: number of trailing columns that are never pivot columns (1 for [A | b]).
 * Returns { R, pivots: [[row, col]], steps, rank, echelon (the matrix after the forward phase) }.
 * Each step: { op: 'swap', i, j } | { op: 'scale', i, k } | { op: 'add', i, j, k } (row i += k · row j),
 * with `after`, the matrix once the step is applied, and `phase` ('forward' | 'backward').
 */
export function rref(A0, { augmented = 0, scaleInForward = false } = {}) {
  const A = clone(mat(A0));
  const [m, n] = shape(A);
  const steps = [];
  const record = (step) => steps.push({ ...step, after: clone(A) });
  const pivots = [];
  let r = 0;
  for (let c = 0; c < n - augmented && r < m; c++) {
    let p = r;
    while (p < m && A[p][c].zero) p++;
    if (p === m) continue;
    if (p !== r) {
      [A[p], A[r]] = [A[r], A[p]];
      record({ op: 'swap', i: r, j: p, phase: 'forward' });
    }
    if (scaleInForward && !A[r][c].eq(ONE)) {
      const k = A[r][c].inv();
      A[r] = A[r].map((x) => x.mul(k));
      record({ op: 'scale', i: r, k, phase: 'forward' });
    }
    for (let i = r + 1; i < m; i++) {
      if (A[i][c].zero) continue;
      const k = A[i][c].div(A[r][c]).neg();
      A[i] = A[i].map((x, j) => x.add(A[r][j].mul(k)));
      record({ op: 'add', i, j: r, k, phase: 'forward' });
    }
    pivots.push([r, c]);
    r++;
  }
  const echelon = clone(A);
  for (let t = pivots.length - 1; t >= 0; t--) {
    const [pr, pc] = pivots[t];
    if (!A[pr][pc].eq(ONE)) {
      const k = A[pr][pc].inv();
      A[pr] = A[pr].map((x) => x.mul(k));
      record({ op: 'scale', i: pr, k, phase: 'backward' });
    }
    for (let i = pr - 1; i >= 0; i--) {
      if (A[i][pc].zero) continue;
      const k = A[i][pc].neg();
      A[i] = A[i].map((x, j) => x.add(A[pr][j].mul(k)));
      record({ op: 'add', i, j: pr, k, phase: 'backward' });
    }
  }
  return { R: A, pivots, steps, rank: pivots.length, echelon };
}

/** Applies one row operation (as recorded by rref) to a copy of A. */
export function applyRowOp(A0, step) {
  const A = clone(mat(A0));
  if (step.op === 'swap') [A[step.i], A[step.j]] = [A[step.j], A[step.i]];
  else if (step.op === 'scale') A[step.i] = A[step.i].map((x) => x.mul(step.k));
  else if (step.op === 'add') A[step.i] = A[step.i].map((x, j) => x.add(A[step.j][j].mul(step.k)));
  else throw new Error(`Unknown row op ${step.op}`);
  return A;
}

/** Is A in echelon form (`reduced` for RREF)? */
export function isEchelon(A0, { reduced = false } = {}) {
  const A = mat(A0);
  let lastPivot = -1;
  let seenZeroRow = false;
  for (let i = 0; i < A.length; i++) {
    const c = A[i].findIndex((x) => !x.zero);
    if (c < 0) {
      seenZeroRow = true;
      continue;
    }
    if (seenZeroRow || c <= lastPivot) return false;
    if (reduced) {
      if (!A[i][c].eq(ONE)) return false;
      for (let k = 0; k < A.length; k++) if (k !== i && !A[k][c].zero) return false;
    } else {
      for (let k = i + 1; k < A.length; k++) if (!A[k][c].zero) return false;
    }
    lastPivot = c;
  }
  return true;
}

export const rank = (A) => rref(A).rank;

/** Determinant by elimination (exact). */
export function det(A0) {
  const A = clone(mat(A0));
  const n = A.length;
  if (A.some((row) => row.length !== n)) throw new RangeError('det needs a square matrix');
  let d = ONE;
  for (let c = 0; c < n; c++) {
    let p = c;
    while (p < n && A[p][c].zero) p++;
    if (p === n) return ZERO;
    if (p !== c) {
      [A[p], A[c]] = [A[c], A[p]];
      d = d.neg();
    }
    d = d.mul(A[c][c]);
    for (let i = c + 1; i < n; i++) {
      const k = A[i][c].div(A[c][c]);
      if (!k.zero) A[i] = A[i].map((x, j) => x.sub(A[c][j].mul(k)));
    }
  }
  return d;
}

/** The (i, j) minor: A without row i and column j. */
export const minor = (A, i, j) => A.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j));
export const cofactor = (A, i, j) => ((i + j) % 2 ? det(minor(mat(A), i, j)).neg() : det(minor(mat(A), i, j)));

/** Inverse via [A | I]; null when singular. */
export function inverse(A0) {
  const A = mat(A0);
  const n = A.length;
  const aug = A.map((row, i) => [...row, ...identity(n)[i]]);
  const { R, rank: r } = rref(aug, { augmented: n });
  if (r < n || !eqMat(R.map((row) => row.slice(0, n)), identity(n))) return null;
  return R.map((row) => row.slice(n));
}

/**
 * Solves Ax = b. { kind: 'none' } | { kind: 'unique', x } | { kind: 'infinite', particular, basis, free }
 * (basis: one vector per free variable, the parametric vector form x = particular + Σ t_k basis_k).
 */
export function solve(A0, b0) {
  const A = mat(A0);
  const b = vec(b0);
  const [m, n] = shape(A);
  const { R, pivots } = rref(A.map((row, i) => [...row, b[i]]), { augmented: 1 });
  if (pivots.some(([, c]) => c === n) || R.some((row) => row.slice(0, n).every((x) => x.zero) && !row[n].zero)) return { kind: 'none', R };
  const pivotCols = pivots.map(([, c]) => c);
  const free = [...Array(n).keys()].filter((c) => !pivotCols.includes(c));
  const particular = Array(n).fill(ZERO);
  pivots.forEach(([r, c]) => (particular[c] = R[r][n]));
  if (!free.length) return { kind: 'unique', x: particular, R };
  const basis = free.map((f) => {
    const v = Array(n).fill(ZERO);
    v[f] = ONE;
    pivots.forEach(([r, c]) => (v[c] = R[r][f].neg()));
    return v;
  });
  void m;
  return { kind: 'infinite', particular, basis, free, R };
}

/** Basis of Nul A (parametric vector form of Ax = 0); [] when only the zero vector. */
export function nullspace(A0) {
  const A = mat(A0);
  const r = solve(A, Array(A.length).fill(ZERO));
  return r.kind === 'infinite' ? r.basis : [];
}

/** Basis of Col A: the pivot columns of A itself. */
export function colspace(A0) {
  const A = mat(A0);
  return rref(A).pivots.map(([, c]) => col(A, c));
}

/** Basis of Row A: the nonzero rows of an echelon form. */
export function rowspace(A0) {
  return rref(A0).R.filter((row) => row.some((x) => !x.zero));
}

export const independent = (vs) => rank(fromCols(vs.map(vec))) === vs.length;
/** Is v in Span(vs)? */
export const inSpan = (v, vs) => solve(fromCols(vs.map(vec)), v).kind !== 'none';

/** Characteristic polynomial coefficients of A, highest degree first: det(λI − A) = λ^n + c1 λ^(n−1) + … (Faddeev–LeVerrier). */
export function charPoly(A0) {
  const A = mat(A0);
  const n = A.length;
  let M = zeros(n, n);
  const coeffs = [ONE];
  for (let k = 1; k <= n; k++) {
    M = add(mul(A, M), scale(coeffs[k - 1], identity(n)));
    const AM = mul(A, M);
    let tr = ZERO;
    for (let i = 0; i < n; i++) tr = tr.add(AM[i][i]);
    coeffs.push(tr.div(F(k)).neg());
  }
  return coeffs;
}

/** Evaluates a polynomial (highest degree first) at x. */
export const polyAt = (coeffs, x) => coeffs.reduce((s, c) => s.mul(x).add(c), ZERO);

/** Rational eigenvalues with algebraic multiplicity, sorted descending: [{ value, mult }]. */
export function rationalEigen(A0) {
  let coeffs = charPoly(A0);
  // Clear denominators so the rational root theorem applies to integer coefficients.
  const lcm = coeffs.reduce((l, c) => {
    const g = (a, b) => (b ? g(b, a % b) : a);
    return (l * c.d) / g(l, c.d);
  }, 1n);
  let ints = coeffs.map((c) => c.mul(F(lcm)));
  const found = [];
  const divisors = (x) => {
    x = x < 0n ? -x : x;
    const out = [];
    for (let d = 1n; d * d <= x; d++) if (x % d === 0n) out.push(d, x / d);
    return out;
  };
  let guard = 0;
  while (ints.length > 1 && guard++ < 20) {
    const lead = ints[0].n;
    let trailing = ints.at(-1).n;
    if (trailing === 0n) {
      found.push(ZERO);
      ints = ints.slice(0, -1);
      continue;
    }
    let root = null;
    for (const p of divisors(trailing)) {
      for (const q of divisors(lead)) {
        for (const s of [1n, -1n]) {
          const cand = new Frac(s * p, q);
          if (polyAt(ints, cand).zero) {
            root = cand;
            break;
          }
        }
        if (root) break;
      }
      if (root) break;
    }
    if (!root) break;
    found.push(root);
    // Synthetic division by (x − root).
    const next = [ints[0]];
    for (let i = 1; i < ints.length - 1; i++) next.push(ints[i].add(next[i - 1].mul(root)));
    ints = next;
  }
  const out = [];
  for (const v of found) {
    const hit = out.find((e) => e.value.eq(v));
    if (hit) hit.mult++;
    else out.push({ value: v, mult: 1 });
  }
  return out.sort((a, b) => b.value.cmp(a.value));
}

/** Basis of the eigenspace of λ: Nul(A − λI). */
export const eigenspace = (A0, lambda) => {
  const A = mat(A0);
  return nullspace(sub(A, scale(F(lambda), identity(A.length))));
};

/**
 * Diagonalization A = P D P⁻¹ when A has enough rational eigenvectors: { P, D, values } or null.
 */
export function diagonalize(A0) {
  const A = mat(A0);
  const n = A.length;
  const P = [];
  const values = [];
  for (const { value } of rationalEigen(A)) {
    for (const v of eigenspace(A, value)) {
      P.push(v);
      values.push(value);
    }
  }
  if (P.length !== n) return null;
  const D = identity(n).map((row, i) => row.map((x, j) => (i === j ? values[i] : ZERO)));
  return { P: fromCols(P), D, values };
}

/** proj of y onto u: (y·u / u·u) u. */
export const proj = (y, u) => scaleVec(dot(y, u).div(dot(u, u)), u);

/** Gram–Schmidt without normalizing (exact): orthogonal basis of Span(xs). */
export function gramSchmidt(xs) {
  const out = [];
  for (const x of xs.map(vec)) {
    let v = x;
    for (const u of out) v = subVec(v, proj(x, u));
    if (v.some((t) => !t.zero)) out.push(v);
  }
  return out;
}

/** Least-squares solutions of Ax = b: solves AᵀA x = Aᵀb (same result shape as solve). */
export function leastSquares(A0, b0) {
  const A = mat(A0);
  const At = transpose(A);
  return solve(mul(At, A), mulVec(At, vec(b0)));
}

// ---------- formatting ----------

/** TeX for a matrix; `augment`: column index where a vertical bar goes (Lay's augmented matrices). Entries may be
 * numbers, Fracs, numeric strings, or TeX strings for symbolic entries ('h', '\\lambda - 2'). */
export function texMat(A, { augment = null, env = 'bmatrix' } = {}) {
  const entry = (x) => (x instanceof Frac ? x.tex() : typeof x === 'string' && !parseFrac(x.replace(/\u2212/g, '-')) ? x : F(x).tex());
  const rows = A.map((row) => row.map(entry).join(' & '));
  if (augment === null) return `\\begin{${env}}${rows.join(' \\\\ ')}\\end{${env}}`;
  const n = A[0].length;
  const spec = 'c'.repeat(augment) + '|' + 'c'.repeat(n - augment);
  return `\\left[\\begin{array}{${spec}}${rows.join(' \\\\ ')}\\end{array}\\right]`;
}
export const texVec = (v) => texMat(v.map((x) => [x]));
export const texRowOp = (step) =>
  step.op === 'swap'
    ? `R_${step.i + 1} \\leftrightarrow R_${step.j + 1}`
    : step.op === 'scale'
      ? `R_${step.i + 1} \\to ${coefTex(step.k)}R_${step.i + 1}`
      : `R_${step.i + 1} \\to R_${step.i + 1} ${step.k.sign() < 0 ? '-' : '+'} ${coefTex(step.k.abs())}R_${step.j + 1}`;
const coefTex = (k) => (F(k).eq(ONE) ? '' : F(k).eq(F(-1)) ? '-' : F(k).tex({ inline: true }));
