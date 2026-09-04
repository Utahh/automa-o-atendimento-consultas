import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Teste de contrato: o que sai na rede, exatamente. `fetch` e dublado porque a
 * Graph API nao e nossa e nao roda no CI — mas a forma da chamada e nossa, e e
 * ela que quebra em silencio quando alguem mexe.
 */
describe('gateway do canal', () => {
  const AMBIENTE = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // `env()` valida o ambiente inteiro de uma vez e exige DATABASE_URL. O job
    // de unidade nao sobe Postgres, entao o teste declara o minimo que precisa.
    process.env['DATABASE_URL'] ??= 'postgres://kairo:kairo@localhost:55432/kairo';
    process.env['CANAL_TOKEN'] = 'token-de-teste';
    process.env['CANAL_PHONE_NUMBER_ID'] = '106540352242922';
  });

  afterEach(() => {
    process.env = { ...AMBIENTE };
    vi.restoreAllMocks();
  });

  async function carregar() {
    return (await import('./canal.gateway')).canalGateway;
  }

  it('monta a URL com o numero remetente e a versao da API', async () => {
    const chamada = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', chamada);

    await (await carregar()).enviarTexto({ para: '5511985851395', texto: 'oi' });

    const [url] = chamada.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v23.0/106540352242922/messages');
  });

  it('manda o token no cabecalho e o corpo que a Cloud API espera', async () => {
    const chamada = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', chamada);

    await (await carregar()).enviarTexto({ para: '5511985851395', texto: 'oi' });

    const [, opcoes] = chamada.mock.calls[0] as [string, RequestInit];
    expect(opcoes.method).toBe('POST');
    expect((opcoes.headers as Record<string, string>)['authorization']).toBe(
      'Bearer token-de-teste',
    );
    expect(JSON.parse(String(opcoes.body))).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '5511985851395',
      type: 'text',
      text: { body: 'oi', preview_url: false },
    });
  });

  it('sem CANAL_TOKEN, loga e NAO toca a rede', async () => {
    delete process.env['CANAL_TOKEN'];
    const chamada = vi.fn();
    vi.stubGlobal('fetch', chamada);
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await (await carregar()).enviarTexto({ para: '5511985851395', texto: 'oi' });

    expect(chamada).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
  });

  it('lanca quando a Graph API recusa, com o status na mensagem', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"error":{"message":"bad"}}', { status: 400 })),
    );

    await expect(
      (await carregar()).enviarTexto({ para: '5511985851395', texto: 'oi' }),
    ).rejects.toThrow(/400/);
  });

  it('os dois envios de template ainda nao existem, e dizem de quem sao', async () => {
    const gateway = await carregar();
    const argumentos = { para: '5511985851395', nome: 'lembrete', parametros: ['14h'] };

    await expect(gateway.enviarTemplate(argumentos)).rejects.toThrow(/sub-projeto 2/);
    await expect(gateway.enviarTemplateComBotoes(argumentos)).rejects.toThrow(/sub-projeto 2/);
  });
});
