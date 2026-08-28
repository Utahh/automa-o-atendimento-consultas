import type { InputHTMLAttributes } from 'react';
import { cn } from '../cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'alvo-toque border-border bg-surface text-fg w-full rounded-xl border px-3 text-base',
        'placeholder:text-fg-muted focus-visible:border-brand',
        className,
      )}
    />
  );
}
