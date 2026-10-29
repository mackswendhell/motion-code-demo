"""Monta o tempo.json de um episódio do Recorte a partir da narração pronta e das cenas.

Uso (de dentro de estilos/recorte): python3 montar.py episodios/<slug>
Lê audio/narracao.wav e cenas.json; transcreve a narração (faster-whisper) para a legenda palavra por palavra,
aplica as correções de grafia de cenas.json ("corrige": {"Cloud": "Claude"}) e grava tempo.json.
"""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

ep = Path(sys.argv[1])
cenas = json.loads((ep / "cenas.json").read_text())
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ep / "audio" / "narracao.wav"), "-ar", "16000", "-ac", "1", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32)
segs, _ = WhisperModel("small", compute_type="int8").transcribe(audio, language="pt", word_timestamps=True)
fix, palavras = cenas.get("corrige", {}), []
for w in (w for s in segs for w in s.words):
    p = w.word.strip()
    if p.startswith("%") and palavras:  # "26" + "%" viram "26%"
        palavras[-1]["p"] += p; palavras[-1]["f"] = round(w.end, 2); continue
    nu = p.strip(".,!?")
    palavras.append({"p": fix.get(nu, nu) + p[len(nu):], "t": round(w.start, 2), "f": round(w.end, 2)})
tempo = {"fps": cenas.get("fps", 30), "formato": cenas.get("formato", "16:9"), "total": round(len(audio) / 16000, 2), "atos": [],
         "base": f"../episodios/{ep.name}/", "camera": cenas["camera"], "cenas": cenas["cenas"], "palavras": palavras}
(ep / "tempo.json").write_text(json.dumps(tempo, ensure_ascii=False))
print(f"ok: {len(cenas['cenas'])} recortes, {len(palavras)} palavras, {tempo['total']}s")
