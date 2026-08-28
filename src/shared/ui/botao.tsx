import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly tom?: 'primario' | 'secundario' | 'perigo';
  readonly largo?: boolean;
};

/**
 * O único botão. Alvo de 48 px sempre; nunca `height` fixo — o texto empurra.
 */
export function Botao({ tom = 'primario', largo = false, className, ...props }: Props) {
  return (
    <button
      {...props}
      className={cn(
        'alvo-toque inline-flex items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium',
        'transition-[opacity,transform] duration-150 active:scale-[0.99] disabled:opacity-50',
        tom === 'primario' && 'bg-acento text-white',
        tom === 'secundario' && 'border-linha bg-cartao text-tinta border',
        tom === 'perigo' && 'bg-perigo text-white',
        largo && 'w-full',
        className,
      )}
    />
  );
}
