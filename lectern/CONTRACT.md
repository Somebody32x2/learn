# lectern: the shared contract

lectern is the lecture engine behind two subjects of the Learn hub: **Matrix Algebra**
(`matrix/`, WashU MATH 3300) and **Foundations for Higher Mathematics** (`foundations/`, WashU MATH 3010).
Lectures are narrated, slide-like scenes animated in the browser (manim-style, no prerendering), broken up by
practice. It is **hybrid**: everything works as a static public site; when the page is served by the private
*learn tutor* (`window.__tutor` exists), extra tutor features switch on (explain-back checkpoints with the AI
tutor, AI grading of worked problems, "help me through it").

This file is the contract every module is written against. Read it fully before writing code here.

## Ground rules

- Static ES modules, **no dependencies, no build step, no CDN at runtime** except the hub's Google Fonts link.
  KaTeX is vendored at `lectern/vendor/katex/` (`katex.min.js` sets `window.katex`; `katex.min.css`).
- **Every URL relative** (the site is served under a path prefix). Subject pages live at `<hub>/<slug>/`;
  lectern files are reached as `../lectern/...` from a subject's `index.html`.
- Public repo rules: no deployment details, hostnames, agent prompts or chat text in `lectern/`, `matrix/`,
  `foundations/`. Anything that talks to the tutor's AI (prompt text) lives in `lectern-tutor/` (private).
- Light and dark mode via `lectern/css/tokens.css` variables only. Fonts: `--sans` (Geist), `--serif` (Newsreader),
  `--mono` (Geist Mono). No new colors outside tokens.css.
- Mobile first: works at 360 px wide, touch targets ≥ 44 px, `env(safe-area-inset-*)` respected, no hover-only
  affordances (gate hover styles with `@media (hover: hover) and (pointer: fine)`).
- Motion: `--ease-out` for entrances/responses, `--ease-in-out` for movement; UI transitions ≤ 300 ms except
  sheets/drawers; `:active { transform: var(--press) }` on pressables; never animate from `scale(0)`; honour
  `prefers-reduced-motion` (keep opacity/color, drop movement). Keyboard-initiated actions are not animated.
- Accessibility: real `<button>`s, labels for inputs, `aria-live="polite"` for feedback, visible focus.

## Layout

```
lectern/
  CONTRACT.md            this file
  AUTHORING.md           how to write a lecture well
  docs/                  component references: viz-common.md, viz-la.md, viz-logic.md, scene-player.md
  vendor/katex/          KaTeX 0.16 (MIT)
  css/                   tokens.css (variables, stage base), stage.css, stage-logic.css, app.css, interlude.css
  src/core/              dom.js (el, svg, helpers), tween.js (Clock, ease), stage.js (Stage, C, FILL, extend),
                         mobject.js (Mob, Tex, Text, Group, katexHtml, inlineMath), frac.js, linalg.js, answer.js,
                         hash.js (fnv64, clipKey, rng), md.js
  src/viz/               common.js (cards, stamps, scratch, strike, ring, symbols), shapes.js, matrix.js, plane.js,
                         space.js, logic.js, sets.js; index.js registers them all; demos*.js feed #/kit
  src/interlude/         index.js (renderInterlude), try.js, blanks.js, workout.js, explain.js, common.js, samples.js
  src/player/            player.js (LecturePlayer), narrator.js, controls.js
  src/pages/             home.js, bank.js, kit.js, audit.js
  src/progress/store.js  Store
  src/tutor/detect.js    getBridge()
  src/app.js             boot(course): shell and router
  src/scene-player.js    Player for the tutor's show_scene
  tests/*.test.js        node:test (pure modules and structural checks of every lecture)
  tts/                   Kokoro narration generator: gen.mjs, speech.mjs, kokoro_say.py (not deployed)
lectern-tutor/           PRIVATE (served only by the tutor): bridge.js, prompts.js
matrix/, foundations/    subjects: index.html, course.js, lectures/*.js, audio/, PLAN.md
dev/serve.mjs            dev server (private repo only): public :5173, tutor emulation :5174
```

## Stage (src/core/stage.js, mobject.js)

`new Stage(host)`: 960 × 600 logical units scaled to `host`, layers `s.back` (SVG), `s.html`, `s.front` (SVG), one
pausable `s.clock`. Factories `s.tex(latex, opts)`, `s.text(str, opts)`, `s.group(...mobs)`, `s.svgMob(node, opts)`,
`s.htmlMob(node, opts)`; timing `s.all(...)`, `s.wait(ms)`, `s.stagger(fns, gap)`; `s.reset()`, `s.destroy()`.
Colors `C`, soft fills `FILL` (same names: ink, muted, blue, red, green, yellow, purple, teal, orange).
Readable text is ≥ 30 logical px; content stays inside the 24 px safe margin.

Mob animations (Promises on the stage clock): `fadeIn({ shift })`, `fadeOut()`, `write()`, `moveTo`, `shift`,
`scaleTo`, `rotateTo`, `animate({ x, y, scale, rotate, opacity })`, `recolor(c)`, `indicate()`, `flash()`,
`morphTo(other)`; immediate `set`, `show`, `hide`, `remove`; `box()`. `Tex` adds `part(name)`, `color(name, c)`,
`partBox(name)`.

TeX extensions (katexHtml, everywhere on the stage): `\col{blue}{…}` colors with a stage color; `\part{name}{…}`
marks a part for `part()` / `color()` / `partBox()`.

**Every stage animation goes through `stage.clock`** (tweens or Mob methods), so pause, rate, instant seeking and
`kill()` work; never setTimeout, CSS transitions or WAAPI. Components register factories with
`extend({ name(...) { … } })` from `core/stage.js`; lectures call `s.matrix(...)`, `s.plane(...)`, `s.venn(...)`, …
(full APIs in each module's header and `lectern/docs/`).

## A course (matrix/course.js, foundations/course.js)

```js
export default {
  slug: 'matrix',                 // folder and storage namespace
  title: 'Matrix Algebra',
  course: 'MATH 3300 · WashU',
  voice: 'am_michael',            // Kokoro voice of every clip (foundations: 'af_heart')
  blurb: '…',
  units: [{ title, lectures: [{ id, title, section, minutes, summary, load: () => import('./lectures/<id>.js') }] }],
};
```

## A lecture (`<subject>/lectures/<id>.js`, default export)

`{ id, title, goals: [string], beats: [...] }`; `id` equals the course entry's id. Beat ids are stable forever
(progress keys).

**Scene beat:** `{ id, title, scene(s) → refs, steps: [{ say, do(s, refs) }] }`.
- `title` is the slide heading (`h2.fig-title`, a tutor anchor).
- `say` is one narration clip. Math in narration is `$tex${spoken words}`: captions show the TeX, the voice reads the
  words; a bare `$…$` fails the tests. Pause tags `<short pause>`, `<pause>`, `<long pause>`.
- `do` returns nothing, a Promise or an array of Promises; the step ends when the clip **and** its animations end.
  Steps must be deterministic given the scene (seeking replays them instantly).

**Interlude beats** (`kind`: try, blanks, workout, explain) share `{ id, kind, title, say?, prompt, figure?(s) }`
(`prompt`, hints and solutions are Markdown + `$math$`; `figure` builds a small static stage).

- `try`: `answer` (core/answer.js spec), `choices: [{ id, label, why? }]` for choice/multi, `hint`, `solution: [md]`.
- `blanks`: `lines: [line, …]`, `solution`. A line is an array of pieces:
  - TeX strings and inline blanks `{ id, chips: [TeX], answer: TeX, hint? }` (chip blank) or
    `{ id, answer: spec | number | string, hint? }` (typed blank);
  - `{ matrix: [[cell, …], …], augment? }`: cells are TeX strings or blank objects; `augment: k` draws the bar after
    column k;
  - `{ tex: '…\\blank{a}…', blanks: { a: { answer, chips?, hint?, width? } } }`: blanks anywhere inside TeX.
- `workout`: `answer` (any spec, incl. `{ type: 'proof' }`), `hints: [md]`, `solution: [md]`, `rubric: [md]` (shown as
  a self-check for proofs), `generate(rand) → { prompt, answer, solution, … }` (optional: 'New numbers' variants).
- `explain`: `points: [md]` (the key ideas; the public self-check list, never sent to the tutor).

## Progress (src/progress/store.js)

localStorage, namespace = course slug. Only the three `.v1` keys are synced by the tutor:

- `<ns>.progress.v1` `{ "<lecture>.<beat>": bool }`: correctness; true never downgrades.
- `<ns>.visited.v1` `{ "<lecture>": ms }`.
- `<ns>.attempts.v1` `{ key: { …, at } }`, merged per key by newest `at`:
  - `pos:<lecture>` `{ beat, step, furthest, done, total, title, seen: [beat index] }`; `done` = every beat seen and
    the end reached.
  - `q:<lecture>/<beat>` (try, blanks) `{ value, results, ok, revealed, tries, hint? }`.
  - `wo:<lecture>/<beat>` `{ status: 'open'|'solved'|'banked'|'revealed', answer, work, hintsShown, verdict,
    feedback, seed, rubric: [bool], tries, grading, thread, since, everSolved, bankedAt, lastCheck: { ok, why,
    wrongAt } }`. `everSolved` survives 'New numbers'.
  - `cp:<lecture>/<beat>` `{ status: 'open'|'talking'|'passed', text, thread, since, reply, later, compared,
    checks: [bool] }`.
- `<ns>.prefs` `{ rate, captions, sound, autoAdvance }`: device-only.

```js
const store = new Store('matrix');     // one instance per namespace
store.mark(id, ok); store.correct(id) → true | false | undefined
store.visit(lectureId); store.visited(lectureId) → ms | undefined
store.get(key) → object | null; store.put(key, patch)   // shallow merge, sets `at`, debounced write (≤ 300 ms)
store.entries(prefix) → [[key, value]]; store.flush()
store.onChange(fn) → unsubscribe       // fn({ areas }) after another tab or the tutor sync changed data
store.prefs(); store.setPrefs(patch)
```

Writes re-read and merge areas changed elsewhere first (true wins, newest `at` wins). Drafts never write `status`.

`bankItems(store, course?)` (pages/bank.js) is the one definition of "in the bank": workouts with status `banked`
and checkpoints not passed that are `later` or `talking`; with `course`, unknown lectures are dropped. Home, the end
card and `#/bank` all count with it.

## Interludes (src/interlude/index.js)

`renderInterlude(beat, ctx) → { node, ready: Promise<void>, destroy() }`; `ready` resolves when the learner may go
on; `destroy()` stops tutor watchers / grading and releases figure stages.

ctx: `{ store, course, lecture, beat, key, id, bridge, onDone(), speak?(text), inLecture?, inBank? }`.
`key` = `<lecture>/<beat>`, `id` = `<lecture>.<beat>` (derived when missing; course / lecture may be objects or
ids). `bridge` is the tutor bridge or null. `onDone()` fires on a live completion (not on restore). `inLecture`
(set by the player) and `inBank` (set by the bank) hide the card's own 'Skip for now'; `inBank` also hides
'remind me later'. All inputs restore from the store and save as the learner types.

The player shows the interlude in place of the stage with a gate: **Continue** (active once `ready`), plus **Skip**
for try/blanks and **Bank it, go on** for workouts. In private mode (bridge present) an explain checkpoint locks
Continue until it is passed with the tutor or deferred ('remind me later', which puts it in the bank); publicly it
is a written self-check against `points`.

## Tutor bridge (private side)

`getBridge()` (src/tutor/detect.js, cached) → null unless `window.__tutor` is set, then imports
`<__tutor.root>lectern-tutor/bridge.js` (null on failure). API (details in lectern-tutor/bridge.js):

```js
bridge.open() → boolean
bridge.explainBack({ course, lecture, beat, title, prompt, source, saved, onUpdate }) → { stop() }
  // onUpdate({ status: 'sending'|'waiting'|'talking'|'passed'|'busy'|'error', reply, error, thread, since })
bridge.grade({ course, lecture, beat, title, prompt, answer, work, reference, source, onUpdate, signal })
  → Promise<{ verdict: 'correct'|'partial'|'incorrect'|null, feedback, error }>
bridge.help({ course, lecture, beat, title, prompt, work, source }) → Promise<{ ok, error }>
bridge.lastReplyAfter({ thread, since }) → Promise<{ done, reply, verdict, feedback, error } | null>   // optional
```

## Player and routes

`boot(course)` (src/app.js) routes on the hash:
`#/` home · `#/l/<lecture>` (resumes) · `#/l/<lecture>/<beat>` (also `/end`) · `#/bank` · `#/kit` (every viz demo and
interlude sample, in-memory store) · `#/audit[/<lecture>]` (dev layout audit, not linked; report in
`window.__audit`).

- Lecture page: `<article class="page">` → `<figure class="lx-figure">` with `h2.fig-title`, `.lx-screen` (stage,
  interlude, title or end card) and `.player` (`.caption`, `.count`); the tutor overlay reads these.
- Control bar `body > .tts-bar`: previous, play/pause, next, beat scrubber, speed, captions, sound, outline.
- Window events: dispatches `narration` `{ detail: { playing, gated } }`; pauses on `learn:pause-narration`.
- Saves `pos:` on every step; restores paused.

**Narration:** `audio/index.json` `{ voice, clips: { <clipKey>: seconds } }`, clip `audio/<clipKey(voice, say)>.mp3`.
A course with clips plays them, and uses timed captions for a step whose clip is missing (never a second voice).
Only a course without any clips uses the browser's speechSynthesis (falling back to timed captions). Sound off is
always timed captions.

## Scene player (src/scene-player.js)

`new Player(host, { frames, view: { height } })` draws the tutor's `show_scene` figures on a lectern stage; frames
are plain JSON (`{ caption, objects: [{ id, kind, … }] }`), each the complete picture. Format: the module header and
`docs/scene-player.md`. The tutor maps both subjects to it (`players` in its config).
