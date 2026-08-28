import type { ReactNode } from 'react';

/**
 * Todo estado vazio ensina e oferece uma acao.
 * Sem tour guiado, sem tooltip, sem modal de boas-vindas.
 */
export function EmptyState({
  titulo,
  acao,
  children,
}: {
  readonly titulo: string;
  readonly acao?: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <p className="texto-bloco text-base font-medium">{titulo}</p>
      {acao !== undefined ? <p className="texto-bloco text-fg-muted text-sm">{acao}</p> : null}
      {children}
    </div>
  );
}
