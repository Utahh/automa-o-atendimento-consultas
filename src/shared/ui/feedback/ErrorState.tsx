'use client';

import { traduzirErro, textos } from '../../i18n';
import { Button } from '../primitives/Button';

/**
 * Erro na tela: os textos do i18n, sempre com a ACAO SUGERIDA.
 * Nunca so "nao foi possivel concluir" — isso e desistencia, nao mensagem.
 */
export function ErrorState({
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
      <p className="texto-bloco text-base font-medium">{texto.profissional}</p>
      <p className="texto-bloco text-fg-muted text-sm">{texto.acaoSugerida}</p>
      {aoTentarNovamente !== undefined ? (
        <Button variante="secundario" onClick={aoTentarNovamente} className="mt-2">
          {textos.acoes.tentarNovamente}
        </Button>
      ) : null}
    </div>
  );
}
