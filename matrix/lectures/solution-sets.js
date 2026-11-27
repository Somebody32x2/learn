/**
 * Lecture 4 · Solution sets of linear systems (Lay 1.5). Design: matrix/PLAN.md § 4.
 * Every matrix, reduction, solution set and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, mulVec, addVec, eqVec, rref, solve, nullspace, rank, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const X = ['x_1', 'x_2', 'x_3'];

/** Beat 2: one homogeneous equation in R³. */
const PLANE_EQ = [1, -2, 1];
const PLANE_BASIS = nullspace([PLANE_EQ]);

/** Beat 3: an RREF homogeneous system. */
const FILL_R = mat([[1, 0, -3, 0], [0, 1, 2, 0]]);
const FILL_V = nullspace(FILL_R.map((row) => row.slice(0, 3)))[0];

/** Beats 4–8: the running example A, b. */
const A = mat([[1, 2, -3], [2, 5, -4], [1, 3, -1]]);
const B = vec([1, 4, 3]);
const AUG0 = A.map((row) => [...row, F(0)]);
const AUGB = A.map((row, i) => [...row, B[i]]);
const RED0 = rref(AUG0, { augmented: 1 });
const REDB = rref(AUGB, { augmented: 1 });
const VH = nullspace(A)[0];
const SOL = solve(A, B);
const P = SOL.particular;
const P2 = addVec(P, VH);
if (SOL.kind !== 'infinite' || SOL.basis.length !== 1 || !eqVec(SOL.basis[0], VH)) throw new Error('solution-sets: example drifted');

/** Beat 7: candidate particular solutions, checked against A x = b. */
const CANDS = { a: VH, b: P2, c: [P[0], P[1], F(1)], d: vec([0, 0, 0]) };
const PARTICULAR = Object.keys(CANDS).filter((k) => eqVec(mulVec(A, CANDS[k]), B));
if (PARTICULAR.length !== 1) throw new Error('solution-sets: try-particular needs exactly one right choice');
if (mulVec(A, CANDS.c).some((v, i) => v.eq(B[i]))) throw new Error('solution-sets: choice c should break every equation');

/** Beat 11. */
const FREE_N = 5, FREE_PIVOTS = 2;

// ---------------------------------------------------------------- TeX helpers

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;

/** `c + k_1 n_1 + …` with zero terms dropped: `2x_2 - x_3`, `-3 + 7x_3`. */
function affine(c0, coefs, names) {
  let out = F(c0).zero ? '' : t(c0);
  coefs.forEach((k0, j) => {
    const k = F(k0);
    if (k.zero) return;
    const a = k.abs();
    out += (k.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + names[j];
  });
  return out || '0';
}
const lin = (coefs, names = X) => affine(0, coefs, names);

/** Tweens the opacity of a named \part (for building a formula term by term). */
function partOpacity(s, tex, name, to, { duration = 600, delay = 0 } = {}) {
  const els = tex.part(name);
  let from = null;
  return s.clock.tween({
    duration,
    delay,
    start: () => (from = els.map((e) => parseFloat(e.style.opacity || '1'))),
    update: (k) => {
      from ??= els.map((e) => parseFloat(e.style.opacity || '1'));
      els.forEach((e, i) => (e.style.opacity = `${from[i] + (to - from[i]) * k}`));
    },
  });
}
const hideParts = (tex, ...names) => names.forEach((n) => tex.part(n).forEach((e) => (e.style.opacity = '0')));

/** Animates a space line's anchor point (the line slides, keeping its direction). */
function slideLine(s, line, to, { duration = 1400 } = {}) {
  let from = null;
  return s.clock.tween({
    duration,
    start: () => (from = line.through.slice()),
    update: (k) => {
      from ??= line.through.slice();
      line.through = from.map((v, i) => v + (to[i] - v) * k);
      line.redraw();
    },
  });
}
const N = (v) => v.map(Number);

// ---------------------------------------------------------------- workout data

/** Parametric vector form of A x = b: prompt, answer, hints and worked solution, all computed. */
function paramItem(A0, b0) {
  const Am = mat(A0), b = vec(b0);
  const aug = Am.map((row, i) => [...row, b[i]]);
  const red = rref(aug, { augmented: 1 });
  const sol = solve(Am, b);
  const fwd = red.steps.filter((st) => st.phase === 'forward');
  const free = sol.free.map((f) => X[f]);
  const basic = red.pivots.map(([r, c]) => `${X[c]} = ${affine(red.R[r][3], sol.free.map((f) => red.R[r][f].neg()), free)}`);
  const form = `\\mathbf{x} = ${texVec(sol.particular)} + ${sol.basis.map((v, k) => `${free[k]}${texVec(v)}`).join(' + ')}`;
  const checks = Am.map((row, i) => `${row.map((a, j) => `${F(a).sign() < 0 ? `(${t(a)})` : t(a)}(${t(sol.particular[j])})`).join(' + ')} = ${t(b[i])}`);
  const system = Am.map((row, i) => `${lin(row)} &= ${t(b[i])}`).join(' \\\\ ');
  return {
    prompt: `Write the solution set of $$\\begin{aligned} ${system} \\end{aligned}$$ in parametric vector form.`,
    answer: { type: 'solution', particular: sol.particular.map(String), basis: sol.basis.map((v) => v.map(String)) },
    hints: [
      `Row reduce $${texMat(aug, { augment: 3 })}$. Start with ${fwd.slice(0, 2).map((st) => `$${texRowOp(st)}$`).join(' and ')}.`,
      `After the forward phase the matrix is $${texMat(red.echelon, { augment: 3 })}$: one row is a zero row, so one variable is free.`,
      `The reduced echelon form is $${texMat(red.R, { augment: 3 })}$. Solve each pivot row for its basic variable.`,
    ],
    solution: [
      `Row reduce, one operation at a time: ${red.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after, { augment: 3 })}$`).join(', then ')}.`,
      `$${free.join(', ')}$ is free and $${basic.join(',\\ ')}$.`,
      `As a vector: $${form}$.`,
      `Check $\\mathbf{p} = ${tup(sol.particular)}$ in the original equations: ${checks.map((c) => `$${c}$ ✓`).join(', ')}.`,
    ],
  };
}
const WO_A = [[1, 3, -5], [1, 4, -8], [-3, -7, 9]];
const WO_B = [4, 7, -6];
const WO = paramItem(WO_A, WO_B);

/** Fresh problems: a rank-2 3×3 A (row 3 a combination of rows 1–2) with integer RREF, p in [−3, 3]³, b = A p. */
function generateParam(rand) {
  for (;;) {
    const r1 = [1, rand.int(-3, 3), rand.int(-5, 5)];
    const r2 = [rand.nonzero(-3, 3), rand.int(-4, 4), rand.int(-9, 9)];
    const [c1, c2] = [rand.nonzero(-3, 3), rand.nonzero(-2, 2)];
    const r3 = r1.map((v, j) => c1 * v + c2 * r2[j]);
    const Am = [r1, r2, r3];
    if (Am.flat().some((v) => Math.abs(v) > 12) || rank(Am) !== 2) continue;
    const p = [rand.int(-3, 3), rand.int(-3, 3), rand.int(-3, 3)];
    const b = mulVec(mat(Am), vec(p));
    if (b.some((v) => v.abs().cmp(20) > 0)) continue;
    const red = rref(Am.map((row, i) => [...row, b[i]]), { augmented: 1 });
    if (red.pivots.some(([, c]) => c === 2)) continue; // keep x3 the free variable
    const nice = (st) => st.after.every((row) => row.every((v) => v.d === 1n && v.abs().cmp(20) <= 0));
    if (!red.steps.every(nice)) continue;
    const item = paramItem(Am, b);
    if (item.answer.particular.concat(item.answer.basis.flat()).some((v) => Math.abs(Number(v)) > 20)) continue;
    return item;
  }
}

// ---------------------------------------------------------------- shared scene builders

/** Beats 4–5: the augmented matrix of the running example. */
const bigMatrix = (s, rows, opts = {}) => s.matrix(rows, { x: 300, y: 225, size: 40, augment: 3, ...opts });

/** Camera for the translate pictures: looking roughly along v × p, so the two parallel lines show their gap. */
const CAM = { range: 3.5, yaw: 124, pitch: 50 };

function translateSpace(s, { x = 720, y = 290, size = 400, visible = false, shifted = false } = {}) {
  const sp = s.space({ x, y, size, ...CAM, visible });
  const hom = sp.line([0, 0, 0], N(VH), { color: C.blue, width: 4, visible });
  const pv = sp.vector(N(P), { color: C.green, label: '\\mathbf{p}', visible: shifted });
  const shiftL = sp.line(shifted ? N(P) : [0, 0, 0], N(VH), { color: shifted ? C.green : C.blue, width: 4, visible: shifted });
  return { sp, hom, pv, shiftL };
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'solution-sets',
  title: 'Solution sets of linear systems',
  goals: [
    'Know that Ax = 0 always has the trivial solution, and when it has a nontrivial one',
    'Write a solution set in parametric vector form',
    'See the solutions of Ax = b as the solutions of Ax = 0 shifted by one particular solution (Theorem 6)',
  ],
  beats: [
    // 1
    {
      id: 'homog-trivial',
      title: 'Ax = 0 always has a solution',
      scene(s) {
        const eq = s.tex('A\\mathbf{x} = \\part{z}{\\mathbf{0}}', { x: 240, y: 100, size: 52, visible: false });
        const homog = s.text('**homogeneous**: the right side is zero', { x: 240, y: 208, size: 30, width: 380, visible: false });
        const triv = s.tex('\\mathbf{x} = \\mathbf{0}', { x: 240, y: 290, size: 44, color: C.green, visible: false });
        const trivL = s.text('the **trivial** solution', { x: 240, y: 345, size: 30, color: C.green, visible: false });
        const q = s.text('A **nontrivial** solution exists $\\iff$ there is a free variable', { x: 240, y: 465, size: 32, width: 400, visible: false });
        const p = s.plane({ x: 690, y: 300, width: 420, range: [-3, 3, -3, 3], names: ['x_1', 'x_2'], visible: false });
        const origin = p.point([0, 0], { color: C.green, r: 11, visible: false });
        const line = p.span([2, 1], { color: C.yellow, width: 4, visible: false });
        const lineL = s.tex('\\text{e.g. } x_1 - 2x_2 = 0', { x: 690, y: 552, size: 30, color: C.yellow, visible: false });
        return { eq, homog, triv, trivL, q, p, origin, line, lineL };
      },
      steps: [
        {
          say: 'A system is called homogeneous when its right side is the zero vector: $A\\mathbf{x} = \\mathbf{0}${A x equals the zero vector}.',
          do: async (s, o) => {
            await o.eq.write();
            await s.all(s.ring([o.eq, 'z'], { color: C.yellow }), o.homog.fadeIn());
          },
        },
        {
          say: 'Such a system always has a solution: $\\mathbf{x} = \\mathbf{0}${x equals zero} works, because $A${A} times zero is zero. Lay calls it the trivial solution.',
          do: async (s, o) => {
            await o.p.draw({ duration: 900 });
            await s.all(o.origin.draw(), o.triv.write());
            await s.all(o.origin.flash({ color: C.green }), o.trivL.fadeIn());
          },
        },
        {
          say: 'So the real question is whether there\'s a nontrivial solution. There is exactly when the system has a free variable, and then there are infinitely many: a line, a plane, or a bigger span through the origin.',
          do: async (s, o) => {
            await o.q.fadeIn();
            await o.line.draw({ duration: 1000 });
            await o.lineL.fadeIn({ shift: [0, 0] });
          },
        },
      ],
    },

    // 2
    {
      id: 'homog-plane',
      title: 'One equation in ℝ³: a plane',
      scene(s) {
        const [v2, v3] = PLANE_BASIS;
        const eq = s.tex(`x_1 ${PLANE_EQ[1] < 0 ? '-' : '+'} ${Math.abs(PLANE_EQ[1])}\\part{f2}{x_2} + \\part{f3}{x_3} = 0`, { x: 265, y: 80, size: 40, visible: false });
        const free = s.tex('x_2,\\ x_3 \\text{ free}', { x: 265, y: 145, size: 32, color: C.yellow, visible: false });
        const x1 = s.tex(`x_1 = ${lin([0, ...PLANE_EQ.slice(1).map((c) => -c)])}`, { x: 265, y: 210, size: 40, visible: false });
        const entries = [0, 1, 2].map((i) => affine(0, [v2[i], v3[i]], ['x_2', 'x_3']));
        const vecf = s.tex(`\\mathbf{x} = \\begin{bmatrix}x_1\\\\x_2\\\\x_3\\end{bmatrix} = \\begin{bmatrix}${entries.join(' \\\\ ')}\\end{bmatrix}`, { x: 265, y: 330, size: 34, visible: false });
        const split = s.tex(`\\part{t2}{= x_2\\col{blue}{${texVec(v2)}}} \\part{t3}{+\\ x_3\\col{red}{${texVec(v3)}}}`, { x: 265, y: 485, size: 36 });
        hideParts(split, 't2', 't3');
        const sp = s.space({ x: 705, y: 310, size: 340, range: 3, yaw: -35, pitch: 22, visible: false });
        const P = sp.plane(N(v2), N(v3), { color: C.green, visible: false });
        const a = sp.vector(N(v2), { color: C.blue, visible: false });
        const b = sp.vector(N(v3), { color: C.red, visible: false });
        const lab = s.tex(`\\operatorname{Span}\\{\\col{blue}{${tup(v2)}}, \\col{red}{${tup(v3)}}\\}`, { x: 720, y: 550, size: 32, visible: false });
        return { eq, free, x1, vecf, split, sp, P, a, b, lab };
      },
      steps: [
        {
          say: 'Take one homogeneous equation in three unknowns, $x_1 - 2x_2 + x_3 = 0${x one minus two x two plus x three equals zero}. Only $x_1${x one} can be a pivot, so $x_2${x two} and $x_3${x three} are free.',
          do: async (s, o) => {
            await o.eq.write();
            await s.all(o.eq.color('f2', C.yellow), o.eq.color('f3', C.yellow), o.free.fadeIn());
          },
        },
        {
          say: 'Solve for the basic variable, $x_1 = 2x_2 - x_3${x one equals two x two minus x three}, and write the whole solution as one vector.',
          do: async (s, o) => {
            await o.x1.write();
            await o.vecf.write({ duration: 1200 });
          },
        },
        {
          say: 'Now split it by free variables: an $x_2${x two} part and an $x_3${x three} part. That\'s parametric vector form.',
          do: async (s, o) => {
            await s.all(partOpacity(s, o.split, 't2', 1), o.sp.draw());
            await o.a.grow({ duration: 700 });
            await partOpacity(s, o.split, 't3', 1);
            await o.b.grow({ duration: 700 });
          },
        },
        {
          say: 'So the solution set is the span of two vectors: a plane through the origin. Every point on it solves the equation.',
          do: async (s, o) => {
            await s.all(o.P.fadeIn({ shift: [0, 0] }), o.lab.fadeIn());
            await o.sp.orbit(50, 3500);
          },
        },
      ],
    },

    // 3
    {
      id: 'fill-param',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks. Read the free variable off the reduced matrix, and don\'t forget its own entry.',
      prompt: 'The augmented matrix of a homogeneous system reduces to the matrix shown. Write the solution set in parametric vector form.',
      figure(s) {
        const m = s.matrix(FILL_R, { x: 480, y: 330, size: 56, augment: 3 });
        m.pivot(0, 0);
        m.pivot(1, 1);
      },
      lines: [
        [
          '\\mathbf{x} = x_3',
          {
            matrix: [
              [{ id: 'v1', answer: { type: 'number', value: String(FILL_V[0]) } }],
              [{ id: 'v2', answer: { type: 'number', value: String(FILL_V[1]) } }],
              [{ id: 'v3', answer: { type: 'number', value: String(FILL_V[2]) }, hint: '$x_3 = x_3$: the free variable\'s own entry is $1$.' }],
            ],
          },
        ],
      ],
      solution: [
        `Row 1 says $${lin(FILL_R[0].slice(0, 3))} = 0$, so $x_1 = ${lin([0, 0, FILL_R[0][2].neg()])}$. Row 2 says $${lin(FILL_R[1].slice(0, 3))} = 0$, so $x_2 = ${lin([0, 0, FILL_R[1][2].neg()])}$.`,
        `$x_3$ is free, and its own entry is $x_3 = 1 \\cdot x_3$. So $\\mathbf{x} = x_3${texVec(FILL_V)}$.`,
      ],
    },

    // 4
    {
      id: 'worked-homog',
      title: 'A worked example',
      scene(s) {
        const m = bigMatrix(s, AUG0);
        const R = RED0.R;
        const eqs = [
          `x_1 = ${lin([0, 0, R[0][2].neg()])}`,
          `x_2 = ${lin([0, 0, R[1][2].neg()])}`,
          'x_3 \\text{ free}',
        ].map((tx, i) => s.tex(tx, { x: 300, y: 415 + 55 * i, size: 36, visible: false }));
        const form = s.tex(`\\mathbf{x} = x_3\\col{blue}{${texVec(VH)}}`, { x: 300, y: 470, size: 40, visible: false });
        const sp = s.space({ x: 730, y: 320, size: 340, range: 3, yaw: -30, pitch: 20, visible: false });
        const line = sp.line([0, 0, 0], N(VH), { color: C.blue, width: 4, visible: false });
        const lab = s.text('a line through $\\mathbf{0}$', { x: 730, y: 545, size: 30, color: C.blue, visible: false });
        return { m, eqs, form, sp, line, lab };
      },
      steps: [
        {
          say: 'Here\'s a homogeneous system with three equations. Row reduce its augmented matrix. The last column starts at zero and stays zero, since row operations turn zeros into zeros.',
          do: async (s, o) => {
            for (const st of RED0.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), o.m.highlightCol(3, C.muted));
          },
        },
        {
          say: 'Column three has no pivot, so $x_3${x three} is free. The two pivot rows say $x_1 = 7x_3${x one equals seven x three} and $x_2 = -2x_3${x two equals minus two x three}.',
          do: async (s, o) => {
            await s.all(o.m.pivot(0, 0), o.m.pivot(1, 1), o.m.highlightCol(2, C.yellow));
            await s.stagger(o.eqs.map((e) => () => e.write({ duration: 700 })), 800);
          },
        },
        {
          say: 'So every solution is a multiple of $(7, -2, 1)${seven, minus two, one}. The solution set is a line through the origin.',
          do: async (s, o) => {
            await s.all(o.eqs.map((e) => e.fadeOut()), o.form.fadeIn({ delay: 200 }));
            await o.sp.draw();
            await s.all(o.line.draw({ duration: 1000 }), o.lab.fadeIn());
          },
        },
      ],
    },

    // 5
    {
      id: 'nonhomog',
      title: 'Now Ax = b',
      scene(s) {
        const m = bigMatrix(s, AUGB);
        const form = s.tex(`\\mathbf{x} = \\col{green}{${texVec(P)}} + x_3\\col{blue}{${texVec(VH)}}`, { x: 300, y: 475, size: 40, visible: false });
        const pv = s.tex('\\mathbf{x} = \\col{green}{\\mathbf{p}} + x_3\\col{blue}{\\mathbf{v}}', { x: 715, y: 160, size: 44, visible: false });
        const zero = s.tex(`x_3 = 0:\\ \\ \\mathbf{p} = ${tup(P)}`, { x: 715, y: 280, size: 32, color: C.green, visible: false });
        const pL = s.text('one particular solution', { x: 715, y: 330, size: 30, color: C.green, visible: false });
        const vL = s.text('$\\mathbf{v}$ solves $A\\mathbf{x} = \\mathbf{0}$', { x: 715, y: 420, size: 30, color: C.blue, visible: false });
        return { m, form, pv, zero, pL, vL };
      },
      steps: [
        {
          say: 'Now give the same coefficients a right side, $\\mathbf{b} = (1, 4, 3)${b equals one, four, three}. Do the same row operations; this time the last column changes too.',
          do: async (s, o) => {
            await o.m.highlightCol(3, C.green);
            await o.m.clearHighlights();
            for (const st of REDB.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), o.m.pivot(0, 0), o.m.pivot(1, 1));
          },
        },
        {
          say: 'Same free variable, but now there are constants: $\\mathbf{x} = \\mathbf{p} + x_3\\mathbf{v}${x equals p plus x three v}, with the same $\\mathbf{v}${v} as before.',
          do: async (s, o) => {
            await o.form.write({ duration: 1200 });
            await o.pv.fadeIn();
            await o.vL.fadeIn();
          },
        },
        {
          say: 'Set $x_3 = 0${x three equals zero}, and you get one particular solution, $\\mathbf{p} = (-3, 2, 0)${p equals minus three, two, zero}.',
          do: async (s, o) => {
            await o.zero.write();
            await o.pL.fadeIn();
          },
        },
      ],
    },

    // 6
    {
      id: 'translate',
      title: 'A shifted copy',
      scene(s) {
        const thm = s.defCard({
          kind: 'theorem', title: 'Theorem 6', x: 245, y: 30, anchor: [0.5, 0], width: 410,
          body: 'Suppose $A\\mathbf{x} = \\mathbf{b}$ is consistent and $\\mathbf{p}$ is a solution. Then the solutions of $A\\mathbf{x} = \\mathbf{b}$ are exactly the vectors $\\mathbf{p} + \\mathbf{v}_h$, where $\\mathbf{v}_h$ is any solution of $A\\mathbf{x} = \\mathbf{0}$.',
          visible: false,
        });
        const o = translateSpace(s);
        o.thm = thm;
        o.p2 = o.sp.point(N(P2), { color: C.green, r: 10, visible: false });
        o.p2v = o.sp.vector(N(P2), { color: C.green, width: 3, visible: false });
        o.p2L = s.tex(`\\mathbf{p}' = \\mathbf{p} + \\mathbf{v} = ${tup(P2)}`, { x: 245, y: 432, size: 32, color: C.green, visible: false });
        o.uniq = s.tex('\\begin{gathered}\\text{only the trivial solution for } A\\mathbf{x} = \\mathbf{0} \\\\ \\Rightarrow \\text{ a consistent } A\\mathbf{x} = \\mathbf{b} \\text{ has exactly one}\\end{gathered}', { x: 480, y: 520, size: 30, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Here\'s the picture. In blue, the solutions of $A\\mathbf{x} = \\mathbf{0}${A x equals zero}: a line through the origin. In green, one particular solution $\\mathbf{p}${p}.',
          do: async (s, o) => {
            await o.sp.draw();
            await o.hom.draw({ duration: 900 });
            await o.pv.grow();
          },
        },
        {
          say: 'Slide a copy of the blue line along $\\mathbf{p}${p}. It lands on the solutions of $A\\mathbf{x} = \\mathbf{b}${A x equals b}: a parallel line, same direction, now through $\\mathbf{p}${p}.',
          do: async (s, o) => {
            o.shiftL.show();
            await slideLine(s, o.shiftL, N(P));
            await o.shiftL.recolor(C.green);
          },
        },
        {
          say: 'That\'s Theorem 6, and it holds whenever $A\\mathbf{x} = \\mathbf{b}${A x equals b} is consistent. Any particular solution will do: $\\mathbf{p} + \\mathbf{v}${p plus v} lies on the same green line.',
          do: async (s, o) => {
            await o.thm.reveal();
            await s.all(o.p2v.grow({ duration: 700 }), o.p2.draw({ delay: 500 }));
            await o.p2L.fadeIn();
          },
        },
        {
          say: 'And one consequence: if $A\\mathbf{x} = \\mathbf{0}${A x equals zero} has only the trivial solution, the blue line shrinks to a point, so a consistent $A\\mathbf{x} = \\mathbf{b}${A x equals b} has exactly one solution.',
          do: (s, o) => o.uniq.fadeIn(),
        },
      ],
    },

    // 7
    {
      id: 'try-particular',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Which of these also solves the system from the last example?',
      prompt: `The solutions of the last example are $\\mathbf{x} = ${texVec(P)} + x_3${texVec(VH)}$. Which vector is **also** a particular solution of $A\\mathbf{x} = \\mathbf{b}$?`,
      answer: { type: 'choice', value: PARTICULAR[0] },
      choices: [
        { id: 'a', label: `$${tup(CANDS.a)}$`, why: 'That is $\\mathbf{v}$: it solves $A\\mathbf{x} = \\mathbf{0}$, not $A\\mathbf{x} = \\mathbf{b}$.' },
        { id: 'b', label: `$${tup(CANDS.b)}$`, why: 'Right: it is $\\mathbf{p} + 1\\cdot\\mathbf{v}$, the point with $x_3 = 1$.' },
        { id: 'c', label: `$${tup(CANDS.c)}$`, why: `Changing only $x_3$ breaks every equation: $A${tup(CANDS.c)} = ${tup(mulVec(A, CANDS.c))} \\neq \\mathbf{b}$. All the entries move together with $x_3$.` },
        { id: 'd', label: `$${tup(CANDS.d)}$`, why: '$A\\mathbf{0} = \\mathbf{0} \\neq \\mathbf{b}$.' },
      ],
      hint: 'Pick a value of $x_3$ and compute the whole vector.',
      solution: [
        `Every solution has the form $\\mathbf{p} + x_3\\mathbf{v}$. With $x_3 = 1$: $${tup(P)} + ${tup(VH)} = ${tup(P2)}$.`,
        `Check: $A${texVec(P2)} = ${texVec(mulVec(A, P2))} = \\mathbf{b}$ ✓. The vector $${tup(VH)}$ alone gives $A\\mathbf{v} = \\mathbf{0}$, and $${tup(CANDS.c)}$ gives $${tup(mulVec(A, CANDS.c))} \\neq \\mathbf{b}$.`,
      ],
    },

    // 8
    {
      id: 'mistake-subspace',
      title: 'The trap: thinking it passes through 0',
      scene(s) {
        const o = translateSpace(s, { visible: true, shifted: true });
        o.origin = o.sp.point([0, 0, 0], { color: C.yellow, r: 11, visible: false });
        o.not0 = s.tex('\\begin{gathered}\\mathbf{0} \\text{ is not a solution} \\\\ \\text{when } \\mathbf{b} \\neq \\mathbf{0}\\end{gathered}', { x: 240, y: 105, size: 32, color: C.yellow, visible: false });
        o.why = s.tex('A\\mathbf{0} = \\mathbf{0} \\neq \\mathbf{b}', { x: 240, y: 215, size: 36, visible: false });
        o.wrong = s.tex('\\mathbf{x} = x_3\\mathbf{v}', { x: 260, y: 330, size: 40, visible: false });
        o.right = s.tex('\\mathbf{x} = \\col{green}{\\mathbf{p}} + x_3\\mathbf{v}', { x: 260, y: 420, size: 40, color: C.green, visible: false });
        o.keep = s.text('a shifted span: keep the $\\mathbf{p}$', { x: 260, y: 490, size: 30, color: C.green, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Here\'s the trap. The green line looks like a span, but it misses the origin. When $\\mathbf{b}${b} isn\'t zero, $\\mathbf{0}${the zero vector} can\'t be a solution, since $A\\mathbf{0} = \\mathbf{0}${A times zero equals zero}.',
          do: async (s, o) => {
            await o.origin.draw();
            await s.all(s.ring(o.origin, { color: C.yellow, pad: 10 }), o.not0.write());
            await o.why.fadeIn();
          },
        },
        {
          say: 'So don\'t write the answer as a plain span. It\'s a shifted span: keep the $\\mathbf{p}${p}.',
          do: async (s, o) => {
            await o.wrong.write();
            await s.strike(o.wrong, { color: C.yellow });
            await o.right.write();
            await o.keep.fadeIn();
          },
        },
      ],
    },

    // 9
    {
      id: 'recipe',
      title: 'Writing a solution set',
      scene(s) {
        const R = REDB.R;
        const steps = [
          '**1.** Row reduce $[A \\mid \\mathbf{b}]$ to reduced echelon form.',
          '**2.** Write each basic variable in terms of the free ones.',
          '**3.** Write $\\mathbf{x}$ as a vector in the free variables.',
          '**4.** Split it: a constant vector plus one vector per free variable.',
        ].map((str, i) => s.text(str, { x: 45, y: 85 + 128 * i, size: 30, width: 430, align: 'left', anchor: [0, 0.5], visible: false }));
        const entries = [0, 1, 2].map((i) => affine(P[i], [VH[i]], ['x_3']));
        const ex = [
          texMat(R.slice(0, 2), { augment: 3 }),
          `x_1 = ${affine(R[0][3], [R[0][2].neg()], ['x_3'])},\\ x_2 = ${affine(R[1][3], [R[1][2].neg()], ['x_3'])}`,
          `\\mathbf{x} = \\begin{bmatrix}${entries.join(' \\\\ ')}\\end{bmatrix}`,
          `\\mathbf{x} = \\col{green}{${texVec(P)}} + \\part{fv}{x_3\\col{blue}{${texVec(VH)}}}`,
        ].map((tx, i) => s.tex(tx, { x: 712, y: 85 + 128 * i, size: 29, visible: false }));
        const count = s.text('one free variable, one vector', { x: 260, y: 548, size: 30, color: C.yellow, visible: false });
        return { steps, ex, count };
      },
      steps: [
        {
          say: 'Lay\'s recipe has four steps. Reduce, solve for the basic variables, write $\\mathbf{x}${x} as a vector, and split it by free variables. Here they are on our example.',
          do: (s, o) => s.stagger(o.steps.map((st, i) => () => s.all(st.fadeIn({ shift: [-12, 0] }), o.ex[i].write({ delay: 300 }))), 1300),
        },
        {
          say: 'The number of vectors in the span always equals the number of free variables. Here, one free variable gives one vector.',
          do: async (s, o) => {
            await s.ring([o.ex[3], 'fv'], { color: C.yellow, shape: 'box' });
            await o.count.fadeIn();
          },
        },
      ],
    },

    // 10
    {
      id: 'wo-param',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Follow the four steps and write this solution set in parametric vector form.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateParam,
    },

    // 11
    {
      id: 'try-free-count',
      kind: 'try',
      title: 'Your turn',
      say: 'Count before you compute. How many vectors does this solution set need?',
      prompt: `$A$ is a $3 \\times ${FREE_N}$ matrix with ${FREE_PIVOTS} pivot columns, and $A\\mathbf{x} = \\mathbf{b}$ is consistent. Its solution set is a translate of the span of how many vectors?`,
      answer: { type: 'number', value: FREE_N - FREE_PIVOTS },
      hint: 'One vector per free variable.',
      solution: [
        `There are ${FREE_N} variables and ${FREE_PIVOTS} of them are basic, so $${FREE_N} - ${FREE_PIVOTS} = ${FREE_N - FREE_PIVOTS}$ are free.`,
        `Parametric vector form has one vector per free variable: $\\mathbf{x} = \\mathbf{p} + s\\mathbf{u}_1 + t\\mathbf{u}_2 + r\\mathbf{u}_3$, a translate of the span of ${FREE_N - FREE_PIVOTS} vectors.`,
      ],
    },

    // 12
    {
      id: 'cp-translate',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain why Theorem 6 is true, in your own words.',
      prompt: 'Why is every solution of $A\\mathbf{x} = \\mathbf{b}$ of the form $\\mathbf{p} + \\mathbf{v}_h$ with $A\\mathbf{v}_h = \\mathbf{0}$?',
      points: [
        'If $A\\mathbf{w} = \\mathbf{b}$, then $A(\\mathbf{w} - \\mathbf{p}) = \\mathbf{b} - \\mathbf{b} = \\mathbf{0}$, so $\\mathbf{v}_h = \\mathbf{w} - \\mathbf{p}$ solves the homogeneous system',
        'Conversely $A(\\mathbf{p} + \\mathbf{v}_h) = \\mathbf{b} + \\mathbf{0} = \\mathbf{b}$, so every such vector is a solution',
        'Both directions use linearity: $A(\\mathbf{u} + \\mathbf{v}) = A\\mathbf{u} + A\\mathbf{v}$',
        'Geometrically, the solution set is the homogeneous solution set shifted by $\\mathbf{p}$',
      ],
    },

    // 13
    {
      id: 'summary-solsets',
      title: 'Summary',
      scene(s) {
        const left = s.space({ x: 250, y: 280, size: 330, ...CAM, visible: false });
        const hl = left.line([0, 0, 0], N(VH), { color: C.blue, width: 4, visible: false });
        const o0 = left.point([0, 0, 0], { color: C.blue, r: 9, visible: false });
        const right = s.space({ x: 710, y: 280, size: 330, ...CAM, visible: false });
        right.line([0, 0, 0], N(VH), { color: C.muted, width: 3, dash: '8 8' });
        const pr = right.vector(N(P), { color: C.green, label: '\\mathbf{p}', visible: false });
        const hr = right.line(N(P), N(VH), { color: C.green, width: 4, visible: false });
        const lt = s.tex('A\\mathbf{x} = \\mathbf{0}:\\ \\ \\operatorname{Span}\\{\\mathbf{v}\\}', { x: 250, y: 510, size: 34, color: C.blue, visible: false });
        const rt = s.tex('A\\mathbf{x} = \\mathbf{b}:\\ \\ \\mathbf{p} + \\operatorname{Span}\\{\\mathbf{v}\\}', { x: 710, y: 510, size: 34, color: C.green, visible: false });
        return { left, hl, o0, right, pr, hr, lt, rt };
      },
      steps: [
        {
          say: 'Homogeneous systems: the solution set is a span, so it always passes through the origin.',
          do: async (s, o) => {
            await o.left.draw();
            await s.all(o.hl.draw(), o.o0.draw({ delay: 400 }), o.lt.write());
          },
        },
        {
          say: 'Nonhomogeneous systems: the same span, shifted by one particular solution $\\mathbf{p}${p}. Next time we ask when a span has no redundant vectors.',
          do: async (s, o) => {
            await o.right.draw();
            await o.pr.grow({ duration: 700 });
            await s.all(o.hr.draw(), o.rt.write());
          },
        },
      ],
    },
  ],
};
