/**
 * Lecture 29 · The singular value decomposition (Lay 7.4). Design: matrix/PLAN.md § 29.
 * Every matrix, eigenvalue, singular value and answer below is computed with core/linalg.js
 * (exactly where the numbers are rational; square roots are kept symbolic as √n).
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, mul, mulVec, transpose, inverse, dot, eqMat, charPoly, rationalEigen, eigenspace, nullspace, texMat, texVec } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- exact helpers

const t = (x) => F(x).tex({ inline: true });
const nums = (v) => v.map(Number);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** Integer multiple of a vector of Fracs, first nonzero entry positive. */
function intVec(v) {
  const l = v.reduce((m, x) => (m * x.d) / gcd(m, x.d), 1n);
  const w = v.map((x) => x.mul(F(l)));
  return w.find((x) => !x.zero).sign() < 0 ? w.map((x) => x.neg()) : w;
}
/** √n for a positive integer n, simplified: 8 → 2\sqrt{2}. */
function sqrtTex(n) {
  let k = Math.floor(Math.sqrt(n));
  while (n % (k * k)) k--;
  const m = n / (k * k);
  return m === 1 ? `${k}` : `${k === 1 ? '' : k}\\sqrt{${m}}`;
}
/** Exact √ of a nonnegative Frac when it is rational, else null. */
function ratSqrt(q) {
  const r = (x) => {
    const s = BigInt(Math.round(Math.sqrt(Number(x))));
    return s * s === x ? s : null;
  };
  const a = r(q.n), b = r(q.d);
  return a !== null && b !== null ? F(a).div(F(b)) : null;
}
/** TeX of k/√n (k, n integers): simplified surd. */
function surdTex(k, n) {
  if (k === 0) return '0';
  let s = Math.floor(Math.sqrt(n));
  while (n % (s * s)) s--;
  const m = n / (s * s);
  // k / (s√m) = k√m / (s m)
  const num = Math.abs(k), den = s * m, g = Number(gcd(BigInt(num), BigInt(den)));
  const p = num / g, q = den / g;
  const root = m === 1 ? '' : `\\sqrt{${m}}`;
  const top = `${p === 1 && root ? '' : p}${root}`;
  return `${k < 0 ? '-' : ''}${q === 1 ? top : `\\frac{${top}}{${q}}`}`;
}
/** A unit vector w/√N written `\frac{1}{√N}(w)` (w an integer vector). */
const unitTex = (w, N) => (N === 1 ? `(${w.join(', ')})` : `\\frac{1}{${sqrtTex(N)}}(${w.join(', ')})`);

/**
 * SVD data of A from the eigen-pairs of AᵀA: λ (descending, with zeros), integer eigenvectors v (unnormalized),
 * σ² = λ, and for σ > 0 the left vector u = Av/(σ|v|) as an integer vector over √N.
 */
function svdData(A0, { orient = false } = {}) {
  const A = mat(A0);
  const AtA = mul(transpose(A), A);
  const pairs = [];
  for (const { value } of rationalEigen(AtA)) for (const v of eigenspace(AtA, value)) pairs.push({ lambda: value, v: intVec(v) });
  // orient: a 2 × 2 V with det > 0 (a rotation), by flipping v2
  if (orient && pairs.length === 2 && pairs[0].v[0].mul(pairs[1].v[1]).sub(pairs[0].v[1].mul(pairs[1].v[0])).sign() < 0) pairs[1].v = pairs[1].v.map((x) => x.neg());
  return {
    A,
    AtA,
    pairs: pairs.map(({ lambda, v }) => {
      const n2 = dot(v, v);
      const out = { lambda, v, n2: Number(n2), sigmaTex: lambda.zero ? '0' : sqrtTex(Number(lambda)), sigma: Math.sqrt(Number(lambda)) };
      if (!lambda.zero) {
        const Av = mulVec(A, v); // integer vector, |Av|² = λ|v|²
        const g = Av.reduce((m, x) => gcd(m, x.n < 0n ? -x.n : x.n), 0n);
        const wi = Av.map((x) => x.div(F(g)));
        const N = lambda.mul(n2).div(F(g * g));
        out.u = { w: wi.map(Number), N: Number(N), num: wi.map((x) => Number(x) / Math.sqrt(Number(N))) };
        out.Av = Av; // A times the integer v
      }
      return out;
    }),
  };
}

// ---------------------------------------------------------------- data

/** Beats 1–5: the running 2 × 2 example. */
const MAIN = svdData([[2, 2], [-1, 2]], { orient: true });
const A = MAIN.A;
const [P1, P2] = MAIN.pairs;
const vUnit = (p) => nums(p.v).map((x) => x / Math.sqrt(p.n2));
const V1u = vUnit(P1), V2u = vUnit(P2);
const AV1 = nums(mulVec(A, P1.v)).map((x) => x / Math.sqrt(P1.n2)); // A v1 (unit v1)
const AV2 = nums(mulVec(A, P2.v)).map((x) => x / Math.sqrt(P2.n2));
const AINV = inverse(A);
/**
 * U Σ Vᵀ = Σᵢ σᵢ uᵢ vᵢᵀ = Σᵢ kᵢ wᵢ vᵢᵀ with wᵢ, vᵢ integer vectors and kᵢ = σᵢ/(√Nᵢ |vᵢ|) = √(λᵢ / (Nᵢ |vᵢ|²)),
 * rational for this example: rebuild A exactly.
 */
const KS = [P1, P2].map((p) => ratSqrt(p.lambda.div(F(p.u.N * p.n2))));
if (KS.some((k) => k === null)) throw new Error('svd: irrational rebuild coefficient');
const REBUILT = [P1, P2]
  .map((p, i) => p.u.w.map((a) => p.v.map((b) => F(a).mul(b).mul(KS[i]))))
  .reduce((X, Y) => X.map((row, r) => row.map((x, c) => x.add(Y[r][c]))));
if (!eqMat(REBUILT, A)) throw new Error('svd: U Σ Vᵀ does not rebuild A');
const VT_NUM = [V1u, V2u];
const SIG_NUM = [[P1.sigma, 0], [0, P2.sigma]];
const U_MAP = transpose([P1.u.num, P2.u.num]); // columns uᵢ
if (P1.u.N !== P2.u.N || P1.n2 !== P2.n2) throw new Error('svd: expected a common normalizer');
const U_TEX = `\\frac{1}{${sqrtTex(P1.u.N)}}${texMat(transpose([P1.u.w, P2.u.w]).map((r) => r.map((x) => F(x))))}`;
const V1_ANGLE = Math.atan2(V1u[1], V1u[0]);
const VT_TEX = `\\frac{1}{${sqrtTex(P1.n2)}}${texMat([P1.v, P2.v])}`;
const SIG_TEX = `\\begin{bmatrix} ${P1.sigmaTex} & 0 \\\\ 0 & ${P2.sigmaTex} \\end{bmatrix}`;

/** Beats 6–7: the shear. */
const SHEAR = mat([[1, 1], [0, 1]]);
const SH_AtA = mul(transpose(SHEAR), SHEAR);
const SH_CP = charPoly(SH_AtA); // λ² − (tr)λ + det
const SH_L1 = (() => {
  const b = -Number(SH_CP[1]), c = Number(SH_CP[2]);
  return (b + Math.sqrt(b * b - 4 * c)) / 2;
})();
const SH_S1 = Math.sqrt(SH_L1); // (1 + √5)/2
const PHI = (1 + Math.sqrt(5)) / 2;
if (Math.abs(SH_S1 - PHI) > 1e-12) throw new Error('svd: shear σ₁ mismatch');
const SH_EIG = rationalEigen(SHEAR); // [{1, mult 2}]
const SH_V1 = (() => {
  const [[a, b], [, d]] = SH_AtA.map(nums);
  const v = Math.abs(b) > 1e-12 ? [b, SH_L1 - a] : [1, 0];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
})();
const SH_AV1 = SHEAR.map((r) => Number(r[0]) * SH_V1[0] + Number(r[1]) * SH_V1[1]); // σ₁u₁ = S v₁

/** Beats 8–9: the 2 × 3 example. */
const RECT = svdData([[1, 1, 0], [0, 1, 1]]);
const R = RECT.A;
const [R1, R2, R3] = RECT.pairs;
const RV3_CHECK = mulVec(R, R3.v);
if (!R3.lambda.zero || RV3_CHECK.some((x) => !x.zero)) throw new Error('svd: null vector check failed');

/** Workout. */
const WOD = svdData([[1, 1], [0, 1], [1, 0]]);
const [W1, W2] = WOD.pairs;
const WU3 = intVec(nullspace(transpose(WOD.A))[0]);

// ---------------------------------------------------------------- scene helpers

const circlePts = (n = 120) => Array.from({ length: n }, (_, k) => [Math.cos((2 * Math.PI * k) / n), Math.sin((2 * Math.PI * k) / n)]);
const app = (M, p) => [M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1]];
const rightAngle = (p, a, b, k = 0.35, opts = {}) =>
  p.polygon([[0, 0], [k * a[0], k * a[1]], [k * (a[0] + b[0]), k * (a[1] + b[1])], [k * b[0], k * b[1]]], { fill: 'none', width: 2.5, ...opts });

/** Beats 1, 4: the plane with the unit circle; `mapped`: already sent through A. */
function mainPlane(s, { mapped = false, visible = false } = {}) {
  const p = s.plane({ x: 630, y: 300, width: 480, range: [-4, 4, -3, 3], names: ['x_1', 'x_2'], visible });
  const circle = p.polygon(circlePts(), { color: C.blue, visible });
  if (mapped) p.applyMatrix(A.map(nums), { duration: 0 });
  return { p, circle };
}

/** Projects sphere great circles of a Space to stage polygons. */
const sphereCircle = (sp, f) => circlePts(72).map(([c, s0]) => sp.toStage(f(c, s0)));

// ---------------------------------------------------------------- the lecture

export default {
  id: 'svd',
  title: 'The singular value decomposition',
  goals: [
    'See any matrix as turning the unit circle into an ellipse whose semi-axes are the singular values',
    'Compute $\\sigma_i = \\sqrt{\\lambda_i}$ from $A^TA$, the right singular vectors $\\mathbf{v}_i$ and the left singular vectors $\\mathbf{u}_i = A\\mathbf{v}_i/\\sigma_i$',
    'Assemble $A = U\\Sigma V^T$ and read off the rank and bases for $\\operatorname{Col} A$ and $\\operatorname{Nul} A$',
  ],
  beats: [
    // 1
    {
      id: 'circle-to-ellipse',
      title: 'Every matrix turns a circle into an ellipse',
      scene(s) {
        const { p, circle } = mainPlane(s);
        const aT = s.tex(`A = ${texMat(A)}`, { x: 170, y: 120, size: 40, visible: false });
        const es = [[1, 0], [0, 1]].map((e) => p.vector(e, { color: C.muted, width: 4, visible: false }));
        const vs = [V1u, V2u].map((v, k) => p.vector(v, { color: C.purple, label: `\\mathbf{v}_${k + 1}`, labelSize: 32, visible: false }));
        const ra = rightAngle(p, P1.u.num, P2.u.num, 0.32, { color: C.green, transform: false, visible: false });
        const sl = [
          p.label([AV1[0] / 2, AV1[1] / 2], '\\sigma_1', { color: C.green, size: 32, offset: [16, 22], transform: false, visible: false }),
          p.label([AV2[0] / 2, AV2[1] / 2], '\\sigma_2', { color: C.green, size: 32, offset: [-26, -10], transform: false, visible: false }),
        ];
        const perp = s.tex('A\\mathbf{v}_1 \\perp A\\mathbf{v}_2', { x: 190, y: 250, size: 32, color: C.purple, visible: false });
        const sig = [P1, P2].map((q, k) => s.tex(`\\sigma_${k + 1} = \\|A\\mathbf{v}_${k + 1}\\| = ${q.sigmaTex}`, { x: 190, y: 370 + 70 * k, size: 34, color: C.green, visible: false }));
        return { p, circle, aT, es, vs, ra, sl, perp, sig };
      },
      steps: [
        {
          say: 'Not every matrix has perpendicular eigenvectors, but every matrix does this: it turns the unit circle into an ellipse. Most perpendicular pairs come out crooked.',
          do: async (s, o) => {
            await s.all(o.aT.write(), o.p.draw({ duration: 900 }));
            await s.all(o.circle.draw(), o.es.map((e) => e.grow()));
            await o.p.applyMatrix(A.map(nums), { duration: 1800 });
          },
        },
        {
          say: 'But one perpendicular pair of unit vectors, $\\mathbf{v}_1${v one} and $\\mathbf{v}_2${v two}, lands exactly on the axes of the ellipse, still perpendicular.',
          do: async (s, o) => {
            await s.all(o.p.applyMatrix(AINV.map(nums), { duration: 1300 }), o.es.map((e) => e.fadeOut({ delay: 900 })));
            await s.all(o.vs.map((v) => v.grow()));
            await o.p.applyMatrix(A.map(nums), { duration: 1800 });
            o.vs.forEach((v, k) => v.setLabel(`A\\mathbf{v}_${k + 1}`));
            await s.all(o.ra.draw(), o.perp.write());
          },
        },
        {
          say: 'The lengths of those axes are the singular values of $A${A}: $\\sigma_1 = 3${sigma one equals three} and $\\sigma_2 = 2${sigma two equals two}.',
          do: async (s, o) => {
            await s.all(o.sl.map((l) => l.draw()), o.vs.map((v) => v.recolor(C.green)));
            await s.stagger(o.sig.map((x) => () => x.write()), 700);
          },
        },
      ],
    },

    // 2
    {
      id: 'ata',
      title: 'Finding them: AᵀA',
      scene(s) {
        const lx = 285;
        const chain = s.tex('\\|A\\mathbf{x}\\|^2 = \\mathbf{x}^T\\part{ata}{(A^TA)}\\mathbf{x}', { x: lx, y: 80, size: 32, visible: false });
        const ata = s.tex(`A^TA = ${texMat(MAIN.AtA)}`, { x: lx, y: 180, size: 34, visible: false });
        const eig = [P1, P2].map((q, k) => s.tex(`\\lambda_${k + 1} = ${t(q.lambda)},\\ \\mathbf{v}_${k + 1} = ${unitTex(nums(q.v), q.n2)}`, { x: lx, y: 280 + 92 * k, size: 32, color: C.purple, visible: false }));
        const sig = s.tex(`\\sigma_1 = \\sqrt{${t(P1.lambda)}} = ${P1.sigmaTex},\\quad \\sigma_2 = \\sqrt{${t(P2.lambda)}} = ${P2.sigmaTex}`, { x: lx, y: 500, size: 32, color: C.green, visible: false });
        const p = s.plane({ x: 735, y: 300, width: 300, range: [-3.2, 3.2, -3.2, 3.2], labels: false, visible: false });
        const ring = p.polygon(circlePts(), { color: C.muted, fill: 'none', width: 2, dash: '6 5', visible: false });
        const ell = p.polygon(circlePts().map((q) => app(A.map(nums), q)), { color: C.green, fill: 'none', visible: false });
        // sweep once around, ending on v1 (the longest stretch)
        const angles = Array.from({ length: 22 }, (_, k) => V1_ANGLE - ((21 - k) * 15 * Math.PI) / 180);
        const xs = angles.map((q) => [Math.cos(q), Math.sin(q)]);
        const xv = p.vector(xs[0], { color: C.blue, label: '\\mathbf{x}', labelSize: 30, visible: false });
        const ax = p.vector(app(A.map(nums), xs[0]), { color: C.green, label: 'A\\mathbf{x}', labelSize: 30, visible: false });
        return { chain, ata, eig, sig, p, ring, ell, xs, xv, ax };
      },
      steps: [
        {
          say: 'Which unit vector does $A${A} stretch the most? Its length squared is $\\mathbf{x}^T(A^TA)\\mathbf{x}${x transpose, A transpose A, x}: a quadratic form, for the symmetric matrix $A^TA${A transpose A}.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 700 }), o.ring.draw(), o.ell.draw());
            await s.all(o.xv.grow(), o.ax.grow());
            await s.all(o.chain.write({ duration: 1300 }), (async () => {
              for (const q of o.xs.slice(1)) await s.all(o.xv.moveTo(q, { duration: 160, ease: (u) => u }), o.ax.moveTo(app(A.map(nums), q), { duration: 160, ease: (u) => u }));
            })());
            await o.chain.color('ata', C.purple);
          },
        },
        {
          say: 'So diagonalize $A^TA${A transpose A}. It is symmetric, and its eigenvalues are never negative, because they measure squared lengths. Here they are $9${nine} and $4${four}.',
          do: async (s, o) => {
            await o.ata.write();
            await s.stagger(o.eig.map((e) => () => e.write()), 800);
          },
        },
        {
          say: 'The singular values are their square roots, listed in decreasing order. The largest, $3${three}, is the most $A${A} can stretch a unit vector.',
          do: async (s, o) => {
            await o.sig.write();
            await o.ax.flash({ color: C.green });
          },
        },
      ],
    },

    // 3
    {
      id: 'fill-sv',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Two formulas to lock in before we assemble the decomposition.',
      prompt: 'Complete the recipe for the singular values and the left singular vectors.',
      lines: [
        [{ tex: '\\sigma_i = \\sqrt{\\lambda_i\\big(\\blank{mat}\\big)}', blanks: { mat: { chips: ['A^TA', 'A', 'A+A^T'], answer: 'A^TA', hint: 'The symmetric matrix whose quadratic form is $\\|A\\mathbf{x}\\|^2$.' } } }],
        [{ tex: '\\mathbf{u}_i = \\frac{1}{\\blank{den}}\\,A\\mathbf{v}_i \\quad (\\text{for } \\sigma_i > 0)', blanks: { den: { chips: ['\\sigma_i', '\\lambda_i', '\\|\\mathbf{v}_i\\|'], answer: '\\sigma_i', hint: 'The length of $A\\mathbf{v}_i$.' } } }],
      ],
      solution: [
        'The singular values are the square roots of the eigenvalues of the symmetric matrix $A^TA$ (not of $A$).',
        '$\\|A\\mathbf{v}_i\\| = \\sigma_i$ for a unit eigenvector $\\mathbf{v}_i$, so dividing $A\\mathbf{v}_i$ by $\\sigma_i$ gives a unit vector $\\mathbf{u}_i$.',
      ],
    },

    // 4
    {
      id: 'u-vectors',
      title: 'The left singular vectors',
      scene(s) {
        const { p, circle } = mainPlane(s, { mapped: true, visible: true });
        const avs = [AV1, AV2].map((v, k) => p.vector(v, { color: C.green, label: `A\\mathbf{v}_${k + 1}`, labelSize: 32, visible: false }));
        const ra = rightAngle(p, P1.u.num, P2.u.num, 0.32, { color: C.green, visible: false });
        const lx = 205;
        const avT = [P1, P2].map((q, k) => s.tex(`A\\mathbf{v}_${k + 1} = ${q.sigmaTex}\\cdot ${unitTex(q.u.w, q.u.N)}`, { x: lx, y: 80 + 92 * k, size: 32, color: C.green, visible: false }));
        const dotT = s.tex('A\\mathbf{v}_1 \\cdot A\\mathbf{v}_2 = 0', { x: lx, y: 255, size: 32, visible: false });
        const uF = s.tex('\\mathbf{u}_i = \\frac{1}{\\sigma_i}A\\mathbf{v}_i\\ \\ (\\sigma_i > 0)', { x: lx, y: 345, size: 32, color: C.teal, visible: false });
        const uT = s.group([P1, P2].map((q, k) => s.tex(`\\mathbf{u}_${k + 1} = ${unitTex(q.u.w, q.u.N)}`, { x: lx, y: 440 + 88 * k, size: 32, color: C.teal, visible: false })));
        return { p, circle, avs, ra, avT, dotT, uF, uT };
      },
      steps: [
        {
          say: 'The images $A\\mathbf{v}_1${A v one} and $A\\mathbf{v}_2${A v two} are perpendicular, and their lengths are exactly $\\sigma_1${sigma one} and $\\sigma_2${sigma two}.',
          do: async (s, o) => {
            await s.all(o.avs.map((v) => v.grow()));
            await s.stagger(o.avT.map((x) => () => x.write()), 600);
            await s.all(o.ra.draw(), o.dotT.write());
          },
        },
        {
          say: 'Divide each by its length and you get unit vectors, the left singular vectors $\\mathbf{u}_1${u one} and $\\mathbf{u}_2${u two}: a new orthonormal pair, turned away from the $\\mathbf{v}${v}\'s.',
          do: async (s, o) => {
            await o.uF.write();
            o.avs.forEach((v, k) => v.setLabel(`\\mathbf{u}_${k + 1}`));
            await s.all(o.avs.map((v, k) => v.moveTo([P1, P2][k].u.num, { duration: 1100 })), o.avs.map((v) => v.recolor(C.teal)));
            await o.uT.write();
          },
        },
      ],
    },

    // 5
    {
      id: 'assemble',
      title: 'A = UΣVᵀ',
      scene(s) {
        const p = s.plane({ x: 645, y: 300, width: 440, range: [-3.5, 3.5, -3, 3], names: ['x_1', 'x_2'], visible: false });
        const circle = p.polygon(circlePts(), { color: C.blue, visible: false });
        const vs = [V1u, V2u].map((v, k) => p.vector(v, { color: C.purple, label: `\\mathbf{v}_${k + 1}`, labelSize: 32, visible: false }));
        const lx = 205;
        const vt = s.tex(`V^T = ${VT_TEX}`, { x: lx, y: 95, size: 32, color: C.purple, visible: false });
        const sg = s.tex(`\\Sigma = ${SIG_TEX}`, { x: lx, y: 205, size: 32, color: C.green, visible: false });
        const ut = s.tex(`U = ${U_TEX}`, { x: lx, y: 305, size: 32, color: C.teal, visible: false });
        const all = s.tex('A = U\\Sigma V^T', { x: lx, y: 410, size: 46, visible: false });
        const chk = s.tex(`U\\Sigma V^T = ${texMat(REBUILT)}`, { x: lx, y: 500, size: 32, color: C.green, visible: false });
        return { p, circle, vs, vt, sg, ut, all, chk };
      },
      steps: [
        {
          say: 'Watch $A${A} as three simple moves. First $V^T${V transpose} rotates the circle, or reflects it, so that $\\mathbf{v}_1${v one} and $\\mathbf{v}_2${v two} land on the coordinate axes.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 800 }), o.circle.draw(), o.vs.map((v) => v.grow({ delay: 400 })));
            await s.all(o.vt.write(), o.p.applyMatrix(VT_NUM, { duration: 1800 }));
          },
        },
        {
          say: 'Then $\\Sigma${sigma} stretches along the axes, by $3${three} and $2${two}. The circle becomes an ellipse.',
          do: async (s, o) => {
            await s.all(o.sg.write(), o.p.applyMatrix(SIG_NUM, { duration: 1800 }));
            o.vs.forEach((v, k) => v.setLabel(`\\sigma_${k + 1}\\mathbf{e}_${k + 1}`));
          },
        },
        {
          say: 'Finally $U${U} rotates the ellipse into place, carrying the axes onto $\\mathbf{u}_1${u one} and $\\mathbf{u}_2${u two}.',
          do: async (s, o) => {
            await o.ut.write();
            await o.p.applyMatrix(U_MAP, { duration: 1600 });
            o.vs.forEach((v, k) => v.setLabel(`\\sigma_${k + 1}\\mathbf{u}_${k + 1}`));
            await s.all(o.vs.map((v) => v.recolor(C.green)));
          },
        },
        {
          say: 'Every matrix is these three moves: rotate or reflect, stretch, rotate or reflect again. Multiply them out and you get $A${A} back.',
          do: async (s, o) => {
            await o.all.write();
            await o.chk.write();
          },
        },
      ],
    },

    // 6
    {
      id: 'try-sv-not-eig',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Be careful which matrix you take eigenvalues of.',
      prompt: `$A = ${texMat(SHEAR)}$. Its eigenvalues are $1, 1$. Its largest singular value is…`,
      answer: { type: 'choice', value: 'c' },
      choices: [
        { id: 'a', label: '$1$', why: `Singular values come from $A^TA = ${texMat(SH_AtA)}$, not from $A$.` },
        { id: 'b', label: '$2$', why: '$2$ is the trace of $A$, not a singular value.' },
        { id: 'c', label: `$\\frac{1 + \\sqrt{5}}{2} \\approx ${PHI.toFixed(3)}$`, why: 'Right: it is the square root of the largest eigenvalue of $A^TA$.' },
        { id: 'd', label: `$\\frac{3 + \\sqrt{5}}{2}$`, why: 'That is $\\lambda_1(A^TA)$ itself: take the square root.' },
      ],
      hint: 'Find the eigenvalues of $A^TA$, then take square roots.',
      solution: [
        `$A^TA = ${texMat(SH_AtA)}$ has trace $3$ and determinant $1$, so $\\lambda^2 - 3\\lambda + 1 = 0$ and $\\lambda = \\frac{3 \\pm \\sqrt{5}}{2}$.`,
        `$\\sigma_1 = \\sqrt{\\frac{3 + \\sqrt{5}}{2}} = \\frac{1 + \\sqrt{5}}{2} \\approx ${PHI.toFixed(3)}$ (square $\\frac{1 + \\sqrt5}{2}$ to check).`,
        'The eigenvalues of $A$ (both $1$) say nothing about this: a shear keeps one line fixed but stretches other directions more.',
      ],
    },

    // 7
    {
      id: 'mistake-eigen',
      title: 'The trap: singular values aren\'t eigenvalues',
      scene(s) {
        const p = s.plane({ x: 650, y: 300, width: 440, range: [-3, 3, -2.5, 2.5], names: ['x_1', 'x_2'], visible: false });
        const circle = p.polygon(circlePts(), { color: C.blue, visible: false });
        const line = p.span([1, 0], { color: C.yellow, width: 3, dash: '8 6', transform: false, visible: false });
        const e1 = p.vector([1, 0], { color: C.yellow, label: '\\mathbf{e}_1', labelSize: 32, visible: false });
        const big = p.vector([SH_AV1[0], SH_AV1[1]], { color: C.green, label: '\\sigma_1\\mathbf{u}_1', labelSize: 32, transform: false, visible: false });
        const lx = 205;
        const mT = s.tex(`A = ${texMat(SHEAR)}`, { x: lx, y: 95, size: 38, visible: false });
        const lam = s.tex(`\\lambda = ${t(SH_EIG[0].value)}`, { x: lx, y: 205, size: 38, color: C.yellow, visible: false });
        const lamT = s.text('stretch of a fixed line', { x: lx, y: 258, size: 30, color: C.yellow, visible: false });
        const sig = s.tex(`\\sigma_1 \\approx ${SH_S1.toFixed(3)}`, { x: lx, y: 360, size: 38, color: C.green, visible: false });
        const sigT = s.text('the longest stretch', { x: lx, y: 413, size: 30, color: C.green, visible: false });
        const same = s.text('They agree only for symmetric matrices with $\\lambda_i \\ge 0$.', { x: 480, y: 547, size: 30, visible: false });
        return { p, circle, line, e1, big, mT, lam, lamT, sig, sigT, same };
      },
      steps: [
        {
          say: 'Here\'s the trap: singular values are not eigenvalues. Eigenvalues measure the stretch along lines that stay put, and this shear has only one such line, stretched by $1${one}.',
          do: async (s, o) => {
            await s.all(o.mT.write(), o.p.draw({ duration: 800 }));
            await s.all(o.circle.draw(), o.line.draw(), o.e1.grow());
            await o.p.applyMatrix(SHEAR.map(nums), { duration: 1800 });
            await s.all(o.lam.write(), o.lamT.fadeIn());
          },
        },
        {
          say: 'Singular values measure the ellipse, and the shear\'s ellipse reaches out to about $1.618${one point six one eight}. That\'s the largest singular value.',
          do: async (s, o) => {
            await o.big.grow();
            await s.all(o.sig.write(), o.sigT.fadeIn());
          },
        },
        {
          say: 'The two only coincide for symmetric matrices with nonnegative eigenvalues, where the eigenvectors already sit on the ellipse\'s axes.',
          do: (s, o) => o.same.fadeIn(),
        },
      ],
    },

    // 8
    {
      id: 'rectangular',
      title: 'Rectangular matrices',
      scene(s) {
        const aT = s.tex(`A = ${texMat(R)}`, { x: 190, y: 70, size: 32, visible: false });
        const eT = s.tex(`A^TA:\\ \\lambda = ${RECT.pairs.map((q) => t(q.lambda)).join(', ')}`, { x: 700, y: 70, size: 32, color: C.purple, visible: false });
        const sp = s.space({ x: 210, y: 300, size: 250, range: 1.4, visible: false });
        const gc = [
          (c, d) => [c, d, 0],
          (c, d) => [0, c, d],
          (c, d) => [c, 0, d],
        ];
        const sphere = gc.map((f) => s.polygon(sphereCircle(sp, f), { color: C.blue, width: 2.5, visible: false }));
        const p = s.plane({ x: 735, y: 300, width: 300, range: [-2, 2, -2, 2], labels: false, names: ['x_1', 'x_2'], visible: false });
        const Rn = R.map(nums);
        const img = (f) => circlePts(72).map(([c, d]) => {
          const q = f(c, d);
          return p.toStage([Rn[0][0] * q[0] + Rn[0][1] * q[1] + Rn[0][2] * q[2], Rn[1][0] * q[0] + Rn[1][1] * q[1] + Rn[1][2] * q[2]]);
        });
        const flyers = gc.map((f) => ({ mob: s.polygon(sphereCircle(sp, f), { color: C.green, width: 2.5, visible: false }), to: img(f) }));
        const arrow = s.arrow(395, 300, 560, 300, { color: C.ink, visible: false });
        const aLab = s.tex('A', { x: 478, y: 270, size: 34, visible: false });
        const sig = s.tex(`\\Sigma = \\begin{bmatrix} ${R1.sigmaTex} & 0 & \\part{z1}{0} \\\\ 0 & ${R2.sigmaTex} & \\part{z2}{0} \\end{bmatrix}`, { x: 175, y: 505, size: 30, color: C.green, visible: false });
        const shapeT = s.tex('A = \\underbrace{U}_{\\textstyle 2\\times 2}\\,\\underbrace{\\Sigma}_{\\textstyle 2\\times 3}\\,\\underbrace{V^T}_{\\textstyle 3\\times 3}', { x: 540, y: 512, size: 30, visible: false });
        const fill = p.polygon(circlePts().map(([c, d]) => [0, 1].map((k) => R1.sigma * c * R1.u.num[k] + R2.sigma * d * R2.u.num[k])), { color: C.green, width: 3.5, visible: false });
        const thm = s.defCard({ kind: 'theorem', title: 'Theorem 10 (the singular value decomposition)', body: 'Let $A$ be $m \\times n$ with rank $r$. Then $A = U\\Sigma V^T$, where $U$ is an $m \\times m$ orthogonal matrix, $V$ is an $n \\times n$ orthogonal matrix, and the $m \\times n$ matrix $\\Sigma$ has $\\sigma_1 \\ge \\cdots \\ge \\sigma_r > 0$ on its diagonal and zeros everywhere else.', x: 480, y: 290, width: 820, size: 30, visible: false });
        const v3 = sp.vector(nums(R3.v).map((x) => x / Math.sqrt(R3.n2)), { color: C.yellow, label: '\\mathbf{v}_3', labelSize: 30, visible: false });
        const zero = p.point([0, 0], { color: C.yellow, r: 10, visible: false });
        const nul = s.tex('\\lambda_3 = 0:\\ A\\mathbf{v}_3 = \\mathbf{0}', { x: 735, y: 118, size: 30, color: C.yellow, visible: false });
        return { aT, eT, sp, sphere, p, flyers, arrow, aLab, sig, shapeT, v3, zero, nul, fill, thm };
      },
      steps: [
        {
          say: 'A $2 \\times 3${two by three} matrix sends the unit sphere in $\\mathbb{R}^3${R three} to a filled ellipse in the plane. $A^TA${A transpose A} is $3 \\times 3${three by three}, with eigenvalues $3${three}, $1${one} and $0${zero}.',
          do: async (s, o) => {
            await s.all(o.aT.write(), o.sp.draw());
            await s.all(o.sphere.map((c) => c.draw({ duration: 1000 })), o.eT.write());
            await s.all(o.p.draw({ duration: 700 }), o.arrow.draw(), o.aLab.fadeIn());
            o.flyers.forEach((f) => f.mob.show());
            await s.all(o.flyers.map((f) => f.mob.morph(f.to, { duration: 1800 })));
            await s.all(o.fill.draw({ duration: 900 }), o.flyers.map((f) => f.mob.animate({ opacity: 0.45 }, { duration: 600 })));
          },
        },
        {
          say: 'For an $m \\times n${m by n} matrix, $\\Sigma${sigma} is $m \\times n${m by n} too, with the singular values $\\sqrt{3}${root three} and $1${one} down its diagonal. $U${U} is $2 \\times 2${two by two} and $V${V} is $3 \\times 3${three by three}.',
          do: async (s, o) => {
            await o.sig.write();
            await o.shapeT.fadeIn();
          },
        },
        {
          say: 'The zero eigenvalue of $A^TA${A transpose A} is a direction that $A${A} crushes to zero: $\\mathbf{v}_3${v three} lies in the null space of $A${A}.',
          do: async (s, o) => {
            await o.v3.grow();
            await s.all(o.zero.draw(), o.nul.write(), o.sig.color('z1', C.yellow), o.sig.color('z2', C.yellow));
            await o.zero.flash({ color: C.yellow });
          },
        },
        {
          say: 'Theorem 10 says this always works: every $m \\times n${m by n} matrix factors as $U\\Sigma V^T${U sigma V transpose}, with $U${U} and $V${V} orthogonal and the singular values on the diagonal of $\\Sigma${sigma}.',
          do: async (s, o) => {
            await s.all([o.sp, ...o.sphere, o.p, ...o.flyers.map((f) => f.mob), o.arrow, o.aLab].map((m) => m.fadeOut()));
            await o.thm.reveal();
          },
        },
      ],
    },

    // 9
    {
      id: 'rank-bases',
      title: 'What the SVD tells you (Theorem 9)',
      scene(s) {
        const sig = s.tex(`\\part{s1}{\\sigma_1 = ${R1.sigmaTex}},\\quad \\part{s2}{\\sigma_2 = ${R2.sigmaTex}},\\quad \\part{s3}{\\sigma_3 = 0}`, { x: 480, y: 65, size: 38, visible: false });
        const L = 215, Rx = 670;
        const rows = [
          ['\\begin{gathered} r = \\operatorname{rank} A \\\\ = \\#\\{\\sigma_i > 0\\} \\end{gathered}', '\\operatorname{rank} A = 2'],
          ['\\begin{gathered} \\text{basis of } \\operatorname{Col} A: \\\\ \\mathbf{u}_1, \\dots, \\mathbf{u}_r \\end{gathered}', `\\begin{gathered} \\mathbf{u}_1 = ${unitTex(R1.u.w, R1.u.N)},\\ \\mathbf{u}_2 = ${unitTex(R2.u.w, R2.u.N)} \\\\ \\operatorname{Col} A = \\mathbb{R}^2 \\end{gathered}`],
          ['\\begin{gathered} \\text{basis of } \\operatorname{Nul} A: \\\\ \\mathbf{v}_{r+1}, \\dots, \\mathbf{v}_n \\end{gathered}', `\\mathbf{v}_3 = ${unitTex(nums(R3.v), R3.n2)}`],
        ].map(([a, b], i) => [
          s.tex(a, { x: L, y: [165, 290, 425][i], size: 30, visible: false }),
          s.tex(b, { x: Rx, y: [165, 290, 425][i], size: i === 1 ? 30 : 32, color: [C.green, C.teal, C.yellow][i], visible: false }),
        ]);
        const divider = s.line(430, 120, 430, 470, { color: C.line, width: 2, visible: false });
        const chk = s.tex(`A\\begin{bmatrix} ${R3.v.map(t).join(' & ')} \\end{bmatrix}^T = \\begin{bmatrix} ${RV3_CHECK.map(t).join(' & ')} \\end{bmatrix}^T`, { x: 480, y: 530, size: 30, color: C.green, visible: false });
        return { sig, rows, divider, chk };
      },
      steps: [
        {
          say: 'Count the nonzero singular values: that\'s the rank. Here two of them are nonzero, so the rank is $2${two}.',
          do: async (s, o) => {
            await o.sig.write();
            await s.all(s.ring([o.sig, 's1'], { color: 'green' }), s.ring([o.sig, 's2'], { color: 'green' }), o.sig.color('s3', C.muted));
            await s.all(o.divider.draw(), o.rows[0][0].write(), o.rows[0][1].write({ delay: 500 }));
          },
        },
        {
          say: 'The left singular vectors that go with nonzero $\\sigma${sigma}\'s are an orthonormal basis for the column space.',
          do: (s, o) => s.all(o.rows[1][0].write(), o.rows[1][1].write({ delay: 600 })),
        },
        {
          say: 'And the right singular vectors that go with zero $\\sigma${sigma}\'s are an orthonormal basis for the null space. Check: $A${A} sends $\\mathbf{v}_3${v three} to zero.',
          do: async (s, o) => {
            await s.all(o.rows[2][0].write(), o.rows[2][1].write({ delay: 600 }));
            await o.chk.write();
          },
        },
      ],
    },

    // 10
    {
      id: 'wo-svd',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Find the singular values of a three by two matrix, starting from A transpose A.',
      prompt: `Find the singular values of $A = ${texMat(WOD.A)}$. Enter the largest, $\\sigma_1$, to three decimals.`,
      answer: { type: 'number', value: Number(W1.sigma.toFixed(7)), tol: 0.001 },
      hints: [`$A^TA = ${texMat(WOD.AtA)}$.`, `Its eigenvalues are $${WOD.pairs.map((q) => t(q.lambda)).join('$ and $')}$.`],
      solution: [
        `$A^TA = ${texMat(WOD.AtA)}$ has eigenvalues $${t(W1.lambda)}$ and $${t(W2.lambda)}$, so $\\sigma_1 = ${W1.sigmaTex} \\approx ${W1.sigma.toFixed(3)}$ and $\\sigma_2 = ${W2.sigmaTex}$.`,
        `Unit eigenvectors: $\\mathbf{v}_1 = ${unitTex(nums(W1.v), W1.n2)}$, $\\mathbf{v}_2 = ${unitTex(nums(W2.v), W2.n2)}$.`,
        `Left singular vectors: $\\mathbf{u}_1 = \\frac{1}{\\sigma_1}A\\mathbf{v}_1 = ${unitTex(W1.u.w, W1.u.N)}$, $\\mathbf{u}_2 = \\frac{1}{\\sigma_2}A\\mathbf{v}_2 = ${unitTex(W2.u.w, W2.u.N)}$.`,
        `$A$ is $3 \\times 2$, so $\\Sigma = \\begin{bmatrix} ${W1.sigmaTex} & 0 \\\\ 0 & ${W2.sigmaTex} \\\\ 0 & 0 \\end{bmatrix}$ is $3 \\times 2$ too. To fill out the $3 \\times 3$ orthogonal $U$, add a unit vector orthogonal to $\\mathbf{u}_1, \\mathbf{u}_2$: $\\mathbf{u}_3 = ${unitTex(nums(WU3), Number(dot(WU3, WU3)))}$ (it spans $\\operatorname{Nul} A^T$).`,
        'Both singular values are nonzero, so $\\operatorname{rank} A = 2$.',
      ],
    },

    // 11
    {
      id: 'try-rank-svd',
      kind: 'try',
      title: 'Your turn',
      say: 'Read everything you can off three singular values.',
      prompt: 'A $4 \\times 3$ matrix $A$ has singular values $5, 2, 0$. Which statements are true? Select all that apply.',
      answer: { type: 'multi', value: ['a', 'c'] },
      choices: [
        { id: 'a', label: '$\\operatorname{rank} A = 2$', why: 'Right: two nonzero singular values.' },
        { id: 'b', label: '$A$ is one-to-one', why: '$\\mathbf{v}_3$ is sent to $\\mathbf{0}$, so $A\\mathbf{x} = \\mathbf{0}$ has a nonzero solution.' },
        { id: 'c', label: '$\\dim \\operatorname{Nul} A = 1$', why: 'Right: $3 - 2 = 1$, spanned by $\\mathbf{v}_3$.' },
        { id: 'd', label: '$\\operatorname{Col} A = \\mathbb{R}^4$', why: 'The rank is $2 < 4$: the columns span only a plane in $\\mathbb{R}^4$.' },
      ],
      hint: 'Rank = number of nonzero singular values; then use the Rank Theorem.',
      solution: [
        'Two singular values are nonzero, so $\\operatorname{rank} A = 2$.',
        'By the Rank Theorem, $\\dim \\operatorname{Nul} A = 3 - 2 = 1$: the right singular vector $\\mathbf{v}_3$ (for $\\sigma_3 = 0$) spans it. So $A$ is not one-to-one.',
        '$\\operatorname{Col} A$ is spanned by $\\mathbf{u}_1, \\mathbf{u}_2$: a 2-dimensional subspace of $\\mathbb{R}^4$, not all of it.',
      ],
    },

    // 12
    {
      id: 'cp-svd',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Last check before the summary: tell the whole geometric story in your own words.',
      prompt: 'Explain geometrically what $A = U\\Sigma V^T$ says about how $A$ acts on the unit circle (or sphere).',
      points: [
        '$V^T$ is a rotation or reflection that takes the right singular vectors $\\mathbf{v}_i$ to the coordinate axes',
        '$\\Sigma$ stretches each axis by $\\sigma_i$ (crushing those with $\\sigma_i = 0$)',
        '$U$ rotates the result so the axes land on the left singular vectors $\\mathbf{u}_i$',
        'So the circle becomes an ellipse with semi-axes $\\sigma_i\\mathbf{u}_i$, and the largest $\\sigma_1$ is the maximum of $\\|A\\mathbf{x}\\|$ over unit $\\mathbf{x}$',
      ],
    },

    // 13
    {
      id: 'summary-svd',
      title: 'Summary, and the whole course',
      scene(s) {
        const p = s.plane({ x: 480, y: 195, width: 300, range: [-3.5, 3.5, -2.5, 2.5], labels: false, visible: true });
        const circle = p.polygon(circlePts(), { color: C.blue });
        const vs = [V1u, V2u].map((v) => p.vector(v, { color: C.purple, width: 4 }));
        const left = s.tex('A = U\\Sigma V^T', { x: 175, y: 195, size: 42, visible: false });
        const right = s.tex('\\sigma_1 \\ge \\sigma_2 \\ge \\cdots \\ge 0', { x: 772, y: 195, size: 30, color: C.green, visible: false });
        const xs = [130, 315, 490, 660, 830];
        const W = 140;
        const thumbs = [];
        const m = s.matrix([[1, 0, 2], [0, 1, -1]], { x: xs[0], y: 425, size: 30, visible: false });
        thumbs.push([m]);
        const mk = (x) => s.plane({ x, y: 425, width: W, range: [-2, 2, -2, 2], labels: false, visible: false });
        const p2 = mk(xs[1]);
        p2.applyMatrix([[1, 1], [0, 1]], { duration: 0, ghost: true });
        thumbs.push([p2]);
        const p3 = mk(xs[2]);
        thumbs.push([p3, p3.span([1, 1], { color: C.purple, visible: false }), p3.span([1, -1], { color: C.purple, visible: false })]);
        const p4 = mk(xs[3]);
        const py = p4.toStage([0.5, 1.6]), pq = p4.toStage([1.05, 1.05]);
        thumbs.push([p4, p4.span([1, 1], { color: C.muted, width: 2, visible: false }), p4.vector([0.5, 1.6], { color: C.blue, width: 3, visible: false }), p4.vector([1.05, 1.05], { color: C.green, width: 3, visible: false }), s.line(py[0], py[1], pq[0], pq[1], { color: C.muted, dash: '4 4', width: 2, visible: false })]);
        const p5 = mk(xs[4]);
        thumbs.push([p5, p5.polygon(circlePts().map((q) => [1.6 * q[0] * 0.8 - 0.6 * q[1] * 0.6, 1.6 * q[0] * 0.6 + 0.6 * q[1] * 0.8]), { color: C.green, visible: false })]);
        const labs = ['rref', 'maps', 'eigen', 'projection', 'SVD'].map((tx, i) => s.text(tx, { x: xs[i], y: 535, size: 30, color: C.muted, visible: false }));
        return { p, circle, vs, left, right, thumbs, labs };
      },
      steps: [
        {
          say: 'Every matrix, square or not: rotate or reflect, stretch, rotate or reflect.',
          do: async (s, o) => {
            await o.left.write();
            await o.p.applyMatrix(VT_NUM, { duration: 1100 });
            await o.p.applyMatrix(SIG_NUM, { duration: 1100 });
            await o.p.applyMatrix(U_MAP, { duration: 800 });
          },
        },
        {
          say: 'The singular values are the stretches. They give the rank, and the singular vectors give orthonormal bases for the fundamental subspaces.',
          do: (s, o) => o.right.write(),
        },
        {
          say: 'And that\'s the course: row reduction, linear maps, eigenvectors, projections, and now the SVD. The same few pictures, seen more and more clearly.',
          do: (s, o) =>
            s.stagger(
              o.thumbs.map((g, i) => () => s.all(g.map((mob) => (mob.draw && mob !== g[0] ? mob.draw() : mob.fadeIn({ shift: [0, 10] }))), o.labs[i].fadeIn())),
              700,
            ),
        },
      ],
    },
  ],
};
