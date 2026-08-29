'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { withCliente } from '@/shared/db';
import { erro, ok, type Resultado } from '@/shared/erros';
import { exigirSessaoDeCliente } from '@/shared/tenancy/sessao';
import { criarAgendamento, fazerCheckin } from '@/modules/agenda';
import { entrarNaFila, promoverDaFila, sairDaFila, FAIXAS } from '@/modules/fila';

/**
 * A fronteira do app do cliente.
 *
 * Toda escrita entra por `withCliente()`: mesmo que a action erre o filtro, o
 * banco não deixa o cliente escrever na linha de outra pessoa. As quatro
 * portas de escrita continuam convergindo nos mesmos casos de uso — esta é a
 * quinta identidade, não um quinto caminho.
 */

const marcarSchema = z.object({
  servicoId: z.string().uuid(),
  recursoId: z.string().uuid(),
  inicio: z.coerce.date(),
});

export async function marcarAction(entrada: unknown): Promise<Resultado<{ readonly id: string }>> {
  const sessao = await exigirSessaoDeCliente();

  const analisado = marcarSchema.safeParse(entrada);
  if (!analisado.success) {
    return erro({
      codigo: 'DADOS_INVALIDOS',
      campos: analisado.error.issues.map((i) => i.path.join('.')),
    });
  }

  const r = await withCliente(sessao.tenantId, sessao.clienteId, (tx) =>
    criarAgendamento(
      tx,
      {
        tenantId: sessao.tenantId,
        fuso: sessao.fuso,
        agora: new Date(),
        ator: { tipo: 'cliente', id: sessao.clienteId },
        origem: 'publico',
      },
      {
        clienteId: sessao.clienteId,
        clienteNovoNome: null,
        servicoId: analisado.data.servicoId,
        recursoId: analisado.data.recursoId,
        inicio: analisado.data.inicio,
      },
    ),
  );

  if (r.ok) revalidatePath('/cliente');
  return r;
}

const filaSchema = z.object({
  servicoId: z.string().uuid(),
  recursoId: z.string().uuid().nullable().default(null),
  dia: z.coerce.date(),
  faixa: z.enum(FAIXAS).default('qualquer'),
  agendamentoAtualId: z.string().uuid().nullable().default(null),
});

export async function entrarNaFilaAction(
  entrada: unknown,
): Promise<Resultado<{ readonly id: string }>> {
  const sessao = await exigirSessaoDeCliente();

  const analisado = filaSchema.safeParse(entrada);
  if (!analisado.success) {
    return erro({
      codigo: 'DADOS_INVALIDOS',
      campos: analisado.error.issues.map((i) => i.path.join('.')),
    });
  }

  const r = await withCliente(sessao.tenantId, sessao.clienteId, (tx) =>
    entrarNaFila(
      tx,
      { tenantId: sessao.tenantId, ator: { tipo: 'cliente', id: sessao.clienteId } },
      { ...analisado.data, clienteId: sessao.clienteId },
    ),
  );

  if (r.ok) revalidatePath('/cliente');
  return r;
}

export async function sairDaFilaAction(
  filaId: string,
): Promise<Resultado<{ readonly id: string }>> {
  const sessao = await exigirSessaoDeCliente();

  const r = await withCliente(sessao.tenantId, sessao.clienteId, (tx) =>
    sairDaFila(
      tx,
      {
        tenantId: sessao.tenantId,
        ator: { tipo: 'cliente', id: sessao.clienteId },
        clienteId: sessao.clienteId,
      },
      filaId,
    ),
  );

  if (r.ok) revalidatePath('/cliente');
  return r;
}

/**
 * Cheguei.
 *
 * O check-in tira a pessoa da fila e, se este horário veio de uma oferta,
 * desfaz o antigo — e a vaga que sobra volta para quem está esperando, na
 * mesma transação.
 */
export async function checkinAction(
  agendamentoId: string,
): Promise<Resultado<{ readonly id: string }>> {
  const sessao = await exigirSessaoDeCliente();
  const agora = new Date();

  const r = await withCliente<Resultado<{ readonly id: string }>>(
    sessao.tenantId,
    sessao.clienteId,
    async (tx) => {
      const resultado = await fazerCheckin(
        tx,
        {
          tenantId: sessao.tenantId,
          ator: { tipo: 'cliente', id: sessao.clienteId },
          agora,
        },
        agendamentoId,
      );

      if (!resultado.ok) return resultado;

      const desfeito = resultado.valor.agendamentoDesfeito;
      if (desfeito !== null) {
        // O horário que acabou de vagar não fica órfão: vira oferta para quem
        // está na fila daquele dia.
        await promoverDaFila(
          tx,
          {
            tenantId: sessao.tenantId,
            fuso: sessao.fuso,
            agora,
            ator: { tipo: 'sistema' },
          },
          {
            servicoId: desfeito.servicoId,
            recursoId: desfeito.recursoId,
            inicio: desfeito.inicio,
          },
        );
      }

      return ok({ id: resultado.valor.id });
    },
  );

  if (r.ok) revalidatePath('/cliente');
  return r;
}
