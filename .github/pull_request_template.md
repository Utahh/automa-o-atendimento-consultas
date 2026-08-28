## O que muda

<!-- Uma frase. O que o profissional passa a conseguir fazer. -->

## Definição de pronto

Marque só o que foi realmente verificado.

**Ambas as trilhas**

- [ ] Os cinco setores escritos na história — inclusive o 5
- [ ] Teste do caminho feliz **e** do caminho de erro
- [ ] Erro com **ação sugerida**, nos três textos de `i18n`

**Back-end**

- [ ] Nenhuma tabela nova sem RLS
- [ ] Nenhuma query fora de `withTenant()`
- [ ] Nenhuma escrita fora de caso de uso — inclusive as do agente
- [ ] Evento emitido, com versão do agregado
- [ ] Migration compatível para trás, com `down`

**Front-end e UX/UI**

- [ ] Quatro estados da tela: vazio, carregando, erro, conteúdo
- [ ] `layout.spec.ts` verde nos cinco viewports
- [ ] Nenhum z-index fora da escala de `z-index.css`
- [ ] Nenhuma string literal em componente

## Como testar

<!-- Passo a passo curto. Se houver preview, cole a URL. -->
