/**
 * Lecture 13 · Midterm 1 review (Lay ch. 1–3). Design: matrix/PLAN.md § 13.
 * Every matrix, determinant, factorization and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, rref, det, inverse, identity, mul, mulVec, eqMat, nullspace, solve, colspace, texMat, texRowOp, texVec } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
/** Every row operation with the matrix it produces (workout solutions). */
const opLines = (steps, augment = null) => steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after, { augment })}$`);

/** Beat 2: [1 h | 4; 3 6 | 8]. Consistent unless 6 − 3h = 0. */
const H_ROWS = (h) => mat([[1, h, 4], [3, 6, 8]]);
const H_BAD = F(6).div(3); // 6 − 3h = 0
const H_BAD_R = rref(H_ROWS(H_BAD), { augmented: 1 });
const H_BAD_INCONSISTENT = solve(H_ROWS(H_BAD).map((r) => r.slice(0, 2)), H_ROWS(H_BAD).map((r) => r[2])).kind === 'none';
const H_ZERO = solve([[1, 0], [3, 6]], [4, 8]);
if (!H_BAD_INCONSISTENT || H_ZERO.kind !== 'unique') throw new Error('review-1: h data drifted');

/** Beat 3: four vectors in R^3. */
const IND = mat([[1, 3, 2, 1], [2, 6, 5, 4], [1, 3, 1, -1]]);
const IND_R = rref(IND);
const IND_INDEP = IND_R.rank === IND[0].length;
const IND_SPANS = IND_R.rank === IND.length;
const IND_ANS = IND_INDEP ? (IND_SPANS ? 'a' : 'b') : IND_SPANS ? 'd' : 'c';

/** Beat 4: is b in Span{a1, a2}? */
const SPN_A = mat([[1, 2], [0, 1], [1, 0]]);
const SPN_B = vec([4, 1, 2]);
const SPN = solve(SPN_A, SPN_B);
if (SPN.kind !== 'unique') throw new Error('review-1: b should be in the span');
const SPN_W = SPN.x;
const SPN_AUG = SPN_A.map((row, i) => [...row, SPN_B[i]]);
const SPN_RED = rref(SPN_AUG, { augmented: 1 });
const SPN_WRONG = [SPN_W[1], SPN_W[0]];
const coef = (k) => (F(k).eq(1) ? '' : t(k));
const combTex = (w) => `${coef(w[0])}\\mathbf{a}_1 + ${coef(w[1])}\\mathbf{a}_2`;
const colTex = (j) => texVec(SPN_A.map((r) => r[j]));

/** Beat 6: the inverse workout. */
const INV_A = mat([[1, 2, 3], [0, 1, 4], [5, 6, 0]]);
const INV = inverse(INV_A);
const INV_D = det(INV_A);
const INV_AUG = INV_A.map((row, i) => [...row, ...identity(3)[i]]);
const INV_RED = rref(INV_AUG, { augmented: 3 });
const INV_FWD = INV_RED.steps.filter((st) => st.phase === 'forward');
const INV_BWD = INV_RED.steps.filter((st) => st.phase === 'backward');
if (!eqMat(mul(INV_A, INV), identity(3))) throw new Error('review-1: inverse check failed');

/** Beat 7: det rules for a 3 × 3 with det 5. */
const DR = F(5);
const DR_N = 3;
const DR_T = DR;
const DR_INV = DR.inv();
const DR_SQ = DR.mul(DR);
const DR_NEG = F((-1) ** DR_N).mul(DR); // (−1)^n det A
/** The row-operation line of the det blanks: swap R1, R3 (sign flips), then R2 → 3R2 (times 3). */
const DR_OPS_K = F(3);
const DR_OPS = DR.neg().mul(DR_OPS_K);

/** Beat 13: bases for Nul A and Col A, and the rank. */
const CN_A = mat([[1, 2, 0, 1], [2, 4, 1, 4], [3, 6, 1, 5]]);
const CN_RED = rref(CN_A);
const CN_NUL = nullspace(CN_A);
const CN_COL = colspace(CN_A);
const CN_PIV = CN_RED.pivots.map(([, c]) => c);
const CN_FREE = [0, 1, 2, 3].filter((c) => !CN_PIV.includes(c));

/** Review addition: a standard matrix from a geometric description (rotate 90° counterclockwise, then reflect in the x1-axis). */
const GM_ROT = mat([[0, -1], [1, 0]]);
const GM_REF = mat([[1, 0], [0, -1]]);
const GM = mul(GM_REF, GM_ROT);
const GM_E = [vec([1, 0]), vec([0, 1])].map((e) => [e, mulVec(GM_ROT, e), mulVec(GM, e)]);

/** Review addition: parametric vector form with two free variables. */
const PV_R = mat([[1, 3, 0, -1, 2], [0, 0, 1, 2, 5]]);
const PV = solve(PV_R.map((r) => r.slice(0, 4)), PV_R.map((r) => r[4]));
if (PV.kind !== 'infinite' || PV.free.join() !== '1,3') throw new Error('review-1: parametric example drifted');
/** `x_1 = 2 - 3x_2 + x_4` from the particular solution and the free-variable directions. */
const pvLine = (i) =>
  `x_${i + 1} = ${t(PV.particular[i])}` +
  PV.free.map((f, k) => {
    const c = PV.basis[k][i];
    return c.zero ? '' : ` ${c.sign() < 0 ? '-' : '+'} ${c.abs().eq(1) ? '' : t(c.abs())}x_${f + 1}`;
  }).join('');
const PV_X1 = pvLine(0);
const PV_X3 = pvLine(2);

/** Review addition: Cramer's rule for one unknown. */
const CR_A = mat([[2, 1], [3, 4]]);
const CR_B = vec([1, 9]);
const CR_D = det(CR_A);
const CR_A2 = CR_A.map((row, i) => [row[0], CR_B[i]]);
const CR_D2 = det(CR_A2);
const CR_X = solve(CR_A, CR_B).x;
if (!CR_D2.div(CR_D).eq(CR_X[1])) throw new Error('review-1: Cramer example drifted');

/** Beat 8: one matrix, determinant three ways. */
const DM = mat([[1, 0, 2], [3, 0, 1], [2, 4, 1]]);
const DM_D = det(DM);
const DM_FWD = rref(DM).steps.filter((st) => st.phase === 'forward');
const DM_U = DM_FWD.at(-1).after;
const DM_SWAPS = DM_FWD.filter((st) => st.op === 'swap').length;
const DM_DIAG = [0, 1, 2].map((i) => DM_U[i][i]);
const DM_PROD = DM_DIAG.reduce((s, x) => s.mul(x), F(1));
/** Expansion down column 2 (index 1): only one nonzero entry. */
const DM_COL = 1;
const DM_ROW = DM.findIndex((row) => !row[DM_COL].zero);
const DM_SIGN = (DM_ROW + DM_COL) % 2 ? -1 : 1;
const DM_MINOR = DM.filter((_, i) => i !== DM_ROW).map((row) => row.filter((_, j) => j !== DM_COL));
const DM_MD = det(DM_MINOR);
const DM_COEF = DM[DM_ROW][DM_COL].mul(DM_SIGN);
if (!DM_COEF.mul(DM_MD).eq(DM_D) || !DM_PROD.mul(DM_SWAPS % 2 ? -1 : 1).eq(DM_D)) throw new Error('review-1: det ways disagree');

/** Beat 9: LU. */
const LU_A = mat([[2, -1, 3], [-4, 5, -5], [6, -6, 12]]);
const LU_FWD = rref(LU_A).steps.filter((st) => st.phase === 'forward');
if (LU_FWD.some((st) => st.op !== 'add')) throw new Error('review-1: LU example needs no swaps');
const LU_U = LU_FWD.at(-1).after;
const LU_L = identity(3).map((row) => row.slice());
for (const st of LU_FWD) LU_L[st.i][st.j] = st.k.neg();
const LU_D = [0, 1, 2].reduce((s, i) => s.mul(LU_U[i][i]), F(1));
if (!eqMat(mul(LU_L, LU_U), LU_A) || !LU_D.eq(det(LU_A))) throw new Error('review-1: LU check failed');
const LU_AFTER_COL1 = LU_FWD.filter((st) => st.j === 0).at(-1).after;

/** Beat 11: a homogeneous system with one free variable. */
const NS_A = mat([[1, -2, 1], [2, -3, 4]]);
const NS = nullspace(NS_A);
const NS_V = NS[0];
const NS_R = rref(NS_A).R;

/** Beat 4: the three maps. */
const MAPS = [
  { name: 'shear', M: [[1, 1], [0, 1]] },
  { name: 'rotation by $90^\\circ$', M: [[0, -1], [1, 0]] },
  { name: 'projection onto $x_1$', M: [[1, 0], [0, 0]] },
];

/** Beat 13: the inverse check A A^{-1} = I. */
const CHECK_TEX = `${texMat(INV_A)}${texMat(INV)} = ${texMat(identity(3))}`;

// ---------------------------------------------------------------- scene helpers

/** A concept-map node: text in a rounded box (row-reduction's `node`), plus an optional muted subtitle. */
function node(s, str, x, y, { color = C.ink, sub, subWidth = 300 } = {}) {
  const txt = s.text(str, { x, y, size: 30, weight: 600, visible: false });
  const t0 = txt.box();
  const b = { x: t0.x - 16, y: t0.y - 10, w: t0.w + 32, h: t0.h + 20 };
  const box = s.rect(b.x, b.y, b.w, b.h, { color, radius: 14, visible: false });
  const subT = sub ? s.text(sub, { x, y: b.y + b.h + 12, size: 30, width: subWidth, color: C.muted, anchor: [0.5, 0], visible: false }) : null;
  return {
    txt, box, b, subT,
    show: (o) => Promise.all([box.draw(o), txt.fadeIn({ shift: [0, 0], ...o }), subT?.fadeIn({ delay: 300, ...o })]),
  };
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'review-1',
  title: 'Midterm 1 review',
  goals: [
    'Recall the core computations of chapters 1–3 and pick the right tool quickly',
    'Connect pivots, span, independence, invertibility and determinants',
    'Practice exam-style problems',
  ],
  beats: [
    // 1
    {
      id: 'map-of-ch1-3',
      title: 'The map of the first three chapters',
      scene(s) {
        const rr = node(s, 'Row reduction', 480, 60);
        const pv = node(s, 'Pivot positions', 480, 165, { color: C.blue });
        const cons = node(s, 'Consistent?', 180, 275, { sub: 'no pivot in the last column', subWidth: 240 });
        const span = node(s, 'Spans $\\mathbb{R}^m$', 480, 275, { color: C.blue, sub: 'pivot in every row: onto' });
        const ind = node(s, 'Independent', 775, 275, { color: C.red, sub: 'pivot in every column: one-to-one' });
        const sq = node(s, 'Square: invertible $\\iff \\det A \\neq 0$', 480, 490, { color: C.green });
        const down = (a, b, x1 = 480, x2 = x1) => s.arrow(x1, a.b.y + a.b.h + 4, x2, b.b.y - 6, { color: C.muted, visible: false });
        const a1 = down(rr, pv);
        const a2 = s.arrow(pv.b.x - 4, pv.b.y + pv.b.h, cons.b.x + cons.b.w * 0.7, cons.b.y - 6, { color: C.muted, visible: false });
        const a3 = down(pv, span);
        const a4 = s.arrow(pv.b.x + pv.b.w + 4, pv.b.y + pv.b.h, ind.b.x + ind.b.w * 0.3, ind.b.y - 6, { color: C.muted, visible: false });
        const sb = span.subT.box();
        const ib = ind.subT.box();
        const a5 = s.arrow(sb.cx, sb.y + sb.h + 6, 440, sq.b.y - 6, { color: C.blue, visible: false });
        const a6 = s.arrow(ib.cx, ib.y + ib.h + 6, sq.b.x + sq.b.w - 40, sq.b.y - 6, { color: C.red, visible: false });
        const imt = s.defCard({
          kind: 'theorem', title: 'The Invertible Matrix Theorem', x: 480, y: 290, width: 880, visible: false,
          body: 'Let $A$ be a square $n\\times n$ matrix. These are all true or all false: (a) $A$ is invertible; (b) $A$ is row equivalent to $I_n$; (c) $A$ has $n$ pivot positions; (d) $A\\mathbf{x} = \\mathbf{0}$ has only the trivial solution; (e) the columns of $A$ are linearly independent; (f) $\\mathbf{x} \\mapsto A\\mathbf{x}$ is one-to-one; (g) $A\\mathbf{x} = \\mathbf{b}$ has a solution for every $\\mathbf{b}$ in $\\mathbb{R}^n$; (h) the columns of $A$ span $\\mathbb{R}^n$; (i) $\\mathbf{x} \\mapsto A\\mathbf{x}$ maps $\\mathbb{R}^n$ onto $\\mathbb{R}^n$; (j) $CA = I$ for some $C$; (k) $AD = I$ for some $D$; (l) $A^T$ is invertible; and $\\det A \\neq 0$.',
        });
        const all = [rr, pv, cons, span, ind, sq].flatMap((n) => [n.txt, n.box, n.subT].filter(Boolean)).concat([a1, a2, a3, a4, a5, a6]);
        return { rr, pv, cons, span, ind, sq, a1, a2, a3, a4, a5, a6, imt, all };
      },
      steps: [
        {
          say: 'Almost everything in the first three chapters runs through one computation: row reduction. It finds the pivot positions, and the pivots answer the questions. First: is the system consistent?',
          do: async (s, o) => {
            await o.rr.show();
            await o.a1.draw({ duration: 400 });
            await o.pv.show();
            await o.a2.draw({ duration: 400 });
            await o.cons.show();
          },
        },
        {
          say: 'A pivot in every row means the columns span $\\mathbb{R}^m${R m}: every $\\mathbf{b}${b} is reached, and the map is onto.',
          do: async (s, o) => {
            await o.a3.draw({ duration: 400 });
            await o.span.show();
          },
        },
        {
          say: 'A pivot in every column means no free variables: the columns are independent, and the map is one-to-one.',
          do: async (s, o) => {
            await o.a4.draw({ duration: 400 });
            await o.ind.show();
          },
        },
        {
          say: 'For a square matrix the two conditions come together. Pivots in every row and every column means invertible, and that\'s exactly when the determinant is not zero.',
          do: async (s, o) => {
            await s.all(o.a5.draw({ duration: 500 }), o.a6.draw({ duration: 500 }));
            await o.sq.show();
            await o.sq.txt.indicate({ color: C.green });
          },
        },
        {
          say: 'On the exam, that\'s the Invertible Matrix Theorem. For a square matrix, every statement on this list is true, or every one is false, so checking any one of them settles all the others.',
          do: async (s, o) => {
            await s.all(o.all.map((m) => m.fadeOut()));
            await o.imt.reveal({ duration: 2400 });
          },
        },
      ],
    },

    // 2
    {
      id: 'try-h-consistent',
      kind: 'try',
      title: 'Your turn',
      say: 'Exam classic. Exactly one value of $h${h} makes this system inconsistent. Find it.',
      prompt: `The system with augmented matrix $\\left[\\begin{array}{cc|c} 1 & h & 4 \\\\ 3 & 6 & 8 \\end{array}\\right]$ is consistent for every $h$ except one. Which value of $h$ makes it inconsistent?`,
      answer: { type: 'number', value: String(H_BAD) },
      hint: 'Clear the 3 under the first pivot and look at row 2: when is it a bad row $[0\\ \\ 0 \\mid c]$ with $c \\neq 0$?',
      solution: [
        '$R_2 \\to R_2 - 3R_1$ turns row 2 into $[0,\\ 6 - 3h \\mid 8 - 12] = [0,\\ 6 - 3h \\mid -4]$.',
        `If $6 - 3h \\neq 0$, row 2 has a pivot in column 2 and the system is consistent (at $h = 0$, for instance, $x_1 = ${t(H_ZERO.x[0])}$, $x_2 = ${t(H_ZERO.x[1])}$). If $6 - 3h = 0$, row 2 says $0 = ${t(H_BAD_R.echelon[1][2])}$: inconsistent.`,
        `So the one bad value is $h = ${t(H_BAD)}$; the system is consistent exactly when $h \\neq ${t(H_BAD)}$.`,
      ],
    },

    // 3 (review addition: span membership)
    {
      id: 'try-span-member',
      kind: 'try',
      title: 'Your turn',
      say: 'Span membership is another exam favorite. Is $\\mathbf{b}${b} a combination of these two columns?',
      prompt: `Let $\\mathbf{a}_1 = ${colTex(0)}$, $\\mathbf{a}_2 = ${colTex(1)}$, $\\mathbf{b} = ${texVec(SPN_B)}$. Is $\\mathbf{b}$ in $\\operatorname{Span}\\{\\mathbf{a}_1, \\mathbf{a}_2\\}$?`,
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: `Yes: $\\mathbf{b} = ${combTex(SPN_W)}$`, why: `Right: $[\\mathbf{a}_1\\ \\mathbf{a}_2 \\mid \\mathbf{b}]$ is consistent, with weights $${t(SPN_W[0])}$ and $${t(SPN_W[1])}$.` },
        { id: 'b', label: 'No: the system is inconsistent', why: 'Row reduce: no row $[0\\ \\ 0 \\mid c]$ with $c \\neq 0$ appears.' },
        { id: 'c', label: `Yes: $\\mathbf{b} = ${combTex(SPN_WRONG)}$`, why: `Check it: that combination is $${texVec(SPN_A.map((r) => r[0].mul(SPN_WRONG[0]).add(r[1].mul(SPN_WRONG[1]))))}$, not $\\mathbf{b}$.` },
        { id: 'd', label: 'Can\'t tell: the matrix has no determinant', why: 'Span questions are answered by row reduction, not determinants; $[\\mathbf{a}_1\\ \\mathbf{a}_2]$ isn\'t square.' },
      ],
      hint: 'Row reduce $[\\mathbf{a}_1\\ \\mathbf{a}_2 \\mid \\mathbf{b}]$ and look for a bad row.',
      solution: [
        `Row reduce $[\\mathbf{a}_1\\ \\mathbf{a}_2 \\mid \\mathbf{b}] = ${texMat(SPN_AUG, { augment: 2 })}$:`,
        ...opLines(SPN_RED.steps, 2),
        `No bad row, so the system is consistent: $x_1 = ${t(SPN_W[0])}$, $x_2 = ${t(SPN_W[1])}$, and $\\mathbf{b} = ${combTex(SPN_W)}$. Check: $${t(SPN_W[0])}${colTex(0)} + ${t(SPN_W[1])}${colTex(1)} = ${texVec(SPN_B)}$.`,
      ],
    },

    // 3
    {
      id: 'try-indep-cols',
      kind: 'try',
      title: 'Your turn',
      say: 'Two questions in one. Find the pivots first.',
      prompt: `Are the columns of $A = ${texMat(IND)}$ linearly independent? Do they span $\\mathbb{R}^3$?`,
      answer: { type: 'choice', value: IND_ANS },
      choices: [
        { id: 'a', label: 'Independent and spanning', why: 'Four vectors in $\\mathbb{R}^3$ can\'t be independent.' },
        { id: 'b', label: 'Independent, not spanning', why: 'Four vectors in $\\mathbb{R}^3$ can\'t be independent: there are more columns than rows.' },
        { id: 'c', label: 'Dependent, not spanning', why: `Right: the reduced form has only ${IND_R.rank} pivots, so some columns have none and row 3 has none.` },
        { id: 'd', label: 'Dependent and spanning', why: `Only ${IND_R.rank} pivots for 3 rows: row 3 has no pivot.` },
      ],
      hint: 'Row reduce and count pivots: compare with the number of rows and the number of columns.',
      solution: [
        `Row reducing gives $${texMat(IND_R.R)}$, with pivots in columns ${IND_R.pivots.map(([, c]) => c + 1).join(' and ')}.`,
        `Only ${IND_R.rank} pivots: columns without pivots mean free variables, so the columns are **dependent**; row 3 has no pivot, so they do **not span** $\\mathbb{R}^3$.`,
      ],
    },

    // 4
    {
      id: 'recap-maps',
      title: 'Recap: matrices as maps',
      scene(s) {
        const panels = MAPS.map(({ name, M }, k) => {
          const x = 170 + 310 * k;
          const p = s.plane({ x, y: 215, width: 230, range: [-2, 2, -2, 2], labels: false, visible: false });
          const sq = p.polygon([[0, 0], [1, 0], [1, 1], [0, 1]], { color: C.yellow, visible: false });
          const { i, j } = p.basis({ visible: false });
          i.label?.hide();
          const m = s.matrix(M, { x, y: 420, size: 32, visible: false });
          for (const r of [0, 1]) {
            m.cell(r, 0).style.color = C.green;
            m.cell(r, 1).style.color = C.red;
          }
          const lab = s.text(name, { x, y: 70, size: 30, visible: false });
          return { p, sq, i, j, m, M, lab };
        });
        const comp = s.tex('(AB)\\mathbf{x} = A(\\part{bx}{B\\mathbf{x}})', { x: 300, y: 540, size: 36, visible: false });
        const order = s.text('right to left: $B$ first, then $A$', { x: 700, y: 540, size: 30, color: C.muted, visible: false });
        return { panels, comp, order };
      },
      steps: [
        {
          say: 'A matrix is a map, and its columns are where the basis vectors land. Shear, rotation, projection: read each matrix column by column.',
          do: async (s, o) => {
            for (const pn of o.panels) {
              await s.all(pn.p.draw({ duration: 500 }), pn.lab.fadeIn());
              await s.all(pn.sq.fadeIn({ shift: [0, 0], duration: 300 }), pn.i.grow({ duration: 400 }), pn.j.grow({ duration: 400 }));
              await s.all(pn.p.applyMatrix(pn.M, { duration: 600 }), pn.m.fadeIn({ duration: 400 }));
            }
          },
        },
        {
          say: 'And products compose right to left: $(AB)\\mathbf{x} = A(B\\mathbf{x})${A B times x equals A times B x}. The matrix closest to $\\mathbf{x}${x} acts first.',
          do: async (s, o) => {
            await o.comp.write();
            await o.comp.color('bx', C.yellow);
            await o.order.fadeIn();
          },
        },
      ],
    },

    // 4b (review addition: a standard matrix from a description)
    {
      id: 'try-std-matrix',
      kind: 'try',
      title: 'Your turn',
      say: 'Build a standard matrix from a description. Follow where each basis vector lands.',
      prompt: '$T:\\mathbb{R}^2 \\to \\mathbb{R}^2$ first rotates each point $90^\\circ$ counterclockwise about the origin, then reflects it in the $x_1$-axis. Find the standard matrix of $T$.',
      answer: { type: 'matrix', value: GM.map((row) => row.map(String)) },
      hint: 'Column $j$ of the standard matrix is $T(\\mathbf{e}_j)$. Rotate $\\mathbf{e}_1$ and $\\mathbf{e}_2$ first, then flip the sign of the second entry.',
      solution: [
        `$\\mathbf{e}_1 = ${texVec(GM_E[0][0])}$ rotates to $${texVec(GM_E[0][1])}$, and reflecting in the $x_1$-axis gives $T(\\mathbf{e}_1) = ${texVec(GM_E[0][2])}$.`,
        `$\\mathbf{e}_2 = ${texVec(GM_E[1][0])}$ rotates to $${texVec(GM_E[1][1])}$, then reflects to $T(\\mathbf{e}_2) = ${texVec(GM_E[1][2])}$.`,
        `So $A = [T(\\mathbf{e}_1)\\ \\ T(\\mathbf{e}_2)] = ${texMat(GM)}$. Check with products, right to left: reflection times rotation, $${texMat(GM_REF)}${texMat(GM_ROT)} = ${texMat(GM)}$. (It's the reflection in the line $x_2 = -x_1$.)`,
      ],
    },

    // 5
    {
      id: 'try-onto-121',
      kind: 'try',
      title: 'Your turn',
      say: 'Use the Invertible Matrix Theorem.',
      prompt: '$T:\\mathbb{R}^3 \\to \\mathbb{R}^3$ has a standard matrix with determinant $0$. Which is true?',
      answer: { type: 'choice', value: 'd' },
      choices: [
        { id: 'a', label: 'One-to-one but not onto', why: 'For a square matrix, one-to-one and onto stand or fall together.' },
        { id: 'b', label: 'Onto but not one-to-one', why: 'For a square matrix, one-to-one and onto stand or fall together.' },
        { id: 'c', label: 'Both one-to-one and onto', why: 'That would make the matrix invertible, so its determinant would be nonzero.' },
        { id: 'd', label: 'Neither one-to-one nor onto', why: 'Right: $\\det = 0$ means not invertible, and the IMT makes both fail.' },
      ],
      hint: 'Square matrix: the Invertible Matrix Theorem ties all these statements together.',
      solution: [
        '$\\det A = 0$ means $A$ is not invertible.',
        'For a square matrix the Invertible Matrix Theorem says invertible $\\iff$ one-to-one $\\iff$ onto. All are false together, so $T$ is **neither** one-to-one nor onto.',
      ],
    },

    // 6
    {
      id: 'wo-inverse-review',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Find the inverse, then check it by multiplying.',
      prompt: `Find $A^{-1}$ for $A = ${texMat(INV_A)}$.`,
      answer: { type: 'matrix', value: INV.map((row) => row.map(String)) },
      hints: [
        `$\\det A = ${t(INV_D)}$, so expect ${INV_D.abs().eq(1) ? 'integer entries' : 'fractions'}.`,
        `Start from $[A \\mid I]$ with ${INV_FWD.map((st) => `$${texRowOp(st)}$`).join(', then ')}.`,
      ],
      solution: [
        `Row reduce $[A \\mid I] = ${texMat(INV_AUG, { augment: 3 })}$, one operation at a time:`,
        ...opLines(INV_RED.steps, 3),
        `The left block is now $I$, so the right block is $A^{-1} = ${texMat(INV)}$. (After the forward phase, row 3 already read $[${INV_FWD.at(-1).after[2].map(t).join(',\\ ')}]$: integers, as $\\det A = ${t(INV_D)}$ promised.)`,
        `Check: $${CHECK_TEX}$.`,
      ],
    },

    // 7
    {
      id: 'fill-det-review',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Determinant rules. $A${A} is three by three with determinant $5${five}.',
      prompt: '$A$ is a $3\\times 3$ matrix with $\\det A = 5$. Fill in each determinant.',
      lines: [
        ['\\det(A^T) = ', { id: 't', answer: { type: 'number', value: String(DR_T) } }],
        ['\\det(A^{-1}) = ', { id: 'inv', answer: { type: 'number', value: String(DR_INV) } }],
        ['\\det(A^2) = ', { id: 'sq', answer: { type: 'number', value: String(DR_SQ) } }],
        ['\\det(-A) = ', { id: 'neg', answer: { type: 'number', value: String(DR_NEG) } }],
        ['\\text{swap } R_1, R_3 \\text{ of } A, \\text{ then } R_2 \\to 3R_2:\\ \\det = ', { id: 'ops', answer: { type: 'number', value: String(DR_OPS) } }],
      ],
      solution: [
        `Transposing keeps the determinant: $\\det A^T = ${t(DR_T)}$.`,
        `$\\det(A^{-1}) = 1/\\det A = ${t(DR_INV)}$, and products multiply: $\\det(A^2) = (\\det A)^2 = ${t(DR_SQ)}$.`,
        `$-A$ scales each of the 3 rows by $-1$: $\\det(-A) = (-1)^3 \\det A = ${t(DR_NEG)}$.`,
        `A swap flips the sign ($${t(DR.neg())}$), and scaling one row by $${t(DR_OPS_K)}$ multiplies the determinant by $${t(DR_OPS_K)}$: $${t(DR_OPS)}$.`,
      ],
    },

    // 8
    {
      id: 'recap-det',
      title: 'Recap: three ways to a determinant',
      scene(s) {
        const m = s.matrix(DM, { x: 295, y: 175, size: 40, visible: false });
        const lab = s.tex('A =', { x: 150, y: 175, size: 40, anchor: [1, 0.5], visible: false });
        const thumb = s.matrix(DM, { x: 815, y: 175, size: 30, color: C.muted, visible: false });
        const thumbL = s.tex('A =', { x: 715, y: 175, size: 30, color: C.muted, anchor: [1, 0.5], visible: false });
        const cof = s.tex(
          `\\det A = \\part{c}{${t(DM_COEF)}}\\det${texMat(DM_MINOR)} = ${t(DM_COEF)}(${t(DM_MD)}) = ${t(DM_D)}`,
          { x: 480, y: 385, size: 34, visible: false },
        );
        const tri = s.tex(
          `\\text{${DM_SWAPS} swap: } \\det A = ${DM_SWAPS % 2 ? '-' : ''}(${DM_DIAG.map(t).join(')(')}) = ${t(DM_D)}`,
          { x: 480, y: 495, size: 34, visible: false },
        );
        const ck = s.tex('\\checkmark', { x: 820, y: 495, size: 40, color: C.green, visible: false });
        return { m, lab, thumb, thumbL, cof, tri, ck };
      },
      steps: [
        {
          say: 'Here\'s one matrix, three ways. First, cofactor expansion along the column with the most zeros: only the $4${four} survives, with a minus sign from its position.',
          do: async (s, o) => {
            await s.all(o.m.fadeIn(), o.lab.fadeIn());
            await o.m.highlightCol(DM_COL, C.yellow);
            await o.m.pivot(DM_ROW, DM_COL, { color: C.yellow });
            await o.cof.write({ duration: 1300 });
          },
        },
        {
          say: 'Second, row reduce to a triangular matrix $U${U}, keeping track of swaps and scalings. Here two replacements and one swap, and the swap flips the sign.',
          do: async (s, o) => {
            await s.all(o.m.clearHighlights(), o.m.clearPivots(), o.thumb.fadeIn(), o.thumbL.fadeIn());
            for (const st of DM_FWD) await o.m.rowOp(st);
            await s.all(o.m.note(), o.lab.swap('U ='));
            await s.all([0, 1, 2].map((i) => o.m.pivot(i, i, { delay: i * 150 })));
          },
        },
        {
          say: 'Third, the determinant of the triangular $U${U} is the product of its diagonal, and the one swap flips the sign: $\\det A = -(1)(4)(-5) = 20${det A equals minus one times four times minus five, which is twenty}. All three agree.',
          do: async (s, o) => {
            await o.tri.write();
            await o.ck.fadeIn({ shift: [0, 0] });
          },
        },
      ],
    },

    // 8b (review addition: Cramer's rule)
    {
      id: 'try-cramer-review',
      kind: 'try',
      title: 'Your turn',
      say: 'A quick Cramer\'s rule question. You only need one unknown.',
      prompt: `Use Cramer's rule to find $x_2$ for the system $\\;2x_1 + x_2 = ${t(CR_B[0])},\\; 3x_1 + 4x_2 = ${t(CR_B[1])}$.`,
      answer: { type: 'number', value: String(CR_X[1]) },
      hint: `Put $\\mathbf{b}$ in column 2: $x_2 = \\det A_2(\\mathbf{b}) / \\det A$.`,
      solution: [
        `$\\det A = \\det${texMat(CR_A)} = ${t(CR_A[0][0].mul(CR_A[1][1]))} - ${t(CR_A[0][1].mul(CR_A[1][0]))} = ${t(CR_D)}$, nonzero, so Cramer's rule applies.`,
        `$\\det A_2(\\mathbf{b}) = \\det${texMat(CR_A2)} = ${t(CR_A2[0][0].mul(CR_A2[1][1]))} - ${t(CR_A2[0][1].mul(CR_A2[1][0]))} = ${t(CR_D2)}$, so $x_2 = \\dfrac{${t(CR_D2)}}{${t(CR_D)}} = ${t(CR_X[1])}$.`,
        `(And $x_1 = ${t(CR_X[0])}$. Check: $2(${t(CR_X[0])}) + ${t(CR_X[1])} = ${t(CR_X[0].mul(2).add(CR_X[1]))}$, $3(${t(CR_X[0])}) + 4(${t(CR_X[1])}) = ${t(CR_X[0].mul(3).add(CR_X[1].mul(4)))}$.)`,
      ],
    },

    // 9
    {
      id: 'wo-lu-det',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Factor $A${A} into $L${L} times $U${U}, enter $L${L}, then use the factors to read off the determinant.',
      prompt: `Find the LU factorization of $A = ${texMat(LU_A)}$ and enter $L$. Then use it to find $\\det A$.`,
      answer: { type: 'matrix', value: LU_L.map((row) => row.map(String)) },
      hints: [
        `Multipliers for column 1: ${LU_FWD.filter((st) => st.j === 0).map((st) => `$${t(st.k.neg())}$`).join(' and ')} (they go into $L$ below the diagonal).`,
        `After those, row 2 is $(${LU_AFTER_COL1[1].map(t).join(', ')})$ and row 3 is $(${LU_AFTER_COL1[2].map(t).join(', ')})$.`,
        '$\\det A = \\det L \\cdot \\det U$, and $\\det L = 1$ (unit lower triangular).',
      ],
      solution: [
        `Forward elimination without swaps, one replacement at a time (the multiplier $\\ell_{ij}$ is minus the $k$ in $R_i \\to R_i + kR_j$):`,
        ...opLines(LU_FWD),
        `So $L = ${texMat(LU_L)}$ holds the multipliers, and $U = ${texMat(LU_U)}$ is the echelon form. Check: $LU = A$.`,
        `$\\det A = \\det L \\det U = 1 \\cdot ${[0, 1, 2].map((i) => t(LU_U[i][i])).join(' \\cdot ')} = ${t(LU_D)}$.`,
      ],
    },

    // 10
    {
      id: 'try-product-defined',
      kind: 'try',
      title: 'Your turn',
      say: 'Sizes matter. Which one can\'t be computed?',
      prompt: '$A$ is $2\\times 3$, $B$ is $3\\times 3$, $C$ is $3\\times 2$. Which expression is **not** defined?',
      answer: { type: 'choice', value: 'c' },
      choices: [
        { id: 'a', label: '$ABC$', why: '$2\\times 3$ times $3\\times 3$ times $3\\times 2$: inner sizes match, result $2\\times 2$.' },
        { id: 'b', label: '$CA + B$', why: '$CA$ is $3\\times 3$, same as $B$, so the sum is defined.' },
        { id: 'c', label: '$AC + B$', why: 'Right: $AC$ is $2\\times 2$ but $B$ is $3\\times 3$, so they can\'t be added.' },
        { id: 'd', label: '$BC$', why: '$3\\times 3$ times $3\\times 2$ is defined: $3\\times 2$.' },
      ],
      hint: 'An $m\\times n$ times an $n\\times p$ is $m\\times p$; sums need equal sizes.',
      solution: [
        '$AC$ is $(2\\times 3)(3\\times 2) = 2\\times 2$, while $B$ is $3\\times 3$. Matrices of different sizes can\'t be added, so $AC + B$ is undefined.',
        'The others work: $ABC$ is $2\\times 2$, $CA + B$ is $3\\times 3$, and $BC$ is $3\\times 2$.',
      ],
    },

    // 11
    {
      id: 'try-solution-set',
      kind: 'try',
      title: 'Your turn',
      say: 'What does the solution set look like?',
      prompt: `Which describes the solution set of $${texMat(NS_A)}\\mathbf{x} = \\mathbf{0}$?`,
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: 'Only $\\mathbf{0}$', why: '3 unknowns and only 2 pivots leave a free variable.' },
        { id: 'b', label: `A line through $\\mathbf{0}$, spanned by $(${NS_V.map(t).join(', ')})$`, why: 'Right: one free variable gives a line through the origin.' },
        { id: 'c', label: 'A plane through $\\mathbf{0}$', why: 'Only one free variable, so a line, not a plane.' },
        { id: 'd', label: 'A line not through $\\mathbf{0}$', why: 'Homogeneous solution sets always contain $\\mathbf{0}$.' },
      ],
      hint: 'Row reduce and count free variables.',
      solution: [
        `The reduced form is $${texMat(NS_R)}$: pivots in columns 1 and 2, so $x_3$ is free.`,
        `$\\mathbf{x} = x_3${texVec(NS_V)}$: a line through the origin.`,
      ],
    },

    // 11a (review addition: parametric vector form)
    {
      id: 'fill-param-review',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Two free variables this time. Write the general solution in parametric vector form.',
      prompt: `The augmented matrix of a system row reduces to $${texMat(PV_R, { augment: 4 })}$. Complete its general solution.`,
      lines: [
        [
          { tex: '\\mathbf{x} = \\begin{bmatrix} \\blank{p1} \\\\ 0 \\\\ \\blank{p3} \\\\ 0 \\end{bmatrix}', blanks: {
            p1: { answer: { type: 'number', value: String(PV.particular[0]) }, hint: 'Set both free variables to 0 and read the last column.' },
            p3: { answer: { type: 'number', value: String(PV.particular[2]) } },
          } },
          { tex: '+\\, x_2\\begin{bmatrix} \\blank{u1} \\\\ 1 \\\\ 0 \\\\ 0 \\end{bmatrix}', blanks: {
            u1: { answer: { type: 'number', value: String(PV.basis[0][0]) }, hint: `Row 1 says $${PV_X1}$.` },
          } },
          { tex: '+\\, x_4\\begin{bmatrix} \\blank{v1} \\\\ 0 \\\\ \\blank{v3} \\\\ 1 \\end{bmatrix}', blanks: {
            v1: { answer: { type: 'number', value: String(PV.basis[1][0]) } },
            v3: { answer: { type: 'number', value: String(PV.basis[1][2]) }, hint: `Row 2 says $${PV_X3}$.` },
          } },
        ],
      ],
      solution: [
        'Pivots are in columns 1 and 3, so $x_2$ and $x_4$ are free.',
        `Row 1: $${PV_X1}$. Row 2: $${PV_X3}$.`,
        `So $\\mathbf{x} = ${texVec(PV.particular)} + x_2${texVec(PV.basis[0])} + x_4${texVec(PV.basis[1])}$: a particular solution plus one direction vector per free variable.`,
      ],
    },

    // 11b (review addition: Nul A, Col A, rank)
    {
      id: 'wo-col-nul',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Find a basis for the null space, and while you\'re there, a basis for the column space and the rank. Like Lay\'s Example 3, there are two free variables, so you get one basis vector for each.',
      prompt: `Let $A = ${texMat(CN_A)}$. Find a basis for $\\operatorname{Nul} A$. (Then also give a basis for $\\operatorname{Col} A$ and $\\operatorname{rank} A$.)`,
      answer: { type: 'basis', value: CN_NUL.map((v) => v.map(String)) },
      hints: [
        'Row reduce $A$ all the way to reduced echelon form.',
        `The pivots are in columns ${CN_PIV.map((c) => c + 1).join(' and ')}; ${CN_FREE.map((c) => `$x_${c + 1}$`).join(' and ')} are free. Write the basic variables in terms of them.`,
        'For $\\operatorname{Col} A$, use the pivot columns of $A$ itself, not of the reduced form.',
      ],
      solution: [
        `Row reduce $A$:`,
        ...opLines(CN_RED.steps),
        `Pivots in columns ${CN_PIV.map((c) => c + 1).join(' and ')}, so ${CN_FREE.map((c) => `$x_${c + 1}$`).join(' and ')} are free. The solutions of $A\\mathbf{x} = \\mathbf{0}$ are $\\mathbf{x} = ${CN_NUL.map((v, k) => `x_${CN_FREE[k] + 1}${texVec(v)}`).join(' + ')}$, so $\\left\\{${CN_NUL.map(texVec).join(', ')}\\right\\}$ is a basis for $\\operatorname{Nul} A$.`,
        `The pivot columns of $A$ itself, $\\left\\{${CN_COL.map(texVec).join(', ')}\\right\\}$, are a basis for $\\operatorname{Col} A$, and $\\operatorname{rank} A = ${CN_RED.rank}$. Check the Rank Theorem: $${CN_RED.rank} + ${CN_NUL.length} = 4$ columns.`,
      ],
    },

    // 12
    {
      id: 'cp-review-1',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the last tips, explain this in your own words.',
      prompt: 'Pick a $3\\times 3$ matrix you know is not invertible and explain four different ways to see it: pivots, columns, determinant, and the map.',
      points: [
        'Fewer than 3 pivots: its reduced echelon form is not $I$',
        'The columns are linearly dependent (give a dependence relation)',
        '$\\det A = 0$',
        'The map collapses $\\mathbb{R}^3$ onto a plane or a line, so it is neither one-to-one nor onto',
        '$A\\mathbf{x} = \\mathbf{0}$ has nontrivial solutions',
      ],
    },

    // 13
    {
      id: 'exam-tips',
      title: 'Before the exam',
      scene(s) {
        const items = [
          'Check by multiplying back: $A\\mathbf{x}$, $AA^{-1}$',
          'Label every row operation you do',
          'Read pivot positions from an echelon form',
          'Say which theorem you are using',
        ].map((str, k) => {
          const txt = s.text(str, { x: 120, y: 95 + 68 * k, size: 32, anchor: [0, 0.5], visible: false });
          const ck = s.tex('\\checkmark', { x: 80, y: 95 + 68 * k, size: 36, color: C.green, visible: false });
          return { txt, ck };
        });
        const check = s.tex(CHECK_TEX, { x: 480, y: 470, size: 30, visible: false });
        return { items, check };
      },
      steps: [
        {
          say: 'Every answer in these chapters can be checked by multiplying back. A solution goes into $A\\mathbf{x}${A x}; an inverse times $A${A} should give $I${I}.',
          do: async (s, o) => {
            await s.all(o.items[0].txt.fadeIn({ shift: [-12, 0] }), o.items[0].ck.fadeIn({ shift: [0, 0], delay: 300 }));
            await o.check.write({ duration: 1400 });
          },
        },
        {
          say: 'Write the row operation beside each line. It keeps you from changing two rows at once, and it\'s how partial credit finds you.',
          do: async (s, o) => {
            await o.check.fadeOut();
            await s.all(o.items[1].txt.fadeIn({ shift: [-12, 0] }), o.items[1].ck.fadeIn({ shift: [0, 0], delay: 300 }));
          },
        },
        {
          say: 'Read pivots from an echelon form, not the original matrix. And when a theorem does the work, name it. Good luck.',
          do: (s, o) => s.stagger(o.items.slice(2).map((it) => () => s.all(it.txt.fadeIn({ shift: [-12, 0] }), it.ck.fadeIn({ shift: [0, 0], delay: 300 }))), 900),
        },
      ],
    },
  ],
};
