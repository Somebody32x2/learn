/**
 * Lecture 8 · Inverses and the Invertible Matrix Theorem (Lay 2.2–2.3). Design: matrix/PLAN.md § 8.
 * Every matrix, inverse, row operation and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, mul, mulVec, rref, applyRowOp, det, inverse, identity, col, eqMat, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
const strs = (M) => M.map((r) => r.map(String));
/** `(3)`: a factor in parentheses, so products read `(2)(3)`. */
const pf = (x) => `(${t(x)})`;

/** Beats 1–3: the running 2×2 example. */
const A2 = mat([[2, 5], [1, 3]]);
const A2_DET = det(A2);
const A2_INV = inverse(A2);
const SING = mat([[1, 2], [2, 4]]);
const SING_DET = det(SING);
const B2 = vec([1, 2]);
const X2 = mulVec(A2_INV, B2);
/** The letter F at half size (its image under A stays on the plane). */
const LETTER = [[0, 0], [0, 2], [1.25, 2], [1.25, 1.6], [0.4, 1.6], [0.4, 1.2], [1, 1.2], [1, 0.8], [0.4, 0.8], [0.4, 0]].map(([a, b]) => [a / 2, b / 2]);

/** Beat 4. */
const Q = mat([[4, 3], [2, 2]]);
const Q_DET = det(Q);
const Q_ADJ = mat([[Q[1][1], Q[0][1].neg()], [Q[1][0].neg(), Q[0][0]]]);

/** Beats 5, 6, 15: the [A | I] algorithm. */
const A3 = mat([[1, 2, 0], [0, 1, 1], [2, 4, 1]]);
const I3 = identity(3);
const AI = A3.map((row, i) => [...row, ...I3[i]]);
const AI_RED = rref(AI, { augmented: 3 });
const A3_INV = AI_RED.R.map((row) => row.slice(3));
const A3_CHECK = mulVec(A3, col(A3_INV, 0));
/** Beat 6: the first row operation as an elementary matrix. */
const STEP1 = AI_RED.steps[0];
const E1 = applyRowOp(I3, STEP1);
const E1A = mul(E1, A3);

/** Beat 8: socks and shoes, with a shear and a rotation. */
const SA = mat([[1, 1], [0, 1]]);
const RB = mat([[0, -1], [1, 0]]);
const SA_INV = inverse(SA);
const RB_INV = inverse(RB);

/** Beat 12: a tall matrix with independent columns. */
const TALL = mat([[1, 2], [0, 1], [1, 3]]);
const TALL_FWD = rref(TALL).steps.filter((st) => st.phase === 'forward');

/** Beat 7 choices. */
const SWAP12 = applyRowOp(I3, { op: 'swap', i: 0, j: 1 });
const CYCLE = mat([[0, 1, 0], [0, 0, 1], [1, 0, 0]]);
const ADD21 = applyRowOp(I3, { op: 'add', i: 0, j: 1, k: F(1) });

// ---------------------------------------------------------------- workout: A⁻¹ of a 3×3

function inverseItem(A0) {
  const A = mat(A0);
  const n = A.length;
  const aug = A.map((row, i) => [...row, ...identity(n)[i]]);
  const red = rref(aug, { augmented: n });
  const Ainv = red.R.map((row) => row.slice(n));
  const ops = red.steps.map((st) => `$${texRowOp(st)}$`);
  const half = Math.ceil(red.steps.length / 2);
  return {
    prompt: `Find $A^{-1}$ for $A = ${texMat(A)}$.`,
    answer: { type: 'matrix', value: strs(Ainv) },
    hints: [
      `Row reduce $[A \\mid I] = ${texMat(aug, { augment: n })}$. Start with $${texRowOp(red.steps[0])}$.`,
      `After ${ops.slice(0, half).join(', ')} you have $${texMat(red.steps[half - 1].after, { augment: n })}$.`,
      'Finish turning the left block into $I$; scale any pivot that isn\'t $1$, then clear upward. The right block is $A^{-1}$.',
    ],
    solution: [
      `Row reduce $[A \\mid I] = ${texMat(aug, { augment: n })}$, one operation at a time:`,
      ...red.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after, { augment: n })}$`),
      `The left block is $I$, so the right block is $A^{-1} = ${texMat(Ainv)}$.`,
      `Check: $AA^{-1} = ${texMat(mul(A, Ainv))} = I$.`,
    ],
  };
}
const WO = inverseItem([[1, 0, 1], [0, 1, 1], [1, 1, 1]]);

/** Random unimodular 3×3 (a product of integer elementary matrices), so A⁻¹ is an integer matrix. */
function generateInverse(rand) {
  for (;;) {
    let A = identity(3);
    const k = rand.int(3, 4);
    for (let s = 0; s < k; s++) {
      const i = rand.int(0, 2);
      let j = rand.int(0, 2);
      if (j === i) j = (i + 1) % 3;
      A = rand() < 0.2 ? applyRowOp(A, { op: 'swap', i, j }) : applyRowOp(A, { op: 'add', i, j, k: F(rand.pick([-2, -1, 1, 2])) });
    }
    const flat = A.flat();
    if (flat.filter((x) => !x.zero).length < 6 || flat.some((x) => x.abs().cmp(4) > 0)) continue;
    const Ainv = inverse(A);
    if (!Ainv || Ainv.flat().some((x) => !x.isInt || x.abs().cmp(9) > 0)) continue;
    if (eqMat(A, identity(3))) continue;
    const steps = rref(A.map((row, i) => [...row, ...identity(3)[i]]), { augmented: 3 }).steps;
    if (steps.some((st) => st.after.some((row) => row.some((x) => !x.isInt)))) continue;
    return inverseItem(A.map((r) => r.map(Number)));
  }
}

// ---------------------------------------------------------------- scene builders

/** Beats 5 and 15: [A | I]. */
const bigAug = (s, rows, opts = {}) => s.matrix(rows, { x: 360, y: 220, size: 40, augment: 3, ...opts });

const IMT = [
  ['a', 'A \\text{ invertible}'],
  ['b', 'A \\sim I_n'],
  ['c', 'n \\text{ pivot positions}'],
  ['d', 'A\\mathbf{x} = \\mathbf{0} \\Rightarrow \\mathbf{x} = \\mathbf{0}'],
  ['e', '\\text{independent columns}'],
  ['f', '\\mathbf{x} \\mapsto A\\mathbf{x} \\text{ one-to-one}'],
  ['g', 'A\\mathbf{x} = \\mathbf{b} \\text{ always solvable}'],
  ['h', '\\text{columns span } \\mathbb{R}^n'],
  ['i', '\\mathbf{x} \\mapsto A\\mathbf{x} \\text{ onto}'],
  ['j', 'CA = I, \\text{ some } C'],
  ['k', 'AD = I, \\text{ some } D'],
  ['l', 'A^T \\text{ invertible}'],
];
/** IMT statements in two columns around the "n pivots" hub. */
function imtLayout(s, visible) {
  const cy = 280;
  const hub = s.tex('n \\text{ pivots}', { x: 480, y: cy, size: 34, color: C.yellow, visible });
  const ring = s.circle(480, cy, 88, { color: C.yellow, width: 4, visible });
  const square = s.text('Let $A$ be a **square** $n \\times n$ matrix. These are equivalent:', { x: 480, y: 552, size: 30, color: C.muted, visible });
  const items = IMT.map(([id, tx], k) => {
    const left = k < 6;
    const y = 65 + (k % 6) * 86;
    const mob = s.tex(`\\text{(${id})}\\ ${tx}`, { x: left ? 40 : 920, y, size: 30, anchor: [left ? 0 : 1, 0.5], visible });
    return { id, mob, left, y };
  });
  const arrows = items.map(({ mob, left, y }) => {
    const b = mob.box();
    const ex = left ? b.x + b.w + 12 : b.x - 12;
    const ang = Math.atan2(y - cy, ex - 480);
    return s.line(480 + 92 * Math.cos(ang), cy + 92 * Math.sin(ang), ex, y, { color: C.muted, width: 2, visible });
  });
  return { hub, ring, square, items, arrows };
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'inverses',
  title: 'Inverses and the Invertible Matrix Theorem',
  goals: [
    'Understand $A^{-1}$ as the map that undoes $A$, and use the $2 \\times 2$ formula with $ad - bc$',
    'Solve $A\\mathbf{x} = \\mathbf{b}$ as $\\mathbf{x} = A^{-1}\\mathbf{b}$, and know when row reduction is the better tool',
    'Find $A^{-1}$ by row reducing $[A \\mid I]$, and see row operations as elementary matrices',
    'Use $(AB)^{-1} = B^{-1}A^{-1}$ and the Invertible Matrix Theorem for square matrices',
  ],
  beats: [
    // 1
    {
      id: 'undo',
      title: 'Undoing a map',
      scene(s) {
        const p = s.plane({ x: 665, y: 300, width: 430, range: [-2, 7, -1, 6], names: ['x_1', 'x_2'], visible: false });
        const shape = p.polygon(LETTER, { color: C.blue, visible: false });
        const At = s.tex(`A = ${texMat(A2)}`, { x: 210, y: 100, size: 36, visible: false });
        const Ait = s.tex(`A^{-1} = ${texMat(A2_INV)}`, { x: 210, y: 220, size: 36, color: C.green, visible: false });
        const id = s.tex('A^{-1}A = I = AA^{-1}', { x: 210, y: 325, size: 32, color: C.green, visible: false });
        const Bt = s.tex(`\\text{squash: } ${texMat(SING)}`, { x: 210, y: 435, size: 32, color: C.yellow, visible: false });
        const no = s.text('no way back', { x: 210, y: 525, size: 30, weight: 600, color: C.yellow, visible: false });
        return { p, shape, At, Ait, id, Bt, no };
      },
      steps: [
        {
          say: 'Some maps can be undone. This matrix $A${A} stretches and shears the F. Is there a matrix that puts every point back where it started?',
          do: async (s, o) => {
            await s.all(o.p.draw(), o.shape.draw({ delay: 300 }), o.At.write());
            await o.p.applyMatrix(A2, { duration: 1800 });
          },
        },
        {
          say: 'Yes: the inverse, $A^{-1}${A inverse}. Doing $A${A} and then $A^{-1}${A inverse} changes nothing, and so does the other order: $A^{-1}A = I${A inverse A equals I} and $AA^{-1} = I${A A inverse equals I}.',
          do: async (s, o) => {
            await o.Ait.write();
            await o.p.applyMatrix(A2_INV, { duration: 1800 });
            await s.all(o.shape.flash({ color: C.green }), o.id.write());
          },
        },
        {
          say: 'But a map that squashes the plane onto a line can\'t be undone. Many points land on the same spot, and no matrix can tell them apart again.',
          do: async (s, o) => {
            await o.Bt.fadeIn();
            await o.p.applyMatrix(SING, { duration: 1800 });
            await s.all(o.shape.flash(), o.no.fadeIn());
          },
        },
      ],
    },

    // 2
    {
      id: 'two-by-two',
      title: 'The 2×2 formula (Theorem 4)',
      scene(s) {
        const sym = s.tex('A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', { x: 190, y: 130, size: 40, visible: false });
        const arrow = s.arrow(340, 130, 430, 130, { color: C.muted, width: 4, visible: false });
        const frac = s.tex('\\frac{1}{ad - bc}', { x: 540, y: 130, size: 40, color: C.yellow, visible: false });
        const m = s.matrix([['a', 'b'], ['c', 'd']], { x: 730, y: 130, size: 40, visible: false });
        const det0 = s.tex('ad - bc = 0 \\;\\Rightarrow\\; \\text{no inverse}', { x: 480, y: 250, size: 34, color: C.yellow, visible: false });
        const num = s.tex(`A = ${texMat(A2)}`, { x: 160, y: 380, size: 36, visible: false });
        const nfrac = s.tex(`\\frac{1}{${pf(A2[0][0])}${pf(A2[1][1])} - ${pf(A2[0][1])}${pf(A2[1][0])}} = \\frac{1}{${t(A2_DET)}}`, { x: 455, y: 380, size: 32, color: C.yellow, visible: false });
        const nm = s.matrix(A2, { x: 770, y: 380, size: 40, visible: false });
        const check = s.tex(`${texMat(A2)}${texMat(A2_INV)} = \\col{green}{${texMat(mul(A2, A2_INV))}}`, { x: 480, y: 520, size: 32, visible: false });
        return { sym, arrow, frac, m, det0, num, nfrac, nm, check };
      },
      steps: [
        {
          say: 'For two by two matrices there\'s a formula. Swap the two diagonal entries, negate the two off-diagonal ones, and divide by $ad - bc${a d minus b c}.',
          do: async (s, o) => {
            await o.sym.write();
            await s.all(o.arrow.draw(), o.m.fadeIn());
            await s.all(o.m.highlightCell(0, 0, C.blue), o.m.highlightCell(1, 1, C.blue));
            await s.all(o.m.setEntry(0, 0, 'd'), o.m.setEntry(1, 1, 'a'));
            await s.all(o.m.clearHighlights(), o.m.highlightCell(0, 1, C.red), o.m.highlightCell(1, 0, C.red));
            await s.all(o.m.setEntry(0, 1, '-b'), o.m.setEntry(1, 0, '-c'));
            await s.all(o.m.clearHighlights(), o.frac.fadeIn({ shift: [0, -12] }));
          },
        },
        {
          say: 'That number $ad - bc${a d minus b c} is the determinant of $A${A}. If it\'s zero, you\'d be dividing by zero, and in fact there is no inverse at all.',
          do: async (s, o) => {
            await o.frac.indicate();
            await o.det0.write();
          },
        },
        {
          say: 'Try it on our matrix. Two times three minus five times one is $1${one}. Swap the two and the three, negate the five and the one, and that\'s $A^{-1}${A inverse}.',
          do: async (s, o) => {
            await o.num.write();
            await o.nfrac.write();
            await o.nm.fadeIn();
            await s.all(o.nm.setEntry(0, 0, A2_INV[0][0]), o.nm.setEntry(1, 1, A2_INV[1][1]));
            await s.all(o.nm.setEntry(0, 1, A2_INV[0][1]), o.nm.setEntry(1, 0, A2_INV[1][0]));
            paintGreen(o.nm);
          },
        },
        {
          say: 'Always check by multiplying. $A${A} times $A^{-1}${A inverse} gives the identity.',
          do: (s, o) => o.check.write({ duration: 1200 }),
        },
      ],
    },

    // 3
    {
      id: 'solve-with-inverse',
      title: 'Solving with the inverse (Theorem 5)',
      scene(s) {
        const lines = [
          s.tex('A\\mathbf{x} = \\mathbf{b}', { x: 230, y: 90, size: 40, visible: false }),
          s.tex('\\col{green}{A^{-1}}A\\mathbf{x} = \\col{green}{A^{-1}}\\mathbf{b}', { x: 230, y: 170, size: 40, visible: false }),
          s.tex('\\mathbf{x} = A^{-1}\\mathbf{b}', { x: 230, y: 250, size: 44, visible: false }),
        ];
        const uniq = s.text('one solution, for every $\\mathbf{b}$', { x: 230, y: 330, size: 30, color: C.muted, visible: false });
        const ex = s.tex(`\\mathbf{x} = ${texMat(A2_INV)}${texVec(B2)} = \\col{green}{${texVec(X2)}}`, { x: 670, y: 150, size: 34, visible: false });
        const ck = A2.map((row, i) => s.tex(`${t(row[0])}${pf(X2[0])} + ${t(row[1])}${pf(X2[1])} = ${t(B2[i])}\\ \\col{green}{\\checkmark}`, { x: 690, y: 280 + 60 * i, size: 32, visible: false }));
        const cost = s.text('In practice: row reduce $[A \\mid \\mathbf{b}]$. It is faster and more accurate than computing $A^{-1}$.', { x: 480, y: 500, size: 30, width: 760, color: C.muted, visible: false });
        return { lines, uniq, ex, ck, cost };
      },
      steps: [
        {
          say: 'If $A${A} is invertible, solving $A\\mathbf{x} = \\mathbf{b}${A x equals b} is one move: multiply both sides by $A^{-1}${A inverse}, on the left. That leaves $\\mathbf{x} = A^{-1}\\mathbf{b}${x equals A inverse b}.',
          do: (s, o) => s.stagger(o.lines.map((l) => () => l.write()), 1200),
        },
        {
          say: 'So the solution exists for every $\\mathbf{b}${b}, and it\'s unique. With $\\mathbf{b} = (1, 2)${b equals one, two}, we get $\\mathbf{x} = (-7, 3)${x equals minus seven, three}. Check it in both equations.',
          do: async (s, o) => {
            await o.uniq.fadeIn();
            await o.ex.write({ duration: 1200 });
            await s.stagger(o.ck.map((c) => () => c.write()), 900);
          },
        },
        {
          say: 'A word of warning: in practice, row reduction is faster than finding $A^{-1}${A inverse} first. The inverse formula is a tool for theory, and for small examples.',
          do: (s, o) => o.cost.fadeIn(),
        },
      ],
    },

    // 4
    {
      id: 'fill-2x2',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks with the two by two formula.',
      lines: [
        [
          `${texMat(Q)}^{-1} = `,
          {
            tex: '\\frac{1}{\\blank{det}} \\begin{bmatrix} \\blank{a} & \\blank{b} \\\\ \\blank{c} & \\blank{d} \\end{bmatrix}',
            blanks: {
              det: { answer: { type: 'number', value: String(Q_DET) }, hint: '$ad - bc$.' },
              ...Object.fromEntries(Q_ADJ.flatMap((row, i) => row.map((x, j) => ['abcd'[2 * i + j], { answer: { type: 'number', value: String(x) }, hint: i === j ? 'Swap the two diagonal entries.' : 'Negate the off-diagonal entries.' }]))),
            },
          },
        ],
      ],
      solution: [
        `$ad - bc = ${pf(Q[0][0])}${pf(Q[1][1])} - ${pf(Q[0][1])}${pf(Q[1][0])} = ${t(Q_DET)}$.`,
        `Swap the diagonal and negate the off-diagonal: $${texMat(Q)}^{-1} = \\frac{1}{${t(Q_DET)}}${texMat(Q_ADJ)} = ${texMat(inverse(Q))}$.`,
      ],
    },

    // 5
    {
      id: 'algorithm',
      title: 'Finding the inverse: row reduce [A | I]',
      scene(s) {
        const m = bigAug(s, AI, { visible: false });
        const lA = s.tex('A', { x: m.colBox(1).cx, y: m.box().y - 32, size: 36, color: C.muted, visible: false });
        const lI = s.tex('I', { x: m.colBox(4).cx, y: m.box().y - 32, size: 36, color: C.muted, visible: false });
        const done = s.tex('[\\,I \\mid \\col{green}{A^{-1}}\\,]', { x: 790, y: 220, size: 40, visible: false });
        const fail = s.text('If $A$ does not reduce to $I$, then $A$ is not invertible.', { x: 480, y: 470, size: 30, color: C.yellow, visible: false });
        const check = s.tex(`A${texVec(col(A3_INV, 0))} = ${texVec(A3_CHECK)} = \\mathbf{e}_1\\ \\col{green}{\\checkmark}`, { x: 480, y: 470, size: 32, visible: false });
        return { m, lA, lI, done, fail, check };
      },
      steps: [
        {
          say: 'For bigger matrices we use row reduction. Write the identity next to $A${A}: the augmented matrix $[A \\mid I]${A augmented with I}.',
          do: async (s, o) => {
            await s.all(o.m.fadeIn(), o.lA.fadeIn(), o.lI.fadeIn({ delay: 300 }));
            await s.all([3, 4, 5].map((j) => o.m.highlightCol(j, C.blue, { delay: (j - 3) * 120 })));
          },
        },
        {
          say: 'Now row reduce $A${A} all the way to $I${I}. The same operations, applied to the right half, turn $I${I} into $A^{-1}${A inverse}.',
          do: async (s, o) => {
            await o.m.clearHighlights();
            for (const st of AI_RED.steps) await o.m.rowOp(st, { duration: 800 });
            await o.m.note();
            await s.all([3, 4, 5].map((j) => o.m.highlightCol(j, C.green)), o.done.write(), o.lA.swap('I'), o.lI.swap('\\col{green}{A^{-1}}'));
          },
        },
        {
          say: 'If the left half can\'t be reduced to $I${I}, because a pivot is missing, then $A${A} has no inverse, and the algorithm tells you so.',
          do: (s, o) => o.fail.fadeIn(),
        },
        {
          say: 'Check one column. $A${A} times the first column of the answer should be $\\mathbf{e}_1${e one}, and it is.',
          do: async (s, o) => {
            await o.fail.fadeOut();
            await o.check.write({ duration: 1200 });
          },
        },
      ],
    },

    // 6
    {
      id: 'elementary',
      title: 'Why it works: elementary matrices',
      scene(s) {
        const Em = s.matrix(I3, { x: 150, y: 215, size: 34, visible: false });
        const lE = s.tex('E', { x: 150, y: 70, size: 36, color: C.muted, visible: false });
        const Am = s.matrix(A3, { x: 390, y: 215, size: 34, visible: false });
        const eq = s.tex('=', { x: 520, y: 215, size: 40, visible: false });
        const EAm = s.matrix(E1A, { x: 660, y: 215, size: 34, visible: false });
        const lEA = s.tex('EA', { x: 660, y: 70, size: 36, color: C.muted, visible: false });
        const op = s.tex(`\\text{same as } ${texRowOp(STEP1)}`, { x: 660, y: 352, size: 30, color: C.yellow, visible: false });
        const chain = s.tex('E_k \\cdots E_2E_1\\,A = I', { x: 480, y: 430, size: 38, visible: false });
        const inv = s.tex('A^{-1} = E_k \\cdots E_2E_1 = E_k \\cdots E_2E_1\\,\\col{green}{I}', { x: 480, y: 515, size: 38, visible: false });
        return { Em, lE, Am, eq, EAm, lEA, op, chain, inv };
      },
      steps: [
        {
          say: 'Here\'s why it works. Do one row operation, $R_3 \\to R_3 - 2R_1${R three becomes R three minus two R one}, to the identity, and call the result $E${E}, an elementary matrix. Multiplying by $E${E} on the left does that same row operation to any $A${A}.',
          do: async (s, o) => {
            await s.all(o.Em.fadeIn(), o.lE.fadeIn());
            await o.Em.rowOp(STEP1, { note: false });
            await s.all(o.Am.fadeIn(), o.eq.fadeIn(), o.lEA.fadeIn());
            await o.EAm.fadeIn();
            await s.all(o.EAm.highlightRow(STEP1.i, C.yellow), o.Em.highlightRow(STEP1.i, C.yellow), o.op.fadeIn());
          },
        },
        {
          say: 'Reducing $A${A} to $I${I} is a string of row operations, so it\'s a product of elementary matrices with $E_k \\cdots E_1A = I${E k through E one times A equals I}. That product is exactly $A^{-1}${A inverse}.',
          do: async (s, o) => {
            await o.chain.write();
            await o.chain.indicate({ color: C.green, scale: 1.05 });
          },
        },
        {
          say: 'And applying that same product to $I${I} gives $A^{-1}${A inverse} itself. That\'s precisely what the right half of $[A \\mid I]${A augmented with I} records.',
          do: (s, o) => o.inv.write({ duration: 1300 }),
        },
      ],
    },

    // 7
    {
      id: 'try-elementary',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Do the operation to the identity and see what you get.',
      prompt: 'Which matrix $E$ makes $EA$ swap rows 1 and 2 of any $3 \\times 3$ matrix $A$?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: `$${texMat(CYCLE)}$`, why: 'That moves row 2 up, row 3 up, and row 1 to the bottom: it cycles all three rows.' },
        { id: 'b', label: `$${texMat(SWAP12)}$`, why: 'Right: it is $I$ with rows 1 and 2 swapped, so $EA$ is $A$ with rows 1 and 2 swapped.' },
        { id: 'c', label: `$${texMat(ADD21)}$`, why: 'That is $I$ after $R_1 \\to R_1 + R_2$: it adds row 2 to row 1, it doesn\'t swap them.' },
      ],
      hint: 'An elementary matrix is the identity with the row operation already done to it.',
      solution: [
        `Do the operation to $I$: swapping rows 1 and 2 of $I_3$ gives $E = ${texMat(SWAP12)}$.`,
        'Row 1 of $EA$ is $(0, 1, 0)$ times $A$, which is row 2 of $A$; row 2 of $EA$ is row 1 of $A$; row 3 is unchanged.',
      ],
    },

    // 8
    {
      id: 'products-inverse',
      title: 'Inverse of a product',
      scene(s) {
        const p = s.plane({ x: 690, y: 300, width: 400, range: [-3, 3, -3, 3], names: ['x_1', 'x_2'], visible: false });
        const shape = p.polygon(LETTER.map(([a, b]) => [a * 1.5, b * 1.5]), { color: C.blue, visible: false });
        const doA = s.tex(`\\text{socks: } A = ${texMat(SA)}`, { x: 230, y: 75, size: 30, visible: false });
        const doB = s.tex(`\\text{shoes: } B = ${texMat(RB)}`, { x: 230, y: 170, size: 30, visible: false });
        const undoB = s.tex('\\text{off: } B^{-1} \\text{ first, then } A^{-1}', { x: 230, y: 250, size: 30, color: C.green, visible: false });
        const rule = s.tex('(BA)^{-1} = A^{-1}B^{-1}', { x: 230, y: 315, size: 34, color: C.green, visible: false });
        const card = s.defCard({
          x: 690, y: 300, kind: 'theorem', title: 'Theorem 6 (A, B invertible n × n)',
          tex: '\\begin{aligned} &\\text{(a) } (A^{-1})^{-1} = A \\\\ &\\text{(b) } \\part{b}{(AB)^{-1} = B^{-1}A^{-1}} \\\\ &\\text{(c) } \\part{c}{(A^T)^{-1} = (A^{-1})^T} \\end{aligned}',
          visible: false,
        });
        return { p, shape, doA, doB, undoB, rule, card };
      },
      steps: [
        {
          say: 'Think of socks and shoes. You put on your socks, $A${A}, then your shoes, $B${B}. Together that\'s $BA${B A}.',
          do: async (s, o) => {
            await s.all(o.p.draw(), o.shape.draw({ delay: 300 }));
            await o.doA.write();
            await o.p.applyMatrix(SA, { duration: 1300 });
            await o.doB.write();
            await o.p.applyMatrix(RB, { duration: 1300 });
          },
        },
        {
          say: 'To take them off, the shoes come off first. Undo the last move first: $B^{-1}${B inverse}, then $A^{-1}${A inverse}. So the inverse of a product is the product of the inverses in reverse order.',
          do: async (s, o) => {
            await o.undoB.write();
            await o.p.applyMatrix(RB_INV, { duration: 1300 });
            await o.p.applyMatrix(SA_INV, { duration: 1300 });
            await s.all(o.shape.flash({ color: C.green }), o.rule.write());
          },
        },
        {
          say: 'Theorem six collects the rules for invertible $n${n} by $n${n} matrices. In Lay\'s letters, the inverse of $AB${A B} is $B^{-1}A^{-1}${B inverse A inverse}. And the transpose of an inverse is the inverse of the transpose, so you can do those two in either order.',
          do: async (s, o) => {
            await o.p.fadeOut();
            await o.card.reveal();
            await s.ring([o.card, 'b'], { color: 'green', shape: 'box' });
            await s.ring([o.card, 'c'], { color: 'blue', shape: 'box' });
          },
        },
      ],
    },

    // 9
    {
      id: 'wo-inverse',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Row reduce A next to the identity, and check your answer by multiplying.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateInverse,
    },

    // 10
    {
      id: 'imt',
      title: 'The Invertible Matrix Theorem',
      scene(s) {
        return imtLayout(s, false);
      },
      steps: [
        {
          say: 'Now the big one. For a square $n${n} by $n${n} matrix, Lay lists twelve statements, and they are all equivalent: either every one is true, or every one is false.',
          do: async (s, o) => {
            await o.square.fadeIn();
            await s.stagger([0, 1, 9, 10, 11].map((k) => () => o.items[k].mob.fadeIn({ shift: [o.items[k].left ? -12 : 12, 0] })), 350);
          },
        },
        {
          say: 'The hub that connects them is the pivots: $A${A} has $n${n} pivot positions. Everything we know about pivots links each statement to that one.',
          do: async (s, o) => {
            await s.all(o.ring.draw(), o.hub.fadeIn());
            await s.stagger(o.items.map((it, k) => () => s.all(o.arrows[k].draw({ duration: 500 }), it.mob.state.opacity > 0 ? null : it.mob.fadeIn())), 160);
          },
        },
        {
          say: 'Look at (f) and (i). For a square matrix, one-to-one and onto are the same fact: $n${n} pivots means a pivot in every column and in every row.',
          do: async (s, o) => {
            o.rings = [s.ring(o.items[5].mob, { color: C.green, shape: 'box' })];
            await o.rings[0];
            o.rings.push(s.ring(o.items[8].mob, { color: C.green, shape: 'box' }));
            await o.rings[1];
          },
        },
        {
          say: 'And when $A${A} is singular, with fewer than $n${n} pivots, every statement on the list fails together.',
          do: async (s, o) => {
            await s.all(o.hub.swap('< n \\text{ pivots}'), o.hub.scaleTo(0.8), o.rings.map((r) => r.fadeOut()));
            await s.all(o.items.map((it) => it.mob.recolor(C.muted)), o.arrows.map((a) => a.recolor(C.faint)));
          },
        },
      ],
    },

    // 11
    {
      id: 'try-imt',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Find the statement of the theorem this hypothesis matches, then select everything that must be true.',
      prompt: '$A$ is $4 \\times 4$ and $A\\mathbf{x} = \\mathbf{0}$ has only the trivial solution. Select **every** statement that must be true.',
      answer: { type: 'multi', value: ['a', 'b', 'd'] },
      choices: [
        { id: 'a', label: 'The columns of $A$ span $\\mathbb{R}^4$', why: 'True: (d) of the IMT holds, so (h) holds too.' },
        { id: 'b', label: '$A^T$ is invertible', why: 'True: statement (l) of the IMT.' },
        { id: 'c', label: '$A$ has a zero row', why: 'Then it would have fewer than 4 pivots, and $A\\mathbf{x} = \\mathbf{0}$ would have a free variable.' },
        { id: 'd', label: '$A\\mathbf{x} = \\mathbf{b}$ has exactly one solution for every $\\mathbf{b}$', why: 'True: $A$ is invertible, and $\\mathbf{x} = A^{-1}\\mathbf{b}$ is the only solution.' },
        { id: 'e', label: '$A = I$', why: 'Many matrices are invertible; nothing forces $A$ to be the identity.' },
      ],
      hint: 'The hypothesis is statement (d) of the IMT, and $A$ is square.',
      solution: [
        '"$A\\mathbf{x} = \\mathbf{0}$ has only the trivial solution" is statement (d), and $A$ is square, so the IMT says **all** its statements hold.',
        'So the columns span $\\mathbb{R}^4$ (h), $A^T$ is invertible (l), and $A\\mathbf{x} = \\mathbf{b}$ has the unique solution $A^{-1}\\mathbf{b}$ (Theorem 5).',
        'A zero row would leave fewer than 4 pivots, contradicting (c); and $A = I$ is just one of infinitely many invertible matrices.',
      ],
    },

    // 12
    {
      id: 'mistake-nonsquare',
      title: 'The trap: non-square matrices',
      scene(s) {
        const m = s.matrix(TALL, { x: 220, y: 270, size: 44, visible: false });
        const lab = s.tex('3 \\times 2', { x: 220, y: 100, size: 36, color: C.muted, visible: false });
        const ok = s.tex('\\text{one-to-one } \\col{green}{\\checkmark}', { x: 640, y: 160, size: 34, visible: false });
        const no = s.tex('\\text{not onto } \\mathbb{R}^3 \\ \\col{yellow}{\\times}', { x: 640, y: 240, size: 34, visible: false });
        const inv = s.tex('\\text{no two-sided inverse}', { x: 640, y: 320, size: 34, visible: false });
        const stamp = s.stamp('IMT does not apply: not square', { x: 480, y: 480, color: 'yellow', size: 34, rotate: -3 });
        return { m, lab, ok, no, inv, stamp };
      },
      steps: [
        {
          say: 'Here\'s the trap. Row reduce this three by two matrix: there\'s a pivot in each column, so its columns are independent and $\\mathbf{x} \\mapsto A\\mathbf{x}${x maps to A x} is one-to-one. Does the theorem now give us everything else?',
          do: async (s, o) => {
            await s.all(o.m.fadeIn(), o.lab.fadeIn());
            for (const st of TALL_FWD) await o.m.rowOp(st, { duration: 700 });
            await o.m.note();
            await s.all(o.m.pivot(0, 0), o.m.pivot(1, 1));
            await o.ok.write();
          },
        },
        {
          say: 'No. The Invertible Matrix Theorem is only for square matrices. A tall matrix like this one can be one-to-one without being onto, and it has no two-sided inverse at all.',
          do: async (s, o) => {
            await s.all(o.m.highlightRow(2, C.yellow), o.no.write());
            await o.inv.write();
            await o.stamp.slam();
          },
        },
      ],
    },

    // 13
    {
      id: 'try-product-inv',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Peel off one matrix at a time, and watch which side you multiply on.',
      prompt: 'Solve for $X$: $AXB = C$, where $A$ and $B$ are invertible.',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '$X = A^{-1}CB^{-1}$', why: 'Right: multiply by $A^{-1}$ on the left and by $B^{-1}$ on the right.' },
        { id: 'b', label: '$X = CA^{-1}B^{-1}$', why: 'Matrices don\'t commute: $A$ sits on the left of $X$, so $A^{-1}$ must multiply on the *left*.' },
        { id: 'c', label: '$X = B^{-1}CA^{-1}$', why: 'Sides swapped: $A^{-1}$ goes on the left and $B^{-1}$ on the right.' },
      ],
      hint: 'Multiply both sides by $A^{-1}$ on the left. What is left next to $X$?',
      solution: [
        'Left-multiply both sides by $A^{-1}$: $A^{-1}AXB = A^{-1}C$, so $XB = A^{-1}C$.',
        'Right-multiply by $B^{-1}$: $XBB^{-1} = A^{-1}CB^{-1}$, so $X = A^{-1}CB^{-1}$.',
      ],
    },

    // 14
    {
      id: 'cp-imt',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: 'For a square matrix $A$, why does "the columns are linearly independent" force "the columns span $\\mathbb{R}^n$"?',
      points: [
        'Independent columns mean $A\\mathbf{x} = \\mathbf{0}$ has no free variables: a pivot in every column',
        'A square matrix has $n$ columns and $n$ rows, so $n$ pivots also means a pivot in every row',
        'A pivot in every row is exactly the condition for the columns to span $\\mathbb{R}^n$',
        'This fails for non-square matrices, which is why the IMT needs $A$ square',
      ],
    },

    // 15
    {
      id: 'summary-inverse',
      title: 'Summary',
      scene(s) {
        const m = bigAug(s, AI, { x: 290, y: 200, size: 34 });
        const hub = s.tex('n \\text{ pivots}', { x: 760, y: 200, size: 36, color: C.yellow, visible: false });
        const ring = s.circle(760, 200, 84, { color: C.yellow, width: 4, visible: false });
        const words = ['invertible', 'one-to-one', 'onto'].map((w, k) => s.text(w, { x: 760, y: 330 + 50 * k, size: 30, visible: false }));
        const items = [
          s.tex('A^{-1}A = I = AA^{-1}', { x: 290, y: 350, size: 34, visible: false }),
          s.tex('[A \\mid I] \\sim [I \\mid A^{-1}]', { x: 290, y: 420, size: 34, visible: false }),
        ];
        const thm9 = s.tex('\\begin{gathered}\\text{Theorem 9: } T \\text{ invertible} \\Leftrightarrow A \\text{ invertible} \\\\ T^{-1}(\\mathbf{x}) = A^{-1}\\mathbf{x}\\end{gathered}', { x: 480, y: 515, size: 30, color: C.green, visible: false });
        return { m, hub, ring, words, items, thm9 };
      },
      steps: [
        {
          say: 'The inverse undoes a map: $A^{-1}${A inverse} puts back every point that $A${A} moved. That\'s Theorem nine: the map $\\mathbf{x} \\mapsto A\\mathbf{x}${x maps to A x} is invertible exactly when $A${A} is, and its inverse is $\\mathbf{x} \\mapsto A^{-1}\\mathbf{x}${x maps to A inverse x}.',
          do: async (s, o) => {
            await o.items[0].write();
            await o.thm9.write({ duration: 1400 });
          },
        },
        {
          say: 'To compute it, row reduce $[A \\mid I]${A augmented with I} until the left half is the identity. The right half is then $A^{-1}${A inverse}.',
          do: async (s, o) => {
            for (const st of AI_RED.steps) await o.m.rowOp(st, { duration: 450 });
            await s.all(o.m.note(), [3, 4, 5].map((j) => o.m.highlightCol(j, C.green)), o.items[1].write());
          },
        },
        {
          say: 'And for square matrices, invertible, one-to-one, onto, and $n${n} pivots are all the same fact. Next, we\'ll factor a matrix into simpler pieces.',
          do: async (s, o) => {
            await s.all(o.ring.draw(), o.hub.fadeIn());
            await s.stagger(o.words.map((w) => () => w.fadeIn()), 300);
          },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------- step helpers

/** Colors every entry of a matrix mob green (the answer). */
function paintGreen(m) {
  for (let i = 0; i < m.m; i++) for (let j = 0; j < m.n; j++) m.cell(i, j).style.color = C.green;
}
