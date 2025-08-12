import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 dark:bg-gray-900">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Broslunas Links
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Un acortador de URLs moderno con análisis avanzado
        </p>

        <div className="flex justify-center space-x-4">
          {session ? (
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Ir al Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
