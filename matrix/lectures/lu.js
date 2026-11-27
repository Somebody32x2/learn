/**
 * Lecture 9 · LU factorization (Lay 2.5). Design: matrix/PLAN.md § 9.
 * Every matrix, multiplier, substitution and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, mul, mulVec, rref, applyRowOp, identity, inverse, eqMat, clone, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
const par = (x) => (F(x).sign() < 0 ? `(${t(x)})` : t(x));
const signed = (x) => (F(x).sign() < 0 ? ` - ${t(F(x).abs())}` : ` + ${t(x)}`);

/**
 * LU without swaps (Lay 2.5): U = the echelon form reached with row replacements only, L = identity with the
 * multiplier ℓ = −k of each replacement R_i → R_i + kR_j at (i, j). Null when a swap would be needed.
 */
function luOf(A0) {
  const A = mat(A0);
  const n = A.length;
  const red = rref(A);
  const fwd = red.steps.filter((st) => st.phase === 'forward');
  if (red.rank < n || fwd.some((st) => st.op !== 'add') || red.pivots.some(([r, c]) => r !== c)) return null;
  const L = clone(identity(n));
  for (const st of fwd) L[st.i][st.j] = st.k.neg();
  const U = red.echelon;
  if (!eqMat(mul(L, U), A)) throw new Error('luOf: LU != A');
  return { A, L, U, fwd };
}

/** Forward substitution for unit lower L: values and one TeX line per y_i (`y_3 = 5 + 3 - 2 = 6`). */
function forwardSub(L, b0) {
  const b = vec(b0);
  const y = [];
  const lines = b.map((bi, i) => {
    let v = bi;
    let terms = '';
    for (let j = 0; j < i; j++) {
      if (L[i][j].zero) continue;
      const p = L[i][j].mul(y[j]);
      v = v.sub(p);
      if (!p.zero) terms += signed(p.neg());
    }
    y[i] = v;
    return { lhs: `y_${i + 1}`, rhs: terms ? `${t(bi)}${terms} = ` : '', val: t(v) };
  });
  return { y, lines };
}

/** Back substitution for upper U: values and one TeX line per x_i, bottom row first. */
function backSub(U, y0) {
  const y = vec(y0);
  const n = U.length;
  const x = Array(n);
  const lines = [];
  for (let i = n - 1; i >= 0; i--) {
    let v = y[i];
    let terms = '';
    for (let j = i + 1; j < n; j++) {
      if (U[i][j].zero) continue;
      const p = U[i][j].mul(x[j]);
      v = v.sub(p);
      if (!p.zero) terms += signed(p.neg());
    }
    x[i] = v.div(U[i][i]);
    const num = `${t(y[i])}${terms}`;
    const rhs = U[i][i].eq(1) ? (terms ? `${num} = ` : '') : `${terms ? `(${num})` : num}/${par(U[i][i])} = `;
    lines[i] = { lhs: `x_${i + 1}`, rhs, val: t(x[i]) };
  }
  return { x, lines };
}

/** The running example (beats 2, 4, 5, 7, 12). */
const LU = luOf([[2, 1, 1], [4, 3, 3], [-2, 1, 4]]);
const B = vec([3, 7, 5]);
const FS = forwardSub(LU.L, B);
const BS = backSub(LU.U, FS.y);
const AX = mulVec(LU.A, BS.x);

/** Beat 1: more right-hand sides for the same A. */
const BS_MORE = [B, mulVec(LU.A, vec([1, 1, -1])), mulVec(LU.A, vec([0, 2, 1]))];

/** Beat 3: same L, new b. */
const TRY_B = vec([1, 4, 2]);
const TRY = forwardSub(LU.L, TRY_B);

/** Beat 5: the elementary matrices of the three replacements, their inverses, and their product. */
const ELEM = LU.fwd.map((st) => applyRowOp(identity(3), st));
const ELEM_INV = ELEM.map((E) => inverse(E));
const ELEM_PROD = ELEM_INV.reduce((P, E) => mul(P, E));
if (!eqMat(ELEM_PROD, LU.L)) throw new Error('lu: product of inverse elementary matrices != L');
/** Lay's algorithm: for each pivot column, the entries at and below the pivot (at the moment it is used), ÷ pivot. */
const LAY_COLS = (() => {
  let state = LU.A;
  const out = [];
  for (let c = 0; c < 3; c++) {
    const colv = state.slice(c).map((row) => row[c]);
    out.push({ c, state, raw: colv, div: colv.map((v) => v.div(colv[0])), pivot: colv[0] });
    for (const st of LU.fwd.filter((s0) => s0.j === c)) state = applyRowOp(state, st);
  }
  return out;
})();

/** Beat 6: a 2×2 for the blanks. */
const SMALL = luOf([[1, 2], [3, 8]]);

/** Beat 7: L with the sign of ℓ21 flipped, and what it multiplies back to. */
const WRONG_L = clone(LU.L);
WRONG_L[1][0] = LU.L[1][0].neg();
const WRONG = mul(WRONG_L, LU.U);

/** Beat 8: a matrix that needs a swap. */
const SWAP = mat([[0, 1], [1, 1]]);
const SWAP_RED = rref(SWAP);
const SWAP_P = applyRowOp(identity(2), SWAP_RED.steps[0]);
const SWAP_PA = mul(SWAP_P, SWAP);

// ---------------------------------------------------------------- workout

function luItem(A0) {
  const { A, L, U, fwd } = luOf(A0);
  const cols = [0, 1].map((c) => fwd.filter((st) => st.j === c));
  const after1 = cols[0].length ? cols[0].at(-1).after : A;
  const ops = (sts) => sts.map((st) => `$${texRowOp(st)}$`).join(', ');
  const opMats = (sts) => sts.map((st) => `$${texRowOp(st)}$: $${texMat(st.after)}$`).join(', then ');
  const mults = fwd.map((st) => `$\\ell_{${st.i + 1}${st.j + 1}} = ${t(st.k.neg())}$`).join(', ');
  return {
    prompt: `Find the LU factorization of $$A = ${texMat(A)}$$ (no row interchanges are needed). Enter $L$.`,
    answer: { type: 'matrix', value: L.map((row) => row.map(String)) },
    hints: [
      cols[0].length ? `Clear column 1 below the first pivot: ${ops(cols[0])}. Record each multiplier in $L$.` : 'Column 1 already has zeros below the pivot, so the first column of $L$ is $(1, 0, 0)$.',
      cols[1].length
        ? `After column 1 the matrix is $${texMat(after1)}$. Now clear column 2 below its pivot; the multiplier is (entry) ÷ (pivot).`
        : `After column 1 the matrix is $${texMat(after1)}$, which already has a zero below the second pivot: that multiplier is $0$.`,
    ],
    solution: [
      fwd.length
        ? `Reduce $A$ with row replacements only: ${opMats(fwd)}. That echelon form is $U = ${texMat(U)}$.`
        : `$A$ is already upper triangular, so $U = A = ${texMat(U)}$.`,
      `Each replacement $R_i \\to R_i - \\ell R_j$ puts $\\ell$ in $L$ at row $i$, column $j$: ${mults || 'there are none'}. With ones on the diagonal, $L = ${texMat(L)}$.`,
      `Check: $LU = ${texMat(mul(L, U))} = A$.`,
    ],
  };
}
const WO = luItem([[1, 2, 1], [2, 6, 1], [-1, 0, 4]]);

/** Random unit lower L (entries −3..3) times random upper U (nonzero diagonal, entries −3..3), A entries ≤ 20. */
function generateLU(rand) {
  for (;;) {
    const L = [[1, 0, 0], [rand.int(-3, 3), 1, 0], [rand.int(-3, 3), rand.int(-3, 3), 1]];
    const U = [[rand.nonzero(-3, 3), rand.int(-3, 3), rand.int(-3, 3)], [0, rand.nonzero(-3, 3), rand.int(-3, 3)], [0, 0, rand.nonzero(-3, 3)]];
    if ([L[1][0], L[2][0], L[2][1]].filter((v) => v !== 0).length < 2) continue;
    const A = mul(mat(L), mat(U));
    if (A.some((row) => row.some((v) => v.abs().cmp(20) > 0))) continue;
    const lu = luOf(A);
    if (!lu) continue;
    if (lu.fwd.some((st) => st.after.some((row) => row.some((v) => !v.isInt || v.abs().cmp(20) > 0)))) continue;
    return luItem(A);
  }
}

// ---------------------------------------------------------------- scene helpers

function paint(tex, name, color) {
  for (const e of tex.part(name)) e.style.color = color;
  return tex;
}
const checked = (s, tex, opts) => paint(s.tex(`${tex}\\ \\part{ck}{\\checkmark}`, opts), 'ck', C.green);
const subLine = (ln) => `${ln.lhs} = ${ln.rhs}\\part{v}{${ln.val}}`;
const plainLine = (ln) => `${ln.lhs} = ${ln.rhs}${ln.val}`;
/** `2y_1 + y_2` / `-y_1 + 2y_2 + y_3` from a row of L. */
function linY(row) {
  let out = '';
  row.forEach((c, j) => {
    if (c.zero) return;
    const a = c.abs();
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + `y_${j + 1}`;
  });
  return out;
}

/** Shape matrices for "L lower, U upper". */
const L_SHAPE = [['1', '0', '0'], ['\\ast', '1', '0'], ['\\ast', '\\ast', '1']];
const U_SHAPE = [['\\blacksquare', '\\ast', '\\ast'], ['0', '\\blacksquare', '\\ast'], ['0', '0', '\\blacksquare']];

/** `R_3 → R_3 + R_1 = R_3 − (−1)R_1 ⇒ ℓ31 = −1`. */
function opExplain(st) {
  const ell = st.k.neg();
  const as = ell.sign() < 0 ? ` \\;=\\; R_${st.i + 1} - (${t(ell)})R_${st.j + 1}` : '';
  return `${texRowOp(st)}${as} \\;\\Rightarrow\\; \\ell_{${st.i + 1}${st.j + 1}} = \\part{l}{${t(ell)}}`;
}

/** The L skeleton of beat 4: zeros above the diagonal, empty slots elsewhere. */
const L_EMPTY = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (j > i ? '0' : '\\phantom{0}')));

const BLANK = '\\phantom{0}';

// ---------------------------------------------------------------- the lecture

export default {
  id: 'lu',
  title: 'LU factorization',
  goals: [
    'See why factoring A = LU pays off when you solve Ax = b for many right-hand sides',
    'Solve Ax = b with Ly = b (forward) and then Ux = y (backward)',
    'Build L by recording the multipliers of the row replacements (no swaps)',
  ],
  beats: [
    // 1
    {
      id: 'why-lu',
      title: 'Why factor?',
      scene(s) {
        const A = s.matrix(LU.A, { x: 165, y: 190, size: 36, visible: false });
        const ax = s.tex('\\mathbf{x} =', { x: 340, y: 190, size: 44, visible: false });
        const colors = [C.blue, C.red, C.teal];
        const bs = BS_MORE.map((b, k) => s.matrix(b.map((v) => [v]), { x: 460 + 125 * k, y: 190, size: 36, color: colors[k], visible: false }));
        const bl = BS_MORE.map((_, k) => s.tex(`\\mathbf{b}_${k + 1}`, { x: 460 + 125 * k, y: 335, size: 36, color: colors[k], visible: false }));
        const again = s.text('row reduce [A | b] … again … and again', { x: 480, y: 420, size: 32, color: C.muted, visible: false });
        const eq = s.tex('=', { x: 318, y: 190, size: 48, visible: false });
        const L = s.matrix(L_SHAPE, { x: 475, y: 190, size: 36, color: C.blue, visible: false });
        const U = s.matrix(U_SHAPE, { x: 765, y: 190, size: 36, color: C.red, visible: false });
        const lL = s.text('unit lower triangular', { x: 475, y: 325, size: 30, color: C.blue, visible: false });
        const lU = s.text('an echelon form', { x: 765, y: 325, size: 30, color: C.red, visible: false });
        const s1 = s.tex('L\\mathbf{y} = \\mathbf{b}', { x: 280, y: 450, size: 44, visible: false });
        const s2 = s.tex('U\\mathbf{x} = \\mathbf{y}', { x: 680, y: 450, size: 44, visible: false });
        const arr = s.arrow(400, 450, 560, 450, { color: C.muted, visible: false });
        const f1 = s.text('forward, top-down', { x: 280, y: 520, size: 30, color: C.muted, visible: false });
        const f2 = s.text('backward, bottom-up', { x: 680, y: 520, size: 30, color: C.muted, visible: false });
        const mn = s.text('Same for an m × n matrix A: L is m × m and unit lower triangular, U is an m × n echelon form.', { x: 480, y: 470, size: 30, width: 820, visible: false });
        return { A, ax, bs, bl, again, eq, L, U, lL, lU, s1, s2, arr, f1, f2, mn };
      },
      steps: [
        {
          say: 'In practice you often solve $A\\mathbf{x} = \\mathbf{b}${A x equals b} for the same matrix $A${A} and many different right-hand sides, one after another.',
          do: async (s, o) => {
            await s.all(o.A.fadeIn(), o.ax.fadeIn());
            for (let k = 0; k < 3; k++) {
              await s.all(o.bs[k].fadeIn({ shift: [60, 0] }), o.bl[k].fadeIn({ delay: 200 }));
              if (k === 1) await o.again.fadeIn();
            }
          },
        },
        {
          say: 'Redoing the elimination every time is wasteful. So do it once, and record it as a factorization: $A = LU${A equals L U}, with $L${L} lower triangular and $U${U} an echelon form.',
          do: async (s, o) => {
            await s.all(o.bs.map((b) => b.fadeOut()), o.bl.map((b) => b.fadeOut()), o.ax.fadeOut(), o.again.fadeOut());
            await o.eq.fadeIn({ shift: [0, 0] });
            await s.all(o.L.fadeIn(), o.lL.fadeIn({ delay: 300 }));
            await s.all(o.U.fadeIn(), o.lU.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'Then each new $\\mathbf{b}${b} costs just two quick triangular solves: first $L\\mathbf{y} = \\mathbf{b}${L y equals b}, then $U\\mathbf{x} = \\mathbf{y}${U x equals y}.',
          do: async (s, o) => {
            await s.all(o.s1.write(), o.f1.fadeIn({ delay: 300 }));
            await o.arr.draw({ duration: 500 });
            await s.all(o.s2.write(), o.f2.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'This works for rectangular matrices too. If $A${A} is $m${m} by $n${n}, then $L${L} is a square $m${m} by $m${m} unit lower triangular matrix, and $U${U} is an $m${m} by $n${n} echelon form, the same shape as $A${A}.',
          do: async (s, o) => {
            await s.all([o.s1, o.s2, o.arr, o.f1, o.f2].map((m) => m.fadeOut()));
            await o.mn.fadeIn();
          },
        },
      ],
    },

    // 2
    {
      id: 'two-solves',
      title: 'Solving with L and U',
      scene(s) {
        const head = s.tex('A\\mathbf{x} = L(\\part{ux}{U\\mathbf{x}}) = \\mathbf{b}', { x: 480, y: 60, size: 40, visible: false });
        const left = s.matrix(LU.L.map((row, i) => [...row, B[i]]), { x: 250, y: 280, size: 36, augment: 3, visible: false });
        const right = s.matrix(LU.U.map((row, i) => [...row, `y_${i + 1}`]), { x: 710, y: 280, size: 36, augment: 3, visible: false });
        const lt = s.tex('L\\mathbf{y} = \\mathbf{b}', { x: 250, y: 150, size: 34, color: C.blue, visible: false });
        const rt = s.tex('U\\mathbf{x} = \\mathbf{y}', { x: 710, y: 150, size: 34, color: C.red, visible: false });
        const ys = FS.lines.map((ln, i) => paint(s.tex(subLine(ln), { x: 250, y: 425 + 48 * i, size: 32, visible: false }), 'v', C.blue));
        const xs = BS.lines.map((ln, i) => paint(s.tex(subLine(ln), { x: 710, y: 425 + 48 * (2 - i), size: 32, visible: false }), 'v', C.green));
        const ans = s.tex(`\\mathbf{x} = (${BS.x.map(t).join(', ')})`, { x: 480, y: 450, size: 44, color: C.green, visible: false });
        const chk = checked(s, `A\\mathbf{x} = (${AX.map(t).join(', ')}) = \\mathbf{b}`, { x: 480, y: 525, size: 36, visible: false });
        const fac = s.tex(`${texMat(LU.A)} = ${texMat(LU.L)}${texMat(LU.U)}`, { x: 480, y: 280, size: 36, visible: false });
        const facL = s.text('A = LU', { x: 480, y: 150, size: 34, color: C.muted, visible: false });
        return { head, left, right, lt, rt, ys, xs, ans, chk, fac, facL };
      },
      steps: [
        {
          say: 'Here is our $A${A}, already factored as $L${L} times $U${U}. Multiply them back and you get $A${A}.',
          do: async (s, o) => {
            await s.all(o.facL.fadeIn(), o.fac.write({ duration: 1400 }));
          },
        },
        {
          say: 'Since $A\\mathbf{x} = L(U\\mathbf{x})${A x equals L times U x}, give the inside a name: $\\mathbf{y} = U\\mathbf{x}${y equals U x}.',
          do: async (s, o) => {
            await s.all(o.fac.fadeOut(), o.facL.fadeOut());
            await o.head.write();
            const b = o.head.partBox('ux');
            o.br = s.brace(b.x, b.y + b.h + 4, b.x + b.w, b.y + b.h + 4, { label: '\\mathbf{y}', side: 'below', size: 32, labelColor: C.red, visible: false });
            await s.all(o.br.draw(), o.head.color('ux', C.red));
            await s.all(o.left.fadeIn(), o.lt.fadeIn(), o.right.fadeIn({ delay: 200 }), o.rt.fadeIn({ delay: 200 }));
          },
        },
        {
          say: 'First solve $L\\mathbf{y} = \\mathbf{b}${L y equals b} from the top down. Row one gives $y_1 = 3${y one equals three}; then $y_2 = 7 - 6 = 1${y two equals seven minus six, which is one}; then $y_3 = 5 + 3 - 2 = 6${y three equals five plus three minus two, which is six}.',
          do: async (s, o) => {
            for (let i = 0; i < 3; i++) {
              await o.left.clearHighlights({ duration: 150 });
              await o.left.highlightRow(i, C.yellow);
              await o.ys[i].write({ duration: 700 });
            }
            await o.left.clearHighlights();
          },
        },
        {
          say: 'Those numbers are $\\mathbf{y}${y}. Now solve $U\\mathbf{x} = \\mathbf{y}${U x equals y} from the bottom up: $x_3 = 2${x three equals two}, then $x_2 = -1${x two equals minus one}, then $x_1 = 1${x one equals one}.',
          do: async (s, o) => {
            await s.all(
              FS.y.map(async (v, i) => {
                const pb = o.ys[i].partBox('v');
                const cb = o.right.cellBox(i, 3);
                const chip = s.tex(t(v), { x: pb.cx, y: pb.cy, size: 32, color: C.blue });
                await chip.moveTo(cb.cx, cb.cy, { duration: 800, delay: i * 150 });
                await s.all(o.right.setEntry(i, 3, v, { duration: 300 }), chip.fadeOut({ duration: 200 }));
              }),
            );
            for (let i = 2; i >= 0; i--) {
              await o.right.clearHighlights({ duration: 150 });
              await o.right.highlightRow(i, C.yellow);
              await o.xs[i].write({ duration: 700 });
            }
            await o.right.clearHighlights();
          },
        },
        {
          say: 'So $\\mathbf{x} = (1, -1, 2)${x equals one, minus one, two}. Check it in the original system: $A\\mathbf{x}${A x} really is $\\mathbf{b}${b}.',
          do: async (s, o) => {
            await s.all([...o.ys, ...o.xs].map((m) => m.fadeOut()));
            await o.ans.write();
            await o.chk.fadeIn();
          },
        },
      ],
    },

    // 3
    {
      id: 'try-forward',
      kind: 'try',
      title: 'Your turn',
      say: 'Same $L${L}, new right-hand side. Solve from the top down.',
      prompt: `With the same $L = ${texMat(LU.L)}$, solve $L\\mathbf{y} = ${texVec(TRY_B)}$. What is $y_3$?`,
      figure(s) {
        s.matrix(LU.L.map((row, i) => [...row, TRY_B[i]]), { x: 480, y: 300, size: 56, augment: 3 });
      },
      answer: { type: 'number', value: String(TRY.y[2]) },
      hint: `$y_1 = ${t(TRY.y[0])}$, then $y_2 = ${t(TRY_B[1])} - ${t(LU.L[1][0])}y_1$.`,
      solution: [
        `Row 1 of $L$ is $(1, 0, 0)$, so $y_1 = ${t(TRY.y[0])}$.`,
        `Row 2 says $${linY(LU.L[1])} = ${t(TRY_B[1])}$, so $${plainLine(TRY.lines[1])}$.`,
        `Row 3 says $${linY(LU.L[2])} = ${t(TRY_B[2])}$, so $${plainLine(TRY.lines[2])}$.`,
      ],
    },

    // 4
    {
      id: 'build-lu',
      title: 'Building L and U',
      scene(s) {
        const m = s.matrix(LU.A, { x: 290, y: 270, size: 44 });
        const L = s.matrix(L_EMPTY, { x: 740, y: 270, size: 44, visible: false });
        const mt = s.tex('A', { x: 290, y: 100, size: 40, visible: false });
        const lt = s.tex('L', { x: 740, y: 100, size: 40, color: C.blue, visible: false });
        const ex = paint(s.tex(opExplain(LU.fwd[0]), { x: 480, y: 480, size: 36, visible: false }), 'l', C.yellow);
        const done = s.tex('A = LU', { x: 480, y: 545, size: 40, color: C.green, visible: false });
        return { m, L, mt, lt, ex, done };
      },
      steps: [
        {
          say: 'To build the factorization, reduce $A${A} to an echelon form using only row replacements. Whatever you end with is $U${U}. Next to it, start an empty $L${L}.',
          do: async (s, o) => {
            await s.all(o.mt.fadeIn(), o.m.pivot(0, 0, { color: C.blue }));
            await s.all(o.L.fadeIn(), o.lt.fadeIn());
            await s.all([[1, 0], [2, 0], [2, 1]].map(([i, j], k) => o.L.highlightCell(i, j, C.yellow, { delay: k * 150 })));
          },
        },
        {
          say: 'Each time you subtract $\\ell${ell} times a pivot row, write $\\ell${ell} into $L${L} at that position. $R_2 \\to R_2 - 2R_1${R two becomes R two minus two R one}, so a $2${two} goes in row two, column one.',
          do: async (s, o) => {
            await s.all(o.m.rowOp(LU.fwd[0], { note: false }), o.ex.fadeIn());
            await fly(s, o, 0);
          },
        },
        {
          say: 'Careful with $R_3 \\to R_3 + R_1${R three becomes R three plus R one}. That is subtracting $-1${minus one} times row one, so $L${L} gets $-1${minus one}.',
          do: async (s, o) => {
            await s.all(o.m.rowOp(LU.fwd[1], { note: false }), o.ex.swap(opExplain(LU.fwd[1])));
            paint(o.ex, 'l', C.yellow);
            await fly(s, o, 1);
          },
        },
        {
          say: 'Column two: $R_3 \\to R_3 - 2R_2${R three becomes R three minus two R two}, so a $2${two} goes in row three, column two. Now $A${A} has become $U${U}.',
          do: async (s, o) => {
            await o.m.pivot(1, 1, { color: C.blue });
            await s.all(o.m.rowOp(LU.fwd[2], { note: false }), o.ex.swap(opExplain(LU.fwd[2])));
            paint(o.ex, 'l', C.yellow);
            await fly(s, o, 2);
            await s.all(o.mt.swap('U'), o.m.pivot(2, 2, { color: C.blue }));
          },
        },
        {
          say: 'Finally, put ones on the diagonal of $L${L}. That is the whole factorization: $A = LU${A equals L U}.',
          do: async (s, o) => {
            await o.L.clearHighlights();
            await s.all([0, 1, 2].map((i) => o.L.setEntry(i, i, 1, { delay: i * 150 })));
            await s.all(o.ex.fadeOut(), o.done.write());
          },
        },
      ],
    },

    // 5
    {
      id: 'why-multipliers',
      title: 'Why the multipliers go straight in',
      scene(s) {
        const l1 = s.tex('E_3E_2E_1A = U', { x: 480, y: 60, size: 40, visible: false });
        const l2 = s.tex('A = (E_3E_2E_1)^{-1}U = E_1^{-1}E_2^{-1}E_3^{-1}\\,U', { x: 480, y: 125, size: 40, visible: false });
        const Es = ELEM.map((E, k) => s.matrix(E, { x: 180 + 300 * k, y: 292, size: 30, visible: false }));
        const El = LU.fwd.map((st, k) => s.tex(`E_${k + 1}`, { x: 180 + 300 * k, y: 178, size: 32, visible: false }));
        const ops = LU.fwd.map((st, k) => s.tex(texRowOp(st), { x: 180 + 300 * k, y: 412, size: 30, color: C.muted, visible: false }));
        const eqL = s.tex('= L', { x: 345, y: 480, size: 40, visible: false });
        const L = s.matrix(LU.L.map((row, i) => row.map((v, j) => (j < i ? BLANK : v))), { x: 480, y: 480, size: 30, visible: false });
        return { l1, l2, Es, El, ops, eqL, L };
      },
      steps: [
        {
          say: 'Each row replacement is multiplication by an elementary matrix: the identity with $-\\ell${minus ell} below the diagonal. Three replacements turned $A${A} into $U${U}.',
          do: async (s, o) => {
            await o.l1.write();
            await s.all(o.Es.map((E, k) => E.fadeIn({ delay: k * 250 })), o.El.map((e, k) => e.fadeIn({ delay: k * 250 })), o.ops.map((e, k) => e.fadeIn({ delay: k * 250 })));
            await s.all(LU.fwd.map((st, k) => o.Es[k].highlightCell(st.i, st.j, C.yellow)));
          },
        },
        {
          say: 'So $A${A} is the product of their inverses times $U${U}. And undoing "subtract $\\ell${ell} times a row" is "add it back", so each inverse just flips the sign.',
          do: async (s, o) => {
            await o.l2.write();
            await s.all(LU.fwd.map((st, k) => s.all(o.Es[k].setEntry(st.i, st.j, ELEM_INV[k][st.i][st.j]), o.El[k].swap(`E_${k + 1}^{-1}`))));
          },
        },
        {
          say: 'Multiply the inverses in this order and nothing mixes: each $\\ell${ell} simply drops into its place. That product is $L${L}.',
          do: async (s, o) => {
            await s.all(o.ops.map((e) => e.fadeOut()), o.eqL.fadeIn(), o.L.fadeIn());
            for (const [k, st] of LU.fwd.entries()) {
              const a = o.Es[k].cellBox(st.i, st.j);
              const b = o.L.cellBox(st.i, st.j);
              const chip = s.tex(t(LU.L[st.i][st.j]), { x: a.cx, y: a.cy, size: 36, color: C.yellow });
              await chip.moveTo(b.cx, b.cy, { duration: 700 });
              await s.all(o.L.setEntry(st.i, st.j, LU.L[st.i][st.j], { duration: 250 }), chip.fadeOut({ duration: 200 }));
            }
            await o.L.flash({ color: C.green });
          },
        },
        {
          say: 'That gives Lay\'s shortcut. Take each pivot column as it stands when you reach it during the reduction, from the pivot down, and divide by the pivot. Those columns, side by side, are the columns of $L${L}.',
          do: async (s, o) => {
            await s.all(o.Es.map((E) => E.fadeOut()), o.El.map((e) => e.fadeOut()), o.ops.map((e) => e.fadeOut()), o.eqL.fadeOut(), o.L.moveTo(760, 330));
            const stTex = (c) =>
              `\\begin{bmatrix}${c.state.map((row, i) => row.map((v, j) => (j === c.c && i >= c.c ? `\\col{yellow}{${t(v)}}` : t(v))).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
            o.cols = LAY_COLS.map((c, k) =>
              s.tex(`${stTex(c)} \\;\\;\\div ${par(c.pivot)} \\;\\to\\; ${texVec(c.div)}`, { x: 320, y: [232, 364, 496][k], size: 30, visible: false }),
            );
            for (const [k, c] of LAY_COLS.entries()) {
              await s.all(o.cols[k].write({ duration: 700 }), o.L.highlightCol(c.c, C.yellow));
              await s.wait(300);
            }
          },
        },
      ],
    },

    // 6
    {
      id: 'fill-lu',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Factor this two by two. One replacement does it.',
      figure(s) {
        s.tex('A =', { x: 300, y: 300, size: 60 });
        s.matrix(SMALL.A, { x: 520, y: 300, size: 60 });
      },
      lines: [
        ['L = ', { matrix: [['1', '0'], [{ id: 'l', answer: { type: 'number', value: String(SMALL.L[1][0]) } }, '1']] }],
        ['U = ', { matrix: [[t(SMALL.U[0][0]), t(SMALL.U[0][1])], ['0', { id: 'u', answer: { type: 'number', value: String(SMALL.U[1][1]) } }]] }],
      ],
      solution: [
        `One replacement clears the entry below the pivot: $${texRowOp(SMALL.fwd[0])}$ turns row 2 into $(${SMALL.U[1].map(t).join(', ')})$, so $U = ${texMat(SMALL.U)}$.`,
        `The multiplier is $${t(SMALL.L[1][0])}$, so $L = ${texMat(SMALL.L)}$. Check: $LU = ${texMat(mul(SMALL.L, SMALL.U))} = A$.`,
      ],
    },

    // 7
    {
      id: 'mistake-sign',
      title: 'The trap: the sign of the multiplier',
      scene(s) {
        const L = s.matrix(WRONG_L, { x: 140, y: 210, size: 34, visible: false });
        const U = s.matrix(LU.U, { x: 390, y: 210, size: 34, visible: false });
        const eq = s.tex('=', { x: 535, y: 210, size: 44, visible: false });
        const P = s.matrix(WRONG, { x: 710, y: 210, size: 34, visible: false });
        const lt = s.tex('L\\ (\\text{wrong})', { x: 140, y: 90, size: 32, color: C.yellow, visible: false });
        const ut = s.tex('U', { x: 390, y: 90, size: 32, visible: false });
        const pt = s.tex('LU', { x: 710, y: 90, size: 32, visible: false });
        const At = s.tex('A =', { x: 530, y: 450, size: 36, visible: false });
        const A = s.matrix(LU.A, { x: 710, y: 450, size: 34, visible: false });
        const op = s.tex(`${texRowOp(LU.fwd[0])}`, { x: 230, y: 420, size: 34, visible: false });
        const rule = s.tex(`\\text{subtract } ${t(LU.L[1][0])}R_1 \\Rightarrow \\ell_{21} = ${t(LU.L[1][0])}`, { x: 230, y: 490, size: 32, color: C.green, visible: false });
        return { L, U, eq, P, lt, ut, pt, At, A, op, rule };
      },
      steps: [
        {
          say: 'Here\'s the trap. The operation was $R_2 \\to R_2 - 2R_1${R two becomes R two minus two R one}, and the minus sign tempts you to write $-2${minus two} in $L${L}.',
          do: async (s, o) => {
            await s.all(o.L.fadeIn(), o.lt.fadeIn(), o.U.fadeIn(), o.ut.fadeIn(), o.op.write());
            await o.L.highlightCell(1, 0, C.yellow);
            o.box = s.ring(o.L.cellBox(1, 0), { shape: 'box' });
            await o.box;
          },
        },
        {
          say: 'Check by multiplying back. $LU${L U} must equal $A${A}, but row two comes out as $(-4, -1, -1)${minus four, minus one, minus one} instead of $(4, 3, 3)${four, three, three}.',
          do: async (s, o) => {
            await s.all(o.eq.fadeIn(), o.P.fadeIn(), o.pt.fadeIn());
            await s.all(o.At.fadeIn(), o.A.fadeIn());
            await s.all(o.P.highlightRow(1, C.yellow), o.A.highlightRow(1, C.green));
          },
        },
        {
          say: '$L${L} records the number you subtract, $2${two}, not $-2${minus two}. Fix it, and the product comes back to $A${A}.',
          do: async (s, o) => {
            await s.all(o.box.fadeOut(), o.rule.write());
            await s.all(o.L.setEntry(1, 0, LU.L[1][0]), o.lt.swap('L'));
            await o.L.clearHighlights();
            await o.P.setRows(mul(LU.L, LU.U));
            await o.P.clearHighlights();
            await o.P.highlightRow(1, C.green);
          },
        },
      ],
    },

    // 8
    {
      id: 'swaps',
      title: 'When you need a swap',
      scene(s) {
        const m = s.matrix(SWAP, { x: 250, y: 200, size: 52, visible: false });
        const why = s.tex('\\begin{bmatrix}1&0\\\\ \\ell&1\\end{bmatrix}\\begin{bmatrix}u_{11}&u_{12}\\\\0&u_{22}\\end{bmatrix} = \\begin{bmatrix}u_{11}&u_{12}\\\\ \\ell\\, u_{11}&\\ell\\, u_{12}+u_{22}\\end{bmatrix}', { x: 480, y: 410, size: 34, visible: false });
        const no = s.tex(`u_{11} = ${t(SWAP[0][0])} \\;\\Rightarrow\\; \\ell\\, u_{11} = 0 \\neq ${t(SWAP[1][0])}`, { x: 480, y: 520, size: 34, color: C.yellow, visible: false });
        const P = s.tex(`P = ${texMat(SWAP_P)}`, { x: 690, y: 160, size: 36, visible: false });
        const pa = s.tex(`PA = ${texMat(SWAP_PA)} = LU`, { x: 690, y: 290, size: 36, visible: false });
        const sw = s.text('Software factors PA = LU, recording the row swaps in P.', { x: 480, y: 440, size: 30, color: C.muted, visible: false });
        const us = s.text('In this course, we factor matrices that reduce without swaps.', { x: 480, y: 510, size: 30, visible: false });
        return { m, why, no, P, pa, sw, us };
      },
      steps: [
        {
          say: 'Look at this matrix. The first pivot position holds a zero, and no multiple of row one can clear the $1${one} below it.',
          do: async (s, o) => {
            await o.m.fadeIn();
            await s.all(o.m.highlightCell(0, 0, C.yellow), o.m.pivot(0, 0, { color: C.yellow }));
          },
        },
        {
          say: 'In fact no $LU${L U} exists at all. The top left entry of $LU${L U} is $u_{11}${u one one}, so it must be zero, and then the entry below it is $\\ell${ell} times zero, which can never be $1${one}.',
          do: async (s, o) => {
            await o.why.write({ duration: 1200 });
            await o.no.fadeIn();
          },
        },
        {
          say: 'You must swap rows first. Software does exactly that and factors $PA = LU${P A equals L U}, where $P${P} records the swaps. In this course, we factor matrices that reduce without swaps.',
          do: async (s, o) => {
            await s.all(o.why.fadeOut(), o.no.fadeOut(), o.m.clearPivots(), o.m.clearHighlights());
            await o.m.rowOp(SWAP_RED.steps[0], { note: false });
            await s.all(o.P.fadeIn(), o.pa.fadeIn({ delay: 300 }));
            await o.sw.fadeIn();
            await o.us.fadeIn();
          },
        },
      ],
    },

    // 9
    {
      id: 'wo-lu',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Reduce with replacements only, and record every multiplier.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateLU,
    },

    // 10
    {
      id: 'try-lu-use',
      kind: 'try',
      title: 'Your turn',
      say: 'Now that you have $L${L} and $U${U}, in which order do you use them?',
      prompt: 'Given $A = LU$, which order solves $A\\mathbf{x} = \\mathbf{b}$?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: 'Solve $L\\mathbf{y} = \\mathbf{b}$, then $U\\mathbf{x} = \\mathbf{y}$', why: 'Right: $A\\mathbf{x} = L(U\\mathbf{x})$, so first find $\\mathbf{y} = U\\mathbf{x}$ from $L\\mathbf{y} = \\mathbf{b}$, then $\\mathbf{x}$.' },
        { id: 'b', label: 'Solve $U\\mathbf{y} = \\mathbf{b}$, then $L\\mathbf{x} = \\mathbf{y}$', why: '$A\\mathbf{x} = L(U\\mathbf{x})$: L is applied last, so it\'s undone first.' },
        { id: 'c', label: 'Compute $A^{-1}$ and multiply $A^{-1}\\mathbf{b}$', why: 'Works, but wastes the factorization: computing $A^{-1}$ costs more than the two triangular solves.' },
      ],
      hint: 'Write $A\\mathbf{x}$ as $L(U\\mathbf{x})$. Which matrix acts last?',
      solution: [
        '$A\\mathbf{x} = L(U\\mathbf{x})$. Call $\\mathbf{y} = U\\mathbf{x}$; then the equation reads $L\\mathbf{y} = \\mathbf{b}$.',
        'So solve $L\\mathbf{y} = \\mathbf{b}$ first (forward substitution, top down), then $U\\mathbf{x} = \\mathbf{y}$ (back substitution, bottom up).',
      ],
    },

    // 11
    {
      id: 'cp-lu',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain the heart of the method in your own words.',
      prompt: 'Why does the multiplier you use in a row replacement end up as an entry of $L$?',
      points: [
        'Each replacement $R_i \\to R_i - \\ell R_j$ is multiplication by an elementary matrix $E_k$: the identity with $-\\ell$ below the diagonal',
        '$E_p \\cdots E_1 A = U$, so $A = E_1^{-1} \\cdots E_p^{-1} U$ and $L = E_1^{-1} \\cdots E_p^{-1}$',
        'The inverse of subtracting $\\ell$ times a row is adding it back, so $E_k^{-1}$ has $+\\ell$ in the same spot',
        'Multiplied in this order the inverses do not interact: the product just collects each $\\ell$ in its place',
      ],
    },

    // 12
    {
      id: 'summary-lu',
      title: 'Summary',
      scene(s) {
        const A = s.matrix(LU.A, { x: 165, y: 210, size: 36, visible: false });
        const eq = s.tex('=', { x: 318, y: 210, size: 48, visible: false });
        const L = s.matrix(LU.L, { x: 475, y: 210, size: 36, visible: false });
        const U = s.matrix(LU.U, { x: 765, y: 210, size: 36, visible: false });
        const r1 = s.text('elimination, recorded: the multipliers fill L', { x: 480, y: 370, size: 30, color: C.muted, visible: false });
        const r2 = s.tex('L\\mathbf{y} = \\mathbf{b}\\ \\ (\\text{forward}), \\qquad U\\mathbf{x} = \\mathbf{y}\\ \\ (\\text{backward})', { x: 480, y: 460, size: 38, visible: false });
        const r3 = s.text('two triangular solves for every new b', { x: 480, y: 530, size: 30, color: C.muted, visible: false });
        return { A, eq, L, U, r1, r2, r3 };
      },
      steps: [
        {
          say: 'LU factorization is elimination, written down. $U${U} is the echelon form, and the multipliers you used fill $L${L}.',
          do: async (s, o) => {
            await s.all(o.A.fadeIn(), o.eq.fadeIn({ delay: 200 }), o.L.fadeIn({ delay: 300 }), o.U.fadeIn({ delay: 400 }));
            await s.all(LU.fwd.map((st, k) => o.L.highlightCell(st.i, st.j, C.yellow, { delay: k * 200 })));
            await o.r1.fadeIn();
          },
        },
        {
          say: 'Then every right-hand side costs two triangular solves: forward with $L${L}, backward with $U${U}.',
          do: async (s, o) => {
            await o.r2.write();
            await o.r3.fadeIn();
          },
        },
      ],
    },
  ],
};

/** Beat 4: the multiplier of replacement k leaves its row note and lands in L. */
async function fly(s, o, k) {
  const st = LU.fwd[k];
  const nb = o.m.noteEl ? s.toStage(o.m.noteEl.getBoundingClientRect()) : o.m.rowBox(st.i);
  const pb = o.ex.partBox('l');
  const b = o.L.cellBox(st.i, st.j);
  const chip = s.tex(t(st.k.neg()), { x: pb ? pb.x + pb.w / 2 : nb.x + nb.w / 2, y: pb ? pb.y + pb.h / 2 : nb.y + nb.h / 2, size: 40, color: C.yellow });
  await chip.moveTo(b.x + b.w / 2, b.y + b.h / 2, { duration: 900 });
  await s.all(o.L.setEntry(st.i, st.j, st.k.neg(), { duration: 300 }), chip.fadeOut({ duration: 250 }));
}
