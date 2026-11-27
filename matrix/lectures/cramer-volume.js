/**
 * Lecture 12 · Cramer's rule, area, and volume (Lay 3.3). Design: matrix/PLAN.md § 12.
 * Every determinant, cofactor, inverse and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
/** A translucent tint of a stage color (shapes keep the grid visible underneath). */
const soft = (color, pct = 20) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
import { mat, vec, det, cofactor, minor, inverse, transpose, eqMat, texMat } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
/** A value in parentheses when negative (for products and substitutions). */
const p = (x) => (F(x).sign() < 0 ? `(${t(x)})` : t(x));

/** Column j of A replaced by b: Lay's A_j(b). */
const replaceCol = (A, j, b) => A.map((row, i) => row.map((x, c) => (c === j ? F(b[i]) : x)));
/** `ad - bc` for a 2 × 2 matrix, as TeX "6 - 1". */
const det2Terms = (M) => `${t(M[0][0].mul(M[1][1]))} - ${p(M[0][1].mul(M[1][0]))}`;

/** Beats 1–3: the running 2 × 2 system. */
const CA = mat([[2, 1], [1, 3]]);
const CB = vec([7, 11]);
const CA1 = replaceCol(CA, 0, CB);
const CA2 = replaceCol(CA, 1, CB);
const CD = det(CA);
const CD1 = det(CA1);
const CD2 = det(CA2);
const CX = [CD1.div(CD), CD2.div(CD)];
/** `2(2) + 3 = 7` for each equation, with a check mark. */
function substTex(row, x, rhs) {
  let out = '';
  row.forEach((c, j) => {
    const a = c.abs();
    const term = a.eq(1) ? p(x[j]) : `${t(a)}(${t(x[j])})`;
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + term;
  });
  return `${out} = ${t(rhs)}`;
}

/** Beat 4: the try. */
const TA = mat([[1, 2], [3, 4]]);
const TB = vec([5, 6]);
const TD = det(TA);
const TD1 = det(replaceCol(TA, 0, TB));
const TD2 = det(replaceCol(TA, 1, TB));
const TX = [TD1.div(TD), TD2.div(TD)];

/** Beats 5–6: the adjugate (det 1, so adj A = A^{-1}). */
const AA = mat([[1, 2, 0], [0, 1, 1], [2, 4, 1]]);
const AD = det(AA);
const COF = AA.map((row, i) => row.map((_, j) => cofactor(AA, i, j)));
const ADJ = transpose(COF);
const AINV = inverse(AA);
const ADJ_OK = eqMat(ADJ.map((row) => row.map((x) => x.div(AD))), AINV);
if (!ADJ_OK) throw new Error('cramer-volume: adj A / det A should equal A^{-1}');
const SIGNS = AA.map((row, i) => row.map((_, j) => `\\col{muted}{${(i + j) % 2 ? '-' : '+'}}`));
/** C_ij = (±1) det(minor) = value. */
const cofTex = (i, j) =>
  `C_{${i + 1}${j + 1}} = ${(i + j) % 2 ? '-' : '+'}\\det${texMat(minor(AA, i, j))} = ${t(COF[i][j])}`;

/** Beat 7: the area picture. */
const PU = [3, 1];
const PV = [1, 2];
const PM = mat([[PU[0], PV[0]], [PU[1], PV[1]]]);
const PD = det(PM);
/** Bounding box of the parallelogram and the six corner pieces left over (their total area is computed). */
const BOX = [PU[0] + PV[0], PU[1] + PV[1]];
const PIECES = [
  [[0, 0], [PU[0], 0], PU],
  [[PU[0], 0], [BOX[0], 0], [BOX[0], PU[1]], PU],
  [PU, [BOX[0], PU[1]], BOX],
  [PV, BOX, [PV[0], BOX[1]]],
  [[0, PV[1]], PV, [PV[0], BOX[1]], [0, BOX[1]]],
  [[0, 0], PV, [0, PV[1]]],
];
const polyArea = (pts) => F(pts.reduce((s, [x1, y1], k) => {
  const [x2, y2] = pts[(k + 1) % pts.length];
  return s + x1 * y2 - x2 * y1;
}, 0)).abs().div(2);
const PIECE_AREA = PIECES.reduce((s, q) => s.add(polyArea(q)), F(0));
if (!F(BOX[0] * BOX[1]).sub(PIECE_AREA).eq(PD.abs())) throw new Error('cramer-volume: dissection does not add up');

/** Beat 7, step 3: the parallelepiped. */
const VU = [[1, 0, 0], [1, 2, 0], [1, 1, 3]];
const VM = transpose(mat(VU));
const VD = det(VM);

/** Beats 8–9: a parallelogram away from the origin. */
const QP = [1, 1];
const QA = [4, 2];
const QB = [2, 4];
const QE1 = [QA[0] - QP[0], QA[1] - QP[1]];
const QE2 = [QB[0] - QP[0], QB[1] - QP[1]];
const QC = [QP[0] + QE1[0] + QE2[0], QP[1] + QE1[1] + QE2[1]];
const QM = mat([[QE1[0], QE2[0]], [QE1[1], QE2[1]]]);
const QD = det(QM);
const QW = mat([[QA[0], QB[0]], [QA[1], QB[1]]]);
const QWD = det(QW);

/** Beat 10: the stretch. */
const SM = mat([[3, 0], [0, 2]]);
const SD = det(SM);
const DISK = Array.from({ length: 64 }, (_, k) => [Math.cos((2 * Math.PI * k) / 64), Math.sin((2 * Math.PI * k) / 64)]);

/** Beat 12. */
const VOL_DET = F(-3);
const VOL_IN = F(4);
const VOL_OUT = VOL_DET.abs().mul(VOL_IN);

// ---------------------------------------------------------------- workout: area from vertices

const ptTex = (q) => `(${q.map(t).join(', ')})`;
function areaItem(P, u, v, order) {
  const verts = [P, [P[0] + u[0], P[1] + u[1]], [P[0] + v[0], P[1] + v[1]], [P[0] + u[0] + v[0], P[1] + u[1] + v[1]]];
  const shown = order.map((k) => verts[k]);
  // work from the first listed vertex: its opposite is the one whose sum with it equals the other two's sum
  const Q = shown[0];
  const rest = shown.slice(1);
  const opp = rest.find((R) => {
    const others = rest.filter((X) => X !== R);
    return Q[0] + R[0] === others[0][0] + others[1][0] && Q[1] + R[1] === others[0][1] + others[1][1];
  });
  const [N1, N2] = rest.filter((X) => X !== opp);
  const e1 = [N1[0] - Q[0], N1[1] - Q[1]];
  const e2 = [N2[0] - Q[0], N2[1] - Q[1]];
  const M = mat([[e1[0], e2[0]], [e1[1], e2[1]]]);
  const d = det(M);
  const area = d.abs();
  return {
    prompt: `Find the area of the parallelogram with vertices $${shown.map(ptTex).join(',\\ ')}$.`,
    answer: { type: 'number', value: String(area) },
    hints: [
      `Which vertices are adjacent? From $${ptTex(Q)}$ the edges go to $${ptTex(N1)}$ and $${ptTex(N2)}$; the fourth vertex $${ptTex(opp)}$ is opposite it.`,
      `Subtract the corner: the edge vectors are $${ptTex(e1)}$ and $${ptTex(e2)}$.`,
    ],
    solution: [
      `Start at the corner $${ptTex(Q)}$. Its neighbours are $${ptTex(N1)}$ and $${ptTex(N2)}$, so the edge vectors are $${ptTex(N1)} - ${ptTex(Q)} = ${ptTex(e1)}$ and $${ptTex(N2)} - ${ptTex(Q)} = ${ptTex(e2)}$.`,
      `Area $= \\left|\\det${texMat(M)}\\right| = |${det2Terms(M)}| = |${t(d)}| = ${t(area)}$.`,
      `Check the fourth vertex: $${ptTex(Q)} + ${ptTex(e1)} + ${ptTex(e2)} = ${ptTex(opp)}$, as listed.`,
    ],
  };
}
const WO_AREA = areaItem([-2, 1], [3, 1], [2, 3], [0, 1, 2, 3]);
function generateArea(rand) {
  for (;;) {
    const P = [rand.int(-3, 3), rand.int(-3, 3)];
    const u = [rand.int(-2, 4), rand.int(-2, 4)];
    const v = [rand.int(-2, 4), rand.int(-2, 4)];
    const d = u[0] * v[1] - u[1] * v[0];
    if (d === 0 || Math.abs(d) > 20 || Math.abs(d) < 3) continue;
    if ([u, v].some((w) => w[0] === 0 && w[1] === 0)) continue;
    const far = [P[0] + u[0] + v[0], P[1] + u[1] + v[1]];
    if (far.some((x) => Math.abs(x) > 8)) continue;
    return areaItem(P, u, v, rand.shuffle([0, 1, 2, 3]));
  }
}

// ---------------------------------------------------------------- scene helpers

const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];
/** Colors a named \part immediately (KaTeX's \textcolor rejects CSS variables). */
function paint(tex, name, color) {
  for (const e of tex.part(name)) e.style.color = color;
  return tex;
}
const checked = (s, tex, opts) => paint(s.tex(`${tex}\\ \\part{ck}{\\checkmark}`, opts), 'ck', C.green);

/**
 * Moves copies of a column vector's entries into column j of `to` and swaps them in (b sliding into A).
 * Created inside a step, so seeking replays it.
 */
async function flyColumn(s, from, to, j, color) {
  const col = from.values().map((row) => row[0]);
  const flyers = col.map((v, i) => {
    const a = from.cellBox(i, 0);
    return s.tex(v.tex(), { x: a.cx, y: a.cy, size: from.size, color });
  });
  await s.all(
    to.highlightCol(j, color),
    flyers.map((f, i) => {
      const b = to.cellBox(i, j);
      return f.moveTo(b.cx, b.cy, { duration: 900, delay: i * 140 });
    }),
  );
  await s.all(
    col.map((v, i) => to.setEntry(i, j, v, { duration: 400 })),
    flyers.map((f) => f.fadeOut({ duration: 300 })),
  );
}

/** Beat 1 layout, reused at the start of beat 2. */
const cramerMats = (s, visible) => ({
  mA: s.matrix(CA, { x: 230, y: 170, size: 44, visible }),
  mb: s.matrix(CB.map((x) => [x]), { x: 430, y: 170, size: 44, visible }),
  lA: s.tex('A', { x: 230, y: 55, size: 40, visible }),
  lb: s.tex('\\mathbf{b}', { x: 430, y: 55, size: 40, visible }),
});

/** The plane with both lines of the running system (beat 2). */
function systemPlane(s) {
  const pl = s.plane({ x: 730, y: 265, width: 360, range: [-1, 6, -1, 6], names: ['x_1', 'x_2'], visible: false });
  const l1 = pl.line({ a: Number(CA[0][0]), b: Number(CA[0][1]), c: Number(CB[0]) }, { color: C.blue, visible: false });
  const l2 = pl.line({ a: Number(CA[1][0]), b: Number(CA[1][1]), c: Number(CB[1]) }, { color: C.red, visible: false });
  const pt = pl.point(CX.map(Number), { color: C.green, r: 11, label: ptTex(CX), labelColor: C.green, visible: false });
  return { pl, l1, l2, pt };
}

/** A parallelepiped on three edge vectors, drawn as translucent faces projected from a Space (static view). */
function parallelepiped(s, sp, U, color) {
  const at = (a, b, c) => sp.toStage([0, 1, 2].map((k) => a * U[0][k] + b * U[1][k] + c * U[2][k]));
  const faces = [];
  for (const [i, j, k] of [[0, 1, 2], [0, 2, 1], [1, 2, 0]]) {
    for (const off of [0, 1]) {
      const pt = (a, b) => {
        const w = [0, 0, 0];
        w[i] = a;
        w[j] = b;
        w[k] = off;
        return at(...w);
      };
      faces.push(s.polygon([pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)], { color, width: 2, fill: soft(color, 14), visible: false }));
    }
  }
  return faces;
}

/** A small plane for the area panels and pictures. */
const areaPlane = (s, opts) => s.plane({ names: ['x_1', 'x_2'], visible: false, ...opts });

// ---------------------------------------------------------------- the lecture

export default {
  id: 'cramer-volume',
  title: "Cramer's rule, area, and volume",
  goals: [
    "Solve small systems with Cramer's rule, $x_i = \\det A_i(\\mathbf{b})/\\det A$",
    'Write $A^{-1} = \\frac{1}{\\det A}\\operatorname{adj} A$ and find one entry of an inverse from a cofactor',
    'Compute areas and volumes as $|\\det|$, and how a linear map scales them',
  ],
  beats: [
    // 1
    {
      id: 'cramer-idea',
      title: 'Replace a column',
      scene(s) {
        const o = cramerMats(s, false);
        o.eq = s.tex('A\\mathbf{x} = \\mathbf{b}', { x: 730, y: 170, size: 48, visible: false });
        o.m1 = s.matrix(CA, { x: 230, y: 170, size: 44, visible: false });
        o.m2 = s.matrix(CA, { x: 230, y: 170, size: 44, visible: false });
        o.l1 = s.tex('A_1(\\mathbf{b})', { x: 300, y: 505, size: 40, color: C.blue, visible: false });
        o.l2 = s.tex('A_2(\\mathbf{b})', { x: 660, y: 505, size: 40, color: C.red, visible: false });
        o.rule = s.defCard({
          kind: 'theorem', x: 480, y: 150, width: 820, visible: false, title: 'Theorem 7 (Cramer\'s rule)',
          body: 'Let $A$ be an invertible $n\\times n$ matrix. For any $\\mathbf{b}$ in $\\mathbb{R}^n$, the unique solution $\\mathbf{x}$ of $A\\mathbf{x} = \\mathbf{b}$ has entries $x_i = \\det A_i(\\mathbf{b}) / \\det A$, for $i = 1, \\dots, n$.',
        });
        return o;
      },
      steps: [
        {
          say: 'Here is a system $A\\mathbf{x} = \\mathbf{b}${A x equals b} with a two by two matrix. Cramer\'s rule starts with one move: take $A${A} and replace its first column with $\\mathbf{b}${b}. That matrix is called $A_1(\\mathbf{b})${A one of b}.',
          do: async (s, o) => {
            await s.all(o.mA.fadeIn(), o.lA.fadeIn(), o.mb.fadeIn({ delay: 200 }), o.lb.fadeIn({ delay: 200 }), o.eq.write({ delay: 300 }));
            o.m1.show();
            await o.m1.moveTo(300, 390, { duration: 900 });
            await flyColumn(s, o.mb, o.m1, 0, C.blue);
            await o.l1.fadeIn();
          },
        },
        {
          say: 'Do the same with the second column and you get $A_2(\\mathbf{b})${A two of b}. In general, $A_i(\\mathbf{b})${A i of b} is $A${A} with column $i${i} replaced by $\\mathbf{b}${b}.',
          do: async (s, o) => {
            o.m2.show();
            await o.m2.moveTo(660, 390, { duration: 900 });
            await flyColumn(s, o.mb, o.m2, 1, C.red);
            await o.l2.fadeIn();
          },
        },
        {
          say: 'Cramer\'s rule, Theorem 7: when $A${A} is invertible, the unique solution has each unknown as a ratio of two determinants, $x_i = \\det A_i(\\mathbf{b}) / \\det A${x i equals the determinant of A i of b, divided by the determinant of A}.',
          do: async (s, o) => {
            await s.all([o.mA, o.mb, o.lA, o.lb, o.eq].map((m) => m.fadeOut()));
            await o.rule.reveal({ duration: 1400 });
          },
        },
      ],
    },

    // 2
    {
      id: 'cramer-worked',
      title: 'Worked example',
      scene(s) {
        const X0 = 255;
        const L = (tex, y, opts = {}) => s.tex(tex, { x: X0, y, size: 32, visible: false, ...opts });
        const o = {
          dA: L(`\\det A = ${det2Terms(CA)} = ${t(CD)}`, 70),
          d1: L(`\\det A_1(\\mathbf{b}) = ${det2Terms(CA1)} = ${t(CD1)}`, 135, { color: C.blue }),
          d2: L(`\\det A_2(\\mathbf{b}) = ${det2Terms(CA2)} = ${t(CD2)}`, 200, { color: C.red }),
          x1: L(`x_1 = \\dfrac{${t(CD1)}}{${t(CD)}} = ${t(CX[0])}`, 295, { size: 36, color: C.green }),
          x2: L(`x_2 = \\dfrac{${t(CD2)}}{${t(CD)}} = ${t(CX[1])}`, 395, { size: 36, color: C.green }),
          c1: checked(s, substTex(CA[0], CX, CB[0]), { x: X0, y: 480, size: 32, color: C.blue, visible: false }),
          c2: checked(s, substTex(CA[1], CX, CB[1]), { x: X0, y: 535, size: 32, color: C.red, visible: false }),
          ...systemPlane(s),
        };
        o.e1 = s.tex(`${CA[0][0]}x_1 + x_2 = ${CB[0]}`, { x: 730, y: 495, size: 32, color: C.blue, visible: false });
        o.e2 = s.tex(`x_1 + ${CA[1][1]}x_2 = ${CB[1]}`, { x: 730, y: 548, size: 32, color: C.red, visible: false });
        return o;
      },
      steps: [
        {
          say: 'First the determinant of $A${A}: six minus one, which is $5${five}. It isn\'t zero, so the system has exactly one solution, and the two lines cross once.',
          do: async (s, o) => {
            await o.dA.write();
            await o.pl.draw({ duration: 800 });
            await s.all(o.l1.draw({ duration: 700 }), o.e1.fadeIn());
            await s.all(o.l2.draw({ duration: 700 }), o.e2.fadeIn());
          },
        },
        {
          say: 'The other two determinants are $10${ten} and $15${fifteen}. So $x_1 = 10/5 = 2${x one is ten over five, which is two}, and $x_2 = 15/5 = 3${x two is fifteen over five, which is three}.',
          do: async (s, o) => {
            await o.d1.write({ duration: 700 });
            await o.d2.write({ duration: 700 });
            await o.x1.write({ duration: 700 });
            await o.x2.write({ duration: 700 });
            await o.pt.draw();
          },
        },
        {
          say: 'Check it in the original equations: four plus three is seven, and two plus nine is eleven. The point $(2, 3)${two, three} sits on both lines.',
          do: async (s, o) => {
            await o.c1.write({ duration: 700 });
            await o.c2.write({ duration: 700 });
            await o.pt.flash({ color: C.green });
          },
        },
      ],
    },

    // 3
    {
      id: 'cramer-why',
      title: 'Why it works',
      scene(s) {
        const m = s.matrix([[1, 0], [0, 1]], { x: 318, y: 120, size: 44, visible: false });
        const lab = s.tex('I =', { x: 222, y: 120, size: 44, anchor: [1, 0.5], visible: false });
        const dI = s.tex('\\det I_1(\\mathbf{x}) = x_1 \\cdot 1 = x_1', { x: 670, y: 120, size: 34, visible: false });
        const eq1 = s.tex(
          'A\\,I_1(\\mathbf{x}) = \\begin{bmatrix} A\\mathbf{x} & A\\mathbf{e}_2 \\end{bmatrix} = \\begin{bmatrix} \\mathbf{b} & \\mathbf{a}_2 \\end{bmatrix} = A_1(\\mathbf{b})',
          { x: 480, y: 270, size: 38, visible: false },
        );
        const eq2 = s.tex('\\det A \\cdot \\part{d}{\\det I_1(\\mathbf{x})} = \\det A_1(\\mathbf{b})', { x: 480, y: 375, size: 38, visible: false });
        const fin = s.tex('x_1 = \\dfrac{\\det A_1(\\mathbf{b})}{\\det A}', { x: 480, y: 495, size: 44, color: C.green, visible: false });
        const dIi = s.tex('\\det I_i(\\mathbf{x}) = x_i', { x: 785, y: 495, size: 32, color: C.muted, visible: false });
        return { m, lab, dI, eq1, eq2, fin, dIi };
      },
      steps: [
        {
          say: 'Why does this work? Take the identity matrix and replace its first column with the unknown $\\mathbf{x}${x}; call it $I_1(\\mathbf{x})${I one of x}.',
          do: async (s, o) => {
            await s.all(o.m.fadeIn(), o.lab.fadeIn());
            await s.all(o.m.highlightCol(0, C.blue), o.m.setEntry(0, 0, 'x_1'), o.m.setEntry(1, 0, 'x_2', { delay: 150 }), o.lab.swap('I_1(\\mathbf{x}) ='));
          },
        },
        {
          say: 'Multiply by $A${A}. The first column becomes $A\\mathbf{x}${A x}, which is $\\mathbf{b}${b}, and the second stays a column of $A${A}. So $A\\,I_1(\\mathbf{x}) = A_1(\\mathbf{b})${A times I one of x equals A one of b}.',
          do: (s, o) => o.eq1.write({ duration: 1600 }),
        },
        {
          say: 'The matrix $I_1(\\mathbf{x})${I one of x} is triangular, so its determinant is the product of the diagonal: just $x_1${x one}.',
          do: async (s, o) => {
            await o.m.clearHighlights({ duration: 200 });
            await s.all(o.m.highlightCell(0, 0, C.yellow), o.m.highlightCell(1, 1, C.yellow));
            await o.dI.write();
          },
        },
        {
          say: 'Now take determinants of both sides. Determinants multiply, so $\\det A \\cdot x_1 = \\det A_1(\\mathbf{b})${det A times x one equals det A one of b}; divide by $\\det A${det A}, allowed because it isn\'t zero.',
          do: async (s, o) => {
            await o.eq2.write();
            await o.eq2.color('d', C.yellow);
            await s.wait(500);
            await o.eq2.swap('\\det A \\cdot x_1 = \\det A_1(\\mathbf{b})');
            await o.fin.write();
            await o.fin.flash({ color: C.green });
          },
        },
        {
          say: 'Any column $i${i} works the same way, because $\\det I_i(\\mathbf{x}) = x_i${the determinant of I i of x is x i}. That\'s Cramer\'s rule for every unknown.',
          do: async (s, o) => {
            await o.dIi.fadeIn({ shift: [0, 0] });
            await o.fin.swap('x_i = \\dfrac{\\det A_i(\\mathbf{b})}{\\det A}');
            await o.fin.flash({ color: C.green });
          },
        },
      ],
    },

    // 4
    {
      id: 'try-cramer',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Use Cramer\'s rule, and you only need one of the two unknowns.',
      prompt: 'Use Cramer\'s rule to solve $x_1 + 2x_2 = 5,\\; 3x_1 + 4x_2 = 6$. What is $x_2$?',
      answer: { type: 'number', value: String(TX[1]) },
      hint: `First, $\\det A = ${det2Terms(TA)} = ${t(TD)}$. For $x_2$, put $\\mathbf{b}$ in column 2.`,
      solution: [
        `$\\det A = \\det${texMat(TA)} = ${det2Terms(TA)} = ${t(TD)}$, which is nonzero, so Cramer's rule applies.`,
        `$\\det A_2(\\mathbf{b}) = \\det${texMat(replaceCol(TA, 1, TB))} = ${det2Terms(replaceCol(TA, 1, TB))} = ${t(TD2)}$, so $x_2 = \\dfrac{${t(TD2)}}{${t(TD)}} = ${t(TX[1])}$.`,
        `(Likewise $\\det A_1(\\mathbf{b}) = ${t(TD1)}$ gives $x_1 = ${t(TX[0])}$. Check: $${t(TX[0])} + 2\\cdot ${t(TX[1])} = ${t(TX[0].add(TX[1].mul(2)))}$ and $3(${t(TX[0])}) + 4\\cdot ${t(TX[1])} = ${t(TX[0].mul(3).add(TX[1].mul(4)))}$.)`,
      ],
    },

    // 5
    {
      id: 'adjugate',
      title: 'An inverse formula (Theorem 8)',
      scene(s) {
        const o = {
          mA: s.matrix(AA, { x: 150, y: 225, size: 32, visible: false }),
          mC: s.matrix(SIGNS, { x: 465, y: 225, size: 32, visible: false }),
          mJ: s.matrix(ADJ, { x: 790, y: 225, size: 32, visible: false }),
          lA: s.tex('A', { x: 150, y: 85, size: 36, visible: false }),
          lC: s.tex('\\text{cofactors } C_{ij}', { x: 465, y: 85, size: 34, visible: false }),
          lJ: s.tex('\\operatorname{adj} A', { x: 780, y: 85, size: 36, color: C.green, visible: false }),
          note: s.tex(cofTex(0, 0), { x: 480, y: 410, size: 34, visible: false }),
          formula: s.tex('A^{-1} = \\dfrac{1}{\\det A}\\,\\operatorname{adj} A', { x: 480, y: 520, size: 40, color: C.green, visible: false }),
        };
        o.arrow = s.arrow(595, 225, 665, 225, { color: C.muted, visible: false });
        o.tLab = s.tex('T', { x: 630, y: 190, size: 32, color: C.muted, visible: false });
        return o;
      },
      steps: [
        {
          say: 'For each entry of $A${A}, cross out its row and column, take the determinant of what\'s left, and attach the checkerboard sign. That\'s the cofactor $C_{ij}${C i j}.',
          do: async (s, o) => {
            await s.all(o.mA.fadeIn(), o.lA.fadeIn(), o.mC.fadeIn({ delay: 200 }), o.lC.fadeIn({ delay: 200 }));
            for (const j of [0, 1, 2]) {
              await s.all(o.mA.clearHighlights({ duration: 200 }), o.mC.clearHighlights({ duration: 200 }));
              await s.all(o.mA.highlightRow(0, C.muted), o.mA.highlightCol(j, C.muted), o.mA.highlightCell(0, j, C.yellow));
              if (j === 0) await o.note.fadeIn({ shift: [0, 0] });
              else await o.note.swap(cofTex(0, j), { duration: 400 });
              await s.all(o.mC.setEntry(0, j, COF[0][j]), o.mC.highlightCell(0, j, C.yellow));
            }
          },
        },
        {
          say: 'Collect all nine. Then comes the step people forget: transpose. The adjugate of $A${A} is the transpose of the cofactor matrix.',
          do: async (s, o) => {
            await s.all(o.mA.clearHighlights(), o.mC.clearHighlights(), o.note.fadeOut());
            const rest = [];
            for (const i of [1, 2]) for (const j of [0, 1, 2]) rest.push([i, j]);
            await s.stagger(rest.map(([i, j]) => () => o.mC.setEntry(i, j, COF[i][j])), 160);
            await s.all(o.arrow.draw({ duration: 400 }), o.tLab.fadeIn());
            const flyers = [];
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                const a = o.mC.cellBox(i, j);
                flyers.push({ m: s.tex(t(COF[i][j]), { x: a.cx, y: a.cy, size: 32, color: i === 0 ? C.yellow : C.ink }), to: o.mJ.cellBox(j, i) });
              }
            }
            await s.all(flyers.map(({ m, to }, k) => m.moveTo(to.cx, to.cy, { duration: 1100, delay: k * 60 })));
            await s.all(o.mJ.fadeIn({ shift: [0, 0], duration: 300 }), o.lJ.fadeIn(), flyers.map(({ m }) => m.fadeOut({ duration: 300 })));
            await o.mJ.highlightCol(0, C.yellow);
          },
        },
        {
          say: 'Theorem 8 says $A^{-1} = \\frac{1}{\\det A}\\operatorname{adj} A${A inverse equals one over det A, times the adjugate of A}. Here $\\det A = 1${det A is one}, so the adjugate is the inverse itself, the same one row reduction gave us.',
          do: async (s, o) => {
            await o.formula.write();
            await o.lJ.swap('\\operatorname{adj} A = A^{-1}');
          },
        },
        {
          say: 'This formula is great for theory and for a single entry of the inverse. For the whole inverse, row reduction is much less work.',
          do: async (s, o) => {
            await o.mJ.clearHighlights();
            await o.note.swap('\\text{one entry: a cofactor} \\qquad \\text{all of } A^{-1}\\text{: row reduce}');
            await o.note.animate({ opacity: 1 }, { duration: 200 });
          },
        },
      ],
    },

    // 6
    {
      id: 'fill-adj',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks. Watch the order of the indices.',
      figure(s) {
        s.tex('A =', { x: 330, y: 300, size: 56, anchor: [1, 0.5] });
        s.matrix(AA, { x: 530, y: 300, size: 56 });
      },
      lines: [
        [
          '(A^{-1})_{12} = ',
          {
            tex: '\\frac{\\blank{c}}{\\det A} = \\blank{v}',
            blanks: {
              c: { chips: ['C_{21}', 'C_{12}', 'C_{11}'], answer: 'C_{21}', hint: 'The adjugate is the transpose of the cofactor matrix.' },
              v: { answer: { type: 'number', value: String(AINV[0][1]) } },
            },
          },
        ],
      ],
      solution: [
        'The adjugate is the *transpose* of the cofactor matrix, so entry $(1, 2)$ of $A^{-1}$ uses the cofactor $C_{21}$, not $C_{12}$.',
        `$C_{21} = -\\det${texMat(minor(AA, 1, 0))} = ${t(COF[1][0])}$, and $\\det A = ${t(AD)}$, so $(A^{-1})_{12} = ${t(COF[1][0].div(AD))}$.`,
      ],
    },

    // 7
    {
      id: 'area',
      title: 'Area = |det| (Theorem 9)',
      scene(s) {
        const pl = areaPlane(s, { x: 280, y: 300, width: 440, range: [-1, 5, -1, 4] });
        const u = pl.vector(PU, { color: C.blue, label: '\\mathbf{a}_1', visible: false });
        const v = pl.vector(PV, { color: C.red, label: '\\mathbf{a}_2', visible: false });
        const par = pl.parallelogram(PU, PV, { color: C.green, visible: false });
        const box = pl.polygon([[0, 0], [BOX[0], 0], BOX, [0, BOX[1]]], { color: C.muted, fill: 'none', dash: '8 6', width: 2, visible: false });
        const pieces = PIECES.map((q) => pl.polygon(q, { color: C.muted, width: 1, fill: soft(C.muted, 28), visible: false }));
        const thm2 = s.defCard({
          kind: 'theorem', title: 'Theorem 9', x: 712, y: 140, width: 410, visible: false,
          body: 'If $A$ is $2\\times 2$, the parallelogram on its columns has area $|\\det A|$.',
        });
        const colored = (M, colors) => `\\begin{bmatrix}${M.map((row) => row.map((x, j) => `\\col{${colors[j]}}{${t(x)}}`).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
        const dA = s.tex(`\\det${colored(PM, ['blue', 'red'])} = ${det2Terms(PM)} = ${t(PD)}`, { x: 720, y: 300, size: 32, visible: false });
        const count = s.tex(`${BOX[0]}\\cdot ${BOX[1]} - ${t(PIECE_AREA)} = ${t(PD.abs())}`, { x: 720, y: 385, size: 32, visible: false });
        const area = s.tex(`\\text{area} = |\\det A| = ${t(PD.abs())}`, { x: 720, y: 460, size: 34, color: C.green, visible: false });
        // step 3: the box in space
        const sp = s.space({ x: 300, y: 330, size: 380, range: 3.5, yaw: -30, pitch: 18, visible: false });
        const faces = parallelepiped(s, sp, VU, C.green);
        const vs = VU.map((w, k) => sp.vector(w, { color: [C.blue, C.red, C.orange][k], visible: false }));
        const thm3 = s.defCard({
          kind: 'theorem', title: 'Theorem 9', x: 700, y: 140, width: 440, visible: false,
          body: 'If $A$ is $3\\times 3$, the parallelepiped on its columns has volume $|\\det A|$.',
        });
        const mV = s.tex(`\\det${colored(VM, ['blue', 'red', 'orange'])} = ${t(VD)}`, { x: 720, y: 340, size: 32, visible: false });
        const dV = s.tex(`\\text{volume} = |\\det A| = ${t(VD.abs())}`, { x: 720, y: 470, size: 34, color: C.green, visible: false });
        return { pl, u, v, par, box, pieces, thm2, dA, count, area, sp, faces, vs, thm3, mV, dV };
      },
      steps: [
        {
          say: 'Draw the columns of $A${A} as two arrows. Together they span a parallelogram, and Theorem 9 says its area is the absolute value of $\\det A${det A}.',
          do: async (s, o) => {
            await s.all(o.pl.draw({ duration: 900 }), o.thm2.reveal());
            await s.all(o.u.grow(), o.v.grow({ delay: 200 }));
            await o.par.draw();
          },
        },
        {
          say: 'Here $\\det A = 6 - 1 = 5${det A is six minus one, which is five}. Check it by counting: the four by three box has area twelve, the six corner pieces add up to seven, and twelve minus seven is five.',
          do: async (s, o) => {
            await o.dA.write();
            await o.box.draw({ duration: 600 });
            await s.stagger(o.pieces.map((q) => () => q.fadeIn({ shift: [0, 0], duration: 350 })), 160);
            await o.count.write();
            await s.all(o.area.write(), o.par.flash({ color: C.green }));
          },
        },
        {
          say: 'The same is true in space. Three columns span a slanted box, a parallelepiped, and its volume is $|\\det A|${the absolute value of det A}. This one has volume $6${six}.',
          do: async (s, o) => {
            await s.all(o.pl.fadeOut(), [o.thm2, o.dA, o.count, o.area].map((m) => m.fadeOut()));
            await o.thm3.reveal({ duration: 800 });
            await o.sp.draw();
            await s.all(o.vs.map((w, k) => w.grow({ delay: k * 200 })), o.mV.fadeIn());
            await s.all(o.faces.map((f, k) => f.fadeIn({ shift: [0, 0], delay: k * 80 })));
            await o.dV.write();
          },
        },
      ],
    },

    // 8
    {
      id: 'translated',
      title: 'A parallelogram anywhere',
      scene(s) {
        const pl = areaPlane(s, { x: 290, y: 300, width: 440, range: [-1, 6, -1, 6] });
        const corners = [QP, QA, QC, QB];
        const poly = pl.polygon(corners, { color: C.green, visible: false });
        const labs = corners.map((q) => pl.label(q, ptTex(q), { size: 30, offset: [q[0] >= QC[0] ? 0 : 0, q === QP ? 26 : -26], visible: false }));
        const shiftV = pl.vector([-QP[0], -QP[1]], { tail: QP, color: C.muted, width: 3, visible: false });
        const e1 = pl.vector(QE1, { color: C.blue, label: ptTex(QE1), visible: false });
        const e2 = pl.vector(QE2, { color: C.red, label: ptTex(QE2), visible: false });
        const X0 = 730;
        const t1 = s.tex(`${ptTex(QA)} - ${ptTex(QP)} = ${ptTex(QE1)}`, { x: X0, y: 200, size: 32, color: C.blue, visible: false });
        const t2 = s.tex(`${ptTex(QB)} - ${ptTex(QP)} = ${ptTex(QE2)}`, { x: X0, y: 260, size: 32, color: C.red, visible: false });
        const area = s.tex(`\\left|\\det${texMat(QM)}\\right| = ${t(QD.abs())}`, { x: X0, y: 380, size: 34, color: C.green, visible: false });
        const calc = s.tex(`|${det2Terms(QM)}| = ${t(QD.abs())}`, { x: X0, y: 465, size: 32, color: C.green, visible: false });
        const head = s.text('Slide a corner to the origin', { x: X0, y: 110, size: 30, color: C.muted, visible: false });
        return { pl, poly, labs, shiftV, e1, e2, t1, t2, area, calc, head };
      },
      steps: [
        {
          say: 'This parallelogram doesn\'t start at the origin. Slide it so the corner $(1, 1)${one, one} lands on the origin. Sliding doesn\'t change area.',
          do: async (s, o) => {
            await o.pl.draw({ duration: 800 });
            await s.all(o.poly.draw(), o.labs.map((l, k) => l.draw({ delay: 200 + k * 100 })));
            await s.all(o.shiftV.grow({ duration: 600 }), o.head.fadeIn());
            await s.all(o.labs.map((l) => l.fadeOut()), o.shiftV.fadeOut());
            await o.poly.morphTo([[0, 0], QE1, [QE1[0] + QE2[0], QE1[1] + QE2[1]], QE2], { duration: 1100 });
          },
        },
        {
          say: 'Now the two edges leaving that corner are vectors from the origin: $(3, 1)${three, one} and $(1, 3)${one, three}. You get them by subtracting the corner from its two neighbours.',
          do: async (s, o) => {
            await s.all(o.e1.grow(), o.t1.write());
            await s.all(o.e2.grow(), o.t2.write());
          },
        },
        {
          say: 'So the area is the absolute value of $9 - 1${nine minus one}, which is $8${eight}.',
          do: async (s, o) => {
            await o.area.write();
            await o.calc.write();
            await o.poly.flash({ color: C.green });
          },
        },
      ],
    },

    // 9
    {
      id: 'mistake-vertices',
      title: 'The trap: using vertices as columns',
      scene(s) {
        const pl = areaPlane(s, { x: 270, y: 300, width: 440, range: [-1, 6, -1, 6], visible: true });
        const poly = pl.polygon([QP, QA, QC, QB], { color: C.green });
        const wa = pl.vector(QA, { color: C.yellow, visible: false });
        const wb = pl.vector(QB, { color: C.yellow, visible: false });
        const wpar = pl.parallelogram(QA, QB, { color: C.yellow, dash: '8 6', fill: soft(C.yellow, 14), visible: false });
        const e1 = pl.vector(QE1, { tail: QP, color: C.blue, visible: false });
        const e2 = pl.vector(QE2, { tail: QP, color: C.red, visible: false });
        const X0 = 705;
        const wrong = s.tex(`\\det${texMat(QW)} = ${det2Terms(QW)} = ${t(QWD)}`, { x: X0, y: 170, size: 30, color: C.yellow, visible: false });
        const box = s.surround(wrong, { pad: 10, visible: false });
        const why = s.text('those columns span a different parallelogram', { x: X0, y: 275, size: 30, width: 340, color: C.yellow, visible: false });
        const right = s.tex(`\\left|\\det${texMat(QM)}\\right| = ${t(QD.abs())}`, { x: X0, y: 420, size: 36, color: C.green, visible: false });
        const rightL = s.text('edges from one corner', { x: X0, y: 510, size: 30, color: C.green, visible: false });
        return { pl, poly, wa, wb, wpar, e1, e2, wrong, box, why, right, rightL };
      },
      steps: [
        {
          say: 'Here\'s the trap: putting two vertices in as the columns. That gives $16 - 4 = 12${sixteen minus four, which is twelve}.',
          do: async (s, o) => {
            await o.wrong.write();
            await o.box.draw();
          },
        },
        {
          say: 'Look at what those columns actually span: a different, bigger parallelogram, pinned at the origin.',
          do: async (s, o) => {
            await s.all(o.wa.grow(), o.wb.grow({ delay: 150 }));
            await o.wpar.draw();
            await o.why.fadeIn();
          },
        },
        {
          say: 'The columns must be edge vectors leaving one common corner. Subtract the corner first, and the determinant gives the right area, $8${eight}.',
          do: async (s, o) => {
            await s.all(s.strike(o.wrong, { color: C.yellow }), o.box.fadeOut(), o.why.fadeOut());
            await s.all(o.wpar.fadeOut(), o.wa.fadeOut(), o.wb.fadeOut());
            await s.all(o.e1.grow(), o.e2.grow({ delay: 150 }));
            await s.all(o.right.write(), o.rightL.fadeIn({ delay: 300 }));
          },
        },
      ],
    },

    // 10
    {
      id: 'transform-area',
      title: 'Linear maps scale every area by |det| (Theorem 10)',
      scene(s) {
        const pl = areaPlane(s, { x: 280, y: 225, width: 400, range: [-4, 4, -3, 3] });
        const disk = pl.polygon(DISK, { color: C.blue, visible: false });
        const sq = pl.polygon([[0, 0], [1, 0], [1, 1], [0, 1]], { color: C.yellow, fill: soft(C.yellow, 30), visible: false });
        const X0 = 760;
        const mA = s.matrix(SM, { x: X0 + 40, y: 85, size: 32, visible: false });
        const lA = s.tex('A =', { x: X0 - 45, y: 85, size: 32, anchor: [1, 0.5], visible: false });
        const dA = s.tex(`\\det A = ${t(SD)}`, { x: X0, y: 170, size: 32, visible: false });
        const sqA = s.tex(`\\square:\\ 1 \\to ${t(SD.abs())}`, { x: X0, y: 225, size: 32, color: C.yellow, visible: false });
        const ell = s.tex('\\dfrac{x_1^2}{9} + \\dfrac{x_2^2}{4} \\le 1', { x: X0, y: 295, size: 30, color: C.blue, visible: false });
        const dkA = s.tex(`\\pi \\to ${t(SD.abs())}\\pi`, { x: X0, y: 365, size: 32, color: C.blue, visible: false });
        const thm = s.defCard({
          kind: 'theorem', title: 'Theorem 10', x: 480, y: 478, width: 880, visible: false,
          body: 'If $T:\\mathbb{R}^2 \\to \\mathbb{R}^2$ is linear with standard matrix $A$, and $S$ is a region of finite area, then $\\operatorname{area} T(S) = |\\det A| \\cdot \\operatorname{area} S$.',
        });
        return { pl, disk, sq, mA, lA, dA, sqA, ell, dkA, thm };
      },
      steps: [
        {
          say: 'Now let $A${A} act on the whole plane. It stretches by $3${three} across and $2${two} up, so $\\det A = 6${det A is six}. Watch the unit disk and a unit square.',
          do: async (s, o) => {
            await s.all(o.pl.draw({ duration: 800 }), o.mA.fadeIn(), o.lA.fadeIn());
            await s.all(o.disk.draw(), o.sq.draw({ delay: 200 }), o.dA.write());
            await o.pl.applyMatrix(SM.map((r) => r.map(Number)), { duration: 1800 });
          },
        },
        {
          say: 'The square became a three by two rectangle: area $1${one} became $6${six}. Every little square of any region grows by the same factor, so any region\'s area is multiplied by $|\\det A|${the absolute value of det A}.',
          do: async (s, o) => {
            await s.all(o.sq.flash({ color: C.yellow }), o.sqA.write());
            await o.thm.reveal();
          },
        },
        {
          say: 'So the ellipse $x_1^2/9 + x_2^2/4 \\le 1${x one squared over nine, plus x two squared over four, at most one}, the image of the disk, has area $6\\pi${six pi}, with no calculus at all.',
          do: async (s, o) => {
            await o.ell.write();
            await s.all(o.disk.flash({ color: C.blue }), o.dkA.write());
          },
        },
      ],
    },

    // 11
    {
      id: 'wo-area',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Find the area from the four vertices, and be careful which ones are neighbours.',
      prompt: WO_AREA.prompt,
      answer: WO_AREA.answer,
      hints: WO_AREA.hints,
      solution: WO_AREA.solution,
      generate: generateArea,
    },

    // 12
    {
      id: 'try-volume-map',
      kind: 'try',
      title: 'Your turn',
      say: 'A quick one about volumes under a map.',
      prompt: `$T(\\mathbf{x}) = A\\mathbf{x}$ where $A$ is $3\\times 3$ with $\\det A = ${t(VOL_DET)}$. A solid of volume $${t(VOL_IN)}$ is mapped by $T$. What is the volume of its image?`,
      answer: { type: 'number', value: String(VOL_OUT) },
      hint: 'Volume can\'t be negative: use the absolute value of the determinant.',
      solution: [
        `Theorem 10: the volume is multiplied by $|\\det A| = |${t(VOL_DET)}| = ${t(VOL_DET.abs())}$.`,
        `So the image has volume $${t(VOL_DET.abs())} \\cdot ${t(VOL_IN)} = ${t(VOL_OUT)}$. The negative sign only says the map flips orientation.`,
      ],
    },

    // 13
    {
      id: 'cp-cramer',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain this in your own words.',
      prompt: 'Why does Cramer\'s rule need $\\det A \\ne 0$, and why isn\'t it used to solve big systems?',
      points: [
        'The rule divides by $\\det A$, so it only makes sense when $\\det A \\ne 0$',
        'If $\\det A = 0$ the matrix is not invertible, so there is no unique solution to find',
        'For an $n \\times n$ system it needs $n + 1$ determinants of size $n$, far more work than one row reduction',
        'It shines in theory (it shows exactly how $\\mathbf{x}$ depends on $\\mathbf{b}$) and for $2\\times 2$ or $3\\times 3$ by hand',
      ],
    },

    // 14
    {
      id: 'summary-cramer',
      title: 'Summary',
      scene(s) {
        const title = (str, x) => s.text(str, { x, y: 110, size: 32, weight: 600, visible: false });
        const cr = {
          h: title('Cramer\'s rule', 165),
          f: s.tex('x_i = \\dfrac{\\det A_i(\\mathbf{b})}{\\det A}', { x: 165, y: 270, size: 30, visible: false }),
          n: s.text('swap in $\\mathbf{b}$, divide by $\\det A$', { x: 165, y: 400, size: 30, width: 250, color: C.muted, visible: false }),
        };
        const ad = {
          h: title('Inverse formula', 480),
          f: s.tex('A^{-1} = \\dfrac{\\operatorname{adj} A}{\\det A}', { x: 480, y: 270, size: 30, visible: false }),
          n: s.text('$\\operatorname{adj} A$ = transpose of the cofactors', { x: 480, y: 400, size: 30, width: 250, color: C.muted, visible: false }),
        };
        const pl = areaPlane(s, { x: 790, y: 280, width: 220, range: [-0.5, 4.5, -0.5, 3.5], labels: false, names: null });
        const ar = {
          h: title('Area and volume', 790),
          pl,
          par: pl.parallelogram(PU, PV, { color: C.green, visible: false }),
          n: s.text('$|\\det A|$ = area, volume, and how maps scale them', { x: 790, y: 465, size: 30, width: 260, color: C.muted, visible: false }),
        };
        return { cr, ad, ar };
      },
      steps: [
        {
          say: 'Cramer\'s rule: swap $\\mathbf{b}${b} into column $i${i}, take the determinant, and divide by $\\det A${det A}.',
          do: async (s, o) => {
            await o.cr.h.fadeIn();
            await o.cr.f.write();
            await o.cr.n.fadeIn();
          },
        },
        {
          say: 'The inverse is the adjugate over the determinant, and the adjugate is the transpose of the cofactor matrix.',
          do: async (s, o) => {
            await o.ad.h.fadeIn();
            await o.ad.f.write();
            await o.ad.n.fadeIn();
          },
        },
        {
          say: 'And the absolute value of a determinant measures area and volume, and how much a linear map scales them.',
          do: async (s, o) => {
            await s.all(o.ar.h.fadeIn(), o.ar.pl.draw({ duration: 700 }));
            await o.ar.par.draw();
            await o.ar.n.fadeIn();
          },
        },
      ],
    },
  ],
};
