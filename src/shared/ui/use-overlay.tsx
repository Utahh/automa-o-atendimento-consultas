'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Nunca duas camadas do mesmo nível abertas ao mesmo tempo.
 *
 * Isso é garantido por este controlador único — não pela disciplina de quem
 * escreve a tela. Abrir uma folha fecha o menu.
 */
export type NivelDeCamada = 'flutuante' | 'painel' | 'dialogo';

type EstadoOverlay = {
  readonly abertoPorNivel: Readonly<Record<NivelDeCamada, string | null>>;
  abrir: (nivel: NivelDeCamada, id: string) => void;
  fechar: (id: string) => void;
  estaAberto: (id: string) => boolean;
};

const OverlayContext = createContext<EstadoOverlay | null>(null);

const VAZIO: Record<NivelDeCamada, string | null> = {
  flutuante: null,
  painel: null,
  dialogo: null,
};

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [abertos, setAbertos] = useState<Record<NivelDeCamada, string | null>>(VAZIO);

  const abrir = useCallback((nivel: NivelDeCamada, id: string) => {
    setAbertos((atual) => {
      const proximo = { ...atual, [nivel]: id };
      // Abrir um painel ou um diálogo fecha o que flutua abaixo dele.
      if (nivel === 'painel' || nivel === 'dialogo') proximo.flutuante = null;
      if (nivel === 'dialogo') proximo.painel = null;
      return proximo;
    });
  }, []);

  const fechar = useCallback((id: string) => {
    setAbertos((atual) => {
      const proximo = { ...atual };
      for (const nivel of Object.keys(proximo) as NivelDeCamada[]) {
        if (proximo[nivel] === id) proximo[nivel] = null;
      }
      return proximo;
    });
  }, []);

  const valor = useMemo<EstadoOverlay>(
    () => ({
      abertoPorNivel: abertos,
      abrir,
      fechar,
      estaAberto: (id) => Object.values(abertos).includes(id),
    }),
    [abertos, abrir, fechar],
  );

  return <OverlayContext.Provider value={valor}>{children}</OverlayContext.Provider>;
}

export function useOverlay(): EstadoOverlay {
  const ctx = useContext(OverlayContext);
  if (ctx === null) {
    throw new Error('useOverlay() precisa de <OverlayProvider> acima na árvore.');
  }
  return ctx;
}
