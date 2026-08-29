# ADR‑001 · O cliente final passa a ter conta

|               |                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------- |
| **Data**      | 29 de agosto de 2026                                                                            |
| **Estado**    | Aceita — decisão do dono do produto                                                             |
| **Substitui** | `01-apresentacao-e-matriz.md` §3 (P2) e §4.1 (M4), na parte que diz que o cliente não tem conta |

## O que muda

Até aqui, o cliente final **não tinha conta**: marcava por link no navegador ou
pelo WhatsApp, e o PWA era só do profissional. A partir de agora ele **entra com
credenciais próprias** e tem um app onde vê seus horários, entra na fila de
espera, faz check‑in e responde a avaliação.

## O que o documento dizia, e por que dizia

> **P2 — o cliente final.** Não paga, não tem conta, e não precisa saber que
> existe um sistema.

> **M4 — Obrigar o cliente a baixar app.** Booksy, AppBarber, Trinks. Nossa
> solução: link no navegador + WhatsApp. PWA **só para o profissional**.

O raciocínio era: cada passo entre "quero marcar" e "marcado" derruba conversão,
e criar conta é o passo mais caro de todos. Três decisões, no máximo.

## Por que muda mesmo assim

O produto passa a oferecer coisas que **não existem sem identidade persistente**:

| Recurso                                         | Por que exige conta                                         |
| ----------------------------------------------- | ----------------------------------------------------------- |
| Fila de espera                                  | O sistema precisa saber a quem oferecer a vaga, dias depois |
| Check‑in                                        | Precisa ligar quem chegou ao horário marcado                |
| Desfazer o horário antigo ao ser puxado da fila | Precisa saber que os dois agendamentos são da mesma pessoa  |
| Avaliação por atendimento                       | Precisa amarrar resposta a atendimento                      |

Sem conta, cada um desses vira "informe seu telefone de novo" — que é pior que
a conta.

## O que **não** muda

1. **O link público continua existindo e continua sem login.** Quem só quer
   marcar um horário marca em três decisões, como antes. A conta é o caminho de
   quem volta, não o pedágio de quem chega.
2. **Continua sem app de loja.** É o mesmo PWA.
3. **O cliente continua sendo o titular dos dados**, com exclusão pedida por ele
   mesmo, sem passar pelo profissional.

## O risco que a decisão cria, e como ele é contido

Um cliente com sessão passa a existir **dentro** do tenant. A política de RLS de
hoje é `tenant_id = app_tenant_id()` — se ela valesse para o cliente, ele leria
a agenda inteira, a ficha das outras pessoas e o caixa do profissional.

**Contenção:** a sessão passa a carregar um papel, e as políticas passam a
distinguir:

```sql
-- quem é do estúdio vê o tenant inteiro
tenant_id = app_tenant_id()
  and (app_papel() <> 'cliente' or cliente_id = app_cliente_id())
```

O cliente lê `servico`, `recurso` e `jornada_trabalho` (precisa deles para
escolher) e **só as próprias linhas** de `agendamento`, `fila_espera`,
`avaliacao` e `cliente`. Nada de ficha, nada de caixa, nada de conversa.

Isso é verificado por teste de integração: _"o cliente A não vê o agendamento do
cliente B do mesmo tenant"_ entra na mesma suíte que já prova o isolamento entre
tenants.

## Consequência que aceitamos

A superfície de autenticação dobra: agora existem dois tipos de sessão, e todo
caso de uso precisa saber por qual porta entrou. É custo real de manutenção — e
é o preço da fila de espera, que é a razão da mudança.

## Como saber se foi a decisão certa

O número a acompanhar é **a taxa de marcação pelo link público**, que não exige
conta. Se ela cair depois que o app do cliente entrar no ar, a conta virou
pedágio e a decisão precisa ser revista.
