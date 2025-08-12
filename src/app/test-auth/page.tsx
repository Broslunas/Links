'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function TestAuthPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Test de Autenticación</h1>
          <p className="text-gray-600 text-center mb-6">No estás autenticado</p>
          <div className="space-y-4">
            <button
              onClick={() => signIn('github')}
              className="w-full bg-gray-800 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Iniciar sesión con GitHub
            </button>
            <button
              onClick={() => signIn('google')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Iniciar sesión con Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">¡Autenticación Exitosa!</h1>
        
        <div className="space-y-4">
          <div className="text-center">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="Avatar"
                className="w-16 h-16 rounded-full mx-auto mb-4"
              />
            )}
            <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
            <p className="text-gray-600">{session?.user?.email}</p>
            <p className="text-sm text-gray-500">
              Proveedor: {session?.user?.provider}
            </p>
            <p className="text-sm text-gray-500">
              ID: {session?.user?.id}
            </p>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Ir al Dashboard
            </button>
            <button
              onClick={() => signOut()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}