/**
 * Lecture 16 · Strong induction and recursion (foundations/PLAN.md § 16). Irani · Induction.
 *
 * Choreography: dominoes where the next one is pushed by arcs from every earlier one; a factor tree grows beside
 * the strong-induction proof; postage rows reach back four rows with arcs; Fibonacci squares tile a spiral while
 * the terms appear; the minimal-counterexample proof marks the least bad m on a number line; the broken proof of
 * "5n = 0" dies at k = 0 in red.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, no DOM)

const isPrime = (n) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};

/** Factor tree: split n = a·b with a the largest divisor ≤ √n (so 60 → 6 · 10). */
function tree(n) {
  if (isPrime(n)) return { n };
  let a = 1;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) a = d;
  return { n, kids: [tree(a), tree(n / a)] };
}
const TREE = tree(60);
const leaves = (t) => (t.kids ? t.kids.flatMap(leaves) : [t.n]);
const PRIMES60 = leaves(TREE); // [2, 3, 2, 5]

/** n = sa·a + sb·b with a, b ≥ 0 (fewest b), or null. */
function stamps(n, sa, sb) {
  for (let b = 0; sb * b <= n; b++) if ((n - sb * b) % sa === 0) return { a: (n - sb * b) / sa, b };
  return null;
}
const POST = Array.from({ length: 9 }, (_, i) => ({ n: 11 + i, rep: stamps(11 + i, 4, 5) }));
const BASES = POST.filter((r) => r.n >= 12 && r.n <= 15);

/** Fibonacci F_1..F_n. */
const fib = (n) => {
  const f = [1, 1];
  while (f.length < n) f.push(f.at(-1) + f.at(-2));
  return f.slice(0, n);
};
const FIB = fib(10);

/** Fibonacci squares 1, 1, 2, 3, 5, 8 laid out as a spiral: right, down, left, up, … around the bounding box. */
const SQUARES = (() => {
  const sizes = FIB.slice(0, 6);
  const out = [{ x: 0, y: 0, s: 1 }];
  let bb = { x0: 0, y0: 0, x1: 1, y1: 1 };
  const dirs = ['right', 'down', 'left', 'up'];
  sizes.slice(1).forEach((s, i) => {
    const d = dirs[i % 4];
    let sq;
    if (d === 'right') sq = { x: bb.x1, y: bb.y0, s };
    else if (d === 'down') sq = { x: bb.x0, y: bb.y1, s };
    else if (d === 'left') sq = { x: bb.x0 - s, y: bb.y0, s };
    else sq = { x: bb.x0, y: bb.y0 - s, s };
    out.push(sq);
    bb = { x0: Math.min(bb.x0, sq.x), y0: Math.min(bb.y0, sq.y), x1: Math.max(bb.x1, sq.x + s), y1: Math.max(bb.y1, sq.y + s) };
  });
  return { squares: out, bb };
})();

/** a_1, a_2 given; a_n = c1·a_{n−1} + c2·a_{n−2}; terms a_1..a_6. */
function recurrence({ a1, a2, c1, c2 }) {
  const a = [a1, a2];
  while (a.length < 6) a.push(c1 * a.at(-1) + c2 * a.at(-2));
  return a;
}
const coef = (c, v) => (c === 1 ? v : `${c} \\cdot ${v}`);
function recItem(d) {
  const a = recurrence(d);
  const rule = `a_n = ${coef(d.c1, 'a_{n-1}')} + ${coef(d.c2, 'a_{n-2}')}`;
  const lines = [3, 4, 5, 6].map((n) => `$a_${n} = ${coef(d.c1, a[n - 2])} + ${coef(d.c2, a[n - 3])} = ${a[n - 1]}$`);
  return {
    prompt: `$a_1 = ${d.a1}$, $a_2 = ${d.a2}$, and $${rule}$ for $n \\ge 3$. Find $a_6$.`,
    answer: { type: 'number', value: a[5] },
    hints: ['Compute $a_3, a_4, a_5$ in order: each term needs the two before it.', `$a_3 = ${a[2]}$.`],
    solution: [`Each term uses the two before it: ${lines.join(', ')}.`, `So $a_6 = ${a[5]}$.`],
    a,
  };
}
const REC = { a1: 1, a2: 3, c1: 1, c2: 2 };
const REC_ITEM = recItem(REC);
// Closed form for the fixed problem: a_n = (2^{n+1} + (−1)^n)/3.
const CLOSED6 = (2 ** 7 + 1) / 3;

// ---------------------------------------------------------------- local helpers (cards, stamps, rings: viz/common.js)

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** Stage geometry of a dominoes mob built with { x, y, w, gap, h = 116, more }. */
function dominoGeom(n, { x, y, w, gap, h = 116, more = true }) {
  const pitch = w + gap;
  const tail = more ? gap + 60 : h + 10;
  const span = (n - 1) * pitch + w + tail;
  const left = -span / 2;
  return { cx: (i) => x + left + w + i * pitch - w / 2, top: y - h / 2 };
}

/** A curved arc from (x1, y) up and over to (x2, y). */
const arcPath = (x1, x2, y, lift) => `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - lift} ${x2} ${y}`;

// ---------------------------------------------------------------- lecture

export default {
  id: 'strong-induction',
  title: 'Strong induction and recursion',
  goals: [
    'State strong induction and recognize when it is needed',
    'Prove that every integer $n \\ge 2$ is a product of primes',
    'Handle several base cases (postage problems) and recursive definitions (Fibonacci)',
    'Write a minimal-counterexample (well-ordering) proof',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'need-strong',
      title: 'When one step back isn’t enough',
      scene(s) {
        const D = { x: 480, y: 410, w: 22, gap: 60 };
        const labels = ['1', '2', '3', '', '', 'k', 'k+1', ''];
        const d = s.dominoes({ n: 8, ...D, size: 30, label: (j) => labels[j - 1], visible: false });
        const g = dominoGeom(8, D);
        const one = s.path(arcPath(g.cx(5), g.cx(6), g.top - 6, 50), { color: C.blue, width: 4, visible: false });
        const oneLab = s.tex('P(k) \\implies P(k + 1)', { x: (g.cx(5) + g.cx(6)) / 2, y: g.top - 70, size: 30, color: C.blue, visible: false });
        const arcs = [0, 1, 2, 3, 4, 5].map((i) => s.path(arcPath(g.cx(i), g.cx(6), g.top - 6, 40 + (6 - i) * 16), { color: C.yellow, width: 4, visible: false }));
        const f1 = s.tex('12 = 3 \\cdot \\part{f}{4}', { x: 250, y: 80, size: 40, visible: false });
        const f2 = s.tex('\\part{f}{4} = 2 \\cdot 2', { x: 250, y: 150, size: 40, visible: false });
        const eleven = s.tex('11', { x: 680, y: 80, size: 40, color: C.muted, visible: false });
        const elevenWhy = s.text('$P(11)$ is no help for $12$', { x: 680, y: 140, size: 30, color: C.muted, visible: false });
        return { d, g, one, oneLab, arcs, f1, f2, eleven, elevenWhy };
      },
      steps: [
        {
          say: 'Ordinary induction lets $P(k)${P of k} prove $P(k + 1)${P of k plus one}: each domino is knocked over by the one right before it.',
          do: async (s, o) => {
            await o.d.fadeIn();
            await s.all(o.d.highlight(5, 'blue'), o.d.highlight(6, 'green'));
            await s.all(o.one.draw({ duration: 600 }), o.oneLab.fadeIn());
          },
        },
        {
          say: 'But some problems break $k + 1${k plus one} into much smaller pieces. To factor twelve we write three times four, and then four as two times two. Knowing about eleven, the case right before, is no help at all.',
          do: async (s, o) => {
            await o.f1.write({ duration: 800 });
            await o.f1.color('f', C.yellow);
            await o.f2.write({ duration: 800 });
            await o.f2.color('f', C.yellow);
            await s.all(o.eleven.fadeIn(), o.elevenWhy.fadeIn());
            await s.strike(o.eleven);
          },
        },
        {
          say: 'So we let the step use every earlier case at once: all of the dominoes before $k + 1${k plus one} lean on it together. That is strong induction.',
          do: async (s, o) => {
            await s.all(o.one.fadeOut(), o.oneLab.fadeOut(), o.d.highlight(5, 'yellow'));
            await s.all(...[0, 1, 2, 3, 4].map((i) => o.d.highlight(i, 'yellow')));
            await s.stagger(o.arcs.map((a) => () => a.draw({ duration: 500 })), 160);
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'strong-principle',
      title: 'Strong induction',
      scene(s) {
        const card = s.defCard({
          y: 118, width: 880, title: 'Strong induction',
          body: 'If $P(1)$, and $\\part{ih}{P(1) \\land \\cdots \\land P(k)} \\implies P(k + 1)$ for every $k \\in \\mathbb{N}$, then $P(n)$ for all $n \\in \\mathbb{N}$.',
          visible: false,
        });
        const pieces = ['P(1)', '\\;\\land\\;', 'P(2)', '\\;\\land\\;', '\\cdots', '\\;\\land\\;', 'P(k)'];
        const row = s.symbols([...pieces, '\\;\\implies\\;', 'P(k + 1)'], { y: 285, size: 38, visible: false });
        const to = s.symbols([...pieces, '\\;\\land\\;', 'P(k + 1)'], { y: 285, size: 38, visible: false });
        const ihText = s.text('the strong IH: $P(j)$ for every $j \\le k$', { x: 480, y: 232, size: 30, color: C.blue, visible: false });
        const q1 = s.text('$Q(n)$ = “$P(1) \\land \\cdots \\land P(n)$”, so $Q(1) = P(1)$.', { x: 480, y: 410, size: 32, visible: false });
        const q2 = s.text('$Q(k) \\implies P(k + 1)$, hence $Q(k) \\implies Q(k + 1)$.', { x: 480, y: 458, size: 32, visible: false });
        const q3 = s.text('Ordinary induction on $Q$ proves every $P(n)$.', { x: 480, y: 505, size: 30, color: C.green, visible: false });
        const say = s.text('Write: “We proceed by **strong induction** on $n$.”', { x: 480, y: 549, size: 30, color: C.blue, visible: false });
        return { card, row, to, ihText, q1, q2, q3, say };
      },
      steps: [
        {
          say: 'Here is the principle. The only change is the hypothesis: instead of $P(k)${P of k} alone, we may assume $P(j)${P of j} for every $j${j} up to $k${k}.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.card.color('ih', C.blue);
            await s.all(...o.row.slice(0, 7).map((m, i) => m.fadeIn({ delay: i * 90 })));
            o.b1 = s.brace(o.row[0].box().x, 315, o.row[6].box().x + o.row[6].box().w, 315, { side: 'below', label: 'Q(k)', size: 30, color: C.blue, visible: false });
            await s.all(o.b1.draw(), o.ihText.fadeIn());
          },
        },
        {
          say: 'Is it a stronger principle? No. Call the whole conjunction $Q(n)${Q of n}. The strong step says $Q(k)${Q of k} gives $P(k + 1)${P of k plus one}, and so it gives $Q(k + 1)${Q of k plus one}: ordinary induction on $Q${Q}.',
          do: async (s, o) => {
            await s.all(o.row[7].fadeIn(), o.row[8].fadeIn());
            await o.row[8].indicate({ color: C.green });
            await s.all(
              ...o.row.map((m, i) => (i === 7 ? m.fadeOut() : m.moveTo(o.to[i].x, o.to[i].y, { duration: 600 }))),
              o.to[7].fadeIn({ shift: [0, 0] }),
              o.b1.fadeOut(),
            );
            o.b2 = s.brace(o.to[0].box().x, 315, o.to[8].box().x + o.to[8].box().w, 315, { side: 'below', label: 'Q(k + 1)', size: 30, color: C.green, visible: false });
            await o.b2.draw();
            await o.q1.fadeIn();
            await o.q2.fadeIn();
            await o.q3.fadeIn();
          },
        },
        {
          say: 'So strong induction proves exactly the same theorems; it is a convenience. In a proof, just say which form you are using.',
          do: (s, o) => o.say.fadeIn({ shift: [0, 10] }),
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'factorization',
      title: 'Every $n \\ge 2$ is a product of primes',
      scene(s) {
        const p = s.proof({ x: 375, y: 26, width: 670, height: 548, size: 30, whyWidth: 130 });
        const TX = 832;
        const [A, B] = TREE.kids;
        const node = (v, x, y, color = C.ink) => s.tex(String(v), { x, y, size: 34, color, visible: false });
        const root = node(TREE.n, TX, 110);
        const mid = [node(A.n, TX - 48, 220), node(B.n, TX + 48, 220)];
        const leafX = [TX - 72, TX - 26, TX + 26, TX + 72];
        const leafN = [...A.kids.map((k) => k.n), ...B.kids.map((k) => k.n)];
        const leafs = leafN.map((v, i) => node(v, leafX[i], 330, C.green));
        const edge = (x1, y1, x2, y2) => s.line(x1, y1, x2, y2, { color: C.muted, width: 3, visible: false });
        const e1 = [edge(TX - 10, 132, TX - 40, 196), edge(TX + 10, 132, TX + 40, 196)];
        const e2 = [edge(TX - 56, 242, TX - 68, 306), edge(TX - 42, 242, TX - 30, 306), edge(TX + 42, 242, TX + 30, 306), edge(TX + 56, 242, TX + 68, 306)];
        const powers = [...new Set(PRIMES60)].sort((a, b) => a - b).map((p) => {
          const e = PRIMES60.filter((x) => x === p).length;
          return e > 1 ? `${p}^{${e}}` : String(p);
        });
        const prod = s.tex(`${TREE.n} = ${powers.join(' \\cdot ')}`, { x: TX - 8, y: 420, size: 30, color: C.green, visible: false });
        const uniq = s.text('unique?\nlecture 18', { x: TX - 12, y: 490, size: 30, width: 200, color: C.muted, italic: true, visible: false });
        return { p, root, mid, leafs, e1, e2, prod, uniq };
      },
      steps: [
        {
          say: 'Claim: every integer $n \\ge 2${n at least two} is a product of primes. Base case: two is prime. For the step, let $k \\ge 2${k at least two} be an integer and assume every $j${j} from two up to $k${k} is a product of primes.',
          do: async (s, o) => {
            await o.p.add('**Proof.** Strong induction. $2$ is prime.', { why: 'base case' });
            o.ih = o.p.add('Let integer $k \\ge 2$; suppose $2, \\dots, k$ are products of primes.', { kind: 'assume', why: 'strong IH' });
            await o.ih;
            await o.root.fadeIn();
          },
        },
        {
          say: 'Two cases. If $k + 1${k plus one} is prime, it is a product of one prime and we are done. Otherwise, by the definition of prime, it splits as $a \\cdot b${a times b} with both factors strictly between one and $k + 1${k plus one}, like sixty splitting into six times ten.',
          do: async (s, o) => {
            await o.p.add('If $k + 1$ is prime, done.', { why: 'case 1' });
            await o.p.add('Else $k + 1 = ab$, $2 \\le a, b \\le k$', { why: 'case 2' });
            await s.all(...o.e1.map((e) => e.draw({ duration: 500 })));
            await s.all(...o.mid.map((m) => m.fadeIn({ shift: [0, -10] })));
          },
        },
        {
          say: 'Both factors are smaller than $k + 1${k plus one}, so the strong hypothesis covers both of them, not just $k${k}. Each is a product of primes, and multiplying the two products gives one for $k + 1${k plus one}.',
          do: async (s, o) => {
            o.use = o.p.add('So $a$, $b$ are products of primes,', { why: 'IH' });
            await o.use;
            await s.all(o.p.highlight(o.use, 'yellow'), o.p.highlight(o.ih, 'blue'), ...o.mid.map((m) => m.indicate({ color: C.yellow })));
            await s.all(...o.e2.map((e) => e.draw({ duration: 500 })));
            await s.all(...o.leafs.map((m, i) => m.fadeIn({ shift: [0, -10], delay: i * 100 })));
            await o.p.add('hence so is $ab = k + 1$.', { why: 'multiply' });
          },
        },
        {
          say: 'By strong induction, every $n \\ge 2${n at least two} is a product of primes. Notice that a prime counts as a product of one prime. Whether the product is unique is a harder question, for lecture eighteen.',
          do: async (s, o) => {
            await o.p.add('Therefore all $n \\ge 2$ are products of primes.', { kind: 'conclude', why: 'induction' });
            await o.p.qed();
            await o.prod.write({ duration: 900 });
            await o.uniq.fadeIn();
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-which-induction',
      kind: 'try',
      title: 'Which needs strong induction?',
      say: 'Which of these proofs most naturally needs strong induction? Think about how far back each step reaches.',
      prompt: 'Which proof most naturally needs strong induction?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: '$1 + \\cdots + n = n(n + 1)/2$', why: 'Each case uses only the previous one: add $n + 1$ to the formula for $n$.' },
        { id: 'b', label: 'Every $n \\ge 2$ is a product of primes', why: 'Right: $k + 1 = ab$ with factors that can be any smaller numbers, so the step needs every earlier case.' },
        { id: 'c', label: '$2^n > n$ for all $n \\in \\mathbb{N}$', why: 'The previous case suffices: $2^{k+1} = 2 \\cdot 2^k > 2k \\ge k + 1$.' },
        { id: 'd', label: '$3 \\mid 4^n - 1$ for all $n \\in \\mathbb{N}$', why: 'The previous case suffices: $4^{k+1} - 1 = 4(4^k - 1) + 3$.' },
      ],
      hint: 'Which step refers back further than one?',
      solution: [
        '(b). Writing a composite $k + 1 = ab$ gives factors $a, b$ that can be anywhere between $2$ and $k$, so the step needs the statement for all of them, not only for $k$.',
        'The other three each reduce the case $k + 1$ to the case $k$, so ordinary induction is enough.',
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'postage',
      title: 'Stamps of 4 and 5',
      scene(s) {
        const NX = 140, EX = 185;
        const rows = POST.map((r, i) => {
          const y = 70 + i * 56;
          const num = s.tex(String(r.n), { x: NX, y, size: 34, anchor: [1, 0.5], color: r.n < 12 ? C.red : C.ink, visible: false });
          let tex, color = C.ink;
          if (!r.rep) (tex = '\\text{impossible}'), (color = C.red);
          else if (r.n <= 15) (tex = `= 4 \\cdot ${r.rep.a} + 5 \\cdot ${r.rep.b}`), (color = C.blue);
          else tex = `= ${r.n - 4} + 4`;
          const expr = s.tex(tex, { x: EX, y, size: 34, anchor: [0, 0.5], color, visible: false });
          return { r, y, num, expr };
        });
        const arcs = rows
          .filter((row) => row.r.n >= 16)
          .map((row) => {
            const from = rows.find((q) => q.r.n === row.r.n - 4);
            const x = NX - 50;
            return s.path(`M ${x} ${from.y} C ${x - 55} ${from.y + 30} ${x - 55} ${row.y - 30} ${x} ${row.y}`, { color: C.yellow, width: 3.5, visible: false });
          });
        const claim = s.text('**Claim.** Every $n \\ge 12$ is $4a + 5b$ with $a, b \\in \\mathbb{Z}_{\\ge 0}$.', { x: 680, y: 95, size: 30, width: 420, visible: false });
        const step = s.text('Step: $n = (n - 4) + 4$, one more 4-cent stamp.', { x: 680, y: 205, size: 30, width: 420, visible: false });
        const four = s.text('It reaches back 4, so we need 4 base cases: $12, 13, 14, 15$.', { x: 680, y: 320, size: 30, width: 420, color: C.blue, visible: false });
        const check = s.text('For $n \\ge 16$: $n - 4 \\ge 12$, so the IH applies.', { x: 680, y: 450, size: 30, width: 420, color: C.yellow, visible: false });
        return { rows, arcs, claim, step, four, check };
      },
      steps: [
        {
          say: 'Claim: every amount from twelve cents up can be paid with four-cent and five-cent stamps. The step is simple: to make $n${n}, make $n - 4${n minus four} and add one four-cent stamp. So each row reaches back four rows.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await s.all(...o.rows.slice(1).map((r, i) => r.num.fadeIn({ delay: i * 60 })));
            await o.step.fadeIn();
            for (const [j, row] of o.rows.slice(5).entries()) {
              if (j > 0) o.arcs[j - 1].recolor(C.faint);
              await s.all(o.arcs[j].draw({ duration: 500 }), row.expr.write({ duration: 600 }));
            }
            o.arcs[3].recolor(C.faint);
          },
        },
        {
          say: 'But the step from $n${n} only works if $n - 4${n minus four} is already covered. Twelve, thirteen, fourteen and fifteen have nothing four rows back, so they are four base cases, each checked by hand.',
          do: async (s, o) => {
            await o.four.fadeIn();
            await s.stagger(o.rows.slice(1, 5).map((r) => () => r.expr.write({ duration: 600 })), 450);
          },
        },
        {
          say: 'Check the step’s range: for $n \\ge 16${n at least sixteen}, $n - 4 \\ge 12${n minus four is at least twelve}, so the hypothesis applies. And eleven really is impossible, which is why the claim starts at twelve.',
          do: async (s, o) => {
            await o.check.fadeIn();
            await s.all(o.rows[0].num.fadeIn(), o.rows[0].expr.fadeIn());
            await s.ring(s.group(o.rows[0].num, o.rows[0].expr), { color: 'red', shape: 'box', pad: 8 });
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-postage',
      kind: 'blanks',
      title: 'The base cases',
      say: 'Fill in the four base cases of the stamp problem.',
      prompt: 'Write each base case as $4a + 5b$ with $a, b \\ge 0$.',
      lines: BASES.map((r) => {
        const blankA = r.n <= 13;
        return blankA
          ? [`${r.n} = 4 \\cdot `, { id: `a${r.n}`, answer: { type: 'number', value: r.rep.a } }, `{} + 5 \\cdot ${r.rep.b}`]
          : [`${r.n} = 4 \\cdot ${r.rep.a} + 5 \\cdot `, { id: `b${r.n}`, answer: { type: 'number', value: r.rep.b } }];
      }),
      solution: [
        BASES.map((r) => `$${r.n} = 4 \\cdot ${r.rep.a} + 5 \\cdot ${r.rep.b}$`).join(', ') + '.',
        'Each base case is a direct check. There are four because the step reaches back four: $n = (n - 4) + 4$.',
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fibonacci',
      title: 'Recursive definitions',
      scene(s) {
        const def = s.defCard({ y: 74, width: 880, title: false, tex: 'F_1 = F_2 = 1, \\qquad F_n = F_{n-1} + F_{n-2} \\ \\ (n \\ge 3)', size: 34, visible: false });
        const U = 30, bb = SQUARES.bb;
        const ox = 245 - ((bb.x0 + bb.x1) / 2) * U, oy = 300 - ((bb.y0 + bb.y1) / 2) * U;
        const cols = [C.blue, C.teal, C.orange, C.purple, C.blue, C.teal];
        const fills = [FILL.blue, FILL.teal, FILL.orange, FILL.purple, FILL.blue, FILL.teal];
        const sq = SQUARES.squares.map((q, i) => ({
          r: s.rect(ox + q.x * U, oy + q.y * U, q.s * U, q.s * U, { color: cols[i], fill: fills[i], width: 2.5, radius: 3, visible: false }),
          t: s.tex(String(q.s), { x: ox + (q.x + q.s / 2) * U, y: oy + (q.y + q.s / 2) * U, size: q.s === 1 ? 30 : 36, visible: false }),
        }));
        const terms = s.tex(`${FIB.slice(0, 7).join(',\\ ')},\\ \\dots`, { x: 245, y: 470, size: 36, visible: false });
        const claim = s.text('**Claim.** $F_n < 2^n$ for all $n \\in \\mathbb{N}$.', { x: 700, y: 170, size: 32, visible: false });
        const b1 = s.tex(`F_1 = ${FIB[0]} < 2, \\quad F_2 = ${FIB[1]} < 4`, { x: 700, y: 222, size: 34, color: C.blue, visible: false });
        const LX = 520;
        const s1 = s.tex('F_{k+1} = \\part{a}{F_k} + \\part{b}{F_{k-1}}', { x: LX, y: 330, size: 36, anchor: [0, 0.5], visible: false });
        const s2 = s.tex('\\phantom{F_{k+1}} < 2^k + 2^{k-1}', { x: LX, y: 395, size: 36, anchor: [0, 0.5], visible: false });
        const s3 = s.tex('\\phantom{F_{k+1}} < 2^k + 2^k = 2^{k+1}', { x: LX, y: 460, size: 36, anchor: [0, 0.5], visible: false });
        const kk = s.text('Step: let $k \\ge 2$; IH for $k$ and $k - 1$.', { x: 680, y: 274, size: 30, color: C.blue, visible: false });
        const two = s.text('two earlier cases, so two base cases', { x: 680, y: 540, size: 30, color: C.yellow, visible: false });
        return { def, sq, terms, claim, b1, kk, s1, s2, s3, two };
      },
      steps: [
        {
          say: 'A recursive definition is itself an induction. The Fibonacci numbers start with $F_1 = F_2 = 1${F one equals F two equals one}, and each later one is the sum of the two before it: one, one, two, three, five, eight.',
          do: async (s, o) => {
            await o.def.reveal();
            for (const q of o.sq) await s.all(q.r.fadeIn({ shift: [0, 0], duration: 450 }), q.t.fadeIn({ duration: 450 }));
            await o.terms.write({ duration: 900 });
          },
        },
        {
          say: 'Let’s prove $F_n < 2^n${F n is less than two to the n}. Because each term looks back two places, we need two base cases: $F_1 = 1 < 2${F one is one, less than two}, and $F_2 = 1 < 4${F two is one, less than four}.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await o.b1.write({ duration: 900 });
          },
        },
        {
          say: 'For the step, let $k \\ge 2${k be at least two}, so that $k - 1${k minus one} is still at least one. Then $F_{k+1} = F_k + F_{k-1}${F k plus one equals F k plus F k minus one}, and the hypothesis is used twice, for $k${k} and for $k - 1${k minus one}: that is strong induction. The sum is less than $2^k + 2^k = 2^{k+1}${two to the k plus two to the k, which is two to the k plus one}.',
          do: async (s, o) => {
            await o.kk.fadeIn();
            await o.s1.write({ duration: 700 });
            await s.all(o.s1.color('a', C.blue), o.s1.color('b', C.blue));
            await o.s2.write({ duration: 700 });
            await o.s3.write({ duration: 800 });
            await o.two.fadeIn();
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'try-fib',
      kind: 'try',
      title: 'Compute',
      say: 'Quick computation: what is the tenth Fibonacci number?',
      prompt: 'With $F_1 = F_2 = 1$ and $F_n = F_{n-1} + F_{n-2}$, what is $F_{10}$?',
      answer: { type: 'number', value: FIB[9] },
      hint: 'Just keep adding the last two terms.',
      solution: [`$${FIB.join(', ')}$: so $F_{10} = ${FIB[9]}$.`],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'minimal-counterexample',
      title: 'Minimal counterexamples',
      scene(s) {
        const claim = s.text('**Claim.** Every integer $n \\ge 2$ has a prime divisor.', { y: 48, size: 32, visible: false });
        const nl = s.numberLine({ x: 480, y: 124, width: 760, range: [0, 11], ticks: 1, labels: false, size: 30, visible: false });
        const p = s.proof({ y: 166, width: 880, height: 370, size: 30, whyWidth: 180 });
        const tag = s.text('the fact Euclid’s proof (lecture 7) borrowed from here', { x: 480, y: 554, size: 30, color: C.yellow, italic: true, visible: false });
        return { claim, nl, p, tag };
      },
      steps: [
        {
          say: 'Here is another way to write a strong-induction argument. Suppose the claim fails. Then, by well-ordering, there is a smallest counterexample: call it $m${m}.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await o.nl.fadeIn();
            await o.p.add('**Proof.** Suppose some $n \\ge 2$ has no prime factor.', { kind: 'assume', why: 'assume not' });
            o.mpt = o.nl.point(8, { color: 'red', label: 'm' });
            await o.mpt;
            await o.p.add('Let $m$ be the least such integer.', { why: 'well-ordering' });
          },
        },
        {
          say: 'Now use the fact that everything smaller than $m${m} works. $m${m} isn’t prime, since a prime divides itself, so $m = ab${m equals a b} with $1 < a < m${a between one and m}. And $a${a}, being smaller, has a prime divisor $p${p}.',
          do: async (s, o) => {
            o.good = [2, 3, 4, 5, 6, 7].map((v) => o.nl.point(v, { color: 'green', label: v === 4 ? 'a' : v === 2 ? '2' : undefined }));
            await Promise.all(o.good);
            await o.p.add('$m$ is not prime, so $m = ab$ with $1 < a < m$.', { why: '$m \\mid m$' });
            o.use = o.p.add('$2 \\le a < m$, so $a$ has a prime divisor $p$.', { why: '$m$ least' });
            await o.use;
            await o.p.highlight(o.use, 'yellow');
          },
        },
        {
          say: 'But $p${p} divides $a${a}, and $a${a} divides $m${m}, so $p${p} divides $m${m}: a contradiction. It’s the same logic as strong induction, written as a contradiction, and it proves the fact that Euclid’s proof in lecture seven borrowed.',
          do: async (s, o) => {
            await o.p.add('Then $p \\mid m$; but $m$ has none.', { kind: 'contradiction', why: '$p \\mid a \\mid m$' });
            await o.p.qed();
            await o.tag.fadeIn();
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'strong-pitfalls',
      title: 'A broken strong induction',
      scene(s) {
        const claim = s.text('**“Claim.”** $5n = 0$ for all $n \\ge 0$.', { y: 50, size: 32, color: C.red, visible: false });
        const X = 70;
        const l1 = s.text('Base: $5 \\cdot 0 = 0$. ✓', { x: X, y: 115, size: 32, anchor: [0, 0.5], visible: false });
        const l2 = s.text('Step: write $k + 1 = i + j$ with $0 \\le i, j \\le k$.', { x: X, y: 180, size: 32, anchor: [0, 0.5], visible: false });
        const l3 = s.text('By the strong IH, $5(k + 1) = 5i + 5j = 0 + 0 = 0$.', { x: X, y: 245, size: 32, anchor: [0, 0.5], visible: false });
        const k0 = s.tex('k = 0:\\quad k + 1 = 1 = i + j \\ \\text{ with } \\ i, j \\in \\{0\\}\\ ?', { x: 480, y: 318, size: 34, color: C.red, visible: false });
        const k0b = s.tex('0 + 0 = 0 \\ne 1 \\quad \\Rightarrow \\quad \\text{no such } i, j', { x: 480, y: 374, size: 34, color: C.red, visible: false });
        const st = s.stamp('step fails at $k = 0$', { x: 770, y: 457, size: 30 });
        const lesson = s.text('Check the step at the first few $k$, and have enough base cases.', { x: 480, y: 546, size: 30, color: C.green, visible: false });
        return { claim, l1, l2, l3, k0, k0b, st, lesson };
      },
      steps: [
        {
          say: 'Here is a “proof” that five times every number is zero. The base case checks. The step splits $k + 1${k plus one} into two smaller pieces and applies the strong hypothesis to both. What went wrong?',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await o.l1.fadeIn();
            await o.l2.write({ duration: 900 });
            await o.l3.write({ duration: 900 });
          },
        },
        {
          say: 'The step must work for every $k${k}, including the smallest one. At $k = 0${k equals zero} we need $1 = i + j${one equals i plus j} with $i${i} and $j${j} both zero. That decomposition doesn’t exist.',
          do: async (s, o) => {
            await o.l2.indicate({ color: C.yellow });
            await o.k0.write({ duration: 900 });
            await o.k0b.write({ duration: 900 });
            await s.strike(o.l2);
            await o.st.slam();
          },
        },
        {
          say: 'So $P(1)${P of one} is never proved, and indeed five is not zero. The lesson: check the step at the first few values of $k${k}, and make sure you have enough base cases.',
          do: (s, o) => o.lesson.fadeIn(),
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-strong',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper and write a strong induction proof of your own. Decide first how far back your step reaches.',
      prompt: 'Use strong induction to prove that every integer $n \\ge 8$ can be written as $3a + 5b$ with $a, b \\in \\mathbb{Z}_{\\ge 0}$.',
      answer: { type: 'proof' },
      hints: ['Step back by $3$: $k + 1 = (k - 2) + 3$.', 'How many base cases does a step of $3$ need?'],
      solution: [
        '**Proof.** We proceed by strong induction on $n \\ge 8$.',
        `**Base cases.** $8 = 3 \\cdot ${stamps(8, 3, 5).a} + 5 \\cdot ${stamps(8, 3, 5).b}$, $9 = 3 \\cdot ${stamps(9, 3, 5).a} + 5 \\cdot ${stamps(9, 3, 5).b}$, $10 = 3 \\cdot ${stamps(10, 3, 5).a} + 5 \\cdot ${stamps(10, 3, 5).b}$.`,
        '**Inductive step.** Let $k \\ge 10$ and suppose every $j$ with $8 \\le j \\le k$ can be written as $3a + 5b$ with $a, b \\ge 0$. Since $k \\ge 10$, we have $8 \\le k - 2 \\le k$, so $k - 2 = 3a + 5b$ for some $a, b \\in \\mathbb{Z}_{\\ge 0}$. Then $k + 1 = (k - 2) + 3 = 3(a + 1) + 5b$, with $a + 1, b \\ge 0$.',
        'By strong induction, every $n \\ge 8$ can be written as $3a + 5b$ with $a, b \\in \\mathbb{Z}_{\\ge 0}$. ∎',
      ],
      rubric: [
        'Three base cases $8$, $9$, $10$ verified.',
        'Strong IH stated over the right range ($8 \\le j \\le k$, with $k \\ge 10$).',
        'Checks that $k - 2 \\ge 8$, so the IH applies to $k - 2$.',
        'Produces nonnegative coefficients for $k + 1$: $3(a + 1) + 5b$.',
        'Concluding sentence.',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-recurrence',
      kind: 'workout',
      title: 'Compute a term',
      say: 'Now a computation with a recurrence: find the sixth term.',
      prompt: REC_ITEM.prompt,
      answer: REC_ITEM.answer,
      hints: REC_ITEM.hints,
      solution: [
        ...REC_ITEM.solution,
        `(By strong induction one can prove $a_n = \\tfrac{2^{n+1} + (-1)^n}{3}$; check $n = 6$: $(128 + 1)/3 = ${CLOSED6}$.)`,
      ],
      generate: (rand) => {
        const d = { a1: rand.int(1, 5), a2: rand.int(1, 5), c1: rand.int(1, 3), c2: rand.int(1, 3) };
        const { prompt, answer, hints, solution } = recItem(d);
        return { prompt, answer, hints, solution };
      },
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-strong',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Explain in your own words when you need strong induction, and why it is not really a stronger principle.',
      prompt: 'When do you need strong induction instead of ordinary induction, and why is it not actually a stronger principle?',
      points: [
        'When the step for $k + 1$ uses cases further back than $k$: factorizations, recurrences, stepping back by more than 1.',
        'The number of base cases matches how far back the step reaches.',
        'Applying ordinary induction to $Q(n) = P(1) \\land \\cdots \\land P(n)$ gives strong induction.',
        'Both are equivalent to the well-ordering principle (minimal counterexamples).',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Strong IH: assume $P(j)$ for every $j \\le k$, then prove $P(k + 1)$.', 130),
          recapItem(s, '• As many base cases as the step reaches back; recurrences; minimal counterexamples.', 250),
          recapItem(s, 'Next: the integers, starting with division with remainder.', 400, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'In strong induction the hypothesis is every earlier case, $P(j)${P of j} for all $j${j} up to $k${k}, and it proves exactly the same theorems as ordinary induction.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Give yourself as many base cases as the step reaches back, use it for recurrences, and remember the minimal-counterexample form.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time we turn to the integers themselves, starting with division with remainder.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
