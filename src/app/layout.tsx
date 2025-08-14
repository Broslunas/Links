import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '../components/providers/SessionProvider';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import CookieConsentModal from '../components/ui/CookieConsentModal';
import { ConditionalLayout } from '../components/layout/ConditionalLayout';

const inter = Inter({ subsets: ['latin'] });

const baseUrl = process.env.NEXTAUTH_URL || 'https://broslunas.link';

export const metadata: Metadata = {
  title: {
    default: 'Broslunas Links - Acortador de URLs Moderno',
    template: '%s | Broslunas Links',
  },
  description:
    'Un acortador de URLs moderno con análisis avanzados, dominios personalizados y potentes funciones de gestión de enlaces. Crea, rastrea y optimiza tus enlaces.',
  keywords: [
    'acortador de urls',
    'acortador de enlaces',
    'análisis',
    'dominios personalizados',
    'gestión de enlaces',
    'códigos qr',
  ],
  authors: [{ name: 'Equipo Broslunas Links' }],
  creator: 'Broslunas Links',
  publisher: 'Broslunas Links',
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: baseUrl,
    title: 'Broslunas Links - Acortador de URLs',
    description:
      'Un acortador de URLs moderno con análisis avanzados, dominios personalizados y potentes funciones de gestión de enlaces.',
    siteName: 'Broslunas Links',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Broslunas Links - Acortador de URLs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Broslunas Links - Acortador de URLs Moderno',
    description:
      'Un acortador de URLs moderno con análisis avanzados, dominios personalizados y potentes funciones de gestión de enlaces.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@broslunas',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="canonical" href={baseUrl} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider>
            <SessionProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
              <CookieConsentModal />
            </SessionProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
