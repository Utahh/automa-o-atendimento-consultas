import { createHmac, randomInt } from 'node:crypto';
import { env } from '@/shared/config/env';
import { entregarCodigo } from '@/shared/notificacao/entregar-codigo';
import { calcularExpiracao, TAMANHO } from '../domain/codigo';
import { acessoRepo } from '../infra/acesso.repo';

/**
 * Gera e entrega o codigo.
 *
 * Devolve sempre a mesma coisa, exista ou nao a conta: quem esta do outro lado
 * nao descobre quais e-mails estao cadastrados so por tentar entrar.
 */
export function hashDoCodigo(email: string, codigo: string): string {
  const segredo = env().SESSAO_SECRET ?? 'sem-segredo';
  // O e-mail entra no hash para que um codigo nao sirva para outra conta.
  return createHmac('sha256', segredo)
    .update(email + ':' + codigo)
    .digest('hex');
}

export async function solicitarCodigo(email: string, agora = new Date()): Promise<void> {
  const usuario = await acessoRepo.usuarioPorEmail(email);
  if (usuario === null) return;

  const codigo = String(randomInt(0, 10 ** TAMANHO)).padStart(TAMANHO, '0');

  await acessoRepo.guardarCodigo({
    email,
    codigoHash: hashDoCodigo(email, codigo),
    expiraEm: calcularExpiracao(agora),
  });

  await entregarCodigo(email, codigo);
}
