/**
 * Lecture 17 · Change of basis (Lay 4.7). Design: matrix/PLAN.md § 17.
 * Every matrix, coordinate vector and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, fromCols, mul, mulVec, rref, solve, inverse, det, eqMat, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- TeX helpers

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;
const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];
const num2 = (M) => M.map((r) => r.map(Number));
/** `2\mathbf c_1 - \mathbf c_2` from [[coef, name], …] (zeros skipped, unit coefficients bare). */
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
  return out || '\\mathbf{0}';
}
function paint(tex, name, color) {
  for (const el of tex.part(name)) el.style.color = color;
  return tex;
}
const checkMark = (s, latex, opts) => paint(s.tex(`${latex}\\ \\part{ck}{\\checkmark}`, opts), 'ck', C.green);
const PCB = '\\underset{\\mathcal{C}\\leftarrow\\mathcal{B}}{P}';
const PBC = '\\underset{\\mathcal{B}\\leftarrow\\mathcal{C}}{P}';
/** Stage versions: the under-label at \small so it stays ≥ 28 px on the 960 × 600 stage (text size ≥ 32). */
const SPCB = '\\underset{\\small\\mathcal{C}\\leftarrow\\mathcal{B}}{P}';
const SPBC = '\\underset{\\small\\mathcal{B}\\leftarrow\\mathcal{C}}{P}';
const SPEB = '\\underset{\\small\\mathcal{E}\\leftarrow\\mathcal{B}}{P}';
/** Right block of an rref'd [left | right] with `k` columns on the left. */
const rightBlock = (R, k) => R.map((row) => row.slice(k));
const augment = (L, Rt) => L.map((row, i) => [...row, ...Rt[i]]);

// ---------------------------------------------------------------- data

/** The running example: B = {(1,2), (2,3)}, C = {(1,1), (1,2)}, x = (1,3). */
const B = [[1, 2], [2, 3]];
const CB = [[1, 1], [1, 2]];
const PB = fromCols(B.map(vec));
const PC = fromCols(CB.map(vec));
const X = vec([1, 3]);
const XB = solve(PB, X).x; // (3, −1)
const XC = solve(PC, X).x; // (−1, 2)
/** [c1 c2 | b1 b2] ~ [I | P]. */
const AUG = augment(PC, PB);
const RED = rref(AUG, { augmented: 2 });
const P = rightBlock(RED.R, 2);
const PINV = inverse(P);
const PC_INV = inverse(PC);
if (!eqMat(mul(PC_INV, PB), P)) throw new Error('change-of-basis: P must equal PC⁻¹ PB');
/** [b_j]_C, the columns of P. */
const B1C = P.map((r) => r[0]);
const B2C = P.map((r) => r[1]);
/** Grid maps for the plane: B grid, then from B grid to C grid. */
const MAP_B = num2(PB);
const MAP_BC = num2(mul(PC, inverse(PB)));
/** The wrong augmented matrix [b1 b2 | c1 c2]. */
const WAUG = augment(PB, PC);
const WRED = rref(WAUG, { augmented: 2 });
const WRONG = rightBlock(WRED.R, 2);
if (!eqMat(WRONG, PINV)) throw new Error('change-of-basis: the swapped reduction must give P⁻¹');
/** Beat 4: apply P to [x]_B. */
const TRY_X = mulVec(P, XB);

/** Beat 9: P1 with B = {1, t}, C = {1, 1 + t}, in coordinates relative to {1, t}. */
const PB1 = fromCols([[1, 0], [0, 1]].map(vec));
const PC1 = fromCols([[1, 0], [1, 1]].map(vec));
const P1 = mul(inverse(PC1), PB1);
const P1_INV = inverse(P1);

/** Lay 4.7 Example 1 (abstract V): b1 = 4c1 + c2, b2 = −6c1 + c2, x = 3b1 + b2. */
const EX1_P = mat([[4, -6], [1, 1]]);
const EX1_XB = vec([3, 1]);
const EX1_XC = mulVec(EX1_P, EX1_XB);

// ---------------------------------------------------------------- workout: P from C to B

function changeItem(Ccols, Bcols) {
  const Cm = fromCols(Ccols.map(vec));
  const Bm = fromCols(Bcols.map(vec));
  const aug = augment(Cm, Bm);
  const red = rref(aug, { augmented: 2 });
  const Pm = rightBlock(red.R, 2);
  const fwd = red.steps.filter((st) => st.phase === 'forward');
  const checks = Bcols.map((b, j) => {
    const c = Pm.map((r) => r[j]);
    return `$\\mathbf{b}_${j + 1} = ${comb(c.map((k, i) => [k, `\\mathbf{c}_${i + 1}`]))} = ${tup(b)}$`;
  });
  return {
    prompt: `$\\mathcal{B} = \\{${Bcols.map(tup).join(',\\ ')}\\}$ and $\\mathcal{C} = \\{${Ccols.map(tup).join(',\\ ')}\\}$ are bases of $\\mathbb{R}^2$. Find $${PCB}$.`,
    answer: { type: 'matrix', value: Pm.map((r) => r.map(String)) },
    hints: [
      `Row reduce $[\\,\\mathbf{c}_1\\ \\mathbf{c}_2 \\mid \\mathbf{b}_1\\ \\mathbf{b}_2\\,] = ${texMat(aug, { augment: 2 })}$.`,
      fwd.length
        ? `$${fwd.map(texRowOp).join(',\\ ')}$ gives $${texMat(red.echelon, { augment: 2 })}$.`
        : `$${texMat(aug, { augment: 2 })}$ is already in echelon form; scale the pivots and clear above them.`,
    ],
    solution: [
      `The columns of $${PCB}$ are $[\\mathbf{b}_1]_{\\mathcal{C}}$ and $[\\mathbf{b}_2]_{\\mathcal{C}}$: two systems with coefficient matrix $[\\,\\mathbf{c}_1\\ \\mathbf{c}_2\\,]$, solved at once by reducing $${texMat(aug, { augment: 2 })}$.`,
      ...red.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after, { augment: 2 })}$`),
      `So $${PCB} = ${texMat(Pm)}$.`,
      `Check: ${checks.join(' and ')}.`,
    ],
  };
}
const WO_B = [[3, 7], [1, 1]];
const WO_C = [[1, 2], [1, 3]];
const WO = changeItem(WO_C, WO_B);

/** Fresh problems: C with det ±1, an integer P with det ≠ 0, B = C P. */
function generateChange(rand) {
  for (;;) {
    const Cm = [[rand.int(-2, 3), rand.int(-2, 3)], [rand.int(-2, 3), rand.int(-2, 3)]];
    if (!det(mat(Cm)).abs().eq(1) || Cm.flat().filter((x) => x === 0).length > 1) continue;
    const Pm = [[rand.int(-2, 3), rand.int(-2, 3)], [rand.int(-2, 3), rand.int(-2, 3)]];
    if (det(mat(Pm)).zero || Pm.flat().filter((x) => x === 0).length > 1) continue;
    const Bm = mul(mat(Cm), mat(Pm));
    if (Bm.flat().some((v) => v.abs().cmp(12) > 0)) continue;
    const red = rref(augment(mat(Cm), Bm), { augmented: 2 });
    if (!red.steps.every((st) => st.after.every((row) => row.every((v) => v.d === 1n && v.abs().cmp(20) <= 0)))) continue;
    const cols = (M) => [0, 1].map((j) => M.map((r) => Number(r[j])));
    return changeItem(cols(mat(Cm)), cols(Bm));
  }
}

// ---------------------------------------------------------------- shared scene builders

/** Beats 1 and 12: a plane with x and the two bases. */
function basisPlane(s, { x = 690, y = 305, width = 330, range = [-2, 4, -2, 7], labels = true, visible = false } = {}) {
  const p = s.plane({ x, y, width, range, labels: false, names: labels ? ['x_1', 'x_2'] : undefined, visible });
  const xv = p.vector(X.map(Number), { color: C.green, label: '\\mathbf{x}', transform: false, visible: false });
  const bs = B.map((b, k) => p.vector(b, { color: k ? C.red : C.blue, label: `\\mathbf{b}_${k + 1}`, transform: false, visible: false }));
  const cs = CB.map((c, k) => p.vector(c, { color: k ? C.orange : C.teal, label: `\\mathbf{c}_${k + 1}`, transform: false, visible: false }));
  return { p, xv, bs, cs };
}
/** Tip-to-tail copies: `coefs[k]` steps along `basis[k]`. */
function walkVecs(p, basis, coefs, colors) {
  const out = [];
  let at = [0, 0];
  basis.forEach((b, k) => {
    const n = Number(coefs[k]);
    const step = n < 0 ? b.map((v) => -v) : b;
    for (let i = 0; i < Math.abs(n); i++) {
      out.push(p.vector(step, { tail: at, color: colors[k], width: 3, transform: false, visible: false }));
      at = [at[0] + step[0], at[1] + step[1]];
    }
  });
  return out;
}
/** Beats 5, 10: a small coordinate plane with x's coordinates as a point and a heading. */
function coordPanel(s, x, coords, head, { y = 330, width = 240, headY = 175, label = true } = {}) {
  const p = s.plane({ x, y, width, range: [-4, 4, -4, 4], labels: false, visible: false });
  const pt = p.point(coords.map(Number), { color: C.green, label: label ? tup(coords) : undefined, r: 10, visible: false });
  const h = s.tex(head, { x, y: headY, size: 32, visible: false });
  return { p, pt, h };
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'change-of-basis',
  title: 'Change of basis',
  goals: [
    'Read P from C to B as the matrix that turns B-coordinates into C-coordinates (Theorem 15)',
    'Compute it from the columns [b_j]_C by row reducing [c1 c2 | b1 b2]',
    'Go back with the inverse matrix',
  ],
  beats: [
    // 1
    {
      id: 'two-languages',
      title: 'One vector, two descriptions',
      scene(s) {
        const bp = basisPlane(s);
        const walkB = walkVecs(bp.p, B, XB, [C.blue, C.red]);
        const walkC = walkVecs(bp.p, CB, XC, [C.teal, C.orange]);
        const xl = s.tex(`\\mathbf{x} = ${tup(X)}`, { x: 230, y: 90, size: 38, color: C.green, visible: false });
        const bset = s.tex(`\\mathcal{B} = \\{\\col{blue}{${tup(B[0])}},\\ \\col{red}{${tup(B[1])}}\\}`, { x: 230, y: 170, size: 32, visible: false });
        const bco = s.tex(`[\\mathbf{x}]_{\\mathcal{B}} = ${tup(XB)}`, { x: 230, y: 235, size: 36, visible: false });
        const cset = s.tex(`\\mathcal{C} = \\{\\col{teal}{${tup(CB[0])}},\\ \\col{orange}{${tup(CB[1])}}\\}`, { x: 230, y: 330, size: 32, visible: false });
        const cco = s.tex(`[\\mathbf{x}]_{\\mathcal{C}} = ${tup(XC)}`, { x: 230, y: 395, size: 36, visible: false });
        const same = s.text('Same arrow; only the description changes.', { x: 230, y: 500, width: 380, size: 30, color: C.muted, visible: false });
        return { ...bp, walkB, walkC, xl, bset, bco, cset, cco, same };
      },
      steps: [
        {
          say: 'Here\'s one vector, $\\mathbf{x} = (1, 3)${x equals one, three}. Lay the grid of a basis $\\mathcal{B}${B} over the plane.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 700 }), o.xl.write());
            await o.xv.grow();
            await s.all(o.bset.fadeIn(), o.bs[0].grow(), o.bs[1].grow({ delay: 250 }));
            await o.p.applyMatrix(MAP_B, { duration: 1400 });
          },
        },
        {
          say: 'In this grid, $\\mathbf{x}${x} is three steps along $\\mathbf{b}_1${b one} and one step back along $\\mathbf{b}_2${b two}: its $\\mathcal{B}${B} coordinates are $(3, -1)${three, minus one}.',
          do: async (s, o) => {
            await s.stagger(o.walkB.map((v) => () => v.grow({ duration: 450 })), 500);
            await o.bco.write();
          },
        },
        {
          say: 'Now switch to a second basis, $\\mathcal{C}${C}. The same arrow is minus one step along $\\mathbf{c}_1${c one}, then two along $\\mathbf{c}_2${c two}, so $[\\mathbf{x}]_{\\mathcal{C}} = (-1, 2)${the C coordinates of x are minus one, two}.',
          do: async (s, o) => {
            await s.all(...o.walkB.map((v) => v.fadeOut()), ...o.bs.map((v) => v.fadeOut()));
            await s.all(o.p.applyMatrix(MAP_BC, { duration: 1400 }), o.cset.fadeIn(), o.cs[0].grow({ delay: 600 }), o.cs[1].grow({ delay: 850 }));
            await s.stagger(o.walkC.map((v) => () => v.grow({ duration: 450 })), 500);
            await o.cco.write();
          },
        },
        {
          say: 'Changing basis translates one description into the other. The vector $\\mathbf{x}${x} itself never moves.',
          do: async (s, o) => {
            await s.all(...o.walkC.map((v) => v.fadeOut()));
            await o.xv.flash({ color: C.green });
            await o.same.fadeIn();
          },
        },
      ],
    },

    // 2
    {
      id: 'theorem-15',
      title: 'The translation matrix',
      scene(s) {
        const top = s.tex('\\mathbf{x} = x_1\\mathbf{b}_1 + x_2\\mathbf{b}_2 \\;\\Rightarrow\\; [\\mathbf{x}]_{\\mathcal{C}} = x_1[\\mathbf{b}_1]_{\\mathcal{C}} + x_2[\\mathbf{b}_2]_{\\mathcal{C}}', { x: 480, y: 70, size: 34, visible: false });
        const eqs = [B1C, B2C].map((c, j) =>
          s.tex(`\\mathbf{b}_${j + 1} = \\part{k0}{${t(c[0])}}\\,\\mathbf{c}_1 + \\part{k1}{${t(c[1])}}\\,\\mathbf{c}_2`, { x: 250, y: 190 + 80 * j, size: 38, color: j ? C.red : C.blue, visible: false }),
        );
        const m = s.matrix(P, { x: 720, y: 230, size: 44, visible: false });
        const mLab = s.tex(SPCB, { x: 590, y: 230, size: 36, anchor: [1, 0.5], visible: false });
        const flyers = [];
        [B1C, B2C].forEach((c, j) => c.forEach((v, i) => flyers.push({ i, j, mob: s.tex(t(v), { size: 38, color: j ? C.red : C.blue, visible: false }) })));
        const card = s.defCard({
          x: 480, y: 445, kind: 'theorem', title: 'Theorem 15', size: 32,
          tex: `[\\mathbf{x}]_{\\mathcal{C}} = \\underset{\\part{sub}{\\small\\mathcal{C}\\leftarrow\\mathcal{B}}}{P}[\\mathbf{x}]_{\\mathcal{B}}, \\qquad ${SPCB} = \\big[\\,[\\mathbf{b}_1]_{\\mathcal{C}}\\ \\ [\\mathbf{b}_2]_{\\mathcal{C}}\\,\\big]`,
          visible: false,
        });
        const read = s.tex('\\text{read right to left: from } \\mathcal{B} \\text{ to } \\mathcal{C}', { x: 480, y: 548, size: 30, color: C.muted, visible: false });
        return { top, eqs, m, mLab, flyers, card, read };
      },
      steps: [
        {
          say: 'To translate from $\\mathcal{B}${B} to $\\mathcal{C}${C}, start by writing each old basis vector in the new basis. Here $\\mathbf{b}_1 = \\mathbf{c}_2${b one equals c two}, and $\\mathbf{b}_2 = \\mathbf{c}_1 + \\mathbf{c}_2${b two equals c one plus c two}.',
          do: (s, o) => s.stagger(o.eqs.map((e) => () => e.write()), 1100),
        },
        {
          say: 'Those coordinates are the columns of the matrix. Why? Coordinates are linear, so the $\\mathcal{C}${C} coordinates of $\\mathbf{x}${x} are the same combination of the $\\mathcal{C}${C} coordinates of $\\mathbf{b}_1${b one} and $\\mathbf{b}_2${b two}: a matrix times a vector.',
          do: async (s, o) => {
            await o.mLab.fadeIn();
            await s.all(
              o.flyers.map(({ i, j, mob }, k) => {
                const [fx, fy] = center(o.eqs[j].partBox(`k${i}`));
                const to = o.m.cellBox(i, j);
                mob.set({ x: fx, y: fy }).show();
                return mob.moveTo(to.cx, to.cy, { duration: 900, delay: k * 150 });
              }),
            );
            await s.all(o.m.fadeIn({ shift: [0, 0], duration: 300 }), o.flyers.map(({ mob }) => mob.fadeOut({ duration: 300 })));
            await s.all(o.m.highlightCol(0, C.blue), o.m.highlightCol(1, C.red), o.top.write({ duration: 1200 }));
            await o.card.reveal();
          },
        },
        {
          say: 'Read the subscript right to left: the matrix takes $\\mathcal{B}${B} coordinates in and gives $\\mathcal{C}${C} coordinates out.',
          do: async (s, o) => {
            await s.ring([o.card, 'sub'], { color: 'yellow' });
            await o.read.fadeIn();
          },
        },
      ],
    },

    // 3
    {
      id: 'row-reduce-p',
      title: 'Computing P',
      scene(s) {
        const head = s.tex('[\\,\\mathbf{c}_1\\ \\mathbf{c}_2 \\mid \\mathbf{b}_1\\ \\mathbf{b}_2\\,]', { x: 330, y: 60, size: 38, visible: false });
        const m = s.matrix(AUG, { x: 330, y: 250, size: 48, augment: 2, visible: false });
        const names = ['\\mathbf{c}_1', '\\mathbf{c}_2', '\\mathbf{b}_1', '\\mathbf{b}_2'];
        const cols = [C.teal, C.orange, C.blue, C.red];
        const labs = names.map((n, j) => s.tex(n, { x: m.colBox(j).cx, y: m.colBox(j).y - 32, size: 32, color: cols[j], visible: false }));
        const res = s.tex(`[\\,I \\mid ${SPCB}\\,],\\quad ${SPCB} = \\col{green}{${texMat(P)}}`, { x: 480, y: 440, size: 36, visible: false });
        const chk = checkMark(s, `\\mathbf{b}_2 = ${comb([[B2C[0], '\\mathbf{c}_1'], [B2C[1], '\\mathbf{c}_2']])} = ${tup(CB[0])} + ${tup(CB[1])} = ${tup(B[1])}`, { x: 480, y: 540, size: 32, visible: false });
        return { head, m, labs, res, chk };
      },
      steps: [
        {
          say: 'Finding $[\\mathbf{b}_1]_{\\mathcal{C}}${the C coordinates of b one} and $[\\mathbf{b}_2]_{\\mathcal{C}}${the C coordinates of b two} means solving two systems, and both have the same coefficient matrix, with columns $\\mathbf{c}_1${c one} and $\\mathbf{c}_2${c two}.',
          do: async (s, o) => {
            await s.all(o.head.write(), o.m.fadeIn());
            await s.stagger(o.labs.map((l) => () => l.fadeIn()), 250);
            await s.all(o.m.highlightCol(0, C.teal), o.m.highlightCol(1, C.orange));
          },
        },
        {
          say: 'So do them at once: put both $\\mathbf{b}${b} vectors on the right and row reduce. When the left side becomes $I${I}, the right side is the change of coordinates matrix.',
          do: async (s, o) => {
            await o.m.clearHighlights();
            for (const st of RED.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), o.m.highlightCol(2, C.green), o.m.highlightCol(3, C.green));
            await o.res.write();
          },
        },
        {
          say: 'Check a column: the second says $\\mathbf{b}_2 = \\mathbf{c}_1 + \\mathbf{c}_2${b two equals c one plus c two}, and indeed $(1, 1) + (1, 2) = (2, 3)${one, one plus one, two equals two, three}.',
          do: (s, o) => o.chk.write({ duration: 1100 }),
        },
      ],
    },

    // 4
    {
      id: 'try-apply-p',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Use the matrix we just found.',
      prompt: `Using $P = ${texMat(P)}$ ($\\mathcal{C} \\leftarrow \\mathcal{B}$), find $[\\mathbf{x}]_{\\mathcal{C}}$ for $[\\mathbf{x}]_{\\mathcal{B}} = ${tup(XB)}$.`,
      answer: { type: 'vector', value: TRY_X.map(String) },
      hint: 'Multiply $P$ by the $\\mathcal{B}$-coordinate vector.',
      solution: [
        `$[\\mathbf{x}]_{\\mathcal{C}} = ${texMat(P)}${texVec(XB)} = ${texVec(TRY_X)}$.`,
        `Both describe the same vector: $${comb([[XB[0], '\\mathbf{b}_1'], [XB[1], '\\mathbf{b}_2']])} = ${tup(X)}$ and $${comb([[TRY_X[0], '\\mathbf{c}_1'], [TRY_X[1], '\\mathbf{c}_2']])} = ${tup(X)}$.`,
        `The same move works in any vector space (Lay 4.7, Example 1): if $\\mathbf{b}_1 = ${comb([[EX1_P[0][0], '\\mathbf{c}_1'], [EX1_P[1][0], '\\mathbf{c}_2']])}$, $\\mathbf{b}_2 = ${comb([[EX1_P[0][1], '\\mathbf{c}_1'], [EX1_P[1][1], '\\mathbf{c}_2']])}$ and $\\mathbf{x} = ${comb([[EX1_XB[0], '\\mathbf{b}_1'], [EX1_XB[1], '\\mathbf{b}_2']])}$, then $${PCB} = ${texMat(EX1_P)}$ and $[\\mathbf{x}]_{\\mathcal{C}} = ${texMat(EX1_P)}${texVec(EX1_XB)} = ${texVec(EX1_XC)}$.`,
      ],
    },

    // 5
    {
      id: 'inverse-direction',
      title: 'Going back',
      scene(s) {
        const L = coordPanel(s, 170, XB, '\\mathcal{B}\\text{-coordinates}', { headY: 150 });
        const R = coordPanel(s, 790, XC, '\\mathcal{C}\\text{-coordinates}', { headY: 150 });
        const E = { h: s.tex('\\mathcal{E}\\ (\\text{standard})', { x: 790, y: 150, size: 32, visible: false }), pt: R.p.point(X.map(Number), { color: C.green, label: tup(X), r: 10, visible: false }) };
        const fwd = s.arrow(310, 290, 650, 290, { color: C.ink, visible: false });
        const back = s.arrow(650, 380, 310, 380, { color: C.muted, visible: false });
        const fl = s.tex(`${SPCB} = ${texMat(P)}`, { x: 480, y: 225, size: 32, visible: false });
        const bl = s.tex(`${SPBC} = P^{-1} = ${texMat(PINV)}`, { x: 480, y: 450, size: 32, visible: false });
        const el = s.tex(`${SPEB} = P_{\\mathcal{B}} = ${texMat(PB)}`, { x: 480, y: 225, size: 32, visible: false });
        const note = s.text('The matrix $P_{\\mathcal{B}}$ from Section 4.4 is the special case $\\mathcal{C} = \\mathcal{E}$.', { x: 480, y: 540, size: 30, color: C.muted, visible: false });
        return { L, R, E, fwd, back, fl, bl, el, note };
      },
      steps: [
        {
          say: 'The matrix translates $\\mathcal{B}${B} coordinates into $\\mathcal{C}${C} coordinates. To translate back, undo it: the reverse matrix is the inverse.',
          do: async (s, o) => {
            await s.all(o.L.p.draw({ duration: 600 }), o.R.p.draw({ duration: 600 }), o.L.h.fadeIn(), o.R.h.fadeIn());
            await o.L.pt.draw();
            await s.all(o.fwd.draw({ duration: 700 }), o.fl.fadeIn());
            await o.R.pt.draw();
            await s.all(o.back.draw({ duration: 700 }), o.bl.fadeIn());
          },
        },
        {
          say: 'Here\'s a special case. If the new basis is the standard one, the translation is just $P_{\\mathcal{B}}${P B}, the change of coordinates matrix from last time.',
          do: async (s, o) => {
            await s.all(o.back.fadeOut(), o.bl.fadeOut(), o.fl.fadeOut(), o.R.h.fadeOut(), o.R.pt.fadeOut());
            await s.all(o.E.h.fadeIn(), o.el.fadeIn());
            await o.E.pt.draw();
            await o.note.fadeIn();
          },
        },
      ],
    },

    // 6
    {
      id: 'mistake-order',
      title: 'The trap: the wrong augmented matrix',
      scene(s) {
        const ok = s.tex('\\text{into } \\mathcal{C}:\\ [\\,\\mathbf{c}_1\\ \\mathbf{c}_2 \\mid \\mathbf{b}_1\\ \\mathbf{b}_2\\,]', { x: 700, y: 90, size: 34, color: C.green, visible: false });
        const bad = s.tex('[\\,\\mathbf{b}_1\\ \\mathbf{b}_2 \\mid \\mathbf{c}_1\\ \\mathbf{c}_2\\,]', { x: 250, y: 90, size: 34, color: C.yellow, visible: false });
        const m = s.matrix(WAUG, { x: 280, y: 255, size: 48, augment: 2, visible: false });
        const got = s.tex(`\\text{right block} = ${texMat(WRONG)} = ${SPBC}`, { x: 480, y: 410, size: 34, color: C.yellow, visible: false });
        const want = s.tex(`\\text{wanted } ${SPCB} = ${texMat(P)} = \\big(${SPBC}\\big)^{-1}`, { x: 480, y: 525, size: 32, color: C.green, visible: false });
        return { ok, bad, m, got, want };
      },
      steps: [
        {
          say: 'Here\'s the trap: putting the old basis on the left. Reduce $[\\,\\mathbf{b}_1\\ \\mathbf{b}_2 \\mid \\mathbf{c}_1\\ \\mathbf{c}_2\\,]${b one, b two, augmented with c one, c two}, and you write the $\\mathbf{c}${c} vectors in the $\\mathcal{B}${B} basis. That\'s the translation from $\\mathcal{C}${C} to $\\mathcal{B}${B}: the wrong direction.',
          do: async (s, o) => {
            await s.all(o.bad.write(), o.m.fadeIn());
            for (const st of WRED.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), o.m.highlightCol(2, C.yellow), o.m.highlightCol(3, C.yellow));
            await o.got.write();
            o.box = s.surround(o.got, { pad: 12, visible: false });
            await o.box.draw();
          },
        },
        {
          say: 'The basis you\'re translating into goes on the left. Swap the two sides and you get the inverse of the matrix you wanted.',
          do: async (s, o) => {
            await o.ok.write();
            await o.want.write();
            await s.strike(o.bad, { color: 'yellow' });
          },
        },
      ],
    },

    // 7
    {
      id: 'fill-p',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks. Think about which basis goes where.',
      lines: [
        ['[\\,\\mathbf{c}_1\\ \\mathbf{c}_2 \\mid \\mathbf{b}_1\\ \\mathbf{b}_2\\,] \\sim [\\,I \\mid ', { id: 'p', chips: [PCB, PBC, 'P_{\\mathcal{B}}'], answer: PCB }, '\\,]'],
        [`\\text{columns of } ${PCB} \\text{ are }`, { id: 'cols', chips: ['[\\mathbf{b}_j]_{\\mathcal{C}}', '[\\mathbf{c}_j]_{\\mathcal{B}}', '\\mathbf{b}_j'], answer: '[\\mathbf{b}_j]_{\\mathcal{C}}' }],
      ],
      solution: [
        `Row reducing $[\\,\\mathbf{c}_1\\ \\mathbf{c}_2 \\mid \\mathbf{b}_1\\ \\mathbf{b}_2\\,]$ solves $[\\,\\mathbf{c}_1\\ \\mathbf{c}_2\\,]\\mathbf{y} = \\mathbf{b}_j$ for both $j$ at once, so the right block becomes $${PCB}$.`,
        `Its columns are the $\\mathcal{C}$-coordinates of the old basis vectors, $[\\mathbf{b}_j]_{\\mathcal{C}}$. The vectors $\\mathbf{b}_j$ themselves are standard coordinates, and $[\\mathbf{c}_j]_{\\mathcal{B}}$ are the columns of the inverse, $${PBC}$.`,
      ],
    },

    // 8
    {
      id: 'wo-change',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Find the change of coordinates matrix from $\\mathcal{B}${B} to $\\mathcal{C}${C}, then check one column.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateChange,
    },

    // 9
    {
      id: 'try-poly-change',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. The same idea works for polynomials: write each old basis vector in the new basis.',
      prompt: `In $\\mathbb{P}_1$, $\\mathcal{B} = \\{1, t\\}$ and $\\mathcal{C} = \\{1,\\ 1 + t\\}$. Which is $${PCB}$?`,
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: `$${texMat(P1)}$`, why: `Right: $1 = 1\\cdot 1 + 0\\cdot(1 + t)$ and $t = ${t(P1[0][1])}\\cdot 1 + ${t(P1[1][1])}\\cdot(1 + t)$.` },
        { id: 'b', label: `$${texMat(P1_INV)}$`, why: `That's $${PBC}$: it writes $1 + t$ in $\\mathcal{B}$.` },
        { id: 'c', label: '$I$', why: 'Different bases give different coordinates: $t$ is not $(0, 1)$ in $\\mathcal{C}$.' },
      ],
      hint: 'Write $t$ as a combination of $1$ and $1 + t$.',
      solution: [
        'The columns are $[1]_{\\mathcal{C}}$ and $[t]_{\\mathcal{C}}$.',
        `$1 = 1\\cdot 1 + 0\\cdot(1 + t)$, so $[1]_{\\mathcal{C}} = (1, 0)$. $t = ${t(P1[0][1])}\\cdot 1 + ${t(P1[1][1])}\\cdot(1 + t)$, so $[t]_{\\mathcal{C}} = ${tup(P1.map((r) => r[1]))}$.`,
        `$${PCB} = ${texMat(P1)}$.`,
      ],
    },

    // 10
    {
      id: 'via-standard',
      title: 'A route through the standard basis',
      scene(s) {
        const xs = [170, 480, 790];
        const panels = [[XB, '\\mathcal{B}'], [X, '\\mathcal{E}'], [XC, '\\mathcal{C}']].map(([c, h], k) =>
          coordPanel(s, xs[k], c, `${h}:\\ \\col{green}{${tup(c)}}`, { y: 310, width: 220, headY: 455, label: false }),
        );
        const a1 = s.arrow(285, 235, 365, 235, { color: C.ink, visible: false });
        const a2 = s.arrow(595, 235, 675, 235, { color: C.ink, visible: false });
        const l1 = s.tex('P_{\\mathcal{B}}', { x: 325, y: 200, size: 32, visible: false });
        const l2 = s.tex('P_{\\mathcal{C}}^{-1}', { x: 635, y: 196, size: 32, visible: false });
        const big = s.arrow(170, 150, 790, 150, { color: C.green, width: 4, visible: false });
        const bl = s.tex(`${SPCB} = P_{\\mathcal{C}}^{-1}P_{\\mathcal{B}}`, { x: 480, y: 95, size: 34, color: C.green, visible: false });
        const prod = s.tex(`${texMat(PC_INV)}${texMat(PB)} = ${texMat(P)}`, { x: 480, y: 530, size: 32, visible: false });
        const poly = `\\mathbb{P}_1:\\ P_{\\mathcal{B}} = I \\;\\Rightarrow\\; ${SPCB} = P_{\\mathcal{C}}^{-1} = ${texMat(inverse(PC1))}`;
        return { panels, a1, a2, l1, l2, big, bl, prod, poly };
      },
      steps: [
        {
          say: 'Here\'s another way to think about it. Go from $\\mathcal{B}${B} coordinates to standard ones with $P_{\\mathcal{B}}${P B}, then from standard to $\\mathcal{C}${C} coordinates with $P_{\\mathcal{C}}^{-1}${P C inverse}.',
          do: async (s, o) => {
            await s.all(...o.panels.map((pn) => s.all(pn.p.draw({ duration: 600 }), pn.h.fadeIn())));
            await o.panels[0].pt.draw();
            await s.all(o.a1.draw({ duration: 500 }), o.l1.fadeIn());
            await o.panels[1].pt.draw();
            await s.all(o.a2.draw({ duration: 500 }), o.l2.fadeIn());
            await o.panels[2].pt.draw();
          },
        },
        {
          say: 'The two steps together are one matrix, $P_{\\mathcal{C}}^{-1}P_{\\mathcal{B}}${P C inverse times P B}. Multiply it out and you get exactly the matrix the row reduction produced.',
          do: async (s, o) => {
            await s.all(o.big.draw({ duration: 900 }), o.bl.fadeIn({ delay: 300 }));
            await o.prod.write({ duration: 1200 });
          },
        },
        {
          say: 'Row reducing $[\\,\\mathbf{c}_1\\ \\mathbf{c}_2 \\mid \\mathbf{b}_1\\ \\mathbf{b}_2\\,]${c one, c two augmented with b one, b two} is just the efficient way to compute this product, without ever finding the inverse.',
          do: (s, o) => o.prod.indicate({ color: C.green, scale: 1.08 }),
        },
        {
          say: 'The same route works for polynomials. In $\\mathbb{P}_1${P one} with $\\mathcal{B} = \\{1, t\\}${B equal to one, t}, $P_{\\mathcal{B}}${P B} is the identity, so the matrix is just $P_{\\mathcal{C}}^{-1}${P C inverse}: the answer to the polynomial exercise.',
          do: (s, o) => o.prod.swap(o.poly, { duration: 700 }),
        },
      ],
    },

    // 11
    {
      id: 'cp-change',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: `Why are the columns of $${PCB}$ the $\\mathcal{C}$-coordinates of the $\\mathcal{B}$ basis vectors?`,
      points: [
        'Write $\\mathbf{x} = x_1\\mathbf{b}_1 + x_2\\mathbf{b}_2$, where $(x_1, x_2) = [\\mathbf{x}]_{\\mathcal{B}}$',
        'The coordinate map $[\\cdot]_{\\mathcal{C}}$ is linear',
        'So $[\\mathbf{x}]_{\\mathcal{C}} = x_1[\\mathbf{b}_1]_{\\mathcal{C}} + x_2[\\mathbf{b}_2]_{\\mathcal{C}}$, a matrix–vector product with those columns',
        'Feeding in $[\\mathbf{b}_j]_{\\mathcal{B}} = \\mathbf{e}_j$ returns column $j$, which must be $[\\mathbf{b}_j]_{\\mathcal{C}}$',
      ],
    },

    // 12
    {
      id: 'summary-change',
      title: 'Summary',
      scene(s) {
        const left = basisPlane(s, { x: 220, y: 200, width: 240, range: [-2, 4, -2, 5], labels: false, visible: true });
        const right = basisPlane(s, { x: 740, y: 200, width: 240, range: [-2, 4, -2, 5], labels: false, visible: true });
        left.xv.show();
        right.xv.show();
        const arrow = s.arrow(380, 200, 580, 200, { color: C.green, width: 4, visible: false });
        const al = s.tex(SPCB, { x: 480, y: 150, size: 34, color: C.green, visible: false });
        const items = [
          'Columns: the old basis in new coordinates.',
          'Row reduce [new | old] to get [I | P].',
          'Go back with the inverse.',
        ].map((str, i) => s.text(str, { x: 480, y: 420 + 50 * i, size: 32, visible: false }));
        return { left, right, arrow, al, items };
      },
      steps: [
        {
          say: 'The change of coordinates matrix has the old basis vectors, written in the new basis, as its columns.',
          do: async (s, o) => {
            await s.all(o.left.p.applyMatrix(MAP_B, { duration: 1200 }), o.right.p.applyMatrix(num2(PC), { duration: 1200 }));
            await s.all(o.arrow.draw({ duration: 600 }), o.al.fadeIn());
            await o.items[0].fadeIn();
          },
        },
        {
          say: 'To compute it, row reduce the new basis augmented with the old one.',
          do: (s, o) => o.items[1].fadeIn(),
        },
        {
          say: 'To go back, use the inverse. Later, in diagonalization, this pays off: the right basis can make a matrix diagonal.',
          do: (s, o) => o.items[2].fadeIn(),
        },
      ],
    },
  ],
};
