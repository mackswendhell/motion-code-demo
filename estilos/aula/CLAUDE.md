# Aula

Abertura de aula para canal sem rosto: fundo escuro com grade que corre devagar e um brilho laranja passeando, tipografia cinética, janela de app desenhada que a câmera percorre, lista que se marca, contador, legenda palavra por palavra e barra de progresso no topo. Cortes em chicote (entra da direita, borrada) com som, estalos nos destaques e trilha baixa. Feita para narração com a voz clonada de quem apresenta. Desenho 2D em código (Canvas JS) sobre o `nucleo/2d/`.

## Como pedir

Um tema e a voz. Ex.: "uma abertura de aula de 20 segundos sobre as novidades do Claude Code, com a minha voz". O Claude escreve o `roteiro.json` (só dados, nenhuma linha de código nova) e roda `./fazer.sh episodios/<slug>`.

## Roteiro (`episodios/<slug>/roteiro.json`)

`formato` (16:9; 9:16 e 1:1 a validar), `voz` (personagem do `nucleo/vozes.json`), `atos`. Cada ato: `cena`, `dura` (mínimo; cresce para caber a fala), `narracao` (`texto`, `direcao` entre colchetes para o Fish, `em`), `entrada` (padrão chicote; `suave` ou `flash`) e `tela`, os dados da cena:

| Cena | `tela` |
|---|---|
| `titulo` | `selo` (etiqueta acima), `texto`, `destaque` (trecho em laranja), `sub` |
| `frase` | `texto` (o que aparece, curto), `destaque` (lista de palavras com marca-texto; entram no instante em que são faladas) |
| `janela` | `titulo`, `lateral` (itens; recuo de dois espaços = subitem), `ativo`, `chat` (mensagens alternadas, a primeira é da pessoa), `cartoes` (`titulo`, `texto`, `barra` 0 a 1, `em`), `foco` (`lateral`, `chat` ou `cartoes`) e `focoEm` |
| `lista` | `titulo`, `itens`, `em`, `passo` (segundos entre itens) |
| `numero` | `valor`, `rotulo` |
| `fim` | como `titulo`, um pouco menor |

Em qualquer cena: `zoom` (quanto a câmera empurra ao longo do ato, padrão 1,05) e `zoomEm: [x, y, escala]` com `zoomT` (aproxima num ponto do palco de 1920 × 1080).

## Direção de voz

É o que separa uma aula que lê de uma aula que ensina. Uma direção por fala, escrita como para um ator: "animado, como quem conta uma novidade para um amigo", "mais baixo, quase segredo", "pausa curta antes da última palavra". Frases curtas, uma ideia por ato. Com voz clonada, pôr na `direcao_base` do elenco o jeito natural de quem gravou.

## Estado dos episódios

| Episódio | Etapa | Próximo passo |
|---|---|---|
| `000-teste` | teste do motor (29/10/2026): as seis cenas, 17 s, 16:9 | nenhum (só teste) |
