import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * A assinatura do cookie de sessao, separada do resto por um motivo pratico:
 * `sessao.ts` e `server-only`, e o preparo dos testes de layout precisa criar
 * uma sessao valida sem subir o Next inteiro.
 *
 * O prazo e ABSOLUTO: a sessao morre 7 dias depois de nascer, e usar o produto
 * nao estende esse prazo. Sessao que se renova sozinha nunca expira de
 * verdade — e o celular fica no balcao o dia inteiro.
 */

export const COOKIE_DE_SESSAO = 'kairo_sessao';
export const DURACAO_DA_SESSAO_MS = 7 * 24 * 60 * 60 * 1000;

export type Sessao = {
  readonly usuarioId: string;
  readonly tenantId: string;
  readonly fuso: string;
};

type Conteudo = Sessao & { readonly exp: number };

function assinar(carga: string, segredo: string): string {
  return createHmac('sha256', segredo).update(carga).digest('base64url');
}

export function criarValorDeSessao(sessao: Sessao, segredo: string, agora = new Date()): string {
  const conteudo: Conteudo = { ...sessao, exp: agora.getTime() + DURACAO_DA_SESSAO_MS };
  const carga = Buffer.from(JSON.stringify(conteudo), 'utf8').toString('base64url');
  return carga + '.' + assinar(carga, segredo);
}

export function lerValorDeSessao(
  valor: string,
  segredo: string,
  fusoPadrao: string,
  agora = new Date(),
): Sessao | null {
  const [carga, assinatura] = valor.split('.');
  if (carga === undefined || assinatura === undefined) return null;

  const esperada = Buffer.from(assinar(carga, segredo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;

  let conteudo: Partial<Conteudo>;
  try {
    conteudo = JSON.parse(Buffer.from(carga, 'base64url').toString('utf8')) as Partial<Conteudo>;
  } catch {
    return null;
  }

  const { usuarioId, tenantId, exp } = conteudo;
  if (typeof usuarioId !== 'string' || typeof tenantId !== 'string') return null;
  if (typeof exp !== 'number' || exp <= agora.getTime()) return null;

  return { usuarioId, tenantId, fuso: conteudo.fuso ?? fusoPadrao };
}
