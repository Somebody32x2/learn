/**
 * Lecture 27 · Diagonalizing symmetric matrices (Lay 7.1). Design: matrix/PLAN.md § 27.
 * Every matrix, eigenvalue, eigenvector and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, mul, transpose, scale, add, sub, identity, dot, eqMat, rationalEigen, eigenspace, gramSchmidt, diagonalize, rref, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
/** First nonzero entry positive (so eigenvectors read like the textbook's). */
const tidy = (v) => (v.find((x) => !x.zero).sign() < 0 ? v.map((x) => x.neg()) : v);
const outer = (v) => v.map((a) => v.map((b) => a.mul(b)));

/** The running 2 × 2 example. */
const A = mat([[3, 1], [1, 3]]);
const EIG = rationalEigen(A).map(({ value }) => ({ value, v: tidy(eigenspace(A, value)[0]) }));
const [L1, L2] = EIG.map((e) => e.value);
const [V1, V2] = EIG.map((e) => e.v);
const N1 = dot(V1, V1); // |v1|²
const PROJ1 = scale(N1.inv(), outer(V1)); // u1 u1ᵀ
const PROJ2 = scale(dot(V2, V2).inv(), outer(V2));
const W1 = scale(L1, PROJ1);
const W2 = scale(L2, PROJ2);
const SUM = add(W1, W2);
if (!eqMat(SUM, A)) throw new Error('spectral decomposition does not add up');

/** The trap: unnormalized P. */
const PBAD = transpose([V1, V2]);
const PTP = mul(transpose(PBAD), PBAD);
const DIAG = [[L1, F(0)], [F(0), L2]];
const PDPT = mul(mul(PBAD, DIAG), transpose(PBAD));

/** The 3 × 3 example with a repeated eigenvalue. */
const B = mat([[2, 1, 1], [1, 2, 1], [1, 1, 2]]);
const BEIG = rationalEigen(B); // [{4,1},{1,2}]
const BIG = BEIG[0].value;
const SMALL = BEIG[1].value;
const BV = tidy(eigenspace(B, BIG)[0]);
const BASIS1 = eigenspace(B, SMALL); // (-1,1,0), (-1,0,1)
const B_MINUS_I = sub(B, scale(SMALL, identity(3)));
const B_RED = rref(B_MINUS_I);
const GS = gramSchmidt(BASIS1);
const W_ANS = GS[1].map((x) => x.div(GS[1][2])); // scaled so the last entry is 1
const ANGLE_COS = dot(BASIS1[0], BASIS1[1]).valueOf() / Math.sqrt(dot(BASIS1[0], BASIS1[0]).valueOf() * dot(BASIS1[1], BASIS1[1]).valueOf());
const ANGLE = Math.round((Math.acos(ANGLE_COS) * 180) / Math.PI);

/** try-orth-diag candidates. */
const CANDS = {
  a: [[1, 2], [0, 3]],
  b: [[1, 1], [0, 1]],
  c: [[2, -3], [-3, 5]],
  d: [[0, -1], [1, 0]],
};
const isSym = (M) => M.every((row, i) => row.every((x, j) => x === M[j][i]));
const SYM = Object.keys(CANDS).filter((k) => isSym(CANDS[k]));
const DIAGONALIZABLE_A = diagonalize(CANDS.a) !== null;
const DIAGONALIZABLE_B = diagonalize(CANDS.b) !== null;

// ---------------------------------------------------------------- TeX + scene helpers

/** √n simplified: 8 → 2\sqrt{2}. */
function sqrtTex(n) {
  let k = Math.floor(Math.sqrt(n));
  while (n % (k * k)) k--;
  const m = n / (k * k);
  return m === 1 ? `${k}` : `${k === 1 ? '' : k}\\sqrt{${m}}`;
}
const nums = (v) => v.map(Number);
const unit = (v) => {
  const n = Math.hypot(...nums(v));
  return nums(v).map((x) => x / n);
};
const circlePts = (n = 120, r = 1) => Array.from({ length: n }, (_, k) => [r * Math.cos((2 * Math.PI * k) / n), r * Math.sin((2 * Math.PI * k) / n)]);
const rowTex = (v) => `(${v.map(t).join(', ')})`;
const unitTex = (v) => `\\frac{1}{${sqrtTex(Number(dot(v, v)))}}${texVec(v)}`;
const P_TEX = `\\frac{1}{${sqrtTex(Number(N1))}}${texMat(PBAD)}`;
const P_T_TEX = `\\frac{1}{${sqrtTex(Number(N1))}}${texMat(transpose(PBAD))}`;

function paint(tex, name, color) {
  for (const e of tex.part(name)) e.style.color = color;
  return tex;
}

/** Right-angle mark at the origin of a plane, along unit directions a and b. */
const rightAngle = (p, a, b, k = 0.4, opts = {}) =>
  p.polygon([[0, 0], [k * a[0], k * a[1]], [k * (a[0] + b[0]), k * (a[1] + b[1])], [k * b[0], k * b[1]]], { fill: 'none', width: 2.5, color: C.purple, ...opts });

/** Beats 1 and 13: plane + unit circle + the two eigen-directions; `mapped` = already stretched by A. */
function ellipseScene(s, { x = 640, width = 460, visible = false, mapped = false } = {}) {
  const p = s.plane({ x, y: 300, width, range: [-4, 4, -4, 4], names: ['x_1', 'x_2'], visible });
  const circle = p.polygon(circlePts(), { color: C.blue, visible });
  const u1 = unit(V1), u2 = unit(V2);
  const dots = [u1, u2].map((u) => p.point(u, { color: C.purple, r: 8, visible }));
  const spans = [V1, V2].map((v) => p.span(nums(v), { color: C.purple, dash: '8 6', transform: false, visible: false }));
  const ra = rightAngle(p, u1, u2, 0.45, { transform: false, visible: false });
  const l1 = Number(L1), l2 = Number(L2);
  const labs = [
    p.label([l1 * u1[0], l1 * u1[1]], `\\times ${t(L1)}`, { color: C.purple, size: 34, offset: [30, -14], transform: false, visible: false }),
    p.label([l2 * u2[0], l2 * u2[1]], `\\times ${t(L2)}`, { color: C.purple, size: 34, offset: [34, 14], transform: false, visible: false }),
  ];
  if (mapped) p.applyMatrix(A.map(nums), { duration: 0 });
  return { p, circle, dots, spans, ra, labs };
}

// ---------------------------------------------------------------- workout

const WO = {
  prompt: `For $A = ${texMat(B)}$, the vector $\\mathbf{u} = ${rowTex(BASIS1[0])}$ is in the eigenspace for $\\lambda = ${t(SMALL)}$. Find the vector $\\mathbf{w} = (a, b, 1)$ in that eigenspace that is orthogonal to $\\mathbf{u}$.`,
  answer: { type: 'vector', value: W_ANS.map(String) },
  hints: [
    `The eigenspace for $\\lambda = ${t(SMALL)}$ is $\\operatorname{Nul}(A - I)$: the plane $x_1 + x_2 + x_3 = 0$.`,
    `Orthogonal to $\\mathbf{u}$: $\\mathbf{w}\\cdot\\mathbf{u} = -a + b = 0$. Combine it with $a + b + 1 = 0$.`,
  ],
  solution: [
    `Row reduce $A - I = ${texMat(B_MINUS_I)}$: ${B_RED.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after)}$`).join(', ')}. One pivot, so the eigenspace for $\\lambda = 1$ is the plane $x_1 + x_2 + x_3 = 0$. For $\\mathbf{w} = (a, b, 1)$ that says $a + b + 1 = 0$.`,
    `Orthogonal to $\\mathbf{u} = ${rowTex(BASIS1[0])}$: $-a + b = 0$, so $a = b$ and $2a + 1 = 0$. Hence $\\mathbf{w} = ${rowTex(W_ANS)}$. This is exactly what Gram–Schmidt gives from the basis $${rowTex(BASIS1[0])}, ${rowTex(BASIS1[1])}$.`,
    `Normalizing, $\\tfrac{1}{${sqrtTex(Number(dot(BV, BV)))}}${rowTex(BV)}$, $\\tfrac{1}{${sqrtTex(Number(dot(BASIS1[0], BASIS1[0])))}}${rowTex(BASIS1[0])}$, $\\tfrac{1}{${sqrtTex(Number(dot(GS[1].map((x) => x.mul(2)), GS[1].map((x) => x.mul(2)))))}}${rowTex(GS[1].map((x) => x.mul(2)))}$ are orthonormal eigenvectors, so $A = PDP^T$ with these as the columns of $P$ and $D = \\operatorname{diag}(${t(BIG)}, ${t(SMALL)}, ${t(SMALL)})$.`,
  ],
};

// ---------------------------------------------------------------- the lecture

export default {
  id: 'symmetric',
  title: 'Diagonalizing symmetric matrices',
  goals: [
    'See why eigenvectors of a symmetric matrix from different eigenspaces are orthogonal',
    'Orthogonally diagonalize a symmetric matrix: $A = PDP^T$ with $P^{-1} = P^T$',
    'State the Spectral Theorem and write the spectral decomposition',
  ],
  beats: [
    // 1
    {
      id: 'perp-axes',
      title: 'Symmetric matrices stretch along perpendicular axes',
      scene(s) {
        const e = ellipseScene(s);
        const aEq = s.tex('A =', { x: 85, y: 140, size: 44, visible: false });
        const m = s.matrix(A, { x: 240, y: 140, size: 44, visible: false });
        const sym = s.tex('A^T = A', { x: 190, y: 285, size: 44, color: C.blue, visible: false });
        const facts = EIG.map((ev, k) =>
          s.tex(`\\mathbf{v}_${k + 1} = ${rowTex(ev.v)},\\ \\lambda_${k + 1} = ${t(ev.value)}`, { x: 210, y: 380 + 70 * k, size: 32, color: C.purple, visible: false }),
        );
        return { ...e, aEq, m, sym, facts };
      },
      steps: [
        {
          say: 'A matrix is symmetric when it equals its transpose: $A^T = A${A transpose equals A}. Flip this one across its diagonal and nothing changes.',
          do: async (s, o) => {
            await s.all(o.aEq.fadeIn(), o.m.write());
            await s.all(o.m.highlightCell(0, 1, C.yellow), o.m.highlightCell(1, 0, C.yellow));
            await o.sym.write();
          },
        },
        {
          say: 'Now watch what $A${A} does to the unit circle. It stretches it along two perpendicular directions, with no twist.',
          do: async (s, o) => {
            await o.p.draw({ duration: 900 });
            await s.all(o.circle.draw(), o.dots.map((d) => d.draw()));
            await o.p.applyMatrix(A.map(nums), { duration: 2200 });
          },
        },
        {
          say: 'Those two directions are eigenvectors. $A${A} stretches $(1, 1)${one, one} by $4${four} and $(1, -1)${one, minus one} by $2${two}, and the two lines meet at a right angle.',
          do: async (s, o) => {
            await s.all(o.spans.map((l) => l.draw({ duration: 900 })));
            await s.all(o.labs.map((l) => l.draw()), o.facts.map((f, k) => f.write({ delay: k * 500 })));
            await o.ra.draw();
          },
        },
      ],
    },

    // 2
    {
      id: 'theorem-1',
      title: 'Why the eigenvectors are perpendicular',
      scene(s) {
        const facts = s.tex('A\\mathbf{v}_1 = \\lambda_1\\mathbf{v}_1,\\quad A\\mathbf{v}_2 = \\lambda_2\\mathbf{v}_2,\\quad \\lambda_1 \\neq \\lambda_2,\\quad A^T = A', { x: 480, y: 60, size: 34, visible: false });
        const X0 = 300;
        const lhs = s.tex('\\lambda_1\\,\\mathbf{v}_1\\cdot\\mathbf{v}_2', { x: X0, y: 112, size: 34, anchor: [1, 0.5], visible: false });
        const rows = [
          '= (A\\mathbf{v}_1)^T\\mathbf{v}_2',
          '= \\mathbf{v}_1^T\\part{AT}{A^T}\\mathbf{v}_2',
          '= \\mathbf{v}_1^T\\part{A}{A}\\mathbf{v}_2',
          '= \\mathbf{v}_1^T(\\lambda_2\\mathbf{v}_2)',
          '= \\lambda_2\\,\\mathbf{v}_1\\cdot\\mathbf{v}_2',
        ].map((tx, i) => s.tex(tx, { x: X0 + 10, y: 112 + 55 * i, size: 34, anchor: [0, 0.5], visible: false }));
        const anns = ['A\\mathbf{v}_1 = \\lambda_1\\mathbf{v}_1', '(B\\mathbf{x})^T = \\mathbf{x}^TB^T', 'A^T = A', 'A\\mathbf{v}_2 = \\lambda_2\\mathbf{v}_2'].map((tx, i) =>
          s.tex(`\\text{using } ${tx}`, { x: 560, y: 112 + 55 * i, size: 30, color: i === 2 ? C.yellow : C.muted, anchor: [0, 0.5], visible: false }),
        );
        const concl = s.tex('\\part{diff}{(\\lambda_1 - \\lambda_2)}\\,\\mathbf{v}_1\\cdot\\mathbf{v}_2 = 0 \\;\\Longrightarrow\\; \\part{res}{\\mathbf{v}_1\\cdot\\mathbf{v}_2 = 0}', { x: 480, y: 395, size: 40, visible: false });
        const thm1 = s.defCard({ kind: 'theorem', title: false, body: '**Theorem 1.** If $A$ is symmetric, eigenvectors from different eigenspaces are orthogonal.', x: 480, y: 500, width: 880, size: 30, visible: false });
        return { facts, lhs, rows, anns, concl, thm1 };
      },
      steps: [
        {
          say: 'Take eigenvectors $\\mathbf{v}_1${v one} and $\\mathbf{v}_2${v two} with different eigenvalues, and compute $\\lambda_1\\,\\mathbf{v}_1\\cdot\\mathbf{v}_2${lambda one times v one dot v two} in two ways.',
          do: async (s, o) => {
            await o.facts.write({ duration: 1200 });
            await o.lhs.write();
          },
        },
        {
          say: 'First, $\\lambda_1\\mathbf{v}_1${lambda one v one} is $A\\mathbf{v}_1${A v one}. Moving $A${A} across the dot product turns it into $A^T${A transpose}, and symmetry turns that back into $A${A}.',
          do: async (s, o) => {
            await s.all(o.rows[0].write(), o.anns[0].fadeIn({ delay: 300 }));
            await s.all(o.rows[1].write(), o.anns[1].fadeIn({ delay: 300 }));
            await o.rows[1].color('AT', C.yellow);
            await s.all(o.rows[2].write(), o.anns[2].fadeIn({ delay: 300 }));
            await o.rows[2].color('A', C.yellow);
          },
        },
        {
          say: 'Now $A${A} lands on $\\mathbf{v}_2${v two}, an eigenvector, which gives $\\lambda_2\\,\\mathbf{v}_1\\cdot\\mathbf{v}_2${lambda two times v one dot v two}.',
          do: async (s, o) => {
            await s.all(o.rows[3].write(), o.anns[3].fadeIn({ delay: 300 }));
            await o.rows[4].write();
          },
        },
        {
          say: 'Subtract: $(\\lambda_1 - \\lambda_2)\\,\\mathbf{v}_1\\cdot\\mathbf{v}_2 = 0${lambda one minus lambda two, times v one dot v two, equals zero}. The eigenvalues differ, so the dot product must be zero: the eigenvectors are perpendicular. That\'s Theorem 1.',
          do: async (s, o) => {
            await o.concl.write({ duration: 1200 });
            await s.ring([o.concl, 'diff'], { color: 'yellow', shape: 'box', pad: 4 });
            await o.concl.color('res', C.green);
            await o.thm1.reveal();
          },
        },
      ],
    },

    // 3
    {
      id: 'orth-diag',
      title: 'A = PDPᵀ',
      scene(s) {
        const p = s.plane({ x: 800, y: 160, width: 240, range: [-1.6, 1.6, -1.6, 1.6], labels: false, visible: false });
        const ring = p.polygon(circlePts(), { color: C.muted, fill: 'none', width: 2, dash: '6 5', visible: false });
        const vs = [V1, V2].map((v, k) => p.vector(nums(v), { color: C.purple, label: `\\mathbf{v}_${k + 1}`, labelSize: 32, visible: false }));
        const us = [V1, V2].map((v, k) =>
          s.tex(`\\mathbf{u}_${k + 1} = \\frac{\\mathbf{v}_${k + 1}}{\\|\\mathbf{v}_${k + 1}\\|} = ${unitTex(v)}`, { x: 300, y: 78 + 106 * k, size: 32, color: C.purple, visible: false }),
        );
        const eq = s.tex(`A = \\part{P}{${P_TEX}}\\part{D}{${texMat(DIAG)}}\\part{PT}{${P_T_TEX}}`, { x: 480, y: 318, size: 36, visible: false });
        const inv = s.tex('P^TP = I \\;\\Longrightarrow\\; \\part{inv}{P^{-1} = P^T}', { x: 480, y: 405, size: 38, visible: false });
        const thm = s.defCard({ kind: 'theorem', title: false, body: '**Theorem 2.** An $n \\times n$ matrix $A$ is orthogonally diagonalizable $\\iff$ $A$ is symmetric.', x: 480, y: 510, width: 880, size: 30, visible: false });
        return { p, ring, vs, us, eq, inv, thm };
      },
      steps: [
        {
          say: 'Unit eigenvectors make the cleanest $P${P}. Divide $(1, 1)${one, one} and $(1, -1)${one, minus one} by their length, $\\sqrt{2}${root two}, and they land on the unit circle.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 700 }), o.ring.draw());
            await s.all(o.vs.map((v) => v.grow()));
            await s.all(o.us.map((u, k) => u.write({ delay: k * 400 })));
            o.vs.forEach((v, k) => v.setLabel(`\\mathbf{u}_${k + 1}`));
            await s.all(o.vs.map((v, k) => v.moveTo(unit([V1, V2][k]), { duration: 900 })));
          },
        },
        {
          say: 'Put them in $P${P} and the eigenvalues in $D${D}. The columns are orthonormal, so $P^TP = I${P transpose P equals I}: the inverse is just the transpose, for free.',
          do: async (s, o) => {
            await o.eq.write({ duration: 1300 });
            await s.all(o.eq.color('P', C.purple), o.eq.color('D', C.purple));
            await o.inv.write();
            await s.all(o.inv.color('inv', C.green), o.eq.color('PT', C.green));
          },
        },
        {
          say: 'When $A = PDP^T${A equals P D P transpose} with $P${P} orthogonal, we call $A${A} orthogonally diagonalizable. Theorem 2 says that happens exactly when $A${A} is symmetric.',
          do: (s, o) => o.thm.reveal(),
        },
      ],
    },

    // 4
    {
      id: 'try-orth-diag',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Theorem 2 makes this a one-glance question.',
      prompt: 'Which matrix is orthogonally diagonalizable?',
      answer: { type: 'choice', value: SYM[0] },
      choices: [
        { id: 'a', label: `$${texMat(CANDS.a)}$`, why: `${DIAGONALIZABLE_A ? 'Diagonalizable' : 'Not diagonalizable'}, but not symmetric, so its eigenvectors aren't orthogonal.` },
        { id: 'b', label: `$${texMat(CANDS.b)}$`, why: `${DIAGONALIZABLE_B ? 'Diagonalizable, but not symmetric.' : 'Not even diagonalizable: one eigenvalue, one eigenvector direction.'}` },
        { id: 'c', label: `$${texMat(CANDS.c)}$`, why: 'Right: it equals its transpose, and symmetric matrices are exactly the orthogonally diagonalizable ones.' },
        { id: 'd', label: `$${texMat(CANDS.d)}$`, why: 'Antisymmetric ($A^T = -A$): a rotation, with complex eigenvalues.' },
      ],
      hint: 'Look for the matrix that equals its own transpose.',
      solution: [
        'Theorem 2: a matrix is orthogonally diagonalizable exactly when it is symmetric, so just check $A^T = A$.',
        `Only $${texMat(CANDS.c)}$ is symmetric: both off-diagonal entries are $-3$.`,
        `The others fail: $${texMat(CANDS.a)}$ is diagonalizable (eigenvalues 1 and 3) but its eigenvectors are not perpendicular; $${texMat(CANDS.b)}$ is not diagonalizable at all; $${texMat(CANDS.d)}$ rotates by $90^\\circ$ and has no real eigenvectors.`,
      ],
    },

    // 5
    {
      id: 'spectral-theorem',
      title: 'The Spectral Theorem',
      scene(s) {
        const head = s.text('**Spectral Theorem.** For a symmetric $n \\times n$ matrix $A$:', { x: 480, y: 55, size: 32, width: 880, align: 'left', visible: false });
        const items = [
          '(a) $n$ real eigenvalues (with multiplicity)',
          '(b) dim of each eigenspace = multiplicity',
          '(c) eigenspaces mutually orthogonal',
          '(d) $A$ is orthogonally diagonalizable',
        ].map((tx, i) => s.text(tx, { x: 345, y: 170 + 95 * i, size: 30, width: 610, align: 'left', visible: false }));
        const traps = ['complex eigenvalues', 'too few eigenvectors', 'slanted eigenvectors'].map((tx, i) =>
          s.text(tx, { x: 770, y: 170 + 95 * i, size: 30, color: C.yellow, visible: false }),
        );
        const trapHead = s.text('what could block $PDP^T$', { x: 735, y: 115, size: 30, color: C.muted, visible: false });
        return { head, items, traps, trapHead };
      },
      steps: [
        {
          say: 'Orthogonal diagonalization can fail in three ways: the eigenvalues can be complex, an eigenspace can come up short, and the eigenvectors can sit at awkward angles.',
          do: async (s, o) => {
            await o.trapHead.fadeIn();
            await s.stagger(o.traps.map((x) => () => x.fadeIn({ shift: [16, 0] })), 900);
          },
        },
        {
          say: 'For a symmetric matrix, none of that happens. Its eigenvalues are all real, and each eigenspace is as big as the multiplicity allows.',
          do: async (s, o) => {
            await o.head.fadeIn();
            await o.items[0].write();
            await s.strike(o.traps[0], { color: 'green' });
            await o.items[1].write();
            await s.strike(o.traps[1], { color: 'green' });
          },
        },
        {
          say: 'Different eigenspaces are perpendicular to each other. So $A${A} is always orthogonally diagonalizable.',
          do: async (s, o) => {
            await o.items[2].write();
            await s.strike(o.traps[2], { color: 'green' });
            await o.items[3].write();
            await s.all(o.items[3].recolor(C.green), s.ring(o.items[3], { color: 'green', shape: 'box' }));
          },
        },
      ],
    },

    // 6
    {
      id: 'spectral-decomp',
      title: 'Spectral decomposition',
      scene(s) {
        const p = s.plane({ x: 700, y: 245, width: 380, range: [-1.5, 3.5, -1.5, 2.5], names: ['x_1', 'x_2'], visible: false });
        const spans = [V1, V2].map((v) => p.span(nums(v), { color: C.purple, dash: '8 6', visible: false }));
        const x = [1, 0];
        const xv = p.vector(x, { color: C.blue, label: '\\mathbf{x}', visible: false });
        const pr = [unit(V1), unit(V2)].map((u) => {
          const k = u[0] * x[0] + u[1] * x[1];
          return [k * u[0], k * u[1]];
        });
        const pv = pr.map((q) => p.vector(q, { color: C.purple, visible: false }));
        const drops = pr.map((q) => {
          const [a, b] = [p.toStage(x), p.toStage(q)];
          return s.line(a[0], a[1], b[0], b[1], { color: C.muted, dash: '5 5', width: 2.5, visible: false });
        });
        const Ax = p.vector([3, 1], { color: C.green, label: 'A\\mathbf{x}', visible: false });
        const t1 = s.tex(`\\mathbf{u}_1\\mathbf{u}_1^T = ${N1.inv().tex()}${texMat(outer(V1))}`, { x: 250, y: 110, size: 34, color: C.purple, visible: false });
        const t2 = s.tex('\\mathbf{u}_1\\mathbf{u}_1^T\\mathbf{x} = \\operatorname{proj}_{\\mathbf{u}_1}\\mathbf{x}', { x: 250, y: 215, size: 34, visible: false });
        const t3 = s.tex(`A\\mathbf{x} = ${t(L1)}\\operatorname{proj}_{\\mathbf{u}_1}\\mathbf{x} + ${t(L2)}\\operatorname{proj}_{\\mathbf{u}_2}\\mathbf{x}`, { x: 255, y: 315, size: 30, visible: false });
        const dec = s.tex(`A = ${t(L1)}\\mathbf{u}_1\\mathbf{u}_1^T + ${t(L2)}\\mathbf{u}_2\\mathbf{u}_2^T`, { x: 255, y: 420, size: 36, visible: false });
        const big = s.tex(`= ${texMat(W1)} + ${texMat(W2)} = \\part{A}{${texMat(SUM)}}`, { x: 480, y: 515, size: 36, visible: false });
        return { p, spans, xv, pv, drops, Ax, pr, t1, t2, t3, dec, big };
      },
      steps: [
        {
          say: 'Each $\\mathbf{u}\\mathbf{u}^T${u u transpose} is a projection matrix: it sends any vector $\\mathbf{x}${x} to its shadow on the line through $\\mathbf{u}${u}.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 900 }), o.t1.write());
            await s.all(o.spans.map((l) => l.draw()), o.xv.grow());
            await o.t2.write();
            await s.all(o.drops.map((d) => d.draw({ duration: 600 })));
            await s.all(o.pv.map((v) => v.grow({ duration: 700 })));
          },
        },
        {
          say: 'Stretch each shadow by its eigenvalue, $4${four} and $2${two}, and add them tip to tail. The sum is exactly $A\\mathbf{x}${A x}.',
          do: async (s, o) => {
            await s.all(o.drops.map((d) => d.fadeOut()));
            await s.all(o.pv.map((v, k) => v.moveTo(o.pr[k].map((c) => c * Number(k ? L2 : L1)), { duration: 900 })));
            await o.p.addTip(o.pv[0], o.pv[1], { duration: 800 });
            await s.all(o.Ax.grow(), o.t3.write());
          },
        },
        {
          say: 'So $A${A} is a weighted sum of projections, and the weights are its eigenvalues: $A = 4\\mathbf{u}_1\\mathbf{u}_1^T + 2\\mathbf{u}_2\\mathbf{u}_2^T${A equals four u one u one transpose plus two u two u two transpose}.',
          do: async (s, o) => {
            await o.dec.write();
            await o.big.write({ duration: 1300 });
            await o.big.color('A', C.green);
          },
        },
      ],
    },

    // 7
    {
      id: 'fill-spectral',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Rebuild a symmetric matrix from its eigenvalues and unit eigenvectors, entry by entry.',
      prompt: `A symmetric matrix $A$ has eigenvalues $${t(L1)}, ${t(L2)}$ with unit eigenvectors $\\mathbf{u}_1 = \\tfrac{1}{\\sqrt{2}}(1, 1)$ and $\\mathbf{u}_2 = \\tfrac{1}{\\sqrt{2}}(1, -1)$. Find $A$ from its spectral decomposition.`,
      lines: [
        [`\\mathbf{u}_1\\mathbf{u}_1^T = ${t(N1.inv())}${texMat(outer(V1))},\\quad \\mathbf{u}_2\\mathbf{u}_2^T = ${t(N1.inv())}${texMat(outer(V2))}`],
        [
          `A = ${t(L1)}\\mathbf{u}_1\\mathbf{u}_1^T + ${t(L2)}\\mathbf{u}_2\\mathbf{u}_2^T = `,
          { matrix: SUM.map((row, i) => row.map((x, j) => ({ id: `a${i + 1}${j + 1}`, answer: { type: 'number', value: String(x) } }))) },
        ],
        ['P = [\\mathbf{u}_1\\ \\mathbf{u}_2] \\text{ is orthogonal, so } P^{-1} = ', { id: 'pinv', chips: ['P^T', 'P', 'D^{-1}'], answer: 'P^T' }],
      ],
      solution: [
        `$${t(L1)}\\mathbf{u}_1\\mathbf{u}_1^T = ${texMat(W1)}$ and $${t(L2)}\\mathbf{u}_2\\mathbf{u}_2^T = ${texMat(W2)}$; their sum is $A = ${texMat(SUM)}$.`,
        'The columns of $P$ are orthonormal, so $P^TP = I$ and $P^{-1} = P^T$.',
      ],
    },

    // 8
    {
      id: 'repeated',
      title: 'A repeated eigenvalue',
      scene(s) {
        const mB = s.tex(`A = ${texMat(B)}`, { x: 220, y: 100, size: 34, visible: false });
        const e4 = s.tex(`\\lambda = ${t(BIG)}:\\ \\operatorname{Span}\\{${rowTex(BV)}\\}`, { x: 220, y: 215, size: 30, color: C.purple, visible: false });
        const e1 = s.tex(`\\lambda = ${t(SMALL)}:\\ x_1 + x_2 + x_3 = 0`, { x: 220, y: 275, size: 30, color: C.purple, visible: false });
        const bad = s.tex(`\\mathbf{w}_1\\cdot\\mathbf{w}_2 = ${t(dot(BASIS1[0], BASIS1[1]))} \\neq 0`, { x: 220, y: 355, size: 32, color: C.yellow, visible: false });
        const gs = s.tex(`\\mathbf{w}_2 - ${dot(BASIS1[1], BASIS1[0]).div(dot(BASIS1[0], BASIS1[0])).tex().replace(/\\frac/g, '\\dfrac')}\\,\\mathbf{w}_1 = \\left(${GS[1].map((x) => x.tex().replace(/\\frac/g, '\\dfrac')).join(', ')}\\right)`, { x: 252, y: 455, size: 30, color: C.green, visible: false });
        const norm = s.text('then divide each by its length', { x: 230, y: 555, size: 30, color: C.muted, visible: false });
        const sp = s.space({ x: 690, y: 320, size: 400, range: 2, yaw: -65, pitch: 18, visible: false });
        const line = sp.line([0, 0, 0], nums(BV), { color: C.purple, width: 4, visible: false });
        const plane = sp.plane({ normal: nums(BV), d: 0 }, { color: C.purple, extent: 1.25, visible: false });
        const w = BASIS1.map((v, k) => sp.vector(nums(v), { color: k ? C.red : C.blue, label: `\\mathbf{w}_${k + 1}`, labelSize: 32, visible: false }));
        // angle marks, in stage coordinates (the camera stays put while they show)
        const a = unit(BASIS1[0]);
        const g = unit(GS[1]);
        const r = 0.55;
        const th = (ANGLE * Math.PI) / 180;
        const arcPts = Array.from({ length: 25 }, (_, i) => {
          const q = (th * i) / 24;
          return sp.toStage([0, 1, 2].map((k) => r * (Math.cos(q) * a[k] + Math.sin(q) * g[k])));
        });
        const arc = s.path(`M ${arcPts.map((p) => p.join(' ')).join(' L ')}`, { color: C.yellow, width: 3, visible: false });
        const mid = sp.toStage([0, 1, 2].map((k) => 1.0 * (Math.cos(th / 2) * a[k] + Math.sin(th / 2) * g[k])));
        const deg = s.tex(`${ANGLE}^\\circ`, { x: mid[0], y: mid[1], size: 30, color: C.yellow, visible: false });
        const k0 = 0.3;
        const sq = [[k0, 0], [k0, k0], [0, k0]].map(([p, q]) => sp.toStage([0, 1, 2].map((k) => p * a[k] + q * g[k])));
        const right = s.path(`M ${sq.map((p) => p.join(' ')).join(' L ')}`, { color: C.green, width: 3, visible: false });
        return { mB, e4, e1, bad, gs, norm, sp, line, plane, w, arc, deg, right };
      },
      steps: [
        {
          say: 'This matrix has eigenvalue $4${four} once and $1${one} twice. The $1${one} eigenspace is a whole plane, and it is perpendicular to the line of $4${four} eigenvectors.',
          do: async (s, o) => {
            await s.all(o.mB.write(), o.sp.draw());
            await s.all(o.e4.write(), o.line.draw());
            await s.all(o.e1.write(), o.plane.fadeIn({ shift: [0, 0] }));
          },
        },
        {
          say: 'But the basis row reduction hands you for that plane isn\'t orthogonal. These two vectors meet at sixty degrees.',
          do: async (s, o) => {
            await s.all(o.w.map((v) => v.grow()));
            await s.all(o.arc.draw(), o.deg.fadeIn({ delay: 300 }), o.bad.write());
          },
        },
        {
          say: 'So run Gram–Schmidt inside the eigenspace. The new vector is still an eigenvector, because it stays in the plane, and now it\'s perpendicular to the first. Then normalize.',
          do: async (s, o) => {
            await o.gs.write({ duration: 1200 });
            await s.all(o.w[1].moveTo(nums(GS[1]), { duration: 1200 }), o.arc.fadeOut(), o.deg.fadeOut());
            await o.right.draw();
            await o.norm.fadeIn();
          },
        },
      ],
    },

    // 9
    {
      id: 'mistake-normalize',
      title: 'The trap: forgetting to normalize',
      scene(s) {
        const divider = s.line(480, 60, 480, 540, { color: C.line, width: 2, visible: false });
        const pL = s.tex(`P = ${texMat(PBAD)}`, { x: 250, y: 110, size: 36, visible: false });
        const ptpL = s.tex(`P^TP = ${texMat(PTP)} = ${t(PTP[0][0])}I`, { x: 250, y: 250, size: 36, visible: false });
        const conseq = s.tex(`PDP^T = ${texMat(PDPT)} \\neq A`, { x: 250, y: 390, size: 36, visible: false });
        const pR = s.tex(`P = ${P_TEX}`, { x: 715, y: 110, size: 36, color: C.green, visible: false });
        const ptpR = s.tex('P^TP = I', { x: 715, y: 250, size: 38, color: C.green, visible: false });
        const okR = s.tex(`PDP^T = ${texMat(A)} = A`, { x: 715, y: 390, size: 36, color: C.green, visible: false });
        const rule = s.text('Orthogonal columns aren\'t enough: they must be **unit** vectors.', { x: 480, y: 520, size: 30, visible: false });
        return { divider, pL, ptpL, conseq, pR, ptpR, okR, rule };
      },
      steps: [
        {
          say: 'Here\'s the trap. These columns are orthogonal eigenvectors, so it\'s tempting to call $P${P} orthogonal. But $P^TP${P transpose P} comes out as $2I${two I}, not $I${I}.',
          do: async (s, o) => {
            await s.all(o.pL.write(), o.divider.draw());
            await o.ptpL.write();
            await s.ring(o.ptpL, { color: 'yellow', shape: 'box' });
          },
        },
        {
          say: 'So $P^T${P transpose} is not the inverse of $P${P}, and $PDP^T${P D P transpose} comes out twice as big as $A${A}.',
          do: async (s, o) => {
            await o.conseq.write();
            await o.conseq.recolor(C.yellow);
            await s.strike(o.conseq, { color: 'yellow' });
          },
        },
        {
          say: 'The fix: divide each eigenvector by its length. With unit columns, $P^TP = I${P transpose P equals I} and $P^{-1} = P^T${P inverse equals P transpose}.',
          do: async (s, o) => {
            await o.pR.write();
            await o.ptpR.write();
            await o.okR.write();
            await o.rule.fadeIn();
          },
        },
      ],
    },

    // 10
    {
      id: 'wo-orth-eigenspace',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Build the second orthogonal eigenvector by hand, inside the plane.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
    },

    // 11
    {
      id: 'try-symmetric-fact',
      kind: 'try',
      title: 'Your turn',
      say: 'A quick one, straight from the Spectral Theorem.',
      prompt: '$A$ is a symmetric $3 \\times 3$ matrix with eigenvalues $2, 2, 7$. What is the dimension of the eigenspace for $\\lambda = 2$?',
      answer: { type: 'number', value: 2 },
      hint: 'Spectral Theorem, part (b).',
      solution: [
        'For a symmetric matrix, each eigenspace has dimension equal to the multiplicity of its eigenvalue (Spectral Theorem, part (b)).',
        '$\\lambda = 2$ appears twice, so its eigenspace is 2-dimensional: a plane, perpendicular to the line of eigenvectors for $\\lambda = 7$.',
      ],
    },

    // 12
    {
      id: 'cp-symmetric',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain the key fact of this lecture in your own words.',
      prompt: 'Why are eigenvectors for different eigenvalues of a symmetric matrix orthogonal?',
      points: [
        'Compute $\\lambda_1\\mathbf{v}_1\\cdot\\mathbf{v}_2$ in two ways',
        '$(A\\mathbf{v}_1)\\cdot\\mathbf{v}_2 = \\mathbf{v}_1\\cdot(A^T\\mathbf{v}_2)$',
        '$A^T = A$ turns it into $\\mathbf{v}_1\\cdot(A\\mathbf{v}_2) = \\lambda_2\\mathbf{v}_1\\cdot\\mathbf{v}_2$',
        'So $(\\lambda_1 - \\lambda_2)\\mathbf{v}_1\\cdot\\mathbf{v}_2 = 0$, and $\\lambda_1 \\neq \\lambda_2$ forces $\\mathbf{v}_1\\cdot\\mathbf{v}_2 = 0$',
      ],
    },

    // 13
    {
      id: 'summary-sym',
      title: 'Summary',
      scene(s) {
        const e = ellipseScene(s, { x: 700, width: 400, visible: true });
        const lines = [
          ['A^T = A \\iff A = PDP^T', C.blue],
          ['P^{-1} = P^T', C.green],
          ['A = \\lambda_1\\mathbf{u}_1\\mathbf{u}_1^T + \\cdots + \\lambda_n\\mathbf{u}_n\\mathbf{u}_n^T', C.purple],
        ].map(([tx, c], i) => s.tex(tx, { x: 250, y: 150 + 110 * i, size: i === 2 ? 30 : 32, color: c, visible: false }));
        const next = s.text('Next: quadratic forms.', { x: 480, y: 555, size: 30, color: C.muted, visible: false });
        return { ...e, lines, next };
      },
      steps: [
        {
          say: 'Symmetric matrices are exactly the orthogonally diagonalizable ones. They stretch space along perpendicular axes.',
          do: async (s, o) => {
            await s.all(o.p.applyMatrix(A.map(nums), { duration: 2000 }), o.lines[0].write());
            await s.all(o.spans.map((l) => l.draw()), o.ra.draw({ delay: 400 }));
          },
        },
        {
          say: 'Write that as $A = PDP^T${A equals P D P transpose}, where $P^{-1} = P^T${P inverse is P transpose} because the eigenvectors are orthonormal.',
          do: (s, o) => o.lines[1].write(),
        },
        {
          say: 'And $A${A} is a sum of projections onto its eigen-directions, weighted by the eigenvalues. Next, we use this to straighten out quadratic forms.',
          do: async (s, o) => {
            await s.all(o.lines[2].write({ duration: 1200 }), o.labs.map((l) => l.draw()));
            await o.next.fadeIn();
          },
        },
      ],
    },
  ],
};
