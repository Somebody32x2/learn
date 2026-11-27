/**
 * Lecture 8 · Cases, counterexamples, existence and uniqueness (foundations/PLAN.md § 8). Irani · Proofs · Liebeck 1.
 *
 * Choreography: a case tree whose branches the integers themselves fly into (even left, odd right); tables of
 * small cases that go green, green, green… and then one red counterexample (values computed here, never typed);
 * a non-constructive existence proof as a two-branch tree that never learns which branch is true.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, not typed)

/** Smallest prime factor of n ≥ 2 (n itself when prime). */
function spf(n) {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return d;
  return n;
}
const isPrime = (n) => n >= 2 && spf(n) === n;

/** Mersenne table for p = 2, 3, 5, 7, 11: 2^p − 1 and its smallest factor. */
const MERSENNE = [2, 3, 5, 7, 11].map((p) => {
  const v = 2 ** p - 1;
  const d = spf(v);
  return { p, v, prime: d === v, d, q: v / d };
});
const M_BAD = MERSENNE.find((r) => !r.prime);

/** n² − n + 11 for n = 1 … 11. */
const EULER = Array.from({ length: 11 }, (_, i) => {
  const n = i + 1;
  const v = n * n - n + 11;
  return { n, v, prime: isPrime(v) };
});
const E_BAD = EULER.find((r) => !r.prime);

/** n² − 5n + 6 at the witness n = 2. */
const W = 2;
const W_TERMS = [W * W, -5 * W, 6];

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** A boxed node (text with $math$) centered at (x, y); returns { t, r, box, show }. */
function node(s, str, x, y, { color = C.ink, fill, size = 32 } = {}) {
  const t = s.text(str, { x, y, size, color, visible: false });
  const b = t.box();
  const r = s.rect(b.x - 18, b.y - 10, b.w + 36, b.h + 20, { color, fill, radius: 12, width: 2.5, visible: false });
  const box = { x: b.x - 18, y: b.y - 10, w: b.w + 36, h: b.h + 20 };
  return { t, r, box, show: (delay = 0) => s.all(r.fadeIn({ shift: [0, 0], delay }), t.fadeIn({ delay: delay + 100 })) };
}

/** Arrow from the bottom of box a to the top of box b. */
const link = (s, a, b, color = C.ink, opts = {}) => s.arrow(a.x + a.w / 2, a.y + a.h + 4, b.x + b.w / 2, b.y - 6, { color, width: 3, visible: false, ...opts });

// ---------------------------------------------------------------- lecture

export default {
  id: 'cases-counterexamples',
  title: 'Cases, counterexamples, existence and uniqueness',
  goals: [
    'Write a proof by cases whose cases are exhaustive',
    'Use “without loss of generality” only with a stated symmetry',
    'Prove or disprove: test small cases and give a verified counterexample',
    'Distinguish constructive and non-constructive existence proofs, and prove uniqueness',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'cases-idea',
      title: 'Splitting into cases',
      scene(s) {
        const thm = s.text('**Theorem.** For every $n \\in \\mathbb{Z}$, $n^2 + n$ is even.', { y: 50, size: 32, visible: false });
        const root = node(s, '$n \\in \\mathbb{Z}$', 480, 125, { size: 34 });
        const ev = node(s, '$n$ even', 200, 280, { color: C.blue, fill: FILL.blue });
        const od = node(s, '$n$ odd', 760, 280, { color: C.teal, fill: FILL.teal });
        const goal = node(s, '$n^2 + n$ even', 480, 500, { color: C.green, fill: FILL.green, size: 34 });
        const a1 = link(s, root.box, ev.box);
        const a2 = link(s, root.box, od.box);
        const b1 = s.arrow(ev.box.x + ev.box.w + 6, ev.box.y + ev.box.h / 2, goal.box.x + 40, goal.box.y - 6, { color: C.green, width: 3, visible: false });
        const b2 = s.arrow(od.box.x - 6, od.box.y + od.box.h / 2, goal.box.x + goal.box.w - 40, goal.box.y - 6, { color: C.green, width: 3, visible: false });
        const nums = [-3, -2, -1, 0, 1, 2, 3, 4].map((k, i) => s.tex(String(k), { x: 270 + i * 60, y: 200, size: 32, visible: false }));
        const cover = s.text('every integer lands in a branch', { x: 480, y: 556, size: 30, color: C.muted, italic: true, visible: false });
        return { thm, root, ev, od, goal, a1, a2, b1, b2, nums, cover };
      },
      steps: [
        {
          say: 'Sometimes one argument can’t handle every object at once, but two arguments can. To show $n^2 + n${n squared plus n} is even for every integer, split the integers into two cases: even and odd.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.root.show();
            await s.all(o.a1.draw(), o.a2.draw());
            await s.all(o.ev.show(), o.od.show(150));
          },
        },
        {
          say: 'The cases must cover everything. They do here: every integer is even or odd, so each one lands in a branch.',
          do: async (s, o) => {
            await s.all(o.nums.map((m, i) => m.fadeIn({ delay: i * 60 })));
            const evens = o.nums.filter((_, i) => i % 2 === 1);
            const odds = o.nums.filter((_, i) => i % 2 === 0);
            await s.all(
              ...evens.map((m, i) => s.all(m.moveTo(70 + i * 60, 345, { duration: 900 }), m.recolor(C.blue))),
              ...odds.map((m, i) => s.all(m.moveTo(712 + i * 60, 345, { duration: 900 }), m.recolor(C.teal))),
            );
            await o.cover.fadeIn();
          },
        },
        {
          say: 'And each branch must reach the same conclusion. If both arrows end at “$n^2 + n${n squared plus n} is even”, the theorem holds for every integer.',
          do: async (s, o) => {
            await s.all(o.b1.draw(), o.b2.draw({ delay: 200 }));
            await o.goal.show();
            await o.goal.r.flash({ color: C.green });
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'cases-proof',
      title: 'Writing a proof by cases',
      scene(s) {
        const p = s.proof({ y: 28, width: 900, height: 488, size: 30, whyWidth: 230 });
        const aside = s.text('Aside: $n^2 + n = n(n + 1)$, and one of $n$, $n + 1$ is even.', { y: 548, size: 30, color: C.muted, visible: false });
        return { p, aside };
      },
      steps: [
        {
          say: 'Start by stating the split and why it is exhaustive: every integer is even or odd.',
          do: async (s, o) => {
            await o.p.add('**Proof.** Let $n \\in \\mathbb{Z}$. Then $n$ is even or odd.', { kind: 'assume', why: 'parity' });
          },
        },
        {
          say: 'Each case is a small direct proof. Case one: $n = 2k${n equals two k}, so $n^2 + n = 2(2k^2 + k)${n squared plus n equals two times, two k squared plus k}, which is even because $2k^2 + k${two k squared plus k} is an integer.',
          do: async (s, o) => {
            o.c1 = o.p.add('**Case 1:** $n = 2k$ for some $k \\in \\mathbb{Z}$.', { why: 'def. of even' });
            await o.c1;
            await o.p.highlight(o.c1, 'blue');
            await o.p.add('$n^2 + n = 4k^2 + 2k = 2(2k^2 + k)$', { indent: 1, why: '$2k^2 + k \\in \\mathbb{Z}$' });
          },
        },
        {
          say: 'Case two: $n = 2k + 1${n equals two k plus one}. Then $n^2 + n${n squared plus n} factors as $(2k + 1)(2k + 2) = 2(2k + 1)(k + 1)${two k plus one, times two k plus two, which is two times, two k plus one, times, k plus one}: even again.',
          do: async (s, o) => {
            o.c2 = o.p.add('**Case 2:** $n = 2k + 1$ for some $k \\in \\mathbb{Z}$.', { why: 'def. of odd' });
            await o.c2;
            await o.p.highlight(o.c2, 'teal');
            await o.p.add('Then $n^2 + n = (2k + 1)(2k + 2)$', { indent: 1, why: 'factor' });
            await o.p.add('$\\phantom{n^2 + n} = 2(2k + 1)(k + 1)$, even.', { indent: 1, why: 'product in $\\mathbb{Z}$' });
          },
        },
        {
          say: 'Then conclude for all cases at once: in both cases, $n^2 + n${n squared plus n} is even.',
          do: async (s, o) => {
            await o.p.add('In both cases, $n^2 + n$ is even.', { kind: 'conclude', why: 'all cases' });
            await o.p.qed();
          },
        },
        {
          say: 'Sometimes a clever rewrite avoids cases: $n^2 + n = n(n + 1)${n squared plus n equals n times n plus one}, and one of two consecutive integers is even. But cases are always honest.',
          do: (s, o) => o.aside.fadeIn(),
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'triangle',
      title: 'The triangle inequality',
      scene(s) {
        const def = s.defCard({ x: 200, y: 130, tex: '\\lvert x \\rvert = \\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}', title: 'Definition', size: 30, visible: false });
        const lemma = s.tex('\\textbf{Lemma.}\\ \\lvert a \\rvert \\le b \\iff -b \\le a \\le b', { x: 664, y: 60, size: 28, visible: false });
        const nl = s.numberLine({ x: 650, y: 150, width: 380, range: [-4, 4], ticks: 1, labels: (v) => (v === -3 ? '−b' : v === 3 ? 'b' : v === 0 ? '0' : null), size: 34, visible: false });
        const steps = [
          s.tex('-\\lvert x \\rvert \\le x \\le \\lvert x \\rvert', { x: 375, y: 300, size: 36, visible: false }),
          s.tex('-\\lvert y \\rvert \\le y \\le \\lvert y \\rvert', { x: 375, y: 355, size: 36, visible: false }),
          s.tex('-(\\lvert x \\rvert + \\lvert y \\rvert) \\le x + y \\le \\lvert x \\rvert + \\lvert y \\rvert', { x: 375, y: 430, size: 34, visible: false }),
          s.tex('\\lvert x + y \\rvert \\le \\lvert x \\rvert + \\lvert y \\rvert', { x: 375, y: 515, size: 42, color: C.green, visible: false }),
        ];
        const bar = s.line(110, 393, 640, 393, { width: 3, visible: false });
        const why = [
          s.text('two cases each', { x: 700, y: 327, size: 30, anchor: [0, 0.5], color: C.muted, visible: false }),
          s.text('add', { x: 700, y: 430, size: 30, anchor: [0, 0.5], color: C.muted, visible: false }),
          s.text('by the lemma', { x: 700, y: 515, size: 30, anchor: [0, 0.5], color: C.muted, visible: false }),
        ];
        return { def, lemma, nl, steps, bar, why };
      },
      steps: [
        {
          say: 'Absolute value is defined by cases: $\\lvert x \\rvert${the absolute value of x} is $x${x} when $x${x} is at least zero, and $-x${minus x} when $x${x} is negative. So proofs about it often split into cases.',
          do: (s, o) => o.def.reveal(),
        },
        {
          say: 'A useful lemma packages those cases: $\\lvert a \\rvert \\le b${the absolute value of a is at most b} exactly when $a${a} lies between $-b${minus b} and $b${b}.',
          do: async (s, o) => {
            await o.lemma.write();
            await o.nl.fadeIn({ shift: [0, 0] });
            o.iv = o.nl.interval(-3, 3, { color: 'blue' });
            await o.iv;
            o.pt = o.nl.point(-1.6, { color: 'yellow', label: 'a' });
            await o.pt;
            await o.pt.moveTo(2.2, { duration: 1000 });
          },
        },
        {
          say: 'Now the triangle inequality. Each of $x${x} and $y${y} lies between minus its absolute value and its absolute value: check the two sign cases for each.',
          do: async (s, o) => {
            await o.steps[0].write({ duration: 700 });
            await o.steps[1].write({ duration: 700 });
            await o.why[0].fadeIn();
          },
        },
        {
          say: 'Add the two chains: $x + y${x plus y} lies between minus, the absolute value of x plus the absolute value of y, and the absolute value of x plus the absolute value of y.',
          do: async (s, o) => {
            await o.bar.draw({ duration: 400 });
            await o.steps[2].write({ duration: 900 });
            await o.why[1].fadeIn();
          },
        },
        {
          say: 'That is exactly the lemma with $b = \\lvert x \\rvert + \\lvert y \\rvert${b equal to the absolute value of x plus the absolute value of y}, so $\\lvert x + y \\rvert \\le \\lvert x \\rvert + \\lvert y \\rvert${the absolute value of x plus y is at most the absolute value of x plus the absolute value of y}. Four sign cases would also work; the lemma saves us from writing them.',
          do: async (s, o) => {
            await o.lemma.indicate({ color: C.yellow });
            await o.steps[3].write();
            await o.why[2].fadeIn();
          },
        },
        {
          say: 'This inequality is the workhorse of analysis: almost every estimate in a limit proof goes through it.',
          do: (s, o) => o.steps[3].indicate({ color: C.green }),
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-exhaustive',
      kind: 'try',
      title: 'Exhaustive cases',
      say: 'Which of these case splits really cover every integer? Select all that do.',
      prompt: 'Which case splits cover every integer $n$? Select all.',
      answer: { type: 'multi', value: ['b', 'd'] },
      choices: [
        { id: 'a', label: '$n < 0$; $n > 0$', why: 'Misses $n = 0$.' },
        { id: 'b', label: '$n = 3k$; $n = 3k + 1$; $n = 3k + 2$', why: 'Every integer leaves remainder $0$, $1$ or $2$ on division by $3$.' },
        { id: 'c', label: '$n$ even; $n$ prime', why: 'Misses odd non-primes such as $9$ (and $1$).' },
        { id: 'd', label: '$n \\le 5$; $n \\ge 5$', why: 'Covers everything; $5$ is in both cases, and overlap is harmless.' },
      ],
      hint: 'For each split, look for an integer that no case catches.',
      solution: [
        '(a) misses $0$, and (c) misses $9$. (b) covers every remainder mod $3$, and (d) covers every integer, with $5$ counted twice.',
        'Overlapping cases are fine; gaps are fatal.',
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'wlog',
      title: 'Without loss of generality',
      scene(s) {
        const claim = s.text('**Claim.** For $x, y \\in \\mathbb{R}$, $\\max(x, y) + \\min(x, y) = x + y$.', { y: 50, size: 32, visible: false });
        const nl = s.numberLine({ x: 480, y: 160, width: 640, range: [-3, 3], ticks: 1, labels: false, visible: false });
        const wlog = s.tex('\\text{WLOG } x \\le y', { x: 250, y: 280, size: 40, color: C.yellow, visible: false });
        const note = s.text('symmetric in $x$ and $y$: swapping them changes nothing', { x: 665, y: 280, size: 30, width: 470, color: C.muted, visible: false });
        const l1 = s.tex('\\text{Then } \\max(x, y) = y,\\ \\ \\min(x, y) = x,', { x: 480, y: 380, size: 36, visible: false });
        const l2 = s.tex('\\text{so } \\max(x, y) + \\min(x, y) = y + x = x + y. \\ \\blacksquare', { x: 480, y: 440, size: 36, visible: false });
        const warn = s.text('Not symmetric, like $x - y$? Write both cases.', { x: 480, y: 525, size: 30, color: C.red, visible: false });
        return { claim, nl, wlog, note, l1, l2, warn };
      },
      steps: [
        {
          say: 'For two real numbers, either $x \\le y${x is at most y} or $y \\le x${y is at most x}. The second case is the same argument with the letters swapped, so we write “without loss of generality, $x \\le y${x is at most y}”.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await o.nl.fadeIn({ shift: [0, 0] });
            o.x = o.nl.point(-1.5, { color: 'blue', label: 'x' });
            o.y = o.nl.point(2, { color: 'teal', label: 'y' });
            await s.all(o.x, o.y);
            await s.all(o.x.moveTo(2, { duration: 900 }), o.y.moveTo(-1.5, { duration: 900 }));
            await s.all(o.x.moveTo(-1.5, { duration: 900 }), o.y.moveTo(2, { duration: 900 }));
            await o.wlog.write();
          },
        },
        {
          say: 'That is allowed only when it is actually true, so say why: the statement is symmetric in $x${x} and $y${y}; swapping them changes nothing. Then $\\max = y${the max is y}, $\\min = x${the min is x}, and the sum is $x + y${x plus y}.',
          do: async (s, o) => {
            await o.note.fadeIn();
            await o.l1.write();
            await o.l2.write();
          },
        },
        {
          say: 'If the cases are genuinely different, as they would be for something like $x - y${x minus y}, there is no symmetry to appeal to: write both cases.',
          do: (s, o) => o.warn.fadeIn(),
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'counterexample',
      title: 'Disproof by counterexample',
      scene(s) {
        const claim = s.text('**Claim.** For every prime $p$, $2^p - 1$ is prime.', { y: 50, size: 32, visible: false });
        const xs = MERSENNE.map((_, i) => 330 + i * 120);
        const hp = s.tex('p', { x: 160, y: 125, size: 36, visible: false });
        const hv = s.tex('2^p - 1', { x: 160, y: 190, size: 36, visible: false });
        const ps = MERSENNE.map((r, i) => s.tex(String(r.p), { x: xs[i], y: 125, size: 36, visible: false }));
        const vs = MERSENNE.map((r, i) => s.tex(String(r.v), { x: xs[i], y: 190, size: 36, visible: false }));
        const rule = s.line(80, 158, 900, 158, { color: C.line, width: 2, visible: false });
        const fac = s.tex(`= ${M_BAD.d} \\cdot ${M_BAD.q}`, { x: xs[4], y: 245, size: 32, color: C.red, visible: false });
        const proof = [
          s.text('**Disproof.** Negation: some prime $p$ has $2^p - 1$ not prime.', { x: 80, y: 340, size: 30, anchor: [0, 0.5], visible: false }),
          s.text(`Take $p = ${M_BAD.p}$, which is prime. Then $2^{${M_BAD.p}} - 1 = ${M_BAD.v} = ${M_BAD.d} \\cdot ${M_BAD.q}$,`, { x: 80, y: 395, size: 30, anchor: [0, 0.5], visible: false }),
          s.text(`so $2^{${M_BAD.p}} - 1$ is not prime. ∎`, { x: 80, y: 450, size: 30, anchor: [0, 0.5], visible: false }),
        ];
        return { claim, hp, hv, ps, vs, rule, fac, proof };
      },
      steps: [
        {
          say: 'Is this true? Test small cases first. For $p = 2, 3, 5, 7${p equals two, three, five and seven}, we get $3, 7, 31, 127${three, seven, thirty-one, and one hundred twenty-seven}: all prime.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await s.all(o.hp.fadeIn(), o.hv.fadeIn(), o.rule.draw({ duration: 600 }));
            for (let i = 0; i < 4; i++) {
              await o.ps[i].fadeIn({ duration: 300 });
              await o.vs[i].fadeIn({ duration: 300 });
              await o.vs[i].recolor(C.green);
            }
          },
        },
        {
          say: 'But at $p = 11${p equals eleven}, $2^{11} - 1 = 2047${two to the eleven, minus one, equals two thousand forty-seven}, which is $23 \\cdot 89${twenty-three times eighty-nine}. A counterexample must be specific, and verified with the arithmetic shown.',
          do: async (s, o) => {
            await o.ps[4].fadeIn();
            await o.vs[4].fadeIn();
            await o.vs[4].recolor(C.red);
            await o.fac.write();
            await s.ring(s.group(o.ps[4], o.vs[4], o.fac), { color: 'red', shape: 'box' });
          },
        },
        {
          say: 'Write the disproof as a proof of the negation: there exists a prime $p${p} with $2^p - 1${two to the p, minus one} not prime, namely eleven.',
          do: async (s, o) => {
            for (const l of o.proof) await l.fadeIn({ shift: [-12, 0] });
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'try-counterexample',
      kind: 'try',
      title: 'Pick the counterexample',
      say: 'Which of these is a genuine counterexample to the claim?',
      prompt: 'Claim: for all $x, y \\in \\mathbb{R}$, if $x^2 = y^2$ then $x = y$. Which is a counterexample?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: '$x = y = 2$', why: 'Hypothesis and conclusion are both true; this agrees with the claim.' },
        { id: 'b', label: '$x = 1$, $y = -1$', why: '$1^2 = (-1)^2$ but $1 \\ne -1$: true hypothesis, false conclusion.' },
        { id: 'c', label: '$x = 2$, $y = 3$', why: 'The hypothesis $4 = 9$ is false, so the implication is true here; it says nothing against the claim.' },
        { id: 'd', label: '$x = y = 0$', why: 'Again both sides true: $0 = 0$ and $0 = 0$.' },
      ],
      hint: 'A counterexample to “if P then Q” makes P true and Q false.',
      solution: ['$x = 1$, $y = -1$: $x^2 = 1 = y^2$, so the hypothesis holds, but $x \\ne y$.', 'One verified counterexample is enough to disprove a “for all” statement.'],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'existence',
      title: 'Constructive and non-constructive existence',
      scene(s) {
        const c1 = s.tex('\\exists n \\in \\mathbb{Z},\\ n^2 - 5n + 6 = 0', { x: 480, y: 52, size: 34, visible: false });
        const c2 = s.tex(`\\text{take } n = ${W}:\\ ${W_TERMS[0]} - ${-W_TERMS[1]} + ${W_TERMS[2]} = ${W_TERMS.reduce((a, b) => a + b, 0)}\\ \\checkmark`, { x: 480, y: 102, size: 32, color: C.green, visible: false });
        const rule = s.line(60, 134, 900, 134, { color: C.line, width: 2, visible: false });
        const thm = s.text('There exist irrational $a, b$ with $a^b$ rational.', { y: 170, size: 32, visible: false });
        const q = node(s, 'Is $\\sqrt 2^{\\sqrt 2}$ rational?', 480, 250, { color: C.yellow, fill: FILL.yellow });
        const yes = s.tex('a = b = \\sqrt 2', { x: 230, y: 400, size: 36, visible: false });
        const no1 = s.tex('a = \\sqrt 2^{\\sqrt 2},\\ \\ b = \\sqrt 2', { x: 710, y: 385, size: 34, visible: false });
        const no2 = s.tex('a^b = \\sqrt 2^{\\sqrt 2 \\cdot \\sqrt 2} = \\sqrt 2^{\\,2} = 2', { x: 710, y: 455, size: 34, color: C.green, visible: false });
        const ay = s.arrow(400, 285, 260, 365, { width: 3, visible: false });
        const an = s.arrow(560, 285, 690, 350, { width: 3, visible: false });
        const ly = s.text('yes', { x: 295, y: 312, size: 30, color: C.muted, visible: false });
        const ln = s.text('no', { x: 665, y: 305, size: 30, color: C.muted, visible: false });
        const irr = s.text('($\\sqrt 2 \\notin \\mathbb{Q}$, lecture 7)', { x: 230, y: 455, size: 30, color: C.muted, visible: false });
        const done = s.text('either way, such $a, b$ exist; we never learn which', { y: 540, size: 30, color: C.green, visible: false });
        return { c1, c2, rule, thm, q, yes, irr, no1, no2, ay, an, ly, ln, done };
      },
      steps: [
        {
          say: 'A constructive proof exhibits the witness. Is there an integer root of $n^2 - 5n + 6${n squared minus five n plus six}? Take $n = 2${n equals two}, and check it.',
          do: async (s, o) => {
            await o.c1.write();
            await o.c2.write();
          },
        },
        {
          say: 'A non-constructive proof shows a witness must exist without saying which. Claim: there are irrational $a${a} and $b${b} with $a^b${a to the b} rational. Ask: is root two to the power root two rational?',
          do: async (s, o) => {
            await o.rule.draw({ duration: 500 });
            await o.thm.fadeIn();
            await o.q.show();
          },
        },
        {
          say: 'If yes, take $a = b = \\sqrt 2${a and b both equal root two}: root two is irrational, as we proved last lecture. If no, that number is irrational, so take it as $a${a} and $b = \\sqrt 2${b equals root two}: then $a^b = \\sqrt 2^{\\,2} = 2${a to the b equals root two squared, which is two}, rational.',
          do: async (s, o) => {
            await s.all(o.ay.draw(), o.ly.fadeIn());
            await o.yes.write();
            await o.yes.recolor(C.green);
            await o.irr.fadeIn();
            await s.all(o.an.draw(), o.ln.fadeIn());
            await o.no1.write();
            await o.no2.write();
          },
        },
        {
          say: 'Both branches produce a valid pair, so the theorem is proved, and we never learn which case holds. Non-constructive proofs are perfectly valid.',
          do: async (s, o) => {
            await o.q.r.flash({ color: C.yellow });
            await o.done.fadeIn();
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'uniqueness',
      title: 'Proving uniqueness',
      scene(s) {
        const def = s.tex('\\exists!\\,x\\ P(x) \\;=\\; \\part{e}{\\text{exists}} \\;+\\; \\part{u}{\\text{at most one}}', { y: 52, size: 32, visible: false });
        const thm = s.text('**Theorem.** For $a, b \\in \\mathbb{R}$ with $a \\ne 0$, the equation $ax + b = 0$ has exactly one real solution.', { y: 122, size: 30, width: 860, visible: false });
        const p = s.proof({ y: 166, width: 900, height: 404, size: 30, whyWidth: 140 });
        return { def, thm, p };
      },
      steps: [
        {
          say: '“There exists exactly one” has two parts: there exists one, and there is at most one. Prove them separately, and label them. Existence: $x_0 = -b/a${x zero equals minus b over a} works, and it is defined because $a \\ne 0${a is not zero}.',
          do: async (s, o) => {
            await o.def.write();
            await s.all(o.def.color('e', C.blue), o.def.color('u', C.teal));
            await o.thm.fadeIn();
            await o.p.add('**Existence.** Let $x_0 = -b/a$. Then $ax_0 + b = 0$.', { kind: 'assume', why: '$a \\ne 0$' });
          },
        },
        {
          say: 'Uniqueness: take two solutions, $x${x} and $y${y}, and prove they are equal. Subtracting gives $a(x - y) = 0${a times x minus y equals zero}, and since $a \\ne 0${a is not zero}, $x = y${x equals y}.',
          do: async (s, o) => {
            o.u = o.p.add('**Uniqueness.** Let $x, y$ be real, $ax + b = 0 = ay + b$.', { kind: 'assume', why: 'take two' });
            await o.u;
            await o.p.add('Then $ax = ay$, so $a(x - y) = 0$.', { why: 'subtract' });
            o.key = o.p.add('Since $a \\ne 0$, $x - y = 0$, so $x = y$.', { why: 'cancel $a$' });
            await o.key;
            await o.p.highlight(o.key, 'yellow');
          },
        },
        {
          say: 'Notice we did not assume the two solutions were different and hunt for a contradiction. That works, but the direct route is cleaner unless you need it.',
          do: async (s, o) => {
            await o.p.add('Therefore it has exactly one real solution.', { kind: 'conclude', why: 'both parts' });
            await o.p.qed();
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'fill-uniqueness',
      kind: 'blanks',
      title: 'Fill in the uniqueness step',
      say: 'Now the same pattern on a new object: prove that a multiplicative identity is unique.',
      prompt: 'Suppose $e, e\' \\in \\mathbb{R}$ satisfy $ex = x$ and $e\'x = x$ for all $x \\in \\mathbb{R}$. Complete the proof that $e = e\'$.',
      lines: [
        ['\\text{Take } x = e\' \\text{ in the first: } ee\' = ', { id: 'first', chips: ["e'", 'e', '1'], answer: "e'", hint: 'Replace $x$ by $e\'$ in $ex = x$.' }],
        ['\\text{Take } x = e \\text{ in the second: } e\'e = ', { id: 'second', chips: ['e', "e'", '1'], answer: 'e', hint: 'Replace $x$ by $e$ in $e\'x = x$.' }],
        [
          "\\text{Since } ee' = e'e \\text{ by }",
          { id: 'why', chips: ['\\text{commutativity of } \\cdot', '\\text{choosing } e = 1', "\\text{assuming } e' \\ne 0"], answer: '\\text{commutativity of } \\cdot', hint: 'Which property of multiplication in $\\mathbb{R}$ swaps the two factors?' },
          ",\\ e = e'e = ee' = e'.",
        ],
      ],
      solution: [
        'Two candidates, shown equal: that is the uniqueness pattern from the last slide.',
        'With $x = e\'$ in $ex = x$: $ee\' = e\'$. With $x = e$ in $e\'x = x$: $e\'e = e$.',
        'Multiplication in $\\mathbb{R}$ is commutative, so $e = e\'e = ee\' = e\'$. Choosing $e = 1$ is not allowed: $e$ is any number with the property, and that it must be $1$ is the kind of fact this argument proves. The condition $e\' \\ne 0$ is never needed.',
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'prove-or-disprove',
      title: 'Prove or disprove',
      scene(s) {
        const claim = s.text('**Claim.** For all $n \\in \\mathbb{N}$, $f(n) = n^2 - n + 11$ is prime.', { y: 50, size: 32, visible: false });
        const xs = EULER.map((_, i) => 165 + i * 72);
        const hn = s.tex('n', { x: 75, y: 135, size: 32, visible: false });
        const hf = s.tex('f(n)', { x: 75, y: 200, size: 32, visible: false });
        const ns = EULER.map((r, i) => s.tex(String(r.n), { x: xs[i], y: 135, size: 32, visible: false }));
        const vs = EULER.map((r, i) => s.tex(String(r.v), { x: xs[i], y: 200, size: 32, visible: false }));
        const rule = s.line(45, 168, 915, 168, { color: C.line, width: 2, visible: false });
        const bad = E_BAD.n;
        const calc = s.tex(`f(${bad}) = ${bad}^2 - ${bad} + 11 = ${bad}^2 = ${E_BAD.v}`, { y: 330, size: 38, color: C.red, visible: false });
        const verdict = s.stamp('false', { x: 480, y: 420, color: 'red', size: 34 });
        const tip = s.text('Polynomial with constant term $11$? Try $n = 11$: then $11$ divides every term.', { y: 520, size: 30, width: 860, color: C.muted, visible: false });
        return { claim, hn, hf, ns, vs, rule, calc, verdict, tip, bad };
      },
      steps: [
        {
          say: '“Prove or disprove” means you must decide first. Try small cases: $n = 1${n equals one} gives eleven, then thirteen, seventeen, twenty-three… all the way to $n = 10${n equals ten}, every value is prime.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await s.all(o.hn.fadeIn(), o.hf.fadeIn(), o.rule.draw({ duration: 600 }));
            const good = EULER.filter((r) => r.prime).length;
            await s.stagger(
              o.ns.slice(0, good).map((m, i) => () => s.all(m.fadeIn({ duration: 250 }), o.vs[i].fadeIn({ duration: 250 }), o.vs[i].recolor(C.green, { delay: 200 }))),
              220,
            );
          },
        },
        {
          say: 'Ten successes, and the claim is still false: at $n = 11${n equals eleven}, $f(11) = 11^2 = 121${f of eleven equals eleven squared, which is one hundred twenty-one}, not prime. No number of examples proves a statement about infinitely many $n${n}.',
          do: async (s, o) => {
            const i = o.bad - 1;
            await s.all(o.ns[i].fadeIn(), o.vs[i].fadeIn());
            await o.vs[i].recolor(C.red);
            await s.ring(s.group(o.ns[i], o.vs[i]), { color: 'red', shape: 'box' });
            await o.calc.write();
            await o.verdict.slam();
          },
        },
        {
          say: 'A tip: when a polynomial has a constant term, try the value that makes the constant divide everything. Here $n = 11${n equals eleven} makes every term a multiple of eleven.',
          do: (s, o) => o.tip.fadeIn(),
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-cases',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Prove this by cases.',
      prompt: 'Prove that for every integer $n$, $3n^2 + n + 14$ is even.',
      answer: { type: 'proof' },
      hints: ['Split by parity: $n$ even or $n$ odd.', 'In the odd case, expand $3(2k + 1)^2 + (2k + 1) + 14$.'],
      solution: [
        '**Proof.** Let $n \\in \\mathbb{Z}$; then $n$ is even or odd.',
        'Case 1: $n = 2k$ for some $k \\in \\mathbb{Z}$. Then $3n^2 + n + 14 = 12k^2 + 2k + 14 = 2(6k^2 + k + 7)$, and $6k^2 + k + 7 \\in \\mathbb{Z}$, so it is even.',
        'Case 2: $n = 2k + 1$ for some $k \\in \\mathbb{Z}$. Then $3n^2 + n + 14 = 12k^2 + 12k + 3 + 2k + 1 + 14 = 12k^2 + 14k + 18 = 2(6k^2 + 7k + 9)$, and $6k^2 + 7k + 9 \\in \\mathbb{Z}$, so it is even.',
        'In every case $3n^2 + n + 14$ is even. ∎',
      ],
      rubric: [
        'States the parity split and that it is exhaustive.',
        'Correct algebra in both cases.',
        'Each case repacked as $2m$ with $m$ shown to be an integer.',
        'A concluding sentence covering all cases.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-cases',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we finish, explain when a proof by cases is complete, and how many examples it takes to prove or disprove a “for all” statement.',
      prompt: 'When is a proof by cases a complete proof? And how many examples does it take to prove, or to disprove, a “for all” statement?',
      points: [
        'The cases must be exhaustive (overlap is harmless, gaps are fatal), and each case must reach the conclusion.',
        'One verified counterexample disproves a universal statement.',
        'No number of examples proves a universal statement over an infinite domain.',
        'Uniqueness is proved by taking two objects with the property and showing they are equal.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Cases must cover everything; WLOG needs a stated symmetry.', 130),
          recapItem(s, '• Disprove with one checked counterexample. Existence: constructive or not. Uniqueness: any two are equal.', 250),
          recapItem(s, 'Next: sets, the language the rest of mathematics is written in.', 410, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'A proof by cases needs cases that cover everything, each reaching the conclusion. “Without loss of generality” needs a symmetry, and you must say what it is.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Disprove a universal claim with one specific, checked counterexample. Existence proofs can be constructive or not, and uniqueness means any two objects with the property are equal.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next: sets, the language the rest of mathematics is written in.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
