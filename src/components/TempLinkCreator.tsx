'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { CreateTempLinkResponse } from '@/types';
import { toast } from 'sonner';
import { Sparkles, Loader2, Copy, Clock, Shield, Zap } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function TempLinkCreator() {
    const [url, setUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
    const [result, setResult] = useState<CreateTempLinkResponse | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    // GSAP Animations
    useEffect(() => {
        const container = containerRef.current;
        const title = titleRef.current;
        const form = formRef.current;
        
        if (!container || !title || !form) return;

        // Set initial states
        gsap.set(container, {
            opacity: 0,
            y: 50,
            scale: 0.95
        });

        gsap.set(title, {
            opacity: 0,
            y: -30
        });

        gsap.set(form.children, {
            opacity: 0,
            y: 30
        });

        // Create timeline for entrance animation
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: container,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });

        tl.to(container, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.7)"
        })
        .to(title, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out"
        }, "-=0.4")
        .to(form.children, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out"
        }, "-=0.3");

        // Floating animation
        gsap.to(container, {
            y: "-=10",
            duration: 3,
            ease: "power1.inOut",
            yoyo: true,
            repeat: -1
        });

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    // Result animation
    useEffect(() => {
        if (result && resultRef.current) {
            gsap.fromTo(resultRef.current, 
                {
                    opacity: 0,
                    scale: 0.8,
                    y: 30
                },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.6,
                    ease: "back.out(1.7)"
                }
            );
        }
    }, [result]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            toast.error('Por favor ingresa una URL');
            return;
        }

        setIsLoading(true);

        // Loading animation
        if (formRef.current) {
            gsap.to(formRef.current, {
                scale: 0.98,
                duration: 0.2,
                yoyo: true,
                repeat: 1
            });
        }

        try {
            const response = await fetch('/api/temp-links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalUrl: url.trim(),
                    slug: slug.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Error creating temporary link');
            }

            if (data.success && data.data) {
                setResult(data.data);
                setUrl('');
                setSlug('');
                toast.success('¡Enlace temporal creado exitosamente!');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error creating temp link:', error);
            toast.error(error instanceof Error ? error.message : 'Error creating temporary link');
        } finally {
            setIsLoading(false);
        }
    };

    const generateSlugWithAI = async () => {
        if (!url.trim()) {
            toast.error('Por favor ingresa una URL primero');
            return;
        }

        setIsGeneratingSlug(true);
        try {
            const response = await fetch('/api/ai/generate-slug', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error generando slug con IA');
            }

            setSlug(data.slug);
            toast.success('¡Slug generado con IA!');
        } catch (error) {
            console.error('Error generating slug with AI:', error);
            toast.error(error instanceof Error ? error.message : 'Error generando slug con IA');
        } finally {
            setIsGeneratingSlug(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('¡Enlace copiado al portapapeles!');
        } catch (error) {
            toast.error('Error al copiar el enlace');
        }
    };

    const formatExpirationTime = (expiresAt: Date) => {
        const now = new Date();
        const expiration = new Date(expiresAt);
        const diffMs = expiration.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes}m`;
        }
        return `${diffMinutes}m`;
    };

    return (
        <div 
            ref={containerRef}
            className="relative group"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl transform group-hover:scale-105 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl" />
            
            {/* Floating Orbs */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20">
                <div className="text-center mb-8">
                    <h3 
                        ref={titleRef}
                        className="text-3xl md:text-4xl font-bold mb-4"
                    >
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Enlace Temporal
                        </span>
                        <br />
                        <span className="text-gray-900 dark:text-white text-2xl">Rápido y Seguro</span>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                        Crea un enlace corto que expira automáticamente en 24 horas. 
                        <br className="hidden md:block" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">No requiere registro.</span>
                    </p>
                </div>

                {!result ? (
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="temp-url" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                URL a acortar *
                            </label>
                            <div className="relative group">
                                <Input
                                    id="temp-url"
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://ejemplo.com/mi-enlace-largo"
                                    required
                                    disabled={isLoading}
                                    className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                                />
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300">
                                    <Zap className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="temp-slug" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Slug personalizado (opcional)
                            </label>
                            <div className="flex gap-3">
                                <div className="relative flex-1 group">
                                    <Input
                                        id="temp-slug"
                                        type="text"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="mi-enlace"
                                        disabled={isLoading || isGeneratingSlug}
                                        pattern="[a-z0-9-_]+"
                                        title="Solo letras minúsculas, números, guiones y guiones bajos"
                                        className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={generateSlugWithAI}
                                    disabled={isLoading || isGeneratingSlug || !url.trim()}
                                    className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 min-w-[120px]"
                                >
                                    {isGeneratingSlug ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5 mr-2" />
                                            IA
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Usa IA para generar un slug descriptivo basado en tu URL
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            size="lg"
                            className="w-full py-4 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-6 w-6 mr-3" />
                                    Crear Enlace Temporal
                                </>
                            )}
                        </Button>
                    </form>
                ) : (
                    <div ref={resultRef} className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-3xl p-6">
                            {/* Success Background Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 animate-pulse" />
                            
                            <div className="relative">
                                <h4 className="font-bold text-2xl text-green-800 dark:text-green-200 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-white" />
                                    </div>
                                    ¡Enlace creado exitosamente!
                                </h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                                            Enlace corto:
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <code className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 rounded-xl border-2 border-green-200 dark:border-green-700 text-lg font-mono">
                                                {result.shortUrl}
                                            </code>
                                            <Button
                                                size="lg"
                                                onClick={() => copyToClipboard(result.shortUrl)}
                                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                            >
                                                <Copy className="h-5 w-5 mr-2" />
                                                Copiar
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                            <Clock className="h-4 w-4" />
                                            <span><strong>Expira en:</strong> {formatExpirationTime(result.expiresAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                            <Shield className="h-4 w-4" />
                                            <span><strong>Token:</strong> {result.token.substring(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => {
                                setResult(null);
                                setUrl('');
                                setSlug('');
                            }}
                            className="w-full py-4 text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transform hover:scale-105 transition-all duration-300"
                        >
                            Crear Otro Enlace
                        </Button>
                    </div>
                )}

                {/* Features */}
                <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                        <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Expira en 24h</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                        <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Sin registro</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20">
                        <Zap className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                        <span className="text-sm font-medium text-pink-800 dark:text-pink-200">5 por hora</span>
                    </div>
                </div>
            </div>
        </div>
    );
}