import { ok, type Resultado } from '@/shared/erros/resultado';
import type { MensagemRecebida } from '@/shared/canal';
import type { CanalGateway } from '../infra/canal.gateway';

/**
 * O que fazer com uma mensagem que chegou.
 *
 * Nesta fatia, uma frase fixa. O valor do caso de uso nao esta no que ele
 * decide hoje — esta em existir com a forma certa, para o roteador do
 * sub-projeto 3 entrar no lugar da decisao sem mexer no resto do caminho.
 *
 * O gateway entra por PARAMETRO: e o que permite testar sem rede e sem token.
 */

/** Sem promessa nenhuma. O eco prova entrega; nao atende ninguem. */
export const TEXTO_DO_ECO = 'Recebido. Este canal ainda está em teste.';

export type Desfecho = 'respondido' | 'ignorado';

export async function processarMensagem(entrada: {
  readonly mensagem: MensagemRecebida;
  readonly gateway: CanalGateway;
  readonly ecoAtivo: boolean;
}): Promise<Resultado<Desfecho>> {
  if (!entrada.ecoAtivo) return ok('ignorado');

  // O numero volta LITERAL como veio: responder a quem falou nunca precisa de
  // normalizacao, e normalizar aqui e onde o nono digito brasileiro morde.
  await entrada.gateway.enviarTexto({ para: entrada.mensagem.de, texto: TEXTO_DO_ECO });

  return ok('respondido');
}
