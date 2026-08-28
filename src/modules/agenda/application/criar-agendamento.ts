import { eventos, type Tx } from '@/shared/db';
import { erro, ok, type Resultado } from '@/shared/erros';
import { slotsLivres } from '../domain/disponibilidade';
import { formatarHora, janelasDoDia } from '../domain/jornada';
import { agendamentoRepo } from '../infra/agendamento.repo';
import type { CodigoDeErroDaAgenda, CriarAgendamento } from '../schemas';

/**
 * O padrão de caso de uso. Todos têm esta forma — quem aprende um, escreveu todos.
 *
 *   1. carrega o que a decisão precisa (e nada além)
 *   2. DECIDE com função pura
 *   3. persiste (a constraint do banco é a última garantia)
 *   4. registra o evento na MESMA transação
 *   5. agenda as réguas pela mesma transação
 *
 * Recebe `tx`; nunca abre a própria conexão. Devolve Resultado; nunca lança
 * para erro esperado.
 */

export type SaidaCriarAgendamento = { readonly id: string };

export async function criarAgendamento(
  tx: Tx,
  contexto: { readonly tenantId: string; readonly fuso: string; readonly agora: Date },
  input: CriarAgendamento,
): Promise<Resultado<SaidaCriarAgendamento, CodigoDeErroDaAgenda>> {
  // 1. Carrega o que a decisão precisa — nada além disso.
  const inicioDoDia = new Date(input.inicio);
  inicioDoDia.setUTCHours(0, 0, 0, 0);
  const fimDoDia = new Date(inicioDoDia.getTime() + 36 * 60 * 60 * 1000);

  const [servico, faixas, ocupados] = await Promise.all([
    agendamentoRepo.servico(tx, input.servicoId),
    agendamentoRepo.jornada(tx),
    agendamentoRepo.ocupados(tx, inicioDoDia, fimDoDia),
  ]);

  if (servico === null) return erro('DADOS_INVALIDOS');

  const jornada = janelasDoDia(faixas, input.inicio, contexto.fuso);
  if (jornada.length === 0) {
    return erro('FORA_DA_JORNADA', { diaSemJornada: true });
  }

  // 2. DECIDE com função pura — testável sem banco.
  const livre = slotsLivres({
    jornada,
    ocupados,
    duracaoMin: servico.duracaoMin,
    intervaloMin: servico.intervaloMin,
    antecedenciaMinimaMin: servico.antecedenciaMinimaMin,
    agora: contexto.agora,
  });

  if (!livre.contem(input.inicio)) {
    // Erro de negócio carrega O QUE FAZER A SEGUIR: três horários alternativos.
    return erro('HORARIO_OCUPADO', {
      slotSugerido: livre.tresProximos(input.inicio).map((s) => ({
        inicio: s.inicio.toISOString(),
        horaFormatada: formatarHora(s.inicio, contexto.fuso),
      })),
    });
  }

  // 3. Persiste — a constraint de exclusão do banco é a última garantia.
  const fim = new Date(input.inicio.getTime() + servico.duracaoMin * 60_000);
  const agendamento = await agendamentoRepo.inserir(tx, {
    tenantId: contexto.tenantId,
    clienteId: input.clienteId,
    servicoId: input.servicoId,
    inicio: input.inicio,
    fim,
    observacao: input.observacao,
  });

  // 4. Evento na MESMA transação — sem escrita sem trilha.
  await eventos.registrar(tx, {
    tenantId: contexto.tenantId,
    tipo: 'agendamento.criado',
    agregado: 'agendamento',
    agregadoId: agendamento.id,
    versaoAgregado: agendamento.versao,
    dados: {
      clienteId: input.clienteId,
      servicoId: input.servicoId,
      inicio: input.inicio.toISOString(),
      fim: fim.toISOString(),
    },
  });

  // 5. As réguas (lembrete, confirmação, retorno) são agendadas pelo consumidor
  //    do evento, no worker — a fila não participa desta transação para não
  //    prender a conexão do banco em I/O externo.

  return ok({ id: agendamento.id });
}
