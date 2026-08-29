import type { ReactNode } from 'react';
import { cn } from '../cn';

/**
 * Composicao, nao configuracao: <Card><Card.Header/></Card> em vez de dez
 * props booleanas.
 *
 * `min-height` e nunca `height`: o texto empurra em vez de vazar.
 */
export function Card({
  children,
  elevado = false,
  className,
}: {
  readonly children: ReactNode;
  readonly elevado?: boolean;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border bg-surface flex min-h-16 flex-col rounded-xl border',
        elevado && 'camada-elevado shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children }: { readonly children: ReactNode }) {
  return <div className="border-border flex items-center gap-3 border-b px-4 py-3">{children}</div>;
};

Card.Body = function CardBody({ children }: { readonly children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-2 px-4 py-3">{children}</div>;
};

Card.Footer = function CardFooter({ children }: { readonly children: ReactNode }) {
  return <div className="border-border flex items-center gap-2 border-t px-4 py-3">{children}</div>;
};
