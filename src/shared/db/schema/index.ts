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
 * O schema completo, incluindo as SEIS TABELAS QUE FALTAVAM (E3 🔴):
 * jornada_trabalho, bloqueio, servico_recurso, local, automacao e
 * webhook_recebido. Sem elas a função de disponibilidade não tem de onde ler
 * o expediente — e a Sprint 1 trava no terceiro dia.
 *
 * Toda tabela de negócio carrega `tenant_id` e tem RLS (ver drizzle/rls.sql).
 * Nenhuma tabela nova entra sem política: é item da definição de pronto, e o
 * CI reprova.
 */

export const statusAgendamento = pgEnum('status_agendamento', [
  'pendente',
  'confirmado',
  'chegou',
  'atendido',
  'cancelado',
  'faltou',
]);

export const papelMembro = pgEnum('papel_membro', ['dono', 'operador']);

export const tipoBloqueio = pgEnum('tipo_bloqueio', ['ferias', 'almoco', 'pessoal', 'feriado']);

export const tipoAutomacao = pgEnum('tipo_automacao', [
  'confirmacao',
  'reoferta',
  'retorno',
  'boas_vindas',
]);

// ─── Tenancy ────────────────────────────────────────────────────────────────

export const tenant = pgTable('tenant', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  nome: text('nome').notNull(),
  vertical: text('vertical').notNull().default('estetica'),
  fuso: text('fuso').notNull().default('America/Sao_Paulo'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/** Quem entra. Um usuário pode ser membro de mais de um tenant. */
export const usuario = pgTable('usuario', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  nome: text('nome'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Login por código de 6 dígitos. Sem senha para lembrar, sem senha para
 * vazar — e sem tenant, porque isto acontece ANTES de existir sessão.
 *
 * Guarda o hash, nunca o código: quem lê o banco não entra na conta de
 * ninguém.
 */
export const codigoAcesso = pgTable(
  'codigo_acesso',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    codigoHash: text('codigo_hash').notNull(),
    expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),
    usadoEm: timestamp('usado_em', { withTimezone: true }),
    /** Trava depois de 5 tentativas: 6 dígitos são poucos contra força bruta. */
    tentativas: integer('tentativas').notNull().default(0),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('codigo_acesso_email_idx').on(t.email, t.criadoEm)],
);

/**
 * ⚠️ A política de RLS desta tabela NÃO pode usar uma função que lê `membro`:
 * é recursão infinita, e ela só aparece em produção — em desenvolvimento se
 * roda como superusuário. Ver drizzle/rls.sql.
 */
export const membro = pgTable(
  'membro',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'cascade' }),
    papel: papelMembro('papel').notNull().default('dono'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('membro_tenant_usuario_idx').on(t.tenantId, t.usuarioId)],
);

// ─── Onde e com o quê se atende ─────────────────────────────────────────────

/** Sala, cadeira ou unidade. Uma profissional sozinha tem exatamente um. */
export const local = pgTable(
  'local',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    endereco: text('endereco'),
    ativo: boolean('ativo').notNull().default(true),
  },
  (t) => [index('local_tenant_idx').on(t.tenantId)],
);

/** O que ocupa agenda: a própria profissional, uma cadeira, um equipamento. */
export const recurso = pgTable(
  'recurso',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'set null' }),
    nome: text('nome').notNull(),
    ativo: boolean('ativo').notNull().default(true),
  },
  (t) => [index('recurso_tenant_idx').on(t.tenantId)],
);

export const servico = pgTable(
  'servico',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    duracaoMin: integer('duracao_min').notNull(),
    intervaloMin: integer('intervalo_min').notNull().default(0),
    antecedenciaMinimaMin: integer('antecedencia_minima_min').notNull().default(0),
    precoCentavos: integer('preco_centavos').notNull().default(0),
    /** Ciclo de retorno do serviço, em dias. Base do cálculo de C8. */
    cicloRetornoDias: integer('ciclo_retorno_dias'),
    ativo: boolean('ativo').notNull().default(true),
  },
  (t) => [index('servico_tenant_idx').on(t.tenantId)],
);

/** Qual recurso pode executar qual serviço. */
export const servicoRecurso = pgTable(
  'servico_recurso',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    servicoId: uuid('servico_id')
      .notNull()
      .references(() => servico.id, { onDelete: 'cascade' }),
    recursoId: uuid('recurso_id')
      .notNull()
      .references(() => recurso.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('servico_recurso_idx').on(t.servicoId, t.recursoId)],
);

// ─── Quando se atende ───────────────────────────────────────────────────────

/** Jornada por dia da semana (0 = domingo), em minutos desde a meia-noite. */
export const jornadaTrabalho = pgTable(
  'jornada_trabalho',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    recursoId: uuid('recurso_id').references(() => recurso.id, { onDelete: 'cascade' }),
    diaDaSemana: integer('dia_da_semana').notNull(),
    inicioMin: integer('inicio_min').notNull(),
    fimMin: integer('fim_min').notNull(),
  },
  (t) => [
    uniqueIndex('jornada_trabalho_idx').on(t.tenantId, t.recursoId, t.diaDaSemana, t.inicioMin),
  ],
);

/** Férias, almoço, feriado: buraco na jornada que não é agendamento. */
export const bloqueio = pgTable(
  'bloqueio',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    recursoId: uuid('recurso_id').references(() => recurso.id, { onDelete: 'cascade' }),
    tipo: tipoBloqueio('tipo').notNull().default('pessoal'),
    inicio: timestamp('inicio', { withTimezone: true }).notNull(),
    fim: timestamp('fim', { withTimezone: true }).notNull(),
    motivo: text('motivo'),
  },
  (t) => [index('bloqueio_tenant_inicio_idx').on(t.tenantId, t.inicio)],
);

// ─── Quem se atende ─────────────────────────────────────────────────────────

export const cliente = pgTable(
  'cliente',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    telefone: text('telefone'),
    email: text('email'),
    /** Base legal por finalidade — nunca um "aceito tudo". */
    consentimentoEm: timestamp('consentimento_em', { withTimezone: true }),
    /** Anonimizado ao exercer o direito de exclusão: a trilha sobrevive, a pessoa some. */
    anonimizadoEm: timestamp('anonimizado_em', { withTimezone: true }),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('cliente_tenant_idx').on(t.tenantId),
    uniqueIndex('cliente_tenant_telefone_idx').on(t.tenantId, t.telefone),
  ],
);

// ─── O agendamento ──────────────────────────────────────────────────────────

export const agendamento = pgTable(
  'agendamento',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id),
    servicoId: uuid('servico_id')
      .notNull()
      .references(() => servico.id),
    recursoId: uuid('recurso_id').references(() => recurso.id),
    inicio: timestamp('inicio', { withTimezone: true }).notNull(),
    fim: timestamp('fim', { withTimezone: true }).notNull(),
    status: statusAgendamento('status').notNull().default('pendente'),
    /** Bloqueio otimista: a UI manda de volta a versão que leu. */
    versao: integer('versao').notNull().default(1),
    /** interface · publico · agente · job — as quatro portas de escrita. */
    origem: text('origem').notNull().default('interface'),
    precoCentavos: integer('preco_centavos').notNull().default(0),
    observacao: text('observacao'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('agendamento_tenant_inicio_idx').on(t.tenantId, t.inicio),
    index('agendamento_cliente_idx').on(t.clienteId),
  ],
);

// ─── Automação ──────────────────────────────────────────────────────────────

/** Uma régua ligada ou desligada. O job revalida isto antes de disparar. */
export const automacao = pgTable(
  'automacao',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    tipo: tipoAutomacao('tipo').notNull(),
    ativa: boolean('ativa').notNull().default(true),
    config: jsonb('config').notNull().default({}),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('automacao_tenant_tipo_idx').on(t.tenantId, t.tipo)],
);

// ─── Trilha ─────────────────────────────────────────────────────────────────

/**
 * Event store. Escrita e evento na MESMA transação — nada escreve sem trilha,
 * e o histórico não se cria retroativamente.
 */
export const evento = pgTable(
  'evento',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    tipo: text('tipo').notNull(),
    agregado: text('agregado').notNull(),
    agregadoId: uuid('agregado_id').notNull(),
    versaoAgregado: integer('versao_agregado').notNull(),
    atorTipo: text('ator_tipo').notNull(),
    atorId: uuid('ator_id'),
    dados: jsonb('dados').notNull(),
    ocorridoEm: timestamp('ocorrido_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('evento_tenant_ocorrido_idx').on(t.tenantId, t.ocorridoEm),
    uniqueIndex('evento_agregado_versao_idx').on(t.agregadoId, t.versaoAgregado),
  ],
);

/**
 * Entrada crua de webhook. A rota valida assinatura, grava aqui e enfileira.
 * Nada mais — não tem tenant porque o roteamento por número acontece depois.
 */
export const webhookRecebido = pgTable(
  'webhook_recebido',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    canal: text('canal').notNull(),
    /** Chave de idempotência do provedor: o mesmo evento não entra duas vezes. */
    externoId: text('externo_id').notNull(),
    corpo: jsonb('corpo').notNull(),
    recebidoEm: timestamp('recebido_em', { withTimezone: true }).notNull().defaultNow(),
    processadoEm: timestamp('processado_em', { withTimezone: true }),
  },
  (t) => [uniqueIndex('webhook_canal_externo_idx').on(t.canal, t.externoId)],
);
