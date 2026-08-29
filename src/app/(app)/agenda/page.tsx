import { Suspense } from 'react';
import { textos } from '@/shared/i18n';
import { Carregando, Page } from '@/shared/ui';
import { AgendaDia, consultarAgendaDoDia } from '@/modules/agenda';
import { filaDoEstudio, PainelDaFila } from '@/modules/fila';
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
  const esperas = await filaDoEstudio();

  /*
   * A ordem e a ordem da urgencia: quem ja esta marcado, depois quem espera.
   * Ver a fila na mesma tela e o que faz o profissional descobrir qual horario
   * falta na agenda dele antes de perder o cliente.
   */
  return (
    <>
      <AgendaDia agendamentos={agendamentos} />
      <BotaoNovoAgendamento {...opcoes} />
      <PainelDaFila esperas={esperas} />
    </>
  );
}
