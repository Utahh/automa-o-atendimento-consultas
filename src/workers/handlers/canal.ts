import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '@/shared/db';
import { mensagensDo } from '@/shared/canal';
import { canalGateway, processarMensagem } from '@/modules/canal';
import { env } from '@/shared/config/env';
import { JOBS } from '@/shared/fila';

/**
 * Um webhook gravado vira resposta.
 *
 * `processado_em` so e marcado DEPOIS que todas as mensagens sairam. Marcar
 * antes transformaria uma falha de rede em mensagem perdida em silencio — com
 * o campo nulo, o pg-boss reagenda e a rota republica.
 */
export async function canal(payload: unknown): Promise<void> {
  const { webhookId } = JOBS.processarWebhook.schema.parse(payload);

  const linhas = await db
    .select({ corpo: schema.webhookRecebido.corpo })
    .from(schema.webhookRecebido)
    .where(
      and(eq(schema.webhookRecebido.id, webhookId), isNull(schema.webhookRecebido.processadoEm)),
    )
    .limit(1);

  const linha = linhas[0];
  // Ja processado por outra tentativa: sair calado e o comportamento certo.
  if (linha === undefined) return;

  const ecoAtivo = env().CANAL_ECO_ATIVO === true;

  for (const mensagem of mensagensDo(linha.corpo)) {
    // Webhook de status nao tem mensagem nenhuma: o laco simplesmente nao roda,
    // e a linha e marcada como processada logo abaixo.
    const r = await processarMensagem({ mensagem, gateway: canalGateway, ecoAtivo });
    if (!r.ok) {
      console.warn('[canal] mensagem nao processada: ' + JSON.stringify(r.erro));
    }
  }

  await db
    .update(schema.webhookRecebido)
    .set({ processadoEm: new Date() })
    .where(eq(schema.webhookRecebido.id, webhookId));
}
