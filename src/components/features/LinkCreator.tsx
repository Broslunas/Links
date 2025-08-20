'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '../ui';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ApiResponse, CreateLinkData } from '../../types';
import { handleFetchError, showSuccessToast, withToastHandler } from '../../lib/client-error-handler';
import { isValidUrl, isValidSlug } from '../../lib/validations';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';

interface LinkCreatorProps {
  onLinkCreated?: (link: any) => void;
  onError?: (error: string) => void;
}

interface FormData {
  originalUrl: string;
  slug: string;
  title: string;
  description: string;
  isPublicStats: boolean;
  customDomain: string;
}

interface FormErrors {
  originalUrl?: string;
  slug?: string;
  title?: string;
  description?: string;
  customDomain?: string;
}

export function LinkCreator({ onLinkCreated, onError }: LinkCreatorProps) {
  const [userPreferences, setUserPreferences] = useState<{ defaultPublicStats: boolean } | null>(null);
  const [domains, setDomains] = useState<Array<{ _id: string; domain: string; isVerified: boolean; isActive: boolean }>>([]);
  const [formData, setFormData] = useState<FormData>({
    originalUrl: '',
    slug: '',
    title: '',
    description: '',
    isPublicStats: false,
    customDomain: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Cargar preferencias del usuario y dominios al montar el componente
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const result = await response.json();
          const preferences = result.data || result;
          setUserPreferences(preferences);
          // Actualizar el formulario con las preferencias por defecto
          setFormData(prev => ({
            ...prev,
            isPublicStats: preferences.defaultPublicStats || false
          }));
        } else {
          setUserPreferences({ defaultPublicStats: false });
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
        // Si hay error, usar valores por defecto
        setUserPreferences({ defaultPublicStats: false });
      }
    };

    const loadDomains = async () => {
      try {
        const response = await fetch('/api/domains');
        if (response.ok) {
          const result = await response.json();
          const domainsData = result.data || [];
          // Solo mostrar dominios verificados y activos
          const activeDomains = domainsData.filter((domain: any) => domain.isVerified && domain.isActive);
          setDomains(activeDomains);
        }
      } catch (error) {
        console.error('Error loading domains:', error);
      }
    };

    loadUserPreferences();
    loadDomains();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate URL
    if (!formData.originalUrl.trim()) {
      newErrors.originalUrl = 'La URL es obligatoria';
    } else {
      // Basic URL validation
      const urlPattern =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      const urlWithProtocol = formData.originalUrl.startsWith('http')
        ? formData.originalUrl
        : `https://${formData.originalUrl}`;

      try {
        new URL(urlWithProtocol);
      } catch {
        if (!urlPattern.test(formData.originalUrl)) {
          newErrors.originalUrl = 'Por favor, introduzca una URL válida';
        }
      }
    }

    // Validate custom slug if provided
    if (formData.slug.trim()) {
      if (!/^[a-z0-9-_]+$/.test(formData.slug)) {
        newErrors.slug =
          'El slug solo puede contener letras minúsculas, números, guiones y guiones bajos';
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
      newErrors.description =
        'La descripción debe tener 500 caracteres o menos';
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
        customDomain: formData.customDomain.trim() || undefined,
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
        setFormData({
          originalUrl: '',
          slug: '',
          title: '',
          description: '',
          isPublicStats: userPreferences?.defaultPublicStats || false,
          customDomain: '',
        });
        setShowAdvanced(false);
        onLinkCreated?.(linkData);
      },
      onError: (error) => {
        onError?.(error.message || 'Error al crear el enlace');
      }
    });

    setIsLoading(false);
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
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
       
       // Limpiar error de slug si existía
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
          isPublicStats: userPreferences?.defaultPublicStats || false,
          customDomain: ''
        });
        setErrors({});
        setShowAdvanced(false);
     };

  if (createdLink) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="text-center space-y-4">
          <div className="p-3 bg-green-500/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Link Created Successfully!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your short link is ready to use
            </p>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Short URL
              </label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm bg-background rounded px-3 py-2 border">
                  {createdLink.shortUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(createdLink.shortUrl)}
                >
                  Copiar
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Enlace Original
              </label>
              <div className="text-sm text-card-foreground mt-1 break-all">
                {createdLink.originalUrl}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={resetForm}>Crear otro enlace</Button>
            <Button
              variant="outline"
              onClick={() => window.open(createdLink.shortUrl, '_blank')}
            >
              Probar enlace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-destructive">Error en el Formulario</h3>
            <p className="text-muted-foreground">
              No se pudo cargar el formulario de creación de enlaces.
            </p>
            <Button onClick={resetError} size="sm">
              Intentar de nuevo
            </Button>
          </div>
        </div>
      )}
    >
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Crea tu enlace
          </h2>
          <p className="text-sm text-muted-foreground">
            Introduce una URL para crear un enlace acortado que puedas compartir
            fácilmente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Enlace"
            placeholder="https://mi.enlace.largo/KhigUGgpUYGyugIYUGO"
            value={formData.originalUrl}
            onChange={e => handleInputChange('originalUrl', e.target.value)}
            error={errors.originalUrl}
            required
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Opciones Avanzadas
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="Enlace personalizado (opcional)"
                    placeholder="mi-enlace-personalizado"
                    value={formData.slug}
                    onChange={e =>
                      handleInputChange('slug', e.target.value.toLowerCase())
                    }
                    error={errors.slug}
                    helperText="Déjelo en blanco para generarlo automáticamente. Solo se permiten letras minúsculas, números, guiones y guiones bajos."
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSlugWithAI}
                    disabled={isGeneratingSlug || !formData.originalUrl}
                    className="mb-6 px-3 py-2 h-10"
                  >
                    {isGeneratingSlug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {!formData.originalUrl && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Ingresa una URL primero para generar un slug con IA
                </p>
              )}
            </div>

            <div>
              <Input
                label="Título (opcional)"
                placeholder="Título de mi enlace"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                error={errors.title}
                helperText={`${formData.title.length}/200 caracteres`}
              />
            </div>

            <div>
              <Input
                label="Descripcion (opcional)"
                placeholder="Breve descripción del enlace"
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

            {domains.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Dominio personalizado (opcional)
                </label>
                <select
                  value={formData.customDomain}
                  onChange={e => handleInputChange('customDomain', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Usar dominio por defecto</option>
                  {domains.map(domain => (
                    <option key={domain._id} value={domain.domain}>
                      {domain.domain}
                    </option>
                  ))}
                </select>
                {formData.customDomain && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tu enlace será: {formData.customDomain}/{formData.slug || 'tu-slug'}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="publicStats"
                checked={formData.isPublicStats}
                onChange={e =>
                  handleInputChange('isPublicStats', e.target.checked)
                }
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label
                htmlFor="publicStats"
                className="text-sm text-card-foreground"
              >
                Permitir estadísticas públicas
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creando...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Crear enlace
              </>
            )}
          </Button>

          {(formData.originalUrl ||
            formData.slug ||
            formData.title ||
            formData.description) && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Borrar
            </Button>
          )}
        </div>
      </form>
      </div>
    </ErrorBoundary>
  );
}
