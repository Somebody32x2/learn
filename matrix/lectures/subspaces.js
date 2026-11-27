/**
 * Lecture 10 · Subspaces, dimension, and rank (Lay 2.8–2.9). Design: matrix/PLAN.md § 10.
 * Every matrix, basis, coordinate vector and answer below is computed with core/linalg.js.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, mul, rref, det, solve, nullspace, colspace, fromCols, mulVec, addVec, subVec, scaleVec, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const X = ['x_1', 'x_2', 'x_3', 'x_4'];
const t = (x) => F(x).tex({ inline: true });

/** The running example (beats 2, 4–6, 9, 14). */
const A = mat([[1, 2, 0, 1], [2, 4, 1, 4], [3, 6, 1, 5]]);
const RED = rref(A);
const PIV = RED.pivots.map(([, c]) => c);
const FREE = [0, 1, 2, 3].filter((c) => !PIV.includes(c));
const NUL = nullspace(A);
const COL = colspace(A);
const RANK = RED.rank;
const N = A[0].length;

/** `2a_1`, `a_1 + 2a_3`: column f of A as a combination of the pivot columns (weights from the RREF). */
function combo(R, f, piv) {
  let out = '';
  piv.forEach((c, r) => {
    const w = F(R[r][f]);
    if (w.zero) return;
    const a = w.abs();
    out += (w.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + `\\mathbf{a}_${c + 1}`;
  });
  return out || '\\mathbf{0}';
}

/** `x_1 = -2x_2 - x_4` lines of the general solution of Ax = 0 from the RREF. */
function nulLines(R, piv) {
  const n = R[0].length;
  const free = [...Array(n).keys()].filter((c) => !piv.includes(c));
  return [...Array(n).keys()].map((c) => {
    if (!piv.includes(c)) return `${X[c]} &\\ \\text{is free}`;
    const r = piv.indexOf(c);
    let out = '';
    for (const f of free) {
      const w = F(R[r][f]).neg();
      if (w.zero) continue;
      const a = w.abs();
      out += (w.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + X[f];
    }
    return `${X[c]} &= ${out || '0'}`;
  });
}

/** A column vector; entry k may be wrapped in \part{<name>k}{…}. */
const vecParts = (v, name, idx = []) =>
  `\\begin{bmatrix}${v.map((x, k) => (idx.includes(k) ? `\\part{${name}${k}}{${t(x)}}` : t(x))).join(' \\\\ ')}\\end{bmatrix}`;
const tuple = (v) => `(${v.map(t).join(', ')})`;

/** Beat 8 and 11: a plane H with a well-separated basis (60° apart), so the coordinate grid reads clearly. */
const B1 = vec([1, 0, 1]);
const B2 = vec([0, 1, 1]);
const XV = addVec(scaleVec(3, B1), B2);
const XW = solve(fromCols([B1, B2]), XV).x;
const K = 0.58; // drawing scale for the 3D picture (purely pictorial; labels show the true coordinates)
const sc = (v) => v.map((x) => Number(x) * K);

/** Beat 11. */
const TRY_X = subVec(scaleVec(2, B1), B2);
const TRY_W = solve(fromCols([B1, B2]), TRY_X).x;
/** `c_1 + c_2 = 1`: row i of c1·b1 + c2·b2 = x. */
function rowEq(i, x) {
  let out = '';
  [[B1[i], 'c_1'], [B2[i], 'c_2']].forEach(([c, name]) => {
    if (c.zero) return;
    const a = c.abs();
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + name;
  });
  return `${out || '0'} = ${t(x[i])}`;
}

// ---------------------------------------------------------------- workout

function basesItem(A0) {
  const M = mat(A0);
  const red = rref(M);
  const piv = red.pivots.map(([, c]) => c);
  const free = [0, 1, 2, 3].filter((c) => !piv.includes(c));
  const nul = nullspace(M);
  const colB = colspace(M);
  return {
    prompt: `For $$A = ${texMat(M)},$$ find a basis for $\\operatorname{Nul} A$. Enter the basis vectors.`,
    answer: { type: 'basis', value: nul.map((v) => v.map(String)) },
    hints: [
      `The reduced echelon form of $A$ is $${texMat(red.R)}$.`,
      `The free variables are $${free.map((f) => X[f]).join(', ')}$. Solve each nonzero row for its basic variable, then write $\\mathbf{x}$ as a combination of vectors, one per free variable.`,
    ],
    solution: [
      `Row reduce: ${red.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after)}$`).join(', then ')}. That is the reduced echelon form.`,
      `Pivots in columns ${piv.map((c) => c + 1).join(' and ')}, so $${free.map((f) => X[f]).join(', ')}$ are free and $\\begin{aligned} ${nulLines(red.R, piv).join(' \\\\ ')} \\end{aligned}$`,
      `So $\\mathbf{x} = ${free.map((f, k) => `${X[f]}${texVec(nul[k])}`).join(' + ')}$, and a basis for $\\operatorname{Nul} A$ is $\\left\\{${nul.map(texVec).join(', ')}\\right\\}$.`,
      `For comparison: a basis for $\\operatorname{Col} A$ is the pivot columns of $A$ itself, $${colB.map(texVec).join(', ')}$. Rank $${piv.length}$ plus $\\dim\\operatorname{Nul} A = ${nul.length}$ gives $${piv.length + nul.length} = n$.`,
    ],
  };
}
const WO = basesItem([[1, 3, 2, 1], [2, 6, 5, 4], [1, 3, 1, -1]]);

/** A random 3×4 rank-2 matrix with integer RREF: a 2-pivot RREF times an invertible E with det ±1. */
function generateBases(rand) {
  for (;;) {
    const p2 = rand.int(1, 2);
    const R = [[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    R[1][p2] = 1;
    for (let j = 1; j < 4; j++) if (j !== p2) R[0][j] = rand.int(-3, 3);
    for (let j = p2 + 1; j < 4; j++) R[1][j] = rand.int(-3, 3);
    if (R[0].filter((v) => v !== 0).length + R[1].filter((v) => v !== 0).length < 5) continue;
    const E = [0, 1, 2].map(() => [0, 1, 2].map(() => rand.int(-2, 2)));
    if (E[0][0] !== 1 || !det(mat(E)).abs().eq(1)) continue;
    const M = mul(mat(E), mat(R));
    if (M.some((row) => row.some((v) => v.abs().cmp(20) > 0))) continue;
    if (M.some((row) => row.every((v) => v.zero))) continue;
    if ([0, 1, 2, 3].some((j) => M.every((row) => row[j].zero))) continue;
    const red = rref(M);
    if (!red.steps.every((st) => st.after.every((row) => row.every((v) => v.d <= 6n && v.abs().cmp(20) <= 0)))) continue;
    return basesItem(M);
  }
}

// ---------------------------------------------------------------- scene helpers

function paint(tex, name, color) {
  for (const e of tex.part(name)) e.style.color = color;
  return tex;
}

/** Beats 2 and 14: ℝ⁴ → ℝ³, with Nul A in the source and Col A in the target. */
function worlds(s, { y = 400, visible = false } = {}) {
  const L = [200, y], R = [760, y], r = 105;
  return {
    c4: s.circle(L[0], L[1], r, { color: C.muted, width: 3, visible }),
    c3: s.circle(R[0], R[1], r, { color: C.muted, width: 3, visible }),
    l4: s.tex('\\mathbb{R}^4', { x: L[0], y: y - r - 30, size: 36, visible }),
    l3: s.tex('\\mathbb{R}^3', { x: R[0], y: y - r - 30, size: 36, visible }),
    nul: s.polygon([[L[0] - 85, L[1] + 18], [L[0] + 30, L[1] + 58], [L[0] + 85, L[1] - 18], [L[0] - 30, L[1] - 58]], { color: C.red, fill: FILL.red, width: 3, visible }),
    col: s.polygon([[R[0] - 88, R[1] + 30], [R[0] + 20, R[1] + 60], [R[0] + 88, R[1] - 30], [R[0] - 20, R[1] - 60]], { color: C.blue, fill: FILL.blue, width: 3, visible }),
    o4: s.dot(L[0], L[1], { r: 7, visible }),
    o3: s.dot(R[0], R[1], { r: 7, visible }),
    map: s.arrow(L[0] + r + 20, y, R[0] - r - 20, y, { color: C.ink, visible }),
    mapL: s.tex('\\mathbf{x} \\mapsto A\\mathbf{x}', { x: 480, y: y - 32, size: 32, visible }),
    send: s.path(`M ${L[0] + 30} ${L[1] + 30} Q 480 ${y + 150} ${R[0] - 8} ${R[1] + 12}`, { color: C.red, width: 3, dash: true, visible }),
    nulL: s.tex('\\operatorname{Nul} A', { x: L[0] - 55, y: y - 70, size: 30, color: C.red, visible }),
    colL: s.tex('\\operatorname{Col} A', { x: R[0] + 50, y: y - 75, size: 30, color: C.blue, visible }),
  };
}

const quadrants = (p, visible = false) => [
  p.polygon([[0, 0], [3, 0], [3, 3], [0, 3]], { color: C.blue, width: 0, visible }),
  p.polygon([[0, 0], [-3, 0], [-3, -3], [0, -3]], { color: C.blue, width: 0, visible }),
];
const U2 = [1, 2];
const V2 = [-2, -1];
const S2 = [U2[0] + V2[0], U2[1] + V2[1]];

// ---------------------------------------------------------------- the lecture

export default {
  id: 'subspaces',
  title: 'Subspaces, dimension, and rank',
  goals: [
    'Define a subspace of ℝⁿ and test the three conditions',
    'Find bases for Col A (pivot columns of A) and Nul A (from the parametric solution)',
    'Compute coordinates relative to a basis of a subspace',
    'Use dimension, rank, the Rank Theorem and the Basis Theorem',
  ],
  beats: [
    // 1
    {
      id: 'what-subspace',
      title: 'Flat things through the origin',
      scene(s) {
        const def = s.defCard({
          y: 116, width: 880, title: 'Subspace',
          body: 'A **subspace** $H$ of $\\mathbb{R}^n$ contains $\\mathbf{0}$ and is closed under sums and scalar multiples.',
          visible: false,
        });
        const sp = s.space({ x: 260, y: 392, size: 280, range: 3, yaw: -30, pitch: 18, visible: false });
        const P = sp.plane([1, 0, 0.35], [0, 1, 0.3], { color: C.green, visible: false });
        const Ln = sp.line([0, 0, 0], [1, -1.2, 1.6], { color: C.green, width: 4, visible: false });
        const O = sp.point([0, 0, 0], { r: 7, visible: false });
        const pu = sp.vector([1.4, 0, 0.49], { color: C.blue, visible: false });
        const pv = sp.vector([0, 1.5, 0.45], { color: C.red, visible: false });
        const pw = sp.vector([1.4, 1.5, 0.94], { color: C.teal, visible: false });
        const Q = sp.plane({ normal: [0, 0, 1], d: 2.3 }, { color: C.yellow, extent: 1.5, visible: false });
        const ok = s.text('✓ through 0', { x: 160, y: 545, size: 30, color: C.green, visible: false });
        const bad = s.text('✗ misses 0', { x: 370, y: 545, size: 30, color: C.yellow, visible: false });
        const p = s.plane({ x: 720, y: 418, width: 290, range: [-3, 3, -3, 3], labels: false, visible: false });
        const quads = quadrants(p);
        const ht = s.tex('H = \\{(x_1, x_2) : x_1x_2 \\ge 0\\}', { x: 720, y: 232, size: 32, visible: false });
        const u = p.vector(U2, { color: C.blue, label: '\\mathbf{u}', visible: false });
        const v = p.vector(V2, { color: C.red, label: '\\mathbf{v}', visible: false });
        const sum = p.vector(S2, { color: C.yellow, label: '\\mathbf{u}+\\mathbf{v}', visible: false });
        const st = s.stamp('sum escapes', { x: 260, y: 380, color: 'yellow' });
        return { def, sp, P, Ln, O, pu, pv, pw, Q, ok, bad, p, quads, ht, u, v, sum, st };
      },
      steps: [
        {
          say: 'A subspace is a set of vectors that contains the zero vector and is closed under adding and scaling: combine vectors in it, and you never leave it.',
          do: (s, o) => o.def.reveal(),
        },
        {
          say: 'Lines and planes through the origin qualify. Add two vectors in this plane, or stretch one, and you stay in the plane.',
          do: async (s, o) => {
            await o.sp.draw();
            await s.all(o.P.fadeIn({ shift: [0, 0] }), o.O.draw());
            await o.Ln.draw();
            await s.all(o.pu.grow(), o.pv.grow({ delay: 150 }));
            await o.pw.grow();
            await o.pu.moveTo([2.24, 0, 0.78]);
            await o.ok.fadeIn();
          },
        },
        {
          say: 'A plane that misses the origin fails at once: it doesn\'t contain zero.',
          do: async (s, o) => {
            await o.Q.fadeIn({ shift: [0, 0] });
            await o.bad.fadeIn();
            await o.sp.orbit(30, 2500);
          },
        },
        {
          say: 'And here\'s a subtler failure: the first and third quadrants. It contains zero and is closed under scaling, but the vector $(1,2)${one, two} plus the vector $(-2,-1)${minus two, minus one} gives $(-1,1)${minus one, one}, which escapes.',
          do: async (s, o) => {
            await s.all(o.sp.fadeOut(), o.ok.fadeOut(), o.bad.fadeOut(), o.p.draw(), o.ht.write());
            await s.all(o.quads.map((q) => q.fadeIn({ shift: [0, 0] })));
            await s.all(o.u.grow(), o.v.grow({ delay: 200 }));
            await o.p.addTip(o.u, o.v);
            await o.sum.grow();
            await o.st.slam();
          },
        },
      ],
    },

    // 2
    {
      id: 'col-nul',
      title: 'Two subspaces from every matrix',
      scene(s) {
        const m = s.matrix(A, { x: 480, y: 128, size: 32, visible: false });
        const w = worlds(s);
        const dN = s.tex('\\operatorname{Nul} A = \\{\\mathbf{x} : A\\mathbf{x} = \\mathbf{0}\\}', { x: 220, y: 548, size: 30, color: C.red, visible: false });
        const dC = s.tex('\\operatorname{Col} A = \\operatorname{Span}\\{\\mathbf{a}_1, \\dots, \\mathbf{a}_4\\}', { x: 718, y: 548, size: 30, color: C.blue, visible: false });
        const thm = s.defCard({ kind: 'theorem', title: false, x: 480, y: 530, body: '**Theorem 12.** $\\operatorname{Nul} A$ ($A$ is $m \\times n$) is a subspace of $\\mathbb{R}^n$.', visible: false });
        return { m, w, dN, dC, thm };
      },
      steps: [
        {
          say: 'Every matrix comes with two subspaces. The column space, $\\operatorname{Col} A${the column space of A}, is all combinations of the columns. Each column has three entries, so it lives in $\\mathbb{R}^3${R three}.',
          do: async (s, o) => {
            await o.m.fadeIn();
            await s.all([0, 1, 2, 3].map((j) => o.m.highlightCol(j, C.blue, { delay: j * 150 })));
            await s.all(o.w.c3.draw(), o.w.l3.fadeIn(), o.w.o3.draw());
            await s.all(o.w.col.draw(), o.w.colL.fadeIn());
            await o.dC.write();
          },
        },
        {
          say: 'The null space, $\\operatorname{Nul} A${the null space of A}, is every solution of $A\\mathbf{x} = \\mathbf{0}${A x equals zero}: all the vectors $A${A} sends to zero. Those have four entries, so it lives in $\\mathbb{R}^4${R four}.',
          do: async (s, o) => {
            await o.m.clearHighlights();
            await s.all(o.w.c4.draw(), o.w.l4.fadeIn(), o.w.o4.draw());
            await s.all(o.w.map.draw(), o.w.mapL.fadeIn());
            await s.all(o.w.nul.draw(), o.w.nulL.fadeIn());
            await o.w.send.draw({ duration: 1000 });
            await o.dN.write();
          },
        },
        {
          say: 'Different worlds. The null space sits in $\\mathbb{R}^n${R n}, one slot per column; the column space sits in $\\mathbb{R}^m${R m}, one slot per row. Keep track of which is which.',
          do: async (s, o) => {
            const b = o.m.box();
            o.bn = s.brace(b.x + 20, b.y + b.h + 4, b.x + b.w - 20, b.y + b.h + 4, { label: 'n = 4', side: 'below', size: 30, labelColor: C.red, color: C.red, visible: false });
            o.bm = s.brace(b.x - 6, b.y + 10, b.x - 6, b.y + b.h - 10, { label: 'm = 3', side: 'left', size: 30, labelColor: C.blue, color: C.blue, visible: false });
            await s.all(o.bn.draw(), o.w.l4.indicate({ color: C.red }));
            await s.all(o.bm.draw(), o.w.l3.indicate({ color: C.blue }));
            await s.all(o.dN.fadeOut(), o.dC.fadeOut());
            await o.thm.reveal();
          },
        },
      ],
    },

    // 3
    {
      id: 'try-subspace',
      kind: 'try',
      title: 'Your turn',
      say: 'Check all three conditions on this set. Don\'t stop at the first two.',
      prompt: 'Is $H = \\{(x_1, x_2) : x_1x_2 \\ge 0\\}$ (the first and third quadrants, axes included) a subspace of $\\mathbb{R}^2$?',
      figure(s) {
        const p = s.plane({ x: 480, y: 310, width: 480, range: [-3, 3, -3, 3], labels: false });
        quadrants(p, true);
        s.tex('H', { x: 640, y: 160, size: 56, color: C.blue });
      },
      answer: { type: 'choice', value: 'no' },
      choices: [
        { id: 'yes', label: 'Yes', why: 'It contains $\\mathbf{0}$ and is closed under scaling, but check sums: $(1,2) + (-2,-1) = (-1,1)$.' },
        { id: 'no', label: 'No', why: 'Right: two vectors in $H$ can add up to a vector outside $H$.' },
      ],
      hint: 'Add a vector from the first quadrant to one from the third.',
      solution: [
        '$\\mathbf{0} = (0,0)$ is in $H$, and $c\\mathbf{u}$ stays in $H$: $(cx_1)(cx_2) = c^2 x_1x_2 \\ge 0$.',
        `But $(1,2)$ and $(-2,-1)$ are in $H$ while their sum $(${S2.join(', ')})$ has $x_1x_2 = ${S2[0] * S2[1]} < 0$. $H$ is not closed under addition, so it is not a subspace.`,
      ],
    },

    // 4
    {
      id: 'basis-col',
      title: 'A basis for Col A',
      scene(s) {
        const def = s.defCard({ y: 92, width: 860, title: 'Basis', body: 'A **basis** for $H$ is a linearly independent set that spans $H$.', visible: false });
        const m = s.matrix(A, { x: 330, y: 300, size: 40 });
        const lab = s.defCard({ kind: 'theorem', title: false, x: 480, y: 94, width: 860, body: '**Theorem 13.** The pivot columns of a matrix $A$ form a basis for $\\operatorname{Col} A$.', visible: false });
        const basis = s.tex(`\\left\\{ \\col{blue}{${texVec(COL[0])}},\\ \\col{red}{${texVec(COL[1])}} \\right\\}`, { x: 760, y: 300, size: 38, visible: false });
        const bl = s.text('basis for Col A', { x: 760, y: 410, size: 30, color: C.green, visible: false });
        const rel = s.tex(FREE.map((f) => `\\mathbf{a}_${f + 1} = ${combo(RED.R, f, PIV)}`).join(',\\qquad '), { x: 480, y: 530, size: 36, visible: false });
        return { def, m, lab, basis, bl, rel };
      },
      steps: [
        {
          say: 'A basis is an efficient description of a subspace: a set that spans it, with no redundancy, meaning it is linearly independent.',
          do: (s, o) => o.def.reveal(),
        },
        {
          say: 'Row reduce $A${A}. The pivot columns, here columns one and three, tell you which columns to take. But take them from $A${A} itself: Theorem 13 says the pivot columns of $A${A} form a basis for its column space.',
          do: async (s, o) => {
            for (const st of RED.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), RED.pivots.map(([i, j]) => o.m.pivot(i, j)));
            await o.m.setRows(A);
            await s.all(o.m.highlightCol(PIV[0], C.blue), o.m.highlightCol(PIV[1], C.red));
            await s.all(o.basis.write(), o.bl.fadeIn({ delay: 400 }));
            await o.def.fadeOut();
            await o.lab.reveal();
          },
        },
        {
          say: 'The other columns add nothing new: column two is $2${two} times column one, and column four is column one plus $2${two} times column three.',
          do: async (s, o) => {
            await s.all(FREE.map((f) => o.m.highlightCol(f, C.muted)));
            await o.rel.write();
          },
        },
      ],
    },

    // 5
    {
      id: 'basis-nul',
      title: 'A basis for Nul A',
      scene(s) {
        const m = s.matrix(RED.R, { x: 200, y: 140, size: 32 });
        RED.pivots.forEach(([i, j]) => m.pivot(i, j));
        const eqs = s.tex(`\\begin{aligned} ${nulLines(RED.R, PIV).join(' \\\\ ')} \\end{aligned}`, { x: 200, y: 400, size: 34, visible: false });
        const form = s.tex(
          `\\mathbf{x} = ${FREE.map((f, k) => `${X[f]}\\underbrace{${vecParts(NUL[k], `v${k}`, FREE)}}_{\\mathbf{${'uv'[k]}}}`).join(' + ')}`,
          { x: 660, y: 270, size: 38, visible: false },
        );
        const basis = s.tex('\\{\\mathbf{u}, \\mathbf{v}\\}\\ \\text{is a basis for}\\ \\operatorname{Nul} A', { x: 660, y: 500, size: 34, color: C.green, visible: false });
        return { m, eqs, form, basis };
      },
      steps: [
        {
          say: 'For the null space, solve $A\\mathbf{x} = \\mathbf{0}${A x equals zero}. From the reduced form, $x_2${x two} and $x_4${x four} are free, and the basic variables are written in terms of them.',
          do: async (s, o) => {
            await s.all(FREE.map((f) => o.m.highlightCol(f, C.yellow)));
            await o.eqs.write({ duration: 1400 });
          },
        },
        {
          say: 'Now write $\\mathbf{x}${x} in parametric vector form: $x_2${x two} times one vector plus $x_4${x four} times another.',
          do: (s, o) => o.form.fadeIn({ shift: [-40, 0], duration: 900 }),
        },
        {
          say: 'These vectors are automatically independent. Look at the free slots: each vector has a $1${one} exactly where the other has a $0${zero}, so neither is a multiple of the other.',
          do: async (s, o) => {
            o.rings = [];
            for (const f of FREE) {
              o.rings.push(s.ring([o.form, `v0${f}`], { color: 'yellow' }), s.ring([o.form, `v1${f}`], { color: 'yellow' }));
              await s.wait(500);
            }
            await s.all(o.rings);
          },
        },
        {
          say: 'They span the solution set, and they are independent, so they form a basis for the null space. One basis vector per free variable.',
          do: (s, o) => o.basis.write(),
        },
      ],
    },

    // 6
    {
      id: 'mistake-echelon-cols',
      title: 'The trap: columns of the echelon form',
      scene(s) {
        const R = s.matrix(RED.R, { x: 250, y: 200, size: 34, visible: false });
        const M = s.matrix(A, { x: 710, y: 200, size: 34, visible: false });
        const rl = s.text('echelon form', { x: 250, y: 75, size: 30, color: C.muted, visible: false });
        const ml = s.text('A', { x: 710, y: 75, size: 32, visible: false });
        const rs = s.tex(`\\{${PIV.map((c) => `(${RED.R.map((row) => t(row[c])).join(', ')})`).join(',\\ ')}\\}`, { x: 250, y: 360, size: 32, visible: false });
        const rn = s.text('third entry always 0', { x: 250, y: 412, size: 30, color: C.yellow, visible: false });
        const ms = s.tex(`\\{${COL.map(tuple).join(',\\ ')}\\}`, { x: 710, y: 360, size: 32, color: C.green, visible: false });
        const mn = s.text('✓ a basis for Col A', { x: 710, y: 412, size: 30, color: C.green, visible: false });
        const a1 = s.tex(`\\mathbf{a}_1 = (${A.map((row, i) => (i === 2 ? `\\part{z}{${t(row[0])}}` : t(row[0]))).join(', ')}) \\in \\operatorname{Col} A`, { x: 480, y: 510, size: 36, visible: false });
        const st = s.stamp('wrong basis', { x: 145, y: 472, color: 'yellow', size: 30 });
        return { R, M, rl, ml, rs, rn, ms, mn, a1, st };
      },
      steps: [
        {
          say: 'Here\'s the trap: taking the pivot columns of the echelon form. Row operations change the column space. Every combination of these two columns has third entry zero.',
          do: async (s, o) => {
            await s.all(o.R.fadeIn(), o.rl.fadeIn());
            await s.all(PIV.map((c) => o.R.highlightCol(c, C.yellow)));
            await o.rs.write();
            await o.rn.fadeIn();
          },
        },
        {
          say: 'But the first column of $A${A}, $(1, 2, 3)${one, two, three}, is in the column space, and its third entry is $3${three}. So those echelon columns can\'t span it.',
          do: async (s, o) => {
            await o.a1.write();
            await s.ring([o.a1, 'z'], { color: 'yellow' });
            await s.all(s.strike(o.rs, { color: 'yellow' }), o.st.slam());
          },
        },
        {
          say: 'Use the echelon form only to locate the pivot columns. Then go back to $A${A} and take those columns from there.',
          do: async (s, o) => {
            await s.all(o.M.fadeIn(), o.ml.fadeIn());
            await s.all(o.M.highlightCol(PIV[0], C.blue), o.M.highlightCol(PIV[1], C.red));
            await o.ms.write();
            await o.mn.fadeIn();
          },
        },
      ],
    },

    // 7
    {
      id: 'fill-rank',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'No matrix needed, just the sizes. Fill these in.',
      lines: [
        ['A \\text{ is } 5\\times 7,\\ \\operatorname{rank} A = 3:\\quad \\dim\\operatorname{Nul} A = ', { id: 'dim', answer: { type: 'number', value: String(7 - 3) } }],
        [{ tex: '\\operatorname{Col} A \\subseteq \\mathbb{R}^{\\blank{m}}', blanks: { m: { answer: { type: 'number', value: '5' }, width: 1.6, hint: 'Each column has one entry per row.' } } }],
      ],
      solution: [
        `By the Rank Theorem, $\\dim\\operatorname{Nul} A = n - \\operatorname{rank} A = 7 - 3 = ${7 - 3}$: four of the seven columns are free.`,
        'Each column of $A$ has 5 entries (one per row), so $\\operatorname{Col} A$ is a subspace of $\\mathbb{R}^5$.',
      ],
    },

    // 8
    {
      id: 'coordinates',
      title: 'Coordinates in a subspace',
      scene(s) {
        const sp = s.space({ x: 260, y: 415, size: 440, range: 3, yaw: 120, pitch: 22, axes: false, visible: false });
        const [u, v] = [B1.map(Number), B2.map(Number)];
        const at = (c1, c2) => u.map((x, k) => c1 * x + c2 * v[k]);
        // The plane's own grid: segments c1 = const (along b2) and c2 = const (along b1), inside c1 ∈ [−0.5, 3.5], c2 ∈ [−1, 2].
        const seg = (p, q, opts) => sp.vector(sc(q.map((x, k) => x - p[k])), { tail: sc(p), head: 0, width: 2, color: C.teal, ...opts, visible: false });
        const grid = [
          ...[0, 1, 2, 3].map((c1) => seg(at(c1, -1), at(c1, 2))),
          ...[-1, 0, 1, 2].map((c2) => seg(at(-0.5, c2), at(3.5, c2))),
        ];
        const patch = sp.plane(sc(u), sc(v), { color: C.teal, extent: 2, center: sc(at(1.5, 0.5)), visible: false });
        const P = s.dot(...sp.toStage([0, 0, 0]), { r: 7, visible: false });
        const pl = s.tex(`\\col{blue}{\\mathbf{b}_1 = ${tuple(B1)}},\\ \\ \\col{red}{\\mathbf{b}_2 = ${tuple(B2)}}`, { x: 265, y: 548, size: 30, visible: false });
        const b1 = sp.vector(sc(B1), { color: C.blue, label: '\\mathbf{b}_1', visible: false });
        const b2 = sp.vector(sc(B2), { color: C.red, label: '\\mathbf{b}_2', visible: false });
        const steps = [1, 2].map((k) => sp.vector(sc(B1), { tail: sc(B1.map((x) => F(x).mul(k))), color: C.blue, visible: false }));
        const lastB2 = sp.vector(sc(B2), { tail: sc(B1.map((x) => F(x).mul(XW[0]))), color: C.red, visible: false });
        const xv = sp.vector(sc(XV), { color: C.green, label: `\\mathbf{x}`, width: 6, visible: false });
        const xt = s.tex(`\\mathbf{x} = ${tuple(XV)} = ${t(XW[0])}\\col{blue}{\\mathbf{b}_1} + ${t(XW[1])}\\col{red}{\\mathbf{b}_2}`, { x: 690, y: 90, size: 34, visible: false });
        const xb = s.tex(`[\\mathbf{x}]_{\\mathcal{B}} = ${texVec(XW)}`, { x: 720, y: 195, size: 38, color: C.green, visible: false });
        const p = s.plane({ x: 720, y: 425, width: 300, range: [-1, 4, -1, 2], names: ['c_1', 'c_2'], visible: false });
        const e1 = p.vector([1, 0], { color: C.blue, visible: false });
        const e2 = p.vector([0, 1], { color: C.red, visible: false });
        const pt = p.point(XW.map(Number), { color: C.green, label: `(${XW.map(t).join(', ')})`, visible: false });
        return { sp, P, patch, pl, grid, b1, b2, steps, lastB2, xv, xt, xb, p, e1, e2, pt };
      },
      steps: [
        {
          say: 'Take a plane $H${H} through the origin in $\\mathbb{R}^3${R three}, with basis $\\mathbf{b}_1${b one} and $\\mathbf{b}_2${b two}. A basis gives the plane its own coordinate grid.',
          do: async (s, o) => {
            o.sp.show();
            await s.all(o.patch.fadeIn({ shift: [0, 0] }), o.P.draw(), o.pl.fadeIn());
            await s.all(o.b1.grow(), o.b2.grow({ delay: 200 }));
            await s.all(o.grid.map((g, k) => g.draw({ delay: k * 60, duration: 600 })));
          },
        },
        {
          say: 'To reach $\\mathbf{x} = (3, 1, 4)${x equals three, one, four}, walk three steps of $\\mathbf{b}_1${b one} and one step of $\\mathbf{b}_2${b two}. Those weights are the coordinates of $\\mathbf{x}${x} relative to the basis.',
          do: async (s, o) => {
            await o.xt.write();
            await s.stagger(o.steps.map((v) => () => v.grow({ duration: 500 })), 450);
            await o.lastB2.grow({ duration: 500 });
            await o.xv.grow();
            await o.xb.write();
          },
        },
        {
          say: 'So the plane is a copy of $\\mathbb{R}^2${R two}: two numbers describe each of its points, even though the points themselves live in $\\mathbb{R}^3${R three}.',
          do: async (s, o) => {
            await o.p.draw();
            await s.all(o.e1.grow(), o.e2.grow());
            await o.pt.draw();
            await o.pt.indicate({ color: C.green });
          },
        },
      ],
    },

    // 9
    {
      id: 'rank-theorem',
      title: 'Dimension and the Rank Theorem',
      scene(s) {
        const dim = s.text('**dim** $H$ = the number of vectors in any basis of a nonzero subspace $H$ ($\\dim\\{\\mathbf{0}\\} = 0$); **rank** $A = \\dim\\operatorname{Col} A$.', { x: 480, y: 82, size: 30, width: 860, align: 'left', visible: false });
        const m = s.matrix(RED.R, { x: 290, y: 268, size: 38, visible: false });
        const counts = [0, 1, 2, 3].map((j) => {
          const isP = PIV.includes(j);
          const k = (isP ? PIV : FREE).indexOf(j) + 1;
          return { j, isP, k };
        });
        const thm = s.defCard({ kind: 'theorem', title: 'Theorem 14 (The Rank Theorem)', body: 'If $A$ has $n$ columns, then $\\operatorname{rank} A + \\dim\\operatorname{Nul} A = n$.', x: 480, y: 503, width: 860, visible: false });
        const rk = s.tex(`\\operatorname{rank} A = \\col{blue}{${RANK}}`, { x: 720, y: 210, size: 38, visible: false });
        const dn = s.tex(`\\dim\\operatorname{Nul} A = \\col{yellow}{${NUL.length}}`, { x: 720, y: 290, size: 38, visible: false });
        const sum = s.tex(`\\col{blue}{${RANK}} + \\col{yellow}{${NUL.length}} = ${N} = n`, { x: 720, y: 370, size: 40, color: C.green, visible: false });
        return { dim, m, counts, thm, rk, dn, sum };
      },
      steps: [
        {
          say: 'The dimension of a subspace counts the vectors in a basis; every basis has the same number. The rank of $A${A} is the dimension of its column space.',
          do: async (s, o) => {
            await o.dim.fadeIn();
            await o.m.fadeIn();
          },
        },
        {
          say: 'Pivot columns give a basis for the column space, so the rank is the number of pivot columns. Free columns each give one null space basis vector.',
          do: async (s, o) => {
            await s.all(RED.pivots.map(([i, j]) => o.m.pivot(i, j)), PIV.map((j) => o.m.highlightCol(j, C.blue)));
            o.tags = o.counts.map(({ j, isP, k }) => {
              const b = o.m.colBox(j);
              return s.tex(`${k}`, { x: b.cx, y: b.y + b.h + 30, size: 32, color: isP ? C.blue : C.yellow, visible: false });
            });
            await s.all(o.counts.map((c, k) => (c.isP ? o.tags[k].fadeIn() : null)), o.rk.write());
            await s.all(FREE.map((j) => o.m.highlightCol(j, C.yellow)));
            await s.all(o.counts.map((c, k) => (c.isP ? null : o.tags[k].fadeIn())), o.dn.write());
          },
        },
        {
          say: 'Every column is one or the other, pivot or free. So the two counts add up to $n${n}, the number of columns. That\'s the Rank Theorem.',
          do: async (s, o) => {
            await o.sum.write();
            await o.thm.reveal();
          },
        },
      ],
    },

    // 10
    {
      id: 'basis-theorem',
      title: 'The Basis Theorem and the IMT',
      scene(s) {
        const thm = s.defCard({
          kind: 'theorem', title: 'Theorem 15 (The Basis Theorem)', x: 480, y: 118, width: 880,
          body: 'For a $p$-dimensional subspace $H$ of $\\mathbb{R}^n$: any $p$ independent vectors in $H$, or any $p$ vectors spanning $H$, form a basis.',
          visible: false,
        });
        const p = s.plane({ x: 770, y: 405, width: 250, range: [-3, 3, -3, 3], labels: false, visible: false });
        const b = p.basis({ visible: false });
        const imtT = s.text('IMT, continued ($A$ is $n \\times n$):', { x: 60, y: 240, size: 30, weight: 600, align: 'left', anchor: [0, 0.5], visible: false });
        const items = [
          '(m) the columns of $A$ form a basis of $\\mathbb{R}^n$',
          '(n) $\\operatorname{Col} A = \\mathbb{R}^n$',
          '(o) $\\dim\\operatorname{Col} A = n$',
          '(p) $\\operatorname{rank} A = n$',
          '(q) $\\operatorname{Nul} A = \\{\\mathbf{0}\\}$',
          '(r) $\\dim\\operatorname{Nul} A = 0$',
        ].map((str, k) => s.text(str, { x: 60, y: 288 + 46 * k, size: 30, align: 'left', anchor: [0, 0.5], visible: false }));
        return { thm, p, b, imtT, items };
      },
      steps: [
        {
          say: 'If you already know the dimension is $p${p}, half the work is free: $p${p} independent vectors automatically span, and $p${p} spanning vectors are automatically independent. Here, two independent vectors in the plane tile all of it.',
          do: async (s, o) => {
            await o.thm.reveal();
            await o.p.draw();
            await s.all(o.b.i.grow(), o.b.j.grow());
            await o.p.applyMatrix([[2, -1], [1, 1]]);
          },
        },
        {
          say: 'For a square matrix, this adds new statements to the Invertible Matrix Theorem: the columns form a basis, full rank $n${n}, and a null space that is just zero.',
          do: async (s, o) => {
            await o.imtT.fadeIn();
            await s.stagger(o.items.map((it) => () => it.fadeIn({ shift: [12, 0] })), 350);
          },
        },
      ],
    },

    // 11
    {
      id: 'try-coords',
      kind: 'try',
      title: 'Your turn',
      say: 'Find the weights. Each of the first two entries gives one of them right away.',
      prompt: `$\\mathcal{B} = \\left\\{ ${texVec(B1)}, ${texVec(B2)} \\right\\}$ is a basis for a subspace $H$, and $\\mathbf{x} = ${texVec(TRY_X)}$ is in $H$. Find $[\\mathbf{x}]_{\\mathcal{B}}$.`,
      answer: { type: 'vector', value: TRY_W.map(String) },
      hint: 'Write $\\mathbf{x} = c_1\\mathbf{b}_1 + c_2\\mathbf{b}_2$ and compare entries. The first two entries each involve only one weight.',
      solution: [
        `Solve $c_1${texVec(B1)} + c_2${texVec(B2)} = ${texVec(TRY_X)}$, one entry at a time.`,
        `First entries: $${rowEq(0, TRY_X)}$. Second entries: $${rowEq(1, TRY_X)}$. So $c_1 = ${t(TRY_W[0])}$ and $c_2 = ${t(TRY_W[1])}$.`,
        `Third entries check: $${t(TRY_W[0])} + (${t(TRY_W[1])}) = ${t(mulVec(fromCols([B1, B2]), TRY_W)[2])}$ ✓. So $[\\mathbf{x}]_{\\mathcal{B}} = ${texVec(TRY_W)}$.`,
      ],
    },

    // 12
    {
      id: 'wo-bases',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Row reduce, find the free variables, and build the null space basis.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateBases,
    },

    // 13
    {
      id: 'cp-rank',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain the Rank Theorem in your own words.',
      prompt: 'Explain why $\\operatorname{rank} A + \\dim\\operatorname{Nul} A = n$ for an $m \\times n$ matrix $A$.',
      points: [
        'The rank is the number of pivot columns, since the pivot columns of $A$ form a basis for $\\operatorname{Col} A$',
        '$\\dim\\operatorname{Nul} A$ is the number of free variables: the parametric solution has one basis vector per free variable',
        'Each of the $n$ columns is either a pivot column or a free column, never both',
        'So the two counts add up to $n$',
      ],
    },

    // 14
    {
      id: 'summary-subspaces',
      title: 'Summary',
      scene(s) {
        const w = worlds(s, { y: 330, visible: false });
        const cb = s.text(`Col A: pivot columns of A, dimension ${RANK}`, { x: 750, y: 515, size: 30, width: 300, color: C.blue, visible: false });
        const nb = s.text(`Nul A: parametric form, dimension ${NUL.length}`, { x: 210, y: 515, size: 30, width: 300, color: C.red, visible: false });
        const sum = s.tex(`${RANK} + ${NUL.length} = ${N} = \\text{number of columns}`, { x: 480, y: 80, size: 38, color: C.green, visible: false });
        return { w, cb, nb, sum };
      },
      steps: [
        {
          say: 'The column space lives in $\\mathbb{R}^m${R m}. Its basis is the pivot columns of $A${A}, the original matrix.',
          do: async (s, o) => {
            await s.all(o.w.c3.draw(), o.w.l3.fadeIn(), o.w.o3.draw());
            await s.all(o.w.col.draw(), o.w.colL.fadeIn());
            await o.cb.write();
          },
        },
        {
          say: 'The null space lives in $\\mathbb{R}^n${R n}. Its basis comes from the parametric vector form of $A\\mathbf{x} = \\mathbf{0}${A x equals zero}.',
          do: async (s, o) => {
            await s.all(o.w.c4.draw(), o.w.l4.fadeIn(), o.w.o4.draw());
            await s.all(o.w.map.draw(), o.w.mapL.fadeIn(), o.w.nul.draw(), o.w.nulL.fadeIn());
            await o.w.send.draw();
            await o.nb.write();
          },
        },
        {
          say: 'And their dimensions always add up to the number of columns.',
          do: (s, o) => o.sum.write(),
        },
      ],
    },
  ],
};
