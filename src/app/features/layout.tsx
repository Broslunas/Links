import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Características y Funcionalidades',
  description: 'Descubre todas las características avanzadas de Broslunas Links: acortador de URLs, análisis detallados, dominios personalizados, códigos QR y más.',
  keywords: ['características', 'funcionalidades', 'acortador urls', 'análisis', 'dominios personalizados', 'códigos qr'],
  openGraph: {
    title: 'Características - Broslunas Links',
    description: 'Descubre todas las características avanzadas de nuestro acortador de URLs con análisis detallados y funcionalidades premium.',
  },
  twitter: {
    title: 'Características - Broslunas Links',
    description: 'Descubre todas las características avanzadas de nuestro acortador de URLs con análisis detallados y funcionalidades premium.',
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}