'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
        </div>
    ),
});

// Import Swagger UI CSS
import 'swagger-ui-react/swagger-ui.css';

interface ApiToken {
    tokenPreview?: string;
    isActive: boolean;
}

export default function ApiDocumentationPage() {
    const { data: session, status } = useSession();
    const [apiToken, setApiToken] = useState<string>('');
    const [userToken, setUserToken] = useState<ApiToken | null>(null);
    const [isLoadingToken, setIsLoadingToken] = useState(false);
    const [openApiSpec, setOpenApiSpec] = useState<any>(null);

    // Load OpenAPI specification
    useEffect(() => {
        fetch('/api/openapi.json')
            .then(response => response.json())
            .then(spec => setOpenApiSpec(spec))
            .catch(error => {
                console.error('Error loading OpenAPI spec:', error);
                toast.error('Error loading API specification');
            });
    }, []);

    // Load user's API token if authenticated
    useEffect(() => {
        if (session?.user) {
            fetchUserToken();
        }
    }, [session]);

    const fetchUserToken = async () => {
        try {
            setIsLoadingToken(true);
            const response = await fetch('/api/user/token');
            if (response.ok) {
                const data = await response.json();
                setUserToken(data.data);
            }
        } catch (error) {
            console.error('Error fetching user token:', error);
        } finally {
            setIsLoadingToken(false);
        }
    };

    const generateToken = async () => {
        try {
            setIsLoadingToken(true);
            const response = await fetch('/api/user/token', {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                setUserToken(data.data);
                setApiToken(data.data.token || '');
                toast.success('API token generated successfully');
            } else {
                const error = await response.json();
                toast.error(error.error?.message || 'Error generating token');
            }
        } catch (error) {
            console.error('Error generating token:', error);
            toast.error('Error generating API token');
        } finally {
            setIsLoadingToken(false);
        }
    };

    const revokeToken = async () => {
        try {
            setIsLoadingToken(true);
            const response = await fetch('/api/user/token', {
                method: 'DELETE',
            });

            if (response.ok) {
                setUserToken(null);
                setApiToken('');
                toast.success('API token revoked successfully');
            } else {
                const error = await response.json();
                toast.error(error.error?.message || 'Error revoking token');
            }
        } catch (error) {
            console.error('Error revoking token:', error);
            toast.error('Error revoking API token');
        } finally {
            setIsLoadingToken(false);
        }
    };

    // Custom request interceptor to add authentication
    const requestInterceptor = (request: any) => {
        if (apiToken && request.url.includes('/api/v1/')) {
            request.headers.Authorization = `Bearer ${apiToken}`;
        }
        return request;
    };

    if (!openApiSpec) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    API Documentation
                                </h1>
                                <p className="mt-2 text-gray-600">
                                    Interactive documentation for the URL Shortener API v1
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    v1.0.0
                                </span>
                                {session?.user && (
                                    <a
                                        href="/dashboard"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Dashboard
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Authentication Section */}
            {status !== 'loading' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Authentication
                        </h2>

                        {!session?.user ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">
                                            Authentication Required
                                        </h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p>
                                                To test the API endpoints, you need to{' '}
                                                <a href="/auth/signin" className="font-medium underline hover:text-yellow-600">
                                                    sign in
                                                </a>{' '}
                                                and generate an API token.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Generate an API token to test the endpoints directly from this documentation.
                                </p>

                                {userToken?.isActive ? (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                            <div className="flex items-center">
                                                <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-medium text-green-800">
                                                    API Token Active: {userToken.tokenPreview}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex space-x-3">
                                            <button
                                                onClick={generateToken}
                                                disabled={isLoadingToken}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                {isLoadingToken ? 'Generating...' : 'Regenerate Token'}
                                            </button>
                                            <button
                                                onClick={revokeToken}
                                                disabled={isLoadingToken}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                {isLoadingToken ? 'Revoking...' : 'Revoke Token'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                            <p className="text-sm text-gray-600">
                                                No API token found. Generate one to start testing the API.
                                            </p>
                                        </div>

                                        <button
                                            onClick={generateToken}
                                            disabled={isLoadingToken}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            {isLoadingToken ? 'Generating...' : 'Generate API Token'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Theory and Best Practices Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Getting Started
                        </h2>

                        <div className="prose prose-sm max-w-none">
                            <h3 className="text-base font-medium text-gray-900">Authentication</h3>
                            <p className="text-gray-600">
                                All API endpoints require authentication using a Bearer token. Include your API token in the Authorization header:
                            </p>
                            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                                <code>Authorization: Bearer uls_your_api_token_here</code>
                            </pre>

                            <h3 className="text-base font-medium text-gray-900 mt-6">Rate Limits</h3>
                            <p className="text-gray-600">
                                The API implements rate limiting to ensure fair usage:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 space-y-1">
                                <li>GET requests: 100 requests per hour</li>
                                <li>POST requests: 50 requests per hour</li>
                                <li>PUT/DELETE requests: 100 requests per hour</li>
                                <li>Analytics requests: 200 requests per hour</li>
                            </ul>

                            <h3 className="text-base font-medium text-gray-900 mt-6">Response Format</h3>
                            <p className="text-gray-600">
                                All API responses follow a consistent format with success/error indicators, data payload, and metadata:
                            </p>
                            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                                <code>{JSON.stringify({
                                    success: true,
                                    data: "...",
                                    pagination: "...",
                                    timestamp: "2024-01-15T10:30:00.000Z"
                                }, null, 2)}</code>
                            </pre>

                            <h3 className="text-base font-medium text-gray-900 mt-6">Best Practices</h3>
                            <ul className="list-disc list-inside text-gray-600 space-y-1">
                                <li>Always check the <code>success</code> field in responses</li>
                                <li>Implement proper error handling for 4xx and 5xx status codes</li>
                                <li>Use pagination parameters for large datasets</li>
                                <li>Cache responses when appropriate to reduce API calls</li>
                                <li>Monitor rate limit headers to avoid hitting limits</li>
                                <li>Keep your API token secure and rotate it regularly</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Swagger UI */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <SwaggerUI
                        spec={openApiSpec}
                        requestInterceptor={requestInterceptor}
                        docExpansion="list"
                        defaultModelsExpandDepth={2}
                        defaultModelExpandDepth={2}
                        displayRequestDuration={true}
                        tryItOutEnabled={true}
                        filter={true}
                        showExtensions={true}
                        showCommonExtensions={true}
                        deepLinking={true}
                        displayOperationId={false}
                        supportedSubmitMethods={['get', 'post', 'put', 'delete']}
                        onComplete={(system: any) => {
                            // Auto-authorize with the API token if available
                            if (apiToken) {
                                system.preauthorizeApiKey('BearerAuth', apiToken);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}