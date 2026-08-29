CREATE TYPE "public"."faixa_do_dia" AS ENUM('manha', 'tarde', 'qualquer');--> statement-breakpoint
CREATE TYPE "public"."status_fila" AS ENUM('esperando', 'ofertado', 'aceito', 'expirado', 'saiu');--> statement-breakpoint
ALTER TYPE "public"."papel_membro" ADD VALUE 'profissional';--> statement-breakpoint
CREATE TABLE "avaliacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agendamento_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"recurso_id" uuid,
	"nota" integer,
	"comentario" text,
	"enviado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"respondido_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fila_espera" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"servico_id" uuid NOT NULL,
	"recurso_id" uuid,
	"dia" timestamp with time zone NOT NULL,
	"faixa" "faixa_do_dia" DEFAULT 'qualquer' NOT NULL,
	"status" "status_fila" DEFAULT 'esperando' NOT NULL,
	"agendamento_atual_id" uuid,
	"ofertado_em" timestamp with time zone,
	"oferta_expira_em" timestamp with time zone,
	"oferta_inicio" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "janela_atendimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recurso_id" uuid,
	"inicio" timestamp with time zone NOT NULL,
	"fim" timestamp with time zone NOT NULL,
	"motivo" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agendamento" ADD COLUMN "checkin_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agendamento" ADD COLUMN "fila_origem_id" uuid;--> statement-breakpoint
ALTER TABLE "cliente" ADD COLUMN "usuario_id" uuid;--> statement-breakpoint
ALTER TABLE "recurso" ADD COLUMN "usuario_id" uuid;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_recurso_id_recurso_id_fk" FOREIGN KEY ("recurso_id") REFERENCES "public"."recurso"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fila_espera" ADD CONSTRAINT "fila_espera_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fila_espera" ADD CONSTRAINT "fila_espera_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fila_espera" ADD CONSTRAINT "fila_espera_servico_id_servico_id_fk" FOREIGN KEY ("servico_id") REFERENCES "public"."servico"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fila_espera" ADD CONSTRAINT "fila_espera_recurso_id_recurso_id_fk" FOREIGN KEY ("recurso_id") REFERENCES "public"."recurso"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fila_espera" ADD CONSTRAINT "fila_espera_agendamento_atual_id_agendamento_id_fk" FOREIGN KEY ("agendamento_atual_id") REFERENCES "public"."agendamento"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "janela_atendimento" ADD CONSTRAINT "janela_atendimento_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "janela_atendimento" ADD CONSTRAINT "janela_atendimento_recurso_id_recurso_id_fk" FOREIGN KEY ("recurso_id") REFERENCES "public"."recurso"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "avaliacao_agendamento_idx" ON "avaliacao" USING btree ("agendamento_id");--> statement-breakpoint
CREATE INDEX "avaliacao_tenant_idx" ON "avaliacao" USING btree ("tenant_id","respondido_em");--> statement-breakpoint
CREATE INDEX "fila_tenant_dia_idx" ON "fila_espera" USING btree ("tenant_id","dia","status");--> statement-breakpoint
CREATE INDEX "fila_cliente_idx" ON "fila_espera" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "fila_ordem_idx" ON "fila_espera" USING btree ("tenant_id","servico_id","criado_em");--> statement-breakpoint
CREATE INDEX "janela_tenant_inicio_idx" ON "janela_atendimento" USING btree ("tenant_id","inicio");--> statement-breakpoint
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cliente_tenant_usuario_idx" ON "cliente" USING btree ("tenant_id","usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recurso_usuario_idx" ON "recurso" USING btree ("tenant_id","usuario_id");