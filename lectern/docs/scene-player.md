# Scene player (`src/scene-player.js`)

The learn tutor draws step-through figures beside a lesson with `show_scene`. On Matrix Algebra and Foundations
pages it loads `lectern/src/scene-player.js` and calls

```js
const p = new Player(host, { frames, view: { height } });
p.frames; p.i;            // the frames (normalized) and the current frame, 0-based
p.next(); p.prev(); p.go(k);
p.stop();                 // stops animations and observers; the figure stays
```

The figure uses the lessons' own stage (960 × 600 logical px, scaled to the width) and components, with a caption
under it and ‹ i / n › buttons. ← / → (and Home / End) step when the figure has focus. `view.height` caps the stage
height in CSS px. The root `<figure class="lx-sp">` has `.player = this`, the overlay's convention for lesson figures.

The tutor learns the format from the module's header comment; this page says the same thing at more length, with
two complete examples.

## Frames

A scene is a JSON array of frames. Each frame is the **complete** picture at that step:

```json
{ "caption": "One or two sentences, $math$ allowed", "objects": [ { "id": "M", "kind": "matrix", "rows": [[1, 2], [3, 4]] } ] }
```

- **Next animates the difference.** An object whose `id` is in both frames changes in place: it moves, recolors,
  morphs, and its contents animate (matrix entries, plane vectors, Venn shading, truth-table columns, proof lines).
  An `id` that is gone fades out; a new `id` comes in (math is written, shapes are drawn, the rest fades in).
- **Back jumps.** Going back, or stepping with the keyboard, rebuilds the frame without animation. A rebuild replays
  frames 0…k instantly, so it always shows exactly what stepping forward showed.
- **Ids.** Give every object a stable `id`. Without one, the n-th object of a kind matches the n-th object of that
  kind in the next frame.
- **Shorthand.** An object with an `id` from the previous frame and no `kind` repeats that object, replacing only the
  props it gives: `{ "id": "M", "rows": [[1, 2], [0, -2]] }`. `null` removes a prop (`{ "id": "M", "note": null }`).
  An object not listed in a frame, in full or by shorthand, disappears.
- **Coordinates** are stage px: x from 0 to 960 to the right, y from 0 to 600 down. `(x, y)` is an object's center
  (default 480, 300), except `proof`, which hangs from its top center. Text sizes are at least 30 (smaller sizes are
  raised). The caption is below the stage, not on it.
- **Colors** are names: `ink` (default), `muted`, `blue`, `red`, `green`, `yellow`, `purple`, `teal`, `orange`.
- **Math.** TeX props are KaTeX; in JSON every backslash is doubled (`"\\frac{1}{2}"`). `caption`, `text` and proof
  text use `$…$` for inline math (and `**bold**`).
- **Bad input never breaks the figure.** Unknown kinds, unknown props and invalid values are skipped, and a short
  warning (⚠) appears under the caption of that frame (all of them are also logged to the console).

## Kinds

Defaults after `=`.

| kind | props | how it changes between frames |
| --- | --- | --- |
| `tex` | `tex` (required), `x`, `y`, `size=44`, `color`, `align=center\|left\|right` (which end of the formula is at `x`) | new tex in place crossfades; moved or resized glides; moved with new tex morphs from the old box |
| `text` | `text` (required, `$math$`), `x`, `y`, `size=34`, `color`, `align`, `width` (wraps), `weight=normal\|bold`, `italic`, `font=sans\|serif` | as `tex` |
| `matrix` | `rows` (required: numbers, fraction strings `"-3/4"`, or TeX strings `"a_{11}"`), `x`, `y`, `size=40`, `augment` (bar before this 0-based column), `brackets="[]"\|"()"\|"\|\|"\|"none"`, `color`, `highlight { rows, cols, cells: [[i, j]], color=yellow }`, `pivots [[i, j]]`, `pivotColor=blue`, `note { row, tex, color=muted }`, `rowop=true` | one row operation (swap, scale, replacement) is detected and played as that operation, named beside the row ($R_2 \to R_2 - 2R_1$) unless the frame has a `note`; otherwise changed entries slide in; a new shape crossfades. Highlights, rings and the note change only when their props change |
| `plane` | `x`, `y`, `width=520`, `height` (square units), `range=[-5, 5, -4, 4]`, `step=1`, `grid`, `axes`, `labels`, `names ["x_1", "x_2"]`, `basis` (î, ĵ), `matrix [[a, b], [c, d]]`, `vectors [{ id, v, tail, color=blue, label, fixed }]`, `points [{ id, p, color, label, fixed }]`, `lines [{ id, through, dir } \| { id, a, b, c }, color, dash, fixed]`, `span` (`[a, b]` or `[{ id, v, color=yellow }]`), `polygons [{ id, points, color }]` | vectors and points move, lines and polygons morph, a new `matrix` animates the grid (and every non-fixed object) from the old map to the new one; the original grid stays faint |
| `space` | `x`, `y`, `size=440`, `range=3`, `yaw=-35`, `pitch=20`, `axes`, `names`, `vectors [{ id, v: [a, b, c], tail, color, label }]`, `points [{ id, p, color, label }]`, `lines [{ id, through, dir, color, dash }]`, `planes [{ id, u, v } \| { id, normal, d }, color]` | the camera turns, vectors and points move; changed lines and planes are replaced |
| `arrow` | `from [x, y]`, `to [x, y]` (stage px), `color`, `width=4`, `dash`, `label` (TeX beside its middle) | ends glide, the label follows |
| `box` | `x`, `y`, `w`, `h` (center and size), or `around: "id" \| ["id", …]` (for a matrix also `row`, `col` or `cell: [i, j]`); `pad=10`, `color=yellow`, `radius=12`, `width=3`, `dash` | a box `around` objects waits for them to settle, then resizes onto them |
| `truthTable` | `vars ["P", "Q"]`, `cols [{ tex, values, hidden }]` (one value per row, `true`/`false` or `"T"`/`"F"`; rows in standard order: P = T T F F, Q = T F T F), `x`, `y`, `size=32`, `T`, `F`, `highlightRows [i]`, `highlightCol` (index over all columns, or a var/tex), `highlightColor=yellow`, `marks ["✓", null, "✗", …]` | a column whose `hidden` turns false fills in top to bottom; highlights and marks are redone when they change |
| `venn` | `sets ["A", "B"]` (1–3 names) or a count, `labels`, `x`, `y`, `r` (140; 122 for three), `universe=true`, `size=36`, `shade ["A&B", { region, color }]`, `elements [{ id, region, label, color }]`, `outline ["A", { set, color }]` | each atomic region shades or unshades (later `shade` entries paint over earlier ones), elements pop in and out, outlines draw |
| `mapDiagram` | `domain`, `codomain`, `arrows [[i, j]]`, `labels ["A", "B"]`, `name`, `x`, `y`, `gap=360`, `spacing=72`, `size=32`, `highlight [{ side: "dom"\|"cod", i, color }]`, `show ["collision", "missed"]`, `inverted` | arrows draw and fade, `inverted` sends the heads to the other end, highlights and marks are redone |
| `numberLine` | `x`, `y`, `width=800`, `range=[-5, 5]`, `ticks=1`, `labels` (true, false, k = every k-th), `size=30`, `arrows=true`, `points [{ id, v, label, color, open }]`, `intervals [{ id, a, b, openA, openB, color }]` (null or missing end = ray), `band { center, eps, color=yellow, label="\\varepsilon" }` | points slide, the band grows or shrinks, changed intervals are redrawn |
| `proof` | `x=480`, `y=70` (top center), `width=820`, `height`, `size=30`, `numbered=true`, `lines [{ text, why, kind: step\|assume\|conclude\|contradiction, indent, note }]`, `highlight [i]`, `strike [i]`, `qed` | lines added at the end are written one by one; notes, highlights, strikes and ∎ animate in; any other change rewrites the proof |

Region codes (Venn): `&` or `∩` and, `|` or `∪` or, `-` or `∖` minus, `!` not (prefix), `'` complement (postfix),
`^` symmetric difference, parentheses, `U` the universe. Examples: `"!(A|B)"`, `"A'&B'"`, `"(A-B)|(B-A)"`.

Layout guide: a matrix takes about 1.8·size px per column and 1.75·size px per row (4 × 5 fits at size 40); a
two-set Venn diagram is about 550 × 385 px, a three-set one about 500 × 510; a plane is `width` wide and as tall as
its range makes it.

## Example 1: row reduction in three frames

```json
[
  {
    "caption": "The augmented matrix of $x + 2y = 5,\\ 2x + 3y = 8$. The first pivot is the $1$ in the corner.",
    "objects": [
      { "id": "M", "kind": "matrix", "rows": [[1, 2, 5], [2, 3, 8]], "augment": 2, "x": 420, "pivots": [[0, 0]] },
      { "id": "goal", "kind": "text", "text": "Goal: zeros below each pivot", "y": 470, "color": "muted" }
    ]
  },
  {
    "caption": "Replace $R_2$ by $R_2 - 2R_1$: the entry under the pivot becomes $0$.",
    "objects": [
      { "id": "M", "rows": [[1, 2, 5], [0, -1, -2]] },
      { "id": "goal" }
    ]
  },
  {
    "caption": "Row 2 now has a pivot in column 2. Two pivots, no free variable: exactly one solution.",
    "objects": [
      { "id": "M", "pivots": [[0, 0], [1, 1]] },
      { "id": "row2", "kind": "box", "around": "M", "row": 1, "color": "blue" },
      { "id": "goal", "text": "Echelon form: back substitution gives $y = 2,\\ x = 1$", "color": "green" }
    ]
  }
]
```

Frame 2 is detected as the replacement $R_2 \to R_2 - 2R_1$: a ghost of row 1 scaled by −2 slides onto row 2 and the
operation is written beside it. In frame 3 the note clears (no operation produced that frame), the second pivot ring
draws, the box traces row 2, and the goal text crossfades to its new wording.

## Example 2: a Venn-diagram identity in three frames

```json
[
  {
    "caption": "De Morgan's law says $(A \\cup B)^c = A^c \\cap B^c$. Start with the left side: first $A \\cup B$.",
    "objects": [
      { "id": "V", "kind": "venn", "sets": ["A", "B"], "x": 330, "y": 300, "shade": ["A|B"] },
      { "id": "lhs", "kind": "tex", "tex": "A \\cup B", "x": 790, "y": 220, "color": "blue" }
    ]
  },
  {
    "caption": "Its complement $(A \\cup B)^c$ is everything outside both circles.",
    "objects": [
      { "id": "V", "shade": [{ "region": "!(A|B)", "color": "orange" }] },
      { "id": "lhs", "tex": "(A \\cup B)^c", "color": "orange" }
    ]
  },
  {
    "caption": "Now the right side: outside $A$ and outside $B$ is the same region, so the sets are equal.",
    "objects": [
      { "id": "V", "shade": [{ "region": "A'&B'", "color": "green" }], "outline": [{ "set": "A", "color": "purple" }, { "set": "B", "color": "purple" }], "elements": [{ "region": "A'&B'", "label": "x" }] },
      { "id": "lhs", "tex": "(A \\cup B)^c", "y": 200, "color": "orange" },
      { "id": "rhs", "kind": "tex", "tex": "= A^c \\cap B^c", "x": 790, "y": 290, "color": "green" },
      { "id": "eq", "kind": "box", "around": ["lhs", "rhs"], "color": "green" }
    ]
  }
]
```

Frame 2 unshades the circles and shades the outside, while the formula crossfades to its complement. In frame 3 the
outside region recolors to green (the same atoms, a new color), both circles get outlines, an element `x` pops into
the region, the left side glides up, the right side is written under it, and a box traces around both once they have
settled.
