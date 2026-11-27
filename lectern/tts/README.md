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
  with a hard g: espeak says "EYE-jen"). Both lists are below.
- Text is split at sentence boundaries into chunks of at most 400 characters (Kokoro truncates longer input).

## Pronunciation

Kokoro's English front end is espeak, which guesses names and rare words. What is fixed (American math usage):

| Word | espeak said | Now | How |
| --- | --- | --- | --- |
| eigen… | EYE-jen | EYE-gun | phoneme |
| letter A / variable a | "uh" (the article) | "ay" | LEX → `Eh`/`eh` where it can't be the article |
| Lagrange, Lagrangian | LAG-rainj, la-GRANG-ee-an | luh-GRAINJ, luh-GRAHN-jee-an | phoneme |
| Laplace | LAP-lace | luh-PLAHSS | phoneme |
| Leibniz | LAYB-nizz | LIBE-nits | phoneme |
| Cauchy(–Schwarz) | KAW-chee SHWORZ | koh-SHEE SHWORTS | phoneme |
| Fermat('s) | FER-mat | fair-MAH | phoneme |
| Bernoulli | BER-now-lee | ber-NOO-lee | phoneme |
| Dedekind | DED-ih-kind | DAY-duh-kind | phoneme |
| Fubini | fyoo-BEE-nee | foo-BEE-nee | phoneme |
| Clairaut('s) | CLAIR-out | clair-OH | phoneme |
| Pythagorean | PIE-thuh-gor-ee-an | pih-thag-uh-REE-an | phoneme |
| Archimedean | AR-kih-med-ee-an | ar-kih-MEE-dee-an | phoneme |
| Casorati | kass-or-AH-ree | kah-zor-AH-tee | phoneme |
| Bézout | BAY-zout | bay-ZOO | phoneme |
| Kronecker | KRONE-ker | KRONE-ecker | phoneme |
| Frenet, Fourier | FREN-it, FOR-ee-er | fruh-NAY, FOOR-ee-ay | phoneme |
| Heine, Weierstrass | HINE, WEER-strass | HINE-uh, VY-er-shtrahss | phoneme |
| Jacobian | jack-OH-bee-an | juh-KOH-bee-an | phoneme |
| Hasse | HASS | HAH-suh | LEX `Hahssa` |
| Goldbach | GOLD-bakh | GOLD-bahk | LEX `Goldbahk` |
| Schröder | SHRER-der | SHRAY-der | LEX `Shrayder` |
| Zermelo, Fraenkel, Peano | zer-MEE-lo, FREEN-kel, PEE-no | zer-MEL-oh, FRENK-el, pee-AH-no | LEX respelling |
| Möbius | MER-bee-us | MOH-bee-us | LEX `Mobius` |
| adjugate | uh-JOO-gate | AJ-uh-git | phoneme |
| cofactor, coprime | KAH-factor, KAH-prime | KOH-factor, koh-PRIME | phoneme |
| supremum, infimum (suprema, infima) | soo-PREM-um, in-FIM-um | soo-PREE-mum, IN-fih-mum | phoneme |
| (non)homogeneous | huh-MOJ-nee-us | hoh-muh-JEE-nee-us | phoneme |
| parallelepiped | PAIR-uh-lel-ih-piped | pair-uh-lel-uh-PIE-pid | phoneme |
| stochastic | stuh-CHASS-tic | stuh-KASS-tic | phoneme |
| corollary | kuh-RAH-ler-ee | KOR-uh-lair-ee | phoneme |
| paraboloid, hyperboloid | PAIR-uh-buh-loid, hy-per-BAH-loid | puh-RAB-uh-loid, hy-PER-buh-loid | phoneme |
| toroidal | TOR-oid-al | tor-OID-al | phoneme |
| parametrize, -ization, reparametrize, parameterize | PAIR-uh-meh-trize | puh-RAM-uh-trize | phoneme |
| extrema, extremum, extremal | ex-TREM-uh | ex-TREE-muh | phoneme |
| infinitesimal, differentiable, collinear, solenoidal | stress on the wrong syllable | in-fin-ih-TESS-, differ-EN-shuh-, koh-LIN-ee-er, so-luh-NOID- | phoneme |
| helices | HEL-ih-sez | HEL-ih-seez | LEX `helisees` |
| jth, kth, nth, mth, pth | J-T-H | jayth, kayth, enth | LEX |
| xi | "Roman eleven" | zye | LEX |
| sin, cos, arcsin, arccos, arctan | sin, koss, ARK-sin | sine, cosine, arc sine | LEX |
| du (in d u d v) | doo | d u | LEX |
| LU, IH, EVT | loo, eye, evt | L U, I H, E V T | LEX |

Checked and already right: Lay, Euclid(ean), Gram–Schmidt, Cramer, Markov, Cartesian, Hermitian, de Morgan, Zorn,
Pascal, Fibonacci, Cantor, Cohen, Russell, Venn, Bernstein, Gauss(–Jordan), Euler, Riemann, Stokes, Green, Hessian,
Thornton, Stewart, Taylor, Newton, Kepler, rho, theta, phi, nabla, del, curl, div, grad, quadric, ellipsoid, cycloid,
helix, torus, echelon, epsilon, codomain, preimage, injective/surjective/bijective, isomorphism, orthogonal,
orthonormal, eigen (fixed above), syllogism, modus ponens/tollens, mod, ell, perp.

Adding one: get espeak's phonemes for the word in a sentence
(`.venv/bin/python -c "from kokoro_onnx.tokenizer import Tokenizer; print(Tokenizer().phonemize('…', 'en-us'))"`),
try a respelling in `LEX` first and keep it if its phonemes are right, else add a `PHONEME_FIXES` row (trigger
regex on the text, the exact wrong phoneme substring, the right one; possessives can change the phonemes, so check
"Fermat's" too). Then re-record the clips whose text triggers it (`--redo`, which matches case-insensitively, so a
case-sensitive fix like the letter A needs the affected clips deleted by key instead).
