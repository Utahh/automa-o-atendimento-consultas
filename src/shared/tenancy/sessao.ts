import 'server-only';
import { cookies } from 'next/headers';
import { NaoAutenticado } from '../erros';
import { FUSO_PADRAO } from '../config/env';

/**
 * A identidade da porta de escrita. Sprint 1 troca este cookie por sessão
 * assinada com prazo absoluto; a assinatura desta função não muda.
 */
export type Sessao = {
  readonly tenantId: string;
  readonly usuarioId: string;
  readonly fuso: string;
};

const COOKIE = 'kairo_sessao';

export async function sessaoAtual(): Promise<Sessao | null> {
  const jar = await cookies();
  const bruto = jar.get(COOKIE)?.value;
  if (bruto === undefined) return null;

  try {
    const dados = JSON.parse(
      Buffer.from(bruto, 'base64url').toString('utf8'),
    ) as Partial<Sessao> | null;
    if (dados === null || typeof dados.tenantId !== 'string' || typeof dados.usuarioId !== 'string')
      return null;
    return {
      tenantId: dados.tenantId,
      usuarioId: dados.usuarioId,
      fuso: dados.fuso ?? FUSO_PADRAO,
    };
  } catch {
    return null;
  }
}

/** Usado por toda action: sem sessão, nada acontece. */
export async function exigirSessao(): Promise<Sessao> {
  const s = await sessaoAtual();
  if (s === null) throw new NaoAutenticado();
  return s;
}
