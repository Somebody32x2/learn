/**
 * Lecture 3 · Vector equations and Ax = b (Lay 1.3–1.4). Design: matrix/PLAN.md § 3.
 * Every vector, product, reduction and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, col, fromCols, mulVec, scaleVec, rref, solve, independent, inSpan, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

/** Beats 1: two vectors and their sum. */
const U = vec([2, 4]);
const V = vec([-1, 1]);
const UV = U.map((x, i) => x.add(V[i]));

/** Beats 2–3: a1, a2 and the target b; the weights come from solving [a1 a2 | b]. */
const A1 = vec([1, 2]);
const A2 = vec([-1, 1]);
const B2 = vec([1, 5]);
const M2 = fromCols([A1, A2]);
const VEQ = M2.map((row, i) => [...row, B2[i]]);
const VEQ_RED = rref(VEQ, { augmented: 1 });
const W2 = solve(M2, B2).x;

/** Beats 4–5: a plane in R³, a point on it and a point off it. */
const SU = vec([1, 0, 1]);
const SV = vec([0, 1, 1]);
const P_IN = vec([2, 3, 5]);
const P_OUT = vec([2, 3, 4]);
const SPAN_M = fromCols([SU, SV]);
const W_IN = solve(SPAN_M, P_IN).x;
const OUT_AUG = SPAN_M.map((row, i) => [...row, P_OUT[i]]);
const OUT_RED = rref(OUT_AUG, { augmented: 1 });
if (!inSpan(P_IN, [SU, SV]) || inSpan(P_OUT, [SU, SV])) throw new Error('vectors-span: span example drifted');

/** Beats 6–7: A x as a combination of columns. */
const AX = mat([[1, 2, -1], [0, -5, 3]]);
const XV = vec([4, 3, 7]);
const AX_COLS = [0, 1, 2].map((j) => col(AX, j));
const AX_TERMS = AX_COLS.map((c, j) => scaleVec(XV[j], c));
const AX_OUT = mulVec(AX, XV);

/** Beat 8. */
const FILL_A = mat([[2, -1], [1, 3], [0, 4]]);
const FILL_X = vec([3, -2]);
const FILL_OUT = mulVec(FILL_A, FILL_X);

/** Beat 10: columns that only span a plane. */
const T4 = mat([[1, 2, 3], [2, 4, 6], [0, 1, 1]]);
const T4_RED = rref(T4);
const T4_FWD = T4_RED.steps.filter((st) => st.phase === 'forward');

/** Beat 11: a pivot in the b column. */
const TRAP_A = mat([[1, 2], [2, 4]]);
const TRAP_B = vec([3, 7]);
const TRAP_AUG = TRAP_A.map((row, i) => [...row, TRAP_B[i]]);
const TRAP_FWD = rref(TRAP_AUG, { augmented: 1 }).steps.filter((st) => st.phase === 'forward');
const TRAP_ECH = TRAP_FWD.at(-1).after;
const TRAP_A_ECH = TRAP_ECH.map((row) => row.slice(0, 2));
if (solve(TRAP_A, TRAP_B).kind !== 'none') throw new Error('vectors-span: trap system should be inconsistent');

const COLORS = [C.blue, C.red, C.teal];

// ---------------------------------------------------------------- TeX helpers

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;

/** `2x_1 - x_2` (or `-\mathbf a_1 + 2\mathbf a_2` with other names) from coefficients. */
function lin(coefs, names) {
  let out = '';
  coefs.forEach((c0, j) => {
    const c = F(c0);
    if (c.zero) return;
    const a = c.abs();
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + names[j];
  });
  return out || '0';
}
const X2 = ['x_1', 'x_2'];
const AN = ['\\mathbf{a}_1', '\\mathbf{a}_2', '\\mathbf{a}_3'];

/** Union of several stage boxes. */
function union(...bs) {
  const x = Math.min(...bs.map((b) => b.x)), y = Math.min(...bs.map((b) => b.y));
  const r = Math.max(...bs.map((b) => b.x + b.w)), bt = Math.max(...bs.map((b) => b.y + b.h));
  return { x, y, w: r - x, h: bt - y, cx: (x + r) / 2, cy: (y + bt) / 2 };
}
/** One decimal, no trailing zero: weights while they slide. */
const fmt = (x) => `${Math.round(x * 10) / 10}`;
const N = (v) => v.map(Number);

// ---------------------------------------------------------------- workout data

/** Is b = A w in Span{a1, a2}? Prompt, answer, hints and worked solution, all computed. */
function inSpanItem(a1raw, a2raw, wraw) {
  const a1 = vec(a1raw), a2 = vec(a2raw), w = vec(wraw);
  const A = fromCols([a1, a2]);
  const b = mulVec(A, w);
  const aug = A.map((row, i) => [...row, b[i]]);
  const red = rref(aug, { augmented: 1 });
  const x = solve(A, b).x;
  const fwd = red.steps.filter((st) => st.phase === 'forward');
  const ops = red.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after, { augment: 2 })}$`).join(', then ');
  return {
    prompt: `Show that $\\mathbf{b} = ${texVec(b)}$ is a linear combination of $\\mathbf{a}_1 = ${texVec(a1)}$ and $\\mathbf{a}_2 = ${texVec(a2)}$, and enter the weights $(x_1, x_2)$.`,
    answer: { type: 'vector', value: x.map(String) },
    hints: [
      `Row reduce the augmented matrix $[\\mathbf{a}_1\\ \\mathbf{a}_2 \\mid \\mathbf{b}] = ${texMat(aug, { augment: 2 })}$.`,
      `The forward phase (${fwd.map((st) => `$${texRowOp(st)}$`).join(', ')}) gives $${texMat(red.echelon, { augment: 2 })}$. No row reads $[0\\ 0 \\mid c]$ with $c \\neq 0$, so the system is consistent; back-substitute for the weights.`,
    ],
    solution: [
      `$\\mathbf{b}$ is a combination of $\\mathbf{a}_1, \\mathbf{a}_2$ exactly when $x_1\\mathbf{a}_1 + x_2\\mathbf{a}_2 = \\mathbf{b}$ has a solution, i.e. when $[\\mathbf{a}_1\\ \\mathbf{a}_2 \\mid \\mathbf{b}] = ${texMat(aug, { augment: 2 })}$ is consistent.`,
      `Row reduce, one operation at a time: ${ops}. The zero row says $0 = 0$, so the system is consistent.`,
      `Read off the weights: $x_1 = ${t(x[0])}$, $x_2 = ${t(x[1])}$.`,
      `Check: $${lin(x, AN)} = ${t(x[0])}${texVec(a1)} + ${x[1].sign() < 0 ? `(${t(x[1])})` : t(x[1])}${texVec(a2)} = ${texVec(b)}$ ✓.`,
    ],
  };
}
const WO = inSpanItem([1, -2, 0], [2, -3, 1], [-1, 2]);

/** Fresh problems: a1, a2 in [−3, 3]³ independent, weights in [−3, 3], integer forward phase, small numbers. */
function generateInSpan(rand) {
  for (;;) {
    const a1 = [0, 1, 2].map(() => rand.int(-3, 3));
    const a2 = [0, 1, 2].map(() => rand.int(-3, 3));
    if (Math.abs(a1[0]) !== 1 || a1.filter((v) => v !== 0).length < 2 || a2.filter((v) => v !== 0).length < 2) continue;
    if (!independent([a1, a2])) continue;
    const w = [rand.nonzero(-3, 3), rand.nonzero(-3, 3)];
    const b = mulVec(fromCols([vec(a1), vec(a2)]), vec(w));
    if (b.some((v) => v.abs().cmp(20) > 0)) continue;
    const red = rref(fromCols([vec(a1), vec(a2), b]), { augmented: 1 });
    const nice = (st) => st.after.every((row) => row.every((v) => (st.phase === 'forward' ? v.d === 1n : v.d <= 6n) && v.abs().cmp(20) <= 0));
    if (!red.steps.every(nice)) continue;
    return inSpanItem(a1, a2, w);
  }
}

// ---------------------------------------------------------------- shared scene builders

/** Beats 2 and 15: the plane with a1, a2 (they don't follow linear maps, so the grid can skew under them). */
function combPlane(s, { x = 650, y = 300, width = 440, visible = false } = {}) {
  const p = s.plane({ x, y, width, range: [-4, 4, -1, 7], names: ['x_1', 'x_2'], labels: false, visible });
  const a1 = p.vector(N(A1), { color: C.blue, label: '\\mathbf{a}_1', transform: false, visible: false });
  const a2 = p.vector(N(A2), { color: C.red, label: '\\mathbf{a}_2', transform: false, visible: false });
  return { p, a1, a2 };
}

/** Beats 6–7: `A x =` with A and x as matrices. */
function axRow(s, visible = true) {
  const lhs = s.tex('A\\mathbf{x} =', { x: 95, y: 150, size: 44, visible });
  const m = s.matrix(AX, { x: 320, y: 150, size: 40, visible });
  const xv = s.matrix(XV.map((v) => [v]), { x: 530, y: 150, size: 40, visible });
  return { lhs, m, xv };
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'vectors-span',
  title: 'Vector equations and Ax = b',
  goals: [
    'Add and scale vectors, as arrows and as lists of numbers, and form linear combinations',
    'Read a span as every point you can reach, and test membership with one row reduction',
    'Compute Ax as a combination of the columns of A, and with the row–vector rule',
    'Use Theorem 4: the columns of A span ℝᵐ exactly when A has a pivot in every row',
  ],
  beats: [
    // 1
    {
      id: 'vectors-arrows',
      title: 'Vectors as arrows',
      scene(s) {
        const p = s.plane({ x: 650, y: 305, width: 440, range: [-3, 5, -1, 7], names: ['x_1', 'x_2'], visible: false });
        const ghost = p.vector(N(U), { color: C.muted, width: 3, visible: false });
        const u = p.vector(N(U), { color: C.blue, label: '\\mathbf{u}', visible: false });
        const v = p.vector(N(V), { color: C.red, label: '\\mathbf{v}', visible: false });
        const sum = p.vector(N(UV), { color: C.green, visible: false });
        const uTex = s.tex(`\\mathbf{u} = ${texVec(U)}`, { x: 200, y: 150, size: 44, color: C.blue, visible: false });
        const sumTex = s.tex(`\\col{blue}{${texVec(U)}} + \\col{red}{${texVec(V)}} = \\col{green}{${texVec(UV)}}`, { x: 210, y: 330, size: 36, visible: false });
        const half = s.tex(`\\tfrac{1}{2}\\mathbf{u} = ${texVec(scaleVec(F(1, 2), U))}`, { x: 200, y: 310, size: 40, color: C.blue, visible: false });
        const neg = s.tex(`-\\mathbf{v} = ${texVec(scaleVec(-1, V))}`, { x: 200, y: 450, size: 40, color: C.red, visible: false });
        return { p, ghost, u, v, sum, uTex, sumTex, half, neg };
      },
      steps: [
        {
          say: 'A vector in $\\mathbb{R}^2${R two} is a list of two numbers, like $(2, 4)${two, four}. We draw it as an arrow from the origin to that point.',
          do: async (s, o) => {
            await s.all(o.p.draw(), o.uTex.write({ delay: 300 }));
            await o.u.grow();
          },
        },
        {
          say: 'To add, go tip to tail: slide $\\mathbf{v}${v} so it starts where $\\mathbf{u}${u} ends. The arrow to the new tip is $\\mathbf{u} + \\mathbf{v}${u plus v}, and its entries are just the sums of the entries.',
          do: async (s, o) => {
            await o.v.grow({ duration: 700 });
            await o.p.addTip(o.u, o.v, { duration: 1000 });
            await s.all(o.sum.grow(), o.sumTex.write({ duration: 1100 }));
          },
        },
        {
          say: 'Scaling stretches. Half of $\\mathbf{u}${u} points the same way but is half as long, and $-\\mathbf{v}${minus v} flips around to point the other way.',
          do: async (s, o) => {
            await s.all(o.sum.fadeOut(), o.sumTex.fadeOut(), o.v.moveTail([0, 0], { duration: 700 }));
            o.ghost.show();
            o.u.setLabel('\\tfrac{1}{2}\\mathbf{u}');
            await s.all(o.u.moveTo(N(scaleVec(F(1, 2), U)), { duration: 1000 }), o.half.fadeIn());
            o.v.setLabel('-\\mathbf{v}');
            await s.all(o.v.moveTo(N(scaleVec(-1, V)), { duration: 1000 }), o.neg.fadeIn());
          },
        },
      ],
    },

    // 2
    {
      id: 'lin-comb',
      title: 'Linear combinations',
      scene(s) {
        const o = combPlane(s);
        o.g1 = o.p.vector(N(A1), { color: C.muted, width: 3, transform: false, visible: false });
        o.g2 = o.p.vector(N(A2), { color: C.muted, width: 3, transform: false, visible: false });
        o.sum = o.p.vector([0, 3], { color: C.green, transform: false, visible: false });
        o.pt = o.p.point(N(B2), { color: C.green, transform: false, visible: false });
        o.formula = s.tex('x_1\\col{blue}{\\mathbf{a}_1} + x_2\\col{red}{\\mathbf{a}_2}', { x: 210, y: 140, size: 44, visible: false });
        o.wts = s.tex('x_1 = 1,\\ \\ x_2 = 1', { x: 210, y: 230, size: 40, visible: false });
        o.res = s.tex(`${lin(W2, ['\\col{blue}{\\mathbf{a}_1}', '\\col{red}{\\mathbf{a}_2}'])} = \\col{green}{${tup(B2)}}`, { x: 210, y: 320, size: 40, visible: false });
        o.all = s.text('Every point of $\\mathbb{R}^2$ is some combination of $\\mathbf{a}_1, \\mathbf{a}_2$', { x: 210, y: 460, size: 30, width: 340, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Take two vectors, $\\mathbf{a}_1${a one} and $\\mathbf{a}_2${a two}. Scale each one by a weight and add: the result, $x_1\\mathbf{a}_1 + x_2\\mathbf{a}_2${x one a one plus x two a two}, is called a linear combination.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 900 }), o.formula.write({ delay: 300 }));
            await s.all(o.a1.grow({ duration: 700 }), o.a2.grow({ duration: 700, delay: 200 }));
            await s.all(o.g1.fadeIn({ shift: [0, 0] }), o.g2.fadeIn({ shift: [0, 0] }), o.wts.fadeIn());
            await o.p.addTip(o.a1, o.a2, { duration: 900 });
            await o.sum.grow({ duration: 700 });
          },
        },
        {
          say: 'Now slide the weights. With weights $2${two} and $1${one}, the tip lands exactly on $(1, 5)${one, five}.',
          do: async (s, o) => {
            const W = N(W2);
            await s.clock.tween({ duration: 2000, update: (k) => setWeights(o, 1 + (W[0] - 1) * k, 1 + (W[1] - 1) * k) });
            await s.all(o.pt.draw(), o.res.write());
          },
        },
        {
          say: 'Can we reach every point of the plane this way? Here, yes. Draw the grid of all combinations: its lines run along $\\mathbf{a}_1${a one} and $\\mathbf{a}_2${a two}, and together they cover the whole plane.',
          do: async (s, o) => {
            await o.p.applyMatrix(M2, { duration: 2000 });
            await o.all.fadeIn();
          },
        },
      ],
    },

    // 3
    {
      id: 'vector-equation',
      title: 'Same question, three ways',
      scene(s) {
        const colT = (v, j, c) => `\\col{${c}}{\\begin{bmatrix}${v.map((x, i) => `\\part{r${i}${j}}{${t(x)}}`).join(' \\\\ ')}\\end{bmatrix}}`;
        const vecEq = s.tex(`x_1${colT(A1, 0, 'blue')} + x_2${colT(A2, 1, 'red')} = ${colT(B2, 2, 'ink')}`, { x: 480, y: 105, size: 40, visible: false });
        const vb = vecEq.box();
        const band = (i) => {
          const r = union(...[0, 1, 2].map((j) => vecEq.partBox(`r${i}${j}`)));
          return { x: vb.x - 4, y: r.y - 2, w: vb.w + 8, h: r.h + 4 };
        };
        const bands = [band(0), band(1)];
        const box = s.surround(bands[0], { pad: 6, visible: false });
        const eqs = VEQ.map((row, i) => s.tex(`${lin(row.slice(0, 2), X2)} = ${t(row[2])}`, { x: 160, y: 275 + 70 * i, size: 38, visible: false }));
        const iff = s.tex('\\iff', { x: 354, y: 310, size: 34, color: C.muted, visible: false });
        const m = s.matrix(VEQ, { x: 565, y: 310, size: 40, augment: 2, visible: false });
        const lab = s.tex('[\\,\\col{blue}{\\mathbf{a}_1}\\ \\ \\col{red}{\\mathbf{a}_2} \\mid \\mathbf{b}\\,]', { x: 565, y: 200, size: 34, visible: false });
        const ans = s.tex(`x_1 = ${t(W2[0])},\\ \\ x_2 = ${t(W2[1])}`, { x: 480, y: 500, size: 44, color: C.green, visible: false });
        return { vecEq, bands, box, eqs, iff, m, lab, ans };
      },
      steps: [
        {
          say: 'Asking for the weights is an equation whose unknowns multiply vectors: a vector equation. Which $x_1${x one} and $x_2${x two} make this true?',
          do: (s, o) => o.vecEq.write({ duration: 1300 }),
        },
        {
          say: 'Read it one row at a time. The top entries say $x_1 - x_2 = 1${x one minus x two equals one}, and the bottom entries say $2x_1 + x_2 = 5${two x one plus x two equals five}. It\'s an ordinary system.',
          do: async (s, o) => {
            await o.box.draw();
            await o.eqs[0].write();
            await o.box.retarget(o.bands[1], { duration: 700 });
            await o.eqs[1].write();
            await o.box.fadeOut();
          },
        },
        {
          say: 'Its augmented matrix has the vectors themselves as columns: $[\\mathbf{a}_1\\ \\mathbf{a}_2 \\mid \\mathbf{b}]${a one, a two, augmented with b}.',
          do: async (s, o) => {
            await s.all(o.iff.fadeIn(), o.m.fadeIn());
            await s.all(o.m.highlightCol(0, C.blue), o.m.highlightCol(1, C.red, { delay: 200 }), o.lab.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'Row reduce, and the weights come out: $x_1 = 2${x one equals two} and $x_2 = 1${x two equals one}, exactly what the picture showed.',
          do: async (s, o) => {
            await o.m.clearHighlights();
            for (const st of VEQ_RED.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), o.m.highlightCol(2, C.green));
            await o.ans.write();
          },
        },
      ],
    },

    // 4
    {
      id: 'span-def',
      title: 'Span',
      scene(s) {
        const def = s.defCard({ x: 245, y: 32, anchor: [0.5, 0], width: 390, body: '$\\operatorname{Span}\\{\\mathbf{v}_1, \\dots, \\mathbf{v}_p\\}$ is the set of all linear combinations $c_1\\mathbf{v}_1 + \\cdots + c_p\\mathbf{v}_p$.', visible: false });
        const sp = s.space({ x: 690, y: 320, size: 400, range: 5, yaw: -100, pitch: 18, visible: false });
        const P = sp.plane(N(SU), N(SV), { color: C.blue, visible: false });
        const u = sp.vector(N(SU), { color: C.blue, label: '\\mathbf{u}', visible: false });
        const v = sp.vector(N(SV), { color: C.red, label: '\\mathbf{v}', visible: false });
        const w1 = sp.vector(N(scaleVec(W_IN[0], SU)), { color: C.blue, width: 3, visible: false });
        const w2 = sp.vector(N(scaleVec(W_IN[1], SV)), { color: C.red, width: 3, tail: N(scaleVec(W_IN[0], SU)), visible: false });
        const pin = sp.point(N(P_IN), { color: C.green, r: 10, visible: false });
        const pout = sp.point(N(P_OUT), { color: C.yellow, r: 10, visible: false });
        const inTex = s.tex(`\\col{green}{${tup(P_IN)}} = ${t(W_IN[0])}\\col{blue}{\\mathbf{u}} + ${t(W_IN[1])}\\col{red}{\\mathbf{v}}`, { x: 230, y: 340, size: 36, visible: false });
        const outTex = s.tex(`${tup(P_OUT)} \\notin \\operatorname{Span}\\{\\mathbf{u}, \\mathbf{v}\\}`, { x: 230, y: 430, size: 36, color: C.yellow, visible: false });
        return { def, sp, P, u, v, w1, w2, pin, pout, inTex, outTex };
      },
      steps: [
        {
          say: 'The span of a set of vectors is every linear combination of them: all the points you can reach using those vectors with any weights.',
          do: async (s, o) => {
            await s.all(o.def.reveal(), o.sp.draw());
            await s.all(o.u.grow(), o.v.grow({ delay: 200 }));
          },
        },
        {
          say: 'Two vectors in $\\mathbb{R}^3${R three} that aren\'t parallel span a plane through the origin. Turn it, and you can see it\'s flat.',
          do: async (s, o) => {
            await o.P.fadeIn({ shift: [0, 0] });
            await o.sp.orbit(60, 4000);
          },
        },
        {
          say: 'The point $(2, 3, 5)${two, three, five} is $2\\mathbf{u} + 3\\mathbf{v}${two u plus three v}, so it lies on the plane.',
          do: async (s, o) => {
            await o.w1.grow({ duration: 700 });
            await o.w2.grow({ duration: 700 });
            await s.all(o.pin.draw(), o.inTex.write());
          },
        },
        {
          say: 'But $(2, 3, 4)${two, three, four} sits just below it. Look along the plane: no weights reach that point, so it is not in the span.',
          do: async (s, o) => {
            await s.all(o.pout.draw(), o.outTex.write());
            await s.all(o.u.label.fadeOut(), o.v.label.fadeOut(), o.sp.rotate(30, 20, { duration: 1600 }));
            await o.pout.flash({ color: C.yellow });
          },
        },
      ],
    },

    // 5
    {
      id: 'try-span-plane',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Is this point in the span? Let the first two entries guide you.',
      prompt: `Let $\\mathbf{u} = ${tup(SU)}$ and $\\mathbf{v} = ${tup(SV)}$. Is $\\mathbf{b} = ${tup(P_OUT)}$ in $\\operatorname{Span}\\{\\mathbf{u}, \\mathbf{v}\\}$?`,
      answer: { type: 'choice', value: 'no' },
      choices: [
        { id: 'yes', label: 'Yes', why: `The first two entries force weights $${t(W_IN[0])}$ and $${t(W_IN[1])}$, and then the third entry must be $${t(P_IN[2])}$, not $${t(P_OUT[2])}$.` },
        { id: 'no', label: 'No', why: 'Right: the weights forced by the first two entries give the wrong third entry.' },
      ],
      hint: 'The first two entries pick the weights. Then check the third.',
      solution: [
        `We need $x_1\\mathbf{u} + x_2\\mathbf{v} = \\mathbf{b}$. Rows 1 and 2 say $x_1 = ${t(P_OUT[0])}$ and $x_2 = ${t(P_OUT[1])}$.`,
        `Row 3 says $x_1 + x_2 = ${t(P_OUT[2])}$, but those weights give $${t(P_OUT[0].add(P_OUT[1]))}$. Contradiction.`,
        `In matrix form, $[\\mathbf{u}\\ \\mathbf{v} \\mid \\mathbf{b}] = ${texMat(OUT_AUG, { augment: 2 })}$ has echelon form $${texMat(OUT_RED.echelon, { augment: 2 })}$, whose last row says $0 = ${t(OUT_RED.echelon[2][2])}$. So $\\mathbf{b}$ is **not** in the span.`,
      ],
    },

    // 6
    {
      id: 'ax-columns',
      title: 'A times x is a combination of columns',
      scene(s) {
        const o = axRow(s);
        const comb = s.tex(
          AX_COLS.map((c, j) => `\\part{w${j}}{${t(XV[j])}}\\part{c${j}}{\\col{${['blue', 'red', 'teal'][j]}}{${texVec(c)}}}`).join(' + '),
          { x: 480, y: 378, size: 44, visible: false },
        );
        o.comb = comb;
        o.wts = XV.map((w, j) => {
          const b = o.xv.cellBox(j, 0);
          const to = comb.partBox(`w${j}`);
          return { mob: s.tex(t(w), { x: b.cx, y: b.cy, size: 44, color: COLORS[j], visible: false }), to };
        });
        o.cols = AX_COLS.map((c, j) => {
          const b = o.m.colBox(j);
          const to = comb.partBox(`c${j}`);
          return { mob: s.tex(texVec(c), { x: b.cx, y: b.cy, size: 40, color: COLORS[j], visible: false }), to };
        });
        o.sum = s.tex(`= ${AX_TERMS.map(texVec).join(' + ')}`, { x: 420, y: 508, size: 40, visible: false });
        const sb = o.sum.box();
        o.res = s.tex(`= ${texVec(AX_OUT)}`, { x: sb.x + sb.w + 16, y: 508, size: 40, color: C.green, anchor: [0, 0.5], visible: false });
        const mb = o.m.box(), xb = o.xv.box();
        o.braceA = s.brace(mb.x + 10, mb.y + mb.h + 6, mb.x + mb.w - 10, mb.y + mb.h + 6, { label: '3\\text{ columns}', side: 'below', size: 30, visible: false });
        o.braceX = s.brace(xb.x + xb.w + 8, xb.y + 10, xb.x + xb.w + 8, xb.y + xb.h - 10, { label: '3\\text{ entries}', side: 'right', size: 30, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Lay defines $A\\mathbf{x}${A x} as a combination of the columns of $A${A}: the entries of $\\mathbf{x}${x} are the weights. Four of column one, three of column two, seven of column three.',
          do: async (s, o) => {
            await s.stagger([0, 1, 2].map((j) => () => s.all(o.m.highlightCol(j, COLORS[j]), o.xv.highlightRow(j, COLORS[j]))), 250);
            await s.wait(300);
            await s.all(
              [...o.wts, ...o.cols].map(({ mob, to }, k) => {
                mob.show();
                return mob.moveTo(to.cx, to.cy, { duration: 1100, delay: (k % 3) * 150 });
              }),
            );
            await s.all(o.comb.fadeIn({ shift: [0, 0], duration: 400 }), [...o.wts, ...o.cols].map(({ mob }) => mob.fadeOut({ duration: 400 })));
          },
        },
        {
          say: 'Scale each column, then add the vectors entry by entry. The result is $(3, 6)${three, six}.',
          do: async (s, o) => {
            await o.sum.write({ duration: 1200 });
            await o.res.write({ duration: 600 });
            await o.res.indicate({ color: C.green, keep: true });
          },
        },
        {
          say: 'So $A\\mathbf{x}${A x} only makes sense when $\\mathbf{x}${x} has one entry for each column of $A${A}. Three columns, three entries.',
          do: async (s, o) => {
            await o.braceA.draw();
            await o.braceX.draw();
          },
        },
      ],
    },

    // 7
    {
      id: 'row-vector-rule',
      title: 'The shortcut: row times vector',
      scene(s) {
        const o = axRow(s);
        o.eq = s.tex('=', { x: 610, y: 150, size: 44, visible: false });
        o.out = s.matrix([['\\square'], ['\\square']], { x: 700, y: 150, size: 40, visible: false });
        o.dots = [0, 1].map((i) => {
          const terms = AX[i].map((a, j) => `${a.sign() < 0 ? `(${t(a)})` : t(a)}\\cdot ${t(XV[j])}`).join(' + ');
          return s.tex(`${terms} = ${t(AX_OUT[i])}`, { x: 480, y: 345 + 90 * i, size: 40, visible: false });
        });
        o.check = s.tex(`\\text{same as } 4\\col{blue}{\\mathbf{a}_1} + 3\\col{red}{\\mathbf{a}_2} + 7\\col{teal}{\\mathbf{a}_3}\\ \\col{green}{\\checkmark}`, { x: 480, y: 540, size: 32, visible: false });
        o.thm5 = s.defCard({
          kind: 'theorem', title: 'Theorem 5', x: 480, y: 352, width: 860,
          body: 'If $A$ is an $m \\times n$ matrix, $\\mathbf{u}$ and $\\mathbf{v}$ are in $\\mathbb{R}^n$, and $c$ is a scalar, then (a) $A(\\mathbf{u} + \\mathbf{v}) = A\\mathbf{u} + A\\mathbf{v}$; (b) $A(c\\mathbf{u}) = c(A\\mathbf{u})$.',
          visible: false,
        });
        o.lin = s.tex(`A(2\\mathbf{x}) = A${tup(scaleVec(2, XV))} = \\col{green}{${tup(mulVec(AX, scaleVec(2, XV)))}} = 2(A\\mathbf{x})`, { x: 480, y: 500, size: 34, visible: false });
        o.links = [0, 1].map((i) =>
          [0, 1, 2].map((j) => {
            const a = o.m.cellBox(i, j), b = o.xv.cellBox(j, 0);
            return s.line(a.cx, a.cy + 14, b.cx - 14, b.cy, { color: C.yellow, width: 3, dash: '6 6', layer: 'front', visible: false });
          }),
        );
        return o;
      },
      steps: [
        {
          say: 'For hand computation there\'s a shortcut. Each entry of $A\\mathbf{x}${A x} pairs a row of $A${A} with $\\mathbf{x}${x}: multiply matching entries and add. Row one gives $4 + 6 - 7 = 3${four plus six minus seven, which is three}.',
          do: async (s, o) => {
            await s.all(o.eq.fadeIn(), o.out.fadeIn());
            await s.all(o.m.highlightRow(0, C.yellow), o.xv.highlightCol(0, C.yellow));
            await s.stagger(o.links[0].map((l) => () => l.draw({ duration: 500 })), 300);
            await o.dots[0].write({ duration: 1200 });
            await s.all(o.out.setEntry(0, 0, AX_OUT[0]), o.out.highlightCell(0, 0, C.green), o.links[0].map((l) => l.fadeOut()));
          },
        },
        {
          say: 'Row two gives $0 - 15 + 21 = 6${zero minus fifteen plus twenty one, which is six}.',
          do: async (s, o) => {
            await s.all(o.m.clearHighlights(), o.xv.clearHighlights());
            await s.all(o.m.highlightRow(1, C.yellow), o.xv.highlightCol(0, C.yellow));
            await s.stagger(o.links[1].map((l) => () => l.draw({ duration: 500 })), 300);
            await o.dots[1].write({ duration: 1200 });
            await s.all(o.out.setEntry(1, 0, AX_OUT[1]), o.out.highlightCell(1, 0, C.green), o.links[1].map((l) => l.fadeOut()));
          },
        },
        {
          say: 'Same answer as before. The columns tell you what $A\\mathbf{x}${A x} means; the rows are how you compute it.',
          do: async (s, o) => {
            await s.all(o.m.clearHighlights(), o.xv.clearHighlights());
            await o.check.fadeIn();
          },
        },
        {
          say: 'One more fact, Lay\'s Theorem 5: this product respects sums and scalar multiples. $A(\\mathbf{u} + \\mathbf{v}) = A\\mathbf{u} + A\\mathbf{v}${A times u plus v equals A u plus A v}, and $A(c\\mathbf{u}) = c(A\\mathbf{u})${A times c u equals c times A u}. Double $\\mathbf{x}${x}, and the answer doubles.',
          do: async (s, o) => {
            await s.all(o.dots.map((d) => d.fadeOut()), o.check.fadeOut(), o.out.clearHighlights());
            await o.thm5.reveal();
            await o.lin.write({ duration: 1200 });
          },
        },
      ],
    },

    // 8
    {
      id: 'fill-ax',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks. Use either view: rows against the vector, or a combination of the columns.',
      prompt: 'Compute the product, entry by entry.',
      lines: [[`${texMat(FILL_A)}${texVec(FILL_X)} = `, { matrix: FILL_OUT.map((v, i) => [{ id: `e${i + 1}`, answer: { type: 'number', value: String(v) } }]) }]],
      solution: [
        `Row by row: ${FILL_A.map((row, i) => `$${row.map((a, j) => `${a.sign() < 0 ? `(${t(a)})` : t(a)}(${t(FILL_X[j])})`).join(' + ')} = ${t(FILL_OUT[i])}$`).join(', ')}.`,
        `As a combination of columns: $${t(FILL_X[0])}${texVec(col(FILL_A, 0))} ${FILL_X[1].sign() < 0 ? '-' : '+'} ${t(FILL_X[1].abs())}${texVec(col(FILL_A, 1))} = ${texVec(FILL_OUT)}$.`,
      ],
    },

    // 9
    {
      id: 'three-views',
      title: 'One fact, three faces',
      scene(s) {
        const make = (tex, x, y, label) => {
          const m = s.tex(tex, { x, y, size: 34, visible: false });
          const b = m.box();
          const r = { x: b.x - 18, y: b.y - 12, w: b.w + 36, h: b.h + 24 };
          const box = s.rect(r.x, r.y, r.w, r.h, { color: C.muted, width: 2, radius: 14, visible: false });
          const lab = s.text(label, { x, y: r.y + r.h + 24, size: 30, color: C.muted, visible: false });
          return { m, box, lab, r };
        };
        const top = make('A\\mathbf{x} = \\mathbf{b}', 480, 100, 'matrix equation');
        const left = make('x_1\\mathbf{a}_1 + \\cdots + x_n\\mathbf{a}_n = \\mathbf{b}', 250, 330, 'vector equation');
        const right = make('[\\,\\mathbf{a}_1\\ \\cdots\\ \\mathbf{a}_n \\mid \\mathbf{b}\\,]', 740, 330, 'augmented matrix');
        const link = (p, q) => [s.arrow(...p, ...q, { color: C.muted, width: 3, visible: false }), s.arrow(...q, ...p, { color: C.muted, width: 3, visible: false })];
        const T = top.r, L = left.r, R = right.r;
        const links = [
          link([T.x + 20, T.y + T.h + 50], [L.x + L.w / 2, L.y - 12]),
          link([T.x + T.w - 20, T.y + T.h + 50], [R.x + R.w / 2, R.y - 12]),
          link([L.x + L.w + 12, L.y + L.h / 2], [R.x - 12, R.y + R.h / 2]),
        ];
        const same = s.text('same solution set', { x: 480, y: 255, size: 30, color: C.ink, visible: false });
        const thm = s.tex('A\\mathbf{x} = \\mathbf{b} \\text{ has a solution} \\iff \\mathbf{b} \\in \\operatorname{Span}\\{\\mathbf{a}_1, \\dots, \\mathbf{a}_n\\}', { x: 480, y: 520, size: 34, color: C.green, visible: false });
        return { top, left, right, links, same, thm };
      },
      steps: [
        {
          say: 'Here\'s the same question in three costumes: the matrix equation, the vector equation, and the augmented matrix. They all have exactly the same solutions. That\'s Theorem 3.',
          do: async (s, o) => {
            for (const v of [o.top, o.left, o.right]) await s.all(v.box.draw({ duration: 600 }), v.m.write({ duration: 700 }), v.lab.fadeIn({ delay: 300 }));
            await s.all(o.links.flat().map((a) => a.draw({ duration: 600 })), o.same.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'So "$A\\mathbf{x} = \\mathbf{b}${A x equals b} has a solution" means exactly "$\\mathbf{b}${b} is in the span of the columns of $A${A}".',
          do: async (s, o) => {
            await s.all(o.top.m.indicate(), o.left.m.indicate({ delay: 300 }));
            await o.thm.write({ duration: 1300 });
          },
        },
      ],
    },

    // 10
    {
      id: 'theorem-4',
      title: 'When do the columns fill ℝᵐ?',
      scene(s) {
        const head = s.text('**Theorem 4.** Let $A$ be an $m \\times n$ matrix. These statements are all true or all false:', { x: 480, y: 80, size: 30, width: 860, align: 'left', visible: false });
        const items = [
          '(a) For each $\\mathbf{b}$ in $\\mathbb{R}^m$, $A\\mathbf{x} = \\mathbf{b}$ has a solution.',
          '(b) Each $\\mathbf{b}$ in $\\mathbb{R}^m$ is a linear combination of the columns of $A$.',
          '(c) The columns of $A$ span $\\mathbb{R}^m$.',
          '(d) $A$ has a pivot position in every row.',
        ].map((str, i) => s.text(str, { x: 80, y: 160 + 62 * i, size: 30, anchor: [0, 0.5], visible: false }));
        const coef = s.text('$A$ is the coefficient matrix, not $[A \\mid \\mathbf{b}]$', { x: 480, y: 480, size: 32, color: C.yellow, visible: false });
        const m = s.matrix(T4, { x: 250, y: 320, size: 44, visible: false });
        const none = s.text('no pivot in row 3', { x: 250, y: 500, size: 30, color: C.yellow, visible: false });
        const sp = s.space({ x: 730, y: 320, size: 330, range: 7, yaw: 0, pitch: 22, visible: false });
        const [c0, c1] = [N(col(T4, 0)), N(col(T4, 1))];
        const normal = [c0[1] * c1[2] - c0[2] * c1[1], c0[2] * c1[0] - c0[0] * c1[2], c0[0] * c1[1] - c0[1] * c1[0]];
        const P = sp.plane({ normal, d: 0 }, { color: C.muted, extent: 5, visible: false });
        const cs = [0, 1, 2].map((j) => sp.vector(N(col(T4, j)), { color: COLORS[j], width: 4, visible: false }));
        const planeLab = s.text('the columns span only a plane', { x: 712, y: 545, size: 30, visible: false });
        return { head, items, coef, m, none, sp, P, cs, planeLab };
      },
      steps: [
        {
          say: 'For an $m \\times n${m by n} matrix $A${A}, these four statements are either all true or all false. The first three say the columns reach every vector in $\\mathbb{R}^m${R m}; the fourth is a test you can run.',
          do: async (s, o) => {
            await o.head.fadeIn();
            await s.stagger(o.items.map((it) => () => it.fadeIn({ shift: [-14, 0] })), 600);
          },
        },
        {
          say: 'The last one is the test you can actually run: a pivot in every row of $A${A}, the coefficient matrix, not the augmented one.',
          do: async (s, o) => {
            await o.items[3].indicate({ keep: true });
            await o.coef.fadeIn();
          },
        },
        {
          say: 'Here\'s one that fails. Reduce it, and row three runs out of pivots: a zero row. So some $\\mathbf{b}${b} can\'t be reached.',
          do: async (s, o) => {
            await s.all(o.head.fadeOut(), o.items.slice(0, 3).map((it) => it.fadeOut()), o.coef.fadeOut());
            await s.all(o.items[3].moveTo(80, 70), o.m.fadeIn());
            for (const st of T4_FWD) await o.m.rowOp(st);
            await s.all(o.m.note(), o.m.pivot(0, 0), o.m.pivot(1, 1));
            await s.all(o.m.highlightRow(2, C.yellow), o.none.fadeIn());
          },
        },
        {
          say: 'In space you can see why: all three columns lie in one plane, so their combinations never leave it.',
          do: async (s, o) => {
            await o.sp.draw();
            await s.stagger(o.cs.map((c) => () => c.grow({ duration: 700 })), 400);
            await s.all(o.P.fadeIn({ shift: [0, 0] }), o.planeLab.fadeIn());
            await o.sp.orbit(50, 3500);
          },
        },
      ],
    },

    // 11
    {
      id: 'mistake-augmented',
      title: 'The trap: checking the wrong matrix',
      scene(s) {
        const m = s.matrix(TRAP_AUG, { x: 250, y: 150, size: 44, augment: 2 });
        const wrong = s.tex('\\text{pivot in every row} \\Rightarrow \\text{columns span } \\mathbb{R}^2', { x: 480, y: 330, size: 34, visible: false });
        const right = s.tex(`0 = ${t(TRAP_ECH[1][2])}:\\ \\text{inconsistent, this } \\mathbf{b} \\text{ is unreachable}`, { x: 480, y: 410, size: 34, color: C.yellow, visible: false });
        const aLab = s.tex('A \\text{ alone}', { x: 720, y: 262, size: 32, color: C.muted, visible: false });
        const a = s.matrix(TRAP_A_ECH, { x: 720, y: 150, size: 44, visible: false });
        const fin = s.tex('\\text{row 2 of } A \\text{ has no pivot} \\Rightarrow \\text{the columns do not span } \\mathbb{R}^2', { x: 480, y: 500, size: 30, color: C.green, visible: false });
        return { m, wrong, right, aLab, a, fin };
      },
      steps: [
        {
          say: 'Here\'s the trap. This augmented matrix reduces to a pivot in every row, so it\'s tempting to say the columns span $\\mathbb{R}^2${R two}.',
          do: async (s, o) => {
            for (const st of TRAP_FWD) await o.m.rowOp(st);
            await s.all(o.m.pivot(0, 0), o.m.pivot(1, 2, { color: C.yellow }));
            o.box = s.surround(o.m.colBox(2), { pad: 8, visible: false });
            await s.all(o.box.draw(), o.wrong.write());
          },
        },
        {
          say: 'But a pivot in the last column of $[A \\mid \\mathbf{b}]${A augmented with b} means the system is inconsistent: this $\\mathbf{b}${b} can\'t be reached at all. That\'s the opposite of spanning.',
          do: async (s, o) => {
            await s.strike(o.wrong, { color: C.yellow });
            await o.right.write();
          },
        },
        {
          say: 'Theorem 4 is about $A${A} alone. Cover up the last column, and row two of $A${A} has no pivot. The columns do not span.',
          do: async (s, o) => {
            await s.all(o.m.note(), o.box.fadeOut());
            await s.all(o.aLab.fadeIn(), o.a.fadeIn());
            await s.all(o.a.pivot(0, 0), o.a.highlightRow(1, C.yellow));
            await o.fin.write();
          },
        },
      ],
    },

    // 12
    {
      id: 'try-theorem4',
      kind: 'try',
      title: 'Your turn',
      say: 'Think in terms of pivots. Can these columns fill up all of three-dimensional space?',
      prompt: '$A$ is a $3 \\times 2$ matrix. Can the columns of $A$ span $\\mathbb{R}^3$?',
      answer: { type: 'choice', value: 'no' },
      choices: [
        { id: 'yes-if', label: 'Yes, if the columns aren\'t parallel', why: 'Two non-parallel vectors span a plane, and a plane is not all of $\\mathbb{R}^3$.' },
        { id: 'no', label: 'No, never', why: 'Right: two columns give at most two pivots, but three rows need three.' },
        { id: 'depends-b', label: 'It depends on $\\mathbf{b}$', why: 'Spanning is about every $\\mathbf{b}$ at once; a single $\\mathbf{b}$ only asks whether one system is consistent.' },
      ],
      hint: 'How many pivots can a matrix with two columns have?',
      solution: [
        'Each pivot sits in its own column, so a matrix with $2$ columns has at most $2$ pivots.',
        'Theorem 4 needs a pivot in every row, and $A$ has $3$ rows. So some row has no pivot, and the columns cannot span $\\mathbb{R}^3$.',
        'Geometrically: two vectors span at most a plane through the origin.',
      ],
    },

    // 13
    {
      id: 'wo-in-span',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Decide whether this vector is a combination of the other two, and if it is, find the weights.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateInSpan,
    },

    // 14
    {
      id: 'cp-span',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this connection in your own words.',
      prompt: 'Why does $A\\mathbf{x} = \\mathbf{b}$ have a solution exactly when $\\mathbf{b}$ is in the span of the columns of $A$?',
      points: [
        '$A\\mathbf{x}$ is defined as $x_1\\mathbf{a}_1 + \\cdots + x_n\\mathbf{a}_n$, a linear combination of the columns',
        'A solution $\\mathbf{x}$ is a list of weights whose combination of the columns equals $\\mathbf{b}$',
        'So a solution exists if and only if some combination of the columns equals $\\mathbf{b}$, which is what "$\\mathbf{b}$ is in the span" means',
        'The entries of $\\mathbf{x}$ are exactly the weights',
      ],
    },

    // 15
    {
      id: 'summary-span',
      title: 'Summary',
      scene(s) {
        const o = combPlane(s, { x: 290, y: 300, width: 400, visible: false });
        o.lines = [
          '$A\\mathbf{x}$ is a combination of the columns of $A$, with weights from $\\mathbf{x}$.',
          '$A\\mathbf{x} = \\mathbf{b}$ is solvable exactly when $\\mathbf{b}$ is in the span of the columns.',
          'A pivot in every row of $A$: solvable for every $\\mathbf{b}$.',
        ].map((str, i) => s.text(str, { x: 710, y: 130 + 155 * i, size: 30, width: 390, align: 'left', visible: false }));
        return o;
      },
      steps: [
        {
          say: '$A\\mathbf{x}${A x} combines the columns of $A${A}, with the entries of $\\mathbf{x}${x} as weights.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 800 }), o.a1.grow({ delay: 400 }), o.a2.grow({ delay: 600 }));
            await o.lines[0].fadeIn();
          },
        },
        {
          say: 'So $A\\mathbf{x} = \\mathbf{b}${A x equals b} is solvable exactly when $\\mathbf{b}${b} is in the span of the columns.',
          do: async (s, o) => {
            await o.p.applyMatrix(M2, { duration: 1600 });
            await o.lines[1].fadeIn();
          },
        },
        {
          say: 'And a pivot in every row of $A${A} means it\'s solvable for every $\\mathbf{b}${b}: the columns fill the whole space. Next, we ask when a set of vectors has no redundancy.',
          do: (s, o) => o.lines[2].fadeIn(),
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------- step helpers

/** Beat 2: weights (x1, x2) → the two scaled vectors tip to tail and their green sum. */
function setWeights(o, x1, x2) {
  const a = N(A1), b = N(A2);
  const p1 = [x1 * a[0], x1 * a[1]];
  o.a1.setCoords(p1).setLabel(`${x1 === 1 ? '' : fmt(x1)}\\mathbf{a}_1`);
  o.a2.setTail(p1).setCoords([x2 * b[0], x2 * b[1]]).setLabel(`${x2 === 1 ? '' : fmt(x2)}\\mathbf{a}_2`);
  o.sum.setCoords([p1[0] + x2 * b[0], p1[1] + x2 * b[1]]);
  o.wts.setTex(`x_1 = ${fmt(x1)},\\ \\ x_2 = ${fmt(x2)}`);
}
