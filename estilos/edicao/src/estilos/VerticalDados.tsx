import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraFalsa, clamp, suave, useEntrada} from './_comum';

// Estilo "dados leves" (9:16): fundo claro com gradiente suave, número que conta até o valor falado
// e barras que crescem uma por vez. A câmera vira um círculo no topo para manter presença humana.

const COR = {tinta: '#1B1A33', suave: '#6B6A85', a: '#6C5CE7', b: '#00B8D9', c: '#FF7AB6', trilho: 'rgba(27,26,51,.08)'};
const FONTE = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const barras = [
  {rotulo: 'Sem edição', valor: 0.24, cor: COR.suave, em: 3.0},
  {rotulo: 'Com legendas', valor: 0.52, cor: COR.b, em: 3.4},
  {rotulo: 'Com motion', valor: 0.87, cor: COR.a, em: 3.8},
];

const Barra: React.FC<(typeof barras)[number]> = ({rotulo, valor, cor, em}) => {
  const p = useEntrada(em, 0.8);
  return (
    <div style={{opacity: Math.min(1, p * 3)}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 38, color: COR.tinta}}>
        <span>{rotulo}</span>
        <span style={{fontWeight: 700}}>{Math.round(valor * 100 * p)}%</span>
      </div>
      <div style={{height: 34, borderRadius: 17, background: COR.trilho, marginTop: 14}}>
        <div style={{height: '100%', width: `${valor * 100 * p}%`, borderRadius: 17, background: cor}} />
      </div>
    </div>
  );
};

export const VerticalDados: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const circulo = useEntrada(0.1, 0.8);
  const numero = Math.round(interpolate(frame, [0.8 * fps, 2.4 * fps], [0, 87], {...clamp, easing: suave}));
  const texto = useEntrada(1.0, 0.6);

  return (
    <AbsoluteFill style={{fontFamily: FONTE, background: 'linear-gradient(160deg, #F4F1FF 0%, #E8F7FB 55%, #FFEFF6 100%)'}}>
      <div
        style={{
          position: 'absolute', left: '50%', top: 150, width: 380, height: 380, marginLeft: -190, borderRadius: '50%', overflow: 'hidden',
          border: `8px solid white`, boxShadow: '0 30px 70px rgba(108,92,231,.3)', transform: `scale(${circulo})`,
        }}
      >
        <CameraFalsa fundo="#5d587a" cor="#8a84ad" preencher />
      </div>
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{fontSize: 300, fontWeight: 800, letterSpacing: -12, lineHeight: 1, background: `linear-gradient(90deg, ${COR.a}, ${COR.c})`, WebkitBackgroundClip: 'text', color: 'transparent'}}>
          {numero}%
        </div>
        <div style={{fontSize: 48, color: COR.tinta, marginTop: 10, opacity: texto, transform: `translateY(${(1 - texto) * 20}px)`}}>
          assistem até o fim
        </div>
      </div>
      <div style={{position: 'absolute', left: 110, right: 110, top: 1180, display: 'flex', flexDirection: 'column', gap: 54}}>
        {barras.map((b) => <Barra key={b.rotulo} {...b} />)}
      </div>
      <div style={{position: 'absolute', bottom: 90, left: 0, right: 0, textAlign: 'center', fontSize: 28, color: COR.suave}}>
        dados ilustrativos
      </div>
    </AbsoluteFill>
  );
};
