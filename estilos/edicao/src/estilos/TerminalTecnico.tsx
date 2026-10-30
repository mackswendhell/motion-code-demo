import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraFalsa, clamp, useEntrada} from './_comum';

// Estilo "terminal técnico" (16:9): grade fina, fonte mono, texto digitado em tempo real.
// Layout: conteúdo em tela cheia com a câmera num card (picture-in-picture) no canto direito.

const COR = {fundo: '#0B0F0E', grade: 'rgba(120,255,200,.06)', texto: '#D6F5E8', verde: '#5CF2B0', ambar: '#F2B84B', apagado: '#5F7A70'};
const MONO = "Consolas, 'JetBrains Mono', 'Courier New', monospace";

const linhas = [
  {t: '$ claude', cor: COR.verde, em: 0.4},
  {t: '> edita o projeto 001', cor: COR.texto, em: 1.0},
  {t: '  ✓ vídeo lido · 02:14 · 1920×1080 · 30 fps', cor: COR.apagado, em: 2.2},
  {t: '  ✓ 312 palavras com tempo exato', cor: COR.apagado, em: 2.7},
  {t: '  ✓ 4 prints encontrados em prints/', cor: COR.apagado, em: 3.2},
  {t: '  → plano de edição pronto para aprovar', cor: COR.ambar, em: 3.9},
];

const Linha: React.FC<(typeof linhas)[number]> = ({t, cor, em}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // 45 caracteres por segundo, como alguém digitando rápido.
  const chars = Math.floor(interpolate(frame, [em * fps, (em + t.length / 45) * fps], [0, t.length], clamp));
  if (chars === 0) return null;
  return <div style={{color: cor, whiteSpace: 'pre'}}>{t.slice(0, chars)}</div>;
};

export const TerminalTecnico: React.FC = () => {
  const card = useEntrada(0.2, 0.9);
  const janela = useEntrada(0, 0.5);

  return (
    <AbsoluteFill style={{background: COR.fundo, fontFamily: MONO}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COR.grade} 1px, transparent 1px), linear-gradient(90deg, ${COR.grade} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div style={{position: 'absolute', left: 90, top: 70, fontSize: 22, letterSpacing: 4, color: COR.apagado}}>
        NÍVEL 1 · REMOTION
      </div>
      <div
        style={{
          position: 'absolute', left: 90, top: 130, width: 1180, height: 820, borderRadius: 18,
          border: `1px solid rgba(92,242,176,.25)`, background: 'rgba(10,20,17,.85)',
          opacity: janela, transform: `scale(${0.97 + 0.03 * janela})`,
        }}
      >
        <div style={{display: 'flex', gap: 12, padding: '22px 26px', borderBottom: '1px solid rgba(92,242,176,.15)'}}>
          {['#F26B5C', '#F2B84B', '#5CF2B0'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
        </div>
        <div style={{padding: '40px 48px', fontSize: 38, lineHeight: 1.7}}>
          {linhas.map((l) => <Linha key={l.t} {...l} />)}
        </div>
      </div>
      <div
        style={{
          position: 'absolute', right: 90, bottom: 130, width: 460, height: 560, borderRadius: 24, overflow: 'hidden',
          border: `2px solid ${COR.verde}`, boxShadow: '0 0 60px rgba(92,242,176,.25)',
          opacity: card, transform: `translateY(${(1 - card) * 60}px)`,
        }}
      >
        <CameraFalsa fundo="#1d2b27" cor="#35514a" />
      </div>
    </AbsoluteFill>
  );
};
