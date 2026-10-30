# Edição com Remotion (gratuito)

No estilo Edição, o Claude assiste ao seu vídeo, entende o que você fala e **programa** as animações com o [Remotion](https://www.remotion.dev), uma ferramenta que transforma código em vídeo. Você não precisa saber programar: você conversa, aprova o plano e confere o resultado.

**Custo:** zero. Tudo roda no seu computador.
**Ferramentas:** skill `watch` (assiste o vídeo), `tools/transcrever.py` (tempo de cada palavra), skill `remotion-best-practices` (boas práticas do Remotion) e o próprio Remotion.

Se você nunca mexeu com Remotion, leia antes o [manual do Remotion para leigos](3-manual-remotion.md).

---

## O que você entrega

1. O vídeo **já cortado** em `projetos/<NNN. nome>/video/`.
2. **Prints** de tudo o que você quer ver animado em `projetos/<NNN. nome>/prints/`: páginas, notícias, telas de ferramentas, logos, gráficos. Este é o ponto que mais melhora o resultado. Uma animação feita em cima de um print real é sempre mais fiel e mais bonita que uma recriação.
3. Suas **orientações** em texto livre: estilo desejado (veja a [galeria](../galeria/README.md)), formato (horizontal ou vertical), o que não pode faltar, o que evitar.

Dica: dê nomes claros aos prints (`noticia-openai.png`, `tela-configuracoes.png`). O Claude usa o nome para saber onde cada um entra.

## O que você recebe

Um de dois entregáveis (o Claude pergunta se não estiver claro):

- **Vídeo completo** (padrão): um MP4 final com câmera, animações, telas divididas e prints, com o áudio original.
- **Inserções separadas:** arquivos soltos para você montar no seu editor. Overlays transparentes em `.mov` (ProRes 4444, com canal alpha) e telas cheias em `.mp4`, mais uma lista de timecodes.

Tudo vai para `edicoes/<NNN. nome>/`.

---

## O processo, passo a passo

O Claude conduz estas fases na ordem e **para nos pontos de aprovação**.

### 1. Organizar

- Localiza a pasta nova em `projetos/`. Se você só soltou um vídeo lá, ele cria `projetos/<NNN>/video/` e move o arquivo para dentro.
- Numeração: três dígitos, ponto e espaço (`001. meu-video`). Novo projeto = maior número existente + 1.
- Roda `ffprobe` no vídeo para registrar duração, resolução, fps e codecs no topo do `plano.md`.
- Cria `edicoes/<NNN. nome>/`.

### 2. Assistir e transcrever

1. **Quadros e visão geral (skill `watch`):** o Claude segue as instruções da própria skill. Exemplo:
   `python "<pasta da skill watch>/scripts/watch.py" "<vídeo>" --detail balanced --max-frames 60 --out-dir "<projeto>/frames"`
   Ele lê todos os quadros e mapeia enquadramento, posição do rosto, fundo e luz. A `watch` também transcreve o vídeo para entender o conteúdo: localmente (WhisperX, nas versões mais novas da skill) ou com uma chave gratuita da Groq (veja os [primeiros passos](1-primeiros-passos.md#5-opcional-chave-gratuita-da-groq)). Sem nenhum dos dois, use `--no-whisper`: o passo seguinte já transcreve.
2. **Tempo por palavra (local e gratuito):**
   `python tools/transcrever.py "<vídeo>" "<projeto>/transcricao"`
   Gera `palavras.json` (início e fim de cada palavra) e `transcript.md`.
3. **Zona do rosto (obrigatória se a câmera vai encolher):** um quadro por segundo do vídeo inteiro, com uma caixa candidata desenhada, numa prancha:
   `ffmpeg -i "<vídeo>" -vf "fps=1,drawbox=x=680:y=70:w=530:h=690:c=cyan:t=6,scale=320:-1,tile=10x6" "<projeto>/frames/sheet_rosto.jpg"`
   Ajuste a caixa até a cabeça inteira (cabelo, orelhas, queixo) ficar dentro dela em **todos** os quadros. Essa caixa é a zona do rosto `{x0, y0, x1, y1}` do plano. Um quadro só não basta: a pessoa se mexe dezenas de pixels para os lados.
4. Nomes próprios mal transcritos podem ser corrigidos no texto ("cloud" → Claude) sem mexer nos tempos.
5. Com o conteúdo entendido, a pasta ganha um nome descritivo: `001. meu-video`.

### 3. Planejar (ponto de aprovação)

O Claude escreve `plano.md` usando a [direção editorial](4-direcao-editorial.md):

- leitura do vídeo e suas orientações;
- estilo escolhido e intensidade;
- cenas do repertório que entram (e as que ficam de fora, com o porquê) e a curva de energia;
- para vídeos com mais de ~3 min: mapa macro (blocos e cena dominante de cada um);
- tabela: `# | início–fim | cena | entrada | gatilho (palavra @ tempo) | visual | print usado`;
- zona do rosto `{x0, y0, x1, y1}` medida na prancha, e a tabela de formatos de card com a escala do vídeo e a região visível de cada um.

Veja um plano real em [projetos/000. exemplo/plano.md](../projetos/000.%20exemplo/plano.md).

**Nada é programado antes de você aprovar o plano.**

### 4. Programar as cenas

- O código do vídeo fica em `src/videos/<slug>/` e é registrado em `src/Root.tsx` dentro de um `<Folder>`.
- Os arquivos de `projetos/` são acessados com `staticFile('<NNN. nome>/...')` (a pasta `projetos` é a pasta pública do Remotion).
- **Vídeo completo:** uma única instância contínua de `<Video>` com o master; a câmera muda de tamanho e lugar animando o contêiner, nunca reiniciando o vídeo. Dimensões e fps herdados do master.
- **Tela dividida:** use sempre `src/_shared/synchronized-split.tsx`. Ele garante que câmera e painel entrem e saiam juntos. O `npm run typecheck` bloqueia splits feitos à mão.
- **Câmera em card:** a posição e a escala do vídeo dentro do card vêm de `enquadrarRosto(card, zonaDoRosto)` (reexportado pelo `synchronized-split.tsx`, passe o resultado em `splitVideoX/Y/Scale`). Ela **reduz o vídeo** dentro do card até a zona do rosto caber com margem, sem borda preta, e dá erro se o formato não comporta o rosto. Formatos prontos em `FORMATOS_CARD`: `vertical` 560×870, `horizontal` 16:9 860×484, `quadrado` 620×620, `mini` 360×450, todos com borda arredondada, e `meia` 1160×1080 (altura total, colada à direita de uma faixa de painel de 760 px, sem borda; ver `MEIA_TELA` em `src/estilos/papel-recortado.tsx`). Varie o formato ao longo do vídeo conforme a fala; o `npm run typecheck` testa todos com um rosto de referência.
- Cards e painéis que entram ao lado da câmera só aparecem quando a câmera já está ~70% da transição; antes disso eles cobrem o rosto, que ainda está grande.
- Toda animação depende de `useCurrentFrame()`. Nada de transições ou animações CSS.
- Tempos definidos em segundos (vindos do `palavras.json`) e convertidos com o fps.
- `<Sequence premountFor={fps}>` em toda cena com tempo definido.
- Evite `TransitionSeries.Transition` na timeline do master: a sobreposição encurta o vídeo.
- Os exemplos em `src/estilos/` mostram como cada estilo da galeria foi construído. Use como ponto de partida, não como molde fixo.

### 5. Conferir (ponto de aprovação)

1. `npm run typecheck`.
2. Stills (quadros parados) no início, no meio e no fim de cada mudança de layout, incluindo **o meio de cada transição da câmera** e pelo menos um still de cada formato de card:
   `npx remotion still src/index.ts <Composicao> edicoes/<NNN. nome>/stills/q0450.png --frame=450`
3. O Claude revisa: rosto coberto? texto legível? borda preta? print cortado? marca-texto no lugar? E mostra os stills principais para você aprovar antes do render.
4. Você também pode assistir tudo em tempo real com `npm run studio` (abre no navegador).

### 6. Renderizar e entregar

- **MP4 final:**
  `npx remotion render src/index.ts <Composicao> "edicoes/<NNN. nome>/<nome>-final.mp4" --codec=h264 --crf=17`
- **Overlay transparente:**
  `npx remotion render src/index.ts <Composicao> "edicoes/<NNN. nome>/<nome>-overlay.mov" --image-format=png --pixel-format=yuva444p10le --codec=prores --prores-profile=4444`
- Validação com `ffprobe`: resolução, fps, duração igual à do master, uma única trilha de áudio (e canal alpha nos `.mov`).
- O Claude informa o caminho do arquivo, duração, resolução, codecs e timecodes (se forem inserções).
- Apaga só os intermediários que ele mesmo criou. Seu vídeo e seus prints nunca são apagados.

---

## Pedidos que funcionam bem

```text
Edita o projeto 001. Estilo minimal suíço, vídeo completo em MP4.
```

```text
Quero só as inserções do projeto 002: overlays em MOV e telas cheias em MP4.
Os prints estão na pasta, usa a notícia no momento em que eu falo "pesquisa".
```

```text
Faz uma versão vertical (9:16) dos primeiros 45 segundos do projeto 003,
com legenda grande palavra por palavra.
```

```text
Muda a cena 7 do plano: em vez de tela cheia, quero o print com a câmera no canto.
```
