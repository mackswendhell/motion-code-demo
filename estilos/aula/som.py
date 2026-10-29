"""Efeitos da Aula, presos aos cortes e aos elementos que aparecem na tela.

Uso (de dentro de estilos/aula): python3 som.py episodios/<slug>
Lê tempo.json e eventos.json (escrito pelo capturar.mjs) e grava audio/efeitos.wav (48 kHz, mono), do tamanho do vídeo.
  chicote  ruído filtrado subindo e descendo, no corte entre atos
  sopro    o mesmo, mais baixo e lento (entrada "suave")
  estalo   bolha curta e grave, quando um destaque ou cartão aparece
  tique    clique seco, quando um item da lista é marcado
  subida   varredura aguda curta, na entrada de título e contador
"""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
pasta = Path(sys.argv[1])
tempo = json.loads((pasta / "tempo.json").read_text())
eventos = json.loads((pasta / "eventos.json").read_text())
mix = np.zeros(int(tempo["total"] * SR) + SR, dtype=np.float32)
rng = np.random.default_rng(5)


def banda(x, lo, hi):
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(np.fft.rfft(x) * ((f > lo) & (f < hi)), len(x))


def chicote(dura=0.45, ganho=0.5):
    n = int(dura * SR); t = np.arange(n) / n
    ruido = banda(rng.standard_normal(n), 300, 6000)
    return (ruido * np.sin(np.pi * t) ** 2 * ganho / (np.abs(ruido).max() + 1e-9)).astype(np.float32)


def estalo():
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 520 * np.exp(-t * 18) + 180
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.45).astype(np.float32)


def tique():
    n = int(0.04 * SR); t = np.arange(n) / SR
    return (banda(rng.standard_normal(n), 2000, 9000) * np.exp(-t * 160) * 0.25).astype(np.float32)


def subida():
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 400 + 1800 * (t / t[-1]) ** 2
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) * 0.12).astype(np.float32)


SONS = {"chicote": lambda: chicote(), "sopro": lambda: chicote(0.8, 0.22), "estalo": estalo, "tique": tique, "subida": subida}
for e in eventos:
    s = SONS[e["tipo"]]()
    a = int(max(0, e["t"] - (0.2 if e["tipo"] == "chicote" else 0)) * SR)  # o chicote cresce antes do corte
    mix[a:a + len(s)] += s[: len(mix) - a]
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                "-t", f"{tempo['total']:.3f}", str(pasta / "audio" / "efeitos.wav")], input=mix.tobytes(), check=True)
print(f"efeitos: {len(eventos)}")
