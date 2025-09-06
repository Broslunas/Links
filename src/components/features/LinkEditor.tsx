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
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when link changes or modal opens
  useEffect(() => {
    if (link && isOpen) {
      setFormData({
        originalUrl: link.originalUrl,
        slug: link.slug,
        title: link.title || '',
        description: link.description || '',
        isPublicStats: link.isPublicStats,
        isActive: link.isActive,
        isTemporary: link.isTemporary || false,
        expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '',
      });
      setErrors({});
    }
  }, [link, isOpen]);

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
      if (!/^[a-z0-9-_]+$/i.test(slug)) {
        newErrors.slug =
          'Slug can only contain letters, numbers, hyphens, and underscores';
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
        newErrors.expiresAt = 'La fecha de expiración es requerida para enlaces temporales';
      } else {
        const expirationDate = new Date(formData.expiresAt);
        const now = new Date();
        if (expirationDate <= now) {
          newErrors.expiresAt = 'La fecha de expiración debe ser futura';
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
        description: formData.description.trim() || undefined,
        isPublicStats: formData.isPublicStats,
        isActive: formData.isActive,
        isTemporary: formData.isTemporary,
        expiresAt: formData.isTemporary && formData.expiresAt ? new Date(formData.expiresAt) : undefined,
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
        if (data.error?.code === 'SLUG_EXISTS') {
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
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.description
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-input bg-background text-foreground'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Estado del enlace
              </label>
              <Button
                type="button"
                onClick={() => handleInputChange('isActive', !formData.isActive)}
                disabled={loading}
                variant={formData.isActive ? 'default' : 'outline'}
                className={`w-full justify-center ${
                  formData.isActive
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
                onClick={() => handleInputChange('isPublicStats', !formData.isPublicStats)}
                disabled={loading}
                variant={formData.isPublicStats ? 'default' : 'outline'}
                className={`w-full justify-center ${
                  formData.isPublicStats
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-900/20'
                }`}
              >
                {formData.isPublicStats ? '✓ Estadísticas Públicas' : '✗ Estadísticas Privadas'}
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
                className={`w-full justify-center ${
                  formData.isTemporary
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-900/20'
                }`}
              >
                {formData.isTemporary ? '⏰ Enlace Temporal' : '🔗 Enlace Permanente'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Los enlaces temporales se desactivan automáticamente después de la fecha de expiración
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
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.expiresAt
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-input bg-background text-foreground'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.expiresAt && (
                  <p className="text-red-500 text-xs mt-1">{errors.expiresAt}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  El enlace dejará de funcionar después de esta fecha y hora
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
