import { redirect } from 'next/navigation';
import { OverlayProvider, ToastProvider } from '@/shared/ui';
import { Logo } from '@/shared/ui/primitives/Logo';
import { sessaoAtual } from '@/shared/tenancy/sessao';

/**
 * A casca do app do cliente.
 *
 * Enxuta de proposito: quem esta aqui quer ver um horario, nao navegar. Nao ha
 * barra inferior — nao existem quatro destinos para ir.
 */
export default async function LayoutDoCliente({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoAtual();
  if (sessao === null) redirect('/entrar');
  // Quem e do estudio tem outra casa, com muito mais coisa dentro.
  if (sessao.papel !== 'cliente') redirect('/hoje');

  return (
    <OverlayProvider>
      <ToastProvider>
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-6">
          <header className="text-brand">
            <Logo altura={24} />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </ToastProvider>
    </OverlayProvider>
  );
}
