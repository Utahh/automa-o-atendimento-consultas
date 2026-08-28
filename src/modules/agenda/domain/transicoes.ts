/**
 * A máquina de estados do agendamento. Pura, e por isso a mesma no servidor,
 * no worker e no agente de IA — ninguém reescreve a regra no caminho.
 */

export const STATUS = [
  'pendente',
  'confirmado',
  'chegou',
  'atendido',
  'cancelado',
  'faltou',
] as const;

export type Status = (typeof STATUS)[number];

const PERMITIDAS: Readonly<Record<Status, readonly Status[]>> = {
  pendente: ['confirmado', 'cancelado', 'faltou'],
  confirmado: ['chegou', 'cancelado', 'faltou'],
  chegou: ['atendido', 'cancelado'],
  atendido: [],
  cancelado: [],
  faltou: [],
};

export function podeIrPara(de: Status, para: Status): boolean {
  return PERMITIDAS[de].includes(para);
}

export function ehFinal(status: Status): boolean {
  return PERMITIDAS[status].length === 0;
}

/** Estados que ocupam a agenda — e portanto entram no cálculo de disponibilidade. */
export function ocupaAgenda(status: Status): boolean {
  return status === 'pendente' || status === 'confirmado' || status === 'chegou';
}
