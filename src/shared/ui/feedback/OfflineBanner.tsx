'use client';

import { useEffect, useState } from 'react';
import { Banner } from './Banner';
import { textos } from '../../i18n';

/**
 * Sem conexao a tela nao mente: diz o que esta mostrando e o que vai acontecer.
 * Fica no fluxo — empurra o conteudo, nao cobre.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener('online', atualizar);
    window.addEventListener('offline', atualizar);
    return () => {
      window.removeEventListener('online', atualizar);
      window.removeEventListener('offline', atualizar);
    };
  }, []);

  if (!offline) return null;
  return <Banner tom="atencao" titulo={textos.estados.mostrandoOQueJaEstavaAqui} />;
}
