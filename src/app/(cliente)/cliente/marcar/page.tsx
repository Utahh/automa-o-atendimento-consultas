import { textos } from '@/shared/i18n';
import { catalogo, diasComVaga, profissionaisNoDia } from '@/modules/cliente';
import { FluxoDeMarcacao } from '@/modules/cliente/ui/FluxoDeMarcacao';

export const metadata = { title: textos.cliente.marcar };
export const dynamic = 'force-dynamic';

/**
 * As consultas viajam como Server Actions.
 *
 * O cliente escolhe servico, dia e profissional em sequencia, e cada passo
 * depende do anterior: buscar tudo de uma vez seria calcular disponibilidade
 * de catorze dias vezes cada profissional para jogar fora quase inteiro.
 */
export default async function Marcar() {
  const servicos = await catalogo();

  async function buscarDias(servicoId: string) {
    'use server';
    return diasComVaga(servicoId);
  }

  async function buscarProfissionais(servicoId: string, diaISO: string) {
    'use server';
    return profissionaisNoDia(servicoId, diaISO);
  }

  return (
    <FluxoDeMarcacao
      servicos={servicos}
      buscarDias={buscarDias}
      buscarProfissionais={buscarProfissionais}
    />
  );
}
