import { and, eq, gte, inArray, isNull, lt, or } from 'drizzle-orm';
import { schema, type Tx } from '@/shared/db';
import type { Status } from '../domain/transicoes';
import type { Intervalo } from '../domain/disponibilidade';
import type { FaixaDeJornada } from '../domain/jornada';

/**
 * infra/ conhece banco e API externa. Nao conhece regra de negocio: aqui nao
 * se decide nada, so se le e se escreve.
 */

const OCUPAM: readonly Status[] = ['pendente', 'confirmado', 'chegou'];

export const agendamentoRepo = {
  async servico(tx: Tx, servicoId: string) {
    const [linha] = await tx
      .select()
      .from(schema.servico)
      .where(eq(schema.servico.id, servicoId))
      .limit(1);
    return linha ?? null;
  },

  async jornada(tx: Tx, recursoId: string | null): Promise<readonly FaixaDeJornada[]> {
    return (
      tx
        .select({
          diaDaSemana: schema.jornadaTrabalho.diaDaSemana,
          inicioMin: schema.jornadaTrabalho.inicioMin,
          fimMin: schema.jornadaTrabalho.fimMin,
        })
        .from(schema.jornadaTrabalho)
        // Jornada com recurso nulo vale para o tenant inteiro — e o caso da
        // profissional que trabalha sozinha e nunca cadastrou cadeira nenhuma.
        .where(
          recursoId === null
            ? isNull(schema.jornadaTrabalho.recursoId)
            : or(
                isNull(schema.jornadaTrabalho.recursoId),
                eq(schema.jornadaTrabalho.recursoId, recursoId),
              ),
        )
    );
  },

  /** Agendamentos ativos E bloqueios: os dois ocupam a agenda do mesmo jeito. */
  async ocupados(tx: Tx, de: Date, ate: Date): Promise<readonly Intervalo[]> {
    const [marcados, bloqueios] = await Promise.all([
      tx
        .select({ inicio: schema.agendamento.inicio, fim: schema.agendamento.fim })
        .from(schema.agendamento)
        .where(
          and(
            gte(schema.agendamento.inicio, de),
            lt(schema.agendamento.inicio, ate),
            inArray(schema.agendamento.status, [...OCUPAM]),
          ),
        ),
      tx
        .select({ inicio: schema.bloqueio.inicio, fim: schema.bloqueio.fim })
        .from(schema.bloqueio)
        .where(and(lt(schema.bloqueio.inicio, ate), gte(schema.bloqueio.fim, de))),
    ]);

    return [...marcados, ...bloqueios];
  },

  async porId(tx: Tx, id: string) {
    const [linha] = await tx
      .select()
      .from(schema.agendamento)
      .where(eq(schema.agendamento.id, id))
      .limit(1);
    return linha ?? null;
  },

  async inserir(
    tx: Tx,
    entrada: {
      readonly tenantId: string;
      readonly clienteId: string;
      readonly servicoId: string;
      readonly recursoId: string | null;
      readonly inicio: Date;
      readonly fim: Date;
      readonly precoCentavos: number;
      readonly origem: string;
      readonly observacao?: string | undefined;
    },
  ) {
    const [linha] = await tx
      .insert(schema.agendamento)
      .values({
        tenantId: entrada.tenantId,
        clienteId: entrada.clienteId,
        servicoId: entrada.servicoId,
        recursoId: entrada.recursoId,
        inicio: entrada.inicio,
        fim: entrada.fim,
        precoCentavos: entrada.precoCentavos,
        origem: entrada.origem,
        observacao: entrada.observacao ?? null,
        status: 'pendente',
        versao: 1,
      })
      .returning();
    if (linha === undefined) throw new Error('Insert de agendamento nao devolveu linha.');
    return linha;
  },

  /** Escrita com bloqueio otimista: devolve null se a versao ja mudou. */
  async atualizarStatus(tx: Tx, id: string, versao: number, status: Status) {
    const [linha] = await tx
      .update(schema.agendamento)
      .set({ status, versao: versao + 1 })
      .where(and(eq(schema.agendamento.id, id), eq(schema.agendamento.versao, versao)))
      .returning();
    return linha ?? null;
  },

  async remarcar(tx: Tx, id: string, versao: number, inicio: Date, fim: Date) {
    const [linha] = await tx
      .update(schema.agendamento)
      .set({ inicio, fim, versao: versao + 1 })
      .where(and(eq(schema.agendamento.id, id), eq(schema.agendamento.versao, versao)))
      .returning();
    return linha ?? null;
  },
};
