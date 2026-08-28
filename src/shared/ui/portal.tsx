'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Toda camada acima de 30 é renderizada aqui, em <div id="overlays"> no fim
 * do body. É o que faz o menu escapar de qualquer overflow:hidden de um pai —
 * a causa clássica de menu cortado pela metade.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [alvo, setAlvo] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setAlvo(document.getElementById('overlays'));
  }, []);

  if (alvo === null) return null;
  return createPortal(children, alvo);
}
