import { Suspense } from 'react';
import { textos } from '@/shared/i18n';
import { Carregando, Page } from '@/shared/ui';
import { AgendaDia, consultarAgendaDoDia } from '@/modules/agenda';
import { AcoesDaAgenda } from '@/modules/agenda/ui/AcoesDaAgenda';
import { BotaoNovoAgendamento } from '@/modules/agenda/ui/SheetNovoAgendamento';

export const metadata = { title: textos.nav.agenda };
export const dynamic = 'force-dynamic';

export default function Agenda() {
  return (
    <Page titulo={textos.agenda.tituloDia} acao={<AcoesDaAgenda />}>
      <Suspense fallback={<Carregando linhas={5} />}>
        <AgendaDoDia />
      </Suspense>
    </Page>
  );
}

async function AgendaDoDia() {
  const { agendamentos, opcoes } = await consultarAgendaDoDia();

  return (
    <>
      <AgendaDia agendamentos={agendamentos} />
      <BotaoNovoAgendamento {...opcoes} />
    </>
  );
}
