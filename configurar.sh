#!/bin/zsh
# Primeira vez: grava a chave do Fish Audio no .env (sem eco na tela) e instala o motor 2D.
# Uso: ./configurar.sh
set -e
cd "${0:A:h}"

if grep -q '^\(FISH\|OPENROUTER\)_API_KEY=.\+' .env 2>/dev/null; then
  read -q "?Já existe uma chave no .env. Trocar? (s/N) " || { echo; SEM_CHAVE=1; }
  echo
fi
if [ -z "$SEM_CHAVE" ]; then
  echo "Gere a chave em https://fish.audio/app/developers e cole aqui (não aparece na tela):"
  read -rs CHAVE; echo
  [ -n "$CHAVE" ] || { echo "Nenhuma chave colada."; exit 1; }
  print -r -- "FISH_API_KEY=$CHAVE" > .env
  chmod 600 .env
  echo "Chave gravada em .env (fica fora do git)."
fi

for p in python3 ffmpeg node; do command -v $p >/dev/null || echo "Falta instalar: $p (brew install ${p/python3/python})"; done
python3 -c "import numpy, PIL" 2>/dev/null || echo "Falta: pip3 install numpy pillow"
[ -d "/Applications/Google Chrome.app" ] || echo "Falta o Google Chrome (estilos 2D)"
command -v blender >/dev/null || echo "Opcional: Blender, só para Contos com Claude e Lofi"
command -v node >/dev/null && (cd nucleo/2d && npm install --silent) && echo "Motor 2D instalado."
echo "Pronto. Abra a pasta no Claude Code e peça um vídeo."
