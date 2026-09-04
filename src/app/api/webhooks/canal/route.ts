import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db, schema } from '@/shared/db';
import { env } from '@/shared/config/env';
import { chaveDe, conferir } from '@/shared/canal';
import { fila, JOBS } from '@/shared/fila';

/**
 * Webhook. Tres passos e nada mais:
 *
 *   1. valida a assinatura
 *   2. grava cru (idempotente pela chave do provedor)
 *   3. enfileira
 *
 * Nenhuma regra de negocio mora aqui. Quem interpreta a mensagem e o worker.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  const desafio = url.searchParams.get('hub.challenge');
  const token = url.searchParams.get('hub.verify_token');
  if (token !== env().CANAL_VERIFY_TOKEN || desafio === null) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(desafio, { status: 200 });
}

export async function POST(requisicao: Request) {
  const bruto = await requisicao.text();
  const assinatura = requisicao.headers.get('x-hub-signature-256');

  if (!conferir(bruto, assinatura, env().CANAL_APP_SECRET)) {
    return new NextResponse(null, { status: 401 });
  }

  /*
   * A rota NUNCA rejeita por formato. A Meta entrega evento que ainda nao
   * modelamos, e um 4xx a faz reenviar para sempre — entao o corpo entra cru
   * mesmo quando nao sabemos lê-lo.
   */
  let corpo: unknown = null;
  try {
    corpo = JSON.parse(bruto);
  } catch {
    corpo = { naoAnalisado: bruto };
  }

  const externoId = chaveDe(corpo, bruto);

  const inseridos = await db
    .insert(schema.webhookRecebido)
    .values({ canal: 'oficial', externoId, corpo })
    .onConflictDoNothing()
    .returning({ id: schema.webhookRecebido.id });

  const novo = inseridos[0];
  if (novo !== undefined) {
    await enfileirar(novo.id);
    return NextResponse.json({ recebido: true });
  }

  /*
   * Array vazio significa duplicata — e duplicata tem duas causas. Reenvio da
   * Meta depois de um processamento que ja aconteceu: nada a fazer. Ou o
   * publish ter falhado DEPOIS do insert na tentativa anterior, e ai a linha
   * ficaria orfa para sempre. Republicar o que ainda nao foi processado fecha
   * esse buraco sem precisar de varredura periodica.
   */
  const pendente = await db
    .select({ id: schema.webhookRecebido.id })
    .from(schema.webhookRecebido)
    .where(
      and(
        eq(schema.webhookRecebido.canal, 'oficial'),
        eq(schema.webhookRecebido.externoId, externoId),
        isNull(schema.webhookRecebido.processadoEm),
      ),
    )
    .limit(1);

  const orfao = pendente[0];
  if (orfao !== undefined) await enfileirar(orfao.id);

  return NextResponse.json({ recebido: true });
}

async function enfileirar(webhookId: string): Promise<void> {
  const boss = await fila();
  await boss.send(JOBS.processarWebhook.nome, { webhookId });
}
