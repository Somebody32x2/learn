/**
 * Lecture 14 · Equivalence relations and partitions (foundations/PLAN.md § 14). Irani · Relations · Liebeck 18.
 *
 * Choreography: classes are colors (blue [0], green [1], orange [2] mod 3) that light up on a number line; a blob
 * is cut into colored classes; a partition grows its "same block" arrows; the colored integers then collapse into
 * three new objects (the quotient). ℚ is built from lattice points: one class is one line through the origin.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed)

const mod = (a, n) => ((a % n) + n) % n;
const CLASS_COLORS = [C.blue, C.green, C.orange];
const CLASS_FILLS = [FILL.blue, FILL.green, FILL.orange];
const RANGE = [-6, 6];
const INTS = [];
for (let v = RANGE[0]; v <= RANGE[1]; v++) INTS.push(v);
const classOf = (k) => INTS.filter((v) => mod(v, 3) === k);
const classTex = (k) => `[${k}] = \\{\\dots, ${classOf(k).join(', ')}, \\dots\\}`;
const HOPS = INTS.filter((v) => mod(v, 3) === mod(4, 3) && v <= 4).reverse(); // 4, 1, -2, -5

// try-classes: a ~ b iff 5 | (a − b); which classes equal [2]?
const CAND = { c7: 7, cm3: -3, c3: 3, c12: 12, cm2: -2 };
const CLASS_ANSWER = Object.keys(CAND).filter((k) => mod(CAND[k] - 2, 5) === 0);

// partition-to-relation: {1, 4}, {2, 5, 6}, {3}
const BLOCKS = [[1, 4], [2, 5, 6], [3]];
const BLOCK_IDX = BLOCKS.map((b) => b.map((v) => v - 1));
const BLOCK_EDGES = BLOCK_IDX.flatMap((b) => b.flatMap((i) => b.map((j) => [i, j])));

// quotient: [1] + [2] computed with two pairs of representatives
const REPS = [[1, 2], [4, 5]];
const SUMS = REPS.map(([a, b]) => [a + b, mod(a + b, 3)]);

// construct-q: the class of (1, 2) inside the plotted window
const QCLASS = [];
for (let k = -3; k <= 2; k++) if (k !== 0) QCLASS.push([k, 2 * k]);

// wo-equivalence: a ~ b iff 4 | (3a + b); count classes on a window
const woRel = (a, b) => mod(3 * a + b, 4) === 0;
const WO_WIN = Array.from({ length: 24 }, (_, i) => i - 12);
const WO_CLASSES = new Set(WO_WIN.map((a) => WO_WIN.filter((b) => woRel(a, b)).join(','))).size;

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });
const at = (nl, v) => [nl.x + nl.toX(v), nl.y];

/** The three regions of an ellipse cut by vertical lines at x1 < x2 (left, middle, right). */
function cutBlob(cx, cy, rx, ry, x1, x2) {
  const d = (x) => ry * Math.sqrt(1 - ((x - cx) / rx) ** 2);
  const [d1, d2] = [d(x1), d(x2)];
  return [
    `M${x1} ${cy - d1} A${rx} ${ry} 0 0 0 ${x1} ${cy + d1} Z`,
    `M${x1} ${cy - d1} A${rx} ${ry} 0 0 1 ${x2} ${cy - d2} L${x2} ${cy + d2} A${rx} ${ry} 0 0 1 ${x1} ${cy + d1} Z`,
    `M${x2} ${cy - d2} A${rx} ${ry} 0 0 1 ${x2} ${cy + d2} Z`,
  ];
}

// ---------------------------------------------------------------- lecture

export default {
  id: 'equivalence-relations',
  title: 'Equivalence relations and partitions',
  goals: [
    'Prove that a relation is an equivalence relation',
    'Compute equivalence classes $[a]_\\sim$ and describe the quotient set',
    'Prove that equivalence classes partition the set, and that partitions give equivalence relations',
    'Construct $\\mathbb{Z}$ and $\\mathbb{Q}$ from pairs, and check that operations on classes are well-defined',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'sameness',
      title: 'Formalizing “the same”',
      scene(s) {
        const col = (x, title, a, b) => ({
          title: s.text(`**${title}**`, { x, y: 60, size: 30, visible: false }),
          a: s.tex(a, { x, y: 120, size: 34, visible: false }),
          b: s.tex(b, { x, y: 175, size: 34, visible: false }),
        });
        const cols = [
          col(170, 'same parity', '\\col{blue}{3 \\sim 7 \\sim -5}', '\\col{green}{2 \\sim 10}'),
          col(480, 'same birthday', '\\text{Ada} \\sim \\text{Ben}', '\\text{(both March 3)}'),
          col(790, 'mod 3 remainder', '\\col{green}{4 \\sim 1 \\sim 7}', '\\col{orange}{2 \\sim 5}'),
        ];
        const card = s.defCard({ y: 335, width: 860, body: 'An **equivalence relation** on $A$ is a relation $\\sim$ that is **reflexive** ($a \\sim a$), **symmetric** ($a \\sim b \\implies b \\sim a$) and **transitive** ($a \\sim b \\land b \\sim c \\implies a \\sim c$).', visible: false });
        const eq = s.tex('a \\sim b \\iff a = b: \\ \\text{the extreme case}', { y: 520, size: 36, visible: false });
        return { cols, card, eq };
      },
      steps: [
        {
          say: 'Mathematics constantly treats different things as the same in some respect: numbers with the same parity, people with the same birthday, integers with the same remainder mod three.',
          do: (s, o) => s.stagger(o.cols.map((c) => () => s.all(c.title.fadeIn(), c.a.write({ delay: 200 }), c.b.fadeIn({ delay: 700 }))), 900),
        },
        {
          say: 'What does “the same” need? Everything is the same as itself, sameness goes both ways, and it chains. Those three properties define an equivalence relation, written with a tilde.',
          do: (s, o) => o.card.reveal({ duration: 1600 }),
        },
        {
          say: 'Equality is the extreme case: the strictest sameness, where each thing is the same only as itself.',
          do: (s, o) => o.eq.write({ duration: 1100 }),
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'mod3',
      title: 'Same remainder mod 3',
      scene(s) {
        const head = s.tex('\\text{On } \\mathbb{Z}: \\quad a \\sim b \\iff 3 \\mid (a - b)', { y: 50, size: 34, visible: false });
        const p = s.proof({ y: 84, width: 900, height: 490, size: 30 });
        return { head, p };
      },
      steps: [
        {
          say: 'Three short proofs, each from the definition of divides. Reflexive: $a - a = 0 = 3 \\cdot 0${a minus a is zero, which is three times zero}. Symmetric: if $a \\sim b${a is equivalent to b}, then $a - b = 3k${a minus b equals three k}, so $b - a = 3(-k)${b minus a equals three times minus k}.',
          do: async (s, o) => {
            await o.head.write();
            await o.p.add('**Reflexive.** Let $a \\in \\mathbb{Z}$. $a - a = 0 = 3 \\cdot 0$.', { kind: 'assume', why: '$0 \\in \\mathbb{Z}$' });
            await o.p.add('**Symmetric.** Let $a, b \\in \\mathbb{Z}$ with $a \\sim b$.', { why: 'hypothesis' });
            await o.p.add('So $a - b = 3k$ for some $k \\in \\mathbb{Z}$.', { why: 'def. of divides' });
            await o.p.add('Then $b - a = 3(-k)$, so $b \\sim a$.', { why: '$-k \\in \\mathbb{Z}$' });
          },
        },
        {
          say: 'Transitive: two hypotheses, so two witnesses with different names, $k${k} and $\\ell${ell}. Adding the equations, $a - c = 3(k + \\ell)${a minus c equals three times k plus ell}.',
          do: async (s, o) => {
            await o.p.add('**Transitive.** Let $a, b, c \\in \\mathbb{Z}$, $a \\sim b$, $b \\sim c$.', { why: 'hypotheses' });
            o.t1 = o.p.add('So $a - b = 3k$, $b - c = 3\\ell$ ($k, \\ell \\in \\mathbb{Z}$).', { why: 'def. of divides' });
            await o.t1;
            await o.p.highlight(o.t1, 'yellow');
            await o.p.add('Then $a - c = 3(k + \\ell)$, so $a \\sim c$.', { why: 'add; $k + \\ell \\in \\mathbb{Z}$' });
          },
        },
        {
          say: 'So this is an equivalence relation. It has a name you will meet again in lecture nineteen: congruence mod three.',
          do: async (s, o) => {
            await o.p.unhighlight(o.t1);
            const last = o.p.add('Therefore $\\sim$ is an equivalence relation.', { kind: 'conclude', why: 'all three hold' });
            await last;
            await o.p.qed();
            await o.head.swap('a \\sim b \\iff 3 \\mid (a - b) \\iff a \\equiv b \\pmod 3');
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'classes',
      title: 'Equivalence classes',
      scene(s) {
        const card = s.defCard({ y: 66, title: false, tex: '[a]_\\sim = \\{x \\in A : x \\sim a\\}', visible: false });
        const nl = s.numberLine({ x: 480, y: 290, width: 840, range: RANGE, size: 30, visible: false });
        const lines = [1, 0, 2].map((k, i) => s.tex(classTex(k), { y: 400 + i * 55, size: 32, color: CLASS_COLORS[k], visible: false }));
        const same = s.tex('[4] = [1] = [-2]', { y: 150, size: 40, color: C.green, visible: false });
        return { card, nl, lines, same };
      },
      steps: [
        {
          say: 'The class of $a${a} collects everything equivalent to $a${a}. Mod three, the class of $1${one} is every integer one more than a multiple of three.',
          do: async (s, o) => {
            await o.card.reveal({ duration: 800 });
            await o.nl.fadeIn();
            o.pts = {};
            await s.stagger(classOf(1).map((v) => () => (o.pts[v] = o.nl.point(v, { color: CLASS_COLORS[1], r: 11 }))), 250);
            await o.lines[0].write();
          },
        },
        {
          say: 'Two more classes fill the line: the multiples of three, and the numbers two more than a multiple of three. Mod three there are exactly three classes, and every integer is in one.',
          do: async (s, o) => {
            await s.stagger([0, 2].flatMap((k) => classOf(k).map((v) => () => (o.pts[v] = o.nl.point(v, { color: CLASS_COLORS[k], r: 11 })))), 120);
            await o.lines[1].write();
            await o.lines[2].write();
          },
        },
        {
          say: 'Different names, same class. Start at $4${four} and hop back by three: you land only on green points. So $[4] = [1] = [-2]${the class of four equals the class of one equals the class of minus two}.',
          do: async (s, o) => {
            const X = HOPS.map((v) => at(o.nl, v)[0]);
            o.ringed = s.ring({ x: X[0] - 16, y: o.nl.y - 16, w: 32, h: 32 }, { color: 'yellow' });
            await o.ringed;
            for (let i = 0; i + 1 < X.length; i++) {
              const arc = s.path(`M${X[i]} ${o.nl.y - 14} Q${(X[i] + X[i + 1]) / 2} ${o.nl.y - 90} ${X[i + 1]} ${o.nl.y - 14}`, { color: C.yellow, width: 4, visible: false });
              await arc.draw({ duration: 500 });
            }
            await o.same.write();
            await o.lines[0].indicate({ color: C.green, scale: 1.06 });
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-classes',
      kind: 'try',
      title: 'Same class?',
      say: 'Which of these classes are the same as the class of two? Select all.',
      prompt: 'On $\\mathbb{Z}$, let $a \\sim b$ iff $5 \\mid (a - b)$. Which classes equal $[2]$? Select all.',
      answer: { type: 'multi', value: CLASS_ANSWER },
      choices: Object.entries(CAND).map(([id, v]) => {
        const d = v - 2;
        const ok = mod(d, 5) === 0;
        return { id, label: `$[${v}]$`, why: ok ? `$${v} - 2 = ${d}$ is a multiple of $5$, so $${v} \\sim 2$.` : `$${v} - 2 = ${d}$ is not a multiple of $5$.` };
      }),
      hint: '$[a] = [2]$ exactly when $a \\sim 2$, that is, $5 \\mid (a - 2)$.',
      solution: [
        '$[a] = [2]$ iff $a \\sim 2$ iff $5 \\mid (a - 2)$.',
        ...Object.values(CAND).map((v) => `$${v} - 2 = ${v - 2}$: ${mod(v - 2, 5) === 0 ? 'a multiple of $5$, so $[' + v + '] = [2]$' : 'not a multiple of $5$, so $[' + v + '] \\ne [2]$'}.`),
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'partition-theorem',
      title: 'Classes partition the set',
      scene(s) {
        const thm = s.text('**Theorem.** The equivalence classes of $\\sim$ partition $A$.', { y: 50, size: 32, visible: false });
        const outline = s.path('M150 290 A330 150 0 1 0 810 290 A330 150 0 1 0 150 290 Z', { color: C.ink, width: 3, visible: false });
        const regions = cutBlob(480, 290, 330, 150, 370, 590).map((d, k) => s.path(d, { color: CLASS_COLORS[k], fill: CLASS_FILLS[k], width: 3, visible: false }));
        const names = ['[a]', '[b]', '[c]'].map((t, k) => s.tex(t, { x: [265, 480, 695][k], y: 240, size: 36, color: CLASS_COLORS[k], visible: false }));
        const dots = [[230, 320], [300, 300], [260, 370], [440, 320], [520, 345], [480, 395], [650, 320], [730, 340]].map(([x, y]) => s.dot(x, y, { r: 8, color: C.ink, visible: false }));
        const refl = s.text('Reflexivity: $a \\in [a]$. No class is empty; every element lies in one.', { y: 500, size: 30, visible: false });
        const pics = [
          { x: 200, cap: 'disjoint', ok: true, c: [[-36, 0], [36, 0]], r: 30 },
          { x: 480, cap: 'equal', ok: true, c: [[0, 0]], r: 36 },
          { x: 760, cap: 'partly overlapping', ok: false, c: [[-20, 0], [20, 0]], r: 34 },
        ].map((q) => ({
          shapes: q.c.map(([dx, dy], i) => s.circle(q.x + dx, 490 + dy, q.r, { color: q.ok ? C.green : C.red, fill: q.ok ? FILL.green : FILL.red, width: 3, visible: false })),
          cap: s.text(q.cap, { x: q.x, y: 555, size: 30, color: q.ok ? C.green : C.red, visible: false }),
          ok: q.ok,
        }));
        return { thm, outline, regions, names, dots, refl, pics };
      },
      steps: [
        {
          say: 'The classes cut the set into pieces. Each piece is nonempty and every element lies in one, because $a \\in [a]${a is in its own class} by reflexivity.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.outline.draw({ duration: 900 });
            await s.all(o.dots.map((d, i) => d.fadeIn({ delay: i * 60, shift: [0, 0] })));
            await s.stagger(o.regions.map((r, k) => () => s.all(r.fadeIn({ shift: [0, 0] }), o.names[k].fadeIn())), 350);
            await o.refl.write({ duration: 1100 });
          },
        },
        {
          say: 'The real content: two classes that share even one element are equal. If $c${c} is in both $[a]${the class of a} and $[b]${the class of b}, symmetry and transitivity give $a \\sim b${a equivalent to b}, and a lemma you will fill in next gives $[a] = [b]${the class of a equals the class of b}.',
          do: async (s, o) => {
            await s.all([o.outline, ...o.regions, ...o.names, ...o.dots, o.refl].map((m) => m.fadeOut({ duration: 400 })));
            o.p = s.proof({ y: 92, width: 900, height: 360, size: 30 });
            await o.p.add('**Proof.** Let $a, b \\in A$; suppose $c \\in [a] \\cap [b]$.', { kind: 'assume', why: 'a shared element' });
            await o.p.add('Then $c \\sim a$ and $c \\sim b$.', { why: 'def. of class' });
            await o.p.add('So $a \\sim c$,', { why: 'symmetry' });
            await o.p.add('and so $a \\sim b$.', { why: 'transitivity' });
            await o.p.add('Therefore $[a] = [b]$.', { kind: 'conclude', why: 'lemma (next)' });
            await o.p.qed();
          },
        },
        {
          say: 'So two classes are either disjoint or equal. They never partly overlap, and that is exactly what a partition means.',
          do: async (s, o) => {
            for (const q of o.pics) {
              await s.all(q.shapes.map((c) => c.draw({ duration: 500 })), q.cap.fadeIn());
              if (!q.ok) await s.strike(s.group(...q.shapes), { color: 'red' });
            }
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-class-lemma',
      kind: 'blanks',
      title: 'The lemma',
      say: 'Fill in the justifications in the lemma the partition proof used.',
      prompt: 'Lemma: if $a \\sim b$ then $[a] = [b]$. Fill in the property used at each step.',
      lines: [
        ['\\text{Let } x \\in [a]. \\text{ Then } x \\sim a. \\text{ Since } a \\sim b, \\text{ by } ', { id: 't', chips: ['\\text{reflexivity}', '\\text{symmetry}', '\\text{transitivity}'], answer: '\\text{transitivity}', hint: 'Two links $x \\sim a$, $a \\sim b$ make a chain.' }, '\\ x \\sim b, \\text{ so } x \\in [b].'],
        ['\\text{Conversely, from } a \\sim b \\text{ we get } b \\sim a \\text{ by } ', { id: 's', chips: ['\\text{reflexivity}', '\\text{symmetry}', '\\text{transitivity}'], answer: '\\text{symmetry}', hint: 'The hypothesis has to be turned around.' }, ',\\ \\text{and the same argument gives } [b] \\subseteq [a].'],
      ],
      solution: [
        'This is a double inclusion. $[a] \\subseteq [b]$: from $x \\sim a$ and $a \\sim b$, transitivity gives $x \\sim b$.',
        '$[b] \\subseteq [a]$: symmetry turns $a \\sim b$ into $b \\sim a$, and the same transitivity argument applies with $a$ and $b$ swapped.',
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'partition-to-relation',
      title: 'Partitions give equivalence relations',
      scene(s) {
        const head = s.tex('\\{1, 4\\},\\ \\{2, 5, 6\\},\\ \\{3\\}', { x: 330, y: 52, size: 34, visible: false });
        const g = s.relationGraph({ x: 330, y: 325, nodes: ['1', '2', '3', '4', '5', '6'], edges: [], radius: 165, visible: false });
        const t = [
          s.text('$a \\sim b \\iff$ $a$ and $b$ are in the same block', { x: 620, y: 140, size: 30, anchor: [0, 0.5], width: 300, align: 'left', visible: false }),
          s.text('reflexive, symmetric, transitive', { x: 620, y: 240, size: 30, anchor: [0, 0.5], width: 300, align: 'left', color: C.green, visible: false }),
          s.text('its classes are the blocks', { x: 620, y: 330, size: 30, anchor: [0, 0.5], width: 300, align: 'left', color: C.green, visible: false }),
          s.tex('\\text{equivalence relations} \\\\ \\longleftrightarrow \\\\ \\text{partitions}', { x: 760, y: 470, size: 30, color: C.purple, visible: false }),
        ];
        return { head, g, t };
      },
      steps: [
        {
          say: 'Now go the other way. Start with a partition of one through six into three blocks, and call two elements related when they share a block.',
          do: async (s, o) => {
            await o.head.write();
            await o.g.fadeIn();
            await o.g.partition(BLOCK_IDX);
            await o.t[0].fadeIn();
          },
        },
        {
          say: 'Each block becomes a complete cluster of arrows, loops included. That relation is reflexive, symmetric and transitive, and its classes are exactly the blocks.',
          do: async (s, o) => {
            await s.stagger(BLOCK_EDGES.map(([i, j]) => () => o.g.addEdge(i, j, { duration: 450 })), 150);
            await o.t[1].fadeIn();
            await o.t[2].fadeIn();
          },
        },
        {
          say: 'So equivalence relations and partitions are two descriptions of one idea: say which things are the same, or say how the set splits into piles.',
          do: (s, o) => o.t[3].fadeIn(),
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'quotient',
      title: 'The quotient set',
      scene(s) {
        const nl = s.numberLine({ x: 480, y: 160, width: 840, range: RANGE, size: 30, visible: false });
        const dots = INTS.map((v) => {
          const [x, y] = at(nl, v);
          return { v, d: s.dot(x, y, { r: 11, color: CLASS_COLORS[mod(v, 3)], visible: false }) };
        });
        const CX = [300, 480, 660];
        const big = CX.map((x, k) => s.circle(x, 320, 42, { color: CLASS_COLORS[k], fill: CLASS_FILLS[k], width: 3, visible: false }));
        const lab = CX.map((x, k) => s.tex(`[${k}]`, { x, y: 320, size: 34, color: CLASS_COLORS[k], visible: false }));
        const q = s.tex('\\mathbb{Z}/{\\sim} = \\{[0], [1], [2]\\}', { y: 425, size: 40, visible: false });
        const def = s.tex('[a] + [b] := [a + b]', { y: 318, size: 40, color: C.purple, visible: false });
        const chk = SUMS.map(([sum, r], i) => s.tex(`[${REPS[i][0]}] + [${REPS[i][1]}] = [${sum}] = \\part{r}{[${r}]}`, { y: 385 + i * 52, size: 34, visible: false }));
        const same = s.text(`same classes: $[${REPS[0][0]}] = [${REPS[1][0]}]$, $[${REPS[0][1]}] = [${REPS[1][1]}]$; same answer`, { y: 487, size: 30, color: C.muted, visible: false });
        const gen = s.tex("(a + b) - (a' + b') = \\part{d}{(a - a') + (b - b')}", { y: 545, size: 32, visible: false });
        return { nl, dots, CX, big, lab, q, def, chk, same, gen };
      },
      steps: [
        {
          say: 'Now treat each class as a single new object. The thirteen integers on screen collapse into three points: the quotient set, $\\mathbb{Z}${Z} mod the relation.',
          do: async (s, o) => {
            await o.nl.fadeIn();
            await s.all(o.dots.map(({ d }, i) => d.fadeIn({ delay: i * 40, shift: [0, -10] })));
            await s.all(o.dots.map(({ v, d }) => d.moveTo(o.CX[mod(v, 3)], 320, { duration: 1100 })));
            await s.all(o.big.map((c) => c.fadeIn({ shift: [0, 0] })), o.lab.map((l) => l.fadeIn({ shift: [0, 0] })), o.dots.map(({ d }) => d.fadeOut()));
            await o.q.write();
          },
        },
        {
          say: 'To add two classes, pick a representative from each, add those, and take the class of the sum.',
          do: async (s, o) => {
            await o.nl.fadeOut();
            await s.all(o.big.map((c) => c.shift(0, -170, { duration: 800 })), o.lab.map((l) => l.shift(0, -170, { duration: 800 })), o.q.moveTo(480, 240, { duration: 800 }));
            await o.def.write();
          },
        },
        {
          say: 'Then check that the answer doesn’t depend on which representatives you picked. $[1] = [4]${the class of one equals the class of four} and $[2] = [5]${the class of two equals the class of five}; one plus two is three and four plus five is nine, and both land in the class of zero.',
          do: async (s, o) => {
            await s.all(o.lab[1].indicate(), o.lab[2].indicate());
            for (const c of o.chk) {
              await c.write({ duration: 900 });
              await c.color('r', C.green);
            }
            await s.all(o.big[0].flash({ color: C.green }), o.same.fadeIn());
          },
        },
        {
          say: 'In general, if $a \\sim a\'${a is equivalent to a prime} and $b \\sim b\'${b is equivalent to b prime}, the difference of the two sums is a sum of two multiples of three, so it is a multiple of three. The addition is well-defined.',
          do: async (s, o) => {
            await o.gen.write({ duration: 1200 });
            await o.gen.color('d', C.green);
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'construct-q',
      title: 'Building $\\mathbb{Q}$ (and $\\mathbb{Z}$) from pairs',
      scene(s) {
        const p = s.plane({ x: 210, y: 320, width: 300, height: 480, range: [-4, 4, -7, 5], labels: false, names: ['a', 'b'], visible: false });
        const bz = s.tex('b \\ne 0', { x: 305, y: 305, size: 30, color: C.red, visible: false });
        const pts = QCLASS.map((c) => p.point(c, { color: C.yellow, r: 9, visible: false }));
        const ln = p.line({ through: [0, 0], dir: [1, 2] }, { color: C.yellow, width: 3, dash: true, visible: false });
        const axis = p.line({ through: [0, 0], dir: [1, 0] }, { color: C.red, width: 4, visible: false });
        const R = (tex, y, opts = {}) => s.tex(tex, { x: 660, y, size: 30, visible: false, ...opts });
        const rel = R('(a, b) \\sim (c, d) \\iff ad = bc', 70, { size: 32 });
        const ex = R('(1, 2) \\sim (2, 4) \\sim (-3, -6)', 125, { color: C.yellow });
        const name = R('1/2 \\text{ is our name for } [(1, 2)]', 185, { color: C.green });
        const tr = [
          R('\\text{want: } (a,b) \\sim (e,f), \\text{ i.e. } af = be', 240, { color: C.muted }),
          R('ad = bc,\\ \\ cf = de', 290),
          R('\\Rightarrow adf = bcf = bde', 334),
          R('\\Rightarrow d\\,(af - be) = 0', 378),
          R('\\Rightarrow af = be \\quad \\text{since } \\part{d}{d \\ne 0}', 422),
        ];
        const z1 = R('(a, b) \\sim (c, d) \\iff a + d = b + c', 495, { color: C.teal, size: 30 });
        const z2 = s.text('$\\mathbb{Z}$ from $\\mathbb{N}^2$: $(a, b)$ means $a - b$', { x: 675, y: 545, size: 30, color: C.teal, visible: false });
        return { p, bz, pts, ln, axis, rel, ex, name, tr, z1, z2 };
      },
      steps: [
        {
          say: 'A fraction is a pair of integers with nonzero second entry, where $(a, b)${a, b} and $(c, d)${c, d} count as the same when $ad = bc${a d equals b c}. Plotted, the pairs equivalent to $(1, 2)${one, two} all lie on one line through the origin.',
          do: async (s, o) => {
            await o.p.draw();
            await s.all(o.axis.draw(), o.bz.fadeIn({ delay: 300 }));
            await o.rel.write({ duration: 1100 });
            await s.stagger(o.pts.map((pt) => () => pt.draw()), 220);
            await o.ln.draw();
            await o.ex.fadeIn();
          },
        },
        {
          say: 'The whole class is one rational number. One half is our name for the class of $(1, 2)${one, two}.',
          do: (s, o) => o.name.write({ duration: 1000 }),
        },
        {
          say: 'Transitivity is the interesting check. From $ad = bc${a d equals b c} and $cf = de${c f equals d e} we get $d(af - be) = 0${d times a f minus b e equals zero}, and the step that finishes it uses $d \\ne 0${d is not zero}.',
          do: async (s, o) => {
            for (const t of o.tr) await t.write({ duration: 700 });
            await o.tr[4].color('d', C.yellow);
            await s.ring([o.tr[4], 'd'], { color: 'yellow' });
          },
        },
        {
          say: 'Number systems are built this way, layer by layer. The integers come from pairs of naturals, where $(a, b)${a, b} stands for $a - b${a minus b}.',
          do: async (s, o) => {
            await o.z1.write({ duration: 1000 });
            await o.z2.fadeIn();
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'try-is-equivalence',
      kind: 'try',
      title: 'Equivalence relation?',
      say: 'Which of these are equivalence relations? Test each property with small numbers.',
      prompt: 'Which are equivalence relations? Select all.',
      answer: { type: 'multi', value: ['b', 'c', 'e'] },
      choices: [
        { id: 'a', label: 'on $\\mathbb{R}$, $x \\sim y$ iff $\\lvert x - y \\rvert \\le 1$', why: 'Not transitive: $0 \\sim 1$ and $1 \\sim 2$ but $\\lvert 0 - 2 \\rvert = 2 > 1$.' },
        { id: 'b', label: 'on $\\mathbb{Z}$, $a \\sim b$ iff $a^2 = b^2$', why: 'Equality of $a^2$ and $b^2$ is reflexive, symmetric and transitive; the classes are $\\{a, -a\\}$.' },
        { id: 'c', label: 'on lines in the plane, “parallel or equal”', why: 'Every line is equal to itself, the relation is symmetric, and two lines parallel to a third are parallel or equal.' },
        { id: 'd', label: 'on $\\mathbb{Z}$, $a \\sim b$ iff $a \\mid b$', why: 'Not symmetric: $1 \\mid 2$ but $2 \\nmid 1$.' },
        { id: 'e', label: 'on $\\mathbb{R}$, $x \\sim y$ iff $x - y \\in \\mathbb{Z}$', why: '$0 \\in \\mathbb{Z}$, $-(x - y) \\in \\mathbb{Z}$, and sums of integers are integers; the classes are the sets $x + \\mathbb{Z}$.' },
      ],
      hint: 'Test transitivity and symmetry with small numbers.',
      solution: [
        '(b), (c) and (e) are equivalence relations. The classes in (b) are $\\{a, -a\\}$ and in (e) the sets $x + \\mathbb{Z}$.',
        '(a) fails transitivity ($0, 1, 2$); (d) fails symmetry ($1 \\mid 2$, $2 \\nmid 1$).',
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'well-defined-ops',
      title: 'Well-defined operations',
      scene(s) {
        const def = s.tex('[(a, b)] + [(c, d)] := [(ad + bc,\\ bd)]', { y: 54, size: 36, visible: false });
        const q = s.tex("\\begin{gathered}\\text{If } (a,b) \\sim (a',b') \\text{ and } (c,d) \\sim (c',d'), \\\\ \\text{is } (ad + bc,\\ bd) \\sim (a'd' + b'c',\\ b'd')\\,?\\end{gathered}", { y: 142, size: 30, visible: false });
        const box = s.surround(q, { color: C.yellow, pad: 10, visible: false });
        const v = [
          s.tex("(ad + bc)\\,b'd' = (ab')\\,dd' + (cd')\\,bb'", { x: 160, y: 240, size: 30, anchor: [0, 0.5], visible: false }),
          s.tex("\\phantom{(ad + bc)\\,b'd'} = (a'b)\\,dd' + (c'd)\\,bb'", { x: 160, y: 288, size: 30, anchor: [0, 0.5], visible: false }),
          s.tex("\\phantom{(ad + bc)\\,b'd'} = bd\\,(a'd' + b'c') \\ \\checkmark", { x: 160, y: 336, size: 30, anchor: [0, 0.5], color: C.green, visible: false }),
        ];
        const why = s.tex("\\begin{gathered} ab' = a'b \\\\ cd' = c'd \\end{gathered}", { x: 800, y: 288, size: 30, color: C.yellow, visible: false });
        const bad = s.tex('f\\colon \\mathbb{Z}/{\\sim} \\to \\mathbb{Z}, \\quad f([a]) = a \\ \\ ?', { y: 400, size: 32, visible: false });
        const badWhy = s.tex('[1] = [4] \\ \\text{ but } \\ f([1]) = 1 \\ne 4 = f([4])', { y: 454, size: 32, color: C.red, visible: false });
        const stamp = s.stamp('not well-defined', { x: 480, y: 528, color: 'red' });
        return { def, q, box, v, why, bad, badWhy, stamp };
      },
      steps: [
        {
          say: 'A formula in the representatives defines a function on classes only if equivalent representatives give the same answer. For addition of fractions, that is the question in the yellow box.',
          do: async (s, o) => {
            await o.def.write();
            await o.q.write({ duration: 1300 });
            await o.box.draw();
          },
        },
        {
          say: 'For $\\mathbb{Q}${Q} it is a short computation: expand, swap in $ab\' = a\'b${a b prime equals a prime b} and $cd\' = c\'d${c d prime equals c prime d}, and factor out $bd${b d}.',
          do: async (s, o) => {
            await o.v[0].write({ duration: 900 });
            await s.all(o.v[1].write({ duration: 900 }), o.why.fadeIn({ delay: 300 }));
            await o.v[2].write({ duration: 900 });
          },
        },
        {
          say: 'Skip the check and you may have defined nothing at all. Sending a class mod three to its representative gives one for the class of $1${one} and four for the same class written as $[4]${the class of four}.',
          do: async (s, o) => {
            await o.bad.write();
            await o.badWhy.write({ duration: 1100 });
            await o.stamp.slam();
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-equivalence',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Prove this is an equivalence relation, then count its classes.',
      prompt: 'On $\\mathbb{Z}$, define $a \\sim b$ iff $4 \\mid (3a + b)$. Prove that $\\sim$ is an equivalence relation, and determine how many equivalence classes it has.',
      answer: { type: 'proof' },
      hints: ['Reflexive: $3a + a = 4a$.', 'For symmetry, write $b = 4k - 3a$ and compute $3b + a$.', 'For the classes: $3a + b = 4a + (b - a)$.'],
      solution: [
        '**Proof.** *Reflexive:* for $a \\in \\mathbb{Z}$, $3a + a = 4a$, so $4 \\mid (3a + a)$ and $a \\sim a$.',
        '*Symmetric:* suppose $3a + b = 4k$ with $k \\in \\mathbb{Z}$. Then $b = 4k - 3a$, so $3b + a = 3(4k - 3a) + a = 12k - 8a = 4(3k - 2a)$, and $3k - 2a \\in \\mathbb{Z}$. So $b \\sim a$.',
        '*Transitive:* suppose $3a + b = 4k$ and $3b + c = 4\\ell$ with $k, \\ell \\in \\mathbb{Z}$. Adding, $3a + c = 4k + 4\\ell - 4b = 4(k + \\ell - b)$, so $a \\sim c$. Hence $\\sim$ is an equivalence relation.',
        `*Classes:* $3a + b = 4a + (b - a)$, so $4 \\mid (3a + b) \\iff 4 \\mid (b - a)$: $\\sim$ is congruence mod $4$. There are exactly **${WO_CLASSES}** classes, $[0], [1], [2], [3]$: every integer has remainder $0, 1, 2$ or $3$ on division by $4$, and these four classes are distinct because $0, 1, 2, 3$ differ pairwise by less than $4$. ∎`,
      ],
      rubric: [
        'All three properties proved for arbitrary integers, each with an explicit witness (or the properties verified for the equivalent relation $4 \\mid (b - a)$, with that equivalence justified).',
        'The algebra in the symmetry and transitivity steps is correct, whichever route is used.',
        'Identifies $\\sim$ with “$4 \\mid (b - a)$”, with justification.',
        'States that there are 4 classes and explains why they are distinct and cover $\\mathbb{Z}$.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-partition',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap: explain why two equivalence classes can never partly overlap.',
      prompt: 'Why can two equivalence classes never partly overlap?',
      points: [
        'If $c$ is in both $[a]$ and $[b]$, then $c \\sim a$ and $c \\sim b$, so $a \\sim c$ by symmetry.',
        'Transitivity then gives $a \\sim b$.',
        'Then every element of $[a]$ is in $[b]$ and vice versa (the lemma), so $[a] = [b]$.',
        'So two classes are equal or disjoint, and since $a \\in [a]$, together they cover the set: a partition.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Equivalence = reflexive, symmetric, transitive. The classes partition the set, and every partition comes from one.', 130),
          recapItem(s, '• Quotients turn classes into objects; operations on them must be well-defined.', 270),
          recapItem(s, 'Next: induction.', 400, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'An equivalence relation is reflexive, symmetric and transitive, and its classes partition the set. Partitions and equivalence relations are the same idea.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Quotients turn classes into new objects, like the rationals, and any operation on them must be checked to be well-defined.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: induction, the tool for proving statements about every natural number.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
