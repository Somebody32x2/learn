/**
 * Lecture 19 · Congruences and modular arithmetic (foundations/PLAN.md § 19). Irani · Integers, Liebeck 13.
 *
 * Choreography: a 12-hour clock where the pointer hops 9 → 2; integers wrapped around a 3-clock and colored by
 * class; powers of 3 hopping around a 7-clock until they cycle; the digits of 2026 shedding their powers of ten;
 * the units of ℤ₁₂ lighting up; a residue table for 4x mod 10 that shows which right-hand sides are reachable;
 * multiplication by 3 drawn as a permutation of the nonzero residues mod 7 (Fermat). All numbers are computed below.
 */
import { C } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- number theory (pure)

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
const mod = (a, n) => ((a % n) + n) % n;
const powMod = (a, e, n) => {
  let r = 1;
  for (let i = 0; i < e; i++) r = (r * a) % n;
  return r;
};

function euclid(a, b) {
  const out = [];
  while (b) {
    const q = Math.floor(a / b);
    const r = a % b;
    out.push({ a, b, q, r });
    [a, b] = [b, r];
  }
  return out;
}

/** Extended Euclid by back-substitution (see gcd.js): g = x·a + y·b, with the substitution trail. */
function backsub(a, b) {
  const L = euclid(a, b);
  const k = L.length - 2;
  if (k < 0) return { g: b, x: 0, y: 1, L, trail: [] };
  let s = 1;
  let t = -L[k].q;
  const trail = [{ s, A: L[k].a, t, B: L[k].b }];
  for (let i = k - 1; i >= 0; i--) {
    const prev = { s, t, A: L[i + 1].a, B: L[i + 1].b };
    [s, t] = [t, s - t * L[i].q];
    trail.push({ s, A: L[i].a, t, B: L[i].b, sub: L[i], prev });
  }
  return { g: L[k].r, x: s, y: t, L, trail };
}

const times = (c, X) => (c === 1 ? `${X}` : c === -1 ? `-${X}` : `${c} \\cdot ${X}`);
const lin = (s, A, t, B) => `${times(s, A)} ${t < 0 ? '-' : '+'} ${times(Math.abs(t), B)}`;
const divLine = ({ a, b, q, r }) => `${a} = ${q === 1 ? '' : `${q} \\cdot `}${b} + ${r}`;

/** Inverse of a mod n (gcd 1) with its worked solution: Euclid on (n, a), back-substitution, reduction. */
function inverse(a, n) {
  const R = backsub(n, a);
  const inv = mod(R.y, n);
  const lines = R.L.filter((l) => l.r !== 0).map((l) => `$${divLine(l)}$`);
  const back = [];
  if (R.trail.length) {
    const f = R.trail[0];
    back.push(`$1 = ${lin(f.s, f.A, f.t, f.B)}$`);
    for (const st of R.trail.slice(1)) back.push(`$= ${lin(st.s, st.A, st.t, st.B)}$`);
  }
  const paras = [
    `Euclid on $${n}$ and $${a}$: ${lines.join(', ')}.`,
    back.length ? `Back-substitute: ${back.join(' ')}.` : `$1 = ${lin(R.x, n, R.y, a)}$.`,
    `So $${R.y} \\cdot ${a} \\equiv 1 \\pmod{${n}}$, and $${a}^{-1} \\equiv ${R.y === inv ? inv : `${R.y} \\equiv ${inv}`} \\pmod{${n}}$. Check: $${a} \\cdot ${inv} = ${a * inv} = ${Math.floor((a * inv) / n)} \\cdot ${n} + 1$.`,
  ];
  return { inv, R, paras };
}

/** The linear congruence a·x ≡ b (mod p), p prime: worked item. */
function solveItem(p, a, b) {
  const { inv, paras } = inverse(a, p);
  const x = mod(b * inv, p);
  return {
    prompt: `Solve $${a}x \\equiv ${b} \\pmod{${p}}$. Enter the solution $x$ with $0 \\le x < ${p}$.`,
    answer: { type: 'number', value: x },
    hints: [`Find $${a}^{-1} \\bmod ${p}$ with Euclid’s algorithm.`, `$${a}^{-1} \\equiv ${inv} \\pmod{${p}}$.`],
    solution: [
      ...paras,
      `Multiply both sides by $${inv}$: $x \\equiv ${inv} \\cdot ${b} = ${inv * b} \\equiv ${x} \\pmod{${p}}$. Check: $${a} \\cdot ${x} = ${a * x} = ${Math.floor((a * x) / p)} \\cdot ${p} + ${(a * x) % p}$.`,
    ],
  };
}

// ---------------------------------------------------------------- data

const CLK = { from: 9, by: 5, n: 12 };
const CLK_TO = mod(CLK.from + CLK.by, CLK.n);
const CLK_SUM = CLK.from + CLK.by;
const classList = (r, n) => [-n + r, r, r + n, r + 2 * n].join(', ');
const PROD_EX = { a: 14, b: 2, c: 9, n: 12 }; // 14 ≡ 2, multiply both by 9
const REDUCE = { a: 47, b: 38, n: 9 };
const REDUCE_ANS = mod(REDUCE.a * REDUCE.b, REDUCE.n);
const POW = { a: 3, n: 7, e: 100 };
const POWERS = Array.from({ length: 6 }, (_, i) => powMod(POW.a, i + 1, POW.n)); // 3, 2, 6, 4, 5, 1
const CYCLE = POWERS.indexOf(1) + 1; // 6
const POW_Q = Math.floor(POW.e / CYCLE);
const POW_R = POW.e % CYCLE;
const POW_ANS = powMod(POW.a, POW.e, POW.n);
const YEAR = 2026;
const DIGITS = String(YEAR).split('').map(Number);
const DSUM = DIGITS.reduce((a, b) => a + b, 0);
const FP = { a: 2, n: 7, e: 50 };
const FP_CYC = powMod(FP.a, 3, FP.n); // 1
const FP_Q = Math.floor(FP.e / 3);
const FP_ANS = powMod(FP.a, FP.e, FP.n);
const UNITS12 = Array.from({ length: 11 }, (_, i) => i + 1).filter((k) => gcd(k, 12) === 1);
const INV7 = inverse(7, 26);
const LC = { a: 4, b: 6, n: 10 };
const LC_G = gcd(LC.a, LC.n);
const LC_ROW = Array.from({ length: LC.n }, (_, x) => mod(LC.a * x, LC.n));
const LC_SOL = LC_ROW.map((v, x) => (v === LC.b ? x : null)).filter((x) => x !== null); // [4, 9]
const LC_INV2 = inverse(LC.a / LC_G, LC.n / LC_G).inv; // 2⁻¹ mod 5 = 3
const LC_X = mod(LC_INV2 * (LC.b / LC_G), LC.n / LC_G); // 4
const PERM = [1, 2, 3, 4, 5, 6].map((k) => mod(3 * k, 7)); // 3, 6, 2, 5, 1, 4
const WO = solveItem(29, 17, 3);

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });
/** "(mod n)" with a normal space (display-mode \pmod puts a quad before it, too wide for the stage). */
const M = (n) => `\\ (\\mathrm{mod}\\ ${n})`;
/** Shortest signed hop from residue a to residue b on an n-clock. */
const hop = (a, b, n) => {
  const d = mod(b - a, n);
  return d > n / 2 ? d - n : d;
};

export default {
  id: 'congruences',
  title: 'Congruences and modular arithmetic',
  goals: [
    'Work with $a \\equiv b \\pmod n$ as an equivalence relation and do arithmetic with it',
    'Compute large powers modulo $n$',
    'Decide when $a$ has an inverse mod $n$ and compute it; solve linear congruences',
    'State Fermat’s little theorem and use it',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'clock',
      title: 'Clock arithmetic',
      scene(s) {
        const clock = s.modClock({ x: 240, y: 300, n: CLK.n, visible: false });
        const sum = s.tex(`${CLK.from} + ${CLK.by} = ${CLK_SUM} \\equiv ${CLK_TO} \\ (\\mathrm{mod}\\ ${CLK.n})`, { x: 690, y: 90, size: 36, visible: false });
        const card = s.defCard({ x: 690, y: 230, width: 440, body: '${a \\equiv b \\ (\\mathrm{mod}\\ n)}$ means ${n \\mid (a - b)}$.', visible: false });
        const diff = s.tex(`${CLK_SUM} - ${CLK_TO} = ${CLK_SUM - CLK_TO} = ${(CLK_SUM - CLK_TO) / CLK.n} \\cdot ${CLK.n}`, { x: 690, y: 345, size: 34, visible: false });
        const r1 = s.tex(`${CLK_SUM} = ${Math.floor(CLK_SUM / CLK.n)} \\cdot ${CLK.n} + \\part{r}{${CLK_SUM % CLK.n}}`, { x: 690, y: 435, size: 34, visible: false });
        const r2 = s.tex(`${CLK_TO} = 0 \\cdot ${CLK.n} + \\part{r}{${CLK_TO}}`, { x: 690, y: 490, size: 34, visible: false });
        const same = s.text('same remainder', { x: 690, y: 545, size: 30, color: C.green, visible: false });
        return { clock, sum, card, diff, r1, r2, same };
      },
      steps: [
        {
          say: 'Nine o’clock plus five hours is two o’clock. Clock arithmetic wraps around: after eleven comes twelve o’clock, which we call zero.',
          do: async (s, o) => {
            await o.clock.fadeIn({ shift: [0, 0] });
            await o.clock.step(CLK.from, CLK.by, { duration: 1200 });
            await o.sum.write();
          },
        },
        {
          say: 'Here is the precise version. $a${a} is congruent to $b${b} mod $n${n} when $n${n} divides $a - b${a minus b}. Fourteen minus two is twelve, a multiple of twelve.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.diff.write();
          },
        },
        {
          say: 'Equivalently, $a${a} and $b${b} leave the same remainder on division by $n${n}. The two descriptions agree by the division algorithm.',
          do: async (s, o) => {
            await o.r1.write();
            await o.r2.write();
            await s.all(o.r1.color('r', C.green), o.r2.color('r', C.green));
            await o.same.fadeIn();
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'zn',
      title: 'The integers mod $n$',
      scene(s) {
        const c3 = s.modClock({ x: 270, y: 300, n: 3, r: 100, visible: false });
        const cols = ['blue', 'orange', 'teal'];
        const cls = [0, 1, 2].map((r, i) => s.tex(`[${r}] = \\{\\dots, ${classList(r, 3)}, \\dots\\}`, { x: 700, y: 110 + i * 60, size: 32, color: C[cols[i]], visible: false }));
        const z3 = s.tex('\\mathbb{Z}_3 = \\{[0], [1], [2]\\}', { x: 700, y: 330, size: 40, visible: false });
        const c7 = s.modClock({ x: 270, y: 300, n: 7, visible: false });
        const z7 = s.tex('\\mathbb{Z}_7 = \\{[0], [1], [2], \\dots, [6]\\}', { x: 690, y: 230, size: 34, visible: false });
        const name = s.tex(`[9] = [2] = [-5] \\text{ in } \\mathbb{Z}_7`, { x: 700, y: 330, size: 36, visible: false });
        const note = s.text('name each class by its remainder', { x: 700, y: 410, size: 30, color: C.muted, visible: false });
        return { c3, cols, cls, z3, c7, z7, name, note };
      },
      steps: [
        {
          say: 'Congruence mod $n${n} is an equivalence relation: reflexive, symmetric and transitive. Wrap the integers around a three-clock and they fall into three piles.',
          do: async (s, o) => {
            await o.c3.fadeIn({ shift: [0, 0] });
            await o.c3.wrap(6, { gap: 160 });
            await o.c3.classes({ colors: o.cols });
          },
        },
        {
          say: 'Those piles are the equivalence classes, called residue classes. The set of classes is the quotient, written $\\mathbb{Z}_n${Z n}.',
          do: async (s, o) => {
            await s.stagger(o.cls.map((c) => () => c.write()), 500);
            await o.z3.fadeIn();
          },
        },
        {
          say: 'For $n = 7${n equals seven} there are seven classes. We usually name a class by its remainder: nine and minus five both land on two, so $[9] = [2]${the class of nine equals the class of two}.',
          do: async (s, o) => {
            await s.all(o.c3.fadeOut(), o.z3.fadeOut(), ...o.cls.map((c) => c.fadeOut()));
            await s.all(o.c7.fadeIn({ shift: [0, 0] }), o.z7.write());
            await o.c7.step(0, 9, { duration: 1100 });
            await o.name.write();
            await o.note.fadeIn();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'arithmetic',
      title: 'Arithmetic respects congruence',
      scene(s) {
        const thm = s.text('**Theorem.** If $a \\equiv b$ and $c \\equiv d$ (mod $n$), then $a + c \\equiv b + d$ and $ac \\equiv bd$ (mod $n$).', { y: 72, size: 30, width: 860, visible: false });
        const { a, b, c, n } = PROD_EX;
        const ex = s.tex(`${a} \\equiv ${b}${M(n)}: \\quad ${a} \\cdot ${c} = ${a * c} \\equiv ${mod(a * c, n)}, \\quad ${b} \\cdot ${c} = ${b * c} \\equiv ${mod(b * c, n)}`, { x: 480, y: 145, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 124, width: 900, height: 446, size: 30, visible: false });
        return { thm, ex, p };
      },
      steps: [
        {
          say: 'This theorem says that adding and multiplying classes does not depend on which representatives you pick. Fourteen and two are the same mod twelve, and so are their products with nine.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.ex.write({ duration: 1200 });
          },
        },
        {
          say: 'Let’s prove it. Unpack both hypotheses: $n${n} divides $a - b${a minus b} and $c - d${c minus d}. The sum rule is then one line: $(a + c) - (b + d)${a plus c, minus b plus d} is $(a - b) + (c - d)${a minus b, plus c minus d}, a sum of multiples of $n${n}.',
          do: async (s, o) => {
            await o.ex.fadeOut({ shift: [0, -10] });
            await o.p.fadeIn({ shift: [0, 0], duration: 250 });
            await o.p.add('**Proof.** Let $a, b, c, d \\in \\mathbb{Z}$, $n \\in \\mathbb{N}$.', { kind: 'assume', why: 'hypotheses' });
            await o.p.add('$a \\equiv b$, $c \\equiv d$: $n \\mid a - b$, $n \\mid c - d$.', { why: 'def. of $\\equiv$' });
            await o.p.add('Sum: $n \\mid (a + c) - (b + d)$.', { why: 'two multiples of $n$' });
          },
        },
        {
          say: 'For the product, the trick is to add and subtract $ad${a d}. That splits $ac - bd${a c minus b d} into $a(c - d) + d(a - b)${a times c minus d, plus d times a minus b}, and both pieces are multiples of $n${n}.',
          do: async (s, o) => {
            o.trick = o.p.add('$ac - bd = ac - ad + ad - bd$', { why: '$\\pm ad$' });
            await o.trick;
            await o.p.highlight(o.trick, 'yellow');
            await o.p.add('$\\phantom{ac} = a(c - d) + d(a - b)$.', { why: 'factor', indent: 1 });
            await o.p.add('So $n \\mid ac - bd$.', { why: 'sum of multiples' });
            await o.p.add('Therefore $ac \\equiv bd \\pmod n$.', { kind: 'conclude', why: 'def. of $\\equiv$' });
            await o.p.qed();
          },
        },
        {
          say: 'The payoff: you may reduce at any moment during a computation, and the answer mod $n${n} does not change.',
          do: async (s, o) => {
            await o.p.unhighlight(o.trick);
            await o.thm.indicate({ color: C.green, scale: 1.03 });
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-reduce',
      kind: 'try',
      title: 'Reduce first',
      say: 'Try it. Reduce first, and the numbers stay small.',
      prompt: `Find the remainder of $${REDUCE.a} \\cdot ${REDUCE.b}$ on division by $${REDUCE.n}$.`,
      answer: { type: 'number', value: REDUCE_ANS },
      hint: `Reduce each factor mod $${REDUCE.n}$ first.`,
      solution: [
        `$${REDUCE.a} \\equiv ${mod(REDUCE.a, REDUCE.n)}$ and $${REDUCE.b} \\equiv ${mod(REDUCE.b, REDUCE.n)} \\pmod{${REDUCE.n}}$, so $${REDUCE.a} \\cdot ${REDUCE.b} \\equiv ${mod(REDUCE.a, REDUCE.n)} \\cdot ${mod(REDUCE.b, REDUCE.n)} = ${mod(REDUCE.a, REDUCE.n) * mod(REDUCE.b, REDUCE.n)} \\pmod{${REDUCE.n}}$.`,
        `Check: $${REDUCE.a * REDUCE.b} = ${REDUCE.n} \\cdot ${Math.floor((REDUCE.a * REDUCE.b) / REDUCE.n)} + ${REDUCE_ANS}$.`,
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'powers',
      title: 'Big powers',
      scene(s) {
        const clock = s.modClock({ x: 230, y: 300, n: POW.n, visible: false });
        const items = POWERS.map((v, i) =>
          s.tex(`3^{${i + 1}} \\equiv ${v}`, { x: i < 3 ? 590 : 800, y: 80 + (i % 3) * 60, size: 36, visible: false }),
        );
        const exp = s.tex(`${POW.e} = ${CYCLE} \\cdot ${POW_Q} + ${POW_R}`, { x: 700, y: 330, size: 36, visible: false });
        const l1 = s.tex(`3^{${POW.e}} = (3^{${CYCLE}})^{${POW_Q}} \\cdot 3^{${POW_R}}`, { x: 700, y: 405, size: 36, visible: false });
        const l2 = s.tex(`\\equiv 1^{${POW_Q}} \\cdot ${3 ** POW_R} \\equiv ${POW_ANS} \\ (\\mathrm{mod}\\ ${POW.n})`, { x: 700, y: 475, size: 36, color: C.green, visible: false });
        return { clock, items, exp, l1, l2 };
      },
      steps: [
        {
          say: 'Powers of three mod seven: three, then nine, which is two, then six, four, five, and one. Each hop multiplies by three.',
          do: async (s, o) => {
            await o.clock.fadeIn({ shift: [0, 0] });
            let at = 1;
            for (let i = 0; i < POWERS.length; i++) {
              await o.clock.step(at, hop(at, POWERS[i], POW.n), { duration: 450 });
              await o.items[i].fadeIn({ shift: [-10, 0] });
              at = POWERS[i];
            }
          },
        },
        {
          say: 'Once we are back at one, the powers cycle: $3^6 \\equiv 1${three to the sixth is congruent to one}, so the pattern repeats every six steps.',
          do: async (s, o) => {
            o.ring = s.ring(o.items[CYCLE - 1], { color: 'green', shape: 'box' });
            await s.all(o.ring, o.clock.highlight(1, 'green'), o.items[CYCLE - 1].recolor(C.green));
          },
        },
        {
          say: 'Write the exponent as six q plus r: $100 = 6 \\cdot 16 + 4${one hundred equals six times sixteen, plus four}. Sixteen full cycles contribute nothing, so $3^{100} \\equiv 3^4 \\equiv 4${three to the hundredth is congruent to three to the fourth, which is four}.',
          do: async (s, o) => {
            await o.exp.write();
            await o.l1.write();
            await o.l2.write();
            await o.items[POW_R - 1].indicate({ color: C.green });
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'nines',
      title: 'Casting out nines',
      scene(s) {
        const ten = s.tex(`10 \\equiv 1${M(9)} \\implies 10^k \\equiv 1^k = 1`, { x: 480, y: 70, size: 38, visible: false });
        const P = DIGITS.length - 1;
        const terms = DIGITS.map((d, i) => {
          const k = P - i;
          return k === 0 ? `\\part{d${k}}{${d}}` : `\\part{d${k}}{${d}} \\cdot \\part{p${k}}{10${k > 1 ? `^${k}` : ''}}`;
        });
        const expand = s.tex(`${YEAR} = ${terms.join(' + ')}`, { x: 480, y: 175, size: 42, visible: false });
        const ones = s.tex(`\\equiv ${DIGITS.map((d, i) => (i === P ? `${d}` : `${d} \\cdot \\part{one}{1}`)).join(' + ')}`, { x: 480, y: 255, size: 42, visible: false });
        const sum = s.tex(`= ${DIGITS.join(' + ')} = ${DSUM} \\equiv ${mod(DSUM, 9)}${M(9)}`, { x: 480, y: 335, size: 42, visible: false });
        const check = s.tex(`${YEAR} = 9 \\cdot ${Math.floor(YEAR / 9)} + ${YEAR % 9} \\ \\checkmark`, { x: 480, y: 415, size: 36, color: C.green, visible: false });
        const rule = s.tex('9 \\mid n \\iff 9 \\mid (\\text{the digit sum of } n)', { x: 480, y: 510, size: 38, color: C.blue, visible: false });
        return { ten, expand, ones, sum, check, rule, P };
      },
      steps: [
        {
          say: 'Ten is congruent to one mod nine. Since we may multiply congruences, every power of ten is congruent to one as well.',
          do: (s, o) => o.ten.write({ duration: 1100 }),
        },
        {
          say: 'Write twenty twenty-six in base ten. Each power of ten turns into a one, so the number is congruent to the sum of its digits: two plus zero plus two plus six is ten, which is one mod nine.',
          do: async (s, o) => {
            await o.expand.write({ duration: 1100 });
            await s.all([...Array(o.P).keys()].map((i) => o.expand.color(`p${i + 1}`, C.yellow)));
            await o.ones.write({ duration: 900 });
            await o.ones.color('one', C.yellow);
            await o.sum.write({ duration: 900 });
          },
        },
        {
          say: 'Check it the long way: twenty twenty-six is nine times two twenty-five, plus one.',
          do: (s, o) => o.check.write(),
        },
        {
          say: 'So every number is congruent to its digit sum mod nine, and nine divides a number exactly when it divides the digit sum. That is a proof of the grade-school rule.',
          do: (s, o) => o.rule.write({ duration: 1100 }),
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-power',
      kind: 'blanks',
      title: '$2^{50} \\bmod 7$',
      say: 'Fill in the steps to find two to the fiftieth, mod seven.',
      prompt: 'Find $2^{50} \\bmod 7$ by finding a cycle. Enter remainders between $0$ and $6$.',
      lines: [
        ['2^3 = 8 \\equiv ', { id: 'c', answer: { type: 'number', value: FP_CYC } }, '\\pmod 7'],
        ['50 = 3 \\cdot ', { id: 'q', answer: { type: 'number', value: FP_Q }, hint: 'Divide 50 by 3.' }, '{} + 2'],
        ['\\text{so } 2^{50} \\equiv 2^2 = ', { id: 'r', answer: { type: 'number', value: FP_ANS } }, '\\pmod 7'],
      ],
      solution: [`$2^3 = 8 = 7 + 1 \\equiv 1$, and $50 = 3 \\cdot ${FP_Q} + 2$, so $2^{50} = (2^3)^{${FP_Q}} \\cdot 2^2 \\equiv 1 \\cdot 4 = ${FP_ANS} \\pmod 7$.`],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'inverses',
      title: 'Division mod $n$',
      scene(s) {
        const bad = s.tex(`2 \\cdot 3 = 6 \\equiv 0 = 2 \\cdot 0${M(6)}`, { x: 275, y: 65, size: 32, visible: false });
        const arrow = s.arrow(518, 65, 578, 65, { color: C.red, width: 3, visible: false });
        const cancel = s.tex(`3 \\equiv 0${M(6)}\\,?`, { x: 730, y: 65, size: 32, color: C.red, visible: false });
        const card = s.defCard({ x: 680, y: 225, width: 450, body: '$a$ has an inverse mod $n$ (some $b$ with ${ab \\equiv 1}$) exactly when ${\\gcd(a, n) = 1}$.', visible: false });
        const clock = s.modClock({ x: 230, y: 375, n: 12, r: 120, nodeR: 26, size: 30, visible: false });
        const units = s.text(`units mod $12$: $${UNITS12.join(', ')}$`, { x: 230, y: 555, size: 30, color: C.green, visible: false });
        const five = s.tex(`5 \\cdot 5 = 25 = 2 \\cdot 12 + 1 \\equiv 1`, { x: 680, y: 380, size: 34, visible: false });
        const iff = s.tex(`ax \\equiv 1${M('n')} \\iff ax + ny = 1`, { x: 665, y: 450, size: 30, visible: false });
        const bez = s.text('Bézout: Euclid finds $x$', { x: 680, y: 515, size: 30, color: C.muted, visible: false });
        return { bad, arrow, cancel, card, clock, units, five, iff, bez };
      },
      steps: [
        {
          say: 'Here’s the trap: you cannot cancel freely mod $n${n}. Two times three and two times zero are both zero mod six, but three is not zero mod six.',
          do: async (s, o) => {
            await o.bad.write();
            await o.arrow.draw({ duration: 400 });
            await o.cancel.write();
            await s.strike(o.cancel);
          },
        },
        {
          say: 'You can cancel a factor that has an inverse, and $a${a} has an inverse mod $n${n} exactly when $\\gcd(a, n) = 1${the gcd of a and n is one}. Mod twelve, those are one, five, seven and eleven.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.clock.fadeIn({ shift: [0, 0] });
            await s.stagger(UNITS12.map((k) => () => o.clock.highlight(k, 'green')), 250);
            await o.units.fadeIn();
          },
        },
        {
          say: 'Five is its own inverse: five times five, five added to itself again and again, is twenty-five, which is one mod twelve.',
          do: async (s, o) => {
            await o.clock.step(5, 5, { color: 'blue', count: 4, duration: 500 });
            await o.five.write();
          },
        },
        {
          say: 'In general, $ax \\equiv 1${a x congruent to one} mod $n${n} means $ax + ny = 1${a x plus n y equals one} for some integer $y${y}: exactly a Bézout equation. So Euclid’s algorithm finds the inverse.',
          do: async (s, o) => {
            await o.iff.write();
            await o.bez.fadeIn();
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'try-inverse',
      kind: 'try',
      title: 'Find the inverse',
      say: 'Your turn: find an inverse with Euclid’s algorithm.',
      prompt: 'Find the inverse of $7$ modulo $26$, as a number between $0$ and $25$.',
      answer: { type: 'number', value: INV7.inv },
      hint: 'Run Euclid on $26$ and $7$, then back-substitute.',
      solution: INV7.paras,
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'linear-congruence',
      title: 'Solving a linear congruence',
      scene(s) {
        const X = (j) => 282 + j * 63;
        const labX = s.tex('x', { x: 235, y: 65, size: 34, anchor: [1, 0.5], color: C.muted, visible: false });
        const labY = s.tex('4x \\bmod 10', { x: 235, y: 120, size: 34, anchor: [1, 0.5], color: C.muted, visible: false });
        const xs = LC_ROW.map((_, j) => s.tex(String(j), { x: X(j), y: 65, size: 34, visible: false }));
        const ys = LC_ROW.map((v, j) => s.tex(String(v), { x: X(j), y: 120, size: 34, visible: false }));
        const line = (tex, y, color) => s.tex(tex, { x: 70, y, size: 34, anchor: [0, 0.5], color, visible: false });
        const l1 = line(`\\gcd(4, 10) = ${LC_G} \\text{ and } ${LC_G} \\mid 6: \\text{ solvable}`, 205);
        const l2 = line(`10 \\mid 4x - 6 \\iff 5 \\mid 2x - 3: \\quad 2x \\equiv 3${M(5)}`, 265);
        const l3 = line(`2^{-1} \\equiv ${LC_INV2} \\implies x \\equiv ${LC_INV2} \\cdot 3 = ${LC_INV2 * 3} \\equiv ${LC_X}${M(5)}`, 325);
        const l4 = line(`x \\equiv ${LC_SOL.join(', ')}${M(10)}: \\ \\ ${LC_SOL.map((x) => `${4 * x} \\equiv 6`).join(',\\ ')} \\ \\checkmark`, 385, C.green);
        const l5 = line(`4x \\equiv 5${M(10)}: \\ ${LC_G} \\nmid 5 \\implies \\text{no solution}`, 470, C.red);
        const l6 = s.text('$4x$ is even, but every $5 + 10k$ is odd', { x: 70, y: 530, size: 30, anchor: [0, 0.5], color: C.red, visible: false });
        return { labX, labY, xs, ys, l1, l2, l3, l4, l5, l6 };
      },
      steps: [
        {
          say: 'Solve $4x \\equiv 6${four x congruent to six} mod ten. Try every residue: four x mod ten only takes the values zero, four, eight, two and six, and it hits six at x equals four and nine.',
          do: async (s, o) => {
            await s.all(o.labX.fadeIn(), o.labY.fadeIn());
            await s.stagger(o.xs.map((m, j) => () => s.all(m.fadeIn(), o.ys[j].fadeIn({ delay: 150 }))), 120);
            await s.wait(200);
            await s.all(LC_SOL.map((j) => s.ring(o.ys[j], { color: 'green', shape: 'box' })));
          },
        },
        {
          say: 'The rule: $ax \\equiv b${a x congruent to b} mod $n${n} is solvable exactly when $\\gcd(a, n)${the gcd of a and n} divides $b${b}. Here the gcd is two, and two divides six.',
          do: (s, o) => o.l1.write(),
        },
        {
          say: 'Divide everything by the gcd, the modulus too: ten divides four x minus six exactly when five divides two x minus three. So $2x \\equiv 3${two x congruent to three} mod five. Two is invertible mod five, with inverse three, so x is three times three, nine, which is four mod five.',
          do: async (s, o) => {
            await o.l2.write();
            await o.l3.write({ duration: 1200 });
          },
        },
        {
          say: 'Back mod ten, that is two solutions, four and nine, as many as the gcd. Both check: sixteen and thirty-six are six mod ten.',
          do: async (s, o) => {
            await o.l4.write({ duration: 1200 });
            await s.all(LC_SOL.map((j) => o.xs[j].recolor(C.green)));
          },
        },
        {
          say: 'Now try $4x \\equiv 5${four x congruent to five} mod ten. Two does not divide five, so there is no solution: four x is always even, and five plus a multiple of ten is always odd.',
          do: async (s, o) => {
            await o.l5.write({ duration: 1100 });
            await o.l6.fadeIn();
            await s.ring(s.group(...o.ys), { color: 'red', shape: 'box', pad: 8 });
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'fermat',
      title: 'Fermat’s little theorem',
      scene(s) {
        const card = s.defCard({ y: 96, width: 760, title: 'Fermat’s little theorem', body: 'If $p$ is prime and $p \\nmid a$, then $a^{p-1} \\equiv 1 \\pmod p$.', visible: false });
        const X = (k) => 250 + (k - 1) * 92;
        const labTop = s.tex('k', { x: 200, y: 210, size: 34, anchor: [1, 0.5], color: C.muted, visible: false });
        const labBot = s.tex('3k \\bmod 7', { x: 200, y: 330, size: 34, anchor: [1, 0.5], color: C.muted, visible: false });
        const top = [1, 2, 3, 4, 5, 6].map((k) => s.tex(String(k), { x: X(k), y: 210, size: 36, visible: false }));
        const bot = [1, 2, 3, 4, 5, 6].map((k) => s.tex(String(k), { x: X(k), y: 330, size: 36, visible: false }));
        const arrows = PERM.map((t, i) => s.arrow(X(i + 1), 232, X(t), 302, { color: C.blue, width: 3, visible: false }));
        const prod = s.tex(`(3 \\cdot 1)(3 \\cdot 2) \\cdots (3 \\cdot 6) \\equiv 1 \\cdot 2 \\cdots 6${M(7)}`, { x: 480, y: 420, size: 36, visible: false });
        const prod2 = `3^6 \\cdot \\part{f}{6!} \\;\\equiv\\; \\part{g}{6!}${M(7)}`;
        const res = s.tex(`3^6 \\equiv 1${M(7)} \\qquad (3^6 = ${3 ** 6} = ${Math.floor(3 ** 6 / 7)} \\cdot 7 + ${3 ** 6 % 7})`, { x: 480, y: 505, size: 34, color: C.green, visible: false });
        return { card, labTop, labBot, top, bot, arrows, prod, prod2, res };
      },
      steps: [
        {
          say: 'Fermat’s little theorem: if $p${p} is prime and does not divide $a${a}, then $a^{p-1} \\equiv 1${a to the p minus one is congruent to one} mod $p${p}. Let’s see why with $a = 3${a equals three} and $p = 7${p equals seven}.',
          do: (s, o) => o.card.reveal(),
        },
        {
          say: 'Multiply each nonzero residue by three: one, two, three, four, five, six go to three, six, two, five, one, four. Every residue is hit exactly once, so multiplying by three just shuffles them.',
          do: async (s, o) => {
            await s.all(o.labTop.fadeIn(), o.labBot.fadeIn(), ...o.top.map((m) => m.fadeIn()), ...o.bot.map((m) => m.fadeIn({ delay: 200 })));
            await s.stagger(o.arrows.map((a, i) => () => a.draw({ duration: 500 }).then(() => o.bot[PERM[i] - 1].indicate({ color: C.blue }))), 350);
          },
        },
        {
          say: 'So the product of all six, before and after shuffling, is the same mod seven. On the left, pull out six threes: three to the sixth times six factorial.',
          do: async (s, o) => {
            await o.prod.write({ duration: 1200 });
            await s.wait(300);
            await o.prod.swap(o.prod2);
          },
        },
        {
          say: 'Cancel six factorial, which is allowed because it is coprime to seven and so has an inverse. What remains is $3^6 \\equiv 1${three to the sixth is congruent to one} mod seven.',
          do: async (s, o) => {
            await s.all(s.strike([o.prod, 'f']), s.strike([o.prod, 'g']));
            await o.res.write({ duration: 1100 });
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-solve-congruence',
      kind: 'workout',
      title: 'Solve it',
      say: 'Grab paper: find an inverse with Euclid, then use it to solve the congruence.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate(rand) {
        const p = rand.pick([11, 13, 17, 19, 23, 29, 31]);
        const a = rand.int(2, p - 1);
        const b = rand.int(1, p - 1);
        return solveItem(p, a, b);
      },
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-congruence-proof',
      kind: 'workout',
      title: 'Work it out',
      say: 'Now a proof with congruences. Look for a base you can reduce.',
      prompt: 'Prove that for every $n \\in \\mathbb{N}$, $7 \\mid 3^{2n} - 2^n$.',
      answer: { type: 'proof' },
      hints: ['$3^{2n} = 9^n$.', 'What is $9$ mod $7$?'],
      solution: [
        '**Proof.** Let $n \\in \\mathbb{N}$. Note $3^{2n} = (3^2)^n = 9^n$.',
        'Since $9 \\equiv 2 \\pmod 7$ and congruences may be multiplied, $9^n \\equiv 2^n \\pmod 7$ (formally, by induction on $n$: multiply $9^k \\equiv 2^k$ by $9 \\equiv 2$).',
        'So $3^{2n} - 2^n = 9^n - 2^n \\equiv 0 \\pmod 7$, which means $7 \\mid 3^{2n} - 2^n$. Therefore the claim holds for every $n \\in \\mathbb{N}$. ∎',
      ],
      rubric: [
        'Either route earns full credit: (i) reduce $9 \\equiv 2$ and raise to the $n$-th power, or (ii) induction, using $3^{2(k+1)} - 2^{k+1} = 9(3^{2k} - 2^k) + 7 \\cdot 2^k$.',
        'Route (i): rewrites $3^{2n} = 9^n$ and reduces $9 \\equiv 2 \\pmod 7$. Route (ii): checks the base case $n = 1$ ($9 - 2 = 7$).',
        'Justifies the key step: raising the congruence to the $n$-th power (product rule, or induction), or the inductive step via the identity above.',
        'Concludes $7 \\mid 3^{2n} - 2^n$: from $\\equiv 0 \\pmod 7$ (route i), or because $7$ divides both terms (route ii).',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-mod-inverse',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap, explain in your own words when a number has an inverse mod $n${n}, and why.',
      prompt: 'Explain why $a$ has a multiplicative inverse modulo $n$ exactly when $\\gcd(a, n) = 1$.',
      points: [
        '$ab \\equiv 1 \\pmod n$ means $ab + ny = 1$ for some integer $y$.',
        'If such $b, y$ exist, any common divisor of $a$ and $n$ divides $1$, so $\\gcd(a, n) = 1$.',
        'Conversely, if $\\gcd(a, n) = 1$, Bézout gives $ax + ny = 1$, so $x$ is an inverse.',
        'The extended Euclidean algorithm computes the inverse.',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Congruence mod $n$ is an equivalence relation that respects $+$ and $\\times$: reduce whenever you like.', 120),
          recapItem(s, '• Powers by cycles; $a$ is invertible mod $n$ iff $\\gcd(a, n) = 1$; $ax \\equiv b$ is solvable iff $\\gcd(a, n) \\mid b$; Fermat: $a^{p-1} \\equiv 1$.', 260),
          recapItem(s, 'Next: counting.', 420, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'Congruence mod $n${n} is an equivalence relation that respects addition and multiplication, so you may reduce whenever you like.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Big powers fall to cycles; a number is invertible mod $n${n} exactly when it is coprime to $n${n}; linear congruences need the gcd to divide the right side; and Fermat says $a^{p-1} \\equiv 1${a to the p minus one is congruent to one} mod a prime.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time we start counting: products, permutations and combinations.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};

// Guard: the narration (literal clips) states these numbers.
if (CLK_TO !== 2 || REDUCE_ANS !== 4 || POWERS.join() !== '3,2,6,4,5,1' || POW_R !== 4 || POW_Q !== 16 || POW_ANS !== 4 || mod(YEAR, 9) !== 1 || DSUM !== 10 || FP_ANS !== 4 || INV7.inv !== 15 || LC_SOL.join() !== '4,9' || LC_INV2 !== 3 || LC_X !== 4 || PERM.join() !== '3,6,2,5,1,4' || WO.answer.value !== 7 || UNITS12.join() !== '1,5,7,11') {
  throw new Error('congruences lecture: data changed; update the narration');
}
