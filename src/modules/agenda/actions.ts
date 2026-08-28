'use server';

import { revalidatePath } from 'next/cache';
import { withTenant } from '@/shared/db';
import { erro, ok, type Resultado } from '@/shared/erros';
import { exigirSessao } from '@/shared/tenancy/sessao';
import { criarAgendamento } from './application/criar-agendamento';
import { criarAgendamentoSchema, type CodigoDeErroDaAgenda } from './schemas';

/**
 * A FRONTEIRA. Autentica, autoriza, valida, chama, traduz. Zero regra de negócio.
 *
 * O front nunca fala com o banco; fala com este arquivo. E recebe de volta um
 * CÓDIGO de erro — o texto nasce em shared/i18n.
 */

export async function criarAgendamentoAction(
  entrada: unknown,
): Promise<Resultado<{ id: string }, CodigoDeErroDaAgenda>> {
  const sessao = await exigirSessao();

  const analisado = criarAgendamentoSchema.safeParse(entrada);
  if (!analisado.success) {
    return erro('DADOS_INVALIDOS', {
      campos: analisado.error.issues.map((i) => i.path.join('.')),
    });
  }

  const resultado = await withTenant(sessao.tenantId, (tx) =>
    criarAgendamento(
      tx,
      { tenantId: sessao.tenantId, fuso: sessao.fuso, agora: new Date() },
      analisado.data,
    ),
  );

  if (!resultado.ok) return resultado;

  revalidatePath('/agenda');
  revalidatePath('/hoje');
  return ok(resultado.valor);
}
