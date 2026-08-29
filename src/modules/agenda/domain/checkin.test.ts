import { describe, expect, it } from 'vitest';
import { janelaDeCheckin, podeFazerCheckin } from './checkin';

const inicio = new Date('2026-09-05T13:00:00Z');
const fim = new Date('2026-09-05T14:00:00Z');
const base = { inicio, fim, status: 'confirmado' as const, checkinEm: null };

describe('janela de check-in', () => {
  it('abre 30 minutos antes', () => {
    expect(janelaDeCheckin(inicio).abre.toISOString()).toBe('2026-09-05T12:30:00.000Z');
  });

  it('deixa entrar dentro da janela', () => {
    const r = podeFazerCheckin({ ...base, agora: new Date('2026-09-05T12:50:00Z') });
    expect(r.pode).toBe(true);
  });

  it('recusa cedo demais, e diz a que horas abre', () => {
    const r = podeFazerCheckin({ ...base, agora: new Date('2026-09-05T09:00:00Z') });
    expect(r).toMatchObject({ pode: false, motivo: 'CEDO_DEMAIS' });
    expect(r.abreEm.toISOString()).toBe('2026-09-05T12:30:00.000Z');
  });

  it('recusa depois que o atendimento acabou', () => {
    const r = podeFazerCheckin({ ...base, agora: new Date('2026-09-05T14:30:00Z') });
    expect(r).toMatchObject({ pode: false, motivo: 'TARDE_DEMAIS' });
  });

  it('nao deixa fazer check-in duas vezes', () => {
    const r = podeFazerCheckin({
      ...base,
      checkinEm: new Date('2026-09-05T12:55:00Z'),
      agora: new Date('2026-09-05T12:58:00Z'),
    });
    expect(r).toMatchObject({ pode: false, motivo: 'JA_CHEGOU' });
  });

  it('nao deixa chegar em horario cancelado', () => {
    const r = podeFazerCheckin({
      ...base,
      status: 'cancelado',
      agora: new Date('2026-09-05T12:50:00Z'),
    });
    expect(r).toMatchObject({ pode: false, motivo: 'STATUS_NAO_PERMITE' });
  });

  it('aceita ate 15 minutos depois do fim — quem chegou atrasado chegou', () => {
    const r = podeFazerCheckin({ ...base, agora: new Date('2026-09-05T14:10:00Z') });
    expect(r.pode).toBe(true);
  });
});
