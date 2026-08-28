import { z } from 'zod';
import { STATUS } from './domain/transicoes';

/**
 * O CONTRATO com o front.
 *
 * O schema e a fonte; o tipo TypeScript e DERIVADO dele. Nada e escrito duas
 * vezes — e se o back mudar o schema, o front quebra na compilacao, nao em
 * producao.
 */

export const criarAgendamentoSchema = z.object({
  clienteId: z.string().uuid(),
  servicoId: z.string().uuid(),
  recursoId: z.string().uuid().nullable().default(null),
  inicio: z.coerce.date(),
  observacao: z.string().max(500).optional(),
});
export type CriarAgendamento = z.infer<typeof criarAgendamentoSchema>;

export const remarcarSchema = z.object({
  agendamentoId: z.string().uuid(),
  novoInicio: z.coerce.date(),
  /** Bloqueio otimista: a UI devolve a versao que leu. */
  versao: z.number().int().positive(),
});
export type Remarcar = z.infer<typeof remarcarSchema>;

export const mudarStatusSchema = z.object({
  agendamentoId: z.string().uuid(),
  status: z.enum(STATUS),
  versao: z.number().int().positive(),
});
export type MudarStatus = z.infer<typeof mudarStatusSchema>;

export const consultarDisponibilidadeSchema = z.object({
  servicoId: z.string().uuid(),
  dia: z.coerce.date(),
});
export type ConsultarDisponibilidade = z.infer<typeof consultarDisponibilidadeSchema>;

/** O que a agenda devolve para a tela. Sem SQL, sem coluna crua. */
export const agendamentoDaTelaSchema = z.object({
  id: z.string().uuid(),
  inicio: z.coerce.date(),
  fim: z.coerce.date(),
  status: z.enum(STATUS),
  versao: z.number().int().positive(),
  clienteNome: z.string(),
  servicoNome: z.string(),
  /** Ja formatado no servidor: o cliente nao carrega biblioteca de data. */
  horaFormatada: z.string(),
});
export type AgendamentoDaTela = z.infer<typeof agendamentoDaTelaSchema>;

export const slotSchema = z.object({
  inicioISO: z.string().datetime(),
  horaFormatada: z.string(),
});
export type Slot = z.infer<typeof slotSchema>;
