/**
 * A UNICA fonte do nome e dos textos de marca.
 *
 * "Kairo" e nome de trabalho: pendente de busca no INPI (classes 42 e 35).
 * Ate os cinco itens do checklist ficarem verdes, o nome so aparece em codigo,
 * repositorio e documento interno.
 *
 * Trocar a marca deve custar um find-and-replace neste arquivo, nao um
 * redesenho — e e por isso que a regra de lint proibe a string do nome em
 * qualquer outro lugar do src/.
 */
export const brand = {
  name: 'Kairo',
  legalName: 'Kairo Tecnologia LTDA', // placeholder — depende do CNPJ
  domain: 'kairo.app.br', // placeholder — depende do registro
  supportEmail: 'ajuda@kairo.app.br',
  sender: 'Kairo <ajuda@kairo.app.br>',
  tagline: 'A IA cuida do negocio. Voce cuida do cliente.',
  /** Sai quando a marca for reconhecida pelos clientes, nao numa data fixa. */
  descriptor: 'secretaria de ia',
} as const;

export type Brand = typeof brand;
