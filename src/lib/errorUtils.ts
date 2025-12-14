import { toast } from 'sonner';

export type ErrorType = 
  | 'network' 
  | 'timeout' 
  | 'server' 
  | 'notFound' 
  | 'unauthorized' 
  | 'unknown';

interface ErrorDetails {
  type: ErrorType;
  message: string;
  retryable: boolean;
  action?: string;
}

/**
 * Parse error and return structured details
 */
export function parseError(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network/Connection errors
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return {
        type: 'network',
        message: 'Error de conexión. Comprueba tu conexión a internet.',
        retryable: true,
        action: 'Reintentar'
      };
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        type: 'timeout',
        message: 'La solicitud tardó demasiado. Inténtalo de nuevo.',
        retryable: true,
        action: 'Reintentar'
      };
    }
    
    // 404 errors
    if (message.includes('404') || message.includes('not found')) {
      return {
        type: 'notFound',
        message: 'El recurso que buscas no existe.',
        retryable: false
      };
    }
    
    // 401/403 errors
    if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
      return {
        type: 'unauthorized',
        message: 'No tienes permisos para acceder a este recurso.',
        retryable: false
      };
    }
    
    // 500+ errors
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('server')) {
      return {
        type: 'server',
        message: 'Error en el servidor. Inténtalo de nuevo más tarde.',
        retryable: true,
        action: 'Reintentar'
      };
    }
  }
  
  return {
    type: 'unknown',
    message: 'Ha ocurrido un error inesperado.',
    retryable: true,
    action: 'Reintentar'
  };
}

/**
 * Show error toast with retry option
 */
export function showErrorToast(
  error: unknown, 
  onRetry?: () => void,
  customMessage?: string
) {
  const details = parseError(error);
  const message = customMessage || details.message;
  
  if (details.retryable && onRetry) {
    toast.error(message, {
      action: {
        label: details.action || 'Reintentar',
        onClick: onRetry
      },
      duration: 6000
    });
  } else {
    toast.error(message, {
      duration: 5000
    });
  }
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string) {
  toast.success(message, {
    duration: 3000
  });
}

/**
 * Show loading toast that can be dismissed
 */
export function showLoadingToast(message: string) {
  return toast.loading(message);
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

export default { parseError, showErrorToast, showSuccessToast, showLoadingToast, dismissToast };
