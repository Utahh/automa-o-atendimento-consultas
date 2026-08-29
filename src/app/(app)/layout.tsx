// Direto do arquivo, pelo mesmo motivo das telas: a casca e um Client
// Component renderizado por um layout de servidor, e o barril misto entre
// os dois quebra o manifest no prerender de producao.
import { AppShell } from '@/shared/ui/layout/AppShell';

/**
 * A area logada inteira mora dentro da casca. Nada de header proprio por tela:
 * quem monta o titulo e o <Page> de cada uma.
 */
export default function LayoutDoApp({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
