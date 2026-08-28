import { z } from 'zod';
import { STATUS } from './domain/transicoes';

/**
 * O CONTRATO com o front.
 *
 * O schema é a fonte; o tipo TypeScript é derivado dele. Nada é escrito duas
 * vezes — e se o back mudar o schema, o front quebra na compilação, não em
 * produção.
 */

export const criarAgendamentoSchema = z.object({
  clienteId: z.string().uuid(),
  servicoId: z.string().uuid(),
  inicio: z.coerce.date(),
  observacao: z.string().max(500).optional(),
});
export type CriarAgendamento = z.infer<typeof criarAgendamentoSchema>;

export const remarcarAgendamentoSchema = z.object({
  agendamentoId: z.string().uuid(),
  novoInicio: z.coerce.date(),
  /** Bloqueio otimista: a UI devolve a versão que leu. */
  versao: z.number().int().positive(),
});
export type RemarcarAgendamento = z.infer<typeof remarcarAgendamentoSchema>;

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
  /** Já formatado no servidor: o cliente não carrega biblioteca de data. */
  horaFormatada: z.string(),
});
export type AgendamentoDaTela = z.infer<typeof agendamentoDaTelaSchema>;

export const slotSchema = z.object({
  inicio: z.coerce.date(),
  fim: z.coerce.date(),
  horaFormatada: z.string(),
});
export type Slot = z.infer<typeof slotSchema>;

/** Códigos de erro que a agenda sabe devolver. Cada um tem texto em i18n. */
export const CODIGOS_DE_ERRO = [
  'HORARIO_OCUPADO',
  'FORA_DA_JORNADA',
  'ANTECEDENCIA_INSUFICIENTE',
  'AGENDAMENTO_NAO_ENCONTRADO',
  'CONFLITO_DE_VERSAO',
  'TRANSICAO_INVALIDA',
  'DADOS_INVALIDOS',
] as const;
export type CodigoDeErroDaAgenda = (typeof CODIGOS_DE_ERRO)[number];
