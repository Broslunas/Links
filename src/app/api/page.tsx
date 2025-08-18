'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div
        className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        data-testid="loading-spinner"
      ></div>
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
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            data-testid="loading-spinner"
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Documentación de la API
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Interactive documentation for the URL Shortener API v1
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  v1.0.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
          <style jsx global>{`
            .dark .swagger-ui {
              filter: invert(1) hue-rotate(180deg);
            }
            .dark .swagger-ui .scheme-container {
              background: #374151;
              border: 1px solid #4b5563;
            }
            .dark .swagger-ui .info {
              background: #374151;
            }
            .dark .swagger-ui .info .title {
              color: #f9fafb;
            }
            .dark .swagger-ui .opblock.opblock-post {
              background: rgba(73, 204, 144, 0.1);
              border-color: #10b981;
            }
            .dark .swagger-ui .opblock.opblock-get {
              background: rgba(96, 165, 250, 0.1);
              border-color: #3b82f6;
            }
            .dark .swagger-ui .opblock.opblock-put {
              background: rgba(251, 191, 36, 0.1);
              border-color: #f59e0b;
            }
            .dark .swagger-ui .opblock.opblock-delete {
              background: rgba(248, 113, 113, 0.1);
              border-color: #ef4444;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
