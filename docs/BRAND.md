# Marca e identidade

> Fonte: `05-marca-e-identidade.md`. Este arquivo é a parte que virou código.

> ⚠️ **`Kairo` é nome de trabalho.** Pendente de busca no INPI (classes 42 e
> 35), incluindo fonética, e de registro de domínio. Enquanto os cinco itens do
> checklist não estiverem verdes, o nome só aparece em código, repositório e
> documento interno — **nunca em material de venda**.

## O que a marca precisa carregar

Quem paga trabalha sozinha e vai confiar a própria agenda e o próprio WhatsApp
a um sistema que nunca viu. **A primeira coisa que ela precisa sentir é que dá
para confiar.**

| #   | Atributo  | No visual                                                 | Na fala                                        |
| --- | --------- | --------------------------------------------------------- | ---------------------------------------------- |
| 1   | Confiável | Azul profundo, geometria exata, muito branco, zero efeito | Números exatos, promessas pequenas e cumpridas |
| 2   | Calma     | Uma cor de destaque só, movimento curto                   | Frases curtas, nunca urgência falsa            |
| 3   | Humana    | **Areia** como contrapeso do azul                         | Primeiro nome, linguagem falada                |
| 4   | Precisa   | Grade rígida, nada decorativo                             | "Quinta às 14 h", não "em breve"               |

Não somos rosa/dourado/glitter (é o clichê do setor, e o produto precisa caber
no dentista da fase 2), nem roxo com gradiente (uniforme de startup de IA), nem
azul de banco, nem mascote — a IA não é o produto; o produto é o tempo que ela
devolve.

## Onde a marca vive no código

| Coisa                             | Arquivo                                                                     |
| --------------------------------- | --------------------------------------------------------------------------- |
| Nome, domínio, remetente, tagline | [`src/shared/config/brand.ts`](../src/shared/config/brand.ts)               |
| Cores                             | [`src/shared/ui/tokens/tokens.css`](../src/shared/ui/tokens/tokens.css)     |
| Tipografia e escala               | [`src/shared/ui/tokens/type.css`](../src/shared/ui/tokens/type.css)         |
| Empilhamento                      | [`src/shared/ui/tokens/z-index.css`](../src/shared/ui/tokens/z-index.css)   |
| Símbolo e logotipo em React       | [`src/shared/ui/primitives/Logo.tsx`](../src/shared/ui/primitives/Logo.tsx) |
| Arquivos de marca (svg/png)       | [`public/marca/`](../public/marca/)                                         |

🧪 **Regra de lint:** a string do nome é proibida fora de `brand.ts`.
`npm run lint:ui` quebra a build. Trocar a marca deve custar um
_find-and-replace_, não um redesenho.

## O símbolo

Um círculo — o dia, o ciclo, o relógio — com **um quarto preenchido**: o
horário que foi ocupado. É a representação literal da promessa do produto: **a
agenda se enche sozinha.**

Em 16 px lê-se como relógio; em tamanho grande, como agenda. As duas leituras
estão certas.

- O setor vai **das 12 h às 3 h**. Nunca em outro ângulo: o quarto superior
  direito é o que faz ler como "começou e está avançando", não "está pela
  metade".
- Abaixo de 20 px, a versão reduzida engorda o traço (3.2) e abre o raio (8.4);
  senão o miolo do anel fecha. O componente troca sozinho.
- Uma cor só, via `currentColor`. Sem gradiente, sem sombra, sem contorno.

## O logotipo

O símbolo **é** a letra: escreve-se `kair` + o símbolo no lugar do "o". Uma
peça, duas leituras — e não um ícone ao lado do nome.

Toda minúscula (versal comunica instituição; minúscula comunica ferramenta do
dia a dia), peso 600, entreletra −0,02 em.

## Paleta

| Nome           | Hex       | Papel                                          |
| -------------- | --------- | ---------------------------------------------- |
| Azul-noite     | `#0C273E` | Fundo institucional, ícone do app              |
| **Azul Kairo** | `#146099` | A cor da marca: logotipo, ação principal, link |
| Azul vivo      | `#2D82C0` | Estado ativo, foco                             |
| Névoa          | `#DBECFC` | Fundo de destaque, faixa informativa           |
| **Areia**      | `#ECE0CE` | O contrapeso quente                            |
| Grafite        | `#262C32` | Texto principal — 13,5 : 1 sobre Papel         |
| Papel          | `#F9FAFC` | Fundo padrão                                   |

Estado — **reservadas**, nunca decorativas e nunca sem rótulo ao lado:
Confirmado `#007C45` · Aguardando `#9A6215` · Falta/erro `#C1332F`.

Proporção numa peça: 60% papel, 20% azul-noite, 12% areia, **6% azul da
marca**, 2% estado. O azul da marca é o que menos aparece — cor de ação usada o
tempo todo deixa de sinalizar ação.

## Os dez nunca

1. Nunca mudar o ângulo do setor, nem "girar o ponteiro".
2. Nunca gradiente, sombra, brilho, contorno ou relevo.
3. Nunca trocar a fonte do logotipo.
4. Nunca caixa alta (`KAIRO`) nem capitular (`Kairo`) no logotipo.
5. Nunca separar o símbolo criando ícone + texto lado a lado.
6. Nunca esticar, condensar ou inclinar.
7. Nunca sobre foto movimentada ou de baixo contraste.
8. Nunca em caixa colorida que não seja Azul-noite ou Branco.
9. **Nunca usar a cor da marca para comunicar estado** — estado tem paleta
   própria, sempre com rótulo.
10. **Nunca animar o preenchimento do setor como carregamento.** É tentador e
    destrói a leitura de "horário ocupado": o setor tem tamanho fixo, e ele
    significa alguma coisa.

## Voz

Com a profissional: direta, específica, sem bajulação. _"7 faltas evitadas este
mês."_ — nunca _"Sua produtividade explodiu! 🚀"_.

Com o cliente final: cordial, breve, no ritmo do WhatsApp. _"Esse horário
acabou de ser pego. Tenho 15 h ou 16 h30 — qual fica melhor?"_ — nunca
_"Horário indisponível."_

É por isso que cada erro tem **três textos** em `i18n/pt-BR.ts`: um para a
profissional, um para o cliente final, e a ação sugerida.

## Checklist de lançamento

|     | Item                                                                 | Estado                                    |
| --- | -------------------------------------------------------------------- | ----------------------------------------- |
| ☐   | Busca no INPI (classes 42 e 35), incluindo fonética                  | pendente — **bloqueia material de venda** |
| ☐   | Depósito da marca (~R$ 880)                                          | depende da busca + CNPJ                   |
| ☐   | Domínio `.com.br` e `.app.br`                                        | depende da busca                          |
| ☑   | `logo-simbolo`, `logo-horizontal`, `logo-empilhado`, versão reduzida | em `public/marca/`                        |
| ☑   | Ícones do PWA 192/512 + maskable, favicon                            | em `public/`                              |
| ☑   | `brand.ts` e tokens, com o lint de marca ativo                       | feito                                     |
| ☐   | Texto do logotipo convertido em curvas                               | os SVGs ainda têm texto vivo              |
| ☐   | Assinatura de e-mail e remetente verificado no Resend                | depende do domínio                        |
