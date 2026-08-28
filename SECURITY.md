# Segurança

## Reportar uma vulnerabilidade

Não abra issue pública. Use **Security › Report a vulnerability** neste
repositório (GitHub Private Vulnerability Reporting).

Resposta em até 5 dias úteis.

## O que já é verificado automaticamente

| Verificação                     | Onde                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| Análise estática de segurança   | `codeql.yml`, semanal e em todo PR para `main`               |
| Dependências vulneráveis        | Dependabot, semanal                                          |
| Isolamento entre clientes (RLS) | Job `banco` do CI: tabela de negócio sem política reprova    |
| Assinatura de webhook           | `timingSafeEqual` na rota; corpo sem assinatura válida é 401 |

## Fora de escopo

- Ausência de cabeçalhos em ambientes de preview
- Relatórios gerados só por scanner, sem prova de exploração
- Engenharia social
