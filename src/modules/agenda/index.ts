/**
 * A UNICA porta de saida do modulo.
 *
 * Quem esta de fora importa daqui — nunca de `domain/`, `application/` ou
 * `infra/`. Importar o caminho interno de um irmao e erro de lint: ou vira
 * exportacao explicita, ou o limite entre os dois modulos esta errado.
 */
export { criarAgendamentoAction } from './actions';

export {
  criarAgendamentoSchema,
  remarcarSchema,
  mudarStatusSchema,
  consultarDisponibilidadeSchema,
  agendamentoDaTelaSchema,
  slotSchema,
} from './schemas';
export type {
  CriarAgendamento,
  Remarcar,
  MudarStatus,
  ConsultarDisponibilidade,
  AgendamentoDaTela,
  Slot,
} from './schemas';

export { AgendaDia } from './ui/AgendaDia';
export { SlotChip } from './ui/SlotChip';
export { SheetNovoAgendamento, BotaoNovoAgendamento } from './ui/SheetNovoAgendamento';
export { AcoesDaAgenda } from './ui/AcoesDaAgenda';
export type { Opcao } from './ui/SheetNovoAgendamento';

export { slotsLivres } from './domain/disponibilidade';
export type { Intervalo, Disponibilidade } from './domain/disponibilidade';
export { STATUS, podeIrPara, ocupaAgenda, ehFinal } from './domain/transicoes';
export type { Status } from './domain/transicoes';
export { janelasDoDia, formatarHora, diaDaSemanaDe } from './domain/jornada';
export type { FaixaDeJornada } from './domain/jornada';
