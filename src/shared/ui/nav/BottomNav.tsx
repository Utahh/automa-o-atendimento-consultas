'use client';

import type { ReactNode } from 'react';

/**
 * Quatro destinos no maximo. O quinto item e sempre "Mais", que abre folha.
 * Camada 20; a acao principal da tela vive acima dela, nunca embaixo.
 */
export function BottomNav({
  children,
  pendente = false,
}: {
  readonly children: ReactNode;
  readonly pendente?: boolean;
}) {
  return (
    <nav
      data-pendente={pendente ? 'sim' : 'nao'}
      className="camada-navegacao border-border bg-surface fixed inset-x-0 bottom-0 flex items-stretch justify-around border-t lg:hidden"
      style={pendente ? { opacity: 0.7 } : undefined}
    >
      {children}
    </nav>
  );
}
