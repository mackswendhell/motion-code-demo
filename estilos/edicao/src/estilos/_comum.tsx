import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const suave = Easing.inOut(Easing.cubic);

// Progresso 0 → 1 que começa no segundo `inicio` e dura `duracao` segundos.
export const useEntrada = (inicio: number, duracao = 0.6) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return interpolate(frame, [inicio * fps, (inicio + duracao) * fps], [0, 1], {...clamp, easing: suave});
};

// ponytail: silhueta no lugar da sua câmera, para os exemplos rodarem sem nenhum vídeo.
// Num projeto real, aqui entra <Video src={staticFile('<NNN. slug>/video/master.mp4')} />.
export const CameraFalsa: React.FC<{fundo?: string; cor?: string; preencher?: boolean}> = ({
  fundo = '#3a332c',
  cor = '#5b5147',
  preencher = false,
}) => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 50% 30%, ${fundo}, #0d0c0b 85%)`}}>
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio={preencher ? 'xMidYMid slice' : 'xMidYMax meet'}
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <circle cx="50" cy="50" r="14" fill={cor} />
      <path d="M20 100 C22 76 35 68 50 68 C65 68 78 76 80 100 Z" fill={cor} />
    </svg>
  </AbsoluteFill>
);
