'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button, LoadingSpinner, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui';
import SignInForm from '../../../components/auth/SignInForm';
import Image from 'next/image';

export default function ExtensionLoginPage() {
    const { data: session, status } = useSession();
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchToken();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [status]);

    const fetchToken = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/extension-token');
            const data = await response.json();

            if (data.success) {
                // For extension connection, we always generate a fresh token
                generateNewToken();
            } else {
                setError('No se pudo cargar la información del token.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const generateNewToken = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/extension-token', { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                setToken(data.data.token);
            } else {
                setError(data.error?.message || 'Error al generar el token para la extensión.');
            }
        } catch (err) {
            setError('Error de conexión al generar el token.');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        if (!token) return;

        // Dispatch a custom event that the content script will catch
        const event = new CustomEvent('BroslunasLinkConnected', {
            detail: { token: token }
        });
        document.dispatchEvent(event);
        
        setConnected(true);
    };

    if (status === 'loading' || (status === 'authenticated' && loading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-muted-foreground">Preparando conexión...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="max-w-md w-full border-primary/20 shadow-xl shadow-primary/5">
                {status === 'unauthenticated' ? (
                    <>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="p-1 rounded-2xl bg-white border border-primary/20 shadow-md">
                                    <img src="https://cdn.broslunas.com/favicon.png" alt="Broslunas Logo" className="w-16 h-16 object-contain" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
                            <CardDescription>
                                Necesitas acceder a tu cuenta para conectar la extensión.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SignInForm callbackUrl="/extension/login" />
                        </CardContent>
                    </>
                ) : (
                    <>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="p-1 rounded-2xl bg-white border border-primary/20 shadow-md">
                                    <img src="https://cdn.broslunas.com/favicon.png" alt="Broslunas Logo" className="w-16 h-16 object-contain" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">Conectar Extensión</CardTitle>
                            <CardDescription>
                                Conectando con <strong>{session?.user?.email}</strong>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            {error ? (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-center">
                                    <p>{error}</p>
                                    <Button variant="outline" size="sm" onClick={fetchToken} className="mt-2">Reintentar</Button>
                                </div>
                            ) : connected ? (
                                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                                    <div className="flex justify-center mb-2 text-green-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-green-700 dark:text-green-400">¡Conexión Exitosa!</h3>
                                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">Ya puedes cerrar esta pestaña y empezar a usar la extensión.</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Al conectar la extensión, podrás acortar enlaces instantáneamente desde tu navegador.
                                    </p>
                                    
                                    <Button 
                                        className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                                        onClick={handleConnect}
                                        disabled={!token}
                                    >
                                        Autorizar y Conectar
                                    </Button>
                                    
                                    <p className="text-xs text-center text-muted-foreground pt-4">
                                        Se generará un nuevo Token seguro de API.
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </>
                )}
            </Card>
            
            {/* Handshake element */}
            {token && !connected && (
                <div id="extension_auth_handshake" data-token={token} style={{ display: 'none' }}></div>
            )}
        </div>
    );
}
