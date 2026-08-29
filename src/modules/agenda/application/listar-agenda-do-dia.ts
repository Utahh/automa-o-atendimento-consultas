import type { Tx } from '@/shared/db';
import { formatarHora } from '../domain/jornada';
import { agendamentoRepo } from '../infra/agendamento.repo';
import type { AgendamentoDaTela } from '../schemas';

/**
 * O que a tela ve.
 *
 * A hora sai daqui JA FORMATADA: `date-fns` e `Intl` sao trabalho de servidor,
 * e o celular de entrada nao baixa biblioteca de data para exibir "14:00".
 */
export async function listarAgendaDoDia(
  tx: Tx,
  ctx: { readonly fuso: string; readonly dia: Date },
): Promise<readonly AgendamentoDaTela[]> {
  const inicio = new Date(ctx.dia);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);

  const linhas = await agendamentoRepo.doDia(tx, inicio, fim);

  return linhas.map((l) => ({
    id: l.id,
    inicio: l.inicio,
    fim: l.fim,
    status: l.status,
    versao: l.versao,
    clienteNome: l.clienteNome,
    servicoNome: l.servicoNome,
    horaFormatada: formatarHora(l.inicio, ctx.fuso),
  }));
}

/** O agendamento que esta acontecendo agora — o cartao "Agora" da tela Hoje. */
export function agendamentoDeAgora(
  agendamentos: readonly AgendamentoDaTela[],
  agora: Date,
): AgendamentoDaTela | undefined {
  return agendamentos.find(
    (a) => a.inicio.getTime() <= agora.getTime() && a.fim.getTime() > agora.getTime(),
  );
}
