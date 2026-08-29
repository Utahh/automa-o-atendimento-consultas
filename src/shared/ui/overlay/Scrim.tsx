'use client';

import { cn } from '../cn';

/** A cortina de uma folha ou de um dialogo. Tocar nela fecha. */
export function Scrim({
  aoFechar,
  nivel,
}: {
  readonly aoFechar: () => void;
  readonly nivel: 'painel' | 'dialogo';
}) {
  return (
    <div
      aria-hidden="true"
      onClick={aoFechar}
      className={cn(
        'fixed inset-0 bg-black/40',
        nivel === 'painel' ? 'camada-painel' : 'camada-dialogo',
      )}
    />
  );
}
