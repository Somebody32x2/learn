/**
 * Lecture 25 · The real numbers and completeness (foundations/PLAN.md § 25). Dumas–McCarthy 8 · Liebeck 22.
 *
 * Choreography: number lines throughout. The hole at √2 is found by zooming (three stacked lines, each a tenfold
 * magnification of a piece of the one above) while rational bounds squeeze it from both sides; an upper-bound
 * marker slides down onto the supremum and refuses to go lower; the ε test is a yellow band (s − ε, s] that keeps
 * catching a dot of S as it shrinks; density walks multiples of 1/n into a gap. Proofs are two-column proofs.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';

// ---------------------------------------------------------------- data (computed, no DOM)

/** Decimal truncations of √2 and the next decimal up: rational lower and upper bounds of S = {q : q² < 2}. */
const SQRT2 = Math.SQRT2;
const APPROX = [1, 2, 3].map((k) => {
  const lo = F(Math.floor(SQRT2 * 10 ** k)).div(10 ** k);
  const hi = lo.add(F(1).div(10 ** k));
  if (!(lo.mul(lo).cmp(2) < 0 && hi.mul(hi).cmp(2) > 0)) throw new Error('real-numbers: bad approximants');
  return { lo: lo.valueOf(), hi: hi.valueOf(), loS: lo.valueOf().toFixed(k), hiS: hi.valueOf().toFixed(k), hiSq: hi.mul(hi).valueOf() };
});

/** ε test for S = {1 − 1/n}: the first n with 1/n < ε gives an element above 1 − ε. */
const firstN = (eps) => {
  let n = 1;
  while (F(1).div(n).cmp(F(eps)) >= 0) n++;
  return n;
};
const EPS = ['0.3', '0.1', '0.03'].map((e) => ({ e: Number(e), n: firstN(e), x: 1 - 1 / firstN(e) }));

/** Density example: a < b, n > 1/(b − a), m = least integer > na. */
const DA = F('31/50');
const DB = F('7/10');
const DN = Math.floor(F(1).div(DB.sub(DA)).valueOf()) + 1;
const DM = Math.floor(DA.mul(DN).valueOf()) + 1;
if (!(DA.mul(DN).cmp(DM) < 0 && F(DM).cmp(DB.mul(DN)) < 0)) throw new Error('real-numbers: density example');
const DSMALL = 4; // a step size that is too big: 1/4 > b − a

/** try-inf: {1/n + (−1)^n}: the infimum −1 (not attained, odd n), the supremum 3/2 (n = 2). */
const INF_SEQ = Array.from({ length: 200 }, (_, i) => F(1).div(i + 1).add((i + 1) % 2 ? -1 : 1));
const INF_SUP = INF_SEQ.reduce((a, b) => (b.cmp(a) > 0 ? b : a));
const INF_VAL = -1;
if (!INF_SEQ.every((x) => x.cmp(INF_VAL) > 0)) throw new Error('real-numbers: inf example');

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** Stage x of value v on a number line. */
const sx = (nl, v) => nl.x + nl.toX(v);

/** Label only the listed values. */
const only = (...vals) => (v) => {
  const hit = vals.find((w) => Math.abs((Array.isArray(w) ? w[0] : w) - v) < 1e-9);
  return hit === undefined ? null : Array.isArray(hit) ? hit[1] : String(hit);
};

// ---------------------------------------------------------------- lecture

export default {
  id: 'real-numbers',
  title: 'The real numbers and completeness',
  goals: [
    'Define upper bounds, supremum and infimum, and use the $\\varepsilon$-characterization of the supremum',
    'State the completeness axiom and explain why $\\mathbb{Q}$ fails it',
    'Prove the Archimedean property and the density of $\\mathbb{Q}$ in $\\mathbb{R}$',
    'Sketch the construction of $\\mathbb{R}$ by Dedekind cuts',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'gaps-in-q',
      title: 'Holes in the rationals',
      scene(s) {
        const S = s.tex('S = \\{q \\in \\mathbb{Q} : q^2 < 2\\}', { x: 480, y: 54, size: 36, color: C.blue, visible: false });
        const mk = (y, lo, hi, tick, k) =>
          s.numberLine({ x: 480, y, width: 760, range: [lo, hi], ticks: tick, size: 30, labels: only([lo, lo.toFixed(k)], [hi, hi.toFixed(k)]), visible: false });
        const l1 = mk(165, 1, 2, 0.1, 0);
        const l2 = mk(330, APPROX[0].lo, APPROX[0].hi, 0.01, 1);
        const l3 = mk(495, APPROX[1].lo, APPROX[1].hi, 0.001, 2);
        const zoom = (up, down, a, b) => [
          s.line(sx(up, a), up.y + 12, sx(down, a), down.y - 58, { color: C.muted, width: 2, dash: '6 6', visible: false }),
          s.line(sx(up, b), up.y + 12, sx(down, b), down.y - 58, { color: C.muted, width: 2, dash: '6 6', visible: false }),
        ];
        const z1 = zoom(l1, l2, APPROX[0].lo, APPROX[0].hi);
        const z2 = zoom(l2, l3, APPROX[1].lo, APPROX[1].hi);
        const holeLbl = [l2, l3].map((l) => s.text('$\\sqrt 2 \\notin \\mathbb{Q}$', { x: sx(l, SQRT2), y: l.y + 46, size: 30, color: C.red, visible: false }));
        const hi3 = s.text(APPROX[2].hiS, { x: sx(l3, APPROX[2].hi) + 40, y: l3.y - 36, size: 30, color: C.orange, font: 'serif', visible: false });
        return { S, l1, l2, l3, z1, z2, holeLbl, hi3 };
      },
      steps: [
        {
          say: 'Take $S${S}, the set of rationals whose square is less than two. It is bounded above in $\\mathbb{Q}${the rationals}: one point five is an upper bound, since one point five squared is two point two five.',
          do: async (s, o) => {
            await o.S.write();
            await o.l1.fadeIn();
            await o.l1.point(APPROX[0].lo, { color: 'blue', label: APPROX[0].loS });
            await o.l1.point(1.5, { color: 'orange', label: '1.5' });
          },
        },
        {
          say: 'But every rational upper bound can be improved. Zoom in: one point four two is a smaller upper bound, then one point four one five, and so on forever.',
          do: async (s, o) => {
            await s.all(o.z1.map((z) => z.draw({ duration: 500 })));
            await o.l2.fadeIn();
            await s.all(o.l2.point(APPROX[1].lo, { color: 'blue', label: APPROX[1].loS, r: 7 }), o.l2.point(APPROX[1].hi, { color: 'orange', label: APPROX[1].hiS, r: 7 }));
            await s.all(o.z2.map((z) => z.draw({ duration: 500 })));
            await o.l3.fadeIn();
            await s.all(o.l3.point(APPROX[2].lo, { color: 'blue', label: APPROX[2].loS, r: 7 }), o.l3.point(APPROX[2].hi, { color: 'orange', r: 7 }), o.hi3.fadeIn());
          },
        },
        {
          say: 'No rational squares to two, so every rational upper bound has square above two, and a slightly smaller rational still works. The blue elements climb and the orange bounds fall, squeezing a spot that no rational fills, where the square root of two would be. So $S${S} has no least upper bound in $\\mathbb{Q}${the rationals}: the rationals have a hole there.',
          do: async (s, o) => {
            await s.all([o.l2, o.l3].map((l) => l.point(SQRT2, { color: 'red', open: true, r: 7 })));
            await s.all(o.holeLbl.map((h) => h.fadeIn({ shift: [0, -8] })));
            await s.all(o.holeLbl.map((h) => h.indicate({ color: C.red })));
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'bounds',
      title: 'Upper bounds and suprema',
      scene(s) {
        const card = s.defCard({
          y: 113, width: 880, title: false,
          body: '**Supremum.** $s = \\sup S$ means (i) $x \\le s$ for all $x \\in S$: $s$ is an upper bound; and (ii) if $b$ is any upper bound of $S$, then $s \\le b$. Dually, $\\part{inf}{\\inf S}$ is the **greatest lower bound**.',
          visible: false,
        });
        const mk = (y) => s.numberLine({ x: 560, y, width: 640, range: [-0.5, 2.5], ticks: 0.5, size: 30, labels: (v) => (Number.isInteger(v) ? String(v) : null), visible: false });
        const la = mk(300);
        const lb = mk(475);
        const ta = s.tex('S = (0, 1)', { x: 120, y: 300, size: 34, color: C.blue, visible: false });
        const tb = s.tex('T = [0, 1]', { x: 120, y: 475, size: 34, color: C.blue, visible: false });
        const ubs = s.text('upper bounds', { x: sx(la, 1.9), y: 372, size: 30, color: C.green, visible: false });
        return { card, la, lb, ta, tb, ubs };
      },
      steps: [
        {
          say: 'Here is $S${S}, the open interval from zero to one. An upper bound is a number at least as big as every element: two is one, and so is one point five.',
          do: async (s, o) => {
            await s.all(o.la.fadeIn(), o.ta.fadeIn());
            await o.la.interval(0, 1, { openA: true, openB: true, color: 'blue' });
            o.b = o.la.marker(2, { label: 'b', color: 'teal' });
            await o.b;
            await o.b.moveTo(1.5);
          },
        },
        {
          say: 'The supremum is the least upper bound. Slide $b${b} below one, and some element of $S${S}, like zero point nine, sticks out above it. Every number from one on is an upper bound, so $\\sup S = 1${the supremum of S is one}.',
          do: async (s, o) => {
            await o.b.moveTo(0.8);
            o.beat = o.la.point(0.9, { color: 'red' });
            await o.beat;
            await s.all(o.b.moveTo(1, { label: 'sup S' }), o.beat.fadeOut());
            await o.la.interval(1, Infinity, { color: 'green' });
            await o.ubs.fadeIn();
          },
        },
        {
          say: 'In symbols: $s${s} is the supremum when it is an upper bound, and it is below or equal to every other upper bound.',
          do: async (s, o) => {
            await o.card.reveal();
          },
        },
        {
          say: 'Notice that one is not in $S${S}: the supremum need not belong to the set. For the closed interval $T${T}, it does, and then the supremum is the maximum.',
          do: async (s, o) => {
            await s.all(o.lb.fadeIn(), o.tb.fadeIn());
            await o.lb.interval(0, 1, { color: 'blue' });
            await o.lb.point(1, { color: 'green', label: 'sup T = max T' });
          },
        },
        {
          say: 'Flip everything over. A lower bound sits below every element, and the infimum, $\\inf S${the infimum of S}, is the greatest lower bound. Here both sets have infimum zero: it belongs to $T${T}, so it is the minimum of $T${T}, but not to $S${S}.',
          do: async (s, o) => {
            await o.card.color('inf', 'green');
            await s.all(o.la.marker(0, { label: 'inf S', color: 'green' }), o.lb.point(0, { color: 'green', label: 'inf T = 0' }));
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'try-sup',
      kind: 'try',
      title: 'Sup and max',
      say: 'Your turn. Decide what the supremum of this set is, and whether it is a maximum.',
      prompt: 'Let $S = \\{1 - 1/n : n \\in \\mathbb{N}\\}$. Which is true?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '${\\sup S = 1}$ and $S$ has no maximum', why: '$1$ is an upper bound, nothing smaller is, and $1 \\notin S$.' },
        { id: 'b', label: '${\\sup S = \\max S = 1}$', why: '$1 - 1/n < 1$ for every $n$, so $1 \\notin S$: the supremum is not attained.' },
        { id: 'c', label: '${\\sup S = 0}$', why: '$0$ is the minimum (at $n = 1$), not an upper bound: $1/2 \\in S$.' },
        { id: 'd', label: '$\\sup S$ does not exist', why: '$S$ is nonempty and bounded above by $1$, so it has a supremum by completeness.' },
      ],
      hint: 'Is $1$ in $S$? Is any number smaller than $1$ an upper bound?',
      solution: [
        '$1$ is an upper bound, since $1 - 1/n < 1$ for every $n$; and $1 \\notin S$ for the same reason.',
        'Any $b < 1$ is beaten by $1 - 1/n$ as soon as $1/n < 1 - b$, which happens for large $n$ (Archimedean property). So $\\sup S = 1$ and $S$ has no maximum. The full proof is the workout later in this lecture.',
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'epsilon-sup',
      title: 'The ε test for suprema',
      scene(s) {
        const card = s.defCard({
          y: 118, width: 880, title: 'The ε test',
          body: 'An upper bound $s$ of $S$ is $\\sup S$ $\\iff$ $\\part{q}{\\forall \\varepsilon > 0\\ \\exists x \\in S,\\ x > s - \\varepsilon}$.',
          visible: false,
        });
        const nl = s.numberLine({ x: 480, y: 330, width: 760, range: [0.4, 1.1], ticks: 0.1, size: 30, labels: only([0.5, '0.5'], [1, 's = 1']), visible: false });
        const S = s.tex('S = \\{1 - 1/n : n \\in \\mathbb{N}\\}', { x: 220, y: 238, size: 32, color: C.blue, visible: false });
        const X = (v) => sx(nl, v);
        const e0 = EPS[0];
        const band = s.rect(X(1 - e0.e), 290, X(1) - X(1 - e0.e), 60, { color: C.yellow, fill: FILL.yellow, width: 2, visible: false });
        const bandLbl = s.tex('s - \\varepsilon', { x: X(1 - e0.e), y: 410, size: 30, color: C.yellow, visible: false });
        const dot = s.dot(X(e0.x), 330, { r: 10, color: C.green, visible: false });
        const dotLbl = s.tex('x', { x: X(e0.x), y: 262, size: 32, color: C.green, visible: false });
        const note = s.text('$s - \\varepsilon$ is not an upper bound: some $x \\in S$ beats it', { x: 480, y: 500, size: 30, visible: false });
        return { card, nl, S, band, bandLbl, dot, dotLbl, note, X };
      },
      steps: [
        {
          say: 'Here are the elements of $S${S}, one minus one over $n${n}, piling up below its supremum, one. Least upper bound means: nothing smaller than $s${s} is an upper bound. So take any number a little below, $s - \\varepsilon${s minus epsilon}.',
          do: async (s, o) => {
            await s.all(o.nl.fadeIn(), o.S.fadeIn());
            await o.nl.sequence((n) => 1 - 1 / n, 59, { start: 2, gap: 50, r: 6 });
            await s.all(o.band.fadeIn({ shift: [0, 0] }), o.bandLbl.fadeIn());
          },
        },
        {
          say: 'Since $s - \\varepsilon${s minus epsilon} is not an upper bound, some element $x${x} of $S${S} beats it: there is always a dot inside the yellow band. Shrink $\\varepsilon${epsilon}, and there is still one.',
          do: async (s, o) => {
            await s.all(o.dot.draw(), o.dotLbl.fadeIn());
            await o.note.fadeIn();
            for (const e of EPS.slice(1)) {
              const left = o.X(1 - e.e);
              await s.all(o.band.resize(left, 290, o.X(1) - left, 60, { duration: 800 }), o.bandLbl.moveTo(left, 410, { duration: 800 }));
              await s.all(o.dot.moveTo(o.X(e.x), 330), o.dotLbl.moveTo(o.X(e.x), 262));
              await o.dot.flash({ color: C.green });
            }
          },
        },
        {
          say: 'This is the form we use in proofs. An upper bound $s${s} is the supremum exactly when, for every $\\varepsilon > 0${epsilon greater than zero}, some $x${x} in $S${S} is bigger than $s - \\varepsilon${s minus epsilon}.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.card.color('q', 'yellow');
          },
        },
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'completeness',
      title: 'The completeness axiom',
      scene(s) {
        const hq = s.tex('\\mathbb{Q}', { x: 700, y: 55, size: 40, visible: false });
        const hr = s.tex('\\mathbb{R}', { x: 820, y: 55, size: 40, visible: false });
        const row = (y, str) => ({
          t: s.text(str, { x: 50, y, size: 30, width: 580, align: 'left', anchor: [0, 0.5], color: C.muted, visible: false }),
          q: s.text('✓', { x: 700, y, size: 34, color: C.green, visible: false }),
          r: s.text('✓', { x: 820, y, size: 34, color: C.green, visible: false }),
        });
        const rows = [row(120, 'field axioms: $+$, $\\times$, inverses, …'), row(185, 'order axioms: total, compatible')];
        const card = s.defCard({
          x: 40, y: 300, anchor: [0, 0.5], width: 600, title: 'Completeness axiom',
          body: 'Every nonempty subset of $\\mathbb{R}$ that is bounded above has a supremum in $\\mathbb{R}$.',
          visible: false,
        });
        const xq = s.text('✗', { x: 700, y: 300, size: 36, color: C.red, visible: false });
        const xr = s.text('✓', { x: 820, y: 300, size: 36, color: C.green, visible: false });
        const nl = s.numberLine({ x: 480, y: 480, width: 700, range: [1.3, 1.5], ticks: 0.05, size: 30, labels: only([1.3, '1.3'], [1.4, '1.4'], [1.5, '1.5']), visible: false });
        const why = [
          s.text('Let $s = \\sup S$ in $\\mathbb{R}$; $s \\ge 1$ since $1 \\in S$.', { x: 480, y: 55, size: 30, width: 880, visible: false }),
          s.text('If $s^2 < 2$: for $h = \\min\\{1, (2 - s^2)/(2s + 1)\\}$, $(s + h)^2 \\le s^2 + h(2s + 1) < 2$, so the rationals in $(s, s + h)$ lie in $S$, and $s$ is not an upper bound.', { x: 480, y: 148, size: 30, width: 880, color: C.red, visible: false }),
          s.text('If $s^2 > 2$: for $h = (s^2 - 2)/(2s)$, $(s - h)^2 > s^2 - 2sh = 2$, so $s - h$ is a smaller upper bound.', { x: 480, y: 258, size: 30, width: 880, color: C.red, visible: false }),
          s.text('Both are impossible, so $s^2 = 2$: completeness gives us $\\sqrt 2$.', { x: 480, y: 345, size: 32, width: 880, color: C.green, visible: false }),
        ];
        return { hq, hr, rows, card, xq, xr, nl, why };
      },
      steps: [
        {
          say: 'The rationals and the reals satisfy the same algebra axioms and the same order axioms: both are ordered fields.',
          do: async (s, o) => {
            await s.all(o.hq.fadeIn(), o.hr.fadeIn());
            for (const r of o.rows) await s.all(r.t.fadeIn({ shift: [-10, 0] }), r.q.fadeIn({ delay: 300 }), r.r.fadeIn({ delay: 450 }));
          },
        },
        {
          say: 'Completeness is the difference. Every nonempty set of reals that is bounded above has a least upper bound, in $\\mathbb{R}${R}. The rationals fail it.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.xq.fadeIn({ shift: [0, 0] });
            await o.xq.indicate({ color: C.red });
            await o.xr.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'Back to the hole. In $\\mathbb{R}${R}, the set $S${S} is nonempty and bounded above, so it has a supremum $s${s}, sitting exactly where the hole was.',
          do: async (s, o) => {
            await o.nl.fadeIn();
            await o.nl.interval(-Infinity, SQRT2, { openB: true, color: 'blue' });
            o.hole = o.nl.point(SQRT2, { color: 'red', open: true });
            await o.hole;
            o.sup = o.nl.point(SQRT2, { color: 'green', label: 's = sup S' });
            await o.sup;
          },
        },
        {
          say: 'Why is $s^2 = 2${s squared equal to two}? If $s^2${s squared} were less than two, a slightly bigger number would still have square below two, and rationals in between would beat $s${s}. If it were more than two, a slightly smaller number would still be an upper bound. Both are impossible.',
          do: async (s, o) => {
            await s.all(...[o.hq, o.hr, o.xq, o.xr, o.card].map((m) => m.fadeOut()), ...o.rows.flatMap((r) => [r.t, r.q, r.r].map((m) => m.fadeOut())));
            await o.why[0].fadeIn();
            await o.why[1].fadeIn();
            await o.why[2].fadeIn();
            await o.why[3].fadeIn();
            await o.sup.moveTo(SQRT2, { label: 's = √2', duration: 300 });
          },
        },
        {
          say: 'So the axiom fills the hole at the square root of two, and everything in analysis that converges rests on it: limits, the intermediate value theorem, and the rest.',
          do: (s, o) => o.why[3].indicate({ color: C.green }),
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'archimedean',
      title: 'The Archimedean property',
      scene(s) {
        const thm = s.text('**Theorem.** $\\mathbb{N}$ is not bounded above in $\\mathbb{R}$.', { y: 50, size: 32, visible: false });
        const p = s.proof({ y: 76, width: 900, height: 414, size: 30 });
        const cor = s.defCard({
          y: 530, width: 880, kind: 'theorem', title: false,
          body: '**Corollary.** For every $\\varepsilon > 0$ some $n \\in \\mathbb{N}$ has $1/n < \\varepsilon$.',
          visible: false,
        });
        return { thm, p, cor };
      },
      steps: [
        {
          say: 'The natural numbers go on past every real number. It looks obvious, but it needs completeness: there are ordered fields where it fails. Suppose, for contradiction, that $\\mathbb{N}${N} is bounded above; then by completeness it has a supremum $s${s}.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.p.add('**Proof.** Suppose $\\mathbb{N}$ is bounded above.', { kind: 'assume', why: 'for contradiction' });
            o.sup = o.p.add('Then $s = \\sup \\mathbb{N}$ exists.', { why: 'completeness' });
            await o.sup;
            await o.p.highlight(o.sup, 'blue');
          },
        },
        {
          say: 'Use the epsilon test with $\\varepsilon = 1${epsilon equals one}: $s - 1${s minus one} is not an upper bound, so some natural number $n${n} is bigger than $s - 1${s minus one}.',
          do: async (s, o) => {
            await o.p.add('$s - 1$ is not an upper bound of $\\mathbb{N}$,', { why: '$\\varepsilon$ test, $\\varepsilon = 1$' });
            o.n = o.p.add('so some $n \\in \\mathbb{N}$ has $n > s - 1$.', { why: 'not an upper bound' });
            await o.n;
            await o.p.highlight(o.n, 'yellow');
          },
        },
        {
          say: 'Add one: $n + 1 > s${n plus one is greater than s}, and $n + 1${n plus one} is a natural number. That contradicts $s${s} being an upper bound.',
          do: async (s, o) => {
            await o.p.unhighlight(o.n);
            await o.p.add('Then $n + 1 > s$ and $n + 1 \\in \\mathbb{N}$.', { kind: 'contradiction', why: '$s$ is an upper bound' });
            await o.p.add('Therefore $\\mathbb{N}$ is not bounded above in $\\mathbb{R}$. $\\blacksquare$', { kind: 'conclude', why: '' });
          },
        },
        {
          say: 'The corollary is what limit proofs use to choose $N${N}: however small $\\varepsilon${epsilon} is, some $1/n${one over n} is smaller.',
          do: async (s, o) => {
            await o.cor.reveal();
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-archimedean',
      kind: 'blanks',
      title: 'Fill in the proof',
      say: 'Fill in the three missing pieces of the Archimedean proof.',
      prompt: 'Complete the proof that $\\mathbb{N}$ is not bounded above.',
      lines: [
        ['\\text{Suppose } \\mathbb{N} \\text{ is bounded above. Let } s = ', { id: 's', chips: ['\\sup \\mathbb{N}', '\\max \\mathbb{N}', '\\inf \\mathbb{N}'], answer: '\\sup \\mathbb{N}', hint: 'Which one does completeness guarantee?' }, '.'],
        ['\\text{Then } s - 1 \\text{ is not an }', { id: 'ub', chips: ['\\text{upper bound}', '\\text{element of } \\mathbb{N}', '\\text{lower bound}'], answer: '\\text{upper bound}', hint: '$s$ is the least upper bound.' }, ','],
        ['\\text{so some } n \\in \\mathbb{N} \\text{ has } n > ', { id: 'b', chips: ['s - 1', 's', 's + 1'], answer: 's - 1', hint: 'What does “not an upper bound” say about $s - 1$?' }, '.\\ \\text{Then } n + 1 > s, \\text{ a contradiction.}'],
      ],
      solution: [
        '$s = \\sup \\mathbb{N}$: completeness gives a supremum of a nonempty set that is bounded above. A maximum need not exist (and $\\max \\mathbb{N}$ certainly doesn’t), and $\\inf \\mathbb{N} = 1$ is useless here.',
        'Since $s$ is the *least* upper bound, $s - 1$ is not an upper bound, so some $n \\in \\mathbb{N}$ has $n > s - 1$.',
        'Then $n + 1 > s$ with $n + 1 \\in \\mathbb{N}$, contradicting that $s$ is an upper bound of $\\mathbb{N}$.',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'density',
      title: 'ℚ is dense in ℝ',
      scene(s) {
        const nl = s.numberLine({ x: 480, y: 165, width: 760, range: [0.5, 0.8], ticks: 0.05, size: 30, labels: only([0.5, '0.5'], [0.8, '0.8']), visible: false });
        const step = s.tex(`\\tfrac{1}{n} = \\tfrac{1}{${DSMALL}} > b - a`, { x: 480, y: 55, size: 34, color: C.red, visible: false });
        const win = s.text(`$m/n = ${DM}/${DN}$`, { x: sx(nl, DM / DN), y: 206, size: 30, color: C.green, visible: false });
        const p = s.proof({ y: 230, width: 900, height: 340, size: 30, whyWidth: 230 });
        return { nl, step, win, p };
      },
      steps: [
        {
          say: 'Given two reals $a < b${a less than b}, we want a rational number between them. Think of the multiples of $1/n${one over n} as stepping stones. If the step is bigger than the gap, it can jump right over it.',
          do: async (s, o) => {
            await o.nl.fadeIn();
            await s.all(o.nl.point(DA.valueOf(), { color: 'blue', label: 'a' }), o.nl.point(DB.valueOf(), { color: 'blue', label: 'b' }));
            await o.nl.interval(DA.valueOf(), DB.valueOf(), { openA: true, openB: true, color: 'yellow' });
            await o.step.fadeIn();
            o.big = [2, 3].map((k) => o.nl.point(k / DSMALL, { color: 'orange', r: 7 }));
            await s.all(o.big);
          },
        },
        {
          say: 'So make the step smaller than the gap: choose $n > 1/(b - a)${n greater than one over b minus a}. Here that is $n = 13${n equals thirteen}.',
          do: async (s, o) => {
            await s.all(o.big.map((p) => p.fadeOut()));
            await o.step.swap(`\\tfrac{1}{n} = \\tfrac{1}{${DN}} < b - a`);
            await o.step.recolor(C.green);
            o.small = [];
            for (let k = Math.ceil(0.5 * DN); k / DN <= 0.8; k++) o.small.push(o.nl.point(k / DN, { color: 'orange', r: 6 }));
            await s.all(o.small);
            await o.p.add('Choose $n \\in \\mathbb{N}$ with $n > 1/(b - a)$.', { kind: 'assume', why: 'Archimedean' });
          },
        },
        {
          say: 'Now some multiple must land in the gap. Walk right to the first multiple past $a${a}: that is $m/n${m over n}. It can’t jump past $b${b}, because the step is smaller than the gap.',
          do: async (s, o) => {
            o.walk = o.nl.marker(Math.ceil(0.5 * DN) / DN, { color: 'green' });
            await o.walk;
            await o.walk.moveTo(DM / DN, { duration: 1100 });
            await o.win.fadeIn();
            o.m = o.p.add('Let $m \\in \\mathbb{Z}$ be least with $m > na$.', { why: 'Archimedean, well-ordering' });
            await o.m;
            await o.p.add('Then $na < m \\le na + 1 < nb$.', { why: '$m$ least; $n(b - a) > 1$' });
            await o.p.add('Therefore $a < m/n < b$, with $m/n \\in \\mathbb{Q}$. $\\blacksquare$', { kind: 'conclude', why: '' });
          },
        },
        {
          say: 'Both choices used the Archimedean property: once to make $n${n} big enough, and once to know there is a first integer past $na${n a}.',
          do: async (s, o) => {
            await o.p.highlight(0, 'yellow');
            await o.p.highlight(o.m, 'yellow');
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'try-inf',
      kind: 'try',
      title: 'An infimum',
      say: 'Try this one. Split the set by odd and even $n${n}.',
      prompt: 'Find $\\inf \\{1/n + (-1)^n : n \\in \\mathbb{N}\\}$.',
      answer: { type: 'number', value: String(INF_VAL) },
      hint: 'Look at odd and even $n$ separately.',
      solution: [
        'Odd $n$ give $1/n - 1$: these decrease toward $-1$ and stay above it. Even $n$ give $1/n + 1 > 1$.',
        'So every element is $> -1$, and $-1$ is a lower bound. For any $\\varepsilon > 0$, an odd $n > 1/\\varepsilon$ gives the element $1/n - 1 < -1 + \\varepsilon$, so no number above $-1$ is a lower bound.',
        `Hence $\\inf = -1$, not attained. (The supremum is $${INF_SUP.tex()}$, attained at $n = 2$.)`,
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'dedekind',
      title: 'Building ℝ: Dedekind cuts',
      scene(s) {
        const card = s.defCard({
          y: 112, width: 880, title: 'Dedekind cut',
          body: 'A set $A \\subseteq \\mathbb{Q}$ that is nonempty, not all of $\\mathbb{Q}$, closed downward, and has no largest element.',
          visible: false,
        });
        const def = s.tex('\\sqrt 2 := \\{q \\in \\mathbb{Q} : q < 0 \\text{ or } q^2 < 2\\}', { x: 480, y: 232, size: 34, color: C.blue, visible: false });
        const nl = s.numberLine({ x: 480, y: 332, width: 760, range: [-1, 3], ticks: 0.5, size: 30, labels: (v) => (Number.isInteger(v) ? String(v) : null), visible: false });
        const X = (v) => sx(nl, v);
        const ends = [0.5, 1, 1.3];
        const rays = ends.map((r, i) => {
          const y = 388 + i * 28;
          return {
            line: s.line(X(-1) - 24, y, X(r) - 8, y, { color: C.teal, width: 6, visible: false }),
            end: s.circle(X(r), y, 8, { color: C.teal, width: 3, visible: false }),
            y,
          };
        });
        const fam = s.tex('A_1 \\subseteq A_2 \\subseteq A_3 \\subseteq \\cdots', { x: 760, y: 414, size: 32, color: C.teal, visible: false });
        const union = s.text('nonempty bounded family: sup = union of the cuts', { x: 480, y: 480, size: 30, color: C.green, visible: false });
        const alt = s.text('Another construction: Cauchy sequences of rationals modulo an equivalence relation, a quotient as in lecture 14.', { x: 480, y: 535, size: 30, width: 860, color: C.muted, visible: false });
        return { card, def, nl, rays, fam, union, alt, X };
      },
      steps: [
        {
          say: 'How do we know a complete ordered field exists at all? Build it from $\\mathbb{Q}${Q}. Dedekind’s idea: a real number is the set of rationals below it, a cut.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.nl.fadeIn();
            o.r1 = o.nl.interval(-Infinity, 1, { openB: true, color: 'blue' });
            await o.r1;
          },
        },
        {
          say: 'Then $\\sqrt 2${the square root of two} is defined as the set of rationals that are negative or have square less than two. It has no largest element, and no rational marks its end.',
          do: async (s, o) => {
            await o.r1.fadeOut();
            await o.def.write();
            o.r2 = o.nl.interval(-Infinity, SQRT2, { openB: true, color: 'blue' });
            await o.r2;
            o.m2 = o.nl.marker(SQRT2, { label: '√2', color: 'blue' });
            await o.m2;
          },
        },
        {
          say: 'Cuts are ordered by inclusion. For a nonempty, bounded family of cuts, the union is again a cut, and it is their least upper bound. So in this model, completeness is a theorem.',
          do: async (s, o) => {
            await s.all(o.r2.fadeOut(), o.m2.fadeOut());
            await s.stagger(o.rays.map((r) => () => s.all(r.line.draw({ duration: 600 }), r.end.fadeIn({ delay: 450, shift: [0, 0] }))), 300);
            await o.fam.fadeIn();
            await s.all(o.rays.map((r) => s.all(r.line.shift(0, o.nl.y - r.y, { duration: 900 }), r.end.shift(0, o.nl.y - r.y, { duration: 900 }))));
            await o.union.fadeIn();
          },
        },
        {
          say: 'There is another construction: Cauchy sequences of rationals, modulo an equivalence relation. It is another quotient, just like the ones in the lecture on equivalence relations.',
          do: (s, o) => o.alt.fadeIn(),
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-sup',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper and prove the supremum from the multiple-choice question, using the epsilon test.',
      prompt: 'Let $S = \\{1 - 1/n : n \\in \\mathbb{N}\\}$. Prove that $\\sup S = 1$.',
      answer: { type: 'proof' },
      hints: ['First show that $1$ is an upper bound of $S$.', 'Given $\\varepsilon > 0$, use the Archimedean property to find an element of $S$ above $1 - \\varepsilon$.'],
      solution: [
        '**Proof.** For every $n \\in \\mathbb{N}$, $1/n > 0$, so $1 - 1/n < 1$. Hence $1$ is an upper bound of $S$.',
        'Let $\\varepsilon > 0$. By the Archimedean property there is $n \\in \\mathbb{N}$ with $n > 1/\\varepsilon$, so $1/n < \\varepsilon$ and $1 - 1/n > 1 - \\varepsilon$, with $1 - 1/n \\in S$.',
        'So no number less than $1$ is an upper bound of $S$, and by the $\\varepsilon$ test, $\\sup S = 1$. ∎',
      ],
      rubric: [
        'Shows $1$ is an upper bound: $1 - 1/n < 1$ for every $n \\in \\mathbb{N}$.',
        'Starts from an arbitrary $\\varepsilon > 0$.',
        'Cites the Archimedean property to choose $n$ with $1/n < \\varepsilon$.',
        'Derives $1 - 1/n > 1 - \\varepsilon$ for an element of $S$.',
        'Concludes $\\sup S = 1$ via the definition or the $\\varepsilon$ test.',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-sup-sum',
      kind: 'workout',
      title: 'Work it out',
      say: 'One more proof. Here the trick is to split the tolerance in half.',
      prompt: 'Let $A, B \\subseteq \\mathbb{R}$ be nonempty and bounded above, and $A + B = \\{a + b : a \\in A,\\ b \\in B\\}$. Prove that $\\sup(A + B) = \\sup A + \\sup B$.',
      answer: { type: 'proof' },
      hints: ['Show that $\\sup A + \\sup B$ is an upper bound of $A + B$.', 'For $\\varepsilon > 0$, approximate each supremum within $\\varepsilon/2$.'],
      solution: [
        '**Proof.** Let $\\alpha = \\sup A$ and $\\beta = \\sup B$; they exist by completeness, since $A$ and $B$ are nonempty and bounded above.',
        'For $a \\in A$ and $b \\in B$ we have $a \\le \\alpha$ and $b \\le \\beta$, so $a + b \\le \\alpha + \\beta$. Thus $\\alpha + \\beta$ is an upper bound of $A + B$, which is nonempty, so $\\sup(A + B)$ exists.',
        'Let $\\varepsilon > 0$. By the $\\varepsilon$ test there are $a \\in A$ with $a > \\alpha - \\varepsilon/2$ and $b \\in B$ with $b > \\beta - \\varepsilon/2$. Then $a + b \\in A + B$ and $a + b > \\alpha + \\beta - \\varepsilon$.',
        'So no number smaller than $\\alpha + \\beta$ is an upper bound of $A + B$, and $\\sup(A + B) = \\alpha + \\beta = \\sup A + \\sup B$. ∎',
      ],
      rubric: [
        'Justifies that $\\sup A$, $\\sup B$ (and $\\sup(A + B)$) exist, by completeness.',
        'Shows $\\sup A + \\sup B$ is an upper bound of $A + B$.',
        'Uses the $\\varepsilon$ test with $\\varepsilon/2$ for each set.',
        'Notes $a + b \\in A + B$ and $a + b > \\sup A + \\sup B - \\varepsilon$.',
        'Concludes equality from the two halves.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-completeness',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we finish, explain completeness in your own words, and why the rationals fail it.',
      prompt: 'What is the completeness axiom, and why does $\\mathbb{Q}$ fail it?',
      points: [
        'Every nonempty set of reals that is bounded above has a least upper bound in $\\mathbb{R}$.',
        '$\\{q \\in \\mathbb{Q} : q^2 < 2\\}$ is bounded above in $\\mathbb{Q}$, but its least upper bound would be $\\sqrt 2 \\notin \\mathbb{Q}$.',
        'Both $\\mathbb{Q}$ and $\\mathbb{R}$ are ordered fields; completeness is what separates them.',
        'Consequences include the Archimedean property and the convergence theorems of analysis.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• The supremum is the least upper bound; the ε test: every $s - \\varepsilon$ is beaten by an element.', 120),
          recapItem(s, '• Completeness ⇒ Archimedean property ⇒ $\\mathbb{Q}$ is dense in $\\mathbb{R}$. Dedekind cuts build $\\mathbb{R}$.', 250),
          recapItem(s, 'Next: limits, where all of this gets used.', 390, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'The supremum is the least upper bound, and the epsilon test is how we use it: every $s - \\varepsilon${s minus epsilon} is beaten by some element.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Completeness gives the Archimedean property, and that gives the density of the rationals. Dedekind cuts show a complete ordered field really exists.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: limits of sequences, where all of this gets used.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
