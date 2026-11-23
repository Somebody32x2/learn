# Physics II, seen

A visual head start on **Physics II (WashU PHYS 1742)**: the whole semester at a high level, so the
lectures land on ideas you have already seen move. Every chapter animates the physics from a small
model, says in plain words what each equation relates, and ends with a checkpoint.

Part of [the lessons hub](../README.md): this folder is served at `<hub>/physics2/`.

## Chapters

| Group | Chapters |
|---|---|
| Start here | The big picture |
| Electric fields | Charge & Coulomb's law, The electric field, Gauss's law, Electric potential |
| Circuits | Capacitors, Current & resistance, DC circuits, RC circuits |
| Magnetism | Magnetic force, Where magnetic fields come from, Induction, Inductance & oscillations |
| Light & optics | Electromagnetic waves, Reflection, refraction & lenses, Interference, Diffraction |
| Quantum & nuclear | Photons, Atoms & matter waves, Nuclear physics |
| Reference | Equation sheet in words |

## Run it

Static files, no build, no dependencies. ES modules need http:// (not file://). From the repository root:

```sh
npm start     # http://localhost:5173/physics2/
npm test      # model tests (Node 22+)
```

`npm start` and `npm test` inside `physics2/` work too, for this subject alone.

## Layout

```
index.html, styles.css      shell and every style (physics colors: "physics figures" section)
src/main.js                 sidebar, hash router (#/chapter-id, #/toc/<group slug> contents), home page, pager
src/site.js                 title, hero text
src/lessons/index.js        chapter order, home hero figure, color legend
src/lessons/<id>.js         one chapter per file: prose, equation cards, figures, checkpoint
src/model/*.js              the physics, no DOM: fields, electric, circuits, magnetism, optics, quantum
src/core/phys-view.js       PhysView: draws a frame { draw(d, p, t), p, box, live }, tweens numeric params
src/core/draw.js            Draw: arrows, charges, field lines, circuit symbols, lenses, mini plots
src/ui/                     Player (stepper), checkpoint quizzes, figure/callout, sliders, equation cards
tests/*.test.js             node:test checks of the models (textbook values, limits, conservation laws)
tts/                        narration scripts, writing guide (WRITING.md) and clip generator (not deployed); audio/ holds the clips
```

## Extending

Add a chapter: write `src/lessons/<id>.js` exporting `{ id, title, group, blurb, quiz, render(root) }`,
put its physics in `src/model/`, and list it in `src/lessons/index.js`. A figure is a list of frames
for `PhysView`; frames sharing the same `draw` function glide between their numeric params, and
`live: true` frames animate with a clock. Quiz answers come from the model, never from memory.

## Narration (Listen)

Chapters with a script in `tts/script/<chapter id>.js` get a **Listen** button: AI narration (Gemini
3.8 Flash TTS, voices Achird and Charon, alternating by section) that highlights each paragraph and steps the
figures as it goes. The scripts are written to be heard: math is spoken ("E equals sigma over epsilon naught"),
and scripts carry no inline Gemini tags (it sometimes speaks them aloud); each block points at its page text with `at`.

While it plays: narration stops after the block that points at a checkpoint (`sel: '.quiz'`) and waits; the bar
and the quiz show **Continue** (solid once every question is answered), nothing resumes by itself. A small play
button in the left margin of each narrated paragraph, figure or quiz starts from there (shown on hover or focus; on
touch screens, faintly, while the bar is open). The block reached is kept per chapter in localStorage
`physics2.tts.pos` (this device only), so Listen offers **Resume** with the minutes left. Previous / next (bar,
media keys, lock screen, headphones) move 3 paragraphs, a stepped figure counting as one; pressed again at the
first or last paragraph they switch chapter and keep playing; at a checkpoint next skips it and play continues.
The page dispatches `narration` `{ playing, gated }` on `window` and pauses on `learn:pause-narration`.

```sh
node tts/gen.mjs --dry        # what is missing, no calls
node tts/gen.mjs              # record missing clips (needs ~/.config/gemini.key and ffmpeg), commit audio/
```

The site only plays committed files (`audio/<hash>.mp3` and `audio/<chapter>.json`); it never calls an API.
Clips are named by a hash of the whole request, so nothing is ever generated twice: re-runs skip existing
clips, and editing one section re-records only that section. One API call per section, because the free tier
allows 10 requests a day; `--max N` caps a run. See the comment at the top of `tts/gen.mjs`. Blocks without a
recording yet are read by the browser's own voice; a chapter is published (`audio/<id>.json`) only once all its clips
exist. Block starts within a section clip come from word timestamps when Vosk is set up (`tts/align.py`; see
`TTS_PY`/`VOSK_MODEL` in `tts/gen.mjs`), otherwise from pauses. To record a clip again (say, a defect you heard),
list its hash in `tts/rerecord.json`. `tests/narration.test.js` checks every `at` still exists. How to write a script: `tts/WRITING.md`.

## Serving and the hub

The hub's `Dockerfile` serves this folder (minus `tests/` and `tts/`) with nginx; `audio/*.mp3` clips are
cached for good, since their names are content hashes. `index.html` links the hub's `manifest.webmanifest`
and registers its `sw.js` (scope: the hub's folder), which caches the site as you use it so it works offline.
Served without the hub above it, those requests 404 and registration fails quietly.

## License

MIT
