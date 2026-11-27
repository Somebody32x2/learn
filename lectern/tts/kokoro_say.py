"""Kokoro worker for gen.mjs. Loads the model once, then reads one JSON job per stdin line:
  {"out": "/path.wav", "voice": "af_heart", "speed": 1.0, "lang": "en-us",
   "pieces": [{"text": "...", "pause": 300}, ...]}   pause = ms of silence after the piece
and answers each with one stdout line: {"ok": true, "out": ..., "dur": seconds} or {"ok": false, "error": ...}.

PHONEME_FIXES repairs words espeak phonemizes wrongly, at the phoneme level (spelling tricks in speech.mjs can't
reach a sound like the hard g of "eigen"). A clip's name doesn't depend on them: after adding one, re-record the
affected clips with `gen.mjs --redo <regex>`.
"""
import json
import os
import re
import sys

import numpy as np
import onnxruntime as rt
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get("KOKORO_MODEL", os.path.join(HERE, "models", "kokoro-v1.0.int8.onnx"))
VOICES = os.path.join(HERE, "models", "voices-v1.0.bin")

# (trigger on the text, phonemes espeak produces, phonemes to use instead), applied in order to a whole piece.
# Each `wrong` is what espeak says for that word in a sentence (possessives included); keep it specific enough that
# no other word of a triggered piece contains it. Respellings that phonemize right live in LEX (speech.mjs).
def _fix(trigger, wrong, right):
    return (re.compile(trigger), wrong, right)


PHONEME_FIXES = [
    _fix(r"(?i)eigen", "aɪdʒən", "aɪɡən"),  # eigenvalue: EYE-gun, not EYE-jen
    _fix(r"(?i)eigen-c", "aɪdʒəŋ", "aɪɡən"),  # eigen-coordinates (espeak assimilates the n)
    # Names
    _fix(r"\bLagrang", "lˈæɡɹeɪndʒ", "ləɡɹˈeɪndʒ"),  # Lagrange: luh-GRAINJ
    _fix(r"\bLagrangian", "læɡɹˈæŋɡiən", "ləɡɹˈɑːndʒiən"),
    _fix(r"\bLaplace", "lˈæpleɪs", "ləplˈɑːs"),
    _fix(r"\bLeibniz", "lˈeɪbnɪz", "lˈaɪbnɪts"),  # LIBE-nits
    _fix(r"\bCauchy", "kˈɔːtʃi", "koʊʃˈiː"),  # koh-SHEE
    _fix(r"\bSchwarz", "ʃwˈɔːɹz", "ʃwˈɔːɹts"),
    _fix(r"\bFermat", "fˈɜːmæts", "fɚmˈɑːz"),  # fair-MAH, possessive first
    _fix(r"\bFermat", "fˈɜːmæt", "fɚmˈɑː"),
    _fix(r"\bBernoulli", "bˈɜːnaʊli", "bɚnˈuːli"),
    _fix(r"\bDedekind", "dˈɛdɪkˌaɪnd", "dˈeɪdəkˌɪnd"),  # DAY-duh-kind
    _fix(r"\bFubini", "fjuːbˈiːn", "fuːbˈiːn"),  # foo-BEE-nee
    _fix(r"\bClairaut", "klˈɛɹaʊts", "klɛɹˈoʊz"),  # clair-OH
    _fix(r"\bClairaut", "klˈɛɹaʊt", "klɛɹˈoʊ"),
    _fix(r"\bPythagorean", "pˈaɪθɐɡˌɔːɹiən", "pɪθˌæɡəɹˈiːən"),  # pih-thag-uh-REE-un
    _fix(r"\bArchimedean", "ˈɑːɹkɪmˌɛdiən", "ˌɑːɹkɪmˈiːdiən"),  # ar-kih-MEE-dee-un
    _fix(r"\bCasorati", "kˌæsɔːɹˈɑːɾi", "kˌɑːzɔːɹˈɑːti"),
    _fix(r"\bB[ée]zout", "bˈeɪzaʊt", "beɪzˈuː"),
    _fix(r"\bKronecker", "kɹˈoʊŋkɚ", "kɹˈoʊnɛkɚ"),
    _fix(r"\bFrenet", "fɹˈɛnɪt", "fɹənˈeɪ"),
    _fix(r"\bFourier", "fˈɔːɹiɚ", "fˈʊɹieɪ"),
    _fix(r"\bHeine", "hˈaɪn", "hˈaɪnə"),
    _fix(r"\bWeierstrass", "wˈaɪɚstɹˌæs", "vˈaɪɚʃtɹˌɑːs"),
    _fix(r"\bJacobian", "dʒækˈoʊbiən", "dʒəkˈoʊbiən"),
    # Words
    _fix(r"(?i)\badjugate", "ɐdʒˈuːɡeɪt", "ˈædʒəɡət"),  # AJ-uh-git
    _fix(r"(?i)\bcofactor", "kˈɑːfæktɚ", "kˈoʊfæktɚ"),
    _fix(r"(?i)\bcoprime", "kˈɑːpɹaɪm", "koʊpɹˈaɪm"),
    _fix(r"(?i)\bsuprem", "suːpɹˈɛm", "suːpɹˈiːm"),  # supremum, suprema: soo-PREE-mum
    _fix(r"(?i)\binfim", "ɪnfˈɪm", "ˈɪnfɪm"),  # infimum: IN-fih-mum
    _fix(r"(?i)\binfima\b", "ɪnfˈiːmə", "ˈɪnfɪmə"),
    _fix(r"(?i)homogeneous", "həmˈoʊdʒniəs", "hˌoʊmədʒˈiːniəs"),  # hoh-muh-JEE-nee-us (not "homogenous")
    _fix(r"(?i)\bparallelepiped", "pˈæɹəlˌɛlɪpˌaɪpt", "pˌæɹəlˌɛləpˈaɪpɪd"),
    _fix(r"(?i)\bstochastic", "stətʃˈæstɪk", "stəkˈæstɪk"),
    _fix(r"(?i)\bcorollar", "kəɹˈɑːlɚɹ", "kˈɔːɹəlˌɛɹ"),  # corollary: American KOR-uh-lair-ee
    _fix(r"(?i)\bparaboloid", "pˈæɹəbˌɑːlɔɪd", "pəɹˈæbəlˌɔɪd"),  # puh-RAB-uh-loid
    _fix(r"(?i)\bhyperboloid", "hˌaɪpɚbˈɑːlɔɪd", "haɪpˈɜːbəlˌɔɪd"),  # hy-PER-buh-loid
    _fix(r"(?i)\btoroidal", "tˈɔːɹɔɪdəl", "tɔːɹˈɔɪdəl"),
    _fix(r"(?i)parametri[zs]", "pˈæɹəmˌɛtɹ", "pəɹˈæmətɹ"),  # parametrize(d): puh-RAM-uh-trize
    _fix(r"(?i)parametri[zs]", "pˌæɹəmˌɛtɹ", "pəɹˌæmətɹ"),  # parametrization
    _fix(r"(?i)parametri[zs]", "ɹᵻpˌæɹəmtɹ", "ɹiːpəɹˌæmətɹ"),  # reparametrization
    _fix(r"(?i)parametri[zs]", "ɹᵻpˈæɹəmtɹ", "ɹiːpəɹˈæmətɹ"),  # reparametrize
    _fix(r"(?i)parameteri[zs]", "pˌæɹəmˈɛɾɚɹ", "pəɹˈæmətɚɹ"),  # parameterize
    _fix(r"(?i)\bextrem(?:a|um|al)\b", "ɛkstɹˈɛm", "ɛkstɹˈiːm"),  # extrema, extremum: ex-TREE-muh
    _fix(r"(?i)infinitesimal", "ˈɪnfɪnətˌɛsɪməl", "ˌɪnfɪnᵻtˈɛsɪməl"),
    _fix(r"(?i)differentiable", "dˈɪfɚɹˌɛnʃɪəbəl", "dˌɪfɚɹˈɛnʃəbəl"),  # differ-EN-shuh-bul
    _fix(r"(?i)\bcollinear", "kˈɑːlɪnˌɪɹ", "koʊlˈɪniɚ"),
    _fix(r"(?i)\bsolenoidal", "sˈoʊlnɔɪdəl", "sˌoʊlənˈɔɪdəl"),
]


def synth(kokoro, text, voice, speed, lang):
    fixes = [f for f in PHONEME_FIXES if f[0].search(text)]
    if not fixes:
        return kokoro.create(text, voice=voice, speed=speed, lang=lang)
    phonemes = kokoro.tokenizer.phonemize(text, lang)
    for _, wrong, right in fixes:
        phonemes = phonemes.replace(wrong, right)
    return kokoro.create(phonemes, voice=voice, speed=speed, lang=lang, is_phonemes=True)


def main():
    so = rt.SessionOptions()
    so.intra_op_num_threads = int(os.environ.get("KOKORO_THREADS") or max(2, os.cpu_count() or 2))
    so.inter_op_num_threads = 1
    session = rt.InferenceSession(MODEL, sess_options=so, providers=["CPUExecutionProvider"])
    kokoro = Kokoro.from_session(session, VOICES)
    print(json.dumps({"ready": True, "voices": sorted(kokoro.get_voices())}), flush=True)
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            job = json.loads(line)
            parts, rate = [], 24000
            for p in job["pieces"]:
                if p["text"].strip():
                    samples, rate = synth(kokoro, p["text"], job["voice"], job.get("speed", 1.0), job.get("lang", "en-us"))
                    parts.append(samples.astype(np.float32))
                if p.get("pause"):
                    parts.append(np.zeros(int(rate * p["pause"] / 1000), dtype=np.float32))
            audio = np.concatenate(parts) if parts else np.zeros(rate // 10, dtype=np.float32)
            tmp = job["out"] + ".tmp.wav"
            sf.write(tmp, audio, rate)
            os.replace(tmp, job["out"])
            print(json.dumps({"ok": True, "out": job["out"], "dur": len(audio) / rate}), flush=True)
        except Exception as e:  # report and keep serving
            print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}), flush=True)


if __name__ == "__main__":
    main()
