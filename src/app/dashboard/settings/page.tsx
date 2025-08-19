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
      const fileName = `brl-links-export-${new Date().toISOString().split('T')[0]}.json`;

      // Send data to webhook with public download link
      const webhookData = {
        email: settings.email,
        downloadLink: downloadUrl,
        fileName: fileName,
        exportDate: new Date().toISOString(),
        exportId: exportId,
        summary: summary // Include summary with totals
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
                {session?.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
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

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                Eliminar Todos los Datos
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-200 mb-3">
                Elimina permanentemente todos tus enlaces y datos analíticos.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-800"
              >
                Eliminar Datos
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
              Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor,
              ten cuidado.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar Cuenta'
              )}
            </Button>
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
