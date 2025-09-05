// Client-side error handling utilities

import { toast } from 'sonner';
import { ApiResponse } from '../types';
import { ErrorCode } from './api-errors';

// Error message mapping for client-side display
const getClientErrorMessage = (code: string, defaultMessage?: string): string => {
  const messages: Record<string, string> = {
    // Authentication errors
    UNAUTHORIZED: 'Debes iniciar sesión para realizar esta acción',
    FORBIDDEN: 'No tienes permisos para realizar esta acción',
    INVALID_TOKEN: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
    SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',

    // Validation errors
    VALIDATION_ERROR: 'Por favor, verifica los datos ingresados',
    INVALID_URL: 'La URL ingresada no es válida',
    INVALID_SLUG: 'El slug debe contener solo letras minúsculas, números, guiones y guiones bajos',
    SLUG_TAKEN: 'Este slug ya está en uso. Por favor, elige otro',
    INVALID_USER_ID: 'Error de usuario. Por favor, inicia sesión nuevamente',

    // Resource errors
    NOT_FOUND: 'El recurso solicitado no fue encontrado',
    LINK_NOT_FOUND: 'El enlace no existe o ha sido eliminado',
    USER_NOT_FOUND: 'Usuario no encontrado',
    RESOURCE_EXISTS: 'El recurso ya existe',

    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'Has excedido el límite de solicitudes. Inténtalo más tarde',
    TOO_MANY_REQUESTS: 'Demasiadas solicitudes. Por favor, espera un momento',

    // Server errors
    INTERNAL_ERROR: 'Error interno del servidor. Inténtalo más tarde',
    DATABASE_ERROR: 'Error de base de datos. Inténtalo más tarde',
    EXTERNAL_SERVICE_ERROR: 'Servicio no disponible. Inténtalo más tarde',
    CONFIGURATION_ERROR: 'Error de configuración. Contacta al soporte',

    // Business logic errors
    LINK_INACTIVE: 'Este enlace está inactivo',
    LINK_EXPIRED: 'Este enlace ha expirado',
    QUOTA_EXCEEDED: 'Has alcanzado el límite máximo de enlaces',

    // Development/Debug errors
    NOT_ALLOWED: 'Operación no permitida',
    FEATURE_DISABLED: 'Esta funcionalidad está temporalmente deshabilitada'
  };

  return messages[code] || defaultMessage || 'Ha ocurrido un error inesperado';
};

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Show toast notification
export const showToast = (
  message: string,
  type: ToastType = 'info',
  options?: {
    duration?: number;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
) => {
  const toastOptions = {
    duration: options?.duration || 4000,
    description: options?.description,
    action: options?.action,
  };

  switch (type) {
    case 'success':
      toast.success(message, toastOptions);
      break;
    case 'error':
      toast.error(message, toastOptions);
      break;
    case 'warning':
      toast.warning(message, toastOptions);
      break;
    case 'info':
    default:
      toast.info(message, toastOptions);
      break;
  }
};

// Handle API response errors
export const handleApiError = (
  error: any,
  options?: {
    showToast?: boolean;
    customMessage?: string;
    onAuthError?: () => void;
    onValidationError?: (details?: any) => void;
    onServerError?: () => void;
  }
): string => {
  const {
    showToast: shouldShowToast = true,
    customMessage,
    onAuthError,
    onValidationError,
    onServerError
  } = options || {};

  let errorMessage = 'Ha ocurrido un error inesperado';
  let errorCode = 'INTERNAL_ERROR';
  let errorDetails: any = null;

  // Handle different error formats
  if (error?.response?.data) {
    // Axios error format
    const apiResponse: ApiResponse = error.response.data;
    if (apiResponse.error) {
      errorCode = apiResponse.error.code;
      errorMessage = getClientErrorMessage(errorCode, apiResponse.error.message);
      errorDetails = apiResponse.error.details;
    }
  } else if (error?.error) {
    // Direct API response format
    errorCode = error.error.code;
    errorMessage = getClientErrorMessage(errorCode, error.error.message);
    errorDetails = error.error.details;
  } else if (error?.message) {
    // Generic error format
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Use custom message if provided
  if (customMessage) {
    errorMessage = customMessage;
  }

  // Handle specific error types
  if (errorCode === 'UNAUTHORIZED' || errorCode === 'SESSION_EXPIRED') {
    if (onAuthError) {
      onAuthError();
    }
    if (shouldShowToast) {
      showToast(errorMessage, 'error', {
        duration: 6000,
        action: {
          label: 'Iniciar sesión',
          onClick: () => window.location.href = '/auth/signin'
        }
      });
    }
  } else if (errorCode === 'VALIDATION_ERROR') {
    if (onValidationError) {
      onValidationError(errorDetails);
    }
    if (shouldShowToast) {
      showToast(errorMessage, 'warning');
    }
  } else if (errorCode.includes('ERROR') && errorCode !== 'VALIDATION_ERROR') {
    if (onServerError) {
      onServerError();
    }
    if (shouldShowToast) {
      showToast(errorMessage, 'error', {
        duration: 6000,
        action: {
          label: 'Reintentar',
          onClick: () => window.location.reload()
        }
      });
    }
  } else {
    if (shouldShowToast) {
      showToast(errorMessage, 'error');
    }
  }

  return errorMessage;
};

// Handle fetch errors
export const handleFetchError = async (
  response: Response,
  options?: {
    showToast?: boolean;
    customMessage?: string;
    onAuthError?: () => void;
    onValidationError?: (details?: any) => void;
    onServerError?: () => void;
  }
): Promise<string> => {
  let errorData: any = null;

  try {
    errorData = await response.json();
  } catch {
    // If response is not JSON, create a generic error
    errorData = {
      error: {
        code: response.status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`
      }
    };
  }

  return handleApiError(errorData, options);
};

// Success toast helpers
export const showSuccessToast = (message: string, description?: string) => {
  showToast(message, 'success', { description });
};

export const showErrorToast = (message: string, description?: string) => {
  showToast(message, 'error', { description });
};

export const showWarningToast = (message: string, description?: string) => {
  showToast(message, 'warning', { description });
};

export const showInfoToast = (message: string, description?: string) => {
  showToast(message, 'info', { description });
};

// Loading toast helpers
export const showLoadingToast = (message: string = 'Cargando...') => {
  return toast.loading(message);
};

export const updateLoadingToast = (
  toastId: string | number,
  message: string,
  type: ToastType = 'success'
) => {
  switch (type) {
    case 'success':
      toast.success(message, { id: toastId });
      break;
    case 'error':
      toast.error(message, { id: toastId });
      break;
    case 'warning':
      toast.warning(message, { id: toastId });
      break;
    case 'info':
    default:
      toast.info(message, { id: toastId });
      break;
  }
};

// Async operation wrapper with toast notifications
export const withToastHandler = async <T>(
  operation: () => Promise<T>,
  options?: {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    showLoading?: boolean;
    showSuccess?: boolean;
    showError?: boolean;
    onSuccess?: (result: T) => void;
    onError?: (error: any) => void;
  }
): Promise<T | null> => {
  const {
    loadingMessage = 'Procesando...',
    successMessage = 'Operación completada exitosamente',
    errorMessage,
    showLoading = true,
    showSuccess = true,
    showError = true,
    onSuccess,
    onError
  } = options || {};

  let toastId: string | number | undefined;

  try {
    if (showLoading) {
      toastId = showLoadingToast(loadingMessage);
    }

    const result = await operation();

    if (toastId && showSuccess) {
      updateLoadingToast(toastId, successMessage, 'success');
    } else if (showSuccess) {
      showSuccessToast(successMessage);
    }

    if (onSuccess) {
      onSuccess(result);
    }

    return result;
  } catch (error) {
    if (toastId) {
      toast.dismiss(toastId);
    }

    if (showError) {
      handleApiError(error, {
        customMessage: errorMessage,
        showToast: true
      });
    }

    if (onError) {
      onError(error);
    }

    return null;
  }
};

// Network error detection
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('fetch') ||
    !navigator.onLine
  );
};

// Retry mechanism for failed requests
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      // Don't retry on client errors (4xx)
      if (error && typeof error === 'object' && 'response' in error &&
        error.response && typeof error.response === 'object' && 'status' in error.response &&
        typeof error.response.status === 'number' &&
        error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};