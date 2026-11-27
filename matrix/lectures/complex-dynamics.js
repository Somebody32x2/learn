/**
 * Lecture 21 · Complex eigenvalues and differential equations (Lay 5.5, 5.7). Design: matrix/PLAN.md § 21.
 * Every matrix, eigenvalue, eigenvector and answer below is computed with core/linalg.js (plus a small exact
 * complex-number helper built on Frac). Trajectories are sampled numerically (RK4) only for drawing.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, mul, mulVec, det, inverse, eqMat, solve, rationalEigen, eigenspace, fromCols, texMat } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- exact helpers (pure)

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;

/** Complex numbers with Frac parts. */
const Z = (re, im = 0) => ({ re: F(re), im: F(im) });
const zsub = (a, b) => Z(a.re.sub(b.re), a.im.sub(b.im));
const zmul = (a, b) => Z(a.re.mul(b.re).sub(a.im.mul(b.im)), a.re.mul(b.im).add(a.im.mul(b.re)));
function ztex(z) {
  const im = z.im.abs();
  const iPart = im.eq(1) ? 'i' : `${t(im)}i`;
  if (z.im.zero) return t(z.re);
  if (z.re.zero) return z.im.sign() < 0 ? `-${iPart}` : iPart;
  return `${t(z.re)} ${z.im.sign() < 0 ? '-' : '+'} ${iPart}`;
}
const zvecTex = (v) => `\\begin{bmatrix}${v.map(ztex).join(' \\\\ ')}\\end{bmatrix}`;

function sqrtFrac(x) {
  const r = (n) => {
    if (n < 0n) return null;
    let a = BigInt(Math.floor(Math.sqrt(Number(n))));
    while (a * a > n) a--;
    while ((a + 1n) * (a + 1n) <= n) a++;
    return a * a === n ? a : null;
  };
  const f = F(x);
  const n = r(f.n), d = r(f.d);
  return n === null || d === null ? null : F(`${n}/${d}`);
}
const rootTex = (n2) => {
  const s = sqrtFrac(n2);
  return s ? t(s) : `\\sqrt{${t(n2)}}`;
};

/** λ² − (tr)λ + det as TeX. */
function charTex(tr, dt) {
  const mid = tr.zero ? '' : ` ${tr.sign() > 0 ? '-' : '+'} ${tr.abs().eq(1) ? '' : t(tr.abs())}\\lambda`;
  const end = dt.zero ? '' : ` ${dt.sign() < 0 ? '-' : '+'} ${t(dt.abs())}`;
  return `\\lambda^2${mid}${end}`;
}

/**
 * A real 2×2 matrix with complex eigenvalues a ± bi (b > 0): Lay's Theorem 9 data for λ = a − bi.
 * The eigenvector comes from row 2 of A − λI (row 1 when row 2 has a zero first entry).
 */
function rotScale(A0) {
  const A = mat(A0);
  const tr = A[0][0].add(A[1][1]);
  const dt = det(A);
  const a = tr.div(2);
  const b = sqrtFrac(dt.sub(a.mul(a)));
  if (!b || b.zero) throw new Error('rotScale: eigenvalues are not a ± bi with rational b');
  const lam = Z(a, b.neg());
  const AmL = [[zsub(Z(A[0][0]), lam), Z(A[0][1])], [Z(A[1][0]), zsub(Z(A[1][1]), lam)]];
  const useRow2 = !A[1][0].zero;
  const v = useRow2 ? [zsub(lam, Z(A[1][1])), Z(A[1][0])] : [Z(A[0][1]), zsub(lam, Z(A[0][0]))];
  // Check A v = λ v exactly.
  const Av = [0, 1].map((i) => [0, 1].reduce((acc, j) => {
    const p = zmul(Z(A[i][j]), v[j]);
    return Z(acc.re.add(p.re), acc.im.add(p.im));
  }, Z(0)));
  const lv = v.map((x) => zmul(lam, x));
  if (!Av.every((z, i) => z.re.eq(lv[i].re) && z.im.eq(lv[i].im))) throw new Error('rotScale: bad eigenvector');
  const P = [[v[0].re, v[0].im], [v[1].re, v[1].im]];
  const Cm = [[a, b.neg()], [b, a]];
  const AP = mul(A, P);
  if (!eqMat(AP, mul(P, Cm))) throw new Error('rotScale: AP != PC');
  return { A, tr, dt, a, b, lam, AmL, useRow2, v, P, C: Cm, AP, r2: a.mul(a).add(b.mul(b)) };
}

// ---------------------------------------------------------------- data

/** Beat 1: rotation by 90°. */
const ROT = rotScale([[0, -1], [1, 0]]);
const ROT_V = [Z(1), Z(0, -1)]; // eigenvector for λ = i (shown on stage)
const ROT_I = Z(0, 1);
const ROT_AV = [0, 1].map((i) => [0, 1].reduce((acc, j) => {
  const p = zmul(Z(ROT.A[i][j]), ROT_V[j]);
  return Z(acc.re.add(p.re), acc.im.add(p.im));
}, Z(0)));

/** Beats 3–4: Lay-style worked example. */
const WK = rotScale([[1, -2], [1, 3]]);
const WK_LAM_TEX = `${t(WK.a)} \\pm ${WK.b.eq(1) ? '' : t(WK.b)}i`;
/** The sign trap: the conjugate pair λ̄ = a + bi, v̄ run through the same recipe gives Cᵀ. */
const WK_BAR = (() => {
  const lam = Z(WK.lam.re, WK.lam.im.neg());
  const v = WK.v.map((z) => Z(z.re, z.im.neg()));
  const P = [[v[0].re, v[0].im], [v[1].re, v[1].im]];
  const Cb = mul(mul(inverse(P), WK.A), P);
  if (!eqMat(Cb, [[WK.C[0][0], WK.C[1][0]], [WK.C[0][1], WK.C[1][1]]])) throw new Error('complex-dynamics: conjugate recipe should give Cᵀ');
  return { lam, v, P, C: Cb };
})();

/** Beat 5: try. */
const TR = rotScale([[1, -1], [1, 1]]);
const TR_DEG = Math.round((Math.atan2(Number(TR.b), Number(TR.a)) * 180) / Math.PI);

/** Beat 8: the attractor. */
const AT = mat([[-2, 1], [1, -2]]);
const posFirst = (v) => (v.find((x) => !x.zero).sign() < 0 ? v.map((x) => x.neg()) : v);
const AT_EIG = rationalEigen(AT).map(({ value }) => ({ value, v: posFirst(eigenspace(AT, value)[0]) })); // −1, −3
const AT_X0 = vec([3, 1]);
const AT_C = solve(fromCols(AT_EIG.map((e) => e.v)), AT_X0).x;

/** Beats 9, 11, 14: portraits. */
const SADDLE = mat([[1, 2], [2, 1]]);
const SADDLE_EIG = rationalEigen(SADDLE).map(({ value }) => ({ value, v: posFirst(eigenspace(SADDLE, value)[0]) }));
const SPIRAL = rotScale([[-1, -2], [2, -1]]);

/**
 * Lay 5.7 real solutions for the spiral: λ = a + bi with eigenvector v (second entry 1, from row 2 of A − λI);
 * v e^{λt} = e^{at}(cos bt + i sin bt) v, so Re and Im of each entry p + qi are p cos − q sin and p sin + q cos.
 */
const SP_REAL = (() => {
  const A = SPIRAL.A;
  const lam = Z(SPIRAL.a, SPIRAL.b);
  const v = [Z(lam.re.sub(A[1][1]).div(A[1][0]), lam.im.div(A[1][0])), Z(1)];
  const Av = [0, 1].map((i) => [0, 1].reduce((acc, j) => {
    const p = zmul(Z(A[i][j]), v[j]);
    return Z(acc.re.add(p.re), acc.im.add(p.im));
  }, Z(0)));
  const lv = v.map((x) => zmul(lam, x));
  if (!Av.every((z, i) => z.re.eq(lv[i].re) && z.im.eq(lv[i].im))) throw new Error('complex-dynamics: bad spiral eigenvector');
  const bt = `${SPIRAL.b.eq(1) ? '' : t(SPIRAL.b)}t`;
  /** k1 cos + k2 sin as TeX. */
  const trig = (k1, k2) => {
    const terms = [[k1, `\\cos ${bt}`], [k2, `\\sin ${bt}`]].filter(([k]) => !k.zero);
    if (!terms.length) return '0';
    return terms.map(([k, f], j) => `${k.sign() < 0 ? (j ? ' - ' : '-') : j ? ' + ' : ''}${k.abs().eq(1) ? '' : t(k.abs())}${f}`).join('');
  };
  const a = SPIRAL.a;
  const ex = a.eq(1) ? 'e^{t}' : a.eq(-1) ? 'e^{-t}' : `e^{${t(a)}t}`;
  const col = (rows) => `${ex}\\begin{bmatrix}${rows.join(' \\\\ ')}\\end{bmatrix}`;
  return {
    lam,
    v,
    y1: col(v.map((z) => trig(z.re, z.im.neg()))),
    y2: col(v.map((z) => trig(z.im, z.re))),
  };
})();

// ---------------------------------------------------------------- workouts

const M = (rows) => rows.map((r) => r.map(String));

/** wo-rot-scale: prompt, answer C, hints and solution for a matrix with eigenvalues a ± bi. */
function rotItem(A0) {
  const R = rotScale(A0);
  const rowTex = R.useRow2
    ? `(${t(R.A[1][0])})v_1 + (${ztex(R.AmL[1][1])})v_2 = 0`
    : `(${ztex(R.AmL[0][0])})v_1 + (${t(R.A[0][1])})v_2 = 0`;
  return {
    prompt: `$A = ${texMat(R.A)}$. Find the rotation–scaling matrix $C$ of Theorem 9, so that $A = PCP^{-1}$.`,
    answer: { type: 'matrix', value: M(R.C) },
    hints: [
      `The characteristic equation is $${charTex(R.tr, R.dt)} = 0$ (trace $${t(R.tr)}$, determinant $${t(R.dt)}$).`,
      'Theorem 9 uses the eigenvalue with the minus sign, $\\lambda = a - bi$ with $b > 0$, and puts $a$ on the diagonal of $C$, $-b$ above it and $b$ below.',
    ],
    solution: [
      `Trace $${t(R.tr)}$ and determinant $${t(R.dt)}$ give $${charTex(R.tr, R.dt)} = 0$, so $\\lambda = ${t(R.a)} \\pm ${R.b.eq(1) ? '' : t(R.b)}i$. Take $\\lambda = ${ztex(R.lam)}$: $a = ${t(R.a)}$, $b = ${t(R.b)}$, and $C = ${texMat(R.C)}$.`,
      `For $P$: ${R.useRow2 ? 'row 2' : 'row 1'} of $A - \\lambda I$ says $${rowTex}$, so $\\mathbf{v} = ${zvecTex(R.v)}$ and $P = [\\operatorname{Re}\\mathbf{v}\\ \\operatorname{Im}\\mathbf{v}] = ${texMat(R.P)}$.`,
      `Check: $AP = PC = ${texMat(R.AP)}$. The map rotates (in $P$-coordinates) and scales by $r = |\\lambda| = ${rootTex(R.r2)}$.`,
    ],
  };
}
const WO_ROT = rotItem([[1, -4], [1, 1]]);

function generateRot(rand) {
  for (;;) {
    const a = rand.int(-3, 3);
    const b = rand.int(1, 3);
    const P = [[rand.int(-2, 2), rand.int(-2, 2)], [rand.int(-2, 2), rand.int(-2, 2)]];
    const d = det(mat(P));
    if (!(d.eq(1) || d.eq(-1))) continue;
    const A = mul(mul(mat(P), mat([[a, -b], [b, a]])), inverse(mat(P)));
    if (A.flat().some((x) => !x.isInt || x.abs().cmp(9) > 0)) continue;
    if (A[1][0].zero && A[0][1].zero) continue;
    return rotItem(A.map((r) => r.map(Number)));
  }
}

const expTex = (l) => (F(l).eq(1) ? 'e^{t}' : F(l).eq(-1) ? 'e^{-t}' : F(l).zero ? '' : `e^{${t(l)}t}`);
const coef = (k) => (F(k).sign() < 0 ? `(${t(k)})` : t(k));
/** `c_1 - c_2`, `2c_1 + 3c_2`: a linear expression in c_1, c_2. */
function linC(a, b) {
  const terms = [[F(a), 'c_1'], [F(b), 'c_2']].filter(([k]) => !k.zero);
  if (!terms.length) return '0';
  return terms.map(([k, v], j) => {
    const mag = k.abs().eq(1) ? '' : t(k.abs());
    return `${k.sign() < 0 ? (j ? ' - ' : '-') : j ? ' + ' : ''}${mag}${v}`;
  }).join('');
}
const classify = (l1, l2) =>
  l1.sign() < 0 && l2.sign() < 0 ? 'both eigenvalues are negative, so the origin is an **attractor**' :
  l1.sign() > 0 && l2.sign() > 0 ? 'both eigenvalues are positive, so the origin is a **repeller**' :
  'the eigenvalues have opposite signs, so the origin is a **saddle point**';

/** wo-ivp: x' = Ax with eigenpairs (l1, v1), (l2, v2) and x(0) = c1 v1 + c2 v2. */
function ivpItem(v1, v2, l1, l2, c) {
  const P = mat([[v1[0], v2[0]], [v1[1], v2[1]]]);
  const A = mul(mul(P, mat([[l1, 0], [0, l2]])), inverse(P));
  const [L1, L2] = [F(l1), F(l2)];
  const [V1, V2] = [vec(v1), vec(v2)];
  const x0 = mulVec(P, vec(c));
  const cs = solve(P, x0).x;
  const comp = (i) => {
    const terms = [[cs[0].mul(V1[i]), L1], [cs[1].mul(V2[i]), L2]].filter(([k]) => !k.zero);
    if (!terms.length) return '0';
    return terms.map(([k, l], j) => {
      const sign = k.sign() < 0 ? '-' : j ? '+' : '';
      const mag = k.abs().eq(1) ? '' : t(k.abs());
      return `${j ? ` ${sign} ` : sign}${mag}${expTex(l)}`;
    }).join('');
  };
  const Av1 = mulVec(A, V1), Av2 = mulVec(A, V2);
  return {
    prompt: `Solve $\\mathbf{x}' = ${texMat(A)}\\mathbf{x}$ with $\\mathbf{x}(0) = ${tup(x0)}$. Writing $\\mathbf{x}(t) = c_1${expTex(L1)}${tup(V1)} + c_2${expTex(L2)}${tup(V2)}$, enter $(c_1, c_2)$.`,
    answer: { type: 'vector', value: cs.map(String) },
    hints: [
      `Check the eigenvectors: $A${tup(V1)} = ${tup(Av1)} = ${coef(L1)}${tup(V1)}$ and $A${tup(V2)} = ${tup(Av2)} = ${coef(L2)}${tup(V2)}$.`,
      `At $t = 0$ every exponential is $1$: solve $c_1${tup(V1)} + c_2${tup(V2)} = ${tup(x0)}$.`,
    ],
    solution: [
      `Each $\\mathbf{v}e^{\\lambda t}$ solves the equation because $A\\mathbf{v} = \\lambda\\mathbf{v}$: here $A${tup(V1)} = ${coef(L1)}${tup(V1)}$ and $A${tup(V2)} = ${coef(L2)}${tup(V2)}$.`,
      `At $t = 0$: $c_1${tup(V1)} + c_2${tup(V2)} = ${tup(x0)}$, i.e. $${linC(V1[0], V2[0])} = ${t(x0[0])}$ and $${linC(V1[1], V2[1])} = ${t(x0[1])}$, so $(c_1, c_2) = ${tup(cs)}$.`,
      `So $\\mathbf{x}(t) = \\left(${comp(0)},\\ ${comp(1)}\\right)$; ${classify(L1, L2)}.`,
    ],
  };
}
const WO_IVP = ivpItem([1, 1], [1, -1], 3, -1, [1, -1]);

const IVP_VECS = [[1, 1], [1, -1], [1, 2], [2, 1], [1, 0], [0, 1], [1, -2], [2, -1], [1, 3], [3, 1], [-1, 2]];
function generateIvp(rand) {
  for (;;) {
    const v1 = rand.pick(IVP_VECS), v2 = rand.pick(IVP_VECS);
    const d = det(mat([[v1[0], v2[0]], [v1[1], v2[1]]]));
    if (d.zero || d.abs().cmp(2) > 0) continue;
    const l1 = rand.nonzero(-3, 3), l2 = rand.nonzero(-3, 3);
    if (l1 === l2) continue;
    const P = mat([[v1[0], v2[0]], [v1[1], v2[1]]]);
    const A = mul(mul(P, mat([[l1, 0], [0, l2]])), inverse(P));
    if (A.flat().some((x) => !x.isInt || x.abs().cmp(9) > 0)) continue;
    const c = [rand.nonzero(-3, 3), rand.nonzero(-3, 3)];
    const x0 = mulVec(P, vec(c));
    if (x0.some((x) => x.abs().cmp(12) > 0)) continue;
    return ivpItem(v1, v2, l1, l2, c);
  }
}

// ---------------------------------------------------------------- scene helpers (DOM only when called)

const f2 = (x) => Math.round(x * 100) / 100;
const pathD = (p, pts) => pts.map((q, i) => `${i ? 'L' : 'M'}${f2(p.px(q)[0])} ${f2(p.px(q)[1])}`).join(' ');
/** An SVG path through plane points, inside the plane (moves and fades with it). */
const planePath = (s, p, pts, opts = {}) => s.path(pathD(p, pts), { parent: p, width: 3, ...opts });
const N = (A) => A.map((r) => r.map(Number));

/** RK4 samples of x' = Ax from x0 (backward in time when `back`), until it leaves the box or reaches 0. */
function flow(A0, x0, { back = false, R = 3.05, stop = 0.07, dt = 0.01, tMax = 14 } = {}) {
  const A = N(A0);
  const s = back ? -1 : 1;
  const f = (x) => [s * (A[0][0] * x[0] + A[0][1] * x[1]), s * (A[1][0] * x[0] + A[1][1] * x[1])];
  let x = x0.slice();
  const pts = [x];
  for (let k = 0; k * dt < tMax; k++) {
    const k1 = f(x);
    const k2 = f([x[0] + (dt / 2) * k1[0], x[1] + (dt / 2) * k1[1]]);
    const k3 = f([x[0] + (dt / 2) * k2[0], x[1] + (dt / 2) * k2[1]]);
    const k4 = f([x[0] + dt * k3[0], x[1] + dt * k3[1]]);
    x = [x[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    if (Math.max(Math.abs(x[0]), Math.abs(x[1])) > R) break;
    if (k % 3 === 0) pts.push(x);
    if (Math.hypot(x[0], x[1]) < stop) break;
  }
  pts.push(x);
  return back ? pts.reverse() : pts;
}

/** One trajectory: a path plus a small arrowhead partway along it (in time order). */
function trajectory(s, p, pts, { color = C.blue, width = 2.5, at = 0.45, visible = false } = {}) {
  const path = planePath(s, p, pts, { color, width, visible });
  const px = pts.map((q) => p.px(q));
  const lens = [0];
  for (let i = 1; i < px.length; i++) lens.push(lens[i - 1] + Math.hypot(px[i][0] - px[i - 1][0], px[i][1] - px[i - 1][1]));
  const goal = lens.at(-1) * at;
  if (px.length < 3) throw new Error('trajectory: start point outside the plane');
  const i = Math.max(1, Math.min(px.length - 2, lens.findIndex((L) => L >= goal)));
  const dx = px[i + 1][0] - px[i - 1][0], dy = px[i + 1][1] - px[i - 1][1], L = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / L, dy / L];
  const arrow = s.arrow(px[i][0] - ux * 9, px[i][1] - uy * 9, px[i][0] + ux * 9, px[i][1] + uy * 9, { parent: p, color, width: 2.5, head: 13, visible });
  return { path, arrow };
}
const SQ = [[3, 1], [3, -2], [1, 3], [-2, 3], [-3, -1], [-3, 2], [-1, -3], [2, -3]];
/** Starting points and direction for each kind of portrait. */
function portrait(s, p, A, kind, opts = {}) {
  const starts = {
    sink: SQ,
    source: SQ,
    // Near the incoming line (1, −1): x0 = c1(1, 1) + c2(1, −1) with |c2| large, c1 small.
    saddle: [[0.01, 2.75], [0.08, 2.75], [-0.01, 2.75], [-0.08, 2.75], [0.01, -2.75], [0.08, -2.75], [-0.01, -2.75], [-0.08, -2.75]].map(([c1, c2]) => [c1 + c2, c1 - c2]),
    spiral: [[3, 0], [-3, 0], [0, 3], [0, -3]],
    spiralOut: [[3, 0], [-3, 0], [0, 3], [0, -3]],
  }[kind];
  const back = kind === 'source' || kind === 'spiralOut';
  return starts.map((x0) => trajectory(s, p, flow(A, x0, { back }), opts));
}
const drawTraj = (s, list, { duration = 900, gap = 90 } = {}) =>
  s.all(list.map((tr, k) => s.all(tr.path.draw({ duration, delay: k * gap }), tr.arrow.fadeIn({ shift: [0, 0], delay: duration + k * gap }))));

/** Points of a circle-like curve r(s)·(cos sφ, sin sφ) mapped by P (numbers). */
const curve = (P, f, s0, s1, n = 120) => Array.from({ length: n + 1 }, (_, k) => {
  const s = s0 + ((s1 - s0) * k) / n;
  const y = f(s);
  return [P[0][0] * y[0] + P[0][1] * y[1], P[1][0] * y[0] + P[1][1] * y[1]];
});
const I2 = [[1, 0], [0, 1]];

/** Beats 1: three vectors and their own lines. */
const ROT_VECS = [[2, 0.6], [0.8, 2], [-2, 1.3]];
const rotNum = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

// ---------------------------------------------------------------- the lecture

export default {
  id: 'complex-dynamics',
  title: 'Complex eigenvalues and differential equations',
  goals: [
    'Recognize rotation-like matrices and compute complex eigenvalues and eigenvectors',
    'Factor A = PCP⁻¹ with C a rotation–scaling matrix (Theorem 9)',
    'Solve x′ = Ax with eigenfunctions and fit initial conditions',
    'Classify the origin: attractor, repeller, saddle, spiral point',
  ],
  beats: [
    // 1
    {
      id: 'no-real-line',
      title: 'A matrix with no real eigenvectors',
      scene(s) {
        const A = s.tex(`A = ${texMat(ROT.A)}`, { x: 230, y: 92, size: 40, visible: false });
        const rot = s.text('rotation by $90^\\circ$', { x: 230, y: 192, size: 30, color: C.muted, visible: false });
        const p = s.plane({ x: 695, y: 300, width: 380, range: [-3, 3, -3, 3], labels: false, visible: false });
        const cols = [C.blue, C.red, C.teal];
        const spans = ROT_VECS.map((v, k) => p.span(v, { color: cols[k], width: 2, dash: '6 6', visible: false }));
        const vs = ROT_VECS.map((v, k) => p.vector(v, { color: cols[k], visible: false }));
        const ch = s.tex(`\\begin{vmatrix} -\\lambda & -1 \\\\ 1 & -\\lambda \\end{vmatrix} = ${charTex(ROT.tr, ROT.dt)}`, { x: 240, y: 275, size: 32, visible: false });
        const roots = s.tex(`${charTex(ROT.tr, ROT.dt)} = 0 \\;\\Rightarrow\\; \\lambda = \\pm i`, { x: 240, y: 360, size: 34, color: C.purple, visible: false });
        const ev = s.tex(`A${zvecTex(ROT_V)} = ${zvecTex(ROT_AV)} = ${ztex(ROT_I)}${zvecTex(ROT_V)}`, { x: 240, y: 470, size: 32, color: C.purple, visible: false });
        return { A, rot, p, spans, vs, ch, roots, ev };
      },
      steps: [
        {
          say: 'Here\'s rotation by ninety degrees. Every direction gets turned: each vector leaves its own line, so no real vector is just scaled. There are no real eigenvectors at all.',
          do: async (s, o) => {
            await s.all(o.A.write(), o.rot.fadeIn({ delay: 300 }), o.p.draw({ duration: 800 }));
            await s.all(o.spans.map((l, k) => l.draw({ duration: 600, delay: k * 150 })), o.vs.map((v, k) => v.grow({ delay: k * 150 })));
            await s.clock.tween({ duration: 2000, update: (k) => o.vs.forEach((v, j) => v.setCoords(rotNum(ROT_VECS[j], (k * Math.PI) / 2))) });
          },
        },
        {
          say: 'The algebra agrees. The characteristic equation is $\\lambda^2 + 1 = 0${lambda squared plus one equals zero}, which has no real roots. Its roots are $\\pm i${plus or minus i}.',
          do: async (s, o) => {
            await o.ch.write({ duration: 1200 });
            await o.roots.write();
          },
        },
        {
          say: 'So the eigenvalues are complex, and the eigenvectors are complex too. For $\\lambda = i${lambda equals i}, the vector $(1, -i)${one, minus i} works: multiplying by $A${A} just multiplies it by $i${i}.',
          do: async (s, o) => {
            await o.ev.write({ duration: 1200 });
            await o.ev.indicate({ color: C.purple });
          },
        },
      ],
    },

    // 2
    {
      id: 'rotation-scaling',
      title: 'Rotation–scaling matrices',
      scene(s) {
        const L = (tex, y, opts = {}) => s.tex(tex, { x: 220, y, size: 36, visible: false, ...opts });
        const Cm = L('C = \\begin{bmatrix} a & -b \\\\ b & a \\end{bmatrix}', 95, { size: 40 });
        const lam = L('\\lambda = a \\pm bi', 180, { color: C.purple });
        const rf = L('C = r\\begin{bmatrix} \\cos\\varphi & -\\sin\\varphi \\\\ \\sin\\varphi & \\cos\\varphi \\end{bmatrix}', 275, { size: 32 });
        const r = L('r = \\sqrt{a^2 + b^2} = |\\lambda|', 360, { size: 34 });
        const out = s.text('$r > 1$: spirals out', { x: 220, y: 450, size: 32, color: C.blue, visible: false });
        const inn = s.text('$r < 1$: spirals in', { x: 220, y: 510, size: 32, color: C.red, visible: false });
        const p = s.plane({ x: 680, y: 300, width: 400, range: [-3.5, 3.5, -3.5, 3.5], labels: false, visible: false });
        const AB = [2.4, 1.6];
        const ab = p.vector(AB, { color: C.green, visible: false });
        const da = planePath(s, p, [[AB[0], 0], AB], { color: C.muted, width: 2, dash: '6 5', visible: false });
        const la = p.label([AB[0] * 0.7, -0.4], 'a', { size: 34, visible: false });
        const lb = p.label([AB[0] + 0.35, AB[1] / 2], 'b', { size: 34, visible: false });
        const lr = p.label([AB[0] / 2 - 0.35, AB[1] / 2 + 0.35], 'r', { size: 34, color: C.green, visible: false });
        const phi = Math.atan2(AB[1], AB[0]);
        const arc = planePath(s, p, Array.from({ length: 25 }, (_, k) => [0.9 * Math.cos((phi * k) / 24), 0.9 * Math.sin((phi * k) / 24)]), { color: C.purple, visible: false });
        const lphi = p.label([1.25 * Math.cos(phi / 2), 1.25 * Math.sin(phi / 2)], '\\varphi', { size: 34, color: C.purple, visible: false });
        const spiral = (rr, deg, x0, n) => {
          const a = (deg * Math.PI) / 180;
          return Array.from({ length: n + 1 }, (_, k) => rotNum([x0 * rr ** k, 0], a * k));
        };
        const outPts = spiral(1.15, 30, 0.5, 12);
        const inPts = spiral(0.86, 30, 3.2, 14);
        const mk = (pts, color) => ({
          dots: pts.map((q) => p.point(q, { color, r: 6, visible: false })),
          line: planePath(s, p, pts, { color, width: 2, visible: false }),
        });
        return { Cm, lam, rf, r, out, inn, p, ab, da, la, lb, lr, arc, lphi, so: mk(outPts, C.blue), si: mk(inPts, C.red) };
      },
      steps: [
        {
          say: 'The model is a matrix of this shape, with $a${a} on the diagonal and $\\pm b${plus or minus b} off it. Its eigenvalues are $a \\pm bi${a plus or minus b i}.',
          do: async (s, o) => {
            await o.Cm.write();
            await o.lam.write();
          },
        },
        {
          say: 'Its first column is the point $(a, b)${a, b}. Write that point with a length $r${r} and an angle $\\varphi${phi}: then $C${C} is $r${r} times a rotation by $\\varphi${phi}. The length $r${r} is exactly $|\\lambda|${the absolute value of lambda}.',
          do: async (s, o) => {
            await o.p.draw({ duration: 700 });
            await s.all(o.ab.grow(), o.da.draw({ delay: 500, duration: 500 }), o.la.draw({ delay: 400 }), o.lb.draw({ delay: 700 }));
            await s.all(o.arc.draw({ duration: 500 }), o.lphi.draw({ delay: 300 }), o.lr.draw({ delay: 300 }));
            await o.rf.write();
            await o.r.write();
          },
        },
        {
          say: 'Apply $C${C} over and over and watch a point. Each step turns it by $\\varphi${phi} and stretches it by $r${r}. With $r > 1${r greater than one} it spirals out; with $r < 1${r less than one} it spirals in.',
          do: async (s, o) => {
            await s.all([o.ab, o.da, o.la, o.lb, o.lr, o.arc, o.lphi].map((m) => m.fadeOut()));
            await s.all(o.so.line.draw({ duration: 2000 }), s.stagger(o.so.dots.map((d) => () => d.draw({ duration: 200 })), 150), o.out.fadeIn());
            await s.all(o.so.line.animate({ opacity: 0.3 }), o.so.dots.map((d) => d.animate({ opacity: 0.3 })));
            await s.all(o.si.line.draw({ duration: 2200 }), s.stagger(o.si.dots.map((d) => () => d.draw({ duration: 200 })), 150), o.inn.fadeIn());
          },
        },
      ],
    },

    // 3
    {
      id: 'worked-complex',
      title: 'Worked example',
      scene(s) {
        const L = (tex, x, y, opts = {}) => s.tex(tex, { x, y, size: 34, visible: false, ...opts });
        const A = L(`A = ${texMat(WK.A)}`, 165, 95, { size: 38 });
        const trdet = L(`\\operatorname{tr} A = ${t(WK.tr)},\\ \\det A = ${t(WK.dt)}`, 220, 185, { size: 32 });
        const ch = L(`${charTex(WK.tr, WK.dt)} = 0`, 220, 240, { size: 32, color: C.purple });
        const lamL = L(`\\lambda = ${WK_LAM_TEX};\\ \\text{use } ${ztex(WK.lam)}`, 225, 292, { size: 32, color: C.purple });
        const aml = s.tex(`A - \\lambda I = \\begin{bmatrix} ${ztex(WK.AmL[0][0])} & ${ztex(WK.AmL[0][1])} \\\\ \\part{r2}{${ztex(WK.AmL[1][0])}} & \\part{r2}{${ztex(WK.AmL[1][1])}} \\end{bmatrix}`, { x: 240, y: 390, size: 30, visible: false });
        const row = L(`${WK.A[1][0].eq(1) ? '' : t(WK.A[1][0])}v_1 + (${ztex(WK.AmL[1][1])})\\,v_2 = 0`, 220, 490, { size: 32, color: C.yellow });
        const v = L(`\\mathbf{v} = ${zvecTex(WK.v)} = \\begin{bmatrix} \\part{re}{${t(WK.P[0][0])}} \\\\ \\part{re}{${t(WK.P[1][0])}} \\end{bmatrix} + i\\begin{bmatrix} \\part{im}{${t(WK.P[0][1])}} \\\\ \\part{im}{${t(WK.P[1][1])}} \\end{bmatrix}`, 690, 95, { size: 30, color: C.purple });
        const pLab = s.tex('P = [\\operatorname{Re}\\mathbf{v}\\ \\ \\operatorname{Im}\\mathbf{v}] =', { x: 765, y: 220, size: 30, anchor: [1, 0.5], visible: false });
        const P = s.matrix(WK.P, { x: 848, y: 220, size: 32, visible: false });
        const cLab = s.tex('C = \\begin{bmatrix} a & -b \\\\ b & a \\end{bmatrix} =', { x: 765, y: 345, size: 30, anchor: [1, 0.5], visible: false });
        const Cm = s.matrix(WK.C, { x: 848, y: 345, size: 32, visible: false });
        const check = L(`AP = PC = ${texMat(WK.AP)}`, 670, 470, { size: 32, color: C.green });
        const ck = s.tex('\\checkmark', { x: 906, y: 470, size: 40, color: C.green, visible: false });
        const thm = s.defCard({
          x: 230, y: 305, width: 390, kind: 'theorem', title: 'Theorem 9', size: 30, visible: false,
          body: 'For a real $2\\times 2$ matrix $A$ with eigenvalue $\\lambda = a - bi$, $b \\neq 0$, and eigenvector $\\mathbf{v}$: $A = PCP^{-1}$, where $P = [\\operatorname{Re}\\mathbf{v}\\ \\operatorname{Im}\\mathbf{v}]$ and $C = \\begin{bmatrix} a & -b \\\\ b & a \\end{bmatrix}$.',
        });
        const conj = L(`\\lambda = ${ztex(WK_BAR.lam)}:\\ \\bar{\\mathbf{v}} = (${WK_BAR.v.map(ztex).join(', ')})`, 235, 230, { size: 30, color: C.purple });
        const p2 = L(`P' = ${texMat(WK_BAR.P)}`, 235, 330, { size: 32 });
        const ct = L(`P'^{-1}AP' = ${texMat(WK_BAR.C)} = C^T`, 245, 445, { size: 30, color: C.yellow });
        const turn = s.text('turns the other way', { x: 240, y: 525, size: 30, color: C.yellow, visible: false });
        return { A, trdet, ch, lamL, aml, row, v, pLab, P, cLab, Cm, check, ck, thm, conj, p2, ct, turn };
      },
      steps: [
        {
          say: 'Take $A${A} with trace four and determinant five. The characteristic equation is $\\lambda^2 - 4\\lambda + 5 = 0${lambda squared minus four lambda plus five equals zero}, and the quadratic formula gives $\\lambda = 2 \\pm i${lambda equals two plus or minus i}.',
          do: async (s, o) => {
            await o.A.write();
            await o.trdet.fadeIn();
            await o.ch.write();
            await o.lamL.fadeIn();
          },
        },
        {
          say: 'Use $\\lambda = 2 - i${lambda equals two minus i}. For a two by two, $A - \\lambda I${A minus lambda I} has rank one, so one row is enough. Row two says $v_1 + (1 + i)v_2 = 0${v one, plus one plus i times v two, equals zero}, so $\\mathbf{v} = (-1 - i, 1)${v equals minus one minus i, one}.',
          do: async (s, o) => {
            await o.aml.write({ duration: 1100 });
            await o.aml.color('r2', C.yellow);
            await o.row.write();
            await o.v.write({ duration: 1100 });
          },
        },
        {
          say: 'Split $\\mathbf{v}${v} into real and imaginary parts. Those two real vectors are the columns of $P${P}, and $a = 2${a equals two}, $b = 1${b equals one} fill in $C${C}.',
          do: async (s, o) => {
            await s.all(o.v.color('re', C.blue), o.v.color('im', C.red, { delay: 250 }));
            await s.all(o.pLab.fadeIn(), o.P.fadeIn());
            await s.all(o.P.highlightCol(0, C.blue), o.P.highlightCol(1, C.red, { delay: 200 }));
            await s.all(o.cLab.fadeIn(), o.Cm.fadeIn());
          },
        },
        {
          say: 'Check it without inverting anything: $AP${A P} and $PC${P C} are both $\\begin{bmatrix}-3&-1\\\\2&-1\\end{bmatrix}${the matrix minus three, minus one, two, minus one}. So $A = PCP^{-1}${A equals P C P inverse}.',
          do: async (s, o) => {
            await o.check.write();
            await o.ck.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'That\'s Lay\'s Theorem 9: for a real two by two matrix with eigenvalue $a - bi${a minus b i} and eigenvector $\\mathbf{v}${v}, the real and imaginary parts of $\\mathbf{v}${v} make $P${P}, and $a${a} and $b${b} make $C${C}.',
          do: async (s, o) => {
            await s.all([o.A, o.trdet, o.ch, o.lamL, o.aml, o.row].map((m) => m.fadeOut()));
            await o.thm.reveal();
          },
        },
        {
          say: 'Why $2 - i${two minus i}? The other eigenvalue, $2 + i${two plus i}, comes with the conjugate eigenvector $(-1 + i, 1)${minus one plus i, one}. Run the same recipe with it and you get $C^T${C transpose}, which turns the other way. Keep the minus sign.',
          do: async (s, o) => {
            await o.thm.fadeOut();
            await o.conj.write();
            await o.p2.fadeIn();
            await o.ct.write();
            await o.turn.fadeIn();
          },
        },
      ],
    },

    // 4
    {
      id: 'ellipse-orbit',
      title: 'What A does: an elliptical spiral',
      scene(s) {
        const P = N(WK.P);
        const phi = Math.atan2(Number(WK.b), Number(WK.a));
        const left = s.plane({ x: 215, y: 310, width: 300, range: [-3, 3, -3, 3], labels: false, visible: false });
        const right = s.plane({ x: 680, y: 300, width: 400, range: [-4, 4, -4, 4], labels: false, visible: false });
        const lt = s.text('$P$-coordinates: $C/\\sqrt{5}$', { x: 215, y: 120, size: 30, visible: false });
        const rt = s.text('standard: $A/\\sqrt{5}$', { x: 680, y: 70, size: 30, visible: false });
        const arr = s.arrow(378, 300, 470, 300, { color: C.muted, width: 3, visible: false });
        const arrLab = s.tex('P', { x: 424, y: 272, size: 32, color: C.muted, visible: false });
        const circ = (r) => (u) => [r * Math.cos(u), r * Math.sin(u)];
        const circle = planePath(s, left, curve(I2, circ(2), 0, 2 * Math.PI), { color: C.purple, width: 2, dash: '6 5', visible: false });
        const ellipse = planePath(s, right, curve(P, circ(2), 0, 2 * Math.PI), { color: C.purple, width: 2, dash: '6 5', visible: false });
        const K = 14;
        const ys = Array.from({ length: K }, (_, k) => [2 * Math.cos(k * phi), 2 * Math.sin(k * phi)]);
        const ld = ys.map((y) => left.point(y, { color: C.blue, r: 6, visible: false }));
        const rd = ys.map((y) => right.point([P[0][0] * y[0] + P[0][1] * y[1], P[1][0] * y[0] + P[1][1] * y[1]], { color: C.blue, r: 6, visible: false }));
        const grow = (u) => [0.02 * 5 ** (u / (2 * phi)) * Math.cos(u), 0.02 * 5 ** (u / (2 * phi)) * Math.sin(u)];
        const KS = [0, 1, 2, 3, 4, 5, 6];
        const lsp = planePath(s, left, curve(I2, grow, 0, 6 * phi), { color: C.red, width: 3, visible: false });
        const rsp = planePath(s, right, curve(P, grow, 0, 6 * phi), { color: C.red, width: 3, visible: false });
        const ldots = KS.map((k) => left.point(grow(k * phi), { color: C.red, r: 6, visible: false }));
        const rdots = KS.map((k) => right.point(curve(P, grow, k * phi, k * phi, 1)[0], { color: C.red, r: 6, visible: false }));
        const r5 = s.text('Without the $1/\\sqrt{5}$: $r = \\sqrt{5}$, spiraling out', { x: 480, y: 545, size: 30, color: C.red, visible: false });
        return { left, right, lt, rt, arr, arrLab, circle, ellipse, ld, rd, lsp, rsp, ldots, rdots, r5 };
      },
      steps: [
        {
          say: 'Shrink $A${A} by $\\sqrt{5}${the square root of five} so it neither grows nor shrinks. In the coordinates of $P${P}, it\'s a pure rotation: a point just walks around a circle.',
          do: async (s, o) => {
            await s.all(o.left.draw({ duration: 700 }), o.lt.fadeIn());
            await o.circle.draw({ duration: 700 });
            await s.stagger(o.ld.map((d) => () => d.draw({ duration: 250 })), 180);
          },
        },
        {
          say: 'In standard coordinates, $P${P} distorts that circle into an ellipse. So $A${A} moves points around an ellipse, turning by the same angle each step.',
          do: async (s, o) => {
            await s.all(o.right.draw({ duration: 700 }), o.rt.fadeIn(), o.arr.draw(), o.arrLab.fadeIn({ delay: 300 }));
            await o.ellipse.draw({ duration: 800 });
            await s.stagger(o.rd.map((d, k) => () => s.all(d.draw({ duration: 250 }), o.ld[k].indicate({ color: C.blue, scale: 1.6, duration: 300 }))), 180);
          },
        },
        {
          say: 'Put the $\\sqrt{5}${square root of five} back and each step also stretches by $r = \\sqrt{5}${r equals the square root of five}. The circle becomes an outward spiral, and the ellipse an elliptical spiral.',
          do: async (s, o) => {
            await s.all([...o.ld, ...o.rd].map((d) => d.animate({ opacity: 0.3 })));
            await s.all(o.lsp.draw({ duration: 1600 }), o.rsp.draw({ duration: 1600 }), s.stagger(o.ldots.map((d, k) => () => s.all(d.draw(), o.rdots[k].draw())), 450));
            await o.r5.fadeIn();
          },
        },
      ],
    },

    // 5
    {
      id: 'try-r-phi',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Find the eigenvalues, then read off the angle and the scale.',
      prompt: `$A = ${texMat(TR.A)}$. What does $A$ do?`,
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: 'Rotates by $90^\\circ$ and scales by $2$', why: `$\\lambda = ${t(TR.a)} \\pm ${TR.b.eq(1) ? '' : t(TR.b)}i$, so $r = ${rootTex(TR.r2)}$ and $\\varphi = ${TR_DEG}^\\circ$, not $90^\\circ$ and $2$.` },
        { id: 'b', label: `Rotates by $${TR_DEG}^\\circ$ and scales by $${rootTex(TR.r2)}$`, why: `Right: $\\lambda = ${t(TR.a)} \\pm ${TR.b.eq(1) ? '' : t(TR.b)}i$ is the point $(${t(TR.a)}, ${t(TR.b)})$, at angle $${TR_DEG}^\\circ$ and distance $${rootTex(TR.r2)}$.` },
        { id: 'c', label: 'Has real eigenvalues $0$ and $2$', why: `The characteristic polynomial is $${charTex(TR.tr, TR.dt)}$, which has no real roots.` },
      ],
      hint: 'Trace and determinant give the characteristic polynomial; $r = |\\lambda|$ and $\\varphi$ is the angle of the point $(a, b)$.',
      solution: [
        `Trace $${t(TR.tr)}$, determinant $${t(TR.dt)}$: $${charTex(TR.tr, TR.dt)} = 0$ gives $\\lambda = ${t(TR.a)} \\pm ${TR.b.eq(1) ? '' : t(TR.b)}i$.`,
        `$A$ already has the form $\\begin{bmatrix} a & -b \\\\ b & a \\end{bmatrix}$ with $a = ${t(TR.a)}$, $b = ${t(TR.b)}$.`,
        `So $r = \\sqrt{a^2 + b^2} = ${rootTex(TR.r2)}$ and $\\varphi = ${TR_DEG}^\\circ$: $A$ rotates by $${TR_DEG}^\\circ$ and scales by $${rootTex(TR.r2)}$.`,
      ],
    },

    // 6
    {
      id: 'wo-rot-scale',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Find the eigenvalue with the minus sign, then build the rotation–scaling matrix.',
      prompt: WO_ROT.prompt,
      answer: WO_ROT.answer,
      hints: WO_ROT.hints,
      solution: WO_ROT.solution,
      generate: generateRot,
    },

    // 7
    {
      id: 'de-setup',
      title: 'Differential equations: x′ = Ax',
      scene(s) {
        const L = (tex, y, opts = {}) => s.tex(tex, { x: 50, y, size: 34, anchor: [0, 0.5], visible: false, ...opts });
        const eq = L("\\mathbf{x}'(t) = A\\mathbf{x}(t)", 80, { size: 40 });
        const sys = L(`\\begin{aligned} x_1' &= -2x_1 + x_2 \\\\ x_2' &= x_1 - 2x_2 \\end{aligned}`, 170, { size: 32 });
        const guess = L('\\mathbf{x}(t) = \\mathbf{v}\\,e^{\\lambda t}', 270, { color: C.purple });
        const lhs = L("\\mathbf{x}' = \\part{l}{\\lambda\\mathbf{v}}\\,e^{\\lambda t}", 345);
        const rhs = L('A\\mathbf{x} = \\part{r}{A\\mathbf{v}}\\,e^{\\lambda t}', 410);
        const res = L('A\\mathbf{v} = \\lambda\\mathbf{v}', 500, { size: 40, color: C.purple });
        const box = s.surround({ x: 40, y: 470, w: 230, h: 62 }, { color: C.purple, visible: false });
        const p = s.plane({ x: 690, y: 300, width: 380, range: [-3, 3, -3, 3], labels: false, visible: false });
        const A = N(AT);
        const field = [];
        for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
          if (!i && !j) continue;
          const v = [A[0][0] * i + A[0][1] * j, A[1][0] * i + A[1][1] * j];
          const L0 = Math.hypot(...v);
          const [x, y] = p.px([i, j]);
          const len = 12 + 4 * Math.min(L0, 5);
          const u = [v[0] / L0, -v[1] / L0];
          field.push(s.arrow(x - (u[0] * len) / 2, y - (u[1] * len) / 2, x + (u[0] * len) / 2, y + (u[1] * len) / 2, { parent: p, color: C.muted, width: 2.5, head: 11, visible: false }));
        }
        const spans = AT_EIG.map((e) => p.span(N([e.v])[0], { color: C.purple, width: 3, visible: false }));
        return { eq, sys, guess, lhs, rhs, res, box, p, field, spans };
      },
      steps: [
        {
          say: 'Now let time run continuously. Two quantities change, and each rate of change depends linearly on the current state: $\\mathbf{x}\'(t) = A\\mathbf{x}(t)${x prime of t equals A x of t}. The arrows show the velocity $A\\mathbf{x}${A x} at each point.',
          do: async (s, o) => {
            await s.all(o.eq.write(), o.p.draw({ duration: 800 }));
            await o.sys.fadeIn();
            await s.stagger(o.field.map((a) => () => a.draw({ duration: 300 })), 40);
          },
        },
        {
          say: 'Try the simplest guess: a fixed vector times an exponential, $\\mathbf{v}e^{\\lambda t}${v e to the lambda t}. Its derivative is $\\lambda\\mathbf{v}e^{\\lambda t}${lambda v e to the lambda t}, while $A\\mathbf{x}${A x} is $A\\mathbf{v}e^{\\lambda t}${A v e to the lambda t}.',
          do: async (s, o) => {
            await o.guess.write();
            await o.lhs.write();
            await o.rhs.write();
          },
        },
        {
          say: 'They match exactly when $A\\mathbf{v} = \\lambda\\mathbf{v}${A v equals lambda v}. So eigenvectors give solutions, called eigenfunctions. Along an eigenvector line, the arrows point straight along the line.',
          do: async (s, o) => {
            await s.all(o.lhs.color('l', C.purple), o.rhs.color('r', C.purple));
            await s.all(o.res.write(), o.box.draw({ delay: 300 }));
            await s.all(o.spans.map((l, k) => l.draw({ duration: 700, delay: k * 300 })));
          },
        },
      ],
    },

    // 8
    {
      id: 'attractor',
      title: 'Example: an attractor',
      scene(s) {
        const L = (tex, y, opts = {}) => s.tex(tex, { x: 40, y, size: 32, anchor: [0, 0.5], visible: false, ...opts });
        const A = L(`A = ${texMat(AT)}`, 85, { size: 34 });
        const e1 = L(`\\lambda_1 = ${t(AT_EIG[0].value)}:\\ \\mathbf{v}_1 = ${tup(AT_EIG[0].v)}`, 175, { color: C.purple });
        const e2 = L(`\\lambda_2 = ${t(AT_EIG[1].value)}:\\ \\mathbf{v}_2 = ${tup(AT_EIG[1].v)}`, 230, { color: C.purple });
        const gen = L(`\\mathbf{x}(t) = c_1${expTex(AT_EIG[0].value)}\\mathbf{v}_1 + c_2${expTex(AT_EIG[1].value)}\\mathbf{v}_2`, 310, { size: 30 });
        const ic = L(`\\mathbf{x}(0) = ${tup(AT_X0)} = ${t(AT_C[0])}\\mathbf{v}_1 + ${AT_C[1].eq(1) ? '' : t(AT_C[1])}\\mathbf{v}_2`, 380, { color: C.green });
        const sol = L(`\\mathbf{x}(t) = ${t(AT_C[0])}${expTex(AT_EIG[0].value)}${tup(AT_EIG[0].v)} + ${AT_C[1].eq(1) ? '' : t(AT_C[1])}${expTex(AT_EIG[1].value)}${tup(AT_EIG[1].v)}`, 450, { color: C.green, size: 30 });
        const att = s.text('Both $\\lambda < 0$: an **attractor**', { x: 240, y: 535, size: 30, color: C.purple, visible: false });
        const p = s.plane({ x: 718, y: 300, width: 360, range: [-3, 3, -3, 3], labels: false, visible: false });
        const spans = AT_EIG.map((e) => p.span(N([e.v])[0], { color: C.purple, width: 2.5, visible: false }));
        const trs = portrait(s, p, AT, 'sink', { color: C.blue });
        const hl = trajectory(s, p, flow(AT, N([AT_X0])[0]), { color: C.green, width: 5 });
        const start = p.point(N([AT_X0])[0], { color: C.green, r: 9, visible: false });
        return { A, e1, e2, gen, ic, sol, att, p, spans, trs, hl, start };
      },
      steps: [
        {
          say: 'Here $A${A} has eigenvalues $-1${minus one} and $-3${minus three}, with eigenvectors $(1, 1)${one, one} and $(1, -1)${one, minus one}. Each gives an eigenfunction, and since the equation is linear, any combination is a solution too.',
          do: async (s, o) => {
            await s.all(o.A.fadeIn(), o.p.draw({ duration: 800 }));
            await s.all(o.e1.fadeIn(), o.e2.fadeIn({ delay: 300 }), o.spans.map((l, k) => l.draw({ duration: 700, delay: k * 300 })));
            await o.gen.write();
          },
        },
        {
          say: 'To start at $(3, 1)${three, one}, solve for the weights at time zero: $(3, 1) = 2(1, 1) + 1(1, -1)${three, one equals two times one, one, plus one times one, minus one}.',
          do: async (s, o) => {
            await o.start.draw();
            await o.ic.write();
            await o.sol.write({ duration: 1100 });
            await s.all(o.hl.path.draw({ duration: 1400 }), o.hl.arrow.fadeIn({ shift: [0, 0], delay: 1400 }));
          },
        },
        {
          say: 'Both eigenvalues are negative, so every trajectory decays into the origin: an attractor. The $e^{-3t}${e to the minus three t} part dies fastest, so trajectories come in along the $(1, 1)${one, one} line.',
          do: async (s, o) => {
            await drawTraj(s, o.trs, { duration: 1000, gap: 120 });
            await o.att.fadeIn();
          },
        },
      ],
    },

    // 9
    {
      id: 'saddle-spiral',
      title: 'Saddles and spirals',
      scene(s) {
        const mk = (x, A, kind, head, label, spansFrom) => {
          const p = s.plane({ x, y: 290, width: 330, range: [-3, 3, -3, 3], labels: false, visible: false });
          const h = s.tex(head, { x, y: 75, size: 30, visible: false });
          const spans = spansFrom.map((e) => p.span(N([e.v])[0], { color: C.purple, width: 2.5, visible: false }));
          const trs = portrait(s, p, A, kind, { color: C.blue });
          const lab = s.text(label, { x, y: 490, size: 32, weight: 600, visible: false });
          return { p, h, spans, trs, lab };
        };
        const sad = mk(250, SADDLE, 'saddle', `${texMat(SADDLE)}:\\ \\lambda = ${SADDLE_EIG.map((e) => t(e.value)).join(',\\ ')}`, 'saddle', SADDLE_EIG);
        const spi = mk(710, SPIRAL.A, 'spiral', `${texMat(SPIRAL.A)}:\\ \\lambda = ${t(SPIRAL.a)} \\pm ${t(SPIRAL.b)}i`, 'spiral point (sink)', []);
        const names = s.text('Lay: attractor (sink) · repeller (source) · saddle point · spiral point', { x: 480, y: 555, size: 30, color: C.muted, visible: false });
        const R = (tex, y, opts = {}) => s.tex(tex, { x: 250, y, size: 32, visible: false, ...opts });
        const real = [
          R(`\\lambda = ${ztex(SP_REAL.lam)},\\ \\ \\mathbf{v} = ${zvecTex(SP_REAL.v)}`, 115, { color: C.purple }),
          R(`\\mathbf{v}e^{\\lambda t} = ${expTex(SPIRAL.a)}(\\cos ${t(SPIRAL.b)}t + i\\sin ${t(SPIRAL.b)}t)\\,\\mathbf{v}`, 210, { size: 30 }),
          R(`\\mathbf{y}_1 = \\operatorname{Re} = ${SP_REAL.y1}`, 300, { color: C.blue }),
          R(`\\mathbf{y}_2 = \\operatorname{Im} = ${SP_REAL.y2}`, 400, { color: C.red }),
          R('\\mathbf{x}(t) = c_1\\mathbf{y}_1(t) + c_2\\mathbf{y}_2(t)', 490, { color: C.green }),
        ];
        return { sad, spi, names, real };
      },
      steps: [
        {
          say: 'When the eigenvalues have opposite signs, here $3${three} and $-1${minus one}, trajectories come in along the decaying eigenvector and leave along the growing one. The origin is a saddle point.',
          do: async (s, o) => {
            await s.all(o.sad.p.draw({ duration: 700 }), o.sad.h.fadeIn());
            await s.all(o.sad.spans.map((l) => l.draw({ duration: 600 })));
            await drawTraj(s, o.sad.trs, { duration: 900, gap: 110 });
            await o.sad.lab.fadeIn();
          },
        },
        {
          say: 'With complex eigenvalues, $-1 \\pm 2i${minus one plus or minus two i}, there\'s no eigenvector line to follow, and trajectories spiral. Here they spiral in, because the real part, $-1${minus one}, is negative.',
          do: async (s, o) => {
            await s.all(o.spi.p.draw({ duration: 700 }), o.spi.h.fadeIn());
            await drawTraj(s, o.spi.trs, { duration: 1500, gap: 150 });
            await o.spi.lab.fadeIn();
          },
        },
        {
          say: 'For real solutions, take $\\mathbf{v}e^{\\lambda t}${v e to the lambda t} with $\\lambda = -1 + 2i${lambda equals minus one plus two i} and split it. Its real part and its imaginary part are both real solutions, and every real solution combines them.',
          do: async (s, o) => {
            await s.all(o.sad.p.fadeOut(), o.sad.h.fadeOut(), o.sad.lab.fadeOut());
            await s.stagger(o.real.map((m) => () => m.write({ duration: 800 })), 900);
          },
        },
        {
          say: 'Lay\'s names for the origin: an attractor or sink, a repeller or source, a saddle point, and a spiral point.',
          do: (s, o) => o.names.fadeIn(),
        },
      ],
    },

    // 10
    {
      id: 'try-classify',
      kind: 'try',
      title: 'Your turn',
      say: 'Classify the origin. Look at the eigenvalues, and especially their real part.',
      prompt: `Classify the origin for $\\mathbf{x}' = A\\mathbf{x}$ with $A = ${texMat(SPIRAL.A)}$.`,
      answer: { type: 'choice', value: 'c' },
      choices: [
        { id: 'a', label: 'Saddle point', why: 'A saddle needs real eigenvalues of opposite sign; these are complex.' },
        { id: 'b', label: 'Spiral source', why: `The real part $${t(SPIRAL.a)}$ is negative, so $${expTex(SPIRAL.a)}$ decays: trajectories spiral in.` },
        { id: 'c', label: 'Spiral sink (attractor)', why: `Right: $\\lambda = ${t(SPIRAL.a)} \\pm ${t(SPIRAL.b)}i$; complex means spiral, negative real part means in.` },
        { id: 'd', label: 'Repeller', why: 'A repeller pushes everything away; here the real part is negative.' },
      ],
      hint: 'Complex eigenvalues mean rotation; the sign of the real part decides in or out.',
      solution: [
        `Trace $${t(SPIRAL.tr)}$, determinant $${t(SPIRAL.dt)}$: $${charTex(SPIRAL.tr, SPIRAL.dt)} = 0$, so $\\lambda = ${t(SPIRAL.a)} \\pm ${t(SPIRAL.b)}i$.`,
        `Solutions look like $${expTex(SPIRAL.a)}(\\cos ${t(SPIRAL.b)}t,\\ \\sin ${t(SPIRAL.b)}t)$ in suitable coordinates: they rotate, and the factor $${expTex(SPIRAL.a)}$ shrinks them.`,
        'So the origin is a **spiral point** that attracts: a spiral sink.',
      ],
    },

    // 11
    {
      id: 'mistake-imag',
      title: 'The trap: the imaginary part doesn\'t decide stability',
      scene(s) {
        const claim = s.text('“$b > 0$ means trajectories spiral out”', { x: 480, y: 60, size: 32, color: C.yellow, visible: false });
        const box = s.surround(claim, { color: C.yellow, visible: false });
        const mk = (x, a) => {
          const A = mat([[a, -2], [2, a]]);
          const p = s.plane({ x, y: 285, width: 290, range: [-3, 3, -3, 3], labels: false, visible: false });
          const h = s.tex(`\\lambda = \\part{a}{${t(a)}} \\pm \\part{b}{2}i`, { x, y: 115, size: 32, visible: false });
          const trs = portrait(s, p, A, a < 0 ? 'spiral' : 'spiralOut', { color: a < 0 ? C.blue : C.red });
          const lab = s.text(a < 0 ? '$a < 0$: decays, spirals in' : '$a > 0$: grows, spirals out', { x, y: 458, size: 30, color: a < 0 ? C.blue : C.red, visible: false });
          return { p, h, trs, lab };
        };
        const L = mk(250, -1), R = mk(710, 1);
        const eu = s.tex('e^{(a + bi)t} = \\part{g}{e^{at}}\\,(\\part{r}{\\cos bt + i\\sin bt})', { x: 480, y: 540, size: 38, visible: false });
        return { claim, box, L, R, eu };
      },
      steps: [
        {
          say: 'Here\'s the trap: judging stability by $b${b}, the imaginary part. These two matrices have the same $b = 2${b equals two}, and one spirals in while the other spirals out.',
          do: async (s, o) => {
            await s.all(o.claim.write(), o.box.draw({ delay: 300 }));
            await s.all(o.L.p.draw({ duration: 600 }), o.R.p.draw({ duration: 600 }), o.L.h.fadeIn(), o.R.h.fadeIn());
            await s.all(drawTraj(s, o.L.trs, { duration: 1300, gap: 120 }), drawTraj(s, o.R.trs, { duration: 1300, gap: 120 }));
            await s.all(s.strike(o.claim, { color: 'yellow' }), o.L.h.color('b', C.yellow), o.R.h.color('b', C.yellow));
          },
        },
        {
          say: 'Look at the exponential. $e^{(a+bi)t} = e^{at}(\\cos bt + i\\sin bt)${e to the a plus b i, times t, equals e to the a t, times cosine b t plus i sine b t}. The cosine and sine part just goes around the circle; the $e^{at}${e to the a t} part sets the size.',
          do: async (s, o) => {
            await o.eu.write({ duration: 1200 });
            await s.all(o.eu.color('r', C.purple), o.eu.color('g', C.green, { delay: 500 }));
          },
        },
        {
          say: 'So the rotation comes from $b${b}, and growth or decay comes from $a${a}. A negative real part spirals in; a positive one spirals out.',
          do: async (s, o) => {
            await s.all(o.L.h.color('b', C.ink), o.R.h.color('b', C.ink), o.L.h.color('a', C.green), o.R.h.color('a', C.green));
            await s.all(o.L.lab.fadeIn(), o.R.lab.fadeIn({ delay: 300 }));
          },
        },
      ],
    },

    // 12
    {
      id: 'wo-ivp',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Set t equal to zero to find the weights, then write out the solution and classify the origin.',
      prompt: WO_IVP.prompt,
      answer: WO_IVP.answer,
      hints: WO_IVP.hints,
      solution: WO_IVP.solution,
      generate: generateIvp,
    },

    // 13
    {
      id: 'cp-spiral',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain this in your own words.',
      prompt: 'Why do complex eigenvalues produce rotation, and what decides whether trajectories spiral in or out?',
      points: [
        '$A = PCP^{-1}$ with $C = \\begin{bmatrix} a & -b \\\\ b & a \\end{bmatrix}$, a rotation–scaling matrix',
        'In $P$-coordinates the map (or the flow) is a rotation, by an angle tied to $b$',
        'For powers $A^k$ the modulus $r = |\\lambda|$ decides growth: $r > 1$ out, $r < 1$ in',
        'For $\\mathbf{x}\' = A\\mathbf{x}$ the real part $a$ decides, through $e^{at}$',
        '$P$ only distorts circles into ellipses; it does not change in versus out',
      ],
    },

    // 14
    {
      id: 'summary-complex',
      title: 'What you have now',
      scene(s) {
        const REP = AT.map((r) => r.map((x) => x.neg()));
        const kinds = [
          [AT, 'sink', 'attractor'],
          [REP, 'source', 'repeller'],
          [SADDLE, 'saddle', 'saddle'],
          [SPIRAL.A, 'spiral', 'spiral'],
        ];
        const panels = kinds.map(([A, kind, name], k) => {
          const x = 140 + 227 * k;
          const p = s.plane({ x, y: 180, width: 190, range: [-3, 3, -3, 3], labels: false, grid: false, visible: false });
          const trs = portrait(s, p, A, kind, { color: C.blue });
          const lab = s.text(name, { x, y: 305, size: 30, weight: 600, visible: false });
          const show = () => s.all(p.draw({ duration: 500 }), drawTraj(s, trs, { duration: 800, gap: 60 }), lab.fadeIn({ delay: 400 }));
          return { p, lab, show };
        });
        const lines = [
          'Complex eigenvalues: rotation and scaling, $A = PCP^{-1}$',
          '$\\mathbf{x}\' = A\\mathbf{x}$: combine eigenfunctions $\\mathbf{v}e^{\\lambda t}$',
          'Signs of the eigenvalues (or real parts) decide the picture',
        ].map((str, i) => s.text(str, { x: 480, y: 390 + 60 * i, size: 30, visible: false }));
        return { panels, lines };
      },
      steps: [
        {
          say: 'Complex eigenvalues mean rotation and scaling: in the right coordinates, $A${A} is a rotation–scaling matrix, and the flow spirals.',
          do: (s, o) => s.all(o.panels[3].show(), o.lines[0].fadeIn({ delay: 300 })),
        },
        {
          say: 'For $\\mathbf{x}\' = A\\mathbf{x}${x prime equals A x}, combine eigenfunctions, $\\mathbf{v}e^{\\lambda t}${v e to the lambda t}, and fit the starting point. With two negative eigenvalues everything flows in.',
          do: (s, o) => s.all(o.panels[0].show(), o.lines[1].fadeIn({ delay: 300 })),
        },
        {
          say: 'And the signs of the eigenvalues, or of their real parts, decide the picture: both positive gives a repeller, opposite signs a saddle. Next we turn to orthogonality.',
          do: async (s, o) => {
            await s.all(o.panels[1].show(), o.panels[2].show());
            await o.lines[2].fadeIn();
          },
        },
      ],
    },
  ],
};
