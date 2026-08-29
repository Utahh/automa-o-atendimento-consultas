# Deploy e custo

> Fonte: `03-estrutura-e-custo.md`. O princípio é um só — **custo em degraus,
> nunca em linha**, e nenhum degrau é subido antes do gatilho numérico.

## Onde as coisas rodam

| Camada               | Ferramenta                     | Grátis até                           | Por que não outra coisa                                                                                                                                    |
| -------------------- | ------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web + worker         | **Coolify na VPS** (US$ 5/mês) | —                                    | O plano Hobby da Vercel **proíbe uso comercial**: conta pausada no meio do piloto, com cliente pagando, não é um risco que se corre para economizar US$ 20 |
| Banco, auth, storage | Supabase                       | 500 MB · 5 GB egress · 1 GB arquivos | Postgres na própria VPS se apertar — mas aí o backup é seu                                                                                                 |
| Fila e cron          | **pg-boss**                    | Sempre                               | Roda dentro do Postgres que já existe. Grátis **por arquitetura**, não por promoção                                                                        |
| CDN, DNS, SSL, WAF   | Cloudflare Free                | Sempre, nesta escala                 | —                                                                                                                                                          |
| Imagens              | GHCR                           | Repositório público → pacote público | —                                                                                                                                                          |
| CI                   | GitHub Actions                 | Ilimitado em repositório público     | —                                                                                                                                                          |
| E-mail               | Resend                         | 3.000/mês, 100/dia                   | Brevo, com limite diário maior                                                                                                                             |
| Erros                | Sentry Developer               | 5 mil erros/mês                      | GlitchTip na mesma VPS                                                                                                                                     |

**Para chegar ao primeiro cliente pagante, a única conta que existe é a VPS.**
É isso que faz o produto sobreviver parado: um SaaS que custa US$ 5/mês para
ficar de pé pode errar o timing de mercado e tentar de novo.

## Branches e ambientes

| Branch            | Ambiente    | Como chega lá                                             |
| ----------------- | ----------- | --------------------------------------------------------- |
| `feat/*`, `fix/*` | nenhum      | CI completo no PR: lint, camadas, RLS, layout e orçamento |
| `develop`         | Homologação | CI verde → `deploy.yml` publica sozinho                   |
| `main`            | Produção    | CI verde → `deploy.yml` publica sozinho                   |

Ninguém commita direto em `main`. O caminho é `feat/x` → PR para `develop` →
PR para `main`.

**Deploy não roda sem CI verde.** O `deploy.yml` é disparado por `workflow_run`
do CI e só continua quando a conclusão foi `success` — ele publica exatamente o
SHA que passou, não o topo da branch.

## A ordem das coisas

```
CI verde
   │
   ├─▶ 1. migrar    migrations + reaplicação do rls.sql
   │               (compatível para trás: existe uma janela em que o schema
   │                novo convive com o código antigo)
   │
   ├─▶ 2. imagens   web e worker → GHCR, com o SHA na tag
   │
   ├─▶ 3. vps       Coolify puxa as imagens (ou docker compose por SSH)
   │
   └─▶ 4. sonda     /api/healthz externo confirma que subiu
```

## Segredos

Em **Settings › Secrets and variables › Actions**, por ambiente (`producao`,
`homologacao`):

| Segredo                                           | Para quê                        |
| ------------------------------------------------- | ------------------------------- |
| `DATABASE_URL`                                    | Migrations e RLS                |
| `COOLIFY_WEBHOOK_URL`, `COOLIFY_TOKEN`            | Disparar o deploy no painel     |
| `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PATH` | Alternativa por SSH, sem painel |
| `APP_URL`                                         | Sonda pública depois do deploy  |

Sem os segredos, os workflows **não falham**: avisam e pulam o passo. Dá para
clonar o repositório e ter o CI verde sem nenhuma conta configurada.

Recomendado: marcar o ambiente `producao` com **required reviewers**.

## Preparar a VPS

```bash
sudo useradd -m -G docker deploy
sudo mkdir -p /opt/kairo && sudo chown deploy: /opt/kairo
# copie infra/docker-compose.yml para /opt/kairo e crie o .env
docker compose up -d
```

O Cloudflare fica na frente; web e worker escutam só em `127.0.0.1`. O estado
vive todo no Postgres, não no servidor: se a máquina cair, recriar é um
`docker compose up -d`.

## Os seis degraus

| Degrau              | Clientes  | Fixo/mês     | O gatilho que autoriza subir                                                            |
| ------------------- | --------- | ------------ | --------------------------------------------------------------------------------------- |
| 0 · Desenvolvimento | 0         | **US$ 0**    | —                                                                                       |
| 1 · Piloto          | 1–20      | **US$ 5**    | Banco > 400 MB **ou** egress > 4 GB/mês                                                 |
| 2 · Tração          | 21–100    | **US$ 30**   | 30º cliente pagante                                                                     |
| 3 · Operação        | 101–300   | **US$ 156**  | PITR: enquanto o `pg_dump` diário para o R2 estiver rodando **e testado**, pode esperar |
| 4 · Escala          | 301–800   | **US$ 242**  | Fila com > 100 jobs parados de forma recorrente, ou p95 do banco > 500 ms               |
| 5 · Empresa         | 801–2.000 | **~US$ 390** | Uma queda do worker já ter custado atendimento                                          |
| 6 · Além            | 2.000+    | reavaliar    | A conversa muda de "como não pagar" para "como não depender"                            |

**Nenhuma conta nova sem gatilho numérico escrito.** "Vai que precisa" não é
gatilho.

## As alavancas de custo variável

| Alavanca              | Peso | Teto duro                                                                                                   |
| --------------------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| Mensagens de WhatsApp | ~53% | 1 mensagem automática/dia e 4/semana por cliente final                                                      |
| IA                    | ~41% | Teto de gasto diário **por tenant** e teto global; ao estourar, o agente desliga e a profissional é avisada |
| Transcrição de áudio  | ~6%  | Corte em 2 min, resultado guardado, nunca transcrito duas vezes                                             |

> A alavanca que ninguém vê é o **roteador determinístico**. Ele é a diferença
> entre R$ 8 e R$ 20 por cliente/mês em IA, e não é um recurso do produto — é
> uma cadeia de `if`. É o código mais barato e mais lucrativo do sistema.

## Voltar atrás

O deploy é por SHA, então voltar é publicar o SHA anterior:

- **Imagens:** `IMAGEM_WEB=…/web:<sha-anterior> docker compose up -d`
- **Banco:** toda migration tem `down`. Reverter schema é o último recurso — a
  compatibilidade para trás existe para evitá-lo.

## Contingência

| Se acontecer              | Resposta                                                                                                | Custo                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Supabase muda o free tier | Subir para Pro (já orçado) ou migrar o Postgres para a própria VPS                                      | US$ 25 ou 1 dia                  |
| Custo de IA dispara       | O teto por tenant já conteve; investigar o tenant, e se for geral trocar de modelo (o adaptador existe) | horas                            |
| VPS cai                   | Recriar do `docker compose` — o estado está todo no Postgres                                            | minutos                          |
| Banco corrompe            | Restaurar do último `pg_dump`/PITR, **procedimento já testado**                                         | RPO de 24 h sem PITR, ~5 min com |
| Receita não vem           | O custo fixo é **US$ 5**. Dá para segurar o produto no ar por meses                                     | US$ 5/mês                        |

Backup diário não é backup até ser restaurado. A restauração testada num banco
descartável, com `npm test` rodando contra ele, é o único critério que faz o
backup contar como pronto.
