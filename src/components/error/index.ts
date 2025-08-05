// Error handling components and utilities
export { default as DatabaseErrorPage } from './DatabaseErrorPage';
export { default as DatabaseErrorBoundary } from './DatabaseErrorBoundary';
export { withDatabaseErrorHandling, useDatabaseErrorHandler } from './withDatabaseErrorHandling';

// Re-export database connection utilities
export { DatabaseConnectionError } from '../../services/apiService';
export { useDatabaseConnection } from '../../hooks/useDatabaseConnection';
export { 
  DatabaseConnectionProvider, 
  useDatabaseConnectionContext,
  useIsDatabaseConnected,
  useDatabaseStatus 
} from '../../contexts/DatabaseConnectionContext';
