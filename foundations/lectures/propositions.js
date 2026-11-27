/**
 * Lecture 1 · Propositions and connectives (foundations/PLAN.md § 1). Irani · Logic.
 *
 * Truth tables fill column by column with the narration; De Morgan is shown by moving the symbols themselves
 * (¬ slides in front of each letter, ∧ turns into ∨); the wrong version dies on one red row.
 */
import { C } from '../../lectern/src/core/stage.js';

const T = '\\mathrm{T}';
const F = '\\mathrm{F}';

// ---------------------------------------------------------------- local helpers

/** One box around two truth-table cells in the same row. */
function pairBox(t, i, a, b) {
  const p = t.cellBox(i, a);
  const q = t.cellBox(i, b);
  return { x: p.x, y: p.y, w: q.x + q.w - p.x, h: p.h };
}

/**
 * ¬(a ∘ b) → ¬a ∘' ¬b, performed on `from` (s.symbols ¬ ( a ∘ b )) toward the hidden layout `to` (¬ a ∘' ¬ b):
 * the outer ¬ slides in front of a, a copy of it slides in front of b, the parentheses dissolve, ∘ flips.
 */
async function deMorgan(s, from, to, flipped) {
  const [neg, open, a, op, b, close] = from;
  const copy = s.tex('\\neg', { x: neg.x, y: neg.y, size: neg.size, anchor: [0, 0.5] });
  await s.all(neg.recolor(C.yellow), copy.recolor(C.yellow));
  await s.all(
    neg.moveTo(to[0].x, to[0].y, { duration: 900 }),
    copy.moveTo(to[3].x, to[3].y, { duration: 1100 }),
    a.moveTo(to[1].x, to[1].y, { duration: 900 }),
    b.moveTo(to[4].x, to[4].y, { duration: 900 }),
    op.moveTo(to[2].x, to[2].y, { duration: 900 }),
    open.fadeOut({ duration: 400 }),
    close.fadeOut({ duration: 400 }),
  );
  await op.swap(flipped);
  await s.all(op.recolor(C.yellow), neg.recolor(C.ink, { delay: 300 }), copy.recolor(C.ink, { delay: 300 }));
}

/** A row of the recap list, hidden. */
const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

// ---------------------------------------------------------------- lecture

export default {
  id: 'propositions',
  title: 'Propositions and connectives',
  goals: [
    'Decide whether a sentence is a proposition',
    'Compute truth values of compound propositions with $\\neg$, $\\land$, $\\lor$, $\\oplus$ using truth tables',
    'Recognize tautologies and contradictions',
    'Show two propositions are (or are not) logically equivalent, and negate “and”/“or” with De Morgan’s laws',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'why-logic',
      title: 'Why start with logic?',
      scene(s) {
        const a = s.text('Every square is even.', { x: 380, y: 80, size: 36, font: 'serif', visible: false });
        const aWhy = s.text('$3^2 = 9$, and $9$ is odd', { x: 380, y: 135, size: 30, color: C.red, visible: false });
        const b = s.text('If $n$ is even, then $n^2$ is even.', { x: 380, y: 210, size: 36, font: 'serif', visible: false });
        const aStamp = s.stamp('F', { x: 790, y: 80, color: 'red', size: 40 });
        const bStamp = s.stamp('T', { x: 790, y: 210, color: 'green', size: 40 });
        const rule = s.line(80, 275, 880, 275, { color: C.line, width: 2, visible: false });
        const waiter = s.text('Waiter: “Soup or salad?”', { x: 260, y: 340, size: 32, visible: false });
        const waiterMeans = s.text('exactly one', { x: 260, y: 405, size: 34, weight: 600, visible: false });
        const math = s.text('Math: “$p$ or $q$”', { x: 710, y: 340, size: 32, visible: false });
        const mathMeans = s.text('at least one', { x: 710, y: 405, size: 34, weight: 600, color: C.blue, visible: false });
        const grammar = s.text('Logic is the grammar of proof.', { y: 520, size: 38, font: 'serif', italic: true, visible: false });
        return { a, aWhy, b, aStamp, bStamp, rule, waiter, waiterMeans, math, mathMeans, grammar };
      },
      steps: [
        {
          say: 'Mathematics is built out of sentences that are either true or false. Take this one: every square is even.',
          do: (s, o) => o.a.write({ duration: 1100 }),
        },
        {
          say: 'It is false, and one example is enough to kill it: $3^2 = 9${three squared is nine}, and nine is odd.',
          do: async (s, o) => {
            await o.aWhy.fadeIn();
            await o.aStamp.slam();
          },
        },
        {
          say: 'This one, if $n${n} is even then $n^2${n squared} is even, is true. A proof is a chain of true sentences like it, each one following from the last.',
          do: async (s, o) => {
            await o.b.write({ duration: 1100 });
            await o.bStamp.slam();
          },
        },
        {
          say: 'English is slippery. When a waiter asks “soup or salad?”, the “or” means exactly one of them.',
          do: async (s, o) => {
            await o.rule.draw({ duration: 500 });
            await o.waiter.fadeIn();
            await o.waiterMeans.fadeIn();
            o.u = s.underline(o.waiterMeans, { color: C.yellow, width: 5, visible: false });
            await o.u.draw({ duration: 500 });
          },
        },
        {
          say: 'In mathematics we fix the meaning of every word once and for all, and “or” will always mean at least one.',
          do: async (s, o) => {
            await o.math.fadeIn();
            await o.mathMeans.fadeIn();
          },
        },
        {
          say: 'This course is about reading and writing proofs that leave no gaps, and logic is the grammar those proofs are written in.',
          do: (s, o) => o.grammar.fadeIn({ shift: [0, 20] }),
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'propositions',
      title: 'What is a proposition?',
      scene(s) {
        const def = s.defCard({ y: 92, body: 'A **proposition** is a declarative sentence that is either true or false, but not both.', title: false, width: 840, visible: false });
        const left = (str, y, opts = {}) => s.text(str, { x: 70, y, size: 32, anchor: [0, 0.5], align: 'left', visible: false, ...opts });
        const rows = [
          left('$7$ is prime.', 190),
          left('$2 + 2 = 5$.', 262),
          s.tex('\\part{x}{x} > 3', { x: 70, y: 334, size: 36, anchor: [0, 0.5], visible: false }),
          left('Close the door.', 406),
          left('Every even integer greater than $2$ is a sum of two primes.', 505, { width: 560 }),
        ];
        const stamps = [
          s.stamp('T', { x: 780, y: 190, color: 'green', rotate: -3 }),
          s.stamp('F', { x: 780, y: 262, color: 'red', rotate: -3 }),
          s.stamp('not a proposition', { x: 780, y: 334, color: 'muted', size: 30, rotate: -3 }),
          s.stamp('not a proposition', { x: 780, y: 406, color: 'muted', size: 30, rotate: -3 }),
          s.stamp('T or F: unknown', { x: 780, y: 505, color: 'orange', size: 30, rotate: -3 }),
        ];
        return { def, rows, stamps };
      },
      steps: [
        {
          say: 'A proposition is a declarative sentence that is either true or false, and not both.',
          do: (s, o) => o.def.reveal(),
        },
        {
          say: '“Seven is prime” is a proposition, and it is true. “Two plus two equals five” is also a proposition: a false one.',
          do: async (s, o) => {
            await o.rows[0].fadeIn();
            await o.stamps[0].slam();
            await o.rows[1].fadeIn();
            await o.stamps[1].slam();
          },
        },
        {
          say: 'But $x > 3${x is greater than three} has a free variable. Until we know what $x${x} is, it has no truth value, so it is not a proposition yet.',
          do: async (s, o) => {
            await o.rows[2].fadeIn();
            await s.ring([o.rows[2], 'x'], { color: 'yellow', shape: 'box', pad: 4 });
            await o.stamps[2].slam();
          },
        },
        {
          say: 'Commands and questions are not propositions either: “close the door” is neither true nor false.',
          do: async (s, o) => {
            await o.rows[3].fadeIn();
            await o.stamps[3].slam();
          },
        },
        {
          say: 'Here is a subtle one. Goldbach’s conjecture is a proposition even though nobody knows yet whether it is true: it is one or the other, we just haven’t found out.',
          do: async (s, o) => {
            await o.rows[4].fadeIn();
            await o.stamps[4].slam();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'connectives',
      title: 'Not, and, or',
      scene(s) {
        const t = s.truthTable({
          x: 355,
          y: 300,
          size: 34,
          vars: ['p', 'q'],
          cols: [
            { tex: '\\neg p', key: 'not', fn: (v) => !v.p },
            { tex: 'p \\land q', key: 'and', fn: (v) => v.p && v.q },
            { tex: 'p \\lor q', key: 'or', fn: (v) => v.p || v.q },
          ],
          visible: false,
        });
        const note = (str, y) => s.text(str, { x: 685, y, size: 30, anchor: [0, 0.5], align: 'left', visible: false });
        const notes = [note('$\\neg p$: flips $p$', 220), note('$p \\land q$: both true', 300), note('$p \\lor q$: at least one', 380)];
        return { t, notes };
      },
      steps: [
        {
          say: 'A truth table lists every way to assign true and false to the variables. Two variables give four rows, always in this order: $p${p} is true, true, false, false, and $q${q} alternates.',
          do: async (s, o) => {
            await o.t.fadeIn();
            await o.t.highlightCol('p', 'blue');
            await o.t.highlightCol('q', 'blue');
            await o.t.clear();
          },
        },
        {
          say: 'Not p, written $\\neg p${not p}, flips the truth value: true becomes false and false becomes true.',
          do: async (s, o) => {
            await o.t.fillColumn('not');
            await o.notes[0].fadeIn({ shift: [-12, 0] });
          },
        },
        {
          say: 'And, $p \\land q${p and q}, is true only when both $p${p} and $q${q} are true. That happens in exactly one row, the top one.',
          do: async (s, o) => {
            await o.t.fillColumn('and');
            await o.t.highlightCell(0, 'and', 'green');
            await o.notes[1].fadeIn({ shift: [-12, 0] });
          },
        },
        {
          say: 'Or, $p \\lor q${p or q}, is inclusive: it is true when at least one side is true, and false only in the bottom row, where both are false.',
          do: async (s, o) => {
            await o.t.fillColumn('or');
            await o.t.highlightCell(3, 'or', 'red');
            await o.notes[2].fadeIn({ shift: [-12, 0] });
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-inclusive-or',
      kind: 'try',
      title: 'Your turn',
      say: 'Pause and try this one. Work out each piece first, then use the table.',
      prompt: 'Let $p$ be “$5 > 3$” and $q$ be “$5$ is even”. What are the truth values of $p \\lor q$ and $p \\land q$?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '$p \\lor q$ is true, $p \\land q$ is false', why: '$p$ is true, which is enough for “or”; $q$ is false, which breaks “and”.' },
        { id: 'b', label: 'Both are false', why: '$p$ alone already makes $p \\lor q$ true.' },
        { id: 'c', label: 'Both are true', why: '“And” needs $q$ too, and $5$ is odd.' },
        { id: 'd', label: '$p \\lor q$ is false, $p \\land q$ is true', why: 'If “and” were true, both sides would be true, so “or” would be true as well.' },
      ],
      hint: 'Find the truth value of each piece first: is $5 > 3$? Is $5$ even?',
      solution: ['$p$ is true ($5 > 3$) and $q$ is false ($5$ is odd).', 'Row $\\mathrm{T}\\,\\mathrm{F}$ of the table gives $p \\lor q = \\mathrm{T}$ and $p \\land q = \\mathrm{F}$.'],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'xor',
      title: 'Exclusive or',
      scene(s) {
        const t = s.truthTable({
          x: 480,
          y: 230,
          size: 38,
          vars: ['p', 'q'],
          cols: [
            { tex: 'p \\lor q', key: 'or', fn: (v) => v.p || v.q },
            { tex: 'p \\oplus q', key: 'xor', fn: (v) => v.p !== v.q },
          ],
        });
        const formula = s.tex('p \\oplus q \\equiv (p \\lor q) \\land \\neg(p \\land q)', { y: 470, size: 40, visible: false });
        const rule = s.text('In this course, “or” always means inclusive or.', { y: 545, size: 30, color: C.blue, visible: false });
        return { t, formula, rule };
      },
      steps: [
        {
          say: 'Here is inclusive or again. The waiter’s “exactly one” is a different connective, exclusive or, written $p \\oplus q${p x-or q}.',
          do: async (s, o) => {
            await o.t.revealCol('or');
            await o.t.fillColumn('xor');
          },
        },
        {
          say: 'The two columns agree everywhere except the top row: when both are true, “or” says true and “exclusive or” says false.',
          do: async (s, o) => {
            o.box = s.ring(pairBox(o.t, 0, 'or', 'xor'), { color: 'yellow', shape: 'box' });
            await o.box;
          },
        },
        {
          say: 'You can build it from the others: $p \\oplus q${p x-or q} means p or q, and not both. In this course “or” always means inclusive, unless we say “exactly one”.',
          do: async (s, o) => {
            await o.formula.write({ duration: 1300 });
            await o.rule.fadeIn();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'compound',
      title: 'Evaluating a compound proposition',
      scene(s) {
        const t = s.truthTable({
          x: 368,
          y: 300,
          size: 30,
          show: 'headers',
          vars: ['p', 'q', 'r'],
          cols: [
            { tex: 'p \\lor q', key: 'or', fn: (v) => v.p || v.q },
            { tex: '\\neg r', key: 'notr', fn: (v) => !v.r },
            { tex: '(p \\lor q) \\land \\neg r', key: 'main', fn: (v) => (v.p || v.q) && !v.r },
          ],
          visible: false,
        });
        const note = (str, y) => s.text(str, { x: 712, y, size: 30, anchor: [0, 0.5], align: 'left', color: C.muted, visible: false });
        const notes = [note('$2^3 = 8$ rows', 200), note('1. inside out', 300), note('2. then $\\land$', 400), note('$\\neg$ binds tightest', 500)];
        return { t, notes };
      },
      steps: [
        {
          say: 'Let’s evaluate $(p \\lor q) \\land \\neg r${p or q, and not r}. Three variables give $2^3 = 8${two cubed, eight} rows.',
          do: async (s, o) => {
            await o.t.fadeIn();
            await o.t.highlightCol('main', 'yellow');
            await o.notes[0].fadeIn();
          },
        },
        {
          say: 'To list them, halve the pattern in each column: $p${p} gets four trues then four falses, $q${q} two and two, and $r${r} alternates.',
          do: async (s, o) => {
            await o.t.fillColumn('p', { gap: 90 });
            await o.t.fillColumn('q', { gap: 90 });
            await o.t.fillColumn('r', { gap: 90 });
          },
        },
        {
          say: 'Now build helper columns from the inside out: first $p \\lor q${p or q}, then $\\neg r${not r}. One convention: not binds tightest, so $\\neg p \\lor q${not p or q} means not p, then or q.',
          do: async (s, o) => {
            await o.notes[1].fadeIn();
            await o.t.fillColumn('or', { gap: 120 });
            await o.t.fillColumn('notr', { gap: 120 });
            await o.notes[3].fadeIn();
          },
        },
        {
          say: 'Finally combine them with the main connective, “and”. It is true exactly when both helper columns are true: in three of the eight rows.',
          do: async (s, o) => {
            await o.notes[2].fadeIn();
            await s.all(o.t.highlightCol('or', 'blue'), o.t.highlightCol('notr', 'blue'));
            await o.t.fillColumn('main', { gap: 120 });
            await s.all([0, 1, 2, 3, 4, 5, 6, 7].map((i) => o.t.markRow(i, o.t.value(i, 'main') ? '✓' : '✗')));
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-row',
      kind: 'blanks',
      title: 'Fill in the row',
      say: 'Your turn to fill in two rows of that table. Work inside out.',
      prompt: 'Each row is an assignment of $(p, q, r)$. Fill in the helper columns, then the main column.',
      lines: [
        ['(p, q, r) = (\\mathrm{F}, \\mathrm{T}, \\mathrm{F}):\\quad p \\lor q = ', { id: 'a1', chips: [T, F], answer: T }, ',\\quad \\neg r = ', { id: 'a2', chips: [T, F], answer: T }],
        ['(p \\lor q) \\land \\neg r = ', { id: 'a3', chips: [T, F], answer: T, hint: '“And” is true when both helper values are true.' }],
        ['(p, q, r) = (\\mathrm{T}, \\mathrm{F}, \\mathrm{T}):\\quad p \\lor q = ', { id: 'b1', chips: [T, F], answer: T }, ',\\quad \\neg r = ', { id: 'b2', chips: [T, F], answer: F, hint: '$r$ is true here, so $\\neg r$ is false.' }],
        ['(p \\lor q) \\land \\neg r = ', { id: 'b3', chips: [T, F], answer: F, hint: 'One false side makes “and” false.' }],
      ],
      solution: [
        'Row $(\\mathrm{F}, \\mathrm{T}, \\mathrm{F})$: $p \\lor q = \\mathrm{T}$ because $q$ is true; $\\neg r = \\mathrm{T}$ because $r$ is false; both sides of “and” are true, so the whole thing is $\\mathrm{T}$.',
        'Row $(\\mathrm{T}, \\mathrm{F}, \\mathrm{T})$: $p \\lor q = \\mathrm{T}$ because $p$ is true; $\\neg r = \\mathrm{F}$; “and” needs both sides, so the whole thing is $\\mathrm{F}$.',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'tautology',
      title: 'Tautologies and contradictions',
      scene(s) {
        const t = s.truthTable({
          x: 480,
          y: 190,
          size: 40,
          vars: ['p'],
          cols: [
            { tex: '\\neg p', key: 'not', fn: (v) => !v.p },
            { tex: 'p \\lor \\neg p', key: 'taut', fn: (v) => v.p || !v.p },
            { tex: 'p \\land \\neg p', key: 'contra', fn: (v) => v.p && !v.p },
          ],
        });
        const goal = s.tex('\\text{assume } \\neg q \\;\\Longrightarrow\\; \\cdots \\;\\Longrightarrow\\; \\part{c}{r \\land \\neg r}', { y: 500, size: 40, visible: false });
        return { t, goal };
      },
      steps: [
        {
          say: 'One variable, two rows. A tautology is a proposition that is true in every row, like $p \\lor \\neg p${p or not p}.',
          do: async (s, o) => {
            await o.t.fillColumn('not', { gap: 160 });
            await o.t.fillColumn('taut', { gap: 220 });
            await o.t.highlightCol('taut', 'green');
            const b = o.t.colBox('taut');
            o.tLabel = s.text('tautology', { x: b.cx, y: b.y + b.h + 36, size: 30, color: C.green, weight: 600, visible: false });
            await o.tLabel.fadeIn({ shift: [0, -10] });
          },
        },
        {
          say: 'A contradiction is false in every row, like $p \\land \\neg p${p and not p}: nothing is both true and false.',
          do: async (s, o) => {
            await o.t.fillColumn('contra', { gap: 220 });
            await o.t.highlightCol('contra', 'red');
            const b = o.t.colBox('contra');
            o.cLabel = s.text('contradiction', { x: b.cx, y: b.y + b.h + 36, size: 30, color: C.red, weight: 600, visible: false });
            await o.cLabel.fadeIn({ shift: [0, -10] });
          },
        },
        {
          say: 'Contradictions matter because a proof by contradiction aims to reach one: assume the opposite of what you want, and derive something of the form $r \\land \\neg r${r and not r}.',
          do: async (s, o) => {
            await o.goal.write({ duration: 1200 });
            await o.goal.color('c', C.red);
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'equivalence',
      title: 'Logical equivalence',
      scene(s) {
        const def = s.defCard({ y: 70, body: '$A \\equiv B$ means $A$ and $B$ have the same truth value in every row.', title: false, visible: false });
        const t = s.truthTable({
          x: 480,
          y: 275,
          size: 32,
          vars: ['p', 'q'],
          cols: [
            { tex: 'p \\land q', key: 'and', fn: (v) => v.p && v.q },
            { tex: '\\neg(p \\land q)', key: 'L', fn: (v) => !(v.p && v.q) },
            { tex: '\\neg p', key: 'np', fn: (v) => !v.p },
            { tex: '\\neg q', key: 'nq', fn: (v) => !v.q },
            { tex: '\\neg p \\lor \\neg q', key: 'R', fn: (v) => !v.p || !v.q },
          ],
          visible: false,
        });
        const eq = s.tex('\\neg(p \\land q) \\equiv \\neg p \\lor \\neg q', { y: 470, size: 40, color: C.green, visible: false });
        const bic = s.tex('\\bigl(\\neg(p \\land q)\\bigr) \\leftrightarrow \\bigl(\\neg p \\lor \\neg q\\bigr) \\text{ is a tautology}', { y: 548, size: 32, visible: false });
        return { def, t, eq, bic };
      },
      steps: [
        {
          say: 'Two propositions are logically equivalent when they have the same truth value in every row. We write $A \\equiv B${A is equivalent to B}.',
          do: (s, o) => o.def.reveal(),
        },
        {
          say: 'Let’s test $\\neg(p \\land q)${not, p and q}. Build $p \\land q${p and q} first, then negate it.',
          do: async (s, o) => {
            await o.t.fadeIn();
            await o.t.fillColumn('and', { gap: 160 });
            await o.t.fillColumn('L', { gap: 160 });
          },
        },
        {
          say: 'Now the other side, $\\neg p \\lor \\neg q${not p or not q}: negate each letter, then take “or”.',
          do: async (s, o) => {
            await o.t.fillColumn('np', { gap: 110 });
            await o.t.fillColumn('nq', { gap: 110 });
            await o.t.fillColumn('R', { gap: 160 });
          },
        },
        {
          say: 'Compare the two final columns row by row. They agree in all four rows, so the two propositions are equivalent.',
          do: async (s, o) => {
            await s.all(o.t.highlightCol('L', 'green'), o.t.highlightCol('R', 'green'));
            for (let i = 0; i < 4; i++) await o.t.markRow(i, '✓');
            await o.eq.write({ duration: 1000 });
          },
        },
        {
          say: 'Another way to say the same thing: $A \\equiv B${A is equivalent to B} exactly when $A \\leftrightarrow B${A if and only if B} is a tautology.',
          do: (s, o) => o.bic.fadeIn(),
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'de-morgan',
      title: 'De Morgan’s laws',
      scene(s) {
        const size = 44;
        const row = (list, x, y) => s.symbols(list, { x, y, size, visible: false });
        const L1 = ['\\neg', '(', 'p', '\\;\\land\\;', 'q', ')'];
        const L2 = ['\\neg', '(', 'p', '\\;\\lor\\;', 'q', ')'];
        const o = {
          l1: row(L1, 250, 95),
          m1: row(L1, 250, 95),
          r1: row(['\\neg', 'p', '\\;\\lor\\;', '\\neg', 'q'], 700, 95),
          e1: s.tex('\\equiv', { x: 470, y: 95, size, visible: false }),
          l2: row(L2, 250, 185),
          m2: row(L2, 250, 185),
          r2: row(['\\neg', 'p', '\\;\\land\\;', '\\neg', 'q'], 700, 185),
          e2: s.tex('\\equiv', { x: 470, y: 185, size, visible: false }),
        };
        o.english = s.text('“not both rich and famous” = “not rich, or not famous”', { y: 285, size: 30, font: 'serif', italic: true, visible: false });
        o.wrong = s.tex('\\neg(p \\land q) \\equiv \\neg p \\part{op}{\\land} \\neg q', { y: 390, size: 44, visible: false });
        o.row = s.tex('p = \\mathrm{T},\\ q = \\mathrm{F}:\\quad \\neg(p \\land q) = \\mathrm{T},\\quad \\neg p \\land \\neg q = \\mathrm{F}', {
          y: 465,
          size: 32,
          color: C.red,
          visible: false,
        });
        o.verdict = s.stamp('not equivalent', { x: 480, y: 532, color: 'red', size: 30 });
        return o;
      },
      steps: [
        {
          say: 'De Morgan’s laws tell us how to negate “and”. The negation slides inside, onto each letter, and the “and” turns into “or”.',
          do: async (s, o) => {
            await s.all(o.l1.map((m, i) => m.fadeIn({ delay: i * 70 })));
            await o.e1.fadeIn();
            o.m1.forEach((m) => m.show());
            await deMorgan(s, o.m1, o.r1, '\\;\\lor\\;');
          },
        },
        {
          say: 'Negating “or” works the same way, with the roles swapped: not, p or q, is equivalent to not p and not q.',
          do: async (s, o) => {
            await s.all(o.l2.map((m, i) => m.fadeIn({ delay: i * 70 })));
            await o.e2.fadeIn();
            o.m2.forEach((m) => m.show());
            await deMorgan(s, o.m2, o.r2, '\\;\\land\\;');
          },
        },
        {
          say: 'In English: “not both rich and famous” means “not rich, or not famous”. Someone rich but unknown is not both.',
          do: (s, o) => o.english.fadeIn(),
        },
        {
          say: 'The most common logic error is to keep the “and”, like this. One row is enough to kill it.',
          do: async (s, o) => {
            await o.wrong.write({ duration: 1000 });
            await s.ring([o.wrong, 'op'], { color: 'red' });
          },
        },
        {
          say: 'Take $p${p} true and $q${q} false. The left side is true, the right side is false, so they are not equivalent.',
          do: async (s, o) => {
            await o.row.fadeIn();
            await s.strike(o.wrong, { width: 5 });
            await o.verdict.slam();
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'try-negate-and',
      kind: 'try',
      title: 'Negate it',
      say: 'Now you negate one. Watch the word “and”, and watch what “not positive” really means.',
      prompt: 'Negate: “$x$ is positive and $x$ is an integer.”',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: '$x$ is not positive and $x$ is not an integer.', why: 'That is $\\neg p \\land \\neg q$. De Morgan switches “and” to “or”.' },
        { id: 'b', label: '$x$ is not positive or $x$ is not an integer.', why: 'De Morgan: $\\neg(p \\land q) \\equiv \\neg p \\lor \\neg q$.' },
        { id: 'c', label: '$x$ is negative or $x$ is not an integer.', why: '“Not positive” also includes $0$: it means $x \\le 0$, not $x < 0$.' },
        { id: 'd', label: '$x$ is positive or $x$ is an integer.', why: 'That drops the negation entirely.' },
      ],
      hint: 'Use De Morgan: $\\neg(p \\land q) \\equiv\\ ?$',
      solution: [
        'By De Morgan, $\\neg(p \\land q) \\equiv \\neg p \\lor \\neg q$: “$x$ is not positive or $x$ is not an integer.”',
        'The negation of “positive” is “not positive”, that is $x \\le 0$. It is not “negative”, which would leave out $x = 0$.',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'laws',
      title: 'An algebra of propositions',
      scene(s) {
        const laws = [
          ['commutative', 'p \\land q \\equiv q \\land p'],
          ['associative', '(p \\land q) \\land r \\equiv p \\land (q \\land r)'],
          ['distributive', 'p \\land (q \\lor r) \\equiv (p \\land q) \\lor (p \\land r)'],
          ['identity', 'p \\land \\mathrm{T} \\equiv p'],
          ['domination', 'p \\lor \\mathrm{T} \\equiv \\mathrm{T}'],
          ['complement', 'p \\lor \\neg p \\equiv \\mathrm{T}'],
          ['double negation', '\\neg\\neg p \\equiv p'],
          ['De Morgan', '\\neg(p \\lor q) \\equiv \\neg p \\land \\neg q'],
          ['absorption', 'p \\lor (p \\land q) \\equiv p'],
        ].map(([name, tex], i) => {
          const y = 50 + i * 56;
          return {
            name,
            label: s.text(name, { x: 290, y, size: 30, anchor: [1, 0.5], color: C.purple, visible: false }),
            tex: s.tex(tex, { x: 320, y, size: 32, anchor: [0, 0.5], visible: false }),
          };
        });
        const dual = s.text('Each law also holds with $\\land$, $\\lor$ swapped and $\\mathrm{T}$, $\\mathrm{F}$ swapped.', { x: 480, y: 548, size: 30, color: C.muted, visible: false });
        const p = s.proof({ x: 319, y: 40, width: 590, height: 450, size: 30, numbered: false, visible: false });
        const beats = s.text('$n$ variables: a table needs $2^n$ rows.', { y: 520, size: 30, color: C.blue, visible: false });
        return { laws, dual, p, beats };
      },
      steps: [
        {
          say: 'Each of these laws is a small truth-table fact, checked once and reused forever. Each one also holds if you swap “and” with “or” and true with false at the same time.',
          do: async (s, o) => {
            await s.all(o.laws.map((l, i) => s.all(l.label.fadeIn({ delay: i * 130, shift: [-10, 0] }), l.tex.fadeIn({ delay: i * 130 + 60, shift: [-10, 0] }))));
            await o.dual.fadeIn();
          },
        },
        {
          say: 'With them we can prove an equivalence without a table. We will simplify the expression not, p or not q, all or q, using four of these laws, which we keep on the side.',
          do: async (s, o) => {
            const used = ['De Morgan', 'double negation', 'commutative', 'absorption'];
            o.used = Object.fromEntries(used.map((n) => [n, o.laws.find((l) => l.name === n)]));
            await s.all(o.laws.filter((l) => used.includes(l.name)).map((l) => l.tex.indicate({ duration: 900 })));
            await s.all(
              o.laws.filter((l) => !used.includes(l.name)).flatMap((l, i) => [l.label.fadeOut({ delay: i * 40, shift: [0, -20] }), l.tex.fadeOut({ delay: i * 40, shift: [0, -20] })]),
              o.dual.fadeOut(),
            );
            await s.all(
              used.map((n, j) => {
                const l = o.used[n];
                const y = 75 + j * 110;
                return s.all(
                  l.label.animate({ x: 628 + 0.94 * l.label.box().w, y, scale: 0.94 }, { duration: 800 }),
                  l.tex.animate({ x: 628, y: y + 40, scale: 0.94 }, { duration: 800 }),
                  l.label.recolor(C.muted),
                  l.tex.recolor(C.muted),
                );
              }),
            );
            o.p.show();
            await o.p.add('\\neg(p \\lor \\neg q) \\lor q', { tex: true, why: 'start', kind: 'assume' });
          },
        },
        {
          say: 'De Morgan pushes the negation inside: not, p or not q, becomes not p and not not q.',
          do: (s, o) => s.all(o.p.add('\\equiv (\\neg p \\land \\neg\\neg q) \\lor q', { tex: true, why: 'De Morgan' }), o.used['De Morgan'].tex.indicate({ duration: 900 })),
        },
        {
          say: 'Double negation cancels the two nots in front of $q${q}.',
          do: (s, o) => s.all(o.p.add('\\equiv (\\neg p \\land q) \\lor q', { tex: true, why: 'double negation' }), o.used['double negation'].tex.indicate({ duration: 900 })),
        },
        {
          say: 'Commutativity lets us reorder, twice, until the expression has the shape of absorption: q or, q and something.',
          do: (s, o) => s.all(o.p.add('\\equiv q \\lor (q \\land \\neg p)', { tex: true, why: 'commutative' }), o.used.commutative.tex.indicate({ duration: 900 })),
        },
        {
          say: 'Absorption finishes it: the whole thing is equivalent to just $q${q}. Every step names its law, exactly like a proof.',
          do: async (s, o) => {
            await s.all(o.p.add('\\equiv q', { tex: true, why: 'absorption', kind: 'conclude' }), o.used.absorption.tex.indicate({ duration: 900 }));
            await o.p.qed();
          },
        },
        {
          say: 'With many variables this beats a table: ten variables would need $2^{10} = 1024${two to the ten, one thousand twenty four} rows.',
          do: (s, o) => o.beats.fadeIn(),
        },
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-equiv',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Show this equivalence with the laws of logic, and name the law at every step.',
      prompt: 'Using the laws of logic (name each one), show that $(p \\land q) \\lor (\\neg p \\land q) \\equiv q$.',
      answer: { type: 'proof' },
      hints: ['Both terms contain $q$: put it first in each, then factor it out.', 'Which law turns $p \\lor \\neg p$ into something simple? And what is $q \\land \\mathrm{T}$?'],
      solution: [
        '**Proof.**',
        '$(p \\land q) \\lor (\\neg p \\land q) \\equiv (q \\land p) \\lor (q \\land \\neg p)$ (commutative)',
        '$\\equiv q \\land (p \\lor \\neg p)$ (distributive, read right to left)',
        '$\\equiv q \\land \\mathrm{T}$ (complement)',
        '$\\equiv q$ (identity). ∎',
      ],
      rubric: [
        'Uses a valid method: a chain of named laws of logic, or a full truth table with all four rows of $(p, q)$.',
        'Each step is correct: every law is applied in the right direction (e.g. distributive to factor out $q$, complement $p \\lor \\neg p \\equiv \\mathrm{T}$), or every table entry is computed correctly.',
        'The two sides are actually compared: the chain ends exactly at $q$, or the final column of the left side matches the $q$ column in every row.',
        'The conclusion states the equivalence $(p \\land q) \\lor (\\neg p \\land q) \\equiv q$.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-equivalence',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain equivalence back to me in your own words.',
      prompt: 'What does it mean for two propositions to be logically equivalent, and how would you show that two propositions are *not* equivalent?',
      points: [
        'They have the same truth value under every assignment of truth values to the variables.',
        'A truth table compares the final columns row by row (or a chain of named laws turns one into the other).',
        'To show they are not equivalent, one assignment where they differ is enough.',
        'Example: $\\neg(p \\land q)$ and $\\neg p \\land \\neg q$ differ at $p = \\mathrm{T}, q = \\mathrm{F}$.',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• A proposition is true or false; $\\neg$, $\\land$, $\\lor$, $\\oplus$ build bigger ones.', 120),
          recapItem(s, '• Truth tables: $2^n$ rows, filled inside out.', 225),
          recapItem(s, '• Equivalent = same final column. De Morgan: negating flips $\\land$ and $\\lor$.', 330),
          recapItem(s, 'Next: “if … then”, the connective every theorem is built on.', 470, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'A proposition is a sentence that is true or false, and the connectives not, and, or, and exclusive or build bigger ones out of smaller ones.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'A truth table checks every row, two to the n of them, built from the inside out.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Equivalent means the same final column, and De Morgan’s laws say that negation flips “and” and “or”.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: “if, then”, the connective that every theorem is built on.',
          do: (s, o) => o.items[3].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
