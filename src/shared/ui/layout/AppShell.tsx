'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition, type ReactNode } from 'react';
import { OverlayProvider } from '../hooks/use-overlay';
import { ToastProvider } from '../overlay/Toast';
import { BottomNav } from '../nav/BottomNav';
import { SideNav } from '../nav/SideNav';
import { NavItem } from '../nav/NavItem';
import { MenuSuspenso, type ItemDeMenu } from '../nav/MenuSuspenso';
import { OfflineBanner } from '../feedback/OfflineBanner';
import { Logo } from '../primitives/Logo';
import { textos } from '../../i18n';

/**
 * A casca.
 *
 * Ordem das camadas, de baixo para cima: faixa de aviso NO FLUXO (empurra o
 * conteúdo), conteúdo, navegação em z 20. Overlays saem por portal para
 * `<div id="overlays">`, que vive no layout raiz.
 *
 * A troca de rota passa por useTransition: o toque responde na hora e a
 * navegação não bloqueia o que a pessoa estiver digitando.
 */

const PRINCIPAIS = [
  { href: '/hoje', rotulo: textos.nav.hoje },
  { href: '/agenda', rotulo: textos.nav.agenda },
  { href: '/clientes', rotulo: textos.nav.clientes },
  { href: '/conversas', rotulo: textos.nav.conversas },
] as const;

const SECUNDARIAS = [
  { href: '/servicos', rotulo: textos.nav.servicos },
  { href: '/financeiro', rotulo: textos.nav.financeiro },
  { href: '/automacoes', rotulo: textos.nav.automacoes },
  { href: '/conta', rotulo: textos.nav.conta },
] as const;

export function AppShell({
  children,
  faixas,
}: {
  readonly children: ReactNode;
  readonly faixas?: ReactNode;
}) {
  const caminho = usePathname();
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  const navegar = (href: string) => () => iniciar(() => router.push(href));

  const itensDoMais: ItemDeMenu[] = SECUNDARIAS.map((s) => ({
    id: s.href,
    rotulo: s.rotulo,
    onSelect: () => iniciar(() => router.push(s.href)),
  }));

  return (
    <OverlayProvider>
      <ToastProvider>
        {/* A partir de 1024 px a barra lateral ocupa 14rem: o conteúdo recua o
            mesmo tanto, senão a barra passa por cima do texto. */}
        <div className="flex min-h-dvh flex-col lg:pl-56">
          <OfflineBanner />
          {faixas}

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 md:px-6 lg:pb-8">
            {children}
          </main>

          <SideNav marca={<Logo altura={28} />}>
            {[...PRINCIPAIS, ...SECUNDARIAS].map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                rotulo={item.rotulo}
                ativo={caminho.startsWith(item.href)}
                orientacao="lateral"
                aoNavegar={navegar(item.href)}
              />
            ))}
          </SideNav>

          <BottomNav pendente={pendente}>
            {PRINCIPAIS.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                rotulo={item.rotulo}
                ativo={caminho.startsWith(item.href)}
                orientacao="inferior"
                aoNavegar={navegar(item.href)}
              />
            ))}
            <div className="flex flex-1 items-center justify-center px-2">
              <MenuSuspenso
                titulo={textos.nav.mais}
                itens={itensDoMais}
                gatilho={
                  <button type="button" className="alvo-toque text-fg-muted w-full text-xs">
                    {textos.nav.mais}
                  </button>
                }
              />
            </div>
          </BottomNav>
        </div>
      </ToastProvider>
    </OverlayProvider>
  );
}
