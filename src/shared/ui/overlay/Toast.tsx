'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Portal } from './Portal';
import { textos } from '../../i18n';

/**
 * Desfazer em vez de dialogo.
 *
 * Toda acao destrutiva tem desfazer por 6 s; nenhuma tem "tem certeza?".
 * Ate dois toasts empilhados — o terceiro empurra o mais antigo para fora.
 */
const DURACAO_MS = 6000;
const MAXIMO = 2;

type Aviso = {
  readonly id: number;
  readonly texto: string;
  readonly desfazer?: () => void;
};

type ApiDeToast = {
  readonly mostrar: (texto: string, desfazer?: () => void) => void;
};

const ToastContext = createContext<ApiDeToast | null>(null);

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [avisos, setAvisos] = useState<readonly Aviso[]>([]);

  const remover = useCallback((id: number) => {
    setAvisos((atuais) => atuais.filter((a) => a.id !== id));
  }, []);

  const mostrar = useCallback(
    (texto: string, desfazer?: () => void) => {
      const id = Date.now() + Math.random();
      const aviso: Aviso = desfazer === undefined ? { id, texto } : { id, texto, desfazer };
      setAvisos((atuais) => [...atuais, aviso].slice(-MAXIMO));
      setTimeout(() => remover(id), DURACAO_MS);
    },
    [remover],
  );

  const api = useMemo<ApiDeToast>(() => ({ mostrar }), [mostrar]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {avisos.length > 0 ? (
        <Portal>
          <div
            role="status"
            aria-live="polite"
            className="camada-aviso pointer-events-none fixed inset-x-0 bottom-24 flex flex-col items-center gap-2 px-4 lg:bottom-6"
          >
            {avisos.map((a) => (
              <div
                key={a.id}
                className="anima-entrada bg-night pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-lg"
              >
                <span className="texto-bloco min-w-0 flex-1">{a.texto}</span>
                {a.desfazer !== undefined ? (
                  <button
                    type="button"
                    onClick={() => {
                      a.desfazer?.();
                      remover(a.id);
                    }}
                    className="shrink-0 font-semibold underline underline-offset-2"
                  >
                    {textos.acoes.desfazer}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </Portal>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ApiDeToast {
  const ctx = useContext(ToastContext);
  if (ctx === null) throw new Error('useToast() precisa de <ToastProvider> acima na arvore.');
  return ctx;
}
