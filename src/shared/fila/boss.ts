import PgBoss from 'pg-boss';
import { env } from '../config/env';

/**
 * A fila usa o mesmo Postgres, em schema proprio. Um servico a menos para
 * manter, uma conta a menos para pagar, e um lugar so para depurar quando um
 * job nao dispara.
 */

/**
 * ARMADILHA CONHECIDA, JA PAGA POR OUTROS:
 *
 * o pg-boss atras de um pooler em MODO TRANSACAO para de funcionar SEM ERRO.
 * Ele depende de LISTEN/NOTIFY e de sessao, e o pooler descarta os dois entre
 * uma consulta e outra: os jobs simplesmente nao rodam, e nada aparece no log.
 *
 * Por isso a URL da fila e outra, em modo SESSAO — e o processo morre no boot
 * se estiver errada. Falhar alto no arranque custa um minuto; descobrir isso
 * em producao custa uma semana de lembretes que nunca sairam.
 */
export function conferirUrlDaFila(url: string): void {
  const proibido = /pgbouncer=true|[:]6543\//i;
  if (proibido.test(url)) {
    throw new Error(
      'FILA_DATABASE_URL aponta para um pooler em modo transacao. ' +
        'O pg-boss precisa de modo SESSAO (porta 5432, sem pgbouncer=true) — ' +
        'senao os jobs param de rodar sem nenhum erro.',
    );
  }
}

let instancia: PgBoss | null = null;

export async function fila(): Promise<PgBoss> {
  if (instancia !== null) return instancia;

  const url = env().FILA_DATABASE_URL ?? env().DATABASE_URL;
  conferirUrlDaFila(url);

  const boss = new PgBoss({
    connectionString: url,
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
