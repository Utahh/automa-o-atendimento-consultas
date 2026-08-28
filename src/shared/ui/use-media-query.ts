'use client';

import { useEffect, useState } from 'react';

/** Reage à consulta de mídia sem causar salto de layout na hidratação. */
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

/** O ponto de virada entre folha inferior e popover ancorado. */
export function usePonteiroPreciso(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
