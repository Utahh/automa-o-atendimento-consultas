'use server';

import { revalidatePath } from 'next/cache';
import { withTenant } from '@/shared/db';
import { erro, ok, type Resultado } from '@/shared/erros';
import { exigirSessaoDoEstudio } from '@/shared/tenancy/sessao';
import { promoverDaFila } from '@/modules/fila';
import { criarAgendamento } from './application/criar-agendamento';
import { cancelarAgendamento } from './application/cancelar-agendamento';
import { abrirJanela } from './application/abrir-janela';
import { criarAgendamentoSchema } from './schemas';

/**
 * A FRONTEIRA. Autentica, autoriza, valida, chama, traduz. ZERO regra de
 * negocio.
 *
 * O front nunca fala com o banco: fala com este arquivo. E recebe de volta um
 * CODIGO de erro — o texto nasce em shared/i18n.
 */

export async function criarAgendamentoAction(
  entrada: unknown,
): Promise<Resultado<{ readonly id: string }>> {
  const sessao = await exigirSessaoDoEstudio();

  const analisado = criarAgendamentoSchema.safeParse(entrada);
  if (!analisado.success) {
    return erro({
      codigo: 'DADOS_INVALIDOS',
      campos: analisado.error.issues.map((i) => i.path.join('.')),
    });
  }

  const resultado = await withTenant(sessao.tenantId, (tx) =>
    criarAgendamento(
      tx,
      {
        tenantId: sessao.tenantId,
        fuso: sessao.fuso,
        agora: new Date(),
        ator: { tipo: 'humano', id: sessao.usuarioId },
        origem: 'interface',
      },
      analisado.data,
    ),
  );

  if (!resultado.ok) return resultado;

  revalidatePath('/agenda');
  revalidatePath('/hoje');
  return resultado;
}

/**
 * Cancelar abre uma vaga — e vaga aberta e assunto da fila, na mesma
 * transacao. Se ninguem serve, ela simplesmente volta a aparecer para quem
 * marca normalmente.
 */
export async function cancelarAction(
  agendamentoId: string,
  motivo?: string,
): Promise<Resultado<{ readonly id: string }>> {
  const sessao = await exigirSessaoDoEstudio();
  const agora = new Date();

  const r = await withTenant<Resultado<{ readonly id: string }>>(sessao.tenantId, async (tx) => {
    const cancelado = await cancelarAgendamento(
      tx,
      { tenantId: sessao.tenantId, ator: { tipo: 'humano', id: sessao.usuarioId } },
      motivo === undefined ? { agendamentoId } : { agendamentoId, motivo },
    );

    if (!cancelado.ok) return cancelado;

    await promoverDaFila(
      tx,
      {
        tenantId: sessao.tenantId,
        fuso: sessao.fuso,
        agora,
        ator: { tipo: 'humano', id: sessao.usuarioId },
      },
      cancelado.valor.vaga,
    );

    return ok({ id: cancelado.valor.id });
  });

  if (r.ok) {
    revalidatePath('/agenda');
    revalidatePath('/hoje');
  }
  return r;
}

/**
 * Abrir janela e somar um intervalo a um dia especifico — e acionar a fila
 * daquele dia na sequencia. E o oposto do bloqueio, que subtrai.
 */
export async function abrirJanelaAction(entrada: {
  readonly recursoId: string | null;
  readonly inicio: string;
  readonly fim: string;
  readonly servicoId?: string;
}): Promise<Resultado<{ readonly id: string }>> {
  const sessao = await exigirSessaoDoEstudio();
  const agora = new Date();
  const inicio = new Date(entrada.inicio);
  const fim = new Date(entrada.fim);

  const r = await withTenant<Resultado<{ readonly id: string }>>(sessao.tenantId, async (tx) => {
    const janela = await abrirJanela(
      tx,
      { tenantId: sessao.tenantId, ator: { tipo: 'humano', id: sessao.usuarioId } },
      { recursoId: entrada.recursoId, inicio, fim },
    );

    if (!janela.ok) return janela;

    if (entrada.servicoId !== undefined) {
      await promoverDaFila(
        tx,
        {
          tenantId: sessao.tenantId,
          fuso: sessao.fuso,
          agora,
          ator: { tipo: 'humano', id: sessao.usuarioId },
        },
        { servicoId: entrada.servicoId, recursoId: entrada.recursoId, inicio },
      );
    }

    return ok({ id: janela.valor.id });
  });

  if (r.ok) {
    revalidatePath('/agenda');
    revalidatePath('/hoje');
  }
  return r;
}
