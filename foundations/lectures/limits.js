/**
 * Lecture 26 · Sequences and limits (foundations/PLAN.md § 26). Dumas–McCarthy 5 · Liebeck 23.
 *
 * Choreography: sequences drop onto number lines; the ε–N definition is a plot of (n, a_n) with a red tolerance
 * band around L and a green cutoff line at N (terms after N turn green; the band shrinks and N walks right).
 * Limit proofs are found in a dashed scratch pane, working backwards, which then folds to a one-line strip while the
 * two-column proof is written forwards. Divergence and uniqueness are shown with bands that cannot catch both
 * candidates; the sum law splits a tolerance budget in two.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';

// ---------------------------------------------------------------- data (computed, no DOM)

/** Smallest N with 1/N < eps (exact). */
const firstN = (eps) => {
  let n = 1;
  while (F(1).div(n).cmp(F(eps)) >= 0) n++;
  return n;
};

/** (an + b)/(cn + d) → a/c: a_n − a/c = (bc − ad) / (c(cn + d)). Returns the numerator constant and the limit. */
function rationalSeq(a, b, c, d) {
  const L = F(a).div(c);
  const num = F(b * c - a * d);
  // check the identity at a few n
  for (const n of [1, 2, 7, 50]) {
    if (c * n + d === 0) continue;
    const lhs = F(a * n + b).div(c * n + d).sub(L);
    const rhs = num.div(c * (c * n + d));
    if (!lhs.eq(rhs)) throw new Error('limits: rationalSeq identity');
  }
  return { L, num };
}

/** definition plot: a_n = 1 + (−1)^n / n → 1, so |a_n − 1| = 1/n. */
const PLOT_N = 40;
const PLOT_SEQ = Array.from({ length: PLOT_N }, (_, i) => 1 + (-1) ** (i + 1) / (i + 1));
const PLOT_EPS = ['0.3', '0.1', '0.05'].map((e) => ({ e: Number(e), N: firstN(e) }));

/** try-find-n: 1/n < 0.01 for all n ≥ N. */
const FIND_EPS = '0.01';
const FIND_N = firstN(FIND_EPS);

/** harder-limit: (2n + 1)/(n + 3) → 2; fill-limit: (3n − 1)/(n + 2) → 3; wo-limit: (n + 5)/(2n − 1) → 1/2. */
const HARD = rationalSeq(2, 1, 1, 3);
const HK = HARD.num.abs().toString();
const FILL_SEQ = rationalSeq(3, -1, 1, 2);
const FK = FILL_SEQ.num.abs().toString();
const WO = rationalSeq(1, 5, 2, -1);
const WK = WO.num.abs().toString();

/** monotone: a_1 = 1, a_{n+1} = √(2 + a_n). Limit: L² − L − 2 = 0, roots 2 and −1. */
const MONO = [1];
for (let i = 1; i < 14; i++) MONO.push(Math.sqrt(2 + MONO[i - 1]));
if (Math.abs(MONO.at(-1) - 2) > 1e-6 || MONO.some((v, i) => i && v <= MONO[i - 1])) throw new Error('limits: monotone example');

/** Uniqueness picture. */
const UL = 1.2;
const UM = 2.8;
const UEPS = Math.abs(UL - UM) / 2;

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });
const sx = (nl, v) => nl.x + nl.toX(v);
const only = (...vals) => (v) => {
  const hit = vals.find((w) => Math.abs(w[0] - v) < 1e-9);
  return hit === undefined ? null : hit[1];
};

/** A movable band (c − e, c + e) over a number line, drawn as a stage rect. */
function bandRect(s, nl, c, e, { h = 90, color = 'yellow' } = {}) {
  const r = s.rect(sx(nl, c - e), nl.y - h / 2, sx(nl, c + e) - sx(nl, c - e), h, { color: C[color], fill: FILL[color], width: 2, visible: false });
  r.to = (c2, e2, opts) => r.resize(sx(nl, c2 - e2), nl.y - h / 2, sx(nl, c2 + e2) - sx(nl, c2 - e2), h, opts);
  if (r.node.parentNode === nl.node.parentNode) r.node.parentNode.insertBefore(r.node, nl.node); // under the line, its points and labels
  return r;
}

// ---------------------------------------------------------------- lecture

export default {
  id: 'limits',
  title: 'Sequences and limits',
  goals: [
    'State the $\\varepsilon$–$N$ definition of $\\lim a_n = L$ and explain each quantifier',
    'Prove limits by finding $N$ in scratch work and writing the proof forwards',
    'Prove divergence by negating the definition; prove limits are unique',
    'Prove a limit law and state the monotone convergence theorem',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'intuition',
      title: 'Getting close and staying close',
      scene(s) {
        const l1 = s.numberLine({ x: 480, y: 175, width: 760, range: [-0.1, 1.1], ticks: 0.1, size: 30, labels: only([0, '0'], [0.5, '0.5'], [1, '1']), visible: false });
        const t1 = s.tex('a_n = 1/n', { x: 800, y: 95, size: 34, color: C.blue, visible: false });
        const l2 = s.numberLine({ x: 480, y: 390, width: 760, range: [-1.1, 1.1], ticks: 0.25, size: 30, labels: only([-1, '−1'], [0, '0'], [1, '1']), visible: false });
        const t2 = s.tex('b_n = (-1)^n / n', { x: 790, y: 310, size: 34, color: C.teal, visible: false });
        const words = s.tex('\\text{as close as we like} \\to \\part{e}{\\varepsilon} \\quad\\ \\text{from some point on} \\to \\part{n}{N}', { x: 480, y: 522, size: 32, visible: false });
        return { l1, t1, l2, t2, words };
      },
      steps: [
        {
          say: 'Watch the sequence $a_n = 1/n${a n equals one over n}: one, a half, a third, a quarter. The terms pile up near zero, as close as we like.',
          do: async (s, o) => {
            await s.all(o.l1.fadeIn(), o.t1.fadeIn());
            await o.l1.sequence((n) => 1 / n, 40, { gap: 110, r: 6 });
          },
        },
        {
          say: 'And they stay close. Pick a small tolerance around zero: from some point on, every term is inside it.',
          do: async (s, o) => {
            o.b1 = o.l1.band(0, 0.1, { label: '\\varepsilon', height: 70 });
            await o.b1.done;
            await o.l1.sequence((n) => 1 / n, 30, { start: 11, color: 'green', gap: 40, r: 6, trail: false });
          },
        },
        {
          say: 'Now $b_n = (-1)^n / n${b n equals minus one to the n, over n} hops back and forth across zero. It still closes in, from both sides.',
          do: async (s, o) => {
            await s.all(o.l2.fadeIn(), o.t2.fadeIn());
            await o.l2.sequence((n) => (-1) ** n / n, 40, { color: 'teal', gap: 110, r: 6 });
          },
        },
        {
          say: 'Those two phrases become the definition. As close as we like becomes $\\varepsilon${epsilon}. From some point on becomes $N${N}.',
          do: async (s, o) => {
            await o.words.write({ duration: 1200 });
            await s.all(o.words.color('e', C.red), o.words.color('n', C.green));
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'definition',
      title: 'The definition',
      scene(s) {
        const def = s.tex(
          '\\begin{gathered}\\lim_{n \\to \\infty} a_n = L \\iff \\\\ \\forall \\part{e1}{\\varepsilon} > 0\\ \\exists \\part{N1}{N} \\in \\mathbb{N}\\ \\forall n \\ge \\part{N2}{N},\\ \\lvert a_n - L \\rvert < \\part{e2}{\\varepsilon}\\end{gathered}',
          { x: 480, y: 92, size: 34, visible: false },
        );
        const X = (n) => 110 + (n - 0.5) * 19.25;
        const Y = (v) => 540 - ((v + 0.1) / 1.7) * 350;
        const xAxis = s.arrow(95, 555, 895, 555, { color: C.muted, width: 2, visible: false });
        const nLbl = s.tex('n', { x: 910, y: 535, size: 30, color: C.muted, visible: false });
        const Lline = s.line(95, Y(1), 890, Y(1), { color: C.ink, width: 2, dash: '8 6', visible: false });
        const Llbl = s.tex('L', { x: 70, y: Y(1), size: 34, visible: false });
        const dots = PLOT_SEQ.map((v, i) => s.dot(X(i + 1), Y(v), { r: 6, color: C.blue, visible: false }));
        const band = (e) => [95, Y(1 + e), 795, Y(1 - e) - Y(1 + e)];
        const b0 = band(PLOT_EPS[0].e);
        const bandR = s.rect(b0[0], b0[1], b0[2], b0[3], { color: C.red, fill: FILL.red, width: 2, visible: false });
        const epsLbl = s.tex('\\varepsilon', { x: 910, y: Y(1 - PLOT_EPS[0].e / 2), size: 32, color: C.red, visible: false });
        const nx = (N) => X(N) - 9.6;
        const Nline = s.line(nx(PLOT_EPS[0].N), 190, nx(PLOT_EPS[0].N), 555, { color: C.green, width: 4, visible: false });
        const Nlbl = s.tex('N', { x: nx(PLOT_EPS[0].N), y: 175, size: 32, color: C.green, visible: false });
        return { def, xAxis, nLbl, Lline, Llbl, dots, bandR, band, epsLbl, Nline, Nlbl, nx, Y };
      },
      steps: [
        {
          say: 'Read the definition as a game. Here are the terms of a sequence, plotted against $n${n}, closing in on $L${L}. First a challenger picks a tolerance $\\varepsilon${epsilon}: a band around $L${L}.',
          do: async (s, o) => {
            await o.def.write({ duration: 1300 });
            await s.all(o.xAxis.draw({ duration: 500 }), o.nLbl.fadeIn(), o.Lline.draw({ duration: 600 }), o.Llbl.fadeIn());
            await s.stagger(o.dots.map((d) => () => d.draw({ duration: 250 })), 40);
            await s.all(o.bandR.fadeIn({ shift: [0, 0] }), o.epsLbl.fadeIn(), o.def.color('e1', C.red), o.def.color('e2', C.red));
          },
        },
        {
          say: 'You answer with a cutoff $N${N}, and you are allowed to look at $\\varepsilon${epsilon} first: $N${N} may depend on it.',
          do: async (s, o) => {
            await s.all(o.Nline.draw({ duration: 600 }), o.Nlbl.fadeIn(), o.def.color('N1', C.green), o.def.color('N2', C.green));
          },
        },
        {
          say: 'You win if every term from $N${N} on lies inside the band. Every single one, forever: not most of them.',
          do: async (s, o) => {
            const N = PLOT_EPS[0].N;
            await s.all(o.dots.map((d, i) => d.recolor(i + 1 >= N ? C.green : C.muted)));
            await s.all(o.dots.slice(N - 1).map((d) => d.indicate({ color: C.green, scale: 1.3 })));
          },
        },
        {
          say: 'A smaller $\\varepsilon${epsilon} needs a later $N${N}. The sequence converges to $L${L} when you can win for every $\\varepsilon${epsilon}, however small.',
          do: async (s, o) => {
            for (const { e, N } of PLOT_EPS.slice(1)) {
              const b = o.band(e);
              await s.all(
                o.bandR.resize(b[0], b[1], b[2], b[3], { duration: 800 }),
                o.epsLbl.moveTo(910, o.Y(1 - e / 2)),
                o.Nline.setEnds(o.nx(N), 190, o.nx(N), 555, { duration: 800 }),
                o.Nlbl.moveTo(o.nx(N), 175, { duration: 800 }),
              );
              await s.all(o.dots.map((d, i) => d.recolor(i + 1 >= N ? C.green : C.muted)));
            }
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'one-over-n',
      title: 'First limit proof',
      scene(s) {
        const thm = s.text('**Theorem.** $\\lim_{n \\to \\infty} 1/n = 0$.', { y: 50, size: 32, visible: false });
        const pad = s.scratch({ x: 40, y: 80, w: 880, h: 330, visible: false });
        const strip = s.tex('\\text{scratch: } 1/n < \\varepsilon \\iff n > 1/\\varepsilon', { x: 480, y: 98, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 126, width: 900, height: 356, size: 30, whyWidth: 230, visible: false });
        const traps = [
          s.text('✗ “Choose $N = 2n$”: $N$ may depend on $\\varepsilon$, never on $n$', { x: 460, y: 508, size: 30, color: C.red, visible: false }),
          s.text('✗ handing in the scratch work: it runs backwards from the goal', { x: 460, y: 551, size: 30, color: C.red, visible: false }),
        ];
        return { thm, pad, strip, p, traps };
      },
      steps: [
        {
          say: 'First, scratch work, where we may run backwards. Start from what we want, $\\lvert 1/n - 0 \\rvert < \\varepsilon${the distance from one over n to zero is less than epsilon}, and turn it into a condition on $n${n}.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.pad.reveal();
            await o.pad.add('\\text{want: } \\lvert 1/n - 0 \\rvert < \\varepsilon', { color: 'green', tex: true });
            await o.pad.add('\\iff 1/n < \\varepsilon', { color: 'green', tex: true });
            await o.pad.add('\\iff n > 1/\\varepsilon', { color: 'yellow', tex: true });
          },
        },
        {
          say: 'So choose $N > 1/\\varepsilon${N greater than one over epsilon}. Then every $n \\ge N${n at least N} also satisfies $n > 1/\\varepsilon${n greater than one over epsilon}.',
          do: async (s, o) => {
            await o.pad.add('\\text{choose } N > 1/\\varepsilon: \\text{ then } n \\ge N \\implies n > 1/\\varepsilon', { color: 'blue', tex: true });
          },
        },
        {
          say: 'Now the proof, written forwards. Fix an arbitrary $\\varepsilon${epsilon}, then choose $N${N}. The Archimedean property guarantees such an $N${N} exists.',
          do: async (s, o) => {
            await o.pad.fadeOut({ shift: [-30, 0] });
            o.p.show();
            await o.strip.fadeIn();
            await o.p.add('**Proof.** Let $\\varepsilon > 0$.', { kind: 'assume', why: 'arbitrary' });
            o.arch = o.p.add('Choose $N \\in \\mathbb{N}$ with $N > 1/\\varepsilon$.', { why: 'Archimedean' });
            await o.arch;
            await o.p.highlight(o.arch, 'yellow');
          },
        },
        {
          say: 'Then check every $n \\ge N${n at least N}: the distance is $1/n${one over n}, at most $1/N${one over N}, which is less than $\\varepsilon${epsilon}.',
          do: async (s, o) => {
            await o.p.unhighlight(o.arch);
            await o.p.add('Let $n \\in \\mathbb{N}$ with $n \\ge N$.', { why: 'arbitrary' });
            await o.p.add('Then $\\lvert 1/n - 0 \\rvert = 1/n \\le 1/N < \\varepsilon$.', { why: '$n \\ge N$; choice of $N$' });
            await o.p.add('Therefore $\\lim_{n \\to \\infty} 1/n = 0$. $\\blacksquare$', { kind: 'conclude', why: 'def. of limit' });
            await o.strip.indicate({ color: C.yellow });
          },
        },
        {
          say: 'Here is the trap. Two mistakes cost full credit on proofs like this: choosing $N${N} in terms of $n${n}, so the cutoff moves with every term, and handing in the scratch work, which runs backwards from what you want.',
          do: async (s, o) => {
            await s.all(o.traps.map((t, i) => t.fadeIn({ delay: i * 600, shift: [-12, 0] })));
            await s.all(o.traps.map((t) => t.indicate({ color: C.red })));
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-find-n',
      kind: 'try',
      title: 'Find N',
      say: 'Quick computation. Find the smallest $N${N} that works for this tolerance.',
      prompt: `For $a_n = 1/n$, $L = 0$ and $\\varepsilon = ${FIND_EPS}$, what is the smallest $N$ that works?`,
      answer: { type: 'number', value: String(FIND_N) },
      hint: `You need $1/n < ${FIND_EPS}$ for every $n \\ge N$.`,
      solution: [
        `$1/n < ${FIND_EPS} \\iff n > ${FIND_N - 1}$. At $n = ${FIND_N - 1}$, $1/n = ${FIND_EPS}$ exactly, which is not $< ${FIND_EPS}$.`,
        `So the smallest $N$ is $${FIND_N}$. Any larger $N$ also works: the definition never asks for the smallest one.`,
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'harder-limit',
      title: 'Bounding by something simpler',
      scene(s) {
        const thm = s.text('**Claim.** $a_n = (2n + 1)/(n + 3) \\to 2$.', { y: 50, size: 32, visible: false });
        const pad = s.scratch({ x: 40, y: 80, w: 880, h: 465, visible: false });
        const strip = s.tex(`\\text{scratch: } \\lvert a_n - 2 \\rvert = ${HK}/(n + 3) < ${HK}/n < \\varepsilon \\iff n > ${HK}/\\varepsilon`, { x: 480, y: 98, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 126, width: 900, height: 444, size: 30, whyWidth: 270, visible: false });
        return { thm, pad, strip, p };
      },
      steps: [
        {
          say: 'Here the terms are fractions in $n${n}. Step one: simplify $\\lvert a_n - 2 \\rvert${the distance from a n to two} exactly, over a common denominator. It comes to five over $n + 3${n plus three}.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.pad.reveal();
            await o.pad.add(`\\lvert a_n - 2 \\rvert = \\left\\lvert \\dfrac{2n + 1 - 2(n + 3)}{n + 3} \\right\\rvert = \\dfrac{${HK}}{n + 3}`, { color: 'blue', tex: true });
          },
        },
        {
          say: 'Step two: bound it by something simpler that still goes to zero. Dropping the plus three makes the denominator smaller, so the fraction gets bigger: $\\frac{5}{n + 3} < \\frac{5}{n}${five over n plus three is less than five over n}.',
          do: async (s, o) => {
            await o.pad.add(`\\dfrac{${HK}}{n + 3} < \\dfrac{${HK}}{n}`, { color: 'blue', tex: true });
          },
        },
        {
          say: 'Step three: choose $N${N} from the simpler bound. We want $5/n < \\varepsilon${five over n less than epsilon}, which holds when $n > 5/\\varepsilon${n is greater than five over epsilon}.',
          do: async (s, o) => {
            await o.pad.add(`\\text{want } \\dfrac{${HK}}{n} < \\varepsilon \\iff n > \\dfrac{${HK}}{\\varepsilon}`, { color: 'green', tex: true });
            await o.pad.add(`\\text{choose } N > ${HK}/\\varepsilon`, { color: 'yellow', tex: true });
          },
        },
        {
          say: 'Now write it forwards. Let $\\varepsilon > 0${epsilon be positive}, and choose $N > 5/\\varepsilon${N greater than five over epsilon}, by the Archimedean property.',
          do: async (s, o) => {
            await o.pad.fadeOut({ shift: [-30, 0] });
            o.p.show();
            await o.strip.fadeIn();
            await o.p.add('**Proof.** Let $\\varepsilon > 0$.', { kind: 'assume', why: 'arbitrary' });
            await o.p.add(`Choose $N \\in \\mathbb{N}$ with $N > ${HK}/\\varepsilon$.`, { why: 'Archimedean' });
          },
        },
        {
          say: 'For $n \\ge N${n at least N}, one chain of inequalities does it: exact value, simpler bound, then the choice of $N${N}.',
          do: async (s, o) => {
            await o.p.add(`Let $n \\ge N$: $\\lvert a_n - 2 \\rvert = ${HK}/(n + 3)$`, { why: 'algebra' });
            o.chain = o.p.add(`$\\phantom{Let n} < ${HK}/n \\le ${HK}/N < \\varepsilon$.`, { why: '$n + 3 > n$; $n \\ge N$; choice of $N$', indent: 1 });
            await o.chain;
            await o.p.highlight(o.chain, 'yellow');
            await o.p.add('Therefore $a_n \\to 2$.', { kind: 'conclude', why: 'def. of limit' });
            await o.p.qed();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-limit',
      kind: 'blanks',
      title: 'Fill in the scratch work',
      say: 'Do the scratch work for a similar sequence by filling in the blanks.',
      prompt: 'Scratch work for $a_n = \\dfrac{3n - 1}{n + 2} \\to 3$.',
      lines: [
        [{ tex: '\\lvert a_n - 3 \\rvert = \\frac{\\blank{k}}{n + 2}', blanks: { k: { answer: { type: 'number', value: FK }, hint: 'Compute $3n - 1 - 3(n + 2)$ and take the absolute value.' } } }],
        [{ tex: `\\frac{${FK}}{n + 2} < \\frac{${FK}}{\\blank{d}}`, blanks: { d: { chips: ['n', 'n + 3', 'n^2'], answer: 'n', hint: 'Make the denominator smaller, but keep the bound simple and true for every $n$.' } } }],
        ['\\text{so choose } ', { tex: 'N > \\frac{\\blank{c}}{\\varepsilon}', blanks: { c: { answer: { type: 'number', value: FK }, hint: 'Solve $k/n < \\varepsilon$ for $n$.' } } }],
      ],
      solution: [
        `$3n - 1 - 3(n + 2) = ${FILL_SEQ.num.toString()}$, so $\\lvert a_n - 3 \\rvert = ${FK}/(n + 2)$.`,
        `Dropping the $+2$ makes the denominator smaller and the fraction larger: $${FK}/(n + 2) < ${FK}/n$. ($n + 3$ would make it smaller, so it is not an upper bound; $n^2$ is smaller than $n + 2$ only for small $n$.)`,
        `$${FK}/n < \\varepsilon \\iff n > ${FK}/\\varepsilon$, so choose $N > ${FK}/\\varepsilon$.`,
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'divergence',
      title: 'Proving divergence',
      scene(s) {
        const def = s.tex('a_n \\to L:\\quad \\forall \\varepsilon > 0\\ \\exists N\\ \\forall n \\ge N,\\ \\lvert a_n - L \\rvert < \\varepsilon', { x: 480, y: 54, size: 32, color: C.muted, visible: false });
        const neg = s.tex(
          'a_n \\not\\to L:\\quad \\part{q1}{\\exists} \\varepsilon > 0\\ \\part{q2}{\\forall} N\\ \\part{q3}{\\exists} n \\ge N,\\ \\lvert a_n - L \\rvert \\part{q4}{\\ge} \\varepsilon',
          { x: 480, y: 116, size: 34, visible: false },
        );
        const div = s.tex('(a_n) \\text{ diverges} \\iff \\text{for every } L \\in \\mathbb{R},\\ a_n \\not\\to L', { x: 480, y: 182, size: 32, visible: false });
        const nl = s.numberLine({ x: 480, y: 330, width: 760, range: [-1.5, 1.5], ticks: 0.25, size: 30, labels: only([-1, '−1'], [0, '0'], [1, '1']), visible: false });
        const seq = s.tex('a_n = (-1)^n', { x: 150, y: 250, size: 32, color: C.blue, visible: false });
        const band = bandRect(s, nl, 0.3, 1);
        const tri = s.tex('2 = \\lvert 1 - (-1) \\rvert \\le \\lvert 1 - L \\rvert + \\lvert L - (-1) \\rvert', { x: 480, y: 450, size: 34, visible: false });
        const triNote = s.text('so $\\lvert 1 - L \\rvert \\ge 1$ or $\\lvert -1 - L \\rvert \\ge 1$; that value recurs past every $N$, so $\\varepsilon = 1$ works', { x: 480, y: 525, size: 30, width: 860, color: C.red, visible: false });
        return { def, neg, div, nl, seq, band, tri, triNote };
      },
      steps: [
        {
          say: 'To prove a sequence does not converge to $L${L}, negate the definition. Every quantifier flips, and less than becomes at least: some tolerance is violated arbitrarily late.',
          do: async (s, o) => {
            await o.def.fadeIn();
            await o.neg.write({ duration: 1200 });
            await s.stagger(['q1', 'q2', 'q3', 'q4'].map((q) => () => o.neg.color(q, C.red)), 250);
          },
        },
        {
          say: 'A sequence diverges when that holds for every candidate $L${L}: no number at all is its limit.',
          do: (s, o) => o.div.write(),
        },
        {
          say: 'Take $a_n = (-1)^n${a n equals minus one to the n}, hopping between minus one and one. Try $L = 0.3${L equals zero point three} with $\\varepsilon = 1${epsilon equals one}: the band can’t hold minus one, and minus one keeps coming back.',
          do: async (s, o) => {
            await s.all(o.nl.fadeIn(), o.seq.fadeIn());
            o.pm = [o.nl.point(-1, { color: 'blue' }), o.nl.point(1, { color: 'blue' })];
            await s.all(o.pm);
            o.hop = o.nl.marker(-1, { color: 'teal' });
            await o.hop;
            for (const v of [1, -1, 1, -1]) await o.hop.moveTo(v, { duration: 350 });
            o.L = o.nl.point(0.3, { color: 'orange', label: 'L' });
            await o.L;
            await o.band.fadeIn({ shift: [0, 0] });
            o.bad = o.nl.point(-1, { color: 'red', r: 12 });
            await o.bad;
          },
        },
        {
          say: 'Any other $L${L} fails the same way, by the triangle inequality: minus one and one are two apart, so at least one of them is at distance one or more from $L${L}.',
          do: async (s, o) => {
            await s.all(o.bad.fadeOut(), o.L.moveTo(-0.4), o.band.to(-0.4, 1, { duration: 700 }));
            o.bad2 = o.nl.point(1, { color: 'red', r: 12 });
            await o.bad2;
            await o.tri.write();
            await o.triNote.fadeIn();
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'uniqueness',
      title: 'Limits are unique',
      scene(s) {
        const nl = s.numberLine({ x: 480, y: 98, width: 760, range: [0, 4], ticks: 0.5, size: 30, labels: false, visible: false });
        const bL = bandRect(s, nl, UL, UEPS, { h: 44, color: 'teal' });
        const bM = bandRect(s, nl, UM, UEPS, { h: 44, color: 'orange' });
        const p = s.proof({ y: 128, width: 900, height: 444, size: 30, whyWidth: 225 });
        return { nl, bL, bM, p };
      },
      steps: [
        {
          say: 'Could a sequence converge to two different numbers $L${L} and $M${M}? Choose $\\varepsilon${epsilon} to separate them: half the distance between them. The two bands then don’t overlap.',
          do: async (s, o) => {
            await o.nl.fadeIn();
            await s.all(o.nl.point(UL, { color: 'teal', label: 'L' }), o.nl.point(UM, { color: 'orange', label: 'M' }));
            await s.all(o.bL.fadeIn({ shift: [0, 0] }), o.bM.fadeIn({ shift: [0, 0], delay: 200 }));
            await o.p.add('**Proof.** If $L \\ne M$, let $\\varepsilon = \\lvert L - M \\rvert / 2$.', { kind: 'assume', why: 'for contradiction' });
          },
        },
        {
          say: 'Each limit gives a cutoff: $N_1${N one} for $L${L} and $N_2${N two} for $M${M}. The term at the larger cutoff must lie in both bands. But a term inside the band around $L${L}, like this one, is outside the band around $M${M}.',
          do: async (s, o) => {
            await o.p.add('Choose $N_1$: $\\lvert a_k - L \\rvert < \\varepsilon$ for $k \\ge N_1$;', { why: '$a_n \\to L$' });
            await o.p.add('choose $N_2$: $\\lvert a_k - M \\rvert < \\varepsilon$ for $k \\ge N_2$.', { why: '$a_n \\to M$' });
            o.max = o.p.add('Let $n = \\max(N_1, N_2)$.', { why: 'both apply' });
            await o.max;
            await o.p.highlight(o.max, 'yellow');
            o.an = o.nl.marker(1.6, { label: 'a_n', color: 'red' });
            await o.an;
            await s.all(o.bL.indicate({ color: C.green }), o.bM.indicate({ color: C.red }));
          },
        },
        {
          say: 'The triangle inequality gives the contradiction: the distance from $L${L} to $M${M} would be less than twice $\\varepsilon${epsilon}, which is that same distance. So a limit, if it exists, is unique, and we may say the limit.',
          do: async (s, o) => {
            await o.p.unhighlight(o.max);
            await o.p.add('$\\lvert L - M \\rvert \\le \\lvert L - a_n \\rvert + \\lvert a_n - M \\rvert$', { why: 'triangle ineq.' });
            await o.p.add('$\\phantom{\\lvert L - M \\rvert} < 2\\varepsilon = \\lvert L - M \\rvert$.', { kind: 'contradiction', why: '$n \\ge N_1, N_2$' });
            await o.p.add('Therefore $L = M$. $\\blacksquare$', { kind: 'conclude', why: 'contradiction' });
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'try-negation-limit',
      kind: 'try',
      title: 'Negate the definition',
      say: 'Which of these says the sequence does not converge to $L${L}? Flip the quantifiers carefully.',
      prompt: 'Which statement means “$(a_n)$ does not converge to $L$”?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '${\\exists \\varepsilon > 0}$ ${\\forall N}$ ${\\exists n \\ge N}$, ${\\lvert a_n - L \\rvert \\ge \\varepsilon}$', why: 'Every quantifier flipped and $<$ negated to $\\ge$: some tolerance is violated arbitrarily late.' },
        { id: 'b', label: '${\\forall \\varepsilon > 0}$ ${\\exists N}$ ${\\forall n \\ge N}$, ${\\lvert a_n - L \\rvert \\ge \\varepsilon}$', why: 'Much stronger: eventually always far, for every $\\varepsilon$. Only the inequality was negated.' },
        { id: 'c', label: '${\\exists \\varepsilon > 0}$ ${\\exists N}$ ${\\forall n \\ge N}$, ${\\lvert a_n - L \\rvert \\ge \\varepsilon}$', why: 'Stronger: eventually *always* far. $(-1)^n$ with $L = 1$ does not converge to $1$ but fails this, since half its terms equal $1$.' },
        { id: 'd', label: '${\\exists \\varepsilon > 0}$ ${\\forall N}$ ${\\forall n \\ge N}$, ${\\lvert a_n - L \\rvert \\ge \\varepsilon}$', why: 'Stronger: every term far, from every point on. Not converging only needs far terms infinitely often.' },
      ],
      hint: 'Flip each quantifier ($\\forall \\leftrightarrow \\exists$) and negate $<$.',
      solution: [
        '$\\neg(\\forall \\varepsilon\\ \\exists N\\ \\forall n \\ge N,\\ \\lvert a_n - L \\rvert < \\varepsilon) \\equiv \\exists \\varepsilon\\ \\forall N\\ \\exists n \\ge N,\\ \\lvert a_n - L \\rvert \\ge \\varepsilon$: answer (a).',
        '$(-1)^n$ with $L = 1$ satisfies (a) with $\\varepsilon = 1$ (the odd terms are $2$ away), but not (c), because the even terms equal $1$ no matter how late you look.',
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'sum-law',
      title: 'The sum law',
      scene(s) {
        const thm = s.text('**Theorem.** If $a_n \\to A$ and $b_n \\to B$, then $a_n + b_n \\to A + B$.', { y: 50, size: 30, visible: false });
        const p = s.proof({ y: 76, width: 900, height: 456, size: 30, whyWidth: 180 });
        const bx = 300, bw = 440, by = 536, bh = 36;
        const budget = s.text('budget $\\varepsilon$:', { x: 200, y: by + bh / 2, size: 30, color: C.muted, visible: false });
        const half1 = s.rect(bx, by, bw / 2, bh, { color: C.blue, fill: FILL.blue, width: 2, visible: false });
        const half2 = s.rect(bx + bw / 2, by, bw / 2, bh, { color: C.teal, fill: FILL.teal, width: 2, visible: false });
        const t1 = s.tex('\\varepsilon/2 \\text{ for } a_n', { x: bx + bw / 4, y: by + bh / 2, size: 30, color: C.blue, visible: false });
        const t2 = s.tex('\\varepsilon/2 \\text{ for } b_n', { x: bx + (3 * bw) / 4, y: by + bh / 2, size: 30, color: C.teal, visible: false });
        return { thm, p, budget, half1, half2, t1, t2 };
      },
      steps: [
        {
          say: 'Suppose $a_n \\to A${a n tends to A} and $b_n \\to B${b n tends to B}; we prove $a_n + b_n \\to A + B${a n plus b n tends to A plus B}. The error of the sum is at most the sum of the errors, so spend half the tolerance on each sequence.',
          do: async (s, o) => {
            await s.all(o.thm.fadeIn(), o.budget.fadeIn(), o.half1.fadeIn({ shift: [0, 0] }), o.half2.fadeIn({ shift: [0, 0] }), o.t1.fadeIn({ delay: 200 }), o.t2.fadeIn({ delay: 200 }));
            await o.p.add('**Proof.** Let $\\varepsilon > 0$.', { kind: 'assume', why: 'arbitrary' });
            o.n1 = o.p.add('Choose $N_1$: $\\lvert a_n - A \\rvert < \\varepsilon/2$ for $n \\ge N_1$.', { why: '$a_n \\to A$' });
            await o.n1;
            o.n2 = o.p.add('Choose $N_2$: $\\lvert b_n - B \\rvert < \\varepsilon/2$ for $n \\ge N_2$.', { why: '$b_n \\to B$' });
            await o.n2;
            await s.all(o.p.highlight(o.n1, 'yellow'), o.p.highlight(o.n2, 'yellow'));
          },
        },
        {
          say: 'Take the later of the two cutoffs, so both estimates hold at once.',
          do: async (s, o) => {
            await s.all(o.p.unhighlight(o.n1), o.p.unhighlight(o.n2));
            await o.p.add('Let $n \\in \\mathbb{N}$ with $n \\ge \\max(N_1, N_2)$.', { why: 'both apply' });
          },
        },
        {
          say: 'The triangle inequality adds the errors, and the two halves add up to exactly $\\varepsilon${epsilon}.',
          do: async (s, o) => {
            await o.p.add('$\\lvert a_n + b_n - A - B \\rvert \\le \\lvert a_n - A \\rvert + \\lvert b_n - B \\rvert$', { why: 'triangle ineq.' });
            o.sum = o.p.add('$< \\varepsilon/2 + \\varepsilon/2 = \\varepsilon$.', { why: 'choice of $N_i$', indent: 1 });
            await o.sum;
            await s.all(o.half1.indicate({ color: C.green }), o.half2.indicate({ color: C.green }), o.p.highlight(o.sum, 'green'));
            await o.p.add('Therefore $a_n + b_n \\to A + B$. $\\blacksquare$', { kind: 'conclude', why: 'def. of limit' });
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'monotone',
      title: 'Monotone convergence',
      scene(s) {
        const card = s.defCard({
          y: 86, width: 880, kind: 'theorem', title: false,
          body: '**Monotone convergence.** An increasing sequence that is bounded above converges to its supremum.',
          visible: false,
        });
        const rec = s.tex('a_1 = 1, \\quad a_{n+1} = \\sqrt{2 + a_n}', { x: 250, y: 176, size: 32, color: C.blue, visible: false });
        const ind = s.text('by induction: $a_n < a_{n+1} < 2$', { x: 700, y: 176, size: 30, color: C.muted, visible: false });
        const nl = s.numberLine({ x: 480, y: 270, width: 760, range: [0.8, 2.2], ticks: 0.1, size: 30, labels: only([1, '1'], [1.5, '1.5'], [2, '2']), visible: false });
        const wx = sx(nl, 2);
        const wall = s.line(wx, 215, wx, 283, { color: C.orange, width: 5, visible: false });
        const wallLbl = s.text('bound: 2', { x: wx + 80, y: 230, size: 30, color: C.orange, visible: false });
        const idea = s.defCard({
          y: 427, width: 880, kind: 'note', title: 'Proof idea',
          body: 'Let $s = \\sup_n a_n$ (completeness). For $\\varepsilon > 0$ some $a_N > s - \\varepsilon$ (the $\\varepsilon$ test); then for $n \\ge N$, $s - \\varepsilon < a_N \\le a_n \\le s$.',
          visible: false,
        });
        const eq = s.tex('L = \\sqrt{2 + L} \\implies L^2 - L - 2 = 0,\\ \\ L \\ge 1 \\implies L = 2', { x: 480, y: 545, size: 32, color: C.green, visible: false });
        return { card, rec, ind, nl, wall, wallLbl, idea, eq };
      },
      steps: [
        {
          say: 'Here is a sequence defined by recursion: start at one, and take the square root of two plus the previous term. By induction, each term is below two and bigger than the one before. Increasing and bounded: it has to settle somewhere.',
          do: async (s, o) => {
            await s.all(o.nl.fadeIn(), o.rec.fadeIn());
            await s.all(o.wall.draw({ duration: 500 }), o.wallLbl.fadeIn(), o.ind.fadeIn({ delay: 300 }));
            for (let i = 0; i < 2; i++) await o.nl.point(MONO[i], { color: 'blue', label: MONO[i].toFixed(3).replace(/\.?0+$/, ''), r: 7 });
            await o.nl.point(MONO[2], { color: 'blue', r: 7 });
            await o.nl.sequence((n) => MONO[n - 1], MONO.length - 3, { start: 4, gap: 180, r: 6 });
          },
        },
        {
          say: 'Completeness says where: at the supremum. That’s the monotone convergence theorem. Past some term $a_N${a N} within $\\varepsilon${epsilon} of the supremum, every later term is squeezed between $a_N${a N} and the supremum.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.idea.reveal({ duration: 1400 });
          },
        },
        {
          say: 'To find the limit, let $n${n} go to infinity on both sides of the recursion; the square root is continuous, so $L = \\sqrt{2 + L}${L equals the square root of two plus L}. That gives $L^2 - L - 2 = 0${L squared minus L minus two equals zero}, with roots two and minus one. Every term is at least one, so $L = 2${L equals two}.',
          do: async (s, o) => {
            await o.eq.write({ duration: 1200 });
            await o.wall.indicate({ color: C.green });
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-limit',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Do the scratch work first, then write the proof forwards.',
      prompt: 'Prove from the definition that $\\displaystyle\\lim_{n \\to \\infty} \\frac{n + 5}{2n - 1} = \\frac12$.',
      answer: { type: 'proof' },
      hints: ['Compute $\\left\\lvert a_n - \\tfrac12 \\right\\rvert$ exactly over a common denominator.', 'For $n \\ge 1$, $2n - 1 \\ge n$.'],
      solution: [
        `**Proof.** For $n \\in \\mathbb{N}$, $\\left\\lvert \\frac{n + 5}{2n - 1} - \\frac12 \\right\\rvert = \\frac{${WK}}{2(2n - 1)} \\le \\frac{${WK}}{2n}$, since $2n - 1 \\ge n > 0$.`,
        `Let $\\varepsilon > 0$ and choose $N \\in \\mathbb{N}$ with $N > \\frac{${WK}}{2\\varepsilon}$, by the Archimedean property.`,
        `Then for every $n \\ge N$, $\\left\\lvert a_n - \\frac12 \\right\\rvert \\le \\frac{${WK}}{2n} \\le \\frac{${WK}}{2N} < \\varepsilon$. Therefore $\\lim_{n \\to \\infty} \\frac{n + 5}{2n - 1} = \\frac12$. ∎`,
      ],
      rubric: [
        `Exact simplification $\\left\\lvert a_n - \\tfrac12 \\right\\rvert = \\frac{${WK}}{2(2n - 1)}$.`,
        'Either a valid simpler bound with its justification (e.g. $2n - 1 \\ge n$), or an exact solution of the inequality for $n$.',
        '$N$ chosen in terms of $\\varepsilon$, with its existence justified (Archimedean property).',
        'The final chain of inequalities for every $n \\ge N$.',
        'Written forwards: the scratch work is not presented as the proof.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-bounded',
      kind: 'workout',
      title: 'Work it out',
      say: 'One more proof: every convergent sequence is bounded. Pick a specific epsilon.',
      prompt: 'Prove that every convergent sequence is bounded.',
      answer: { type: 'proof' },
      hints: ['Use the definition with $\\varepsilon = 1$.', 'Only finitely many terms come before $N$.'],
      solution: [
        '**Proof.** Suppose $a_n \\to L$. With $\\varepsilon = 1$ there is $N \\in \\mathbb{N}$ such that $\\lvert a_n - L \\rvert < 1$ for all $n \\ge N$. For those $n$, by the triangle inequality, $\\lvert a_n \\rvert \\le \\lvert a_n - L \\rvert + \\lvert L \\rvert < 1 + \\lvert L \\rvert$.',
        'Let $M = \\max\\{\\lvert a_1 \\rvert, \\dots, \\lvert a_{N-1} \\rvert, 1 + \\lvert L \\rvert\\}$, a maximum of finitely many numbers. Then $\\lvert a_n \\rvert \\le M$ for $n < N$ by the choice of $M$, and for $n \\ge N$ by the estimate above. So $(a_n)$ is bounded. ∎',
      ],
      rubric: [
        'Applies the definition with a specific $\\varepsilon$ (e.g. $\\varepsilon = 1$).',
        'Bounds the tail: $\\lvert a_n \\rvert < 1 + \\lvert L \\rvert$ for $n \\ge N$, by the triangle inequality (or equivalently from $L - 1 < a_n < L + 1$).',
        'Handles the finitely many terms before $N$.',
        'Defines $M$ explicitly and checks it bounds every term.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-epsilon-n',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the last recap, explain the definition of a limit in your own words, and what a limit proof has to do.',
      prompt: 'Explain in your own words what $\\lim a_n = L$ means, and what a proof of a specific limit has to do.',
      points: [
        'For every tolerance $\\varepsilon > 0$, the terms are eventually within $\\varepsilon$ of $L$.',
        '$N$ may depend on $\\varepsilon$ but not on $n$; the order of the quantifiers matters.',
        'A proof fixes an arbitrary $\\varepsilon$, produces $N$ (found by scratch work, often via a simpler bound and the Archimedean property), and verifies the inequality for every $n \\ge N$.',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap and farewell',
      scene(s) {
        const items = [
          recapItem(s, '• $\\varepsilon$–$N$: fix $\\varepsilon$, find $N$, check every $n \\ge N$.', 95),
          recapItem(s, '• Divergence by negation; uniqueness; the sum law; monotone convergence from completeness.', 200),
          recapItem(s, '• The toolkit: logic, proof, sets, functions, relations, induction, number theory, counting, infinity, the reals.', 335),
          recapItem(s, 'You’re ready for analysis (Math 4111) and linear algebra (Math 429).', 470, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'A limit proof always has the same shape: fix $\\varepsilon${epsilon}, find $N${N}, check every $n \\ge N${n at least N}.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Divergence comes from negating the definition. Limits are unique, they respect sums, and monotone bounded sequences converge, thanks to completeness.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'That’s the toolkit of this course: logic, proof, sets, functions, relations, induction, number theory, counting, infinity, and the real numbers.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'You’re ready for analysis and for linear algebra, where every one of these tools gets used. It has been a pleasure working through this with you.',
          do: (s, o) => o.items[3].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
