import fs from 'node:fs';
import path from 'node:path';

const sourceRoot = path.resolve('src');
const allowed = new Set(['_shared/synchronized-split.tsx']);

const collect = (directory) =>
  fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(absolute);
    return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });

const violations = [];
for (const absolute of collect(sourceRoot)) {
  const relative = path.relative(sourceRoot, absolute).replaceAll('\\', '/');
  if (allowed.has(relative)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  const buildsCameraGeometryManually =
    /cameraLeft\s*=\s*interpolate/.test(source) &&
    /cameraWidth\s*=\s*interpolate/.test(source) &&
    /(splitOut|windowProgress)/.test(source);
  if (
    buildsCameraGeometryManually &&
    !source.includes('getSynchronizedSplitState')
  ) {
    violations.push(relative);
  }
}

if (violations.length > 0) {
  console.error('Novos splits manuais não são permitidos. Use src/_shared/synchronized-split.tsx:');
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log('Verificação de splits: ok.');

// Enquadramento: todo formato de card comporta um rosto de referência (o do projeto 002, close de podcast).
// Precisa de Node 23.6+ para importar .ts; em versões antigas o teste é pulado.
let enq;
try {
  process.removeAllListeners('warning'); // aviso de .ts em pacote sem "type": "module"
  enq = await import('../src/_shared/enquadramento.ts');
} catch {
  console.log('Verificação de enquadramento: pulada (Node sem suporte a .ts).');
}
if (enq) {
  const rosto = {x0: 680, y0: 70, x1: 1210, y1: 760};
  for (const [nome, card] of Object.entries(enq.FORMATOS_CARD)) {
    const {scale, x, y} = enq.enquadrarRosto(card, rosto);
    const ok = x + rosto.x0 * scale >= 0 && x + rosto.x1 * scale <= card.w && y + rosto.y0 * scale >= 0 && y + rosto.y1 * scale <= card.h;
    if (!ok) {
      console.error(`Formato ${nome} corta o rosto.`);
      process.exit(1);
    }
  }
  let recusou = false;
  try {
    enq.enquadrarRosto({w: 300, h: 900}, rosto);
  } catch {
    recusou = true;
  }
  if (!recusou) {
    console.error('enquadrarRosto aceitou um card estreito demais para o rosto.');
    process.exit(1);
  }
  console.log('Verificação de enquadramento: ok.');
}

