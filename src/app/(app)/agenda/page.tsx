import { textos } from '@/shared/i18n';
import { Page } from '@/shared/ui';
import { AgendaDia } from '@/modules/agenda';
// Os dois componentes de cliente vem do arquivo, nao do barril do modulo:
// atravessar um barril que mistura Server e Client Components faz o prerender
// perder a referencia no React Client Manifest ("Could not find the module ...").
// So aparece no build de producao em Linux — foi o job de imagem do CI que pegou.
import { AcoesDaAgenda } from '@/modules/agenda/ui/AcoesDaAgenda';
import { BotaoNovoAgendamento } from '@/modules/agenda/ui/SheetNovoAgendamento';

export const metadata = { title: textos.nav.agenda };

export default function Agenda() {
  return (
    <Page titulo={textos.agenda.tituloDia} acao={<AcoesDaAgenda />}>
      <AgendaDia agendamentos={[]} />
      <BotaoNovoAgendamento />
    </Page>
  );
}
