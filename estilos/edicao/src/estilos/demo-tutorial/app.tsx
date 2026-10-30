import React from 'react';
import {interpolate} from 'remotion';
import {APP, COR, FONTE, clamp, suave, useAgora, useEm, useMola} from './base';

// Claude desktop (aba Code) reconstruído a partir de prints do app; troque os rótulos pelos do seu.
// Unidades = pontos da janela real (1470×864); a cena escala o conjunto.
export const JANELA = {w: 1470, h: 864, lateral: 254, painel: 276, topo: 56};

// ---------- ícones de linha ----------
const I: Record<string, React.ReactNode> = {
  mais: <path d="M12 5v14M5 12h14" />,
  busca: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  projetos: (
    <>
      <rect x="5" y="9" width="14" height="11" rx="2" />
      <path d="M7 6h10M9 3.5h6" />
    </>
  ),
  artefatos: (
    <>
      <rect x="4" y="8" width="11" height="12" rx="2" />
      <path d="M9 8V5.5a1.5 1.5 0 0 1 1.5-1.5H18a2 2 0 0 1 2 2v8.5a1.5 1.5 0 0 1-1.5 1.5H15" />
    </>
  ),
  pasta: <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />,
  mala: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V5.5h6v2" />
    </>
  ),
  pontos: (
    <>
      <circle cx="6" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="18" cy="12" r="1.3" />
    </>
  ),
  computador: (
    <>
      <rect x="5" y="6" width="14" height="10" rx="1.5" />
      <path d="M3 19h18" />
    </>
  ),
  ponteiro: <path d="M7 4l10 9-5 .8 3 5.2-2 1-3-5.2-3 3.2z" />,
  terminal: <path d="M5 8l4 4-4 4M12 17h7" />,
  globo: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16" />
    </>
  ),
  lista: <path d="M5 7h14M5 12h14M5 17h9" />,
  mic: (
    <>
      <rect x="9" y="4" width="6" height="10" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3" />
    </>
  ),
  enviar: <path d="M18 7v5a2 2 0 0 1-2 2H6M9 11l-3 3 3 3" />,
  chat: (
    <>
      <path d="M5 6.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H11l-4 3.5v-3.5H7a2 2 0 0 1-2-2z" />
      <circle cx="17.5" cy="17" r="2.6" />
    </>
  ),
  codigo: <path d="M8.5 7L4 12l4.5 5M15.5 7L20 12l-4.5 5M13.5 5l-3 14" />,
  lado: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M9.5 5v14" />
    </>
  ),
  check: <path d="M6 12.5l4 4 8-9" />,
  doc: (
    <>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4" />
    </>
  ),
};

export const Icone: React.FC<{n: keyof typeof I | string; t?: number; cor?: string; style?: React.CSSProperties}> = ({n, t = 18, cor = 'currentColor', style}) => (
  <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0, ...style}}>
    {I[n]}
  </svg>
);

const Triangulo: React.FC<{aberto?: boolean}> = ({aberto = true}) => (
  <svg width={9} height={9} viewBox="0 0 10 10" style={{transform: aberto ? 'none' : 'rotate(-90deg)', marginLeft: 6}}>
    <path d="M1 3h8L5 8z" fill={APP.apagado} />
  </svg>
);

// ---------- sidebar ----------
export type ItemLateral = {id: string; nome: string; filhos?: ItemLateral[]; abertoEm?: number; esmaecido?: boolean; novoEm?: number};
export type Secao = {titulo: string; itens: ItemLateral[]; novoEm?: number; aberta?: boolean};

const Linha: React.FC<{item: ItemLateral; sel?: string; hover?: string; nivel?: number; fator?: number}> = ({item, sel, hover, nivel = 0, fator = 1}) => {
  const t = useAgora();
  const nasce = useMola(item.novoEm ?? -10);
  const aberto = item.filhos && t >= (item.abertoEm ?? 1e9);
  const pAberto = useEm(item.abertoEm ?? 1e9, 0.45);
  const ativo = sel === item.id;
  const h = 34 * fator * (item.novoEm !== undefined ? nasce : 1);
  return (
    <>
      <div
        style={{
          height: h,
          opacity: (item.novoEm !== undefined ? nasce : 1) * fator,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          margin: '0 8px',
          padding: `0 10px 0 ${10 + nivel * 18}px`,
          borderRadius: 8,
          background: ativo ? APP.sel : hover === item.id ? 'rgba(255,255,255,.05)' : 'transparent',
          color: item.esmaecido ? APP.fraco : APP.texto,
          fontSize: 14.5,
          whiteSpace: 'nowrap',
        }}
      >
        {item.filhos && (
          <svg width={10} height={10} viewBox="0 0 10 10" style={{transform: `rotate(${pAberto * 90}deg)`, flexShrink: 0}}>
            <path d="M3 1.5L7 5l-4 3.5" fill="none" stroke={APP.apagado} strokeWidth={1.4} />
          </svg>
        )}
        <span style={{overflow: 'hidden', textOverflow: 'ellipsis', flex: 1}}>{item.nome}</span>
        {(ativo || hover === item.id) && <Icone n="pontos" t={16} cor={APP.apagado} />}
      </div>
      {aberto && (
        <div style={{overflow: 'hidden'}}>
          {item.filhos!.map((c) => (
            <Linha key={c.id} item={c} sel={sel} hover={hover} nivel={nivel + 1} fator={pAberto} />
          ))}
        </div>
      )}
    </>
  );
};

const SecaoLateral: React.FC<{s: Secao; sel?: string; hover?: string}> = ({s, sel, hover}) => {
  const nasce = useMola(s.novoEm ?? -10);
  return (
    <div style={{marginTop: 14 * (s.novoEm !== undefined ? nasce : 1), opacity: s.novoEm !== undefined ? nasce : 1, transform: `translateY(${(1 - nasce) * -10}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', height: 30, padding: '0 18px', color: APP.apagado, fontSize: 13}}>
        {s.titulo}
        <Triangulo aberto={s.aberta !== false} />
      </div>
      {s.aberta !== false && s.itens.map((it) => <Linha key={it.id} item={it} sel={sel} hover={hover} />)}
    </div>
  );
};

export const Lateral: React.FC<{secoes: Secao[]; sel?: string; hover?: string; nav?: string; soSecoes?: boolean}> = ({secoes, sel, hover, nav, soSecoes}) =>
  soSecoes ? (
    <div style={{width: JANELA.lateral, background: APP.lateral, fontFamily: FONTE.ui, paddingBottom: 12}}>
      {secoes.map((s) => (
        <SecaoLateral key={s.titulo} s={s} sel={sel} hover={hover} />
      ))}
    </div>
  ) : (
  <div style={{width: JANELA.lateral, height: '100%', background: APP.lateral, borderRight: `1px solid ${APP.linha}`, display: 'flex', flexDirection: 'column', fontFamily: FONTE.ui, flexShrink: 0}}>
    <div style={{height: JANELA.topo, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{width: 12, height: 12, borderRadius: 6, background: c}} />
      ))}
      <Icone n="lado" t={17} cor={APP.apagado} style={{marginLeft: 10}} />
      <div style={{flex: 1}} />
      <div style={{display: 'flex', gap: 2, background: '#333', borderRadius: 8, padding: 2}}>
        <div style={{padding: '3px 6px'}}>
          <Icone n="chat" t={17} cor={APP.apagado} />
        </div>
        <div style={{padding: '3px 6px', background: '#454545', borderRadius: 6}}>
          <Icone n="codigo" t={17} cor={APP.texto} />
        </div>
      </div>
    </div>
    <div style={{padding: '6px 0'}}>
      {[
        ['mais', 'Criar'],
        ['busca', 'Procurar'],
        ['projetos', 'Projetos'],
        ['artefatos', 'Artefatos'],
        ['mala', 'Personalização'],
        ['pontos', 'Mais'],
      ].map(([ic, nome], i) => (
        <div
          key={nome}
          style={{
            height: 34,
            margin: '0 8px',
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 8,
            fontSize: 14.5,
            color: APP.texto,
            background: nav === nome ? APP.sel : i === 0 && !nav ? 'rgba(255,255,255,.06)' : 'transparent',
          }}
        >
          <Icone n={ic} t={18} cor={APP.texto} />
          {nome}
          {nome === 'Projetos' && <span style={{fontSize: 11, border: `1px solid ${APP.linha}`, borderRadius: 7, padding: '1px 6px', color: APP.apagado}}>Beta</span>}
        </div>
      ))}
    </div>
    <div style={{flex: 1, overflow: 'hidden'}}>
      {secoes.map((s) => (
        <SecaoLateral key={s.titulo} s={s} sel={sel} hover={hover} />
      ))}
    </div>
    <div style={{height: 50, borderTop: `1px solid ${APP.linha}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontSize: 14, color: APP.texto}}>
      <div style={{width: 22, height: 22, borderRadius: 11, background: '#3d3d3d', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>V</div>
      Você
      <div style={{flex: 1}} />
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={APP.apagado} strokeWidth={1.6}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      </svg>
    </div>
  </div>
  );

// ---------- conversa ----------
export const Cabecalho: React.FC<{titulo: string; icones?: boolean; hoverPontos?: boolean; extra?: React.ReactNode}> = ({titulo, icones = true, hoverPontos, extra}) => (
  <div style={{height: JANELA.topo, display: 'flex', alignItems: 'center', padding: '0 14px 0 20px', gap: 10, borderBottom: `1px solid ${APP.linha}`, flexShrink: 0}}>
    <span style={{fontSize: 15, color: APP.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{titulo}</span>
    <svg width={12} height={12} viewBox="0 0 12 12">
      <path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke={APP.apagado} strokeWidth={1.5} />
    </svg>
    <div style={{flex: 1}} />
    {extra}
    {icones && (
      <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
        {['lista', 'terminal', 'doc', 'globo', 'pasta'].map((n) => (
          <Icone key={n} n={n} t={18} cor={APP.apagado} />
        ))}
        <div style={{padding: 3, borderRadius: 6, background: hoverPontos ? APP.sel : 'transparent'}}>
          <Icone n="pontos" t={18} cor={APP.texto} />
        </div>
      </div>
    )}
  </div>
);

export const Caixa: React.FC<{texto?: string; digitando?: boolean; placeholder?: string; rodape?: boolean}> = ({
  texto = '',
  digitando,
  placeholder = 'Digite / para comandos',
  rodape = true,
}) => {
  const t = useAgora();
  const pisca = Math.floor(t * 2.2) % 2 === 0;
  return (
    <div style={{padding: '0 22px 10px', flexShrink: 0}}>
      <div style={{minHeight: 46, borderRadius: 14, background: APP.caixa, border: `1px solid #4a4a4a`, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', fontSize: 15, color: APP.texto}}>
        <Icone n="mais" t={18} cor={APP.apagado} />
        <div style={{flex: 1, lineHeight: 1.45, color: texto ? APP.texto : APP.fraco}}>
          {texto || (digitando ? '' : placeholder)}
          {digitando && <span style={{display: 'inline-block', width: 2, height: 18, background: APP.texto, marginLeft: 1, verticalAlign: -3, opacity: pisca ? 1 : 0}} />}
        </div>
        <Icone n="mic" t={18} cor={APP.apagado} />
      </div>
      {rodape && (
        <div style={{display: 'flex', alignItems: 'center', fontSize: 13, color: APP.apagado, padding: '9px 16px 0'}}>
          <span style={{color: APP.texto}}>Automático</span>
          <div style={{flex: 1}} />
          <span style={{color: APP.texto}}>Opus 5.5</span>
          <span style={{marginLeft: 6}}>Médio</span>
          <div style={{width: 13, height: 13, borderRadius: 7, border: `2px solid ${APP.link}`, marginLeft: 12}} />
        </div>
      )}
    </div>
  );
};

// Área de conversa: cabeçalho, mensagens (alinhadas embaixo, como o app), caixa e painel direito opcional.
export const Conversa: React.FC<{
  titulo: string;
  children?: React.ReactNode;
  caixa?: React.ReactNode;
  painel?: React.ReactNode;
  painelEm?: number;
  hoverPontos?: boolean;
  rolagem?: number;
  style?: React.CSSProperties;
}> = ({titulo, children, caixa, painel, painelEm, hoverPontos, rolagem = 0, style}) => {
  const p = useEm(painelEm ?? -10, 0.5);
  return (
    <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: APP.fundo, fontFamily: FONTE.ui, ...style}}>
      <Cabecalho titulo={titulo} hoverPontos={hoverPontos} />
      <div style={{flex: 1, display: 'flex', minHeight: 0}}>
        <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column'}}>
          <div style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 40px'}}>
            <div style={{transform: `translateY(${rolagem}px)`, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 18, maxWidth: 760, width: '100%', alignSelf: 'center'}}>{children}</div>
          </div>
          {caixa ?? <Caixa />}
        </div>
        {painel && (
          <div style={{width: JANELA.painel * p, overflow: 'hidden', flexShrink: 0}}>
            <div style={{width: JANELA.painel, padding: '14px 14px 0 4px', display: 'flex', flexDirection: 'column', gap: 12}}>{painel}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- mensagens ----------
const useEntra = (em?: number) => {
  const m = useMola(em ?? -10);
  return {opacity: em === undefined ? 1 : m, transform: `translateY(${(1 - (em === undefined ? 1 : m)) * 14}px)`};
};

export const MsgUsuario: React.FC<{em?: number; children: React.ReactNode}> = ({em, children}) => (
  <div style={{alignSelf: 'flex-end', maxWidth: 560, background: APP.bolha, borderRadius: 14, padding: '11px 16px', fontSize: 15, lineHeight: 1.5, color: APP.texto, ...useEntra(em)}}>{children}</div>
);

export const MsgClaude: React.FC<{em?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({em, children, style}) => (
  <div style={{fontSize: 15, lineHeight: 1.55, color: APP.texto, ...useEntra(em), ...style}}>{children}</div>
);

export const Ferramenta: React.FC<{em?: number; texto: string}> = ({em, texto}) => (
  <div style={{fontSize: 14.5, color: APP.apagado, display: 'flex', alignItems: 'center', gap: 8, ...useEntra(em)}}>
    {texto}
    <svg width={8} height={8} viewBox="0 0 10 10">
      <path d="M2 1l6 4-6 4z" fill={APP.apagado} />
    </svg>
  </div>
);

export const Codigo: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{fontFamily: FONTE.mono, fontSize: 13.5, background: '#333', border: `1px solid ${APP.linha}`, borderRadius: 5, padding: '1px 5px'}}>{children}</span>
);

// Pensando… (três pontos pulsando) com rótulo.
export const Trabalhando: React.FC<{em?: number; ate?: number; texto?: string}> = ({em, ate = 1e9, texto = 'Trabalhando'}) => {
  const t = useAgora();
  const e = useEntra(em);
  if (t >= ate) return null;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: APP.apagado, ...e}}>
      <span style={{color: COR.terra, fontSize: 18, display: 'inline-block', transform: `rotate(${t * 90}deg)`}}>✻</span>
      {texto}…
    </div>
  );
};

// Lista de tarefas dentro do chat: cada item marca no seu tempo; o ativo pulsa.
export const ListaTarefas: React.FC<{em?: number; itens: string[]; feitos: number[]; titulo?: string}> = ({em, itens, feitos, titulo = 'Tarefas'}) => {
  const t = useAgora();
  const n = feitos.filter((x) => t >= x).length;
  return (
    <div style={{border: `1px solid ${APP.bordaCartao}`, borderRadius: 12, padding: '12px 16px', background: '#2a2a2a', ...useEntra(em)}}>
      <div style={{display: 'flex', fontSize: 14, color: APP.apagado, marginBottom: 8}}>
        <span style={{color: APP.texto, fontWeight: 500}}>{titulo}</span>
        <div style={{flex: 1}} />
        {n} de {itens.length}
      </div>
      {itens.map((it, i) => {
        const feito = t >= (feitos[i] ?? 1e9);
        const ativo = !feito && i === n;
        return (
          <div key={it} style={{display: 'flex', alignItems: 'center', gap: 10, height: 30, fontSize: 14.5, color: feito ? APP.apagado : APP.texto}}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                border: `1.5px solid ${feito ? APP.verde : ativo ? COR.terra : '#666'}`,
                background: feito ? APP.verde : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: ativo ? `0 0 0 ${3 + 2 * Math.sin(t * 5)}px rgba(217,119,87,.18)` : undefined,
              }}
            >
              {feito && <Icone n="check" t={12} cor="#1e1e1e" />}
            </div>
            <span style={{textDecoration: feito ? 'line-through' : 'none', textDecorationColor: '#666'}}>{it}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------- painel direito ----------
export const Cartao: React.FC<{titulo: string; aberto?: boolean; direita?: React.ReactNode; destaque?: number; children?: React.ReactNode}> = ({titulo, aberto = true, direita, destaque = 0, children}) => (
  <div
    style={{
      border: `1px solid ${destaque > 0 ? `rgba(217,119,87,${0.25 + 0.6 * destaque})` : APP.bordaCartao}`,
      borderRadius: 12,
      padding: '12px 16px',
      background: APP.cartao,
      fontSize: 14.5,
      color: APP.texto,
      boxShadow: destaque > 0 ? `0 0 0 ${4 * destaque}px rgba(217,119,87,.12)` : undefined,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center'}}>
      {titulo}
      <Triangulo aberto={aberto} />
      <div style={{flex: 1}} />
      <span style={{color: APP.apagado, fontSize: 13.5}}>{direita}</span>
    </div>
    {aberto && children && <div style={{marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10}}>{children}</div>}
  </div>
);

export const LinhaCartao: React.FC<{icone?: string; children: React.ReactNode; direita?: React.ReactNode; apagado?: boolean}> = ({icone, children, direita, apagado}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 10, color: apagado ? APP.apagado : APP.texto, fontSize: 14}}>
    {icone && <Icone n={icone} t={17} cor={APP.apagado} />}
    <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{children}</span>
    {direita}
  </div>
);

export const Chave: React.FC<{em?: number}> = ({em}) => {
  const p = useEm(em ?? 1e9, 0.3);
  return (
    <div style={{width: 34, height: 20, borderRadius: 10, background: p > 0.5 ? APP.link : '#555', position: 'relative', flexShrink: 0}}>
      <div style={{position: 'absolute', top: 2, left: 2 + p * 14, width: 16, height: 16, borderRadius: 8, background: '#fff'}} />
    </div>
  );
};

export const CartaoAmbiente: React.FC<{pasta?: string; remotoEm?: number; destaque?: number}> = ({pasta = 'clientes · ~/Clientes', remotoEm, destaque}) => (
  <Cartao titulo="Ambiente" destaque={destaque}>
    <LinhaCartao icone="computador" direita={<span style={{fontSize: 13.5, textDecoration: 'underline', color: APP.texto}}>Salvar</span>}>
      Este computador
    </LinhaCartao>
    <LinhaCartao icone="pasta">{pasta}</LinhaCartao>
    <LinhaCartao icone="ponteiro" direita={<Chave em={remotoEm} />}>
      Remote Control
    </LinhaCartao>
  </Cartao>
);

const CTX = [
  ['Messages', '#4C8DDB'],
  ['MCP tools', '#E0703A'],
  ['System tools', '#1FA187'],
  ['System prompt', '#E0A43A'],
  ['Skills', '#BBBBBB'],
  ['Memory files', '#BBBBBB'],
  ['Autocompact buffer', '#777'],
  ['Free space', '#444'],
] as const;

// Contexto: valores [k, %] na ordem de CTX; aberto mostra a tabela, fechado só a barra.
export const CartaoContexto: React.FC<{usado: number; total?: string; valores?: [string, number][]; aberto?: boolean; destaque?: number; compactarHover?: boolean}> = ({
  usado,
  total = '1M',
  valores = [
    ['29k', 2.9],
    ['18.2k', 1.8],
    ['14.6k', 1.5],
    ['11.1k', 1.1],
    ['10k', 1.0],
    ['9.4k', 0.9],
    ['33k', 3.3],
    ['873.5k', 87.3],
  ],
  aberto = false,
  destaque,
  compactarHover,
}) => {
  const cheio = usado > 85;
  const usadoK = Math.round((usado / 100) * 1000);
  return (
    <Cartao titulo="Contexto" aberto={aberto} destaque={destaque} direita={!aberto && `${Math.round(usado)}%`}>
      <div style={{display: 'flex', fontSize: 14.5}}>
        <span style={{color: cheio ? '#E8826A' : APP.texto}}>{Math.round(usado)}% usado</span>
        <div style={{flex: 1}} />
        <span style={{color: APP.apagado}}>
          {usadoK}k / {total}
        </span>
      </div>
      <div style={{height: 4, borderRadius: 2, background: '#3a3a3a', overflow: 'hidden', display: 'flex'}}>
        <div style={{width: `${usado}%`, background: cheio ? '#E8826A' : `linear-gradient(90deg, #4C8DDB 0 35%, #E0703A 35% 55%, #1FA187 55% 72%, #E0A43A 72% 100%)`}} />
      </div>
      {CTX.map(([nome, cor], i) => (
        <div key={nome} style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: APP.apagado}}>
          <div style={{width: 11, height: 11, borderRadius: 3, background: cor}} />
          <span style={{flex: 1, color: i === 7 ? APP.apagado : '#cfcfcd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{nome}</span>
          <span style={{width: 58, textAlign: 'right'}}>{valores[i][0]}</span>
          <span style={{width: 52, textAlign: 'right', color: '#cfcfcd'}}>{valores[i][1].toFixed(1).replace('.', ',')}%</span>
        </div>
      ))}
      <div style={{display: 'flex', alignItems: 'center', fontSize: 13, color: APP.apagado, marginTop: 2}}>
        {Math.round(((100 - usado) / 100) * 1000 - 33)}k até compactar
        <div style={{flex: 1}} />
        <span style={{border: `1px solid ${compactarHover ? COR.terra : APP.linha}`, background: compactarHover ? 'rgba(217,119,87,.15)' : 'transparent', borderRadius: 7, padding: '3px 9px', color: APP.texto}}>
          Compactar sessão
        </span>
      </div>
    </Cartao>
  );
};

const LogoServico: React.FC<{cor: string; letra: string}> = ({cor, letra}) => (
  <div style={{width: 18, height: 18, borderRadius: 5, background: cor, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{letra}</div>
);

export const CartaoConectores: React.FC<{aberto?: boolean; destaque?: number; hover?: number}> = ({aberto = true, destaque, hover = -1}) => (
  <Cartao titulo="Conectores" aberto={aberto} destaque={destaque} direita={!aberto && '3 conectados'}>
    {[
      ['#EA4335', 'G', 'Gmail'],
      ['#1FA463', 'D', 'Google Drive'],
      ['#611F69', 'S', 'Slack'],
    ].map(([c, l, n], i) => (
      <div key={n} style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, padding: '2px 4px', margin: '0 -4px', borderRadius: 6, background: hover === i ? 'rgba(255,255,255,.06)' : 'transparent'}}>
        <LogoServico cor={c} letra={l} />
        <span style={{flex: 1}}>{n}</span>
        <span style={{color: APP.apagado, fontSize: 13}}>Conectado</span>
      </div>
    ))}
  </Cartao>
);

export const CartaoSaidas: React.FC<{itens: {nome: string; sub: string; em?: number}[]; destaque?: number; hover?: number}> = ({itens, destaque, hover = -1}) => {
  const t = useAgora();
  return (
    <Cartao titulo="Saídas" destaque={destaque} direita={itens.filter((x) => t >= (x.em ?? -1)).length}>
      {itens.map((it, i) =>
        t >= (it.em ?? -1) ? (
          <div key={it.nome} style={{display: 'flex', gap: 10, padding: '3px 4px', margin: '0 -4px', borderRadius: 6, background: hover === i ? 'rgba(255,255,255,.06)' : 'transparent'}}>
            <Icone n="doc" t={17} cor={APP.apagado} style={{marginTop: 2}} />
            <div>
              <div style={{fontSize: 14}}>{it.nome}</div>
              <div style={{fontSize: 12.5, color: APP.apagado}}>{it.sub}</div>
            </div>
          </div>
        ) : null,
      )}
    </Cartao>
  );
};

export const CartaoProgresso: React.FC<{itens: string[]; feitos: number[]; destaque?: number}> = ({itens, feitos, destaque}) => {
  const t = useAgora();
  const n = feitos.filter((x) => t >= x).length;
  return (
    <Cartao titulo="Progresso" destaque={destaque} direita={`${n} de ${itens.length}`}>
      {itens.map((it, i) => {
        const feito = t >= (feitos[i] ?? 1e9);
        return (
          <div key={it} style={{display: 'flex', gap: 10, fontSize: 13.5, color: feito ? APP.apagado : APP.texto, lineHeight: 1.35}}>
            <div style={{width: 14, height: 14, borderRadius: 7, marginTop: 2, flexShrink: 0, border: `1.5px solid ${feito ? APP.verde : i === n ? COR.terra : '#666'}`, background: feito ? APP.verde : 'transparent'}} />
            {it}
          </div>
        );
      })}
    </Cartao>
  );
};

// ---------- menus e modal ----------
export type ItemMenu = {t: string; atalho?: string; sub?: boolean; perigo?: boolean; sep?: boolean; titulo?: boolean; desc?: string};

export const Menu: React.FC<{em: number; x: number; y: number; w?: number; itens: ItemMenu[]; hover?: number; ate?: number}> = ({em, x, y, w = 200, itens, hover = -1, ate = 1e9}) => {
  const t = useAgora();
  const p = useEm(em, 0.16);
  if (t < em || t >= ate) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        background: '#2E2E2E',
        border: `1px solid ${APP.linha}`,
        borderRadius: 12,
        padding: 6,
        boxShadow: '0 18px 50px rgba(0,0,0,.55)',
        fontFamily: FONTE.ui,
        fontSize: 14,
        color: APP.texto,
        opacity: p,
        transform: `scale(${0.96 + 0.04 * p})`,
        transformOrigin: 'top left',
        zIndex: 20,
      }}
    >
      {itens.map((it, i) =>
        it.sep ? (
          <div key={i} style={{height: 1, background: APP.linha, margin: '5px 6px'}} />
        ) : (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: it.titulo ? '6px 10px 2px' : '7px 10px',
              borderRadius: 7,
              background: hover === i ? '#414141' : 'transparent',
              color: it.perigo ? '#E8705F' : it.titulo ? APP.apagado : APP.texto,
              fontSize: it.titulo ? 13 : 14,
            }}
          >
            <div style={{flex: 1}}>
              {it.t}
              {it.desc && <div style={{fontSize: 12.5, color: APP.apagado, marginTop: 2}}>{it.desc}</div>}
            </div>
            {it.atalho && <span style={{color: APP.apagado, fontSize: 13}}>{it.atalho}</span>}
            {it.sub && (
              <svg width={10} height={10} viewBox="0 0 10 10">
                <path d="M3 1.5L7 5l-4 3.5" fill="none" stroke={APP.apagado} strokeWidth={1.4} />
              </svg>
            )}
          </div>
        ),
      )}
    </div>
  );
};

export const Modal: React.FC<{em: number; ate?: number; titulo: string; children: React.ReactNode; w?: number}> = ({em, ate = 1e9, titulo, children, w = 420}) => {
  const t = useAgora();
  const p = useMola(em, 20);
  if (t < em || t >= ate) return null;
  return (
    <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.45 * p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, fontFamily: FONTE.ui}}>
      <div style={{width: w, background: '#2E2E2E', border: `1px solid ${APP.linha}`, borderRadius: 14, padding: 20, boxShadow: '0 30px 80px rgba(0,0,0,.6)', opacity: p, transform: `scale(${0.95 + 0.05 * p})`}}>
        <div style={{fontSize: 16, fontWeight: 600, color: APP.texto, marginBottom: 14}}>{titulo}</div>
        {children}
      </div>
    </div>
  );
};

export const Botao: React.FC<{children: React.ReactNode; primario?: boolean; ativo?: boolean}> = ({children, primario, ativo}) => (
  <span
    style={{
      padding: '7px 13px',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      background: primario ? (ativo ? '#d9d9d6' : '#ECECEA') : 'transparent',
      color: primario ? '#1e1e1e' : APP.texto,
      border: primario ? 'none' : `1px solid ${APP.linha}`,
    }}
  >
    {children}
  </span>
);

// ---------- cursor ----------
// pts em unidades da janela; cliques = instantes de clique (o ponteiro "afunda" e solta um anel).
export const Cursor: React.FC<{pts: [number, number, number][]; cliques?: number[]; arrasto?: [number, number]}> = ({pts, cliques = [], arrasto}) => {
  const t = useAgora();
  if (pts.length === 0 || t < pts[0][0] - 0.3) return null;
  let x = pts[0][1];
  let y = pts[0][2];
  for (let i = 1; i < pts.length; i++) {
    const [t0, x0, y0] = pts[i - 1];
    const [t1, x1, y1] = pts[i];
    if (t >= t1) {
      x = x1;
      y = y1;
    } else if (t > t0) {
      const p = suave((t - t0) / (t1 - t0));
      x = x0 + (x1 - x0) * p;
      y = y0 + (y1 - y0) * p;
      break;
    } else break;
  }
  const clique = cliques.find((c) => t >= c && t < c + 0.45);
  const pc = clique !== undefined ? (t - clique) / 0.45 : 1;
  const segurando = arrasto && t >= arrasto[0] && t < arrasto[1];
  const aparece = interpolate(t, [pts[0][0] - 0.3, pts[0][0]], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, zIndex: 50, pointerEvents: 'none', opacity: aparece}}>
      {clique !== undefined && (
        <div style={{position: 'absolute', left: -18, top: -18, width: 36, height: 36, borderRadius: 18, border: `2px solid rgba(217,119,87,${1 - pc})`, transform: `scale(${0.4 + pc})`}} />
      )}
      <svg width={22} height={28} viewBox="0 0 22 28" style={{transform: `scale(${clique !== undefined && pc < 0.3 ? 0.85 : segurando ? 0.9 : 1})`, transformOrigin: '2px 2px', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.5))'}}>
        <path d="M2 2l0 20 5.5-5 3.5 8 3.5-1.6-3.5-7.8 7.5 0z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ---------- janela inteira ----------
export const JanelaApp: React.FC<{lateral: React.ReactNode; children: React.ReactNode; overlay?: React.ReactNode}> = ({lateral, children, overlay}) => (
  <div
    style={{
      position: 'absolute',
      width: JANELA.w,
      height: JANELA.h,
      borderRadius: 14,
      overflow: 'hidden',
      background: APP.fundo,
      display: 'flex',
      border: '1px solid #4a4a4a',
      boxShadow: '0 50px 120px rgba(30,20,10,.35), 0 0 0 1px rgba(0,0,0,.4)',
    }}
  >
    {lateral}
    {children}
    {overlay}
  </div>
);

// Câmera virtual sobre o app: keyframes [t, escala, foco x, foco y] em unidades da janela; dur = transição.
export type Foco = [number, number, number, number, number?];
export const useFoco = (focos: Foco[]) => {
  const t = useAgora();
  let s = focos[0][1];
  let fx = focos[0][2];
  let fy = focos[0][3];
  for (let i = 1; i < focos.length; i++) {
    const [ini, s1, x1, y1, dur = 0.9] = focos[i];
    if (t < ini) break;
    const p = suave(Math.min(1, (t - ini) / dur));
    s = s + (s1 - s) * p;
    fx = fx + (x1 - fx) * p;
    fy = fy + (y1 - fy) * p;
  }
  return {s, fx, fy};
};

// Coloca a janela numa caixa da tela (x, y, w, h) e aplica o foco: em escala 1 a janela inteira cabe; acima disso, o ponto (fx, fy) vai para o centro da caixa.
export const Enquadro: React.FC<{caixa: {x: number; y: number; w: number; h: number}; focos: Foco[]; janela?: {w: number; h: number}; children: React.ReactNode}> = ({
  caixa,
  focos,
  janela = JANELA,
  children,
}) => {
  const {s, fx, fy} = useFoco(focos);
  const base = Math.min(caixa.w / janela.w, caixa.h / janela.h);
  const k = base * s;
  // Cabe na caixa: centrada. Ampliada: o foco vai ao centro, mas a borda da janela nunca entra na caixa.
  const preso = (o: number, ini: number, tam: number, janela: number) => (janela > tam ? Math.min(ini, Math.max(ini + tam - janela, o)) : ini + (tam - janela) / 2);
  const ox = preso(caixa.x + caixa.w / 2 - fx * k, caixa.x, caixa.w, janela.w * k);
  const oy = preso(caixa.y + caixa.h / 2 - fy * k, caixa.y, caixa.h, janela.h * k);
  const f = 28;
  return (
    <div style={{position: 'absolute', left: caixa.x - f, top: caixa.y - f, width: caixa.w + 2 * f, height: caixa.h + 2 * f, overflow: 'hidden', borderRadius: 26}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: janela.w, height: janela.h, transformOrigin: '0 0', transform: `translate(${ox - caixa.x + f}px, ${oy - caixa.y + f}px) scale(${k})`}}>{children}</div>
    </div>
  );
};
