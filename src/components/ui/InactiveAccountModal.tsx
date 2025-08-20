'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { AlertTriangle, Settings, Home, Mail } from 'lucide-react';

interface InactiveAccountModalProps {
  isOpen: boolean;
}

const InactiveAccountModal: React.FC<InactiveAccountModalProps> = ({ isOpen }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <>
      {/* Backdrop - no se puede cerrar */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-auto border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cuenta Inactiva
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tu cuenta ha sido desactivada
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Tu cuenta ha sido desactivada por un administrador. Para obtener más información o solicitar la reactivación de tu cuenta, puedes:
              </p>
              
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>Revisar la configuración de tu cuenta</li>
                <li>Contactar con el soporte técnico</li>
                <li>Volver a la página principal</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => handleNavigation('/dashboard/settings')}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Settings className="h-4 w-4" />
                Ir a Configuración
              </Button>
              
              <Button
                onClick={() => handleNavigation('/')}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                <Home className="h-4 w-4" />
                Página Principal
              </Button>
              
              <Button
                onClick={() => handleNavigation('/help')}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                <Mail className="h-4 w-4" />
                Contactar Soporte
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Si crees que esto es un error, por favor contacta con el administrador.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InactiveAccountModal;