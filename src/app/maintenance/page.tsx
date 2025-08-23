'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Wrench, Clock, Home, RefreshCw, Settings, MessageCircle } from 'lucide-react';
import { useMaintenanceSimple } from '@/hooks/useMaintenanceSimple';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { gsap } from 'gsap';

const MaintenancePage: React.FC = () => {
    const {
        maintenanceState,
        loading,
    } = useMaintenanceSimple();


    const refresh = () => window.location.reload(); // Simple refresh
    const utils = {
        formatDuration: (minutes?: number) => minutes ? `${minutes} minutos` : 'No especificado'
    };

    // Refs para animaciones
    const heroRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const backgroundRef = useRef<HTMLDivElement>(null);

    // If maintenance is not active, redirect to home
    useEffect(() => {
        if (!loading && !maintenanceState.isActive) {
            window.location.href = '/';
        }
    }, [loading, maintenanceState.isActive]);

    // Animaciones GSAP
    useEffect(() => {
        if (!heroRef.current || !titleRef.current || !contentRef.current || !backgroundRef.current) return;

        const hero = heroRef.current;
        const title = titleRef.current;
        const content = contentRef.current;
        const background = backgroundRef.current;

        // Configuración inicial
        gsap.set([title, content], { opacity: 0, y: 100 });
        gsap.set(background, { scale: 1.2, opacity: 0 });

        // Timeline principal
        const masterTl = gsap.timeline({ delay: 0.3 });

        // Animación del fondo
        masterTl.to(background, {
            scale: 1,
            opacity: 1,
            duration: 1.5,
            ease: 'power2.out',
        });

        // Animación del título
        masterTl.to(
            title,
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out',
            },
            '-=1'
        );

        // Animación del contenido
        masterTl.to(
            content,
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
            },
            '-=0.5'
        );

        // Partículas flotantes
        const createFloatingElements = () => {
            for (let i = 0; i < 15; i++) {
                const particle = document.createElement('div');
                particle.className = 'absolute w-2 h-2 bg-blue-400/20 rounded-full';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                hero.appendChild(particle);

                gsap.to(particle, {
                    y: -100,
                    x: Math.random() * 200 - 100,
                    opacity: 0,
                    duration: Math.random() * 4 + 3,
                    repeat: -1,
                    delay: Math.random() * 2,
                    ease: 'power1.out',
                });
            }
        };

        createFloatingElements();

        return () => {
            // Cleanup
            const particles = hero.querySelectorAll('.absolute.w-2.h-2');
            particles.forEach(particle => particle.remove());
        };
    }, [loading]);

    if (loading) {
        return (
            <div className="min-h-screen overflow-hidden">
                {/* Fondo animado */}
                <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40 pointer-events-none" />

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <RefreshCw className="h-10 w-10 text-white animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Verificando estado del sistema...
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Un momento por favor
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-hidden">
            {/* Fondo animado */}
            <div
                ref={backgroundRef}
                className="fixed inset-0 bg-gradient-to-br from-orange-900/20 via-red-900/20 to-pink-900/20 dark:from-orange-900/40 dark:via-red-900/40 dark:to-pink-900/40 pointer-events-none"
            />

            {/* Global Header */}
            <GlobalHeader currentPath="/maintenance" />

            <div className="relative z-10">
                {/* Hero Section */}
                <section
                    ref={heroRef}
                    className="relative min-h-screen flex items-center justify-center overflow-hidden"
                >
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h1
                            ref={titleRef}
                            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8"
                        >
                            <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                                Mantenimiento
                            </span>
                            <br />
                            <span className="text-gray-900 dark:text-white">en Progreso</span>
                        </h1>

                        <div
                            ref={contentRef}
                            className="space-y-8"
                        >
                            {/* Status Card */}
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 max-w-2xl mx-auto">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-red-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Settings className="h-8 w-8 text-white animate-pulse" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    Sistema Temporalmente No Disponible
                                </h2>

                                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                    {maintenanceState.message ||
                                        'Estamos realizando tareas de mantenimiento para mejorar tu experiencia. El servicio estará disponible nuevamente en breve.'}
                                </p>

                                {maintenanceState.estimatedDuration && (
                                    <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 mb-6">
                                        <Clock className="h-5 w-5" />
                                        <span className="font-medium">
                                            Duración estimada: {utils.formatDuration(maintenanceState.estimatedDuration)}
                                        </span>
                                    </div>
                                )}

                                {/* What's happening */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Wrench className="h-5 w-5 text-orange-600" />
                                        ¿Qué está pasando?
                                    </h3>
                                    <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                                        <li className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <span>Actualizaciones de seguridad y rendimiento</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <span>Mejoras en la experiencia de usuario</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <span>Optimización de la base de datos</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <span>Implementación de nuevas funcionalidades</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Button
                                        onClick={refresh}
                                        size="lg"
                                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold transform hover:scale-105 transition-all duration-300"
                                        aria-label="Verificar el estado actual del mantenimiento"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Verificar Estado
                                    </Button>

                                    <Link href="/contacto" target="_blank" rel="noopener noreferrer">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold transform hover:scale-105 transition-all duration-300"
                                        >
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Contactar Soporte
                                        </Button>
                                    </Link>

                                    <Link href="/">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="w-full border-2 border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white font-semibold transform hover:scale-105 transition-all duration-300"
                                        >
                                            <Home className="h-4 w-4 mr-2" />
                                            Página Principal
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 text-lg">
                                Gracias por tu paciencia mientras mejoramos nuestros servicios.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Info Section */}
                <section className="relative py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                            <p className="text-gray-600 dark:text-gray-300 mb-2">
                                Esta página se actualiza automáticamente cada 30 segundos
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                ¿Necesitas ayuda?{' '}
                                <Link
                                    href="/help"
                                    className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors hover:underline"
                                >
                                    Visita nuestro centro de ayuda
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Global Footer */}
            <GlobalFooter />
        </div>
    );
};

export default MaintenancePage;