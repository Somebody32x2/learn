/**
 * Lecture 2 · Conditionals and biconditionals (foundations/PLAN.md § 2). Irani · Logic.
 *
 * Choreography: p → q is a promise (four outcome cards, one broken); its truth table matches ¬p ∨ q; English
 * phrasings get an arrow pointing from hypothesis to conclusion (and "only if" turns the arrow around for the
 * learner); the four relatives are paired by connectors under one table; the negation of an "if" is derived as a
 * law chain and the tempting "p → ¬q" is struck; in a definition the word "if" stretches into "if and only if".
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

const T = '\\mathrm{T}';
const F = '\\mathrm{F}';

// ---------------------------------------------------------------- logic data (computed, not typed)

const imp = (a, b) => !a || b;
const tf = (v) => (v ? T : F);
const ROWS3 = [true, false].flatMap((p) => [true, false].flatMap((q) => [true, false].map((r) => ({ p, q, r }))));
const assocL = ({ p, q, r }) => imp(imp(p, q), r);
const assocR = ({ p, q, r }) => imp(p, imp(q, r));
/** The candidate rows offered in try-assoc, and which of them separate the two sides. */
const ASSOC_CANDS = { b: { p: false, q: true, r: false }, c: { p: true, q: true, r: false }, d: { p: true, q: false, r: false } };
const ASSOC_DIFF = Object.keys(ASSOC_CANDS).filter((k) => assocL(ASSOC_CANDS[k]) !== assocR(ASSOC_CANDS[k]));
const ASSOC_EQUIV = ROWS3.every((v) => assocL(v) === assocR(v));
const ASSOC_ANSWER = ASSOC_EQUIV ? 'a' : ASSOC_DIFF[0];
const rowTex = ({ p, q, r }) => `p = ${tf(p)},\\ q = ${tf(q)},\\ r = ${tf(r)}`;
const sidesTex = (v) => `$(p \\to q) \\to r = ${tf(assocL(v))}$ and $p \\to (q \\to r) = ${tf(assocR(v))}$`;

/** try-cond-values: [hypothesis, conclusion] truth of each choice, checked here. */
const isPrime = (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0);
const COND_VALUES = {
  a: [3 % 2 === 0, isPrime(7)],
  b: [isPrime(7), 3 % 2 === 0],
  c: [2 < 3, 2 < 5],
  d: [4 % 2 === 1, 4 % 2 === 1],
};
const COND_TRUE = Object.keys(COND_VALUES).filter((k) => imp(...COND_VALUES[k]));

// ---------------------------------------------------------------- local helpers

/** Colors parts of a Tex immediately (scene state). */
function paintParts(tex, parts) {
  for (const [name, color] of Object.entries(parts)) for (const e of tex.part(name)) e.style.color = color;
}

/** A row of the recap list, hidden. */
const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** One outcome card of the promise beat. */
function outcomeCard(s, x, y, final, course, verdict) {
  const w = 390;
  const h = 112;
  const frame = s.rect(x, y, w, h, { color: C.line, fill: FILL.ink, radius: 14, width: 2, visible: false });
  const l1 = s.text(`Final: **${final}**`, { x: x + 24, y: y + 34, size: 30, anchor: [0, 0.5], color: C.blue, visible: false });
  const l2 = s.text(`Course: **${course}**`, { x: x + 24, y: y + 78, size: 30, anchor: [0, 0.5], color: C.green, visible: false });
  const st = s.stamp(verdict, { x: x + 305, y: y + 56, color: verdict === 'broken' ? C.red : C.green, size: 30 });
  return { frame, l1, l2, st, show: (delay = 0) => s.all(frame.fadeIn({ shift: [0, 10], delay }), l1.fadeIn({ delay: delay + 100 }), l2.fadeIn({ delay: delay + 180 })) };
}

/** A connector under two table columns (a U shape), drawn left to right. */
function connector(s, a, b, depth, color) {
  const top = Math.max(a.y + a.h, b.y + b.h) + 8;
  const path = s.path(`M${a.cx} ${top} V${top + depth} H${b.cx} V${top}`, { color, width: 3, visible: false });
  const eq = s.tex('\\equiv', { x: (a.cx + b.cx) / 2, y: top + depth + 22, size: 32, color, visible: false });
  return { path, eq, show: () => s.all(path.draw({ duration: 700 }), eq.fadeIn({ delay: 500 })) };
}

// ---------------------------------------------------------------- lecture

export default {
  id: 'conditionals',
  title: 'Conditionals and biconditionals',
  goals: [
    'Give the truth table of $p \\to q$, including vacuous truth',
    'Translate “only if”, “necessary”, “sufficient” and “whenever” into $p \\to q$ in the right direction',
    'Form the converse, inverse and contrapositive, and know which are equivalent to the original',
    'Negate a conditional correctly: $\\neg(p \\to q) \\equiv p \\land \\neg q$',
    'Read biconditionals and definitions',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'promise',
      title: 'A promise',
      scene(s) {
        const l1 = s.tex('\\text{If } \\part{p}{\\text{you get an A on the final}},', { x: 380, y: 62, size: 36, visible: false });
        const l2 = s.tex('\\text{then } \\part{q}{\\text{you get an A in the course}}.', { x: 380, y: 116, size: 36, visible: false });
        const sym = s.tex('\\part{p}{p} \\to \\part{q}{q}', { x: 820, y: 89, size: 52, visible: false });
        paintParts(sym, { p: C.blue, q: C.green });
        const cards = [
          outcomeCard(s, 75, 180, 'A', 'A', 'kept'),
          outcomeCard(s, 495, 180, 'A', 'not A', 'broken'),
          outcomeCard(s, 75, 325, 'not A', 'A', 'kept'),
          outcomeCard(s, 495, 325, 'not A', 'not A', 'kept'),
        ];
        const rule = s.tex('p \\to q \\text{ is false only when } \\part{p}{p \\text{ is true}} \\text{ and } \\part{q}{q \\text{ is false}}', { y: 522, size: 34, visible: false });
        paintParts(rule, { p: C.blue, q: C.red });
        return { l1, l2, sym, cards, rule };
      },
      steps: [
        {
          say: 'Think of $p \\to q${p implies q} as a promise. I tell you: if you get an A on the final, then you get an A in the course.',
          do: async (s, o) => {
            await o.l1.write({ duration: 900 });
            await o.l2.write({ duration: 900 });
            await s.all(o.l1.color('p', C.blue), o.l2.color('q', C.green));
            await o.sym.fadeIn({ shift: [-16, 0] });
          },
        },
        {
          say: 'There are four ways the semester can go. If you ace the final and get your A, I kept my promise.',
          do: async (s, o) => {
            await s.all(o.cards.map((c, i) => c.show(i * 160)));
            await o.cards[0].st.slam();
          },
        },
        {
          say: 'The promise is broken in exactly one case: $p${p} happens and $q${q} doesn’t. You aced the final and I gave you a B.',
          do: async (s, o) => {
            await o.cards[1].frame.recolor(C.red);
            await o.cards[1].st.slam();
          },
        },
        {
          say: 'And if you didn’t ace the final, I kept my promise no matter what grade you got: I never promised anything about that case.',
          do: async (s, o) => {
            await o.cards[2].st.slam();
            await o.cards[3].st.slam();
            await o.rule.fadeIn({ shift: [0, 12] });
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'cond-table',
      title: 'The truth table of $p \\to q$',
      scene(s) {
        const t = s.truthTable({
          x: 380,
          y: 270,
          size: 36,
          vars: ['p', 'q'],
          cols: [
            { tex: 'p \\to q', key: 'imp', fn: (v) => imp(v.p, v.q) },
            { tex: '\\neg p \\lor q', key: 'or', fn: (v) => !v.p || v.q },
          ],
          visible: false,
        });
        const law = s.tex('p \\to q \\equiv \\neg p \\lor q', { y: 530, size: 44, color: C.green, visible: false });
        const names = s.tex('\\part{p}{p}: \\text{ hypothesis} \\qquad \\part{q}{q}: \\text{ conclusion}', { x: 480, y: 50, size: 32, visible: false });
        paintParts(names, { p: C.blue, q: C.green });
        return { t, law, names };
      },
      steps: [
        {
          say: 'In $p \\to q${p implies q}, $p${p} is called the hypothesis and $q${q} the conclusion. Here are the four rows.',
          do: async (s, o) => {
            await o.names.fadeIn();
            await o.t.fadeIn();
            await s.all(o.t.highlightCol('p', 'blue'), o.t.highlightCol('q', 'green'));
            await s.wait(500);
            await o.t.clear();
          },
        },
        {
          say: 'The conditional is false in one row only: true hypothesis, false conclusion. Every other row is true.',
          do: async (s, o) => {
            await o.t.fillColumn('imp');
            await o.t.highlightRows(1, 'red');
          },
        },
        {
          say: 'The two bottom rows have a false hypothesis. They are called vacuously true: the promise was never tested.',
          do: async (s, o) => {
            const t = o.t;
            o.tags = [2, 3].map((i) => {
              const b = t.rowBox(i);
              return s.text('vacuously true', { x: 900, y: b.cy, size: 30, anchor: [1, 0.5], color: C.yellow, weight: 600, visible: false });
            });
            await s.all([2, 3].map((i) => t.highlightRows(i, 'yellow')));
            await s.all(o.tags.map((m, i) => m.fadeIn({ shift: [-12, 0], delay: i * 200 })));
          },
        },
        {
          say: 'Now compare with not p or q. Same column, row by row, so $p \\to q \\equiv \\neg p \\lor q${p implies q is equivalent to not p or q}. We will use this constantly.',
          do: async (s, o) => {
            await s.all(o.tags.map((m) => m.fadeOut()));
            await o.t.clear();
            await o.t.fillColumn('or');
            await s.all(o.t.highlightCol('imp', 'green'), o.t.highlightCol('or', 'green'));
            for (let i = 0; i < 4; i++) await o.t.markRow(i, '✓');
            await o.law.write({ duration: 1000 });
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'vacuous',
      title: 'Vacuous truth',
      scene(s) {
        const a = s.text('Every unicorn in this room is purple.', { x: 420, y: 60, size: 34, font: 'serif', visible: false });
        const room = s.rect(270, 108, 300, 150, { color: C.muted, dash: '10 8', width: 2, radius: 16, visible: false });
        const roomLabel = s.text('this room', { x: 290, y: 132, size: 30, anchor: [0, 0.5], color: C.muted, italic: true, visible: false });
        const none = s.text('unicorns: none', { x: 420, y: 205, size: 30, color: C.muted, visible: false });
        const scan = s.line(290, 150, 290, 245, { color: C.yellow, width: 4, visible: false });
        const nothing = s.text('nothing to check', { x: 760, y: 183, size: 30, color: C.yellow, weight: 600, visible: false });
        const b = s.tex('\\forall x \\in \\varnothing,\\ P(x)', { x: 420, y: 320, size: 40, visible: false });
        const bWhy = s.text('$\\varnothing$ has no elements, so no instance can fail', { x: 420, y: 372, size: 30, color: C.muted, visible: false });
        const c = s.tex('\\text{If } \\part{h}{2 + 2 = 5}, \\text{ then } \\pi = 3.', { x: 420, y: 445, size: 38, visible: false });
        const stamps = [s.stamp('T', { x: 860, y: 60, color: C.green, size: 36 }), s.stamp('T', { x: 860, y: 320, color: C.green, size: 36 }), s.stamp('T', { x: 860, y: 445, color: C.green, size: 36 })];
        const sub = s.tex('\\varnothing \\subseteq A:\\ \\text{every element of } \\varnothing \\text{ is in } A', { y: 535, size: 32, color: C.purple, visible: false });
        return { a, room, roomLabel, none, scan, nothing, b, bWhy, c, stamps, sub };
      },
      steps: [
        {
          say: 'Is this true? Every unicorn in this room is purple. Let’s check every unicorn in the room.',
          do: async (s, o) => {
            await o.a.write({ duration: 1000 });
            await s.all(o.room.draw({ duration: 700 }), o.roomLabel.fadeIn({ delay: 200 }));
            o.scan.show();
            await o.scan.shift(260, 0, { duration: 1100 });
            await s.all(o.scan.fadeOut(), o.none.fadeIn());
          },
        },
        {
          say: 'There are none. Read the sentence as: for anything in this room, if it is a unicorn, then it is purple; the hypothesis is false every time, so nothing can be a counterexample, and the conditional is true.',
          do: async (s, o) => {
            await o.nothing.fadeIn({ shift: [-12, 0] });
            await o.stamps[0].slam();
          },
        },
        {
          say: 'For the same reason, a statement about every element of the empty set is true, whatever it says. So is “if two plus two is five, then pi is three”.',
          do: async (s, o) => {
            await o.b.write({ duration: 800 });
            await o.bWhy.fadeIn();
            await o.stamps[1].slam();
            await o.c.write({ duration: 900 });
            await s.ring([o.c, 'h'], { color: C.red, shape: 'box', pad: 4 });
            await o.stamps[2].slam();
          },
        },
        {
          say: 'This is not a trick. It is exactly what makes facts like $\\varnothing \\subseteq A${the empty set is a subset of A} true for every set $A${A}.',
          do: (s, o) => o.sub.fadeIn({ shift: [0, 12] }),
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-cond-values',
      kind: 'try',
      title: 'Which are true?',
      say: 'Your turn. Decide which of these conditionals are true. Remember the one row that makes a conditional false.',
      prompt: 'Which of these statements are true? Select all.',
      answer: { type: 'multi', value: COND_TRUE },
      choices: [
        { id: 'a', label: '“If $3$ is even, then $7$ is prime.”', why: 'True: the hypothesis “3 is even” is false, so the conditional is vacuously true.' },
        { id: 'b', label: '“If $7$ is prime, then $3$ is even.”', why: 'False: true hypothesis, false conclusion. This is the one false row, T → F.' },
        { id: 'c', label: '“If $2 < 3$, then $2 < 5$.”', why: 'True: both parts are true (T → T).' },
        { id: 'd', label: '“If $4$ is odd, then $4$ is odd.”', why: 'True: $p \\to p$ is a tautology (here also vacuously, since $4$ is not odd).' },
      ],
      hint: 'A conditional is false only when the hypothesis is true and the conclusion is false.',
      solution: [
        'Find the truth value of each hypothesis and conclusion, then read off the table of $p \\to q$.',
        '(a) F → T, true. (b) T → F, **false**. (c) T → T, true. (d) F → F, true.',
        'Only (b) has a true hypothesis and a false conclusion, so (a), (c) and (d) are true.',
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'english',
      title: 'Many ways to say $p \\to q$',
      scene(s) {
        const forms = [
          '\\text{if } \\part{p}{p}\\text{, then } \\part{q}{q}',
          '\\part{q}{q} \\text{ if } \\part{p}{p}',
          '\\part{p}{p} \\text{ \\part{oi}{only if} } \\part{q}{q}',
          '\\part{p}{p} \\text{ is sufficient for } \\part{q}{q}',
          '\\part{q}{q} \\text{ is necessary for } \\part{p}{p}',
          '\\part{q}{q} \\text{ whenever } \\part{p}{p}',
        ];
        const lines = forms.map((tex, i) => {
          const m = s.tex(tex, { x: 70, y: 70 + i * 82, size: 36, anchor: [0, 0.5], visible: false });
          paintParts(m, { p: C.blue, q: C.green });
          return m;
        });
        const ex = s.text('“You may graduate **only if** you pass this course.”', { x: 700, y: 120, size: 30, width: 380, font: 'serif', visible: false });
        const exSym = s.tex('\\part{p}{\\text{graduate}} \\to \\part{q}{\\text{pass}}', { x: 700, y: 230, size: 38, visible: false });
        paintParts(exSym, { p: C.blue, q: C.green });
        const exNote = s.text('Passing is necessary for graduating, not sufficient.', { x: 700, y: 320, size: 30, width: 380, color: C.muted, visible: false });
        const rule1 = s.text('sufficient = hypothesis', { x: 700, y: 430, size: 30, color: C.blue, weight: 600, visible: false });
        const rule2 = s.text('necessary = conclusion', { x: 700, y: 485, size: 30, color: C.green, weight: 600, visible: false });
        return { lines, ex, exSym, exNote, rule1, rule2 };
      },
      steps: [
        {
          say: 'English has many ways to say $p \\to q${p implies q}. In each one, the arrow runs from the hypothesis to the conclusion. The hypothesis is whatever follows “if”, but not “only if”.',
          do: async (s, o) => {
            o.arrows = o.lines.map((m) => {
              const p = m.partBox('p');
              const q = m.partBox('q');
              const y = m.box().y + m.box().h + 4;
              return s.arrow(p.cx, y, q.cx, y, { color: C.muted, width: 3, visible: false });
            });
            for (const i of [0, 1]) {
              await o.lines[i].fadeIn({ shift: [-12, 0] });
              await o.arrows[i].draw({ duration: 600 });
            }
          },
        },
        {
          say: 'But careful with “only if”. $p${p} only if $q${q} means $q${q} is forced by $p${p}: the arrow points toward $q${q}, not away from it.',
          do: async (s, o) => {
            await o.lines[2].fadeIn({ shift: [-12, 0] });
            await s.ring([o.lines[2], 'oi'], { color: C.yellow, shape: 'box', pad: 3 });
            await o.arrows[2].draw({ duration: 600 });
          },
        },
        {
          say: 'A sufficient condition is a hypothesis: it is enough to get the conclusion. A necessary condition is a conclusion: you can’t have the hypothesis without it.',
          do: async (s, o) => {
            for (const i of [3, 4]) {
              await o.lines[i].fadeIn({ shift: [-12, 0] });
              await o.arrows[i].draw({ duration: 600 });
            }
            await o.rule1.fadeIn();
            await o.rule2.fadeIn();
          },
        },
        {
          say: '“$q${q} whenever $p${p}” is one more. And here is a real one: you may graduate only if you pass this course. Passing is necessary, not sufficient.',
          do: async (s, o) => {
            await o.lines[5].fadeIn({ shift: [-12, 0] });
            await o.arrows[5].draw({ duration: 600 });
            await o.ex.fadeIn();
            await o.exSym.write({ duration: 800 });
            await o.exNote.fadeIn();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'variants',
      title: 'Converse, inverse, contrapositive',
      scene(s) {
        const cell = (name, tex, x, y) => s.tex(`\\text{${name}: } ${tex}`, { x, y, size: 32, visible: false });
        const grid = [
          cell('original', 'p \\to q', 250, 52),
          cell('converse', 'q \\to p', 710, 52),
          cell('inverse', '\\neg p \\to \\neg q', 250, 112),
          cell('contrapositive', '\\neg q \\to \\neg p', 710, 112),
        ];
        const t = s.truthTable({
          x: 480,
          y: 310,
          size: 30,
          vars: ['p', 'q'],
          cols: [
            { tex: 'p \\to q', key: 'o', fn: (v) => imp(v.p, v.q) },
            { tex: 'q \\to p', key: 'c', fn: (v) => imp(v.q, v.p) },
            { tex: '\\neg p \\to \\neg q', key: 'i', fn: (v) => imp(!v.p, !v.q) },
            { tex: '\\neg q \\to \\neg p', key: 'k', fn: (v) => imp(!v.q, !v.p) },
          ],
          visible: false,
        });
        const thm = s.text('If $4 \\mid n$, then $n$ is even.', { x: 420, y: 160, size: 36, visible: false });
        const conv = s.text('If $n$ is even, then $4 \\mid n$.', { x: 420, y: 290, size: 36, visible: false });
        const ce = s.text('$n = 2$: even, but $4 \\nmid 2$', { x: 420, y: 375, size: 32, color: C.red, visible: false });
        const stT = s.stamp('T', { x: 800, y: 160, color: C.green, size: 36 });
        const stF = s.stamp('F', { x: 800, y: 290, color: C.red, size: 36 });
        const moral = s.text('A converse needs its own proof, or a counterexample.', { y: 490, size: 30, color: C.muted, visible: false });
        return { grid, t, thm, conv, ce, stT, stF, moral };
      },
      steps: [
        {
          say: 'Every conditional has three relatives. The converse swaps the two sides, the inverse negates both, and the contrapositive does both: it swaps and negates.',
          do: (s, o) => s.stagger(o.grid.map((m) => () => m.fadeIn()), 450),
        },
        {
          say: 'Put all four in one table. The original and the contrapositive have exactly the same column, so they say the same thing.',
          do: async (s, o) => {
            const t = o.t;
            await t.fadeIn();
            for (const k of ['o', 'c', 'i', 'k']) await t.fillColumn(k, { gap: 120 });
            await s.all(t.highlightCol('o', 'green'), t.highlightCol('k', 'green'));
            o.c1 = connector(s, t.colBox('o'), t.colBox('k'), 70, C.green);
            await o.c1.show();
            await s.all(o.grid[0].indicate({ color: C.green }), o.grid[3].indicate({ color: C.green }));
          },
        },
        {
          say: 'The converse is a different statement. It matches the inverse, but it disagrees with the original in two rows.',
          do: async (s, o) => {
            const t = o.t;
            await s.all(t.highlightCol('c', 'teal'), t.highlightCol('i', 'teal'));
            o.c2 = connector(s, t.colBox('c'), t.colBox('i'), 14, C.teal);
            await o.c2.show();
            await t.highlightRows([1, 2], 'red');
          },
        },
        {
          say: 'An example. If four divides $n${n}, then $n${n} is even: true. Its converse fails at $n = 2${n equals two}, which is even but not divisible by four.',
          do: async (s, o) => {
            await s.all(o.t.fadeOut(), o.c1.path.fadeOut(), o.c1.eq.fadeOut(), o.c2.path.fadeOut(), o.c2.eq.fadeOut(), ...o.grid.map((m) => m.fadeOut()));
            await o.thm.fadeIn();
            await o.stT.slam();
            await o.conv.fadeIn();
            await o.ce.fadeIn();
            await o.stF.slam();
            await o.moral.fadeIn();
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-variants',
      kind: 'blanks',
      title: 'Contrapositive and converse',
      say: 'Fill in the contrapositive and the converse of a theorem from calculus.',
      prompt: 'Theorem: “If $f$ is differentiable, then $f$ is continuous.” Fill in its contrapositive and its converse.',
      lines: (() => {
        const chips = ['f \\text{ is continuous}', 'f \\text{ is not continuous}', 'f \\text{ is differentiable}', 'f \\text{ is not differentiable}'];
        return [
          ['\\text{Contrapositive: if }', { id: 'k1', chips, answer: chips[1] }, '\\text{, then }', { id: 'k2', chips, answer: chips[3], hint: 'The contrapositive swaps the two parts and negates both.' }],
          ['\\text{Converse: if }', { id: 'c1', chips, answer: chips[0] }, '\\text{, then }', { id: 'c2', chips, answer: chips[2], hint: 'The converse only swaps; nothing is negated.' }],
        ];
      })(),
      solution: [
        'The contrapositive swaps and negates: if $f$ is not continuous, then $f$ is not differentiable.',
        'The converse only swaps: if $f$ is continuous, then $f$ is differentiable.',
        'The theorem and its contrapositive are true. The converse is false: $f(x) = \\lvert x \\rvert$ is continuous at $0$ but not differentiable there.',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'negate-cond',
      title: 'Negating an implication',
      scene(s) {
        const p = s.proof({ y: 40, height: 290, size: 36, numbered: false });
        const wrong = s.tex('\\neg(p \\to q) \\equiv p \\to \\neg q', { x: 480, y: 378, size: 40, visible: false });
        const wrongWhy = s.text('wrong: when $p$ is false, this and $p \\to q$ are both true', { x: 480, y: 432, size: 30, color: C.red, visible: false });
        const ex1 = s.text('Not (“If it rains, the game is cancelled”):', { y: 497, size: 30, color: C.muted, visible: false });
        const ex2 = s.text('“It rains **and** the game is not cancelled.”', { y: 548, size: 32, color: C.green, visible: false });
        return { p, wrong, wrongWhy, ex1, ex2 };
      },
      steps: [
        {
          say: 'The negation of a promise says it was broken: $p${p} happened and $q${q} didn’t. Let’s derive it: first the conditional law rewrites $p \\to q${p implies q} as $\\neg p \\lor q${not p or q}.',
          do: async (s, o) => {
            await o.p.add('\\neg(p \\to q)', { tex: true, why: 'start', kind: 'assume' });
            await o.p.add('\\equiv \\neg(\\neg p \\lor q)', { tex: true, why: 'conditional law' });
          },
        },
        {
          say: 'De Morgan turns the negated “or” into an “and”, and double negation cancels the two nots. The negation is $p \\land \\neg q${p and not q}.',
          do: async (s, o) => {
            await o.p.add('\\equiv \\neg\\neg p \\land \\neg q', { tex: true, why: 'De Morgan' });
            await o.p.add('\\equiv p \\land \\neg q', { tex: true, why: 'double negation', kind: 'conclude' });
          },
        },
        {
          say: 'Here’s the trap: the negation of an “if” is an “and”, not another “if”. $p \\to \\neg q${p implies not q} is wrong, because when $p${p} is false both it and the original are true.',
          do: async (s, o) => {
            await o.wrong.write({ duration: 900 });
            await o.wrongWhy.fadeIn();
            await s.strike(o.wrong);
          },
        },
        {
          say: 'So the negation of “if it rains, the game is cancelled” is: it rains, and the game is not cancelled.',
          do: async (s, o) => {
            await o.ex1.fadeIn();
            await o.ex2.fadeIn({ shift: [0, 10] });
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'try-negate-cond',
      kind: 'try',
      title: 'Negate it',
      say: 'Now you negate a conditional. Ask yourself when exactly the original is false.',
      prompt: 'For a fixed integer $n$, which is the negation of “If $n$ is prime, then $n$ is odd”?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: '“If $n$ is prime, then $n$ is even.”', why: 'When $n$ is not prime, this and the original are both (vacuously) true, so it can’t be the negation.' },
        { id: 'b', label: '“$n$ is prime and $n$ is even.”', why: 'This is $p \\land \\neg q$, exactly when the original fails; it is true for $n = 2$.' },
        { id: 'c', label: '“If $n$ is not prime, then $n$ is not odd.”', why: 'That is the inverse, not the negation.' },
        { id: 'd', label: '“$n$ is not prime and $n$ is odd.”', why: 'This negates the wrong part: it should keep $p$ and negate $q$.' },
      ],
      hint: 'When exactly is “if $p$ then $q$” false?',
      solution: [
        'The original is false exactly when $n$ is prime and $n$ is not odd. That is $\\neg(p \\to q) \\equiv p \\land \\neg q$: “$n$ is prime and $n$ is even.”',
        'For $n = 2$ the negation is true, so the original fails there.',
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'biconditional',
      title: 'If and only if',
      scene(s) {
        const t = s.truthTable({
          x: 480,
          y: 175,
          size: 32,
          vars: ['p', 'q'],
          cols: [
            { tex: 'p \\to q', key: 'pq', fn: (v) => imp(v.p, v.q) },
            { tex: 'q \\to p', key: 'qp', fn: (v) => imp(v.q, v.p) },
            { tex: 'p \\leftrightarrow q', key: 'iff', fn: (v) => v.p === v.q },
          ],
          visible: false,
        });
        const law = s.tex('p \\leftrightarrow q \\equiv (p \\to q) \\land (q \\to p)', { y: 352, size: 38, visible: false });
        const thm = s.tex('\\part{L}{n \\text{ is even}} \\iff \\part{R}{n^2 \\text{ is even}}', { y: 462, size: 40, visible: false });
        paintParts(thm, { L: C.blue, R: C.green });
        return { t, law, thm };
      },
      steps: [
        {
          say: '“$p${p} if and only if $q${q}”, written $p \\leftrightarrow q${p if and only if q}, is true exactly when the two sides agree: both true or both false.',
          do: async (s, o) => {
            await o.t.fadeIn();
            await o.t.fillColumn('iff');
            await o.t.highlightRows([0, 3], 'green');
          },
        },
        {
          say: 'It is two conditionals at once: $p \\to q${p implies q} and its converse $q \\to p${q implies p}. Each fails in one row, and together they fail in exactly the two rows where the sides disagree.',
          do: async (s, o) => {
            await o.t.clear();
            await o.t.fillColumn('pq', { gap: 160 });
            await o.t.fillColumn('qp', { gap: 160 });
            await s.all(o.t.highlightCol('pq', 'blue'), o.t.highlightCol('qp', 'blue'), o.t.highlightCol('iff', 'green'));
            await o.law.write({ duration: 1100 });
          },
        },
        {
          say: 'So proving an “if and only if” means proving both directions, labelled forward and backward. For $n${n} even if and only if $n^2${n squared} even, that is two proofs.',
          do: async (s, o) => {
            await o.thm.write({ duration: 900 });
            const L = o.thm.partBox('L');
            const R = o.thm.partBox('R');
            const b = o.thm.box();
            o.fw = s.arrow(L.cx, b.y - 12, R.cx, b.y - 12, { color: C.blue, width: 4, visible: false });
            o.bw = s.arrow(R.cx, b.y + b.h + 12, L.cx, b.y + b.h + 12, { color: C.green, width: 4, visible: false });
            o.fwL = s.tex('(\\Rightarrow)', { x: L.x - 60, y: b.y - 12, size: 32, color: C.blue, visible: false });
            o.bwL = s.tex('(\\Leftarrow)', { x: L.x - 60, y: b.y + b.h + 12, size: 32, color: C.green, visible: false });
            await s.all(o.fw.draw(), o.fwL.fadeIn());
            await s.all(o.bw.draw(), o.bwL.fadeIn());
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'definitions-iff',
      title: 'Definitions say “if” but mean “iff”',
      scene(s) {
        const L = 'n \\in \\mathbb{Z} \\text{ is } \\textbf{even}';
        const R = 'n = 2k \\text{ for some } k \\in \\mathbb{Z}.';
        const row = s.symbols([L, '\\ \\text{if}\\ ', R], { x: 480, y: 95, size: 30, visible: false });
        const target = s.symbols([L, '\\ \\text{if and only if}\\ ', R], { x: 480, y: 95, size: 30, visible: false });
        const b = s.group(...row).box();
        const frame = s.rect(b.x - 22, b.y - 14, b.w + 44, b.h + 28, { color: C.purple, fill: FILL.purple, radius: 14, width: 3, visible: false });
        const defLine = s.text('In a **definition**, “if” means “if and only if”.', { y: 215, size: 32, color: C.purple, visible: false });
        const thmLine = s.text('In a **theorem**: “If $n$ is even, then $n^2$ is even.”', { y: 285, size: 32, visible: false });
        const thmNote = s.text('one direction only', { y: 335, size: 30, color: C.muted, visible: false });
        const both = s.tex('\\part{L}{n \\text{ is even}} \\iff \\part{R}{n = 2k \\text{ for some } k \\in \\mathbb{Z}}', { y: 460, size: 36, visible: false });
        return { row, target, frame, defLine, thmLine, thmNote, both };
      },
      steps: [
        {
          say: 'Here is how a textbook defines even: an integer $n${n} is even if $n = 2k${n equals two k} for some integer $k${k}. Read that “if” carefully.',
          do: async (s, o) => {
            await o.frame.fadeIn({ shift: [0, 0] });
            await s.all(o.row.map((m, i) => m.fadeIn({ delay: i * 150 })));
          },
        },
        {
          say: 'In a definition, “if” is an “if and only if” by convention: the new word means exactly the condition, no more and no less.',
          do: async (s, o) => {
            const [l, mid, r] = o.row;
            const tb = s.group(...o.target).box();
            await s.all(
              l.moveTo(o.target[0].x, o.target[0].y, { duration: 700 }),
              r.moveTo(o.target[2].x, o.target[2].y, { duration: 700 }),
              mid.moveTo(o.target[1].x, o.target[1].y, { duration: 700 }),
              o.frame.resize(tb.x - 22, tb.y - 14, tb.w + 44, tb.h + 28, { duration: 700 }),
              mid.swap('\\ \\text{if and only if}\\ ', { duration: 700 }),
            );
            await mid.recolor(C.yellow);
            await o.defLine.fadeIn();
          },
        },
        {
          say: 'In a theorem, “if” means one direction only. If $n${n} is even then $n^2${n squared} is even says nothing yet about the converse.',
          do: async (s, o) => {
            await o.thmLine.fadeIn();
            await o.thmNote.fadeIn();
          },
        },
        {
          say: 'So you may always use a definition both ways: unpack the word into the condition, or repack the condition into the word.',
          do: async (s, o) => {
            await o.both.write({ duration: 900 });
            const L = o.both.partBox('L');
            const R = o.both.partBox('R');
            const b = o.both.box();
            o.un = s.arrow(L.cx, b.y - 14, R.cx, b.y - 14, { color: C.purple, width: 4, visible: false });
            o.re = s.arrow(R.cx, b.y + b.h + 14, L.cx, b.y + b.h + 14, { color: C.green, width: 4, visible: false });
            o.unL = s.text('unpack', { x: (L.cx + R.cx) / 2, y: b.y - 42, size: 30, color: C.purple, weight: 600, visible: false });
            o.reL = s.text('repack', { x: (L.cx + R.cx) / 2, y: b.y + b.h + 42, size: 30, color: C.green, weight: 600, visible: false });
            await s.all(o.un.draw(), o.unL.fadeIn());
            await s.all(o.re.draw(), o.reL.fadeIn());
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'try-assoc',
      kind: 'try',
      title: 'Is $\\to$ associative?',
      say: 'A puzzle. Is the arrow associative? One row is enough to decide, if you can find the right one.',
      prompt: 'Are $(p \\to q) \\to r$ and $p \\to (q \\to r)$ logically equivalent?',
      answer: { type: 'choice', value: ASSOC_ANSWER },
      choices: [
        { id: 'a', label: 'Yes, they are equivalent.', why: `Check $p = \\mathrm{F}, q = \\mathrm{T}, r = \\mathrm{F}$: ${sidesTex(ASSOC_CANDS.b)}.` },
        ...['b', 'c', 'd'].map((k) => ({
          id: k,
          label: `No: they differ when $${rowTex(ASSOC_CANDS[k])}$.`,
          why: ASSOC_DIFF.includes(k)
            ? `Right: ${sidesTex(ASSOC_CANDS[k])}. A false hypothesis makes the right side true, while the left side is $\\mathrm{T} \\to \\mathrm{F}$.`
            : `At that row both sides have the same value: ${sidesTex(ASSOC_CANDS[k])}.`,
        })),
      ],
      hint: 'A false $p$ makes the right side true. Can you make the left side false at the same time?',
      solution: [
        `At $${rowTex(ASSOC_CANDS.b)}$: the left side is $(\\mathrm{F} \\to \\mathrm{T}) \\to \\mathrm{F} = \\mathrm{T} \\to \\mathrm{F} = \\mathrm{F}$, and the right side is $\\mathrm{F} \\to (\\dots) = \\mathrm{T}$.`,
        'One row where they differ proves they are not equivalent: $\\to$ is not associative, so always write the parentheses.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-distribute-cond',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Prove this equivalence with the laws of logic, naming each law, and then say what it means in plain English.',
      prompt: 'Prove, using laws of logic, that $(p \\to q) \\land (p \\to r) \\equiv p \\to (q \\land r)$. Then say in one English sentence what it means.',
      answer: { type: 'proof' },
      hints: ['Rewrite each conditional as $\\neg p \\lor \\cdots$ with the conditional law.', 'The distributive law: $\\lor$ distributes over $\\land$, and you can read it right to left.'],
      solution: [
        '**Proof.**',
        '$(p \\to q) \\land (p \\to r) \\equiv (\\neg p \\lor q) \\land (\\neg p \\lor r)$ (conditional law, twice)',
        '$\\equiv \\neg p \\lor (q \\land r)$ (distributive law, read right to left)',
        '$\\equiv p \\to (q \\land r)$ (conditional law). ∎',
        'In words: to prove that $p$ implies two things, it is enough to prove that $p$ implies each of them separately.',
      ],
      rubric: [
        'Uses $p \\to q \\equiv \\neg p \\lor q$ correctly (for both conditionals and at the end).',
        'Applies the distributivity of $\\lor$ over $\\land$ in the right direction.',
        'Names every law used.',
        'Reaches the right-hand side exactly.',
        'Gives a correct English reading.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-contrapositive',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this back to me in your own words.',
      prompt: 'Why is a conditional equivalent to its contrapositive but not to its converse?',
      points: [
        '$p \\to q$ is false only when $p$ is true and $q$ is false.',
        '$\\neg q \\to \\neg p$ is false only when $\\neg q$ is true and $\\neg p$ is false: the same row, so the tables match.',
        'The converse $q \\to p$ is false in the row $p$ false, $q$ true, where the original is true.',
        'Example: “$4 \\mid n \\implies n$ is even” is true, but its converse fails at $n = 2$.',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• $p \\to q$ is false only at T → F. A false hypothesis makes it vacuously true.', 120),
          recapItem(s, '• Contrapositive ≡ original; the converse is a different statement. $\\neg(p \\to q) \\equiv p \\land \\neg q$.', 230),
          recapItem(s, '• “Iff” is two conditionals; definitions’ “if” means “iff”.', 340),
          recapItem(s, 'Next: statements about *every* object or *some* object.', 470, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'A conditional is false only when a true hypothesis leads to a false conclusion. A false hypothesis makes it vacuously true.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'The contrapositive says the same thing as the original; the converse does not. And the negation of an “if” is an “and”: $p \\land \\neg q${p and not q}.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: '“If and only if” is two conditionals, and the “if” in a definition always means “if and only if”.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: statements about every object, or about some object. Quantifiers.',
          do: (s, o) => o.items[3].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
