/**
 * Lecture 11 · Functions, injections and surjections (foundations/PLAN.md § 11). Irani · Functions · Liebeck 19.
 *
 * Choreography: functions are arrow diagrams whose arrows are drawn as the voice names them; non-functions are made
 * on the same diagram (a missing arrow, a second arrow, both red) and repaired. Domain and codomain are two number
 * lines with x ↦ x² arrows between them; a non-well-defined rule sends one point with two names to two places.
 * Injective / surjective: definition cards, a collision or a missed target pulsing red, then scratch work and a
 * two-column proof. Restricting x² is done on a plane: half the parabola fades, half the codomain greys out.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, no DOM)

const sq = (x) => x * x;
const SAMPLES = [-2, -1, 0, 1, 2]; // x ↦ x² arrows
const RANGE_HITS = [...new Set(SAMPLES.map(sq))];
const halfName = { a: 1, b: 2 }; // 1/2 …
const twoName = { a: 2, b: 4 }; // … = 2/4
const fSum = ({ a, b }) => a + b; // f(a/b) = a + b, not well-defined

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** Ellipse path (stage coordinates). */
const ellipse = (cx, cy, rx, ry) => `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

/** Crossfade two mobs in the same spot. */
const swapMobs = (s, from, to) => s.all(from.fadeOut({ duration: 300 }), to.fadeIn({ shift: [0, 0], delay: 150 }));

// ---------------------------------------------------------------- lecture

export default {
  id: 'functions',
  title: 'Functions, injections and surjections',
  goals: [
    'State the definition of a function $f\\colon A \\to B$ and check that a rule is well-defined',
    'Distinguish domain, codomain and range',
    'Prove or disprove that a function is injective, surjective or bijective',
    'Know what injections and surjections say about the sizes of finite sets',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'function-def',
      title: 'What a function is',
      scene(s) {
        const f = s.mapDiagram({ x: 270, y: 320, gap: 280, domain: ['1', '2', '3'], codomain: ['a', 'b', 'c', 'd'], labels: ['A', 'B'], name: 'f', visible: false });
        const t = (str, y, color) => s.text(str, { x: 700, y, size: 30, color, width: 420, visible: false });
        const noOut = t('$3$ has no output: not a function', 68, C.red);
        const yesOut = t('every input has an output', 68, C.green);
        const twoOut = t('$1 \\mapsto a$ and $1 \\mapsto b$: not a function', 116, C.red);
        const oneOut = t('exactly one output each', 116, C.green);
        const fine = t('$a$ hit twice; $b$, $d$ unused: fine', 164, C.ink);
        const card = s.defCard({ x: 700, y: 392, width: 420, body: 'A **function** $f\\colon A \\to B$ assigns to each $a \\in A$ exactly one $f(a) \\in B$. (Formally: a subset of $A \\times B$ containing exactly one pair $(a, b)$ for each $a \\in A$.)', visible: false });
        return { f, noOut, yesOut, twoOut, oneOut, fine, card };
      },
      steps: [
        {
          say: 'A function from $A${A} to $B${B} sends inputs to outputs. Draw an arrow from each element of $A${A}: one goes to $a${a}, two goes to $a${a}. And three? With no arrow, this is not yet a function.',
          do: async (s, o) => {
            await o.f.fadeIn({ shift: [0, 0] });
            await o.f.addArrow(0, 0);
            await o.f.addArrow(1, 0);
            await s.all(o.f.highlightElement('dom', 2, 'red'), o.noOut.fadeIn());
          },
        },
        {
          say: 'Rule one: every input gets an output. Send three to $c${c}, and that requirement is met.',
          do: async (s, o) => {
            await o.f.addArrow(2, 2, { color: 'green' });
            await s.all(o.f.highlightElement('dom', 2, 'green'), swapMobs(s, o.noOut, o.yesOut));
          },
        },
        {
          say: 'Rule two: exactly one output. If one also pointed to $b${b}, then $f(1)${f of one} would be ambiguous, and again we would not have a function.',
          do: async (s, o) => {
            await o.f.addArrow(0, 1, { color: 'red' });
            await s.all(o.f.highlightElement('dom', 0, 'red'), o.twoOut.fadeIn());
            await o.f.removeArrow(0, 1);
            await s.all(o.f.clear(), swapMobs(s, o.twoOut, o.oneOut));
          },
        },
        {
          say: 'What is allowed: outputs may repeat, and some targets may be unused. Here $a${a} is hit twice and $b${b} and $d${d} are never hit. That is perfectly fine for a function.',
          do: async (s, o) => {
            await o.f.highlightElement('cod', 0, 'yellow');
            await s.all(o.f.highlightElement('cod', 1, 'teal'), o.f.highlightElement('cod', 3, 'teal'));
            await o.fine.fadeIn();
          },
        },
        {
          say: 'So the definition: a function $f\\colon A \\to B${f from A to B} assigns to each $a${a} in $A${A} exactly one $f(a)${f of a} in $B${B}. Formally it is a subset of $A \\times B${A cross B} containing exactly one pair for each $a${a} in $A${A}.',
          do: (s, o) => o.card.reveal(),
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'domain-codomain',
      title: 'Domain, codomain, range',
      scene(s) {
        const head = s.tex('f\\colon \\part{d}{\\mathbb{R}} \\to \\part{c}{\\mathbb{R}},\\quad x \\mapsto x^2', { x: 480, y: 56, size: 38, visible: false });
        const headG = s.tex('g\\colon \\mathbb{R} \\to \\part{c}{[0, \\infty)},\\quad x \\mapsto x^2', { x: 480, y: 56, size: 38, visible: false });
        const dom = s.numberLine({ x: 480, y: 175, width: 720, range: [-3, 5], visible: false });
        const cod = s.numberLine({ x: 480, y: 370, width: 720, range: [-3, 5], visible: false });
        const X = (v) => 480 + dom.toX(v);
        const domLab = s.text('domain $\\mathbb{R}$', { x: 60, y: 118, size: 30, anchor: [0, 0.5], color: C.blue, visible: false });
        const codLab = s.text('codomain $\\mathbb{R}$', { x: 60, y: 313, size: 30, anchor: [0, 0.5], color: C.teal, visible: false });
        const codLabG = s.text('codomain $[0, \\infty)$', { x: 60, y: 313, size: 30, anchor: [0, 0.5], color: C.teal, visible: false });
        const arrows = SAMPLES.map((x) => s.arrow(X(x), 236, X(sq(x)), 352, { color: C.blue, width: 3, visible: false }));
        const range = s.tex('\\operatorname{range} f = \\{\\, f(a) : a \\in \\mathbb{R} \\,\\} = [0, \\infty)', { x: 480, y: 470, size: 34, color: C.green, visible: false });
        const cover = s.rect(X(-3) - 40, 340, X(0) - 14 - (X(-3) - 40), 70, { color: C.bg, fill: C.bg, width: 1, visible: false });
        const diff = s.text('same formula, different codomain: a different function', { x: 480, y: 540, size: 30, color: C.yellow, visible: false });
        return { head, headG, dom, cod, X, domLab, codLab, codLabG, arrows, range, cover, diff };
      },
      steps: [
        {
          say: 'A function comes with three pieces of data: a domain, a codomain, and the rule. For squaring on the reals, both the domain and the codomain are $\\mathbb{R}${R}. The codomain is where outputs are allowed to land.',
          do: async (s, o) => {
            await o.head.write();
            await s.all(o.dom.fadeIn({ shift: [0, 0] }), o.domLab.fadeIn(), o.head.color('d', C.blue));
            await s.all(o.cod.fadeIn({ shift: [0, 0] }), o.codLab.fadeIn(), o.head.color('c', C.teal));
            o.pts = SAMPLES.map((x) => o.dom.point(x, { color: 'blue' }));
            await s.all(o.pts);
            await s.stagger(o.arrows.map((a) => () => a.draw({ duration: 600 })), 250);
            o.hits = RANGE_HITS.map((v) => o.cod.point(v, { color: 'green' }));
            await s.all(o.hits);
          },
        },
        {
          say: 'The range, or image, is the set of values actually hit: all $f(a)${f of a} for $a${a} in the domain. For $x^2${x squared} that is $[0, \\infty)${the interval from zero to infinity}, smaller than the codomain.',
          do: async (s, o) => {
            o.ray = o.cod.interval(0, Infinity, { color: 'green', duration: 900 });
            await o.ray;
            await o.range.write();
          },
        },
        {
          say: 'Now keep the formula but shrink the codomain to $[0, \\infty)${zero to infinity}. That is a different function, and as we will see, it differs in an important way: this one is onto.',
          do: async (s, o) => {
            await swapMobs(s, o.head, o.headG);
            await o.headG.color('c', C.teal);
            await s.all(o.cover.fadeIn({ shift: [0, 0], to: 0.85 }), swapMobs(s, o.codLab, o.codLabG));
            await o.diff.fadeIn();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'try-is-function',
      kind: 'try',
      title: 'Is it a function?',
      say: 'Check each rule: does every input get exactly one output, inside the codomain?',
      prompt: 'Which of these define functions? Select all.',
      answer: { type: 'multi', value: ['c'] },
      choices: [
        { id: 'a', label: '$f\\colon \\mathbb{R} \\to \\mathbb{R}$, $f(x) = 1/x$', why: 'Not a function: $f(0)$ is undefined, and $0$ is in the domain.' },
        { id: 'b', label: '$f\\colon \\mathbb{Q} \\to \\mathbb{Z}$, $f(a/b) = a$', why: 'Not well-defined: $1/2 = 2/4$ would be sent to both $1$ and $2$.' },
        { id: 'c', label: '$f\\colon \\mathbb{Z} \\to \\mathbb{Z}$, $f(n) = n^2$', why: 'A function: every integer has exactly one square, and it is an integer.' },
        { id: 'd', label: '$f\\colon \\mathbb{R} \\to \\mathbb{R}$, $f(x) = \\sqrt{x}$', why: 'Not a function: $\\sqrt{x}$ is undefined for $x < 0$.' },
        { id: 'e', label: '$f\\colon \\mathbb{N} \\to \\mathbb{N}$, $f(n) = n - 1$', why: 'Not a function: $f(1) = 0 \\notin \\mathbb{N}$ with our convention that $\\mathbb{N}$ starts at $1$.' },
      ],
      hint: 'Check every input has exactly one output in the codomain.',
      solution: [
        'Only (c) works: each integer $n$ has exactly one square $n^2 \\in \\mathbb{Z}$.',
        '(a) and (d) miss inputs ($0$, and the negatives). (b) gives two outputs for one input written two ways. (e) leaves the codomain: $f(1) = 0 \\notin \\mathbb{N}$.',
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'well-defined',
      title: 'Well-defined',
      scene(s) {
        const head = s.tex('f\\colon \\mathbb{Q} \\to \\mathbb{Z},\\quad f(a/b) = a + b', { x: 480, y: 56, size: 38, visible: false });
        const qOval = s.path(ellipse(230, 290, 125, 140), { color: C.ink, width: 3, visible: false });
        const zOval = s.path(ellipse(730, 290, 110, 140), { color: C.ink, width: 3, visible: false });
        const qName = s.tex('\\mathbb{Q}', { x: 85, y: 160, size: 38, visible: false });
        const zName = s.tex('\\mathbb{Z}', { x: 875, y: 160, size: 38, visible: false });
        const pt = s.dot(230, 285, { color: C.blue, visible: false });
        const ptName = s.tex(`\\tfrac{${halfName.a}}{${halfName.b}} = \\tfrac{${twoName.a}}{${twoName.b}}`, { x: 230, y: 235, size: 36, color: C.blue, visible: false });
        const v1 = fSum(halfName);
        const v2 = fSum(twoName);
        const d1 = s.dot(730, 215, { color: C.red, visible: false });
        const d2 = s.dot(730, 355, { color: C.red, visible: false });
        const l1 = s.tex(String(v1), { x: 770, y: 215, size: 36, color: C.red, visible: false });
        const l2 = s.tex(String(v2), { x: 770, y: 355, size: 36, color: C.red, visible: false });
        const a1 = s.arrow(250, 278, 712, 220, { color: C.red, width: 3, visible: false });
        const a2 = s.arrow(250, 292, 712, 350, { color: C.red, width: 3, visible: false });
        const c1 = s.tex(`f(${halfName.a}/${halfName.b}) = ${halfName.a} + ${halfName.b} = ${v1}`, { x: 480, y: 190, size: 32, visible: false });
        const c2 = s.tex(`f(${twoName.a}/${twoName.b}) = ${twoName.a} + ${twoName.b} = ${v2}`, { x: 480, y: 380, size: 32, visible: false });
        const bad = s.stamp('not well-defined', { x: 480, y: 500, color: 'red' });
        const headG = s.tex('g\\colon \\mathbb{Q} \\to \\mathbb{Q},\\quad g(a/b) = 2a/b', { x: 480, y: 56, size: 38, visible: false });
        const chk1 = s.tex('\\text{If } \\tfrac{a}{b} = \\tfrac{c}{d}, \\text{ then}', { x: 480, y: 175, size: 38, color: C.blue, visible: false });
        const chk2 = s.tex('g(\\tfrac{a}{b}) = 2 \\cdot \\tfrac{a}{b} = 2 \\cdot \\tfrac{c}{d} = g(\\tfrac{c}{d})', { x: 480, y: 270, size: 40, color: C.green, visible: false });
        const ok = s.stamp('well-defined', { x: 480, y: 380, color: 'green' });
        const later = s.text('the same check returns for functions on equivalence classes (lecture 14)', { x: 480, y: 480, size: 30, color: C.muted, width: 760, visible: false });
        return { head, qOval, zOval, qName, zName, pt, ptName, d1, d2, l1, l2, a1, a2, c1, c2, bad, headG, chk1, chk2, ok, later };
      },
      steps: [
        {
          say: 'Here is a rule that looks fine: send the fraction $a/b${a over b} to $a + b${a plus b}. But one half and two fourths are the same rational number, written two ways.',
          do: async (s, o) => {
            await o.head.write();
            await s.all(o.qOval.draw({ duration: 700 }), o.zOval.draw({ duration: 700 }), o.qName.fadeIn(), o.zName.fadeIn());
            await o.pt.draw();
            await o.ptName.fadeIn();
          },
        },
        {
          say: 'Apply the rule to each name. One half gives three, two fourths gives six. One input, two outputs: the rule does not define a function.',
          do: async (s, o) => {
            await s.all(o.a1.draw(), o.c1.fadeIn());
            await s.all(o.d1.draw(), o.l1.fadeIn());
            await s.all(o.a2.draw(), o.c2.fadeIn());
            await s.all(o.d2.draw(), o.l2.fadeIn());
            await o.bad.slam();
          },
        },
        {
          say: 'When inputs have several names, the output must not depend on the name. So check it: if $\\tfrac{a}{b} = \\tfrac{c}{d}${a over b equals c over d}, then $g(\\tfrac{a}{b}) = g(\\tfrac{c}{d})${g of a over b equals g of c over d}. For doubling, it holds.',
          do: async (s, o) => {
            const old = [o.head, o.qOval, o.zOval, o.qName, o.zName, o.pt, o.ptName, o.d1, o.d2, o.l1, o.l2, o.a1, o.a2, o.c1, o.c2, o.bad];
            await s.all(old.map((m, i) => m.fadeOut({ delay: i * 20 })));
            await o.headG.write();
            await o.chk1.write();
            await o.chk2.write({ duration: 1200 });
            await o.ok.slam();
          },
        },
        {
          say: 'This check, equal inputs give equal outputs, comes back in lecture fourteen, when we define functions on equivalence classes.',
          do: (s, o) => o.later.fadeIn(),
        },
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'injective',
      title: 'One-to-one',
      scene(s) {
        const card = s.defCard({ y: 68, size: 30, title: false, body: '$f$ is **injective** iff $\\forall a_1, a_2 \\in A,\\ \\part{h}{f(a_1) = f(a_2)} \\implies \\part{c}{a_1 = a_2}$', visible: false });
        const same = s.tex('\\text{equivalently: } a_1 \\ne a_2 \\implies f(a_1) \\ne f(a_2)', { x: 480, y: 134, size: 30, color: C.muted, visible: false });
        const f = s.mapDiagram({ x: 480, y: 340, gap: 300, domain: ['1', '2', '3'], codomain: ['a', 'b', 'c'], labels: ['A', 'B'], visible: false });
        const coll = s.text('$2 \\ne 3$ but both go to $b$: not injective', { x: 480, y: 535, size: 30, color: C.red, visible: false });
        const fx = s.tex('f\\colon \\mathbb{R} \\to \\mathbb{R},\\quad f(x) = 3x + 7', { x: 480, y: 182, size: 34, visible: false });
        const p = s.proof({ y: 212, width: 900, height: 295, size: 31, visible: false });
        const dis = s.tex(`g\\colon \\mathbb{R} \\to \\mathbb{R},\\ g(x) = x^2{:}\\quad g(-1) = ${sq(-1)} = g(1),\\ -1 \\ne 1`, { x: 480, y: 535, size: 32, color: C.red, visible: false });
        return { card, same, f, coll, fx, p, dis };
      },
      steps: [
        {
          say: 'A function is injective, or one-to-one, when different inputs never share an output. Here every element of $A${A} has its own target, so this one is injective.',
          do: async (s, o) => {
            await o.f.fadeIn({ shift: [0, 0] });
            for (const j of [0, 1, 2]) await o.f.addArrow(j, j);
          },
        },
        {
          say: 'Move the arrow from three onto $b${b}, and two different inputs collide. That collision is exactly what injective forbids.',
          do: async (s, o) => {
            await o.f.removeArrow(2, 2);
            await o.f.addArrow(2, 1);
            await o.f.showCollision();
            await o.coll.fadeIn();
          },
        },
        {
          say: 'For proofs, use the definition in this form: assume two outputs are equal, and derive that the inputs are equal. It is the contrapositive of “different inputs, different outputs”.',
          do: async (s, o) => {
            await o.card.reveal();
            await s.all(o.card.color('h', C.blue), o.card.color('c', C.green, { delay: 300 }));
            await o.same.fadeIn();
          },
        },
        {
          say: 'Let us prove $f(x) = 3x + 7${f of x equals three x plus seven} is injective. Take $a_1${a one} and $a_2${a two} with equal outputs. Then $3a_1 + 7 = 3a_2 + 7${three a one plus seven equals three a two plus seven}; subtract seven and divide by three, and the inputs are equal.',
          do: async (s, o) => {
            await s.all(o.f.fadeOut(), o.coll.fadeOut());
            await o.fx.write();
            o.p.show();
            await o.p.add('**Proof.** Let $a_1, a_2 \\in \\mathbb{R}$, $f(a_1) = f(a_2)$.', { kind: 'assume', why: 'hypothesis' });
            await o.p.add('Then $3a_1 + 7 = 3a_2 + 7$.', { why: 'def. of $f$' });
            await o.p.add('So $3a_1 = 3a_2$, hence $a_1 = a_2$.', { why: 'algebra' });
            await o.p.add('Therefore $f$ is injective.', { kind: 'conclude', why: 'def. of injective' });
            await o.p.qed();
          },
        },
        {
          say: 'To show a function is not injective, exhibit two specific different inputs with the same output. For squaring on the real numbers: minus one and one both go to one.',
          do: (s, o) => o.dis.write({ duration: 1100 }),
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'surjective',
      title: 'Onto',
      scene(s) {
        const card = s.defCard({ y: 70, size: 32, title: false, tex: 'f \\text{ is \\textbf{surjective}} \\iff \\part{a}{\\forall b \\in B}\\ \\part{e}{\\exists a \\in A},\\ f(a) = b', visible: false });
        const f = s.mapDiagram({ x: 480, y: 320, gap: 300, domain: ['1', '2', '3'], codomain: ['a', 'b', 'c'], arrows: [[0, 0], [1, 1], [2, 1]], labels: ['A', 'B'], visible: false });
        const miss = s.text('nothing goes to $c$: not surjective', { x: 480, y: 530, size: 30, color: C.red, visible: false });
        const pad = s.scratch({ x: 60, y: 128, w: 840, h: 200, visible: false });
        const strip = s.tex('\\text{scratch: } 3a + 7 = b \\iff a = (b - 7)/3', { x: 480, y: 136, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 170, width: 900, height: 320, size: 31, visible: false });
        const bad = s.tex(`g\\colon \\mathbb{Z} \\to \\mathbb{Z},\\ g(n) = 3n + 7{:}\\quad g(n) = 0 \\implies n = -7/3 \\notin \\mathbb{Z}`, { x: 480, y: 530, size: 30, color: C.red, visible: false });
        return { card, f, miss, pad, strip, p, bad };
      },
      steps: [
        {
          say: 'A function is surjective, or onto, when every element of the codomain is hit. Here nothing goes to $c${c}, so this function is not onto.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.f.fadeIn({ shift: [0, 0] });
            await o.f.showMissed();
            await o.miss.fadeIn();
          },
        },
        {
          say: 'The definition has the shape for all, there exists: for every $b${b} in $B${B}, some $a${a} in $A${A} maps to it. So a proof fixes an arbitrary $b${b}, and then must produce an $a${a}.',
          do: async (s, o) => {
            await s.all(o.card.color('a', C.blue), o.card.color('e', C.green, { delay: 300 }));
          },
        },
        {
          say: 'To find that $a${a} for $f(x) = 3x + 7${f of x equals three x plus seven}, work on scratch paper: solve $3a + 7 = b${three a plus seven equals b} for $a${a}. You get $a = (b - 7)/3${a equals b minus seven, over three}.',
          do: async (s, o) => {
            await s.all(o.f.fadeOut(), o.miss.fadeOut());
            await o.pad.reveal();
            await o.pad.add('want $f(a) = b$: $\\ 3a + 7 = b$', { color: 'green' });
            await o.pad.add('solve: $\\ a = (b - 7)/3$', { color: 'yellow' });
          },
        },
        {
          say: 'Now the proof runs forwards. Let $b${b} be any real number, define $a${a} by that formula, note that it is a real number, and verify that $f(a) = b${f of a equals b}.',
          do: async (s, o) => {
            await o.pad.fadeOut({ shift: [-30, 0] });
            await o.strip.fadeIn();
            o.p.show();
            await o.p.add('**Proof.** Let $b \\in \\mathbb{R}$.', { kind: 'assume', why: 'arbitrary target' });
            o.def = o.p.add('Let $a = (b - 7)/3$. Then $a \\in \\mathbb{R}$.', { why: '$\\mathbb{R}$ closed under $-$, $\\div 3$' });
            await o.def;
            await o.p.highlight(o.def, 'yellow');
            await o.p.add('$f(a) = 3 \\cdot \\dfrac{b - 7}{3} + 7 = b$.', { why: 'def. of $f$' });
            await o.p.add('Therefore $f$ is surjective.', { kind: 'conclude', why: 'def. of surjective' });
            await o.p.qed();
          },
        },
        {
          say: 'The $a${a} you find must lie in the domain. The same formula on the integers fails: to hit zero we would need $n = -\\tfrac{7}{3}${n equals minus seven thirds}, which is not an integer. So $3n + 7${three n plus seven} is not onto $\\mathbb{Z}${Z}.',
          do: async (s, o) => {
            await o.p.unhighlight(o.def);
            await o.bad.write({ duration: 1200 });
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'try-inj-surj',
      kind: 'try',
      title: 'Classify',
      say: 'Classify this function. Test each property on its own.',
      prompt: '$f\\colon \\mathbb{Z} \\to \\mathbb{Z}$, $f(n) = 2n$. Which is true?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: 'Injective, not surjective', why: '$2n = 2m \\Rightarrow n = m$, and $1$ is not hit: $2n = 1$ has no integer solution.' },
        { id: 'b', label: 'Surjective, not injective', why: 'Odd numbers are never hit, and equal outputs force equal inputs.' },
        { id: 'c', label: 'Bijective', why: 'Not surjective: odd numbers, like $1$, are missed.' },
        { id: 'd', label: 'Neither', why: 'It is injective: if $2n = 2m$ then $n = m$.' },
      ],
      hint: 'Is $1$ in the range?',
      solution: [
        'Injective: if $f(n) = f(m)$ then $2n = 2m$, so $n = m$.',
        'Not surjective: $f(n) = 1$ would need $n = 1/2 \\notin \\mathbb{Z}$. So (a).',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'restrict',
      title: 'Changing domain and codomain',
      scene(s) {
        const pl = s.plane({ x: 255, y: 300, width: 400, range: [-3, 3, -2, 5], labels: false, visible: false });
        const curve = (a, b) => {
          const pts = [];
          for (let i = 0; i <= 40; i++) {
            const x = a + ((b - a) * i) / 40;
            pts.push(pl.toStage([x, sq(x)]));
          }
          return 'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ');
        };
        const left = s.path(curve(-Math.sqrt(5), 0), { color: C.blue, width: 4, visible: false });
        const right = s.path(curve(0, Math.sqrt(5)), { color: C.blue, width: 4, visible: false });
        const [x0, y0] = pl.toStage([-3, 0]);
        const [x1, y1] = pl.toStage([3, -2]);
        const shade = s.rect(x0, y0 + 2, x1 - x0, y1 - y0 - 2, { color: C.faint, fill: FILL.ink, width: 1, visible: false });
        const row = (tex, y, color) => s.tex(tex, { x: 720, y, size: 32, color, visible: false });
        const r1 = row('\\mathbb{R} \\to \\mathbb{R}{:}\\ \\text{neither}', 120, C.red);
        const r2 = row('[0, \\infty) \\to \\mathbb{R}{:}\\ \\text{injective}', 230, C.ink);
        const r3 = row('[0, \\infty) \\to [0, \\infty){:}\\ \\text{bijective}', 340, C.green);
        const inv = row('\\text{inverse: } y \\mapsto \\sqrt{y}', 450, C.green);
        return { pl, left, right, shade, r1, r2, r3, inv };
      },
      steps: [
        {
          say: 'Squaring from $\\mathbb{R}${R} to $\\mathbb{R}${R}. The horizontal line at height one hits the graph twice, at minus one and one, so it is not injective. The line at minus one never hits it, so it is not surjective either.',
          do: async (s, o) => {
            await o.pl.fadeIn({ shift: [0, 0] });
            await s.all(o.left.draw({ duration: 700 }), o.right.draw({ duration: 700 }));
            o.h1 = o.pl.line({ a: 0, b: 1, c: 1 }, { color: C.red, width: 3 });
            await o.h1.draw({ duration: 600 });
            o.q1 = o.pl.point([-1, 1], { color: C.red });
            o.q2 = o.pl.point([1, 1], { color: C.red });
            await s.all(o.q1.draw(), o.q2.draw());
            o.h2 = o.pl.line({ a: 0, b: 1, c: -1 }, { color: C.red, width: 3, dash: true });
            await o.h2.draw({ duration: 600 });
            await o.r1.fadeIn();
          },
        },
        {
          say: 'Shrink the domain to $[0, \\infty)${zero to infinity}: the left half of the parabola goes away, and every horizontal line meets the graph at most once. Now it is injective.',
          do: async (s, o) => {
            await s.all(o.left.fadeOut(), o.q1.fadeOut());
            await o.q2.recolor(C.green);
            await o.r2.fadeIn();
          },
        },
        {
          say: 'Shrink the codomain to $[0, \\infty)${zero to infinity} as well. The negative heights are no longer targets, and every remaining height is hit exactly once. That is a bijection, and its inverse is the square root.',
          do: async (s, o) => {
            await s.all(o.shade.fadeIn({ shift: [0, 0], to: 0.9 }), o.h2.fadeOut());
            await s.all(o.right.recolor(C.green), o.h1.recolor(C.green));
            await o.r3.fadeIn();
            await o.inv.write();
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-injective',
      kind: 'blanks',
      title: 'Prove injective',
      say: 'Fill in this injectivity proof. Cross-multiplying is allowed here; think about why.',
      prompt: '$f\\colon \\mathbb{R} \\setminus \\{1\\} \\to \\mathbb{R}$, $f(x) = \\dfrac{x}{x - 1}$. Complete the proof that $f$ is injective.',
      lines: [
        ['\\text{Suppose } f(a) = f(b). \\text{ Then } a(b - 1) = ', { id: 'cross', chips: ['b(a - 1)', 'a(a - 1)', 'b(b - 1)'], answer: 'b(a - 1)', hint: 'Multiply both sides of $\\frac{a}{a-1} = \\frac{b}{b-1}$ by $(a - 1)(b - 1)$.' }, ','],
        ['\\text{i.e. } ab - a = ', { id: 'expand', chips: ['ab - b', 'ab - a', 'ab + b'], answer: 'ab - b', hint: 'Expand $b(a - 1)$.' }, ','],
        ['\\text{so } a = ', { id: 'end', chips: ['b', '-b', '1'], answer: 'b', hint: 'Cancel $ab$ from both sides.' }, '.'],
      ],
      solution: [
        'Cross-multiplying is allowed because $a - 1 \\ne 0$ and $b - 1 \\ne 0$ (both $a, b$ are in the domain $\\mathbb{R} \\setminus \\{1\\}$).',
        '$a(b - 1) = b(a - 1)$ expands to $ab - a = ab - b$, so $-a = -b$ and $a = b$.',
        'The function is not surjective onto $\\mathbb{R}$: $x/(x - 1) = 1$ would mean $x = x - 1$, which is impossible.',
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'bijection-sizes',
      title: 'Bijections and sizes',
      scene(s) {
        const opts = { gap: 165, spacing: 62, scale: 0.85, labels: ['A', 'B'], visible: false };
        const maps = [
          s.mapDiagram({ x: 175, y: 255, domain: ['1', '2'], codomain: ['a', 'b', 'c'], arrows: [[0, 0], [1, 2]], ...opts }),
          s.mapDiagram({ x: 480, y: 255, domain: ['1', '2', '3'], codomain: ['a', 'b'], arrows: [[0, 0], [1, 1], [2, 1]], ...opts }),
          s.mapDiagram({ x: 785, y: 255, domain: ['1', '2', '3'], codomain: ['a', 'b', 'c'], arrows: [[0, 1], [1, 0], [2, 2]], ...opts }),
        ];
        const names = ['injective', 'surjective', 'bijective'].map((t, i) => s.text(t, { x: 175 + 305 * i, y: 70, size: 32, weight: 600, color: [C.blue, C.teal, C.green][i], visible: false }));
        const caps = ['\\lvert A \\rvert \\le \\lvert B \\rvert', '\\lvert A \\rvert \\ge \\lvert B \\rvert', '\\lvert A \\rvert = \\lvert B \\rvert'].map((t, i) => s.tex(t, { x: 175 + 305 * i, y: 410, size: 36, visible: false }));
        const finite = s.text('same finite size: injective $\\iff$ surjective (pigeonhole, lecture 21)', { x: 480, y: 478, size: 30, visible: false });
        const inf = s.tex('n \\mapsto 2n \\text{ on } \\mathbb{N}{:}\\ \\text{injective, but misses every odd number}', { x: 480, y: 535, size: 30, color: C.red, visible: false });
        return { maps, names, caps, finite, inf };
      },
      steps: [
        {
          say: 'For finite sets, these properties say something about sizes. An injection never doubles up, so the domain is at most as big as the codomain. A surjection covers everything, so the domain is at least as big.',
          do: async (s, o) => {
            for (const i of [0, 1]) {
              await s.all(o.maps[i].fadeIn({ shift: [0, 0] }), o.names[i].fadeIn());
              await o.caps[i].write();
            }
          },
        },
        {
          say: 'A bijection is both injective and surjective. It pairs the elements off perfectly, so the two sets have the same size.',
          do: async (s, o) => {
            await s.all(o.maps[2].fadeIn({ shift: [0, 0] }), o.names[2].fadeIn());
            await o.caps[2].write();
            await o.caps[2].indicate({ color: C.green });
          },
        },
        {
          say: 'So for finite sets of the same size, injective and surjective are the same condition. That is the pigeonhole principle, which we prove in lecture twenty-one.',
          do: (s, o) => o.finite.fadeIn(),
        },
        {
          say: 'For infinite sets this fails. Doubling on $\\mathbb{N}${N} is injective but not surjective. This is where the sizes of infinite sets get interesting.',
          do: (s, o) => o.inf.write({ duration: 1100 }),
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'function-pitfalls',
      title: 'Common mistakes',
      scene(s) {
        const wrong = (tex, y) => s.tex(tex, { x: 70, y, size: 32, anchor: [0, 0.5], visible: false });
        const fix = (str, y) => s.text(str, { x: 100, y, size: 30, anchor: [0, 0.5], width: 800, align: 'left', color: C.green, visible: false });
        const rows = [
          { w: wrong('\\text{“Injective: if } a_1 = a_2 \\text{ then } f(a_1) = f(a_2).\\text{”}', 85), f: fix('true of every function. Injective runs the other way: $f(a_1) = f(a_2) \\implies a_1 = a_2$', 150) },
          { w: wrong('\\text{“Surjective: let } a = (b - 7)/3. \\ \\blacksquare\\text{”}', 255), f: fix('name $a$, show $a \\in A$, and verify $f(a) = b$', 320) },
          { w: wrong('\\text{“Not injective, because the formula has a square.”}', 425), f: fix(`give specific elements: on $\\mathbb{R}$, $f(-1) = ${sq(-1)} = f(1)$ with $-1 \\ne 1$. (On $[0, \\infty)$ the same formula is injective.)`, 495) },
        ];
        return { rows };
      },
      steps: [
        {
          say: 'Here is the trap with injectivity: “if the inputs are equal, the outputs are equal” is backwards. Every function does that. Injective goes from equal outputs to equal inputs.',
          do: async (s, o) => {
            const r = o.rows[0];
            await r.w.write();
            await s.strike(r.w);
            await r.f.fadeIn({ shift: [-12, 0] });
          },
        },
        {
          say: 'A surjectivity proof that only states a formula for $a${a} is incomplete. It must name $a${a}, show $a${a} is in the domain, and verify that $f(a) = b${f of a equals b}. Each missing piece loses credit.',
          do: async (s, o) => {
            const r = o.rows[1];
            await r.w.write();
            await s.strike(r.w);
            await r.f.fadeIn({ shift: [-12, 0] });
          },
        },
        {
          say: 'And a disproof needs specific elements, not a reason that sounds right. Name two inputs and compute their outputs. The same formula is injective on $[0, \\infty)${zero to infinity}, so a formula alone can’t decide it.',
          do: async (s, o) => {
            const r = o.rows[2];
            await r.w.write();
            await s.strike(r.w);
            await r.f.fadeIn({ shift: [-12, 0] });
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-bijection',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Three things to prove here: the outputs land in the codomain, injective, and surjective.',
      prompt: 'Let $f\\colon \\mathbb{R} \\setminus \\{2\\} \\to \\mathbb{R} \\setminus \\{1\\}$, $f(x) = \\dfrac{x}{x - 2}$. Prove that $f$ is well-defined (lands in the codomain) and bijective.',
      answer: { type: 'proof' },
      hints: [
        'Why can $f(x)$ never equal $1$?',
        'For surjectivity solve $y = x/(x - 2)$ for $x$, and check $x \\ne 2$.',
      ],
      solution: [
        '**Proof.** *Codomain.* Let $x \\in \\mathbb{R} \\setminus \\{2\\}$. If $x/(x - 2) = 1$, then $x = x - 2$, which is impossible. So $f(x) \\in \\mathbb{R} \\setminus \\{1\\}$.',
        '*Injective.* Let $a, b \\in \\mathbb{R} \\setminus \\{2\\}$ with $a/(a - 2) = b/(b - 2)$. Multiplying by $(a - 2)(b - 2) \\ne 0$ gives $ab - 2a = ab - 2b$, so $a = b$.',
        '*Surjective.* Let $y \\in \\mathbb{R} \\setminus \\{1\\}$ and put $x = 2y/(y - 1)$, defined since $y \\ne 1$. If $x = 2$, then $2y = 2y - 2$, impossible; so $x \\in \\mathbb{R} \\setminus \\{2\\}$. Then $x - 2 = 2/(y - 1)$, so $f(x) = \\dfrac{2y/(y - 1)}{2/(y - 1)} = y$.',
        'Hence $f$ is a bijection. ∎',
      ],
      rubric: [
        'Shows $f(x) \\ne 1$, so $f$ lands in the codomain.',
        'Injectivity: from $f(a) = f(b)$ to $a = b$ with valid algebra (denominators nonzero).',
        'Surjectivity names the preimage $x = 2y/(y - 1)$ and shows it is in the domain ($x \\ne 2$).',
        'Verifies $f(x) = y$.',
        'Concludes that $f$ is bijective.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-surjective',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap, explain how a surjectivity proof goes, and why the domain check matters.',
      prompt: 'Explain how to prove a function is surjective, and why checking that your preimage lies in the domain matters.',
      points: [
        'Surjective is “for all $b$ there exists $a$”, so the proof fixes an arbitrary $b$ in the codomain.',
        'Find $a$ by scratch work: solve $f(a) = b$ for $a$.',
        'The proof must show $a \\in A$ and verify $f(a) = b$.',
        'Example: $3n + 7$ on $\\mathbb{Z}$ is not onto, because $(b - 7)/3$ need not be an integer.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• A function gives each input exactly one output in the codomain; a rule on names must be well-defined.', 120),
          recapItem(s, '• Injective: $f(a_1) = f(a_2) \\implies a_1 = a_2$. Surjective: fix $b$, find $a \\in A$, verify $f(a) = b$.', 250),
          recapItem(s, 'Next: composing functions, inverses, images and preimages.', 380, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'A function assigns each input exactly one output in the codomain, and when inputs have several names, the rule must be well-defined.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Injective: equal outputs force equal inputs. Surjective: fix a target, solve for a preimage, show it lies in the domain, and verify it.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time we combine functions by composition, invert bijections, and push sets forwards and backwards with images and preimages.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
