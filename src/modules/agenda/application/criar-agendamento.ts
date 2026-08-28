import { eventos, type Tx } from '@/shared/db';
import { erro, ok, type Resultado } from '@/shared/erros';
import type { Ator } from '@/shared/tenancy/ator';
import { slotsLivres } from '../domain/disponibilidade';
import { formatarHora, janelasDoDia } from '../domain/jornada';
import { agendamentoRepo } from '../infra/agendamento.repo';
import type { CriarAgendamento } from '../schemas';

/**
 * O padrao de caso de uso. Todos tem esta forma — quem aprende um, escreveu
 * todos.
 *
 *   1. carrega o que a decisao precisa (e nada alem)
 *   2. DECIDE com funcao pura
 *   3. persiste (a constraint do banco e a ultima garantia)
 *   4. registra o evento na MESMA transacao
 *   5. agenda as reguas pela mesma transacao
 *
 * Recebe `tx`; nunca abre a propria conexao. Devolve Resultado; nunca lanca
 * para erro esperado.
 */

export type Contexto = {
  readonly tenantId: string;
  readonly fuso: string;
  readonly agora: Date;
  readonly ator: Ator;
  /** interface · publico · agente · job — as quatro portas de escrita. */
  readonly origem: 'interface' | 'publico' | 'agente' | 'job';
};

export async function criarAgendamento(
  tx: Tx,
  ctx: Contexto,
  input: CriarAgendamento,
): Promise<Resultado<{ readonly id: string }>> {
  // 1. Carrega o que a decisao precisa — nada alem disso.
  const inicioDoDia = new Date(input.inicio);
  inicioDoDia.setUTCHours(0, 0, 0, 0);
  const fimDaJanela = new Date(inicioDoDia.getTime() + 36 * 60 * 60 * 1000);

  const [servico, faixas, ocupados] = await Promise.all([
    agendamentoRepo.servico(tx, input.servicoId),
    agendamentoRepo.jornada(tx, input.recursoId),
    agendamentoRepo.ocupados(tx, inicioDoDia, fimDaJanela),
  ]);

  if (servico === null) return erro({ codigo: 'DADOS_INVALIDOS', campos: ['servicoId'] });
  if (!servico.ativo) return erro({ codigo: 'SERVICO_INATIVO' });

  const jornada = janelasDoDia(faixas, input.inicio, ctx.fuso);
  if (jornada.length === 0) return erro({ codigo: 'FORA_DO_EXPEDIENTE' });

  // 2. DECIDE com funcao pura — testavel sem banco.
  const livre = slotsLivres({
    jornada,
    ocupados,
    duracaoMin: servico.duracaoMin,
    intervaloMin: servico.intervaloMin,
    antecedenciaMinimaMin: servico.antecedenciaMinimaMin,
    agora: ctx.agora,
  });

  if (!livre.contem(input.inicio)) {
    const cedoDemais =
      input.inicio.getTime() < ctx.agora.getTime() + servico.antecedenciaMinimaMin * 60_000;

    if (cedoDemais) {
      return erro({
        codigo: 'ANTECEDENCIA_INSUFICIENTE',
        minimoHoras: Math.ceil(servico.antecedenciaMinimaMin / 60),
      });
    }

    // Erro de negocio carrega O QUE FAZER A SEGUIR: tres horarios alternativos.
    return erro({
      codigo: 'HORARIO_OCUPADO',
      slotSugerido: livre.tresProximos(input.inicio).map((s) => ({
        inicioISO: s.inicio.toISOString(),
        horaFormatada: formatarHora(s.inicio, ctx.fuso),
      })),
    });
  }

  // 3. Persiste — a constraint de exclusao do banco e a ultima garantia.
  const fim = new Date(input.inicio.getTime() + servico.duracaoMin * 60_000);
  const ag = await agendamentoRepo.inserir(tx, {
    tenantId: ctx.tenantId,
    clienteId: input.clienteId,
    servicoId: input.servicoId,
    recursoId: input.recursoId,
    inicio: input.inicio,
    fim,
    precoCentavos: servico.precoCentavos,
    origem: ctx.origem,
    observacao: input.observacao,
  });

  // 4. Evento na MESMA transacao — sem escrita sem trilha.
  await eventos.registrar(tx, {
    tenantId: ctx.tenantId,
    tipo: 'agendamento.criado',
    agregado: 'agendamento',
    agregadoId: ag.id,
    agregadoVersao: ag.versao,
    ator: ctx.ator,
    payload: {
      origem: ctx.origem,
      criadoPor: ctx.ator.tipo,
      clienteId: input.clienteId,
      servicoId: input.servicoId,
      inicio: input.inicio.toISOString(),
      fim: fim.toISOString(),
      valorCentavos: ag.precoCentavos,
    },
  });

  // 5. As reguas (confirmacao D-1/D-0, retorno) sao agendadas pelo consumidor
  //    do evento, no worker: a fila nao participa desta transacao para nao
  //    prender a conexao do banco em I/O externo.

  return ok({ id: ag.id });
}
