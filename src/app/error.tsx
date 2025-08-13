'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/Button';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        // Log error to console for debugging
        console.error('Application error:', error);
        
        // In production, you might want to send this to an error reporting service
        if (process.env.NODE_ENV === 'production') {
            // Example: Send to error reporting service
            // reportError(error);
        }
    }, [error]);

    const getErrorMessage = () => {
        if (error.message.includes('ECONNREFUSED')) {
            return 'No se pudo conectar con la base de datos. Por favor, inténtalo más tarde.';
        }
        if (error.message.includes('Authentication')) {
            return 'Error de autenticación. Por favor, inicia sesión nuevamente.';
        }
        if (error.message.includes('Network')) {
            return 'Error de conexión. Verifica tu conexión a internet.';
        }
        return 'Ha ocurrido un error inesperado en el servidor.';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">500</h1>
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Server Error
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        {getErrorMessage()}
                    </p>
                </div>

                <div className="space-y-4">
                    <Button 
                        onClick={reset}
                        className="w-full"
                    >
                        Try Again
                    </Button>

                    <Link href="/">
                        <Button variant="outline" className="w-full">
                            Go to Homepage
                        </Button>
                    </Link>

                    <Link href="/dashboard">
                        <Button variant="outline" className="w-full">
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="mt-8 p-4 bg-red-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        What happened?
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• The server encountered an unexpected error</li>
                        <li>• This issue has been automatically reported</li>
                        <li>• Try refreshing the page or come back later</li>
                    </ul>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Debug Information:
                        </h4>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                            {error.message}
                        </pre>
                        {error.digest && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                <div className="mt-6 text-xs text-gray-500 dark:text-gray-500">
                    Error Code: SERVER_ERROR
                </div>
            </div>
        </div>
    );
}