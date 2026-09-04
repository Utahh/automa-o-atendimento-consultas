import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ModuloDaFila from '@/shared/fila';

/**
 * A idempotencia do webhook, contra um Postgres de verdade.
 *
 * E o unico lugar onde ela pode ser provada: `onConflictDoNothing` depende do
 * indice unico `(canal, externo_id)`, e indice nao existe em teste de unidade.
 * Antes desta fatia a chave caia num `randomUUID()`, entao o conflito NUNCA
 * acontecia — a mesma mensagem entrava duas vezes e seria respondida duas.
 *
 * Sem DATABASE_URL o arquivo inteiro e pulado, como em `db/isolamento`.
 */

const URL_DO_BANCO = process.env['DATABASE_URL'];

const enviados: { nome: string; dados: unknown }[] = [];
vi.mock('@/shared/fila', async (original) => {
  const real = await original<typeof ModuloDaFila>();
  return {
    ...real,
    // pg-boss de verdade so acrescentaria lentidao: o que se testa aqui e
    // QUANTAS vezes o job e publicado, nao se a fila funciona.
    fila: () =>
      Promise.resolve({
        send: (nome: string, dados: unknown) => {
          enviados.push({ nome, dados });
          return Promise.resolve('id-falso');
        },
      }),
  };
});

describe.skipIf(URL_DO_BANCO === undefined)('webhook do canal', () => {
  const segredo = 'segredo-de-integracao';
  process.env['CANAL_APP_SECRET'] = segredo;

  const wamid = 'wamid.INTEGRACAO.' + Date.now().toString();
  const corpo = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              messages: [
                {
                  from: '5511985851395',
                  id: wamid,
                  timestamp: '1757000000',
                  type: 'text',
                  text: { body: 'oi' },
                },
              ],
            },
          },
        ],
      },
    ],
  });

  async function bater(corpoDaVez: string, assinado = true) {
    const { assinar } = await import('@/shared/canal');
    const { POST } = await import('./route');
    return POST(
      new Request('http://localhost:3000/api/webhooks/canal', {
        method: 'POST',
        headers: assinado
          ? { 'x-hub-signature-256': assinar(corpoDaVez, segredo) }
          : { 'x-hub-signature-256': 'sha256=invalida' },
        body: corpoDaVez,
      }),
    );
  }

  async function linhasCom(externoId: string) {
    const { db, schema } = await import('@/shared/db');
    return db
      .select({ id: schema.webhookRecebido.id })
      .from(schema.webhookRecebido)
      .where(eq(schema.webhookRecebido.externoId, externoId));
  }

  beforeEach(() => {
    enviados.length = 0;
  });

  afterAll(async () => {
    const { db, schema } = await import('@/shared/db');
    await db.delete(schema.webhookRecebido).where(eq(schema.webhookRecebido.externoId, wamid));
  });

  it('grava a mensagem e publica o job', async () => {
    const resposta = await bater(corpo);

    expect(resposta.status).toBe(200);
    expect(await linhasCom(wamid)).toHaveLength(1);
    expect(enviados).toHaveLength(1);
    expect(enviados[0]?.nome).toBe('canal.webhook');
  });

  it('o MESMO corpo duas vezes gera UMA linha', async () => {
    await bater(corpo);

    expect(await linhasCom(wamid)).toHaveLength(1);
  });

  it('republica o job quando a linha ficou por processar', async () => {
    // Duplicata com `processado_em` nulo significa que o publish anterior pode
    // ter falhado depois do insert. Republicar e o que evita a mensagem orfa.
    await bater(corpo);

    expect(enviados).toHaveLength(1);
  });

  it('assinatura invalida devolve 401 e nao grava nada', async () => {
    const outro = corpo.replace(wamid, wamid + '.NAO');

    const resposta = await bater(outro, false);

    expect(resposta.status).toBe(401);
    expect(await linhasCom(wamid + '.NAO')).toHaveLength(0);
    expect(enviados).toHaveLength(0);
  });
});
