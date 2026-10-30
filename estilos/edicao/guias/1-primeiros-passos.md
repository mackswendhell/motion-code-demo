# Primeiros passos

Este tutorial leva você do zero até a primeira edição. Leva uns 20 minutos, a maior parte esperando instalações.

---

## 1. O que você precisa

| Item | Para quê | Obrigatório? |
|---|---|---|
| **Claude** com acesso ao Claude Code (plano Pro ou Max) | é o seu diretor de vídeo | sim |
| **Node.js** (versão LTS) | roda o Remotion | sim |
| **Python** 3.10 ou mais novo | transcrição e skill `watch` | sim |
| **FFmpeg** | lê e converte vídeo | sim |
| **Git** | baixar e atualizar este repositório | recomendado |

Você pode usar o Claude de três jeitos. Todos funcionam com este repositório:

- **Claude Desktop, aba Code** (mais simples, sem terminal);
- **Claude Code no VS Code** (extensão);
- **Claude Code no terminal** (comando `claude`).

> A skill `watch` **não funciona no Cowork nem no chat comum** do Claude. Use sempre uma sessão **Code**.

## 2. Instalar os programas

### Windows

Abra o **PowerShell** e rode, um por vez:

```powershell
winget install --id OpenJS.NodeJS.LTS --exact
winget install --id Python.Python.3.12 --exact
winget install --id Gyan.FFmpeg --exact
winget install --id yt-dlp.yt-dlp --exact
winget install --id Git.Git --exact
```

Feche e abra o PowerShell de novo e confira:

```powershell
node --version
python --version
ffmpeg -version
```

### macOS

Instale o [Homebrew](https://brew.sh) e rode:

```bash
brew install node python ffmpeg yt-dlp git
```

## 3. Instalar o estilo Edição

### Jeito fácil: peça ao Claude

Abra uma sessão **Code** no Claude e cole:

```text
Instala o estilo Edição do Motion Code: roda npm run instalar dentro de estilos/edicao.
```

Ele clona, instala as dependências e as duas skills gratuitas (**remotion-best-practices** e **watch**). Quando terminar, **abra uma sessão nova** do Claude dentro da pasta do Motion Code: skills novas só aparecem numa sessão nova.

### Jeito manual

Escolha uma pasta **fora** do OneDrive, iCloud ou Dropbox (a sincronização atrapalha o render). Por exemplo, `C:\dev` no Windows ou `~/dev` no Mac.

```bash
cd C:\dev
git clone https://github.com/mackswendhell/motion-code-demo.git
cd motion-code-demo/estilos/edicao
npm run instalar
```

O `npm run instalar` faz tudo de uma vez: dependências do Remotion, transcrição local (`faster-whisper`), skill `remotion-best-practices` (dentro do projeto) e skill `watch`. No fim ele mostra um resumo do que deu certo e do que falhou.

Sem Git? Baixe o ZIP pelo botão verde **Code → Download ZIP** no GitHub, descompacte e rode `npm run instalar` dentro de `estilos/edicao`.

Teste o Remotion:

```bash
npm run studio
```

Abre uma página no navegador com os exemplos da galeria. Se você vê as composições em `Estilos` e consegue dar play, está tudo certo. Feche com `Ctrl+C` no terminal.

## 4. Sobre as skills gratuitas

Skills são pacotes de conhecimento que o Claude carrega quando precisa. O `npm run instalar` já instala as duas:

- **`watch`**: assiste vídeos, extrai quadros e transcreve ([bradautomates/claude-video](https://github.com/bradautomates/claude-video));
- **`remotion-best-practices`**: boas práticas do Remotion ([remotion-dev/skills](https://github.com/remotion-dev/skills)).

Usa só o Claude Desktop, sem o comando `claude` no terminal? Instale a `watch` à mão em **Personalizar → Plugins → Adicionar → Adicionar marketplace → Adicionar de um repositório**, cole `https://github.com/bradautomates/claude-video`, clique em **Sincronizar** e instale **Watch**.

## 5. (Opcional) Chave gratuita da Groq

A `watch` pode usar a Groq para transcrever rápido. É grátis dentro de um limite generoso.

1. Crie a chave em [console.groq.com/keys](https://console.groq.com/keys).
2. Salve como variável de ambiente:
   - Windows: `[Environment]::SetEnvironmentVariable("GROQ_API_KEY", "sua-chave", "User")`
   - Mac: adicione `export GROQ_API_KEY="sua-chave"` ao `~/.zshrc`.
3. Reabra o Claude.

Sem essa chave tudo funciona igual: o `tools/transcrever.py` transcreve localmente, de graça.

---

## 6. Entendendo as pastas

```text
estilos/edicao/
├─ CLAUDE.md           o "diretor": instruções que o Claude lê ao abrir o projeto
├─ guias/              os manuais (você está aqui)
├─ galeria/           galeria de estilos de referência, com imagens
│
├─ projetos/           ← VOCÊ COLOCA AQUI o vídeo e os prints
│  └─ 001. meu-video/
│     ├─ video/        o vídeo gravado, já cortado (nunca é alterado)
│     ├─ prints/       prints e imagens do que você quer ver animado
│     ├─ frames/       (gerado) quadros que o Claude "assistiu"
│     ├─ transcricao/  (gerado) texto com o tempo de cada palavra
│     └─ plano.md      (gerado) o plano de edição que você aprova
│
├─ edicoes/            ← AQUI SAI o vídeo pronto
│  └─ 001. meu-video/
│
├─ src/                código do Remotion
│  ├─ Root.tsx         lista de vídeos registrados
│  ├─ videos/          uma subpasta por vídeo seu
│  ├─ estilos/         código dos exemplos da galeria
│  └─ _shared/         peças reaproveitadas
├─ tools/              transcrição local e ponto seguro de corte na fala
└─ scripts/            verificações automáticas
```

Regra de bolso: **você só mexe em `projetos/`** (para entregar material) **e em `edicoes/`** (para pegar o resultado). O resto é trabalho do Claude.

A pasta `projetos/` inteira fica fora do Git (`.gitignore`), com exceção do exemplo. Assim, seus vídeos e prints não vão parar no GitHub por acidente se você publicar um fork.

## 7. Sua primeira edição

1. Dentro de `estilos/edicao/`, crie a pasta `projetos/001. meu-video/video/` e coloque seu vídeo lá (MP4 ou MOV, já cortado).
2. Crie `projetos/001. meu-video/prints/` e salve prints de tudo o que você cita no vídeo: sites, notícias, telas de ferramentas.
3. Abra a pasta do Motion Code no Claude (Desktop → Code → escolher pasta; ou `claude` no terminal dentro dela) e escolha o estilo **Edição**.
4. Diga o que quer. Exemplo:
   ```text
   Edita o projeto 001. Quero o vídeo completo, estilo minimal suíço, sem exagero de zoom.
   ```
5. Aprove (ou ajuste) o plano de edição que ele apresentar.
6. Confira os quadros de revisão que ele mostrar.
7. Pegue o vídeo em `estilos/edicao/edicoes/001. meu-video/`.

Não sabe o que pedir? Pergunte ao próprio Claude: "o que dá para fazer com esse vídeo?". Ele foi instruído a sugerir opções.

## 8. Glossário rápido

| Termo | Significado |
|---|---|
| **Master** | o seu vídeo gravado e cortado, a base de tudo |
| **Inserção** | qualquer elemento que entra por cima ou no lugar da câmera |
| **Overlay** | inserção com fundo transparente, que fica por cima do vídeo |
| **B-roll** | imagens de apoio em tela cheia enquanto você continua falando |
| **Split / tela dividida** | conteúdo de um lado, câmera do outro |
| **PiP** (picture-in-picture) | câmera pequena num canto |
| **Push-in / punch-in** | zoom lento / zoom rápido na câmera |
| **Gatilho** | a palavra falada que faz uma inserção aparecer |
| **Render** | gerar o arquivo de vídeo final |
| **Still** | um quadro parado exportado como imagem, usado para revisão |
| **MCP** | o "cabo" que conecta o Claude a um serviço externo, como a Fish Audio |
| **Skill** | um pacote de instruções que ensina o Claude a fazer uma tarefa |
