import { and, desc, eq, gte, inArray, isNull, lt, or } from 'drizzle-orm';
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
    // Uma consulta de cada vez: a transacao e uma conexao so.
    const marcados = await tx
      .select({ inicio: schema.agendamento.inicio, fim: schema.agendamento.fim })
      .from(schema.agendamento)
      .where(
        and(
          gte(schema.agendamento.inicio, de),
          lt(schema.agendamento.inicio, ate),
          inArray(schema.agendamento.status, [...OCUPAM]),
        ),
      );

    const bloqueios = await tx
      .select({ inicio: schema.bloqueio.inicio, fim: schema.bloqueio.fim })
      .from(schema.bloqueio)
      .where(and(lt(schema.bloqueio.inicio, ate), gte(schema.bloqueio.fim, de)));

    return [...marcados, ...bloqueios];
  },

  /** A agenda de um dia, com o nome do cliente e do servico ja resolvidos. */
  async doDia(tx: Tx, de: Date, ate: Date) {
    return tx
      .select({
        id: schema.agendamento.id,
        inicio: schema.agendamento.inicio,
        fim: schema.agendamento.fim,
        status: schema.agendamento.status,
        versao: schema.agendamento.versao,
        clienteNome: schema.cliente.nome,
        servicoNome: schema.servico.nome,
      })
      .from(schema.agendamento)
      .innerJoin(schema.cliente, eq(schema.cliente.id, schema.agendamento.clienteId))
      .innerJoin(schema.servico, eq(schema.servico.id, schema.agendamento.servicoId))
      .where(and(gte(schema.agendamento.inicio, de), lt(schema.agendamento.inicio, ate)))
      .orderBy(schema.agendamento.inicio);
  },

  async clientesRecentes(tx: Tx, quantos: number) {
    return tx
      .select({ id: schema.cliente.id, nome: schema.cliente.nome })
      .from(schema.cliente)
      .where(isNull(schema.cliente.anonimizadoEm))
      .orderBy(desc(schema.cliente.criadoEm))
      .limit(quantos);
  },

  async servicosAtivos(tx: Tx, quantos: number) {
    return tx
      .select({
        id: schema.servico.id,
        nome: schema.servico.nome,
        duracaoMin: schema.servico.duracaoMin,
        intervaloMin: schema.servico.intervaloMin,
        antecedenciaMinimaMin: schema.servico.antecedenciaMinimaMin,
      })
      .from(schema.servico)
      .where(eq(schema.servico.ativo, true))
      .orderBy(schema.servico.nome)
      .limit(quantos);
  },

  /** Cliente novo criado na hora de marcar: o telefone vem depois. */
  async criarCliente(tx: Tx, tenantId: string, nome: string) {
    const [linha] = await tx
      .insert(schema.cliente)
      .values({ tenantId, nome })
      .returning({ id: schema.cliente.id });
    if (linha === undefined) throw new Error('Insert de cliente nao devolveu linha.');
    return linha.id;
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
