#!/bin/zsh
# Episódio do Recorte: tempo (legenda) -> quadros -> trilha bem baixa -> entrega.
# Uso: ./fazer.sh episodios/<slug> [trilha.mp3]   (sem trilha, sai só com a narração)
set -e
cd "${0:A:h}"
EP="${1:?passe a pasta do episódio}"; SLUG="${EP:t}"; TRILHA="$2"
python3 montar.py "$EP"
node ../../nucleo/2d/capturar.mjs motor/pagina.html "$EP"
TOTAL=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['total'])" "$EP/tempo.json")
if [ -n "$TRILHA" ]; then
  # trilha ~26 dB abaixo da voz, entra e sai em fade
  ffmpeg -loglevel error -y -i "$EP/$SLUG.mp4" -i "$TRILHA" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];[1:a]aresample=48000,volume=$(python3 ../../nucleo/2d/db.py "$EP" trilha -26)dB,afade=t=in:d=1.5,afade=t=out:st=$(( TOTAL - 3 )):d=3[m];[v][m]amix=inputs=2:normalize=0:duration=first[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "$EP/$SLUG-final.mp4"
else
  cp "$EP/$SLUG.mp4" "$EP/$SLUG-final.mp4"
fi
mkdir -p ../../prontos/recorte && cp "$EP/$SLUG-final.mp4" "../../prontos/recorte/$SLUG.mp4"
echo "pronto: prontos/recorte/$SLUG.mp4"
