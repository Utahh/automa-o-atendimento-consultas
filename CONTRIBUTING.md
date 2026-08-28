# Como contribuir

> O repositório é público, mas o código é proprietário — ver [LICENSE](LICENSE).
> Ao abrir um PR você cede os direitos patrimoniais da contribuição.

## O caminho

```
feat/nome-curto  →  PR para develop  →  PR para main
```

Nada entra em `main` sem passar por `develop`, e nada entra em `develop` sem CI
verde.

Prefixos de branch: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.

## Commits

Conventional Commits, em português, no imperativo:

```
feat(agenda): reoferta automática quando o cliente cancela
fix(menu): popover deixa de cobrir o gatilho a 768 px
chore(ci): cache do Playwright entre execuções
```

## Antes de abrir o PR

```bash
npm run verify      # formato, lint, regras de UI, tipos e testes
npm run test:e2e    # cinco viewports
```

## Definição de pronto

Um PR só fecha quando tudo isto é verdade.

**Ambas as trilhas**

1. Os cinco setores escritos na história — inclusive o 5
2. Teste do caminho feliz **e** do caminho de erro
3. Erro com **ação sugerida**, nos três textos de `i18n`

**Back-end**

4. Nenhuma tabela nova sem RLS
5. Nenhuma query fora de `withTenant()`
6. Nenhuma escrita fora de caso de uso — inclusive as do agente
7. Evento emitido, com versão do agregado
8. Migration compatível para trás, com `down`

**Front-end e UX/UI**

9. Quatro estados da tela: vazio, carregando, erro, conteúdo
10. `layout.spec.ts` verde nos cinco viewports
11. Nenhum z-index fora da escala de `z-index.css`
12. Nenhuma string literal em componente

Os itens 4, 10, 11 e 12 são verificados pelo CI. Os outros são revisão — e
"não foi possível concluir" continua sendo motivo de recusa.
