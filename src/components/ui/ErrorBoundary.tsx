'use client';

import React from 'react';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-destructive">Algo salió mal</h2>
        <p className="text-muted-foreground max-w-md">
          Ocurrió un error inesperado. Por favor, inténtalo de nuevo o contacta
          soporte si el problema persiste.
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm font-medium">
              Detalles del error
            </summary>
            <pre className="mt-2 text-xs bg-muted p-4 rounded-md overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
      <div className="flex space-x-2">
        <Button onClick={resetError}>Intentar de nuevo</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Recargar página
        </Button>
      </div>
    </div>
  );
};

export { ErrorBoundary, DefaultErrorFallback };
