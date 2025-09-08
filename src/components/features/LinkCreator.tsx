'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '../ui';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ApiResponse, CreateLinkData } from '../../types';
import {
  handleFetchError,
  showSuccessToast,
  withToastHandler,
} from '../../lib/client-error-handler';
import { isValidUrl, isValidSlug } from '../../lib/validations';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Link2,
  Settings,
  BarChart3,
  Clock,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  isTemporary: boolean;
  expirationType: 'duration' | 'date';
  temporaryDuration: string;
  customDuration: number;
  customDurationUnit: 'hours' | 'days';
  expirationDate: string;
  expirationTime: string;
  customDomain: string;
}

interface FormErrors {
  originalUrl?: string;
  slug?: string;
  title?: string;
  description?: string;
  customDuration?: string;
  expirationDate?: string;
  expirationTime?: string;
}

export function LinkCreator({ onLinkCreated, onError }: LinkCreatorProps) {
  const [userPreferences, setUserPreferences] = useState<{
    defaultPublicStats: boolean;
  } | null>(null);
  const [customDomains, setCustomDomains] = useState<Array<{
    id: string;
    domain: string;
    isDefault: boolean;
    isVerified: boolean;
  }>>([]);
  const [formData, setFormData] = useState<FormData>({
    originalUrl: '',
    slug: '',
    title: '',
    description: '',
    isPublicStats: false,
    isTemporary: false,
    expirationType: 'duration',
    temporaryDuration: '1h',
    customDuration: 1,
    customDurationUnit: 'days',
    expirationDate: '',
    expirationTime: '23:59',
    customDomain: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  // Steps configuration
  const steps = [
    { id: 'url', title: 'URL Principal', icon: Link2 },
    { id: 'customization', title: 'Personalización', icon: Settings },
    { id: 'options', title: 'Opciones', icon: BarChart3 },
    { id: 'review', title: 'Revisar', icon: Eye },
  ];

  // Cargar preferencias del usuario y dominios personalizados al montar el componente
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Cargar preferencias del usuario
        const preferencesResponse = await fetch('/api/user/preferences');
        if (preferencesResponse.ok) {
          const result = await preferencesResponse.json();
          const preferences = result.data || result;
          setUserPreferences(preferences);
          // Actualizar el formulario con las preferencias por defecto
          setFormData(prev => ({
            ...prev,
            isPublicStats: preferences.defaultPublicStats || false,
          }));
        } else {
          setUserPreferences({ defaultPublicStats: false });
        }

        // Cargar dominios personalizados
        const domainsResponse = await fetch('/api/domains');
        if (domainsResponse.ok) {
          const domainsResult = await domainsResponse.json();
          if (domainsResult.success && domainsResult.data) {
            const verifiedDomains = domainsResult.data.filter((domain: any) => domain.isVerified);
            setCustomDomains(verifiedDomains);
            
            // Si hay un dominio por defecto, seleccionarlo automáticamente
            const defaultDomain = verifiedDomains.find((domain: any) => domain.isDefault);
            if (defaultDomain) {
              setFormData(prev => ({
                ...prev,
                customDomain: defaultDomain.id,
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Si hay error, usar valores por defecto
        setUserPreferences({ defaultPublicStats: false });
      }
    };

    loadUserData();
  }, []);

  // Calcular la fecha mínima (hoy) y máxima (30 días desde hoy)
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

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

    // Validate expiration if temporary
    if (formData.isTemporary) {
      if (formData.expirationType === 'duration') {
        // Validate custom duration if custom is selected
        if (formData.temporaryDuration === 'custom') {
          if (formData.customDuration < 1) {
            newErrors.customDuration = 'La duración debe ser mayor a 0';
          } else if (
            formData.customDurationUnit === 'days' &&
            formData.customDuration > 30
          ) {
            newErrors.customDuration = 'La duración máxima es de 30 días';
          } else if (
            formData.customDurationUnit === 'hours' &&
            formData.customDuration > 720
          ) {
            newErrors.customDuration =
              'La duración máxima es de 720 horas (30 días)';
          }
        }
      } else {
        // Validate date and time
        if (!formData.expirationDate) {
          newErrors.expirationDate = 'La fecha de expiración es obligatoria';
        } else {
          const selectedDate = new Date(formData.expirationDate);
          const now = new Date();

          if (selectedDate <= now) {
            newErrors.expirationDate = 'La fecha debe ser futura';
          } else if (selectedDate > maxDate) {
            newErrors.expirationDate =
              'La fecha no puede ser mayor a 30 días desde hoy';
          }
        }

        if (!formData.expirationTime) {
          newErrors.expirationTime = 'La hora de expiración es obligatoria';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    const createLinkOperation = async () => {
      // Calcular fecha de expiración si es temporal
      let expiresAt: Date | undefined;
      if (formData.isTemporary) {
        if (formData.expirationType === 'duration') {
          const now = new Date();
          if (formData.temporaryDuration === 'custom') {
            const duration = formData.customDuration;
            const unit = formData.customDurationUnit;
            if (unit === 'hours') {
              expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000);
            } else {
              expiresAt = new Date(
                now.getTime() + duration * 24 * 60 * 60 * 1000
              );
            }
          } else {
            switch (formData.temporaryDuration) {
              case '1h':
                expiresAt = new Date(now.getTime() + 1 * 60 * 60 * 1000);
                break;
              case '12h':
                expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
                break;
              case '1d':
                expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                break;
            }
          }
        } else {
          // Usar fecha y hora exactas
          const dateTimeString = `${formData.expirationDate}T${formData.expirationTime}`;
          expiresAt = new Date(dateTimeString);
        }
      }

      const createData: CreateLinkData = {
        originalUrl: formData.originalUrl.trim(),
        slug: formData.slug.trim() || undefined,
        title: formData.title.trim() || undefined,
        description: formData.description.trim() || undefined,
        isPublicStats: formData.isPublicStats,
        isTemporary: formData.isTemporary,
        expiresAt: expiresAt,
        customDomainId: formData.customDomain || undefined,
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
          onValidationError: details => {
            if (details?.errors) {
              const newErrors: FormErrors = {};
              details.errors.forEach((error: string) => {
                if (error.includes('slug')) {
                  newErrors.slug = error;
                } else if (
                  error.includes('originalUrl') ||
                  error.includes('URL')
                ) {
                  newErrors.originalUrl = error;
                }
              });
              setErrors(newErrors);
            }
          },
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
      onSuccess: linkData => {
        setCreatedLink(linkData);
        setFormData({
          originalUrl: '',
          slug: '',
          title: '',
          description: '',
          isPublicStats: userPreferences?.defaultPublicStats || false,
          isTemporary: false,
          expirationType: 'duration',
          temporaryDuration: '1h',
          customDuration: 1,
          customDurationUnit: 'days',
          expirationDate: '',
          expirationTime: '23:59',
          customDomain: customDomains.find(d => d.isDefault)?.id || '',
        });
        setCurrentStep(0);
        setShowConfirm(false);
        onLinkCreated?.(linkData);
      },
      onError: error => {
        setShowConfirm(false);
        onError?.(error.message || 'Error al crear el enlace');
      },
    });

    setIsLoading(false);
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | number
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
      toast.success('¡Enlace copiado al portapapeles!');
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      toast.error('Error al copiar el enlace');
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
      isTemporary: false,
      expirationType: 'duration',
      temporaryDuration: '1h',
      customDuration: 1,
      customDurationUnit: 'days',
      expirationDate: '',
      expirationTime: '23:59',
      customDomain: '',
    });
    setErrors({});
    setCurrentStep(0);
    setShowConfirm(false);
  };

  const nextStep = () => {
    if (currentStep === 0 && !formData.originalUrl) {
      setErrors({ originalUrl: 'La URL es obligatoria' });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ToggleSwitch Component
  const ToggleSwitch = ({
    id,
    checked,
    onChange,
    label,
    description,
  }: {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="flex items-center h-5 mt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          id={id}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            checked ? 'bg-primary' : 'bg-muted'
          }`}
          onClick={() => onChange(!checked)}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      <div className="flex-1">
        <label
          htmlFor={id}
          className="text-sm font-medium text-card-foreground cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  // Animation variants
  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (createdLink) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-lg border border-border p-6"
      >
        <div className="text-center space-y-4">
          <div className="p-3 bg-green-500/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Check className="h-8 w-8 text-green-500" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              ¡Enlace Creado Exitosamente!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tu enlace corto está listo para usar
            </p>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                URL Corta
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
      </motion.div>
    );
  }

  if (showConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-lg border border-border p-6"
      >
        <div className="text-center space-y-4">
          <div className="p-3 bg-blue-500/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Eye className="h-8 w-8 text-blue-500" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Confirmar Creación de Enlace
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Revisa los detalles antes de crear tu enlace
            </p>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  URL Original
                </h4>
                <p className="text-sm break-all">{formData.originalUrl}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Slug Personalizado
                </h4>
                <p className="text-sm">
                  {formData.slug || 'Se generará automáticamente'}
                </p>
              </div>

              {formData.title && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Título
                  </h4>
                  <p className="text-sm">{formData.title}</p>
                </div>
              )}

              {formData.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Descripción
                  </h4>
                  <p className="text-sm">{formData.description}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Estadísticas Públicas
                </h4>
                <p className="text-sm">
                  {formData.isPublicStats ? 'Sí' : 'No'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Enlace Temporal
                </h4>
                <p className="text-sm">{formData.isTemporary ? 'Sí' : 'No'}</p>
              </div>

              {formData.isTemporary && (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Tipo de Expiración
                    </h4>
                    <p className="text-sm">
                      {formData.expirationType === 'duration'
                        ? 'Duración'
                        : 'Fecha Exacta'}
                    </p>
                  </div>

                  {formData.expirationType === 'duration' ? (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Duración
                      </h4>
                      <p className="text-sm">
                        {formData.temporaryDuration === 'custom'
                          ? `${formData.customDuration} ${formData.customDurationUnit === 'hours' ? 'horas' : 'días'}`
                          : formData.temporaryDuration === '1h'
                            ? '1 hora'
                            : formData.temporaryDuration === '12h'
                              ? '12 horas'
                              : '1 día'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Fecha de Expiración
                        </h4>
                        <p className="text-sm">
                          {new Date(
                            formData.expirationDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Hora de Expiración
                        </h4>
                        <p className="text-sm">{formData.expirationTime}</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Volver a editar
            </Button>
            <Button onClick={confirmSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar y crear
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-destructive">
              Error en el Formulario
            </h3>
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg border border-border p-6"
      >
        {/* Stepper Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Crear Nuevo Enlace
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sigue los pasos para crear tu enlace personalizado
          </p>

          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      currentStep >= index
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {currentStep > index ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <IconComponent className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 ${
                      currentStep >= index
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: URL */}
            {currentStep === 0 && (
              <motion.div
                key="step-1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-medium text-card-foreground mb-2 flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    Paso 1: Ingresa tu URL
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Introduce la URL que deseas acortar. Asegúrate de que sea
                    válida y accesible.
                  </p>

                  <Input
                    label="Enlace Original"
                    placeholder="https://mi.enlace.largo/KhigUGgpUYGyugIYUGO"
                    value={formData.originalUrl}
                    onChange={e =>
                      handleInputChange('originalUrl', e.target.value)
                    }
                    error={errors.originalUrl}
                    required
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Customization */}
            {currentStep === 1 && (
              <motion.div
                key="step-2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-medium text-card-foreground mb-2 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Paso 2: Personaliza tu enlace
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Personaliza cómo se verá y funcionará tu enlace acortado.
                  </p>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        label="Enlace personalizado (opcional)"
                        placeholder="mi-enlace-personalizado"
                        value={formData.slug}
                        onChange={e =>
                          handleInputChange(
                            'slug',
                            e.target.value.toLowerCase()
                          )
                        }
                        error={errors.slug}
                        helperText="Déjalo en blanco para generarlo automáticamente. Solo se permiten letras minúsculas, números, guiones y guiones bajos."
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

                  <div className="mt-4">
                    <Input
                      label="Título (opcional)"
                      placeholder="Título de mi enlace"
                      value={formData.title}
                      onChange={e => handleInputChange('title', e.target.value)}
                      error={errors.title}
                      helperText={`${formData.title.length}/200 caracteres`}
                    />
                  </div>

                  <div className="mt-4">
                    <Input
                      label="Descripción (opcional)"
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

                  {/* Selector de dominio personalizado */}
                  {customDomains.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-card-foreground mb-2">
                        Dominio personalizado (opcional)
                      </label>
                      <select
                        value={formData.customDomain}
                        onChange={e => handleInputChange('customDomain', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Usar dominio por defecto (brl.ink)</option>
                        {customDomains.map(domain => (
                          <option key={domain.id} value={domain.id}>
                            {domain.domain} {domain.isDefault ? '(Por defecto)' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Selecciona un dominio personalizado. Los enlaces están disponibles en todos los dominios verificados.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Options */}
            {currentStep === 2 && (
              <motion.div
                key="step-3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-medium text-card-foreground mb-2 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Paso 3: Configura las opciones
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configura las opciones avanzadas para tu enlace.
                  </p>

                  <div className="space-y-4 rounded-lg border p-4">
                    <ToggleSwitch
                      id="isTemporary"
                      checked={formData.isTemporary}
                      onChange={checked =>
                        handleInputChange('isTemporary', checked)
                      }
                      label="Enlace temporal"
                      description="Se eliminará automáticamente después de un tiempo"
                    />

                    {formData.isTemporary && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-9 space-y-4"
                      >
                        <div className="flex gap-4 items-center">
                          <label className="text-sm font-medium text-card-foreground">
                            Tipo de expiración:
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                formData.expirationType === 'duration'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                              onClick={() =>
                                handleInputChange('expirationType', 'duration')
                              }
                            >
                              Duración
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                formData.expirationType === 'date'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                              onClick={() =>
                                handleInputChange('expirationType', 'date')
                              }
                            >
                              Fecha Exacta
                            </button>
                          </div>
                        </div>

                        {formData.expirationType === 'duration' ? (
                          <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                            <div>
                              <label className="text-sm font-medium text-card-foreground mb-2 block">
                                Duración del enlace
                              </label>
                              <select
                                value={formData.temporaryDuration}
                                onChange={e =>
                                  handleInputChange(
                                    'temporaryDuration',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                              >
                                <option value="1h">1 hora</option>
                                <option value="12h">12 horas</option>
                                <option value="1d">1 día</option>
                                <option value="custom">Personalizado</option>
                              </select>
                            </div>

                            {formData.temporaryDuration === 'custom' && (
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Input
                                    type="number"
                                    min="1"
                                    max={
                                      formData.customDurationUnit === 'days'
                                        ? '30'
                                        : '720'
                                    }
                                    value={formData.customDuration.toString()}
                                    onChange={e =>
                                      handleInputChange(
                                        'customDuration',
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    error={errors.customDuration}
                                    placeholder="Cantidad"
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={formData.customDurationUnit}
                                    onChange={e =>
                                      handleInputChange(
                                        'customDurationUnit',
                                        e.target.value as 'hours' | 'days'
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent h-10"
                                  >
                                    <option value="hours">Horas</option>
                                    <option value="days">Días</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              💡 Los enlaces temporales se eliminarán
                              automáticamente cuando expiren. Duración máxima:
                              30 días.
                            </p>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3 p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium text-card-foreground mb-2 block">
                                  Fecha de expiración
                                </label>
                                <input
                                  type="date"
                                  min={formatDateForInput(today)}
                                  max={formatDateForInput(maxDate)}
                                  value={formData.expirationDate}
                                  onChange={e =>
                                    handleInputChange(
                                      'expirationDate',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                {errors.expirationDate && (
                                  <p className="text-xs text-destructive mt-1">
                                    {errors.expirationDate}
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="text-sm font-medium text-card-foreground mb-2 block">
                                  Hora de expiración
                                </label>
                                <input
                                  type="time"
                                  value={formData.expirationTime}
                                  onChange={e =>
                                    handleInputChange(
                                      'expirationTime',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                {errors.expirationTime && (
                                  <p className="text-xs text-destructive mt-1">
                                    {errors.expirationTime}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              💡 El enlace expirará en la fecha y hora
                              especificadas. Máximo 30 días.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    <ToggleSwitch
                      id="publicStats"
                      checked={formData.isPublicStats}
                      onChange={checked =>
                        handleInputChange('isPublicStats', checked)
                      }
                      label="Estadísticas públicas"
                      description="Permite que cualquiera vea las estadísticas de este enlace"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <motion.div
                key="step-4"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-medium text-card-foreground mb-2 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Paso 4: Revisa y crea
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Revisa la información de tu enlace antes de crearlo.
                  </p>

                  <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          URL Original
                        </h4>
                        <p className="text-sm break-all">
                          {formData.originalUrl}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Slug Personalizado
                        </h4>
                        <p className="text-sm">
                          {formData.slug || 'Se generará automáticamente'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Dominio
                        </h4>
                        <p className="text-sm">
                          {formData.customDomain 
                            ? customDomains.find(d => d.id === formData.customDomain)?.domain || 'brl.ink'
                            : 'brl.ink (por defecto)'
                          }
                        </p>
                      </div>

                      {formData.title && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Título
                          </h4>
                          <p className="text-sm">{formData.title}</p>
                        </div>
                      )}

                      {formData.description && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Descripción
                          </h4>
                          <p className="text-sm">{formData.description}</p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Temporal
                        </h4>
                        <p className="text-sm">
                          {formData.isTemporary ? 'Sí' : 'No'}
                        </p>
                      </div>

                      {formData.isTemporary && (
                        <>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">
                              Tipo de Expiración
                            </h4>
                            <p className="text-sm">
                              {formData.expirationType === 'duration'
                                ? 'Duración'
                                : 'Fecha Exacta'}
                            </p>
                          </div>

                          {formData.expirationType === 'duration' ? (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                Duración
                              </h4>
                              <p className="text-sm">
                                {formData.temporaryDuration === 'custom'
                                  ? `${formData.customDuration} ${formData.customDurationUnit === 'hours' ? 'horas' : 'días'}`
                                  : formData.temporaryDuration === '1h'
                                    ? '1 hora'
                                    : formData.temporaryDuration === '12h'
                                      ? '12 horas'
                                      : '1 día'}
                              </p>
                            </div>
                          ) : (
                            <>
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                  Fecha de Expiración
                                </h4>
                                <p className="text-sm">
                                  {new Date(
                                    formData.expirationDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                  Hora de Expiración
                                </h4>
                                <p className="text-sm">
                                  {formData.expirationTime}
                                </p>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Estadísticas Públicas
                        </h4>
                        <p className="text-sm">
                          {formData.isPublicStats ? 'Sí' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit">
                <Eye className="h-4 w-4 mr-2" />
                Revisar y Crear
              </Button>
            )}
          </div>
        </form>
      </motion.div>
    </ErrorBoundary>
  );
}
