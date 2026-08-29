import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variante?: 'primario' | 'secundario' | 'fantasma' | 'perigo';
  readonly largo?: boolean;
};

/**
 * O unico botao.
 *
 * Alvo de 48 px sempre; nunca `height` fixo — o texto empurra. Movimento de
 * 150 ms em transform/opacity, nunca em largura ou altura.
 */
export function Button({ variante = 'primario', largo = false, className, ...props }: Props) {
  return (
    <button
      {...props}
      className={cn(
        'alvo-toque inline-flex items-center justify-center gap-2 rounded-xl px-4 text-base font-medium',
        'transition-[opacity,transform] duration-150 active:scale-[0.99] disabled:opacity-50',
        variante === 'primario' && 'bg-brand text-brand-fg',
        variante === 'secundario' && 'border-border bg-surface text-fg border',
        variante === 'fantasma' && 'text-fg-muted hover:bg-surface-2',
        variante === 'perigo' && 'bg-danger text-brand-fg',
        largo && 'w-full',
        className,
      )}
    />
  );
}
