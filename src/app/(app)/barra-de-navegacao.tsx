'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { textos } from '@/shared/i18n';
import { MenuAdaptativo, cn, type ItemDeMenu } from '@/shared/ui';

/**
 * < 1024 px → barra inferior, 4 itens + "Mais"
 * ≥ 1024 px → barra lateral fixa
 *
 * A troca de rota passa por useTransition: o toque responde na hora e a
 * navegação não bloqueia o que o usuário estiver digitando.
 */

const PRINCIPAIS = [
  { href: '/hoje', rotulo: textos.nav.hoje },
  { href: '/agenda', rotulo: textos.nav.agenda },
  { href: '/clientes', rotulo: textos.nav.clientes },
  { href: '/conversas', rotulo: textos.nav.conversas },
] as const;

const SECUNDARIAS = [
  { href: '/financeiro', rotulo: textos.nav.financeiro },
  { href: '/automacoes', rotulo: textos.nav.automacoes },
  { href: '/conta', rotulo: textos.nav.conta },
] as const;

export function BarraDeNavegacao() {
  const caminho = usePathname();
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  const itensDoMais: ItemDeMenu[] = SECUNDARIAS.map((s) => ({
    id: s.href,
    rotulo: s.rotulo,
    aoEscolher: () => iniciar(() => router.push(s.href)),
  }));

  return (
    <nav
      aria-label={textos.app.nome}
      data-pendente={pendente ? 'sim' : 'nao'}
      className={cn(
        'camada-navegacao',
        // Celular e tablet: barra inferior, presa embaixo.
        'border-linha bg-cartao fixed inset-x-0 bottom-0 flex items-stretch justify-around border-t',
        // Desktop: vira barra lateral fixa.
        'lg:inset-y-0 lg:right-auto lg:left-0 lg:w-56 lg:flex-col lg:justify-start lg:gap-1 lg:border-t-0 lg:border-r lg:p-3',
        pendente && 'opacity-70',
      )}
    >
      {PRINCIPAIS.map((item) => {
        const ativo = caminho.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? 'page' : undefined}
            onClick={() => iniciar(() => router.push(item.href))}
            className={cn(
              'alvo-toque flex flex-1 flex-col items-center justify-center px-2 text-[12px] lg:flex-none lg:flex-row lg:justify-start lg:rounded-lg lg:px-3 lg:text-[15px]',
              ativo ? 'text-acento' : 'text-tinta-2',
            )}
          >
            <span className="texto-linha">{item.rotulo}</span>
          </Link>
        );
      })}

      <div className="flex items-center justify-center px-2 lg:mt-1 lg:block lg:px-0">
        <MenuAdaptativo rotuloGatilho={textos.nav.mais} itens={itensDoMais} />
      </div>
    </nav>
  );
}
