import { textos } from '@/shared/i18n';
import { Vazio } from '@/shared/ui';
import { ChipDeHorario } from './chip-de-horario';
import type { AgendamentoDaTela } from '../schemas';

/**
 * Server Component: nenhum JavaScript deste arquivo chega ao celular.
 * A interação (menu, folha, confirmação) mora nas folhas da árvore.
 */
export function AgendaDoDia({
  agendamentos,
  idDoAgora,
}: {
  readonly agendamentos: readonly AgendamentoDaTela[];
  readonly idDoAgora?: string;
}) {
  if (agendamentos.length === 0) {
    return <Vazio titulo={textos.estados.vazioAgenda} acao={textos.estados.vazioAgendaAcao} />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {agendamentos.map((a) => (
        <li
          key={a.id}
          className="border-linha bg-cartao flex min-h-16 items-center gap-3 rounded-xl border px-3 py-2"
        >
          <ChipDeHorario
            horaFormatada={a.horaFormatada}
            status={a.status}
            agora={a.id === idDoAgora}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="texto-linha text-[15px] font-medium">{a.clienteNome}</span>
            <span className="texto-linha text-tinta-2 text-[13px]">{a.servicoNome}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
