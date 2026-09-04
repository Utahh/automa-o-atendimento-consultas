# Canal do WhatsApp — sub-projeto 1

> Fatia 1 de 4 do MVP. Data: 2026-09-04.
> Sequência acordada: **1 canal → 2 réguas automáticas → 3 agente de IA → 4 entrada das duas telas.**

O miolo do produto já existe e está testado: disponibilidade, fila de espera,
promoção automática no cancelamento, e as duas telas. O que falta é a voz. Esta
fatia constrói a voz — e nada além dela.

## O que esta fatia entrega

Uma mensagem chega da Cloud API, atravessa o sistema inteiro e volta como
resposta. Nenhuma regra de negócio no caminho: o objetivo é provar o circuito e
deixar de pé as duas peças que o sub-projeto 2 vai usar — o gateway de envio e o
leitor de payload.

**Dentro:** correção da rota do webhook, leitura do payload (texto e resposta de
botão), gateway da Graph API, caso de uso, handler no worker, simulador de
webhook assinado, eco atrás de trava.

**Fora:** tabelas `conversa` e `mensagem`, vínculo número→tenant, roteador,
agente de IA, a tela `/conversas`, envio de template, teto diário de
agendamentos, sinal contra falta, rodízio entre profissionais.

## Decisões, e por quê

| #   | Decisão                                                                            | Motivo                                                                                                                                         | Alternativa recusada                                                                        |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | A **rota publica** o job `canal.webhook`                                           | Usa o `JOBS.processarWebhook` que já existe, ganha retry e backoff do pg-boss, e a latência é imediata. É o que o `ARCHITECTURE.md` já promete | Varredura da tabela pelo worker: até N segundos de atraso e uma consulta constante no banco |
| 2   | Assinatura e payload em `shared/canal/`; gateway e caso de uso em `modules/canal/` | Assinatura e schema são infra genuína, sem negócio. Gateway é "API externa", que a tabela de camadas põe em `infra/` do módulo                 | Tudo em `shared/`: o caso de uso não teria onde morar quando ganhar regra                   |
| 3   | Simulador é **um construtor, dois consumidores**                                   | O teste roda no CI e prova a regressão; o script prova a pilha HTTP real do Next. A assinatura é escrita uma vez                               | Só o teste: nunca exercita corpo cru nem cabeçalho reais                                    |
| 4   | O eco fica atrás de `CANAL_ECO_ATIVO`, desligado por padrão                        | É comportamento descartável, substituído pelo roteador no sub-projeto 3. Sem a trava, um cliente real na VPS recebe "eco"                      | Ecoar sempre que houver token: erro de operação vira mensagem para cliente pagante          |
| 5   | Sem `CANAL_TOKEN`, o gateway **loga em vez de enviar**                             | Mesmo padrão de `shared/notificacao/entregar-codigo.ts`. O circuito inteiro roda sem conta na Meta e sem centavo                               | Exigir credencial: trava o desenvolvimento e o CI atrás de terceiro                         |

## As três correções na rota

A rota `app/api/webhooks/canal/route.ts` existe e está errada em três pontos.

### (a) A idempotência não funciona

Hoje a chave é `corpo['id']`. O payload da Cloud API não tem `id` no topo — tem
`object` e `entry`. A expressão cai sempre no fallback `randomUUID()`, e o
`onConflictDoNothing` nunca conflita. A Meta reenvia webhook quando não recebe
200 rápido: hoje a mesma mensagem entraria duas vezes e seria respondida duas
vezes.

`chaveDe(payload, bruto)` passa a devolver:

1. o `wamid` da primeira mensagem, quando o payload traz mensagens — pega a mesma
   mensagem chegando em entregas diferentes;
2. o `sha256` do corpo cru, caso contrário — cobre `statuses` e qualquer tipo de
   evento ainda não modelado.

A rota **nunca rejeita por formato**. A Meta manda eventos que não conhecemos, e
um 4xx faria ela reenviar para sempre.

### (b) O job não é publicado

O `insert` ganha `.returning({ id })`. Array vazio significa duplicata: nesse caso
a rota relê a linha e só publica se `processado_em` ainda for nulo. Isso fecha o
buraco da decisão 1 — se o publish falhar depois do insert, o reenvio da Meta
republica em vez de deixar a mensagem órfã. Sem varredura, sem segundo caminho.

### (c) O comentário mente

A linha 46 promete o oposto do que o `ARCHITECTURE.md` promete (_"só valida
assinatura, grava cru e enfileira"_). O comentário é o que está errado.

## O circuito

```
scripts/simular-webhook.ts ──POST assinado──┐
                                            │
Meta Cloud API ────────────POST assinado────┤
                                            ▼
                              /api/webhooks/canal            app/
                                  1. confere assinatura → 401 se falhar
                                  2. grava cru, chave = wamid
                                  3. publica canal.webhook { webhookId }
                                            ▼
                                   pg-boss, schema fila
                                            ▼
                             workers/handlers/canal.ts       workers/
                                  lê a linha, extrai as mensagens
                                            ▼
                          processarMensagem()                modules/canal/
                                  decide o texto — fixo, nesta fatia
                                            ▼
                          canalGateway.enviarTexto()         modules/canal/infra/
                                  POST graph.facebook.com  ·  ou log
                                            ▼
                                   marca processado_em
```

## Arquivos

| Arquivo                                               | Papel                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/shared/canal/assinatura.ts`                      | `assinar()` e `conferir()`. Uma implementação, dois usuários: a rota confere, o simulador assina |
| `src/shared/canal/payload.ts`                         | Schema Zod do webhook · `mensagensDo()` · `chaveDe()`                                            |
| `src/shared/canal/index.ts`                           | Porta de saída                                                                                   |
| `src/modules/canal/infra/canal.gateway.ts`            | Cliente da Graph API                                                                             |
| `src/modules/canal/application/processar-mensagem.ts` | Caso de uso. Devolve `Resultado`, não lança                                                      |
| `src/modules/canal/index.ts`                          | Única porta de saída do módulo                                                                   |
| `src/workers/handlers/canal.ts`                       | Handler do job. Molde: `handlers/lembrete.ts`                                                    |
| `src/app/api/webhooks/canal/route.ts`                 | **alterado** — as três correções                                                                 |
| `scripts/simular-webhook.ts`                          | Roda com `tsx`; importa `assinar()` por caminho relativo                                         |

`scripts/` está fora do `boundaries/include` (`src/**`), então importar de `src/`
ali não fere a regra das camadas — e continua sendo checado, porque o `tsconfig`
inclui `**/*.ts`.

## Os contratos

O payload lê **texto e resposta de botão desde já**. Quando o cliente toca num
botão de template, a resposta volta como `type: "interactive"` com um
`button_reply`, e não como `type: "text"`. Um leitor cego para isso ficaria cego
justamente para a resposta que o sub-projeto 2 precisa ouvir — e a fatia teria de
ser reaberta e retestada.

```ts
type MensagemRecebida =
  | { tipo: 'texto'; wamid: string; de: string; texto: string; em: Date }
  | { tipo: 'botao'; wamid: string; de: string; id: string; titulo: string; em: Date };
```

O gateway nasce com **os três formatos declarados no tipo** e só o primeiro
implementado. Os outros dois lançam "não implementado", nomeando o sub-projeto 2.
A forma certa fica registrada no código sem construir o que ainda não tem template
aprovado para usar.

```ts
type CanalGateway = {
  enviarTexto(p: { para: string; texto: string }): Promise<void>;
  enviarTemplate(p: { para: string; nome: string; parametros: string[] }): Promise<never>;
  enviarTemplateComBotoes(p: { para: string; nome: string; parametros: string[] }): Promise<never>;
};
```

O eco responde ao `de` **literal** que a Meta mandou. Com isso o problema do nono
dígito em números brasileiros não existe nesta fatia — ele vai existir quando
alguém procurar um cliente pelo telefone.

O texto do eco é fixo e sem promessa: `Recebido. Este canal ainda está em teste.`
Ele existe para provar entrega, não para atender ninguém — e some no sub-projeto 3.

A versão da Graph API (`v23.0`) é constante no gateway, não variável de ambiente:
mudá-la é decisão de código, com teste junto.

## Erros

| Situação                              | Resposta                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Assinatura ausente ou inválida        | 401, nada gravado                                                                             |
| Payload de forma desconhecida         | Grava assim mesmo, 200. Interpretar é trabalho do worker                                      |
| Webhook de `statuses`, sem `messages` | Handler marca `processado_em` e sai                                                           |
| `CANAL_TOKEN` ausente                 | Gateway loga em vez de enviar                                                                 |
| `CANAL_ECO_ATIVO` diferente de `true` | `processarMensagem` devolve `ok('ignorado')`                                                  |
| Graph API responde não-2xx            | Lança. O pg-boss reagenda (`retryLimit: 5`, backoff). `processado_em` só é marcado no sucesso |

Erro de negócio devolve `Resultado`, nunca lança — a regra do `ARCHITECTURE.md`
vale aqui como em todo caso de uso.

## Configuração

Duas variáveis novas, ambas opcionais, em `shared/config/env.ts` e `.env.example`:

| Variável                | Para quê                                                      |
| ----------------------- | ------------------------------------------------------------- |
| `CANAL_PHONE_NUMBER_ID` | Identificador do número remetente na Graph API                |
| `CANAL_ECO_ATIVO`       | `true` liga o eco. Ausente ou qualquer outro valor: desligado |

## O que os testes provam

| Teste                                                  | Onde roda      | Prova                                                                                                                                            |
| ------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/canal/assinatura.test.ts`                      | job de unidade | Assina e confere ida e volta; recusa corpo adulterado, cabeçalho ausente e comprimento diferente                                                 |
| `shared/canal/payload.test.ts`                         | job de unidade | Lê mensagem de texto e resposta de botão; ignora `statuses`; lê `entry` com duas mensagens; `chaveDe()` estável no mesmo corpo                   |
| `modules/canal/infra/canal.gateway.test.ts`            | job de unidade | `fetch` dublado: URL, `Bearer`, corpo `messaging_product`. Sem token, loga e não toca a rede                                                     |
| `modules/canal/application/processar-mensagem.test.ts` | job de unidade | Gateway falso: responde ao `de`; devolve `ok('ignorado')` com o eco desligado                                                                    |
| `app/api/webhooks/canal/route.integration.test.ts`     | job `banco`    | O mesmo corpo duas vezes gera **uma** linha. Segue o `describe.skipIf(DATABASE_URL === undefined)` de `shared/db/isolamento.integration.test.ts` |

## Ambiente de teste, sem custo

O número de teste da Meta dá **mensagens ilimitadas e gratuitas de e para até 5
números verificados**, sem verificação de negócio e sem cartão. O destinatário do
piloto é o **(11) 98585-1395**. O webhook precisa de URL pública com HTTPS:
`cloudflared` é gratuito e, com domínio próprio, mantém a URL fixa — o ngrok
gratuito troca a URL a cada reinício e obriga a recadastrar.

Gateway não oficial está descartado por decisão de produto, não por preferência: o
`PRODUCT.md` diz que não se liga canal não oficial "só por enquanto", e um número
banido é o produto parado.

## O que o sub-projeto 2 herda, e o que ele ainda precisa

Herda o gateway, o leitor de payload e o handler. Precisa de três coisas que esta
fatia deliberadamente não faz:

1. **`enviarTemplate` e `enviarTemplateComBotoes` implementados.** Fora da janela
   de 24 h só passa template aprovado. O lembrete de 15 minutos quase sempre cai
   fora dela — o cliente marcou há três dias e não escreveu desde então.
2. **Três templates aprovados pela Meta**, todos com botão, porque mensagem que só
   se lê devolve o trabalho para o profissional:
   - **Lembrete** → _Confirmo_ · _Preciso remarcar_
   - **Vaga liberada** (oferta da fila, validade de 10 min) → _Quero esse horário_ · _Não posso_
   - **Cancelamento confirmado** → _Marcar outro_
3. **O agendamento dos jobs.** `handlers/lembrete.ts` hoje é esqueleto, e ninguém
   publica `agendamento.lembrete`.

A aprovação de template leva de horas a dias e pode ser recusada por texto que soe
promocional. Submeter **em paralelo** a esta fatia, não depois: caso contrário o
sub-projeto 2 fica pronto e mudo.

Nota de custo: dentro da janela de 24 h, mensagem livre e template de utilidade
são gratuitos. Fora dela, o template de utilidade custa a faixa de R$ 0,04 a 0,05
anotada no `.env.example`. Vale desenhar as réguas de olho nisso — com a conversa
aberta, o mesmo lembrete sai de graça.
