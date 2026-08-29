import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@/shared/db';

/**
 * As unicas tabelas que a aplicacao le SEM tenant: elas existem justamente
 * para descobrir qual e o tenant. Por isso nao tem RLS, e por isso o acesso
 * aqui e pelo `db` direto, nao por `withTenant()`.
 */
export const acessoRepo = {
  async usuarioPorEmail(email: string) {
    const [linha] = await db
      .select()
      .from(schema.usuario)
      .where(eq(schema.usuario.email, email))
      .limit(1);
    return linha ?? null;
  },

  async guardarCodigo(entrada: {
    readonly email: string;
    readonly codigoHash: string;
    readonly expiraEm: Date;
  }): Promise<void> {
    await db.insert(schema.codigoAcesso).values(entrada);
  },

  async codigoMaisRecente(email: string) {
    const [linha] = await db
      .select()
      .from(schema.codigoAcesso)
      .where(and(eq(schema.codigoAcesso.email, email), isNull(schema.codigoAcesso.usadoEm)))
      .orderBy(desc(schema.codigoAcesso.criadoEm))
      .limit(1);
    return linha ?? null;
  },

  async contarTentativa(id: string): Promise<void> {
    await db
      .update(schema.codigoAcesso)
      .set({ tentativas: sql`${schema.codigoAcesso.tentativas} + 1` })
      .where(eq(schema.codigoAcesso.id, id));
  },

  async marcarUsado(id: string): Promise<void> {
    await db
      .update(schema.codigoAcesso)
      .set({ usadoEm: new Date() })
      .where(eq(schema.codigoAcesso.id, id));
  },

  /** Escopo minimo, via funcao `security definer` — ver drizzle/rls.sql. */
  async tenantsDoUsuario(usuarioId: string) {
    const r = await db.execute<{ tenant_id: string; fuso: string; nome: string }>(
      sql`select * from tenants_do_usuario(${usuarioId})`,
    );
    return r.rows;
  },

  /** O mesmo, pelo lado do cliente (ADR-001). Tambem de escopo minimo. */
  async clienteDoUsuario(usuarioId: string) {
    const r = await db.execute<{ cliente_id: string; tenant_id: string; fuso: string }>(
      sql`select * from cliente_do_usuario(${usuarioId})`,
    );
    return r.rows[0] ?? null;
  },
};
