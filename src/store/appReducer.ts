import { AppState, AppAction } from '../types';

export const initialState: AppState = {
  projects: [],
  deployments: [],
  projectGroups: [],
  engineers: [],
  services: [],
  scripts: [],
  deploymentServices: [],
  loading: {
    projects: false,
    deployments: false,
    projectGroups: false,
    engineers: false,
    services: false,
  },
  error: {
    projects: null,
    deployments: null,
    projectGroups: null,
    engineers: null,
    services: null,
  },
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Loading and error actions
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: {
          ...state.error,
          [action.payload.key]: action.payload.error,
        },
      };

    // Project actions
    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.payload,
        loading: { ...state.loading, projects: false },
        error: { ...state.error, projects: null },
      };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
      };

    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
      };

    // Deployment actions
    case 'SET_DEPLOYMENTS':
      return {
        ...state,
        deployments: action.payload,
        loading: { ...state.loading, deployments: false },
        error: { ...state.error, deployments: null },
      };

    case 'ADD_DEPLOYMENT':
      return {
        ...state,
        deployments: [...state.deployments, action.payload],
      };

    case 'UPDATE_DEPLOYMENT':
      return {
        ...state,
        deployments: state.deployments.map(deployment =>
          deployment.id === action.payload.id ? action.payload : deployment
        ),
      };

    case 'DELETE_DEPLOYMENT':
      return {
        ...state,
        deployments: state.deployments.filter(deployment => deployment.id !== action.payload),
      };

    // Project Group actions
    case 'SET_PROJECT_GROUPS':
      return {
        ...state,
        projectGroups: action.payload,
        loading: { ...state.loading, projectGroups: false },
        error: { ...state.error, projectGroups: null },
      };

    case 'ADD_PROJECT_GROUP':
      return {
        ...state,
        projectGroups: [...state.projectGroups, action.payload],
      };

    case 'UPDATE_PROJECT_GROUP':
      return {
        ...state,
        projectGroups: state.projectGroups.map(group =>
          group.id === action.payload.id ? action.payload : group
        ),
      };

    case 'DELETE_PROJECT_GROUP':
      return {
        ...state,
        projectGroups: state.projectGroups.filter(group => group.id !== action.payload),
      };

    // Engineer actions
    case 'SET_ENGINEERS':
      return {
        ...state,
        engineers: action.payload,
        loading: { ...state.loading, engineers: false },
        error: { ...state.error, engineers: null },
      };

    // Service actions
    case 'SET_SERVICES':
      return {
        ...state,
        services: action.payload,
        loading: { ...state.loading, services: false },
        error: { ...state.error, services: null },
      };

    // Script actions
    case 'SET_SCRIPTS':
      return {
        ...state,
        scripts: action.payload,
      };

    // Deployment Service actions
    case 'SET_DEPLOYMENT_SERVICES':
      return {
        ...state,
        deploymentServices: action.payload,
      };

    default:
      return state;
  }
}
