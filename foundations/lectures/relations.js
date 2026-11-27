/**
 * Lecture 13 · Relations and their properties (foundations/PLAN.md § 13). Irani · Relations.
 *
 * Choreography: a relation is drawn as a directed graph whose arrows are drawn as the voice names the pairs; the
 * four properties each get a small panel where the missing arrows appear (loops, return arrows, shortcuts) or a
 * forbidden one flashes red and disappears. The divisibility order on the divisors of 12 sheds its loops and
 * implied arrows and then slides into its Hasse diagram.
 */
import { C } from '../../lectern/src/core/stage.js';
import { ease } from '../../lectern/src/core/tween.js';

// ---------------------------------------------------------------- data (computed)

/** Properties of a relation R (list of pairs) on the finite set `els`. */
function props(els, R) {
  const has = (a, b) => R.some(([x, y]) => x === a && y === b);
  const refl = els.every((a) => has(a, a));
  const sym = R.every(([a, b]) => has(b, a));
  const anti = R.every(([a, b]) => a === b || !has(b, a));
  const trans = R.every(([a, b]) => R.every(([c, d]) => c !== b || has(a, d)));
  return { refl, sym, anti, trans };
}
const relOn = (els, rel) => els.flatMap((a) => els.filter((b) => rel(a, b)).map((b) => [a, b]));
const divides = (a, b) => b % a === 0;

// relation-def: divisibility on {1, …, 6}
const SIX = [1, 2, 3, 4, 5, 6];
const DIV6 = relOn(SIX, divides).map(([a, b]) => [a - 1, b - 1]);

// try-properties
const TRY_EL = [1, 2, 3];
const TRY_R = [[1, 1], [2, 2], [3, 3], [1, 2], [2, 1]];
const TRY_P = props(TRY_EL, TRY_R);
const TRY_ANSWER = ['refl', 'sym', 'anti', 'trans'].filter((k) => TRY_P[k]);

// try-subset-order: ⊆ on P({1, 2})
const PSET = [[], [1], [2], [1, 2]];
const subset = (X, Y) => X.every((x) => Y.includes(x));
const SUB_P = props(PSET, relOn(PSET, subset));
const SUB_TOTAL = PSET.every((X) => PSET.every((Y) => subset(X, Y) || subset(Y, X)));

// partial-orders: divisibility on the divisors of 12
const D12 = [1, 2, 3, 4, 6, 12];
const ALL12 = relOn(D12, divides).map(([a, b]) => [D12.indexOf(a), D12.indexOf(b)]);
const LOOPS12 = ALL12.filter(([i, j]) => i === j);
const COVER12 = ALL12.filter(([i, j]) => i !== j && !D12.some((k) => k !== D12[i] && k !== D12[j] && divides(D12[i], k) && divides(k, D12[j])));
const IMPLIED12 = ALL12.filter(([i, j]) => i !== j && !COVER12.some(([a, b]) => a === i && b === j));
const INCOMP = [D12.indexOf(4), D12.indexOf(6)];
const HASSE = { 1: [0, 145], 2: [-90, 45], 3: [90, 45], 4: [-90, -55], 6: [90, -55], 12: [0, -150] };

// not-transitive: |x − y| < 1
const close = (x, y) => Math.abs(x - y) < 1;
const NT = [0, 0.6, 1.2];

// wo-relation: ab ≥ 0 on ℤ, checked on a window (counterexamples exist inside it)
const WIN = [-3, -2, -1, 0, 1, 2, 3];
const WO_P = props(WIN, relOn(WIN, (a, b) => a * b >= 0));
const WO_NAMES = { refl: 'reflexive', sym: 'symmetric', anti: 'antisymmetric', trans: 'transitive' };
const WO_ANSWER = Object.keys(WO_NAMES).filter((k) => WO_P[k]).map((k) => WO_NAMES[k]);

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });
const left = (s, str, x, y, opts = {}) => s.text(str, { x, y, size: 32, anchor: [0, 0.5], visible: false, ...opts });

/** Moves the graph's nodes to new local positions (Hasse layout), on the stage clock. */
function relayout(s, g, target, { duration = 1200 } = {}) {
  let from = null;
  return s.clock.tween({
    duration,
    ease: ease.inOut,
    start: () => (from = g.pos.map((p) => [...p])),
    update: (t) => {
      from ??= g.pos.map((p) => [...p]);
      g.pos = from.map((p, i) => [p[0] + (target[i][0] - p[0]) * t, p[1] + (target[i][1] - p[1]) * t]);
      g.place();
    },
  });
}

// ---------------------------------------------------------------- lecture

export default {
  id: 'relations',
  title: 'Relations and their properties',
  goals: [
    'Define a relation on a set as a subset of $A \\times A$ and draw it as a directed graph',
    'Prove or disprove reflexivity, symmetry, antisymmetry and transitivity',
    'Tell “antisymmetric” apart from “not symmetric”',
    'Recognize partial orders and draw Hasse diagrams; find comparable and incomparable elements',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'relation-def',
      title: 'What a relation is',
      scene(s) {
        const card = s.defCard({ y: 96, title: 'Definition: a relation on $A$', tex: 'R \\subseteq A \\times A, \\qquad a \\mathrel{R} b \\ \\text{ means } \\ (a, b) \\in R', visible: false });
        const ex = [
          left(s, '$3 < 5$', 70, 190),
          left(s, '$2 = 2$', 70, 250),
          left(s, '$2 \\mid 6$', 70, 310),
          left(s, 'same birthday', 70, 370),
        ];
        const here = left(s, 'Here: $a \\mathrel{R} b \\iff a \\mid b$', 70, 450, { size: 30, color: C.blue });
        const pair = left(s, '$(2, 6) \\in R$: an arrow $2 \\to 6$', 70, 510, { size: 30, color: C.yellow });
        const g = s.relationGraph({ x: 650, y: 372, nodes: SIX.map(String), edges: [], radius: 118, visible: false });
        return { card, ex, here, pair, g };
      },
      steps: [
        {
          say: 'A relation records which pairs of elements are related. Formally, a relation on $A${A} is any set of ordered pairs from $A${A}, and we write $a \\mathrel{R} b${a R b} when the pair is in it.',
          do: (s, o) => o.card.reveal({ duration: 1300 }),
        },
        {
          say: 'You know many already: less than, equals, divides, or “has the same birthday as” on a set of people.',
          do: (s, o) => s.stagger(o.ex.map((m) => () => m.fadeIn({ shift: [-14, 0] })), 600),
        },
        {
          say: 'As a picture: draw the elements and an arrow from $a${a} to $b${b} whenever $a \\mathrel{R} b${a R b}. Here is divides on the numbers one to six, loops included, since every number divides itself.',
          do: async (s, o) => {
            await s.all(o.g.fadeIn(), o.here.fadeIn());
            await s.stagger(DIV6.map(([i, j]) => () => o.g.addEdge(i, j, { duration: 450 })), 160);
            await o.pair.fadeIn();
            await o.g.highlightEdges([[1, 5]], 'yellow');
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'functions-are-relations',
      title: 'Functions are relations',
      scene(s) {
        const d = s.mapDiagram({ x: 480, y: 300, domain: ['1', '2', '3'], codomain: ['1', '2', '3'], arrows: [[0, 1], [1, 2], [2, 2]], labels: ['A', 'A'], name: 'f', visible: false });
        const g = s.relationGraph({ x: 250, y: 290, nodes: ['1', '2', '3'], edges: [[0, 1], [1, 2], [2, 2]], radius: 105, visible: false });
        const h = s.relationGraph({ x: 710, y: 290, nodes: ['1', '2', '3'], edges: [[0, 1], [0, 2], [1, 1], [2, 0]], radius: 105, visible: false });
        const c1 = s.text('one arrow out of each element', { x: 250, y: 450, size: 30, color: C.green, visible: false });
        const c2 = s.text('two arrows out of $1$', { x: 710, y: 450, size: 30, color: C.red, visible: false });
        const stamp = s.stamp('not a function', { x: 710, y: 110, color: 'red' });
        const ok = s.stamp('a function', { x: 250, y: 110, color: 'green' });
        const incl = s.tex('\\{\\text{functions } A \\to A\\} \\subsetneq \\{\\text{relations on } A\\}', { y: 535, size: 36, visible: false });
        return { d, g, h, c1, c2, stamp, ok, incl };
      },
      steps: [
        {
          say: 'Here is a function from $\\{1, 2, 3\\}${the set one, two, three} to itself. Put both ovals on top of each other and it becomes a relation: one arrow out of each element.',
          do: async (s, o) => {
            await o.d.fadeIn();
            await s.wait(400);
            await o.d.morphTo(o.g, { duration: 1100 });
            for (const [i, j] of [[0, 1], [1, 2], [2, 2]]) await o.g.highlightEdges([[i, j]], 'green');
            await s.all(o.c1.fadeIn(), o.ok.slam());
          },
        },
        {
          say: 'A relation drops that requirement. Here $1${one} has two arrows out, so this relation is not a function.',
          do: async (s, o) => {
            await o.h.fadeIn();
            await o.h.highlightEdges([[0, 1], [0, 2]], 'red');
            await o.h.highlightNodes(0, 'red');
            await s.all(o.c2.fadeIn(), o.stamp.slam());
          },
        },
        {
          say: 'So relations are the more general idea: a function is just a relation with exactly one arrow out of every element.',
          do: (s, o) => o.incl.write({ duration: 1200 }),
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'properties',
      title: 'Four properties',
      scene(s) {
        const panel = (cx, top, name, def, edges) => ({
          name: s.text(`**${name}**`, { x: cx, y: top + 22, size: 30, color: C.purple, visible: false }),
          def: s.tex(def, { x: cx, y: top + 66, size: 30, color: C.purple, visible: false }),
          g: s.relationGraph({ x: cx, y: top + 190, nodes: ['a', 'b', 'c'], edges, radius: 58, nodeR: 24, size: 30, visible: false }),
        });
        const P = {
          refl: panel(245, 28, 'reflexive', '\\forall a \\in A,\\ a \\mathrel{R} a', [[0, 1]]),
          sym: panel(715, 28, 'symmetric', 'a \\mathrel{R} b \\implies b \\mathrel{R} a', [[0, 1], [1, 2]]),
          anti: panel(245, 300, 'antisymmetric', 'a \\mathrel{R} b \\land b \\mathrel{R} a \\implies a = b', [[0, 1], [1, 2], [0, 0]]),
          trans: panel(715, 300, 'transitive', 'a \\mathrel{R} b \\land b \\mathrel{R} c \\implies a \\mathrel{R} c', [[0, 1], [1, 2]]),
        };
        const vline = s.line(480, 40, 480, 560, { color: C.line, width: 2, visible: false });
        const hline = s.line(60, 295, 900, 295, { color: C.line, width: 2, visible: false });
        return { P, vline, hline };
      },
      steps: [
        {
          say: 'Reflexive: every element is related to itself. In the picture, a loop at every node.',
          do: async (s, o) => {
            await s.all(o.vline.draw({ duration: 500 }), o.hline.draw({ duration: 500 }));
            const p = o.P.refl;
            await s.all(p.name.fadeIn(), p.def.write(), p.g.fadeIn());
            await p.g.closure('reflexive', { color: 'green', gap: 350 });
          },
        },
        {
          say: 'Symmetric: every arrow has a partner coming back. Antisymmetric is different: a two-way pair between distinct elements is forbidden.',
          do: async (s, o) => {
            const p = o.P.sym;
            await s.all(p.name.fadeIn(), p.def.write(), p.g.fadeIn());
            await p.g.closure('symmetric', { color: 'green', gap: 350 });
            const q = o.P.anti;
            await s.all(q.name.fadeIn(), q.def.write(), q.g.fadeIn());
            await q.g.addEdge(1, 0, { color: 'red' });
            await q.g.highlightNodes([0, 1], 'red');
            await s.wait(400);
            await s.all(q.g.removeEdge(1, 0), q.g.highlightNodes([0, 1], 'green'));
          },
        },
        {
          say: 'Transitive: whenever you can go from $a${a} to $b${b} and on from $b${b} to $c${c}, there is a shortcut straight from $a${a} to $c${c}.',
          do: async (s, o) => {
            const p = o.P.trans;
            await s.all(p.name.fadeIn(), p.def.write(), p.g.fadeIn());
            await p.g.highlightEdges([[0, 1], [1, 2]], 'blue');
            await p.g.closure('transitive', { color: 'yellow' });
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-properties',
      kind: 'try',
      title: 'Which properties?',
      say: 'Check each of the four properties for this relation. Select all that hold.',
      prompt: 'On $\\{1, 2, 3\\}$, let $R = \\{(1,1), (2,2), (3,3), (1,2), (2,1)\\}$. Which properties does $R$ have? Select all.',
      figure: (s) => {
        s.relationGraph({ x: 480, y: 320, nodes: TRY_EL.map(String), edges: TRY_R.map(([a, b]) => [a - 1, b - 1]), radius: 150, nodeR: 44, size: 58 });
      },
      answer: { type: 'multi', value: TRY_ANSWER },
      choices: [
        { id: 'refl', label: 'reflexive', why: 'All three loops $(1,1), (2,2), (3,3)$ are there.' },
        { id: 'sym', label: 'symmetric', why: 'The only non-loop arrows are $(1,2)$ and $(2,1)$, and they are partners.' },
        { id: 'anti', label: 'antisymmetric', why: '$1 \\mathrel{R} 2$ and $2 \\mathrel{R} 1$ but $1 \\ne 2$: a two-way pair between distinct elements.' },
        { id: 'trans', label: 'transitive', why: 'The two-step paths are $1 \\to 2 \\to 1$, $2 \\to 1 \\to 2$ (and paths through loops); their shortcuts $(1,1)$, $(2,2)$ are present.' },
      ],
      hint: 'For transitivity, list every path of length two and check its shortcut.',
      solution: [
        'Reflexive: every element has its loop. Symmetric: the pair $(1,2)$ comes with $(2,1)$.',
        'Not antisymmetric: $1 \\mathrel{R} 2$ and $2 \\mathrel{R} 1$ with $1 \\ne 2$.',
        'Transitive: the paths of length two are $1 \\to 2 \\to 1$ and $2 \\to 1 \\to 2$ (plus ones that use a loop, whose shortcut is the other arrow itself); the shortcuts $(1,1)$ and $(2,2)$ are in $R$.',
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'divides-properties',
      title: 'Proving and disproving properties',
      scene(s) {
        const head = s.text('The relation $a \\mid b$ on $\\mathbb{Z}$ (and on $\\mathbb{N}$), property by property:', { y: 50, size: 30, color: C.muted, visible: false });
        const row = (name, y, tex, verdict, ok) => ({
          name: left(s, `**${name}**`, 40, y, { size: 30 }),
          body: s.tex(tex, { x: 250, y, size: 30, anchor: [0, 0.5], visible: false }),
          stamp: s.stamp(verdict, { x: 862, y, color: ok ? 'green' : 'red', size: 30 }),
        });
        const R = {
          refl: row('reflexive', 100, 'a = a \\cdot 1, \\text{ so } a \\mid a', 'holds', true),
          sym: row('symmetric', 172, '2 \\mid 4 \\text{ but } 4 \\nmid 2', 'fails', false),
          antiN: row('antisym. ℕ', 280, '\\begin{aligned} &b = ak,\\ a = b\\ell \\Rightarrow a = ak\\ell \\\\ &a \\ne 0 \\Rightarrow k\\ell = 1 \\\\ &k, \\ell > 0 \\Rightarrow k = \\ell = 1 \\Rightarrow a = b \\end{aligned}', 'holds', true),
          antiZ: row('antisym. ℤ', 400, '2 \\mid -2,\\ \\ -2 \\mid 2, \\ \\text{ but } 2 \\ne -2', 'fails', false),
          trans: row('transitive', 478, 'a \\mid b,\\ b \\mid c \\Rightarrow a \\mid c \\quad (\\text{lecture } 6)', 'holds', true),
        };
        return { head, R };
      },
      steps: [
        {
          say: 'Proving a property is a for-all proof. Reflexive: for every $a${a}, $a = a \\cdot 1${a equals a times one}, so $a${a} divides $a${a}.',
          do: async (s, o) => {
            await o.head.fadeIn();
            const r = o.R.refl;
            await r.name.fadeIn();
            await r.body.write();
            await r.stamp.slam();
          },
        },
        {
          say: 'Disproving one needs specific elements. Two divides four, but four does not divide two, so divides is not symmetric.',
          do: async (s, o) => {
            const r = o.R.sym;
            await r.name.fadeIn();
            await r.body.write();
            await r.body.recolor(C.red);
            await r.stamp.slam();
          },
        },
        {
          say: 'The set matters. On the natural numbers, $b = ak${b equals a k} and $a = b\\ell${a equals b ell} give $a = ak\\ell${a equals a k ell}. Since $a \\ne 0${a is not zero}, $k\\ell = 1${k ell equals one}, and since $k${k} and $\\ell${ell} are positive, both are one, so $a = b${a equals b}.',
          do: async (s, o) => {
            const r = o.R.antiN;
            await r.name.fadeIn();
            await r.body.write({ duration: 1600 });
            await r.stamp.slam();
          },
        },
        {
          say: 'On the integers, positivity is gone and $k = \\ell = -1${k and ell both minus one} is also possible: two and minus two divide each other but differ. So divides is antisymmetric on the naturals but not on the integers.',
          do: async (s, o) => {
            const z = o.R.antiZ;
            await z.name.fadeIn();
            await z.body.write();
            await z.body.recolor(C.red);
            await z.stamp.slam();
          },
        },
        {
          say: 'And transitive we proved in lecture six: if $a \\mid b${a divides b} and $b \\mid c${b divides c}, then $a \\mid c${a divides c}.',
          do: async (s, o) => {
            const r = o.R.trans;
            await r.name.fadeIn();
            await r.body.write();
            await r.stamp.slam();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'anti-vs-not-sym',
      title: 'Antisymmetric is not “not symmetric”',
      scene(s) {
        const eq = s.relationGraph({ x: 245, y: 332, nodes: ['1', '2', '3'], edges: [[0, 0], [1, 1], [2, 2]], radius: 95, visible: false });
        const r = s.relationGraph({ x: 715, y: 332, nodes: ['1', '2', '3'], edges: [[0, 1], [1, 0], [0, 2]], radius: 95, visible: false });
        const eqName = s.tex('=\\ \\text{on } \\{1, 2, 3\\}', { x: 245, y: 148, size: 32, visible: false });
        const rName = s.tex('\\{(1,2), (2,1), (1,3)\\}', { x: 715, y: 148, size: 32, visible: false });
        const r1 = s.text('$1 \\rightleftarrows 2$: not antisymmetric', { x: 715, y: 440, size: 30, color: C.red, visible: false });
        const r2 = s.text('$1 \\to 3$ only: not symmetric', { x: 715, y: 485, size: 30, color: C.red, visible: false });
        const e1 = s.text('no two-way pairs; every arrow', { x: 245, y: 440, size: 30, color: C.green, visible: false });
        const e2 = s.text('is its own partner', { x: 245, y: 485, size: 30, color: C.green, visible: false });
        const both = s.stamp('symmetric & antisymmetric', { x: 250, y: 72, color: 'green', size: 28 });
        const neither = s.stamp('neither', { x: 715, y: 72, color: 'red' });
        const moral = s.text('Negate the definitions carefully; don’t guess from the names.', { y: 550, size: 30, color: C.muted, visible: false });
        const divider = s.line(480, 80, 480, 500, { color: C.line, width: 2, visible: false });
        return { eq, r, eqName, rName, r1, r2, e1, e2, both, neither, moral, divider };
      },
      steps: [
        {
          say: 'Antisymmetric forbids two-way arrows between different elements. This relation has one, between $1${one} and $2${two}, so it is not antisymmetric.',
          do: async (s, o) => {
            await o.divider.draw({ duration: 500 });
            await s.all(o.r.fadeIn(), o.rName.fadeIn());
            await o.r.highlightEdges([[0, 1], [1, 0]], 'red');
            await o.r1.fadeIn();
          },
        },
        {
          say: 'Equality has no two-way arrows at all, so it is antisymmetric. But each of its arrows is a loop, its own partner, so it is also symmetric.',
          do: async (s, o) => {
            await s.all(o.eq.fadeIn(), o.eqName.fadeIn());
            await o.eq.highlightEdges(() => true, 'green');
            await s.all(o.e1.fadeIn(), o.e2.fadeIn({ delay: 200 }));
            await o.both.slam();
          },
        },
        {
          say: 'And the relation on the right is not symmetric either: one goes to three with no way back. It is neither. So negate the definitions carefully, and never guess from the names.',
          do: async (s, o) => {
            await o.r.highlightEdges([[0, 2]], 'yellow');
            await o.r2.fadeIn();
            await o.neither.slam();
            await o.moral.fadeIn();
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'try-subset-order',
      kind: 'try',
      title: 'Classify $\\subseteq$',
      say: 'Classify the subset relation on the power set of a two-element set.',
      prompt: 'On $\\mathcal{P}(\\{1, 2\\})$, the relation $\\subseteq$ is …',
      answer: { type: 'choice', value: SUB_P.refl && SUB_P.anti && SUB_P.trans && !SUB_TOTAL ? 'a' : 'c' },
      choices: [
        { id: 'a', label: 'a partial order that is not total', why: 'Reflexive, antisymmetric and transitive, but $\\{1\\}$ and $\\{2\\}$ are incomparable.' },
        { id: 'b', label: 'an equivalence relation', why: 'Not symmetric: $\\varnothing \\subseteq \\{1\\}$ but $\\{1\\} \\not\\subseteq \\varnothing$.' },
        { id: 'c', label: 'a total order', why: '$\\{1\\} \\not\\subseteq \\{2\\}$ and $\\{2\\} \\not\\subseteq \\{1\\}$: two elements that are not comparable.' },
        { id: 'd', label: 'not transitive', why: '$\\subseteq$ is transitive: $X \\subseteq Y \\subseteq Z$ gives $X \\subseteq Z$.' },
      ],
      hint: 'Check reflexive, antisymmetric, transitive; then try to compare $\\{1\\}$ and $\\{2\\}$.',
      solution: [
        'Reflexive: $X \\subseteq X$. Antisymmetric: $X \\subseteq Y$ and $Y \\subseteq X$ give $X = Y$ (double inclusion). Transitive: $X \\subseteq Y \\subseteq Z$ gives $X \\subseteq Z$. So $\\subseteq$ is a partial order.',
        'It is not total: neither of $\\{1\\}$, $\\{2\\}$ is a subset of the other.',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'partial-orders',
      title: 'Partial orders and Hasse diagrams',
      scene(s) {
        const card = s.defCard({ y: 64, title: false, body: 'A **partial order** is reflexive, antisymmetric and transitive.', visible: false });
        const g = s.relationGraph({ x: 380, y: 340, nodes: D12.map(String), edges: [], radius: 150, visible: false });
        const t1 = left(s, '$a \\mid b$ on divisors of $12$', 580, 160, { size: 30 });
        const t2 = left(s, 'up = bigger', 580, 225, { size: 30, color: C.muted });
        const t3 = left(s, '$4$, $6$ incomparable:', 580, 310, { size: 30, color: C.yellow });
        const t3b = left(s, '$4 \\nmid 6$ and $6 \\nmid 4$', 580, 355, { size: 30, color: C.yellow });
        const t4 = left(s, '**Total order**: every two elements comparable. Not this one.', 580, 465, { size: 30, width: 320, align: 'left' });
        return { card, g, t1, t2, t3, t3b, t4 };
      },
      steps: [
        {
          say: 'A partial order is reflexive, antisymmetric and transitive: it generalizes less than or equal. Divisibility on the divisors of twelve is one; here are all its arrows.',
          do: async (s, o) => {
            await o.card.reveal({ duration: 900 });
            await s.all(o.g.fadeIn(), o.t1.fadeIn());
            await s.stagger(ALL12.map(([i, j]) => () => o.g.addEdge(i, j, { duration: 400 })), 110);
          },
        },
        {
          say: 'A Hasse diagram drops everything we can recover: the loops, since every element relates to itself, and every arrow implied by transitivity. Then we draw it so that up means bigger.',
          do: async (s, o) => {
            await o.g.highlightEdges(LOOPS12, 'muted');
            await s.all(LOOPS12.map(([i, j]) => o.g.removeEdge(i, j)));
            await o.g.highlightEdges(IMPLIED12, 'red');
            await s.all(IMPLIED12.map(([i, j]) => o.g.removeEdge(i, j)));
            await relayout(s, o.g, D12.map((d) => HASSE[d]));
            await o.t2.fadeIn();
          },
        },
        {
          say: 'In a total order every two elements are comparable. Divisibility is not total: four and six are incomparable, since neither divides the other.',
          do: async (s, o) => {
            await o.g.highlightNodes(INCOMP, 'yellow');
            await s.all(o.t3.fadeIn(), o.t3b.fadeIn({ delay: 200 }));
            await o.t4.fadeIn();
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-transitive',
      kind: 'blanks',
      title: 'Prove transitivity',
      say: 'Fill in this transitivity proof. Watch what cancels.',
      prompt: 'On $\\mathbb{R}$, let $x \\mathrel{R} y$ iff $x - y \\in \\mathbb{Q}$. Complete the proof that $R$ is transitive.',
      lines: [
        ['\\text{Suppose } x \\mathrel{R} y,\\ y \\mathrel{R} z. \\text{ Then } x - y = q,\\ y - z = r \\text{ with } q, r \\in ', { id: 'set', chips: ['\\mathbb{Q}', '\\mathbb{Z}', '\\mathbb{R}'], answer: '\\mathbb{Q}', hint: 'Unpack the definition of $R$.' }, '.'],
        ['\\text{So } x - z = ', { id: 'sum', chips: ['q + r', 'q - r', 'qr'], answer: 'q + r', hint: 'Add the two differences.' }, ','],
        ['\\text{which is rational because } ', { id: 'why', chips: ['\\mathbb{Q}\\text{ is closed under addition}', 'x, z \\in \\mathbb{R}', 'q \\ne 0'], answer: '\\mathbb{Q}\\text{ is closed under addition}', hint: 'Why is a sum of two rationals rational?' }, '.'],
      ],
      solution: [
        'Unpack: $x - y = q$ and $y - z = r$ with $q, r \\in \\mathbb{Q}$.',
        'Add them: $(x - y) + (y - z) = x - z = q + r$; the $y$ cancels.',
        '$q + r \\in \\mathbb{Q}$ because $\\mathbb{Q}$ is closed under addition, so $x \\mathrel{R} z$. (This relation is also reflexive and symmetric: an equivalence relation, next lecture.)',
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'not-transitive',
      title: 'A relation that isn’t transitive',
      scene(s) {
        const def = s.tex('x \\mathrel{R} y \\iff \\lvert x - y \\rvert < 1 \\quad \\text{on } \\mathbb{R}', { y: 54, size: 36, visible: false });
        const refl = s.tex('\\lvert x - x \\rvert = 0 < 1: \\ \\text{reflexive}', { y: 114, size: 30, color: C.green, visible: false });
        const sym = s.tex('\\lvert x - y \\rvert = \\lvert y - x \\rvert: \\ \\text{symmetric}', { y: 160, size: 30, color: C.green, visible: false });
        const nl = s.numberLine({ x: 480, y: 440, width: 760, range: [-0.4, 1.6], ticks: 0.2, labels: (v) => (NT.includes(v) ? String(v) : null), size: 32, visible: false });
        const X = NT.map((v) => nl.x + nl.toX(v));
        const arc = (a, b, h) => `M${a} 425 Q${(a + b) / 2} ${425 - h} ${b} 425`;
        const a1 = s.path(arc(X[0], X[1], 150), { color: C.green, width: 4, visible: false });
        const a2 = s.path(arc(X[1], X[2], 150), { color: C.green, width: 4, visible: false });
        const a3 = s.path(arc(X[0], X[2], 330), { color: C.red, width: 4, dash: '10 7', visible: false });
        const l1 = s.tex(`${+(NT[1] - NT[0]).toFixed(1)} < 1`, { x: (X[0] + X[1]) / 2, y: 320, size: 30, color: C.green, visible: false });
        const l2 = s.tex(`${+(NT[2] - NT[1]).toFixed(1)} < 1`, { x: (X[1] + X[2]) / 2, y: 320, size: 30, color: C.green, visible: false });
        const l3 = s.tex(`${+(NT[2] - NT[0]).toFixed(1)} \\ge 1`, { x: (X[0] + X[2]) / 2, y: 228, size: 30, color: C.red, visible: false });
        const disproof = s.tex('0 \\mathrel{R} 0.6,\\ \\ 0.6 \\mathrel{R} 1.2, \\ \\text{ but not } 0 \\mathrel{R} 1.2', { y: 540, size: 34, color: C.red, visible: false });
        return { def, refl, sym, nl, a1, a2, a3, l1, l2, l3, disproof, pts: [] };
      },
      steps: [
        {
          say: '“Close to” is a natural relation: $x${x} and $y${y} are related when they are less than one apart. It is reflexive, since each number is zero away from itself, and symmetric, since distance doesn’t care about order.',
          do: async (s, o) => {
            await o.def.write();
            await s.all(o.refl.fadeIn(), o.sym.fadeIn({ delay: 400 }));
          },
        },
        {
          say: 'But closeness doesn’t chain. Zero is close to point six, and point six is close to one point two, yet zero and one point two are more than one apart.',
          do: async (s, o) => {
            await o.nl.fadeIn();
            o.pts = NT.map((v) => o.nl.point(v, { color: 'blue', r: 10 }));
            await s.all(o.pts);
            await s.all(o.a1.draw({ duration: 700 }), o.l1.fadeIn({ delay: 400 }));
            await s.all(o.a2.draw({ duration: 700 }), o.l2.fadeIn({ delay: 400 }));
            await s.all(o.a3.draw({ duration: 900 }), o.l3.fadeIn({ delay: 600 }));
          },
        },
        {
          say: 'That is a complete disproof of transitivity: three specific numbers, two true hypotheses and a false conclusion.',
          do: async (s, o) => {
            await o.disproof.write({ duration: 1100 });
            await o.a3.indicate({ color: C.red, scale: 1.03 });
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-relation',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Decide which properties this relation has, and justify every answer: a proof for each yes, a counterexample for each no.',
      prompt: 'On $\\mathbb{Z}$ define $a \\mathrel{R} b$ iff $ab \\ge 0$. Which of reflexive, symmetric, antisymmetric, transitive does $R$ have? Enter the properties it has separated by commas (e.g. `reflexive, transitive`), and justify each answer on paper.',
      answer: { type: 'set', value: WO_ANSWER },
      hints: ['Zero is related to everything.', 'Try a chain through $0$ for transitivity.'],
      solution: [
        '**Reflexive:** for every $a \\in \\mathbb{Z}$, $a \\cdot a = a^2 \\ge 0$, so $a \\mathrel{R} a$.',
        '**Symmetric:** if $ab \\ge 0$ then $ba = ab \\ge 0$.',
        '**Not antisymmetric:** $1 \\mathrel{R} 2$ and $2 \\mathrel{R} 1$ (product $2 \\ge 0$), but $1 \\ne 2$.',
        '**Not transitive:** $1 \\mathrel{R} 0$ and $0 \\mathrel{R} -1$ (both products are $0$), but $1 \\cdot (-1) = -1 < 0$, so $1 \\not\\mathrel{R} -1$.',
        `So $R$ is ${WO_ANSWER.join(' and ')}.`,
      ],
      rubric: [
        'Proves reflexivity for an arbitrary integer ($a^2 \\ge 0$).',
        'Proves symmetry for arbitrary integers ($ab = ba$).',
        'Gives a specific counterexample to antisymmetry.',
        'Gives a specific counterexample to transitivity (a chain through $0$).',
        'States the correct list: reflexive and symmetric.',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-properties',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap, explain the four properties, and how you would show a relation fails each one.',
      prompt: 'Explain the four properties of a relation, and how you would show that a relation *fails* each one.',
      points: [
        'Each property is a universal statement: reflexive is “for all $a$, $a \\mathrel{R} a$”; the other three are conditionals over all elements.',
        'Failure needs specific elements: an $a$ with $a \\not\\mathrel{R} a$; a pair related one way only; a two-way pair of distinct elements; or $a \\mathrel{R} b$, $b \\mathrel{R} c$ with $a \\not\\mathrel{R} c$.',
        'Antisymmetric and symmetric are not opposites: a relation can be both (equality) or neither.',
        'A partial order is reflexive, antisymmetric and transitive.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• A relation is a set of pairs, drawn as arrows.', 120),
          recapItem(s, '• Reflexive, symmetric, antisymmetric, transitive: prove with “for all”, disprove with specific elements. Partial orders and Hasse diagrams.', 250),
          recapItem(s, 'Next: equivalence relations, the formal idea of “the same”.', 400, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'A relation is just a set of ordered pairs, and we draw it as arrows.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'The four properties are proved for all elements and disproved with specific ones. Partial orders are reflexive, antisymmetric and transitive, and Hasse diagrams draw them without clutter.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: equivalence relations, the formal idea of “the same”.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
