#!/bin/zsh
# Episódio completo da Aula: narração -> quadros -> efeitos e trilha -> mixagem -> entrega.
# Uso: ./fazer.sh episodios/<slug> [--ate N]
set -e
cd "${0:A:h}"
EP="${1:?passe a pasta do episódio}"
SLUG="${EP:t}"
RAIZ="../.."
python3 ../../nucleo/2d/narrar.py "$EP" "${@:2}"
TOTAL=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['total'])" "$EP/tempo.json")
[ -f "$EP/audio/trilha.wav" ] || python3 "$RAIZ/nucleo/trilha.py" "$EP/audio/trilha.wav" --minutos 1 --estilo contos --seed 11
node ../../nucleo/2d/capturar.mjs motor/pagina.html "$EP"
python3 som.py "$EP"
# trilha bem baixa por baixo da voz, efeitos um pouco abaixo da voz; tudo some nos últimos 1,5 s
ffmpeg -loglevel error -y -i "$EP/$SLUG.mp4" -i "$EP/audio/trilha.wav" -i "$EP/audio/efeitos.wav" -filter_complex \
  "[0:a]aresample=48000,volume=$(python3 ../../nucleo/2d/db.py "$EP" voz 0)dB[v];[1:a]atrim=0:$TOTAL,volume=$(python3 ../../nucleo/2d/db.py "$EP" trilha -14)dB,afade=t=out:st=$(( TOTAL - 1.5 )):d=1.5[m];[2:a]volume=$(python3 ../../nucleo/2d/db.py "$EP" efeitos -6)dB[x];[v][m][x]amix=inputs=3:normalize=0:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "$EP/$SLUG-final.mp4"

[[ " $* " == *" --ate "* ]] && { echo "teste (não vai para prontos/): ${EP:A}/$SLUG-final.mp4"; exit 0; }
P="$RAIZ/prontos/aula/$SLUG"
mkdir -p "$P"
cp "$EP/$SLUG-final.mp4" "$P/$SLUG.mp4"
cp "$EP/audio/narracao.wav" "$EP/roteiro.json" "$P/"
echo "pronto: ${P:A}"
