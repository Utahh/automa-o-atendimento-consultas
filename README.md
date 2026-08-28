# Kairo

Agenda, atendimento e cobrança para quem vive de consulta.

**A automação é o produto; a agenda é o banco de dados que ela opera.**

Uma linguagem, três camadas, um contrato entre as trilhas. Tudo o que este
repositório promete é **verificável por lint ou por teste**, não por revisão de
gosto.

> ⚠️ `Kairo` é nome de trabalho, pendente de busca no INPI. Não usar em
> material de venda — ver [docs/BRAND.md](docs/BRAND.md).

[![CI](https://github.com/Utahh/automa-o-atendimento-consultas/actions/workflows/ci.yml/badge.svg)](https://github.com/Utahh/automa-o-atendimento-consultas/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Utahh/automa-o-atendimento-consultas/actions/workflows/codeql.yml/badge.svg)](https://github.com/Utahh/automa-o-atendimento-consultas/actions/workflows/codeql.yml)
[![Licença: proprietária](https://img.shields.io/badge/licen%C3%A7a-propriet%C3%A1ria-lightgrey)](LICENSE)

---

## Começar

```bash
git clone https://github.com/Utahh/automa-o-atendimento-consultas.git kairo
cd kairo
cp .env.example .env
npm install
docker compose -f infra/docker-compose.dev.yml up -d
npm run db:generate && npm run db:migrate
psql "$DATABASE_URL" -f drizzle/rls.sql
npm run db:seed
npm run dev
```

O worker é um segundo processo:

```bash
npm run dev:worker
```

## O contrato entre as duas trilhas

| #   | Regra                                                                                                                             | Consequência                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | **O contrato é o schema, não a conversa.** Todo dado que cruza a fronteira tem um schema Zod, e o tipo TypeScript é derivado dele | Nada é escrito duas vezes. Se o back muda o schema, o front quebra **na compilação** |
| 2   | **O front nunca fala com o banco. O back nunca escreve texto de interface.**                                                      | O back devolve um código; o texto vem de `src/shared/i18n/pt-BR.ts`                  |
| 3   | **A UI de um módulo mora no módulo**, ao lado do domínio que ela mostra                                                           | Uma funcionalidade inteira cabe num diretório                                        |

```
       FRONT                        FRONTEIRA                      BACK
  componente ──chama──▶  actions.ts ──valida (Zod)──▶  caso de uso ──▶ Postgres
       ▲                      │                              │
       └──── Resultado<T,E> ──┘                       evento (mesma transação)
                    │
        código do erro → i18n/pt-BR.ts → texto na tela
```

## As camadas

```
app/       rotas, layouts, telas          →  importa modules e shared
modules/   domínio + casos de uso + UI    →  importa shared; NUNCA app
shared/    infraestrutura e utilidades    →  não importa ninguém
workers/   segundo runtime                →  importa modules e shared
```

A dependência é sempre para baixo, e isso **não é combinado verbal**:
`eslint-plugin-boundaries` derruba a build quando alguém atravessa.

| Pasta do módulo | Pode conhecer                 | Nunca conhece      | Testado com                  |
| --------------- | ----------------------------- | ------------------ | ---------------------------- |
| `domain/`       | Nada além de tipos próprios   | Banco, HTTP, React | Unidade, sem mocks           |
| `application/`  | domain, repositórios, eventos | React, rota        | Integração com Postgres real |
| `infra/`        | Banco, APIs externas          | Regra de negócio   | Contrato                     |
| `ui/`           | Tipos do domínio, actions     | Banco, SQL         | E2E e visual                 |

## O que o CI verifica em todo PR

| Verificação     | Comando                           | O que quebra a build                                                        |
| --------------- | --------------------------------- | --------------------------------------------------------------------------- |
| Formato         | `npm run format:check`            | Prettier fora do padrão                                                     |
| Camadas e tipos | `npm run lint`                    | `modules/` importando `app/`, `domain/` importando banco                    |
| Regras de UI    | `npm run lint:ui`                 | z-index fora da escala, string literal em componente, `date-fns` no cliente |
| Tipos           | `npm run typecheck`               | Qualquer `any` implícito, índice sem checagem                               |
| Domínio         | `npm test`                        | Disponibilidade e transições                                                |
| RLS             | job `banco`                       | Tabela de negócio sem política                                              |
| Layout          | `npm run test:e2e`                | Estouro horizontal, texto sobreposto, alvo abaixo de 48 px                  |
| Orçamento       | `scripts/check-bundle-budget.mjs` | Página pública acima de 90 kB gz, área logada acima de 180 kB gz            |

## Comandos

| Comando               | O que faz                         |
| --------------------- | --------------------------------- |
| `npm run dev`         | Web em desenvolvimento            |
| `npm run dev:worker`  | Worker em desenvolvimento         |
| `npm run verify`      | Tudo o que o CI roda, menos e2e   |
| `npm run test:e2e`    | Playwright nos cinco viewports    |
| `npm run db:generate` | Gera migration a partir do schema |
| `npm run db:migrate`  | Aplica as migrations              |
| `npm run db:studio`   | Abre o Drizzle Studio             |

## Documentação

- [Produto](docs/PRODUCT.md) — os cinco setores, as personas, as 13 capacidades, a ordem de construção
- [Arquitetura](docs/ARCHITECTURE.md) — as camadas, o padrão de caso de uso, as quatro portas de escrita
- [Interface](docs/UI_RULES.md) — camadas de z-index, as dez regras contra texto sobreposto, menu suspenso
- [Marca](docs/BRAND.md) — o símbolo, a paleta, a voz, e o que ainda bloqueia o lançamento
- [Deploy e custo](docs/CLOUD_DEPLOYMENT.md) — a pilha gratuita, os seis degraus e os gatilhos
- [Contribuir](CONTRIBUTING.md) — a definição de pronto

## Licença

Proprietária. Ver [LICENSE](LICENSE). O repositório é público para avaliação
técnica; isso não o torna software livre.
