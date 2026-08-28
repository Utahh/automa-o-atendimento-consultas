import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../config/env';

/**
 * Um pool por processo, criado na PRIMEIRA consulta — não no import.
 *
 * Importar este módulo durante o build não pode exigir banco nem variável de
 * ambiente: o `next build` importa toda rota para coletar metadados.
 */
const global_ = globalThis as unknown as {
  __kairoPool?: Pool;
  __kairoDb?: NodePgDatabase<typeof schema>;
};

function conexao(): NodePgDatabase<typeof schema> {
  if (global_.__kairoDb !== undefined) return global_.__kairoDb;

  global_.__kairoPool ??= new Pool({
    connectionString: env().DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
  global_.__kairoDb = drizzle(global_.__kairoPool, { schema });
  return global_.__kairoDb;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_alvo, propriedade) {
    const real = conexao();
    const valor: unknown = Reflect.get(real, propriedade);
    return typeof valor === 'function'
      ? (valor as (...argumentos: unknown[]) => unknown).bind(real)
      : valor;
  },
});

export type Db = NodePgDatabase<typeof schema>;
export { schema };
