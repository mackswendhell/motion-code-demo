import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {CameraFalsa} from './_comum';
import {Cartela, Fontes, Mesa} from './demo-tutorial/base';
import {CartelaVao as Transicao} from './demo-tutorial/vaos';

// Cartela de capítulo num vão de 2 s: entra por cima do fim da fala (desfoque + luz), com o som de transição,
// e sai por cima da fala seguinte. Peça em src/estilos/demo-tutorial/vaos.tsx.
const FPS = 30;
const VAO = 2;
const ENTRA = 0.45;

export const CartelaVao: React.FC = () => (
  <AbsoluteFill>
    <Fontes />
    <CameraFalsa />
    <Sequence from={Math.round((2 - ENTRA) * FPS)} durationInFrames={Math.round((ENTRA + VAO + 0.45) * FPS)}>
      <Transicao vao={VAO} entra={ENTRA}>
        <Mesa>
          <Cartela em={-1} num={3} titulo="Referências" />
        </Mesa>
      </Transicao>
    </Sequence>
  </AbsoluteFill>
);
