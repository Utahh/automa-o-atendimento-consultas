import { cn } from '../cn';

/**
 * Espaco reservado. Nada se move depois de aparecer — e o que segura o CLS
 * abaixo de 0,1 (regra 9 do anti-sobreposicao).
 */
export function Skeleton({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('bg-surface-2 animate-pulse rounded-lg', className ?? 'h-16 w-full')}
    />
  );
}

export function Carregando({ linhas = 3 }: { readonly linhas?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}
