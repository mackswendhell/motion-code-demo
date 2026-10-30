import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraFalsa, useEntrada} from './_comum';

// Estilo "legenda dinâmica" (9:16, Reels/TikTok/Shorts): câmera cheia, legenda grande palavra por palavra
// com a palavra falada em destaque. Num projeto real, os tempos vêm do palavras.json da transcrição.

const COR = {destaque: '#FFE14D', texto: '#FFFFFF', chip: '#111111'};
const FONTE = "'Arial Black', 'Helvetica Neue', Arial, sans-serif";

const palavras = [
  {w: 'Edite', s: 0.5}, {w: 'vídeos', s: 0.85}, {w: 'conversando', s: 1.2},
  {w: 'com', s: 1.9}, {w: 'o', s: 2.05}, {w: 'Claude.', s: 2.2},
  {w: 'Sem', s: 3.1}, {w: 'programa', s: 3.4}, {w: 'de', s: 3.85}, {w: 'edição.', s: 4.0},
];
const blocos = [palavras.slice(0, 6), palavras.slice(6)];

export const VerticalLegendas: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const bloco = t < 3.0 ? blocos[0] : blocos[1];
  const ativa = [...palavras].reverse().find((p) => t >= p.s);
  const chip = useEntrada(0.2, 0.5);
  const zoom = 1 + 0.06 * (t / 6);

  return (
    <AbsoluteFill style={{background: '#000', fontFamily: FONTE}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <CameraFalsa fundo="#4a3b30" cor="#6d5a4a" preencher />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(transparent 55%, rgba(0,0,0,.55))'}} />
      <div
        style={{
          position: 'absolute', top: 170, left: '50%', transform: `translateX(-50%) scale(${0.8 + 0.2 * chip})`, opacity: chip,
          background: COR.chip, color: COR.destaque, fontSize: 40, padding: '16px 34px', borderRadius: 60, letterSpacing: 2,
        }}
      >
        DICA RÁPIDA
      </div>
      <div
        style={{
          position: 'absolute', left: 70, right: 70, top: 1400, display: 'flex', flexWrap: 'wrap',
          justifyContent: 'center', gap: '10px 22px', fontSize: 96, lineHeight: 1.15, textTransform: 'uppercase',
        }}
      >
        {bloco.filter((p) => t >= p.s).map((p) => {
          const pop = spring({frame: frame - p.s * fps, fps, config: {damping: 14, stiffness: 180}});
          const eAtiva = p === ativa;
          return (
            <span
              key={p.w + p.s}
              style={{
                color: eAtiva ? COR.chip : COR.texto,
                background: eAtiva ? COR.destaque : 'transparent',
                padding: '0 14px', borderRadius: 14,
                transform: `scale(${0.7 + 0.3 * pop})`, display: 'inline-block',
                textShadow: eAtiva ? 'none' : '0 6px 24px rgba(0,0,0,.6)',
              }}
            >
              {p.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
