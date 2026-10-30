// Instala tudo de que o estilo Edição precisa: dependências, transcrição local e as skills gratuitas.
// Uso: npm run instalar   (ou: node scripts/instalar.mjs)
// Cada passo é independente: se um falhar, os outros continuam e o resumo final diz o que resolver.
import {spawnSync} from 'node:child_process';

const python = process.platform === 'win32' ? 'python' : 'python3';

const passos = [
  ['Dependências do Remotion', 'npm install --no-audit --no-fund'],
  ['Transcrição local (faster-whisper)', `${python} -m pip install faster-whisper`],
  // a skill vai para a raiz do Motion Code, onde a sessão do Claude é aberta
  ['Skill remotion-best-practices', 'cd ../.. && npx -y skills add remotion-dev/skills -s remotion-best-practices -a claude-code -y'],
  // ponytail: falha aqui costuma ser "marketplace já cadastrado"; o passo seguinte revela erro real.
  ['Marketplace da skill watch', 'claude plugin marketplace add bradautomates/claude-video', true],
  ['Skill watch', 'claude plugin install watch@claude-video'],
];

const falhas = [];
for (const [nome, comando, opcional] of passos) {
  console.log(`\n==> ${nome}\n    ${comando}`);
  const r = spawnSync(comando, {stdio: 'inherit', shell: true});
  if (r.status !== 0 && !opcional) falhas.push(nome);
}

for (const programa of ['ffmpeg -version', 'ffprobe -version']) {
  if (spawnSync(programa, {stdio: 'ignore', shell: true}).status !== 0) falhas.push(`${programa.split(' ')[0]} (instale pelo guia)`);
}

console.log('\n' + '='.repeat(60));
if (falhas.length === 0) {
  console.log('Tudo instalado. Abra uma sessão NOVA do Claude na pasta do Motion Code para as skills aparecerem.');
} else {
  console.log('Falhou:');
  for (const f of falhas) console.log(`  - ${f}`);
  console.log('Veja guias/1-primeiros-passos.md. Sem o comando "claude" (só Claude Desktop), a watch é');
  console.log('oferecida automaticamente ao abrir a pasta, ou instale por Personalizar > Plugins.');
}
process.exit(falhas.length === 0 ? 0 : 1);
