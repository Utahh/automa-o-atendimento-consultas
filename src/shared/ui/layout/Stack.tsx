import type { ReactNode } from 'react';
import { cn } from '../cn';

/**
 * Empilhamento vertical com `gap`.
 *
 * Regra 2 do anti-sobreposicao: espacamento por gap, nunca por margem — gap
 * nao colapsa e nao some quando um irmao desaparece.
 */
export function Stack({
  children,
  espaco = 3,
  className,
}: {
  readonly children: ReactNode;
  readonly espaco?: 1 | 2 | 3 | 4 | 6;
  readonly className?: string;
}) {
  const gaps = { 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6' } as const;
  return <div className={cn('flex min-w-0 flex-col', gaps[espaco], className)}>{children}</div>;
}
