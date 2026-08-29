import { eventos, type Tx } from '@/shared/db';
import { erro, ok, type Resultado } from '@/shared/erros';
import type { Ator } from '@/shared/tenancy/ator';
import type { Faixa } from '../domain/fila';
import { filaRepo } from '../infra/fila.repo';

/**
 * Entrar na fila e declarar um DESEJO, nao reservar nada.
 *
 * Por isso nao ha checagem de disponibilidade aqui: a pessoa pode entrar na
 * fila de um dia lotado — e justamente para isso que a fila existe.
 */
export type EntrarNaFila = {
  readonly clienteId: string;
  readonly servicoId: string;
  readonly recursoId: string | null;
  readonly dia: Date;
  readonly faixa: Faixa;
  /** O horario que a pessoa ja tem para o mesmo servico, se tiver. */
  readonly agendamentoAtualId: string | null;
};

export async function entrarNaFila(
  tx: Tx,
  ctx: { readonly tenantId: string; readonly ator: Ator },
  input: EntrarNaFila,
): Promise<Resultado<{ readonly id: string }>> {
  const dia = new Date(input.dia);
  dia.setHours(0, 0, 0, 0);

  // Uma espera viva por disputa: entrar duas vezes nao anda mais rapido na
  // fila, so suja a posicao de todo mundo.
  const jaEspera = await filaRepo.jaEspera(tx, {
    clienteId: input.clienteId,
    servicoId: input.servicoId,
    recursoId: input.recursoId,
    dia,
  });
  if (jaEspera !== null) return ok({ id: jaEspera.id });

  const entrada = await filaRepo.inserir(tx, {
    tenantId: ctx.tenantId,
    clienteId: input.clienteId,
    servicoId: input.servicoId,
    recursoId: input.recursoId,
    dia,
    faixa: input.faixa,
    agendamentoAtualId: input.agendamentoAtualId,
  });

  await eventos.registrar(tx, {
    tenantId: ctx.tenantId,
    tipo: 'fila.entrou',
    agregado: 'fila',
    agregadoId: entrada.id,
    agregadoVersao: 1,
    ator: ctx.ator,
    payload: {
      servicoId: input.servicoId,
      recursoId: input.recursoId,
      dia: dia.toISOString(),
      faixa: input.faixa,
      temHorarioMarcado: input.agendamentoAtualId !== null,
    },
  });

  return ok({ id: entrada.id });
}

export async function sairDaFila(
  tx: Tx,
  ctx: { readonly tenantId: string; readonly ator: Ator; readonly clienteId: string },
  filaId: string,
): Promise<Resultado<{ readonly id: string }>> {
  const entrada = await filaRepo.porId(tx, filaId);
  if (entrada === null) return erro({ codigo: 'AGENDAMENTO_NAO_ENCONTRADO' });
  if (entrada.clienteId !== ctx.clienteId) return erro({ codigo: 'AGENDAMENTO_NAO_ENCONTRADO' });

  await filaRepo.mudarStatus(tx, filaId, 'saiu');

  await eventos.registrar(tx, {
    tenantId: ctx.tenantId,
    tipo: 'fila.saiu',
    agregado: 'fila',
    agregadoId: filaId,
    agregadoVersao: 2,
    ator: ctx.ator,
    payload: { motivo: 'pedido do cliente' },
  });

  return ok({ id: filaId });
}
