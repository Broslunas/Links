'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input, LoadingSpinner } from '../../../components/ui';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { useToast } from '../../../hooks/useToast';
import { ToastContainer } from '../../../components/ui';
import { ApiTokenManager } from '../../../components/dashboard/ApiTokenManager';
import TwoFactorSetup from '../../../components/dashboard/TwoFactorSetup';
import { sendSubscriptionWebhook, sendUnsubscriptionWebhook } from '../../../lib/newsletter-webhook';

interface UserSettings {
  name: string;
  email: string;
  defaultPublicStats: boolean;
  emailNotifications: boolean;
}

interface TwoFactorStatus {
  enabled: boolean;
  hasSecret: boolean;
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
  const [originalPreferences, setOriginalPreferences] = useState({
    defaultPublicStats: false,
    emailNotifications: true,
  });
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({ enabled: false, hasSecret: false });
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disable2FAToken, setDisable2FAToken] = useState('');

  // Handle authentication state
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href =
        '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
    }
  }, [status]);

  // Load user settings and 2FA status
  useEffect(() => {
    const loadSettings = async () => {
      if (!session?.user?.email) return;

      setLoading(true);
      try {
        // Load user profile
        const profileResponse = await fetch('/api/user/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const userData = profileData.data;

          setSettings({
            name: userData.name || session.user.name || '',
            email: userData.email || session.user.email || '',
            defaultPublicStats: userData.defaultPublicStats || false,
            emailNotifications: userData.emailNotifications !== undefined ? userData.emailNotifications : true,
          });

          setOriginalPreferences({
            defaultPublicStats: userData.defaultPublicStats || false,
            emailNotifications: userData.emailNotifications !== undefined ? userData.emailNotifications : true,
          });
        } else {
          // Fallback to session data if API fails
          setSettings(prev => ({
            ...prev,
            name: session.user.name || '',
            email: session.user.email || '',
          }));

          // Load preferences separately
          const preferencesResponse = await fetch('/api/user/preferences');
          if (preferencesResponse.ok) {
            const data = await preferencesResponse.json();
            if (data.success) {
               const preferences = {
                 defaultPublicStats: data.data.defaultPublicStats,
                 emailNotifications: data.data.emailNotifications,
               };
               setSettings(prev => ({
                 ...prev,
                 ...preferences,
               }));
               setOriginalPreferences(preferences);
             }
          }
        }

        // Load 2FA status
        const twoFactorResponse = await fetch('/api/user/two-factor/setup');
        if (twoFactorResponse.ok) {
          const twoFactorData = await twoFactorResponse.json();
          setTwoFactorStatus(twoFactorData.data);
        }
      } catch (err) {
        console.error('Error loading user settings:', err);
        error('Error al cargar la configuración', 'Error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [session, error]);

  const handleSaveSettings = async () => {
    setSaving(true);

    try {
      // Prepare data to update
      const updateData: any = {};
      
      // Check if name changed
      if (settings.name !== session?.user?.name) {
        updateData.name = settings.name;
      }
      
      // Always include preferences (they might have changed)
      updateData.defaultPublicStats = settings.defaultPublicStats;
      updateData.emailNotifications = settings.emailNotifications;

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Error al actualizar el perfil');
        }

        // Update session with new name if it changed
        if (updateData.name) {
          await update({
            ...session,
            user: {
              ...session?.user,
              name: settings.name,
            },
          });
        }
      }

      // Send newsletter webhook if email notifications preference changed
      if (settings.emailNotifications !== originalPreferences.emailNotifications) {
        try {
          const userName = settings.name || session?.user?.name || 'Usuario';
          const userEmail = settings.email || session?.user?.email || '';
          
          if (userEmail) {
            if (settings.emailNotifications) {
              await sendSubscriptionWebhook(userName, userEmail);
            } else {
              await sendUnsubscriptionWebhook(userName, userEmail);
            }
          }
        } catch (error) {
          console.error('Error sending newsletter webhook:', error);
          // Don't fail the save operation if webhook fails
        }
      }

      // Update original preferences to reset change indicators
      setOriginalPreferences({
        defaultPublicStats: settings.defaultPublicStats,
        emailNotifications: settings.emailNotifications,
      });

      success('Configuración guardada correctamente', 'Ajustes');
    } catch (err) {
      console.error('Error saving settings:', err);
      error(err instanceof Error ? err.message : 'Error al guardar la configuración', 'Error');
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

  const handleDisable2FA = async () => {
    if (!disable2FAToken.trim()) {
      error('Por favor ingresa tu código 2FA para deshabilitar');
      return;
    }

    setDisabling2FA(true);
    try {
      const response = await fetch('/api/user/two-factor/backup-codes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: disable2FAToken.trim(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al deshabilitar 2FA');
      }

      setTwoFactorStatus({ enabled: false, hasSecret: false });
      setDisable2FAToken('');
      success('2FA deshabilitado correctamente');
    } catch (err) {
      console.error('Error disabling 2FA:', err);
      error(err instanceof Error ? err.message : 'Error al deshabilitar 2FA');
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleTwoFactorSetupComplete = () => {
    setShowTwoFactorSetup(false);
    setTwoFactorStatus({ enabled: true, hasSecret: true });
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">
              Información del Perfil
            </h2>
            {/* Save Button - More Visible Position */}
            <Button
              onClick={handleSaveSettings}
              disabled={saving || (
                settings.name === session?.user?.name &&
                settings.defaultPublicStats === originalPreferences.defaultPublicStats &&
                settings.emailNotifications === originalPreferences.emailNotifications
              )}
              className="min-w-[120px]"
              size="sm"
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

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-card-foreground mb-2"
                >
                  Nombre de Usuario
                </label>
                <Input
                  id="name"
                  type="text"
                  value={settings.name}
                  onChange={e =>
                    setSettings({ ...settings, name: e.target.value })
                  }
                  placeholder="Tu nombre de usuario"
                  maxLength={100}
                />
                {settings.name !== session?.user?.name && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ⚠️ Cambios sin guardar
                  </p>
                )}
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
              <div className="flex-1">
                <h3 className="text-sm font-medium text-card-foreground">
                  Estadísticas Públicas por Defecto
                </h3>
                <p className="text-sm text-muted-foreground">
                  Los nuevos enlaces tendrán estadísticas públicas habilitadas
                </p>
                {settings.defaultPublicStats !== originalPreferences.defaultPublicStats && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ⚠️ Cambios sin guardar
                  </p>
                )}
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
              <div className="flex-1">
                <h3 className="text-sm font-medium text-card-foreground">
                  Notificaciones por Email
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recibe notificaciones sobre la actividad de tus enlaces
                </p>
                {settings.emailNotifications !== originalPreferences.emailNotifications && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ⚠️ Cambios sin guardar
                  </p>
                )}
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

        {/* Two-Factor Authentication */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">
              Autenticación de Dos Factores (2FA)
            </h2>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              twoFactorStatus.enabled 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {twoFactorStatus.enabled ? 'Habilitado' : 'Deshabilitado'}
            </div>
          </div>

          {!showTwoFactorSetup ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {twoFactorStatus.enabled 
                  ? 'Tu cuenta está protegida con autenticación de dos factores.'
                  : 'Añade una capa extra de seguridad a tu cuenta con autenticación de dos factores.'}
              </p>

              {!twoFactorStatus.enabled ? (
                <Button
                  onClick={() => setShowTwoFactorSetup(true)}
                  className="w-full sm:w-auto"
                >
                  Configurar 2FA
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      ✓ Tu cuenta está protegida con 2FA
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-card-foreground">
                      Deshabilitar 2FA
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Para deshabilitar 2FA, ingresa tu código de autenticación:
                    </p>
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        placeholder="Código 2FA"
                        value={disable2FAToken}
                        onChange={(e) => setDisable2FAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="max-w-[150px] text-center"
                      />
                      <Button
                        variant="destructive"
                        onClick={handleDisable2FA}
                        disabled={disabling2FA || disable2FAToken.length !== 6}
                        size="sm"
                      >
                        {disabling2FA ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Deshabilitando...
                          </>
                        ) : (
                          'Deshabilitar 2FA'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <TwoFactorSetup onSetupComplete={handleTwoFactorSetupComplete} />
          )}
        </div>

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

        {/* Additional Save Button at Bottom */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saving || settings.name === session?.user?.name}
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
