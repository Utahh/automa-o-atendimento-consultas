import { textos } from '@/shared/i18n';
import { EmptyState, Page } from '@/shared/ui';

export const metadata = { title: textos.nav.clientes };

export default function Tela() {
  return (
    <Page titulo={textos.nav.clientes}>
      <EmptyState titulo={textos.estados.vazioClientes} acao={textos.estados.vazioClientesAcao} />
    </Page>
  );
}
