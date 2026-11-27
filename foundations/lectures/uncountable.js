/**
 * Lecture 23 · Uncountable sets and Cantor's diagonal (foundations/PLAN.md § 23). Dumas–McCarthy 6.
 *
 * Choreography: a supposed complete list of reals is a digit grid; the diagonal glows, the new number is assembled
 * digit by digit underneath, and each comparison rings the two differing digits in red. The same machine runs on a
 * list of rationals and gets no contradiction. Interval comparisons are drawn as two number lines with the squeeze
 * map between them; Cantor's theorem builds D element by element from an arrow diagram into the power set.
 */
import { C } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (pure, computed)

const ROWS = ['14159265', '71828182', '41521356', '57721566', '30102999', '69314718'].map((r) => [...r].map(Number));
const RULE = (d) => (Number(d) === 5 ? 4 : 5);
const DIAG = ROWS.map((r, n) => r[n]);
const XDIG = DIAG.map(RULE);
const LABELS = ROWS.map((_, i) => `r_{${i + 1}}`);

/** First k decimal digits of p/q in (0, 1), exact long division. */
const decimals = (p, q, k) => {
  const out = [];
  let r = p % q;
  for (let i = 0; i < k; i++) {
    r *= 10;
    out.push(Math.floor(r / q));
    r %= q;
  }
  return out;
};
const QS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5]];
const QROWS = QS.map(([p, q]) => decimals(p, q, 6));
const QX = QROWS.map((r, n) => RULE(r[n]));
const QROWS2 = [QX, ...QROWS.slice(0, 5)];
const QX2 = QROWS2.map((r, n) => RULE(r[n]));

// try-diagonal: the first four rows
const T4 = ROWS.slice(0, 4).map((r) => r.slice(0, 4));
const T4X = T4.map((r, n) => RULE(r[n])).join('');
const T4DIAG = T4.map((r, n) => r[n]).join('');
const T4PLUS = T4.map((r, n) => (r[n] + 1) % 10).join('');

// cantor-theorem: A = {1, 2, 3}
const SUBSETS = [[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]];
const setStr = (S) => (S.length ? `\\{${S.join(', ')}\\}` : '∅');
const setTex = (S) => (S.length ? `\\{${S.join(', ')}\\}` : '\\varnothing');
const F = { 1: [1, 2], 2: [1, 3], 3: [] };
const D = [1, 2, 3].filter((a) => !F[a].includes(a));
const idxOf = (S) => SUBSETS.findIndex((T) => T.length === S.length && T.every((v, i) => v === S[i]));
if (Object.values(F).some((S) => idxOf(S) === idxOf(D))) throw new Error('cantor data: D must be missed');

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });
const listGrid = (s, opts) => s.digitGrid({ x: 480, y: 302, size: 34, rows: ROWS, rowLabels: LABELS, ...opts });

// ---------------------------------------------------------------- lecture

export default {
  id: 'uncountable',
  title: 'Uncountable sets and Cantor’s diagonal',
  goals: [
    'Prove that $(0, 1)$ is uncountable with Cantor’s diagonal argument, handling double decimal expansions',
    'Prove Cantor’s theorem: no surjection $A \\to \\mathcal{P}(A)$',
    'Compare sizes with injections; state and use the Schröder–Bernstein theorem',
    'Place $\\mathbb{N}$, $\\mathbb{R}$, $\\mathcal{P}(\\mathbb{N})$ in the hierarchy of infinities',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'list-attempt',
      title: 'Suppose we could list the reals',
      scene(s) {
        const sup = s.text('Suppose $(0, 1)$ is countable: a list $r_1, r_2, r_3, \\dots$ contains all of it.', { y: 50, size: 30, visible: false });
        const g = listGrid(s, { visible: false });
        const goal = s.text('Goal: a number $x \\in (0, 1)$ that is not on the list.', { y: 544, size: 30, color: C.green, visible: false });
        return { sup, g, goal };
      },
      steps: [
        {
          say: 'Suppose, for contradiction, that the interval from zero to one is countable. Then some list $r_1, r_2, r_3${r one, r two, r three}, and so on, contains every number in it.',
          do: (s, o) => o.sup.fadeIn(),
        },
        {
          say: 'Write each number in the list as a decimal. Here is what the start of such a list might look like.',
          do: (s, o) => o.g.write({ duration: 1600 }),
        },
        {
          say: 'We will build a number between zero and one that the list misses, no matter what the list is.',
          do: (s, o) => o.goal.fadeIn(),
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'diagonal',
      title: 'The diagonal',
      scene(s) {
        const g = listGrid(s, { label: 'x' });
        const rule = s.text('rule: digit $5$, unless the diagonal digit is $5$; then $4$', { y: 50, size: 30, color: C.muted, visible: false });
        const contra = s.text('$x \\in (0, 1)$, yet $x \\ne r_n$ for every $n$: the list misses $x$.', { y: 550, size: 30, color: C.red, visible: false });
        return { g, rule, contra };
      },
      steps: [
        {
          say: 'Look down the diagonal: the first digit of $r_1${r one}, the second digit of $r_2${r two}, and so on. Change each one: write five, unless the digit is five, then write four.',
          do: async (s, o) => {
            await o.rule.fadeIn();
            await o.g.highlightDiagonal();
            await o.g.buildDiagonal({ change: RULE, color: 'red' });
          },
        },
        {
          say: 'Now compare. $x${x} differs from $r_1${r one} in the first place, from $r_2${r two} in the second, and from $r_n${r n} in place $n${n}, for every $n${n}.',
          do: async (s, o) => {
            for (let n = 0; n < ROWS.length; n++) {
              const a = s.ring(o.g.cells[n][n], { color: 'red', shape: 'box', pad: 3, duration: 300 });
              const b = s.ring(o.g.newRow.slots[n], { color: 'red', shape: 'box', pad: 3, duration: 300 });
              await s.all(a, b);
              await s.wait(150);
              if (n < ROWS.length - 1) await s.all(a.fadeOut(), b.fadeOut());
            }
          },
        },
        {
          say: 'So $x${x} is a number between zero and one that is not on the list. But the list was supposed to contain every such number: contradiction.',
          do: (s, o) => o.contra.fadeIn(),
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'diagonal-proof',
      title: 'Writing it carefully',
      scene(s) {
        const aside = s.tex('\\boxed{0.0999\\ldots} = \\boxed{0.1000\\ldots}', { x: 480, y: 52, size: 32, color: C.yellow, visible: false });
        const p = s.proof({ y: 90, width: 900, height: 480, size: 30, whyWidth: 190 });
        return { aside, p };
      },
      steps: [
        {
          say: 'One subtlety: some numbers have two decimal expansions, like $0.0999\\ldots = 0.1000\\ldots${zero point zero nine nine nine repeating equals zero point one}. Two different digit strings can name the same number, so we fix one expansion for each.',
          do: async (s, o) => {
            await o.aside.fadeIn();
            await o.p.add('**Proof.** Suppose, for contradiction, $f\\colon \\mathbb{N} \\to (0, 1)$ is onto.', { kind: 'assume', why: 'if countable' });
            o.exp = o.p.add('$f(n) = 0.d_{n1}d_{n2}d_{n3}\\ldots$ (no tail of 9s)', { why: 'decimals' });
            await o.exp;
            await o.p.highlight(o.exp, 'yellow');
          },
        },
        {
          say: 'Build $x${x} from the digits four and five only. A number whose expansion avoids zeros and nines has only one expansion, so the double-expansion trap can\'t catch us.',
          do: async (s, o) => {
            await o.p.unhighlight(o.exp);
            await o.p.add('Let $e_n = 5$ if $d_{nn} \\ne 5$, else $e_n = 4$.', { why: 'diagonal rule' });
            o.uniq = o.p.add('$x = 0.e_1e_2e_3\\ldots \\in (0, 1)$, one expansion.', { why: 'no 0s or 9s' });
            await o.uniq;
            await o.p.highlight(o.uniq, 'yellow');
          },
        },
        {
          say: 'Then different digits really mean different numbers. For each $n${n}, $x${x} and $f(n)${f of n} differ in digit $n${n}, so $x${x} is not $f(n)${f of n}, and $f${f} is not onto after all.',
          do: async (s, o) => {
            await s.all(o.p.unhighlight(o.uniq), o.aside.fadeOut());
            await o.p.add('For each $n$: $e_n \\ne d_{nn}$, so $x \\ne f(n)$.', { why: 'digit $n$ differs' });
            await o.p.add('So $x$ is not in the range of $f$.', { kind: 'contradiction', why: '$f$ was onto' });
            await o.p.add('Therefore $(0, 1)$ is uncountable.', { kind: 'conclude', why: 'no onto $f$' });
            await o.p.qed();
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-diagonal',
      kind: 'try',
      title: 'Build the diagonal number',
      say: 'Your turn: run the diagonal rule on the start of a list.',
      prompt: `The list starts $r_1 = 0.${T4[0].join('')}\\ldots$, $r_2 = 0.${T4[1].join('')}\\ldots$, $r_3 = 0.${T4[2].join('')}\\ldots$, $r_4 = 0.${T4[3].join('')}\\ldots$. Using the rule “digit $5$ unless the diagonal digit is $5$, then $4$”, what are the first four digits of $x$?`,
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: `$0.${T4X}\\ldots$`, why: `Right: the diagonal is $${[...T4DIAG].join(', ')}$, and only the third digit is a $5$.` },
        { id: 'b', label: '$0.5555\\ldots$', why: 'The third diagonal digit is $5$, so $x$ needs a $4$ there; otherwise $x$ could equal $r_3$ in that place.' },
        { id: 'c', label: `$0.${T4PLUS}\\ldots$`, why: 'That is the “add 1 to each digit” rule: a valid diagonal rule, but not the one given.' },
        { id: 'd', label: `$0.${T4DIAG}\\ldots$`, why: 'That is the diagonal itself, which may well be on the list. Each digit must be changed.' },
      ],
      hint: 'Read the $n$-th digit of $r_n$.',
      solution: [`The diagonal digits are $${[...T4DIAG].join(', ')}$. Apply the rule to each: $${[...T4X].join(', ')}$, so $x = 0.${T4X}\\ldots$.`],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'why-not-q',
      title: 'Why this doesn’t work for $\\mathbb{Q}$',
      scene(s) {
        const head = s.text('A list of rationals in $(0, 1)$:', { x: 300, y: 45, size: 30, color: C.muted, visible: false });
        const opts = { x: 300, y: 295, size: 34 };
        const g = s.digitGrid({ ...opts, rows: QROWS, rowLabels: QS.map(([p, q]) => `${p}/${q}`), visible: false });
        const g2 = s.digitGrid({ ...opts, rows: QROWS2, rowLabels: ['x', ...QS.slice(0, 5).map(([p, q]) => `${p}/${q}`)], label: "x'", visible: false });
        const q = s.tex(`x = 0.${QX.join('')}\\ldots \\in \\mathbb{Q}\\ \\part{q}{?}`, { x: 735, y: 105, size: 32, visible: false });
        const no = s.text('No reason it should be: $x$ is missing from the list, but it may be irrational. No contradiction.', { x: 735, y: 245, size: 30, width: 360, visible: false });
        const again = s.text('Add $x$ to the list? The new list has a new diagonal and a new $x\'$ it misses.', { x: 735, y: 450, size: 30, width: 360, color: C.blue, visible: false });
        return { head, g, g2, q, no, again };
      },
      steps: [
        {
          say: 'Run the same construction on a list of rationals. The diagonal number $x${x} differs from every number on the list. But is $x${x} rational?',
          do: async (s, o) => {
            await s.all(o.head.fadeIn(), o.g.fadeIn());
            await o.g.highlightDiagonal();
            await o.g.buildDiagonal({ change: RULE, color: 'red' });
            await o.q.write();
            await o.q.color('q', C.red);
          },
        },
        {
          say: 'There is no reason it should be. These first digits happen to look periodic, but every later digit depends on the rest of the list. The argument only shows that $x${x} is missing from the list, and an irrational $x${x} missing from a list of rationals is no contradiction. This fits the last lecture: the rationals are countable.',
          do: (s, o) => o.no.fadeIn(),
        },
        {
          say: 'And patching the list doesn\'t help. Put $x${x} at the front: the new list has a new diagonal and a new number it misses. The argument works on every list.',
          do: async (s, o) => {
            await s.all(o.g.fadeOut(), o.g2.fadeIn({ shift: [0, 0] }));
            await o.g2.highlightDiagonal();
            await o.g2.buildDiagonal({ change: RULE, color: 'red' });
            await o.again.fadeIn();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'comparing',
      title: 'Comparing sizes',
      scene(s) {
        const card1 = s.defCard({ y: 70, title: false, body: '$\\lvert A \\rvert \\le \\lvert B \\rvert$: an injection $A \\to B$. $\\lvert A \\rvert < \\lvert B \\rvert$: also no bijection.', visible: false });
        const card2 = s.defCard({ y: 186, kind: 'theorem', title: 'Schröder–Bernstein', body: 'Injections $A \\to B$ and $B \\to A$ $\\implies$ a bijection $A \\to B$.', visible: false });
        const lab = { 0: '0', 0.25: '1/4', 0.5: '1/2', 0.75: '3/4', 1: '1' };
        const nlOpts = { x: 540, width: 600, range: [0, 1], ticks: 0.25, size: 32, labels: (v) => lab[v] ?? null };
        const top = s.numberLine({ ...nlOpts, y: 275, visible: false });
        const bot = s.numberLine({ ...nlOpts, y: 405, visible: false });
        const tl = s.tex('[0, 1]', { x: 110, y: 275, size: 34, color: C.blue, visible: false });
        const bl = s.tex('(0, 1)', { x: 110, y: 405, size: 34, color: C.green, visible: false });
        const X = (v) => 540 + top.toX(v);
        const maps = [0, 0.25, 0.5, 0.75, 1].map((v) => s.arrow(X(v), 285, X(v / 2 + 0.25), 395, { color: C.teal, width: 3, visible: false }));
        const sq = s.tex('x \\mapsto x/2 + 1/4 \\colon [0, 1] \\to [1/4, 3/4] \\subseteq (0, 1)', { y: 495, size: 32, color: C.teal, visible: false });
        const incl = s.text('and $(0, 1) \\hookrightarrow [0, 1]$ by inclusion: so $\\lvert [0, 1] \\rvert = \\lvert (0, 1) \\rvert$', { y: 545, size: 30, visible: false });
        const r1 = s.tex('(0, 1) \\to (-1, 1),\\quad x \\mapsto 2x - 1', { y: 300, size: 36, visible: false });
        const r2 = s.tex('(-1, 1) \\to \\mathbb{R},\\quad x \\mapsto \\frac{x}{1 - x^2}', { y: 380, size: 36, visible: false });
        const r3 = s.tex('\\lvert (0, 1) \\rvert = \\lvert \\mathbb{R} \\rvert', { y: 480, size: 40, color: C.green, visible: false });
        return { card1, card2, top, bot, tl, bl, maps, sq, incl, r1, r2, r3 };
      },
      steps: [
        {
          say: 'To compare sizes, use injections. $\\lvert A \\rvert \\le \\lvert B \\rvert${the size of A is at most the size of B} means $A${A} injects into $B${B}: each element of $A${A} gets its own element of $B${B}. Strictly smaller means there is an injection but no bijection.',
          do: (s, o) => o.card1.reveal(),
        },
        {
          say: 'The Schröder–Bernstein theorem: injections in both directions give a bijection. It saves us from building bijections by hand, which is often hard.',
          do: (s, o) => o.card2.reveal(),
        },
        {
          say: 'Example: the closed interval and the open one. Squeeze $[0, 1]${the closed interval from zero to one} into the middle half with $x/2 + 1/4${x over two plus a quarter}. That lands inside the open interval, and inclusion goes the other way.',
          do: async (s, o) => {
            await s.all(o.top.fadeIn(), o.tl.fadeIn());
            await o.top.interval(0, 1, { color: 'blue' });
            await s.all(o.bot.fadeIn(), o.bl.fadeIn());
            await o.bot.interval(0, 1, { openA: true, openB: true, color: 'green' });
            await s.all(o.maps.map((a, i) => a.draw({ duration: 600, delay: i * 120 })));
            await o.bot.interval(0.25, 0.75, { color: 'teal' });
            await o.sq.write();
            await o.incl.fadeIn();
          },
        },
        {
          say: 'With explicit maps, the open interval is even the same size as the whole line: stretch it to $(-1, 1)${minus one to one}, then $x/(1 - x^2)${x over one minus x squared} spreads that onto all of $\\mathbb{R}${R}. So every interval with more than one point has the size of $\\mathbb{R}${R}.',
          do: async (s, o) => {
            await s.all([o.top, o.bot, o.tl, o.bl, o.sq, o.incl, ...o.maps].map((m) => m.fadeOut()));
            await o.r1.write();
            await o.r2.write();
            await o.r3.fadeIn();
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-sb',
      kind: 'blanks',
      title: 'Two injections',
      say: 'Fill in the two injections from the slide.',
      prompt: 'Complete the two injections from the slide that prove $\\lvert [0, 1] \\rvert = \\lvert (0, 1) \\rvert$ by Schröder–Bernstein.',
      lines: [
        ['\\text{Injection } (0, 1) \\to [0, 1]:\\ \\ x \\mapsto ', { id: 'inc', chips: ['x', '2x', '1/x'], answer: 'x', hint: 'Every point of $(0, 1)$ already lies in $[0, 1]$.' }],
        ['\\text{Injection } [0, 1] \\to (0, 1):\\ \\ x \\mapsto ', { tex: '\\frac{x}{\\blank{a}} + \\frac{1}{\\blank{b}}', blanks: { a: { answer: { type: 'number', value: 2 } }, b: { answer: { type: 'number', value: 4 } } } }],
      ],
      solution: [
        'The inclusion $x \\mapsto x$ is injective. ($2x$ can leave $[0, 1]$, and $1/x$ lands outside it.)',
        'The second map has image $[1/4, 3/4] \\subseteq (0, 1)$ and is injective, being a nonconstant linear map. By Schröder–Bernstein, $\\lvert [0, 1] \\rvert = \\lvert (0, 1) \\rvert$. Other constants work too; these are the ones from the slide.',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'cantor-theorem',
      title: 'No set is as big as its power set',
      scene(s) {
        const map = s.mapDiagram({ x: 270, y: 315, gap: 300, spacing: 50, size: 30, labels: ['A', 'P(A)'], name: 'f', domain: ['1', '2', '3'], codomain: SUBSETS.map(setStr), arrows: [], visible: false });
        const rows = [1, 2, 3].map((a, i) => {
          const inn = F[a].includes(a);
          return {
            t: s.tex(`${a} ${inn ? '\\in' : '\\notin'} f(${a}) = ${setTex(F[a])}`, { x: 565, y: 135 + 70 * i, size: 32, anchor: [0, 0.5], visible: false }),
            v: s.text(inn ? 'out' : 'in', { x: 885, y: 135 + 70 * i, size: 30, weight: 600, color: inn ? C.red : C.green, visible: false }),
          };
        });
        const def = s.tex('D = \\{a \\in A : a \\notin f(a)\\}', { x: 740, y: 60, size: 30, color: C.purple, visible: false });
        const dval = s.tex(`D = ${setTex(D)}`, { x: 750, y: 370, size: 38, color: C.green, visible: false });
        const miss = s.text('no arrow reaches $D$, so $f$ is not onto', { x: 740, y: 445, size: 30, width: 360, color: C.green, visible: false });
        return { map, rows, def, dval, miss };
      },
      steps: [
        {
          say: 'Take $A = \\{1, 2, 3\\}${A equals the set one, two, three} and any function $f${f} into its power set. Build a set $D${D} by asking each element: are you in your own image? Put $a${a} in $D${D} exactly when it is not.',
          do: async (s, o) => {
            await o.map.fadeIn();
            for (const [i, a] of [[0, 1], [1, 2], [2, 3]]) await o.map.addArrow(i, idxOf(F[a]), { duration: 420 });
            await o.def.fadeIn();
            for (const r of o.rows) {
              await r.t.fadeIn({ shift: [-10, 0] });
              await r.v.fadeIn({ shift: [0, 0] });
            }
          },
        },
        {
          say: 'So $D = \\{2, 3\\}${D equals the set two, three}, and no arrow hits it. $D${D} disagrees with $f(a)${f of a} about the element $a${a}, for every $a${a}, so $D${D} can\'t be any $f(a)${f of a}.',
          do: async (s, o) => {
            await o.dval.write();
            await o.map.highlightElement('cod', idxOf(D), 'green');
            await o.miss.fadeIn();
          },
        },
        {
          say: 'The same argument works for every set $A${A}. Suppose $D = f(d)${D equals f of d}. Then $d${d} is in $D${D} exactly when $d${d} is not in $f(d)${f of d}, which is $D${D} itself: a contradiction.',
          do: async (s, o) => {
            await s.all([o.map, o.def, o.dval, o.miss, ...o.rows.flatMap((r) => [r.t, r.v])].map((m) => m.fadeOut()));
            o.p = s.proof({ y: 60, width: 900, height: 510, size: 30, whyWidth: 230 });
            await o.p.add('**Proof.** Let $f\\colon A \\to \\mathcal{P}(A)$ be any function.', { kind: 'assume', why: 'arbitrary $f$' });
            await o.p.add('Let $D = \\{a \\in A : a \\notin f(a)\\}$.', { why: 'the diagonal set' });
            await o.p.add('Suppose $D = f(d)$ for some $d \\in A$.', { why: 'for contradiction' });
            o.key = o.p.add('Then $d \\in D \\iff d \\notin f(d) = D$.', { kind: 'contradiction', why: 'definition of $D$' });
            await o.key;
          },
        },
        {
          say: 'So $D${D} is not in the range, and $f${f} is not onto. Sending $a${a} to $\\{a\\}${the set containing a} is an injection, so the power set is strictly bigger. And this is the diagonal argument again: $D${D} differs from $f(a)${f of a} at the place $a${a}.',
          do: async (s, o) => {
            await o.p.add('So $D$ is missed: $f$ is not onto.', { why: 'contradiction' });
            await o.p.add('Therefore $\\lvert A \\rvert < \\lvert \\mathcal{P}(A) \\rvert$.', { kind: 'conclude', why: '$a \\mapsto \\{a\\}$ is 1-1' });
            await o.p.qed();
            await o.p.note(o.key, 'the diagonal again: $D$ and $f(a)$ differ at $a$', { color: 'yellow' });
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'try-cantor-d',
      kind: 'try',
      title: 'Compute $D$',
      say: 'Compute the diagonal set for this function.',
      prompt: `Let $A = \\{1, 2, 3\\}$ and $f(1) = ${setTex(F[1])}$, $f(2) = ${setTex(F[2])}$, $f(3) = ${setTex(F[3])}$. Find $D = \\{a \\in A : a \\notin f(a)\\}$.`,
      answer: { type: 'set', value: D.map(String) },
      hint: 'Check each $a$ against its own image.',
      solution: [
        `$1 ${F[1].includes(1) ? '\\in' : '\\notin'} ${setTex(F[1])}$; $2 ${F[2].includes(2) ? '\\in' : '\\notin'} ${setTex(F[2])}$; $3 ${F[3].includes(3) ? '\\in' : '\\notin'} ${setTex(F[3])}$.`,
        `So $D = ${setTex(D)}$, and indeed no $f(a)$ equals it.`,
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'hierarchy',
      title: 'A ladder of infinities',
      scene(s) {
        const rungs = ['\\lvert \\mathbb{N} \\rvert', '\\lvert \\mathbb{R} \\rvert = \\lvert \\mathcal{P}(\\mathbb{N}) \\rvert', '\\lvert \\mathcal{P}(\\mathbb{R}) \\rvert', '\\lvert \\mathcal{P}(\\mathcal{P}(\\mathbb{R})) \\rvert'];
        const ys = [510, 390, 270, 150];
        const mobs = rungs.map((t, i) => s.tex(t, { x: 260, y: ys[i], size: 36, color: i ? C.ink : C.blue, visible: false }));
        const arrows = ys.slice(1).map((y, i) => s.arrow(260, ys[i] - 30, 260, y + 30, { color: C.muted, width: 3, visible: false }));
        const lt = ys.slice(1).map((y, i) => s.text('<', { x: 300, y: (ys[i] + y) / 2, size: 32, color: C.muted, visible: false }));
        const more = s.tex('\\vdots', { x: 260, y: 65, size: 36, color: C.muted, visible: false });
        const s1 = s.tex('\\{1, 3, 4, \\dots\\} \\leftrightarrow (1, 0, 1, 1, 0, \\dots)', { x: 680, y: 190, size: 30, visible: false });
        const s2 = s.tex('\\leftrightarrow\\ 0.10110\\ldots \\text{ in binary}', { x: 690, y: 255, size: 32, visible: false });
        const s3 = s.text('subsets of $\\mathbb{N}$ ↔ 0/1 sequences ↔ binary expansions (a sketch)', { x: 690, y: 345, size: 30, width: 400, color: C.muted, visible: false });
        const q = s.text('?', { x: 330, y: 450, size: 44, weight: 600, color: C.yellow, visible: false });
        const ch = s.text('Is there a size strictly between $\\lvert \\mathbb{N} \\rvert$ and $\\lvert \\mathbb{R} \\rvert$? The continuum hypothesis says no. It is independent of the usual axioms (Gödel, Cohen).', { x: 690, y: 430, size: 30, width: 420, visible: false });
        return { mobs, arrows, lt, more, s1, s2, s3, q, ch };
      },
      steps: [
        {
          say: 'Cantor\'s theorem never stops: every set has a strictly bigger power set. Starting from $\\mathbb{N}${N}, we climb a ladder of infinitely many infinite sizes.',
          do: async (s, o) => {
            await o.mobs[0].fadeIn();
            for (let i = 1; i < o.mobs.length; i++) {
              await s.all(o.arrows[i - 1].draw({ duration: 450 }), o.lt[i - 1].fadeIn());
              await o.mobs[i].fadeIn();
            }
            await o.more.fadeIn();
          },
        },
        {
          say: 'The real line sits on the second rung, the same size as the power set of $\\mathbb{N}${N}. A subset of $\\mathbb{N}${N} is a sequence of zeros and ones, which is roughly a binary expansion of a real number.',
          do: async (s, o) => {
            await o.mobs[1].indicate({ color: C.green, keep: true });
            await o.s1.write();
            await o.s2.write();
            await o.s3.fadeIn();
          },
        },
        {
          say: 'Is there a size strictly between $\\mathbb{N}${N} and $\\mathbb{R}${R}? That is the continuum hypothesis, and Gödel and Cohen showed it can be neither proved nor disproved from the standard axioms of set theory.',
          do: async (s, o) => {
            await s.all(o.s1.fadeOut(), o.s2.fadeOut(), o.s3.fadeOut());
            await o.q.fadeIn();
            await o.q.indicate({ color: C.yellow, keep: true });
            await o.ch.fadeIn();
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-binary-sequences',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper and run the diagonal argument yourself, on sequences of zeros and ones.',
      prompt: 'Prove that the set $S$ of all infinite sequences $(s_1, s_2, s_3, \\dots)$ with each $s_i \\in \\{0, 1\\}$ is uncountable.',
      answer: { type: 'proof' },
      hints: ['Suppose $f\\colon \\mathbb{N} \\to S$ is surjective.', 'Flip the diagonal.'],
      solution: [
        '**Proof.** Suppose, for contradiction, that $S$ is countable. $S$ is nonempty, so there is a surjection $f\\colon \\mathbb{N} \\to S$. Write $f(n) = (s_{n1}, s_{n2}, s_{n3}, \\dots)$.',
        'Define $t = (t_1, t_2, t_3, \\dots)$ by $t_n = 1 - s_{nn}$. Each $t_n \\in \\{0, 1\\}$, so $t \\in S$.',
        'For each $n \\in \\mathbb{N}$, $t_n \\ne s_{nn}$, so the sequences $t$ and $f(n)$ differ in position $n$, and $t \\ne f(n)$.',
        'Thus $t$ is not in the range of $f$, contradicting surjectivity. Therefore $S$ is uncountable. ∎',
      ],
      rubric: [
        'Sets up the contradiction with an arbitrary listing or surjection $f\\colon \\mathbb{N} \\to S$.',
        'Defines the diagonal sequence explicitly ($t_n = 1 - s_{nn}$) and checks $t \\in S$.',
        'Shows $t$ differs from every $f(n)$ at position $n$.',
        'Concludes that $S$ is not countable (no surjection from $\\mathbb{N}$, or notes that $S$ is infinite).',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-diagonal',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap, explain Cantor\'s diagonal argument in your own words, and why it says nothing about the rationals.',
      prompt: 'Explain Cantor’s diagonal argument, and why the same argument doesn’t prove that $\\mathbb{Q}$ is uncountable.',
      points: [
        'Any proposed list of reals determines a number that differs from the $n$-th number in the $n$-th digit.',
        'Using only the digits 4 and 5 (no 0s or 9s) makes “different digits” mean “different numbers”.',
        'So no list contains every real in $(0, 1)$: it is uncountable.',
        'For $\\mathbb{Q}$, the constructed number need not be rational, so no contradiction arises.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• $(0, 1)$, $\\mathbb{R}$ and $\\mathcal{P}(\\mathbb{N})$ are uncountable: change the diagonal.', 130),
          recapItem(s, '• $\\lvert A \\rvert < \\lvert \\mathcal{P}(A) \\rvert$ for every set $A$. Injections both ways give a bijection (Schröder–Bernstein).', 250),
          recapItem(s, 'Next: the axiom hiding in our infinite choices.', 390, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'The open interval, the real line and the power set of $\\mathbb{N}${N} are uncountable, because any list misses its own diagonal.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Every set is strictly smaller than its power set, and to show two sets have the same size, injections in both directions are enough.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: the axiom that has been hiding in our infinite choices, the axiom of choice.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
