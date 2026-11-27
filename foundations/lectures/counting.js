/**
 * Lecture 20 · Products, permutations and combinations (foundations/PLAN.md § 20). Liebeck 16.
 *
 * Choreography: a letter-then-digit tree whose leaves are counted; A × B as a grid of pairs; a Venn diagram whose
 * pieces carry their counts; runners flying onto a podium as the choices shrink; each 3-subset of {a, b, c, d}
 * fanning out into its 6 orderings (double counting); one pair reached twice by the "special one first" count;
 * Pascal's rule split on one person, then the triangle built row by row; running tallies in a three-set Venn that
 * all end at 1. Every count is computed below.
 */
import { C } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- counting (pure)

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
function binom(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}
const P = (n, k) => fact(n) / fact(n - k);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const countIf = (N, f) => range(1, N).filter(f).length;
function permutations(xs) {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}
function subsets(xs, k) {
  if (k === 0) return [[]];
  if (xs.length < k) return [];
  const [h, ...t] = xs;
  return [...subsets(t, k - 1).map((s) => [h, ...s]), ...subsets(t, k)];
}

// ---------------------------------------------------------------- data

const LETTERS = 26;
const DIGITS = 10;
const SETA = ['a', 'b', 'c', 'd'];
const SETB = ['1', '2', '3'];
const N100 = 100;
const SUM = {
  A: countIf(N100, (n) => n % 2 === 0),
  B: countIf(N100, (n) => n % 3 === 0),
  AB: countIf(N100, (n) => n % 6 === 0),
};
SUM.U = countIf(N100, (n) => n % 2 === 0 || n % 3 === 0);
SUM.Aonly = SUM.A - SUM.AB;
SUM.Bonly = SUM.B - SUM.AB;
SUM.none = N100 - SUM.U;
const IE = { N: 1000, a: 3, b: 5 };
IE.A = Math.floor(IE.N / IE.a);
IE.B = Math.floor(IE.N / IE.b);
IE.AB = Math.floor(IE.N / (IE.a * IE.b));
IE.ans = countIf(IE.N, (n) => n % IE.a === 0 || n % IE.b === 0);
const RUN = 8;
const POD = 3;
const P83 = P(RUN, POD);
const F8 = fact(RUN);
const SUBS = subsets(['a', 'b', 'c', 'd'], 3);
const ORDERS = SUBS.map((s) => permutations(s).map((p) => p.join('')));
const OFF = { n: 10, c: 3 };
OFF.roles = OFF.n * (OFF.n - 1);
OFF.comm = binom(OFF.n - 2, OFF.c);
OFF.total = OFF.roles * OFF.comm;
const GIRLS = ['Ann', 'Bea', 'Cat', 'Dee', 'Eve'];
const BOYS = ['Al', 'Bo', 'Cy', 'Dan', 'Ed'];
const OC = { wrong: GIRLS.length * (GIRLS.length + BOYS.length - 1), all: binom(10, 2), gg: binom(5, 2), one: 5 * 5 };
OC.right = OC.all - OC.gg;
const ACES = { pick: binom(4, 2), rest: binom(48, 3) };
ACES.ans = ACES.pick * ACES.rest;
const PASCAL = range(0, 6).map((n) => range(0, n).map((k) => binom(n, k)));
const IE3 = { N: 100, d: [2, 3, 5] };
IE3.singles = IE3.d.map((d) => Math.floor(IE3.N / d));
IE3.pairs = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => Math.floor(IE3.N / (IE3.d[i] * IE3.d[j])));
IE3.triple = Math.floor(IE3.N / (2 * 3 * 5));
IE3.union = countIf(IE3.N, (n) => IE3.d.some((d) => n % d === 0));
IE3.coprime = IE3.N - IE3.union;

/** The bit-string workout: length n, exactly k ones, first bit 1. */
function bitItem(n, k) {
  const ans = binom(n - 1, k - 1);
  const rest = k - 1 === 1 ? 'the one remaining $1$' : `the remaining $${k - 1}$ ones`;
  return {
    prompt: `How many bit strings of length $${n}$ have exactly $${k}$ ones and start with a $1$?`,
    answer: { type: 'number', value: ans },
    hints: ['The first bit is fixed.', `Choose positions for ${rest} among the other $${n - 1}$ positions.`],
    solution: [
      `The first bit is $1$, so ${rest} must sit among the other $${n - 1}$ positions, and the string is determined by which positions they occupy.`,
      `So there are $\\binom{${n - 1}}{${k - 1}} = ${ans}$ such strings.`,
    ],
  };
}
const WO = bitItem(10, 4);

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 34, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** Stage positions [x, y] of every atomic region of a Venn, keyed by membership bits over its sets. */
function regionCenters(v) {
  const out = {};
  for (let b = 1; b < 2 ** v.names.length; b++) {
    const { x, y } = v.regionCenter(v.names.map((n, i) => ((b >> i) & 1 ? n : `!${n}`)).join('&'));
    out[b] = [x, y];
  }
  return out;
}
const popcount = (b) => (b & 1) + ((b >> 1) & 1) + ((b >> 2) & 1);

/** A runner: numbered circle that moves as one. */
function runner(s, k, x, y) {
  const c = s.circle(x, y, 25, { color: C.blue, width: 3, visible: false });
  const t = s.tex(String(k), { x, y, size: 30, visible: false });
  return {
    c,
    t,
    show: (delay) => s.all(c.fadeIn({ shift: [0, 0], delay }), t.fadeIn({ shift: [0, 0], delay })),
    moveTo: (nx, ny, opts) => s.all(c.moveTo(nx, ny, opts), t.moveTo(nx, ny, opts)),
    recolor: (col) => s.all(c.recolor(col), t.recolor(col)),
    fadeOut: () => s.all(c.fadeOut(), t.fadeOut()),
  };
}

export default {
  id: 'counting',
  title: 'Products, permutations and combinations',
  goals: [
    'Use the sum and product rules as statements about disjoint unions and Cartesian products',
    'Count with inclusion–exclusion for two and three sets',
    'Count permutations $n!$, $P(n, k)$ and combinations $\\binom{n}{k}$, deriving $\\binom{n}{k} = \\frac{n!}{k!(n-k)!}$ by double counting',
    'Spot overcounting, and write a combinatorial proof of an identity',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'product-rule',
      title: 'The product rule',
      scene(s) {
        const root = s.dot(480, 55, { r: 8, color: C.ink, visible: false });
        const LX = { A: 150, B: 420, Z: 770 };
        const letters = Object.entries(LX).map(([L, x]) => ({
          L,
          x,
          line: s.line(480, 62, x, 140, { color: C.blue, width: 3, visible: false }),
          tex: s.tex(L, { x, y: 165, size: 34, color: C.blue, visible: false }),
          leaves: range(0, 9).map((d) => {
            const lx = x - 90 + d * (180 / 9);
            return { line: s.line(x, 188, lx, 292, { color: C.teal, width: 2, visible: false }), dot: s.dot(lx, 297, { r: 5, color: C.teal, visible: false }) };
          }),
          labels: [s.tex('0', { x: x - 90, y: 332, size: 30, visible: false }), s.tex('\\cdots', { x, y: 332, size: 30, visible: false }), s.tex('9', { x: x + 90, y: 332, size: 30, visible: false })],
        }));
        const dots = s.tex('\\cdots', { x: 580, y: 165, size: 34, color: C.blue, visible: false });
        const ghost = [540, 600, 660].map((x) => s.line(480, 62, x, 140, { color: C.blue, width: 2, dash: true, visible: false }));
        const count = s.tex(`${LETTERS} \\cdot ${DIGITS} = ${LETTERS * DIGITS}`, { x: 480, y: 435, size: 46, color: C.green, visible: false });
        const cap = s.text('a letter, then a digit: $26$ branches, each splitting into $10$', { x: 480, y: 505, size: 30, color: C.muted, visible: false });
        // A × B grid
        const gx = (j) => 285 + j * 110;
        const gy = (i) => 170 + i * 70;
        const colLab = SETB.map((b, j) => s.tex(b, { x: gx(j), y: 105, size: 32, color: C.teal, visible: false }));
        const rowLab = SETA.map((a, i) => s.tex(a, { x: 190, y: gy(i), size: 32, color: C.blue, visible: false }));
        const pairs = SETA.flatMap((a, i) => SETB.map((b, j) => s.tex(`(${a}, ${b})`, { x: gx(j), y: gy(i), size: 30, visible: false })));
        const frame = s.rect(225, 135, 340, 280, { color: C.line, width: 2, radius: 10, visible: false });
        const f1 = s.tex('\\lvert A \\times B \\rvert = \\lvert A \\rvert \\cdot \\lvert B \\rvert', { x: 750, y: 240, size: 32, visible: false });
        const f2 = s.tex(`= ${SETA.length} \\cdot ${SETB.length} = ${SETA.length * SETB.length}`, { x: 750, y: 300, size: 34, color: C.green, visible: false });
        const indep = s.text('Independent: the number of options at each stage does not depend on the earlier choices.', { x: 480, y: 485, size: 30, width: 860, visible: false });
        const ex = s.tex(`\\text{two different letters: } ${LETTERS} \\cdot ${LETTERS - 1} = ${LETTERS * (LETTERS - 1)}`, { x: 480, y: 548, size: 32, color: C.muted, visible: false });
        return { root, letters, dots, ghost, count, cap, colLab, rowLab, pairs, frame, f1, f2, indep, ex };
      },
      steps: [
        {
          say: 'How many labels are a letter followed by a digit? Choose the letter: twenty-six branches. Each branch then splits into ten digits. Twenty-six groups of ten: two hundred sixty.',
          do: async (s, o) => {
            await o.root.draw();
            await s.all(o.letters.map((l) => s.all(l.line.draw({ duration: 500 }), l.tex.fadeIn({ delay: 300 }))), o.ghost.map((g) => g.draw({ duration: 500 })), o.dots.fadeIn({ delay: 300 }));
            for (const l of o.letters) {
              await s.stagger(l.leaves.map((f) => () => s.all(f.line.draw({ duration: 300 }), f.dot.draw({ duration: 300 }))), 40);
              await s.all(l.labels.map((m) => m.fadeIn()));
            }
            await o.count.write();
            await o.cap.fadeIn();
          },
        },
        {
          say: 'Formally, a choice of a letter and then a digit is an ordered pair, so we are counting a Cartesian product: $\\lvert A \\times B \\rvert = \\lvert A \\rvert \\lvert B \\rvert${the size of A cross B is the size of A times the size of B}. For a small example, take $A = \\{a, b, c, d\\}${A equals the set a, b, c, d} and $B = \\{1, 2, 3\\}${B equals the set one, two, three}: four rows of three pairs make twelve.',
          do: async (s, o) => {
            const tree = [o.root, o.dots, o.count, o.cap, ...o.ghost, ...o.letters.flatMap((l) => [l.line, l.tex, ...l.labels, ...l.leaves.flatMap((f) => [f.line, f.dot])])];
            await s.all(tree.map((m) => m.fadeOut()));
            await s.all(o.frame.fadeIn({ shift: [0, 0] }), ...o.colLab.map((m) => m.fadeIn()), ...o.rowLab.map((m) => m.fadeIn()));
            await s.stagger(o.pairs.map((m) => () => m.fadeIn()), 90);
            await o.f1.write();
            await o.f2.write();
          },
        },
        {
          say: 'The product rule needs independence: the number of options at each stage must not depend on the earlier choices. Two different letters: twenty-six, then always twenty-five, even though which twenty-five depends on the first.',
          do: async (s, o) => {
            await o.indep.fadeIn();
            await o.ex.write();
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'sum-rule',
      title: 'The sum rule and inclusion–exclusion',
      scene(s) {
        const v = s.venn({ x: 240, y: 300, sets: ['A', 'B'], r: 90, visible: false });
        const cs = regionCenters(v);
        const num = (n, [x, y], color) => s.tex(String(n), { x, y, size: 36, color, visible: false });
        const nA = num(SUM.Aonly, cs[1], C.blue);
        const nAB = num(SUM.AB, cs[3], C.purple);
        const nB = num(SUM.Bonly, cs[2], C.teal);
        const nOut = num(SUM.none, [v.x + v.U.x + 40, v.y + v.U.y + v.U.h - 34], C.muted);
        const R = 678;
        const dA = s.tex('A = \\text{multiples of } 2', { x: R, y: 70, size: 32, color: C.blue, visible: false });
        const dB = s.tex('B = \\text{multiples of } 3', { x: R, y: 120, size: 32, color: C.teal, visible: false });
        const dU = s.text('in $\\{1, \\dots, 100\\}$', { x: R, y: 168, size: 30, color: C.muted, visible: false });
        const sum1 = s.tex(`\\lvert A \\cup B \\rvert = ${SUM.Aonly} + ${SUM.AB} + ${SUM.Bonly} = ${SUM.U}`, { x: R, y: 240, size: 32, visible: false });
        const ab = s.tex(`\\lvert A \\rvert + \\lvert B \\rvert = ${SUM.A} + ${SUM.B} = ${SUM.A + SUM.B}`, { x: R, y: 310, size: 32, color: C.red, visible: false });
        const twice = s.text(`the overlap is counted twice`, { x: R, y: 358, size: 30, color: C.red, visible: false });
        const ie1 = s.tex('\\lvert A \\cup B \\rvert = \\lvert A \\rvert + \\lvert B \\rvert - \\lvert A \\cap B \\rvert', { x: R, y: 420, size: 30, color: C.green, visible: false });
        const ie2 = s.tex(`= ${SUM.A} + ${SUM.B} - ${SUM.AB} = ${SUM.U}`, { x: R, y: 470, size: 32, color: C.green, visible: false });
        const fl = s.tex(`\\text{multiples of } 6: \\ \\lfloor 100/6 \\rfloor = ${SUM.AB}`, { x: R, y: 540, size: 30, color: C.muted, visible: false });
        return { v, nA, nAB, nB, nOut, dA, dB, dU, sum1, ab, twice, ie1, ie2, fl };
      },
      steps: [
        {
          say: 'Among one to one hundred, take the multiples of two and the multiples of three. The diagram splits them into disjoint pieces, and for disjoint sets, sizes add: thirty-four plus sixteen plus seventeen is sixty-seven.',
          do: async (s, o) => {
            await s.all(o.v.fadeIn({ shift: [0, 0] }), o.dA.fadeIn(), o.dB.fadeIn({ delay: 200 }), o.dU.fadeIn({ delay: 400 }));
            await o.v.shade('A-B', { color: 'blue' });
            await o.nA.fadeIn();
            await o.v.shade('A&B', { color: 'purple' });
            await o.nAB.fadeIn();
            await o.v.shade('B-A', { color: 'teal' });
            await o.nB.fadeIn();
            await o.nOut.fadeIn();
            await o.sum1.write();
          },
        },
        {
          say: 'Adding the whole of $A${A} and the whole of $B${B} gives eighty-three: too many, because the overlap is in both and gets counted twice. So subtract it once.',
          do: async (s, o) => {
            await o.ab.write();
            o.ring = s.ring(o.nAB, { color: 'red', pad: 14 });
            await o.ring;
            await o.twice.fadeIn();
            await o.ie1.write();
            await o.ie2.write();
          },
        },
        {
          say: 'The multiples of $d${d} up to $N${N} number the floor of $N${N} over $d${d}. Both two and three divide exactly the multiples of six, so the overlap has sixteen.',
          do: async (s, o) => {
            await o.fl.write();
            await o.nAB.indicate({ color: C.purple });
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'try-ie',
      kind: 'try',
      title: 'Inclusion–exclusion',
      say: 'Your turn: two overlapping sets, so watch the overlap.',
      prompt: `How many integers in $\\{1, \\dots, ${IE.N}\\}$ are divisible by $${IE.a}$ or by $${IE.b}$?`,
      answer: { type: 'number', value: IE.ans },
      hint: `Divisible by both means divisible by $${IE.a * IE.b}$.`,
      solution: [
        `Multiples of $${IE.a}$: $\\lfloor ${IE.N}/${IE.a} \\rfloor = ${IE.A}$. Multiples of $${IE.b}$: $${IE.B}$. Multiples of both, i.e. of $${IE.a * IE.b}$: $${IE.AB}$.`,
        `By inclusion–exclusion: $${IE.A} + ${IE.B} - ${IE.AB} = ${IE.ans}$.`,
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'permutations',
      title: 'Arrangements',
      scene(s) {
        const runners = range(1, RUN).map((k) => runner(s, k, 130 + (k - 1) * 100, 70));
        const block = (x, top, label) => ({
          r: s.rect(x - 60, top, 120, 440 - top, { color: C.ink, width: 3, radius: 6, visible: false }),
          t: s.text(label, { x, y: top + 40, size: 30, color: C.muted, visible: false }),
        });
        const blocks = [block(330, 300, '1st'), block(210, 340, '2nd'), block(450, 370, '3rd')];
        const picks = [3, 7, 5]; // who wins (indices into runners, 1-based)
        const opts = [RUN, RUN - 1, RUN - 2].map((n, i) => s.tex(String(n), { x: [330, 210, 450][i], y: 480, size: 36, color: C.yellow, visible: false }));
        const prod = s.tex(`${RUN} \\cdot ${RUN - 1} \\cdot ${RUN - 2} = ${P83}`, { x: 730, y: 330, size: 46, color: C.green, visible: false });
        const order = [5, 2, 8, 1, 7, 4, 6, 3];
        const all = s.tex(`${RUN}! = 8 \\cdot 7 \\cdot 6 \\cdots 1 = ${F8}`, { x: 480, y: 330, size: 42, color: C.green, visible: false });
        const zero = s.text('$0! = 1$ (one way to arrange nothing)', { x: 480, y: 400, size: 30, color: C.muted, visible: false });
        const c1 = s.defCard({ y: 140, title: 'Permutations', tex: 'n! = n(n-1)\\cdots 2 \\cdot 1 \\qquad 0! = 1', visible: false });
        const c2 = s.defCard({ y: 320, title: 'The first $k$ places', tex: 'P(n, k) = n(n-1)\\cdots(n-k+1) = \\dfrac{n!}{(n-k)!}', visible: false });
        const ex = s.tex(`P(8, 3) = \\dfrac{8!}{5!} = ${P(8, 3)}`, { x: 480, y: 490, size: 36, color: C.green, visible: false });
        return { runners, blocks, picks, opts, prod, order, all, zero, c1, c2, ex };
      },
      steps: [
        {
          say: 'Eight runners, three podium places. Any of the eight can win, then any of the remaining seven is second, then any of the six left is third. Choices shrink by one each time, and the product rule gives three hundred thirty-six.',
          do: async (s, o) => {
            await s.all(o.runners.map((r, i) => r.show(i * 60)));
            await s.all(o.blocks.map((b, i) => s.all(b.r.fadeIn({ shift: [0, 20], delay: i * 120 }), b.t.fadeIn({ delay: i * 120 + 200 }))));
            const spots = [[330, 272], [210, 312], [450, 342]];
            for (let i = 0; i < 3; i++) {
              await o.opts[i].fadeIn();
              const r = o.runners[o.picks[i] - 1];
              await s.all(r.recolor(C.green), r.moveTo(...spots[i], { duration: 700 }));
            }
            await o.prod.write();
          },
        },
        {
          say: 'Line up all eight and the same reasoning gives eight factorial, forty thousand three hundred twenty orders. By convention $0! = 1${zero factorial equals one}: there is exactly one way to arrange nothing.',
          do: async (s, o) => {
            await s.all(...o.blocks.flatMap((b) => [b.r.fadeOut(), b.t.fadeOut()]), ...o.opts.map((m) => m.fadeOut()), o.prod.fadeOut());
            await s.all(o.runners.map((r) => r.recolor(C.blue)));
            await s.all(o.order.map((k, pos) => o.runners[k - 1].moveTo(130 + pos * 100, 200, { duration: 900, delay: pos * 60 })));
            await o.all.write();
            await o.zero.fadeIn();
          },
        },
        {
          say: 'In general: $n${n} objects in a row, $n!${n factorial} ways. Only the first $k${k} places: $P(n, k)${P of n k}, the product of $k${k} shrinking factors, which is $n!${n factorial} over $(n - k)!${n minus k factorial}.',
          do: async (s, o) => {
            await s.all(...o.runners.map((r) => r.fadeOut()), o.all.fadeOut(), o.zero.fadeOut());
            await o.c1.reveal();
            await o.c2.reveal();
            await o.ex.write();
          },
        },
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'combinations',
      title: 'Choosing: double counting',
      scene(s) {
        const ry = (i) => 62 + i * 80;
        const sets = SUBS.map((sub, i) => s.tex(`\\{${sub.join(', ')}\\}`, { x: 120, y: ry(i), size: 32, color: C.blue, visible: false }));
        const orders = ORDERS.map((list, i) => list.map((w) => s.tex(w, { x: 120, y: ry(i), size: 32, visible: false })));
        const slot = (j) => 290 + j * 100;
        const arrow = SUBS.map((_, i) => s.arrow(195, ry(i), 235, ry(i), { color: C.muted, width: 3, visible: false }));
        const count = s.tex(`${SUBS.length} \\cdot ${fact(3)} = ${SUBS.length * fact(3)} = P(4, 3) = 4 \\cdot 3 \\cdot 2`, { x: 480, y: 405, size: 36, visible: false });
        const gen = s.tex('P(n, k) = \\tbinom{n}{k} \\cdot k! \\implies \\tbinom{n}{k} = \\dfrac{n!}{k!\\,(n-k)!}', { x: 480, y: 505, size: 36, color: C.green, visible: false });
        return { sets, orders, slot, arrow, count, gen, ry };
      },
      steps: [
        {
          say: 'Count the ordered triples from $\\{a, b, c, d\\}${the set a, b, c, d} in two ways. Directly, it is $P(4, 3)${P of four three}. Or first choose which three letters, a set, then put them in order.',
          do: async (s, o) => {
            await s.stagger(o.sets.map((m) => () => m.fadeIn({ shift: [-12, 0] })), 250);
          },
        },
        {
          say: 'There are four three-element sets, and each one can be ordered in three factorial, six ways. Every ordered triple appears exactly once, so four times six is twenty-four, which is $P(4, 3)${P of four three}.',
          do: async (s, o) => {
            for (let i = 0; i < o.sets.length; i++) {
              await o.arrow[i].draw({ duration: 250 });
              await s.all(o.orders[i].map((m, j) => m.show() && m.moveTo(o.slot(j), o.ry(i), { duration: 600, delay: j * 50 })));
            }
            await o.count.write();
          },
        },
        {
          say: 'The same works for any $n${n} and $k${k}: $P(n, k) = \\binom{n}{k} \\cdot k!${P of n k equals n choose k times k factorial}. Divide by $k!${k factorial} and you have the formula for $\\binom{n}{k}${n choose k}.',
          do: (s, o) => o.gen.write({ duration: 1200 }),
        },
        {
          say: 'This is double counting: count one set in two ways, and the answers must agree. It is a proof technique, not just a trick.',
          do: async (s, o) => {
            await s.all(o.sets.map((m) => m.indicate({ color: C.blue, scale: 1.08 })));
            await o.gen.indicate({ color: C.green, scale: 1.05 });
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-officers',
      kind: 'blanks',
      title: 'A club election',
      say: 'A club election mixes ordered roles with an unordered committee. Fill in the count.',
      prompt: `A club of ${OFF.n} chooses a president, then a treasurer, then a ${OFF.c}-person committee from the remaining ${OFF.n - 2}. How many outcomes are there?`,
      lines: [
        [`${OFF.n} \\cdot `, { id: 't', answer: { type: 'number', value: OFF.n - 1 }, hint: 'The president cannot also be treasurer.' }, `\\cdot \\binom{${OFF.n - 2}}{${OFF.c}} = ${OFF.roles} \\cdot `, { id: 'c', answer: { type: 'number', value: OFF.comm } }, '=', { id: 'n', answer: { type: 'number', value: OFF.total } }],
      ],
      solution: [
        `The two roles are ordered: $${OFF.n} \\cdot ${OFF.n - 1} = ${OFF.roles}$ ways. The committee is unordered: $\\binom{${OFF.n - 2}}{${OFF.c}} = ${OFF.comm}$ ways.`,
        `By the product rule: $${OFF.roles} \\cdot ${OFF.comm} = ${OFF.total}$.`,
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'overcounting',
      title: 'Overcounting',
      scene(s) {
        const lab = (str, y) => s.text(str, { x: 70, y, size: 30, anchor: [0, 0.5], color: C.muted, visible: false });
        const gl = lab('girls', 45);
        const bl = lab('boys', 95);
        const girls = GIRLS.map((g, i) => s.text(g, { x: 280 + i * 120, y: 45, size: 30, color: C.teal, visible: false }));
        const boys = BOYS.map((b, i) => s.text(b, { x: 280 + i * 120, y: 95, size: 30, color: C.orange, visible: false }));
        const wrong = s.text(`A girl ($5$ ways), then anyone else ($9$): $5 \\cdot 9 = ${OC.wrong}$`, { x: 365, y: 160, size: 30, color: C.red, visible: false });
        const left = s.tex('\\text{Ann first, then Bea}', { x: 230, y: 240, size: 32, visible: false });
        const right = s.tex('\\text{Bea first, then Ann}', { x: 730, y: 240, size: 32, visible: false });
        const pair = s.tex('\\{\\text{Ann}, \\text{Bea}\\}', { x: 480, y: 320, size: 36, color: C.red, visible: false });
        const a1 = s.arrow(270, 265, 415, 308, { color: C.red, width: 3, visible: false });
        const a2 = s.arrow(690, 265, 545, 308, { color: C.red, width: 3, visible: false });
        const twice = s.text('the same pair, counted twice', { x: 480, y: 380, size: 30, color: C.red, visible: false });
        const stamp = s.stamp('overcount', { x: 815, y: 160, color: 'red', size: 30 });
        const comp = s.tex(`\\tbinom{10}{2} - \\tbinom{5}{2} = ${OC.all} - ${OC.gg} = ${OC.right}`, { x: 480, y: 455, size: 36, color: C.green, visible: false });
        const cases = s.tex(`\\text{one girl: } ${OC.one}, \\quad \\text{two girls: } \\tbinom{5}{2} = ${OC.gg}, \\quad \\text{total } ${OC.right}`, { x: 480, y: 525, size: 34, color: C.green, visible: false });
        const exact = s.tex(`${OC.wrong} = ${OC.one} + 2 \\cdot ${OC.gg}: \\text{ every two-girl pair counted twice}`, { x: 480, y: 380, size: 30, color: C.red, visible: false });
        return { gl, bl, girls, boys, wrong, left, right, pair, a1, a2, twice, stamp, comp, cases, exact };
      },
      steps: [
        {
          say: 'Choose two people from five girls and five boys, with at least one girl. A tempting count: pick a girl, five ways, then anyone else, nine ways. Forty-five.',
          do: async (s, o) => {
            await s.all(o.gl.fadeIn(), o.bl.fadeIn(), ...o.girls.map((m, i) => m.fadeIn({ delay: i * 80 })), ...o.boys.map((m, i) => m.fadeIn({ delay: 200 + i * 80 })));
            await o.wrong.fadeIn();
          },
        },
        {
          say: 'Here’s the trap. Ann first, then Bea, and Bea first, then Ann, are two different runs of the procedure, but they give the same pair. Picking a special one, then the rest, counts some outcomes twice.',
          do: async (s, o) => {
            await s.all(o.girls[0].indicate({ color: C.yellow }), o.left.fadeIn());
            await s.all(o.girls[1].indicate({ color: C.yellow }), o.right.fadeIn());
            await s.all(o.a1.draw({ duration: 500 }), o.a2.draw({ duration: 500 }));
            await o.pair.write();
            await o.twice.fadeIn();
            await o.stamp.slam();
          },
        },
        {
          say: 'Count the complement instead: all pairs minus the all-boy pairs, forty-five minus ten, which is thirty-five. Or split into disjoint cases: one girl, twenty-five; two girls, ten. Thirty-five again.',
          do: async (s, o) => {
            await o.comp.write();
            await o.cases.write({ duration: 1200 });
          },
        },
        {
          say: 'The difference is exact: the wrong count is twenty-five plus twice ten, because every two-girl pair was counted twice. Always sanity-check a method on a small case you can list by hand.',
          do: async (s, o) => {
            await o.twice.fadeOut();
            await o.exact.write();
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'try-two-aces',
      kind: 'try',
      title: 'Poker hands',
      say: 'A card-counting question. Split the hand into the part that matters and the rest.',
      prompt: 'How many 5-card hands from a standard 52-card deck contain exactly two aces?',
      answer: { type: 'number', value: ACES.ans },
      hint: 'Choose the aces and the non-aces separately.',
      solution: [
        `Choose the two aces from the four: $\\binom{4}{2} = ${ACES.pick}$. Choose the other three cards from the $48$ non-aces: $\\binom{48}{3} = ${ACES.rest}$.`,
        `By the product rule: $${ACES.pick} \\cdot ${ACES.rest} = ${ACES.ans}$.`,
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'combinatorial-proof',
      title: 'Combinatorial proofs',
      scene(s) {
        const ppl = range(1, 5).map((k) => runner(s, k, 140 + (k - 1) * 90, 95));
        const IN = [1, 3];
        const sym = s.tex(`\\tbinom{5}{2} = \\tbinom{5}{3} = ${binom(5, 2)}`, { x: 745, y: 95, size: 36, visible: false });
        const io = s.tex(`\\text{in: } \\{${IN.join(', ')}\\} \\ \\longleftrightarrow \\ \\text{out: } \\{${range(1, 5).filter((k) => !IN.includes(k)).join(', ')}\\}`, { x: 320, y: 170, size: 30, visible: false });
        const symGen = s.tex('\\tbinom{n}{k} = \\tbinom{n}{n - k}', { x: 745, y: 170, size: 34, color: C.green, visible: false });
        const cIn = s.text('$5$ in: pick $1$ more of $4$', { x: 250, y: 260, size: 30, color: C.blue, visible: false });
        const cInN = s.tex(`\\tbinom{4}{1} = ${binom(4, 1)}`, { x: 250, y: 315, size: 36, color: C.blue, visible: false });
        const cOut = s.text('$5$ out: pick $2$ of $4$', { x: 710, y: 260, size: 30, color: C.teal, visible: false });
        const cOutN = s.tex(`\\tbinom{4}{2} = ${binom(4, 2)}`, { x: 710, y: 315, size: 36, color: C.teal, visible: false });
        const sum = s.tex(`\\tbinom{5}{2} = \\tbinom{4}{1} + \\tbinom{4}{2} = ${binom(4, 1)} + ${binom(4, 2)} = ${binom(5, 2)}`, { x: 480, y: 405, size: 36, visible: false });
        const pas = s.tex('\\tbinom{n}{k} = \\tbinom{n-1}{k-1} + \\tbinom{n-1}{k}', { x: 480, y: 495, size: 38, color: C.green, visible: false });
        // Pascal's triangle
        const tri = PASCAL.map((row, n) => row.map((v, k) => s.tex(String(v), { x: 480 + (k - n / 2) * 84, y: 60 + n * 68, size: 32, visible: false })));
        const triNote = s.text('each entry = the sum of the two above it', { x: 480, y: 545, size: 30, color: C.muted, visible: false });
        return { ppl, IN, sym, io, symGen, cIn, cInN, cOut, cOutN, sum, pas, tri, triNote };
      },
      steps: [
        {
          say: 'A combinatorial proof shows two expressions count the same set. Choosing which two of five people are in is the same as choosing which three are out, so $\\binom{n}{k} = \\binom{n}{n-k}${n choose k equals n choose n minus k}.',
          do: async (s, o) => {
            await s.all(o.ppl.map((p, i) => p.show(i * 70)));
            await o.sym.write();
            await s.all(o.ppl.map((p, i) => p.recolor(o.IN.includes(i + 1) ? C.green : C.muted)));
            await o.io.fadeIn();
            await o.symGen.write();
          },
        },
        {
          say: 'Pascal’s rule: split the two-person groups by asking one question, is person five in? If yes, choose one more of the other four; if no, choose both from the four. Four plus six is ten.',
          do: async (s, o) => {
            await s.all(o.ppl.map((p, i) => p.recolor(i === 4 ? C.yellow : C.ink)));
            await o.ppl[4].c.indicate({ color: C.yellow });
            await s.all(o.cIn.fadeIn(), o.cOut.fadeIn({ delay: 200 }));
            await s.all(o.cInN.write(), o.cOutN.write({ delay: 200 }));
            await o.sum.write();
            await o.pas.write();
          },
        },
        {
          say: 'That rule builds Pascal’s triangle row by row: each entry is the sum of the two above it.',
          do: async (s, o) => {
            const old = [...o.ppl.flatMap((p) => [p.c, p.t]), o.sym, o.io, o.symGen, o.cIn, o.cInN, o.cOut, o.cOutN, o.sum, o.pas];
            await s.all(old.map((m) => m.fadeOut()));
            for (const row of o.tri) await s.all(row.map((m, k) => m.fadeIn({ delay: k * 40 })));
            await o.triNote.fadeIn();
          },
        },
        {
          say: 'Row five: four plus six is ten, the count we just explained. No algebra was needed, and the proof says why the identity is true.',
          do: async (s, o) => {
            const [a, b, c] = [o.tri[4][1], o.tri[4][2], o.tri[5][2]];
            await s.all(a.recolor(C.blue), b.recolor(C.teal));
            await c.recolor(C.green);
            await s.ring(c, { color: 'green' });
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'ie-three',
      title: 'Three sets',
      scene(s) {
        const v = s.venn({ x: 240, y: 300, sets: ['A', 'B', 'C'], r: 95, visible: false });
        const cs = regionCenters(v);
        const bitsList = [1, 2, 4, 3, 5, 6, 7];
        const tally = (b, stage) => {
          const m = popcount(b);
          return stage === 0 ? m : stage === 1 ? m - binom(m, 2) : m - binom(m, 2) + binom(m, 3);
        };
        const tallies = bitsList.map((b) => ({ b, mob: s.tex(String(tally(b, 0)), { x: cs[b][0], y: cs[b][1], size: 34, visible: false }) }));
        const R = 690;
        const desc = s.text('$A, B, C$: multiples of $2, 3, 5$', { x: R, y: 50, size: 30, color: C.muted, visible: false });
        const [s1, s2, s3] = IE3.singles;
        const [p1, p2, p3] = IE3.pairs;
        const f0 = s.tex('\\lvert A \\cup B \\cup C \\rvert =', { x: R, y: 103, size: 32, visible: false });
        const g1 = s.tex('\\lvert A \\rvert + \\lvert B \\rvert + \\lvert C \\rvert', { x: R, y: 148, size: 30, color: C.blue, visible: false });
        const g2 = s.tex('{} - \\lvert A \\cap B \\rvert - \\lvert A \\cap C \\rvert - \\lvert B \\cap C \\rvert', { x: R, y: 193, size: 30, color: C.orange, visible: false });
        const g3 = s.tex('{} + \\lvert A \\cap B \\cap C \\rvert', { x: R, y: 238, size: 30, color: C.green, visible: false });
        const f1 = s.tex(`= ${s1} + ${s2} + ${s3}`, { x: R, y: 298, size: 32, color: C.blue, visible: false });
        const f2 = s.tex(`{} - ${p1} - ${p2} - ${p3}`, { x: R, y: 343, size: 32, color: C.orange, visible: false });
        const f3 = s.tex(`{} + ${IE3.triple}`, { x: R, y: 388, size: 32, color: C.green, visible: false });
        const f4 = s.tex(`= ${IE3.union}`, { x: R, y: 438, size: 38, color: C.green, visible: false });
        const cop = s.tex(`100 - ${IE3.union} = ${IE3.coprime}`, { x: R, y: 498, size: 34, color: C.green, visible: false });
        const copT = s.text('coprime to $30$', { x: R, y: 545, size: 30, color: C.muted, visible: false });
        return { v, tallies, tally, desc, f0, g1, g2, g3, f1, f2, f3, f4, cop, copT };
      },
      steps: [
        {
          say: 'Multiples of two, three or five up to one hundred. The formula: add the singles, subtract the pairwise overlaps, add back the triple overlap. First the singles: fifty plus thirty-three plus twenty. Watch the tallies: a number in two of the sets is now counted twice, and one in all three, three times.',
          do: async (s, o) => {
            await s.all(o.v.fadeIn({ shift: [0, 0] }), o.desc.fadeIn());
            await o.f0.write();
            await s.stagger([o.g1, o.g2, o.g3].map((g) => () => g.write()), 450);
            await o.f1.write();
            await s.stagger(o.tallies.map((t) => () => t.mob.fadeIn()), 120);
          },
        },
        {
          say: 'Subtract the three pairwise overlaps. Now the double regions are down to one, but the center went from three to zero.',
          do: async (s, o) => {
            await o.f2.write();
            await s.all(o.tallies.filter((t) => popcount(t.b) >= 2).map((t) => t.mob.swap(String(o.tally(t.b, 1)))));
            await o.tallies.find((t) => t.b === 7).mob.recolor(C.red);
          },
        },
        {
          say: 'Add back the triple overlap. Every region is now counted exactly once, so the total is seventy-four.',
          do: async (s, o) => {
            await o.f3.write();
            const c = o.tallies.find((t) => t.b === 7).mob;
            await c.swap(String(o.tally(7, 2)));
            await c.recolor(C.green);
            await s.all(o.tallies.map((t) => t.mob.recolor(C.green)));
            await o.f4.write();
          },
        },
        {
          say: 'The rest, twenty-six numbers, are divisible by none of two, three and five, so they are the numbers up to one hundred that are coprime to thirty.',
          do: async (s, o) => {
            await o.v.shade('!(A|B|C)', { color: 'green' });
            await o.cop.write();
            await o.copT.fadeIn();
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-count',
      kind: 'workout',
      title: 'Count it',
      say: 'Grab paper and count. Decide what is fixed and what is chosen.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate(rand) {
        const n = rand.int(6, 12);
        const k = rand.int(2, n - 2);
        return bitItem(n, k);
      },
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-subsets-sum',
      kind: 'workout',
      title: 'Work it out',
      say: 'Now a combinatorial proof. Find one set that both sides count.',
      prompt: 'Give a combinatorial proof that $\\displaystyle\\sum_{k=0}^{n} \\binom{n}{k} = 2^n$ for every $n \\in \\mathbb{Z}_{\\ge 0}$.',
      answer: { type: 'proof' },
      hints: ['Both sides count the subsets of $\\{1, \\dots, n\\}$.', 'Count once by size, once by in/out choices for each element.'],
      solution: [
        '**Proof.** Let $n \\in \\mathbb{Z}_{\\ge 0}$. We count the subsets of $S = \\{1, \\dots, n\\}$ in two ways.',
        'Each element of $S$ is either in a subset or out of it, independently of the others, so by the product rule there are $2^n$ subsets.',
        'Alternatively, the subsets of size $k$ number $\\binom{n}{k}$, and every subset has exactly one size $k \\in \\{0, \\dots, n\\}$; so the sizes split the subsets into disjoint classes, and by the sum rule there are $\\sum_{k=0}^{n} \\binom{n}{k}$ subsets.',
        'Both counts count the same set, so they are equal: $\\sum_{k=0}^{n} \\binom{n}{k} = 2^n$. ∎',
      ],
      rubric: [
        'Names the set being counted (the subsets of an $n$-element set).',
        'First count justified: in/out for each element, product rule, $2^n$.',
        'Second count justified: subsets grouped by size (disjoint, covering), sum rule.',
        'Concludes that the two counts are equal.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-double-count',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap, explain in your own words where the formula for n choose k comes from.',
      prompt: 'Explain how double counting shows $\\binom{n}{k} = \\frac{n!}{k!(n - k)!}$.',
      points: [
        'Count ordered selections of $k$ objects from $n$ directly: $n!/(n - k)!$.',
        'Count them as “choose a $k$-subset, then order it”: $\\binom{n}{k} \\cdot k!$.',
        'Both count the same set, so they are equal.',
        'Divide by $k!$.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Product rule = size of a Cartesian product; sum rule = size of a disjoint union; overlaps: inclusion–exclusion.', 120),
          recapItem(s, '• $n!$, $P(n, k) = n!/(n-k)!$, $\\binom{n}{k} = n!/(k!(n-k)!)$. Beware overcounting; double counting proves identities.', 260),
          recapItem(s, 'Next: binomial coefficients in algebra, and pigeons.', 410, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'The product rule counts a Cartesian product, the sum rule a disjoint union, and inclusion–exclusion corrects for overlaps.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Arrangements give $n!${n factorial} and $P(n, k)${P of n k}; choices give $\\binom{n}{k}${n choose k}. Beware of overcounting, and use double counting to prove identities.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: binomial coefficients in algebra, and the pigeonhole principle.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};

// Guard: the narration (literal clips) states these numbers.
if (LETTERS * DIGITS !== 260 || SUM.Aonly !== 34 || SUM.AB !== 16 || SUM.Bonly !== 17 || SUM.U !== 67 || SUM.A + SUM.B !== 83 || IE.ans !== 467 || P83 !== 336 || F8 !== 40320 || OC.wrong !== 45 || OC.right !== 35 || OC.one !== 25 || OC.gg !== 10 || ACES.ans !== 103776 || IE3.union !== 74 || IE3.coprime !== 26 || WO.answer.value !== 84 || OFF.total !== 5040) {
  throw new Error('counting lecture: data changed; update the narration');
}
