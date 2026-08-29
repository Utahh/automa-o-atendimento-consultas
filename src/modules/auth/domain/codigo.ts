/**
 * As regras do codigo de acesso — puras, sem banco e sem relogio do sistema.
 *
 * Seis digitos sao poucos contra forca bruta: o que segura nao e o tamanho do
 * codigo, sao o prazo curto e o limite de tentativas.
 */

export const TAMANHO = 6;
export const VALIDADE_MIN = 10;
export const MAXIMO_DE_TENTATIVAS = 5;

const SO_DIGITOS = /^[0-9]+$/;

export function formatoValido(codigo: string): boolean {
  return codigo.length === TAMANHO && SO_DIGITOS.test(codigo);
}

export function expirado(expiraEm: Date, agora: Date): boolean {
  return expiraEm.getTime() <= agora.getTime();
}

export function tentativasEsgotadas(tentativas: number): boolean {
  return tentativas >= MAXIMO_DE_TENTATIVAS;
}

export function calcularExpiracao(agora: Date): Date {
  return new Date(agora.getTime() + VALIDADE_MIN * 60_000);
}

export type MotivoDeRecusa = 'FORMATO' | 'INEXISTENTE' | 'EXPIRADO' | 'ESGOTADO' | 'NAO_CONFERE';

/**
 * Decide se o codigo entra. Recebe o que foi lido do banco; nao le nada.
 * Devolver o motivo permite a fronteira responder com a acao certa — e nao
 * com um "codigo invalido" que nao diz se e para pedir outro ou esperar.
 */
export function avaliar(entrada: {
  readonly codigoDigitado: string;
  readonly registro: {
    readonly expiraEm: Date;
    readonly usadoEm: Date | null;
    readonly tentativas: number;
    readonly confere: boolean;
  } | null;
  readonly agora: Date;
}): { readonly ok: true } | { readonly ok: false; readonly motivo: MotivoDeRecusa } {
  if (!formatoValido(entrada.codigoDigitado)) return { ok: false, motivo: 'FORMATO' };

  const r = entrada.registro;
  if (r === null || r.usadoEm !== null) return { ok: false, motivo: 'INEXISTENTE' };
  if (tentativasEsgotadas(r.tentativas)) return { ok: false, motivo: 'ESGOTADO' };
  if (expirado(r.expiraEm, entrada.agora)) return { ok: false, motivo: 'EXPIRADO' };
  if (!r.confere) return { ok: false, motivo: 'NAO_CONFERE' };

  return { ok: true };
}
