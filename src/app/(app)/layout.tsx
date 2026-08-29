import { redirect } from 'next/navigation';
import { AppShell } from '@/shared/ui/layout/AppShell';
import { sessaoAtual } from '@/shared/tenancy/sessao';

/**
 * A guarda da area logada. Sem sessao, ninguem passa daqui — e nenhuma tela
 * dentro precisa se preocupar com isso de novo.
 */
export default async function LayoutDoApp({ children }: { children: React.ReactNode }) {
  if ((await sessaoAtual()) === null) redirect('/entrar');

  return <AppShell>{children}</AppShell>;
}
