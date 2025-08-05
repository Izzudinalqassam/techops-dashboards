import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { apiService, DatabaseConnectionError } from '../services/apiService';
import { API_ENDPOINTS } from '../config/api';
import { Engineer } from '../types';

export const useEngineers = () => {
  const { state, dispatch } = useAppContext();

  // Get all engineers
  const fetchEngineers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'engineers', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'engineers', error: null } });

    try {
      const engineers = await apiService.get<Engineer[]>(API_ENDPOINTS.ENGINEERS);
      dispatch({ type: 'SET_ENGINEERS', payload: engineers });
    } catch (error) {
      // If it's a database connection error, throw it to be caught by error boundary
      if (error instanceof DatabaseConnectionError || (error as any)?.isDatabaseError) {
        dispatch({ type: 'SET_LOADING', payload: { key: 'engineers', loading: false } });
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch engineers';
      dispatch({ type: 'SET_ERROR', payload: { key: 'engineers', error: errorMessage } });
      dispatch({ type: 'SET_LOADING', payload: { key: 'engineers', loading: false } });
    }
  }, [dispatch]);

  // Get engineer by ID
  const getEngineer = useCallback((id: string): Engineer | undefined => {
    return state.engineers.find(engineer => engineer.id === id);
  }, [state.engineers]);

  // Get engineers by role
  const getEngineersByRole = useCallback((role: string): Engineer[] => {
    return state.engineers.filter(engineer => engineer.role === role);
  }, [state.engineers]);

  return {
    engineers: state.engineers,
    loading: state.loading.engineers,
    error: state.error.engineers,
    fetchEngineers,
    getEngineer,
    getEngineersByRole,
  };
};
