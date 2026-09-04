import { z } from 'zod';

/**
 * Ambiente validado uma vez, no arranque. Variável faltando derruba o processo
 * agora — não na primeira requisição do cliente às 8 da manhã.
 */
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  FILA_DATABASE_URL: z.string().url().optional(),
  APP_URL: z.string().url().default('http://localhost:3000'),
  TZ: z.string().default('America/Sao_Paulo'),
  SESSAO_SECRET: z.string().min(32).optional(),
  CANAL_VERIFY_TOKEN: z.string().optional(),
  CANAL_APP_SECRET: z.string().optional(),
  CANAL_TOKEN: z.string().optional(),
  CANAL_PHONE_NUMBER_ID: z.string().optional(),
  /**
   * O eco e comportamento descartavel: ele prova que o circuito fecha e some
   * quando o roteador chegar. Desligado por padrao — sem isso, um cliente real
   * receberia "eco" no dia em que a VPS subisse com o token configurado.
   */
  CANAL_ECO_ATIVO: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  IA_API_KEY: z.string().optional(),
  IA_MODELO_PADRAO: z.string().default('claude-sonnet-5'),
  IA_MODELO_FALLBACK: z.string().default('claude-haiku-4-5-20251001'),
  WORKER_PORT: z.coerce.number().int().positive().default(3001),
  WORKER_CONCORRENCIA: z.coerce.number().int().positive().default(4),

  // Opcionais, todos com plano gratuito. Sem eles o produto roda: o codigo de
  // acesso sai pelo log, e nada de terceiro precisa existir para testar.
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  POSTHOG_KEY: z.string().optional(),
});

export type Env = z.infer<typeof esquema>;

let cache: Env | null = null;

export function env(): Env {
  if (cache !== null) return cache;
  const analisado = esquema.safeParse(process.env);
  if (!analisado.success) {
    const campos = analisado.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Ambiente inválido. Verifique .env — campos: ${campos}`);
  }
  cache = analisado.data;
  return cache;
}

export const FUSO_PADRAO = 'America/Sao_Paulo';
