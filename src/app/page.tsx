import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/shared/tenancy/sessao';

// Le o cookie para saber para onde mandar: nao da para prerenderizar.
export const dynamic = 'force-dynamic';

export default async function Raiz() {
  const sessao = await sessaoAtual();
  if (sessao === null) redirect('/entrar');
  // Cada papel tem a sua casa: o estudio ve o dia, o cliente ve o proprio horario.
  redirect(sessao.papel === 'cliente' ? '/cliente' : '/hoje');
}
