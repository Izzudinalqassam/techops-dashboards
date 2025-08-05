import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { deploymentService } from '../services';
import { DatabaseConnectionError } from '../services/apiService';
import { Deployment, CreateInput, UpdateInput, CreateDeploymentInput } from '../types';

export const useDeployments = () => {
  const { state, dispatch } = useAppContext();

  // Get all deployments
  const fetchDeployments = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'deployments', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'deployments', error: null } });

    try {
      const deployments = await deploymentService.getDeployments();
      dispatch({ type: 'SET_DEPLOYMENTS', payload: deployments });
    } catch (error) {
      // If it's a database connection error, throw it to be caught by error boundary
      if (error instanceof DatabaseConnectionError || (error as any)?.isDatabaseError) {
        dispatch({ type: 'SET_LOADING', payload: { key: 'deployments', loading: false } });
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch deployments';
      dispatch({ type: 'SET_ERROR', payload: { key: 'deployments', error: errorMessage } });
      dispatch({ type: 'SET_LOADING', payload: { key: 'deployments', loading: false } });
    }
  }, [dispatch]);

  // Create deployment
  const createDeployment = useCallback(async (deploymentData: CreateDeploymentInput) => {
    try {
      const newDeployment = await deploymentService.createDeployment(deploymentData);
      dispatch({ type: 'ADD_DEPLOYMENT', payload: newDeployment });
      return newDeployment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create deployment';
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  // Update deployment
  const updateDeployment = useCallback(async (id: string, deploymentData: UpdateInput<Deployment>) => {
    try {
      const updatedDeployment = await deploymentService.updateDeployment(id, deploymentData);
      dispatch({ type: 'UPDATE_DEPLOYMENT', payload: updatedDeployment });
      return updatedDeployment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update deployment';
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  // Delete deployment
  const deleteDeployment = useCallback(async (id: string) => {
    try {
      await deploymentService.deleteDeployment(id);
      dispatch({ type: 'DELETE_DEPLOYMENT', payload: id });
    } catch (error: any) {
      console.error('Delete deployment error in hook:', error);
      
      // Preserve the original error with all its properties (including status)
      if (error.status || error.response) {
        throw error; // Re-throw the original API error
      } else {
        // For non-API errors, create a new error with a generic message
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete deployment';
        throw new Error(errorMessage);
      }
    }
  }, [dispatch]);

  // Get deployment by ID
  const getDeployment = useCallback((id: string): Deployment | undefined => {
    return state.deployments.find(deployment => deployment.id === id);
  }, [state.deployments]);

  // Get deployments by project
  const getDeploymentsByProject = useCallback((projectId: string): Deployment[] => {
    return state.deployments.filter(deployment => deployment.projectId === projectId);
  }, [state.deployments]);

  // Get deployments by engineer
  const getDeploymentsByEngineer = useCallback((engineerId: string): Deployment[] => {
    return state.deployments.filter(deployment => deployment.engineerId === engineerId);
  }, [state.deployments]);

  // Get deployments by status
  const getDeploymentsByStatus = useCallback((status: Deployment['status']): Deployment[] => {
    return state.deployments.filter(deployment => deployment.status === status);
  }, [state.deployments]);

  return {
    deployments: state.deployments,
    loading: state.loading.deployments,
    error: state.error.deployments,
    fetchDeployments,
    createDeployment,
    updateDeployment,
    deleteDeployment,
    getDeployment,
    getDeploymentsByProject,
    getDeploymentsByEngineer,
    getDeploymentsByStatus,
  };
};
