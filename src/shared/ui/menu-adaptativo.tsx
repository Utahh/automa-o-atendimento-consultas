'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Portal } from './portal';
import { useOverlay } from './use-overlay';
import { usePonteiroPreciso } from './use-media-query';
import { cn } from './cn';
import { textos } from '../i18n';

/**
 * Um menu, duas formas.
 *
 *   < 768 px  → folha inferior, alvos de 48 px, fecha tocando fora ou no ✕
 *   ≥ 768 px  → popover ancorado, com detecção de colisão
 *
 * Quem escreve a tela declara os itens uma vez; a forma é decidida aqui, não
 * pela página. Não existe submenu: se precisa de submenu, o menu está errado
 * e vira uma tela.
 */

export type ItemDeMenu = {
  readonly id: string;
  readonly rotulo: string;
  readonly aoEscolher: () => void;
  /** Ação destrutiva vai por último, separada por divisor, em cor de perigo COM rótulo. */
  readonly perigo?: boolean;
  readonly desabilitado?: boolean;
};

type Props = {
  readonly rotuloGatilho: string;
  readonly itens: readonly ItemDeMenu[];
  readonly titulo?: string;
};

const MARGEM = 8;
const LARGURA_POPOVER = 240;
const ALTURA_ITEM = 44;

export function MenuAdaptativo({ rotuloGatilho, itens, titulo }: Props) {
  const id = useId();
  const precisao = usePonteiroPreciso();
  const { abrir, fechar, estaAberto } = useOverlay();
  const aberto = estaAberto(id);

  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const [foco, setFoco] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Ação destrutiva sempre por último, qualquer que seja a ordem declarada.
  const ordenados = [...itens].sort(
    (a, b) => Number(a.perigo ?? false) - Number(b.perigo ?? false),
  );
  const primeiroPerigo = ordenados.findIndex((i) => i.perigo === true);

  const focarItem = useCallback((indice: number) => {
    const nos = painelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    nos?.item(indice)?.focus();
  }, []);

  const alternar = useCallback(() => {
    if (aberto) {
      fechar(id);
    } else {
      abrir(precisao ? 'flutuante' : 'painel', id);
      setFoco(0);
    }
  }, [aberto, abrir, fechar, id, precisao]);

  const fecharEDevolverFoco = useCallback(() => {
    fechar(id);
    gatilhoRef.current?.focus();
  }, [fechar, id]);

  // Detecção de colisão: o painel vira para cima ou se desloca em vez de sair
  // da tela, e nunca cobre o próprio gatilho.
  useLayoutEffect(() => {
    if (!aberto || !precisao) {
      setPos(null);
      return;
    }
    const g = gatilhoRef.current?.getBoundingClientRect();
    if (!g) return;

    const altura = Math.min(ordenados.length * ALTURA_ITEM + 16, window.innerHeight * 0.6);
    const cabeAbaixo = g.bottom + MARGEM + altura <= window.innerHeight;
    const cabeAcima = g.top - MARGEM - altura >= 0;
    const acima = !cabeAbaixo && cabeAcima;

    const left = Math.min(
      Math.max(MARGEM, g.left),
      Math.max(MARGEM, window.innerWidth - LARGURA_POPOVER - MARGEM),
    );
    const top = acima ? g.top - MARGEM - altura : g.bottom + MARGEM;

    setPos({ top, left });
  }, [aberto, precisao, ordenados.length]);

  /**
   * Abrir move o foco ao primeiro item.
   *
   * Por ref de callback, e nao por efeito: o painel vive num portal que so
   * monta um passo depois: quando o efeito rodasse, painelRef ainda seria
   * nulo e o foco ficaria no body — e ai o Esc nao chegaria ao menu.
   */
  const registrarPainel = useCallback((no: HTMLDivElement | null) => {
    painelRef.current = no;
    no?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, []);

  // Clicar fora fecha — sem devolver o foco, porque o ponteiro já foi embora.
  useEffect(() => {
    if (!aberto) return;
    const aoApontarFora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (painelRef.current?.contains(alvo)) return;
      if (gatilhoRef.current?.contains(alvo)) return;
      fechar(id);
    };
    document.addEventListener('mousedown', aoApontarFora);
    return () => document.removeEventListener('mousedown', aoApontarFora);
  }, [aberto, fechar, id]);

  const aoTeclar = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      fecharEDevolverFoco();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const passo = e.key === 'ArrowDown' ? 1 : -1;
      const proximo = (foco + passo + ordenados.length) % ordenados.length;
      setFoco(proximo);
      focarItem(proximo);
      return;
    }
    // Digitar uma letra salta para o item que começa com ela.
    if (e.key.length === 1 && /\p{L}/u.test(e.key)) {
      const letra = e.key.toLowerCase();
      const alvo = ordenados.findIndex((i) => i.rotulo.toLowerCase().startsWith(letra));
      if (alvo >= 0) {
        setFoco(alvo);
        focarItem(alvo);
      }
    }
  };

  const lista = (
    <div
      ref={registrarPainel}
      role="menu"
      aria-label={titulo ?? rotuloGatilho}
      onKeyDown={aoTeclar}
      className="flex min-h-0 flex-col overflow-y-auto"
    >
      {ordenados.map((item, i) => (
        <div key={item.id} className="contents">
          {i === primeiroPerigo && primeiroPerigo > 0 ? (
            <div role="separator" className="bg-linha my-1 h-px shrink-0" />
          ) : null}
          <button
            role="menuitem"
            type="button"
            tabIndex={-1}
            disabled={item.desabilitado ?? false}
            onClick={() => {
              item.aoEscolher();
              fecharEDevolverFoco();
            }}
            className={cn(
              'alvo-toque flex w-full items-center px-4 text-left text-[15px]',
              'hover:bg-fundo-2 focus-visible:bg-fundo-2 disabled:opacity-40',
              item.perigo === true ? 'text-perigo' : 'text-tinta',
            )}
          >
            <span className="texto-linha">{item.rotulo}</span>
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <button
        ref={gatilhoRef}
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-controls={aberto ? id + '-painel' : undefined}
        className="alvo-toque border-linha bg-cartao inline-flex items-center gap-2 rounded-lg border px-3 text-[15px]"
      >
        <span className="texto-linha">{rotuloGatilho}</span>
      </button>

      {aberto ? (
        <Portal>
          {precisao ? (
            <div
              id={id + '-painel'}
              className="camada-flutuante anima-entrada border-linha bg-cartao fixed rounded-xl border py-1 shadow-lg"
              style={{
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                width: LARGURA_POPOVER,
                maxHeight: '60vh',
                visibility: pos === null ? 'hidden' : 'visible',
              }}
            >
              {lista}
            </div>
          ) : (
            <>
              <div
                className="camada-painel fixed inset-0 bg-black/40"
                onClick={() => fechar(id)}
                aria-hidden="true"
              />
              <div
                id={id + '-painel'}
                className="camada-painel anima-entrada border-linha bg-cartao fixed inset-x-0 bottom-0 flex max-h-[70vh] flex-col rounded-t-2xl border-t"
              >
                <div className="border-linha flex shrink-0 items-center justify-between border-b px-4 py-3">
                  <span className="texto-linha font-medium">{titulo ?? rotuloGatilho}</span>
                  <button
                    type="button"
                    onClick={fecharEDevolverFoco}
                    aria-label={textos.acoes.fechar}
                    className="alvo-toque text-tinta-2 -mr-2 px-2"
                  >
                    ✕
                  </button>
                </div>
                {lista}
              </div>
            </>
          )}
        </Portal>
      ) : null}
    </>
  );
}
