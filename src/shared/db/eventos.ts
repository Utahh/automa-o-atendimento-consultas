import { schema } from './client';
import type { Tx } from './tx';
import type { Ator } from '../tenancy/ator';

/**
 * Registrar evento faz parte da escrita, nao e um passo depois dela: recebe o
 * MESMO `tx`. Se a escrita voltar atras, o evento volta junto.
 *
 * Historico nao se cria retroativamente.
 */
export const eventos = {
  async registrar(
    tx: Tx,
    entrada: {
      readonly tenantId: string;
      readonly tipo: string;
      readonly agregado: string;
      readonly agregadoId: string;
      readonly agregadoVersao: number;
      readonly ator: Ator;
      readonly payload: Record<string, unknown>;
    },
  ): Promise<void> {
    await tx.insert(schema.evento).values({
      tenantId: entrada.tenantId,
      tipo: entrada.tipo,
      agregado: entrada.agregado,
      agregadoId: entrada.agregadoId,
      versaoAgregado: entrada.agregadoVersao,
      atorTipo: entrada.ator.tipo,
      atorId: 'id' in entrada.ator ? entrada.ator.id : null,
      dados: entrada.payload,
    });
  },
};
