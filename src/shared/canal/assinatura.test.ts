import { describe, expect, it } from 'vitest';
import { assinar, conferir } from './assinatura';

/**
 * A assinatura e a unica coisa entre o webhook e a internet aberta. Um erro
 * aqui nao aparece em tela: aparece como mensagem que nunca foi da Meta sendo
 * processada como se fosse.
 */
describe('assinatura do webhook', () => {
  const segredo = 'segredo-de-teste';
  const corpo = '{"object":"whatsapp_business_account","entry":[]}';

  it('confere o que ela mesma assinou', () => {
    expect(conferir(corpo, assinar(corpo, segredo), segredo)).toBe(true);
  });

  it('usa o prefixo que a Meta manda', () => {
    expect(assinar(corpo, segredo)).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('recusa corpo adulterado por um caractere', () => {
    const cabecalho = assinar(corpo, segredo);
    expect(conferir(corpo.replace('[]', '[ ]'), cabecalho, segredo)).toBe(false);
  });

  it('recusa assinatura feita com outro segredo', () => {
    expect(conferir(corpo, assinar(corpo, 'outro-segredo'), segredo)).toBe(false);
  });

  it('recusa cabecalho ausente', () => {
    expect(conferir(corpo, null, segredo)).toBe(false);
  });

  it('recusa cabecalho de comprimento diferente sem lancar', () => {
    // timingSafeEqual LANCA quando os buffers tem tamanhos diferentes. Se a
    // guarda de comprimento sumir, este teste vira excecao em vez de `false` —
    // e a rota devolve 500 no lugar de 401.
    expect(() => conferir(corpo, 'sha256=curto', segredo)).not.toThrow();
    expect(conferir(corpo, 'sha256=curto', segredo)).toBe(false);
  });

  it('recusa quando nao ha segredo configurado', () => {
    expect(conferir(corpo, assinar(corpo, segredo), undefined)).toBe(false);
  });
});
