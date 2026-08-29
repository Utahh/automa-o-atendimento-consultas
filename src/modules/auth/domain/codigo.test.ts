import { describe, expect, it } from 'vitest';
import { avaliar, calcularExpiracao, formatoValido } from './codigo';

const agora = new Date('2026-09-01T12:00:00Z');
const daquiA = (min: number) => new Date(agora.getTime() + min * 60_000);

const registro = (over: Partial<Parameters<typeof avaliar>[0]['registro'] & object> = {}) => ({
  expiraEm: daquiA(10),
  usadoEm: null,
  tentativas: 0,
  confere: true,
  ...over,
});

describe('codigo de acesso', () => {
  it('aceita so seis digitos', () => {
    expect(formatoValido('123456')).toBe(true);
    expect(formatoValido('12345')).toBe(false);
    expect(formatoValido('12345a')).toBe(false);
  });

  it('vale por dez minutos', () => {
    expect(calcularExpiracao(agora).toISOString()).toBe(daquiA(10).toISOString());
  });

  it('deixa entrar quando tudo confere', () => {
    expect(avaliar({ codigoDigitado: '123456', registro: registro(), agora })).toEqual({
      ok: true,
    });
  });

  it('recusa codigo expirado', () => {
    const r = avaliar({
      codigoDigitado: '123456',
      registro: registro({ expiraEm: daquiA(-1) }),
      agora,
    });
    expect(r).toEqual({ ok: false, motivo: 'EXPIRADO' });
  });

  it('recusa depois de cinco tentativas', () => {
    const r = avaliar({ codigoDigitado: '123456', registro: registro({ tentativas: 5 }), agora });
    expect(r).toEqual({ ok: false, motivo: 'ESGOTADO' });
  });

  it('nao deixa usar o mesmo codigo duas vezes', () => {
    const r = avaliar({ codigoDigitado: '123456', registro: registro({ usadoEm: agora }), agora });
    expect(r).toEqual({ ok: false, motivo: 'INEXISTENTE' });
  });

  it('recusa quando o hash nao bate', () => {
    const r = avaliar({ codigoDigitado: '123456', registro: registro({ confere: false }), agora });
    expect(r).toEqual({ ok: false, motivo: 'NAO_CONFERE' });
  });

  it('esgotado tem prioridade sobre expirado — a trava vem antes do prazo', () => {
    const r = avaliar({
      codigoDigitado: '123456',
      registro: registro({ tentativas: 9, expiraEm: daquiA(-5) }),
      agora,
    });
    expect(r).toEqual({ ok: false, motivo: 'ESGOTADO' });
  });
});
