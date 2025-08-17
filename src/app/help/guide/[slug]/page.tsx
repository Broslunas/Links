import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { guides } from '@/data/help-center/faq-data';

interface GuidePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = guides.find(g => g.slug === params.slug);
  
  if (!guide) {
    return {
      title: 'Guía no encontrada - Centro de Ayuda',
      description: 'La guía solicitada no existe.'
    };
  }

  return {
    title: `${guide.title} - Centro de Ayuda`,
    description: guide.description,
    openGraph: {
      title: `${guide.title} - Centro de Ayuda`,
      description: guide.description,
      type: 'article'
    }
  };
}

export async function generateStaticParams() {
  return guides.map((guide) => ({
    slug: guide.slug,
  }));
}

export default function GuidePage({ params }: GuidePageProps) {
  const guide = guides.find(g => g.slug === params.slug);

  if (!guide) {
    notFound();
  }

  const estimatedReadTime = Math.ceil(guide.steps.length * 2); // 2 minutos por paso aproximadamente

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navegación de regreso */}
        <div className="mb-6">
          <Link href="/help" className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Centro de Ayuda
          </Link>
        </div>

        {/* Header de la guía */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Tag className="w-3 h-3 mr-1" />
              {guide.category}
            </span>
            <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              {estimatedReadTime} min de lectura
            </span>
            <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
              <User className="w-4 h-4 mr-1" />
              Nivel: {guide.difficulty}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {guide.title}
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            {guide.description}
          </p>
        </div>

        {/* Contenido de la guía */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {guide.steps.map((step, index) => (
              <div key={index} className="mb-8 last:mb-0">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <div className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {step.content.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-3 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {step.code && (
                      <div className="mt-4">
                        <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                          <code className="text-sm text-gray-800 dark:text-gray-200">
                            {step.code}
                          </code>
                        </pre>
                      </div>
                    )}
                    {step.tip && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>💡 Consejo:</strong> {step.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navegación al final */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          <Link href="/help/getting-started" className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Primeros Pasos
          </Link>
          
          <div className="flex gap-2">
            <Link href="/help" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
              Explorar más guías
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}