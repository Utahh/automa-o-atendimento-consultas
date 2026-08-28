import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db, schema } from '@/shared/db';
import { env } from '@/shared/config/env';

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

  if (!assinaturaValida(bruto, assinatura)) {
    return new NextResponse(null, { status: 401 });
  }

  const corpo = JSON.parse(bruto) as Record<string, unknown>;
  const idDoProvedor = corpo['id'];
  const externoId =
    typeof idDoProvedor === 'string'
      ? idDoProvedor
      : (requisicao.headers.get('x-request-id') ?? randomUUID());

  await db
    .insert(schema.webhookRecebido)
    .values({ canal: 'oficial', externoId, corpo })
    .onConflictDoNothing();

  // O enfileiramento acontece no worker, que le o que ainda nao foi processado.
  return NextResponse.json({ recebido: true });
}

function assinaturaValida(corpo: string, cabecalho: string | null): boolean {
  const segredo = env().CANAL_APP_SECRET;
  if (segredo === undefined || cabecalho === null) return false;

  const esperado = 'sha256=' + createHmac('sha256', segredo).update(corpo).digest('hex');
  const a = Buffer.from(esperado);
  const b = Buffer.from(cabecalho);
  return a.length === b.length && timingSafeEqual(a, b);
}
