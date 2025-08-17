'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './Button';

export interface RedirectErrorProps {
    type: 'not_found' | 'expired' | 'server_error';
    slug?: string;
    message?: string;
    expirationDate?: Date;
}

const RedirectError: React.FC<RedirectErrorProps> = ({
    type,
    slug,
    message,
    expirationDate
}) => {
    const getErrorContent = () => {
        switch (type) {
            case 'not_found':
                return {
                    title: '404',
                    heading: 'Enlace No Encontrado',
                    description: message || 'El enlace que buscas no existe o ha sido eliminado. Puede haber sido borrado, haber expirado, o es posible que hayas escrito mal la URL.',
                    errorCode: 'LINK_NOT_FOUND',
                    bgColor: 'from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800',
                    tips: [
                        'Verifica que la URL esté escrita correctamente',
                        'Contacta a la persona que compartió este enlace',
                        'Crea tus propios enlaces cortos'
                    ]
                };

            case 'expired':
                return {
                    title: '⏰',
                    heading: 'Enlace Expirado',
                    description: message || `Este enlace temporal ha expirado${expirationDate ? ` el ${expirationDate.toLocaleDateString('es-ES')}` : ''}. Los enlaces temporales tienen una fecha de vencimiento para mayor seguridad.`,
                    errorCode: 'LINK_EXPIRED',
                    bgColor: 'from-yellow-50 to-amber-100 dark:from-gray-900 dark:to-gray-800',
                    tips: [
                        'Solicita un nuevo enlace al creador',
                        'Verifica si hay una versión actualizada disponible',
                        'Los enlaces temporales expiran por seguridad'
                    ]
                };

            case 'server_error':
                return {
                    title: '500',
                    heading: 'Error del Servidor',
                    description: message || 'Ha ocurrido un error inesperado al procesar la redirección. Nuestro equipo ha sido notificado automáticamente.',
                    errorCode: 'REDIRECT_SERVER_ERROR',
                    bgColor: 'from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800',
                    tips: [
                        'Intenta recargar la página',
                        'Vuelve a intentarlo en unos minutos',
                        'El problema ha sido reportado automáticamente'
                    ]
                };

            default:
                return {
                    title: '❌',
                    heading: 'Error de Redirección',
                    description: message || 'Ha ocurrido un error al procesar la redirección.',
                    errorCode: 'REDIRECT_ERROR',
                    bgColor: 'from-gray-50 to-slate-100 dark:from-gray-900 dark:to-gray-800',
                    tips: [
                        'Intenta recargar la página',
                        'Verifica la URL',
                        'Contacta al soporte si el problema persiste'
                    ]
                };
        }
    };

    const errorContent = getErrorContent();

    return (
        <div className="max-w-md w-full text-center">
            <div className="mb-8">
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                    {errorContent.title}
                </h1>
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    {errorContent.heading}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    {errorContent.description}
                </p>
            </div>

            <div className="space-y-4">
                <Link href="/">
                    <Button className="w-full">
                        Ir a la Página Principal
                    </Button>
                </Link>

                <Link href="/dashboard">
                    <Button variant="outline" className="w-full">
                        Ir al Dashboard
                    </Button>
                </Link>

                {type === 'server_error' && (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.location.reload()}
                    >
                        Intentar de Nuevo
                    </Button>
                )}
            </div>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    ¿Qué puedes hacer?
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {errorContent.tips.map((tip, index) => (
                        <li key={index}>• {tip}</li>
                    ))}
                </ul>
            </div>

            {slug && (
                <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Enlace solicitado: <code className="font-mono">/{slug}</code>
                    </p>
                </div>
            )}

            <div className="mt-6 text-xs text-gray-500 dark:text-gray-500">
                Código de Error: {errorContent.errorCode}
            </div>
        </div>
    );
};

export { RedirectError };