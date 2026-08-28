/**
 * A ÚNICA porta de saída do módulo. Quem está de fora importa daqui — nunca de
 * `domain/`, `application/` ou `infra/`. A regra é lint, não combinado.
 */
export { criarAgendamentoAction } from './actions';
export {
  criarAgendamentoSchema,
  remarcarAgendamentoSchema,
  mudarStatusSchema,
  consultarDisponibilidadeSchema,
  agendamentoDaTelaSchema,
  slotSchema,
  CODIGOS_DE_ERRO,
} from './schemas';
export type {
  CriarAgendamento,
  RemarcarAgendamento,
  MudarStatus,
  ConsultarDisponibilidade,
  AgendamentoDaTela,
  Slot,
  CodigoDeErroDaAgenda,
} from './schemas';
export { STATUS, podeIrPara, ocupaAgenda } from './domain/transicoes';
export type { Status } from './domain/transicoes';
export { AgendaDoDia } from './ui/agenda-do-dia';
export { ChipDeHorario } from './ui/chip-de-horario';
