import { cn } from '@/shared/ui';
import type { Status } from '../domain/transicoes';

/**
 * O chip do horário. Recebe texto já formatado — nenhuma biblioteca de data
 * chega ao cliente.
 */
export function ChipDeHorario({
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
        'inline-flex shrink-0 items-center rounded-lg px-2 py-1 font-mono text-[13px] tabular-nums',
        agora ? 'camada-elevado bg-acento text-white' : 'bg-fundo-2 text-tinta-2',
        status === 'cancelado' && 'line-through opacity-60',
      )}
    >
      {horaFormatada}
    </span>
  );
}
