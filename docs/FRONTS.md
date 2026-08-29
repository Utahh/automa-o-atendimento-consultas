# As duas frentes: app do cliente e painel do profissional

> Escrito no método dos cinco setores — Persona · Ação · Resultado · Tom ·
> Suporte. Uma capacidade sem o setor 5 escrito não entra.
> Contexto da mudança em [ADR‑001](ADR-001-cliente-com-conta.md).

---

## As regras que sustentam as duas frentes

Antes das telas, as seis regras que decidem quase todo o comportamento. Elas
existem porque **fila de espera é fácil de descrever e difícil de acertar**: os
erros aparecem quando duas pessoas querem o mesmo buraco.

| #     | Regra                                                                                                                              | Por quê                                                             |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **1** | **Uma pessoa não ocupa dois horários do mesmo serviço com o mesmo profissional.** O segundo é desejo (fila), não reserva           | Sem isso, quem está na fila trava a agenda em dois lugares          |
| **2** | **A fila é desejo; o agendamento é reserva.** Estar na fila nunca bloqueia horário de ninguém                                      | A fila só vira reserva quando é aceita                              |
| **3** | **A oferta é para um por vez, com validade.** Antiguidade decide o primeiro                                                        | Ofertar para todos cria corrida e frustra a maioria                 |
| **4** | **Quem chega, decide.** O check‑in é o momento em que o desejo morre: quem fez check‑in sai da fila daquele serviço e profissional | É a única evidência de que a pessoa escolheu aquele horário         |
| **5** | **Ninguém perde o horário que já tinha sem ter chegado.** O agendamento antigo só é desfeito **depois** do check‑in no novo        | O contrário é tirar o horário de quem talvez não consiga ir ao novo |
| **6** | **A constraint do banco é a última garantia.** Fila, janela, agente e dedo passam pelo mesmo caso de uso e pela mesma constraint   | É o que faz a automação ser segura sem precisar ser esperta         |

### O que é uma janela

**Jornada** é o expediente que se repete toda semana. **Bloqueio** subtrai
(almoço, férias). **Janela** soma: é um intervalo extra num dia específico, que
o profissional abre quando quer atender fora do expediente ou preencher um
buraco. As três se combinam antes de a disponibilidade ser calculada — a função
pura não sabe de onde veio cada intervalo.

---

# Frente 1 · O app do cliente

## C14 · Entrar e ver o que é meu

| Setor           |                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1 Persona**   | Cliente que já foi atendido pelo menos uma vez, no celular, quase sempre com pressa                                                                                                        |
| **2 Ação**      | Entra com e‑mail e código de 6 dígitos → cai numa tela que mostra **o próximo horário**, a fila em que está e o botão de marcar                                                            |
| **3 Resultado** | Sabe onde está sem perguntar. Métrica: quantos voltam a marcar sozinhos                                                                                                                    |
| **4 Tom**       | Nenhum floreio. "Quinta, 14 h, com a Ana." Não é um painel; é uma resposta                                                                                                                 |
| **5 Suporte**   | Sem horário nenhum e sem fila, a tela **não fica vazia**: mostra o botão de marcar e os serviços mais procurados. Sem conexão, mostra o que já estava lá, dizendo que é o que já estava lá |

## C15 · Marcar em quatro decisões

| Setor           |                                                                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 Persona**   | O mesmo cliente, decidindo entre um serviço e outro                                                                                                                                                               |
| **2 Ação**      | **Serviço → dia → profissional disponível → horário.** O dia vem antes do profissional de propósito: quem escolhe profissional primeiro descobre depois que ele não tem vaga, e recomeça                          |
| **3 Resultado** | Horário criado, com sinal quando o profissional exige. Meta: mediana abaixo de 40 s                                                                                                                               |
| **4 Tom**       | Uma pergunta por tela, sem barra de progresso. O preço e a duração aparecem no serviço, não numa letra miúda no fim                                                                                               |
| **5 Suporte**   | Nenhum profissional livre no dia → oferece **o próximo dia com vaga** e o botão de entrar na fila daquele dia. Horário tomado entre a escolha e o toque → o erro traz **três alternativas** do mesmo profissional |

> **Por que o profissional vem depois do dia:** a pergunta que o cliente sabe
> responder é "quando eu posso ir". A pergunta que ele às vezes não sabe é "com
> quem". Perguntar o que ele sabe primeiro reduz o número de becos sem saída.

## C16 · Entrar na fila de espera

| Setor           |                                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 Persona**   | Cliente que quer um horário que não existe — ou que quer um horário **melhor** do que o que conseguiu                                                                                                 |
| **2 Ação**      | Escolhe serviço, dia e (opcional) profissional e faixa do dia — manhã, tarde, qualquer. Entra na fila. **Pode estar na fila e ter horário marcado ao mesmo tempo**                                    |
| **3 Resultado** | Vaga preenchida sem ninguém ligar para ninguém. Métrica: **vagas preenchidas pela fila** e tempo médio até preencher                                                                                  |
| **4 Tom**       | Honesto sobre o que é: _"Você é o 2º da fila para sábado de manhã. Se abrir vaga, aviso — e você decide."_ Nunca promete horário                                                                      |
| **5 Suporte**   | A oferta vale por tempo limitado e vai para **um por vez**. Se ninguém aceita, a vaga volta a aparecer para todo mundo. Se a pessoa sai da fila, some da fila — não fica "cancelada" ocupando posição |

## C17 · Chegar e fazer check‑in

| Setor           |                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1 Persona**   | Cliente que acabou de chegar ao local, de pé, com o celular na mão                                                                                     |
| **2 Ação**      | Abre o app e toca em **Cheguei**. Só aparece perto da hora — nem no dia anterior, nem depois que o horário passou                                      |
| **3 Resultado** | O profissional vê quem chegou sem levantar a cabeça. E o sistema aprende quem realmente veio: é daqui que sai a taxa de falta **medida**, não estimada |
| **4 Tom**       | Um botão, uma palavra. Depois do toque, uma frase: _"A Ana já sabe que você chegou."_                                                                  |
| **5 Suporte**   | Fora da janela de check‑in, o botão explica **por quê** e mostra a hora em que ele abre. Se o horário foi cancelado, diz isso em vez de falhar         |

> **O que o check‑in dispara (regra 4 e 5):**
>
> 1. O agendamento vira **chegou**.
> 2. O cliente **sai da fila** do mesmo serviço e profissional — ele já escolheu.
> 3. Se este horário veio de uma oferta da fila, o **horário antigo é desfeito**
>    agora, e a vaga liberada volta para a fila de quem está esperando.
>
> A ordem importa: o horário antigo só cai **depois** que a pessoa chegou ao
> novo. Antes disso, ela tem os dois — e é assim que tem que ser.

## C18 · Avaliar o atendimento

| Setor           |                                                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 Persona**   | Cliente que acabou de ser atendido, ainda no local ou a caminho de casa                                                                                                          |
| **2 Ação**      | Ao marcar o atendimento como concluído, o sistema envia **uma pergunta**: de 0 a 10, quanto recomendaria. Quem responde vê uma segunda tela, opcional, com duas perguntas curtas |
| **3 Resultado** | NPS por profissional e por serviço. Métrica: taxa de resposta acima de 30%                                                                                                       |
| **4 Tom**       | Curto e sem culpa. Nunca "sua opinião é muito importante para nós". Nota baixa não abre um formulário de reclamação: abre uma linha de texto opcional                            |
| **5 Suporte**   | Uma pergunta por atendimento, **nunca duas**. Quem não responde em 48 h não recebe lembrete. Nota até 6 avisa o profissional na hora — é onde ele ainda consegue resolver        |

---

# Frente 2 · O painel do profissional

## C19 · O dia inteiro numa tela

| Setor           |                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **1 Persona**   | Profissional entre dois atendimentos, em pé, uma mão                                                                                 |
| **2 Ação**      | Vê a agenda do dia com **quem chegou**, o que está por confirmar e **quem está na fila** — nessa ordem, porque é a ordem da urgência |
| **3 Resultado** | Não precisa abrir três telas para saber o que fazer agora                                                                            |
| **4 Tom**       | Números exatos. "3 confirmados · 1 esperando · 2 na fila"                                                                            |
| **5 Suporte**   | Sem rede, mostra o que já estava lá e diz isso. A fila nunca aparece vazia sem explicar que ela existe                               |

## C20 · Cancelar, realocar e abrir janela

| Setor           |                                                                                                                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 Persona**   | Profissional que precisa mexer no dia: alguém desmarcou, ou ela quer encaixar mais um                                                                                                                                                              |
| **2 Ação**      | **Cancelar** um horário → a vaga é oferecida à fila automaticamente. **Realocar** → escolhe outro horário livre do mesmo dia e o cliente é avisado. **Abrir janela** → cria um intervalo extra num dia específico, e a fila daquele dia é acionada |
| **3 Resultado** | Buraco preenchido sem ninguém ligar. Métrica: **R$ recuperados** — soma dos horários que a fila reocupou                                                                                                                                           |
| **4 Tom**       | Sem drama e sem confirmação: toda ação sai com **desfazer** por 6 segundos                                                                                                                                                                         |
| **5 Suporte**   | Cancelar com menos de 24 h avisa que o cliente será notificado, e diz o que a mensagem vai dizer. Abrir janela em cima de bloqueio não é erro: o bloqueio ganha                                                                                    |

## C21 · Ver o que a fila e as avaliações estão dizendo

| Setor           |                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| **1 Persona**   | Profissional no fim do dia ou no domingo à noite                                                                     |
| **2 Ação**      | Vê a fila por dia e por serviço, e as respostas de avaliação com a nota e o comentário                               |
| **3 Resultado** | Descobre qual horário falta na agenda dela **antes** de perder o cliente. Métrica: NPS e demanda reprimida por faixa |
| **4 Tom**       | Mostra número e o que ele significa: _"6 pessoas na fila de sábado de manhã. Você não atende sábado."_               |
| **5 Suporte**   | Nota baixa aparece com o horário e o serviço ao lado — nunca uma nota solta que ela não sabe de onde veio            |

---

## Ordem de construção

| Passo | O que entra                                                          | Por que nessa ordem                                   |
| ----- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| 1     | Schema, RLS por papel e o teste que prova que o cliente A não vê o B | Nada de cliente pode subir antes disso                |
| 2     | Domínio da fila, do check‑in e da janela — puro, testado             | É onde estão as regras difíceis                       |
| 3     | Casos de uso e as portas                                             | Uma escrita, quatro portas                            |
| 4     | Telas do cliente                                                     | O fluxo inteiro é inútil sem elas                     |
| 5     | Telas do profissional                                                | Ele já tem agenda; ganha fila e ações                 |
| 6     | Avaliação                                                            | Depende de atendimento concluído, que é o fim da fila |
