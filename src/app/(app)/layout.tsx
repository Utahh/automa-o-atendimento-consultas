import { textos } from '@/shared/i18n';
import { Faixa, OverlayProvider } from '@/shared/ui';
import { BarraDeNavegacao } from './barra-de-navegacao';

/**
 * A casca da área logada.
 *
 * A ordem aqui é a ordem das camadas: faixa de aviso NO FLUXO (empurra o
 * conteúdo), conteúdo, e a barra de navegação em z 20.
 */
export default function LayoutDoApp({ children }: { children: React.ReactNode }) {
  const canalDesconectado = false;

  return (
    <OverlayProvider>
      {/* A partir de 1024 px a navegação vira barra lateral fixa: o conteúdo
          recua o mesmo tanto, senão a barra passa por cima do texto. */}
      <div className="flex min-h-dvh flex-col lg:pl-56">
        {canalDesconectado ? (
          <Faixa
            tom="atencao"
            titulo={textos.estados.canalDesconectado}
            acao={{ rotulo: textos.estados.canalDesconectadoAcao, href: '/conta' }}
          />
        ) : null}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 md:px-6 lg:pb-8">
          {children}
        </main>

        <BarraDeNavegacao />
      </div>
    </OverlayProvider>
  );
}
