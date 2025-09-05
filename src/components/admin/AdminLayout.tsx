'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NotificationCenter from './NotificationCenter';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin Dashboard' }) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect if not admin
    React.useEffect(() => {
        if (status === 'loading') return;

        if (!session?.user || session.user.role !== 'admin') {
            router.push('/');
            return;
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session?.user || session.user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                        </div>

                        {/* Admin Navigation */}
                        <nav className="flex items-center space-x-6">
                            <a
                                href="/dashboard/admin"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Dashboard
                            </a>
                            <a
                                href="/dashboard/admin/users"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Usuarios
                            </a>
                            <a
                                href="/dashboard/admin/alerts"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Alertas
                            </a>

                            {/* Notification Center */}
                            <NotificationCenter />

                            {/* User Menu */}
                            <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-700">
                                    {session.user.name || session.user.email}
                                </span>
                                <button
                                    onClick={() => router.push('/api/auth/signout')}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;