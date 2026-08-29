import { describe, expect, it } from 'vitest';
import {
  calcularExpiracaoDaOferta,
  faixaDoHorario,
  ofertaExpirada,
  posicaoNaFila,
  proximoDaFila,
  serveParaAVaga,
  type EntradaDaFila,
} from './fila';

const FUSO = 'America/Sao_Paulo';
// 13:00 UTC = 10:00 em Sao Paulo (manha); 18:00 UTC = 15:00 (tarde).
const manha = new Date('2026-09-05T13:00:00Z');
const tarde = new Date('2026-09-05T18:00:00Z');
const outroDia = new Date('2026-09-06T13:00:00Z');

const naFila = (over: Partial<EntradaDaFila> = {}): EntradaDaFila => ({
  id: 'f1',
  clienteId: 'c1',
  servicoId: 's1',
  recursoId: null,
  dia: manha,
  faixa: 'qualquer',
  criadoEm: new Date('2026-09-01T10:00:00Z'),
  ...over,
});

const vaga = { servicoId: 's1', recursoId: 'r1', inicio: manha };

describe('faixa do horario', () => {
  it('separa manha de tarde pelo fuso de quem atende, nao por UTC', () => {
    expect(faixaDoHorario(manha, FUSO)).toBe('manha');
    expect(faixaDoHorario(tarde, FUSO)).toBe('tarde');
  });
});

describe('serve para a vaga', () => {
  it('aceita quando tudo bate', () => {
    expect(serveParaAVaga(naFila(), vaga, FUSO)).toBe(true);
  });

  it('recusa servico diferente', () => {
    expect(serveParaAVaga(naFila({ servicoId: 's2' }), vaga, FUSO)).toBe(false);
  });

  it('recusa profissional diferente quando a pessoa escolheu um', () => {
    expect(serveParaAVaga(naFila({ recursoId: 'r2' }), vaga, FUSO)).toBe(false);
  });

  it('aceita qualquer profissional quando a pessoa nao escolheu', () => {
    expect(serveParaAVaga(naFila({ recursoId: null }), vaga, FUSO)).toBe(true);
  });

  it('recusa outro dia', () => {
    expect(serveParaAVaga(naFila({ dia: outroDia }), vaga, FUSO)).toBe(false);
  });

  it('respeita a faixa pedida', () => {
    expect(serveParaAVaga(naFila({ faixa: 'tarde' }), vaga, FUSO)).toBe(false);
    expect(serveParaAVaga(naFila({ faixa: 'manha' }), vaga, FUSO)).toBe(true);
  });
});

describe('quem recebe a oferta', () => {
  it('e o mais antigo entre os elegiveis', () => {
    const antigo = naFila({ id: 'antigo', criadoEm: new Date('2026-09-01T08:00:00Z') });
    const novo = naFila({ id: 'novo', criadoEm: new Date('2026-09-02T08:00:00Z') });

    expect(proximoDaFila([novo, antigo], vaga, FUSO)?.id).toBe('antigo');
  });

  it('ignora quem nao serve, por mais antigo que seja', () => {
    const antigoMasErrado = naFila({
      id: 'errado',
      servicoId: 's9',
      criadoEm: new Date('2026-01-01T08:00:00Z'),
    });
    const certo = naFila({ id: 'certo' });

    expect(proximoDaFila([antigoMasErrado, certo], vaga, FUSO)?.id).toBe('certo');
  });

  it('devolve nulo quando ninguem serve', () => {
    expect(proximoDaFila([naFila({ servicoId: 's9' })], vaga, FUSO)).toBeNull();
  });
});

describe('posicao na fila', () => {
  it('conta a partir de 1, por antiguidade', () => {
    const a = naFila({ id: 'a', criadoEm: new Date('2026-09-01T08:00:00Z') });
    const b = naFila({ id: 'b', criadoEm: new Date('2026-09-01T09:00:00Z') });
    const c = naFila({ id: 'c', criadoEm: new Date('2026-09-01T10:00:00Z') });

    expect(posicaoNaFila([c, a, b], 'a', FUSO)).toBe(1);
    expect(posicaoNaFila([c, a, b], 'b', FUSO)).toBe(2);
    expect(posicaoNaFila([c, a, b], 'c', FUSO)).toBe(3);
  });

  it('nao conta quem disputa outro dia', () => {
    const meu = naFila({ id: 'meu', criadoEm: new Date('2026-09-01T10:00:00Z') });
    const deOutroDia = naFila({
      id: 'outro',
      dia: outroDia,
      criadoEm: new Date('2026-09-01T08:00:00Z'),
    });

    expect(posicaoNaFila([deOutroDia, meu], 'meu', FUSO)).toBe(1);
  });
});

describe('validade da oferta', () => {
  it('vale por dez minutos', () => {
    const agora = new Date('2026-09-05T12:00:00Z');
    const expira = calcularExpiracaoDaOferta(agora);

    expect(ofertaExpirada(expira, new Date(expira.getTime() - 1000))).toBe(false);
    expect(ofertaExpirada(expira, new Date(expira.getTime() + 1000))).toBe(true);
  });

  it('oferta sem prazo nunca expira', () => {
    expect(ofertaExpirada(null, new Date())).toBe(false);
  });
});
