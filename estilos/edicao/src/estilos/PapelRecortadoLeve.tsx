import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {enquadrarRosto, FORMATOS_CARD, type ZonaRosto} from '../_shared/synchronized-split';
import {CameraFalsa} from './_comum';
import {CC} from './claude-code';
import {COR, FONTE, Fita, Folha, Fontes, MEIA_TELA, Palavras, Papel, Texto3D, molduraColada, suave, useEm} from './papel-recortado';

// Estilo "papel recortado leve" (16:9): aula em papel creme, câmera colada com borda branca e fita,
// texto 3D de papel, e a variação "meia tela" (faixa de papel à esquerda, câmera em altura total à direita).

// Zona do rosto da silhueta de exemplo. Num projeto real, vem da prancha de 1 quadro por segundo.
const ROSTO: ZonaRosto = {x0: 800, y0: 380, x1: 1120, y1: 700};
type Ret = {l: number; t: number; w: number; h: number; r: number; vs: number; vx: number; vy: number};
const card = (l: number, t: number, w: number, h: number, r = 30): Ret => {
  const e = enquadrarRosto({w, h}, ROSTO);
  return {l, t, w, h, r, vs: e.scale, vx: e.x, vy: e.y};
};
const CHEIA: Ret = {l: 0, t: 0, w: 1920, h: 1080, r: 0, vs: 1, vx: 0, vy: 0};
const VERT = card(1300, 105, FORMATOS_CARD.vertical.w, FORMATOS_CARD.vertical.h);
const MEIA = card(MEIA_TELA.camera.l, MEIA_TELA.camera.t, FORMATOS_CARD.meia.w, FORMATOS_CARD.meia.h, 0);
const CAMERA: [number, Ret, number][] = [
  [0.3, VERT, 0.9],
  [3.3, MEIA, 0.9],
];

const retEm = (t: number) => {
  let cur = CHEIA;
  for (const [ini, lay, dur] of CAMERA) {
    if (t < ini) break;
    const p = suave(Math.min(1, (t - ini) / dur));
    const o = {} as Ret;
    (Object.keys(cur) as (keyof Ret)[]).forEach((k) => (o[k] = cur[k] + (lay[k] - cur[k]) * p));
    cur = o;
  }
  return cur;
};

const Camera: React.FC = () => {
  const {fps} = useVideoConfig();
  const c = retEm(useCurrentFrame() / fps);
  const k = Math.min(1, c.r / 24);
  return (
    <>
      <div style={{position: 'absolute', left: c.l, top: c.t, width: c.w, height: c.h, overflow: 'hidden', borderRadius: c.r, boxShadow: molduraColada(k)}}>
        <div style={{position: 'absolute', left: c.vx, top: c.vy, width: 1920 * c.vs, height: 1080 * c.vs}}>
          <CameraFalsa />
        </div>
      </div>
      {k > 0.8 && <Fita giro={-32} style={{left: c.l - 46, top: c.t + 8, opacity: (k - 0.8) * 5}} />}
    </>
  );
};

const Linha: React.FC<{em: number; y: number; n: string; nome: string; codigo: string}> = ({em, y, n, nome, codigo}) => {
  const p = useEm(em, 0.5);
  return (
    <div style={{position: 'absolute', left: 90, top: y, opacity: p, transform: `translateX(${(1 - p) * -60}px) rotate(${(1 - p) * -3 - 0.6}deg)`}}>
      <Folha style={{width: 1060, height: 150}}>
        <div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 34px', gap: 28}}>
          <div style={{fontFamily: FONTE.mono, fontWeight: 700, fontSize: 30, color: COR.terra}}>{n}</div>
          <div style={{fontFamily: FONTE.titulo, fontWeight: 600, fontSize: 52, color: COR.tinta, width: 330}}>{nome}</div>
          <div style={{background: CC.fundo, color: CC.texto, borderRadius: 10, padding: '12px 18px', fontFamily: FONTE.mono, fontSize: 24}}>
            <span style={{color: CC.verde}}>⏺ </span>
            {codigo}
          </div>
        </div>
      </Folha>
    </div>
  );
};

const Faixa: React.FC = () => {
  const p = useEm(3.3, 0.8);
  return (
    <Folha cor={COR.papel} style={{left: -30, top: -30, width: (MEIA_TELA.faixa + 30) * p, height: 1140}}>
      <Papel cor="transparent" />
    </Folha>
  );
};

export const PapelRecortadoLeve: React.FC = () => {
  const {fps} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const aula = 1 - useEm(3.2, 0.4);
  return (
    <AbsoluteFill>
      <Fontes />
      <Papel>
        <AbsoluteFill style={{opacity: aula}}>
          <Texto3D em={1.0} tamanho={120} profundidade={11} style={{left: 80, top: 110}}>
            papel recortado
          </Texto3D>
          <Linha em={1.6} y={360} n="01" nome="Contexto" codigo="Read(CLAUDE.md)" />
          <Linha em={2.0} y={540} n="02" nome="Ferramentas" codigo="Bash(npm test)" />
          <Linha em={2.4} y={720} n="03" nome="Aprovação" codigo="Yes, proceed" />
        </AbsoluteFill>
      </Papel>
      <Camera />
      {t >= 3.3 && (
        <AbsoluteFill>
          <Faixa />
          <Palavras
            itens={[
              ['meia', 3.8],
              ['tela,', 3.95],
              ['câmera', 4.1],
              ['colada', 4.25],
            ]}
            destaque={['colada']}
            tamanho={62}
            style={{left: 80, top: 330, width: 620}}
          />
          <Texto3D em={4.5} tamanho={190} style={{left: 70, top: 540}}>
            leve
          </Texto3D>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
