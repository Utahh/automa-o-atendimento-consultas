import 'server-only';
import { env } from '../config/env';
import { brand } from '../config/brand';

/**
 * Por onde o codigo de acesso chega.
 *
 * Em desenvolvimento ele vai para o log do servidor: nao existe conta de
 * e-mail para criar, nao existe chave para configurar, e da para testar o
 * login inteiro sem depender de terceiro nenhum.
 *
 * Com RESEND_API_KEY presente, sai por e-mail de verdade (3.000/mes no
 * plano gratuito). E-mail e o canal GARANTIDO — push no iPhone so funciona
 * com o app instalado na tela de inicio.
 */
export async function entregarCodigo(email: string, codigo: string): Promise<void> {
  const chave = env().RESEND_API_KEY;

  if (chave === undefined || chave === '') {
    console.warn(
      '[codigo] ' + email + ' -> ' + codigo + '  (sem RESEND_API_KEY: entregue pelo log)',
    );
    return;
  }

  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + chave,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: brand.sender,
      to: [email],
      subject: 'Seu codigo: ' + codigo,
      text: 'Seu codigo de acesso e ' + codigo + '. Ele vale por 10 minutos.',
    }),
  });

  if (!resposta.ok) {
    // Falhar alto: um codigo que nao chega vira usuario travado na porta.
    throw new Error('Nao consegui enviar o codigo por e-mail: ' + String(resposta.status));
  }
}
