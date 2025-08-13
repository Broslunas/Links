import Link from 'next/link';
import { Button } from '../components/ui/Button';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Link Not Found
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        The short link you&apos;re looking for doesn&apos;t exist or has been removed.
                        It might have been deleted, expired, or you may have mistyped the URL.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link href="/">
                        <Button className="w-full">
                            Go to Homepage
                        </Button>
                    </Link>

                    <Link href="/dashboard">
                        <Button variant="outline" className="w-full">
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        What you can do:
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Check if the URL is typed correctly</li>
                        <li>• Contact the person who shared this link</li>
                        <li>• Create your own short links</li>
                    </ul>
                </div>

                <div className="mt-6 text-xs text-gray-500 dark:text-gray-500">
                    Error Code: LINK_NOT_FOUND
                </div>
            </div>
        </div>
    );
}