# Shared stage helpers (viz/common.js)

Small pieces both courses use: cards, stamps, scratch panes, strike-outs, rings, symbol rows. Registered on the
stage by `viz/index.js`. Styles are inline and use tokens only, so no extra stylesheet is needed. Every animation
runs on the stage clock (pause, speed, seeking and `kill()` work). Colors take a name (`'blue'`), `C.blue` or
`FILL.blue`. A *Part* is a handle: `await part` waits for its animation and gives the handle back
(`const r = await s.ring(x)`), `part.fadeOut()` removes it, `part.mob` is the mob it drew (strike, ring).

**Targets** (for `s.strike` and `s.ring`) can be a mob (anything with `box()`), a plain box `{ x, y, w, h }`, a DOM
element, a Part (a proof line, a Venn element…), or `[mob, 'name']` for a part marked `\part{name}{…}` in a Tex or a
card. Stage boxes also come from `table.cellBox(i, j)`, `table.colBox(j)` and `proof.lineBox(line)`.

Demo: "Cards, stamps, scratch work" in `#/kit` (`src/viz/demos-logic.js`).

## `s.defCard(opts)` → DefCard

`{ x = 480, y = 300, width (default: fits the content, ≤ 900), title, body | tex, kind = 'definition', size = 30, anchor, visible }`

- `kind`: `'definition'` (purple), `'theorem'` (blue), `'warning'` (red, "Careful"), `'example'` (teal), `'note'` (ink).
- `title`: the heading (default: the kind's name); `false` for none. `body`: text with `$math$` and `**bold**`; or
  `tex`: pure TeX. Mark parts inside math with `\part{name}{…}`.
- `reveal({ duration, delay })`: the card fades in, the heading appears and the body is written left to right
  (create it with `visible: false`). `part(name)` → elements, `partBox(name)` → stage box, `color(name, c)`.
- A body wider than the card (long TeX doesn't wrap) is first scaled down, never below 28 px; if it still overflows,
  the card widens around its anchor up to the stage's safe width (912 px, inside the 24 px margins); as a last resort
  the body wraps anywhere. Each fix logs a console warning. The heading is never under 28 px either. A wider or
  taller card can reach into the margins, so leave room or set `width` yourself.

```js
const def = s.defCard({ y: 80, body: '$n$ is **even** if $n = 2k$ for $\\part{ex}{\\text{some } k \\in \\mathbb{Z}}$.', visible: false });
await def.reveal();
await s.ring([def, 'ex'], { color: 'blue' });
```

## `s.stamp(text, opts)` → Stamp

`{ x = 480, y = 300, color = 'red', rotate = -6, size = 32, visible = false }`. A bordered rubber stamp ("not
equivalent", "not a proof", T / F; text may hold `$math$`). Hidden until `slam({ duration, delay })`: it lands from a
little larger with a small overshoot.

```js
const v = s.stamp('not equivalent', { x: 760, y: 330 });
await v.slam();
```

## `s.scratch(opts)` → Scratch

`{ x = 40, y = 80, w = 880, h = 480, title = 'Scratch work', size = 30, visible }`, anchored at its top-left corner. A
dashed, muted pane for scratch work.

- `reveal()`: pane, then title.
- `add(content, { color, indent, tex })` → Part: a line (TeX or text with `$math$`) written left to right; lines stack
  downwards and the pane scrolls when they overflow. Color conventions: `'blue'` forwards from the hypothesis,
  `'green'` backwards from the goal, `'yellow'` where they meet.
- `retitle(text)` (crossfade), `clear()`.

```js
const pad = s.scratch({ x: 30, y: 90, w: 520, h: 300, visible: false });
await pad.reveal();
await pad.add('n = 2k + 1', { color: 'blue' });
await pad.add('want: $n^2 = 2m + 1$', { color: 'green' });
```

## `s.strike(target, opts)` → Part

`{ color = 'red', width = 4, pad = 8, dim = true, duration = 550, delay }`. A line is drawn through the target's box
(front layer); a mob target recolors to muted, a DOM target's text dims.

```js
await s.strike(wrongLine);
```

## `s.ring(target, opts)` → Part

`{ color = 'yellow', pad = 6, width = 3.5, shape = 'ellipse' | 'box', duration = 550, delay }`. Circles a symbol, a
Tex part or any box: an ellipse fitted to the box (`rx = w/2 + pad`, `ry = h/2 + pad`, so long pieces get a flat ring
that stays off their neighbours) or a rounded box, drawn along its outline (front layer).

```js
await s.ring([tex, 'witness'], { color: 'yellow' });
await s.ring(table.cellBox(1, 'P\\Rightarrow Q'), { color: 'red' });
```

## `s.symbols([tex, …], opts)` → Tex[] (with `.group`)

`{ x = 480, y = 300, gap = 0, size = 44, color, visible = true }`. Each piece is its own Tex mob (anchored at its left
middle), laid out in a row centered on `x`, so symbols can move separately; `.group` moves or fades them together.
Build a second, hidden row for the target layout and move pieces onto it.

```js
const from = s.symbols(['\\neg', '(', 'P', '\\land', 'Q', ')'], { y: 240 });
const to = s.symbols(['\\neg', 'P', '\\lor', '\\neg', 'Q'], { y: 240, visible: false });
await s.all(from[2].moveTo(to[1].x, to[1].y), from[4].moveTo(to[4].x, to[4].y), from[1].fadeOut(), from[5].fadeOut());
```

Also exported: `boxOfTarget(stage, target)` → `{ x, y, w, h, cx, cy }`, and the classes `DefCard`, `Stamp`, `Scratch`.
