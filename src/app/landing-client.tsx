'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TempLinkCreator } from '@/components/TempLinkCreator';
import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { GlobalStats } from './api/stats/global/route';

interface LandingClientProps {
  session: Session | null;
  globalStats: GlobalStats;
}

const FeatureCard = ({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100/50 dark:border-gray-700/50 overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon */}
      <div className="relative z-10 w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

const StatCard = ({
  number,
  label,
  color,
  delay = 0,
}: {
  number: string;
  label: string;
  color: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible && number !== '99.9%') {
      const target = parseInt(number.replace(/[^0-9]/g, ''));
      if (target > 0) {
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current));
          }
        }, duration / steps);

        return () => clearInterval(timer);
      }
    }
  }, [isVisible, number]);

  const displayValue =
    number === '99.9%'
      ? number
      : count > 0
        ? `${count.toLocaleString()}+`
        : '0';

  return (
    <div
      className={`text-center transform transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      <div className={`text-4xl md:text-5xl font-bold ${color} mb-2`}>
        {displayValue}
      </div>
      <div className="text-gray-600 dark:text-gray-400 font-medium">
        {label}
      </div>
    </div>
  );
};

export default function LandingClient({
  session,
  globalStats,
}: LandingClientProps) {
  const [headerVisible, setHeaderVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setHeaderVisible(true);
    const timer = setTimeout(() => setHeroVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
      title: 'Acortamiento Inteligente',
      description:
        'URLs personalizables con dominios propios y aliases únicos para una mejor marca personal y profesional.',
      delay: 100,
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'Análisis Avanzado',
      description:
        'Estadísticas detalladas con geolocalización, dispositivos, referrers y análisis temporal en tiempo real.',
      delay: 200,
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      title: 'Códigos QR Dinámicos',
      description:
        'Genera códigos QR personalizables que se actualizan automáticamente con tus enlaces y diseños únicos.',
      delay: 300,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`text-center transform transition-all duration-1000 ${headerVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
                }`}
            >
              <h1 className="text-6xl md:text-8xl font-bold mb-8">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Broslunas
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">Links</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                El acortador de URLs más avanzado con análisis en tiempo real,
                códigos QR dinámicos
                <br className="hidden md:block" />y gestión profesional de
                enlaces para maximizar tu impacto digital.
              </p>

              <div
                className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 transform transition-all duration-1000 delay-300 ${heroVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
                  }`}
              >
                {session ? (
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="text-lg px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      Ir al Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/signin">
                      <Button
                        size="lg"
                        className="text-lg px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        Comenzar Gratis
                      </Button>
                    </Link>

                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Números que Impresionan
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                La confianza de miles de usuarios en cifras reales
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
              <StatCard
                number={globalStats.totalLinks.toString()}
                label="Enlaces Creados"
                color="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent"
                delay={200}
              />
              <StatCard
                number={globalStats.totalClicks.toString()}
                label="Clics Registrados"
                color="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent"
                delay={400}
              />
              <StatCard
                number={globalStats.activeUsers.toString()}
                label="Usuarios Activos"
                color="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent"
                delay={600}
              />
              <StatCard
                number={globalStats.uptime}
                label="Tiempo Activo"
                color="bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent"
                delay={800}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Características
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">
                  Principales
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Todo lo que necesitas para gestionar tus enlaces de forma
                profesional
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>

            <div className="text-center">
              <Link href="/features">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold transform hover:scale-105 transition-all duration-200"
                >
                  Ver Todas las Características
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Try It Now Section */}
        {!session && (
          <section className="py-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5" />
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-gray-100/50 dark:border-gray-700/50">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      Pruébalo Ahora
                    </span>
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">
                    Crea tu primer enlace temporal sin necesidad de registro
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <TempLinkCreator />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  ¿Listo para optimizar tus enlaces?
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Únete a miles de usuarios que ya confían en Broslunas Links
                  <br className="hidden md:block" />
                  para gestionar sus URLs de forma profesional
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  {!session && (
                    <>
                      <Link href="/auth/signin">
                        <Button
                          size="lg"
                          className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-10 py-5 text-lg transform hover:scale-105 transition-all duration-200"
                        >
                          Crear Cuenta Gratis
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
