'use client';

import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Portal } from '../overlay/Portal';
import { Scrim } from '../overlay/Scrim';
import { useOverlay } from '../hooks/use-overlay';
import { usePonteiroPreciso } from '../hooks/use-media-query';
import { cn } from '../cn';
import { textos } from '../../i18n';

/**
 * Um menu, duas formas — e a mesma API.
 *
 *   < 768 px  → folha inferior, alvos de 48 px. Um popover minúsculo no topo
 *               da tela é inutilizável com uma mão.
 *   ≥ 768 px  → popover ancorado, com detecção de colisão.
 *
 * Quem escreve a tela declara os itens uma vez; a forma é decidida aqui.
 * Não existe submenu: se precisa de submenu, o menu está errado e vira tela.
 */

export type ItemDeMenu =
  | { readonly separador: true }
  | {
      readonly id: string;
      readonly rotulo: string;
      readonly onSelect: () => void;
      /** Destrutiva vai por último, separada, em cor de perigo COM rótulo. */
      readonly tom?: 'normal' | 'perigo';
      readonly desabilitado?: boolean;
    };

type ItemAcionavel = Exclude<ItemDeMenu, { separador: true }>;

type Props = {
  readonly gatilho: ReactElement<Record<string, unknown>>;
  readonly itens: readonly ItemDeMenu[];
  readonly titulo?: string;
};

const MARGEM = 8;
const LARGURA = 240;
const ALTURA_ITEM = 48;

function ehAcionavel(i: ItemDeMenu): i is ItemAcionavel {
  return !('separador' in i);
}

export function MenuSuspenso({ gatilho, itens, titulo }: Props) {
  const id = useId();
  const precisao = usePonteiroPreciso();
  const { abrir, fechar, estaAberto } = useOverlay();
  const aberto = estaAberto(id);

  const gatilhoRef = useRef<HTMLElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const [foco, setFoco] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Destrutiva sempre por último, qualquer que seja a ordem declarada.
  const acionaveis = itens.filter(ehAcionavel);
  const ordenados = [...acionaveis].sort(
    (a, b) => Number(a.tom === 'perigo') - Number(b.tom === 'perigo'),
  );
  const primeiroPerigo = ordenados.findIndex((i) => i.tom === 'perigo');

  const focarItem = useCallback((indice: number) => {
    painelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]').item(indice)?.focus();
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

  // Detecção de colisão: vira para cima ou se desloca em vez de sair da tela,
  // e nunca cobre o próprio gatilho.
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

    setPos({
      top: acima ? g.top - MARGEM - altura : g.bottom + MARGEM,
      left: Math.min(
        Math.max(MARGEM, g.left),
        Math.max(MARGEM, window.innerWidth - LARGURA - MARGEM),
      ),
    });
  }, [aberto, precisao, ordenados.length]);

  /**
   * Abrir move o foco ao primeiro item — por ref de callback, não por efeito:
   * o painel vive num portal que só monta um passo depois, e nesse passo o
   * `painelRef` ainda seria nulo. Sem isso, o Esc não chegaria ao menu.
   */
  const registrarPainel = useCallback((no: HTMLDivElement | null) => {
    painelRef.current = no;
    no?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, []);

  useEffect(() => {
    if (!aberto || !precisao) return;
    const aoApontarFora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (painelRef.current?.contains(alvo)) return;
      if (gatilhoRef.current?.contains(alvo)) return;
      fechar(id);
    };
    document.addEventListener('mousedown', aoApontarFora);
    return () => document.removeEventListener('mousedown', aoApontarFora);
  }, [aberto, precisao, fechar, id]);

  const aoTeclar = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const total = ordenados.length;
    if (e.key === 'Escape') {
      e.preventDefault();
      fecharEDevolverFoco();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const proximo = (foco + (e.key === 'ArrowDown' ? 1 : -1) + total) % total;
      setFoco(proximo);
      focarItem(proximo);
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const alvo = e.key === 'Home' ? 0 : total - 1;
      setFoco(alvo);
      focarItem(alvo);
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
      aria-label={titulo ?? textos.nav.mais}
      onKeyDown={aoTeclar}
      className="flex min-h-0 flex-col overflow-y-auto"
    >
      {ordenados.map((item, i) => (
        <div key={item.id} className="contents">
          {/* 8 px separando a ação destrutiva das demais. */}
          {i === primeiroPerigo && primeiroPerigo > 0 ? (
            <div role="separator" className="bg-border my-1 h-px shrink-0" />
          ) : null}
          <button
            role="menuitem"
            type="button"
            tabIndex={-1}
            disabled={item.desabilitado ?? false}
            onClick={() => {
              item.onSelect();
              fecharEDevolverFoco();
            }}
            className={cn(
              'alvo-toque hover:bg-surface-2 focus-visible:bg-surface-2 flex w-full items-center px-4 text-left text-base disabled:opacity-40',
              item.tom === 'perigo' ? 'text-danger' : 'text-fg',
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
      {cloneElement(gatilho, {
        ref: gatilhoRef,
        onClick: alternar,
        'aria-expanded': aberto,
        'aria-haspopup': 'menu',
        'aria-controls': aberto ? id + '-painel' : undefined,
      })}

      {aberto ? (
        <Portal>
          {precisao ? (
            <div
              id={id + '-painel'}
              className="camada-flutuante anima-entrada border-border bg-surface fixed rounded-xl border py-1 shadow-lg"
              style={{
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                width: LARGURA,
                maxHeight: '60vh',
                visibility: pos === null ? 'hidden' : 'visible',
              }}
            >
              {lista}
            </div>
          ) : (
            <>
              <Scrim aoFechar={() => fechar(id)} nivel="painel" />
              <div
                id={id + '-painel'}
                className="camada-painel anima-subida border-border bg-surface fixed inset-x-0 bottom-0 flex max-h-[70dvh] flex-col rounded-t-2xl border-t"
              >
                <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-3">
                  <span className="texto-linha font-medium">{titulo ?? textos.nav.mais}</span>
                  <button
                    type="button"
                    onClick={fecharEDevolverFoco}
                    aria-label={textos.acoes.fechar}
                    className="alvo-toque text-fg-muted -mr-2 px-2"
                  >
                    &#10005;
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
