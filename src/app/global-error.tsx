'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        // Log critical error
        console.error('Critical application error:', error);
        
        // In production, send to error reporting service
        if (process.env.NODE_ENV === 'production') {
            // Example: Send to error reporting service
            // reportCriticalError(error);
        }
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="mb-8">
                            <h1 className="text-6xl font-bold text-gray-900 mb-2">500</h1>
                            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                                Critical Error
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Something went critically wrong. The application needs to be restarted.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={reset}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Restart Application
                            </button>

                            <button 
                                onClick={() => window.location.href = '/'}
                                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Go to Homepage
                            </button>
                        </div>

                        <div className="mt-8 p-4 bg-red-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Critical System Error
                            </h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• A critical error occurred in the application</li>
                                <li>• The error has been automatically reported</li>
                                <li>• Please restart the application</li>
                            </ul>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    Debug Information:
                                </h4>
                                <pre className="text-xs text-gray-600 overflow-auto">
                                    {error.message}
                                </pre>
                                <pre className="text-xs text-gray-600 overflow-auto mt-2">
                                    {error.stack}
                                </pre>
                                {error.digest && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Error ID: {error.digest}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="mt-6 text-xs text-gray-500">
                            Error Code: CRITICAL_ERROR
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}