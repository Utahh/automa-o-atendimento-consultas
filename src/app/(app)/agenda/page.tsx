import { textos } from '@/shared/i18n';
import { Page } from '@/shared/ui';
import { AcoesDaAgenda, AgendaDia, BotaoNovoAgendamento } from '@/modules/agenda';

export const metadata = { title: textos.nav.agenda };

export default function Agenda() {
  return (
    <Page titulo={textos.agenda.tituloDia} acao={<AcoesDaAgenda />}>
      <AgendaDia agendamentos={[]} />
      <BotaoNovoAgendamento />
    </Page>
  );
}
