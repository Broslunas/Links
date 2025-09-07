'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { LinkCreator } from '../../../components/features/LinkCreator';
import { ArrowLeft } from 'lucide-react';

export default function NewLinkPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Handle authentication
    useEffect(() => {
        if (status === 'unauthenticated') {
            window.location.href = '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
        }
    }, [status]);

    const handleLinkCreated = (link: any) => {
        // Opcional: redirigir al dashboard o mostrar mensaje de éxito
        console.log('Link creado:', link);
    };

    const handleError = (error: string) => {
        console.error('Error al crear link:', error);
    };

    const goToDashboard = () => {
        router.push('/dashboard');
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToDashboard}
                        aria-label="Volver al dashboard"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Crear Nuevo Enlace</h1>
                        <p className="text-muted-foreground">
                            Transforma cualquier URL larga en un enlace corto y fácil de compartir
                        </p>
                    </div>
                </div>
            </div>

            {/* LinkCreator Component */}
            <div className="w-full">
                <LinkCreator 
                    onLinkCreated={handleLinkCreated}
                    onError={handleError}
                />
            </div>
        </div>
    );
}