'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input, LoadingSpinner } from '../../../components/ui';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { useToast } from '../../../hooks/useToast';
import { ToastContainer } from '../../../components/ui';
import { ApiTokenManager } from '../../../components/dashboard/ApiTokenManager';

interface UserSettings {
  name: string;
  email: string;
  defaultPublicStats: boolean;
  emailNotifications: boolean;
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const { toasts, success, error } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    defaultPublicStats: false,
    emailNotifications: true,
  });

  // Handle authentication state
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href =
        '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
    }
  }, [status]);

  // Load user settings
  useEffect(() => {
    if (session?.user) {
      setSettings({
        name: session.user.name || '',
        email: session.user.email || '',
        defaultPublicStats: false, // This would come from user preferences
        emailNotifications: true, // This would come from user preferences
      });
    }
  }, [session]);

  const handleSaveSettings = async () => {
    setSaving(true);

    try {
      // Here you would typically save to your API
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update session if name changed
      if (settings.name !== session?.user?.name) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: settings.name,
          },
        });
      }

      success('Configuración guardada correctamente', 'Ajustes');
    } catch (err) {
      console.error('Error saving settings:', err);
      error('Error al guardar la configuración', 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);

    try {
      // Create export via API (the API will fetch real data from database)
      const exportResponse = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body since API fetches data from session
      });

      if (!exportResponse.ok) {
        throw new Error('Error al crear el enlace de exportación');
      }

      const { downloadUrl, exportId, summary } = await exportResponse.json();
      const fileName = `broslunas-link-export-${new Date().toISOString().split('T')[0]}.json`;

      // Send data to webhook with public download link
      const webhookData = {
        email: settings.email,
        downloadLink: downloadUrl,
        fileName: fileName,
        exportDate: new Date().toISOString(),
        exportId: exportId,
        summary: summary, // Include summary with totals
      };

      await fetch(
        'https://hook.eu2.make.com/zvfuyr381bgdpgq1nltnof7vlmjridcb',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
        }
      );

      success(
        `Enlace de exportación se ha enviado a ${settings.email}. ${summary.totalLinks} enlaces y ${summary.totalAnalyticsEvents} eventos exportados. El enlace estará disponible por 1 hora`,
        'Exportación'
      );
    } catch (err) {
      console.error('Error exporting data:', err);
      error('Error al exportar los datos', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    if (
      !confirm(
        'Esta acción eliminará permanentemente todos tus enlaces y datos analíticos. ¿Continuar?'
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      // Here you would call your delete account API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirect to home page after account deletion
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      error('Error al eliminar la cuenta', 'Error');
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Cargando configuración...
          </p>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Redirigiendo a la página de inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona tu cuenta y preferencias de la aplicación.
          </p>
        </div>

        {/* Profile Settings */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Información del Perfil
          </h2>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-card-foreground mb-2"
                >
                  Nombre
                </label>
                <Input
                  id="name"
                  type="text"
                  value={settings.name}
                  onChange={e =>
                    setSettings({ ...settings, name: e.target.value })
                  }
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-card-foreground mb-2"
                >
                  Correo Electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El correo electrónico no se puede cambiar
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <h3 className="text-sm font-medium text-card-foreground">
                  Proveedor de Autenticación
                </h3>
                <p className="text-sm text-muted-foreground">
                  Conectado con {session?.user?.provider || 'OAuth'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {session?.user?.provider && (
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                    {session.user.provider === 'github' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                    {session.user.provider === 'google' && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    {session.user.provider === 'discord' && (
                      <svg className="w-5 h-5" fill="#5865F2" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                      </svg>
                    )}
                  </div>
                )}
                <span className="text-sm font-medium text-card-foreground capitalize">
                  {session?.user?.provider || 'OAuth'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* App Preferences */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Preferencias de la Aplicación
          </h2>

          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-card-foreground">
                  Tema de la Aplicación
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cambia entre tema claro y oscuro
                </p>
              </div>
              <ThemeToggle />
            </div>

            {/* Default Public Stats */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-card-foreground">
                  Estadísticas Públicas por Defecto
                </h3>
                <p className="text-sm text-muted-foreground">
                  Los nuevos enlaces tendrán estadísticas públicas habilitadas
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.defaultPublicStats}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      defaultPublicStats: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-card-foreground">
                  Notificaciones por Email
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recibe notificaciones sobre la actividad de tus enlaces
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* API Token Management */}
        <ApiTokenManager />

        {/* Data & Privacy */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Datos y Privacidad
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Exportar Datos
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                Descarga una copia de todos tus datos incluyendo enlaces y
                estadísticas.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={loading}
                className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-200 dark:hover:bg-blue-800"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Exportando...
                  </>
                ) : (
                  'Exportar Datos'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-lg border border-red-200 dark:border-red-800 p-6">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Zona de Peligro
          </h2>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
              Eliminar Cuenta
            </h3>
            <p className="text-sm text-red-700 dark:text-red-200 mb-4">
              Para solicitar la eliminación de tu cuenta, por favor contacta con
              nuestro equipo de soporte.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                size="sm"
                disabled={true}
                className="opacity-50 cursor-not-allowed"
              >
                Eliminar Cuenta (Deshabilitado)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open('https://broslunas.com/contacto', '_blank')
                }
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-200 dark:hover:bg-red-800"
              >
                Contactar Soporte
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
