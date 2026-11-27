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

# (trigger on the text, phonemes espeak produces, phonemes to use instead)
PHONEME_FIXES = [
    (re.compile(r"eigen", re.I), "aɪdʒən", "aɪɡən"),  # eigenvalue: EYE-gun, not EYE-jen
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
