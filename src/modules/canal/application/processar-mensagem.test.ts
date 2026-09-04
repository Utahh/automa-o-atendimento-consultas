import { describe, expect, it, vi } from 'vitest';
import type { MensagemRecebida } from '@/shared/canal';
import type { CanalGateway } from '../infra/canal.gateway';
import { processarMensagem, TEXTO_DO_ECO } from './processar-mensagem';

function gatewayFalso(): CanalGateway & { enviarTexto: ReturnType<typeof vi.fn> } {
  const enviarTexto = vi.fn().mockResolvedValue(undefined);
  const naoDeveria = () => Promise.reject(new Error('nao deveria ser chamado'));
  return { enviarTexto, enviarTemplate: naoDeveria, enviarTemplateComBotoes: naoDeveria };
}

const texto: MensagemRecebida = {
  tipo: 'texto',
  wamid: 'wamid.A',
  de: '5511985851395',
  texto: 'oi',
  em: new Date('2026-09-04T12:00:00Z'),
};

describe('processar mensagem recebida', () => {
  it('com o eco ligado, responde a quem escreveu', async () => {
    const gateway = gatewayFalso();

    const r = await processarMensagem({ mensagem: texto, gateway, ecoAtivo: true });

    expect(r).toEqual({ ok: true, valor: 'respondido' });
    expect(gateway.enviarTexto).toHaveBeenCalledWith({
      para: '5511985851395',
      texto: TEXTO_DO_ECO,
    });
  });

  it('com o eco desligado, nao envia nada', async () => {
    // O padrao. Sem esta trava, o primeiro deploy com token responderia "eco"
    // a um cliente pagante.
    const gateway = gatewayFalso();

    const r = await processarMensagem({ mensagem: texto, gateway, ecoAtivo: false });

    expect(r).toEqual({ ok: true, valor: 'ignorado' });
    expect(gateway.enviarTexto).not.toHaveBeenCalled();
  });

  it('responde ao numero LITERAL que a Meta mandou', async () => {
    // Sem normalizar: o nono digito brasileiro so vira problema quando alguem
    // procurar um cliente pelo telefone, e nao e aqui.
    const gateway = gatewayFalso();
    const semNono: MensagemRecebida = { ...texto, de: '551185851395' };

    await processarMensagem({ mensagem: semNono, gateway, ecoAtivo: true });

    expect(gateway.enviarTexto).toHaveBeenCalledWith({
      para: '551185851395',
      texto: TEXTO_DO_ECO,
    });
  });

  it('trata resposta de botao como qualquer outra mensagem, nesta fatia', async () => {
    const gateway = gatewayFalso();
    const botao: MensagemRecebida = {
      tipo: 'botao',
      wamid: 'wamid.B',
      de: '5511985851395',
      id: 'confirmo',
      titulo: 'Confirmo',
      em: new Date('2026-09-04T12:00:00Z'),
    };

    const r = await processarMensagem({ mensagem: botao, gateway, ecoAtivo: true });

    expect(r).toEqual({ ok: true, valor: 'respondido' });
  });
});
