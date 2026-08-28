import { fromZonedTime } from 'date-fns-tz';
import type { Intervalo } from './disponibilidade';

/**
 * Converte a jornada configurada (minutos desde a meia-noite, no fuso do
 * profissional) nas janelas absolutas de um dia.
 *
 * `date-fns` só no servidor: o cliente recebe texto já formatado.
 */

export type FaixaDeJornada = {
  readonly diaDaSemana: number;
  readonly inicioMin: number;
  readonly fimMin: number;
};

const MINUTO = 60_000;

/** O dia civil (AAAA-MM-DD) que um instante representa no fuso do profissional. */
function dataLocal(instante: Date, fuso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante);
}

export function janelasDoDia(
  faixas: readonly FaixaDeJornada[],
  dia: Date,
  fuso: string,
): readonly Intervalo[] {
  const meiaNoiteLocal = fromZonedTime(`${dataLocal(dia, fuso)}T00:00:00`, fuso);
  const diaDaSemana = diaDaSemanaDe(meiaNoiteLocal, fuso);

  return faixas
    .filter((f) => f.diaDaSemana === diaDaSemana && f.fimMin > f.inicioMin)
    .map((f) => ({
      inicio: new Date(meiaNoiteLocal.getTime() + f.inicioMin * MINUTO),
      fim: new Date(meiaNoiteLocal.getTime() + f.fimMin * MINUTO),
    }))
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function diaDaSemanaDe(instante: Date, fuso: string): number {
  const nome = new Intl.DateTimeFormat('en-US', { timeZone: fuso, weekday: 'short' })
    .formatToParts(instante)
    .find((p) => p.type === 'weekday')?.value;
  const indice = DIAS.findIndex((d) => d === nome);
  return indice < 0 ? instante.getUTCDay() : indice;
}

/** O texto que chega pronto na tela. Formatação é trabalho de servidor. */
export function formatarHora(instante: Date, fuso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: fuso,
    hour: '2-digit',
    minute: '2-digit',
  }).format(instante);
}
