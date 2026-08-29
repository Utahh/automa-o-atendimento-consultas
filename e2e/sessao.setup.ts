import { test as setup } from '@playwright/test';
import { COOKIE_DE_SESSAO, criarValorDeSessao } from '../src/shared/tenancy/cookie';
import {
  CLIENTE_DEMO,
  TENANT_DEMO,
  USUARIO_CLIENTE,
  USUARIO_DEMO,
} from '../src/shared/db/ids-de-exemplo';

/**
 * Prepara uma sessao valida antes da bateria de layout.
 *
 * A alternativa seria passar pela tela de entrada em cada um dos 57 testes —
 * e ai o que estaria sendo medido seria o login, nao o layout. O cookie e
 * assinado com o MESMO segredo do servidor: nao existe porta de teste no
 * produto, e nenhuma rota especial fica ligada em producao.
 */
const ARQUIVO = 'e2e/.sessao.json';

setup('cria a sessao de teste', async ({ context }) => {
  const segredo = process.env.SESSAO_SECRET;
  if (segredo === undefined || segredo === '') {
    throw new Error('SESSAO_SECRET ausente: os testes de layout precisam dele para entrar.');
  }

  const valor = criarValorDeSessao(
    { usuarioId: USUARIO_DEMO, tenantId: TENANT_DEMO, fuso: 'America/Sao_Paulo', papel: 'estudio' },
    segredo,
  );

  // Os dois nomes: o config usa 127.0.0.1, mas quem roda contra um ambiente
  // ja publicado costuma apontar BASE_URL para localhost — e cookie preso no
  // dominio errado faz a suite passar redirecionada para a tela de entrada,
  // que e a pior forma de teste verde.
  await context.addCookies(
    ['127.0.0.1', 'localhost'].map((domain) => ({
      name: COOKIE_DE_SESSAO,
      value: valor,
      domain,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax' as const,
    })),
  );

  await context.storageState({ path: ARQUIVO });
});

export { ARQUIVO as ARQUIVO_DE_SESSAO };

/**
 * A segunda sessao: o app do cliente. Papel diferente significa banco
 * diferente do outro lado — o cliente le so o que e dele.
 */
setup('cria a sessao de cliente', async ({ context }) => {
  const segredo = process.env.SESSAO_SECRET;
  if (segredo === undefined || segredo === '') {
    throw new Error('SESSAO_SECRET ausente: os testes de layout precisam dele para entrar.');
  }

  const valor = criarValorDeSessao(
    {
      usuarioId: USUARIO_CLIENTE,
      tenantId: TENANT_DEMO,
      fuso: 'America/Sao_Paulo',
      papel: 'cliente',
      clienteId: CLIENTE_DEMO,
    },
    segredo,
  );

  await context.addCookies(
    ['127.0.0.1', 'localhost'].map((domain) => ({
      name: COOKIE_DE_SESSAO,
      value: valor,
      domain,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax' as const,
    })),
  );

  await context.storageState({ path: 'e2e/.sessao-cliente.json' });
});
