import React, {createContext, useContext, useEffect, useState} from 'react';
import {AbsoluteFill, Easing, Sequence, continueRender, delayRender, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Estilo "papel recortado leve": papel creme com grão, folhas com borda de tesoura, fita terracota,
// texto 3D em papel e câmera colada com borda branca. Criado no projeto 003 (harness).
// Tempos sempre em segundos absolutos do master; dentro de <Cena>, useAgora() já soma o início.

export const COR = {
  papel: '#F0EEE6',
  papelClaro: '#FAF9F5',
  tinta: '#141413',
  tintaSuave: '#3D3929',
  cinza: '#6B675C',
  borda: '#E3DED2',
  terra: '#D97757',
  terraEscuro: '#B5532F',
  terraFundo: '#8E3E22',
  salvia: '#788C5D',
  salviaEscuro: '#55663F',
  vermelho: '#C0453A',
};
export const FONTE = {
  titulo: "'Newsreader', Georgia, serif",
  ui: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', Menlo, monospace",
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const suave = Easing.bezier(0.65, 0, 0.35, 1);

const FONTES_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,500;1,6..72,600&display=block';

export const Fontes: React.FC = () => {
  const [h] = useState(() => delayRender('fontes'));
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTES_URL;
    link.onload = () =>
      Promise.all(
        ['600 40px Newsreader', 'italic 600 40px Newsreader', '400 40px Inter', '600 40px Inter', '800 40px Inter', '400 40px "JetBrains Mono"', '700 40px "JetBrains Mono"'].map((x) =>
          document.fonts.load(x),
        ),
      )
        .then(() => continueRender(h))
        .catch(() => continueRender(h));
    link.onerror = () => continueRender(h);
    document.head.appendChild(link);
  }, [h]);
  return null;
};

// Cada cena conhece o próprio início; os gatilhos são sempre segundos absolutos do master.
const CenaCtx = createContext({de: 0, ate: 0});

export const useAgora = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {de} = useContext(CenaCtx);
  return frame / fps + de;
};
export const useCena = () => useContext(CenaCtx);

export const useEm = (em: number, dur = 0.5) => {
  const t = useAgora();
  return interpolate(t, [em, em + dur], [0, 1], {...clamp, easing: suave});
};

export const useMola = (em: number, damping = 15) => {
  const t = useAgora();
  const {fps} = useVideoConfig();
  return spring({frame: Math.max(0, (t - em) * fps), fps, config: {damping, stiffness: 120}});
};

// Borda rasgada que atravessa a tela da esquerda para a direita.
const rasgo = (p: number, inverso = false) => {
  const borda = interpolate(p, [0, 1], [-6, 108]);
  const pts: string[] = [];
  for (let i = 0; i <= 30; i++) {
    const y = (i / 30) * 100;
    const jag = (((i * 37) % 11) - 5) * 0.45 + (i % 2 ? 1.1 : -0.6);
    pts.push(`${borda + jag}% ${y}%`);
  }
  return inverso ? `polygon(${pts.join(',')}, 100% 100%, 100% 0%)` : `polygon(0% 0%, ${pts.join(',')}, 0% 100%)`;
};

type Trans = 'rasgo' | 'fade' | 'corte';

export const Cena: React.FC<{de: number; ate: number; entrada?: Trans; saida?: Trans; children: React.ReactNode}> = ({
  de,
  ate,
  entrada = 'fade',
  saida = 'fade',
  children,
}) => {
  const {fps} = useVideoConfig();
  const de_ = Math.round(de * fps);
  return (
    <Sequence from={de_} durationInFrames={Math.round(ate * fps) - de_} premountFor={fps}>
      <CenaCtx.Provider value={{de, ate}}>
        <Transicao entrada={entrada} saida={saida} de={de} ate={ate}>
          {children}
        </Transicao>
      </CenaCtx.Provider>
    </Sequence>
  );
};

const Transicao: React.FC<{entrada: Trans; saida: Trans; de: number; ate: number; children: React.ReactNode}> = ({entrada, saida, de, ate, children}) => {
  const t = useAgora();
  const pin = interpolate(t, [de, de + (entrada === 'rasgo' ? 0.6 : 0.35)], [0, 1], {...clamp, easing: suave});
  const pout = interpolate(t, [ate - (saida === 'rasgo' ? 0.6 : 0.3), ate], [0, 1], {...clamp, easing: suave});
  let opacity = 1;
  let clipPath: string | undefined;
  if (entrada === 'fade') opacity *= pin;
  if (entrada === 'rasgo' && pin < 1) clipPath = rasgo(pin);
  if (saida === 'fade') opacity *= 1 - pout;
  if (saida === 'rasgo' && pout > 0) clipPath = rasgo(pout, true);
  return <AbsoluteFill style={{opacity, clipPath}}>{children}</AbsoluteFill>;
};

// Fundo de papel creme com grão.
export const Papel: React.FC<{cor?: string; children?: React.ReactNode}> = ({cor = COR.papel, children}) => (
  <AbsoluteFill style={{background: cor}}>
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.4, mixBlendMode: 'multiply'}}>
      <filter id="grao">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.32  0 0 0 0.22 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grao)" />
    </svg>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 45% 40%, transparent 55%, rgba(60,50,30,.13))'}} />
    {children}
  </AbsoluteFill>
);

// Contorno levemente irregular, como folha cortada à tesoura.
export const CORTE = 'polygon(0.6% 1.2%, 25% 0%, 52% 0.9%, 78% 0.2%, 99.4% 0.8%, 100% 30%, 99.3% 62%, 100% 98.8%, 74% 100%, 47% 99.2%, 22% 100%, 0.4% 99.4%, 0% 70%, 0.7% 36%)';

// Folha de papel recortada com sombra macia (a sombra fica num irmão para o clip-path não cortá-la).
export const Folha: React.FC<{cor?: string; style?: React.CSSProperties; children?: React.ReactNode}> = ({cor = COR.papelClaro, style, children}) => (
  <div style={{position: 'absolute', filter: 'drop-shadow(0 18px 26px rgba(60,40,20,.22)) drop-shadow(0 3px 3px rgba(60,40,20,.18))', ...style}}>
    <div style={{position: 'absolute', inset: 0, background: cor, clipPath: CORTE}} />
    <div style={{position: 'relative', width: '100%', height: '100%'}}>{children}</div>
  </div>
);

export const Fita: React.FC<{style?: React.CSSProperties; giro?: number}> = ({style, giro = -35}) => (
  <div style={{position: 'absolute', width: 130, height: 38, background: 'rgba(217,119,87,.72)', transform: `rotate(${giro}deg)`, boxShadow: '0 2px 4px rgba(0,0,0,.1)', ...style}} />
);

// Texto 3D em papel: camadas empilhadas dão a extrusão; entra girando em perspectiva.
export const Texto3D: React.FC<{
  em: number;
  children: React.ReactNode;
  tamanho?: number;
  cor?: string;
  lado?: string;
  italico?: boolean;
  fonte?: string;
  profundidade?: number;
  style?: React.CSSProperties;
}> = ({em, children, tamanho = 160, cor = COR.terra, lado = COR.terraFundo, italico = true, fonte = FONTE.titulo, profundidade = 14, style}) => {
  const m = useMola(em, 13);
  const t = useAgora();
  const balanco = Math.sin((t - em) * 1.3) * 3 * m;
  const sombra = Array.from({length: profundidade}, (_, i) => `${i + 1}px ${i + 1}px 0 ${lado}`).join(', ');
  return (
    <div style={{position: 'absolute', perspective: 1400, ...style}}>
      <div
        style={{
          fontFamily: fonte,
          fontStyle: italico ? 'italic' : 'normal',
          fontWeight: 600,
          fontSize: tamanho,
          lineHeight: 1,
          letterSpacing: -tamanho * 0.02,
          color: cor,
          whiteSpace: 'nowrap',
          textShadow: `${sombra}, ${profundidade + 6}px ${profundidade + 14}px 30px rgba(60,30,10,.35)`,
          opacity: Math.min(1, m * 1.6),
          transform: `rotateX(${(1 - m) * 75}deg) rotateY(${-8 + balanco}deg) translateY(${(1 - m) * 60}px)`,
          transformOrigin: '50% 100%',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Palavras que entram uma a uma, cada uma no seu tempo da fala.
export const Palavras: React.FC<{itens: [string, number][]; tamanho?: number; cor?: string; destaque?: string[]; style?: React.CSSProperties}> = ({
  itens,
  tamanho = 72,
  cor = COR.tinta,
  destaque = [],
  style,
}) => {
  const t = useAgora();
  return (
    <div style={{position: 'absolute', fontFamily: FONTE.titulo, fontWeight: 600, fontSize: tamanho, lineHeight: 1.08, letterSpacing: -1.5, color: cor, ...style}}>
      {itens.map(([w, em], i) => {
        const p = interpolate(t, [em - 0.05, em + 0.3], [0, 1], {...clamp, easing: suave});
        const d = destaque.includes(w);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginRight: tamanho * 0.22,
              opacity: p,
              transform: `translateY(${(1 - p) * tamanho * 0.35}px)`,
              color: d ? COR.terra : undefined,
              fontStyle: d ? 'italic' : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Asterisco do Claude em papel (forma simples, sem o logotipo).
export const Asterisco: React.FC<{size: number; cor?: string; style?: React.CSSProperties}> = ({size, cor = COR.terra, style}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={style}>
    {Array.from({length: 12}).map((_, i) => (
      <rect key={i} x={-4} y={-46} width={8} height={40} rx={4} fill={cor} transform={`rotate(${i * 30 + (i % 2 ? 4 : 0)})`} />
    ))}
  </svg>
);

// Câmera colada no papel: borda branca + sombra macia. k = 0 (tela cheia) → 1 (card assentado).
export const molduraColada = (k: number) =>
  k > 0.02 ? `0 0 0 ${10 * k}px ${COR.papelClaro}, 0 30px 70px rgba(50,30,10,${0.4 * k})` : 'none';

// Meia tela: faixa de papel à esquerda (0–760) e câmera em FORMATOS_CARD.meia colada à direita.
export const MEIA_TELA = {faixa: 760, camera: {l: 760, t: 0}};
