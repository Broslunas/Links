'use client';

import { useEffect } from 'react';
import { RedirectError } from '../../components/ui/RedirectError';

interface SlugErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function SlugErrorPage({ error, reset }: SlugErrorPageProps) {
    useEffect(() => {
        // Log error to console for debugging
        console.error('Slug redirect error:', error);

        // In production, you might want to send this to an error reporting service
        if (process.env.NODE_ENV === 'production') {
            // Example: Send to error reporting service
            // reportError(error, { context: 'slug-redirect' });
        }
    }, [error]);

    const getErrorMessage = () => {
        // Handle custom error types
        if (error.name === 'ExpiredLinkError') {
            return error.message;
        }
        if (error.name === 'DatabaseConnectionError') {
            return 'No se pudo conectar con la base de datos para procesar la redirección. Por favor, inténtalo más tarde.';
        }

        // Handle other common error patterns
        if (error.message.includes('ECONNREFUSED') || error.message.includes('database')) {
            return 'No se pudo conectar con la base de datos para procesar la redirección. Por favor, inténtalo más tarde.';
        }
        if (error.message.includes('Authentication') || error.message.includes('auth')) {
            return 'Error de autenticación al procesar la redirección. El enlace puede requerir permisos especiales.';
        }
        if (error.message.includes('Network') || error.message.includes('fetch')) {
            return 'Error de conexión al procesar la redirección. Verifica tu conexión a internet.';
        }
        if (error.message.includes('timeout')) {
            return 'La solicitud ha tardado demasiado tiempo. Por favor, inténtalo de nuevo.';
        }
        return 'Ha ocurrido un error inesperado al procesar la redirección. Nuestro equipo ha sido notificado automáticamente.';
    };

    const getExpirationDate = () => {
        // Extract expiration date from ExpiredLinkError if available
        if (error.name === 'ExpiredLinkError' && 'expirationDate' in error) {
            return (error as any).expirationDate;
        }
        return undefined;
    };

    // Check if this is an expired link error
    const isExpiredError = error.name === 'ExpiredLinkError' ||
        error.message.includes('expired') ||
        error.message.includes('Expired');

    if (isExpiredError) {
        return (
            <RedirectError
                type="expired"
                message={getErrorMessage()}
                expirationDate={getExpirationDate()}
            />
        );
    }

    return (
        <RedirectError
            type="server_error"
            message={getErrorMessage()}
        />
    );
}