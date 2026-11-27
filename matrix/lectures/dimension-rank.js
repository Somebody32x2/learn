/**
 * Lecture 16 · Dimension and rank (Lay 4.5–4.6). Design: matrix/PLAN.md § 16.
 * Every matrix, basis, dimension and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import {
  mat, vec, fromCols, addVec, subVec, rref, rank, solve, inSpan, nullspace, colspace, rowspace, texMat, texRowOp,
} from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- TeX helpers

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;
const cvec = (v) => `\\begin{bmatrix}${v.map(t).join('\\\\')}\\end{bmatrix}`;
function comb(pairs) {
  let out = '';
  for (const [c0, name] of pairs) {
    const c = F(c0);
    if (c.zero) continue;
    const a = c.abs();
    const k = a.eq(1) ? '' : t(a);
    if (!out) out = `${c.sign() < 0 ? '-' : ''}${k}${name}`;
    else out += ` ${c.sign() < 0 ? '-' : '+'} ${k}${name}`;
  }
  return out || '0';
}

// ---------------------------------------------------------------- data

/** Beat 1: a plane H in R³ with two different bases, and a vector off the plane. */
const HB1 = [2, 0, 1];
const HB2 = [0, 2, 1];
const HC1 = addVec(vec(HB1), vec(HB2)).map(Number); // (2, 2, 2)
const HC2 = subVec(vec(HB1), vec(HB2)).map(Number); // (2, −2, 0)
const HC1_REL = solve(fromCols([HB1, HB2]), HC1).x;
const HOUT = [0, 0, 2];
if (inSpan(HOUT, [HB1, HB2])) throw new Error('dimension-rank: HOUT must leave the plane');

/** Beat 2: a plane through 0 given by one equation. */
const EQ = [1, -3, 1];
const EQ_NUL = nullspace([EQ]);
/** A vector off that plane extends its basis to a basis of R³ (Theorem 11). */
const EXT = [1, 0, 0];
if (inSpan(EXT, EQ_NUL)) throw new Error('dimension-rank: EXT must leave the plane');

/** Beat 3: dim {(a, b, c, d) : a − 3b + c = 0}. */
const TD = [[1, -3, 1, 0]];
const TD_DIM = TD[0].length - rank(TD);

/** Beats 4–6, 13: the running matrix. */
const RA = mat([[1, 2, 1, 0, 3], [2, 4, 3, 1, 7], [1, 2, 0, -1, 2]]);
const RRED = rref(RA);
const RN = RA[0].length;
const RPIV = RRED.pivots.map(([, c]) => c);
const RFREE = [...Array(RN).keys()].filter((c) => !RPIV.includes(c));
const RROW = rowspace(RA);
const RCOL = colspace(RA);
const RNUL = nullspace(RA);
const RRANK = RRED.rank;

/** Beat 7: a 6 × 8 matrix of rank 4. */
const FM = 6;
const FN = 8;
const FR = 4;

/** Beat 8: rows at pivot positions of the original matrix are the wrong choice. */
const MR = mat([[1, 2], [2, 4], [0, 1]]);
const MR_RED = rref(MR);
const MR_FWD = MR_RED.steps.filter((st) => st.phase === 'forward');
const MR_ECH = MR_RED.echelon.filter((row) => row.some((x) => !x.zero));
const MR_BAD = MR.slice(0, MR_ECH.length);
const MR_BAD_RANK = rank(MR_BAD);
const MR_BAD_K = MR_BAD[1][0].div(MR_BAD[0][0]);

/** Beat 9: smallest possible nullity of a 5 × 7 matrix. */
const PM = 5;
const PN = 7;
const P_MIN_NUL = PN - Math.min(PM, PN);

/** Beat 10: an invertible 3 × 3 matrix whose reduction shows n pivots. */
const IMT_A = mat([[1, 2, 0], [2, 5, 1], [0, 1, 3]]);
const IMT_RED = rref(IMT_A);
const IMT_FWD = IMT_RED.steps.filter((st) => st.phase === 'forward');
if (IMT_RED.rank !== 3) throw new Error('dimension-rank: IMT_A must be invertible');

// ---------------------------------------------------------------- workout: three bases of a 3 × 4 rank-2 matrix

function threeItem(A0) {
  const A = mat(A0);
  const red = rref(A);
  const fwd = red.steps.filter((st) => st.phase === 'forward');
  const rows = rowspace(A);
  const cols = colspace(A);
  const nul = nullspace(A);
  const echRows = red.echelon.filter((row) => row.some((x) => !x.zero));
  return {
    prompt: `For $A = ${texMat(A)}$ find a basis for $\\operatorname{Row}A$.`,
    answer: { type: 'basis', value: rows.map((r) => r.map(String)) },
    hints: [`Row reduce: ${fwd.map((st) => `$${texRowOp(st)}$`).join(', ')}.`, `That gives the echelon form $${texMat(red.echelon)}$. Its nonzero rows are a basis for $\\operatorname{Row}A$.`],
    solution: [
      `Row reduce $A = ${texMat(A)}$, one operation at a time:`,
      ...fwd.map((st) => `$${texRowOp(st)}$: $${texMat(st.after)}$`),
      `That is an echelon form. Its nonzero rows $${echRows.map(tup).join(',\\ ')}$ are a basis for $\\operatorname{Row}A$ (the reduced echelon rows $${rows.map(tup).join(',\\ ')}$ span the same space and work too). So $\\operatorname{rank}A = ${red.rank}$.`,
      ...(red.steps.length > fwd.length ? ['For the null space, keep going to the reduced echelon form:', ...red.steps.slice(fwd.length).map((st) => `$${texRowOp(st)}$: $${texMat(st.after)}$`)] : []),
      `For comparison: the pivot columns of $A$ itself, $${cols.map(cvec).join(',\\ ')}$, are a basis for $\\operatorname{Col}A$, and the parametric form of $A\\mathbf{x} = \\mathbf{0}$ gives the basis $${nul.map(cvec).join(',\\ ')}$ for $\\operatorname{Nul}A$.`,
      `Rank Theorem check: $${red.rank} + ${nul.length} = ${A[0].length}$.`,
    ],
  };
}
const WO_A = [[1, -1, 2, 3], [2, -2, 5, 7], [-1, 1, -1, -2]];
const WO = threeItem(WO_A);
{
  const red = rref(WO_A);
  const fwd = red.steps.filter((st) => st.phase === 'forward');
  const after = fwd[1].after;
  WO.hints = [
    `Start with $${texRowOp(fwd[0])}$ and $${texRowOp(fwd[1])}$.`,
    `Rows 2 and 3 become equal: both are $${tup(after[1])}$. One more replacement makes row 3 zero.`,
  ];
}

/** Fresh 3 × 4 matrices of rank 2 with an integer forward phase. */
function generateThree(rand) {
  for (;;) {
    const p2 = rand.pick([1, 2]);
    const r1 = [1, rand.int(-3, 3), rand.int(-3, 3), rand.int(-3, 3)];
    const r2 = [0, 0, 0, 0].map((_, j) => (j < p2 ? 0 : j === p2 ? 1 : rand.int(-3, 3)));
    const E = [[1, 0], [rand.nonzero(-3, 3), 1], [rand.nonzero(-2, 2), rand.nonzero(-2, 2)]];
    const A = E.map(([a, b]) => r1.map((x, j) => a * x + b * r2[j]));
    if (rank(A) !== 2) continue;
    const red = rref(A);
    if (!red.steps.every((st) => st.after.every((row) => row.every((v) => v.d === 1n && v.abs().cmp(20) <= 0)))) continue;
    if (A.flat().filter((x) => x === 0).length > 4) continue;
    return threeItem(A);
  }
}

// ---------------------------------------------------------------- shared scene builders

/** Beats 5 and 13: the three bases of RA with their dimensions. */
function threePanels(s, { top = 270, visible = false } = {}) {
  const xs = [170, 470, 780];
  const heads = ['\\operatorname{Row}A', '\\operatorname{Col}A', '\\operatorname{Nul}A'].map((h, k) =>
    s.tex(h, { x: xs[k], y: top, size: 34, color: [C.green, C.blue, C.orange][k], visible }),
  );
  const row = s.tex(`\\begin{gathered}${RROW.map(tup).join('\\\\')}\\end{gathered}`, { x: xs[0], y: top + 125, size: 30, color: C.green, visible });
  const col = s.tex(RCOL.map(cvec).join('\\ '), { x: xs[1], y: top + 125, size: 30, color: C.blue, visible });
  const nul = s.tex(RNUL.map(cvec).join('\\ '), { x: xs[2], y: top + 143, size: 30, color: C.orange, visible });
  const dims = [RROW.length, RCOL.length, RNUL.length].map((d, k) => s.tex(`\\dim = ${d}`, { x: xs[k], y: top + 278, size: 32, visible }));
  return { heads, row, col, nul, dims };
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'dimension-rank',
  title: 'Dimension and rank',
  goals: [
    'Know that every basis of a space has the same size, its dimension',
    'Read dim Nul A and dim Col A off an echelon form; use the Basis Theorem',
    'Find a basis for Row A and apply the Rank Theorem: rank A + dim Nul A = n',
    'Add rank conditions to the Invertible Matrix Theorem',
  ],
  beats: [
    // 1
    {
      id: 'same-size',
      title: 'Every basis has the same size',
      scene(s) {
        const sp = s.space({ x: 660, y: 310, size: 430, range: 3, yaw: -35, pitch: 18, visible: false });
        const H = sp.plane(HB1, HB2, { color: C.muted, extent: 1.15, visible: false });
        const b1 = sp.vector(HB1, { color: C.blue, label: '\\mathbf{b}_1', visible: false });
        const b2 = sp.vector(HB2, { color: C.red, label: '\\mathbf{b}_2', visible: false });
        const c1 = sp.vector(HC1, { color: C.teal, label: '\\mathbf{c}_1', visible: false });
        const c2 = sp.vector(HC2, { color: C.orange, label: '\\mathbf{c}_2', visible: false });
        const w = sp.vector(HOUT, { color: C.yellow, label: '\\mathbf{w}', visible: false });
        const thm9 = s.defCard({ x: 230, y: 190, width: 400, kind: 'theorem', title: 'Theorem 9', body: 'If $V$ has a basis of $n$ vectors, any $n + 1$ vectors in $V$ are linearly dependent.', visible: false });
        const rel = s.tex(`\\mathbf{c}_1 = ${comb([[HC1_REL[0], '\\mathbf{b}_1'], [HC1_REL[1], '\\mathbf{b}_2']])}`, { x: 220, y: 380, size: 36, color: C.teal, visible: false });
        const thm10 = s.defCard({ x: 220, y: 195, width: 380, kind: 'theorem', title: 'Theorem 10', body: 'If $V$ has a basis of $n$ vectors, every basis of $V$ has exactly $n$ vectors. That $n$ is the **dimension** $\\dim V$.', visible: false });
        const dims = [
          '\\dim \\mathbb{R}^n = n',
          '\\dim \\mathbb{P}_n = n + 1',
          '\\dim M_{2\\times 2} = 4',
          '\\dim \\{\\mathbf{0}\\} = 0',
        ].map((tx, i) => s.tex(tx, { x: 500, y: 150 + 85 * i, size: 36, anchor: [0, 0.5], visible: false }));
        return { sp, H, b1, b2, c1, c2, w, thm9, rel, thm10, dims };
      },
      steps: [
        {
          say: 'Here\'s a plane $H${H} with a basis of two vectors. Theorem nine says any three vectors in $H${H} are dependent. Try a third one, $\\mathbf{c}_1${c one}: it\'s just $\\mathbf{b}_1 + \\mathbf{b}_2${b one plus b two}.',
          do: async (s, o) => {
            await o.sp.draw({ duration: 700 });
            await s.all(o.H.fadeIn({ shift: [0, 0] }), o.b1.grow(), o.b2.grow({ delay: 250 }));
            await o.thm9.reveal();
            await o.c1.grow();
            await o.rel.write();
          },
        },
        {
          say: 'So no basis of $H${H} can have three vectors, and one vector can\'t span a plane. Here\'s a second basis, $\\mathbf{c}_1${c one} and $\\mathbf{c}_2${c two}: two again. A third independent vector would have to leave the plane.',
          do: async (s, o) => {
            await s.all(o.b1.fadeOut(), o.b2.fadeOut(), o.rel.fadeOut(), o.thm9.fadeOut());
            await o.c2.grow();
            await s.all(o.c1.indicate({ color: C.teal }), o.c2.indicate({ color: C.orange }));
            await o.w.grow();
            await o.w.flash({ color: C.yellow });
            await o.thm10.reveal();
          },
        },
        {
          say: 'That common size is the dimension. $\\mathbb{R}^n${R n} has dimension $n${n}. $\\mathbb{P}_n${P n} has dimension $n + 1${n plus one}, because of the constant term. Two by two matrices have dimension four, and the zero space has dimension zero.',
          do: async (s, o) => {
            await o.sp.fadeOut();
            await o.thm10.indicate({ scale: 1.04, color: C.blue });
            await s.stagger(o.dims.map((d) => () => d.write({ duration: 700 })), 1100);
          },
        },
      ],
    },

    // 2
    {
      id: 'subspaces-r3',
      title: 'Subspaces of ℝ³ by dimension',
      scene(s) {
        const sp = s.space({ x: 640, y: 310, size: 430, range: 3.5, yaw: -35, pitch: 18, visible: false });
        const kinds = ['\\{\\mathbf{0}\\}', '\\text{lines through } \\mathbf{0}', '\\text{planes through } \\mathbf{0}', '\\mathbb{R}^3'].map((tx, d) =>
          s.tex(`${d}:\\ ${tx}`, { x: 50, y: 110 + 70 * d, size: 32, anchor: [0, 0.5], visible: false }),
        );
        const zero = sp.point([0, 0, 0], { color: C.green, r: 11, visible: false });
        const line = sp.line([0, 0, 0], [1, 2, 1.5], { color: C.green, width: 4, visible: false });
        const plane = sp.plane([2, 0, 1], [0, 2, 1], { color: C.green, extent: 1.1, visible: false });
        const axes3 = [[2.5, 0, 0], [0, 2.5, 0], [0, 0, 2.5]].map((v) => sp.vector(v, { color: C.green, width: 4, visible: false }));
        const eq = s.tex('x_1 - 3x_2 + x_3 = 0', { x: 200, y: 420, size: 36, color: C.blue, visible: false });
        const cnt = s.tex(`\\dim = 3 - ${rank([EQ])} = ${EQ_NUL.length}`, { x: 200, y: 490, size: 34, visible: false });
        const P = sp.plane({ normal: EQ, d: 0 }, { color: C.blue, extent: 2.2, visible: false });
        const nv = EQ_NUL.map((v, k) => sp.vector(v.map(Number), { color: k ? C.red : C.blue, label: `\\mathbf{u}_${k + 1}`, visible: false }));
        const ext = sp.vector(EXT, { color: C.yellow, label: '\\mathbf{w}', visible: false });
        const thm11 = s.defCard({
          x: 225, y: 250, width: 400, kind: 'theorem', title: 'Theorem 11',
          body: 'A subspace $H$ of a finite-dimensional $V$ has $\\dim H \\le \\dim V$, and any independent set in $H$ extends to a basis of $H$.',
          visible: false,
        });
        const inf = s.text('$\\mathbb{P}$, all polynomials, has no finite basis: it is **infinite-dimensional**.', { x: 225, y: 500, width: 400, size: 30, color: C.muted, visible: false });
        return { sp, kinds, zero, line, plane, axes3, eq, cnt, P, nv, ext, thm11, inf };
      },
      steps: [
        {
          say: 'Classify subspaces of $\\mathbb{R}^3${R three} by dimension, and there are only four kinds: the zero subspace, lines through the origin, planes through the origin, and all of $\\mathbb{R}^3${R three}.',
          do: async (s, o) => {
            await o.sp.draw({ duration: 700 });
            await s.all(o.kinds[0].fadeIn({ shift: [-12, 0] }), o.zero.draw());
            await s.all(o.kinds[1].fadeIn({ shift: [-12, 0] }), o.line.draw({ duration: 700 }));
            await s.all(o.line.fadeOut({ delay: 300 }), o.kinds[2].fadeIn({ shift: [-12, 0] }), o.plane.fadeIn({ shift: [0, 0] }));
            await s.all(o.plane.fadeOut({ delay: 300 }), o.kinds[3].fadeIn({ shift: [-12, 0] }), ...o.axes3.map((v, k) => v.grow({ delay: 300 + 150 * k })));
          },
        },
        {
          say: 'A plane through the origin given by one equation, like $x_1 - 3x_2 + x_3 = 0${x one minus three x two plus x three equals zero}, has dimension two, not one. It\'s the null space of a one by three matrix of rank one, so three minus one: two free variables, two basis vectors.',
          do: async (s, o) => {
            await s.all(...o.axes3.map((v) => v.fadeOut()), o.zero.fadeOut(), o.kinds[2].indicate({ color: C.blue }));
            await s.all(o.eq.write(), o.P.fadeIn({ shift: [0, 0] }));
            await o.cnt.write();
            await s.all(...o.nv.map((v, k) => v.grow({ delay: k * 300 })));
          },
        },
        {
          say: 'A subspace never has more dimensions than the space around it, and an independent set inside it can always be extended to a basis. Add one vector off this plane, and you have a basis of $\\mathbb{R}^3${R three}. Some spaces, like all polynomials, have no finite basis at all: they\'re infinite dimensional.',
          do: async (s, o) => {
            await s.all(o.eq.fadeOut(), o.cnt.fadeOut(), ...o.kinds.map((k) => k.fadeOut()));
            await o.thm11.reveal();
            await o.ext.grow();
            await o.ext.flash({ color: C.yellow });
            await o.inf.fadeIn();
          },
        },
      ],
    },

    // 3
    {
      id: 'try-dim',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. One equation, four unknowns: count the free variables.',
      prompt: 'What is $\\dim\\{(a, b, c, d) : a - 3b + c = 0\\}$?',
      answer: { type: 'number', value: String(TD_DIM) },
      hint: 'It is the null space of a $1 \\times 4$ matrix. How many free variables?',
      solution: [
        `The subspace is $\\operatorname{Nul}\\begin{bmatrix}${TD[0].join(' & ')}\\end{bmatrix}$.`,
        `That matrix has rank $${rank(TD)}$ (one pivot, on $a$), so $b$, $c$, $d$ are free: $\\dim = ${TD[0].length} - ${rank(TD)} = ${TD_DIM}$.`,
        'One equation in four unknowns cuts the dimension down by one, not to one.',
      ],
    },

    // 4
    {
      id: 'row-space',
      title: 'The row space',
      scene(s) {
        const m = s.matrix(RA, { x: 330, y: 150, size: 40, visible: false });
        const rlabs = [0, 1, 2].map((i) => s.tex(`\\mathbf{r}_${i + 1}`, { x: m.rowBox(i).x - 40, y: m.rowBox(i).cy, size: 32, color: C.muted, visible: false }));
        const span = s.tex('\\operatorname{Row}A = \\operatorname{Span}\\{\\mathbf{r}_1, \\mathbf{r}_2, \\mathbf{r}_3\\} \\subseteq \\mathbb{R}^5', { x: 480, y: 300, size: 36, visible: false });
        const thm = s.defCard({
          x: 480, y: 445, width: 870, kind: 'theorem', title: 'Theorem 13',
          body: 'Row equivalent matrices have the same row space. The nonzero rows of an echelon form of $A$ are a basis for $\\operatorname{Row}A$.',
          visible: false,
        });
        const basis = s.tex(`\\text{basis: } ${RROW.map(tup).join(',\\ ')}`, { x: 480, y: 300, size: 36, color: C.green, visible: false });
        return { m, rlabs, span, thm, basis };
      },
      steps: [
        {
          say: 'The row space of $A${A}, $\\operatorname{Row}A${row A}, is the span of its rows. Here each row is a vector in $\\mathbb{R}^5${R five}.',
          do: async (s, o) => {
            await o.m.fadeIn();
            await s.stagger(o.rlabs.map((l, i) => () => s.all(l.fadeIn({ shift: [-10, 0] }), o.m.highlightRow(i, C.green))), 350);
            await o.span.write();
            await o.m.clearHighlights();
          },
        },
        {
          say: 'A row operation replaces a row by a combination of rows, and it can be undone. So the span never changes: row equivalent matrices have the same row space.',
          do: async (s, o) => {
            await s.all(...o.rlabs.map((l) => l.fadeOut()));
            for (const st of RRED.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), o.thm.reveal());
          },
        },
        {
          say: 'The zero row adds nothing, and the nonzero rows of an echelon form are independent. So they\'re a basis: $(1, 2, 0, -1, 2)${one, two, zero, minus one, two} and $(0, 0, 1, 1, 1)${zero, zero, one, one, one}.',
          do: async (s, o) => {
            await s.all(o.m.highlightRow(0, C.green), o.m.highlightRow(1, C.green), o.m.highlightRow(2, C.muted));
            await s.all(o.span.fadeOut(), o.basis.write({ delay: 200 }));
          },
        },
      ],
    },

    // 5
    {
      id: 'three-bases',
      title: 'Three bases from one reduction',
      scene(s) {
        const A = s.matrix(RA, { x: 260, y: 120, size: 30 });
        const R = s.matrix(RRED.R, { x: 720, y: 120, size: 30 });
        const lA = s.tex('A', { x: 60, y: 120, size: 34 });
        const sim = s.tex('\\sim', { x: 490, y: 120, size: 40 });
        return { A, R, lA, sim, ...threePanels(s) };
      },
      steps: [
        {
          say: 'One reduction gives all three bases. For the row space, take the nonzero rows of the echelon form.',
          do: async (s, o) => {
            await s.all(o.R.highlightRow(0, C.green), o.R.highlightRow(1, C.green));
            await s.all(o.heads[0].fadeIn(), o.row.fadeIn({ shift: [0, -20] }));
          },
        },
        {
          say: 'For the column space, the pivots tell you which columns, but you take those columns from the original $A${A}: here columns one and three.',
          do: async (s, o) => {
            await o.R.clearHighlights();
            await s.all(...RRED.pivots.map(([i, j]) => o.R.pivot(i, j, { color: C.yellow })));
            await s.all(...RPIV.map((j) => o.A.highlightCol(j, C.blue)));
            await s.all(o.heads[1].fadeIn(), o.col.fadeIn({ shift: [0, -20] }));
          },
        },
        {
          say: 'For the null space, solve $A\\mathbf{x} = \\mathbf{0}${A x equals zero} from the reduced form: one basis vector for each free variable, and there are three.',
          do: async (s, o) => {
            await s.all(...RFREE.map((j) => o.R.highlightCol(j, C.orange)));
            await s.all(o.heads[2].fadeIn(), o.nul.fadeIn({ shift: [0, -20] }));
          },
        },
        {
          say: 'So the dimensions are two, two, and three. Row and column space match, and that\'s no accident.',
          do: (s, o) => s.stagger(o.dims.map((d) => () => d.fadeIn()), 500),
        },
      ],
    },

    // 6
    {
      id: 'rank-theorem',
      title: 'The Rank Theorem',
      scene(s) {
        const def = s.tex('\\operatorname{rank}A = \\dim\\operatorname{Col}A = \\dim\\operatorname{Row}A', { x: 480, y: 70, size: 38, visible: false });
        const thm = s.tex('\\operatorname{rank}A + \\dim\\operatorname{Nul}A = n', { x: 480, y: 140, size: 38, visible: false });
        const m = s.matrix(RRED.R, { x: 330, y: 320, size: 44 });
        const sum = s.tex(`\\col{blue}{${RRANK}} + \\col{orange}{${RFREE.length}} = ${RN}`, { x: 330, y: 488, size: 44, visible: false });
        const labs = s.tex('\\text{pivots} + \\text{free} = \\text{columns}', { x: 330, y: 545, size: 30, color: C.muted, visible: false });
        const tr = s.tex('\\begin{gathered}\\operatorname{Row}A = \\operatorname{Col}A^T\\\\ \\Downarrow \\\\ \\operatorname{rank}A^T = \\operatorname{rank}A\\end{gathered}', { x: 760, y: 340, size: 34, visible: false });
        return { def, thm, m, sum, labs, tr };
      },
      steps: [
        {
          say: 'Each pivot gives one basis row, its row of the echelon form, and one basis column, its column of $A${A}. So the row space and column space have the same dimension, and we call it the rank.',
          do: async (s, o) => {
            await s.all(...RRED.pivots.map(([i, j]) => o.m.pivot(i, j, { color: C.yellow })));
            await s.all(...RRED.pivots.map(([i]) => o.m.highlightRow(i, C.green)));
            await s.all(o.m.clearHighlights(), ...RPIV.map((j) => o.m.highlightCol(j, C.blue)));
            await o.def.write();
          },
        },
        {
          say: 'Every column either has a pivot or belongs to a free variable. Pivots give the rank, free variables give the null space, so $\\operatorname{rank}A + \\dim\\operatorname{Nul}A = n${rank A plus the dimension of the null space of A equals n}. Here, $2 + 3 = 5${two plus three equals five}.',
          do: async (s, o) => {
            await s.all(...RFREE.map((j) => o.m.highlightCol(j, C.orange)));
            await o.thm.write();
            await s.all(o.sum.write(), o.labs.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'And since the rows of $A${A} are the columns of $A^T${A transpose}, $\\operatorname{rank}A^T${the rank of A transpose} equals $\\operatorname{rank}A${the rank of A}.',
          do: (s, o) => o.tr.write({ duration: 1200 }),
        },
      ],
    },

    // 7
    {
      id: 'fill-rank-dims',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks. The Rank Theorem does all the work.',
      prompt: `$A$ is $${FM}\\times ${FN}$ with $\\operatorname{rank}A = ${FR}$.`,
      lines: [
        ['\\dim\\operatorname{Nul}A = ', { id: 'nul', answer: { type: 'number', value: String(FN - FR) } }],
        ['\\dim\\operatorname{Row}A = ', { id: 'row', answer: { type: 'number', value: String(FR) } }],
        ['\\dim\\operatorname{Nul}A^T = ', { id: 'nult', answer: { type: 'number', value: String(FM - FR) }, hint: `$A^T$ is $${FN}\\times ${FM}$ with the same rank.` }],
      ],
      solution: [
        `$\\dim\\operatorname{Nul}A = n - \\operatorname{rank}A = ${FN} - ${FR} = ${FN - FR}$.`,
        `$\\dim\\operatorname{Row}A = \\operatorname{rank}A = ${FR}$.`,
        `$A^T$ is $${FN}\\times ${FM}$ with rank $${FR}$, so $\\dim\\operatorname{Nul}A^T = ${FM} - ${FR} = ${FM - FR}$.`,
      ],
    },

    // 8
    {
      id: 'mistake-row-basis',
      title: 'The trap: rows of A at pivot positions',
      scene(s) {
        const lA = s.tex('A', { x: 50, y: 190, size: 36, visible: false });
        const A = s.matrix(MR, { x: 170, y: 190, size: 44, visible: false });
        const W = s.matrix(MR, { x: 470, y: 190, size: 44, visible: false });
        const colNote = s.tex('\\operatorname{Col}A:\\ \\text{pivot columns of } A\\ \\checkmark', { x: 480, y: 380, size: 32, color: C.blue, visible: false });
        const bad = s.tex(`${tup(MR_BAD[0])},\\ ${tup(MR_BAD[1])}:\\ ${tup(MR_BAD[1])} = ${t(MR_BAD_K)}${tup(MR_BAD[0])}`, { x: 480, y: 440, size: 34, color: C.yellow, visible: false });
        const good = s.tex(`\\operatorname{Row}A:\\ ${MR_ECH.map(tup).join(',\\ ')}\\ \\checkmark`, { x: 480, y: 530, size: 36, color: C.green, visible: false });
        return { lA, A, W, colNote, bad, good };
      },
      steps: [
        {
          say: 'Reduce this matrix. Along the way rows two and three swap, and the echelon form\'s nonzero rows are its rows one and two. For a basis of $\\operatorname{Col}A${col A}, you go back to the pivot columns of $A${A}, and that\'s right.',
          do: async (s, o) => {
            await s.all(o.lA.fadeIn(), o.A.fadeIn(), o.W.fadeIn());
            for (const st of MR_FWD) await o.W.rowOp(st);
            await s.all(o.W.note(), o.W.highlightRow(0, C.green), o.W.highlightRow(1, C.green));
            await o.colNote.fadeIn();
          },
        },
        {
          say: 'Here\'s the trap: doing the same for rows. Rows one and two of $A${A} are $(1, 2)${one, two} and $(2, 4)${two, four}, and the second is twice the first. They\'re dependent, so they\'re not a basis of anything two dimensional.',
          do: async (s, o) => {
            await s.all(o.colNote.fadeOut(), o.A.highlightRow(0, C.yellow), o.A.highlightRow(1, C.yellow));
            await o.bad.write();
            await s.strike(o.bad, { color: 'yellow' });
          },
        },
        {
          say: 'Row operations moved rows around and mixed them, so for $\\operatorname{Row}A${row A}, don\'t go back to $A${A}. Use the nonzero rows of the echelon form.',
          do: async (s, o) => {
            await o.A.clearHighlights();
            await o.W.indicate({ color: C.green });
            await o.good.write();
          },
        },
      ],
    },

    // 9
    {
      id: 'try-possible',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Think about how large the rank can be.',
      prompt: `Can a $${PM}\\times ${PN}$ matrix have a one-dimensional null space?`,
      answer: { type: 'choice', value: P_MIN_NUL > 1 ? 'no' : 'yes' },
      choices: [
        { id: 'yes', label: 'Yes', why: `That needs rank $${PN - 1}$, but the rank is at most $${PM}$, the number of rows.` },
        { id: 'no', label: 'No', why: `Right: the rank is at most $${PM}$, so the null space has dimension at least $${PN} - ${PM} = ${P_MIN_NUL}$.` },
      ],
      hint: 'Each pivot needs its own row.',
      solution: [
        `A $${PM}\\times ${PN}$ matrix has at most one pivot per row, so $\\operatorname{rank}A \\le ${PM}$.`,
        `By the Rank Theorem, $\\dim\\operatorname{Nul}A = ${PN} - \\operatorname{rank}A \\ge ${PN} - ${PM} = ${P_MIN_NUL}$.`,
        'So the null space is at least two-dimensional: a one-dimensional null space is impossible.',
      ],
    },

    // 10
    {
      id: 'basis-theorem-imt',
      title: 'Basis Theorem and the IMT, continued',
      scene(s) {
        const thm = s.defCard({
          x: 480, y: 125, width: 860, kind: 'theorem', title: 'Theorem 12 (Basis Theorem)',
          body: 'In a $p$-dimensional space, any $p$ linearly independent vectors form a basis, and so do any $p$ vectors that span it.',
          visible: false,
        });
        const p = s.plane({ x: 690, y: 390, width: 320, range: [-3, 3, -2, 2.5], labels: false, visible: false });
        const u = p.vector([1, 1], { color: C.blue, label: '\\mathbf{u}', transform: false, visible: false });
        const v = p.vector([2, -1], { color: C.red, label: '\\mathbf{v}', transform: false, visible: false });
        const note = s.text('Two independent vectors in $\\mathbb{R}^2$: no need to check spanning.', { x: 260, y: 390, width: 380, size: 30, visible: false });
        const head = s.tex('A\\ n\\times n \\text{ invertible} \\iff', { x: 250, y: 245, size: 34, visible: false });
        const M = s.matrix(IMT_A, { x: 730, y: 375, size: 44, visible: false });
        const rk = s.tex(`\\operatorname{rank}A = ${IMT_RED.rank} = n`, { x: 730, y: 545, size: 32, color: C.green, visible: false });
        const imt = [
          '\\text{m. columns form a basis of } \\mathbb{R}^n',
          '\\text{n. } \\operatorname{Col}A = \\mathbb{R}^n',
          '\\text{o. } \\dim\\operatorname{Col}A = n',
          '\\text{p. } \\operatorname{rank}A = n',
          '\\text{q. } \\operatorname{Nul}A = \\{\\mathbf{0}\\}',
          '\\text{r. } \\dim\\operatorname{Nul}A = 0',
        ].map((tx, i) => s.tex(tx, { x: 50, y: 300 + 48 * i, size: 30, anchor: [0, 0.5], visible: false }));
        return { thm, p, u, v, note, head, imt, M, rk };
      },
      steps: [
        {
          say: 'Knowing the dimension halves the work. In a $p${p} dimensional space, $p${p} independent vectors automatically span, and $p${p} spanning vectors are automatically independent.',
          do: async (s, o) => {
            await o.thm.reveal();
            await o.p.draw({ duration: 700 });
            await s.all(o.u.grow(), o.v.grow({ delay: 250 }));
            await s.all(o.p.applyMatrix([[1, 2], [1, -1]], { duration: 1400 }), o.note.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'For a square matrix, this gives more ways to say invertible: the columns form a basis, the column space is all of $\\mathbb{R}^n${R n}, the rank is $n${n}, and the null space is just zero. Here, three pivots in a three by three matrix: rank three.',
          do: async (s, o) => {
            await s.all(o.p.fadeOut(), o.note.fadeOut());
            await s.all(o.head.write(), o.M.fadeIn());
            await s.stagger(o.imt.slice(0, 3).map((m) => () => m.fadeIn({ shift: [-12, 0] })), 450);
            for (const st of IMT_FWD) await o.M.rowOp(st, { note: false });
            await s.all(o.imt[3].fadeIn({ shift: [-12, 0] }), ...IMT_RED.pivots.map(([i, j]) => o.M.pivot(i, j, { color: C.yellow })));
            await s.all(o.rk.write(), o.imt[3].indicate({ color: C.green }));
            await s.stagger(o.imt.slice(4).map((m) => () => m.fadeIn({ shift: [-12, 0] })), 450);
          },
        },
      ],
    },

    // 11
    {
      id: 'wo-three-bases',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Find a basis for the row space, and while you\'re at it, the column space and null space too.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateThree,
    },

    // 12
    {
      id: 'cp-row-col-rank',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: 'Why do $\\operatorname{Row}A$ and $\\operatorname{Col}A$ always have the same dimension, even though they live in different spaces?',
      points: [
        'Both dimensions equal the number of pivot positions in an echelon form of $A$',
        'The pivot columns of $A$ form a basis of $\\operatorname{Col}A$, one per pivot',
        'The nonzero rows of an echelon form, one per pivot, form a basis of $\\operatorname{Row}A$',
        'Row operations do not change the row space, so the echelon rows really span $\\operatorname{Row}A$',
      ],
    },

    // 13
    {
      id: 'summary-dim',
      title: 'Summary',
      scene(s) {
        const panels = threePanels(s, { top: 58, visible: true });
        const items = [
          'Dimension: the size of any basis.',
          'One reduction gives bases of Row A, Col A and Nul A.',
          'rank A + dim Nul A = n.',
        ].map((str, i) => s.text(str, { x: 480, y: 420 + 50 * i, size: 32, visible: false }));
        return { ...panels, items };
      },
      steps: [
        {
          say: 'Dimension is the size of any basis: every basis of a space has the same number of vectors.',
          do: async (s, o) => {
            await s.all(...o.dims.map((d) => d.indicate()));
            await o.items[0].fadeIn();
          },
        },
        {
          say: 'One row reduction gives bases for the row space, the column space, and the null space.',
          do: async (s, o) => {
            await s.all(o.row.indicate({ color: C.green }), o.col.indicate({ color: C.blue }), o.nul.indicate({ color: C.orange }));
            await o.items[1].fadeIn();
          },
        },
        {
          say: 'And rank plus nullity is the number of columns. Next time we use bases to translate between coordinate systems.',
          do: (s, o) => o.items[2].fadeIn(),
        },
      ],
    },
  ],
};

