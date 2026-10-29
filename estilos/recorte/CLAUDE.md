# Recorte

Papel recortado à mão sobre fundo creme, nas cores do Claude. Cada informação é um cartão de borda irregular que cai na mesa, assenta com leve rotação e sai voando quando o assunto muda. Prints entram colados com fita coral, números contam até o valor, anotações em letra de mão se escrevem sozinhas e a legenda corre palavra por palavra num recorte escuro. Sem efeitos de transição: só a narração e, se quiser, uma trilha bem baixa. Desenho 2D em código (Canvas JS) sobre o `nucleo/2d/`.

Feito para **narração que já existe** (a sua voz gravada, ou uma narração do estilo Narração): o vídeo é montado por cima do áudio.

## Como pedir

"Monta um vídeo no estilo Recorte com a narração X (arquivo), com um print de Y." O Claude escuta a narração, escreve `cenas.json` (só dados) e roda `./fazer.sh episodios/<slug> [trilha.mp3]`.

## Episódio (`episodios/<slug>/`)

- `audio/narracao.wav`: a narração pronta.
- `cenas.json`: `camera` (trechos com zoom `z0`→`z1`), `corrige` (grafia da legenda, ex. `{"Cloud": "Claude"}`) e `cenas`, a lista de recortes. Cada recorte tem `id`, `tipo`, `x`, `y` (palco de 1920 × 1080), `t0` (entra), `t1` (sai; sem `t1` fica até o fim), `rot` (graus) e `esc`.
- Imagens (prints) ficam na pasta do episódio e entram pelo nome em `src`.

| Tipo | Campos |
|---|---|
| `cartao` | `texto`, `kicker`, `cor` (`claro`, `cream`, `coral`, `ink`), `px`, `w`, `h`, `fita` |
| `numero` | `valor`, `de` (conta a partir de), `antes`, `depois`, `rotulo`, `cor` |
| `print` | `src`, `recorte` [x, y, w, h] em pixels da imagem, `w` |
| `nota` | `texto` em letra de mão, `sublinha`, `escreve` (segundos) |
| `carimbo` | `texto` |
| `barra` | `titulo`, `fatia` (0 a 1), `rotulo` |
| `seta` | `comp` |

Regras da identidade: um cartão coral por momento, os outros em papel claro, cream ou ink; rotação leve (−2,5° a +2,5°); dado sempre grande; anotação curta, no máximo uma ou duas por tela. Entre um assunto e outro a mesa nunca fica vazia por mais de um segundo.

## Estado dos episódios

| Episódio | Etapa |
|---|---|
| `001-ponytail-5` | abertura do vídeo do Ponytail 5 (69 s, 16:9) montada sobre a narração na voz clonada do Macks; entregue (29/10/2026) |
