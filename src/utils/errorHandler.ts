import { useNotification } from '../contexts/NotificationContext';

export interface ErrorDetails {
  title: string;
  message: string;
  actionable?: string;
  technical?: string;
}

export interface ApiError {
  status?: number;
  message?: string;
  error?: string;
  details?: string;
  code?: string;
}

/**
 * Enhanced error handler that provides user-friendly error messages
 * with actionable guidance and technical details when appropriate
 */
export class ErrorHandler {
  private showError: (title: string, message?: string) => void;
  private showWarning: (title: string, message?: string) => void;

  constructor(notificationHooks: { showError: (title: string, message?: string) => void; showWarning: (title: string, message?: string) => void }) {
    this.showError = notificationHooks.showError;
    this.showWarning = notificationHooks.showWarning;
  }

  /**
   * Handle API errors with enhanced user-friendly messages
   */
  handleApiError(error: any, context?: string): ErrorDetails {
    const errorDetails = this.parseApiError(error);
    const enhancedError = this.enhanceErrorMessage(errorDetails, context);
    
    // Show notification
    if (enhancedError.actionable) {
      this.showError(enhancedError.title, `${enhancedError.message}\n\n${enhancedError.actionable}`);
    } else {
      this.showError(enhancedError.title, enhancedError.message);
    }

    return enhancedError;
  }

  /**
   * Handle validation errors with specific field guidance
   */
  handleValidationError(errors: Record<string, string[]>, context?: string): void {
    const fieldErrors = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');

    this.showError(
      'Validation Error',
      `Please check the following fields:\n${fieldErrors}`
    );
  }

  /**
   * Handle network errors with connectivity guidance
   */
  handleNetworkError(error: any, context?: string): ErrorDetails {
    const errorDetails: ErrorDetails = {
      title: 'Connection Error',
      message: 'Unable to connect to the server',
      actionable: 'Please check your internet connection and try again. If the problem persists, contact your system administrator.'
    };

    this.showError(errorDetails.title, `${errorDetails.message}\n\n${errorDetails.actionable}`);
    return errorDetails;
  }

  /**
   * Handle permission errors with clear guidance
   */
  handlePermissionError(context?: string): ErrorDetails {
    const errorDetails: ErrorDetails = {
      title: 'Access Denied',
      message: 'You do not have permission to perform this action',
      actionable: 'Please contact your administrator if you believe you should have access to this feature.'
    };

    this.showWarning(errorDetails.title, `${errorDetails.message}\n\n${errorDetails.actionable}`);
    return errorDetails;
  }

  /**
   * Parse API error response into structured format
   */
  private parseApiError(error: any): ApiError {
    if (error?.response?.data) {
      return {
        status: error.response.status,
        message: error.response.data.message || error.response.data.error,
        error: error.response.data.error,
        details: error.response.data.details,
        code: error.response.data.code
      };
    }

    if (error?.message) {
      return { message: error.message };
    }

    return { message: 'An unexpected error occurred' };
  }

  /**
   * Enhance error messages with user-friendly explanations and actionable guidance
   */
  private enhanceErrorMessage(apiError: ApiError, context?: string): ErrorDetails {
    const status = apiError.status;
    const message = apiError.message || apiError.error || 'Unknown error';

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: 'The request contains invalid data',
          actionable: 'Please check all required fields and ensure the data is in the correct format.'
        };

      case 401:
        return {
          title: 'Authentication Required',
          message: 'Your session has expired',
          actionable: 'Please log in again to continue.'
        };

      case 403:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to perform this action',
          actionable: 'Contact your administrator if you believe you should have access.'
        };

      case 404:
        return {
          title: 'Not Found',
          message: context ? `The requested ${context} was not found` : 'The requested resource was not found',
          actionable: 'Please verify the item exists and try again.'
        };

      case 409:
        return {
          title: 'Conflict',
          message: 'This action conflicts with existing data',
          actionable: 'Please check for duplicate entries or conflicting information.'
        };

      case 422:
        return {
          title: 'Validation Error',
          message: 'The submitted data failed validation',
          actionable: 'Please check all required fields and ensure the data meets the specified requirements.'
        };

      case 500:
        return {
          title: 'Server Error',
          message: 'An internal server error occurred',
          actionable: 'Please try again in a few moments. If the problem persists, contact support.',
          technical: message
        };

      case 503:
        return {
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable',
          actionable: 'Please try again in a few minutes.'
        };

      default:
        // Handle specific error messages
        if (message.includes('violates check constraint')) {
          return {
            title: 'Data Validation Error',
            message: 'The submitted data does not meet the required constraints',
            actionable: 'Please check that all fields contain valid values according to the specified requirements.'
          };
        }

        if (message.includes('duplicate key')) {
          return {
            title: 'Duplicate Entry',
            message: 'An item with this information already exists',
            actionable: 'Please use a different name or identifier.'
          };
        }

        if (message.includes('foreign key')) {
          return {
            title: 'Reference Error',
            message: 'This action references data that no longer exists',
            actionable: 'Please refresh the page and try again.'
          };
        }

        return {
          title: context ? `${context} Error` : 'Error',
          message: message,
          actionable: 'Please try again. If the problem persists, contact support.'
        };
    }
  }
}

/**
 * Hook to get an enhanced error handler instance
 */
export const useErrorHandler = () => {
  const { showError, showWarning } = useNotification();
  
  return new ErrorHandler({ showError, showWarning });
};

/**
 * Utility function to handle common async operation errors
 */
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  errorHandler: ErrorHandler,
  context?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error: any) {
    if (error?.response?.status === 401) {
      // Handle authentication errors specially
      window.location.href = '/login';
      return null;
    }

    if (error?.code === 'NETWORK_ERROR' || !error?.response) {
      errorHandler.handleNetworkError(error, context);
    } else {
      errorHandler.handleApiError(error, context);
    }

    return null;
  }
};
