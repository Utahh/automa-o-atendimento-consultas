import { eventos, type Tx } from '@/shared/db';
import type { Ator } from '@/shared/tenancy/ator';
import { calcularExpiracaoDaOferta, proximoDaFila, type VagaAberta } from '../domain/fila';
import { filaRepo } from '../infra/fila.repo';

/**
 * Uma vaga abriu. Quem fica com ela?
 *
 * A oferta vai para UM por vez, por antiguidade, e vale por tempo limitado.
 * Ofertar para todos criaria corrida — e frustraria todo mundo menos um.
 *
 * Se ninguem serve, a funcao nao faz nada: a vaga volta a aparecer para quem
 * marca normalmente, que e o comportamento certo.
 */
export async function promoverDaFila(
  tx: Tx,
  ctx: {
    readonly tenantId: string;
    readonly fuso: string;
    readonly agora: Date;
    readonly ator: Ator;
  },
  vaga: VagaAberta,
): Promise<{ readonly ofertadoPara: string | null }> {
  const inicioDoDia = new Date(vaga.inicio);
  inicioDoDia.setHours(0, 0, 0, 0);
  const fimDoDia = new Date(inicioDoDia.getTime() + 24 * 60 * 60 * 1000);

  const esperando = await filaRepo.esperando(tx, inicioDoDia, fimDoDia);
  const escolhido = proximoDaFila(esperando, vaga, ctx.fuso);
  if (escolhido === null) return { ofertadoPara: null };

  const expiraEm = calcularExpiracaoDaOferta(ctx.agora);
  await filaRepo.registrarOferta(tx, escolhido.id, {
    inicio: vaga.inicio,
    expiraEm,
    em: ctx.agora,
  });

  await eventos.registrar(tx, {
    tenantId: ctx.tenantId,
    tipo: 'fila.ofertada',
    agregado: 'fila',
    agregadoId: escolhido.id,
    agregadoVersao: 2,
    ator: ctx.ator,
    payload: {
      inicio: vaga.inicio.toISOString(),
      expiraEm: expiraEm.toISOString(),
      clienteId: escolhido.clienteId,
    },
  });

  return { ofertadoPara: escolhido.clienteId };
}
