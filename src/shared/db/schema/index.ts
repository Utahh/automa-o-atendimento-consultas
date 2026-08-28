import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Toda tabela de negócio carrega `tenantId` e tem RLS (ver drizzle/rls.sql).
 * Nenhuma tabela nova entra sem política — é item da definição de pronto.
 */

export const statusAgendamento = pgEnum('status_agendamento', [
  'pendente',
  'confirmado',
  'chegou',
  'atendido',
  'cancelado',
  'faltou',
]);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  nome: text('nome').notNull(),
  fuso: text('fuso').notNull().default('America/Sao_Paulo'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const servicos = pgTable(
  'servicos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    duracaoMin: integer('duracao_min').notNull(),
    intervaloMin: integer('intervalo_min').notNull().default(0),
    antecedenciaMinimaMin: integer('antecedencia_minima_min').notNull().default(0),
    ativo: boolean('ativo').notNull().default(true),
  },
  (t) => [index('servicos_tenant_idx').on(t.tenantId)],
);

export const clientes = pgTable(
  'clientes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    telefone: text('telefone'),
    email: text('email'),
    consentimentoEm: timestamp('consentimento_em', { withTimezone: true }),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('clientes_tenant_idx').on(t.tenantId),
    uniqueIndex('clientes_tenant_telefone_idx').on(t.tenantId, t.telefone),
  ],
);

/** Jornada de trabalho por dia da semana (0 = domingo). */
export const jornadas = pgTable(
  'jornadas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    diaDaSemana: integer('dia_da_semana').notNull(),
    /** Minutos desde a meia-noite, no fuso do tenant. */
    inicioMin: integer('inicio_min').notNull(),
    fimMin: integer('fim_min').notNull(),
  },
  (t) => [uniqueIndex('jornadas_tenant_dia_inicio_idx').on(t.tenantId, t.diaDaSemana, t.inicioMin)],
);

export const agendamentos = pgTable(
  'agendamentos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => clientes.id),
    servicoId: uuid('servico_id')
      .notNull()
      .references(() => servicos.id),
    inicio: timestamp('inicio', { withTimezone: true }).notNull(),
    fim: timestamp('fim', { withTimezone: true }).notNull(),
    status: statusAgendamento('status').notNull().default('pendente'),
    /** Bloqueio otimista: a UI manda a versão que leu. */
    versao: integer('versao').notNull().default(1),
    observacao: text('observacao'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('agendamentos_tenant_inicio_idx').on(t.tenantId, t.inicio),
    index('agendamentos_cliente_idx').on(t.clienteId),
  ],
);

/**
 * Event store. Escrita e evento na MESMA transação — histórico não se cria
 * retroativamente.
 */
export const eventos = pgTable(
  'eventos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    tipo: text('tipo').notNull(),
    agregado: text('agregado').notNull(),
    agregadoId: uuid('agregado_id').notNull(),
    versaoAgregado: integer('versao_agregado').notNull(),
    dados: jsonb('dados').notNull(),
    ocorridoEm: timestamp('ocorrido_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('eventos_tenant_ocorrido_idx').on(t.tenantId, t.ocorridoEm),
    uniqueIndex('eventos_agregado_versao_idx').on(t.agregadoId, t.versaoAgregado),
  ],
);

/** Entrada crua de webhook: valida assinatura, grava cru, enfileira. Nada mais. */
export const webhooksRecebidos = pgTable(
  'webhooks_recebidos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    canal: text('canal').notNull(),
    /** Chave de idempotência do provedor. */
    externoId: text('externo_id').notNull(),
    corpo: jsonb('corpo').notNull(),
    recebidoEm: timestamp('recebido_em', { withTimezone: true }).notNull().defaultNow(),
    processadoEm: timestamp('processado_em', { withTimezone: true }),
  },
  (t) => [uniqueIndex('webhooks_canal_externo_idx').on(t.canal, t.externoId)],
);
