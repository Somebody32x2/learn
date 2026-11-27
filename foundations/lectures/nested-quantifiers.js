/**
 * Lecture 4 · Nested quantifiers (foundations/PLAN.md § 4). Irani · Logic.
 *
 * Choreography: a 4 × 4 grid of L(x, y) checks is scanned row by row (∀x ∃y) and column by column (∃y ∀x);
 * quantifiers become a game on a number line (the opponent's point in red, your answer in green); the ¬ walks
 * right through a quantifier prefix flipping each one; a scratch pane finds y, then a two-column proof checks it;
 * the ε–N definition is played on 1/n with a shrinking band and a moving cutoff N.
 */
import { C } from '../../lectern/src/core/stage.js';
import { paint } from '../../lectern/src/viz/logic.js';

// ---------------------------------------------------------------- data (computed, not typed)

const XS = ['a', 'b', 'c', 'd'];
const YS = [1, 2, 3, 4];
/** L(x, y) as sets of y per x; the second relation fills column 2. */
const L1 = { a: [2], b: [1, 3], c: [4], d: [2, 4] };
const L2 = Object.fromEntries(XS.map((x) => [x, [...new Set([...L1[x], 2])].sort()]));
const forallExists = (L) => XS.every((x) => YS.some((y) => L[x].includes(y)));
const existsForall = (L) => YS.some((y) => XS.every((x) => L[x].includes(y)));
const FULL_COL = (L) => YS.findIndex((y) => XS.every((x) => L[x].includes(y)));
/** The y each row picks in the ∀x ∃y scan (its first check). */
const PICK = Object.fromEntries(XS.map((x) => [x, L1[x][0]]));

/** limit-preview: a_n = 1/n, L = 0; the cutoff N for each tolerance. */
const cutoff = (eps) => {
  let n = 1;
  while (!(1 / n < eps)) n++;
  return n;
};
const EPS = [0.15, 0.05];
const NS = EPS.map(cutoff);
const SEQ_N = 40;

/** arbitrary: the values the two non-proofs compute. */
const quad = (x) => x * x - 2 * x + 1;

// ---------------------------------------------------------------- local helpers

/** Colors parts of a Tex immediately (scene state). */
function paintParts(tex, parts) {
  for (const [name, color] of Object.entries(parts)) for (const e of tex.part(name)) e.style.color = color;
}

/** A row of the recap list, hidden. */
const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** The L(x, y) grid: cells, labels and check marks for relation L. */
const G = { x0: 150, y0: 160, c: 72 };
const cellBox = (i, j) => ({ x: G.x0 + j * G.c, y: G.y0 + i * G.c, w: G.c, h: G.c, cx: G.x0 + (j + 0.5) * G.c, cy: G.y0 + (i + 0.5) * G.c });
const rowBox = (i) => ({ x: G.x0, y: G.y0 + i * G.c, w: 4 * G.c, h: G.c });
const colBox = (j) => ({ x: G.x0 + j * G.c, y: G.y0, w: G.c, h: 4 * G.c });
function buildGrid(s, L, visible) {
  const cells = XS.map((_, i) => YS.map((_, j) => s.rect(G.x0 + j * G.c, G.y0 + i * G.c, G.c, G.c, { color: C.line, width: 2, visible })));
  const rowLabels = XS.map((x, i) => s.tex(x, { x: G.x0 - 30, y: cellBox(i, 0).cy, size: 34, color: C.blue, visible }));
  const colLabels = YS.map((y, j) => s.tex(String(y), { x: cellBox(0, j).cx, y: G.y0 - 28, size: 34, color: C.green, visible }));
  const xName = s.tex('x', { x: G.x0 - 30, y: G.y0 - 28, size: 32, color: C.blue, visible });
  const yName = s.tex('y', { x: G.x0 + 4 * G.c + 30, y: G.y0 - 28, size: 32, color: C.green, visible });
  const checks = {};
  XS.forEach((x, i) =>
    YS.forEach((y, j) => {
      if (L[x].includes(y)) checks[`${x}${y}`] = s.tex('\\checkmark', { x: cellBox(i, j).cx, y: cellBox(i, j).cy, size: 34, color: C.ink, visible });
    }),
  );
  return { cells, rowLabels, colLabels, xName, yName, checks, all: [...cells.flat(), ...rowLabels, ...colLabels, xName, yName] };
}

// ---------------------------------------------------------------- lecture

export default {
  id: 'nested-quantifiers',
  title: 'Nested quantifiers',
  goals: [
    'Read nested quantifiers left to right and see why $\\forall\\exists$ and $\\exists\\forall$ differ',
    'Negate multiply-quantified statements mechanically',
    'Prove a $\\forall x\\,\\exists y$ statement by choosing $y$ as a function of an arbitrary $x$',
    'Read the $\\varepsilon$–$N$ definition of a limit and the definition of an unbounded sequence',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'two-variables',
      title: 'Predicates with two variables',
      scene(s) {
        const g = buildGrid(s, L1, false);
        const name = s.tex('L(x, y)\\colon\\ \\checkmark \\text{ at } (x, y)', { x: 700, y: 100, size: 32, visible: false });
        const fAE = s.tex('\\forall x\\,\\exists y\\,L(x, y)', { x: 700, y: 230, size: 40, visible: false });
        const fEA = s.tex('\\exists y\\,\\forall x\\,L(x, y)', { x: 700, y: 390, size: 40, visible: false });
        const stAE = s.stamp(forallExists(L1) ? 'T' : 'F', { x: 700, y: 295, color: forallExists(L1) ? C.green : C.red, size: 34 });
        const stEA = s.stamp(existsForall(L1) ? 'T' : 'F', { x: 700, y: 455, color: existsForall(L1) ? C.green : C.red, size: 34 });
        const rowMarks = XS.map((x, i) => s.tex(YS.some((y) => L1[x].includes(y)) ? '\\checkmark' : '\\times', { x: G.x0 + 4 * G.c + 30, y: cellBox(i, 0).cy, size: 32, color: C.green, visible: false }));
        const colMarks = YS.map((y, j) => s.tex(XS.every((x) => L1[x].includes(y)) ? '\\checkmark' : '\\times', { x: cellBox(0, j).cx, y: G.y0 + 4 * G.c + 30, size: 32, color: C.red, visible: false }));
        return { g, name, fAE, fEA, stAE, stEA, rowMarks, colMarks };
      },
      steps: [
        {
          say: 'A predicate can have two variables. $L(x, y)${L of x, y} needs a row $x${x} and a column $y${y}; a check means it is true for that pair.',
          do: async (s, o) => {
            await s.all(o.g.all.map((m, i) => m.fadeIn({ shift: [0, 0], delay: i * 15 })));
            await s.stagger(Object.values(o.g.checks).map((m) => () => m.fadeIn({ shift: [0, -8] })), 150);
            await o.name.fadeIn();
          },
        },
        {
          say: 'For all $x${x} there exists $y${y}: every row needs at least one check. Row a has one, row b has two, row c has one, row d has two. True.',
          do: async (s, o) => {
            await o.fAE.write({ duration: 800 });
            o.scan = s.surround(rowBox(0), { color: C.green, pad: 4, visible: false });
            await o.scan.draw({ duration: 400 });
            for (let i = 0; i < 4; i++) {
              if (i) await o.scan.retarget(rowBox(i), { duration: 350 });
              await o.rowMarks[i].fadeIn({ shift: [-8, 0], duration: 300 });
            }
            await s.all(o.scan.fadeOut(), o.stAE.slam());
          },
        },
        {
          say: 'There exists $y${y} for all $x${x}: some single column must be full of checks. Column one fails, two fails, three, four. False.',
          do: async (s, o) => {
            await o.fEA.write({ duration: 800 });
            o.cscan = s.surround(colBox(0), { color: C.red, pad: 4, visible: false });
            await o.cscan.draw({ duration: 400 });
            for (let j = 0; j < 4; j++) {
              if (j) await o.cscan.retarget(colBox(j), { duration: 350 });
              await o.colMarks[j].fadeIn({ shift: [0, -8], duration: 300 });
            }
            await s.all(o.cscan.fadeOut(), o.stEA.slam());
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'order-matters',
      title: 'Order matters',
      scene(s) {
        const g = buildGrid(s, L1, true);
        const added = XS.flatMap((x, i) =>
          YS.flatMap((y, j) => (L2[x].includes(y) && !L1[x].includes(y) ? [s.tex('\\checkmark', { x: cellBox(i, j).cx, y: cellBox(i, j).cy, size: 34, color: C.yellow, visible: false })] : [])),
        );
        const fAE = s.tex('\\forall x\\,\\exists y\\,L(x, y)', { x: 700, y: 230, size: 40 });
        const fEA = s.tex('\\exists y\\,\\forall x\\,L(x, y)', { x: 700, y: 390, size: 40 });
        const stAE = s.stamp('T', { x: 700, y: 295, color: C.green, size: 34 });
        stAE.show();
        const stEA = s.stamp(existsForall(L1) ? 'T' : 'F', { x: 700, y: 455, color: C.red, size: 34 });
        stEA.show();
        const stEA2 = s.stamp(existsForall(L2) ? 'T' : 'F', { x: 700, y: 455, color: C.green, size: 34 });
        const dep = s.text('$y$ may depend on $x$', { x: 700, y: 120, size: 30, color: C.teal, visible: false });
        const imp = s.tex('\\exists y\\,\\forall x\\,L \\implies \\forall x\\,\\exists y\\,L', { x: 400, y: 505, size: 36, color: C.green, visible: false });
        const conv = s.tex('\\forall x\\,\\exists y\\,L \\implies \\exists y\\,\\forall x\\,L', { x: 400, y: 553, size: 30, color: C.red, visible: false });
        return { g, added, fAE, fEA, stAE, stEA, stEA2, dep, imp, conv };
      },
      steps: [
        {
          say: 'Now add two checks so that column two is full. There exists $y${y} for all $x${x} becomes true: one $y${y}, namely two, works for every row.',
          do: async (s, o) => {
            await s.stagger(o.added.map((m) => () => m.fadeIn({ shift: [0, -8] })), 250);
            o.col = s.surround(colBox(FULL_COL(L2)), { color: C.green, pad: 4, visible: false });
            await o.col.draw({ duration: 600 });
            await s.all(o.stEA.fadeOut(), o.stEA2.slam());
          },
        },
        {
          say: 'In for all $x${x} there exists $y${y}, the $y${y} is allowed to depend on $x${x}. Before we added checks, row a used column two, row b column one, row c column four.',
          do: async (s, o) => {
            await o.dep.fadeIn();
            o.picks = XS.map((x, i) => s.surround(cellBox(i, YS.indexOf(PICK[x])), { color: C.teal, pad: -4, visible: false }));
            await s.stagger(o.picks.map((r) => () => r.draw({ duration: 450 })), 350);
          },
        },
        {
          say: 'So one $y${y} for everyone gives a $y${y} for each, and there exists for all implies for all there exists. Never the other way in general: our first grid had a $y${y} for each row, but no single column.',
          do: async (s, o) => {
            await o.imp.write({ duration: 1000 });
            await o.conv.fadeIn();
            await s.strike(o.conv);
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'game',
      title: 'Quantifiers as a game',
      scene(s) {
        const f1 = s.tex('\\part{A}{\\forall x \\in \\mathbb{Z}}\\ \\part{E}{\\exists y \\in \\mathbb{Z}},\\ x + y = 0', { y: 55, size: 40, visible: false });
        const nl = s.numberLine({ x: 480, y: 290, width: 760, range: [-6, 6], size: 30, visible: false });
        const X = (v) => nl.x + nl.toX(v);
        const check1 = s.tex('4 + (-4) = 0', { x: 480, y: 375, size: 36, color: C.green, visible: false });
        const f2 = s.tex('\\part{E}{\\exists y \\in \\mathbb{Z}}\\ \\part{A}{\\forall x \\in \\mathbb{Z}},\\ x + y = 0', { x: 400, y: 455, size: 36, visible: false });
        paintParts(f2, { A: C.red, E: C.green });
        const st2 = s.stamp('F', { x: 760, y: 455, color: C.red, size: 34 });
        const check2 = s.tex('1 + (-4) = -3 \\ne 0', { x: 480, y: 530, size: 34, color: C.red, visible: false });
        return { f1, nl, X, check1, f2, st2, check2 };
      },
      steps: [
        {
          say: 'Read nested quantifiers left to right as a game. “For all” is your opponent’s move, “there exists” is yours, and you win if the final statement is true.',
          do: async (s, o) => {
            await o.f1.write({ duration: 900 });
            await s.all(o.f1.color('A', C.red), o.f1.color('E', C.green));
            const a = o.f1.partBox('A');
            const e = o.f1.partBox('E');
            o.opp = s.text('opponent', { x: a.cx, y: a.y + a.h + 26, size: 30, color: C.red, weight: 600, visible: false });
            o.you = s.text('you', { x: e.cx, y: e.y + e.h + 26, size: 30, color: C.green, weight: 600, visible: false });
            await s.all(o.opp.fadeIn(), o.you.fadeIn({ delay: 200 }));
            await o.nl.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'Your opponent picks $x = 4${x equals four}. You move second, so you can use it: answer $y = -4${y equals minus four}, and $x + y = 0${x plus y equals zero}. You win.',
          do: async (s, o) => {
            o.px = o.nl.point(4, { color: 'red', label: 'x' });
            await o.px;
            const y0 = o.nl.y - 16;
            o.arc = s.path(`M${o.X(4)} ${y0} Q480 ${y0 - 150} ${o.X(-4)} ${y0}`, { color: C.green, width: 3, dash: true, visible: false });
            await o.arc.draw({ duration: 800 });
            o.py = o.nl.point(-4, { color: 'green', label: 'y' });
            await o.py;
            await o.check1.fadeIn();
          },
        },
        {
          say: 'Whatever $x${x} they pick, you answer $y = -x${y equals minus x}. Your move depends on theirs, and that is allowed.',
          do: async (s, o) => {
            await o.arc.fadeOut();
            await s.all(o.px.moveTo(-2), o.py.moveTo(2), o.check1.swap('-2 + 2 = 0'));
          },
        },
        {
          say: 'Now swap the quantifiers. You must commit to $y${y} first, say minus four, and then the opponent picks $x = 1${x equals one}. One plus minus four is not zero, and the opponent always has such a reply. This statement is false.',
          do: async (s, o) => {
            await o.f2.write({ duration: 900 });
            await o.py.moveTo(-4);
            await o.px.moveTo(1);
            await o.check2.fadeIn();
            await o.st2.slam();
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-order',
      kind: 'try',
      title: 'True over the reals?',
      say: 'Your turn. Play the game for each statement: who moves first, and can the second player always win?',
      prompt: 'The domain is $\\mathbb{R}$. Which are true? Select all.',
      answer: { type: 'multi', value: ['a', 'd'] },
      choices: [
        { id: 'a', label: '$\\forall x\\,\\exists y,\\ y > x$', why: 'True: given $x$, answer $y = x + 1$.' },
        { id: 'b', label: '$\\exists y\\,\\forall x,\\ y > x$', why: 'False: there is no largest real. Whatever $y$ you commit to, the opponent plays $x = y$.' },
        { id: 'c', label: '$\\forall x\\,\\exists y,\\ xy = 1$', why: 'False: the opponent plays $x = 0$, and $0 \\cdot y = 0 \\ne 1$ for every $y$.' },
        { id: 'd', label: '$\\exists x\\,\\forall y,\\ xy = 0$', why: 'True: commit to $x = 0$; then $0 \\cdot y = 0$ for every $y$.' },
      ],
      hint: 'Play the game: who moves first? Can the player who moves second always respond?',
      solution: [
        '(a) True: for any $x$, take $y = x + 1 > x$.',
        '(b) False: its negation $\\forall y\\,\\exists x,\\ y \\le x$ holds with $x = y$.',
        '(c) False: $x = 0$ has no partner, since $0 \\cdot y = 0$.',
        '(d) True: $x = 0$ works for every $y$.',
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'negate-nested',
      title: 'Negating nested quantifiers',
      scene(s) {
        const gap = 12;
        const size = 48;
        const y = 110;
        const live = s.symbols(['\\neg', '\\forall x', '\\exists y', '\\forall z', 'P(x, y, z)'], { y, size, gap, visible: false });
        const stages = [
          ['\\exists x', '\\neg', '\\exists y', '\\forall z', 'P(x, y, z)'],
          ['\\exists x', '\\forall y', '\\neg', '\\forall z', 'P(x, y, z)'],
          ['\\exists x', '\\forall y', '\\exists z', '\\neg', 'P(x, y, z)'],
        ].map((list) => s.symbols(list, { y, size, gap, visible: false }));
        const ghost = s.tex('\\neg\\,\\forall x\\,\\exists y\\,\\forall z\\,P(x, y, z) \\;\\equiv', { y: 50, size: 30, color: C.muted, visible: false });
        const dom = [
          s.tex('\\neg\\,\\forall x \\in \\part{a}{A}\\ \\exists y \\in \\part{b}{B},\\ P(x, y)', { y: 225, size: 34, visible: false }),
          s.tex('\\equiv\\ \\exists x \\in \\part{a}{A}\\ \\forall y \\in \\part{b}{B},\\ \\neg P(x, y)', { y: 285, size: 34, visible: false }),
        ];
        const inner = [
          '\\neg(a < b) \\;\\equiv\\; a \\ge b',
          '\\neg(p \\land q) \\;\\equiv\\; \\neg p \\lor \\neg q',
          '\\neg(p \\to q) \\;\\equiv\\; p \\land \\neg q',
        ].map((t, i) => s.tex(t, { y: 385 + i * 62, size: 34, visible: false }));
        return { live, stages, ghost, dom, inner };
      },
      steps: [
        {
          say: 'Same rule as before, applied again and again. Not, for all $x${x}, there exists $y${y}, for all $z${z}. The not passes the first quantifier, and it flips to “there exists”.',
          do: async (s, o) => {
            await s.all(o.live.map((m, i) => m.fadeIn({ delay: i * 90 })));
            await pass(s, o, 0);
          },
        },
        {
          say: 'Then it passes “there exists $y${y}”, which becomes “for all $y${y}”, and “for all $z${z}”, which becomes “there exists $z${z}”. Every quantifier it passes flips.',
          do: async (s, o) => {
            await pass(s, o, 1);
            await pass(s, o, 2);
            await o.ghost.fadeIn();
          },
        },
        {
          say: 'Domains ride along unchanged: “in $A${A}” and “in $B${B}” stay exactly where they were. Only the quantifier symbols flip.',
          do: async (s, o) => {
            for (const d of o.dom) await d.write({ duration: 800 });
            await s.all(o.dom.flatMap((d) => ['a', 'b'].map((p) => s.ring([d, p], { color: C.yellow, shape: 'box', pad: 3 }))));
          },
        },
        {
          say: 'Finally negate the inside carefully: “less than” becomes “greater than or equal”, “and” becomes “or”, and an arrow becomes “and not”.',
          do: (s, o) => s.stagger(o.inner.map((m) => () => m.fadeIn({ shift: [0, 10] })), 600),
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-nested-neg',
      kind: 'blanks',
      title: 'Negate it',
      say: 'Negate this one, from left to right. It is the shape of the definition of continuity, so it is worth getting right.',
      prompt: 'Complete the negation, with the $\\neg$ pushed all the way in.',
      lines: [
        ['\\neg\\big(\\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall x,\\ (\\lvert x \\rvert < \\delta \\to \\lvert f(x) \\rvert < \\varepsilon)\\big) \\equiv'],
        [
          { id: 'q1', chips: ['\\forall', '\\exists'], answer: '\\exists' },
          '\\varepsilon > 0',
          { id: 'q2', chips: ['\\forall', '\\exists'], answer: '\\forall', hint: 'Every quantifier the $\\neg$ passes flips, not only the first.' },
          '\\delta > 0',
          { id: 'q3', chips: ['\\forall', '\\exists'], answer: '\\exists' },
          'x,\\ \\lvert x \\rvert < \\delta',
          { id: 'op', chips: ['\\land', '\\lor', '\\to'], answer: '\\land', hint: '$\\neg(p \\to q) \\equiv p \\land \\neg q$.' },
          '\\lvert f(x) \\rvert',
          { id: 'rel', chips: ['\\ge', '>', '<'], answer: '\\ge', hint: 'The opposite of $<$ is $\\ge$, not $>$.' },
          '\\varepsilon',
        ],
      ],
      solution: [
        'Flip all three quantifiers; the restrictions $\\varepsilon > 0$ and $\\delta > 0$ stay as they are.',
        'Negate the conditional: $\\neg(p \\to q) \\equiv p \\land \\neg q$, and $\\neg(\\lvert f(x) \\rvert < \\varepsilon)$ is $\\lvert f(x) \\rvert \\ge \\varepsilon$.',
        '$$\\exists \\varepsilon > 0\\ \\forall \\delta > 0\\ \\exists x,\\ \\lvert x \\rvert < \\delta \\land \\lvert f(x) \\rvert \\ge \\varepsilon.$$',
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'prove-forall-exists',
      title: 'Proving “for all, there exists”',
      scene(s) {
        const thm = s.tex('\\textbf{Theorem.}\\ \\forall x \\in \\mathbb{R}\\ \\exists y \\in \\mathbb{R},\\ 2y + 3 = x', { y: 52, size: 34, visible: false });
        const pad = s.scratch({ x: 230, y: 90, w: 500, h: 300, title: 'scratch', size: 36, visible: false });
        const strip = s.tex('\\text{scratch: } y = (x - 3)/2', { y: 101, size: 30, color: C.muted, visible: false });
        const p = s.proof({ x: 480, y: 125, width: 860, size: 30, height: 395, visible: false });
        const moral = s.text('The check makes it a proof; the solving is only how we found $y$.', { y: 548, size: 30, color: C.muted, visible: false });
        return { thm, pad, strip, p, moral };
      },
      steps: [
        {
          say: 'To prove for every real $x${x} there is a $y${y} with $2y + 3 = x${two y plus three equals x}, first find $y${y} on scratch paper: solve for it. This is not the proof yet.',
          do: async (s, o) => {
            await o.thm.write({ duration: 900 });
            await o.pad.reveal();
            await o.pad.add('2y + 3 = x', { color: 'green', tex: true });
            await o.pad.add('2y = x - 3', { tex: true });
            o.found = o.pad.add('y = (x - 3)/2', { color: 'yellow', tex: true });
            await o.found;
          },
        },
        {
          say: 'The proof fixes an arbitrary $x${x}; we don’t get to choose it. Then it names $y${y} in terms of $x${x}, using what the scratch work found.',
          do: async (s, o) => {
            await s.all(o.pad.fadeOut({ shift: [-30, 0] }), o.strip.fadeIn({ delay: 200 }));
            o.p.show();
            await o.p.add('**Proof.** Let $x \\in \\mathbb{R}$.', { kind: 'assume', why: 'arbitrary $x$' });
            o.letY = o.p.add('Let $y = (x - 3)/2$.', { why: 'from scratch work' });
            await o.letY;
            await s.all(o.p.highlight(o.letY, 'yellow'), o.strip.indicate({ color: C.yellow }));
          },
        },
        {
          say: 'Now check it: $y${y} is a real number, and $2y + 3${two y plus three} works out to exactly $x${x}. The check is what makes it a proof; the solving is only how we found $y${y}.',
          do: async (s, o) => {
            await o.p.unhighlight(o.letY);
            await o.p.add('Then $y \\in \\mathbb{R}$', { why: 'real arithmetic' });
            await o.p.add('and $2y + 3 = (x - 3) + 3 = x$.', { why: 'algebra' });
            await o.p.add('Therefore $2y + 3 = x$ for some $y \\in \\mathbb{R}$, and $x$ was arbitrary.', { kind: 'conclude', why: 'the theorem' });
            await o.p.qed();
            await o.moral.fadeIn();
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'arbitrary',
      title: 'Arbitrary versus specific',
      scene(s) {
        const claim = s.tex('\\textbf{Claim.}\\ \\forall x \\in \\mathbb{R},\\ x^2 - 2x + 1 \\ge 0', { y: 56, size: 36, visible: false });
        const line = (str, y, width) => s.text(str, { x: 60, y, size: 30, anchor: [0, 0.5], width, align: 'left', visible: false });
        const a1 = line(`Take $x = 3$: $3^2 - 2 \\cdot 3 + 1 = ${quad(3)} \\ge 0$.`, 145);
        const a2 = line(`For $x = 0, 1, 2$: values $${[0, 1, 2].map(quad).join(', ')}$, all $\\ge 0$.`, 255);
        const a3 = line('Let $x \\in \\mathbb{R}$. Then $x^2 - 2x + 1 = (x - 1)^2 \\ge 0$, since squares of real numbers are $\\ge 0$.', 375, 680);
        const s1 = s.stamp('one example', { x: 795, y: 145, color: C.red, size: 30 });
        const s2 = s.stamp('three cases', { x: 795, y: 255, color: C.red, size: 30 });
        const s3 = s.stamp('proof', { x: 795, y: 375, color: C.green, size: 30 });
        const rule = s.text('A $\\forall$ variable is handed to you; an $\\exists$ variable is yours to choose.', { y: 510, size: 30, color: C.blue, weight: 600, visible: false });
        return { claim, a1, a2, a3, s1, s2, s3, rule };
      },
      steps: [
        {
          say: '“Let $x${x} be arbitrary” means you may not choose $x${x}: the argument must work for every $x${x} at once. Taking $x = 3${x equals three} proves nothing about the others.',
          do: async (s, o) => {
            await o.claim.write({ duration: 900 });
            await o.a1.fadeIn();
            await s.strike(o.a1);
            await o.s1.slam();
          },
        },
        {
          say: 'Checking three cases is better evidence, but it is still evidence, not proof. Infinitely many real numbers were never checked.',
          do: async (s, o) => {
            await o.a2.fadeIn();
            await s.strike(o.a2);
            await o.s2.slam();
          },
        },
        {
          say: 'A proof lets $x${x} be any real number and argues for all of them at once: the expression is $(x - 1)^2${x minus one, squared}, and squares are never negative.',
          do: async (s, o) => {
            await o.a3.fadeIn();
            await o.a3.recolor(C.green);
            await o.s3.slam();
          },
        },
        {
          say: 'So the rule is: a “for all” variable is handed to you, and the existential variable is the one you choose.',
          do: (s, o) => o.rule.fadeIn({ shift: [0, 12] }),
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'try-which-proof',
      kind: 'try',
      title: 'Which proof is valid?',
      say: 'Which of these is a valid proof? Think about which variable has to be chosen first.',
      prompt: 'Claim: $\\exists M \\in \\mathbb{R}\\ \\forall x \\in \\mathbb{R},\\ \\sin x \\le M$. Which is a valid proof?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '“Let $M = 1$. Let $x \\in \\mathbb{R}$. Then $\\sin x \\le 1 = M$.”', why: 'Right: $M$ is chosen first, without mentioning $x$, and then it works for an arbitrary $x$.' },
        { id: 'b', label: '“Let $x \\in \\mathbb{R}$ and let $M = \\sin x$. Then $\\sin x \\le M$.”', why: '$M$ depends on $x$: this proves $\\forall x\\,\\exists M$, the weaker statement.' },
        { id: 'c', label: '“Take $x = 0$: $\\sin 0 = 0 \\le 1$.”', why: 'This checks one $x$; the claim is about every $x$.' },
        { id: 'd', label: '“Since $\\sin$ is bounded, such an $M$ exists.”', why: 'This restates the claim instead of proving it.' },
      ],
      hint: 'In $\\exists M\\,\\forall x$, which variable is chosen first?',
      solution: [
        'In $\\exists M\\,\\forall x$, $M$ is fixed before $x$ appears, so it cannot mention $x$.',
        '(a) chooses $M = 1$ first, then lets $x$ be arbitrary and uses $\\sin x \\le 1$. That is a complete proof.',
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'limit-preview',
      title: 'Reading an $\\varepsilon$–$N$ definition',
      scene(s) {
        const f = s.tex('\\forall \\part{e}{\\varepsilon > 0}\\ \\exists \\part{N}{N \\in \\mathbb{N}}\\ \\forall n \\ge N,\\ \\lvert a_n - L \\rvert < \\varepsilon', { y: 55, size: 38, visible: false });
        const sub = s.tex('a_n = 1/n, \\quad L = 0', { y: 120, size: 32, color: C.muted, visible: false });
        const nl = s.numberLine({
          x: 480,
          y: 380,
          width: 800,
          range: [-0.2, 1.1],
          ticks: 0.1,
          labels: (v) => (Math.abs(v) < 1e-9 ? '0' : Math.abs(v - 0.5) < 1e-9 ? '0.5' : Math.abs(v - 1) < 1e-9 ? '1' : null),
          size: 30,
          visible: false,
        });
        const inside = s.text(`from $n = ${NS[0]}$ on, every term is inside the band`, { y: 480, size: 30, color: C.green, visible: false });
        const later = s.text('We will prove statements like this in the last lecture.', { y: 545, size: 30, color: C.muted, visible: false });
        const nTex = s.tex(`\\text{cutoff: } N = ${NS[0]}`, { x: 720, y: 230, size: 36, color: C.green, visible: false });
        return { f, sub, nl, inside, later, nTex };
      },
      steps: [
        {
          say: 'Here is how a limit is defined. Read it as a game: the opponent names a tolerance $\\varepsilon${epsilon}, say $0.15${zero point one five}, a band around the limit zero.',
          do: async (s, o) => {
            await o.f.write({ duration: 1100 });
            await s.all(o.f.color('e', C.red), o.f.color('N', C.green));
            await o.sub.fadeIn();
            await o.nl.fadeIn({ shift: [0, 0] });
            o.seq = o.nl.sequence((n) => 1 / n, SEQ_N, { gap: 60 });
            await o.seq;
            o.band = o.nl.band(0, EPS[0], { color: 'red' });
            await o.band.done;
          },
        },
        {
          say: 'You answer with a cutoff $N${N}, which may depend on $\\varepsilon${epsilon}. Here $N = 7${N equals seven} works: one seventh is already inside the band.',
          do: async (s, o) => {
            o.mk = o.nl.marker(1 / NS[0], { color: 'green' });
            await s.all(o.mk, o.nTex.fadeIn({ shift: [-12, 0] }));
          },
        },
        {
          say: 'The final clause demands that every term from $N${N} on is inside the band, not just one of them. Here they all are.',
          do: async (s, o) => {
            await paint(s.clock, o.seq.dots.slice(NS[0] - 1), { fill: C.green, opacity: 1 });
            await o.inside.fadeIn();
          },
        },
        {
          say: 'A smaller $\\varepsilon${epsilon} is a harder challenge, so you need a later cutoff: for $0.05${zero point zero five}, $N = 21${N equals twenty one}. We will prove statements like this in the last lecture.',
          do: async (s, o) => {
            await o.band.to(EPS[1], { duration: 900 });
            await paint(s.clock, o.seq.dots.slice(NS[0] - 1, NS[1] - 1), { fill: null, opacity: 0.45 });
            await s.all(o.mk.moveTo(1 / NS[1]), o.nTex.swap(`\\text{cutoff: } N = ${NS[1]}`));
            await o.inside.fadeOut();
            o.inside.setText(`from $n = ${NS[1]}$ on, every term is inside the band`);
            await o.inside.fadeIn();
            await o.later.fadeIn();
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'unbounded',
      title: 'What “unbounded” means',
      scene(s) {
        const gap = 14;
        const size = 36;
        const B = ['\\exists M \\in \\mathbb{R}', '\\forall n \\in \\mathbb{N},', '\\lvert a_n \\rvert', '\\le', 'M'];
        const bounded = s.symbols(B, { x: 610, y: 70, size, gap, visible: false });
        const moving = s.symbols(B, { x: 610, y: 70, size, gap, visible: false });
        const target = s.symbols(['\\forall M \\in \\mathbb{R}', '\\exists n \\in \\mathbb{N},', '\\lvert a_n \\rvert', '>', 'M'], { x: 610, y: 160, size, gap, visible: false });
        const bL = s.text('bounded:', { x: 270, y: 70, size: 32, anchor: [1, 0.5], color: C.blue, weight: 600, visible: false });
        const uL = s.text('unbounded:', { x: 270, y: 160, size: 32, anchor: [1, 0.5], color: C.red, weight: 600, visible: false });
        const nl = s.numberLine({ x: 480, y: 360, width: 760, range: [0, 9], size: 30, visible: false });
        const rule = s.text('Given $M \\in \\mathbb{R}$, pick $n \\in \\mathbb{N}$ with $n > M$: then $\\lvert a_n \\rvert = n > M$.', { y: 470, size: 30, color: C.green, visible: false });
        const seqNote = s.tex('a_n = n', { x: 120, y: 280, size: 34, color: C.blue, visible: false });
        return { bounded, moving, target, bL, uL, nl, rule, seqNote };
      },
      steps: [
        {
          say: 'A sequence is bounded if there is one $M${M} with every term at most $M${M} in absolute value. Negate it mechanically: each quantifier flips, and “at most” becomes “greater than”.',
          do: async (s, o) => {
            await o.bL.fadeIn();
            await s.all(o.bounded.map((m, i) => m.fadeIn({ delay: i * 80 })));
            o.moving.forEach((m) => m.show());
            await o.uL.fadeIn();
            await s.all(o.moving.map((m, i) => m.moveTo(o.target[i].x, o.target[i].y, { duration: 800, delay: i * 60 })));
            await s.all([0, 1, 3].map((i) => o.moving[i].swap(o.target[i].latex)));
            await s.all([0, 1, 3].map((i) => o.moving[i].recolor(C.yellow)));
          },
        },
        {
          say: 'So unbounded means: whatever bound you propose, some term beats it. Take $a_n = n${a n equals n}. The opponent proposes $M = 4.5${M equals four point five}; you answer $n = 5${n equals five}.',
          do: async (s, o) => {
            await s.all(o.nl.fadeIn({ shift: [0, 0] }), o.seqNote.fadeIn());
            o.seq = o.nl.sequence((n) => n, 9, { trail: false, gap: 120 });
            await o.seq;
            o.M = o.nl.marker(4.5, { label: 'M', color: 'red' });
            await o.M;
            o.n = o.nl.point(5, { color: 'green', label: 'n' });
            await o.n;
          },
        },
        {
          say: 'In general, given any real $M${M}, choose a natural number $n${n} bigger than $M${M}. Move the bound to seven and a half, and eight beats it.',
          do: async (s, o) => {
            await o.rule.fadeIn();
            await o.M.moveTo(7.5);
            await o.n.moveTo(8);
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-nested',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Two parts: prove a “for all, there exists” statement, then show that the swapped statement is false.',
      prompt: '(a) Prove $\\forall x \\in \\mathbb{Z}\\ \\exists y \\in \\mathbb{Z},\\ x + y$ is odd.\n\n(b) Prove that $\\exists y \\in \\mathbb{Z}\\ \\forall x \\in \\mathbb{Z},\\ x + y$ is odd is false.',
      answer: { type: 'proof' },
      hints: ['For (a), let $y$ depend on $x$.', 'For (b), write the negation and prove it: the opponent now answers your $y$.'],
      solution: [
        '**Proof.** (a) Let $x \\in \\mathbb{Z}$ and let $y = x + 1$, which is an integer. Then $x + y = 2x + 1$, which is odd by definition, since $x \\in \\mathbb{Z}$.',
        '(b) The negation is $\\forall y \\in \\mathbb{Z}\\ \\exists x \\in \\mathbb{Z},\\ x + y$ is even. Let $y \\in \\mathbb{Z}$ and take $x = y$. Then $x + y = 2y$ is even, so it is not odd (no integer is both even and odd). Hence the negation is true, and the statement in (b) is false. ∎',
      ],
      rubric: [
        '(a) Fixes an arbitrary $x$ and gives $y$ explicitly as an integer.',
        '(a) Verifies oddness from the definition: $x + y = 2k + 1$ with $k \\in \\mathbb{Z}$.',
        '(b) Negates correctly: both quantifiers flipped, “odd” negated to “not odd” (even).',
        '(b) Proves the negation for an arbitrary $y$ with an explicit $x$.',
        'Uses that no integer is both even and odd (justified later by the division algorithm), or argues directly.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-order',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain the order of quantifiers back to me in your own words.',
      prompt: 'Explain why $\\exists y\\,\\forall x\\,P(x, y)$ implies $\\forall x\\,\\exists y\\,P(x, y)$ but not conversely.',
      points: [
        'In $\\exists y\\,\\forall x$ one single $y$ works for every $x$.',
        'In $\\forall x\\,\\exists y$ the $y$ may change with $x$.',
        'Given the single $y$, it serves as the witness for each $x$, so the implication holds.',
        'The converse fails, for example with $x + y = 0$ over $\\mathbb{Z}$: each $x$ has a partner $-x$, but no one $y$ works for all $x$.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Read quantifiers left to right, as a game; the order changes the meaning.', 120),
          recapItem(s, '• Negate by flipping every quantifier the $\\neg$ passes, then negate the inside.', 230),
          recapItem(s, '• Prove $\\forall x\\,\\exists y$: let $x$ be arbitrary, take $y$ in terms of $x$, check.', 340),
          recapItem(s, 'Next: how the steps of a proof are allowed to follow from each other.', 470, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'Read quantifiers left to right, as a game between you and an opponent. The order changes the meaning.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Negate by flipping every quantifier the not passes, then negate the inside carefully.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Prove a “for all, there exists” statement in three moves: let $x${x} be arbitrary, take $y${y} in terms of $x${x}, and check.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: valid arguments, and how the steps of a proof are allowed to follow from each other.',
          do: (s, o) => o.items[3].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};

/** One pass of the ¬ through quantifier k (0-based) of the negate-nested prefix. */
async function pass(s, o, k) {
  const [neg, ...qs] = o.live;
  const target = o.stages[k];
  // order at stage k: q0'..qk', ¬, q(k+1).., P
  const pos = (piece) => {
    if (piece === neg) return k + 1;
    const i = qs.indexOf(piece);
    return i <= k ? i : i + 1;
  };
  const flipped = { 0: '\\exists x', 1: '\\forall y', 2: '\\exists z' }[k];
  await neg.recolor(C.yellow);
  await s.all(o.live.map((m) => m.moveTo(target[pos(m)].x, target[pos(m)].y, { duration: 800 })));
  await qs[k].swap(flipped);
  await s.all(qs[k].recolor(C.yellow), neg.recolor(C.ink, { delay: 200 }));
}
