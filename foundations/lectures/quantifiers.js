/**
 * Lecture 3 · Predicates and quantifiers (foundations/PLAN.md § 3). Irani · Logic.
 *
 * Choreography: a predicate is a sentence with a hole, plugged into on a number line; "for all" unfolds into a
 * row of ∧'s whose pieces light up one by one, "there exists" into a row of ∨'s scanned until the witness;
 * negation is shown by the ¬ physically sliding past the quantifier as it flips; the n² + n + 41 table runs
 * green until n = 40; translations ring the connective that pairs with each quantifier.
 */
import { C } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, not typed)

const isPrime = (n) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** universal: n² ≤ 16 over {1,…,4}, then 5 added. */
const UNIV = range(1, 5).map((n) => ({ n, sq: n * n, ok: n * n <= 16 }));
/** existential: n² = n + 6 over ℕ; the first witness. */
const EXIST = range(1, 4).map((n) => ({ n, l: n * n, r: n + 6, ok: n * n === n + 6 }));
const WITNESS = EXIST.find((e) => e.ok).n;
/** Euler's polynomial: the first n ∈ ℕ where n² + n + 41 is not prime. */
const euler = (n) => n * n + n + 41;
const FIRST_FAIL = range(1, 100).find((n) => !isPrime(euler(n)));
const FAIL_VAL = euler(FIRST_FAIL);
const FAIL_ROOT = Math.round(Math.sqrt(FAIL_VAL));
/** try-evaluate over ℤ, decided by brute force on a window that contains every interesting case. */
const ZWIN = range(-50, 50);
const EVAL = {
  a: ZWIN.every((x) => x * x >= x),
  b: ZWIN.some((x) => x * x === 2),
  c: ZWIN.some((x) => x * x < x),
  d: ZWIN.every((x) => x * x > 0),
};
const EVAL_TRUE = Object.keys(EVAL).filter((k) => EVAL[k]);
/** wo-disprove: the smallest positive counterexample to 6 | n → 4 | n. */
const DISPROVE = range(1, 100).find((n) => n % 6 === 0 && n % 4 !== 0);

// ---------------------------------------------------------------- local helpers

/** Colors parts of a Tex immediately (scene state). */
function paintParts(tex, parts) {
  for (const [name, color] of Object.entries(parts)) for (const e of tex.part(name)) e.style.color = color;
}

/** Center x of a mob. */
const cx = (m) => m.box().cx;

/** A row of the recap list, hidden. */
const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/**
 * ¬Q x, P(x) → Q' x, ¬P(x): on `from` (pieces ¬, quantifier, predicate) toward the hidden layout `to`
 * (quantifier', ¬, predicate): the ¬ slides right past the quantifier, which flips as it is passed.
 */
async function pushNeg(s, from, to, flipped) {
  const [neg, q, pred] = from;
  await neg.recolor(C.yellow);
  await s.all(
    neg.moveTo(to[1].x, to[1].y, { duration: 1000 }),
    q.moveTo(to[0].x, to[0].y, { duration: 1000 }),
    pred.moveTo(to[2].x, to[2].y, { duration: 1000 }),
  );
  await q.swap(flipped);
  await s.all(q.recolor(C.yellow), neg.recolor(C.ink, { delay: 300 }));
}

// ---------------------------------------------------------------- lecture

export default {
  id: 'quantifiers',
  title: 'Predicates and quantifiers',
  goals: [
    'Evaluate predicates and quantified statements over a stated domain',
    'Prove an existential statement with a witness, disprove a universal statement with a counterexample',
    'Negate quantified statements (De Morgan’s laws for quantifiers), including restricted quantifiers',
    'Translate English with “every”, “some”, “no” into symbols, avoiding the $\\forall\\land$ and $\\exists\\to$ traps',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'predicates',
      title: 'Sentences with holes',
      scene(s) {
        const P = s.tex('P(x)\\colon\\ \\part{x}{x} > 3', { y: 70, size: 48, visible: false });
        const nl = s.numberLine({ x: 480, y: 300, width: 760, range: [-2, 8], size: 32, visible: false });
        const yes = s.tex('P(5)\\colon\\ 5 > 3 \\ \\checkmark', { x: 260, y: 420, size: 36, color: C.green, visible: false });
        const no = s.tex('P(1)\\colon\\ 1 > 3 \\ \\text{is false}', { x: 690, y: 420, size: 36, color: C.red, visible: false });
        const dom = s.text('Domain: $\\mathbb{R}$, the values $x$ is allowed to take.', { y: 510, size: 30, color: C.blue, visible: false });
        const nat = s.tex('\\mathbb{N} = \\{1, 2, 3, \\dots\\}', { y: 420, size: 44, color: C.teal, visible: false });
        const natNote = s.text('In this course $0 \\notin \\mathbb{N}$. Write $\\mathbb{Z}_{\\ge 0}$ when you want $0$.', { y: 510, size: 30, color: C.muted, visible: false });
        return { P, nl, yes, no, dom, nat, natNote };
      },
      steps: [
        {
          say: 'A predicate is a sentence with a hole in it. $P(x)${P of x}: $x > 3${x is greater than three} is neither true nor false until we fill in the hole.',
          do: async (s, o) => {
            await o.P.write({ duration: 900 });
            await s.ring([o.P, 'x'], { color: C.yellow, shape: 'box', pad: 3 });
            await o.nl.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'Plug in a value and it becomes a proposition. $P(5)${P of five} is true; $P(1)${P of one} is false.',
          do: async (s, o) => {
            o.p5 = o.nl.point(5, { color: 'green', label: 'P(5)' });
            await o.p5;
            await o.yes.fadeIn();
            o.p1 = o.nl.point(1, { color: 'red', label: 'P(1)' });
            await o.p1;
            await o.no.fadeIn();
          },
        },
        {
          say: 'The values that make it true form a region of the line. Which values we may plug in at all is the domain, and we always state it.',
          do: async (s, o) => {
            o.ray = o.nl.interval(3, Infinity, { openA: true, color: 'green' });
            await o.ray;
            await o.dom.fadeIn();
          },
        },
        {
          say: 'One convention to fix now: in this course, $\\mathbb{N} = \\{1, 2, 3, \\dots\\}${N, the natural numbers, is one, two, three, and so on}. Zero is not a natural number here.',
          do: async (s, o) => {
            await s.all(o.p5.fadeOut(), o.p1.fadeOut(), o.ray.fadeOut(), o.yes.fadeOut(), o.no.fadeOut(), o.dom.fadeOut());
            o.zero = o.nl.point(0, { color: 'red', open: true });
            o.seq = o.nl.sequence((n) => n, 8, { color: 'teal', trail: false, gap: 140 });
            await s.all(o.zero, o.seq);
            await o.nat.write({ duration: 800 });
            await o.natNote.fadeIn();
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'universal',
      title: 'For all',
      scene(s) {
        const stmt = s.tex('\\forall n \\in \\{1, 2, 3, 4\\},\\ n^2 \\le 16', { y: 58, size: 44, visible: false });
        const pDef = s.tex('P(n)\\colon\\ n^2 \\le 16', { y: 113, size: 30, color: C.muted, visible: false });
        const pieces = [];
        UNIV.forEach(({ n }, i) => {
          if (i) pieces.push('\\;\\land\\;');
          pieces.push(`P(${n})`);
        });
        const row = s.symbols(pieces, { y: 170, size: 44, visible: false });
        const Ps = row.filter((_, i) => i % 2 === 0);
        const checks = UNIV.map(({ sq, ok }, i) => s.tex(`${sq} ${ok ? '\\le' : '\\not\\le'} 16`, { x: Ps[i].box().cx, y: 232, size: 30, color: ok ? C.green : C.red, visible: false }));
        const fstamp = s.stamp('F', { x: 870, y: 66, color: C.red, size: 36 });
        const inf = s.tex('\\forall x \\in \\mathbb{R},\\ x^2 \\ge 0', { y: 345, size: 44, visible: false });
        const infRow = s.tex('Q(0.5) \\land Q(-3) \\land Q(\\pi) \\land Q(10^6) \\land \\cdots', { y: 420, size: 34, color: C.muted, visible: false });
        const infNote = s.text('No list finishes: we need an argument for an **arbitrary** $x$.', { y: 500, size: 30, color: C.blue, visible: false });
        return { stmt, pDef, row, Ps, checks, fstamp, inf, infRow, infNote };
      },
      steps: [
        {
          say: 'Over a finite domain, “for all” is just a big “and”. Call $n^2 \\le 16${n squared is at most sixteen} P of n. For all $n${n} in one to four, P of n means P of one, and P of two, and P of three, and P of four.',
          do: async (s, o) => {
            await o.stmt.write({ duration: 1000 });
            await o.pDef.fadeIn();
            await s.all(o.row.slice(0, 7).map((m, i) => m.fadeIn({ shift: [0, -40], delay: i * 90 })));
            for (let i = 0; i < 4; i++) await s.all(o.checks[i].fadeIn({ shift: [0, -8] }), o.Ps[i].recolor(C.green));
          },
        },
        {
          say: 'Over an infinite domain like the reals we can’t check every case. Call $x^2 \\ge 0${x squared is at least zero} Q of x: the list of instances never ends, so we need a proof that works for an arbitrary element.',
          do: async (s, o) => {
            await o.inf.write({ duration: 900 });
            await o.infRow.fadeIn({ shift: [-20, 0] });
            await o.infNote.fadeIn();
          },
        },
        {
          say: 'And one false conjunct makes the whole thing false. Add five to the domain: $25 \\le 16${twenty five is at most sixteen} fails, so the statement fails.',
          do: async (s, o) => {
            await o.stmt.swap('\\forall n \\in \\{1, 2, 3, 4, 5\\},\\ n^2 \\le 16');
            await s.all(o.row[7].fadeIn({ shift: [0, -40] }), o.row[8].fadeIn({ shift: [0, -40], delay: 120 }));
            await s.all(o.checks[4].fadeIn({ shift: [0, -8] }), o.row[8].recolor(C.red));
            await o.fstamp.slam();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'existential',
      title: 'There exists',
      scene(s) {
        const stmt = s.tex('\\exists n \\in \\mathbb{N},\\ n^2 = n + 6', { y: 58, size: 44, visible: false });
        const pDef = s.tex('P(n)\\colon\\ n^2 = n + 6', { y: 113, size: 30, color: C.muted, visible: false });
        const pieces = [];
        EXIST.forEach(({ n }, i) => {
          if (i) pieces.push('\\;\\lor\\;');
          pieces.push(`P(${n})`);
        });
        pieces.push('\\;\\lor\\;', '\\cdots');
        const row = s.symbols(pieces, { y: 170, size: 44, visible: false });
        const Ps = EXIST.map((_, i) => row[2 * i]);
        const checks = EXIST.map(({ l, r, ok }, i) => s.tex(`${l} ${ok ? '=' : '\\ne'} ${r}`, { x: Ps[i].box().cx, y: 232, size: 30, color: ok ? C.green : C.red, visible: false }));
        const wi = EXIST.findIndex((e) => e.ok);
        const wLabel = s.text('witness', { x: Ps[wi].box().cx, y: 300, size: 30, color: C.green, weight: 600, visible: false });
        const proof = s.text(`**Proof.** Take $n = ${WITNESS}$, a natural number. Then $${WITNESS}^2 = ${WITNESS * WITNESS} = ${WITNESS} + 6$. $\\blacksquare$`, { y: 420, size: 32, width: 820, visible: false });
        const note = s.text('One witness, named and checked: that is the whole proof.', { y: 500, size: 30, color: C.muted, visible: false });
        return { stmt, pDef, row, Ps, checks, wi, wLabel, proof, note };
      },
      steps: [
        {
          say: '“There exists” is a big “or”. Call $n^2 = n + 6${n squared equals n plus six} P of n. There is a natural number $n${n} with P of n means P of one, or P of two, or P of three, and so on.',
          do: async (s, o) => {
            await o.stmt.write({ duration: 1000 });
            await o.pDef.fadeIn();
            await s.all(o.row.map((m, i) => m.fadeIn({ shift: [0, -40], delay: i * 90 })));
          },
        },
        {
          say: 'An “or” only needs one true piece. Scan: one fails, two fails, and three works, since $3^2 = 9${three squared is nine} and $3 + 6 = 9${three plus six is nine}. Three is a witness.',
          do: async (s, o) => {
            for (let i = 0; i < o.wi; i++) await s.all(o.checks[i].fadeIn({ shift: [0, -8] }), o.Ps[i].recolor(C.muted));
            await s.all(o.checks[o.wi].fadeIn({ shift: [0, -8] }), o.Ps[o.wi].recolor(C.green));
            await s.ring(o.Ps[o.wi], { color: C.green, shape: 'box' });
            await o.wLabel.fadeIn({ shift: [0, -8] });
          },
        },
        {
          say: 'So to prove an existence statement, produce a witness and check it. Naming $n = 3${n equals three} and checking it is a complete proof.',
          do: async (s, o) => {
            await o.proof.write({ duration: 1200 });
            await o.note.fadeIn();
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-evaluate',
      kind: 'try',
      title: 'True over the integers?',
      say: 'Your turn. The domain is the integers. Try zero, a negative number and a positive number on each one.',
      prompt: 'The domain is $\\mathbb{Z}$. Which statements are true? Select all.',
      answer: { type: 'multi', value: EVAL_TRUE },
      choices: [
        { id: 'a', label: '$\\forall x,\\ x^2 \\ge x$', why: 'True: for $x \\le 0$, $x^2 \\ge 0 \\ge x$; for $x \\ge 1$, $x^2 = x \\cdot x \\ge x$.' },
        { id: 'b', label: '$\\exists x,\\ x^2 = 2$', why: 'False: $\\sqrt 2$ is not an integer.' },
        { id: 'c', label: '$\\exists x,\\ x^2 < x$', why: 'False: that needs $0 < x < 1$, and no integer lies there.' },
        { id: 'd', label: '$\\forall x,\\ x^2 > 0$', why: 'False: $x = 0$ is a counterexample.' },
      ],
      hint: 'Try $x = 0$, a negative integer and a positive integer.',
      solution: [
        '(a) is true: if $x \\le 0$ then $x^2 \\ge 0 \\ge x$, and if $x \\ge 1$ then $x^2 = x \\cdot x \\ge 1 \\cdot x = x$.',
        '(b) is false because $\\sqrt 2 \\notin \\mathbb{Z}$; (c) is false because $x^2 < x$ forces $0 < x < 1$; (d) is false at $x = 0$.',
        'Over $\\mathbb{R}$ the answers change: (a) fails at $x = \\tfrac12$ and (c) becomes true. The domain is part of the statement.',
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'domain-matters',
      title: 'The domain is part of the statement',
      scene(s) {
        const fQ = s.tex('\\exists x \\in \\part{d}{\\mathbb{Q}},\\ x^2 = 2', { x: 250, y: 75, size: 40, visible: false });
        const fR = s.tex('\\exists x \\in \\part{d}{\\mathbb{R}},\\ x^2 = 2', { x: 710, y: 75, size: 40, visible: false });
        const sQ = s.stamp('F', { x: 250, y: 145, color: C.red, size: 34 });
        const sR = s.stamp('T', { x: 710, y: 145, color: C.green, size: 34 });
        const wQ = s.text('$\\sqrt 2$ is irrational', { x: 250, y: 205, size: 30, color: C.red, visible: false });
        const wR = s.text('witness: $x = \\sqrt 2$', { x: 710, y: 205, size: 30, color: C.green, visible: false });
        const nl = s.numberLine({ x: 480, y: 320, width: 600, range: [-2, 2], size: 32, visible: false });
        const eA = s.tex('\\forall x \\in \\varnothing,\\ P(x)', { x: 250, y: 450, size: 36, visible: false });
        const eE = s.tex('\\exists x \\in \\varnothing,\\ P(x)', { x: 710, y: 450, size: 36, visible: false });
        const sA = s.stamp('T: vacuous', { x: 250, y: 520, color: C.green, size: 30 });
        const sE = s.stamp('F: no witness', { x: 710, y: 520, color: C.red, size: 30 });
        return { fQ, fR, sQ, sR, wQ, wR, nl, eA, eE, sA, sE };
      },
      steps: [
        {
          say: 'The same formula can be true over one domain and false over another. Is there an $x${x} with $x^2 = 2${x squared equals two}? Not among the rationals, since the square root of two is irrational. Among the reals, yes.',
          do: async (s, o) => {
            await s.all(o.fQ.write(), o.fR.write({ delay: 200 }));
            await o.sQ.slam();
            await o.wQ.fadeIn();
            await o.nl.fadeIn({ shift: [0, 0] });
            o.pt = o.nl.point(Math.SQRT2, { color: 'green', label: '√2' });
            await o.pt;
            await o.sR.slam();
            await o.wR.fadeIn();
          },
        },
        {
          say: 'So the domain is part of the statement. Always write it into the quantifier: there exists $x${x} in $\\mathbb{R}${R}.',
          do: (s, o) => s.all(s.ring([o.fQ, 'd'], { color: C.yellow, shape: 'box', pad: 4 }), s.ring([o.fR, 'd'], { color: C.yellow, shape: 'box', pad: 4 })),
        },
        {
          say: 'An edge case: over the empty domain, every “for all” is vacuously true, because nothing can fail, and every “there exists” is false, because there is no witness.',
          do: async (s, o) => {
            await s.all(o.eA.fadeIn(), o.eE.fadeIn({ delay: 200 }));
            await o.sA.slam();
            await o.sE.slam();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'negating',
      title: 'Negating quantifiers',
      scene(s) {
        const size = 44;
        const row = (list, x, y, visible = false) => s.symbols(list, { x, y, size, visible });
        const A = ['\\neg', '\\forall x,\\ ', 'P(x)'];
        const E = ['\\neg', '\\exists x,\\ ', 'P(x)'];
        const o = {
          l1: row(A, 250, 70),
          m1: row(A, 250, 70),
          r1: row(['\\exists x,\\ ', '\\neg', 'P(x)'], 710, 70),
          e1: s.tex('\\equiv', { x: 480, y: 70, size, visible: false }),
          l2: row(E, 250, 190),
          m2: row(E, 250, 190),
          r2: row(['\\forall x,\\ ', '\\neg', 'P(x)'], 710, 190),
          e2: s.tex('\\equiv', { x: 480, y: 190, size, visible: false }),
        };
        o.n1 = s.text('“not all” = “at least one fails”', { x: 480, y: 122, size: 30, color: C.muted, visible: false });
        o.n2 = s.text('“none” = “all fail”', { x: 480, y: 242, size: 30, color: C.muted, visible: false });
        o.ex = s.text('“Not every prime is odd” $\\equiv$ “Some prime is even”', { y: 318, size: 32, font: 'serif', visible: false });
        o.primes = [2, 3, 5, 7, 11, 13].filter(isPrime).map((p, i) => s.tex(String(p), { x: 300 + i * 72, y: 395, size: 40, visible: false }));
        o.ce = s.text('counterexample to “every prime is odd”', { x: 300, y: 450, size: 30, color: C.red, anchor: [0.2, 0.5], visible: false });
        o.rule = s.text('Push $\\neg$ inward; flip each quantifier it passes.', { y: 535, size: 32, color: C.blue, weight: 600, visible: false });
        return o;
      },
      steps: [
        {
          say: '“Not all” means “at least one fails”. Watch the not slide past the “for all”: as it passes, the quantifier flips to “there exists”.',
          do: async (s, o) => {
            await s.all(o.l1.map((m, i) => m.fadeIn({ delay: i * 80 })));
            await o.e1.fadeIn();
            o.m1.forEach((m) => m.show());
            await pushNeg(s, o.m1, o.r1, '\\exists x,\\ ');
            await o.n1.fadeIn();
          },
        },
        {
          say: '“None” means “all fail”: not, there exists $x${x} with $P(x)${P of x}, is the same as: for all $x${x}, not $P(x)${P of x}.',
          do: async (s, o) => {
            await s.all(o.l2.map((m, i) => m.fadeIn({ delay: i * 80 })));
            await o.e2.fadeIn();
            o.m2.forEach((m) => m.show());
            await pushNeg(s, o.m2, o.r2, '\\forall x,\\ ');
            await o.n2.fadeIn();
          },
        },
        {
          say: 'In English: “not every prime is odd” means “some prime is even”. And there is one: two.',
          do: async (s, o) => {
            await o.ex.fadeIn();
            await s.stagger(o.primes.map((m) => () => m.fadeIn({ shift: [0, 10] })), 120);
            await s.all(o.primes[0].recolor(C.red), s.ring(o.primes[0], { color: C.red, pad: 10 }));
            await o.ce.fadeIn();
          },
        },
        {
          say: 'Mechanically: push the not inward, and flip each quantifier it passes.',
          do: (s, o) => o.rule.fadeIn({ shift: [0, 12] }),
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-negation',
      kind: 'blanks',
      title: 'Negate it',
      say: 'Negate this one piece by piece: first the quantifier, then the conditional, then the inequality.',
      prompt: 'Complete the negation, with the $\\neg$ pushed all the way in.',
      lines: [
        ['\\neg\\big(\\forall x \\in \\mathbb{R},\\ (x > 0 \\to x^2 > x)\\big) \\equiv'],
        [
          { id: 'q', chips: ['\\forall', '\\exists'], answer: '\\exists', hint: 'The $\\neg$ flips the quantifier it passes.' },
          'x \\in \\mathbb{R},\\ x > 0',
          { id: 'op', chips: ['\\land', '\\lor', '\\to'], answer: '\\land', hint: '$\\neg(p \\to q) \\equiv p \\land \\neg q$.' },
          'x^2',
          { id: 'rel', chips: ['\\le', '<', '\\ge'], answer: '\\le', hint: 'The opposite of “greater than” is “at most”.' },
          'x',
        ],
      ],
      solution: [
        'Flip the quantifier: $\\neg \\forall x \\in \\mathbb{R}$ becomes $\\exists x \\in \\mathbb{R}$, and the domain stays.',
        'Negate the conditional: $\\neg(p \\to q) \\equiv p \\land \\neg q$, and $\\neg(x^2 > x)$ is $x^2 \\le x$.',
        'So the negation is $\\exists x \\in \\mathbb{R},\\ x > 0 \\land x^2 \\le x$. It is true: $x = \\tfrac12$ gives $\\tfrac14 \\le \\tfrac12$.',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'counterexample',
      title: 'One counterexample is enough',
      scene(s) {
        const claim = s.tex('\\forall n \\in \\mathbb{N},\\ n^2 + n + 41 \\text{ is prime}', { y: 60, size: 40, visible: false });
        const stF = s.stamp('F', { x: 880, y: 60, color: C.red, size: 36 });
        const hN = s.tex('n', { x: 225, y: 160, size: 34, anchor: [1, 0.5], color: C.muted, visible: false });
        const hV = s.tex('n^2 + n + 41', { x: 225, y: 230, size: 32, anchor: [1, 0.5], color: C.muted, visible: false });
        const xs = [290, 380, 470, 560, 650];
        const cols = xs.map((x, i) => ({
          n: s.tex(String(i + 1), { x, y: 160, size: 34, visible: false }),
          v: s.tex(String(euler(i + 1)), { x, y: 230, size: 34, color: isPrime(euler(i + 1)) ? C.green : C.red, visible: false }),
        }));
        const dots = s.tex('\\cdots', { x: 735, y: 195, size: 34, color: C.muted, visible: false });
        const last = {
          n: s.tex(String(FIRST_FAIL), { x: 835, y: 160, size: 34, color: C.red, visible: false }),
          v: s.tex(String(FAIL_VAL), { x: 835, y: 230, size: 34, color: C.red, visible: false }),
        };
        const allPrime = s.text(`$n = 1, 2, \\dots, ${FIRST_FAIL - 1}$: every value is prime`, { y: 310, size: 30, color: C.green, visible: false });
        const fact = s.tex(`${FAIL_VAL} = ${FAIL_ROOT} \\cdot ${FAIL_ROOT}`, { y: 390, size: 44, color: C.red, visible: false });
        const m1 = s.text('To **disprove** “for all”: one counterexample, checked.', { y: 480, size: 30, color: C.red, visible: false });
        const m2 = s.text('To **prove** one: an argument for an arbitrary $n$, never examples.', { y: 535, size: 30, color: C.blue, visible: false });
        return { claim, stF, hN, hV, cols, dots, last, allPrime, fact, m1, m2 };
      },
      steps: [
        {
          say: 'Here is a famous claim: for every natural number $n${n}, $n^2 + n + 41${n squared plus n plus forty one} is prime. Check: forty three, forty seven, fifty three, sixty one, seventy one. All prime.',
          do: async (s, o) => {
            await o.claim.write({ duration: 1000 });
            await s.all(o.hN.fadeIn(), o.hV.fadeIn());
            for (const c of o.cols) await s.all(c.n.fadeIn(), c.v.fadeIn({ shift: [0, -10], delay: 120 }));
          },
        },
        {
          say: 'Keep going, and it stays prime all the way up to thirty nine. Thirty nine examples in a row, and the statement is still false.',
          do: async (s, o) => {
            await o.dots.fadeIn();
            await o.allPrime.fadeIn();
          },
        },
        {
          say: 'At $n = 40${n equals forty} the value is $1681${sixteen eighty one}, which is forty one times forty one. One counterexample, verified explicitly, disproves the “for all”.',
          do: async (s, o) => {
            await s.all(o.last.n.fadeIn(), o.last.v.fadeIn({ shift: [0, -10], delay: 120 }));
            await o.fact.write({ duration: 900 });
            await o.stF.slam();
            await o.m1.fadeIn();
          },
        },
        {
          say: 'And the flip side: to prove a “for all”, examples are never enough. You need an argument for an arbitrary $n${n}.',
          do: (s, o) => o.m2.fadeIn(),
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'translation',
      title: 'From English to symbols',
      scene(s) {
        const key = s.text('$S(x)$: $x$ is a student  ·  $L(x)$: $x$ has a laptop', { y: 49, size: 30, color: C.muted, visible: false });
        const row = (eng, tex, y, color = C.ink) => ({
          eng: s.text(eng, { x: 60, y, size: 30, anchor: [0, 0.5], width: 420, align: 'left', color, visible: false }),
          sym: s.tex(tex, { x: 710, y, size: 36, color, visible: false }),
        });
        const all = row('“Every student has a laptop.”', '\\forall x\\,(S(x) \\part{op}{\\to} L(x))', 104);
        const allTrap = row('✗ “Everything is a student with a laptop.”', '\\forall x\\,(S(x) \\part{op}{\\land} L(x))', 174, C.red);
        const some = row('“Some student has a laptop.”', '\\exists x\\,(S(x) \\part{op}{\\land} L(x))', 252);
        const someTrap = row('✗ True as soon as one non-student exists.', '\\exists x\\,(S(x) \\part{op}{\\to} L(x))', 328, C.red);
        const none = row('“No student has a laptop.”', '\\forall x\\,(S(x) \\part{op}{\\to} \\neg L(x))', 404);
        const noneEq = s.tex('\\equiv \\neg\\exists x\\,(S(x) \\land L(x))', { x: 710, y: 460, size: 30, color: C.muted, visible: false });
        const short = s.text('Shorthand:', { x: 60, y: 530, size: 30, anchor: [0, 0.5], color: C.blue, weight: 600, visible: false });
        const rA = s.tex('\\forall x \\in S,\\ L(x)', { x: 420, y: 530, size: 36, visible: false });
        const rE = s.tex('\\exists x \\in S,\\ L(x)', { x: 710, y: 530, size: 36, visible: false });
        return { key, all, allTrap, some, someTrap, none, noneEq, short, rA, rE };
      },
      steps: [
        {
          say: '“Every student has a laptop” says: for every thing, if it is a student, then it has a laptop. “All” pairs with the arrow.',
          do: async (s, o) => {
            await o.key.fadeIn();
            await o.all.eng.fadeIn();
            await o.all.sym.write({ duration: 900 });
            await s.ring([o.all.sym, 'op'], { color: C.green, shape: 'box', pad: 4 });
          },
        },
        {
          say: 'Here’s the trap: with “and” instead, it says every thing in the universe is a student with a laptop. That is a far stronger, and false, statement.',
          do: async (s, o) => {
            await o.allTrap.sym.write({ duration: 900 });
            await s.ring([o.allTrap.sym, 'op'], { color: C.red, shape: 'box', pad: 4 });
            await o.allTrap.eng.fadeIn();
          },
        },
        {
          say: '“Some student has a laptop” says: some thing is a student and has a laptop. “Some” pairs with “and”.',
          do: async (s, o) => {
            await o.some.eng.fadeIn();
            await o.some.sym.write({ duration: 900 });
            await s.ring([o.some.sym, 'op'], { color: C.green, shape: 'box', pad: 4 });
          },
        },
        {
          say: 'The opposite trap: with an arrow, it is true as soon as one thing is not a student, because a false hypothesis makes the arrow true.',
          do: async (s, o) => {
            await o.someTrap.sym.write({ duration: 900 });
            await s.ring([o.someTrap.sym, 'op'], { color: C.red, shape: 'box', pad: 4 });
            await o.someTrap.eng.fadeIn();
          },
        },
        {
          say: '“No student has a laptop” says: for every thing, if it is a student, then it does not have a laptop. That is the same as: there is no student with a laptop.',
          do: async (s, o) => {
            await o.none.eng.fadeIn();
            await o.none.sym.write({ duration: 900 });
            await s.ring([o.none.sym, 'op'], { color: C.green, shape: 'box', pad: 4 });
            await o.noneEq.fadeIn({ shift: [0, -8] });
          },
        },
        {
          say: 'Restricted quantifiers hide the pairing: for all $x${x} in $S${S}, and there exists $x${x} in $S${S}. They are the safest way to write both.',
          do: async (s, o) => {
            await o.short.fadeIn();
            await s.all(o.rA.write(), o.rE.write({ delay: 300 }));
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'try-translate',
      kind: 'try',
      title: 'Translate',
      say: 'Translate this sentence into symbols. Watch which way the inequality goes, and which connective goes with “some”.',
      prompt: 'Which symbolizes “Some real number is larger than its square”?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '$\\exists x \\in \\mathbb{R},\\ x > x^2$', why: 'Right: “some” is $\\exists$, the domain is restricted to $\\mathbb{R}$, and “$x$ is larger than its square” is $x > x^2$.' },
        { id: 'b', label: '$\\forall x \\in \\mathbb{R},\\ x > x^2$', why: '“Some” is not “all”.' },
        { id: 'c', label: '$\\exists x \\in \\mathbb{R},\\ x^2 > x$', why: 'The inequality is reversed: that says the square is larger.' },
        { id: 'd', label: '$\\exists x\\,(x \\in \\mathbb{R} \\to x > x^2)$', why: 'The $\\exists\\to$ trap: this is true as soon as anything is not a real number.' },
      ],
      hint: '“Some” pairs with “and”, or with a restricted quantifier.',
      solution: [
        '(a): $\\exists x \\in \\mathbb{R},\\ x > x^2$.',
        'It is true, for example $x = \\tfrac12$: $\\tfrac12 > \\tfrac14$.',
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'restricted-negation',
      title: 'Negating restricted quantifiers',
      scene(s) {
        const p = s.proof({ y: 36, height: 270, size: 34, numbered: false });
        const short = s.tex('\\neg\\big(\\forall x \\in \\part{d1}{S},\\ L(x)\\big) \\equiv \\exists x \\in \\part{d2}{S},\\ \\neg L(x)', { y: 360, size: 40, visible: false });
        const good = s.text('“Some **student** lacks a laptop.”', { y: 450, size: 32, color: C.green, visible: false });
        const bad = s.text('“Something lacks a laptop.”', { y: 520, size: 32, color: C.red, visible: false });
        return { p, short, good, bad };
      },
      steps: [
        {
          say: 'Let’s negate “every student has a laptop” carefully. First the not passes the “for all”, which flips to “there exists”.',
          do: async (s, o) => {
            await o.p.add('\\neg \\forall x\\,(S(x) \\to L(x))', { tex: true, why: 'start', kind: 'assume' });
            await o.p.add('\\equiv \\exists x\\,\\neg(S(x) \\to L(x))', { tex: true, why: 'negate $\\forall$' });
          },
        },
        {
          say: 'Then negate the conditional: it becomes $S(x) \\land \\neg L(x)${S of x and not L of x}. Some student lacks a laptop.',
          do: (s, o) => o.p.add('\\equiv \\exists x\\,(S(x) \\land \\neg L(x))', { tex: true, why: 'negated $\\to$', kind: 'conclude' }),
        },
        {
          say: 'With restricted quantifiers it is shorter. The domain stays exactly as it was; only the quantifier flips and the predicate is negated.',
          do: async (s, o) => {
            await o.short.write({ duration: 1100 });
            await s.all(s.ring([o.short, 'd1'], { color: C.yellow, shape: 'box', pad: 4 }), s.ring([o.short, 'd2'], { color: C.yellow, shape: 'box', pad: 4 }));
          },
        },
        {
          say: 'So the negation is “some student lacks a laptop”, not “something lacks a laptop”. A chair without a laptop says nothing about students.',
          do: async (s, o) => {
            await o.good.fadeIn();
            await o.bad.fadeIn();
            await s.strike(o.bad);
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-disprove',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Disprove this statement: write its negation first, then prove the negation.',
      prompt: 'Disprove: “For every integer $n$, if $6 \\mid n$ then $4 \\mid n$.” Write the negation first, then prove the negation.',
      answer: { type: 'proof' },
      hints: ['The negation is an existential statement. What does it ask you to produce?', 'Try the smallest positive multiple of $6$.'],
      solution: [
        'The negation is $\\exists n \\in \\mathbb{Z},\\ 6 \\mid n \\land 4 \\nmid n$.',
        `**Proof.** Take $n = ${DISPROVE}$. Then $${DISPROVE} = 6 \\cdot ${DISPROVE / 6}$ with $${DISPROVE / 6} \\in \\mathbb{Z}$, so $6 \\mid ${DISPROVE}$. But $4 \\nmid ${DISPROVE}$, since $${DISPROVE}/4 = 3/2$ is not an integer. So $n = ${DISPROVE}$ is a counterexample, and the original statement is false. ∎`,
      ],
      rubric: [
        'States the negation correctly: $\\exists$, with “and”, and the conclusion negated.',
        'Names one specific integer.',
        'Verifies both $6 \\mid n$ and $4 \\nmid n$ from the definition of divides.',
        'Does not offer examples where the statement holds as evidence.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-quantifier-negation',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this back to me in your own words.',
      prompt: 'Why is the negation of “for all $x$, $P(x)$” the statement “there exists $x$ with not $P(x)$”? What does that tell you about proving and disproving each kind of statement?',
      points: [
        '“For all” is a conjunction over the domain, so it fails exactly when some instance fails.',
        'To prove $\\exists$, give a witness and verify it.',
        'To disprove $\\forall$, give one counterexample and verify it.',
        'Examples never prove a $\\forall$ over an infinite domain; that needs an argument for an arbitrary element.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Predicates take values from a stated domain. $\\forall$ is a big “and”, $\\exists$ a big “or”.', 110),
          recapItem(s, '• Prove $\\exists$ with a witness; disprove $\\forall$ with a counterexample.', 220),
          recapItem(s, '• Negate: push $\\neg$ inward, flip each quantifier. “All” pairs with $\\to$, “some” with $\\land$.', 330),
          recapItem(s, 'Next: several quantifiers at once, where order changes the meaning.', 460, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'A predicate becomes a proposition once its variables take values from a stated domain. “For all” is a big “and”, and “there exists” is a big “or”.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Prove an existence statement with a witness, and disprove a “for all” with a counterexample.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Negate by pushing the not inward and flipping each quantifier it passes. And remember: “all” pairs with the arrow, “some” pairs with “and”.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: statements with several quantifiers, where the order changes the meaning.',
          do: (s, o) => o.items[3].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
