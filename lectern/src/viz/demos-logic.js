/**
 * #/kit demos for the Foundations components (viz/logic.js, viz/sets.js): one demo per component, whose steps run
 * every animation it has, ending on a meaningful (non-empty) state. Default export:
 * [{ title, scene(s) → refs, steps: [{ say, do(s, refs) }] }].
 */

export default [
  {
    title: 'Truth table',
    scene(s) {
      const t = s.truthTable({
        y: 300,
        vars: ['P', 'Q'],
        cols: [
          { tex: 'P\\land Q', fn: (v) => v.P && v.Q },
          { tex: 'P\\lor Q', fn: (v) => v.P || v.Q },
          { tex: 'P\\Rightarrow Q', fn: (v) => !v.P || v.Q },
        ],
      });
      return { t };
    },
    steps: [
      { say: 'The rows list every combination, true true first.', do: (s, o) => o.t.fillColumn('P\\land Q') },
      { say: 'Or is true when at least one side is.', do: (s, o) => o.t.revealCol(3) },
      { say: 'Reveal one row of the conditional, then the rest.', do: async (s, o) => { await o.t.revealRow(0); await o.t.revealAll(); } },
      { say: 'The conditional is false in exactly one row.', do: (s, o) => s.all(o.t.highlightCol(4, 'blue'), o.t.highlightRows((v) => v.P && !v.Q, 'red')) },
      { say: 'Mark the rows where it holds.', do: (s, o) => s.all([0, 2, 3].map((i) => o.t.markRow(i, '✓')), o.t.markRow(1, '✗')) },
      { say: 'Clear the marks, then highlight the rows where both sides agree.', do: async (s, o) => { await o.t.clear(); await o.t.highlightRows((v) => v.P === v.Q, 'green'); } },
      { say: 'One cell, circled by its box.', do: async (s, o) => { await o.t.highlightCell(1, 4, 'red'); await s.ring(o.t.cellBox(1, 4), { color: 'red' }); } },
    ],
  },
  {
    title: 'Two-column proof',
    scene(s) {
      const p = s.proof({ y: 40, height: 520 });
      return { p };
    },
    steps: [
      { say: 'Assume the hypothesis.', do: (s, o) => o.p.add('Suppose $n$ is even.', { kind: 'assume', why: 'hypothesis' }) },
      {
        say: 'Unpack the definition.',
        do: async (s, o) => {
          o.l2 = o.p.add('n = 2k \\text{ for some } k \\in \\mathbb{Z}', { why: 'definition of even' });
          await o.l2;
          await o.p.note(o.l2, 'this $k$ is what we work with');
        },
      },
      {
        say: 'A wrong turn gets struck out.',
        do: async (s, o) => {
          o.bad = o.p.add('n^2 = 2k^2', { why: 'square both sides', indent: 1 });
          await o.bad;
          await o.p.strike(o.bad);
        },
      },
      {
        say: 'The right computation.',
        do: async (s, o) => {
          await o.p.add('n^2 = 4k^2 = 2(2k^2)', { why: 'algebra', indent: 1 });
          await o.p.highlight(-1);
        },
      },
      {
        say: 'More lines than fit: the window follows the newest line.',
        do: async (s, o) => {
          await o.p.add('2k^2 \\in \\mathbb{Z}', { why: 'closed under products' });
          await o.p.add('Then $n^2$ is twice an integer.', { why: 'line 4' });
          await o.p.add('Suppose instead $n^2$ were odd.', { kind: 'assume', why: 'for contradiction' });
          await o.p.add('n^2 = 2m + 1', { kind: 'contradiction', why: 'parity' });
        },
      },
      { say: 'Scroll back to the top, then to the end.', do: async (s, o) => { await o.p.scrollTo(0); await s.wait(400); await o.p.scrollTo('end'); } },
      {
        say: 'Conclude and close the proof.',
        do: async (s, o) => {
          await o.p.add('Therefore $n^2$ is even.', { kind: 'conclude', why: 'definition of even' });
          await o.p.qed();
        },
      },
      {
        say: 'Clear it and start a skeleton: first line, dots, last line.',
        do: async (s, o) => {
          await o.p.clear();
          o.first = o.p.add('Suppose $x > 0$.', { kind: 'assume', why: 'hypothesis' });
          await o.first;
          o.dots = o.p.add('$\\vdots$', { numbered: false });
          await o.dots;
          await o.p.add('Therefore $x + \\tfrac{1}{x} \\ge 2$.', { kind: 'conclude', why: 'the goal' });
        },
      },
      {
        say: 'Fill in the middle; the lines below make room and renumber.',
        do: async (s, o) => {
          o.mid = o.p.insertAfter(o.first, '$(x - 1)^2 \\ge 0$', { why: 'squares are nonnegative' });
          await o.mid;
          await o.p.insertAfter(o.mid, '$x^2 + 1 \\ge 2x$', { why: 'expand' });
          await o.p.replace(o.dots, 'Divide by $x > 0$: $x + \\tfrac{1}{x} \\ge 2$.', { why: 'line 1', numbered: true });
        },
      },
      { say: 'A redundant line can also go away.', do: async (s, o) => { const extra = o.p.insertAfter(o.mid, '$x \\ne 0$', { why: 'redundant' }); await extra; await o.p.removeLine(extra); await o.p.qed(); } },
    ],
  },
  {
    title: 'Cards, stamps, scratch work',
    scene(s) {
      const def = s.defCard({ y: 70, body: 'An integer $n$ is **even** if $n = 2k$ for $\\part{ex}{\\text{some } k \\in \\mathbb{Z}}$.', visible: false });
      const thm = s.defCard({ x: 250, y: 205, width: 440, kind: 'theorem', tex: '\\text{If } n \\text{ is odd, then } \\part{sq}{n^2} \\text{ is odd.}', size: 28, visible: false });
      const warn = s.defCard({ x: 715, y: 205, width: 400, kind: 'warning', title: 'Not a proof', body: 'Checking $n = 1, 3, 5$ proves nothing.', size: 28, visible: false });
      const stamp = s.stamp('not a proof', { x: 760, y: 330 });
      const pad = s.scratch({ x: 30, y: 290, w: 500, h: 290, visible: false });
      const sym = s.symbols(['\\neg', '(', 'P', '\\land', 'Q', ')'], { x: 760, y: 450, size: 48, visible: false });
      return { def, thm, warn, stamp, pad, sym };
    },
    steps: [
      { say: 'Definition, theorem and warning cards.', do: (s, o) => s.all(o.def.reveal(), o.thm.reveal({ delay: 300 }), o.warn.reveal({ delay: 600 })) },
      { say: 'Circle a part, box another.', do: (s, o) => s.all(s.ring([o.def, 'ex'], { color: 'blue' }), s.ring([o.thm, 'sq'], { color: 'red', shape: 'box' }), o.def.color('ex', 'blue')) },
      { say: 'Strike out the warning and stamp it.', do: async (s, o) => { await s.strike(o.warn); await o.stamp.slam(); } },
      {
        say: 'Scratch work goes in its own pane.',
        do: async (s, o) => {
          await o.pad.reveal();
          await o.pad.add('n = 2k + 1', { color: 'blue' });
          await o.pad.add('n^2 = 4k^2 + 4k + 1', { color: 'blue' });
          await o.pad.add('want: $n^2 = 2m + 1$', { color: 'green' });
          await o.pad.retitle('Scratch, not proof');
        },
      },
      { say: 'Symbols in a row move one by one.', do: async (s, o) => { await o.sym.group.fadeIn(); await s.ring(o.sym[3]); await s.all(o.sym[0].shift(0, 60), o.sym[3].indicate()); } },
    ],
  },
  {
    title: 'Implication chain',
    scene(s) {
      const chain = s.implication({ y: 220, items: ['P', 'Q', 'R'] });
      const pair = s.implication({ y: 400, items: ['n^2 \\text{ even}', 'n \\text{ even}'] });
      return { chain, pair };
    },
    steps: [
      { say: 'Each arrow lights in turn.', do: async (s, o) => { await o.chain.step(0); await o.chain.step(1); await o.pair.step(0); } },
      { say: 'Turn them around and back.', do: async (s, o) => { await o.chain.reverse(); await o.chain.reverse(); } },
      { say: 'The converse turns every arrow around.', do: (s, o) => s.all(o.chain.reverse(), o.pair.reverse()) },
      { say: 'Negating both sides of the converse gives the contrapositive.', do: (s, o) => s.all(o.chain.negateAll(), o.pair.negateAll()) },
      { say: 'Unlight the arrows.', do: (s, o) => s.all(o.chain.clear(), o.pair.clear()) },
    ],
  },
  {
    title: 'Venn diagram',
    scene(s) {
      const two = s.venn({ x: 250, y: 300, sets: ['A', 'B'], r: 110 });
      const three = s.venn({ x: 710, y: 300, sets: 3, r: 92 });
      return { two, three };
    },
    steps: [
      { say: 'Shade the intersection.', do: (s, o) => o.two.shade('A&B') },
      { say: 'Change it to the union, in green.', do: async (s, o) => { await o.two.unshade('A&B'); await o.two.shade(o.two.union('A', 'B'), { color: 'green' }); } },
      { say: 'Outside both sets.', do: async (s, o) => { await o.two.clearShade(); await o.two.shade('!A&!B', { color: 'orange' }); } },
      { say: 'Drop elements into regions.', do: (s, o) => s.all(o.two.element('A&!B', '1'), o.two.element('A&B', '2'), o.two.element('B&!A', '3'), o.two.element('!A&!B', '4')) },
      { say: 'Three sets: one region at a time.', do: (s, o) => s.all(o.three.shade('A&B&!C', { color: 'purple' }), o.three.shade(o.three.minus('C', o.three.union('A', 'B')), { color: 'teal' })) },
      { say: 'Outline a set, then the universe.', do: async (s, o) => { await o.three.outline('C', 'red'); await o.three.outline('U', 'blue'); await o.three.outline('C', null); } },
      {
        say: 'Start over: the symmetric difference, and the middle.',
        do: async (s, o) => {
          await s.all(o.two.clearShade(), o.three.clearShade(), o.three.outline('U', null));
          await s.all(o.two.shade(o.two.symdiff('A', 'B')), o.three.shade('A&B&C', { color: 'orange' }));
          await s.all(o.three.count('A&B&C', 3), o.three.count('A&!B&!C', 12), o.three.count('!A&!B&!C', 5, { color: 'muted' }));
        },
      },
    ],
  },
  {
    title: 'Function arrow diagram',
    scene(s) {
      const f = s.mapDiagram({ y: 320, domain: ['1', '2', '3'], codomain: ['a', 'b', 'c', 'd'], arrows: [[0, 0], [1, 2]], labels: ['A', 'B'], name: 'f' });
      return { f };
    },
    steps: [
      { say: 'Every element of the domain needs an arrow.', do: (s, o) => o.f.addArrow(2, 2) },
      { say: 'Two arrows land on the same element: not injective.', do: (s, o) => o.f.showCollision() },
      { say: 'And nothing reaches some elements: not surjective.', do: (s, o) => o.f.showMissed() },
      { say: 'Fix it.', do: async (s, o) => { await o.f.clear(); await o.f.removeArrow(2, 2); await o.f.addArrow(2, 1); await o.f.highlightElement('dom', 2, 'blue'); } },
      { say: 'Turn every arrow around and back.', do: async (s, o) => { await o.f.invert(); await o.f.invert(); } },
      { say: 'Send 1 to d instead, then invert the one-to-one map.', do: async (s, o) => { await o.f.removeArrow(0, 0); await o.f.addArrow(0, 3); await o.f.invert(); } },
    ],
  },
  {
    title: 'Relation graph',
    scene(s) {
      const g = s.relationGraph({ x: 245, y: 300, nodes: ['1', '2', '3', '4', '5', '6'], edges: [[0, 2], [2, 4], [1, 1], [3, 5]], radius: 145 });
      const row = s.relationGraph({ x: 715, y: 340, nodes: ['a', 'b', 'c', 'd'], edges: [[0, 1], [1, 3]], layout: 'row', width: 330 });
      return { g, row };
    },
    steps: [
      { say: 'Add an edge, and a loop.', do: async (s, o) => { await o.g.addEdge(4, 0); await o.g.addEdge(0, 0); await o.row.addEdge(3, 0); } },
      { say: 'Highlight some edges and nodes.', do: (s, o) => s.all(o.g.highlightEdges([[0, 2], [2, 4]], 'blue'), o.g.highlightNodes([0, 2, 4], 'blue'), o.row.highlightEdges((i, j) => i < j, 'orange')) },
      { say: 'Close it up: reflexive, symmetric, transitive.', do: async (s, o) => { await o.g.closure('reflexive'); await o.g.closure('symmetric'); await o.g.closure('transitive', { gap: 120 }); await o.row.closure('transitive'); } },
      { say: 'Remove one edge.', do: (s, o) => o.row.removeEdge(0, 1) },
      { say: 'Equivalence classes regroup and get their own colors.', do: (s, o) => o.g.partition([[0, 2, 4], [1], [3, 5]]) },
    ],
  },
  {
    title: 'Number line',
    scene(s) {
      const top = s.numberLine({ y: 210, range: [-1, 3], ticks: 0.5, labels: 2, width: 800 });
      const low = s.numberLine({ y: 470, range: [0, 2.5], ticks: 0.5, labels: 2, width: 800 });
      return { top, low };
    },
    steps: [
      { say: 'A closed point and an open point.', do: (s, o) => { o.a = o.top.point(0, { label: 'a' }); return s.all(o.a, o.top.point(2, { label: 'b', open: true, color: 'red' })); } },
      { say: 'Slide one along.', do: (s, o) => o.a.moveTo(0.5, { label: 'c' }) },
      { say: 'An interval and a ray.', do: (s, o) => s.all(o.top.interval(-0.5, 1, { openB: true, color: 'green' }), o.top.interval(2.5, Infinity, { color: 'purple' })) },
      { say: 'A marker that reports where it is.', do: async (s, o) => { await o.top.moveMarker(-0.5, { label: (v) => `x = ${v.toFixed(1)}` }); await o.top.moveMarker(1.5); } },
      { say: 'A band of width epsilon around the limit, then a smaller one.', do: async (s, o) => { o.band = o.low.band(1, 0.6); await o.band; await o.band.to(0.3); } },
      { say: 'The sequence one plus one over n marches toward one.', do: (s, o) => o.low.sequence((n) => 1 + 1 / n, 8, { gap: 220 }) },
    ],
  },
  {
    title: 'Cantor diagonal',
    scene(s) {
      const rows = [
        [1, 4, 1, 5, 9, 2],
        [7, 1, 8, 2, 8, 1],
        [5, 0, 0, 0, 0, 0],
        [3, 3, 3, 5, 3, 3],
        [4, 1, 4, 2, 1, 3],
      ];
      const g = s.digitGrid({ y: 300, rows });
      return { g };
    },
    steps: [
      { say: 'Suppose this list held every real number.', do: (s, o) => o.g.highlightCell(0, 0, 'blue') },
      { say: 'Look down the diagonal.', do: (s, o) => o.g.highlightDiagonal() },
      { say: 'Build a new number that differs from row k in digit k.', do: (s, o) => o.g.buildDiagonal() },
    ],
  },
  {
    title: 'Induction dominoes',
    scene(s) {
      const d = s.dominoes({ y: 290, n: 8 });
      return { d };
    },
    steps: [
      { say: 'The base case: push the first domino.', do: (s, o) => o.d.push(0) },
      { say: 'Each one knocks over the next.', do: (s, o) => o.d.topple(0, { to: 3 }) },
      { say: 'Point at P of k.', do: (s, o) => o.d.highlight(3, 'blue') },
      { say: 'And the rest follow.', do: (s, o) => o.d.topple(3) },
      { say: 'Stand them up and knock them all down at once.', do: async (s, o) => { await o.d.reset(); await o.d.topple(0); } },
    ],
  },
  {
    title: 'Modular clock',
    scene(s) {
      const m = s.modClock({ y: 300, n: 12, r: 140 });
      return { m };
    },
    steps: [
      { say: 'Start at 9 and add 5.', do: (s, o) => o.m.step(9, 5) },
      { say: 'Hop by 4 three times.', do: (s, o) => o.m.step(0, 4, { count: 3, color: 'green' }) },
      { say: 'Highlight 6.', do: (s, o) => o.m.highlight(6, 'purple') },
      { say: 'Clear, then wrap the integers around.', do: async (s, o) => { await o.m.clear(); await o.m.wrap(24, { start: 12, gap: 70 }); } },
      { say: 'Color the classes mod 3.', do: (s, o) => o.m.classes({ mod: 3 }) },
    ],
  },
];
