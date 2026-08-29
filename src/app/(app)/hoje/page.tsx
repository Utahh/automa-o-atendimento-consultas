import { Suspense } from 'react';
import { textos } from '@/shared/i18n';
import { Carregando, Page } from '@/shared/ui';
import { AgendaDia } from '@/modules/agenda';
// Os dois componentes de cliente vem do arquivo, nao do barril do modulo:
// atravessar um barril que mistura Server e Client Components faz o prerender
// perder a referencia no React Client Manifest ("Could not find the module ...").
// So aparece no build de producao em Linux — foi o job de imagem do CI que pegou.
import { AcoesDaAgenda } from '@/modules/agenda/ui/AcoesDaAgenda';
import type { AgendamentoDaTela } from '@/modules/agenda';

export const metadata = { title: textos.nav.hoje };

/**
 * Streaming por regiao da tela: o cabecalho aparece imediatamente e a lista
 * chega depois. Nunca uma roda girando no meio de nada.
 *
 * "Hoje" nao e um painel; e o proximo atendimento.
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
  const agendamentos = await carregarAgendaDeHoje();
  return <AgendaDia agendamentos={agendamentos} />;
}

/**
 * Resposta falsa da Sprint 1: o front constroi contra isso desde a primeira
 * hora. Quando o caso de uso real entrar no lugar, nada aqui muda.
 */
function carregarAgendaDeHoje(): Promise<readonly AgendamentoDaTela[]> {
  return Promise.resolve([]);
}
