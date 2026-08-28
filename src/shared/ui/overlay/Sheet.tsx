'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Portal } from './Portal';
import { Scrim } from './Scrim';
import { useOverlay } from '../hooks/use-overlay';
import { textos } from '../../i18n';

/**
 * A folha inferior. Camada 40, em portal, com cortina.
 *
 * Sobe da base porque foi a base que voce tocou — animacao existe para
 * explicar de onde a coisa veio, e dura 150 ms.
 *
 * Fecha arrastando para baixo, tocando fora ou no X. Altura maxima de 70%
 * da tela, com rolagem interna: nunca uma folha que cobre a tela inteira.
 */
export function Sheet({
  id,
  titulo,
  children,
  rodape,
}: {
  readonly id: string;
  readonly titulo: string;
  readonly children: ReactNode;
  readonly rodape?: ReactNode;
}) {
  const { estaAberto, fechar } = useOverlay();
  const aberto = estaAberto(id);
  const painelRef = useRef<HTMLDivElement>(null);
  const arrasteY = useRef<number | null>(null);

  const fecharFolha = useCallback(() => fechar(id), [fechar, id]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharFolha();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, fecharFolha]);

  // Foco entra na folha assim que ela monta — e nao um passo depois.
  const registrar = useCallback((no: HTMLDivElement | null) => {
    painelRef.current = no;
    no?.focus();
  }, []);

  if (!aberto) return null;

  return (
    <Portal>
      <Scrim aoFechar={fecharFolha} nivel="painel" />
      <div
        ref={registrar}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onPointerDown={(e) => {
          arrasteY.current = e.clientY;
        }}
        onPointerUp={(e) => {
          const inicio = arrasteY.current;
          arrasteY.current = null;
          // Arrastar 64 px para baixo fecha — e o gesto que a mao ja faz.
          if (inicio !== null && e.clientY - inicio > 64) fecharFolha();
        }}
        className="camada-painel anima-subida border-border bg-surface fixed inset-x-0 bottom-0 flex max-h-[70dvh] flex-col rounded-t-2xl border-t outline-none"
      >
        <div className="border-border flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="texto-linha text-lg font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={fecharFolha}
            aria-label={textos.acoes.fechar}
            className="alvo-toque text-fg-muted -mr-2 px-2"
          >
            &#10005;
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>

        {rodape !== undefined ? (
          <div className="border-border shrink-0 border-t px-4 py-3">{rodape}</div>
        ) : null}
      </div>
    </Portal>
  );
}
