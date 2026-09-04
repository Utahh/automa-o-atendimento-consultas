# Plano — canal do WhatsApp

> Executa a spec [2026-09-04-canal-whatsapp-design.md](../specs/2026-09-04-canal-whatsapp-design.md).
> Branch: `feat/canal-whatsapp` → PR para `develop` → PR para `main`.

Onze passos, em ordem de dependência. Cada passo termina com o repositório
verde: nenhum passo deixa a build quebrada para o seguinte consertar.

O ciclo em cada passo com lógica é **teste primeiro**. Os testes de assinatura,
payload e gateway definem o contrato antes de existir implementação — é o que o
`CONTRIBUTING.md` chama de definição de pronto.

## 1 · Configuração

`shared/config/env.ts` · `.env.example`

Duas variáveis opcionais: `CANAL_PHONE_NUMBER_ID` e `CANAL_ECO_ATIVO`. No
`.env.example` vão no bloco do canal que já existe, com o comentário dizendo que
sem elas o circuito roda pelo log.

**Verificação:** `npm run typecheck`.

## 2 · Assinatura

`shared/canal/assinatura.test.ts` → `shared/canal/assinatura.ts`

`assinar(corpo, segredo)` devolve `sha256=<hex>`. `conferir(corpo, cabecalho,
segredo)` compara com `timingSafeEqual`, guardando o comprimento antes — a
comparação lança se os buffers tiverem tamanhos diferentes.

Testes: ida e volta; corpo adulterado por um caractere; cabeçalho `null`;
cabeçalho de comprimento diferente; segredo ausente.

**Verificação:** `npm test`.

## 3 · Payload

`shared/canal/payload.test.ts` → `shared/canal/payload.ts`

Schema Zod do envelope (`object` + `entry[].changes[].value`) e as duas formas de
mensagem, texto e `interactive.button_reply`, num union discriminado.

- `mensagensDo(payload)` devolve `readonly MensagemRecebida[]` — vazio para
  `statuses`.
- `chaveDe(payload, bruto)` devolve o `wamid` da primeira mensagem ou o `sha256`
  do corpo cru.

Testes: texto; resposta de botão; `statuses` sem `messages` devolve vazio;
`entry` com duas mensagens devolve duas; `chaveDe` estável no mesmo corpo e
diferente entre corpos diferentes; payload de forma desconhecida não lança.

**Verificação:** `npm test`.

## 4 · Porta de saída de `shared/canal`

`shared/canal/index.ts`. Reexporta o que os passos seguintes usam.

**Verificação:** `npm run lint` — a regra de camadas confere que `shared/` não
importa ninguém.

## 5 · Gateway

`modules/canal/infra/canal.gateway.test.ts` → `canal.gateway.ts`

`enviarTexto({ para, texto })` faz `POST` em
`https://graph.facebook.com/v23.0/<CANAL_PHONE_NUMBER_ID>/messages` com
`Authorization: Bearer`, corpo `{ messaging_product: 'whatsapp', to, type:
'text', text: { body } }`. Sem `CANAL_TOKEN`, loga e retorna sem tocar a rede.
Resposta não-2xx lança, com o status na mensagem.

`enviarTemplate` e `enviarTemplateComBotoes` existem no tipo e lançam
`'não implementado — sub-projeto 2'`.

Testes com `fetch` dublado: URL montada; cabeçalho; corpo; sem token não chama
`fetch`; 400 lança.

**Verificação:** `npm test`.

## 6 · Caso de uso

`modules/canal/application/processar-mensagem.test.ts` → `processar-mensagem.ts`

Recebe a mensagem e o gateway por parâmetro — sem `import` do gateway concreto,
para o teste injetar um falso. Com `CANAL_ECO_ATIVO` diferente de `true`, devolve
`ok('ignorado')` sem chamar o gateway. Ligado, responde ao `de` literal com o
texto fixo `Recebido. Este canal ainda está em teste.` e devolve `ok('respondido')`.

**Verificação:** `npm test`.

## 7 · Porta de saída de `modules/canal`

`modules/canal/index.ts`. Única saída do módulo, como manda o `ARCHITECTURE.md`.

**Verificação:** `npm run lint`.

## 8 · A rota

`app/api/webhooks/canal/route.ts` · `route.integration.test.ts`

As três correções da spec: `chaveDe()` no lugar de `corpo['id']`; `.returning()`
com releitura e publicação condicional do job; comentário corrigido. O `GET` do
`hub.challenge` não muda.

Teste de integração, com `describe.skipIf(DATABASE_URL === undefined)`: o mesmo
corpo duas vezes gera **uma** linha; assinatura inválida devolve 401 e não grava;
payload desconhecido grava e devolve 200.

**Verificação:** `npm test` com `DATABASE_URL` apontando para o Postgres local.

## 9 · Handler

`workers/handlers/canal.ts` · registrar em `workers/index.ts`

Lê a linha pelo `webhookId`, extrai as mensagens, chama o caso de uso para cada
uma, e marca `processado_em` **só depois** de todas terem saído. Falha no envio
deixa `processado_em` nulo e o pg-boss reagenda.

**Verificação:** `npm run typecheck` e `npm run lint`.

## 10 · Simulador

`scripts/simular-webhook.ts`

Monta um payload de mensagem de texto, assina com `CANAL_APP_SECRET` e faz `POST`
em `$APP_URL/api/webhooks/canal`. Aceita o texto por argumento. Importa o
`assinar()` por caminho relativo — `scripts/` está fora do `boundaries/include`.

**Verificação:** com `npm run dev` e `npm run dev:worker` de pé, o script imprime
200 e o log do worker mostra a resposta que sairia.

## 11 · Fechamento

`npm run verify` inteiro verde: formato, camadas, regras de UI, tipos e testes.
Depois, PR para `develop`.

## O que fica pendente do lado de fora

Nada neste plano depende da Meta. O que depende — número de teste, destinatário
verificado, túnel HTTPS e os três templates para aprovação — corre em paralelo e
só é exigido para ver a mensagem chegar de verdade no aparelho.
