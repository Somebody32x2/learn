"""Kokoro worker for gen.mjs. Loads the model once, then reads one JSON job per stdin line:
  {"out": "/path.wav", "voice": "af_heart", "speed": 1.0, "lang": "en-us",
   "pieces": [{"text": "...", "pause": 300}, ...]}   pause = ms of silence after the piece
and answers each with one stdout line: {"ok": true, "out": ..., "dur": seconds} or {"ok": false, "error": ...}.
"""
import json
import os
import sys

import numpy as np
import onnxruntime as rt
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get("KOKORO_MODEL", os.path.join(HERE, "models", "kokoro-v1.0.int8.onnx"))
VOICES = os.path.join(HERE, "models", "voices-v1.0.bin")


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
                    samples, rate = kokoro.create(p["text"], voice=job["voice"], speed=job.get("speed", 1.0), lang=job.get("lang", "en-us"))
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
