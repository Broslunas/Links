'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings, Home, Mail, Clock, Shield } from 'lucide-react';

const AccountInactivePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-red-500 dark:bg-red-600 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Cuenta Inactiva
                </h1>
                <p className="text-red-100 mt-1">
                  Tu acceso ha sido temporalmente suspendido
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Status Info */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    Estado de la Cuenta
                  </h2>
                  <p className="text-red-700 dark:text-red-300 mb-4">
                    Tu cuenta ha sido desactivada por un administrador. Esto puede deberse a:
                  </p>
                  <ul className="list-disc list-inside text-red-600 dark:text-red-400 space-y-1 text-sm">
                    <li>Violación de los términos de servicio</li>
                    <li>Actividad sospechosa detectada</li>
                    <li>Solicitud de suspensión temporal</li>
                    <li>Proceso de verificación pendiente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* What you can do */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                ¿Qué puedes hacer?
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <Settings className="h-8 w-8 text-blue-500 mb-3" />
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Revisar Configuración
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 text-sm">
                    Accede a tu configuración para revisar el estado de tu cuenta
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <Mail className="h-8 w-8 text-green-500 mb-3" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Contactar Soporte
                  </h3>
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    Nuestro equipo puede ayudarte a resolver cualquier problema
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <Home className="h-8 w-8 text-gray-500 mb-3" />
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Página Principal
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Vuelve a la página principal mientras resuelves el problema
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Link href="/dashboard/settings" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                    <Settings className="h-4 w-4 mr-2" />
                    Ir a Configuración
                  </Button>
                </Link>
                
                <Link href="/help" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    <Mail className="h-4 w-4 mr-2" />
                    Contactar Soporte
                  </Button>
                </Link>
                
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    <Home className="h-4 w-4 mr-2" />
                    Página Principal
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Si crees que esto es un error, por favor contacta con nuestro equipo de soporte.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Tiempo de respuesta promedio: 24 horas
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Necesitas ayuda inmediata?{' '}
            <Link href="/help" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Visita nuestro centro de ayuda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountInactivePage;