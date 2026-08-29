'use client';

import Link from 'next/link';
import { cn } from '../cn';

/**
 * O item tocado marca-se como ativo NA HORA, mesmo que o dado demore.
 * Quem segura a transicao e o useTransition de quem renderiza a barra.
 */
export function NavItem({
  href,
  rotulo,
  ativo,
  orientacao,
  aoNavegar,
}: {
  readonly href: string;
  readonly rotulo: string;
  readonly ativo: boolean;
  readonly orientacao: 'inferior' | 'lateral';
  readonly aoNavegar: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={aoNavegar}
      aria-current={ativo ? 'page' : undefined}
      className={cn(
        'alvo-toque flex items-center justify-center px-2',
        orientacao === 'inferior' && 'flex-1 flex-col text-xs',
        orientacao === 'lateral' && 'justify-start rounded-lg px-3 text-base',
        ativo ? 'text-brand font-medium' : 'text-fg-muted',
        ativo && orientacao === 'lateral' && 'bg-brand-subtle',
      )}
    >
      <span className="texto-linha">{rotulo}</span>
    </Link>
  );
}
