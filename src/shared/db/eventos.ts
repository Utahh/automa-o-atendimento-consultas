import { schema } from './client';
import type { Tx } from './tx';

/**
 * Registrar evento faz parte da escrita, não é um passo opcional depois dela:
 * recebe o MESMO `tx`. Se a escrita voltar atrás, o evento volta junto.
 */
export const eventos = {
  async registrar(
    tx: Tx,
    entrada: {
      readonly tenantId: string;
      readonly tipo: string;
      readonly agregado: string;
      readonly agregadoId: string;
      readonly versaoAgregado: number;
      readonly dados: Record<string, unknown>;
    },
  ): Promise<void> {
    await tx.insert(schema.eventos).values({
      tenantId: entrada.tenantId,
      tipo: entrada.tipo,
      agregado: entrada.agregado,
      agregadoId: entrada.agregadoId,
      versaoAgregado: entrada.versaoAgregado,
      dados: entrada.dados,
    });
  },
};
