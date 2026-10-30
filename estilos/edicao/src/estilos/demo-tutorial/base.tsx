import React, {createContext, useContext, useEffect, useState} from 'react';
import {AbsoluteFill, Easing, Freeze, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Estilo Demo Tutorial: o Claude desktop reconstruído em camadas sobre uma mesa creme, câmera em card.
// Todos os tempos são segundos absolutos do vídeo gravado (os mesmos do palavras.json).

// Mesa creme (fundo das telas divididas) e o app escuro, com as cores amostradas dos prints do app real (tema escuro, out/2026).
export const COR = {
  mesa: '#F0EEE6',
  mesaClara: '#FAF9F5',
  grade: 'rgba(61,57,41,.07)',
  tinta: '#141413',
  cinza: '#6B675C',
  borda: '#E3DED2',
  terra: '#D97757',
  terraEscuro: '#B5532F',
  salvia: '#788C5D',
  vermelho: '#C0453A',
  azul: '#4C8DDB',
};
export const APP = {
  fundo: '#252525',
  lateral: '#2B2B2B',
  caixa: '#3B3B3B',
  bolha: '#323232',
  sel: '#3A3A3A',
  linha: '#414141',
  cartao: '#262626',
  bordaCartao: '#3A3A3A',
  texto: '#ECECEA',
  apagado: '#A5A5A5',
  fraco: '#7D7D7B',
  link: '#7FB2EE',
  verde: '#8DBB76',
};
export const FONTE = {
  ui: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  serifa: "'Newsreader', Georgia, serif",
  mono: "'JetBrains Mono', Menlo, monospace",
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const suave = Easing.bezier(0.65, 0, 0.35, 1);

const FONTES_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=block';

export const Fontes: React.FC = () => {
  const [h] = useState(() => delayRender('fontes'));
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTES_URL;
    link.onload = () =>
      Promise.all(['400 40px Newsreader', '500 40px Newsreader', '400 40px Inter', '500 40px Inter', '600 40px Inter', '400 40px "JetBrains Mono"'].map((x) => document.fonts.load(x)))
        .then(() => continueRender(h))
        .catch(() => continueRender(h));
    link.onerror = () => continueRender(h);
    document.head.appendChild(link);
  }, [h]);
  return null;
};

// Cada cena conhece o próprio início; todos os gatilhos são segundos absolutos do master.
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

export const useMola = (em: number, damping = 18) => {
  const t = useAgora();
  const {fps} = useVideoConfig();
  // a mola já assentou em 4 s; limitar evita calcular dezenas de milhares de quadros
  return spring({frame: Math.max(0, Math.min(4, t - em) * fps), fps, config: {damping, stiffness: 130}});
};

// off: quanto a cena anda na linha do tempo final em relação ao master (vãos abertos antes dela); os gatilhos seguem em tempo do master.
export const Cena: React.FC<{de: number; ate: number; off?: number; entrada?: 'fade' | 'corte'; saida?: 'fade' | 'corte'; children: React.ReactNode}> = ({
  de,
  ate,
  off = 0,
  entrada = 'fade',
  saida = 'corte',
  children,
}) => {
  const {fps} = useVideoConfig();
  const f = (s: number) => Math.round((s + off) * fps);
  return (
    <Sequence from={f(de)} durationInFrames={f(ate) - f(de)} premountFor={30}>
      <CenaCtx.Provider value={{de, ate}}>
        <Transicao entrada={entrada} saida={saida} de={de} ate={ate}>
          {children}
        </Transicao>
      </CenaCtx.Provider>
    </Sequence>
  );
};

const Transicao: React.FC<{entrada: string; saida: string; de: number; ate: number; children: React.ReactNode}> = ({entrada, saida, de, ate, children}) => {
  const t = useAgora();
  let opacity = 1;
  if (entrada === 'fade') opacity *= interpolate(t, [de, de + 0.4], [0, 1], clamp);
  if (saida === 'fade') opacity *= interpolate(t, [ate - 0.35, ate], [1, 0], clamp);
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

// Mesa creme com quadriculado fino, a superfície onde ficam o app e a câmera.
export const Mesa: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: COR.mesa}}>
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${COR.grade} 1px, transparent 1px), linear-gradient(90deg, ${COR.grade} 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        backgroundPosition: '-1px -1px',
      }}
    />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 45% 40%, transparent 60%, rgba(60,50,30,.10))'}} />
    {children}
  </AbsoluteFill>
);

// Asterisco do Claude desenhado (12 raios), sem usar o logotipo.
export const Asterisco: React.FC<{tamanho?: number; cor?: string; giro?: number; style?: React.CSSProperties}> = ({tamanho = 40, cor = COR.terra, giro = 0, style}) => (
  <svg width={tamanho} height={tamanho} viewBox="-50 -50 100 100" style={{transform: `rotate(${giro}deg)`, ...style}}>
    {Array.from({length: 12}).map((_, i) => (
      <rect key={i} x={-4.5} y={-46} width={9} height={40} rx={4.5} fill={cor} transform={`rotate(${i * 30 + (i % 2 ? 4 : 0)})`} />
    ))}
  </svg>
);

// Etiqueta no estilo da interface do Claude: cartão claro, borda fina, texto escuro; destaque terracota.
export const Chip: React.FC<{em: number; texto: React.ReactNode; tom?: 'claro' | 'terra' | 'escuro' | 'salvia'; tamanho?: number; risca?: number; mono?: boolean; style?: React.CSSProperties}> = ({
  em,
  texto,
  tom = 'claro',
  tamanho = 34,
  risca,
  mono,
  style,
}) => {
  const m = useMola(em);
  const r = useEm(risca ?? 1e9, 0.35);
  const c = {
    claro: {bg: COR.mesaClara, fg: COR.tinta, b: COR.borda},
    terra: {bg: COR.terra, fg: '#fff', b: COR.terraEscuro},
    escuro: {bg: APP.fundo, fg: APP.texto, b: APP.linha},
    salvia: {bg: COR.salvia, fg: '#fff', b: '#5f7149'},
  }[tom];
  return (
    <div
      style={{
        position: 'absolute',
        display: 'inline-flex',
        alignItems: 'center',
        gap: tamanho * 0.35,
        padding: `${tamanho * 0.34}px ${tamanho * 0.62}px`,
        background: c.bg,
        color: c.fg,
        border: `1.5px solid ${c.b}`,
        borderRadius: tamanho * 0.4,
        fontFamily: mono ? FONTE.mono : FONTE.ui,
        fontWeight: mono ? 500 : 600,
        fontSize: tamanho,
        letterSpacing: mono ? 0 : -0.3,
        whiteSpace: 'nowrap',
        boxShadow: '0 14px 34px rgba(40,30,15,.14)',
        opacity: m * (1 - r * 0.45),
        transform: `translateY(${(1 - m) * 24}px) scale(${0.9 + 0.1 * m})`,
        transformOrigin: 'left center',
        ...style,
      }}
    >
      {texto}
      {r > 0 && <div style={{position: 'absolute', left: 10, right: 10, top: '52%', height: 4, background: COR.vermelho, transform: `scaleX(${r})`, transformOrigin: 'left'}} />}
    </div>
  );
};

// Marca-texto terracota que cresce da esquerda para a direita.
export const Marca: React.FC<{em: number; children: React.ReactNode; cor?: string}> = ({em, children, cor = 'rgba(217,119,87,.32)'}) => {
  const p = useEm(em, 0.45);
  return (
    <span style={{backgroundImage: `linear-gradient(${cor}, ${cor})`, backgroundRepeat: 'no-repeat', backgroundSize: `${p * 100}% 100%`, borderRadius: 4, padding: '0 3px', margin: '0 -3px'}}>
      {children}
    </span>
  );
};

// Texto digitado no ritmo da fala: de → ate, com cursor piscando.
export const useDigitado = (texto: string, de: number, ate: number) => {
  const t = useAgora();
  const n = Math.round(interpolate(t, [de, ate], [0, texto.length], clamp));
  return {texto: texto.slice(0, n), digitando: t >= de && t < ate + 0.6, comecou: t >= de};
};

// Cartela de capítulo: "01 / 07" + título com a palavra-chave em marca-texto.
export const Cartela: React.FC<{em: number; num: number; titulo: React.ReactNode; sub?: string; style?: React.CSSProperties}> = ({em, num, titulo, sub, style}) => {
  const m = useMola(em);
  const barra = useEm(em + 0.2, 0.6);
  return (
    <div style={{position: 'absolute', left: 110, top: 380, width: 1050, opacity: m, transform: `translateY(${(1 - m) * 30}px)`, ...style}}>
      <div style={{fontFamily: FONTE.mono, fontSize: 30, color: COR.terra, letterSpacing: 2}}>{String(num).padStart(2, '0')} / 07</div>
      <div style={{fontFamily: FONTE.ui, fontWeight: 600, fontSize: 92, color: COR.tinta, letterSpacing: -2.5, lineHeight: 1.05, marginTop: 18}}>{titulo}</div>
      {sub && <div style={{fontFamily: FONTE.ui, fontSize: 34, color: COR.cinza, marginTop: 22}}>{sub}</div>}
      <div style={{display: 'flex', gap: 10, marginTop: 40}}>
        {Array.from({length: 7}).map((_, i) => (
          <div key={i} style={{width: 46, height: 6, borderRadius: 3, background: i + 1 === num ? COR.terra : COR.borda, transform: i + 1 === num ? `scaleX(${barra})` : undefined, transformOrigin: 'left'}} />
        ))}
      </div>
    </div>
  );
};

// B-roll em tela cheia (src já resolvido com staticFile). Se o clipe for mais curto que a cena, desacelera até 0,7× e congela no fim.
export const Broll: React.FC<{src: string; duracaoClipe: number}> = ({src, duracaoClipe}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {de, ate} = useContext(CenaCtx);
  const cena = ate - de;
  const rate = Math.min(1.6, Math.max(0.7, duracaoClipe / cena));
  const fim = Math.floor(((duracaoClipe - 0.15) / rate) * fps);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Freeze frame={fim} active={frame >= fim}>
        <OffthreadVideo src={src} muted playbackRate={rate} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </Freeze>
    </AbsoluteFill>
  );
};
