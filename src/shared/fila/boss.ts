import PgBoss from 'pg-boss';
import { env } from '../config/env';

/**
 * A fila usa o mesmo Postgres, em schema proprio. Um servico a menos para
 * manter, e a mensagem so existe se a transacao que a criou tiver fechado.
 */
let instancia: PgBoss | null = null;

export async function fila(): Promise<PgBoss> {
  if (instancia !== null) return instancia;

  const boss = new PgBoss({
    connectionString: env().FILA_DATABASE_URL ?? env().DATABASE_URL,
    schema: 'fila',
    retryLimit: 5,
    retryBackoff: true,
  });

  boss.on('error', (e) => {
    console.error('[fila] erro', e);
  });

  await boss.start();
  instancia = boss;
  return boss;
}

export async function pararFila(): Promise<void> {
  if (instancia === null) return;
  await instancia.stop({ graceful: true });
  instancia = null;
}
