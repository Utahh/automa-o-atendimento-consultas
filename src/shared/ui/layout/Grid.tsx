import type { ReactNode } from 'react';

/**
 * A tela se adapta ao conteudo, nao o conteudo a tela.
 *
 * O numero de colunas e consequencia de `minmax`, nao configuracao — o mesmo
 * componente serve a lista de uma coluna e a terceira coluna estreita.
 */
export function Grid({
  children,
  minimo = '16rem',
}: {
  readonly children: ReactNode;
  readonly minimo?: string;
}) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(' + minimo + ', 100%), 1fr))' }}
    >
      {children}
    </div>
  );
}
