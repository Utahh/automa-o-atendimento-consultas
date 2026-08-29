import { cn } from '../cn';
import { textos } from '../../i18n';

/**
 * Cor NUNCA comunica sozinha: todo estado tem rotulo alem da cor.
 * As cores de estado sao reservadas — nunca decorativas.
 */
export type EstadoVisual =
  'pendente' | 'confirmado' | 'chegou' | 'atendido' | 'cancelado' | 'faltou';

export function StatusBadge({ estado }: { readonly estado: EstadoVisual }) {
  return (
    <span
      className={cn(
        'rotulo inline-flex shrink-0 items-center rounded-md px-2 py-1',
        estado === 'confirmado' && 'text-success bg-success/10',
        estado === 'pendente' && 'text-warning bg-warning/10',
        (estado === 'faltou' || estado === 'cancelado') && 'text-danger bg-danger/10',
        (estado === 'chegou' || estado === 'atendido') && 'text-brand bg-brand-subtle',
      )}
    >
      {textos.status[estado]}
    </span>
  );
}
