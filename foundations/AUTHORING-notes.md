# Foundations authoring notes

What a `foundations/` lecture author needs beyond `lectern/AUTHORING.md`. Read `foundations/PLAN.md` (style guide +
your lecture's section), `lectern/docs/viz-logic.md` and `lectern/docs/viz-common.md` first. Working examples:
`lectures/propositions.js` (truth tables, De Morgan symbol choreography) and `lectures/direct-proof.js` (definition
cards, skeleton proof, scratch → proof, wrong proofs struck in red).

## Imports and shared pieces

```js
import { C } from '../../lectern/src/core/stage.js';
```
That is usually all a lecture imports; everything else is a stage factory. Keep DOM work inside `scene`/`do`, so
the module imports cleanly in Node.

| need | use |
| --- | --- |
| definition card (purple) | `s.defCard({ y, body: 'text with $math$', visible: false })` → `await card.reveal()`. `title: false` drops the "Definition" heading (saves ~40 px; needed when cards stack). `tex:` for pure TeX. |
| verdict / T / F | `s.stamp('not a proof', { x, y, color: 'red', size: 30 })` → `await st.slam()` |
| ring a symbol | mark it `\part{name}{…}`, then `await s.ring([tex, 'name'], { color })`; works on cards too (`[card, 'ex']`). `shape: 'box'` for a word or phrase, the default ellipse for one symbol. |
| strike a wrong line | `await s.strike(mob)` (mob dims to muted). Inside a `proof`: `p.strike(line)`. |
| scratch pane | `s.scratch({ x, y, w, h, visible: false })` → `reveal()`, `add(tex, { color })` stacks lines |
| moving symbols | `s.symbols([...], { x, y, size, visible })` → one Tex per piece |

## Proof-writing choreography

One `say` per logical move, with the matching `p.add(...)` inside that step, so the reason column fills in while
the narration names the reason:

```js
{ say: 'Name the new witness and say why it is an integer: sums and products of integers are integers.',
  do: async (s, o) => {
    o.wit = o.p.add('Let $m = 2k^2 + 2k$. Then $m \\in \\mathbb{Z}$.', { why: '$\\mathbb{Z}$ is closed under $+$ and $\\times$' });
    await o.wit;
    await o.p.highlight(o.wit, 'yellow');     // yellow = the step being explained
  } },
```
- First line `kind: 'assume'` (blue rule) starting `**Proof.**`; last line `kind: 'conclude'` (green) starting
  "Therefore"; then `await p.qed()`.
- Store line handles on `o` (`o.wit = …`) when a later step highlights, notes or inserts after them. Steps replay
  instantly on seek, so this stays deterministic.
- The reason column (`whyWidth: 'auto'`) grows to fit the longest reason, up to 34 %. Keep reasons short
  ("definition of odd", "closure of $\mathbb{Z}$") and statements short. Use `width: 900`, and split long
  computations into two lines (`'$\\phantom{n^2} = 2(2k^2 + 2k) + 1$.'` with `indent: 1`).
- **Skeleton proofs** (the `structure` beat): write the first line, a `'$\\vdots$'` placeholder
  (`{ numbered: false }`) and the last line, then fill the middle:
  ```js
  o.first = o.p.add('**Proof.** Let $n \\in \\mathbb{Z}$; suppose $P(n)$.', { kind: 'assume', why: 'hypothesis' });
  o.dots = o.p.add('$\\vdots$', { numbered: false });
  await o.p.add('Therefore $Q(n)$.', { kind: 'conclude', why: 'the goal' });
  // later steps:
  const a = o.p.insertAfter(o.first, 'Unpack $P(n)$ …', { why: 'definition' }); await a;
  await o.p.replace(o.dots, 'Repack: …', { why: 'definition', numbered: true });
  ```
  The rows below slide down and renumber. This is the "first line, last line, then the middle" habit we teach.
- Plain-English content with `$…$` is text. Bare TeX is detected automatically, but pass `tex: true` for law chains
  (`'\\equiv (\\neg p \\land q) \\lor q'`).
- A chain of equivalences (laws of logic) is a `proof` with `numbered: false`, each line starting `\\equiv`, and
  the law as `why`.

## Scratch work vs. the written proof

PLAN.md: scratch work is shown separately and may run backwards; the proof never does. Two patterns that fit:

1. **Separate beats** (`scratch` → `write-proof`): a full-stage `s.scratch` pane (`size: 36`) filled with
   `pane.add(...)`, one line per step: *know* in blue, the computation, *want* in green with a `?`, then the meeting
   line in yellow and "so the ? is …". Don't position your own Tex over a pane: the layout audit (`#/audit/<id>`)
   flags text on a pane as a block overlap. The proof beat opens with the key scratch line as a muted strip
   (`y: 50, size: 30, color: C.muted`) and `indicate()`s it when the proof reaches it.
2. **Same beat, in sequence** (`divides-transitive`): `pad.add(...)` lines in a scratch pane (blue for the unpacked
   hypotheses, yellow for the discovery), then one step folds the pad away (`pad.fadeOut({ shift: [-30, 0] })`),
   fades a one-line muted strip in, and a full-width proof (created `visible: false`, then `p.show()` after the fold,
   so the empty window never sits under the pad) writes below. Side by side with a ~640-px proof was too cramped.

Wrong arguments go left/red and the corrected one right/green, with a divider line between them (`errors` beat).
Strike the wrong one *after* the narration says why it fails, then relabel it (`head.swap('scratch, not proof')`)
rather than deleting it.

## Truth tables

```js
const t = s.truthTable({ x: 355, y: 300, size: 34, vars: ['p', 'q'], visible: false, cols: [
  { tex: '\\neg p', key: 'not', fn: (v) => !v.p },
  { tex: 'p \\land q', key: 'and', fn: (v) => v.p && v.q } ] });
await t.fadeIn();                        // step 1
await t.fillColumn('and');               // one step per column, narrated as it fills
await t.highlightCell(0, 'and', 'green');
```
- Give every column a `key` and refer to it by key.
- `show: 'headers'` hides the variable columns too, so you can fill them while explaining the halving pattern.
- Widths: at size 30, three vars + `(p \lor q) \land \neg r` + two helper columns ≈ 660 px including the mark
  column. Leave ≥ 20 px margins and put side notes (size 30, left-anchored) in what remains.
- Equivalence: highlight both final columns green, `markRow(i, '✓')` row by row (`for … await`), then write the
  `\equiv` statement below. Non-equivalence: one red row is enough.
- Boxes for labels and rings: `t.colBox(j)`, `t.cellBox(i, j)`, `t.rowBox(i)`. A ring around two cells of a row:
  build `{ x, y, w, h }` from two `cellBox`es and `s.ring(box, { shape: 'box' })`.

## Moving symbols (manim-style)

To show `¬(p ∧ q) → ¬p ∨ ¬q`, build the source with `s.symbols([...])` (operators written `'\\;\\land\\;'` so
the spacing survives), a second hidden `s.symbols` row as the target layout, then `moveTo` each piece onto its
target, fade the parentheses, spawn a copy of `¬` for the second letter, and `swap()` the operator (`deMorgan()` in
`propositions.js`). Keep an untouched copy of the source on the left so both sides of the `≡` stay visible.

## Venn and map diagrams (not used by the two pilots)

- `s.venn({ sets: 2 })`; shade with region codes (`'A&B'`, `'A-B'`, `v.complement('A')`), one shade per step;
  `element(region, 'x')` for a witness, with counterexample elements in `'red'`. For identities, put two Venns
  side by side (`x: 250` / `x: 710`, `r` ≈ 110), shade them step by step, then a green `=` between them.
- `s.mapDiagram({ domain, codomain, arrows, name: 'f' })`: draw arrows in the step that names them;
  `showCollision()` / `showMissed()` are the "not injective / not surjective" counterexamples, narrated as they pulse.

## Interludes

- **blanks**: each line alternates TeX strings and blanks, rendered as separate KaTeX pieces. A string after a
  blank that starts with an operator must begin `'{} + 1 …'`, or KaTeX treats `+` as unary. Use `\\text{…}` for
  words. Chips are TeX (`'\\mathrm{T}'`, `'\\mathbb{Z}'`); make the wrong chips real mistakes students make.
- **workout** proofs: `answer: { type: 'proof' }`, `solution` paragraphs starting `**Proof.**` and ending `∎`,
  with the justifications inside the sentences; `rubric` of 3–5 items.
- **try**: every choice has a `why`; the right one's `why` gives the reason.

## Narration

- `$tex${spoken}` for every bit of math, single letters included: `$n${n}`. A bare `$p$` fails the test. Plain
  words ("not p") are fine too.
- No `}` inside the spoken braces. Read symbols the PLAN way ("a divides b", "x-or").
- Beat titles may contain `$…$`, but keep them plain where you can (the outline and the tutor read them).

## Checking your layout

Open `#/l/<lecture>/<beat>` and press the bar's next button (a programmatic `click()` counts as keyboard, so
steps run instantly) until `.count` reads `n / n`; it can ignore a click while a step is still settling, so loop
on `.count`. Screenshot `.lx-stage`. Also play one beat for real and step back once.
