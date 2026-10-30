import React from 'react';
import {OffthreadVideo, useCurrentFrame, useVideoConfig} from 'remotion';
import {ZonaRosto, enquadrarRosto} from '../../_shared/enquadramento';
import {Enquadro, Foco} from './app';
import {suave, useAgora} from './base';

// Câmera e app seguem UM cronograma: o card da câmera e a caixa do app mudam juntos, na mesma curva.

export type Caixa = {x: number; y: number; w: number; h: number};
export type Layout = {l: number; t: number; w: number; h: number; r: number; vs: number; vx: number; vy: number; op: number; app: Caixa};

// T = conteúdo em tela cheia (B-roll): a câmera some no lugar onde está.
export const T = 'T' as const;
export type Crono = [number, Layout | typeof T, number][];

// Os seis layouts do estilo, calculados a partir da zona do rosto medida no vídeo (1 quadro/s).
// A cheia · G vertical grande à direita · D vertical pequena à direita · E espelhada à esquerda · H 16:9 pequena · Q quadrada.
export const layoutsDemo = (rosto: ZonaRosto) => {
  const card = (l: number, t: number, w: number, h: number, app: Caixa, margem = 40): Layout => {
    const {scale, x, y} = enquadrarRosto({w, h}, rosto, {margem});
    return {l, t, w, h, r: 22, vs: scale, vx: x, vy: y, op: 1, app};
  };
  const cx = (rosto.x0 + rosto.x1) / 2;
  const cy = (rosto.y0 + rosto.y1) / 2;
  const push = (s: number): Layout => ({l: 0, t: 0, w: 1920, h: 1080, r: 0, vs: s, vx: -cx * (s - 1), vy: -cy * (s - 1), op: 1, app: {x: 50, y: 130, w: 1220, h: 880}});
  return {
    A: push(1),
    push,
    G: card(1310, 50, 560, 980, {x: 50, y: 130, w: 1220, h: 880}),
    D: card(1520, 400, 360, 640, {x: 30, y: 40, w: 1470, h: 1000}),
    E: card(40, 400, 360, 640, {x: 420, y: 40, w: 1470, h: 1000}),
    H: card(1450, 800, 430, 242, {x: 30, y: 30, w: 1400, h: 1020}),
    Q: card(1420, 330, 420, 420, {x: 40, y: 40, w: 1320, h: 1000}),
  };
};

const lerp = (a: Layout, b: Layout, p: number): Layout => {
  const m = (x: number, y: number) => x + (y - x) * p;
  return {
    l: m(a.l, b.l),
    t: m(a.t, b.t),
    w: m(a.w, b.w),
    h: m(a.h, b.h),
    r: m(a.r, b.r),
    vs: m(a.vs, b.vs),
    vx: m(a.vx, b.vx),
    vy: m(a.vy, b.vy),
    op: m(a.op, b.op),
    app: {x: m(a.app.x, b.app.x), y: m(a.app.y, b.app.y), w: m(a.app.w, b.app.w), h: m(a.app.h, b.app.h)},
  };
};

export const layoutEm = (crono: Crono, t: number) => {
  let cur = crono[0][1] as Layout;
  for (const [ini, lay, dur] of crono) {
    if (t < ini) break;
    const alvo = lay === T ? {...cur, op: 0} : lay;
    cur = lerp(cur, alvo, suave(Math.min(1, (t - ini) / dur)));
  }
  return cur;
};

// Uma única instância do vídeo gravado; só o contêiner se move.
// de: dentro de um Sequence que começa no segundo `de` do master (vídeo com vãos abertos na fala).
export const CameraDemo: React.FC<{crono: Crono; src: string; de?: number; muted?: boolean}> = ({crono, src, de = 0, muted}) => {
  const {fps} = useVideoConfig();
  const c = layoutEm(crono, useCurrentFrame() / fps + de);
  if (c.op < 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: c.l,
        top: c.t,
        width: c.w,
        height: c.h,
        overflow: 'hidden',
        borderRadius: c.r,
        opacity: c.op,
        boxShadow: c.r > 1 ? '0 24px 60px rgba(40,25,10,.35), 0 0 0 1px rgba(0,0,0,.25)' : 'none',
      }}
    >
      <div style={{position: 'absolute', left: c.vx, top: c.vy, width: 1920 * c.vs, height: 1080 * c.vs}}>
        <OffthreadVideo src={src} muted={muted} trimBefore={de ? Math.round(de * fps) : undefined} style={{width: '100%', height: '100%'}} />
      </div>
    </div>
  );
};

// App posicionado na caixa do layout atual, com a câmera virtual de zoom da cena.
export const AppDemo: React.FC<{crono: Crono; focos?: Foco[]; children: React.ReactNode}> = ({crono, focos = [[0, 1, 735, 432]], children}) => {
  const t = useAgora();
  return (
    <Enquadro caixa={layoutEm(crono, t).app} focos={focos}>
      {children}
    </Enquadro>
  );
};
