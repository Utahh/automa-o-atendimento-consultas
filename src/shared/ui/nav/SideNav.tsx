'use client';

import type { ReactNode } from 'react';

/** A partir de 1024 px a navegacao vira barra lateral fixa. */
export function SideNav({
  children,
  marca,
}: {
  readonly children: ReactNode;
  readonly marca: ReactNode;
}) {
  return (
    <nav className="camada-navegacao border-border bg-surface fixed inset-y-0 left-0 hidden w-56 flex-col gap-1 border-r p-3 lg:flex">
      <div className="mb-4 px-2 pt-2">{marca}</div>
      {children}
    </nav>
  );
}
