'use client';

import { useEffect, useState } from 'react';

/** Reage a consulta de midia sem causar salto de layout na hidratacao. */
export function useMediaQuery(consulta: string, padrao = false): boolean {
  const [combina, setCombina] = useState(padrao);

  useEffect(() => {
    const mql = window.matchMedia(consulta);
    setCombina(mql.matches);
    const aoMudar = (e: MediaQueryListEvent) => setCombina(e.matches);
    mql.addEventListener('change', aoMudar);
    return () => mql.removeEventListener('change', aoMudar);
  }, [consulta]);

  return combina;
}

/** 768 px: o ponto de virada entre folha inferior e popover ancorado. */
export function usePonteiroPreciso(): boolean {
  return useMediaQuery('(min-width: 48rem)');
}

/** 1024 px: o ponto em que a navegacao inferior vira barra lateral. */
export function useTelaLarga(): boolean {
  return useMediaQuery('(min-width: 64rem)');
}
