#!/bin/zsh
# 004 completo: narração -> trilha -> desenho quadro a quadro -> mixagem -> entrega.
# Fica no episódio porque o motor é do episódio (o fazer.sh do estilo desenha o motor do 001).
# Uso (de dentro da pasta do estilo): ./episodios/004-como-nasce-a-chuva/fazer.sh
set -e
EP="${0:A:h}"
SLUG="${EP:t}"
cd "$EP/../.."
python3 ../../nucleo/2d/narrar.py "$EP"
TOTAL=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['total'])" "$EP/tempo.json")
[ -f "$EP/audio/trilha.wav" ] || python3 ../../nucleo/trilha.py "$EP/audio/trilha.wav" --minutos 0.5 --estilo contos --seed 3
node ../../nucleo/2d/capturar.mjs "$EP/pagina.html" "$EP"
# trilha ~17 dB abaixo da narração, sumindo nos últimos 2 s
ffmpeg -loglevel error -y -i "$EP/$SLUG.mp4" -i "$EP/audio/trilha.wav" -filter_complex \
  "[1:a]volume=$(python3 ../../nucleo/2d/db.py "$EP" trilha -10)dB,atrim=0:$TOTAL,afade=t=out:st=$(( TOTAL - 2 )):d=2,aresample=24000[m];[0:a]volume=$(python3 ../../nucleo/2d/db.py "$EP" voz 0)dB[v];[v][m]amix=inputs=2:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "$EP/$SLUG-final.mp4"

P="../../prontos/prancha-viva/$SLUG"
mkdir -p "$P"
cp "$EP/$SLUG-final.mp4" "$P/$SLUG.mp4"
cp "$EP/audio/narracao.wav" "$EP/audio/trilha.wav" "$EP/roteiro.json" "$P/"
echo "pronto: ${P:A}"
