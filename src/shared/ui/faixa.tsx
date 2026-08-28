import { cn } from './cn';

/**
 * Faixa de aviso — e ela vive no FLUXO (z-index 0), nunca sobreposta.
 *
 * Empurra o conteúdo para baixo em vez de cobri-lo. É a decisão que garante
 * que nenhum aviso tape um botão ou um horário.
 */
export function Faixa({
  tom = 'atencao',
  titulo,
  acao,
}: {
  readonly tom?: 'atencao' | 'perigo' | 'neutro';
  readonly titulo: string;
  readonly acao?: { readonly rotulo: string; readonly href: string };
}) {
  return (
    <div
      role="status"
      className={cn(
        'camada-fluxo flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-[14px]',
        tom === 'perigo' && 'bg-perigo/10 text-perigo',
        tom === 'atencao' && 'bg-acento-suave text-tinta',
        tom === 'neutro' && 'bg-fundo-2 text-tinta-2',
      )}
    >
      <span className="texto-bloco min-w-0 flex-1">{titulo}</span>
      {acao ? (
        <a href={acao.href} className="shrink-0 font-medium underline underline-offset-2">
          {acao.rotulo}
        </a>
      ) : null}
    </div>
  );
}
