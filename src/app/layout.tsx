import type { Metadata, Viewport } from 'next';
import { textos } from '@/shared/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: textos.app.nome,
  description: textos.app.descricao,
  applicationName: textos.app.nome,
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoom de 200% é requisito (WCAG 1.4.4), não cortesia: nada de maximumScale.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        {/*
          O destino de todo portal. Camadas acima de 30 são renderizadas aqui,
          no fim do body, para escapar de qualquer overflow:hidden de um pai —
          a causa clássica de menu cortado pela metade.
        */}
        <div id="overlays" />
      </body>
    </html>
  );
}
