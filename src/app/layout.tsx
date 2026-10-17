import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AccessibilityProvider } from '@/context/AccessibilityContext';

export const metadata: Metadata = {
  title: 'ALIAKIT — Tu compañero de tareas accesible',
  description:
    'Aplicación educativa inteligente y accesible para chicos de 6 a 8 años. Explicación paso a paso de tareas escolares en español rioplatense.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 3, // Permitir zoom para accesibilidad visual
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased select-text min-h-screen">
        <AccessibilityProvider>{children}</AccessibilityProvider>
      </body>
    </html>
  );
}
