import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto - Broslunas Links',
  description: 'Ponte en contacto con nosotros. Envíanos tus preguntas, sugerencias o comentarios sobre Broslunas Links.',
  keywords: ['contacto', 'soporte', 'ayuda', 'broslunas links', 'formulario contacto'],
  openGraph: {
    title: 'Contacto - Broslunas Links',
    description: 'Ponte en contacto con nosotros. Envíanos tus preguntas, sugerencias o comentarios.',
    type: 'website',
  },
  twitter: {
    title: 'Contacto - Broslunas Links',
    description: 'Ponte en contacto con nosotros. Envíanos tus preguntas, sugerencias o comentarios.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}