import { AppShell } from '@/shared/ui';

/**
 * A area logada inteira mora dentro da casca. Nada de header proprio por tela:
 * quem monta o titulo e o <Page> de cada uma.
 */
export default function LayoutDoApp({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
