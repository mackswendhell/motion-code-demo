import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraFalsa, clamp, suave, useEntrada} from './_comum';

// Estilo "print com marca-texto" (9:16): o print ocupa a parte de cima, dá zoom no trecho citado
// e o marca-texto passa exatamente sobre a frase. A câmera fica embaixo.
// Num projeto real, o <PrintFalso /> vira <Img src={staticFile('<NNN. slug>/prints/noticia.png')} />
// e o marca-texto fica DENTRO do mesmo contêiner que dá o zoom, para os dois se moverem juntos.

const COR = {fundo: '#F1EEE8', papel: '#FFFFFF', tinta: '#1A1A1A', cinza: '#9A958C', marca: 'rgba(255,214,0,.55)', acento: '#FF5A36'};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";

const PrintFalso: React.FC<{marca: number}> = ({marca}) => (
  <div style={{width: 900, background: COR.papel, borderRadius: 18, padding: '44px 54px', boxShadow: '0 30px 80px rgba(0,0,0,.18)', fontFamily: SERIF, color: COR.tinta}}>
    <div style={{fontFamily: SANS, fontSize: 22, color: COR.acento, fontWeight: 700, letterSpacing: 3}}>TECNOLOGIA</div>
    <div style={{fontSize: 54, lineHeight: 1.1, marginTop: 14, fontWeight: 700}}>Criadores trocam o editor de vídeo por um agente de IA</div>
    <div style={{fontFamily: SANS, fontSize: 22, color: COR.cinza, marginTop: 18}}>por Redação · 26 set 2026</div>
    <div style={{fontSize: 30, lineHeight: 1.55, marginTop: 30}}>
      A mudança começou com tutoriais simples. Hoje,{' '}
      <span
        style={{
          backgroundImage: `linear-gradient(${COR.marca}, ${COR.marca})`, backgroundRepeat: 'no-repeat',
          backgroundSize: `${marca * 100}% 80%`, backgroundPosition: '0 70%', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
        }}
      >
        quem publica toda semana já monta a edição inteira por conversa
      </span>
      , descrevendo o que quer ver na tela e aprovando o resultado.
    </div>
    <div style={{height: 14, width: '80%', background: '#EEE', borderRadius: 7, marginTop: 30}} />
    <div style={{height: 14, width: '65%', background: '#EEE', borderRadius: 7, marginTop: 16}} />
  </div>
);

export const VerticalPrint: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrada = useEntrada(0.2, 0.8);
  const zoom = interpolate(frame, [1.4 * fps, 2.6 * fps], [1, 1.1], {...clamp, easing: suave});
  const marca = useEntrada(2.8, 0.9);
  const camera = useEntrada(0, 0.8);

  return (
    <AbsoluteFill style={{background: COR.fundo}}>
      <div style={{position: 'absolute', top: 110, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 30, letterSpacing: 6, color: COR.cinza, opacity: entrada}}>
        A FONTE
      </div>
      <div style={{position: 'absolute', top: 190, left: 0, right: 0, height: 900, overflow: 'hidden'}}>
        <div
          style={{
            position: 'absolute', left: 90, top: 60, transformOrigin: '50% 60%',
            transform: `translateY(${(1 - entrada) * 80}px) scale(${zoom})`, opacity: entrada,
          }}
        >
          <PrintFalso marca={marca} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute', left: 60, right: 60, bottom: 70, height: 760, borderRadius: 36, overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,.25)', transform: `translateY(${(1 - camera) * 200}px)`,
        }}
      >
        <CameraFalsa fundo="#56483d" cor="#7a6757" />
      </div>
    </AbsoluteFill>
  );
};
