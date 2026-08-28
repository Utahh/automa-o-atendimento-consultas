import { describe, expect, it } from 'vitest';
import { slotsLivres, type Intervalo } from './disponibilidade';

const dia = (hhmm: string) => new Date(`2026-03-10T${hhmm}:00.000Z`);
const faixa = (de: string, ate: string): Intervalo => ({ inicio: dia(de), fim: dia(ate) });

const jornadaManha = [faixa('09:00', '12:00')];

describe('slotsLivres', () => {
  it('gera a grade inteira quando não há nada ocupado', () => {
    const d = slotsLivres({
      jornada: jornadaManha,
      ocupados: [],
      duracaoMin: 60,
      passoMin: 30,
      agora: dia('08:00'),
    });

    expect(d.slots.map((s) => s.inicio.toISOString())).toEqual([
      dia('09:00').toISOString(),
      dia('09:30').toISOString(),
      dia('10:00').toISOString(),
      dia('10:30').toISOString(),
      dia('11:00').toISOString(),
    ]);
  });

  it('nunca gera slot que ultrapassa o fim da jornada', () => {
    const d = slotsLivres({
      jornada: jornadaManha,
      ocupados: [],
      duracaoMin: 90,
      passoMin: 30,
      agora: dia('08:00'),
    });

    const ultimo = d.slots.at(-1);
    expect(ultimo?.fim.getTime()).toBeLessThanOrEqual(dia('12:00').getTime());
  });

  it('remove o que colide com um horário ocupado', () => {
    const d = slotsLivres({
      jornada: jornadaManha,
      ocupados: [faixa('10:00', '11:00')],
      duracaoMin: 60,
      passoMin: 30,
      agora: dia('08:00'),
    });

    expect(d.contem(dia('09:30'))).toBe(false);
    expect(d.contem(dia('10:00'))).toBe(false);
    expect(d.contem(dia('10:30'))).toBe(false);
    expect(d.contem(dia('11:00'))).toBe(true);
  });

  it('respeita a folga entre atendimentos', () => {
    const d = slotsLivres({
      jornada: jornadaManha,
      ocupados: [faixa('10:00', '10:30')],
      duracaoMin: 30,
      passoMin: 30,
      intervaloMin: 15,
      agora: dia('08:00'),
    });

    expect(d.contem(dia('09:30'))).toBe(false);
    expect(d.contem(dia('10:30'))).toBe(false);
    expect(d.contem(dia('11:00'))).toBe(true);
  });

  it('respeita a antecedência mínima a partir do agora recebido', () => {
    const d = slotsLivres({
      jornada: jornadaManha,
      ocupados: [],
      duracaoMin: 30,
      passoMin: 30,
      antecedenciaMinimaMin: 120,
      agora: dia('09:00'),
    });

    expect(d.contem(dia('10:30'))).toBe(false);
    expect(d.contem(dia('11:00'))).toBe(true);
  });

  it('devolve três alternativas em ordem cronológica em volta do pedido', () => {
    const d = slotsLivres({
      jornada: jornadaManha,
      ocupados: [],
      duracaoMin: 30,
      passoMin: 30,
      agora: dia('08:00'),
    });

    const alternativas = d.tresProximos(dia('10:30')).map((s) => s.inicio.toISOString());
    expect(alternativas).toHaveLength(3);
    expect(alternativas).toEqual([
      dia('10:00').toISOString(),
      dia('10:30').toISOString(),
      dia('11:00').toISOString(),
    ]);
  });

  it('devolve grade vazia para duração inválida em vez de estourar', () => {
    const d = slotsLivres({
      jornada: jornadaManha,
      ocupados: [],
      duracaoMin: 0,
      agora: dia('08:00'),
    });

    expect(d.slots).toHaveLength(0);
    expect(d.tresProximos(dia('10:00'))).toHaveLength(0);
  });

  it('atende jornada partida (manhã e tarde) sem inventar horário no almoço', () => {
    const d = slotsLivres({
      jornada: [faixa('09:00', '12:00'), faixa('14:00', '17:00')],
      ocupados: [],
      duracaoMin: 60,
      passoMin: 60,
      agora: dia('08:00'),
    });

    expect(d.contem(dia('12:00'))).toBe(false);
    expect(d.contem(dia('13:00'))).toBe(false);
    expect(d.contem(dia('14:00'))).toBe(true);
  });
});
