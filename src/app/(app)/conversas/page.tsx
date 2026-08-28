import { textos } from '@/shared/i18n';
import { EmptyState, Page } from '@/shared/ui';

export const metadata = { title: textos.nav.conversas };

export default function Tela() {
  return (
    <Page titulo={textos.nav.conversas}>
      <EmptyState titulo={textos.estados.vazioConversas} acao={textos.estados.vazioConversasAcao} />
    </Page>
  );
}
