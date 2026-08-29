'use server';

import { redirect } from 'next/navigation';
import { encerrarSessao, gravarSessao } from '@/shared/tenancy/sessao';
import { solicitarCodigo } from './application/solicitar-codigo';
import { confirmarCodigo } from './application/confirmar-codigo';
import { confirmarCodigoSchema, solicitarCodigoSchema } from './schemas';
import type { MotivoDeRecusa } from './domain/codigo';

/**
 * A fronteira da entrada. Valida, chama, grava o cookie e redireciona.
 * Nenhuma regra de negocio mora aqui.
 */

export type EstadoDaEntrada = {
  readonly etapa: 'email' | 'codigo';
  readonly email?: string;
  readonly motivo?: MotivoDeRecusa;
};

export async function pedirCodigoAction(
  _anterior: EstadoDaEntrada,
  formulario: FormData,
): Promise<EstadoDaEntrada> {
  const analisado = solicitarCodigoSchema.safeParse({ email: formulario.get('email') });
  if (!analisado.success) return { etapa: 'email', motivo: 'FORMATO' };

  await solicitarCodigo(analisado.data.email);

  // Mesma resposta exista ou nao a conta: a tela nao vira lista de e-mails.
  return { etapa: 'codigo', email: analisado.data.email };
}

export async function entrarAction(
  anterior: EstadoDaEntrada,
  formulario: FormData,
): Promise<EstadoDaEntrada> {
  /*
   * O e-mail vem do proprio formulario, num campo escondido.
   *
   * Depender do estado anterior nao funciona: `useActionState` congela o
   * estado inicial na montagem, entao a segunda etapa receberia sempre o
   * estado da primeira — e o e-mail chegaria vazio.
   */
  const analisado = confirmarCodigoSchema.safeParse({
    email: formulario.get('email') ?? anterior.email,
    codigo: formulario.get('codigo'),
  });
  if (!analisado.success) {
    return { etapa: 'codigo', email: anterior.email ?? '', motivo: 'FORMATO' };
  }

  const r = await confirmarCodigo(analisado.data);
  if (!r.ok) {
    return { etapa: 'codigo', email: analisado.data.email, motivo: r.erro.motivo };
  }

  await gravarSessao(r.valor);
  redirect('/hoje');
}

export async function sairAction(): Promise<void> {
  await encerrarSessao();
  redirect('/entrar');
}
