import { describe, expect, it } from 'vitest';
import { criarValorDeSessao, lerValorDeSessao, DURACAO_DA_SESSAO_MS } from './cookie';

const SEGREDO = 'segredo-de-teste-com-tamanho-suficiente-ok';
const FUSO = 'America/Sao_Paulo';
const sessao = { usuarioId: 'u-1', tenantId: 't-1', fuso: FUSO };
const agora = new Date('2026-09-01T12:00:00Z');

describe('cookie de sessao', () => {
  it('vai e volta com o mesmo conteudo', () => {
    const valor = criarValorDeSessao(sessao, SEGREDO, agora);
    expect(lerValorDeSessao(valor, SEGREDO, FUSO, agora)).toEqual(sessao);
  });

  it('recusa quando a assinatura nao confere', () => {
    const valor = criarValorDeSessao(sessao, SEGREDO, agora);
    expect(lerValorDeSessao(valor, 'outro-segredo-qualquer', FUSO, agora)).toBeNull();
  });

  it('recusa carga adulterada', () => {
    const valor = criarValorDeSessao(sessao, SEGREDO, agora);
    const [, assinatura] = valor.split('.');
    const outraCarga = Buffer.from(
      JSON.stringify({ ...sessao, tenantId: 't-2', exp: agora.getTime() + 1000 }),
      'utf8',
    ).toString('base64url');

    expect(
      lerValorDeSessao(outraCarga + '.' + String(assinatura), SEGREDO, FUSO, agora),
    ).toBeNull();
  });

  it('o prazo e ABSOLUTO: expira 7 dias depois de nascer', () => {
    const valor = criarValorDeSessao(sessao, SEGREDO, agora);
    const umInstanteAntes = new Date(agora.getTime() + DURACAO_DA_SESSAO_MS - 1000);
    const umInstanteDepois = new Date(agora.getTime() + DURACAO_DA_SESSAO_MS + 1000);

    expect(lerValorDeSessao(valor, SEGREDO, FUSO, umInstanteAntes)).toEqual(sessao);
    expect(lerValorDeSessao(valor, SEGREDO, FUSO, umInstanteDepois)).toBeNull();
  });

  it('recusa lixo', () => {
    expect(lerValorDeSessao('', SEGREDO, FUSO, agora)).toBeNull();
    expect(lerValorDeSessao('sem-ponto', SEGREDO, FUSO, agora)).toBeNull();
    expect(lerValorDeSessao('a.b', SEGREDO, FUSO, agora)).toBeNull();
  });
});
