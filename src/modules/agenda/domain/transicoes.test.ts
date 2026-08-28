import { describe, expect, it } from 'vitest';
import { STATUS, ehFinal, ocupaAgenda, podeIrPara } from './transicoes';

describe('transições de agendamento', () => {
  it('deixa confirmar e cancelar o que está pendente', () => {
    expect(podeIrPara('pendente', 'confirmado')).toBe(true);
    expect(podeIrPara('pendente', 'cancelado')).toBe(true);
  });

  it('não deixa voltar de um estado final', () => {
    for (const s of STATUS) {
      if (!ehFinal(s)) continue;
      for (const destino of STATUS) {
        expect(podeIrPara(s, destino)).toBe(false);
      }
    }
  });

  it('não deixa pular a chegada', () => {
    expect(podeIrPara('confirmado', 'atendido')).toBe(false);
    expect(podeIrPara('chegou', 'atendido')).toBe(true);
  });

  it('só ocupa a agenda quem ainda está de pé', () => {
    expect(ocupaAgenda('confirmado')).toBe(true);
    expect(ocupaAgenda('cancelado')).toBe(false);
    expect(ocupaAgenda('faltou')).toBe(false);
  });
});
