import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '../components/providers/SessionProvider';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import CookieConsentModal from '../components/ui/CookieConsentModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Broslunas Links',
  description: 'A modern URL shortener with analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
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
