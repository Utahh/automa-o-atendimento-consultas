import type { Metadata, Viewport } from 'next';
import { brand } from '@/shared/config/brand';
import './globals.css';

export const metadata: Metadata = {
  title: { default: brand.name, template: '%s · ' + brand.name },
  description: brand.tagline,
  applicationName: brand.name,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icone-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoom de 200% e requisito (WCAG 1.4.4), nao cortesia: nada de maximumScale.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B141B' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        {/*
          O destino de todo portal. Camadas acima de 30 sao renderizadas aqui,
          no fim do body, para escapar de qualquer overflow:hidden de um pai —
          a causa classica de menu cortado pela metade.
        */}
        <div id="overlays" />
      </body>
    </html>
  );
}
