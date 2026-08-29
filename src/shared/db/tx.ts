import { sql } from 'drizzle-orm';
import { db, type Db } from './client';
import { NaoAutorizado, TenantAusente } from '../erros';

/** A transação que os casos de uso recebem. Ninguém abre a própria conexão. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * A ÚNICA porta de acesso ao banco.
 *
 * Abre a transação e fixa `app.tenant_id` nela — é esse valor que as políticas
 * de RLS leem. Query fora daqui não enxerga linha nenhuma, por construção:
 * o isolamento não depende de alguém lembrar do `where tenant_id = ...`.
 */
export async function withTenant<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!tenantId) throw new TenantAusente();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    await tx.execute(sql`select set_config('app.papel', 'usuario', true)`);
    return fn(tx);
  });
}

/**
 * A porta do CLIENTE (ADR-001).
 *
 * Fixa o tenant E o cliente na transacao. As politicas de RLS leem os dois:
 * catalogo o cliente le inteiro, porque precisa para escolher; agendamento,
 * fila, avaliacao e ficha ele so ve na linha que e dele.
 *
 * Ter conta nao pode significar ler a agenda do estudio — e quem garante isso
 * e o banco, nao a lembranca de quem escreve a consulta.
 */
export async function withCliente<T>(
  tenantId: string,
  clienteId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  if (!tenantId) throw new TenantAusente();
  if (!clienteId) throw new NaoAutorizado('agir como cliente sem identidade');

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    await tx.execute(sql`select set_config('app.papel', 'cliente', true)`);
    await tx.execute(sql`select set_config('app.cliente_id', ${clienteId}, true)`);
    return fn(tx);
  });
}

/**
 * Para jobs e rotinas internas. O job REVALIDA automação, consentimento,
 * canal, janela de silêncio e limite antes de agir — o bypass de RLS não
 * dispensa nenhuma dessas checagens.
 */
export async function withSystemTenant<T>(
  tenantId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  if (!tenantId) throw new TenantAusente();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    await tx.execute(sql`select set_config('app.papel', 'sistema', true)`);
    return fn(tx);
  });
}
