import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Button from '../ui/Button';

interface DatabaseErrorPageProps {
  onRetry?: () => void;
  error?: Error;
  isRetrying?: boolean;
}

const DatabaseErrorPage: React.FC<DatabaseErrorPageProps> = ({
  onRetry,
  error,
  isRetrying = false
}) => {
  const handleRetry = () => {
    if (onRetry && !isRetrying) {
      onRetry();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRetry();
    }
  };

  return (
    <main 
      className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="max-w-md w-full space-y-8">
        <section className="text-center" aria-labelledby="error-title">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
            <WifiOff 
              className="h-10 w-10 text-red-600" 
              aria-hidden="true"
            />
          </div>

          {/* Error Title */}
          <h1 
            id="error-title"
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            Connection Problem
          </h1>

          {/* Error Description */}
          <div className="space-y-3 mb-8">
            <p className="text-gray-600 text-base leading-relaxed">
              We're having trouble connecting to our servers. This might be due to:
            </p>
            
            <ul 
              className="text-sm text-gray-500 space-y-1 text-left bg-gray-100 rounded-lg p-4"
              role="list"
            >
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0" aria-hidden="true"></span>
                <span>Temporary server maintenance</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0" aria-hidden="true"></span>
                <span>Network connectivity issues</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0" aria-hidden="true"></span>
                <span>Database service interruption</span>
              </li>
            </ul>

            <p className="text-gray-600 text-sm">
              Please try again in a few moments. If the problem persists, contact support.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleRetry}
              onKeyDown={handleKeyDown}
              disabled={isRetrying}
              className="w-full flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-describedby="retry-description"
            >
              {isRetrying ? (
                <>
                  <RefreshCw 
                    className="animate-spin -ml-1 mr-3 h-5 w-5" 
                    aria-hidden="true"
                  />
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <RefreshCw 
                    className="-ml-1 mr-3 h-5 w-5" 
                    aria-hidden="true"
                  />
                  <span>Try Again</span>
                </>
              )}
            </Button>

            <p 
              id="retry-description" 
              className="text-xs text-gray-500"
            >
              Click to attempt reconnection to the database
            </p>

            {/* Connection Status Indicator */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Wifi className="h-4 w-4" aria-hidden="true" />
              <span>Checking connection status...</span>
            </div>
          </div>

          {/* Technical Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto">
                <p><strong>Error:</strong> {error.name}</p>
                <p><strong>Message:</strong> {error.message}</p>
                {error.stack && (
                  <div className="mt-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </section>

        {/* Screen Reader Instructions */}
        <div className="sr-only">
          <p>
            This page indicates a database connection problem. 
            Use the "Try Again" button to attempt reconnection, 
            or contact support if the issue persists.
          </p>
        </div>
      </div>
    </main>
  );
};

export default DatabaseErrorPage;
