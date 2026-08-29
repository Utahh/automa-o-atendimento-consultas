import type { Tx } from '@/shared/db';
import { slotsLivres } from '../domain/disponibilidade';
import { formatarDia, formatarHora, janelasDoDia } from '../domain/jornada';
import { agendamentoRepo } from '../infra/agendamento.repo';
import type { Slot } from '../schemas';

/**
 * Tudo o que a folha de novo agendamento precisa, numa consulta so.
 *
 * A profissional nunca digita o que o sistema pode adivinhar: os clientes
 * recentes, os servicos mais usados e os horarios que cabem vem prontos.
 *
 * E quando o dia pedido ja acabou — o que e o caso toda tarde, depois do
 * ultimo atendimento — a folha ANDA SOZINHA ate o proximo dia com vaga, em
 * vez de mostrar "sem horario" e deixar a pessoa procurar.
 */

export type OpcoesDeAgendamento = {
  readonly clientesRecentes: readonly { readonly id: string; readonly rotulo: string }[];
  readonly servicosMaisUsados: readonly { readonly id: string; readonly rotulo: string }[];
  readonly horariosLivres: readonly Slot[];
  /** Vazio quando os horarios sao do proprio dia pedido. */
  readonly diaDosHorarios: string;
};

const DIAS_A_PROCURAR = 14;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

export async function opcoesDeAgendamento(
  tx: Tx,
  ctx: { readonly fuso: string; readonly dia: Date; readonly agora: Date },
): Promise<OpcoesDeAgendamento> {
  /*
   * Sequencial de proposito: uma transacao e UMA conexao, e o `pg` nao aceita
   * duas consultas ao mesmo tempo no mesmo cliente — Promise.all aqui vira
   * aviso de depreciacao hoje e erro amanha.
   */
  const clientes = await agendamentoRepo.clientesRecentes(tx, 4);
  const servicos = await agendamentoRepo.servicosAtivos(tx, 4);
  const faixas = await agendamentoRepo.jornada(tx, null);

  const inicio = new Date(ctx.dia);
  inicio.setHours(0, 0, 0, 0);
  const fimDaBusca = new Date(inicio.getTime() + DIAS_A_PROCURAR * UM_DIA_MS);

  // Uma consulta cobre a janela inteira: procurar dia a dia seria uma ida ao
  // banco por dia, e a folha abre a cada dois atendimentos.
  const ocupados = await agendamentoRepo.ocupados(tx, inicio, fimDaBusca);

  const servico = servicos[0];
  let horarios: readonly Slot[] = [];
  let diaEncontrado: Date | null = null;

  if (servico !== undefined) {
    for (let i = 0; i < DIAS_A_PROCURAR; i++) {
      const dia = new Date(inicio.getTime() + i * UM_DIA_MS);
      const jornada = janelasDoDia(faixas, dia, ctx.fuso);
      if (jornada.length === 0) continue;

      const livres = slotsLivres({
        jornada,
        ocupados,
        duracaoMin: servico.duracaoMin,
        intervaloMin: servico.intervaloMin,
        antecedenciaMinimaMin: servico.antecedenciaMinimaMin,
        agora: ctx.agora,
      }).slots;

      if (livres.length > 0) {
        horarios = livres.map((s) => ({
          inicioISO: s.inicio.toISOString(),
          horaFormatada: formatarHora(s.inicio, ctx.fuso),
        }));
        diaEncontrado = dia;
        break;
      }
    }
  }

  const mesmoDia = diaEncontrado !== null && diaEncontrado.getTime() === inicio.getTime();

  return {
    clientesRecentes: clientes.map((c) => ({ id: c.id, rotulo: c.nome })),
    servicosMaisUsados: servicos.map((s) => ({ id: s.id, rotulo: s.nome })),
    horariosLivres: horarios,
    diaDosHorarios: diaEncontrado === null || mesmoDia ? '' : formatarDia(diaEncontrado, ctx.fuso),
  };
}
