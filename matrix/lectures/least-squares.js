/**
 * Lecture 25 · Least-squares problems (Lay 6.5). Design: matrix/PLAN.md § 25.
 * Every matrix, normal equation, solution and residual below is computed with core/linalg.js (exact fractions).
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { ease } from '../../lectern/src/core/tween.js';
import { mat, vec, mul, mulVec, transpose, subVec, dot, norm2, rref, solve, leastSquares, gramSchmidt, texMat, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;
const num = (v) => v.map(Number);
const colTex = (v) => texMat(v.map((x) => [x]));

/** The running example: the points (0, 6), (1, 0), (2, 0) and the line y = β0 + β1 x. */
const PTS = [[0, 6], [1, 0], [2, 0]];
const A = mat(PTS.map(([x]) => [1, x]));
const B = vec(PTS.map(([, y]) => y));
const AT = transpose(A);
const ATA = mul(AT, A);
const ATB = mulVec(AT, B);
const LS = leastSquares(A, B);
const XHAT = LS.x; // (5, -3)
const BHAT = mulVec(A, XHAT);
const RES = subVec(B, BHAT); // (1, -2, 1)
const ERR2 = norm2(RES); // 6
const NORMAL_RED = rref(ATA.map((row, i) => [...row, ATB[i]]), { augmented: 1 });
const INCONSISTENT = solve(A, B).kind === 'none';
/** Normal of Col A (cross product of the columns), for the plane patch. */
const [CA1, CA2] = [AT[0], AT[1]].map(num);
const NCOL = [CA1[1] * CA2[2] - CA1[2] * CA2[1], CA1[2] * CA2[0] - CA1[0] * CA2[2], CA1[0] * CA2[1] - CA1[1] * CA2[0]];

/** Beat 6: dependent columns, a whole line of least-squares solutions. */
const AD = mat([[1, 2], [1, 2], [1, 2]]);
const LSD = leastSquares(AD, B); // infinite: particular + t·basis
const BHAT_D = mulVec(AD, LSD.particular);

/** Beat 7: the line through the first two points only. */
const DROP = solve(mat([[1, 0], [1, 1]]), vec([6, 0])).x; // y = 6 − 6x
const DROP_RES = subVec(B, mulVec(A, DROP));
const DROP_ERR2 = norm2(DROP_RES);

/** Beat 5 (try): AᵀA for a small matrix, and the AAᵀ trap. */
const TN = mat([[1, 1], [1, -1], [1, 1]]);
const TN_ATA = mul(transpose(TN), TN);
const TN_AAT = mul(TN, transpose(TN));

/** Beat 8 (blanks): least-squares line for (0,1), (1,1), (2,2), (3,2). */
const BL = [[0, 1], [1, 1], [2, 2], [3, 2]];
const BX = mat(BL.map(([x]) => [1, x]));
const BY = vec(BL.map(([, y]) => y));
const BXTX = mul(transpose(BX), BX);
const BXTY = mulVec(transpose(BX), BY);
const BBETA = leastSquares(BX, BY).x;

// ---------------------------------------------------------------- workout

const sqrtTex = (n) => {
  let a = 1, b = n;
  for (let k = 2; k * k <= b; k++) while (b % (k * k) === 0) {
    b /= k * k;
    a *= k;
  }
  return b === 1 ? `${a}` : `${a === 1 ? '' : a}\\sqrt{${b}}`;
};
const lineTex = (beta) => {
  const [b0, b1] = beta.map((x) => F(x));
  const slope = b1.zero ? '' : `${b1.abs().eq(1) ? '' : t(b1.abs())}x`;
  if (b0.zero) return `y = ${b1.zero ? '0' : `${b1.sign() < 0 ? '-' : ''}${slope}`}`;
  return `y = ${t(b0)}${b1.zero ? '' : ` ${b1.sign() < 0 ? '-' : '+'} ${slope}`}`;
};

/** k/√n (k a Frac, n a positive integer), simplified to c√b. */
function surd(k, n) {
  k = F(k);
  if (k.zero) return '0';
  let a = 1, b = n;
  for (let q = 2; q * q <= b; q++) while (b % (q * q) === 0) {
    b /= q * q;
    a *= q;
  }
  const c = k.mul(a).div(n); // k/√n = k·a√b/n
  if (b === 1) return t(c);
  return `${c.eq(1) ? '' : c.eq(-1) ? '-' : t(c)}\\sqrt{${b}}`;
}

/** Theorem 15 on the running example: Gram–Schmidt on the columns of A gives Q, R; Rx̂ = Qᵀb. */
const QR_V = gramSchmidt(AT);
const QR_N = QR_V.map((v) => Number(norm2(v)));
const QR_R_TEX = `\\begin{bmatrix}${QR_V.map((v, i) => AT.map((a, j) => (j < i ? '0' : surd(dot(v, a), QR_N[i]))).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
const QR_QTB_TEX = `\\begin{bmatrix}${QR_V.map((v, i) => surd(dot(v, B), QR_N[i])).join(' \\\\ ')}\\end{bmatrix}`;
/** Row i of Rx̂ = Qᵀb times ‖vᵢ‖ is rational: (vᵢ·aⱼ) x̂ = vᵢ·b for j ≥ i. Solved exactly. */
const QR_X = solve(QR_V.map((v, i) => AT.map((a, j) => (j < i ? F(0) : dot(v, a)))), QR_V.map((v) => dot(v, B))).x;

/** Worked row reduction of [M | v]: every operation with the matrix it produces (markdown). */
function rowSteps(M, v) {
  const aug = M.map((row, i) => [...row, v[i]]);
  const n = M[0].length;
  const red = rref(aug, { augmented: 1 });
  return `Row reduce $${texMat(aug, { augment: n })}$: ${red.steps.map((st) => `$${texRowOp(st)}$ gives $${texMat(st.after, { augment: n })}$`).join('; ')}.`;
}

function lineItem(pts) {
  const X = mat(pts.map(([x]) => [1, x]));
  const y = vec(pts.map(([, v]) => v));
  const XT = transpose(X);
  const XTX = mul(XT, X), XTY = mulVec(XT, y);
  const beta = leastSquares(X, y).x;
  const res = subVec(y, mulVec(X, beta));
  const e2 = Number(norm2(res));
  return {
    prompt: `Find the least-squares line $y = \\beta_0 + \\beta_1 x$ for the points ${pts.map(([a, b]) => `$(${a}, ${b})$`).join(', ')}. Enter $(\\beta_0, \\beta_1)$.`,
    answer: { type: 'vector', value: beta.map(String) },
    hints: [
      `The design matrix and observations: $X = ${texMat(X)}$, $\\mathbf{y} = ${tup(y)}$.`,
      `$X^TX = ${texMat(XTX)}$ and $X^T\\mathbf{y} = ${colTex(XTY)}$. Solve the normal equations.`,
    ],
    solution: [
      `With $X = ${texMat(X)}$ and $\\mathbf{y} = ${tup(y)}$, the normal equations $X^TX\\boldsymbol\\beta = X^T\\mathbf{y}$ are $${t(XTX[0][0])}\\beta_0 + ${t(XTX[0][1])}\\beta_1 = ${t(XTY[0])}$ and $${t(XTX[1][0])}\\beta_0 + ${t(XTX[1][1])}\\beta_1 = ${t(XTY[1])}$.`,
      `Solve by row reduction. ${rowSteps(XTX, XTY)} So $\\beta_0 = ${t(beta[0])}$, $\\beta_1 = ${t(beta[1])}$, and the line is $${lineTex(beta)}$.`,
      `Residual $\\mathbf{y} - X\\boldsymbol\\beta = ${tup(res)}$; it is orthogonal to both columns of $X$, and the least-squares error is $${e2 ? sqrtTex(e2) : '0'}$.`,
    ],
  };
}
const WO = lineItem([[0, 2], [1, 0], [2, 4]]);

/** x = 0, 1, 2; y = β0 + β1 x + k(1, −2, 1): the residual is orthogonal to the columns, so the answer is exactly β. */
function generateLine(rand) {
  for (;;) {
    const b0 = rand.int(-3, 4), b1 = rand.nonzero(-3, 3), k = rand.nonzero(-2, 2);
    const pts = [0, 1, 2].map((x, i) => [x, b0 + b1 * x + k * [1, -2, 1][i]]);
    if (pts.some(([, y]) => Math.abs(y) > 12)) continue;
    return lineItem(pts);
  }
}

// ---------------------------------------------------------------- shared scene builders

function paint(tex, name, color) {
  for (const el of tex.part(name)) el.style.color = color;
  return tex;
}
const checked = (s, tex, opts) => paint(s.tex(`${tex}\\ \\part{ck}{\\checkmark}`, opts), 'ck', C.green);
const appear = (mob, opts = {}) => mob.fadeIn({ shift: [0, 0], ...opts });
const seg3 = (sp, a, b, opts = {}) =>
  sp.vector(num(b).map((x, i) => x - Number(a[i])), { tail: num(a), head: 0, width: 3, dash: '8 7', color: C.yellow, ...opts });

/** The scatter plot (beats 1, 4, 7, 12): plane, the three data points. */
function scatter(s, show = [], { x = 680, y = 300, width = 400, height = 500 } = {}) {
  const on = (k) => show.includes(k);
  const p = s.plane({ x, y, width, height, range: [-1, 3.5, -7, 8], labelStep: 2, names: ['x', 'y'], visible: on('p') });
  const dots = PTS.map((q) => p.point(q, { color: C.blue, r: 10, visible: on('dots') }));
  const at = (q) => p.toStage(q);
  return { p, dots, at };
}
/** Line y = c0 + c1 x on the scatter plane. */
const fitLine = (p, [c0, c1], opts) => p.line({ a: -Number(c1), b: 1, c: Number(c0) }, opts);

/** Vertical residual segments (data point → line) and their squares, in stage coordinates. */
function residuals(s, sc, beta, { color = C.yellow, side = 1 } = {}) {
  return PTS.map(([x, y]) => {
    const yl = Number(beta[0]) + Number(beta[1]) * x;
    const [sx, sy0] = sc.at([x, y]);
    const [, sy1] = sc.at([x, yl]);
    const L = Math.abs(sy1 - sy0);
    const seg = s.line(sx, sy0, sx, sy1, { color, width: 4, visible: false });
    const sq = s.rect(side > 0 ? sx + 3 : sx - L - 3, Math.min(sy0, sy1), L, L, { color, width: 2, fill: s.FILL.yellow, visible: false });
    return { seg, sq, r: y - yl };
  });
}

/** The 3D picture (beats 2, 12): Col A, b, its projection, the residual. */
function colPicture(s, show = [], { x = 690, y = 320, size = 400 } = {}) {
  const on = (k) => show.includes(k);
  const sp = s.space({ x, y, size, range: 6, yaw: -117, pitch: 20, names: null, visible: on('sp') });
  const W = sp.plane({ normal: NCOL, d: 0 }, { center: num(BHAT).map((v) => v / 2), extent: 4, color: C.teal, visible: on('W') });
  const colLab = sp.label([-2, 0, 2], '\\operatorname{Col}A', { color: C.teal, size: 32, visible: on('W') });
  const bv = sp.vector(num(B), { color: C.blue, label: '\\mathbf{b}', visible: on('b') });
  const drop = seg3(sp, B, BHAT, { visible: on('drop') });
  const bh = sp.vector(num(BHAT), { color: C.green, label: 'A\\hat{\\mathbf{x}}', labelSize: 32, visible: on('bh') });
  return { sp, W, colLab, bv, drop, bh };
}

const NORMAL_CHAIN = [
  '\\mathbf{a}_j\\cdot(\\mathbf{b} - A\\hat{\\mathbf{x}}) = 0',
  'A^T(\\mathbf{b} - A\\hat{\\mathbf{x}}) = \\mathbf{0}',
  'A^TA\\hat{\\mathbf{x}} = A^T\\mathbf{b}',
];

// ---------------------------------------------------------------- the lecture

export default {
  id: 'least-squares',
  title: 'Least-squares problems',
  goals: [
    'Read a least-squares solution as the x that makes Ax as close to b as possible',
    'Derive and solve the normal equations AᵀAx = Aᵀb, and compute the least-squares error',
    'Know when the least-squares solution is unique, and fit a least-squares line to data',
  ],
  beats: [
    // 1
    {
      id: 'no-solution',
      title: 'When Ax = b has no solution',
      scene(s) {
        const o = scatter(s);
        o.labels = PTS.map((q) => o.p.label(q, `(${q[0]}, ${q[1]})`, { size: 30, offset: [q[0] === 0 ? 60 : 44, q[1] ? 0 : -30], visible: false }));
        o.tries = [[0, 1], [1, 2], [0, 2]].map(([i, j]) => {
          const [x1, y1] = PTS[i], [x2, y2] = PTS[j];
          const m = (y2 - y1) / (x2 - x1);
          return fitLine(o.p, [y1 - m * x1, m], { color: C.yellow, width: 3, visible: false });
        });
        o.misses = [2, 0, 1].map((k) => s.surround({ ...(([sx, sy]) => ({ x: sx - 16, y: sy - 16, w: 32, h: 32 }))(o.at(PTS[k])) }, { color: C.red, pad: 4, radius: 16, visible: false }));
        o.eqs = PTS.map(([x, y], i) => s.tex(`\\beta_0 + ${x}\\,\\beta_1 = ${y}`, { x: 230, y: 110 + 60 * i, size: 34, visible: false }));
        o.mat = s.tex(`${texMat(A)}\\begin{bmatrix}\\beta_0\\\\ \\beta_1\\end{bmatrix} = ${colTex(B)}`, { x: 230, y: 360, size: 34, visible: false });
        o.lab = s.tex('A\\mathbf{x} = \\mathbf{b}\\ \\text{inconsistent}', { x: 230, y: 490, size: 32, color: C.red, visible: false });
        o.goal = s.tex('\\text{make } \\|\\mathbf{b} - A\\mathbf{x}\\| \\text{ small}', { x: 230, y: 490, size: 34, color: C.green, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Here are three data points. Is there a line through all three? Try a line through any two of them, and it misses the third.',
          do: async (s, o) => {
            await o.p.draw();
            await s.stagger(o.dots.map((d, i) => () => s.all(d.draw(), o.labels[i].draw())), 300);
            for (let k = 0; k < 3; k++) {
              await o.tries[k].draw({ duration: 700 });
              await o.misses[k].draw({ duration: 450 });
              await s.all(o.tries[k].fadeOut({ delay: 300 }), o.misses[k].fadeOut({ delay: 300 }));
            }
          },
        },
        {
          say: 'As a system: a line $y = \\beta_0 + \\beta_1 x${y equals beta zero plus beta one x} through each point gives one equation per point. That\'s $A\\mathbf{x} = \\mathbf{b}${A x equals b}, with unknowns $\\beta_0${beta zero} and $\\beta_1${beta one}, and it is inconsistent.',
          do: async (s, o) => {
            await s.stagger(o.eqs.map((e) => () => e.write({ duration: 700 })), 500);
            await o.mat.write({ duration: 1100 });
            await o.lab.fadeIn();
          },
        },
        {
          say: 'So we change the question. If we can\'t make $A\\mathbf{x}${A x} equal $\\mathbf{b}${b}, let\'s make it as close to $\\mathbf{b}${b} as possible.',
          do: async (s, o) => {
            await o.lab.fadeOut();
            await o.goal.write();
            await o.goal.indicate({ color: C.green });
          },
        },
      ],
    },

    // 2
    {
      id: 'geometry',
      title: 'The geometry: project b onto Col A',
      scene(s) {
        const o = colPicture(s);
        o.l1 = s.tex('A\\mathbf{x} \\in \\operatorname{Col}A', { x: 210, y: 130, size: 38, color: C.teal, visible: false });
        o.l2 = s.tex('A\\hat{\\mathbf{x}} = \\operatorname{proj}_{\\operatorname{Col}A}\\mathbf{b}', { x: 210, y: 230, size: 34, color: C.green, visible: false });
        o.l2n = s.tex(`= ${tup(BHAT)}`, { x: 210, y: 290, size: 34, color: C.green, visible: false });
        o.l3 = s.tex('\\mathbf{b} - A\\hat{\\mathbf{x}} \\perp \\operatorname{Col}A', { x: 210, y: 390, size: 34, color: C.yellow, visible: false });
        o.l3n = s.tex(`\\mathbf{b} - A\\hat{\\mathbf{x}} = ${tup(RES)}`, { x: 210, y: 450, size: 32, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Picture it in $\\mathbb{R}^3${R three}. Whatever $\\mathbf{x}${x} you choose, $A\\mathbf{x}${A x} is a combination of the columns of $A${A}, so it lives in the column space: here, a plane. And $\\mathbf{b}${b} sticks out of that plane.',
          do: async (s, o) => {
            await o.sp.draw();
            await s.all(appear(o.W), appear(o.colLab), o.l1.write());
            await o.bv.grow();
          },
        },
        {
          say: 'The closest point of the plane to $\\mathbf{b}${b} is its orthogonal projection. Call it $A\\hat{\\mathbf{x}}${A x hat}. Here it is $(5, 2, -1)${five, two, minus one}.',
          do: async (s, o) => {
            await o.drop.grow({ duration: 900 });
            await s.all(o.bh.grow(), o.l2.write());
            await o.l2n.fadeIn();
          },
        },
        {
          say: 'The leftover, $\\mathbf{b} - A\\hat{\\mathbf{x}}${b minus A x hat}, is called the residual. It drops straight down, orthogonal to the whole column space. That one fact gives us the equations to solve.',
          do: async (s, o) => {
            await s.all(o.drop.indicate({ color: C.yellow }), o.l3.write());
            await o.l3n.fadeIn();
            await o.sp.orbit(25, 3500);
          },
        },
      ],
    },

    // 3
    {
      id: 'normal-eq',
      title: 'The normal equations',
      scene(s) {
        const o = {};
        o.chain = NORMAL_CHAIN.map((tx, i) => s.tex(tx, { x: 220, y: [100, 235, 355][i], size: i === 2 ? 40 : 32, visible: false }));
        o.each = s.text('for each column $\\mathbf{a}_j$ of $A$', { x: 220, y: 145, size: 30, color: C.muted, visible: false });
        o.arrows = [0, 1].map((i) => s.tex('\\Downarrow', { x: 220, y: [192, 292][i], size: 30, color: C.muted, visible: false }));
        o.box = s.surround(o.chain[2], { color: C.green, visible: false });
        o.nums = s.tex(`A^TA = ${texMat(ATA)},\\quad A^T\\mathbf{b} = ${colTex(ATB)}`, { x: 690, y: 110, size: 30, visible: false });
        o.m = s.matrix(ATA.map((row, i) => [...row, ATB[i]]), { x: 600, y: 300, size: 42, augment: 2, visible: false });
        o.xhat = s.tex(`\\hat{\\mathbf{x}} = ${colTex(XHAT)}`, { x: 690, y: 470, size: 38, color: C.green, visible: false });
        o.line = s.tex(`${lineTex(XHAT)}`, { x: 240, y: 470, size: 38, color: C.green, visible: false });
        return o;
      },
      steps: [
        {
          say: 'How do we find $\\hat{\\mathbf{x}}${x hat}? The residual is orthogonal to the column space, so it is orthogonal to each column of $A${A}.',
          do: async (s, o) => {
            await o.chain[0].write({ duration: 1200 });
            await o.each.fadeIn();
          },
        },
        {
          say: 'Each column dotted with the residual is zero. Stack those dot products as rows, and you get $A^T${A transpose} times the residual equals zero.',
          do: async (s, o) => {
            await o.arrows[0].fadeIn();
            await o.chain[1].write();
          },
        },
        {
          say: 'Multiply it out and rearrange: $A^TA\\hat{\\mathbf{x}} = A^T\\mathbf{b}${A transpose A x hat equals A transpose b}. These are the normal equations, Theorem 13, and they\'re always a square system, which is always consistent.',
          do: async (s, o) => {
            await o.arrows[1].fadeIn();
            await o.chain[2].write();
            await o.box.draw();
          },
        },
        {
          say: 'For our data, $A^TA${A transpose A} is three, three, three, five, and $A^T\\mathbf{b}${A transpose b} is six, zero. Row reduce, and $\\hat{\\mathbf{x}} = (5, -3)${x hat equals five, minus three}: the line $y = 5 - 3x${y equals five minus three x}.',
          do: async (s, o) => {
            await o.nums.write({ duration: 1100 });
            await o.m.fadeIn();
            for (const st of NORMAL_RED.steps) await o.m.rowOp(st);
            await o.m.note();
            await s.all(o.xhat.write(), o.line.write());
          },
        },
      ],
    },

    // 4
    {
      id: 'fit-line',
      title: 'The best-fit line',
      scene(s) {
        const o = scatter(s, ['p', 'dots']);
        o.line = fitLine(o.p, XHAT, { color: C.green, width: 4, visible: false });
        o.lineLab = s.tex(lineTex(XHAT), { x: 0, y: 0, size: 32, color: C.green, visible: false });
        const [lx, ly] = o.at([1.2, -5]);
        o.lineLab.set({ x: lx, y: ly });
        o.res = residuals(s, o, XHAT);
        o.resLabs = o.res.map((r, i) => {
          const [sx, sy0] = o.at(PTS[i]);
          const [, sy1] = o.at([PTS[i][0], PTS[i][1] - r.r]);
          return s.tex(t(r.r), { x: sx + Math.abs(sy1 - sy0) + 30, y: (sy0 + sy1) / 2, size: 30, color: C.yellow, visible: false });
        });
        o.sum = s.tex(`${RES.map((r) => (r.sign() < 0 ? `(${t(r)})^2` : `${t(r)}^2`)).join(' + ')} = ${t(ERR2)}`, { x: 220, y: 200, size: 36, visible: false });
        o.err = s.tex(`\\|\\mathbf{b} - A\\hat{\\mathbf{x}}\\| = \\sqrt{${t(ERR2)}}`, { x: 220, y: 330, size: 36, color: C.green, visible: false });
        o.note = s.text('least-squares error', { x: 220, y: 390, size: 30, color: C.muted, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Back to the picture. Here is the line $y = 5 - 3x${y equals five minus three x}. Its misses at the three data points are the residuals: $1${one}, $-2${minus two}, and $1${one}.',
          do: async (s, o) => {
            await s.all(o.line.draw({ duration: 1000 }), o.lineLab.fadeIn({ delay: 600 }));
            await s.stagger(o.res.map((r, i) => () => s.all(r.seg.draw({ duration: 500 }), o.resLabs[i].fadeIn())), 500);
          },
        },
        {
          say: 'Least squares makes the sum of the squares of the residuals as small as possible. Picture each as an actual square: the areas are one, four and one, a total of six. No other line does better.',
          do: async (s, o) => {
            await s.stagger(o.res.map((r) => () => r.sq.draw({ duration: 600 })), 400);
            await o.sum.write();
          },
        },
        {
          say: 'The square root of that total is the length of the residual vector, $\\|\\mathbf{b} - A\\hat{\\mathbf{x}}\\| = \\sqrt{6}${the length of b minus A x hat, root six}. We call it the least-squares error.',
          do: async (s, o) => {
            await o.err.write();
            await o.note.fadeIn();
          },
        },
      ],
    },

    // 5
    {
      id: 'try-normal',
      kind: 'try',
      title: 'Your turn',
      say: 'Quick check before we go on. Which product is it?',
      prompt: `For $A = ${texMat(TN)}$, what is $A^TA$?`,
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: `$${texMat(TN_AAT)}$`, why: 'That\'s $AA^T$, which is $3\\times 3$. The normal equations use $A^TA$, which is $2\\times 2$.' },
        { id: 'b', label: `$${texMat(TN_ATA)}$`, why: 'Right: entry $(i, j)$ is column $i$ dotted with column $j$.' },
        { id: 'c', label: `$${texMat([[TN_ATA[0][0], 0], [0, TN_ATA[1][1]]])}$`, why: `The columns aren't orthogonal: column 1 · column 2 = $1 - 1 + 1 = ${t(TN_ATA[0][1])}$.` },
      ],
      hint: '$A^TA$ is $2\\times 2$: its entries are dot products of the columns of $A$.',
      solution: [
        `$A^TA$ has one row and column per column of $A$, so it is $2 \\times 2$. Entry $(i, j)$ is $\\mathbf{a}_i\\cdot\\mathbf{a}_j$.`,
        `$\\mathbf{a}_1\\cdot\\mathbf{a}_1 = ${t(TN_ATA[0][0])}$, $\\mathbf{a}_1\\cdot\\mathbf{a}_2 = 1 - 1 + 1 = ${t(TN_ATA[0][1])}$, $\\mathbf{a}_2\\cdot\\mathbf{a}_2 = ${t(TN_ATA[1][1])}$, so $A^TA = ${texMat(TN_ATA)}$.`,
      ],
    },

    // 6
    {
      id: 'uniqueness',
      title: 'When is the answer unique? (Theorem 14)',
      scene(s) {
        const o = {};
        o.thm = s.defCard({
          x: 480, y: 28, anchor: [0.5, 0], width: 900, kind: 'theorem', title: 'Theorem 14',
          body: '$A\\mathbf{x} = \\mathbf{b}$ has a **unique** least-squares solution for each $\\mathbf{b}$ $\\iff$ the columns of $A$ are linearly independent $\\iff$ $A^TA$ is invertible. Then $\\hat{\\mathbf{x}} = (A^TA)^{-1}A^T\\mathbf{b}$.',
          visible: false,
        });
        o.ad = s.tex(`A = ${texMat(AD)},\\ \\mathbf{b} = ${colTex(B)}`, { x: 230, y: 345, size: 32, visible: false });
        o.bh = s.tex(`A\\hat{\\mathbf{x}} = ${tup(BHAT_D)}`, { x: 230, y: 460, size: 34, color: C.green, visible: false });
        o.xr = s.tex('\\hat{\\mathbf{x}} = (2, 0)', { x: 230, y: 525, size: 34, color: C.orange, visible: false });
        o.t15 = s.tex('\\text{Theorem 15: } A = QR \\ \\Rightarrow\\ R\\hat{\\mathbf{x}} = Q^T\\mathbf{b}', { x: 480, y: 335, size: 38, visible: false });
        o.qrNums = s.tex(`${QR_R_TEX}\\,\\hat{\\mathbf{x}} = ${QR_QTB_TEX} \\ \\Rightarrow\\ \\hat{\\mathbf{x}} = \\col{green}{${tup(QR_X)}}`, { x: 480, y: 465, size: 36, visible: false });
        o.p = s.plane({ x: 690, y: 420, width: 360, range: [-3, 4, -1.5, 3], names: ['x_1', 'x_2'], visible: false });
        const [p0, d0] = [num(LSD.particular), num(LSD.basis[0])];
        o.sol = o.p.line({ through: p0, dir: d0 }, { color: C.green, width: 4, visible: false });
        o.pt = o.p.point(p0, { color: C.orange, r: 10, visible: false });
        o.at = (k) => p0.map((v, i) => v + k * d0[i]);
        o.place = (k) => {
          const q = o.at(k);
          o.pt.coords = q;
          o.pt.redraw();
          o.xr.setTex(`\\hat{\\mathbf{x}} \\approx (${q.map((v) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(1)).join(', ')})`);
        };
        return o;
      },
      steps: [
        {
          say: 'The closest point $A\\hat{\\mathbf{x}}${A x hat} is always unique: it\'s the projection of $\\mathbf{b}${b}. But is the $\\hat{\\mathbf{x}}${x hat} that produces it unique?',
          do: async (s, o) => {
            await o.ad.write();
            await o.bh.fadeIn();
          },
        },
        {
          say: 'Not always. Here the second column is twice the first. The projection is $(2, 2, 2)${two, two, two}, but a whole line of $\\hat{\\mathbf{x}}${x hat}\'s produce it.',
          do: async (s, o) => {
            await o.p.draw();
            await o.sol.draw();
            await s.all(o.pt.draw(), o.xr.fadeIn());
            await s.clock.tween({ duration: 3500, ease: ease.inOut, update: (k) => o.place(Math.sin(2 * Math.PI * k) * 1.2) });
            await o.bh.indicate({ color: C.green });
          },
        },
        {
          say: 'That\'s Theorem 14: the least-squares solution is unique exactly when the columns of $A${A} are independent, which is exactly when $A^TA${A transpose A} is invertible. Then $\\hat{\\mathbf{x}}${x hat} is $(A^TA)^{-1}A^T\\mathbf{b}${the inverse of A transpose A, times A transpose b}.',
          do: (s, o) => o.thm.reveal(),
        },
        {
          say: 'With independent columns there\'s a shortcut. Factor $A = QR${A equals Q R} as in the last lecture, and Theorem 15 says $R\\hat{\\mathbf{x}} = Q^T\\mathbf{b}${R x hat equals Q transpose b}: a triangular system. For our three data points, back substitution gives $(5, -3)${five, minus three} again.',
          do: async (s, o) => {
            await s.all(o.ad.fadeOut(), o.bh.fadeOut(), o.xr.fadeOut(), o.p.fadeOut());
            await o.t15.write();
            await o.qrNums.write({ duration: 1400 });
          },
        },
      ],
    },

    // 7
    {
      id: 'mistake-drop',
      title: 'The trap: dropping an equation',
      scene(s) {
        const o = scatter(s, ['p', 'dots']);
        o.ghost = fitLine(o.p, XHAT, { color: C.muted, width: 3, dash: '8 6', visible: false });
        o.bad = fitLine(o.p, DROP, { color: C.yellow, width: 4, visible: false });
        o.badLab = s.tex(lineTex(DROP), { x: 0, y: 0, size: 32, color: C.yellow, visible: false });
        const [bx, by] = o.at([1.9, 5]);
        o.badLab.set({ x: bx, y: by });
        o.res = residuals(s, o, DROP, { side: -1 });
        o.eqs = s.tex('\\begin{aligned} \\beta_0 &= 6 \\\\ \\beta_0 + \\beta_1 &= 0 \\end{aligned}', { x: 220, y: 130, size: 34, visible: false });
        o.dropped = s.tex('\\beta_0 + 2\\beta_1 = 0', { x: 220, y: 215, size: 34, visible: false });
        o.cmp1 = s.tex(`\\text{this line: } ${DROP_RES.map((r) => `${t(r)}^2`).join(' + ')} = ${t(DROP_ERR2)}`, { x: 230, y: 330, size: 30, color: C.yellow, visible: false });
        o.cmp2 = s.tex(`\\text{least squares: } ${t(ERR2)}`, { x: 230, y: 400, size: 30, color: C.green, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Here\'s the trap. Faced with three equations and two unknowns, it\'s tempting to drop one and solve the other two. Keep the first two points: that\'s the line $y = 6 - 6x${y equals six minus six x}.',
          do: async (s, o) => {
            await s.all(o.eqs.write(), o.dropped.fadeIn());
            await s.strike(o.dropped, { color: 'red' });
            await s.all(o.bad.draw({ duration: 1000 }), o.badLab.fadeIn({ delay: 600 }));
          },
        },
        {
          say: 'It fits two points perfectly and ignores the third completely: at $x = 2${x equals two} it predicts $-6${minus six}, a miss of six. Its sum of squares is thirty six.',
          do: async (s, o) => {
            const r = o.res[2];
            await r.seg.draw({ duration: 700 });
            await r.sq.draw({ duration: 900 });
            await o.cmp1.write();
          },
        },
        {
          say: 'Least squares balances all the equations at once, and its total is only six. Never drop data to make a system consistent: project instead.',
          do: async (s, o) => {
            await o.ghost.draw({ duration: 900 });
            await s.all(o.ghost.recolor(C.green), o.cmp2.write());
          },
        },
      ],
    },

    // 8
    {
      id: 'fill-ls-line',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Lay writes the same system as $X\\boldsymbol\\beta = \\mathbf{y}${X beta equals y}: X holds a column of ones and the x values. Set up and solve the normal equations for a line through four points.',
      prompt: `Find the least-squares line $y = \\beta_0 + \\beta_1x$ for the points ${BL.map(([a, b]) => `$(${a}, ${b})$`).join(', ')}: fill in $X^TX$, $X^T\\mathbf{y}$ and $\\boldsymbol\\beta$.`,
      figure(s) {
        const p = s.plane({ x: 480, y: 310, width: 440, range: [-0.5, 3.5, -0.5, 3], labelStep: 1, names: ['x', 'y'] });
        for (const q of BL) p.point(q, { color: C.blue, r: 13 });
      },
      lines: [
        [
          'X^TX = ',
          { matrix: [[t(BXTX[0][0]), t(BXTX[0][1])], [t(BXTX[1][0]), { id: 'sxx', answer: { type: 'number', value: String(BXTX[1][1]) }, hint: 'The bottom-right entry is $\\sum x_i^2$.' }]] },
          ',\\quad X^T\\mathbf{y} = ',
          { matrix: [[t(BXTY[0])], [{ id: 'sxy', answer: { type: 'number', value: String(BXTY[1]) }, hint: 'The second entry is $\\sum x_iy_i$.' }]] },
        ],
        [
          '\\boldsymbol\\beta = ',
          { matrix: [[{ id: 'b0', answer: { type: 'number', value: String(BBETA[0]) } }], [{ id: 'b1', answer: { type: 'number', value: String(BBETA[1]) } }]] },
        ],
      ],
      solution: [
        `$X$ has a column of ones and the column of $x$-values, so $X^TX = \\begin{bmatrix} n & \\sum x \\\\ \\sum x & \\sum x^2 \\end{bmatrix} = ${texMat(BXTX)}$, with $\\sum x^2 = 0 + 1 + 4 + 9 = ${t(BXTX[1][1])}$.`,
        `$X^T\\mathbf{y} = (\\sum y, \\sum xy) = ${tup(BXTY)}$, with $\\sum xy = 0 + 1 + 4 + 6 = ${t(BXTY[1])}$.`,
        `Solve the normal equations by row reduction. ${rowSteps(BXTX, BXTY)} So $\\beta_0 = ${t(BBETA[0])}$, $\\beta_1 = ${t(BBETA[1])}$.`,
      ],
    },

    // 9
    {
      id: 'wo-ls',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Fit the least-squares line to these three points.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateLine,
    },

    // 10
    {
      id: 'try-ls-sol',
      kind: 'try',
      title: 'Your turn',
      say: 'What does being a least-squares solution actually guarantee?',
      prompt: '$\\hat{\\mathbf{x}}$ is a least-squares solution of $A\\mathbf{x} = \\mathbf{b}$. Which must be true?',
      answer: { type: 'choice', value: 'c' },
      choices: [
        { id: 'a', label: '$A\\hat{\\mathbf{x}} = \\mathbf{b}$', why: 'Only if the system happens to be consistent.' },
        { id: 'b', label: '$\\hat{\\mathbf{x}}$ makes the plain sum of the residuals, $\\sum_i (b_i - (A\\hat{\\mathbf{x}})_i)$, as small as possible', why: 'Least squares minimizes the sum of the **squared** residuals. Plain residuals can cancel: $1 - 2 + 1 = 0$ for our line, and a terrible fit can have the same sum.' },
        { id: 'c', label: '$\\mathbf{b} - A\\hat{\\mathbf{x}}$ is orthogonal to every column of $A$', why: 'Right: the residual lies in $(\\operatorname{Col}A)^\\perp$, which is exactly the normal equations.' },
        { id: 'd', label: '$\\hat{\\mathbf{x}}$ is orthogonal to $\\mathbf{b}$', why: 'The residual, not $\\hat{\\mathbf{x}}$, is orthogonal, and to $\\operatorname{Col}A$.' },
      ],
      hint: 'Think of the picture: $\\mathbf{b}$, its projection onto $\\operatorname{Col}A$, and the drop between them.',
      solution: [
        '$A\\hat{\\mathbf{x}}$ is the projection of $\\mathbf{b}$ onto $\\operatorname{Col}A$, so the residual $\\mathbf{b} - A\\hat{\\mathbf{x}}$ is orthogonal to $\\operatorname{Col}A$, hence to every column of $A$.',
        'That is the statement $A^T(\\mathbf{b} - A\\hat{\\mathbf{x}}) = \\mathbf{0}$, the normal equations. The residual is zero only when the system was consistent to begin with.',
      ],
    },

    // 11
    {
      id: 'cp-normal',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain in your own words where the normal equations come from.',
      prompt: 'Explain where the normal equations $A^TA\\hat{\\mathbf{x}} = A^T\\mathbf{b}$ come from.',
      points: [
        'We want $A\\hat{\\mathbf{x}}$ to be the point of $\\operatorname{Col}A$ closest to $\\mathbf{b}$, which is the orthogonal projection of $\\mathbf{b}$ onto $\\operatorname{Col}A$.',
        'Then the residual $\\mathbf{b} - A\\hat{\\mathbf{x}}$ lies in $(\\operatorname{Col}A)^\\perp = \\operatorname{Nul}A^T$.',
        'So $A^T(\\mathbf{b} - A\\hat{\\mathbf{x}}) = \\mathbf{0}$: each row of $A^T$ (a column of $A$) dotted with the residual is zero.',
        'Rearranged: $A^TA\\hat{\\mathbf{x}} = A^T\\mathbf{b}$.',
      ],
    },

    // 12
    {
      id: 'summary-ls',
      title: 'Summary',
      scene(s) {
        const a = colPicture(s, [], { x: 250, y: 290, size: 330 });
        const b = scatter(s, [], { x: 720, y: 280, width: 300, height: 380 });
        b.line = fitLine(b.p, XHAT, { color: C.green, width: 4, visible: false });
        const t1 = s.text('Can\'t solve? Project $\\mathbf{b}$ onto Col $A$.', { x: 250, y: 525, size: 30, width: 420, visible: false });
        const t2 = s.tex('A^TA\\hat{\\mathbf{x}} = A^T\\mathbf{b}', { x: 720, y: 525, size: 36, color: C.green, visible: false });
        const t3 = s.tex('\\text{error} = \\|\\mathbf{b} - A\\hat{\\mathbf{x}}\\|', { x: 250, y: 70, size: 32, visible: false });
        return { a, b, t1, t2, t3 };
      },
      steps: [
        {
          say: 'When $A\\mathbf{x} = \\mathbf{b}${A x equals b} has no solution, project $\\mathbf{b}${b} onto the column space of $A${A}.',
          do: async (s, o) => {
            await o.a.sp.draw();
            await s.all(appear(o.a.W), o.a.bv.grow());
            await s.all(o.a.drop.grow(), o.a.bh.grow({ delay: 400 }));
            await o.t1.fadeIn();
          },
        },
        {
          say: 'To find the $\\hat{\\mathbf{x}}${x hat} that lands there, solve the normal equations, $A^TA\\hat{\\mathbf{x}} = A^T\\mathbf{b}${A transpose A x hat equals A transpose b}. For data, that\'s the best-fit line.',
          do: async (s, o) => {
            await o.b.p.draw();
            await s.stagger(o.b.dots.map((d) => () => d.draw()), 200);
            await s.all(o.b.line.draw(), o.t2.write());
          },
        },
        {
          say: 'And the least-squares error is the length of the residual, the distance from $\\mathbf{b}${b} to the column space.',
          do: async (s, o) => {
            await s.all(o.a.drop.indicate({ color: C.yellow }), o.t3.write());
          },
        },
      ],
    },
  ],
};

// sanity: the running system really is inconsistent (the lecture's premise)
if (!INCONSISTENT) throw new Error('least-squares: the running example should be inconsistent');
