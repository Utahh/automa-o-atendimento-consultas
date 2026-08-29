# O produto

> Fonte: `01-apresentacao-e-matriz.md` e `02-prototipo-interface.md`.

## A frase

**Uma secretária de IA que atende no WhatsApp que o cliente já usa, e devolve
ao profissional o tempo que ele gasta administrando o próprio negócio entre um
atendimento e outro.**

Não é uma agenda com chatbot. **A automação é o produto; a agenda é o banco de
dados que ela opera.** Todos os concorrentes param no lembrete. O profissional
não entra no sistema para marcar horário — entra para ver o que já foi
resolvido sem ele.

**Métrica-mãe:** atendimentos confirmados sem intervenção humana, por
profissional, por semana. Se esse número sobe, o produto está funcionando.

## O método dos cinco setores

Toda funcionalidade só é considerada especificada quando as cinco perguntas têm
resposta escrita — e a ordem não é arbitrária: cada setor depende do anterior.

| #   | Setor         | A pergunta                                                        |
| --- | ------------- | ----------------------------------------------------------------- |
| 1   | **Persona**   | Quem está na cena, e o que essa pessoa sabe e quer neste segundo? |
| 2   | **Ação**      | O que ela faz, e o que o sistema faz em resposta?                 |
| 3   | **Resultado** | O que muda no mundo, e qual número prova?                         |
| 4   | **Tom**       | Como o produto fala neste momento — e o que ele nunca diz?        |
| 5   | **Suporte**   | O que acontece quando dá errado, e quem socorre?                  |

> **Regra de PR:** uma funcionalidade sem o setor 5 escrito não entra.
> "Suporte" não é o canal de atendimento — é o comportamento do produto no pior
> dia. É o setor que os concorrentes não escrevem, e é onde eles perdem cliente.

## Quem usa

- **P1 · a profissional (quem paga).** Esteticista, manicure ou barbeiro
  autônomo. Usa **em pé, com uma mão, entre atendimentos, às vezes com a mão
  úmida ou de luva, às vezes sob luz forte**, num Android de entrada. Não sabe
  (nem quer saber) o que é integração, API ou webhook.
- **P2 · o cliente final.** Não paga, não tem conta, não sabe que existe um
  sistema. É o **titular** dos dados e pode pedir exclusão diretamente, sem
  passar pela profissional.
- **P3 · o agente.** Um funcionário com escopo estreito e regras duras. Pode
  responder preço, horário e disponibilidade, agendar, remarcar, confirmar,
  reofertar. **Nunca** opina sobre procedimento, inventa preço, dá desconto,
  escreve direto no banco ou responde por cima de um humano.
- **P4 · o sistema.** 60% das decisões não passam por IA: template SIM/NÃO,
  palavras-chave, opt-out, janela de silêncio, limites, e a constraint do banco.
- **P5 · o suporte.** Uma pessoa, duas janelas por dia. **Suporte que não vira
  produto é suporte que volta amanhã.**

## As três regras que explicam quase todo o desenho

1. **Existe um único caminho de escrita.** Interface, link público, agente e job
   entram por portas diferentes e convergem no mesmo caso de uso. É isso que faz
   o agente ser seguro sem precisar ser esperto.
2. **O modelo conversa. O domínio decide. O banco garante.** Um horário marcado
   pelo agente passa exatamente pela mesma constraint que um marcado a dedo.
3. **Nenhuma falha vira silêncio.** Todo modo de falha tem uma frase escrita
   para o cliente final e um aviso para a profissional.

## As cinco leis da facilidade

1. **Três decisões, no máximo,** para qualquer coisa que o cliente final faça.
2. **O profissional nunca digita o que o sistema pode adivinhar** — recentes,
   mais usados, data já visível, telefone vindo do canal.
3. **Toda ação destrutiva tem desfazer; nenhuma tem diálogo de confirmação.**
4. **Nada essencial depende de hover, arrastar ou precisão.**
5. **Todo estado vazio ensina e oferece uma ação.** Sem tour, sem tooltip, sem
   modal de boas-vindas.

## As 13 capacidades

|     | Capacidade                        | O número que prova                                  |
| --- | --------------------------------- | --------------------------------------------------- |
| C1  | Onboarding do profissional        | Canal ativo em < 8 min; ativação ≥ 70% em 7 dias    |
| C2  | Conexão do WhatsApp (Coexistence) | ≥ 98% do tempo conectado                            |
| C3  | Agendar pelo link público         | < 1,5 s em 4G; < 90 kB de JS                        |
| C4  | Agendar pela conversa (agente)    | ≥ 60% dos agendamentos; 1ª resposta ≤ 4 s (p95)     |
| C5  | Agendar pelo profissional         | Mediana ≤ 30 s, nenhuma acima de 60 s               |
| C6  | Confirmar e evitar a falta        | Queda de no-show ≥ 30% sobre baseline **importado** |
| C7  | Reofertar o horário que vagou     | R$ recuperados; ≥ 25% de conversão                  |
| C8  | Chamar para o retorno             | "Clientes que voltaram sozinhos"                    |
| C9  | Ficha e consentimento             | Base legal registrada **por finalidade**            |
| C10 | Receber — sinal e caixa           | "Recebido este mês" bate com a soma                 |
| C11 | Assumir a conversa (handoff)      | Zero conversas com dois interlocutores              |
| C12 | Assinar e cancelar                | Cancelamento em **2 cliques**, sem retenção         |
| C13 | Exportar e excluir                | Exportação em todos os planos, inclusive no grátis  |

## O que estava errado no mercado, e o que fazemos

| Problema                           | Nossa resposta                                               |
| ---------------------------------- | ------------------------------------------------------------ |
| Não conseguir cancelar             | 2 cliques, sem multa, sem falar com humano                   |
| Preço "sob consulta"               | Preço público; o que varia é **quanta operação a IA assume** |
| Cobrança por profissional e por GB | Cota generosa. **Foto é insumo, não upsell**                 |
| Obrigar o cliente a baixar app     | Link no navegador + WhatsApp. PWA **só para o profissional** |
| Plataforma fecha e leva os dados   | Exportação JSON + CSV em todos os planos                     |
| Todos param no lembrete            | **A automação é o produto**                                  |

## Ordem de construção

**Semana 1 — o que não depende de código.** CNPJ · verificação de negócio na
Meta · app e Tech Provider com acesso avançado · conta no PSP · jurídico ·
registro da marca.

> A aprovação da Meta leva semanas. **Se começar no dia 30, o canal oficial não
> fica pronto no dia 60.**

| Sprint         | A pergunta                  | O que entra                                                                                                                                                                                                                                                                                       |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 · dias 1–10  | _"O esqueleto aguenta?"_    | CI e deploy · schema com as seis tabelas · RLS com `withTenant()` e o teste que prova que query fora dele falha · constraint de exclusão · login por código · onboarding até o link · agenda do dia · página pública · **disponibilidade (2 dias)** · event store · importador da agenda anterior |
| 2 · dias 11–25 | _"O agente marca sozinho?"_ | Embedded Signup com Coexistence · webhook idempotente · inbox · roteador (≥ 40% sem LLM) · transcrição · agente com 6 ferramentas · guardrails · copiloto e níveis de autonomia · réguas · eval com 30 conversas                                                                                  |
| 3 · dias 26–40 | _"Vira dinheiro?"_          | Fichas e consentimento · sinal via Pix · caixa · retorno · exportação e exclusão · humanização                                                                                                                                                                                                    |
| 4 · dias 41–60 | _"Escala sem mim?"_         | Assinatura self-service · PWA instalável · push com e-mail de fallback · runbooks · **restauração de backup testada** · página de status                                                                                                                                                          |

**Plano B declarado:** se a aprovação da Meta não sair até o dia 25, o piloto
começa **sem o agente de recepção** — agenda, link público, confirmação por
e-mail e uso manual do WhatsApp. É metade do valor, mas é cobrável e é honesto.
O que **não** se faz é ligar um canal não oficial "só por enquanto".

## Fora do MVP, com momento de retomada

Régua de reativação · agentes de bastidor · painel do espaço · prontuário com
guarda de 20 anos (fase 2, saúde) · editor visual de schema · offline de
leitura. Sem data: marketplace. Nunca, enquanto o PWA resolver: app de loja.

## As três armadilhas conhecidas

1. A política de RLS de `membro` **não pode** usar uma função que lê `membro` —
   recursão infinita que só aparece em produção, porque em desenvolvimento se
   roda como superusuário. → resolvida em [`drizzle/rls.sql`](../drizzle/rls.sql).
2. O pg-boss atrás de um pooler em modo transação **para de funcionar sem
   erro**. A URL do worker é outra, em modo sessão, e o processo morre no boot
   se estiver errada. → resolvida em [`shared/fila/boss.ts`](../src/shared/fila/boss.ts).
3. Toda função com cache recebe o `tenantId` como argumento **explícito**. Um
   `tenantId` implícito serve o catálogo de um cliente para outro.
