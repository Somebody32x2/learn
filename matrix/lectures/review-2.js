/**
 * Lecture 22 · Midterm 2 review (Lay ch. 4–5). Design: matrix/PLAN.md § 22.
 * Every matrix, basis, eigenvalue and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import {
  mat, vec, mul, mulVec, addVec, scaleVec, rref, nullspace, colspace, solve, rationalEigen, eigenspace, charPoly,
  fromCols, identity, texMat, texRowOp,
} from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- helpers (pure)

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;
const posFirst = (v) => (v.find((x) => !x.zero).sign() < 0 ? v.map((x) => x.neg()) : v);
/** Smallest integer multiple of a rational vector (keeps the sign of the first nonzero entry positive). */
function intVec(v) {
  const g = (a, b) => (b ? g(b, a % b) : a < 0n ? -a : a);
  const l = v.reduce((acc, x) => (acc * x.d) / g(acc, x.d), 1n);
  const w = v.map((x) => x.mul(F(l)));
  const h = w.reduce((acc, x) => g(acc, x.n), 0n) || 1n;
  return posFirst(w.map((x) => x.div(F(h))));
}
const power = (A, k) => Array.from({ length: k }).reduce((P) => mul(P, A), identity(A.length));
/** λ² + c1 λ + c0 as TeX from charPoly coefficients [1, c1, c0]. */
function polyTex([, c1, c0]) {
  const mid = c1.zero ? '' : ` ${c1.sign() < 0 ? '-' : '+'} ${c1.abs().eq(1) ? '' : t(c1.abs())}\\lambda`;
  const end = c0.zero ? '' : ` ${c0.sign() < 0 ? '-' : '+'} ${t(c0.abs())}`;
  return `\\lambda^2${mid}${end}`;
}

// ---------------------------------------------------------------- data

/** Beat 2: dimension counting. */
const DIM = { m: 5, n: 7, nul: 3 };
const DIM_RANK = DIM.n - DIM.nul;
const DIM_NULT = DIM.m - DIM_RANK;
/** {p in P2 : p(1) = 0}: coefficients (a0, a1, a2) with a0 + a1 + a2 = 0. */
const P2_DIM = nullspace([[1, 1, 1]]).length;

/** Beat 4: Nul A and Col A. */
const NA = mat([[1, 2, -1, 0], [2, 4, 1, 3], [-1, -2, 2, 1]]);
const NA_RED = rref(NA);
const NA_FWD = NA_RED.steps.filter((st) => st.phase === 'forward');
const NA_NUL = nullspace(NA);
const NA_COL = colspace(NA);
const NA_PIV = NA_RED.pivots.map(([, c]) => c);
const NA_FREE = [0, 1, 2, 3].filter((j) => !NA_PIV.includes(j));

/** Beat 5: change of coordinates. */
const CB_P = mat([[1, 2], [0, 1]]);
const CB_X = vec([1, 1]);
const CB_C = mulVec(CB_P, CB_X);

/** Beat 6: the eigen workflow on a fresh matrix. */
const RE = mat([[4, 1], [2, 3]]);
const RE_POLY = charPoly(RE);
const RE_EIG = rationalEigen(RE).map(({ value }) => ({ value, v: intVec(eigenspace(RE, value)[0]) }));
const RE_P = fromCols(RE_EIG.map((e) => e.v));
const RE_D = RE_EIG.map((e, i) => RE_EIG.map((_, j) => (i === j ? e.value : F(0))));
const RE_AV = mulVec(RE, RE_EIG[0].v);

/** Beat 7: powers by eigenvectors. */
const PW = mat([[6, -1], [2, 3]]);
const PW_POLY = charPoly(PW);
const PW_EIG = rationalEigen(PW).map(({ value }) => ({ value, v: intVec(eigenspace(PW, value)[0]) })).sort((a, b) => a.value.cmp(b.value));
const PW_V = vec([2, 3]);
const PW_K = 5;
const PW_W = solve(fromCols(PW_EIG.map((e) => e.v)), PW_V).x;
const PW_ANS = mulVec(power(PW, PW_K), PW_V);
{
  const viaEigen = PW_EIG.reduce((acc, e, j) => addVec(acc, scaleVec(PW_W[j].mul(e.value.n ** BigInt(PW_K)), e.v)), vec([0, 0]));
  if (!viaEigen.every((x, i) => x.eq(PW_ANS[i]))) throw new Error('review-2: power check failed');
}
const powTex = (b, w) => `${F(w).eq(1) ? '' : t(w)}${t(b)}^{${PW_K}}`;

/** Beat 8: steady state. */
const MK = mat([['0.7', '0.4'], ['0.3', '0.6']]);
const MK_Q = (() => {
  const v = eigenspace(MK, 1)[0];
  const s = v.reduce((a, x) => a.add(x), F(0));
  return v.map((x) => x.div(s));
})();
const MK_HALF = mulVec(MK, vec(['1/2', '1/2']));
const dec = (x) => String(Number(x));

/** Beat 9: rotation-scaling powers. */
const CX = mat([[0, -2], [2, 0]]);
const CX_POLY = charPoly(CX);
const CX_R = 2; // |±2i|

/** Beat 9b: x′ = Ax with a saddle. */
const DE = mat([[1, 2], [2, 1]]);
const DE_POLY = charPoly(DE);
const DE_EIG = rationalEigen(DE).map(({ value }) => ({ value, v: intVec(eigenspace(DE, value)[0]) })); // 3, −1
const expT = (l) => (F(l).eq(1) ? 'e^{t}' : F(l).eq(-1) ? 'e^{-t}' : `e^{${t(l)}t}`);

/** Beat 10: a repeated eigenvalue with a big enough eigenspace. */
const DG = { n: 3, rankAmI: 1 };
const DG_DIM1 = DG.n - DG.rankAmI;

// ---------------------------------------------------------------- scene helpers (DOM only when called)

/** A flowchart node: text in a rounded box, centered at (x, y). */
function node(s, str, x, y, { color = C.ink, size = 30 } = {}) {
  const txt = s.text(str, { x, y, size, visible: false });
  const t0 = txt.box();
  const b = { x: t0.x - 16, y: t0.y - 10, w: t0.w + 32, h: t0.h + 20 };
  const box = s.rect(b.x, b.y, b.w, b.h, { color, radius: 14, visible: false });
  return { txt, box, b, show: (o) => Promise.all([box.draw(o), txt.fadeIn({ shift: [0, 0], ...o })]) };
}
/** A row of nodes spread evenly between x0 and x1 at height y (measured, so the gaps are equal). */
function nodeRow(s, strs, y, x0, x1, opts) {
  const nodes = strs.map((str) => node(s, str, 480, y, opts));
  const gap = (x1 - x0 - nodes.reduce((a, n) => a + n.b.w, 0)) / Math.max(1, strs.length - 1);
  let x = x0;
  for (const n of nodes) {
    const dx = x - n.b.x;
    n.txt.set({ x: n.txt.x + dx });
    n.b.x += dx;
    n.box.setRectNow(n.b.x, n.b.y, n.b.w, n.b.h);
    x += n.b.w + gap;
  }
  return nodes;
}
const right = (a) => [a.b.x + a.b.w + 6, a.b.y + a.b.h / 2];
const left = (a) => [a.b.x - 6, a.b.y + a.b.h / 2];
const arrowLR = (s, a, b, color = C.muted) => s.arrow(...right(a), ...left(b), { color, width: 3, visible: false });
const arrowDown = (s, a, b, color = C.muted) =>
  s.arrow(a.b.x + a.b.w / 2, a.b.y + a.b.h + 6, b.b.x + b.b.w / 2, b.b.y - 6, { color, width: 3, visible: false });

// ---------------------------------------------------------------- the lecture

export default {
  id: 'review-2',
  title: 'Midterm 2 review',
  goals: [
    'Move fluently between vector spaces, bases, coordinates and matrices',
    'Compute bases and dimensions for Nul, Col and Row, and translate between bases',
    'Find eigenvalues and eigenvectors, diagonalize, and use it: powers, Markov chains, x′ = Ax',
  ],
  beats: [
    // 1
    {
      id: 'map-ch4-5',
      title: 'The map of chapters 4 and 5',
      scene(s) {
        const ch4 = s.text('Chapter 4: choosing a description', { x: 480, y: 45, size: 30, color: C.blue, weight: 600, visible: false });
        const row1 = nodeRow(s, ['Vector space', 'Basis', 'Coordinates', 'Change of basis'], 120, 40, 920, { color: C.blue });
        const ch5 = s.text('Chapter 5: the best basis for $A$', { x: 40, y: 215, size: 30, color: C.purple, weight: 600, anchor: [0, 0.5], visible: false });
        const row2 = nodeRow(s, ['Eigenbasis', 'Diagonal: $A = PDP^{-1}$'], 300, 240, 900, { color: C.purple });
        const row3 = nodeRow(s, ['Powers $A^k$', 'Markov chains', "$\\mathbf{x}' = A\\mathbf{x}$"], 470, 80, 880, { color: C.green });
        const a1 = row1.slice(1).map((n, k) => arrowLR(s, row1[k], n, C.blue));
        const down = s.arrow(row1[3].b.x + row1[3].b.w / 2, row1[3].b.y + row1[3].b.h + 6, row2[0].b.x + row2[0].b.w * 0.8, row2[0].b.y - 6, { color: C.purple, width: 3, visible: false });
        const a2 = arrowLR(s, row2[0], row2[1], C.purple);
        const a3 = row3.map((n) => s.arrow(row2[1].b.x + row2[1].b.w / 2, row2[1].b.y + row2[1].b.h + 6, n.b.x + n.b.w / 2, n.b.y - 6, { color: C.green, width: 3, visible: false }));
        return { ch4, row1, ch5, row2, row3, a1, down, a2, a3 };
      },
      steps: [
        {
          say: 'Chapter 4 is about choosing descriptions. A vector space can be described by a basis; a basis turns every vector into a list of coordinates; and a change of basis translates one description into another.',
          do: async (s, o) => {
            await o.ch4.fadeIn();
            await o.row1[0].show();
            for (let k = 1; k < 4; k++) {
              await o.a1[k - 1].draw({ duration: 350 });
              await o.row1[k].show({ duration: 500 });
            }
          },
        },
        {
          say: 'Chapter 5 picks the best description for one particular matrix: a basis of its eigenvectors. In that basis the matrix is diagonal, and that\'s what makes powers, Markov chains and differential equations easy.',
          do: async (s, o) => {
            await o.ch5.fadeIn();
            await s.all(o.down.draw({ duration: 500 }), o.row2[0].show({ delay: 400 }));
            await o.a2.draw({ duration: 350 });
            await o.row2[1].show();
            await s.all(o.a3.map((a, k) => a.draw({ duration: 400, delay: k * 150 })), o.row3.map((n, k) => n.show({ delay: 300 + k * 150 })));
          },
        },
      ],
    },

    // 2
    {
      id: 'fill-dims',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Warm up with dimension counting. Every blank follows from the Rank Theorem or a single condition.',
      prompt: `Let $A$ be $${DIM.m}\\times ${DIM.n}$ with $\\dim\\operatorname{Nul} A = ${DIM.nul}$.`,
      lines: [
        ['\\operatorname{rank} A = ', { id: 'rank', answer: { type: 'number', value: String(DIM_RANK) } }],
        ['\\dim\\operatorname{Row} A = ', { id: 'row', answer: { type: 'number', value: String(DIM_RANK) } }],
        ['\\dim\\operatorname{Nul} A^T = ', { id: 'nult', answer: { type: 'number', value: String(DIM_NULT) } }],
        ['\\dim\\{p \\in \\mathbb{P}_2 : p(1) = 0\\} = ', { id: 'p2', answer: { type: 'number', value: String(P2_DIM) } }],
      ],
      solution: [
        `Rank Theorem: $\\operatorname{rank} A + \\dim\\operatorname{Nul} A = ${DIM.n}$ (the number of columns), so $\\operatorname{rank} A = ${DIM.n} - ${DIM.nul} = ${DIM_RANK}$.`,
        `$\\dim\\operatorname{Row} A = \\operatorname{rank} A = ${DIM_RANK}$: row rank equals column rank.`,
        `$A^T$ is $${DIM.n}\\times ${DIM.m}$ with the same rank, so $\\dim\\operatorname{Nul} A^T = ${DIM.m} - ${DIM_RANK} = ${DIM_NULT}$.`,
        `$\\mathbb{P}_2$ has dimension $3$, and $p(1) = a_0 + a_1 + a_2 = 0$ is one independent linear condition, leaving $3 - 1 = ${P2_DIM}$ (a basis: $t - 1$, $t^2 - 1$).`,
      ],
    },

    // 3
    {
      id: 'try-subspace-r2',
      kind: 'try',
      title: 'Your turn',
      say: 'Which of these is a subspace? Check the zero vector first, then closure.',
      prompt: 'Which set is a subspace of $\\mathbb{P}_2$?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '$\\{p : p(1) = 0\\}$', why: 'Right: it contains the zero polynomial, and sums and multiples of polynomials vanishing at $1$ still vanish at $1$.' },
        { id: 'b', label: '$\\{p : p(0) = 1\\}$', why: 'The zero polynomial has $p(0) = 0$, so it is not in the set: no zero vector.' },
        { id: 'c', label: '$\\{p : \\text{degree exactly } 2\\}$', why: '$t^2 + (-t^2) = 0$ has no degree $2$: not closed under addition (and no zero vector).' },
        { id: 'd', label: '$\\{p : p(t) \\ge 0 \\text{ for all } t\\}$', why: 'Not closed under scaling: multiply $p(t) = 1$ by $-1$.' },
      ],
      hint: 'A subspace must contain $\\mathbf{0}$ and be closed under addition and scalar multiplication.',
      solution: [
        'Test the zero polynomial first: it fails (b) because $0(0) = 0 \\neq 1$, and (c) because $0$ has no degree $2$.',
        'Set (d) contains $0$ but is not closed under scaling: $1 \\ge 0$ but $-1 \\cdot 1 < 0$.',
        'Set (a) passes all three: $0(1) = 0$; if $p(1) = q(1) = 0$ then $(p + q)(1) = 0$ and $(cp)(1) = 0$. It is the null space of the linear map $p \\mapsto p(1)$.',
      ],
    },

    // 4
    {
      id: 'wo-nul-col-review',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Row reduce, write the general solution of the homogeneous system, and read off a basis.',
      prompt: `For $A = ${texMat(NA)}$, find a basis for $\\operatorname{Nul} A$.`,
      answer: { type: 'basis', value: NA_NUL.map((v) => v.map(String)) },
      hints: [
        `$${texRowOp(NA_FWD[0])}$ and $${texRowOp(NA_FWD[1])}$ give rows $${tup(NA_FWD[1].after[1])}$ and $${tup(NA_FWD[1].after[2])}$.`,
        `The RREF is $${texMat(NA_RED.R)}$; the free variables are ${NA_FREE.map((j) => `$x_${j + 1}$`).join(' and ')}.`,
      ],
      solution: [
        `Row reduce, one operation at a time: ${NA_RED.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after)}$`).join('; ')}.`,
        `So $x_1 = -2x_2 - x_4$ and $x_3 = -x_4$, with ${NA_FREE.map((j) => `$x_${j + 1}$`).join(' and ')} free: $\\mathbf{x} = x_2${tup(NA_NUL[0])} + x_4${tup(NA_NUL[1])}$.`,
        `A basis for $\\operatorname{Nul} A$: $\\{${NA_NUL.map(tup).join(', ')}\\}$. For $\\operatorname{Col} A$ take the pivot columns ${NA_PIV.map((j) => j + 1).join(' and ')} of $A$ itself: $\\{${NA_COL.map(tup).join(', ')}\\}$.`,
        `Check with the Rank Theorem: $\\operatorname{rank} A + \\dim\\operatorname{Nul} A = ${NA_RED.rank} + ${NA_NUL.length} = 4$, the number of columns.`,
      ],
    },

    // 5
    {
      id: 'try-change-review',
      kind: 'try',
      title: 'Your turn',
      say: 'Change of coordinates. Read the arrow in the subscript carefully.',
      prompt: `$\\underset{\\mathcal{C}\\leftarrow\\mathcal{B}}{P} = ${texMat(CB_P)}$ and $[\\mathbf{x}]_{\\mathcal{B}} = ${tup(CB_X)}$. Find $[\\mathbf{x}]_{\\mathcal{C}}$.`,
      answer: { type: 'vector', value: CB_C.map(String) },
      hint: 'The matrix goes from $\\mathcal{B}$-coordinates to $\\mathcal{C}$-coordinates: multiply.',
      solution: [
        '$\\underset{\\mathcal{C}\\leftarrow\\mathcal{B}}{P}$ takes $\\mathcal{B}$-coordinates in and gives $\\mathcal{C}$-coordinates out: $[\\mathbf{x}]_{\\mathcal{C}} = \\underset{\\mathcal{C}\\leftarrow\\mathcal{B}}{P}[\\mathbf{x}]_{\\mathcal{B}}$.',
        `$${texMat(CB_P)}${texMat(CB_X.map((x) => [x]))} = ${texMat(CB_C.map((x) => [x]))}$, so $[\\mathbf{x}]_{\\mathcal{C}} = ${tup(CB_C)}$. No inverse needed; you would invert only to go from $\\mathcal{C}$ back to $\\mathcal{B}$.`,
      ],
    },

    // 6
    {
      id: 'recap-eigen',
      title: 'Recap: the eigen workflow',
      scene(s) {
        const X = 208;
        const steps = [
          ['$\\det(A - \\lambda I) = 0$', C.purple],
          ['each $\\lambda$: $\\operatorname{Nul}(A - \\lambda I)$', C.purple],
          ['enough vectors?', C.yellow],
          ['$P$ and $D$', C.green],
          ['$A^k = PD^kP^{-1}$', C.green],
        ].map(([str, color], k) => node(s, str, X, 85 + 105 * k, { color }));
        const arrows = steps.slice(1).map((n, k) => arrowDown(s, steps[k], n));
        const R = (tex, y, opts = {}) => s.tex(tex, { x: 410, y, size: 30, anchor: [0, 0.5], visible: false, ...opts });
        const w = [
          R(`A = ${texMat(RE)}:\\ ${polyTex(RE_POLY)} = 0`, 85),
          R(RE_EIG.map((e, j) => `\\lambda_${j + 1} = ${t(e.value)}:\\ ${tup(e.v)}`).join(';\\quad '), 195, { color: C.purple }),
          s.text('two independent eigenvectors ✓', { x: 410, y: 295, size: 30, anchor: [0, 0.5], visible: false }),
          R(`P = ${texMat(RE_P)},\\ \\ D = ${texMat(RE_D)}`, 400, { color: C.green }),
          R(`A^k = P${texMat(RE_D.map((r, i) => r.map((x, j) => (i === j ? `${t(x)}^k` : '0'))))}P^{-1}`, 505, { color: C.green }),
        ];
        const trap = s.text('from $A$ itself, not an echelon form', { x: 410, y: 152, size: 30, color: C.yellow, anchor: [0, 0.5], visible: false });
        return { steps, arrows, w, trap };
      },
      steps: [
        {
          say: 'Eigenvalues come first, and they come from $A${A} itself: solve $\\det(A - \\lambda I) = 0${the determinant of A minus lambda I equals zero}. Row reducing $A${A} first changes its eigenvalues, so don\'t.',
          do: async (s, o) => {
            await o.steps[0].show();
            await o.w[0].write();
            await o.trap.fadeIn();
          },
        },
        {
          say: 'Then, for each eigenvalue, find the eigenspace: the null space of $A - \\lambda I${A minus lambda I}. Here five gives $(1, 1)${one, one} and two gives $(1, -2)${one, minus two}.',
          do: async (s, o) => {
            await o.arrows[0].draw({ duration: 350 });
            await o.steps[1].show();
            await o.w[1].write({ duration: 1100 });
          },
        },
        {
          say: 'Before building $P${P}, count: you need $n${n} independent eigenvectors. Then the eigenvectors go into $P${P}, the eigenvalues into $D${D} in the same order, and powers are easy.',
          do: async (s, o) => {
            for (let k = 2; k < 5; k++) {
              await o.arrows[k - 1].draw({ duration: 300 });
              await s.all(o.steps[k].show({ duration: 500 }), o.w[k].fadeIn({ shift: [-12, 0], delay: 200 }));
            }
          },
        },
      ],
    },

    // 7
    {
      id: 'wo-power-review',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Split the vector into eigenvectors first; then the power is just two numbers raised to the fifth.',
      prompt: `$A = ${texMat(PW)}$. Compute $A^{${PW_K}}\\mathbf{v}$ for $\\mathbf{v} = ${tup(PW_V)}$ using eigenvectors.`,
      answer: { type: 'vector', value: PW_ANS.map(String) },
      hints: [
        `The characteristic equation is $${polyTex(PW_POLY)} = 0$ (trace $${t(PW[0][0].add(PW[1][1]))}$, determinant $${t(PW_POLY[2])}$): eigenvalues ${PW_EIG.map((e) => `$${t(e.value)}$`).join(' and ')}.`,
        `Eigenvectors ${PW_EIG.map((e) => `$${tup(e.v)}$ for $${t(e.value)}$`).join(' and ')}; write $\\mathbf{v} = ${PW_EIG.map((e, j) => `${PW_W[j].eq(1) ? '' : t(PW_W[j])}${tup(e.v)}`).join(' + ')}$.`,
      ],
      solution: [
        `Eigenvalues: $${polyTex(PW_POLY)} = 0$ gives ${PW_EIG.map((e) => `$\\lambda = ${t(e.value)}$`).join(' and ')}, with eigenvectors ${PW_EIG.map((e) => `$${tup(e.v)}$`).join(' and ')}.`,
        `Split $\\mathbf{v} = ${tup(PW_V)} = ${PW_EIG.map((e, j) => `${PW_W[j].eq(1) ? '' : t(PW_W[j])}${tup(e.v)}`).join(' + ')}$.`,
        `Each eigenvector is just scaled: $A^{${PW_K}}\\mathbf{v} = ${PW_EIG.map((e, j) => `${powTex(e.value, PW_W[j])}${tup(e.v)}`).join(' + ')} = ${tup(PW_ANS)}$.`,
      ],
    },

    // 8
    {
      id: 'try-markov-review',
      kind: 'try',
      title: 'Your turn',
      say: 'A Markov chain question. Which vector stays put, and for which eigenvalue?',
      prompt: `Which vector is the steady state of $P = \\begin{bmatrix}${MK.map((r) => r.map(dec).join(' & ')).join(' \\\\ ')}\\end{bmatrix}$, and which eigenvalue does it belong to?`,
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: `$(${t(MK_Q[1])}, ${t(MK_Q[0])})$, $\\lambda = 1$`, why: 'Swapped: row 1 of $(P - I)\\mathbf{q} = \\mathbf{0}$ says $0.3q_1 = 0.4q_2$, which makes $q_1$ the larger entry.' },
        { id: 'b', label: `$(${t(MK_Q[0])}, ${t(MK_Q[1])})$, $\\lambda = 1$`, why: 'Right: $P\\mathbf{q} = \\mathbf{q}$ and the entries add to $1$.' },
        { id: 'c', label: `$(${t(MK_Q[0])}, ${t(MK_Q[1])})$, $\\lambda = 0$`, why: '$P\\mathbf{q} = \\mathbf{q}$ means eigenvalue $1$, not $0$.' },
        { id: 'd', label: '$(\\tfrac{1}{2}, \\tfrac{1}{2})$, $\\lambda = 1$', why: `$P(\\tfrac12, \\tfrac12) = (${dec(MK_HALF[0])}, ${dec(MK_HALF[1])})$, which is not $(\\tfrac12, \\tfrac12)$.` },
      ],
      hint: 'A steady state solves $P\\mathbf{q} = \\mathbf{q}$, i.e. $(P - I)\\mathbf{q} = \\mathbf{0}$, and its entries add to $1$.',
      solution: [
        '$P\\mathbf{q} = \\mathbf{q}$ says $\\mathbf{q}$ is an eigenvector for $\\lambda = 1$.',
        '$P - I = \\begin{bmatrix} -0.3 & 0.4 \\\\ 0.3 & -0.4 \\end{bmatrix}$, so $0.3q_1 = 0.4q_2$, i.e. $q_1 = \\tfrac43 q_2$.',
        `Scale so the entries add to $1$: $\\mathbf{q} = ${tup(MK_Q)}$.`,
      ],
    },

    // 9
    {
      id: 'try-complex-review',
      kind: 'try',
      title: 'Your turn',
      say: 'Complex eigenvalues. Find them, and use their size.',
      prompt: `$A = ${texMat(CX)}$. The iterates $A^k\\mathbf{x}_0$ (for $\\mathbf{x}_0 \\neq \\mathbf{0}$) …`,
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: `spiral outward ($r = ${CX_R}$)`, why: `Right: $${polyTex(CX_POLY)} = 0$ gives $\\lambda = \\pm ${CX_R}i$, so each step rotates by $90^\\circ$ and stretches by $|\\lambda| = ${CX_R}$.` },
        { id: 'b', label: 'spiral inward', why: `$|\\lambda| = |\\pm ${CX_R}i| = ${CX_R} > 1$: lengths double every step.` },
        { id: 'c', label: 'converge to an eigenvector', why: 'There are no real eigenvectors: every direction gets rotated.' },
        { id: 'd', label: 'stay on a circle', why: 'That needs $r = 1$; here $r = 2$.' },
      ],
      hint: 'Write $A$ as $r$ times a rotation; $r = |\\lambda|$.',
      solution: [
        `$${polyTex(CX_POLY)} = 0$, so $\\lambda = \\pm ${CX_R}i$: $a = 0$, $b = ${CX_R}$.`,
        `$A = ${CX_R}\\begin{bmatrix} 0 & -1 \\\\ 1 & 0 \\end{bmatrix}$: a rotation by $90^\\circ$ times $r = ${CX_R}$.`,
        'Since $r > 1$, the iterates spiral outward, doubling in length every step.',
      ],
    },

    // 9b (added after review: x' = Ax was in the goals but had no item)
    {
      id: 'try-de-review',
      kind: 'try',
      title: 'Your turn',
      say: 'A differential equation. Find the eigenvalues and read off the picture.',
      prompt: `Classify the origin for $\\mathbf{x}' = A\\mathbf{x}$ with $A = ${texMat(DE)}$.`,
      answer: { type: 'choice', value: 'saddle' },
      choices: [
        { id: 'saddle', label: 'Saddle point', why: `Right: $\\lambda = ${DE_EIG.map((e) => t(e.value)).join(',\\ ')}$ have opposite signs; trajectories come in along $${tup(DE_EIG[1].v)}$ and leave along $${tup(DE_EIG[0].v)}$.` },
        { id: 'attractor', label: 'Attractor', why: `An attractor needs both eigenvalues negative; here $${t(DE_EIG[0].value)} > 0$.` },
        { id: 'repeller', label: 'Repeller', why: `A repeller needs both eigenvalues positive; here $${t(DE_EIG[1].value)} < 0$.` },
        { id: 'spiral', label: 'Spiral point', why: 'Spirals need complex eigenvalues; a symmetric matrix has real ones.' },
      ],
      hint: 'Trace and determinant give the characteristic polynomial; compare the signs of the two eigenvalues.',
      solution: [
        `$${polyTex(DE_POLY)} = 0$ gives $\\lambda = ${DE_EIG.map((e) => t(e.value)).join('$ and $')}$, with eigenvectors $${DE_EIG.map((e) => tup(e.v)).join('$ and $')}$.`,
        `Every solution is $\\mathbf{x}(t) = c_1${expT(DE_EIG[0].value)}${tup(DE_EIG[0].v)} + c_2${expT(DE_EIG[1].value)}${tup(DE_EIG[1].v)}$: one part grows, one decays.`,
        'Opposite signs: the origin is a **saddle point**.',
      ],
    },

    // 10
    {
      id: 'try-diag-review',
      kind: 'try',
      title: 'Your turn',
      say: 'A repeated eigenvalue. Is that a problem here? Count dimensions.',
      prompt: `$A$ is $${DG.n}\\times ${DG.n}$ with characteristic polynomial $-(\\lambda - 1)^2(\\lambda + 2)$ and $\\operatorname{rank}(A - I) = ${DG.rankAmI}$. Is $A$ diagonalizable?`,
      answer: { type: 'choice', value: 'yes' },
      choices: [
        { id: 'yes', label: 'Yes', why: `Right: $\\dim\\operatorname{Nul}(A - I) = ${DG.n} - ${DG.rankAmI} = ${DG_DIM1}$, plus one eigenvector for $\\lambda = -2$: ${DG.n} independent eigenvectors.` },
        { id: 'no', label: 'No', why: 'A repeated eigenvalue is fine when its eigenspace is as big as its multiplicity.' },
      ],
      hint: 'Use the Rank Theorem on $A - I$ to get the dimension of the eigenspace for $\\lambda = 1$.',
      solution: [
        `For $\\lambda = 1$ (multiplicity $2$): $\\dim\\operatorname{Nul}(A - I) = ${DG.n} - \\operatorname{rank}(A - I) = ${DG.n} - ${DG.rankAmI} = ${DG_DIM1}$.`,
        'For $\\lambda = -2$ (multiplicity $1$): the eigenspace has dimension $1$.',
        `Total $${DG_DIM1} + 1 = ${DG.n}$ independent eigenvectors, so $A$ is diagonalizable (Theorem 7 in Lay 5.3).`,
      ],
    },

    // 11
    {
      id: 'cp-review-2',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the last tips, explain this in your own words.',
      prompt: 'Explain how diagonalization, change of basis, and coordinates are the same idea.',
      points: [
        'The columns of $P$ form a basis $\\mathcal{B}$ of $\\mathbb{R}^n$',
        '$P = \\underset{\\mathcal{E}\\leftarrow\\mathcal{B}}{P}$ converts $\\mathcal{B}$-coordinates into standard coordinates; $P^{-1}$ goes back',
        '$[T]_{\\mathcal{B}} = P^{-1}AP$ is the matrix of $\\mathbf{x} \\mapsto A\\mathbf{x}$ in $\\mathcal{B}$-coordinates',
        'Choosing an eigenbasis makes that matrix the diagonal matrix $D$: in those coordinates $A$ just scales each coordinate',
      ],
    },

    // 12
    {
      id: 'exam-tips-2',
      title: 'Before the exam',
      scene(s) {
        const items = [
          'Name the space each object lives in: $\\mathbb{R}^m$ or $\\mathbb{R}^n$, $\\mathcal{B}$ or $\\mathcal{C}$',
          'Check an eigenvector by multiplying: $A\\mathbf{v} = \\lambda\\mathbf{v}$',
          'Check $P$ and $D$ with $AP = PD$ (no inverse needed)',
          'Normalize a steady state so its entries add to $1$',
        ].map((str, k) => s.text(str, { x: 110, y: 75 + 62 * k, size: 30, anchor: [0, 0.5], visible: false }));
        const ticks = items.map((it, k) => s.tex('\\checkmark', { x: 75, y: 75 + 62 * k, size: 36, color: C.green, visible: false }));
        const ex = s.tex(`A\\mathbf{v}_1 = ${texMat(RE)}${texMat(RE_EIG[0].v.map((x) => [x]))} = ${texMat(RE_AV.map((x) => [x]))} = ${t(RE_EIG[0].value)}${texMat(RE_EIG[0].v.map((x) => [x]))}`, { x: 440, y: 440, size: 36, visible: false });
        const ck = s.tex('\\checkmark', { x: 830, y: 440, size: 44, color: C.green, visible: false });
        const box = s.surround({ x: 110, y: 380, w: 760, h: 120 }, { color: C.green, visible: false });
        return { items, ticks, ex, ck, box };
      },
      steps: [
        {
          say: 'Most errors in these chapters are wrong-space errors: a vector in $\\mathbb{R}^m${R m} where one in $\\mathbb{R}^n${R n} belongs, or $\\mathcal{B}${B}-coordinates used as if they were standard ones. Name the space before you compute.',
          do: async (s, o) => {
            await s.stagger(o.items.map((it, k) => () => s.all(it.fadeIn({ shift: [-12, 0] }), o.ticks[k].fadeIn({ delay: 300 }))), 700);
          },
        },
        {
          say: 'And every eigen answer can be checked with one multiplication. Multiply $A${A} by your vector: if you get the eigenvalue times the vector, you\'re right. Good luck.',
          do: async (s, o) => {
            await s.all(o.items[1].indicate({ color: C.green, scale: 1.04 }));
            await o.ex.write({ duration: 1200 });
            await s.all(o.ck.fadeIn({ shift: [0, 0] }), o.box.draw());
          },
        },
      ],
    },
  ],
};
