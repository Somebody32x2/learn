# Foundations stage components (viz/logic.js, viz/sets.js)

Factories on the stage for MATH 3010 lectures. Styles live in `css/stage-logic.css` (link it next to `css/stage.css`).
Every animation method returns a Promise on the stage clock (pause, speed, instant seeking and `kill()` all work);
nothing else animates. Coordinates are stage units (960 × 600); every component takes `x`, `y` (its center unless
noted) and `visible: false` (start hidden, then `fadeIn()`; SVG components can also `draw()`).

**Colors**: any `color` option takes a name (`'blue'`), `C.blue` or `FILL.blue`; the component picks the strong or
soft variant. **Parts**: methods that add something (proof lines, Venn elements, number-line points…) return a
*Part*: `await part` waits for its entrance and gives the handle back (`const l = await p.add(…)`), `part.node` is its
element, `part.fadeOut()` removes it.

**SVG labels** (Venn, maps, graphs, number lines, dominoes, clocks) take light TeX: `\varepsilon`, `\mathbb{Z}`,
`\text{…}`, `\col{c}{…}`, `a_n`, `f^{-1}`. Braces show literally (`{1, 2}` or `\{1, 2\}`) unless they are a command's
argument.

Demos of every animation: `src/viz/demos-logic.js` (shown in `#/kit`). Cards, stamps, scratch panes, strike-outs,
rings and symbol rows for both courses are in `src/viz/common.js` (see `docs/viz-common.md`).

## Truth table — `s.truthTable(opts)` (HTML)

`{ vars = ['P','Q'], cols = [{ tex, fn(v, row), key? }], size = 32, T = 'T', F = 'F', show = 'vars' }`.
Rows are in standard order (all T first). `fn` gets `v = { P, Q, …, $: [values of the earlier columns] }`.
`show`: `'vars'` (headers + variable columns), `'headers'`, `'all'`, `'none'`. A column `j` is an index over all
columns (variables first), a variable name, or a column's `tex`/`key`.

| method | does |
| --- | --- |
| `revealRow(i, { stagger })` | the row's hidden cells appear left to right |
| `revealCol(j, { stagger })` | the column (and its header) appears |
| `revealAll({ stagger })` | every hidden cell, row by row |
| `fillColumn(j, { gap = 260 })` | the column's cells appear top to bottom |
| `highlightRows(sel, color)` | `sel`: `(v, i) => bool`, an index array or one index |
| `highlightCol(j, color)` | soft band down a column |
| `markRow(i, '✓' \| '✗' \| bool)` | a mark in the right margin |
| `highlightCell(i, j, color)` | soft highlight on one cell |
| `clear()` | removes highlights and marks |
| `value(i, j)`, `col(j)` | the boolean in a cell; a column's index |
| `cellBox(i, j)`, `colBox(j, { visibleOnly })`, `rowBox(i, { visibleOnly })` | stage boxes `{ x, y, w, h, cx, cy }` (for `s.ring`, `s.surround`, arrows); `visibleOnly` (default true) counts only revealed cells and marks |

```js
const t = s.truthTable({ vars: ['P', 'Q'], cols: [{ tex: 'P\\Rightarrow Q', fn: (v) => !v.P || v.Q }] });
await t.fillColumn(2);
await t.highlightRows((v) => v.P && !v.Q, 'red');
```

## Two-column proof — `s.proof(opts)` (HTML)

`{ x = 480, y = 70, width = 820, height (default: to the stage bottom), size = 30, numbered = true, whyWidth = 'auto' }`,
anchored at its top center. Lines are written left to right; when they overflow the window it scrolls so the newest
stays visible (a soft fade marks hidden lines above). `whyWidth`: the reason column; `'auto'` starts at 16 % of the
width and widens smoothly to fit the longest reason so far (at most 34 %); or a number of px, or a CSS length.
A wrapped statement keeps its number on its first row. Columns: kind bar (3 px) · number (exactly as wide as the
longest number, e.g. "7." = 2 mono digits) · statement · reason (exactly `whyWidth`; long words hyphenate). The
statement column is `width − whyWidth − number − ≈1.95em` (gaps and padding): at size 30, width 900 it is about
636 / 576 / 516 px for `whyWidth` 180 / 240 / 300. Punctuation right after `$math$` stays on the math's line.
The window scrolls only by how far the last row passes it (overflow up to 0.4em counts as fitting); when the list
gets shorter again (fonts loading, a reason column unwrapping lines, a removed line) the scroll drops back. The top
fade shows only while something is hidden and grows with how much is hidden.

- `add(content, { why, indent = 0, kind = 'step', tex, numbered = true })` → line Part (`line.index`). `content` is
  text with `$math$`, or bare TeX (detected: TeX characters and no plain 4-letter word; force with `tex: true | false`).
  `why` is the right-hand justification (text with `$math$`). `kind`: `'step'`, `'assume'` (blue rule), `'conclude'`
  (green, bold), `'contradiction'` (red rule and ⇒⇐). `numbered: false` skips the number (a `$\vdots$` placeholder).
- `insertAfter(line, content, opts)` → line Part: the rows below slide down to make room, then it is written; numbers
  update. For skeleton proofs filled in the middle.
- `replace(line, content, { why, tex, numbered })`: the statement fades and the new one is written in place (`why`
  replaces the reason too; `numbered: true` numbers a former placeholder).
- `removeLine(line)`: the row folds away; the rest close up and renumber.
- `highlight(line, color)`, `unhighlight(line)`; `strike(line, { color })` (line drawn through, text dims);
  `note(line, text, { color })` (an ↳ annotation under the statement); `qed()` (∎ at the right);
  `scrollTo(line | 'end')`; `lineBox(line, 'body' | 'why' | 'row')` (stage box); `clear()` (fade out, numbering
  restarts). `line` = the Part, an index (negative from the end), or the row node. `\part{name}{…}` inside math
  marks parts (find them with `line.node.querySelector('.p-name')`).

```js
const p = s.proof({ y: 50 });
const first = p.add('Suppose $n$ is even.', { kind: 'assume', why: 'hypothesis' });
const dots = p.add('$\\vdots$', { numbered: false });
await p.add('Therefore $n^2$ is even.', { kind: 'conclude', why: 'definition of even' });
const l = p.insertAfter(first, 'n = 2k \\text{ for some } k \\in \\mathbb{Z}', { why: 'definition of even' });
await l; await p.note(l, 'this $k$ does the work');
await p.replace(dots, 'So $n^2 = 2(2k^2)$.', { why: 'algebra', numbered: true });
await p.qed();
```

## Implication chain — `s.implication(opts)` (HTML)

`{ items: [tex…], arrows: '⟹' | '⟺' | '⟸' | tex | [one per gap], size = 40 }`. Arrows start muted.

- `step(i, { color = 'blue' })`: arrow `i` lights (stays lit) and the statement it leads to pulses.
- `reverse()`: every arrow turns around (the converse); call again to turn back.
- `negateAll()`: `¬` grows in front of every statement, with parentheses around compound ones; again removes it.
  `reverse()` then `negateAll()` shows the contrapositive.
- `clear()`: unlights the arrows.

```js
const c = s.implication({ items: ['P', 'Q'] });
await c.step(0); await c.reverse(); await c.negateAll(); // ¬P ⟸ ¬Q
```

## Venn diagram — `s.venn(opts)` (SVG)

`{ sets = ['A','B'] | 1..3, r (140; 122 for three), universe = true, labels (display names), size = 36 }`.
Regions are code strings over the set names: `!` `~` `¬` not, postfix `'` complement, `&` `∩` and, `-` `∖` minus,
`|` `+` `∪` or, `^` symmetric difference, parentheses, `U` = everything. An array of codes is their union.
Helpers (methods and module exports) build codes: `union(...)`, `intersect(...)`, `minus(a, b)`, `complement(a)`,
`symdiff(a, b)`.

- `shade(regions, { color = 'blue' })` (recolors shaded parts), `unshade(regions)`, `clearShade()`.
- `element(region, label, { color, at: [x, y], size })` → Part: a dot and label placed at the roomiest free spot
  of the region (away from edges, labels and earlier elements).
- `count(region, n | text, { color, size = 38, at })` → Part: a bare label (a count like 3) popped in at the
  region's roomiest free spot; `regionCenter(region)` → `{ x, y }` (stage point there, plus `local`).
- `outline(set | 'U', color)` draws a thick outline; `outline(set, null)` removes it.
- `atoms(regions)` → the membership bitmasks the code covers.

```js
const v = s.venn({ sets: 3 });
await v.shade(v.minus('A', v.union('B', 'C')), { color: 'purple' });
await v.element('A&B&C', 'x');
```

## Function arrow diagram — `s.mapDiagram(opts)` (SVG)

`{ domain: [labels], codomain: [labels], arrows: [[i, j], …], labels = ['A','B'], name, gap = 360, spacing = 72, size = 36 }`.

- `addArrow(i, j, { color })` (drawn), `removeArrow(i, j)`.
- `highlightElement('dom' | 'cod', i, color)`.
- `showCollision()`: arrows sharing a target pulse red, target highlighted (not injective). Resolves `true` if any.
- `showMissed()`: codomain elements with no arrow get a pulsing dashed ring (not surjective). Resolves `true` if any.
- `invert()`: every arrowhead slides to the other end (the inverse); `name` becomes `name⁻¹`. Again turns back.
- `clear()`: removes collision, missed and element highlights.

```js
const f = s.mapDiagram({ domain: ['1', '2', '3'], codomain: ['a', 'b'], arrows: [[0, 0], [1, 0], [2, 1]], name: 'f' });
await f.showCollision();
```

## Relation graph — `s.relationGraph(opts)` (SVG)

`{ nodes: [labels], edges: [[i, j], …], layout = 'circle' | 'row', directed = true, radius = 170, width = 760, nodeR = 30, size = 34 }`.
Self-loops point away from the center (up in a row); opposite edges bow apart; long row edges arc (up left→right,
down right→left).

- `addEdge(i, j, { color })` (drawn), `removeEdge(i, j)`.
- `highlightEdges([[i, j], …] | (i, j) => bool, color)`, `highlightNodes(indices, color)`.
- `partition(classes, colors = PALETTE, { move = true })`: nodes regroup so each class is contiguous (unless
  `move: false`), recolor by class, and a soft blob appears around each class.
- `closure('reflexive' | 'symmetric' | 'transitive', { color = 'green', gap })`: missing edges are drawn one by one.

```js
const r = s.relationGraph({ nodes: ['1', '2', '3', '4'], edges: [[0, 1], [1, 2]] });
await r.closure('transitive');
await r.partition([[0, 2], [1, 3]]);
```

## Number line — `s.numberLine(opts)` (SVG)

`{ width = 800, range = [-5, 5], ticks = 1, labels = true | k (every k-th tick) | (v) => string | false, size = 36, arrows = true }`.
`toX(v)` maps a value to local x.

- `point(v, { color, label, open })` → Part with `moveTo(v, { label })`.
- `interval(a, b, { openA, openB, color })` → Part; `±Infinity` gives a ray. Drawn from `a` to `b`.
- `band(center, eps, { color = 'yellow', label = '\\varepsilon', height })` → Part with `to(eps)`: shaded
  `(center − eps, center + eps)` grows from width 0, measured by a labeled bracket.
- `sequence(fn, n, { start = 1, color, gap, trail = true })` → Part (`.dots`): `fn(start)…` drop in one by one;
  earlier dots dim.
- `marker(v, { label, color = 'red' })` → Part with `moveTo(v)`; `label` may be `(v) => text` (updates while moving).
- `moveMarker(v, opts)`: the line's own marker (appears at `v` the first time, slides afterwards).

```js
const nl = s.numberLine({ range: [0, 2], ticks: 0.25, labels: 4 });
const b = nl.band(1, 0.5); await b; await b.to(0.2);
await nl.sequence((n) => 1 + (-1) ** n / n, 10);
```

## Cantor diagonal — `s.digitGrid(opts)` (HTML)

`{ rows: [[digits]], rowLabels (TeX, default f(1)…), size = 36, prefix = '0.', more = true (… and ⋮), label = 'x' }`.

- `highlightCell(i, j, color)`, `highlightDiagonal({ color, gap })`.
- `buildDiagonal({ change = (d, k) => (d == 5 ? 6 : 5), color = 'red' })`: the new row under the grid is assembled
  digit by digit: digit `k` of row `k` flies down and changes.

```js
const g = s.digitGrid({ rows: [[1, 4, 1], [7, 1, 8], [5, 0, 0]] });
await g.highlightDiagonal(); await g.buildDiagonal();
```

## Induction dominoes — `s.dominoes(opts)` (SVG)

`{ n = 8, label = (k) => 'P(k)', start = 1, w = 24, h = 116, gap = 64, size = 34, labelSize = size, more = true (⋯ after the last) }`.
Labels wider than the spacing shrink (to 28 at least), then tilt −40°, so `P(10)`… never collide. (SVG label
sub/superscripts are never under 28 px either.)
Domino `i` (0-based) is labeled `label(start + i)`; each pivots on its bottom-right corner.

- `push(i = 0, { color = 'green' })`: an arrow nudges domino `i`, it rocks and turns green (the base case).
- `topple(from = 0, { to = n, gap, duration })`: dominoes fall in sequence, each leaning on the next (the last
  falls flat when `more: false`).
- `highlight(k, color)`, `reset()` (all stand up, colors cleared).

```js
const d = s.dominoes({ n: 6, start: 0 });
await d.push(0); await d.topple(0);
```

## Modular clock — `s.modClock(opts)` (SVG)

`{ n = 12, r = 140, nodeR = 28, size = 34 }`: residues clockwise from the top.

- `step(from, by, { color = 'blue', count = 1 })` → Promise of the landing residue: arc arrows (inside the ring) hop
  `by` (negative: counter-clockwise; beyond `n`: spirals), the current residue stays lit.
- `highlight(k, color)`.
- `wrap(count, { start = 0, gap })`: integers are written around the outside in rings, each on its residue's spoke
  (keep it to ~2 rings: 2n numbers).
- `classes({ mod = n, colors })`: residues (and their wrapped integers) take the color of `k mod mod`.
- `clear()`: removes arcs, wrapped integers and colors.

```js
const m = s.modClock({ n: 12 });
await m.step(9, 5);            // lands on 2
await m.wrap(24); await m.classes({ mod: 4 });
```

## Helpers (exports of logic.js, used by sets.js)

`tween(clock, update, opts)`, `appear(clock, node, { dy, scale })`, `vanish(clock, nodes, { remove })`,
`paint(clock, nodes, { prop: value | null })`, `glow(clock, nodes, color, on)` (for `.lx-hl` nodes),
`pulse(clock, node, { color })`, `tone(color) → { fg, bg }`, `Part`, `PALETTE`, `looksLikeTex(str)`,
`renderMath(content, tex)` (TeX or text with `$math$` → HTML; `\part{name}{…}` marks parts),
`nodesBox(stage, nodes)` (union of DOM nodes' boxes in stage units).
sets.js also exports `compileRegion(code, names)` and `texPlain(tex)` (TeX symbols → Unicode). SVG labels accept
light TeX: `\varepsilon`, `\mathbb{Z}`, `\text{…}`, and `a_n` / `f^{-1}` (typeset as smaller lowered/raised spans).
SVG label text defaults to 34–36 logical px (Newsreader runs small; keep labels ≥ 34 so they read on phones).
Pass the clock captured at the start of a method (`const clock = this.clock`) so a killed scene stays inert.
