/**
 * Lecture 15 · Bases and coordinate systems (Lay 4.3–4.4). Design: matrix/PLAN.md § 15.
 * Every matrix, coordinate vector and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import {
  mat, vec, fromCols, mulVec, addVec, scaleVec, rref, solve, inverse, det, independent, nullspace, colspace, texMat, texVec, texRowOp,
} from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- TeX helpers

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;
const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];

/** `2\mathbf a_1 - \mathbf a_3` from [[coef, name], …] (zeros skipped). */
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
/** Polynomial with coefficients [c0, c1, c2, …] in powers of t. */
const POW = ['1', 't', 't^2', 't^3'];
function polyTex(cs) {
  let out = '';
  cs.forEach((c0, k) => {
    const c = F(c0);
    if (c.zero) return;
    const a = c.abs();
    const term = k === 0 ? t(a) : `${a.eq(1) ? '' : t(a)}${POW[k]}`;
    if (!out) out = `${c.sign() < 0 ? '-' : ''}${term}`;
    else out += ` ${c.sign() < 0 ? '-' : '+'} ${term}`;
  });
  return out || '0';
}
/** Colors a named \part immediately (scene state). */
function paint(tex, name, color) {
  for (const el of tex.part(name)) el.style.color = color;
  return tex;
}
const checkMark = (s, latex, opts) => paint(s.tex(`${latex}\\ \\part{ck}{\\checkmark}`, opts), 'ck', C.green);

// ---------------------------------------------------------------- data

/** Beat 1: v3 is a combination of v1, v2 (Spanning Set Theorem). */
const V1 = [1, 0, 1];
const V2 = [0, 1, 1];
const V3 = addVec(scaleVec(F(2), vec(V1)), scaleVec(F(3), vec(V2))).map(Number);
const W3 = solve(fromCols([V1, V2]), V3).x; // (2, 3)
const H_NORMAL = [V1[1] * V2[2] - V1[2] * V2[1], V1[2] * V2[0] - V1[0] * V2[2], V1[0] * V2[1] - V1[1] * V2[0]];

/** Beat 2: a polynomial as a combination of 1, t, t². */
const P_STD = [3, 2, -1];

/** Beat 3: {1 + t, t + t², 1 + 2t + t²} in coordinates. */
const PI_SET = [[1, 1, 0], [0, 1, 1], [1, 2, 1]];
const PI_INDEP = independent(PI_SET);
const PI_REL = solve(fromCols(PI_SET.slice(0, 2)), PI_SET[2]).x; // p3 = 1·p1 + 1·p2

/** Beat 4: a matrix whose columns satisfy visible relations. */
const NC = mat([[1, 2, 0, 1], [2, 4, 1, 4], [3, 6, 1, 5]]);
const NC_RED = rref(NC);
const NC_PIV = NC_RED.pivots.map(([, c]) => c);
const NC_NUL = nullspace(NC);
const NC_COL = colspace(NC);
const NC_FREE = [0, 1, 2, 3].filter((c) => !NC_PIV.includes(c));
/** "a_f = Σ (−v_c) a_c" for the null-space vector of free column f. */
const relTex = (v, f, letter) => `\\mathbf{${letter}}_${f + 1} = ${comb(NC_PIV.map((c) => [v[c].neg(), `\\mathbf{${letter}}_${c + 1}`]))}`;

/** Beats 5, 6, 10, 14: the skewed grid of B = {b1, b2}. */
const B1 = [2, 1];
const B2 = [-1, 1];
const PB = fromCols([B1, B2].map(vec));
const XB = vec([3, 2]);
const X = mulVec(PB, XB); // (4, 5)
const PB_INV = inverse(PB);
const PB_DET = det(PB);
const PB_ADJ = PB_INV.map((row) => row.map((v) => v.mul(PB_DET)));
const PBX = [PB.map((r) => r.map(Number)), X.map(Number)];
/** Beat 6: [P_B | x], solved after putting the 1 on top. */
const AUG6 = PB.map((row, i) => [...row, X[i]]);
const SWAP6 = { op: 'swap', i: 0, j: 1 };
const AUG6S = [AUG6[1], AUG6[0]];
const RED6 = rref(AUG6S, { augmented: 1 });
const SOL6 = RED6.R.map((row) => row[2]);

/** Beat 7: B = {(1,1), (1,−1)}, x = (5, 1). */
const FC_B = [[1, 1], [1, -1]];
const FC_X = [5, 1];
const FC_SOL = solve(fromCols(FC_B), FC_X).x;

/** Beat 8: the coordinate map on P2. */
const PP = [3, 2, -1];
const PQ = [1, -1, 2];
const PS = addVec(vec(PP), vec(PQ)).map(Number);
const ISO_M = fromCols(PI_SET.map(vec));
const ISO_RED = rref(ISO_M);

/** Beat 9: coordinates of p = 3 + 2t − t² in the basis {1, 1 + t, 1 + t + t²}. */
const PC_BASIS = [[1, 0, 0], [1, 1, 0], [1, 1, 1]];
const PC_SOL = solve(fromCols(PC_BASIS), PP).x;

/** Beat 10: the backwards formula. */
const WRONG = mulVec(PB, X); // P_B x
const WRONG_VEC = mulVec(PB, WRONG); // what those "coordinates" describe

/** Beat 12: candidate bases of R³. */
const SETS = {
  a: [[1, 0, 0], [0, 1, 0]],
  b: [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1]],
  c: [[1, 1, 0], [0, 1, 1], [1, 0, 1]],
  d: [[1, 1, 0], [0, 1, 1], [1, 2, 1]],
};
const isBasis3 = (vs) => vs.length === 3 && !det(fromCols(vs.map(vec))).zero;
const BASIS_ID = Object.keys(SETS).find((k) => isBasis3(SETS[k]));
const setTex = (vs) => `\\{${vs.map(tup).join(', ')}\\}`;

// ---------------------------------------------------------------- workout: coordinates in R³

const cvec = (v) => `\\begin{bmatrix}${v.map(t).join('\\\\')}\\end{bmatrix}`;

function coordsItem(cols0, c0) {
  const cols = cols0.map(vec);
  const c = vec(c0);
  const P = fromCols(cols);
  const x = mulVec(P, c);
  const aug = P.map((row, i) => [...row, x[i]]);
  const red = rref(aug, { augmented: 1 });
  const fwd = red.steps.filter((st) => st.phase === 'forward');
  const check = comb(c.map((ci, i) => [ci, cvec(cols[i])]));
  return {
    prompt: `$\\mathcal{B} = \\{${cols.map(tup).join(',\\ ')}\\}$ is a basis of $\\mathbb{R}^3$. Find $[\\mathbf{x}]_{\\mathcal{B}}$ for $\\mathbf{x} = ${tup(x)}$.`,
    answer: { type: 'vector', value: c.map(String) },
    hints: [
      `Solve $P_{\\mathcal{B}}\\mathbf{c} = \\mathbf{x}$: row reduce $[P_{\\mathcal{B}} \\mid \\mathbf{x}] = ${texMat(aug, { augment: 3 })}$.`,
      fwd.length
        ? `The forward phase ${fwd.map((st) => `$${texRowOp(st)}$`).join(', ')} gives $${texMat(red.echelon, { augment: 3 })}$. Back-substitute from the last row.`
        : 'The matrix is already in echelon form. Back-substitute from the last row.',
    ],
    solution: [
      `The columns of $P_{\\mathcal{B}}$ are the basis vectors, and $\\mathbf{x} = P_{\\mathcal{B}}[\\mathbf{x}]_{\\mathcal{B}}$. So row reduce $[P_{\\mathcal{B}} \\mid \\mathbf{x}] = ${texMat(aug, { augment: 3 })}$.`,
      ...red.steps.map((st) => `$${texRowOp(st)}$: $${texMat(st.after, { augment: 3 })}$`),
      `So $[\\mathbf{x}]_{\\mathcal{B}} = ${cvec(c)}$.`,
      `Check: $${check} = ${cvec(x)}$.`,
    ],
  };
}
const WO_COLS = [[1, 0, 1], [1, 1, 0], [0, 1, 1]];
const WO_C = [1, 2, 3];
const WO = coordsItem(WO_COLS, WO_C);
{
  // Each column of this P_B sums to 2, so adding the three equations gives 2(c1 + c2 + c3) = x1 + x2 + x3.
  const P = fromCols(WO_COLS.map(vec));
  const x = mulVec(P, vec(WO_C));
  const total = x.reduce((a, b) => a.add(b), F(0));
  const eqs = P.map((row, i) => `${comb(row.map((v, j) => [v, `c_${j + 1}`]))} = ${t(x[i])}`);
  WO.hints = [
    `Solve $P_{\\mathcal{B}}\\mathbf{c} = \\mathbf{x}$: the equations are $${eqs.join(',\\ ')}$.`,
    `Adding all three equations gives $2(c_1 + c_2 + c_3) = ${t(total)}$, so $c_1 + c_2 + c_3 = ${t(total.div(2))}$. Subtract each equation from that.`,
  ];
  // Each equation leaves out one unknown: subtracting it from the half-sum gives that unknown.
  const half = total.div(2);
  const solved = P.map((row, i) => {
    const j = row.findIndex((v) => v.zero);
    return `c_${j + 1} = ${t(half)} - ${t(x[i])} = ${t(half.sub(x[i]))}`;
  });
  WO.solution = [
    `Shortcut: the equations are $${eqs.join(',\\ ')}$. Adding them gives $2(c_1 + c_2 + c_3) = ${t(total)}$, so $c_1 + c_2 + c_3 = ${t(half)}$. Subtracting each equation from that leaves one unknown each: $${solved.join(',\\ ')}$.`,
    ...WO.solution,
  ];
}

/** Fresh bases of R³ with det ±1 (entries −1…1, at least two nonzero per column) and small integer coordinates. */
function generateCoords(rand) {
  for (;;) {
    const cols = [0, 1, 2].map(() => [0, 1, 2].map(() => rand.int(-1, 1)));
    if (cols.some((v) => v.filter((x) => x !== 0).length < 2)) continue;
    const P = fromCols(cols.map(vec));
    const d = det(P).abs();
    if (!d.eq(1)) continue;
    const c = [0, 1, 2].map(() => rand.nonzero(-3, 3));
    const x = mulVec(P, vec(c));
    if (x.some((v) => v.abs().cmp(12) > 0)) continue;
    const red = rref(P.map((row, i) => [...row, x[i]]), { augmented: 1 });
    const nice = red.steps.every((st) => st.after.every((row) => row.every((v) => v.d === 1n && v.abs().cmp(20) <= 0)));
    if (!nice || red.steps.length > 7) continue;
    return coordsItem(cols, c);
  }
}

// ---------------------------------------------------------------- shared scene builders

/** Beats 5 and 14: the plane for B = {(2,1), (−1,1)} and x = (4,5). */
function coordPlane(s, { x = 640, y = 310, width = 500, labels = true, visible = false } = {}) {
  const p = s.plane({ x, y, width, range: [-2, 7, -1, 6], names: labels ? ['x_1', 'x_2'] : undefined, labels, visible });
  const b1 = p.vector(B1, { color: C.blue, label: '\\mathbf{b}_1', transform: false, visible });
  const b2 = p.vector(B2, { color: C.red, label: '\\mathbf{b}_2', transform: false, visible });
  const xv = p.vector(X.map(Number), { color: C.green, label: '\\mathbf{x}', transform: false, visible: false });
  return { p, b1, b2, xv };
}
/** The walk 3·b1 then 2·b2 as thin tip-to-tail copies. */
function walk(p) {
  const steps = [];
  let at = [0, 0];
  [[B1, Number(XB[0]), C.blue], [B2, Number(XB[1]), C.red]].forEach(([b, n, color]) => {
    for (let k = 0; k < n; k++) {
      steps.push(p.vector(b, { tail: at, color, width: 3, transform: false, visible: false }));
      at = [at[0] + b[0], at[1] + b[1]];
    }
  });
  return steps;
}
/** A curve y = f(t) on a plane, as a stage path (t from a to b). */
function curve(s, p, f, a, b, opts) {
  const pts = [];
  for (let k = 0; k <= 40; k++) {
    const u = a + ((b - a) * k) / 40;
    pts.push(p.toStage([u, f(u)]));
  }
  return s.path(`M ${pts.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L ')}`, { width: 4, ...opts });
}
const polyFn = (cs) => (u) => cs.reduce((acc, c, k) => acc + c * u ** k, 0);

// ---------------------------------------------------------------- the lecture

export default {
  id: 'bases-coordinates',
  title: 'Bases and coordinate systems',
  goals: [
    'Define a basis in any vector space, and know the standard bases of ℝⁿ and ℙₙ',
    'Shrink a spanning set to a basis; find bases for Nul A and Col A',
    'Find coordinates [x]_B and use the change-of-coordinates matrix P_B',
    'Treat an n-dimensional space like ℝⁿ through the coordinate map',
  ],
  beats: [
    // 1
    {
      id: 'basis-idea',
      title: 'Just enough vectors',
      scene(s) {
        const sp = s.space({ x: 660, y: 320, size: 480, range: 4.5, yaw: -40, pitch: 16, visible: false });
        const plane = sp.plane({ normal: H_NORMAL, d: 0 }, { center: [1, 1.5, 2.5], extent: 3, color: C.muted, visible: false });
        const v1 = sp.vector(V1, { color: C.blue, label: '\\mathbf{v}_1', visible: false });
        const v2 = sp.vector(V2, { color: C.red, label: '\\mathbf{v}_2', visible: false });
        const v3 = sp.vector(V3, { color: C.teal, label: '\\mathbf{v}_3', visible: false });
        const d1 = sp.vector(scaleVec(W3[0], vec(V1)).map(Number), { color: C.blue, width: 3, visible: false });
        const d2 = sp.vector(scaleVec(W3[1], vec(V2)).map(Number), { tail: scaleVec(W3[0], vec(V1)).map(Number), color: C.red, width: 3, visible: false });
        const span = s.tex('H = \\operatorname{Span}\\{\\mathbf{v}_1, \\mathbf{v}_2, \\mathbf{v}_3\\}', { x: 220, y: 110, size: 34, visible: false });
        const rel = s.tex(`\\mathbf{v}_3 = ${comb([[W3[0], '\\mathbf{v}_1'], [W3[1], '\\mathbf{v}_2']])}`, { x: 220, y: 180, size: 36, color: C.teal, visible: false });
        const thm5 = s.defCard({ x: 225, y: 385, width: 400, kind: 'theorem', title: 'Theorem 5 (Spanning Set)', body: 'If one vector of a spanning set is a combination of the others, removing it leaves the same span.', visible: false });
        const def = s.defCard({ x: 220, y: 350, width: 380, body: 'A **basis** of $H$ is a linearly independent set that spans $H$.', visible: false });
        const basis = s.tex('\\mathcal{B} = \\{\\mathbf{v}_1, \\mathbf{v}_2\\}', { x: 220, y: 515, size: 40, color: C.green, visible: false });
        return { sp, plane, v1, v2, v3, d1, d2, span, rel, thm5, def, basis };
      },
      steps: [
        {
          say: 'Here are three vectors in $\\mathbb{R}^3${R three}, and the plane $H${H} they span. A basis of $H${H} is a set that spans it with nothing wasted: no vector you could do without.',
          do: async (s, o) => {
            await s.all(o.sp.draw(), o.span.write());
            await s.stagger([o.v1, o.v2, o.v3].map((v) => () => v.grow()), 450);
            await o.plane.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'But $\\mathbf{v}_3${v three} is wasted: it\'s $2\\mathbf{v}_1 + 3\\mathbf{v}_2${two v one plus three v two}. Anything built with it can be built without it, so drop it, and the span stays the same plane. That\'s the Spanning Set Theorem.',
          do: async (s, o) => {
            await o.rel.write();
            await o.d1.grow();
            await o.d2.grow();
            await o.v3.flash({ color: C.teal });
            await s.all(o.v3.fadeOut(), o.d1.fadeOut(), o.d2.fadeOut(), o.span.swap('H = \\operatorname{Span}\\{\\mathbf{v}_1, \\mathbf{v}_2\\}'));
            await s.all(o.plane.indicate({ color: C.green }), o.thm5.reveal());
          },
        },
        {
          say: 'Keep dropping until no vector is a combination of the others. Here $\\mathbf{v}_1${v one} and $\\mathbf{v}_2${v two} aren\'t multiples of each other, so they\'re independent, and they form a basis of $H${H}.',
          do: async (s, o) => {
            await s.all(o.v1.indicate({ color: C.blue }), o.v2.indicate({ color: C.red }), o.thm5.fadeOut());
            await o.def.reveal();
            await o.basis.write();
          },
        },
      ],
    },

    // 2
    {
      id: 'standard-bases',
      title: 'Standard bases',
      scene(s) {
        const head1 = s.tex('\\{\\mathbf{e}_1, \\dots, \\mathbf{e}_n\\}\\ \\text{for } \\mathbb{R}^n', { x: 220, y: 90, size: 34, visible: false });
        const I = s.matrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]], { x: 220, y: 290, size: 48, visible: false });
        const cols = [C.blue, C.red, C.teal];
        const elabs = [0, 1, 2].map((j) => {
          const b = I.colBox(j);
          return s.tex(`\\mathbf{e}_${j + 1}`, { x: b.cx, y: b.y + b.h + 40, size: 34, color: cols[j], visible: false });
        });
        const head2 = s.tex('\\{1, t, \\dots, t^n\\}\\ \\text{for } \\mathbb{P}_n', { x: 680, y: 90, size: 34, visible: false });
        const p = s.plane({ x: 680, y: 315, width: 250, range: [-2, 2, -1, 4.5], labels: false, names: ['t', ''], visible: false });
        const curves = [
          curve(s, p, () => 1, -2, 2, { color: C.blue, visible: false }),
          curve(s, p, (u) => u, -1, 2, { color: C.red, visible: false }),
          curve(s, p, (u) => u * u, -2, 2, { color: C.teal, visible: false }),
        ];
        const clabs = [
          s.tex('1', { x: p.toStage([-2, 1])[0] - 20, y: p.toStage([-2, 1])[1], size: 32, color: C.blue, visible: false }),
          s.tex('t', { x: p.toStage([2, 2])[0] + 22, y: p.toStage([2, 2])[1], size: 32, color: C.red, visible: false }),
          s.tex('t^2', { x: p.toStage([2, 4])[0] + 30, y: p.toStage([2, 4])[1] + 10, size: 32, color: C.teal, visible: false }),
        ];
        const pc = curve(s, p, polyFn(P_STD), -1, 2.2, { color: C.green, width: 5, visible: false });
        const pTex = s.tex(
          `${polyTex(P_STD)} = ${comb([[P_STD[0], '\\col{blue}{1}'], [P_STD[1], '\\col{red}{t}'], [P_STD[2], '\\col{teal}{t^2}']]).replace('3\\col', '3\\cdot\\col')}`,
          { x: 680, y: 552, size: 32, visible: false },
        );
        return { head1, I, elabs, head2, p, curves, clabs, pc, pTex };
      },
      steps: [
        {
          say: 'In $\\mathbb{R}^n${R n} the standard basis is the columns of the identity matrix, $\\mathbf{e}_1${e one} through $\\mathbf{e}_n${e n}.',
          do: async (s, o) => {
            await s.all(o.head1.write(), o.I.fadeIn());
            const cols = [C.blue, C.red, C.teal];
            await s.stagger([0, 1, 2].map((j) => () => s.all(o.I.highlightCol(j, cols[j]), o.elabs[j].fadeIn())), 500);
          },
        },
        {
          say: 'For polynomials of degree at most $n${n}, the standard basis is the powers of $t${t}: $1${one}, $t${t}, $t^2${t squared}, and so on.',
          do: async (s, o) => {
            await s.all(o.head2.write(), o.p.draw({ duration: 800 }));
            await s.stagger(o.curves.map((c, k) => () => s.all(c.draw({ duration: 700 }), o.clabs[k].fadeIn())), 500);
          },
        },
        {
          say: 'Every polynomial is a combination of them in exactly one way: the weights are just its coefficients.',
          do: async (s, o) => {
            await o.pc.draw({ duration: 900 });
            await o.pTex.write();
          },
        },
      ],
    },

    // 3
    {
      id: 'try-poly-indep',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Look for a relation among these three polynomials.',
      prompt: 'Is $\\{1 + t,\\ t + t^2,\\ 1 + 2t + t^2\\}$ linearly independent in $\\mathbb{P}_2$?',
      answer: { type: 'choice', value: PI_INDEP ? 'yes' : 'no' },
      choices: [
        { id: 'yes', label: 'Yes, it is independent', why: 'Add the first two polynomials and compare with the third.' },
        { id: 'no', label: 'No, it is dependent', why: 'Right: the third is the sum of the first two.' },
      ],
      hint: 'Write each polynomial as a coordinate vector relative to $\\{1, t, t^2\\}$ and look for a relation.',
      solution: [
        `$(1 + t) + (t + t^2) = 1 + 2t + t^2$, so the third polynomial is $${t(PI_REL[0])}\\cdot$ the first $+\\ ${t(PI_REL[1])}\\cdot$ the second.`,
        `In coordinates relative to $\\{1, t, t^2\\}$ the three polynomials are $${PI_SET.map(tup).join(',\\ ')}$, and the third vector is the sum of the first two.`,
        'A set with one vector a combination of the others is **linearly dependent**.',
      ],
    },

    // 4
    {
      id: 'nul-col-bases',
      title: 'Bases for Nul A and Col A, again',
      scene(s) {
        const lA = s.tex('A', { x: 200, y: 55, size: 38, visible: false });
        const lR = s.tex('\\text{reduced}', { x: 640, y: 55, size: 34, color: C.muted, visible: false });
        const A = s.matrix(NC, { x: 200, y: 190, size: 36, visible: false });
        const R = s.matrix(NC, { x: 640, y: 190, size: 36, visible: false });
        const arrow = s.arrow(360, 190, 480, 190, { color: C.muted, visible: false });
        const rels = NC_FREE.map((f, k) => [
          s.tex(relTex(NC_NUL[k], f, 'a'), { x: 200, y: 350 + 60 * k, size: 34, color: k ? C.teal : C.blue, visible: false }),
          s.tex(relTex(NC_NUL[k], f, 'r'), { x: 640, y: 350 + 60 * k, size: 34, color: k ? C.teal : C.blue, visible: false }),
        ]);
        const thm6 = s.defCard({ x: 480, y: 368, width: 860, kind: 'theorem', title: 'Theorem 6', body: 'The pivot columns of a matrix $A$ form a basis for $\\operatorname{Col}A$.', visible: false });
        const colB = s.tex(`\\operatorname{Col}A:\\ ${NC_COL.map(texVec).join('\\ ')}`, { x: 240, y: 506, size: 32, color: C.blue, visible: false });
        const nulB = s.tex(`\\operatorname{Nul}A:\\ ${NC_NUL.map(texVec).join('\\ ')}`, { x: 690, y: 465, size: 34, color: C.orange, visible: false });
        return { lA, lR, A, R, arrow, rels, thm6, colB, nulB };
      },
      steps: [
        {
          say: 'Here\'s a matrix $A${A} and a copy that we row reduce. Row operations mix rows, but every column is changed by the same moves.',
          do: async (s, o) => {
            await s.all(o.lA.fadeIn(), o.A.fadeIn(), o.R.fadeIn(), o.lR.fadeIn());
            await o.arrow.draw({ duration: 500 });
            for (const st of NC_RED.steps) await o.R.rowOp(st, { note: false });
          },
        },
        {
          say: 'So the dependence relations among the columns survive. Column two is twice column one in the reduced matrix, and it\'s twice column one in $A${A} too. And column four is column one plus twice column three, in both matrices.',
          do: async (s, o) => {
            await s.all(o.R.highlightCol(0, C.blue), o.R.highlightCol(1, C.blue), o.A.highlightCol(0, C.blue), o.A.highlightCol(1, C.blue));
            await s.all(o.rels[0][1].write(), o.rels[0][0].write({ delay: 300 }));
            await s.all(o.R.clearHighlights(), o.A.clearHighlights());
            await s.all(o.R.highlightCol(3, C.teal), o.A.highlightCol(3, C.teal));
            await s.all(o.rels[1][1].write(), o.rels[1][0].write({ delay: 300 }));
          },
        },
        {
          say: 'That\'s why the pivot columns of the echelon form point to a basis among the original columns. Here they\'re columns one and three, so those columns of $A${A} are a basis for $\\operatorname{Col}A${the column space of A}.',
          do: async (s, o) => {
            await s.all(o.R.clearHighlights(), o.A.clearHighlights(), ...o.rels.flat().map((r) => r.fadeOut()));
            await s.all(...NC_RED.pivots.map(([i, j]) => o.R.pivot(i, j, { color: C.yellow })));
            await s.all(...NC_PIV.map((j) => o.A.highlightCol(j, C.blue)));
            await o.thm6.reveal();
            await o.colB.fadeIn();
          },
        },
        {
          say: 'And the null space comes from the reduced form: one vector for each free variable, read off the parametric vector form.',
          do: async (s, o) => {
            await s.all(o.thm6.fadeOut(), o.colB.moveTo(o.colB.x, 465), ...NC_FREE.map((j) => o.R.highlightCol(j, C.orange)));
            await o.nulB.fadeIn();
          },
        },
      ],
    },

    // 5
    {
      id: 'coordinates-2d',
      title: 'Coordinates: a new grid',
      scene(s) {
        const cp = coordPlane(s);
        cp.b1.hide();
        cp.b2.hide();
        const steps = walk(cp.p);
        const lb1 = s.tex(`\\mathbf{b}_1 = ${tup(B1)}`, { x: 180, y: 130, size: 36, color: C.blue, visible: false });
        const lb2 = s.tex(`\\mathbf{b}_2 = ${tup(B2)}`, { x: 180, y: 190, size: 36, color: C.red, visible: false });
        const xeq = s.tex(`\\mathbf{x} = ${comb([[XB[0], '\\mathbf{b}_1'], [XB[1], '\\mathbf{b}_2']])}`, { x: 180, y: 290, size: 36, visible: false });
        const coords = s.tex(`[\\mathbf{x}]_{\\mathcal{B}} = ${texVec(XB)}`, { x: 180, y: 390, size: 40, color: C.green, visible: false });
        const uniq = s.text('unique: $\\mathcal{B}$ is independent', { x: 200, y: 500, size: 30, color: C.muted, visible: false });
        return { ...cp, steps, lb1, lb2, xeq, coords, uniq };
      },
      steps: [
        {
          say: 'A basis lays its own grid over the plane. Take $\\mathbf{b}_1 = (2, 1)${b one equals two, one} and $\\mathbf{b}_2 = (-1, 1)${b two equals minus one, one}, and let the grid lines follow them.',
          do: async (s, o) => {
            await o.p.draw({ duration: 800 });
            await s.all(o.b1.grow(), o.lb1.fadeIn(), o.b2.grow({ delay: 300 }), o.lb2.fadeIn({ delay: 300 }));
            await o.p.applyMatrix(PBX[0]);
          },
        },
        {
          say: 'The coordinates of $\\mathbf{x}${x} are how many steps you take along each basis vector to reach it: three along $\\mathbf{b}_1${b one}, then two along $\\mathbf{b}_2${b two}.',
          do: async (s, o) => {
            await s.stagger(o.steps.map((v) => () => v.grow({ duration: 450 })), 500);
            await o.xv.grow();
            await o.xeq.write();
            await o.coords.write();
          },
        },
        {
          say: 'And there\'s only one way to do it, because the basis is independent. So $[\\mathbf{x}]_{\\mathcal{B}} = (3, 2)${the B coordinates of x are three, two} names $\\mathbf{x}${x} exactly.',
          do: async (s, o) => {
            await o.coords.indicate({ color: C.green });
            await o.uniq.fadeIn();
          },
        },
      ],
    },

    // 6
    {
      id: 'change-coords-matrix',
      title: 'Computing coordinates',
      scene(s) {
        const hero = s.tex('\\mathbf{x} = P_{\\mathcal{B}}[\\mathbf{x}]_{\\mathcal{B}}', { x: 300, y: 80, size: 44, visible: false });
        const pdef = s.tex('P_{\\mathcal{B}} = [\\,\\col{blue}{\\mathbf{b}_1}\\ \\ \\col{red}{\\mathbf{b}_2}\\,]', { x: 720, y: 80, size: 40, visible: false });
        const num = s.tex(
          `\\begin{bmatrix}\\col{blue}{${t(PB[0][0])}} & \\col{red}{${t(PB[0][1])}} \\\\ \\col{blue}{${t(PB[1][0])}} & \\col{red}{${t(PB[1][1])}}\\end{bmatrix}${texVec(XB)} = \\col{green}{${texVec(X)}}`,
          { x: 480, y: 200, size: 40, visible: false },
        );
        const m = s.matrix(AUG6, { x: 300, y: 430, size: 44, augment: 2, visible: false });
        const inv = s.tex(`P_{\\mathcal{B}}^{-1}\\mathbf{x} = ${texVec(mulVec(PB_INV, X))}`, { x: 760, y: 430, size: 38, color: C.green, visible: false });
        return { hero, pdef, num, m, inv };
      },
      steps: [
        {
          say: 'Put the basis vectors in the columns of a matrix, $P_{\\mathcal{B}}${P B}. Multiplying it by the coordinates rebuilds the vector: $P_{\\mathcal{B}}${P B} times $(3, 2)${three, two} is $(4, 5)${four, five}.',
          do: async (s, o) => {
            await s.all(o.hero.write(), o.pdef.write({ delay: 300 }));
            await o.num.write({ duration: 1200 });
          },
        },
        {
          say: 'To go the other way, from $\\mathbf{x}${x} to its coordinates, solve the system $P_{\\mathcal{B}}\\mathbf{c} = \\mathbf{x}${P B c equals x}. Swap the rows to get a $1${one} on top, then reduce.',
          do: async (s, o) => {
            await o.m.fadeIn();
            await o.m.rowOp(SWAP6);
            for (const st of RED6.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), o.m.highlightCol(2, C.green));
          },
        },
        {
          say: 'The last column is $[\\mathbf{x}]_{\\mathcal{B}} = (3, 2)${the B coordinates of x, three, two}. Since the basis is independent, $P_{\\mathcal{B}}${P B} is invertible, and the same answer is $P_{\\mathcal{B}}^{-1}\\mathbf{x}${P B inverse times x}.',
          do: async (s, o) => {
            await o.m.indicate({ color: C.green });
            await o.inv.write();
          },
        },
      ],
    },

    // 7
    {
      id: 'fill-coords',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks. Set up the two equations for the weights first.',
      prompt: `$\\mathcal{B} = \\{${FC_B.map(tup).join(',\\ ')}\\}$ and $\\mathbf{x} = ${tup(FC_X)}$.`,
      lines: [
        ['[\\mathbf{x}]_{\\mathcal{B}} = ', { matrix: [[{ id: 'c1', answer: { type: 'number', value: String(FC_SOL[0]) } }], [{ id: 'c2', answer: { type: 'number', value: String(FC_SOL[1]) } }]] }],
      ],
      solution: [
        `Write $\\mathbf{x} = c_1${tup(FC_B[0])} + c_2${tup(FC_B[1])}$: that's $c_1 + c_2 = ${FC_X[0]}$ and $c_1 - c_2 = ${FC_X[1]}$.`,
        `Adding gives $2c_1 = ${FC_X[0] + FC_X[1]}$, so $c_1 = ${t(FC_SOL[0])}$ and $c_2 = ${t(FC_SOL[1])}$: $[\\mathbf{x}]_{\\mathcal{B}} = ${tup(FC_SOL)}$.`,
      ],
    },

    // 8
    {
      id: 'isomorphism',
      title: 'Polynomials become vectors',
      scene(s) {
        const hp = s.tex('\\mathbb{P}_2', { x: 225, y: 62, size: 40, visible: false });
        const hr = s.tex('\\mathbb{R}^3', { x: 730, y: 62, size: 40, visible: false });
        const basis = s.tex('\\mathcal{B} = \\{1, t, t^2\\}', { x: 480, y: 62, size: 32, color: C.muted, visible: false });
        const rows = [[PP, 'p', C.blue, 160], [PQ, 'q', C.red, 310], [PS, 'p + q', C.green, 460]];
        const polys = rows.map(([cs, name, color, y]) => {
          const terms = [];
          cs.forEach((c, k) => terms.push(`\\part{c${k}}{${polyTex(cs.map((v, j) => (j === k ? v : 0))).replace(/^(?!-)/, terms.length ? '+ ' : '')}}`));
          return s.tex(`${name === 'p + q' ? '(p + q)' : name}(t) = ${terms.join(' ')}`, { x: 225, y, size: 34, color, visible: false });
        });
        const vecs = rows.map(([cs, , color, y]) =>
          s.tex(`\\begin{bmatrix}${cs.map((c, k) => `\\part{e${k}}{${t(c)}}`).join('\\\\')}\\end{bmatrix}`, { x: 730, y, size: 32, color, visible: false }),
        );
        const arrows = rows.map(([, , , y]) => s.arrow(440, y, 640, y, { color: C.muted, visible: false }));
        const mapLab = s.tex('[\\,\\cdot\\,]_{\\mathcal{B}}', { x: 540, y: 128, size: 32, color: C.muted, visible: false });
        const plusL = s.tex('+', { x: 60, y: 235, size: 34, visible: false });
        const plusR = s.tex('+', { x: 660, y: 235, size: 34, visible: false });
        const bar = s.line(60, 385, 400, 385, { color: C.muted, width: 2, visible: false });
        const barR = s.line(680, 385, 780, 385, { color: C.muted, width: 2, visible: false });
        const iso = s.text('one-to-one, onto, linear: an **isomorphism**', { x: 480, y: 552, size: 30, color: C.green, visible: false });
        const flyers = [];
        PP.forEach((c, k) => flyers.push({ k, mob: s.tex(t(c), { size: 32, color: C.blue, visible: false }) }));
        // the matrix scene for step 3
        const M = s.matrix(ISO_M, { x: 380, y: 300, size: 44, visible: false });
        const mHead = s.tex(`\\text{columns: } ${PI_SET.map((v) => polyTex(v)).join(',\\ ')}`, { x: 480, y: 120, size: 32, visible: false });
        const verdict = s.tex('\\text{a zero row: dependent in } \\mathbb{R}^3 \\text{ and in } \\mathbb{P}_2', { x: 480, y: 500, size: 32, color: C.yellow, visible: false });
        return { hp, hr, basis, polys, vecs, arrows, mapLab, plusL, plusR, bar, barR, iso, flyers, M, mHead, verdict };
      },
      steps: [
        {
          say: 'Take the basis $1${one}, $t${t}, $t^2${t squared} of $\\mathbb{P}_2${P two}. The polynomial $3 + 2t - t^2${three plus two t minus t squared} has coordinates $(3, 2, -1)${three, two, minus one}: its coefficients, stacked into a vector in $\\mathbb{R}^3${R three}.',
          do: async (s, o) => {
            await s.all(o.hp.fadeIn(), o.hr.fadeIn(), o.basis.fadeIn());
            await o.polys[0].write();
            await s.all(o.arrows[0].draw({ duration: 600 }), o.mapLab.fadeIn());
            await s.all(
              o.flyers.map(({ k, mob }) => {
                const [fx, fy] = center(o.polys[0].partBox(`c${k}`));
                const to = o.vecs[0].partBox(`e${k}`);
                mob.set({ x: fx, y: fy }).show();
                return mob.moveTo(to.cx, to.cy, { duration: 1000, delay: k * 150 });
              }),
            );
            await s.all(o.vecs[0].fadeIn({ shift: [0, 0], duration: 300 }), o.flyers.map(({ mob }) => mob.fadeOut({ duration: 300 })));
          },
        },
        {
          say: 'This coordinate map is one to one, onto, and linear. Add two polynomials, and their coordinate vectors add too. That makes it an isomorphism.',
          do: async (s, o) => {
            await s.all(o.polys[1].write(), o.arrows[1].draw({ duration: 600 }), o.vecs[1].fadeIn({ delay: 300 }));
            await s.all(o.plusL.fadeIn(), o.plusR.fadeIn(), o.bar.draw({ duration: 500 }), o.barR.draw({ duration: 500 }));
            await s.all(o.polys[2].write(), o.vecs[2].fadeIn({ delay: 200 }), o.arrows[2].draw({ duration: 600 }));
            await o.iso.fadeIn();
          },
        },
        {
          say: 'So any question about $\\mathbb{P}_2${P two} becomes a question about $\\mathbb{R}^3${R three}. Remember $\\{1 + t,\\ t + t^2,\\ 1 + 2t + t^2\\}${one plus t, t plus t squared, one plus two t plus t squared}? Put its coordinate vectors in a matrix, and row reduction decides whether it\'s independent.',
          do: async (s, o) => {
            await s.all(
              ...[o.hp, o.hr, o.basis, o.mapLab, o.plusL, o.plusR, o.bar, o.barR, o.iso, ...o.polys, ...o.vecs, ...o.arrows].map((m) => m.fadeOut()),
            );
            await s.all(o.mHead.fadeIn(), o.M.fadeIn());
            for (const st of ISO_RED.steps) await o.M.rowOp(st);
            await s.all(o.M.note(), o.M.highlightRow(ISO_M.length - 1, C.yellow));
            await o.verdict.fadeIn();
          },
        },
      ],
    },

    // 9
    {
      id: 'try-poly-coords',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. The basis isn\'t the standard one, so the coordinates aren\'t just the coefficients.',
      prompt: 'Find $[p]_{\\mathcal{B}}$ for $p(t) = 3 + 2t - t^2$ and $\\mathcal{B} = \\{1,\\ 1 + t,\\ 1 + t + t^2\\}$.',
      answer: { type: 'vector', value: PC_SOL.map(String) },
      hint: 'Write $p = c_1\\cdot 1 + c_2(1 + t) + c_3(1 + t + t^2)$ and match the $t^2$ coefficient first.',
      solution: [
        '$c_1 + c_2(1 + t) + c_3(1 + t + t^2) = (c_1 + c_2 + c_3) + (c_2 + c_3)t + c_3t^2$.',
        `Match coefficients: $c_3 = ${t(PP[2])}$; $c_2 + c_3 = ${t(PP[1])}$, so $c_2 = ${t(PC_SOL[1])}$; $c_1 + c_2 + c_3 = ${t(PP[0])}$, so $c_1 = ${t(PC_SOL[0])}$.`,
        `$[p]_{\\mathcal{B}} = ${texVec(PC_SOL)}$. Not $(3, 2, -1)$: those are the coordinates in the *standard* basis.`,
      ],
    },

    // 10
    {
      id: 'mistake-inverse',
      title: 'The trap: which way does P go?',
      scene(s) {
        const right = s.tex('\\mathbf{x} = P_{\\mathcal{B}}[\\mathbf{x}]_{\\mathcal{B}}', { x: 480, y: 80, size: 44, color: C.green, visible: false });
        const rightNum = checkMark(s, `${texMat(PB)}${texVec(XB)} = ${texVec(X)}`, { x: 480, y: 190, size: 36, visible: false });
        const wrong = s.tex('[\\mathbf{x}]_{\\mathcal{B}} \\overset{?}{=} P_{\\mathcal{B}}\\mathbf{x}', { x: 250, y: 320, size: 40, color: C.yellow, visible: false });
        const wrongNum = s.tex(`P_{\\mathcal{B}}${texVec(X)} = ${texVec(WRONG)}`, { x: 250, y: 420, size: 34, visible: false });
        const wrongChk = s.tex(`${comb([[WRONG[0], '\\mathbf{b}_1'], [WRONG[1], '\\mathbf{b}_2']])} = ${tup(WRONG_VEC)} \\neq \\mathbf{x}`, { x: 250, y: 520, size: 32, color: C.yellow, visible: false });
        const fix = s.tex('[\\mathbf{x}]_{\\mathcal{B}} = P_{\\mathcal{B}}^{-1}\\mathbf{x}', { x: 710, y: 320, size: 40, color: C.green, visible: false });
        const fixNum = checkMark(s, `\\dfrac{1}{${t(PB_DET)}}${texMat(PB_ADJ)}${texVec(X)} = ${texVec(XB)}`, { x: 710, y: 440, size: 34, visible: false });
        return { right, rightNum, wrong, wrongNum, wrongChk, fix, fixNum };
      },
      steps: [
        {
          say: 'Here\'s the rule: $P_{\\mathcal{B}}${P B} eats coordinates and returns the vector. Feed it $(3, 2)${three, two} and out comes $(4, 5)${four, five}.',
          do: async (s, o) => {
            await o.right.write();
            await o.rightNum.write({ duration: 1100 });
          },
        },
        {
          say: 'Here\'s the trap: multiplying $P_{\\mathcal{B}}${P B} by $\\mathbf{x}${x} to get its coordinates. That gives $(3, 9)${three, nine}, and three $\\mathbf{b}_1${b one} plus nine $\\mathbf{b}_2${b two} isn\'t $\\mathbf{x}${x} at all.',
          do: async (s, o) => {
            await o.wrong.write();
            await o.wrongNum.write();
            await o.wrongChk.write();
            o.box = s.surround(s.group(o.wrong, o.wrongNum, o.wrongChk).box(), { pad: 12, visible: false });
            await o.box.draw();
            await s.strike(o.wrong, { color: 'yellow' });
          },
        },
        {
          say: 'To go from the vector to its coordinates you need the inverse, $P_{\\mathcal{B}}^{-1}${P B inverse}, or just row reduce. Then you get $(3, 2)${three, two} back.',
          do: async (s, o) => {
            await o.fix.write();
            await o.fixNum.write({ duration: 1100 });
          },
        },
      ],
    },

    // 11
    {
      id: 'wo-coords-3d',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Find the coordinates of this vector relative to the basis, then check by rebuilding the vector.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateCoords,
    },

    // 12
    {
      id: 'try-basis-count',
      kind: 'try',
      title: 'Your turn',
      say: 'Which of these sets is a basis for $\\mathbb{R}^3${R three}? Check both halves of the definition.',
      prompt: 'Which set is a basis for $\\mathbb{R}^3$?',
      answer: { type: 'choice', value: BASIS_ID },
      choices: [
        { id: 'a', label: `$${setTex(SETS.a)}$`, why: 'Independent, but two vectors can\'t span $\\mathbb{R}^3$.' },
        { id: 'b', label: `$${setTex(SETS.b)}$`, why: 'It spans, but four vectors in $\\mathbb{R}^3$ are always dependent: there is an extra.' },
        { id: 'c', label: `$${setTex(SETS.c)}$`, why: `Right: the matrix with these columns has determinant $${t(det(fromCols(SETS.c.map(vec))))} \\neq 0$, so they are independent and span.` },
        { id: 'd', label: `$${setTex(SETS.d)}$`, why: 'The third vector is the sum of the first two, so the set is dependent.' },
      ],
      hint: 'A basis of $\\mathbb{R}^3$ has exactly three vectors, and they must be independent.',
      solution: [
        'A basis must span **and** be independent. Two vectors never span $\\mathbb{R}^3$, and four vectors in $\\mathbb{R}^3$ are always dependent, so only the three-vector sets are candidates.',
        `For (d), $${tup(SETS.d[0])} + ${tup(SETS.d[1])} = ${tup(SETS.d[2])}$: dependent.`,
        `For (c), $\\det${texMat(fromCols(SETS.c.map(vec)))} = ${t(det(fromCols(SETS.c.map(vec))))} \\neq 0$, so the columns are independent and span $\\mathbb{R}^3$ (Invertible Matrix Theorem): a basis.`,
      ],
    },

    // 13
    {
      id: 'cp-coords',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: 'Why are coordinates relative to a basis unique, and why would they fail to be unique for a spanning set that isn\'t a basis?',
      points: [
        'If $\\mathbf{x} = \\sum c_i\\mathbf{b}_i = \\sum d_i\\mathbf{b}_i$, subtracting gives $\\sum (c_i - d_i)\\mathbf{b}_i = \\mathbf{0}$',
        'Independence forces every $c_i - d_i = 0$, so the two representations are the same',
        'With a dependence relation, you can add it to any representation and get a different one',
        'Spanning guarantees coordinates exist; independence makes them unique',
      ],
    },

    // 14
    {
      id: 'summary-bases',
      title: 'Summary',
      scene(s) {
        const cp = coordPlane(s, { x: 250, y: 220, width: 360, labels: false, visible: true });
        const xl = s.tex(`[\\mathbf{x}]_{\\mathcal{B}} = ${tup(XB)}`, { x: 250, y: 410, size: 32, color: C.green, visible: false });
        const iso = s.tex(`${polyTex(PP)} \\;\\longmapsto\\; ${texVec(PP)}`, { x: 700, y: 220, size: 34, visible: false });
        const isoL = s.tex('\\mathbb{P}_2 \\;\\cong\\; \\mathbb{R}^3', { x: 700, y: 350, size: 34, color: C.muted, visible: false });
        const items = [
          'A basis spans, with no redundancy.',
          'Coordinates are the weights, and they are unique.',
          'Coordinates turn an $n$-dimensional space into $\\mathbb{R}^n$.',
        ].map((str, i) => s.text(str, { x: 480, y: 470 + 42 * i, size: 30, visible: false }));
        return { ...cp, xl, iso, isoL, items };
      },
      steps: [
        {
          say: 'A basis is a spanning set with no redundancy. In the plane it lays down a grid.',
          do: async (s, o) => {
            await o.p.applyMatrix(PBX[0], { duration: 1200 });
            await o.items[0].fadeIn();
          },
        },
        {
          say: 'The coordinates of a vector are its weights on that grid, and they\'re unique.',
          do: async (s, o) => {
            await o.xv.grow();
            await s.all(o.xl.write(), o.items[1].fadeIn());
          },
        },
        {
          say: 'And coordinates turn any space with a basis of $n${n} vectors into $\\mathbb{R}^n${R n}, so row reduction works there too. Next time: why every basis of a space has the same size.',
          do: async (s, o) => {
            await o.iso.write();
            await s.all(o.isoL.fadeIn(), o.items[2].fadeIn());
          },
        },
      ],
    },
  ],
};
