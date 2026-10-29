"""Linha do tempo + narração dos estilos 2D (Prancha Viva, Vila Acesa).

Cada ato dura `dura` segundos ou o que a narração dele pedir (fala + respiro), o que for maior.
Uso (de dentro da pasta do estilo): python3 ../../nucleo/2d/narrar.py episodios/<slug> [--ate N]
A voz é a do campo "voz" do roteiro.json (padrão: narrador).
Saídas em episodios/<slug>/: audio/NN_<hash>.mp3 (cache), audio/narracao.wav, tempo.json
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ))
from nucleo import voz  # noqa: E402  (voz do estúdio: chamada ao Fish e decodificação)

RESPIRO = 0.7  # depois da última palavra, antes da próxima passagem


def main():
    pasta = Path(sys.argv[1])
    ate = int(sys.argv[sys.argv.index("--ate") + 1]) if "--ate" in sys.argv else None
    r = json.loads((pasta / "roteiro.json").read_text())
    atos = r["atos"][:ate]
    respiro = r.get("respiro", RESPIRO)
    cfg = json.loads((voz.NUCLEO / "vozes.json").read_text())
    p = cfg["personagens"][r.get("voz", "narrador")]
    audio = pasta / "audio"
    audio.mkdir(exist_ok=True)

    t, tempo, clips = 0.0, {"fps": r.get("fps", 24), "formato": r.get("formato", "16:9"), "atos": []}, []
    for i, a in enumerate(atos):
        n = a.get("narracao")
        fala = None
        if n:
            texto = f"[{n.get('direcao') or p['direcao_base']}] {n.get('voz_texto', n['texto'])}"
            tag = hashlib.sha1(json.dumps([cfg["modelo"], p, texto]).encode()).hexdigest()[:10]
            destino = audio / f"{i:02d}_{tag}.mp3"
            if not destino.exists():
                print(f"  narrando {i:02d}: {n['texto']}")
                voz.falar(voz.corpo(cfg["modelo"], p, texto), destino)
            clip = voz.decode(destino)
            t0 = t + n.get("em", 0.4)
            clips.append((t0, clip))
            fala = dict(t0=round(t0, 3), t1=round(t0 + len(clip) / voz.SR, 3), texto=n["texto"])
        dura = max(a["dura"], (fala["t1"] - t + respiro) if fala else 0)
        tempo["atos"].append(dict(cena=a["cena"], entrada=a.get("entrada"), t0=round(t, 3), t1=round(t + dura, 3), fala=fala,
                                   **({"tela": a["tela"]} if "tela" in a else {})))  # dados da cena para motores que desenham a partir do roteiro (Aula)
        t += dura
    tempo["total"] = round(t, 3)
    (pasta / "tempo.json").write_text(json.dumps(tempo, ensure_ascii=False, indent=1))

    mix = np.random.default_rng(1).normal(0, 3e-4, int(t * voz.SR) + voz.SR).astype(np.float32)  # fundo baixíssimo: nunca silêncio digital entre as falas
    for t0, clip in clips:
        a = int(t0 * voz.SR)
        mix[a:a + len(clip)] += clip
    mix *= 0.9 / max(1e-6, np.abs(mix).max())
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(voz.SR), "-ac", "1", "-i", "-",
                    "-t", f"{t:.3f}", str(audio / "narracao.wav")], input=mix.tobytes(), check=True)
    print(f"ok: {len(atos)} atos, {t:.1f}s")


if __name__ == "__main__":
    main()
