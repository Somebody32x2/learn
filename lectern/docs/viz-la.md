# Linear-algebra stage components

Reference for lecture authors. Everything here is created through the stage (`s.line(…)`, `s.matrix(…)`, …) once
`src/viz/index.js` is imported. Every object is a mob, so the usual `fadeIn`, `fadeOut`, `write`, `draw`, `shift`,
`indicate`, `flash`, `recolor`, `set/show/hide/remove` and `box()` work on it. Methods marked *anim* return a
Promise on the stage clock (pause, speed and seeking work); the rest are immediate. Stage is 960 × 600; keep type
≥ 30 px. Colors: `C.*` / `FILL.*` from `core/stage.js`. Working examples of every call: `src/viz/demos-la.js`
(`#/kit`).

## Shapes (`src/viz/shapes.js`)

Geometry is in stage coordinates. Back SVG layer unless `layer: 'front'`. Common opts: `color` (default `C.ink`),
`width` (stroke), `fill`, `dash` (`true` or `'6 4'`), `opacity`, `visible`. `moveTo(x, y)` moves the shape's center;
`shift(dx, dy)` offsets it; scale/rotate/indicate act about the center.

| Factory | Notes |
| --- | --- |
| `s.line(x1, y1, x2, y2, opts)` | `setEnds(x1, y1, x2, y2, { duration })` *anim*; `setEndsNow(…)` |
| `s.arrow(x1, y1, x2, y2, opts)` | `draw()` grows it from the tail *anim*; `setEnds(…)` *anim*; opts `head` (head length) |
| `s.rect(x, y, w, h, opts)` | opts `radius`; `resize(x, y, w, h, { duration })` *anim* |
| `s.circle(cx, cy, r, opts)` | `resize(cx, cy, r, { duration })` *anim* |
| `s.dot(x, y, { r = 8 })` | filled; `draw()` pops it in *anim* |
| `s.path(d, opts)` | any SVG path; `setPath(d)` |
| `s.polygon([[x, y], …], opts)` | `morph(points, { duration })` *anim* (same vertex count) |
| `s.brace(x1, y1, x2, y2, { label, side, depth = 18, size = 34, labelColor })` | curly brace; `side`: `'below' \| 'above' \| 'left' \| 'right'` (or ±1); `label` is TeX (`.label` is its Tex mob); `draw()` draws then fades the label in |
| `s.surround(target, { color = C.yellow, pad = 10, radius = 12 })` | front layer; target is a mob or a box `{ x, y, w, h }`; `draw()` traces it; `retarget(target, { duration })` *anim* |
| `s.underline(target, { color = C.yellow, gap = 6 })` | front-layer line under the target; `draw()` |

```js
const eq = s.tex('A\\mathbf{x} = \\mathbf{b}', { y: 200 });
const box = s.surround(eq, { visible: false });
const b = eq.box();
const br = s.brace(b.x, b.y + b.h + 8, b.x + b.w, b.y + b.h + 8, { label: '\\text{matrix equation}', visible: false });
// steps: await box.draw(); await br.draw(); await box.retarget(otherMob);
```

## Matrix (`src/viz/matrix.js`)

`s.matrix(rows, { x, y, size = 40, augment = null, colGap, rowGap, rowHeight, compact, color, visible, brackets: '[]' | '()' | '||' | 'none' })`
→ `MatrixMob` on the HTML layer, centered on `x, y`. Entries: `Frac`, number, or string (numeric strings like
`'-3/4'` become Fracs; others are TeX, e.g. `'a_{11}'`). `augment: k` draws the bar before column `k` (0-based).
Sizes at `size: 40`: a 3 × 3 integer matrix is about 240 × 235 px, a 3 × 4 augmented one about 340 wide; with a
fraction in every row a 3 × 3 is about 270 × 350 and a 4 × 5 about 510 × 440. Fractions render as `\dfrac` (display
size) in entries, notes and chips, so their parts stay ≥ 28 px; rows holding one grow to fit. Indices are 0-based; row
labels shown are 1-based (`R_1`). Decimal entries (`'0.9'`, `0.25`) display as written (exact Fracs inside); in a
matrix with decimals, computed entries display as decimals when they terminate. Rows are at least `1.75·size` tall;
`compact: true` (the default for one-column matrices) makes that `1.2·size` with `rowGap` 0; `rowHeight` (px)
overrides the minimum.

| Method | |
| --- | --- |
| `cell(i, j)` | the cell element |
| `cellBox(i, j)`, `rowBox(i)`, `colBox(j)` | stage boxes `{ x, y, w, h, cx, cy }` (for `s.surround`, arrows) |
| `highlightRow(i, color)`, `highlightCol(j, color)`, `highlightCell(i, j, color)` *anim* | soft tinted band (default `C.yellow`) |
| `clearHighlights()` *anim* | removes all bands |
| `setEntry(i, j, value)` *anim* | old value slides up and out, new slides in |
| `setRows(rows)` *anim* | changed entries animate; a different shape crossfades to a rebuilt matrix |
| `swapRows(i, j)` *anim* | rows slide past each other on curved paths |
| `scaleRow(i, k)` *anim* | `×k` chip beside the row, entries update. Chips sit left of the matrix, or right (past the note) when its left edge is within 150 px of the stage edge |
| `addRow(i, j, k)` *anim* | row i += k·row j: ghost of row j (chip `kR_{j+1}`) is scaled, slides onto row i, row i updates |
| `rowOp(step, { note = true })` *anim* | runs an rref step `{ op: 'swap' \| 'scale' \| 'add', i, j, k }`, writing `texRowOp(step)` as row i's note |
| `pivot(i, j, { color = C.blue })` *anim* | ring around an entry (stays); `clearPivots()` *anim* |
| `note(i, tex, { color })` *anim* | TeX right of row i, replacing the previous note; `note()` clears |
| `values()` | current rows (Fracs) — kept in sync with every operation called |
| `m`, `n` | shape |

```js
import { rref } from '../../lectern/src/core/linalg.js';
const A = [[0, 2, 4, 2], [1, 1, 1, 3], [2, 4, 6, 8]];
const m = s.matrix(A, { x: 360, augment: 3 });
// step: for (const st of rref(A, { augmented: 1 }).steps) await m.rowOp(st);
```

## Plane (`src/viz/plane.js`)

`s.plane({ x = 480, y = 300, width = 520, height, range = [-5, 5, -4, 4], step = 1, grid = true, axes = true,
labels = true, labelStep, names, visible })` → `Plane`. `height` defaults to square units; `names: ['x_1', 'x_2']`
labels the axes. Objects live inside the plane: `p.fadeIn()`, `p.fadeOut()`, `p.shift()` carry them (and their
labels). Objects are clipped to the plane's rectangle and their labels' anchors are kept inside it. `p.draw()` *anim*
draws grid and axes, then fades tick labels in. `p.toStage([a, b])` → stage point.

| Method | Returns |
| --- | --- |
| `p.vector([a, b], { color = C.blue, label, labelColor, width = 5, tail = [0, 0], transform = true })` | vector from `tail` to `tail + [a, b]` (`coords` is the displacement, so `moveTail` slides it without changing it): `grow()` *anim* (also `draw()`), `moveTo([a, b])` *anim* (new displacement), `moveTail([a, b])` *anim*, `setCoords`, `setTail`, `setLabel(tex)`, `.label` (Tex), `.coords`, `.tail`, `tipModel()` |
| `p.point([a, b], { color, label, r = 9 })` | point: `draw()` *anim* pops, `moveTo([a, b])` *anim* |
| `p.line({ through, dir } \| { a, b, c }, { color, width, dash })` | line (`ax + by = c`), clipped to the plane; `draw()`, `moveTo({ … })` *anim* |
| `p.span(v, { color = C.yellow })` | the line through 0 along `v` |
| `p.polygon(pts, { color, fill })`, `p.parallelogram(u, v, opts)` | polygon (soft fill by default); `draw()`, `morphTo(pts)` *anim* |
| `p.label([a, b], tex, { color, size = 36, offset = [dx, dy], anchor })` | TeX pinned to a point; `anchor` is `[ax, ay]` (the label's point placed there, `[0, 1]` = bottom-left) or `'above' \| 'below' \| 'left' \| 'right' \| 'above left' \| …` (8 px gap); `draw()` fades in, `moveTo([a, b])` *anim* |
| `p.basis(opts)` | `{ i, j }`: î (green), ĵ (red) vectors with labels; grow them to show |
| `p.addTip(u, v, opts)` *anim* | moves v's tail to u's tip (tip-to-tail) |
| `p.applyMatrix(M, { duration = 1600, ghost = true, interp = 'auto' })` *anim* | grid, axes and every object with `transform` ≠ false move from I to M; maps compose; `ghost` keeps a faint copy of the original grid; tick labels fade. `interp`: `'linear'` blends (1 − t)I + tM; `'polar'` writes M = R·S and turns R by t·θ while blending S (rotations keep their size); `'auto'` uses polar for rotating maps (det > 0, not symmetric) whose linear blend would squash the plane, linear otherwise (shears, stretches, reflections) |
| `p.resetMatrix()` | instant back to the identity |
| `p.matrix` | the grid's current map |

`M` may hold numbers or Fracs. An object made after a map starts at its given coordinates; later maps move it.

```js
const p = s.plane({ x: 600, width: 600 });
const { i, j } = p.basis({ visible: false });
const x = p.vector([2, 1], { color: C.yellow, label: '\\mathbf{x}', visible: false });
// steps: await s.all(i.grow(), j.grow(), x.grow()); await p.applyMatrix([[1, 1], [0, 1]]);
```

## Space (`src/viz/space.js`)

`s.space({ x = 480, y = 300, size = 440, range = 3, yaw = -35, pitch = 20, axes = true, names = ['x_1', 'x_2', 'x_3'], visible })`
→ `Space`: orthographic view of the box [−range, range]³, x₃ up. `size` is the on-stage length of one axis.
Objects are depth-sorted (far first) whenever the camera moves. `sp.draw()` *anim* grows the axes.

| Method | Returns |
| --- | --- |
| `sp.vector([x, y, z], { color, label, width, tail })` | vector, same API as the plane's (`grow`, `moveTo([x, y, z])`, `moveTail`, `setLabel`) |
| `sp.point([x, y, z], { color, label })` | point: `draw()`, `moveTo([x, y, z])` |
| `sp.line(through, dir, { color, width, dash })` | the line, clipped to the box |
| `sp.segment(a, b, { color, width, dash })` | segment a→b; `draw()`, `moveTo([a, b])` *anim* |
| `sp.rightAngle(at, u, v, { size = 0.3, color, width })` | right-angle mark at `at` between directions u and v; re-projects with the camera |
| `sp.plane(u, v, { color = C.blue, fill, extent, center })` | translucent patch with corners center ± e·u ± e·v (center default 0; default `e` spans ~0.8·range) |
| `sp.plane({ normal, d }, { color, extent, center })` | square patch of half-width `extent` (default 0.8·range) on n·x = d, centered at the projection of `center` onto the plane (default: the point of the plane nearest 0) |
| `sp.label([x, y, z], tex, opts)` | pinned TeX |
| `sp.rotate(yaw, pitch, { duration = 1200 })` *anim* | camera move (omit one to keep it) |
| `sp.orbit(deg = 360, duration = 6000)` *anim* | constant-speed turn about the vertical |
| `sp.setCamera(yaw, pitch)` | instant |
| `sp.project([x, y, z])`, `sp.toStage([x, y, z])` | stage point (without / with the space's translation) |

```js
const sp = s.space({ y: 310, visible: false });
const u = sp.vector([2, 0, 1], { label: '\\mathbf{u}', visible: false });
const v = sp.vector([0, 2, 1], { color: C.red, label: '\\mathbf{v}', visible: false });
const P = sp.plane([2, 0, 1], [0, 2, 1], { color: C.teal, visible: false });
// steps: await sp.draw(); await s.all(u.grow(), v.grow()); await P.draw(); await sp.orbit(90, 4000);
```

## Rules these components follow

- Labels attached to shapes and plane/space objects (`v.label`, `brace.label`) follow their owner's position and
  opacity *multiplied* by their own, so `v.label.fadeOut()` / `fadeIn()` stick.
- All motion runs on `stage.clock`; with `clock.instant` each call lands exactly in its end state, and a killed
  clock (`s.reset()`) resolves pending calls without errors.
- Matrix values update when an operation is *called*; await each operation before starting the next one on the
  same matrix.
- Building blocks for new components (`Shape`, `VectorBase`, `PointBase`, `ModelPolygon`, `ModelLabel`, `soft`,
  `clipSeg`, `drawParts`) are exported from `shapes.js`.
