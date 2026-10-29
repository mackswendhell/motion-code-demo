"""Linha do tempo das Histórias Reais: corta as falas originais (voz separada da trilha) e narra o final no Fish.

Uso (de dentro de estilos/historias-reais): python3 montar.py episodios/<slug>
Lê roteiro.json ("sequencia": falas com de/ate na fonte, cenas sem fala e o "final" narrado),
referencia/vozes.wav (Demucs) e referencia/transcricao.json (tempo de cada palavra, para a legenda).
Grava audio/narracao.wav (todas as vozes, 48 kHz) e tempo.json (segmentos, palavras e a abertura da boca quadro a quadro).
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ))
from nucleo import voz  # noqa: E402

SR = 48000
PAUSA = 0.12  # entre uma fala e a próxima, quando o roteiro não diz
AQUI = Path(__file__).resolve().parent


def ler(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def energia(x):
    """Energia em dB a cada 10 ms."""
    n = int(0.01 * SR)
    e = np.sqrt(np.mean(x[: len(x) // n * n].reshape(-1, n) ** 2, axis=1))
    return 20 * np.log10(e + 1e-9)


LIMIAR = -48  # dB: abaixo disso é o fundo entre as falas (o vazamento da música na faixa de voz fica em -62)
FOLGA = 0.1   # 3 quadros depois que a voz cai, para a palavra terminar inteira


def limites(env, de, ate, antes, depois):
    """Onde a voz começa e termina de verdade: o Whisper marca o fim da palavra cedo.
    Anda pela energia até ela ficar 80 ms abaixo do limiar, sem passar da palavra vizinha na fonte."""
    k = lambda s: int(s * 100)
    i0 = max(0, k(antes - 0.05), k(de - 0.12))
    i = i0 + int(np.argmin(env[i0:k(de) + 2]))  # o vale entre a palavra anterior e esta
    j, quieto = k(ate), 0
    while j < min(k(depois), k(ate + 0.8)) and quieto < 8:
        quieto = quieto + 1 if env[j] < LIMIAR else 0
        j += 1
    fim = (j - quieto) / 100
    return i / 100, min(depois, fim + FOLGA)


def boca(clip, fps):
    """Abertura da boca por quadro (0 a 1), pela energia da voz."""
    n = max(1, int(len(clip) / SR * fps))
    passo = len(clip) / n
    e = np.array([np.sqrt(np.mean(clip[int(k * passo):int((k + 1) * passo)] ** 2)) for k in range(n)])
    e = np.clip((20 * np.log10(e + 1e-6) + 45) / 30, 0, 1)
    return [round(float(v), 2) for v in e]


def main():
    pasta = Path(sys.argv[1])
    r = json.loads((pasta / "roteiro.json").read_text())
    fps = r.get("fps", 30)
    fonte = ler(AQUI / "referencia" / "vozes.wav")
    env = energia(fonte)
    palavras = [w for s in json.loads((AQUI / "referencia" / "transcricao.json").read_text()) for w in s["palavras"]]
    cfg = json.loads((voz.NUCLEO / "vozes.json").read_text())
    p = cfg["personagens"][r["voz"]]
    audio = pasta / "audio"
    audio.mkdir(exist_ok=True)

    t, segs, clips = 0.0, [], []
    for item in r["sequencia"]:
        t += item.get("pausa", PAUSA if segs else 0)
        if "quem" in item:
            antes = max([w[1] for w in palavras if w[1] <= item["de"] + 0.02], default=0)
            depois = min([w[0] for w in palavras if w[0] >= item["ate"] - 0.02], default=len(fonte) / SR) - 0.03
            ta, tb = limites(env, item["de"], item["ate"], antes, depois)
            a, b = int(ta * SR), int(tb * SR)
            clip = fonte[a:b].copy()
            f, g = int(0.012 * SR), int(0.03 * SR)
            clip[:f] *= np.linspace(0, 1, f)
            clip[-g:] *= np.linspace(1, 0, g) ** 2
            ini = a / SR
            ws = [[round(t + w[0] - ini, 3), round(t + w[1] - ini, 3), w[2].strip()] for w in palavras if item["de"] - 0.05 <= w[0] < item["ate"]]
            seg = dict(tipo="fala", quem=item["quem"], texto=item["texto"], plano=item.get("plano", "geral"), fundo=item.get("fundo", "muro"),
                       inserto=item.get("inserto"), lagrima=item.get("lagrima", False), musica=item.get("musica"),
                       t0=round(t, 3), t1=round(t + len(clip) / SR, 3), palavras=ws, boca=boca(clip, fps))
            if "em" in item:
                seg["inserto_em"] = round(t + item["em"] - ini, 3)
            clips.append((t, clip))
            t += len(clip) / SR
        elif item["cena"] == "final":
            frases, t0 = [], t
            for i, fr in enumerate(item["frases"]):
                t += fr.get("pausa", 0.45 if i else 0)
                texto = f"[{fr.get('direcao', p['direcao_base'])}] {fr.get('voz_texto', fr['texto'])}"
                tag = hashlib.sha1(json.dumps([cfg["modelo"], p, texto]).encode()).hexdigest()[:10]
                mp3 = audio / f"final{i:02d}_{tag}.mp3"
                if not mp3.exists():
                    print(f"  narrando: {fr['texto']}")
                    voz.falar(voz.corpo(cfg["modelo"], p, texto), mp3)
                clip = voz.decode(mp3)
                clip = np.interp(np.arange(int(len(clip) * SR / voz.SR)) * voz.SR / SR, np.arange(len(clip)), clip).astype(np.float32)
                clips.append((t, clip))
                frases.append(dict(texto=fr["texto"], ilustra=fr.get("ilustra"), escuro=fr.get("escuro", False),
                                   t0=round(t, 3), t1=round(t + len(clip) / SR, 3)))
                t += len(clip) / SR
            t += 1.0  # a última frase fica na tela
            segs.append(dict(tipo="final", musica=item.get("musica"), t0=round(t0, 3), t1=round(t, 3), frases=frases, aviso=r.get("aviso_ia")))
            continue
        else:
            seg = dict(tipo=item["cena"], textos=item.get("textos", []), musica=item.get("musica"), t0=round(t, 3), t1=round(t + item["dura"], 3))
            t += item["dura"]
        segs.append(seg)

    total = round(t, 3)
    mix = np.zeros(int(total * SR) + SR, np.float32)
    for t0, clip in clips:
        a = int(t0 * SR)
        mix[a:a + len(clip)] += clip[: len(mix) - a]
    mix = mix[: int(total * SR)]
    # fundo da própria fonte entre as falas: nunca zero digital
    quieto = fonte[int(4 * SR):int(9.5 * SR)]
    piso = np.resize(quieto, len(mix)) / (np.sqrt(np.mean(quieto ** 2)) + 1e-9) * 10 ** (-66 / 20)
    mix = mix + piso.astype(np.float32)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s16le",
                    str(audio / "narracao.wav")], input=mix.tobytes(), check=True)
    (pasta / "tempo.json").write_text(json.dumps(dict(fps=fps, formato=r.get("formato", "9:16"), total=total, segs=segs), ensure_ascii=False))
    print(f"ok: {len(segs)} segmentos, {total:.1f}s")


if __name__ == "__main__":
    main()
