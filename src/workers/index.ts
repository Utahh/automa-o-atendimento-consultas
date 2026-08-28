import { fila, pararFila, JOBS } from '@/shared/fila';
import { env } from '@/shared/config/env';
import { iniciarHeartbeat } from './heartbeat';
import { lembrete } from './handlers/lembrete';

/**
 * O SEGUNDO RUNTIME.
 *
 * Processo longo e estavel nao vive bem em funcao serverless: por isso o
 * worker e um processo Node comum, numa VPS, com /healthz proprio.
 */
async function principal(): Promise<void> {
  const config = env();
  const servidor = iniciarHeartbeat(config.WORKER_PORT);
  const boss = await fila();

  await boss.work(
    JOBS.lembreteDeAgendamento.nome,
    { batchSize: config.WORKER_CONCORRENCIA },
    async (mensagens) => {
      for (const m of mensagens) await lembrete(m.data);
    },
  );

  console.warn('[worker] de pe na porta ' + String(config.WORKER_PORT));

  const encerrar = (sinal: string) => {
    console.warn('[worker] encerrando por ' + sinal);
    void (async () => {
      servidor.close();
      await pararFila();
      process.exit(0);
    })();
  };

  process.on('SIGTERM', () => encerrar('SIGTERM'));
  process.on('SIGINT', () => encerrar('SIGINT'));
}

principal().catch((e: unknown) => {
  console.error('[worker] falhou ao subir', e);
  process.exit(1);
});
