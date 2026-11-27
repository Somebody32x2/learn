/**
 * Lecture 17 · Divisibility and the division algorithm (foundations/PLAN.md § 17). Irani · Integers · Liebeck 10.
 *
 * Choreography: a number line with the multiples of b marked shows a landing between two of them (q rounds down,
 * the remainder is the gap, braced in yellow); the existence proof marks the set S on a number line and boxes its
 * least element; uniqueness squeezes a multiple of b into (−b, b); remainder cases slide a three-wide window along
 * the integers; base-7 digits fly out of the repeated divisions into the expansion.
 */
import { C } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, no DOM)

/** Quotient and remainder with 0 ≤ r < b (floor division). */
const qr = (a, b) => {
  const q = Math.floor(a / b);
  return { a, b, q, r: a - b * q };
};
const paren = (v) => (v < 0 ? `(${v})` : String(v));
const eqTex = ({ a, b, q, r }) => `${a} = ${b} \\cdot ${paren(q)} + ${r}`;

const POS = qr(17, 5); // q 3, r 2
const NEG = qr(-17, 5); // q −4, r 3
const FILL_QR = [qr(-17, 5), qr(17, 5), qr(-30, 7)];
const WO_QR = qr(-83, 9);

/** Remainders of n² mod 4 (n = 0..3 covers every class). */
const SQ_REM = [...new Set([0, 1, 2, 3].map((n) => (n * n) % 4))].sort((x, y) => x - y);
/** Remainders of n² − 2 mod 4. */
const NOT4 = [...new Set([0, 1, 2, 3].map((n) => (((n * n - 2) % 4) + 4) % 4))].sort((x, y) => x - y);

/** Repeated division of N by B: rows { n, q, r } until the quotient is 0. */
function baseRows(N, B) {
  const rows = [];
  for (let n = N; n > 0; n = Math.floor(n / B)) rows.push({ n, q: Math.floor(n / B), r: n % B });
  return rows;
}
const BASE_N = 2026, BASE_B = 7;
const BASE = baseRows(BASE_N, BASE_B);
const DIGITS = BASE.map((row) => row.r).reverse(); // most significant first
const CHECK_TERMS = DIGITS.map((d, i) => ({ d, p: BASE_B ** (DIGITS.length - 1 - i) }));

/** The q, r workout, shared by the fixed problem and generate(). */
function qrItem({ a, b }) {
  const x = qr(a, b);
  return {
    prompt: `Find the quotient and remainder when $a = ${a}$ is divided by $b = ${b}$. Enter $(q, r)$.`,
    answer: { type: 'vector', value: [String(x.q), String(x.r)] },
    hints: [`Find the largest multiple of ${b} that is $\\le ${a}$.`, `$${b} \\cdot ${paren(x.q)} = ${b * x.q}$.`],
    solution: [
      `The largest multiple of $${b}$ at or below $${a}$ is $${b} \\cdot ${paren(x.q)} = ${b * x.q}$, so $q = ${x.q}$.`,
      `Then $r = ${a} - (${b * x.q}) = ${x.r}$, and $${eqTex(x)}$ with $0 \\le ${x.r} < ${b}$.`,
    ],
  };
}

// ---------------------------------------------------------------- helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });
const minus = (v) => String(v).replace('-', '−');

// ---------------------------------------------------------------- lecture

export default {
  id: 'division',
  title: 'Divisibility and the division algorithm',
  goals: [
    'Use basic properties of divisibility, including $a \\mid b,\\ a \\mid c \\Rightarrow a \\mid (bx + cy)$',
    'State the division algorithm and prove existence (well-ordering) and uniqueness of $q$ and $r$',
    'Compute quotients and remainders, including for negative dividends',
    'Use remainder cases to prove statements about all integers',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'divisibility-props',
      title: 'Facts about divisibility',
      scene(s) {
        const X = 70;
        const facts = [
          ['1 \\mid n \\quad \\text{and} \\quad n \\mid 0', '$n = 1 \\cdot n$ and $0 = n \\cdot 0$.'],
          ['a \\mid b,\\ a \\mid c \\implies a \\mid (bx + cy) \\ \\text{ for all } x, y \\in \\mathbb{Z}', '$b = ak$, $c = a\\ell$ give $bx + cy = a(kx + \\ell y)$.'],
          ['a \\mid b,\\ b \\ne 0 \\implies \\lvert a \\rvert \\le \\lvert b \\rvert', '$b = ak$ with $k \\ne 0$, so $\\lvert b \\rvert = \\lvert a \\rvert \\lvert k \\rvert \\ge \\lvert a \\rvert$.'],
          ['a \\mid b,\\ b \\mid a \\implies a = \\pm b', 'if $b \\ne 0$, then $a \\ne 0$, so $\\lvert a \\rvert \\le \\lvert b \\rvert \\le \\lvert a \\rvert$ and $a = \\pm b$; if $b = 0$, then $a = 0 = b$.'],
        ].map(([tex, sketch], i) => ({
          fact: s.tex(tex, { x: X, y: 50 + i * 112, size: 34, anchor: [0, 0.5], visible: false }),
          sketch: s.text(sketch, { x: X + 30, y: i === 3 ? 130 + i * 112 : 108 + i * 112, size: 30, anchor: [0, 0.5], width: 800, align: 'left', color: C.muted, visible: false }),
        }));
        const ex = s.tex('3 \\mid 12,\\ 3 \\mid 9 \\implies 3 \\mid 2 \\cdot 12 - 1 \\cdot 9 = 15', { x: 480, y: 547, size: 34, color: C.yellow, visible: false });
        const pnote = s.text('So $p \\mid 1$ would force $\\lvert p \\rvert \\le 1$: no prime divides $1$.', { x: 480, y: 547, size: 30, color: C.yellow, visible: false });
        return { facts, ex, pnote };
      },
      steps: [
        {
          say: 'A handful of facts follow from the definition of divides in a line or two each. One divides everything, everything divides zero, and so on: each proof is just a witness.',
          do: async (s, o) => {
            await s.stagger(o.facts.map((f) => () => f.fact.fadeIn({ shift: [-12, 0] })), 400);
            await s.stagger(o.facts.map((f) => () => f.sketch.fadeIn()), 400);
          },
        },
        {
          say: 'The one we use most: if $a${a} divides both $b${b} and $c${c}, it divides every combination $bx + cy${b x plus c y}. For example, three divides twelve and nine, so it divides $2 \\cdot 12 - 9 = 15${two times twelve minus nine, which is fifteen}.',
          do: async (s, o) => {
            o.r1 = s.ring(o.facts[1].fact, { color: 'yellow', shape: 'box', pad: 8 });
            await o.r1;
            await o.ex.write({ duration: 1000 });
          },
        },
        {
          say: 'The size fact says a nonzero multiple of $a${a} is at least as big as $a${a} in absolute value. That is why $p \\mid 1${p divides one} was a contradiction earlier: a prime is bigger than one.',
          do: async (s, o) => {
            await s.all(o.r1.fadeOut(), o.ex.fadeOut());
            await s.ring(o.facts[2].fact, { color: 'yellow', shape: 'box', pad: 8 });
            await o.pnote.fadeIn();
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'division-algorithm',
      title: 'Division with remainder',
      scene(s) {
        const card = s.defCard({
          y: 116, width: 880, title: 'The division algorithm',
          body: 'For $a \\in \\mathbb{Z}$ and $b \\in \\mathbb{N}$ there are unique $q, r \\in \\mathbb{Z}$ with $a = bq + r$ and $0 \\le r < b$.',
          visible: false,
        });
        const nl = s.numberLine({ x: 480, y: 290, width: 820, range: [-22, 22], ticks: 1, labels: (v) => (v % 5 === 0 ? minus(v) : null), size: 30, visible: false });
        const X = (v) => 480 + nl.toX(v);
        const brace = (lo, hi, label) => s.brace(X(lo), 360, X(hi), 360, { side: 'below', label, size: 30, color: C.yellow, visible: false });
        const b1 = brace(POS.b * POS.q, POS.a, `r = ${POS.r}`);
        const b2 = brace(NEG.b * NEG.q, NEG.a, `r = ${NEG.r}`);
        const e1 = s.tex(eqTex(POS), { x: 730, y: 462, size: 36, visible: false });
        const bad = s.tex(`${NEG.a} = ${NEG.b} \\cdot ${paren(NEG.q + 1)} + (${NEG.r - NEG.b}) \\quad \\text{✗: } r < 0`, { x: 300, y: 455, size: 30, color: C.red, visible: false });
        const e2 = s.tex(eqTex(NEG), { x: 300, y: 503, size: 36, visible: false });
        const down = s.text('$q$ rounds down, so $r \\ge 0$', { x: 300, y: 550, size: 30, color: C.yellow, visible: false });
        return { card, nl, b1, b2, e1, bad, e2, down };
      },
      steps: [
        {
          say: 'Here is the theorem. To divide $a${a} by $b${b}, mark every multiple of $b${b} on the number line; here $b = 5${b equals five}. Seventeen lands between fifteen and twenty, and $bq${b q} is the largest multiple at or below $a${a}: fifteen, so $q = 3${q equals three}.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.nl.fadeIn();
            o.mult = [-20, -15, -10, -5, 0, 5, 10, 15, 20].map((v) => o.nl.point(v, { color: 'blue', r: 7 }));
            await Promise.all(o.mult);
            o.pa = o.nl.point(POS.a, { color: 'yellow', label: 'a' });
            await o.pa;
            o.pbq = o.nl.point(POS.b * POS.q, { color: 'green', label: 'bq' });
            await o.pbq;
          },
        },
        {
          say: 'The remainder is the gap from $bq${b q} up to $a${a}, here two. It is always at least zero and less than $b${b}, because the next multiple is already past $a${a}.',
          do: async (s, o) => {
            await o.b1.draw();
            await o.e1.write({ duration: 900 });
          },
        },
        {
          say: 'For negative $a${a} the same rule holds. Minus seventeen lies between minus twenty and minus fifteen. The tempting answer $q = -3${q equals minus three} leaves a remainder of minus two, which is not allowed; the right one is $q = -4${q equals minus four}, with $r = 3${r equals three}. The quotient rounds down, so the remainder stays nonnegative.',
          do: async (s, o) => {
            await s.all(o.pa.fadeOut(), o.pbq.fadeOut());
            o.na = o.nl.point(NEG.a, { color: 'yellow', label: 'a' });
            await o.na;
            await o.bad.write({ duration: 800 });
            await s.strike(o.bad);
            o.nbq = o.nl.point(NEG.b * NEG.q, { color: 'green', label: 'bq' });
            await o.nbq;
            await o.b2.draw();
            await o.e2.write({ duration: 900 });
            await o.down.fadeIn();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-qr',
      kind: 'blanks',
      title: 'Quotient and remainder',
      say: 'Fill in the quotient and remainder for each division. Remember that the remainder can never be negative.',
      prompt: 'Write each $a$ as $bq + r$ with $0 \\le r < b$.',
      lines: FILL_QR.map((x, i) => [
        `${x.a} = ${x.b} \\cdot `,
        { id: `q${i + 1}`, answer: { type: 'number', value: x.q } },
        '{} + ',
        { id: `r${i + 1}`, answer: { type: 'number', value: x.r } },
      ]),
      solution: [
        ...FILL_QR.map((x) => `$${x.a}$: the largest multiple of $${x.b}$ at or below it is $${x.b * x.q}$, so $q = ${x.q}$ and $r = ${x.a} - (${x.b * x.q}) = ${x.r}$.`),
        'In each case choose $q$ so that $0 \\le a - bq < b$.',
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'existence',
      title: 'Why $q$ and $r$ exist',
      scene(s) {
        const cap = s.text(`With $a = ${POS.a}$, $b = ${POS.b}$: $S = \\{${[0, 1, 2, 3, 4].map((j) => POS.r + POS.b * j).join(', ')}, \\dots\\}$`, { y: 48, size: 30, color: C.muted, visible: false });
        const nl = s.numberLine({ x: 480, y: 120, width: 820, range: [0, 30], ticks: 1, labels: (v) => (v % 5 === 0 ? String(v) : null), size: 30, visible: false });
        const X = (v) => 480 + nl.toX(v);
        const back = s.arrow(X(POS.r + POS.b), 85, X(POS.r) + 6, 85, { color: C.red, width: 4, visible: false });
        const p = s.proof({ y: 180, width: 880, height: 394, size: 30, whyWidth: 180 });
        return { cap, nl, X, back, p };
      },
      steps: [
        {
          say: 'Why do $q${q} and $r${r} exist? Look at all the nonnegative numbers of the form $a - bk${a minus b k}: subtract multiples of $b${b} from $a${a} and keep what stays at or above zero.',
          do: async (s, o) => {
            await o.cap.fadeIn();
            await o.nl.fadeIn();
            o.S = [0, 1, 2, 3, 4, 5].map((j) => o.nl.point(POS.r + POS.b * j, { color: 'blue' }));
            await Promise.all(o.S);
            await o.p.add('**Proof.** Let $a \\in \\mathbb{Z}$, $b \\in \\mathbb{N}$, $S = \\{a - bk \\ge 0 : k \\in \\mathbb{Z}\\}$.', { why: 'define $S$' });
          },
        },
        {
          say: 'The set is not empty: taking $k${k} to be minus the absolute value of $a${a} gives $a + b\\lvert a \\rvert${a plus b times the absolute value of a}, which is at least zero. So by well-ordering it has a least element, $r = a - bq${r equals a minus b q}.',
          do: async (s, o) => {
            await o.p.add('$S \\ne \\varnothing$: $k = -\\lvert a \\rvert$ gives $a + b\\lvert a \\rvert \\ge 0$.', { why: 'since $b \\ge 1$' });
            await o.p.add('Let $r = a - bq$ be the least element of $S$.', { why: 'well-ordering' });
            o.ring = s.ring({ x: o.X(POS.r) - 16, y: 104, w: 32, h: 32 }, { color: 'green', shape: 'box', pad: 4 });
            await o.ring;
          },
        },
        {
          say: 'Could $r${r} be $b${b} or more? Then subtracting one more $b${b} would leave a smaller element of $S${S}, contradicting minimality. So $0 \\le r < b${r is between zero and b}, and $a = bq + r${a equals b q plus r}.',
          do: async (s, o) => {
            await o.back.draw({ duration: 600 });
            await o.p.add('If $r \\ge b$: $r - b = a - b(q + 1) \\in S$.', { kind: 'contradiction', why: '$r - b < r$' });
            await o.p.add('So $0 \\le r < b$ and $a = bq + r$.', { kind: 'conclude', why: '$r$ least in $S$' });
            await o.p.qed();
          },
        },
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'uniqueness',
      title: 'Why they are unique',
      scene(s) {
        const p = s.proof({ y: 26, width: 900, height: 364, size: 30, whyWidth: 230 });
        const lab = { '-10': '−2b', '-5': '−b', 0: '0', 5: 'b', 10: '2b' };
        const nl = s.numberLine({ x: 480, y: 458, width: 760, range: [-12, 12], ticks: 5, labels: (v) => lab[v] ?? null, size: 30, visible: false });
        const cap = s.text('the only multiple of $b$ strictly between $-b$ and $b$ is $0$', { x: 480, y: 550, size: 30, color: C.green, visible: false });
        return { p, nl, cap };
      },
      steps: [
        {
          say: 'Now uniqueness. Suppose $a${a} has two representations, $bq + r${b q plus r} and $bq\' + r\'${b q prime plus r prime}, both with remainders in the allowed range.',
          do: async (s, o) => {
            await o.p.add('**Proof.** Let $q, q\', r, r\' \\in \\mathbb{Z}$ with $bq + r = bq\' + r\'$ and $0 \\le r, r\' < b$.', { kind: 'assume', why: 'assume' });
          },
        },
        {
          say: 'Rearranging, $b(q - q\') = r\' - r${b times q minus q prime equals r prime minus r}. The left side is a multiple of $b${b}, and the right side is strictly between $-b${minus b} and $b${b}.',
          do: async (s, o) => {
            await o.p.add('Then $b(q - q\') = r\' - r$.', { why: 'algebra' });
            o.mid = o.p.add('$-b < r\' - r < b$, and $b \\mid r\' - r$.', { why: 'ranges of $r, r\'$' });
            await o.mid;
            await o.p.highlight(o.mid, 'yellow');
            await o.nl.fadeIn();
            o.band = o.nl.interval(-5, 5, { openA: true, openB: true, color: 'yellow' });
            await o.band;
            o.mults = [-10, -5, 5, 10].map((v) => o.nl.point(v, { color: 'red' }));
            await Promise.all(o.mults);
          },
        },
        {
          say: 'The only multiple of $b${b} in that window is zero. So $r\' - r = 0${r prime minus r equals zero}, and then $q = q\'${q equals q prime} as well, because $b${b} is not zero.',
          do: async (s, o) => {
            o.zero = o.nl.point(0, { color: 'green' });
            await o.zero;
            await o.cap.fadeIn();
            await o.p.add('So $r = r\'$, and $q = q\'$ since $b \\ne 0$.', { kind: 'conclude', why: 'only multiple of $b$ in $(-b, b)$ is $0$' });
            await o.p.qed();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'try-square-remainder',
      kind: 'try',
      title: 'Remainders of squares',
      say: 'Which remainders can a perfect square leave when you divide by four? Try a few, then split by parity.',
      prompt: 'Which remainders can $n^2$ leave on division by $4$? Enter the set.',
      answer: { type: 'set', value: SQ_REM.map(String) },
      hint: 'Split by parity: $n = 2k$ or $n = 2k + 1$.',
      solution: [
        '$(2k)^2 = 4k^2$ leaves remainder $0$; $(2k + 1)^2 = 4k^2 + 4k + 1 = 4(k^2 + k) + 1$ leaves remainder $1$.',
        `So the set is $\\{${SQ_REM.join(', ')}\\}$: no perfect square has the form $4m + 2$ or $4m + 3$. For example, $1\\,000\\,003 = 4 \\cdot 250\\,000 + 3$ is not a square.`,
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'remainder-cases',
      title: 'Cases by remainder',
      scene(s) {
        const claim = s.text('**Claim.** For every $n \\in \\mathbb{Z}$, $3 \\mid n^3 - n$.', { y: 48, size: 32, visible: false });
        const fac = s.tex('n^3 - n = (n - 1)\\,n\\,(n + 1)', { x: 480, y: 105, size: 38, visible: false });
        const cases = ['n = 3q', 'n = 3q + 1', 'n = 3q + 2'].map((t, i) => s.tex(t, { x: 90, y: 190 + i * 72, size: 34, anchor: [0, 0.5], color: C.blue, visible: false }));
        const prods = [
          '(3q - 1)\\,\\part{m}{(3q)}\\,(3q + 1)',
          '\\part{m}{(3q)}\\,(3q + 1)\\,(3q + 2)',
          '(3q + 1)\\,(3q + 2)\\,\\part{m}{3(q + 1)}',
        ].map((t) => s.tex(t, { x: 590, y: 0, size: 34, visible: false }));
        prods.forEach((m, i) => m.set({ y: 190 + i * 72 }));
        const ghosts = prods.map((m) => s.tex('(n - 1)\\,n\\,(n + 1)', { x: 480, y: 105, size: 38, visible: false }));
        const N = 12, X0 = 150, DX = 60, Y = 430;
        const ints = Array.from({ length: N }, (_, i) => s.tex(String(i + 1), { x: X0 + i * DX, y: Y, size: 32, color: (i + 1) % 3 === 0 ? C.yellow : C.muted, visible: false }));
        const win = s.rect(X0 - 28, Y - 28, 3 * DX - 4, 56, { color: C.green, width: 3, radius: 10, visible: false });
        const fin = s.text('One of any three consecutive integers is a multiple of $3$.', { x: 480, y: 520, size: 30, color: C.green, visible: false });
        return { claim, fac, cases, prods, ghosts, ints, win, DX, fin };
      },
      steps: [
        {
          say: 'Claim: three divides $n^3 - n${n cubed minus n} for every integer $n${n}. The division algorithm splits the integers into three cases, $3q${three q}, $3q + 1${three q plus one} and $3q + 2${three q plus two}: every $n${n} is in exactly one.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await s.stagger(o.cases.map((c) => () => c.fadeIn({ shift: [-12, 0] })), 350);
          },
        },
        {
          say: 'Before splitting, factor: $n^3 - n${n cubed minus n} is $(n - 1) n (n + 1)${n minus one, times n, times n plus one}, three consecutive integers. Then substitute each case.',
          do: async (s, o) => {
            await o.fac.write({ duration: 900 });
            await s.all(...o.ghosts.map((g, i) => g.show().morphTo(o.prods[i], { duration: 900, delay: i * 200 })));
            await s.all(...o.prods.map((p) => p.fadeIn({ shift: [0, 0], duration: 250 })), ...o.ghosts.map((g) => g.fadeOut({ duration: 250 })));
          },
        },
        {
          say: 'In every row, one of the three factors is a multiple of three. That is just the fact that among any three consecutive integers, one is divisible by three. So three divides the product in all three cases.',
          do: async (s, o) => {
            await s.all(...o.prods.map((p) => p.color('m', C.yellow)));
            await s.all(...o.ints.map((t, i) => t.fadeIn({ delay: i * 40 })));
            await o.win.fadeIn({ shift: [0, 0] });
            for (let k = 1; k <= 3; k++) await o.win.shift(o.DX, 0, { duration: 450 });
            await o.fin.fadeIn();
            await o.claim.recolor(C.green);
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'parity-settled',
      title: 'Even or odd, never both',
      scene(s) {
        const top = s.tex('n = 2q + r, \\qquad r \\in \\{0, 1\\} \\ \\text{unique}', { x: 480, y: 60, size: 38, visible: false });
        const nl = s.numberLine({ x: 480, y: 200, width: 780, range: [-5, 5], ticks: 1, size: 30, visible: false });
        const leg = s.text('blue: $r = 0$ (even)  ·  orange: $r = 1$ (odd)', { x: 480, y: 290, size: 30, visible: false });
        const note = s.text('Lectures 6–8 assumed “not even ⇒ odd”. Now it is a theorem: by uniqueness of $r$.', { x: 480, y: 385, size: 30, width: 820, color: C.yellow, visible: false });
        const any = s.text('Any $b \\in \\mathbb{N}$: every integer has exactly one remainder in $\\{0, 1, \\dots, b - 1\\}$.', { x: 480, y: 510, size: 30, width: 820, color: C.green, visible: false });
        return { top, nl, leg, note, any };
      },
      steps: [
        {
          say: 'Take $b = 2${b equals two}. Every integer is $2q${two q} or $2q + 1${two q plus one}, and never both, because the remainder is unique. That fills the gap we left in the proof lectures.',
          do: async (s, o) => {
            await o.top.write({ duration: 900 });
            await o.nl.fadeIn();
            o.pts = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((v) => o.nl.point(v, { color: ((v % 2) + 2) % 2 === 0 ? 'blue' : 'orange' }));
            await Promise.all(o.pts);
            await o.leg.fadeIn();
          },
        },
        {
          say: 'Back then we used “not even, so odd” without proof. Now it is a theorem: an integer that isn’t $2q${two q} has remainder one, so it is odd, and no integer is both.',
          do: (s, o) => o.note.fadeIn(),
        },
        {
          say: 'The same holds for any modulus. With $b = 3${b equals three} the integers fall into three classes, and each one lands in exactly one of them.',
          do: async (s, o) => {
            await s.all(...o.pts.map((p) => p.fadeOut()), o.leg.fadeOut());
            o.pts3 = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((v) => o.nl.point(v, { color: ['blue', 'orange', 'teal'][((v % 3) + 3) % 3] }));
            await Promise.all(o.pts3);
            await o.top.swap('n = 3q + r, \\qquad r \\in \\{0, 1, 2\\} \\ \\text{unique}');
            await o.any.fadeIn();
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'wo-not-div4',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper and prove this with remainder cases. Make sure your conclusion appeals to uniqueness of the remainder.',
      prompt: 'Prove that for every integer $n$, $n^2 - 2$ is not divisible by $4$.',
      answer: { type: 'proof' },
      hints: ['Split into parity cases: $n = 2k$ or $n = 2k + 1$.', 'Write $n^2 - 2$ as $4m + r$ with $0 \\le r < 4$ and use uniqueness of the remainder.'],
      solution: [
        '**Proof.** Let $n \\in \\mathbb{Z}$. By the division algorithm, $n = 2k$ or $n = 2k + 1$ for some $k \\in \\mathbb{Z}$.',
        'If $n = 2k$, then $n^2 - 2 = 4k^2 - 2 = 4(k^2 - 1) + 2$, with $k^2 - 1 \\in \\mathbb{Z}$.',
        'If $n = 2k + 1$, then $n^2 - 2 = 4k^2 + 4k - 1 = 4(k^2 + k - 1) + 3$, with $k^2 + k - 1 \\in \\mathbb{Z}$.',
        `In either case the remainder of $n^2 - 2$ on division by $4$ is $${NOT4.join('$ or $')}$, not $0$. By uniqueness of the remainder, $4 \\nmid n^2 - 2$. ∎`,
      ],
      rubric: [
        'Exhaustive cases ($n$ even or odd), justified by the division algorithm.',
        'Correct algebra in each case (e.g. $n^2 - 2 = 4(k^2 - 1) + 2$ and $4(k^2 + k - 1) + 3$).',
        'Concludes validly: uniqueness of the remainder ($2$ or $3$, not $0$), or an equivalent argument (e.g. $4 \\mid 4k^2 - 2$ would force $4 \\mid 2$; $n^2 - 2$ odd for odd $n$). Writing $4k^2 - 2$ alone is not enough.',
        'Concluding sentence: $4 \\nmid n^2 - 2$ for every $n$.',
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-qr',
      kind: 'workout',
      title: 'Compute $q$ and $r$',
      say: 'Now compute a quotient and remainder with a negative dividend.',
      ...qrItem(WO_QR),
      generate: (rand) => {
        const a = rand.int(-200, -1);
        const b = rand.int(2, 12);
        return qrItem({ a, b });
      },
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'bases',
      title: 'Writing numbers in base $b$',
      scene(s) {
        const rows = BASE.map((row, i) =>
          s.tex(`${row.n} = ${BASE_B} \\cdot ${row.q} + \\part{r}{${row.r}}`, { x: 300, y: 75 + i * 68, size: 38, anchor: [0, 0.5], visible: false }),
        );
        const up = s.arrow(700, 75 + (BASE.length - 1) * 68 + 20, 700, 55, { color: C.yellow, width: 4, visible: false });
        const upLab = s.text('read up', { x: 790, y: 75 + 1.5 * 68, size: 30, color: C.yellow, visible: false });
        const res = s.tex(`${BASE_N} = ${DIGITS.map((d, i) => `\\part{d${i}}{${d}}`).join('')}_{${BASE_B}}`, { x: 480, y: 400, size: 48, visible: false });
        const fly = DIGITS.map((d) => s.tex(String(d), { size: 38, color: C.yellow, visible: false }));
        const check = s.tex(`${CHECK_TERMS.map((t) => `${t.d} \\cdot ${t.p}`).join(' + ')} = ${CHECK_TERMS.reduce((acc, t) => acc + t.d * t.p, 0)}`, { x: 480, y: 475, size: 34, color: C.green, visible: false });
        const uniq = s.text('unique remainders ⇒ unique digits', { x: 480, y: 540, size: 30, color: C.muted, italic: true, visible: false });
        return { rows, up, upLab, res, fly, check, uniq };
      },
      steps: [
        {
          say: 'Every positive integer has a base-$b${b} expansion, and the division algorithm finds it. Divide 2026 by seven, then divide the quotient by seven, and keep going until the quotient is zero.',
          do: (s, o) => s.stagger(o.rows.map((r) => () => r.write({ duration: 700 })), 800),
        },
        {
          say: 'The remainders are the digits, last digit first. Read them from the bottom up: 2026 is $5623${five six two three} in base seven.',
          do: async (s, o) => {
            await s.all(...o.rows.map((r) => r.color('r', C.yellow)));
            await s.all(o.up.draw({ duration: 600 }), o.upLab.fadeIn());
            o.res.set({ opacity: 0 });
            o.res.show();
            const n = BASE.length;
            for (let i = 0; i < n; i++) {
              const row = n - 1 - i; // bottom row first = most significant digit
              const from = o.rows[row].partBox('r');
              const to = o.res.partBox(`d${i}`);
              o.fly[i].set({ x: from.cx, y: from.cy });
              o.fly[i].show();
              await o.fly[i].moveTo(to.cx, to.cy, { duration: 600 });
            }
            await s.all(o.res.fadeIn({ shift: [0, 0], duration: 400 }), ...o.fly.map((f) => f.fadeOut({ duration: 400 })));
          },
        },
        {
          say: 'Check it: five times 343, plus six times 49, plus two times seven, plus three is 2026. And because each remainder is unique, so is the expansion.',
          do: async (s, o) => {
            await o.check.write({ duration: 1100 });
            await o.uniq.fadeIn();
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-division',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap, explain in your own words why the quotient and remainder are unique, and how remainders help prove things about all integers.',
      prompt: 'Why are the quotient and remainder unique, and how do remainders help prove statements about all integers?',
      points: [
        'Two representations differ by a multiple of $b$ that is less than $b$ in absolute value, hence $0$.',
        'Remainders split $\\mathbb{Z}$ into $b$ exhaustive, non-overlapping cases.',
        'Uniqueness is what lets us conclude “not divisible” from a nonzero remainder.',
        'Existence came from well-ordering (the least nonnegative $a - bk$).',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• $a = bq + r$ with $0 \\le r < b$, and $q$, $r$ are unique.', 130),
          recapItem(s, '• Remainder cases prove facts about all integers; parity is settled; base-$b$ digits are remainders.', 250),
          recapItem(s, 'Next: greatest common divisors and Euclid’s algorithm.', 400, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'Every integer $a${a} is $bq + r${b q plus r} with a remainder between zero and $b${b}, and both $q${q} and $r${r} are unique.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Remainders give exhaustive, non-overlapping cases, they settle even versus odd, and they are the digits of a base-$b${b} expansion.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: greatest common divisors, and Euclid’s algorithm for finding them.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
