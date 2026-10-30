import React from 'react';
import {interpolate} from 'remotion';
import {Asterisco, COR, FONTE, clamp, suave, useAgora, useEm, useMola} from './base';

// Cartão claro de papel que sobe com mola: a peça básica dos diagramas.
export const Folha: React.FC<{em: number; x: number; y: number; w: number; h?: number; ate?: number; destaque?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  em,
  x,
  y,
  w,
  h,
  ate = 1e9,
  destaque = 0,
  style,
  children,
}) => {
  const t = useAgora();
  const m = useMola(em);
  const sai = interpolate(t, [ate, ate + 0.35], [1, 0], clamp);
  if (t < em - 0.05 || sai <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        background: COR.mesaClara,
        border: `1.5px solid ${destaque > 0 ? `rgba(217,119,87,${0.4 + 0.6 * destaque})` : COR.borda}`,
        borderRadius: 18,
        boxShadow: `0 18px 44px rgba(40,30,15,.12)${destaque > 0 ? `, 0 0 0 ${6 * destaque}px rgba(217,119,87,.14)` : ''}`,
        fontFamily: FONTE.ui,
        color: COR.tinta,
        opacity: m * sai,
        transform: `translateY(${(1 - m) * 26}px) scale(${0.94 + 0.06 * m})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Mini-janela de chat (três bolinhas + título) para os diagramas.
export const MiniChat: React.FC<{em: number; x: number; y: number; w?: number; titulo: string; ate?: number; destaque?: number; children?: React.ReactNode}> = ({
  em,
  x,
  y,
  w = 300,
  titulo,
  ate,
  destaque,
  children,
}) => (
  <Folha em={em} x={x} y={y} w={w} ate={ate} destaque={destaque} style={{padding: '16px 20px'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10}}>
      {['#E5786A', '#E7B551', '#7DB36A'].map((c) => (
        <div key={c} style={{width: 9, height: 9, borderRadius: 5, background: c}} />
      ))}
      <span style={{marginLeft: 8, fontWeight: 600, fontSize: 24}}>{titulo}</span>
    </div>
    <div style={{fontSize: 21, color: COR.cinza, lineHeight: 1.35}}>{children}</div>
  </Folha>
);

// Nó com o asterisco do Claude (coordenador, threads).
export const No: React.FC<{em: number; x: number; y: number; w?: number; titulo: string; sub?: string; grande?: boolean; destaque?: number; ate?: number}> = ({em, x, y, w = 260, titulo, sub, grande, destaque, ate}) => (
  <Folha em={em} x={x} y={y} w={w} destaque={destaque} ate={ate} style={{padding: grande ? '20px 24px' : '14px 18px', display: 'flex', alignItems: 'center', gap: 14}}>
    <Asterisco tamanho={grande ? 46 : 30} />
    <div>
      <div style={{fontWeight: 600, fontSize: grande ? 36 : 24, letterSpacing: -0.5}}>{titulo}</div>
      {sub && <div style={{fontSize: grande ? 22 : 18, color: COR.cinza, marginTop: 2}}>{sub}</div>}
    </div>
  </Folha>
);

// Linha que se desenha de (x1,y1) a (x2,y2), em cotovelo vertical quando "cotovelo".
export const Linha: React.FC<{em: number; x1: number; y1: number; x2: number; y2: number; cor?: string; dur?: number; cotovelo?: boolean; tracejada?: boolean; seta?: boolean}> = ({
  em,
  x1,
  y1,
  x2,
  y2,
  cor = COR.terra,
  dur = 0.5,
  cotovelo,
  tracejada,
  seta,
}) => {
  const p = useEm(em, dur);
  if (p <= 0) return null;
  const meio = (y1 + y2) / 2;
  const d = cotovelo ? `M${x1},${y1} V${meio} H${x2} V${y2}` : `M${x1},${y1} L${x2},${y2}`;
  const comp = cotovelo ? Math.abs(meio - y1) + Math.abs(x2 - x1) + Math.abs(y2 - meio) : Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
      <path d={d} fill="none" stroke={cor} strokeWidth={3} strokeLinecap="round" strokeDasharray={tracejada ? '8 9' : `${comp}`} strokeDashoffset={tracejada ? 0 : comp * (1 - p)} opacity={tracejada ? p : 1} />
      {seta && p > 0.95 && <path d="M-12,-7 L0,0 L-12,7" fill="none" stroke={cor} strokeWidth={3} strokeLinecap="round" transform={`translate(${x2},${y2}) rotate(${cotovelo ? 90 : ang})`} />}
    </svg>
  );
};

// Título de diagrama no topo da área esquerda, com a palavra-chave em marca-texto.
export const TituloDiagrama: React.FC<{em: number; children: React.ReactNode; x?: number; y?: number; tamanho?: number}> = ({em, children, x = 90, y = 70, tamanho = 58}) => {
  const m = useMola(em);
  return (
    <div style={{position: 'absolute', left: x, top: y, fontFamily: FONTE.ui, fontWeight: 600, fontSize: tamanho, letterSpacing: -1.6, color: COR.tinta, opacity: m, transform: `translateY(${(1 - m) * 20}px)`}}>
      {children}
    </div>
  );
};

// Barra de contexto (em %): anima de "de" para "para" entre dois instantes.
export const BarraContexto: React.FC<{x: number; y: number; w: number; valores: [number, number][]; rotulo?: string}> = ({x, y, w, valores, rotulo = 'Contexto'}) => {
  const t = useAgora();
  let v = valores[0][1];
  for (let i = 1; i < valores.length; i++) {
    const [ti, vi] = valores[i];
    const [tp, vp] = valores[i - 1];
    if (t >= ti) v = vi;
    else if (t > tp) v = vp + (vi - vp) * suave(Math.min(1, (t - tp) / Math.max(0.01, ti - tp)));
  }
  const cheio = v > 85;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, fontFamily: FONTE.ui}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
        <span style={{fontSize: 22, letterSpacing: 2, color: COR.cinza, textTransform: 'uppercase'}}>{rotulo}</span>
        <div style={{flex: 1}} />
        <span style={{fontSize: 64, fontWeight: 600, color: cheio ? COR.vermelho : COR.tinta, letterSpacing: -2}}>{Math.round(v)}%</span>
        <span style={{fontSize: 24, color: COR.cinza}}>usado</span>
      </div>
      <div style={{height: 18, borderRadius: 9, background: COR.borda, overflow: 'hidden', marginTop: 10}}>
        <div style={{height: '100%', width: `${v}%`, borderRadius: 9, background: cheio ? COR.vermelho : `linear-gradient(90deg, ${COR.azul} 0 40%, ${COR.terra} 40% 70%, ${COR.salvia} 70% 100%)`}} />
      </div>
    </div>
  );
};

// Ícones de linha grandes para diagramas (traço tinta).
export const IconeGrande: React.FC<{n: 'nuvem' | 'notebook' | 'doc' | 'slides' | 'design' | 'grafico' | 'video' | 'celular' | 'mic' | 'terminal'; t?: number; cor?: string}> = ({n, t = 64, cor = COR.tinta}) => {
  const p: Record<string, React.ReactNode> = {
    nuvem: <path d="M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.2 4.5 4.5 0 0 0 7 18z" />,
    notebook: (
      <>
        <rect x="5" y="5" width="14" height="10" rx="1.5" />
        <path d="M2.5 18.5h19" />
      </>
    ),
    doc: (
      <>
        <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
        <path d="M14 3.5V8h4M9 12h6M9 15.5h6" />
      </>
    ),
    slides: (
      <>
        <rect x="3.5" y="4.5" width="17" height="11" rx="1.5" />
        <path d="M12 15.5V19M8.5 20.5h7" />
      </>
    ),
    design: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="8.5" cy="10" r="1.2" />
        <circle cx="12" cy="7.5" r="1.2" />
        <circle cx="15.5" cy="10" r="1.2" />
      </>
    ),
    grafico: <path d="M5 19V11M10 19V6M15 19v-5M20 19V9M3 19.5h18" />,
    video: (
      <>
        <rect x="3.5" y="6" width="12.5" height="12" rx="2" />
        <path d="M16 10.5l4.5-2.5v8l-4.5-2.5z" />
      </>
    ),
    celular: (
      <>
        <rect x="7" y="3" width="10" height="18" rx="2.2" />
        <path d="M11 18h2" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="3.5" width="6" height="11" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
      </>
    ),
    terminal: (
      <>
        <rect x="3" y="4.5" width="18" height="15" rx="2" />
        <path d="M7 10l3 2.5L7 15M12.5 15.5H17" />
      </>
    ),
  };
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {p[n]}
    </svg>
  );
};

