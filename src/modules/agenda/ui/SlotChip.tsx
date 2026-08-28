import { cn } from '@/shared/ui';
import type { Status } from '../domain/transicoes';

/**
 * O chip do horario. Recebe TEXTO JA FORMATADO — nenhuma biblioteca de data
 * chega ao celular.
 */
export function SlotChip({
  horaFormatada,
  status,
  agora = false,
}: {
  readonly horaFormatada: string;
  readonly status: Status;
  readonly agora?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-lg px-2 py-1 font-mono text-sm tabular-nums',
        agora ? 'camada-elevado bg-brand text-brand-fg' : 'bg-surface-2 text-fg-muted',
        status === 'cancelado' && 'line-through opacity-60',
      )}
    >
      {horaFormatada}
    </span>
  );
}
