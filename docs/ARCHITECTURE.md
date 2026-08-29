# Arquitetura

> Fonte: _Kairo em Camadas_ — documento 4 de 4. Este arquivo é a versão
> operacional dele: o que está aqui existe no código.

## A linguagem, e por quê

TypeScript em modo `strict`, no servidor e no cliente, sobre Node 22 LTS.

O produto não tem trabalho de CPU: ele lê e escreve no Postgres, conversa com
duas APIs e renderiza telas. Nesse perfil o gargalo é a **quantidade de código
escrito por pessoa por semana** — e escrever back e front na mesma linguagem,
com o mesmo schema, é o maior multiplicador disponível.

Onde TypeScript é fraco: processo longo e estável não vive bem em função
serverless. Por isso o worker é um **segundo runtime** — um processo Node comum
numa VPS, com `/healthz` próprio (`src/workers/`).

## Árvore

```
src/
├── app/                              # ROTAS — só composição, zero regra
│   ├── (app)/layout.tsx              # a casca (AppShell)
│   ├── (app)/{hoje,agenda,clientes,conversas,servicos,financeiro,automacoes,conta}/
│   ├── p/[slug]/                     # página pública, sem login
│   ├── api/webhooks/canal/           # só valida assinatura, grava cru e enfileira
│   └── api/healthz/
│
├── modules/                          # UMA PASTA POR FUNCIONALIDADE
│   └── agenda/
│       ├── domain/disponibilidade.ts   # função pura — a peça mais difícil
│       ├── domain/{transicoes,jornada}.ts
│       ├── application/criar-agendamento.ts
│       ├── infra/agendamento.repo.ts
│       ├── ui/{AgendaDia,SlotChip,SheetNovoAgendamento,AcoesDaAgenda}.tsx
│       ├── actions.ts                # fronteira: autentica, autoriza, valida
│       ├── schemas.ts                # Zod — o contrato com o front
│       └── index.ts                  # ÚNICA porta de saída do módulo
│
├── shared/                           # INFRA — não conhece negócio
│   ├── db/{client,tx,eventos,schema/}      # withTenant()
│   ├── fila/{boss,jobs}.ts                 # pg-boss, com a guarda do pooler
│   ├── tenancy/{sessao,ator}.ts
│   ├── config/{brand,env}.ts               # o nome da marca vive aqui
│   ├── i18n/pt-BR.ts                       # TODO texto de interface
│   ├── erros/{resultado,dominio,app-error}.ts
│   └── ui/
│       ├── tokens/{tokens,type,z-index}.css   # antes de qualquer componente
│       ├── layout/{AppShell,Page,Stack,Cluster,Grid}.tsx
│       ├── nav/{BottomNav,SideNav,NavItem,MenuSuspenso}.tsx
│       ├── overlay/{Portal,Scrim,Sheet,Toast}.tsx
│       ├── data/{Skeleton,EmptyState,List}.tsx
│       ├── feedback/{Banner,StatusBadge,ErrorState,OfflineBanner}.tsx
│       ├── form/{Field,Input,Chip}.tsx
│       └── primitives/{Button,Card,Divider,Logo}.tsx
│
└── workers/                          # SEGUNDO RUNTIME
    └── {index,heartbeat}.ts · handlers/
```

**A regra que evita a pasta-lixo:** um componente só entra em `shared/ui`
quando é usado por **dois módulos diferentes**. Até lá, mora no módulo onde
nasceu.

## O padrão de caso de uso

Todo caso de uso tem a mesma forma. Quem aprende um, escreveu todos.

1. **Carrega** o que a decisão precisa — nada além disso
2. **Decide** com função pura — testável sem banco
3. **Persiste** — a constraint do banco é a última garantia
4. **Registra o evento** na mesma transação — sem escrita sem trilha
5. **Agenda as réguas** pela mesma transação

Regras duras:

- Devolve `Resultado`, **nunca lança** para erro esperado.
- Erro de negócio carrega **o que fazer a seguir**. "Não foi possível concluir"
  não é mensagem; é desistência — e é recusado na revisão.
- Recebe `tx`, nunca abre a própria conexão.

Referência viva: [`criar-agendamento.ts`](../src/modules/agenda/application/criar-agendamento.ts).

## As quatro portas de escrita

| Porta             | Identidade              | Regra dura                                                                                   |
| ----------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| **Server Action** | Sessão → `withTenant()` | Autentica, autoriza, valida, chama, traduz erro. Zero regra de negócio                       |
| **Rota pública**  | Anônima                 | Função `security definer` de escopo mínimo — devolve só horário livre, nunca nome de cliente |
| **Webhook**       | Nenhuma                 | Valida assinatura, grava cru, enfileira. Nada mais                                           |
| **Job**           | `withSystemTenant()`    | Revalida automação, consentimento, canal, janela de silêncio e limite antes de agir          |

## O schema, com as seis tabelas que faltavam

`jornada_trabalho`, `bloqueio`, `servico_recurso`, `local`, `automacao` e
`webhook_recebido` estavam sendo usadas e nunca criadas. Sem elas a função de
disponibilidade não tem de onde ler o expediente, e a Sprint 1 trava no
terceiro dia. Todas entram na primeira migration.

`webhook_recebido` é a única sem `tenant_id`: o roteamento por número acontece
depois, no worker — a rota só valida a assinatura, grava cru e enfileira.

## Isolamento entre clientes

`withTenant()` abre a transação e fixa `app.tenant_id` nela. As políticas de RLS
(`drizzle/rls.sql`) leem esse valor. Consulta fora de `withTenant()` não enxerga
linha nenhuma — o isolamento não depende de alguém lembrar do `where`.

Query fora de `withTenant()` **falha**, em vez de devolver zero linhas em
silêncio: `app_tenant_id()` levanta exceção quando a variável de sessão está
vazia. Silêncio parece funcionamento normal e vira bug de produção meses
depois; exceção aparece no primeiro teste.

Os testes rodam como `kairo_app`, um papel **NOSUPERUSER e NOBYPASSRLS** —
rodar como dono do banco esconde exatamente a falha que eles existem para
pegar. Ver [`isolamento.integration.test.ts`](../src/shared/db/isolamento.integration.test.ts).

O CI reprova qualquer tabela de negócio sem `rowsecurity`.

### As três armadilhas conhecidas

1. A política de RLS de `membro` **não pode** usar uma função que lê `membro`:
   recursão infinita que só aparece em produção. Toda política compara direto
   com `app_tenant_id()`, que lê apenas uma variável de sessão.
2. O pg-boss atrás de um pooler em **modo transação** para de funcionar sem
   erro. `conferirUrlDaFila()` derruba o worker no boot se a URL estiver
   errada.
3. Toda função com cache recebe o `tenantId` como argumento **explícito**. Um
   `tenantId` implícito serve o catálogo de um cliente para outro.

## Web e app: um código só

O app é o mesmo web app instalado como PWA. Não há React Native no MVP, e a
razão é econômica antes de técnica: um app nativo dobra a superfície de
manutenção e adiciona duas lojas ao caminho de release.

|            | Android / Chrome           | iOS / Safari                                                 |
| ---------- | -------------------------- | ------------------------------------------------------------ |
| Instalação | Prompt nativo no 3º acesso | **Não existe prompt** — tela própria com instrução ilustrada |
| Push       | Funciona                   | Só depois de instalado na tela de início                     |
| Solução    | —                          | **E-mail é o canal garantido** em todo escalonamento         |

## As duas trilhas nas quatro sprints

| Sprint         | Back-end                                                                                   | Front-end e UX/UI                                                                         | O encontro                                                                 |
| -------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1 · dias 1–10  | `withTenant()` e RLS · schema · event store · **disponibilidade** · casos de uso da agenda | Tokens e camadas · casca · primitivos · Novo agendamento · Hoje · Agenda · página pública | Schemas Zod entregues no **dia 2**; o front constrói contra actions falsas |
| 2 · dias 11–25 | Canal oficial · webhook idempotente · roteador · transcrição · agente · réguas e reoferta  | Conversas · copiloto · tela de canal · autonomia · `layout.spec.ts` no CI                 | O contrato da conversa é desenhado **antes** do agente existir             |
| 3 · dias 26–40 | Fichas dinâmicas · consentimento · sinal via Pix · caixa · exportação                      | Renderizador de ficha · Financeiro · Automações · humanização                             | Um renderizador só para os três schemas de vertical                        |
| 4 · dias 41–60 | Assinatura · billing · runbooks · restauração testada                                      | Conta · onboarding · PWA · push com fallback por e-mail · status                          | Cancelamento em 2 cliques testado ponta a ponta                            |
