/**
 * O app do cliente (ADR-001). Porta unica do modulo.
 *
 * Leitura por `consultas`, escrita por `actions` — e as duas passam por
 * `withCliente()`, que fixa tenant E cliente na transacao.
 */
export { catalogo, diasComVaga, profissionaisNoDia, minhaAgenda } from './consultas';
export type {
  ServicoDoCatalogo,
  DiaComVaga,
  ProfissionalNoDia,
  MeuAgendamento,
  MinhaEspera,
  MinhaAgenda,
} from './consultas';

export { marcarAction, entrarNaFilaAction, sairDaFilaAction, checkinAction } from './actions';

export { MinhaAgendaCliente } from './ui/MinhaAgendaCliente';
export { FluxoDeMarcacao } from './ui/FluxoDeMarcacao';
