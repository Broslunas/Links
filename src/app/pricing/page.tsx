import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Precios y Planes',
  description: 'Descubre nuestros planes de precios flexibles para el acortador de URLs Broslunas Links. Desde planes gratuitos hasta soluciones empresariales.',
  keywords: ['precios', 'planes', 'tarifas', 'acortador urls', 'suscripción', 'gratis', 'premium', 'empresarial'],
  openGraph: {
    title: 'Precios y Planes - Broslunas Links',
    description: 'Planes flexibles para todas tus necesidades de acortamiento de enlaces. Desde opciones gratuitas hasta soluciones empresariales.',
  },
  twitter: {
    title: 'Precios y Planes - Broslunas Links',
    description: 'Planes flexibles para todas tus necesidades de acortamiento de enlaces. Desde opciones gratuitas hasta soluciones empresariales.',
  },
};

export default function PricingPage() {
  const plans = [
    {
      name: 'Normal',
      price: 'Gratis',
      description: 'Perfecto para uso personal',
      features: [
        '100 enlaces por mes',
        'Análisis básicos',
        'Enlaces personalizados',
        'Soporte por email',
        'Historial de 30 días'
      ],
      buttonText: 'Comenzar Gratis',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      name: 'Plus',
      price: '5€',
      period: '/mes',
      description: 'Ideal para profesionales',
      features: [
        '1,000 enlaces por mes',
        'Análisis avanzados',
        'Enlaces personalizados',
        'Códigos QR',
        'Soporte prioritario',
        'Historial ilimitado',
        'API básica'
      ],
      buttonText: 'Elegir Plus',
      buttonVariant: 'default' as const,
      popular: true
    },
    {
      name: 'Pro',
      price: '10€',
      period: '/mes',
      description: 'Para equipos y empresas',
      features: [
        '10,000 enlaces por mes',
        'Análisis completos',
        'Enlaces personalizados',
        'Códigos QR avanzados',
        'Soporte 24/7',
        'Historial ilimitado',
        'API completa',
        'Integraciones',
        'Reportes exportables'
      ],
      buttonText: 'Elegir Pro',
      buttonVariant: 'default' as const,
      popular: false
    },
    {
      name: 'Enterprise',
      price: 'Contactar',
      description: 'Soluciones empresariales',
      features: [
        'Enlaces ilimitados',
        'Análisis personalizados',
        'Dominio personalizado',
        'Códigos QR premium',
        'Soporte dedicado',
        'API empresarial',
        'SSO y seguridad avanzada',
        'Integraciones personalizadas',
        'SLA garantizado'
      ],
      buttonText: 'Contactar Ventas',
      buttonVariant: 'outline' as const,
      popular: false,
      isEnterprise: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Precios
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Planes flexibles para todas tus necesidades de acortamiento de enlaces
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 ${
                  plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Más Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-600 dark:text-gray-300">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  {plan.isEnterprise ? (
                    <a href="https://broslunas.com/contacto" target="_blank" rel="noopener noreferrer">
                      <Button variant={plan.buttonVariant} size="lg" className="w-full">
                        {plan.buttonText}
                      </Button>
                    </a>
                  ) : (
                    <Link href="/auth/signin">
                      <Button variant={plan.buttonVariant} size="lg" className="w-full">
                        {plan.buttonText}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Preguntas Frecuentes
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Puedo cambiar de plan en cualquier momento?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu panel de control.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Qué métodos de pago aceptan?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Aceptamos tarjetas de crédito, PayPal y transferencias bancarias para planes empresariales.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Hay descuentos por pago anual?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Sí, ofrecemos 2 meses gratis al pagar anualmente en los planes Plus y Pro.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Qué incluye el soporte?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Todos los planes incluyen soporte por email. Los planes pagos tienen soporte prioritario y 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}