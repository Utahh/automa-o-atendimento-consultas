# Deploy

Tudo o que está aqui roda em plano gratuito: GitHub Actions em repositório
público, Vercel Hobby para o web, GHCR para a imagem do worker, e uma VPS
qualquer para o processo longo.

## Branches e ambientes

| Branch            | Ambiente       | Como chega lá                               |
| ----------------- | -------------- | ------------------------------------------- |
| `feat/*`, `fix/*` | Preview por PR | `preview.yml` publica e comenta a URL no PR |
| `develop`         | Homologação    | CI verde → `deploy.yml` publica sozinho     |
| `main`            | Produção       | CI verde → `deploy.yml` publica sozinho     |

Ninguém commita direto em `main`. O caminho é sempre
`feat/x` → PR para `develop` → PR para `main`.

**Deploy não roda sem CI verde.** O `deploy.yml` é disparado por
`workflow_run` do CI e só continua quando a conclusão foi `success` — ele
publica exatamente o SHA que passou, não o topo da branch.

## A ordem das coisas

```
CI verde
   │
   ├─▶ 1. migrar   Migrations + reaplicação do RLS
   │              (migration compatível para trás: o código antigo
   │               continua funcionando enquanto o novo sobe)
   │
   ├─▶ 2. web      Vercel: pull → build → deploy → sonda /api/healthz
   │
   └─▶ 3. worker   GHCR: build da imagem → SSH no VPS →
                   docker compose up -d → sonda /healthz
```

Web e worker sobem em paralelo depois do banco. É por isso que **toda migration
precisa ser compatível para trás**: existe uma janela em que o schema novo
convive com o código antigo.

## Segredos

Configure em **Settings › Secrets and variables › Actions**, por ambiente
(`producao` e `homologacao`):

| Segredo             | Para quê                | Onde obter                                |
| ------------------- | ----------------------- | ----------------------------------------- |
| `VERCEL_TOKEN`      | Publicar o web          | Vercel › Account Settings › Tokens        |
| `VERCEL_ORG_ID`     | Identificar a conta     | `.vercel/project.json` após `vercel link` |
| `VERCEL_PROJECT_ID` | Identificar o projeto   | idem                                      |
| `DATABASE_URL`      | Migrations e RLS        | Provedor do Postgres                      |
| `VPS_HOST`          | Deploy do worker        | IP ou domínio da VPS                      |
| `VPS_USER`          | Usuário do SSH          | Usuário sem root, no grupo `docker`       |
| `VPS_SSH_KEY`       | Chave privada do deploy | `ssh-keygen -t ed25519 -C deploy-kairo`   |
| `VPS_PATH`          | Onde está o compose     | Ex.: `/opt/kairo`                         |

Sem os segredos, os workflows **não falham**: eles avisam e pulam o passo. Dá
para clonar o repositório e ter o CI verde sem nenhuma conta configurada.

Recomendado: marcar o ambiente `producao` com **required reviewers**, para que a
publicação em produção peça uma aprovação humana.

## Preparar a VPS

```bash
sudo useradd -m -G docker deploy
sudo mkdir -p /opt/kairo && sudo chown deploy: /opt/kairo
cd /opt/kairo
# copie infra/docker-compose.yml para cá, e crie o .env do worker
docker compose up -d
```

A imagem vem do GHCR (`ghcr.io/utahh/automa-o-atendimento-consultas/worker`).
Repositório público → pacote público → `docker pull` sem autenticação.

O worker sobe com `restart: on-failure:5`, limite de 512 MB, log rotacionado em
3 arquivos de 10 MB e healthcheck a cada 30 s. A porta 3001 escuta só em
`127.0.0.1`: a sonda é local, não pública.

## Voltar atrás

O deploy é por SHA, então voltar é publicar o SHA anterior:

- **Web:** `vercel rollback` ou promover o deploy anterior pelo painel.
- **Worker:** `IMAGEM_WORKER=ghcr.io/.../worker:<sha-anterior> docker compose up -d worker`.
- **Banco:** toda migration tem `down`. Reverter schema é o último recurso — a
  compatibilidade para trás existe justamente para evitá-lo.

## Restauração testada

Backup diário do Postgres não é backup até ser restaurado. A tarefa de restaurar
num banco descartável e rodar `npm test` contra ele está na Sprint 4 — e é
o único critério que faz o backup contar como pronto.
