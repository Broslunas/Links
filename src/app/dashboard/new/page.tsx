'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ToastContainer } from '../../../components/ui';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
import { ApiResponse, CreateLinkData } from '../../../types';
import { handleFetchError, withToastHandler } from '../../../lib/client-error-handler';
import { isValidUrl } from '../../../lib/validations';
import { toast } from 'sonner';
import {
    Link as LinkIcon,
    Sparkles,
    Loader2,
    Copy,
    ExternalLink,
    Settings,
    Eye,
    EyeOff,
    ArrowLeft,
    CheckCircle,
    Globe,
    Hash,
    FileText,
    MessageSquare
} from 'lucide-react';

interface FormData {
    originalUrl: string;
    slug: string;
    title: string;
    description: string;
    isPublicStats: boolean;
}

interface FormErrors {
    originalUrl?: string;
    slug?: string;
    title?: string;
    description?: string;
}

export default function NewLinkPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toasts, success, error } = useToast();

    const [userPreferences, setUserPreferences] = useState<{ defaultPublicStats: boolean } | null>(null);
    const [formData, setFormData] = useState<FormData>({
        originalUrl: '',
        slug: '',
        title: '',
        description: '',
        isPublicStats: false,
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
    const [createdLink, setCreatedLink] = useState<any>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Handle authentication
    useEffect(() => {
        if (status === 'unauthenticated') {
            window.location.href = '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
        }
    }, [status]);

    // Load user preferences
    useEffect(() => {
        const loadUserPreferences = async () => {
            try {
                const response = await fetch('/api/user/preferences');
                if (response.ok) {
                    const result = await response.json();
                    const preferences = result.data || result;
                    setUserPreferences(preferences);
                    setFormData(prev => ({
                        ...prev,
                        isPublicStats: preferences.defaultPublicStats || false
                    }));
                } else {
                    setUserPreferences({ defaultPublicStats: false });
                }
            } catch (error) {
                console.error('Error loading user preferences:', error);
                setUserPreferences({ defaultPublicStats: false });
            }
        };

        if (session?.user?.id) {
            loadUserPreferences();
        }
    }, [session?.user?.id]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Validate URL
        if (!formData.originalUrl.trim()) {
            newErrors.originalUrl = 'La URL es obligatoria';
        } else {
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            const urlWithProtocol = formData.originalUrl.startsWith('http')
                ? formData.originalUrl
                : `https://${formData.originalUrl}`;

            try {
                new URL(urlWithProtocol);
            } catch {
                if (!urlPattern.test(formData.originalUrl)) {
                    newErrors.originalUrl = 'Por favor, introduce una URL válida';
                }
            }
        }

        // Validate custom slug if provided
        if (formData.slug.trim()) {
            if (!/^[a-z0-9-_]+$/.test(formData.slug)) {
                newErrors.slug = 'El slug solo puede contener letras minúsculas, números, guiones y guiones bajos';
            } else if (formData.slug.length > 50) {
                newErrors.slug = 'El slug no puede tener más de 50 caracteres';
            } else if (formData.slug.length < 1) {
                newErrors.slug = 'El slug no puede estar vacío';
            }
        }

        // Validate title length
        if (formData.title.trim() && formData.title.length > 200) {
            newErrors.title = 'El título debe tener 200 caracteres o menos';
        }

        // Validate description length
        if (formData.description.trim() && formData.description.length > 500) {
            newErrors.description = 'La descripción debe tener 500 caracteres o menos';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const createLinkOperation = async () => {
            const createData: CreateLinkData = {
                originalUrl: formData.originalUrl.trim(),
                slug: formData.slug.trim() || undefined,
                title: formData.title.trim() || undefined,
                description: formData.description.trim() || undefined,
                isPublicStats: formData.isPublicStats,
            };

            const response = await fetch('/api/links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(createData),
            });

            if (!response.ok) {
                await handleFetchError(response, {
                    onValidationError: (details) => {
                        if (details?.errors) {
                            const newErrors: FormErrors = {};
                            details.errors.forEach((error: string) => {
                                if (error.includes('slug')) {
                                    newErrors.slug = error;
                                } else if (error.includes('originalUrl') || error.includes('URL')) {
                                    newErrors.originalUrl = error;
                                }
                            });
                            setErrors(newErrors);
                        }
                    }
                });
                throw new Error('Request failed');
            }

            const result: ApiResponse = await response.json();

            if (!result.success) {
                if (result.error?.code === 'SLUG_TAKEN') {
                    setErrors({ slug: result.error.message });
                    throw new Error(result.error.message);
                }
                throw new Error(result.error?.message || 'Error al crear el enlace');
            }

            return result.data;
        };

        setIsLoading(true);
        setErrors({});

        const result = await withToastHandler(createLinkOperation, {
            loadingMessage: 'Creando enlace...',
            successMessage: '¡Enlace creado exitosamente!',
            showLoading: true,
            showSuccess: true,
            showError: true,
            onSuccess: (linkData) => {
                setCreatedLink(linkData);
                success(`Enlace creado correctamente! ${linkData.shortUrl}`, 'Enlace creado');
            },
            onError: (error) => {
                error(error.message || 'Error al crear el enlace');
            }
        });

        setIsLoading(false);
    };

    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('¡Copiado al portapapeles!');
        } catch (error) {
            console.error('Error al copiar al portapapeles:', error);
            toast.error('Error al copiar al portapapeles');
        }
    };

    const generateSlugWithAI = async () => {
        if (!formData.originalUrl) {
            toast.error('Por favor ingresa una URL primero');
            return;
        }

        if (!isValidUrl(formData.originalUrl)) {
            toast.error('Por favor ingresa una URL válida');
            return;
        }

        setIsGeneratingSlug(true);
        try {
            const response = await fetch('/api/ai/generate-slug', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: formData.originalUrl }),
            });

            if (!response.ok) {
                throw new Error('Error al generar el slug');
            }

            const data = await response.json();
            setFormData(prev => ({ ...prev, slug: data.slug }));

            if (errors.slug) {
                setErrors(prev => ({ ...prev, slug: undefined }));
            }

            toast.success('¡Slug generado con IA!');
        } catch (error) {
            console.error('Error generating slug:', error);
            toast.error('Error al generar el slug con IA');
        } finally {
            setIsGeneratingSlug(false);
        }
    };

    const resetForm = () => {
        setCreatedLink(null);
        setFormData({
            originalUrl: '',
            slug: '',
            title: '',
            description: '',
            isPublicStats: userPreferences?.defaultPublicStats || false
        });
        setErrors({});
        setShowAdvanced(false);
    };

    const goToDashboard = () => {
        router.push('/dashboard');
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    // Success state
    if (createdLink) {
        return (
            <>
                <ToastContainer toasts={toasts} />

                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={goToDashboard}
                                aria-label="Volver al dashboard"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">¡Enlace Creado!</h1>
                                <p className="text-muted-foreground">Tu enlace está listo para usar</p>
                            </div>
                        </div>
                    </div>

                    {/* Success Card */}
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8">
                            <div className="text-center space-y-6">
                                <div className="p-4 bg-green-500/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                                    <CheckCircle className="h-10 w-10 text-green-500" />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-semibold text-card-foreground mb-2">
                                        ¡Enlace creado exitosamente!
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Tu enlace acortado está listo para compartir
                                    </p>
                                </div>

                                {/* Link Details */}
                                <div className="bg-muted rounded-lg p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                                            Enlace Acortado
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <code className="flex-1 text-lg bg-background rounded-lg px-4 py-3 border font-mono">
                                                {createdLink.shortUrl}
                                            </code>
                                            <Button
                                                size="sm"
                                                onClick={() => copyToClipboard(createdLink.shortUrl)}
                                                className="shrink-0"
                                            >
                                                <Copy className="h-4 w-4 mr-2" />
                                                Copiar
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                                            Enlace Original
                                        </label>
                                        <div className="text-sm text-card-foreground break-all bg-background rounded-lg px-4 py-3 border">
                                            {createdLink.originalUrl}
                                        </div>
                                    </div>

                                    {createdLink.title && (
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                                                Título
                                            </label>
                                            <div className="text-sm text-card-foreground bg-background rounded-lg px-4 py-3 border">
                                                {createdLink.title}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button onClick={resetForm} size="lg">
                                        <LinkIcon className="h-4 w-4 mr-2" />
                                        Crear otro enlace
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => window.open(createdLink.shortUrl, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Probar enlace
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={goToDashboard}
                                    >
                                        Ver en dashboard
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    // Form state
    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToDashboard}
                            aria-label="Volver al dashboard"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Crear Nuevo Enlace</h1>
                            <p className="text-muted-foreground">
                                Transforma cualquier URL larga en un enlace corto y fácil de compartir
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <ErrorBoundary
                    fallback={({ error, resetError }) => (
                        <Card className="max-w-2xl mx-auto">
                            <CardContent className="p-8">
                                <div className="text-center space-y-4">
                                    <h3 className="text-lg font-semibold text-destructive">Error en el Formulario</h3>
                                    <p className="text-muted-foreground">
                                        No se pudo cargar el formulario de creación de enlaces.
                                    </p>
                                    <Button onClick={resetError} size="sm">
                                        Intentar de nuevo
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                >
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <LinkIcon className="h-6 w-6 mr-3" />
                                Detalles del Enlace
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* URL Input */}
                                <div>
                                    <Input
                                        label="URL a acortar"
                                        placeholder="https://ejemplo.com/mi-enlace-muy-largo"
                                        value={formData.originalUrl}
                                        onChange={e => handleInputChange('originalUrl', e.target.value)}
                                        error={errors.originalUrl}
                                        required
                                    />
                                </div>

                                {/* Advanced Options Toggle */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                                    >
                                        <Settings className="h-4 w-4" />
                                        <span>Opciones Avanzadas</span>
                                        <svg
                                            className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* Advanced Options */}
                                {showAdvanced && (
                                    <div className="space-y-6 pt-4 border-t border-border">
                                        {/* Custom Slug */}
                                        <div>
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <Input
                                                        label="Enlace personalizado (opcional)"
                                                        placeholder="mi-enlace-personalizado"
                                                        value={formData.slug}
                                                        onChange={e => handleInputChange('slug', e.target.value.toLowerCase())}
                                                        error={errors.slug}
                                                        helperText="Solo letras minúsculas, números, guiones y guiones bajos"
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={generateSlugWithAI}
                                                        disabled={isGeneratingSlug || !formData.originalUrl}
                                                        className="mb-6 px-4 py-2 h-10"
                                                    >
                                                        {isGeneratingSlug ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Sparkles className="h-4 w-4 mr-2" />
                                                                IA
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                            {!formData.originalUrl && (
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                    <Hash className="h-3 w-3" />
                                                    Ingresa una URL primero para generar un slug con IA
                                                </p>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <div>
                                            <Input
                                                label="Título (opcional)"
                                                placeholder="Título descriptivo para tu enlace"
                                                value={formData.title}
                                                onChange={e => handleInputChange('title', e.target.value)}
                                                error={errors.title}
                                                helperText={`${formData.title.length}/200 caracteres`}
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <Input
                                                label="Descripción (opcional)"
                                                placeholder="Breve descripción del contenido del enlace"
                                                value={formData.description}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                    handleInputChange('description', e.target.value)
                                                }
                                                error={errors.description}
                                                helperText={`${formData.description.length}/500 caracteres`}
                                                multiline
                                                rows={3}
                                            />
                                        </div>

                                        {/* Public Stats Toggle */}
                                        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                                            <input
                                                type="checkbox"
                                                id="publicStats"
                                                checked={formData.isPublicStats}
                                                onChange={e => handleInputChange('isPublicStats', e.target.checked)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                                            />
                                            <div className="flex-1">
                                                <label htmlFor="publicStats" className="text-sm font-medium text-card-foreground flex items-center gap-2">
                                                    {formData.isPublicStats ? (
                                                        <Eye className="h-4 w-4" />
                                                    ) : (
                                                        <EyeOff className="h-4 w-4" />
                                                    )}
                                                    Permitir estadísticas públicas
                                                </label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Permite que otros vean las estadísticas de clicks de este enlace
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1"
                                        size="lg"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                                Creando enlace...
                                            </>
                                        ) : (
                                            <>
                                                <LinkIcon className="h-4 w-4 mr-2" />
                                                Crear enlace
                                            </>
                                        )}
                                    </Button>

                                    {(formData.originalUrl || formData.slug || formData.title || formData.description) && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                            size="lg"
                                        >
                                            Limpiar formulario
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </ErrorBoundary>
            </div>
        </>
    );
}