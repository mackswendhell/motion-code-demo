# Manual do Remotion para quem nunca editou vídeo

Este manual explica o Remotion sem exigir que você saiba programar. A ideia é você entender **o que é possível pedir** e **o que o Claude está fazendo** quando edita o seu vídeo.

---

## 1. A ideia em uma frase

O Remotion faz vídeo **como se fosse uma página da internet**. Cada quadro do vídeo é uma "página" desenhada pelo computador, e o Remotion tira uma foto de cada uma e junta tudo num MP4.

Pense num flipbook, aquele bloquinho que você folheia rápido e o desenho parece se mexer:

- cada **folha** é um **quadro** (em inglês, *frame*);
- folhear **30 folhas por segundo** dá movimento suave: isso é o **fps** (quadros por segundo);
- um vídeo de 10 segundos a 30 fps tem **300 quadros**.

No Remotion, em vez de desenhar 300 folhas à mão, o Claude escreve uma **regra**: "no quadro 0 o título está invisível, no quadro 15 ele está inteiro". O Remotion calcula todas as folhas do meio sozinho.

## 2. As peças principais

| Peça | O que é | Analogia |
|---|---|---|
| **Composição** | um vídeo com tamanho, fps e duração definidos | a "folha em branco" do projeto |
| **Quadro (frame)** | uma imagem parada do vídeo | uma folha do flipbook |
| **fps** | quantos quadros por segundo | a velocidade de folhear |
| **Camadas** | elementos empilhados (vídeo embaixo, texto por cima) | transparências sobrepostas |
| **Sequence** | um trecho que aparece só entre dois momentos | uma cena que entra e sai da timeline |
| **Interpolação** | ir de um valor a outro ao longo do tempo (opacidade 0 → 1, posição 100 → 0) | um dimmer de luz girando devagar |
| **Easing (curva)** | o "jeito" do movimento: começar devagar, acelerar, frear | um carro saindo do sinal e parando no próximo |
| **Spring (mola)** | movimento com leve elasticidade, como algo que se acomoda | uma gaveta que fecha macia |
| **Pasta pública** | onde ficam seus vídeos e prints (`projetos/`) | o almoxarifado do estúdio |
| **Render** | transformar tudo num arquivo de vídeo final | revelar o filme |
| **Still** | exportar um único quadro como imagem | tirar uma foto de um momento |

## 3. O Remotion Studio (a tela de pré-visualização)

Rode no terminal, dentro da pasta do projeto:

```bash
npm run studio
```

Abre uma página no navegador com:

- **à esquerda**, a lista de composições. Em `Estilos` estão os exemplos que vêm com este repositório; os seus vídeos aparecem abaixo;
- **no centro**, o player. Dê play, pause e arraste para qualquer ponto;
- **embaixo**, a timeline com as `Sequence`s, que mostra quando cada cena entra e sai;
- **à direita**, as propriedades e o botão **Render**.

Você pode deixar o Studio aberto enquanto conversa com o Claude: quando ele altera o código, a pré-visualização atualiza sozinha.

## 4. O que dá para pedir

Tudo abaixo é possível sem nenhum custo. Peça com as suas palavras.

### Texto e tipografia
- Títulos que entram palavra por palavra, letra por letra, com desfoque ou subindo.
- Legendas grandes estilo Reels/TikTok com a palavra falada em destaque.
- Frases em tipografia grande ao lado do rosto.
- Qualquer fonte do Google Fonts.

### Seus prints (o ponto mais forte)
- Print entrando como uma folha, com sombra.
- Zoom lento até o trecho que você está citando.
- **Marca-texto** passando exatamente sobre a frase, no momento em que você fala.
- Setas, círculos e anotações desenhadas por cima.
- Print de tela de ferramenta com o cursor "clicando" nos passos de um tutorial.

### Layouts com a câmera
- Câmera cheia com um elemento por cima.
- Tela dividida: conteúdo de um lado, câmera do outro.
- Câmera em card no canto (picture-in-picture), mudando de lugar conforme a cena.
- Câmera em círculo, com borda, sombra.
- Zoom suave na câmera numa frase importante.

### Explicações visuais
- Fluxos e diagramas que se montam passo a passo.
- Listas e etapas numeradas.
- Comparações lado a lado (antes/depois, A × B).
- Linhas do tempo.
- Ícones e ilustrações desenhados em SVG.

### Números e dados
- Contadores que sobem até o número falado.
- Gráficos de barra, pizza e linha que crescem na tela.
- Réguas, medidores e barras de progresso.

### Transições
- Corte seco, fade, wipe (cortina), deslize.
- Transformações: a câmera encolhe e vira card, um elemento cresce e vira tela cheia.

### Formatos
- Horizontal (YouTube), vertical (Reels, TikTok, Shorts), quadrado (feed).
- Vídeo completo em MP4 ou inserções separadas com fundo transparente.

### Mais avançado (também gratuito)
- Animações em 3D.
- Visualização de áudio (ondas e barras reagindo à voz).
- Efeitos de luz, brilho, grão e textura.

## 5. Os arquivos que você vai ver

| Arquivo | Para que serve |
|---|---|
| `src/Root.tsx` | a "lista de vídeos": cada composição registrada aqui aparece no Studio |
| `src/videos/<nome>/` | o código de cada um dos seus vídeos |
| `src/estilos/` | os exemplos da galeria, prontos para estudar e copiar |
| `src/_shared/` | peças técnicas reaproveitadas (como a tela dividida sincronizada) |
| `projetos/` | seus vídeos e prints (a pasta pública do Remotion) |
| `edicoes/` | os arquivos finais renderizados |
| `remotion.config.ts` | configurações gerais do render |

Você não precisa abrir nenhum deles. Mas, se quiser espiar, o código dos exemplos em `src/estilos/` tem comentários em português explicando cada estilo.

## 6. Comandos úteis

```bash
npm run studio         # abre a pré-visualização no navegador
npm run typecheck      # confere se o código está sem erros
npm run compositions   # lista as composições registradas

# um quadro parado (still) de uma composição
npx remotion still src/index.ts VerticalLegendas edicoes/teste.png --frame=75

# render de um vídeo
npx remotion render src/index.ts VerticalLegendas edicoes/teste.mp4
```

Na prática, é o Claude quem roda esses comandos. Eles estão aqui para você saber o que está acontecendo.

## 7. MP4 ou MOV?

- **MP4 (H.264):** o formato comum, leve, toca em qualquer lugar. Use para o vídeo final e para inserções em tela cheia.
- **MOV (ProRes 4444):** arquivo pesado, mas com **fundo transparente**. Use quando quiser colocar a animação por cima do seu vídeo em outro editor (Premiere, DaVinci, CapCut desktop, Final Cut).

## 8. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `npm` não é reconhecido | Node.js não instalado | instale o Node.js LTS (veja os [primeiros passos](1-primeiros-passos.md)) |
| Studio abre, mas o vídeo aparece preto | caminho do arquivo errado ou com acento digitado diferente | peça ao Claude para conferir o `staticFile` |
| Render muito lento | vídeo longo ou efeitos pesados | normal na primeira vez; peça render por partes ou em qualidade de rascunho para revisar |
| `EPERM` no Windows | antivírus ou OneDrive bloqueando arquivos | mantenha o projeto fora de pastas sincronizadas (ex.: `C:\dev\motion-code-demo`) |
| Texto cortado ou fora da tela | frase maior que o espaço | peça ajuste de tamanho ou quebra de linha |

## 9. Licença do Remotion

O Remotion é gratuito para **pessoas físicas, organizações sem fins lucrativos e empresas com até 3 pessoas**. Empresas maiores precisam de uma licença paga. Confira os termos atuais em [remotion.dev/license](https://www.remotion.dev/license).

## 10. Para ir além

- Documentação oficial (em inglês): [remotion.dev/docs](https://www.remotion.dev/docs)
- Skill de boas práticas que o Claude usa: [remotion-dev/skills](https://github.com/remotion-dev/skills)
