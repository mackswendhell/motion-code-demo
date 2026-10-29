"""Narração de um roteiro em Markdown na voz clonada do Macks. Uma faixa por parágrafo, mais a narração inteira.

Uso (de dentro de estilos/narracao): python3 narrar.py episodios/<slug> [--ate N]
Lê episodios/<slug>/roteiro.md (seções "## ...", parágrafos separados por linha em branco). Cache por parágrafo:
mudar um parágrafo só regera ele. Grava audio/NN_<hash>.wav, narracao.wav e faixas/NN-secao.wav.
"""

import hashlib
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from nucleo.voz import NUCLEO, corpo, falar  # noqa: E402

SR = 44100
# direção por parte do vídeo, medida no vídeo do OpenClaw (ver CLAUDE.md): a abertura é a aprovada (B7)
DIRECAO = {
    "abertura": "voz grave e assentada, convicto",
    "tutorial": "voz grave e assentada, explicando solto, como numa demonstração",
    "conclusao": "voz grave e assentada, calmo, fechando as frases para baixo",
}
PAUSA_PARAGRAFO, PAUSA_SECAO = 0.25, 0.35
# no vídeo editado do Macks nenhuma pausa passa de 0,6 s (mediana 0,24): silêncio maior que PAUSA_MAX vira PAUSA_CORTE
PAUSA_MAX, PAUSA_CORTE = 0.35, 0.28
# o TTS lê a grafia falada; o roteiro continua como está
FALA = [
    (r"CLAUDE\.md", "Claude ponto M D"), (r"/usage", "barra iúsage"), (r"/rewind", "barra riuáind"),
    (r"/clear", "barra clír"), (r"promptCacheTtl", "prompt cache T T L"), (r'"1h"', '"uma hora"'),
    (r"Opus 5\.5", "Opus cinco ponto cinco"), (r"Sonnet 5\.5", "Sonnet cinco ponto cinco"),
    (r"Ponytail 5", "Ponytail cinco"), (r"YAGNI", "iágni"), (r"Shift", "Xift"), (r"Esc\b", "Ésc"),
    (r'"plan mode on"', '"plan mode ón"'),
    # como o Macks fala (20/10/2026): "touken"; cache se diz como "cash" em inglês ("quéche", "quéxi" saíam "ket")
    (r"\btokens\b", "toukens"), (r"\btoken\b", "touken"), (r"\b[Cc]ache\b", "cash"),
]


def parte(secao):
    s = secao.lower()
    if s.startswith("abertura"):
        return "abertura"
    if s.startswith(("encerramento", "conclus")):
        return "conclusao"
    return "tutorial"


def falado(t):
    for a, b in FALA:
        t = re.sub(a, b, t)
    return t


def tom_de_sala(a, dur=0.25):
    """O fundo baixo que o Fish deixa nas pausas, para os espaços não virarem silêncio digital (buraco no editor)."""
    w = int(0.1 * SR)
    janelas = [a[i:i + w] for i in range(0, len(a) - w, w // 2)]
    pico = np.abs(a).max()
    db = [20 * np.log10(np.sqrt((x ** 2).mean()) / pico + 1e-12) for x in janelas]
    pausas = [x for x, d in zip(janelas, db) if -62 < d < -38]  # o fundo das pausas, sem fala e sem zero
    if pausas:
        base = sorted(pausas, key=lambda x: (x ** 2).mean())[len(pausas) // 2]
    else:  # sem pausa aproveitável: chiado rosado baixo, ~-52 dB do pico
        r = np.fft.irfft(np.fft.rfft(np.random.default_rng(1).normal(0, 1, w)) / np.sqrt(np.arange(w // 2 + 1) + 1), w)
        base = (r / np.sqrt((r ** 2).mean()) * pico * 10 ** (-52 / 20)).astype(np.float32)
    n, f = int(dur * SR), int(0.01 * SR)
    out = np.zeros(n, np.float32)
    rampa = np.linspace(0, 1, f)
    for i in range(0, n, w - f):  # cola pedaços do fundo com 10 ms de transição
        x = base.copy()
        x[:f] *= rampa
        x[-f:] *= rampa[::-1]
        out[i:i + w] += x[: n - i]
    return out


def tapar_zeros(a):
    """Trechos de zero absoluto dentro da fala recebem o mesmo fundo."""
    h = int(0.01 * SR)
    z = np.abs(a[: len(a) // h * h]).reshape(-1, h).max(1) < 1e-4
    tom = None
    i = 0
    while i < len(z):
        if z[i]:
            j = i
            while j < len(z) and z[j]:
                j += 1
            if j - i >= 3:
                tom = tom if tom is not None else tom_de_sala(a, 1.0)
                k = min((j - i) * h, len(tom))
                a[i * h:i * h + k] += tom[:k]
            i = j
        else:
            i += 1
    return a


def enxugar(a):
    """Corta o silêncio das pontas e encurta as pausas longas de dentro, como os cortes da edição dele."""
    h = int(0.01 * SR)
    rms = np.sqrt((a[: len(a) // h * h].reshape(-1, h) ** 2).mean(1))
    fala = 20 * np.log10(rms + 1e-9) > 20 * np.log10(rms.max() + 1e-9) - 40
    idx = np.flatnonzero(fala)
    if not len(idx):
        return a
    pedacos, i, borda = [], idx[0], int(0.06 / 0.01)
    inicio = max(0, i - borda)
    while i <= idx[-1]:
        if fala[i]:
            i += 1
            continue
        j = i
        while j < len(fala) and not fala[j]:
            j += 1
        if (j - i) * 0.01 > PAUSA_MAX:
            meio = int(PAUSA_CORTE / 0.01 / 2)
            pedacos.append(a[inicio * h:(i + meio) * h])
            inicio = j - meio
        i = j
    pedacos.append(a[inicio * h:min(len(a), (idx[-1] + 1 + borda) * h)])
    return np.concatenate(pedacos)


def main():
    ep = Path(sys.argv[1])
    ate = int(sys.argv[sys.argv.index("--ate") + 1]) if "--ate" in sys.argv else None
    cfg = json.loads((NUCLEO / "vozes.json").read_text())
    voz = cfg["personagens"]["macks"]
    blocos, secao = [], ""
    for bloco in re.split(r"\n\s*\n", (ep / "roteiro.md").read_text()):
        bloco = bloco.strip()
        if bloco.startswith("## "):
            secao = bloco[3:].strip()
        elif bloco and not bloco.startswith("#"):
            blocos.append((secao, " ".join(bloco.split())))
    blocos = blocos[:ate]
    (ep / "audio").mkdir(exist_ok=True)
    (ep / "faixas").mkdir(exist_ok=True)
    mix, anterior = [], None
    for i, (sec, texto) in enumerate(blocos, 1):
        entrada = f"[{DIRECAO[parte(sec)]}] {falado(texto)}"
        tag = hashlib.sha1(json.dumps([cfg["modelo"], voz, entrada]).encode()).hexdigest()[:10]
        wav = ep / "audio" / f"{i:02d}_{tag}.wav"
        if not wav.exists():
            print(f"  narrando {i:02d} ({sec}): {texto[:60]}...", flush=True)
            body = corpo(cfg["modelo"], voz, entrada)
            body["response_format"] = "pcm"  # sem compressão: o mp3 do Fish piora a voz clonada
            pcm = wav.with_suffix(".pcm")
            falar(body, pcm)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", str(pcm),
                            str(wav)], check=True)
            pcm.unlink()
        a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav), "-f", "f32le", "-"],
                                         capture_output=True, check=True).stdout, np.float32)
        a = tapar_zeros(enxugar(a).copy())
        nome = re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", sec.lower()).encode("ascii", "ignore").decode()).strip("-")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        str(ep / "faixas" / f"{i:02d}-{nome}.wav")], input=a.tobytes(), check=True)
        if anterior is not None:
            mix.append(tom_de_sala(a, PAUSA_SECAO if sec != anterior else PAUSA_PARAGRAFO))
        mix.append(a)
        anterior = sec
    total = np.concatenate(mix)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    str(ep / "narracao.wav")], input=total.tobytes(), check=True)
    print(f"ok: {len(blocos)} parágrafos, {len(total) / SR / 60:.1f} min -> {ep / 'narracao.wav'}")


main()
