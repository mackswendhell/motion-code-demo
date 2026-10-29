# Prancha Viva

Estilo educativo: mostra como algo funciona do começo ao fim, como um ciclo que fecha em si mesmo. Ilustração 2D desenhada em código (JavaScript, Canvas 2D), com narração de documentário. Não compartilha estrutura nem estilo com os Contos com Claude; do estúdio usa só o `nucleo/` (voz, vozes, trilha e o motor 2D comum em `nucleo/2d/`). Comandos rodam de dentro desta pasta.

Sem skill ainda: o fluxo de roteiro (atos, narração, passagens) vive neste arquivo até virar skill.

## Estado dos episódios

| Episódio | Etapa | Próximo passo |
|---|---|---|
| `001-ciclo-da-abelha` | **entregue e aprovado** (20/10/2026, 16:9, 13 atos, 62,8 s, em `prontos/prancha-viva/`) | nenhum; depois dele, criar a skill do estilo |
| `003-o-que-maria-guardava` | **entregue, aguardando o Macks ver** (23/10/2026, 16:9, 15 cenas, 6min03s, em `prontos/prancha-viva/`). Lucas 1–2 recontado do 002 (que tinha 19min42s de quadros parados). Motor próprio na pasta do episódio (`cena.js`, `personagens.js`, `cenas.js`, `falas.py` para o elenco de 4 vozes, `fazer.sh`), sem tocar em `motor/` nem no núcleo | ouvir as vozes novas (Maria, Isabel, Gabriel) e o "Mas Zacarias" do ato 2 |
| `004-como-nasce-a-chuva` | **entregue, aguardando o Macks ver** (29/10/2026, 16:9, 5 atos, 23,6 s, em `prontos/prancha-viva/`). Ciclo da água para crianças; suspense no "pesadas... pesadas..." e revelação no "É chuva!". Motor próprio na pasta do episódio (`cena.js`: mar, vapor, nuvem e chuva são um mundo só; `peso` é o close dentro da nuvem) e `fazer.sh` do episódio | ouvir se a direção deu o suspense e o brilho no fim |

## Motor

Do estilo, em `motor/`:

| Arquivo | Faz |
|---|---|
| `pagina.html` | carrega `../../../nucleo/2d/base.js`, `cena.js` e `cenas2.js` |
| `cena.js` + `cenas2.js` | o desenho (atos 1 a 3 em `cena.js`, 4 a 13 em `cenas2.js`): `iniciar(tempo)` e `quadro(t)` em Canvas 2D. Uma função por cena em `CENAS`, passagens em `PASSAGENS` (`iris`, `funde`, `afasta`) |

Do núcleo, em `nucleo/2d/` (comum aos estilos 2D):

| Arquivo | Faz |
|---|---|
| `narrar.py` | lê `roteiro.json` (atos com `cena`, `dura`, `entrada`, `narracao`), gera a narração pelo `nucleo/voz.py` (cache por ato) e grava `tempo.json` + `audio/narracao.wav`. O ato dura `dura` ou o que a fala pedir + 0,7 s |
| `capturar.mjs` | abre `motor/pagina.html` no Chrome headless (`puppeteer-core`), captura cada quadro e monta o MP4 com a narração. `--still t1,t2 pasta` tira quadros soltos |

Rodar tudo: `./fazer.sh episodios/<slug>` (narração, trilha `contos` do `nucleo/trilha.py` a −10 dB, desenho, mixagem, entrega em `prontos/prancha-viva/<slug>/`). Por partes: `python3 ../../nucleo/2d/narrar.py episodios/<slug> [--ate N]` e `node ../../nucleo/2d/capturar.mjs motor/pagina.html episodios/<slug>`. Render ~3 s por segundo de vídeo.

## Decisões

- **Formato por episódio:** 9:16 (1080×1920), 1:1 (1080×1080) ou 16:9 (1920×1080), no `"formato"` do `roteiro.json`. Motor validado e aprovado pelo Macks nos três (20/10/2026): as cenas do 001 foram conferidas em 39 quadros por formato e em renders completos de teste em 9:16 e 1:1. Regra para cena nova: compor em frações de `W` e `H`, e todo ajuste para quadro alto ou estreito tem de dar exatamente o valor do 16:9 quando o quadro é 16:9 (assim o que já foi aprovado não muda). Exemplos no código: a lupa sobe no quadro em pé, a contagem dos dias quebra linha, a pupa cresce com a altura e o favo da geometria ganha anéis.
- **Narração:** sempre. Narrador de documentário de natureza, voz grave masculina, curiosa e viva, com suspense antes das revelações. Voz definida em "Voz".
- **Música:** instrumental contínua, por baixo da narração.
- **Nada de preto chapado** (pedido do Macks, 20/10/2026). Mesmo o modo diagrama tem fundo de papel colorido (azul-petróleo com manchas de aquarela de borda definida, pontilhado de risografia) e preenchimentos em aguada de cor. Desenho sempre com textura detalhada: pelos em camadas, hachura, traço tremido, bolhas, facetas, nervuras.

## Voz

Narrador `narrador` no `nucleo/vozes.json`: Fish "Melhor narrador" (`b2f48ebaf7b644539abc7dea4cf7d28c`), escolhido de ouvido entre 5 narradores graves em 20/10/2026.
Direção base, aprovada entre três leituras (calorosa, curiosa, íntima): **"voz grave, encantado e curioso, ritmo vivo, faz uma pausa de suspense antes do fim e revela com brilho na voz"**. Documentário com nuance criativa, nunca o tom frio de documentário clássico.

## Referência 1: o ciclo das abelhas

Vídeo "Claude Opus 5.5 drew every frame of this animation using JavaScript" (`~/Downloads/claude-opus-5-5-drew-every-frame-of-this-animation-using-jav-1.mp4`). 1:1, 24 fps, 53 s, sem narração, só música (−16 LUFS, pulso ~92 bpm, quase sem variação de volume).

**Como é feito.** Cada quadro é função do tempo em Canvas 2D, capturado e montado depois com a música. Favo como grade hexagonal paramétrica; pelos, hachura e grão de papel como milhares de traços curtos com ruído (é o que dá cara de desenho à mão); crescimento por regra (divisão celular de 1 a centenas de pontos, faixas de segmentação somando); geometria construída na tela (flor da vida → hexágono → prisma em wireframe).

**Estilo.** Ilustração científica editorial, prancha de naturalista com textura de risografia. Uma paleta por ato: mel e âmbar (colmeia), quase preto com linha creme (modo diagrama, microscópico), céu claro com verde e branco (mundo de fora), azul-noite (passagem dos dias). A explicação mora na imagem: lupa com corte da flor, setas da dança, mapa com vetores. Nenhum texto na tela.

**Montagem.**
- Nenhum corte seco. Toda passagem é uma transformação: íris, forma que vira outra (ovo → célula), zoom de escala (mapa → galho), timelapse no mesmo quadro (pupa com silhuetas-fantasma; sol vira lua com risquinhos contando os dias).
- Estrutura em ciclo: abre na colmeia, mergulha no ovo e na geometria, e fecha na mesma geometria e no ovo.
- Ritmo: blocos de 3 a 4 s e um único plano longo (~15 s, flor virando fruto no galho) no meio.
- Câmera quase parada; quem se mexe é o desenho (cresce, divide, constrói).

| Trecho | O que mostra | Passagem |
|---|---|---|
| 0–2 s | abelha no favo colorido de pólen | abertura direta |
| 2–9 s | geometria do favo, divisão do embrião | íris para o wireframe |
| 9–12 s | larva crescendo, sendo alimentada | ovo vira célula |
| 12–15 s | pupa em corte, olhos mudando de cor | timelapse no lugar |
| 15–20 s | nasce a operária | zoom out |
| 20–24 s | papéis na colmeia, construção do favo | geometria redesenhando |
| 24–35 s | voo: mapa de cima, macro na flor | zoom de escala |
| 35–42 s | polinização, flor vira fruto | plano longo segurado |
| 42–46 s | dança do requebrado, vetor no mapa | seta vira caminho |
| 46–49 s | troca de alimento, mel, células fechadas | close macro |
| 49–51 s | tronco, dia e noite, contagem dos dias | fundo troca, quadro fica |
| 51–53 s | olho refletindo o mundo, volta à geometria e ao ovo | fecha o ciclo |
