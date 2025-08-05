import React, { ComponentType, useState, useEffect } from 'react';
import { DatabaseConnectionError } from '../../services/apiService';
import { useDatabaseConnectionContext } from '../../contexts/DatabaseConnectionContext';
import DatabaseErrorPage from './DatabaseErrorPage';

interface WithDatabaseErrorHandlingState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

interface WithDatabaseErrorHandlingProps {
  onDatabaseError?: (error: DatabaseConnectionError) => void;
  showErrorPage?: boolean;
}

// Higher-order component for database error handling
export function withDatabaseErrorHandling<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: {
    showErrorPageOnError?: boolean;
    autoRetry?: boolean;
    maxRetries?: number;
  } = {}
) {
  const {
    showErrorPageOnError = true,
    autoRetry = false,
    maxRetries = 3,
  } = options;

  return function WithDatabaseErrorHandlingComponent(
    props: P & WithDatabaseErrorHandlingProps
  ) {
    const [state, setState] = useState<WithDatabaseErrorHandlingState>({
      hasError: false,
      error: null,
      isRetrying: false,
    });

    const { retry: retryConnection, reset: resetConnection } = useDatabaseConnectionContext();
    const [retryCount, setRetryCount] = useState(0);

    // Reset error state when component mounts or props change
    useEffect(() => {
      if (state.hasError) {
        setState({
          hasError: false,
          error: null,
          isRetrying: false,
        });
        setRetryCount(0);
      }
    }, [props]);

    // Auto-retry logic
    useEffect(() => {
      if (state.hasError && autoRetry && retryCount < maxRetries) {
        const timer = setTimeout(() => {
          handleRetry();
        }, 2000 * Math.pow(2, retryCount)); // Exponential backoff

        return () => clearTimeout(timer);
      }
    }, [state.hasError, autoRetry, retryCount, maxRetries]);

    const handleError = (error: Error) => {
      const isDatabaseError = 
        error instanceof DatabaseConnectionError ||
        (error as any)?.isDatabaseError === true;

      setState({
        hasError: true,
        error,
        isRetrying: false,
      });

      if (isDatabaseError && props.onDatabaseError) {
        props.onDatabaseError(error as DatabaseConnectionError);
      }
    };

    const handleRetry = async () => {
      setState(prev => ({ ...prev, isRetrying: true }));
      setRetryCount(prev => prev + 1);

      try {
        await retryConnection();
        setState({
          hasError: false,
          error: null,
          isRetrying: false,
        });
        setRetryCount(0);
      } catch (error) {
        setState(prev => ({
          ...prev,
          isRetrying: false,
        }));
      }
    };

    const handleReset = () => {
      setState({
        hasError: false,
        error: null,
        isRetrying: false,
      });
      setRetryCount(0);
      resetConnection();
    };

    // If there's a database error and we should show the error page
    if (state.hasError && showErrorPageOnError) {
      const isDatabaseError = 
        state.error instanceof DatabaseConnectionError ||
        (state.error as any)?.isDatabaseError === true;

      if (isDatabaseError) {
        return (
          <DatabaseErrorPage
            error={state.error}
            onRetry={handleRetry}
            isRetrying={state.isRetrying}
          />
        );
      }
    }

    // Enhance the wrapped component with error handling props
    const enhancedProps = {
      ...props,
      onError: handleError,
      hasError: state.hasError,
      error: state.error,
      isRetrying: state.isRetrying,
      onRetry: handleRetry,
      onReset: handleReset,
    };

    return <WrappedComponent {...enhancedProps} />;
  };
}

// Hook for manual error handling in functional components
export const useDatabaseErrorHandler = () => {
  const [state, setState] = useState<WithDatabaseErrorHandlingState>({
    hasError: false,
    error: null,
    isRetrying: false,
  });

  const { retry: retryConnection, reset: resetConnection } = useDatabaseConnectionContext();

  const handleError = (error: Error) => {
    setState({
      hasError: true,
      error,
      isRetrying: false,
    });
  };

  const handleRetry = async () => {
    setState(prev => ({ ...prev, isRetrying: true }));

    try {
      await retryConnection();
      setState({
        hasError: false,
        error: null,
        isRetrying: false,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRetrying: false,
      }));
    }
  };

  const handleReset = () => {
    setState({
      hasError: false,
      error: null,
      isRetrying: false,
    });
    resetConnection();
  };

  return {
    ...state,
    handleError,
    handleRetry,
    handleReset,
  };
};
