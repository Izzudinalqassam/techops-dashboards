import React, { useEffect, useState } from 'react';
import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { useDatabaseConnectionContext } from '../../contexts/DatabaseConnectionContext';
import DatabaseErrorPage from '../error/DatabaseErrorPage';

interface DatabaseAwareLoaderProps {
  isLoading: boolean;
  hasError: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  minLoadingTime?: number; // Minimum time to show loading (prevents flashing)
}

const DatabaseAwareLoader: React.FC<DatabaseAwareLoaderProps> = ({
  isLoading,
  hasError,
  error,
  children,
  loadingMessage = 'Loading data...',
  minLoadingTime = 500, // 500ms minimum loading time
}) => {
  const { isConnected, isChecking, lastError, retry } = useDatabaseConnectionContext();
  const [showLoading, setShowLoading] = useState(isLoading);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  // Track loading start time for minimum loading duration
  useEffect(() => {
    if (isLoading && !loadingStartTime) {
      setLoadingStartTime(Date.now());
      setShowLoading(true);
    } else if (!isLoading && loadingStartTime) {
      const elapsed = Date.now() - loadingStartTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);
      
      if (remaining > 0) {
        setTimeout(() => {
          setShowLoading(false);
          setLoadingStartTime(null);
        }, remaining);
      } else {
        setShowLoading(false);
        setLoadingStartTime(null);
      }
    }
  }, [isLoading, loadingStartTime, minLoadingTime]);

  // If database is disconnected, show database error page
  if (!isConnected && !isChecking) {
    return (
      <DatabaseErrorPage
        error={lastError || new Error('Database connection lost')}
        onRetry={retry}
        isRetrying={isChecking}
      />
    );
  }

  // If there's a general error (not database-related), show error message
  if (hasError && error && isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // If loading or checking database connection, show loading state
  if (showLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isChecking ? 'Connecting to database...' : loadingMessage}
          </h2>
          <p className="text-gray-600">
            {isChecking 
              ? 'Please wait while we establish a connection'
              : 'This should only take a moment'
            }
          </p>
          
          {/* Connection status indicator */}
          <div className="mt-6 flex items-center justify-center space-x-2 text-sm">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">Connected</span>
              </>
            ) : isChecking ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-600">Connecting...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If everything is loaded and connected, show children
  return <>{children}</>;
};

export default DatabaseAwareLoader;
