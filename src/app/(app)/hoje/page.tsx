import { Suspense } from 'react';
import { textos } from '@/shared/i18n';
import { Carregando } from '@/shared/ui';
import { AgendaDoDia } from '@/modules/agenda';
import type { AgendamentoDaTela } from '@/modules/agenda';

export const metadata = { title: textos.nav.hoje };

/**
 * Streaming por regiao da tela: o cabecalho aparece imediatamente e a lista
 * chega depois. Nunca uma roda girando no meio de nada.
 */
export default function Hoje() {
  return (
    <div className="flex flex-col gap-4">
      <header className="camada-grudado bg-fundo/90 sticky top-0 py-2 backdrop-blur">
        <h1 className="text-[22px] font-semibold tracking-tight">{textos.nav.hoje}</h1>
      </header>

      <Suspense fallback={<Carregando linhas={4} />}>
        <ListaDeHoje />
      </Suspense>
    </div>
  );
}

async function ListaDeHoje() {
  const agendamentos = await carregarAgendaDeHoje();
  return <AgendaDoDia agendamentos={agendamentos} />;
}

/**
 * Resposta falsa da Sprint 1: o front constroi contra isso desde a primeira
 * hora. Quando o caso de uso real entrar no lugar, nada aqui muda.
 */
function carregarAgendaDeHoje(): Promise<readonly AgendamentoDaTela[]> {
  return Promise.resolve([]);
}
