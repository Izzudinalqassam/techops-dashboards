import React, { Component, ErrorInfo, ReactNode } from "react";
import { DatabaseConnectionError } from "../../services/apiService";
import DatabaseErrorPage from "./DatabaseErrorPage";

interface DatabaseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isDatabaseError: boolean;
  isRetrying: boolean;
  retryCount: number;
}

interface DatabaseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

class DatabaseErrorBoundary extends Component<
  DatabaseErrorBoundaryProps,
  DatabaseErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: DatabaseErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isDatabaseError: false,
      isRetrying: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<DatabaseErrorBoundaryState> {
    const isDatabaseError =
      error instanceof DatabaseConnectionError ||
      (error as any)?.isDatabaseError === true ||
      error.message?.toLowerCase().includes("database") ||
      error.message?.toLowerCase().includes("connection") ||
      error.message?.toLowerCase().includes("network");

    return {
      hasError: true,
      error,
      isDatabaseError,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn("Maximum retry attempts reached");
      return;
    }

    this.setState({
      isRetrying: true,
      retryCount: retryCount + 1,
    });

    // Simulate retry delay
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        isDatabaseError: false,
        isRetrying: false,
      });
    }, 2000); // 2 second delay to show retry state
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      isDatabaseError: false,
      isRetrying: false,
      retryCount: 0,
    });
  };

  render() {
    const { hasError, error, isDatabaseError, isRetrying } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // If it's a database error, show the specialized database error page
      if (isDatabaseError) {
        return (
          <DatabaseErrorPage
            error={error}
            onRetry={this.handleRetry}
            isRetrying={isRetrying}
          />
        );
      }

      // For other errors, use the fallback or a generic error message
      if (fallback) {
        return fallback;
      }

      // Generic error fallback
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default DatabaseErrorBoundary;
