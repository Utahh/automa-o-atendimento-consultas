import type { ReactNode } from 'react';

/**
 * A moldura de uma tela: titulo grudado no topo e conteudo abaixo.
 *
 * O cabecalho e camada 10 (grudado) — a unica coisa que fica presa no topo.
 */
export function Page({
  titulo,
  acao,
  children,
}: {
  readonly titulo: string;
  readonly acao?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <header className="camada-grudado bg-bg/90 sticky top-0 flex items-center gap-3 py-2 backdrop-blur">
        <h1 className="titulo-tela min-w-0 flex-1">{titulo}</h1>
        {acao}
      </header>
      {children}
    </div>
  );
}
