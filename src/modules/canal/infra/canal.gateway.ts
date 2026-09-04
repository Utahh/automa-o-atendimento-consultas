import { env } from '@/shared/config/env';

/**
 * A saida para a Cloud API.
 *
 * Esta e a peca que o sub-projeto 2 herda: quem manda o lembrete de 15 minutos
 * e a oferta de vaga da fila e este mesmo objeto. Por isso ele mora em `infra/`
 * do modulo, e nao escondido dentro do handler do worker.
 *
 * Sem CANAL_TOKEN ele LOGA em vez de enviar — o mesmo padrao de
 * `shared/notificacao/entregar-codigo.ts`. E o que permite rodar o circuito
 * inteiro, e o CI, sem conta na Meta e sem gastar centavo.
 */

/** Mudar a versao e decisao de codigo, com teste junto — nao variavel de ambiente. */
const VERSAO_DA_API = 'v23.0';

type Destinatario = { readonly para: string; readonly texto: string };
type Template = {
  readonly para: string;
  readonly nome: string;
  readonly parametros: readonly string[];
};

export type CanalGateway = {
  /** Texto livre. So vale DENTRO da janela de 24 h aberta pelo cliente. */
  enviarTexto(p: Destinatario): Promise<void>;
  /** Fora da janela, so passa template aprovado. Sub-projeto 2. */
  enviarTemplate(p: Template): Promise<never>;
  /** Template com botoes de resposta rapida — a mensagem que vira acao. Sub-projeto 2. */
  enviarTemplateComBotoes(p: Template): Promise<never>;
};

async function enviarTexto({ para, texto }: Destinatario): Promise<void> {
  const config = env();
  const token = config.CANAL_TOKEN;
  const numero = config.CANAL_PHONE_NUMBER_ID;

  if (token === undefined || token === '' || numero === undefined || numero === '') {
    console.warn('[canal] -> ' + para + ': ' + texto + '  (sem CANAL_TOKEN: entregue pelo log)');
    return;
  }

  const resposta = await fetch(
    'https://graph.facebook.com/' + VERSAO_DA_API + '/' + numero + '/messages',
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: para,
        type: 'text',
        text: { body: texto, preview_url: false },
      }),
    },
  );

  if (!resposta.ok) {
    // Falhar alto: o pg-boss reagenda, e `processado_em` continua nulo. Engolir
    // o erro aqui viraria mensagem que ninguem sabe que nao chegou.
    const corpo = await resposta.text();
    throw new Error('Canal recusou o envio: ' + String(resposta.status) + ' ' + corpo);
  }
}

function aindaNao(): Promise<never> {
  return Promise.reject(
    new Error(
      'Envio de template ainda nao implementado — sub-projeto 2. ' +
        'Depende de template aprovado pela Meta.',
    ),
  );
}

export const canalGateway: CanalGateway = {
  enviarTexto,
  enviarTemplate: aindaNao,
  enviarTemplateComBotoes: aindaNao,
};
