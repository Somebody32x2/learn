/**
 * Lecture 20 · Diagonalization (Lay 5.3–5.4). Design: matrix/PLAN.md § 20.
 * Every matrix, eigenvector, power and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import {
  mat, vec, mul, mulVec, identity, inverse, fromCols, rref, rationalEigen, eigenspace, diagonalize, sub, scale, texMat, texVec, texRowOp, eqMat,
} from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- helpers

const t = (x) => F(x).tex({ inline: true });
const num = (A) => A.map((r) => r.map(Number));
const gcd = (a, b) => (b ? gcd(b, a % b) : a < 0n ? -a : a);
const rowTex = (v) => `(${v.map(String).join(', ')})`;
const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];
const diag = (ds) => ds.map((d, i) => ds.map((_, j) => (i === j ? F(d) : F(0))));
const minusLI = (A, l) => sub(mat(A), scale(F(l), identity(A.length)));

/** v scaled to integers with no common factor, first nonzero entry positive. */
function intVec(v) {
  const l = v.reduce((a, x) => (a * x.d) / gcd(a, x.d), 1n);
  let w = v.map((x) => x.mul(F(l)).n);
  const g = w.reduce((a, x) => gcd(a, x), 0n) || 1n;
  w = w.map((x) => x / g);
  if (w.find((x) => x !== 0n) < 0n) w = w.map((x) => -x);
  return w.map((x) => F(x));
}

/** Fades matrix cells on the stage clock. */
function cellsTo(s, m, cells, to, { duration = 400, delay = 0 } = {}) {
  const els = cells.map(([i, j]) => m.cell(i, j));
  let from = null;
  return s.clock.tween({
    duration,
    delay,
    start: () => (from = els.map((e) => Number(e.style.opacity || 1))),
    update: (k) => {
      from ??= els.map((e) => Number(e.style.opacity || 1));
      els.forEach((e, n) => (e.style.opacity = String(from[n] + (to - from[n]) * k)));
    },
  });
}
/** Fades a Tex part on the stage clock. */
function partOpacity(s, tex, name, to, { duration = 450, delay = 0 } = {}) {
  const els = tex.part(name);
  let from = null;
  return s.clock.tween({
    duration,
    delay,
    start: () => (from = els.map((e) => Number(e.style.opacity || 1))),
    update: (k) => {
      from ??= els.map((e) => Number(e.style.opacity || 1));
      els.forEach((e, n) => (e.style.opacity = String(from[n] + (to - from[n]) * k)));
    },
  });
}

/** `c·b^k` terms joined: -2^k + 2\cdot 3^k. */
function expTex(terms) {
  let out = '';
  for (const [c0, base] of terms) {
    const c = F(c0);
    if (c.zero) continue;
    const a = c.abs();
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : `${t(a)}\\cdot `) + `${base}^k`;
  }
  return out || '0';
}

// ---------------------------------------------------------------- data

/** The running 2×2 (beats 1–4, 15). */
const A = mat([[4, -2], [1, 1]]);
const LAMS = rationalEigen(A).map((e) => e.value).sort((a, b) => a.cmp(b)); // 2, 3
const VS = LAMS.map((l) => intVec(eigenspace(A, l)[0])); // (1, 1), (2, 1)
const P = fromCols(VS);
const D = diag(LAMS);
const PINV = inverse(P);
const A_INV = inverse(A);
if (!eqMat(mul(mul(P, D), PINV), A)) throw new Error('A = PDP^-1 failed');
const AP = mul(A, P);
const PD = mul(P, D);
/** The trap of beat 3: the inverse dropped. */
const PDP = mul(PD, P);
if (eqMat(PDP, A)) throw new Error('PDP should differ from A');
/** The traced vector of beat 2: chosen so its eigen-coordinates are (1, 1). */
const XB = vec([1, 1]);
const XT = mulVec(P, XB);
const DXB = mulVec(D, XB);
const AXT = mulVec(A, XT);
/** A^k entries: a·2^k + b·3^k. */
const POW = A.map((_, i) => A.map((__, j) => LAMS.map((l, k) => [P[i][k].mul(PINV[k][j]), t(l)])));
const POW_TEX = `\\begin{bmatrix}${POW.map((r) => r.map(expTex).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
const A3 = mul(A, mul(A, A));
const A3_11 = POW[0][0].reduce((s0, [c], k) => s0.add(c.mul(LAMS[k].mul(LAMS[k]).mul(LAMS[k]))), F(0));
if (!A3_11.eq(A3[0][0])) throw new Error('power formula');

/** Beat 6: the shear. */
const SH = mat([[1, 1], [0, 1]]);
const SH_EIG = rationalEigen(SH);
const SH_E = eigenspace(SH, SH_EIG[0].value);

/** Beat 7 candidates. */
const CANDS = {
  a: mat([[2, 1], [0, 2]]),
  b: mat([[2, 0], [0, 2]]),
  c: mat([[1, 1], [0, 2]]),
  d: mat([[5, 0, 0], [1, 2, 0], [3, 4, 1]]),
};
const NOT_DIAG = Object.keys(CANDS).filter((k) => diagonalize(CANDS[k]) === null);
const eigList = (M) => rationalEigen(M).flatMap((e) => Array(e.mult).fill(t(e.value))).join(', ');

/** Beats 8–9: the worked 3×3. */
const W = mat([[2, 0, 0], [1, 2, 1], [-1, 0, 1]]);
const W_EIG = rationalEigen(W);
const W_HI = W_EIG.find((e) => e.mult === 2).value; // 2
const W_LO = W_EIG.find((e) => e.mult === 1).value; // 1
const W_E2 = eigenspace(W, W_HI); // the plan's (0, 1, 0), (−1, 0, 1): already integer
const W_E1 = eigenspace(W, W_LO); // (0, −1, 1)
const WV = [...W_E2, ...W_E1];
const WP = fromCols(WV);
const WD = diag([W_HI, W_HI, W_LO]);
const WAP = mul(W, WP);
const WPD = mul(WP, WD);
if (!eqMat(WAP, WPD)) throw new Error('AP = PD failed');
const WD_BAD = diag([W_LO, W_HI, W_HI]);
const WPD_BAD = mul(WP, WD_BAD);
const ORDER2 = [2, 0, 1];
const WP2 = fromCols(ORDER2.map((k) => WV[k]));
const WD2 = diag(ORDER2.map((k) => (k < 2 ? W_HI : W_LO)));
if (!eqMat(mul(W, WP2), mul(WP2, WD2))) throw new Error('reordered AP = PD failed');
const W_M2_R = rref(minusLI(W, W_HI)).R;
const W_M1_R = rref(minusLI(W, W_LO)).R;
const VCOL = [C.purple, C.purple, C.teal];

/** Beat 10: the workout. */
const WO = mat([[5, -2, 2], [0, 3, 0], [-4, 4, -1]]);
const WO_EIG = rationalEigen(WO);
const WO_HI = WO_EIG.find((e) => e.mult === 2).value; // 3
const WO_LO = WO_EIG.find((e) => e.mult === 1).value; // 1
const WO_E3 = eigenspace(WO, WO_HI); // raw parametric vectors (1, 1, 0), (−1, 0, 1)
const WO_E1 = eigenspace(WO, WO_LO).map(intVec); // (1, 0, −2)
const WO_P = fromCols([...WO_E3, ...WO_E1]);
const WO_D = diag([WO_HI, WO_HI, WO_LO]);
if (!eqMat(mul(WO, WO_P), mul(WO_P, WO_D))) throw new Error('workout P D');
const WO_M3 = minusLI(WO, WO_HI);

/** Beat 11: d/dt on P2 in the basis {1, t, t^2}: column j = coordinates of (t^j)'. */
const DERIV = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j - 1 ? F(j) : F(0))));
const DERIV_IMG = ['0', '1', '2t'];
/** Beat 12: T(p) = p + t p' sends t^j to (1 + j) t^j. */
const TB = [0, 1, 2].map((j) => 1 + j);

/** Beat 13: eigenvalues 1, 2, 2, 5 with a one-dimensional eigenspace for 2. */
const DIST_DIMS = [1, 1, 1];
const DIST_SUM = DIST_DIMS.reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------- shared scene builders

/** The eigen-grid plane of beats 1 and 15. */
function eigenPlane(s, { x = 650, y = 300, width = 500, visible = false } = {}) {
  const p = s.plane({ x, y, width, range: [-4, 5, -3, 3], labels: false, visible });
  const [v1, v2] = VS.map((v) => v.map(Number));
  const half = (v, k) => v.map((c) => (c * k) / 2);
  const grid = [];
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    grid.push(p.line({ through: half(v1, k), dir: v2 }, { color: C.purple, width: 1.5, visible: false }));
    grid.push(p.line({ through: half(v2, k), dir: v1 }, { color: C.purple, width: 1.5, visible: false }));
  }
  const axes = [v1, v2].map((v) => p.span(v, { color: C.purple, width: 3, visible: false }));
  const cell = p.polygon([[0, 0], half(v1, 1), [half(v1, 1)[0] + half(v2, 1)[0], half(v1, 1)[1] + half(v2, 1)[1]], half(v2, 1)], { color: C.purple, visible: false });
  const vecs = [v1, v2].map((v, i) => p.vector(half(v, 1), { color: C.purple, label: `\\mathbf v_${i + 1}`, visible: false }));
  return { p, grid, axes, cell, vecs };
}
async function showEigenGrid(s, g) {
  await s.all(g.axes.map((a) => a.draw({ duration: 600 })), g.grid.map((l, i) => l.fadeIn({ shift: [0, 0], to: 0.4, delay: i * 25 })));
  await s.all(g.cell.draw(), g.vecs.map((v) => v.grow()));
}

/** Lay's diagram: x →A→ Ax on top, P⁻¹ down, D along the bottom, P up. */
function diagram(s, { cx = 480, cy = 350, w = 500, h = 200, size = 34, nodes, visible = false }) {
  const [x0, x1, y0, y1] = [cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2];
  const n = nodes.map((tx, i) => s.tex(tx, { x: i % 2 ? x1 : x0, y: i < 2 ? y0 : y1, size, visible }));
  const gap = (k) => n[k].box();
  const bx = [0, 1, 2, 3].map(gap);
  const arrows = {
    A: s.arrow(bx[0].x + bx[0].w + 16, y0, bx[1].x - 16, y0, { width: 3.5, visible }),
    Pinv: s.arrow(x0, bx[0].y + bx[0].h + 10, x0, bx[2].y - 10, { width: 3.5, color: C.purple, visible }),
    D: s.arrow(bx[2].x + bx[2].w + 16, y1, bx[3].x - 16, y1, { width: 3.5, color: C.purple, visible }),
    P: s.arrow(x1, bx[3].y - 10, x1, bx[1].y + bx[1].h + 10, { width: 3.5, color: C.purple, visible }),
  };
  const lsize = Math.max(30, size - 2);
  const labels = {
    A: s.tex('A', { x: cx, y: y0 - 30, size: lsize, visible }),
    Pinv: s.tex('P^{-1}', { x: x0 - 44, y: cy, size: lsize, color: C.purple, visible }),
    D: s.tex('D', { x: cx, y: y1 + 32, size: lsize, color: C.purple, visible }),
    P: s.tex('P', { x: x1 + 34, y: cy, size: lsize, color: C.purple, visible }),
  };
  return { n, arrows, labels };
}

// ---------------------------------------------------------------- workout text

const WO_ITEM = {
  prompt: `Diagonalize $$A = ${texMat(WO)}$$ if possible. Enter a basis for the eigenspace with $\\lambda = ${t(WO_HI)}$.`,
  answer: { type: 'basis', value: WO_E3.map((v) => v.map(String)) },
  hints: [
    `Row 2 has only one nonzero entry, so expand along row 2: $\\det(A - \\lambda I) = (${t(WO[1][1])} - \\lambda)\\big[(${t(WO[0][0])} - \\lambda)(${t(WO[2][2])} - \\lambda) + ${t(WO[0][2].mul(WO[2][0]).neg())}\\big] = -(\\lambda - ${t(WO_HI)})^2(\\lambda - ${t(WO_LO)})$.`,
    `$A - ${t(WO_HI)}I = ${texMat(WO_M3)}$ has rank $1$: every row is a multiple of one equation, so there are two free variables.`,
  ],
  solution: [
    `Expanding along row 2 gives $\\det(A - \\lambda I) = -(\\lambda - ${t(WO_HI)})^2(\\lambda - ${t(WO_LO)})$: eigenvalues $${t(WO_HI)}$ (twice) and $${t(WO_LO)}$.`,
    `For $\\lambda = ${t(WO_HI)}$: $A - ${t(WO_HI)}I = ${texMat(WO_M3)}$. Row reduce: ${rref(WO_M3).steps.map((st) => `$${texRowOp(st)}$ gives $${texMat(st.after)}$`).join('; ')}.`,
    `That leaves one equation, $x_1 = x_2 - x_3$, with $x_2, x_3$ free: $\\mathbf x = x_2${texVec(WO_E3[0])} + x_3${texVec(WO_E3[1])}$. A basis: ${WO_E3.map((v) => `$${rowTex(v)}$`).join(' and ')} (any nonzero multiples work). The eigenspace has dimension 2, matching the multiplicity.`,
    `For $\\lambda = ${t(WO_LO)}$: $\\operatorname{Nul}(A - I)$ is spanned by $${rowTex(WO_E1[0])}$.`,
    `Three independent eigenvectors, so $A$ is diagonalizable: $P = ${texMat(WO_P)}$, $D = ${texMat(WO_D)}$, and you can check $AP = PD$.`,
  ],
};

// ---------------------------------------------------------------- the lecture

export default {
  id: 'diagonalization',
  title: 'Diagonalization',
  goals: [
    'Write $A = PDP^{-1}$ with eigenvectors in $P$ and eigenvalues in $D$, and use it to compute $A^k$',
    'Apply the Diagonalization Theorem and decide when diagonalization fails',
    'Find the matrix of a linear transformation relative to a basis, and see $P^{-1}AP$ as $A$ in the eigenvector basis',
  ],
  beats: [
    // 1
    {
      id: 'eigenbasis-grid',
      title: 'In the right basis, A just stretches',
      scene(s) {
        const At = s.tex(`A = ${texMat(A)}`, { x: 185, y: 110, size: 40, visible: false });
        const g = eigenPlane(s);
        const sq = g.p.polygon([[0, 0], [1, 0], [1, 1], [0, 1]], { color: C.blue, visible: false });
        const shear = s.text('turns and stretches', { x: 185, y: 220, size: 30, color: C.muted, visible: false });
        const eqs = LAMS.map((l, i) => s.tex(`A\\mathbf v_${i + 1} = \\col{purple}{${t(l)}}\\,\\mathbf v_${i + 1}`, { x: 185, y: 300 + 60 * i, size: 36, visible: false }));
        const Dt = s.tex(`D = ${texMat(D)}`, { x: 185, y: 490, size: 38, color: C.purple, visible: false });
        return { At, ...g, sq, shear, eqs, Dt };
      },
      steps: [
        {
          say: 'In standard coordinates this matrix looks messy. Watch the unit square: $A${A} turns it and stretches it into a slanted parallelogram.',
          do: async (s, o) => {
            await s.all(o.At.write(), o.p.draw({ duration: 900 }));
            await o.sq.draw();
            await o.p.applyMatrix(num(A), { duration: 1500 });
            await o.shear.fadeIn();
          },
        },
        {
          say: 'Now draw a grid along its eigenvectors instead. Apply $A${A}, and every cell of that grid is stretched by $2${two} along $\\mathbf v_1${v one} and by $3${three} along $\\mathbf v_2${v two}. No turning, no shearing.',
          do: async (s, o) => {
            await s.all(o.p.applyMatrix(num(A_INV), { duration: 800 }), o.sq.fadeOut(), o.shear.fadeOut());
            await showEigenGrid(s, o);
            await o.p.applyMatrix(num(A), { duration: 1700 });
            await s.stagger(o.eqs.map((e) => () => e.write()), 600);
          },
        },
        {
          say: 'So if we describe vectors by their coordinates in the eigenvector basis, $A${A} acts by just scaling each coordinate. In that basis, $A${A} becomes the diagonal matrix $D${D}.',
          do: async (s, o) => {
            await o.Dt.write();
            await o.Dt.flash({ color: C.purple });
          },
        },
      ],
    },

    // 2
    {
      id: 'factor',
      title: 'A = PDP⁻¹',
      scene(s) {
        const top = s.tex(`P = \\begin{bmatrix}${P.map((r) => r.map((x) => `\\col{purple}{${t(x)}}`).join(' & ')).join(' \\\\ ')}\\end{bmatrix},\\quad D = ${texMat(D)},\\quad A = PDP^{-1}`, { x: 480, y: 80, size: 34, visible: false });
        const dg = diagram(s, {
          cx: 480,
          cy: 345,
          w: 470,
          h: 190,
          nodes: [`\\mathbf x = ${rowTex(XT)}`, `A\\mathbf x = ${rowTex(AXT)}`, `[\\mathbf x]_{\\mathcal B} = ${rowTex(XB)}`, `D[\\mathbf x]_{\\mathcal B} = ${rowTex(DXB)}`],
        });
        const check1 = s.tex('AP = \\begin{bmatrix}A\\mathbf v_1 & A\\mathbf v_2\\end{bmatrix} = \\begin{bmatrix}\\col{purple}{2}\\mathbf v_1 & \\col{purple}{3}\\mathbf v_2\\end{bmatrix} = PD', { x: 480, y: 260, size: 36, visible: false });
        const check2 = s.tex(`AP = ${texMat(AP)} = PD\\ \\col{green}{\\checkmark}`, { x: 480, y: 400, size: 38, visible: false });
        return { top, dg, check1, check2 };
      },
      steps: [
        {
          say: 'Put the eigenvectors in the columns of $P${P}, and the eigenvalues, in the same order, on the diagonal of $D${D}. Then $P^{-1}${P inverse} translates a vector into eigen-coordinates: $(3, 2)${three, two} is just $\\mathbf v_1 + \\mathbf v_2${v one plus v two}.',
          do: async (s, o) => {
            await o.top.write({ duration: 1300 });
            await o.dg.n[0].fadeIn();
            await s.all(o.dg.arrows.Pinv.draw(), o.dg.labels.Pinv.fadeIn());
            await o.dg.n[2].fadeIn();
          },
        },
        {
          say: '$D${D} scales each coordinate by its eigenvalue: $1${one} becomes $2${two}, and the other $1${one} becomes $3${three}.',
          do: async (s, o) => {
            await s.all(o.dg.arrows.D.draw(), o.dg.labels.D.fadeIn());
            await o.dg.n[3].fadeIn();
          },
        },
        {
          say: 'And $P${P} translates back to standard coordinates. The result is exactly $A\\mathbf x${A x}. Going around the loop is the same as going straight across: $A = PDP^{-1}${A equals P D P inverse}.',
          do: async (s, o) => {
            await s.all(o.dg.arrows.P.draw(), o.dg.labels.P.fadeIn());
            await o.dg.n[1].fadeIn();
            await s.all(o.dg.arrows.A.draw(), o.dg.labels.A.fadeIn({ delay: 300 }));
            await o.dg.n[1].flash({ color: C.green });
          },
        },
        {
          say: 'To check a factorization without inverting $P${P}, check $AP = PD${A P equals P D} column by column. Column $j${j} says $A\\mathbf v_j = \\lambda_j\\mathbf v_j${A v j equals lambda j v j}, which is just the eigenvector equation.',
          do: async (s, o) => {
            await s.all([...o.dg.n, ...Object.values(o.dg.arrows), ...Object.values(o.dg.labels)].map((m) => m.fadeOut()));
            await o.check1.write({ duration: 1500 });
            await o.check2.write();
          },
        },
      ],
    },

    // 3
    {
      id: 'powers',
      title: 'Powers become easy',
      scene(s) {
        const l1 = s.tex('A^k = PD\\part{c1}{P^{-1}P}D\\part{c2}{P^{-1}P}D\\cdots D\\part{c3}{P^{-1}P}DP^{-1}', { x: 480, y: 85, size: 40, visible: false });
        const l2 = s.tex('A^k = PD^kP^{-1}', { x: 480, y: 170, size: 44, color: C.green, visible: false });
        const dk = s.tex(`D^k = ${texMat(D)}^k = \\begin{bmatrix}\\col{purple}{${t(LAMS[0])}^k} & 0 \\\\ 0 & \\col{purple}{${t(LAMS[1])}^k}\\end{bmatrix}`, { x: 480, y: 280, size: 38, visible: false });
        const ak = s.tex(`A^k = ${POW_TEX}`, { x: 480, y: 445, size: 38, visible: false });
        const trap = s.tex(`PDP = ${texMat(PDP)} \\neq A = ${texMat(A)}`, { x: 480, y: 280, size: 36, color: C.yellow, visible: false });
        const stamp = s.stamp('keep the $P^{-1}$', { x: 790, y: 172, size: 30, color: 'red' });
        return { l1, l2, dk, ak, trap, stamp };
      },
      steps: [
        {
          say: 'Multiply $A${A} by itself $k${k} times, written as $PDP^{-1}${P D P inverse}. Every inner $P^{-1}P${P inverse P} is the identity, so they all cancel, and $A^k = PD^kP^{-1}${A to the k equals P, D to the k, P inverse}.',
          do: async (s, o) => {
            await o.l1.write({ duration: 1400 });
            await s.all(['c1', 'c2', 'c3'].map((c) => o.l1.color(c, C.yellow)));
            await s.all(['c1', 'c2', 'c3'].map((c, i) => partOpacity(s, o.l1, c, 0.15, { delay: 200 * i })));
            await o.l2.write();
          },
        },
        {
          say: 'Powers of a diagonal matrix are easy: just raise each diagonal entry to the $k${k}.',
          do: (s, o) => o.dk.write({ duration: 1200 }),
        },
        {
          say: 'Multiply out, and you get a closed formula for every power of $A${A}, with no repeated multiplication at all.',
          do: async (s, o) => {
            await o.ak.write({ duration: 1500 });
            await o.ak.flash({ color: C.green });
          },
        },
        {
          say: 'Here\'s the trap: dropping the inverse. $PD^kP${P D to the k P} is not $A^k${A to the k}; already for $k = 1${k equals one}, $PDP${P D P} is a different matrix from $A${A}. Always end with $P^{-1}${P inverse}.',
          do: async (s, o) => {
            await o.dk.fadeOut();
            await o.trap.write({ duration: 1300 });
            await s.strike(o.trap, { color: 'red', dim: false });
            await o.stamp.slam();
          },
        },
      ],
    },

    // 4
    {
      id: 'try-power',
      kind: 'try',
      title: 'Your turn',
      say: 'Use the formula. What is the top left entry of $A^3${A cubed}?',
      prompt: `With $A = ${texMat(A)} = PDP^{-1}$ as above, find the $(1,1)$ entry of $A^3$.`,
      answer: { type: 'number', value: String(A3[0][0]) },
      hint: `The $(1,1)$ entry of $A^k$ is $${expTex(POW[0][0])}$. Put $k = 3$.`,
      solution: [
        `The $(1,1)$ entry of $A^k = PD^kP^{-1}$ is $${expTex(POW[0][0])}$.`,
        `At $k = 3$: $${POW[0][0].map(([c], k) => `${t(c)}\\cdot ${t(LAMS[k])}^3`).join(' + ')} = ${t(A3[0][0])}$.`,
        `Direct check: $A^3 = ${texMat(A3)}$.`,
      ],
    },

    // 5
    {
      id: 'diag-theorem',
      title: 'When does it work?',
      scene(s) {
        const cards = [
          { y: 116, title: 'Theorem 5 (Diagonalization Theorem)', body: 'An $n \\times n$ matrix $A$ is diagonalizable $\\iff$ it has $\\part{k}{n \\text{ independent eigenvectors}}$.' },
          { y: 276, title: 'Theorem 6', body: 'If $A$ ($n \\times n$) has $\\part{k}{n \\text{ distinct eigenvalues}}$, it is diagonalizable.' },
          { y: 454, title: 'Theorem 7', body: '$\\dim E_\\lambda \\leq$ the multiplicity of $\\lambda$. $A$ is diagonalizable if and only if its characteristic polynomial factors completely and $\\part{k}{\\dim E_\\lambda = \\text{multiplicity}}$ for each $\\lambda$, that is, $\\textstyle\\sum \\dim E_\\lambda = n$.' },
        ].map((c) => s.defCard({ y: c.y, width: 880, kind: 'theorem', title: c.title, body: c.body, size: 30, visible: false }));
        return { cards };
      },
      steps: [
        {
          say: 'When can we diagonalize? Exactly when there are enough eigenvectors: $n${n} linearly independent ones, a whole basis. They become the columns of $P${P}.',
          do: async (s, o) => {
            await o.cards[0].reveal();
            await s.ring([o.cards[0], 'k'], { color: 'purple', shape: 'box' });
          },
        },
        {
          say: 'Distinct eigenvalues guarantee it. Eigenvectors for different eigenvalues are independent, so $n${n} distinct eigenvalues give $n${n} independent eigenvectors.',
          do: async (s, o) => {
            await o.cards[1].reveal();
            await s.ring([o.cards[1], 'k'], { color: 'purple', shape: 'box' });
          },
        },
        {
          say: 'With repeated eigenvalues, you have to count. Each eigenspace contributes its dimension, and you need the dimensions to add up to $n${n}.',
          do: async (s, o) => {
            await o.cards[2].reveal();
            await s.ring([o.cards[2], 'k'], { color: 'purple', shape: 'box' });
          },
        },
      ],
    },

    // 6
    {
      id: 'shear-fails',
      title: 'When it fails',
      scene(s) {
        const At = s.tex(`A = ${texMat(SH)}`, { x: 215, y: 100, size: 40, visible: false });
        const cp = s.tex(`\\det(A - \\lambda I) = (${t(SH[0][0])} - \\lambda)^2`, { x: 215, y: 200, size: 30, visible: false });
        const ev = s.tex(`\\lambda = \\col{purple}{${t(SH_EIG[0].value)}}\\ \\text{(twice)}`, { x: 215, y: 260, size: 34, visible: false });
        const es = s.tex(`E_{${t(SH_EIG[0].value)}} = \\operatorname{Span}\\{${SH_E.map(rowTex).join(', ')}\\}`, { x: 215, y: 345, size: 32, color: C.purple, visible: false });
        const dim = s.tex(`\\dim E_{${t(SH_EIG[0].value)}} = ${SH_E.length} < 2`, { x: 215, y: 425, size: 36, color: C.yellow, visible: false });
        const stamp = s.stamp('not diagonalizable', { x: 215, y: 510, color: 'red' });
        const p = s.plane({ x: 660, y: 300, width: 440, range: [-3, 3, -2.5, 2.5], labels: false, names: ['x_1', 'x_2'], visible: false });
        const axis = p.span(SH_E[0].map(Number), { color: C.purple, width: 4, visible: false });
        const e1 = p.vector(SH_E[0].map(Number), { color: C.purple, visible: false });
        const others = [[0, 1], [-1, 1]].map((v, i) => ({
          line: p.span(v, { color: C.muted, width: 2, dash: '8 6', transform: false, visible: false }),
          v: p.vector(v, { color: i ? C.red : C.blue, visible: false }),
        }));
        return { At, cp, ev, es, dim, stamp, p, axis, e1, others };
      },
      steps: [
        {
          say: 'A shear is the classic failure. Its characteristic polynomial is $(1 - \\lambda)^2${one minus lambda, squared}, so it has one eigenvalue, $1${one}, counted twice.',
          do: async (s, o) => {
            await s.all(o.At.write(), o.p.draw({ duration: 900 }));
            await s.all(o.axis.draw(), o.e1.grow(), o.others.map((x) => s.all(x.line.draw(), x.v.grow())));
            await o.cp.write();
            await o.ev.write();
          },
        },
        {
          say: 'But only one direction of eigenvectors. Apply the shear: the $x_1${x one} axis stays put, and every other vector slides off its line.',
          do: async (s, o) => {
            await o.p.applyMatrix(num(SH), { duration: 1700 });
            await o.es.write();
          },
        },
        {
          say: 'One independent eigenvector is not enough for a basis of $\\mathbb{R}^2${R two}. The eigenspace has dimension $1${one}, less than the multiplicity $2${two}, so the shear is not diagonalizable.',
          do: async (s, o) => {
            await o.dim.write();
            await o.stamp.slam();
          },
        },
      ],
    },

    // 7
    {
      id: 'try-diagonalizable',
      kind: 'try',
      title: 'Your turn',
      say: 'Which of these can\'t be diagonalized? Count independent eigenvectors.',
      prompt: 'Which matrix is **not** diagonalizable?',
      answer: { type: 'choice', value: NOT_DIAG[0] },
      choices: [
        { id: 'a', label: `$${texMat(CANDS.a)}$`, why: `Right: eigenvalue $2$ twice, but $A - 2I = ${texMat(minusLI(CANDS.a, 2))}$ has rank 1, so only one independent eigenvector.` },
        { id: 'b', label: `$${texMat(CANDS.b)}$`, why: 'Repeated eigenvalue, but every vector is an eigenvector: it is already diagonal.' },
        { id: 'c', label: `$${texMat(CANDS.c)}$`, why: `Distinct eigenvalues $${eigList(CANDS.c)}$, so it is diagonalizable (Theorem 6).` },
        { id: 'd', label: `$${texMat(CANDS.d)}$`, why: `Triangular with distinct eigenvalues $${eigList(CANDS.d)}$: diagonalizable.` },
      ],
      hint: 'Repeated eigenvalues are not automatically a problem. Compare each eigenspace dimension with the multiplicity.',
      solution: [
        `(c) and (d) are triangular with distinct diagonal entries, so they have distinct eigenvalues and are diagonalizable by Theorem 6.`,
        '(b) has the repeated eigenvalue 2, but its eigenspace is all of $\\mathbb{R}^2$ (dimension 2): it is diagonal already.',
        `(a) also has eigenvalue 2 twice, but $A - 2I = ${texMat(minusLI(CANDS.a, 2))}$ has a one-dimensional null space. Dimension $1 < 2$, so (a) is **not** diagonalizable.`,
      ],
    },

    // 8
    {
      id: 'worked-3x3',
      title: 'Diagonalizing a 3×3',
      scene(s) {
        const lab = s.tex('A =', { x: 92, y: 400, size: 34, visible: false });
        const Am = s.matrix(W, { x: 250, y: 400, size: 34, visible: false });
        const d1 = s.tex(`\\det(A - \\lambda I) = (${t(W[0][0])}-\\lambda)\\det\\begin{bmatrix}${t(W[1][1])}-\\lambda & ${t(W[1][2])} \\\\ ${t(W[2][1])} & ${t(W[2][2])}-\\lambda\\end{bmatrix}`, { x: 480, y: 100, size: 32, visible: false });
        const d2 = s.tex(`= (${t(W_HI)}-\\lambda)^2(${t(W_LO)}-\\lambda)`, { x: 480, y: 195, size: 32, visible: false });
        const ev = s.tex(`\\lambda = \\col{purple}{${t(W_HI)}},\\ \\col{purple}{${t(W_HI)}},\\ \\col{teal}{${t(W_LO)}}`, { x: 660, y: 400, size: 36, visible: false });
        const r2 = s.tex(`A - ${t(W_HI)}I \\sim ${texMat(W_M2_R)},\\quad A - I \\sim ${texMat(W_M1_R)}`, { x: 480, y: 185, size: 30, visible: false });
        const vx = [440, 610, 790];
        const vlab = WV.map((_, k) => s.tex(`\\mathbf v_${k + 1}`, { x: vx[k], y: 292, size: 32, color: VCOL[k], visible: false }));
        const vtex = WV.map((v, k) => s.tex(texVec(v), { x: vx[k], y: 425, size: 34, color: VCOL[k], visible: false }));
        const dimNote = s.text('dimension 2: enough', { x: 525, y: 535, size: 30, color: C.purple, visible: false });
        const Plab = s.tex('P =', { x: 110, y: 300, size: 36, visible: false });
        const Pm = s.matrix(WP, { x: 300, y: 300, size: 36, visible: false });
        const Dlab = s.tex('D =', { x: 545, y: 300, size: 36, visible: false });
        const Dm = s.matrix(WD, { x: 700, y: 300, size: 36, visible: false });
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
          Pm.cell(i, j).style.opacity = '0';
          Dm.cell(i, j).style.opacity = '0';
        }
        const targets = WV.map((_, k) => {
          const b = Pm.colBox(k);
          return center(b);
        });
        const check = s.tex(`AP = ${texMat(WAP)} = PD\\ \\col{green}{\\checkmark}`, { x: 480, y: 505, size: 30, visible: false });
        return { lab, Am, d1, d2, ev, r2, vlab, vtex, dimNote, Plab, Pm, Dlab, Dm, targets, check };
      },
      steps: [
        {
          say: 'Diagonalize this $A${A}. Row one has two zeros, so expand along it. The characteristic polynomial is $(2 - \\lambda)^2(1 - \\lambda)${two minus lambda, all squared, times one minus lambda}: eigenvalues $2${two}, $2${two} and $1${one}.',
          do: async (s, o) => {
            await s.all(o.lab.fadeIn(), o.Am.fadeIn());
            await o.Am.highlightRow(0, C.yellow);
            await o.d1.write({ duration: 1300 });
            await s.all(o.d2.write(), o.Am.clearHighlights());
            await o.ev.write();
          },
        },
        {
          say: 'The repeated eigenvalue needs care. $A - 2I${A minus two I} reduces to one equation, $x_1 + x_3 = 0${x one plus x three equals zero}, with two free variables: a two dimensional eigenspace. That\'s enough. $\\lambda = 1${lambda equals one} adds a third eigenvector.',
          do: async (s, o) => {
            await s.all(o.d1.fadeOut(), o.d2.fadeOut(), o.lab.fadeOut(), o.Am.fadeOut(), o.ev.moveTo(480, 85));
            await o.r2.write({ duration: 1300 });
            await s.stagger([0, 1].map((k) => () => s.all(o.vlab[k].fadeIn(), o.vtex[k].fadeIn())), 500);
            await o.dimNote.fadeIn();
            await s.all(o.vlab[2].fadeIn(), o.vtex[2].fadeIn());
          },
        },
        {
          say: 'Now assemble. The eigenvectors go into $P${P} as columns, and their eigenvalues go down the diagonal of $D${D} in the same order: $2${two}, $2${two}, $1${one}.',
          do: async (s, o) => {
            await s.all([o.r2, o.dimNote, o.ev, ...o.vlab].map((m) => m.fadeOut()));
            await s.all(o.Plab.fadeIn(), o.Pm.fadeIn({ shift: [0, 0] }), o.Dlab.fadeIn(), o.Dm.fadeIn({ shift: [0, 0] }));
            for (let k = 0; k < 3; k++) {
              await o.vtex[k].moveTo(o.targets[k][0], o.targets[k][1], { duration: 800 });
              await s.all(
                cellsTo(s, o.Pm, [0, 1, 2].map((i) => [i, k]), 1),
                o.vtex[k].fadeOut({ duration: 300 }),
                o.Pm.highlightCol(k, VCOL[k]),
                cellsTo(s, o.Dm, [0, 1, 2].map((i) => [i, k]), 1),
                o.Dm.highlightCell(k, k, VCOL[k]),
              );
            }
          },
        },
        {
          say: 'Check $AP = PD${A P equals P D} instead of computing $P^{-1}${P inverse}. Both products give the same matrix, so $A = PDP^{-1}${A equals P D P inverse}.',
          do: async (s, o) => {
            await o.check.write({ duration: 1300 });
            await o.check.flash({ color: C.green });
          },
        },
      ],
    },

    // 9
    {
      id: 'mistake-order',
      title: 'The trap: mismatched order',
      scene(s) {
        const mk = (rows, x, y, name) => ({ lab: s.tex(`${name} =`, { x: x - 175, y, size: 32 }), m: s.matrix(rows, { x, y, size: 32 }) });
        const Pm = mk(WP, 290, 150, 'P');
        const Dm = mk(WD_BAD, 735, 150, 'D');
        const APm = mk(WAP, 290, 410, 'AP');
        const PDm = mk(WPD_BAD, 735, 410, 'PD');
        for (const k of [0, 1, 2]) Pm.m.highlightCol(k, VCOL[k], { duration: 0 });
        const neq = s.tex('\\neq', { x: 480, y: 410, size: 44, color: C.yellow, visible: false });
        const eq = s.tex('=', { x: 480, y: 410, size: 44, color: C.green, visible: false });
        const bad = [];
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!WAP[i][j].eq(WPD_BAD[i][j])) bad.push([i, j]);
        const match = s.text('column $j$ of $P$ ↔ entry $d_{jj}$ of $D$', { x: 480, y: 545, size: 30, color: C.muted, visible: false });
        return { Pm, Dm, APm, PDm, neq, eq, bad, match };
      },
      steps: [
        {
          say: 'Here\'s the trap. $P${P} lists the eigenvectors for $2${two}, $2${two}, then $1${one}, but $D${D} lists the eigenvalues as $1${one}, $2${two}, $2${two}. Compare $AP${A P} with $PD${P D}: they disagree.',
          do: async (s, o) => {
            o.box = s.surround(o.Dm.m, { color: C.yellow, pad: 6 });
            await o.box.draw();
            await o.neq.fadeIn();
            await s.stagger(o.bad.map(([i, j]) => () => s.all(o.APm.m.highlightCell(i, j, C.yellow), o.PDm.m.highlightCell(i, j, C.yellow))), 120);
          },
        },
        {
          say: 'Column $j${j} of $P${P} must go with the $j${j}th diagonal entry of $D${D}. Put $2${two}, $2${two}, $1${one} on the diagonal and now $AP = PD${A P equals P D}.',
          do: async (s, o) => {
            await s.all(o.APm.m.clearHighlights(), o.PDm.m.clearHighlights(), o.box.fadeOut(), o.neq.fadeOut());
            await o.Dm.m.setRows(WD);
            await o.PDm.m.setRows(WPD);
            await o.eq.fadeIn();
            await o.match.fadeIn();
          },
        },
        {
          say: 'Any order works, as long as the two match. Move $\\mathbf v_3${v three} to the front and its eigenvalue $1${one} to the front too: still $AP = PD${A P equals P D}.',
          do: async (s, o) => {
            await o.Pm.m.clearHighlights();
            await s.all(o.Pm.m.setRows(WP2), o.Dm.m.setRows(WD2));
            await o.Pm.m.highlightCol(0, C.teal);
            await o.Dm.m.highlightCell(0, 0, C.teal);
            await s.all(o.APm.m.setRows(mul(W, WP2)), o.PDm.m.setRows(mul(WP2, WD2)));
          },
        },
      ],
    },

    // 10
    {
      id: 'wo-diagonalize',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Diagonalize this matrix if you can, and enter a basis for the eigenspace of the repeated eigenvalue.',
      prompt: WO_ITEM.prompt,
      answer: WO_ITEM.answer,
      hints: WO_ITEM.hints,
      solution: WO_ITEM.solution,
    },

    // 11
    {
      id: 'b-matrix',
      title: 'Matrices of maps relative to a basis',
      scene(s) {
        const dg = diagram(s, {
          cx: 255,
          cy: 200,
          w: 280,
          h: 180,
          size: 32,
          nodes: ['\\mathbf x', 'T(\\mathbf x)', '[\\mathbf x]_{\\mathcal B}', '[T(\\mathbf x)]_{\\mathcal B}'],
          visible: false,
        });
        dg.labels.A.setTex('T');
        dg.labels.D.setTex('[T]_{\\mathcal B}');
        for (const k of ['Pinv', 'P', 'D']) dg.labels[k].node.style.color = C.ink;
        for (const k of ['Pinv', 'P', 'D']) dg.arrows[k].node.style.color = C.ink;
        dg.labels.Pinv.setTex('');
        dg.labels.P.setTex('');
        const f1 = s.tex('[T(\\mathbf x)]_{\\mathcal B} = [T]_{\\mathcal B}\\,[\\mathbf x]_{\\mathcal B}', { x: 700, y: 120, size: 34, visible: false });
        const f2 = s.tex('\\text{column } j \\text{ of } [T]_{\\mathcal B} = [T(\\mathbf b_j)]_{\\mathcal B}', { x: 690, y: 215, size: 30, visible: false });
        const ex = s.tex("T(p) = p',\\quad \\mathcal B = \\{1,\\ t,\\ t^2\\}", { x: 255, y: 385, size: 32, visible: false });
        const imgs = s.tex(`\\begin{aligned}${['1', 't', 't^2'].map((b, j) => `T(${b}) &= \\part{i${j}}{${DERIV_IMG[j]}}`).join(' \\\\ ')}\\end{aligned}`, { x: 230, y: 490, size: 30, visible: false });
        const Mlab = s.tex('[T]_{\\mathcal B} =', { x: 545, y: 470, size: 30, visible: false });
        const M = s.matrix(DERIV, { x: 720, y: 470, size: 30, visible: false });
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) M.cell(i, j).style.opacity = '0';
        const thm = s.tex('T(\\mathbf x) = A\\mathbf x,\\ \\ \\mathcal B = \\text{columns of } P:\\quad [T]_{\\mathcal B} = P^{-1}AP', { x: 480, y: 420, size: 34, visible: false });
        const eig = s.tex('\\text{eigenvector basis} \\Rightarrow [T]_{\\mathcal B} = D', { x: 480, y: 500, size: 34, color: C.purple, visible: false });
        return { dg, f1, f2, ex, imgs, Mlab, M, thm, eig };
      },
      steps: [
        {
          say: 'Any linear map on a finite dimensional space gets a matrix once you choose a basis $\\mathcal B${B}. Translate $\\mathbf x${x} into $\\mathcal B${B} coordinates, multiply by the $\\mathcal B${B} matrix of $T${T}, and you get the coordinates of $T(\\mathbf x)${T of x}.',
          do: async (s, o) => {
            const d = o.dg;
            await s.all(d.n[0].fadeIn(), d.n[1].fadeIn({ delay: 200 }), d.arrows.A.draw(), d.labels.A.fadeIn());
            await s.all(d.arrows.Pinv.draw(), d.arrows.P.draw(), d.n[2].fadeIn({ delay: 300 }), d.n[3].fadeIn({ delay: 300 }));
            await s.all(d.arrows.D.draw(), d.labels.D.fadeIn());
            await o.f1.write();
          },
        },
        {
          say: 'Column $j${j} is the image of the $j${j}th basis vector, in coordinates. For the derivative on $\\mathbb{P}_2${P two} with basis $1${one}, $t${t}, $t^2${t squared}: the images are $0${zero}, $1${one} and $2t${two t}.',
          do: async (s, o) => {
            await o.f2.write();
            await s.all(o.ex.write(), o.imgs.fadeIn({ delay: 400 }));
            await s.all(o.Mlab.fadeIn(), o.M.fadeIn({ shift: [0, 0] }));
            for (let j = 0; j < 3; j++) {
              await s.all(o.imgs.color(`i${j}`, C.blue), o.M.highlightCol(j, C.blue), cellsTo(s, o.M, [0, 1, 2].map((i) => [i, j]), 1));
              await s.wait(300);
              await s.all(o.imgs.color(`i${j}`, C.ink), o.M.clearHighlights());
            }
          },
        },
        {
          say: 'Now take $T(\\mathbf x) = A\\mathbf x${T of x equals A x} and the basis made of the columns of $P${P}. Then the $\\mathcal B${B} matrix is $P^{-1}AP${P inverse A P}: that\'s Theorem 8. When the columns are eigenvectors, it\'s the diagonal $D${D}.',
          do: async (s, o) => {
            await s.all([o.ex, o.imgs, o.Mlab, o.M].map((m) => m.fadeOut()));
            await o.thm.write({ duration: 1400 });
            await o.eig.write();
          },
        },
      ],
    },

    // 12
    {
      id: 'fill-bmatrix',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Find the matrix of this map: apply it to each basis polynomial.',
      prompt: "Let $T:\\mathbb{P}_2 \\to \\mathbb{P}_2$, $T(p) = p + tp'$, and $\\mathcal B = \\{1, t, t^2\\}$.",
      lines: [
        [
          '[T]_{\\mathcal B} = ',
          {
            matrix: [0, 1, 2].map((i) =>
              [0, 1, 2].map((j) =>
                i === j
                  ? { id: `d${i + 1}`, answer: { type: 'number', value: String(TB[i]) }, ...(i === 2 ? { hint: "$T(t^2) = t^2 + t\\cdot 2t$." } : {}) }
                  : { id: `z${i + 1}${j + 1}`, answer: { type: 'number', value: '0' } },
              ),
            ),
          },
        ],
      ],
      solution: [
        `$T(1) = 1$, $T(t) = t + t\\cdot 1 = ${TB[1]}t$, $T(t^2) = t^2 + t\\cdot 2t = ${TB[2]}t^2$.`,
        `Column $j$ holds the coordinates of $T(\\mathbf b_j)$. Each basis polynomial is sent to a multiple of itself, so $[T]_{\\mathcal B} = ${texMat([0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? TB[i] : 0))))}$: the basis $\\{1, t, t^2\\}$ is an eigenvector basis of $T$.`,
      ],
    },

    // 13
    {
      id: 'try-distinct',
      kind: 'try',
      title: 'Your turn',
      say: 'Count eigenvectors before you answer.',
      prompt: 'A $4 \\times 4$ matrix has eigenvalues $1, 2, 2, 5$, and the eigenspace for $2$ is one-dimensional. Is it diagonalizable?',
      answer: { type: 'choice', value: DIST_SUM === 4 ? 'yes' : 'no' },
      choices: [
        { id: 'yes', label: 'Yes', why: `The eigenspace dimensions add to $${DIST_DIMS.join(' + ')} = ${DIST_SUM} < 4$: not enough eigenvectors.` },
        { id: 'no', label: 'No', why: `Right: only $${DIST_SUM}$ independent eigenvectors, and a $4\\times 4$ matrix needs $4$.` },
      ],
      hint: 'Each simple eigenvalue gives exactly one dimension. What does the repeated one give?',
      solution: [
        'The simple eigenvalues $1$ and $5$ each have a one-dimensional eigenspace.',
        `The eigenvalue $2$ has multiplicity $2$ but its eigenspace has dimension $1$. In total $${DIST_DIMS.join(' + ')} = ${DIST_SUM} < 4$.`,
        'By Theorem 7 the matrix is **not** diagonalizable.',
      ],
    },

    // 14
    {
      id: 'cp-diag',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: 'Why does $A = PDP^{-1}$ (with $D$ diagonal) require the columns of $P$ to be eigenvectors of $A$?',
      points: [
        '$A = PDP^{-1}$ is equivalent to $AP = PD$, because $P$ is invertible',
        'Column $j$ of $AP$ is $A\\mathbf p_j$; column $j$ of $PD$ is $d_{jj}\\mathbf p_j$',
        'So $A\\mathbf p_j = d_{jj}\\mathbf p_j$ for every $j$',
        'P is invertible, so its columns are nonzero and independent: they are eigenvectors forming a basis',
      ],
    },

    // 15
    {
      id: 'summary-diag',
      title: 'Summary',
      scene(s) {
        const dg = diagram(s, {
          cx: 245,
          cy: 230,
          w: 260,
          h: 170,
          size: 32,
          nodes: ['\\mathbf x', 'A\\mathbf x', '[\\mathbf x]_{\\mathcal B}', 'D[\\mathbf x]_{\\mathcal B}'],
          visible: true,
        });
        const g = eigenPlane(s, { x: 710, y: 225, width: 380, visible: true });
        for (const l of g.grid) l.set({ opacity: 0.4 });
        for (const m of [...g.axes, g.cell, ...g.vecs]) m.show();
        const items = [
          '\\text{diagonalizable} \\iff \\text{eigenvector basis}',
          'A^k = PD^kP^{-1}',
          'P^{-1}AP = D',
        ].map((tx, i) => s.tex(tx, { x: 480, y: 435 + 52 * i, size: 32, color: i === 0 ? C.purple : C.ink, visible: false }));
        return { dg, ...g, items };
      },
      steps: [
        {
          say: 'A matrix is diagonalizable exactly when it has a basis of eigenvectors. In that basis it only stretches.',
          do: async (s, o) => {
            await o.items[0].write();
            await o.p.applyMatrix(num(A), { duration: 1600 });
          },
        },
        {
          say: 'Then $A = PDP^{-1}${A equals P D P inverse}, and powers are easy: $A^k = PD^kP^{-1}${A to the k equals P, D to the k, P inverse}.',
          do: (s, o) => o.items[1].write(),
        },
        {
          say: 'And $P^{-1}AP${P inverse A P} is just $A${A} seen from the eigenvector basis: the diagonal matrix $D${D}.',
          do: async (s, o) => {
            await o.items[2].write();
            await s.all(o.dg.labels.D.indicate({ color: C.purple }), o.dg.arrows.D.indicate({ color: C.purple }));
          },
        },
      ],
    },
  ],
};
