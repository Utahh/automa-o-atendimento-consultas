# Interface: o que é regra, não gosto

Fluidez não se resolve com animação. Resolve-se com quanto JavaScript chega ao
celular e com o que roda na thread principal.

## O orçamento

| Métrica              | Alvo            | Onde                  |
| -------------------- | --------------- | --------------------- |
| LCP                  | < 2,0 s em 4G   | Página pública e Hoje |
| INP                  | < 200 ms        | Todas                 |
| CLS                  | < 0,1           | Todas                 |
| JS da página pública | **< 90 kB** gz  | —                     |
| JS da área logada    | **< 180 kB** gz | —                     |

Verificado em todo PR por [`scripts/check-bundle-budget.mjs`](../scripts/check-bundle-budget.mjs).

## O que causa travamento, e o que fazemos

| Causa                                 | Decisão                                                            |
| ------------------------------------- | ------------------------------------------------------------------ |
| JavaScript demais na thread principal | Server Components; `'use client'` só na folha da árvore            |
| Lista longa renderizada inteira       | Virtualização acima de 50 linhas                                   |
| Biblioteca de data no cliente         | `date-fns` **só no servidor**; o cliente recebe texto já formatado |
| Imagem sem dimensão                   | `aspect-ratio` obrigatório                                         |
| Fonte que troca e move o layout       | `size-adjust` no fallback, `swap`, um peso pré-carregado           |
| Navegação que congela o toque         | `useTransition` com estado pendente visível                        |
| Animação em propriedade cara          | Só `transform` e `opacity`. Nunca `width`, `top`, `height`         |
| Rolagem presa                         | `content-visibility: auto` em seções longas fora da tela           |

## O sistema de camadas

Uma escala única, declarada em [`src/shared/ui/z-index.css`](../src/shared/ui/z-index.css).
**Nenhum número fora dela** — `npm run lint:ui` quebra a build.

| z   | Camada    | O que vive ali                                    | Limite    |
| --- | --------- | ------------------------------------------------- | --------- |
| 60  | Aviso     | Toast com desfazer                                | até 2     |
| 50  | Diálogo   | Confirmação irreversível                          | 1         |
| 40  | Painel    | Folha inferior ou lateral, com cortina            | 1         |
| 30  | Flutuante | Menu suspenso, popover, tooltip                   | 1 por vez |
| 20  | Navegação | Barra inferior, botão de ação                     | 1         |
| 10  | Grudado   | Cabeçalho da tela e da tabela                     | 1         |
| 1   | Elevado   | Cartão "Agora", chip ativo                        | —         |
| 0   | Fluxo     | Todo o conteúdo, **inclusive as faixas de aviso** | —         |

Três consequências:

1. A faixa de "canal desconectado" e a de "sem conexão" ficam **no fluxo**.
   Empurram o conteúdo para baixo em vez de cobri-lo — é o que garante que
   nenhum aviso tape um botão ou um horário.
2. Toda camada acima de 30 é renderizada em **portal** para `<div id="overlays">`,
   no fim do `body`. Assim escapa de qualquer `overflow:hidden` de um pai — a
   causa clássica de menu cortado pela metade.
3. **Nunca duas camadas do mesmo nível abertas.** Garantido por um único
   `useOverlay()`, não pela disciplina de quem escreve a tela.

## Dez regras contra texto em cima de texto

1. **Posicionamento absoluto só para as camadas declaradas.** 90% das
   sobreposições nascem de um `position:absolute` "só desta vez".
2. **Espaçamento por `gap`** em flex e grid. Margem negativa é proibida.
3. **`min-width: 0` em todo filho de flex/grid que contém texto.** É a causa
   nº 1 de estouro horizontal.
4. **Texto longo declara o comportamento:** `.texto-bloco` para blocos,
   `.texto-linha` para uma linha só.
5. **`min-height`, nunca `height`,** em qualquer bloco com texto.
6. **Tipografia com `clamp()`;** `text-wrap: balance` em títulos, `pretty` em
   parágrafos.
7. **Todo conteúdo largo dentro do próprio `overflow-x:auto`** — tabela,
   código, diagrama. O corpo da página nunca rola na horizontal.
8. **Fontes com `size-adjust` no fallback** e `font-display: swap`.
9. **Espaço reservado** por `aspect-ratio` em imagem e por `Esqueleto` em todo
   carregamento.
10. **Zoom de 200% e largura de 320 px são requisito**, não cortesia
    (WCAG 1.4.4 e 1.4.10).

O teste que impede a regressão é [`e2e/layout.spec.ts`](../e2e/layout.spec.ts):
cinco viewports, três asserções — sem estouro, sem colisão de texto, sem alvo
abaixo de 48 px. Substitui a revisão manual de "abre no celular e vê se
quebrou".

## Menu suspenso

**É o mesmo componente e a mesma API.** Quem escreve a tela declara os itens uma
vez; a forma é decidida pelo componente.

| Abaixo de 768 px               | 768 px ou mais                            |
| ------------------------------ | ----------------------------------------- |
| Folha inferior, alvos de 48 px | Popover ancorado, com detecção de colisão |
| Fecha tocando fora ou no ✕     | Fecha com Esc, clique fora ou escolha     |
| Altura máxima de 70% da tela   | Altura máxima de 60vh                     |

- **Um nível.** Não existe submenu — se precisa, vira uma tela.
- **Colisão:** o painel vira para cima ou se desloca, e **nunca cobre o gatilho**.
- **Foco:** abrir move ao primeiro item; ↑↓ navegam; letra salta; Esc fecha e
  **devolve o foco ao gatilho**.
- **Semântica:** `aria-expanded`, `aria-controls`, `role="menu"`, gatilho é `<button>`.
- **Ação destrutiva por último**, separada por divisor, em cor de perigo **com
  rótulo** — nunca cor sozinha.

## A tela que se adapta

| Faixa    | Navegação                        | Conteúdo                             | Ação principal          |
| -------- | -------------------------------- | ------------------------------------ | ----------------------- |
| < 768 px | Barra inferior, 4 itens + "Mais" | 1 coluna                             | Botão largo na base     |
| 768–1023 | Barra inferior                   | 2 colunas onde faz sentido           | Base                    |
| ≥ 1024   | Barra lateral fixa               | Principal + painel                   | Topo direito **e** base |
| ≥ 1280   | Barra lateral                    | 3ª coluna: detalhe sem sair da lista | Idem                    |

- **Container queries, não só media queries.** Um cartão decide o próprio
  layout pelo espaço que **ele** tem.
- **A tela se adapta ao conteúdo, não o conteúdo à tela.**
  `repeat(auto-fit, minmax(mínimo, 1fr))` — o número de colunas é consequência,
  não configuração.
