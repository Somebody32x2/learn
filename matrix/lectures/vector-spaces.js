/**
 * Lecture 14 · Vector spaces, null spaces, and column spaces (Lay 4.1–4.2). Design: matrix/PLAN.md § 14.
 * Every matrix, null space, column-space test and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, rref, mulVec, nullspace, solve, add, scale, addVec, scaleVec, rank, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
const ptTex = (v) => `(${v.map(t).join(', ')})`;
/** Scales a rational vector by a positive factor to the smallest integer multiple (signs kept, so a null-space
 * basis vector keeps its free entry positive). */
function integerize(v) {
  const big = (x) => (x < 0n ? -x : x);
  const gcd = (a, b) => (b ? gcd(b, a % b) : big(a));
  const lcm = v.reduce((l, x) => (l * x.d) / gcd(l, x.d), 1n);
  const w = v.map((x) => x.mul(F(lcm)));
  const g = w.reduce((a, x) => gcd(a, x.n), 0n) || 1n;
  return w.map((x) => x.div(F(g)));
}

/** Beat 1: the three kinds of vectors. */
const AR_U = [1, 1];
const AR_V = [2, 0];
const AR_S = AR_U.map((x, i) => x + AR_V[i]);
/** Polynomials as coefficient lists [c0, c1, c2] (1, t, t²). */
const PP = vec([1, 2, 0]);
const PQ = vec([0, 1, -1]);
const PS = addVec(PP, PQ);
/** TeX of a polynomial from coefficients [c0, c1, c2]; `desc` writes the highest power first. */
const polyTex = (c, { v = 't', desc = false } = {}) => {
  const terms = [];
  c.forEach((a0, k) => {
    const a = F(a0);
    if (a.zero) return;
    const mono = k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`;
    terms.push({ a, body: (k > 0 && a.abs().eq(1) ? '' : t(a.abs())) + mono });
  });
  if (desc) terms.reverse();
  const out = terms.map(({ a, body }, i) => (a.sign() < 0 ? (i ? ' - ' : '-') : i ? ' + ' : '') + body).join('');
  return out || '0';
};
const polyAt = (c, x) => c.reduce((s, a, k) => s + Number(a) * x ** k, 0);
const MA = mat([[1, 2], [0, 1]]);
const MB = mat([[0, 1], [3, 0]]);
const MS = add(MA, MB);
const M2 = scale(2, MA);

/** Beat 5: the span in R^3. */
const SV1 = vec([1, 0, 1]);
const SV2 = vec([-2, 1, 0]);
const SW1 = addVec(SV1, SV2);
const SW2 = addVec(SV1, scaleVec(F(-1, 2), SV2));
const SWS = addVec(SW1, SW2);
if (rank([SV1, SV2, SWS].map((v) => v)) !== 2) throw new Error('vector-spaces: the sum should stay in the plane');

/** Beats 6, 9: Nul A for a 2 × 3 matrix. */
const NA = mat([[1, 1, -1], [2, -1, 0]]);
const NU = vec([1, 2, 3]);
const NAU = mulVec(NA, NU);
const NUL = nullspace(NA).map(integerize);
if (!NAU.every((x) => x.zero) || NUL.length !== 1) throw new Error('vector-spaces: Nul A example drifted');
const NA_RANK = rank(NA);
const NA_RED = rref(NA);
const NA_NUL = nullspace(NA)[0];
/** NUL[0] = NA_SCALE · NA_NUL (the free entry 1 becomes NA_SCALE). */
const NA_SCALE = NUL[0][2].div(NA_NUL[2]);

/** Beat 7: Col A and a vector not in it. */
const CA = mat([[1, 2], [0, 1], [1, 3]]);
const CB = vec([1, 1, 1]);
const CX = vec([1, 1]);
const CAX = mulVec(CA, CX);
const C_AUG = CA.map((row, i) => [...row, CB[i]]);
const C_RED = rref(C_AUG, { augmented: 1 });
const C_FWD = C_RED.steps.filter((st) => st.phase === 'forward');
const C_LAST = C_FWD.at(-1).after;
const C_BAD = C_LAST.findIndex((row) => row.slice(0, 2).every((x) => x.zero) && !row[2].zero);
if (C_BAD < 0 || solve(CA, CB).kind !== 'none') throw new Error('vector-spaces: b should not be in Col A');

/** Beat 10: T(p) = (p(0), p(1)) on P_2. */
const KER = vec([0, -1, 1]); // t² − t
const TOF = (c) => [polyAt(c, 0), polyAt(c, 1)];
const T_ITEMS = [
  { c: KER, color: C.yellow },
  { c: vec([1, 0, 0]), color: C.green },
  { c: vec([0, 1, 0]), color: C.green },
];
if (TOF(KER).some((x) => x !== 0)) throw new Error('vector-spaces: t^2 - t should be in the kernel');

// ---------------------------------------------------------------- workout: a vector spanning Nul A

function nulItem(A0) {
  const A = mat(A0);
  const red = rref(A);
  const fwd = red.steps.filter((st) => st.phase === 'forward');
  const free = [0, 1, 2].find((c) => !red.pivots.some(([, pc]) => pc === c));
  const v = integerize(nullspace(A)[0]);
  const check = mulVec(A, v);
  const rowCheck = A.map((row) =>
    row
      .map((a, j) => {
        const q = a.mul(v[j]);
        return j ? `${q.sign() < 0 ? '-' : '+'} ${t(q.abs())}` : t(q);
      })
      .join(' '),
  );
  return {
    prompt: `Let $A = ${texMat(A)}$. Find a vector that spans $\\operatorname{Nul} A$.`,
    answer: { type: 'basis', value: [v.map(String)] },
    hints: [
      `${fwd.map((st) => `$${texRowOp(st)}$`).join(', ')} gives row 2 $= (${fwd.at(-1).after[1].map(t).join(', ')})$.`,
      `Column ${free + 1} has no pivot, so $x_${free + 1}$ is free. Solve for the other two in terms of it.`,
    ],
    solution: [
      `Row reduce $A = ${texMat(A)}$:`,
      ...red.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after)}$`),
      `Pivots in columns ${red.pivots.map(([, c]) => c + 1).join(' and ')}, so $x_${free + 1}$ is free. The general solution of $A\\mathbf{x} = \\mathbf{0}$ is $\\mathbf{x} = x_${free + 1}${texVec(nullspace(A)[0])}$, so $\\operatorname{Nul} A = \\operatorname{Span}\\left\\{${texVec(v)}\\right\\}$. Any nonzero multiple works too.`,
      `Check: $A${texVec(v)} = \\begin{bmatrix} ${rowCheck.join(' \\\\ ')} \\end{bmatrix} = ${texVec(check)}$.`,
    ],
  };
}
const WO_NUL = nulItem([[1, 2, -1], [3, 5, 1]]);
function generateNul(rand) {
  for (;;) {
    const A = [[1, rand.int(-3, 3), rand.int(-3, 3)], [rand.nonzero(-3, 3), rand.int(-3, 3), rand.int(-3, 3)]];
    if (rank(mat(A)) !== 2) continue;
    const red = rref(A);
    if (!red.steps.filter((st) => st.phase === 'forward').every((st) => st.after.every((row) => row.every((x) => x.isInt && x.abs().cmp(12) <= 0)))) continue;
    const v = integerize(nullspace(A)[0]);
    if (v.some((x) => x.abs().cmp(12) > 0) || v.filter((x) => !x.zero).length < 2) continue;
    return nulItem(A);
  }
}

// ---------------------------------------------------------------- scene helpers

/** Colors a named \part immediately. */
function paint(tex, name, color) {
  for (const e of tex.part(name)) e.style.color = color;
  return tex;
}
const soft = (color, pct = 20) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
/** A static SVG path tracing y = f(x) on a plane, broken where it leaves the plane's range. */
function curveD(pl, f, [x0, x1], steps = 60) {
  const [, , ylo, yhi] = pl.range;
  let d = '';
  let pen = false;
  for (let k = 0; k <= steps; k++) {
    const x = x0 + ((x1 - x0) * k) / steps;
    const y = f(x);
    if (y < ylo || y > yhi) {
      pen = false;
      continue;
    }
    const [sx, sy] = pl.toStage([x, y]);
    d += `${pen ? 'L' : 'M'} ${sx.toFixed(1)} ${sy.toFixed(1)} `;
    pen = true;
  }
  return d;
}
/** `✓`-marked tex (green check) or `✗`-marked (yellow cross). */
const marked = (s, tex, ok, opts) =>
  paint(s.tex(`${tex}\\ \\part{m}{${ok ? '\\checkmark' : '\\times'}}`, opts), 'm', ok ? C.green : C.yellow);

/** Beat 8 / 15: the comparison table. */
const TABLE = [
  ['a subspace of', '$\\mathbb{R}^n$', '$\\mathbb{R}^m$'],
  ['described', 'implicitly: $A\\mathbf{x} = \\mathbf{0}$', 'explicitly: all $A\\mathbf{x}$'],
  ['test $\\mathbf{v}$', 'is $A\\mathbf{v} = \\mathbf{0}$?', 'is $[A \\mid \\mathbf{v}]$ consistent?'],
  ['trivial / full', '$\\{\\mathbf{0}\\}$ iff one-to-one', '$\\mathbb{R}^m$ iff onto'],
];

// ---------------------------------------------------------------- the lecture

export default {
  id: 'vector-spaces',
  title: 'Vector spaces, null spaces, and column spaces',
  goals: [
    'Know what a vector space is and recognize $\\mathbb{P}_n$, $M_{m\\times n}$ and function spaces',
    'Check whether a subset is a subspace, and know that a span is always a subspace',
    'Contrast $\\operatorname{Nul} A$ (a condition) with $\\operatorname{Col} A$ (a span) and test membership in each',
    'Define the kernel and range of a linear transformation',
  ],
  beats: [
    // 1
    {
      id: 'what-is-vector',
      title: 'What counts as a vector?',
      scene(s) {
        const head = (tex, x) => s.tex(tex, { x, y: 55, size: 36, visible: false });
        // arrows
        const pa = s.plane({ x: 170, y: 210, width: 250, range: [-0.5, 3.5, -0.5, 2.5], labels: false, visible: false });
        const u = pa.vector(AR_U, { color: C.blue, label: '\\mathbf{u}', visible: false });
        const v = pa.vector(AR_V, { color: C.red, label: '\\mathbf{v}', visible: false });
        const w = pa.vector(AR_S, { color: C.green, visible: false });
        const u2 = pa.vector(AR_U.map((x) => 2 * x), { color: C.blue, width: 3, visible: false });
        const aSum = s.tex('\\col{green}{\\mathbf{u} + \\mathbf{v}},\\ \\ \\col{blue}{2\\mathbf{u}}', { x: 170, y: 380, size: 32, visible: false });
        // polynomials
        const pp = s.plane({ x: 480, y: 210, width: 260, height: 220, range: [-1, 2, -2, 4], labels: false, visible: false });
        const curve = (c, color, width = 4) => s.path(curveD(pp, (x) => polyAt(c, x), [-1, 2]), { color, width, visible: false });
        const cp = curve(PP, C.blue);
        const cq = curve(PQ, C.red);
        const cs = curve(PS, C.green, 5);
        const pTex = s.tex(`\\col{blue}{${polyTex(PP)}} + \\col{red}{(${polyTex(PQ)})}`, { x: 480, y: 360, size: 30, visible: false });
        const sTex = s.tex(`= \\col{green}{${polyTex(PS)}}`, { x: 480, y: 410, size: 30, visible: false });
        // matrices
        const mSum = s.tex(`${texMat(MA)} + ${texMat(MB)}`, { x: 790, y: 180, size: 30, visible: false });
        const mRes = s.tex(`= \\col{green}{${texMat(MS)}}`, { x: 790, y: 270, size: 30, visible: false });
        const mScale = s.tex(`2${texMat(MA)} = \\col{green}{${texMat(M2)}}`, { x: 790, y: 380, size: 30, visible: false });
        const heads = [head('\\mathbb{R}^2', 170), head('\\mathbb{P}_2', 480), head('M_{2\\times 2}', 790)];
        const moral = s.text('Anything you can **add** and **scale** by the usual rules is a vector.', { x: 480, y: 515, size: 30, width: 880, visible: false });
        return { pa, u, v, w, u2, aSum, pp, cp, cq, cs, pTex, sTex, mSum, mRes, mScale, heads, moral };
      },
      steps: [
        {
          say: 'Start with what you know. Arrows in the plane add tip to tail, and they scale by stretching.',
          do: async (s, o) => {
            await s.all(o.heads[0].fadeIn(), o.pa.draw({ duration: 700 }));
            await s.all(o.u.grow(), o.v.grow({ delay: 150 }));
            await o.pa.addTip(o.u, o.v);
            await o.w.grow();
            await s.all(o.u2.grow(), o.aSum.fadeIn());
          },
        },
        {
          say: 'Polynomials, and functions in general, do the same thing. Add two of them by adding coefficients, and the graphs add point by point. Scaling multiplies every value.',
          do: async (s, o) => {
            await s.all(o.heads[1].fadeIn(), o.pp.draw({ duration: 700 }));
            await s.all(o.cp.draw(), o.cq.draw({ delay: 200 }));
            await o.pTex.write();
            await s.all(o.cs.draw(), o.sTex.write());
          },
        },
        {
          say: 'So do matrices, entry by entry. The objects look nothing alike, but the two operations follow the same rules.',
          do: async (s, o) => {
            await o.heads[2].fadeIn();
            await o.mSum.write();
            await o.mRes.write();
            await o.mScale.write();
          },
        },
        {
          say: 'That\'s Lay\'s point: anything with a sensible addition and scaling is a vector space, and its elements are vectors, even when they\'re polynomials or matrices.',
          do: async (s, o) => {
            await o.moral.fadeIn();
            await s.all(o.heads.map((h, k) => h.indicate({ color: C.green, delay: k * 200 })));
          },
        },
      ],
    },

    // 2
    {
      id: 'axioms',
      title: 'The rules (Lay\'s ten axioms)',
      scene(s) {
        const L = [
          '1.\\ \\mathbf{u} + \\mathbf{v} \\in V',
          '2.\\ \\mathbf{u} + \\mathbf{v} = \\mathbf{v} + \\mathbf{u}',
          '3.\\ (\\mathbf{u} + \\mathbf{v}) + \\mathbf{w} = \\mathbf{u} + (\\mathbf{v} + \\mathbf{w})',
          '4.\\ \\exists\\, \\mathbf{0}:\\ \\mathbf{u} + \\mathbf{0} = \\mathbf{u}',
          '5.\\ \\exists\\, {-\\mathbf{u}}:\\ \\mathbf{u} + (-\\mathbf{u}) = \\mathbf{0}',
        ];
        const R = [
          '6.\\ c\\mathbf{u} \\in V',
          '7.\\ c(\\mathbf{u} + \\mathbf{v}) = c\\mathbf{u} + c\\mathbf{v}',
          '8.\\ (c + d)\\mathbf{u} = c\\mathbf{u} + d\\mathbf{u}',
          '9.\\ c(d\\mathbf{u}) = (cd)\\mathbf{u}',
          '10.\\ 1\\mathbf{u} = \\mathbf{u}',
        ];
        const line = (tex, x, k) => s.tex(tex, { x, y: 110 + 60 * k, size: 30, anchor: [0, 0.5], visible: false });
        const left = L.map((tx, k) => line(tx, 45, k));
        const right = R.map((tx, k) => line(tx, 555, k));
        const head = s.text('For all $\\mathbf{u}, \\mathbf{v}, \\mathbf{w}$ in $V$ and all scalars $c, d$:', { x: 480, y: 52, size: 30, color: C.muted, visible: false });
        const ring = (mobs, color) => s.surround(s.group(...mobs).box(), { color, pad: 8, visible: false });
        const rClose = [ring([left[0]], C.yellow), ring([right[0]], C.yellow)];
        const rAdd = ring(left.slice(1), C.blue);
        const rScale = ring(right.slice(1), C.red);
        const ex = s.tex('\\mathbb{R}^n,\\quad \\mathbb{P}_n,\\quad M_{m\\times n},\\quad C[a, b]', { x: 480, y: 450, size: 36, color: C.green, visible: false });
        const note = s.text('In practice: check a **subspace** of a space you already know.', { x: 480, y: 525, size: 30, visible: false });
        return { left, right, head, rClose, rAdd, rScale, ex, note };
      },
      steps: [
        {
          say: 'Lay lists ten rules. The first and the sixth are closure: adding two vectors, or scaling one, keeps you inside $V${V}.',
          do: async (s, o) => {
            await s.all(o.head.fadeIn(), o.left[0].write(), o.right[0].write({ delay: 300 }));
            await s.all(o.rClose.map((r) => r.draw()));
          },
        },
        {
          say: 'Then the familiar algebra of addition: order doesn\'t matter, grouping doesn\'t matter, there\'s a zero vector, and every vector has a negative.',
          do: async (s, o) => {
            await s.stagger(o.left.slice(1).map((m) => () => m.write({ duration: 600 })), 450);
            await o.rAdd.draw();
          },
        },
        {
          say: 'And the rules for scaling: it distributes over sums of vectors and sums of scalars, it associates, and $1\\mathbf{u} = \\mathbf{u}${one times u equals u}.',
          do: async (s, o) => {
            await s.stagger(o.right.slice(1).map((m) => () => m.write({ duration: 600 })), 450);
            await o.rScale.draw();
          },
        },
        {
          say: 'Spaces like $\\mathbb{P}_n${P n}, the two by two matrices, and continuous functions on an interval all satisfy them. You\'ll rarely check all ten; mostly you\'ll check that a set is a subspace of a space you already know.',
          do: async (s, o) => {
            await o.ex.write();
            await o.note.fadeIn();
          },
        },
      ],
    },

    // 3
    {
      id: 'subspace-test',
      title: 'Subspaces: three checks',
      scene(s) {
        const card = s.defCard({
          x: 480, y: 142, width: 880, visible: false,
          body: 'A **subspace** of $V$ is a subset $H \\subseteq V$ with: (a) $\\mathbf{0} \\in H$; (b) $\\mathbf{u} + \\mathbf{v} \\in H$ whenever $\\mathbf{u}, \\mathbf{v} \\in H$; (c) $c\\mathbf{u} \\in H$ for every $\\mathbf{u} \\in H$ and scalar $c$.',
        });
        const hT = s.tex('H = \\{p \\in \\mathbb{P}_2 : p(0) = 0\\}', { x: 250, y: 290, size: 32, visible: false });
        const kT = s.tex('K = \\{p \\in \\mathbb{P}_2 : p(0) = 1\\}', { x: 700, y: 290, size: 32, visible: false });
        const hc = [
          ['\\text{(a) } \\mathbf{0}(0) = 0', true],
          ['\\text{(b) } (p + q)(0) = 0 + 0 = 0', true],
          ['\\text{(c) } (cp)(0) = c \\cdot 0 = 0', true],
        ].map(([tx, ok], k) => marked(s, tx, ok, { x: 50, y: 357 + 58 * k, size: 30, anchor: [0, 0.5], visible: false }));
        const kc = marked(s, '\\text{(a) } \\mathbf{0}(0) = 0 \\neq 1', false, { x: 545, y: 357, size: 30, anchor: [0, 0.5], color: C.yellow, visible: false });
        const stamp = s.stamp('not a subspace', { x: 700, y: 455, color: 'yellow' });
        const hOk = s.text('a subspace', { x: 250, y: 535, size: 30, color: C.green, weight: 600, visible: false });
        return { card, hT, kT, hc, kc, stamp, hOk };
      },
      steps: [
        {
          say: 'A subspace is a subset that passes three checks: it contains the zero vector, it\'s closed under addition, and it\'s closed under scaling.',
          do: (s, o) => o.card.reveal(),
        },
        {
          say: 'Take the polynomials with $p(0) = 0${p of zero equals zero}. The zero polynomial qualifies. If $p${p} and $q${q} vanish at zero, so does their sum, and so does any multiple. All three pass.',
          do: async (s, o) => {
            await o.hT.write();
            await s.stagger(o.hc.map((m) => () => m.write({ duration: 700 })), 1000);
            await o.hOk.fadeIn();
          },
        },
        {
          say: 'Now try $p(0) = 1${p of zero equals one}. The zero polynomial has value zero at zero, not one, so this set fails the very first check.',
          do: async (s, o) => {
            await o.kT.write();
            await o.kc.write();
            await o.stamp.slam();
          },
        },
      ],
    },

    // 4
    {
      id: 'try-subspace-v',
      kind: 'try',
      title: 'Your turn',
      say: 'Which one passes all three checks?',
      prompt: 'Which of these is a subspace of $M_{2\\times 2}$?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: 'The invertible $2\\times 2$ matrices', why: 'The zero matrix isn\'t invertible, so check (a) fails.' },
        { id: 'b', label: 'The matrices with trace $0$', why: 'Right: the trace is linear, so all three checks pass.' },
        { id: 'c', label: 'The matrices with $\\det = 0$', why: '$\\operatorname{diag}(1, 0) + \\operatorname{diag}(0, 1) = I$ has determinant $1$: not closed under addition.' },
        { id: 'd', label: 'The matrices with all entries $\\ge 0$', why: 'Scaling by $-1$ leaves the set.' },
      ],
      hint: 'Test the zero matrix first, then sums, then multiples by negative numbers.',
      solution: [
        'The trace ($a_{11} + a_{22}$) is linear: $\\operatorname{tr}(A + B) = \\operatorname{tr} A + \\operatorname{tr} B$ and $\\operatorname{tr}(cA) = c\\operatorname{tr} A$, and $\\operatorname{tr} 0 = 0$. So trace-zero matrices contain $0$ and are closed under both operations.',
        'Invertible matrices miss $0$; singular matrices are not closed under addition; nonnegative matrices are not closed under scaling by $-1$.',
      ],
    },

    // 5
    {
      id: 'span-subspace',
      title: 'A span is always a subspace (Theorem 1)',
      scene(s) {
        const sp = s.space({ x: 245, y: 330, size: 340, range: 3.5, yaw: -40, pitch: 22, visible: false });
        const P = sp.plane(SV1.map(Number), SV2.map(Number), { color: C.blue, extent: 1.4, visible: false });
        const v1 = sp.vector(SV1.map(Number), { color: C.blue, label: '\\mathbf{v}_1', visible: false });
        const v2 = sp.vector(SV2.map(Number), { color: C.red, label: '\\mathbf{v}_2', visible: false });
        const w1 = sp.vector(SW1.map(Number), { color: C.teal, visible: false });
        const w2 = sp.vector(SW2.map(Number), { color: C.orange, visible: false });
        const ws = sp.vector(SWS.map(Number), { color: C.green, width: 6, visible: false });
        const thm = s.defCard({
          kind: 'theorem', title: 'Theorem 1', x: 680, y: 142, width: 440, visible: false,
          body: 'If $\\mathbf{v}_1, \\dots, \\mathbf{v}_p$ are in $V$, then $\\operatorname{Span}\\{\\mathbf{v}_1, \\dots, \\mathbf{v}_p\\}$ is a subspace of $V$.',
        });
        const why = s.tex('(a\\mathbf{v}_1 + b\\mathbf{v}_2) + (c\\mathbf{v}_1 + d\\mathbf{v}_2)', { x: 680, y: 285, size: 30, visible: false });
        const why2 = s.tex('= \\col{green}{(a + c)\\mathbf{v}_1 + (b + d)\\mathbf{v}_2}', { x: 680, y: 330, size: 30, visible: false });
        const par = s.tex(
          `\\begin{bmatrix} a - 2b \\\\ b \\\\ a \\end{bmatrix} = a\\col{blue}{${texVec(SV1)}} + b\\col{red}{${texVec(SV2)}}`,
          { x: 680, y: 434, size: 30, visible: false },
        );
        const conc = s.tex('H = \\operatorname{Span}\\{\\col{blue}{\\mathbf{v}_1}, \\col{red}{\\mathbf{v}_2}\\}', { x: 680, y: 535, size: 32, color: C.green, visible: false });
        return { sp, P, v1, v2, w1, w2, ws, thm, why, why2, par, conc };
      },
      steps: [
        {
          say: 'Here\'s the most useful shortcut. The span of any vectors is a subspace. Picture the plane spanned by $\\mathbf{v}_1${v one} and $\\mathbf{v}_2${v two}.',
          do: async (s, o) => {
            await s.all(o.sp.draw(), o.thm.reveal());
            await s.all(o.v1.grow(), o.v2.grow({ delay: 150 }));
            await o.P.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'Take two combinations and add them. The coefficients just add, so the sum is another combination, and it stays in the plane. Scaling works the same way, and zero is the combination with zero weights.',
          do: async (s, o) => {
            await s.all(o.w1.grow(), o.w2.grow({ delay: 200 }));
            await o.why.write();
            await s.all(o.ws.grow(), o.why2.write());
          },
        },
        {
          say: 'So to show a set is a subspace, it\'s often fastest to write it as a span. The vectors $(a - 2b, b, a)${a minus two b, b, a} are exactly $a\\mathbf{v}_1 + b\\mathbf{v}_2${a v one plus b v two}, so that set is a subspace.',
          do: async (s, o) => {
            await o.par.write({ duration: 1200 });
            await o.conc.write();
          },
        },
      ],
    },

    // 6
    {
      id: 'nul-implicit',
      title: 'Null space: a condition',
      scene(s) {
        const W = s.tex('W = \\{(a, b, c) : \\col{blue}{a + b - c = 0},\\ \\col{red}{2a - b = 0}\\} = \\operatorname{Nul} A', { x: 480, y: 60, size: 32, visible: false });
        const mA = s.matrix(NA, { x: 255, y: 195, size: 36, visible: false });
        const lA = s.tex('A =', { x: 130, y: 195, size: 36, anchor: [1, 0.5], visible: false });
        const test = s.tex(`A${texVec(NU)} = ${texVec(NAU)}`, { x: 210, y: 370, size: 32, visible: false });
        const ok = s.text('$\\mathbf{u} \\in \\operatorname{Nul} A$', { x: 210, y: 470, size: 30, color: C.green, visible: false });
        const nul = s.tex(`\\operatorname{Nul} A = \\operatorname{Span}\\left\\{${texVec(NUL[0])}\\right\\}`, { x: 690, y: 500, size: 30, color: C.green, visible: false });
        const opT = s.tex(texRowOp(NA_RED.steps[0]), { x: 230, y: 290, size: 30, color: C.muted, visible: false });
        const gen = s.tex(`\\mathbf{x} = x_3${texVec(NA_NUL)}`, { x: 230, y: 410, size: 30, visible: false });
        const thm = s.defCard({
          kind: 'theorem', title: false, x: 245, y: 215, width: 420, visible: false,
          body: '**Theorem 2.** For any $m\\times n$ matrix $A$, $\\operatorname{Nul} A$ is a subspace of $\\mathbb{R}^n$.',
        });
        const sp = s.space({ x: 690, y: 318, size: 330, range: 3.5, yaw: -35, pitch: 18, visible: false });
        const p1 = sp.plane({ normal: NA[0].map(Number), d: 0 }, { color: C.blue, extent: 2, visible: false });
        const p2 = sp.plane({ normal: NA[1].map(Number), d: 0 }, { color: C.red, extent: 2, visible: false });
        const line = sp.line([0, 0, 0], NUL[0].map(Number), { color: C.green, width: 4, visible: false });
        const pt = sp.point(NU.map(Number), { color: C.green, label: '\\mathbf{u}', labelColor: C.green, visible: false });
        return { W, mA, lA, test, ok, nul, opT, gen, thm, sp, p1, p2, line, pt };
      },
      steps: [
        {
          say: 'The null space of $A${A} is defined implicitly: by equations its vectors must satisfy. Each equation here is a plane through the origin, and $\\operatorname{Nul} A${the null space of A} is where they meet.',
          do: async (s, o) => {
            await o.W.write({ duration: 1300 });
            await o.sp.draw();
            await s.all(o.p1.fadeIn({ shift: [0, 0] }), o.p2.fadeIn({ shift: [0, 0], delay: 300 }), o.mA.fadeIn(), o.lA.fadeIn());
          },
        },
        {
          say: 'Testing membership is easy: just multiply. $A${A} times $(1, 2, 3)${one, two, three} is zero, so that vector is in the null space.',
          do: async (s, o) => {
            await o.test.write();
            await s.all(o.ok.fadeIn(), o.pt.draw());
          },
        },
        {
          say: 'But to describe all of it explicitly, you have to row reduce. Two pivots, so $x_3${x three} is free, and the solutions are all multiples of one vector: the line spanned by $(1, 2, 3)${one, two, three}.',
          do: async (s, o) => {
            await s.all(o.test.fadeOut(), o.ok.fadeOut());
            await o.opT.fadeIn({ shift: [0, 0] });
            for (const [k, st] of NA_RED.steps.entries()) {
              if (k) await o.opT.swap(texRowOp(st), { duration: 300 });
              await o.mA.rowOp(st, { note: false });
            }
            await s.all(o.opT.fadeOut(), o.mA.pivot(0, 0), o.mA.pivot(1, 1));
            await o.gen.write();
            await o.gen.swap(`\\mathbf{x} = \\dfrac{x_3}{${t(NA_SCALE)}}${texVec(NUL[0])}`);
            await o.line.draw();
            await o.nul.write();
          },
        },
        {
          say: 'And that\'s no accident. Theorem 2: the null space of an $m${m} by $n${n} matrix is always a subspace of $\\mathbb{R}^n${R n}, because sums and multiples of solutions of $A\\mathbf{x} = \\mathbf{0}${A x equals zero} are solutions too.',
          do: async (s, o) => {
            await s.all(o.mA.fadeOut(), o.lA.fadeOut());
            await o.thm.reveal();
          },
        },
      ],
    },

    // 7
    {
      id: 'col-explicit',
      title: 'Column space: a recipe',
      scene(s) {
        const def = s.tex('\\operatorname{Col} A = \\{A\\mathbf{x} : \\mathbf{x} \\in \\mathbb{R}^2\\} = \\operatorname{Span}\\{\\col{blue}{\\mathbf{a}_1}, \\col{red}{\\mathbf{a}_2}\\}', { x: 480, y: 55, size: 32, visible: false });
        const member = s.tex(`A${texVec(CX)} = \\col{green}{${texVec(CAX)}}`, { x: 190, y: 200, size: 30, visible: false });
        const m = s.matrix(C_AUG, { x: 170, y: 400, size: 34, augment: 2, visible: false });
        for (const i of [0, 1, 2]) {
          m.cell(i, 0).style.color = C.blue;
          m.cell(i, 1).style.color = C.red;
        }
        const sp = s.space({ x: 690, y: 320, size: 340, range: 4, yaw: -40, pitch: 20, visible: false });
        const [c1, c2] = [0, 1].map((j) => CA.map((r) => Number(r[j])));
        const normal = [c1[1] * c2[2] - c1[2] * c2[1], c1[2] * c2[0] - c1[0] * c2[2], c1[0] * c2[1] - c1[1] * c2[0]];
        const P = sp.plane({ normal, d: 0 }, { color: C.green, extent: 3.8, visible: false });
        const a1 = sp.vector(CA.map((r) => Number(r[0])), { color: C.blue, label: '\\mathbf{a}_1', visible: false });
        const a2 = sp.vector(CA.map((r) => Number(r[1])), { color: C.red, label: '\\mathbf{a}_2', visible: false });
        const ax = sp.point(CAX.map(Number), { color: C.green, visible: false });
        const b = sp.vector(CB.map(Number), { color: C.yellow, label: '\\mathbf{b}', visible: false });
        // the drop from b to the plane: b sits off the plane by this much
        const nb = normal.reduce((acc, x, k) => acc + x * Number(CB[k]), 0) / normal.reduce((acc, x) => acc + x * x, 0);
        const foot = CB.map((x, k) => Number(x) - nb * normal[k]);
        const drop = sp.vector(normal.map((x) => nb * x), { tail: foot, color: C.yellow, width: 2, dash: '5 4', visible: false });
        const verdict = s.text('$\\mathbf{b} \\notin \\operatorname{Col} A$', { x: 170, y: 540, size: 30, color: C.yellow, visible: false });
        return { def, member, m, sp, P, a1, a2, ax, b, drop, verdict };
      },
      steps: [
        {
          say: 'The column space goes the other way. It\'s defined explicitly: everything of the form $A\\mathbf{x}${A x}, which is the span of the columns. Here, a plane in $\\mathbb{R}^3${R three}.',
          do: async (s, o) => {
            await o.def.write({ duration: 1200 });
            await o.sp.draw();
            await s.all(o.a1.grow(), o.a2.grow({ delay: 150 }));
            await o.P.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'Producing members is free: pick any $\\mathbf{x}${x} and multiply. But is $\\mathbf{b} = (1, 1, 1)${b equals one, one, one} in it? That costs a row reduction of $[A \\mid \\mathbf{b}]${A augmented with b}, and here the last row says zero equals a nonzero number.',
          do: async (s, o) => {
            await s.all(o.member.write(), o.ax.draw());
            await s.all(o.b.grow(), o.m.fadeIn());
            for (const st of C_FWD) await o.m.rowOp(st, { note: false });
            await o.m.highlightRow(C_BAD, C.yellow);
            await o.verdict.fadeIn();
          },
        },
        {
          say: 'That\'s the opposite of the null space. For $\\operatorname{Nul} A${the null space}, testing is easy and describing takes work; for $\\operatorname{Col} A${the column space}, describing is easy and testing takes work.',
          do: async (s, o) => {
            await s.all(o.b.flash({ color: C.yellow }), o.drop.grow(), o.sp.orbit(50, 4000));
            await o.def.indicate({ color: C.green });
          },
        },
      ],
    },

    // 8
    {
      id: 'contrast-table',
      title: 'Nul A vs Col A',
      scene(s) {
        const X = [150, 445, 765];
        const head = [
          s.text('$A$ is $m \\times n$', { x: X[0], y: 65, size: 30, color: C.muted, visible: false }),
          s.text('$\\operatorname{Nul} A$', { x: X[1], y: 65, size: 34, weight: 600, color: C.blue, visible: false }),
          s.text('$\\operatorname{Col} A$', { x: X[2], y: 65, size: 34, weight: 600, color: C.red, visible: false }),
        ];
        const rows = TABLE.map((cells, k) =>
          cells.map((str, j) => s.text(str, { x: X[j], y: 160 + 105 * k, size: 30, width: j ? 300 : 220, color: j ? C.ink : C.muted, visible: false })),
        );
        const rule = s.line(50, 105, 910, 105, { color: C.muted, width: 2, visible: false });
        const hl = s.rect(40, 120, 880, 80, { color: C.yellow, fill: soft(C.yellow, 18), radius: 12, visible: false });
        return { head, rows, rule, hl };
      },
      steps: [
        {
          say: 'Here are the two side by side, row by row: where each lives, how it\'s described, how you test a vector, and what it means when it\'s as small or as big as possible.',
          do: async (s, o) => {
            await s.all(o.head.map((h) => h.fadeIn()), o.rule.draw({ duration: 500 }));
            await s.stagger(o.rows.map((r) => () => s.all(r.map((c, j) => c.fadeIn({ delay: j * 150 })))), 1300);
          },
        },
        {
          say: 'Keep the first row straight; it\'s where most mistakes start. The null space is a subspace of $\\mathbb{R}^n${R n}, with as many entries as $A${A} has columns. The column space is a subspace of $\\mathbb{R}^m${R m}, with as many entries as $A${A} has rows.',
          do: async (s, o) => {
            await o.hl.fadeIn({ shift: [0, 0] });
            await s.all(o.rows[0][1].indicate({ color: C.blue }), o.rows[0][2].indicate({ color: C.red, delay: 400 }));
          },
        },
      ],
    },

    // 9
    {
      id: 'try-nul-col',
      kind: 'try',
      title: 'Your turn',
      say: 'Same matrix as before. Which statement is true?',
      prompt: `For $A = ${texMat(NA)}$, which statement is true?`,
      answer: { type: 'choice', value: 'c' },
      choices: [
        { id: 'a', label: '$(1, 2) \\in \\operatorname{Nul} A$', why: '$\\operatorname{Nul} A$ is in $\\mathbb{R}^3$; a vector with two entries can\'t be in it.' },
        { id: 'b', label: '$\\operatorname{Col} A$ is a plane in $\\mathbb{R}^3$', why: 'The columns have 2 entries: $\\operatorname{Col} A$ lives in $\\mathbb{R}^2$.' },
        { id: 'c', label: '$\\operatorname{Col} A = \\mathbb{R}^2$', why: `Right: ${NA_RANK} pivots in 2 rows, so the columns span $\\mathbb{R}^2$.` },
        { id: 'd', label: '$\\operatorname{Nul} A = \\{\\mathbf{0}\\}$', why: `3 columns and ${NA_RANK} pivots leave a free variable; $${ptTex(NUL[0])}$ is in it.` },
      ],
      hint: 'Find where each space lives first, then count pivots.',
      solution: [
        `$A$ is $2\\times 3$: $\\operatorname{Nul} A \\subseteq \\mathbb{R}^3$ and $\\operatorname{Col} A \\subseteq \\mathbb{R}^2$.`,
        `$A$ has ${NA_RANK} pivots, one in each row, so its columns span $\\mathbb{R}^2$: $\\operatorname{Col} A = \\mathbb{R}^2$. With 3 columns, one variable is free, so $\\operatorname{Nul} A = \\operatorname{Span}\\{${ptTex(NUL[0])}\\}$, not $\\{\\mathbf{0}\\}$.`,
      ],
    },

    // 10
    {
      id: 'kernel-range',
      title: 'Kernel and range',
      scene(s) {
        const dom = s.path('M 70 245 A 140 150 0 1 0 350 245 A 140 150 0 1 0 70 245 Z', { color: C.muted, width: 3, fill: soft(C.ink, 5), visible: false });
        const dLab = s.tex('\\mathbb{P}_2', { x: 210, y: 60, size: 36, visible: false });
        const items = T_ITEMS.map(({ c }, k) => s.tex(polyTex(c, { desc: true }), { x: 210, y: 165 + 80 * k, size: 34, color: k === 0 ? C.yellow : C.ink, visible: false }));
        const pl = s.plane({ x: 720, y: 245, width: 300, range: [-1, 2, -1, 2], names: null, visible: false });
        const fill = pl.polygon([[-1, -1], [2, -1], [2, 2], [-1, 2]], { color: C.green, fill: soft(C.green, 16), width: 0, visible: false });
        const pts = T_ITEMS.map(({ c, color }) => pl.point(TOF(c), { color, label: ptTex(TOF(c)), labelColor: color, visible: false }));
        const arrows = T_ITEMS.map(({ c }, k) => {
          const b = items[k].box();
          const [x, y] = pl.toStage(TOF(c));
          return s.arrow(b.x + b.w + 14, b.cy, x - 14, y, { color: k === 0 ? C.yellow : C.muted, width: 3, visible: false });
        });
        const def = s.tex('T(p) = \\big(p(0),\\ p(1)\\big)', { x: 720, y: 55, size: 32, visible: false });
        const lin = s.defCard({
          title: false, x: 480, y: 290, width: 860, size: 34, visible: false,
          body: 'A **linear transformation** $T: V \\to W$ satisfies $T(\\mathbf{u} + \\mathbf{v}) = T(\\mathbf{u}) + T(\\mathbf{v})$ and $T(c\\mathbf{u}) = cT(\\mathbf{u})$ for all $\\mathbf{u}, \\mathbf{v}$ in $V$ and all scalars $c$.',
        });
        const kr = s.tex('\\col{yellow}{\\ker T} = \\{p : T(p) = \\mathbf{0}\\},\\quad \\col{green}{\\operatorname{range} T} = \\{T(p)\\}', { x: 480, y: 545, size: 30, visible: false });
        return { dom, dLab, items, pl, fill, pts, arrows, def, lin, kr };
      },
      steps: [
        {
          say: 'Null and column spaces generalize to any linear map between vector spaces: one that respects sums and scalar multiples.',
          do: (s, o) => o.lin.reveal(),
        },
        {
          say: 'This $T${T} sends a polynomial to its values at zero and one. The kernel is everything that goes to zero; the range is everything that gets hit.',
          do: async (s, o) => {
            await o.lin.fadeOut();
            await s.all(o.dom.draw({ duration: 700 }), o.dLab.fadeIn(), o.pl.draw({ duration: 700 }), o.def.write());
            await s.all(o.items.map((m, k) => m.fadeIn({ delay: k * 150 })));
            for (let k = 0; k < 3; k++) await s.all(o.arrows[k].draw({ duration: 600 }), o.pts[k].draw({ delay: 400 }));
            await o.kr.write();
          },
        },
        {
          say: 'The constant $1${one} goes to $(1, 1)${one, one} and $t${t} goes to $(0, 1)${zero, one}. Those two outputs already span the plane, so the range is all of $\\mathbb{R}^2${R two}.',
          do: async (s, o) => {
            await s.all(o.pts[1].flash({ color: C.green }), o.pts[2].flash({ color: C.green, delay: 200 }));
            await o.fill.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'And $t^2 - t${t squared minus t} goes to zero: it vanishes at zero and at one. The kernel is all its multiples. For $T(\\mathbf{x}) = A\\mathbf{x}${T of x equals A x}, the kernel is $\\operatorname{Nul} A${the null space of A} and the range is $\\operatorname{Col} A${the column space of A}.',
          do: async (s, o) => {
            await s.all(o.items[0].indicate({ color: C.yellow }), o.pts[0].flash({ color: C.yellow }));
            await o.kr.swap('\\col{yellow}{\\ker T} = \\operatorname{Span}\\{t^2 - t\\},\\quad \\col{green}{\\operatorname{range} T} = \\mathbb{R}^2');
          },
        },
      ],
    },

    // 11
    {
      id: 'mistake-r2-r3',
      title: 'The trap: ℝ² inside ℝ³?',
      scene(s) {
        const claim = s.tex('\\mathbb{R}^2 \\subseteq \\mathbb{R}^3', { x: 720, y: 90, size: 40, color: C.yellow, visible: false });
        const v2 = s.tex('\\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix} \\in \\mathbb{R}^2', { x: 600, y: 210, size: 32, visible: false });
        const v3 = s.tex('\\begin{bmatrix} 1 \\\\ 2 \\\\ 0 \\end{bmatrix} \\in \\mathbb{R}^3', { x: 820, y: 210, size: 32, visible: false });
        const ne = s.tex('\\neq', { x: 710, y: 210, size: 36, color: C.yellow, visible: false });
        const H = s.tex('H = \\left\\{\\begin{bmatrix} s \\\\ t \\\\ 0 \\end{bmatrix} : s, t \\in \\mathbb{R}\\right\\}', { x: 720, y: 380, size: 32, color: C.green, visible: false });
        const Hn = s.text('a subspace of $\\mathbb{R}^3$ shaped like $\\mathbb{R}^2$', { x: 720, y: 500, size: 30, width: 380, color: C.green, visible: false });
        const sp = s.space({ x: 270, y: 320, size: 380, range: 3, yaw: -35, pitch: 24, visible: false });
        const P = sp.plane([1, 0, 0], [0, 1, 0], { color: C.green, extent: 2.4, visible: false });
        const w = sp.vector([1, 2, 0], { color: C.blue, label: '\\mathbf{w}', visible: false });
        return { claim, v2, v3, ne, H, Hn, sp, P, w };
      },
      steps: [
        {
          say: 'Here\'s the trap: saying $\\mathbb{R}^2${R two} is a subspace of $\\mathbb{R}^3${R three}. It isn\'t even a subset. A vector in $\\mathbb{R}^2${R two} has two entries, and a vector in $\\mathbb{R}^3${R three} has three; they live in different worlds.',
          do: async (s, o) => {
            await o.claim.write();
            await s.all(o.v2.fadeIn(), o.ne.fadeIn({ delay: 300 }), o.v3.fadeIn({ delay: 500 }));
            await s.strike(o.claim, { color: C.yellow });
          },
        },
        {
          say: 'What is true: the plane $x_3 = 0${x three equals zero} inside $\\mathbb{R}^3${R three} is a subspace, and it behaves just like $\\mathbb{R}^2${R two}. Same shape, different space.',
          do: async (s, o) => {
            await o.sp.draw();
            await o.P.fadeIn({ shift: [0, 0] });
            await o.w.grow();
            await o.H.write();
            await o.Hn.fadeIn();
          },
        },
      ],
    },

    // 12
    {
      id: 'wo-trace-proof',
      kind: 'workout',
      title: 'Work it out',
      say: 'A short proof. Write it out, checking each of the three conditions.',
      prompt: 'Prove that $H = \\{A \\in M_{2\\times 2} : a_{11} + a_{22} = 0\\}$ is a subspace of $M_{2\\times 2}$.',
      answer: { type: 'proof' },
      hints: [
        'Name the entries of two general members, $A = [a_{ij}]$ and $B = [b_{ij}]$, with $a_{11} + a_{22} = 0$ and $b_{11} + b_{22} = 0$.',
        'Check each of the three conditions with the defining equation $a_{11} + a_{22} = 0$.',
      ],
      rubric: [
        'Shows the zero matrix is in $H$ ($0 + 0 = 0$).',
        'Takes $A, B$ in $H$ and shows the diagonal sum of $A + B$ is $(a_{11} + b_{11}) + (a_{22} + b_{22}) = 0$.',
        'Takes $A$ in $H$ and a scalar $c$ and shows $ca_{11} + ca_{22} = c(a_{11} + a_{22}) = 0$.',
        'Optionally writes $H = \\operatorname{Span}\\left\\{\\begin{bmatrix}1&0\\\\0&-1\\end{bmatrix}, \\begin{bmatrix}0&1\\\\0&0\\end{bmatrix}, \\begin{bmatrix}0&0\\\\1&0\\end{bmatrix}\\right\\}$ and cites Theorem 1.',
      ],
      solution: [
        '**Zero.** The zero matrix has $0 + 0 = 0$ on its diagonal, so $0 \\in H$.',
        '**Sums.** Let $A, B \\in H$, so $a_{11} + a_{22} = 0$ and $b_{11} + b_{22} = 0$. The diagonal of $A + B$ gives $(a_{11} + b_{11}) + (a_{22} + b_{22}) = (a_{11} + a_{22}) + (b_{11} + b_{22}) = 0 + 0 = 0$, so $A + B \\in H$.',
        '**Multiples.** For $A \\in H$ and a scalar $c$: $ca_{11} + ca_{22} = c(a_{11} + a_{22}) = c \\cdot 0 = 0$, so $cA \\in H$. All three conditions hold: $H$ is a subspace.',
        'Alternatively, every member is $a\\begin{bmatrix}1&0\\\\0&-1\\end{bmatrix} + b\\begin{bmatrix}0&1\\\\0&0\\end{bmatrix} + c\\begin{bmatrix}0&0\\\\1&0\\end{bmatrix}$, so $H$ is a span, and Theorem 1 makes it a subspace.',
      ],
    },

    // 13
    {
      id: 'wo-nul-member',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Find a vector that spans this null space, then check it by multiplying.',
      prompt: WO_NUL.prompt,
      answer: WO_NUL.answer,
      hints: WO_NUL.hints,
      solution: WO_NUL.solution,
      generate: generateNul,
    },

    // 14
    {
      id: 'cp-nul-col',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain this in your own words.',
      prompt: 'Explain the difference between $\\operatorname{Nul} A$ and $\\operatorname{Col} A$ for a $3\\times 5$ matrix $A$: where each lives, how it\'s described, and how you test whether a vector belongs to it.',
      points: [
        '$\\operatorname{Nul} A$ is a subspace of $\\mathbb{R}^5$; $\\operatorname{Col} A$ is a subspace of $\\mathbb{R}^3$',
        '$\\operatorname{Nul} A$ is implicit (the solutions of $A\\mathbf{x} = \\mathbf{0}$); $\\operatorname{Col} A$ is explicit (all $A\\mathbf{x}$, the span of the columns)',
        'Test $\\mathbf{v} \\in \\operatorname{Nul} A$ by computing $A\\mathbf{v}$ and seeing whether it is $\\mathbf{0}$',
        'Test $\\mathbf{b} \\in \\operatorname{Col} A$ by checking whether $[A \\mid \\mathbf{b}]$ is consistent (a row reduction)',
        'Both are subspaces',
      ],
    },

    // 15
    {
      id: 'summary-vs',
      title: 'Summary',
      scene(s) {
        const pa = s.plane({ x: 290, y: 120, width: 160, range: [-0.5, 3.5, -0.5, 2.5], labels: false, grid: false, visible: false });
        const aw = pa.vector(AR_S, { color: C.blue, width: 4, visible: false });
        const pp = s.plane({ x: 480, y: 120, width: 150, height: 120, range: [-1, 2, -2, 4], labels: false, grid: false, visible: false });
        const curve = s.path(curveD(pp, (x) => polyAt(PS, x), [-1, 2]), { color: C.green, width: 4, visible: false });
        const mm = s.matrix(MS, { x: 670, y: 120, size: 30, visible: false });
        const one = s.text('Vectors: anything you can add and scale', { x: 480, y: 235, size: 30, visible: false });
        const two = s.text('Subspaces: three checks, or write it as a span', { x: 480, y: 315, size: 30, visible: false });
        const tab = [
          s.text('$\\operatorname{Nul} A$', { x: 330, y: 465, size: 32, weight: 600, color: C.blue, visible: false }),
          s.text('$\\operatorname{Col} A$', { x: 630, y: 465, size: 32, weight: 600, color: C.red, visible: false }),
          s.text('in $\\mathbb{R}^n$, a condition', { x: 330, y: 520, size: 30, visible: false }),
          s.text('in $\\mathbb{R}^m$, a span', { x: 630, y: 520, size: 30, visible: false }),
        ];
        const three = s.text('Every matrix gives two subspaces:', { x: 480, y: 400, size: 30, color: C.muted, visible: false });
        return { pa, aw, pp, curve, mm, one, two, tab, three };
      },
      steps: [
        {
          say: 'Vectors are anything you can add and scale: arrows, polynomials, matrices, functions.',
          do: async (s, o) => {
            await s.all(o.pa.fadeIn(), o.aw.grow(), o.pp.fadeIn({ delay: 200 }), o.curve.draw({ delay: 300 }), o.mm.fadeIn({ delay: 500 }));
            await o.one.fadeIn();
          },
        },
        {
          say: 'A subset is a subspace if it passes the three checks, or if you can write it as a span.',
          do: (s, o) => o.two.fadeIn(),
        },
        {
          say: 'And every matrix gives two of them: the null space, a condition in $\\mathbb{R}^n${R n}, and the column space, a span in $\\mathbb{R}^m${R m}.',
          do: async (s, o) => {
            await o.three.fadeIn();
            await s.all(o.tab.map((m, k) => m.fadeIn({ delay: k * 200 })));
          },
        },
      ],
    },
  ],
};
