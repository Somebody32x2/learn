/**
 * Lecture 26 · Inner product spaces (Lay 6.7). Design: matrix/PLAN.md § 26.
 * Every inner product, norm, projection coefficient and answer below is computed exactly (frac.js) from the
 * polynomials themselves: evaluation inner products from the value lists, integral inner products on [0, 1] by
 * integrating the product polynomial term by term.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { dot } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- exact polynomials (ascending coefficients)

const P = (...cs) => cs.map((c) => F(c));
const padd = (p, q) => Array.from({ length: Math.max(p.length, q.length) }, (_, i) => (p[i] ?? F(0)).add(q[i] ?? F(0)));
const pscale = (k, p) => p.map((c) => c.mul(k));
const psub = (p, q) => padd(p, pscale(-1, q));
function pmul(p, q) {
  const out = Array.from({ length: p.length + q.length - 1 }, () => F(0));
  p.forEach((a, i) => q.forEach((b, j) => (out[i + j] = out[i + j].add(a.mul(b)))));
  return out;
}
const powF = (x, n) => Array.from({ length: n }, () => x).reduce((a, b) => a.mul(b), F(1));
/** p(x), exactly. */
const pat = (p, x) => p.reduce((s, c, i) => s.add(c.mul(powF(F(x), i))), F(0));
/** ∫₀¹ p(t) dt = Σ cᵢ / (i + 1). */
const int01 = (p) => p.reduce((s, c, i) => s.add(c.div(i + 1)), F(0));
const pnum = (p) => (x) => p.reduce((s, c, i) => s + Number(c) * x ** i, 0);

const SAMPLES = [-1, 0, 1];
const vals = (p) => SAMPLES.map((x) => pat(p, x));
/** Evaluation inner product on P2: the dot product of the value lists at −1, 0, 1. */
const ipE = (p, q) => dot(vals(p), vals(q));
/** Integral inner product on C[0, 1]. */
const ipI = (p, q) => int01(pmul(p, q));

const ONE = P(1), T = P(0, 1), T2 = P(0, 0, 1);

/** Beat 3: under the evaluation inner product. */
const E_1T = ipE(ONE, T); // 0
const E_TT = ipE(T, T); // 2
const E_11 = ipE(ONE, ONE); // 3
/** Beat 4: Gram–Schmidt on 1, t, t². */
const E_T2_1 = ipE(T2, ONE); // 2
const E_T2_T = ipE(T2, T); // 0
const GS2 = psub(psub(T2, pscale(E_T2_1.div(E_11), ONE)), pscale(E_T2_T.div(E_TT), T)); // t² − 2/3
/** Beat 5 (blanks): p = 1 + t, q = t². */
const BP = P(1, 1), BQ = T2;
const B_PQ = ipE(BP, BQ), B_PP = ipE(BP, BP);
const B_D = psub(BP, BQ);
const B_DD = ipE(B_D, B_D); // ‖p − q‖², a distance squared
/** Beat 6: integrals. */
const I_1T = ipI(ONE, T); // 1/2
const I_TT = ipI(T, T); // 1/3
const I_11 = ipI(ONE, ONE); // 1
/** Beat 7 / workout: best approximation of t² by a + bt on [0, 1]. */
const Q1 = psub(T, pscale(I_1T.div(I_11), ONE)); // t − 1/2
const C0 = ipI(T2, ONE).div(I_11); // 1/3
const T2Q1 = ipI(T2, Q1); // 1/12
const Q1Q1 = ipI(Q1, Q1); // 1/12
const C1 = T2Q1.div(Q1Q1); // 1
const BEST = padd(pscale(C0, ONE), pscale(C1, Q1)); // t − 1/6
/** Beat 9: Cauchy–Schwarz numbers. */
const CS_RHS = Math.sqrt(Number(I_11)) * Math.sqrt(Number(I_TT));
/** Beat 11: t³ − t vanishes at −1, 0, 1. */
const CUBIC = P(0, -1, 0, 1);
const CUBIC_VALS = vals(CUBIC);

// ---------------------------------------------------------------- TeX helpers

/** Fractions as \frac: full size on the stage (display mode); text-size inline in markdown. */
const t = (x) => F(x).tex();
/** `t^2 - \tfrac{2}{3}` from ascending coefficients. */
function polyTex(p, v = 't') {
  const terms = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const c = p[i];
    if (c.zero) continue;
    const mon = i === 0 ? '' : i === 1 ? v : `${v}^${i}`;
    const abs = c.abs();
    const coef = mon && abs.eq(1) ? '' : t(abs);
    terms.push({ neg: c.sign() < 0, body: `${coef}${mon}` });
  }
  if (!terms.length) return '0';
  return terms.map((x, k) => (k === 0 ? (x.neg ? '-' : '') + x.body : `${x.neg ? '-' : '+'} ${x.body}`)).join(' ');
}
const paren = (x) => (F(x).sign() < 0 ? `(${t(x)})` : t(x));
const sumTex = (a, b) => a.map((x, i) => `${paren(x)}\\cdot ${paren(b[i])}`).join(' + ');
/** `(-1) + 0 + 1`: the termwise products, for short stage lines. */
const prodTex = (a, b) => a.map((x, i) => paren(F(x).mul(b[i]))).join(' + ');

function paint(tex, name, color) {
  for (const el of tex.part(name)) el.style.color = color;
  return tex;
}
const appear = (mob, opts = {}) => mob.fadeIn({ shift: [0, 0], ...opts });

/** SVG path of y = f(x) on [a, b] in a plane's stage coordinates. */
function curveD(p, f, a, b, n = 80) {
  const pts = Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n).map((x) => p.toStage([x, f(x)]));
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}
/** Closed region between y = f and y = g on [a, b]. */
function regionD(p, f, g, a, b, n = 80) {
  const xs = Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  const top = xs.map((x) => p.toStage([x, f(x)]));
  const bot = xs.reverse().map((x) => p.toStage([x, g(x)]));
  return [...top, ...bot].map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ' Z';
}
const curve = (s, p, f, a, b, opts) => s.path(curveD(p, f, a, b), { width: 4, ...opts });
const region = (s, p, f, g, a, b, color, fill, opts) => s.path(regionD(p, f, g, a, b), { width: 0, color, fill, ...opts });

/** The [0, 1] function plot (beats 6, 7, 12). */
const unitPlot = (s, { x = 715, y = 320, width = 380, visible = false } = {}) =>
  s.plane({ x, y, width, range: [-0.25, 1.25, -0.35, 1.25], labelStep: 0.5, step: 0.25, names: ['t', ''], visible });

// ---------------------------------------------------------------- the lecture

const AXIOMS = [
  '\\langle\\mathbf{u},\\mathbf{v}\\rangle = \\langle\\mathbf{v},\\mathbf{u}\\rangle',
  '\\langle\\mathbf{u}+\\mathbf{v},\\mathbf{w}\\rangle = \\langle\\mathbf{u},\\mathbf{w}\\rangle + \\langle\\mathbf{v},\\mathbf{w}\\rangle',
  '\\langle c\\mathbf{u},\\mathbf{v}\\rangle = c\\langle\\mathbf{u},\\mathbf{v}\\rangle',
  '\\langle\\mathbf{u},\\mathbf{u}\\rangle \\ge 0,\\ \\text{and } = 0 \\text{ only for } \\mathbf{u} = \\mathbf{0}',
];
const CIRCLE = Array.from({ length: 72 }, (_, i) => [Math.cos((i * Math.PI) / 36), Math.sin((i * Math.PI) / 36)]);
const ELLIPSE = CIRCLE.map(([c, sn]) => [c / 2, sn / Math.sqrt(5)]);

export default {
  id: 'inner-product-spaces',
  title: 'Inner product spaces',
  goals: [
    'State the four inner product axioms and check them for examples on ℝⁿ, polynomials and functions',
    'Compute lengths, distances, orthogonality and Gram–Schmidt with a new inner product',
    'Find the best approximation of a function by polynomials; know Cauchy–Schwarz and the triangle inequality',
  ],
  beats: [
    // 1
    {
      id: 'axioms-ip',
      title: 'What an inner product needs',
      scene(s) {
        const o = {};
        o.ax = AXIOMS.map((tx, i) => s.tex(`${i + 1}.\\ ${tx}`, { x: 40, y: 120 + 70 * i, size: 30, anchor: [0, 0.5], visible: false }));
        o.p = s.plane({ x: 750, y: 330, width: 300, range: [-1.4, 1.4, -1.4, 1.4], step: 0.5, labelStep: 1, names: ['u_1', 'u_2'], visible: false });
        o.ghost = o.p.polygon(CIRCLE, { color: C.muted, width: 2, dash: '6 6', fill: 'none', visible: false });
        o.circ = o.p.polygon(CIRCLE, { color: C.blue, width: 4, visible: false });
        o.e1 = o.p.vector([1, 0], { color: C.green, width: 5, visible: false });
        o.dotLab = s.tex('\\mathbf{u}\\cdot\\mathbf{v}:\\ \\|\\mathbf{u}\\| = 1', { x: 710, y: 100, size: 32, color: C.blue, visible: false });
        o.wLab = s.tex('\\langle\\mathbf{u},\\mathbf{v}\\rangle = 4u_1v_1 + 5u_2v_2', { x: 710, y: 100, size: 32, color: C.green, visible: false });
        o.len = s.tex('\\|\\mathbf{e}_1\\| = 2,\\ \\text{so } \\|(\\frac{1}{2}, 0)\\| = 1', { x: 710, y: 540, size: 30, color: C.green, visible: false });
        return o;
      },
      steps: [
        {
          say: 'The dot product is one inner product, but not the only one. Any rule that pairs two vectors into a number and has these four properties counts: symmetry, additivity, pulling out scalars, and positivity.',
          do: async (s, o) => {
            await s.stagger(o.ax.map((a) => () => a.write({ duration: 800 })), 900);
            await s.all(o.p.draw(), o.dotLab.fadeIn());
            await s.all(o.circ.draw({ duration: 900 }), o.e1.grow());
          },
        },
        {
          say: 'Try a weighted dot product: $4u_1v_1 + 5u_2v_2${four u one v one plus five u two v two}. It satisfies all four, but it changes what length one looks like. The unit circle squashes into an ellipse.',
          do: async (s, o) => {
            await s.all(o.dotLab.fadeOut(), o.wLab.fadeIn(), appear(o.ghost));
            await s.all(o.circ.morphTo(ELLIPSE, { duration: 1500 }), o.circ.recolor(C.green), o.e1.moveTo([0.5, 0], { duration: 1500 }));
            await o.len.fadeIn();
          },
        },
        {
          say: 'The fourth rule is the one that fails most often. Positivity says every nonzero vector has positive length, so lengths and distances make sense.',
          do: async (s, o) => {
            await s.ring(o.ax[3], { color: 'yellow', shape: 'box' });
          },
        },
      ],
    },

    // 2
    {
      id: 'try-is-ip',
      kind: 'try',
      title: 'Your turn',
      say: 'Which of these is really an inner product? Test positivity on the standard basis vectors.',
      prompt: 'Which formula is an inner product on $\\mathbb{R}^2$?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '$4u_1v_1 + 5u_2v_2$', why: 'Right: symmetric, linear in each slot, and $\\langle\\mathbf{u},\\mathbf{u}\\rangle = 4u_1^2 + 5u_2^2 > 0$ unless $\\mathbf{u} = \\mathbf{0}$.' },
        { id: 'b', label: '$u_1v_1 - u_2v_2$', why: '$\\langle\\mathbf{e}_2,\\mathbf{e}_2\\rangle = -1 < 0$: positivity fails.' },
        { id: 'c', label: '$u_1v_2 + u_2v_1$', why: '$\\langle\\mathbf{e}_1,\\mathbf{e}_1\\rangle = 0$ with $\\mathbf{e}_1 \\neq \\mathbf{0}$: positivity fails.' },
      ],
      hint: 'All three are symmetric and linear. Compute $\\langle\\mathbf{e}_1,\\mathbf{e}_1\\rangle$ and $\\langle\\mathbf{e}_2,\\mathbf{e}_2\\rangle$ for each.',
      solution: [
        'Each formula is symmetric and linear in each slot, so only positivity can fail.',
        'For $u_1v_1 - u_2v_2$: $\\langle\\mathbf{e}_2,\\mathbf{e}_2\\rangle = -1$. For $u_1v_2 + u_2v_1$: $\\langle\\mathbf{e}_1,\\mathbf{e}_1\\rangle = 0$ although $\\mathbf{e}_1 \\ne \\mathbf{0}$.',
        'For $4u_1v_1 + 5u_2v_2$: $\\langle\\mathbf{u},\\mathbf{u}\\rangle = 4u_1^2 + 5u_2^2$, which is positive unless $u_1 = u_2 = 0$. Only (a) is an inner product.',
      ],
    },

    // 3
    {
      id: 'ip-polys',
      title: 'An inner product on polynomials',
      scene(s) {
        const o = {};
        o.def = s.tex('\\langle p,q\\rangle = p(-1)q(-1) + p(0)q(0) + p(1)q(1)', { x: 480, y: 60, size: 32, visible: false });
        o.p = s.plane({ x: 230, y: 330, width: 340, range: [-1.6, 1.6, -1.6, 1.6], labelStep: 1, step: 0.5, names: ['t', ''], visible: false });
        o.l1 = o.p.line({ a: 0, b: 1, c: 1 }, { color: C.blue, width: 4, visible: false });
        o.lt = o.p.line({ a: -1, b: 1, c: 0 }, { color: C.red, width: 4, visible: false });
        o.d1 = SAMPLES.map((x) => o.p.point([x, 1], { color: C.blue, r: 9, visible: false }));
        o.dt = SAMPLES.map((x) => o.p.point([x, x], { color: C.red, r: 9, visible: false }));
        o.lab1 = s.tex('1', { x: 0, y: 0, size: 32, color: C.blue, visible: false });
        o.labt = s.tex('t', { x: 0, y: 0, size: 32, color: C.red, visible: false });
        const [ax, ay] = o.p.toStage([-1.4, 1.25]);
        o.lab1.set({ x: ax + 14, y: ay - 6 });
        const [bx, by] = o.p.toStage([0.75, 1.3]);
        o.labt.set({ x: bx, y: by });
        const crow = (p, c) => vals(p).map((v) => `\\col{${c}}{${t(v)}}`).join(' & ');
        o.table = s.tex(`\\begin{array}{c|ccc} & t=-1 & t=0 & t=1 \\\\ \\hline \\col{blue}{1} & ${crow(ONE, 'blue')} \\\\ \\col{red}{t} & ${crow(T, 'red')} \\end{array}`, { x: 690, y: 190, size: 32, visible: false });
        o.c1 = s.tex(`\\langle 1, t\\rangle = ${prodTex(vals(ONE), vals(T))} = \\part{z}{${t(E_1T)}}`, { x: 690, y: 330, size: 32, visible: false });
        paint(o.c1, 'z', C.green);
        o.c2 = s.tex(`\\|t\\|^2 = ${t(E_TT)},\\quad \\|1\\|^2 = ${t(E_11)}`, { x: 690, y: 400, size: 30, visible: false });
        o.pos = s.text('A nonzero quadratic has at most 2 roots, so $\\langle p,p\\rangle > 0$ on $\\mathbb{P}_2$.', { x: 690, y: 500, size: 30, width: 400, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Now the vectors are polynomials. To pair two of them, evaluate both at $-1${minus one}, $0${zero} and $1${one}, and take the dot product of the two value lists.',
          do: async (s, o) => {
            await o.def.write({ duration: 1200 });
            await o.p.draw();
            await s.all(o.l1.draw(), o.lt.draw(), o.lab1.fadeIn({ delay: 500 }), o.labt.fadeIn({ delay: 500 }));
            await s.stagger([...o.d1, ...o.dt].map((d) => () => d.draw()), 150);
            await o.table.write({ duration: 1200 });
          },
        },
        {
          say: 'Is it positive? $\\langle p, p\\rangle${the inner product of p with itself} is a sum of squares, so it can only be zero if $p${p} vanishes at all three points. A nonzero polynomial of degree at most two can\'t do that.',
          do: (s, o) => o.pos.fadeIn(),
        },
        {
          say: 'Under this inner product, $1${one} and $t${t} are orthogonal: minus one, plus zero, plus one is zero. And $\\|t\\|^2 = 2${the squared length of t is two}, while $\\|1\\|^2 = 3${the squared length of one is three}.',
          do: async (s, o) => {
            await o.c1.write();
            await s.ring([o.c1, 'z'], { color: 'green' });
            await o.c2.write();
          },
        },
      ],
    },

    // 4
    {
      id: 'gs-polys',
      title: 'Gram–Schmidt on 1, t, t²',
      scene(s) {
        const o = {};
        o.p = s.plane({ x: 230, y: 320, width: 340, range: [-1.6, 1.6, -1.6, 1.6], labelStep: 1, step: 0.5, names: ['t', ''], visible: false });
        o.sq = curve(s, o.p, pnum(T2), -1.25, 1.25, { color: C.muted, dash: '7 6', visible: false });
        o.g = curve(s, o.p, pnum(GS2), -1.5, 1.5, { color: C.green, visible: false });
        o.dots = SAMPLES.map((x) => o.p.point([x, Number(pat(GS2, x))], { color: C.green, r: 9, visible: false }));
        o.vlab = s.tex(`\\text{values } (${vals(GS2).map(t).join(',\\ ')})`, { x: 230, y: 530, size: 30, color: C.green, visible: false });
        o.l0 = s.tex('p_0 = 1,\\quad p_1 = t', { x: 690, y: 80, size: 34, visible: false });
        o.l2 = s.tex('p_2 = t^2 - \\frac{\\langle t^2, 1\\rangle}{\\langle 1, 1\\rangle}\\,1 - \\frac{\\langle t^2, t\\rangle}{\\langle t, t\\rangle}\\,t', { x: 690, y: 175, size: 32, visible: false });
        o.l3 = s.tex(`= t^2 - \\frac{${t(E_T2_1)}}{${t(E_11)}}\\,1 - \\frac{${t(E_T2_T)}}{${t(E_TT)}}\\,t`, { x: 690, y: 275, size: 32, visible: false });
        o.l4 = s.tex(`= \\part{r}{${polyTex(GS2)}}`, { x: 690, y: 360, size: 36, visible: false });
        paint(o.l4, 'r', C.green);
        o.basis = s.tex(`\\{\\,1,\\ t,\\ ${polyTex(GS2)}\\,\\}`, { x: 690, y: 470, size: 36, color: C.green, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Gram–Schmidt works in any inner product space, with the same formula. Start from $1${one}, $t${t}, $t^2${t squared}. The first two are already orthogonal, so keep them.',
          do: async (s, o) => {
            await o.l0.write();
            await o.l2.write({ duration: 1400 });
          },
        },
        {
          say: 'We need two inner products: $\\langle t^2, 1\\rangle = 2${the inner product of t squared and one is two}, and $\\langle t^2, t\\rangle = 0${the inner product of t squared and t is zero}. So subtract two thirds.',
          do: async (s, o) => {
            await o.l3.write({ duration: 1200 });
            await o.l4.write();
            await o.p.draw();
            await o.sq.draw();
            await o.g.draw({ duration: 1000 });
          },
        },
        {
          say: 'The result is $t^2 - \\tfrac{2}{3}${t squared minus two thirds}. Its values at the three points are a third, minus two thirds, and a third, and those are orthogonal to the value lists of $1${one} and $t${t}. So $1${one}, $t${t}, $t^2 - \\tfrac{2}{3}${t squared minus two thirds} is an orthogonal basis.',
          do: async (s, o) => {
            await s.stagger(o.dots.map((d) => () => d.draw()), 250);
            await o.vlab.fadeIn();
            await o.basis.write();
          },
        },
      ],
    },

    // 5
    {
      id: 'fill-ip',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Same evaluation inner product, at minus one, zero and one. Compute an inner product, a length, and a distance.',
      prompt: 'Use $\\langle p,q\\rangle = p(-1)q(-1)+p(0)q(0)+p(1)q(1)$ on $\\mathbb{P}_2$.',
      lines: [
        [`p = ${polyTex(BP)},\\quad q = ${polyTex(BQ)}`],
        ['\\langle p, q\\rangle = ', { id: 'pq', answer: { type: 'number', value: String(B_PQ) } }],
        ['\\|p\\|^2 = ', { id: 'pp', answer: { type: 'number', value: String(B_PP) } }],
        ['\\|p - q\\|^2 = ', { id: 'dd', answer: { type: 'number', value: String(B_DD) }, hint: 'Subtract the value lists first, then dot the difference with itself.' }],
      ],
      solution: [
        `The values of $p$ at $-1, 0, 1$ are $(${vals(BP).map(t).join(', ')})$; the values of $q$ are $(${vals(BQ).map(t).join(', ')})$.`,
        `$\\langle p, q\\rangle = ${sumTex(vals(BP), vals(BQ))} = ${t(B_PQ)}$ and $\\|p\\|^2 = ${sumTex(vals(BP), vals(BP))} = ${t(B_PP)}$.`,
        `$p - q = ${polyTex(B_D)}$ has values $(${vals(B_D).map(t).join(', ')})$, so $\\|p - q\\|^2 = ${sumTex(vals(B_D), vals(B_D))} = ${t(B_DD)}$: the distance from $p$ to $q$ is $\\sqrt{${t(B_DD)}}$.`,
      ],
    },

    // 6
    {
      id: 'ip-functions',
      title: 'Functions: integrals',
      scene(s) {
        const o = {};
        o.p = unitPlot(s);
        o.f1 = curve(s, o.p, () => 1, 0, 1, { color: C.blue, visible: false });
        o.ft = curve(s, o.p, (x) => x, 0, 1, { color: C.red, visible: false });
        o.area1 = region(s, o.p, (x) => x, () => 0, 0, 1, C.green, s.FILL.green, { visible: false });
        o.ft2 = curve(s, o.p, (x) => x * x, 0, 1, { color: C.orange, visible: false });
        o.area2 = region(s, o.p, (x) => x * x, () => 0, 0, 1, C.orange, s.FILL.orange, { visible: false });
        o.def = s.tex('\\langle f, g\\rangle = \\int_0^1 f(t)\\,g(t)\\,dt', { x: 260, y: 100, size: 34, visible: false });
        o.sub = s.text('on $C[0,1]$: multiply, then integrate', { x: 260, y: 175, size: 30, color: C.muted, visible: false });
        o.c1 = s.tex(`\\langle 1, t\\rangle = \\int_0^1 t\\,dt = \\part{v}{${t(I_1T)}}`, { x: 260, y: 280, size: 32, visible: false });
        paint(o.c1, 'v', C.green);
        o.c2 = s.tex(`\\|t\\|^2 = \\int_0^1 t^2\\,dt = \\part{v}{${t(I_TT)}}`, { x: 260, y: 400, size: 32, visible: false });
        paint(o.c2, 'v', C.orange);
        o.not = s.text('Here $1$ and $t$ are **not** orthogonal.', { x: 260, y: 510, size: 30, color: C.yellow, visible: false });
        return o;
      },
      steps: [
        {
          say: 'For continuous functions on an interval, replace the sum by an integral: multiply the two functions point by point, and add up with an integral. It\'s a continuous dot product.',
          do: async (s, o) => {
            await o.def.write();
            await o.sub.fadeIn();
            await o.p.draw();
            await s.all(o.f1.draw(), o.ft.draw());
          },
        },
        {
          say: 'Pair $1${one} with $t${t}: the product is $t${t}, and the area under it is one half. So here $1${one} and $t${t} are not orthogonal. Same for length: $\\|t\\|^2${the squared length of t} is the area under $t^2${t squared}, one third.',
          do: async (s, o) => {
            await appear(o.area1, { duration: 700 });
            await o.c1.write();
            await o.not.fadeIn();
            await s.all(o.area1.fadeOut(), o.f1.animate({ opacity: 0.3 }));
            await s.all(o.ft2.draw(), appear(o.area2, { delay: 400 }));
            await o.c2.write();
          },
        },
      ],
    },

    // 7
    {
      id: 'best-approx-fn',
      title: 'Best approximation of a function',
      scene(s) {
        const o = {};
        o.p = unitPlot(s);
        o.par = curve(s, o.p, pnum(T2), -0.2, 1.1, { color: C.blue, visible: false });
        o.gap = region(s, o.p, pnum(T2), pnum(BEST), 0, 1, C.yellow, s.FILL.yellow, { visible: false });
        o.line = curve(s, o.p, pnum(BEST), -0.05, 1.2, { color: C.green, visible: false });
        o.parLab = s.tex('t^2', { x: 0, y: 0, size: 32, color: C.blue, visible: false });
        const [px, py] = o.p.toStage([1.05, 1.1]);
        o.parLab.set({ x: px - 36, y: py });
        o.l1 = s.tex(`\\text{orthogonal basis: } \\{1,\\ ${polyTex(Q1)}\\}`, { x: 260, y: 85, size: 30, visible: false });
        o.l2 = s.tex(`\\langle t^2, 1\\rangle = ${t(ipI(T2, ONE))},\\quad \\langle t^2, ${polyTex(Q1)}\\rangle = ${t(T2Q1)}`, { x: 260, y: 175, size: 30, visible: false });
        o.l3 = s.tex(`\\|${polyTex(Q1)}\\|^2 = ${t(Q1Q1)}`, { x: 260, y: 258, size: 30, visible: false });
        o.l4 = s.tex(`\\hat f = ${t(C0)}\\cdot 1 + ${t(C1)}\\cdot\\left(${polyTex(Q1)}\\right)`, { x: 260, y: 343, size: 32, visible: false });
        o.l5 = s.tex(`= \\part{r}{${polyTex(BEST)}}`, { x: 260, y: 437, size: 36, visible: false });
        paint(o.l5, 'r', C.green);
        o.ls = s.tex('\\text{minimizes } \\int_0^1 (t^2 - a - bt)^2\\,dt', { x: 260, y: 530, size: 30, color: C.muted, visible: false });
        return o;
      },
      steps: [
        {
          say: 'What straight line is closest to $t^2${t squared} on the interval from zero to one? That\'s a projection onto the span of $1${one} and $t${t}. First make that basis orthogonal: $1${one} and $t - \\tfrac{1}{2}${t minus one half}.',
          do: async (s, o) => {
            await o.p.draw();
            await s.all(o.par.draw(), o.parLab.fadeIn({ delay: 600 }));
            await o.l1.write();
          },
        },
        {
          say: 'Project with the usual formula, using integrals for every inner product. The coefficients come out to a third and one, so the best line is $t - \\tfrac{1}{6}${t minus one sixth}.',
          do: async (s, o) => {
            await s.all(o.l2.write(), o.l3.fadeIn({ delay: 500 }));
            await o.l4.write();
            await o.l5.write();
            await o.line.draw({ duration: 1100 });
          },
        },
        {
          say: 'The yellow gap is what\'s left over. Square the gap and integrate, $\\int_0^1 (t^2 - a - bt)^2\\,dt${the integral of the squared gap}: no other line makes that smaller. It\'s least squares again, with integrals instead of sums.',
          do: async (s, o) => {
            await appear(o.gap, { duration: 800 });
            await o.ls.fadeIn();
          },
        },
      ],
    },

    // 8
    {
      id: 'mistake-ip-depends',
      title: 'The trap: orthogonal with respect to what?',
      scene(s) {
        const o = {};
        o.pa = s.plane({ x: 250, y: 285, width: 280, range: [-1.5, 1.5, -1.5, 1.5], labels: false, step: 0.5, names: ['t', ''], visible: false });
        o.da = SAMPLES.map((x) => o.pa.point([x, x], { color: C.red, r: 9, visible: false }));
        o.db = SAMPLES.map((x) => o.pa.point([x, 1], { color: C.blue, r: 9, visible: false }));
        o.pb = s.plane({ x: 710, y: 285, width: 280, range: [-0.25, 1.25, -0.25, 1.25], labels: false, step: 0.25, names: ['t', ''], visible: false });
        o.area = region(s, o.pb, (x) => x, () => 0, 0, 1, C.yellow, s.FILL.yellow, { visible: false });
        o.ta = s.tex(`\\langle 1, t\\rangle = ${prodTex(vals(ONE), vals(T))} = ${t(E_1T)}`, { x: 250, y: 475, size: 30, visible: false });
        o.tb = s.tex(`\\langle 1, t\\rangle = \\int_0^1 1\\cdot t\\,dt = ${t(I_1T)}`, { x: 710, y: 475, size: 30, visible: false });
        o.sa = s.stamp('orthogonal', { x: 250, y: 85, color: 'green' });
        o.sb = s.stamp('not orthogonal', { x: 710, y: 85, color: 'yellow' });
        o.moral = s.text('Always say which inner product.', { x: 480, y: 548, size: 30, weight: 600, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Here\'s the trap. Are $1${one} and $t${t} orthogonal? With the evaluation inner product at three points, yes: the values multiply and sum to zero.',
          do: async (s, o) => {
            await o.pa.draw();
            await s.stagger([...o.db, ...o.da].map((d) => () => d.draw()), 120);
            await o.ta.write();
            await o.sa.slam();
          },
        },
        {
          say: 'With the integral on zero to one, no: the inner product is one half. Same two functions, different answer. Orthogonality is a property of the pair and the inner product, so always say which one you\'re using.',
          do: async (s, o) => {
            await o.pb.draw();
            await appear(o.area);
            await o.tb.write();
            await o.sb.slam();
            await o.moral.fadeIn();
          },
        },
      ],
    },

    // 9
    {
      id: 'inequalities',
      title: 'Cauchy–Schwarz and the triangle inequality',
      scene(s) {
        const o = {};
        o.cs = s.tex('|\\langle\\mathbf{u},\\mathbf{v}\\rangle| \\le \\|\\mathbf{u}\\|\\,\\|\\mathbf{v}\\|', { x: 480, y: 90, size: 42, visible: false });
        o.tri = s.tex('\\|\\mathbf{u} + \\mathbf{v}\\| \\le \\|\\mathbf{u}\\| + \\|\\mathbf{v}\\|', { x: 480, y: 170, size: 42, visible: false });
        o.chk = s.tex(`\\langle 1, t\\rangle = ${t(I_1T)} \\ \\le\\ \\|1\\|\\,\\|t\\| = 1\\cdot\\tfrac{1}{\\sqrt{3}} \\approx ${CS_RHS.toFixed(3)}`, { x: 480, y: 280, size: 34, visible: false });
        const L = 600, x0 = 180;
        o.barA = s.rect(x0, 350, L * Number(I_1T), 40, { color: C.green, fill: s.FILL.green, width: 2, visible: false });
        o.barB = s.rect(x0, 410, L * CS_RHS, 40, { color: C.blue, fill: s.FILL.blue, width: 2, visible: false });
        o.la = s.tex('\\langle 1, t\\rangle', { x: x0 - 20, y: 370, size: 30, anchor: [1, 0.5], color: C.green, visible: false });
        o.lb = s.tex('\\|1\\|\\|t\\|', { x: x0 - 20, y: 430, size: 30, anchor: [1, 0.5], color: C.blue, visible: false });
        o.angle = s.tex(`\\cos\\theta = \\frac{\\langle 1, t\\rangle}{\\|1\\|\\,\\|t\\|} = \\frac{\\sqrt{3}}{2} \\ \\Rightarrow\\ \\theta = 30^\\circ`, { x: 480, y: 515, size: 32, color: C.purple, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Two facts from $\\mathbb{R}^n${R n} hold in every inner product space: the Cauchy–Schwarz inequality, and the triangle inequality.',
          do: async (s, o) => {
            await o.cs.write();
            await o.tri.write();
          },
        },
        {
          say: 'Check it with $1${one} and $t${t} on zero to one: one half is at most one times one over root three, about point five seven seven.',
          do: async (s, o) => {
            await o.chk.write({ duration: 1200 });
            await s.all(o.barA.draw(), o.la.fadeIn());
            await s.all(o.barB.draw(), o.lb.fadeIn());
          },
        },
        {
          say: 'Because the ratio is between minus one and one, we can call it a cosine. That\'s how we talk about the angle between two functions: here, thirty degrees.',
          do: (s, o) => o.angle.write(),
        },
      ],
    },

    // 10
    {
      id: 'wo-best-line',
      kind: 'workout',
      title: 'Work it out',
      say: 'Your turn to do the whole computation. Find the best straight-line approximation to $t^2${t squared} on zero to one.',
      prompt: 'In $C[0,1]$ with $\\langle f,g\\rangle = \\int_0^1 f(t)g(t)\\,dt$, find the best approximation to $f(t) = t^2$ by a function $a + bt$. Enter $(a, b)$.',
      answer: { type: 'vector', value: [String(BEST[0]), String(BEST[1])] },
      hints: [
        `Orthogonal basis of $\\operatorname{Span}\\{1, t\\}$: $\\{1,\\ ${polyTex(Q1)}\\}$, with $\\|${polyTex(Q1)}\\|^2 = ${t(Q1Q1)}$.`,
        `$\\langle t^2, 1\\rangle = ${t(ipI(T2, ONE))}$ and $\\langle t^2, ${polyTex(Q1)}\\rangle = \\tfrac14 - \\tfrac16 = ${t(T2Q1)}$.`,
      ],
      solution: [
        `Gram–Schmidt on $1, t$: $\\langle t, 1\\rangle = ${t(I_1T)}$ and $\\langle 1, 1\\rangle = ${t(I_11)}$, so the second basis vector is $${polyTex(Q1)}$, with $\\|${polyTex(Q1)}\\|^2 = \\int_0^1 (${polyTex(Q1)})^2\\,dt = ${t(Q1Q1)}$.`,
        `$\\hat f = \\frac{\\langle t^2, 1\\rangle}{\\langle 1, 1\\rangle}\\,1 + \\frac{\\langle t^2, ${polyTex(Q1)}\\rangle}{\\|${polyTex(Q1)}\\|^2}(${polyTex(Q1)}) = ${t(C0)} + ${t(C1)}\\,(${polyTex(Q1)}) = ${polyTex(BEST)}$.`,
        `So $(a, b) = (${t(BEST[0])}, ${t(BEST[1])})$. Check with the normal equations: $\\langle t^2 - a - bt, 1\\rangle = \\tfrac13 - a - \\tfrac b2 = 0$ and $\\langle t^2 - a - bt, t\\rangle = \\tfrac14 - \\tfrac a2 - \\tfrac b3 = 0$ both hold.`,
      ],
    },

    // 11
    {
      id: 'cp-ip',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the summary, explain why the evaluation rule works on quadratics but not on cubics.',
      prompt: 'Why does $\\langle p,q\\rangle = p(-1)q(-1) + p(0)q(0) + p(1)q(1)$ give an inner product on $\\mathbb{P}_2$ but not on $\\mathbb{P}_3$?',
      points: [
        'Symmetry and linearity are inherited from the dot product of the value lists $(p(-1), p(0), p(1))$.',
        'Positivity needs $\\langle p,p\\rangle = 0 \\Rightarrow p = 0$, and $\\langle p,p\\rangle$ is a sum of squares of the three values.',
        'A nonzero polynomial of degree at most 2 has at most 2 roots, so it cannot vanish at all three points.',
        `A cubic like $${polyTex(CUBIC)}$ has values $(${CUBIC_VALS.map(t).join(', ')})$ at $-1, 0, 1$, so $\\langle p,p\\rangle = 0$ with $p \\ne 0$: positivity fails on $\\mathbb{P}_3$.`,
      ],
    },

    // 12
    {
      id: 'summary-ips',
      title: 'Summary',
      scene(s) {
        const o = {};
        o.p = unitPlot(s, { x: 690, y: 310, width: 400 });
        o.par = curve(s, o.p, pnum(T2), -0.2, 1.1, { color: C.blue, visible: false });
        o.line = curve(s, o.p, pnum(BEST), -0.05, 1.2, { color: C.green, visible: false });
        o.gap = region(s, o.p, pnum(T2), pnum(BEST), 0, 1, C.yellow, s.FILL.yellow, { visible: false });
        o.items = [
          'An inner product: symmetric, linear, **positive**.',
          'Length, distance, orthogonality follow from it.',
          'Projection, Gram–Schmidt and least squares carry over.',
        ].map((txt, i) => s.text(txt, { x: 250, y: 160 + 120 * i, size: 30, width: 400, align: 'left', visible: false }));
        return o;
      },
      steps: [
        {
          say: 'An inner product is any pairing that behaves like the dot product: symmetric, linear, and positive. Once you have one, you get lengths, distances and orthogonality.',
          do: async (s, o) => {
            await o.items[0].fadeIn();
            await o.items[1].fadeIn();
          },
        },
        {
          say: 'And every geometric tool comes along for the ride: projections, Gram–Schmidt and least squares, now for polynomials and functions. Like the best line through a parabola.',
          do: async (s, o) => {
            await o.items[2].fadeIn();
            await o.p.draw();
            await o.par.draw();
            await s.all(o.line.draw(), appear(o.gap, { delay: 600 }));
          },
        },
      ],
    },
  ],
};
