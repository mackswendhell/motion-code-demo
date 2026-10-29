# Motion Code

> Nome do estúdio a partir de 20/10/2026. A pasta se chama `~/dev/motion-code` (antes `~/dev/Histórias`). A skill `contador-de-historias` e a memória do Claude Code já apontam para o nome novo.

Estúdio de vídeos animados feitos 100% em código, com voz por IA (Fish Audio, direto pela API ou via OpenRouter). Nada de editor de vídeo, nada de banco de imagens. A história é o produto; o motor só executa o que o roteiro decide.

Este arquivo só cuida do estúdio: o que é comum e como tudo se organiza. Cada estilo tem o seu `CLAUDE.md`, com tudo o que é dele.

## Começo de cada sessão

Antes de tudo, conferir se o `.env` da raiz tem `FISH_API_KEY=` (ou `OPENROUTER_API_KEY=`) preenchida, sem imprimir o valor: `grep -q '^\(FISH\|OPENROUTER\)_API_KEY=.' .env`. Se não tiver, parar e pedir para a pessoa rodar `./configurar.sh` no terminal (cola a chave, Enter; gerar em https://fish.audio/app/developers). Nunca pedir a chave no chat.

Dois termos, sempre separados:
- **Estilo** é a linha editorial completa: estrutura narrativa, visual, motor, voz, música e instruções. Cada estilo é uma pasta em `estilos/`.
- **Formato** é só a proporção do vídeo: **9:16**, **1:1** ou **16:9**. Não tem pasta: vai no `roteiro.json` de cada episódio (`"formato": "16:9"`) e, quando o mesmo episódio sai noutra proporção, no sufixo da entrega (`-9x16`, `-1x1`).

Se o Macks não disser no pedido, perguntar com **AskUserQuestion** (uma chamada, duas perguntas): qual **estilo** (da tabela abaixo) e qual **formato**. Depois entrar na pasta do estilo e seguir o `CLAUDE.md` de lá.
- O AskUserQuestion aceita **no máximo 4 opções** por pergunta e a tabela tem mais estilos que isso. Nas opções vão os 4 estilos com episódio mais recente (pela coluna "Estado"); os outros vão citados pelo nome no texto da pergunta, para escolher em "Outro" (ex.: "...ou Lofi / Narração em Outro"). Nunca deixar um estilo da tabela de fora da pergunta.
- Formato: 9:16, 16:9 e 1:1 nas opções. Se o estilo escolhido não aceitar o formato (coluna "Formatos"), avisar e perguntar de novo. Na Narração (só áudio) o formato não se aplica e a resposta é ignorada.

## Estilos

| Estilo | O que é | Formatos | Pasta | Estado |
|---|---|---|---|---|
| **Contos com Claude** | diálogo cômico usuário × Claude, low-poly 3D no Blender | só 9:16 | `estilos/contos-com-claude/` | 4 entregues (000 a 002-v2); o 003 e o 004 (Testei o Codex) aguardam aprovação do vídeo |
| **Prancha Viva** | ciclo educativo ilustrado em 2D (Canvas JS), com narrador de documentário | 16:9, 1:1 e 9:16 (motor validado e aprovado nos três) | `estilos/prancha-viva/` | 001 entregue e aprovado; 003 (O que Maria guardava, 6 min) entregue, aguardando ver; falta a skill |
| **Vila Acesa** | cidade em corte de livro ilustrado, ajudante luminoso em cada cômodo, narradora contadora de histórias | 16:9, 1:1 e 9:16 | `estilos/vila-acesa/` | 001 entregue em 16:9 e 9:16 (estilo aprovado); falta a skill |
| **Narração** | narração dos vídeos do canal do Macks na voz clonada dele (só áudio) | não se aplica | `estilos/narracao/` | voz aprovada; 001 (Ponytail 5) entregue, aguardando ouvir tutorial e conclusão |
| **Rabisco** | caneta preta e giz de cera que se desenham na tela, narrador em primeira pessoa (o Claude), legenda manuscrita | 9:16, 1:1 e 16:9 | `estilos/rabisco/` | 001 (A lista) entregue em 9:16 (aprovado) e 16:9; falta o 1:1 e a skill |
| **Higgsfield** | ativos da Higgsfield animados em código; variações `prancha` (pintura) e `motion-pro` (produto 3D) | 16:9 (prova); 9:16 e 1:1 a validar | `estilos/higgsfield/` | estilo aprovado; 001 aprovado em 16:9, falta entregar e fazer 9:16 e 1:1; 002 (picape) com prova de 12 s renderizada e verificada, aguardando avaliação |
| **Excel Desenhado** | planilha desenhada à mão como palco de motion graphics: cursor clica, digita, arrasta, cria gráficos em aquarela e rabisca; câmera e sons (clique, tecla) saem do roteiro de ações | 16:9 (9:16 e 1:1 a testar) | `estilos/excel-desenhado/` | estilo aprovado na amostra de 10 s (000); falta o primeiro vídeo de verdade e testar 9:16 e 1:1 |
| **Histórias Reais** | vídeo real de depoimentos recontado em desenho de livro infantil em código, com as vozes originais (separadas da trilha) e trilha emocional em código | o do vídeo de origem (001: 9:16) | `estilos/historias-reais/` | 001 (Nordeste) renderizado em teste, aguardando o Macks ver |
| **Fantasia** | lenda de fantasia em ilustração vetorial chapada com grão, raios de luz, névoa e profundidade de campo (paralaxe + desfoque), narradora de voz antiga e serena, trilha de lenda em código | 9:16, 1:1 e 16:9 | `estilos/fantasia/` | estilo aprovado; 001 (O Anel) entregue e aprovado em 9:16, 1:1 e 16:9 (65,8 s); skill `contador-de-lendas` |
| **Editor 3D** (provisório) | o Claude em 3D pulando dentro de um editor de vídeo que vira objeto físico (o RecMove), cada elemento da interface ganha vida e som quando ele pisa | só 16:9 | `estilos/editor-3d/` | ambiente preparado (referência analisada, print medido); 001 ainda não começou |
| **Aula** | abertura de aula para canal sem rosto: tipografia cinética, janela de app, lista, contador, legenda palavra por palavra, cortes em chicote com som; feita para voz clonada | 16:9 (9:16 e 1:1 a validar) | `estilos/aula/` | motor pronto (000-teste, 29/10/2026) |
| **Lofi** | cena 3D aconchegante em loop, sem fala, trilha lofi em código (textura do vídeo do piano, Blender) | só 16:9 | `estilos/lofi/` | 4 entregues e aprovados (001 a 004); falta a skill |

O estado detalhado de cada episódio fica na tabela do `CLAUDE.md` do estilo. Ao mudar um episódio de etapa, atualizar lá e, se mudar o resumo, a coluna "Estado" acima.

## Organização

A raiz tem sempre as mesmas cinco coisas, não importa quantos estilos existam:

```
motion-code/
  CLAUDE.md          este arquivo: o estúdio
  .env               FISH_API_KEY ou OPENROUTER_API_KEY (nunca imprimir, nunca commitar)
  nucleo/            o que mais de um estilo usa
    voz.py           chave, chamada ao Fish (direto ou pelo OpenRouter), decodificação
    vozes.json       o elenco de todas as vozes de todos os estilos
    referencias/     amostras de voz para clonagem (River, Seed, Macks)
    trilha.py        gerador de música de fundo (estilos noite, contos, vila)
    lofi.py          gerador de faixas lofi em loop exato (estudo, piano, madrugada)
    trilhas/         músicas de fundo prontas
    2d/              motor comum dos estilos 2D: base.js (desenho e papel), capturar.mjs (Chrome headless; grava também `eventos.json` se o estilo exportar `eventos()`), narrar.py (atos + narração), node_modules
      estudio/       painel Motion: player com linha do tempo e tweaks, aberto no browser pane do Claude Desktop
  estilos/
    <estilo>/        tudo do estilo: CLAUDE.md, motor, fazer.sh, episodios/<NNN-slug>/ (a oficina)
  prontos/
    <estilo>/<NNN-slug>/   as entregas: só o que o Macks usa (vídeo em cada formato, faixas separadas, roteiro ou storyboard)
```

Regras:
- **Um estilo = uma pasta em `estilos/`**, completa: estrutura narrativa, visual, motor, `fazer.sh`, episódios e `CLAUDE.md` próprios. Nada específico de um estilo fica fora da pasta dele.
- **`nucleo/` guarda só o que mais de um estilo usa.** Algo de um estilo que passa a servir a outro sobe para `nucleo/`; o que só um usa fica no estilo. Nunca copiar o núcleo para dentro de um estilo (as cópias divergem).
- **Vozes e músicas novas** entram em `nucleo/vozes.json` e `nucleo/trilhas/` (e um estilo novo de música em `nucleo/trilha.py`), para qualquer estilo poder reaproveitar.
- **Episódios numerados por estilo** (`001`, `002`...), dentro de `estilos/<estilo>/episodios/`.
- **Entregas em `prontos/<estilo>/<NNN-slug>/`**. O `fazer.sh` de cada estilo entrega ali; testes (`--ate N`) não vão para `prontos/`.
- **Comandos rodam de dentro da pasta do estilo** (`cd estilos/<estilo> && ./fazer.sh episodios/<slug>`). Os scripts acham o núcleo por caminho relativo (`../../nucleo/`).
- Cada estilo tem sua skill de roteiro: Contos com Claude usa `contador-de-historias`; Fantasia usa `contador-de-lendas`; Prancha Viva, Vila Acesa e Rabisco ainda não têm (o fluxo vive no `CLAUDE.md` de cada um).

### Estilo novo, passo a passo

1. Criar `estilos/<nome>/` com `CLAUDE.md`: o que é, referência analisada, decisões (formatos aceitos, voz, música), direção de cena, estrutura do roteiro, motor, estado dos episódios.
2. Se for 2D em Canvas, partir do `nucleo/2d/`: `motor/pagina.html` carrega `../../../nucleo/2d/base.js` e o `cena.js` do estilo; o `fazer.sh` chama `../../nucleo/2d/narrar.py` e `../../nucleo/2d/capturar.mjs` (copiar o `fazer.sh` da Vila Acesa e trocar estilo, música e volume; ou o do Rabisco, se o som tiver de seguir a história e o desenho em vez de uma trilha em loop). Se for outro motor, ele fica dentro da pasta do estilo. Para aparecer no painel Motion basta o contrato `iniciar(tempo)` + `quadro(t)` no canvas `#c`; cada número que valer ajustar ao vivo vira `* tw("chave")` no motor (ver Painel Motion abaixo).
3. Voz nova em `nucleo/vozes.json` (`personagens`), escolhida de ouvido entre amostras; o `roteiro.json` diz qual usar (`"voz"`).
4. Registrar na tabela "Estilos" acima e criar `prontos/<nome>/` na primeira entrega.
5. Quando o fluxo de roteiro amadurecer, uma skill própria.

## Núcleo comum (`nucleo/`)

- `voz.py`: `falar()`, `corpo()` (voz da biblioteca ou clone), `decode()` (corta o silêncio das pontas), `SR`, `NUCLEO` (esta pasta) e `RAIZ` (a raiz, onde fica o `.env`). Os estilos importam com a raiz no `sys.path`: `from nucleo import voz` ou `from nucleo.voz import ...`.
  - Todas as vozes são do Fish Audio. Com `FISH_API_KEY`, o `falar()` chama `api.fish.audio/v1/tts` com o modelo `FISH_MODEL` do `.env` (padrão `s2.1-pro-free`, grátis); com `OPENROUTER_API_KEY`, vai pelo OpenRouter com o `modelo` do `vozes.json`. Clone no Fish direto: clonagem instantânea, a amostra e a transcrição vão junto em cada pedido (MessagePack, `msgpack()` no próprio `voz.py`), grátis no `s2.1-pro-free`. Criar voz fixa na conta pela API (`POST /model`) exige crédito na API, por isso não é usado.
- `vozes.json`: modelo `fish-audio/drama-3`; `personagens` (usuario, claude, narrador, narradora, macks) e `alternativas` (claude-seed, usuario-macks). Cada voz tem `voz` (id da biblioteca do Fish) ou `clone`/`clone_texto` (amostra em `nucleo/referencias/`) e uma `direcao_base`.
- `trilha.py`: `python3 ../../nucleo/trilha.py saida.wav --minutos 1.2 --estilo contos|noite|vila --seed 3`.
- `lofi.py`: `python3 ../../nucleo/lofi.py saida.wav --faixa estudo|piano|madrugada [--voltas 2]`. Grava UM loop de N compassos que emenda sem corte (tudo circular); `--voltas 2` para ouvir a emenda. Separado do `trilha.py` porque o contrato é outro: duração presa a compassos e bateria.
- `2d/`: `narrar.py` (linha do tempo por atos e narração, com cache por ato; `--ate N`), `capturar.mjs` (captura quadro a quadro no Chrome headless; `--still t1,t2 pasta` para quadros soltos; se a página definir `eventos()`, grava `eventos.json` na pasta do episódio, para o som sincronizado ao desenho), `base.js` (rng, ease, tremido, tracar, tinta, hachura, aquarela, grão e manchas do papel).
- **Painel Motion** (`2d/estudio/`): `servidor.mjs` (só 127.0.0.1, porta 4317) + `index.html`. Abrir: `preview_start` com o nome `motion` (`.claude/launch.json`); um episódio direto: `http://localhost:4317/?ep=<estilo>/<slug>`. O mod `motion` faz isso no `/motion` e depois de cada `fazer.sh`; quando o Macks pedir "abre o painel" em texto, abrir do mesmo jeito.
  - Tweaks ficam em `episodios/<slug>/tweaks.json`, só o que mudou. Visuais são multiplicadores (1 = aprovado) que o `capturar.mjs` põe em `window.TWEAKS` antes do `iniciar`, e o motor lê com `tw("chave")` (`base.js`: `grao`, `mancha`, `vinheta`, `tremido`, `traco`; Vila: `zoom` da câmera toda e `detalhe`, a aproximação durante a fala). Áudio é deslocamento em dB sobre a mixagem do estilo (`voz`, `trilha`, `efeitos`), lido no `fazer.sh` por `db.py`.
  - Tweak novo: ler `tw("chave")` no motor e pôr a chave em `VISUAL` e `POR_ESTILO` no `index.html`. Estilos em Blender só tocam o mp4.

## Regras de áudio (todos os estilos)

Aprendidas na Narração em 20/10/2026, valem para qualquer voz do Fish:
- **Nunca silêncio digital** (zero absoluto) num áudio entregue: no editor do Macks aparece como buraco, linha reta. Espaço entre falas, parágrafos ou atos se preenche com o fundo baixo das pausas do próprio Fish (ver `tom_de_sala` em `estilos/narracao/narrar.py`); o mesmo para trechos de zero que o Fish deixe no meio da fala.
- **Conferir de olho antes de entregar**: desenhar a forma de onda com os sons baixos realçados e procurar linha reta: `ffmpeg -ss 60 -t 10 -i audio.wav -filter_complex "compand=attacks=0:points=-90/-90|-60/-30|-30/-12|0/0,showwavespic=s=1400x300" -frames:v 1 onda.png` e ler a imagem. Contar também trechos de 50 ms ou mais com pico abaixo de 1e-4 (tem de dar zero).
- **Pedir PCM ao Fish** (`response_format: "pcm"`, 16 bits, 44,1 kHz mono) quando a voz for clone: o mp3 de 128 kbps piora a voz. O OpenRouter só aceita `mp3` ou `pcm`.
- **Não mexer em altura nem velocidade da voz depois** (`atempo`, `asetrate`): distorce. Volume e silêncio podem.
- **Sotaque brasileiro**: voz do Fish de modelo estrangeiro (Galadriel, Athena e outras em inglês) pode falar português puxando para Portugal. A `direcao_base` leva "sotaque brasileiro, pronúncia do Brasil, nunca de Portugal" e o texto usa a forma falada no Brasil ("Essa é", não "Esta é"; fugir de ênclise como "desfazê-lo", "soltá-lo"). O transcritor não distingue sotaque: só o Macks, de ouvido, num trecho curto antes do vídeo inteiro (aprendido na Fantasia, 21/10/2026).
- **Pronúncia** se acerta na grafia que vai para o TTS (lista `FALA` no `narrar.py` da Narração), nunca no texto do roteiro. Termo em inglês: usar a grafia inglesa que soa igual (cache → "cash"), nunca inventar grafia aportuguesada ("quéche" saiu "ket"). Conferir toda ocorrência com o transcritor (faster-whisper) e refazer a tomada que errar, em vez de ouvir só um exemplo.
- **Vídeo de referência**: para ver quadros e transcrição de um vídeo, a skill `/watch` (`~/.agents/skills/watch-plugin`) serve; para voz (altura, energia, pausas, respiração) a análise acústica com ffmpeg + numpy vai mais fundo.

## Antes de tornar o projeto público (git)

Publicado em 29/10/2026 (github.com/mackswendhell/motion-code). O `.gitignore` deixa fora chave, clones, referências, `prontos/` e toda mídia; a vitrine do README fica em `docs/vitrine/` (GIF mudo, um por estilo). Antes de cada push, refazer esta checagem.
- **A chave só pode sair por git.** O `.env` está no `.gitignore`, mas isso só vale para `git push`; zip, upload arrastando arquivos pelo site ou cópia para drive levam o `.env` junto. Nunca publicar por esses meios.
- Depois do `git init`, conferir com `git status` (e `git ls-files` antes do primeiro push) que `.env` não aparece.
- Procurar a chave fora do `.env` antes de publicar (ela começa com `sk-or-`), sem imprimir o valor. Em 20/10/2026 não estava em nenhum outro arquivo.
- Se a chave subir num commit por engano, apagar o arquivo não basta (fica no histórico): revogar no OpenRouter e gerar outra.
- O `.env.example` traz só os nomes das chaves (`FISH_API_KEY=`), nunca valor.
- **Clones de voz:** `nucleo/referencias/macks*` (`macks.*` e `macks-abertura.*`) é a voz do Macks e permite cloná-la. Perguntar se vai a público; o padrão é pôr `nucleo/referencias/macks*` no `.gitignore`. Os outros clones (River, Seed) também merecem a pergunta.
- **Referências pesadas:** `estilos/rabisco/referencia/` tem os 1141 quadros do vídeo de referência (1,3 GB) e o vídeo original, que não é nosso. Pôr `estilos/*/referencia/` no `.gitignore`.
- Sugerir ao Macks um limite de crédito na chave no OpenRouter, para limitar o estrago se ela vazar.

## Ambiente

- Python 3 com numpy e Pillow, ffmpeg. Blender 5.2 para os Contos com Claude; Node 24 + Chrome (via `puppeteer-core`, em `nucleo/2d/node_modules`) para os estilos 2D.
- Voz pelo OpenRouter, chave em `.env` da raiz. Uma chave comum, não de gerenciamento.
