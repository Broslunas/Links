'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import { Shield, AlertCircle } from 'lucide-react';

export default function Verify2FAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error } = useToast();
  
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [remainingBackupCodes, setRemainingBackupCodes] = useState<number | null>(null);
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user needs 2FA verification
    checkTwoFactorStatus();
  }, [session, status, router]);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/user/two-factor/setup');
      if (response.ok) {
        const data = await response.json();
        if (!data.data.enabled) {
          // User doesn't have 2FA enabled, redirect to callback URL
          router.push(callbackUrl);
          return;
        }
      }

      // Get remaining backup codes count
      const backupResponse = await fetch('/api/user/two-factor/backup-codes');
      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        setRemainingBackupCodes(backupData.data.count);
      }
    } catch (err) {
      console.error('Error checking 2FA status:', err);
    }
  };

  const handleVerify = async () => {
    const codeToVerify = useBackupCode ? backupCode.trim() : token.trim();
    
    if (!codeToVerify) {
      error(useBackupCode ? 'Por favor ingresa tu código de respaldo' : 'Por favor ingresa tu código 2FA');
      return;
    }

    if (!useBackupCode && codeToVerify.length !== 6) {
      error('El código 2FA debe tener 6 dígitos');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/user/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: codeToVerify,
          isSetup: false, // This is for login verification, not setup
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al verificar el código');
      }

      // Store 2FA verification in cookies for middleware
      document.cookie = `2fa-verified=true; path=/; max-age=3600; secure; samesite=strict`;
      document.cookie = `2fa-verified-time=${Date.now()}; path=/; max-age=3600; secure; samesite=strict`;
      
      success('Verificación 2FA exitosa');
      
      // Redirect to the original callback URL
      router.push(callbackUrl);
      
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      error(err instanceof Error ? err.message : 'Error al verificar el código');
      
      // Clear the input
      if (useBackupCode) {
        setBackupCode('');
      } else {
        setToken('');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Verificación 2FA
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa tu código de autenticación para continuar
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          {!useBackupCode ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-card-foreground mb-2">
                  Código de Autenticación
                </label>
                <Input
                  id="token"
                  type="text"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              
              <Button
                onClick={handleVerify}
                disabled={isVerifying || token.length !== 6}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Código'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="backup-code" className="block text-sm font-medium text-card-foreground mb-2">
                  Código de Respaldo
                </label>
                <Input
                  id="backup-code"
                  type="text"
                  placeholder="Ingresa tu código de respaldo"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.trim())}
                  className="text-center"
                  autoFocus
                />
              </div>
              
              {remainingBackupCodes !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {remainingBackupCodes > 0 
                      ? `Te quedan ${remainingBackupCodes} códigos de respaldo`
                      : 'No tienes códigos de respaldo disponibles'
                    }
                  </span>
                </div>
              )}
              
              <Button
                onClick={handleVerify}
                disabled={isVerifying || !backupCode.trim()}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Verificando...
                  </>
                ) : (
                  'Usar Código de Respaldo'
                )}
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setToken('');
                setBackupCode('');
              }}
              className="w-full text-sm text-primary hover:text-primary/80 underline"
            >
              {useBackupCode 
                ? 'Usar código de autenticación en su lugar'
                : 'Usar código de respaldo en su lugar'
              }
            </button>
            
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline"
            >
              Cerrar sesión y usar otra cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}