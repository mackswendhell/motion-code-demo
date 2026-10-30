import React from 'react';
import {interpolate} from 'remotion';
import {COR, FONTE, clamp, useAgora} from './papel-recortado';

// Claude Code no terminal (CLI), tema escuro padrão.
export const CC = {
  fundo: '#141413',
  barra: '#232220',
  texto: '#E8E6DC',
  apagado: '#8F8D85',
  laranja: '#D97757',
  verde: '#7FB069',
  vermelho: '#E06C5F',
  linha: '#3A3936',
};

export const Terminal: React.FC<{largura: number; altura: number; titulo?: string; fonte?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  largura,
  altura,
  titulo = 'claude — ~/projetos/relatorio',
  fonte = 24,
  style,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      width: largura,
      height: altura,
      background: CC.fundo,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 30px 70px rgba(40,25,10,.38), 0 0 0 1.5px #000',
      fontFamily: FONTE.mono,
      fontSize: fonte,
      lineHeight: 1.45,
      color: CC.texto,
      ...style,
    }}
  >
    <div style={{height: 46, background: CC.barra, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 9}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
      ))}
      <div style={{flex: 1, textAlign: 'center', fontFamily: FONTE.ui, fontSize: 17, color: CC.apagado, marginRight: 60}}>{titulo}</div>
    </div>
    <div style={{padding: '18px 26px', position: 'relative', height: altura - 46, display: 'flex', flexDirection: 'column'}}>{children}</div>
  </div>
);

const Mascote: React.FC<{size: number}> = ({size}) => (
  <div style={{color: CC.laranja, fontSize: size, lineHeight: 1.05, whiteSpace: 'pre', fontFamily: FONTE.mono}}>
    {' ▐▛███▜▌\n▝▜█████▛▘\n  ▘▘ ▝▝'}
  </div>
);

// Tela inicial do Claude Code.
export const BoasVindas: React.FC<{nome: string}> = ({nome}) => (
  <div style={{border: `1.5px solid ${CC.laranja}`, borderRadius: 10, position: 'relative', display: 'flex', padding: '26px 10px 18px', marginTop: 12}}>
    <div style={{position: 'absolute', top: -15, left: 22, background: CC.fundo, padding: '0 10px', color: CC.laranja}}>
      Claude Code <span style={{color: CC.apagado}}>v2.4.1</span>
    </div>
    <div style={{flex: 1.15, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
      <div style={{fontWeight: 700}}>Welcome back {nome}!</div>
      <Mascote size={34} />
      <div style={{color: CC.apagado, fontSize: '0.85em', textAlign: 'center'}}>
        Opus 5.5 · Claude Max
        <br />
        ~/projetos/relatorio
      </div>
    </div>
    <div style={{width: 1.5, background: CC.laranja, opacity: 0.6, margin: '0 18px'}} />
    <div style={{flex: 1, fontSize: '0.82em'}}>
      <div style={{color: CC.laranja, fontWeight: 700}}>Tips for getting started</div>
      <div>Run /init to create a CLAUDE.md file with instructions for Claude</div>
      <div style={{borderTop: `1px solid ${CC.laranja}`, opacity: 0.6, margin: '12px 0'}} />
      <div style={{color: CC.laranja, fontWeight: 700}}>Recent activity</div>
      <div style={{color: CC.apagado}}>No recent activity</div>
    </div>
  </div>
);

// Caixa do prompt com digitação.
export const Prompt: React.FC<{texto?: string; de?: number; ate?: number; placeholder?: string}> = ({texto = '', de = 0, ate = 0, placeholder = 'Try "write a test for relatorio.md"'}) => {
  const t = useAgora();
  const n = texto && ate > de ? Math.round(interpolate(t, [de, ate], [0, texto.length], clamp)) : 0;
  const digitando = n > 0 && t < ate + 0.5;
  const cursor = Math.floor(t * 2.4) % 2 === 0;
  return (
    <div>
      <div style={{borderTop: `1.5px solid ${CC.linha}`, borderBottom: `1.5px solid ${CC.linha}`, padding: '10px 4px', display: 'flex'}}>
        <span style={{color: CC.apagado, marginRight: 14}}>&gt;</span>
        {n > 0 && digitando ? (
          <span>
            {texto.slice(0, n)}
            {cursor && <span style={{background: CC.texto, color: CC.fundo}}> </span>}
          </span>
        ) : (
          <span style={{color: CC.apagado}}>
            {cursor && <span style={{background: CC.texto}}> </span>}
            {placeholder}
          </span>
        )}
      </div>
      <div style={{color: CC.apagado, fontSize: '0.75em', padding: '6px 4px'}}>? for shortcuts</div>
    </div>
  );
};

// Linha de histórico: mensagem do usuário ou chamada de ferramenta.
export const Usuario: React.FC<{texto: string}> = ({texto}) => (
  <div style={{color: CC.apagado, marginTop: 8}}>
    <span style={{marginRight: 14}}>&gt;</span>
    {texto}
  </div>
);

export const Ferramenta: React.FC<{nome: string; arg: string; resultado?: string; cor?: string}> = ({nome, arg, resultado, cor = CC.verde}) => (
  <div style={{marginTop: 6}}>
    <div>
      <span style={{color: cor}}>⏺ </span>
      <span style={{fontWeight: 700}}>{nome}</span>({arg})
    </div>
    {resultado && (
      <div style={{color: CC.apagado}}>
        <span style={{marginLeft: 22}}>⎿  </span>
        {resultado}
      </div>
    )}
  </div>
);

const GIRO = ['·', '✢', '✳', '✶', '✻', '✽'];
export const Spinner: React.FC<{texto?: string}> = ({texto = 'Working…'}) => {
  const t = useAgora();
  const g = GIRO[Math.floor(t * 8) % GIRO.length];
  return (
    <div style={{marginTop: 10, color: CC.laranja}}>
      {g} {texto} <span style={{color: CC.apagado}}>(esc to interrupt)</span>
    </div>
  );
};

// Pedido de permissão do Claude Code.
export const Permissao: React.FC<{comando: string; escolha?: number}> = ({comando, escolha = 0}) => (
  <div style={{border: `1.5px solid ${CC.laranja}`, borderRadius: 10, padding: '10px 18px'}}>
    <div style={{fontWeight: 700}}>Bash command</div>
    <div style={{marginLeft: 22, margin: '6px 0 6px 22px'}}>{comando}</div>
    <div>Do you want to proceed?</div>
    {['Yes', "Yes, and don't ask again", 'No'].map((o, i) => (
      <div key={o} style={{color: i === escolha ? CC.laranja : CC.texto}}>
        {i === escolha ? '❯' : ' '} {i + 1}. {o}
      </div>
    ))}
  </div>
);

export {COR};
