import 'server-only';
import { withTenant } from '@/shared/db';
import { exigirSessao } from '@/shared/tenancy/sessao';
import { agendamentoDeAgora, listarAgendaDoDia } from './application/listar-agenda-do-dia';
import { opcoesDeAgendamento, type OpcoesDeAgendamento } from './application/opcoes-de-agendamento';
import type { AgendamentoDaTela } from './schemas';

/**
 * A porta de LEITURA do modulo — o par de `actions.ts`.
 *
 * Existe pelo mesmo motivo que a action existe: `app/` e so composicao de
 * tela, e quem abre transacao e fixa o tenant e o modulo, nunca a rota. A
 * regra e verificada por lint: uma pagina que importe `@/shared/db` nao passa.
 */

export type AgendaDoDia = {
  readonly agendamentos: readonly AgendamentoDaTela[];
  readonly idDoAgora: string | undefined;
  readonly opcoes: OpcoesDeAgendamento;
};

export async function consultarAgendaDoDia(dia = new Date()): Promise<AgendaDoDia> {
  const sessao = await exigirSessao();
  const agora = new Date();

  return withTenant(sessao.tenantId, async (tx) => {
    const agendamentos = await listarAgendaDoDia(tx, { fuso: sessao.fuso, dia });
    const opcoes = await opcoesDeAgendamento(tx, { fuso: sessao.fuso, dia, agora });

    return {
      agendamentos,
      idDoAgora: agendamentoDeAgora(agendamentos, agora)?.id,
      opcoes,
    };
  });
}
