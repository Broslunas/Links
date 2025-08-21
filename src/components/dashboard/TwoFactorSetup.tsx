'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, LoadingSpinner } from '../ui';
import { Shield, Copy, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface TwoFactorSetupProps {
  onSetupComplete?: () => void;
}

interface SetupData {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

interface BackupCodesData {
  backupCodes: string[];
}

export default function TwoFactorSetup({ onSetupComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'complete'>('initial');
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [showManualKey, setShowManualKey] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const { success, error } = useToast();

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/two-factor/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al configurar 2FA');
      }

      setSetupData(data.data);
      setStep('setup');
    } catch (err) {
      console.error('Error starting 2FA setup:', err);
      error(err instanceof Error ? err.message : 'Error al iniciar configuración 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode.trim()) {
      error('Por favor ingresa el código de verificación');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationCode.trim(),
          isSetup: true,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Código de verificación inválido');
      }

      setBackupCodes(data.data.backupCodes);
      setStep('complete');
      success('¡2FA habilitado correctamente!');
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      error(err instanceof Error ? err.message : 'Error al verificar código');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success('Copiado al portapapeles');
    } catch (err) {
      error('Error al copiar al portapapeles');
    }
  };

  const handleFinish = () => {
    onSetupComplete?.();
  };

  if (step === 'initial') {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-card-foreground">
            Configurar Autenticación de Dos Factores
          </h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            La autenticación de dos factores (2FA) añade una capa extra de seguridad a tu cuenta.
            Necesitarás una aplicación de autenticación como Google Authenticator, Authy, o similar.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Antes de continuar
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Asegúrate de tener instalada una aplicación de autenticación en tu dispositivo móvil.
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleStartSetup} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Configurando...
              </>
            ) : (
              'Comenzar Configuración'
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'setup' && setupData) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-card-foreground">
            Escanea el Código QR
          </h3>
        </div>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block border">
              <img 
                src={setupData.qrCode} 
                alt="Código QR para 2FA" 
                className="w-48 h-48"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Escanea este código QR con tu aplicación de autenticación, o ingresa manualmente la clave:
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManualKey(!showManualKey)}
              >
                {showManualKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showManualKey ? 'Ocultar' : 'Mostrar'} clave manual
              </Button>
            </div>
            
            {showManualKey && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono break-all">
                    {setupData.manualEntryKey}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(setupData.manualEntryKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <label htmlFor="verification-code" className="block text-sm font-medium text-card-foreground">
              Código de verificación
            </label>
            <Input
              id="verification-code"
              type="text"
              placeholder="Ingresa el código de 6 dígitos"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              Ingresa el código de 6 dígitos que aparece en tu aplicación de autenticación
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('initial')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verificando...
                </>
              ) : (
                'Verificar y Habilitar'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <h3 className="text-lg font-semibold text-card-foreground">
            ¡2FA Configurado Correctamente!
          </h3>
        </div>
        
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200">
              Tu cuenta ahora está protegida con autenticación de dos factores.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-card-foreground">
                Códigos de Respaldo
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBackupCodes(!showBackupCodes)}
              >
                {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showBackupCodes ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h5 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    Importante: Guarda estos códigos
                  </h5>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Estos códigos te permitirán acceder a tu cuenta si pierdes acceso a tu aplicación de autenticación.
                    Guárdalos en un lugar seguro.
                  </p>
                </div>
              </div>
            </div>
            
            {showBackupCodes && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded px-3 py-2">
                      <code className="text-sm font-mono">{code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar todos los códigos
                </Button>
              </div>
            )}
          </div>
          
          <Button onClick={handleFinish} className="w-full">
            Finalizar
          </Button>
        </div>
      </div>
    );
  }

  return null;
}