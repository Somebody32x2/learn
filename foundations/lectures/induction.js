/**
 * Lecture 15 · Mathematical induction (foundations/PLAN.md § 15). Irani · Induction · Liebeck 8.
 *
 * Choreography: the odd-number sum grows as L-shaped layers of dots; a row of dominoes is pushed (base case),
 * one generic pair is linked (inductive step), then the row topples. Proofs are `s.proof` columns with the
 * inductive hypothesis in blue, the goal P(k+1) in green and the line where the IH is used in yellow. The bogus
 * horse proof is drawn with dots and braces, and the missing overlap at k + 1 = 2 is shown in red.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, no DOM)

/** Partial sums of the first n odd numbers, n = 1..4. */
const ODD = [1, 2, 3, 4].map((n) => {
  const terms = Array.from({ length: n }, (_, i) => 2 * i + 1);
  return { n, terms, sum: terms.reduce((a, b) => a + b, 0) };
});

/** 2^n vs n^2 for n = 1..7. */
const POW = Array.from({ length: 7 }, (_, i) => {
  const n = i + 1;
  const a = 2 ** n, b = n * n;
  return { n, a, b, rel: a > b ? '>' : a === b ? '=' : '<' };
});

/** Smallest N with 2^n > n^2 for every n ≥ N (checked up to 200 with BigInt; induction does the rest). */
const START = (() => {
  let N = 200;
  for (let n = 200; n >= 1; n--) {
    if (2n ** BigInt(n) > BigInt(n * n)) N = n;
    else break;
  }
  return N;
})();

const BASE_DIV = 4 ** 1 - 1; // 3

// ---------------------------------------------------------------- local helpers (cards, stamps, rings: viz/common.js)

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

// ---------------------------------------------------------------- lecture

export default {
  id: 'induction',
  title: 'Mathematical induction',
  goals: [
    'State the principle of mathematical induction and explain why it is valid',
    'Write the base case, inductive hypothesis and inductive step explicitly',
    'Prove sum formulas, inequalities and divisibility statements by induction',
    'Find the flaw in a broken induction',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'pattern',
      title: 'A pattern',
      scene(s) {
        const rows = ODD.map((r, i) => {
          const head = r.terms.slice(0, -1).map((t) => `${t} + `).join('');
          return s.tex(`${head}\\part{t}{${r.terms.at(-1)}} = \\part{v}{${r.sum}}`, { x: 70, y: 130 + i * 90, size: 40, anchor: [0, 0.5], visible: false });
        });
        const G = 54, x0 = 620, y0 = 400;
        const dots = [];
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) dots.push({ i, j, layer: Math.max(i, j), d: s.dot(x0 + i * G, y0 - j * G, { r: 13, color: C.yellow, visible: false }) });
        const layers = [0, 1, 2, 3].map((k) => dots.filter((p) => p.layer === k).map((p) => p.d));
        const size = s.tex('1 \\times 1', { x: x0 + 1.5 * G, y: y0 + 60, size: 34, color: C.muted, visible: false });
        const lab = s.tex('\\part{n}{7} = 2 \\cdot 4 - 1 \\text{ new dots}', { x: x0 + 1.5 * G, y: y0 - 4 * G - 30, size: 32, color: C.yellow, visible: false });
        const gen = s.tex('k^2 + \\part{L}{(2k + 1)} = (k + 1)^2', { x: 690, y: 530, size: 38, visible: false });
        const idea = s.text('Each step adds one layer. Induction turns that into a proof.', { x: 480, y: 540, size: 32, color: C.green, visible: false });
        return { rows, layers, size, lab, gen, idea };
      },
      steps: [
        {
          say: 'Add up the first few odd numbers: one, then one plus three, then one plus three plus five. The totals are $1, 4, 9, 16${one, four, nine, sixteen}: the sum of the first $n${n} odd numbers looks like $n^2${n squared}.',
          do: async (s, o) => {
            for (let k = 0; k < 4; k++) {
              await s.all(
                o.rows[k].write({ duration: 650 }),
                ...o.layers[k].map((d, i) => d.draw({ delay: i * 60 })),
                ...o.layers.slice(0, k).flat().map((d) => d.recolor(C.blue)),
                k === 0 ? o.size.fadeIn() : o.size.swap(`${k + 1} \\times ${k + 1}`),
              );
              await o.rows[k].color('v', C.green);
            }
          },
        },
        {
          say: 'The picture suggests why. Each odd number is an L-shaped layer wrapped around the previous square: the fourth layer has $2 \\cdot 4 - 1 = 7${two times four minus one, which is seven} dots.',
          do: async (s, o) => {
            await s.all(...o.layers[3].map((d) => d.flash({ color: C.yellow })), o.lab.fadeIn());
            await s.all(o.rows[3].color('t', C.yellow), o.lab.indicate({ color: C.yellow }));
          },
        },
        {
          say: 'In general, a $k${k} by $k${k} square plus a layer of $2k + 1${two k plus one} dots is a $k + 1${k plus one} square. Induction is how we turn “each step adds a layer” into a proof.',
          do: async (s, o) => {
            await o.lab.fadeOut();
            await o.gen.write({ duration: 1100 });
            await o.gen.color('L', C.yellow);
            await s.wait(600);
            await o.gen.fadeOut({ shift: [0, -10] });
            await o.idea.fadeIn();
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'dominoes',
      title: 'Falling dominoes',
      scene(s) {
        const d = s.dominoes({ n: 12, x: 500, y: 250, w: 20, gap: 40, size: 30, label: (k) => String(k), visible: false });
        const pitch = 60, left = -390; // span = 11·60 + 20 + 100 = 780
        const cx = (i) => 500 + left + 20 + i * pitch - 10;
        const base = s.text('$P(1)$: the base case', { x: cx(0) - 26, y: 135, size: 30, color: C.green, anchor: [0, 0.5], visible: false });
        const link = s.arrow(cx(5) + 4, 165, cx(6) - 4, 165, { color: C.yellow, width: 4, visible: false });
        const linkLab = s.tex('P(k) \\implies P(k + 1)', { x: (cx(5) + cx(6)) / 2, y: 76, size: 32, color: C.yellow, visible: false });
        const note = s.text('domino $n$ stands for the statement $P(n)$', { x: 480, y: 400, size: 30, color: C.muted, visible: false });
        const card = s.defCard({ y: 470, width: 880, title: 'Principle of induction', tex: '\\text{If } \\part{b}{P(1)} \\text{ and } \\part{st}{\\forall k \\in \\mathbb{N}\\,(P(k) \\to P(k + 1))}, \\text{ then } \\forall n \\in \\mathbb{N},\\ P(n).', size: 30, visible: false });
        return { d, base, link, linkLab, note, card };
      },
      steps: [
        {
          say: 'Picture a row of dominoes, one for each statement $P(1), P(2), P(3)${P of one, P of two, P of three}, and so on. Push the first one over: that is the base case, checking $P(1)${P of one} directly.',
          do: async (s, o) => {
            await s.all(o.d.fadeIn(), o.note.fadeIn({ delay: 300 }));
            await o.d.push(0);
            await o.base.fadeIn();
          },
        },
        {
          say: 'Now make sure that every domino, whichever one it is, knocks over the next. That is the inductive step: for every $k${k}, $P(k)${P of k} implies $P(k + 1)${P of k plus one}.',
          do: async (s, o) => {
            await s.all(o.d.highlight(5, 'yellow'), o.d.highlight(6, 'yellow'));
            await s.all(o.link.draw({ duration: 500 }), o.linkLab.fadeIn());
          },
        },
        {
          say: 'With both in place, all of them fall. That is the principle of induction: if $P(1)${P of one} holds and each case implies the next, then $P(n)${P of n} holds for every natural number $n${n}.',
          do: async (s, o) => {
            await s.all(o.link.fadeOut(), o.linkLab.fadeOut(), o.note.fadeOut());
            await o.d.topple(0, { duration: 340 });
            await o.card.reveal();
            await s.all(o.card.color('b', C.green), o.card.color('st', C.yellow));
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'template',
      title: 'The template',
      scene(s) {
        const p = s.proof({ y: 40, width: 900, height: 530, size: 30, whyWidth: 150 });
        return { p };
      },
      steps: [
        {
          say: 'Every induction proof has the same skeleton. Announce the method, check the base case, then take one arbitrary $k${k} and suppose $P(k)${P of k}. That assumption is the inductive hypothesis, about one $k${k}, not about all of them.',
          do: async (s, o) => {
            await o.p.add('**Proof.** We proceed by induction on $n$.', { why: 'method' });
            await o.p.add('**Base case** ($n = 1$): check $P(1)$ directly.', { why: 'compute' });
            o.ih = o.p.add('**Inductive step.** Let $k \\in \\mathbb{N}$ and suppose $P(k)$.', { kind: 'assume', why: 'IH' });
            await o.ih;
            await o.p.note(o.ih, 'one arbitrary $k$, not “for all $k$”', { color: 'blue' });
          },
        },
        {
          say: 'Next, write the goal $P(k + 1)${P of k plus one} out in full before you compute anything. Knowing exactly what the last line must say is half the work.',
          do: async (s, o) => {
            o.goal = o.p.add('We show $P(k + 1)$: write it out in full.', { why: 'the goal' });
            await o.goal;
            await o.p.highlight(o.goal, 'green');
          },
        },
        {
          say: 'In the middle, somewhere, you use the inductive hypothesis, and you say so. Then the closing sentence: by induction, $P(n)${P of n} holds for all $n${n}.',
          do: async (s, o) => {
            o.mid = o.p.add('$\\vdots$', { why: '' });
            await o.mid;
            await o.p.add('By induction, $P(n)$ holds for all $n \\in \\mathbb{N}$.', { kind: 'conclude', why: 'induction' });
            await o.p.qed();
            await o.p.highlight(o.mid, 'yellow');
            await o.p.note(o.mid, 'the IH is used here, and the proof says “by the IH”', { color: 'yellow' });
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'sum-proof',
      title: 'Gauss’s sum',
      scene(s) {
        const thm = s.text('**Theorem.** For every $n \\in \\mathbb{N}$, $1 + 2 + \\cdots + n = n(n + 1)/2$.', { y: 46, size: 30, visible: false });
        const p = s.proof({ y: 76, width: 880, height: 498, size: 30, whyWidth: 160 });
        return { thm, p };
      },
      steps: [
        {
          say: 'Let’s prove that the first $n${n} numbers add up to $n(n + 1)/2${n times n plus one, over two}. Base case: when $n = 1${n equals one}, the left side is one, and the right side is one times two over two, also one.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.p.add('**Proof.** By induction on $n$. Base case: $1 = 1 \\cdot 2/2$.', { why: '$n = 1$' });
          },
        },
        {
          say: 'Inductive step: suppose the formula holds for some $k${k}. Then write the goal for $k + 1${k plus one}, with $k + 2${k plus two} in the numerator.',
          do: async (s, o) => {
            o.ih = o.p.add('Let $k \\in \\mathbb{N}$; suppose $\\sum_{i=1}^{k} i = k(k + 1)/2$.', { kind: 'assume', why: 'IH' });
            await o.ih;
            o.goal = o.p.add('Want: $\\sum_{i=1}^{k+1} i = (k + 1)(k + 2)/2$.', { why: 'goal' });
            await o.goal;
            await o.p.highlight(o.goal, 'green');
          },
        },
        {
          say: 'Split off the last term, so that what remains is exactly the sum the hypothesis talks about. Replace it by $k(k + 1)/2${k times k plus one, over two}, and say “by the IH”.',
          do: async (s, o) => {
            o.split = o.p.add('$\\sum_{i=1}^{k+1} i = \\col{blue}{\\sum_{i=1}^{k} i} + (k + 1)$', { why: 'split off $k + 1$', tex: false });
            await o.split;
            o.use = o.p.add('$= k(k + 1)/2 + (k + 1)$', { why: 'by the IH', tex: false, indent: 3 });
            await o.use;
            await s.all(o.p.highlight(o.use, 'yellow'), o.p.highlight(o.ih, 'blue'));
          },
        },
        {
          say: 'Now factor out $k + 1${k plus one}: we get $(k + 1)(k + 2)/2${k plus one, times k plus two, over two}, which is the goal, word for word. By induction, the formula holds for every $n${n}.',
          do: async (s, o) => {
            o.fin = o.p.add('$= (k + 1)(k + 2)/2$.', { why: 'factor', tex: false, indent: 3 });
            await o.fin;
            await o.p.highlight(o.fin, 'green');
            await o.p.add('Therefore the formula holds for all $n \\in \\mathbb{N}$.', { kind: 'conclude', why: 'induction' });
            await o.p.qed();
          },
        },
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-odd-sum',
      kind: 'blanks',
      title: 'The odd-number sum',
      say: 'Your turn: fill in the inductive step for the sum of the first n odd numbers.',
      prompt: 'Inductive step for $\\sum_{i=1}^{n} (2i - 1) = n^2$. Assume $\\sum_{i=1}^{k} (2i - 1) = k^2$ (the IH).',
      lines: [
        ['\\sum_{i=1}^{k+1}(2i - 1) = ', { id: 'ih', chips: ['k^2', '(k + 1)^2', '2k - 1'], answer: 'k^2', hint: 'The first $k$ terms add up to what the IH says.' }, '{} + (2(k + 1) - 1) \\quad \\text{by the IH}'],
        ['= k^2 + ', { id: 'last', chips: ['2k + 1', '2k - 1', '2k'], answer: '2k + 1', hint: '$2(k + 1) - 1 = 2k + 2 - 1$.' }],
        ['= ', { id: 'goal', chips: ['(k + 1)^2', 'k^2 + 1', '(2k + 1)^2'], answer: '(k + 1)^2', hint: 'Expand $(k + 1)^2$.' }],
      ],
      solution: [
        'The IH replaces the first $k$ terms: $\\sum_{i=1}^{k+1}(2i - 1) = \\sum_{i=1}^{k}(2i - 1) + (2(k + 1) - 1) = k^2 + (2k + 1)$.',
        'The rest is algebra: $k^2 + 2k + 1 = (k + 1)^2$, which is the statement for $n = k + 1$.',
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'inequality',
      title: 'An inequality with a late start',
      scene(s) {
        const colX = [95, 185, 265, 345];
        const head = ['n', '2^n', '', 'n^2'].map((t, j) => s.tex(t, { x: colX[j], y: 80, size: 32, color: C.muted, visible: false }));
        const rule = s.line(55, 108, 395, 108, { color: C.line, width: 2, visible: false });
        const rows = POW.map((r, i) => {
          const y = 145 + i * 58;
          const color = r.rel === '>' ? C.green : r.rel === '<' ? C.red : C.muted;
          return {
            r,
            cells: [String(r.n), String(r.a), r.rel, String(r.b)].map((t, j) => s.tex(t, { x: colX[j], y, size: 34, color: j === 2 ? color : C.ink, visible: false })),
            y,
          };
        });
        const r5 = rows[4].y, r7 = rows[6].y;
        const br = s.brace(410, r5 - 26, 410, r7 + 26, { side: 'right', color: C.green, visible: false });
        const claim = s.text('**Claim.** $2^n > n^2$ for all $n \\ge 5$.', { x: 700, y: 62, size: 32, visible: false });
        const hyp = s.text('Let $k \\ge 5$; suppose $2^k > k^2$.', { x: 700, y: 122, size: 30, color: C.blue, visible: false });
        const LX = 480;
        const L1 = s.tex('2^{k+1} = 2 \\cdot 2^k', { x: LX, y: 182, size: 36, anchor: [0, 0.5], visible: false });
        const L2 = s.tex('\\phantom{2^{k+1}} > 2k^2', { x: LX, y: 240, size: 36, anchor: [0, 0.5], visible: false });
        const L3 = s.tex('\\phantom{2^{k+1}} \\ge (k + 1)^2', { x: LX, y: 298, size: 36, anchor: [0, 0.5], visible: false });
        const w2 = s.text('by the IH', { x: 840, y: 240, size: 30, color: C.blue, visible: false });
        const w3 = s.text('why?', { x: 840, y: 298, size: 30, color: C.yellow, visible: false });
        const w3b = s.text('$k \\ge 5$', { x: 840, y: 298, size: 30, color: C.green, visible: false });
        const ex1 = s.tex('2k^2 - (k + 1)^2 = (k - 1)^2 - 2', { x: 680, y: 358, size: 30, color: C.yellow, visible: false });
        const ex2 = s.tex('> 0 \\text{ once } k \\ge 3 \\ \\ (\\part{k}{k \\ge 5})', { x: 680, y: 408, size: 30, color: C.yellow, visible: false });
        const fin = s.text('Hence $2^{k+1} > (k + 1)^2$: by induction, $2^n > n^2$ for $n \\ge 5$. ∎', { x: 680, y: 500, size: 30, width: 470, color: C.green, visible: false });
        return { head, rule, rows, br, claim, hyp, L1, L2, L3, w2, w3, w3b, ex1, ex2, fin };
      },
      steps: [
        {
          say: 'Compare $2^n${two to the n} with $n^2${n squared}. Two beats one, then they tie, then nine beats eight, then they tie again at sixteen, and from $n = 5${n equals five} on the powers of two pull ahead. Induction can start at any integer, so we claim it from five on.',
          do: async (s, o) => {
            await s.all(...o.head.map((h) => h.fadeIn()), o.rule.draw({ duration: 500 }));
            await s.stagger(o.rows.map((row) => () => s.all(...row.cells.map((c) => c.fadeIn({ shift: [0, 6], duration: 380 })))), 330);
            await s.all(o.br.draw(), o.claim.fadeIn());
            await s.ring(s.group(...o.rows[4].cells), { color: 'green', shape: 'box', pad: 8 });
          },
        },
        {
          say: 'The base case is the ringed row: $32 > 25${thirty-two is greater than twenty-five}. In the step, suppose $2^k > k^2${two to the k is greater than k squared}. Doubling and using the hypothesis gives $2^{k+1} > 2k^2${two to the k plus one is greater than two k squared}.',
          do: async (s, o) => {
            await o.hyp.fadeIn();
            await o.L1.write({ duration: 700 });
            await o.L2.write({ duration: 700 });
            await o.w2.fadeIn();
          },
        },
        {
          say: 'To reach $(k + 1)^2${k plus one, squared} we need one extra inequality. $2k^2${two k squared} minus $(k + 1)^2${k plus one, squared} is $(k - 1)^2 - 2${k minus one, squared, minus two}, which is positive once $k \\ge 3${k is at least three}, and our $k \\ge 5${k is at least five} guarantees that. So $2^{k+1} > (k + 1)^2${two to the k plus one is greater than k plus one squared}, and by induction the claim holds for every $n \\ge 5${n at least five}.',
          do: async (s, o) => {
            await s.all(o.L3.write({ duration: 700 }), o.w3.fadeIn());
            await o.ex1.write({ duration: 900 });
            await o.ex2.write({ duration: 900 });
            await s.ring([o.ex2, 'k'], { color: 'yellow', pad: 5 });
            await s.all(o.w3.fadeOut(), o.w3b.fadeIn());
            await o.fin.fadeIn();
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'try-base',
      kind: 'try',
      title: 'Where does it start?',
      say: 'Where exactly does this inequality start working for good? Check the small cases.',
      prompt: 'What is the smallest $N$ such that $2^n > n^2$ for every integer $n \\ge N$?',
      answer: { type: 'number', value: START },
      hint: 'Check $n = 1, 2, 3, 4$.',
      solution: [
        `$n = 2$ and $n = 4$ give equality ($4 = 4$, $16 = 16$) and $n = 3$ gives $8 < 9$, so $N$ must be larger than $4$.`,
        `From $n = ${START}$ on the inequality holds: $2^5 = 32 > 25$ is the base case, and the induction on the previous slide gives every $n \\ge 5$. So $N = ${START}$. ($n = 1$ works too, but the inequality fails again right after.)`,
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'divisibility-induction',
      title: 'Divisibility by induction',
      scene(s) {
        const claim = s.text('**Claim.** For all $n \\in \\mathbb{N}$, $3 \\mid 4^n - 1$.', { y: 52, size: 32, visible: false });
        const base = s.text(`**Base case.** $4^1 - 1 = ${BASE_DIV}$, and $3 \\mid ${BASE_DIV}$.`, { x: 480, y: 110, size: 30, visible: false });
        const ih = s.tex('\\text{IH: for some } k \\in \\mathbb{N},\\ \\part{old}{4^k - 1} = \\part{w}{3m} \\text{ with } m \\in \\mathbb{Z}', { x: 480, y: 175, size: 34, color: C.blue, visible: false });
        const X = 200;
        const A = s.tex('4^{k+1} - 1 = 4 \\cdot 4^k - 1', { x: X, y: 250, size: 38, anchor: [0, 0.5], visible: false });
        const B = s.tex('\\phantom{4^{k+1} - 1} = 4(\\part{old}{4^k - 1}) + 3', { x: X, y: 315, size: 38, anchor: [0, 0.5], visible: false });
        const Cc = s.tex('\\phantom{4^{k+1} - 1} = 4(\\part{w}{3m}) + 3', { x: X, y: 380, size: 38, anchor: [0, 0.5], visible: false });
        const D = s.tex('\\phantom{4^{k+1} - 1} = 3(\\part{q}{4m + 1})', { x: X, y: 445, size: 38, anchor: [0, 0.5], visible: false });
        const fly = s.tex('3m', { size: 34, color: C.yellow, visible: false });
        const fin = s.text('$4m + 1 \\in \\mathbb{Z}$, so $3 \\mid 4^{k+1} - 1$. By induction, $3 \\mid 4^n - 1$ for all $n \\in \\mathbb{N}$. ∎', { x: 480, y: 530, size: 30, width: 820, color: C.green, visible: false });
        return { claim, base, ih, A, B, Cc, D, fly, fin };
      },
      steps: [
        {
          say: 'Claim: three divides $4^n - 1${four to the n, minus one} for every $n${n}. The base case is $4 - 1 = 3${four minus one, which is three}. For the step, rewrite the $k + 1${k plus one} expression so that the $k${k} expression appears inside it.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await o.base.fadeIn();
            await o.ih.fadeIn();
            await o.A.write({ duration: 800 });
            await o.B.write({ duration: 900 });
            await s.all(o.B.color('old', C.blue), o.ih.flash({ color: C.blue }));
          },
        },
        {
          say: 'Now the inductive hypothesis hands us a witness: $4^k - 1 = 3m${four to the k minus one equals three m}. Substitute it in.',
          do: async (s, o) => {
            const from = o.ih.partBox('w');
            const to = o.Cc.partBox('w');
            o.fly.set({ x: from.cx, y: from.cy, opacity: 1 });
            o.fly.show();
            await o.Cc.write({ duration: 700 });
            o.Cc.color('w', C.yellow, { duration: 1 });
            await o.fly.moveTo(to.cx, to.cy, { duration: 900 });
            await o.fly.fadeOut({ duration: 250 });
            await o.Cc.flash({ color: C.yellow });
          },
        },
        {
          say: 'Factor out three, and repack with the definition of divides: $4m + 1${four m plus one} is an integer, so three divides $4^{k+1} - 1${four to the k plus one, minus one}. By induction, the claim holds for every $n${n}.',
          do: async (s, o) => {
            await o.D.write({ duration: 800 });
            await o.D.color('q', C.green);
            await o.fin.fadeIn();
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'horses',
      title: 'All horses are the same color?',
      scene(s) {
        const say = s.text('“Proof” of $P(k) \\Rightarrow P(k + 1)$: each group of $k$ horses is one color, and the groups overlap.', { y: 70, size: 30, width: 860, visible: false });
        const X = [255, 345, 435, 525, 615, 705];
        const Y = 236;
        const horses = X.map((x) => s.dot(x, Y, { r: 17, color: C.muted, visible: false }));
        const b1 = s.brace(X[0] - 22, Y - 34, X[4] + 22, Y - 34, { side: 'above', label: '\\text{first } k', size: 30, color: C.blue, visible: false });
        const b2 = s.brace(X[1] - 22, Y + 34, X[5] + 22, Y + 34, { side: 'below', label: '\\text{last } k', size: 30, color: C.teal, visible: false });
        const kk = s.text('$k + 1$ horses', { x: 840, y: Y, size: 30, color: C.muted, visible: false });
        const Y2 = 440, X2 = [420, 540];
        const two = [s.dot(X2[0], Y2, { r: 17, color: C.blue, visible: false }), s.dot(X2[1], Y2, { r: 17, color: C.orange, visible: false })];
        const c1 = s.brace(X2[0] - 24, Y2 - 34, X2[0] + 24, Y2 - 34, { side: 'above', label: '\\text{first } 1', size: 30, color: C.blue, visible: false });
        const c2 = s.brace(X2[1] - 24, Y2 + 34, X2[1] + 24, Y2 + 34, { side: 'below', label: '\\text{last } 1', size: 30, color: C.teal, visible: false });
        const gap = s.rect(X2[0] + 26, Y2 - 30, X2[1] - X2[0] - 52, 60, { color: C.red, fill: FILL.red, dash: '8 6', width: 3, radius: 10, visible: false });
        const k2 = s.text('$k + 1 = 2$', { x: 200, y: Y2, size: 32, color: C.red, visible: false });
        const none = s.text('no horse in both groups', { x: 770, y: Y2, size: 30, color: C.red, visible: false });
        const st = s.stamp('breaks at $k = 1$', { x: 770, y: Y2 + 75, size: 30 });
        return { say, X, Y, horses, b1, b2, kk, two, c1, c2, gap, k2, none, st };
      },
      steps: [
        {
          say: 'Here is a famous bad proof that all horses are the same color. Take $k + 1${k plus one} horses. The first $k${k} are one color by the hypothesis, the last $k${k} are one color too, and the groups overlap, so all of them match.',
          do: async (s, o) => {
            await o.say.fadeIn();
            await s.all(...o.horses.map((h, i) => h.draw({ delay: i * 90 })), o.kk.fadeIn());
            await s.all(o.b1.draw(), ...o.horses.slice(0, 5).map((h) => h.recolor(C.blue)));
            await s.all(o.b2.draw(), ...o.horses.slice(1).map((h) => h.recolor(C.blue)));
          },
        },
        {
          say: 'Look closely at the overlap argument. It needs at least one horse that belongs to both groups, to pass the color from one group to the other.',
          do: async (s, o) => {
            await s.ring(s.group(...o.horses.slice(1, 5)), { color: 'yellow', shape: 'box', pad: 12 });
            await s.all(...o.horses.slice(1, 5).map((h) => h.flash({ color: C.yellow })));
          },
        },
        {
          say: 'Now try it going from one horse to two. The first group is one horse, the last group is the other horse, and nothing is in both. The step fails at the very first link, so nothing falls after it.',
          do: async (s, o) => {
            await s.all(o.k2.fadeIn(), ...o.two.map((h, i) => h.draw({ delay: i * 150 })));
            await s.all(o.c1.draw(), o.c2.draw());
            await s.all(o.gap.fadeIn({ shift: [0, 0] }), o.none.fadeIn());
            await o.st.slam();
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'try-horses',
      kind: 'try',
      title: 'Find the flaw',
      say: 'So where exactly does the horse argument go wrong? Pick the best diagnosis.',
      prompt: 'Where does the “all horses are the same color” induction fail?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: 'The base case is false.', why: 'One horse does have one color: $P(1)$ is true.' },
        { id: 'b', label: 'The step from $k = 1$ to $k = 2$: the two groups don’t overlap.', why: 'Right. The overlap argument needs a horse in both groups, and with two horses there is none, so $P(1) \\Rightarrow P(2)$ is never proved.' },
        { id: 'c', label: 'Induction doesn’t apply to horses.', why: 'Induction applies to any statement $P(n)$ indexed by $n \\in \\mathbb{N}$.' },
        { id: 'd', label: 'The IH assumes the conclusion.', why: 'Assuming $P(k)$ for one $k$ to prove $P(k + 1)$ is exactly what the inductive step is allowed to do.' },
      ],
      hint: 'Draw the case $k + 1 = 2$.',
      solution: [
        'The inductive step must work for every $k \\ge 1$. At $k = 1$ the “first $k$” and “last $k$” groups are two different single horses with nothing in common, so the color cannot be passed along.',
        'The base case is fine and the other steps would be fine, but the chain breaks at its first link, so nothing after $P(1)$ is proved.',
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'why-works',
      title: 'Why induction works',
      scene(s) {
        const card = s.defCard({ y: 67, width: 860, title: false, body: '**Well-ordering.** Every nonempty subset of $\\mathbb{N}$ has a least element.', size: 30, visible: false });
        const nl = s.numberLine({ x: 480, y: 150, width: 760, range: [0, 11], ticks: 1, labels: (v) => (v >= 1 && v <= 10 ? String(v) : null), size: 30, visible: false });
        const p = s.proof({ y: 212, width: 880, height: 362, size: 30, whyWidth: 250 });
        const x = (v) => 480 + nl.toX(v);
        const arc = s.arrow(x(6), 115, x(7) - 6, 115, { color: C.yellow, width: 4, visible: false });
        return { card, nl, p, x, arc };
      },
      steps: [
        {
          say: 'Why is induction a valid way to prove things? It rests on a basic property of the natural numbers, well-ordering: every nonempty set of natural numbers has a smallest element. Induction and well-ordering are equivalent.',
          do: (s, o) => o.card.reveal(),
        },
        {
          say: 'Suppose the base case and the step both hold, but some $P(n)${P of n} fails. Then the set of failures is nonempty, so it has a first failure, call it $m${m}.',
          do: async (s, o) => {
            await o.nl.fadeIn();
            o.bad = [7, 9, 10].map((v) => o.nl.point(v, { color: 'red' }));
            await Promise.all(o.bad);
            await o.p.add('**Proof.** Assume $P(1)$ and the step.', { kind: 'assume', why: 'hypotheses' });
            await o.p.add('Suppose $S = \\{n \\in \\mathbb{N} : \\neg P(n)\\} \\ne \\varnothing$.', { why: 'assume not' });
            await o.p.add('Let $m = \\min S$.', { why: 'well-ordering' });
            o.ringM = s.ring({ x: o.x(7) - 20, y: 125, w: 40, h: 50 }, { color: 'yellow', shape: 'box', pad: 2 });
            await o.ringM;
          },
        },
        {
          say: 'The base case holds, so $m${m} isn’t one, and $m - 1${m minus one} is a natural number that does not fail. But then the step pushes $P(m - 1)${P of m minus one} over to $P(m)${P of m}: a contradiction.',
          do: async (s, o) => {
            o.good = [1, 2, 3, 4, 5, 6].map((v) => o.nl.point(v, { color: 'green' }));
            await Promise.all(o.good);
            await o.p.add('$m \\ne 1$, so $m - 1 \\in \\mathbb{N}$ and $P(m - 1)$.', { why: 'base case; $m$ least' });
            await o.arc.draw({ duration: 500 });
            await o.p.add('By the step, $P(m)$; but $m \\in S$.', { kind: 'contradiction', why: 'step' });
            await o.p.qed();
          },
        },
        {
          say: 'So there is no first failure, and hence no failure at all. That is also why assuming $P(k)${P of k} in the step is not circular: we prove an implication, and the chain does the rest.',
          do: async (s, o) => {
            await s.all(...o.bad.map((b) => b.fadeOut()), o.ringM.fadeOut(), o.arc.fadeOut());
            o.rest = [7, 8, 9, 10].map((v) => o.nl.point(v, { color: 'green' }));
            await Promise.all(o.rest);
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-sum-squares',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper and write a full induction proof: base case, hypothesis, goal, and the line where you use the hypothesis.',
      prompt: 'Prove by induction that for every $n \\in \\mathbb{N}$, $$\\sum_{i=1}^{n} i^2 = \\frac{n(n + 1)(2n + 1)}{6}.$$',
      answer: { type: 'proof' },
      hints: [
        'Base case $n = 1$: both sides equal $1$.',
        'In the step, factor $(k + 1)$ out of $\\tfrac{k(k+1)(2k+1)}{6} + (k + 1)^2$.',
        '$2k^2 + 7k + 6 = (k + 2)(2k + 3)$.',
      ],
      solution: [
        '**Proof.** We proceed by induction on $n$.',
        '**Base case.** For $n = 1$: $1^2 = 1 = \\tfrac{1 \\cdot 2 \\cdot 3}{6}$.',
        '**Inductive step.** Let $k \\in \\mathbb{N}$ and suppose $\\sum_{i=1}^{k} i^2 = \\tfrac{k(k+1)(2k+1)}{6}$. We show $\\sum_{i=1}^{k+1} i^2 = \\tfrac{(k+1)(k+2)(2k+3)}{6}$.',
        'By the inductive hypothesis, $\\sum_{i=1}^{k+1} i^2 = \\sum_{i=1}^{k} i^2 + (k + 1)^2 = \\tfrac{k(k+1)(2k+1)}{6} + (k+1)^2 = \\tfrac{(k+1)(2k^2 + k + 6k + 6)}{6} = \\tfrac{(k+1)(k+2)(2k+3)}{6}$, which is the formula for $n = k + 1$.',
        'By induction, the formula holds for all $n \\in \\mathbb{N}$. ∎',
      ],
      rubric: [
        'Base case $n = 1$ checked.',
        'Inductive hypothesis stated for one arbitrary $k \\in \\mathbb{N}$ (not “for all $k$”).',
        'The goal $P(k + 1)$ written out.',
        'The IH used visibly to replace $\\sum_{i=1}^{k} i^2$.',
        'Algebra correct, reaching $\\tfrac{(k+1)(k+2)(2k+3)}{6}$ (or showing equality with it), then a concluding sentence.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-bernoulli',
      kind: 'workout',
      title: 'Work it out',
      say: 'One more proof: Bernoulli’s inequality. Watch for the one step where you need to justify multiplying an inequality.',
      prompt: 'Prove Bernoulli’s inequality: for every real $x \\ge -1$ and every $n \\in \\mathbb{N}$, $(1 + x)^n \\ge 1 + nx$.',
      answer: { type: 'proof' },
      hints: ['Fix $x$ and induct on $n$.', 'Multiply the IH by $1 + x$: why is that allowed?'],
      solution: [
        '**Proof.** Fix a real number $x \\ge -1$. We proceed by induction on $n$.',
        '**Base case.** $(1 + x)^1 = 1 + x = 1 + 1 \\cdot x$.',
        '**Inductive step.** Let $k \\in \\mathbb{N}$ and suppose $(1 + x)^k \\ge 1 + kx$. Since $x \\ge -1$, we have $1 + x \\ge 0$, so multiplying both sides by $1 + x$ preserves the inequality: $(1 + x)^{k+1} \\ge (1 + kx)(1 + x) = 1 + (k + 1)x + kx^2$.',
        'Since $kx^2 \\ge 0$, this is $\\ge 1 + (k + 1)x$, which is the statement for $n = k + 1$.',
        'By induction, $(1 + x)^n \\ge 1 + nx$ for all $n \\in \\mathbb{N}$. ∎',
      ],
      rubric: [
        'Fixes $x \\ge -1$ and inducts on $n$.',
        'Base case $n = 1$.',
        'Multiplies the IH by $1 + x$ and justifies it with $1 + x \\ge 0$ (the key step).',
        'Drops $kx^2$ with the reason $kx^2 \\ge 0$.',
        'Concluding sentence.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-induction',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain in your own words why induction is not circular.',
      prompt: 'Why do $P(1)$ and “$P(k) \\Rightarrow P(k + 1)$ for every $k$” prove $P(n)$ for every $n$? Isn’t assuming $P(k)$ circular?',
      points: [
        'The step proves an implication $P(k) \\Rightarrow P(k + 1)$, not $P(k)$ itself.',
        'Chaining the implications from $P(1)$ reaches any $n$ in finitely many steps.',
        'Formally, a least counterexample would contradict the step (well-ordering).',
        'The step must hold for every $k$ from the base case on; the horse “proof” breaks at $k = 1$.',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Base case; inductive hypothesis for one arbitrary $k$; then show $P(k + 1)$, saying where the IH is used.', 130),
          recapItem(s, '• Sums, inequalities, divisibility: same template. Check every link, including the first.', 260),
          recapItem(s, 'Next: when one previous domino isn’t enough.', 400, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'An induction proof has three parts: the base case, the hypothesis for one arbitrary $k${k}, and the step to $P(k + 1)${P of k plus one}, saying exactly where the hypothesis is used.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'The same template proves sums, inequalities and divisibility facts. Check every link, including the first one: that is where the horses went wrong.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: what to do when one previous domino isn’t enough, with strong induction.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
