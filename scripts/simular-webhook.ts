/**
 * Simula a Meta batendo no nosso webhook.
 *
 *   npx tsx scripts/simular-webhook.ts "quero marcar quinta"
 *
 * Assina com a MESMA funcao que a rota confere — se um lado mudar, o outro
 * quebra no teste antes de quebrar aqui. Precisa de CANAL_APP_SECRET no .env e
 * do `npm run dev` de pe; com o `npm run dev:worker` junto, da para ver a
 * resposta sair no log.
 */
import { assinar } from '../src/shared/canal/assinatura';

const segredo = process.env['CANAL_APP_SECRET'];
if (segredo === undefined || segredo === '') {
  console.error('Defina CANAL_APP_SECRET no .env antes de simular.');
  process.exit(1);
}

const textoDaMensagem = process.argv[2] ?? 'oi, quero marcar um horario';
const de = process.env['SIMULAR_DE'] ?? '5511985851395';
const url = (process.env['APP_URL'] ?? 'http://localhost:3000') + '/api/webhooks/canal';

const corpo = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '102290129340398',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15550001111',
              phone_number_id: process.env['CANAL_PHONE_NUMBER_ID'] ?? '106540352242922',
            },
            contacts: [{ profile: { name: 'Simulador' }, wa_id: de }],
            messages: [
              {
                from: de,
                // Novo a cada execucao: a chave de idempotencia e o wamid, e
                // repetir o mesmo valor faria a segunda chamada ser descartada
                // — que e exatamente o que o teste de integracao verifica.
                id: 'wamid.SIMULADO.' + Date.now().toString(),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: 'text',
                text: { body: textoDaMensagem },
              },
            ],
          },
        },
      ],
    },
  ],
});

const resposta = await fetch(url, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-hub-signature-256': assinar(corpo, segredo),
  },
  body: corpo,
});

console.warn(String(resposta.status) + ' ' + (await resposta.text()));
if (!resposta.ok) process.exit(1);
