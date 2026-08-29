CREATE TYPE "public"."papel_membro" AS ENUM('dono', 'operador');--> statement-breakpoint
CREATE TYPE "public"."status_agendamento" AS ENUM('pendente', 'confirmado', 'chegou', 'atendido', 'cancelado', 'faltou');--> statement-breakpoint
CREATE TYPE "public"."tipo_automacao" AS ENUM('confirmacao', 'reoferta', 'retorno', 'boas_vindas');--> statement-breakpoint
CREATE TYPE "public"."tipo_bloqueio" AS ENUM('ferias', 'almoco', 'pessoal', 'feriado');--> statement-breakpoint
CREATE TABLE "agendamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"servico_id" uuid NOT NULL,
	"recurso_id" uuid,
	"inicio" timestamp with time zone NOT NULL,
	"fim" timestamp with time zone NOT NULL,
	"status" "status_agendamento" DEFAULT 'pendente' NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"origem" text DEFAULT 'interface' NOT NULL,
	"preco_centavos" integer DEFAULT 0 NOT NULL,
	"observacao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tipo" "tipo_automacao" NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bloqueio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recurso_id" uuid,
	"tipo" "tipo_bloqueio" DEFAULT 'pessoal' NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fim" timestamp with time zone NOT NULL,
	"motivo" text
);
--> statement-breakpoint
CREATE TABLE "cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"telefone" text,
	"email" text,
	"consentimento_em" timestamp with time zone,
	"anonimizado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codigo_acesso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"codigo_hash" text NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"usado_em" timestamp with time zone,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"agregado" text NOT NULL,
	"agregado_id" uuid NOT NULL,
	"versao_agregado" integer NOT NULL,
	"ator_tipo" text NOT NULL,
	"ator_id" uuid,
	"dados" jsonb NOT NULL,
	"ocorrido_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jornada_trabalho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recurso_id" uuid,
	"dia_da_semana" integer NOT NULL,
	"inicio_min" integer NOT NULL,
	"fim_min" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"endereco" text,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membro" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"papel" "papel_membro" DEFAULT 'dono' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"local_id" uuid,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"duracao_min" integer NOT NULL,
	"intervalo_min" integer DEFAULT 0 NOT NULL,
	"antecedencia_minima_min" integer DEFAULT 0 NOT NULL,
	"preco_centavos" integer DEFAULT 0 NOT NULL,
	"ciclo_retorno_dias" integer,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servico_recurso" (
	"tenant_id" uuid NOT NULL,
	"servico_id" uuid NOT NULL,
	"recurso_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"vertical" text DEFAULT 'estetica' NOT NULL,
	"fuso" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_recebido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canal" text NOT NULL,
	"externo_id" text NOT NULL,
	"corpo" jsonb NOT NULL,
	"recebido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"processado_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_servico_id_servico_id_fk" FOREIGN KEY ("servico_id") REFERENCES "public"."servico"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_recurso_id_recurso_id_fk" FOREIGN KEY ("recurso_id") REFERENCES "public"."recurso"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automacao" ADD CONSTRAINT "automacao_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bloqueio" ADD CONSTRAINT "bloqueio_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bloqueio" ADD CONSTRAINT "bloqueio_recurso_id_recurso_id_fk" FOREIGN KEY ("recurso_id") REFERENCES "public"."recurso"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evento" ADD CONSTRAINT "evento_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jornada_trabalho" ADD CONSTRAINT "jornada_trabalho_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jornada_trabalho" ADD CONSTRAINT "jornada_trabalho_recurso_id_recurso_id_fk" FOREIGN KEY ("recurso_id") REFERENCES "public"."recurso"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local" ADD CONSTRAINT "local_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membro" ADD CONSTRAINT "membro_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membro" ADD CONSTRAINT "membro_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servico" ADD CONSTRAINT "servico_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servico_recurso" ADD CONSTRAINT "servico_recurso_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servico_recurso" ADD CONSTRAINT "servico_recurso_servico_id_servico_id_fk" FOREIGN KEY ("servico_id") REFERENCES "public"."servico"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servico_recurso" ADD CONSTRAINT "servico_recurso_recurso_id_recurso_id_fk" FOREIGN KEY ("recurso_id") REFERENCES "public"."recurso"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agendamento_tenant_inicio_idx" ON "agendamento" USING btree ("tenant_id","inicio");--> statement-breakpoint
CREATE INDEX "agendamento_cliente_idx" ON "agendamento" USING btree ("cliente_id");--> statement-breakpoint
CREATE UNIQUE INDEX "automacao_tenant_tipo_idx" ON "automacao" USING btree ("tenant_id","tipo");--> statement-breakpoint
CREATE INDEX "bloqueio_tenant_inicio_idx" ON "bloqueio" USING btree ("tenant_id","inicio");--> statement-breakpoint
CREATE INDEX "cliente_tenant_idx" ON "cliente" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cliente_tenant_telefone_idx" ON "cliente" USING btree ("tenant_id","telefone");--> statement-breakpoint
CREATE INDEX "codigo_acesso_email_idx" ON "codigo_acesso" USING btree ("email","criado_em");--> statement-breakpoint
CREATE INDEX "evento_tenant_ocorrido_idx" ON "evento" USING btree ("tenant_id","ocorrido_em");--> statement-breakpoint
CREATE UNIQUE INDEX "evento_agregado_versao_idx" ON "evento" USING btree ("agregado_id","versao_agregado");--> statement-breakpoint
CREATE UNIQUE INDEX "jornada_trabalho_idx" ON "jornada_trabalho" USING btree ("tenant_id","recurso_id","dia_da_semana","inicio_min");--> statement-breakpoint
CREATE INDEX "local_tenant_idx" ON "local" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membro_tenant_usuario_idx" ON "membro" USING btree ("tenant_id","usuario_id");--> statement-breakpoint
CREATE INDEX "recurso_tenant_idx" ON "recurso" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "servico_tenant_idx" ON "servico" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "servico_recurso_idx" ON "servico_recurso" USING btree ("servico_id","recurso_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_canal_externo_idx" ON "webhook_recebido" USING btree ("canal","externo_id");