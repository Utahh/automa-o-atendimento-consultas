'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Nunca duas camadas do mesmo nivel abertas ao mesmo tempo.
 *
 * Garantido por este controlador unico — nao pela disciplina de quem escreve
 * a tela. Abrir uma folha fecha o menu suspenso; abrir um dialogo fecha os dois.
 */
export type NivelDeCamada = 'flutuante' | 'painel' | 'dialogo';

type EstadoOverlay = {
  readonly abertoPorNivel: Readonly<Record<NivelDeCamada, string | null>>;
  readonly abrir: (nivel: NivelDeCamada, id: string) => void;
  readonly fechar: (id: string) => void;
  readonly estaAberto: (id: string) => boolean;
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
  if (ctx === null) throw new Error('useOverlay() precisa de <OverlayProvider> acima na arvore.');
  return ctx;
}
