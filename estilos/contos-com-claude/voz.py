"""Gera as falas do episódio dos Contos com Claude, mede cada uma e monta a trilha de voz.

Uso: python3 voz.py episodios/<slug>          (OpenRouter, chave em .env da raiz)
     python3 voz.py episodios/<slug> --teste  (vozes do macOS, sem custo)
     python3 voz.py episodios/<slug> --troca claude=claude-river  (usa uma voz de "alternativas")

Saídas em episodios/<slug>/audio/: NN_*.mp3 (cache por fala), falas.json (duração + boca), mix.wav
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from nucleo.voz import NUCLEO, SR, corpo, decode, falar  # noqa: E402
from roteiro import FPS, carregar  # noqa: E402

def envelope(clip):
    hop = SR // FPS
    rms = np.array([np.sqrt(np.mean(clip[i:i + hop] ** 2)) for i in range(0, len(clip), hop)])
    rms = rms / (np.percentile(rms, 95) + 1e-6)
    return np.clip(np.convolve(rms, [0.25, 0.5, 0.25], mode="same"), 0, 1)


def main():
    pasta, teste = sys.argv[1], "--teste" in sys.argv
    cfg = json.loads((NUCLEO / "vozes.json").read_text())
    if "--troca" in sys.argv:
        quem, alt = sys.argv[sys.argv.index("--troca") + 1].split("=")
        cfg["personagens"][quem] = cfg["alternativas"][alt]
    ep = carregar(pasta)
    audio = Path(ep.pasta) / "audio"
    audio.mkdir(exist_ok=True)

    falas, clips = {}, {}
    for i, f in enumerate(ep.falas_cfg):
        p = cfg["personagens"][f["quem"]]
        direcao = f.get("direcao") or p.get("direcao_base", "")
        fala = f.get("voz_texto", f["texto"])  # o TTS pode ler uma grafia diferente da legenda
        texto = f"[{direcao}] {fala}" if direcao else fala
        tag = hashlib.sha1(json.dumps([cfg["modelo"], p, texto, teste]).encode()).hexdigest()[:10]
        destino = audio / f"{i:02d}_{f['quem']}_{tag}.{'aiff' if teste else 'mp3'}"
        if not destino.exists():
            print(f"  gerando {i:02d} {f['quem']}: {f['texto']}")
            if teste:
                subprocess.run(["say", "-v", p["voz_teste"], "-o", str(destino), fala], check=True)
            else:
                falar(corpo(cfg["modelo"], p, texto), destino)
        clips[i] = decode(destino)
        if f.get("duracao"):  # alonga ou encurta para o tempo exato, sem mudar o tom
            fator = min(2.0, max(0.5, len(clips[i]) / SR / f["duracao"]))
            clips[i] = np.frombuffer(subprocess.run(
                ["ffmpeg", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                 "-af", f"atempo={fator:.4f}", "-f", "f32le", "-"],
                input=clips[i].tobytes(), capture_output=True, check=True).stdout, dtype=np.float32)
        falas[str(i)] = {"arquivo": destino.name, "dur": round(len(clips[i]) / SR, 3),
                         "boca": [round(float(x), 3) for x in envelope(clips[i])]}
    (audio / "falas.json").write_text(json.dumps(falas))

    ep = carregar(pasta)  # agora com a duração real de cada fala
    mix = np.zeros(int(ep.total * SR) + SR, dtype=np.float32)
    for f in ep.falas:
        a = int(f["t0"] * SR)
        mix[a:a + len(clips[f["i"]])] += clips[f["i"]]
    mix *= 0.9 / max(1e-6, np.abs(mix).max())
    mix *= ep.ganho_som(np.arange(len(mix)) / SR)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-t", f"{ep.total:.3f}", str(audio / "mix.wav")], input=mix.tobytes(), check=True)
    print(f"ok: {len(ep.falas)} falas, episódio com {ep.total:.1f}s")


if __name__ == "__main__":
    main()
