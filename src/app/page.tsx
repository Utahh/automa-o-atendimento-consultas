import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/shared/tenancy/sessao';

// Le o cookie para saber para onde mandar: nao da para prerenderizar.
export const dynamic = 'force-dynamic';

export default async function Raiz() {
  redirect((await sessaoAtual()) === null ? '/entrar' : '/hoje');
}
