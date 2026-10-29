"""Linha do tempo + vozes do 003. Igual ao nucleo/2d/narrar.py, mas cada fala tem quem fala (o "elenco" do roteiro.json).

Fica no episódio para não mexer no núcleo. Cada ato dura `dura` ou o que as falas pedirem + `respiro`.
Uso (de dentro da pasta do estilo): python3 episodios/003-o-que-maria-guardava/falas.py [--ate N]
Saídas: audio/NN-K_<hash>.mp3 (cache), audio/narracao.wav (todas as vozes, com tom de sala), tempo.json
(cada fala com quem, t0, t1 e `boca`: o envelope da voz a 24 por segundo, para a boca do desenho).
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

PASTA = Path(__file__).resolve().parent
sys.path.insert(0, str(PASTA.parents[3]))
from nucleo import voz  # noqa: E402

MODELO = "fish-audio/drama-3"
SR = voz.SR


def eco(clip):  # sala grande para as falas do anjo; não mexe em altura nem velocidade
    r = np.random.default_rng(5)
    m = int(1.6 * SR)
    ir = r.normal(0, 1, m) * np.exp(-np.arange(m) / (SR * 0.35))
    ir[: int(0.02 * SR)] = 0
    n = len(clip) + m
    wet = np.fft.irfft(np.fft.rfft(clip, n) * np.fft.rfft(ir, n), n)
    wet *= np.abs(clip).max() / max(1e-6, np.abs(wet).max())
    return np.pad(clip, (0, m)) + 0.28 * wet


def boca(clip, fps):
    n = int(SR / fps)
    e = np.array([np.sqrt(np.mean(clip[i:i + n] ** 2)) for i in range(0, len(clip), n)])
    return [round(float(v), 2) for v in np.clip(e / max(1e-6, np.percentile(e, 95)), 0, 1)]


def main():
    ate = int(sys.argv[sys.argv.index("--ate") + 1]) if "--ate" in sys.argv else None
    r = json.loads((PASTA / "roteiro.json").read_text())
    fps, elenco = r.get("fps", 24), r["elenco"]
    audio = PASTA / "audio"
    audio.mkdir(exist_ok=True)

    t, tempo, clips = 0.0, {"fps": fps, "formato": r.get("formato", "16:9"), "atos": []}, []
    for i, a in enumerate(r["atos"][:ate]):
        cur, falas = t, []
        for k, f in enumerate(a.get("falas", [])):
            p = elenco[f["quem"]]
            texto = f"[{f.get('direcao') or p['direcao_base']}] {f.get('voz_texto', f['texto'])}"
            tag = hashlib.sha1(json.dumps([MODELO, p["voz"], texto]).encode()).hexdigest()[:10]
            destino = audio / f"{i:02d}-{k}_{tag}.mp3"
            if not destino.exists():
                print(f"  {f['quem']} {i:02d}-{k}: {f['texto']}")
                voz.falar(voz.corpo(MODELO, p, texto), destino)
            clip = voz.decode(destino)
            t0 = cur + f.get("em", 0.4)
            falas.append(dict(quem=f["quem"], t0=round(t0, 3), t1=round(t0 + len(clip) / SR, 3), texto=f["texto"], boca=boca(clip, fps)))
            clips.append((t0, eco(clip) if p.get("eco") else clip))
            cur = t0 + len(clip) / SR
        dura = max(a["dura"], cur - t + a.get("respiro", 0.9) if falas else 0)
        tempo["atos"].append(dict(cena=a["cena"], entrada=a.get("entrada"), t0=round(t, 3), t1=round(t + dura, 3), falas=falas))
        t += dura
    tempo["total"] = round(t, 3)
    (PASTA / "tempo.json").write_text(json.dumps(tempo, ensure_ascii=False, indent=1))

    mix = np.zeros(int(t * SR) + 2 * SR, dtype=np.float32)
    for t0, clip in clips:
        s = int(t0 * SR)
        mix[s:s + len(clip)] += clip
    mix *= 0.9 / max(1e-6, np.abs(mix).max())
    # tom de sala (~-76 dB) para nunca haver silêncio digital entre as falas
    sala = np.convolve(np.random.default_rng(1).normal(0, 1, len(mix)), np.ones(12) / 12, "same")
    mix += (sala / np.abs(sala).max() * 4e-4).astype(np.float32)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-t", f"{t:.3f}", str(audio / "narracao.wav")], input=mix.tobytes(), check=True)
    print(f"ok: {len(tempo['atos'])} atos, {t:.1f}s")


if __name__ == "__main__":
    main()
