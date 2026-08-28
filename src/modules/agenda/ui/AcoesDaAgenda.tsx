'use client';

import { MenuSuspenso, useToast, type ItemDeMenu } from '@/shared/ui';
import { textos } from '@/shared/i18n';

/**
 * O menu de acoes da agenda — o exemplo canonico do componente.
 *
 * Um nivel, acao destrutiva por ultimo, separada por divisor, em cor de
 * perigo COM rotulo. Marcar falta e destrutivo: sai com desfazer, nunca com
 * "tem certeza?".
 */
export function AcoesDaAgenda() {
  const { mostrar } = useToast();

  const itens: ItemDeMenu[] = [
    {
      id: 'remarcar',
      rotulo: textos.acoes.remarcar,
      onSelect: () => mostrar(textos.acoes.remarcar),
    },
    {
      id: 'cobrar',
      rotulo: textos.acoes.registrarPagamento,
      onSelect: () => mostrar(textos.acoes.registrarPagamento),
    },
    {
      id: 'bloquear',
      rotulo: textos.acoes.bloquear,
      onSelect: () => mostrar(textos.acoes.bloquear),
    },
    {
      id: 'faltou',
      rotulo: textos.acoes.marcarFalta,
      tom: 'perigo',
      // Desfazer em vez de dialogo: 6 s para voltar atras.
      onSelect: () => mostrar(textos.acoes.marcarFalta, () => undefined),
    },
  ];

  return (
    <MenuSuspenso
      titulo={textos.acoes.maisAcoes}
      itens={itens}
      gatilho={
        <button
          type="button"
          aria-label={textos.acoes.maisAcoes}
          className="alvo-toque text-fg-muted hover:bg-surface-2 rounded-lg px-3"
        >
          &#8943;
        </button>
      }
    />
  );
}
