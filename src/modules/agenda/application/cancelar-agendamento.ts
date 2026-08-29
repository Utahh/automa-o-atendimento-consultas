import { eventos, type Tx } from '@/shared/db';
import { erro, ok, type Resultado } from '@/shared/erros';
import type { Ator } from '@/shared/tenancy/ator';
import { ehFinal } from '../domain/transicoes';
import { agendamentoRepo } from '../infra/agendamento.repo';

/**
 * Cancelar abre uma vaga — e vaga aberta é assunto da fila.
 *
 * O caso de uso não chama a fila: devolve a vaga para quem chamou. É o mesmo
 * motivo de sempre — quem conhece o fuso é a porta de entrada —, e assim o
 * cancelamento continua testável sem a fila junto.
 */
export type VagaLiberada = {
  readonly servicoId: string;
  readonly recursoId: string | null;
  readonly inicio: Date;
};

export async function cancelarAgendamento(
  tx: Tx,
  ctx: { readonly tenantId: string; readonly ator: Ator },
  input: { readonly agendamentoId: string; readonly motivo?: string },
): Promise<Resultado<{ readonly id: string; readonly vaga: VagaLiberada }>> {
  const ag = await agendamentoRepo.porId(tx, input.agendamentoId);
  if (ag === null) return erro({ codigo: 'AGENDAMENTO_NAO_ENCONTRADO' });

  if (ehFinal(ag.status)) {
    return erro({ codigo: 'TRANSICAO_INVALIDA', de: ag.status, para: 'cancelado' });
  }

  const atualizado = await agendamentoRepo.atualizarStatus(tx, ag.id, ag.versao, 'cancelado');
  if (atualizado === null) return erro({ codigo: 'CONFLITO_DE_VERSAO' });

  await eventos.registrar(tx, {
    tenantId: ctx.tenantId,
    tipo: 'agendamento.cancelado',
    agregado: 'agendamento',
    agregadoId: ag.id,
    agregadoVersao: atualizado.versao,
    ator: ctx.ator,
    payload: { motivo: input.motivo ?? null, inicio: ag.inicio.toISOString() },
  });

  return ok({
    id: ag.id,
    vaga: { servicoId: ag.servicoId, recursoId: ag.recursoId, inicio: ag.inicio },
  });
}
