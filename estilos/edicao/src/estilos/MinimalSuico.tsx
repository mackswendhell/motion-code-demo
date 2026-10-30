import React from 'react';
import {AbsoluteFill} from 'remotion';
import {getSynchronizedSplitState, SynchronizedCameraFrame, SynchronizedSplitPanel} from '../_shared/synchronized-split';
import {CameraFalsa, useEntrada} from './_comum';

// Estilo "minimal suíço" (16:9): fundo branco, tipografia pesada, grid e um único acento vermelho.
// Layout: tela dividida — conteúdo à esquerda, câmera à direita, entrando junto na mesma curva.

const COR = {papel: '#F7F7F5', tinta: '#111111', cinza: '#8A8A8A', acento: '#E4312B', linha: '#DADAD6'};
const FONTE = "'Helvetica Neue', Arial, sans-serif";

const passos = [
  {n: '01', titulo: 'Grave', texto: 'o vídeo já cortado', em: 1.4},
  {n: '02', titulo: 'Mostre', texto: 'prints do que quer animar', em: 2.2},
  {n: '03', titulo: 'Peça', texto: 'a edição ao diretor', em: 3.0},
];

const Passo: React.FC<(typeof passos)[number]> = ({n, titulo, texto, em}) => {
  const p = useEntrada(em);
  return (
    <div style={{display: 'flex', gap: 36, alignItems: 'baseline', opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
      <div style={{fontSize: 40, fontWeight: 700, color: COR.acento, width: 70}}>{n}</div>
      <div style={{borderTop: `3px solid ${COR.tinta}`, paddingTop: 18, width: 820}}>
        <div style={{fontSize: 72, fontWeight: 800, letterSpacing: -2}}>{titulo}</div>
        <div style={{fontSize: 34, color: COR.cinza, marginTop: 6}}>{texto}</div>
      </div>
    </div>
  );
};

export const MinimalSuico: React.FC = () => {
  const split = useEntrada(0.3, 1.1);
  const state = getSynchronizedSplitState(split, {splitCameraLeft: 1250, splitCameraWidth: 620, splitVideoX: -650});
  const titulo = useEntrada(0.9);
  const barra = useEntrada(3.8, 0.8);

  return (
    <AbsoluteFill style={{background: COR.papel, color: COR.tinta, fontFamily: FONTE}}>
      <SynchronizedSplitPanel state={state}>
        <AbsoluteFill style={{padding: '90px 110px'}}>
          <div style={{position: 'absolute', inset: 0, backgroundImage: `linear-gradient(90deg, ${COR.linha} 1px, transparent 1px)`, backgroundSize: '160px 100%', opacity: 0.6}} />
          <div style={{fontSize: 26, fontWeight: 700, letterSpacing: 6, color: COR.acento, opacity: titulo}}>COMO FUNCIONA</div>
          <div style={{fontSize: 96, fontWeight: 800, letterSpacing: -4, lineHeight: 1, marginTop: 18, opacity: titulo}}>
            Edição em<br />três passos.
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 34, marginTop: 70}}>
            {passos.map((p) => <Passo key={p.n} {...p} />)}
          </div>
          <div style={{position: 'absolute', left: 110, bottom: 90, height: 10, width: 1000 * barra, background: COR.acento}} />
        </AbsoluteFill>
      </SynchronizedSplitPanel>
      <SynchronizedCameraFrame state={state} boxShadow="0 20px 60px rgba(0,0,0,.18)">
        <div style={{position: 'absolute', left: state.video.x, top: state.video.y, width: 1920, height: 1080}}>
          <CameraFalsa fundo="#46505a" cor="#6c7782" />
        </div>
      </SynchronizedCameraFrame>
    </AbsoluteFill>
  );
};
