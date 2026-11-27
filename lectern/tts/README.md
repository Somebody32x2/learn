# Narration (Kokoro-82M, offline)

`gen.mjs` records every narration line of the lectern subjects (`matrix/`, `foundations/`) with
[Kokoro](https://github.com/thewh1teagle/kokoro-onnx) and writes them next to the subject:

```
<subject>/audio/<clipKey>.mp3        one clip per `say` (scene step or interlude beat)
<subject>/audio/index.json           { "voice": "am_michael", "clips": { "<clipKey>": seconds, … } }
```

Voices: `matrix` uses `am_michael`, `foundations` `af_heart` (`voice` in each `course.js`); each course has about
2.4 hours of narration. The player plays a clip when `index.json` lists it; a step whose clip is missing gets timed
captions (never a second voice), and only a subject with no clips at all uses the browser's speech. Everything here
runs from the repo root; this folder is not deployed.

## Install (once, no root)

Needs Node 22+, `ffmpeg` and `ffprobe`. The generator expects a Python environment with `kokoro-onnx` at
`lectern/tts/.venv` and the model files at `lectern/tts/models/` (`kokoro-v1.0.int8.onnx`, `voices-v1.0.bin`).
Both are git-ignored. Reuse an existing Kokoro install:

```sh
ln -s /path/to/existing/.venv   lectern/tts/.venv
ln -s /path/to/existing/models  lectern/tts/models
```

or create them:

```sh
cd lectern/tts
UV_PYTHON_INSTALL_DIR=$HOME/.cache/uv-python uv venv -p 3.12 .venv
uv pip install -p .venv/bin/python kokoro-onnx soundfile numpy onnxruntime
mkdir -p models && cd models
for f in kokoro-v1.0.int8.onnx voices-v1.0.bin; do
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f
done
sha256sum kokoro-v1.0.int8.onnx voices-v1.0.bin   # compare with the checksums on the releases page
```

## Generate (from the repo root)

```sh
npm run tts -- --dry                       # per lecture: clips, missing, characters to synthesize
node lectern/tts/gen.mjs                   # every subject with a course.js
node lectern/tts/gen.mjs matrix            # only these subjects
node lectern/tts/gen.mjs --max 10          # stop after 10 clips (index.json is still written)
node lectern/tts/gen.mjs --jobs 3          # persistent Kokoro workers (default 2, ~740 MB RAM each)
KOKORO_THREADS=4 node lectern/tts/gen.mjs  # onnxruntime threads per worker (default max(2, cores / jobs))
node lectern/tts/gen.mjs --redo eigen      # re-record every clip whose say matches /eigen/i
```

Each worker (`kokoro_say.py`) loads the model once and takes one JSON job per line. WAVs are made in
`lectern/tts/.work/`, converted to mono 24 kHz 48 kbps MP3 and measured with `ffprobe`. `index.json` is rewritten
after every lecture, so an interrupted run keeps what it made. A lecture that fails to import is reported and skipped
(its subject's earlier `index.json` entries are kept that run).

## Hashing

A clip is named `clipKey(course.voice, say)` (`lectern/src/core/hash.js`, FNV-1a 64 over `VERSION|voice|say`); the
browser computes the same name. Consequences:

- Editing one step's `say` re-records only that step; unchanged lines are never synthesized again.
- Changing the course voice re-records the course.
- Pronunciation rules (below) are not part of the key. After changing them, re-record the affected clips with
  `--redo <regex>`, or bump `VERSION` in `hash.js` to re-record everything.
- Old clips nobody references stay on disk until deleted by hand; `index.json` lists only referenced clips that exist.

## Text

`speech.mjs` (pure ESM, also importable by the browser narrator) turns a `say` into speech:

- `$tex${words}` is read as `words`; a bare `$…$` is dropped with a warning (and fails the lecture tests).
- `<short pause>` 300 ms, `<pause>` 600 ms, `<long pause>` 900 ms of silence.
- `LEX` fixes math vocabulary Kokoro misreads (`RREF` → R-R-E-F, `R^n`/`Rⁿ` → R n, `iff`, `gcd`, `det`, `e.g.`,
  `i.e.`, `vs.`, …). Add a `[regex, replacement]` row to fix a mispronunciation that respelling can fix.
- `PHONEME_FIXES` in `kokoro_say.py` fixes the ones spelling can't reach, at the phoneme level (`eigen` is read
  with a hard g: espeak says "EYE-jen").
- Text is split at sentence boundaries into chunks of at most 400 characters (Kokoro truncates longer input).
