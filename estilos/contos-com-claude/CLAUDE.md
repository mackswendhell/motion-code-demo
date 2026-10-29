# Contos com Claude

Diálogo curto e cômico entre um usuário comum e o Claude, numa madrugada, sobre uma situação que todo mundo que usa IA já viveu. Personagens low-poly em 3D (Blender + Python), pós-produção em Python. Formato: só 9:16 (`cena.py` renderiza 1080×1920). A história é o produto: o motor só executa o que o roteiro e o storyboard decidem.

Todos os comandos abaixo rodam **de dentro desta pasta** (`estilos/contos-com-claude/`).

## Estado dos episódios

Atualizar esta tabela sempre que um episódio mudar de etapa.

| Episódio | Etapa | Próximo passo |
|---|---|---|
| `000-so-mais-uma-funcao` | entregue (versão antiga do motor, antes do roteiro.json) | nenhum |
| `001-resume-pra-mim` | **entregue** (v2) | nenhum |
| `002-troca-pro-haiku` | **entregue** (v1, silêncio 3,2 s) | nenhum |
| `002-troca-pro-haiku-v2` | **entregue** (versão final, 19/10/2026) | nenhum |
| `003-so-mais-uma-funcao` | renderizado (51,2 s, refaz o piloto 000) | aprovação 3 (vídeo) |
| `004-testei-o-codex` | renderizado e entregue (37,0 s, primeiro com trilha, voz em −14 LUFS) | aprovação 3 (vídeo) |
| `005-so-um-resuminho` | renderizado e entregue (20,9 s; Claude na voz Myra: rodar sempre com `--troca claude=claude-myra`; Blender precisa de GPU, fora do sandbox) | aprovação 3 (vídeo) |

## Como um pedido vira vídeo

Três aprovações do Macks, cada uma protegendo um custo maior: texto (grátis), som (centavos), render (~35 min).

1. **Ideia.** O Macks traz uma dor, um tema ou nada. Sem tema, propor 3 dores do banco da skill.
2. **Roteiro + storyboard** com a skill `contador-de-historias` (guias de voz, cena e som em `references/`). Mostrar em tabela: fala, plano, movimento, ação, direção de voz, balão, sons, pausas, duração estimada.
   → **Aprovação 1: texto e cena.** Só então gravar `episodios/<NNN-slug>/roteiro.json`.
3. **Voz + sons.** `python3 voz.py <ep>` e `python3 sons.py <ep>`; tocar a prévia (voz + sons) para o Macks ouvir.
   → **Aprovação 2: ouvido.** Ajustar só as falas apontadas (`direcao`, `voz_texto`, `duracao`, pausas) e regerar; o cache refaz só o que mudou.
4. **Quadros-chave.** Renderizar 4 a 7 quadros (`blender -b -P cena.py -- --ep <ep> --list ...`) + pós (`python3 pos.py <ep> --still N saida.png`) e corrigir enquadramento, ação, balão e luz antes de seguir.
5. **Render completo:** `./fazer.sh <ep>` (voz, sons, render ~2 s/quadro, pós, entrega). A entrega vai para `../../prontos/contos-com-claude/<NNN-slug>/`: o MP4 (voz + sons + trilha), `voz.wav`, `sons.wav`, `audio-final.wav` e `storyboard.md`.
   → **Aprovação 3: vídeo.** Ajustes = editar o `roteiro.json` e rodar de novo; nunca recomeçar do zero.

Rascunho sem custo de voz: `./fazer.sh <ep> --teste` (vozes do macOS).
Prévia de áudio (voz + sons + trilha): rodar o bloco de mixagem do `fazer.sh` e tocar `afplay <ep>/audio/final.wav`.

## Elenco fixo

| Personagem | Visual | Voz | Atitude |
|---|---|---|---|
| **usuario** | menino low-poly, cabelo espetado, moletom azul | Fish "Guilherme" (`nucleo/vozes.json`) | cansado de madrugada mas com vida na voz, inseguro, se irrita fácil, é gente comum |
| **claude** | cubo laranja com olhos retangulares e quatro perninhas | 1ª: River (ElevenLabs) clonada no Fish (`nucleo/referencias/claude-river.wav`); 2ª: voz andrógina do Seed (`nucleo/referencias/claude.wav`), em `alternativas` | sereno, literal, seco, fala pouco; ora é o problema, ora é o mentor |

Trocar voz numa rodada: `python3 voz.py <ep> --troca claude=claude-seed`. Voz extra já pronta: a do Macks clonada (`usuario-macks` em `alternativas`).

## O motor

| Arquivo | Faz |
|---|---|
| `roteiro.py` | lê `roteiro.json`, monta a linha do tempo (planos, falas, boca) a partir da duração das falas |
| `cena.py` | cenário, personagens, luz e câmera no Blender; cada quadro é função do tempo |
| `voz.py` | gera e mede as falas (pelo `nucleo/voz.py`), monta a trilha de voz |
| `pos.py` | brilho, grão, vinheta, legenda, balões de mensagem, inserto da tela do chat, cartões, corte para preto ou fade |
| `sons.py` | sons discretos da cena (teclado, envio, resposta, bup, pop) em `audio/sons.wav` |
| `storyboard.py` | imprime a tabela do storyboard de um episódio (serve também para a aprovação 1) |

Planos: `aberto`, `dois`, `close_usuario`, `close_claude`, `claude_baixo`, `claude_camera`, `extremo_usuario`, `extremo_claude`, `tela`.
Movimento por plano: `suave` (padrão), `aproxima`, `afasta` (em plano longo recua mais), `parado`, `inclinado`. Luz por plano: `quente`, `fria`.
Cortes dentro de uma fala: `"cortes": [{"em": 0.5, "plano": "close_usuario"}]`. `"continua": true` na fala faz ela seguir no plano anterior, sem corte (um plano atravessando várias falas).
Por fala também: `balao` (mensagem pequena por cima do plano, sem pausar), `sons` (envio, resposta, pop), `voz_texto`, `duracao`, `pausa_antes`, `pausa_depois`, `cartoes` (cartões de app empilhando no alto, `[{"nome": "Notion", "em": 0.3}]`; lista vazia tira todos). Esquema completo em `~/.agents/skills/contador-de-historias/references/storyboard-json.md`; exemplo real em `episodios/001-resume-pra-mim/roteiro.json`.
Fim: `"final": {"segura": 0.9, "corte_preto": true}` ou, para sumir devagar, `"fade": 8.8` com `corte_preto: false` (imagem escurece e voz e sons descem juntos, por igual em dB).
Ações: usuário `duvida` (olha pra baixo com "?" na cabeça), `digita`, `aponta`, `agita_bracos`, `mao_no_rosto`, `orgulhoso`, `desanima`, `empolgado`, `olha_camera`, `encara_claude`, `pensa`, `encara_tela`; Claude `pulinho`, `desconfia`, `pisca_lento`, `olha_camera`, `suspira`, `inclina`.
Chapéu do Claude por fala, valendo dali em diante: `"chapeu": {"tipo": "peao" | "capitao", "texto": "HAIKU"}` (`null` tira). Inserto `tela` aceita `"topo": true` (menor, no alto, sem escurecer; vale em qualquer plano) e `"fotos": ["nome", ...]` (retratos de militar desenhados no `pos.py`); `movimento: aproxima` no plano `tela` dá zoom no inserto.
Plano ou ação nova = código novo em `cena.py` (dicionários `PLANOS`, `DEV_ACOES`, `CLAUDE_ACOES`).

## Regras de estilo

- Vertical 1080×1920, 30 fps, 25 a 50 s.
- Legenda branca, pequena, no terço superior, sem nome de quem fala. Caixa alta só para ênfase.
- Um corte por fala. Fim em corte seco para preto, sem tela de encerramento (ou fade, quando o fim é um ciclo que continua).
- Visual: noite azul, luz quente da tela, recorte laranja, foco raso com bokeh, grão de filme.
- **Trilha entra no MP4, discreta** (desde o 004, aprovado de ouvido em 21/10/2026): `nucleo/trilhas/contos.wav` ~20 dB abaixo das falas, abaixando mais quando alguém fala e sumindo nos 2 s finais. **Vozes altas, pico perto do 0**: falas + sons comprimidos e normalizados em −14 LUFS, limitador em −1 dB. O `fazer.sh` grava isso em `audio/final.wav`, que o `pos.py` usa no MP4; a trilha muda de volume no `volume=-10.5dB` do `fazer.sh`.
- Falas sem travessão. Texto de tela pode imitar vícios de IA de propósito (é a piada).

## Pastas

- `episodios/<NNN-slug>/`: a oficina: `roteiro.json` (a fonte), `audio/`, `frames/`, logs.

## Ambiente

- Blender 5.2 (`brew install --cask blender`, comando `blender`), ffmpeg, Python 3 com numpy e Pillow.
- Fontes do macOS: Avenir Next (legendas), Apple Color Emoji (balões), Hiragino (japonês).

## Pendências conhecidas

- Cenário "teclado" (personagens em miniatura sobre o notebook, tela real atrás) ainda não existe; hoje só `quarto-noite`.
- Voz por fala isolada perde um pouco da reação entre personagens; diálogo multi-voz numa chamada só é o próximo passo.
