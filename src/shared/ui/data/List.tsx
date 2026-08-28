import type { ReactNode } from 'react';

/**
 * Lista com separacao por gap — nunca por margem negativa.
 * Acima de 50 linhas, use VirtualList (entra quando a agenda pedir).
 */
export function List({
  children,
  rotulo,
}: {
  readonly children: ReactNode;
  readonly rotulo: string;
}) {
  return (
    <ul aria-label={rotulo} className="flex min-w-0 flex-col gap-2">
      {children}
    </ul>
  );
}

List.Item = function ListItem({ children }: { readonly children: ReactNode }) {
  return (
    <li className="border-border bg-surface flex min-h-16 min-w-0 items-center gap-3 rounded-xl border px-3 py-2">
      {children}
    </li>
  );
};
