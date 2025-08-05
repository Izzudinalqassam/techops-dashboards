import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, DatabaseConnectionError } from '../services/apiService';
import { API_ENDPOINTS } from '../config/api';

export interface DatabaseConnectionState {
  isConnected: boolean;
  isChecking: boolean;
  lastError: Error | null;
  lastChecked: Date | null;
  retryCount: number;
}

export interface DatabaseConnectionActions {
  checkConnection: () => Promise<boolean>;
  retry: () => Promise<boolean>;
  reset: () => void;
}

interface UseDatabaseConnectionOptions {
  autoCheck?: boolean;
  checkInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export const useDatabaseConnection = (
  options: UseDatabaseConnectionOptions = {}
): DatabaseConnectionState & DatabaseConnectionActions => {
  const {
    autoCheck = false, // Disabled auto-check to prevent unwanted refreshes
    checkInterval = 30000, // 30 seconds
    maxRetries = 3,
    retryDelay = 2000, // 2 seconds
  } = options;

  const [state, setState] = useState<DatabaseConnectionState>({
    isConnected: true, // Assume connected initially
    isChecking: false,
    lastError: null,
    lastChecked: null,
    retryCount: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check database connection by making a lightweight API call
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      // Make a simple health check request
      // You can replace this with a dedicated health check endpoint
      await apiService.get(API_ENDPOINTS.PROJECT_GROUPS, { timeout: 5000 });

      setState(prev => ({
        ...prev,
        isConnected: true,
        isChecking: false,
        lastError: null,
        lastChecked: new Date(),
        retryCount: 0,
      }));

      return true;
    } catch (error) {
      const isDbError = error instanceof DatabaseConnectionError ||
                       (error as any)?.isDatabaseError === true ||
                       error instanceof TypeError && error.message.includes('fetch') ||
                       (error as any)?.code === 'ECONNREFUSED' ||
                       (error as any)?.code === 'ETIMEDOUT';

      setState(prev => ({
        ...prev,
        isConnected: false,
        isChecking: false,
        lastError: error as Error,
        lastChecked: new Date(),
        retryCount: isDbError ? prev.retryCount : 0,
      }));

      return false;
    }
  }, []);

  // Retry connection with exponential backoff
  const retry = useCallback(async (): Promise<boolean> => {
    if (state.retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached for database connection');
      return false;
    }

    setState(prev => ({ 
      ...prev, 
      retryCount: prev.retryCount + 1,
      isChecking: true 
    }));

    // Wait before retrying
    await new Promise(resolve => {
      retryTimeoutRef.current = setTimeout(resolve, retryDelay * Math.pow(2, state.retryCount));
    });

    return await checkConnection();
  }, [checkConnection, maxRetries, retryDelay, state.retryCount]);

  // Reset connection state
  const reset = useCallback(() => {
    setState({
      isConnected: true,
      isChecking: false,
      lastError: null,
      lastChecked: null,
      retryCount: 0,
    });
  }, []);

  // Set up automatic connection checking
  useEffect(() => {
    if (!autoCheck) return;

    // Initial check
    checkConnection();

    // Set up interval checking
    intervalRef.current = setInterval(checkConnection, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [autoCheck, checkInterval, checkConnection]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored, checking database...');
      checkConnection();
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      setState(prev => ({
        ...prev,
        isConnected: false,
        lastError: new Error('Network connection lost'),
        lastChecked: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    checkConnection,
    retry,
    reset,
  };
};
