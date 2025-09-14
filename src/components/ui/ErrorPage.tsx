'use client';

import React from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, XCircle, Ban, UserX } from 'lucide-react';

type ErrorType = '404' | 'click-limit' | 'time-restriction' | 'admin-disabled' | 'user-inactive' | 'custom-domain-error';

interface ErrorPageProps {
    type: ErrorType;
    message?: string;
    className?: string;
}

const errorConfig = {
    '404': {
        icon: XCircle,
        title: 'Enlace no encontrado',
        defaultMessage: 'El enlace que buscas no existe o ha sido eliminado. Verifica la URL o contacta al propietario.'
    },
    'click-limit': {
        icon: AlertTriangle,
        title: 'Límite de clicks alcanzado',
        defaultMessage: 'Este enlace ha alcanzado el número máximo de clicks permitidos. Si necesitas acceso, contacta al propietario.'
    },
    'time-restriction': {
        icon: Clock,
        title: 'Fuera de horario permitido',
        defaultMessage: 'Este enlace solo está disponible en una franja horaria específica. Intenta acceder en el horario permitido o consulta al propietario.'
    },
    'admin-disabled': {
        icon: Ban,
        title: 'Enlace deshabilitado por el administrador',
        defaultMessage: 'El administrador ha deshabilitado este enlace temporalmente. Si crees que es un error, comunícate con soporte.'
    },
    'user-inactive': {
        icon: UserX,
        title: 'Cuenta de usuario inactiva',
        defaultMessage: 'El propietario de este enlace tiene la cuenta inactiva. El enlace no está disponible hasta que la cuenta se reactive.'
    },
    'custom-domain-error': {
        icon: Ban,
        title: 'Error de dominio personalizado',
        defaultMessage: 'El dominio personalizado no está disponible, no está verificado o ha sido bloqueado. Revisa la configuración del dominio.'
    }
};

export const ErrorPage: React.FC<ErrorPageProps> = ({
    type,
    message,
    className
}) => {
    const config = errorConfig[type];
    const Icon = config.icon;

    return (
        <div className={cn(
            'flex flex-col items-center justify-center min-h-screen px-4 py-8',
            'space-y-6 sm:space-y-8',
            'max-w-sm sm:max-w-md mx-auto text-center',
            className
        )}>
            <div className="flex flex-col items-center space-y-4">
                <Icon className="w-16 h-16 text-destructive" />
                <h1 className="text-2xl font-semibold text-foreground">
                    {config.title}
                </h1>
                <p className="text-muted-foreground">
                    {message || config.defaultMessage}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                >
                    Ir al inicio
                </Button>
                <Button
                    variant="default"
                    onClick={() => window.history.back()}
                >
                    Volver atrás
                </Button>
            </div>
        </div>
    );
};