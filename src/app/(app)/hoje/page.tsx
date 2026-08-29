import { Suspense } from 'react';
import { textos } from '@/shared/i18n';
import { Carregando, Page } from '@/shared/ui';
import { AgendaDia, consultarAgendaDoDia } from '@/modules/agenda';
// Os componentes de cliente vem do arquivo, nao do barril do modulo: barril
// misto (Server + Client) faz o prerender perder a referencia no manifest.
import { AcoesDaAgenda } from '@/modules/agenda/ui/AcoesDaAgenda';
import { BotaoNovoAgendamento } from '@/modules/agenda/ui/SheetNovoAgendamento';

export const metadata = { title: textos.nav.hoje };
export const dynamic = 'force-dynamic';

/**
 * "Hoje" nao e um painel; e o proximo atendimento.
 *
 * Streaming por regiao: o cabecalho aparece na hora e a lista chega depois.
 * Nunca uma roda girando no meio de nada.
 */
export default function Hoje() {
  return (
    <Page titulo={textos.nav.hoje} acao={<AcoesDaAgenda />}>
      <Suspense fallback={<Carregando linhas={4} />}>
        <ListaDeHoje />
      </Suspense>
    </Page>
  );
}

async function ListaDeHoje() {
  const { agendamentos, idDoAgora, opcoes } = await consultarAgendaDoDia();

  return (
    <>
      <AgendaDia agendamentos={agendamentos} {...(idDoAgora !== undefined ? { idDoAgora } : {})} />
      <BotaoNovoAgendamento {...opcoes} />
    </>
  );
}
