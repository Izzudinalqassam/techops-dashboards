import React, { createContext, useContext, ReactNode } from "react";
import {
  useDatabaseConnection,
  DatabaseConnectionState,
  DatabaseConnectionActions,
} from "../hooks/useDatabaseConnection";

interface DatabaseConnectionContextType
  extends DatabaseConnectionState,
    DatabaseConnectionActions {
  // Additional context-specific methods can be added here
}

const DatabaseConnectionContext = createContext<
  DatabaseConnectionContextType | undefined
>(undefined);

interface DatabaseConnectionProviderProps {
  children: ReactNode;
  autoCheck?: boolean;
  checkInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export const DatabaseConnectionProvider: React.FC<
  DatabaseConnectionProviderProps
> = ({
  children,
  autoCheck = false, // Disabled auto-check to prevent unwanted refreshes
  checkInterval = 30000,
  maxRetries = 3,
  retryDelay = 2000,
}) => {
  const connectionState = useDatabaseConnection({
    autoCheck,
    checkInterval,
    maxRetries,
    retryDelay,
  });

  return (
    <DatabaseConnectionContext.Provider value={connectionState}>
      {children}
    </DatabaseConnectionContext.Provider>
  );
};

export const useDatabaseConnectionContext =
  (): DatabaseConnectionContextType => {
    const context = useContext(DatabaseConnectionContext);
    if (context === undefined) {
      throw new Error(
        "useDatabaseConnectionContext must be used within a DatabaseConnectionProvider"
      );
    }
    return context;
  };

// Optional: Hook to check if database connection is available
export const useIsDatabaseConnected = (): boolean => {
  const { isConnected } = useDatabaseConnectionContext();
  return isConnected;
};

// Optional: Hook to get database connection status with loading state
export const useDatabaseStatus = () => {
  const { isConnected, isChecking, lastError, lastChecked, retryCount } =
    useDatabaseConnectionContext();

  return {
    isConnected,
    isChecking,
    hasError: !!lastError,
    error: lastError,
    lastChecked,
    retryCount,
    status: isChecking
      ? "checking"
      : isConnected
      ? "connected"
      : "disconnected",
  };
};
