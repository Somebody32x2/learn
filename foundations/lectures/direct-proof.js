/**
 * Lecture 6 · Definitions and direct proof (foundations/PLAN.md § 6). Irani · Proofs.
 *
 * Choreography: definitions are purple cards (s.defCard) whose existential part ("for some k ∈ ℤ") gets ringed;
 * scratch work lives in a dashed, muted pane (s.scratch; forwards from the hypothesis in blue, backwards from the
 * goal in green, meeting in yellow); the written proof is a `s.proof` whose justification column fills in as it is
 * explained. Wrong proofs are written out first, then ringed and struck in red (s.ring, s.strike, s.stamp).
 */
import { C } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- local helpers

/** A definition card holding pure TeX, no heading (four of them stack on one slide). */
const texCard = (s, tex, y) => s.defCard({ y, tex, title: false, visible: false });

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

// ---------------------------------------------------------------- lecture

export default {
  id: 'direct-proof',
  title: 'Definitions and direct proof',
  goals: [
    'State the definitions of even, odd, divides and rational exactly, and use them to unpack and repack',
    'Structure a direct proof of $\\forall x\\,(P(x) \\to Q(x))$',
    'Separate scratch work (finding the proof) from the written proof',
    'Avoid the classic errors: reusing a witness name, proof by example, arguing from the conclusion',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'definitions',
      title: 'The definitions we’ll use',
      scene(s) {
        const cards = [
          texCard(s, 'n \\in \\mathbb{Z} \\text{ is } \\textbf{even} \\iff n = 2k \\text{ for } \\part{ex}{\\text{some } k \\in \\mathbb{Z}}', 70),
          texCard(s, 'n \\in \\mathbb{Z} \\text{ is } \\textbf{odd} \\iff n = 2k + 1 \\text{ for } \\part{ex}{\\text{some } k \\in \\mathbb{Z}}', 165),
          texCard(s, 'a, b \\in \\mathbb{Z}:\\quad \\part{bar}{a \\mid b} \\iff b = ak \\text{ for } \\part{ex}{\\text{some } k \\in \\mathbb{Z}}', 260),
          texCard(s, 'x \\text{ is } \\textbf{rational} \\iff x = p/q \\text{ for } \\part{ex}{\\text{some } p, q \\in \\mathbb{Z}},\\ q \\ne 0', 355),
        ];
        const stmt = s.tex('3 \\mid 12 \\text{ is a statement: true or false}', { x: 480, y: 470, size: 34, visible: false });
        const num = s.tex('12 / 3 \\text{ is a number (it equals } 4)', { x: 480, y: 540, size: 34, visible: false });
        return { cards, stmt, num };
      },
      steps: [
        {
          say: 'A proof can only use what the words mean, so before we prove anything we fix the meanings. An integer $n${n} is even when $n = 2k${n equals two k} for some integer $k${k}.',
          do: (s, o) => o.cards[0].reveal(),
        },
        {
          say: 'It is odd when $n = 2k + 1${n equals two k plus one} for some integer $k${k}.',
          do: (s, o) => o.cards[1].reveal(),
        },
        {
          say: 'For integers a and b, $a \\mid b${a divides b} means $b = ak${b equals a k} for some integer $k${k}.',
          do: (s, o) => o.cards[2].reveal(),
        },
        {
          say: 'And a real number $x${x} is rational when $x = p/q${x equals p over q} for some integers $p${p} and $q${q}, with $q \\ne 0${q not zero}.',
          do: (s, o) => o.cards[3].reveal(),
        },
        {
          say: 'Notice that every one of them is an existential statement: there is an integer $k${k} that does the job. That integer is called a witness.',
          do: async (s, o) => {
            await s.all(o.cards.map((c) => s.ring([c, 'ex'], { color: 'yellow', shape: 'box' })));
          },
        },
        {
          say: 'One warning about notation. $a \\mid b${a divides b} is a statement, true or false, while $a / b${a over b} is a number. Never write one where you mean the other.',
          do: async (s, o) => {
            await s.ring([o.cards[2], 'bar'], { color: 'blue' });
            await o.stmt.fadeIn();
            await o.num.fadeIn();
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'unpacking',
      title: 'Unpack and repack',
      scene(s) {
        const row = (left, right, y) => ({
          left: s.text(left, { x: 190, y, size: 34, visible: false }),
          right: s.tex(right, { x: 745, y, size: 38, visible: false }),
        });
        const rows = [
          row('$14$ is even', '14 = 2 \\cdot \\part{w}{7}', 105),
          row('$-7$ is odd', '-7 = 2 \\cdot (\\part{w}{-4}) + 1', 235),
          row('$3 \\mid 12$', '12 = 3 \\cdot \\part{w}{4}', 365),
        ];
        const arrow = (y, dir, color, label) => {
          const [x1, x2] = dir > 0 ? [320, 520] : [520, 320];
          return {
            a: s.arrow(x1, y, x2, y, { color, width: 4, visible: false }),
            t: s.text(label, { x: 420, y: y - 32, size: 30, color, weight: 600, visible: false }),
          };
        };
        const arrows = [arrow(105, 1, C.purple, 'unpack'), arrow(235, 1, C.purple, 'unpack'), arrow(365, -1, C.green, 'repack')];
        const bad = s.tex('7 = 2 \\cdot \\part{w}{3.5}', { x: 300, y: 500, size: 38, visible: false });
        const badWhy = s.text('$3.5 \\notin \\mathbb{Z}$: says nothing', { x: 680, y: 500, size: 30, color: C.red, visible: false });
        return { rows, arrows, bad, badWhy };
      },
      steps: [
        {
          say: 'To use a hypothesis, unpack it: turn the word into an equation with a named witness. Fourteen is even means $14 = 2 \\cdot 7${fourteen equals two times seven}, with witness seven.',
          do: async (s, o) => {
            const [r, a] = [o.rows[0], o.arrows[0]];
            await r.left.fadeIn();
            await s.all(a.a.draw(), a.t.fadeIn());
            await r.right.write();
            await s.ring([r.right, 'w'], { color: 'yellow' });
          },
        },
        {
          say: 'Minus seven is odd because $-7 = 2(-4) + 1${minus seven equals two times minus four, plus one}. The witness can be negative; it just has to be an integer.',
          do: async (s, o) => {
            const [r, a] = [o.rows[1], o.arrows[1]];
            await r.left.fadeIn();
            await s.all(a.a.draw(), a.t.fadeIn());
            await r.right.write();
            await s.ring([r.right, 'w'], { color: 'yellow' });
          },
        },
        {
          say: 'To reach a conclusion, go the other way and repack: exhibit the witness. Since $12 = 3 \\cdot 4${twelve equals three times four}, and four is an integer, three divides twelve.',
          do: async (s, o) => {
            const [r, a] = [o.rows[2], o.arrows[2]];
            await r.right.write();
            await s.ring([r.right, 'w'], { color: 'yellow' });
            await s.all(a.a.draw(), a.t.fadeIn());
            await r.left.fadeIn({ shift: [12, 0] });
          },
        },
        {
          say: 'The witness must be an integer, and you must say why it is. Writing seven as two times three and a half proves nothing about evenness.',
          do: async (s, o) => {
            await o.bad.write();
            await s.ring([o.bad, 'w'], { color: 'red' });
            await o.badWhy.fadeIn();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'structure',
      title: 'The shape of a direct proof',
      scene(s) {
        const thm = s.tex('\\textbf{Theorem.}\\ \\text{For all } n \\in \\mathbb{Z},\\ \\text{if } \\part{P}{P(n)} \\text{ then } \\part{Q}{Q(n)}.', { y: 55, size: 36, visible: false });
        const p = s.proof({ y: 115, width: 900, height: 440, size: 30 });
        return { thm, p };
      },
      steps: [
        {
          say: 'Here is the shape of almost every theorem: for all n, if P of n then Q of n. The first line of the proof introduces an arbitrary integer and assumes the hypothesis.',
          do: async (s, o) => {
            await o.thm.write({ duration: 1100 });
            await o.thm.color('P', C.blue);
            o.first = o.p.add('**Proof.** Let $n \\in \\mathbb{Z}$; suppose $P(n)$.', { kind: 'assume', why: 'hypothesis' });
            await o.first;
          },
        },
        {
          say: 'Before filling anything in, write the last line: the conclusion, in the words of the theorem. Now you know exactly where you are going.',
          do: async (s, o) => {
            await o.thm.color('Q', C.green);
            o.dots = o.p.add('$\\vdots$', { numbered: false });
            await o.dots;
            await o.p.add('Therefore $Q(n)$.', { kind: 'conclude', why: 'the goal' });
            await o.p.qed();
          },
        },
        {
          say: 'Then fill the middle from the top down. Unpack the hypothesis with its definition, and compute, giving a reason for every step.',
          do: async (s, o) => {
            const a = o.p.insertAfter(o.first, 'Unpack $P(n)$: an equation with a witness.', { why: 'definition' });
            await a;
            await o.p.insertAfter(a, 'Compute with it.', { why: 'algebra, earlier lines' });
          },
        },
        {
          say: 'The last middle step repacks: it puts the result in exactly the form the definition of Q asks for. That closes the gap between the blue line and the green one.',
          do: async (s, o) => {
            await o.p.highlight(o.dots, 'yellow');
            await o.p.replace(o.dots, 'Repack: this is the form $Q(n)$ needs.', { why: 'definition', numbered: true });
            await o.p.unhighlight(o.dots);
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-odd-def',
      kind: 'try',
      title: 'From the definition',
      say: 'Quick check. Which line proves, straight from the definition, that 2023 is odd?',
      prompt: 'Which line shows, directly from the definition, that $2023$ is odd?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '$2023 = 2 \\cdot 1011 + 1$, and $1011 \\in \\mathbb{Z}$', why: 'It names the witness $k = 1011$ and says it is an integer: exactly the definition.' },
        { id: 'b', label: '$2023 = 2 \\cdot 1011.5$', why: '$k$ must be an integer, and $2k$ is the form for even, not odd.' },
        { id: 'c', label: '“$2023$ is not divisible by $2$.”', why: 'True, but a different statement; equating it with “odd” needs the division algorithm.' },
        { id: 'd', label: '$2023 = 2 \\cdot 1012 - 1$', why: 'True, but not yet in the form $2k + 1$. Rewrite it as $2 \\cdot 1011 + 1$.' },
      ],
      hint: 'The definition says $n = 2k + 1$ with $k \\in \\mathbb{Z}$.',
      solution: ['(a): $2023 = 2 \\cdot 1011 + 1$ is the form $2k + 1$ with the witness $k = 1011$, and $1011 \\in \\mathbb{Z}$.'],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'scratch',
      title: 'Finding the proof',
      scene(s) {
        const thm = s.text('**Theorem.** If $n$ is an odd integer, then $n^2$ is odd.', { y: 52, size: 32, visible: false });
        const pane = s.scratch({ x: 40, y: 88, w: 880, h: 484, size: 36, visible: false });
        return { thm, pane };
      },
      steps: [
        {
          say: 'Let’s find a proof that the square of an odd integer is odd. Finding happens on scratch paper, and scratch work may go in any direction.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.pane.reveal();
          },
        },
        {
          say: 'Work forwards from what you know. $n${n} is odd, so $n = 2k + 1${n equals two k plus one} for some integer $k${k}.',
          do: (s, o) => o.pane.add('know: $n = 2k + 1$', { color: 'blue' }),
        },
        {
          say: 'Square it: $(2k + 1)^2 = 4k^2 + 4k + 1${two k plus one, squared, equals four k squared plus four k plus one}.',
          do: (s, o) => o.pane.add('$n^2 = (2k + 1)^2 = 4k^2 + 4k + 1$', { indent: 1 }),
        },
        {
          say: 'Now work backwards from what you want. To call $n^2${n squared} odd, we must write it as two times some integer, plus one. What goes in the question mark?',
          do: (s, o) => o.pane.add('want: $n^2 = 2(\\,?\\,) + 1$', { color: 'green' }),
        },
        {
          say: 'Meet in the middle: factor a two out of the first two terms. The question mark is $2k^2 + 2k${two k squared plus two k}.',
          do: async (s, o) => {
            await o.pane.add('$n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1$', { color: 'yellow', indent: 1 });
            await o.pane.add('so the $?$ is $2k^2 + 2k$, an integer', { color: 'green' });
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'write-proof',
      title: 'Writing it up',
      scene(s) {
        const idea = s.tex('\\text{scratch: } n^2 = 2(2k^2 + 2k) + 1', { y: 50, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 85, width: 900, height: 485, size: 31 });
        return { idea, p };
      },
      steps: [
        {
          say: 'Now we write it, forwards only. Introduce the object and the hypothesis, then unpack it with the definition of odd.',
          do: async (s, o) => {
            await o.idea.fadeIn();
            await o.p.add('**Proof.** Let $n$ be an odd integer.', { kind: 'assume', why: 'hypothesis' });
            await o.p.add('Then $n = 2k + 1$ for some $k \\in \\mathbb{Z}$.', { why: 'definition of odd' });
          },
        },
        {
          say: 'Compute. This is the line our scratch work found.',
          do: async (s, o) => {
            await o.p.add('So $n^2 = 4k^2 + 4k + 1$', { why: 'algebra' });
            o.calc = o.p.add('$\\phantom{n^2} = 2(2k^2 + 2k) + 1$.', { why: 'factor out $2$', indent: 1 });
            await o.calc;
            await o.idea.indicate({ color: C.yellow });
          },
        },
        {
          say: 'Name the new witness and say why it is an integer: sums and products of integers are integers. This is the line students forget.',
          do: async (s, o) => {
            o.wit = o.p.add('Let $m = 2k^2 + 2k$. Then $m \\in \\mathbb{Z}$.', { why: '$\\mathbb{Z}$ is closed under $+$ and $\\times$' });
            await o.wit;
            await o.p.highlight(o.wit, 'yellow');
          },
        },
        {
          say: 'Repack with the definition of odd, and say it in the words of the theorem. Every line said why it was true.',
          do: async (s, o) => {
            await o.p.add('Therefore $n^2 = 2m + 1$ is odd.', { kind: 'conclude', why: 'definition of odd' });
            await o.p.qed();
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-sum-odd',
      kind: 'blanks',
      title: 'Sum of two odds',
      say: 'Fill in the missing pieces of this proof that the sum of two odd integers is even.',
      prompt: 'Complete the proof that the sum of two odd integers is even.',
      lines: [
        ['\\text{Let } m, n \\text{ be odd.}', '\\text{Then } m = 2a + 1', '\\text{and}\\;', { tex: 'n = 2\\,\\blank{w}\\, + 1', blanks: { w: { chips: ['a', 'b', 'k'], answer: 'b', hint: 'Each odd number gets its own witness.', width: 1.8 } } }, '\\text{for some } a, b \\in \\mathbb{Z}.'],
        ['\\text{So } m + n = 2a + 2b + 2 = ', { tex: '2(\\blank{s}).', blanks: { s: { chips: ['a + b + 1', 'a + b', '2ab + 1'], answer: 'a + b + 1', hint: 'Factor 2 out of every term, including the last 2.' } } }],
        ['\\text{Since } a + b + 1 \\in ', { id: 'z', chips: ['\\mathbb{Z}', '\\mathbb{Q}', '\\mathbb{N}'], answer: '\\mathbb{Z}', hint: 'Even needs an integer witness, and $a + b + 1$ may be negative.' }, ',\\ m + n \\text{ is even.}'],
      ],
      solution: [
        'Each odd number gets its own witness: $m = 2a + 1$, $n = 2b + 1$. Reusing $a$ would force $m = n$.',
        '$m + n = 2a + 2b + 2 = 2(a + b + 1)$.',
        '$a + b + 1 \\in \\mathbb{Z}$ because integers are closed under addition. It need not be positive, so $\\mathbb{N}$ is wrong, and $\\mathbb{Q}$ is too weak for the definition of even.',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'same-k-error',
      title: 'The same-$k$ mistake',
      scene(s) {
        const head = s.text('A wrong proof that the sum of two odd integers is even:', { y: 48, size: 30, color: C.muted, visible: false });
        const a = s.tex('\\text{Let } m = 2\\part{k1}{k} + 1 \\text{ and } n = 2\\part{k2}{k} + 1.', { x: 375, y: 110, size: 36, visible: false });
        const b = s.tex('\\text{Then } m + n = 4k + 2 = 2(2k + 1).', { x: 375, y: 170, size: 36, visible: false });
        const why = s.text('one $k$ for both forces $m = n$: it never covers $3 + 5$', { x: 400, y: 235, size: 30, color: C.red, visible: false });
        const ex = s.text('“Proof”: $3 + 5 = 8$, which is even.', { x: 400, y: 335, size: 34, visible: false });
        const exWhy = s.text('one example says nothing about all odd integers', { x: 400, y: 395, size: 30, color: C.red, visible: false });
        const s1 = s.stamp('not a proof', { x: 822, y: 140, color: 'red', size: 30 });
        const s2 = s.stamp('not a proof', { x: 822, y: 335, color: 'red', size: 30 });
        const fix = s.tex('\\text{Fix: } m = 2\\part{a}{a} + 1,\\ \\ n = 2\\part{b}{b} + 1 \\quad (\\text{fresh letters})', { y: 510, size: 34, color: C.green, visible: false });
        return { head, a, b, why, ex, exWhy, s1, s2, fix };
      },
      steps: [
        {
          say: 'Here is a proof that looks fine at first glance. Read it carefully: the same letter $k${k} names both witnesses.',
          do: async (s, o) => {
            await o.head.fadeIn();
            await o.a.write();
            await o.b.write();
            await s.all(s.ring([o.a, 'k1'], { color: 'red' }), s.ring([o.a, 'k2'], { color: 'red' }));
          },
        },
        {
          say: 'Using one letter for two witnesses silently assumes $m = n${m equals n}. It proves the claim only for adding an odd number to itself.',
          do: async (s, o) => {
            await o.why.fadeIn();
            await s.all(s.strike(o.a), s.strike(o.b));
            await o.s1.slam();
          },
        },
        {
          say: 'Checking an example is not a proof either: three plus five tells you about three and five, and nothing about every odd integer.',
          do: async (s, o) => {
            await o.ex.fadeIn();
            await o.exWhy.fadeIn();
            await s.strike(o.ex);
            await o.s2.slam();
          },
        },
        {
          say: 'In this course both of these get zero credit. The fix is cheap: a fresh letter for every witness.',
          do: async (s, o) => {
            await o.fix.write({ duration: 1100 });
            await s.all(o.fix.color('a', C.blue), o.fix.color('b', C.teal));
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'divides-transitive',
      title: 'Divisibility is transitive',
      scene(s) {
        const thm = s.text('**Theorem.** For $a, b, c \\in \\mathbb{Z}$: if $a \\mid b$ and $b \\mid c$, then $a \\mid c$.', { y: 50, size: 32, visible: false });
        const pad = s.scratch({ x: 40, y: 85, w: 880, h: 330, visible: false });
        const strip = s.tex('\\text{scratch: } c = (ak)\\ell = a(k\\ell)', { y: 95, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 130, width: 900, height: 440, size: 31, visible: false });
        return { thm, pad, strip, p };
      },
      steps: [
        {
          say: 'Two hypotheses mean two witnesses, with two different names: $b = ak${b equals a k} and $c = b\\ell${c equals b ell}.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.pad.reveal();
            await o.pad.add('b = ak', { color: 'blue' });
            await o.pad.add('c = b\\ell', { color: 'blue' });
          },
        },
        {
          say: 'Substitute the first into the second: $c = (ak)\\ell = a(k\\ell)${c equals a k, times ell, which is a times k ell}. So $k\\ell${k ell} is the witness we need.',
          do: async (s, o) => {
            await o.pad.add('c = (ak)\\ell = a(k\\ell)', { color: 'yellow' });
          },
        },
        {
          say: 'Now the written proof. The scratch page folds away to one line; the proof starts from the hypotheses and unpacks both with different letters.',
          do: async (s, o) => {
            await o.pad.fadeOut({ shift: [-30, 0] });
            await o.strip.fadeIn();
            o.p.show();
            await o.p.add('**Proof.** Let $a, b, c \\in \\mathbb{Z}$ with $a \\mid b$ and $b \\mid c$.', { kind: 'assume', why: 'hypotheses' });
            await o.p.add('Then $b = ak$ and $c = b\\ell$ for some $k, \\ell \\in \\mathbb{Z}$.', { why: 'definition of divides' });
          },
        },
        {
          say: 'Substitute, then repack with the witness $k\\ell${k ell}, an integer because a product of integers is an integer.',
          do: async (s, o) => {
            await o.p.add('So $c = (ak)\\ell = a(k\\ell)$.', { why: 'substitution' });
            await o.p.add('Therefore $a \\mid c$, since $c = a(k\\ell)$ and $k\\ell \\in \\mathbb{Z}$.', { kind: 'conclude', why: 'closure; def. of divides' });
            await o.p.qed();
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'try-counterexample-divides',
      kind: 'try',
      title: 'Find a counterexample',
      say: 'Not every statement that sounds right is true. Find a counterexample to this one.',
      prompt: '“For all integers $a, b, c$: if $a \\mid bc$, then $a \\mid b$ or $a \\mid c$.” Which triple $(a, b, c)$ is a counterexample?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '$(6, 2, 3)$', why: '$6 \\mid 6$, but $6 \\nmid 2$ and $6 \\nmid 3$: true hypothesis, false conclusion.' },
        { id: 'b', label: '$(2, 4, 3)$', why: '$2 \\mid 4$, so the conclusion holds.' },
        { id: 'c', label: '$(3, 2, 5)$', why: '$3 \\nmid 10$, so the hypothesis fails; that is not a counterexample.' },
        { id: 'd', label: '$(5, 10, 1)$', why: '$5 \\mid 10$, so the conclusion holds.' },
      ],
      hint: 'A counterexample needs a true hypothesis and a false conclusion.',
      solution: [
        '$(6, 2, 3)$: $bc = 6$ and $6 \\mid 6$, yet $6 \\nmid 2$ and $6 \\nmid 3$.',
        'When $a$ is prime the statement is true: that is Euclid’s lemma (lecture 18).',
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'rational-sum',
      title: 'Sums of rationals',
      scene(s) {
        const thm = s.text('**Theorem.** If $x, y \\in \\mathbb{Q}$, then $x + y \\in \\mathbb{Q}$.', { y: 50, size: 32, visible: false });
        const p = s.proof({ y: 88, width: 900, height: 482, size: 30 });
        return { thm, p };
      },
      steps: [
        {
          say: 'Unpack both hypotheses, with four separate letters. Notice the definition hands us the facts $b \\ne 0${b is not zero} and $d \\ne 0${d is not zero} too.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.p.add('**Proof.** Let $x, y \\in \\mathbb{Q}$.', { kind: 'assume', why: 'hypothesis' });
            o.un = o.p.add('Then $x = a/b$, $y = c/d$ for some $a, b, c, d \\in \\mathbb{Z}$, $b \\ne 0$, $d \\ne 0$.', { why: 'definition of rational' });
            await o.un;
          },
        },
        {
          say: 'Compute with a common denominator. The numerator and the denominator are integers, because integers are closed under addition and multiplication.',
          do: async (s, o) => {
            await o.p.add('So $x + y = \\dfrac{ad + bc}{bd}$.', { why: 'algebra' });
            await o.p.add('$ad + bc \\in \\mathbb{Z}$ and $bd \\in \\mathbb{Z}$.', { why: 'closure of $\\mathbb{Z}$' });
          },
        },
        {
          say: 'Here is the step that is easy to forget: the denominator must not be zero, and we must say why. A product of nonzero numbers is nonzero.',
          do: async (s, o) => {
            o.nz = o.p.add('$bd \\ne 0$, since $b \\ne 0$ and $d \\ne 0$.', { why: 'nonzero times nonzero' });
            await o.nz;
            await o.p.highlight(o.nz, 'yellow');
            await o.p.highlight(o.un, 'blue');
          },
        },
        {
          say: 'Now every requirement of the definition is checked, so we can repack: $x + y${x plus y} is rational.',
          do: async (s, o) => {
            await o.p.add('Therefore $x + y \\in \\mathbb{Q}$.', { kind: 'conclude', why: 'definition of rational' });
            await o.p.qed();
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'errors',
      title: 'Don’t argue from the conclusion',
      scene(s) {
        const claim = s.text('**Claim.** For all $a, b \\in \\mathbb{R}$, $a^2 + b^2 \\ge 2ab$.', { y: 50, size: 32, visible: false });
        const col = (x, head, lines, color) => ({
          head: s.text(head, { x, y: 100, size: 30, color, weight: 600, visible: false }),
          lines: lines.map((tex, i) => s.tex(tex, { x, y: 160 + i * 60, size: 34, visible: false })),
        });
        const L = col(245, 'from the claim', ['a^2 + b^2 \\ge 2ab', '\\Rightarrow a^2 - 2ab + b^2 \\ge 0', '\\Rightarrow (a - b)^2 \\ge 0 \\ \\checkmark'], C.red);
        const R = col(715, 'from a true fact', ['\\text{Let } a, b \\in \\mathbb{R}.\\ (a - b)^2 \\ge 0', '\\Rightarrow a^2 - 2ab + b^2 \\ge 0', '\\Rightarrow a^2 + b^2 \\ge 2ab \\ \\blacksquare'], C.green);
        const lNote = s.text('proves only: claim ⇒ true', { x: 245, y: 345, size: 30, color: C.red, visible: false });
        const divider = s.line(480, 90, 480, 370, { color: C.line, width: 2, visible: false });
        const list = [
          '✗  a variable used before it is introduced',
          '✗  “clearly” in place of a reason',
          '✗  “$k$ is an integer” with no reason given',
        ].map((str, i) => s.text(str, { x: 80, y: 425 + i * 55, size: 30, anchor: [0, 0.5], align: 'left', color: C.red, visible: false }));
        return { claim, L, R, lNote, divider, list };
      },
      steps: [
        {
          say: 'A tempting way to prove this: start from the claim, simplify, and arrive at something true.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await o.divider.draw({ duration: 500 });
            await o.L.head.fadeIn();
            for (const l of o.L.lines) await l.write({ duration: 700 });
          },
        },
        {
          say: 'But starting from the claim and reaching something true shows only that the claim implies something true. That proves the converse direction, not the claim.',
          do: async (s, o) => {
            await o.lNote.fadeIn();
            await s.all(o.L.lines.map((l) => s.strike(l)));
          },
        },
        {
          say: 'Backwards reasoning is perfectly good scratch work; it is how we found the idea. It just cannot be the written proof.',
          do: async (s, o) => {
            await o.L.head.animate({ opacity: 0 }, { duration: 250 });
            o.L.head.setText('scratch, not proof');
            o.L.head.node.style.color = C.muted;
            await o.L.head.animate({ opacity: 1 }, { duration: 350 });
          },
        },
        {
          say: 'Rewrite it forwards. Let a and b be real numbers; a square is never negative, so $(a - b)^2 \\ge 0${a minus b, squared, is at least zero}, and we expand until we reach the claim. Each step here is reversible, but the written proof must show the right direction.',
          do: async (s, o) => {
            await o.R.head.fadeIn();
            for (const l of o.R.lines) await l.write({ duration: 700 });
            await o.R.lines[2].indicate({ color: C.green });
          },
        },
        {
          say: 'Three more habits that cost points: using a variable before introducing it, writing “clearly” instead of a reason, and claiming a number is an integer without saying why.',
          do: (s, o) => s.all(o.list.map((l, i) => l.fadeIn({ delay: i * 300, shift: [-12, 0] }))),
        },
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-direct',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper and write this proof yourself: scratch first, then the clean version.',
      prompt: 'Prove: for all integers $a, b, c$, if $a \\mid b$ and $a \\mid c$, then $a \\mid (3b - 2c)$.',
      answer: { type: 'proof' },
      hints: ['Unpack both hypotheses, with different letters for the two witnesses.', 'Write $3b - 2c$ as $a$ times something, and say why that something is an integer.'],
      solution: [
        '**Proof.** Let $a, b, c \\in \\mathbb{Z}$ and suppose $a \\mid b$ and $a \\mid c$.',
        'Then $b = ak$ and $c = a\\ell$ for some $k, \\ell \\in \\mathbb{Z}$, by the definition of divides.',
        'So $3b - 2c = 3ak - 2a\\ell = a(3k - 2\\ell)$.',
        'Since $3k - 2\\ell \\in \\mathbb{Z}$ (integers are closed under multiplication and subtraction), we conclude $a \\mid (3b - 2c)$. ∎',
      ],
      rubric: [
        'Introduces arbitrary integers $a, b, c$ and states the hypotheses.',
        'Unpacks both hypotheses with two distinct witnesses ($k$ and $\\ell$, not the same letter).',
        'Factors $3b - 2c = a(3k - 2\\ell)$ correctly.',
        'Justifies that $3k - 2\\ell$ is an integer.',
        'Concludes $a \\mid (3b - 2c)$ by the definition of divides.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-scratch',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we finish, explain the difference between scratch work and a proof, in your own words.',
      prompt: 'What is the difference between scratch work and the written proof? Why can’t the written proof start from the statement you want to prove?',
      points: [
        'Scratch work explores in both directions and may guess; the written proof goes from the hypotheses to the conclusion, every step justified.',
        'Starting from the conclusion and deriving something true only shows the conclusion implies something true: it proves the converse, not the claim.',
        'Every variable is introduced with its type (“Let $n \\in \\mathbb{Z}$”).',
        'Each witness gets a fresh name.',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Definitions are existential: unpack to a witness, repack by exhibiting one.', 130),
          recapItem(s, '• Find the proof forwards and backwards; write it forwards only.', 250),
          recapItem(s, 'Next: what to do when a direct proof gets stuck.', 400, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'Definitions are existential: to use one, unpack it to a named witness; to prove one, repack by exhibiting a witness and saying why it is an integer.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Find the proof in both directions on scratch paper, then write it forwards, one justified line at a time.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: what to do when a direct proof gets stuck, with the contrapositive and proof by contradiction.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
