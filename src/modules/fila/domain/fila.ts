/**
 * As regras da fila de espera — puras, sem banco e sem relogio do sistema.
 *
 * Fila e DESEJO, nao reserva. Estar nela nunca bloqueia horario de ninguem, e
 * so vira reserva quando a oferta e aceita.
 */

export const FAIXAS = ['manha', 'tarde', 'qualquer'] as const;
export type Faixa = (typeof FAIXAS)[number];

/** A oferta vai para UM por vez, e vale por tempo limitado. */
export const VALIDADE_DA_OFERTA_MIN = 10;

export type EntradaDaFila = {
  readonly id: string;
  readonly clienteId: string;
  readonly servicoId: string;
  /** Nulo = qualquer profissional serve. */
  readonly recursoId: string | null;
  readonly dia: Date;
  readonly faixa: Faixa;
  readonly criadoEm: Date;
};

export type VagaAberta = {
  readonly servicoId: string;
  readonly recursoId: string | null;
  readonly inicio: Date;
};

const MEIO_DIA_MIN = 12 * 60;

/** A faixa a que um horario pertence, no fuso de quem atende. */
export function faixaDoHorario(inicio: Date, fuso: string): Faixa {
  const hora = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: fuso, hour: '2-digit', hour12: false }).format(
      inicio,
    ),
  );
  return hora * 60 < MEIO_DIA_MIN ? 'manha' : 'tarde';
}

/** Dois instantes caem no mesmo dia civil do fuso de quem atende? */
export function mesmoDia(a: Date, b: Date, fuso: string): boolean {
  const dia = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: fuso,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  return dia(a) === dia(b);
}

/**
 * A entrada da fila serve para esta vaga?
 *
 * Quatro perguntas, nesta ordem: mesmo servico, profissional compativel,
 * mesmo dia, faixa compativel. `recursoId` nulo na fila significa "qualquer";
 * `faixa` 'qualquer' significa o mesmo para o horario.
 */
export function serveParaAVaga(entrada: EntradaDaFila, vaga: VagaAberta, fuso: string): boolean {
  if (entrada.servicoId !== vaga.servicoId) return false;
  if (entrada.recursoId !== null && vaga.recursoId !== null && entrada.recursoId !== vaga.recursoId)
    return false;
  if (!mesmoDia(entrada.dia, vaga.inicio, fuso)) return false;
  if (entrada.faixa !== 'qualquer' && entrada.faixa !== faixaDoHorario(vaga.inicio, fuso))
    return false;
  return true;
}

/**
 * Quem recebe a oferta primeiro.
 *
 * Antiguidade decide. Um criterio so, e conferivel por quem esta na fila: a
 * pergunta "por que ele e nao eu?" precisa ter resposta.
 */
export function proximoDaFila(
  entradas: readonly EntradaDaFila[],
  vaga: VagaAberta,
  fuso: string,
): EntradaDaFila | null {
  const elegiveis = entradas
    .filter((e) => serveParaAVaga(e, vaga, fuso))
    .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime());

  return elegiveis[0] ?? null;
}

/** A posicao que a pessoa ocupa entre quem quer a mesma coisa. */
export function posicaoNaFila(
  entradas: readonly EntradaDaFila[],
  id: string,
  fuso: string,
): number {
  const eu = entradas.find((e) => e.id === id);
  if (eu === undefined) return 0;

  const mesmaDisputa = entradas
    .filter(
      (e) =>
        e.servicoId === eu.servicoId &&
        mesmoDia(e.dia, eu.dia, fuso) &&
        (e.faixa === eu.faixa || e.faixa === 'qualquer' || eu.faixa === 'qualquer'),
    )
    .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime());

  return mesmaDisputa.findIndex((e) => e.id === id) + 1;
}

export function ofertaExpirada(expiraEm: Date | null, agora: Date): boolean {
  return expiraEm !== null && expiraEm.getTime() <= agora.getTime();
}

export function calcularExpiracaoDaOferta(agora: Date): Date {
  return new Date(agora.getTime() + VALIDADE_DA_OFERTA_MIN * 60_000);
}
