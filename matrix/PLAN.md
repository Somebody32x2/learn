# Matrix Algebra: lecture plan

The design for every lecture in `course.js` (WashU MATH 3300, Lay, *Linear Algebra and Its Applications*, 5th-edition
section numbers). Authors turn each entry below into `lectures/<id>.js` following `lectern/CONTRACT.md`. Beat ids
here are final (they become progress keys). Every number below was chosen so answers stay small and was checked
with `core/linalg.js`; still recompute every figure and answer key with `linalg.js` in the lecture file (never type
a reduced matrix by hand), and let the tests catch drift.

## Style guide for authors

**Voice.** A warm, precise professor sitting next to one student. Second person ("you"), contractions fine,
short sentences, one idea per `say` (1–3 sentences). Never "In this video", "welcome back", "smash", or filler
praise. Ask a question, then answer it ("So what does row two say? It says…"). Name the picture before the
symbol: the geometric intuition comes first, then the definition or theorem in Lay's words, then a fully worked
example, then the common mistake ("Here's the trap…"), then practice.

**Narration math.** Every formula in a `say` is `$tex${spoken words}`: `$A\mathbf{x} = \mathbf{b}${A x equals b}`.
Say "x one", "A inverse", "the null space of A", "R n", "lambda", "A transpose". Never a bare `$…$`.

**Notation (Lay's).** Vectors bold: `\mathbf{v}`, `\mathbf{x}`, `\mathbf{b}`, `\mathbf{e}_1`; scalars italic;
entries `x_1, x_2`. Spaces `\mathbb{R}^n`, `\mathbb{P}_n`, `M_{m\times n}`, `C[a,b]`. Augmented matrix `[A \mid \mathbf{b}]`
(drawn with `s.matrix(..., { augment: n })`). `A^{-1}`, `A^T`, `\det A`, `\operatorname{Nul} A`, `\operatorname{Col} A`,
`\operatorname{Row} A`, `\operatorname{rank} A`, `\dim V`, `\operatorname{Span}\{\mathbf{v}_1,\dots,\mathbf{v}_p\}`,
`[\mathbf{x}]_{\mathcal{B}}`, `\underset{\mathcal{C}\leftarrow\mathcal{B}}{P}`, `\hat{\mathbf{y}} = \operatorname{proj}_W \mathbf{y}`,
`W^\perp`, `\langle \mathbf{u}, \mathbf{v}\rangle`, `\|\mathbf{v}\|`. Row operations are written `R_2 \leftarrow R_2 - 2R_1`
(use `texRowOp` from `linalg.js`; `m.note(i, tex)` shows it beside the row). Equations use `x_1, x_2, x_3`, never `x, y, z`,
except when graphing in the plane where the axes are labelled `x_1`, `x_2`.

**Colors** (`C` from `core/stage.js`, always semantic, never decorative):
- `C.blue` first vector / first column / the given data (b, y, the starting vector).
- `C.red` second vector / second column.
- `C.green` the result: a solution, the output `A\mathbf{x}`, a projection, the answer box.
- `C.yellow` attention: the entry or row being worked on right now, pivots (`m.pivot`), the trap in a mistake beat.
- `C.purple` anything eigen: eigenvectors, eigenvalues, eigenspaces, diagonal D.
- `C.teal` / `C.orange` only for a third and fourth object when blue/red are taken (third column, third vector).
- `C.muted` for ghosts (the "before" picture, `ghost: true` grids), labels, and things already dealt with.
- `p.basis()` keeps its own defaults for the standard basis vectors; don't recolor them.

**Components** (full reference: `lectern/docs/viz-la.md`; `augment: k` draws the bar before column k, so `[A | b]` with 3 unknowns is
`augment: 3`). `s.matrix(rows, { augment, x, y, size })` with `highlightRow/Col/Cell`, `swapRows(i, j)`,
`scaleRow(i, k)`, `addRow(i, j, k)`, `rowOp(step)` (feed it `rref(...).steps` from `linalg.js`), `pivot(i, j)`,
`note(i, tex)`, `setEntry`, `setRows`. `s.plane({ range, width })` with `vector`, `point`, `line({a, b, c})`,
`span(v)`, `polygon`, `parallelogram(u, v)`, `label`, `basis()`, `applyMatrix(M, { ghost })`, `resetMatrix()`,
`addTip(u, v)`. `s.space({ range, yaw, pitch })` with `vector`, `point`, `line`, `plane(u, v)` / `plane({ normal, d })`,
`rotate(yaw, pitch)`, `orbit(deg)`. Shapes: `s.arrow`, `s.brace`, `s.surround(target)`, `s.underline`, `s.rect`, `s.dot`.
Text: `s.tex(latex, { x, y, size })` with `\part{name}{…}` + `part/color/partBox/swap`, `s.text`.

**Pacing.** 12–25 beats per lecture; an interlude after every 3–5 scene beats; scene beats 2–5 steps. Animations
run during the narration of their step: start the motion with the first words, never make the learner wait on a
silent animation longer than ~1.5 s. One new object per step. Reuse the same matrix on screen across consecutive
beats (rebuild it in `scene()` at its final state from the previous beat) so the learner keeps their bearings.
Every lecture: intuition beat(s) → definition/theorem beat(s) with the statement on screen as `s.tex` → worked
example animated step by step → `mistake` beat (yellow surround on the wrong step, then the fix) → summary beat.
Exactly one `explain` per lecture, near the end; one or two `workout`s; the rest `try`/`blanks`.

**Interlude conventions.** `try` choices: 3–4 options, each with a `why` that names the specific misconception.
`solution` is 2–4 short markdown paragraphs that redo the problem, not just the answer. `workout`s marked
**(generate)** need a `generate(rand)` that picks small integer data with the same structure and computes the answer
with `linalg.js` (reject draws whose answers have denominators > 6 or entries > 20 in absolute value).

**Format below.** `scene` beats: id — slide title. *Stage:* what is built and how it moves. *Steps:* the narration,
one numbered item per `say`. Interludes give the actual question, answer spec, choices, hints, and solution outline.

---

# Unit 1 · Linear equations

## 1. `systems` — Systems of linear equations (Lay 1.1 · 14 min)

**Goals**
- Read a linear equation as a line (in ℝ²) or a plane (in ℝ³), and a solution as a common point.
- Know that a system has no solution, exactly one, or infinitely many, and see why in pictures.
- Write a system as an augmented matrix and solve it with the three elementary row operations.
- Explain why row operations never change the solution set (row equivalence).

**Misconceptions to address:** "two equations in two unknowns always have one solution"; scaling a row by 0 counts as
a row operation; changing one row by adding a multiple of *itself*; thinking row operations change the answer.

**Beats**
1. `scene` **one-equation** — *One equation is a line.* Stage: `s.plane` range [-1, 5, -1, 4]; tex `x_1 + x_2 = 3` (blue) top
   left; three blue points (0,3), (1,2), (3,0) pop in with `fadeIn`, then `p.line({a:1,b:1,c:3}, {color: C.blue}).draw()`.
   Steps: (1) A linear equation in two unknowns; every pair that satisfies it is a point. (2) Plot a few: they line up.
   (3) Every solution together forms a line; that's why we call it linear.
2. `scene` **two-lines** — *Two equations, one point.* Stage: same plane; add `x_1 - x_2 = 1` (red) and its line drawn; green
   `p.point([2,1], {label: '(2,1)'})` with `indicate()`. Steps: (1) A second equation is a second line. (2) A solution of the
   *system* has to lie on both, so it's where they cross: $x_1 = 2, x_2 = 1$. (3) Check it in both equations (tex rows
   substitute, each gets a green check).
3. `scene` **three-cases** — *None, one, or infinitely many.* Stage: three small planes side by side (width 280 each):
   crossing lines; parallel lines `x_1 + x_2 = 3`, `x_1 + x_2 = 1`; the same line twice (red drawn over blue, dashed). Labels
   "one solution", "no solution (inconsistent)", "infinitely many". Steps: (1) Two lines can cross… (2) be parallel and
   never meet: the system is *inconsistent*. (3) or be the same line. (4) Those are the only three options, for any size
   system: Lay states it right in 1.1.
4. `scene` **planes** — *Three unknowns: planes.* Stage: `s.space` with three planes through (1,2,3) (normals (1,1,1), (0,1,2),
   (2,1,−1)), `orbit(40)` slowly; green point (1,2,3). Steps: (1) In three unknowns each equation is a plane. (2) Three planes
   usually meet in one point; that's our solution later. (3) Drawing won't scale past three unknowns, so we need an algebra
   that does the same thing.
5. `try` **try-cases** — "How many solutions does $x_1 + 2x_2 = 4,\; 2x_1 + 4x_2 = 9$ have?" answer `{ type: 'choice', value: 'none' }`.
   Choices: `none` ✓ (left side of eq. 2 is twice eq. 1 but 9 ≠ 8: parallel lines); `one` (why: "Two equations don't
   guarantee a crossing; compare the left sides."); `inf` (why: "That needs the right side to double too: 8, not 9.").
   Hint: Multiply the first equation by 2. Solution: 2·(eq 1) gives $2x_1 + 4x_2 = 8$, but eq 2 says the same left side is 9;
   no pair does both. Parallel lines, inconsistent.
6. `scene` **augmented** — *Keep only the numbers.* Stage: system tex `x_1 + x_2 + x_3 = 6`, `x_2 + 2x_3 = 8`, `2x_1 + x_2 - x_3 = 1`
   on the left; coefficients fly (`morphTo`) into `s.matrix([[1,1,1,6],[0,1,2,8],[2,1,-1,1]], {augment: 3})`; column 1–3
   highlighted blue as "coefficient matrix", last column green-outlined as **b**. Steps: (1) The variable names are just
   placeholders; the numbers carry everything. (2) This is the augmented matrix $[A \mid \mathbf{b}]${A augmented with b}: the
   coefficient matrix with the right-hand side attached. (3) A missing variable is a zero entry; don't skip it.
7. `scene` **row-ops** — *Three moves that don't change the answer.* Stage: tex list of the three elementary row operations
   (replacement $R_i \leftarrow R_i + kR_j$, interchange, scaling by $k \ne 0$) with tiny demo matrix [[2,4],[1,3]] doing each
   (`addRow`, `swapRows`, `scaleRow`) and undoing it. Steps: (1) Replacement: add a multiple of another row. (2) Interchange:
   swap two rows. (3) Scaling: multiply a row by a *nonzero* constant. (4) Each one can be undone, so the new system has
   exactly the same solutions: Lay calls the matrices *row equivalent*.
8. `blanks` **fill-ops** — Lines: `R_3 \leftarrow R_3 + ` [chips: `-2R_1` ✓, `2R_1`, `-2R_3`] ` \text{ clears the } 2 \text{ in row 3 of } [A\mid\mathbf b]`;
   `\text{Scaling by } k \text{ is allowed only if } k \ne ` [typed number 0]. Solution: to zero out 2 you subtract twice
   row 1; scaling by 0 erases an equation and can't be undone.
9. `scene` **solve-forward** — *Eliminate, top to bottom.* Stage: the matrix from beat 6, run `rref(A,{augmented:1}).steps`
   forward phase with `m.rowOp(step)` + `m.note`: $R_3 \leftarrow R_3 - 2R_1$ → `[0,-1,-3,-11]`; $R_3 \leftarrow R_3 + R_2$ →
   `[0,0,-1,-3]`. Yellow `highlightCell` on the entry being cleared. Steps: (1) Use the 1 in the top-left to clear the 2
   below it. (2) Now use the 1 in row 2 to clear the −1 under it. (3) The matrix is now a staircase: the last row says
   $-x_3 = -3${minus x three equals minus three}.
10. `scene` **solve-back** — *Back-substitute.* Stage: same matrix continues with the backward steps (scale R3 by −1, $R_2 \leftarrow R_2 - 2R_3$,
    $R_1 \leftarrow R_1 - R_3$, $R_1 \leftarrow R_1 - R_2$) ending `[[1,0,0,1],[0,1,0,2],[0,0,1,3]]`; last column `highlightCol(3, C.green)`;
    then `s.space` inset shows the green point (1,2,3). Steps: (1) $x_3 = 3$. (2) Clear upward. (3) Read it off: $(x_1, x_2, x_3) = (1, 2, 3)$.
    (4) Always check in the original equations; on screen each original row gets a green check.
11. `scene` **mistake-rowop** — *The trap: changing two rows at once.* Stage: matrix [[1,1,1,6],[0,1,2,8]]; a wrong step
    "$R_1 \leftarrow R_1 - R_2$ and $R_2 \leftarrow R_2 - R_1$ at the same time" done with `setRows`; yellow `s.surround` on both rows;
    then an inline example showing a solution got lost; fix: do them one at a time, each using the *current* rows.
    Steps: (1) A tempting shortcut is to update two rows simultaneously from the old rows. (2) That can secretly combine into a
    non-invertible move and lose information. (3) One operation per step, always reading the current matrix.
12. `try` **try-solution** — "Is $(3, -1, 2)$ a solution of $x_1 + x_2 + x_3 = 4,\; 2x_1 - x_2 + x_3 = 9,\; x_1 + 2x_2 - x_3 = 0$?"
    answer `{ type: 'choice', value: 'no' }`. Choices: `yes` (why: "It satisfies the first two, but plug into the third:
    3 − 2 − 2 = −1, not 0."); `no` ✓. Hint: a solution must satisfy *every* equation. Solution: eq1 4 ✓, eq2 9 ✓, eq3 −1 ✗.
13. `workout` **wo-solve3** **(generate)** — "Solve $x_1 + x_2 + x_3 = 2,\; 2x_1 - x_2 + x_3 = 6,\; x_1 + 2x_2 - x_3 = -1$."
    answer `{ type: 'vector', value: ['2','-1','1'] }`. Hints: (1) Write $[A\mid\mathbf b]$ and clear column 1 below the top
    entry. (2) After $R_2 \leftarrow R_2 - 2R_1$, $R_3 \leftarrow R_3 - R_1$ you have rows $[0,-3,-1\mid 2]$ and $[0,1,-2\mid -3]$;
    swap them to get a 1 pivot. (3) Back-substitute from $x_3$. Solution outline: $[A\mid\mathbf b]$ reduces to $I$ with last
    column $(2,-1,1)$; check: 2 − 1 + 1 = 2, 4 + 1 + 1 = 6, 2 − 2 − 1 = −1. `generate`: pick an integer solution in [−3,3]³
    and an invertible A with entries in [−2,2] and det ±1 or ±2; b = A·x.
14. `explain` **cp-rowops** — "Why do the three row operations never change the solution set of a system?" Points: each
    operation applied to the equations keeps every solution a solution; each operation is reversible by another row
    operation of the same type; so the reverse step brings back the old system and its solutions too (sets equal);
    scaling must use a nonzero constant or it can't be reversed.
15. `scene` **summary-systems** — *What you have now.* Stage: three-case thumbnails shrink to a row, the augmented matrix and
    "row operations preserve solutions" tex list below. Steps: (1) Solutions are intersections; there are 0, 1 or ∞. (2) Row
    operations simplify the matrix without changing the answer. (3) Next: a systematic recipe, row reduction, that tells
    us *which* of the three cases we're in.

---

## 2. `row-reduction` — Row reduction and echelon forms (Lay 1.2 · 16 min)

**Goals**
- Recognize echelon form and reduced echelon form; identify pivot positions and pivot columns.
- Run the row reduction algorithm (forward phase, backward phase) on any matrix.
- Separate basic and free variables and write the general solution.
- Apply the Existence and Uniqueness Theorem: consistent ⇔ no row $[0 \cdots 0 \mid b]$ with $b \neq 0$.

**Misconceptions:** pivots are "the 1s" (they're *positions* determined by the echelon form, not values); the echelon form is unique
(only the *reduced* one is); a zero row means no solution; free variables must be zero; "more unknowns than equations ⇒
infinitely many" (could be none).

**Beats**
1. `scene` **staircase** — *The staircase shape.* Stage: `s.matrix` 4×5 of placeholders (■ for leading entries, * for anything,
   0); yellow `s.path` staircase drawn under the leading entries; `m.pivot` rings appear one by one. Steps: (1) Echelon form
   means a staircase: each row's first nonzero entry sits to the right of the one above. (2) Zero rows sink to the bottom.
   (3) Entries below each leading entry are zero.
2. `scene` **reduced** — *Reduced echelon form.* Stage: same placeholders morph (`setRows`) to RREF: leading entries become 1,
   entries above them become 0 (each animates with `setEntry`). Tex box: Theorem 1 (Uniqueness of the reduced echelon form).
   Steps: (1) Push further: every leading entry is 1, and it's the only nonzero entry in its column. (2) Lots of echelon
   forms are possible, but each matrix row reduces to exactly one *reduced* echelon form. (3) That's why pivot positions are
   well defined: they're where the leading 1s land.
3. `try` **try-which-echelon** — "Which matrix is in reduced echelon form?" with figure of four small matrices:
   (a) [[1,0,2],[0,1,3],[0,0,0]] ✓; (b) [[1,2,0],[0,0,1],[0,1,0]] (why: "Row 3's leading entry is left of row 2's: not a staircase.");
   (c) [[1,3,0],[0,1,0],[0,0,1]] (why: "Echelon yes, but the 3 sits above a leading 1, so not reduced."); (d) [[0,0,0],[1,0,0],[0,1,0]]
   (why: "A zero row must be at the bottom."). answer `{ type: 'choice', value: 'a' }`. Hint: check the staircase, then the
   columns of the leading 1s. Solution: walk each.
4. `scene` **algorithm-forward** — *The algorithm, forward phase.* Stage: `s.matrix([[0,1,-1,2,3],[1,2,0,1,4],[2,5,-1,3,10]], {augment: 4})`;
   steps from `rref(..., {augmented:1})`: swap R1, R2 (`swapRows` with note "$R_1 \leftrightarrow R_2$"), $R_3 \leftarrow R_3 - 2R_1$,
   $R_3 \leftarrow R_3 - R_2$; yellow `highlightCol` for the pivot column each time; pivots ringed. Steps: (1) Step 1: leftmost
   nonzero column; its top must be nonzero, so swap a row up. (2) Clear everything below the pivot. (3) Cover that row and
   repeat on the rest: next pivot in column 2. (4) Now row 3 reads $[0,0,0,-1 \mid -1]$: the next pivot jumps to column 4.
5. `scene` **algorithm-backward** — *Backward phase.* Stage: continue: scale R3 by −1, $R_2 \leftarrow R_2 - 2R_3$, $R_1 \leftarrow R_1 - R_3$,
   $R_1 \leftarrow R_1 - 2R_2$ → `[[1,0,2,0,1],[0,1,-1,0,1],[0,0,0,1,1]]`. Steps: (1) Now work right to left, from the bottom
   pivot up. (2) Make each pivot a 1 and clear above it. (3) This is the reduced echelon form; pivot columns are 1, 2, 4.
6. `scene` **free-variables** — *Basic and free variables.* Stage: RREF from beat 5 rewritten as equations (`s.tex`):
   $x_1 + 2x_3 = 1$, $x_2 - x_3 = 1$, $x_4 = 1$; $x_3$ tinted yellow "free"; then general solution
   $x_1 = 1 - 2x_3,\ x_2 = 1 + x_3,\ x_3 \text{ free},\ x_4 = 1$. A slider-like animation: `s.tex.swap` cycles $x_3 = 0, 1, -1$
   showing three particular solutions. Steps: (1) Pivot-column variables are *basic*; the rest are *free*. (2) Solve each
   equation for its basic variable. (3) Any value of the free variable gives a solution: infinitely many.
7. `blanks` **fill-free** — For RREF `[[1,-3,0,2 | 4],[0,0,1,-1 | 5]]` (shown as a figure): lines
   `x_1 = ` [typed number 4] ` + 3x_2 - ` [typed 2] `x_4`; `x_3 = ` [typed 5] ` + x_4`; `\text{free: }` [chips `x_2, x_4` ✓,
   `x_1, x_3`, `x_4 \text{ only}`]. Solution: pivots in columns 1 and 3, so $x_2, x_4$ are free; move them to the right.
8. `scene` **existence** — *When is a system consistent?* Stage: Theorem 2 tex; then `s.matrix([[1,-2,-1,3,0],[0,0,3,1,3],[0,0,0,0,5]], {augment: 4})`
   with row 3 yellow-highlighted; the tex $0 = 5$ appears beside it. Steps: (1) A system is consistent exactly when the
   rightmost column is *not* a pivot column. (2) That is, no row $[0\ 0 \cdots 0 \mid b]$ with $b$ nonzero. (3) If it's
   consistent: unique solution when there are no free variables, infinitely many when there's at least one.
9. `try` **try-consistent** — figure: echelon form `[[2,1,-1 | 3],[0,0,4 | 8],[0,0,0 | 0]]`. "What does this system have?" answer
   `{ type: 'choice', value: 'inf' }`. Choices: `none` (why: "A zero row $[0\;0\;0\mid 0]$ just says 0 = 0; it's harmless."); `one`
   (why: "Column 2 has no pivot, so $x_2$ is free."); `inf` ✓. Hint: find the pivot columns; is the last column one of them?
   Solution: pivots in columns 1, 3; last column isn't a pivot → consistent; $x_2$ free → infinitely many.
10. `scene` **mistake-zero-row** — *The trap: zero rows and free means zero.* Stage: two side-by-side matrices: `[0 0 0 | 0]` row
    (green "fine") vs `[0 0 0 | 5]` (yellow "inconsistent"); then a wrong general solution "free variable = 0" with yellow
    surround, corrected to "free variable = any real number". Steps: (1) A row of all zeros is harmless; only a nonzero number
    after the bar kills consistency. (2) And "free" means *any* value, not zero: zero gives one solution among infinitely many.
11. `scene` **count-trap** — *More unknowns doesn't mean solutions.* Stage: 2×4 augmented `[[1,1,1 | 1],[1,1,1 | 2]]` reduces with one
    `addRow` to `[0,0,0 | 1]`. Steps: (1) Three unknowns, two equations: surely infinitely many? (2) Not if it's inconsistent.
    (3) What *is* true: if it's consistent, it has free variables, so infinitely many.
12. `workout` **wo-general** **(generate)** — "Find the general solution of the system with augmented matrix
    $\begin{bmatrix}1&-2&1&3&2\\1&-2&0&1&3\\2&-4&1&4&5\end{bmatrix}$." answer `{ type: 'solution', particular: ['3','0','-1','0'],
    basis: [['2','1','0','0'], ['-1','0','-2','1']] }`. Hints: (1) $R_2 \leftarrow R_2 - R_1$, $R_3 \leftarrow R_3 - 2R_1$. (2) Rows 2 and 3
    become equal; one vanishes. (3) RREF is $[1,-2,0,1\mid 3],\ [0,0,1,2\mid -1]$. Solution: $x_1 = 3 + 2x_2 - x_4$,
    $x_3 = -1 - 2x_4$, $x_2, x_4$ free; vector form $(3,0,-1,0) + x_2(2,1,0,0) + x_4(-1,0,-2,1)$. `generate`: build from a random
    RREF with 2 pivots in 4 columns plus a random invertible 3×3 E with small entries: $[A\mid b] = E\cdot$RREF.
13. `try` **try-pivots-count** — "A $3\times 5$ coefficient matrix has 3 pivot columns. Which is guaranteed?" answer
    `{ type: 'choice', value: 'b' }`. Choices: (a) "the system has a unique solution" (why: 5 − 3 = 2 free variables); (b) ✓ "the
    system is consistent for every $\mathbf b$" (a pivot in every row of A, so no row can become $[0\cdots0\mid b]$); (c) "the
    system is inconsistent" (why: nothing forces a bad row). Solution as above.
14. `explain` **cp-pivots** — "Explain how you can tell from an echelon form of $[A\mid\mathbf b]$ whether the system has no solution,
    exactly one, or infinitely many." Points: inconsistent iff a row $[0\cdots0\mid b]$, $b\ne0$ (last column pivot); otherwise
    consistent; unique iff every column of A is a pivot column (no free variables); infinitely many iff at least one free variable.
15. `scene` **summary-rref** — *The recipe.* Stage: flowchart drawn with `s.arrow`/`s.text`: reduce → bad row? → none; free vars? →
    infinite : unique. Steps: (1) Forward to echelon form, back to reduced form. (2) The pivots tell you everything. (3) Next we'll
    read the columns as vectors, and the question "is there a solution" becomes "is $\mathbf b$ in a span".

---

## 3. `vectors-span` — Vector equations and Ax = b (Lay 1.3–1.4 · 16 min)

**Goals**
- Add and scale vectors in ℝⁿ geometrically and algebraically; form linear combinations.
- Understand $\operatorname{Span}\{\mathbf v_1,\dots,\mathbf v_p\}$ as all reachable points; test membership with row reduction.
- Compute $A\mathbf x$ as a linear combination of A's columns (and with the row–vector rule).
- Use Theorem 4: the columns of A span ℝᵐ ⇔ A has a pivot in every row ⇔ $A\mathbf x = \mathbf b$ is consistent for every b.

**Misconceptions:** span of two vectors in ℝ³ is all of ℝ³; $A\mathbf x$ is defined when columns of A ≠ entries of x; "pivot in every
row" checked on $[A\mid\mathbf b]$ instead of A; confusing "is b in the span" with "is b one of the vectors".

**Beats**
1. `scene` **vectors-arrows** — *Vectors as arrows.* Stage: `s.plane` range [-3,5,-2,6]; blue `p.vector([2,4])` grows; then
   `p.vector([-1,1])` red; `p.addTip` slides red to blue's tip; green sum (1,5). Steps: (1) A vector in ℝ² is a list of two
   numbers, drawn as an arrow from the origin. (2) Adding is tip-to-tail; it matches adding entries. (3) Scaling stretches:
   show 1/2 · blue and −1 · red flipping.
2. `scene` **lin-comb** — *Linear combinations.* Stage: plane with $\mathbf a_1 = (1,2)$ blue, $\mathbf a_2 = (-1,1)$ red; tex
   $x_1\mathbf a_1 + x_2\mathbf a_2$; animate weights (via `s.clock.tween` on a counter driving `vector.moveTo`) from (0,0) to
   (2,1), tracing green `(1,5)`. Steps: (1) Scale each vector and add: a linear combination. (2) Weights 2 and 1 land at (1,5).
   (3) Can we reach *every* point this way? Here, yes: the skewed grid of combinations (draw `p.applyMatrix([[1,-1],[2,1]])` ghost
   grid) covers the plane.
3. `scene` **vector-equation** — *Same question, three ways.* Stage: three tex lines appear with `write`:
   $x_1\begin{bmatrix}1\\2\end{bmatrix}+x_2\begin{bmatrix}-1\\1\end{bmatrix}=\begin{bmatrix}1\\5\end{bmatrix}$ ⇔ system
   $x_1 - x_2 = 1,\ 2x_1 + x_2 = 5$ ⇔ `[[1,-1,1],[2,1,5]]` augmented; row reduce (2 steps) to (2,1) green. Steps: (1) Asking for
   weights is a vector equation. (2) Read it row by row and it's an ordinary system. (3) Its augmented matrix has the
   vectors as columns, $[\mathbf a_1\ \mathbf a_2 \mid \mathbf b]$. (4) Weights: $x_1 = 2, x_2 = 1$.
4. `scene` **span-def** — *Span.* Stage: definition tex; `s.space` with blue (1,0,1) and red (0,1,1); `space.plane(u, v)` patch
   fades in, `orbit(60)`; a green point (2,3,5) on the plane, a yellow point (2,3,4) off it. Steps: (1) The span is every linear
   combination: all the points you can reach. (2) Two non-parallel vectors in ℝ³ span a plane through the origin. (3) $(2,3,5)$
   is $2\mathbf u + 3\mathbf v$; $(2,3,4)$ hovers off the plane: not in the span.
5. `try` **try-span-plane** — "Is $\mathbf b = (2,3,4)$ in $\operatorname{Span}\{(1,0,1),(0,1,1)\}$?" answer `{type:'choice', value:'no'}`.
   Choices: `yes` (why: "The first two entries force weights 2 and 3, and then the third entry must be 5."); `no` ✓. Hint: the
   first two entries pick the weights. Solution: $x_1 = 2, x_2 = 3$ from rows 1–2; row 3 needs $x_1 + x_2 = 4$ but it's 5. Reduced
   $[\mathbf a_1\ \mathbf a_2\mid\mathbf b]$ has a row $[0\ 0\mid -1]$.
6. `scene` **ax-columns** — *A times x is a combination of columns.* Stage: `s.matrix([[1,2,-1],[0,-5,3]])` and vector (4,3,7);
   columns highlighted blue, red, teal; weights fly to sit in front of each column: $4\mathbf a_1 + 3\mathbf a_2 + 7\mathbf a_3$
   = (4,0) + (6,−15) + (−7,21) = green (3,6). Steps: (1) Lay *defines* $A\mathbf x$ this way: entries of x weight the columns of A.
   (2) Add them up: $(3, 6)$. (3) So $A\mathbf x$ needs as many entries in x as A has columns.
7. `scene` **row-vector-rule** — *The shortcut: row times vector.* Stage: same; row 1 of A highlighted yellow sliding over x, dot
   product $1\cdot4 + 2\cdot3 + (-1)\cdot7 = 3$ written out, then row 2: $0 - 15 + 21 = 6$. Steps: (1) For hand computation,
   each entry of $A\mathbf x$ is a row of A against x. (2) Same answer; columns tell you what it means, rows are how you compute.
8. `blanks` **fill-ax** — `\begin{bmatrix}2&-1\\1&3\\0&4\end{bmatrix}\begin{bmatrix}3\\-2\end{bmatrix} = \begin{bmatrix}` [typed 8]
   `\\` [typed −3] `\\` [typed −8] `\end{bmatrix}`. Solution: 6 + 2 = 8, 3 − 6 = −3, 0 − 8 = −8.
9. `scene` **three-views** — *One fact, three faces (Theorem 3).* Stage: three tex boxes linked by ⇔ arrows: matrix equation
   $A\mathbf x = \mathbf b$; vector equation $x_1\mathbf a_1 + \cdots + x_n\mathbf a_n = \mathbf b$; augmented $[A\mid\mathbf b]$.
   Steps: (1) These all have the same solution set. (2) So "$A\mathbf x = \mathbf b$ has a solution" means "$\mathbf b$ is in the
   span of the columns."
10. `scene` **theorem-4** — *When do the columns fill ℝᵐ?* Stage: Theorem 4 (a)–(d) tex list; then two examples:
    `s.matrix([[1,2,3],[2,4,6],[0,1,1]])` reduces (2 `rowOp`s) to a zero row (yellow) vs `[[1,0],[0,1],...]`; inset `s.space` shows
    columns of the first spanning only a plane. Steps: (1) For an $m\times n$ matrix A, these are all true or all false. (2) The
    test is a pivot in every row of A, the coefficient matrix, not the augmented one. (3) Here row 3 runs out of pivots, so some
    b's are unreachable: the columns only span a plane.
11. `scene` **mistake-augmented** — *The trap: checking the wrong matrix.* Stage: $[A\mid\mathbf b]$ with pivot appearing in the
    b-column (yellow surround), wrong caption "pivot in every row, so it spans" crossed out. Steps: (1) A pivot in the last
    column of $[A\mid\mathbf b]$ means *inconsistent*, the opposite of spanning. (2) Theorem 4 is about A alone.
12. `try` **try-theorem4** — "A is $3\times 2$. Can the columns of A span $\mathbb R^3$?" answer `{type:'choice', value:'no'}`.
    Choices: `yes-if` "Yes, if the columns aren't parallel" (why: "Two vectors span at most a plane."); `no` ✓; `depends-b` (why:
    "Spanning is about all b at once."). Solution: 2 columns → at most 2 pivots, but 3 rows need 3.
13. `workout` **wo-in-span** **(generate)** — "Is $\mathbf b = (3,-4,2)$ a linear combination of $\mathbf a_1 = (1,-2,0)$ and
    $\mathbf a_2 = (2,-3,1)$? If so, enter the weights $(x_1, x_2)$." answer `{type:'vector', value:['-1','2']}`. Hints: (1) Row
    reduce $[\mathbf a_1\ \mathbf a_2\mid\mathbf b]$. (2) The third row gives $x_2$ directly. Solution: $R_2 \leftarrow R_2 + 2R_1$ →
    $[0,1\mid 2]$; row 3 $[0,1\mid 2]$ agrees, so consistent; $x_2 = 2$, $x_1 = 3 - 4 = -1$; check $-\mathbf a_1 + 2\mathbf a_2 = (3,-4,2)$.
    `generate`: random a1, a2 (entries −3..3, independent) and integer weights in −3..3; b = combo.
14. `explain` **cp-span** — "Why does $A\mathbf x = \mathbf b$ have a solution exactly when $\mathbf b$ is in the span of the columns of A?"
    Points: $A\mathbf x$ is by definition $x_1\mathbf a_1+\cdots+x_n\mathbf a_n$; a solution x is a list of weights that produces b;
    so solutions exist iff some combination of columns equals b, i.e. b ∈ Col span; the entries of x are the weights.
15. `scene` **summary-span** — *Summary.* Stage: the skewed grid picture and $A\mathbf x = x_1\mathbf a_1 + \cdots$. Steps: (1) $A\mathbf x$
    combines columns. (2) Solvable ⇔ b in the span. (3) Pivot in every row ⇔ solvable for all b.

---

## 4. `solution-sets` — Solution sets of linear systems (Lay 1.5 · 13 min)

**Goals**
- Know the homogeneous system $A\mathbf x = \mathbf 0$ always has the trivial solution; it has a nontrivial one iff there's a free variable.
- Write solution sets in parametric vector form.
- See the solution set of $A\mathbf x = \mathbf b$ as $\mathbf p + $ (solutions of $A\mathbf x = \mathbf 0$): a translate (Theorem 6).

**Misconceptions:** the solution set of $A\mathbf x = \mathbf b$ is a subspace (it doesn't contain 0 unless b = 0); parametric form
"x₂ = x₂" rows forgotten (dropping free variable entries); the particular solution is unique (any one works).

**Beats**
1. `scene` **homog-trivial** — *Ax = 0 always has a solution.* Stage: tex $A\mathbf x = \mathbf 0$, green $\mathbf x = \mathbf 0$ with "trivial";
   `s.plane` origin dot pulses. Steps: (1) Homogeneous means the right side is zero. (2) $\mathbf x = \mathbf 0$ always works; Lay
   calls it the trivial solution. (3) The real question: is there a *nontrivial* one? Exactly when there's a free variable.
2. `scene` **homog-plane** — *One equation in ℝ³: a plane.* Stage: tex $x_1 - 2x_2 + x_3 = 0$; then
   $\mathbf x = x_2(2,1,0) + x_3(-1,0,1)$ built term by term (blue, red); `s.space` shows the two vectors and their `plane()` patch
   through origin, orbit. Steps: (1) One equation, two free variables: $x_2$, $x_3$. (2) Solve for $x_1$ and write x as a vector.
   (3) Split by free variables: that's parametric vector form. (4) The solution set is $\operatorname{Span}$ of two vectors: a plane
   through the origin.
3. `blanks` **fill-param** — For RREF of homogeneous system `[[1,0,-3 | 0],[0,1,2 | 0]]`: `\mathbf x = x_3\begin{bmatrix}` [3] `\\` [−2]
   `\\` [1] `\end{bmatrix}`. Hint on last blank: "$x_3 = x_3$: the free variable's own entry is 1." Solution: $x_1 = 3x_3$, $x_2 = -2x_3$.
4. `scene` **worked-homog** — *A worked example.* Stage: `s.matrix([[1,2,-3,0],[2,5,-4,0],[1,3,-1,0]], {augment: 3})` reduced with
   `rowOp` (steps from linalg) to `[[1,0,-7,0],[0,1,2,0],[0,0,0,0]]`; then tex $\mathbf x = x_3(7,-2,1)$; `s.space` draws the line
   (blue `line`). Steps: (1) Row reduce; the last column stays zero, so don't even carry it if you like. (2) $x_3$ is free:
   $x_1 = 7x_3,\ x_2 = -2x_3$. (3) Solutions: every multiple of $(7,-2,1)$, a line through the origin.
5. `scene` **nonhomog** — *Now Ax = b.* Stage: same A with $\mathbf b = (1,4,3)$; reduction to `[[1,0,-7,-3],[0,1,2,2],[0,0,0,0]]`;
   tex $\mathbf x = (-3,2,0) + x_3(7,-2,1)$ with $\mathbf p$ green, $\mathbf v$ blue. Steps: (1) Same row operations, now the last column
   matters. (2) Same free variable, plus constants: $\mathbf x = \mathbf p + x_3\mathbf v$. (3) Set $x_3 = 0$ and you get one particular
   solution $\mathbf p = (-3, 2, 0)$.
6. `scene` **translate** — *A shifted copy (Theorem 6).* Stage: `s.space`: blue line through origin (homogeneous solutions), green
   vector p grows, then a copy of the line slides along p (`shift`) to become the green line; label Theorem 6 tex. Steps: (1) The
   solutions of $A\mathbf x = \mathbf b$ are the homogeneous solutions, translated by p. (2) Parallel line, same direction, now
   through p. (3) This holds whenever $A\mathbf x = \mathbf b$ is consistent, and any particular solution p will do.
7. `try` **try-particular** — "Which of these is also a particular solution of the system in the last example?" answer
   `{type:'choice', value:'b'}`. Choices: (a) $(7,-2,1)$ (why: "That solves $A\mathbf x = \mathbf 0$, not $A\mathbf x = \mathbf b$.");
   (b) ✓ $(4,0,1)$ ($x_3 = 1$); (c) $(-3,2,1)$ (why: "Changing only $x_3$ breaks the first two equations; all entries move with $x_3$.");
   (d) $(0,0,0)$ (why: "$A\mathbf 0 = \mathbf 0 \ne \mathbf b$."). Solution: $\mathbf p + 1\cdot\mathbf v = (-3+7, 2-2, 0+1) = (4,0,1)$.
8. `scene` **mistake-subspace** — *The trap: thinking it passes through 0.* Stage: green shifted line with origin marked yellow,
   clearly off it; tex "$\mathbf 0$ is not a solution when $\mathbf b \neq \mathbf 0$". Steps: (1) Solution sets of $A\mathbf x = \mathbf b$ with
   b nonzero never contain the origin. (2) They look like spans but they're shifted spans; keep the p.
9. `scene` **recipe** — *Writing a solution set (Lay's steps).* Stage: numbered tex list: reduce to RREF; write basic vars in terms
   of free; write x as a vector; split into constants + one vector per free variable. Steps: (1) Four steps. (2) The number
   of vectors in the span equals the number of free variables.
10. `workout` **wo-param** **(generate)** — "Write the solution set of $x_1 + 3x_2 - 5x_3 = 4$, $x_1 + 4x_2 - 8x_3 = 7$, $-3x_1 - 7x_2 + 9x_3 = -6$ in
    parametric vector form." answer `{type:'solution', particular:['-5','3','0'], basis:[['-4','3','1']]}`. Hints: (1) $R_2 - R_1$,
    $R_3 + 3R_1$. (2) Row 3 becomes $[0,2,-6\mid 6]$ = 2·row 2. (3) RREF $[1,0,4\mid -5],[0,1,-3\mid 3]$. Solution: $x_1 = -5 - 4x_3$,
    $x_2 = 3 + 3x_3$; $\mathbf x = (-5,3,0) + x_3(-4,3,1)$; check p: −5 + 9 = 4 ✓, −5 + 12 = 7 ✓, 15 − 21 = −6 ✓.
    `generate`: random rank-2 3×3 A with integer RREF, random p in −3..3, b = A p.
11. `try` **try-free-count** — "A is $3\times 5$ with 2 pivot columns and $A\mathbf x = \mathbf b$ is consistent. Its solution set is the
    translate of a span of how many vectors?" answer `{type:'number', value: 3}`. Hint: one vector per free variable. Solution: 5 − 2 = 3.
12. `explain` **cp-translate** — "Why is every solution of $A\mathbf x = \mathbf b$ of the form $\mathbf p + \mathbf v_h$ with $A\mathbf v_h = \mathbf 0$?"
    Points: if $A\mathbf w = \mathbf b$, then $A(\mathbf w - \mathbf p) = \mathbf b - \mathbf b = \mathbf 0$ so $\mathbf v_h = \mathbf w - \mathbf p$ is
    homogeneous; conversely $A(\mathbf p + \mathbf v_h) = \mathbf b + \mathbf 0$; uses linearity $A(\mathbf u+\mathbf v) = A\mathbf u + A\mathbf v$;
    geometric meaning: the solution set is the homogeneous one shifted by p.
13. `scene` **summary-solsets** — *Summary.* Stage: line through origin and its green translate side by side. Steps: (1) Homogeneous:
    a span. (2) Nonhomogeneous: the same span, shifted by one particular solution.

---

## 5. `independence` — Linear independence (Lay 1.7 · 13 min)

**Goals**
- State the definition of linear (in)dependence and find a dependence relation.
- Test independence of the columns of A by solving $A\mathbf x = \mathbf 0$.
- Use the shortcuts: one vector; two vectors (multiples); more vectors than entries (Theorem 8); a zero vector (Theorem 9).
- Characterize dependence: some vector is a combination of the others (Theorem 7).

**Misconceptions:** "dependent means *every* vector is a combination of the others"; checking pairs is enough for three vectors
(no two parallel ≠ independent); "more vectors than entries" read backwards (fewer vectors ⇒ independent is false).

**Beats**
1. `scene` **redundant** — *A redundant arrow.* Stage: `s.space`, blue $\mathbf v_1 = (1,1,0)$, red $\mathbf v_2 = (0,1,1)$, their plane patch;
   teal $\mathbf v_3 = (1,3,2)$ grows and lies *in* the plane; then `v1 + 2v2` tip-to-tail shown green ending at v3. Steps: (1) Two
   vectors span a plane. (2) Add a third: if it's already in that plane, it adds nothing new. (3) Here $\mathbf v_3 = \mathbf v_1 + 2\mathbf v_2$:
   redundant. That's dependence.
2. `scene` **definition** — *The definition.* Stage: tex $x_1\mathbf v_1 + \cdots + x_p\mathbf v_p = \mathbf 0$ with "only the trivial
   solution ⇒ independent"; "a nontrivial solution ⇒ dependent; that equation is a *linear dependence relation*"; then
   $\mathbf v_1 + 2\mathbf v_2 - \mathbf v_3 = \mathbf 0$ green. Steps: (1) Lay's definition is about the zero vector. (2) If the only way to
   reach 0 is all weights zero, the set is independent. (3) Otherwise you can write down a dependence relation like this one.
3. `scene` **columns-test** — *Test with one row reduction.* Stage: `s.matrix([[1,0,1],[1,1,3],[0,1,2]])` columns colored blue/red/teal; rowOps
   to `[[1,0,1],[0,1,2],[0,0,0]]`; column 3 has no pivot (yellow). Steps: (1) Put the vectors in as columns; independence of the
   columns ⇔ $A\mathbf x = \mathbf 0$ has only the trivial solution. (2) A free variable means a nontrivial solution. (3) Here
   $x_3$ is free: take $x_3 = -1$ and read $x_1 = 1, x_2 = 2$, the relation we saw.
4. `try` **try-pivot-indep** — "The columns of a $4\times 3$ matrix A give an echelon form with pivots in columns 1, 2, 3. Are the columns
   independent?" answer `{type:'choice', value:'yes'}`. Choices `yes` ✓; `no` (why: "Four rows vs three columns is fine; what
   matters is a pivot in every *column*."). Solution: no free variables → only trivial solution.
5. `scene` **two-vectors** — *Two vectors: just look.* Stage: `s.plane` with (2,1),(4,2) collinear (yellow) vs (2,1),(−1,1).
   Steps: (1) Two vectors are dependent exactly when one is a multiple of the other. (2) Geometrically: they lie on one line.
6. `scene` **too-many** — *Theorem 8: too many vectors.* Stage: `s.plane` with three vectors (1,2),(3,4),(5,7); matrix 2×3 shows at most two
   pivots, third column free (yellow). Steps: (1) If you have more vectors than entries, $p > n$, they must be dependent. (2)
   Reason: at most n pivots, so some column is free. (3) Theorem 9: any set containing $\mathbf 0$ is dependent too.
7. `try` **try-which-dependent** — "Select every set that is linearly dependent." answer `{type:'multi', value:['a','c','d']}`.
   Choices: (a) $\{(1,2),(3,4),(5,7)\}$ in ℝ² ✓ (three vectors in ℝ²); (b) $\{(1,0,0),(1,1,0),(1,1,1)\}$ (why: "Triangular, three pivots:
   independent."); (c) $\{(1,-2,3),(0,0,0)\}$ ✓ (contains 0); (d) $\{(2,-4,6),(-1,2,-3)\}$ ✓ (one is −2 times the other).
   Hint: run the shortcuts before computing. Solution: as listed.
8. `scene` **theorem-7** — *Dependent means someone is redundant (Theorem 7).* Stage: tex of Theorem 7; the relation $\mathbf v_1 + 2\mathbf v_2 - \mathbf v_3 = \mathbf 0$
   solved for v3 (`swap`). Steps: (1) A set of two or more vectors is dependent iff at least one is a combination of the others.
   (2) Careful: *at least one*, not each. Example: {(1,0),(2,0),(0,1)}: (0,1) is not a combination of the others, yet the set is dependent.
9. `scene` **mistake-pairs** — *The trap: checking pairs.* Stage: v1, v2, v3 from beat 1 with three "not parallel ✓" ticks per pair, then
   yellow surround: still dependent. Steps: (1) No two of these are parallel. (2) But together they're dependent: v3 lies in the
   plane of the other two. (3) For three or more vectors, row reduce.
10. `workout` **wo-h** — "For which value of $h$ is $\{(1,-1,2),\ (2,1,1),\ (0,3,h)\}$ linearly dependent?" answer `{type:'number', value: -3}`.
    Hints: (1) Put them in a matrix and row reduce, keeping h. (2) After the forward phase the last row is $[0,0,h+3]$.
    Solution: $R_2 + R_1$: $(0,3,3)$; $R_3 - 2R_1$: $(0,-3,h)$; $R_3 + R_2$: $(0,0,h+3)$. Dependent iff no pivot in column 3, iff $h = -3$;
    check: $-2\mathbf v_1 + \mathbf v_2 = (0,3,-3)$.
11. `blanks` **fill-indep** — `\text{columns of } A \text{ independent} \iff A\mathbf x = \mathbf 0 \text{ has }` [chips: `\text{only the trivial solution}` ✓,
    `\text{a solution}`, `\text{a free variable}`]; `\text{Six vectors in } \mathbb R^4 \text{ are always }` [chips `\text{dependent}` ✓,
    `\text{independent}`, `\text{spanning}`].
12. `explain` **cp-indep** — "Explain why more than n vectors in ℝⁿ must be linearly dependent." Points: put them as columns of an
    $n\times p$ matrix with $p>n$; there are at most n pivots (one per row); so at least $p-n$ columns are free; a free variable gives a
    nontrivial solution of $A\mathbf x = \mathbf 0$, a dependence relation.
13. `scene` **summary-indep** — *Summary.* Stage: plane with independent pair vs space with dependent triple. Steps: (1) Independent:
    only the trivial combination makes 0. (2) Test: pivot in every column. (3) Next lecture we let a matrix *act* on vectors.

---

## 6. `linear-maps` — Linear transformations and their matrices (Lay 1.8–1.9 · 17 min)

**Goals**
- See a matrix as a transformation $T(\mathbf x) = A\mathbf x$ from ℝⁿ to ℝᵐ; domain, codomain, image, range.
- Know the linearity properties and that $T(\mathbf 0) = \mathbf 0$.
- Find the standard matrix $A = [T(\mathbf e_1)\ \cdots\ T(\mathbf e_n)]$ of a linear map (rotations, reflections, shears, projections).
- Decide onto (pivot in every row) and one-to-one (pivot in every column; only trivial kernel).

**Misconceptions:** "linear" means its graph is a line (so $x\mapsto x+1$ seems linear); confusing codomain and range; onto ⇔
one-to-one in general (only for square); composition order of matrices reversed.

**Beats**
1. `scene` **machine** — *A matrix moves vectors.* Stage: `s.plane` range [-4,4,-3,3]; blue $\mathbf x = (1,2)$; tex
   $A = \begin{bmatrix}1&1\\0&1\end{bmatrix}$; green $A\mathbf x = (3,2)$ grows; then `p.applyMatrix([[1,1],[0,1]], {ghost:true})` moves the whole grid
   (blue vector rides to green). Steps: (1) Feed x in, get Ax out: a transformation from ℝ² to ℝ². (2) Watch every point move at
   once. (3) Grid lines stay straight, parallel, evenly spaced, and the origin stays put. That's what linear looks like.
2. `scene` **defs** — *Domain, codomain, range.* Stage: two blobs ℝⁿ, ℝᵐ with arrows (`s.arrow`), range highlighted inside codomain;
   tex for $T:\mathbb R^n \to \mathbb R^m$. Steps: (1) The domain is where inputs live; codomain where outputs live. (2) The
   range is the set of outputs that actually happen: for $T(\mathbf x)=A\mathbf x$ it's the span of the columns.
3. `scene` **linearity** — *What linear means.* Stage: tex (i) $T(\mathbf u + \mathbf v) = T(\mathbf u) + T(\mathbf v)$, (ii) $T(c\mathbf u) = cT(\mathbf u)$;
   plane demo: parallelogram of u, v moves under shear and stays a parallelogram with the sum on its corner. Then counterexample
   $T(x_1,x_2) = (x_1 + 1, x_2)$: origin moves (yellow). Steps: (1) Two rules: sums go to sums, scalings to scalings.
   (2) Consequence: $T(\mathbf 0) = \mathbf 0$. (3) Shifting by one breaks that, so it's not linear, even though it looks simple.
4. `try` **try-linear** — "Which map $\mathbb R^2\to\mathbb R^2$ is linear?" answer `{type:'choice', value:'c'}`. Choices: (a) $T(x_1,x_2) = (x_1+1, x_2)$
   (why: "$T(\mathbf 0) = (1,0) \ne \mathbf 0$."); (b) $T(x_1,x_2) = (x_1x_2, x_2)$ (why: "Doubling x quadruples the first entry."); (c) ✓
   $T(x_1,x_2) = (3x_2, x_1 - x_2)$; (d) $T(x_1,x_2) = (|x_1|, x_2)$ (why: "$T(-\mathbf e_1) = \mathbf e_1 \ne -T(\mathbf e_1)$."). Solution: (c) is $A\mathbf x$
   with $A = \begin{bmatrix}0&3\\1&-1\end{bmatrix}$.
5. `scene` **basis-trick** — *Watch where the basis goes.* Stage: `p.basis()`; apply $A = \begin{bmatrix}2&-1\\1&3\end{bmatrix}$; î lands on (2,1),
   ĵ on (−1,3); those become the columns of a matrix (columns flash in the basis colors); then x = (3,1) = 3î + ĵ goes to
   $3(2,1) + (-1,3) = (5,6)$ green. Steps: (1) Every x is $x_1\mathbf e_1 + x_2\mathbf e_2$. (2) So by linearity $T(\mathbf x) = x_1T(\mathbf e_1) + x_2T(\mathbf e_2)$.
   (3) Theorem 10: the standard matrix is $[T(\mathbf e_1)\ T(\mathbf e_2)]$. Two arrows determine everything.
6. `scene` **gallery** — *A gallery of maps.* Stage: plane with an "F" polygon (`p.polygon`, blue fill); apply in turn (with `resetMatrix`
   between): rotation 90° $\begin{bmatrix}0&-1\\1&0\end{bmatrix}$, reflection across $x_2 = x_1$ $\begin{bmatrix}0&1\\1&0\end{bmatrix}$,
   horizontal shear, projection onto $x_1$-axis $\begin{bmatrix}1&0\\0&0\end{bmatrix}$, each matrix tex appearing first. Steps: (1)
   Rotation: î goes to ĵ, ĵ to −î. (2) Reflection swaps them. (3) Shear tilts. (4) Projection flattens everything onto a line.
7. `blanks` **fill-standard** — "T rotates ℝ² by 90° clockwise": `A = \begin{bmatrix}` [0] `&` [1] `\\` [−1] `&` [0] `\end{bmatrix}`
   (typed numbers). Hint: where does $\mathbf e_1$ land? Solution: $\mathbf e_1 \mapsto (0,-1)$, $\mathbf e_2 \mapsto (1,0)$.
8. `scene` **onto-1to1** — *Onto and one-to-one.* Stage: two diagrams of arrows between dot clouds; then projection example: many points
   land on one (not one-to-one), and range is a line (not onto ℝ²). Steps: (1) Onto: every b in the codomain is hit at least once.
   (2) One-to-one: every b is hit at most once. (3) Projection fails both.
9. `scene` **theorems-11-12** — *How to test them.* Stage: tex Theorem 11 ($T$ one-to-one ⇔ $T(\mathbf x) = \mathbf 0$ only trivially) and
   Theorem 12 (onto ⇔ columns span ℝᵐ; one-to-one ⇔ columns independent); example `s.matrix([[1,2],[0,1],[1,3]])` reduced: pivots in
   both columns (green), not every row (yellow). Steps: (1) Onto: pivot in every row. (2) One-to-one: pivot in every column. (3) This
   $3\times 2$ matrix is one-to-one but not onto ℝ³: two columns span only a plane in ℝ³.
10. `try` **try-onto** — "$T:\mathbb R^4\to\mathbb R^3$, $T(\mathbf x) = A\mathbf x$, and A has 3 pivots. Which is true?" answer `{type:'choice', value:'a'}`.
    Choices: (a) ✓ "onto, not one-to-one"; (b) "one-to-one, not onto" (why: "Four columns, three pivots: a free column means a nonzero
    x maps to 0."); (c) "both" (why: "A map ℝ⁴ → ℝ³ can never be one-to-one."); (d) "neither" (why: "3 pivots in 3 rows: every row has one.").
11. `scene` **mistake-order** — *The trap: composing in the wrong order.* Stage: plane, "rotate 90° then reflect across $x_1$-axis";
    animate rotation then reflection (two `applyMatrix` calls); the final basis image gives $\begin{bmatrix}0&-1\\-1&0\end{bmatrix}$; tex shows
    wrong product $RF$ (yellow) vs right $FR$. Steps: (1) Do it on the basis: rotate, then reflect. (2) The result's matrix is
    $FR$, with the *first* map on the right, next to x. (3) Writing $RF$ gives a different map.
12. `workout` **wo-standard** — "Find the standard matrix of $T:\mathbb R^2\to\mathbb R^2$ that first rotates by 90° counterclockwise and then
    reflects across the $x_1$-axis." answer `{type:'matrix', value:[[0,-1],[-1,0]]}`. Hints: (1) Track $\mathbf e_1$: rotate → (0,1),
    reflect → (0,−1). (2) Track $\mathbf e_2$. Solution: $\mathbf e_1 \mapsto (0,1) \mapsto (0,-1)$; $\mathbf e_2 \mapsto (-1,0) \mapsto (-1,0)$;
    $A = \begin{bmatrix}0&-1\\-1&0\end{bmatrix}$, the reflection across $x_2 = -x_1$; equals $FR$ with $F=\operatorname{diag}(1,-1)$,
    $R = \begin{bmatrix}0&-1\\1&0\end{bmatrix}$.
13. `workout` **wo-onto** **(generate)** — "Let $T(\mathbf x) = A\mathbf x$ with $A = \begin{bmatrix}1&-2&1\\2&-3&4\end{bmatrix}$. Find all x with
    $T(\mathbf x) = (1,4)$." answer `{type:'solution', particular:['5','2','0'], basis:[['-5','-2','1']]}`. Hints: (1) Row reduce
    $[A\mid\mathbf b]$. (2) RREF $[1,0,5\mid 5],[0,1,2\mid 2]$. Solution: $\mathbf x = (5,2,0) + x_3(-5,-2,1)$; T is onto (2 pivots, 2 rows),
    not one-to-one (free $x_3$). `generate`: random 2×3 rank-2 with integer RREF.
14. `explain` **cp-matrix-of-map** — "Why is a linear map completely determined by what it does to $\mathbf e_1, \dots, \mathbf e_n$?"
    Points: every x is $x_1\mathbf e_1 + \cdots + x_n\mathbf e_n$; linearity gives $T(\mathbf x) = x_1T(\mathbf e_1)+\cdots$; that's $A\mathbf x$ with
    columns $T(\mathbf e_j)$; so two linear maps agreeing on the basis agree everywhere.
15. `scene` **summary-maps** — *Summary.* Stage: grid transformation replay at 2× with the matrix columns marked. Steps: (1) Linear maps
    keep the grid straight and the origin fixed. (2) Columns = images of the basis. (3) Pivots decide onto and one-to-one.

---

# Unit 2 · Matrix algebra

## 7. `matrix-ops` — Matrix operations (Lay 2.1 · 15 min)

**Goals**
- Add, scale, and multiply matrices; know when a product is defined and its size.
- Understand $AB$ as "do B, then A" and compute it column by column ($AB = [A\mathbf b_1\ \cdots\ A\mathbf b_p]$) and by the row–column rule.
- Know the algebra rules that hold, and the three that fail: $AB \ne BA$ in general, no cancellation, $AB = 0$ without $A$ or $B$ zero.
- Use the transpose and $(AB)^T = B^TA^T$.

**Misconceptions:** $AB = BA$; $(AB)^T = A^TB^T$; product defined when sizes match "anyhow" (it's inner dimensions); $(A+B)^2 = A^2 + 2AB + B^2$.

**Beats**
1. `scene` **entries** — *Matrices as arrays.* Stage: `s.matrix([[1,2],[3,-1]])` labelled A, B beside; `a_{ij}` index labels on entry (2,1)
   (yellow `highlightCell`); then A + B entrywise with `setEntry` and $2A$ with `scaleRow` on each row. Steps: (1) Notation: $a_{ij}$
   is row i, column j. (2) Sums and scalar multiples go entry by entry, and need the same size. (3) Nothing surprising yet;
   multiplication is where it gets interesting.
2. `scene` **compose** — *Multiplying means composing.* Stage: `s.plane`, blue $\mathbf x = (1,1)$; apply shear $S = \begin{bmatrix}1&1\\0&1\end{bmatrix}$
   after rotation $R = \begin{bmatrix}0&-1\\1&0\end{bmatrix}$: `p.applyMatrix(R)` then `p.applyMatrix(S)`; track $\mathbf e_1$, $\mathbf e_2$ final
   positions (1,1) and (−1,0) → tex $SR = \begin{bmatrix}1&-1\\1&0\end{bmatrix}$. Steps: (1) Do R, then S: one combined map. (2) Its
   matrix's columns are where $\mathbf e_1$, $\mathbf e_2$ end up. (3) Lay defines the product so that $S(R\mathbf x) = (SR)\mathbf x$.
   Read right to left: R acts first.
3. `scene` **column-def** — *AB, column by column.* Stage: $A = \begin{bmatrix}1&2\\3&-1\end{bmatrix}$, $B = \begin{bmatrix}2&0&1\\1&3&-1\end{bmatrix}$;
   each column $\mathbf b_j$ of B (blue/red/teal) slides into A, producing $A\mathbf b_j$ as a column of AB (green): (4,5), (6,−3), (−1,4).
   Steps: (1) $AB = [A\mathbf b_1\ A\mathbf b_2\ A\mathbf b_3]$. (2) Each column of AB is a combination of columns of A, weights from B.
   (3) Result $\begin{bmatrix}4&6&-1\\5&-3&4\end{bmatrix}$.
4. `scene` **row-column** — *The row–column rule.* Stage: same product, row 1 of A and column 2 of B highlighted yellow, entry
   $(AB)_{12} = 1\cdot0 + 2\cdot3 = 6$ animates in. Steps: (1) Entry (i, j) is row i of A against column j of B. (2) Sizes: $(m\times n)(n\times p)$
   gives $m\times p$; the inside numbers must match.
5. `try` **try-size** — "A is $3\times 5$ and B is $5\times 2$. What is the size of AB, and is BA defined?" answer `{type:'choice', value:'b'}`.
   Choices: (a) "$5\times 5$; yes" (why: "The outside numbers give the size."); (b) ✓ "$3\times 2$; no"; (c) "$3\times 2$; yes" (why: "BA is
   $(5\times 2)(3\times 5)$: inner 2 ≠ 3."). Solution: inner dimensions 5 = 5 match; result is outer $3\times 2$; for BA the inner ones are 2 and 3.
6. `scene` **not-commute** — *Order matters.* Stage: two planes side by side: left `applyMatrix(R)` then `S`, right `S` then `R`; the
   F-shaped polygon ends up in different places; tex $SR = \begin{bmatrix}1&-1\\1&0\end{bmatrix} \ne RS = \begin{bmatrix}0&-1\\1&1\end{bmatrix}$.
   Steps: (1) Rotate then shear vs shear then rotate. (2) Different pictures, different matrices. (3) In general $AB \neq BA$, even for square matrices.
7. `scene` **rules** — *What still works (Theorem 2).* Stage: tex list: associativity $A(BC) = (AB)C$, distributive laws, $r(AB) = (rA)B$,
   $I_mA = A = AI_n$; then two warnings in yellow: no cancellation ($AB = AC \not\Rightarrow B = C$), $AB = 0$ possible with
   $A, B \ne 0$; example $\begin{bmatrix}1&1\\1&1\end{bmatrix}\begin{bmatrix}1&-1\\-1&1\end{bmatrix} = 0$. Steps: (1) Associativity is
   composition, so it's free. (2) Cancellation and the zero-product rule fail. (3) Powers: $A^k$ is A composed k times.
8. `blanks` **fill-product** — `\begin{bmatrix}1&-2\\0&3\\2&1\end{bmatrix}\begin{bmatrix}3&1\\-1&2\end{bmatrix} = \begin{bmatrix}` [5] `&` [−3]
   `\\` [−3] `&` [6] `\\` [5] `&` [4] `\end{bmatrix}`. Solution: row by row, e.g. $(1)(3) + (-2)(-1) = 5$.
9. `scene` **transpose** — *The transpose.* Stage: `s.matrix([[1,2,0],[3,-1,4]])` flips across its diagonal (rows rotate into columns via
   `morphTo` a 3×2 matrix); then tex Theorem 3 with $(AB)^T = B^TA^T$, the order reversal shown by swapping two colored blocks. Steps:
   (1) Rows become columns. (2) Transpose of a product reverses the order. (3) Sizes force it: $B^T$ is $p\times n$, $A^T$ is $n\times m$.
10. `scene` **mistake-square** — *The trap: algebra habits.* Stage: tex $(A+B)^2 = A^2 + AB + BA + B^2$ expanding with the $2AB$
    version crossed out in yellow; then $(AB)^T = A^TB^T$ crossed out. Steps: (1) Expand carefully: $AB$ and $BA$ are different terms.
    (2) Same for transposes: reverse the order.
11. `try` **try-transpose** — "If A is $2\times 3$ and B is $3\times 4$, which product is defined and equals $(AB)^T$?" answer
    `{type:'choice', value:'c'}`. Choices: (a) $A^TB^T$ (why: "$(3\times 2)(4\times 3)$ isn't even defined."); (b) $BA$ (why: "Not
    defined, and no transposes."); (c) ✓ $B^TA^T$.
12. `workout` **wo-product** **(generate)** — "Let $A = \begin{bmatrix}2&-1\\1&3\end{bmatrix}$, $B = \begin{bmatrix}1&4\\-2&0\end{bmatrix}$. Compute
    $AB - BA$." answer `{type:'matrix', value:[[-2,-3],[-1,2]]}`. Hints: (1) $AB = \begin{bmatrix}4&8\\-5&4\end{bmatrix}$. (2) Now BA,
    row 1 of B against columns of A. Solution: $BA = \begin{bmatrix}6&11\\-4&2\end{bmatrix}$; difference $\begin{bmatrix}-2&-3\\-1&2\end{bmatrix}$,
    not zero, so these two don't commute. `generate`: random 2×2 integer A, B in −3..3 with $AB \ne BA$.
13. `explain` **cp-compose** — "Why does $AB$ represent 'apply B first, then A', and why does that make $AB \ne BA$ in general?" Points:
    $(AB)\mathbf x = A(B\mathbf x)$ by definition; columns of AB are $A\mathbf b_j$: A applied to the images of the basis under B; doing two
    geometric moves in different orders generally gives different results (rotate/shear example); only special pairs commute.
14. `scene` **summary-ops** — *Summary.* Stage: the two composition pictures. Steps: (1) Products are compositions, right to left.
    (2) Compute by columns or row–column. (3) Next: undoing a map, the inverse.

---

## 8. `inverses` — Inverses and the Invertible Matrix Theorem (Lay 2.2–2.3 · 18 min)

**Goals**
- Understand $A^{-1}$ as the map that undoes A; use the 2×2 formula with $ad - bc$.
- Solve $A\mathbf x = \mathbf b$ as $\mathbf x = A^{-1}\mathbf b$ (Theorem 5) and know when that's a bad idea computationally.
- Find $A^{-1}$ by row reducing $[A\mid I]$; see row operations as elementary matrices.
- Use $(AB)^{-1} = B^{-1}A^{-1}$, $(A^T)^{-1} = (A^{-1})^T$, and the Invertible Matrix Theorem (Lay 2.3).

**Misconceptions:** every square matrix has an inverse; $(AB)^{-1} = A^{-1}B^{-1}$; non-square inverses; IMT applied to non-square
matrices; "$A^{-1} = 1/A$ entrywise".

**Beats**
1. `scene` **undo** — *Undoing a map.* Stage: `s.plane` with F polygon; `applyMatrix(A)` with $A = \begin{bmatrix}2&5\\1&3\end{bmatrix}$, then
   `applyMatrix(A^{-1} = \begin{bmatrix}3&-5\\-1&2\end{bmatrix})` brings it back. Steps: (1) Some maps can be undone: the inverse puts
   every point back. (2) $A^{-1}A = I$ and $AA^{-1} = I$. (3) A map that squashes the plane onto a line can't be undone: show
   $\begin{bmatrix}1&2\\2&4\end{bmatrix}$ collapsing the grid (yellow).
2. `scene` **two-by-two** — *The 2×2 formula (Theorem 4).* Stage: tex $A^{-1} = \frac{1}{ad-bc}\begin{bmatrix}d&-b\\-c&a\end{bmatrix}$ with
   parts: swap a, d (animated), negate b, c, divide by $\det A = ad - bc$; applied to (2,5,1,3): det 1, inverse $\begin{bmatrix}3&-5\\-1&2\end{bmatrix}$.
   Steps: (1) Swap the diagonal, negate the off-diagonal, divide by $ad - bc$. (2) If $ad - bc = 0$, there's no inverse. (3) Check by
   multiplying: you get I.
3. `scene` **solve-with-inverse** — *Solving with the inverse (Theorem 5).* Stage: tex $A\mathbf x = \mathbf b \Rightarrow \mathbf x = A^{-1}\mathbf b$; with
   $\mathbf b = (1,2)$: $\mathbf x = (3-10, -1+4) = (-7,3)$ green; check $2(-7) + 5(3) = 1$. Steps: (1) Multiply both sides by $A^{-1}$ on the
   left. (2) The solution is unique. (3) In practice, row reduction is faster than finding $A^{-1}$; the formula is for theory.
4. `blanks` **fill-2x2** — `\begin{bmatrix}4&3\\2&2\end{bmatrix}^{-1} = \frac{1}{` [typed 2] `}\begin{bmatrix}` [2] `&` [−3] `\\` [−2] `&` [4]
   `\end{bmatrix}`. Solution: $ad - bc = 8 - 6 = 2$.
5. `scene` **algorithm** — *Finding the inverse: row reduce [A | I].* Stage: `s.matrix([[1,2,0,1,0,0],[0,1,1,0,1,0],[2,4,1,0,0,1]], {augment: 3})`;
   rowOps: $R_3 \leftarrow R_3 - 2R_1$, $R_2 \leftarrow R_2 - R_3$, $R_1 \leftarrow R_1 - 2R_2$ → $[I \mid A^{-1}]$ with right block
   $\begin{bmatrix}-3&-2&2\\2&1&-1\\-2&0&1\end{bmatrix}$ green. Steps: (1) Put I next to A. (2) Row reduce A to I; the same operations
   turn I into $A^{-1}$. (3) If A doesn't reduce to I, A isn't invertible. (4) Check one column: $A(-3,2,-2) = \mathbf e_1$.
6. `scene` **elementary** — *Why it works: elementary matrices.* Stage: $E = \begin{bmatrix}1&0&0\\0&1&0\\-2&0&1\end{bmatrix}$ (I with the
   operation $R_3 - 2R_1$ applied); $EA$ computed equals A after that operation (rows highlight). Then tex
   $E_k\cdots E_1 A = I \Rightarrow A^{-1} = E_k\cdots E_1 = E_k\cdots E_1 I$. Steps: (1) Each row operation is multiplication on the left
   by an elementary matrix. (2) Reducing A to I means a product of them is $A^{-1}$. (3) Apply the same product to I and out comes $A^{-1}$.
7. `try` **try-elementary** — "Which matrix E makes $EA$ swap rows 1 and 2 of any $3\times 3$ A?" answer `{type:'choice', value:'b'}`.
   Choices: (a) $\begin{bmatrix}0&1&0\\0&0&1\\1&0&0\end{bmatrix}$ (why: "That cycles all three rows."); (b) ✓ $\begin{bmatrix}0&1&0\\1&0&0\\0&0&1\end{bmatrix}$;
   (c) $\begin{bmatrix}1&1&0\\0&1&0\\0&0&1\end{bmatrix}$ (why: "That adds row 2 to row 1."). Hint: do the operation to I.
8. `scene` **products-inverse** — *Inverse of a product.* Stage: socks-and-shoes: two `applyMatrix` moves (A then B... i.e. BA) undone in
   reverse order; tex $(AB)^{-1} = B^{-1}A^{-1}$, $(A^T)^{-1} = (A^{-1})^T$. Steps: (1) You put on socks then shoes; you take off shoes first.
   (2) Undo the last move first.
9. `workout` **wo-inverse** **(generate)** — "Find $A^{-1}$ for $A = \begin{bmatrix}1&0&1\\0&1&1\\1&1&1\end{bmatrix}$." answer
   `{type:'matrix', value:[[0,-1,1],[-1,0,1],[1,1,-1]]}`. Hints: (1) Reduce $[A\mid I]$; start with $R_3 \leftarrow R_3 - R_1$. (2) Then
   $R_3 \leftarrow R_3 - R_2$ gives a $-1$ pivot. (3) Scale and clear upward. Solution: steps listed; check $AA^{-1} = I$.
   `generate`: random unimodular 3×3 (product of 3–4 integer elementary matrices) so the inverse is integer.
10. `scene` **imt** — *The Invertible Matrix Theorem.* Stage: tex list of (a)–(l) appearing in groups with links to earlier
    lectures: (a) invertible, (b) row equivalent to I, (c) n pivots, (d) $A\mathbf x = \mathbf 0$ only trivial, (e) columns independent,
    (f) $\mathbf x \mapsto A\mathbf x$ one-to-one, (g) $A\mathbf x = \mathbf b$ solvable for every b, (h) columns span ℝⁿ, (i) onto,
    (j) C with $CA = I$, (k) D with $AD = I$, (l) $A^T$ invertible. A ring of "n pivots" in the middle connects them (`s.arrow`s). Steps:
    (1) For a *square* matrix these are all equivalent. (2) The hub is: n pivots. (3) So one-to-one and onto coincide for square matrices.
    (4) And all fail together when A is singular.
11. `try` **try-imt** — "A is $4\times 4$ and $A\mathbf x = \mathbf 0$ has only the trivial solution. Select every statement that must be true."
    answer `{type:'multi', value:['a','b','d']}`. Choices: (a) ✓ columns of A span ℝ⁴; (b) ✓ $A^T$ is invertible; (c) "A has a zero row"
    (why: "Then it would have fewer than 4 pivots."); (d) ✓ $A\mathbf x = \mathbf b$ has exactly one solution for every b; (e) "A = I"
    (why: "Many matrices are invertible."). Solution: (d) of IMT holds → all of IMT.
12. `scene` **mistake-nonsquare** — *The trap: non-square matrices.* Stage: $3\times 2$ matrix with independent columns; yellow note "IMT
    doesn't apply"; it's one-to-one but not onto. Steps: (1) The IMT is for square matrices only. (2) A tall matrix can be one-to-one
    without being onto, and has no two-sided inverse.
13. `try` **try-product-inv** — "Solve for X: $AXB = C$ with A, B invertible." answer `{type:'choice', value:'a'}`. Choices: (a) ✓
    $X = A^{-1}CB^{-1}$; (b) $X = CA^{-1}B^{-1}$ (why: "Matrices don't commute; multiply by $A^{-1}$ on the *left*."); (c) $X = B^{-1}CA^{-1}$
    (why: "Sides swapped."). Solution: left-multiply by $A^{-1}$, right-multiply by $B^{-1}$.
14. `explain` **cp-imt** — "For a square matrix A, why does 'columns are linearly independent' force 'columns span ℝⁿ'?" Points: independent
    columns ⇒ pivot in every column; square ⇒ n columns = n rows; so a pivot in every row too; pivot in every row ⇔ columns span ℝⁿ.
15. `scene` **summary-inverse** — *Summary.* Stage: [A | I] → [I | A⁻¹] replay at speed; IMT hub. Steps: (1) $A^{-1}$ undoes A. (2) Compute by
    row reducing [A | I]. (3) For square matrices, invertible, one-to-one, onto, and n pivots are all the same fact.

---

## 9. `lu` — LU factorization (Lay 2.5 · 12 min)

**Goals**
- Understand why factoring $A = LU$ pays off when solving $A\mathbf x = \mathbf b$ for many b.
- Solve $A\mathbf x = \mathbf b$ via $L\mathbf y = \mathbf b$ (forward) then $U\mathbf x = \mathbf y$ (backward).
- Build L by recording the multipliers of row replacement operations (no swaps).

**Misconceptions:** entries of L are the multipliers with the wrong sign; U must have 1s on the diagonal (in Lay, L is unit lower
triangular, U is the echelon form); solving $U\mathbf x = \mathbf b$ directly (skipping $L\mathbf y = \mathbf b$).

**Beats**
1. `scene` **why-lu** — *Why factor?* Stage: matrix A and a stack of b vectors (blue, red, teal) arriving one after another; tex
   $A = LU$ with L lower-triangular (shape drawn), U upper (echelon). Steps: (1) Engineers solve $A\mathbf x = \mathbf b$ for the same A and many
   b. (2) Do the elimination once and record it: $A = LU$. (3) Then each new b costs two quick triangular solves.
2. `scene` **two-solves** — *Solving with L and U.* Stage: $A = \begin{bmatrix}2&1&1\\4&3&3\\-2&1&4\end{bmatrix} = LU$ with
   $L = \begin{bmatrix}1&0&0\\2&1&0\\-1&2&1\end{bmatrix}$, $U = \begin{bmatrix}2&1&1\\0&1&1\\0&0&3\end{bmatrix}$, $\mathbf b = (3,7,5)$;
   forward substitution animates $y_1 = 3$, $y_2 = 7 - 6 = 1$, $y_3 = 5 + 3 - 2 = 6$; back substitution $x_3 = 2$, $x_2 = -1$, $x_1 = 1$.
   Steps: (1) $A\mathbf x = L(U\mathbf x)$; call $U\mathbf x = \mathbf y$. (2) Solve $L\mathbf y = \mathbf b$ top-down. (3) Solve $U\mathbf x = \mathbf y$
   bottom-up. (4) $\mathbf x = (1,-1,2)$; check $A\mathbf x = \mathbf b$.
3. `try` **try-forward** — "With the same L, solve $L\mathbf y = (1, 4, 2)$. What is $y_3$?" answer `{type:'number', value: -1}`. Hint:
   $y_1 = 1$, then $y_2 = 4 - 2y_1$. Solution: $y_2 = 2$; $y_3 = 2 + y_1 - 2y_2 = 2 + 1 - 4 = -1$.
4. `scene` **build-lu** — *Building L and U.* Stage: `s.matrix` A from beat 2 reduced with replacements $R_2 - 2R_1$, $R_3 + R_1$, $R_3 - 2R_2$;
   each multiplier (2, −1, 2) flies into an empty L skeleton (yellow → placed) below the diagonal. Steps: (1) Reduce A to echelon form
   with only row replacements: that's U. (2) Each time you subtract $\ell$ times a pivot row, write $\ell$ in L at that position.
   (3) "$R_3 + R_1$" is subtracting $-1$ times row 1, so L gets $-1$. (4) Ones on L's diagonal.
5. `scene` **why-multipliers** — *Why the multipliers go straight in.* Stage: tex $E_3E_2E_1A = U \Rightarrow A = (E_3E_2E_1)^{-1}U = LU$; the
   three inverse elementary matrices multiply into L (entries drop in). Steps: (1) The replacements are elementary matrices. (2) L is the
   product of their inverses, which just undoes each subtraction. (3) Lay's algorithm: fill L column by column from the pivot columns
   divided by the pivot.
6. `blanks` **fill-lu** — For $A = \begin{bmatrix}1&2\\3&8\end{bmatrix}$: `L = \begin{bmatrix}1&0\\` [3] `&1\end{bmatrix},\ U = \begin{bmatrix}1&2\\0&` [2]
   `\end{bmatrix}`. Solution: $R_2 - 3R_1$ gives $(0, 2)$; multiplier 3.
7. `scene` **mistake-sign** — *The trap: the sign of the multiplier.* Stage: A from beat 2 with a wrong L having $-2$ in position (2,1)
   (yellow) and LU recomputed showing row 2 wrong ($(-4,-1,-1)$ instead of $(4,3,3)$); corrected. Steps: (1) The operation was "subtract 2 times row 1", and L
   records the 2, not −2. (2) Check by multiplying back: LU must equal A.
8. `scene` **swaps** — *When you need a swap.* Stage: $\begin{bmatrix}0&1\\1&1\end{bmatrix}$: zero pivot (yellow); note "permuted LU, $PA = LU$,
   is what software does". Steps: (1) If a pivot is zero you must swap rows, and plain LU fails. (2) Software uses a permuted version;
   in this course, factor matrices that reduce without swaps.
9. `workout` **wo-lu** **(generate)** — "Find the LU factorization of $A = \begin{bmatrix}1&2&1\\2&6&1\\-1&0&4\end{bmatrix}$. Enter L."
   answer `{type:'matrix', value:[[1,0,0],[2,1,0],[-1,1,1]]}`. Hints: (1) $R_2 - 2R_1$, $R_3 + R_1$. (2) Now column 2: both rows 2 and 3
   have a 2 there. Solution: $U = \begin{bmatrix}1&2&1\\0&2&-1\\0&0&6\end{bmatrix}$, multipliers 2, −1, 1; check LU = A.
   `generate`: random unit lower L (entries −3..3) times random upper U (nonzero diagonal −3..3, entries −3..3).
10. `try` **try-lu-use** — "Given $A = LU$, which order solves $A\mathbf x = \mathbf b$?" answer `{type:'choice', value:'a'}`. Choices: (a) ✓ "$L\mathbf y = \mathbf b$,
    then $U\mathbf x = \mathbf y$"; (b) "$U\mathbf y = \mathbf b$, then $L\mathbf x = \mathbf y$" (why: "$A\mathbf x = L(U\mathbf x)$: L is applied last, so it's undone first.");
    (c) "compute $A^{-1}$" (why: "Works, but wastes the factorization.").
11. `explain` **cp-lu** — "Why does the multiplier you use in a row replacement end up as an entry of L?" Points: each replacement is
    $E_k$ (identity with $-\ell$ below the diagonal); $L = E_1^{-1}\cdots E_k^{-1}$; the inverse of subtracting $\ell$ times a row is adding
    it back, so $E^{-1}$ has $+\ell$; with operations in order the product just collects the $\ell$'s in place.
12. `scene` **summary-lu** — *Summary.* Stage: A = LU picture with the multipliers glowing. Steps: (1) Elimination, recorded. (2) Two
    triangular solves per right-hand side.

---

## 10. `subspaces` — Subspaces, dimension, and rank (Lay 2.8–2.9 · 17 min)

**Goals**
- Define a subspace of ℝⁿ and test the three conditions.
- Find bases for $\operatorname{Col} A$ (pivot columns of A) and $\operatorname{Nul} A$ (from the parametric solution).
- Compute coordinates $[\mathbf x]_{\mathcal B}$ relative to a basis of a subspace.
- Use dimension, rank, the Rank Theorem $\operatorname{rank} A + \dim\operatorname{Nul} A = n$, and the Basis Theorem.

**Misconceptions:** basis of Col A = pivot columns of the *echelon form* (must be of A); a line not through 0 is a subspace;
dim Nul A = number of pivots; Col A lives in ℝⁿ (it's in ℝᵐ).

**Beats**
1. `scene` **what-subspace** — *Flat things through the origin.* Stage: `s.space` showing a plane through 0 (green ✓), a line through 0 (✓),
   a plane missing 0 (yellow ✗), and in `s.plane` the quadrant-pair $\{x_1x_2 \ge 0\}$ (✗) with $(1,2) + (-2,-1)$ escaping. Steps: (1) A
   subspace contains 0 and is closed under adding and scaling. (2) Lines and planes through the origin qualify. (3) Miss the origin, or let a sum
   escape, and it's not.
2. `scene` **col-nul** — *Two subspaces from every matrix.* Stage: tex definitions; $A = \begin{bmatrix}1&2&0&1\\2&4&1&4\\3&6&1&5\end{bmatrix}$ with an
   arrow from ℝ⁴ to ℝ³; Col A in the target (span of columns), Nul A in the source (what goes to 0). Steps: (1) Col A: all combinations of the
   columns, so a subspace of ℝᵐ (here ℝ³). (2) Nul A: all solutions of $A\mathbf x = \mathbf 0$, a subspace of ℝⁿ (here ℝ⁴). (3) Different worlds;
   keep track of which.
3. `try` **try-subspace** — "Is $H = \{(x_1, x_2) : x_1x_2 \ge 0\}$ a subspace of ℝ²?" answer `{type:'choice', value:'no'}`. Choices: `yes` (why:
   "It contains 0 and is closed under scaling, but check sums: $(1,2) + (-2,-1) = (-1,1)$."); `no` ✓. Solution: fails closure under addition.
4. `scene` **basis-col** — *A basis for Col A.* Stage: A reduced (rowOps from linalg) to `[[1,2,0,1],[0,0,1,2],[0,0,0,0]]`; pivot columns 1, 3
   ringed; then the *original* columns 1 and 3 of A light up (blue, red) and copy out: $\{(1,2,3), (0,1,1)\}$. Steps: (1) A basis is an
   independent spanning set: no redundancy. (2) The pivot columns tell you which columns; take them from A itself. (3) Columns 2 and 4 are
   combinations of these: column 2 = 2·column 1, column 4 = column 1 + 2·column 3.
5. `scene` **basis-nul** — *A basis for Nul A.* Stage: from RREF: $x_1 = -2x_2 - x_4$, $x_3 = -2x_4$; $\mathbf x = x_2(-2,1,0,0) + x_4(-1,0,-2,1)$.
   Steps: (1) Solve $A\mathbf x = \mathbf 0$ in parametric vector form. (2) The vectors multiplying the free variables are automatically
   independent: each has a 1 where the others have 0. (3) That's a basis for Nul A.
6. `scene` **mistake-echelon-cols** — *The trap: columns of the echelon form.* Stage: echelon form's columns 1 and 3 ((1,0,0), (0,1,0)) shown
   with yellow ✗ next to A's columns ✓; the echelon columns all have third entry 0 but (1,2,3) doesn't. Steps: (1) Row operations change the
   column space. (2) Use the echelon form to *locate* pivots, then go back to A.
7. `blanks` **fill-rank** — `A \text{ is } 5\times 7,\ \operatorname{rank} A = 3:\ \dim\operatorname{Nul} A = ` [typed 4] `,\ \operatorname{Col} A \subseteq \mathbb R^{`
   [typed 5] `}`. Solution: $7 - 3 = 4$; columns have 5 entries.
8. `scene` **coordinates** — *Coordinates in a subspace.* Stage: `s.space` plane Col A with basis $\mathbf b_1 = (1,2,3)$ (blue), $\mathbf b_2 = (0,1,1)$ (red); a skewed
   grid drawn on the plane; $\mathbf x = (3,7,10)$ green = $3\mathbf b_1 + 1\mathbf b_2$; tex $[\mathbf x]_{\mathcal B} = (3,1)$. Steps: (1) A basis gives the
   plane its own coordinate grid. (2) Coordinates are the weights. (3) The plane is a copy of ℝ²: two numbers describe each point.
9. `scene` **rank-theorem** — *Dimension and the Rank Theorem.* Stage: tex: dim = number of vectors in any basis; rank A = dim Col A;
   Theorem 14 $\operatorname{rank} A + \dim\operatorname{Nul} A = n$; for our A: $2 + 2 = 4$, with pivot columns (blue) and free columns (yellow)
   counted. Steps: (1) Dimension counts basis vectors. (2) Pivot columns give rank; free columns give the null space's dimension. (3) Every
   column is one or the other, so they add to n.
10. `scene` **basis-theorem** — *The Basis Theorem and the IMT.* Stage: tex Theorem 15; IMT additions (m)–(q): Col A = ℝⁿ, dim Col A = n,
    rank A = n, Nul A = {0}, dim Nul A = 0. Steps: (1) In a p-dimensional subspace, p independent vectors automatically span, and p
    spanning vectors are automatically independent. (2) For square A, full rank joins the IMT.
11. `try` **try-coords** — "$\mathcal B = \{(1,2,3), (0,1,1)\}$ is a basis for H and $\mathbf x = (2,3,5) \in H$. Find $[\mathbf x]_{\mathcal B}$." answer
    `{type:'vector', value:['2','-1']}`. Hint: first entry gives $c_1$. Solution: $c_1 = 2$; $2c_1 + c_2 = 3 \Rightarrow c_2 = -1$; third entry
    $6 - 1 = 5$ ✓.
12. `workout` **wo-bases** **(generate)** — "For $A = \begin{bmatrix}1&3&2&1\\2&6&5&4\\1&3&1&-1\end{bmatrix}$, find a basis for Nul A." answer
    `{type:'basis', value:[['-3','1','0','0'], ['3','0','-2','1']]}`. Hints: (1) RREF is $\begin{bmatrix}1&3&0&-3\\0&0&1&2\\0&0&0&0\end{bmatrix}$.
    (2) Free variables $x_2, x_4$. Solution: $x_1 = -3x_2 + 3x_4$, $x_3 = -2x_4$; basis $(-3,1,0,0), (3,0,-2,1)$; Col A basis: columns 1, 3 of A,
    $(1,2,1), (2,5,1)$; rank 2 + 2 = 4. `generate`: random 3×4 rank-2 with integer RREF.
13. `explain` **cp-rank** — "Explain why $\operatorname{rank} A + \dim\operatorname{Nul} A = n$." Points: rank = number of pivot columns
    (they form a basis for Col A); dim Nul A = number of free variables (one basis vector each); every one of the n columns is either a
    pivot column or a free one; so the counts add to n.
14. `scene` **summary-subspaces** — *Summary.* Stage: ℝ⁴ → ℝ³ diagram with Nul A (dim 2) and Col A (dim 2). Steps: (1) Col A: pivot columns of A.
    (2) Nul A: parametric form. (3) Their dimensions add up to the number of columns.

---

# Unit 3 · Determinants

## 11. `determinants` — Determinants (Lay 3.1–3.2 · 17 min)

**Goals**
- See $\det A$ (2×2) as the signed factor by which the map scales area; zero ⇔ the plane collapses.
- Compute determinants by cofactor expansion along any row or column (Theorem 1), and of triangular matrices (Theorem 2).
- Know how row operations change det (Theorem 3) and compute det by row reduction.
- Use $\det A \ne 0 \iff A$ invertible, $\det A^T = \det A$, $\det(AB) = \det A\det B$.

**Misconceptions:** $\det(A+B) = \det A + \det B$; $\det(kA) = k\det A$ for $n\times n$ (it's $k^n$); cofactor signs ignored; scaling a
row during reduction "doesn't change det".

**Beats**
1. `scene` **area-factor** — *How much does area grow?* Stage: `s.plane`, unit square (yellow fill `p.polygon`) with `p.basis()`; apply
   $\begin{bmatrix}3&0\\0&2\end{bmatrix}$: square becomes 3×2 rectangle, area label "6"; reset, apply shear $\begin{bmatrix}1&1\\0&1\end{bmatrix}$: parallelogram,
   area "1". Steps: (1) Watch the unit square. (2) Stretch by 3 and 2: area 6. (3) A shear tilts it but keeps the area 1. (4) That scaling
   factor is the determinant.
2. `scene` **sign-zero** — *Negative and zero.* Stage: apply $\begin{bmatrix}0&1\\1&0\end{bmatrix}$: square flips (orientation arrow reverses),
   label "−1"; apply $\begin{bmatrix}1&2\\2&4\end{bmatrix}$: everything collapses onto a line (yellow), label "0". Steps: (1) A flip gives
   a negative determinant. (2) Zero means the map squashes the plane flat, and a flattened plane can't be unflattened: not invertible.
3. `scene` **formula-2x2** — *The 2×2 formula.* Stage: parallelogram from columns (a, c), (b, d) inside an $(a+b)\times(c+d)$ rectangle; the
   corner pieces subtract away (rects and triangles `fadeOut`) leaving $ad - bc$. Steps: (1) Area of the parallelogram from the columns.
   (2) Big rectangle minus the corners equals $ad - bc$. (3) That's the number from the inverse formula.
4. `scene` **cofactor** — *Cofactor expansion.* Stage: $A = \begin{bmatrix}3&0&2\\1&2&0\\4&0&1\end{bmatrix}$; checkerboard of signs overlaid;
   expand along row 1: $3\cdot\det\begin{bmatrix}2&0\\0&1\end{bmatrix} - 0 + 2\cdot\det\begin{bmatrix}1&2\\4&0\end{bmatrix} = 6 - 16 = -10$
   (each minor appears by striking row/col with `s.line`). Steps: (1) Pick a row; each entry times its cofactor $C_{ij} = (-1)^{i+j}\det A_{ij}$.
   (2) $A_{ij}$ deletes row i and column j. (3) Total: $-10$.
5. `scene` **smart-column** — *Pick the row or column with zeros.* Stage: same A, column 2 highlighted (two zeros); only $a_{22} = 2$ survives:
   $2\cdot(+1)\det\begin{bmatrix}3&2\\4&1\end{bmatrix} = 2(3 - 8) = -10$. Steps: (1) Theorem 1: any row or column gives the same answer.
   (2) Choose the one with the most zeros: one 2×2 determinant instead of three. (3) Triangular matrices: product of the diagonal (Theorem 2).
6. `try` **try-triangular** — "$\det\begin{bmatrix}2&7&-1&4\\0&-3&5&1\\0&0&1&9\\0&0&0&2\end{bmatrix} = ?$" answer `{type:'number', value: -12}`.
   Hint: triangular. Solution: $2\cdot(-3)\cdot1\cdot2 = -12$.
7. `scene` **row-ops-det** — *Row operations and det (Theorem 3).* Stage: three cards, each with a 2×2 and its parallelogram: replacement
   (shear: area same), swap (flip: sign changes), scale row by k (area times k). Steps: (1) Replacement: no change. (2) Interchange: sign
   flips. (3) Scaling a row by k multiplies det by k.
8. `scene` **det-by-reduction** — *Computing det by row reduction.* Stage: `s.matrix([[1,-2,3],[2,-3,8],[-1,4,3]])` with replacements only
   ($R_2 - 2R_1$, $R_3 + R_1$, $R_3 - 2R_2$) → $\begin{bmatrix}1&-2&3\\0&1&2\\0&0&2\end{bmatrix}$; running "det = ?" note unchanged; product
   of diagonal $= 2$. Steps: (1) Replacements don't change det. (2) Reduce to triangular and multiply the diagonal. (3) Track any swaps
   (sign) and scalings (factor).
9. `blanks` **fill-ops** — "det A = 5 for a 3×3 A." `\text{swap two rows: }` [typed −5]; `\text{multiply row 2 by } 3:` [typed 15];
   `\det(2A) = ` [typed 40]. Hint (last): "Every one of the 3 rows gets multiplied by 2." Solution: $2^3\cdot 5 = 40$.
10. `scene` **properties** — *det A ≠ 0 iff invertible; products; transposes.* Stage: tex Theorems 4, 5, 6; geometric: compose two maps,
    areas multiply ($\det(AB) = \det A\det B$); counterexample $\det(I + I) = 4 \ne 1 + 1$ in 2×2. Steps: (1) Invertible exactly when det is
    nonzero. (2) Det of a transpose is the same. (3) Det of a product is the product: scale factors multiply. (4) Sums: no rule.
11. `scene` **mistake-kA** — *The trap: det(kA).* Stage: unit square scaled by $2I$ → area 4 (not 2), yellow surround on the wrong
    "$\det(2A) = 2\det A$". Steps: (1) Multiplying a matrix by k scales *every* row. (2) So $\det(kA) = k^n\det A$.
12. `workout` **wo-det4** **(generate)** — "Compute $\det\begin{bmatrix}2&0&0&5\\1&3&0&2\\0&4&0&1\\-1&2&1&3\end{bmatrix}$." answer
    `{type:'number', value: -10}`. Hints: (1) Column 3 has a single nonzero entry. (2) Its cofactor sign is $(-1)^{4+3}$. Solution:
    $\det = 1\cdot(-1)^{7}\det\begin{bmatrix}2&0&5\\1&3&2\\0&4&1\end{bmatrix} = -(2(3-8) - 0 + 5(4)) = -(-10+20) = -10$.
    `generate`: random 4×4 with a column having one nonzero entry, small entries.
13. `try` **try-product** — "$\det A = 3$, $\det B = -2$ (both 4×4). Find $\det(A^TB^{-1}A)$." answer `{type:'number', value: '-9/2'}`. Hint: det
    of each factor. Solution: $3\cdot(-\tfrac12)\cdot 3 = -\tfrac92$.
14. `explain` **cp-det** — "Why does $\det A = 0$ mean A is not invertible? Give the geometric reason and the row-reduction reason."
    Points: geometric: det is the area/volume scale factor; 0 means the image is flattened into a lower dimension, so points collide (not
    one-to-one) and the map can't be undone; algebraic: row operations change det only by nonzero factors, so det A = 0 iff the echelon
    form has a zero on the diagonal iff fewer than n pivots.
15. `scene` **summary-det** — *Summary.* Stage: area factor animation replay; three row-op cards. Steps: (1) det = signed area/volume factor.
    (2) Expand along zeros or reduce to triangular. (3) Nonzero exactly when invertible.

---

## 12. `cramer-volume` — Cramer's rule, area, and volume (Lay 3.3 · 13 min)

**Goals**
- Solve small systems with Cramer's rule, $x_i = \det A_i(\mathbf b)/\det A$.
- Express $A^{-1} = \frac{1}{\det A}\operatorname{adj} A$ and compute one entry of an inverse via a cofactor.
- Compute areas of parallelograms and volumes of parallelepipeds as $|\det|$; use $\operatorname{area}(T(S)) = |\det A|\operatorname{area}(S)$.

**Misconceptions:** adjugate is the cofactor matrix itself (it's the transpose); area = det (forgetting absolute value); parallelogram
not at the origin → use vertices instead of edge vectors.

**Beats**
1. `scene` **cramer-idea** — *Replace a column.* Stage: $A = \begin{bmatrix}2&1\\1&3\end{bmatrix}$, $\mathbf b = (7,11)$; b slides into column 1
   (blue) making $A_1(\mathbf b)$, then into column 2 (red) making $A_2(\mathbf b)$. Steps: (1) $A_i(\mathbf b)$ is A with column i
   replaced by b. (2) Cramer's rule: $x_i = \det A_i(\mathbf b)/\det A$.
2. `scene` **cramer-worked** — *Worked example.* Stage: $\det A = 5$; $\det A_1 = 21 - 11 = 10$, $\det A_2 = 22 - 7 = 15$; $x = (2,3)$ green;
   `s.plane` with the two lines meeting at (2,3). Steps: (1) det A = 5, nonzero, so a unique solution. (2) $x_1 = 10/5 = 2$, $x_2 = 15/5 = 3$.
   (3) Check: $4 + 3 = 7$, $2 + 9 = 11$.
3. `scene` **cramer-why** — *Why it works.* Stage: tex $A\,I_i(\mathbf x) = A_i(\mathbf b)$ where $I_i(\mathbf x)$ is I with column i replaced by x;
   take determinants: $\det A \cdot x_i = \det A_i(\mathbf b)$. Steps: (1) Replace column i of I with x; multiply by A. (2) $\det I_i(\mathbf x) = x_i$.
   (3) Determinants multiply, and we're done.
4. `try` **try-cramer** — "Use Cramer's rule: $x_1 + 2x_2 = 5$, $3x_1 + 4x_2 = 6$. Find $x_2$." answer `{type:'number', value:'9/2'}`. Hint:
   $\det A = -2$. Solution: $\det A_2(\mathbf b) = 6 - 15 = -9$; $x_2 = -9/-2 = 9/2$ (and $x_1 = -4$).
5. `scene` **adjugate** — *An inverse formula (Theorem 8).* Stage: $A = \begin{bmatrix}1&2&0\\0&1&1\\2&4&1\end{bmatrix}$ (det 1); cofactor matrix built
   entry by entry (a few animated), then transposed (`morphTo`) into adj A $= \begin{bmatrix}-3&-2&2\\2&1&-1\\-2&0&1\end{bmatrix}$ = $A^{-1}$
   (matches lecture 8). Steps: (1) Collect all cofactors, then *transpose*: the adjugate. (2) $A^{-1} = \frac{1}{\det A}\operatorname{adj} A$.
   (3) Great for theory and for one entry; row reduction is better for the whole inverse.
6. `blanks` **fill-adj** — "The (1,2) entry of $A^{-1}$ for the A above": `(A^{-1})_{12} = \frac{C_{` [chips `21` ✓, `12`] `}}{\det A} = ` [typed −2].
   Solution: transposed: entry (1,2) uses cofactor $C_{21} = -\det\begin{bmatrix}2&0\\4&1\end{bmatrix} = -2$.
7. `scene` **area** — *Area = |det| (Theorem 9).* Stage: `s.plane` parallelogram on (3,1) and (1,2) (`p.parallelogram`, blue/red edges, fill);
   $\det\begin{bmatrix}3&1\\1&2\end{bmatrix} = 5$; unit-square tiles count shown faintly. Steps: (1) The parallelogram from the columns has area
   $|\det A|$. (2) Here 5. (3) In ℝ³: volume of the parallelepiped is $|\det A|$; show `s.space` box on (1,0,0), (1,2,0), (1,1,3): volume 6.
8. `scene` **translated** — *A parallelogram anywhere.* Stage: parallelogram with vertices (1,1), (4,2), (2,4), (5,5); slide it (`shift`) so (1,1) hits
   the origin; edges become (3,1), (1,3); det 8. Steps: (1) Translate a vertex to the origin; area doesn't change. (2) Use the two edges from
   that vertex. (3) Area $|9 - 1| = 8$.
9. `scene` **mistake-vertices** — *The trap: using vertices as columns.* Stage: same parallelogram; wrong $\det\begin{bmatrix}4&2\\2&4\end{bmatrix} = 12$
   (yellow) using two vertices; corrected with edges. Steps: (1) Columns must be edge vectors from one common corner, not vertices.
10. `scene` **transform-area** — *Linear maps scale every area by |det| (Theorem 10).* Stage: unit disk under $\begin{bmatrix}3&0\\0&2\end{bmatrix}$
    becomes an ellipse (applyMatrix); area $\pi \to 6\pi$; then a blob shape also scales. Steps: (1) Any region's area is multiplied by $|\det A|$.
    (2) Ellipse $\frac{x_1^2}{9} + \frac{x_2^2}{4} \le 1$ has area $6\pi$.
11. `workout` **wo-area** **(generate)** — "Find the area of the parallelogram with vertices $(-2,1), (1,2), (0,4), (3,5)$." answer
    `{type:'number', value: 7}`. Hints: (1) Which vertex is adjacent to which? From $(-2,1)$ the edges go to $(1,2)$ and $(0,4)$. (2) Edge vectors
    $(3,1)$ and $(2,3)$. Solution: $|\det\begin{bmatrix}3&2\\1&3\end{bmatrix}| = 9 - 2 = 7$; check fourth vertex $(-2,1) + (3,1) + (2,3) = (3,5)$.
    `generate`: random corner and two integer edges with nonzero det; shuffle the vertex order.
12. `try` **try-volume-map** — "$T(\mathbf x) = A\mathbf x$ with $\det A = -3$ ($3\times 3$). A solid of volume 4 is mapped by T. New volume?" answer
    `{type:'number', value: 12}`. Choices none (typed). Hint: absolute value. Solution: $|-3|\cdot 4 = 12$.
13. `explain` **cp-cramer** — "Why does Cramer's rule need $\det A \ne 0$, and why isn't it used to solve big systems?" Points: it divides by det A;
    det A = 0 means no unique solution; computing n + 1 determinants of size n is far more work than one row reduction; it shines for
    theory (how x depends on b) and 2×2 or 3×3 by hand.
14. `scene` **summary-cramer** — *Summary.* Stage: three panels (Cramer, adjugate, area). Steps: (1) Cramer: swap in b, divide by det. (2) Inverse =
    adjugate over det. (3) |det| measures area and volume, and how maps scale them.

---

## 13. `review-1` — Midterm 1 review (Lay ch. 1–3 · 15 min)

**Goals**
- Recall the core computations of chapters 1–3 and decide quickly which tool fits.
- Connect the threads: pivots ⇔ span/independence ⇔ invertibility ⇔ nonzero determinant.
- Practice exam-style problems under light time pressure.

**Misconceptions targeted:** mixing up pivot-in-every-row vs every-column; forgetting to check consistency; det sign errors after swaps;
matrix product order.

**Beats**
1. `scene` **map-of-ch1-3** — *The map of the first three chapters.* Stage: concept map drawn with `s.text` nodes and `s.arrow`s: Row
   reduction → pivots → {consistency, span (pivot every row), independence (pivot every column)} → square: IMT ↔ det ≠ 0. Steps:
   (1) Almost everything so far runs through one computation: row reduction. (2) Pivots in every row: spanning, onto. (3) In every column:
   independent, one-to-one. (4) Square with both: invertible, determinant nonzero.
2. `try` **try-h-consistent** — "For which h is the system with augmented matrix $\begin{bmatrix}1&h&4\\3&6&8\end{bmatrix}$ consistent?" answer
   `{type:'choice', value:'b'}`. Choices: (a) "all h" (why: "At $h = 2$ row 2 becomes $[0\ 0\mid -4]$."); (b) ✓ "$h \ne 2$"; (c) "$h = 2$ only" (why:
   "That's exactly the bad value."); (d) "no h" (why: "Try $h = 0$: $x_1 = 4$, $x_2 = -2/3$."). Solution: $R_2 - 3R_1 = [0,\ 6 - 3h\mid -4]$;
   consistent iff $6 - 3h \ne 0$.
3. `try` **try-indep-cols** — "Are the columns of $\begin{bmatrix}1&3&2&1\\2&6&5&4\\1&3&1&-1\end{bmatrix}$ linearly independent? Do they span ℝ³?" answer
   `{type:'choice', value:'c'}`. Choices: (a) "independent and spanning" (why: "Four vectors in ℝ³ can't be independent."); (b) "independent, not
   spanning"; (c) ✓ "dependent, not spanning" (RREF has 2 pivots: no pivot in row 3); (d) "dependent and spanning" (why: "Only 2 pivots for 3
   rows."). Hint: RREF from the subspaces lecture. Solution: rank 2.
4. `scene` **recap-maps** — *Recap: matrices as maps.* Stage: quick replay (instant-ish, 600 ms each) of shear, rotation, projection with their
   standard matrices; then the composition order rule $(AB)\mathbf x = A(B\mathbf x)$. Steps: (1) Columns = images of the basis. (2) Products
   compose right to left.
5. `try` **try-onto-121** — "$T:\mathbb R^3\to\mathbb R^3$ has standard matrix with $\det = 0$. Which is true?" answer `{type:'choice', value:'d'}`.
   Choices: (a) "one-to-one but not onto" (why: "Square: one-to-one and onto stand or fall together."); (b) "onto but not one-to-one" (same why);
   (c) "both"; (d) ✓ "neither".
6. `workout` **wo-inverse-review** — "Find $A^{-1}$ for $A = \begin{bmatrix}1&2&3\\0&1&4\\5&6&0\end{bmatrix}$." answer
   `{type:'matrix', value:[[-24,18,5],[20,-15,-4],[-5,4,1]]}`. Hints: (1) det A = 1, so expect integers. (2) Start $[A\mid I]$ with
   $R_3 \leftarrow R_3 - 5R_1$, then $R_3 \leftarrow R_3 + 4R_2$. Solution: after the forward phase row 3 is $[0,0,1\mid -5,4,1]$; back substitute;
   check $AA^{-1} = I$.
7. `blanks` **fill-det-review** — "A is 3×3 with $\det A = 5$." `\det(A^T) = ` [5]; `\det(A^{-1}) = ` [typed 1/5]; `\det(A^2) = ` [25];
   `\det(-A) = ` [−5]. Solution: transposes keep det; inverse inverts it; products multiply; $(-1)^3 = -1$.
8. `scene` **recap-det** — *Recap: three ways to a determinant.* Stage: one 3×3 matrix computed three ways in quick succession (cofactor along
   zeros, row reduction, triangular product). Steps: (1) Expand along zeros. (2) Or reduce to triangular, tracking swaps and scalings.
9. `workout` **wo-lu-det** — "Find the LU factorization of $A = \begin{bmatrix}2&-1&3\\-4&5&-5\\6&-6&12\end{bmatrix}$, then use it to find $\det A$." answer
   `{type:'number', value: 24}`. Hints: (1) Multipliers: $-2$ and $3$ for column 1. (2) After those, row 3 is $(0,-3,3)$ and row 2 is $(0,3,1)$.
   (3) $\det A = \det L\det U$ and $\det L = 1$. Solution: $L = \begin{bmatrix}1&0&0\\-2&1&0\\3&-1&1\end{bmatrix}$, $U = \begin{bmatrix}2&-1&3\\0&3&1\\0&0&4\end{bmatrix}$;
   $\det A = 2\cdot3\cdot4 = 24$.
10. `try` **try-product-defined** — "A is $2\times 3$, B is $3\times 3$, C is $3\times 2$. Which expression is *not* defined?" answer
    `{type:'choice', value:'c'}`. Choices: (a) $ABC$ ($2\times2$); (b) $CA + B$ ($3\times 3$); (c) ✓ $AC + B$ (why it's undefined: $AC$ is $2\times 2$,
    B is $3\times 3$); (d) $BC$.
11. `try` **try-solution-set** — "Which describes the solution set of $\begin{bmatrix}1&-2&1\\2&-3&4\end{bmatrix}\mathbf x = \mathbf 0$?" answer
    `{type:'choice', value:'b'}`. Choices: (a) "only 0" (why: "3 unknowns, 2 pivots: a free variable."); (b) ✓ "a line through 0, spanned by $(-5,-2,1)$";
    (c) "a plane through 0" (why: "Only one free variable."); (d) "a line not through 0" (why: "Homogeneous solution sets always contain 0.").
12. `explain` **cp-review-1** — "Pick a $3\times 3$ matrix you know is not invertible and explain four different ways to see it (pivots, columns,
    determinant, the map)." Points: fewer than 3 pivots/RREF ≠ I; columns dependent (a dependence relation); $\det = 0$; the map collapses ℝ³ into a
    plane or line so it's neither one-to-one nor onto; $A\mathbf x = \mathbf 0$ has nontrivial solutions.
13. `scene` **exam-tips** — *Before the exam.* Stage: checklist tex: check solutions by substitution; label row operations; pivot positions from an
    echelon form; state which theorem you're using. Steps: (1) Every answer in this chapter can be checked by multiplying back. (2) Write the row
    operation you did on each line; it's how partial credit finds you.

---

# Unit 4 · Vector spaces

## 14. `vector-spaces` — Vector spaces, null spaces, and column spaces (Lay 4.1–4.2 · 17 min)

**Goals**
- Know what a vector space is (the ten axioms, informally: add and scale with the usual rules) and recognize $\mathbb P_n$, $M_{m\times n}$, function spaces.
- Check whether a subset is a subspace (zero, closed under +, closed under scaling); know a span is always a subspace (Theorem 1).
- Contrast $\operatorname{Nul} A$ (implicit: a condition) with $\operatorname{Col} A$ (explicit: a span); test membership in each.
- Define kernel and range of a linear transformation between vector spaces.

**Misconceptions:** "vectors are lists of numbers" (polynomials and functions are vectors too); a set containing 0 is automatically a
subspace; ℝ² is a subspace of ℝ³ (it's not even a subset); Nul A and Col A live in the same space.

**Beats**
1. `scene` **what-is-vector** — *What counts as a vector?* Stage: three columns: arrows in ℝ² (`s.plane` mini), polynomials
   ($1 + 2t$, $t - t^2$ plotted as curves with `s.path` and their sum), 2×2 matrices; the same "+" and "·c" operations animate in each.
   Steps: (1) Arrows add and scale. (2) So do polynomials: add coefficients, scale coefficients. (3) So do matrices and functions. (4) Lay's
   point: anything with a sensible addition and scaling is a vector space.
2. `scene` **axioms** — *The rules (Lay's ten axioms).* Stage: tex list of the 10 axioms in two columns, grouped (closure; addition rules;
   scaling rules) with soft highlights; examples $\mathbb P_n$, $M_{2\times2}$, $C[a,b]$ listed. Steps: (1) Closure under addition and scaling.
   (2) The familiar algebra: commutative, associative, a zero, negatives. (3) Scaling distributes and $1\mathbf u = \mathbf u$. (4) You'll rarely check all ten;
   mostly you'll check that something is a *subspace* of a space you already know.
3. `scene` **subspace-test** — *Subspaces: three checks.* Stage: tex (a) $\mathbf 0 \in H$, (b) closed under +, (c) closed under scalar multiples; then
   $H = \{p \in \mathbb P_2: p(0) = 0\}$ passes all three (green ticks), $K = \{p : p(0) = 1\}$ fails (a) (yellow). Steps: (1) Three checks. (2) $p(0) = 0$
   survives sums and scalings. (3) $p(0) = 1$ doesn't even contain the zero polynomial.
4. `try` **try-subspace-v** — "Which of these is a subspace of $M_{2\times2}$?" answer `{type:'choice', value:'b'}`. Choices: (a) "invertible 2×2 matrices"
   (why: "The zero matrix isn't invertible."); (b) ✓ "matrices with trace 0"; (c) "matrices with $\det = 0$" (why: "$\operatorname{diag}(1,0) + \operatorname{diag}(0,1) = I$
   has det 1."); (d) "matrices with all entries ≥ 0" (why: "Scaling by −1 leaves the set."). Solution: trace is linear: $\operatorname{tr}(A+B) = \operatorname{tr}A + \operatorname{tr}B$,
   $\operatorname{tr}(cA) = c\operatorname{tr}A$, $\operatorname{tr}0 = 0$.
5. `scene` **span-subspace** — *A span is always a subspace (Theorem 1).* Stage: $\operatorname{Span}\{\mathbf v_1, \mathbf v_2\}$ plane in `s.space`; two
   combinations added stay in the plane. Steps: (1) Sums of combinations are combinations. (2) So to show H is a subspace, it's often
   fastest to write it as a span: $\{(a - 2b, b, a): a,b \in\mathbb R\} = \operatorname{Span}\{(1,0,1), (-2,1,0)\}$.
6. `scene` **nul-implicit** — *Null space: a condition.* Stage: $A = \begin{bmatrix}1&1&-1\\2&-1&0\end{bmatrix}$; $W = \{(a,b,c): a + b - c = 0,\ 2a - b = 0\} = \operatorname{Nul} A$;
   test $\mathbf u = (1,2,3)$: $A\mathbf u = \mathbf 0$ (green). `s.space` shows two planes and their intersection line through (1,2,3). Steps: (1) Nul A is
   defined implicitly: by equations x must satisfy. (2) Membership is easy: multiply. (3) Describing it explicitly takes a row reduction:
   here it's the line spanned by (1,2,3).
7. `scene` **col-explicit** — *Column space: a recipe.* Stage: $A = \begin{bmatrix}1&2\\0&1\\1&3\end{bmatrix}$; Col A = plane spanned by columns; listing members is
   easy ($A\mathbf x$ for any x), but testing $\mathbf b = (1,1,1)$ needs a row reduction of $[A\mid\mathbf b]$ → inconsistent (yellow). Steps: (1) Col A is
   explicit: everything of the form $A\mathbf x$. (2) Producing members is free; testing one costs a row reduction. (3) That's the opposite of Nul A.
8. `scene` **contrast-table** — *Nul A vs Col A.* Stage: Lay's two-column comparison table built row by row with `s.tex`: lives in ℝⁿ vs ℝᵐ; implicit vs explicit;
   test by $A\mathbf v = \mathbf 0$ vs by consistency of $[A\mid\mathbf v]$; Nul A = {0} ⇔ one-to-one vs Col A = ℝᵐ ⇔ onto. Steps: (1) Read it row by row. (2) Keep
   the "lives in" row straight; it's where most mistakes start.
9. `try` **try-nul-col** — "For $A = \begin{bmatrix}1&1&-1\\2&-1&0\end{bmatrix}$, which statement is true?" answer `{type:'choice', value:'c'}`. Choices: (a)
   "$(1,2) \in \operatorname{Nul} A$" (why: "Nul A is in ℝ³; a vector in ℝ² can't be in it."); (b) "$\operatorname{Col} A$ is a plane in ℝ³" (why: "Columns have 2
   entries: Col A is in ℝ²."); (c) ✓ "$\operatorname{Col} A = \mathbb R^2$" (2 pivots in 2 rows); (d) "$\operatorname{Nul} A = \{\mathbf 0\}$" (why: "3 columns, 2 pivots: one free variable.").
10. `scene` **kernel-range** — *Kernel and range.* Stage: $T:\mathbb P_2 \to \mathbb R^2$, $T(p) = (p(0), p(1))$; diagram: $t^2 - t$ maps to (0,0) (kernel, yellow),
    $1 \mapsto (1,1)$, $t \mapsto (0,1)$ fill ℝ² (range green). Steps: (1) For any linear T, the kernel is what goes to zero, and the range is everything
    hit. (2) For $T(\mathbf x) = A\mathbf x$ they're Nul A and Col A. (3) Here the kernel is all multiples of $t^2 - t$, polynomials vanishing at 0 and 1.
11. `scene` **mistake-r2-r3** — *The trap: ℝ² inside ℝ³?* Stage: `s.space` with the $x_1x_2$-plane highlighted; tex: $\mathbb R^2 \not\subseteq \mathbb R^3$, but
    $H = \{(s,t,0)\}$ is a subspace of ℝ³ that *looks like* ℝ². Steps: (1) Vectors in ℝ² have two entries; they aren't in ℝ³ at all. (2) The plane
    $x_3 = 0$ is a subspace of ℝ³ that behaves like ℝ²: same shape, different space.
12. `workout` **wo-trace-proof** — "Prove that $H = \{A \in M_{2\times2} : a_{11} + a_{22} = 0\}$ is a subspace of $M_{2\times2}$." answer `{type:'proof'}`.
    rubric: ['Shows the zero matrix is in H (0 + 0 = 0).', 'Takes A, B in H and shows the trace of A + B is (a11 + b11) + (a22 + b22) = 0.',
    'Takes A in H and scalar c and shows c·a11 + c·a22 = 0.', 'Optionally writes H = Span{[[1,0],[0,-1]], [[0,1],[0,0]], [[0,0],[1,0]]}.']. Hints: (1) Name the entries
    of two general members. (2) Check each of the three conditions with the defining equation. Solution: as in the rubric; alternatively write every
    member as $a\begin{bmatrix}1&0\\0&-1\end{bmatrix} + b\begin{bmatrix}0&1\\0&0\end{bmatrix} + c\begin{bmatrix}0&0\\1&0\end{bmatrix}$ and cite Theorem 1.
13. `workout` **wo-nul-member** **(generate)** — "Let $A = \begin{bmatrix}1&2&-1\\3&5&1\end{bmatrix}$. Find a vector that spans Nul A." answer
    `{type:'basis', value:[['-7','4','1']]}` (the basis checker accepts any nonzero multiple). Hints: (1) $R_2 - 3R_1$ gives $(0,-1,4)$. (2) Free variable $x_3$.
    Solution: RREF $\begin{bmatrix}1&0&7\\0&1&-4\end{bmatrix}$; $\mathbf x = x_3(-7,4,1)$, any nonzero multiple works; check $A(-7,4,1) = (-7+8-1, -21+20+1) = \mathbf 0$.
    `generate`: random 2×3 rank 2 with integer null vector.
14. `explain` **cp-nul-col** — "Explain the difference between Nul A and Col A for a $3\times 5$ matrix A: where each lives, how it's described, and how to test
    membership." Points: Nul A ⊆ ℝ⁵, Col A ⊆ ℝ³; Nul A is implicit (solutions of $A\mathbf x = 0$), Col A explicit (all $A\mathbf x$); test v ∈ Nul A by computing
    $A\mathbf v$; test b ∈ Col A by checking $[A\mid\mathbf b]$ is consistent; both are subspaces.
15. `scene` **summary-vs** — *Summary.* Stage: the comparison table shrinks beside polynomial/matrix icons. Steps: (1) Vectors are anything you can add and
    scale. (2) Subspaces pass three checks or are spans. (3) Every matrix gives two: Nul and Col.

---

## 15. `bases-coordinates` — Bases and coordinate systems (Lay 4.3–4.4 · 16 min)

**Goals**
- Define linear independence and bases in a general vector space; know the standard bases of ℝⁿ and $\mathbb P_n$.
- Use the Spanning Set Theorem to shrink a spanning set to a basis; bases for Nul A and Col A.
- Find coordinates $[\mathbf x]_{\mathcal B}$ (unique representation theorem) and use the change-of-coordinates matrix $P_{\mathcal B}$.
- See the coordinate mapping $\mathbf x \mapsto [\mathbf x]_{\mathcal B}$ as an isomorphism onto ℝⁿ, and use it to work with polynomials.

**Misconceptions:** a basis is "the" basis (bases aren't unique); a spanning set with extra vectors is a basis; coordinates are the
entries of x (only in the standard basis); $[\mathbf x]_{\mathcal B} = P_{\mathcal B}\mathbf x$ (it's $P_{\mathcal B}^{-1}\mathbf x$).

**Beats**
1. `scene` **basis-idea** — *Just enough vectors.* Stage: `s.space`: $\mathbf v_1 = (1,0,1)$ blue, $\mathbf v_2 = (0,1,1)$ red, $\mathbf v_3 = (2,3,5)$ teal in their
   plane; v3 fades out (Spanning Set Theorem) and the plane stays. Steps: (1) A basis spans and has no redundancy. (2) If one vector is a
   combination of others ($\mathbf v_3 = 2\mathbf v_1 + 3\mathbf v_2$), drop it; the span is the same. (3) Keep dropping until independent: that's a basis.
2. `scene` **standard-bases** — *Standard bases.* Stage: tex $\{\mathbf e_1, \dots, \mathbf e_n\}$ for ℝⁿ and $\{1, t, \dots, t^n\}$ for $\mathbb P_n$; plots of 1, t, t².
   Steps: (1) The columns of I. (2) For polynomials, the powers of t: every polynomial is uniquely a combination of them.
3. `try` **try-poly-indep** — "Is $\{1 + t,\ t + t^2,\ 1 + 2t + t^2\}$ linearly independent in $\mathbb P_2$?" answer `{type:'choice', value:'no'}`. Choices `yes`
   (why: "Add the first two."), `no` ✓. Solution: $(1+t) + (t+t^2) = 1 + 2t + t^2$; in coordinates (1,1,0), (0,1,1), (1,2,1) are dependent.
4. `scene` **nul-col-bases** — *Bases for Nul A and Col A, again.* Stage: quick recap: pivot columns of A (Theorem 6) and parametric vectors for Nul A, with
   the reason it works: row operations keep the linear dependence relations among the columns, so A and its echelon form satisfy the same
   relations (animated: col 2 = 2·col 1 in both). Steps: (1) Row operations keep the dependence relations among columns.
   (2) That's why pivot columns of the echelon form point to a basis among the *original* columns.
5. `scene` **coordinates-2d** — *Coordinates: a new grid.* Stage: `s.plane`; basis $\mathbf b_1 = (2,1)$ blue, $\mathbf b_2 = (-1,1)$ red; `p.applyMatrix([[2,-1],[1,1]], {ghost:true})`
   draws the skewed grid; $\mathbf x = (4,5)$ green reached by walking 3 steps along b1, 2 along b2. Steps: (1) A basis lays a grid over the plane. (2) The
   coordinates of x are how many steps along each basis vector: $[\mathbf x]_{\mathcal B} = (3,2)$. (3) Unique, because the basis is independent.
6. `scene` **change-coords-matrix** — *Computing coordinates.* Stage: tex $\mathbf x = P_{\mathcal B}[\mathbf x]_{\mathcal B}$ with $P_{\mathcal B} = [\mathbf b_1\ \mathbf b_2]$;
   solve $\begin{bmatrix}2&-1\\1&1\end{bmatrix}\mathbf c = (4,5)$ by row reduction (`s.matrix` with augment); result (3,2). Steps: (1) $P_{\mathcal B}$ turns
   coordinates into the vector. (2) To go the other way, solve the system, or use $P_{\mathcal B}^{-1}$.
7. `blanks` **fill-coords** — "$\mathcal B = \{(1,1), (1,-1)\}$, $\mathbf x = (5,1)$": `[\mathbf x]_{\mathcal B} = \begin{bmatrix}` [3] `\\` [2] `\end{bmatrix}`.
   Solution: $c_1 + c_2 = 5$, $c_1 - c_2 = 1$.
8. `scene` **isomorphism** — *Polynomials become vectors.* Stage: $\mathcal B = \{1, t, t^2\}$; $p(t) = 3 + 2t - t^2 \mapsto (3, 2, -1)$; arrows between $\mathbb P_2$ and ℝ³
   with operations commuting (sum of polys ↔ sum of vectors). Steps: (1) The coordinate map is one-to-one, onto, and linear: an isomorphism. (2) So any
   question about $\mathbb P_2$ becomes a question about ℝ³, and row reduction does the work.
9. `try` **try-poly-coords** — "Find $[p]_{\mathcal B}$ for $p(t) = 3 + 2t - t^2$ and $\mathcal B = \{1,\ 1 + t,\ 1 + t + t^2\}$." answer `{type:'vector', value:['1','3','-1']}`.
   Hint: match the $t^2$ coefficient first. Solution: $c_3 = -1$; $c_2 + c_3 = 2 \Rightarrow c_2 = 3$; $c_1 + c_2 + c_3 = 3 \Rightarrow c_1 = 1$.
10. `scene` **mistake-inverse** — *The trap: which way does P go?* Stage: tex $[\mathbf x]_{\mathcal B} = P_{\mathcal B}\mathbf x$ crossed out (yellow) next to
    $\mathbf x = P_{\mathcal B}[\mathbf x]_{\mathcal B}$; numerical check with (3,2) ↦ (4,5). Steps: (1) $P_{\mathcal B}$ eats coordinates and returns the vector.
    (2) Applying it to x gives nonsense; you need its inverse.
11. `workout` **wo-coords-3d** **(generate)** — "$\mathcal B = \{(1,0,1), (1,1,0), (0,1,1)\}$ is a basis of ℝ³. Find $[\mathbf x]_{\mathcal B}$ for $\mathbf x = (3,5,4)$." answer
    `{type:'vector', value:['1','2','3']}`. Hints: (1) Solve $P_{\mathcal B}\mathbf c = \mathbf x$. (2) Adding all three equations gives $2(c_1 + c_2 + c_3) = 12$.
    Solution: $c_1 + c_2 = 3$, $c_2 + c_3 = 5$, $c_1 + c_3 = 4$ ⇒ sum 6 ⇒ $c_3 = 3, c_1 = 1, c_2 = 2$; check $1(1,0,1) + 2(1,1,0) + 3(0,1,1) = (3,5,4)$.
    `generate`: random unimodular $P_{\mathcal B}$ and integer coords.
12. `try` **try-basis-count** — "Which set is a basis for ℝ³?" answer `{type:'choice', value:'c'}`. Choices: (a) $\{(1,0,0),(0,1,0)\}$ (why: "Independent but doesn't span."); (b)
    $\{(1,0,0),(0,1,0),(0,0,1),(1,1,1)\}$ (why: "Spans, but four vectors in ℝ³ are dependent."); (c) ✓ $\{(1,1,0),(0,1,1),(1,0,1)\}$ (det 2 ≠ 0);
    (d) $\{(1,1,0),(0,1,1),(1,2,1)\}$ (why: "The third is the sum of the first two.").
13. `explain` **cp-coords** — "Why are coordinates relative to a basis unique, and why would they fail to be unique for a spanning set that isn't a basis?"
    Points: if $\mathbf x = \sum c_i\mathbf b_i = \sum d_i\mathbf b_i$ then $\sum (c_i - d_i)\mathbf b_i = 0$; independence forces $c_i = d_i$; with a dependence relation you can
    add it to any representation and get another; spanning guarantees existence, independence uniqueness.
14. `scene` **summary-bases** — *Summary.* Stage: skewed grid with (3,2) and the polynomial ↔ ℝ³ diagram. Steps: (1) A basis: spanning, no redundancy.
    (2) Coordinates: the weights, unique. (3) Coordinates turn any n-dimensional space into ℝⁿ.

---

## 16. `dimension-rank` — Dimension and rank (Lay 4.5–4.6 · 15 min)

**Goals**
- Know that all bases of V have the same size (dim V), and the dimensions of ℝⁿ, $\mathbb P_n$, $M_{m\times n}$, subspaces of ℝ³.
- Find dim Nul A and dim Col A from an echelon form; use the Basis Theorem.
- Find a basis for Row A (nonzero rows of an echelon form) and apply the Rank Theorem $\operatorname{rank}A + \dim\operatorname{Nul}A = n$, $\dim\operatorname{Row}A = \operatorname{rank}A$.
- Extend the IMT with rank conditions.

**Misconceptions:** row space basis = rows of A in pivot positions (use echelon rows, or the original rows only with care); rank of A and of
$A^T$ differ; dim of a subspace of ℝ³ defined by one equation is 1.

**Beats**
1. `scene` **same-size** — *Every basis has the same size.* Stage: plane in `s.space` with two different bases (blue/red pair, teal/orange pair) both of
   size 2; a third independent vector would leave the plane (yellow). Steps: (1) If V has a basis of n vectors, any n + 1 vectors are dependent (Theorem 9).
   (2) So every basis has n vectors: the dimension (Theorem 10). (3) $\dim\mathbb P_n = n + 1$, $\dim M_{2\times 2} = 4$, $\dim\{\mathbf 0\} = 0$.
2. `scene` **subspaces-r3** — *Subspaces of ℝ³ by dimension.* Stage: `s.space` showing 0-dim {0}, 1-dim line, 2-dim plane, 3-dim ℝ³, each appearing
   and fading. Steps: (1) Every subspace of ℝ³ is one of these four kinds. (2) A plane through 0 given by one equation has dimension 2.
3. `try` **try-dim** — "What is $\dim\{(a,b,c,d) : a - 3b + c = 0\}$?" answer `{type:'number', value: 3}`. Hint: one equation, four unknowns.
   Solution: it's Nul of the $1\times 4$ matrix $[1\ {-3}\ 1\ 0]$: rank 1, so $4 - 1 = 3$.
4. `scene` **row-space** — *The row space.* Stage: $A = \begin{bmatrix}1&2&1&0&3\\2&4&3&1&7\\1&2&0&-1&2\end{bmatrix}$ reduced to
   $\begin{bmatrix}1&2&0&-1&2\\0&0&1&1&1\\0&0&0&0&0\end{bmatrix}$; rows morph; tex Theorem 13: row-equivalent matrices have the same row space. Steps: (1)
   Row A is the span of the rows. (2) Row operations replace rows by combinations, so the row space doesn't change. (3) The nonzero rows of an
   echelon form are a basis: $(1,2,0,-1,2)$ and $(0,0,1,1,1)$.
5. `scene` **three-bases** — *Three bases from one reduction.* Stage: same A with three colored outputs: Row A (green, echelon rows), Col A (blue, pivot
   columns 1 and 3 of A: (1,2,1), (1,3,0)), Nul A (`C.orange`, three parametric vectors $(-2,1,0,0,0)$, $(1,0,-1,1,0)$, $(-2,0,-1,0,1)$).
   Steps: (1) Row space: rows of the echelon form. (2) Column space: columns of the original A. (3) Null space: one vector per free variable.
   (4) Dimensions 2, 2, 3.
6. `scene` **rank-theorem** — *The Rank Theorem.* Stage: tex $\operatorname{rank}A = \dim\operatorname{Col}A = \dim\operatorname{Row}A$ and
   $\operatorname{rank}A + \dim\operatorname{Nul}A = n$; for A: $2 + 3 = 5$; pivot count shown in both row and column directions. Steps: (1) Each pivot
   gives one basis row and one basis column, so row rank equals column rank. (2) Pivots plus free variables equals the number of columns.
   (3) And since $\operatorname{Row}A = \operatorname{Col}A^T$: $\operatorname{rank}A^T = \operatorname{rank}A$.
7. `blanks` **fill-rank-dims** — "A is $6\times 8$ with rank 4." `\dim\operatorname{Nul}A = ` [4]; `\dim\operatorname{Row}A = ` [4];
   `\dim\operatorname{Nul}A^T = ` [2]. Hint (last): "$A^T$ is $8\times 6$ with the same rank." Solution: $8 - 4$; rank; $6 - 4$.
8. `scene` **mistake-row-basis** — *The trap: rows of A at pivot positions.* Stage: matrix where the pivot rows of the echelon form came from a swap; picking rows
   1 and 2 of the original A (yellow) gives a dependent pair; correct: nonzero echelon rows. Example: $\begin{bmatrix}1&2\\2&4\\0&1\end{bmatrix}$: echelon rows
   (1,2), (0,1); original rows 1, 2 are dependent. Steps: (1) For Col A, go back to A. (2) For Row A, *don't*: use the echelon rows.
9. `try` **try-possible** — "Can a $5\times 7$ matrix have a one-dimensional null space?" answer `{type:'choice', value:'no'}`. Choices: `yes` (why: "That needs rank 6,
   but rank ≤ 5 (number of rows)."); `no` ✓. Solution: $\dim\operatorname{Nul}A = 7 - \operatorname{rank}A \ge 7 - 5 = 2$.
10. `scene` **basis-theorem-imt** — *Basis Theorem and the IMT, continued.* Stage: tex Theorem 12 (p independent vectors in a p-dim space span it); IMT
    additions: columns form a basis of ℝⁿ, Col A = ℝⁿ, rank A = n, dim Nul A = 0, Nul A = {0}. Steps: (1) Knowing the dimension halves the work: check
    either independence or spanning. (2) For square A, full rank is one more way to say invertible.
11. `workout` **wo-three-bases** **(generate)** — "For $A = \begin{bmatrix}1&-1&2&3\\2&-2&5&7\\-1&1&-1&-2\end{bmatrix}$ find a basis for Row A." answer
    `{type:'basis', value:[['1','-1','0','1'], ['0','0','1','1']]}`. Hints: (1) $R_2 - 2R_1$, $R_3 + R_1$. (2) Rows 2 and 3 become equal. Solution: echelon
    rows $(1,-1,2,3), (0,0,1,1)$ (or RREF rows $(1,-1,0,1), (0,0,1,1)$, same span); rank 2; Col A basis $(1,2,-1), (2,5,-1)$; Nul A basis
    $(1,1,0,0), (-1,0,-1,1)$; $2 + 2 = 4$. `generate`: random 3×4 rank 2.
12. `explain` **cp-row-col-rank** — "Why do Row A and Col A always have the same dimension, even though they live in different spaces?" Points: both equal
    the number of pivots; pivot columns of A form a basis of Col A; nonzero rows of the echelon form (one per pivot) form a basis of Row A; row
    operations don't change the row space.
13. `scene` **summary-dim** — *Summary.* Stage: the three colored bases with their dimensions. Steps: (1) Dimension is the size of any basis. (2) One
    reduction gives bases of Row, Col, Nul. (3) rank + nullity = n.

---

## 17. `change-of-basis` — Change of basis (Lay 4.7 · 13 min)

**Goals**
- Understand $\underset{\mathcal C\leftarrow\mathcal B}{P}$ as the matrix translating $\mathcal B$-coordinates into $\mathcal C$-coordinates (Theorem 15).
- Compute it from columns $[\mathbf b_j]_{\mathcal C}$, via row reducing $[\mathbf c_1\ \mathbf c_2 \mid \mathbf b_1\ \mathbf b_2]$.
- Use $\underset{\mathcal B\leftarrow\mathcal C}{P} = \big(\underset{\mathcal C\leftarrow\mathcal B}{P}\big)^{-1}$.

**Misconceptions:** columns of $P_{\mathcal C\leftarrow\mathcal B}$ are $[\mathbf c_j]_{\mathcal B}$ (backwards); row reducing $[\mathcal B\mid\mathcal C]$; forgetting that
the vector x itself doesn't change, only its description.

**Beats**
1. `scene` **two-languages** — *One vector, two descriptions.* Stage: `s.plane` with x = (1,3) green; grid for $\mathcal B = \{(1,2),(2,3)\}$ (blue/red ghost) and then for
   $\mathcal C = \{(1,1),(1,2)\}$ (teal/orange ghost); labels $[\mathbf x]_{\mathcal B} = (3,-1)$, $[\mathbf x]_{\mathcal C} = (-1,2)$. Steps: (1) Same arrow, two grids.
   (2) In $\mathcal B$ it's $3\mathbf b_1 - \mathbf b_2$; in $\mathcal C$ it's $-\mathbf c_1 + 2\mathbf c_2$. (3) Changing basis translates between descriptions;
   x never moves.
2. `scene` **theorem-15** — *The translation matrix.* Stage: tex $[\mathbf x]_{\mathcal C} = \underset{\mathcal C\leftarrow\mathcal B}{P}[\mathbf x]_{\mathcal B}$ with
   $\underset{\mathcal C\leftarrow\mathcal B}{P} = [\,[\mathbf b_1]_{\mathcal C}\ [\mathbf b_2]_{\mathcal C}\,]$; reasoning: $[\cdot]_{\mathcal C}$ is linear, so
   $[\mathbf x]_{\mathcal C} = x_1[\mathbf b_1]_{\mathcal C} + x_2[\mathbf b_2]_{\mathcal C}$. Steps: (1) Write each old basis vector in the new basis. (2) Those
   are the columns. (3) Read the subscript right to left: from $\mathcal B$ to $\mathcal C$.
3. `scene` **row-reduce-p** — *Computing P.* Stage: `s.matrix([[1,1,1,2],[1,2,2,3]], {augment: 2})` = $[\mathbf c_1\ \mathbf c_2\mid\mathbf b_1\ \mathbf b_2]$; $R_2 - R_1$,
   $R_1 - R_2$ → $[I \mid P]$ with $P = \begin{bmatrix}0&1\\1&1\end{bmatrix}$ green. Steps: (1) Solving for $[\mathbf b_1]_{\mathcal C}$ and $[\mathbf b_2]_{\mathcal C}$
   is two systems with the same coefficient matrix. (2) Do them at once. (3) Check: $\mathbf b_2 = \mathbf c_1 + \mathbf c_2 = (2,3)$.
4. `try` **try-apply-p** — "Using $P = \begin{bmatrix}0&1\\1&1\end{bmatrix}$ ($\mathcal C \leftarrow \mathcal B$), find $[\mathbf x]_{\mathcal C}$ for $[\mathbf x]_{\mathcal B} = (3,-1)$." answer
   `{type:'vector', value:['-1','2']}`. Hint: multiply. Solution: $(0\cdot3 + 1\cdot(-1),\ 3 - 1) = (-1, 2)$; both describe $\mathbf x = (1,3)$.
5. `scene` **inverse-direction** — *Going back.* Stage: tex $\underset{\mathcal B\leftarrow\mathcal C}{P} = P^{-1} = \begin{bmatrix}-1&1\\1&0\end{bmatrix}$; arrows
   between two coordinate planes labelled $\mathcal B$, $\mathcal C$. Steps: (1) The reverse translation is the inverse matrix. (2) With the standard basis,
   $\underset{\mathcal E\leftarrow\mathcal B}{P} = P_{\mathcal B}$: the matrix from 4.4 is a special case.
6. `scene` **mistake-order** — *The trap: the wrong augmented matrix.* Stage: $[\mathbf b_1\ \mathbf b_2\mid\mathbf c_1\ \mathbf c_2]$ reduced (yellow), giving
   $\underset{\mathcal B\leftarrow\mathcal C}{P}$ instead. Steps: (1) The basis you're translating *into* goes on the left. (2) Swap them and you get the inverse.
7. `blanks` **fill-p** — `[\,\mathbf c_1\ \mathbf c_2 \mid \mathbf b_1\ \mathbf b_2\,] \sim [\,I \mid ` [chips `\underset{\mathcal C\leftarrow\mathcal B}{P}` ✓,
   `\underset{\mathcal B\leftarrow\mathcal C}{P}`, `P_{\mathcal B}`] `\,]`; `\text{columns of } \underset{\mathcal C\leftarrow\mathcal B}{P} \text{ are }` [chips
   `[\mathbf b_j]_{\mathcal C}` ✓, `[\mathbf c_j]_{\mathcal B}`, `\mathbf b_j`].
8. `workout` **wo-change** **(generate)** — "$\mathcal B = \{(3,7), (1,1)\}$ and $\mathcal C = \{(1,2), (1,3)\}$. Find $\underset{\mathcal C\leftarrow\mathcal B}{P}$." answer
   `{type:'matrix', value:[[2,2],[1,-1]]}`. Hints: (1) Row reduce $\begin{bmatrix}1&1&3&1\\2&3&7&1\end{bmatrix}$. (2) $R_2 - 2R_1$ gives $(0,1\mid 1,-1)$.
   Solution: $R_1 - R_2$: $(1,0\mid 2,2)$; $P = \begin{bmatrix}2&2\\1&-1\end{bmatrix}$; check $\mathbf b_1 = 2\mathbf c_1 + \mathbf c_2 = (3,7)$,
   $\mathbf b_2 = 2\mathbf c_1 - \mathbf c_2 = (1,1)$. `generate`: random unimodular C, integer P, B = C·P.
9. `try` **try-poly-change** — "In $\mathbb P_1$, $\mathcal B = \{1, t\}$ and $\mathcal C = \{1,\ 1 + t\}$. Which is $\underset{\mathcal C\leftarrow\mathcal B}{P}$?" answer
   `{type:'choice', value:'a'}`. Choices: (a) ✓ $\begin{bmatrix}1&-1\\0&1\end{bmatrix}$ ($t = -1\cdot 1 + 1\cdot(1+t)$); (b) $\begin{bmatrix}1&1\\0&1\end{bmatrix}$
   (why: "That's $\underset{\mathcal B\leftarrow\mathcal C}{P}$: it writes $1 + t$ in $\mathcal B$."); (c) $I$ (why: "Different bases, different coordinates.").
10. `scene` **via-standard** — *A route through the standard basis.* Stage: three coordinate planes in a row labelled $\mathcal B$, $\mathcal E$ (standard), $\mathcal C$; arrows $P_{\mathcal B}$ (B → E)
    and $P_{\mathcal C}^{-1}$ (E → C) compose into one arrow $\underset{\mathcal C\leftarrow\mathcal B}{P} = P_{\mathcal C}^{-1}P_{\mathcal B}$; with the ℝ² example:
    $\begin{bmatrix}2&-1\\-1&1\end{bmatrix}\begin{bmatrix}1&2\\2&3\end{bmatrix} = \begin{bmatrix}0&1\\1&1\end{bmatrix}$ (matches beat 3); with the $\mathbb P_1$ example, $P_{\mathcal C}^{-1} = \begin{bmatrix}1&-1\\0&1\end{bmatrix}$.
    Steps: (1) Another way to think about it: go from $\mathcal B$-coordinates to standard ones, then from standard to $\mathcal C$. (2) That's $P_{\mathcal C}^{-1}P_{\mathcal B}$, the same matrix the
    row reduction produced. (3) The row reduction is just the efficient way to compute this product.
11. `explain` **cp-change** — "Why are the columns of $\underset{\mathcal C\leftarrow\mathcal B}{P}$ the $\mathcal C$-coordinates of the $\mathcal B$ basis vectors?" Points:
    $\mathbf x = x_1\mathbf b_1 + x_2\mathbf b_2$ with $(x_1,x_2) = [\mathbf x]_{\mathcal B}$; the coordinate map $[\cdot]_{\mathcal C}$ is linear; so
    $[\mathbf x]_{\mathcal C} = x_1[\mathbf b_1]_{\mathcal C} + x_2[\mathbf b_2]_{\mathcal C}$, a matrix–vector product with those columns; feeding in $\mathbf e_j$ returns column j.
12. `scene` **summary-change** — *Summary.* Stage: two grids with the translation arrow. Steps: (1) Columns: old basis in new coordinates. (2) Row reduce
    [new | old]. (3) Reverse with the inverse. Next time this pays off: a smart basis makes a matrix diagonal.

---

## 18. `markov` — Difference equations and Markov chains (Lay 4.8–4.9 · 14 min)

**Goals**
- See solutions of a linear difference equation as a vector space of signals; test independence with the Casorati matrix.
- Model a system with a stochastic matrix and state vectors $\mathbf x_{k+1} = P\mathbf x_k$.
- Find the steady-state vector by solving $(P - I)\mathbf x = \mathbf 0$ and normalizing; know regular chains converge to it (Theorem 18).

**Misconceptions:** rows of P sum to 1 (in Lay, columns do); the steady state depends on the start; forgetting to normalize the
null vector into a probability vector.

**Beats**
1. `scene` **signals** — *Sequences as vectors.* Stage: stem plots (`s.line` + `s.dot`) of $2^k$ (blue) and $3^k$ (red) for k = 0..4 scaled; tex
   $y_{k+2} - 5y_{k+1} + 6y_k = 0$. Steps: (1) A signal is an infinite list of numbers; signals add and scale, so they form a vector space $\mathbb S$.
   (2) Plug in $2^k$: $4\cdot2^k - 10\cdot2^k + 6\cdot2^k = 0$. It works, and so does $3^k$. (3) Solutions of this order-2 linear equation form a
   2-dimensional subspace (Theorem 17), so $y_k = c_1 2^k + c_2 3^k$ is every solution.
2. `scene` **casorati** — *Are they independent?* Stage: Casorati matrix $\begin{bmatrix}1&1\\2&3\end{bmatrix}$ (values at k = 0, 1), det 1 ≠ 0. Steps: (1) Stack the
   signals' values at consecutive times. (2) An invertible Casorati matrix at one k means the signals are independent.
3. `try` **try-signal** — "Is $y_k = (-1)^k$ a solution of $y_{k+2} - 5y_{k+1} + 6y_k = 0$?" answer `{type:'choice', value:'no'}`. Choices `yes` (why: "Substitute:
   $1 + 5 + 6 = 12$ times $(-1)^k$, not 0."), `no` ✓. Solution: $(-1)^{k}(1 - 5(-1) + 6) = 12(-1)^k \neq 0$.
4. `scene` **markov-setup** — *A population that moves.* Stage: two nodes "City" and "Suburbs" (`s.circle` + `s.text`) with arrows labelled 0.9/0.1 and 0.2/0.8;
   the stochastic matrix $P = \begin{bmatrix}0.9&0.2\\0.1&0.8\end{bmatrix}$ builds column by column. Steps: (1) Each year 10% of the city moves out and
   20% of the suburbs moves in. (2) Column j says where the people in state j go; each column sums to 1. (3) A probability vector has nonnegative
   entries summing to 1.
5. `scene` **iterate** — *Run the chain.* Stage: bar chart (two `s.rect`s) animating $\mathbf x_0 = (0.5, 0.5) \to \mathbf x_1 = (0.55, 0.45) \to \mathbf x_2 = (0.585, 0.415) \to \cdots$
   settling near $(0.667, 0.333)$ (each step a tween of heights). Steps: (1) $\mathbf x_{k+1} = P\mathbf x_k$. (2) Year one: 55% city. (3) Keep going: the
   bars settle down.
6. `scene` **steady-state** — *Steady state.* Stage: tex $P\mathbf q = \mathbf q \iff (P - I)\mathbf q = \mathbf 0$; $P - I = \begin{bmatrix}-0.1&0.2\\0.1&-0.2\end{bmatrix}$
   reduces to $[1\ {-2}]$; null vector (2,1); normalize to $\mathbf q = (2/3, 1/3)$ green. Steps: (1) A steady state doesn't change. (2) Solve
   $(P - I)\mathbf x = \mathbf 0$. (3) Scale so the entries add to 1.
7. `blanks` **fill-steady** — "$P = \begin{bmatrix}0.7&0.4\\0.3&0.6\end{bmatrix}$": `\mathbf q = \begin{bmatrix}` [typed 4/7] `\\` [typed 3/7] `\end{bmatrix}`. Hint:
   $(P - I)\mathbf x = \mathbf 0$ gives $0.3x_1 = 0.4x_2$. Solution: null vector (4,3), divide by 7.
8. `scene` **theorem-18** — *Regular chains converge.* Stage: three different starting bar charts all converging to (2/3, 1/3). Steps: (1) If some power of P has
   all positive entries, P is regular. (2) Then there's a unique steady state, and every start converges to it. (3) The starting split is forgotten.
9. `scene` **mistake-rows** — *The trap: rows vs columns.* Stage: the same P transposed with yellow "rows sum to 1" ✗ (other textbooks' convention); multiplying
   $\mathbf x$ by it gives nonsense percentages. Steps: (1) In Lay, columns sum to 1, and P multiplies column vectors on the left. (2) Read each column as
   "from state j".
10. `try` **try-stochastic** — "Which is a stochastic matrix?" answer `{type:'choice', value:'b'}`. Choices: (a) $\begin{bmatrix}0.5&0.3\\0.5&0.6\end{bmatrix}$ (why: "Column 2
    sums to 0.9."); (b) ✓ $\begin{bmatrix}0.2&1\\0.8&0\end{bmatrix}$; (c) $\begin{bmatrix}0.6&0.4\\0.6&0.4\end{bmatrix}$ (why: "Rows sum to 1, but columns sum to
    1.2 and 0.8.").
11. `workout` **wo-steady3** **(generate)** — "Find the steady-state vector of $P = \begin{bmatrix}0.6&0.3&0.2\\0.2&0.6&0.2\\0.2&0.1&0.6\end{bmatrix}$." answer
    `{type:'vector', value:['7/18','1/3','5/18']}`. Hints: (1) Multiply $P - I$ by 10 to clear decimals: $\begin{bmatrix}-4&3&2\\2&-4&2\\2&1&-4\end{bmatrix}$. (2) The null
    space is spanned by (7, 6, 5). Solution: row reduce to $x_1 = \tfrac75x_3$, $x_2 = \tfrac65x_3$; take (7,6,5), sum 18; $\mathbf q = (7/18, 6/18, 5/18)$; check
    $P\mathbf q = \mathbf q$. `generate`: random 3×3 column-stochastic with tenths and a steady state with denominator ≤ 30.
12. `explain` **cp-steady** — "Why is a steady-state vector an element of $\operatorname{Nul}(P - I)$, and why do we need to rescale it?" Points: $P\mathbf q = \mathbf q$ rearranges to
    $(P - I)\mathbf q = 0$; null space vectors are determined only up to scaling; a probability vector must sum to 1 (and be nonnegative), which fixes the
    scale; for regular P the null space is one-dimensional so q is unique.
13. `scene` **summary-markov** — *Summary.* Stage: converging bars and the q vector. Steps: (1) Signals solving linear recurrences form vector spaces. (2) Markov
    chains: $\mathbf x_{k+1} = P\mathbf x_k$. (3) Steady state: a null vector of $P - I$, normalized; next lecture we'll recognize it as an eigenvector for eigenvalue 1.

---

# Unit 5 · Eigenvalues

## 19. `eigen` — Eigenvectors and the characteristic equation (Lay 5.1–5.2 · 18 min)

**Goals**
- See eigenvectors as the directions a matrix only stretches: $A\mathbf x = \lambda\mathbf x$, $\mathbf x \ne \mathbf 0$.
- Check whether a given vector or number is an eigenvector/eigenvalue; find eigenspaces as $\operatorname{Nul}(A - \lambda I)$.
- Find eigenvalues from the characteristic equation $\det(A - \lambda I) = 0$; triangular matrices; 0 is an eigenvalue iff A is singular.
- Know eigenvectors for distinct eigenvalues are independent (Theorem 2) and similar matrices share characteristic polynomials (Theorem 4).

**Misconceptions:** the zero vector is an eigenvector; eigenvalues are found by row reducing A (row ops change eigenvalues); "λ = 0 means no
eigenvector"; algebraic multiplicity = dimension of eigenspace always.

**Beats**
1. `scene` **stay-on-line** — *Vectors that stay on their line.* Stage: `s.plane`; $A = \begin{bmatrix}3&1\\0&2\end{bmatrix}$; draw `p.span` of (1,0) and (−1,1) faintly (purple),
   plus a generic vector (1,1) blue; `applyMatrix(A)`: the generic vector gets knocked off its span (yellow ghost line), while (1,0) triples and (−1,1)
   doubles along their own lines (purple). Steps: (1) Most vectors get rotated off their span. (2) A few special ones only stretch. (3) Those are
   eigenvectors, and the stretch factor is the eigenvalue: 3 for (1,0), 2 for (−1,1).
2. `scene` **definition** — *The definition.* Stage: tex $A\mathbf x = \lambda\mathbf x$, $\mathbf x \ne \mathbf 0$ with parts colored purple; check (−1,1): $A(-1,1) = (-2,2) = 2(-1,1)$.
   Steps: (1) An eigenvector is a *nonzero* x with $A\mathbf x = \lambda\mathbf x$. (2) λ can be zero or negative: a negative λ flips the vector.
   (3) Checking a candidate is just a multiplication.
3. `try` **try-is-eigvec** — "Let $A = \begin{bmatrix}4&-2\\1&1\end{bmatrix}$. Which vector is an eigenvector?" answer `{type:'choice', value:'a'}`. Choices: (a) ✓ (1,1) (A gives
   (2,2), λ = 2); (b) (1,0) (why: "A(1,0) = (4,1), not a multiple of (1,0)."); (c) (0,0) (why: "Eigenvectors must be nonzero."); (d) (1,2) (why: "A(1,2) = (0,3).").
4. `scene` **eigenspace** — *Eigenspaces.* Stage: tex $A\mathbf x = \lambda\mathbf x \iff (A - \lambda I)\mathbf x = \mathbf 0$; for λ = 3 and A from beat 3:
   $A - 3I = \begin{bmatrix}1&-2\\1&-2\end{bmatrix}$, null space spanned by (2,1) (purple `p.span`). Steps: (1) Move everything to one side. (2) λ is an
   eigenvalue exactly when $A - \lambda I$ has a nontrivial null space. (3) The eigenspace is $\operatorname{Nul}(A - \lambda I)$: a subspace, including 0.
5. `scene` **char-eq** — *Finding eigenvalues: the characteristic equation.* Stage: tex $\det(A - \lambda I) = 0$; for $A = \begin{bmatrix}4&-2\\1&1\end{bmatrix}$:
   $(4-\lambda)(1-\lambda) + 2 = \lambda^2 - 5\lambda + 6 = (\lambda-2)(\lambda-3)$; roots 2, 3 purple. Visual: `applyMatrix(A - \lambda I)` for λ sliding,
   area collapsing to zero exactly at 2 and 3. Steps: (1) Nontrivial null space means $A - \lambda I$ is not invertible. (2) So its determinant is zero.
   (3) That's a polynomial equation in λ.
6. `blanks` **fill-char** — "$A = \begin{bmatrix}1&4\\2&3\end{bmatrix}$": line 1 `\det(A - \lambda I) = \lambda^2 - ` [typed 4] `\lambda ` [chips `-\,5` ✓, `+\,5`, `-\,11`];
   line 2 `\text{eigenvalues: }` [typed, `{type:'set', value:['5','-1']}`]. Solution: $(1-\lambda)(3-\lambda) - 8 = \lambda^2 - 4\lambda - 5 = (\lambda - 5)(\lambda + 1)$.
7. `scene` **worked-3x3** — *A 3×3 example.* Stage: $A = \begin{bmatrix}2&0&0\\1&3&1\\1&1&3\end{bmatrix}$; expand along row 1: $(2-\lambda)[(3-\lambda)^2 - 1] = -(\lambda-2)^2(\lambda-4)$;
   then $A - 2I = \begin{bmatrix}0&0&0\\1&1&1\\1&1&1\end{bmatrix}$ → eigenspace basis $(-1,1,0), (-1,0,1)$ (a plane, `s.space` purple patch); $A - 4I$ → (0,1,1) (purple line).
   Steps: (1) Row 1 has two zeros, so expand there. (2) λ = 2 is a double root; λ = 4 simple. (3) λ = 2's eigenspace is a whole plane; λ = 4's is a line.
8. `scene` **triangular-zero** — *Two shortcuts.* Stage: triangular matrix with diagonal entries ringed purple (Theorem 1); then tex "0 is an eigenvalue ⇔ A not
   invertible" added to the IMT list. Steps: (1) Triangular: eigenvalues are the diagonal entries. (2) λ = 0 means $A\mathbf x = \mathbf 0$ has a nonzero solution:
   A is singular.
9. `scene` **mistake-rowreduce** — *The trap: row reducing first.* Stage: A = [[4,−2],[1,1]] row reduced to triangular $\begin{bmatrix}4&-2\\0&3/2\end{bmatrix}$ with "eigenvalues 4,
   3/2?" (yellow ✗). Steps: (1) Row operations change eigenvalues. (2) Only the characteristic equation, on A itself, finds them.
10. `try` **try-eigval** — "Is λ = 4 an eigenvalue of $\begin{bmatrix}3&0&-1\\2&3&1\\-3&4&5\end{bmatrix}$?" answer `{type:'choice', value:'yes'}`. Choices `yes` ✓, `no` (why: "Check whether
    $A - 4I$ is singular: its columns are dependent."). Hint: row reduce $A - 4I$. Solution: $A - 4I = \begin{bmatrix}-1&0&-1\\2&-1&1\\-3&4&1\end{bmatrix}$ has a free variable; eigenvector
    $(-1,-1,1)$: $A(-1,-1,1) = (-4,-4,4)$. (4 is the only rational eigenvalue; the other two are irrational.)
11. `scene` **independent-eigvecs** — *Distinct eigenvalues, independent eigenvectors (Theorem 2).* Stage: (1,1) and (2,1) for λ = 2, 3 (purple, different shades) shown not
    collinear. Steps: (1) Eigenvectors for different eigenvalues can't be dependent. (2) So an $n\times n$ matrix with n distinct eigenvalues has n independent eigenvectors:
    a basis. That's the door to next lecture.
12. `scene` **similarity** — *Similar matrices.* Stage: tex $B = P^{-1}AP$; same characteristic polynomial, same eigenvalues (Theorem 4); warning: same eigenvalues doesn't imply similar
    ($I$ vs $\begin{bmatrix}1&1\\0&1\end{bmatrix}$). Steps: (1) A and B are similar when $B = P^{-1}AP$. (2) They share characteristic polynomials. (3) The converse fails.
13. `workout` **wo-eigenspace** **(generate)** — "Find a basis for the eigenspace of $A = \begin{bmatrix}3&-2&4\\0&1&4\\0&0&3\end{bmatrix}$ for λ = 3." answer
    `{type:'basis', value:[['1','0','0'], ['0','2','1']]}`. Hints: (1) Form $A - 3I$. (2) $A - 3I = \begin{bmatrix}0&-2&4\\0&-2&4\\0&0&0\end{bmatrix}$: one equation.
    Solution: $-2x_2 + 4x_3 = 0 \Rightarrow x_2 = 2x_3$, $x_1$ free: $\mathbf x = x_1(1,0,0) + x_3(0,2,1)$; dimension 2 (the other eigenvalue, 1, has eigenvector (1,1,0)).
    `generate`: triangular 3×3 with a repeated diagonal entry, answer via `eigenspace`.
14. `explain` **cp-eigen** — "Explain why λ is an eigenvalue of A exactly when $\det(A - \lambda I) = 0$." Points: λ is an eigenvalue iff $A\mathbf x = \lambda\mathbf x$ has a nonzero solution;
    iff $(A - \lambda I)\mathbf x = \mathbf 0$ has a nontrivial solution; iff $A - \lambda I$ is not invertible (IMT); iff its determinant is 0.
15. `scene` **summary-eigen** — *Summary.* Stage: replay of beat 1 with purple lines. Steps: (1) Eigenvectors stay on their line. (2) Eigenvalues solve $\det(A - \lambda I) = 0$.
    (3) Eigenspaces are null spaces.

---

## 20. `diagonalization` — Diagonalization (Lay 5.3–5.4 · 17 min)

**Goals**
- Write $A = PDP^{-1}$ with eigenvectors in P and eigenvalues in D, and use it to compute $A^k$.
- Apply the Diagonalization Theorem (n independent eigenvectors) and Theorem 6 (n distinct eigenvalues suffices); decide when it fails.
- Find the matrix of a linear transformation relative to a basis ($\mathcal B$-matrix), and see $P^{-1}AP$ as A in the eigenvector basis.

**Misconceptions:** every matrix is diagonalizable; repeated eigenvalues ⇒ not diagonalizable; columns of P and diagonal of D listed in mismatched order;
$A^k = PD^kP$ (missing the inverse).

**Beats**
1. `scene` **eigenbasis-grid** — *In the right basis, A just stretches.* Stage: `s.plane`; $A = \begin{bmatrix}4&-2\\1&1\end{bmatrix}$; eigen-grid along (1,1) and (2,1) (purple ghost
   lines); `applyMatrix(A)`: the eigen-grid cells stretch by 2 along (1,1) and 3 along (2,1) without shearing. Steps: (1) In standard coordinates A shears and
   stretches. (2) Along its eigenvectors it only scales. (3) Describe vectors in the eigenbasis and A becomes diagonal.
2. `scene` **factor** — *A = PDP⁻¹.* Stage: tex $P = \begin{bmatrix}1&2\\1&1\end{bmatrix}$ (columns purple), $D = \begin{bmatrix}2&0\\0&3\end{bmatrix}$; three-arrow diagram: $P^{-1}$
   (to eigen-coordinates), D (scale), P (back); a vector traced through all three. Steps: (1) $P^{-1}$ translates into eigen-coordinates. (2) D scales each coordinate.
   (3) P translates back. (4) Check $AP = PD$ column by column: $A\mathbf v_j = \lambda_j\mathbf v_j$.
3. `scene` **powers** — *Powers become easy.* Stage: tex $A^k = PD^kP^{-1}$ with the middle P⁻¹P pairs cancelling (animated `fadeOut`); $D^k = \operatorname{diag}(2^k, 3^k)$;
   $A^k = \begin{bmatrix}-2^k + 2\cdot 3^k & 2^{k+1} - 2\cdot 3^k\\ -2^k + 3^k & 2^{k+1} - 3^k\end{bmatrix}$. Steps: (1) Inner pairs cancel. (2) Powers of a diagonal matrix
   are powers of its entries. (3) So a closed formula for every k.
4. `try` **try-power** — "Using $A = PDP^{-1}$ above, find the (1,1) entry of $A^3$." answer `{type:'number', value: 46}`. Hint: $-2^k + 2\cdot3^k$. Solution: $-8 + 54 = 46$;
   direct check $A^3 = \begin{bmatrix}46&-38\\19&-11\end{bmatrix}$.
5. `scene` **diag-theorem** — *When does it work? (Theorem 5).* Stage: tex: A ($n\times n$) is diagonalizable ⇔ A has n linearly independent eigenvectors; Theorem 6 (n distinct
   eigenvalues ⇒ diagonalizable); Theorem 7 (dim of each eigenspace ≤ multiplicity; diagonalizable iff they sum to n). Steps: (1) You need a full basis of eigenvectors.
   (2) Distinct eigenvalues guarantee it. (3) With repeats, count eigenspace dimensions.
6. `scene` **shear-fails** — *When it fails.* Stage: shear $\begin{bmatrix}1&1\\0&1\end{bmatrix}$ applied: only the $x_1$-axis stays on its line (purple); λ = 1 double, eigenspace
   dimension 1 (yellow "1 < 2"). Steps: (1) A shear has one eigenvalue, 1, twice. (2) But only one direction of eigenvectors. (3) Not enough for a basis: not diagonalizable.
7. `try` **try-diagonalizable** — "Which matrix is *not* diagonalizable?" answer `{type:'choice', value:'a'}`. Choices: (a) ✓ $\begin{bmatrix}2&1\\0&2\end{bmatrix}$; (b) $\begin{bmatrix}2&0\\0&2\end{bmatrix}$
   (why: "Repeated eigenvalue, but every vector is an eigenvector: already diagonal."); (c) $\begin{bmatrix}1&1\\0&2\end{bmatrix}$ (why: "Distinct eigenvalues 1, 2."); (d)
   $\begin{bmatrix}5&0&0\\1&2&0\\3&4&1\end{bmatrix}$ (why: "Distinct eigenvalues 5, 2, 1.").
8. `scene` **worked-3x3** — *Diagonalizing a 3×3.* Stage: $A = \begin{bmatrix}2&0&0\\1&2&1\\-1&0&1\end{bmatrix}$; characteristic polynomial $(2-\lambda)^2(1-\lambda)$ (expand row 1);
   $A - 2I$ → basis $(0,1,0), (-1,0,1)$; $A - I$ → $(0,-1,1)$; P and D assemble column by column with matching colors. Steps: (1) Eigenvalues 2, 2, 1. (2) λ = 2's eigenspace has
   dimension 2: enough. (3) $P = \begin{bmatrix}0&-1&0\\1&0&-1\\0&1&1\end{bmatrix}$, $D = \operatorname{diag}(2,2,1)$. (4) Check $AP = PD$ rather than inverting P.
9. `scene` **mistake-order** — *The trap: mismatched order.* Stage: P with columns in one order and D in another (yellow), AP ≠ PD shown entrywise. Steps: (1) Column j of P must go with
   the j-th diagonal entry of D. (2) Any order works if they match.
10. `workout` **wo-diagonalize** — "Diagonalize $A = \begin{bmatrix}5&-2&2\\0&3&0\\-4&4&-1\end{bmatrix}$ if possible. Enter a basis for the eigenspace with λ = 3." answer
    `{type:'basis', value:[['1','1','0'], ['-1','0','1']]}`. Hints: (1) Expand along row 2: $(3-\lambda)[(5-\lambda)(-1-\lambda) + 8] = (3-\lambda)(\lambda-3)(\lambda-1)$. (2) $A - 3I$ has rank 1.
    Solution: λ = 3 (double) eigenspace from $2x_1 - 2x_2 + 2x_3 = 0$: $(1,1,0), (-1,0,1)$; λ = 1: $(1,0,-2)$ (any multiple of $(-1/2,0,1)$); diagonalizable with
    $P = \begin{bmatrix}1&-1&1\\1&0&0\\0&1&-2\end{bmatrix}$, $D = \operatorname{diag}(3,3,1)$.
11. `scene` **b-matrix** — *Matrices of maps relative to a basis (5.4).* Stage: diagram $V \xrightarrow{T} V$ with coordinate maps down to ℝⁿ; tex $[T(\mathbf x)]_{\mathcal B} = [T]_{\mathcal B}[\mathbf x]_{\mathcal B}$,
    columns $[T(\mathbf b_j)]_{\mathcal B}$; example: derivative on $\mathbb P_2$ with $\{1,t,t^2\}$ → $\begin{bmatrix}0&1&0\\0&0&2\\0&0&0\end{bmatrix}$. Steps: (1) Any linear map on a
    finite-dimensional space has a matrix once you choose a basis. (2) Column j: the image of the j-th basis vector, in coordinates. (3) For $T(\mathbf x) = A\mathbf x$ and basis
    $\mathcal B$ of columns of P: $[T]_{\mathcal B} = P^{-1}AP$ (Theorem 8). With eigenvectors, that's D.
12. `blanks` **fill-bmatrix** — "$T:\mathbb P_2 \to \mathbb P_2$, $T(p) = p + tp'$, $\mathcal B = \{1,t,t^2\}$": `[T]_{\mathcal B} = \operatorname{diag}(` [1] `,` [2] `,` [3] `)`. Solution:
    $T(1) = 1$, $T(t) = 2t$, $T(t^2) = 3t^2$.
13. `try` **try-distinct** — "A $4\times 4$ matrix has eigenvalues 1, 2, 2, 5, and the eigenspace for 2 is one-dimensional. Diagonalizable?" answer `{type:'choice', value:'no'}`.
    Choices: `yes` (why: "Eigenspace dims 1 + 1 + 1 = 3 < 4."), `no` ✓.
14. `explain` **cp-diag** — "Why does $A = PDP^{-1}$ require the columns of P to be eigenvectors?" Points: $A = PDP^{-1} \iff AP = PD$ (P invertible); column j of AP is $A\mathbf p_j$;
    column j of PD is $d_{jj}\mathbf p_j$; so $A\mathbf p_j = d_{jj}\mathbf p_j$; P invertible ⇒ columns independent, nonzero ⇒ eigenvectors forming a basis.
15. `scene` **summary-diag** — *Summary.* Stage: the three-arrow diagram with the eigen-grid. Steps: (1) Diagonalizable ⇔ an eigenbasis. (2) Then powers are easy. (3) $P^{-1}AP$ is
    A seen from that basis.

---

## 21. `complex-dynamics` — Complex eigenvalues and differential equations (Lay 5.5, 5.7 · 18 min)

**Goals**
- Recognize rotation-like real matrices with complex eigenvalues; compute λ = a ± bi and complex eigenvectors.
- Factor $A = PCP^{-1}$ with $C = \begin{bmatrix}a&-b\\b&a\end{bmatrix}$ (rotation by φ, scaling by $r = |\lambda|$), $P = [\operatorname{Re}\mathbf v\ \operatorname{Im}\mathbf v]$ for $\lambda = a - bi$ (Theorem 9).
- Solve $\mathbf x' = A\mathbf x$ by eigenfunctions $\mathbf v e^{\lambda t}$; fit initial conditions; classify the origin (attractor, repeller, saddle, spiral).

**Misconceptions:** complex eigenvalues mean "no eigenvectors at all"; mixing the sign convention (using $a + bi$ with $[\operatorname{Re}\ \operatorname{Im}]$ gives $C^T$); stability judged by
imaginary part; $e^{At}$ treated entrywise.

**Beats**
1. `scene` **no-real-line** — *A matrix with no real eigenvectors.* Stage: `s.plane`, rotation by 90° `applyMatrix([[0,-1],[1,0]])`: every vector turns, none stays on its line.
   Steps: (1) A rotation moves every direction. (2) Its characteristic equation $\lambda^2 + 1 = 0$ has roots $\pm i$. (3) The eigenvalues are complex, and so are eigenvectors.
2. `scene` **rotation-scaling** — *Rotation–scaling matrices.* Stage: $C = \begin{bmatrix}a&-b\\b&a\end{bmatrix} = r\begin{bmatrix}\cos\varphi&-\sin\varphi\\\sin\varphi&\cos\varphi\end{bmatrix}$; repeated
   application to a point traces a spiral (dots stamped after each `applyMatrix`-like step, done via `p.point` + tween); r and φ labelled. Steps: (1) Eigenvalues $a \pm bi$.
   (2) $r = \sqrt{a^2 + b^2}$ scales, φ rotates. (3) $r > 1$ spirals out, $r < 1$ spirals in.
3. `scene` **worked-complex** — *Worked example.* Stage: $A = \begin{bmatrix}1&-2\\1&3\end{bmatrix}$; $\lambda^2 - 4\lambda + 5 = 0 \Rightarrow \lambda = 2 \pm i$; for $\lambda = 2 - i$:
   $A - \lambda I = \begin{bmatrix}-1+i&-2\\1&1+i\end{bmatrix}$; row 2 gives $\mathbf v = (-1-i, 1)$; $P = \begin{bmatrix}-1&-1\\1&0\end{bmatrix}$, $C = \begin{bmatrix}2&-1\\1&2\end{bmatrix}$.
   Steps: (1) Trace 4, det 5. (2) For a 2×2, one row of $A - \lambda I$ gives the eigenvector. (3) Real and imaginary parts make P; a and b make C. (4) Check $AP = PC$:
   both are $\begin{bmatrix}-3&-1\\2&-1\end{bmatrix}$.
4. `scene` **ellipse-orbit** — *What A does: an elliptical spiral.* Stage: `s.plane` with a point iterated under A (scaled down by $1/\sqrt5$ so it cycles) tracing an ellipse (the image under P of a
   circle); then unscaled, spiraling out with $r = \sqrt5$. Steps: (1) In the coordinates of P, A is a pure rotation–scaling. (2) In standard coordinates, the circle becomes an ellipse.
5. `try` **try-r-phi** — "$A = \begin{bmatrix}1&-1\\1&1\end{bmatrix}$. What does A do?" answer `{type:'choice', value:'b'}`. Choices: (a) "rotates by 90°, scales by 2" (why: "λ = 1 ± i, so
   $r = \sqrt2$ and φ = 45°."); (b) ✓ "rotates by 45°, scales by $\sqrt2$"; (c) "has real eigenvalues 0 and 2" (why: "Characteristic polynomial $\lambda^2 - 2\lambda + 2$ has no real roots.").
6. `workout` **wo-rot-scale** **(generate)** — "$A = \begin{bmatrix}1&-4\\1&1\end{bmatrix}$. Using the eigenvalue $\lambda = a - bi$ with $b > 0$, find C in $A = PCP^{-1}$." answer
   `{type:'matrix', value:[[1,-2],[2,1]]}`. Hints: (1) $\lambda^2 - 2\lambda + 5 = 0$. (2) $\lambda = 1 - 2i$: a = 1, b = 2. Solution: $C = \begin{bmatrix}1&-2\\2&1\end{bmatrix}$; eigenvector from
   row 2 of $A - \lambda I$: $\mathbf v = (-2i, 1)$, $P = \begin{bmatrix}0&-2\\1&0\end{bmatrix}$; check $AP = PC = \begin{bmatrix}-4&-2\\1&-2\end{bmatrix}$; $r = \sqrt5$.
   `generate`: random a, b small integers, random integer P with det ±1, A = PCP⁻¹.
7. `scene` **de-setup** — *Differential equations: x′ = Ax.* Stage: tex $\mathbf x'(t) = A\mathbf x(t)$ for two interacting quantities; guess $\mathbf x = \mathbf v e^{\lambda t}$: substitute,
   $\lambda\mathbf v e^{\lambda t} = A\mathbf v e^{\lambda t}$ ⇒ $A\mathbf v = \lambda\mathbf v$. Steps: (1) Rates of change depend linearly on the current state. (2) Try a vector times an exponential. (3) It works
   exactly when v is an eigenvector: eigenfunctions.
8. `scene` **attractor** — *Example: an attractor.* Stage: $A = \begin{bmatrix}-2&1\\1&-2\end{bmatrix}$: λ = −1 with (1,1), λ = −3 with (1,−1) (purple spans); general solution
   $\mathbf x(t) = c_1e^{-t}(1,1) + c_2e^{-3t}(1,-1)$; `s.plane` with ~8 trajectories drawn by `s.path` from sampled points (`p.toStage`) and `draw()`, all flowing into 0; the one from
   (3,1): $c = (2,1)$, highlighted green. Steps: (1) Two eigenfunctions; combine them. (2) $\mathbf x(0) = (3,1) = 2(1,1) + 1(1,-1)$. (3) Both eigenvalues negative: everything decays
   into the origin, fastest along (1,−1).
9. `scene` **saddle-spiral** — *Saddles and spirals.* Stage: two phase portraits: $\begin{bmatrix}1&2\\2&1\end{bmatrix}$ (λ = 3, −1: saddle, trajectories in along (1,−1), out along (1,1));
   $\begin{bmatrix}-1&-2\\2&-1\end{bmatrix}$ (λ = −1 ± 2i: spiral sink). Steps: (1) Opposite signs: a saddle. (2) Complex eigenvalues: trajectories spiral; the *real part* decides in or out.
   (3) Lay: attractor (sink), repeller (source), saddle, spiral point.
10. `try` **try-classify** — "Classify the origin for $\mathbf x' = A\mathbf x$ with $A = \begin{bmatrix}-1&-2\\2&-1\end{bmatrix}$." answer `{type:'choice', value:'c'}`. Choices: (a) "saddle" (why:
    "Needs real eigenvalues of opposite sign."); (b) "spiral source" (why: "The real part −1 is negative."); (c) ✓ "spiral sink (attractor)"; (d) "repeller".
11. `scene` **mistake-imag** — *The trap: the imaginary part doesn't decide stability.* Stage: two spirals with the same b, different a (−1 vs +1), yellow on "b > 0 means outward" ✗.
    Steps: (1) $e^{(a+bi)t} = e^{at}(\cos bt + i\sin bt)$. (2) The rotation comes from b; growth or decay from a.
12. `workout` **wo-ivp** **(generate)** — "Solve $\mathbf x' = \begin{bmatrix}1&2\\2&1\end{bmatrix}\mathbf x$, $\mathbf x(0) = (0,2)$. Writing $\mathbf x(t) = c_1e^{3t}(1,1) + c_2e^{-t}(1,-1)$, enter $(c_1, c_2)$." answer
    `{type:'vector', value:['1','-1']}`. Hints: (1) Check (1,1) and (1,−1) are eigenvectors. (2) At t = 0: $c_1(1,1) + c_2(1,-1) = (0,2)$. Solution: $c_1 + c_2 = 0$, $c_1 - c_2 = 2$; $c = (1,-1)$;
    $\mathbf x(t) = (e^{3t} - e^{-t},\ e^{3t} + e^{-t})$; saddle. `generate`: random symmetric/diagonalizable A with integer eigenvalues and integer eigenvectors, random integer c.
13. `explain` **cp-spiral** — "Why do complex eigenvalues produce rotation, and what decides whether trajectories spiral in or out?" Points: $A = PCP^{-1}$ with C a rotation–scaling; in P-coordinates the
    map (or flow) rotates by an angle tied to b; the modulus r (discrete) or real part a (continuous, $e^{at}$) controls growth; P only distorts the circle into an ellipse.
14. `scene` **summary-complex** — *Summary.* Stage: four phase portrait thumbnails labelled. Steps: (1) Complex eigenvalues: rotation and scaling. (2) $\mathbf x' = A\mathbf x$: combine $\mathbf v e^{\lambda t}$.
    (3) Eigenvalue signs (or real parts) decide the picture.

---

## 22. `review-2` — Midterm 2 review (Lay ch. 4–5 · 15 min)

**Goals**
- Move fluently between vector spaces, bases, coordinates, and matrices.
- Compute bases and dimensions for Nul, Col, Row; translate between bases.
- Find eigenvalues and eigenvectors, diagonalize, and use it (powers, Markov chains, differential equations).

**Misconceptions targeted:** Col A from the echelon form; direction of change-of-basis matrices; row reducing before finding eigenvalues; mismatched P and D.

**Beats**
1. `scene` **map-ch4-5** — *The map of chapters 4 and 5.* Stage: concept map: vector space → basis → coordinates → change of basis → eigenbasis → diagonalization → applications
   (powers, Markov, x′ = Ax). Steps: (1) Chapter 4 is about choosing descriptions: bases and coordinates. (2) Chapter 5 picks the best description for a given matrix: its eigenvectors.
2. `blanks` **fill-dims** — "A is $5\times 7$ and $\dim\operatorname{Nul}A = 3$." `\operatorname{rank}A = ` [4]; `\dim\operatorname{Row}A = ` [4]; `\dim\operatorname{Nul}A^T = ` [1]; also
   `\dim\{p\in\mathbb P_2 : p(1) = 0\} = ` [2]. Solution: $7 - 3$; equals rank; $5 - 4$; one linear condition on a 3-dimensional space.
3. `try` **try-subspace-r2** — "Which set is a subspace of $\mathbb P_2$?" answer `{type:'choice', value:'a'}`. Choices: (a) ✓ $\{p : p(1) = 0\}$; (b) $\{p : p(0) = 1\}$ (why: "No zero polynomial.");
   (c) $\{p : \text{degree exactly } 2\}$ (why: "$t^2 + (-t^2) = 0$ has no degree 2."); (d) $\{p : p(t) \ge 0 \text{ for all } t\}$ (why: "Not closed under scaling by −1.").
4. `workout` **wo-nul-col-review** — "For $A = \begin{bmatrix}1&2&-1&0\\2&4&1&3\\-1&-2&2&1\end{bmatrix}$, find a basis for Nul A." answer
   `{type:'basis', value:[['-2','1','0','0'], ['-1','0','-1','1']]}`. Hints: (1) $R_2 - 2R_1$ and $R_3 + R_1$ give rows $(0,0,3,3)$ and $(0,0,1,1)$. (2) RREF
   $\begin{bmatrix}1&2&0&1\\0&0&1&1\\0&0&0&0\end{bmatrix}$; free $x_2, x_4$. Solution: $x_1 = -2x_2 - x_4$, $x_3 = -x_4$; basis $(-2,1,0,0), (-1,0,-1,1)$; Col A basis
   (columns 1, 3 of A) $(1,2,-1), (-1,1,2)$; rank 2, $2 + 2 = 4$.
5. `try` **try-change-review** — "$\underset{\mathcal C\leftarrow\mathcal B}{P} = \begin{bmatrix}1&2\\0&1\end{bmatrix}$ and $[\mathbf x]_{\mathcal B} = (1,1)$. Find $[\mathbf x]_{\mathcal C}$." answer
   `{type:'vector', value:['3','1']}`. Hint: P goes from $\mathcal B$ to $\mathcal C$. Solution: $P(1,1) = (3,1)$.
6. `scene` **recap-eigen** — *Recap: the eigen workflow.* Stage: flow: $\det(A - \lambda I) = 0$ → each λ: $\operatorname{Nul}(A - \lambda I)$ → enough vectors? → P, D → $A^k = PD^kP^{-1}$. Steps: (1) Eigenvalues first,
   from A itself. (2) Then eigenspaces. (3) Count dimensions before building P.
7. `workout` **wo-power-review** — "$A = \begin{bmatrix}6&-1\\2&3\end{bmatrix}$. Compute $A^5\mathbf v$ for $\mathbf v = (2,3)$ using eigenvectors." answer `{type:'vector', value:['4149','5173']}`.
   Hints: (1) Eigenvalues 4 and 5 (trace 9, det 20). (2) Eigenvectors (1,2) for 4 and (1,1) for 5; write $\mathbf v = (1,2) + (1,1)$. Solution:
   $A^5\mathbf v = 4^5(1,2) + 5^5(1,1) = (1024 + 3125,\ 2048 + 3125) = (4149, 5173)$.
8. `try` **try-markov-review** — "Which vector is the steady state of $P = \begin{bmatrix}0.7&0.4\\0.3&0.6\end{bmatrix}$, and which eigenvalue does it belong to?" answer `{type:'choice', value:'b'}`.
   Choices: (a) "(3/7, 4/7), λ = 1" (why: "Swapped: $0.3x_1 = 0.4x_2$ makes $x_1$ the larger."); (b) ✓ "(4/7, 3/7), λ = 1"; (c) "(4/7, 3/7), λ = 0" (why: "$P\mathbf q = \mathbf q$ means
   eigenvalue 1."); (d) "(1/2, 1/2), λ = 1" (why: "$P(1/2,1/2) = (0.55, 0.45)$.").
9. `try` **try-complex-review** — "$A = \begin{bmatrix}0&-2\\2&0\end{bmatrix}$. The iterates $A^k\mathbf x_0$ …" answer `{type:'choice', value:'a'}`. Choices: (a) ✓ "spiral outward (r = 2)";
   (b) "spiral inward" (why: "|λ| = |±2i| = 2 > 1."); (c) "converge to an eigenvector" (why: "There are no real eigenvectors."); (d) "stay on a circle" (why: "That needs r = 1.").
10. `try` **try-diag-review** — "A is $3\times 3$ with characteristic polynomial $-(\lambda-1)^2(\lambda+2)$ and $\operatorname{rank}(A - I) = 1$. Is A diagonalizable?" answer `{type:'choice', value:'yes'}`.
    Choices: `yes` ✓ ($\dim\operatorname{Nul}(A - I) = 3 - 1 = 2$ plus 1 for λ = −2), `no` (why: "A repeated eigenvalue is fine if its eigenspace is big enough.").
11. `explain` **cp-review-2** — "Explain how diagonalization, change of basis, and coordinates are the same idea." Points: P's columns form a basis $\mathcal B$; $P = \underset{\mathcal E\leftarrow\mathcal B}{P}$ converts
    $\mathcal B$-coordinates to standard; $[T]_{\mathcal B} = P^{-1}AP$ is the matrix of $\mathbf x \mapsto A\mathbf x$ in $\mathcal B$-coordinates; choosing an eigenbasis makes that matrix diagonal D.
12. `scene` **exam-tips-2** — *Before the exam.* Stage: checklist: name the space each object lives in; check eigenvectors by multiplying; check P with $AP = PD$; normalize steady states.
    Steps: (1) Most errors in these chapters are "wrong space" errors. (2) Every eigen answer can be checked with one multiplication.

---

# Unit 6 · Orthogonality & least squares

## 23. `orthogonality` — Inner products and orthogonal sets (Lay 6.1–6.2 · 16 min)

**Goals**
- Compute dot products, lengths, unit vectors, distances, and angles in ℝⁿ.
- Test orthogonality; know the Pythagorean Theorem and orthogonal complements, with $(\operatorname{Row}A)^\perp = \operatorname{Nul}A$ (Theorem 3).
- Use an orthogonal basis to get weights without row reduction: $c_j = \frac{\mathbf y\cdot\mathbf u_j}{\mathbf u_j\cdot\mathbf u_j}$ (Theorem 5).
- Project onto a line; recognize orthonormal columns ($U^TU = I$) and that they preserve lengths and angles.

**Misconceptions:** forgetting to divide by $\mathbf u\cdot\mathbf u$ (only orthonormal bases skip it); orthogonal set ⇒ basis even with a zero vector;
"orthogonal matrix" means orthogonal columns (it means orthonormal, and square); $\|\mathbf u + \mathbf v\| = \|\mathbf u\| + \|\mathbf v\|$.

**Beats**
1. `scene` **dot-product** — *The dot product measures alignment.* Stage: `s.plane`; blue u = (3,1) fixed, red v rotating around (driven by tween), live readout of
   $\mathbf u\cdot\mathbf v$ turning positive → 0 (at perpendicular, a right-angle mark appears) → negative. Steps: (1) $\mathbf u\cdot\mathbf v = u_1v_1 + \cdots + u_nv_n = \mathbf u^T\mathbf v$.
   (2) Positive when they point the same way, zero exactly when perpendicular, negative when opposed. (3) $\mathbf u\cdot\mathbf v = \|\mathbf u\|\|\mathbf v\|\cos\theta$.
2. `scene` **length-distance** — *Length, unit vectors, distance.* Stage: $\|\mathbf v\| = \sqrt{\mathbf v\cdot\mathbf v}$; v = (1,2,2) → length 3 → unit vector (1/3, 2/3, 2/3) (shrinks in
   `s.space`); distance between (7,1) and (3,2) as length of their difference, $\sqrt{17}$ (in `s.plane`). Steps: (1) Length is the square root of v dot itself. (2) Divide
   by the length to get a unit vector. (3) Distance is the length of the difference.
3. `blanks` **fill-dot** — `(1,2,-1)\cdot(3,-1,2) = ` [−1]; `\|(3,4)\| = ` [5]; `\text{unit vector in direction } (0,3,4) = (0,\ ` [typed 3/5] `,\ ` [typed 4/5] `)`.
4. `scene` **pythagoras** — *Orthogonal means Pythagoras works.* Stage: u = (2,1), v = (−1,2) with right angle; triangle with $\|\mathbf u + \mathbf v\|^2 = 5 + 5 = 10$. Steps: (1) Lay defines
   orthogonal by $\mathbf u\cdot\mathbf v = 0$. (2) Then $\|\mathbf u + \mathbf v\|^2 = \|\mathbf u\|^2 + \|\mathbf v\|^2$, and conversely (Theorem 2).
5. `scene` **complement** — *Orthogonal complements.* Stage: `s.space`; W = plane span{(1,1,0), (1,−1,1)} (blue/red, patch); $W^\perp$ = line through (−1,1,2) (green), perpendicular;
   tex $W^\perp = \operatorname{Nul}\begin{bmatrix}1&1&0\\1&-1&1\end{bmatrix}$; `orbit(90)`. Steps: (1) $W^\perp$ is every vector orthogonal to all of W. (2) It's enough to be
   orthogonal to a spanning set, so $W^\perp$ is the null space of the matrix with those vectors as rows. (3) Theorem 3: $(\operatorname{Row}A)^\perp = \operatorname{Nul}A$ and
   $(\operatorname{Col}A)^\perp = \operatorname{Nul}A^T$.
6. `try` **try-complement** — "W is a plane through 0 in ℝ³ with $W^\perp = \operatorname{Span}\{(1,2,-1)\}$. Which vector is in W?" answer `{type:'choice', value:'c'}`. Choices: (a) (1,2,−1)
   (why: "That's in $W^\perp$; only 0 is in both."); (b) (1,1,1) (why: "$(1,1,1)\cdot(1,2,-1) = 2 \ne 0$."); (c) ✓ (1,0,1); (d) (2,−1,1) (why: "Dot product is $2 - 2 - 1 = -1$.").
7. `scene` **orthogonal-basis** — *Orthogonal bases make weights easy.* Stage: `s.space` with $\mathbf u_1 = (1,1,0)$, $\mathbf u_2 = (1,-1,1)$, $\mathbf u_3 = (-1,1,2)$ (pairwise right-angle marks);
   y = (3,1,4); weights computed live: $c_1 = 4/2 = 2$, $c_2 = 6/3 = 2$, $c_3 = 6/6 = 1$; $\mathbf y = 2\mathbf u_1 + 2\mathbf u_2 + \mathbf u_3$ built tip-to-tail (green). Steps: (1) An orthogonal set of
   nonzero vectors is automatically independent (Theorem 4). (2) Dot y with $\mathbf u_j$: every other term vanishes. (3) So $c_j = \mathbf y\cdot\mathbf u_j / \mathbf u_j\cdot\mathbf u_j$. No row reduction.
8. `scene` **project-line** — *Projecting onto a line.* Stage: `s.plane`; u = (3,1) blue span; y = (2,4) red; drop perpendicular: $\hat{\mathbf y} = \frac{10}{10}(3,1) = (3,1)$ (green),
   $\mathbf z = \mathbf y - \hat{\mathbf y} = (-1,3)$ (yellow dashed) with right-angle mark. Steps: (1) Split y into a piece along u and a piece orthogonal to u. (2) The along-piece is
   $\frac{\mathbf y\cdot\mathbf u}{\mathbf u\cdot\mathbf u}\mathbf u$. (3) The distance from y to the line is $\|\mathbf z\| = \sqrt{10}$.
9. `scene` **mistake-divide** — *The trap: dividing by the wrong thing.* Stage: same; wrong $\hat{\mathbf y} = (\mathbf y\cdot\mathbf u)\mathbf u = (30,10)$ shooting off-screen (yellow). Steps: (1) Without
   dividing by $\mathbf u\cdot\mathbf u$, the answer depends on how long u is. (2) Only for a unit vector can you skip the division.
10. `try` **try-orth-set** — "Which set is orthogonal?" answer `{type:'choice', value:'a'}`. Choices: (a) ✓ $\{(1,2),(2,-1)\}$; (b) $\{(1,1,1),(1,-1,0),(1,1,-1)\}$ (why: "$(1,1,1)\cdot(1,1,-1) = 1$."); (c)
    $\{(1,0),(1,1)\}$ (why: "Dot product 1.").
11. `scene` **orthonormal** — *Orthonormal columns.* Stage: U with columns $(1/\sqrt2, 1/\sqrt2, 0)$, $(1/\sqrt3)(1,-1,1)$; $U^TU = I$ computed (entries pop in); `s.plane` demo of a rotation
    (orthogonal matrix) keeping a vector's length and the angle between two vectors. Steps: (1) Orthonormal: orthogonal unit vectors. (2) Columns orthonormal ⇔ $U^TU = I$ (Theorem 6).
    (3) Then $\|U\mathbf x\| = \|\mathbf x\|$ and dot products are preserved (Theorem 7). (4) A *square* such U is an orthogonal matrix: $U^{-1} = U^T$.
12. `workout` **wo-weights** **(generate)** — "$\{\mathbf u_1, \mathbf u_2, \mathbf u_3\} = \{(3,1,1), (-1,2,1), (-1,-4,7)\}$ is an orthogonal basis of ℝ³. Write $\mathbf y = (6,1,-8)$ as a combination; enter
    the weights." answer `{type:'vector', value:['1','-2','-1']}`. Hints: (1) Check orthogonality quickly, then use $c_j = \mathbf y\cdot\mathbf u_j / \mathbf u_j\cdot\mathbf u_j$. (2) $\mathbf u_j\cdot\mathbf u_j$ = 11, 6, 66.
    Solution: $c_1 = 11/11 = 1$, $c_2 = -12/6 = -2$, $c_3 = -66/66 = -1$; check $\mathbf u_1 - 2\mathbf u_2 - \mathbf u_3 = (6,1,-8)$. `generate`: random orthogonal integer basis (from a list of
    known triples, scaled/sign-flipped/permuted), random integer weights, y computed.
13. `explain` **cp-orth-weights** — "Why can you find the weights in an orthogonal basis with one dot product each, without row reducing?" Points: write $\mathbf y = \sum c_i\mathbf u_i$; dot both
    sides with $\mathbf u_j$; orthogonality kills every term with $i \ne j$; leaves $\mathbf y\cdot\mathbf u_j = c_j\,\mathbf u_j\cdot\mathbf u_j$; divide (nonzero since $\mathbf u_j \neq \mathbf 0$).
14. `scene` **summary-orth** — *Summary.* Stage: projection picture and orthogonal triad. Steps: (1) Dot products measure angles; zero means orthogonal. (2) Complements are null spaces.
    (3) Orthogonal bases give weights by dot products.

---

## 24. `projections` — Orthogonal projections and Gram–Schmidt (Lay 6.3–6.4 · 18 min)

**Goals**
- Decompose $\mathbf y = \hat{\mathbf y} + \mathbf z$ with $\hat{\mathbf y} \in W$, $\mathbf z \in W^\perp$ (Orthogonal Decomposition Theorem) using an orthogonal basis of W.
- Know $\hat{\mathbf y}$ is the closest point of W to y (Best Approximation Theorem); compute distances to subspaces.
- With orthonormal columns: $\operatorname{proj}_W\mathbf y = UU^T\mathbf y$.
- Run Gram–Schmidt to produce an orthogonal basis; form $A = QR$.

**Misconceptions:** using the projection formula with a non-orthogonal basis; $UU^T = I$ (only $U^TU = I$ unless square); Gram–Schmidt subtracting projections onto
the original x's instead of the new v's; R's diagonal can be negative (with Lay's construction it's positive).

**Beats**
1. `scene` **shadow** — *The shadow on a plane.* Stage: `s.space`; W = span{(1,1,0), (1,−1,1)} patch; y = (3,1,4) blue; a perpendicular drops (yellow dashed) to green ŷ = (4,0,2); z = (−1,1,2)
   along the normal; `orbit`. Steps: (1) Every y splits into a part in W and a part perpendicular to W. (2) The part in W is the shadow, $\hat{\mathbf y} = \operatorname{proj}_W\mathbf y$. (3) Here
   $\hat{\mathbf y} = (4,0,2)$ and $\mathbf z = (-1,1,2)$.
2. `scene` **decomp-formula** — *The formula (Theorem 8).* Stage: tex $\hat{\mathbf y} = \frac{\mathbf y\cdot\mathbf u_1}{\mathbf u_1\cdot\mathbf u_1}\mathbf u_1 + \frac{\mathbf y\cdot\mathbf u_2}{\mathbf u_2\cdot\mathbf u_2}\mathbf u_2$ with the
   numbers $\frac{4}{2}(1,1,0) + \frac{6}{3}(1,-1,1) = (4,0,2)$; in the 3D scene, the two line-projections (onto u1, u2) add up to ŷ. Steps: (1) Project onto each orthogonal basis vector and
   add. (2) This needs an *orthogonal* basis of W. (3) Check: z is orthogonal to both $\mathbf u_1$ and $\mathbf u_2$.
3. `scene` **mistake-nonorth** — *The trap: a basis that isn't orthogonal.* Stage: W spanned by (1,1,0) and (2,0,1) (same plane, not orthogonal); summing the two line projections gives
   $(2,2,0) + \frac{10}{5}(2,0,1) = (6,2,2)$ (yellow), visibly *not* the shadow (4,0,2). Steps: (1) Same plane, different spanning vectors. (2) Adding line projections overcounts when the
   vectors aren't orthogonal. (3) First make the basis orthogonal; that's Gram–Schmidt, coming up.
4. `try` **try-in-w** — "If y already lies in W, what is $\operatorname{proj}_W\mathbf y$?" answer `{type:'choice', value:'a'}`. Choices: (a) ✓ y itself; (b) 0 (why: "That happens for y in
   $W^\perp$."); (c) "depends on the basis" (why: "The projection is defined by W alone; only the formula uses a basis.").
5. `scene` **best-approx** — *The closest point (Theorem 9).* Stage: same 3D scene; a moving point v wanders in W, with the distance $\|\mathbf y - \mathbf v\|$ readout always ≥ $\sqrt 6$, equality at ŷ;
   right triangle y, ŷ, v. Steps: (1) For any other v in W, $\mathbf y - \mathbf v = (\mathbf y - \hat{\mathbf y}) + (\hat{\mathbf y} - \mathbf v)$, two orthogonal pieces. (2) Pythagoras: it's
   longer. (3) The distance from y to W is $\|\mathbf z\| = \sqrt6$.
6. `workout` **wo-project** **(generate)** — "Let $W = \operatorname{Span}\{(1,1,0), (1,-1,1)\}$ and $\mathbf y = (2,0,7)$. Find $\operatorname{proj}_W\mathbf y$." answer `{type:'vector', value:['4','-2','3']}`. Hints:
   (1) The basis is orthogonal: check. (2) $\mathbf y\cdot\mathbf u_1 = 2$, $\mathbf y\cdot\mathbf u_2 = 9$. Solution: $\frac22(1,1,0) + \frac93(1,-1,1) = (4,-2,3)$; $\mathbf z = (-2,2,4)$, orthogonal to both;
   distance $\|\mathbf z\| = 2\sqrt6$. `generate`: fixed or random orthogonal pair, random y with integer projection.
7. `scene` **orthonormal-proj** — *With orthonormal columns: UUᵀy.* Stage: tex $\operatorname{proj}_W\mathbf y = UU^T\mathbf y$ (Theorem 10) with U = normalized $\mathbf u_1, \mathbf u_2$; contrast $U^TU = I_2$
   vs $UU^T$ ($3\times 3$ projection matrix). Steps: (1) Normalize the basis and the formula becomes a matrix product. (2) $U^TU$ is the 2×2 identity, but $UU^T$ is the 3×3 projection onto W.
8. `scene` **gram-schmidt** — *Gram–Schmidt.* Stage: `s.space`; $\mathbf x_1 = (1,1,0)$ (blue) kept as $\mathbf v_1$; $\mathbf x_2 = (2,0,1)$ (red); its projection onto $\mathbf v_1$, $(1,1,0)$, shown and
   subtracted (animated `shift`), leaving $\mathbf v_2 = (1,-1,1)$ (green) with a right-angle mark; plane span unchanged. Steps: (1) Keep the first vector. (2) From the second, subtract its
   projection onto the first: what's left is orthogonal. (3) Same span, now an orthogonal basis. (4) For more vectors, subtract projections onto *all* previous v's.
9. `blanks` **fill-gs** — `\mathbf v_3 = \mathbf x_3 - \frac{\mathbf x_3\cdot` [chips `\mathbf v_1` ✓, `\mathbf x_1`] `}{\mathbf v_1\cdot\mathbf v_1}\mathbf v_1 - \frac{\mathbf x_3\cdot` [chips `\mathbf v_2` ✓,
   `\mathbf x_2`] `}{\mathbf v_2\cdot\mathbf v_2}\mathbf v_2`. Solution: always project onto the *new* orthogonal vectors.
10. `scene` **qr** — *QR factorization (Theorem 12).* Stage: $A = [\mathbf x_1\ \mathbf x_2] = \begin{bmatrix}1&2\\1&0\\0&1\end{bmatrix}$; Q = normalized v's
    $\begin{bmatrix}1/\sqrt2&1/\sqrt3\\1/\sqrt2&-1/\sqrt3\\0&1/\sqrt3\end{bmatrix}$; $R = Q^TA = \begin{bmatrix}\sqrt2&\sqrt2\\0&\sqrt3\end{bmatrix}$. Steps: (1) Gram–Schmidt, then normalize: Q has
    orthonormal columns. (2) $R = Q^TA$ is upper triangular with positive diagonal. (3) Software uses QR for least squares, next lecture.
11. `workout` **wo-gram-schmidt** — "Apply Gram–Schmidt to $\mathbf x_1 = (1,1,1,1)$, $\mathbf x_2 = (3,1,1,-1)$, $\mathbf x_3 = (0,1,2,1)$. Enter $\mathbf v_3$ exactly as the process produces it (no
    rescaling)." answer `{type:'vector', value:['-1/2','0','1','-1/2']}`. Hints: (1) $\mathbf v_2 = \mathbf x_2 - \frac44\mathbf x_1 = (2,0,0,-2)$. (2) $\mathbf x_3\cdot\mathbf v_1 = 4$, $\mathbf x_3\cdot\mathbf v_2 = -2$,
    $\mathbf v_2\cdot\mathbf v_2 = 8$. Solution: $\mathbf v_3 = (0,1,2,1) - (1,1,1,1) + \tfrac14(2,0,0,-2) = (-\tfrac12, 0, 1, -\tfrac12)$; check $\mathbf v_3\cdot\mathbf v_1 = 0$, $\mathbf v_3\cdot\mathbf v_2 = 0$.
    (Rescaled: $(-1,0,2,-1)$.)
12. `explain` **cp-gs** — "Why does subtracting projections in Gram–Schmidt keep the span the same while making the vectors orthogonal?" Points: $\mathbf v_k = \mathbf x_k - (\text{combination of }\mathbf v_1..\mathbf v_{k-1})$
    and each $\mathbf v_i$ is in $\operatorname{Span}\{\mathbf x_1..\mathbf x_i\}$, so spans match step by step; $\mathbf x_k$ is recoverable from $\mathbf v_k$ plus that combination; what's subtracted is
    exactly the projection onto the earlier span, leaving the component in its orthogonal complement; $\mathbf v_k \ne 0$ because the x's are independent.
13. `scene` **summary-proj** — *Summary.* Stage: the shadow picture and the GS picture. Steps: (1) Projection = sum of line projections onto an orthogonal basis. (2) It's the closest point.
    (3) Gram–Schmidt builds the orthogonal basis you need.

---

## 25. `least-squares` — Least-squares problems (Lay 6.5 · 15 min)

**Goals**
- Understand a least-squares solution $\hat{\mathbf x}$ as the x making $A\mathbf x$ closest to b: $A\hat{\mathbf x} = \operatorname{proj}_{\operatorname{Col}A}\mathbf b$.
- Derive and solve the normal equations $A^TA\hat{\mathbf x} = A^T\mathbf b$ (Theorem 13); compute the least-squares error.
- Know when $\hat{\mathbf x}$ is unique (columns of A independent ⇔ $A^TA$ invertible, Theorem 14); fit a least-squares line.

**Misconceptions:** least squares minimizes the sum of residuals (it's the sum of their squares); "drop an equation to make it consistent"; $\hat{\mathbf x}$ solves $A\mathbf x = \mathbf b$; using $AA^T$.

**Beats**
1. `scene` **no-solution** — *When Ax = b has no solution.* Stage: `s.plane` scatter (0,6), (1,0), (2,0) blue dots; trying lines through two of them misses the third; tex system
   $\beta_0 + \beta_1x = y$ for each point: $A = \begin{bmatrix}1&0\\1&1\\1&2\end{bmatrix}$, $\mathbf b = (6,0,0)$ inconsistent. Steps: (1) Three points, no line through all of them. (2) As
   a system, $A\mathbf x = \mathbf b$ is inconsistent. (3) So ask for the best we can do: make $A\mathbf x$ as close to b as possible.
2. `scene` **geometry** — *The geometry: project b onto Col A.* Stage: `s.space`: Col A as a plane (spanned by (1,1,1), (0,1,2)), b = (6,0,0) above it; drop to $\hat{\mathbf b} = A\hat{\mathbf x} = (5,2,-1)$ (green);
   residual $(1,-2,1)$ (yellow) perpendicular. Steps: (1) $A\mathbf x$ ranges over Col A, a plane. (2) The closest point is the projection of b. (3) The residual $\mathbf b - A\hat{\mathbf x}$ is
   orthogonal to Col A.
3. `scene` **normal-eq** — *The normal equations.* Stage: tex chain: residual ⊥ every column ⇒ $A^T(\mathbf b - A\hat{\mathbf x}) = \mathbf 0$ ⇒ $A^TA\hat{\mathbf x} = A^T\mathbf b$; with numbers
   $A^TA = \begin{bmatrix}3&3\\3&5\end{bmatrix}$, $A^T\mathbf b = (6,0)$ → $\hat{\mathbf x} = (5,-3)$ (green). Steps: (1) Orthogonal to Col A means orthogonal to each column. (2) Stack those
   conditions: $A^T$ times the residual is zero. (3) Rearrange: the normal equations, a square system. (4) Here $\hat{\mathbf x} = (5,-3)$: the line $y = 5 - 3x$.
4. `scene` **fit-line** — *The best-fit line.* Stage: back to the scatter; line $y = 5 - 3x$ drawn (green); vertical residual segments 1, −2, 1 (yellow) with little squares on them whose areas
   sum to 6. Steps: (1) The residuals are the vertical misses. (2) Least squares makes the sum of their squares as small as possible: here 6. (3) The least-squares error is
   $\|\mathbf b - A\hat{\mathbf x}\| = \sqrt6$.
5. `try` **try-normal** — "For $A = \begin{bmatrix}1&1\\1&-1\\1&1\end{bmatrix}$, what is $A^TA$?" answer `{type:'choice', value:'b'}`. Choices: (a) $\begin{bmatrix}2&0&2\\0&2&0\\2&0&2\end{bmatrix}$ (why: "That's $AA^T$,
   3×3."); (b) ✓ $\begin{bmatrix}3&1\\1&3\end{bmatrix}$; (c) $\begin{bmatrix}3&0\\0&3\end{bmatrix}$ (why: "Column 1 · column 2 = 1 − 1 + 1 = 1.").
6. `scene` **uniqueness** — *When is the answer unique? (Theorem 14).* Stage: tex: unique ⇔ columns of A independent ⇔ $A^TA$ invertible; then $\hat{\mathbf x} = (A^TA)^{-1}A^T\mathbf b$; a dependent-columns
   example with a whole line of least-squares solutions (all giving the same $A\hat{\mathbf x}$). Steps: (1) The projection $\hat{\mathbf b}$ is always unique. (2) The x producing it is unique only when
   the columns are independent.
7. `scene` **mistake-drop** — *The trap: dropping an equation.* Stage: line through (0,6) and (1,0) only (yellow, $y = 6 - 6x$) predicts −6 at x = 2, missing (2,0) by 6; sum of squared residuals compared: 36 vs 6.
   Steps: (1) Solving with two of the three equations ignores the third completely. (2) Least squares balances all of them.
8. `blanks` **fill-ls-line** — "Least-squares line for (0,1), (1,1), (2,2), (3,2)": `X^TX = \begin{bmatrix}4&6\\6&` [14] `\end{bmatrix},\ X^T\mathbf y = \begin{bmatrix}6\\` [11] `\end{bmatrix},\ \beta_0 = `
   [typed 9/10] `,\ \beta_1 = ` [typed 2/5]. Solution: $\sum x^2 = 14$, $\sum xy = 0 + 1 + 4 + 6 = 11$; solve $4\beta_0 + 6\beta_1 = 6$, $6\beta_0 + 14\beta_1 = 11$.
9. `workout` **wo-ls** **(generate)** — "Find the least-squares line $y = \beta_0 + \beta_1x$ for the points (0,2), (1,0), (2,4). Enter $(\beta_0, \beta_1)$." answer `{type:'vector', value:['1','1']}`.
   Hints: (1) $X = \begin{bmatrix}1&0\\1&1\\1&2\end{bmatrix}$, $\mathbf y = (2,0,4)$. (2) $X^TX = \begin{bmatrix}3&3\\3&5\end{bmatrix}$, $X^T\mathbf y = (6,8)$. Solution: $3\beta_0 + 3\beta_1 = 6$,
   $3\beta_0 + 5\beta_1 = 8$ ⇒ $\beta_1 = 1$, $\beta_0 = 1$; residual $(1,-2,1)$, error $\sqrt6$. `generate`: x = 0,1,2; choose integer β and add a residual multiple of (1,−2,1) (orthogonal to
   the columns) so the answer is exactly β.
10. `try` **try-ls-sol** — "$\hat{\mathbf x}$ is a least-squares solution of $A\mathbf x = \mathbf b$. Which must be true?" answer `{type:'choice', value:'c'}`. Choices: (a) "$A\hat{\mathbf x} = \mathbf b$" (why: "Only if
    the system happens to be consistent."); (b) "$\mathbf b - A\hat{\mathbf x} = \mathbf 0$" (same why); (c) ✓ "$\mathbf b - A\hat{\mathbf x}$ is orthogonal to every column of A"; (d) "$\hat{\mathbf x}$ is orthogonal
    to b" (why: "The residual, not $\hat{\mathbf x}$, is orthogonal, and to Col A.").
11. `explain` **cp-normal** — "Explain where the normal equations come from." Points: want $A\hat{\mathbf x}$ = closest point of Col A to b = projection; then $\mathbf b - A\hat{\mathbf x} \in (\operatorname{Col}A)^\perp = \operatorname{Nul}A^T$;
    so $A^T(\mathbf b - A\hat{\mathbf x}) = 0$; rearranged: $A^TA\hat{\mathbf x} = A^T\mathbf b$.
12. `scene` **summary-ls** — *Summary.* Stage: 3D projection picture beside the fitted line. Steps: (1) Can't solve? Project b onto Col A. (2) Solve $A^TA\hat{\mathbf x} = A^T\mathbf b$. (3) The error is
    the length of the residual.

---

## 26. `inner-product-spaces` — Inner product spaces (Lay 6.7 · 12 min)

**Goals**
- State the four inner product axioms and check them for examples on ℝⁿ, $\mathbb P_n$ (evaluation at points), and $C[a,b]$ (integrals).
- Compute lengths, distances, orthogonality, and Gram–Schmidt in these spaces.
- Find a best approximation of a function by polynomials; know Cauchy–Schwarz and the triangle inequality.

**Misconceptions:** "orthogonal" depends only on the functions (it depends on the inner product); any bilinear formula is an inner product (positivity matters);
orthogonal functions look perpendicular.

**Beats**
1. `scene` **axioms-ip** — *What an inner product needs.* Stage: tex four axioms (symmetry, additivity, homogeneity, positivity $\langle\mathbf u,\mathbf u\rangle \ge 0$ with equality only at 0); example
   $\langle\mathbf u,\mathbf v\rangle = 4u_1v_1 + 5u_2v_2$ on ℝ²: the "unit circle" becomes an ellipse (`s.plane`). Steps: (1) The dot product is one inner product; any rule with these four
   properties is another. (2) A weighted dot product changes what "length 1" looks like.
2. `try` **try-is-ip** — "Which formula is an inner product on ℝ²?" answer `{type:'choice', value:'a'}`. Choices: (a) ✓ $4u_1v_1 + 5u_2v_2$; (b) $u_1v_1 - u_2v_2$ (why: "$\langle\mathbf e_2,\mathbf e_2\rangle = -1 < 0$.");
   (c) $u_1v_2 + u_2v_1$ (why: "$\langle\mathbf e_1,\mathbf e_1\rangle = 0$ with $\mathbf e_1 \neq \mathbf 0$.").
3. `scene` **ip-polys** — *An inner product on polynomials.* Stage: $\mathbb P_2$ with $\langle p,q\rangle = p(-1)q(-1) + p(0)q(0) + p(1)q(1)$; plots of 1, t with the three sample points; table of values;
   $\langle 1, t\rangle = -1 + 0 + 1 = 0$ (orthogonal), $\|t\|^2 = 2$, $\|1\|^2 = 3$. Steps: (1) Evaluate at −1, 0, 1 and take the dot product of the value lists. (2) Positive-definite on $\mathbb P_2$
   because a nonzero quadratic can't vanish at three points. (3) Under it, 1 and t are orthogonal.
4. `scene` **gs-polys** — *Gram–Schmidt on 1, t, t².* Stage: tex: $p_0 = 1$, $p_1 = t$ (already orthogonal), $p_2 = t^2 - \frac{\langle t^2,1\rangle}{\langle1,1\rangle}1 - \frac{\langle t^2,t\rangle}{\langle t,t\rangle}t = t^2 - \tfrac23$;
   plot of $t^2 - 2/3$ with its values $(1/3, -2/3, 1/3)$ at the sample points. Steps: (1) Same algorithm, new inner product. (2) $\langle t^2,1\rangle = 2$, $\langle t^2,t\rangle = 0$. (3) Result: $1, t, t^2 - \tfrac23$.
5. `blanks` **fill-ip** — "With the evaluation inner product at −1, 0, 1, $p = 1 + t$, $q = t^2$": `\langle p,q\rangle = ` [2]; `\|p\|^2 = ` [5]. Solution: p-values (0,1,2), q-values (1,0,1).
6. `scene` **ip-functions** — *Functions: integrals.* Stage: $C[0,1]$ with $\langle f,g\rangle = \int_0^1 f(t)g(t)\,dt$; area under $f\cdot g$ shaded (`s.path`); $\langle 1,t\rangle = 1/2$, $\|t\|^2 = 1/3$.
   Steps: (1) An integral is a continuous dot product: multiply pointwise, add up. (2) Here 1 and t are *not* orthogonal: $\langle 1,t\rangle = \tfrac12$.
7. `scene` **best-approx-fn** — *Best approximation of a function.* Stage: on [0,1], $t^2$ (blue) and its projection onto $\operatorname{Span}\{1,t\}$: orthogonal basis $\{1, t - \tfrac12\}$,
   projection $\tfrac13 + (t - \tfrac12) = t - \tfrac16$ (green line) overlaid on the parabola; the gap shaded yellow. Steps: (1) Orthogonalize first: $t - \tfrac12$. (2) Project: the best straight-line
   approximation to $t^2$ on [0,1] in this inner product. (3) It's least squares again, with integrals instead of sums.
8. `scene` **mistake-ip-depends** — *The trap: orthogonal with respect to what?* Stage: 1 and t: orthogonal under the evaluation inner product (green ✓), not under $\int_0^1$ (yellow ✗). Steps: (1) Orthogonality is a
   property of the pair *and* the inner product. (2) Always say which inner product you're using.
9. `scene` **inequalities** — *Cauchy–Schwarz and the triangle inequality.* Stage: tex $|\langle\mathbf u,\mathbf v\rangle| \le \|\mathbf u\|\|\mathbf v\|$ and $\|\mathbf u + \mathbf v\| \le \|\mathbf u\| + \|\mathbf v\|$;
   check with 1 and t on [0,1]: $\tfrac12 \le 1\cdot\tfrac{1}{\sqrt3} \approx 0.577$. Steps: (1) They hold in every inner product space. (2) Cauchy–Schwarz is what lets us define angles between functions.
10. `workout` **wo-best-line** — "In $C[0,1]$ with $\langle f,g\rangle = \int_0^1 fg\,dt$, find the best approximation to $f(t) = t^2$ by $a + bt$. Enter $(a,b)$." answer `{type:'vector', value:['-1/6','1']}`.
    Hints: (1) Orthogonal basis $\{1,\ t - \tfrac12\}$; $\|t - \tfrac12\|^2 = \tfrac1{12}$. (2) $\langle t^2, 1\rangle = \tfrac13$, $\langle t^2, t - \tfrac12\rangle = \tfrac14 - \tfrac16 = \tfrac1{12}$. Solution:
    $\hat f = \tfrac13\cdot1 + \frac{1/12}{1/12}(t - \tfrac12) = t - \tfrac16$; check via normal equations: $\tfrac13 - a - \tfrac b2 = 0$, $\tfrac14 - \tfrac a2 - \tfrac b3 = 0$.
11. `explain` **cp-ip** — "Why does the evaluation rule $\langle p,q\rangle = p(-1)q(-1) + p(0)q(0) + p(1)q(1)$ give an inner product on $\mathbb P_2$ but not on $\mathbb P_3$?" Points: symmetry and linearity
    are inherited from the dot product of value lists; positivity needs $\langle p,p\rangle = 0 \Rightarrow p = 0$; a nonzero quadratic has at most 2 roots, so it can't vanish at all three points; a cubic like
    $t^3 - t$ vanishes at −1, 0, 1, so positivity fails on $\mathbb P_3$.
12. `scene` **summary-ips** — *Summary.* Stage: parabola with its best line. Steps: (1) Inner products generalize the dot product. (2) Every geometric tool (length, projection, Gram–Schmidt, least
    squares) carries over.

---

# Unit 7 · Symmetric matrices & quadratic forms

## 27. `symmetric` — Diagonalizing symmetric matrices (Lay 7.1 · 14 min)

**Goals**
- Know that eigenvectors of a symmetric matrix from different eigenspaces are orthogonal (Theorem 1).
- Orthogonally diagonalize: $A = PDP^T$ with P orthogonal, which happens exactly for symmetric A (Theorem 2).
- State the Spectral Theorem and write the spectral decomposition $A = \lambda_1\mathbf u_1\mathbf u_1^T + \cdots + \lambda_n\mathbf u_n\mathbf u_n^T$.

**Misconceptions:** any diagonalization of a symmetric matrix has orthogonal P (need to normalize, and orthogonalize within repeated eigenspaces); eigenvectors within one eigenspace
are automatically orthogonal; $P^{-1} = P^T$ for any P.

**Beats**
1. `scene` **perp-axes** — *Symmetric matrices stretch along perpendicular axes.* Stage: `s.plane`, unit circle; $A = \begin{bmatrix}3&1\\1&3\end{bmatrix}$; `applyMatrix(A)` turns the circle into an ellipse whose axes lie
   along (1,1) and (1,−1) (purple spans, right-angle mark); stretch factors 4 and 2 labelled. Steps: (1) A symmetric matrix equals its transpose. (2) Watch the circle: it stretches along two
   perpendicular directions, no twist. (3) Those directions are eigenvectors, eigenvalues 4 and 2.
2. `scene` **theorem-1** — *Why the eigenvectors are perpendicular.* Stage: tex proof: $\lambda_1\mathbf v_1\cdot\mathbf v_2 = (A\mathbf v_1)^T\mathbf v_2 = \mathbf v_1^TA^T\mathbf v_2 = \mathbf v_1^TA\mathbf v_2 = \lambda_2\mathbf v_1\cdot\mathbf v_2$,
   then $(\lambda_1 - \lambda_2)\mathbf v_1\cdot\mathbf v_2 = 0$. Steps: (1) Move A across the dot product; symmetry lets it switch sides. (2) Different eigenvalues force the dot product to be zero.
3. `scene` **orth-diag** — *A = PDPᵀ.* Stage: unit eigenvectors $\mathbf u_1 = \tfrac1{\sqrt2}(1,1)$, $\mathbf u_2 = \tfrac1{\sqrt2}(1,-1)$ fill P; $D = \operatorname{diag}(4,2)$; $P^{-1} = P^T$ highlighted.
   Steps: (1) Normalize the eigenvectors: P becomes an orthogonal matrix. (2) Its inverse is its transpose, free. (3) A matrix is orthogonally diagonalizable exactly when it is symmetric (Theorem 2).
4. `try` **try-orth-diag** — "Which matrix is orthogonally diagonalizable?" answer `{type:'choice', value:'c'}`. Choices: (a) $\begin{bmatrix}1&2\\0&3\end{bmatrix}$ (why: "Diagonalizable, but not symmetric,
   so its eigenvectors aren't orthogonal."); (b) $\begin{bmatrix}1&1\\0&1\end{bmatrix}$ (why: "Not even diagonalizable."); (c) ✓ $\begin{bmatrix}2&-3\\-3&5\end{bmatrix}$; (d) $\begin{bmatrix}0&-1\\1&0\end{bmatrix}$
   (why: "Antisymmetric: complex eigenvalues.").
5. `scene` **spectral-theorem** — *The Spectral Theorem.* Stage: tex list (a) n real eigenvalues counting multiplicity, (b) eigenspace dimension = multiplicity, (c) eigenspaces mutually orthogonal,
   (d) orthogonally diagonalizable. Steps: (1) For symmetric matrices everything that can go wrong with diagonalization doesn't. (2) Real eigenvalues, full eigenspaces, perpendicular ones.
6. `scene` **spectral-decomp** — *Spectral decomposition.* Stage: $A = 4\mathbf u_1\mathbf u_1^T + 2\mathbf u_2\mathbf u_2^T = \begin{bmatrix}2&2\\2&2\end{bmatrix} + \begin{bmatrix}1&-1\\-1&1\end{bmatrix}$;
   each $\mathbf u_j\mathbf u_j^T$ shown as a projection (`applyMatrix` onto a line), scaled, and summed. Steps: (1) Each $\mathbf u\mathbf u^T$ projects onto one eigen-direction. (2) A is a weighted sum of
   these projections, weights = eigenvalues.
7. `blanks` **fill-spectral** — `\mathbf u_1\mathbf u_1^T = \tfrac12\begin{bmatrix}1&1\\1&1\end{bmatrix},\ 4\mathbf u_1\mathbf u_1^T + 2\mathbf u_2\mathbf u_2^T = \begin{bmatrix}` [3] `&` [1] `\\` [1] `&` [3]
   `\end{bmatrix}`; `P^{-1} = ` [chips `P^T` ✓, `P`, `D^{-1}`].
8. `scene` **repeated** — *A repeated eigenvalue.* Stage: $A = \begin{bmatrix}2&1&1\\1&2&1\\1&1&2\end{bmatrix}$; λ = 4 with (1,1,1) (purple line in `s.space`); λ = 1 eigenspace = the plane $x_1 + x_2 + x_3 = 0$ (purple
   patch) perpendicular to it; basis $(-1,1,0), (-1,0,1)$ not orthogonal (yellow angle 60°); Gram–Schmidt within the plane gives $(-1,1,0), (-\tfrac12,-\tfrac12,1)$. Steps: (1) The 1-eigenspace is a whole
   plane, perpendicular to the 4-eigenvector. (2) The basis row reduction gives isn't orthogonal. (3) Run Gram–Schmidt *inside* the eigenspace, then normalize.
9. `scene` **mistake-normalize** — *The trap: forgetting to normalize.* Stage: P with unnormalized columns (1,1), (1,−1); $P^TP = 2I$ (yellow), so $P^{-1} \ne P^T$. Steps: (1) Orthogonal columns aren't
   enough: $P^T = P^{-1}$ needs unit columns. (2) Divide each eigenvector by its length.
10. `workout` **wo-orth-eigenspace** — "For $A = \begin{bmatrix}2&1&1\\1&2&1\\1&1&2\end{bmatrix}$, $\mathbf u = (-1,1,0)$ is in the eigenspace for λ = 1. Find the vector $\mathbf w = (a,b,1)$ in that eigenspace
    orthogonal to u." answer `{type:'vector', value:['-1/2','-1/2','1']}`. Hints: (1) The eigenspace is $x_1 + x_2 + x_3 = 0$. (2) Orthogonal to u: $-a + b = 0$. Solution: $a = b$ and $2a + 1 = 0$
    ⇒ $\mathbf w = (-\tfrac12,-\tfrac12,1)$, the Gram–Schmidt output; normalized basis $\tfrac1{\sqrt3}(1,1,1)$, $\tfrac1{\sqrt2}(-1,1,0)$, $\tfrac1{\sqrt6}(-1,-1,2)$; $D = \operatorname{diag}(4,1,1)$.
11. `try` **try-symmetric-fact** — "A is symmetric 3×3 with eigenvalues 2, 2, 7. What is the dimension of the eigenspace for 2?" answer `{type:'number', value: 2}`. Hint: Spectral Theorem (b).
    Solution: for symmetric matrices, eigenspace dimension equals multiplicity.
12. `explain` **cp-symmetric** — "Why are eigenvectors for different eigenvalues of a symmetric matrix orthogonal?" Points: compute $\lambda_1\mathbf v_1\cdot\mathbf v_2$ two ways; $(A\mathbf v_1)\cdot\mathbf v_2 = \mathbf v_1\cdot(A^T\mathbf v_2)$;
    $A^T = A$ turns it into $\lambda_2\mathbf v_1\cdot\mathbf v_2$; since $\lambda_1 \ne \lambda_2$, the dot product must be 0.
13. `scene` **summary-sym** — *Summary.* Stage: circle → ellipse with perpendicular axes. Steps: (1) Symmetric ⇔ orthogonally diagonalizable. (2) $A = PDP^T$, $P^{-1} = P^T$. (3) A is a sum of
    eigenvalue-weighted projections.

---

## 28. `quadratic-forms` — Quadratic forms (Lay 7.2 · 14 min)

**Goals**
- Write a quadratic form as $Q(\mathbf x) = \mathbf x^TA\mathbf x$ with A symmetric (cross-term coefficients split in half).
- Remove cross terms by the change of variable $\mathbf x = P\mathbf y$ (Principal Axes Theorem) and identify principal axes.
- Classify Q as positive/negative definite or indefinite (and semidefinite) from the eigenvalues of A (Theorem 5).

**Misconceptions:** putting the whole cross coefficient in one off-diagonal entry (or not splitting); classifying from the signs of the diagonal entries; principal axes = coordinate axes.

**Beats**
1. `scene` **surfaces** — *Three shapes of quadratic forms.* Stage: three level-curve plots in `s.plane` (ellipse family for $3x_1^2 + 7x_2^2$, hyperbolas for $3x_1^2 - 7x_2^2$, lines for $x_1^2$) built from `s.path`
   samples. Steps: (1) A quadratic form is a sum of degree-two terms. (2) With no cross terms, its level curves are axis-aligned ellipses or hyperbolas. (3) Cross terms tilt them.
2. `scene` **matrix-of-q** — *The matrix of a quadratic form.* Stage: $Q(\mathbf x) = 5x_1^2 + 4x_1x_2 + 2x_2^2$; coefficients fly into $A = \begin{bmatrix}5&2\\2&2\end{bmatrix}$: squares to the diagonal, the cross term 4
   splits into 2 and 2 (yellow); verify $\mathbf x^TA\mathbf x$ by expanding. Steps: (1) Squared terms go on the diagonal. (2) The $x_ix_j$ coefficient is split in half between positions $(i,j)$ and $(j,i)$.
   (3) That makes A symmetric.
3. `blanks` **fill-q-matrix** — "$Q(\mathbf x) = x_1^2 - 6x_1x_2 + 4x_2^2$": `A = \begin{bmatrix}1&` [−3] `\\` [−3] `&` [4] `\end{bmatrix}`.
4. `scene` **principal-axes** — *Rotate the cross term away.* Stage: tilted ellipse $Q(\mathbf x) = 6$ in `s.plane`; eigenvectors $\mathbf u_1 = \tfrac1{\sqrt5}(2,1)$ (λ = 6), $\mathbf u_2 = \tfrac1{\sqrt5}(-1,2)$ (λ = 1) purple;
   the plane rotates (`applyMatrix` with $P^T$) until they align with the axes; Q becomes $6y_1^2 + y_2^2$. Steps: (1) A is symmetric, so $A = PDP^T$. (2) Substitute $\mathbf x = P\mathbf y$:
   $\mathbf x^TA\mathbf x = \mathbf y^TD\mathbf y$. (3) No cross term: $6y_1^2 + y_2^2$. The columns of P are the principal axes.
5. `try` **try-new-form** — "After $\mathbf x = P\mathbf y$ with an orthonormal eigenvector matrix P, $Q(\mathbf x) = x_1^2 + 4x_1x_2 + x_2^2$ becomes:" answer `{type:'choice', value:'b'}`. Choices: (a) $y_1^2 + y_2^2$ (why:
   "The diagonal of A isn't the eigenvalues."); (b) ✓ $3y_1^2 - y_2^2$; (c) $5y_1^2 + y_2^2$ (why: "Eigenvalues of $\begin{bmatrix}1&2\\2&1\end{bmatrix}$ are 3 and −1."). Solution: trace 2, det −3, so λ = 3, −1.
6. `scene` **classify** — *Classifying by eigenvalues (Theorem 5).* Stage: three surfaces sketched as level curves + labels: all λ > 0 positive definite (bowl), all λ < 0 negative definite, mixed signs indefinite
   (saddle); semidefinite when some λ = 0. Steps: (1) In the y-variables, Q is a weighted sum of squares. (2) The signs of the weights, the eigenvalues, decide everything.
7. `scene` **mistake-diagonal** — *The trap: reading signs off the diagonal.* Stage: $\begin{bmatrix}1&2\\2&1\end{bmatrix}$: positive diagonal, but $Q(1,-1) = 1 - 4 + 1 = -2 < 0$ (yellow point on the hyperbola). Steps: (1) Positive
   diagonal entries don't make Q positive definite. (2) Check eigenvalues (or test a vector).
8. `try` **try-classify-q** — "Classify $Q(\mathbf x) = 3x_1^2 + 2x_1x_2 + 3x_2^2$." answer `{type:'choice', value:'a'}`. Choices: (a) ✓ positive definite (λ = 4, 2); (b) indefinite (why: "Both eigenvalues are positive.");
   (c) positive semidefinite only (why: "No zero eigenvalue."). Solution: $A = \begin{bmatrix}3&1\\1&3\end{bmatrix}$, eigenvalues 4 and 2.
9. `workout` **wo-q-matrix** **(generate)** — "Find the matrix of $Q(\mathbf x) = 3x_1^2 + 2x_2^2 - x_3^2 + 4x_1x_2 - 6x_2x_3$." answer `{type:'matrix', value:[[3,2,0],[2,2,-3],[0,-3,-1]]}`. Hints: (1) Diagonal:
   3, 2, −1. (2) Halve each cross coefficient; there's no $x_1x_3$ term. Solution: as given; check with $\mathbf x = (1,-1,2)$: $Q = 3 + 2 - 4 - 4 + 12 = 9$ and $\mathbf x^TA\mathbf x = 9$.
   `generate`: random symmetric 3×3 with small entries, build Q's text from it.
10. `workout` **wo-principal** — "Make a change of variable $\mathbf x = P\mathbf y$ that removes the cross term from $Q(\mathbf x) = x_1^2 - 6x_1x_2 + x_2^2$, and classify Q. Enter the new coefficients $(c_1, c_2)$ of
    $c_1y_1^2 + c_2y_2^2$ with $c_1 \ge c_2$." answer `{type:'vector', value:['4','-2']}`. Hints: (1) $A = \begin{bmatrix}1&-3\\-3&1\end{bmatrix}$. (2) Trace 2, det −8. Solution: eigenvalues 4 (eigenvector
    $(1,-1)$) and −2 (eigenvector $(1,1)$); $P = \tfrac1{\sqrt2}\begin{bmatrix}1&1\\-1&1\end{bmatrix}$; $Q = 4y_1^2 - 2y_2^2$: indefinite.
11. `explain` **cp-qform** — "Why do the eigenvalues of A decide whether $\mathbf x^TA\mathbf x$ is positive for all nonzero x?" Points: orthogonal change of variables $\mathbf x = P\mathbf y$ is invertible (nonzero x ↔ nonzero y);
    $Q = \lambda_1y_1^2 + \cdots + \lambda_ny_n^2$; all λ positive ⇒ every nonzero y gives a positive sum; a negative (or zero) λ gives a y (a basis vector) where Q is negative (or zero).
12. `scene` **summary-qf** — *Summary.* Stage: tilted ellipse straightening. Steps: (1) $Q = \mathbf x^TA\mathbf x$ with A symmetric. (2) Principal axes = eigenvectors; coefficients = eigenvalues.
    (3) Eigenvalue signs classify Q.

---

## 29. `svd` — The singular value decomposition (Lay 7.4 · 17 min)

**Goals**
- See any matrix as mapping the unit circle/sphere to an ellipse; singular values are the semi-axis lengths.
- Compute singular values $\sigma_i = \sqrt{\lambda_i}$ from the eigenvalues of $A^TA$, right singular vectors $\mathbf v_i$, left singular vectors $\mathbf u_i = A\mathbf v_i/\sigma_i$.
- Assemble $A = U\Sigma V^T$; read off rank and bases for Col A, Nul A from the SVD.

**Misconceptions:** singular values are the eigenvalues of A; using $AA^T$ and $A^TA$ eigenvectors interchangeably without matching; forgetting the square root; Σ is square.

**Beats**
1. `scene` **circle-to-ellipse** — *Every matrix turns a circle into an ellipse.* Stage: `s.plane`, unit circle (blue) with two marked perpendicular radii; $A = \begin{bmatrix}2&2\\1&-1\end{bmatrix}$ applied: the circle
   becomes an ellipse with semi-axes $2\sqrt2$ along $x_1$ and $\sqrt2$ along $x_2$ (green); the radii that land on the axes are $\mathbf v_1 = \tfrac1{\sqrt2}(1,1)$, $\mathbf v_2 = \tfrac1{\sqrt2}(1,-1)$ (purple).
   Steps: (1) Not every matrix has perpendicular eigenvectors, but every matrix has this. (2) Some perpendicular pair of unit vectors lands on the ellipse's axes. (3) The axis lengths are the singular values.
2. `scene` **ata** — *Finding them: AᵀA.* Stage: tex $\|A\mathbf x\|^2 = \mathbf x^TA^TA\mathbf x$; $A^TA = \begin{bmatrix}5&3\\3&5\end{bmatrix}$ symmetric, eigenvalues 8, 2, eigenvectors $\mathbf v_1, \mathbf v_2$; $\sigma_1 = \sqrt8 = 2\sqrt2$,
   $\sigma_2 = \sqrt2$. Steps: (1) Maximizing $\|A\mathbf x\|$ on the unit circle is a quadratic form problem for $A^TA$. (2) $A^TA$ is symmetric with nonnegative eigenvalues. (3) Singular values are their square
   roots, in decreasing order.
3. `blanks` **fill-sv** — `\sigma_i = \sqrt{\lambda_i(` [chips `A^TA` ✓, `A`, `A+A^T`] `)}`; `\mathbf u_i = \frac{1}{` [chips `\sigma_i` ✓, `\lambda_i`, `\|\mathbf v_i\|`] `}A\mathbf v_i`.
4. `scene` **u-vectors** — *The left singular vectors.* Stage: $A\mathbf v_1 = (2\sqrt2, 0)$, $A\mathbf v_2 = (0, \sqrt2)$ arrows; divided by σ: $\mathbf u_1 = (1,0)$, $\mathbf u_2 = (0,1)$. Steps: (1) The images $A\mathbf v_i$ are orthogonal,
   with lengths $\sigma_i$. (2) Normalize them to get $\mathbf u_i$.
5. `scene` **assemble** — *A = UΣVᵀ.* Stage: three-step animation on the circle: $V^T$ rotates $\mathbf v_1, \mathbf v_2$ to the axes, Σ stretches by $2\sqrt2$ and $\sqrt2$, U rotates (here U = I) — each via `applyMatrix`;
   tex $A = U\Sigma V^T$ with $V = \tfrac1{\sqrt2}\begin{bmatrix}1&1\\1&-1\end{bmatrix}$, $\Sigma = \operatorname{diag}(2\sqrt2,\sqrt2)$. Steps: (1) Rotate (or reflect). (2) Stretch along the axes. (3) Rotate again.
   (4) Every matrix is these three moves.
6. `try` **try-sv-not-eig** — "$A = \begin{bmatrix}1&1\\0&1\end{bmatrix}$. Its eigenvalues are 1, 1. Its largest singular value is…" answer `{type:'choice', value:'c'}`. Choices: (a) 1 (why: "Singular values come
   from $A^TA = \begin{bmatrix}1&1\\1&2\end{bmatrix}$, not A."); (b) 2 (why: "2 is the trace of A, not a singular value."); (c) ✓ $\frac{1+\sqrt5}{2} \approx 1.618$; (d) $\frac{3+\sqrt5}{2}$ (why: "That's $\lambda_1(A^TA)$: take the square root.").
7. `scene` **mistake-eigen** — *The trap: singular values aren't eigenvalues.* Stage: the shear's circle → ellipse with semi-axis 1.618 (green) vs eigenvalue 1 (yellow). Steps: (1) Eigenvalues measure stretch along
   lines that stay put; a shear has only one such line, stretched by 1. (2) Singular values measure the ellipse, and the shear's ellipse is longer. (3) They coincide for symmetric positive semidefinite matrices.
8. `scene` **rectangular** — *Rectangular matrices.* Stage: $A = \begin{bmatrix}1&1&0\\0&1&1\end{bmatrix}$ ($2\times 3$): `s.space` unit sphere → ellipse in ℝ² (sketched); Σ is $2\times 3$ with a zero column; $A^TA$ is 3×3
   with eigenvalues 3, 1, 0; σ = √3, 1. Steps: (1) For $m\times n$, Σ is $m\times n$ with the σ's on the diagonal. (2) A zero eigenvalue of $A^TA$ is a direction crushed to zero: it's in Nul A.
9. `scene` **rank-bases** — *What the SVD tells you (Theorem 9).* Stage: tex: rank A = number of nonzero σ's; $\{\mathbf u_1..\mathbf u_r\}$ orthonormal basis of Col A; $\{\mathbf v_{r+1}..\mathbf v_n\}$ of Nul A; for
   the 2×3 example: $\mathbf v_3 = \tfrac1{\sqrt3}(1,-1,1)$ spans Nul A. Steps: (1) Count nonzero singular values: rank. (2) The u's for nonzero σ's span the column space. (3) The v's for zero σ's span the null space.
10. `workout` **wo-svd** — "Find the singular values of $A = \begin{bmatrix}1&1\\0&1\\1&0\end{bmatrix}$. Enter the largest, $\sigma_1$, to three decimals." answer `{type:'number', value: 1.7320508, tol: 0.001}`. Hints:
    (1) $A^TA = \begin{bmatrix}2&1\\1&2\end{bmatrix}$. (2) Its eigenvalues are 3 and 1. Solution: $\sigma_1 = \sqrt3 \approx 1.732$, $\sigma_2 = 1$; $\mathbf v_1 = \tfrac1{\sqrt2}(1,1)$, $\mathbf v_2 = \tfrac1{\sqrt2}(1,-1)$;
    $\mathbf u_1 = \tfrac1{\sqrt3}A\mathbf v_1 = \tfrac1{\sqrt6}(2,1,1)$, $\mathbf u_2 = A\mathbf v_2 = \tfrac1{\sqrt2}(0,-1,1)$; rank 2.
11. `try` **try-rank-svd** — "A $4\times 3$ matrix has singular values 5, 2, 0. Which is true?" answer `{type:'multi', value:['a','c']}`. Choices: (a) ✓ rank A = 2; (b) "A is one-to-one" (why: "$\mathbf v_3$ is
    sent to 0."); (c) ✓ "$\dim\operatorname{Nul}A = 1$"; (d) "Col A = ℝ⁴" (why: "Rank 2 < 4.").
12. `explain` **cp-svd** — "Explain geometrically what $A = U\Sigma V^T$ says about how A acts on the unit circle (or sphere)." Points: $V^T$ is a rotation/reflection taking the right singular vectors to the
    coordinate axes; Σ stretches each axis by $\sigma_i$ (crushing those with σ = 0); U rotates the result so the axes land on the left singular vectors; so the circle becomes an ellipse with semi-axes
    $\sigma_i\mathbf u_i$; the largest σ is the maximum of $\|A\mathbf x\|$ over unit x.
13. `scene` **summary-svd** — *Summary, and the whole course.* Stage: rotate–stretch–rotate replay, then a slow pull-back showing thumbnails of earlier lecture pictures (row reduction, grid map, eigenlines,
   projection, ellipse). Steps: (1) Every matrix: rotate, stretch, rotate. (2) Singular values are the stretches; they reveal rank and the four subspaces. (3) That's the course: the same few pictures,
   seen more and more clearly.
