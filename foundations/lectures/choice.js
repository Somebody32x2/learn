/**
 * Lecture 24 · The axiom of choice (foundations/PLAN.md § 24). Supplement · Krantz.
 *
 * Choreography: Russell's shoes and socks are drawn as real pairs (a rule ticks every left shoe at once; socks
 * get question marks); the axiom's choice function is a fan of arrows from an index row into a row of sets, and
 * the picked dots fly into a tuple of the product; a surjection's fibers are colored, one point of each is picked
 * and the picked arrows turn around to become the right inverse g. Maximal vs maximum on a hand-drawn Hasse diagram.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, no DOM)

/** The poset of try-maximal: maximal elements = divide no other element. */
const POSET = [2, 3, 4, 5, 6, 8, 9, 12];
const MAXIMAL = POSET.filter((x) => !POSET.some((y) => y !== x && y % x === 0));
const HAS_MAX = POSET.some((x) => POSET.every((y) => x % y === 0));
const BELOW = POSET.filter((x) => !MAXIMAL.includes(x)).map((x) => [x, POSET.find((y) => y !== x && y % x === 0)]);

/** The Hasse diagram of divisibility on {1, 2, 3, 4, 6}: covering pairs computed. */
const HASSE = [1, 2, 3, 4, 6];
const COVERS = [];
for (const a of HASSE)
  for (const b of HASSE)
    if (a !== b && b % a === 0 && !HASSE.some((c) => c !== a && c !== b && c % a === 0 && b % c === 0)) COVERS.push([a, b]);
const HASSE_MAXIMAL = HASSE.filter((x) => !HASSE.some((y) => y !== x && y % x === 0));

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

const poly = (cx, cy, pts, k = 1) => `M ${pts.map(([x, y]) => `${(cx + k * x).toFixed(1)} ${(cy + y).toFixed(1)}`).join(' L ')} Z`;
const ellipse = (cx, cy, rx, ry) => `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

/** Shoe outline, toe pointing right (dir 1) or left (dir −1): left and right shoes are mirror images. */
const SHOE = [[-22, 12], [24, 12], [24, 3], [12, -2], [0, -4], [-8, -16], [-22, -16]];
/** A sock: both socks of a pair are the same shape. */
const SOCK = [[-12, -24], [4, -24], [4, -2], [18, 0], [22, 12], [-4, 12], [-12, 4]];

const PAIR_X = [150, 290, 430, 570, 710];

/** A row of pairs (shoes or socks) at height y. */
function pairRow(s, y, kind) {
  return PAIR_X.map((cx) => {
    const oval = s.rect(cx - 62, y - 42, 124, 84, { color: C.muted, dash: '8 6', width: 2, radius: 42, visible: false });
    const mk = (dx, dir) =>
      s.path(kind === 'shoe' ? poly(cx + dx, y, SHOE, dir) : poly(cx + dx, y, SOCK, 1), { color: C.ink, fill: FILL.ink, width: 3, visible: false });
    const left = mk(-26, -1);
    const right = mk(26, 1);
    return { cx, oval, left, right, mobs: [oval, left, right] };
  });
}

/** Sets A_1…A_4 as ovals with dots, used by `axiom`. */
const SET_X = [120, 270, 420, 570];
const SET_Y = 290;
const SET_DOTS = [
  [[-22, -38], [18, 4], [-10, 42]],
  [[0, -48], [-26, -12], [24, -6], [-16, 30], [20, 48]],
  [[-12, -24], [16, 30]],
  [[16, -42], [-22, -6], [20, 20], [-8, 50]],
];
const PICK = [1, 3, 0, 2];
const OTHER = [0, 1, 1, 3];

// ---------------------------------------------------------------- lecture

export default {
  id: 'choice',
  title: 'The axiom of choice',
  goals: [
    'State the axiom of choice in terms of choice functions',
    'Recognize where a proof uses choice, and where a rule makes it unnecessary',
    'State the equivalent forms: every surjection has a right inverse, Zorn’s lemma, the well-ordering theorem',
    'Distinguish maximal from maximum elements in a partial order',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'shoes-socks',
      title: 'Shoes and socks',
      scene(s) {
        const shoes = pairRow(s, 150, 'shoe');
        const socks = pairRow(s, 385, 'sock');
        const dots1 = s.text('⋯', { x: 830, y: 150, size: 44, color: C.muted, visible: false });
        const dots2 = s.text('⋯', { x: 830, y: 385, size: 44, color: C.muted, visible: false });
        const nums = [0, 1, 2].map((i) => s.text(String(i + 1), { x: PAIR_X[i], y: 82, size: 30, color: C.yellow, weight: 600, visible: false }));
        const finite = s.text('finitely many: pick one at a time', { x: 430, y: 235, size: 30, color: C.muted, visible: false });
        const checks = shoes.map((p) => s.text('✓', { x: p.cx - 26, y: 88, size: 36, color: C.green, weight: 700, visible: false }));
        const rule = s.text('a rule picks for you: take the left shoe', { x: 430, y: 235, size: 30, color: C.green, visible: false });
        const qs = socks.map((p) => s.text('?', { x: p.cx, y: 318, size: 36, color: C.yellow, weight: 700, visible: false }));
        const norule = s.text('no rule can tell two socks apart', { x: 430, y: 470, size: 30, color: C.red, visible: false });
        const ac = s.text('the **axiom of choice**: a choice exists anyway', { x: 480, y: 535, size: 32, color: C.purple, visible: false });
        return { shoes, socks, dots1, dots2, nums, finite, checks, rule, qs, norule, ac };
      },
      steps: [
        {
          say: 'Here are three pairs of shoes, and you must pick one shoe from each pair. Pick from the first, then the second, then the third: finitely many choices need no new axiom, by induction on the number of sets.',
          do: async (s, o) => {
            await s.all(o.shoes.slice(0, 3).map((p, i) => s.all(p.mobs.map((m) => m.fadeIn({ delay: i * 200 })))));
            await o.finite.fadeIn();
            const picks = [o.shoes[0].right, o.shoes[1].left, o.shoes[2].right];
            for (let i = 0; i < 3; i++) await s.all(o.nums[i].fadeIn({ shift: [0, -8] }), picks[i].recolor(C.yellow));
          },
        },
        {
          say: 'Now take infinitely many pairs. You can’t pick one at a time forever, but you don’t have to: a rule picks for you. Take the left shoe, from every pair at once.',
          do: async (s, o) => {
            await s.all(
              o.finite.fadeOut(),
              ...o.nums.map((n) => n.fadeOut()),
              ...[o.shoes[0].right, o.shoes[1].left, o.shoes[2].right].map((m) => m.recolor(C.ink)),
              ...o.shoes.slice(3).flatMap((p, i) => p.mobs.map((m) => m.fadeIn({ delay: i * 200 }))),
              o.dots1.fadeIn({ delay: 400 }),
            );
            await o.rule.fadeIn();
            await s.stagger(o.shoes.map((p, i) => () => s.all(p.left.recolor(C.green), o.checks[i].fadeIn({ shift: [0, -10] }))), 150);
          },
        },
        {
          say: 'Socks are different: the two socks in a pair look exactly alike, so there is no rule that names one of them. This is Russell’s example.',
          do: async (s, o) => {
            await s.all(...o.socks.flatMap((p, i) => p.mobs.map((m) => m.fadeIn({ delay: i * 150 }))), o.dots2.fadeIn({ delay: 700 }));
            await s.stagger(o.qs.map((q) => () => q.fadeIn({ shift: [0, -10] })), 120);
            await o.norule.fadeIn();
          },
        },
        {
          say: 'To pick one sock from each of infinitely many pairs, you need an axiom that says such a choice exists. That axiom is the axiom of choice.',
          do: async (s, o) => {
            await s.all(o.qs.map((q) => q.indicate({ color: C.yellow })));
            await o.ac.write({ duration: 1000 });
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'axiom',
      title: 'The axiom of choice',
      scene(s) {
        const card = s.defCard({
          y: 92, width: 880, title: false, size: 30,
          body: '**Axiom of choice.** For every family $\\{A_i\\}_{i \\in I}$ of nonempty sets there is a function $c\\colon I \\to \\bigcup_i A_i$ with $\\part{ci}{c(i) \\in A_i}$ for all $i$.',
          visible: false,
        });
        const sets = SET_X.map((cx, k) => {
          const oval = s.path(ellipse(cx, SET_Y, 62, 80), { color: C.blue, fill: FILL.blue, width: 3, visible: false });
          const label = s.tex(`A_{${k + 1}}`, { x: cx, y: 184, size: 32, color: C.blue, visible: false });
          const dots = SET_DOTS[k].map(([dx, dy]) => s.dot(cx + dx, SET_Y + dy, { r: 7, color: C.ink, visible: false }));
          return { oval, label, dots };
        });
        const more = s.text('⋯', { x: 680, y: SET_Y, size: 44, color: C.muted, visible: false });
        const idxY = 466;
        const idx = SET_X.map((cx, k) => ({
          c: s.circle(cx, idxY, 24, { color: C.ink, width: 3, visible: false }),
          t: s.tex(String(k + 1), { x: cx, y: idxY, size: 30, visible: false }),
        }));
        const I = s.tex('I', { x: 60, y: idxY, size: 34, visible: false });
        const arrowTo = (k, j, opts) => {
          const [dx, dy] = SET_DOTS[k][j];
          const [tx, ty] = [SET_X[k] + dx, SET_Y + dy];
          const [fx, fy] = [SET_X[k], idxY - 26];
          const L = Math.hypot(tx - fx, ty - fy);
          return s.arrow(fx, fy, tx - ((tx - fx) / L) * 11, ty - ((ty - fy) / L) * 11, { width: 4, visible: false, ...opts });
        };
        const arrows = SET_X.map((_, k) => arrowTo(k, PICK[k], { color: C.green }));
        const ghosts = SET_X.map((_, k) => arrowTo(k, OTHER[k], { color: C.muted, dash: true, width: 3 }));
        const st = s.stamp('exists, no recipe', { x: 790, y: 410, color: 'yellow', size: 30 });
        const tuple = s.tex(
          '(\\part{e0}{c(1)}, \\part{e1}{c(2)}, \\part{e2}{c(3)}, \\part{e3}{c(4)}, \\dots) \\in \\textstyle\\prod_{i \\in I} A_i \\ne \\varnothing',
          { x: 480, y: 540, size: 34, visible: false },
        );
        return { card, sets, more, idx, I, arrows, ghosts, st, tuple };
      },
      steps: [
        {
          say: 'A family of nonempty sets, one for each index $i${i} in an index set $I${I}. A choice function picks one element from each set, all at once.',
          do: async (s, o) => {
            await s.all(o.sets.map((st, k) => s.all(st.oval.fadeIn({ delay: k * 150 }), st.label.fadeIn({ delay: k * 150 }), ...st.dots.map((d) => d.draw({ delay: 300 + k * 150 })))), o.more.fadeIn({ delay: 600 }));
            await s.all(o.I.fadeIn(), ...o.idx.map((x, k) => s.all(x.c.fadeIn({ delay: k * 100 }), x.t.fadeIn({ delay: k * 100 }))));
            await s.all(o.arrows.map((a) => a.draw({ duration: 700 })));
            await s.all(o.sets.map((st, k) => st.dots[PICK[k]].recolor(C.green)));
          },
        },
        {
          say: 'The axiom says such a function exists: $c(i) \\in A_i${c of i is in A i} for every $i${i}. It does not say how to find it, and there may be many.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.card.color('ci', 'green');
            await s.all(o.ghosts.map((g) => g.draw({ duration: 600 })));
            await o.st.slam();
            await s.all(o.ghosts.map((g) => g.fadeOut()));
          },
        },
        {
          say: 'Here is an equivalent way to say it. The picked elements form one tuple in the product of the sets, so a product of nonempty sets is nonempty.',
          do: async (s, o) => {
            const flyers = o.sets.map((st, k) => {
              const d = st.dots[PICK[k]];
              const [cx, cy] = d.circle;
              return { m: s.dot(cx, cy, { r: 7, color: C.green }), cx, cy, k };
            });
            await s.all(
              flyers.map((f) => {
                const b = o.tuple.partBox(`e${f.k}`);
                return f.m.animate({ x: b.cx - f.cx, y: b.cy - f.cy }, { duration: 900, delay: f.k * 120 });
              }),
            );
            await s.all(o.tuple.fadeIn({ shift: [0, 0] }), ...flyers.map((f) => f.m.fadeOut()));
            for (let k = 0; k < 4; k++) o.tuple.color(`e${k}`, C.green);
            await o.tuple.indicate({ color: C.green });
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'sections',
      title: 'Surjections have right inverses',
      scene(s) {
        const f = s.mapDiagram({
          x: 300, y: 325, gap: 340, spacing: 62, size: 34,
          domain: ['1', '2', '3', '4', '5', '6'], codomain: ['p', 'q', 'r'],
          arrows: [[0, 0], [1, 0], [2, 1], [3, 1], [4, 1], [5, 2]], labels: ['A', 'B'], visible: false,
        });
        const name = s.tex('f', { x: 300, y: 82, size: 36, visible: false });
        const fiber = s.tex('f^{-1}(\\{b\\}) \\ne \\varnothing', { x: 740, y: 125, size: 36, color: C.blue, visible: false });
        const fiberWhy = s.text('for every $b$: $f$ is onto', { x: 740, y: 180, size: 30, color: C.blue, visible: false });
        const gdef = s.tex('g(b) := \\text{chosen point}', { x: 740, y: 270, size: 30, color: C.green, visible: false });
        const id = s.tex('f \\circ g = \\mathrm{id}_B', { x: 740, y: 345, size: 38, color: C.green, visible: false });
        const card = s.defCard({ x: 740, y: 470, kind: 'theorem', title: false, tex: '\\begin{gathered}\\text{every surjection has} \\\\ \\text{a right inverse} \\\\ \\iff \\text{AC}\\end{gathered}', visible: false });
        return { f, name, fiber, fiberWhy, gdef, id, card };
      },
      steps: [
        {
          say: 'Here is a surjection $f${f} from $A${A} onto $B${B}. Because $f${f} is onto, the fiber above every $b${b}, the set of points that map to it, is nonempty.',
          do: async (s, o) => {
            await s.all(o.f.fadeIn(), o.name.fadeIn());
            const cols = ['teal', 'orange', 'blue'];
            const fib = [[0, 1], [2, 3, 4], [5]];
            for (let j = 0; j < 3; j++) await s.all(o.f.highlightElement('cod', j, cols[j]), ...fib[j].map((i) => o.f.highlightElement('dom', i, cols[j])));
            await o.fiber.write();
            await o.fiberWhy.fadeIn();
          },
        },
        {
          say: 'Choice picks one point from every fiber at the same time. Here we keep two above $p${p}, four above $q${q}, and six above $r${r}.',
          do: async (s, o) => {
            const keep = [[1, 0], [3, 1], [5, 2]];
            const drop = [[0, 0], [2, 1], [4, 1]];
            await s.all(drop.map(([i, j]) => o.f.removeArrow(i, j)));
            await s.all(keep.map(([i, j]) => o.f.removeArrow(i, j)));
            await s.all(...keep.map(([i, j]) => o.f.addArrow(i, j, { color: 'green' })), ...keep.map(([i]) => o.f.highlightElement('dom', i, 'green')));
            await o.gdef.fadeIn();
          },
        },
        {
          say: 'Turn the chosen arrows around and you get a function $g${g} from $B${B} back to $A${A}. Going there and back lands where you started: $f \\circ g = \\mathrm{id}_B${f composed with g is the identity on B}.',
          do: async (s, o) => {
            await s.all(o.f.invert(), o.name.swap('g'));
            await o.name.recolor(C.green);
            await o.id.write();
          },
        },
        {
          say: 'For an arbitrary surjection there’s no rule for picking, so this needs choice. In fact, every surjection has a right inverse is equivalent to the axiom of choice.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.card.indicate({ color: C.blue });
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-needs-choice',
      kind: 'try',
      title: 'Does it need choice?',
      say: 'Which of these constructions really need the axiom of choice? Select all that do.',
      prompt: 'Which of these require the axiom of choice? Select all.',
      answer: { type: 'multi', value: ['b', 'd'] },
      choices: [
        { id: 'a', label: 'Choosing an element from every nonempty subset of $\\mathbb{N}$', why: 'No choice needed: take the least element. Well-ordering of $\\mathbb{N}$ is a rule.' },
        { id: 'b', label: 'Choosing an element from every nonempty subset of $\\mathbb{R}$', why: 'Needs choice: no definable rule works for all subsets (many, like $(0, 1)$, have no least element).' },
        { id: 'c', label: 'A right inverse for ${f\\colon \\mathbb{Z} \\to \\mathbb{Z}_{\\ge 0}}$, ${f(n) = \\lvert n \\rvert}$', why: 'No choice needed: the rule $g(m) = m$ picks the nonnegative preimage.' },
        { id: 'd', label: 'One sock from each of infinitely many pairs', why: 'Needs choice: the two socks of a pair are indistinguishable, so no rule picks one.' },
      ],
      hint: 'For each one, is there an explicit rule that does the picking?',
      solution: [
        '(a) Take the least element of each subset: $\\mathbb{N}$ is well-ordered, so that is a rule. No choice.',
        '(b) Needs choice: there is no rule that names an element of *every* nonempty subset of $\\mathbb{R}$.',
        '(c) $g(m) = m$ works, since $f(m) = \\lvert m \\rvert = m$ for $m \\ge 0$. No choice.',
        '(d) Russell’s socks: infinitely many choices with nothing to tell the options apart. Needs choice.',
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'hidden-choice',
      title: 'Choice hiding in earlier proofs',
      scene(s) {
        const p = s.proof({ y: 30, width: 900, height: 320, size: 30 });
        const cols = [0, 1, 2].map((k) => {
          const x = 200 + k * 260;
          const head = s.tex(`A_{${k + 1}}`, { x, y: 392, size: 32, color: C.blue, visible: false });
          const lists = ['(a, b, c, \\dots)', '(b, a, c, \\dots)', '(c, a, b, \\dots)'].map((t, j) =>
            s.tex(t.replace(/a/g, `x_{${k + 1}}`).replace(/b/g, `y_{${k + 1}}`).replace(/c/g, `z_{${k + 1}}`), { x, y: 440 + j * 46, size: 30, color: C.muted, visible: false }),
          );
          return { head, lists };
        });
        const more = s.text('⋯', { x: 870, y: 486, size: 40, color: C.muted, visible: false });
        const mild = s.text('countable choice, dependent choice: used without comment all over analysis', { x: 480, y: 470, size: 32, width: 760, color: C.muted, visible: false });
        return { p, cols, more, mild };
      },
      steps: [
        {
          say: 'Recall the theorem from the cardinality lecture: a countable union of countable sets is countable. Here is its proof again.',
          do: async (s, o) => {
            await o.p.add('**Proof.** Let $A_1, A_2, \\dots$ be countable sets.', { kind: 'assume', why: 'hypothesis' });
            o.pick = o.p.add('Choose a listing $a_{i1}, a_{i2}, \\dots$ of each $A_i$.', { why: 'countable' });
            await o.pick;
            await o.p.add('List $\\bigcup_i A_i$ along the diagonals of $(a_{ij})$.', { why: 'diagonal walk' });
            await o.p.add('Therefore $\\bigcup_i A_i$ is countable.', { kind: 'conclude', why: '' });
            await o.p.qed();
          },
        },
        {
          say: 'Look at the second line. Each $A_i${A i} has many listings, and the proof chose one for every $i${i} at once, with no rule saying which.',
          do: async (s, o) => {
            await o.p.highlight(o.pick, 'yellow');
            await s.all(...o.cols.flatMap((c, k) => [c.head.fadeIn({ delay: k * 120 }), ...c.lists.map((l, j) => l.fadeIn({ delay: k * 120 + j * 80 }))]), o.more.fadeIn({ delay: 400 }));
            const picks = [1, 0, 2];
            o.rings = o.cols.map((c, k) => s.ring(c.lists[picks[k]], { color: 'green', shape: 'box' }));
            await s.all(...o.rings, ...o.cols.map((c, k) => c.lists[picks[k]].recolor(C.green)));
          },
        },
        {
          say: 'That’s a use of the axiom of choice, a countable version of it: countably many choices, made all at once.',
          do: async (s, o) => {
            await o.p.note(o.pick, 'countable choice', { color: 'yellow' });
          },
        },
        {
          say: 'Most of analysis uses a mild version like this, countable choice or dependent choice, without saying so. Now you’ll notice it.',
          do: async (s, o) => {
            await s.all(...o.cols.flatMap((c) => [c.head, ...c.lists].map((m) => m.fadeOut())), o.more.fadeOut(), ...o.rings.map((r) => r.fadeOut()));
            await o.mild.fadeIn();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'equivalents',
      title: 'Equivalent forms',
      scene(s) {
        const card = (y, body) => s.defCard({ x: 480, y, width: 880, title: false, body, visible: false });
        const cards = [
          card(85, '**Axiom of choice:** every family of nonempty sets has a choice function.'),
          card(248, '**Zorn’s lemma:** nonempty poset, every chain bounded above ⇒ a maximal element.'),
          card(391, '**Well-ordering theorem:** every set can be well-ordered.'),
        ];
        const iffs = [166, 329].map((y) => s.tex('\\Updownarrow', { x: 480, y, size: 28, visible: false }));
        const over = s.text('equivalent, given the other axioms of set theory (ZF)', { x: 480, y: 458, size: 30, color: C.muted, visible: false });
        const basis = s.text('**Zorn** ⇒ every vector space has a basis (Math 429)', { x: 480, y: 503, size: 30, visible: false });
        const comp = s.text('**Well-ordering** ⇒ for all sets $A, B$: $\\lvert A \\rvert \\le \\lvert B \\rvert$ or $\\lvert B \\rvert \\le \\lvert A \\rvert$', { x: 480, y: 548, size: 30, visible: false });
        return { cards, iffs, over, basis, comp };
      },
      steps: [
        {
          say: 'The axiom of choice has two famous equivalent forms: Zorn’s lemma, and the well-ordering theorem, which says every set can be well-ordered. Over the other axioms of set theory, each one implies the others.',
          do: async (s, o) => {
            for (let k = 0; k < 3; k++) {
              await o.cards[k].reveal({ duration: 700 });
              if (k < 2) await o.iffs[k].fadeIn({ shift: [0, -8] });
            }
            await o.over.fadeIn();
          },
        },
        {
          say: 'Zorn’s lemma is the form algebraists use. With it you prove that every vector space has a basis, which you’ll meet in linear algebra.',
          do: async (s, o) => {
            await o.cards[1].indicate({ color: C.purple });
            await o.basis.fadeIn({ shift: [0, -10] });
          },
        },
        {
          say: 'And with the well-ordering theorem you can prove comparability: for any sets $A${A} and $B${B}, $\\lvert A \\rvert \\le \\lvert B \\rvert${the size of A is at most the size of B} or the other way around.',
          do: async (s, o) => {
            await o.cards[2].indicate({ color: C.purple });
            await o.comp.fadeIn({ shift: [0, -10] });
            await o.comp.indicate({ color: C.green });
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-zorn',
      kind: 'blanks',
      title: 'State Zorn’s lemma',
      say: 'Fill in the three missing words of Zorn’s lemma.',
      prompt: 'Complete the statement of Zorn’s lemma.',
      lines: [
        ['\\text{If every }', { id: 'chain', chips: ['\\text{chain}', '\\text{antichain}', '\\text{subset}'], answer: '\\text{chain}', hint: 'A totally ordered subset.' }, '\\text{ in a nonempty partially ordered set}'],
        ['\\text{has an }', { id: 'ub', chips: ['\\text{upper bound}', '\\text{least element}', '\\text{maximal element}'], answer: '\\text{upper bound}', hint: 'Something above every element of the chain.' }, '\\text{, then the set has a}'],
        [{ id: 'max', chips: ['\\text{maximal}', '\\text{maximum}', '\\text{minimal}'], answer: '\\text{maximal}', hint: 'Nothing above it, not necessarily above everything.' }, '\\text{ element.}'],
      ],
      solution: [
        'If every **chain** in a nonempty partially ordered set has an **upper bound**, then the set has a **maximal** element.',
        'A chain is a totally ordered subset. The conclusion is “maximal” (nothing strictly above it), not “maximum” (above everything): a poset can have several maximal elements and no maximum.',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'maximal-maximum',
      title: 'Maximal versus maximum',
      scene(s) {
        const pos = { 1: [300, 500], 2: [200, 365], 3: [400, 365], 4: [130, 225], 6: [300, 225] };
        const nodes = Object.fromEntries(
          HASSE.map((v) => {
            const [x, y] = pos[v];
            return [v, { c: s.circle(x, y, 30, { color: C.ink, fill: FILL.ink, width: 3, visible: false }), t: s.tex(String(v), { x, y, size: 34, visible: false }), x, y }];
          }),
        );
        const edges = COVERS.map(([a, b]) => {
          const [x1, y1] = pos[a];
          const [x2, y2] = pos[b];
          const L = Math.hypot(x2 - x1, y2 - y1);
          const [ux, uy] = [(x2 - x1) / L, (y2 - y1) / L];
          return s.line(x1 + ux * 32, y1 + uy * 32, x2 - ux * 32, y2 - uy * 32, { color: C.muted, width: 3, visible: false });
        });
        const caption = s.text('$(\\{1, 2, 3, 4, 6\\}, \\mid)$: up = divides', { x: 270, y: 60, size: 30, color: C.muted, visible: false });
        const maximal = s.text('**maximal**: nothing strictly above it', { x: 700, y: 135, size: 30, width: 420, color: C.green, visible: false });
        const maximum = s.text('**maximum**: above or equal to everything', { x: 700, y: 240, size: 30, width: 420, visible: false });
        const noMax = s.text('no maximum: $4 \\nmid 6$ and $6 \\nmid 4$', { x: 700, y: 335, size: 30, color: C.red, visible: false });
        const cross = s.tex('\\times', { x: 215, y: 225, size: 40, color: C.red, visible: false });
        const chain = s.tex('1 \\mid 2 \\mid 4 \\mid 8', { x: 700, y: 430, size: 38, visible: false });
        const chainNote = s.text('a total order: the top is maximal **and** maximum', { x: 700, y: 505, size: 30, width: 420, color: C.muted, visible: false });
        return { nodes, edges, caption, maximal, maximum, noMax, cross, chain, chainNote };
      },
      steps: [
        {
          say: 'Here is divisibility on one, two, three, four and six, drawn as a Hasse diagram: a line going up means divides. An element is maximal if nothing is strictly above it. Here both four and six are maximal.',
          do: async (s, o) => {
            await o.caption.fadeIn();
            for (const v of HASSE) await s.all(o.nodes[v].c.fadeIn({ shift: [0, 0], duration: 300 }), o.nodes[v].t.fadeIn({ duration: 300 }));
            await s.all(o.edges.map((e) => e.draw({ duration: 500 })));
            await o.maximal.fadeIn();
            await s.all(HASSE_MAXIMAL.flatMap((v) => [o.nodes[v].c.recolor(C.green), o.nodes[v].t.recolor(C.green), o.nodes[v].c.indicate({ color: C.green })]));
          },
        },
        {
          say: 'A maximum is something more: an element above or equal to everything. Four is not above six, and six is not above four, so this poset has no maximum.',
          do: async (s, o) => {
            await o.maximum.fadeIn();
            await o.cross.fadeIn({ shift: [0, 0] });
            await o.noMax.fadeIn();
          },
        },
        {
          say: 'In a total order, where any two elements are comparable, the two ideas agree. In a partial order there can be many maximal elements and no maximum, which is why Zorn’s lemma promises only a maximal one.',
          do: async (s, o) => {
            await o.chain.write();
            await o.chainNote.fadeIn();
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'independence',
      title: 'Is choice true?',
      scene(s) {
        const line = s.line(80, 150, 880, 150, { color: C.muted, width: 3, visible: false });
        const ev = (x, year, who, color = C.ink) => ({
          tick: s.dot(x, 150, { r: 9, color, visible: false }),
          year: s.text(`**${year}**`, { x, y: 108, size: 32, color, visible: false }),
          who: s.text(who, { x, y: 215, size: 30, width: 270, visible: false }),
        });
        const events = [
          ev(200, '1904', 'Zermelo: well-ordering from AC'),
          ev(480, '1938', 'Gödel: AC consistent with ZF', C.blue),
          ev(760, '1963', 'Cohen: so is its negation', C.red),
        ];
        const zfc = s.text('ZFC = ZF + AC: the standard foundation', { x: 480, y: 315, size: 32, color: C.green, weight: 600, visible: false });
        const panel = (x, head, items, color) => ({
          head: s.text(head, { x, y: 370, size: 30, color, weight: 600, visible: false }),
          items: items.map((t, i) => s.text(t, { x, y: 415 + i * 45, size: 30, visible: false })),
        });
        const strange = panel(250, 'strange consequences', ['Banach–Tarski paradox', 'non-measurable sets'], C.orange);
        const essential = panel(710, 'essential ones', ['bases of vector spaces', 'maximal ideals', 'Tychonoff’s theorem'], C.green);
        const habit = s.text('Good habit: when a proof makes infinitely many arbitrary choices, say so.', { x: 480, y: 455, size: 34, width: 800, color: C.yellow, visible: false });
        return { line, events, zfc, strange, essential, habit };
      },
      steps: [
        {
          say: 'Is the axiom of choice true? Assuming the other axioms are consistent, it can be neither proved nor refuted from them: Gödel showed in 1938 that it is consistent with them, and Cohen showed in 1963 that its negation is too.',
          do: async (s, o) => {
            await o.line.draw({ duration: 600 });
            for (const e of o.events) await s.all(e.tick.draw(), e.year.fadeIn({ shift: [0, -8] }), e.who.fadeIn({ delay: 200 }));
          },
        },
        {
          say: 'So it’s a choice of axiom. Most mathematicians accept it, and work in Z F C. It has strange consequences, but also essential ones that much of mathematics depends on.',
          do: async (s, o) => {
            await o.zfc.fadeIn();
            await s.all(o.strange.head.fadeIn(), ...o.strange.items.map((m, i) => m.fadeIn({ delay: 200 + i * 200 })));
            await s.all(o.essential.head.fadeIn(), ...o.essential.items.map((m, i) => m.fadeIn({ delay: 200 + i * 200 })));
          },
        },
        {
          say: 'Either way, it’s good practice to notice when you use it: when a proof makes infinitely many arbitrary choices, say so.',
          do: async (s, o) => {
            await s.all(...[o.strange, o.essential].flatMap((p) => [p.head, ...p.items].map((m) => m.fadeOut())));
            await o.habit.fadeIn();
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'try-maximal',
      kind: 'try',
      title: 'Maximal elements',
      say: 'Find all the maximal elements of this divisibility poset.',
      prompt: `In the poset $(\\{${POSET.join(', ')}\\}, \\mid)$, which elements are maximal? Enter the set.`,
      answer: { type: 'set', value: MAXIMAL.map(String) },
      hint: 'An element is maximal if it divides no other element of the set.',
      solution: [
        `Not maximal: ${BELOW.map(([x, y]) => `$${x} \\mid ${y}$`).join(', ')}.`,
        `Maximal: $${MAXIMAL.join(', ')}$, since none of them divides another element of the set.`,
        HAS_MAX ? 'This poset has a maximum.' : 'There is no maximum: no element is divisible by all the others (for instance $5 \\nmid 12$ and $12 \\nmid 5$).',
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-section',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. This direction needs no choice at all: prove it from the definitions.',
      prompt: 'Let $f\\colon A \\to B$ and $g\\colon B \\to A$ with $f \\circ g = \\mathrm{id}_B$. Prove that $f$ is surjective and $g$ is injective. (No choice is needed for this direction.)',
      answer: { type: 'proof' },
      hints: ['For $b \\in B$, what does $f$ send $g(b)$ to?', 'Suppose $g(b_1) = g(b_2)$ and apply $f$ to both sides.'],
      solution: [
        '**Proof.** *Surjective.* Let $b \\in B$. Then $g(b) \\in A$ and $f(g(b)) = (f \\circ g)(b) = \\mathrm{id}_B(b) = b$, so $b$ is in the range of $f$. Since $b$ was arbitrary, $f$ is surjective.',
        '*Injective.* Let $b_1, b_2 \\in B$ with $g(b_1) = g(b_2)$. Applying $f$ to both sides gives $f(g(b_1)) = f(g(b_2))$, that is, $b_1 = b_2$, because $f \\circ g = \\mathrm{id}_B$. So $g$ is injective. ∎',
      ],
      rubric: [
        'Surjectivity: starts from an arbitrary $b \\in B$ and exhibits the preimage $g(b)$.',
        'Computes $f(g(b)) = b$ using $f \\circ g = \\mathrm{id}_B$.',
        'Injectivity: assumes $g(b_1) = g(b_2)$ and applies $f$ to both sides to get $b_1 = b_2$.',
        'Uses $f \\circ g = \\mathrm{id}_B$ (not $g \\circ f = \\mathrm{id}_A$, which is not given).',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-choice',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain the axiom of choice in your own words, with one example that needs it and one that doesn’t.',
      prompt: 'What does the axiom of choice say? Give one construction that needs it and one that looks similar but doesn’t.',
      points: [
        'Every family of nonempty sets has a choice function: $c(i) \\in A_i$ for every index $i$.',
        'It is needed when infinitely many arbitrary choices are made with no rule: socks, a right inverse of a general surjection, a listing of each of countably many sets.',
        'It is not needed when a rule exists: the least element of a subset of $\\mathbb{N}$, the left shoe.',
        'It is equivalent to Zorn’s lemma and the well-ordering theorem, and independent of the other axioms (ZF).',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• The axiom of choice: every family of nonempty sets has a choice function.', 130),
          recapItem(s, '• Equivalent: every surjection has a right inverse; Zorn’s lemma; well-ordering.', 250),
          recapItem(s, 'Next: the real numbers, built so that they have no gaps.', 400, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'The axiom of choice says choice functions exist: one element from every set of a family, all at once, even when no rule can pick.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Its equivalent forms: every surjection has a right inverse, Zorn’s lemma, and the well-ordering theorem.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: the real numbers, built so that they have no gaps.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
