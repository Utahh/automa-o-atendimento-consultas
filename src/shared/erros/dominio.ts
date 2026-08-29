/**
 * Erros como DADO.
 *
 * Cada codigo carrega o que o consumidor precisa para se recuperar — e cada um
 * tem tres textos em i18n: para a profissional, para o cliente final (usado
 * pelo agente) e a acao sugerida.
 *
 * Erro sem acao sugerida e erro mal escrito, e e recusado na revisao.
 * "Nao foi possivel concluir" nao e mensagem; e desistencia.
 */

export type ErroDominio =
  | { readonly codigo: 'HORARIO_OCUPADO'; readonly slotSugerido: readonly SlotSugerido[] }
  | { readonly codigo: 'FORA_DO_EXPEDIENTE' }
  | { readonly codigo: 'ANTECEDENCIA_INSUFICIENTE'; readonly minimoHoras: number }
  | { readonly codigo: 'SERVICO_INATIVO' }
  | { readonly codigo: 'CANAL_DESCONECTADO' }
  | { readonly codigo: 'LIMITE_PLANO'; readonly recurso: string; readonly limite: number }
  | { readonly codigo: 'CONSENTIMENTO_AUSENTE'; readonly finalidade: string }
  | { readonly codigo: 'AGENDAMENTO_NAO_ENCONTRADO' }
  | { readonly codigo: 'CONFLITO_DE_VERSAO' }
  | { readonly codigo: 'TRANSICAO_INVALIDA'; readonly de: string; readonly para: string }
  | { readonly codigo: 'DADOS_INVALIDOS'; readonly campos: readonly string[] };

export type CodigoDeErro = ErroDominio['codigo'];

/** Um horario alternativo, ja formatado no servidor. */
export type SlotSugerido = {
  readonly inicioISO: string;
  readonly horaFormatada: string;
};

export const CODIGOS_DE_ERRO = [
  'HORARIO_OCUPADO',
  'FORA_DO_EXPEDIENTE',
  'ANTECEDENCIA_INSUFICIENTE',
  'SERVICO_INATIVO',
  'CANAL_DESCONECTADO',
  'LIMITE_PLANO',
  'CONSENTIMENTO_AUSENTE',
  'AGENDAMENTO_NAO_ENCONTRADO',
  'CONFLITO_DE_VERSAO',
  'TRANSICAO_INVALIDA',
  'DADOS_INVALIDOS',
] as const satisfies readonly CodigoDeErro[];
