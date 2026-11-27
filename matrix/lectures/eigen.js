/**
 * Lecture 19 · Eigenvectors and the characteristic equation (Lay 5.1–5.2). Design: matrix/PLAN.md § 19.
 * Every matrix, eigenvalue, eigenspace and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import {
  mat, vec, mul, mulVec, sub, scale, identity, inverse, rref, det, charPoly, rationalEigen, eigenspace, texMat, texVec, texRowOp,
} from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- helpers

const t = (x) => F(x).tex({ inline: true });
const num = (A) => A.map((r) => r.map(Number));
const X = ['x_1', 'x_2', 'x_3'];
const gcd = (a, b) => (b ? gcd(b, a % b) : a < 0n ? -a : a);
const minusLI = (A, lam) => sub(mat(A), scale(F(lam), identity(A.length)));
const rowTex = (v) => `(${v.map(String).join(', ')})`;
/** Every row operation of rref(M) with the matrix after it, as markdown. */
function reduceSteps(M) {
  const steps = rref(M).steps;
  if (!steps.length) return 'It is already in reduced echelon form.';
  return `Row reduce: ${steps.map((st) => `$${texRowOp(st)}$ gives $${texMat(st.after)}$`).join('; ')}.`;
}

/** `2x_1 - x_2 + x_3` from coefficients. */
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

/** v scaled to integers with no common factor (direction kept). */
function intVec(v) {
  const l = v.reduce((a, x) => (a * x.d) / gcd(a, x.d), 1n);
  const w = v.map((x) => x.mul(F(l)).n);
  const g = w.reduce((a, x) => gcd(a, x), 0n) || 1n;
  return w.map((x) => F(x / g));
}

/** Characteristic polynomial det(A − λI) as TeX (sign (−1)^n times charPoly's det(λI − A)). */
function polyTex(A) {
  const c = charPoly(A);
  const n = c.length - 1;
  const sgn = n % 2 ? F(-1) : F(1);
  let out = '';
  c.forEach((k0, i) => {
    const k = k0.mul(sgn);
    if (k.zero) return;
    const p = n - i;
    const v = p === 0 ? '' : p === 1 ? '\\lambda' : `\\lambda^${p}`;
    const a = k.abs();
    out += (k.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) && v ? '' : t(a)) + v;
  });
  return out;
}

/** Factored (λ − r) form for rational roots: (\lambda - 2)(\lambda - 3). */
const factorTex = (roots) =>
  roots.map(({ value, mult }) => `(\\lambda ${value.sign() < 0 ? '+' : '-'} ${t(value.abs())})${mult > 1 ? `^${mult}` : ''}`).join('');

/** Fades a Tex's named part to an opacity on the stage clock. */
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

// ---------------------------------------------------------------- data

/** Beats 1, 2, 15: the upper-triangular picture matrix. */
const A1 = mat([[3, 1], [0, 2]]);
const A1_INV = inverse(A1);
const A1_EIG = rationalEigen(A1); // 3, 2
const V1 = eigenspace(A1, A1_EIG[0].value)[0]; // (1, 0)
const V2n = (() => {
  const v = intVec(eigenspace(A1, A1_EIG[1].value)[0]);
  return v[0].sign() < 0 ? v : v.map((x) => x.neg());
})(); // (−1, 1)
const XG = vec([1, 1]);
const A1V2 = mulVec(A1, V2n);
const A1XG = mulVec(A1, XG);

/** Beats 3–5, 9, 11: the running 2×2. */
const A = mat([[4, -2], [1, 1]]);
const A_EIG = rationalEigen(A); // 3, 2
const LAM = A_EIG[0].value; // 3
const AmL = minusLI(A, LAM);
const AmL_RED = rref(AmL);
const E3 = intVec(eigenspace(A, LAM)[0]); // (2, 1)
const ROOTS = A_EIG.slice().sort((a, b) => a.value.cmp(b.value)).map((e) => e.value); // 2, 3
const EV2 = intVec(eigenspace(A, ROOTS[0])[0]); // (1, 1)
const EV3 = intVec(eigenspace(A, ROOTS[1])[0]); // (2, 1)
const detFn = (l) => (Number(A[0][0]) - l) * (Number(A[1][1]) - l) - Number(A[0][1]) * Number(A[1][0]);

/** Beat 3 candidates. */
const TRY_A = A;
const TRY_C = { a: [1, 1], b: [1, 0], c: [0, 0], d: [1, 2] };
const TRY_IMG = Object.fromEntries(Object.entries(TRY_C).map(([k, v]) => [k, mulVec(TRY_A, vec(v))]));
const isEig = (v, w) => v.some((x) => x !== 0) && (() => {
  const i = v.findIndex((x) => x !== 0);
  const l = w[i].div(F(v[i]));
  return w.every((x, j) => x.eq(l.mul(F(v[j]))));
})();
const TRY_OK = Object.keys(TRY_C).filter((k) => isEig(TRY_C[k], TRY_IMG[k]));
const TRY_LAM = TRY_IMG[TRY_OK[0]][0].div(F(TRY_C[TRY_OK[0]][0]));

/** Beat 6. */
const FC = mat([[1, 4], [2, 3]]);
const FC_POLY = charPoly(FC); // [1, −4, −5] for λ² − 4λ − 5 (n even, so det(A − λI) has the same coefficients)
const FC_EIG = rationalEigen(FC).map((e) => String(e.value));

/** Beat 7: the worked 3×3. */
const W3 = mat([[2, 0, 0], [1, 3, 1], [1, 1, 3]]);
const W3_EIG = rationalEigen(W3); // 4 (1), 2 (2)
const W3_LO = W3_EIG.find((e) => e.mult === 2).value;
const W3_HI = W3_EIG.find((e) => e.mult === 1).value;
const W3_E2 = eigenspace(W3, W3_LO);
const W3_E4 = eigenspace(W3, W3_HI).map(intVec);
const W3_M2 = minusLI(W3, W3_LO);
const W3_M4 = minusLI(W3, W3_HI);
const lamCell = (A0) => A0.map((r, i) => r.map((x, j) => (i === j ? `${t(x)}-\\lambda` : t(x))));

/** Beat 8: a triangular matrix with a zero on the diagonal. */
const TRI = mat([[3, 6, -8], [0, 0, 6], [0, 0, 2]]);
const TRI_DIAG = TRI.map((r, i) => r[i]);
const TRI_EIG_OK = rationalEigen(TRI).every((e) => TRI_DIAG.some((d) => d.eq(e.value)));
if (!TRI_EIG_OK) throw new Error('triangular eigenvalues');

/** Beat 9: the forward row operation that makes A triangular, and the wrong "eigenvalues". */
const FWD = rref(A).steps.filter((st) => st.phase === 'forward');
const TRIA = FWD.at(-1).after;
const WRONG = TRIA.map((r, i) => r[i]);
const DET_WRONG = det(minusLI(A, WRONG[0]));

/** Beat 10. */
const TE = mat([[3, 0, -1], [2, 3, 1], [-3, 4, 5]]);
const TE_L = 4;
const TE_M = minusLI(TE, TE_L);
const TE_V = intVec(eigenspace(TE, TE_L)[0]).map((x, _, v) => (v[2].sign() < 0 ? x.neg() : x));
const TE_AV = mulVec(TE, TE_V);
const TE_IS = eigenspace(TE, TE_L).length > 0;

/** Beat 12: a non-trivial similarity, and the counterexample. */
const SH = mat([[1, 1], [0, 1]]);

// ---------------------------------------------------------------- workout

/** `A - 3I`, or `A + 2I` when λ is negative. */
const amLI = (l) => (F(l).sign() < 0 ? `A + ${t(F(l).abs())}I` : `A - ${t(l)}I`);

function eigspaceItem(A0, lam0) {
  const Am = mat(A0);
  const lam = F(lam0);
  const AL = amLI(lam);
  const M = minusLI(Am, lam);
  const red = rref(M);
  const R = red.R;
  const basis = eigenspace(Am, lam).map(intVec);
  const pivCols = red.pivots.map(([, c]) => c);
  const free = [0, 1, 2].filter((c) => !pivCols.includes(c));
  const eqs = R.filter((r) => r.some((x) => !x.zero)).map((r) => `$${lin(r)} = 0$`);
  const others = rationalEigen(Am).filter((e) => !e.value.eq(lam));
  const otherTxt = others.map((e) => `$\\lambda = ${t(e.value)}$ has eigenvectors along $${rowTex(intVec(eigenspace(Am, e.value)[0]))}$`).join('; ');
  const raw = eigenspace(Am, lam);
  return {
    prompt: `Find a basis for the eigenspace of $$A = ${texMat(Am)}$$ for $\\lambda = ${t(lam)}$. Enter one vector per box.`,
    answer: { type: 'basis', value: basis.map((v) => v.map(String)) },
    hints: [
      `The eigenspace is $\\operatorname{Nul}(${AL})$. Form $${AL} = ${texMat(M)}$.`,
      `Row reduce: $${AL} \\sim ${texMat(R)}$. The free variables are ${free.map((f) => `$x_${f + 1}$`).join(' and ')}.`,
    ],
    solution: [
      `Eigenvectors for $\\lambda = ${t(lam)}$ solve $(${AL})\\mathbf x = \\mathbf 0$, where $${AL} = ${texMat(M)}$.`,
      reduceSteps(M),
      `The equations: ${eqs.join(', ')}, with ${free.map((f) => `$x_${f + 1}$`).join(' and ')} free. In parametric form $\\mathbf x = ${free.map((f, k) => `x_${f + 1}${texVec(raw[k])}`).join(' + ')}$.`,
      `So a basis is ${basis.map((v) => `$${rowTex(v)}$`).join(' and ')}: the eigenspace has dimension $${basis.length}$.${otherTxt ? ` (For comparison, ${otherTxt}.)` : ''}`,
    ],
  };
}
const WO_A = [[3, -2, 4], [0, 1, 4], [0, 0, 3]];
const WO = eigspaceItem(WO_A, 3);

function generateEigspace(rand) {
  for (;;) {
    const lam = rand.int(-3, 4);
    const mu = rand.int(-3, 4);
    if (mu === lam) continue;
    const diag = rand.shuffle([lam, lam, mu]);
    const A0 = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? diag[i] : j > i ? rand.int(-4, 4) : 0)));
    if (A0[0][1] === 0 && A0[0][2] === 0 && A0[1][2] === 0) continue;
    const M = minusLI(A0, lam);
    const R = rref(M).R;
    const basis = eigenspace(A0, lam).map(intVec);
    const nice = R.every((r) => r.every((x) => x.d <= 6n && x.abs().cmp(20) <= 0)) && basis.every((v) => v.every((x) => x.abs().cmp(20) <= 0));
    if (!nice) continue;
    return eigspaceItem(A0, lam);
  }
}

// ---------------------------------------------------------------- shared scene builders

/** Beats 1 and 15: the plane with A = [[3, 1], [0, 2]]. */
function stayPlane(s, visible = false) {
  const p = s.plane({ x: 630, y: 310, width: 520, range: [-3, 5, -1, 4], names: ['x_1', 'x_2'], visible });
  return p;
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'eigen',
  title: 'Eigenvectors and the characteristic equation',
  goals: [
    'See eigenvectors as the directions a matrix only stretches: $A\\mathbf x = \\lambda\\mathbf x$, $\\mathbf x \\neq \\mathbf 0$',
    'Check whether a vector or number is an eigenvector or eigenvalue; find eigenspaces as $\\operatorname{Nul}(A - \\lambda I)$',
    'Find eigenvalues from the characteristic equation $\\det(A - \\lambda I) = 0$',
    'Know that eigenvectors for distinct eigenvalues are independent, and similar matrices share eigenvalues',
  ],
  beats: [
    // 1
    {
      id: 'stay-on-line',
      title: 'Vectors that stay on their line',
      scene(s) {
        const At = s.tex(`A = ${texMat(A1)}`, { x: 190, y: 110, size: 40, visible: false });
        const p = stayPlane(s);
        const xSpan = p.span(num([XG])[0], { color: C.yellow, width: 3, dash: '10 8', transform: false, visible: false });
        const x = p.vector(num([XG])[0], { color: C.blue, label: '\\mathbf x', visible: false });
        const off = s.text('knocked off its line', { x: 190, y: 230, size: 30, color: C.yellow, visible: false });
        const spans = [V1, V2n].map((v) => p.span(v.map(Number), { color: C.purple, width: 3, visible: false }));
        const vs = [V1, V2n].map((v, i) => p.vector(v.map(Number), { color: C.purple, label: `\\mathbf v_${i + 1}`, visible: false }));
        const eqs = A1_EIG.map((e, i) => s.tex(`A\\mathbf v_${i + 1} = \\col{purple}{${t(e.value)}}\\,\\mathbf v_${i + 1}`, { x: 190, y: 330 + 70 * i, size: 38, visible: false }));
        const name = s.text('eigenvectors, eigenvalues 3 and 2', { x: 190, y: 480, size: 30, width: 280, color: C.purple, visible: false });
        return { At, p, xSpan, x, off, spans, vs, eqs, name };
      },
      steps: [
        {
          say: 'Watch what this matrix does to a vector. Before, $\\mathbf x${x} points along the dashed line. After, $A\\mathbf x${A x} points somewhere else: most vectors get knocked off their own line.',
          do: async (s, o) => {
            await s.all(o.At.write(), o.p.draw({ duration: 900 }));
            await s.all(o.xSpan.draw({ duration: 600 }), o.x.grow());
            await o.p.applyMatrix(num(A1), { duration: 1500 });
            await o.off.fadeIn();
          },
        },
        {
          say: 'But a few special directions survive. Along these two purple lines, $A${A} doesn\'t turn anything. It only stretches.',
          do: async (s, o) => {
            await s.all(o.p.applyMatrix(num(A1_INV), { duration: 900 }), o.off.fadeOut(), o.xSpan.fadeOut());
            await s.all(o.spans.map((l) => l.draw({ duration: 600 })), o.vs.map((v) => v.grow({ delay: 300 })));
            await o.p.applyMatrix(num(A1), { duration: 1600 });
          },
        },
        {
          say: 'Those are eigenvectors, and the stretch factor is the eigenvalue. $\\mathbf v_1${v one} gets tripled, so its eigenvalue is $3${three}. $\\mathbf v_2${v two} gets doubled: eigenvalue $2${two}.',
          do: async (s, o) => {
            await s.stagger(o.eqs.map((e, i) => () => s.all(e.write(), o.vs[i].indicate({ color: C.purple }))), 1400);
            await o.name.fadeIn();
          },
        },
      ],
    },

    // 2
    {
      id: 'definition',
      title: 'The definition',
      scene(s) {
        const card = s.defCard({
          y: 128,
          width: 860,
          body: 'An **eigenvector** of an $n \\times n$ matrix $A$ is a $\\part{nz}{\\text{nonzero}}$ vector $\\mathbf x$ with $\\part{eq}{A\\mathbf x = \\lambda\\mathbf x}$ for some scalar $\\lambda$, called an **eigenvalue** of $A$.',
          visible: false,
        });
        const base = [1, 0.5];
        const panels = [2, -1, 0].map((l, k) => {
          const cx = 170 + 310 * k;
          const p = s.plane({ x: cx, y: 330, width: 240, range: [-3, 3, -2, 2], labels: false, visible: false });
          const ghost = p.vector(base, { color: C.muted, width: 4, visible: false });
          const v = p.vector(base, { color: C.purple, visible: false });
          const cap = s.tex(l === 0 ? '\\lambda = 0:\\ A\\mathbf x = \\mathbf 0' : `\\lambda = ${l}:\\ \\text{${l < 0 ? 'flip' : 'stretch'}}`, { x: cx, y: 450, size: 30, visible: false });
          return { p, ghost, v, cap, to: base.map((c) => c * l) };
        });
        const check = s.tex(`${texMat(A1)}${texVec(V2n)} = ${texVec(A1V2)} = \\col{purple}{${t(A1_EIG[1].value)}}${texVec(V2n)}\\ \\col{green}{\\checkmark}`, { x: 480, y: 360, size: 40, visible: false });
        return { card, panels, check };
      },
      steps: [
        {
          say: 'Here is the definition. An eigenvector of $A${A} is a nonzero vector $\\mathbf x${x} with $A\\mathbf x = \\lambda\\mathbf x${A x equals lambda x}. The zero vector never counts, since $A\\mathbf 0 = \\lambda\\mathbf 0${A times zero equals lambda times zero} for every $\\lambda${lambda}.',
          do: async (s, o) => {
            await o.card.reveal();
            await s.ring([o.card, 'nz'], { color: 'yellow' });
          },
        },
        {
          say: 'The eigenvalue can be any number. Bigger than one stretches, a negative $\\lambda${lambda} flips the vector around, and $\\lambda = 0${lambda equals zero} sends it to zero.',
          do: async (s, o) => {
            await s.all(o.panels.map((pn) => s.all(pn.p.draw({ duration: 600 }), pn.ghost.grow({ delay: 300 }), pn.v.grow({ delay: 300 }))));
            await s.stagger(o.panels.map((pn) => () => s.all(pn.v.moveTo(pn.to, { duration: 900 }), pn.cap.fadeIn())), 900);
          },
        },
        {
          say: 'Checking a candidate is just one multiplication. $A${A} times $(-1, 1)${minus one, one} is $(-2, 2)${minus two, two}, which is $2${two} times the vector. So it\'s an eigenvector, with eigenvalue $2${two}.',
          do: async (s, o) => {
            await s.all(o.panels.map((pn) => s.all(pn.p.fadeOut(), pn.cap.fadeOut())));
            await o.check.write({ duration: 1400 });
          },
        },
      ],
    },

    // 3
    {
      id: 'try-is-eigvec',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Multiply each candidate by $A${A} and compare.',
      prompt: `Let $A = ${texMat(TRY_A)}$. Which vector is an eigenvector of $A$?`,
      answer: { type: 'choice', value: TRY_OK[0] },
      choices: Object.entries(TRY_C).map(([k, v]) => {
        const w = TRY_IMG[k];
        const why =
          k === TRY_OK[0]
            ? `Right: $A${rowTex(v)} = ${rowTex(w)} = ${t(TRY_LAM)}${rowTex(v)}$, so $\\lambda = ${t(TRY_LAM)}$.`
            : v.every((x) => x === 0)
              ? 'Eigenvectors must be nonzero, even though $A\\mathbf 0 = \\lambda\\mathbf 0$ for every $\\lambda$.'
              : `$A${rowTex(v)} = ${rowTex(w)}$, not a multiple of $${rowTex(v)}$.`;
        return { id: k, label: `$${rowTex(v)}$`, why };
      }),
      hint: 'Compute $A\\mathbf v$ for each candidate and ask whether it is a multiple of $\\mathbf v$.',
      solution: [
        ...Object.entries(TRY_C).filter(([k]) => k !== TRY_OK[0] && TRY_C[k].some((x) => x !== 0)).map(([k, v]) => `$A${rowTex(v)} = ${rowTex(TRY_IMG[k])}$: not a multiple of $${rowTex(v)}$.`),
        `$A${rowTex(TRY_C[TRY_OK[0]])} = ${rowTex(TRY_IMG[TRY_OK[0]])} = ${t(TRY_LAM)}${rowTex(TRY_C[TRY_OK[0]])}$: an eigenvector with eigenvalue $${t(TRY_LAM)}$.`,
        'The zero vector is excluded by definition.',
      ],
    },

    // 4
    {
      id: 'eigenspace',
      title: 'Eigenspaces',
      scene(s) {
        const eq = s.tex('A\\mathbf x = \\lambda\\mathbf x \\iff (A - \\lambda I)\\mathbf x = \\mathbf 0', { x: 480, y: 65, size: 40, visible: false });
        const lab = s.tex('A', { x: 200, y: 140, size: 38, visible: false });
        const m = s.matrix(A, { x: 200, y: 265, size: 44, visible: false });
        const rel = s.tex(`x_1 = ${t(AmL_RED.R[0][1].neg())}x_2 \\;\\Rightarrow\\; \\mathbf x = x_2${texVec(E3)}`, { x: 260, y: 430, size: 32, visible: false });
        const p = s.plane({ x: 745, y: 300, width: 320, range: [-4, 4, -4, 4], labels: false, visible: false });
        const span = p.span(E3.map(Number), { color: C.purple, width: 4, visible: false });
        const ws = [0.5, -0.5].map((k) => p.vector(E3.map((x) => Number(x) * k), { color: C.purple, visible: false }));
        const zero = p.point([0, 0], { color: C.purple, r: 8, visible: false });
        const name = s.tex(`E_${t(LAM)} = \\operatorname{Nul}(A - ${t(LAM)}I)`, { x: 745, y: 510, size: 34, color: C.purple, visible: false });
        const pq = s.tex('P\\mathbf q = \\col{purple}{1}\\,\\mathbf q:\\ \\ \\mathbf q \\in \\operatorname{Nul}(P - I)', { x: 275, y: 528, size: 30, visible: false });
        return { eq, lab, m, rel, p, span, ws, zero, name, pq };
      },
      steps: [
        {
          say: 'How do we find all eigenvectors for a given $\\lambda${lambda}? Move everything to one side. Since $\\lambda\\mathbf x = \\lambda I\\mathbf x${lambda x equals lambda I x}, the equation becomes $(A - \\lambda I)\\mathbf x = \\mathbf 0${A minus lambda I, times x, equals zero}.',
          do: async (s, o) => {
            await o.eq.write({ duration: 1400 });
            await s.all(o.lab.fadeIn(), o.m.fadeIn());
          },
        },
        {
          say: 'Try $\\lambda = 3${lambda equals three} for our matrix. Subtract $3${three} down the diagonal and row reduce. There\'s a free variable, so a nonzero solution exists, and $3${three} is an eigenvalue.',
          do: async (s, o) => {
            await s.all(o.m.highlightCell(0, 0, C.yellow), o.m.highlightCell(1, 1, C.yellow), o.lab.swap(`A - ${t(LAM)}I`));
            await s.all(o.m.setEntry(0, 0, AmL[0][0]), o.m.setEntry(1, 1, AmL[1][1]));
            await o.m.clearHighlights();
            for (const st of AmL_RED.steps) await o.m.rowOp(st);
            await o.m.note();
            await o.rel.write();
          },
        },
        {
          say: 'All the solutions together form the eigenspace for $3${three}: the null space of $A - 3I${A minus three I}. It\'s a subspace, so it contains the zero vector too, even though zero isn\'t an eigenvector. Here it\'s the line through $(2, 1)${two, one}. Apply $A${A}: every vector on this line just triples.',
          do: async (s, o) => {
            await o.p.draw({ duration: 700 });
            await s.all(o.span.draw({ duration: 700 }), o.ws.map((w) => w.grow({ delay: 300 })), o.zero.draw({ delay: 500 }));
            await o.name.write();
            await o.p.applyMatrix(num(A), { duration: 1400 });
          },
        },
        {
          say: 'You\'ve met one already. A Markov chain\'s steady state satisfies $P\\mathbf q = \\mathbf q${P q equals q}, which is $P\\mathbf q = 1\\cdot\\mathbf q${P q equals one times q}: it\'s an eigenvector for eigenvalue $1${one}, found in the null space of $P - I${P minus I}.',
          do: async (s, o) => {
            await o.pq.write({ duration: 1200 });
            await o.pq.indicate({ color: C.purple });
          },
        },
      ],
    },

    // 5
    {
      id: 'char-eq',
      title: 'Finding eigenvalues: the characteristic equation',
      scene(s) {
        const hero = s.tex('\\det(A - \\lambda I) = 0', { x: 250, y: 70, size: 44, visible: false });
        const At = s.tex(`A = ${texMat(A)}`, { x: 250, y: 170, size: 36, visible: false });
        const lines = [
          `= (${t(A[0][0])}-\\lambda)(${t(A[1][1])}-\\lambda) ${A[0][1].mul(A[1][0]).sign() < 0 ? '+' : '-'} ${t(A[0][1].mul(A[1][0]).abs())}`,
          `= ${polyTex(A)}`,
          `= ${factorTex(ROOTS.map((value) => ({ value, mult: 1 })))}`,
        ].map((tx, i) => s.tex(tx, { x: 250, y: 280 + 62 * i, size: 32, visible: false }));
        const roots = s.tex(`\\lambda = ${ROOTS.map(t).join(',\\ ')}`, { x: 250, y: 500, size: 40, color: C.purple, visible: false });
        const p = s.plane({ x: 720, y: 300, width: 380, range: [-3, 5, -4, 3], labels: false, visible: false });
        const cols = (l) => [[Number(A[0][0]) - l, Number(A[1][0])], [Number(A[0][1]), Number(A[1][1]) - l]];
        const [c1, c2] = cols(0);
        const poly = p.polygon([[0, 0], c1, [c1[0] + c2[0], c1[1] + c2[1]], c2], { color: C.purple, visible: false });
        const v1 = p.vector(c1, { color: C.blue, visible: false });
        const v2 = p.vector(c2, { color: C.red, visible: false });
        const read = s.text('λ = 0.00    det = 6.00', { x: 720, y: 530, size: 32, visible: false });
        const set = (l) => {
          const [a, b] = cols(l);
          poly.pts = [[0, 0], a, [a[0] + b[0], a[1] + b[1]], b];
          poly.redraw();
          v1.setCoords(a);
          v2.setCoords(b);
          read.setText(`λ = ${l.toFixed(2)}    det = ${(detFn(l) + 0).toFixed(2).replace('-0.00', '0.00')}`);
        };
        const slide = (from, to, duration) => s.clock.tween({ duration, update: (k) => set(from + (to - from) * k) });
        return { hero, At, lines, roots, p, poly, v1, v2, read, slide };
      },
      steps: [
        {
          say: '$\\lambda${lambda} is an eigenvalue exactly when $A - \\lambda I${A minus lambda I} has a nontrivial null space, that is, when it is not invertible. Watch its columns as $\\lambda${lambda} grows: at $\\lambda = 2${lambda equals two} they squash flat.',
          do: async (s, o) => {
            await s.all(o.hero.write(), o.At.fadeIn({ delay: 300 }), o.p.draw({ duration: 800 }));
            await s.all(o.poly.draw(), o.v1.grow(), o.v2.grow(), o.read.fadeIn());
            await o.slide(0, Number(ROOTS[0]), 2400);
            await o.read.flash({ color: C.purple });
          },
        },
        {
          say: 'Not invertible means the determinant is zero: the area of that parallelogram. Keep going, and it collapses again at $\\lambda = 3${lambda equals three}.',
          do: async (s, o) => {
            await o.slide(Number(ROOTS[0]), Number(ROOTS[1]), 1800);
            await o.read.flash({ color: C.purple });
            await o.slide(Number(ROOTS[1]), 4, 1200);
          },
        },
        {
          say: 'In algebra, $\\det(A - \\lambda I)${the determinant of A minus lambda I} is a polynomial in $\\lambda${lambda}, the characteristic polynomial. Here it\'s $\\lambda^2 - 5\\lambda + 6${lambda squared minus five lambda plus six}, which factors, and its roots $2${two} and $3${three} are the eigenvalues.',
          do: async (s, o) => {
            await o.At.swap(`\\det\\begin{bmatrix}${t(A[0][0])}-\\lambda & ${t(A[0][1])} \\\\ ${t(A[1][0])} & ${t(A[1][1])}-\\lambda\\end{bmatrix}`, { duration: 700 });
            await s.stagger(o.lines.map((l) => () => l.write()), 1100);
            await s.wait(1400);
            await o.roots.write();
          },
        },
      ],
    },

    // 6
    {
      id: 'fill-char',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Now you find the characteristic polynomial and the eigenvalues.',
      prompt: `Let $A = ${texMat(FC)}$.`,
      lines: [
        [
          '\\det(A - \\lambda I) = \\lambda^2 - ',
          { id: 'b', answer: { type: 'number', value: String(FC_POLY[1].neg()) }, hint: 'The minus sign is already written, so enter the trace: $1 + 3$.' },
          '\\lambda ',
          { id: 'c', chips: [`-\\,${t(FC_POLY[2].abs())}`, `+\\,${t(FC_POLY[2].abs())}`, '-\\,11'], answer: `${FC_POLY[2].sign() < 0 ? '-' : '+'}\\,${t(FC_POLY[2].abs())}`, hint: 'The constant term is $\\det A = 1\\cdot 3 - 4\\cdot 2$.' },
        ],
        ['\\text{eigenvalues: }', { id: 'ev', answer: { type: 'set', value: FC_EIG }, hint: 'Factor the polynomial. Separate the two values with a comma.' }],
      ],
      solution: [
        `$\\det(A - \\lambda I) = (1 - \\lambda)(3 - \\lambda) - 8 = ${polyTex(FC)}$.`,
        `It factors as $${factorTex(rationalEigen(FC))}$, so the eigenvalues are $${FC_EIG.join('$ and $')}$.`,
      ],
    },

    // 7
    {
      id: 'worked-3x3',
      title: 'A 3×3 example',
      scene(s) {
        const lab = s.tex('A - \\lambda I =', { x: 190, y: 150, size: 36, visible: false });
        const m = s.matrix(lamCell(W3), { x: 480, y: 150, size: 34, visible: false });
        const d1 = s.tex(`\\det(A - \\lambda I) = (${t(W3[0][0])}-\\lambda)\\big[(${t(W3[1][1])}-\\lambda)^2 - ${t(W3[1][2].mul(W3[2][1]))}\\big]`, { x: 480, y: 320, size: 32, visible: false });
        const d2 = s.tex(`= -${factorTex([{ value: W3_LO, mult: 2 }, { value: W3_HI, mult: 1 }])}`, { x: 480, y: 390, size: 32, visible: false });
        const ev = s.tex(`\\lambda = \\col{purple}{${t(W3_LO)}}\\ (\\text{twice}),\\ \\ \\col{purple}{${t(W3_HI)}}`, { x: 480, y: 470, size: 34, visible: false });
        const R = 480;
        const r2 = s.tex(`A - ${t(W3_LO)}I = ${texMat(W3_M2)} \\sim ${texMat(rref(W3_M2).R)}`, { x: R, y: 175, size: 30, visible: false });
        const b2 = s.tex(`E_${t(W3_LO)}:\\ ${W3_E2.map(rowTex).join(',\\ ')}`, { x: R, y: 275, size: 32, color: C.purple, visible: false });
        const r4 = s.tex(`A - ${t(W3_HI)}I = ${texMat(W3_M4)} \\sim ${texMat(rref(W3_M4).R)}`, { x: R, y: 385, size: 30, visible: false });
        const b4 = s.tex(`E_${t(W3_HI)}:\\ ${W3_E4.map(rowTex).join(',\\ ')}`, { x: R, y: 485, size: 32, color: C.purple, visible: false });
        const sp = s.space({ x: 700, y: 330, size: 300, range: 2, yaw: -30, pitch: 18, visible: false });
        const plane = sp.plane(W3_E2[0].map(Number), W3_E2[1].map(Number), { color: C.purple, extent: 1.3, visible: false });
        const line = sp.line([0, 0, 0], W3_E4[0].map(Number), { color: C.purple, width: 4, visible: false });
        const vs = [...W3_E2, ...W3_E4].map((v) => sp.vector(v.map(Number), { color: C.purple, width: 4, visible: false }));
        return { lab, m, d1, d2, ev, r2, b2, r4, b4, sp, plane, line, vs };
      },
      steps: [
        {
          say: 'A three by three example. Row one of $A - \\lambda I${A minus lambda I} has two zeros, so expand the determinant along row one: $2 - \\lambda${two minus lambda} times a two by two determinant.',
          do: async (s, o) => {
            await s.all(o.lab.fadeIn(), o.m.fadeIn());
            await o.m.highlightRow(0, C.yellow);
            await o.d1.write({ duration: 1300 });
          },
        },
        {
          say: 'Simplify: $\\lambda = 2${lambda equals two} is a double root, so its multiplicity is two, and $\\lambda = 4${lambda equals four} is a simple root, multiplicity one.',
          do: async (s, o) => {
            await o.m.clearHighlights();
            await o.d2.write();
            await o.ev.write();
          },
        },
        {
          say: 'For $\\lambda = 2${lambda equals two}, rows two and three of $A - 2I${A minus two I} are the same, so there is one equation and two free variables. That eigenspace is a whole plane.',
          do: async (s, o) => {
            await s.all([o.lab, o.m, o.d1, o.d2].map((x) => x.fadeOut()), o.ev.moveTo(480, 70));
            await o.r2.write({ duration: 1200 });
            await o.b2.write();
          },
        },
        {
          say: 'For $\\lambda = 4${lambda equals four}, $A - 4I${A minus four I} has rank two, one free variable, and the eigenspace is a line through $(0, 1, 1)${zero, one, one}.',
          do: async (s, o) => {
            await o.r4.write({ duration: 1200 });
            await o.b4.write();
          },
        },
        {
          say: 'Here they are in space: a purple plane for $\\lambda = 2${lambda equals two}, and a purple line for $\\lambda = 4${lambda equals four}.',
          do: async (s, o) => {
            await s.all([o.r2, o.r4].map((x) => x.fadeOut()), o.ev.moveTo(250, 130), o.b2.moveTo(250, 240), o.b4.moveTo(250, 330));
            await o.sp.draw();
            await s.all(o.plane.fadeIn({ shift: [0, 0] }), o.vs.slice(0, 2).map((v) => v.grow()));
            await s.all(o.line.draw(), o.vs[2].grow());
            await o.sp.orbit(40, 4000);
          },
        },
      ],
    },

    // 8
    {
      id: 'triangular-zero',
      title: 'Two shortcuts',
      scene(s) {
        const m = s.matrix(TRI, { x: 220, y: 170, size: 40, visible: false });
        const d1 = s.tex('\\det(A - \\lambda I)', { x: 220, y: 340, size: 32, visible: false });
        const d2 = s.tex(`= ${TRI_DIAG.map((d) => `(${t(d)}-\\lambda)`).join('')}`, { x: 220, y: 400, size: 30, visible: false });
        const ev = s.tex(`\\lambda = ${TRI_DIAG.map((d) => `\\col{purple}{${t(d)}}`).join(',\\ ')}`, { x: 220, y: 480, size: 38, visible: false });
        const thm1 = s.defCard({
          x: 680,
          y: 290,
          width: 420,
          kind: 'theorem',
          title: 'Theorem 1',
          body: 'The eigenvalues of a triangular matrix are the entries on its main diagonal.',
          visible: false,
        });
        const card = s.defCard({
          x: 680,
          y: 290,
          kind: 'theorem',
          title: 'Invertible Matrix Theorem (more)',
          tex: '\\begin{aligned} &A \\text{ is invertible} \\\\ \\iff\\ &\\det A \\neq 0 \\\\ \\iff\\ &A\\mathbf x = \\mathbf 0 \\text{ only for } \\mathbf x = \\mathbf 0 \\\\ \\iff\\ &\\part{new}{0 \\text{ is not an eigenvalue}} \\end{aligned}',
          visible: false,
        });
        return { m, d1, d2, ev, thm1, card };
      },
      steps: [
        {
          say: 'First shortcut, Theorem 1. For a triangular matrix, $A - \\lambda I${A minus lambda I} is triangular too, so its determinant is the product down the diagonal. The eigenvalues are just the diagonal entries.',
          do: async (s, o) => {
            await o.m.fadeIn();
            await s.stagger([0, 1, 2].map((i) => () => o.m.pivot(i, i, { color: C.purple })), 300);
            await s.all(o.d1.write(), o.d2.write({ delay: 600 }));
            await o.ev.write();
            await o.thm1.reveal();
          },
        },
        {
          say: 'Second shortcut. $\\lambda = 0${lambda equals zero} is an eigenvalue exactly when $A\\mathbf x = \\mathbf 0${A x equals zero} has a nonzero solution, which means $A${A} is not invertible. So this matrix, with a zero on its diagonal, is singular. That\'s one more line for the Invertible Matrix Theorem.',
          do: async (s, o) => {
            await o.thm1.fadeOut();
            await o.card.reveal();
            await s.all(o.card.color('new', C.purple), s.ring([o.card, 'new'], { color: 'purple', shape: 'box' }));
          },
        },
      ],
    },

    // 9
    {
      id: 'mistake-rowreduce',
      title: 'The trap: row reducing first',
      scene(s) {
        const m = s.matrix(A, { x: 220, y: 190, size: 44 });
        const guess = s.tex(`\\text{eigenvalues } ${WRONG.map((x) => x.tex()).join(',\\ ')}\\,?`, { x: 230, y: 360, size: 36, color: C.yellow, visible: false });
        const chk = s.tex(`\\det(A - ${t(WRONG[0])}I) = \\det${texMat(minusLI(A, WRONG[0]))} = ${t(DET_WRONG)} \\neq 0`, { x: 635, y: 190, size: 30, visible: false });
        const stamp = s.stamp(`${t(WRONG[0])} is not an eigenvalue`, { x: 670, y: 300, color: 'red' });
        const right = s.tex(`\\det(A - \\lambda I) = ${factorTex(ROOTS.map((value) => ({ value, mult: 1 })))}\\ \\Rightarrow\\ \\lambda = ${ROOTS.map((r) => `\\col{purple}{${t(r)}}`).join(',\\ ')}\\ \\col{green}{\\checkmark}`, { x: 480, y: 500, size: 34, visible: false });
        return { m, guess, chk, stamp, right };
      },
      steps: [
        {
          say: 'Here\'s the trap. Triangular matrices are easy, so why not row reduce $A${A} to a triangular matrix and read off its diagonal? That gives $4${four} and three halves.',
          do: async (s, o) => {
            for (const st of FWD) {
              await o.m.rowOp(st, { note: false });
              await o.m.note(st.i, texRowOp(st).replace(/\\tfrac/g, '\\dfrac'));
            }
            await s.all(o.m.pivot(0, 0, { color: C.yellow }), o.m.pivot(1, 1, { color: C.yellow }));
            await o.guess.write();
          },
        },
        {
          say: 'Check it. $A - 4I${A minus four I} has determinant $2${two}, not zero, so $4${four} is not an eigenvalue of $A${A}. Row operations change the eigenvalues.',
          do: async (s, o) => {
            await o.m.note();
            await o.chk.write({ duration: 1200 });
            await o.stamp.slam();
            await s.strike(o.guess, { color: 'red' });
          },
        },
        {
          say: 'The fix: put $A${A} itself into the characteristic equation. Its eigenvalues are $2${two} and $3${three}.',
          do: async (s, o) => {
            await s.all(o.m.clearPivots(), o.m.note());
            await o.m.setRows(A);
            await o.right.write({ duration: 1300 });
          },
        },
      ],
    },

    // 10
    {
      id: 'try-eigval',
      kind: 'try',
      title: 'Your turn',
      say: 'Is $4${four} an eigenvalue of this matrix? You don\'t need the whole characteristic polynomial.',
      prompt: `Is $\\lambda = ${TE_L}$ an eigenvalue of $A = ${texMat(TE)}$?`,
      answer: { type: 'choice', value: TE_IS ? 'yes' : 'no' },
      choices: [
        { id: 'yes', label: 'Yes', why: `Right: $A - ${TE_L}I$ is singular, and $${rowTex(TE_V)}$ is an eigenvector.` },
        { id: 'no', label: 'No', why: `Check whether $A - ${TE_L}I$ is singular: its columns are dependent.` },
      ],
      hint: `Row reduce $A - ${TE_L}I$ and look for a free variable.`,
      solution: [
        `$A - ${TE_L}I = ${texMat(TE_M)}$. ${reduceSteps(TE_M)} The last row is zero, so there is a free variable.`,
        `So $(A - ${TE_L}I)\\mathbf x = \\mathbf 0$ has a nonzero solution, for example $\\mathbf x = ${rowTex(TE_V)}$. Check: $A${rowTex(TE_V)} = ${rowTex(TE_AV)} = ${TE_L}${rowTex(TE_V)}$.`,
        `Yes, $${TE_L}$ is an eigenvalue. (It is the only rational one; the characteristic polynomial $${polyTex(TE)}$ has two more, irrational roots.)`,
      ],
    },

    // 11
    {
      id: 'independent-eigvecs',
      title: 'Distinct eigenvalues, independent eigenvectors',
      scene(s) {
        const card = s.defCard({
          x: 235,
          y: 170,
          width: 400,
          kind: 'theorem',
          title: 'Theorem 2',
          body: 'Eigenvectors $\\mathbf v_1, \\dots, \\mathbf v_r$ for **distinct** eigenvalues $\\lambda_1, \\dots, \\lambda_r$ are linearly independent.',
          visible: false,
        });
        const p = s.plane({ x: 700, y: 290, width: 400, range: [-3, 3, -3, 3], labels: false, visible: false });
        const lines = [EV2, EV3].map((v) => p.span(v.map(Number), { color: C.purple, width: 3, dash: '10 8', visible: false }));
        const vs = [EV2, EV3].map((v, i) => p.vector(v.map(Number), { color: C.purple, label: `\\mathbf v_${i + 1}`, visible: false }));
        const eqs = s.tex(ROOTS.map((r, i) => `A\\mathbf v_${i + 1} = \\col{purple}{${t(r)}}\\,\\mathbf v_${i + 1}`).join(',\\quad '), { x: 240, y: 360, size: 30, visible: false });
        const grid = [];
        for (const k of [-2, -1, 1, 2]) {
          grid.push(p.line({ through: EV2.map((x) => Number(x) * k), dir: EV3.map(Number) }, { color: C.purple, width: 1.5, visible: false }));
          grid.push(p.line({ through: EV3.map((x) => Number(x) * k), dir: EV2.map(Number) }, { color: C.purple, width: 1.5, visible: false }));
        }
        const basis = s.tex('n \\text{ distinct eigenvalues} \\Rightarrow \\text{eigenvector basis}', { x: 480, y: 540, size: 32, color: C.purple, visible: false });
        return { card, p, lines, vs, eqs, grid, basis };
      },
      steps: [
        {
          say: 'Eigenvectors for different eigenvalues can\'t lie on a common line: one gets stretched by $2${two}, the other by $3${three}, so they can\'t be multiples of each other. Theorem 2 says the same holds for any number of them: they are linearly independent.',
          do: async (s, o) => {
            await s.all(o.card.reveal(), o.p.draw({ duration: 800 }));
            await o.eqs.fadeIn();
            await s.all(o.lines.map((l) => l.draw({ duration: 600 })), o.vs.map((v) => v.grow({ delay: 300 })));
          },
        },
        {
          say: 'So an $n \\times n${n by n} matrix with $n${n} distinct eigenvalues has $n${n} independent eigenvectors: a basis of $\\mathbb{R}^n${R n} made of eigenvectors. That\'s the door to the next lecture.',
          do: async (s, o) => {
            await s.all(o.grid.map((g, i) => g.fadeIn({ shift: [0, 0], to: 0.45, delay: i * 50 })));
            await o.basis.write();
          },
        },
      ],
    },

    // 12
    {
      id: 'similarity',
      title: 'Similar matrices',
      scene(s) {
        const hero = s.tex('B = P^{-1}AP', { x: 480, y: 70, size: 44, visible: false });
        const l1 = s.tex('\\det(B - \\lambda I) = \\det\\big(P^{-1}(A - \\lambda I)P\\big)', { x: 480, y: 165, size: 34, visible: false });
        const l2 = s.tex('= \\part{pi}{\\det P^{-1}}\\cdot\\det(A - \\lambda I)\\cdot\\part{p}{\\det P} = \\det(A - \\lambda I)', { x: 480, y: 235, size: 34, visible: false });
        const thm = s.text('**Theorem 4.** Similar matrices have the same characteristic polynomial, so the same eigenvalues.', { x: 480, y: 315, width: 820, size: 30, color: C.purple, visible: false });
        const I2 = identity(2);
        const left = s.tex(`I = ${texMat(I2)}`, { x: 230, y: 430, size: 38, visible: false });
        const right = s.tex(`S = ${texMat(SH)}`, { x: 730, y: 430, size: 38, visible: false });
        const cps = [I2, SH].map((M, i) => s.tex(`\\det(${i ? 'S' : 'I'} - \\lambda I) = ${factorTex(rationalEigen(M))}`, { x: i ? 730 : 230, y: 525, size: 30, visible: false }));
        const stamp = s.stamp('not similar', { x: 480, y: 430, color: 'red' });
        return { hero, l1, l2, thm, left, right, cps, stamp };
      },
      steps: [
        {
          say: '$A${A} and $B${B} are similar when $B = P^{-1}AP${B equals P inverse A P} for some invertible $P${P}. Think of them as the same map, described in two different coordinate systems.',
          do: (s, o) => o.hero.write(),
        },
        {
          say: 'Similar matrices have the same characteristic polynomial. Write $B - \\lambda I${B minus lambda I} as $P^{-1}(A - \\lambda I)P${P inverse, A minus lambda I, P}: the determinants of $P^{-1}${P inverse} and $P${P} cancel. So they share eigenvalues too.',
          do: async (s, o) => {
            await o.l1.write({ duration: 1200 });
            await o.l2.write({ duration: 1400 });
            await s.all(o.l2.color('pi', C.muted), o.l2.color('p', C.muted));
            await s.all(s.strike([o.l2, 'pi']), s.strike([o.l2, 'p']));
            await o.thm.fadeIn();
          },
        },
        {
          say: 'The converse fails. The identity and this shear both have characteristic polynomial $(\\lambda - 1)^2${lambda minus one, squared}: eigenvalue $1${one} with multiplicity two. But the shear has only a line of eigenvectors, and nothing is similar to the identity except the identity itself, because $P^{-1}IP = I${P inverse I P equals I}.',
          do: async (s, o) => {
            await s.all(o.left.fadeIn(), o.right.fadeIn({ delay: 200 }));
            await s.all(o.cps.map((c) => c.write()));
            await o.stamp.slam();
          },
        },
      ],
    },

    // 13
    {
      id: 'wo-eigenspace',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Find a basis for this eigenspace: form $A - \\lambda I${A minus lambda I} and find its null space.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateEigspace,
    },

    // 14
    {
      id: 'cp-eigen',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: 'Explain why $\\lambda$ is an eigenvalue of $A$ exactly when $\\det(A - \\lambda I) = 0$.',
      points: [
        '$\\lambda$ is an eigenvalue iff $A\\mathbf x = \\lambda\\mathbf x$ has a nonzero solution $\\mathbf x$',
        'iff $(A - \\lambda I)\\mathbf x = \\mathbf 0$ has a nontrivial solution',
        'iff $A - \\lambda I$ is not invertible (Invertible Matrix Theorem)',
        'iff $\\det(A - \\lambda I) = 0$',
      ],
    },

    // 15
    {
      id: 'summary-eigen',
      title: 'Summary',
      scene(s) {
        const p = s.plane({ x: 680, y: 310, width: 440, range: [-3, 5, -1, 4], names: ['x_1', 'x_2'] });
        const spans = [V1, V2n].map((v) => p.span(v.map(Number), { color: C.purple, width: 3 }));
        const vs = [V1, V2n].map((v, i) => p.vector(v.map(Number), { color: C.purple, label: `\\mathbf v_${i + 1}` }));
        const x = p.vector(XG.map(Number), { color: C.blue, label: '\\mathbf x' });
        const items = [
          'A\\mathbf v = \\lambda\\mathbf v,\\ \\mathbf v \\neq \\mathbf 0',
          '\\det(A - \\lambda I) = 0',
          'E_\\lambda = \\operatorname{Nul}(A - \\lambda I)',
        ].map((tx, i) => s.tex(tx, { x: 215, y: 160 + 120 * i, size: 32, color: C.purple, visible: false }));
        return { p, spans, vs, x, items };
      },
      steps: [
        {
          say: 'Eigenvectors are the directions a matrix doesn\'t turn: they stay on their own line and only get stretched by the eigenvalue.',
          do: async (s, o) => {
            await o.items[0].write();
            await o.p.applyMatrix(num(A1), { duration: 1600 });
          },
        },
        {
          say: 'Eigenvalues are the roots of the characteristic equation, $\\det(A - \\lambda I) = 0${the determinant of A minus lambda I equals zero}, using $A${A} itself, never a row reduced version.',
          do: (s, o) => o.items[1].write(),
        },
        {
          say: 'And each eigenspace is a null space, $\\operatorname{Nul}(A - \\lambda I)${the null space of A minus lambda I}: find it by row reducing $A - \\lambda I${A minus lambda I}.',
          do: (s, o) => o.items[2].write(),
        },
      ],
    },
  ],
};
