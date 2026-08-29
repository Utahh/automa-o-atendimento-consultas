import { erro, ok, type Resultado } from '@/shared/erros';
import type { Sessao } from '@/shared/tenancy/sessao';
import { avaliar, type MotivoDeRecusa } from '../domain/codigo';
import { acessoRepo } from '../infra/acesso.repo';
import { hashDoCodigo } from './solicitar-codigo';

export type ErroDeEntrada = { readonly codigo: 'CODIGO_RECUSADO'; readonly motivo: MotivoDeRecusa };

/**
 * Confere o codigo e devolve a sessao. Nao grava cookie: quem grava e a
 * fronteira — o caso de uso nao conhece HTTP.
 */
export async function confirmarCodigo(
  entrada: { readonly email: string; readonly codigo: string },
  agora = new Date(),
): Promise<Resultado<Sessao, ErroDeEntrada>> {
  const usuario = await acessoRepo.usuarioPorEmail(entrada.email);
  const registro = usuario === null ? null : await acessoRepo.codigoMaisRecente(entrada.email);

  const veredito = avaliar({
    codigoDigitado: entrada.codigo,
    registro:
      registro === null
        ? null
        : {
            expiraEm: registro.expiraEm,
            usadoEm: registro.usadoEm,
            tentativas: registro.tentativas,
            confere: registro.codigoHash === hashDoCodigo(entrada.email, entrada.codigo),
          },
    agora,
  });

  if (!veredito.ok) {
    // Tentativa errada conta, mesmo quando o motivo foi outro: e o contador
    // que segura a forca bruta.
    if (registro !== null) await acessoRepo.contarTentativa(registro.id);
    return erro({ codigo: 'CODIGO_RECUSADO', motivo: veredito.motivo });
  }

  if (usuario === null || registro === null) {
    return erro({ codigo: 'CODIGO_RECUSADO', motivo: 'INEXISTENTE' });
  }

  /*
   * Qual porta? Quem e membro entra pelo estudio; quem tem cadastro de cliente
   * entra pela area do cliente. Nao existe as duas ao mesmo tempo: o membro
   * ganha, porque quem trabalha ali precisa da agenda inteira.
   */
  const tenants = await acessoRepo.tenantsDoUsuario(usuario.id);
  const primeiro = tenants[0];

  if (primeiro !== undefined) {
    await acessoRepo.marcarUsado(registro.id);
    return ok({
      usuarioId: usuario.id,
      tenantId: primeiro.tenant_id,
      fuso: primeiro.fuso,
      papel: 'estudio',
    });
  }

  const comoCliente = await acessoRepo.clienteDoUsuario(usuario.id);
  if (comoCliente === null) {
    return erro({ codigo: 'CODIGO_RECUSADO', motivo: 'INEXISTENTE' });
  }

  await acessoRepo.marcarUsado(registro.id);
  return ok({
    usuarioId: usuario.id,
    tenantId: comoCliente.tenant_id,
    fuso: comoCliente.fuso,
    papel: 'cliente',
    clienteId: comoCliente.cliente_id,
  });
}
