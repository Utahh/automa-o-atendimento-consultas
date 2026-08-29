import 'server-only';
import { withTenant } from '@/shared/db';
import { exigirSessaoDoEstudio } from '@/shared/tenancy/sessao';
import { formatarDia, formatarHora } from '@/modules/agenda';
import { filaRepo } from './infra/fila.repo';
import { faixaDoHorario } from './domain/fila';

/**
 * A fila pelo lado de quem atende.
 *
 * Mostra demanda reprimida: seis pessoas esperando sabado de manha, num dia em
 * que ela nao atende, e a informacao que faz ela abrir o sabado — e essa e a
 * razao de a fila existir para o profissional, nao so para o cliente.
 */
export type EsperaNaTela = {
  readonly id: string;
  readonly dia: string;
  readonly faixa: string;
  readonly desde: string;
  readonly ofertaAte: string | null;
};

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export async function filaDoEstudio(dias = 14): Promise<readonly EsperaNaTela[]> {
  const sessao = await exigirSessaoDoEstudio();

  return withTenant(sessao.tenantId, async (tx) => {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(inicio.getTime() + dias * UM_DIA_MS);

    const linhas = await filaRepo.esperandoComOferta(tx, inicio, fim);

    return linhas.map((l) => ({
      id: l.id,
      dia: formatarDia(l.dia, sessao.fuso),
      faixa: l.faixa === 'qualquer' ? faixaDoHorario(l.dia, sessao.fuso) : l.faixa,
      desde: formatarDia(l.criadoEm, sessao.fuso),
      ofertaAte: l.ofertaExpiraEm === null ? null : formatarHora(l.ofertaExpiraEm, sessao.fuso),
    }));
  });
}
