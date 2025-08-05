import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { projectGroupService } from '../services';
import { DatabaseConnectionError } from '../services/apiService';
import { ProjectGroup, CreateInput, UpdateInput } from '../types';

export const useProjectGroups = () => {
  const { state, dispatch } = useAppContext();

  // Get all project groups
  const fetchProjectGroups = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'projectGroups', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'projectGroups', error: null } });

    try {
      const projectGroups = await projectGroupService.getProjectGroups();
      dispatch({ type: 'SET_PROJECT_GROUPS', payload: projectGroups });
    } catch (error) {
      // If it's a database connection error, throw it to be caught by error boundary
      if (error instanceof DatabaseConnectionError || (error as any)?.isDatabaseError) {
        dispatch({ type: 'SET_LOADING', payload: { key: 'projectGroups', loading: false } });
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project groups';
      dispatch({ type: 'SET_ERROR', payload: { key: 'projectGroups', error: errorMessage } });
      dispatch({ type: 'SET_LOADING', payload: { key: 'projectGroups', loading: false } });
    }
  }, [dispatch]);

  // Create project group
  const createProjectGroup = useCallback(async (groupData: CreateInput<ProjectGroup>) => {
    try {
      const newGroup = await projectGroupService.createProjectGroup(groupData);
      dispatch({ type: 'ADD_PROJECT_GROUP', payload: newGroup });
      return newGroup;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project group';
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  // Update project group
  const updateProjectGroup = useCallback(async (id: string, groupData: UpdateInput<ProjectGroup>) => {
    try {
      const updatedGroup = await projectGroupService.updateProjectGroup(id, groupData);
      dispatch({ type: 'UPDATE_PROJECT_GROUP', payload: updatedGroup });
      return updatedGroup;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project group';
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  // Delete project group
  const deleteProjectGroup = useCallback(async (id: string) => {
    try {
      await projectGroupService.deleteProjectGroup(id);
      dispatch({ type: 'DELETE_PROJECT_GROUP', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project group';
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  // Get project group by ID
  const getProjectGroup = useCallback((id: string): ProjectGroup | undefined => {
    return state.projectGroups.find(group => group.id === id);
  }, [state.projectGroups]);

  return {
    projectGroups: state.projectGroups,
    loading: state.loading.projectGroups,
    error: state.error.projectGroups,
    fetchProjectGroups,
    createProjectGroup,
    updateProjectGroup,
    deleteProjectGroup,
    getProjectGroup,
  };
};
