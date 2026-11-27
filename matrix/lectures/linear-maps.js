/**
 * Lecture 6 · Linear transformations and their matrices (Lay 1.8–1.9). Design: matrix/PLAN.md § 6.
 * Every matrix, image vector and answer below is computed with core/linalg.js.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, mul, mulVec, rref, solve, fromCols, identity, col, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
const pair = (v) => `(${v.map(t).join(', ')})`;
const nums = (v) => v.map(Number);
const E = identity(2);

/** Beat 1: the shear machine. */
const SHEAR = mat([[1, 1], [0, 1]]);
const X1 = vec([1, 2]);
const AX1 = mulVec(SHEAR, X1);

/** Beat 3: a parallelogram that the shear keeps a parallelogram. */
const LU = vec([2, 0]);
const LV = vec([-1, 2]);
const LSUM = LU.map((x, i) => x.add(LV[i]));

/** Beat 5 and the summary: the standard matrix from the images of the basis. */
const BT = mat([[2, -1], [1, 3]]);
const BT_E1 = mulVec(BT, col(E, 0));
const BT_E2 = mulVec(BT, col(E, 1));
const BT_X = vec([3, 1]);
const BT_TX = mulVec(BT, BT_X);

/** Beat 6: the gallery. */
const ROT = mat([[0, -1], [1, 0]]);
const SWAP = mat([[0, 1], [1, 0]]);
const PROJ = mat([[1, 0], [0, 0]]);
const GALLERY = [
  { name: '90^\\circ\\ \\text{counterclockwise}', M: ROT },
  { name: '\\text{reflection in } x_2 = x_1', M: SWAP },
  { name: '\\text{horizontal shear}', M: SHEAR },
  { name: '\\text{projection onto } x_1\\text{-axis}', M: PROJ },
];
/** The letter F (its images show orientation). */
const LETTER = [[0, 0], [0, 2], [1.25, 2], [1.25, 1.6], [0.4, 1.6], [0.4, 1.2], [1, 1.2], [1, 0.8], [0.4, 0.8], [0.4, 0]];

/** Beat 7: rotation by 90° clockwise, built from where e1 and e2 land. */
const CW_E1 = vec([0, -1]);
const CW_E2 = vec([1, 0]);
const CW = fromCols([CW_E1, CW_E2]);

/** Beat 9: a tall matrix that is one-to-one but not onto. */
const TALL = mat([[1, 2], [0, 1], [1, 3]]);
const TALL_RED = rref(TALL);
const TALL_FWD = TALL_RED.steps.filter((st) => st.phase === 'forward');

/** Beats 11–12: rotate 90°, then reflect across the x1-axis. */
const REFL = mat([[1, 0], [0, -1]]);
const FR = mul(REFL, ROT);
const RF = mul(ROT, REFL);
const FR_E1 = mulVec(REFL, mulVec(ROT, col(E, 0)));
const FR_E2 = mulVec(REFL, mulVec(ROT, col(E, 1)));
const ROT_E1 = mulVec(ROT, col(E, 0));
const ROT_E2 = mulVec(ROT, col(E, 1));

// ---------------------------------------------------------------- workout: all x with T(x) = b

const X = ['x_1', 'x_2', 'x_3'];
const vecStr = (v) => v.map(String);

/** 2×3 A and b: prompt, answer (parametric solution), hints, solution, all computed. */
function ontoItem(A0, b0) {
  const A = mat(A0);
  const b = vec(b0);
  const aug = A.map((row, i) => [...row, b[i]]);
  const red = rref(aug, { augmented: 1 });
  const sol = solve(A, b);
  const free = sol.free[0];
  const p = sol.particular;
  const v = sol.basis[0];
  return {
    prompt: `Let $T(\\mathbf{x}) = A\\mathbf{x}$ with $A = ${texMat(A)}$. Find all $\\mathbf{x}$ with $T(\\mathbf{x}) = ${texVec(b)}$. Then decide: is $T$ onto $\\mathbb{R}^2$? Is it one-to-one?`,
    answer: { type: 'solution', particular: vecStr(p), basis: [vecStr(v)] },
    hints: [
      `Row reduce the augmented matrix $[A \\mid \\mathbf{b}] = ${texMat(aug, { augment: 3 })}$.`,
      `Its reduced echelon form is $${texMat(red.R, { augment: 3 })}$. Which variable is free?`,
      `Solve each pivot row for its pivot variable and write $\\mathbf{x} = \\mathbf{p} + ${X[free]}\\mathbf{v}$.`,
    ],
    solution: [
      `Row reduce $[A \\mid \\mathbf{b}] = ${texMat(aug, { augment: 3 })}$:`,
      ...red.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after, { augment: 3 })}$`),
      `The pivots are in columns 1 and 2, so $${X[free]}$ is free. Every solution is $$\\mathbf{x} = ${texVec(p)} + ${X[free]}${texVec(v)}.$$`,
      `$T$ **is onto** $\\mathbb{R}^2$: both rows have a pivot, so $A\\mathbf{x} = \\mathbf{b}$ is solvable for every $\\mathbf{b}$.`,
      `$T$ is **not one-to-one**: the free variable means a whole line of inputs lands on $\\mathbf{b}$ (and a nonzero $\\mathbf{x}$, namely $${texVec(v)}$, lands on $\\mathbf{0}$).`,
    ],
  };
}
const WO_ONTO = ontoItem([[1, -2, 1], [2, -3, 4]], [1, 4]);

/** Fresh 2×3 problems: rank 2, a 1 in the corner, integer reduced form and solution, small numbers. */
function generateOnto(rand) {
  for (;;) {
    const A = [0, 1].map(() => [0, 1, 2].map(() => rand.int(-3, 3)));
    A[0][0] = 1;
    const red = rref(A);
    if (red.rank !== 2 || red.pivots[1][1] !== 1) continue;
    if (!red.steps.every((st) => st.after.every((row) => row.every((x) => x.isInt && x.abs().cmp(12) <= 0)))) continue;
    if (A[1].filter((x) => x !== 0).length < 2) continue;
    const x0 = [rand.int(-2, 2), rand.int(-2, 2), 0];
    const b = mulVec(mat(A), vec(x0));
    if (b.every((x) => x.zero) || b.some((x) => x.abs().cmp(12) > 0)) continue;
    const sol = solve(A, b);
    if (![...sol.particular, ...sol.basis[0]].every((x) => x.isInt && x.abs().cmp(20) <= 0)) continue;
    return ontoItem(A, b);
  }
}

// ---------------------------------------------------------------- scene helpers

/** A dot cloud with arrows for the onto / one-to-one pictures. */
function mapDiagram(s, { x, y, dom, cod, arrows, colorFor }) {
  const gap = 66;
  const left = x - 130;
  const right = x + 130;
  const ys = (n) => Array.from({ length: n }, (_, k) => y + (k - (n - 1) / 2) * gap);
  const dy = ys(dom), cy = ys(cod);
  const blobs = [
    s.rect(left - 50, y - (dom * gap) / 2 - 14, 100, dom * gap + 28, { radius: 40, color: C.muted, width: 3, fill: FILL.blue, visible: false }),
    s.rect(right - 50, y - (cod * gap) / 2 - 14, 100, cod * gap + 28, { radius: 40, color: C.muted, width: 3, fill: FILL.green, visible: false }),
  ];
  const domDots = dy.map((yy) => s.dot(left, yy, { color: C.blue, r: 10, visible: false }));
  const codDots = cy.map((yy, k) => s.dot(right, yy, { color: colorFor(k), r: 10, visible: false }));
  const arrs = arrows.map(([a, b]) => s.arrow(left + 16, dy[a], right - 18, cy[b], { color: C.ink, width: 3, head: 14, visible: false }));
  return { blobs, domDots, codDots, arrs };
}
async function showDiagram(s, d) {
  await s.all(d.blobs.map((b) => b.fadeIn({ shift: [0, 0] })), d.domDots.map((p) => p.draw()), d.codDots.map((p) => p.draw()));
  await s.stagger(d.arrs.map((a) => () => a.draw({ duration: 600 })), 300);
}

/** e1 (green) and e2 (red), labelled in Lay's notation. */
function eBasis(p, opts = {}) {
  return {
    i: p.vector([1, 0], { color: C.green, label: '\\mathbf{e}_1', ...opts }),
    j: p.vector([0, 1], { color: C.red, label: '\\mathbf{e}_2', ...opts }),
  };
}

/** Plane for beats 5 and 15: the basis and x = (3, 1). */
function basisPlane(s, visible) {
  const p = s.plane({ x: 725, y: 310, width: 350, range: [-1.5, 5.5, -0.5, 6.5], labels: false, names: ['x_1', 'x_2'], visible });
  const b = eBasis(p, { visible });
  return { p, b };
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'linear-maps',
  title: 'Linear transformations and their matrices',
  goals: [
    'See a matrix as a transformation $T(\\mathbf{x}) = A\\mathbf{x}$ from $\\mathbb{R}^n$ to $\\mathbb{R}^m$: domain, codomain, range',
    'Know the two linearity rules and why $T(\\mathbf{0}) = \\mathbf{0}$',
    'Build the standard matrix $A = [T(\\mathbf{e}_1)\\ \\cdots\\ T(\\mathbf{e}_n)]$ of a rotation, reflection, shear or projection',
    'Decide onto (pivot in every row) and one-to-one (pivot in every column)',
  ],
  beats: [
    // 1
    {
      id: 'machine',
      title: 'A matrix moves vectors',
      scene(s) {
        const A = s.tex(`A = ${texMat(SHEAR)}`, { x: 200, y: 130, size: 44, visible: false });
        const x = s.tex(`\\mathbf{x} = ${pair(X1)}`, { x: 200, y: 250, size: 40, color: C.blue, visible: false });
        const ax = s.tex(`A\\mathbf{x} = ${pair(AX1)}`, { x: 200, y: 320, size: 40, color: C.green, visible: false });
        const map = s.tex('T : \\mathbb{R}^2 \\to \\mathbb{R}^2', { x: 200, y: 410, size: 40, visible: false });
        const rules = s.text('straight · parallel · evenly spaced · $\\mathbf{0}$ fixed', { x: 480, y: 550, size: 30, color: C.muted, visible: false });
        const p = s.plane({ x: 660, y: 290, width: 440, range: [-4, 4, -3, 3], names: ['x_1', 'x_2'], visible: false });
        const ghostX = p.vector(nums(X1), { color: C.blue, label: '\\mathbf{x}', visible: false });
        const out = p.vector(nums(AX1), { color: C.green, label: 'A\\mathbf{x}', transform: false, visible: false });
        const origin = p.point([0, 0], { color: C.yellow, r: 10, transform: false, visible: false });
        return { A, x, ax, map, rules, p, ghostX, out, origin };
      },
      steps: [
        {
          say: 'A matrix is a machine. Feed in a vector $\\mathbf{x}${x}, multiply, and out comes $A\\mathbf{x}${A x}. With a two by two matrix, both live in $\\mathbb{R}^2${R two}, so this is a transformation from $\\mathbb{R}^2${R two} to $\\mathbb{R}^2${R two}.',
          do: async (s, o) => {
            await s.all(o.A.write(), o.p.draw());
            await s.all(o.x.write(), o.ghostX.grow());
            await s.all(o.ax.write(), o.out.grow());
            await o.map.fadeIn();
          },
        },
        {
          say: 'But the matrix doesn\'t just move one vector. Watch every point of the plane move at once. The blue vector rides along and lands exactly on $A\\mathbf{x}${A x}.',
          do: async (s, o) => {
            await o.p.applyMatrix(SHEAR, { duration: 2200 });
            await s.all(o.out.flash({ color: C.green }), o.ghostX.fadeOut());
          },
        },
        {
          say: 'Look at the grid. Its lines stay straight, parallel and evenly spaced, and the origin doesn\'t move. That is what linear looks like.',
          do: async (s, o) => {
            await o.origin.draw();
            await o.origin.flash();
            await o.rules.write({ duration: 1200 });
          },
        },
      ],
    },

    // 2
    {
      id: 'defs',
      title: 'Domain, codomain, range',
      scene(s) {
        const head = s.tex('T : \\mathbb{R}^n \\to \\mathbb{R}^m', { x: 480, y: 70, size: 44, visible: false });
        const dom = s.circle(250, 300, 140, { color: C.blue, width: 3, fill: FILL.blue, visible: false });
        const cod = s.circle(710, 300, 160, { color: C.muted, width: 3, fill: FILL.ink, visible: false });
        const domL = s.tex('\\mathbb{R}^n', { x: 250, y: 300, size: 44, color: C.blue, visible: false });
        const domN = s.text('domain: inputs', { x: 250, y: 480, size: 32, color: C.blue, visible: false });
        const codL = s.tex('\\mathbb{R}^m', { x: 800, y: 175, size: 40, color: C.muted, visible: false });
        const codN = s.text('codomain: where outputs live', { x: 710, y: 500, size: 30, color: C.muted, visible: false });
        const range = s.circle(680, 330, 78, { color: C.green, width: 3, fill: FILL.green, visible: false });
        const rangeN = s.text('range', { x: 680, y: 330, size: 32, color: C.green, weight: 600, visible: false });
        const ins = [[200, 250], [300, 290], [230, 380]];
        const outs = [[640, 290], [720, 300], [670, 380]];
        const dots = ins.map(([a, b]) => s.dot(a, b, { color: C.blue, r: 9, visible: false }));
        const hits = outs.map(([a, b]) => s.dot(a, b, { color: C.green, r: 9, visible: false }));
        const arrs = ins.map(([a, b], k) => s.arrow(a + 12, b, outs[k][0] - 14, outs[k][1], { color: C.ink, width: 3, head: 14, visible: false }));
        const miss = s.dot(790, 410, { color: C.yellow, r: 10, visible: false });
        const missL = s.tex('\\mathbf{b}\\ ?', { x: 832, y: 410, size: 36, color: C.yellow, visible: false });
        const rangeTex = s.tex('\\text{range} = \\{A\\mathbf{x}\\} = \\operatorname{Span}\\{\\mathbf{a}_1, \\dots, \\mathbf{a}_n\\}', { x: 480, y: 543, size: 32, color: C.green, visible: false });
        return { head, dom, cod, domL, domN, codL, codN, range, rangeN, dots, hits, arrs, miss, missL, rangeTex };
      },
      steps: [
        {
          say: 'Every transformation has two spaces. The domain, $\\mathbb{R}^n${R n}, is where the inputs live. The codomain, $\\mathbb{R}^m${R m}, is where the outputs live.',
          do: async (s, o) => {
            await o.head.write();
            await s.all(o.dom.draw(), o.domL.fadeIn(), o.domN.fadeIn({ delay: 300 }));
            await s.all(o.cod.draw(), o.codL.fadeIn(), o.codN.fadeIn({ delay: 300 }));
            await o.domL.animate({ y: 195 });
          },
        },
        {
          say: 'Now send every input across. The outputs that actually happen form the range. For $T(\\mathbf{x}) = A\\mathbf{x}${T of x equals A x}, the outputs are all combinations of the columns of $A${A}, so the range is the span of the columns.',
          do: async (s, o) => {
            await s.all(o.dots.map((d) => d.draw()));
            await s.stagger(o.arrs.map((a, k) => () => s.all(a.draw({ duration: 600 }), o.hits[k].draw({ delay: 500 }))), 400);
            await s.all(o.range.draw(), o.rangeN.fadeIn({ delay: 400 }));
            await o.rangeTex.write({ duration: 1200 });
          },
        },
        {
          say: 'Don\'t mix these up. The codomain is fixed by the setup, but the range can be smaller: a vector $\\mathbf{b}${b} out here is in the codomain, yet nothing maps to it.',
          do: async (s, o) => {
            await s.all(o.miss.draw(), o.missL.fadeIn({ shift: [-10, 0] }));
            await o.miss.flash();
            await o.cod.indicate({ color: C.muted, scale: 1.04 });
          },
        },
      ],
    },

    // 3
    {
      id: 'linearity',
      title: 'What linear means',
      scene(s) {
        const r1 = s.tex('\\text{(i)}\\ \\ T(\\mathbf{u} + \\mathbf{v}) = T(\\mathbf{u}) + T(\\mathbf{v})', { x: 50, y: 90, size: 34, anchor: [0, 0.5], visible: false });
        const r2 = s.tex('\\text{(ii)}\\ \\ T(c\\mathbf{u}) = c\\,T(\\mathbf{u})', { x: 50, y: 150, size: 34, anchor: [0, 0.5], visible: false });
        const all = s.text('for all $\\mathbf{u}, \\mathbf{v}$ and all scalars $c$', { x: 50, y: 212, size: 30, color: C.muted, anchor: [0, 0.5], visible: false });
        const zero = s.tex('T(\\mathbf{0}) = T(0\\mathbf{u}) = 0\\,T(\\mathbf{u}) = \\mathbf{0}', { x: 50, y: 285, size: 32, anchor: [0, 0.5], color: C.green, visible: false });
        const bad = s.tex('T(x_1, x_2) = (x_1 + 1,\\ x_2)', { x: 50, y: 370, size: 34, anchor: [0, 0.5], visible: false });
        const badZ = s.tex('T(\\mathbf{0}) = (1, 0) \\neq \\mathbf{0}', { x: 50, y: 440, size: 34, anchor: [0, 0.5], color: C.yellow, visible: false });
        const badN = s.text('not linear', { x: 50, y: 505, size: 32, weight: 600, color: C.yellow, anchor: [0, 0.5], visible: false });
        const p = s.plane({ x: 700, y: 320, width: 340, range: [-2, 4, -1, 3], names: ['x_1', 'x_2'], visible: false });
        const u = p.vector(nums(LU), { color: C.blue, label: '\\mathbf{u}', visible: false });
        const v = p.vector(nums(LV), { color: C.red, label: '\\mathbf{v}', visible: false });
        const par = p.parallelogram(nums(LU), nums(LV), { color: C.muted, visible: false });
        const sum = p.vector(nums(LSUM), { color: C.green, label: '\\mathbf{u}+\\mathbf{v}', visible: false });
        const o0 = p.point([0, 0], { color: C.green, r: 10, transform: false, visible: false });
        const ghost0 = p.point([0, 0], { color: C.muted, r: 9, transform: false, visible: false });
        const moved = p.point([0, 0], { color: C.yellow, r: 11, transform: false, visible: false });
        return { r1, r2, all, zero, bad, badZ, badN, p, u, v, par, sum, o0, ghost0, moved };
      },
      steps: [
        {
          say: 'Lay\'s definition asks for two rules. Sums go to sums: $T(\\mathbf{u} + \\mathbf{v}) = T(\\mathbf{u}) + T(\\mathbf{v})${T of u plus v equals T of u plus T of v}. And scalings go to scalings: $T(c\\mathbf{u}) = cT(\\mathbf{u})${T of c u equals c times T of u}. Watch the shear: the parallelogram stays a parallelogram, with the sum still on its far corner.',
          do: async (s, o) => {
            await s.all(o.r1.write(), o.p.draw());
            await s.all(o.u.grow(), o.v.grow(), o.r2.write({ delay: 400 }), o.all.fadeIn({ delay: 900 }));
            await s.all(o.par.draw(), o.sum.grow({ delay: 300 }));
            await o.p.applyMatrix(SHEAR, { duration: 1800 });
            await o.sum.flash({ color: C.green });
          },
        },
        {
          say: 'One consequence comes for free. Take $c = 0${c equals zero} in rule two: $T(\\mathbf{0}) = \\mathbf{0}${T of zero equals zero}. A linear map always keeps the origin where it is.',
          do: async (s, o) => {
            await o.zero.write({ duration: 1200 });
            await o.o0.draw();
            await o.o0.flash({ color: C.green });
          },
        },
        {
          say: 'Now try $T(x_1, x_2) = (x_1 + 1, x_2)${T of x one, x two equals x one plus one, x two}. It looks harmless, and its picture is just a slide. But it moves the origin to $(1, 0)${one, zero}, so it can\'t be linear.',
          do: async (s, o) => {
            await s.all(o.par.fadeOut(), o.u.fadeOut(), o.v.fadeOut(), o.sum.fadeOut(), o.o0.fadeOut(), o.p.applyMatrix([[1, -1], [0, 1]], { duration: 900 }));
            await o.bad.write();
            o.ghost0.show();
            o.moved.show();
            await o.moved.moveTo([1, 0], { duration: 900 });
            await s.all(o.badZ.write(), o.moved.flash());
            await o.badN.fadeIn();
          },
        },
      ],
    },

    // 4
    {
      id: 'try-linear',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Test each map against the two rules, and remember what a linear map does to zero.',
      prompt: 'Which map $T : \\mathbb{R}^2 \\to \\mathbb{R}^2$ is linear?',
      answer: { type: 'choice', value: 'c' },
      choices: [
        { id: 'a', label: '$T(x_1, x_2) = (x_1 + 1,\\ x_2)$', why: '$T(\\mathbf{0}) = (1, 0) \\neq \\mathbf{0}$, and a linear map always sends $\\mathbf{0}$ to $\\mathbf{0}$. "Its graph looks like a line" is not what linear means.' },
        { id: 'b', label: '$T(x_1, x_2) = (x_1x_2,\\ x_2)$', why: 'Doubling $\\mathbf{x}$ quadruples the first entry: $T(2\\mathbf{x})$ has $4x_1x_2$, not $2x_1x_2$. Products of variables break rule (ii).' },
        { id: 'c', label: '$T(x_1, x_2) = (3x_2,\\ x_1 - x_2)$', why: 'Right: every entry is a combination of $x_1, x_2$ with constant weights, so $T(\\mathbf{x}) = A\\mathbf{x}$ for a matrix $A$.' },
        { id: 'd', label: '$T(x_1, x_2) = (|x_1|,\\ x_2)$', why: '$T(-\\mathbf{e}_1) = \\mathbf{e}_1$, but rule (ii) needs $-T(\\mathbf{e}_1) = -\\mathbf{e}_1$. Absolute values break scaling by negatives.' },
      ],
      hint: 'A map is linear exactly when each output entry is a fixed combination of the inputs: no constants added, no products, no absolute values.',
      solution: [
        '(a) moves the origin: $T(\\mathbf{0}) = (1, 0)$. (b) fails scaling: $T(2\\mathbf{x})$ has first entry $4x_1x_2$. (d) fails scaling by $-1$: $T(-\\mathbf{e}_1) = \\mathbf{e}_1 \\neq -T(\\mathbf{e}_1)$.',
        `(c) is a matrix transformation: $T(\\mathbf{x}) = ${texMat([[0, 3], [1, -1]])}\\begin{bmatrix}x_1\\\\x_2\\end{bmatrix}$, and every matrix transformation is linear because $A(\\mathbf{u} + \\mathbf{v}) = A\\mathbf{u} + A\\mathbf{v}$ and $A(c\\mathbf{u}) = cA\\mathbf{u}$.`,
      ],
    },

    // 5
    {
      id: 'basis-trick',
      title: 'Watch where the basis goes',
      scene(s) {
        const { p, b } = basisPlane(s, false);
        const x = p.vector(nums(BT_X), { color: C.blue, label: '\\mathbf{x}', visible: false });
        const l1 = s.tex('\\mathbf{x} = x_1\\mathbf{e}_1 + x_2\\mathbf{e}_2', { x: 270, y: 80, size: 34, visible: false });
        const l2 = s.tex('T(\\mathbf{x}) = x_1\\,\\col{green}{T(\\mathbf{e}_1)} + x_2\\,\\col{red}{T(\\mathbf{e}_2)}', { x: 270, y: 150, size: 30, visible: false });
        const thm = s.text('**Theorem 10.** The unique $A$ with $T(\\mathbf{x}) = A\\mathbf{x}$ for all $\\mathbf{x}$ is', { x: 270, y: 240, size: 30, width: 470, visible: false });
        const A = s.tex(`A = [\\,T(\\mathbf{e}_1)\\ \\ T(\\mathbf{e}_2)\\,] = \\begin{bmatrix}\\part{c1a}{${t(BT_E1[0])}} & \\part{c2a}{${t(BT_E2[0])}} \\\\ \\part{c1b}{${t(BT_E1[1])}} & \\part{c2b}{${t(BT_E2[1])}}\\end{bmatrix}`, { x: 275, y: 350, size: 30, visible: false });
        const calc = s.tex(`T(\\mathbf{x}) = ${t(BT_X[0])}${pair(BT_E1)} + ${pair(BT_E2)} = \\col{green}{${pair(BT_TX)}}`, { x: 288, y: 470, size: 30, visible: false });
        const ans = p.point(nums(BT_TX), { color: C.green, r: 9, transform: false, visible: false });
        const i1 = p.label(nums(BT_E1), pair(BT_E1), { color: C.green, size: 30, offset: [40, 26], transform: false, visible: false });
        const j1 = p.label(nums(BT_E2), pair(BT_E2), { color: C.red, size: 30, offset: [72, 26], transform: false, visible: false });
        return { p, b, x, l1, l2, thm, A, calc, ans, i1, j1 };
      },
      steps: [
        {
          say: 'Here\'s the key trick. Every vector is built from the two basis vectors: $\\mathbf{x} = x_1\\mathbf{e}_1 + x_2\\mathbf{e}_2${x equals x one e one plus x two e two}. This one is three steps along $\\mathbf{e}_1${e one} and one along $\\mathbf{e}_2${e two}.',
          do: async (s, o) => {
            await s.all(o.p.draw(), o.l1.write());
            await s.all(o.b.i.grow(), o.b.j.grow());
            await o.x.grow();
          },
        },
        {
          say: 'Apply a linear map. By linearity, $T(\\mathbf{x}) = x_1T(\\mathbf{e}_1) + x_2T(\\mathbf{e}_2)${T of x equals x one T of e one plus x two T of e two}. So the only thing we need to know is where the two basis vectors land.',
          do: async (s, o) => {
            await o.l2.write();
            await o.p.applyMatrix(BT, { duration: 2000 });
            await s.all(o.i1.draw(), o.j1.draw());
          },
        },
        {
          say: 'That\'s Theorem ten. A linear map $T${T} has exactly one standard matrix, and its columns are those landing spots: $T(\\mathbf{e}_1)${T of e one} first, $T(\\mathbf{e}_2)${T of e two} second.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.A.write({ duration: 1100 });
            await s.all(o.A.color('c1a', C.green), o.A.color('c1b', C.green), o.b.i.flash({ color: C.green }));
            await s.all(o.A.color('c2a', C.red), o.A.color('c2b', C.red), o.b.j.flash({ color: C.red }));
          },
        },
        {
          say: 'Now $\\mathbf{x} = (3, 1)${x equals three, one} goes to three times $(2, 1)${two, one} plus $(-1, 3)${minus one, three}, which is $(5, 6)${five, six}. Two arrows determine everything.',
          do: async (s, o) => {
            await o.calc.write({ duration: 1300 });
            await o.ans.draw();
            await o.ans.flash({ color: C.green });
          },
        },
      ],
    },

    // 6
    {
      id: 'gallery',
      title: 'A gallery of maps',
      scene(s) {
        const p = s.plane({ x: 660, y: 300, width: 440, range: [-3, 3, -3, 3], names: ['x_1', 'x_2'] });
        const b = eBasis(p, { visible: false });
        const shape = p.polygon(LETTER, { color: C.blue, visible: false });
        const name = s.tex(GALLERY[0].name, { x: 225, y: 200, size: 32, visible: false });
        const M = s.tex(texMat(GALLERY[0].M), { x: 230, y: 320, size: 48, visible: false });
        const where = s.tex('\\mathbf{e}_1 \\mapsto \\mathbf{e}_2,\\quad \\mathbf{e}_2 \\mapsto -\\mathbf{e}_1', { x: 230, y: 440, size: 34, color: C.muted, visible: false });
        return { p, b, shape, name, M, where };
      },
      steps: [
        {
          say: 'Let\'s collect some maps, each by where it sends the basis. Rotation by ninety degrees counterclockwise: $\\mathbf{e}_1${e one} goes to $\\mathbf{e}_2${e two}, and $\\mathbf{e}_2${e two} goes to minus $\\mathbf{e}_1${e one}. Those are the columns.',
          do: async (s, o) => {
            await s.all(o.shape.draw(), o.b.i.grow(), o.b.j.grow());
            await s.all(o.name.write(), o.M.fadeIn({ delay: 300 }));
            await o.p.applyMatrix(ROT, { duration: 1800 });
            await o.where.fadeIn();
          },
        },
        {
          say: 'Reflection across the line $x_2 = x_1${x two equals x one} swaps the two basis vectors, so it swaps the columns of the identity. Notice the F comes out mirror-reversed.',
          do: async (s, o) => {
            await s.all(o.where.fadeOut(), o.name.swap(GALLERY[1].name), o.M.swap(texMat(GALLERY[1].M)));
            o.p.resetMatrix();
            await o.p.applyMatrix(SWAP, { duration: 1800 });
          },
        },
        {
          say: 'A shear keeps $\\mathbf{e}_1${e one} where it is and tilts $\\mathbf{e}_2${e two} over to $(1, 1)${one, one}. Every horizontal line slides sideways by its height.',
          do: async (s, o) => {
            await s.all(o.name.swap(GALLERY[2].name), o.M.swap(texMat(GALLERY[2].M)));
            o.p.resetMatrix();
            await o.p.applyMatrix(SHEAR, { duration: 1800 });
          },
        },
        {
          say: 'And projection onto the $x_1${x one} axis sends $\\mathbf{e}_2${e two} to zero. It flattens the whole plane, F and all, onto a single line.',
          do: async (s, o) => {
            await s.all(o.name.swap(GALLERY[3].name), o.M.swap(texMat(GALLERY[3].M)));
            o.p.resetMatrix();
            await o.p.applyMatrix(PROJ, { duration: 1800 });
            await o.shape.flash();
          },
        },
      ],
    },

    // 7
    {
      id: 'fill-standard',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks. Build the matrix one column at a time, from where each basis vector lands.',
      figure(s) {
        const cx = 360, cy = 310;
        const p = s.plane({ x: cx, y: cy, width: 460, range: [-2, 2, -2, 2], labels: false });
        eBasis(p, { labelSize: 52, width: 7 });
        const r = 165;
        const at = (deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180)];
        const [a0, a1] = [at(80), at(-35)];
        s.path(`M ${a0[0]} ${a0[1]} A ${r} ${r} 0 0 1 ${a1[0]} ${a1[1]}`, { color: C.muted, width: 5, dash: true });
        s.tex('90^\\circ', { x: 760, y: 260, size: 60 });
        s.tex('\\text{clockwise}', { x: 760, y: 340, size: 50 });
      },
      lines: [
        ['T \\text{ rotates } \\mathbb{R}^2 \\text{ by } 90^\\circ \\text{ clockwise.}'],
        [
          'A = ',
          {
            matrix: CW.map((row, i) =>
              row.map((x, j) => ({ id: `a${i}${j}`, answer: { type: 'number', value: String(x) }, hint: `Column ${j + 1} is where $\\mathbf{e}_${j + 1}$ lands.` })),
            ),
          },
        ],
      ],
      solution: [
        `Turning clockwise by a quarter turn sends $\\mathbf{e}_1$ (pointing right) down to $${pair(CW_E1)}$, and $\\mathbf{e}_2$ (pointing up) over to $${pair(CW_E2)}$.`,
        `Those are the columns: $A = ${texMat(CW)}$. Check: $A${texVec([1, 1])} = ${texVec(mulVec(CW, vec([1, 1])))}$, the vector $(1, 1)$ turned a quarter turn clockwise.`,
      ],
    },

    // 8
    {
      id: 'onto-1to1',
      title: 'Onto and one-to-one',
      scene(s) {
        const L = mapDiagram(s, { x: 240, y: 290, dom: 4, cod: 3, arrows: [[0, 0], [1, 1], [2, 1], [3, 2]], colorFor: () => C.green });
        const R = mapDiagram(s, { x: 720, y: 290, dom: 3, cod: 4, arrows: [[0, 0], [1, 2], [2, 3]], colorFor: (k) => (k === 1 ? C.yellow : C.green) });
        const lt = s.text('**onto:** every $\\mathbf{b}$ is hit at least once', { x: 240, y: 75, size: 30, width: 360, visible: false });
        const rt = s.text('**one-to-one:** every $\\mathbf{b}$ is hit at most once', { x: 720, y: 75, size: 30, width: 360, visible: false });
        const ln = s.text('but two inputs share an output', { x: 240, y: 520, size: 30, color: C.muted, visible: false });
        const rn = s.text('but one $\\mathbf{b}$ is missed', { x: 720, y: 520, size: 30, color: C.muted, visible: false });
        const p = s.plane({ x: 690, y: 300, width: 320, range: [-1, 3, -2, 3], names: ['x_1', 'x_2'], visible: false });
        const pts = [[1, 2.5], [1, 1.2], [1, -1.5]].map((q, k) => p.point(q, { color: [C.blue, C.red, C.teal][k], r: 10, visible: false }));
        const axis = p.span([1, 0], { color: C.green, width: 5, transform: false, visible: false });
        const missed = p.point([0, 2], { color: C.yellow, r: 10, label: '\\mathbf{b}', transform: false, visible: false });
        const P = s.tex(`P = ${texMat(PROJ)}`, { x: 200, y: 150, size: 40, visible: false });
        const n1 = s.text('many $\\mathbf{x}$ → one output: **not one-to-one**', { x: 200, y: 290, size: 30, width: 320, visible: false });
        const n2 = s.text('range = a line: **not onto** $\\mathbb{R}^2$', { x: 200, y: 420, size: 30, width: 320, visible: false });
        return { L, R, lt, rt, ln, rn, p, pts, axis, missed, P, n1, n2 };
      },
      steps: [
        {
          say: 'Two questions about any map. First, is it onto? That means every $\\mathbf{b}${b} in the codomain is hit at least once. Here every output dot gets an arrow, so this one is onto.',
          do: async (s, o) => {
            await o.lt.fadeIn();
            await showDiagram(s, o.L);
            await s.all(o.L.codDots.map((d) => d.flash({ color: C.green })));
          },
        },
        {
          say: 'Second, is it one-to-one? That means every $\\mathbf{b}${b} is hit at most once: different inputs, different outputs. This one is one-to-one, but it misses a point, so it isn\'t onto. And the first picture isn\'t one-to-one.',
          do: async (s, o) => {
            await o.rt.fadeIn();
            await showDiagram(s, o.R);
            await o.R.codDots[1].flash();
            await s.all(o.rn.fadeIn(), o.ln.fadeIn({ delay: 500 }), o.L.codDots[1].flash({ delay: 500 }));
          },
        },
        {
          say: 'Now the projection onto the $x_1${x one} axis. Three different points, one above the other, all land on the same spot. So it\'s not one-to-one.',
          do: async (s, o) => {
            await s.all(o.lt.fadeOut(), o.rt.fadeOut(), o.ln.fadeOut(), o.rn.fadeOut(),
              [o.L, o.R].flatMap((d) => [...d.blobs, ...d.domDots, ...d.codDots, ...d.arrs].map((m) => m.fadeOut())));
            await s.all(o.p.draw(), o.P.write());
            await s.all(o.pts.map((q) => q.draw()));
            await o.p.applyMatrix(PROJ, { duration: 1800 });
            await s.all(o.pts[0].flash(), o.n1.fadeIn());
          },
        },
        {
          say: 'And every output lies on that axis. A point like $\\mathbf{b} = (0, 2)${b equals zero, two} is never hit, so it\'s not onto either. Projection fails both tests.',
          do: async (s, o) => {
            await o.axis.draw({ duration: 900 });
            await o.missed.draw();
            await s.all(o.missed.flash(), o.n2.fadeIn());
          },
        },
      ],
    },

    // 9
    {
      id: 'theorems-11-12',
      title: 'How to test them',
      scene(s) {
        const line = (tx, y, color) => s.tex(tx, { x: 480, y, size: 30, color, visible: false });
        const hdr = s.text('Let $T : \\mathbb{R}^n \\to \\mathbb{R}^m$ be linear, with standard matrix $A$.', { x: 480, y: 50, size: 30, color: C.muted, visible: false });
        const th12a = line('\\text{onto } \\mathbb{R}^m \\Leftrightarrow \\text{columns span } \\mathbb{R}^m \\Leftrightarrow \\text{pivot in every row}', 105, C.yellow);
        const th11 = line('\\text{one-to-one} \\Leftrightarrow A\\mathbf{x} = \\mathbf{0} \\text{ has only the trivial solution}', 160);
        const th12b = line('\\Leftrightarrow \\text{columns independent} \\Leftrightarrow \\text{pivot in every column}', 210, C.green);
        const m = s.matrix(TALL, { x: 220, y: 415, size: 40, visible: false });
        const ok = s.tex('\\text{a pivot in each column: one-to-one}', { x: 640, y: 355, size: 30, color: C.green, visible: false });
        const no = s.tex('\\text{row 3 has no pivot: not onto } \\mathbb{R}^3', { x: 640, y: 475, size: 30, color: C.yellow, visible: false });
        return { hdr, th11, th12a, th12b, m, ok, no };
      },
      steps: [
        {
          say: 'For $T(\\mathbf{x}) = A\\mathbf{x}${T of x equals A x} both questions come down to pivots. Onto means $A\\mathbf{x} = \\mathbf{b}${A x equals b} is solvable for every $\\mathbf{b}${b}, so the columns span $\\mathbb{R}^m${R m}: a pivot in every row.',
          do: async (s, o) => {
            await o.hdr.fadeIn();
            await o.th12a.write({ duration: 1400 });
          },
        },
        {
          say: 'One-to-one means $A\\mathbf{x} = \\mathbf{0}${A x equals zero} has only the trivial solution, Theorem eleven. So the columns are independent: a pivot in every column, no free variables.',
          do: async (s, o) => {
            await o.th11.write({ duration: 1300 });
            await o.th12b.write({ duration: 1300 });
          },
        },
        {
          say: 'Try this three by two matrix. Row reduce it: two pivots, one in each column, so it\'s one-to-one. But the third row has no pivot, so it\'s not onto $\\mathbb{R}^3${R three}. Two columns can only span a plane in space.',
          do: async (s, o) => {
            await o.m.fadeIn();
            for (const st of TALL_FWD) await o.m.rowOp(st, { duration: 700 });
            await o.m.note();
            await s.all(o.m.pivot(0, 0), o.m.pivot(1, 1), o.m.highlightCol(0, C.green), o.m.highlightCol(1, C.green));
            await o.ok.fadeIn({ shift: [-12, 0] });
            await o.m.highlightRow(2, C.yellow);
            await o.no.fadeIn({ shift: [-12, 0] });
          },
        },
      ],
    },

    // 10
    {
      id: 'try-onto',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Count rows, columns and pivots.',
      prompt: '$T : \\mathbb{R}^4 \\to \\mathbb{R}^3$, $T(\\mathbf{x}) = A\\mathbf{x}$, and $A$ has 3 pivots. Which is true?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '$T$ is onto, not one-to-one', why: 'Right: $A$ is $3 \\times 4$, so 3 pivots fill every row (onto), but one of the 4 columns has no pivot (a free variable, so not one-to-one).' },
        { id: 'b', label: '$T$ is one-to-one, not onto', why: 'Four columns, three pivots: one column is free, so some nonzero $\\mathbf{x}$ maps to $\\mathbf{0}$. And 3 pivots in 3 rows does make it onto.' },
        { id: 'c', label: 'Both', why: 'A map $\\mathbb{R}^4 \\to \\mathbb{R}^3$ can never be one-to-one: at most 3 pivots for 4 columns.' },
        { id: 'd', label: 'Neither', why: '3 pivots in 3 rows: every row has one, so the columns span $\\mathbb{R}^3$.' },
      ],
      hint: '$A$ is $3 \\times 4$. Onto needs a pivot in each of the 3 rows; one-to-one needs a pivot in each of the 4 columns.',
      solution: [
        '$A$ has 3 rows and 4 columns. Three pivots, one per row, means every row has a pivot: the columns span $\\mathbb{R}^3$, so $T$ is **onto**.',
        'But 4 columns with only 3 pivots leaves a free variable, so $A\\mathbf{x} = \\mathbf{0}$ has nontrivial solutions: $T$ is **not one-to-one**.',
      ],
    },

    // 11
    {
      id: 'mistake-order',
      title: 'The trap: composing in the wrong order',
      scene(s) {
        const p = s.plane({ x: 715, y: 300, width: 380, range: [-3, 3, -3, 3], names: ['x_1', 'x_2'] });
        const b = eBasis(p, { label: '' });
        const shape = p.polygon(LETTER, { color: C.blue });
        const Rt = s.tex(`\\text{rotate: } R = ${texMat(ROT)}`, { x: 240, y: 95, size: 32, visible: false });
        const Ft = s.tex(`\\text{reflect: } F = ${texMat(REFL)}`, { x: 240, y: 205, size: 32, visible: false });
        const right = s.tex(`FR = ${texMat(FR)}`, { x: 240, y: 330, size: 34, color: C.green, visible: false });
        const wrong = s.tex(`RF = ${texMat(RF)} \\neq FR`, { x: 240, y: 470, size: 34, color: C.yellow, visible: false });
        const i1 = p.label(nums(FR_E1), `\\mathbf{e}_1 \\mapsto ${pair(FR_E1)}`, { color: C.green, size: 30, offset: [92, 0], transform: false, visible: false });
        const j1 = p.label(nums(FR_E2), `\\mathbf{e}_2 \\mapsto ${pair(FR_E2)}`, { color: C.red, size: 30, offset: [-10, -40], transform: false, visible: false });
        return { p, b, shape, Rt, Ft, right, wrong, i1, j1 };
      },
      steps: [
        {
          say: 'Here\'s a classic trap. First rotate by ninety degrees, then reflect across the $x_1${x one} axis. Do it on the basis: rotate, and then reflect.',
          do: async (s, o) => {
            await o.Rt.write();
            await o.p.applyMatrix(ROT, { duration: 1500 });
            await o.Ft.write();
            await o.p.applyMatrix(REFL, { duration: 1500 });
            await s.all(o.i1.draw(), o.j1.draw());
          },
        },
        {
          say: 'Read off the columns: the combined map is $F(R\\mathbf{x})${F of R x}, whose matrix is $FR${F R}. The map you do first sits on the right, next to $\\mathbf{x}${x}.',
          do: async (s, o) => {
            await o.right.write({ duration: 1200 });
            await o.right.indicate({ color: C.green, scale: 1.06 });
          },
        },
        {
          say: 'Writing them in the order you said them, $RF${R F}, gives a different matrix and a different map. The fix: compose right to left, the first map on the right.',
          do: async (s, o) => {
            await o.wrong.write();
            await s.ring(o.wrong, { color: C.yellow, shape: 'box', pad: 10 });
          },
        },
      ],
    },

    // 12
    {
      id: 'wo-standard',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Track each basis vector through both moves, in order.',
      prompt: 'Find the standard matrix of $T : \\mathbb{R}^2 \\to \\mathbb{R}^2$ that first rotates by $90^\\circ$ counterclockwise and then reflects across the $x_1$-axis.',
      answer: { type: 'matrix', value: FR.map((r) => r.map(String)) },
      hints: [
        `Track $\\mathbf{e}_1$: the rotation sends it to $${pair(ROT_E1)}$, and the reflection then sends that to $${pair(FR_E1)}$.`,
        'Now track $\\mathbf{e}_2$ the same way. The two end points are the columns.',
      ],
      solution: [
        `$\\mathbf{e}_1 \\mapsto ${pair(ROT_E1)} \\mapsto ${pair(FR_E1)}$ and $\\mathbf{e}_2 \\mapsto ${pair(ROT_E2)} \\mapsto ${pair(FR_E2)}$.`,
        `So $A = ${texMat(FR)}$: the reflection across the line $x_2 = -x_1$.`,
        `As a product, $A = FR$ with $F = ${texMat(REFL)}$ and $R = ${texMat(ROT)}$: the first map, $R$, sits on the right. The other order gives $RF = ${texMat(RF)}$, a different map.`,
      ],
    },

    // 13
    {
      id: 'wo-onto',
      kind: 'workout',
      title: 'Work it out',
      say: 'One more on paper. Find every input that lands on this output, then say what that tells you about onto and one-to-one.',
      prompt: WO_ONTO.prompt,
      answer: WO_ONTO.answer,
      hints: WO_ONTO.hints,
      solution: WO_ONTO.solution,
      generate: generateOnto,
    },

    // 14
    {
      id: 'cp-matrix-of-map',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: 'Why is a linear map $T : \\mathbb{R}^n \\to \\mathbb{R}^m$ completely determined by what it does to $\\mathbf{e}_1, \\dots, \\mathbf{e}_n$?',
      points: [
        'Every $\\mathbf{x}$ in $\\mathbb{R}^n$ is $x_1\\mathbf{e}_1 + \\cdots + x_n\\mathbf{e}_n$',
        'Linearity gives $T(\\mathbf{x}) = x_1T(\\mathbf{e}_1) + \\cdots + x_nT(\\mathbf{e}_n)$',
        'That combination is $A\\mathbf{x}$ for the matrix $A$ whose columns are $T(\\mathbf{e}_j)$',
        'So two linear maps that agree on the basis vectors agree on every vector',
      ],
    },

    // 15
    {
      id: 'summary-maps',
      title: 'Summary',
      scene(s) {
        const { p, b } = basisPlane(s, true);
        const A = s.tex(`A = \\begin{bmatrix}\\col{green}{${t(BT_E1[0])}} & \\col{red}{${t(BT_E2[0])}} \\\\ \\col{green}{${t(BT_E1[1])}} & \\col{red}{${t(BT_E2[1])}}\\end{bmatrix}`, { x: 250, y: 120, size: 44, visible: false });
        const items = [
          'Linear: straight grid, $\\mathbf{0}$ fixed',
          'Columns: where each $\\mathbf{e}_j$ lands',
          'Pivots: onto, one-to-one',
        ].map((str, k) => s.text(str, { x: 250, y: 260 + 90 * k, size: 30, visible: false }));
        return { p, b, A, items };
      },
      steps: [
        {
          say: 'A linear map moves the whole plane at once, keeping grid lines straight, parallel and evenly spaced, with the origin fixed.',
          do: async (s, o) => {
            await s.all(o.p.applyMatrix(BT, { duration: 900 }), o.items[0].fadeIn());
          },
        },
        {
          say: 'Its matrix is nothing but a record of where the basis vectors land: column one is $T(\\mathbf{e}_1)${T of e one}, column two is $T(\\mathbf{e}_2)${T of e two}.',
          do: async (s, o) => {
            await o.A.write();
            await s.all(o.b.i.flash({ color: C.green }), o.b.j.flash({ color: C.red }), o.items[1].fadeIn());
          },
        },
        {
          say: 'And the pivots decide the rest: a pivot in every row means onto, a pivot in every column means one-to-one. Next, we\'ll multiply matrices, which means chaining maps together.',
          do: (s, o) => o.items[2].fadeIn(),
        },
      ],
    },
  ],
};
