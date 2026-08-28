import { textos } from '@/shared/i18n';
import { EmptyState, Page } from '@/shared/ui';

export const metadata = { title: textos.nav.automacoes };

export default function Tela() {
  return (
    <Page titulo={textos.nav.automacoes}>
      <EmptyState
        titulo={textos.estados.vazioFinanceiro}
        acao={textos.estados.vazioFinanceiroAcao}
      />
    </Page>
  );
}
