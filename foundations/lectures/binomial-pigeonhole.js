/**
 * Lecture 21 · The binomial theorem and pigeonhole (foundations/PLAN.md § 21). Liebeck 16.
 *
 * Choreography: the expansion of (x + y)³ is built by picking a letter from each factor (letters fly down into
 * words, the words sort themselves into columns by how many y's they hold); Pascal's row 3 flies into the
 * coefficients. Pigeonhole is shown literally: dots drop into boxes until one box must take two; in the number
 * theory examples the integers fly onto the residues of a clock, and into boxes of pairs or odd parts.
 */
import { C } from '../../lectern/src/core/stage.js';
import { ease } from '../../lectern/src/core/tween.js';

// ---------------------------------------------------------------- data (pure, computed)

const binom = (n, k) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
};
const ceilDiv = (a, b) => Math.ceil(a / b);

/** The 8 words of (x + y)³: word[i] picks y from factor j when bit (2 − j) of i is set. */
const WORDS = Array.from({ length: 8 }, (_, i) => [0, 1, 2].map((j) => ((i >> (2 - j)) & 1 ? 'y' : 'x')).join(''));
const YS = (w) => [...w].filter((c) => c === 'y').length;
const EXAMPLE = 2; // 'xyx'
const PASCAL = Array.from({ length: 6 }, (_, n) => Array.from({ length: n + 1 }, (_, k) => binom(n, k)));
const ROW4 = PASCAL[4];

// try-coefficient: coefficient of x^3 in (2x − 1)^5
const TC = { n: 5, k: 2, a: 2, b: -1 };
const TC_ANS = binom(TC.n, TC.k) * TC.a ** (TC.n - TC.k) * TC.b ** TC.k;

// fill-generalized
const PEOPLE = 100;
const AT_LEAST = ceilDiv(PEOPLE, 12);
const CARDS = 4 * 2 + 1;

// pigeon-numbers: n = 6, the first six integers land on different residues, the seventh collides.
const MODN = 6;
const PIGEONS = [14, 9, 25, 30, 17, 22, 38];
const RES = PIGEONS.map((v) => v % MODN);
const HIT = RES.findIndex((r, i) => RES.indexOf(r) < i);
const MATE = RES.indexOf(RES[HIT]);
const DIFF = PIGEONS[HIT] - PIGEONS[MATE];
if (HIT !== PIGEONS.length - 1 || DIFF % MODN) throw new Error('pigeon-numbers data');

const PAIRS = [1, 2, 3, 4].map((a) => [a, 9 - a]);
const CHOSEN = [2, 3, 5, 8, 6];
const pairOf = (v) => PAIRS.findIndex((p) => p.includes(v));
const PAIR_HIT = CHOSEN.findIndex((v, i) => CHOSEN.slice(0, i).some((u) => pairOf(u) === pairOf(v)));
const PAIR_MATE = CHOSEN.findIndex((u) => pairOf(u) === pairOf(CHOSEN[PAIR_HIT]));

// try-pigeon: from {1..20}, guarantee a pair summing to 21
const TP_N = 20;
const TP_ANS = TP_N / 2 + 1;

// divides-another: n = 5, six numbers from {1..10}
const DA_N = 5;
const DA = [3, 5, 6, 7, 9, 10].map((v) => {
  let a = 0, m = v;
  while (m % 2 === 0) (m /= 2), a++;
  return { v, a, m };
});
const ODDS = Array.from({ length: DA_N }, (_, i) => 2 * i + 1);

// wo-binomial
const termTex = (c, v) => (c === 1 ? v : c === -1 ? `-${v}` : `${c}${v}`);
const pw = (v, e) => (e === 0 ? '' : e === 1 ? v : `${v}^{${e}}`);
function binomialItem({ a, b, n, k }) {
  const base = `(${termTex(a, 'x')} ${b < 0 ? '-' : '+'} ${termTex(Math.abs(b), 'y')})^{${n}}`;
  const mono = `${pw('x', n - k)}${pw('y', k)}`;
  const C0 = binom(n, k);
  const ans = C0 * a ** (n - k) * b ** k;
  const par = (c) => (c < 0 ? `(${c})` : `${c}`);
  return {
    prompt: `Find the coefficient of $${mono}$ in $${base}$.`,
    answer: { type: 'number', value: ans },
    hints: [`The power of $y$ is $${k}$, so the term is $\\binom{${n}}{${k}}(${termTex(a, 'x')})^{${n - k}}(${termTex(b, 'y')})^{${k}}$.`, `Raise the coefficients too: $${par(a)}^{${n - k}}$ and $${par(b)}^{${k}}$.`],
    solution: [
      `The term with $${pw('y', k)}$ comes from choosing $${termTex(b, 'y')}$ in $${k}$ of the $${n}$ factors: $\\binom{${n}}{${k}}(${termTex(a, 'x')})^{${n - k}}(${termTex(b, 'y')})^{${k}}$.`,
      `Its coefficient is $\\binom{${n}}{${k}} \\cdot ${par(a)}^{${n - k}} \\cdot ${par(b)}^{${k}} = ${C0} \\cdot ${a ** (n - k)} \\cdot ${par(b ** k)} = ${ans}$.`,
    ],
  };
}
const WO_BIN = binomialItem({ a: 1, b: -2, n: 6, k: 2 });

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** A word like xyx as TeX: x blue, y red, each letter a part c0, c1, c2. */
const wordTex = (w) => [...w].map((c, i) => `\\part{c${i}}{\\col{${c === 'x' ? 'blue' : 'red'}}{${c}}}`).join('');
const PRODUCT = [1, 2, 3].map((j) => `(\\part{x${j}}{\\col{blue}{x}} + \\part{y${j}}{\\col{red}{y}})`).join('');
const COLS = [180, 380, 580, 780];
const TERMS = ['x^3', 'x^2y', 'xy^2', 'y^3'];

// ---------------------------------------------------------------- lecture

export default {
  id: 'binomial-pigeonhole',
  title: 'The binomial theorem and pigeonhole',
  goals: [
    'State and prove the binomial theorem (combinatorially), and extract coefficients',
    'Derive identities by substituting into the binomial theorem',
    'State the pigeonhole principle (simple and generalized) as a statement about functions',
    'Use pigeonhole to prove existence results in number theory and geometry',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'expand',
      title: 'Expanding by choosing',
      scene(s) {
        const prod = s.tex(PRODUCT, { y: 70, size: 44, visible: false });
        const words = WORDS.map((w, i) => s.tex(wordTex(w), { x: 95 + 110 * i, y: 175, size: 36, visible: false }));
        const slots = WORDS.map(() => 0);
        const target = WORDS.map((w) => {
          const k = YS(w);
          const j = slots[k]++;
          return [COLS[k], 255 + 53 * j];
        });
        const heads = TERMS.map((t, k) => s.tex(t, { x: COLS[k], y: 442, size: 36, visible: false }));
        const counts = TERMS.map((t, k) => s.tex(`\\binom{3}{${k}} = ${binom(3, k)}`, { x: COLS[k], y: 442, size: 30, color: C.green, visible: false }));
        const result = s.tex(`(x + y)^3 = x^3 + \\part{a}{${binom(3, 1)}}x^2y + ${binom(3, 2)}xy^2 + y^3`, { y: 532, size: 42, visible: false });
        return { prod, words, target, heads, counts, result };
      },
      steps: [
        {
          say: 'Multiply out $(x + y)^3${x plus y, cubed} without any algebra rules. Each term of the expansion picks an $x${x} or a $y${y} from every factor: here $x${x}, then $y${y}, then $x${x}.',
          do: async (s, o) => {
            await o.prod.write();
            const parts = ['x1', 'y2', 'x3'];
            const rings = [];
            for (const p of parts) {
              const r = s.ring([o.prod, p], { color: 'yellow', pad: 4 });
              rings.push(r);
              await r;
            }
            const w = o.words[EXAMPLE];
            const fly = parts.map((p, i) => {
              const from = o.prod.partBox(p);
              const to = w.partBox(`c${i}`);
              const m = s.tex(i === 1 ? '\\col{red}{y}' : '\\col{blue}{x}', { x: from.cx, y: from.cy, size: 44 });
              return m.animate({ x: to.cx, y: to.cy, scale: 36 / 44 }, { duration: 800 }).then(() => m);
            });
            const flown = await Promise.all(fly);
            await s.all(w.fadeIn({ shift: [0, 0], duration: 250 }), ...flown.map((m) => m.fadeOut({ duration: 250 })), ...rings.map((r) => r.fadeOut()));
          },
        },
        {
          say: 'Three factors, two choices each: eight words in all, and every one of them is a term of the product.',
          do: (s, o) => s.stagger(o.words.map((w, i) => () => (i === EXAMPLE ? w.indicate({ color: C.yellow }) : w.fadeIn())), 200),
        },
        {
          say: 'Sort the words by how many $y${y}\'s they contain. The coefficient of $x^2y${x squared y} counts the words with exactly one $y${y}, that is, the ways to choose which factor gives the $y${y}.',
          do: async (s, o) => {
            await s.all(o.words.map((w, i) => w.moveTo(...o.target[i], { duration: 1000, delay: i * 60 })));
            await s.stagger(o.heads.map((h) => () => h.fadeIn()), 150);
            o.col = s.ring(s.group(...o.words.filter((_, i) => YS(WORDS[i]) === 1)).box(), { color: 'yellow', pad: 10, shape: 'box' });
            await o.col;
          },
        },
        {
          say: 'There are $\\binom{3}{1} = 3${three choose one, which is three} ways to choose that factor, so the coefficient is three. The same count works in every column.',
          do: async (s, o) => {
            await s.all(o.heads.map((h, k) => h.morphTo(o.counts[k], { duration: 700, delay: k * 150 })));
            await o.col.fadeOut();
            await o.result.write({ duration: 1100 });
            await o.result.color('a', C.yellow);
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'binomial-theorem',
      title: 'The binomial theorem',
      scene(s) {
        const thm = s.tex('(x + y)^n = \\sum\\nolimits_{k=0}^{n} \\part{c}{\\binom{n}{k}}\\, \\part{t}{x^{n-k} y^k}', { y: 84, size: 38, visible: false });
        const why = s.text('coefficient of $x^{n-k}y^k$ = number of ways to choose the $k$ factors that give $y$', { x: 250, y: 202, size: 30, width: 400, visible: false });
        const factors = s.tex('\\underbrace{(x + y)(x + y)\\cdots(x + y)}_{\\normalsize n \\text{ factors}}', { x: 250, y: 332, size: 32, visible: false });
        const pick = s.tex('\\begin{gathered}\\text{pick } y \\text{ from } k \\text{ of them:}\\\\ \\binom{n}{k} \\text{ ways}\\end{gathered}', { x: 255, y: 451, size: 30, color: C.green, visible: false });
        const tri = PASCAL.map((row, n) => row.map((v, k) => s.tex(String(v), { x: 715 + (k - n / 2) * 58, y: 162 + n * 44, size: 32, visible: false })));
        const rule = s.tex('\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}', { x: 715, y: 455, size: 30, color: C.muted, visible: false });
        const exp = s.tex('(x + y)^3 = ' + [0, 1, 2, 3].map((k) => `\\part{s${k}}{\\boxed{\\phantom{0}}}\\,${TERMS[k]}`).join(' + '), { y: 548, size: 36, visible: false });
        const exp2 = s.tex('(x + y)^3 = ' + [0, 1, 2, 3].map((k) => `\\part{s${k}}{${binom(3, k)}}\\,${TERMS[k]}`).join(' + '), { y: 548, size: 36, visible: false });
        return { thm, why, factors, pick, tri, rule, exp, exp2 };
      },
      steps: [
        {
          say: 'The same counting works for any power. The coefficient of $x^{n-k}y^k${x to the n minus k, y to the k} is the number of ways to choose the $k${k} factors that give $y${y}.',
          do: async (s, o) => {
            await o.thm.write({ duration: 1200 });
            await s.all(o.thm.color('c', C.green), o.thm.color('t', C.blue));
            await o.why.fadeIn();
          },
        },
        {
          say: 'And that is the whole proof. A term that picks $y${y} from $k${k} of the $n${n} factors, and $x${x} from the rest, multiplies out to $x^{n-k}y^k${x to the n minus k, y to the k}, and there are $\\binom{n}{k}${n choose k} ways to choose those $k${k} factors.',
          do: async (s, o) => {
            await o.factors.write({ duration: 1000 });
            await o.pick.fadeIn();
            await o.thm.indicate({ color: C.green, scale: 1.06 });
          },
        },
        {
          say: 'Pascal\'s rule from last lecture builds all these numbers: each entry is the sum of the two above it, like $6 = 3 + 3${six equals three plus three}.',
          do: async (s, o) => {
            for (const row of o.tri) await s.all(row.map((m, k) => m.fadeIn({ delay: k * 40 })));
            await o.rule.fadeIn();
            const [a, b, c] = [o.tri[3][1], o.tri[3][2], o.tri[4][2]];
            await s.all(a.recolor(C.blue), b.recolor(C.blue));
            await c.indicate({ color: C.green, keep: true });
          },
        },
        {
          say: 'Row three of the triangle is exactly the list of coefficients we counted for $(x + y)^3${x plus y, cubed}: one, three, three, one.',
          do: async (s, o) => {
            await o.exp.fadeIn();
            const row = o.tri[3];
            await s.all(row.map((m) => m.recolor(C.green)));
            const fly = row.map((m, k) => {
              const to = o.exp.partBox(`s${k}`);
              const c = s.tex(String(binom(3, k)), { x: m.x, y: m.y, size: 32, color: C.green });
              return c.animate({ x: to.cx, y: to.cy, scale: 36 / 32 }, { duration: 900, delay: k * 120 }).then(() => c);
            });
            const flown = await Promise.all(fly);
            await s.all(o.exp.fadeOut({ duration: 250 }), o.exp2.fadeIn({ shift: [0, 0], duration: 250 }), ...flown.map((c) => c.fadeOut({ duration: 250 })));
            await s.all([0, 1, 2, 3].map((k) => o.exp2.color(`s${k}`, C.green)));
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'try-coefficient',
      kind: 'try',
      title: 'A coefficient',
      say: 'Your turn. Find one coefficient, and watch the constants inside the parentheses.',
      prompt: 'What is the coefficient of $x^3$ in $(2x - 1)^5$?',
      answer: { type: 'number', value: TC_ANS },
      hint: `The term is $\\binom{5}{3}(2x)^3(-1)^2$.`,
      solution: [
        `The $x^3$ term picks $2x$ from $3$ factors and $-1$ from the other $2$: $\\binom{5}{3}(2x)^3(-1)^2$.`,
        `Its coefficient is $${binom(5, 3)} \\cdot ${2 ** 3} \\cdot 1 = ${TC_ANS}$. Forgetting to cube the $2$ gives $10$, a common slip.`,
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'substitute',
      title: 'Identities by substitution',
      scene(s) {
        const thm = s.tex('(\\part{x}{x} + \\part{y}{y})^n = \\sum\\nolimits_{k=0}^{n} \\binom{n}{k}\\, \\part{x2}{x}^{n-k} \\part{y2}{y}^k', { y: 76, size: 32, visible: false });
        const labA = s.text('$x = y = 1$:', { x: 60, y: 180, size: 32, anchor: [0, 0.5], color: C.blue, visible: false });
        const subA = s.tex('(1 + 1)^n = \\sum\\nolimits_{k=0}^{n} \\binom{n}{k}\\, 1^{n-k} 1^k', { x: 620, y: 180, size: 36, visible: false });
        const resA = s.tex('\\sum\\nolimits_{k=0}^{n} \\binom{n}{k} = 2^n', { x: 620, y: 180, size: 36, visible: false });
        const rowA = s.tex(ROW4.join(' + ') + ` = ${ROW4.reduce((a, b) => a + b, 0)} = 2^4`, { x: 620, y: 262, size: 32, color: C.muted, visible: false });
        const labB = s.text('$x = 1,\\ y = -1$:', { x: 60, y: 345, size: 32, anchor: [0, 0.5], color: C.blue, visible: false });
        const subB = s.tex('(1 - 1)^n = \\sum\\nolimits_{k=0}^{n} \\binom{n}{k}\\, 1^{n-k} (-1)^k', { x: 620, y: 345, size: 36, visible: false });
        const resB = s.tex('\\sum\\nolimits_{k=0}^{n} (-1)^k \\binom{n}{k} = 0 \\quad (n \\ge 1)', { x: 620, y: 345, size: 36, visible: false });
        const alt = ROW4.map((v, k) => (k === 0 ? `\\part{e${k}}{${v}}` : `${k % 2 ? '-' : '+'} \\part{${k % 2 ? 'o' : 'e'}${k}}{${v}}`)).join(' ') + ' = 0';
        const rowB = s.tex(alt, { x: 620, y: 427, size: 32, visible: false });
        const even = ROW4.filter((_, k) => k % 2 === 0);
        const odd = ROW4.filter((_, k) => k % 2 === 1);
        const split = s.tex(`\\underbrace{${even.join(' + ')}}_{\\normalsize\\text{even size}} = \\underbrace{${odd.join(' + ')}}_{\\normalsize\\text{odd size}} = ${odd.reduce((a, b) => a + b, 0)} = 2^{3}`, { x: 480, y: 515, size: 32, visible: false });
        return { thm, labA, subA, resA, rowA, labB, subB, resB, rowB, split };
      },
      steps: [
        {
          say: 'The binomial theorem is an identity of polynomials, so it stays true when you plug in numbers. Set $x = y = 1${x equals y equals one}: the sum of a whole row of Pascal\'s triangle is $2^n${two to the n}.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await s.all(o.thm.color('x', C.blue), o.thm.color('y', C.blue), o.thm.color('x2', C.blue), o.thm.color('y2', C.blue));
            await o.labA.fadeIn({ shift: [-12, 0] });
            const copy = s.tex(o.thm.latex, { x: o.thm.x, y: o.thm.y, size: 32 });
            await copy.morphTo(o.subA, { duration: 900 });
            await s.wait(300);
            await o.subA.morphTo(o.resA, { duration: 700 });
            await o.rowA.fadeIn();
          },
        },
        {
          say: 'Now set $x = 1${x equals one} and $y = -1${y equals minus one}. The left side is zero, so the alternating sum of every row after row zero is zero: in row four, $1 - 4 + 6 - 4 + 1 = 0${one minus four plus six minus four plus one equals zero}.',
          do: async (s, o) => {
            await o.labB.fadeIn({ shift: [-12, 0] });
            const copy = s.tex(o.thm.latex, { x: o.thm.x, y: o.thm.y, size: 32 });
            await copy.morphTo(o.subB, { duration: 900 });
            await s.wait(300);
            await o.subB.morphTo(o.resB, { duration: 700 });
            await o.rowB.write();
          },
        },
        {
          say: 'Read it as counting. $\\binom{n}{k}${n choose k} counts the subsets of size $k${k}, so the alternating sum says there are as many even-size subsets as odd-size ones.',
          do: async (s, o) => {
            await s.all([0, 2, 4].map((k) => o.rowB.color(`e${k}`, C.green)));
            await s.all([1, 3].map((k) => o.rowB.color(`o${k}`, C.teal)));
          },
        },
        {
          say: 'Together they make all $2^n${two to the n} subsets, so each kind is exactly half: $2^{n-1}${two to the n minus one}. For $n = 4${n equals four}, eight and eight.',
          do: async (s, o) => {
            await o.split.write({ duration: 1200 });
            await o.split.flash({ color: C.green });
          },
        },
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'pigeonhole',
      title: 'The pigeonhole principle',
      scene(s) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const cx = (i) => 84 + 72 * i;
        const boxes = months.map((_, i) => s.rect(cx(i) - 32, 110, 64, 86, { color: C.muted, radius: 10, width: 3, visible: false }));
        const labels = months.map((m, i) => s.text(m, { x: cx(i), y: 222, size: 30, color: C.muted, visible: false }));
        const dots = Array.from({ length: 13 }, (_, i) => s.dot(96 + 64 * i, 58, { r: 12, color: i === 12 ? C.orange : C.blue, visible: false }));
        const fmap = s.text('$f(\\text{person}) = \\text{birth month}$: 13 people, 12 months', { y: 262, size: 30, color: C.muted, visible: false });
        const card1 = s.defCard({ y: 332, title: false, tex: 'A, B \\text{ finite},\\ \\lvert A \\rvert > \\lvert B \\rvert \\implies \\text{no } f\\colon A \\to B \\text{ is injective}', visible: false });
        const card2 = s.defCard({ y: 418, title: false, tex: 'N \\text{ objects in } k \\text{ boxes} \\implies \\text{some box holds} \\ge \\lceil N/k \\rceil', visible: false });
        const proof = s.text('*Proof.* If every box held at most $\\lceil N/k \\rceil - 1 < N/k$ objects, there would be fewer than $k \\cdot N/k = N$ objects in all. ∎', { y: 522, size: 30, width: 860, visible: false });
        return { boxes, labels, dots, cx, fmap, card1, card2, proof };
      },
      steps: [
        {
          say: 'Thirteen people, twelve months. Even if the first twelve land in twelve different months, the thirteenth person must land in a month that is already taken.',
          do: async (s, o) => {
            await s.all(o.boxes.map((b, i) => b.fadeIn({ delay: i * 30 })), o.labels.map((l, i) => l.fadeIn({ delay: i * 30 })));
            await s.all(o.dots.map((d, i) => d.draw({ delay: i * 40 })));
            await s.all(o.dots.slice(0, 12).map((d, i) => d.moveTo(o.cx(i), 172, { delay: i * 70, duration: 600, ease: ease.out })));
            await o.dots[12].moveTo(o.cx(0), 134, { duration: 800 });
            await s.all(o.boxes[0].recolor(C.yellow), o.dots[12].recolor(C.yellow), o.dots[0].recolor(C.yellow), o.labels[0].recolor(C.yellow));
            await o.boxes[0].flash({ color: C.yellow });
          },
        },
        {
          say: 'In the language of functions: send each person to their birth month. A function from a bigger finite set to a smaller one cannot be injective; two inputs must share an output.',
          do: async (s, o) => {
            await o.fmap.fadeIn();
            await o.card1.reveal();
          },
        },
        {
          say: 'The generalized version: $N${N} objects in $k${k} boxes force some box to hold at least $\\lceil N/k \\rceil${the ceiling of N over k} of them. Thirteen in twelve gives a box with two.',
          do: (s, o) => o.card2.reveal(),
        },
        {
          say: 'The proof is one line. If every box held fewer than that many, each would hold less than $N/k${N over k}, and all $k${k} boxes together would hold fewer than $N${N} objects.',
          do: (s, o) => o.proof.write({ duration: 1500 }),
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-generalized',
      kind: 'blanks',
      title: 'How many at least?',
      say: 'Fill in the two numbers using the generalized pigeonhole principle.',
      prompt: 'Use $N$ objects in $k$ boxes $\\implies$ some box holds at least $\\lceil N/k \\rceil$. Give the best possible numbers.',
      lines: [
        [`\\text{Among } ${PEOPLE} \\text{ people, the largest number sure to share a birth month is }`, { id: 'a', answer: { type: 'number', value: AT_LEAST }, hint: 'The boxes are the 12 months.' }],
        ['\\text{The fewest cards that guarantee } 3 \\text{ of the same suit: }', { id: 'b', answer: { type: 'number', value: CARDS }, hint: 'How many cards can you hold with at most 2 of each suit?' }],
      ],
      solution: [
        `$\\lceil ${PEOPLE}/12 \\rceil = ${AT_LEAST}$: twelve months holding at most $${AT_LEAST - 1}$ people each hold at most $${12 * (AT_LEAST - 1)} < ${PEOPLE}$. No more is guaranteed: $${PEOPLE - 12 * (AT_LEAST - 1)}$ months with $${AT_LEAST}$ people and $${12 - (PEOPLE - 12 * (AT_LEAST - 1))}$ months with $${AT_LEAST - 1}$ make $${PEOPLE}$ people, and no month has $${AT_LEAST + 1}$.`,
        `With $8$ cards you could have exactly $2$ of each of the $4$ suits, so $8$ is not enough; with $${CARDS}$ cards, $\\lceil ${CARDS}/4 \\rceil = 3$ forces three of one suit. So $${CARDS}$ is the fewest.`,
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'pigeon-numbers',
      title: 'Pigeonhole in number theory',
      scene(s) {
        const claim = s.text('Among any $n + 1$ integers, two differ by a multiple of $n$.', { y: 50, size: 32, visible: false });
        const clock = s.modClock({ n: MODN, x: 270, y: 330, r: 125, nodeR: 28, size: 34, visible: false });
        const holes = s.text('holes: remainders mod $6$', { x: 270, y: 330, size: 30, color: C.muted, width: 150, visible: false });
        const nums = PIGEONS.map((v, i) => s.tex(String(v), { x: 520 + 62 * i, y: 115, size: 34, color: C.blue, visible: false }));
        const pigLabel = s.text('pigeons: $7$ integers', { x: 706, y: 168, size: 30, color: C.muted, visible: false });
        const diff = s.tex(`${PIGEONS[HIT]} - ${PIGEONS[MATE]} = ${DIFF} = ${DIFF / MODN} \\cdot ${MODN}`, { x: 720, y: 320, size: 38, color: C.green, visible: false });
        const why = s.text('same remainder $\\implies$ the difference is a multiple of $n$', { x: 720, y: 395, size: 30, width: 380, visible: false });
        // second example
        const claim2 = s.text('Any $5$ numbers from $\\{1, \\dots, 8\\}$ include two that sum to $9$.', { y: 50, size: 32, visible: false });
        const px = (i) => 165 + 210 * i;
        const pboxes = PAIRS.map((_, i) => s.rect(px(i) - 85, 250, 170, 140, { color: C.muted, radius: 14, width: 3, visible: false }));
        const plabels = PAIRS.map((p, i) => s.tex(`\\{${p[0]}, ${p[1]}\\}`, { x: px(i), y: 282, size: 32, color: C.muted, visible: false }));
        const chosen = CHOSEN.map((v, i) => s.tex(String(v), { x: 340 + 70 * i, y: 150, size: 38, color: C.blue, visible: false }));
        const sum = s.tex(`${CHOSEN[PAIR_MATE]} + ${CHOSEN[PAIR_HIT]} = 9`, { y: 470, size: 40, color: C.green, visible: false });
        return { claim, clock, holes, nums, pigLabel, diff, why, claim2, px, pboxes, plabels, chosen, sum };
      },
      steps: [
        {
          say: 'In number theory the whole art is choosing the holes. To prove this claim with $n = 6${n equals six}, the holes are the six possible remainders when dividing by six.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await o.clock.fadeIn();
            await o.holes.fadeIn();
          },
        },
        {
          say: 'The pigeons are seven integers. Drop each onto its remainder: six of them can all land in different places, but the seventh has nowhere new to go.',
          do: async (s, o) => {
            await s.all(o.nums.map((m, i) => m.fadeIn({ delay: i * 60 })), o.pigLabel.fadeIn());
            const used = new Map();
            for (let i = 0; i < PIGEONS.length; i++) {
              const r = RES[i];
              const ring = used.get(r) ?? 0;
              used.set(r, ring + 1);
              const [px, py] = o.clock.polar(r, o.clock.r + 62 + ring * 70);
              await s.all(o.nums[i].moveTo(o.clock.x + px, o.clock.y + py, { duration: 650 }), o.clock.highlight(r, ring ? 'yellow' : 'blue'));
            }
            await s.all(o.nums[HIT].recolor(C.yellow), o.nums[MATE].recolor(C.yellow), o.pigLabel.fadeOut());
          },
        },
        {
          say: 'Two integers with the same remainder differ by a multiple of six: $38 - 14 = 24${thirty-eight minus fourteen equals twenty-four}. In general, if $a = qn + r${a equals q n plus r} and $b = q\'n + r${b equals q prime n plus r}, then $a - b = (q - q\')n${a minus b equals q minus q prime, times n}.',
          do: async (s, o) => {
            await o.diff.write();
            await o.why.fadeIn();
          },
        },
        {
          say: 'A second example: any five numbers from one to eight include two that sum to nine. The holes are the four pairs that sum to nine.',
          do: async (s, o) => {
            await s.all([o.claim, o.clock, o.holes, o.diff, o.why, ...o.nums].map((m) => m.fadeOut()));
            await o.claim2.fadeIn();
            await s.all(o.pboxes.map((b, i) => b.fadeIn({ delay: i * 80 })), o.plabels.map((l, i) => l.fadeIn({ delay: i * 80 })));
          },
        },
        {
          say: 'Five pigeons, four holes. Two chosen numbers land in the same pair, and two different numbers of one pair sum to nine.',
          do: async (s, o) => {
            await s.all(o.chosen.map((m, i) => m.fadeIn({ delay: i * 60 })));
            const fill = [0, 0, 0, 0];
            for (let i = 0; i < CHOSEN.length; i++) {
              const h = pairOf(CHOSEN[i]);
              const j = fill[h]++;
              await o.chosen[i].moveTo(o.px(h) + (j ? 36 : -36), 345, { duration: 600 });
            }
            const h = pairOf(CHOSEN[PAIR_HIT]);
            await s.all(o.pboxes[h].recolor(C.yellow), o.chosen[PAIR_HIT].recolor(C.yellow), o.chosen[PAIR_MATE].recolor(C.yellow));
            await o.sum.write();
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'try-pigeon',
      kind: 'try',
      title: 'Pigeonhole',
      say: 'Now you choose the holes.',
      prompt: `How many numbers must you choose from $\\{1, \\dots, ${TP_N}\\}$ to guarantee that two of them sum to $${TP_N + 1}$?`,
      answer: { type: 'number', value: TP_ANS },
      hint: `Pair up the numbers that sum to $${TP_N + 1}$.`,
      solution: [
        `The holes are the $${TP_N / 2}$ pairs $\\{1, ${TP_N}\\}, \\{2, ${TP_N - 1}\\}, \\dots, \\{${TP_N / 2}, ${TP_N / 2 + 1}\\}$; every number lies in exactly one.`,
        `With $${TP_ANS}$ numbers, two land in the same pair, and two different numbers of one pair sum to $${TP_N + 1}$.`,
        `$${TP_N / 2}$ numbers are not enough: $1, 2, \\dots, ${TP_N / 2}$ contain no such pair (the largest sum is $${TP_N - 1}$). So the answer is $${TP_ANS}$.`,
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'divides-another',
      title: 'A classic',
      scene(s) {
        const claim = s.text('Pick $n + 1$ numbers from $\\{1, \\dots, 2n\\}$: one divides another.', { y: 48, size: 30, visible: false });
        const nx = (i) => 130 + 140 * i;
        const nums = DA.map((d, i) => s.tex(String(d.v), { x: nx(i), y: 108, size: 38, color: C.blue, visible: false }));
        const forms = DA.map((d, i) => s.tex(`2^{${d.a}} \\cdot \\part{m}{${d.m}}`, { x: nx(i), y: 170, size: 32, visible: false }));
        const bx = (i) => 140 + 170 * i;
        const boxes = ODDS.map((_, i) => s.rect(bx(i) - 75, 255, 150, 150, { color: C.muted, radius: 14, width: 3, visible: false }));
        const blabels = ODDS.map((m, i) => s.tex(`m = ${m}`, { x: bx(i), y: 287, size: 30, color: C.muted, visible: false }));
        const a = DA.find((d) => d.v === 3), b = DA.find((d) => d.v === 6);
        const concl = s.tex(`${a.v} = 2^{${a.a}} \\cdot ${a.m},\\ \\ ${b.v} = 2^{${b.a}} \\cdot ${b.m} \\implies ${a.v} \\mid ${b.v}`, { y: 482, size: 38, color: C.green, visible: false });
        const gen = s.text('Same odd part $m$: $2^a m \\mid 2^b m$ when $a \\le b$.', { y: 545, size: 30, visible: false });
        return { claim, nums, forms, bx, boxes, blabels, concl, gen };
      },
      steps: [
        {
          say: 'Here $n = 5${n equals five}: six numbers chosen from one to ten. Every positive integer can be written as a power of two times an odd number, $2^a m${two to the a times m}.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await s.all(o.nums.map((m, i) => m.fadeIn({ delay: i * 70 })));
            await s.all(o.forms.map((f, i) => f.write({ delay: i * 150, duration: 600 })));
            await s.all(o.forms.map((f) => f.color('m', C.orange)));
          },
        },
        {
          say: 'The odd part is a hole. The odd numbers below $2n${two n} are $1, 3, \\dots, 2n - 1${one, three, up to two n minus one}: only $n${n} holes for $n + 1${n plus one} pigeons. Here that is five holes for six numbers.',
          do: async (s, o) => {
            await s.all(o.boxes.map((b, i) => b.fadeIn({ delay: i * 70 })), o.blabels.map((l, i) => l.fadeIn({ delay: i * 70 })));
            const fill = ODDS.map(() => 0);
            for (let i = 0; i < DA.length; i++) {
              const h = ODDS.indexOf(DA[i].m);
              const j = fill[h]++;
              const c = s.tex(String(DA[i].v), { x: o.nums[i].x, y: o.nums[i].y, size: 38, color: C.blue });
              const shares = DA.filter((d) => d.m === DA[i].m).length > 1;
              await c.moveTo(o.bx(h) + (shares ? (j ? 34 : -34) : 0), 350, { duration: 600 });
            }
            const shared = ODDS.map((m, h) => (DA.filter((d) => d.m === m).length > 1 ? h : -1)).filter((h) => h >= 0);
            await s.all(shared.map((h) => o.boxes[h].recolor(C.yellow)));
          },
        },
        {
          say: 'Two numbers share an odd part, like three and six. Then the one with the smaller power of two divides the other: six is two times three. Five and ten share a hole too.',
          do: async (s, o) => {
            await o.concl.write({ duration: 1100 });
            await o.gen.fadeIn();
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'pigeon-writing',
      title: 'Writing a pigeonhole proof',
      scene(s) {
        const thm = s.text('**Claim.** Any $5$ numbers from $\\{1, \\dots, 8\\}$ include two that sum to $9$.', { y: 46, size: 30, visible: false });
        const p = s.proof({ y: 82, width: 900, height: 400, size: 30, whyWidth: 250 });
        const bad = s.text('“By pigeonhole, two of them sum to $9$.” ∎', { x: 380, y: 530, size: 32, visible: false });
        const st = s.stamp('not a proof', { x: 810, y: 530 });
        return { thm, p, bad, st };
      },
      steps: [
        {
          say: 'A pigeonhole proof names three things: the pigeons, the holes, and the map that puts each pigeon in a hole. Every pigeon must land in exactly one hole.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.p.add('**Proof.** Pigeons: the $5$ chosen numbers.', { kind: 'assume', why: 'name the pigeons' });
            await o.p.add('Holes: $\\{1, 8\\}, \\{2, 7\\}, \\{3, 6\\}, \\{4, 5\\}$.', { why: 'name the holes' });
            o.map = o.p.add('Each number lies in exactly one pair.', { why: 'the map' });
            await o.map;
            await o.p.highlight(o.map, 'yellow');
          },
        },
        {
          say: 'Then count both and compare: five pigeons, four holes, and five is more than four.',
          do: async (s, o) => {
            await o.p.unhighlight(o.map);
            o.count = o.p.add('$5 > 4$, so two numbers share a pair.', { why: 'pigeonhole' });
            await o.count;
            await o.p.highlight(o.count, 'yellow');
          },
        },
        {
          say: 'Finally, say what sharing a hole gives you. Two different numbers in one pair sum to nine, which is the claim.',
          do: async (s, o) => {
            await o.p.unhighlight(o.count);
            await o.p.add('Two different numbers of a pair sum to $9$.', { kind: 'conclude', why: 'what sharing gives' });
            await o.p.qed();
          },
        },
        {
          say: 'Here is the version that loses credit: by pigeonhole, done. Without the holes and the map named, the reader cannot check anything.',
          do: async (s, o) => {
            await o.bad.fadeIn();
            await s.strike(o.bad);
            await o.st.slam();
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-pigeon',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Name your pigeons, your holes and your map, then write the proof.',
      prompt: 'Prove that among any $5$ points in a square of side $1$, some two are at distance at most $\\frac{\\sqrt 2}{2}$.',
      answer: { type: 'proof' },
      hints: ['Cut the square into $4$ pieces.', 'What is the longest distance between two points of a square of side $\\tfrac12$?'],
      solution: [
        '**Proof.** Divide the unit square into four closed squares of side $\\tfrac12$ by joining the midpoints of opposite sides. These four squares cover the unit square.',
        'Assign each of the $5$ points to one small square containing it (a point on a shared edge is assigned to any one of its squares).',
        'There are $5$ points and $4$ squares, and $5 > 4$, so by the pigeonhole principle two of the points are assigned to the same small square.',
        'If $(x_1, y_1)$ and $(x_2, y_2)$ lie in one small square, then $\\lvert x_1 - x_2 \\rvert \\le \\tfrac12$ and $\\lvert y_1 - y_2 \\rvert \\le \\tfrac12$, so their distance is at most $\\sqrt{\\tfrac14 + \\tfrac14} = \\frac{\\sqrt 2}{2}$. Therefore some two of the points are at distance at most $\\frac{\\sqrt 2}{2}$. ∎',
      ],
      rubric: [
        'Explicit holes: four small squares of side $\\tfrac12$ that cover the big square.',
        'Pigeons and assignment stated, including points on shared edges.',
        'The pigeonhole count $5 > 4$.',
        'The diagonal bound $\\frac{\\sqrt 2}{2}$ justified for two points in one small square.',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-binomial',
      kind: 'workout',
      title: 'A coefficient',
      say: 'One more coefficient. Keep track of the signs.',
      prompt: WO_BIN.prompt,
      answer: WO_BIN.answer,
      hints: ['Which $k$ gives $y^2$?', 'Don’t forget the $(-2)^2$.'],
      solution: WO_BIN.solution,
      generate: (rand) => {
        const a = rand.pick([1, 2, 3]);
        const b = rand.pick([-3, -2, -1, 1, 2, 3]);
        const n = rand.int(4, 8);
        const k = rand.int(1, n - 1);
        return binomialItem({ a, b, n, k });
      },
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-pigeonhole',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap, explain the pigeonhole principle in your own words.',
      prompt: 'State the pigeonhole principle as a fact about functions, and explain how you choose pigeons and holes in a proof.',
      points: [
        'A function from a finite set to a smaller finite set is not injective.',
        'Pigeons are the objects, holes are the categories, and the function assigns each object a category.',
        'The holes must be chosen so that “two in one hole” gives exactly what you want to prove.',
        'Generalized version: $N$ objects in $k$ boxes put at least $\\lceil N/k \\rceil$ in some box.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Binomial theorem by choosing: the coefficient of $x^{n-k}y^k$ is $\\dbinom{n}{k}$. Substitute numbers to get identities.', 130),
          recapItem(s, '• Pigeonhole: name the pigeons, the holes and the map; count; say what sharing a hole gives.', 260),
          recapItem(s, 'Next: comparing the sizes of infinite sets.', 400, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'The binomial theorem is a counting argument: choose which factors give $y${y}. Plug in numbers to get identities like the row sums of Pascal\'s triangle.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'For pigeonhole proofs, name the pigeons, the holes and the map, count both, and say what two pigeons in one hole gives you.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time we leave finite sets behind and ask what it means for two infinite sets to have the same size.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
