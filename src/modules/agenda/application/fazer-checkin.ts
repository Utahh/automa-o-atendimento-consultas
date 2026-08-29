import { eventos, type Tx } from '@/shared/db';
import { erro, ok, type Resultado } from '@/shared/erros';
import type { Ator } from '@/shared/tenancy/ator';
import { filaRepo } from '@/modules/fila';
import { podeFazerCheckin } from '../domain/checkin';
import { agendamentoRepo } from '../infra/agendamento.repo';

/**
 * Chegar é o momento em que o desejo morre.
 *
 * Três coisas acontecem, nesta ordem — e a ordem é a regra:
 *
 *   1. o agendamento vira `chegou`;
 *   2. o cliente **sai da fila** do mesmo serviço e profissional: ele já escolheu;
 *   3. se este horário veio de uma oferta da fila, o horário **antigo é
 *      desfeito** agora — e só agora.
 *
 * O passo 3 nunca acontece antes do check-in. Desfazer o horário antigo no
 * momento em que a oferta é aceita deixaria a pessoa sem nada caso ela não
 * conseguisse ir ao novo. Aqui ela já chegou, então o antigo perdeu a função.
 *
 * A vaga liberada volta para a fila pelo chamador, que é quem conhece o fuso.
 */
export type ResultadoDoCheckin = {
  readonly id: string;
  readonly saiuDaFila: number;
  /**
   * O horário desfeito, quando este veio da fila. Vira vaga para outra pessoa —
   * e por isso vem com serviço e profissional junto: sem eles, a fila não teria
   * como saber a quem oferecer.
   */
  readonly agendamentoDesfeito: {
    readonly id: string;
    readonly inicio: Date;
    readonly servicoId: string;
    readonly recursoId: string | null;
  } | null;
};

export async function fazerCheckin(
  tx: Tx,
  ctx: { readonly tenantId: string; readonly ator: Ator; readonly agora: Date },
  agendamentoId: string,
): Promise<Resultado<ResultadoDoCheckin>> {
  const ag = await agendamentoRepo.porId(tx, agendamentoId);
  if (ag === null) return erro({ codigo: 'AGENDAMENTO_NAO_ENCONTRADO' });

  const veredito = podeFazerCheckin({
    inicio: ag.inicio,
    fim: ag.fim,
    status: ag.status,
    checkinEm: ag.checkinEm,
    agora: ctx.agora,
  });

  if (!veredito.pode) {
    return erro(
      veredito.motivo === 'STATUS_NAO_PERMITE' || veredito.motivo === 'JA_CHEGOU'
        ? { codigo: 'TRANSICAO_INVALIDA', de: ag.status, para: 'chegou' }
        : { codigo: 'FORA_DO_EXPEDIENTE' },
    );
  }

  // 1. chegou
  const atualizado = await agendamentoRepo.registrarCheckin(tx, ag.id, ag.versao, ctx.agora);
  if (atualizado === null) return erro({ codigo: 'CONFLITO_DE_VERSAO' });

  // 2. sai da fila do mesmo serviço e profissional
  const saiuDaFila = await filaRepo.sairPorEscolha(tx, {
    clienteId: ag.clienteId,
    servicoId: ag.servicoId,
    recursoId: ag.recursoId,
  });

  // 3. o horário antigo cai — agora que a pessoa chegou ao novo
  let desfeito: ResultadoDoCheckin['agendamentoDesfeito'] = null;

  if (ag.filaOrigemId !== null) {
    const espera = await filaRepo.porId(tx, ag.filaOrigemId);
    const antigoId = espera?.agendamentoAtualId ?? null;

    if (antigoId !== null && antigoId !== ag.id) {
      const antigo = await agendamentoRepo.porId(tx, antigoId);
      if (antigo !== null && (antigo.status === 'pendente' || antigo.status === 'confirmado')) {
        await agendamentoRepo.atualizarStatus(tx, antigo.id, antigo.versao, 'cancelado');
        desfeito = {
          id: antigo.id,
          inicio: antigo.inicio,
          servicoId: antigo.servicoId,
          recursoId: antigo.recursoId,
        };

        await eventos.registrar(tx, {
          tenantId: ctx.tenantId,
          tipo: 'agendamento.cancelado',
          agregado: 'agendamento',
          agregadoId: antigo.id,
          agregadoVersao: antigo.versao + 1,
          ator: ctx.ator,
          payload: { motivo: 'trocado pela fila', substituidoPor: ag.id },
        });
      }
    }
  }

  await eventos.registrar(tx, {
    tenantId: ctx.tenantId,
    tipo: 'agendamento.chegou',
    agregado: 'agendamento',
    agregadoId: ag.id,
    agregadoVersao: atualizado.versao,
    ator: ctx.ator,
    payload: {
      em: ctx.agora.toISOString(),
      saiuDaFila,
      desfez: desfeito === null ? null : desfeito.id,
    },
  });

  return ok({ id: ag.id, saiuDaFila, agendamentoDesfeito: desfeito });
}
