'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, LoadingSpinner } from '../ui';
import './LinkEditor.css';
import { Link, UpdateLinkData, ApiResponse } from '../../types';

interface LinkEditorProps {
  link: Link | null;
  isOpen: boolean;
  onClose: () => void;
  onLinkUpdated: (updatedLink: Link) => void;
  onError: (error: string) => void;
}

export function LinkEditor({
  link,
  isOpen,
  onClose,
  onLinkUpdated,
  onError,
}: LinkEditorProps) {
  const [formData, setFormData] = useState({
    originalUrl: '',
    slug: '',
    title: '',
    description: '',
    isPublicStats: false,
    isActive: true,
    isTemporary: false,
    expiresAt: '',
    isClickLimited: false,
    maxClicks: 100,
    isTimeRestricted: false,
    timeRestrictionStart: '09:00',
    timeRestrictionEnd: '17:00',
    timeRestrictionTimezone: 'UTC',
    customDomain: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customDomains, setCustomDomains] = useState<
    Array<{
      id: string;
      domain: string;
      isDefault: boolean;
      isVerified: boolean;
    }>
  >([]);

  // Reset form when link changes or modal opens
  useEffect(() => {
    if (link && isOpen) {
      setFormData({
        originalUrl: link.originalUrl,
        slug: link.slug,
        title: link.title || '',
        description: link.description || ' ',
        isPublicStats: link.isPublicStats,
        isActive: link.isActive,
        isTemporary: link.isTemporary || false,
        expiresAt: link.expiresAt
          ? new Date(link.expiresAt).toISOString().slice(0, 16)
          : '',
        isClickLimited: link.isClickLimited || false,
        maxClicks: link.maxClicks || 100,
        isTimeRestricted: link.isTimeRestricted || false,
        timeRestrictionStart: link.timeRestrictionStart || '09:00',
        timeRestrictionEnd: link.timeRestrictionEnd || '17:00',
        timeRestrictionTimezone: link.timeRestrictionTimezone || 'UTC',
        customDomain: (link as any).customDomainId || '',
      });
      setErrors({});
    }
  }, [link, isOpen]);

  // Load custom domains when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadCustomDomains = async () => {
        try {
          const response = await fetch('/api/domains');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const verifiedDomains = data.data.filter(
                (domain: any) => domain.isVerified
              );
              setCustomDomains(verifiedDomains);
            }
          }
        } catch (error) {
          console.error('Error loading custom domains:', error);
        }
      };
      loadCustomDomains();
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.originalUrl.trim()) {
      newErrors.originalUrl = 'URL is required';
    } else {
      // Basic URL validation
      try {
        const url = formData.originalUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          // This is fine, we'll add https:// in the API
        } else {
          new URL(url);
        }
      } catch {
        newErrors.originalUrl = 'Please enter a valid URL';
      }
    }

    if (formData.slug.trim()) {
      const slug = formData.slug.trim();
      if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
        newErrors.slug =
          'Slug can only contain letters, numbers, hyphens, and underscores';
      } else if (slug.length < 3) {
        newErrors.slug = 'Slug must be at least 3 characters long';
      } else if (slug.length > 50) {
        newErrors.slug = 'Slug must be 50 characters or less';
      }
    }

    if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    // Validación para enlaces temporales
    if (formData.isTemporary) {
      if (!formData.expiresAt) {
        newErrors.expiresAt =
          'La fecha de expiración es requerida para enlaces temporales';
      } else {
        const expirationDate = new Date(formData.expiresAt);
        const now = new Date();
        if (expirationDate <= now) {
          newErrors.expiresAt = 'La fecha de expiración debe ser futura';
        }
      }
    }

    // Validación para límite de clicks
    if (formData.isClickLimited) {
      if (formData.maxClicks < 1) {
        newErrors.maxClicks = 'El número máximo de clicks debe ser mayor a 0';
      } else if (formData.maxClicks > 1000000) {
        newErrors.maxClicks = 'El número máximo de clicks no puede ser mayor a 1,000,000';
      }
    }

    // Validación para restricción horaria
    if (formData.isTimeRestricted) {
      if (!formData.timeRestrictionStart) {
        newErrors.timeRestrictionStart = 'La hora de inicio es obligatoria';
      } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.timeRestrictionStart)) {
        newErrors.timeRestrictionStart = 'Formato de hora inválido (use HH:MM)';
      }

      if (!formData.timeRestrictionEnd) {
        newErrors.timeRestrictionEnd = 'La hora de fin es obligatoria';
      } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.timeRestrictionEnd)) {
        newErrors.timeRestrictionEnd = 'Formato de hora inválido (use HH:MM)';
      }

      if (formData.timeRestrictionStart && formData.timeRestrictionEnd) {
        const [startHour, startMin] = formData.timeRestrictionStart.split(':').map(Number);
        const [endHour, endMin] = formData.timeRestrictionEnd.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes === endMinutes) {
          newErrors.timeRestrictionEnd = 'La hora de fin debe ser diferente a la hora de inicio';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!link || !validateForm()) return;

    setLoading(true);

    try {
      const updateData: UpdateLinkData = {
        originalUrl: formData.originalUrl.trim(),
        slug: formData.slug.trim().toLowerCase(),
        title: formData.title.trim() || undefined,
        description: formData.description.trim() || ' ',
        isPublicStats: formData.isPublicStats,
        isActive: formData.isActive,
        isTemporary: formData.isTemporary,
        expiresAt:
          formData.isTemporary && formData.expiresAt
            ? new Date(formData.expiresAt)
            : undefined,
        isClickLimited: formData.isClickLimited,
        maxClicks: formData.isClickLimited ? formData.maxClicks : undefined,
        isTimeRestricted: formData.isTimeRestricted,
        timeRestrictionStart: formData.isTimeRestricted ? formData.timeRestrictionStart : undefined,
        timeRestrictionEnd: formData.isTimeRestricted ? formData.timeRestrictionEnd : undefined,
        timeRestrictionTimezone: formData.isTimeRestricted ? formData.timeRestrictionTimezone : undefined,
        customDomainId: formData.customDomain || undefined,
      };

      const response = await fetch(`/api/links/${link.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data: ApiResponse<Link> = await response.json();

      if (data.success && data.data) {
        onLinkUpdated(data.data);
        onClose();
      } else {
        if (
          data.error?.code === 'VALIDATION_ERROR' &&
          data.error.message.includes('Slug')
        ) {
          setErrors({ slug: data.error.message });
        } else if (data.error?.code === 'SLUG_EXISTS') {
          setErrors({ slug: data.error.message });
        } else {
          onError(data.error?.message || 'Failed to update link');
        }
      }
    } catch (error) {
      console.error('Error updating link:', error);
      onError('Failed to update link');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!link) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar enlace" size="lg">
      <div className="linkEditorScroll">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="originalUrl"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Enlace de destino *
            </label>
            <Input
              id="originalUrl"
              type="url"
              value={formData.originalUrl}
              onChange={e => handleInputChange('originalUrl', e.target.value)}
              placeholder="https://example.com"
              error={errors.originalUrl}
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Enlace corto (slug)
            </label>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">
                {typeof window !== 'undefined' ? window.location.origin : ''}/
              </span>
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={e => handleInputChange('slug', e.target.value)}
                placeholder="my-link"
                error={errors.slug}
                disabled={loading}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deja vacío para mantener el slug actual. Solo se permiten letras,
              números, guiones y guiones bajos.
            </p>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Título
            </label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder="Título opcional para tu enlace"
              error={errors.title}
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Descripción opcional"
              rows={3}
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.description
                ? 'border-red-300 focus:ring-red-500'
                : 'border-input bg-background text-foreground'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {customDomains.length > 0 && (
            <div>
              <label
                htmlFor="customDomain"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Dominio personalizado
              </label>
              <select
                id="customDomain"
                value={formData.customDomain}
                onChange={e =>
                  handleInputChange('customDomain', e.target.value)
                }
                disabled={loading}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors border-input bg-background text-foreground"
              >
                <option value="">broslunas.link</option>
                {customDomains.map(domain => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain}
                    {domain.isDefault ? ' (predeterminado)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecciona un dominio personalizado. Los enlaces están
                disponibles en todos los dominios verificados.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Estado del enlace
              </label>
              <Button
                type="button"
                onClick={() =>
                  handleInputChange('isActive', !formData.isActive)
                }
                disabled={loading}
                variant={formData.isActive ? 'default' : 'outline'}
                className={`w-full justify-center ${formData.isActive
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20'
                  }`}
              >
                {formData.isActive ? '✓ Enlace Activo' : '✗ Enlace Inactivo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Los enlaces inactivos mostrarán una página 404 cuando se accedan
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Estadísticas públicas
              </label>
              <Button
                type="button"
                onClick={() =>
                  handleInputChange('isPublicStats', !formData.isPublicStats)
                }
                disabled={loading}
                variant={formData.isPublicStats ? 'default' : 'outline'}
                className={`w-full justify-center ${formData.isPublicStats
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-900/20'
                  }`}
              >
                {formData.isPublicStats
                  ? '✓ Estadísticas Públicas'
                  : '✗ Estadísticas Privadas'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Permitir que otros vean estadísticas agregadas para este enlace
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Enlace temporal
              </label>
              <Button
                type="button"
                onClick={() => {
                  const newIsTemporary = !formData.isTemporary;
                  handleInputChange('isTemporary', newIsTemporary);
                  // Si se desactiva el enlace temporal, limpiar la fecha de expiración
                  if (!newIsTemporary) {
                    handleInputChange('expiresAt', '');
                  }
                }}
                disabled={loading}
                variant={formData.isTemporary ? 'default' : 'outline'}
                className={`w-full justify-center ${formData.isTemporary
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-900/20'
                  }`}
              >
                {formData.isTemporary
                  ? '⏰ Enlace Temporal'
                  : '🔗 Enlace Permanente'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Los enlaces temporales se desactivan automáticamente después de
                la fecha de expiración
              </p>
            </div>

            {formData.isTemporary && (
              <div>
                <label
                  htmlFor="expiresAt"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Fecha y hora de expiración *
                </label>
                <input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={e => handleInputChange('expiresAt', e.target.value)}
                  disabled={loading}
                  min={new Date().toISOString().slice(0, 16)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.expiresAt
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-input bg-background text-foreground'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.expiresAt && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.expiresAt}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  El enlace dejará de funcionar después de esta fecha y hora
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Límite de clicks
              </label>
              <Button
                type="button"
                onClick={() => {
                  const newIsClickLimited = !formData.isClickLimited;
                  handleInputChange('isClickLimited', newIsClickLimited);
                  // Si se desactiva el límite, no limpiar maxClicks para mantener el valor
                }}
                disabled={loading}
                variant={formData.isClickLimited ? 'default' : 'outline'}
                className={`w-full justify-center ${formData.isClickLimited
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-900/20'
                  }`}
              >
                {formData.isClickLimited
                  ? '🔢 Límite Activado'
                  : '∞ Sin Límite'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                El enlace se bloqueará automáticamente al alcanzar el máximo de clicks
              </p>
            </div>

            {formData.isClickLimited && (
              <div>
                <label
                  htmlFor="maxClicks"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Número máximo de clicks *
                </label>
                <Input
                  id="maxClicks"
                  type="number"
                  min="1"
                  max="1000000"
                  value={formData.maxClicks.toString()}
                  OnChange={e => handleInputChange('maxClicks', e.target.value)}
                  placeholder="Ej: 100"
                  error={errors.maxClicks}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El enlace se bloqueará cuando se alcance este número de clicks
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Restricción horaria
              </label>
              <Button
                type="button"
                onClick={() => {
                  const newIsTimeRestricted = !formData.isTimeRestricted;
                  handleInputChange('isTimeRestricted', newIsTimeRestricted);
                }}
                disabled={loading}
                variant={formData.isTimeRestricted ? 'default' : 'outline'}
                className={`w-full justify-center ${formData.isTimeRestricted
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-900/20'
                  }`}
              >
                {formData.isTimeRestricted
                  ? '🕒 Horario Restringido'
                  : '🌐 Siempre Disponible'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                El enlace solo funcionará durante ciertos horarios del día
              </p>
            </div>

            {formData.isTimeRestricted && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="timeRestrictionStart"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Hora de inicio *
                    </label>
                    <input
                      id="timeRestrictionStart"
                      type="time"
                      value={formData.timeRestrictionStart}
                      onChange={e => handleInputChange('timeRestrictionStart', e.target.value)}
                      disabled={loading}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.timeRestrictionStart
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-input bg-background text-foreground'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    {errors.timeRestrictionStart && (
                      <p className="text-red-500 text-xs mt-1">{errors.timeRestrictionStart}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="timeRestrictionEnd"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Hora de fin *
                    </label>
                    <input
                      id="timeRestrictionEnd"
                      type="time"
                      value={formData.timeRestrictionEnd}
                      onChange={e => handleInputChange('timeRestrictionEnd', e.target.value)}
                      disabled={loading}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.timeRestrictionEnd
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-input bg-background text-foreground'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    {errors.timeRestrictionEnd && (
                      <p className="text-red-500 text-xs mt-1">{errors.timeRestrictionEnd}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="timeRestrictionTimezone"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Zona horaria
                  </label>
                  <select
                    id="timeRestrictionTimezone"
                    value={formData.timeRestrictionTimezone}
                    onChange={e => handleInputChange('timeRestrictionTimezone', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors border-input bg-background text-foreground"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Europe/Madrid">Europa/Madrid (CET/CEST)</option>
                    <option value="America/New_York">América/Nueva York (EST/EDT)</option>
                    <option value="America/Los_Angeles">América/Los Ángeles (PST/PDT)</option>
                    <option value="America/Mexico_City">América/Ciudad de México (CST/CDT)</option>
                    <option value="America/Argentina/Buenos_Aires">América/Buenos Aires (ART)</option>
                    <option value="America/Sao_Paulo">América/São Paulo (BRT)</option>
                    <option value="Asia/Tokyo">Asia/Tokio (JST)</option>
                    <option value="Asia/Shanghai">Asia/Shanghái (CST)</option>
                    <option value="Australia/Sydney">Australia/Sídney (AEST/AEDT)</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  El enlace solo funcionará entre las horas especificadas en la zona horaria seleccionada
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              Editar
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
