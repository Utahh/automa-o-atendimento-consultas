import type { ReactNode } from 'react';

/**
 * Rotulo de uma palavra, erro embaixo, e o erro SEMPRE diz o que fazer.
 * O rotulo e um <label> de verdade: tocar nele foca o campo.
 */
export function Field({
  rotulo,
  para,
  erro,
  dica,
  children,
}: {
  readonly rotulo: string;
  readonly para: string;
  readonly erro?: string;
  readonly dica?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={para} className="rotulo text-fg-muted">
        {rotulo}
      </label>
      {children}
      {dica !== undefined && erro === undefined ? (
        <p className="texto-bloco text-fg-muted text-xs">{dica}</p>
      ) : null}
      {erro !== undefined ? (
        <p role="alert" className="texto-bloco text-danger text-xs">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
