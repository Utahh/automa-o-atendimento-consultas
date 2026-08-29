import { z } from 'zod';
import { TAMANHO } from './domain/codigo';

export const solicitarCodigoSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type SolicitarCodigo = z.infer<typeof solicitarCodigoSchema>;

export const confirmarCodigoSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  codigo: z.string().trim().length(TAMANHO),
});
export type ConfirmarCodigo = z.infer<typeof confirmarCodigoSchema>;
