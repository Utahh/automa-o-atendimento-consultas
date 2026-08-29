/**
 * A UNICA porta de saida do modulo da fila.
 *
 * Fila e desejo, nao reserva: nada aqui bloqueia horario de ninguem.
 */
export { entrarNaFila, sairDaFila } from './application/entrar-na-fila';
export type { EntrarNaFila } from './application/entrar-na-fila';
export { promoverDaFila } from './application/promover-da-fila';

export {
  FAIXAS,
  VALIDADE_DA_OFERTA_MIN,
  faixaDoHorario,
  mesmoDia,
  serveParaAVaga,
  proximoDaFila,
  posicaoNaFila,
  ofertaExpirada,
  calcularExpiracaoDaOferta,
} from './domain/fila';
export type { Faixa, EntradaDaFila, VagaAberta } from './domain/fila';

export { filaDoEstudio } from './consultas';
export type { EsperaNaTela } from './consultas';

export { PainelDaFila } from './ui/PainelDaFila';

export { filaRepo } from './infra/fila.repo';
