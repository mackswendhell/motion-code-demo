"""Ponto seguro para abrir um vão na fala contínua (clipe que toca sozinho ou cartela de capítulo).

Uso:
    python tools/vaos.py "<master.mp4>" "<transcricao>/palavras.json" "A novidade que mais" "Então, compara com" ...

Cada frase é o começo da fala DEPOIS do vão. Para cada uma, imprime o ponto de corte (segundos do master)
no meio do maior silêncio real entre a palavra anterior e a frase. O Whisper erra as bordas das palavras e
há quedas de energia entre sílabas ("bo|tão"), então o ponto nunca fica antes do fim da palavra anterior
nem fora de um silêncio medido. A fala costuma vir emendada (20–40 ms entre frases): corte justo é o normal.
Sem silêncio nenhum ("colado"): o ponto vai para o trecho mais baixo depois do fim da palavra; ouça esse vão.
A fala é cortada exatamente no ponto (sem cauda): o silêncio é curto e uma cauda vazaria a frase seguinte.
"""

import json
import re
import subprocess
import sys

import numpy as np

SR = 16000
PASSO = 0.01  # 10 ms por quadro de energia
SILENCIO_MIN = 0.02
LIMIAR = 0.03  # silêncio = energia abaixo de 3% da mediana da fala


def energia(fonte):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", fonte, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, np.int16).astype(np.float32)
    n = int(SR * PASSO)
    a = a[: len(a) // n * n].reshape(-1, n)
    return np.sqrt((a**2).mean(axis=1))


def norm(s):
    return re.sub(r"[^\wà-ú]", "", s.lower())


def acha(palavras, frase):
    alvo = [norm(t) for t in frase.split()]
    ws = [norm(p["w"]) for p in palavras]
    for i in range(1, len(ws)):
        if ws[i : i + len(alvo)] == alvo:
            return i
    sys.exit(f"frase não encontrada no palavras.json: {frase!r}")


def silencios(rms, ini, fim, limiar):
    """Trechos [a, b) em segundos com energia abaixo do limiar, dentro de [ini, fim)."""
    i0, i1 = int(ini / PASSO), int(fim / PASSO)
    quieto = rms[i0:i1] < limiar
    runs, a = [], None
    for k, q in enumerate(list(quieto) + [False]):
        if q and a is None:
            a = k
        elif not q and a is not None:
            runs.append(((i0 + a) * PASSO, (i0 + k) * PASSO))
            a = None
    return runs


def ponto(rms, palavras, i, limiar):
    antes, depois = palavras[i - 1], palavras[i]
    # o Whisper erra as duas bordas (no 007 o "A" depois de "frente." veio 0,24 s adiantado): busca até o fim da primeira palavra
    fim = max(depois["e"], depois["s"] + 0.15)
    runs = [r for r in silencios(rms, antes["e"], fim, limiar) if r[1] - r[0] >= SILENCIO_MIN - 1e-6]
    if not runs:
        i0, i1 = int(antes["e"] / PASSO), int(fim / PASSO)
        return round((i0 + int(np.argmin(rms[i0:i1]))) * PASSO + PASSO / 2, 3), 0, antes, depois
    a, b = max(runs, key=lambda r: (r[1] - r[0], r[0]))
    return round((a + b) / 2, 3), b - a, antes, depois


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    rms = energia(sys.argv[1])
    palavras = json.load(open(sys.argv[2], encoding="utf-8"))
    limiar = LIMIAR * np.median(rms[rms > np.percentile(rms, 60)])
    for frase in sys.argv[3:]:
        i = acha(palavras, frase)
        p, dur, antes, depois = ponto(rms, palavras, i, limiar)
        folga = f"silêncio {dur * 1000:3.0f} ms" if dur else "colado       "
        print(f"{p:9.3f}  {folga}  {antes['w']!r} → {frase!r}")


if __name__ == "__main__":
    main()
