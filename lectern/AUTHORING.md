# Writing a lectern lecture

The practical guide, written while building the pilots `matrix/lectures/systems.js` and `row-reduction.js`
(copy from them freely). Read first: `CONTRACT.md` (data model), your subject's `PLAN.md` (style guide + your
lecture's section), `docs/viz-la.md` or `docs/viz-logic.md`, and `docs/viz-common.md` (shared helpers: `s.defCard`,
`s.stamp`, `s.scratch`, `s.strike`, `s.ring`, `s.symbols`; use them, don't copy local versions).
Subject-specific extras: `foundations/AUTHORING-notes.md`.

## File skeleton

```js
import { C, FILL } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, rref, solve, texMat, texRowOp } from '../../lectern/src/core/linalg.js';

// ---- data: every matrix, step and answer computed here, at module top level (pure; no DOM)
const SYS = mat([[1, 1, 1, 6], [0, 1, 2, 8], [2, 1, -1, 1]]);
const RED = rref(SYS, { augmented: 1 });
const FWD = RED.steps.filter((st) => st.phase === 'forward');

// ---- small TeX / scene helpers (lin(), eqTex(), substTex(), shared scene builders)

export default {
  id: 'systems', title: 'Systems of linear equations',
  goals: ['…'],
  beats: [ /* in PLAN order, ids exactly as in PLAN */ ],
};
```
- The module must import in Node: DOM only inside `scene`, `do`, `figure`. Do not import `viz/*.js` (the player does).
- Never type an intermediate matrix. Feed `rref(A).steps` to `m.rowOp(step)`; start the next beat at
  `FWD.at(-1).after` or `RED.echelon`; build solution paragraphs with `texMat`, `texRowOp`, `texVec`.
- Reuse computed data in narration-free places only: `say` strings are hashed into clip names, so keep them literal.

## A scene beat

```js
{ id: 'solve-forward', title: 'Eliminate, top to bottom',
  scene(s) {                                   // the starting state; everything new starts { visible: false }
    const m = s.matrix(SYS, { x: 400, y: 300, size: 44, augment: 3 });
    const last = s.tex(eqTex(FWD.at(-1).after[2]), { x: 400, y: 510, size: 40, color: C.yellow, visible: false });
    return { m, last };
  },
  steps: [
    { say: 'Use the $1${one} in the top left corner to clear the $2${two} below it.',
      do: async (s, o) => {
        await s.all(o.m.pivot(0, 0), o.m.highlightCell(2, 0, C.yellow));   // point at what the voice names
        await o.m.rowOp(FWD[0]);                                           // the move itself
        await o.m.clearHighlights();                                       // tidy up for the next step
      } },
  ] }
```
- One idea per step, 2–5 steps per beat, and the first animation starts with the first words.
- `scene()` = state at the *start* of the beat: rebuild the previous beat's final picture there (same positions,
  same sizes) so consecutive beats feel continuous. Things already on screen are created visible.
- Steps must be deterministic: seeking replays `scene()` + steps 0..n-1 instantly. Put anything a later step needs
  on `o` in `scene()` (or assign `o.x = …` inside a step; replays recreate it).
- `do` returns a Promise; the step ends when both the clip and the animation are done. Keep each step's motion
  shorter than its narration (≈ 2.5 words/s) or the learner waits on a silent animation.

## Choreography that works

**Build up, then point.** Write/fade an object in, then highlight the part the voice is talking about.
```js
await o.eq2.write();
await o.l2.draw({ duration: 1100 });
await o.pt.draw(); await s.all(o.pt.flash({ color: C.green }), o.sol.fadeIn());
```
**Transform instead of replace.** Numbers fly out of the equations into the matrix (systems/augmented): mark each
term `\part{t01}{x_2}`, create one Tex per number at `center(sys.partBox('t01'))`, `moveTo` the target
`m.cellBox(i, j)` (measurable while hidden), then crossfade: `s.all(m.fadeIn({ shift: [0, 0] }), nums.fadeOut())`.
For a whole expression, `copy.morphTo(target)` (keep the original on screen by morphing a hidden copy):
```js
do: (s, o) => o.copy.show().morphTo(o.gen, { duration: 1200 })   // equations → general solution
```
**Stagger lists** so the eye follows: `s.stagger(items.map((c) => () => c.write()), 1300)`; for cells,
`s.stagger(cells.map(([i, j]) => () => m.highlightCell(i, j)), 150)`.
**Values that change in place:** `tex.swap(newTex)` (x₃ = 0 → 1 → −1 with `await s.wait(900)` between).
**Make room, don't clutter:** `s.all(m.shift(-140, 0), m.note())` before adding a side picture; fade out what is done
(`sp.fadeOut()`) before the next idea. Shift companions together (`o.m.shift(dx, 0)`, `o.stairs.shift(dx, 0)`).
**Mistake beats:** do the wrong thing for real (`m.setRows(wrong)`), yellow surround/highlight on it, show the
consequence (a point that now "solves" it), then restore and do it right. Strike-through:
`await s.strike(mob, { color: 'yellow' })` (draws the line and mutes the mob); circle a symbol: `s.ring([tex, 'name'])`.
**3D:** `s.space` with `sp.plane({ normal, d }, { center: p, extent })` (patches around the point that matters),
`sp.orbit(40, 4500)` as the last step of a beat, while the voice talks.
**Flowcharts:** `s.text` + `s.rect` measured from `txt.box()` in `scene()`, `s.arrow` between box edges, drawn in
narration order (row-reduction/summary-rref `node()` helper).

## Layout on the 960 × 600 stage

- The beat title is an `<h2>` above the stage and captions sit below it: don't repeat either on stage.
- Safe area: x 40–920, y 30–570. Nothing closer than ~30 px to an edge (check labels and matrix notes).
- Two-column beats: text/equations centered at x ≈ 200–250, the figure at x ≈ 620–720. Text-plus-matrix:
  matrix at x ≈ 360–400 leaves 300 px on the right for `m.note()` / `rowOp` labels (`R_3 \to R_3 - 2R_1` ≈ 230 px).
- Three panels: x = 170 / 480 / 790, width 260 each; captions under them at size 30–32.
- Theorems and definitions: `s.defCard({ kind: 'theorem', title: 'Theorem 2 (…)', body: '…', width: 880, y: 95 })`
  at the top, or `width: 390` beside a matrix; show it with `card.reveal()`. Plain `s.text` wraps only with `width`.
- Sizes: body math 36–44, a hero equation 48, side notes/labels 30–32, never below 30. Matrices: `size: 44`
  for 3 × 5, 48 for a 4 × 5 shape demo, 32–34 when it is a thumbnail.
- Planes: `width: 480–500` with `range` padded one unit past every labelled point (point labels sit above-right and
  collide with the axis name if a point is at the top edge). Small panels: `labels: false`.
- `figure(s)` of an interlude is shown at ≤ 520 px wide (≈ 0.54 scale): use `size: 50–60` and big labels, and
  leave room at the top (the card header). Figures run in instant mode, so highlights/pivots can be set directly.

## Colors (semantic, from `C`; see PLAN style guide)

blue = given data / first object / pivot rings, red = second, teal/orange = third/fourth, green = the result,
checks, answers; yellow = attention (the entry being worked on, the trap); muted = ghosts, done, labels; purple =
eigen-anything (matrix) or definitions (foundations). Inside TeX, color with stage colors via
`\col{green}{\checkmark}` / `\col{yellow}{x_3}` (KaTeX's own `\textcolor` rejects the CSS variables). Animated
recoloring in a step: mark `\part{name}{…}` and `tex.color('name', C.green)`. `m.note(i, tex, { color })` colors a note.

## Narration

- `$tex${spoken words}` for every bit of math, numbers included when they are math: `$-1${minus one}`. No `}`
  inside the spoken braces, no stray `$`. Row ops: "R three becomes R three minus two R one".
- Ask, then answer; name the picture before the symbol; "Here's the trap…" for mistakes. No "welcome back".
- The engine writes row ops as `R_i \to …` (`texRowOp`); say/write the same in your own TeX for consistency.

## Interlude recipes

- **try** (choice): 3–4 choices, every one with a `why` naming the misconception; the right one's `why` gives the
  reason. `hint` one sentence; `solution` 2–4 paragraphs that redo the problem. Compute the answer id when you
  can (`REDUCED = keys.filter((k) => isEchelon(CANDS[k], { reduced: true }))`).
- **blanks**: TeX strings alternate with blanks. A string after a blank that starts with an operator must begin
  `'{} + …'` (and end `'… - {}'` before a blank), else KaTeX renders a unary sign. Typed blanks take answer specs
  computed from your data (`String(FREE[0][4])`); chips are TeX and must contain `answer`. A vector or matrix
  answer is a matrix blank (`{ matrix: [[cell, …]], augment }`, cells TeX strings or blank objects; see the
  `blanks.js` header), never "entry 1 = □, entry 2 = □".
- **workout**: write one function `item(data) → { prompt, answer, hints, solution }` and use it for both the fixed
  problem and `generate(rand)`. `generate` may also return `hints` (they override the beat's; otherwise the base
  hints would talk about the wrong numbers). Loop until the draw is nice: reject by the actual rref steps
  (integer forward phase, denominators ≤ 6, entries ≤ 20), not just by the answer. `rand.int`, `rand.pick`,
  `rand.nonzero`, `rand.shuffle` come from `core/hash.js`; never `Math.random`. Solutions show every row operation
  with the matrix it produces, as a markdown list:
  ``steps.map((st) => `- $${texRowOp(st)}$: $${texMat(st.after, { augment })}$`).join('\n')``. Hints must match the
  route the solution takes (if a hint says "swap rows 2 and 3", pass that op list instead of rref's steps).
- **explain**: exactly one per lecture near the end; `points` are the 3–5 ideas a good answer contains.
- Display math in prompts: `$$…$$` (md.js); an `aligned` system: `\\begin{aligned} … &= … \\end{aligned}`.

## Pitfalls I hit

1. KaTeX `array` has no `@{}` column specs and wide default column gaps; for systems with variables in columns use
   `\begin{alignedat}{n+1}` with cells `x_1 & {}+{} & x_2 & … & {}={} & 6` (systems.js `systemArray`).
2. `morphTo` moves the *source* to the target (with `keep`, it stays there): to keep the original, morph a copy.
3. `s.surround(matrixMob)` draws inside the brackets; surround rows (`m.rowBox(i)`), columns, or a
   `s.group(...).box()` of side notes instead.
4. Calls like `m.pivot(…)` in `scene()` animate once when the beat starts (the clock is not instant during
   scene); fine for "already there" state, but don't rely on them being complete before step 1 measures things.
5. Navigating to `#/l/<lecture>/<beat>` resumes the saved step: clear `localStorage` when screenshotting.
6. Headless Chromium may run rAF at ~2 fps and the clock caps dt at 64 ms, so real-time playback there is ~8×
   slow. Check layouts by keyboard stepping (→ is instant) and check timing in a real browser.
7. `x_1 = -0` style artifacts: substitution helpers must parenthesize zero/negative values (`substTex`).

## Checklist before you finish

- [ ] Beat ids, order and kinds exactly as in PLAN (note any deviation in your report).
- [ ] Every number on stage, in prompts, hints and solutions comes from `linalg.js`; `generate` is deterministic
      for a seed and its answers self-check.
- [ ] Each `say` 1–3 sentences, all math as `$tex${words}`; every step animates something the voice names.
- [ ] Step through every beat with → and back with ←; seek with the scrubber; screenshot `.lx-stage` at the end
      of each beat: nothing overlaps, nothing within 30 px of an edge, all text ≥ 30.
- [ ] Interlude figures readable at 520 px; blanks spacing correct; workout "New numbers" gives sane problems.
- [ ] Module imports in Node (`node -e "import('./matrix/lectures/<id>.js')"`), then `npm test`.
