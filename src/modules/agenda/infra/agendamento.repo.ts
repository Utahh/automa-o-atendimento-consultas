import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { schema, type Tx } from '@/shared/db';
import type { Status } from '../domain/transicoes';
import type { Intervalo } from '../domain/disponibilidade';
import type { FaixaDeJornada } from '../domain/jornada';

/**
 * infra/ conhece banco e API externa. Não conhece regra de negócio: aqui não
 * se decide nada, só se lê e se escreve.
 */

const OCUPAM: readonly Status[] = ['pendente', 'confirmado', 'chegou'];

export const agendamentoRepo = {
  async servico(tx: Tx, servicoId: string) {
    const [linha] = await tx
      .select()
      .from(schema.servicos)
      .where(eq(schema.servicos.id, servicoId))
      .limit(1);
    return linha ?? null;
  },

  async jornada(tx: Tx): Promise<readonly FaixaDeJornada[]> {
    return tx
      .select({
        diaDaSemana: schema.jornadas.diaDaSemana,
        inicioMin: schema.jornadas.inicioMin,
        fimMin: schema.jornadas.fimMin,
      })
      .from(schema.jornadas);
  },

  async ocupados(tx: Tx, de: Date, ate: Date): Promise<readonly Intervalo[]> {
    const linhas = await tx
      .select({ inicio: schema.agendamentos.inicio, fim: schema.agendamentos.fim })
      .from(schema.agendamentos)
      .where(
        and(
          gte(schema.agendamentos.inicio, de),
          lt(schema.agendamentos.inicio, ate),
          inArray(schema.agendamentos.status, [...OCUPAM]),
        ),
      );
    return linhas;
  },

  async porId(tx: Tx, id: string) {
    const [linha] = await tx
      .select()
      .from(schema.agendamentos)
      .where(eq(schema.agendamentos.id, id))
      .limit(1);
    return linha ?? null;
  },

  async inserir(
    tx: Tx,
    entrada: {
      readonly tenantId: string;
      readonly clienteId: string;
      readonly servicoId: string;
      readonly inicio: Date;
      readonly fim: Date;
      readonly observacao?: string | undefined;
    },
  ) {
    const [linha] = await tx
      .insert(schema.agendamentos)
      .values({
        tenantId: entrada.tenantId,
        clienteId: entrada.clienteId,
        servicoId: entrada.servicoId,
        inicio: entrada.inicio,
        fim: entrada.fim,
        observacao: entrada.observacao ?? null,
        status: 'pendente',
        versao: 1,
      })
      .returning();
    if (linha === undefined) throw new Error('Insert de agendamento não devolveu linha.');
    return linha;
  },

  /** Escrita com bloqueio otimista: devolve null se a versão já mudou. */
  async atualizarStatus(tx: Tx, id: string, versao: number, status: Status) {
    const [linha] = await tx
      .update(schema.agendamentos)
      .set({ status, versao: versao + 1 })
      .where(and(eq(schema.agendamentos.id, id), eq(schema.agendamentos.versao, versao)))
      .returning();
    return linha ?? null;
  },

  async remarcar(tx: Tx, id: string, versao: number, inicio: Date, fim: Date) {
    const [linha] = await tx
      .update(schema.agendamentos)
      .set({ inicio, fim, versao: versao + 1 })
      .where(and(eq(schema.agendamentos.id, id), eq(schema.agendamentos.versao, versao)))
      .returning();
    return linha ?? null;
  },
};
