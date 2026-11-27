/**
 * Lecture 2 · Row reduction and echelon forms (Lay 1.2). Design: matrix/PLAN.md § 2.
 * Every matrix, row operation and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, mul, rref, solve, det, isEchelon, texMat, texRowOp, texVec } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const X = ['x_1', 'x_2', 'x_3', 'x_4'];
const t = (x) => F(x).tex({ inline: true });

/** Beat 1–2: the echelon "shape" (■ leading entry, * anything). */
const B = '\\blacksquare';
const S = '\\ast';
const SHAPE = [
  [B, S, S, S, S],
  [0, B, S, S, S],
  [0, 0, 0, B, S],
  [0, 0, 0, 0, 0],
];
const LEAD = [[0, 0], [1, 1], [2, 3]];
const SHAPE_RREF = [
  [1, 0, S, 0, S],
  [0, 1, S, 0, S],
  [0, 0, 0, 1, S],
  [0, 0, 0, 0, 0],
];

/** Lay 1.2's definitions, shown as cards beside the shape matrix. */
const ECHELON_CONDS = [
  'All nonzero rows are above any rows of all zeros.',
  'Each leading entry of a row is in a column to the right of the leading entry of the row above it.',
  'All entries in a column below a leading entry are zeros.',
];
const REDUCED_CONDS = '(4) The leading entry in each nonzero row is 1. (5) Each leading 1 is the only nonzero entry in its column.';
const PIVOT_DEF =
  'A **pivot position** in a matrix $A$ is a location in $A$ that corresponds to a leading 1 in the reduced echelon form of $A$. A **pivot column** is a column of $A$ that contains a pivot position.';
const SHAPE_X = 270;
const CARD_X = 705;
const CARD_W = 430;

/** Beats 4–6: the worked example. */
const ALG = mat([[0, 1, -1, 2, 3], [1, 2, 0, 1, 4], [2, 5, -1, 3, 10]]);
const ALG_RED = rref(ALG, { augmented: 1 });
const ALG_FWD = ALG_RED.steps.filter((st) => st.phase === 'forward');
const ALG_BWD = ALG_RED.steps.filter((st) => st.phase === 'backward');
const ALG_PIVCOLS = ALG_RED.pivots.map(([, c]) => c);
const ALG_SOL = solve(ALG.map((r) => r.slice(0, 4)), ALG.map((r) => r[4]));

/** Beat 7: an RREF with two free variables. */
const FREE = mat([[1, -3, 0, 2, 4], [0, 0, 1, -1, 5]]);

/** Beat 8: an inconsistent echelon form. */
const BAD = mat([[1, -2, -1, 3, 0], [0, 0, 3, 1, 3], [0, 0, 0, 0, 5]]);

/** Beat 11: more unknowns than equations, still inconsistent. */
const WIDE = mat([[1, 1, 1, 1], [1, 1, 1, 2]]);
const WIDE_RED = rref(WIDE, { augmented: 1 });
/** …and a consistent system of the same size: two pivots at most, so a free column. */
const WIDE_OK = mat([[1, 1, 1, 1], [1, 2, 1, 3]]);
const WIDE_OK_RED = rref(WIDE_OK, { augmented: 1 });

/** Beat 3: candidates for "reduced echelon form". */
const CANDS = {
  a: [[1, 0, 2], [0, 1, 3], [0, 0, 0]],
  b: [[1, 2, 0], [0, 0, 1], [0, 1, 0]],
  c: [[1, 3, 0], [0, 1, 0], [0, 0, 1]],
  d: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
};
const REDUCED = Object.keys(CANDS).filter((k) => isEchelon(CANDS[k], { reduced: true }));

/** Beat 9: echelon form for the consistency question. */
const CONS = mat([[2, 1, -1, 3], [0, 0, 4, 8], [0, 0, 0, 0]]);

// ---------------------------------------------------------------- TeX helpers

/** `2x_1 - x_2 + x_3`; `names` may wrap variables in \part{…}. */
function lin(coefs, names = X) {
  let out = '';
  coefs.forEach((c0, j) => {
    const c = F(c0);
    if (c.zero) return;
    const a = c.abs();
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + names[j];
  });
  return out || '0';
}

/** `1 - 2x_3`: a constant plus multiples of variables. */
function affine(c0, terms) {
  let out = F(c0).zero ? '' : t(c0);
  for (const [k, name] of terms) {
    const c = F(k);
    if (c.zero) continue;
    const a = c.abs();
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + name;
  }
  return out || '0';
}

/**
 * The general solution of an RREF [R | d] as TeX lines `x_1 = 1 - 2x_3`, `x_3 \text{ is free}` in variable order.
 * `wrap(name)` decorates free-variable names.
 */
function generalLines(R, wrap = (s) => s) {
  const n = R[0].length - 1;
  const piv = new Map();
  R.forEach((row, r) => {
    const c = row.slice(0, n).findIndex((v) => !F(v).zero);
    if (c >= 0) piv.set(c, r);
  });
  const free = [...Array(n).keys()].filter((c) => !piv.has(c));
  return [...Array(n).keys()].map((c) =>
    piv.has(c)
      ? `${X[c]} &= ${affine(R[piv.get(c)][n], free.map((f) => [F(R[piv.get(c)][f]).neg(), wrap(X[f])]))}`
      : `${wrap(X[c])} &\\ \\text{is free}`,
  );
}

const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];

/** The staircase under the leading entries of a matrix mob (for LEAD positions), as an SVG path. */
function staircase(m, lead) {
  const cb = (i, j) => m.cellBox(i, j);
  const xL = (i, c) => (c === 0 ? cb(i, 0).x - 6 : (cb(i, c - 1).x + cb(i, c - 1).w + cb(i, c).x) / 2);
  const yB = (i) => (i + 1 < m.m ? (cb(i, 0).y + cb(i, 0).h + cb(i + 1, 0).y) / 2 : cb(i, 0).y + cb(i, 0).h + 4);
  const xEnd = cb(0, m.n - 1).x + cb(0, m.n - 1).w + 6;
  let d = `M ${xL(0, lead[0][1])} ${yB(lead[0][0])}`;
  lead.forEach((_, k) => {
    const next = lead[k + 1];
    d += next ? ` H ${xL(next[0], next[1])} V ${yB(next[0])}` : ` H ${xEnd}`;
  });
  return d;
}

// ---------------------------------------------------------------- workout data

function solutionItem(aug) {
  const A = aug.map((r) => r.slice(0, 4));
  const b = aug.map((r) => r[4]);
  const sol = solve(A, b);
  const red = rref(aug, { augmented: 1 });
  const pivCols = red.pivots.map(([, c]) => c);
  const free = [0, 1, 2, 3].filter((c) => !pivCols.includes(c));
  const vecForm = `${texVec(sol.particular)} ${sol.basis.map((v, k) => `+ x_${free[k] + 1}${texVec(v)}`).join(' ')}`;
  const fwd = red.steps.filter((st) => st.phase === 'forward');
  return {
    prompt: `Find the general solution of the system whose augmented matrix is $$${texMat(aug, { augment: 4 })}.$$ Give a particular solution and one direction vector per free variable.`,
    answer: { type: 'solution', particular: sol.particular.map(String), basis: sol.basis.map((v) => v.map(String)) },
    hints: [
      `Start the forward phase: ${fwd.slice(0, 2).map((st) => `$${texRowOp(st)}$`).join(', ')}.`,
      `The echelon form is $${texMat(red.echelon, { augment: 4 })}$. Which columns have pivots?`,
      `The reduced echelon form is $${texMat(red.R, { augment: 4 })}$. Solve each row for its basic variable.`,
    ],
    solution: [
      `Row reduce $[A \\mid \\mathbf{b}]$ one operation at a time:`,
      red.steps.map((st) => `- $${texRowOp(st)}$: $${texMat(st.after, { augment: 4 })}$`).join('\n'),
      `This is the reduced echelon form $${texMat(red.R, { augment: 4 })}$.`,
      `Pivots sit in columns ${pivCols.map((c) => c + 1).join(' and ')}, so $${free.map((f) => X[f]).join(', ')}$ are free and the last column is not a pivot column: the system is consistent.`,
      `Solve for the basic variables: $\\begin{aligned} ${generalLines(red.R).join(' \\\\ ')} \\end{aligned}$`,
      `In vector form: $\\mathbf{x} = ${vecForm}$.`,
    ],
  };
}
const WO_AUG = mat([[1, -2, 1, 3, 2], [1, -2, 0, 1, 3], [2, -4, 1, 4, 5]]);
const WO = solutionItem(WO_AUG);

/** A random RREF with 2 pivots in 4 columns, times a random invertible 3×3 E with small entries. */
function generateGeneral(rand) {
  for (;;) {
    const c2 = rand.int(1, 3);
    const R = [[1, 0, 0, 0, rand.int(-3, 3)], [0, 0, 0, 0, rand.int(-3, 3)], [0, 0, 0, 0, 0]];
    R[1][c2] = 1;
    for (let j = 1; j < 4; j++) if (j !== c2) R[0][j] = rand.int(-3, 3);
    for (let j = c2 + 1; j < 4; j++) R[1][j] = rand.int(-3, 3);
    const E = [0, 1, 2].map(() => [0, 1, 2].map(() => rand.int(-2, 2)));
    if (E[0][0] !== 1 || !det(mat(E)).abs().eq(1)) continue;
    const aug = mul(mat(E), mat(R));
    if (aug.some((row) => row.some((v) => v.abs().cmp(20) > 0))) continue;
    if (aug.some((row) => row.every((v) => v.zero))) continue;
    if ([0, 1, 2, 3].filter((j) => R[0][j] !== 0 || R[1][j] !== 0).length < 3) continue;
    const red = rref(aug, { augmented: 1 });
    if (!red.steps.every((st) => st.after.every((row) => row.every((v) => v.d <= 6n && v.abs().cmp(20) <= 0)))) continue;
    return solutionItem(aug);
  }
}

// ---------------------------------------------------------------- scene builders

const shapeMatrix = (s, rows, opts = {}) => s.matrix(rows, { x: SHAPE_X, y: 300, size: 44, ...opts });

/** Hidden defCards stacked top-down in the right column (measured, so wrapped bodies never collide). */
function cardStack(s, specs, { top = 40, gap = 14, kind } = {}) {
  let y = top;
  return specs.map((spec) => {
    const c = s.defCard({ x: CARD_X, y, width: CARD_W, size: 30, kind, anchor: [0.5, 0], visible: false, ...spec });
    y += c.box().h + gap;
    return c;
  });
}
const algMatrix = (s, rows) => s.matrix(rows, { x: 360, y: 290, size: 44, augment: 4 });

/** A flowchart node: ink text in a rounded box of the given color. */
function node(s, str, x, y, { color = C.ink, fill } = {}) {
  const txt = s.text(str, { x, y, size: 30, visible: false });
  const t0 = txt.box();
  const b = { x: t0.x - 16, y: t0.y - 10, w: t0.w + 32, h: t0.h + 20 };
  const box = s.rect(b.x, b.y, b.w, b.h, { color, radius: 14, fill, visible: false });
  return { txt, box, b, show: (o) => Promise.all([box.draw(o), txt.fadeIn({ shift: [0, 0], ...o })]) };
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'row-reduction',
  title: 'Row reduction and echelon forms',
  goals: [
    'Recognize echelon and reduced echelon form; find pivot positions and pivot columns',
    'Run the row reduction algorithm: forward phase, then backward phase',
    'Separate basic and free variables and write the general solution',
    'Decide existence and uniqueness from an echelon form',
  ],
  beats: [
    // 1
    {
      id: 'staircase',
      title: 'The staircase shape',
      scene(s) {
        const m = shapeMatrix(s, SHAPE, { visible: false });
        const stairs = s.path(staircase(m, LEAD), { color: C.yellow, width: 4, visible: false });
        const zeroRow = s.text('zero rows at the bottom', { x: SHAPE_X, y: 540, size: 30, color: C.muted, visible: false });
        const conds = cardStack(s, ECHELON_CONDS.map((body, k) => ({ title: k ? false : 'Echelon form', body: `(${k + 1}) ${body}` })), { top: 30, gap: 10 });
        return { m, stairs, zeroRow, conds };
      },
      steps: [
        {
          say: 'Here\'s the shape we\'re aiming for. In echelon form, each row\'s first nonzero entry, its leading entry, sits to the right of the leading entry in the row above. It looks like a staircase.',
          do: async (s, o) => {
            await o.m.fadeIn();
            await s.all(s.stagger(LEAD.map(([i, j]) => () => o.m.pivot(i, j)), 400), o.conds[1].reveal());
            await o.stairs.draw({ duration: 1200 });
          },
        },
        {
          say: 'Any rows made entirely of zeros sink to the bottom.',
          do: (s, o) => s.all(o.m.highlightRow(3, C.muted), o.zeroRow.fadeIn(), o.conds[0].reveal()),
        },
        {
          say: 'And every entry below a leading entry is zero. Those are the zeros under the stairs.',
          do: (s, o) =>
            s.all(
              s.stagger([[1, 0], [2, 0], [3, 0], [2, 1], [3, 1], [3, 3]].map(([i, j]) => () => o.m.highlightCell(i, j, C.yellow)), 150),
              o.conds[2].reveal(),
            ),
        },
      ],
    },

    // 2
    {
      id: 'reduced',
      title: 'Reduced echelon form',
      scene(s) {
        const m = shapeMatrix(s, SHAPE);
        LEAD.forEach(([i, j]) => m.pivot(i, j));
        const stairs = s.path(staircase(m, LEAD), { color: C.yellow, width: 4 });
        const card = (o) => s.defCard({ x: CARD_X, y: 280, width: CARD_W, visible: false, ...o });
        const red = card({ title: 'Reduced echelon form: also', body: REDUCED_CONDS });
        const thm = card({ kind: 'theorem', title: 'Theorem 1 (Uniqueness)', body: 'Each matrix is row equivalent to one and only one reduced echelon matrix.' });
        const piv = card({ body: PIVOT_DEF });
        const label = s.text('pivot positions', { x: SHAPE_X, y: 540, size: 32, color: C.blue, visible: false });
        return { m, stairs, red, thm, piv, label };
      },
      steps: [
        {
          say: 'Now push further. In reduced echelon form, every leading entry is a $1${one}, and it is the only nonzero entry in its column.',
          do: async (s, o) => {
            await s.all(o.red.reveal(), [[0, 1], [0, 3], [1, 3]].map(([i, j], k) => o.m.highlightCell(i, j, C.yellow, { delay: 400 + k * 150 })));
            await o.m.setRows(SHAPE_RREF, { gap: 120 });
          },
        },
        {
          say: 'A matrix can be row reduced to many different echelon forms. But Theorem 1 says it reduces to exactly one reduced echelon form.',
          do: async (s, o) => {
            await s.all(o.m.clearHighlights(), o.red.fadeOut({ shift: [0, -20] }));
            await o.thm.reveal();
          },
        },
        {
          say: 'That\'s why pivot positions are well defined: a pivot position is where a leading one of the reduced form lands, no matter which steps you took, and a pivot column is a column that contains one.',
          do: async (s, o) => {
            await o.thm.fadeOut({ shift: [0, -20] });
            await s.all(o.piv.reveal(), LEAD.map(([i, j], k) => o.m.highlightCell(i, j, C.blue, { delay: k * 200 })));
            await o.label.fadeIn();
          },
        },
      ],
    },

    // 3
    {
      id: 'try-which-echelon',
      kind: 'try',
      title: 'Your turn',
      say: 'Which one of these is in reduced echelon form? Check the staircase first, then the columns of the leading ones.',
      prompt: 'Which matrix is in **reduced** echelon form?',
      figure(s) {
        Object.entries(CANDS).forEach(([k, rows], idx) => {
          const x = idx % 2 ? 690 : 250;
          const y = idx < 2 ? 150 : 450;
          s.text(`(${k})`, { x: x - 190, y, size: 48, weight: 600 });
          s.matrix(rows, { x: x + 20, y, size: 50 });
        });
      },
      answer: { type: 'choice', value: REDUCED[0] },
      choices: [
        { id: 'a', label: 'Matrix (a)', why: 'Right: a staircase, every leading entry is 1, and each is alone in its column.' },
        { id: 'b', label: 'Matrix (b)', why: 'Row 3\'s leading entry is left of row 2\'s: not a staircase.' },
        { id: 'c', label: 'Matrix (c)', why: 'Echelon, yes, but the 3 sits above a leading 1, so it is not reduced.' },
        { id: 'd', label: 'Matrix (d)', why: 'A zero row must be at the bottom.' },
      ],
      hint: 'First check the staircase. Then look at the column of each leading 1: is everything else in it zero?',
      solution: [
        '(b) fails the staircase: the leading entry of row 3 is in column 2, left of row 2\'s leading entry in column 3.',
        '(c) is in echelon form, but column 2 holds a leading 1 with a 3 above it, so it is not reduced. (d) has its zero row on top.',
        '(a) is a staircase, its leading entries are 1, and each is the only nonzero entry in its column. The zero row is at the bottom, and the 2 and 3 in column 3 are fine because column 3 has no pivot.',
      ],
    },

    // 4
    {
      id: 'algorithm-forward',
      title: 'The algorithm, forward phase',
      scene(s) {
        return { m: algMatrix(s, ALG) };
      },
      steps: [
        {
          say: 'Start with the leftmost nonzero column, here column one. The pivot goes at the top, but the top entry is zero, so swap a row with a nonzero entry up: $R_1 \\leftrightarrow R_2${swap R one and R two}.',
          do: async (s, o) => {
            await o.m.highlightCol(0, C.yellow);
            await o.m.rowOp(ALG_FWD[0]);
            await o.m.pivot(0, 0);
          },
        },
        {
          say: 'Now use that pivot to clear everything below it. Row two already has a zero, so only row three needs work: $R_3 \\to R_3 - 2R_1${R three becomes R three minus two R one}.',
          do: (s, o) => o.m.rowOp(ALG_FWD[1]),
        },
        {
          say: 'Cover the first row and repeat on what\'s left. The next pivot is in column two, and we clear below it with $R_3 \\to R_3 - R_2${R three becomes R three minus R two}.',
          do: async (s, o) => {
            await o.m.clearHighlights();
            await s.all(o.m.highlightRow(0, C.muted), o.m.highlightCol(1, C.yellow));
            await o.m.pivot(1, 1);
            await o.m.rowOp(ALG_FWD[2]);
          },
        },
        {
          say: 'Row three now reads $[0\\ 0\\ 0\\ {-1} \\mid {-1}]${zeros, then minus one, with minus one on the right}. Column three has nothing left below row two, so the third pivot jumps to column four. That\'s echelon form.',
          do: async (s, o) => {
            await s.all(o.m.clearHighlights(), o.m.note());
            await o.m.highlightRow(2, C.yellow);
            await o.m.pivot(2, 3);
          },
        },
      ],
    },

    // 5
    {
      id: 'algorithm-backward',
      title: 'Backward phase',
      scene(s) {
        const m = algMatrix(s, ALG_RED.echelon);
        ALG_RED.pivots.forEach(([i, j]) => m.pivot(i, j));
        const cols = s.tex(`\\text{pivot columns: } ${ALG_PIVCOLS.map((c) => c + 1).join(',\\ ')}`, { x: 360, y: 510, size: 36, color: C.blue, visible: false });
        return { m, cols };
      },
      steps: [
        {
          say: 'Now the backward phase. Work from the bottom pivot up, right to left. First make the bottom pivot a $1${one}: scale row three by $-1${minus one}.',
          do: (s, o) => o.m.rowOp(ALG_BWD[0]),
        },
        {
          say: 'Then clear the entries above it, and move up to the next pivot and do the same.',
          do: async (s, o) => {
            for (const st of ALG_BWD.slice(1)) await o.m.rowOp(st);
          },
        },
        {
          say: 'This is the reduced echelon form. Its pivots are in columns one, two and four.',
          do: async (s, o) => {
            await o.m.note();
            await s.all(ALG_PIVCOLS.map((c, k) => o.m.highlightCol(c, C.blue, { delay: k * 200 })));
            await o.cols.write();
          },
        },
      ],
    },

    // 6
    {
      id: 'free-variables',
      title: 'Basic and free variables',
      scene(s) {
        const m = s.matrix(ALG_RED.R, { x: 250, y: 150, size: 34, augment: 4 });
        ALG_RED.pivots.forEach(([i, j]) => m.pivot(i, j));
        const wrap = (name) => (ALG_SOL.free.map((f) => X[f]).includes(name) ? `\\col{yellow}{${name}}` : name);
        const eqTex = `\\begin{aligned} ${ALG_RED.R.map((row) => `${lin(row.slice(0, 4), X.map(wrap))} &= ${t(row[4])}`).join(' \\\\ ')} \\end{aligned}`;
        const eqs = s.tex(eqTex, { x: 250, y: 420, size: 40, visible: false });
        // A copy of the equations that travels to the right and becomes the general solution (the original stays).
        const copy = s.tex(eqTex, { x: 250, y: 420, size: 40, visible: false });
        const gen = s.tex(`\\begin{aligned} ${generalLines(ALG_RED.R, (n) => `\\col{yellow}{${n}}`).join(' \\\\ ')} \\end{aligned}`, { x: 690, y: 240, size: 40, visible: false });
        const fv = X[ALG_SOL.free[0]];
        const samples = [0, 1, -1].map((v) => {
          const x = ALG_SOL.particular.map((p, k) => p.add(ALG_SOL.basis[0][k].mul(v)));
          return `${fv} = ${v}:\\ \\ \\mathbf{x} = (${x.map(String).join(', ')})`;
        });
        const sample = s.tex(samples[0], { x: 680, y: 490, size: 32, color: C.green, visible: false });
        return { m, eqs, copy, gen, sample, samples };
      },
      steps: [
        {
          say: 'Read the reduced form as equations. Variables in pivot columns are called basic; the others are free. Here $x_3${x three} is the free variable.',
          do: async (s, o) => {
            await o.m.highlightCol(ALG_SOL.free[0], C.yellow);
            await o.eqs.write({ duration: 1400 });
          },
        },
        {
          say: 'Solve each equation for its basic variable, and leave the free variable as it is.',
          do: (s, o) => o.copy.show().morphTo(o.gen, { duration: 1200 }),
        },
        {
          say: 'Any value of $x_3${x three} gives a solution. Zero gives one, one gives another, minus one another still. So there are infinitely many.',
          do: async (s, o) => {
            await o.sample.fadeIn();
            for (const tx of o.samples.slice(1)) {
              await s.wait(900);
              await o.sample.swap(tx);
            }
          },
        },
      ],
    },

    // 7
    {
      id: 'fill-free',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'This matrix is already in reduced echelon form. Fill in the general solution.',
      figure(s) {
        const m = s.matrix(FREE, { x: 480, y: 300, size: 60, augment: 4 });
        m.pivot(0, 0);
        m.pivot(1, 2);
      },
      lines: [
        ['x_1 = ', { id: 'c1', answer: { type: 'number', value: String(FREE[0][4]) } }, `{} + ${t(FREE[0][1].neg())}x_2 - {}`, { id: 'c4', answer: { type: 'number', value: String(FREE[0][3]) } }, 'x_4'],
        ['x_3 = ', { id: 'c3', answer: { type: 'number', value: String(FREE[1][4]) } }, '{} + x_4'],
        ['\\text{free: }', { id: 'free', chips: ['x_2,\\ x_4', 'x_1,\\ x_3', 'x_4 \\text{ only}'], answer: 'x_2,\\ x_4' }],
      ],
      solution: [
        'The pivots are in columns 1 and 3, so $x_1, x_3$ are basic and $x_2, x_4$ are free.',
        `Row 1 says $${lin(FREE[0].slice(0, 4))} = ${t(FREE[0][4])}$ and row 2 says $${lin(FREE[1].slice(0, 4))} = ${t(FREE[1][4])}$. Move the free variables to the right: $\\begin{aligned} ${generalLines(FREE).join(' \\\\ ')} \\end{aligned}$`,
      ],
    },

    // 8
    {
      id: 'existence',
      title: 'When is a system consistent?',
      scene(s) {
        const thm = s.defCard({
          kind: 'theorem', title: 'Theorem 2 (Existence and Uniqueness)', x: 480, y: 28, anchor: [0.5, 0], width: 880, visible: false,
          body: 'A linear system is consistent if and only if the rightmost column of its augmented matrix is *not* a pivot column.',
        });
        const m = s.matrix(BAD, { x: 380, y: 334, size: 40, augment: 4, visible: false });
        const uniq = s.tex('\\text{consistent, no free variable} \\;\\Rightarrow\\; \\text{exactly one solution}', { x: 480, y: 500, size: 32, visible: false });
        const inf = s.tex('\\text{consistent, a free variable} \\;\\Rightarrow\\; \\text{infinitely many}', { x: 480, y: 552, size: 32, visible: false });
        return { thm, m, uniq, inf };
      },
      steps: [
        {
          say: 'Here is the theorem that answers the existence question. A system is consistent exactly when the rightmost column of its augmented matrix is not a pivot column.',
          do: async (s, o) => {
            await o.thm.reveal();
            await o.m.fadeIn();
          },
        },
        {
          say: 'In other words, an echelon form has no row like $[0\\ \\cdots\\ 0 \\mid b]${a row of zeros with b on the right} with $b${b} nonzero. This one does: its last row says $0 = 5${zero equals five}.',
          do: async (s, o) => {
            await o.m.highlightRow(2, C.yellow);
            await o.m.pivot(2, 4, { color: C.yellow });
            await o.m.note(2, '0 = 5', { color: C.yellow });
          },
        },
        {
          say: 'If the system is consistent, count free variables. With none, the solution is unique. With at least one, there are infinitely many.',
          do: async (s, o) => {
            await o.uniq.write();
            await o.inf.write();
          },
        },
      ],
    },

    // 9
    {
      id: 'try-consistent',
      kind: 'try',
      title: 'Your turn',
      say: 'Use the theorem. What does this system have?',
      prompt: 'An echelon form of the augmented matrix of a system is shown. How many solutions does the system have?',
      figure(s) {
        s.matrix(CONS, { x: 480, y: 300, size: 60, augment: 3 });
      },
      answer: { type: 'choice', value: 'inf' },
      choices: [
        { id: 'none', label: 'No solution', why: 'A zero row $[0\\;0\\;0\\mid 0]$ just says $0 = 0$; it\'s harmless.' },
        { id: 'one', label: 'Exactly one', why: 'Column 2 has no pivot, so $x_2$ is free.' },
        { id: 'inf', label: 'Infinitely many', why: 'Right: consistent, with a free variable.' },
      ],
      hint: 'Find the pivot columns. Is the last column one of them?',
      solution: [
        'The pivots are in columns 1 and 3. The last column is not a pivot column, so the system is consistent; the zero row says only $0 = 0$.',
        'Column 2 has no pivot, so $x_2$ is free, and a consistent system with a free variable has infinitely many solutions.',
      ],
    },

    // 10
    {
      id: 'mistake-zero-row',
      title: 'The trap: zero rows, and "free" means zero',
      scene(s) {
        const ok = s.matrix([[1, 2, -1, 4], [0, 0, 0, 0]], { x: 250, y: 150, size: 40, augment: 3, visible: false });
        const no = s.matrix([[1, 2, -1, 4], [0, 0, 0, 5]], { x: 710, y: 150, size: 40, augment: 3, visible: false });
        const okL = s.tex('0 = 0:\\ \\text{harmless}', { x: 250, y: 270, size: 32, color: C.green, visible: false });
        const noL = s.tex('0 = 5:\\ \\text{inconsistent}', { x: 710, y: 270, size: 32, color: C.yellow, visible: false });
        const wrong = s.tex('x_2 = 0,\\ \\ x_3 = 0', { x: 480, y: 400, size: 40, visible: false });
        const box = s.surround(wrong, { pad: 12, visible: false });
        const right = s.tex('x_2,\\ x_3 \\text{ can be any real numbers}', { x: 480, y: 500, size: 40, color: C.green, visible: false });
        return { ok, no, okL, noL, wrong, box, right };
      },
      steps: [
        {
          say: 'Two traps here. First: a row of all zeros is harmless. It just says zero equals zero.',
          do: async (s, o) => {
            await o.ok.fadeIn();
            await s.all(o.ok.highlightRow(1, C.green), o.okL.fadeIn());
          },
        },
        {
          say: 'Only a nonzero number after the bar makes a system inconsistent.',
          do: async (s, o) => {
            await o.no.fadeIn();
            await s.all(o.no.highlightRow(1, C.yellow), o.noL.fadeIn());
          },
        },
        {
          say: 'Second: it\'s tempting to set the free variables to zero and call that the answer. But that\'s just one solution among infinitely many.',
          do: async (s, o) => {
            await o.wrong.write();
            await o.box.draw();
            await s.strike(o.wrong, { color: 'yellow' });
          },
        },
        {
          say: 'Free means free: each free variable can be any real number, and every choice gives a solution.',
          do: (s, o) => o.right.write(),
        },
      ],
    },

    // 11
    {
      id: 'count-trap',
      title: 'More unknowns doesn\'t mean solutions',
      scene(s) {
        const m = s.matrix(WIDE, { x: 400, y: 260, size: 48, augment: 3, visible: false });
        const a = m.colBox(0), c = m.colBox(2);
        const brace = s.brace(a.x - 4, a.y - 14, c.x + c.w + 4, a.y - 14, { label: '3\\text{ unknowns}', side: 'above', visible: false });
        const zero = s.tex('0 = 1', { x: 400, y: 420, size: 44, color: C.yellow, visible: false });
        const freeLab = s.text('no pivot: free', { x: 400, y: 420, size: 30, color: C.yellow, visible: false });
        const rule = s.text('Consistent **and** more unknowns than equations ⇒ a free variable ⇒ infinitely many.', { x: 480, y: 530, size: 30, width: 820, visible: false });
        return { m, brace, zero, freeLab, rule };
      },
      steps: [
        {
          say: 'Three unknowns and only two equations. Surely that means infinitely many solutions?',
          do: async (s, o) => {
            await o.m.fadeIn();
            await o.brace.draw();
          },
        },
        {
          say: 'Not if the system is inconsistent. Subtract row one from row two, and you get $0 = 1${zero equals one}. No solutions at all.',
          do: async (s, o) => {
            await o.m.rowOp(WIDE_RED.steps[0]);
            await o.m.highlightRow(1, C.yellow);
            await o.zero.fadeIn();
          },
        },
        {
          say: 'Now take a consistent system of the same size, three unknowns and two equations, and reduce it. Two equations give at most two pivots, so at least one column gets none.',
          do: async (s, o) => {
            await s.all(o.zero.fadeOut(), o.m.clearHighlights(), o.m.note());
            await o.m.setRows(WIDE_OK);
            for (const st of WIDE_OK_RED.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), WIDE_OK_RED.pivots.map(([i, j]) => o.m.pivot(i, j)));
            const free = [0, 1, 2].find((j) => !WIDE_OK_RED.pivots.some(([, c]) => c === j));
            const fb = o.m.colBox(free);
            o.freeLab.set({ x: fb.cx });
            await s.all(s.ring(fb, { shape: 'box', color: 'yellow' }), o.freeLab.fadeIn());
          },
        },
        {
          say: 'Here\'s what is true. If a system with more unknowns than equations is consistent, it must have a free variable, so it has infinitely many solutions.',
          do: (s, o) => o.rule.fadeIn(),
        },
      ],
    },

    // 12
    {
      id: 'wo-general',
      kind: 'workout',
      title: 'Work it out',
      say: 'Time for paper. Row reduce this all the way, then write the general solution.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateGeneral,
    },

    // 13
    {
      id: 'try-pivots-count',
      kind: 'try',
      title: 'Your turn',
      say: 'One more, with no numbers at all. Think about where the pivots can be.',
      prompt: 'The coefficient matrix $A$ of a system $A\\mathbf{x} = \\mathbf{b}$ is $3\\times 5$ and has 3 pivot columns. Which statement is guaranteed?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: 'The system has a unique solution.', why: 'Five columns and three pivots leave $5 - 3 = 2$ free variables.' },
        { id: 'b', label: 'The system is consistent for every $\\mathbf{b}$.', why: 'Right: every row of $A$ has a pivot.' },
        { id: 'c', label: 'The system is inconsistent.', why: 'Nothing forces a row $[0 \\cdots 0 \\mid b]$; in fact none can appear.' },
      ],
      hint: 'Three pivots in a matrix with three rows: does any row of $A$ lack a pivot?',
      solution: [
        'Each pivot sits in its own row, so 3 pivots in 3 rows means every row of $A$ has a pivot.',
        'Then no row of an echelon form of $[A \\mid \\mathbf{b}]$ can look like $[0 \\cdots 0 \\mid b]$, so the last column is never a pivot column: the system is consistent for every $\\mathbf{b}$.',
        'It is not unique: 2 of the 5 columns have no pivot, so there are 2 free variables and infinitely many solutions.',
      ],
    },

    // 14
    {
      id: 'cp-pivots',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, put the whole method into your own words.',
      prompt: 'Explain how you can tell from an echelon form of $[A \\mid \\mathbf{b}]$ whether the system has no solution, exactly one, or infinitely many.',
      points: [
        'No solution exactly when there is a row $[0 \\cdots 0 \\mid b]$ with $b \\neq 0$, i.e. the last column is a pivot column',
        'Otherwise the system is consistent',
        'Exactly one solution when every column of $A$ is a pivot column (no free variables)',
        'Infinitely many when there is at least one free variable',
      ],
    },

    // 15
    {
      id: 'summary-rref',
      title: 'The recipe',
      scene(s) {
        const X0 = 500;
        const n0 = node(s, 'Row reduce $[A \\mid \\mathbf{b}]$', X0, 60);
        const q1 = node(s, 'Bad row $[0 \\cdots 0 \\mid b]$, $b \\neq 0$?', X0, 190, { color: C.yellow });
        const none = node(s, 'No solution', 130, 190, { color: C.red });
        const q2 = node(s, 'Free variable?', X0, 330, { color: C.yellow });
        const inf = node(s, 'Infinitely many', 795, 330, { color: C.green });
        const one = node(s, 'Exactly one', X0, 460, { color: C.green });
        const down = (a, b) => s.arrow(X0, a.b.y + a.b.h + 4, X0, b.b.y - 6, { color: C.muted, visible: false });
        const a1 = down(n0, q1);
        const a2 = s.arrow(q1.b.x - 6, 190, none.b.x + none.b.w + 6, 190, { color: C.muted, visible: false });
        const a3 = down(q1, q2);
        const a4 = s.arrow(q2.b.x + q2.b.w + 6, 330, inf.b.x - 6, 330, { color: C.muted, visible: false });
        const a5 = down(q2, one);
        const lab = (str, x, y) => s.text(str, { x, y, size: 30, color: C.muted, visible: false });
        const yes1 = lab('yes', (q1.b.x + none.b.x + none.b.w) / 2, 158);
        const no1 = lab('no', X0 + 32, 262);
        const yes2 = lab('yes', (q2.b.x + q2.b.w + inf.b.x) / 2, 298);
        const no2 = lab('no', X0 + 32, 397);
        const next = s.text('Next: “is there a solution?” becomes “is $\\mathbf{b}$ in a span?”', { x: 480, y: 545, size: 30, color: C.muted, visible: false });
        return { n0, q1, none, q2, inf, one, a1, a2, a3, a4, a5, yes1, no1, yes2, no2, next };
      },
      steps: [
        {
          say: 'Here is the whole recipe. Row reduce: forward to an echelon form, then backward to the reduced form.',
          do: (s, o) => o.n0.show(),
        },
        {
          say: 'The pivots tell you everything. A pivot in the last column means no solution. Otherwise, a free variable means infinitely many, and no free variable means exactly one.',
          do: async (s, o) => {
            await o.a1.draw({ duration: 400 });
            await o.q1.show();
            await s.all(o.a2.draw({ duration: 400 }), o.yes1.fadeIn());
            await o.none.show();
            await s.all(o.a3.draw({ duration: 400 }), o.no1.fadeIn());
            await o.q2.show();
            await s.all(o.a4.draw({ duration: 400 }), o.yes2.fadeIn());
            await o.inf.show();
            await s.all(o.a5.draw({ duration: 400 }), o.no2.fadeIn());
            await o.one.show();
          },
        },
        {
          say: 'Next time we read the columns as vectors, and the question "is there a solution?" becomes "is $\\mathbf{b}${b} in a span?"',
          do: (s, o) => o.next.fadeIn(),
        },
      ],
    },
  ],
};
