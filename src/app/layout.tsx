import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '../components/providers/SessionProvider';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import CookieConsentModal from '../components/ui/CookieConsentModal';

const inter = Inter({ subsets: ['latin'] });

const baseUrl = process.env.NEXTAUTH_URL || 'https://brl-links.vercel.app';

export const metadata: Metadata = {
  title: {
    default: 'Broslunas Links - Modern URL Shortener',
    template: '%s | Broslunas Links'
  },
  description: 'A modern URL shortener with advanced analytics, custom domains, and powerful link management features. Create, track, and optimize your links.',
  keywords: ['url shortener', 'link shortener', 'analytics', 'custom domains', 'link management', 'qr codes'],
  authors: [{ name: 'Broslunas Links Team' }],
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
    title: 'Broslunas Links - Modern URL Shortener',
    description: 'A modern URL shortener with advanced analytics, custom domains, and powerful link management features.',
    siteName: 'Broslunas Links',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Broslunas Links - Modern URL Shortener',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Broslunas Links - Modern URL Shortener',
    description: 'A modern URL shortener with advanced analytics, custom domains, and powerful link management features.',
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
              {children}
              <CookieConsentModal />
            </SessionProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
