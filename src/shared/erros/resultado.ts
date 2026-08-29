import type { ErroDominio } from './dominio';

/**
 * Resultado<T, E> — a fronteira DEVOLVE, nunca lanca, para erro esperado.
 *
 * Erro de infraestrutura (banco caiu, rede morreu) continua sendo excecao.
 * Erro de negocio (horario ocupado, limite atingido) e um valor, e viaja
 * ate a tela e ate o agente sem virar string no caminho.
 */

export type Ok<T> = { readonly ok: true; readonly valor: T };
export type Falha<E> = { readonly ok: false; readonly erro: E };

export type Resultado<T, E = ErroDominio> = Ok<T> | Falha<E>;

export function ok<T>(valor: T): Ok<T> {
  return { ok: true, valor };
}

export function erro<E>(erro: E): Falha<E> {
  return { ok: false, erro };
}

export function ehOk<T, E>(r: Resultado<T, E>): r is Ok<T> {
  return r.ok;
}

export function ehFalha<T, E>(r: Resultado<T, E>): r is Falha<E> {
  return !r.ok;
}

/** Desembrulha ou lanca — so para caminhos onde a falha e impossivel por construcao. */
export function desembrulhar<T, E>(r: Resultado<T, E>): T {
  if (r.ok) return r.valor;
  throw new Error('Resultado de falha desembrulhado: ' + JSON.stringify(r.erro));
}
