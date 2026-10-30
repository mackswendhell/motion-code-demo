import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraFalsa} from './_comum';
import {Botao, Conversa, Cursor, Enquadro, JanelaApp, Lateral, Menu, Modal, MsgClaude, MsgUsuario} from './demo-tutorial/app';
import {APP, Chip, Fontes, Mesa, useAgora, useDigitado} from './demo-tutorial/base';

// Estilo "Demo Tutorial" (16:9): o Claude desktop reconstruído em camadas, com cursor, menu, modal e zoom,
// câmera em card ao lado. Peças em src/estilos/demo-tutorial/ (app, camera, diagrama, base).

const it = (id: string, nome: string, extra: object = {}) => ({id, nome, ...extra});
const MENU = [
  {t: 'Abrir em', sub: true},
  {t: '', sep: true},
  {t: 'Fixar', atalho: 'P'},
  {t: 'Mudar o nome', atalho: 'R'},
  {t: '', sep: true},
  {t: 'Mover para a seção', sub: true},
  {t: '', sep: true},
  {t: 'Arquivar', atalho: 'A'},
];

export const DemoTutorial: React.FC = () => {
  const t = useAgora();
  const nome = useDigitado('Clientes', 3.1, 3.7);
  const criada = t >= 4.25;
  const secoes = [
    {titulo: 'Fixados', itens: [it('plano', 'Plano semanal de conteúdo')]},
    ...(criada ? [{titulo: 'Clientes', novoEm: 4.25, itens: [it('prop', 'Proposta Brightline Dental')]}] : []),
    {titulo: 'Este computador', itens: [it('rel', 'Relatório semanal do cliente'), ...(criada ? [] : [it('prop', 'Proposta Brightline Dental')]), it('cal', 'Calendário de conteúdo'), it('news', 'Rascunho da newsletter')]},
  ];
  return (
    <AbsoluteFill>
      <Fontes />
      <Mesa />
      <Enquadro
        caixa={{x: 30, y: 40, w: 1470, h: 1000}}
        focos={[
          [0, 1, 735, 432],
          [0.6, 1.8, 330, 470, 1.0],
          [2.7, 1.3, 960, 400, 0.6],
          [4.3, 1.8, 330, 440, 0.7],
          [6.6, 1, 735, 432, 0.9],
        ]}
      >
        <JanelaApp
          lateral={<Lateral secoes={secoes} hover={t > 1.0 && t < 2.6 ? 'prop' : undefined} />}
          overlay={
            <>
              <Menu em={1.3} ate={2.6} x={40} y={463} w={250} itens={MENU} hover={t > 1.9 ? 5 : -1} />
              <Menu em={2.1} ate={2.6} x={294} y={588} w={170} itens={[{t: 'Nova seção', atalho: '1'}]} hover={t > 2.3 ? 0 : -1} />
              <Modal em={2.7} ate={4.25} titulo="Nova seção">
                <div style={{height: 38, borderRadius: 8, border: `1.5px solid ${APP.link}`, background: '#262626', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 15, color: APP.texto}}>
                  {nome.texto || 'Nome da seção'}
                </div>
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18}}>
                  <Botao>Cancelar</Botao>
                  <Botao primario ativo={t > 4.0}>
                    Criar seção
                  </Botao>
                </div>
              </Modal>
            </>
          }
        >
          <Conversa titulo="Calendário de conteúdo">
            <MsgUsuario>Monte o calendário do 4º trimestre: dois vídeos por semana e a newsletter toda sexta.</MsgUsuario>
            <MsgClaude>Aqui está o plano do trimestre, semana a semana: 24 vídeos e 13 newsletters.</MsgClaude>
          </Conversa>
          <Cursor
            pts={[
              [0.5, 600, 600],
              [1.1, 229, 445],
              [1.8, 120, 605],
              [2.2, 340, 606],
              [2.9, 640, 520],
              [3.9, 828, 486],
            ]}
            cliques={[1.2, 2.4, 4.05]}
          />
        </JanelaApp>
      </Enquadro>
      <div style={{position: 'absolute', left: 1520, top: 400, width: 360, height: 640, borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 60px rgba(40,25,10,.35)'}}>
        <CameraFalsa />
      </div>
      <Chip em={0.3} texto="Demo Tutorial" tom="terra" tamanho={30} style={{left: 1540, top: 300}} />
    </AbsoluteFill>
  );
};
