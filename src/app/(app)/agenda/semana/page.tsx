import { textos } from '@/shared/i18n';
import { EmptyState, Page } from '@/shared/ui';

export const metadata = { title: textos.agenda.tituloSemana };

export default function Semana() {
  return (
    <Page titulo={textos.agenda.tituloSemana}>
      <EmptyState titulo={textos.estados.vazioAgenda} acao={textos.estados.vazioAgendaAcao} />
    </Page>
  );
}
