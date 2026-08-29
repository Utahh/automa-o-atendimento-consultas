'use client';

import { cn } from '../cn';

/**
 * A profissional nunca digita o que o sistema pode adivinhar: recentes e mais
 * usados viram chip. Alvo de 48 px, porque a mao nem sempre esta seca.
 */
export function Chip({
  rotulo,
  selecionado = false,
  aoEscolher,
}: {
  readonly rotulo: string;
  readonly selecionado?: boolean;
  readonly aoEscolher: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoEscolher}
      aria-pressed={selecionado}
      className={cn(
        'alvo-toque inline-flex max-w-full items-center rounded-full border px-4 text-sm',
        selecionado
          ? 'camada-elevado border-brand bg-brand text-brand-fg font-medium'
          : 'border-border bg-surface text-fg',
      )}
    >
      <span className="texto-linha">{rotulo}</span>
    </button>
  );
}
