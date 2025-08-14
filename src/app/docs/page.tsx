'use client';

import { useState, useEffect } from 'react';
import { LoadingSpinner } from '../../components/ui';
import { FiCopy, FiExternalLink } from 'react-icons/fi';

interface ApiDocs {
    title: string;
    version: string;
    description: string;
    baseUrl: string;
    authentication: {
        type: string;
        description: string;
        note: string;
    };
    rateLimit: {
        requests: number;
        window: string;
        description: string;
    };
    endpoints: Record<string, any>;
    examples: {
        curl: Record<string, string>;
    };
}

export default function DocsPage() {
    const [docs, setDocs] = useState<ApiDocs | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedExample, setCopiedExample] = useState<string | null>(null);

    useEffect(() => {
        loadDocs();
    }, []);

    const loadDocs = async () => {
        try {
            const response = await fetch('/docs');
            if (!response.ok) {
                throw new Error('Failed to load documentation');
            }
            const docsData = await response.json();
            setDocs(docsData);
        } catch (error) {
            console.error('Error loading docs:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyExample = async (example: string, key: string) => {
        try {
            await navigator.clipboard.writeText(example);
            setCopiedExample(key);
            setTimeout(() => setCopiedExample(null), 2000);
        } catch (error) {
            console.error('Error copying example:', error);
        }
    };

    const renderResponseExample = (response: any) => {
        return (
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                <code>{JSON.stringify(response.example, null, 2)}</code>
            </pre>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-600 dark:text-gray-400 mt-4">Cargando documentación...</p>
                </div>
            </div>
        );
    }

    if (!docs) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">Error al cargar la documentación</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                {docs.title}
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
                                {docs.description}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                                v{docs.version}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Base URL: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{docs.baseUrl}</code></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Authentication */}
                        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                Autenticación
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {docs.authentication.type}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        {docs.authentication.description}
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                                        💡 {docs.authentication.note}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Rate Limiting */}
                        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                Límites de Velocidad
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {docs.rateLimit.requests}
                                </div>
                                <div>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        requests per {docs.rateLimit.window}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        {docs.rateLimit.description}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Endpoints */}
                        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                                Endpoints
                            </h2>

                            {Object.entries(docs.endpoints).map(([endpoint, details]: [string, any]) => (
                                <div key={endpoint} className="mb-8 last:mb-0">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${endpoint.startsWith('POST')
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : endpoint.startsWith('GET')
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}>
                                            {endpoint.split(' ')[0]}
                                        </span>
                                        <code className="text-lg font-mono text-gray-900 dark:text-white">
                                            {endpoint.split(' ')[1]}
                                        </code>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        {details.description}
                                    </p>

                                    {/* Request Body */}
                                    {details.body && (
                                        <div className="mb-4">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Request Body</h4>
                                            <div className="space-y-2">
                                                {Object.entries(details.body).map(([field, fieldDetails]: [string, any]) => (
                                                    <div key={field} className="flex items-start gap-3 text-sm">
                                                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                                            {field}
                                                        </code>
                                                        <div className="flex-1">
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                {fieldDetails.type}
                                                                {fieldDetails.required && <span className="text-red-500 ml-1">*</span>}
                                                            </span>
                                                            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                                                                {fieldDetails.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Parameters */}
                                    {details.parameters && (
                                        <div className="mb-4">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Parameters</h4>
                                            <div className="space-y-2">
                                                {Object.entries(details.parameters).map(([param, paramDetails]: [string, any]) => (
                                                    <div key={param} className="flex items-start gap-3 text-sm">
                                                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                                            {param}
                                                        </code>
                                                        <div className="flex-1">
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                {paramDetails.type}
                                                                {paramDetails.required && <span className="text-red-500 ml-1">*</span>}
                                                            </span>
                                                            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                                                                {paramDetails.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Responses */}
                                    <div className="mb-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Responses</h4>
                                        <div className="space-y-3">
                                            {Object.entries(details.responses).map(([status, response]: [string, any]) => (
                                                <div key={status}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.startsWith('2')
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : status.startsWith('4')
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                            }`}>
                                                            {status}
                                                        </span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {response.description}
                                                        </span>
                                                    </div>
                                                    {response.example && renderResponseExample(response)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Links */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Enlaces Rápidos
                            </h3>
                            <div className="space-y-2">
                                <a
                                    href="/dashboard/settings"
                                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                >
                                    <FiExternalLink size={14} />
                                    Generar Token de API
                                </a>
                                <a
                                    href="/dashboard"
                                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                >
                                    <FiExternalLink size={14} />
                                    Dashboard
                                </a>
                            </div>
                        </div>

                        {/* Examples */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Ejemplos cURL
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(docs.examples.curl).map(([key, example]) => (
                                    <div key={key}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </h4>
                                            <button
                                                onClick={() => copyExample(example, key)}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                <FiCopy size={14} />
                                            </button>
                                        </div>
                                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                                            <code>{example}</code>
                                        </pre>
                                        {copiedExample === key && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                ✓ Copiado al portapapeles
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}