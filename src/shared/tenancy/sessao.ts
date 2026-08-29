import 'server-only';
import { cookies } from 'next/headers';
import { NaoAutenticado, NaoAutorizado } from '../erros';
import { env, FUSO_PADRAO } from '../config/env';
import {
  COOKIE_DE_SESSAO,
  DURACAO_DA_SESSAO_MS,
  criarValorDeSessao,
  lerValorDeSessao,
  type PapelDaSessao,
  type Sessao,
} from './cookie';

/**
 * A identidade da porta de escrita: cookie assinado, httpOnly, sameSite=lax,
 * com prazo absoluto. A assinatura em si vive em `cookie.ts`.
 */
export type { Sessao, PapelDaSessao };

export type SessaoDeCliente = Sessao & { readonly papel: 'cliente'; readonly clienteId: string };

function segredo(): string {
  const s = env().SESSAO_SECRET;
  if (s === undefined) throw new Error('SESSAO_SECRET ausente. Gere com: openssl rand -base64 32');
  return s;
}

export async function sessaoAtual(): Promise<Sessao | null> {
  const bruto = (await cookies()).get(COOKIE_DE_SESSAO)?.value;
  return bruto === undefined ? null : lerValorDeSessao(bruto, segredo(), FUSO_PADRAO);
}

/** Usada por toda action: sem sessao, nada acontece. */
export async function exigirSessao(): Promise<Sessao> {
  const s = await sessaoAtual();
  if (s === null) throw new NaoAutenticado();
  return s;
}

/** A porta do estudio: dono, operador ou profissional. */
export async function exigirSessaoDoEstudio(): Promise<Sessao> {
  const s = await exigirSessao();
  if (s.papel !== 'estudio') throw new NaoAutorizado('a area do estudio');
  return s;
}

/** A porta do cliente. Sem clienteId nao ha sessao de cliente. */
export async function exigirSessaoDeCliente(): Promise<SessaoDeCliente> {
  const s = await exigirSessao();
  if (s.papel !== 'cliente' || s.clienteId === undefined) {
    throw new NaoAutorizado('a area do cliente');
  }
  return { ...s, papel: 'cliente', clienteId: s.clienteId };
}

export async function gravarSessao(sessao: Sessao): Promise<void> {
  (await cookies()).set(COOKIE_DE_SESSAO, criarValorDeSessao(sessao, segredo()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env().NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_DA_SESSAO_MS / 1000,
  });
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(COOKIE_DE_SESSAO);
}
