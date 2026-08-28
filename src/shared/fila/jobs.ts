import { z } from 'zod';

/**
 * O catalogo de jobs. Nome e payload num lugar so — o worker e quem publica
 * usam o mesmo schema, entao nao existe job com payload errado.
 */
export const JOBS = {
  lembreteDeAgendamento: {
    nome: 'agendamento.lembrete',
    schema: z.object({
      tenantId: z.string().uuid(),
      agendamentoId: z.string().uuid(),
      canal: z.enum(['oficial', 'email']),
    }),
  },
  processarWebhook: {
    nome: 'canal.webhook',
    schema: z.object({ webhookId: z.string().uuid() }),
  },
} as const;

export type NomeDeJob = (typeof JOBS)[keyof typeof JOBS]['nome'];
