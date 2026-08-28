import { textos } from '@/shared/i18n';
import { EmptyState, Page } from '@/shared/ui';

export const metadata = { title: textos.nav.servicos };

export default function Tela() {
  return (
    <Page titulo={textos.nav.servicos}>
      <EmptyState titulo={textos.estados.vazioServicos} acao={textos.estados.vazioServicosAcao} />
    </Page>
  );
}
