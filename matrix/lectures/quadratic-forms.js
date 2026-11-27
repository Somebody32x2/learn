/**
 * Lecture 28 · Quadratic forms (Lay 7.2). Design: matrix/PLAN.md § 28.
 * Every matrix, eigenvalue, eigenvector and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, dot, mulVec, rationalEigen, eigenspace, texMat, texVec } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
const nums = (v) => v.map(Number);
const X = ['x_1', 'x_2', 'x_3'];

/** Integer multiple of an eigenvector (clears denominators). */
function intVec(v) {
  const g = (a, b) => (b ? g(b, a % b) : a);
  const l = v.reduce((m, x) => (m * x.d) / g(m, x.d), 1n);
  return v.map((x) => x.mul(F(l)));
}
/** Eigen-pairs (descending), eigenvectors as integer vectors. */
const eig = (A) => rationalEigen(A).map(({ value }) => ({ value, v: intVec(eigenspace(A, value)[0]) }));

/** Q from a symmetric matrix: squares first, then cross terms x_i x_j (i < j) with coefficient 2a_ij. */
function qTex(A0) {
  const A = mat(A0);
  const n = A.length;
  const terms = [];
  if (n === 2) terms.push([A[0][0], 'x_1^2'], [A[0][1].mul(F(2)), 'x_1x_2'], [A[1][1], 'x_2^2']);
  else {
    for (let i = 0; i < n; i++) terms.push([A[i][i], `${X[i]}^2`]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) terms.push([A[i][j].mul(F(2)), `${X[i]}${X[j]}`]);
  }
  let out = '';
  for (const [c, name] of terms) {
    if (c.zero) continue;
    const a = c.abs();
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + name;
  }
  return out || '0';
}
const qAt = (A, x) => dot(vec(x), mulVec(mat(A), vec(x)));

/** Beat 2 / 4 / 12: the running example. */
const A2 = mat([[5, 2], [2, 2]]);
const E2 = eig(A2); // 6 → (2,1), 1 → (-1,2) up to sign
const [L1, L2] = E2.map((e) => e.value);
const V1 = E2[0].v;
// second eigenvector oriented so [v1 v2] is a rotation (det > 0)
const V2 = (() => {
  const v = E2[1].v;
  return V1[0].mul(v[1]).sub(V1[1].mul(v[0])).sign() > 0 ? v : v.map((x) => x.neg());
})();
const N5 = Number(dot(V1, V1));
const LEVEL = L1; // Q(x) = 6

/** Beat 3 blanks. */
const BL = mat([[1, -3], [-3, 4]]);

/** Beat 5 try. */
const TN = mat([[1, 2], [2, 1]]);
const TN_E = eig(TN).map((e) => e.value);

/** Beat 7 trap (same matrix as beat 5). */
const TRAP_X = [1, -1];
const TRAP_Q = qAt(TN, TRAP_X);

/** Beat 8 try. */
const TC = mat([[3, 1], [1, 3]]);
const TC_E = eig(TC).map((e) => e.value);

/** Beat 10 workout. */
const WP = mat([[1, -3], [-3, 1]]);
const WP_E = eig(WP);

// ---------------------------------------------------------------- numeric geometry (drawing only)

/** Eigen-decomposition of a symmetric 2 × 2 (numbers), λ1 ≥ λ2, u2 = u1 turned 90°. */
function eigSym2(A0) {
  const [[a, b], [, d]] = A0.map(nums);
  const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  const l1 = m + r, l2 = m - r;
  const th = 0.5 * Math.atan2(2 * b, a - d);
  const u1 = [Math.cos(th), Math.sin(th)];
  return { l1, l2, u1, u2: [-u1[1], u1[0]] };
}
const comb = (e, y1, y2) => [y1 * e.u1[0] + y2 * e.u2[0], y1 * e.u1[1] + y2 * e.u2[1]];
/** Level curve Q = c of a positive definite form, as model points (closed). */
function ellipsePts(A0, c, n = 96) {
  const e = eigSym2(A0);
  return Array.from({ length: n }, (_, k) => {
    const q = (2 * Math.PI * k) / n;
    return comb(e, Math.sqrt(c / e.l1) * Math.cos(q), Math.sqrt(c / e.l2) * Math.sin(q));
  });
}
/** Branches of the level curve Q = c of an indefinite form (λ1 > 0 > λ2), as model point lists, kept inside |x| ≤ R. */
function hyperbola(A0, c, R) {
  const e = eigSym2(A0);
  const out = [];
  for (const s of [1, -1]) {
    const pts = [];
    for (let k = -60; k <= 60; k++) {
      const u = (k / 60) * 3.2;
      const p = c > 0 ? comb(e, s * Math.sqrt(c / e.l1) * Math.cosh(u), Math.sqrt(c / -e.l2) * Math.sinh(u)) : comb(e, Math.sqrt(-c / e.l1) * Math.sinh(u), s * Math.sqrt(-c / -e.l2) * Math.cosh(u));
      if (Math.abs(p[0]) <= R && Math.abs(p[1]) <= R) pts.push(p);
    }
    out.push(pts);
  }
  return out;
}
const pathOn = (p, pts) => `M ${pts.map((q) => p.toStage(q).join(' ')).join(' L ')}`;

/** A wireframe of z = f(a, b) over [−1, 1]², projected (yaw −35°, pitch 25°), as one SVG path in stage coordinates. */
function surfacePath(cx, cy, size, f) {
  const yaw = (-35 * Math.PI) / 180, pitch = (25 * Math.PI) / 180;
  const P = (a, b) => {
    const Xs = a * Math.cos(yaw) - b * Math.sin(yaw);
    const Y = a * Math.sin(yaw) + b * Math.cos(yaw);
    return [cx + size * Xs, cy - size * (f(a, b) * Math.cos(pitch) + Y * Math.sin(pitch))];
  };
  let d = '';
  for (let i = 0; i <= 8; i++) {
    const g = -1 + i / 4;
    for (const dir of [0, 1]) {
      const pts = Array.from({ length: 25 }, (_, k) => {
        const s = -1 + k / 12;
        return dir ? P(g, s) : P(s, g);
      });
      d += `M ${pts.map((q) => q.map((v) => v.toFixed(1)).join(' ')).join(' L ')} `;
    }
  }
  return d;
}

function paint(tex, name, color) {
  for (const e of tex.part(name)) e.style.color = color;
  return tex;
}
function sqrtTex(n) {
  let k = Math.floor(Math.sqrt(n));
  while (n % (k * k)) k--;
  const m = n / (k * k);
  return m === 1 ? `${k}` : `${k === 1 ? '' : k}\\sqrt{${m}}`;
}
const coef = (a) => (F(a).eq(1) ? '' : t(a));
const rowTex = (v) => `(${v.map(t).join(', ')})`;
const P_TEX = `\\frac{1}{${sqrtTex(N5)}}${texMat([[V1[0], V2[0]], [V1[1], V2[1]]])}`;
const PT_NUM = (() => {
  const e = [V1, V2].map((v) => nums(v).map((x) => x / Math.sqrt(N5)));
  return [e[0], e[1]]; // rows of Pᵀ are the unit eigenvectors
})();

/** Beats 4 and 12: the tilted ellipse Q(x) = 6 with its principal axes. */
function axesScene(s, { x = 665, width = 420, visible = false } = {}) {
  const p = s.plane({ x, y: 300, width, range: [-3, 3, -3, 3], names: ['x_1', 'x_2'], visible });
  const ell = p.polygon(ellipsePts(A2, Number(LEVEL)), { color: C.blue, visible });
  const us = [V1, V2].map((v, k) => p.vector(nums(v).map((c) => c / Math.sqrt(N5)), { color: C.purple, label: `\\mathbf{u}_${k + 1}`, labelSize: 32, visible: false }));
  const spans = [V1, V2].map((v) => p.span(nums(v), { color: C.purple, dash: '8 6', width: 2.5, visible: false }));
  const yl = [
    p.label([2.75, 0.35], 'y_1', { color: C.purple, size: 32, transform: false, visible: false }),
    p.label([0.4, 2.75], 'y_2', { color: C.purple, size: 32, transform: false, visible: false }),
  ];
  return { p, ell, us, spans, yl };
}

// ---------------------------------------------------------------- workouts

/** wo-q-matrix: the matrix of a quadratic form in three variables. */
function qMatrixItem(A0) {
  const A = mat(A0);
  const x = [1, -1, 2];
  const val = qAt(A, x);
  const cross = [[0, 1], [0, 2], [1, 2]].filter(([i, j]) => !A[i][j].zero);
  const missing = [[0, 1], [0, 2], [1, 2]].filter(([i, j]) => A[i][j].zero).map(([i, j]) => `$${X[i]}${X[j]}$`);
  return {
    prompt: `Find the (symmetric) matrix $A$ of the quadratic form $$Q(\\mathbf{x}) = ${qTex(A)}$$ so that $Q(\\mathbf{x}) = \\mathbf{x}^TA\\mathbf{x}$.`,
    answer: { type: 'matrix', value: A.map((r) => r.map(String)) },
    hints: [
      `The diagonal holds the coefficients of the squares: $${A.map((r, i) => t(r[i])).join(', ')}$.`,
      `Halve each cross coefficient and put one half in position $(i, j)$, the other in $(j, i)$.${missing.length ? ` There is no ${missing.join(' or ')} term, so those entries are $0$.` : ''}`,
    ],
    solution: [
      `Squares go on the diagonal: $a_{11} = ${t(A[0][0])}$, $a_{22} = ${t(A[1][1])}$, $a_{33} = ${t(A[2][2])}$.`,
      cross.length
        ? `Each cross term $c\\,x_ix_j$ splits as $a_{ij} = a_{ji} = c/2$: ${cross.map(([i, j]) => `$${t(A[i][j].mul(F(2)))}${X[i]}${X[j]} \\to a_{${i + 1}${j + 1}} = a_{${j + 1}${i + 1}} = ${t(A[i][j])}$`).join(', ')}.`
        : 'There are no cross terms, so every off-diagonal entry is $0$.',
      `So $A = ${texMat(A)}$.`,
      `Check with $\\mathbf{x} = (1, -1, 2)$: substituting into $Q$ gives $${t(val)}$, and $\\mathbf{x}^TA\\mathbf{x} = ${t(val)}$ too.`,
    ],
  };
}
const WO_Q = qMatrixItem([[3, 2, 0], [2, 2, -3], [0, -3, -1]]);

/** Random symmetric 3 × 3 with small entries; cross coefficients any integer in [−6, 6] (so halves can appear). */
function generateQ(rand) {
  for (;;) {
    const d = [0, 1, 2].map(() => rand.nonzero(-5, 5));
    const c = [0, 1, 2].map(() => rand.int(-6, 6));
    if (c.filter((v) => v !== 0).length < 2) continue;
    const h = c.map((v) => F(v, 2));
    const A = [[F(d[0]), h[0], h[1]], [h[0], F(d[1]), h[2]], [h[1], h[2], F(d[2])]];
    return qMatrixItem(A);
  }
}

const WO_P = {
  prompt: 'Make a change of variable $\\mathbf{x} = P\\mathbf{y}$ that removes the cross-product term from $Q(\\mathbf{x}) = ' + qTex(WP) + '$, and classify $Q$. Enter the new coefficients $(c_1, c_2)$ of $c_1y_1^2 + c_2y_2^2$ with $c_1 \\ge c_2$.',
  answer: { type: 'vector', value: WP_E.map((e) => String(e.value)) },
  hints: [`The matrix of $Q$ is $A = ${texMat(WP)}$.`, `Its trace is $${t(WP[0][0].add(WP[1][1]))}$ and its determinant $${t(WP[0][0].mul(WP[1][1]).sub(WP[0][1].mul(WP[1][0])))}$: which two numbers have that sum and product?`],
  solution: [
    `$A = ${texMat(WP)}$ has eigenvalues $${WP_E.map((e) => t(e.value)).join('$ and $')}$, with eigenvectors $${rowTex(WP_E[0].v)}$ and $${rowTex(WP_E[1].v)}$.`,
    `Normalize them into $P = \\frac{1}{${sqrtTex(Number(dot(WP_E[0].v, WP_E[0].v)))}}${texMat([[WP_E[0].v[0], WP_E[1].v[0]], [WP_E[0].v[1], WP_E[1].v[1]]])}$, an orthogonal matrix, and set $\\mathbf{x} = P\\mathbf{y}$.`,
    `Then $Q = \\mathbf{y}^TD\\mathbf{y} = ${t(WP_E[0].value)}y_1^2 ${WP_E[1].value.sign() < 0 ? '-' : '+'} ${t(WP_E[1].value.abs())}y_2^2$. One eigenvalue is positive and one negative, so $Q$ is **indefinite**.`,
  ],
};

// ---------------------------------------------------------------- the lecture

export default {
  id: 'quadratic-forms',
  title: 'Quadratic forms',
  goals: [
    'Write a quadratic form as $Q(\\mathbf{x}) = \\mathbf{x}^TA\\mathbf{x}$ with $A$ symmetric',
    'Remove the cross terms with a change of variable $\\mathbf{x} = P\\mathbf{y}$ (the Principal Axes Theorem)',
    'Classify a quadratic form as positive definite, negative definite or indefinite from the eigenvalues of $A$',
  ],
  beats: [
    // 1
    {
      id: 'surfaces',
      title: 'Three shapes of quadratic forms',
      scene(s) {
        const head = s.tex('Q(x_1, x_2) = a\\,x_1^2 + \\part{b}{b\\,x_1x_2} + c\\,x_2^2', { x: 480, y: 60, size: 40, visible: false });
        const R = 3;
        const panels = [185, 480, 775].map((x) => s.plane({ x, y: 270, width: 260, range: [-R, R, -R, R], labels: false, visible: false }));
        const ELL = mat([[3, 0], [0, 7]]);
        const HYP = mat([[3, 0], [0, -7]]);
        const levels = [1.5, 4, 7.5];
        const ells = levels.map((c) => panels[0].polygon(ellipsePts(ELL, c), { color: C.blue, fill: 'none', visible: false }));
        const tilt = levels.map((c) => ellipsePts(A2, c));
        const hyps = [3, 12, -3, -12].flatMap((c) => hyperbola(HYP, c, R).map((pts) => s.path(pathOn(panels[1], pts), { color: c > 0 ? C.red : C.orange, width: 3, visible: false })));
        const lines = [-2, -1, 1, 2].map((k) => {
          const [a, b] = [panels[2].toStage([k, -R]), panels[2].toStage([k, R])];
          return s.line(a[0], a[1], b[0], b[1], { color: C.teal, width: 3, visible: false });
        });
        const labs = ['3x_1^2 + 7x_2^2', '3x_1^2 - 7x_2^2', 'x_1^2'].map((tx, i) => s.tex(tx, { x: [185, 480, 775][i], y: 445, size: 30, visible: false }));
        const kinds = ['ellipses', 'hyperbolas', 'pairs of lines'].map((tx, i) => s.text(tx, { x: [185, 480, 775][i], y: 500, size: 30, color: C.muted, visible: false }));
        return { head, panels, ells, tilt, hyps, lines, labs, kinds };
      },
      steps: [
        {
          say: 'A quadratic form is a sum of degree-two terms: squares like $x_1^2${x one squared}, and cross terms like $x_1x_2${x one x two}. No linear terms, no constants.',
          do: async (s, o) => {
            await o.head.write({ duration: 1200 });
            await s.all(o.panels.map((p) => p.draw({ duration: 800 })));
          },
        },
        {
          say: 'With no cross term, the level curves line up with the axes: ellipses when both coefficients are positive, hyperbolas when the signs differ, and lines when a coefficient is zero.',
          do: async (s, o) => {
            await s.all(o.labs[0].write(), o.ells.map((e, k) => e.draw({ delay: k * 200 })), o.kinds[0].fadeIn({ delay: 300 }));
            await s.all(o.labs[1].write(), o.hyps.map((h) => h.draw()), o.kinds[1].fadeIn({ delay: 300 }));
            await s.all(o.labs[2].write(), o.lines.map((l) => l.draw()), o.kinds[2].fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'A cross term tilts the picture. Today\'s goal: find the tilted axes, and turn them back.',
          do: async (s, o) => {
            await o.head.color('b', C.yellow);
            await s.all(o.labs[0].swap('5x_1^2 + \\part{b}{4x_1x_2} + 2x_2^2'), o.ells.map((e, k) => e.morphTo(o.tilt[k], { duration: 1400 })));
            await o.labs[0].color('b', C.yellow);
          },
        },
      ],
    },

    // 2
    {
      id: 'matrix-of-q',
      title: 'The matrix of a quadratic form',
      scene(s) {
        const q = s.tex(`Q(\\mathbf{x}) = \\part{a}{${t(A2[0][0])}}x_1^2 + \\part{b}{${t(A2[0][1].mul(F(2)))}}x_1x_2 + \\part{c}{${t(A2[1][1])}}x_2^2`, { x: 480, y: 90, size: 48, visible: false });
        const aEq = s.tex('A =', { x: 315, y: 270, size: 48, visible: false });
        const m = s.matrix(A2, { x: 480, y: 270, size: 52, visible: false });
        const sym = s.tex('A^T = A', { x: 740, y: 270, size: 40, color: C.green, visible: false });
        const half = s.tex('\\div 2', { x: 640, y: 175, size: 34, color: C.yellow, visible: false });
        const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];
        const fly = (part, txt) => {
          const [x, y] = center(q.partBox(part));
          return s.tex(txt, { x, y, size: 48, visible: false });
        };
        const nA = fly('a', t(A2[0][0]));
        const nC = fly('c', t(A2[1][1]));
        const nB = fly('b', t(A2[0][1].mul(F(2))));
        const halves = [0, 1].map(() => s.tex(t(A2[0][1]), { x: 480, y: 270, size: 52, color: C.yellow, visible: false }));
        const exp = s.tex(`\\mathbf{x}^TA\\mathbf{x} = ${t(A2[0][0])}x_1^2 + \\part{h1}{${t(A2[0][1])}x_1x_2} + \\part{h2}{${t(A2[1][0])}x_2x_1} + ${t(A2[1][1])}x_2^2`, { x: 480, y: 425, size: 38, visible: false });
        const back = s.tex(`= ${qTex(A2)} = Q(\\mathbf{x})`, { x: 480, y: 505, size: 38, color: C.green, visible: false });
        return { q, aEq, m, sym, half, nA, nB, nC, halves, exp, back };
      },
      steps: [
        {
          say: 'Every quadratic form is $\\mathbf{x}^TA\\mathbf{x}${x transpose A x} for a symmetric matrix $A${A}. The squared terms go on the diagonal: $5${five} in position one one, $2${two} in position two two.',
          do: async (s, o) => {
            await o.q.write({ duration: 1200 });
            await o.aEq.fadeIn();
            for (const [mob, i] of [[o.nA, 0], [o.nC, 1]]) {
              const b = o.m.cellBox(i, i);
              mob.show();
              await mob.moveTo(b.cx, b.cy, { duration: 900 });
            }
          },
        },
        {
          say: 'The cross term $4x_1x_2${four x one x two} is split in half: $2${two} goes in position one two and $2${two} in position two one.',
          do: async (s, o) => {
            o.nB.show();
            await s.all(o.nB.moveTo(480, 270, { duration: 900 }), o.nB.recolor(C.yellow), o.half.fadeIn({ delay: 400 }));
            o.halves.forEach((h) => h.show());
            o.nB.hide();
            await s.all([[0, 1], [1, 0]].map(([i, j], k) => {
              const b = o.m.cellBox(i, j);
              return o.halves[k].moveTo(b.cx, b.cy, { duration: 900 });
            }));
            await s.all(o.m.fadeIn({ shift: [0, 0], duration: 400 }), [o.nA, o.nC, ...o.halves].map((n) => n.fadeOut({ duration: 400 })), o.half.fadeOut());
            await s.all(o.m.highlightCell(0, 1, C.yellow), o.m.highlightCell(1, 0, C.yellow));
          },
        },
        {
          say: 'Splitting evenly makes $A${A} symmetric. Check by multiplying out: the two off-diagonal entries each give $2x_1x_2${two x one x two}, and together they give back $4x_1x_2${four x one x two}.',
          do: async (s, o) => {
            await o.sym.fadeIn({ shift: [-16, 0] });
            await o.exp.write({ duration: 1300 });
            await s.all(o.exp.color('h1', C.yellow), o.exp.color('h2', C.yellow));
            await o.back.write();
          },
        },
      ],
    },

    // 3
    {
      id: 'fill-q-matrix',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Now you build one. Watch the sign of the cross term.',
      prompt: `Find the symmetric matrix $A$ with $\\mathbf{x}^TA\\mathbf{x} = ${qTex(BL)}$.`,
      lines: [
        [
          'A = ',
          {
            matrix: [
              [t(BL[0][0]), { id: 'a12', answer: { type: 'number', value: String(BL[0][1]) } }],
              [{ id: 'a21', answer: { type: 'number', value: String(BL[1][0]) } }, { id: 'a22', answer: { type: 'number', value: String(BL[1][1]) } }],
            ],
          },
        ],
      ],
      solution: [
        `The squares give the diagonal: $a_{11} = ${t(BL[0][0])}$, $a_{22} = ${t(BL[1][1])}$.`,
        `The cross coefficient $${t(BL[0][1].mul(F(2)))}$ is split in half: $a_{12} = a_{21} = ${t(BL[0][1])}$. So $A = ${texMat(BL)}$.`,
      ],
    },

    // 4
    {
      id: 'principal-axes',
      title: 'Rotate the cross term away',
      scene(s) {
        const ax = axesScene(s);
        const lx = 225;
        const aT = s.tex(`A = ${texMat(A2)} = PDP^T`, { x: lx, y: 85, size: 32, visible: false });
        const pT = s.tex(`P = ${P_TEX}`, { x: lx, y: 185, size: 32, color: C.purple, visible: false });
        const dT = s.tex(`D = ${texMat([[L1, F(0)], [F(0), L2]])}`, { x: lx, y: 280, size: 32, color: C.purple, visible: false });
        const sub1 = s.tex('\\mathbf{x}^TA\\mathbf{x} = \\mathbf{y}^T(P^TAP)\\mathbf{y}', { x: lx, y: 365, size: 30, visible: false });
        const sub2 = s.tex('= \\mathbf{y}^TD\\mathbf{y}', { x: lx, y: 420, size: 30, visible: false });
        const res = s.tex(`Q = ${t(L1)}y_1^2 + ${L2.eq(1) ? '' : t(L2)}y_2^2`, { x: lx, y: 510, size: 40, color: C.green, visible: false });
        const qlab = s.tex(`Q(\\mathbf{x}) = ${t(LEVEL)}`, { x: 800, y: 548, size: 32, color: C.blue, visible: false });
        const pat = s.defCard({ kind: 'theorem', title: 'The Principal Axes Theorem', body: 'If $A$ is symmetric, an orthogonal change of variable $\\mathbf{x} = P\\mathbf{y}$ turns $\\mathbf{x}^TA\\mathbf{x}$ into $\\mathbf{y}^TD\\mathbf{y}$, with no cross-product term.', x: lx, y: 270, width: 400, size: 30, visible: false });
        return { ...ax, aT, pT, dT, sub1, sub2, res, qlab, pat };
      },
      steps: [
        {
          say: 'Here is the level curve $Q(\\mathbf{x}) = 6${Q of x equals six}: a tilted ellipse. $A${A} is symmetric, so $A = PDP^T${A equals P D P transpose}, and its unit eigenvectors point along the ellipse\'s axes.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 900 }), o.aT.write());
            await s.all(o.ell.draw(), o.qlab.fadeIn());
            await s.all(o.spans.map((l) => l.draw()), o.us.map((u) => u.grow({ delay: 300 })));
            await s.all(o.pT.write(), o.dT.write({ delay: 500 }));
          },
        },
        {
          say: 'Substitute $\\mathbf{x} = P\\mathbf{y}${x equals P y}. Geometrically that turns the plane until the eigenvectors lie on the axes, and algebraically $\\mathbf{x}^TA\\mathbf{x}${x transpose A x} becomes $\\mathbf{y}^TD\\mathbf{y}${y transpose D y}.',
          do: async (s, o) => {
            await o.sub1.write();
            await s.all(o.p.applyMatrix(PT_NUM, { duration: 2000 }), o.sub2.write({ delay: 600 }));
            await s.all(o.yl.map((l) => l.draw()));
          },
        },
        {
          say: 'D is diagonal, so there is no cross term: $Q = 6y_1^2 + y_2^2${Q equals six y one squared plus y two squared}. The columns of $P${P}, the eigenvectors, are the principal axes.',
          do: async (s, o) => {
            await o.res.write();
            await s.all(o.ell.indicate({ color: C.green }), o.us.map((u) => u.indicate()));
          },
        },
        {
          say: 'That works for every symmetric matrix. It\'s the Principal Axes Theorem: an orthogonal change of variable always removes the cross-product terms.',
          do: async (s, o) => {
            await s.all([o.aT, o.pT, o.dT, o.sub1, o.sub2].map((m) => m.fadeOut()));
            await o.pat.reveal();
          },
        },
      ],
    },

    // 5
    {
      id: 'try-new-form',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. No need to find P: think about what ends up on the diagonal.',
      prompt: `After the change of variable $\\mathbf{x} = P\\mathbf{y}$ with an orthonormal eigenvector matrix $P$ (larger coefficient first), $Q(\\mathbf{x}) = ${qTex(TN)}$ becomes:`,
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: '$y_1^2 + y_2^2$', why: 'The diagonal entries of $A$ aren\'t its eigenvalues.' },
        { id: 'b', label: `$${t(TN_E[0])}y_1^2 - ${coef(TN_E[1].abs())}y_2^2$`, why: `Right: the new coefficients are the eigenvalues of $A = ${texMat(TN)}$, which are $${TN_E.map(t).join('$ and $')}$.` },
        { id: 'c', label: '$5y_1^2 + y_2^2$', why: `Those aren't the eigenvalues of $${texMat(TN)}$; its eigenvalues are $${TN_E.map(t).join('$ and $')}$.` },
      ],
      hint: 'The new coefficients are the eigenvalues of $A$. Use the trace and the determinant.',
      solution: [
        `The matrix of $Q$ is $A = ${texMat(TN)}$ (the cross coefficient $4$ splits as $2$ and $2$).`,
        `Trace $2$, determinant $1 - 4 = -3$, so the eigenvalues solve $\\lambda^2 - 2\\lambda - 3 = 0$: $\\lambda = ${TN_E.map(t).join(', ')}$.`,
        `With $\\mathbf{x} = P\\mathbf{y}$, $Q = \\mathbf{y}^TD\\mathbf{y} = ${t(TN_E[0])}y_1^2 - ${coef(TN_E[1].abs())}y_2^2$.`,
      ],
    },

    // 6
    {
      id: 'classify',
      title: 'Classifying by eigenvalues (Theorem 5)',
      scene(s) {
        const head = s.tex('Q = \\lambda_1y_1^2 + \\lambda_2y_2^2 + \\cdots + \\lambda_ny_n^2', { x: 480, y: 60, size: 40, visible: false });
        const def = s.text('**Positive definite:** $Q(\\mathbf{x}) > 0$ for every $\\mathbf{x} \\neq \\mathbf{0}$.', { x: 480, y: 118, size: 30, color: C.purple, visible: false });
        const k = 0.28;
        const surf = [
          [(a, b) => k * (3 * a * a + b * b), C.blue],
          [(a, b) => -k * (3 * a * a + b * b), C.red],
          [(a, b) => k * (3 * a * a - b * b), C.orange],
        ].map(([f, c], i) => s.path(surfacePath([170, 480, 790][i], 285, 78, f), { color: c, width: 2, visible: false }));
        const conds = ['\\text{all } \\lambda_i > 0', '\\text{all } \\lambda_i < 0', '\\text{mixed signs}'].map((tx, i) => s.tex(tx, { x: [170, 480, 790][i], y: 415, size: 32, visible: false }));
        const names = ['positive definite', 'negative definite', 'indefinite'].map((tx, i) => s.text(tx, { x: [170, 480, 790][i], y: 460, size: 30, color: [C.blue, C.red, C.orange][i], weight: 600, visible: false }));
        const semi = s.text('Some $\\lambda_i = 0$, the rest $\\ge 0$ (or all $\\le 0$): positive (negative) **semidefinite**. Both signs: indefinite.', { x: 480, y: 535, size: 30, width: 860, color: C.muted, visible: false });
        return { head, def, surf, conds, names, semi };
      },
      steps: [
        {
          say: 'In the new variables, $Q${Q} is a weighted sum of squares, and the weights are the eigenvalues of $A${A}.',
          do: (s, o) => o.head.write({ duration: 1300 }),
        },
        {
          say: 'Lay calls $Q${Q} positive definite when $Q(\\mathbf{x}) > 0${Q of x is positive} for every nonzero $\\mathbf{x}${x}. That happens exactly when every eigenvalue is positive, and the graph is a bowl.',
          do: async (s, o) => {
            await o.def.fadeIn();
            await o.surf[0].draw({ duration: 1400 });
            await s.all(o.conds[0].write(), o.names[0].fadeIn());
          },
        },
        {
          say: 'All negative: negative definite, an upside-down bowl. Mixed signs: indefinite, a saddle that goes up one way and down the other.',
          do: async (s, o) => {
            await s.all(o.surf[1].draw({ duration: 1100 }), o.conds[1].write(), o.names[1].fadeIn({ delay: 400 }));
            await s.all(o.surf[2].draw({ duration: 1100 }), o.conds[2].write(), o.names[2].fadeIn({ delay: 400 }));
          },
        },
        {
          say: 'If some eigenvalues are zero and the rest share one sign, $Q${Q} is flat in those directions: semidefinite. Zeros together with both signs are still indefinite.',
          do: (s, o) => o.semi.fadeIn(),
        },
      ],
    },

    // 7
    {
      id: 'mistake-diagonal',
      title: 'The trap: reading signs off the diagonal',
      scene(s) {
        const lx = 255;
        const q = s.tex(`Q(\\mathbf{x}) = ${qTex(TN)}`, { x: lx, y: 80, size: 34, visible: false });
        const aEq = s.tex('A =', { x: lx - 115, y: 190, size: 40, visible: false });
        const m = s.matrix(TN, { x: lx + 30, y: 190, size: 40, visible: false });
        const ask = s.text('diagonal > 0 ⇒ definite?', { x: lx, y: 300, size: 30, color: C.yellow, visible: false });
        const test = s.tex(`Q(${TRAP_X.join(', ')}) = 1 - 4 + 1 = ${t(TRAP_Q)}`, { x: lx, y: 400, size: 32, color: C.yellow, visible: false });
        const fix = s.tex(`\\lambda = ${TN_E.map(t).join(',\\ ')}:\\ \\text{indefinite}`, { x: lx, y: 480, size: 34, color: C.green, visible: false });
        const R = 3;
        const p = s.plane({ x: 715, y: 300, width: 360, range: [-R, R, -R, R], labels: false, names: ['x_1', 'x_2'], visible: false });
        const pos = hyperbola(TN, 2, R).map((pts) => s.path(pathOn(p, pts), { color: C.blue, width: 3, visible: false }));
        const neg = hyperbola(TN, Number(TRAP_Q), R).map((pts) => s.path(pathOn(p, pts), { color: C.yellow, width: 3, visible: false }));
        const pt = p.point(TRAP_X, { color: C.yellow, r: 10, visible: false });
        const ptLab = p.label(TRAP_X, `Q = ${t(TRAP_Q)}`, { color: C.yellow, size: 30, offset: [64, 42], visible: false });
        const posLab = p.label([2.2, 2.55], 'Q = 2', { color: C.blue, size: 30, visible: false });
        return { q, aEq, m, ask, test, fix, p, pos, neg, pt, ptLab, posLab };
      },
      steps: [
        {
          say: 'Here\'s the trap. Both diagonal entries of this matrix are positive, so it\'s tempting to call $Q${Q} positive definite.',
          do: async (s, o) => {
            await o.q.write();
            await s.all(o.aEq.fadeIn(), o.m.fadeIn());
            await s.all(o.m.highlightCell(0, 0, C.green), o.m.highlightCell(1, 1, C.green));
            await o.ask.fadeIn();
          },
        },
        {
          say: 'But test $\\mathbf{x} = (1, -1)${x equals one, minus one}: $Q = 1 - 4 + 1 = -2${Q equals one minus four plus one, which is minus two}. Negative. The level curves are hyperbolas, not ellipses.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 900 }), o.test.write());
            await s.all(o.pos.map((c) => c.draw()), o.posLab.draw());
            await s.all(o.neg.map((c) => c.draw()), o.pt.draw(), o.ptLab.draw());
            await s.strike(o.ask, { color: 'yellow' });
          },
        },
        {
          say: 'The eigenvalues tell the truth: $3${three} and $-1${minus one}. Mixed signs, so $Q${Q} is indefinite. Check the eigenvalues, or test a vector, never just the diagonal.',
          do: (s, o) => o.fix.write(),
        },
      ],
    },

    // 8
    {
      id: 'try-classify-q',
      kind: 'try',
      title: 'Your turn',
      say: 'Classify this one. Build the matrix first.',
      prompt: `Classify $Q(\\mathbf{x}) = ${qTex(TC)}$.`,
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: 'Positive definite', why: `Right: $A = ${texMat(TC)}$ has eigenvalues $${TC_E.map(t).join('$ and $')}$, both positive.` },
        { id: 'b', label: 'Indefinite', why: `Both eigenvalues ($${TC_E.map(t).join('$ and $')}$) are positive.` },
        { id: 'c', label: 'Positive semidefinite only', why: 'There is no zero eigenvalue.' },
      ],
      hint: 'Split the cross coefficient to get $A$, then find its eigenvalues (trace and determinant).',
      solution: [
        `The matrix is $A = ${texMat(TC)}$: trace $6$, determinant $8$.`,
        `The eigenvalues are $${TC_E.map(t).join('$ and $')}$, both positive, so $Q = ${t(TC_E[0])}y_1^2 + ${t(TC_E[1])}y_2^2 > 0$ for every $\\mathbf{y} \\neq \\mathbf{0}$: **positive definite**.`,
      ],
    },

    // 9
    {
      id: 'wo-q-matrix',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Three variables this time, so three squares and up to three cross terms.',
      prompt: WO_Q.prompt,
      answer: WO_Q.answer,
      hints: WO_Q.hints,
      solution: WO_Q.solution,
      generate: generateQ,
    },

    // 10
    {
      id: 'wo-principal',
      kind: 'workout',
      title: 'Work it out',
      say: 'Now the whole method: find the principal axes, rewrite the form, and classify it.',
      prompt: WO_P.prompt,
      answer: WO_P.answer,
      hints: WO_P.hints,
      solution: WO_P.solution,
    },

    // 11
    {
      id: 'cp-qform',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain the classification in your own words.',
      prompt: 'Why do the eigenvalues of $A$ decide whether $\\mathbf{x}^TA\\mathbf{x}$ is positive for all nonzero $\\mathbf{x}$?',
      points: [
        'The orthogonal change of variable $\\mathbf{x} = P\\mathbf{y}$ is invertible, so nonzero $\\mathbf{x}$ correspond exactly to nonzero $\\mathbf{y}$',
        'In the new variables $Q = \\lambda_1y_1^2 + \\cdots + \\lambda_ny_n^2$',
        'If every $\\lambda_i > 0$, every nonzero $\\mathbf{y}$ gives a positive sum',
        'If some $\\lambda_i \\le 0$, the basis vector $\\mathbf{y} = \\mathbf{e}_i$ gives $Q = \\lambda_i \\le 0$',
      ],
    },

    // 12
    {
      id: 'summary-qf',
      title: 'Summary',
      scene(s) {
        const ax = axesScene(s, { x: 690, width: 400, visible: true });
        ax.spans.forEach((l) => l.show());
        ax.us.forEach((u) => u.show());
        const lines = [
          ['Q(\\mathbf{x}) = \\mathbf{x}^TA\\mathbf{x},\\ A^T = A', C.blue],
          ['\\text{axes} = \\text{eigenvectors}', C.purple],
          ['\\text{coefficients} = \\text{eigenvalues}', C.purple],
          ['\\text{signs of } \\lambda_i \\Rightarrow \\text{type}', C.green],
        ].map(([tx, c], i) => s.tex(tx, { x: 245, y: 130 + 100 * i, size: 32, color: c, visible: false }));
        const next = s.text('Next: every matrix, square or not, gets its own principal axes.', { x: 480, y: 547, size: 30, color: C.muted, visible: false });
        return { ...ax, lines, next };
      },
      steps: [
        {
          say: 'A quadratic form is $\\mathbf{x}^TA\\mathbf{x}${x transpose A x} with $A${A} symmetric; split each cross coefficient in half.',
          do: (s, o) => o.lines[0].write(),
        },
        {
          say: 'The eigenvectors of $A${A} are the principal axes. Turning them onto the coordinate axes removes the cross terms, and the new coefficients are the eigenvalues.',
          do: async (s, o) => {
            await s.all(o.p.applyMatrix(PT_NUM, { duration: 2000 }), o.lines[1].write());
            await s.all(o.yl.map((l) => l.draw()), o.lines[2].write());
          },
        },
        {
          say: 'The signs of the eigenvalues classify $Q${Q}: positive definite, negative definite, or indefinite. Next time, every matrix gets principal axes of its own.',
          do: async (s, o) => {
            await o.lines[3].write();
            await o.next.fadeIn();
          },
        },
      ],
    },
  ],
};
