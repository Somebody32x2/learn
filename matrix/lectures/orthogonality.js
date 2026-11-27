/**
 * Lecture 23 · Inner products and orthogonal sets (Lay 6.1–6.2). Design: matrix/PLAN.md § 23.
 * Every vector, dot product, weight and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { vec, dot, norm2, proj, subVec, addVec, scaleVec, nullspace, texVec } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- helpers (pure)

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;
/** `\left(\frac{9}{2}, \frac{3}{2}\right)`: a tuple with full-size fractions (for stage text). */
const tupD = (v) => `\\left(${v.map((x) => F(x).tex()).join(', ')}\\right)`;
/** `(3)(1) + (1)(3)`: the products of a dot product. */
const dotTerms = (u, v) => u.map((x, i) => `(${t(x)})(${t(v[i])})`).join(' + ');

/** Exact square root of a perfect-square fraction, or null. */
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
/** `5`, `\sqrt{17}`, `\frac{\sqrt{10}}{2}`: the exact length whose square is n2. */
const lenTex = (n2) => {
  const s = sqrtFrac(n2);
  if (s) return t(s);
  const f = F(n2);
  let m = f.n * f.d, k = 1n;
  for (let q = 2n; q * q <= m; q++) while (m % (q * q) === 0n) { m /= q * q; k *= q; }
  const g = (a, b) => (b ? g(b, a % b) : a);
  const h = g(k, f.d), num = k / h, den = f.d / h;
  const root = `${num === 1n ? '' : num}\\sqrt{${m}}`;
  return den === 1n ? root : `\\frac{${root}}{${den}}`;
};

/** Smallest integer multiple of a rational vector, first nonzero entry made negative-or-positive as `sign` asks. */
function intVec(v) {
  const g = (a, b) => (b ? g(b, a % b) : a < 0n ? -a : a);
  const l = v.reduce((acc, x) => (acc * x.d) / g(acc, x.d), 1n);
  let w = v.map((x) => x.mul(F(l)));
  const h = w.reduce((acc, x) => g(acc, x.n), 0n) || 1n;
  w = w.map((x) => x.div(F(h)));
  return w;
}

// ---------------------------------------------------------------- data

/** Beat 1: u fixed, v turning on a circle of radius |(1, 3)| from (1, 3) through (−1, 3) to (−3, 1). */
const DU = [3, 1];
const DV = [[1, 3], [-1, 3], [-3, 1]];
const DV_DOTS = DV.map((v) => dot(vec(DU), vec(v)));
/** The final angle: cos θ = u·v / (‖u‖‖v‖) (both lengths √10, so the product is rational). */
const DCOS = DV_DOTS[2].div(sqrtFrac(norm2(vec(DU)).mul(norm2(vec(DV[2])))));
const DDEG = Math.round((Math.acos(Number(DCOS)) * 180) / Math.PI);

/** Beat 2: length, unit vector, distance (Lay 6.1 Examples 2 and 4). */
const LV = vec([1, 2, 2]);
const LV_LEN = sqrtFrac(norm2(LV));
const LV_UNIT = scaleVec(LV_LEN.inv(), LV);
const DP = vec([7, 1]);
const DQ = vec([3, 2]);
const DDIFF = subVec(DP, DQ);
const DDIST2 = norm2(DDIFF);

/** Beat 3: blanks. */
const FA = vec([1, 2, -1]);
const FB = vec([3, -1, 2]);
const FDOT = dot(FA, FB);
const F34 = vec([3, 4]);
const F34_LEN = sqrtFrac(norm2(F34));
const F034 = vec([0, 3, 4]);
const F034_UNIT = scaleVec(sqrtFrac(norm2(F034)).inv(), F034);

/** Beat 4: Pythagoras. */
const PU = vec([2, 1]);
const PV = vec([-1, 2]);
const PSUM = addVec(PU, PV);

/** Beat 5: W = Span{w1, w2} in R³ and its complement. */
const W1 = vec([1, 1, 0]);
const W2 = vec([1, -1, 1]);
const WN = (() => {
  const v = intVec(nullspace([W1, W2])[0]);
  return v[0].sign() > 0 ? v.map((x) => x.neg()) : v; // Lay's (−1, 1, 2)
})();

/** Beat 6: W⊥ = Span{n}; which vector lies in W? */
const TN = vec([1, 2, -1]);
const TC = { a: [1, 2, -1], b: [1, 1, 1], c: [1, 0, 1], d: [2, -1, 1] };
const TC_DOT = Object.fromEntries(Object.entries(TC).map(([k, v]) => [k, dot(vec(v), TN)]));
const TC_IN = Object.keys(TC).filter((k) => TC_DOT[k].zero && k !== 'a');

/** Beat 7: an orthogonal basis of R³ and weights by dot products. */
const OB = [vec([1, 1, 0]), vec([1, -1, 1]), vec([-1, 1, 2])];
const OY = vec([3, 1, 4]);
const OYU = OB.map((u) => dot(OY, u));
const OUU = OB.map((u) => norm2(u));
const OC = OB.map((_, j) => OYU[j].div(OUU[j]));
const OPART = [scaleVec(OC[0], OB[0]), scaleVec(OC[1], OB[1]), scaleVec(OC[2], OB[2])];

/** Beats 8–9: projection onto a line. */
const JU = vec([3, 1]);
const JY = vec([4, 3]);
const JYU = dot(JY, JU);
const JUU = norm2(JU);
const JHAT = proj(JY, JU);
const JZ = subVec(JY, JHAT);
const JZ2 = norm2(JZ);
const JWRONG = scaleVec(JYU, JU);
const J2U = scaleVec(F(2), JU);
const J2WRONG = scaleVec(dot(JY, J2U), J2U);
const J2HAT = proj(JY, J2U);

/** Beat 10: which set is orthogonal? */
const OS = {
  a: [[1, 2], [2, -1]],
  b: [[1, 1, 1], [1, -1, 0], [1, 1, -1]],
  c: [[1, 0], [1, 1]],
};
const pairs = (vs) => vs.flatMap((u, i) => vs.slice(i + 1).map((v) => [u, v]));
const OS_ORTH = Object.keys(OS).filter((k) => pairs(OS[k].map(vec)).every(([u, v]) => dot(u, v).zero));
const OS_BAD = Object.fromEntries(
  Object.entries(OS).map(([k, vs]) => [k, pairs(vs.map(vec)).find(([u, v]) => !dot(u, v).zero)]),
);

/** Beat 11: orthonormal columns (1,1,0)/√2 and (1,−1,1)/√3; UᵀU from the integer directions. */
const UW = [vec([1, 1, 0]), vec([1, -1, 1])];
const UTU = UW.map((a) => UW.map((b) => dot(a, b).div(sqrtFrac(norm2(a).mul(norm2(b))) ?? F(1))));
// Off-diagonal entries are 0 (orthogonal); the diagonal is a·a / (a·a) = 1.
const U_TEX = [
  ['1/\\sqrt{2}', '1/\\sqrt{3}'],
  ['1/\\sqrt{2}', '-1/\\sqrt{3}'],
  ['0', '1/\\sqrt{3}'],
];

// ---------------------------------------------------------------- workout: weights in an orthogonal basis

const TRIPLES = [
  [[3, 1, 1], [-1, 2, 1], [-1, -4, 7]],
  [[1, 1, 0], [1, -1, 1], [-1, 1, 2]],
  [[1, 2, 2], [2, 1, -2], [2, -2, 1]],
  [[1, 2, 1], [1, -1, 1], [1, 0, -1]],
  [[2, 1, 1], [0, 1, -1], [1, -1, -1]],
];
for (const tr of TRIPLES) for (const [u, v] of pairs(tr.map(vec))) if (!dot(u, v).zero) throw new Error('orthogonality: TRIPLES not orthogonal');

function weightsItem(basis0, c0) {
  const U = basis0.map(vec);
  const c = vec(c0);
  const y = U.reduce((acc, u, j) => addVec(acc, scaleVec(c[j], u)), vec([0, 0, 0]));
  const yu = U.map((u) => dot(y, u));
  const uu = U.map((u) => norm2(u));
  const w = U.map((_, j) => yu[j].div(uu[j]));
  const names = ['\\mathbf{u}_1', '\\mathbf{u}_2', '\\mathbf{u}_3'];
  const combo = w.map((k, j) => `${j && k.sign() >= 0 ? '+ ' : ''}${k.eq(1) ? '' : k.eq(-1) ? '-' : t(k)}${names[j]}`).join(' ');
  return {
    prompt: `$\\{\\mathbf{u}_1, \\mathbf{u}_2, \\mathbf{u}_3\\} = \\{${U.map(tup).join(', ')}\\}$ is an orthogonal basis of $\\mathbb{R}^3$. Write $\\mathbf{y} = ${tup(y)}$ as $c_1\\mathbf{u}_1 + c_2\\mathbf{u}_2 + c_3\\mathbf{u}_3$ and enter the weights $(c_1, c_2, c_3)$.`,
    answer: { type: 'vector', value: w.map(String) },
    hints: [
      'Check that the three pairwise dot products are $0$, then use $c_j = \\dfrac{\\mathbf{y}\\cdot\\mathbf{u}_j}{\\mathbf{u}_j\\cdot\\mathbf{u}_j}$. No row reduction needed.',
      `The denominators are $\\mathbf{u}_j\\cdot\\mathbf{u}_j = ${uu.map(t).join(',\\ ')}$.`,
    ],
    solution: [
      `The basis is orthogonal: ${pairs(U).map(([a, b]) => `$${tup(a)}\\cdot${tup(b)} = ${t(dot(a, b))}$`).join(', ')}.`,
      `So each weight is one quotient: ${w.map((k, j) => `$c_${j + 1} = \\dfrac{${t(yu[j])}}{${t(uu[j])}} = ${t(k)}$`).join(', ')}.`,
      `Check: $${combo} = ${tup(y)} = \\mathbf{y}$.`,
    ],
  };
}
const WO = weightsItem(TRIPLES[0], [1, -2, -1]);

/** Fresh orthogonal bases: a known triple, coordinates permuted and sign-flipped, vectors shuffled and flipped. */
function generateWeights(rand) {
  for (;;) {
    const base = rand.pick(TRIPLES);
    const perm = rand.shuffle([0, 1, 2]);
    const flip = [0, 1, 2].map(() => rand.pick([1, -1]));
    const basis = rand.shuffle(base).map((u) => {
      const s = rand.pick([1, -1]);
      return perm.map((k, i) => s * flip[i] * u[k]);
    });
    const c = [0, 1, 2].map(() => rand.nonzero(-3, 3));
    const item = weightsItem(basis, c);
    const y = basis.reduce((acc, u, j) => acc.map((v, i) => v + c[j] * u[i]), [0, 0, 0]);
    if (y.some((v) => Math.abs(v) > 20)) continue;
    return item;
  }
}

// ---------------------------------------------------------------- scene helpers (DOM only when called)

const f2 = (x) => Math.round(x * 100) / 100;
/** An SVG path through plane points, living inside the plane (moves and fades with it). */
function planePath(s, p, pts, opts = {}) {
  return s.path(pathD(p, pts), { parent: p, width: 3, ...opts });
}
const pathD = (p, pts) => pts.map((q, i) => `${i ? 'L' : 'M'}${f2(p.px(q)[0])} ${f2(p.px(q)[1])}`).join(' ');
const unit2 = (v) => {
  const L = Math.hypot(v[0], v[1]);
  return [v[0] / L, v[1] / L];
};
/** Right-angle mark at `at` between directions d1 and d2 (plane units). */
function rightMark(s, p, at, d1, d2, { size = 0.32, color = C.ink, visible = false } = {}) {
  const [a, b] = [unit2(d1.map(Number)), unit2(d2.map(Number))];
  const A = at.map(Number);
  const pts = [[A[0] + a[0] * size, A[1] + a[1] * size], [A[0] + (a[0] + b[0]) * size, A[1] + (a[1] + b[1]) * size], [A[0] + b[0] * size, A[1] + b[1] * size]];
  return planePath(s, p, pts, { color, width: 2.5, visible });
}
/** Points of an arc of radius r about the origin from angle a0 to a1 (radians). */
const arcPts = (r, a0, a1, n = 32) => Array.from({ length: n + 1 }, (_, k) => {
  const a = a0 + ((a1 - a0) * k) / n;
  return [r * Math.cos(a), r * Math.sin(a)];
});

/** A right-angle mark in a Space (stage path, refreshed when the camera turns). */
function spaceMark(s, sp, d1, d2, { size = 0.35, color = C.ink, visible = false } = {}) {
  const u = (v) => {
    const L = Math.hypot(...v);
    return v.map((x) => (x * size) / L);
  };
  const [a, b] = [u(d1.map(Number)), u(d2.map(Number))];
  const d = () => {
    const pts = [a, [a[0] + b[0], a[1] + b[1], a[2] + b[2]], b].map((q) => sp.toStage(q));
    return pts.map((q, i) => `${i ? 'L' : 'M'}${f2(q[0])} ${f2(q[1])}`).join(' ');
  };
  const mob = s.path(d(), { color, width: 2.5, visible });
  mob.refresh = () => mob.setPath(d());
  return mob;
}
/** Orbit the camera and keep the stage-drawn right-angle marks attached. */
const orbitWith = (s, sp, deg, duration, marks) =>
  s.all(sp.orbit(deg, duration), s.clock.tween({ duration, update: () => marks.forEach((m) => m.refresh()) }));

const fmt1 = (x) => {
  const r = Math.round(x * 10) / 10;
  return Object.is(r, -0) || r === 0 ? '0' : Number.isInteger(r) ? String(r) : r.toFixed(1);
};

/** Beats 8–9: the projection plane. */
const projPlane = (s, visible) => s.plane({ x: 680, y: 300, width: 400, range: [-2, 7, -1, 5], names: ['x_1', 'x_2'], visible });

/** Beat 1 state for angle a (radians), radius √10. */
const R10 = Math.sqrt(10);
const vAt = (a) => [R10 * Math.cos(a), R10 * Math.sin(a)];
const ANG = DV.map(([x, y]) => Math.atan2(y, x));
const ANG_U = Math.atan2(DU[1], DU[0]);

function setDot(o, a) {
  const v = vAt(a);
  o.v.setCoords(v);
  const d = DU[0] * v[0] + DU[1] * v[1];
  const shown = fmt1(d);
  o.vTex.setTex(`\\mathbf{v} = (${fmt1(v[0])}, ${fmt1(v[1])})`);
  o.read.setTex(`\\mathbf{u}\\cdot\\mathbf{v} = ${shown}`);
  const sign = shown === '0' ? 0 : Math.sign(d);
  o.read.node.style.color = sign > 0 ? C.green : sign < 0 ? C.red : C.yellow;
  o.word.setText(sign > 0 ? 'positive: same way' : sign < 0 ? 'negative: opposed' : 'zero: perpendicular');
  o.word.node.style.color = o.read.node.style.color;
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'orthogonality',
  title: 'Inner products and orthogonal sets',
  goals: [
    'Compute dot products, lengths, unit vectors, distances and angles',
    'Test orthogonality and use the Pythagorean Theorem',
    'Find orthogonal complements: (Row A)⊥ = Nul A',
    'Get weights in an orthogonal basis with one dot product each',
    'Project onto a line and recognize orthonormal columns',
  ],
  beats: [
    // 1
    {
      id: 'dot-product',
      title: 'The dot product measures alignment',
      scene(s) {
        const def = s.tex('\\mathbf{u}\\cdot\\mathbf{v} = u_1v_1 + u_2v_2 + \\cdots + u_nv_n = \\mathbf{u}^T\\mathbf{v}', { x: 480, y: 62, size: 38, visible: false });
        const p = s.plane({ x: 640, y: 330, width: 440, range: [-4, 4, -1, 4], visible: false });
        const u = p.vector(DU, { color: C.blue, label: '\\mathbf{u}', visible: false });
        const v = p.vector(DV[0], { color: C.red, label: '\\mathbf{v}', visible: false });
        const uTex = s.tex(`\\mathbf{u} = ${tup(DU)}`, { x: 210, y: 200, size: 36, color: C.blue, visible: false });
        const vTex = s.tex(`\\mathbf{v} = ${tup(DV[0])}`, { x: 210, y: 255, size: 36, color: C.red, visible: false });
        const sub = s.tex(`${dotTerms(DU, DV[0])} = ${t(DV_DOTS[0])}`, { x: 210, y: 320, size: 34, visible: false });
        const read = s.tex(`\\mathbf{u}\\cdot\\mathbf{v} = ${t(DV_DOTS[0])}`, { x: 210, y: 395, size: 44, color: C.green, visible: false });
        const word = s.text('positive: same way', { x: 210, y: 455, size: 30, color: C.green, visible: false });
        const mark = rightMark(s, p, [0, 0], DU, DV[1]);
        const arc = planePath(s, p, arcPts(0.9, ANG_U, ANG[2]), { color: C.purple, visible: false });
        const thMid = (ANG_U + ANG[2]) / 2;
        const th = p.label([1.35 * Math.cos(thMid), 1.35 * Math.sin(thMid)], '\\theta', { color: C.purple, size: 34, visible: false });
        const cos = s.tex('\\mathbf{u}\\cdot\\mathbf{v} = \\|\\mathbf{u}\\|\\,\\|\\mathbf{v}\\|\\cos\\theta', { x: 480, y: 545, size: 40, color: C.purple, visible: false });
        const cosv = s.tex(`\\cos\\theta = \\frac{${t(DV_DOTS[2])}}{${lenTex(norm2(vec(DU)))}\\cdot${lenTex(norm2(vec(DV[2])))}} = ${DCOS.tex()}`, { x: 480, y: 132, size: 32, color: C.purple, visible: false });
        const deg = s.tex(`\\theta \\approx ${DDEG}^\\circ`, { x: 210, y: 462, size: 34, color: C.purple, visible: false });
        return { def, p, u, v, uTex, vTex, sub, read, word, mark, arc, th, cos, cosv, deg };
      },
      steps: [
        {
          say: 'Multiply matching entries and add: that\'s the dot product, $\\mathbf{u}\\cdot\\mathbf{v} = u_1v_1 + \\cdots + u_nv_n${u dot v equals u one v one plus, and so on, plus u n v n}. It\'s the same number as $\\mathbf{u}^T\\mathbf{v}${u transpose v}.',
          do: async (s, o) => {
            await s.all(o.def.write({ duration: 1200 }), o.p.draw({ duration: 900 }));
            await s.all(o.u.grow(), o.uTex.fadeIn(), o.v.grow({ delay: 300 }), o.vTex.fadeIn({ delay: 300 }));
            await o.sub.write();
            await s.all(o.read.fadeIn(), o.word.fadeIn({ delay: 200 }));
          },
        },
        {
          say: 'Now turn $\\mathbf{v}${v}. While it points roughly the same way as $\\mathbf{u}${u}, the dot product is positive. At a right angle it\'s exactly zero, and past that it turns negative.',
          do: async (s, o) => {
            await o.sub.fadeOut();
            await s.clock.tween({ duration: 2200, update: (k) => setDot(o, ANG[0] + (ANG[1] - ANG[0]) * k) });
            await s.all(o.mark.draw({ duration: 400 }), o.read.indicate({ color: C.yellow }));
            await s.wait(500);
            await s.all(o.mark.fadeOut(), s.clock.tween({ duration: 1800, update: (k) => setDot(o, ANG[1] + (ANG[2] - ANG[1]) * k) }));
          },
        },
        {
          say: 'Here\'s why. Geometrically, $\\mathbf{u}\\cdot\\mathbf{v} = \\|\\mathbf{u}\\|\\|\\mathbf{v}\\|\\cos\\theta${u dot v equals the length of u times the length of v times cosine theta}, and the cosine is positive for small angles, zero at ninety degrees, and negative past it.',
          do: async (s, o) => {
            await s.all(o.arc.draw({ duration: 700 }), o.th.draw({ delay: 400 }));
            await o.cos.write();
          },
        },
        {
          say: 'Run it backwards to get the angle. Here $\\cos\\theta = -8/10${cosine theta equals minus eight over ten}, so $\\theta${theta} is about a hundred and forty-three degrees.',
          do: async (s, o) => {
            await o.cosv.write();
            await s.all(o.word.fadeOut(), o.deg.fadeIn({ delay: 200 }), o.th.indicate({ color: C.purple }));
          },
        },
      ],
    },

    // 2
    {
      id: 'length-distance',
      title: 'Length, unit vectors, distance',
      scene(s) {
        const def = s.tex('\\|\\mathbf{v}\\| = \\sqrt{\\mathbf{v}\\cdot\\mathbf{v}} = \\sqrt{v_1^2 + v_2^2 + \\cdots + v_n^2}', { x: 480, y: 72, size: 36, visible: false });
        const L = (tex, y, color) => s.tex(tex, { x: 50, y, size: 36, color, anchor: [0, 0.5], visible: false });
        const v1 = L(`\\mathbf{v} = ${tup(LV)}`, 180, C.blue);
        const v2 = L(`\\|\\mathbf{v}\\| = \\sqrt{${LV.map((x) => `${t(x.mul(x))}`).join(' + ')}} = ${t(LV_LEN)}`, 250);
        const v3 = L(`\\mathbf{u} = \\frac{1}{${t(LV_LEN)}}\\,\\mathbf{v} = \\left(${LV_UNIT.map((x) => x.tex()).join(', ')}\\right)`, 340, C.green);
        const v4 = L('\\|\\mathbf{u}\\| = 1', 420, C.green);
        const sp = s.space({ x: 690, y: 350, size: 340, range: 2.4, yaw: -35, pitch: 18, visible: false });
        const vv = sp.vector(LV.map(Number), { color: C.blue, label: '\\mathbf{v}', visible: false });
        const uu = sp.vector(LV.map(Number), { color: C.green, width: 7, label: '\\mathbf{u}', visible: false });
        const d0 = s.tex(`\\col{blue}{\\mathbf{u} = ${tup(DP)}},\\quad \\col{red}{\\mathbf{v} = ${tup(DQ)}}`, { x: 50, y: 170, size: 32, anchor: [0, 0.5], visible: false });
        const d1 = s.tex('\\operatorname{dist}(\\mathbf{u}, \\mathbf{v}) = \\|\\mathbf{u} - \\mathbf{v}\\|', { x: 50, y: 245, size: 32, anchor: [0, 0.5], visible: false });
        const d2 = s.tex(`\\mathbf{u} - \\mathbf{v} = ${tup(DDIFF)}`, { x: 50, y: 320, size: 32, anchor: [0, 0.5], visible: false });
        const d3 = s.tex(`\\|\\mathbf{u} - \\mathbf{v}\\| = \\sqrt{${DDIFF.map((x) => t(x.mul(x))).join(' + ')}} = ${lenTex(DDIST2)}`, { x: 50, y: 400, size: 32, color: C.green, anchor: [0, 0.5], visible: false });
        const p = s.plane({ x: 715, y: 330, width: 390, range: [-1, 9, -2, 4], visible: false });
        const pu = p.point(DP.map(Number), { color: C.blue, label: '\\mathbf{u}', visible: false });
        const pv = p.point(DQ.map(Number), { color: C.red, label: '\\mathbf{v}', visible: false });
        const seg = p.vector(DDIFF.map(Number), { tail: DQ.map(Number), color: C.green, width: 4, visible: false });
        return { def, v1, v2, v3, v4, sp, vv, uu, d0, d1, d2, d3, p, pu, pv, seg };
      },
      steps: [
        {
          say: 'Length comes from the dot product too: $\\|\\mathbf{v}\\| = \\sqrt{\\mathbf{v}\\cdot\\mathbf{v}}${the length of v is the square root of v dot v}. For $\\mathbf{v} = (1, 2, 2)${v equals one, two, two}, that\'s the square root of nine, which is three.',
          do: async (s, o) => {
            await s.all(o.def.write({ duration: 1200 }), o.sp.draw());
            await s.all(o.vv.grow(), o.v1.fadeIn({ shift: [-14, 0] }));
            await o.v2.write();
          },
        },
        {
          say: 'Divide by the length and you get a unit vector pointing the same way. Lay calls this normalizing: $\\mathbf{u} = (\\tfrac13, \\tfrac23, \\tfrac23)${u equals one third, two thirds, two thirds}, with length one.',
          do: async (s, o) => {
            o.uu.show();
            await s.all(o.uu.moveTo(LV_UNIT.map(Number), { duration: 1300 }), o.vv.animate({ opacity: 0.35 }), o.v3.write({ delay: 300 }));
            await o.v4.fadeIn();
          },
        },
        {
          say: 'And the distance between two vectors is the length of their difference. For $(7, 1)${seven, one} and $(3, 2)${three, two}, the difference is $(4, -1)${four, minus one}, so the distance is $\\sqrt{17}${the square root of seventeen}.',
          do: async (s, o) => {
            await s.all(o.sp.fadeOut(), [o.v1, o.v2, o.v3, o.v4].map((m) => m.fadeOut()));
            await s.all(o.p.draw({ duration: 800 }), o.d0.fadeIn(), o.d1.write({ delay: 300 }));
            await s.all(o.pu.draw(), o.pv.draw({ delay: 200 }));
            await s.all(o.seg.grow(), o.d2.fadeIn({ shift: [-14, 0] }));
            await o.d3.write();
          },
        },
      ],
    },

    // 3
    {
      id: 'fill-dot',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Quick practice with the three formulas: a dot product, a length, and a unit vector.',
      lines: [
        [`${tup(FA)}\\cdot${tup(FB)} = `, { id: 'dot', answer: { type: 'number', value: String(FDOT) } }],
        [`\\|${tup(F34)}\\| = `, { id: 'len', answer: { type: 'number', value: String(F34_LEN) } }],
        [
          `\\text{unit vector in the direction of } ${texVec(F034)} = `,
          {
            matrix: [
              [t(F034_UNIT[0])],
              [{ id: 'u2', answer: { type: 'number', value: String(F034_UNIT[1]) } }],
              [{ id: 'u3', answer: { type: 'number', value: String(F034_UNIT[2]) } }],
            ],
          },
        ],
      ],
      solution: [
        `Multiply matching entries and add: $${dotTerms(FA, FB)} = ${t(FDOT)}$.`,
        `$\\|${tup(F34)}\\| = \\sqrt{${F34.map((x) => t(x.mul(x))).join(' + ')}} = \\sqrt{${t(norm2(F34))}} = ${t(F34_LEN)}$.`,
        `$\\|${tup(F034)}\\| = \\sqrt{${t(norm2(F034))}} = ${lenTex(norm2(F034))}$, so the unit vector is $\\tfrac{1}{${lenTex(norm2(F034))}}${tup(F034)} = ${tup(F034_UNIT)}$.`,
      ],
    },

    // 4
    {
      id: 'pythagoras',
      title: 'Orthogonal means Pythagoras works',
      scene(s) {
        const p = s.plane({ x: 700, y: 290, width: 360, range: [-2, 3, -1, 4], visible: false });
        const u = p.vector(PU.map(Number), { color: C.blue, label: '\\mathbf{u}', visible: false });
        const v = p.vector(PV.map(Number), { color: C.red, label: '\\mathbf{v}', visible: false });
        const mark = rightMark(s, p, [0, 0], PU, PV);
        const sum = p.vector(PSUM.map(Number), { color: C.green, visible: false });
        const sumLab = p.label([-1.1, 2.5], '\\mathbf{u} + \\mathbf{v}', { color: C.green, size: 34, visible: false });
        const mark2 = rightMark(s, p, PU.map(Number), [-2, -1], PV);
        const L = (tex, y, opts = {}) => s.tex(tex, { x: 260, y, size: 34, visible: false, ...opts });
        const d = L(`\\mathbf{u}\\cdot\\mathbf{v} = ${PU.map((x, i) => t(x.mul(PV[i]))).join(' + ').replace('+ -', '- ')} = ${t(dot(PU, PV))}`, 110);
        const def = s.text('**orthogonal**: $\\mathbf{u}\\cdot\\mathbf{v} = 0$', { x: 260, y: 175, size: 32, color: C.purple, visible: false });
        const thm = L('\\|\\mathbf{u} + \\mathbf{v}\\|^2 = \\|\\mathbf{u}\\|^2 + \\|\\mathbf{v}\\|^2', 285);
        const nums = L(`${t(norm2(PSUM))} = ${t(norm2(PU))} + ${t(norm2(PV))}`, 345, { color: C.green });
        const why = s.tex('\\|\\mathbf{u} + \\mathbf{v}\\|^2 = \\|\\mathbf{u}\\|^2 + \\|\\mathbf{v}\\|^2 + \\part{x}{2\\,\\mathbf{u}\\cdot\\mathbf{v}}', { x: 480, y: 548, size: 34, visible: false });
        const trap = L(`\\|\\mathbf{u} + \\mathbf{v}\\| = ${lenTex(norm2(PSUM))} \\neq ${lenTex(norm2(PU))} + ${lenTex(norm2(PV))}`, 425, { color: C.yellow, size: 30 });
        const trapLab = s.text('squares add; lengths don\'t', { x: 260, y: 478, size: 30, color: C.yellow, visible: false });
        return { p, u, v, mark, sum, sumLab, mark2, d, def, thm, nums, why, trap, trapLab };
      },
      steps: [
        {
          say: 'Two vectors are orthogonal when their dot product is zero. That\'s Lay\'s definition, and in the plane it means perpendicular: here $(2, 1)${two, one} and $(-1, 2)${minus one, two}.',
          do: async (s, o) => {
            await o.p.draw({ duration: 800 });
            await s.all(o.u.grow(), o.v.grow({ delay: 200 }));
            await o.d.write();
            await s.all(o.mark.draw({ duration: 400 }), o.def.fadeIn());
          },
        },
        {
          say: 'Slide $\\mathbf{v}${v} to the tip of $\\mathbf{u}${u}. Now you have a right triangle, and the Pythagorean Theorem holds: $10 = 5 + 5${ten equals five plus five}.',
          do: async (s, o) => {
            await s.all(o.p.addTip(o.u, o.v, { duration: 1000 }), o.mark.fadeOut());
            await s.all(o.sum.grow(), o.sumLab.draw({ delay: 600 }), o.mark2.draw({ delay: 600, duration: 400 }));
            await o.thm.write();
            await o.nums.fadeIn();
          },
        },
        {
          say: 'And it works both ways. Expand the left side: the only extra term is $2\\,\\mathbf{u}\\cdot\\mathbf{v}${two u dot v}, so the equation holds exactly when the vectors are orthogonal. That\'s Theorem 2.',
          do: async (s, o) => {
            await o.why.write({ duration: 1200 });
            await s.all(o.why.color('x', C.yellow), o.def.indicate({ color: C.purple }));
          },
        },
        {
          say: 'Careful: it\'s the squares that add, not the lengths. The hypotenuse is $\\sqrt{10}${the square root of ten}, about three point two, while $\\sqrt5 + \\sqrt5${root five plus root five} is about four point five. Going straight is shorter than the detour.',
          do: async (s, o) => {
            await o.trap.write();
            await s.all(o.trapLab.fadeIn(), o.sum.indicate({ color: C.yellow }));
          },
        },
      ],
    },

    // 5
    {
      id: 'complement',
      title: 'Orthogonal complements',
      scene(s) {
        const sp = s.space({ x: 680, y: 320, size: 380, range: 2.6, yaw: 25, pitch: 16, visible: false });
        const W = sp.plane(W1.map(Number), W2.map(Number), { color: C.blue, extent: 1.3, visible: false });
        const w1 = sp.vector(W1.map(Number), { color: C.blue, label: '\\mathbf{w}_1', visible: false });
        const w2 = sp.vector(W2.map(Number), { color: C.red, label: '\\mathbf{w}_2', visible: false });
        const line = sp.line([0, 0, 0], WN.map(Number), { color: C.green, width: 3, dash: '8 6', visible: false });
        const n = sp.vector(WN.map(Number), { color: C.green, label: '\\mathbf{z}', visible: false });
        const mk1 = spaceMark(s, sp, WN, W1, { size: 0.4 });
        const mk2 = spaceMark(s, sp, WN, W2, { size: 0.4 });
        const wl = sp.label([1.9, 0.3, 0.9], 'W', { color: C.blue, size: 40, visible: false });
        const def = s.text('$W^\\perp$: every vector orthogonal to **all** of $W$', { x: 250, y: 90, size: 30, width: 400, visible: false });
        const row = (v, name) => v.map((x) => `\\part{${name}}{${t(x)}}`).join(' & ');
        const nul = s.tex(`W^\\perp = \\operatorname{Nul}\\begin{bmatrix}${row(W1, 'r1')} \\\\ ${row(W2, 'r2')}\\end{bmatrix}`, { x: 250, y: 220, size: 32, visible: false });
        const span = s.tex(`= \\operatorname{Span}\\{${tup(WN)}\\}`, { x: 250, y: 305, size: 34, color: C.green, visible: false });
        const thm = s.defCard({ x: 230, y: 450, kind: 'theorem', title: 'Theorem 3', size: 32, tex: '\\begin{aligned} (\\operatorname{Row} A)^\\perp &= \\operatorname{Nul} A \\\\ (\\operatorname{Col} A)^\\perp &= \\operatorname{Nul} A^T \\end{aligned}', visible: false });
        return { sp, W, w1, w2, line, n, mk1, mk2, wl, def, nul, span, thm };
      },
      steps: [
        {
          say: 'Take a plane $W${W} through the origin in $\\mathbb{R}^3${R three}. Its orthogonal complement, $W^\\perp${W perp}, is every vector orthogonal to all of $W${W}. Here that\'s a line, standing straight up off the plane.',
          do: async (s, o) => {
            await s.all(o.sp.draw(), o.def.fadeIn());
            await s.all(o.W.fadeIn({ shift: [0, 0] }), o.wl.draw(), o.w1.grow({ delay: 200 }), o.w2.grow({ delay: 400 }));
            await s.all(o.line.draw({ duration: 700 }), o.n.grow());
            await s.all(o.mk1.draw({ duration: 400 }), o.mk2.draw({ duration: 400 }));
          },
        },
        {
          say: 'You don\'t have to check every vector of $W${W}. Being orthogonal to a spanning set is enough, so put $\\mathbf{w}_1${w one} and $\\mathbf{w}_2${w two} in as rows, and $W^\\perp${W perp} is the null space of that matrix.',
          do: async (s, o) => {
            await o.nul.write({ duration: 1100 });
            await s.all(o.nul.color('r1', C.blue), o.nul.color('r2', C.red, { delay: 250 }));
            await o.span.write();
          },
        },
        {
          say: 'That\'s Theorem 3: the orthogonal complement of the row space of $A${A} is the null space of $A${A}, and the complement of the column space is the null space of $A^T${A transpose}.',
          do: async (s, o) => {
            await o.thm.reveal();
            await orbitWith(s, o.sp, -70, 4000, [o.mk1, o.mk2]);
          },
        },
      ],
    },

    // 6
    {
      id: 'try-complement',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Use the dot product as your test.',
      prompt: `$W$ is a plane through $\\mathbf{0}$ in $\\mathbb{R}^3$ with $W^\\perp = \\operatorname{Span}\\{${tup(TN)}\\}$. Which vector is in $W$?`,
      answer: { type: 'choice', value: TC_IN[0] },
      choices: [
        { id: 'a', label: `$${tup(TC.a)}$`, why: 'That vector spans $W^\\perp$ itself. The only vector in both $W$ and $W^\\perp$ is $\\mathbf{0}$.' },
        { id: 'b', label: `$${tup(TC.b)}$`, why: `Its dot product with $${tup(TN)}$ is $${t(TC_DOT.b)} \\neq 0$, so it is not orthogonal to $W^\\perp$.` },
        { id: 'c', label: `$${tup(TC.c)}$`, why: `Right: $${dotTerms(TC.c, TN)} = ${t(TC_DOT.c)}$, and $W = (W^\\perp)^\\perp$.` },
        { id: 'd', label: `$${tup(TC.d)}$`, why: `The dot product is $${dotTerms(TC.d, TN)} = ${t(TC_DOT.d)}$, not $0$.` },
      ],
      hint: 'A vector is in $W$ exactly when it is orthogonal to the vector spanning $W^\\perp$.',
      solution: [
        `$W$ is everything orthogonal to $W^\\perp$, so test each vector against $${tup(TN)}$ with a dot product.`,
        `${['b', 'c', 'd'].map((k) => `$${tup(TC[k])}\\cdot${tup(TN)} = ${t(TC_DOT[k])}$`).join(', ')}.`,
        `Only $${tup(TC.c)}$ gives $0$, so it lies in $W$. The vector $${tup(TC.a)}$ spans $W^\\perp$, which meets $W$ only at $\\mathbf{0}$.`,
      ],
    },

    // 7
    {
      id: 'orthogonal-basis',
      title: 'Orthogonal bases make weights easy',
      scene(s) {
        const sp = s.space({ x: 745, y: 330, size: 370, range: 4.2, yaw: -40, pitch: 16, visible: false });
        const cols = [C.blue, C.red, C.teal];
        const us = OB.map((u, j) => sp.vector(u.map(Number), { color: cols[j], label: `\\mathbf{u}_${j + 1}`, visible: false }));
        const marks = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => spaceMark(s, sp, OB[i], OB[j], { size: 0.45 }));
        const y = sp.vector(OY.map(Number), { color: C.ink, label: '\\mathbf{y}', visible: false });
        let tail = [0, 0, 0];
        const parts = OPART.map((v, j) => {
          const vec3 = sp.vector(v.map(Number), { color: C.green, tail, width: 5, visible: false });
          tail = tail.map((x, k) => x + Number(v[k]));
          return vec3;
        });
        const L = (tex, y0, opts = {}) => s.tex(tex, { x: 50, y: y0, size: 34, anchor: [0, 0.5], visible: false, ...opts });
        const thm = s.text('Orthogonal and nonzero $\\Rightarrow$ independent', { x: 50, y: 70, size: 30, color: C.purple, anchor: [0, 0.5], visible: false });
        const comb = L('\\mathbf{y} = c_1\\mathbf{u}_1 + c_2\\mathbf{u}_2 + c_3\\mathbf{u}_3', 140);
        const dotted = L('\\mathbf{y}\\cdot\\mathbf{u}_1 = c_1\\,\\mathbf{u}_1\\cdot\\mathbf{u}_1 + \\part{z}{0 + 0}', 205);
        const form = L('c_j = \\dfrac{\\mathbf{y}\\cdot\\mathbf{u}_j}{\\mathbf{u}_j\\cdot\\mathbf{u}_j}', 285, { size: 38 });
        const box = s.surround({ x: 40, y: 245, w: 230, h: 82 }, { color: C.green, visible: false });
        const ws = [L(`\\begin{aligned}${OC.map((c, j) => `c_${j + 1} &= ${t(OYU[j])}/${t(OUU[j])} = ${t(c)}`).join(' \\\\ ')}\\end{aligned}`, 430, { size: 32 })];
        const fin = L(`\\mathbf{y} = ${OC.map((c, j) => `${c.eq(1) ? '' : t(c)}\\mathbf{u}_${j + 1}`).join(' + ')}`, 540, { color: C.green, size: 34 });
        const yTex = s.tex(`= ${tup(OY)}`, { x: 412, y: 540, size: 34, color: C.green, anchor: [0, 0.5], visible: false });
        return { sp, us, marks, y, parts, thm, comb, dotted, form, box, ws, fin, yTex };
      },
      steps: [
        {
          say: 'These three vectors are pairwise orthogonal: every pair has dot product zero. Theorem 4 says an orthogonal set of nonzero vectors is automatically linearly independent, so they form a basis of $\\mathbb{R}^3${R three}. The word nonzero matters: the zero vector is orthogonal to everything, yet no set containing it is independent.',
          do: async (s, o) => {
            await o.sp.draw();
            await s.stagger(o.us.map((u) => () => u.grow()), 350);
            await s.all(o.marks.map((m, k) => m.draw({ duration: 400, delay: k * 200 })), o.thm.fadeIn());
            await o.thm.indicate({ color: C.purple, scale: 1.05 });
          },
        },
        {
          say: 'To write $\\mathbf{y}${y} in this basis, dot both sides with $\\mathbf{u}_1${u one}. Every other term dies, because $\\mathbf{u}_2${u two} and $\\mathbf{u}_3${u three} are orthogonal to $\\mathbf{u}_1${u one}.',
          do: async (s, o) => {
            await s.all(o.y.grow(), o.comb.write());
            await o.dotted.write({ duration: 1100 });
            await o.dotted.color('z', C.muted);
          },
        },
        {
          say: 'So each weight is one quotient: $c_j${c j} is $\\mathbf{y}\\cdot\\mathbf{u}_j${y dot u j} over $\\mathbf{u}_j\\cdot\\mathbf{u}_j${u j dot u j}. Here they come out two, two and one, with no row reduction at all.',
          do: async (s, o) => {
            await s.all(o.form.write(), o.box.draw({ delay: 400 }));
            await s.stagger(o.ws.map((w) => () => w.fadeIn()), 400);
            for (const v of o.parts) await v.grow({ duration: 700 });
            await s.all(o.fin.write(), o.yTex.fadeIn({ delay: 500 }), o.y.indicate({ color: C.green }));
          },
        },
      ],
    },

    // 8
    {
      id: 'project-line',
      title: 'Projecting onto a line',
      scene(s) {
        const p = projPlane(s, false);
        const line = p.span(JU.map(Number), { color: C.blue, width: 2 });
        line.hide();
        const hat = p.vector(JHAT.map(Number), { color: C.green, width: 7, label: '\\hat{\\mathbf{y}}', visible: false });
        const u = p.vector(JU.map(Number), { color: C.blue, label: '\\mathbf{u}', visible: false });
        const y = p.vector(JY.map(Number), { color: C.red, label: '\\mathbf{y}', visible: false });
        const z = p.vector(JZ.map(Number), { tail: JHAT.map(Number), color: C.yellow, dash: '8 6', visible: false });
        const zMid = JHAT.map((x, i) => Number(x) + Number(JZ[i]) / 2);
        const zLab = p.label([zMid[0] - 0.45, zMid[1] + 0.5], '\\mathbf{z}', { color: C.yellow, size: 36, visible: false });
        const mark = rightMark(s, p, JHAT, JHAT.map((x) => x.neg()), JZ);
        const L = (tex, y0, opts = {}) => s.tex(tex, { x: 235, y: y0, size: 36, visible: false, ...opts });
        const split = L('\\mathbf{y} = \\part{h}{\\hat{\\mathbf{y}}} + \\part{z}{\\mathbf{z}}', 90);
        const form = L('\\hat{\\mathbf{y}} = \\frac{\\mathbf{y}\\cdot\\mathbf{u}}{\\mathbf{u}\\cdot\\mathbf{u}}\\,\\mathbf{u}', 175, { color: C.green });
        const nums = L(`= \\frac{${t(JYU)}}{${t(JUU)}}${tup(JU)} = ${tupD(JHAT)}`, 268, { size: 32 });
        const zt = L(`\\mathbf{z} = \\mathbf{y} - \\hat{\\mathbf{y}} = ${tupD(JZ)}`, 364, { size: 32 });
        const dist = L(`\\|\\mathbf{z}\\| = ${lenTex(JZ2)}`, 456, { size: 32 });
        const distLab = s.text('distance from $\\mathbf{y}$ to the line', { x: 235, y: 530, size: 30, color: C.muted, visible: false });
        return { p, line, u, y, hat, z, zLab, mark, split, form, nums, zt, dist, distLab };
      },
      steps: [
        {
          say: 'Here\'s a line through the origin along $\\mathbf{u}${u}, and a vector $\\mathbf{y}${y} off the line. Split $\\mathbf{y}${y} into a piece along the line and a piece orthogonal to it: drop a perpendicular.',
          do: async (s, o) => {
            await o.p.draw({ duration: 800 });
            await s.all(o.line.draw({ duration: 700 }), o.u.grow(), o.y.grow({ delay: 300 }));
            await s.all(o.hat.grow(), o.z.grow({ delay: 400 }), o.zLab.draw({ delay: 900 }), o.mark.draw({ delay: 900, duration: 400 }));
            await o.split.write();
            await s.all(o.split.color('h', C.green), o.split.color('z', C.yellow));
          },
        },
        {
          say: 'The piece along the line is a multiple of $\\mathbf{u}${u}, and the weight is the same quotient as before: $\\mathbf{y}\\cdot\\mathbf{u}${y dot u} over $\\mathbf{u}\\cdot\\mathbf{u}${u dot u}. Here that\'s fifteen over ten, so $\\hat{\\mathbf{y}}${y hat} is one and a half times $\\mathbf{u}${u}: $(\\tfrac92, \\tfrac32)${nine halves, three halves}.',
          do: async (s, o) => {
            await o.form.write();
            await o.nums.write();
            await s.all(o.hat.indicate({ color: C.green }), o.u.indicate({ color: C.blue }));
          },
        },
        {
          say: 'What\'s left over, $\\mathbf{z} = \\mathbf{y} - \\hat{\\mathbf{y}}${z equals y minus y hat}, is orthogonal to the line. Its length, $\\sqrt{10}/2${the square root of ten, over two}, is the distance from $\\mathbf{y}${y} to the line.',
          do: async (s, o) => {
            await o.zt.write();
            await s.all(o.z.indicate({ color: C.yellow }), o.dist.fadeIn({ delay: 300 }), o.distLab.fadeIn({ delay: 500 }));
          },
        },
      ],
    },

    // 9
    {
      id: 'mistake-divide',
      title: 'The trap: dividing by the wrong thing',
      scene(s) {
        const p = projPlane(s, true);
        p.span(JU.map(Number), { color: C.blue, width: 2 });
        const y = p.vector(JY.map(Number), { color: C.red, label: '\\mathbf{y}' });
        const u = p.vector(JU.map(Number), { color: C.blue, label: '\\mathbf{u}' });
        // The wrong answer lies far outside: draw it to the plane's edge and say where it really ends.
        const edge = [7, 7 / 3];
        const wrong = p.vector(edge, { color: C.yellow, width: 6, visible: false });
        // (The yellow arrow stops at the plane's edge; the left column names the point it would reach.)
        const u2 = p.vector(J2U.map(Number), { color: C.blue, width: 3, label: '2\\mathbf{u}', visible: false });
        const hat = p.vector(JHAT.map(Number), { color: C.green, width: 7, label: '\\hat{\\mathbf{y}}', visible: false });
        const L = (tex, y0, opts = {}) => s.tex(tex, { x: 240, y: y0, size: 30, visible: false, ...opts });
        const bad = L(`\\begin{aligned}(\\mathbf{y}\\cdot\\mathbf{u})\\,\\mathbf{u} &= ${t(JYU)}${tup(JU)} \\\\ &= ${tup(JWRONG)}\\end{aligned}`, 105, { color: C.yellow });
        const box = s.surround({ x: 60, y: 50, w: 360, h: 110 }, { color: C.yellow, visible: false });
        const bad2 = L(`(\\mathbf{y}\\cdot 2\\mathbf{u})\\,2\\mathbf{u} = ${tup(J2WRONG)}`, 205, { color: C.yellow });
        const good = L('\\hat{\\mathbf{y}} = \\frac{\\mathbf{y}\\cdot\\mathbf{u}}{\\mathbf{u}\\cdot\\mathbf{u}}\\,\\mathbf{u}', 300, { color: C.green, size: 36 });
        const good2 = L(`2\\mathbf{u}:\\ \\ \\frac{${t(dot(JY, J2U))}}{${t(norm2(J2U))}}${tup(J2U)} = ${tupD(J2HAT)}`, 395, { size: 32 });
        const unit = s.text('Skip the division only for a unit vector: then $\\mathbf{u}\\cdot\\mathbf{u} = 1$.', { x: 240, y: 500, size: 30, width: 400, visible: false });
        return { p, y, u, wrong, u2, hat, bad, box, bad2, good, good2, unit };
      },
      steps: [
        {
          say: 'Here\'s the trap. Forget the denominator and you get $(\\mathbf{y}\\cdot\\mathbf{u})\\,\\mathbf{u}${y dot u, times u}, which is fifteen times $\\mathbf{u}${u}: the point $(45, 15)${forty-five, fifteen}, way off the screen.',
          do: async (s, o) => {
            await o.bad.write();
            await s.all(o.wrong.grow({ duration: 1000 }), o.box.draw({ delay: 300 }));
          },
        },
        {
          say: 'Worse, the answer depends on how long $\\mathbf{u}${u} is. Use $2\\mathbf{u}${two u}, which spans the same line, and you get a different point again. The line didn\'t change, so the projection can\'t either.',
          do: async (s, o) => {
            await o.u2.grow();
            await o.bad2.write();
            await s.all(s.strike(o.bad, { color: 'yellow' }), s.strike(o.bad2, { color: 'yellow', delay: 200 }), o.box.fadeOut());
          },
        },
        {
          say: 'Dividing by $\\mathbf{u}\\cdot\\mathbf{u}${u dot u} fixes it: with $2\\mathbf{u}${two u} the quotient is thirty over forty, and you land on $(\\tfrac92, \\tfrac32)${nine halves, three halves} again. Only for a unit vector can you skip the division.',
          do: async (s, o) => {
            await s.all(o.good.write(), o.wrong.fadeOut());
            await o.good2.write();
            await s.all(o.hat.grow(), o.unit.fadeIn({ delay: 300 }));
          },
        },
      ],
    },

    // 10
    {
      id: 'try-orth-set',
      kind: 'try',
      title: 'Your turn',
      say: 'Which of these is an orthogonal set? Check every pair.',
      prompt: 'Which set is orthogonal?',
      answer: { type: 'choice', value: OS_ORTH[0] },
      choices: Object.entries(OS).map(([k, vs]) => ({
        id: k,
        label: `$\\{${vs.map((v) => tup(vec(v))).join(', ')}\\}$`,
        why: OS_BAD[k]
          ? `$${tup(OS_BAD[k][0])}\\cdot${tup(OS_BAD[k][1])} = ${t(dot(OS_BAD[k][0], OS_BAD[k][1]))}$, not $0$. Every pair has to pass.`
          : `Right: $${pairs(vs.map(vec)).map(([u, v]) => `${tup(u)}\\cdot${tup(v)} = ${t(dot(u, v))}`).join(',\\ ')}$.`,
      })),
      hint: 'A set is orthogonal when every pair of distinct vectors has dot product $0$.',
      solution: [
        `(a): $${dotTerms(OS.a[0], OS.a[1])} = ${t(dot(vec(OS.a[0]), vec(OS.a[1])))}$. One pair, and it passes.`,
        `(b): two of the three pairs pass, but $${tup(OS_BAD.b[0])}\\cdot${tup(OS_BAD.b[1])} = ${t(dot(OS_BAD.b[0], OS_BAD.b[1]))}$. One failing pair is enough.`,
        `(c): $${tup(OS.c[0])}\\cdot${tup(OS.c[1])} = ${t(dot(vec(OS.c[0]), vec(OS.c[1])))}$; these vectors meet at $45^\\circ$.`,
      ],
    },

    // 11
    {
      id: 'orthonormal',
      title: 'Orthonormal columns',
      scene(s) {
        const uLab = s.tex('U =', { x: 85, y: 135, size: 36, visible: false });
        const U = s.matrix(U_TEX, { x: 278, y: 135, size: 30, visible: false });
        const lens = s.tex('\\|\\mathbf{u}_1\\| = \\|\\mathbf{u}_2\\| = 1,\\quad \\mathbf{u}_1\\cdot\\mathbf{u}_2 = 0', { x: 270, y: 262, size: 30, visible: false });
        const pLab = s.tex('U^TU =', { x: 130, y: 370, size: 36, visible: false });
        const I = s.matrix([['\\ast', '\\ast'], ['\\ast', '\\ast']], { x: 275, y: 370, size: 36, visible: false });
        const eqI = s.tex('= I', { x: 395, y: 370, size: 36, color: C.green, visible: false });
        const p = s.plane({ x: 730, y: 250, width: 320, range: [-3, 3, -3, 3], labels: false, visible: false });
        const X = [2, 1], Y = [0.5, 2];
        const xv = p.vector(X, { color: C.blue, label: '\\mathbf{x}', visible: false });
        const yv = p.vector(Y, { color: C.red, label: '\\mathbf{y}', visible: false });
        const aX = Math.atan2(X[1], X[0]), aY = Math.atan2(Y[1], Y[0]);
        const arc = planePath(s, p, arcPts(0.8, aX, aY), { color: C.purple, visible: false });
        const thm7 = s.tex('\\|U\\mathbf{x}\\| = \\|\\mathbf{x}\\|,\\qquad (U\\mathbf{x})\\cdot(U\\mathbf{y}) = \\mathbf{x}\\cdot\\mathbf{y}', { x: 480, y: 485, size: 34, visible: false });
        const sq = s.text('Square: an **orthogonal matrix**, and $U^{-1} = U^T$', { x: 480, y: 548, size: 30, color: C.purple, visible: false });
        return { uLab, U, lens, pLab, I, eqI, p, xv, yv, X, Y, aX, aY, arc, thm7, sq };
      },
      steps: [
        {
          say: 'An orthonormal set is an orthogonal set of unit vectors. The columns of this $U${U} are orthonormal: each has length one, and they\'re orthogonal to each other.',
          do: async (s, o) => {
            await s.all(o.uLab.fadeIn(), o.U.fadeIn());
            await s.all(o.U.highlightCol(0, C.blue), o.U.highlightCol(1, C.red, { delay: 200 }));
            await o.lens.write();
          },
        },
        {
          say: 'Multiply $U^T${U transpose} by $U${U}. Each entry is a dot product of two columns, so you get ones on the diagonal and zeros off it. Theorem 6: the columns are orthonormal exactly when $U^TU = I${U transpose U equals I}.',
          do: async (s, o) => {
            await s.all(o.pLab.fadeIn(), o.I.fadeIn());
            for (const [i, j] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
              await s.all(o.U.clearHighlights({ duration: 150 }), o.I.highlightCell(i, j, C.yellow));
              await s.all(o.U.highlightCol(i, i ? C.red : C.blue), i !== j ? o.U.highlightCol(j, j ? C.red : C.blue) : null);
              await o.I.setEntry(i, j, UTU[i][j]);
            }
            await s.all(o.I.clearHighlights(), o.U.clearHighlights(), o.eqI.fadeIn());
          },
        },
        {
          say: 'Such a $U${U} keeps geometry intact. In the plane, a rotation is the typical example: lengths don\'t change, and neither does the angle between two vectors, so dot products are preserved. That\'s Theorem 7.',
          do: async (s, o) => {
            await o.p.draw({ duration: 700 });
            await s.all(o.xv.grow(), o.yv.grow({ delay: 200 }), o.arc.draw({ delay: 600, duration: 500 }));
            const turn = (k) => {
              const a = k * 1.1;
              const r = (v) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
              o.xv.setCoords(r(o.X));
              o.yv.setCoords(r(o.Y));
              o.arc.setPath(pathD(o.p, arcPts(0.8, o.aX + a, o.aY + a)));
            };
            await s.all(s.clock.tween({ duration: 2200, update: turn }), o.thm7.write({ delay: 600 }));
          },
        },
        {
          say: 'When $U${U} is square, Lay calls it an orthogonal matrix. The name is a little misleading: its columns are orthonormal, and its inverse is just its transpose.',
          do: (s, o) => o.sq.fadeIn(),
        },
      ],
    },

    // 12
    {
      id: 'wo-weights',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Use the dot product formula for each weight, then check by adding the vectors back up.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateWeights,
    },

    // 13
    {
      id: 'cp-orth-weights',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain this in your own words.',
      prompt: 'Why can you find the weights in an orthogonal basis with one dot product each, without row reducing?',
      points: [
        'Write $\\mathbf{y} = c_1\\mathbf{u}_1 + \\cdots + c_p\\mathbf{u}_p$ and dot both sides with $\\mathbf{u}_j$',
        'Orthogonality kills every term $c_i\\,\\mathbf{u}_i\\cdot\\mathbf{u}_j$ with $i \\neq j$',
        'What is left is $\\mathbf{y}\\cdot\\mathbf{u}_j = c_j\\,\\mathbf{u}_j\\cdot\\mathbf{u}_j$',
        'Divide, which is allowed because $\\mathbf{u}_j \\neq \\mathbf{0}$ makes $\\mathbf{u}_j\\cdot\\mathbf{u}_j > 0$',
      ],
    },

    // 14
    {
      id: 'summary-orth',
      title: 'What you have now',
      scene(s) {
        const p = s.plane({ x: 230, y: 200, width: 300, range: [-1, 5, -1, 5], labels: false, visible: false });
        p.span(JU.map(Number), { color: C.blue, width: 2 });
        p.vector(JY.map(Number), { color: C.red, label: '\\mathbf{y}' });
        p.vector(JHAT.map(Number), { color: C.green, label: '\\hat{\\mathbf{y}}' });
        p.vector(JZ.map(Number), { tail: JHAT.map(Number), color: C.yellow, dash: '8 6' });
        rightMark(s, p, JHAT, JHAT.map((x) => x.neg()), JZ, { visible: true, size: 0.4 });
        const sp = s.space({ x: 720, y: 215, size: 250, range: 2.6, yaw: -40, pitch: 16, visible: false });
        const cols = [C.blue, C.red, C.teal];
        OB.forEach((u, j) => sp.vector(u.map(Number), { color: cols[j], label: `\\mathbf{u}_${j + 1}` }));
        const marks = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => spaceMark(s, sp, OB[i], OB[j], { size: 0.45 }));
        const lines = [
          '$\\mathbf{u}\\cdot\\mathbf{v}$ measures angles; $0$ means orthogonal',
          'Complements are null spaces: $(\\operatorname{Row} A)^\\perp = \\operatorname{Nul} A$',
          'Orthogonal bases: $c_j = \\mathbf{y}\\cdot\\mathbf{u}_j \\,/\\, \\mathbf{u}_j\\cdot\\mathbf{u}_j$',
        ].map((str, i) => s.text(str, { x: 480, y: 410 + 55 * i, size: 30, visible: false }));
        return { p, sp, marks, lines };
      },
      steps: [
        {
          say: 'Dot products measure angles, and a dot product of zero means orthogonal. Projections drop a perpendicular.',
          do: async (s, o) => {
            await o.p.fadeIn();
            await o.lines[0].fadeIn();
          },
        },
        {
          say: 'Orthogonal complements are null spaces: the complement of the row space is the null space.',
          do: (s, o) => o.lines[1].fadeIn(),
        },
        {
          say: 'And in an orthogonal basis, every weight is one dot product divided by another. Next time we project onto whole subspaces, and build orthogonal bases of our own.',
          do: async (s, o) => {
            await s.all(o.sp.fadeIn(), o.marks.map((m) => m.fadeIn()));
            await o.lines[2].fadeIn();
          },
        },
      ],
    },
  ],
};

