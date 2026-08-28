import { textos } from '@/shared/i18n';
import { EmptyState, List, StatusBadge } from '@/shared/ui';
import { SlotChip } from './SlotChip';
import type { AgendamentoDaTela } from '../schemas';

/**
 * Server Component: nenhum JavaScript deste arquivo chega ao celular.
 * A interacao (menu, folha, confirmacao) mora nas folhas da arvore.
 */
export function AgendaDia({
  agendamentos,
  idDoAgora,
}: {
  readonly agendamentos: readonly AgendamentoDaTela[];
  readonly idDoAgora?: string;
}) {
  if (agendamentos.length === 0) {
    return <EmptyState titulo={textos.estados.vazioAgenda} acao={textos.estados.vazioAgendaAcao} />;
  }

  return (
    <List rotulo={textos.agenda.tituloDia}>
      {agendamentos.map((a) => (
        <List.Item key={a.id}>
          <SlotChip horaFormatada={a.horaFormatada} status={a.status} agora={a.id === idDoAgora} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="texto-linha text-base font-medium">{a.clienteNome}</span>
            <span className="texto-linha text-fg-muted text-sm">{a.servicoNome}</span>
          </div>
          <StatusBadge estado={a.status} />
        </List.Item>
      ))}
    </List>
  );
}
