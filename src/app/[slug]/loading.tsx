import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Redirigiendo a tu destino...
                </p>
            </div>
        </div>
    );
}