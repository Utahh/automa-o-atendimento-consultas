/**
 * Quem fez a escrita. Vai junto em todo evento — sem ator, o historico nao
 * responde "quem marcou isso?", que e a primeira pergunta de todo suporte.
 */
export type Ator =
  | { readonly tipo: 'humano'; readonly id: string }
  | { readonly tipo: 'cliente'; readonly id: string }
  | { readonly tipo: 'agente' }
  | { readonly tipo: 'sistema' };

export function descreverAtor(ator: Ator): string {
  return ator.tipo === 'humano' || ator.tipo === 'cliente' ? ator.tipo + ':' + ator.id : ator.tipo;
}
