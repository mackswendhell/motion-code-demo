"""Voz do estúdio, usada por todos os estilos: chave, chamada ao Fish Audio e decodificação.

Com FISH_API_KEY no .env, fala direto com a API do Fish (modelo FISH_MODEL, padrão s2.1-pro-free).
Com OPENROUTER_API_KEY, passa pelo OpenRouter (modelo do vozes.json).
O elenco mora em nucleo/vozes.json e as amostras de clone em nucleo/referencias/. A chave fica no .env da raiz.
"""

import base64
import json
import subprocess
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

import numpy as np

NUCLEO = Path(__file__).resolve().parent  # vozes.json e referencias/
RAIZ = NUCLEO.parent  # .env
SR = 24000


def env():
    arq = RAIZ / ".env"
    linhas = arq.read_text().splitlines() if arq.exists() else []
    return dict(l.split("=", 1) for l in linhas if "=" in l and not l.startswith("#"))


def chave():
    e = env()
    if e.get("FISH_API_KEY", "").strip():
        return "fish", e["FISH_API_KEY"].strip()
    if e.get("OPENROUTER_API_KEY", "").strip():
        return "openrouter", e["OPENROUTER_API_KEY"].strip()
    sys.exit("Chave não encontrada em .env. Rode ./configurar.sh na raiz do projeto.")


def pedir(url, dados, headers, quem, oque):
    req = urllib.request.Request(url, data=dados, headers=headers)
    for tentativa in range(3):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            erro = f"{e.code} {e.read().decode()[:300]}"
            if e.code < 500:
                break
    sys.exit(f"{quem} recusou {oque!r}: {erro}")


def clonar(p, k):
    """Cria (uma vez) a voz clonada na conta do Fish e guarda o id ao lado da amostra."""
    wav = NUCLEO / p["clone"]
    guardado = wav.with_suffix(".fish-id")
    if guardado.exists():
        return guardado.read_text().strip()
    b = uuid.uuid4().hex
    campos = {"type": "tts", "title": p.get("nome", wav.stem), "train_mode": "fast", "visibility": "private"}
    if p.get("clone_texto"):
        campos["texts"] = (NUCLEO / p["clone_texto"]).read_text().strip()
    partes = [f'--{b}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n'.encode() for n, v in campos.items()]
    partes.append(f'--{b}\r\nContent-Disposition: form-data; name="voices"; filename="{wav.name}"\r\n'
                  f'Content-Type: audio/wav\r\n\r\n'.encode() + wav.read_bytes() + f"\r\n--{b}--\r\n".encode())
    r = pedir("https://api.fish.audio/model", b"".join(partes),
              {"Authorization": f"Bearer {k}", "Content-Type": f"multipart/form-data; boundary={b}"}, "Fish", wav.name)
    id_ = json.loads(r)["_id"]
    guardado.write_text(id_)
    print(f"  voz clonada no Fish: {p.get('nome', wav.stem)} ({id_})")
    return id_


def falar(body, destino):
    via, k = chave()
    if via == "openrouter":
        r = pedir("https://openrouter.ai/api/v1/audio/speech", json.dumps(body).encode(),
                  {"Authorization": f"Bearer {k}", "Content-Type": "application/json"}, "OpenRouter", body["input"])
    else:
        p = body["_p"]
        fmt = body.get("response_format", "mp3")
        dados = {"text": body["input"], "reference_id": clonar(p, k) if p.get("clone") else p["voz"],
                 "format": fmt, "sample_rate": SR if fmt == "pcm" else 44100, "mp3_bitrate": 192}
        r = pedir("https://api.fish.audio/v1/tts", json.dumps(dados).encode(),
                  {"Authorization": f"Bearer {k}", "Content-Type": "application/json",
                   "model": env().get("FISH_MODEL", "").strip() or "s2.1-pro-free"}, "Fish", body["input"])
    destino.write_bytes(r)


def corpo(modelo, p, texto):
    body = {"model": modelo, "input": texto, "response_format": "mp3"}
    if chave()[0] == "fish":
        return {**body, "_p": p}  # o falar() monta o pedido do Fish a partir da voz
    if p.get("clone"):
        wav = base64.b64encode((NUCLEO / p["clone"]).read_bytes()).decode()
        body["input_references"] = [{"type": "input_audio", "input_audio": {"data": "data:audio/wav;base64," + wav}}]
        if p.get("clone_texto"):
            body["input_references"].append({"type": "text", "text": (NUCLEO / p["clone_texto"]).read_text()})
    else:
        body["voice"] = p["voz"]
    return body


def decode(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    clip = np.frombuffer(raw, dtype=np.float32)
    loud = np.flatnonzero(np.abs(clip) > 0.02)  # corta o silêncio das pontas, deixa 50 ms
    pad = int(0.05 * SR)
    return clip[max(0, loud[0] - pad): loud[-1] + pad] if len(loud) else clip
