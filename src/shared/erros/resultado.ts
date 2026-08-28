/**
 * Resultado<T, E> — a fronteira devolve, nunca lança, para erro esperado.
 *
 * Erro de infraestrutura (banco caiu, rede morreu) continua sendo exceção.
 * Erro de negócio (horário ocupado, limite atingido) é um valor.
 */

export type Ok<T> = { readonly ok: true; readonly valor: T };

export type Erro<E extends string = string> = {
  readonly ok: false;
  readonly codigo: E;
  /** O que o usuário pode fazer a seguir. Erro sem ação sugerida é erro mal escrito. */
  readonly acao?: Record<string, unknown>;
};

export type Resultado<T, E extends string = string> = Ok<T> | Erro<E>;

export function ok<T>(valor: T): Ok<T> {
  return { ok: true, valor };
}

export function erro<E extends string>(codigo: E, acao?: Record<string, unknown>): Erro<E> {
  return acao === undefined ? { ok: false, codigo } : { ok: false, codigo, acao };
}

export function ehOk<T, E extends string>(r: Resultado<T, E>): r is Ok<T> {
  return r.ok;
}

export function ehErro<T, E extends string>(r: Resultado<T, E>): r is Erro<E> {
  return !r.ok;
}

/** Desembrulha ou lança — só para caminhos onde o erro é impossível por construção. */
export function desembrulhar<T, E extends string>(r: Resultado<T, E>): T {
  if (r.ok) return r.valor;
  throw new Error(`Resultado de erro desembrulhado: ${r.codigo}`);
}
