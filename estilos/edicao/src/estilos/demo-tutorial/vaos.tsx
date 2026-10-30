import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraDemo, Crono} from './camera';
import {clamp, suave} from './base';
import somCartela from './sons/cartela.m4a';

// Vãos abertos na fala contínua (clipes que tocam sozinhos e cartelas de capítulo).
// Ponto de cada vão: SEMPRE de tools/vaos.py (silêncio medido), nunca da borda de palavra do Whisper.
// [ponto no master, duração, id]; tudo em quadros inteiros (arredonde antes de montar a lista).
export type Vao = [number, number, string];

export const offEm = (vaos: Vao[], m: number) => vaos.reduce((s, [p, d]) => (p <= m ? s + d : s), 0);
export const duracaoFinal = (vaos: Vao[], master: number) => master + vaos.reduce((s, [, d]) => s + d, 0);
export const trechos = (vaos: Vao[], master: number): [number, number][] => {
  const pts = [...new Set([0, ...vaos.map((v) => v[0]), master])].sort((a, b) => a - b);
  return pts.slice(0, -1).map((p, i) => [p, pts[i + 1]]);
};

// Câmera e fala do master trecho a trecho, cortadas exatamente no ponto (que já está no meio do silêncio).
// Sem cauda depois do ponto: com 20–100 ms entre as frases, qualquer cauda leva a 1ª sílaba da frase seguinte para
// dentro do vão (no 007, 0,15 s de cauda deixou o começo da fala no início da música de cada capítulo).
// Rampa de 1 quadro nas emendas, só para não estalar.
export const CameraEFalaComVaos: React.FC<{src: string; crono: Crono; vaos: Vao[]; master: number}> = ({src, crono, vaos, master}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {trechos(vaos, master).map(([de, ate]) => {
        const off = offEm(vaos, de);
        const ini = Math.round((de + off) * fps);
        const n = Math.round((ate + off) * fps) - ini;
        const volume = (f: number) => Math.min(de === 0 ? 1 : interpolate(f, [0, 1], [0, 1], clamp), ate >= master ? 1 : interpolate(f, [n - 1, n], [1, 0], clamp));
        return (
          <Sequence key={de} from={ini} durationInFrames={n}>
            <CameraDemo crono={crono} src={src} de={de} muted />
            <Audio src={src} trimBefore={Math.round(de * fps)} volume={volume} />
          </Sequence>
        );
      })}
    </>
  );
};

// Clipe que toca sozinho no vão: inteiro e SEMPRE com o som dele. Lado a lado (original × editado): o som do resultado.
export const ClipeNoVao: React.FC<{src: string; volume?: number; fit?: 'contain' | 'cover'; mudo?: boolean}> = ({src, volume = 1, fit = 'contain', mudo}) => (
  <OffthreadVideo src={src} muted={mudo} volume={volume} style={{width: '100%', height: '100%', objectFit: fit}} />
);

// Cartela de capítulo num vão: entra POR CIMA do fim da fala (desfoque + faixa de luz), segura, e sai por cima do começo
// da fala seguinte, com o som de transição do canal. Monte num Sequence que começa `entra` segundos antes do vão
// e dura entra + vão + sai; o conteúdo (número e título) vem em children.
export const CartelaVao: React.FC<{vao: number; entra?: number; sai?: number; volume?: number; children: React.ReactNode}> = ({vao, entra = 0.45, sai = 0.45, volume = 0.9, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const total = entra + vao + sai;
  const e = interpolate(t, [0, entra], [0, 1], {...clamp, easing: suave});
  const s = interpolate(t, [entra + vao, total], [0, 1], {...clamp, easing: suave});
  const p = e * (1 - s);
  const luz = (k: number) => `linear-gradient(105deg, transparent ${k - 18}%, rgba(255,250,235,.55) ${k}%, transparent ${k + 18}%)`;
  const somVol = (f: number) => volume * Math.min(interpolate(f, [0, 0.15 * fps], [0, 1], clamp), interpolate(f, [(total - 0.5) * fps, total * fps], [1, 0], clamp));
  return (
    <AbsoluteFill>
      <Audio src={somCartela} volume={somVol} />
      <AbsoluteFill style={{backdropFilter: `blur(${22 * p}px)`, WebkitBackdropFilter: `blur(${22 * p}px)`, background: `rgba(0,0,0,${0.35 * p})`}} />
      <AbsoluteFill style={{opacity: p, filter: `blur(${(1 - p) * 18}px)`, transform: `scale(${1.05 - 0.05 * p})`}}>{children}</AbsoluteFill>
      {e < 1 && <AbsoluteFill style={{background: luz(-20 + 140 * e), mixBlendMode: 'screen', opacity: Math.sin(Math.PI * e)}} />}
      {s > 0 && <AbsoluteFill style={{background: luz(-20 + 140 * s), mixBlendMode: 'screen', opacity: Math.sin(Math.PI * s)}} />}
    </AbsoluteFill>
  );
};
