/**
 * Lecture 7 · Matrix operations (Lay 2.1). Design: matrix/PLAN.md § 7.
 * Every matrix, product and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, mul, add, sub, transpose, eqMat, col, texMat, texVec } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
const pair = (v) => `(${v.map(t).join(', ')})`;
const nums = (v) => v.map(Number);
const strs = (M) => M.map((r) => r.map(String));

/** Beat 1: entrywise operations. */
const A = mat([[1, 2], [3, -1]]);
const B2 = mat([[2, 0], [-1, 3]]);
const SUM = add(A, B2);

/** Beats 2, 6, 14: rotate, then shear. */
const R = mat([[0, -1], [1, 0]]);
const S = mat([[1, 1], [0, 1]]);
const SR = mul(S, R);
const RS = mul(R, S);
const XV = [1, 1];
const SR_E1 = col(SR, 0);
const SR_E2 = col(SR, 1);
/** The letter F, small enough that both orders stay on a ±3 plane. */
const LETTER = [[0, 0], [0, 2], [1.25, 2], [1.25, 1.6], [0.4, 1.6], [0.4, 1.2], [1, 1.2], [1, 0.8], [0.4, 0.8], [0.4, 0]].map(([a, b]) => [a * 0.75, b * 0.75]);

/** Beats 3–4: AB column by column and by the row–column rule. */
const B = mat([[2, 0, 1], [1, 3, -1]]);
const AB = mul(A, B);
const BCOL = [C.blue, C.red, C.teal];
/** `2[1;3] + 1[2;-1] = [4;5]`: column j of AB as a combination of the columns of A. */
const combTex = (j) => {
  const w = col(B, j);
  const term = (k) => `${k === 0 ? (w[0].sign() < 0 ? '-' : '') : w[k].sign() < 0 ? ' - ' : ' + '}${w[k].abs().eq(1) ? '' : t(w[k].abs())}${texVec(col(A, k))}`;
  return `= ${term(0)}${term(1)} = \\col{green}{${texVec(col(AB, j))}}`;
};
const RC_I = 0, RC_J = 1;
const rcTex = () => {
  const row = A[RC_I], c = col(B, RC_J);
  const prod = row.map((a, k) => `${a.sign() < 0 ? `(${t(a)})` : t(a)} \\cdot ${c[k].sign() < 0 ? `(${t(c[k])})` : t(c[k])}`).join(' + ');
  return `(AB)_{${RC_I + 1}${RC_J + 1}} = ${prod} = \\col{green}{${t(AB[RC_I][RC_J])}}`;
};

/** Beat 7: a zero product of nonzero matrices. */
const ZA = mat([[1, 1], [1, 1]]);
const ZB = mat([[1, -1], [-1, 1]]);
const ZP = mul(ZA, ZB);

/** Beat 8. */
const PA = mat([[1, -2], [0, 3], [2, 1]]);
const PB = mat([[3, 1], [-1, 2]]);
const PP = mul(PA, PB);

/** Beat 9. */
const TM = mat([[1, 2, 0], [3, -1, 4]]);
const TMT = transpose(TM);

// ---------------------------------------------------------------- workout: AB − BA

function commItem(A0, B0) {
  const a = mat(A0), b = mat(B0);
  const ab = mul(a, b), ba = mul(b, a), d = sub(ab, ba);
  const rowCol = (M, N, i, j) => M[i].map((x, k) => `(${t(x)})(${t(N[k][j])})`).join(' + ');
  const worked = (M, N) => `\\begin{bmatrix}${M.map((_, i) => N[0].map((_, j) => rowCol(M, N, i, j)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
  return {
    prompt: `Let $A = ${texMat(a)}$ and $B = ${texMat(b)}$. Compute $AB - BA$.`,
    answer: { type: 'matrix', value: strs(d) },
    hints: [
      `Row–column rule: $(AB)_{11} = ${rowCol(a, b, 0, 0)}$. All of $AB$ is $${texMat(ab)}$.`,
      'Now $BA$: rows of $B$ against columns of $A$. It is a different computation, not $AB$ again.',
    ],
    solution: [
      `Row–column rule, every entry: $AB = ${worked(a, b)} = ${texMat(ab)}$.`,
      `Rows of $B$ against columns of $A$: $BA = ${worked(b, a)} = ${texMat(ba)}$.`,
      `$AB - BA = ${texMat(d)}$. It is not the zero matrix, so these two matrices do not commute.`,
    ],
  };
}
const WO = commItem([[2, -1], [1, 3]], [[1, 4], [-2, 0]]);
function generateComm(rand) {
  for (;;) {
    const a = [0, 1].map(() => [0, 1].map(() => rand.int(-3, 3)));
    const b = [0, 1].map(() => [0, 1].map(() => rand.int(-3, 3)));
    if ([...a.flat(), ...b.flat()].filter((x) => x === 0).length > 2) continue;
    if (eqMat(mul(mat(a), mat(b)), mul(mat(b), mat(a)))) continue;
    if (sub(mul(mat(a), mat(b)), mul(mat(b), mat(a))).flat().some((x) => x.abs().cmp(20) > 0)) continue;
    return commItem(a, b);
  }
}

// ---------------------------------------------------------------- scene builders

/** Beats 3–4: A, B, = and AB along the top. */
function productRow(s, { filled, visible }) {
  const mA = s.matrix(A, { x: 130, y: 200, size: 40, visible });
  const mB = s.matrix(B, { x: 370, y: 200, size: 40, visible });
  const eq = s.tex('=', { x: 545, y: 200, size: 44, visible });
  const rows = filled ? AB : AB.map((r) => r.map(() => '\\phantom{-0}'));
  const mAB = s.matrix(rows, { x: 730, y: 200, size: 40, visible });
  const lA = s.tex('A', { x: 130, y: 90, size: 36, color: C.muted, visible });
  const lB = s.tex('B', { x: 370, y: 90, size: 36, color: C.muted, visible });
  const lAB = s.tex('AB', { x: 730, y: 90, size: 36, color: C.muted, visible });
  if (filled) AB.forEach((r, i) => r.forEach((_, j) => (mAB.cell(i, j).style.color = C.green)));
  return { mA, mB, eq, mAB, lA, lB, lAB };
}

/** Beats 6 and 14: one plane showing two maps applied in turn. */
function composePlane(s, x, visible, { y = 290, width = 330 } = {}) {
  const p = s.plane({ x, y, width, range: [-3, 3, -3, 3], labels: false, visible });
  const shape = p.polygon(LETTER, { color: C.blue, visible });
  const b = p.basis({ label: '', visible });
  return { p, shape, b };
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'matrix-ops',
  title: 'Matrix operations',
  goals: [
    'Add, scale and multiply matrices, and know when a product is defined and its size',
    'Read $AB$ as "do $B$, then $A$" and compute it column by column or with the row–column rule',
    'Know the rules that hold and the three that fail: $AB \\neq BA$, no cancellation, zero products',
    'Use the transpose and $(AB)^T = B^TA^T$',
  ],
  beats: [
    // 1
    {
      id: 'entries',
      title: 'Matrices as arrays',
      scene(s) {
        const mA = s.matrix(A, { x: 140, y: 250, size: 44, visible: false });
        const lA = s.tex('A', { x: 140, y: 120, size: 40, visible: false });
        const idx = s.tex('a_{ij} = \\text{entry in row } i,\\ \\text{column } j', { x: 480, y: 440, size: 34, visible: false });
        const a21 = s.tex(`a_{21} = ${t(A[1][0])}`, { x: 140, y: 520, size: 36, color: C.yellow, visible: false });
        const plus = s.tex('+', { x: 288, y: 250, size: 44, visible: false });
        const mB = s.matrix(B2, { x: 435, y: 250, size: 44, visible: false });
        const lB = s.tex('B', { x: 435, y: 120, size: 40, visible: false });
        const eq = s.tex('=', { x: 588, y: 250, size: 44, visible: false });
        const mS = s.matrix(A.map((r) => r.map(() => '\\phantom{0}')), { x: 740, y: 250, size: 44, visible: false });
        const lS = s.tex('A + B', { x: 740, y: 120, size: 40, color: C.green, visible: false });
        const same = s.text('same size, entry by entry', { x: 480, y: 440, size: 32, color: C.muted, visible: false });
        const next = s.tex('AB = \\ ?', { x: 480, y: 470, size: 48, color: C.yellow, visible: false });
        const diagT = s.tex('\\text{main diagonal: } a_{11}, a_{22}, \\dots', { x: 480, y: 440, size: 32, color: C.blue, visible: false });
        const mD = s.matrix([[3, 0], [0, -2]], { x: 480, y: 250, size: 44, visible: false });
        const lD = s.text('diagonal', { x: 480, y: 120, size: 32, visible: false });
        const mZ = s.matrix([[0, 0], [0, 0]], { x: 760, y: 250, size: 44, visible: false });
        const lZ = s.text('zero matrix $0$', { x: 760, y: 120, size: 32, visible: false });
        return { mA, lA, idx, a21, plus, mB, lB, eq, mS, lS, same, next, diagT, mD, lD, mZ, lZ };
      },
      steps: [
        {
          say: 'A matrix is a rectangular array of numbers. Lay writes $a_{ij}${a i j} for the entry in row $i${i}, column $j${j}. So $a_{21}${a two one}, row two, column one, is $3${three}.',
          do: async (s, o) => {
            await s.all(o.mA.fadeIn(), o.lA.fadeIn());
            await o.idx.write();
            await s.all(o.mA.highlightCell(1, 0, C.yellow), o.a21.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'The entries $a_{11}${a one one}, $a_{22}${a two two}, and so on form the main diagonal. A diagonal matrix is zero everywhere off it, and the zero matrix, written $0${zero}, is zero everywhere.',
          do: async (s, o) => {
            await s.all(o.idx.fadeOut(), o.a21.fadeOut(), o.mA.clearHighlights());
            await s.all(o.mA.highlightCell(0, 0, C.blue), o.mA.highlightCell(1, 1, C.blue), o.diagT.write());
            await s.all(o.mD.fadeIn(), o.lD.fadeIn(), o.mD.highlightCell(0, 0, C.blue), o.mD.highlightCell(1, 1, C.blue));
            await s.all(o.mZ.fadeIn(), o.lZ.fadeIn());
          },
        },
        {
          say: 'Sums go entry by entry: add matching entries. That only makes sense when the two matrices have the same size.',
          do: async (s, o) => {
            await s.all([o.diagT, o.mD, o.lD, o.mZ, o.lZ].map((m) => m.fadeOut()), o.mA.clearHighlights());
            await s.all(o.plus.fadeIn(), o.mB.fadeIn(), o.lB.fadeIn(), o.eq.fadeIn({ delay: 200 }), o.mS.fadeIn({ delay: 200 }), o.lS.fadeIn({ delay: 200 }));
            for (const [i, j] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
              await s.all(o.mA.highlightCell(i, j, C.blue, { duration: 200 }), o.mB.highlightCell(i, j, C.red, { duration: 200 }));
              await o.mS.setEntry(i, j, SUM[i][j], { duration: 350 });
              await s.all(o.mA.clearHighlights({ duration: 150 }), o.mB.clearHighlights({ duration: 150 }));
            }
            await o.same.fadeIn();
          },
        },
        {
          say: 'Scalar multiples go entry by entry too. Two $A${A} doubles every entry, one row at a time.',
          do: async (s, o) => {
            await s.all([o.plus, o.mB, o.lB, o.eq, o.mS, o.lS, o.same].map((m) => m.fadeOut()));
            await s.all(o.mA.moveTo(480, 250), o.lA.moveTo(480, 120));
            await o.lA.swap('2A');
            await o.mA.scaleRow(0, 2);
            await o.mA.scaleRow(1, 2);
            await o.mA.note();
          },
        },
        {
          say: 'Nothing surprising so far. Multiplication is where it gets interesting, because it isn\'t done entry by entry at all.',
          do: (s, o) => o.next.fadeIn(),
        },
      ],
    },

    // 2
    {
      id: 'compose',
      title: 'Multiplying means composing',
      scene(s) {
        const p = s.plane({ x: 680, y: 300, width: 400, range: [-3, 3, -3, 3], names: ['x_1', 'x_2'], visible: false });
        const b = {
          i: p.vector([1, 0], { color: C.green, label: '\\mathbf{e}_1', visible: false }),
          j: p.vector([0, 1], { color: C.red, label: '\\mathbf{e}_2', visible: false }),
        };
        const x = p.vector(XV, { color: C.blue, label: '\\mathbf{x}', visible: false });
        const Rt = s.tex(`\\text{first } R = ${texMat(R)}`, { x: 230, y: 95, size: 32, visible: false });
        const St = s.tex(`\\text{then } S = ${texMat(S)}`, { x: 230, y: 205, size: 32, visible: false });
        const SRt = s.tex(`SR = \\begin{bmatrix}\\col{green}{${t(SR[0][0])}} & \\col{red}{${t(SR[0][1])}} \\\\ \\col{green}{${t(SR[1][0])}} & \\col{red}{${t(SR[1][1])}}\\end{bmatrix}`, { x: 230, y: 330, size: 36, visible: false });
        const def = s.tex('S(R\\mathbf{x}) = (SR)\\,\\mathbf{x}', { x: 230, y: 450, size: 36, visible: false });
        const read = s.text('read right to left: $R$ acts first', { x: 230, y: 520, size: 30, color: C.muted, visible: false });
        const i1 = p.label(nums(SR_E1), pair(SR_E1), { color: C.green, size: 30, offset: [62, 22], transform: false, visible: false });
        const j1 = p.label(nums(SR_E2), pair(SR_E2), { color: C.red, size: 30, offset: [-20, 62], transform: false, visible: false });
        return { p, b, x, Rt, St, SRt, def, read, i1, j1 };
      },
      steps: [
        {
          say: 'Matrices are maps, so the natural thing to do with two of them is to do one and then the other. Rotate by $R${R}, then shear by $S${S}. The result is a single combined map.',
          do: async (s, o) => {
            await s.all(o.p.draw(), o.b.i.grow(), o.b.j.grow(), o.x.grow({ delay: 300 }));
            await o.Rt.write();
            await o.p.applyMatrix(R, { duration: 1400 });
            await o.St.write();
            await o.p.applyMatrix(S, { duration: 1400 });
          },
        },
        {
          say: 'It\'s linear, so it has a matrix, and its columns are wherever $\\mathbf{e}_1${e one} and $\\mathbf{e}_2${e two} end up: $(1, 1)${one, one} and $(-1, 0)${minus one, zero}.',
          do: async (s, o) => {
            await s.all(o.i1.draw(), o.b.i.flash({ color: C.green }));
            await s.all(o.j1.draw(), o.b.j.flash({ color: C.red }));
            await o.SRt.write();
          },
        },
        {
          say: 'Lay defines the product exactly so that $S(R\\mathbf{x}) = (SR)\\mathbf{x}${S of R x equals S R times x}. Read it right to left: $R${R}, the matrix next to $\\mathbf{x}${x}, acts first.',
          do: async (s, o) => {
            await o.def.write();
            await s.all(o.read.fadeIn(), o.x.flash({ color: C.blue }));
          },
        },
      ],
    },

    // 3
    {
      id: 'column-def',
      title: 'AB, column by column',
      scene(s) {
        const row = productRow(s, { filled: false, visible: false });
        const defn = s.tex('AB = [\\,A\\mathbf{b}_1\\ \\ A\\mathbf{b}_2\\ \\ A\\mathbf{b}_3\\,]', { x: 480, y: 330, size: 36, visible: false });
        const small = s.matrix(A, { x: 140, y: 470, size: 34, visible: false });
        const clones = [0, 1, 2].map((j) => {
          const cb = row.mB.colBox(j);
          return s.matrix(col(B, j).map((v) => [v]), { x: cb.cx, y: cb.cy, size: 34, color: BCOL[j], visible: false });
        });
        const combs = [0, 1, 2].map((j) => s.tex(combTex(j), { x: 590, y: 470, size: 34, visible: false }));
        return { ...row, defn, small, clones, combs };
      },
      steps: [
        {
          say: 'So how do we compute $AB${A B}? Multiply $A${A} by each column of $B${B}: $AB${A B} is $A\\mathbf{b}_1${A b one}, $A\\mathbf{b}_2${A b two}, $A\\mathbf{b}_3${A b three}, side by side.',
          do: async (s, o) => {
            await s.all(o.mA.fadeIn(), o.lA.fadeIn(), o.mB.fadeIn({ delay: 200 }), o.lB.fadeIn({ delay: 200 }), o.eq.fadeIn({ delay: 400 }), o.mAB.fadeIn({ delay: 400 }), o.lAB.fadeIn({ delay: 400 }));
            await o.defn.write();
            await o.small.fadeIn();
            await columnStep(s, o, 0);
          },
        },
        {
          say: 'Notice what each column is: a combination of the columns of $A${A}, with the weights taken from the matching column of $B${B}.',
          do: (s, o) => columnStep(s, o, 1),
        },
        {
          say: 'One more column and we\'re done. $AB${A B} is two by three, with columns $(4, 5)${four, five}, $(6, -3)${six, minus three}, and $(-1, 4)${minus one, four}.',
          do: async (s, o) => {
            await columnStep(s, o, 2);
            await o.mAB.flash({ color: C.green });
          },
        },
      ],
    },

    // 4
    {
      id: 'row-column',
      title: 'The row–column rule',
      scene(s) {
        const row = productRow(s, { filled: true, visible: true });
        const rc = s.tex(rcTex(), { x: 480, y: 370, size: 36, visible: false });
        const rule = s.tex('(AB)_{ij} = \\text{row } i \\text{ of } A \\,\\cdot\\, \\text{column } j \\text{ of } B', { x: 480, y: 440, size: 32, color: C.muted, visible: false });
        const sizes = s.tex('(m \\times \\col{yellow}{n})\\,(\\col{yellow}{n} \\times p) \\;\\to\\; m \\times p', { x: 480, y: 370, size: 40, visible: false });
        const here = s.tex('(2 \\times \\col{yellow}{2})\\,(\\col{yellow}{2} \\times 3) \\;\\to\\; \\col{green}{2 \\times 3}', { x: 480, y: 460, size: 36, visible: false });
        const inner = s.text('the inside numbers must match', { x: 480, y: 535, size: 30, color: C.yellow, visible: false });
        return { ...row, rc, rule, sizes, here, inner };
      },
      steps: [
        {
          say: 'For a single entry there\'s a shortcut. Entry $i${i}, $j${j} of $AB${A B} is row $i${i} of $A${A} against column $j${j} of $B${B}: multiply matching entries and add. Row one against column two gives $1 \\cdot 0 + 2 \\cdot 3 = 6${one times zero plus two times three, which is six}.',
          do: async (s, o) => {
            await s.all(o.mA.highlightRow(RC_I, C.yellow), o.mB.highlightCol(RC_J, C.yellow));
            await o.mAB.highlightCell(RC_I, RC_J, C.green);
            await o.rc.write({ duration: 1300 });
            await o.rule.fadeIn();
          },
        },
        {
          say: 'That\'s also why sizes matter. An $m${m} by $n${n} matrix times an $n${n} by $p${p} matrix gives $m${m} by $p${p}. The inside numbers must match, and the outside numbers give the size.',
          do: async (s, o) => {
            await s.all(o.rc.fadeOut(), o.rule.fadeOut(), o.mA.clearHighlights(), o.mB.clearHighlights(), o.mAB.clearHighlights());
            await o.sizes.write();
            await o.here.write();
            await s.all(o.inner.fadeIn(), o.mA.indicate({ scale: 1.05 }), o.mB.indicate({ scale: 1.05, delay: 200 }));
          },
        },
      ],
    },

    // 5
    {
      id: 'try-size',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Check the inside numbers, then the outside ones.',
      prompt: '$A$ is $3 \\times 5$ and $B$ is $5 \\times 2$. What is the size of $AB$, and is $BA$ defined?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: '$5 \\times 5$; yes', why: 'The inside numbers (5 and 5) only have to match; the outside numbers, 3 and 2, give the size.' },
        { id: 'b', label: '$3 \\times 2$; no', why: 'Right: $(3 \\times 5)(5 \\times 2)$ is $3 \\times 2$, and $BA$ would be $(5 \\times 2)(3 \\times 5)$, with inside numbers 2 and 3.' },
        { id: 'c', label: '$3 \\times 2$; yes', why: '$BA$ is $(5 \\times 2)(3 \\times 5)$: the inside numbers 2 and 3 don\'t match, so it isn\'t defined.' },
      ],
      hint: 'For $(m \\times n)(n \\times p)$ the inside numbers must agree, and the result is $m \\times p$.',
      solution: [
        'For $AB$: $(3 \\times \\mathbf{5})(\\mathbf{5} \\times 2)$. The inside numbers match, and the outside ones give the size $3 \\times 2$.',
        'For $BA$: $(5 \\times \\mathbf{2})(\\mathbf{3} \\times 5)$. Each row of $B$ has 2 entries but each column of $A$ has 3, so the row–column rule can\'t pair them: $BA$ is **not defined**.',
      ],
    },

    // 6
    {
      id: 'not-commute',
      title: 'Order matters',
      scene(s) {
        const L = composePlane(s, 250, false);
        const Rr = composePlane(s, 710, false);
        const lt = s.text('rotate, then shear', { x: 250, y: 85, size: 30, visible: false });
        const rt = s.text('shear, then rotate', { x: 710, y: 85, size: 30, visible: false });
        const lm = s.tex(`SR = ${texMat(SR)}`, { x: 250, y: 525, size: 32, color: C.blue, visible: false });
        const rm = s.tex(`RS = ${texMat(RS)}`, { x: 710, y: 525, size: 32, color: C.red, visible: false });
        const ne = s.tex('\\neq', { x: 480, y: 525, size: 44, color: C.yellow, visible: false });
        const gen = s.tex('AB \\neq BA \\text{ in general}', { x: 480, y: 70, size: 36, color: C.yellow, visible: false });
        return { L, Rr, lt, rt, lm, rm, ne, gen };
      },
      steps: [
        {
          say: 'Does the order matter? On the left, rotate and then shear. On the right, shear first, then rotate.',
          do: async (s, o) => {
            await s.all(o.L.p.draw(), o.Rr.p.draw(), o.L.shape.draw(), o.Rr.shape.draw(), o.lt.fadeIn(), o.rt.fadeIn());
            await s.all(o.L.p.applyMatrix(R, { duration: 1300 }), o.Rr.p.applyMatrix(S, { duration: 1300 }));
            await s.all(o.L.p.applyMatrix(S, { duration: 1300 }), o.Rr.p.applyMatrix(R, { duration: 1300 }));
          },
        },
        {
          say: 'The F ends up in two different places, so these are different maps, with different matrices: $SR${S R} on the left, $RS${R S} on the right.',
          do: async (s, o) => {
            await s.all(o.L.shape.flash(), o.Rr.shape.flash());
            await s.all(o.lm.write(), o.rm.write({ delay: 300 }));
            await o.ne.fadeIn();
          },
        },
        {
          say: 'So in general $AB${A B} is not $BA${B A}, even when both are square and both products make sense. Matrix multiplication does not commute.',
          do: async (s, o) => {
            await s.all(o.lt.fadeOut(), o.rt.fadeOut());
            await o.gen.fadeIn();
            await o.gen.indicate();
          },
        },
      ],
    },

    // 7
    {
      id: 'rules',
      title: 'What still works (Theorem 2)',
      scene(s) {
        const line = (tx, y, color) => s.tex(tx, { x: 60, y, size: 32, color, anchor: [0, 0.5], visible: false });
        const hdr = s.text('**Theorem 2.** $A$ is $m \\times n$, and $B$, $C$ have sizes for which each sum and product below is defined.', { x: 60, y: 65, size: 30, width: 840, align: 'left', anchor: [0, 0.5], color: C.muted, visible: false });
        const good = [
          line('A(BC) = (AB)C', 148),
          line('A(B + C) = AB + AC, \\quad (B + C)A = BA + CA', 198),
          line('r(AB) = (rA)B = A(rB), \\quad I_mA = A = AI_n', 248),
        ];
        const bad1 = line('AB = AC \\;\\not\\Rightarrow\\; B = C \\quad \\text{(no cancellation)}', 312, C.yellow);
        const bad2 = line('AB = 0 \\text{ is possible with } A \\neq 0,\\ B \\neq 0', 362, C.yellow);
        const ex = s.tex(`${texMat(ZA)}${texMat(ZB)} = \\col{yellow}{${texMat(ZP)}}`, { x: 300, y: 465, size: 34, visible: false });
        const pow = s.tex('A^k = \\underbrace{A \\cdots A}_{k}', { x: 760, y: 465, size: 36, visible: false });
        return { hdr, good, bad1, bad2, ex, pow };
      },
      steps: [
        {
          say: 'Plenty of rules still work. Associativity, $A(BC) = (AB)C${A times B C equals A B times C}, is free: both sides mean do $C${C}, then $B${B}, then $A${A}. The distributive laws, scalars, and the identity behave as you\'d expect.',
          do: async (s, o) => {
            await o.hdr.fadeIn();
            await s.stagger(o.good.map((g) => () => g.write()), 1200);
          },
        },
        {
          say: 'But two habits from numbers fail. You can\'t cancel: $AB = AC${A B equals A C} doesn\'t force $B = C${B equals C}. And a product can be zero even when neither factor is.',
          do: async (s, o) => {
            await o.bad1.write();
            await o.bad2.write();
            await o.ex.fadeIn();
          },
        },
        {
          say: 'Powers are fine, as long as $A${A} is square: $A^k${A to the k} means doing $A${A} $k${k} times in a row.',
          do: (s, o) => o.pow.write(),
        },
      ],
    },

    // 8
    {
      id: 'fill-product',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks. Each entry is a row of the first matrix against a column of the second.',
      lines: [
        [
          `${texMat(PA)}${texMat(PB)} = `,
          { matrix: PP.map((r, i) => r.map((x, j) => ({ id: `r${i}c${j}`, answer: { type: 'number', value: String(x) }, hint: `Row ${i + 1} of the first matrix against column ${j + 1} of the second.` }))) },
        ],
      ],
      solution: [
        `Row by row: entry $(i, j)$ is row $i$ of the first matrix against column $j$ of the second. For example $(1)(3) + (-2)(-1) = ${t(PP[0][0])}$ and $(0)(1) + (3)(2) = ${t(PP[1][1])}$.`,
        `The product is $${texMat(PP)}$: a $(3 \\times 2)(2 \\times 2)$ product is $3 \\times 2$.`,
      ],
    },

    // 9
    {
      id: 'transpose',
      title: 'The transpose',
      scene(s) {
        const m = s.matrix(TM, { x: 220, y: 190, size: 40, visible: false });
        const lm = s.tex('A', { x: 220, y: 75, size: 36, color: C.muted, visible: false });
        const copy = s.matrix(TM, { x: 220, y: 190, size: 40, visible: false });
        const mt = s.matrix(TMT, { x: 660, y: 190, size: 40, visible: false });
        const lmt = s.tex('A^T', { x: 820, y: 190, size: 40, color: C.muted, visible: false });
        const arrow = s.arrow(380, 190, 520, 190, { color: C.muted, width: 4, visible: false });
        const thmL = s.text('**Theorem 3** (sums and products defined):', { x: 480, y: 335, size: 30, color: C.muted, visible: false });
        const thm = s.tex('(A^T)^T = A, \\quad (A + B)^T = A^T + B^T, \\quad (rA)^T = rA^T', { x: 480, y: 390, size: 30, visible: false });
        const lhs = s.tex('(\\col{blue}{A}\\col{red}{B})^T =', { x: 400, y: 465, size: 44, visible: false });
        const at = s.tex('A^T', { x: 575, y: 465, size: 44, color: C.blue, visible: false });
        const bt = s.tex('B^T', { x: 655, y: 465, size: 44, color: C.red, visible: false });
        const sz = s.tex('\\col{red}{B^T}: p \\times n, \\quad \\col{blue}{A^T}: n \\times m \\quad \\Rightarrow \\quad p \\times m', { x: 480, y: 550, size: 30, visible: false });
        return { m, lm, copy, mt, lmt, arrow, thmL, thm, lhs, at, bt, sz };
      },
      steps: [
        {
          say: 'The transpose $A^T${A transpose} flips a matrix across its diagonal: rows become columns. This two by three matrix becomes three by two.',
          do: async (s, o) => {
            await s.all(o.m.fadeIn(), o.lm.fadeIn());
            await s.all(o.m.highlightRow(0, C.blue), o.m.highlightRow(1, C.red));
            await o.arrow.draw();
            await o.copy.show().morphTo(o.mt, { duration: 1300 });
            await s.all(o.mt.highlightCol(0, C.blue), o.mt.highlightCol(1, C.red), o.lmt.fadeIn());
          },
        },
        {
          say: 'Theorem three lists the rules. Most are what you\'d guess, but the transpose of a product reverses the order: $(AB)^T = B^TA^T${the transpose of A B equals B transpose times A transpose}.',
          do: async (s, o) => {
            await o.thmL.fadeIn();
            await o.thm.write({ duration: 1200 });
            await s.all(o.lhs.write(), o.at.fadeIn({ delay: 300 }), o.bt.fadeIn({ delay: 300 }));
            await s.all(o.at.moveTo(655, 465, { duration: 900 }), o.bt.moveTo(575, 465, { duration: 900 }));
          },
        },
        {
          say: 'The sizes force it. If $A${A} is $m${m} by $n${n} and $B${B} is $n${n} by $p${p}, then $B^T${B transpose} is $p${p} by $n${n} and $A^T${A transpose} is $n${n} by $m${m}, so only $B^TA^T${B transpose A transpose} lines up.',
          do: (s, o) => o.sz.write({ duration: 1300 }),
        },
      ],
    },

    // 10
    {
      id: 'mistake-square',
      title: 'The trap: algebra habits',
      scene(s) {
        const l1 = s.tex('(A + B)^2 = (A + B)(A + B)', { x: 480, y: 80, size: 38, visible: false });
        const l2 = s.tex('= A^2 + \\col{blue}{AB} + \\col{red}{BA} + B^2', { x: 480, y: 160, size: 38, color: C.green, visible: false });
        const wrong = s.tex('A^2 + 2AB + B^2', { x: 400, y: 240, size: 38, visible: false });
        const why = s.text('only if $AB = BA$', { x: 740, y: 240, size: 30, color: C.yellow, visible: false });
        const t1 = s.tex('(AB)^T = A^TB^T', { x: 480, y: 360, size: 38, visible: false });
        const t2 = s.tex('(AB)^T = B^TA^T', { x: 480, y: 450, size: 38, color: C.green, visible: false });
        return { l1, l2, wrong, why, t1, t2 };
      },
      steps: [
        {
          say: 'Here\'s the trap. With numbers, $(a + b)^2${a plus b squared} is $a^2 + 2ab + b^2${a squared plus two a b plus b squared}. With matrices, expand carefully: you get $AB${A B} and $BA${B A}, and those are different terms, so the familiar formula is wrong.',
          do: async (s, o) => {
            await o.l1.write();
            await o.l2.write();
            await o.wrong.fadeIn();
            await s.strike(o.wrong, { color: 'yellow' });
            await o.why.fadeIn();
          },
        },
        {
          say: 'Same habit, same trap for transposes. $(AB)^T${the transpose of A B} is not $A^TB^T${A transpose times B transpose}. Reverse the order.',
          do: async (s, o) => {
            await o.t1.fadeIn();
            await s.strike(o.t1, { color: 'yellow' });
            await o.t2.write();
          },
        },
      ],
    },

    // 11
    {
      id: 'try-transpose',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Write down the sizes before you choose.',
      prompt: 'If $A$ is $2 \\times 3$ and $B$ is $3 \\times 4$, which product is defined and equals $(AB)^T$?',
      answer: { type: 'choice', value: 'c' },
      choices: [
        { id: 'a', label: '$A^TB^T$', why: '$A^T$ is $3 \\times 2$ and $B^T$ is $4 \\times 3$: $(3 \\times 2)(4 \\times 3)$ isn\'t even defined. Transposing a product reverses the order.' },
        { id: 'b', label: '$BA$', why: '$(3 \\times 4)(2 \\times 3)$ is not defined, and it has no transposes at all.' },
        { id: 'c', label: '$B^TA^T$', why: 'Right: $(4 \\times 3)(3 \\times 2)$ is $4 \\times 2$, the size of $(AB)^T$, and Theorem 3 says it equals $(AB)^T$.' },
      ],
      hint: '$AB$ is $2 \\times 4$, so $(AB)^T$ is $4 \\times 2$. Which product has that size?',
      solution: [
        '$AB$ is $(2 \\times 3)(3 \\times 4) = 2 \\times 4$, so $(AB)^T$ is $4 \\times 2$.',
        '$B^TA^T$ is $(4 \\times 3)(3 \\times 2) = 4 \\times 2$, and by Theorem 3 $(AB)^T = B^TA^T$. The other order, $A^TB^T$, is $(3 \\times 2)(4 \\times 3)$: not defined.',
      ],
    },

    // 12
    {
      id: 'wo-product',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Compute both products, then subtract.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateComm,
    },

    // 13
    {
      id: 'cp-compose',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: 'Why does $AB$ represent "apply $B$ first, then $A$", and why does that make $AB \\neq BA$ in general?',
      points: [
        'By definition $(AB)\\mathbf{x} = A(B\\mathbf{x})$: $B$ acts on $\\mathbf{x}$ first, then $A$ acts on the result',
        'The columns of $AB$ are $A\\mathbf{b}_j$: $A$ applied to the images of the basis vectors under $B$',
        'Doing two geometric moves in different orders usually gives different results (rotate then shear vs shear then rotate)',
        'Only special pairs of matrices commute',
      ],
    },

    // 14
    {
      id: 'summary-ops',
      title: 'Summary',
      scene(s) {
        const L = composePlane(s, 170, true, { y: 210, width: 240 });
        const Rr = composePlane(s, 790, true, { y: 210, width: 240 });
        L.p.applyMatrix(SR, { duration: 1 });
        Rr.p.applyMatrix(RS, { duration: 1 });
        const lm = s.tex(`SR = ${texMat(SR)}`, { x: 170, y: 410, size: 30, color: C.blue });
        const rm = s.tex(`RS = ${texMat(RS)}`, { x: 790, y: 410, size: 30, color: C.red });
        const items = [
          s.tex('(AB)\\mathbf{x} = A(B\\mathbf{x})', { x: 480, y: 150, size: 32, visible: false }),
          s.tex('AB = [\\,A\\mathbf{b}_1 \\cdots A\\mathbf{b}_p\\,]', { x: 480, y: 250, size: 30, visible: false }),
          s.text('Next: undoing a map', { x: 480, y: 530, size: 30, color: C.muted, visible: false }),
        ];
        return { L, Rr, lm, rm, items };
      },
      steps: [
        {
          say: 'Products are compositions, read right to left: in $AB${A B}, $B${B} acts first. And the order matters.',
          do: async (s, o) => {
            await s.all(o.L.shape.flash(), o.Rr.shape.flash());
            await o.items[0].write();
          },
        },
        {
          say: 'Compute them column by column, $A${A} times each column of $B${B}, or entry by entry with the row–column rule.',
          do: (s, o) => o.items[1].write(),
        },
        {
          say: 'Next time we ask the reverse question: when can a map be undone? That\'s the inverse of a matrix.',
          do: (s, o) => o.items[2].fadeIn(),
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------- step helpers

/** Column j of B slides down next to A, is combined, and lands in AB. */
async function columnStep(s, o, j) {
  const prev = o.combs.filter((c, k) => k !== j);
  await s.all(prev.map((c) => (c.state.opacity > 0 ? c.fadeOut() : null)), o.clones.filter((c, k) => k !== j).map((c) => (c.state.opacity > 0 ? c.fadeOut() : null)), o.mB.clearHighlights());
  await o.mB.highlightCol(j, BCOL[j]);
  o.clones[j].show();
  await o.clones[j].moveTo(275, 470, { duration: 900 });
  await o.combs[j].write({ duration: 1000 });
  await s.all(AB.map((r, i) => o.mAB.setEntry(i, j, r[j], { duration: 450 })));
  for (const i of [0, 1]) o.mAB.cell(i, j).style.color = C.green;
}
