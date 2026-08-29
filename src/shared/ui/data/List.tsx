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
    /*
     * `flex-wrap`: a 200% de zoom (requisito, nao cortesia) o chip de horario e
     * a etiqueta de estado nao cabem na mesma linha em 320 px. Sem quebrar, o
     * corpo da pagina rola na horizontal — que e a regra 7.
     */
    <li className="border-border bg-surface flex min-h-16 min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2">
      {children}
    </li>
  );
};
