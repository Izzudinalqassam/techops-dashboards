import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { projectService } from '../services';
import { DatabaseConnectionError } from '../services/apiService';
import { Project, CreateInput, UpdateInput } from '../types';

export const useProjects = () => {
  const { state, dispatch } = useAppContext();

  // Get all projects
  const fetchProjects = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'projects', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'projects', error: null } });

    try {
      const projects = await projectService.getProjects();
      dispatch({ type: 'SET_PROJECTS', payload: projects });
    } catch (error) {
      // If it's a database connection error, throw it to be caught by error boundary
      if (error instanceof DatabaseConnectionError || (error as any)?.isDatabaseError) {
        dispatch({ type: 'SET_LOADING', payload: { key: 'projects', loading: false } });
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      dispatch({ type: 'SET_ERROR', payload: { key: 'projects', error: errorMessage } });
      dispatch({ type: 'SET_LOADING', payload: { key: 'projects', loading: false } });
    }
  }, [dispatch]);

  // Create project
  const createProject = useCallback(async (projectData: CreateInput<Project>) => {
    try {
      const newProject = await projectService.createProject(projectData);
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      return newProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  // Update project
  const updateProject = useCallback(async (id: string, projectData: UpdateInput<Project>) => {
    try {
      const updatedProject = await projectService.updateProject(id, projectData);
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
      return updatedProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    try {
      await projectService.deleteProject(id);
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    } catch (error: any) {
      console.error('Delete project error in hook:', error);
      
      // Preserve the original error with all its properties (including status)
      if (error.status || error.response) {
        throw error; // Re-throw the original API error
      } else {
        // For non-API errors, create a new error with a generic message
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
        throw new Error(errorMessage);
      }
    }
  }, [dispatch]);

  // Get project by ID
  const getProject = useCallback((id: string): Project | undefined => {
    return state.projects.find(project => project.id === id);
  }, [state.projects]);

  // Get projects by group
  const getProjectsByGroup = useCallback((groupId: string): Project[] => {
    return state.projects.filter(project => project.groupId === groupId);
  }, [state.projects]);

  // Get projects by engineer
  const getProjectsByEngineer = useCallback((engineerId: string): Project[] => {
    return state.projects.filter(project => project.engineerId === engineerId);
  }, [state.projects]);

  return {
    projects: state.projects,
    loading: state.loading.projects,
    error: state.error.projects,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    getProjectsByGroup,
    getProjectsByEngineer,
  };
};
