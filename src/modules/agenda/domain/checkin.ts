import type { Status } from './transicoes';

/**
 * Quando o check-in e possivel.
 *
 * Nem no dia anterior, nem depois que o horario passou: o botao existe na
 * janela em que ele significa alguma coisa, e fora dela ele explica por que
 * nao esta la.
 */
export const ABRE_ANTES_MIN = 30;
export const FECHA_DEPOIS_DO_FIM_MIN = 15;

export type MotivoSemCheckin = 'CEDO_DEMAIS' | 'TARDE_DEMAIS' | 'STATUS_NAO_PERMITE' | 'JA_CHEGOU';

export type Veredito =
  | { readonly pode: true; readonly abreEm: Date }
  | { readonly pode: false; readonly motivo: MotivoSemCheckin; readonly abreEm: Date };

export function janelaDeCheckin(inicio: Date): { readonly abre: Date; readonly fecha: Date } {
  return {
    abre: new Date(inicio.getTime() - ABRE_ANTES_MIN * 60_000),
    fecha: new Date(inicio.getTime() + FECHA_DEPOIS_DO_FIM_MIN * 60_000),
  };
}

export function podeFazerCheckin(entrada: {
  readonly inicio: Date;
  readonly fim: Date;
  readonly status: Status;
  readonly checkinEm: Date | null;
  readonly agora: Date;
}): Veredito {
  const { abre } = janelaDeCheckin(entrada.inicio);
  const fecha = new Date(entrada.fim.getTime() + FECHA_DEPOIS_DO_FIM_MIN * 60_000);

  if (entrada.checkinEm !== null) return { pode: false, motivo: 'JA_CHEGOU', abreEm: abre };

  if (entrada.status !== 'pendente' && entrada.status !== 'confirmado') {
    return { pode: false, motivo: 'STATUS_NAO_PERMITE', abreEm: abre };
  }

  if (entrada.agora.getTime() < abre.getTime()) {
    return { pode: false, motivo: 'CEDO_DEMAIS', abreEm: abre };
  }

  if (entrada.agora.getTime() > fecha.getTime()) {
    return { pode: false, motivo: 'TARDE_DEMAIS', abreEm: abre };
  }

  return { pode: true, abreEm: abre };
}
