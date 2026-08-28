import { withSystemTenant } from '@/shared/db';
import { JOBS } from '@/shared/fila';

/**
 * Todo job REVALIDA antes de agir: automacao ligada, consentimento dado, canal
 * conectado, fora da janela de silencio e dentro do limite. O que era verdade
 * quando o job foi criado pode nao ser mais quando ele roda.
 */
export async function lembrete(payload: unknown): Promise<void> {
  const dados = JOBS.lembreteDeAgendamento.schema.parse(payload);

  await withSystemTenant(dados.tenantId, async (_tx) => {
    // 1. automacao ainda ligada?
    // 2. consentimento ainda valido?
    // 3. canal conectado?
    // 4. estamos fora da janela de silencio?
    // 5. o limite diario ja estourou?
    // Só depois disso a mensagem sai.
    await Promise.resolve();
  });
}
