import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * A assinatura do webhook, nos dois sentidos.
 *
 * `assinar` existe para o simulador poder falar a mesma lingua que a Meta —
 * e por ser a MESMA funcao que a rota confere, nao ha como um lado mudar sem
 * o outro quebrar no teste.
 */

const PREFIXO = 'sha256=';

export function assinar(corpo: string, segredo: string): string {
  return PREFIXO + createHmac('sha256', segredo).update(corpo).digest('hex');
}

export function conferir(
  corpo: string,
  cabecalho: string | null,
  segredo: string | undefined,
): boolean {
  if (segredo === undefined || segredo === '' || cabecalho === null) return false;

  const esperado = Buffer.from(assinar(corpo, segredo));
  const recebido = Buffer.from(cabecalho);

  // timingSafeEqual LANCA com buffers de tamanhos diferentes: a guarda de
  // comprimento vem antes, e nao depois.
  if (esperado.length !== recebido.length) return false;
  return timingSafeEqual(esperado, recebido);
}
