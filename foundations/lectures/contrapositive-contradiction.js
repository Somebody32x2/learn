/**
 * Lecture 7 · Contrapositive and contradiction (foundations/PLAN.md § 7). Irani · Proofs.
 *
 * Choreography: a direct attempt dies in a red scratch line; the implication chip turns around and grows ¬ in front
 * of both sides (the contrapositive); De Morgan is performed on the symbols themselves; proofs by contradiction
 * end on a red ⇒⇐ line. Euclid's N is computed here and factored on stage.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, not typed)

const EUCLID = [2, 3, 5, 7, 11, 13];
const N = EUCLID.reduce((a, b) => a * b, 1) + 1;
/** Prime factorization by trial division. */
function factor(n) {
  const out = [];
  for (let d = 2; d * d <= n; d++) while (n % d === 0) (out.push(d), (n /= d));
  if (n > 1) out.push(n);
  return out;
}
const N_FACTORS = factor(N);
const N_TEX = `${EUCLID.join(' \\cdot ')} + 1 = ${N} = ${N_FACTORS.join(' \\cdot ')}`;
const N_REMAINDERS = EUCLID.map((p) => N % p); // all 1: no listed prime divides N

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

// ---------------------------------------------------------------- lecture

export default {
  id: 'contrapositive-contradiction',
  title: 'Contrapositive and contradiction',
  goals: [
    'Prove a statement by proving its contrapositive, with the correct first line',
    'Structure a proof by contradiction and negate the assumption correctly',
    'Prove that $\\sqrt 2$ is irrational and that there are infinitely many primes',
    'Choose between direct proof, contrapositive and contradiction',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'stuck-direct',
      title: 'When direct proof gets stuck',
      scene(s) {
        const thm = s.tex('\\textbf{Theorem.}\\ \\text{For } n \\in \\mathbb{Z}\\text{, if } \\part{h}{n^2 \\text{ is even}}\\text{, then } \\part{c}{n \\text{ is even}}.', { y: 52, size: 34, visible: false });
        const pad = s.scratch({ x: 40, y: 90, w: 540, h: 250, title: 'a direct attempt', visible: false });
        const q1 = s.text('even?', { x: 750, y: 250, size: 32, color: C.red, visible: false });
        const q2 = s.text('an integer, even?', { x: 750, y: 300, size: 32, color: C.red, visible: false });
        const n = s.tex('n', { x: 300, y: 450, size: 44, visible: false });
        const n2 = s.tex('n^2', { x: 660, y: 450, size: 44, visible: false });
        const up = s.arrow(340, 432, 615, 432, { color: C.green, width: 4, visible: false });
        const upL = s.text('squaring: easy to compute', { x: 480, y: 395, size: 30, color: C.green, visible: false });
        const down = s.arrow(615, 470, 340, 470, { color: C.red, width: 4, dash: true, visible: false });
        const downL = s.text('square root: nothing to unpack', { x: 480, y: 510, size: 30, color: C.red, visible: false });
        const chip = s.implication({ items: ['n^2 \\text{ even}', 'n \\text{ even}'], x: 480, y: 116, size: 40, visible: false });
        return { thm, pad, q1, q2, n, n2, up, upL, down, downL, chip };
      },
      steps: [
        {
          say: 'Here is a theorem that looks easy: if $n^2${n squared} is even, then $n${n} is even. Try it directly: unpack the hypothesis, $n^2 = 2k${n squared equals two k}, so $n = \\pm\\sqrt{2k}${n equals plus or minus the square root of two k}, and now what?',
          do: async (s, o) => {
            await o.thm.write({ duration: 1100 });
            await o.pad.reveal();
            await o.pad.add('Suppose $n^2$ is even.', { color: 'blue' });
            await o.pad.add('n^2 = 2k \\text{ for some } k \\in \\mathbb{Z}', { color: 'blue' });
            o.bad = o.pad.add('n = \\pm\\sqrt{2k}\\ \\ ?', { color: 'red' });
            await o.bad;
          },
        },
        {
          say: 'Is the square root of two $k${k} even? Is it even an integer? Unpacking $n^2${n squared} tells us nothing we can use about $n${n}.',
          do: async (s, o) => {
            await o.q1.fadeIn({ shift: [-12, 0] });
            await o.q2.fadeIn({ shift: [-12, 0] });
            o.ring = s.ring(o.bad, { color: 'red', shape: 'box' });
            await o.ring;
          },
        },
        {
          say: 'The hypothesis is about $n^2${n squared}, but the conclusion is about $n${n}. Going from $n${n} to its square is easy; square roots go the wrong way.',
          do: async (s, o) => {
            await s.all(o.thm.color('h', C.blue), o.thm.color('c', C.green));
            await s.all(o.n.fadeIn(), o.n2.fadeIn());
            await s.all(o.up.draw(), o.upL.fadeIn({ delay: 300 }));
            await s.all(o.down.draw(), o.downL.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'So let’s turn the statement around, and work from the side we can unpack.',
          do: async (s, o) => {
            const gone = [o.pad, o.ring, o.q1, o.q2, o.n, o.n2, o.up, o.upL, o.down, o.downL];
            await s.all(...gone.map((m, i) => m.fadeOut({ delay: i * 40 })));
            await o.chip.fadeIn();
            await o.chip.step(0);
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'contrapositive',
      title: 'Prove the contrapositive',
      scene(s) {
        const thm = s.tex('\\textbf{Theorem.}\\ \\text{For } n \\in \\mathbb{Z}\\text{, if } \\part{h}{n^2 \\text{ is even}}\\text{, then } \\part{c}{n \\text{ is even}}.', { y: 52, size: 34 });
        for (const e of thm.part('h')) e.style.color = C.blue;
        for (const e of thm.part('c')) e.style.color = C.green;
        const chip = s.implication({ items: ['n^2 \\text{ even}', 'n \\text{ even}'], x: 480, y: 116, size: 40 });
        const eq = s.tex('\\equiv\\quad n \\text{ odd} \\implies n^2 \\text{ odd}', { x: 250, y: 178, size: 32, color: C.yellow, visible: false });
        const law = s.text('lecture 2: $p \\to q \\;\\equiv\\; \\neg q \\to \\neg p$', { x: 695, y: 178, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 212, width: 900, height: 358, size: 30 });
        return { thm, chip, eq, law, p };
      },
      steps: [
        {
          say: 'Turn the arrow around and negate both sides: if $n${n} is not even, then $n^2${n squared} is not even. That is the contrapositive, and it is logically equivalent to the theorem, so proving it proves the theorem.',
          do: async (s, o) => {
            await o.chip.reverse();
            await o.chip.negateAll();
            await o.eq.write();
            await o.law.fadeIn();
          },
        },
        {
          say: 'Now the hypothesis is about $n${n}, and “odd” unpacks: $n = 2k + 1${n equals two k plus one}. The rest is the computation from last lecture: $n^2 = 2(2k^2 + 2k) + 1${n squared equals two times, two k squared plus two k, plus one}, which is odd.',
          do: async (s, o) => {
            o.l1 = o.p.add('**Proof.** We prove the contrapositive.', { kind: 'assume', why: 'method' });
            await o.l1;
            await o.p.add('Let $n \\in \\mathbb{Z}$ be odd.', { why: 'negated conclusion' });
            await o.p.add('Then $n = 2k + 1$ for some $k \\in \\mathbb{Z}$.', { why: 'definition of odd' });
            o.l4 = o.p.add('So $n^2 = 2(2k^2 + 2k) + 1$ is odd.', { why: 'algebra (lecture 6)' });
            await o.l4;
          },
        },
        {
          say: 'Say “we prove the contrapositive” in the first line, so the reader knows what you are assuming. Then finish with the theorem in its original words.',
          do: async (s, o) => {
            await o.p.highlight(o.l1, 'yellow');
            await o.p.add('Therefore, if $n^2$ is even, then $n$ is even.', { kind: 'conclude', why: 'contrapositive' });
            await o.p.qed();
          },
        },
        {
          say: 'The contrapositive also finishes an “if and only if”. To prove $n${n} is even exactly when $n^2${n squared} is even, prove both directions and label them. Forwards is direct: $n = 2k${n equals two k} gives $n^2 = 2(2k^2)${n squared equals two times two k squared}. Backwards is the theorem we just proved.',
          do: async (s, o) => {
            await s.all(o.p.clear(), o.eq.fadeOut(), o.law.fadeOut(), o.chip.fadeOut());
            o.p.set({ y: 110 });
            await o.thm.swap('\\textbf{Theorem.}\\ \\text{For } n \\in \\mathbb{Z}\\text{, } n \\text{ is even} \\iff n^2 \\text{ is even}.');
            await o.p.add('**Proof.** Let $n \\in \\mathbb{Z}$.', { kind: 'assume', why: 'two directions' });
            await o.p.add('($\\Rightarrow$) $n = 2k$ gives $n^2 = 2(2k^2)$, even.', { why: 'direct' });
            await o.p.add('($\\Leftarrow$) If $n^2$ is even, then $n$ is even.', { why: 'contrapositive, above' });
            await o.p.add('Therefore $n$ is even $\\Leftrightarrow$ $n^2$ is even.', { kind: 'conclude', why: 'both directions' });
            await o.p.qed();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'contra-reals',
      title: 'A contrapositive with “or”',
      scene(s) {
        const thm = s.text('**Theorem.** For $x, y \\in \\mathbb{R}$: if $x + y \\ge 2$, then $x \\ge 1$ or $y \\ge 1$.', { y: 52, size: 32, visible: false });
        const from = s.symbols(['\\neg', '(', 'x \\ge 1', '\\;\\lor\\;', 'y \\ge 1', ')'], { y: 130, size: 42, visible: false });
        const to = s.symbols(['x < 1', '\\;\\land\\;', 'y < 1'], { y: 220, size: 42, visible: false });
        const dm = s.text('De Morgan', { x: 760, y: 175, size: 30, color: C.muted, italic: true, visible: false });
        const contra = s.tex('\\text{Contrapositive: if } \\part{h}{x < 1 \\text{ and } y < 1}\\text{, then } \\part{c}{x + y < 2}.', { y: 305, size: 34, visible: false });
        const pf = s.text('**Proof.** We prove the contrapositive. Suppose $x < 1$ and $y < 1$.', { y: 360, size: 30, color: C.blue, visible: false });
        const l1 = s.tex('x < 1', { x: 480, y: 410, size: 36, anchor: [1, 0.5], visible: false });
        const l2 = s.tex('+\\quad y < 1', { x: 480, y: 468, size: 36, anchor: [1, 0.5], visible: false });
        const bar = s.line(300, 500, 490, 500, { width: 3, visible: false });
        const l3 = s.tex('x + y < 2', { x: 480, y: 532, size: 36, anchor: [1, 0.5], color: C.green, visible: false });
        const done = s.text('contrapositive proved, so the theorem holds ∎', { x: 730, y: 500, size: 30, width: 340, color: C.green, visible: false });
        return { thm, from, to, dm, contra, pf, l1, l2, bar, l3, done };
      },
      steps: [
        {
          say: 'Here the conclusion is an “or”. To negate it, use De Morgan: not, $x \\ge 1${x at least one} or $y \\ge 1${y at least one}, becomes $x < 1${x less than one} and $y < 1${y less than one}.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await s.all(o.from.map((m, i) => m.fadeIn({ delay: i * 80 })));
            // a copy of every piece travels down and becomes the negated version
            const c = o.from.map((m, i) => s.tex(['\\neg', '(', 'x \\ge 1', '\\;\\lor\\;', 'y \\ge 1', ')'][i], { x: m.x, y: m.y, size: 42, anchor: [0, 0.5] }));
            await s.all(
              c[2].moveTo(o.to[0].x, o.to[0].y, { duration: 900 }),
              c[3].moveTo(o.to[1].x, o.to[1].y, { duration: 900 }),
              c[4].moveTo(o.to[2].x, o.to[2].y, { duration: 900 }),
              c[0].moveTo(o.to[0].x, o.to[0].y, { duration: 700 }).then(() => c[0].fadeOut({ duration: 250 })),
              c[1].fadeOut(),
              c[5].fadeOut(),
              o.dm.fadeIn({ delay: 300 }),
            );
            await s.all(c[2].swap('x < 1'), c[3].swap('\\;\\land\\;'), c[4].swap('y < 1'));
            await s.all(c[2].recolor(C.blue), c[3].recolor(C.blue), c[4].recolor(C.blue));
            o.copies = c;
          },
        },
        {
          say: 'So the contrapositive reads: if $x < 1${x is less than one} and $y < 1${y is less than one}, then $x + y < 2${x plus y is less than two}. Instead of one awkward “or”, we get two facts to use.',
          do: async (s, o) => {
            await o.contra.write({ duration: 1200 });
            await s.all(o.contra.color('h', C.blue), o.contra.color('c', C.green));
          },
        },
        {
          say: 'Write it up: we prove the contrapositive, so suppose $x < 1${x is less than one} and $y < 1${y is less than one}. Add the two inequalities: $x + y < 1 + 1 = 2${x plus y is less than one plus one, which is two}. That proves the contrapositive, and with it the theorem.',
          do: async (s, o) => {
            await o.pf.fadeIn();
            await o.l1.fadeIn({ shift: [0, -10] });
            await o.l2.fadeIn({ shift: [0, -10] });
            await o.bar.draw({ duration: 400 });
            await o.l3.write();
            await o.done.fadeIn();
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-contrapositive-start',
      kind: 'try',
      title: 'First line',
      say: 'Your turn. What is the right first assumption for this proof by contrapositive?',
      prompt: 'To prove “for every integer $n$, if $3n + 2$ is odd then $n$ is odd” by contrapositive, what is the first line after “Let $n \\in \\mathbb{Z}$”?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '“Suppose $n$ is even.”', why: 'The contrapositive is “if $n$ is even, then $3n + 2$ is even”: assume the negated conclusion.' },
        { id: 'b', label: '“Suppose $3n + 2$ is even.”', why: 'That assumes the negated hypothesis, which leads nowhere useful: it is the start of the inverse.' },
        { id: 'c', label: '“Suppose $n$ is odd.”', why: 'That is the conclusion itself; assuming it proves nothing.' },
        { id: 'd', label: '“Suppose $3n + 2$ is odd and $n$ is even.”', why: 'That is the start of a proof by contradiction, a different method.' },
      ],
      hint: 'The contrapositive of $p \\to q$ is $\\neg q \\to \\neg p$.',
      solution: [
        'The contrapositive is: if $n$ is even, then $3n + 2$ is even. So assume $\\neg q$: “Suppose $n$ is even.”',
        'Then $n = 2k$ for some $k \\in \\mathbb{Z}$, and $3n + 2 = 6k + 2 = 2(3k + 1)$ with $3k + 1 \\in \\mathbb{Z}$, so $3n + 2$ is even.',
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'contradiction-idea',
      title: 'Proof by contradiction',
      scene(s) {
        const p = s.proof({ x: 255, y: 90, width: 430, height: 380, size: 32, numbered: false, whyWidth: 20 });
        const t = s.truthTable({
          x: 700,
          y: 260,
          size: 32,
          vars: ['P'],
          cols: [
            { tex: '\\neg P', key: 'np', fn: (v) => !v.P },
            { tex: '\\neg P \\to \\mathrm{F}', key: 'imp', fn: (v) => v.P },
          ],
          visible: false,
        });
        const note = s.text('true only when $P$ is true', { x: 700, y: 380, size: 30, color: C.green, visible: false });
        return { p, t, note };
      },
      steps: [
        {
          say: 'To prove $P${P} by contradiction, start by assuming the opposite of what you want, and say so: suppose, for contradiction, not $P${P}.',
          do: async (s, o) => {
            await o.p.add('Suppose, for contradiction, $\\neg P$.', { kind: 'assume' });
          },
        },
        {
          say: 'Then reason until you reach something impossible: a statement $r${r} and its negation, both at once.',
          do: async (s, o) => {
            await o.p.add('$\\vdots$');
            await o.p.add('Then $r$ and $\\neg r$.', { kind: 'contradiction' });
          },
        },
        {
          say: 'A true assumption can never lead to a falsehood. The table shows it: not $P${P} implies false is true only when $P${P} is true. So the assumption was false, and $P${P} holds.',
          do: async (s, o) => {
            await o.t.fadeIn();
            await o.t.fillColumn('np', { gap: 200 });
            await o.t.fillColumn('imp', { gap: 200 });
            await o.t.highlightRows([0], 'green');
            await o.note.fadeIn();
            await o.p.add('So $P$.', { kind: 'conclude' });
            await o.p.qed();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'sqrt2-plan',
      title: 'Planning √2',
      scene(s) {
        const claim = s.tex('\\textbf{Claim.}\\ \\sqrt 2 \\text{ is irrational.}', { y: 54, size: 36, visible: false });
        const pad = s.scratch({ x: 40, y: 98, w: 450, h: 462, title: 'scratch', visible: false });
        const card = s.defCard({ x: 710, y: 98, anchor: [0.5, 0], width: 390, kind: 'definition', title: 'Fact: lowest terms', body: 'Every rational number can be written as $a/b$ with $a, b \\in \\mathbb{Z}$, $b \\ne 0$, and no common factor greater than $1$.', visible: false });
        const wop = s.text('(we accept it now; it follows from the well-ordering principle)', { x: 710, y: 425, anchor: [0.5, 0], size: 30, width: 390, color: C.muted, visible: false });
        return { claim, pad, card, wop };
      },
      steps: [
        {
          say: '“Irrational” means “not rational”: a negative statement, with nothing to unpack. Negative conclusions like “not rational” or “no largest” invite contradiction, because assuming the opposite hands you something concrete: $\\sqrt 2 = a/b${root two equals a over b}.',
          do: async (s, o) => {
            await o.claim.write();
            await o.pad.reveal();
            await o.pad.add('irrational = not rational');
            await o.pad.add('assume $\\sqrt 2 = a/b$', { color: 'blue' });
          },
        },
        {
          say: 'We get one more handle for free: every fraction can be written in lowest terms, with no common factor bigger than one.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.wop.fadeIn();
            await o.pad.add('…in lowest terms', { color: 'blue' });
          },
        },
        {
          say: 'So our target is to show that $a${a} and $b${b} are both even. Then two divides both, contradicting lowest terms.',
          do: async (s, o) => {
            await o.pad.add('target: $a$ and $b$ both even', { color: 'green' });
            await o.pad.add('$2$ divides both ⇒⇐', { color: 'red' });
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'sqrt2-proof',
      title: '√2 is irrational',
      scene(s) {
        const strip = s.tex('\\text{proved above: } n^2 \\text{ even} \\implies n \\text{ even}', { y: 50, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 80, width: 900, height: 490, size: 30, whyWidth: 240 });
        return { strip, p };
      },
      steps: [
        {
          say: 'Assume the opposite and unpack it: root two is a fraction $a/b${a over b} of integers, with $b${b} not zero, in lowest terms.',
          do: async (s, o) => {
            await o.strip.fadeIn();
            await o.p.add('**Proof.** Suppose $\\sqrt 2 \\in \\mathbb{Q}$.', { kind: 'assume', why: 'for contradiction' });
            await o.p.add('So $\\sqrt 2 = a/b$, $a, b \\in \\mathbb{Z}$, lowest terms.', { why: 'def. of $\\mathbb{Q}$; $b \\ne 0$' });
          },
        },
        {
          say: 'Square both sides and clear the denominator: $a^2 = 2b^2${a squared equals two b squared}. Since $b^2${b squared} is an integer, $a^2${a squared} is even.',
          do: async (s, o) => {
            await o.p.add('So $a^2 = 2b^2$, hence $a^2$ is even.', { why: 'squaring' });
          },
        },
        {
          say: 'Now the theorem we proved by contrapositive does the work: $a^2${a squared} even means $a${a} is even, so $a = 2c${a equals two c}. Substituting gives $b^2 = 2c^2${b squared equals two c squared}, and the same theorem makes $b${b} even.',
          do: async (s, o) => {
            o.l5 = o.p.add('So $a$ is even: $a = 2c$ for some $c \\in \\mathbb{Z}$.', { why: '$n^2$ even ⇒ $n$ even' });
            await o.l5;
            await o.p.highlight(o.l5, 'yellow');
            const w = o.p.lineBox(o.l5, 'why');
            const sb = o.strip.box();
            const arr = s.arrow(w.cx, w.y - 4, sb.x + sb.w - 40, sb.y + sb.h + 4, { color: C.yellow, width: 3, layer: 'front', visible: false });
            await arr.draw({ duration: 600 });
            await o.strip.indicate({ color: C.yellow });
            await arr.fadeOut();
            await o.p.unhighlight(o.l5);
            await o.p.add('Then $2b^2 = 4c^2$, so $b^2 = 2c^2$.', { why: 'substitution' });
            await o.p.add('So $b^2$ is even, hence $b$ is even.', { why: 'same theorem' });
          },
        },
        {
          say: 'Two even numbers share the factor two, but $a/b${a over b} was in lowest terms. That is the contradiction, so root two is irrational.',
          do: async (s, o) => {
            await o.p.add('So $2 \\mid a$ and $2 \\mid b$: not lowest terms.', { kind: 'contradiction', why: 'contradicts line 2' });
            await o.p.add('Therefore $\\sqrt 2$ is irrational.', { kind: 'conclude', why: 'contradiction' });
            await o.p.qed();
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-sqrt2',
      kind: 'blanks',
      title: 'Fill in the proof',
      say: 'Fill in the key steps of the proof that root two is irrational.',
      prompt: 'Complete the steps of the proof that $\\sqrt 2$ is irrational.',
      lines: [
        ['\\text{From } \\sqrt 2 = a/b \\text{ we get } a^2 = ', { id: 'a2', chips: ['2b^2', '2b', 'b^2/2'], answer: '2b^2', hint: 'Square both sides, then multiply by $b^2$.' }],
        [
          '\\text{So } a^2 \\text{ is even, hence } a \\text{ is }',
          { id: 'par', chips: ['\\text{even}', '\\text{odd}'], answer: '\\text{even}' },
          '\\text{ by}',
        ],
        [
          {
            id: 'thm',
            chips: ['\\text{the contrapositive of } n \\text{ odd} \\Rightarrow n^2 \\text{ odd}', '\\text{the definition of even}', '\\text{the fact } n \\text{ even} \\Rightarrow n^2 \\text{ even}'],
            answer: '\\text{the contrapositive of } n \\text{ odd} \\Rightarrow n^2 \\text{ odd}',
            hint: 'Which statement did we prove at the start of the lecture, and how?',
          },
          '.',
        ],
        ['\\text{Writing } a = 2c \\text{ gives } b^2 = ', { id: 'b2', chips: ['2c^2', '4c^2', 'c^2'], answer: '2c^2', hint: 'Substitute into $a^2 = 2b^2$ and divide by 2.' }],
      ],
      solution: [
        'Squaring $\\sqrt 2 = a/b$ gives $2 = a^2/b^2$, so $a^2 = 2b^2$.',
        '$a^2$ is even, so $a$ is even, by the contrapositive of “$n$ odd ⇒ $n^2$ odd”, which is “$n^2$ even ⇒ $n$ even”.',
        'The chip “$n$ even ⇒ $n^2$ even” is the classic trap: it is true, but it points the wrong way. We need “$n^2$ even ⇒ $n$ even”, which we proved by contrapositive. The definition of even alone does not get from $a^2$ to $a$ either.',
        'With $a = 2c$: $2b^2 = 4c^2$, so $b^2 = 2c^2$.',
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'primes-infinite',
      title: 'Infinitely many primes',
      scene(s) {
        const p = s.proof({ y: 22, width: 900, height: 548, size: 30, whyWidth: 240 });
        const ask = s.text('Is $N$ itself prime?', { y: 150, size: 34, visible: false });
        const calc = s.tex(N_TEX, { y: 250, size: 38, color: C.yellow, visible: false });
        const calcNote = s.text('$N$ need not be prime: its prime factors are just not on the list', { y: 340, size: 30, color: C.muted, visible: false });
        return { p, ask, calc, calcNote };
      },
      steps: [
        {
          say: 'Euclid’s proof. Suppose, for contradiction, that there are only finitely many primes, and list all of them: $p_1${p one} through $p_k${p k}.',
          do: async (s, o) => {
            await o.p.add('**Proof.** Suppose, for contradiction, that $p_1, \\dots, p_k$ are all the primes.', { kind: 'assume', why: 'assumption' });
          },
        },
        {
          say: 'Build a number the list cannot divide: multiply all of them and add one. $N${N} is bigger than one, and every integer above one has a prime factor; we prove that in lecture sixteen. Since the list is complete, that prime is one of the $p_i${p i}.',
          do: async (s, o) => {
            o.lN = o.p.add('Let $N = p_1 p_2 \\cdots p_k + 1$.', { why: 'a new number' });
            await o.lN;
            await o.p.highlight(o.lN, 'yellow');
            await o.p.add('$N > 1$, so some prime $p$ divides $N$.', { why: 'prime factor (lect. 16)' });
            await o.p.add('$p = p_i$ for some $i$, so $p_i \\mid p_1 \\cdots p_k$.', { why: 'list complete' });
          },
        },
        {
          say: 'But then $p_i${p i} divides the difference $N - p_1 \\cdots p_k${N minus the product}, which is one. A prime is bigger than one, so it cannot divide one: that is the contradiction.',
          do: async (s, o) => {
            await o.p.unhighlight(o.lN);
            await o.p.add('So $p_i \\mid N - p_1 \\cdots p_k = 1$.', { why: 'divides both terms' });
            await o.p.add('But $p_i > 1$, so $p_i \\nmid 1$.', { kind: 'contradiction', why: 'primes exceed 1' });
            await o.p.add('Therefore infinitely many primes exist.', { kind: 'conclude', why: 'contradiction' });
            await o.p.qed();
          },
        },
        {
          say: 'Careful: the proof does not say $N${N} is prime. With the first six primes, $N = 30031${N equals thirty thousand thirty-one}, which is $59 \\cdot 509${fifty-nine times five hundred nine}: new primes, not on the list.',
          do: async (s, o) => {
            await o.p.fadeOut();
            await o.ask.fadeIn();
            await o.calc.write({ duration: 1400 });
            await o.calcNote.fadeIn();
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'try-euclid-N',
      kind: 'try',
      title: 'Is N prime?',
      say: 'Quick check on Euclid’s number. Is it prime?',
      prompt: `Is $${EUCLID.join(' \\cdot ')} + 1 = ${N}$ prime?`,
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: 'Yes, by Euclid’s proof', why: 'The proof only says the prime factors of $N$ are not on the list; it never says $N$ is prime.' },
        { id: 'b', label: `No: $${N} = ${N_FACTORS.join(' \\cdot ')}$`, why: `$${N_FACTORS.join(' \\cdot ')} = ${N}$, and both factors are primes missing from the list, as the proof predicts.` },
        { id: 'c', label: 'No: it is divisible by $13$', why: `It leaves remainder ${N_REMAINDERS[5]} on division by $13$, and by every other listed prime.` },
        { id: 'd', label: 'It can’t be decided', why: 'It is a finite computation: trial division settles it.' },
      ],
      hint: 'Euclid’s argument shows the prime factors of $N$ are new; it does not show $N$ is prime.',
      solution: [
        `$${N_FACTORS.join(' \\cdot ')} = ${N}$, so $N$ is not prime.`,
        `Both factors are primes larger than $13$, so neither is on the list $${EUCLID.join(', ')}$: exactly what the proof guarantees.`,
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'which-method',
      title: 'Choosing a method',
      scene(s) {
        const col = (x, head, color, body, ex) => ({
          frame: s.rect(x - 135, 40, 270, 410, { color, fill: FILL[color === C.blue ? 'blue' : color === C.teal ? 'teal' : 'red'], radius: 14, width: 2, visible: false }),
          head: s.text(head, { x, y: 82, size: 32, weight: 600, color, visible: false }),
          body: s.text(body, { x, y: 120, size: 30, width: 244, anchor: [0.5, 0], visible: false }),
          ex: s.text(ex, { x, y: 405, size: 30, color: C.muted, visible: false }),
        });
        const cols = [
          col(185, 'direct', C.blue, 'the hypothesis unpacks into something you can compute with', '$n$ odd ⇒ $n^2$ odd'),
          col(480, 'contrapositive', C.teal, 'the negated conclusion unpacks better than the hypothesis', '$n^2$ even ⇒ $n$ even'),
          col(775, 'contradiction', C.red, 'the conclusion is negative: irrational, infinitely many, no largest, not equal', '$\\sqrt 2 \\notin \\mathbb{Q}$'),
        ];
        const foot = s.text('A “contradiction” that never uses its assumption is a direct proof in disguise.', { y: 510, size: 30, width: 860, visible: false });
        return { cols, foot };
      },
      steps: [
        {
          say: 'How do you choose? Look at which side gives you something to unpack. If the hypothesis does, go direct. If the negated conclusion does, as with $n^2${n squared} even, prove the contrapositive.',
          do: async (s, o) => {
            for (const c of o.cols.slice(0, 2)) {
              await s.all(c.frame.fadeIn({ shift: [0, 0] }), c.head.fadeIn(), c.body.fadeIn({ delay: 200 }), c.ex.fadeIn({ delay: 500 }));
              c.ring = s.ring(c.body, { color: 'yellow', shape: 'box' });
              await c.ring;
            }
          },
        },
        {
          say: 'Negative conclusions suggest contradiction: irrational, infinitely many, no largest, not equal. Assuming the opposite gives you an object to work with.',
          do: (s, o) => {
            const c = o.cols[2];
            return s.all(o.cols[0].ring.fadeOut(), o.cols[1].ring.fadeOut(), c.frame.fadeIn({ shift: [0, 0] }), c.head.fadeIn(), c.body.fadeIn({ delay: 200 }), c.ex.fadeIn({ delay: 500 }));
          },
        },
        {
          say: 'One warning: don’t wrap a direct proof in a fake contradiction. If your argument never uses the assumption, delete it and write the direct proof; the wrapper only hides the argument.',
          do: async (s, o) => {
            await o.foot.fadeIn();
            await s.ring(o.foot, { color: 'yellow', shape: 'box' });
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'contradiction-pitfalls',
      title: 'Assume the right thing',
      scene(s) {
        const head = s.text('To prove $p \\to q$ by contradiction, assume its negation:', { y: 50, size: 32, visible: false });
        const neg = s.tex('\\neg(p \\to q) \\;\\equiv\\; \\part{p}{p} \\land \\part{nq}{\\neg q}', { y: 120, size: 44, visible: false });
        const wrong = s.text('“Suppose $\\neg p$.”', { x: 250, y: 200, size: 32, color: C.red, visible: false });
        const wrongWhy = s.text('not the negation of $p \\to q$', { x: 640, y: 200, size: 30, color: C.red, visible: false });
        const right = s.text('“Suppose, for contradiction, that $p$ and $\\neg q$.”', { y: 280, size: 32, color: C.blue, visible: false });
        const listHead = s.text('The contradiction must contradict something:', { x: 100, y: 370, size: 30, anchor: [0, 0.5], weight: 600, visible: false });
        const items = ['• a hypothesis (often $p$ itself)', '• an earlier line of the proof', '• a known fact ($1 \\ne 0$, lowest terms, …)'].map((str, i) =>
          s.text(str, { x: 120, y: 420 + i * 48, size: 30, anchor: [0, 0.5], visible: false }),
        );
        return { head, neg, wrong, wrongWhy, right, listHead, items };
      },
      steps: [
        {
          say: 'To prove “if $p${p} then $q${q}” by contradiction, assume its negation. The negation of an implication is $p${p} and not $q${q}, so you get to use both: the hypothesis, and the negated conclusion.',
          do: async (s, o) => {
            await o.head.fadeIn();
            await o.neg.write();
            await s.all(o.neg.color('p', C.blue), o.neg.color('nq', C.blue));
          },
        },
        {
          say: 'A common mistake is to assume not $p${p}. That is not the negation of the implication, and a proof built on it proves nothing. Announce the right assumption: suppose, for contradiction, that $p${p} and not $q${q}.',
          do: async (s, o) => {
            await o.wrong.fadeIn();
            await o.wrongWhy.fadeIn();
            await s.strike(o.wrong);
            await o.right.fadeIn();
          },
        },
        {
          say: 'And end by naming what was contradicted: a hypothesis, an earlier line, or a known fact. “Contradiction” with no target loses credit.',
          do: async (s, o) => {
            await o.listHead.fadeIn();
            await s.stagger(o.items.map((m) => () => m.fadeIn({ shift: [-12, 0] })), 350);
          },
        },
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-contrapositive',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Prove this one by contrapositive.',
      prompt: 'Prove: for every integer $n$, if $n^2 - 6n + 5$ is even, then $n$ is odd.',
      answer: { type: 'proof' },
      hints: ['The conclusion “odd” negates to “even”, which unpacks nicely.', 'Expand $(2k)^2 - 6(2k) + 5$ and write it as $2(\\dots) + 1$.'],
      solution: [
        '**Proof.** We prove the contrapositive: if $n$ is even, then $n^2 - 6n + 5$ is odd.',
        'Let $n \\in \\mathbb{Z}$ be even, so $n = 2k$ for some $k \\in \\mathbb{Z}$.',
        'Then $n^2 - 6n + 5 = 4k^2 - 12k + 5 = 2(2k^2 - 6k + 2) + 1$.',
        'Since $2k^2 - 6k + 2 \\in \\mathbb{Z}$ (integers are closed under multiplication and subtraction), $n^2 - 6n + 5$ is odd. This proves the contrapositive, and therefore the theorem. ∎',
      ],
      rubric: [
        'Announces the contrapositive and states it correctly (if $n$ is even, then $n^2 - 6n + 5$ is odd), using that “not odd” means even.',
        'Unpacks “even” with a witness: $n = 2k$, $k \\in \\mathbb{Z}$.',
        'Algebra correct and repacked as $2m + 1$, with $m = 2k^2 - 6k + 2$ shown to be an integer.',
        'Concludes the contrapositive, and hence the theorem, explicitly.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-contradiction',
      kind: 'workout',
      title: 'Work it out',
      say: 'One more. Prove this one by contradiction.',
      prompt: 'Prove that there is no smallest positive rational number.',
      answer: { type: 'proof' },
      hints: ['Assume there is one, and call it $q$.', 'Find a smaller positive rational, and check that it really is rational.'],
      solution: [
        '**Proof.** Suppose, for contradiction, that $q$ is the smallest positive rational number.',
        'Write $q = a/b$ with $a, b \\in \\mathbb{Z}$, $b \\ne 0$. Then $q/2 = a/(2b)$ with $2b \\ne 0$, so $q/2 \\in \\mathbb{Q}$.',
        'Since $q > 0$, we have $0 < q/2 < q$. So $q/2$ is a positive rational smaller than $q$, contradicting the choice of $q$.',
        'Therefore there is no smallest positive rational number. ∎',
      ],
      rubric: [
        'Assumes the negation precisely: there is a smallest positive rational $q$.',
        'Shows $q/2$ is rational, with a nonzero denominator.',
        'Shows $0 < q/2 < q$.',
        'Names the contradiction (with the minimality of $q$) and concludes.',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-methods',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we finish, compare the two methods in your own words: what you assume, and what you aim for.',
      prompt: 'How do proof by contrapositive and proof by contradiction differ? For each, what exactly do you assume at the start, and what are you trying to reach?',
      points: [
        'Contrapositive: assume $\\neg q$ and reach $\\neg p$; it is a direct proof of an equivalent statement.',
        'Contradiction: assume $p$ and $\\neg q$ (or just $\\neg P$) and reach any contradiction, a statement and its negation.',
        'Contradiction gives you more to work with but a less specific target.',
        'A contrapositive proof is the special case where the contradiction is with $p$.',
      ],
    },

    // 16 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Contrapositive: when the negated conclusion unpacks better. First line: “We prove the contrapositive.”', 130),
          recapItem(s, '• Contradiction: for negative conclusions. Assume $p \\land \\neg q$, and name what you contradict.', 270),
          recapItem(s, 'Next: cases, counterexamples, and “exactly one”.', 420, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'Prove the contrapositive when the negated conclusion unpacks better than the hypothesis, and say so in the first line.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Use contradiction for negative conclusions. To prove an implication, assume $p${p} and not $q${q}, and name what you contradict.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next: proofs by cases, counterexamples, and proving that exactly one object exists.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
