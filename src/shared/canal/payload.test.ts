import { describe, expect, it } from 'vitest';
import { chaveDe, mensagensDo } from './payload';

/**
 * O que a Cloud API realmente manda. Os corpos abaixo sao a forma documentada,
 * reduzida ao que lemos — nao um resumo do que seria conveniente ler.
 */

const WAMID = 'wamid.HBgNNTUxMTk4NTg1MTM5NRUCABIYFjNFQjBBMQ==';

function envelope(valor: unknown): unknown {
  return {
    object: 'whatsapp_business_account',
    entry: [{ id: '102290129340398', changes: [{ value: valor, field: 'messages' }] }],
  };
}

const metadados = {
  messaging_product: 'whatsapp',
  metadata: { display_phone_number: '15550001111', phone_number_id: '106540352242922' },
};

const texto = envelope({
  ...metadados,
  contacts: [{ profile: { name: 'Cauan' }, wa_id: '5511985851395' }],
  messages: [
    {
      from: '5511985851395',
      id: WAMID,
      timestamp: '1757000000',
      type: 'text',
      text: { body: 'quero marcar quinta' },
    },
  ],
});

describe('leitura do payload', () => {
  it('le uma mensagem de texto', () => {
    const m = mensagensDo(texto);
    expect(m).toHaveLength(1);
    expect(m[0]).toEqual({
      tipo: 'texto',
      wamid: WAMID,
      de: '5511985851395',
      texto: 'quero marcar quinta',
      em: new Date(1757000000 * 1000),
    });
  });

  it('le a resposta de botao de TEMPLATE, que vem como type "button"', () => {
    // E este o formato que o sub-projeto 2 vai receber: o lembrete sai como
    // template com botoes, e a resposta volta assim — nao como "interactive".
    const m = mensagensDo(
      envelope({
        ...metadados,
        messages: [
          {
            from: '5511985851395',
            id: WAMID,
            timestamp: '1757000000',
            type: 'button',
            button: { payload: 'confirmo', text: 'Confirmo' },
          },
        ],
      }),
    );
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ tipo: 'botao', id: 'confirmo', titulo: 'Confirmo' });
  });

  it('le a resposta de botao de mensagem interativa avulsa', () => {
    const m = mensagensDo(
      envelope({
        ...metadados,
        messages: [
          {
            from: '5511985851395',
            id: WAMID,
            timestamp: '1757000000',
            type: 'interactive',
            interactive: {
              type: 'button_reply',
              button_reply: { id: 'quero_esse', title: 'Quero esse horário' },
            },
          },
        ],
      }),
    );
    expect(m[0]).toMatchObject({ tipo: 'botao', id: 'quero_esse', titulo: 'Quero esse horário' });
  });

  it('devolve vazio para webhook de status, que nao tem messages', () => {
    const status = envelope({
      ...metadados,
      statuses: [
        { id: WAMID, status: 'delivered', timestamp: '1757000000', recipient_id: '5511985851395' },
      ],
    });
    expect(mensagensDo(status)).toEqual([]);
  });

  it('le as duas mensagens quando o entry traz duas', () => {
    const duas = envelope({
      ...metadados,
      messages: [
        {
          from: '55119',
          id: 'wamid.A',
          timestamp: '1757000000',
          type: 'text',
          text: { body: 'a' },
        },
        {
          from: '55118',
          id: 'wamid.B',
          timestamp: '1757000001',
          type: 'text',
          text: { body: 'b' },
        },
      ],
    });
    expect(mensagensDo(duas).map((m) => m.wamid)).toEqual(['wamid.A', 'wamid.B']);
  });

  it('ignora tipo que ainda nao lemos, sem lancar', () => {
    // Audio, imagem, localizacao. Chegam hoje; sao trabalho do sub-projeto 3.
    const audio = envelope({
      ...metadados,
      messages: [
        {
          from: '55119',
          id: 'wamid.C',
          timestamp: '1757000000',
          type: 'audio',
          audio: { id: 'x' },
        },
      ],
    });
    expect(() => mensagensDo(audio)).not.toThrow();
    expect(mensagensDo(audio)).toEqual([]);
  });

  it('nao lanca com corpo de forma completamente desconhecida', () => {
    expect(() => mensagensDo({ foo: 'bar' })).not.toThrow();
    expect(mensagensDo({ foo: 'bar' })).toEqual([]);
  });
});

describe('chave de idempotencia', () => {
  it('usa o wamid quando ha mensagem', () => {
    expect(chaveDe(texto, JSON.stringify(texto))).toBe(WAMID);
  });

  it('cai no hash do corpo cru quando nao ha mensagem', () => {
    const status = envelope({ ...metadados, statuses: [{ id: 'x', status: 'read' }] });
    const bruto = JSON.stringify(status);
    const chave = chaveDe(status, bruto);
    expect(chave).toMatch(/^[0-9a-f]{64}$/);
    expect(chaveDe(status, bruto)).toBe(chave);
  });

  it('da chaves diferentes para corpos diferentes', () => {
    const a = JSON.stringify({ a: 1 });
    const b = JSON.stringify({ a: 2 });
    expect(chaveDe({ a: 1 }, a)).not.toBe(chaveDe({ a: 2 }, b));
  });
});
