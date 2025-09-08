'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import {
  Share2,
  Mail,
  Eye,
  BarChart3,
  Edit3,
  Trash2,
  Copy,
  Check,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkId: string;
  linkTitle?: string;
  linkSlug?: string;
}

interface SharedUser {
  _id: string;
  email: string;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canViewStats: boolean;
    canDelete: boolean;
  };
  sharedAt: string;
}

interface ShareFormData {
  email: string;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canViewStats: boolean;
    canDelete: boolean;
  };
}

export function ShareLinkModal({ isOpen, onClose, linkId, linkTitle, linkSlug }: ShareLinkModalProps) {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareForm, setShareForm] = useState<ShareFormData>({
    email: '',
    permissions: {
      canView: true,
      canEdit: false,
      canViewStats: false,
      canDelete: false
    }
  });
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Cargar usuarios compartidos cuando se abre el modal
  useEffect(() => {
    if (isOpen && linkId) {
      loadSharedUsers();
    }
  }, [isOpen, linkId]);

  const loadSharedUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/links/${linkId}/share`);
      if (response.ok) {
        const data = await response.json();
        // Mapear la estructura del API a la que espera el componente
        const mappedUsers = (data.shares || []).map((share: any) => ({
          _id: share.id,
          email: share.sharedWithUser.email,
          permissions: share.permissions,
          sharedAt: share.createdAt
        }));
        setSharedUsers(mappedUsers);
      } else {
        toast.error('Error al cargar usuarios compartidos');
      }
    } catch (error) {
      console.error('Error loading shared users:', error);
      toast.error('Error al cargar usuarios compartidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!shareForm.email.trim()) {
      toast.error('Por favor ingresa un email');
      return;
    }

    // Validar que al menos un permiso esté seleccionado
    const hasPermissions = Object.values(shareForm.permissions).some(p => p);
    if (!hasPermissions) {
      toast.error('Selecciona al menos un permiso');
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch(`/api/links/${linkId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: shareForm.email.trim(),
          permissions: shareForm.permissions
        })
      });

      if (response.ok) {
        toast.success('Enlace compartido exitosamente');
        setShareForm({
          email: '',
          permissions: {
            canView: true,
            canEdit: false,
            canViewStats: false,
            canDelete: false
          }
        });
        setShowShareForm(false);
        await loadSharedUsers(); // Recargar la lista
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al compartir enlace');
      }
    } catch (error) {
      console.error('Error sharing link:', error);
      toast.error('Error al compartir enlace');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch(`/api/links/${linkId}/share`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        toast.success(`Acceso removido para ${userEmail}`);
        await loadSharedUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al remover acceso');
      }
    } catch (error) {
      console.error('Error removing share:', error);
      toast.error('Error al remover acceso');
    }
  };

  const copyToClipboard = async (text: string, email: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(email);
      toast.success('Email copiado al portapapeles');
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (error) {
      toast.error('Error al copiar email');
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'canView':
        return <Eye className="h-4 w-4" />;
      case 'canEdit':
        return <Edit3 className="h-4 w-4" />;
      case 'canViewStats':
        return <BarChart3 className="h-4 w-4" />;
      case 'canDelete':
        return <Trash2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'canView':
        return 'Ver enlace';
      case 'canEdit':
        return 'Editar enlace';
      case 'canViewStats':
        return 'Ver estadísticas';
      case 'canDelete':
        return 'Eliminar enlace';
      default:
        return permission;
    }
  };

  const getActivePermissions = (permissions: SharedUser['permissions']) => {
    return Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compartir enlace"
      description={linkTitle ? `Compartir "${linkTitle}"` : `Compartir enlace /${linkSlug}`}
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Botón para mostrar formulario de compartir */}
        {!showShareForm && (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Usuarios con acceso</h3>
            <Button
              onClick={() => setShowShareForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Compartir con alguien
            </Button>
          </div>
        )}

        {/* Formulario de compartir */}
        {showShareForm && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Compartir con nuevo usuario</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email del usuario
                </label>
                <Input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={shareForm.email}
                  onChange={(e) => setShareForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  Permisos
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(shareForm.permissions).map(([permission, enabled]) => (
                    <label
                      key={permission}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        enabled
                          ? "bg-primary/10 border-primary/20"
                          : "bg-background border-border hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setShareForm(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [permission]: e.target.checked
                          }
                        }))}
                        className="sr-only"
                      />
                      <div className={cn(
                        "flex items-center justify-center w-5 h-5 rounded border-2 transition-colors",
                        enabled
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground"
                      )}>
                        {enabled && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {getPermissionIcon(permission)}
                        <span className="text-sm font-medium">
                          {getPermissionLabel(permission)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex items-center gap-2"
                >
                  {isSharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {isSharing ? 'Compartiendo...' : 'Compartir'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowShareForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de usuarios compartidos */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Cargando usuarios...</span>
            </div>
          ) : sharedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Este enlace no ha sido compartido con nadie aún</p>
              <p className="text-sm mt-1">Haz clic en "Compartir con alguien" para empezar</p>
            </div>
          ) : (
            sharedUsers.map((user) => {
              const activePermissions = getActivePermissions(user.permissions);
              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user.email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(user.email, user.email)}
                        className="h-6 w-6"
                      >
                        {copiedEmail === user.email ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activePermissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                        >
                          {getPermissionIcon(permission)}
                          <span>{getPermissionLabel(permission)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Compartido el {new Date(user.sharedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveShare(user._id, user.email)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ShareLinkModal;