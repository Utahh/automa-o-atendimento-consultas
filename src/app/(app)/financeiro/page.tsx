import { textos } from '@/shared/i18n';
import { EmptyState, Page } from '@/shared/ui';

export const metadata = { title: textos.nav.financeiro };

export default function Tela() {
  return (
    <Page titulo={textos.nav.financeiro}>
      <EmptyState
        titulo={textos.estados.vazioFinanceiro}
        acao={textos.estados.vazioFinanceiroAcao}
      />
    </Page>
  );
}
