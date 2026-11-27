/**
 * Lecture 11 · Determinants (Lay 3.1–3.2). Design: matrix/PLAN.md § 11.
 * Every determinant, minor, row operation and answer below is computed with core/linalg.js.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, rref, det, minor, inverse, applyRowOp, texMat } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
const par = (x) => (F(x).sign() < 0 ? `(${t(x)})` : t(x));
const num = (M) => M.map((row) => row.map(Number));

/** Beats 1–2, 11, 15: maps of the plane and their determinants. */
const STRETCH = mat([[3, 0], [0, 2]]);
const SHEAR = mat([[1, 1], [0, 1]]);
const FLIP = mat([[0, 1], [1, 0]]);
const SING = mat([[1, 2], [2, 4]]);
const TWO_I = mat([[2, 0], [0, 2]]);
const SQUARE = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** Beat 3: the parallelogram of the columns (a, c), (b, d) inside the (a+b) × (c+d) box. */
const [a, b, c, d] = [3, 1, 1, 2];
const P2 = mat([[a, b], [c, d]]);
const BOX = (a + b) * (c + d);

/** Beats 4–5: cofactor expansion. */
const CF = mat([[3, 0, 2], [1, 2, 0], [4, 0, 1]]);
const CF_DET = det(CF);
const ROW1 = [0, 1, 2].map((j) => {
  const sign = j % 2 ? -1 : 1;
  const M = minor(CF, 0, j);
  const dm = det(M);
  return { j, sign, a: CF[0][j], M, dm, prod: CF[0][j].mul(dm).mul(sign) };
});
const COL2 = (() => {
  const i = 1, j = 1;
  const M = minor(CF, i, j);
  const dm = det(M);
  const sign = (i + j) % 2 ? -1 : 1;
  return { i, j, sign, a: CF[i][j], M, dm, value: CF[i][j].mul(dm).mul(sign) };
})();
const TRI = mat([[2, 5, 1], [0, 3, 7], [0, 0, -1]]);
const TRY_TRI = mat([[2, 7, -1, 4], [0, -3, 5, 1], [0, 0, 1, 9], [0, 0, 0, 2]]);

/** Beat 7: Theorem 3 on a 2×2, its rows drawn as arrows. */
const BASE = mat([[2, 0], [0, 1]]);
const OPS = [
  { name: 'Replacement', step: { op: 'add', i: 0, j: 1, k: F(1) }, rule: 'det unchanged' },
  { name: 'Interchange', step: { op: 'swap', i: 0, j: 1 }, rule: 'det changes sign' },
  { name: 'Scaling', step: { op: 'scale', i: 1, k: F(3) }, rule: 'det times k' },
].map((o) => ({ ...o, after: applyRowOp(BASE, o.step) }));
const OP_TEX = ['R_1 \\to R_1 + R_2', 'R_1 \\leftrightarrow R_2', 'R_2 \\to 3R_2'];
const rowsPoly = (M) => {
  const [r1, r2] = num(M);
  return [[0, 0], r1, [r1[0] + r2[0], r1[1] + r2[1]], r2];
};

/** Beat 8: det by row reduction (replacements only). */
const RD = mat([[1, -2, 3], [2, -3, 8], [-1, 4, 3]]);
const RD_RED = rref(RD);
const RD_FWD = RD_RED.steps.filter((st) => st.phase === 'forward');
const RD_U = RD_RED.echelon;
const RD_DET = det(RD);
if (RD_FWD.some((st) => st.op !== 'add')) throw new Error('determinants: beat 8 needs replacements only');
const RD_PROD = RD_U.map((row, i) => row[i]).reduce((p, x) => p.mul(x), F(1));
if (!RD_PROD.eq(RD_DET)) throw new Error('determinants: product of pivots != det');

/** Beat 9. */
const D5 = F(5);

/** Beat 10: areas multiply. */
const PA = mat([[2, 0], [0, 1]]);
const PB = mat([[1, 1], [0, 3]]);
const TR_EX = mat([[1, 2], [3, 4]]);

/** Beat 13. */
const PROD_ANS = F(3).mul(F(-2).inv()).mul(3);

// ---------------------------------------------------------------- workout

/** Cofactor expansion of a 3×3 along row 1, as TeX: `2(3 - 8) - 0 + 5(4)`, with the value. */
function expand3(M) {
  const parts = [0, 1, 2].map((j) => {
    const m = minor(M, 0, j);
    const dm = det(m);
    return { a: M[0][j], m, dm, sign: j % 2 ? -1 : 1 };
  });
  const tex = parts
    .map((p, j) => {
      const coef = p.a.mul(p.sign);
      const body = `${par(p.a.abs())}\\,(${t(p.m[0][0])}\\cdot${par(p.m[1][1])} - ${par(p.m[0][1])}\\cdot${par(p.m[1][0])})`;
      const sgn = p.sign * (coef.zero ? 1 : p.a.sign()) < 0 ? '-' : '+';
      return j === 0 && sgn === '+' ? body : ` ${sgn} ${body}`;
    })
    .join('');
  return { tex, parts, value: det(M) };
}

function det4Item(A0) {
  const M = mat(A0);
  let j = [0, 1, 2, 3].find((c) => M.filter((row) => !row[c].zero).length === 1);
  const i = M.findIndex((row) => !row[j].zero);
  const sign = (i + j) % 2 ? -1 : 1;
  const m = minor(M, i, j);
  const e = expand3(m);
  const value = M[i][j].mul(e.value).mul(sign);
  if (!value.eq(det(M))) throw new Error('det4Item: expansion != det');
  return {
    prompt: `Compute $$\\det ${texMat(M)}.$$`,
    answer: { type: 'number', value: String(value) },
    hints: [
      `Column ${j + 1} has a single nonzero entry. Expand down that column.`,
      `That entry is in row ${i + 1}, so its cofactor sign is $(-1)^{${i + 1}+${j + 1}} = ${sign}$.`,
    ],
    solution: [
      `Expand down column ${j + 1}: only $a_{${i + 1}${j + 1}} = ${t(M[i][j])}$ is nonzero, so $\\det A = ${t(M[i][j])}\\cdot(-1)^{${i + 1}+${j + 1}}\\det ${texMat(m)}$.`,
      `Expand the $3\\times 3$ along its first row: $\\det ${texMat(m)} = ${e.tex} = ${t(e.value)}$.`,
      `So $\\det A = ${t(M[i][j])}\\cdot(${sign})\\cdot(${t(e.value)}) = ${t(value)}$.`,
    ],
  };
}
const WO = det4Item([[2, 0, 0, 5], [1, 3, 0, 2], [0, 4, 0, 1], [-1, 2, 1, 3]]);

/** A random 4×4 with small entries and one column holding a single nonzero entry. */
function generateDet4(rand) {
  for (;;) {
    const M = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => rand.int(-3, 3)));
    const j = rand.int(0, 3);
    const i = rand.int(0, 3);
    for (let r = 0; r < 4; r++) M[r][j] = r === i ? rand.nonzero(-3, 3) : 0;
    const D = det(mat(M));
    if (D.zero || D.abs().cmp(20) > 0) continue;
    if ([0, 1, 2, 3].filter((cc) => M.filter((row) => row[cc] !== 0).length === 1).length !== 1) continue;
    return det4Item(M);
  }
}

// ---------------------------------------------------------------- scene helpers


/** The unit-square plane of beats 1–2 (room for the singular map's image up to (3, 6)). */
function areaPlane(s, { visible = false } = {}) {
  const p = s.plane({ x: 650, y: 300, width: 340, range: [-1, 4, -1, 6], labels: false, visible });
  const basis = p.basis({ visible });
  const sq = p.polygon(SQUARE, { color: C.yellow, fill: FILL.yellow, visible });
  const al = p.label([0.5, 0.5], '1', { size: 34, color: C.ink, visible });
  return { p, basis, sq, al };
}

/** A curved orientation arrow (î toward ĵ) as a thin closed band with a head, in plane coordinates. */
function orientArrow(p, opts) {
  const pt = (r, deg) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
  const outer = [15, 30, 45, 60].map((g) => pt(0.62, g));
  const inner = [60, 45, 30, 15].map((g) => pt(0.52, g));
  return p.polygon([...outer, pt(0.7, 60), pt(0.57, 82), pt(0.44, 60), ...inner], { color: C.orange, fill: C.orange, width: 1, ...opts });
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'determinants',
  title: 'Determinants',
  goals: [
    'See det A as the signed factor by which a 2×2 matrix scales area; zero means the plane collapses',
    'Compute determinants by cofactor expansion along any row or column, and of triangular matrices',
    'Know how row operations change det A, and compute it by row reduction',
    'Use det A ≠ 0 ⇔ A invertible, det Aᵀ = det A, and det(AB) = det A · det B',
  ],
  beats: [
    // 1
    {
      id: 'area-factor',
      title: 'How much does area grow?',
      scene(s) {
        const o = areaPlane(s);
        o.m = s.tex(`A = ${texMat(STRETCH)}`, { x: 220, y: 200, size: 40, visible: false });
        o.ar = s.tex(`\\text{area} = ${t(det(STRETCH))}`, { x: 220, y: 320, size: 40, color: C.green, visible: false });
        o.def = s.text('That factor is the **determinant**: $\\det A$.', { x: 220, y: 470, size: 30, width: 340, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Watch the unit square, the one built on the two basis vectors. Its area is one.',
          do: async (s, o) => {
            await o.p.draw();
            await s.all(o.basis.i.grow(), o.basis.j.grow());
            await s.all(o.sq.draw(), o.al.draw({ delay: 400 }));
          },
        },
        {
          say: 'Apply a matrix that stretches by $3${three} horizontally and $2${two} vertically. The square becomes a three by two rectangle, so every area grows by a factor of $6${six}.',
          do: async (s, o) => {
            await o.m.write();
            await o.p.applyMatrix(num(STRETCH));
            await s.all(o.al.label.swap(t(det(STRETCH))), o.ar.fadeIn());
          },
        },
        {
          say: 'Now undo that and try a shear instead. The square tilts into a parallelogram, but its base and height are still one, so the area is still one.',
          do: async (s, o) => {
            await s.all(o.p.applyMatrix(num(inverse(STRETCH)), { duration: 1000 }), o.al.label.swap('1'), o.ar.fadeOut());
            await o.m.swap(`A = ${texMat(SHEAR)}`);
            await o.p.applyMatrix(num(SHEAR));
            await o.ar.swap(`\\text{area} = ${t(det(SHEAR))}`);
            await o.ar.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'That scaling factor, the same for every region in the plane, is the determinant of the matrix.',
          do: async (s, o) => {
            await o.def.fadeIn();
            await o.sq.indicate({ color: C.green });
          },
        },
      ],
    },

    // 2
    {
      id: 'sign-zero',
      title: 'Negative and zero',
      scene(s) {
        const o = areaPlane(s, { visible: true });
        o.or = orientArrow(o.p);
        o.m = s.tex(`A = ${texMat(FLIP)}`, { x: 220, y: 200, size: 40, visible: false });
        o.dt = s.tex(`\\det A = ${t(det(FLIP))}`, { x: 220, y: 320, size: 40, color: C.green, visible: false });
        o.span = o.p.span(num(SING).map((row) => row[0]), { color: C.yellow, width: 5, transform: false, visible: false });
        o.flat = s.text('flattened onto a line: not invertible', { x: 220, y: 450, size: 30, width: 330, color: C.yellow, visible: false });
        return o;
      },
      steps: [
        {
          say: 'This matrix swaps the two coordinates: a mirror flip. The area stays one, but the orientation reverses, so the determinant is $-1${minus one}.',
          do: async (s, o) => {
            await o.or.fadeIn({ shift: [0, 0] });
            await o.m.write();
            await o.p.applyMatrix(num(FLIP));
            await s.all(o.al.label.swap(t(det(FLIP))), o.dt.fadeIn(), o.or.indicate({ color: C.orange }));
          },
        },
        {
          say: 'And here\'s a matrix whose second column is twice the first. It squashes the whole plane onto a line. Zero area, determinant zero, and a flattened plane can\'t be unflattened: the matrix is not invertible.',
          do: async (s, o) => {
            await s.all(o.p.applyMatrix(num(FLIP), { duration: 900 }), o.or.fadeOut(), o.dt.fadeOut());
            await o.m.swap(`A = ${texMat(SING)}`);
            await o.p.applyMatrix(num(SING));
            await s.all(o.span.draw(), o.al.label.swap('0'));
            await o.dt.swap(`\\det A = ${t(det(SING))}`);
            await s.all(o.dt.fadeIn({ shift: [0, 0] }), o.flat.fadeIn());
          },
        },
      ],
    },

    // 3
    {
      id: 'formula-2x2',
      title: 'The 2×2 formula',
      scene(s) {
        const p = s.plane({ x: 650, y: 300, width: 420, range: [-0.6, 4.4, -0.6, 3.4], labels: false, visible: false });
        const u = p.vector([a, c], { color: C.blue, visible: false });
        const v = p.vector([b, d], { color: C.red, visible: false });
        const par4 = p.polygon([[0, 0], [a, c], [a + b, c + d], [b, d]], { color: C.green, fill: FILL.green, visible: false });
        const rect = p.polygon([[0, 0], [a + b, 0], [a + b, c + d], [0, c + d]], { color: C.ink, fill: 'none', visible: false });
        const pieces = [
          p.polygon([[0, 0], [a, 0], [a, c]], { color: C.yellow, fill: FILL.yellow, width: 2, visible: false }),
          p.polygon([[b, d], [b, c + d], [a + b, c + d]], { color: C.yellow, fill: FILL.yellow, width: 2, visible: false }),
          p.polygon([[0, 0], [b, d], [0, d]], { color: C.orange, fill: FILL.orange, width: 2, visible: false }),
          p.polygon([[a, c], [a + b, c], [a + b, c + d]], { color: C.orange, fill: FILL.orange, width: 2, visible: false }),
          p.polygon([[a, 0], [a + b, 0], [a + b, c], [a, c]], { color: C.teal, fill: FILL.teal, width: 2, visible: false }),
          p.polygon([[0, d], [b, d], [b, c + d], [0, c + d]], { color: C.teal, fill: FILL.teal, width: 2, visible: false }),
        ];
        const edge = [
          p.label([a / 2, -0.3], 'a', { size: 32, visible: false }),
          p.label([a + b / 2, -0.3], 'b', { size: 32, visible: false }),
          p.label([-0.3, d / 2], 'd', { size: 32, visible: false }),
          p.label([-0.3, d + c / 2], 'c', { size: 32, visible: false }),
        ];
        const m = s.tex(`\\begin{bmatrix}\\col{blue}{a} & \\col{red}{b}\\\\ \\col{blue}{c} & \\col{red}{d}\\end{bmatrix} = ${texMat(P2)}`, { x: 210, y: 120, size: 36, visible: false });
        const f1 = s.tex('(a+b)(c+d)', { x: 210, y: 260, size: 36, visible: false });
        const f2 = s.tex('-\\col{yellow}{ac} - \\col{orange}{bd} - \\col{teal}{2bc}', { x: 210, y: 320, size: 36, visible: false });
        const f3 = s.tex('= ad - bc', { x: 210, y: 400, size: 44, color: C.green, visible: false });
        const f4 = s.tex(`= ${a}\\cdot ${d} - ${b}\\cdot ${c} = ${t(det(P2))}`, { x: 210, y: 470, size: 34, visible: false });
        const inv = s.text('the same number as in the 2×2 inverse formula', { x: 480, y: 548, size: 30, color: C.muted, visible: false });
        return { p, u, v, par4, rect, pieces, edge, m, f1, f2, f3, f4, inv };
      },
      steps: [
        {
          say: 'Why is the area $ad - bc${a d minus b c}? The columns $(a, c)${a, c} and $(b, d)${b, d} span a parallelogram. Its area is what the matrix does to the unit square.',
          do: async (s, o) => {
            await s.all(o.p.draw(), o.m.write());
            await s.all(o.u.grow(), o.v.grow({ delay: 200 }));
            await o.par4.draw();
          },
        },
        {
          say: 'Put it in a box of size $a + b${a plus b} by $c + d${c plus d}. The box minus the parallelogram is two triangles of area $ac${a c} together, two of area $bd${b d}, and two rectangles of area $bc${b c}.',
          do: async (s, o) => {
            await s.all(o.rect.draw(), o.edge.map((e) => e.draw({ delay: 300 })));
            await o.f1.write();
            await s.all(o.pieces.map((pc, k) => pc.fadeIn({ shift: [0, 0], delay: k * 150 })));
            await o.f2.write();
            for (const k of [0, 2, 4]) await s.all(o.pieces[k].fadeOut({ duration: 500 }), o.pieces[k + 1].fadeOut({ duration: 500 }));
          },
        },
        {
          say: 'Multiply out and almost everything cancels, leaving $ad - bc${a d minus b c}: here $3 \\cdot 2 - 1 \\cdot 1 = 5${three times two minus one times one, which is five}. It\'s the same number that appeared in the inverse formula.',
          do: async (s, o) => {
            await o.f3.write();
            await o.f4.write();
            await s.all(o.par4.indicate({ color: C.green }), o.inv.fadeIn());
          },
        },
      ],
    },

    // 4
    {
      id: 'cofactor',
      title: 'Cofactor expansion',
      scene(s) {
        const m = s.matrix(CF, { x: 200, y: 185, size: 44, visible: false });
        const signs = s.matrix([['+', '-', '+'], ['-', '+', '-'], ['+', '-', '+']], { x: 200, y: 450, size: 34, color: C.muted, visible: false });
        const def = s.tex('C_{ij} = (-1)^{i+j}\\det A_{ij}', { x: 650, y: 55, size: 34, color: C.blue, visible: false });
        const exp = s.tex('\\det A = a_{11}C_{11} + a_{12}C_{12} + a_{13}C_{13}', { x: 650, y: 108, size: 32, color: C.blue, visible: false });
        const terms = ROW1.map((r, k) =>
          s.tex(`${r.sign < 0 ? '-' : '+'}\\,${t(r.a)}\\cdot\\det ${texMat(r.M)} = ${t(r.prod)}`, { x: 650, y: 195 + 98 * k, size: 32, visible: false }),
        );
        const total = s.tex(`\\det A = ${ROW1.map((r, k) => (k === 0 ? t(r.prod) : r.prod.sign() < 0 ? `- ${t(r.prod.abs())}` : `+ ${t(r.prod)}`)).join(' ')} = ${t(CF_DET)}`, { x: 650, y: 520, size: 36, color: C.green, visible: false });
        return { m, signs, def, exp, terms, total };
      },
      steps: [
        {
          say: 'For bigger matrices, expand along a row. Each entry gets multiplied by its cofactor: a sign from the checkerboard pattern times a smaller determinant.',
          do: async (s, o) => {
            await o.m.fadeIn();
            await s.all(o.exp.write(), o.def.write({ delay: 300 }));
            await o.signs.fadeIn();
            await s.all(o.m.highlightRow(0, C.yellow), o.signs.highlightRow(0, C.yellow));
          },
        },
        {
          say: 'The smaller matrix $A_{ij}${A i j} is what\'s left after you delete row $i${i} and column $j${j}. Cross out row one and each column in turn: three two by two determinants.',
          do: async (s, o) => {
            const rb = o.m.rowBox(0);
            for (const [k, r] of ROW1.entries()) {
              const cb = o.m.colBox(r.j);
              const h = s.line(rb.x - 10, rb.cy, rb.x + rb.w + 10, rb.cy, { color: C.yellow, width: 4, layer: 'front', visible: false });
              const v = s.line(cb.cx, cb.y - 10, cb.cx, cb.y + cb.h + 10, { color: C.yellow, width: 4, layer: 'front', visible: false });
              await s.all(h.draw({ duration: 350 }), v.draw({ duration: 350 }), o.signs.highlightCell(0, r.j, C.blue));
              await o.terms[k].write({ duration: 700 });
              await s.all(h.fadeOut({ duration: 250 }), v.fadeOut({ duration: 250 }));
            }
          },
        },
        {
          say: 'Add them up: $6 + 0 - 16${six plus zero minus sixteen}. The determinant is $-10${minus ten}.',
          do: (s, o) => o.total.write(),
        },
      ],
    },

    // 5
    {
      id: 'smart-column',
      title: 'Pick the row or column with zeros',
      scene(s) {
        const thm = s.defCard({ kind: 'theorem', title: 'Theorem 1', body: 'For $A$ $n \\times n$: $\\det A = a_{i1}C_{i1} + \\cdots + a_{in}C_{in}$ (any row $i$) $= a_{1j}C_{1j} + \\cdots + a_{nj}C_{nj}$ (any column $j$).', x: 480, y: 118, width: 880, visible: false });
        const m = s.matrix(CF, { x: 220, y: 360, size: 44 });
        const e1 = s.tex(`\\det A = (+1)\\cdot ${t(COL2.a)}\\cdot\\det ${texMat(COL2.M)}`, { x: 650, y: 320, size: 34, visible: false });
        const e2 = s.tex(`= ${t(COL2.a)}\\,(${t(COL2.M[0][0])}\\cdot ${par(COL2.M[1][1])} - ${par(COL2.M[0][1])}\\cdot ${par(COL2.M[1][0])}) = ${t(COL2.value)}`, { x: 650, y: 420, size: 34, color: C.green, visible: false });
        const thm2 = s.defCard({ kind: 'theorem', title: 'Theorem 2', body: 'If $A$ is triangular, $\\det A$ is the product of the entries on the main diagonal.', x: 480, y: 118, width: 860, visible: false });
        const tri = s.matrix(TRI, { x: 260, y: 370, size: 44, visible: false });
        const tp = s.tex(`\\det = ${TRI.map((row, i) => par(row[i])).join('\\cdot ')} = ${t(det(TRI))}`, { x: 690, y: 370, size: 40, color: C.green, visible: false });
        return { thm, m, e1, e2, thm2, tri, tp };
      },
      steps: [
        {
          say: 'Theorem 1 says you can expand along any row or down any column, and you always get the same answer.',
          do: (s, o) => o.thm.reveal(),
        },
        {
          say: 'So choose the line with the most zeros. Column two has two zeros, so only the $2${two} in the middle survives: one two by two determinant instead of three.',
          do: async (s, o) => {
            await o.m.highlightCol(COL2.j, C.yellow);
            await s.all([0, 2].map((i) => o.m.highlightCell(i, COL2.j, C.muted)));
            const rb = o.m.rowBox(COL2.i), cb = o.m.colBox(COL2.j);
            o.h = s.line(rb.x - 10, rb.cy, rb.x + rb.w + 10, rb.cy, { color: C.yellow, width: 4, layer: 'front', visible: false });
            o.v = s.line(cb.cx, cb.y - 10, cb.cx, cb.y + cb.h + 10, { color: C.yellow, width: 4, layer: 'front', visible: false });
            await s.all(o.h.draw({ duration: 400 }), o.v.draw({ duration: 400 }));
            await o.e1.write();
            await o.e2.write();
          },
        },
        {
          say: 'Taken to the extreme: for a triangular matrix, keep expanding down the first column, and the determinant is just the product of the diagonal. That\'s Theorem 2.',
          do: async (s, o) => {
            await s.all(o.thm.fadeOut(), o.m.fadeOut(), o.e1.fadeOut(), o.e2.fadeOut(), o.h.fadeOut(), o.v.fadeOut());
            await s.all(o.thm2.reveal(), o.tri.fadeIn());
            await s.all([0, 1, 2].map((i) => o.tri.highlightCell(i, i, C.green, { delay: i * 200 })));
            await o.tp.write();
          },
        },
      ],
    },

    // 6
    {
      id: 'try-triangular',
      kind: 'try',
      title: 'Your turn',
      say: 'Four by four, but look at its shape before you start expanding.',
      prompt: `Compute $$\\det ${texMat(TRY_TRI)}.$$`,
      answer: { type: 'number', value: String(det(TRY_TRI)) },
      hint: 'The matrix is triangular.',
      solution: [
        'Every entry below the diagonal is zero, so the matrix is upper triangular and Theorem 2 applies.',
        `$\\det = ${TRY_TRI.map((row, i) => par(row[i])).join('\\cdot ')} = ${t(det(TRY_TRI))}$.`,
      ],
    },

    // 7
    {
      id: 'row-ops-det',
      title: 'Row operations and det (Theorem 3)',
      scene(s) {
        const cards = OPS.map((op, k) => {
          const x = 170 + 310 * k;
          const frame = s.rect(x - 140, 40, 280, 520, { color: C.line, radius: 16, visible: false });
          const name = s.text(op.name, { x, y: 72, size: 30, weight: 600, visible: false });
          const m = s.tex(texMat(BASE), { x, y: 136, size: 32, visible: false });
          const p = s.plane({ x, y: 348, width: 220, range: [-0.5, 3.5, -0.5, 3.5], labels: false, visible: false });
          const poly = p.polygon(rowsPoly(BASE), { color: C.green, fill: FILL.green, visible: false });
          const [r1, r2] = num(BASE);
          const v1 = p.vector(r1, { color: C.blue, visible: false });
          const v2 = p.vector(r2, { color: C.red, visible: false });
          const dt = s.tex(`\\det = ${t(det(BASE))}`, { x, y: 482, size: 32, visible: false });
          const rule = s.text(op.rule, { x, y: 528, size: 30, color: k === 0 ? C.green : C.yellow, visible: false });
          return { frame, name, m, p, poly, v1, v2, dt, rule };
        });
        const thm = s.defCard({
          kind: 'theorem', title: 'Theorem 3 (Row operations)', x: 480, y: 300, width: 860, visible: false,
          body: 'Let $A$ be square. **(a)** If a multiple of one row of $A$ is added to another row to produce $B$, then $\\det B = \\det A$. **(b)** If two rows of $A$ are interchanged to produce $B$, then $\\det B = -\\det A$. **(c)** If one row of $A$ is multiplied by $k$ to produce $B$, then $\\det B = k\\cdot\\det A$.',
        });
        return { cards, thm };
      },
      steps: [
        {
          say: 'Theorem 3 tells you exactly what each row operation does to the determinant. Let\'s see why, one operation at a time.',
          do: (s, o) => o.thm.reveal(),
        },
        {
          say: 'Since a matrix and its transpose have the same determinant, rows work as well as columns. So picture the two rows as arrows: the signed area of their parallelogram is the determinant. A replacement is a shear, so that area doesn\'t change.',
          do: async (s, o) => {
            await o.thm.fadeOut();
            await s.all(o.cards.map((cd, k) => s.all(cd.frame.draw({ delay: k * 150 }), cd.name.fadeIn({ delay: k * 150 }), cd.m.fadeIn({ delay: k * 150 }), cd.p.draw({ delay: k * 150 }), cd.dt.fadeIn({ delay: k * 150 }))));
            await s.all(o.cards.map((cd) => s.all(cd.poly.draw(), cd.v1.grow(), cd.v2.grow())));
            await play(s, o.cards[0], 0);
          },
        },
        {
          say: 'Interchanging two rows gives the same parallelogram, traced the other way round. The determinant changes sign.',
          do: (s, o) => play(s, o.cards[1], 1),
        },
        {
          say: 'Scaling one row by $k${k} stretches the parallelogram by $k${k}, so the determinant is multiplied by $k${k}. Here $k = 3${k equals three}.',
          do: (s, o) => play(s, o.cards[2], 2),
        },
      ],
    },

    // 8
    {
      id: 'det-by-reduction',
      title: 'Computing det by row reduction',
      scene(s) {
        const m = s.matrix(RD, { x: 330, y: 240, size: 44 });
        const keep = s.tex('\\text{replacements only: }\\det\\text{ never changes}', { x: 480, y: 430, size: 32, color: C.muted, visible: false });
        const res = s.tex(`\\det A = \\det U = ${RD_U.map((row, i) => par(row[i])).join('\\cdot ')} = ${t(RD_DET)}`, { x: 480, y: 510, size: 38, color: C.green, visible: false });
        const rule = s.tex('\\det A = (-1)^r\\cdot(\\text{product of the diagonal entries of } U)', { x: 480, y: 425, size: 30, visible: false });
        const rn = s.text('U: echelon form from replacements and r interchanges (no scaling). A zero on its diagonal means det A = 0.', { x: 480, y: 505, size: 30, width: 760, color: C.muted, visible: false });
        return { m, keep, res, rule, rn };
      },
      steps: [
        {
          say: 'To compute a big determinant, row reduce. Replacements don\'t change the determinant, so do them freely: $R_2 \\to R_2 - 2R_1${R two becomes R two minus two R one}, then $R_3 \\to R_3 + R_1${R three becomes R three plus R one}.',
          do: async (s, o) => {
            await o.m.rowOp(RD_FWD[0]);
            await o.keep.fadeIn();
            await o.m.rowOp(RD_FWD[1]);
          },
        },
        {
          say: 'One more, $R_3 \\to R_3 - 2R_2${R three becomes R three minus two R two}, and the matrix is triangular. Multiply the diagonal: $1 \\cdot 1 \\cdot 2 = 2${one times one times two, which is two}.',
          do: async (s, o) => {
            await o.m.rowOp(RD_FWD[2]);
            await o.m.note();
            await s.all([0, 1, 2].map((i) => o.m.highlightCell(i, i, C.green, { delay: i * 200 })));
            await o.res.write();
          },
        },
        {
          say: 'If you do need swaps, each one flips the sign: the determinant is $(-1)^r${minus one to the r} times the product of the diagonal of $U${U}, where $r${r} counts the swaps. Avoid scaling rows, or divide each scale factor back out.',
          do: async (s, o) => {
            await s.all(o.keep.fadeOut(), o.res.fadeOut());
            await o.rule.write();
            await o.rn.fadeIn();
          },
        },
      ],
    },

    // 9
    {
      id: 'fill-ops',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Use the three rules. Careful with the last one.',
      figure(s) {
        s.tex(`\\det A = ${t(D5)}`, { x: 480, y: 260, size: 64 });
        s.text('A is 3 × 3', { x: 480, y: 360, size: 48, color: C.muted });
      },
      lines: [
        ['\\text{swap two rows: }\\det = ', { id: 'swap', answer: { type: 'number', value: String(D5.neg()) } }],
        ['\\text{multiply row 2 by } 3:\\ \\det = ', { id: 'scale', answer: { type: 'number', value: String(D5.mul(3)) } }],
        ['\\det(2A) = ', { id: 'twoA', answer: { type: 'number', value: String(D5.mul(2 ** 3)) }, hint: 'Every one of the 3 rows gets multiplied by 2.' }],
      ],
      solution: [
        `An interchange flips the sign: $-${t(D5)}$. Scaling one row by 3 multiplies det by 3: $${t(D5.mul(3))}$.`,
        `$2A$ multiplies **each** of the 3 rows by 2, so $\\det(2A) = 2^3\\cdot ${t(D5)} = ${t(D5.mul(8))}$.`,
      ],
    },

    // 10
    {
      id: 'properties',
      title: 'det A ≠ 0 iff invertible; products; transposes',
      scene(s) {
        const L = (str, y) => s.text(str, { x: 50, y, size: 30, align: 'left', anchor: [0, 0.5], visible: false });
        const t4 = L('**Theorem 4.** A square matrix $A$ is invertible $\\iff \\det A \\neq 0$.', 60);
        const t5 = L('**Theorem 5.** If $A$ is $n \\times n$, then $\\det A^T = \\det A$.', 108);
        const t6 = L('**Theorem 6.** If $A, B$ are $n \\times n$, then $\\det AB = (\\det A)(\\det B)$.', 156);
        const sg = s.tex(`\\det ${texMat(SING)} = ${t(det(SING))} \\;\\Rightarrow\\; \\text{no inverse}`, { x: 290, y: 300, size: 32, color: C.yellow, visible: false });
        const tr = s.tex(`\\det ${texMat(TR_EX)} = \\det ${texMat(TR_EX[0].map((_, j) => TR_EX.map((row) => row[j])))} = ${t(det(TR_EX))}`, { x: 295, y: 300, size: 32, visible: false });
        const p = s.plane({ x: 730, y: 370, width: 280, range: [-1, 4, -1, 4], labels: false, visible: false });
        const sq = p.polygon(SQUARE, { color: C.yellow, fill: FILL.yellow, visible: false });
        const al = p.label([0.5, 0.5], '1', { size: 32, visible: false });
        const dA = s.tex(`\\det A = ${t(det(PA))}`, { x: 240, y: 280, size: 34, visible: false });
        const dB = s.tex(`\\det B = ${t(det(PB))}`, { x: 240, y: 335, size: 34, visible: false });
        const dBA = s.tex(`\\det(BA) = ${t(det(PA))}\\cdot ${t(det(PB))} = ${t(det(PA).mul(det(PB)))}`, { x: 240, y: 395, size: 34, color: C.green, visible: false });
        const no = s.tex('\\det(I + I) = \\det(2I) = 4 \\neq 1 + 1', { x: 480, y: 550, size: 32, color: C.yellow, visible: false });
        return { t4, t5, t6, sg, tr, p, sq, al, dA, dB, dBA, no };
      },
      steps: [
        {
          say: 'First, the big one: $A${A} is invertible exactly when $\\det A${det A} is not zero. Zero means the space was flattened, and nothing can undo that.',
          do: async (s, o) => {
            await o.t4.fadeIn({ shift: [12, 0] });
            await o.sg.write();
          },
        },
        {
          say: 'Second, transposing doesn\'t change the determinant. That\'s why everything we said about rows also holds for columns.',
          do: async (s, o) => {
            await s.all(o.t5.fadeIn({ shift: [12, 0] }), o.sg.fadeOut());
            await o.tr.write();
          },
        },
        {
          say: 'Third, the determinant of a product is the product of the determinants. Do one map, then another: the area scale factors simply multiply.',
          do: async (s, o) => {
            await s.all(o.t6.fadeIn({ shift: [12, 0] }), o.tr.fadeOut());
            await o.p.draw();
            await s.all(o.sq.draw(), o.al.draw());
            await o.dA.fadeIn();
            await o.p.applyMatrix(num(PA), { duration: 1000 });
            await o.al.label.swap(t(det(PA)));
            await o.dB.fadeIn();
            await o.p.applyMatrix(num(PB), { duration: 1000 });
            await o.al.label.swap(t(det(PA).mul(det(PB))));
            await o.dBA.write();
          },
        },
        {
          say: 'But there is no rule for sums. The two by two identity has determinant $1${one}, yet $\\det(I + I)${det of I plus I} is $4${four}, not $2${two}.',
          do: (s, o) => o.no.write(),
        },
      ],
    },

    // 11
    {
      id: 'mistake-kA',
      title: 'The trap: det(kA)',
      scene(s) {
        const p = s.plane({ x: 700, y: 320, width: 360, range: [-1, 3, -1, 3], labels: false, visible: false });
        const sq = p.polygon(SQUARE, { color: C.yellow, fill: FILL.yellow });
        const al = p.label([0.5, 0.5], '1', { size: 32 });
        const wrong = s.tex('\\det(2A) = 2\\det A', { x: 240, y: 170, size: 40, visible: false });
        const m = s.tex(`2I = ${texMat(TWO_I)}`, { x: 240, y: 290, size: 36, visible: false });
        const right = s.tex('\\det(kA) = k^n\\det A', { x: 255, y: 420, size: 44, color: C.green, visible: false });
        const ex = s.tex(`n = 2:\\ \\det(2I) = 2^2 = ${t(det(TWO_I))}`, { x: 255, y: 500, size: 32, visible: false });
        return { p, sq, al, wrong, m, right, ex };
      },
      steps: [
        {
          say: 'Here\'s the trap: "doubling the matrix doubles the determinant." Watch the unit square under $2I${two I}. Both sides double, so the area grows by $4${four}, not $2${two}.',
          do: async (s, o) => {
            await o.p.fadeIn({ shift: [0, 0] });
            await o.wrong.write();
            o.ring = s.ring(o.wrong, { shape: 'box' });
            await o.ring;
            await o.m.fadeIn();
            await o.p.applyMatrix(num(TWO_I));
            await o.al.label.swap(t(det(TWO_I)));
          },
        },
        {
          say: 'Multiplying a matrix by $k${k} scales every one of its $n${n} rows by $k${k}, and each row contributes a factor of $k${k}. So $\\det(kA) = k^n \\det A${det of k A equals k to the n times det A}.',
          do: async (s, o) => {
            await s.all(s.strike(o.wrong, { color: 'yellow' }), o.ring.fadeOut());
            await o.right.write();
            await o.ex.fadeIn();
          },
        },
      ],
    },

    // 12
    {
      id: 'wo-det4',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. A four by four, but you only need one expansion if you choose well.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateDet4,
    },

    // 13
    {
      id: 'try-product',
      kind: 'try',
      title: 'Your turn',
      say: 'Use the product rule, one factor at a time.',
      prompt: '$\\det A = 3$ and $\\det B = -2$, both $4\\times 4$. Find $\\det(A^T B^{-1} A)$.',
      answer: { type: 'number', value: String(PROD_ANS) },
      hint: 'Find the determinant of each factor, then multiply.',
      solution: [
        '$\\det A^T = \\det A = 3$, and $\\det B^{-1} = 1/\\det B = -\\tfrac12$ (because $\\det B \\cdot \\det B^{-1} = \\det I = 1$).',
        `So $\\det(A^TB^{-1}A) = 3\\cdot(-\\tfrac12)\\cdot 3 = ${t(PROD_ANS)}$.`,
      ],
    },

    // 14
    {
      id: 'cp-det',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain why a zero determinant rules out an inverse, in two different ways.',
      prompt: 'Why does $\\det A = 0$ mean $A$ is not invertible? Give the geometric reason and the row-reduction reason.',
      points: [
        'Geometrically, $|\\det A|$ is the factor by which the map scales area (volume)',
        'Zero means the image is flattened into a lower dimension, so different points land on the same point: the map is not one-to-one and cannot be undone',
        'Row operations change det only by nonzero factors (sign flips, multiplying by $k \\neq 0$), so $\\det A = 0$ exactly when the echelon form has a zero on its diagonal',
        'A zero on the diagonal of the echelon form means fewer than $n$ pivots, so $A$ is not invertible',
      ],
    },

    // 15
    {
      id: 'summary-det',
      title: 'Summary',
      scene(s) {
        const p = s.plane({ x: 240, y: 300, width: 320, range: [-1, 4, -1, 3], labels: false, visible: false });
        const sq = p.polygon(SQUARE, { color: C.yellow, fill: FILL.yellow, visible: false });
        const al = p.label([0.5, 0.5], '1', { size: 32, visible: false });
        const M = mat([[2, 1], [0, 1]]);
        const r = [
          s.text('replacement: det unchanged', { x: 700, y: 170, size: 30, color: C.green, visible: false }),
          s.text('interchange: det × (−1)', { x: 700, y: 230, size: 30, color: C.yellow, visible: false }),
          s.text('scale a row by k: det × k', { x: 700, y: 290, size: 30, color: C.yellow, visible: false }),
          s.text('or expand along a row or column full of zeros', { x: 700, y: 360, size: 30, width: 400, color: C.muted, visible: false }),
        ];
        const inv = s.tex('\\det A \\neq 0 \\iff A \\text{ is invertible}', { x: 480, y: 510, size: 40, color: C.green, visible: false });
        return { p, sq, al, M, r, inv };
      },
      steps: [
        {
          say: 'The determinant is the signed factor by which a matrix scales area, or volume in higher dimensions.',
          do: async (s, o) => {
            await o.p.draw();
            await s.all(o.sq.draw(), o.al.draw());
            await o.p.applyMatrix(num(o.M));
            await o.al.label.swap(t(det(o.M)));
          },
        },
        {
          say: 'To compute it, reduce to triangular form while tracking swaps and scalings, or expand along a row or column with lots of zeros.',
          do: (s, o) => s.stagger(o.r.map((x) => () => x.fadeIn({ shift: [12, 0] })), 400),
        },
        {
          say: 'And it is nonzero exactly when the matrix is invertible.',
          do: (s, o) => o.inv.write(),
        },
      ],
    },
  ],
};

/** Beat 7: one card's row operation: matrix, arrows, parallelogram and det all update. */
async function play(s, cd, k) {
  const op = OPS[k];
  const [r1, r2] = num(op.after);
  await s.all(cd.m.swap(texMat(op.after)), cd.name.indicate({ color: C.yellow }));
  cd.opTex ??= s.tex(OP_TEX[k], { x: cd.m.x, y: 212, size: 30, color: C.muted, visible: false });
  await s.all(cd.opTex.fadeIn(), cd.v1.moveTo(r1), cd.v2.moveTo(r2), cd.poly.morphTo(rowsPoly(op.after)));
  await cd.dt.swap(`\\det = ${t(det(op.after))}`);
  await cd.rule.fadeIn();
}
