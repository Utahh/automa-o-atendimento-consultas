import { redirect } from 'next/navigation';
import { AppShell } from '@/shared/ui/layout/AppShell';
import { sessaoAtual } from '@/shared/tenancy/sessao';

/**
 * A guarda da area do estudio.
 *
 * Nao basta ter sessao: precisa ser sessao DE ESTUDIO. Cliente com conta
 * existe dentro do mesmo tenant (ADR-001), e sem esta linha ele abriria a
 * agenda inteira so digitando o endereco. O banco ainda barraria a leitura,
 * mas a tela nao deveria nem existir para ele.
 */
export default async function LayoutDoApp({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoAtual();
  if (sessao === null) redirect('/entrar');
  if (sessao.papel !== 'estudio') redirect('/cliente');

  return <AppShell>{children}</AppShell>;
}
