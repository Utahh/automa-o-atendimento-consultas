import type { ReactNode } from 'react';
import { textos, traduzirErro } from '../i18n';
import { cn } from './cn';

/**
 * Toda tela tem quatro estados: vazio, carregando, erro, conteúdo.
 * Os três primeiros moram aqui, para que ninguém invente o seu.
 */

/** Espaço reservado: nada se move depois de aparecer (CLS < 0,1). */
export function Esqueleto({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('bg-fundo-2 animate-pulse rounded-lg', className ?? 'h-16 w-full')}
    />
  );
}

export function Carregando({ linhas = 3 }: { readonly linhas?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: linhas }, (_, i) => (
        <Esqueleto key={i} />
      ))}
    </div>
  );
}

export function Vazio({
  titulo,
  acao,
  children,
}: {
  readonly titulo: string;
  readonly acao?: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <p className="texto-bloco text-[15px] font-medium">{titulo}</p>
      {acao !== undefined ? <p className="texto-bloco text-tinta-2 text-[14px]">{acao}</p> : null}
      {children}
    </div>
  );
}

/**
 * Erro na tela: os três textos do i18n. Nunca só "não foi possível concluir".
 */
export function ErroNaTela({
  codigo,
  aoTentarNovamente,
}: {
  readonly codigo: string;
  readonly aoTentarNovamente?: () => void;
}) {
  const texto = traduzirErro(codigo);
  return (
    <div
      role="alert"
      className="flex min-h-40 flex-col items-center justify-center gap-2 px-6 py-10 text-center"
    >
      <p className="texto-bloco text-[15px] font-medium">{texto.titulo}</p>
      <p className="texto-bloco text-tinta-2 text-[14px]">{texto.explicacao}</p>
      <p className="texto-bloco text-tinta text-[14px]">{texto.acao}</p>
      {aoTentarNovamente !== undefined ? (
        <button
          type="button"
          onClick={aoTentarNovamente}
          className="alvo-toque border-linha mt-2 rounded-lg border px-4 text-[15px]"
        >
          {textos.acoes.tentarNovamente}
        </button>
      ) : null}
    </div>
  );
}
