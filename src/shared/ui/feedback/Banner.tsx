import { cn } from '../cn';

/**
 * Faixa de aviso — e ela vive NO FLUXO (camada 0), nunca sobreposta.
 *
 * Empurra o conteudo para baixo em vez de cobri-lo. E a decisao que garante
 * que nenhum aviso tape um botao ou um horario.
 */
export function Banner({
  tom = 'informacao',
  titulo,
  acao,
}: {
  readonly tom?: 'informacao' | 'atencao' | 'perigo';
  readonly titulo: string;
  readonly acao?: { readonly rotulo: string; readonly href: string };
}) {
  return (
    <div
      role="status"
      className={cn(
        'camada-base flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm',
        tom === 'informacao' && 'bg-brand-subtle text-fg',
        tom === 'atencao' && 'bg-sand text-fg',
        tom === 'perigo' && 'bg-danger/10 text-danger',
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
