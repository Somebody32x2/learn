/**
 * Lecture 18 · Difference equations and Markov chains (Lay 4.8–4.9). Design: matrix/PLAN.md § 18.
 * Every matrix, state vector, steady state and answer below is computed with core/linalg.js.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, mulVec, sub, identity, scale, rref, det, nullspace, eqVec, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- helpers

const t = (x) => F(x).tex({ inline: true });
/** Decimal TeX (0.9); in a matrix cell the dot is braced so the cell stays TeX instead of becoming a fraction. */
const dec = (x) => String(+Number(x).toFixed(4));
const decCell = (x) => dec(x).replace('.', '{.}');
const decMat = (A) => `\\begin{bmatrix}${A.map((r) => r.map(dec).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
const decVec = (v) => decMat(v.map((x) => [x]));
const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];
const gcd = (a, b) => (b ? gcd(b, a % b) : a < 0n ? -a : a);

/** Fades matrix cells in or out on the stage clock. */
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

/** The positive integer vector on the line through v (v has a nonzero entry). */
function integerize(v) {
  const l = v.reduce((a, x) => (a * x.d) / gcd(a, x.d), 1n);
  let w = v.map((x) => x.mul(F(l)).n);
  const g = w.reduce((a, x) => gcd(a, x), 0n);
  w = w.map((x) => x / g);
  if (w.some((x) => x < 0n)) w = w.map((x) => -x);
  return w.map((x) => F(x));
}

/** Steady state of a column-stochastic P with a one-dimensional Nul(P − I): the probability vector in it. */
function steady(P) {
  const w = integerize(nullspace(sub(P, identity(P.length)))[0]);
  const sum = w.reduce((a, x) => a.add(x), F(0));
  return { w, sum, q: w.map((x) => x.div(sum)) };
}

// ---------------------------------------------------------------- data

/** Beats 1–3: the recurrence y_{k+2} − 5y_{k+1} + 6y_k = 0 and its basic solutions. */
const REC = [1, -5, 6];
const RATES = [2, 3];
const SIG = RATES.map((r) => [0, 1, 2, 3, 4].map((k) => r ** k));
const SUMSIG = SIG[0].map((v, k) => v + SIG[1][k]);
const plug = (r) => REC.map((c, i) => c * r ** (2 - i));
const CAS = mat([[SIG[0][0], SIG[1][0]], [SIG[0][1], SIG[1][1]]]);
const CAS_DET = det(CAS);
const ALT = plug(-1).reduce((a, b) => a + b, 0); // (−1)^k: factor 1 + 5 + 6
const AUX_TEX = `r^2 ${REC[1] < 0 ? '-' : '+'} ${Math.abs(REC[1])}r ${REC[2] < 0 ? '-' : '+'} ${Math.abs(REC[2])}`;
if (!RATES.every((r) => plug(r).reduce((a, b) => a + b, 0) === 0)) throw new Error('rates are not roots');

/** Beats 4–9: city / suburbs. */
const P = mat([['0.9', '0.2'], ['0.1', '0.8']]);
const PCELLS = P.map((r) => r.map(decCell));
const X0 = vec(['0.5', '0.5']);
const STATES = [X0];
for (let k = 1; k <= 20; k++) STATES.push(mulVec(P, STATES[k - 1]));
const ST = steady(P);
const PmI = sub(P, identity(2));
const PmI10 = scale(F(10), PmI);
const RED10 = rref(PmI10);

/** Theorem 18 beat: three different starts, iterated. */
const STARTS = [vec([1, 0]), vec([0, 1]), vec(['0.2', '0.8'])];
const RUNS = STARTS.map((x) => {
  const out = [x];
  for (let k = 1; k <= 12; k++) out.push(mulVec(P, out[k - 1]));
  return out;
});

/** Mistake beat: Pᵀ (rows sum to 1) applied to "everyone in the city". */
const PT = P[0].map((_, j) => P.map((r) => r[j]));
const ALL_CITY = vec([1, 0]);
const BAD = mulVec(PT, ALL_CITY);
const GOOD = mulVec(P, ALL_CITY);
const sumOf = (v) => v.reduce((a, x) => a.add(x), F(0));

/** Fill-in: a second chain. */
const P2 = mat([['0.7', '0.4'], ['0.3', '0.6']]);
const ST2 = steady(P2);

/** Try: which is stochastic? */
const CANDS = {
  a: mat([['0.5', '0.3'], ['0.5', '0.6']]),
  b: mat([['0.2', 1], ['0.8', 0]]),
  c: mat([['0.6', '0.4'], ['0.6', '0.4']]),
};
const isStochastic = (A) => A[0].every((_, j) => sumOf(A.map((r) => r[j])).eq(1)) && A.every((r) => r.every((x) => x.sign() >= 0));
const STOCH = Object.keys(CANDS).filter((k) => isStochastic(CANDS[k]));
const colSums = (A) => A[0].map((_, j) => dec(sumOf(A.map((r) => r[j]))));

// ---------------------------------------------------------------- workout

/** Steady state of a 3×3 tenths matrix: prompt, answer, hints, worked solution. */
function steadyItem(P0) {
  const Pm = mat(P0);
  const M = scale(F(10), sub(Pm, identity(3)));
  const R = rref(M).R;
  const { w, sum, q } = steady(Pm);
  const free = (i) => R[i][2].neg();
  const coef = (c) => (c.eq(1) ? '' : t(c));
  if (!eqVec(mulVec(Pm, q), q)) throw new Error('steady state check failed');
  return {
    prompt: `Find the steady-state vector of $$P = ${decMat(Pm)}.$$ Enter the entries of $\\mathbf q$ as fractions a/b.`,
    answer: { type: 'vector', value: q.map(String) },
    hints: [
      `Solve $(P - I)\\mathbf x = \\mathbf 0$. Multiply $P - I$ by 10 to clear decimals: $${texMat(M)}$.`,
      `The null space is spanned by $(${w.join(', ')})$. Now scale it so its entries add up to $1$.`,
    ],
    solution: [
      `A steady state satisfies $P\\mathbf q = \\mathbf q$, so solve $(P - I)\\mathbf x = \\mathbf 0$. Ten times $P - I$ is $${texMat(M)}$.`,
      `Row reduce: ${rref(M).steps.map((st) => `$${texRowOp(st)}$ gives $${texMat(st.after)}$`).join('; ')}.`,
      `So $x_1 = ${coef(free(0))}x_3$ and $x_2 = ${coef(free(1))}x_3$ with $x_3$ free. Taking $x_3 = ${w[2]}$ gives the integer null vector $(${w.join(', ')})$.`,
      `Its entries add to $${sum}$, so $\\mathbf q = \\tfrac{1}{${sum}}(${w.join(', ')}) = ${texVec(q)}$.`,
      `Check: $P\\mathbf q = \\mathbf q$ (each entry of $P\\mathbf q$ works out to the same fraction), and the entries of $\\mathbf q$ are positive and add to $1$.`,
    ],
  };
}
const WO_P = [['0.6', '0.3', '0.2'], ['0.2', '0.6', '0.2'], ['0.2', '0.1', '0.6']];
const WO = steadyItem(WO_P);

/** Random 3×3 column-stochastic matrices in tenths (all entries positive, so regular), steady state denominator ≤ 30. */
function generateSteady(rand) {
  for (;;) {
    const cols = [0, 1, 2].map((j) => {
      const d = rand.int(4, 7);
      const a = rand.int(1, 10 - d - 1);
      const rest = [a, 10 - d - a];
      const c = [];
      let r = 0;
      for (let i = 0; i < 3; i++) c.push(i === j ? d : rest[r++]);
      return c;
    });
    const P0 = [0, 1, 2].map((i) => cols.map((c) => F(c[i], 10)));
    const { sum } = steady(P0);
    if (sum.cmp(30) > 0 || sum.cmp(6) < 0) continue;
    return steadyItem(P0.map((r) => r.map((x) => dec(x))));
  }
}

// ---------------------------------------------------------------- shared scene builders

/** City and suburbs: two bars over a baseline, with percent labels and names. */
function bars(s, { cx, base = 470, height = 380, gap = 170, w = 100, vals, pct = true, names = true, size = 30, visible = false }) {
  const xs = [cx - gap / 2, cx + gap / 2];
  const colors = [C.blue, C.red];
  const axis = s.line(cx - gap / 2 - w * 0.9, base, cx + gap / 2 + w * 0.9, base, { color: C.muted, width: 3, visible });
  const rects = xs.map((x, i) => {
    const h = Number(vals[i]) * height;
    return s.rect(x - w / 2, base - h, w, h, { color: colors[i], fill: [FILL.blue, FILL.red][i], width: 3, visible });
  });
  const pcts = pct ? xs.map((x, i) => s.tex(`${Math.round(Number(vals[i]) * 1000) / 10}\\%`, { x, y: base - Number(vals[i]) * height - 26, size, color: colors[i], visible })) : [];
  const labels = names ? ['City', 'Suburbs'].map((n, i) => s.text(n, { x: xs[i], y: base + 30, size: 30, color: colors[i], visible })) : [];
  return { xs, w, base, height, axis, rects, pcts, labels, all: [axis, ...rects, ...pcts, ...labels] };
}
function setBars(s, ch, vals, { duration = 600 } = {}) {
  return s.all(
    ch.rects.map((r, i) => {
      const h = Number(vals[i]) * ch.height;
      return r.resize(ch.xs[i] - ch.w / 2, ch.base - h, ch.w, h, { duration });
    }),
    ch.pcts.map((p, i) =>
      s.all(p.moveTo(ch.xs[i], ch.base - Number(vals[i]) * ch.height - 26, { duration }), p.swap(`${Math.round(Number(vals[i]) * 1000) / 10}\\%`, { duration })),
    ),
  );
}
const fadeAll = (s, mobs) => s.all(mobs.filter(Boolean).map((m) => m.fadeIn({ shift: [0, 0] })));

/** Cubic-curve arrow (self-loop or arc) as one path with its head. */
function curveArrow(s, [x0, y0], [c1x, c1y], [c2x, c2y], [x1, y1], opts) {
  const a = Math.atan2(y1 - c2y, x1 - c2x);
  const h = 16;
  const l = [x1 - h * Math.cos(a - 0.45), y1 - h * Math.sin(a - 0.45)];
  const r = [x1 - h * Math.cos(a + 0.45), y1 - h * Math.sin(a + 0.45)];
  return s.path(`M${x0},${y0} C${c1x},${c1y} ${c2x},${c2y} ${x1},${y1} M${l[0]},${l[1]} L${x1},${y1} L${r[0]},${r[1]}`, { width: 3.5, ...opts });
}

/** Beat 4 picture: two states, the moves between them, and P. */
const NODE = { c: [150, 300], s: [450, 300], r: 78 };
function migration(s, visible = false) {
  const [cx, cy] = NODE.c, [sx, sy] = NODE.s, r = NODE.r;
  const circles = [NODE.c, NODE.s].map(([x, y], i) => s.circle(x, y, r, { color: i ? C.red : C.blue, fill: i ? FILL.red : FILL.blue, width: 3, visible }));
  const names = [s.text('City', { x: cx, y: cy, size: 32, weight: 600, color: C.blue, visible }), s.text('Suburbs', { x: sx, y: sy, size: 30, weight: 600, color: C.red, visible })];
  const out = s.arrow(cx + r + 8, cy - 28, sx - r - 8, sy - 28, { color: C.blue, width: 3.5, visible });
  const back = s.arrow(sx - r - 8, sy + 28, cx + r + 8, cy + 28, { color: C.red, width: 3.5, visible });
  const loopC = curveArrow(s, [cx - 30, cy - r + 4], [cx - 90, cy - r - 110], [cx + 90, cy - r - 110], [cx + 30, cy - r + 4], { color: C.blue, visible });
  const loopS = curveArrow(s, [sx - 30, sy - r + 4], [sx - 90, sy - r - 110], [sx + 90, sy - r - 110], [sx + 30, sy - r + 4], { color: C.red, visible });
  // labels: [i][j] = fraction going from state j to state i, placed on its arrow
  const lab = [
    [s.tex(dec(P[0][0]), { x: cx, y: cy - r - 112, size: 32, color: C.blue, visible }), s.tex(dec(P[0][1]), { x: (cx + sx) / 2, y: cy + 62, size: 32, color: C.red, visible })],
    [s.tex(dec(P[1][0]), { x: (cx + sx) / 2, y: cy - 62, size: 32, color: C.blue, visible }), s.tex(dec(P[1][1]), { x: sx, y: sy - r - 112, size: 32, color: C.red, visible })],
  ];
  return { circles, names, out, back, loopC, loopS, lab };
}
function bigP(s, { x = 790, y = 300, visible = false } = {}) {
  return s.matrix(PCELLS, { x, y, size: 44, visible });
}

// ---------------------------------------------------------------- the lecture

export default {
  id: 'markov',
  title: 'Difference equations and Markov chains',
  goals: [
    'See solutions of a linear difference equation as a vector space of signals, and test independence with the Casorati matrix',
    'Model a system with a stochastic matrix and state vectors $\\mathbf x_{k+1} = P\\mathbf x_k$',
    'Find the steady-state vector by solving $(P - I)\\mathbf x = \\mathbf 0$ and normalizing',
    'Know that a regular chain converges to its steady state from any start',
  ],
  beats: [
    // 1
    {
      id: 'signals',
      title: 'Sequences as vectors',
      scene(s) {
        const base = 500, unit = 9.5, x0 = 120, dx = 95;
        const axis = s.line(70, base, 450, base, { color: C.muted, width: 3, visible: false });
        const ticks = [0, 1, 2, 3].map((k) => s.tex(String(k), { x: x0 + dx * k, y: base + 32, size: 30, color: C.muted, visible: false }));
        const kName = s.tex('k', { x: 440, y: base + 32, size: 30, color: C.muted, visible: false });
        const stems = SIG.map((vals, n) =>
          [0, 1, 2, 3].map((k) => {
            const x = x0 + dx * k + (n ? 16 : -16);
            const y = base - vals[k] * unit;
            const color = n ? C.red : C.blue;
            return { line: s.line(x, base, x, y, { color, width: 4, visible: false }), dot: s.dot(x, y, { r: 8, color, visible: false }) };
          }),
        );
        const lists = [
          s.tex(`2^k:\\ \\ ${SIG[0].join(',\\ ')},\\ \\dots`, { x: 690, y: 160, size: 34, color: C.blue, visible: false }),
          s.tex(`3^k:\\ \\ ${SIG[1].join(',\\ ')},\\ \\dots`, { x: 690, y: 215, size: 34, color: C.red, visible: false }),
          s.tex(`2^k + 3^k:\\ \\ ${SUMSIG.join(',\\ ')},\\ \\dots`, { x: 692, y: 270, size: 30, color: C.green, visible: false }),
        ];
        const space = s.text('add and scale term by term: a vector space $\\mathbb{S}$', { x: 680, y: 335, width: 400, size: 30, color: C.muted, visible: false });
        const eq = s.tex('y_{k+2} - 5y_{k+1} + 6y_k = 0', { x: 480, y: 75, size: 44, visible: false });
        const subs = RATES.map((r, n) => {
          const [a, b, c] = plug(r);
          return s.tex(`${a}\\cdot ${r}^k ${b < 0 ? '-' : '+'} ${Math.abs(b)}\\cdot ${r}^k + ${c}\\cdot ${r}^k = 0\\ \\col{green}{\\checkmark}`, { x: 690, y: 330 + 60 * n, size: 32, color: n ? C.red : C.blue, visible: false });
        });
        const gen = s.tex('y_k = c_1\\,2^k + c_2\\,3^k', { x: 690, y: 452, size: 40, color: C.green, visible: false });
        const thm = s.text('Theorem 17: the solutions form a 2-dimensional space', { x: 690, y: 536, width: 400, size: 30, color: C.muted, visible: false });
        const aux = s.tex(`${AUX_TEX} = 0 \\;\\Rightarrow\\; r = ${RATES.join(',\\ ')}`, { x: 690, y: 265, size: 32, visible: false });
        return { axis, ticks, kName, stems, lists, space, eq, subs, gen, thm, aux };
      },
      steps: [
        {
          say: 'A signal is an infinite list of numbers, one for each time $k${k}. Here are two of them, $2^k${two to the k} and $3^k${three to the k}.',
          do: async (s, o) => {
            await s.all(o.axis.draw({ duration: 600 }), o.ticks.map((x) => x.fadeIn()), o.kName.fadeIn());
            for (const n of [0, 1]) {
              await s.all(
                o.lists[n].write({ duration: 800 }),
                s.stagger(o.stems[n].map((st) => () => s.all(st.line.draw({ duration: 400 }), st.dot.draw({ delay: 300 }))), 250),
              );
            }
          },
        },
        {
          say: 'Signals add and scale term by term, just like vectors. So all signals together form a vector space, called $\\mathbb{S}${S}.',
          do: async (s, o) => {
            await o.lists[2].write({ duration: 900 });
            await o.space.fadeIn();
          },
        },
        {
          say: 'Now take the equation $y_{k+2} - 5y_{k+1} + 6y_k = 0${y k plus two, minus five y k plus one, plus six y k, equals zero}. Where do its solutions come from? Try $y_k = r^k${y k equals r to the k}: you need $r^2 - 5r + 6 = 0${r squared minus five r plus six equals zero}, so $r = 2${r equals two} or $r = 3${r equals three}.',
          do: async (s, o) => {
            await s.all(o.eq.write(), o.lists[2].fadeOut(), o.space.fadeOut());
            await o.aux.write({ duration: 1300 });
          },
        },
        {
          say: 'Check it. Plug in $2^k${two to the k}: four, minus ten, plus six times $2^k${two to the k} is zero. It works, and so does $3^k${three to the k}.',
          do: async (s, o) => {
            await o.subs[0].write();
            await s.wait(500);
            await o.subs[1].write();
          },
        },
        {
          say: 'The solutions of this second order linear equation form a two dimensional subspace, by Theorem 17. So if $2^k${two to the k} and $3^k${three to the k} are independent, they\'re a basis, and $y_k = c_1 2^k + c_2 3^k${y k equals c one two to the k plus c two three to the k} gives every solution. Let\'s check that.',
          do: async (s, o) => {
            await o.gen.write();
            await s.all(o.gen.flash({ color: C.green }), o.thm.fadeIn());
          },
        },
      ],
    },

    // 2
    {
      id: 'casorati',
      title: 'Are they independent?',
      scene(s) {
        const vals = (r, n) => [0, 1, 2, 3].map((k) => (k < 2 ? `\\part{${n}${k}}{${r ** k}}` : String(r ** k))).join(',\\ ');
        const l1 = s.tex(`u_k = 2^k:\\ \\ ${vals(2, 'a')},\\ \\dots`, { x: 480, y: 80, size: 36, color: C.blue });
        const l2 = s.tex(`v_k = 3^k:\\ \\ ${vals(3, 'b')},\\ \\dots`, { x: 480, y: 145, size: 36, color: C.red });
        const sym = s.tex('W_k = \\begin{bmatrix} u_k & v_k \\\\ u_{k+1} & v_{k+1} \\end{bmatrix}', { x: 235, y: 320, size: 36, visible: false });
        const kLab = s.tex('W_0 =', { x: 575, y: 320, size: 40, visible: false });
        const m = s.matrix(CAS, { x: 740, y: 320, size: 44, visible: false });
        const fly = [];
        for (const [i, j, part, src] of [[0, 0, 'a0', l1], [1, 0, 'a1', l1], [0, 1, 'b0', l2], [1, 1, 'b1', l2]]) {
          const from = center(src.partBox(part));
          const to = center(m.cellBox(i, j));
          fly.push({ mob: s.tex(src.part(part)[0].textContent, { x: from[0], y: from[1], size: 36, color: j ? C.red : C.blue, visible: false }), to });
        }
        for (const [i, j] of [[0, 0], [0, 1], [1, 0], [1, 1]]) m.cell(i, j).style.opacity = '0';
        const d = s.tex(`\\det W_0 = ${t(CAS[0][0])}\\cdot ${t(CAS[1][1])} - ${t(CAS[0][1])}\\cdot ${t(CAS[1][0])} = ${t(CAS_DET)} \\neq 0`, { x: 480, y: 465, size: 38, visible: false });
        const concl = s.text('so $2^k$ and $3^k$ are independent: a basis of the solutions', { x: 480, y: 535, size: 30, color: C.green, visible: false });
        return { l1, l2, sym, kLab, m, fly, d, concl };
      },
      steps: [
        {
          say: 'Are $2^k${two to the k} and $3^k${three to the k} really independent? Stack the signals\' values at two consecutive times into a matrix. That\'s the Casorati matrix.',
          do: async (s, o) => {
            await o.sym.write();
            await s.all(o.kLab.fadeIn(), o.m.fadeIn({ shift: [0, 0] }));
            await s.all(o.fly.map(({ mob, to }, k) => {
              mob.show();
              return mob.moveTo(to[0], to[1], { duration: 900, delay: k * 150 });
            }));
            await s.all(cellsTo(s, o.m, [[0, 0], [0, 1], [1, 0], [1, 1]], 1), o.fly.map(({ mob }) => mob.fadeOut({ duration: 400 })));
          },
        },
        {
          say: 'If the Casorati matrix is invertible at even one time $k${k}, the signals are independent. Here its determinant is $1${one}, not zero, so they are.',
          do: async (s, o) => {
            await o.d.write();
            await o.d.flash({ color: C.green });
          },
        },
        {
          say: 'So $2^k${two to the k} and $3^k${three to the k} are a basis for the solution space, and every solution is a combination of them.',
          do: (s, o) => o.concl.fadeIn(),
        },
      ],
    },

    // 3
    {
      id: 'try-signal',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Substitute and simplify.',
      prompt: 'Is $y_k = (-1)^k$ a solution of $y_{k+2} - 5y_{k+1} + 6y_k = 0$?',
      answer: { type: 'choice', value: ALT === 0 ? 'yes' : 'no' },
      choices: [
        { id: 'yes', label: 'Yes', why: `Substitute: you get $1 + 5 + 6 = ${ALT}$ times $(-1)^k$, not $0$.` },
        { id: 'no', label: 'No', why: `Right: the left side is $${ALT}(-1)^k$, which is never $0$.` },
      ],
      hint: 'Factor $(-1)^k$ out of every term: $(-1)^{k+2} = (-1)^k$ and $(-1)^{k+1} = -(-1)^k$.',
      solution: [
        'Write each term as a multiple of $(-1)^k$: $(-1)^{k+2} = (-1)^k$ and $(-1)^{k+1} = -(-1)^k$.',
        `Then $y_{k+2} - 5y_{k+1} + 6y_k = (-1)^k\\big(1 - 5(-1) + 6\\big) = ${ALT}(-1)^k \\neq 0$.`,
        'So $(-1)^k$ is **not** a solution. (Only $2^k$, $3^k$ and their combinations are: $-1$ is not a root of $r^2 - 5r + 6$.)',
      ],
    },

    // 4
    {
      id: 'markov-setup',
      title: 'A population that moves',
      scene(s) {
        const g = migration(s);
        const m = bigP(s);
        const cells = [[0, 0], [1, 0], [0, 1], [1, 1]];
        for (const [i, j] of cells) m.cell(i, j).style.opacity = '0';
        const fly = cells.map(([i, j]) => {
          const from = g.lab[i][j];
          const to = center(m.cellBox(i, j));
          return { mob: s.tex(dec(P[i][j]), { x: from.x, y: from.y, size: 32, color: j ? C.red : C.blue, visible: false }), to, i, j };
        });
        const top = m.colBox(0).y;
        const fromLab = s.text('from', { x: (m.colBox(0).cx + m.colBox(1).cx) / 2, y: top - 74, size: 30, color: C.muted, visible: false });
        const heads = [0, 1].map((j) => s.text(j ? 'S' : 'C', { x: m.colBox(j).cx, y: top - 32, size: 30, weight: 600, color: j ? C.red : C.blue, visible: false }));
        const left = m.colBox(0).x - 50;
        const rowLabs = [0, 1].map((i) => s.text(i ? 'S' : 'C', { x: left, y: m.rowBox(i).cy, size: 30, weight: 600, color: C.muted, visible: false }));
        const toLab = s.text('to', { x: left - 44, y: (m.rowBox(0).cy + m.rowBox(1).cy) / 2, size: 30, color: C.muted, visible: false });
        const bottom = m.rowBox(1).y + m.rowBox(1).h;
        const sums = [0, 1].map((j) => s.tex('\\Sigma = 1', { x: m.colBox(j).cx, y: bottom + 34, size: 30, color: C.green, visible: false }));
        const x0 = s.tex(`\\mathbf x_0 = ${decVec(X0)}`, { x: 220, y: 505, size: 36, visible: false });
        const prob = s.text('a probability vector: entries $\\geq 0$ that add up to $1$', { x: 620, y: 505, width: 400, size: 30, color: C.muted, visible: false });
        return { g, m, fly, fromLab, heads, rowLabs, toLab, sums, x0, prob };
      },
      steps: [
        {
          say: 'Picture people moving between a city and its suburbs. Each year 10 percent of the city moves out to the suburbs, and 20 percent of the suburbs moves into the city. Everyone else stays put.',
          do: async (s, o) => {
            const g = o.g;
            await s.all(g.circles.map((c) => c.draw({ duration: 700 })), g.names.map((n) => n.fadeIn({ delay: 300 })));
            await s.all(g.out.draw(), g.lab[1][0].fadeIn({ delay: 400 }));
            await s.all(g.back.draw(), g.lab[0][1].fadeIn({ delay: 400 }));
            await s.all(g.loopC.draw(), g.loopS.draw(), g.lab[0][0].fadeIn({ delay: 400 }), g.lab[1][1].fadeIn({ delay: 400 }));
          },
        },
        {
          say: 'Collect these numbers in a matrix $P${P}. Column one says where the city\'s people go, and column two says where the suburbs\' people go. Each column adds up to $1${one}, because everybody ends up somewhere.',
          do: async (s, o) => {
            await s.all(o.m.fadeIn({ shift: [0, 0] }), o.fromLab.fadeIn(), o.heads.map((h) => h.fadeIn()), o.rowLabs.map((r) => r.fadeIn()), o.toLab.fadeIn());
            for (const j of [0, 1]) {
              const col = o.fly.filter((f) => f.j === j);
              await s.all(col.map(({ mob, to }, k) => {
                mob.show();
                return mob.moveTo(to[0], to[1], { duration: 900, delay: k * 150 });
              }));
              await s.all(cellsTo(s, o.m, col.map((f) => [f.i, f.j]), 1), col.map((f) => f.mob.fadeOut({ duration: 400 })), o.m.highlightCol(j, j ? C.red : C.blue));
              await o.sums[j].fadeIn();
            }
          },
        },
        {
          say: 'A vector with nonnegative entries that add up to $1${one} is a probability vector. A stochastic matrix is one whose columns are all probability vectors. Our starting split, half and half, is a probability vector too.',
          do: async (s, o) => {
            await o.x0.write();
            await o.prob.fadeIn();
          },
        },
      ],
    },

    // 5
    {
      id: 'iterate',
      title: 'Run the chain',
      scene(s) {
        const rule = s.tex('\\mathbf x_{k+1} = P\\mathbf x_k', { x: 250, y: 90, size: 44, visible: false });
        const first = s.tex(`\\begin{aligned}\\mathbf x_1 &= ${decMat(P)}${decVec(X0)} \\\\ &= ${decVec(STATES[1])}\\end{aligned}`, { x: 250, y: 260, size: 34, visible: false });
        const year = s.tex('k = 0', { x: 250, y: 430, size: 40, visible: false });
        const ch = bars(s, { cx: 700, base: 470, height: 380, gap: 170, w: 100, vals: X0 });
        const lines = [ST.q[0], ST.q[1]].map((v, i) => {
          const y = 470 - Number(v) * 380;
          return s.line(ch.xs[i] - 70, y, ch.xs[i] + 70, y, { color: C.green, width: 3, dash: '8 6', layer: 'front', visible: false });
        });
        const limit = s.tex(`\\mathbf x_k \\to (${ST.q.map((x) => (+Number(x).toFixed(3)).toString()).join(',\\ ')})`, { x: 250, y: 515, size: 36, color: C.green, visible: false });
        return { rule, first, year, ch, lines, limit };
      },
      steps: [
        {
          say: 'The state vector $\\mathbf x_k${x k} holds the fractions living in the city and in the suburbs in year $k${k}. Next year\'s state is $P${P} times this year\'s: $\\mathbf x_{k+1} = P\\mathbf x_k${x k plus one equals P x k}.',
          do: async (s, o) => {
            await s.all(o.rule.write(), fadeAll(s, o.ch.all));
            await o.year.fadeIn();
          },
        },
        {
          say: 'Year one: $P${P} times half and half gives 55 percent in the city and 45 percent in the suburbs.',
          do: async (s, o) => {
            await o.first.write();
            await s.all(setBars(s, o.ch, STATES[1], { duration: 900 }), o.year.swap('k = 1'));
          },
        },
        {
          say: 'Keep going. Each year the change gets smaller, and the bars settle down near two thirds and one third.',
          do: async (s, o) => {
            await s.all(o.lines.map((l) => l.draw({ duration: 500 })));
            for (let k = 2; k < STATES.length; k++) await s.all(setBars(s, o.ch, STATES[k], { duration: 300 }), o.year.swap(`k = ${k}`, { duration: 300 }));
            await o.limit.write();
          },
        },
      ],
    },

    // 6
    {
      id: 'steady-state',
      title: 'Steady state',
      scene(s) {
        const eq = s.tex('P\\mathbf q = \\mathbf q \\iff (P - I)\\mathbf q = \\mathbf 0', { x: 480, y: 70, size: 40, visible: false });
        const pmi = s.tex(`P - I = ${decMat(PmI)}`, { x: 260, y: 200, size: 36, visible: false });
        const times = s.tex('\\times 10:', { x: 95, y: 370, size: 34, color: C.muted, visible: false });
        const m = s.matrix(PmI10, { x: 260, y: 370, size: 44, visible: false });
        const relation = s.tex(`x_1 = ${t(RED10.R[0][1].neg())}x_2`, { x: 770, y: 250, size: 38, visible: false });
        const nul = s.tex(`\\mathbf x = x_2${texVec(ST.w)}`, { x: 770, y: 345, size: 38, visible: false });
        const q = s.tex(`\\mathbf q = \\tfrac{1}{${ST.sum}}(${ST.w.join(', ')}) = \\big(${ST.q.map(t).join(',\\ ')}\\big)`, { x: 690, y: 480, size: 38, color: C.green, visible: false });
        return { eq, pmi, times, m, relation, nul, q };
      },
      steps: [
        {
          say: 'A steady state is a probability vector $\\mathbf q${q} that the chain doesn\'t change: $P\\mathbf q = \\mathbf q${P q equals q}. Move $\\mathbf q${q} to the left side and you get a homogeneous system.',
          do: async (s, o) => {
            await o.eq.write({ duration: 1200 });
            await o.pmi.write();
          },
        },
        {
          say: 'Solve $(P - I)\\mathbf x = \\mathbf 0${P minus I times x equals zero}. Multiply by ten to clear the decimals and row reduce. One free variable: $x_1 = 2x_2${x one equals two x two}.',
          do: async (s, o) => {
            await s.all(o.times.fadeIn(), o.m.fadeIn());
            for (const st of RED10.steps) await o.m.rowOp(st);
            await o.m.note();
            await o.relation.write();
            await o.nul.write();
          },
        },
        {
          say: 'Any multiple of $(2, 1)${two, one} solves it. To get a probability vector, divide by the sum of the entries, which is $3${three}. So $\\mathbf q${q} is two thirds and one third, just where the bars settled.',
          do: async (s, o) => {
            await o.q.write();
            await o.q.flash({ color: C.green });
          },
        },
      ],
    },

    // 7
    {
      id: 'fill-steady',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Same recipe, new chain. Find its steady-state vector.',
      prompt: `For $P = ${decMat(P2)}$, the steady-state vector is`,
      lines: [
        [
          '\\mathbf q = ',
          {
            matrix: [
              [{ id: 'q1', answer: { type: 'number', value: String(ST2.q[0]) }, hint: `$(P - I)\\mathbf x = \\mathbf 0$ gives $${dec(P2[1][0])}x_1 = ${dec(P2[0][1])}x_2$.` }],
              [{ id: 'q2', answer: { type: 'number', value: String(ST2.q[1]) }, hint: 'The two entries must add up to $1$.' }],
            ],
          },
        ],
      ],
      solution: [
        `$P - I = ${decMat(sub(P2, identity(2)))}$, so $(P - I)\\mathbf x = \\mathbf 0$ says $${dec(P2[1][0])}x_1 = ${dec(P2[0][1])}x_2$.`,
        `A null vector is $(${ST2.w.join(', ')})$. Its entries add to $${ST2.sum}$, so $\\mathbf q = (${ST2.q.map(t).join(', ')})$.`,
      ],
    },

    // 8
    {
      id: 'theorem-18',
      title: 'Regular chains converge',
      scene(s) {
        const card = s.defCard({
          y: 140,
          width: 880,
          kind: 'theorem',
          title: 'Theorem 18',
          body: 'If $P$ is an $n \\times n$ **regular** stochastic matrix, then $P$ has a unique steady-state vector $\\mathbf q$, and $\\mathbf x_k \\to \\mathbf q$ for **every** initial probability vector $\\mathbf x_0$.',
          visible: false,
        });
        const reg = s.text('**regular**: some power $P^k$ has only positive entries', { x: 480, y: 290, size: 30, color: C.muted, visible: false });
        const Pm = s.matrix(PCELLS, { x: 480, y: 425, size: 44, visible: false });
        const Plab = s.tex('P = P^1 =', { x: 245, y: 425, size: 38, visible: false });
        const panels = STARTS.map((x0, n) => {
          const cx = 170 + 310 * n;
          const ch = bars(s, { cx, base: 470, height: 210, gap: 90, w: 64, vals: x0, pct: false, names: false, visible: false });
          const start = s.tex(`\\mathbf x_0 = (${x0.map(dec).join(',\\ ')})`, { x: cx, y: 510, size: 30, visible: false });
          const lines = ST.q.map((v, i) => {
            const y = 470 - Number(v) * 210;
            return s.line(ch.xs[i] - 46, y, ch.xs[i] + 46, y, { color: C.green, width: 3, dash: '8 6', layer: 'front', visible: false });
          });
          return { ch, start, lines };
        });
        const forgot = s.text('the starting split is forgotten', { x: 480, y: 548, size: 30, color: C.green, visible: false });
        return { card, reg, Pm, Plab, panels, forgot };
      },
      steps: [
        {
          say: 'Call a stochastic matrix $P${P} regular if some power of it has only positive entries. Ours already does, with $k = 1${k equals one}: every entry of $P${P} is positive.',
          do: async (s, o) => {
            await o.card.reveal();
            await s.all(o.reg.fadeIn(), o.Plab.fadeIn(), o.Pm.fadeIn());
            await s.stagger([[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) => () => o.Pm.highlightCell(i, j, C.green)), 200);
          },
        },
        {
          say: 'Then $P${P} has exactly one steady state, and every starting probability vector converges to it. Watch three very different starts.',
          do: async (s, o) => {
            await s.all(o.reg.fadeOut(), o.Plab.fadeOut(), o.Pm.fadeOut());
            await s.all(o.panels.map((pn) => s.all(fadeAll(s, pn.ch.all), pn.start.fadeIn())));
            for (let k = 1; k < RUNS[0].length; k++) await s.all(o.panels.map((pn, n) => setBars(s, pn.ch, RUNS[n][k], { duration: 350 })));
          },
        },
        {
          say: 'They all end up at two thirds and one third. In the long run, the chain forgets where it started.',
          do: async (s, o) => {
            await s.all(o.panels.flatMap((pn) => pn.lines.map((l) => l.draw({ duration: 600 }))));
            await o.forgot.fadeIn();
          },
        },
      ],
    },

    // 9
    {
      id: 'mistake-rows',
      title: 'The trap: rows vs columns',
      scene(s) {
        const L = 250, R = 710;
        const headBad = s.text('rows sum to 1', { x: L, y: 70, size: 32, weight: 600, color: C.yellow, visible: false });
        const headOk = s.text('columns sum to 1', { x: R, y: 70, size: 32, weight: 600, color: C.green, visible: false });
        const mBad = s.matrix(PT.map((r) => r.map(decCell)), { x: L, y: 185, size: 40, visible: false });
        const mOk = s.matrix(PCELLS, { x: R, y: 185, size: 40, visible: false });
        const prodBad = s.tex(`${decMat(PT)}${texVec(ALL_CITY)} = ${decVec(BAD)}`, { x: L, y: 345, size: 34, visible: false });
        const prodOk = s.tex(`${decMat(P)}${texVec(ALL_CITY)} = ${decVec(GOOD)}`, { x: R, y: 345, size: 34, visible: false });
        const sumBad = s.tex(`${BAD.map(dec).join(' + ')} = ${dec(sumOf(BAD))}`, { x: L, y: 432, size: 34, color: C.yellow, visible: false });
        const sumOk = s.tex(`${GOOD.map(dec).join(' + ')} = ${dec(sumOf(GOOD))}\\ \\checkmark`, { x: R, y: 432, size: 34, color: C.green, visible: false });
        const huh = s.stamp(`${Math.round(Number(sumOf(BAD)) * 100)}% of the people?`, { x: L, y: 518, color: 'red' });
        const read = s.text('column $j$ = where state $j$ goes', { x: R, y: 515, size: 30, color: C.muted, visible: false });
        return { headBad, headOk, mBad, mOk, prodBad, prodOk, sumBad, sumOk, huh, read };
      },
      steps: [
        {
          say: 'Here\'s the trap. Some books write the same chain transposed, with rows adding to $1${one}. Use that matrix with Lay\'s rule $\\mathbf x_{k+1} = P\\mathbf x_k${x k plus one equals P x k}, start with everyone in the city, and next year you have 110 percent of the people.',
          do: async (s, o) => {
            await s.all(o.headBad.fadeIn(), o.mBad.fadeIn());
            await s.all(o.mBad.highlightRow(0, C.yellow), o.mBad.highlightRow(1, C.yellow, { delay: 200 }));
            await o.prodBad.write();
            await o.sumBad.write();
            await o.huh.slam();
          },
        },
        {
          say: 'In Lay, the columns add up to $1${one}, and $P${P} multiplies column vectors from the left. Then the total stays at 100 percent every year.',
          do: async (s, o) => {
            await s.all(o.headOk.fadeIn(), o.mOk.fadeIn());
            await s.all(o.mOk.highlightCol(0, C.green), o.mOk.highlightCol(1, C.green, { delay: 200 }));
            await o.prodOk.write();
            await o.sumOk.write();
          },
        },
        {
          say: 'So read each column as "from state $j${j}". Its entries say where the people in state $j${j} go, and they have to account for all of them.',
          do: async (s, o) => {
            await o.mOk.clearHighlights();
            await o.mOk.highlightCol(0, C.blue);
            await o.read.fadeIn();
          },
        },
      ],
    },

    // 10
    {
      id: 'try-stochastic',
      kind: 'try',
      title: 'Your turn',
      say: 'Which of these is a stochastic matrix? Remember Lay\'s convention.',
      prompt: 'Which is a stochastic matrix?',
      answer: { type: 'choice', value: STOCH[0] },
      choices: [
        { id: 'a', label: `$${decMat(CANDS.a)}$`, why: `Column 2 sums to $${colSums(CANDS.a)[1]}$, not $1$.` },
        { id: 'b', label: `$${decMat(CANDS.b)}$`, why: 'Right: both columns are probability vectors (nonnegative, summing to 1). A 0 entry is allowed.' },
        { id: 'c', label: `$${decMat(CANDS.c)}$`, why: `Rows sum to 1, but columns sum to $${colSums(CANDS.c).join('$ and $')}$. In Lay the columns must.` },
      ],
      hint: 'Add up each column, not each row.',
      solution: [
        `Column sums: (a) $${colSums(CANDS.a).join(',\\ ')}$; (b) $${colSums(CANDS.b).join(',\\ ')}$; (c) $${colSums(CANDS.c).join(',\\ ')}$.`,
        'Only (b) has every column a probability vector: nonnegative entries adding to $1$. Zeros are fine.',
        '(c) is the transposed convention: its rows add to 1, which is not what Lay requires.',
      ],
    },

    // 11
    {
      id: 'wo-steady3',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Find the steady-state vector of this three state chain, then check that $P\\mathbf q = \\mathbf q${P q equals q}.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateSteady,
    },

    // 12
    {
      id: 'cp-steady',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: 'Why is a steady-state vector an element of $\\operatorname{Nul}(P - I)$, and why do we need to rescale the null vector we find?',
      points: [
        '$P\\mathbf q = \\mathbf q$ rearranges to $(P - I)\\mathbf q = \\mathbf 0$, so $\\mathbf q$ is in the null space of $P - I$',
        'Null space vectors are determined only up to a scalar multiple',
        'A steady state must be a probability vector (nonnegative entries adding to 1), which fixes the scale',
        'For a regular $P$ the null space is one-dimensional, so the steady state is unique',
      ],
    },

    // 13
    {
      id: 'summary-markov',
      title: 'Summary',
      scene(s) {
        const ch = bars(s, { cx: 700, base: 430, height: 330, gap: 170, w: 100, vals: ST.q, visible: true });
        const q = s.tex(`\\mathbf q = \\big(${ST.q.map(t).join(',\\ ')}\\big)`, { x: 700, y: 510, size: 34, color: C.green, visible: false });
        const items = [
          'y_{k+2} - 5y_{k+1} + 6y_k = 0:\\ \\dim = 2',
          '\\mathbf x_{k+1} = P\\mathbf x_k',
          '(P - I)\\mathbf q = \\mathbf 0,\\ \\ \\textstyle\\sum q_i = 1',
        ].map((tx, i) => s.tex(tx, { x: 60, y: 130 + 110 * i, size: 32, anchor: [0, 0.5], visible: false }));
        const next = s.tex('\\text{next: } P\\mathbf q = \\col{purple}{1}\\,\\mathbf q', { x: 60, y: 480, size: 34, anchor: [0, 0.5], visible: false });
        return { ch, q, items, next };
      },
      steps: [
        {
          say: 'Signals that solve a linear recurrence form a vector space, and its dimension is the order of the equation.',
          do: (s, o) => o.items[0].write(),
        },
        {
          say: 'A Markov chain moves a probability vector by $\\mathbf x_{k+1} = P\\mathbf x_k${x k plus one equals P x k}, with the columns of $P${P} adding to one.',
          do: async (s, o) => {
            await o.items[1].write();
            await s.all(o.ch.rects.map((r) => r.indicate({ scale: 1.04 })));
          },
        },
        {
          say: 'Its steady state is a null vector of $P - I${P minus I}, scaled to add up to one. Next lecture we\'ll recognize $P\\mathbf q = \\mathbf q${P q equals q} as an eigenvector equation, with eigenvalue $1${one}.',
          do: async (s, o) => {
            await s.all(o.items[2].write(), o.q.fadeIn());
            await o.next.write();
          },
        },
      ],
    },
  ],
};
