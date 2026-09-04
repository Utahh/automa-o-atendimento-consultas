import { createHash } from 'node:crypto';
import { z } from 'zod';

/**
 * O que a Cloud API manda, reduzido ao que sabemos ler.
 *
 * A regra desta camada e uma so: NADA aqui lanca por formato. A Meta entrega
 * evento que ainda nao modelamos (audio, imagem, localizacao, status), e um
 * erro aqui viraria 4xx na rota — que faz a Meta reenviar para sempre.
 */

export type MensagemRecebida =
  | {
      readonly tipo: 'texto';
      readonly wamid: string;
      readonly de: string;
      readonly texto: string;
      readonly em: Date;
    }
  | {
      readonly tipo: 'botao';
      readonly wamid: string;
      readonly de: string;
      readonly id: string;
      readonly titulo: string;
      readonly em: Date;
    };

const comum = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
});

/**
 * Botao de TEMPLATE e botao de mensagem interativa sao formatos diferentes.
 * O sub-projeto 2 usa template — entao e o `button` que vai chegar aqui.
 */
const mensagemTexto = comum.extend({
  type: z.literal('text'),
  text: z.object({ body: z.string() }),
});

const mensagemBotaoDeTemplate = comum.extend({
  type: z.literal('button'),
  button: z.object({ payload: z.string(), text: z.string() }),
});

const mensagemBotaoInterativo = comum.extend({
  type: z.literal('interactive'),
  interactive: z.object({
    type: z.literal('button_reply'),
    button_reply: z.object({ id: z.string(), title: z.string() }),
  }),
});

const envelope = z.object({
  entry: z
    .array(
      z.object({
        changes: z
          .array(
            z.object({
              value: z
                .object({ messages: z.array(z.unknown()).optional() })
                .passthrough()
                .optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

function instante(timestamp: string): Date {
  return new Date(Number(timestamp) * 1000);
}

/** Uma mensagem crua vira `MensagemRecebida`, ou nada se ainda nao a lemos. */
function interpretar(bruta: unknown): MensagemRecebida | null {
  const texto = mensagemTexto.safeParse(bruta);
  if (texto.success) {
    return {
      tipo: 'texto',
      wamid: texto.data.id,
      de: texto.data.from,
      texto: texto.data.text.body,
      em: instante(texto.data.timestamp),
    };
  }

  const template = mensagemBotaoDeTemplate.safeParse(bruta);
  if (template.success) {
    return {
      tipo: 'botao',
      wamid: template.data.id,
      de: template.data.from,
      id: template.data.button.payload,
      titulo: template.data.button.text,
      em: instante(template.data.timestamp),
    };
  }

  const interativo = mensagemBotaoInterativo.safeParse(bruta);
  if (interativo.success) {
    return {
      tipo: 'botao',
      wamid: interativo.data.id,
      de: interativo.data.from,
      id: interativo.data.interactive.button_reply.id,
      titulo: interativo.data.interactive.button_reply.title,
      em: instante(interativo.data.timestamp),
    };
  }

  return null;
}

/** Todas as mensagens legiveis do payload. Vazio para status e tipos futuros. */
export function mensagensDo(payload: unknown): readonly MensagemRecebida[] {
  const analisado = envelope.safeParse(payload);
  if (!analisado.success) return [];

  const lidas: MensagemRecebida[] = [];
  for (const entrada of analisado.data.entry ?? []) {
    for (const mudanca of entrada.changes ?? []) {
      for (const bruta of mudanca.value?.messages ?? []) {
        const mensagem = interpretar(bruta);
        if (mensagem !== null) lidas.push(mensagem);
      }
    }
  }
  return lidas;
}

/**
 * A chave de idempotencia da entrega.
 *
 * O `wamid` identifica a MENSAGEM: pega a mesma mensagem chegando em entregas
 * diferentes, que e o reenvio que a Meta faz quando nao recebe 200 a tempo.
 * Sem mensagem legivel — status, tipo desconhecido — cai no hash do corpo cru,
 * que e deterministico e cobre o resto.
 */
export function chaveDe(payload: unknown, bruto: string): string {
  const primeira = mensagensDo(payload)[0];
  if (primeira !== undefined) return primeira.wamid;
  return createHash('sha256').update(bruto).digest('hex');
}
