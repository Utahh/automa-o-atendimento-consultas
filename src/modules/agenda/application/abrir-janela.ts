import { eventos, schema, type Tx } from '@/shared/db';
import { erro, ok, type Resultado } from '@/shared/erros';
import type { Ator } from '@/shared/tenancy/ator';

/**
 * Janela **soma** à jornada; bloqueio **subtrai**.
 *
 * É o intervalo extra que o profissional abre num dia específico — para
 * atender fora do expediente ou preencher um buraco. Abrir uma janela em cima
 * de um bloqueio não é erro: o bloqueio ganha, porque a disponibilidade
 * subtrai depois de somar.
 */
export async function abrirJanela(
  tx: Tx,
  ctx: { readonly tenantId: string; readonly ator: Ator },
  input: {
    readonly recursoId: string | null;
    readonly inicio: Date;
    readonly fim: Date;
    readonly motivo?: string;
  },
): Promise<Resultado<{ readonly id: string }>> {
  if (input.fim.getTime() <= input.inicio.getTime()) {
    return erro({ codigo: 'DADOS_INVALIDOS', campos: ['fim'] });
  }

  const [linha] = await tx
    .insert(schema.janelaAtendimento)
    .values({
      tenantId: ctx.tenantId,
      recursoId: input.recursoId,
      inicio: input.inicio,
      fim: input.fim,
      motivo: input.motivo ?? null,
    })
    .returning({ id: schema.janelaAtendimento.id });

  if (linha === undefined) throw new Error('Insert de janela nao devolveu linha.');

  await eventos.registrar(tx, {
    tenantId: ctx.tenantId,
    tipo: 'janela.aberta',
    agregado: 'janela',
    agregadoId: linha.id,
    agregadoVersao: 1,
    ator: ctx.ator,
    payload: {
      inicio: input.inicio.toISOString(),
      fim: input.fim.toISOString(),
      recursoId: input.recursoId,
    },
  });

  return ok({ id: linha.id });
}
