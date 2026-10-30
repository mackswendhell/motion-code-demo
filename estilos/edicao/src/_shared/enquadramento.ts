// Zona do rosto medida nos quadros reais (1 por segundo, união das caixas), em pixels do master.
export type ZonaRosto = {x0: number; y0: number; x1: number; y1: number};

// Formatos de card de câmera testados (borda arredondada). O vídeo é reduzido dentro do card.
export const FORMATOS_CARD = {
  vertical: {w: 560, h: 870},
  horizontal: {w: 860, h: 484},
  quadrado: {w: 620, h: 620},
  mini: {w: 360, h: 450},
  // Meia tela: câmera em altura total colada à direita de um painel (sem borda arredondada, sem ampliar).
  meia: {w: 1160, h: 1080},
} as const;

// Escala e posição do master dentro de um card w×h para o rosto caber inteiro, com margem,
// sem borda preta. Erro cedo se o formato não comporta o rosto: nunca recorte em escala 1 com offset fixo.
export const enquadrarRosto = (
  card: {w: number; h: number},
  rosto: ZonaRosto,
  {margem = 40, canvasWidth = 1920, canvasHeight = 1080} = {},
) => {
  const rw = rosto.x1 - rosto.x0 + 2 * margem;
  const rh = rosto.y1 - rosto.y0 + 2 * margem;
  const cobre = Math.max(card.w / canvasWidth, card.h / canvasHeight);
  const scale = Math.max(cobre, Math.min(1, card.w / rw, card.h / rh));
  const cx = (rosto.x0 + rosto.x1) / 2;
  const cy = (rosto.y0 + rosto.y1) / 2;
  const x = Math.min(0, Math.max(card.w - canvasWidth * scale, card.w / 2 - cx * scale));
  const y = Math.min(0, Math.max(card.h - canvasHeight * scale, card.h / 2 - cy * scale));
  const dentro =
    x + rosto.x0 * scale >= 0 && x + rosto.x1 * scale <= card.w && y + rosto.y0 * scale >= 0 && y + rosto.y1 * scale <= card.h;
  if (!dentro) {
    throw new Error(`O rosto não cabe no card ${card.w}×${card.h}: aumente o card ou mude a proporção.`);
  }
  return {scale, x, y};
};
