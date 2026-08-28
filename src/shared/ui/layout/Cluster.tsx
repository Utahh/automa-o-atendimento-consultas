import type { ReactNode } from 'react';
import { cn } from '../cn';

/** Agrupamento horizontal que quebra linha sozinho, sem estourar a largura. */
export function Cluster({
  children,
  espaco = 2,
  className,
}: {
  readonly children: ReactNode;
  readonly espaco?: 1 | 2 | 3 | 4;
  readonly className?: string;
}) {
  const gaps = { 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4' } as const;
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center', gaps[espaco], className)}>
      {children}
    </div>
  );
}
